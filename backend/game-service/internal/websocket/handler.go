package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/snake-game/game-service/internal/game"
	"github.com/snake-game/game-service/pkg/models"
)

// Handler manages WebSocket connections and game state
// It maintains a map of active connections to their respective game instances
// and handles the lifecycle of each game session
type Handler struct {
	clients    map[*websocket.Conn]*game.Game // Maps each connection to its game instance
	register   chan *websocket.Conn           // Channel for new client registrations
	unregister chan *websocket.Conn           // Channel for client disconnections
	mutex      sync.RWMutex                   // Mutex for thread-safe access to clients map
	config     models.GameConfig              // Game configuration shared by all instances
}

// NewHandler creates a new WebSocket handler
// It initializes the channels and maps needed for connection management
func NewHandler(config models.GameConfig) *Handler {
	return &Handler{
		clients:    make(map[*websocket.Conn]*game.Game), // Initialize empty clients map
		register:   make(chan *websocket.Conn),           // Channel for handling new connections
		unregister: make(chan *websocket.Conn),           // Channel for handling disconnections
		config:     config,                               // Store shared game configuration
	}
}

// Run starts the WebSocket handler's main loop
// This method runs in its own goroutine and handles:
// - New client connections
// - Client disconnections
// - Regular game state updates
func (h *Handler) Run() {
	ticker := time.NewTicker(time.Millisecond * time.Duration(h.config.Speed))
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.handleRegister(client)
		case client := <-h.unregister:
			h.handleUnregister(client)
		case <-ticker.C:
			h.updateGames() // Update all active games on each tick
		}
	}
}

// handleRegister registers a new WebSocket connection
// Creates a new game instance for the client and adds it to the active clients map
func (h *Handler) handleRegister(conn *websocket.Conn) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Create new game instance for client with shared configuration
	h.clients[conn] = game.NewGame(h.config)
	log.Printf("Client connected. Total clients: %d", len(h.clients))
}

// handleUnregister removes a WebSocket connection
// Cleans up the game instance and removes the client from the active clients map
func (h *Handler) handleUnregister(conn *websocket.Conn) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if _, ok := h.clients[conn]; ok {
		delete(h.clients, conn) // Remove client from active games
		conn.Close()            // Close the WebSocket connection
		log.Printf("Client disconnected. Total clients: %d", len(h.clients))
	}
}

// updateGames updates all active games and sends their states to clients
// This is called on each game tick to advance the game state
func (h *Handler) updateGames() {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for conn, game := range h.clients {
		game.Update() // Update game state

		// Send updated state to client
		if err := conn.WriteJSON(game.GetState()); err != nil {
			log.Printf("Error sending state to client: %v", err)
			h.unregister <- conn // Schedule client for disconnection on error
		}
	}
}

// HandleDirection processes a direction change request from a client
// Validates and applies the direction change to the appropriate game instance
func (h *Handler) HandleDirection(conn *websocket.Conn, msg []byte) error {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	// Find the game instance for this connection
	game, exists := h.clients[conn]
	if !exists {
		return fmt.Errorf("no game found for connection")
	}

	// Parse the direction from the message
	var dir struct {
		Direction string `json:"direction"`
	}
	if err := json.Unmarshal(msg, &dir); err != nil {
		return fmt.Errorf("invalid direction message: %v", err)
	}

	// Update the game's direction
	game.SetDirection(models.Direction(dir.Direction))
	return nil
}

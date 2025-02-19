package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/snake-game/game-service/internal/game"
	"github.com/snake-game/game-service/pkg/models"
)

// Handler manages WebSocket connections and game state
type Handler struct {
	clients    map[*websocket.Conn]*game.Game
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mutex      sync.RWMutex
	config     models.GameConfig
}

// NewHandler creates a new WebSocket handler
func NewHandler(config models.GameConfig) *Handler {
	return &Handler{
		clients:    make(map[*websocket.Conn]*game.Game),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		config:     config,
	}
}

// Run starts the WebSocket handler
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
			h.updateGames()
		}
	}
}

// handleRegister registers a new WebSocket connection
func (h *Handler) handleRegister(conn *websocket.Conn) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Create new game instance for client
	h.clients[conn] = game.NewGame(h.config)
	log.Printf("Client connected. Total clients: %d", len(h.clients))
}

// handleUnregister removes a WebSocket connection
func (h *Handler) handleUnregister(conn *websocket.Conn) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if _, ok := h.clients[conn]; ok {
		delete(h.clients, conn)
		conn.Close()
		log.Printf("Client disconnected. Total clients: %d", len(h.clients))
	}
}

// updateGames updates all active games and sends states to clients
func (h *Handler) updateGames() {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for conn, game := range h.clients {
		game.Update()
		state := game.GetState()

		err := conn.WriteJSON(state)
		if err != nil {
			log.Printf("Error sending game state: %v", err)
			h.unregister <- conn
			continue
		}
	}
}

// HandleDirection processes direction updates from clients
func (h *Handler) HandleDirection(conn *websocket.Conn, msg []byte) error {
	var input struct {
		Direction models.Direction `json:"direction"`
	}

	if err := json.Unmarshal(msg, &input); err != nil {
		return err
	}

	h.mutex.RLock()
	if game, ok := h.clients[conn]; ok {
		game.SetDirection(input.Direction)
	}
	h.mutex.RUnlock()

	return nil
}

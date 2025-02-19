package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/snake-game/game-service/internal/websocket"
	"github.com/snake-game/game-service/pkg/models"
)

// Server represents the game server
type Server struct {
	router  *mux.Router
	wsHandler *websocket.Handler
	config  models.GameConfig
}

// upgrader configures WebSocket connections
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

// NewServer creates a new game server instance
func NewServer(config models.GameConfig) *Server {
	s := &Server{
		router:  mux.NewRouter(),
		config:  config,
	}

	s.wsHandler = websocket.NewHandler(config)
	s.setupRoutes()
	return s
}

// setupRoutes configures the server routes
func (s *Server) setupRoutes() {
	s.router.HandleFunc("/ws", s.handleWebSocket)
	s.router.HandleFunc("/health", s.handleHealth)
}

// handleWebSocket handles WebSocket connections
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	s.wsHandler.Register <- conn

	// Handle incoming messages
	go func() {
		defer func() {
			s.wsHandler.Unregister <- conn
		}()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Error reading message: %v", err)
				}
				break
			}

			if err := s.wsHandler.HandleDirection(conn, msg); err != nil {
				log.Printf("Error handling direction: %v", err)
			}
		}
	}()
}

// handleHealth handles health check requests
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

// Start starts the server
func (s *Server) Start(port string) error {
	go s.wsHandler.Run()
	log.Printf("Server starting on %s", port)
	return http.ListenAndServe(port, s.router)
}

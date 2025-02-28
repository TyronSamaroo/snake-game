/*
Snake Game Backend Service
Created by Tyron Samaroo

A modern implementation of the classic Snake game using Go and WebSocket
*/

package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
)

// Game configuration constants
const (
	GRID_SIZE       = 20
	GAME_TICK_MS    = 200
	INITIAL_SNAKE_X = 10
	INITIAL_SNAKE_Y = 10
	MAX_ENTRIES     = 10
)

// Direction constants
const (
	UP    = "UP"
	DOWN  = "DOWN"
	LEFT  = "LEFT"
	RIGHT = "RIGHT"
)

// Point represents a position on the game grid
type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// GameState holds the current state of the game
type GameState struct {
	Snake     []Point `json:"snake"`
	Food      Point   `json:"food"`
	Score     int     `json:"score"`
	GameOver  bool    `json:"gameOver"`
	Direction string  `json:"direction"`
}

// ScoreEntry represents a leaderboard entry
type ScoreEntry struct {
	PlayerName string    `json:"playerName"`
	Score      int       `json:"score"`
	Date       time.Time `json:"date"`
}

// Game represents a single game instance
type Game struct {
	state    GameState
	mutex    sync.RWMutex
	ticker   *time.Ticker
	stopChan chan struct{}
	conn     *websocket.Conn
}

// Leaderboard represents the game's leaderboard
type Leaderboard struct {
	db    *sql.DB
	mutex sync.RWMutex
}

// WebSocket configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

var leaderboard *Leaderboard

// Game methods
func newGame(conn *websocket.Conn) *Game {
	return &Game{
		state: GameState{
			Snake:     []Point{{X: INITIAL_SNAKE_X, Y: INITIAL_SNAKE_Y}},
			Food:      generateFood(),
			Score:     0,
			GameOver:  false,
			Direction: RIGHT,
		},
		conn:     conn,
		stopChan: make(chan struct{}),
	}
}

func generateFood() Point {
	return Point{
		X: rand.Intn(GRID_SIZE),
		Y: rand.Intn(GRID_SIZE),
	}
}

func (g *Game) handleDirection(direction string) {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	if g.state.GameOver {
		return
	}

	isValidTurn := true
	switch direction {
	case UP:
		isValidTurn = g.state.Direction != DOWN
	case DOWN:
		isValidTurn = g.state.Direction != UP
	case LEFT:
		isValidTurn = g.state.Direction != RIGHT
	case RIGHT:
		isValidTurn = g.state.Direction != LEFT
	}

	if isValidTurn {
		g.state.Direction = direction
	}
}

func (g *Game) update() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	if g.state.GameOver {
		return
	}

	head := g.state.Snake[0]
	newHead := g.getNextPosition(head)

	if g.isCollision(newHead) {
		g.state.GameOver = true
		log.Printf("🎮 Game Over! Final Score: %d", g.state.Score)
		return
	}

	if newHead.X == g.state.Food.X && newHead.Y == g.state.Food.Y {
		g.state.Score++
		log.Printf("🍎 Food eaten! Score increased to: %d", g.state.Score)
		g.state.Food = generateFood()
		log.Printf("🎯 New food position: (%d, %d)", g.state.Food.X, g.state.Food.Y)
	} else {
		g.state.Snake = g.state.Snake[:len(g.state.Snake)-1]
	}
	g.state.Snake = append([]Point{newHead}, g.state.Snake...)
}

func (g *Game) getNextPosition(current Point) Point {
	switch g.state.Direction {
	case UP:
		return Point{X: current.X, Y: current.Y - 1}
	case DOWN:
		return Point{X: current.X, Y: current.Y + 1}
	case LEFT:
		return Point{X: current.X - 1, Y: current.Y}
	case RIGHT:
		return Point{X: current.X + 1, Y: current.Y}
	default:
		return current
	}
}

func (g *Game) isCollision(pos Point) bool {
	if pos.X < 0 || pos.X >= GRID_SIZE || pos.Y < 0 || pos.Y >= GRID_SIZE {
		return true
	}

	for _, segment := range g.state.Snake {
		if pos.X == segment.X && pos.Y == segment.Y {
			return true
		}
	}

	return false
}

func (g *Game) getState() GameState {
	g.mutex.RLock()
	defer g.mutex.RUnlock()
	return g.state
}

func (g *Game) start() {
	g.ticker = time.NewTicker(GAME_TICK_MS * time.Millisecond)

	go func() {
		for {
			select {
			case <-g.ticker.C:
				g.update()
				if err := g.conn.WriteJSON(g.getState()); err != nil {
					log.Printf("Error sending state: %v", err)
					return
				}
			case <-g.stopChan:
				return
			}
		}
	}()
}

func (g *Game) stop() {
	if g.ticker != nil {
		g.ticker.Stop()
	}
	close(g.stopChan)
}

// Leaderboard methods
func InitLeaderboard() error {
	log.Println("=== Starting Leaderboard Initialization ===")
	dir, err := os.Getwd()
	if err != nil {
		log.Printf("❌ Error getting working directory: %v", err)
		return err
	}
	log.Printf("📂 Working directory: %s", dir)

	// Use absolute path for database
	dbPath := filepath.Join(dir, "data")
	absDbPath, err := filepath.Abs(dbPath)
	if err != nil {
		log.Printf("❌ Error getting absolute path: %v", err)
		return err
	}
	log.Printf("📂 Absolute database directory path: %s", absDbPath)

	if err := os.MkdirAll(absDbPath, 0755); err != nil {
		log.Printf("❌ Error creating database directory: %v", err)
		return err
	}
	log.Println("✅ Database directory created/verified")

	dbFile := filepath.Join(absDbPath, "leaderboard.db")
	log.Printf("📄 Database file path: %s", dbFile)

	// Check file permissions
	if info, err := os.Stat(absDbPath); err == nil {
		log.Printf("📂 Database directory permissions: %v", info.Mode())
	}

	if info, err := os.Stat(dbFile); err == nil {
		log.Printf("📄 Database file permissions: %v", info.Mode())
		log.Printf("📊 Database file size: %d bytes", info.Size())
	} else {
		log.Printf("📝 Database file will be created with permissions 0644")
	}

	// Try to create a test file to verify write permissions
	testFile := filepath.Join(absDbPath, "test.txt")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		log.Printf("❌ Error writing test file: %v", err)
	} else {
		log.Println("✅ Write permissions verified")
		os.Remove(testFile) // Clean up test file
	}

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Printf("❌ Error opening database: %v", err)
		return err
	}
	log.Println("✅ Database connection opened")

	if err := db.Ping(); err != nil {
		log.Printf("❌ Error connecting to database: %v", err)
		db.Close()
		return err
	}
	log.Println("✅ Database connection verified")

	// Test query to check if scores table exists
	var tableExists bool
	err = db.QueryRow("SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='scores')").Scan(&tableExists)
	if err != nil {
		log.Printf("❌ Error checking if table exists: %v", err)
	} else {
		log.Printf("📊 Scores table exists: %v", tableExists)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS scores (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			player_name TEXT NOT NULL,
			score INTEGER NOT NULL,
			date DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		log.Printf("❌ Error creating table: %v", err)
		db.Close()
		return err
	}
	log.Println("✅ Scores table created/verified")

	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
	`)
	if err != nil {
		log.Printf("❌ Error creating index: %v", err)
		db.Close()
		return err
	}
	log.Println("✅ Score index created/verified")

	leaderboard = &Leaderboard{
		db: db,
	}

	// Verify table structure
	rows, err := db.Query("PRAGMA table_info(scores)")
	if err != nil {
		log.Printf("❌ Error getting table info: %v", err)
	} else {
		defer rows.Close()
		log.Println("📋 Table structure:")
		for rows.Next() {
			var cid int
			var name, type_ string
			var notnull, pk int
			var dflt_value interface{}
			if err := rows.Scan(&cid, &name, &type_, &notnull, &dflt_value, &pk); err == nil {
				log.Printf("   Column: %s, Type: %s, NotNull: %d, PK: %d", name, type_, notnull, pk)
			}
		}
	}

	// Count existing records
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM scores").Scan(&count); err != nil {
		log.Printf("❌ Error counting records: %v", err)
	} else {
		log.Printf("📊 Current number of records: %d", count)
	}

	log.Println("=== Leaderboard Initialization Complete ===")
	return nil
}

func (l *Leaderboard) AddScore(playerName string, score int) error {
	log.Println("=== Starting Score Addition ===")
	log.Printf("👤 Player: %s, Score: %d", playerName, score)

	l.mutex.Lock()
	defer l.mutex.Unlock()

	tx, err := l.db.Begin()
	if err != nil {
		log.Printf("❌ Error starting transaction: %v", err)
		return err
	}
	defer tx.Rollback()

	// Verify database connection
	if err := l.db.Ping(); err != nil {
		log.Printf("❌ Database connection error before insert: %v", err)
		return err
	}
	log.Println("✅ Database connection verified")

	// Use the provided timestamp from the client if available, otherwise use current time
	currentTime := time.Now().Format("2006-01-02 15:04:05")

	result, err := tx.Exec(
		"INSERT INTO scores (player_name, score, date) VALUES (?, ?, ?)",
		playerName, score, currentTime,
	)
	if err != nil {
		log.Printf("❌ Error inserting score: %v", err)
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("❌ Error getting last insert ID: %v", err)
	} else {
		log.Printf("✅ Score inserted with ID: %d", id)
	}

	// Verify the insert
	var inserted bool
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM scores WHERE id = ?)", id).Scan(&inserted)
	if err != nil {
		log.Printf("❌ Error verifying insert: %v", err)
	} else {
		log.Printf("✅ Insert verified: %v", inserted)
	}

	result, err = tx.Exec(`
		DELETE FROM scores 
		WHERE id NOT IN (
			SELECT id FROM scores 
			ORDER BY score DESC 
			LIMIT ?
		)
	`, MAX_ENTRIES)
	if err != nil {
		log.Printf("❌ Error trimming scores: %v", err)
		return err
	}

	deleted, err := result.RowsAffected()
	if err != nil {
		log.Printf("❌ Error getting number of deleted rows: %v", err)
	} else {
		log.Printf("📊 Deleted %d old scores", deleted)
	}

	if err := tx.Commit(); err != nil {
		log.Printf("❌ Error committing transaction: %v", err)
		return err
	}
	log.Println("✅ Transaction committed successfully")

	// Verify final state
	var finalCount int
	if err := l.db.QueryRow("SELECT COUNT(*) FROM scores").Scan(&finalCount); err != nil {
		log.Printf("❌ Error getting final count: %v", err)
	} else {
		log.Printf("📊 Final number of records: %d", finalCount)
	}

	log.Println("=== Score Addition Complete ===")
	return nil
}

func (l *Leaderboard) GetScores() []ScoreEntry {
	log.Println("=== Starting Score Retrieval ===")

	l.mutex.RLock()
	defer l.mutex.RUnlock()

	// Verify database connection
	if err := l.db.Ping(); err != nil {
		log.Printf("❌ Database connection error before query: %v", err)
		return []ScoreEntry{}
	}
	log.Println("✅ Database connection verified")

	// Log the query we're about to execute
	query := `
		SELECT player_name, score, date 
		FROM scores 
		ORDER BY score DESC 
		LIMIT ?
	`
	log.Printf("🔍 Executing query with LIMIT %d", MAX_ENTRIES)

	rows, err := l.db.Query(query, MAX_ENTRIES)
	if err != nil {
		log.Printf("❌ Error querying scores: %v", err)
		return []ScoreEntry{}
	}
	defer rows.Close()

	var scores []ScoreEntry
	for rows.Next() {
		var entry ScoreEntry
		var dateStr string
		err := rows.Scan(&entry.PlayerName, &entry.Score, &dateStr)
		if err != nil {
			log.Printf("❌ Error scanning row: %v", err)
			continue
		}

		entry.Date, err = time.Parse("2006-01-02 15:04:05", dateStr)
		if err != nil {
			log.Printf("❌ Error parsing date: %v", err)
			entry.Date = time.Now()
		}

		scores = append(scores, entry)
		log.Printf("📝 Retrieved score - Player: %s, Score: %d, Date: %s",
			entry.PlayerName, entry.Score, entry.Date.Format("2006-01-02 15:04:05"))
	}

	if err := rows.Err(); err != nil {
		log.Printf("❌ Error after iterating rows: %v", err)
	}

	log.Printf("📊 Retrieved %d scores from database", len(scores))

	// Additional verification query
	var totalCount int
	if err := l.db.QueryRow("SELECT COUNT(*) FROM scores").Scan(&totalCount); err != nil {
		log.Printf("❌ Error getting total count: %v", err)
	} else {
		log.Printf("📊 Total records in database: %d", totalCount)
	}

	log.Println("=== Score Retrieval Complete ===")
	return scores
}

func CloseLeaderboard() {
	if leaderboard != nil && leaderboard.db != nil {
		if err := leaderboard.db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		} else {
			log.Println("Database connection closed successfully")
		}
	}
}

// HTTP handlers
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Println("🎮 New game session starting")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ Error upgrading connection: %v", err)
		return
	}
	defer conn.Close()

	game := newGame(conn)
	defer game.stop()

	log.Printf("🎮 Initial game state - Score: %d, Snake Length: %d",
		game.state.Score, len(game.state.Snake))

	if err := conn.WriteJSON(game.getState()); err != nil {
		log.Printf("❌ Error sending initial state: %v", err)
		return
	}

	game.start()

	for {
		var msg struct {
			Direction string `json:"direction"`
		}

		if err := conn.ReadJSON(&msg); err != nil {
			if game.state.GameOver {
				log.Printf("🏁 Game session ended - Final Score: %d", game.state.Score)
			} else {
				log.Printf("❌ Error reading message: %v", err)
			}
			break
		}

		game.handleDirection(msg.Direction)
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	if err := InitLeaderboard(); err != nil {
		log.Fatalf("Failed to initialize leaderboard: %v", err)
	}
	defer CloseLeaderboard()

	router := mux.NewRouter()

	// CORS middleware with detailed logging
	router.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		AllowCredentials: true,
	}).Handler)

	router.HandleFunc("/ws", handleWebSocket)

	// Define a subrouter for /leaderboard
	leaderboardRouter := router.PathPrefix("/leaderboard").Subrouter()

	// GET handler
	leaderboardRouter.HandleFunc("", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		scores := leaderboard.GetScores()
		if err := json.NewEncoder(w).Encode(scores); err != nil {
			log.Printf("Error encoding scores: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
	}).Methods("GET")

	// POST handler
	leaderboardRouter.HandleFunc("", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("📝 Received POST request to /leaderboard")

		var submission struct {
			PlayerName string `json:"playerName"`
			Score      int    `json:"score"`
		}

		if err := json.NewDecoder(r.Body).Decode(&submission); err != nil {
			log.Printf("❌ Error decoding submission: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		log.Printf("📊 Received score submission: player=%s, score=%d", submission.PlayerName, submission.Score)

		if submission.PlayerName == "" {
			log.Printf("❌ Error: Player name is empty")
			http.Error(w, "Player name is required", http.StatusBadRequest)
			return
		}

		if err := leaderboard.AddScore(submission.PlayerName, submission.Score); err != nil {
			log.Printf("❌ Error adding score: %v", err)
			http.Error(w, "Failed to save score", http.StatusInternalServerError)
			return
		}

		log.Printf("✅ Successfully added score for %s: %d", submission.PlayerName, submission.Score)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}).Methods("POST", "OPTIONS")

	port := ":8080"
	log.Printf("Server starting on %s", port)
	log.Fatal(http.ListenAndServe(port, router))
}

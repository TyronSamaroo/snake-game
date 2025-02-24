package game

import (
	"math/rand"
	"sync"

	"github.com/snake-game/game-service/pkg/models"
)

// Game represents the snake game instance
// It maintains the game state and provides thread-safe access to it
type Game struct {
	state    models.GameState  // Current state of the game (snake position, food, score, etc.)
	config   models.GameConfig // Game configuration parameters
	mutex    sync.RWMutex      // Mutex to ensure thread-safe access to game state
	gameOver bool              // Local cache of game over state for quick access
}

// NewGame creates a new game instance with the given configuration
// It initializes the snake at the specified starting position and generates the first food
func NewGame(config models.GameConfig) *Game {
	game := &Game{
		config: config,
		state: models.GameState{
			Snake:     []models.Point{{X: config.InitialX, Y: config.InitialY}}, // Start with single segment
			Direction: models.Right,                                             // Snake starts moving right by default
			Score:     0,                                                        // Initial score is 0
			GameOver:  false,                                                    // Game starts in active state
		},
	}
	game.generateFood() // Place first food item
	return game
}

// generateFood creates new food at a random position
// It ensures food doesn't appear on the snake's body
func (g *Game) generateFood() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// Create a map of occupied positions for O(1) lookup
	occupied := make(map[string]bool)
	for _, p := range g.state.Snake {
		occupied[pointKey(p)] = true
	}

	// Keep trying random positions until we find an unoccupied one
	for {
		x := rand.Intn(g.config.GridSize)
		y := rand.Intn(g.config.GridSize)
		key := pointKey(models.Point{X: x, Y: y})
		if !occupied[key] {
			g.state.Food = models.Point{X: x, Y: y}
			break
		}
	}
}

// pointKey generates a unique string key for a point
// Used for efficient collision detection using a hash map
func pointKey(p models.Point) string {
	return string(p.X) + "," + string(p.Y)
}

// Update updates the game state based on the current direction
// This is called on each game tick to advance the game
func (g *Game) Update() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	if g.state.GameOver {
		return // No updates after game over
	}

	// Calculate new head position based on current direction
	head := g.state.Snake[0]
	var newHead models.Point

	switch g.state.Direction {
	case models.Up:
		newHead = models.Point{X: head.X, Y: head.Y - 1}
	case models.Down:
		newHead = models.Point{X: head.X, Y: head.Y + 1}
	case models.Left:
		newHead = models.Point{X: head.X - 1, Y: head.Y}
	case models.Right:
		newHead = models.Point{X: head.X + 1, Y: head.Y}
	}

	// Check for collisions with walls or self
	if g.checkCollision(newHead) {
		g.state.GameOver = true
		return
	}

	// Move snake by adding new head
	g.state.Snake = append([]models.Point{newHead}, g.state.Snake...)

	// Check if food is eaten
	if newHead == g.state.Food {
		g.state.Score++  // Increment score
		g.generateFood() // Generate new food
	} else {
		// Remove tail if food wasn't eaten (snake doesn't grow)
		g.state.Snake = g.state.Snake[:len(g.state.Snake)-1]
	}
}

// checkCollision checks if the given point collides with walls or snake body
// Returns true if collision detected, false otherwise
func (g *Game) checkCollision(p models.Point) bool {
	// Check wall collision (grid boundaries)
	if p.X < 0 || p.X >= g.config.GridSize || p.Y < 0 || p.Y >= g.config.GridSize {
		return true
	}

	// Check self collision (snake body)
	for _, part := range g.state.Snake {
		if p == part {
			return true
		}
	}

	return false
}

// SetDirection sets the snake's direction
// Prevents 180-degree turns which would cause instant death
func (g *Game) SetDirection(dir models.Direction) {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// Prevent 180-degree turns by checking opposite directions
	switch dir {
	case models.Up:
		if g.state.Direction != models.Down {
			g.state.Direction = dir
		}
	case models.Down:
		if g.state.Direction != models.Up {
			g.state.Direction = dir
		}
	case models.Left:
		if g.state.Direction != models.Right {
			g.state.Direction = dir
		}
	case models.Right:
		if g.state.Direction != models.Left {
			g.state.Direction = dir
		}
	}
}

// GetState returns the current game state
// Thread-safe read access to game state
func (g *Game) GetState() models.GameState {
	g.mutex.RLock()
	defer g.mutex.RUnlock()
	return g.state
}

// Reset resets the game to its initial state
// Called when starting a new game
func (g *Game) Reset() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// Reset to initial state
	g.state = models.GameState{
		Snake:     []models.Point{{X: g.config.InitialX, Y: g.config.InitialY}},
		Direction: models.Right,
		Score:     0,
		GameOver:  false,
	}
	g.generateFood() // Generate first food for new game
}

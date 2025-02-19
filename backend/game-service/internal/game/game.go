package game

import (
	"math/rand"
	"sync"
	"time"

	"github.com/snake-game/game-service/pkg/models"
)

// Game represents the snake game instance
type Game struct {
	state    models.GameState
	config   models.GameConfig
	mutex    sync.RWMutex
	gameOver bool
}

// NewGame creates a new game instance with the given configuration
func NewGame(config models.GameConfig) *Game {
	game := &Game{
		config: config,
		state: models.GameState{
			Snake:     []models.Point{{X: config.InitialX, Y: config.InitialY}},
			Direction: models.Right,
			Score:     0,
			GameOver:  false,
		},
	}
	game.generateFood()
	return game
}

// generateFood creates new food at a random position
func (g *Game) generateFood() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// Create a map of occupied positions
	occupied := make(map[string]bool)
	for _, p := range g.state.Snake {
		occupied[pointKey(p)] = true
	}

	// Find an unoccupied position
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
func pointKey(p models.Point) string {
	return string(p.X) + "," + string(p.Y)
}

// Update updates the game state based on the current direction
func (g *Game) Update() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	if g.state.GameOver {
		return
	}

	// Calculate new head position
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

	// Check for collisions
	if g.checkCollision(newHead) {
		g.state.GameOver = true
		return
	}

	// Move snake
	g.state.Snake = append([]models.Point{newHead}, g.state.Snake...)

	// Check if food is eaten
	if newHead == g.state.Food {
		g.state.Score++
		g.generateFood()
	} else {
		// Remove tail if food wasn't eaten
		g.state.Snake = g.state.Snake[:len(g.state.Snake)-1]
	}
}

// checkCollision checks if the given point collides with walls or snake body
func (g *Game) checkCollision(p models.Point) bool {
	// Check wall collision
	if p.X < 0 || p.X >= g.config.GridSize || p.Y < 0 || p.Y >= g.config.GridSize {
		return true
	}

	// Check self collision
	for _, part := range g.state.Snake {
		if p == part {
			return true
		}
	}

	return false
}

// SetDirection sets the snake's direction
func (g *Game) SetDirection(dir models.Direction) {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// Prevent 180-degree turns
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
func (g *Game) GetState() models.GameState {
	g.mutex.RLock()
	defer g.mutex.RUnlock()
	return g.state
}

// Reset resets the game to its initial state
func (g *Game) Reset() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	g.state = models.GameState{
		Snake:     []models.Point{{X: g.config.InitialX, Y: g.config.InitialY}},
		Direction: models.Right,
		Score:     0,
		GameOver:  false,
	}
	g.generateFood()
}

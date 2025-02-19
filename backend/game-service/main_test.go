package main

import (
	"testing"
)

// TestNewGame verifies that a new game is properly initialized
func TestNewGame(t *testing.T) {
	game := newGame(nil)

	// Check initial snake position
	if len(game.state.Snake) != 1 {
		t.Errorf("Expected snake length of 1, got %d", len(game.state.Snake))
	}

	if game.state.Snake[0].X != INITIAL_SNAKE_X || game.state.Snake[0].Y != INITIAL_SNAKE_Y {
		t.Errorf("Expected initial position (%d,%d), got (%d,%d)",
			INITIAL_SNAKE_X, INITIAL_SNAKE_Y,
			game.state.Snake[0].X, game.state.Snake[0].Y)
	}

	// Check initial game state
	if game.state.Score != 0 {
		t.Errorf("Expected initial score 0, got %d", game.state.Score)
	}
	if game.state.GameOver {
		t.Error("Game should not be over initially")
	}
	if game.state.Direction != RIGHT {
		t.Errorf("Expected initial direction RIGHT, got %s", game.state.Direction)
	}
}

// TestHandleDirection verifies direction change logic
func TestHandleDirection(t *testing.T) {
	game := newGame(nil)

	// Test valid direction changes
	testCases := []struct {
		current  string
		new      string
		expected string
	}{
		{RIGHT, UP, UP},
		{UP, RIGHT, RIGHT},
		{RIGHT, LEFT, RIGHT}, // Should not allow 180-degree turn
		{UP, DOWN, UP},       // Should not allow 180-degree turn
	}

	for _, tc := range testCases {
		game.state.Direction = tc.current
		game.handleDirection(tc.new)
		if game.state.Direction != tc.expected {
			t.Errorf("From %s, changing to %s: expected %s, got %s",
				tc.current, tc.new, tc.expected, game.state.Direction)
		}
	}
}

// TestCollisionDetection verifies collision detection
func TestCollisionDetection(t *testing.T) {
	game := newGame(nil)

	// Test wall collisions
	wallPositions := []Point{
		{X: -1, Y: 0},
		{X: GRID_SIZE, Y: 0},
		{X: 0, Y: -1},
		{X: 0, Y: GRID_SIZE},
	}

	for _, pos := range wallPositions {
		if !game.isCollision(pos) {
			t.Errorf("Expected wall collision at (%d,%d)", pos.X, pos.Y)
		}
	}

	// Test self collision
	game.state.Snake = []Point{
		{X: 5, Y: 5},
		{X: 5, Y: 6},
		{X: 5, Y: 7},
	}

	selfCollision := Point{X: 5, Y: 6}
	if !game.isCollision(selfCollision) {
		t.Error("Expected self collision detection")
	}

	// Test valid position
	validPos := Point{X: 10, Y: 10}
	if game.isCollision(validPos) {
		t.Error("False positive collision detection")
	}
}

// TestSnakeGrowth verifies that the snake grows when eating food
func TestSnakeGrowth(t *testing.T) {
	game := newGame(nil)

	// Position snake head at food position
	game.state.Snake = []Point{{X: 1, Y: 1}}
	game.state.Food = Point{X: 2, Y: 1}
	game.state.Direction = RIGHT

	initialLength := len(game.state.Snake)
	initialScore := game.state.Score

	game.update()

	if len(game.state.Snake) != initialLength+1 {
		t.Error("Snake should grow after eating food")
	}
	if game.state.Score != initialScore+1 {
		t.Error("Score should increase after eating food")
	}
}

// TestGameOver verifies game over conditions
func TestGameOver(t *testing.T) {
	game := newGame(nil)

	// Test wall collision game over
	game.state.Snake = []Point{{X: 0, Y: 0}}
	game.state.Direction = LEFT
	game.update()

	if !game.state.GameOver {
		t.Error("Game should be over after wall collision")
	}

	// Test self collision game over
	game = newGame(nil)
	game.state.Snake = []Point{
		{X: 5, Y: 5},
		{X: 5, Y: 6},
		{X: 5, Y: 7},
		{X: 6, Y: 7},
		{X: 6, Y: 6},
		{X: 6, Y: 5},
	}
	game.state.Direction = LEFT
	game.update()

	if !game.state.GameOver {
		t.Error("Game should be over after self collision")
	}
}

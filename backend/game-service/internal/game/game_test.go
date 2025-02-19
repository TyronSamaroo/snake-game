package game

import (
	"testing"

	"github.com/snake-game/game-service/pkg/models"
)

func TestNewGame(t *testing.T) {
	config := models.GameConfig{
		GridSize:  20,
		CellSize:  20,
		Speed:     200,
		InitialX:  10,
		InitialY:  10,
	}

	game := NewGame(config)

	if len(game.state.Snake) != 1 {
		t.Errorf("Expected snake length of 1, got %d", len(game.state.Snake))
	}

	if game.state.Snake[0].X != config.InitialX || game.state.Snake[0].Y != config.InitialY {
		t.Errorf("Snake not at initial position. Expected (%d,%d), got (%d,%d)",
			config.InitialX, config.InitialY,
			game.state.Snake[0].X, game.state.Snake[0].Y)
	}
}

func TestSetDirection(t *testing.T) {
	game := NewGame(models.GameConfig{GridSize: 20})

	// Test valid direction changes
	tests := []struct {
		current  models.Direction
		new      models.Direction
		expected models.Direction
	}{
		{models.Right, models.Up, models.Up},
		{models.Right, models.Down, models.Down},
		{models.Right, models.Left, models.Right}, // Should not change (180-degree turn)
		{models.Up, models.Left, models.Left},
	}

	for _, test := range tests {
		game.state.Direction = test.current
		game.SetDirection(test.new)
		if game.state.Direction != test.expected {
			t.Errorf("Direction change from %s to %s: expected %s, got %s",
				test.current, test.new, test.expected, game.state.Direction)
		}
	}
}

func TestUpdate(t *testing.T) {
	config := models.GameConfig{
		GridSize:  20,
		InitialX:  10,
		InitialY:  10,
	}
	game := NewGame(config)

	// Test movement
	initialX := game.state.Snake[0].X
	initialY := game.state.Snake[0].Y
	game.Update()
	
	if game.state.Snake[0].X != initialX+1 || game.state.Snake[0].Y != initialY {
		t.Errorf("Snake did not move right. Expected (%d,%d), got (%d,%d)",
			initialX+1, initialY,
			game.state.Snake[0].X, game.state.Snake[0].Y)
	}

	// Test wall collision
	game.state.Snake[0].X = config.GridSize - 1
	game.Update()
	if !game.state.GameOver {
		t.Error("Expected game over when hitting wall")
	}
}

func TestCollision(t *testing.T) {
	game := NewGame(models.GameConfig{GridSize: 20})

	// Test wall collision
	if !game.checkCollision(models.Point{X: -1, Y: 0}) {
		t.Error("Expected collision with left wall")
	}
	if !game.checkCollision(models.Point{X: 20, Y: 0}) {
		t.Error("Expected collision with right wall")
	}

	// Test self collision
	game.state.Snake = []models.Point{
		{X: 5, Y: 5},
		{X: 5, Y: 6},
		{X: 5, Y: 7},
	}
	if !game.checkCollision(models.Point{X: 5, Y: 6}) {
		t.Error("Expected collision with snake body")
	}
}

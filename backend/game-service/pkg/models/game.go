package models

// Point represents a position in the game grid
type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Direction represents the movement direction of the snake
type Direction string

const (
	Up    Direction = "UP"
	Down  Direction = "DOWN"
	Left  Direction = "LEFT"
	Right Direction = "RIGHT"
)

// GameState represents the current state of the game
type GameState struct {
	Snake     []Point   `json:"snake"`     // Array of points representing snake's body
	Food      Point     `json:"food"`      // Position of the food
	Score     int       `json:"score"`     // Current score
	GameOver  bool      `json:"gameOver"`  // Whether the game is over
	Direction Direction `json:"direction"` // Current direction of movement
}

// GameConfig holds game configuration parameters
type GameConfig struct {
	GridSize  int `json:"gridSize"`  // Size of the game grid
	CellSize  int `json:"cellSize"`  // Size of each cell in pixels
	Speed     int `json:"speed"`     // Game speed (milliseconds between moves)
	InitialX  int `json:"initialX"`  // Initial X position of snake
	InitialY  int `json:"initialY"`  // Initial Y position of snake
}

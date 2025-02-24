package models

// Point represents a position in the game grid
// X and Y coordinates are zero-based, where (0,0) is the top-left corner
// and values increase right and down respectively
type Point struct {
	X int `json:"x"` // Horizontal position (0 is leftmost)
	Y int `json:"y"` // Vertical position (0 is topmost)
}

// Direction represents the movement direction of the snake
// Using string type for easy JSON serialization and client communication
type Direction string

// Predefined constants for snake movement directions
// These values match the client-side direction commands
const (
	Up    Direction = "UP"    // Snake moves upward (decreasing Y)
	Down  Direction = "DOWN"  // Snake moves downward (increasing Y)
	Left  Direction = "LEFT"  // Snake moves left (decreasing X)
	Right Direction = "RIGHT" // Snake moves right (increasing X)
)

// GameState represents the current state of the game
// This struct is serialized to JSON and sent to the client
type GameState struct {
	Snake     []Point   `json:"snake"`     // Array of points representing snake's body, where index 0 is the head
	Food      Point     `json:"food"`      // Current position of the food that the snake tries to eat
	Score     int       `json:"score"`     // Player's current score (increases by 1 for each food eaten)
	GameOver  bool      `json:"gameOver"`  // True when snake collides with wall or itself
	Direction Direction `json:"direction"` // Current direction the snake is moving
}

// GameConfig holds game configuration parameters
// These settings determine the game's behavior and dimensions
type GameConfig struct {
	GridSize int `json:"gridSize"` // Number of cells in both width and height of the game grid
	CellSize int `json:"cellSize"` // Pixel size of each grid cell for rendering
	Speed    int `json:"speed"`    // Game tick interval in milliseconds (lower = faster)
	InitialX int `json:"initialX"` // Starting X position of snake's head
	InitialY int `json:"initialY"` // Starting Y position of snake's head
}

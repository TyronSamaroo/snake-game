# 🐍 Snake Game Backend Architecture Document

## Table of Contents
- [Introduction](#introduction)
- [System Architecture](#system-architecture)
- [Key Components](#key-components)
- [Data Flow](#data-flow)
- [Technologies Used](#technologies-used)
- [Development Environment Setup](#development-environment-setup)
- [Testing](#testing)
- [Maintenance Guide](#maintenance-guide)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Introduction

The Snake Game Backend is a modern implementation of the classic Snake game built using Go. It leverages WebSockets for real-time communication with the frontend client and SQLite for persistent storage of leaderboard data.

This service handles:
- Game state management
- Real-time game updates
- Leaderboard functionality
- WebSocket communication

## System Architecture

```
┌─────────────────┐       ┌───────────────────┐
│                 │       │                   │
│  Frontend       │◄─────►│  Game Service     │
│  (Browser)      │ WS    │  (Go)             │
│                 │       │                   │
└─────────────────┘       └────────┬──────────┘
                                   │
                                   │ SQL
                                   ▼
                           ┌───────────────────┐
                           │                   │
                           │  SQLite Database  │
                           │  (leaderboard.db) │
                           │                   │
                           └───────────────────┘
```

The backend follows a modular architecture with clearly separated concerns:

1. **Main Service**: Entry point that sets up HTTP routes and WebSocket handlers
2. **Game Logic**: Handles the core game mechanics, state updates, and collision detection
3. **WebSocket Communication**: Manages real-time bidirectional communication with clients
4. **Persistence Layer**: Stores and retrieves leaderboard data from SQLite

## Key Components

### 1. Game Service

The main application service is contained in `main.go`, which initializes the server and sets up routing.

#### Directory Structure

```
backend/
└── game-service/
    ├── main.go           # Main entry point
    ├── main_test.go      # Unit tests
    ├── go.mod            # Go module definition
    ├── go.sum            # Go module checksums
    ├── leaderboard.db    # SQLite database
    ├── data/             # Data resources
    ├── internal/         # Internal packages
    │   ├── game/         # Game logic
    │   ├── server/       # HTTP server
    │   └── websocket/    # WebSocket handlers
    └── pkg/              # Public API packages
        └── models/       # Data models
```

### 2. Game Logic

The game logic implements the classic Snake game rules:
- Snake movement in four directions
- Food generation
- Collision detection (walls and self)
- Score tracking
- Game over conditions

### 3. Data Models

Key data structures:

```go
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
```

## Data Flow

1. **Game Initialization**
   - Client connects via WebSocket
   - Server creates a new game instance
   - Initial game state is sent to the client

2. **Game Loop**
   - Client sends direction commands
   - Server updates game state (snake position, food, collisions)
   - Updated state is sent back to client
   - Loop continues until game over

3. **Score Submission**
   - On game over, client submits player name
   - Server stores score in leaderboard database
   - Updated leaderboard is sent to client

## Technologies Used

- **Go (Golang)**: Primary backend language
- **WebSockets**: Real-time bidirectional communication
- **SQLite**: Lightweight database for leaderboard persistence
- **Gorilla Mux**: HTTP routing
- **Gorilla WebSocket**: WebSocket implementation
- **CORS**: Cross-Origin Resource Sharing support

## Development Environment Setup

### Prerequisites

- Go 1.21 or higher
- SQLite

### Setting Up Development Environment

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd snake-game/backend/game-service
   ```

2. **Install dependencies**
   ```
   go mod download
   ```

3. **Run the server**
   ```
   go run main.go
   ```

4. **Run tests**
   ```
   go test
   ```

## Testing

The backend includes comprehensive unit tests in `main_test.go` covering:

- Game initialization
- Direction handling
- Collision detection
- Snake growth mechanics
- Game over conditions

To run the tests:
```
go test -v
```

## Maintenance Guide

### Adding New Features

1. Identify the component that needs modification (game logic, API, database)
2. Write tests for the new functionality
3. Implement the feature
4. Ensure all tests pass
5. Update documentation if necessary

### Common Maintenance Tasks

#### Database Maintenance

The SQLite database (`leaderboard.db`) may need occasional maintenance:

```
# Backup database
cp leaderboard.db leaderboard.db.backup

# Reset leaderboard (if needed)
rm leaderboard.db
go run main.go  # This will recreate the database
```

#### Updating Dependencies

```
go get -u all
go mod tidy
```

## API Reference

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `CONNECT` | Client → Server | Initial connection |
| `DIRECTION` | Client → Server | Change snake direction |
| `STATE_UPDATE` | Server → Client | Game state update |
| `GAME_OVER` | Server → Client | Game over notification |
| `SUBMIT_SCORE` | Client → Server | Submit score to leaderboard |
| `LEADERBOARD_UPDATE` | Server → Client | Updated leaderboard data |

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ws` | WebSocket | Game WebSocket connection |
| `/leaderboard` | GET | Retrieve leaderboard data |

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if the server is running
   - Verify WebSocket URL and port
   - Check CORS settings if connecting from a different domain

2. **Database Errors**
   - Ensure SQLite is installed
   - Check file permissions on leaderboard.db
   - Verify database schema integrity

3. **Performance Issues**
   - Monitor CPU and memory usage
   - Check for goroutine leaks (connections not being closed)
   - Optimize WebSocket message frequency 
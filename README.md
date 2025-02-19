# Snake Game

A modern implementation of the classic Snake game using React and Go with real-time WebSocket communication.
Created by Tyron Samaroo.

## Author
**Tyron Samaroo**
- GitHub: [@TyronSamaroo](https://github.com/TyronSamaroo)

## Architecture Overview

```
┌─────────────────────────────────────┐      ┌──────────────────────────────────┐
│           Frontend Layer            │      │          Backend Layer           │
│                                     │      │                                  │
│  ┌─────────────┐   ┌─────────────┐ │      │ ┌────────────┐  ┌────────────┐  │
│  │    React    │   │   Canvas    │ │      │ │   Gorilla  │  │   Game     │  │
│  │  Components │   │  Rendering  │ │      │ │ WebSocket  │  │  Engine    │  │
│  └─────┬───────┘   └──────┬──────┘ │      │ └─────┬──────┘  └─────┬──────┘  │
│        │                  │        │      │       │               │         │
│  ┌─────┴───────┐   ┌─────┴──────┐ │      │ ┌─────┴──────┐  ┌─────┴──────┐  │
│  │   State     │   │   Game     │ │      │ │   State    │  │  Collision │  │
│  │ Management  │◄──►│   Loop    │ │      │ │  Broadcast │  │  Detection │  │
│  └─────────────┘   └───────────┬┘ │      │ └────────────┘  └────────────┘  │
│         ▲                      │  │      │        ▲              ▲         │
│         │                      │  │      │        │              │         │
│  ┌──────┴──────┐              │  │      │  ┌─────┴──────┐  ┌────┴───────┐  │
│  │ WebSocket   │              │  │      │  │   Router   │  │   Score    │  │
│  │   Client    │◄─────────────┘  │      │  │    (Mux)  │  │  Tracking  │  │
│  └──────┬──────┘                 │      │  └─────┬──────┘  └────┬───────┘  │
│         │                        │      │        │              │         │
└─────────┼────────────────────────┘      └────────┼──────────────┼─────────┘
          │                                         │              │
          │                                         │              │
          │                                  ┌──────┴──────────────┴───────┐
          │                                  │         Database            │
          └─────────────────────────────────►│          Layer             │
                                            │        (SQLite)             │
                                            └───────────────────────────────┘
```

## About the Developer
This project was designed and implemented by Tyron Samaroo, showcasing modern web development practices and real-time game development techniques. The architecture combines React for frontend interactivity with Go for robust backend performance.

## Tech Stack

### Frontend
- React 18.2 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- HTML5 Canvas for game rendering
- WebSocket for real-time communication

### Backend
- Go 1.21
- Gorilla WebSocket for WebSocket handling
- Gorilla Mux for HTTP routing
- SQLite for data persistence
- CORS middleware for security

## Project Structure

```
├── backend/
│   └── game-service/
│       ├── main.go              # Entry point
│       ├── internal/
│       │   ├── game/           # Game logic
│       │   ├── server/         # HTTP server
│       │   └── websocket/      # WebSocket handling
│       └── pkg/
│           └── models/         # Shared data structures
│
└── frontend/
    ├── src/
    │   ├── components/         # React components
    │   ├── types/             # TypeScript definitions
    │   └── lib/               # Utility functions
    └── public/                # Static assets
```

## Features

- Real-time snake movement with WebSocket communication
- Canvas-based game rendering with modern visual effects
- Global leaderboard with persistent storage
- Responsive design with modern UI
- Comprehensive error handling and logging
- Thread-safe game state management

## Getting Started

### Prerequisites
- Go 1.21 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup
```bash
cd backend/game-service
go mod download
go run main.go
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Reference

### WebSocket Endpoint
- `ws://localhost:8080/ws`
  ```typescript
  // Client -> Server
  interface Input {
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  }

  // Server -> Client
  interface GameState {
    snake: Array<{x: number, y: number}>;
    food: {x: number, y: number};
    score: number;
    gameOver: boolean;
  }
  ```

### HTTP Endpoints
- `GET /leaderboard`
  - Returns the current leaderboard standings
- `POST /leaderboard`
  - Submits a new score
  ```typescript
  {
    playerName: string;
    score: number;
  }
  ```

## Game Flow

```
┌─────────────────────────────────────────────────────┐
│                  Game Flow                           │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ Player   │    │  Game    │    │ Leader   │     │
│  │ Input    │--->│  State   │--->│ board    │     │
│  └──────────┘    └──────────┘    └──────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Development

### Backend Development
- Game logic is thread-safe with mutex locks
- WebSocket connections managed per client
- SQLite database with proper connection pooling
- Comprehensive error handling and logging

### Frontend Development
- React components with TypeScript for type safety
- Canvas rendering optimized for performance
- Real-time state management with WebSocket
- Modern UI with TailwindCSS

## Testing

### Backend Tests
```bash
cd backend/game-service
go test ./...
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Backend
```bash
cd backend/game-service
go build
./game-service
```

### Frontend
```bash
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
Copyright (c) 2024 Tyron Samaroo

## Acknowledgments

- Project Creator: Tyron Samaroo
- Gorilla WebSocket library
- React and Vite teams
- TailwindCSS community

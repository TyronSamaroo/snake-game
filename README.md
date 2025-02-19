# Snake Game - Modern Microservice Architecture

A modern implementation of the classic Snake game using Go microservices backend and React TypeScript frontend.

## Project Structure

```
snake-game/
├── backend/
│   └── game-service/     # Go backend service for game logic
└── frontend/            # React TypeScript frontend
```

## Technology Stack

### Backend
- Go 1.21+
- Gorilla Mux for HTTP routing
- WebSocket for real-time game updates
- Clean Architecture principles

### Frontend
- React 18+
- TypeScript
- Vite
- TailwindCSS for styling
- WebSocket client for real-time game updates

## Getting Started

### Prerequisites
- Go 1.21 or higher
- Node.js 18+ and npm
- Git

### Running the Backend
```bash
cd backend/game-service
go mod tidy
go run main.go
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- Classic Snake game mechanics
- Real-time game state updates
- Responsive design
- Score tracking
- Modern UI/UX

## Architecture
The project follows a microservice architecture with:
- Separate frontend and backend services
- WebSocket communication for real-time updates
- Clean code principles and separation of concerns

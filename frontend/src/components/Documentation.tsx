import React from 'react';

const Documentation: React.FC = () => {
    return (
        <div className="min-h-screen text-gray-100 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-5xl font-bold mb-12 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    Snake Game Documentation
                </h1>
                
                {/* Architecture Overview */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-6 text-white/90">Architecture Overview</h2>
                    <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5 mb-6">
                        <pre className="text-sm text-gray-300 font-mono">
                            {`
┌─────────────────┐     WebSocket     ┌─────────────────┐
│                 │    Connection      │                 │
│  React Frontend │<----------------->│   Go Backend    │
│    (Vite)      │     (ws://...)    │   (Gorilla)     │
└─────────────────┘                   └─────────────────┘
        │                                     │
        │ Canvas Rendering                    │ SQLite DB
        │ State Management                    │ Game Logic
        │ Leaderboard UI                     │ Leaderboard API
        ▼                                    ▼

┌─────────────────────────────────────────────────────┐
│                  Game Flow                           │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ Player   │    │  Game    │    │ Leader   │     │
│  │ Input    │--->│  State   │--->│ board    │     │
│  └──────────┘    └──────────┘    └──────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘`}
                        </pre>
                    </div>
                    <p className="text-lg text-gray-300 mb-4 leading-relaxed">
                        The game uses a modern stack with real-time communication:
                    </p>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Frontend: React + TypeScript + Vite + TailwindCSS</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Backend: Go with Gorilla WebSocket and Mux</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Database: SQLite for leaderboard persistence</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Communication: WebSocket for real-time game state</span>
                        </li>
                    </ul>
                </section>

                {/* Quick Start */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-6 text-white/90">Quick Start</h2>
                    <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5">
                        <h3 className="text-xl font-semibold mb-4 text-white">Running the Project</h3>
                        <div className="space-y-4">
                            <div className="bg-black/40 p-4 rounded-xl">
                                <p className="text-emerald-400 font-semibold mb-2">Backend (Go)</p>
                                <pre className="text-sm text-gray-300 font-mono">
                                    {`cd backend/game-service
go mod download
go run main.go    # Starts server on :8080`}
                                </pre>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl">
                                <p className="text-emerald-400 font-semibold mb-2">Frontend (React)</p>
                                <pre className="text-sm text-gray-300 font-mono">
                                    {`cd frontend
npm install
npm run dev    # Starts dev server on :5173`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Flow Visualization */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-6 text-white/90">Data Flow</h2>
                    <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5">
                        <pre className="text-sm text-gray-300 font-mono">
                            {`
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │    WebSocket │         │    Backend   │
│   (React)    │         │   Protocol   │         │     (Go)     │
└──────────────┘         └──────────────┘         └──────────────┘
       │                         │                        │
       │  1. Key Press          │                        │
       │─────────────────────────────────────────────────>
       │                         │                        │
       │                         │   2. Update Game State │
       │                         │        & Collisions    │
       │                         │        & Scoring       │
       │                         │ <──────────────────────│
       │                         │                        │
       │  3. Receive New State   │                        │
       │<────────────────────────│                        │
       │                         │                        │
       │  4. Render Canvas       │                        │
       │───┐                     │                        │
       │   │                     │                        │
       │<──┘                     │                        │
       │                         │                        │
       │  5. Game Over          │                        │
       │─────────────────────────────────────────────────>
       │                         │                        │
       │                         │   6. Save Score        │
       │                         │        to SQLite       │
       │                         │ <──────────────────────│
       │                         │                        │`}
                        </pre>
                    </div>
                </section>

                {/* Architecture Deep Dive */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-6 text-white/90">Architecture Deep Dive</h2>
                    <div className="space-y-6">
                        {/* Backend Architecture */}
                        <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5">
                            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                                Backend Architecture
                            </h3>
                            <pre className="text-sm text-gray-300 font-mono mb-4">
                                {`backend/game-service/
├── main.go              # Entry point, HTTP/WS server setup
├── internal/
│   ├── game/           # Core game logic
│   │   ├── game.go     # Game state and mechanics
│   │   └── game_test.go
│   ├── server/         # HTTP server implementation
│   └── websocket/      # WebSocket handling
└── pkg/
    └── models/         # Shared data structures`}
                            </pre>
                            <div className="space-y-4 mt-6">
                                <div className="bg-black/40 p-4 rounded-xl">
                                    <p className="text-purple-400 font-semibold mb-2">Key Components</p>
                                    <ul className="space-y-2 text-gray-300">
                                        <li>• Game Engine: Manages game state, collisions, scoring</li>
                                        <li>• WebSocket Manager: Handles client connections and real-time updates</li>
                                        <li>• Leaderboard Service: SQLite database for persistent scores</li>
                                        <li>• HTTP Router: Gorilla Mux for REST endpoints</li>
                                    </ul>
                                </div>
                                <div className="bg-black/40 p-4 rounded-xl">
                                    <p className="text-purple-400 font-semibold mb-2">Data Flow</p>
                                    <ul className="space-y-2 text-gray-300">
                                        <li>1. Client connects via WebSocket</li>
                                        <li>2. New game instance created per connection</li>
                                        <li>3. Game state updated on tick or input</li>
                                        <li>4. State changes broadcast to client</li>
                                        <li>5. Scores saved to SQLite on game over</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Frontend Architecture */}
                        <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5">
                            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                                Frontend Architecture
                            </h3>
                            <pre className="text-sm text-gray-300 font-mono mb-4">
                                {`frontend/src/
├── components/         # React components
│   ├── Game.tsx       # Main game component
│   └── Documentation.tsx
├── types/             # TypeScript definitions
├── lib/              # Utility functions
└── App.tsx           # Root component`}
                            </pre>
                            <div className="space-y-4 mt-6">
                                <div className="bg-black/40 p-4 rounded-xl">
                                    <p className="text-blue-400 font-semibold mb-2">State Management</p>
                                    <ul className="space-y-2 text-gray-300">
                                        <li>• WebSocket connection managed with useRef</li>
                                        <li>• Game state handled with useState</li>
                                        <li>• Side effects managed with useEffect</li>
                                        <li>• Canvas rendering updates on state change</li>
                                    </ul>
                                </div>
                                <div className="bg-black/40 p-4 rounded-xl">
                                    <p className="text-blue-400 font-semibold mb-2">Component Structure</p>
                                    <ul className="space-y-2 text-gray-300">
                                        <li>• App: Navigation and layout</li>
                                        <li>• Game: Canvas and game logic</li>
                                        <li>• Leaderboard: Score display</li>
                                        <li>• Documentation: This documentation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Reference */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-6 text-white/90">API Reference</h2>
                    <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5">
                        <div className="space-y-6">
                            <div className="bg-black/40 p-4 rounded-xl">
                                <p className="text-emerald-400 font-semibold mb-2">WebSocket: /ws</p>
                                <pre className="text-sm text-gray-300 font-mono">
                                    {`// Client -> Server (Input)
{
    "direction": "UP" | "DOWN" | "LEFT" | "RIGHT"
}

// Server -> Client (Game State)
{
    "snake": [{"x": number, "y": number}],
    "food": {"x": number, "y": number},
    "score": number,
    "gameOver": boolean
}`}
                                </pre>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl">
                                <p className="text-emerald-400 font-semibold mb-2">POST /leaderboard</p>
                                <pre className="text-sm text-gray-300 font-mono">
                                    {`// Request
{
    "playerName": string,
    "score": number
}

// Response
{
    "status": "success"
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Add Technical Details section */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-6 text-white/90">Technical Details</h2>
                    <div className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5">
                        <div className="space-y-6">
                            <div className="bg-black/40 p-4 rounded-xl">
                                <p className="text-emerald-400 font-semibold mb-2">Game Loop</p>
                                <pre className="text-sm text-gray-300 font-mono">
                                    {`1. Frontend listens for keyboard input
2. Input sent to backend via WebSocket
3. Backend updates game state (200ms intervals)
4. New state broadcast to frontend
5. Frontend renders new state on canvas
6. Process repeats until game over`}
                                </pre>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl">
                                <p className="text-emerald-400 font-semibold mb-2">State Management</p>
                                <pre className="text-sm text-gray-300 font-mono">
                                    {`// Backend (Go)
type GameState struct {
    Snake     []Point
    Food      Point
    Score     int
    GameOver  bool
    Direction string
}

// Frontend (TypeScript)
interface GameState {
    snake: Point[];
    food: Point;
    score: number;
    gameOver: boolean;
    direction: string;
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Documentation; 
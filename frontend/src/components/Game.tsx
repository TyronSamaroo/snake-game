import React, { useEffect, useRef, useState } from 'react';

// Types for game objects
interface Point {
    x: number;
    y: number;
}

interface GameState {
    snake: Point[];
    food: Point;
    score: number;
    gameOver: boolean;
    direction: string;
}

// Add new interfaces
interface ScoreEntry {
    playerName: string;
    score: number;
    date: string;
}

// Game configuration
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const SNAKE_COLOR = '#10b981';  // Updated to match modern emerald color
const FOOD_COLOR = '#f43f5e';   // Updated to match modern rose color
const GRID_COLOR = 'rgba(255, 255, 255, 0.03)';  // Even more subtle grid
const BACKGROUND_COLOR = '#111827';  // Solid dark background

const Game: React.FC = () => {
    // Game state management
    const [gameState, setGameState] = useState<GameState>({
        snake: [{x: 10, y: 10}],
        food: {x: 5, y: 5},
        score: 0,
        gameOver: false,
        direction: 'RIGHT'
    });
    const [playerName, setPlayerName] = useState<string>("");
    const [showNameInput, setShowNameInput] = useState<boolean>(false);
    const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
    const [showGameOverLeaderboard, setShowGameOverLeaderboard] = useState(false);

    // Refs for WebSocket and canvas
    const wsRef = useRef<WebSocket | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Add loading and error states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // WebSocket connection handler
    const connectWebSocket = () => {
        wsRef.current = new WebSocket('ws://localhost:8080/ws');
        
        wsRef.current.onopen = () => {
            console.log('Connected to WebSocket');
        };

        wsRef.current.onmessage = (event) => {
            const newState = JSON.parse(event.data);
            setGameState(newState);
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Game restart handler
    const handleRestart = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        // Reset all the game-related states
        setShowNameInput(false);
        setShowGameOverLeaderboard(false);
        setPlayerName('');
        setSubmitError(null);
        setIsSubmitting(false);
        
        // Reconnect WebSocket for new game
        connectWebSocket();
    };

    // Keyboard controls handler
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Prevent page scrolling when using arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
                event.preventDefault();
            }

            if (gameState.gameOver) return;

            let direction: string;
            switch (event.key) {
                case 'ArrowUp':
                    direction = 'UP';
                    break;
                case 'ArrowDown':
                    direction = 'DOWN';
                    break;
                case 'ArrowLeft':
                    direction = 'LEFT';
                    break;
                case 'ArrowRight':
                    direction = 'RIGHT';
                    break;
                default:
                    return;
            }

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ direction }));
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.gameOver]);

    // Improved leaderboard fetch with error handling
    const fetchLeaderboard = async () => {
        console.log('🔄 Fetching leaderboard');
        try {
            const response = await fetch('http://localhost:8080/leaderboard', {
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });
            console.log('📡 Leaderboard response status:', response.status);
            console.log('📡 Leaderboard response headers:', Object.fromEntries([...response.headers.entries()]));
            
            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Received leaderboard data:', data);
            setLeaderboard(data);
        } catch (error) {
            console.error('❌ Failed to fetch leaderboard:', error);
            if (error instanceof Error) {
                console.error('❌ Error details:', {
                    message: error.message,
                    stack: error.stack,
                });
            }
        }
    };

    // Update the submitScore function to use the correct score
    const submitScore = async () => {
        if (!playerName.trim()) {
            console.log('❌ Score submission cancelled: Empty player name');
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
            console.log('Submitting score:', gameState.score); // Debug log
            const response = await fetch('http://localhost:8080/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: playerName.trim(),
                    score: gameState.score
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // On success, show the leaderboard
            await fetchLeaderboard();
            setShowGameOverLeaderboard(true);
            setShowNameInput(false);
        } catch (error) {
            console.error('Error submitting score:', error);
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit score');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add periodic leaderboard updates
    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(interval);
    }, []);

    // Update the game over handling
    useEffect(() => {
        if (gameState.gameOver) {
            setShowNameInput(true);
            setShowGameOverLeaderboard(false); // Ensure leaderboard is hidden when game ends
        }
    }, [gameState.gameOver]);

    // Game rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });  // Disable alpha for better performance
        if (!ctx) return;

        // Draw solid background
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

        // Draw subtle grid
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }

        // Draw snake with crisp edges
        gameState.snake.forEach((point, index) => {
            const isHead = index === 0;
            
            if (isHead) {
                ctx.fillStyle = '#34d399';  // Solid color for head
            } else {
                ctx.fillStyle = SNAKE_COLOR;
            }
            
            ctx.beginPath();
            ctx.roundRect(
                point.x * CELL_SIZE,
                point.y * CELL_SIZE,
                CELL_SIZE - 1,
                CELL_SIZE - 1,
                isHead ? 6 : 4
            );
            ctx.fill();

            // Add subtle glow effect for the head
            if (isHead) {
                ctx.shadowColor = '#34d399';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // Draw food with crisp edges
        ctx.fillStyle = FOOD_COLOR;
        ctx.shadowColor = '#fb7185';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(
            gameState.food.x * CELL_SIZE + CELL_SIZE/2,
            gameState.food.y * CELL_SIZE + CELL_SIZE/2,
            CELL_SIZE/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
    }, [gameState]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 blur-xl"></div>
                <div className="relative bg-black/40 p-8 rounded-3xl backdrop-blur-sm">
                    <div className="text-white text-3xl mb-6 flex justify-between items-center">
                        <div className="bg-black/40 px-6 py-2 rounded-2xl">
                            Score: <span className="text-green-400 font-bold">
                                {gameState.score}
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <canvas
                            ref={canvasRef}
                            width={GRID_SIZE * CELL_SIZE}
                            height={GRID_SIZE * CELL_SIZE}
                            className="rounded-2xl bg-[#0A0F1C]"
                            style={{ 
                                imageRendering: 'pixelated',
                                boxShadow: '0 0 40px rgba(16, 185, 129, 0.1)'
                            }}
                        />
                        {gameState.gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-2xl backdrop-blur-sm">
                                {showGameOverLeaderboard ? (
                                    <div className="w-full px-8">
                                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent text-center">
                                            Top Scores
                                        </h3>
                                        <div className="space-y-3 mb-6">
                                            {leaderboard.slice(0, 5).map((entry, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`flex justify-between items-center p-3 rounded-xl ${
                                                        entry.playerName === playerName ? 'bg-green-500/20' : 'bg-black/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-sm font-medium ${
                                                            index === 0 ? 'text-green-400' : 'text-gray-400'
                                                        }`}>
                                                            #{index + 1}
                                                        </span>
                                                        <span className="text-white">
                                                            {entry.playerName}
                                                        </span>
                                                    </div>
                                                    <span className="text-green-400 font-bold">
                                                        {entry.score}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={handleRestart}
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-2 px-6 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                                            >
                                                Play Again
                                            </button>
                                        </div>
                                    </div>
                                ) : showNameInput && (
                                    <>
                                        <div className="text-red-400 text-4xl font-bold mb-8 animate-pulse">
                                            Game Over!
                                        </div>
                                        <div className="bg-black/40 p-6 rounded-2xl flex flex-col items-center gap-4">
                                            <input
                                                type="text"
                                                placeholder="Enter your name"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                className="bg-black/60 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                                                maxLength={20}
                                                disabled={isSubmitting}
                                            />
                                            {submitError && (
                                                <div className="text-red-400 text-sm">
                                                    {submitError}
                                                </div>
                                            )}
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={submitScore}
                                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-2 px-6 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                                                    disabled={!playerName.trim() || isSubmitting}
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Score'}
                                                </button>
                                                <button
                                                    onClick={handleRestart}
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-2 px-6 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                                    disabled={isSubmitting}
                                                >
                                                    Play Again
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-6 text-gray-400 text-sm bg-black/40 px-6 py-3 rounded-full backdrop-blur-sm">
                Use arrow keys to control the snake
            </div>
        </div>
    );
};

export default Game;

import React, { useEffect, useRef, useState } from 'react';

// Types for game objects
interface Point {
    x: number; // Horizontal position on the game grid
    y: number; // Vertical position on the game grid
}

interface GameState {
    snake: Point[];      // Array of points representing the snake's body segments
    food: Point;         // Current position of the food
    score: number;       // Player's current score
    gameOver: boolean;   // Whether the game has ended
    direction: string;   // Current direction of snake movement
}

// Add new interfaces
interface ScoreEntry {
    playerName: string;
    score: number;
    date: string;
}

// Game configuration
const GRID_SIZE = 20;           // Number of cells in grid (both width and height)
const CELL_SIZE = 20;           // Size of each cell in pixels
const SNAKE_COLOR = '#10b981';  // Color of snake body segments
const FOOD_COLOR = '#fb7185';   // Color of food items
const GRID_COLOR = '#222';      // Color of grid lines
const BACKGROUND_COLOR = '#111'; // Game board background color
const SNAKE_HEAD_COLOR = '#34d399'; // Color of snake head
const SNAKE_GRADIENT_START = '#059669'; // Gradient start for 3D effect
const SNAKE_GRADIENT_END = '#10b981';   // Gradient end for 3D effect
const FOOD_GLOW_COLOR = '#fb7185';      // Glow color for food
const BOARD_PERSPECTIVE = 10;           // Subtle perspective effect value

// Game component handles the snake game logic and rendering
const Game: React.FC = () => {
    // Game state management
    const [gameState, setGameState] = useState<GameState>({
        snake: [],
        food: { x: 0, y: 0 },
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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Add loading and error states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // WebSocket connection handler
    const connectWebSocket = () => {
        // Create new WebSocket connection to game server
        const ws = new WebSocket('ws://localhost:8080/ws');
        
        // Handle incoming game state updates
        ws.onmessage = (event) => {
            const newState = JSON.parse(event.data);
            setGameState(newState);
            
            // Show name input when game ends
            if (newState.gameOver && !showNameInput && !showGameOverLeaderboard) {
                setShowNameInput(true);
            }
        };

        // Store WebSocket reference
        wsRef.current = ws;
    };

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket();
        return () => wsRef.current?.close();
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

            // Ignore input if game is over
            if (gameState.gameOver) return;

            // Map keyboard arrows to game directions
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

            // Send direction update to server if connection is active
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ direction }));
            }
        };

        // Add and remove keyboard event listener
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

        // Create 3D perspective effect
        const applyPerspective = () => {
            ctx.save();
            // Apply a subtle scaling to create depth illusion
            ctx.translate(GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2);
            ctx.scale(0.98, 0.98);
            ctx.translate(-GRID_SIZE * CELL_SIZE / 2, -GRID_SIZE * CELL_SIZE / 2);
            
            // Apply a subtle skew for perspective
            ctx.transform(1, 0, 0.01, 0.99, 0, 0);
        };
        
        // Reset transformations
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Draw board background with 3D effect
        // First draw a dark shadow below
        ctx.fillStyle = '#090909';
        ctx.fillRect(BOARD_PERSPECTIVE, BOARD_PERSPECTIVE, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        
        // Draw main board on top
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        
        // Add subtle vignette effect
        const gradient = ctx.createRadialGradient(
            GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2, 0,
            GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE * 0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

        // Apply perspective for game elements
        applyPerspective();

        // Draw subtle grid with depth effect
        ctx.strokeStyle = 'rgba(34, 34, 34, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            // Add varying opacity based on position to create depth
            const opacity = 0.2 + (i / GRID_SIZE) * 0.3;
            ctx.strokeStyle = `rgba(34, 34, 34, ${opacity})`;
            
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }

        // Draw snake with 3D effect
        gameState.snake.forEach((point, index) => {
            const isHead = index === 0;
            const segmentSize = CELL_SIZE - 1;
            
            // Create embossed effect for snake body
            const x = point.x * CELL_SIZE;
            const y = point.y * CELL_SIZE;
            
            // Add shadow for 3D effect
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.roundRect(
                x + 2, 
                y + 2, 
                segmentSize, 
                segmentSize, 
                isHead ? 6 : 4
            );
            ctx.fill();
            
            // Draw main body with gradient
            if (isHead) {
                // Radial gradient for head
                const headGradient = ctx.createRadialGradient(
                    x + segmentSize/2, y + segmentSize/2, 0,
                    x + segmentSize/2, y + segmentSize/2, segmentSize
                );
                headGradient.addColorStop(0, '#34d399');
                headGradient.addColorStop(1, '#059669');
                ctx.fillStyle = headGradient;
            } else {
                // Linear gradient for body
                const bodyGradient = ctx.createLinearGradient(
                    x, y, 
                    x + segmentSize, y + segmentSize
                );
                bodyGradient.addColorStop(0, SNAKE_GRADIENT_START);
                bodyGradient.addColorStop(1, SNAKE_GRADIENT_END);
                ctx.fillStyle = bodyGradient;
            }
            
            ctx.beginPath();
            ctx.roundRect(
                x,
                y,
                segmentSize,
                segmentSize,
                isHead ? 6 : 4
            );
            ctx.fill();

            // Add highlight for 3D effect
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(x, y + (isHead ? 6 : 4));
            ctx.lineTo(x + (isHead ? 6 : 4), y);
            ctx.lineTo(x + segmentSize - (isHead ? 6 : 4), y);
            ctx.lineTo(x + segmentSize, y + (isHead ? 6 : 4));
            ctx.closePath();
            ctx.fill();

            // Add subtle glow effect for the head
            if (isHead) {
                ctx.shadowColor = '#34d399';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.roundRect(
                    x,
                    y,
                    segmentSize,
                    segmentSize,
                    6
                );
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Add eye details for the head
                const eyeSize = 3;
                const eyeOffset = 5;
                ctx.fillStyle = '#000';
                
                // Position eyes based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                
                switch(gameState.direction) {
                    case 'UP':
                        leftEyeX = x + eyeOffset;
                        leftEyeY = y + eyeOffset;
                        rightEyeX = x + segmentSize - eyeOffset;
                        rightEyeY = y + eyeOffset;
                        break;
                    case 'DOWN':
                        leftEyeX = x + segmentSize - eyeOffset;
                        leftEyeY = y + segmentSize - eyeOffset;
                        rightEyeX = x + eyeOffset;
                        rightEyeY = y + segmentSize - eyeOffset;
                        break;
                    case 'LEFT':
                        leftEyeX = x + eyeOffset;
                        leftEyeY = y + eyeOffset;
                        rightEyeX = x + eyeOffset;
                        rightEyeY = y + segmentSize - eyeOffset;
                        break;
                    case 'RIGHT':
                        leftEyeX = x + segmentSize - eyeOffset;
                        leftEyeY = y + eyeOffset;
                        rightEyeX = x + segmentSize - eyeOffset;
                        rightEyeY = y + segmentSize - eyeOffset;
                        break;
                    default:
                        leftEyeX = x + eyeOffset;
                        leftEyeY = y + eyeOffset;
                        rightEyeX = x + segmentSize - eyeOffset;
                        rightEyeY = y + eyeOffset;
                }
                
                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw food with 3D effect
        const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE/2;
        const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE/2;
        const foodRadius = CELL_SIZE/2 - 2;
        
        // Pulsing animation effect
        const time = Date.now() / 1000;
        const pulseFactor = 1 + Math.sin(time * 3) * 0.1;
        
        // Shadow for 3D effect
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(
            foodX + 2,
            foodY + 2,
            foodRadius * pulseFactor,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Create a radial gradient for the food
        const foodGradient = ctx.createRadialGradient(
            foodX - foodRadius/3, foodY - foodRadius/3, 0,
            foodX, foodY, foodRadius * pulseFactor
        );
        foodGradient.addColorStop(0, '#ff94a0');
        foodGradient.addColorStop(1, '#e11d48');
        
        ctx.fillStyle = foodGradient;
        ctx.shadowColor = FOOD_GLOW_COLOR;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(
            foodX,
            foodY,
            foodRadius * pulseFactor,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Add highlight for 3D effect
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(
            foodX - foodRadius/3,
            foodY - foodRadius/3,
            foodRadius/2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Restore the context to remove perspective transformations
        ctx.restore();
    }, [gameState]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl"></div>
                <div className="relative bg-black/60 p-8 rounded-3xl backdrop-blur-md">
                    <div className="text-white text-3xl mb-6 flex justify-between items-center">
                        <div className="bg-black/60 px-6 py-2 rounded-2xl shadow-lg shadow-green-500/10">
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
                            className="rounded-2xl bg-[#0A0F1C] transform transition-transform hover:scale-[1.01] hover:rotate-[0.5deg]"
                            style={{ 
                                imageRendering: 'pixelated',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(16, 185, 129, 0.2) inset',
                                transform: 'perspective(1000px) rotateX(2deg)',
                                transformStyle: 'preserve-3d'
                            }}
                        />
                        {gameState.gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-2xl backdrop-blur-sm">
                                {showGameOverLeaderboard ? (
                                    <div className="w-full px-8 transform transition-all duration-500 animate-fadeIn">
                                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent text-center drop-shadow-lg">
                                            Top Scores
                                        </h3>
                                        <div className="space-y-3 mb-6 perspective-[1000px]">
                                            {leaderboard.slice(0, 5).map((entry, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`flex justify-between items-center p-3 rounded-xl 
                                                    ${entry.playerName === playerName ? 'bg-green-500/30' : 'bg-black/40'} 
                                                    border border-green-500/10 backdrop-blur-sm shadow-lg
                                                    transform transition-all duration-300
                                                    hover:translate-x-1 hover:-translate-y-1 hover:shadow-green-500/10
                                                    `}
                                                    style={{
                                                        transform: `perspective(1000px) rotateX(${index * 2}deg)`,
                                                        animationDelay: `${index * 0.1}s`
                                                    }}
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
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-2 px-6 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/20 transform hover:scale-105 hover:-translate-y-1"
                                            >
                                                Play Again
                                            </button>
                                        </div>
                                    </div>
                                ) : showNameInput && (
                                    <div className="transform transition-all duration-500 animate-fadeIn">
                                        <div className="text-red-400 text-4xl font-bold mb-8 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]">
                                            Game Over!
                                        </div>
                                        <div className="bg-black/60 p-8 rounded-2xl border border-red-500/10 flex flex-col items-center gap-4 shadow-xl backdrop-blur-md transform perspective-[1000px] rotateX-1">
                                            <input
                                                type="text"
                                                placeholder="Enter your name"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                className="bg-black/80 text-white px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-inner w-full text-center transform transition-all duration-300 focus:scale-105"
                                                maxLength={20}
                                                disabled={isSubmitting}
                                            />
                                            {submitError && (
                                                <div className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-2 backdrop-blur-sm border border-red-500/10">
                                                    {submitError}
                                                </div>
                                            )}
                                            <div className="flex gap-4 mt-4">
                                                <button
                                                    onClick={submitScore}
                                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-3 px-6 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-500/20 transform hover:scale-105 hover:-translate-y-1"
                                                    disabled={!playerName.trim() || isSubmitting}
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Score'}
                                                </button>
                                                <button
                                                    onClick={handleRestart}
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-6 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/20 transform hover:scale-105 hover:-translate-y-1"
                                                    disabled={isSubmitting}
                                                >
                                                    Play Again
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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

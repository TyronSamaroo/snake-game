import React, { useEffect, useRef, useState } from 'react';
import SoundManager, { SoundManagerHandle } from './SoundManager';
import GameSettings from './GameSettings';

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
    const [prevScore, setPrevScore] = useState<number>(0);
    const [prevDirection, setPrevDirection] = useState<string>('RIGHT');
    const [gameOverTime, setGameOverTime] = useState<string>("");
    const [gameOverEffect, setGameOverEffect] = useState<boolean>(false);
    const [flashCount, setFlashCount] = useState<number>(0);

    // Game customization state
    const [snakeColor, setSnakeColor] = useState<string>('#10b981');
    const [foodColor, setFoodColor] = useState<string>('#fb7185');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [eatSound, setEatSound] = useState<boolean>(true);
    const [gameOverSound, setGameOverSound] = useState<boolean>(true);
    const [backgroundMusic, setBackgroundMusic] = useState<boolean>(true);
    const [showSettings, setShowSettings] = useState<boolean>(false);

    // Refs for WebSocket and canvas
    const wsRef = useRef<WebSocket | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const soundManagerRef = useRef<SoundManagerHandle>(null);

    // Add loading and error states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Game configuration based on state
    const GRID_SIZE = 30;
    const CELL_SIZE = 25;
    const SNAKE_HEAD_COLOR = snakeColor === '#10b981' ? '#34d399' : lightenColor(snakeColor, 20);
    const SNAKE_GRADIENT_START = darkenColor(snakeColor, 10);
    const SNAKE_GRADIENT_END = snakeColor;
    const FOOD_GLOW_COLOR = foodColor;
    const BOARD_PERSPECTIVE = 10;

    // Helper function to lighten a color
    function lightenColor(color: string, percent: number): string {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(1 << 24 | (R < 255 ? R < 1 ? 0 : R : 255) << 16 | (G < 255 ? G < 1 ? 0 : G : 255) << 8 | (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    }

    // Helper function to darken a color
    function darkenColor(color: string, percent: number): string {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return `#${(1 << 24 | (R > 0 ? R : 0) << 16 | (G > 0 ? G : 0) << 8 | (B > 0 ? B : 0)).toString(16).slice(1)}`;
    }

    // WebSocket connection handler
    const connectWebSocket = () => {
        // Create new WebSocket connection to game server
        const ws = new WebSocket('ws://localhost:8080/ws');
        
        // Handle incoming game state updates
        ws.onmessage = (event) => {
            const newState = JSON.parse(event.data);
            
            // Save previous score for sound effects
            setPrevScore(gameState.score);
            
            // Check for direction change before updating state
            const directionChanged = newState.direction !== gameState.direction;
            
            // Update game state
            setGameState(newState);
            
            // Show name input when game ends
            if (newState.gameOver && !showNameInput && !showGameOverLeaderboard) {
                setShowNameInput(true);
            }
            
            // Remove move sound functionality
            if (directionChanged) {
                setPrevDirection(newState.direction);
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

    // Remove the P key navigation prevention effect since we no longer use P for settings
    useEffect(() => {
        // No need for P key prevention
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
            // Always prevent default behavior for game controls
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 's', 'S'].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
            }

            // Toggle settings with 'S' key (changed from 'P')
            if (event.key === 's' || event.key === 'S') {
                setShowSettings(prevState => !prevState);
                return;
            }

            // Ignore input if game is over or settings are open
            if (gameState.gameOver || showSettings) return;

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

        // Add event listener with capture phase to intercept events before they bubble
        window.addEventListener('keydown', handleKeyPress, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyPress, { capture: true });
    }, [gameState.gameOver, showSettings]);

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
            setGameOverTime(new Date().toISOString()); // Set the game over time
            
            // Trigger dramatic game over effects
            setGameOverEffect(true);
            
            // Create flashing effect
            let count = 0;
            const flashInterval = setInterval(() => {
                setFlashCount(prev => prev + 1);
                count++;
                if (count >= 5) {
                    clearInterval(flashInterval);
                }
            }, 200);
            
            return () => clearInterval(flashInterval);
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
        ctx.fillStyle = '#111';
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

        // Draw snake with enhanced 3D effect and better tail
        gameState.snake.forEach((point, index) => {
            const isHead = index === 0;
            const segmentSize = CELL_SIZE - 1;
            
            // Create embossed effect for snake body
            const x = point.x * CELL_SIZE;
            const y = point.y * CELL_SIZE;
            
            // Calculate segment type for enhanced tail rendering
            const isTail = index === gameState.snake.length - 1;
            const isNearTail = index >= Math.max(0, gameState.snake.length - 3);
            
            // Calculate segment connections for tapered tail
            const segmentScale = isTail ? 0.7 : isNearTail ? 0.85 : 1;
            const segmentRoundness = isHead ? 6 : isTail ? 10 : 4;
            
            // Add shadow for 3D effect
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            if (isTail) {
                // Circular tail end
                ctx.arc(
                    x + segmentSize/2 + 2, 
                    y + segmentSize/2 + 2,
                    (segmentSize/2) * segmentScale,
                    0,
                    Math.PI * 2
                );
            } else {
                // Regular segments
                ctx.roundRect(
                    x + 2, 
                    y + 2, 
                    segmentSize * (isNearTail ? segmentScale : 1), 
                    segmentSize * (isNearTail ? segmentScale : 1), 
                    segmentRoundness
                );
            }
            ctx.fill();
            
            // Draw main body with gradient
            if (isHead) {
                // Radial gradient for head
                const headGradient = ctx.createRadialGradient(
                    x + segmentSize/2, y + segmentSize/2, 0,
                    x + segmentSize/2, y + segmentSize/2, segmentSize
                );
                headGradient.addColorStop(0, SNAKE_HEAD_COLOR);
                headGradient.addColorStop(1, SNAKE_GRADIENT_START);
                ctx.fillStyle = headGradient;
            } else {
                // Linear gradient for body with variation based on position
                const segmentPosition = index / gameState.snake.length;
                const startColor = SNAKE_GRADIENT_START;
                const endColor = isTail ? lightenColor(SNAKE_GRADIENT_END, 10) : SNAKE_GRADIENT_END;
                
                const bodyGradient = ctx.createLinearGradient(
                    x, y, 
                    x + segmentSize, y + segmentSize
                );
                bodyGradient.addColorStop(0, startColor);
                bodyGradient.addColorStop(1, endColor);
                ctx.fillStyle = bodyGradient;
            }
            
            // Draw the segment
            ctx.beginPath();
            if (isTail) {
                // Circular tail end
                ctx.arc(
                    x + segmentSize/2, 
                    y + segmentSize/2,
                    (segmentSize/2) * segmentScale,
                    0,
                    Math.PI * 2
                );
            } else {
                // Regular segments with variable size for tapered tail
                ctx.roundRect(
                    x,
                    y,
                    segmentSize * (isNearTail ? segmentScale : 1),
                    segmentSize * (isNearTail ? segmentScale : 1),
                    segmentRoundness
                );
            }
            ctx.fill();

            // Add highlight for 3D effect
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            if (isTail) {
                // Circular highlight for tail
                ctx.beginPath();
                ctx.arc(
                    x + segmentSize/2 - 2, 
                    y + segmentSize/2 - 2,
                    (segmentSize/4) * segmentScale,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                // Linear highlight for body
                ctx.beginPath();
                ctx.moveTo(x, y + (isHead ? 6 : 4));
                ctx.lineTo(x + (isHead ? 6 : 4), y);
                ctx.lineTo(x + segmentSize - (isHead ? 6 : 4), y);
                ctx.lineTo(x + segmentSize, y + (isHead ? 6 : 4));
                ctx.closePath();
                ctx.fill();
            }

            // Add subtle glow effect for the head
            if (isHead) {
                ctx.shadowColor = SNAKE_HEAD_COLOR;
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
        
        // Create a radial gradient for the food using the selected color
        const foodBaseColor = foodColor;
        const foodHighlightColor = lightenColor(foodColor, 20);
        const foodShadowColor = darkenColor(foodColor, 20);
        
        const foodGradient = ctx.createRadialGradient(
            foodX - foodRadius/3, foodY - foodRadius/3, 0,
            foodX, foodY, foodRadius * pulseFactor
        );
        foodGradient.addColorStop(0, foodHighlightColor);
        foodGradient.addColorStop(1, foodShadowColor);
        
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
        
        // Add little stem to make it look more like an apple
        ctx.fillStyle = '#5c4033'; // Brown color for stem
        ctx.beginPath();
        ctx.rect(
            foodX - 1,
            foodY - foodRadius * pulseFactor - 3,
            2,
            4
        );
        ctx.fill();
        
        // Add a small leaf
        ctx.fillStyle = '#4ade80'; // Green color for leaf
        ctx.beginPath();
        ctx.ellipse(
            foodX + 2,
            foodY - foodRadius * pulseFactor - 2,
            3,
            1.5,
            Math.PI / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Restore the context to remove perspective transformations
        ctx.restore();
    }, [gameState, SNAKE_HEAD_COLOR, SNAKE_GRADIENT_START, SNAKE_GRADIENT_END, FOOD_GLOW_COLOR]);

    // Settings button handler
    const handleSettingsClick = () => {
        setShowSettings(true);
    };

    // Add a helper function to format dates nicely
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return "Unknown date";
        }
        
        // Format the date to be more readable
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if it's today or yesterday
        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            // For other dates, show the full date
            return date.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Sound Manager */}
            <SoundManager
                ref={soundManagerRef}
                gameState={gameState}
                eatSound={soundEnabled && eatSound}
                gameOverSound={soundEnabled && gameOverSound}
                backgroundMusic={soundEnabled && backgroundMusic}
                prevScore={prevScore}
                prevDirection={prevDirection}
            />
            
            {/* Game Settings Modal */}
            <GameSettings
                snakeColor={snakeColor}
                setSnakeColor={setSnakeColor}
                foodColor={foodColor}
                setFoodColor={setFoodColor}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                eatSound={eatSound}
                setEatSound={setEatSound}
                gameOverSound={gameOverSound}
                setGameOverSound={setGameOverSound}
                backgroundMusic={backgroundMusic}
                setBackgroundMusic={setBackgroundMusic}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
            />
            
            <div className="relative mt-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl"></div>
                <div className="relative bg-black/60 p-4 md:p-6 rounded-3xl backdrop-blur-md">
                    <div className="text-white text-3xl mb-4 flex justify-between items-center">
                        <div className="bg-black/60 px-6 py-2 rounded-2xl shadow-lg shadow-green-500/10">
                            Score: <span className="text-green-400 font-bold">
                                {gameState.score}
                            </span>
                        </div>
                        
                        <button 
                            onClick={handleSettingsClick}
                            className="bg-black/60 p-2 rounded-full shadow-lg shadow-green-500/10 hover:bg-black/80 transition-colors"
                            title="Game Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                    <div className="relative max-w-full overflow-auto">
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
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 's' || e.key === 'S') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowSettings(prev => !prev);
                                }
                            }}
                        />
                        
                        {gameState.gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-2xl backdrop-blur-sm">
                                {/* Dramatic flashing effect */}
                                {gameOverEffect && 
                                    <div className={`absolute inset-0 ${flashCount % 2 === 0 ? 'bg-red-600/50' : 'bg-transparent'} transition-colors duration-100 rounded-2xl z-10`}></div>
                                }
                                
                                {showGameOverLeaderboard ? (
                                    <div className="w-full px-8 transform transition-all duration-500 animate-fadeIn">
                                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent text-center drop-shadow-lg">
                                            Top Scores
                                        </h3>
                                        <div className="space-y-3 mb-6 perspective-[1000px]">
                                            {leaderboard.slice(0, 5).map((entry, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`flex flex-col p-3 rounded-xl 
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
                                                    <div className="flex justify-between items-center">
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
                                                    <div className="text-xs text-gray-400 mt-1 ml-6">
                                                        {formatDate(entry.date)}
                                                    </div>
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
                                    <div className="transform transition-all duration-500 animate-fadeIn z-20 relative">
                                        {/* Dramatic game over text with animation */}
                                        <div className="text-red-400 text-6xl font-bold mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(248,113,113,0.8)] tracking-wider transform -rotate-2">
                                            GAME OVER!
                                        </div>
                                        <div className="bg-black/80 p-8 rounded-2xl border border-red-500/30 flex flex-col items-center gap-4 shadow-xl backdrop-blur-md transform perspective-[1000px] rotateX-2">
                                            <div className="text-center mb-2">
                                                <div className="text-2xl text-white mb-1">Your Score: <span className="text-green-400 font-bold">{gameState.score}</span></div>
                                                <div className="text-xs text-gray-400">{formatDate(gameOverTime)}</div>
                                            </div>
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
                Use arrow keys to control the snake • Press S for settings
            </div>
        </div>
    );
};

export default Game;

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface SoundManagerProps {
  gameState: {
    gameOver: boolean;
    score: number;
    direction?: string;
  };
  eatSound: boolean;
  moveSound: boolean;
  gameOverSound: boolean;
  backgroundMusic: boolean;
  prevScore?: number;
  prevDirection?: string;
}

// Define the ref type for external access
export interface SoundManagerHandle {
  playMoveSound: () => void;
}

const SoundManager = forwardRef<SoundManagerHandle, SoundManagerProps>(({ 
  gameState, 
  eatSound, 
  moveSound, 
  gameOverSound,
  backgroundMusic,
  prevScore,
  prevDirection
}, ref) => {
  // Create refs for audio elements
  const eatAudioRef = useRef<HTMLAudioElement | null>(null);
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  // Expose the playMoveSound function to parent components
  useImperativeHandle(ref, () => ({
    playMoveSound: () => {
      if (moveSound && moveAudioRef.current && !gameState.gameOver) {
        moveAudioRef.current.currentTime = 0;
        moveAudioRef.current.play().catch(err => console.error("Error playing move sound:", err));
      }
    }
  }));

  // Initialize audio elements
  useEffect(() => {
    eatAudioRef.current = new Audio('/sounds/eat.mp3');
    moveAudioRef.current = new Audio('/sounds/move.mp3');
    gameOverAudioRef.current = new Audio('/sounds/game-over-arcade-6435.mp3');
    backgroundMusicRef.current = new Audio('/sounds/background-game-music.wav');

    // Set volume levels
    if (eatAudioRef.current) eatAudioRef.current.volume = 0.6;
    if (moveAudioRef.current) moveAudioRef.current.volume = 0.3;
    if (gameOverAudioRef.current) gameOverAudioRef.current.volume = 0.9;
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = 0.4;
      backgroundMusicRef.current.loop = true;
    }

    return () => {
      // Clean up audio resources
      [eatAudioRef.current, moveAudioRef.current, gameOverAudioRef.current, backgroundMusicRef.current].forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  // Handle background music
  useEffect(() => {
    if (backgroundMusic && backgroundMusicRef.current) {
      if (gameState.gameOver) {
        // Fade out music on game over
        const fadeOut = setInterval(() => {
          if (backgroundMusicRef.current && backgroundMusicRef.current.volume > 0.05) {
            backgroundMusicRef.current.volume -= 0.05;
          } else {
            if (backgroundMusicRef.current) {
              backgroundMusicRef.current.pause();
            }
            clearInterval(fadeOut);
          }
        }, 100);
      } else {
        // Start or resume background music
        backgroundMusicRef.current.volume = 0.4;
        backgroundMusicRef.current.play()
          .catch(err => console.error("Error playing background music:", err));
      }
    } else if (!backgroundMusic && backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
    }

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.volume = 0.4; // Reset volume for next time
      }
    };
  }, [backgroundMusic, gameState.gameOver]);

  // Play eat sound when score increases
  useEffect(() => {
    if (prevScore !== undefined && 
        gameState.score > prevScore && 
        eatSound && 
        eatAudioRef.current) {
      // Reset audio position and play
      eatAudioRef.current.currentTime = 0;
      eatAudioRef.current.play().catch(err => console.error("Error playing eat sound:", err));
    }
  }, [gameState.score, prevScore, eatSound]);

  // Play game over sound with enhanced dramatic effect
  useEffect(() => {
    if (gameState.gameOver && gameOverSound && gameOverAudioRef.current) {
      // Add a slight delay for dramatic effect
      setTimeout(() => {
        if (gameOverAudioRef.current) {
          gameOverAudioRef.current.currentTime = 0;
          gameOverAudioRef.current.play()
            .catch(err => console.error("Error playing game over sound:", err));
        }
      }, 300); // 300ms delay for dramatic effect
    }
  }, [gameState.gameOver, gameOverSound]);

  // We no longer need this implementation since we expose it via ref
  // and it will be called from Game.tsx only when direction changes
  /*
  // Play move sound when direction changes
  useEffect(() => {
    if (prevDirection && 
        gameState.direction && 
        prevDirection !== gameState.direction && 
        moveSound && 
        moveAudioRef.current && 
        !gameState.gameOver) {
      moveAudioRef.current.currentTime = 0;
      moveAudioRef.current.play().catch(err => console.error("Error playing move sound:", err));
    }
  }, [gameState.direction, prevDirection, moveSound, gameState.gameOver]);
  */

  return null; // This is a non-visual component
});

export default SoundManager; 
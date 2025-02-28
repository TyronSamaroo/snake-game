import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
}

interface ParticlesEffectProps {
  enabled: boolean;
  particleColor: string;
  gameState: {
    snake: Array<{x: number, y: number}>;
    food: {x: number, y: number};
    score: number;
    gameOver: boolean;
  };
  gridSize: number;
  cellSize: number;
  prevScore?: number;
}

const ParticlesEffect: React.FC<ParticlesEffectProps> = ({ 
  enabled, 
  particleColor,
  gameState, 
  gridSize, 
  cellSize,
  prevScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Create food particles
  const createFoodParticles = () => {
    if (!enabled || !gameState.food) return;
    
    const foodX = gameState.food.x * cellSize + cellSize / 2;
    const foodY = gameState.food.y * cellSize + cellSize / 2;
    
    // Create particles in a circular pattern
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2) * (i / 12);
      const speed = 0.5 + Math.random() * 1.5;
      
      particlesRef.current.push({
        x: foodX,
        y: foodY,
        size: 2 + Math.random() * 3,
        color: particleColor,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 0.7 + Math.random() * 0.5
      });
    }
  };

  // Create trail particles behind the snake
  const createSnakeTrailParticles = () => {
    if (!enabled || gameState.gameOver || !gameState.snake || gameState.snake.length === 0) return;
    
    // Only add trail particles every few frames to avoid too many particles
    if (Math.random() > 0.3) return;
    
    // Get the tail of the snake (excluding the head)
    const tail = gameState.snake.slice(1);
    
    // Add particles for random segments of the tail
    if (tail.length > 0) {
      const randomSegmentIndex = Math.floor(Math.random() * Math.min(tail.length, 3));
      const segment = tail[randomSegmentIndex];
      
      const x = segment.x * cellSize + cellSize / 2;
      const y = segment.y * cellSize + cellSize / 2;
      
      particlesRef.current.push({
        x: x + (Math.random() * cellSize - cellSize / 2) * 0.5,
        y: y + (Math.random() * cellSize - cellSize / 2) * 0.5,
        size: 1 + Math.random() * 2,
        color: particleColor + '80', // Add transparency
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        life: 1.0,
        maxLife: 0.3 + Math.random() * 0.3
      });
    }
  };

  // Create particles on food eaten
  useEffect(() => {
    if (prevScore !== undefined && gameState.score > prevScore) {
      // Create fireworks-like explosion particles when food is eaten
      const foodX = gameState.food.x * cellSize + cellSize / 2;
      const foodY = gameState.food.y * cellSize + cellSize / 2;
      
      // First wave - initial explosion
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const hue = Math.floor(Math.random() * 360); // Random color hue
        
        particlesRef.current.push({
          x: foodX,
          y: foodY,
          size: 3 + Math.random() * 4,
          color: `hsl(${hue}, 100%, 70%)`, // Bright colors
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          life: 1.0,
          maxLife: 0.7 + Math.random() * 0.5
        });
      }
      
      // Second wave - delayed secondary explosions (sparkles)
      setTimeout(() => {
        // Create multiple secondary explosion points
        for (let j = 0; j < 3; j++) {
          const offsetX = (Math.random() - 0.5) * cellSize * 3;
          const offsetY = (Math.random() - 0.5) * cellSize * 3;
          const secondaryX = foodX + offsetX;
          const secondaryY = foodY + offsetY;
          const secondaryHue = Math.floor(Math.random() * 360);
          
          // Create particles from each secondary point
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            particlesRef.current.push({
              x: secondaryX,
              y: secondaryY,
              size: 2 + Math.random() * 3,
              color: `hsl(${secondaryHue}, 100%, 70%)`,
              speedX: Math.cos(angle) * speed,
              speedY: Math.sin(angle) * speed,
              life: 1.0,
              maxLife: 0.4 + Math.random() * 0.3
            });
          }
        }
      }, 150);
    }
  }, [gameState.score, prevScore, cellSize, particleColor, enabled]);

  // Animation loop
  useEffect(() => {
    if (!enabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    
    // Clear previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create ambient particles
      createFoodParticles();
      createSnakeTrailParticles();
      
      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Update life
        particle.life -= 0.016 / particle.maxLife;
        
        // Remove dead particles
        if (particle.life <= 0) {
          particlesRef.current.splice(index, 1);
          return;
        }
        
        // Draw particle
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
      
      // Limit the number of particles
      if (particlesRef.current.length > 300) {
        particlesRef.current = particlesRef.current.slice(-300);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, gameState, gridSize, cellSize, particleColor]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticlesEffect; 
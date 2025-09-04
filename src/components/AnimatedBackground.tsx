import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/lib/stores';

interface AnimatedBackgroundProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulsePhase: number;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.opacity = Math.random() * 0.3 + 0.1;
    this.color = Math.random() > 0.7 ? 'rgba(16, 185, 129, ' : 'rgba(59, 130, 246, '; // Green or blue
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.pulsePhase += 0.02;

    // Wrap around edges
    if (this.x > this.canvas.width) this.x = 0;
    if (this.x < 0) this.x = this.canvas.width;
    if (this.y > this.canvas.height) this.y = 0;
    if (this.y < 0) this.y = this.canvas.height;

    // Pulse opacity
    this.opacity = (Math.sin(this.pulsePhase) * 0.2 + 0.3) * 0.4;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color + this.opacity + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  className = '', 
  intensity = 'medium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const { animationsEnabled } = useSettingsStore();

  useEffect(() => {
    if (!animationsEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    // Initialize particles based on intensity
    const particleCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 60;
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Particle(canvas));
    }

    // Animation loop
    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= 16) { // ~60fps
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particlesRef.current.forEach(particle => {
          particle.update();
          particle.draw(ctx);
        });

        // Draw connections between nearby particles
        if (intensity !== 'low') {
          drawConnections(ctx);
        }

        lastTime = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const drawConnections = (ctx: CanvasRenderingContext2D) => {
      const maxDistance = intensity === 'high' ? 120 : 80;
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const particle1 = particlesRef.current[i];
          const particle2 = particlesRef.current[j];
          
          const dx = particle1.x - particle2.x;
          const dy = particle1.y - particle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.1;
            ctx.save();
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle1.x, particle1.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Pause animation when tab is hidden (performance optimization)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [animationsEnabled, intensity]);

  if (!animationsEnabled) {
    return <div className={`animated-background ${className}`} />;
  }

  return (
    <div className={`animated-background ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};

export default AnimatedBackground;
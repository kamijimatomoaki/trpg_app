import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'spark' | 'heart' | 'diamond';
  gravity?: number;
  fade?: boolean;
}

interface ParticleSystemProps {
  type: 'magic' | 'celebration' | 'damage' | 'healing' | 'critical' | 'sparkle' | 'snow';
  intensity?: number;
  duration?: number;
  trigger?: boolean;
  position?: { x: number; y: number };
  containerRef?: React.RefObject<HTMLElement>;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type,
  intensity = 20,
  duration = 3000,
  trigger = false,
  position,
  containerRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationId = useRef<number | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  const particleConfigs = {
    magic: {
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
      shapes: ['star', 'spark', 'circle'] as const,
      velocity: { min: -2, max: 2 },
      life: { min: 60, max: 120 },
      size: { min: 2, max: 6 },
      gravity: 0.02,
      fade: true
    },
    celebration: {
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      shapes: ['circle', 'star', 'diamond'] as const,
      velocity: { min: -5, max: 5 },
      life: { min: 80, max: 150 },
      size: { min: 3, max: 8 },
      gravity: 0.1,
      fade: true
    },
    damage: {
      colors: ['#FF4757', '#FF6B6B', '#FF7675'],
      shapes: ['spark', 'circle'] as const,
      velocity: { min: -3, max: 3 },
      life: { min: 30, max: 60 },
      size: { min: 2, max: 5 },
      gravity: 0.05,
      fade: true
    },
    healing: {
      colors: ['#00D2FF', '#3A7BD5', '#26A0DA', '#48CAE4'],
      shapes: ['heart', 'circle', 'star'] as const,
      velocity: { min: -1, max: 1 },
      life: { min: 60, max: 100 },
      size: { min: 3, max: 7 },
      gravity: -0.02,
      fade: true
    },
    critical: {
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
      shapes: ['star', 'spark', 'diamond'] as const,
      velocity: { min: -4, max: 4 },
      life: { min: 40, max: 80 },
      size: { min: 4, max: 10 },
      gravity: 0.03,
      fade: true
    },
    sparkle: {
      colors: ['#FFFFFF', '#F8F8FF', '#E6E6FA', '#D3D3D3'],
      shapes: ['star', 'spark'] as const,
      velocity: { min: -1, max: 1 },
      life: { min: 80, max: 120 },
      size: { min: 1, max: 4 },
      gravity: 0.01,
      fade: true
    },
    snow: {
      colors: ['#FFFFFF', '#F0F8FF', '#E6E6FA'],
      shapes: ['circle', 'star'] as const,
      velocity: { min: -0.5, max: 0.5 },
      life: { min: 300, max: 500 },
      size: { min: 2, max: 6 },
      gravity: 0.02,
      fade: false
    }
  };

  const createParticle = (centerX: number, centerY: number, config: any): Particle => {
    const life = config.life.min + Math.random() * (config.life.max - config.life.min);
    
    return {
      id: Math.random(),
      x: centerX + (Math.random() - 0.5) * 50,
      y: centerY + (Math.random() - 0.5) * 50,
      vx: config.velocity.min + Math.random() * (config.velocity.max - config.velocity.min),
      vy: config.velocity.min + Math.random() * (config.velocity.max - config.velocity.min),
      life,
      maxLife: life,
      size: config.size.min + Math.random() * (config.size.max - config.size.min),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      shape: config.shapes[Math.floor(Math.random() * config.shapes.length)],
      gravity: config.gravity,
      fade: config.fade
    };
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = particle.fade ? particle.life / particle.maxLife : 1;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 1;

    switch (particle.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'star':
        ctx.translate(particle.x, particle.y);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const x = Math.cos(angle) * particle.size;
          const y = Math.sin(angle) * particle.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          
          const innerAngle = ((i + 0.5) * Math.PI * 2) / 5;
          const innerX = Math.cos(innerAngle) * (particle.size * 0.5);
          const innerY = Math.sin(innerAngle) * (particle.size * 0.5);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;

      case 'spark':
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size / 2;
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.size, particle.y);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.stroke();
        break;

      case 'heart':
        const size = particle.size;
        ctx.translate(particle.x, particle.y);
        ctx.beginPath();
        ctx.moveTo(0, size / 4);
        ctx.bezierCurveTo(-size, -size / 2, -size, size / 2, 0, size);
        ctx.bezierCurveTo(size, size / 2, size, -size / 2, 0, size / 4);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;

      case 'diamond':
        ctx.translate(particle.x, particle.y);
        ctx.beginPath();
        ctx.moveTo(0, -particle.size);
        ctx.lineTo(particle.size, 0);
        ctx.lineTo(0, particle.size);
        ctx.lineTo(-particle.size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;
    }

    ctx.restore();
  };

  const updateParticle = (particle: Particle): boolean => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    if (particle.gravity) {
      particle.vy += particle.gravity;
    }
    
    particle.life--;
    return particle.life > 0;
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current = particles.current.filter(particle => {
      const alive = updateParticle(particle);
      if (alive) {
        drawParticle(ctx, particle);
      }
      return alive;
    });

    if (particles.current.length > 0) {
      animationId.current = requestAnimationFrame(animate);
    } else {
      setIsActive(false);
    }
  };

  const startParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const config = particleConfigs[type];
    
    let centerX = rect.width / 2;
    let centerY = rect.height / 2;

    if (position) {
      centerX = position.x;
      centerY = position.y;
    }

    particles.current = [];
    
    for (let i = 0; i < intensity; i++) {
      particles.current.push(createParticle(centerX, centerY, config));
    }

    setIsActive(true);
    animate();

    // 指定時間後に新しいパーティクルの生成を停止
    setTimeout(() => {
      // パーティクルは自然に消えるまで続行
    }, duration);
  };

  useEffect(() => {
    if (trigger) {
      startParticles();
    }
  }, [trigger, type, intensity, duration, position]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef?.current || canvas.parentElement;
    if (!container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId.current !== null) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [containerRef]);

  return (
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 1000
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </Box>
  );
};

export default ParticleSystem;
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameStatus, 
  GameState, 
  Rocket, 
  Interceptor, 
  Explosion, 
  City, 
  Battery,
  Point
} from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  ROCKET_SPEED_MIN, 
  ROCKET_SPEED_MAX, 
  INTERCEPTOR_SPEED,
  EXPLOSION_MAX_RADIUS,
  EXPLOSION_GROW_SPEED,
  EXPLOSION_FADE_SPEED,
  SCORE_PER_ROCKET,
  WIN_SCORE,
  INITIAL_AMMO
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  // Helper to find nearest available battery
  const findNearestBattery = (targetX: number, batteries: Battery[]): Battery | null => {
    const available = batteries.filter(b => !b.destroyed && b.ammo > 0);
    if (available.length === 0) return null;

    return available.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.pos.x - targetX);
      const currDist = Math.abs(curr.pos.x - targetX);
      return currDist < prevDist ? curr : prev;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.status !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const targetX = (clientX - rect.left) * scaleX;
    const targetY = (clientY - rect.top) * scaleY;

    // Don't fire too low
    if (targetY > GAME_HEIGHT - 80) return;

    setGameState(prev => {
      const nearest = findNearestBattery(targetX, prev.batteries);
      if (!nearest) return prev;

      const angle = Math.atan2(targetY - nearest.pos.y, targetX - nearest.pos.x);
      
      const newInterceptor: Interceptor = {
        id: Math.random().toString(36).substr(2, 9),
        pos: { ...nearest.pos },
        startPos: { ...nearest.pos },
        target: { x: targetX, y: targetY },
        speed: INTERCEPTOR_SPEED,
        angle
      };

      return {
        ...prev,
        batteries: prev.batteries.map(b => 
          b.id === nearest.id ? { ...b, ammo: b.ammo - 1 } : b
        ),
        interceptors: [...prev.interceptors, newInterceptor]
      };
    });
  };

  const update = useCallback((time: number) => {
    if (gameState.status !== GameStatus.PLAYING) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    setGameState(prev => {
      // 1. Update Rockets
      let newRockets = prev.rockets.map(r => {
        const vx = Math.cos(r.angle) * r.speed;
        const vy = Math.sin(r.angle) * r.speed;
        return {
          ...r,
          pos: { x: r.pos.x + vx, y: r.pos.y + vy }
        };
      });

      // 2. Update Interceptors
      let newInterceptors = prev.interceptors.map(i => {
        const vx = Math.cos(i.angle) * i.speed;
        const vy = Math.sin(i.angle) * i.speed;
        return {
          ...i,
          pos: { x: i.pos.x + vx, y: i.pos.y + vy }
        };
      });

      // 3. Check Interceptor arrival -> Create Explosion
      const arrivingInterceptors = newInterceptors.filter(i => {
        const dist = Math.sqrt(Math.pow(i.pos.x - i.target.x, 2) + Math.pow(i.pos.y - i.target.y, 2));
        return dist < 5;
      });

      newInterceptors = newInterceptors.filter(i => {
        const dist = Math.sqrt(Math.pow(i.pos.x - i.target.x, 2) + Math.pow(i.pos.y - i.target.y, 2));
        return dist >= 5;
      });

      const newExplosionsFromInterceptors: Explosion[] = arrivingInterceptors.map(i => ({
        id: Math.random().toString(36).substr(2, 9),
        pos: i.target,
        radius: 0,
        maxRadius: EXPLOSION_MAX_RADIUS,
        growing: true,
        alpha: 1
      }));

      // 4. Update Explosions
      let newExplosions = [...prev.explosions, ...newExplosionsFromInterceptors].map(e => {
        if (e.growing) {
          const nextRadius = e.radius + EXPLOSION_GROW_SPEED;
          if (nextRadius >= e.maxRadius) {
            return { ...e, radius: e.maxRadius, growing: false };
          }
          return { ...e, radius: nextRadius };
        } else {
          return { ...e, alpha: e.alpha - EXPLOSION_FADE_SPEED };
        }
      }).filter(e => e.alpha > 0);

      // 5. Collision: Rockets vs Explosions
      let scoreGain = 0;
      newRockets = newRockets.filter(r => {
        const hit = newExplosions.some(e => {
          const dist = Math.sqrt(Math.pow(r.pos.x - e.pos.x, 2) + Math.pow(r.pos.y - e.pos.y, 2));
          return dist < e.radius;
        });
        if (hit) scoreGain += SCORE_PER_ROCKET;
        return !hit;
      });

      // 6. Collision: Rockets vs Ground (Cities/Batteries)
      const groundY = GAME_HEIGHT - 20;
      const rocketsHittingGround = newRockets.filter(r => r.pos.y >= groundY || (r.pos.y >= r.target.y - 5 && Math.abs(r.pos.x - r.target.x) < 10));
      newRockets = newRockets.filter(r => !rocketsHittingGround.includes(r));

      // Create explosions for ground hits
      const groundExplosions: Explosion[] = rocketsHittingGround.map(r => ({
        id: Math.random().toString(36).substr(2, 9),
        pos: r.pos,
        radius: 0,
        maxRadius: EXPLOSION_MAX_RADIUS * 0.8,
        growing: true,
        alpha: 1
      }));
      newExplosions = [...newExplosions, ...groundExplosions];

      // Damage cities and batteries
      let newCities = [...prev.cities];
      let newBatteries = [...prev.batteries];

      rocketsHittingGround.forEach(r => {
        // Check cities
        newCities = newCities.map(c => {
          const dist = Math.sqrt(Math.pow(r.pos.x - c.pos.x, 2) + Math.pow(r.pos.y - c.pos.y, 2));
          if (dist < 30) return { ...c, destroyed: true };
          return c;
        });
        // Check batteries
        newBatteries = newBatteries.map(b => {
          const dist = Math.sqrt(Math.pow(r.pos.x - b.pos.x, 2) + Math.pow(r.pos.y - b.pos.y, 2));
          if (dist < 30) return { ...b, destroyed: true };
          return b;
        });
      });

      // 7. Spawn new rockets
      // Reduced spawn rate by half as requested
      if (Math.random() < 0.0075 + (prev.level * 0.004)) {
        const startX = Math.random() * GAME_WIDTH;
        const targets = [...newCities.filter(c => !c.destroyed), ...newBatteries.filter(b => !b.destroyed)];
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)].pos;
          const angle = Math.atan2(target.y - 0, target.x - startX);
          // Faster rockets as level increases
          const speed = ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN) + (prev.level * 0.2);
          
          newRockets.push({
            id: Math.random().toString(36).substr(2, 9),
            pos: { x: startX, y: 0 },
            target,
            speed,
            angle,
            destroyed: false
          });
        }
      }

      // 8. Check Round End / Win / Loss
      const newScore = prev.score + scoreGain;
      let newStatus = prev.status;
      let newLevel = prev.level;
      let finalBatteries = newBatteries;

      // Check if current level is cleared (every 100 points or all rockets destroyed if we had a fixed wave)
      // Since it's continuous, let's trigger a "Round Clear" every 100 points
      const currentLevelGoal = prev.level * 100;
      if (newScore >= currentLevelGoal && newScore < WIN_SCORE) {
        newLevel = prev.level + 1;
        // Refill ammo for next round
        finalBatteries = newBatteries.map(b => ({ ...b, ammo: b.maxAmmo }));
      }

      if (newScore >= WIN_SCORE) {
        newStatus = GameStatus.WON;
      } else if (newBatteries.every(b => b.destroyed)) {
        newStatus = GameStatus.LOST;
      }

      return {
        ...prev,
        score: newScore,
        status: newStatus,
        level: newLevel,
        rockets: newRockets,
        interceptors: newInterceptors,
        explosions: newExplosions,
        cities: newCities,
        batteries: finalBatteries
      };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState.status, gameState.level, setGameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Sky
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Distant Mountains
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - 20);
    ctx.lineTo(150, GAME_HEIGHT - 250);
    ctx.lineTo(350, GAME_HEIGHT - 20);
    ctx.lineTo(550, GAME_HEIGHT - 300);
    ctx.lineTo(750, GAME_HEIGHT - 20);
    ctx.lineTo(800, GAME_HEIGHT - 150);
    ctx.lineTo(800, GAME_HEIGHT - 20);
    ctx.fill();

    // Draw Near Mountains
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - 20);
    ctx.lineTo(100, GAME_HEIGHT - 150);
    ctx.lineTo(250, GAME_HEIGHT - 20);
    ctx.lineTo(450, GAME_HEIGHT - 200);
    ctx.lineTo(650, GAME_HEIGHT - 20);
    ctx.lineTo(750, GAME_HEIGHT - 120);
    ctx.lineTo(800, GAME_HEIGHT - 20);
    ctx.fill();

    // Draw Ground
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);

    // Draw Cities
    gameState.cities.forEach(city => {
      if (!city.destroyed) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(city.pos.x - 15, city.pos.y - 10, 30, 10);
        ctx.fillRect(city.pos.x - 10, city.pos.y - 20, 20, 10);
      } else {
        ctx.fillStyle = '#444';
        ctx.fillRect(city.pos.x - 15, city.pos.y - 5, 30, 5);
      }
    });

    // Draw Batteries
    gameState.batteries.forEach(battery => {
      if (!battery.destroyed) {
        ctx.fillStyle = '#10b981';
        // Base
        ctx.beginPath();
        ctx.arc(battery.pos.x, battery.pos.y, 20, Math.PI, 0);
        ctx.fill();
        // Turret
        ctx.fillStyle = '#059669';
        ctx.fillRect(battery.pos.x - 5, battery.pos.y - 25, 10, 15);
        
        // Ammo indicator
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(battery.ammo.toString(), battery.pos.x, battery.pos.y + 15);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(battery.pos.x, battery.pos.y, 15, Math.PI, 0);
        ctx.fill();
      }
    });

    // Draw Rockets
    gameState.rockets.forEach(rocket => {
      const isLarge = rocket.pos.y > GAME_HEIGHT / 3;
      const sizeMultiplier = isLarge ? 2 : 1;

      // Head only (no trail)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(rocket.pos.x, rocket.pos.y, 5 * sizeMultiplier, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Interceptors
    gameState.interceptors.forEach(i => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(i.pos.x, i.pos.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Target X
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i.target.x - 8, i.target.y - 8);
      ctx.lineTo(i.target.x + 8, i.target.y + 8);
      ctx.moveTo(i.target.x + 8, i.target.y - 8);
      ctx.lineTo(i.target.x - 8, i.target.y + 8);
      ctx.stroke();
      ctx.lineWidth = 1; // Reset for next draws
    });

    // Draw Explosions
    gameState.explosions.forEach(e => {
      const gradient = ctx.createRadialGradient(e.pos.x, e.pos.y, 0, e.pos.x, e.pos.y, e.radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${e.alpha})`);
      gradient.addColorStop(0.2, `rgba(255, 200, 50, ${e.alpha})`);
      gradient.addColorStop(0.6, `rgba(255, 50, 0, ${e.alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [gameState]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        className="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl border border-white/10"
      />
    </div>
  );
};

export default GameCanvas;

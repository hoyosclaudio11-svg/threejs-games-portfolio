import React, { useEffect, useRef } from 'react';
import { HeroCommander, SquadMember, Enemy } from '../types/game';

interface MinimapProps {
  hero: HeroCommander;
  squad: SquadMember[];
  enemies: Enemy[];
}

export const Minimap: React.FC<MinimapProps> = ({ hero, squad, enemies }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 110;
    const worldRadius = 32; // world coordinate limit
    const center = size / 2;
    const scale = (size * 0.45) / worldRadius;

    ctx.clearRect(0, 0, size, size);

    // Background circle
    ctx.beginPath();
    ctx.arc(center, center, size * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.stroke();

    // Concentric grid rings
    ctx.beginPath();
    ctx.arc(center, center, size * 0.25, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.stroke();

    // 1. Village Core (Center)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(center - 3.5, center - 3.5, 7, 7);

    // 2. Squad Members (Cyan / Role dots)
    squad.forEach(m => {
      if (!m.isUnlocked) return;
      const mx = center + m.position.x * scale;
      const mz = center + m.position.z * scale;
      ctx.beginPath();
      ctx.arc(mx, mz, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#38bdf8';
      ctx.fill();
    });

    // 3. Hero Commander (Gold Star / Dot)
    const hx = center + hero.position.x * scale;
    const hz = center + hero.position.z * scale;
    ctx.beginPath();
    ctx.arc(hx, hz, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Hero forward heading line
    ctx.beginPath();
    ctx.moveTo(hx, hz);
    ctx.lineTo(hx + Math.sin(hero.rotation) * 8, hz + Math.cos(hero.rotation) * 8);
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    // 4. Enemies (Red dots / Boss Crimson Skull)
    enemies.forEach(e => {
      const ex = center + e.position.x * scale;
      const ez = center + e.position.z * scale;

      if (e.isBoss) {
        ctx.beginPath();
        ctx.arc(ex, ez, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ex, ez, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#f87171';
        ctx.fill();
      }
    });
  }, [hero.position, hero.rotation, squad, enemies]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-1.5 border border-slate-700/80 shadow-2xl flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        width={110} 
        height={110} 
        className="rounded-full shadow-inner"
      />
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { ARENA_RADIUS } from '../game/constants';

interface MinimapProps {
  engine: GameEngine | null;
}

export const Minimap: React.FC<MinimapProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const renderMinimap = () => {
      animId = requestAnimationFrame(renderMinimap);
      if (!canvasRef.current || !engine) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const scale = (size * 0.44) / ARENA_RADIUS;

      ctx.clearRect(0, 0, size, size);

      // 1. Radar Circular Background
      ctx.fillStyle = 'rgba(5, 20, 12, 0.75)';
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Range rings
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.beginPath();
      ctx.arc(center, center, center * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Nest (Center Golden Core)
      ctx.fillStyle = engine.nestStats.isUnderAttack ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(center, center, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Shield ring
      if (engine.nestStats.shield > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(center, center, 7.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Enemies (Red/Orange/Purple dots)
      engine.enemyManager.enemies.forEach((enemy) => {
        const ex = center + enemy.position.x * scale;
        const ey = center + enemy.position.z * scale;

        if (enemy.type.startsWith('boss')) {
          // Boss: Larger pulsing skull/circle
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.stats.isFlying) {
          // Flying wasp/bee: Yellow
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ground ants/beetles: Red
          ctx.fillStyle = enemy.type === 'beetle_tank' ? '#818cf8' : '#ef4444';
          ctx.beginPath();
          ctx.arc(ex, ey, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Biomass Orbs (Glowing green tiny dots)
      ctx.fillStyle = '#4ade80';
      engine.enemyManager.biomassOrbs.forEach((orb) => {
        const ox = center + orb.position.x * scale;
        const oy = center + orb.position.z * scale;
        ctx.fillRect(ox - 1, oy - 1, 2, 2);
      });

      // 5. Mantis Player (Bright Emerald Dot with Aim Line)
      const px = center + engine.playerPosition.x * scale;
      const py = center + engine.playerPosition.z * scale;

      // Aim Line
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + engine.lookDirection.x * 12, py + engine.lookDirection.z * 12);
      ctx.stroke();

      // Mantis Body Dot
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px, py, 4.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    renderMinimap();
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  return (
    <div className="relative p-1 rounded-xl bg-black/60 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-950/40">
      <div className="text-[10px] font-gaming text-emerald-400 font-bold uppercase tracking-wider mb-1 text-center">
        Bio-Radar
      </div>
      <canvas
        ref={canvasRef}
        width={110}
        height={110}
        className="block rounded-lg"
      />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { TrackStage, VehiclePhysicsState, GhostPoint } from '../types/game';

interface MiniMapProps {
  track: TrackStage;
  car: VehiclePhysicsState;
  ghost: GhostPoint | null;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  track,
  car,
  ghost,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Calculate bounds of track points
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    track.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const padding = 16;
    const trackW = maxX - minX || 1;
    const trackH = maxY - minY || 1;
    const scale = Math.min((width - padding * 2) / trackW, (height - padding * 2) / trackH);

    const toMapX = (x: number) => padding + (x - minX) * scale;
    const toMapY = (y: number) => padding + (y - minY) * scale;

    // Draw Track Line
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toMapX(track.points[0].x), toMapY(track.points[0].y));
    for (let i = 1; i < track.points.length; i++) {
      ctx.lineTo(toMapX(track.points[i].x), toMapY(track.points[i].y));
    }
    ctx.stroke();

    // Draw Inner Track Path
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toMapX(track.points[0].x), toMapY(track.points[0].y));
    for (let i = 1; i < track.points.length; i++) {
      ctx.lineTo(toMapX(track.points[i].x), toMapY(track.points[i].y));
    }
    ctx.stroke();

    // Draw Sector Gates
    track.sectors.forEach((sec) => {
      const idx = Math.min(
        track.points.length - 1,
        Math.floor((sec.distanceMeters / track.totalDistanceMeters) * track.points.length)
      );
      const p = track.points[idx];
      if (p) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(toMapX(p.x), toMapY(p.y), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Start and Finish dots
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(toMapX(track.points[0].x), toMapY(track.points[0].y), 4, 0, Math.PI * 2);
    ctx.fill();

    const lastPoint = track.points[track.points.length - 1];
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(toMapX(lastPoint.x), toMapY(lastPoint.y), 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Ghost Car position (if present)
    if (ghost) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(toMapX(ghost.x), toMapY(ghost.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Player Car position and heading
    const carMapX = toMapX(car.x);
    const carMapY = toMapY(car.y);

    ctx.save();
    ctx.translate(carMapX, carMapY);
    ctx.rotate(car.angle);

    // Car dot
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow pointer
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    ctx.restore();
  }, [track, car, ghost]);

  return (
    <div
      className={`relative p-2 rounded-xl bg-slate-950/80 border border-white/15 backdrop-blur-md shadow-lg ${className}`}
    >
      <div className="absolute top-1.5 left-2.5 text-[9px] font-mono-data font-bold text-slate-400 uppercase tracking-wider">
        RADAR // {track.country}
      </div>
      <canvas
        ref={canvasRef}
        width={130}
        height={130}
        className="w-[120px] h-[120px] block mt-2"
      />
    </div>
  );
};

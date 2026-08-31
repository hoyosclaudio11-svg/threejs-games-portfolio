import React, { useEffect, useRef } from 'react';
import { TacticalEngine } from '../game/engine';
import { hapticsManager } from '../services/haptics';

interface TacticalCanvasProps {
  engine: TacticalEngine;
  width: number;
  height: number;
}

export const TacticalCanvas: React.FC<TacticalCanvasProps> = ({ engine, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ x: engine.p1.x, y: engine.p1.y, zoom: 1.0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Handle Screen Shake / Camera trauma
      const shake = hapticsManager.update(dt);

      // Camera calculations: center between P1 and P2 (or P1 in solo if P2 is far)
      const p1 = engine.p1;
      const p2 = engine.p2;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      // Dynamic zoom to keep both players nicely framed (zoom between 0.7 and 1.1)
      let targetZoom = 1.0;
      if (dist > 500) {
        targetZoom = Math.max(0.65, 1.0 - (dist - 500) / 1400);
      }

      // Smooth camera interpolation
      const cam = cameraRef.current;
      cam.x += (midX - cam.x) * 0.1;
      cam.y += (midY - cam.y) * 0.1;
      cam.zoom += (targetZoom - cam.zoom) * 0.08;

      // Canvas dimensions
      const cw = canvas.width;
      const ch = canvas.height;

      ctx.save();
      // Background base
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, cw, ch);

      // Apply camera transform with shake
      ctx.translate(cw / 2 + shake.offsetX, ch / 2 + shake.offsetY);
      ctx.rotate(shake.angle);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // --- 1. Draw Map Floor Grid & Blueprint Lines ---
      drawBlueprintFloor(ctx, engine);

      // --- 2. Draw Extraction LZ ---
      drawExtractionZone(ctx, engine);

      // --- 3. Draw Sync Terminals ---
      drawSyncTerminals(ctx, engine, now);

      // --- 4. Draw Laser Grids ---
      drawLaserGrids(ctx, engine, now);

      // --- 5. Draw Doors & Walls ---
      drawDoorsAndWalls(ctx, engine);

      // --- 6. Draw Security Cameras with Sweeping Cones ---
      drawCameras(ctx, engine);

      // --- 7. Draw Enemy Vision Cones & Enemies ---
      drawEnemies(ctx, engine);

      // --- 8. Draw Loot Items ---
      drawLootItems(ctx, engine, now);

      // --- 9. Draw Smoke Clouds ---
      drawSmokeClouds(ctx, engine);

      // --- 10. Draw Players with Flashlights ---
      drawPlayers(ctx, engine, now);

      // --- 11. Draw Bullets & Projectiles ---
      drawBullets(ctx, engine);

      // --- 12. Draw Particle System ---
      drawParticles(ctx, engine);

      // --- 13. Draw Tactical Darkness / Flashlight Shadow Mask ---
      drawDarknessAndLights(ctx, engine);

      ctx.restore();

      // --- 14. Screen-Space Overlay: Alarm Flash & Post-Processing ---
      drawScreenSpaceEffects(ctx, engine, cw, ch, now);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block bg-black cursor-crosshair select-none"
    />
  );
};

// --- Sub-renderers ---

function drawBlueprintFloor(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  const mapW = engine.mission.mapWidth;
  const mapH = engine.mission.mapHeight;

  // Floor tile
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, mapW, mapH);

  // Subtle grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = 40;
  for (let x = 0; x <= mapW; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, mapH);
  }
  for (let y = 0; y <= mapH; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(mapW, y);
  }
  ctx.stroke();

  // Perimeter caution stripes
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, mapW, mapH);
}

function drawExtractionZone(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  const lz = engine.extractionZone;
  if (!lz.isActive) return;

  const pulse = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;

  ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + pulse * 0.1})`;
  ctx.fillRect(lz.x, lz.y, lz.width, lz.height);

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(lz.x, lz.y, lz.width, lz.height);
  ctx.setLineDash([]);

  // Heli pad / Extraction icon
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 16px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ EXTRACCIÓN LZ', lz.x + lz.width / 2, lz.y + lz.height / 2 - 10);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText(lz.name, lz.x + lz.width / 2, lz.y + lz.height / 2 + 10);

  // Evac progress bar if any operative is inside
  if (lz.evacProgress > 0) {
    const bw = lz.width - 20;
    const bh = 8;
    const bx = lz.x + 10;
    const by = lz.y + lz.height - 20;

    ctx.fillStyle = '#064e3b';
    ctx.fillRect(bx, by, bw, bh);

    ctx.fillStyle = '#34d399';
    ctx.fillRect(bx, by, (bw * lz.evacProgress) / 100, bh);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }
}

function drawSyncTerminals(ctx: CanvasRenderingContext2D, engine: TacticalEngine, now: number) {
  engine.terminals.forEach(term => {
    const pulse = Math.sin(now * 0.008) * 4;

    ctx.save();
    ctx.translate(term.x, term.y);

    // Outer range aura
    ctx.fillStyle = term.isCompleted
      ? 'rgba(16, 185, 129, 0.08)'
      : term.isActivated
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(56, 189, 248, 0.06)';
    ctx.beginPath();
    ctx.arc(0, 0, term.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Base console
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = term.isCompleted ? '#10b981' : term.isActivated ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Terminal Screen Icon
    ctx.fillStyle = term.isCompleted ? '#10b981' : term.isActivated ? '#f59e0b' : '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(term.isCompleted ? '✓' : 'SYNC', 0, 0);

    // Active countdown timer ring
    if (term.isActivated && !term.isCompleted) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * term.progress);
      ctx.stroke();

      // Flashing text banner above terminal
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('¡COMPAÑERO SINCRONIZA AHORA!', 0, -34);
    }

    // Terminal Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(term.label, 0, 28);

    ctx.restore();
  });
}

function drawLaserGrids(ctx: CanvasRenderingContext2D, engine: TacticalEngine, now: number) {
  engine.lasers.forEach(laser => {
    if (!laser.isActive) return;

    const flicker = 0.75 + Math.sin(now * 0.02) * 0.25;

    ctx.strokeStyle = laser.color;
    ctx.lineWidth = 3 * flicker;
    ctx.shadowColor = laser.color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();

    // Core beam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset
  });
}

function drawDoorsAndWalls(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  // Walls
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;

  engine.walls.forEach(w => {
    ctx.fillRect(w.x, w.y, w.width, w.height);
    ctx.strokeRect(w.x, w.y, w.width, w.height);

    if (w.isCover) {
      // Cover pattern
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w.x + 4, w.y + 4, w.width - 8, w.height - 8);
      ctx.fillStyle = '#1e293b';
    }
  });

  // Doors
  engine.doors.forEach(d => {
    if (d.isOpen) {
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(d.x, d.y, d.width, d.height);
    } else {
      ctx.fillStyle = d.isLocked ? '#7f1d1d' : '#1e293b';
      ctx.strokeStyle = d.isLocked ? '#ef4444' : '#64748b';
      ctx.lineWidth = 2;
      ctx.fillRect(d.x, d.y, d.width, d.height);
      ctx.strokeRect(d.x, d.y, d.width, d.height);

      if (d.isLocked) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOCK', d.x + d.width / 2, d.y + d.height / 2);
      }
    }
  });
}

function drawCameras(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  engine.cameras.forEach(cam => {
    // Camera Base
    ctx.save();
    ctx.translate(cam.x, cam.y);

    if (!cam.isHacked) {
      // Vision Cone Arc
      const coneColor = cam.detectionLevel > 50
        ? 'rgba(239, 68, 68, 0.22)'
        : cam.detectionLevel > 0
        ? 'rgba(245, 158, 11, 0.18)'
        : 'rgba(56, 189, 248, 0.12)';

      ctx.fillStyle = coneColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, cam.viewDistance, cam.angle - cam.viewFov / 2, cam.angle + cam.viewFov / 2);
      ctx.closePath();
      ctx.fill();

      // Scanline arc edge
      ctx.strokeStyle = cam.detectionLevel > 50 ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, cam.viewDistance, cam.angle - cam.viewFov / 2, cam.angle + cam.viewFov / 2);
      ctx.stroke();
    }

    // Camera body
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.isHacked ? '#64748b' : '#0284c7';
    ctx.fillRect(-6, -6, 16, 12);

    // Camera lens dot
    ctx.fillStyle = cam.isHacked ? '#475569' : cam.detectionLevel > 50 ? '#ef4444' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(10, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Hacked indicator
    if (cam.isHacked) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`EMP (${Math.ceil(cam.hackTimer)}s)`, cam.x, cam.y - 14);
    }
  });
}

function drawEnemies(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  engine.enemies.forEach(enemy => {
    if (enemy.hp <= 0) {
      // Dead body decal
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // 1. Enemy Vision Cone (unless dead or stunned)
    if (!enemy.isStunned) {
      const coneColor = enemy.state === 'combat' || engine.isAlarmLockdown
        ? 'rgba(239, 68, 68, 0.2)'
        : enemy.state === 'suspicious'
        ? 'rgba(245, 158, 11, 0.16)'
        : 'rgba(250, 204, 21, 0.08)';

      ctx.fillStyle = coneColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, enemy.viewDistance, enemy.angle - enemy.viewAngle / 2, enemy.angle + enemy.viewAngle / 2);
      ctx.closePath();
      ctx.fill();

      // Vision cone outer boundary
      ctx.strokeStyle = enemy.state === 'combat' ? '#ef4444' : enemy.state === 'suspicious' ? '#f59e0b' : '#eab308';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.viewDistance, enemy.angle - enemy.viewAngle / 2, enemy.angle + enemy.viewAngle / 2);
      ctx.stroke();
    }

    // 2. Enemy Body & Weapon
    ctx.rotate(enemy.angle);

    // Weapon barrel
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 2, 14, 4);

    // Body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Armor plate / vest
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -10, 12, 20);

    // Helmet
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(2, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. State Indicators (?, !, Stunned, HP bar)
    if (enemy.isStunned) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ STUN', enemy.x, enemy.y - 22);
    } else if (enemy.state === 'suspicious') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', enemy.x, enemy.y - 22);
    } else if (enemy.state === 'combat') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', enemy.x, enemy.y - 22);
    }

    // HP Bar if damaged
    if (enemy.hp < enemy.maxHp) {
      const bw = 28;
      const bh = 4;
      const bx = enemy.x - bw / 2;
      const by = enemy.y - 20;

      ctx.fillStyle = '#450a0a';
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx, by, (bw * enemy.hp) / enemy.maxHp, bh);
    }
  });
}

function drawLootItems(ctx: CanvasRenderingContext2D, engine: TacticalEngine, now: number) {
  engine.loot.forEach(loot => {
    if (loot.isCollected) return;

    const bob = Math.sin(now * 0.006 + loot.x) * 3;
    const pulse = 0.5 + Math.sin(now * 0.008) * 0.5;

    ctx.save();
    ctx.translate(loot.x, loot.y + bob);

    // Glow aura
    ctx.fillStyle = loot.isPrimaryObjective
      ? `rgba(245, 158, 11, ${0.2 + pulse * 0.2})`
      : `rgba(52, 211, 153, ${0.15 + pulse * 0.15})`;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Item shape
    if (loot.isPrimaryObjective) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(-9, -9, 18, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-7, -5, 14, 10);
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-7, -5, 14, 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
    }

    // Name & Value tag
    ctx.fillStyle = loot.isPrimaryObjective ? '#fbbf24' : '#6ee7b7';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`$${loot.value.toLocaleString()}`, 0, 16);

    ctx.restore();
  });
}

function drawSmokeClouds(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  engine.smokeClouds.forEach(sc => {
    const alpha = Math.min(0.85, sc.duration / 2.0);
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.75})`;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.fillStyle = `rgba(203, 213, 225, ${alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sc.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayers(ctx: CanvasRenderingContext2D, engine: TacticalEngine, now: number) {
  [engine.p1, engine.p2].forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.isDowned) {
      // Downed pulse
      const pulse = 0.5 + Math.sin(now * 0.01) * 0.4;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Incapacitated body
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bleedout circular bar
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.downedTimer / 35));
      ctx.stroke();

      // Revive progress ring if partner is reviving
      if (p.reviveProgress > 0) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.reviveProgress);
        ctx.stroke();
      }

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`REVIVE [${Math.ceil(p.downedTimer)}s]`, 0, -28);

      ctx.restore();
      return;
    }

    // 1. Tactical Flashlight Cone
    if (p.isFlashlightOn) {
      const coneAngle = 0.65;
      const coneDist = 280;

      const grad = ctx.createRadialGradient(0, 0, 10, Math.cos(p.angle) * coneDist, Math.sin(p.angle) * coneDist, coneDist);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.5, 'rgba(224, 242, 254, 0.2)');
      grad.addColorStop(1, 'rgba(224, 242, 254, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, coneDist, p.angle - coneAngle / 2, p.angle + coneAngle / 2);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Operative Body
    ctx.rotate(p.angle);

    // Weapon
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 4, 15, 5);

    // Laser aim line
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(25, 6);
    ctx.lineTo(120, 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Body circle
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Tactical Vest & Shoulder Pads
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-9, -11, 13, 22);

    // Head / Helmet
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(3, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Class emblem on head
    ctx.fillStyle = p.color;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.id === 1 ? 'P1' : 'P2', 3, 0);

    ctx.restore();

    // Reload Indicator
    if (p.isReloading) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.reloadProgress);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RECARGANDO', p.x, p.y - 24);
    }
  });
}

function drawBullets(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  engine.bullets.forEach(b => {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - (b.vx / 60) * 0.6, b.y - (b.vy / 60) * 0.6);
    ctx.stroke();
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, engine: TacticalEngine) {
  engine.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha ?? p.life / p.maxLife;
    ctx.fillStyle = p.color;

    if (p.type === 'spark' || p.type === 'flash') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'blood') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else if (p.type === 'emp') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawDarknessAndLights(
  ctx: CanvasRenderingContext2D,
  engine: TacticalEngine
) {
  // If in thermal / recon active mode, skip heavy darkness
  if (engine.reconActiveTimer > 0) return;

  const mapW = engine.mission.mapWidth;
  const mapH = engine.mission.mapHeight;

  // Dark ambient shroud
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(4, 7, 14, 0.35)';
  ctx.fillRect(0, 0, mapW, mapH);
  ctx.restore();
}

function drawScreenSpaceEffects(
  ctx: CanvasRenderingContext2D,
  engine: TacticalEngine,
  cw: number,
  ch: number,
  now: number
) {
  // 1. Alarm Code Red Pulsing Vignette
  if (engine.isAlarmLockdown) {
    const pulse = 0.5 + Math.sin(now * 0.007) * 0.4;
    const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.3, cw / 2, ch / 2, cw * 0.7);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    grad.addColorStop(1, `rgba(239, 68, 68, ${pulse * 0.35})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }

  // 2. Recon Active Thermal Visor tint
  if (engine.reconActiveTimer > 0) {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.fillRect(0, 0, cw, ch);

    // Thermal scanline
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
    ctx.lineWidth = 1;
    const yScan = (now * 0.15) % ch;
    ctx.beginPath();
    ctx.moveTo(0, yScan);
    ctx.lineTo(cw, yScan);
    ctx.stroke();
  }

  // 3. Scanline CRT Overlay
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.018)';
  ctx.lineWidth = 1;
  for (let y = 0; y < ch; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }
}

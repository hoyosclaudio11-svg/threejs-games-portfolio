import {
  TrackStage,
  VehiclePhysicsState,
  CarSpec,
  GhostPoint,
  GameSettings,
} from '../types/game';
import { ParticleSystem } from './particles';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private skidCanvas: HTMLCanvasElement;
  private skidCtx: CanvasRenderingContext2D;

  // Camera state
  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraZoom: number = 1.0;
  private cameraAngle: number = 0;
  private screenShakeMagnitude: number = 0;
  private screenShakeDuration: number = 0;

  // Weather particles
  private weatherParticles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    // Create offscreen persistent skidmark buffer
    this.skidCanvas = document.createElement('canvas');
    this.skidCanvas.width = 4000;
    this.skidCanvas.height = 4000;
    this.skidCtx = this.skidCanvas.getContext('2d')!;

    this.initWeather();
  }

  private initWeather() {
    this.weatherParticles = [];
    for (let i = 0; i < 150; i++) {
      this.weatherParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: -2 + Math.random() * 4,
        vy: 3 + Math.random() * 6,
        size: 1 + Math.random() * 2.5,
      });
    }
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public clearSkidBuffer() {
    this.skidCtx.clearRect(0, 0, this.skidCanvas.width, this.skidCanvas.height);
  }

  public triggerScreenShake(magnitude: number, duration: number = 0.3) {
    this.screenShakeMagnitude = Math.max(this.screenShakeMagnitude, magnitude);
    this.screenShakeDuration = duration;
  }

  public render(
    car: VehiclePhysicsState,
    carSpec: CarSpec,
    track: TrackStage,
    ghost: GhostPoint | null,
    particles: ParticleSystem,
    settings: GameSettings,
    dt: number
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Update screen shake
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= dt;
      if (this.screenShakeDuration <= 0) {
        this.screenShakeMagnitude = 0;
      }
    }

    // Rough surface chatter screen vibration
    let surfaceShake = 0;
    if (settings.screenShake) {
      if (car.surfaceCurrent === 'gravel') surfaceShake = (car.speedKmh / 160) * 2.0;
      else if (car.surfaceCurrent === 'mud') surfaceShake = (car.speedKmh / 140) * 1.5;
      else if (car.surfaceCurrent === 'grass') surfaceShake = (car.speedKmh / 80) * 3.5;
    }

    const shakeTotal = this.screenShakeMagnitude + surfaceShake;
    const shakeOffsetX = shakeTotal > 0 ? (Math.random() - 0.5) * shakeTotal * 4 : 0;
    const shakeOffsetY = shakeTotal > 0 ? (Math.random() - 0.5) * shakeTotal * 4 : 0;

    // Update Camera Target: Smooth Follow + Look-ahead in velocity direction
    const lookAheadDist = Math.min(240, car.speed * 4.5);
    const targetCamX = car.x + Math.cos(car.angle) * lookAheadDist;
    const targetCamY = car.y + Math.sin(car.angle) * lookAheadDist;

    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 6.5);
    this.cameraY += (targetCamY - this.cameraY) * Math.min(1, dt * 6.5);

    // Target Zoom based on speed
    let targetZoom = 1.15 - (car.speedKmh / 220) * 0.35;
    if (settings.cameraZoom === 'close') targetZoom *= 1.25;
    else if (settings.cameraZoom === 'far') targetZoom *= 0.85;

    this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 4.0);

    // Camera rotation
    if (settings.dynamicCameraRotation) {
      // Rotate camera so car faces forward
      const targetAngle = -car.angle - Math.PI / 2;
      let angleDiff = targetAngle - this.cameraAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.cameraAngle += angleDiff * Math.min(1, dt * 5.0);
    } else {
      this.cameraAngle = 0;
    }

    // 1. Draw Background / Ambient Terrain
    ctx.fillStyle = track.ambientColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Set World Viewport Transform
    ctx.save();
    ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    if (this.cameraAngle !== 0) {
      ctx.rotate(this.cameraAngle);
    }
    ctx.translate(-this.cameraX, -this.cameraY);

    // 3. Render Stage Terrain & Road Ribbon
    this.renderTrack(ctx, track);

    // 4. Render Skidmarks on road
    this.drawSkidmarksToBuffer(car);
    this.renderSkidmarks(ctx);

    // 5. Render Sector Gates & Finish Arch
    this.renderGates(ctx, track);

    // 6. Render Roadside Scenery & Obstacles (Trees, Rocks, Crowds)
    this.renderObstacles(ctx, track);

    // 7. Render Ghost Car (if active and visible)
    if (ghost && settings.showGhost) {
      this.renderGhostCar(ctx, ghost, carSpec);
    }

    // 8. Render Particles behind car
    particles.render(ctx);

    // 9. Render Player Car (with body roll, pitch, shadow, lights, and brake glow)
    this.renderCar(ctx, car, carSpec);

    ctx.restore();

    // 10. Render Weather overlay (snow/rain over screen)
    if (track.weather === 'snowing' || track.weather === 'raining') {
      this.renderWeatherOverlay(ctx, track.weather, width, height, dt);
    }
  }

  private renderTrack(ctx: CanvasRenderingContext2D, track: TrackStage) {
    const points = track.points;
    if (points.length < 2) return;

    // Draw outer roadside shoulder / grass / snow
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = track.roadsideColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw Road Ribbon per segment with specific surface colors
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = (p1.width + p2.width) / 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Surface coloring
      if (p1.surface === 'tarmac') {
        ctx.strokeStyle = '#272a30';
      } else if (p1.surface === 'gravel') {
        ctx.strokeStyle = '#936a44';
      } else if (p1.surface === 'mud') {
        ctx.strokeStyle = '#3e2d1d';
      } else if (p1.surface === 'snow') {
        ctx.strokeStyle = '#e2e8f0';
      } else if (p1.surface === 'ice') {
        ctx.strokeStyle = '#cbd5e1';
      } else {
        ctx.strokeStyle = '#475569';
      }

      ctx.stroke();
    }

    // Draw Curbs & Apex Markers (Red / White rally stripes) on turns
    for (let i = 1; i < points.length - 1; i += 2) {
      const p = points[i];
      const prev = points[i - 1];
      const next = points[i + 1];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const halfW = p.width / 2;

      // Draw striped curb edge
      ctx.fillStyle = i % 4 === 0 ? '#ef4444' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(p.x + nx * halfW, p.y + ny * halfW, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = i % 4 === 0 ? '#f8fafc' : '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x - nx * halfW, p.y - ny * halfW, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw center dashed white line for tarmac
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (points[i].surface === 'tarmac') {
        ctx.lineTo(points[i].x, points[i].y);
      } else {
        ctx.moveTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawSkidmarksToBuffer(car: VehiclePhysicsState) {
    const skidCtx = this.skidCtx;
    const centerOffset = 2000; // Offset into 4000x4000 canvas

    const wheels = [
      car.wheels.frontLeft,
      car.wheels.frontRight,
      car.wheels.rearLeft,
      car.wheels.rearRight,
    ];

    for (const w of wheels) {
      if (w.skidding) {
        skidCtx.save();
        const sx = w.x + centerOffset;
        const sy = w.y + centerOffset;

        let skidColor = 'rgba(15, 23, 42, 0.15)';
        if (w.surface === 'mud') skidColor = 'rgba(40, 25, 15, 0.25)';
        else if (w.surface === 'snow' || w.surface === 'ice') skidColor = 'rgba(180, 200, 220, 0.3)';
        else if (w.surface === 'gravel') skidColor = 'rgba(120, 70, 30, 0.22)';

        skidCtx.fillStyle = skidColor;
        skidCtx.beginPath();
        skidCtx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        skidCtx.fill();
        skidCtx.restore();
      }
    }
  }

  private renderSkidmarks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(-2000, -2000);
    ctx.drawImage(this.skidCanvas, 0, 0);
    ctx.restore();
  }

  private renderGates(ctx: CanvasRenderingContext2D, track: TrackStage) {
    const points = track.points;
    if (points.length === 0) return;

    // Start Line
    this.drawGateArch(ctx, points[0], 'START', '#22c55e');

    // Sector Checkpoints
    track.sectors.forEach((sec, idx) => {
      // Find approximate point along track
      const pointIdx = Math.min(
        points.length - 1,
        Math.floor((sec.distanceMeters / track.totalDistanceMeters) * points.length)
      );
      if (pointIdx > 0 && pointIdx < points.length - 1) {
        this.drawGateArch(ctx, points[pointIdx], `SECTOR ${idx + 1}`, '#06b6d4');
      }
    });

    // Finish Line
    this.drawGateArch(ctx, points[points.length - 1], 'FINISH', '#f59e0b');
  }

  private drawGateArch(
    ctx: CanvasRenderingContext2D,
    point: TrackStage['points'][0],
    label: string,
    color: string
  ) {
    ctx.save();
    ctx.translate(point.x, point.y);

    const w = point.width + 4;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Arch line across track
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();

    // Side pylons
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2 - 3, -6, 6, 12);
    ctx.fillRect(w / 2 - 3, -6, 6, 12);

    // Label tag
    ctx.font = 'bold 8px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 0, -6);

    ctx.restore();
  }

  private renderObstacles(ctx: CanvasRenderingContext2D, track: TrackStage) {
    for (const obs of track.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.type === 'tree') {
        // Tree shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(3, 4, obs.radius * 1.1, obs.radius * 0.7, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Pine tree foliage layers
        const treeColor = obs.surface === 'snow' ? '#2e4a3d' : '#143823';
        ctx.fillStyle = treeColor;
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner crown highlight
        ctx.fillStyle = obs.surface === 'snow' ? '#e2e8f0' : '#1e5434';
        ctx.beginPath();
        ctx.arc(-1, -1, obs.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'rock') {
        // Rock boulder
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(2, 3, obs.radius, obs.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(-1, -1, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'haybale') {
        // Haybale
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-obs.radius, -obs.radius * 0.6, obs.radius * 2, obs.radius * 1.2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-obs.radius, -obs.radius * 0.6, obs.radius * 2, obs.radius * 1.2);
      }

      ctx.restore();
    }
  }

  private renderGhostCar(
    ctx: CanvasRenderingContext2D,
    ghost: GhostPoint,
    carSpec: CarSpec
  ) {
    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.rotate(ghost.angle);
    ctx.globalAlpha = 0.45;

    const len = carSpec.dimensions.length * 3.8;
    const wid = carSpec.dimensions.width * 3.8;

    // Holographic ghost body
    ctx.fillStyle = '#06b6d4';
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-len / 2, -wid / 2, len, wid, 3);
    ctx.fill();
    ctx.stroke();

    // Wheels
    ctx.fillStyle = '#083344';
    const halfLen = len * 0.35;
    const halfWid = wid * 0.45;
    ctx.fillRect(halfLen - 4, -halfWid - 2, 8, 4);
    ctx.fillRect(halfLen - 4, halfWid - 2, 8, 4);
    ctx.fillRect(-halfLen - 4, -halfWid - 2, 8, 4);
    ctx.fillRect(-halfLen - 4, halfWid - 2, 8, 4);

    ctx.restore();
  }

  private renderCar(
    ctx: CanvasRenderingContext2D,
    car: VehiclePhysicsState,
    carSpec: CarSpec
  ) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    const scale = 3.8; // World render scale for car
    const len = carSpec.dimensions.length * scale;
    const wid = carSpec.dimensions.width * scale;
    const halfLen = len / 2;
    const halfWid = wid / 2;

    // Body roll and pitch visual shifts
    const rollOffsetX = -car.weightTransferX * 2.5;
    const pitchOffsetY = -car.weightTransferY * 2.0;
    const jumpElevation = car.jumpHeight * 6;

    // 1. Dynamic Shadow (shifts based on jump height & body tilt)
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.15, 0.5 - car.jumpHeight * 0.15)})`;
    ctx.beginPath();
    ctx.roundRect(
      -halfLen + jumpElevation * 0.8 + 2,
      -halfWid + jumpElevation * 0.8 + 2,
      len,
      wid,
      4
    );
    ctx.fill();

    // 2. Headlight Beams (casting forward cone)
    const beamLen = 130 + car.speed * 1.5;
    const beamGrad = ctx.createRadialGradient(halfLen, 0, 5, halfLen + beamLen, 0, beamLen * 0.6);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    beamGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.25)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(halfLen, -halfWid * 0.7);
    ctx.lineTo(halfLen + beamLen, -beamLen * 0.35);
    ctx.lineTo(halfLen + beamLen, beamLen * 0.35);
    ctx.lineTo(halfLen, halfWid * 0.7);
    ctx.closePath();
    ctx.fill();

    // 3. Wheels (4 independent tires with steering angle & brake glow)
    const wheelW = 8;
    const wheelH = 4.2;
    const wheelX = len * 0.34;
    const wheelY = wid * 0.48;

    const renderWheel = (wx: number, wy: number, steer: number, isBraking: boolean) => {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(steer);

      // Tire rubber
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH, 1.5);
      ctx.fill();

      // Rim
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-wheelW / 4, -wheelH / 4, wheelW / 2, wheelH / 2);

      // Glowing Brake Disc on hard brake
      if (isBraking && car.brake > 0.4) {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillRect(-1.5, -1.5, 3, 3);
      }

      ctx.restore();
    };

    const isBraking = car.brake > 0.2 || car.handbrake;
    renderWheel(wheelX, -wheelY, car.steerAngle, isBraking);
    renderWheel(wheelX, wheelY, car.steerAngle, isBraking);
    renderWheel(-wheelX, -wheelY, 0, isBraking);
    renderWheel(-wheelX, wheelY, 0, isBraking);

    // 4. Car Chassis Bodywork (with roll/pitch offset)
    ctx.save();
    ctx.translate(pitchOffsetY, rollOffsetX - jumpElevation);

    // Main body shell
    ctx.fillStyle = carSpec.color;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-halfLen, -halfWid, len, wid, [4, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Livery racing stripe
    ctx.fillStyle = carSpec.accentColor;
    ctx.fillRect(-halfLen, -halfWid * 0.25, len, halfWid * 0.5);

    // Windshield & Windows (Tinted glass)
    ctx.fillStyle = '#0f172a';
    // Front windshield
    ctx.beginPath();
    ctx.moveTo(halfLen * 0.35, -halfWid * 0.7);
    ctx.lineTo(halfLen * 0.05, -halfWid * 0.75);
    ctx.lineTo(halfLen * 0.05, halfWid * 0.75);
    ctx.lineTo(halfLen * 0.35, halfWid * 0.7);
    ctx.closePath();
    ctx.fill();

    // Rear window
    ctx.beginPath();
    ctx.moveTo(-halfLen * 0.25, -halfWid * 0.7);
    ctx.lineTo(-halfLen * 0.55, -halfWid * 0.65);
    ctx.lineTo(-halfLen * 0.55, halfWid * 0.65);
    ctx.lineTo(-halfLen * 0.25, halfWid * 0.7);
    ctx.closePath();
    ctx.fill();

    // Roof & Scoop
    ctx.fillStyle = carSpec.color;
    ctx.fillRect(-halfLen * 0.25, -halfWid * 0.65, halfLen * 0.3, halfWid * 1.3);

    // Roof air scoop
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfLen * 0.05, -2, 5, 4);

    // Rear Rally Spoiler / Wing
    ctx.fillStyle = carSpec.stripeColor;
    ctx.fillRect(-halfLen - 2, -halfWid * 0.85, 4, wid * 0.85);

    // Front Grille & Quad Rally Spotlights
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(halfLen - 1, -halfWid * 0.5, 2, 0, Math.PI * 2);
    ctx.arc(halfLen - 1, -halfWid * 0.18, 2, 0, Math.PI * 2);
    ctx.arc(halfLen - 1, halfWid * 0.18, 2, 0, Math.PI * 2);
    ctx.arc(halfLen - 1, halfWid * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Brake / Tail lights
    const tailLightColor = isBraking ? '#ef4444' : '#7f1d1d';
    ctx.fillStyle = tailLightColor;
    if (isBraking) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
    }
    ctx.fillRect(-halfLen, -halfWid * 0.75, 2.5, 4);
    ctx.fillRect(-halfLen, halfWid * 0.75 - 4, 2.5, 4);

    ctx.restore(); // Restore car chassis transform

    ctx.restore(); // Restore car root transform
  }

  private renderWeatherOverlay(
    ctx: CanvasRenderingContext2D,
    weather: string,
    width: number,
    height: number,
    dt: number
  ) {
    ctx.save();
    ctx.fillStyle = weather === 'snowing' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(186, 230, 253, 0.6)';

    for (const p of this.weatherParticles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y > height) {
        p.y = 0;
        p.x = Math.random() * width;
      }

      ctx.beginPath();
      if (weather === 'snowing') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else {
        ctx.rect(p.x, p.y, 1.2, p.size * 3.5);
      }
      ctx.fill();
    }

    ctx.restore();
  }
}

import { Particle, SurfaceType } from '../types/game';

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 800;

  constructor() {
    this.particles = [];
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;

      // Friction / drag
      p.vx *= 0.94;
      p.vy *= 0.94;

      if (p.scaleGrowth) {
        p.size += p.scaleGrowth * dt;
      }

      // Fade out alpha
      p.alpha = Math.max(0, (p.life / p.maxLife));
    }
  }

  public emitTireRoost(
    x: number,
    y: number,
    wheelAngle: number,
    carSpeed: number,
    slipIntensity: number,
    surface: SurfaceType
  ) {
    if (slipIntensity < 0.15 || this.particles.length >= this.maxParticles) return;

    // Number of particles based on slip intensity
    const count = Math.min(6, Math.floor(slipIntensity * 5) + 1);

    // Opposite direction of travel/wheel rotation + spread
    const baseAngle = wheelAngle + Math.PI;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.9;
      const angle = baseAngle + spread;
      const speed = Math.random() * (carSpeed * 0.4 + slipIntensity * 25) + 5;

      let color = 'rgba(200, 200, 200, 0.6)';
      let size = 2 + Math.random() * 3;
      let maxLife = 0.35 + Math.random() * 0.4;
      let type: Particle['type'] = 'dust';

      switch (surface) {
        case 'mud':
          color = Math.random() > 0.4 ? '#4a3728' : '#332316';
          size = 3 + Math.random() * 4;
          type = 'mud';
          maxLife = 0.5 + Math.random() * 0.4;
          break;
        case 'gravel':
          color = Math.random() > 0.5 ? '#d97706' : '#b45309';
          size = 2.5 + Math.random() * 3.5;
          type = 'gravel';
          maxLife = 0.4 + Math.random() * 0.3;
          break;
        case 'snow':
        case 'ice':
          color = Math.random() > 0.3 ? '#f1f5f9' : '#cbd5e1';
          size = 2 + Math.random() * 4;
          type = 'snow';
          maxLife = 0.6 + Math.random() * 0.5;
          break;
        case 'tarmac':
          color = 'rgba(230, 230, 230, 0.4)';
          size = 4 + Math.random() * 6;
          type = 'smoke';
          maxLife = 0.7 + Math.random() * 0.5;
          break;
      }

      this.particles.push({
        x: x + (Math.random() - 0.5) * 3,
        y: y + (Math.random() - 0.5) * 3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        alpha: 0.8,
        life: maxLife,
        maxLife,
        type,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        scaleGrowth: type === 'smoke' ? 8 : (type === 'snow' ? 2 : 0),
      });
    }
  }

  public emitExhaustFlame(x: number, y: number, carAngle: number) {
    if (this.particles.length >= this.maxParticles) return;

    const count = 5 + Math.floor(Math.random() * 4);
    const flameAngle = carAngle + Math.PI + (Math.random() - 0.5) * 0.3;

    for (let i = 0; i < count; i++) {
      const speed = 15 + Math.random() * 20;
      const colors = ['#f59e0b', '#ef4444', '#38bdf8', '#fbbf24'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = 0.12 + Math.random() * 0.15;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 2,
        y: y + (Math.random() - 0.5) * 2,
        vx: Math.cos(flameAngle) * speed + (Math.random() - 0.5) * 6,
        vy: Math.sin(flameAngle) * speed + (Math.random() - 0.5) * 6,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1.0,
        life: maxLife,
        maxLife,
        type: 'fire',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        scaleGrowth: 6,
      });
    }
  }

  public emitWaterSplash(x: number, y: number, speed: number) {
    const count = 15 + Math.floor(speed * 0.5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed * 0.8 + 10;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: 2 + Math.random() * 3.5,
        color: '#bae6fd',
        alpha: 0.85,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.5,
        type: 'water',
        rotation: 0,
        vRot: 0,
      });
    }
  }

  public emitCrashSparks(x: number, y: number, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#fbbf24' : '#f97316',
        alpha: 1.0,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.5,
        type: 'spark',
        rotation: 0,
        vRot: 0,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'fire' || p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.type === 'mud' || p.type === 'gravel') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'water' || p.type === 'snow') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
  }
}

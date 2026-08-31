import { GhostData, GhostPoint } from '../types/game';

export class GhostSystem {
  private currentRunPoints: GhostPoint[] = [];
  private recordingInterval: number = 0.05; // 20 Hz recording is ultra-smooth with interpolation
  private lastSampleTime: number = 0;

  public startRecording() {
    this.currentRunPoints = [];
    this.lastSampleTime = 0;
  }

  public recordFrame(
    time: number,
    x: number,
    y: number,
    angle: number,
    speed: number,
    steer: number,
    brake: boolean,
    drift: boolean
  ) {
    if (time - this.lastSampleTime >= this.recordingInterval) {
      this.currentRunPoints.push({
        time,
        x,
        y,
        angle,
        speed,
        steer,
        brake,
        drift,
      });
      this.lastSampleTime = time;
    }
  }

  public finalizeRun(stageId: string, carId: string, totalTime: number): GhostData {
    const ghost: GhostData = {
      stageId,
      carId,
      totalTime,
      points: this.currentRunPoints,
    };
    return ghost;
  }

  public static saveGhost(ghost: GhostData) {
    try {
      const key = `apex_rally_ghost_${ghost.stageId}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const parsed: GhostData = JSON.parse(existing);
        if (ghost.totalTime < parsed.totalTime) {
          localStorage.setItem(key, JSON.stringify(ghost));
        }
      } else {
        localStorage.setItem(key, JSON.stringify(ghost));
      }
    } catch {}
  }

  public static loadGhost(stageId: string): GhostData | null {
    try {
      const key = `apex_rally_ghost_${stageId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }

  // Smoothly interpolate ghost position at current stage time
  public static getGhostInterpolated(
    ghost: GhostData,
    currentTime: number
  ): GhostPoint | null {
    const points = ghost.points;
    if (!points || points.length === 0) return null;

    if (currentTime <= points[0].time) {
      return points[0];
    }

    if (currentTime >= points[points.length - 1].time) {
      return points[points.length - 1];
    }

    // Binary search for closest time interval
    let low = 0;
    let high = points.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (points[mid].time < currentTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, low - 1);
    const idx1 = Math.min(points.length - 1, low);

    const p0 = points[idx0];
    const p1 = points[idx1];

    if (idx0 === idx1 || p1.time === p0.time) {
      return p0;
    }

    const t = (currentTime - p0.time) / (p1.time - p0.time);

    // Angle interpolation handling wrap-around
    let angleDiff = p1.angle - p0.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return {
      time: currentTime,
      x: p0.x + (p1.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * t,
      angle: p0.angle + angleDiff * t,
      speed: p0.speed + (p1.speed - p0.speed) * t,
      steer: p0.steer + (p1.steer - p0.steer) * t,
      brake: t > 0.5 ? p1.brake : p0.brake,
      drift: t > 0.5 ? p1.drift : p0.drift,
    };
  }
}

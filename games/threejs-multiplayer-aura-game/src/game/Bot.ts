import { ARENA_RADIUS, type Difficulty } from './types'
import type { InputSource, Player } from './Player'
import type { Arena } from './Arena'

/** Parámetros de la CPU por dificultad. */
export const BOT_PARAMS: Record<
  Difficulty,
  { reaction: number; poseChance: number; counterChance: number; botMult: number }
> = {
  facil:   { reaction: 0.95, poseChance: 0.22, counterChance: 0.30, botMult: 0.8 },
  normal:  { reaction: 0.50, poseChance: 0.34, counterChance: 0.55, botMult: 1.0 },
  dificil: { reaction: 0.22, poseChance: 0.45, counterChance: 0.78, botMult: 1.12 },
}

/**
 * IA rival 1v1. Cada tick de decisión (≈0.2s) elige:
 *  - contraatacar con un tier superior si el rival posa (según reacción y azar)
 *  - retroceder para bajar el multiplicador de intimidación del rival
 *  - acercarse/orbitar y posar con variedad (evita repetir la última pose)
 *  - evadir bordes y pilares
 */
export class Bot implements InputSource {
  private move = { x: 0, z: 0 }
  private decideT = 0
  private strafeSign = 1
  private reactAt = -1
  private counterIdx: number | null = null
  private rivalWasPosing = false
  private time = 0
  readonly difficulty: Difficulty

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty
  }

  axis() {
    return this.move
  }

  tick(dt: number, me: Player, rival: Player, arena: Arena, requestPose: (i: number) => void) {
    this.time += dt
    const P = BOT_PARAMS[this.difficulty]
    const dist = me.pos.distanceTo(rival.pos)

    // Detectar el inicio de una pose rival y preparar contraataque
    if (rival.posing && !this.rivalWasPosing) {
      this.rivalWasPosing = true
      this.reactAt = this.time + P.reaction
      this.counterIdx = this.pickHigherTier(me, rival.tier)
      if (Math.random() > P.counterChance) this.counterIdx = null
    }
    if (!rival.posing) {
      this.rivalWasPosing = false
      this.counterIdx = null
    }

    if (this.counterIdx !== null && this.time >= this.reactAt && !me.posing) {
      requestPose(this.counterIdx)
      this.counterIdx = null
    }

    this.decideT -= dt
    if (this.decideT > 0) return
    this.decideT = 0.2 + Math.random() * 0.15

    let mx = 0
    let mz = 0
    const d = this.dirTo(me, rival)

    if (me.posing) {
      // Mantiene distancia de intimidación sin romper la pose
      if (dist < 1.6) { mx = -d.x; mz = -d.z }
    } else if (rival.posing) {
      if (this.counterIdx === null && Math.random() < 0.5) {
        mx = -d.x; mz = -d.z // retrocede: baja el multiplicador rival
      } else if (dist > 4.2) {
        mx = d.x; mz = d.z // presiona para intimidar
      }
    } else {
      // Juego libre: acercarse, orbitar y posar
      if (dist > 6) {
        mx = d.x; mz = d.z
      } else if (dist < 2.2) {
        mx = -d.x; mz = -d.z
      } else {
        mx = -d.z * this.strafeSign * 0.8
        mz = d.x * this.strafeSign * 0.8
        if (Math.random() < 0.08) this.strafeSign *= -1
      }

      if (dist < 6.5 && Math.random() < P.poseChance) {
        const ready = me.poseDefs
          .map((p, i) => ({ p, i }))
          .filter((x) => me.cooldowns[x.i] <= 0 && me.poseDefs[x.i].id !== me.lastPoseId)
        const anyReady = me.poseDefs
          .map((p, i) => ({ p, i }))
          .filter((x) => me.cooldowns[x.i] <= 0)
        const pool = ready.length ? ready : anyReady
        if (pool.length) {
          const pick = pool[Math.floor(Math.random() * pool.length)]
          requestPose(pick.i)
        }
      }
    }

    // Evasión de bordes y pilares
    const len = Math.hypot(me.pos.x, me.pos.z)
    if (len > ARENA_RADIUS - 2.5) {
      mx += -me.pos.x / len
      mz += -me.pos.z / len
    }
    const nextX = me.pos.x + mx * 1.4
    const nextZ = me.pos.z + mz * 1.4
    for (const p of arena.obstacles) {
      const dx = nextX - p.x
      const dz = nextZ - p.z
      if (Math.hypot(dx, dz) < p.r + 1.1) {
        const dl = Math.hypot(dx, dz) || 1
        mx += (dx / dl) * 2.2
        mz += (dz / dl) * 2.2
      }
    }

    const mlen = Math.hypot(mx, mz)
    this.move.x = mlen > 0 ? mx / mlen : 0
    this.move.z = mlen > 0 ? mz / mlen : 0
  }

  private dirTo(me: Player, rival: Player) {
    const dx = rival.pos.x - me.pos.x
    const dz = rival.pos.z - me.pos.z
    const d = Math.hypot(dx, dz) || 1
    return { x: dx / d, z: dz / d }
  }

  /** La pose más barata con tier superior al rival (si está disponible). */
  private pickHigherTier(me: Player, tier: number): number | null {
    const options = me.poseDefs
      .map((p, i) => ({ p, i }))
      .filter((x) => x.p.tier > tier && me.cooldowns[x.i] <= 0)
    if (!options.length) return null
    options.sort((a, b) => a.p.tier - b.p.tier)
    return options[0].i
  }
}

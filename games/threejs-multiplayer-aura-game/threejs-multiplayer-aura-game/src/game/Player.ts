import * as THREE from 'three'
import { Avatar } from './Avatar'
import type { Arena } from './Arena'
import {
  ARENA_RADIUS,
  CENTER_RADIUS,
  PLAYER_RADIUS,
  POSES,
  clamp,
  type PoseDef,
  type PlayerSetup,
} from './types'

/** Fuente de entrada: teclado (Game) o la IA (Bot). */
export interface InputSource {
  axis(): { x: number; z: number }
}

export interface PoseDoneEvent {
  type: 'poseDone'
  def: PoseDef
  gained: number
  combo: number
}

const MAX_SPEED = 5.6
const ACCEL = 26

/**
 * Estado completo de un jugador: física, colisiones, poses y puntaje.
 *
 * ALGORITMO DE PUNTUACIÓN (farmeo de aura):
 *  1. Tiempo: la pose carga aura de forma continua (base/duración por segundo).
 *  2. Distancia: cuanto más cerca del rival, más aura (intimidación, hasta ×1.55).
 *  3. Zona: posar dentro del anillo central suma ×1.25 (presencia en el escenario).
 *  4. Variedad: repetir pose rompe el combo (×0.55); variar lo sube (hasta ×1.75).
 *  5. Reacción: si el rival posa (o acaba de posar) se suma ×1.12.
 *  6. Choques: un tier superior interrumpe al rival y roba la mitad de su carga.
 */
export class Player {
  readonly index: number
  readonly setup: PlayerSetup
  readonly poseDefs: PoseDef[]
  readonly avatar: Avatar
  readonly pos = new THREE.Vector3()
  readonly vel = new THREE.Vector3()

  input: InputSource = { axis: () => ({ x: 0, z: 0 }) }
  botMult = 1         // ajuste de aura para la CPU según dificultad
  aura = 0
  combo = 1
  lastPoseId: string | null = null
  cooldowns: number[]
  currentPose: number | null = null
  poseT = 0
  charge = 0
  liveMult = 1        // multiplicador en vivo (distancia × zona)
  lastPoseEndAt = -99

  private now = 0

  constructor(index: number, setup: PlayerSetup, spawn: THREE.Vector3) {
    this.index = index
    this.setup = setup
    this.poseDefs = POSES[index]
    this.cooldowns = new Array(this.poseDefs.length).fill(0)
    this.pos.copy(spawn)
    this.avatar = new Avatar(setup.colors.primary, setup.colors.accent, setup.colors.skin)
    this.avatar.group.position.copy(spawn)
  }

  get posing() {
    return this.currentPose !== null
  }

  get tier() {
    return this.currentPose !== null ? this.poseDefs[this.currentPose].tier : 0
  }

  get timeSincePoseEnd() {
    return this.now - this.lastPoseEndAt
  }

  startPose(idx: number) {
    this.currentPose = idx
    this.poseT = 0
    this.charge = 0
    this.liveMult = 1
  }

  /** Cancela la pose en curso (choques) y devuelve la carga acumulada. */
  interrupt(): number {
    if (this.currentPose === null) return 0
    const c = this.charge
    this.currentPose = null
    this.charge = 0
    return c
  }

  reset(spawn: THREE.Vector3) {
    this.pos.copy(spawn)
    this.vel.set(0, 0, 0)
    this.aura = 0
    this.combo = 1
    this.lastPoseId = null
    this.currentPose = null
    this.poseT = 0
    this.charge = 0
    this.liveMult = 1
    this.lastPoseEndAt = -99
    this.cooldowns.fill(0)
    this.avatar.group.position.copy(spawn)
    this.avatar.group.rotation.set(0, 0, 0)
    this.avatar.reset()
  }

  update(dt: number, rival: Player, arena: Arena, now: number): PoseDoneEvent[] {
    const events: PoseDoneEvent[] = []
    this.now = now

    // Recargas
    for (let i = 0; i < this.cooldowns.length; i++) {
      this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt)
    }

    const dist = this.pos.distanceTo(rival.pos)

    if (this.posing) {
      const idx = this.currentPose as number
      const def = this.poseDefs[idx]
      this.poseT += dt

      // Multiplicadores en vivo (tiempo + intimidación + escenario)
      const distM = 1.55 - 0.85 * clamp(dist / (ARENA_RADIUS * 1.5), 0, 1)
      const stageM = Math.hypot(this.pos.x, this.pos.z) < CENTER_RADIUS ? 1.25 : 1
      this.liveMult = distM * stageM
      this.charge += (def.base / def.duration) * this.liveMult * dt

      // Enraizado durante la pose
      this.vel.multiplyScalar(Math.max(0, 1 - 6 * dt))

      if (this.poseT >= def.duration) {
        // ---- Puntuación final de la pose ----
        const repeated = this.lastPoseId === def.id
        const variety = repeated ? 0.55 : 1 + 0.15 * (this.combo - 1)
        const comboNew = repeated ? 1 : Math.min(this.combo + 1, 6)
        const reaction = rival.posing || rival.timeSincePoseEnd < 1.6 ? 1.12 : 1
        const intim = dist < 3 ? 1.12 : 1
        const gained = this.charge * variety * reaction * intim * this.botMult

        this.aura += gained
        this.combo = comboNew
        this.lastPoseId = def.id
        this.cooldowns[idx] = def.cooldown
        this.lastPoseEndAt = now
        this.currentPose = null
        this.charge = 0
        this.avatar.pulse()
        events.push({ type: 'poseDone', def, gained, combo: this.combo })
      }
    } else {
      // Movimiento con aceleración y fricción
      const ax = this.input.axis()
      const len = Math.hypot(ax.x, ax.z)
      if (len > 0) {
        const inv = 1 / Math.max(len, 1)
        this.vel.x += ax.x * inv * ACCEL * dt
        this.vel.z += ax.z * inv * ACCEL * dt
      }
      this.vel.x *= Math.max(0, 1 - 5 * dt)
      this.vel.z *= Math.max(0, 1 - 5 * dt)
      const sp = Math.hypot(this.vel.x, this.vel.z)
      if (sp > MAX_SPEED) {
        this.vel.x *= MAX_SPEED / sp
        this.vel.z *= MAX_SPEED / sp
      }
      // Orientación suave hacia la dirección de movimiento
      if (sp > 0.4) {
        const target = Math.atan2(this.vel.x, this.vel.z)
        let dy = target - this.avatar.group.rotation.y
        while (dy > Math.PI) dy -= Math.PI * 2
        while (dy < -Math.PI) dy += Math.PI * 2
        this.avatar.group.rotation.y += dy * Math.min(1, dt * 10)
      }
    }

    // Integración + colisiones contra escenario
    this.pos.x += this.vel.x * dt
    this.pos.z += this.vel.z * dt
    arena.collide(this.pos, PLAYER_RADIUS, this.vel)
    this.avatar.group.position.copy(this.pos)

    // Animación del avatar
    const speed = Math.hypot(this.vel.x, this.vel.z)
    const def = this.posing ? this.poseDefs[this.currentPose as number] : null
    this.avatar.update(
      dt,
      !this.posing && speed > 0.5,
      speed,
      def ? def.id : null,
      def ? this.poseT / def.duration : 0,
      def ? this.charge / def.base : 0
    )

    return events
  }
}

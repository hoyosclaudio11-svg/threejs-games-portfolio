import * as THREE from 'three'
import { Arena } from './Arena'
import { Player, type InputSource } from './Player'
import { Bot, BOT_PARAMS } from './Bot'
import { AuraFX } from './Particles'
import { CameraRig } from './CameraRig'
import { SFX } from './SFX'
import {
  AURA_GOAL,
  GAME_TIME,
  PLAYER_SETUPS,
  type Difficulty,
  type HudState,
  type LogEntry,
  type Mode,
  type Phase,
} from './types'

const COUNTDOWN = 3.0

/**
 * Orquestador del juego AURA FARM 1v1.
 *  - Modo local (2 jugadores en el mismo teclado) o vs CPU.
 *  - Choques de poses por tiers con robo de aura.
 *  - Victoria por umbral de AURA o por tiempo (mayor puntaje).
 *  - Emite el estado al HUD React mediante onHud() en cada frame.
 *
 * Controles:
 *  P1: WASD + poses Z / X / C      P2: Flechas + poses U / I / O
 *  P o ESC: pausa      M: silencio
 */
export class AuraGame {
  private container: HTMLElement
  private onHud: (h: HudState) => void

  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private rig: CameraRig
  private arena = new Arena()
  private fx: AuraFX
  private sfx = new SFX()

  private players: Player[] = []
  private bot: Bot | null = null
  private phase: Phase = 'idle'
  private time = GAME_TIME
  private countdown = COUNTDOWN
  private winner: -1 | 0 | 1 | null = null
  private cheer = 0
  private confettiT = 0
  private log: LogEntry[] = []
  private logId = 0

  private clock = new THREE.Clock()
  private raf = 0
  private keys = new Set<string>()

  private handleKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault()
    }
    this.keys.add(k)
    if (k === 'm') {
      this.toggleMute()
      return
    }
    if (k === 'p' || k === 'escape') {
      this.togglePause()
      return
    }
    if (e.repeat || this.phase !== 'running') return
    if (k === 'z') this.requestPose(0, 0)
    else if (k === 'x') this.requestPose(0, 1)
    else if (k === 'c') this.requestPose(0, 2)
    else if (k === 'u') this.requestPose(1, 0)
    else if (k === 'i') this.requestPose(1, 1)
    else if (k === 'o') this.requestPose(1, 2)
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase())
  }

  private handleResize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h)
    this.rig.camera.aspect = w / h
    this.rig.camera.updateProjectionMatrix()
  }

  constructor(container: HTMLElement, onHud: (h: HudState) => void) {
    this.container = container
    this.onHud = onHud

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(this.renderer.domElement)

    // Entorno
    this.scene.background = new THREE.Color(0x0d0a1f)
    this.scene.fog = new THREE.Fog(0x0d0a1f, 30, 95)

    // Iluminación: hemisférica + sol con sombras + rims de color por jugador
    const hemi = new THREE.HemisphereLight(0x93b4ff, 0x2a1d4a, 0.9)
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(16, 22, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -24
    sun.shadow.camera.right = 24
    sun.shadow.camera.top = 24
    sun.shadow.camera.bottom = -24
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 60
    sun.shadow.bias = -0.0006
    const rimA = new THREE.DirectionalLight(0x38bdf8, 0.9)
    rimA.position.set(-10, 8, -6)
    const rimB = new THREE.DirectionalLight(0xe879f9, 0.9)
    rimB.position.set(10, 8, 6)
    this.scene.add(hemi, sun, rimA, rimB)

    this.scene.add(this.arena.group)
    this.fx = new AuraFX(this.scene, [0x38bdf8, 0xe879f9])
    this.rig = new CameraRig(container.clientWidth / Math.max(1, container.clientHeight))

    // Jugadores
    this.players = PLAYER_SETUPS.map(
      (s, i) => new Player(i, s, new THREE.Vector3(i === 0 ? -6 : 6, 0, 0))
    )
    this.players.forEach((p) => this.scene.add(p.avatar.group))

    window.addEventListener('keydown', this.handleKey)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('resize', this.handleResize)

    this.loop()
  }

  /** Fuente de entrada por jugador: teclado o CPU. */
  private inputOf(pi: number): InputSource {
    if (pi === 1 && this.bot) return this.bot
    const k = this.keys
    if (pi === 0) {
      return {
        axis: () => ({
          x: (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0),
          z: (k.has('s') ? 1 : 0) - (k.has('w') ? 1 : 0),
        }),
      }
    }
    return {
      axis: () => ({
        x: (k.has('arrowright') ? 1 : 0) - (k.has('arrowleft') ? 1 : 0),
        z: (k.has('arrowdown') ? 1 : 0) - (k.has('arrowup') ? 1 : 0),
      }),
    }
  }

  /** Inicia (o reinicia) una partida. */
  start(mode: Mode, difficulty: Difficulty) {
    this.bot = mode === 'cpu' ? new Bot(difficulty) : null
    this.players.forEach((p, i) => {
      p.reset(new THREE.Vector3(i === 0 ? -6 : 6, 0, 0))
      p.botMult = mode === 'cpu' && i === 1 ? BOT_PARAMS[difficulty].botMult : 1
      p.input = this.inputOf(i)
    })
    this.phase = 'countdown'
    this.countdown = COUNTDOWN
    this.time = GAME_TIME
    this.winner = null
    this.log = []
    this.cheer = 0
    this.fx.clear()
    this.sfx.unlock()
  }

  togglePause() {
    if (this.phase === 'running') this.phase = 'paused'
    else if (this.phase === 'paused') this.phase = 'running'
  }

  toggleMute() {
    this.sfx.toggleMute()
  }

  /** Vuelve al menú principal. */
  toMenu() {
    this.phase = 'idle'
    this.winner = null
  }

  /**
   * Intento de pose. Si el rival está posando se resuelve el choque:
   *  - tier superior: interrumpe al rival y roba el 50% de su carga
   *  - tier inferior: la pose falla y entra en recarga parcial
   *  - mismo tier: choque nulo, ambos pierden la carga
   */
  private requestPose(pi: number, idx: number) {
    if (this.phase !== 'running') return
    const p = this.players[pi]
    const r = this.players[1 - pi]
    const def = p.poseDefs[idx]
    if (p.posing || p.cooldowns[idx] > 0) return

    if (r.posing) {
      const rd = r.poseDefs[r.currentPose as number]
      const mid = new THREE.Vector3().addVectors(p.pos, r.pos).multiplyScalar(0.5)

      if (rd.tier === def.tier) {
        r.interrupt()
        p.cooldowns[idx] = def.cooldown * 0.5
        this.addLog('⚡ CHOQUE NULO: las dos poses se cancelan', '#94a3b8')
        this.fx.shock(mid, 0xfbbf24)
        this.rig.addShake(0.3)
        this.cheer += 0.8
        this.sfx.clash()
        return
      }
      if (def.tier > rd.tier) {
        const stolen = Math.round(r.interrupt() * 0.5)
        p.aura += stolen
        this.addLog(`🔥 ${p.setup.name} contrarresta y roba ${stolen} de AURA`, p.setup.css)
        this.fx.shock(r.pos, 0xffffff)
        this.rig.addShake(0.35)
        this.cheer += 1
        this.sfx.clash()
        // el atacante continúa con su pose
      } else {
        p.cooldowns[idx] = def.cooldown * 0.5
        this.addLog(`🛡️ ${r.setup.name} contraataca a ${p.setup.name}`, r.setup.css)
        this.rig.addShake(0.2)
        this.sfx.counter()
        return
      }
    }

    p.startPose(idx)
    this.sfx.poseStart(def.tier)
  }

  /** Procesa eventos de poses completadas: log, FX, sonido, cámara. */
  private handleEvents(events: { type: 'poseDone'; def: { emoji: string; name: string; tier: number }; gained: number; combo: number }[], pi: number) {
    for (const ev of events) {
      const p = this.players[pi]
      const gained = Math.round(ev.gained)
      this.addLog(
        `${p.setup.name} ${ev.def.emoji} ${ev.def.name}: +${gained} AURA${ev.combo > 1 ? ` · combo ×${ev.combo}` : ''}`,
        p.setup.css
      )
      this.fx.burst(p.pos, pi === 0 ? 0x38bdf8 : 0xe879f9, 20 + ev.def.tier * 8)
      this.fx.shock(p.pos, 0xffffff)
      this.rig.addShake(ev.def.tier * 0.12)
      this.cheer += 0.4 + ev.def.tier * 0.2
      this.sfx.poseDone(gained)
    }
  }

  /** Colisión entre los dos avatares (se empujan mutuamente). */
  private resolveBodyCollision() {
    const [a, b] = this.players
    const dx = b.pos.x - a.pos.x
    const dz = b.pos.z - a.pos.z
    const d = Math.hypot(dx, dz)
    const min = 1.1
    if (d < min && d > 0.001) {
      const push = (min - d) / 2
      const nx = dx / d
      const nz = dz / d
      a.pos.x -= nx * push
      a.pos.z -= nz * push
      b.pos.x += nx * push
      b.pos.z += nz * push
    }
  }

  /** Determinación automática del ganador (umbral o tiempo). */
  private finish(winnerIdx: -1 | 0 | 1) {
    if (this.phase === 'finished') return
    this.phase = 'finished'
    this.winner = winnerIdx
    if (winnerIdx === -1) {
      this.addLog('⏱️ ¡TIEMPO! Empate de AURA', '#94a3b8')
      this.sfx.draw()
    } else {
      const p = this.players[winnerIdx]
      this.addLog(`🏆 ${p.setup.name} alcanzó ${AURA_GOAL} de AURA`, '#fbbf24')
      this.sfx.win()
    }
    this.rig.addShake(0.5)
    this.cheer = 1.5
  }

  private addLog(text: string, color: string) {
    this.log.unshift({ id: this.logId++, text, color })
    if (this.log.length > 8) this.log.pop()
  }

  /** Lógica por frame. */
  private update(dt: number, now: number) {
    if (this.phase === 'countdown') {
      const prev = Math.ceil(this.countdown)
      this.countdown -= dt
      if (this.countdown <= 0) {
        this.phase = 'running'
        this.addLog('¡A FARMear AURA!', '#fbbf24')
        this.sfx.go()
      } else if (Math.ceil(this.countdown) !== prev) {
        this.sfx.tick()
      }
    } else if (this.phase === 'running') {
      this.time -= dt
      const [p0, p1] = this.players

      if (this.bot) this.bot.tick(dt, p1, p0, this.arena, (i) => this.requestPose(1, i))

      const ev0 = p0.update(dt, p1, this.arena, now)
      const ev1 = p1.update(dt, p0, this.arena, now)
      this.handleEvents(ev0, 0)
      this.handleEvents(ev1, 1)
      this.resolveBodyCollision()

      if (p0.aura >= AURA_GOAL) this.finish(0)
      else if (p1.aura >= AURA_GOAL) this.finish(1)
      else if (this.time <= 0) {
        this.finish(p0.aura === p1.aura ? -1 : p0.aura > p1.aura ? 0 : 1)
      }
    } else if (this.phase === 'finished') {
      this.confettiT -= dt
      if (this.confettiT <= 0 && this.winner !== null && this.winner !== -1) {
        this.confettiT = 0.4
        this.fx.burst(this.players[this.winner].pos, this.winner === 0 ? 0x38bdf8 : 0xe879f9, 30, 7)
      }
    }
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const now = this.clock.elapsedTime

    if (this.phase !== 'paused') {
      this.update(dt, now)

      // Visuales siempre activos (el menú muestra la arena como attract mode)
      this.cheer = Math.max(0, this.cheer - dt * 0.8)
      this.arena.update(dt, this.cheer)
      const mid = new THREE.Vector3()
        .addVectors(this.players[0].pos, this.players[1].pos)
        .multiplyScalar(0.5)
      const dist = this.players[0].pos.distanceTo(this.players[1].pos)
      this.rig.update(dt, mid, dist, this.phase === 'idle')

      this.fx.setActive(0, this.players[0].posing ? 1 : 0.3)
      this.fx.setActive(1, this.players[1].posing ? 1 : 0.3)
      this.fx.update(dt, now, this.players[0].pos, this.players[1].pos)
    }

    this.renderer.render(this.scene, this.rig.camera)
    this.emitHud()
  }

  /** Publica el estado del juego para el HUD de React. */
  private emitHud() {
    const players = this.players.map((p) => ({
      name: this.bot && p.index === 1 ? `CPU · ${this.bot.difficulty}` : p.setup.name,
      css: p.setup.css,
      aura: Math.round(p.aura),
      combo: p.combo,
      charging: p.posing,
      poseName: p.posing ? p.poseDefs[p.currentPose as number].name : '',
      auraRate: p.posing
        ? Math.round(
            (p.poseDefs[p.currentPose as number].base / p.poseDefs[p.currentPose as number].duration) *
              p.liveMult
          )
        : 0,
      poses: p.poseDefs.map((d, i) => ({ ...d, cd: p.cooldowns[i] })),
    }))
    this.onHud({
      phase: this.phase,
      countdown: this.countdown,
      time: this.time,
      muted: this.sfx.muted,
      winner: this.winner,
      players,
      log: this.log.slice(0, 5),
    })
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.handleKey)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('resize', this.handleResize)
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}

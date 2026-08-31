/**
 * Efectos de sonido sintetizados con WebAudio.
 * Cero assets externos: cada efecto es un oscilador con envolvente.
 */
export class SFX {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  /** Debe llamarse tras un gesto del usuario (click en "Jugar"). */
  unlock() {
    this.ensure()
    void this.ctx?.resume()
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    return this.muted
  }

  private ensure() {
    if (this.ctx) return
    try {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.32
      this.master.connect(this.ctx.destination)
    } catch {
      /* navegador sin WebAudio: el juego sigue sin sonido */
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
    if (this.muted) return
    this.ensure()
    if (!this.ctx || !this.master) return
    const t0 = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slide > 0) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur)
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  poseStart(tier: number) {
    this.tone(180 + 90 * tier, 0.16, 'triangle', 0.25, 320 + 140 * tier)
  }

  poseDone(points: number) {
    const n = Math.min(4, 1 + Math.floor(points / 200))
    for (let i = 0; i < n; i++) {
      setTimeout(() => this.tone(420 + i * 160, 0.12, 'sine', 0.2), i * 70)
    }
  }

  clash() { this.tone(110, 0.35, 'sawtooth', 0.3, 55) }
  counter() { this.tone(70, 0.3, 'square', 0.22, 40) }
  tick() { this.tone(520, 0.08, 'square', 0.12) }
  go() { this.tone(880, 0.3, 'square', 0.2) }

  win() {
    ;[523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.25, 'triangle', 0.22), i * 130)
    )
  }

  draw() {
    ;[440, 330, 220].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.2, 'sine', 0.15), i * 120)
    )
  }
}

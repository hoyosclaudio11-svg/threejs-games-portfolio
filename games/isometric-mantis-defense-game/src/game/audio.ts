/**
 * Síntesis de efectos de sonido con la Web Audio API (sin assets).
 * Todos los sonidos se generan con osciladores y ruido filtrado.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  muted = false;

  /** Debe llamarse tras un gesto del usuario (botón Jugar). */
  ensure(): void {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 1;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(opts: {
    freq: number;
    type?: OscillatorType;
    dur: number;
    vol?: number;
    attack?: number;
    slideTo?: number;
    delay?: number;
  }): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + (opts.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + opts.dur);
    const vol = opts.vol ?? 0.3;
    const atk = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + opts.dur + 0.02);
  }

  private noise(opts: {
    dur: number;
    vol?: number;
    type?: BiquadFilterType;
    freq?: number;
    q?: number;
    slideTo?: number;
    delay?: number;
  }): void {
    if (!this.ctx || !this.master || !this.noiseBuffer || this.muted) return;
    const t = this.ctx.currentTime + (opts.delay ?? 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = opts.type ?? "bandpass";
    filt.frequency.setValueAtTime(opts.freq ?? 1200, t);
    if (opts.slideTo) filt.frequency.exponentialRampToValueAtTime(opts.slideTo, t + opts.dur);
    filt.Q.value = opts.q ?? 1;
    const g = this.ctx.createGain();
    const vol = opts.vol ?? 0.3;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + opts.dur + 0.02);
  }

  slash(): void {
    this.noise({ dur: 0.18, vol: 0.22, type: "highpass", freq: 1800, slideTo: 600 });
    this.tone({ freq: 900, type: "triangle", dur: 0.12, vol: 0.12, slideTo: 300 });
  }

  spin(): void {
    this.tone({ freq: 220, type: "sawtooth", dur: 0.4, vol: 0.16, slideTo: 660 });
    this.noise({ dur: 0.4, vol: 0.14, type: "bandpass", freq: 800, q: 2 });
  }

  dash(): void {
    this.tone({ freq: 500, type: "sine", dur: 0.16, vol: 0.14, slideTo: 1400 });
    this.noise({ dur: 0.14, vol: 0.1, type: "highpass", freq: 2200 });
  }

  hit(): void {
    this.noise({ dur: 0.08, vol: 0.2, type: "bandpass", freq: 1400, q: 1.5 });
  }

  enemyDeath(): void {
    this.tone({ freq: 420, type: "square", dur: 0.18, vol: 0.12, slideTo: 90 });
    this.noise({ dur: 0.18, vol: 0.14, type: "lowpass", freq: 1000 });
  }

  nestHit(): void {
    this.tone({ freq: 160, type: "sine", dur: 0.35, vol: 0.22, slideTo: 70 });
    this.noise({ dur: 0.3, vol: 0.12, type: "lowpass", freq: 500 });
  }

  waveStart(): void {
    const base = 330;
    [0, 0.08, 0.16].forEach((d, i) =>
      this.tone({
        freq: base * Math.pow(1.18, i),
        type: "triangle",
        dur: 0.4,
        vol: 0.16,
        delay: d,
      })
    );
  }

  combo(level: number): void {
    this.tone({
      freq: 500 + Math.min(level, 12) * 60,
      type: "triangle",
      dur: 0.12,
      vol: 0.1,
    });
  }

  gameOver(): void {
    [440, 370, 311, 233].forEach((f, i) =>
      this.tone({ freq: f, type: "sawtooth", dur: 0.5, vol: 0.2, delay: i * 0.18 })
    );
  }
}

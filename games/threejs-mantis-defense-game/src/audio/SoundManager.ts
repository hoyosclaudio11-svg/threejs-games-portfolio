export class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.4;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicTimer: any = null;
  private isMusicPlaying: boolean = false;
  private waveIntensity: number = 1; // 1 to 5
  private lastSoundTimes: Record<string, number> = {};

  constructor() {
    // Initialized lazily on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);

      this.updateVolumes();
      this.startAmbientMusic();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.updateVolumes();
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateVolumes();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.sfxGain || !this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, now);
    this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume * 0.35, now);
  }

  private canPlay(key: string, cooldownMs: number = 50): boolean {
    const now = performance.now();
    const last = this.lastSoundTimes[key] || 0;
    if (now - last < cooldownMs) return false;
    this.lastSoundTimes[key] = now;
    return true;
  }

  // --- SOUND EFFECTS ---

  // Mantis raptorial blade slash (sharp metallic swoosh + slice)
  public playSlash(comboStep: number = 0) {
    if (!this.ctx || !this.sfxGain || !this.canPlay('slash', 60)) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Fast noise swoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = comboStep === 1 ? 2200 : 1800;
    filter.frequency.setValueAtTime(baseFreq + Math.random() * 400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    filter.Q.value = 4.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // High pitch blade ping
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 + comboStep * 300, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Acid Spit firing
  public playAcidShoot() {
    if (!this.ctx || !this.sfxGain || !this.canPlay('acid', 80)) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Acid impact / corrosive sizzle
  public playAcidImpact() {
    if (!this.ctx || !this.sfxGain || !this.canPlay('acid_hit', 70)) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sizzling burst
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  // Chitin crunch / enemy hit
  public playHit(isCrit: boolean = false, isHeavy: boolean = false) {
    if (!this.ctx || !this.sfxGain || !this.canPlay('hit', 40)) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHeavy ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(isCrit ? 600 : 350, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + (isHeavy ? 0.2 : 0.08));

    gain.gain.setValueAtTime(isCrit ? 0.6 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isHeavy ? 0.2 : 0.08));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (isHeavy ? 0.2 : 0.08));
  }

  // Mantis leap & slam
  public playLeap() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playSlam() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sub-bass impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Dash whoosh
  public playDash() {
    if (!this.ctx || !this.sfxGain || !this.canPlay('dash', 100)) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Screech / Ultrasonic wave
  public playScreech() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.linearRampToValueAtTime(3500, t + 0.2);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.5);

    osc2.frequency.setValueAtTime(2250, t);
    osc2.frequency.linearRampToValueAtTime(3550, t + 0.2);
    osc2.frequency.linearRampToValueAtTime(1250, t + 0.5);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.55);
    osc2.stop(t + 0.55);
  }

  // Alpha Predator / Frenzy roar
  public playFrenzy() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.6);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Nest pulse / Bio-barrier
  public playNestPulse() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.7);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // Nest danger alarm
  public playNestAlarm() {
    if (!this.ctx || !this.sfxGain || !this.canPlay('nest_alarm', 600)) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.setValueAtTime(440, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Biomass pickup chime
  public playPickup() {
    if (!this.ctx || !this.sfxGain || !this.canPlay('pickup', 40)) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const note = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(note, t);
    osc.frequency.exponentialRampToValueAtTime(note * 1.5, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Wave victory fanfare
  public playWaveClear() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880];

    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + 0.9);
    });
  }

  // Boss roar / alert
  public playBossSpawn() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(45, t + 1.2);

    osc2.frequency.setValueAtTime(150, t);
    osc2.frequency.exponentialRampToValueAtTime(280, t + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(90, t + 1.2);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 1.3);
    osc2.stop(t + 1.3);
  }

  // Set battle intensity for dynamic procedural music
  public setWaveIntensity(intensity: number) {
    this.waveIntensity = Math.max(1, Math.min(5, intensity));
  }

  // Dynamic Procedural Ambient Forest & Combat Synth Engine
  private startAmbientMusic() {
    if (this.isMusicPlaying || !this.ctx) return;
    this.isMusicPlaying = true;

    let step = 0;
    const bpm = 112;
    const stepDuration = (60 / bpm) / 4; // 16th note

    const rootScale = [43.65, 51.91, 58.27, 65.41, 73.42, 87.31]; // F, G#, A#, C, D, F minor pentatonic bass

    const tick = () => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const t = this.ctx.currentTime;

      // 1. Kick/Sub-pulse on beat 0, 4, 8, 12 (4/4 rhythm)
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, t);
        kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.18);
        kickGain.gain.setValueAtTime(0.4 * (0.6 + this.waveIntensity * 0.1), t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.2);
      }

      // 2. Chittering insect hi-hat / shaker on 16th notes
      if (step % 2 === 0 || this.waveIntensity >= 3) {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filt = this.ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 6000;

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.08 : 0.04, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        noise.connect(filt);
        filt.connect(hatGain);
        hatGain.connect(this.musicGain);
        noise.start(t);
      }

      // 3. Dark Synth Bassline
      if (step % 4 === 0 || (this.waveIntensity >= 2 && step % 4 === 2)) {
        const noteIdx = Math.floor((step / 4) % rootScale.length);
        const freq = rootScale[noteIdx];

        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq * 2, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(250 + this.waveIntensity * 80, t);
        bassFilter.Q.value = 3;

        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 3.5);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + stepDuration * 3.5);
      }

      step = (step + 1) % 64;
      this.musicTimer = setTimeout(tick, stepDuration * 1000);
    };

    tick();
  }

  public destroy() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();

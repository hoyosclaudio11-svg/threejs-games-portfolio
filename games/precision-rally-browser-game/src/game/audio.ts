// Audio Synthesizer using pure Web Audio API for 100% reliable sound effects

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private turboGain: GainNode | null = null;
  private tireGain: GainNode | null = null;

  // Oscillators for engine sound
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Noise node for tire screech and gravel roost
  private tireFilter: BiquadFilterNode | null = null;

  // Turbo whine
  private turboOsc: OscillatorNode | null = null;

  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private previousThrottle: number = 0;
  private lastPopTime: number = 0;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- ENGINE SOUND GRAPH ---
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      // Fundamental engine pulses (sawtooth + square + sub sine)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(50, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(100, this.ctx.currentTime);

      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'sine';
      this.oscSub.frequency.setValueAtTime(25, this.ctx.currentTime);

      const engineMixer = this.ctx.createGain();
      engineMixer.gain.setValueAtTime(0.5, this.ctx.currentTime);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.oscSub.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.oscSub.start();

      // --- TURBO SPOOL WHINE ---
      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboOsc.start();

      // --- TIRE SLIP NOISE (Pink/White noise with bandpass) ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.tireFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.tireGain = this.ctx.createGain();
      this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      noiseSource.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.masterGain);
      noiseSource.start();

      this.isInitialized = true;
    } catch {
      // Web Audio might not be available or permitted before user interaction
    }
  }

  public updateEngine(
    rpm: number,
    throttle: number,
    boost: number,
    soundProfile: string,
    isAirborne: boolean
  ) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Fundamental frequency base according to RPM
    let baseFreq = (rpm / 60) * 1.5;
    if (soundProfile === 'inline5_turbo') {
      baseFreq = (rpm / 60) * 2.5; // Distinctive Audi 5-cylinder warble
    } else if (soundProfile === 'flat4_boxer') {
      baseFreq = (rpm / 60) * 2.0; // Unequal length header boxer rumble
    } else if (soundProfile === 'v6_turbo') {
      baseFreq = (rpm / 60) * 3.0; // High-pitched V6 howl
    }

    if (this.osc1 && this.osc2 && this.oscSub) {
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
      this.osc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.03);
      this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);
    }

    // Engine Filter cutoff shifts with RPM and throttle load
    if (this.engineFilter) {
      const targetCutoff = 400 + (rpm / 8500) * 2200 + throttle * 1200;
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.04);
    }

    // Engine volume: higher when under throttle load or high RPM
    if (this.engineGain) {
      const vol = (0.2 + throttle * 0.45 + (rpm / 8500) * 0.35) * (isAirborne ? 0.7 : 1.0);
      this.engineGain.gain.setTargetAtTime(vol, now, 0.04);
    }

    // Turbo whistle
    if (this.turboGain && this.turboOsc) {
      const turboPitch = 800 + boost * 2800 + (rpm / 8500) * 1200;
      this.turboOsc.frequency.setTargetAtTime(turboPitch, now, 0.05);
      const turboVol = Math.max(0, boost * 0.22);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.05);
    }

    // Blow-off valve sound when throttle drops rapidly under high boost
    if (this.previousThrottle > 0.7 && throttle < 0.2 && boost > 0.4) {
      this.playBlowOffValve();
    }

    // Turbo anti-lag pop & backfire when lifting at high RPM (> 5000 RPM)
    if (this.previousThrottle > 0.5 && throttle < 0.2 && rpm > 4800 && Date.now() - this.lastPopTime > 250) {
      this.playAntiLagPop();
      this.lastPopTime = Date.now();
    }

    this.previousThrottle = throttle;
  }

  public updateTireSlide(
    skidIntensity: number,
    surface: string,
    handbrake: boolean
  ) {
    if (!this.ctx || !this.tireGain || !this.tireFilter || this.isMuted) return;

    const now = this.ctx.currentTime;
    const intensity = Math.min(1.0, skidIntensity + (handbrake ? 0.4 : 0));

    if (intensity < 0.05) {
      this.tireGain.gain.setTargetAtTime(0.0, now, 0.08);
      return;
    }

    // Surface-specific sound filter adjustment
    let centerFreq = 1200;
    let targetVol = intensity * 0.4;

    switch (surface) {
      case 'tarmac':
        centerFreq = 1800 + intensity * 600; // High screech
        targetVol = intensity * 0.45;
        break;
      case 'gravel':
        centerFreq = 650; // Crunchy gravel roost
        targetVol = intensity * 0.55;
        break;
      case 'mud':
        centerFreq = 420; // Deep wet sloshing
        targetVol = intensity * 0.4;
        break;
      case 'snow':
      case 'ice':
        centerFreq = 1400; // Crisp granular hiss
        targetVol = intensity * 0.35;
        break;
      default:
        centerFreq = 900;
    }

    this.tireFilter.frequency.setTargetAtTime(centerFreq, now, 0.05);
    this.tireGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  public playBlowOffValve() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.28);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  public playAntiLagPop() {
    if (!this.ctx || this.isMuted) return;
    try {
      const count = 1 + Math.floor(Math.random() * 3); // 1-3 rapid pops
      for (let i = 0; i < count; i++) {
        const delay = i * 0.08 + Math.random() * 0.04;
        const now = this.ctx.currentTime + delay;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {}
  }

  public playGearShift() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playImpact(force: number) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const vol = Math.min(0.9, force * 0.06 + 0.2);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.3);

      this.triggerHaptic([30, 40, 50]);
    } catch {}
  }

  public playJumpLand() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.35);

      this.triggerHaptic([40, 60]);
    } catch {}
  }

  public playPaceNoteCue(severity: number) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp corners have higher alert pitch
      const freq = severity <= 2 ? 880 : 540;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setValueAtTime(freq * 1.2, now + 0.04);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'square' : 'sine';
      const freq = isGo ? 987.77 : 523.25; // B5 for GO, C5 for 3-2-1
      osc.frequency.setValueAtTime(freq, now);

      const duration = isGo ? 0.45 : 0.18;
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + duration + 0.05);

      this.triggerHaptic(isGo ? [80, 50, 120] : [35]);
    } catch {}
  }

  public playSectorSplit(isGreen: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = isGreen ? 1046.5 : 440; // High C6 for green delta, A4 for red delta
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  public playFinishFanfare() {
    if (!this.ctx || this.isMuted) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 0.5);
      });
      this.triggerHaptic([60, 80, 100, 150]);
    } catch {}
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.tireGain && this.ctx) {
      this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.turboGain && this.ctx) {
      this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public triggerHaptic(pattern: number[]) {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }
}

export const audio = new AudioEngine();

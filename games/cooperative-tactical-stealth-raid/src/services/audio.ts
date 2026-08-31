class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;

  // Background procedural music nodes
  private bgMusicOsc1: OscillatorNode | null = null;
  private bgMusicOsc2: OscillatorNode | null = null;
  private bgMusicFilter: BiquadFilterNode | null = null;
  private bgMusicLfo: OscillatorNode | null = null;
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmLfo: OscillatorNode | null = null;
  private isMusicPlaying: boolean = false;
  private isAlarmSounding: boolean = false;

  constructor() {
    // Lazy init audio context on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public unlockAudio() {
    this.initCtx();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public setVolume(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    if (this.ctx && this.sfxGain && this.musicGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public getVolume() {
    return { sfx: this.sfxVolume, music: this.musicVolume, isMuted: this.isMuted };
  }

  // --- Procedural Tactical Soundtrack ---
  public startBackgroundTrack(isAlarm: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.musicGain) return;
    if (this.isMusicPlaying) {
      this.updateMusicState(isAlarm);
      return;
    }

    try {
      const now = this.ctx.currentTime;

      // Filter for dark ambient pulsing
      this.bgMusicFilter = this.ctx.createBiquadFilter();
      this.bgMusicFilter.type = 'lowpass';
      this.bgMusicFilter.frequency.setValueAtTime(isAlarm ? 800 : 320, now);
      this.bgMusicFilter.Q.setValueAtTime(3.5, now);
      this.bgMusicFilter.connect(this.musicGain);

      // Bass Osc 1 - Sub tactical pulse (55Hz = A1)
      this.bgMusicOsc1 = this.ctx.createOscillator();
      this.bgMusicOsc1.type = 'sawtooth';
      this.bgMusicOsc1.frequency.setValueAtTime(55, now);

      // Bass Osc 2 - Detuned dark drone (54.5Hz)
      this.bgMusicOsc2 = this.ctx.createOscillator();
      this.bgMusicOsc2.type = 'triangle';
      this.bgMusicOsc2.frequency.setValueAtTime(54.5, now);

      // LFO for filter wobble
      this.bgMusicLfo = this.ctx.createOscillator();
      this.bgMusicLfo.type = 'sine';
      this.bgMusicLfo.frequency.setValueAtTime(isAlarm ? 3.0 : 0.4, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(isAlarm ? 350 : 120, now);
      this.bgMusicLfo.connect(lfoGain);
      lfoGain.connect(this.bgMusicFilter.frequency);

      this.bgMusicOsc1.connect(this.bgMusicFilter);
      this.bgMusicOsc2.connect(this.bgMusicFilter);

      this.bgMusicOsc1.start(now);
      this.bgMusicOsc2.start(now);
      this.bgMusicLfo.start(now);
      this.isMusicPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateMusicState(isAlarm: boolean) {
    if (!this.ctx || !this.bgMusicFilter || !this.bgMusicLfo) return;
    const now = this.ctx.currentTime;
    if (isAlarm) {
      this.bgMusicFilter.frequency.setTargetAtTime(900, now, 0.5);
      this.bgMusicLfo.frequency.setTargetAtTime(3.2, now, 0.5);
      this.startAlarmSiren();
    } else {
      this.bgMusicFilter.frequency.setTargetAtTime(320, now, 1.0);
      this.bgMusicLfo.frequency.setTargetAtTime(0.4, now, 1.0);
      this.stopAlarmSiren();
    }
  }

  public stopBackgroundTrack() {
    if (this.bgMusicOsc1) {
      try { this.bgMusicOsc1.stop(); this.bgMusicOsc1.disconnect(); } catch {}
      this.bgMusicOsc1 = null;
    }
    if (this.bgMusicOsc2) {
      try { this.bgMusicOsc2.stop(); this.bgMusicOsc2.disconnect(); } catch {}
      this.bgMusicOsc2 = null;
    }
    if (this.bgMusicLfo) {
      try { this.bgMusicLfo.stop(); this.bgMusicLfo.disconnect(); } catch {}
      this.bgMusicLfo = null;
    }
    this.stopAlarmSiren();
    this.isMusicPlaying = false;
  }

  private startAlarmSiren() {
    if (this.isAlarmSounding || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      this.alarmOsc = this.ctx.createOscillator();
      this.alarmOsc.type = 'sawtooth';
      this.alarmOsc.frequency.setValueAtTime(650, now);

      this.alarmGain = this.ctx.createGain();
      this.alarmGain.gain.setValueAtTime(0.18, now);

      // Siren pitch modulation LFO
      this.alarmLfo = this.ctx.createOscillator();
      this.alarmLfo.type = 'sine';
      this.alarmLfo.frequency.setValueAtTime(1.5, now);

      const alarmLfoGain = this.ctx.createGain();
      alarmLfoGain.gain.setValueAtTime(280, now);

      this.alarmLfo.connect(alarmLfoGain);
      alarmLfoGain.connect(this.alarmOsc.frequency);

      this.alarmOsc.connect(this.alarmGain);
      this.alarmGain.connect(this.sfxGain);

      this.alarmOsc.start(now);
      this.alarmLfo.start(now);
      this.isAlarmSounding = true;
    } catch {}
  }

  private stopAlarmSiren() {
    if (!this.isAlarmSounding) return;
    try {
      if (this.alarmOsc) { this.alarmOsc.stop(); this.alarmOsc.disconnect(); this.alarmOsc = null; }
      if (this.alarmLfo) { this.alarmLfo.stop(); this.alarmLfo.disconnect(); this.alarmLfo = null; }
      if (this.alarmGain) { this.alarmGain.disconnect(); this.alarmGain = null; }
    } catch {}
    this.isAlarmSounding = false;
  }

  // --- Sound Effects (Synthesized Sound Design) ---

  public playSilencedShot() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Subtle click transient
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.start(now);
    osc.start(now);
  }

  public playLoudShot() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy gunshot burst
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(now);
    subOsc.start(now);
  }

  public playSyncTerminalHold(freqModifier: number = 1.0) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 * freqModifier, now);
    osc.frequency.linearRampToValueAtTime(660 * freqModifier, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playSyncSuccess() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C E G C chord
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.45);
    });
  }

  public playLootCollect() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [880, 1320, 1760].forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.04);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.16);
    });
  }

  public playTakedown() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playEmpExplosion() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High electrical sweep downwards
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playSmokeGrenade() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (i / bufferSize));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  public playDownedAlert() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [400, 300, 200].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.16);
    });
  }

  public playRevived() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [261, 329, 392, 523, 659].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  public playExtractionReady() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Tactical chime fanfare
    [587.33, 739.99, 880, 1174.66].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + idx * 0.1);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  public playLaserTrip() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playButtonHover() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playButtonClick() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(1900, now + 0.03);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Synthesized tactical radio voice beep
  public playRadioBeep() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.setValueAtTime(0.1, now + 0.04);
    gain.gain.setValueAtTime(0, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const audioManager = new AudioManager();

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private soundVolume: number = 0.8;
  private musicVolume: number = 0.5;
  
  private musicPlaying: boolean = false;
  private musicInterval: any = null;
  private musicStep: number = 0;
  private currentWaveTheme: number = 1;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundVolume(volume: number) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
    }
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  // --- SOUND EFFECTS (Procedurally Synthesized for instant response & high quality) ---

  public playShoot(weaponType: string) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    switch (weaponType) {
      case 'shotgun': {
        // Heavy multi-layered blast
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);

        // Noise punch
        this.playNoiseBurst(0.2, 800, 0.6);
        break;
      }
      case 'plasma_rifle': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }
      case 'minigun': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.07);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }
      case 'rocket_launcher': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.35);
        this.playNoiseBurst(0.4, 400, 0.7);
        break;
      }
      case 'flamethrower': {
        this.playNoiseBurst(0.12, 1200, 0.25, 'bandpass');
        break;
      }
      case 'laser_beam': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600 + Math.random() * 80, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }
      case 'sniper_railgun': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
        this.playNoiseBurst(0.25, 2000, 0.5);
        break;
      }
      default: // assault rifle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
    }
  }

  public playExplosion(size: 'small' | 'medium' | 'large' = 'medium') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const duration = size === 'large' ? 0.6 : size === 'medium' ? 0.4 : 0.25;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + duration);
    
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);

    this.playNoiseBurst(duration, 350, size === 'large' ? 0.9 : 0.6);
  }

  public playMonsterHit(isBoss: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const startFreq = isBoss ? 120 : 260 + Math.random() * 80;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.4, t + 0.08);

    gain.gain.setValueAtTime(isBoss ? 0.4 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playMonsterDeath(_monsterType: string, isBoss: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    if (isBoss) {
      // Epic boss death roar & explosion combo
      this.playExplosion('large');
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.linearRampToValueAtTime(40, t + 1.0);
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.0);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playPlayerHurt() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playShieldBreak() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playDash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    this.playNoiseBurst(0.18, 1200, 0.4, 'bandpass');
  }

  public playJetpack() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    this.playNoiseBurst(0.1, 800, 0.25, 'lowpass');
  }

  public playMeleeSlash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
    this.playNoiseBurst(0.1, 1500, 0.3);
  }

  public playReload() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(880, t + 0.08);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playCreditPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const notes = [987.77, 1318.51]; // B5 -> E6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0.2, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.12);
    });
  }

  public playPowerupPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0.35, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.2);
    });
  }

  public playWaveComplete() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const chordNotes = [440, 554.37, 659.25, 880]; // A major
    chordNotes.forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const notes = [440, 415.30, 392.00, 369.99];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.18);
      gain.gain.setValueAtTime(0.4, t + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.18 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 0.3);
    });
  }

  public playUIClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.soundVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  private playNoiseBurst(duration: number, cutoff: number, volume: number = 0.5, filterType: BiquadFilterType = 'lowpass') {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(cutoff, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  // --- DYNAMIC CYBERPUNK MUSIC ENGINE ---
  public startMusic(waveNumber: number = 1) {
    this.initContext();
    this.currentWaveTheme = waveNumber;
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicStep = 0;

    const bpm = 128 + (waveNumber % 4) * 4;
    const stepTimeMs = (60 / bpm / 4) * 1000;

    this.musicInterval = setInterval(() => {
      this.tickMusicStep();
    }, stepTimeMs);
  }

  public setWaveTheme(waveNumber: number) {
    this.currentWaveTheme = waveNumber;
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicPlaying = false;
  }

  private tickMusicStep() {
    if (!this.ctx || !this.musicGain || this.musicVolume <= 0 || !this.musicPlaying) return;
    const t = this.ctx.currentTime;
    const step16 = this.musicStep % 16;
    const step64 = this.musicStep % 64;

    // Theme bass root notes depending on wave biome
    const rootNotes = [55, 65.41, 48.99, 73.42, 61.74, 51.91, 58.27, 43.65]; // A1, C2, G1, D2, B1, G#1, A#1, F1
    const baseFreq = rootNotes[(this.currentWaveTheme - 1) % rootNotes.length];

    // 1. Synth Kick on beats 0, 4, 8, 12
    if (step16 === 0 || step16 === 4 || step16 === 8 || step16 === 12) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      kickGain.gain.setValueAtTime(0.45 * this.musicVolume, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.12);
    }

    // 2. Cyber Bass Synth on 16th notes
    const bassPattern = [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0];
    if (bassPattern[step16]) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();
      
      const pitchMod = step16 % 4 === 2 ? 1.5 : (step16 % 8 === 6 ? 1.25 : 1);
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(baseFreq * pitchMod, t);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450 + Math.sin(this.musicStep * 0.1) * 200, t);
      bassFilter.Q.setValueAtTime(4, t);

      bassGain.gain.setValueAtTime(0.22 * this.musicVolume, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.1);
    }

    // 3. Hi-Hat on off-beats
    if (step16 % 2 === 1) {
      this.playSynthHiHat(t, step16 % 4 === 2);
    }

    // 4. Arpeggiator Lead melody every 2 steps
    if (step16 % 2 === 0) {
      const scale = [1, 1.2, 1.333, 1.5, 1.667, 1.875, 2];
      const noteIdx = (step64 + Math.floor(step64 / 8)) % scale.length;
      const arpFreq = baseFreq * 4 * scale[noteIdx];

      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, t);

      arpGain.gain.setValueAtTime(0.12 * this.musicVolume, t);
      arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);
      arpOsc.start(t);
      arpOsc.stop(t + 0.15);
    }

    this.musicStep++;
  }

  private playSynthHiHat(t: number, open: boolean = false) {
    if (!this.ctx || !this.musicGain) return;
    const dur = open ? 0.08 : 0.04;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime((open ? 0.15 : 0.08) * this.musicVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(t);
    noise.stop(t + dur);
  }
}

export const soundManager = new SoundManager();

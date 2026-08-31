// sound.js
// Gestor de sonido sintetizado en tiempo real usando Web Audio API

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.bgWind = null;
        this.bgCrickets = null;
        this.dangerOsc = null;
        this.dangerGain = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.enabled = true;
    }

    playJump() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        // Frecuencia inicial baja que sube rápido (efecto de resorte/salto de sapo)
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
    }

    playHurt() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    playCollect() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        // Efecto "bling" brillante al comer mosca
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.12); // G5
        osc.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.18); // C6
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playClick() {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playTalk() {
        if (!this.enabled || !this.ctx) return;
        // Un croac o sonido rápido para simular habla de animal
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playWaterSplash() {
        if (!this.enabled || !this.ctx) return;
        // Sonido de burbujas/hidratación
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playMissionComplete() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Acorde mayor
        
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.08 + 0.4);
            
            osc.start();
            osc.stop(now + index * 0.08 + 0.45);
        });
    }

    playOwl() {
        if (!this.enabled || !this.ctx) return;
        
        // Graznido de lechuza espeluznante
        const now = this.ctx.currentTime;
        
        // Primer tono
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(320, now);
        osc1.frequency.linearRampToValueAtTime(180, now + 0.4);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        
        // Segundo tono desafinado para disonancia terrorífica
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(325, now);
        osc2.frequency.linearRampToValueAtTime(175, now + 0.4);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        
        osc1.start();
        osc1.stop(now + 0.45);
        osc2.start();
        osc2.stop(now + 0.45);
    }

    startDangerBeat() {
        if (!this.enabled || !this.ctx) return;
        if (this.dangerOsc) return;

        // Sonido de latido acelerado de corazón para tensión de lechuza
        const now = this.ctx.currentTime;
        this.dangerOsc = this.ctx.createOscillator();
        this.dangerGain = this.ctx.createGain();
        
        this.dangerOsc.type = 'sine';
        this.dangerOsc.frequency.setValueAtTime(55, now); // Sub-bass
        
        // Modulación tipo latido (pulso de volumen)
        this.dangerGain.gain.setValueAtTime(0.01, now);
        
        this.dangerOsc.connect(this.dangerGain);
        this.dangerGain.connect(this.ctx.destination);
        this.dangerOsc.start();
        
        // Bucle de latido
        let isBeat = false;
        this.dangerInterval = setInterval(() => {
            if (!this.ctx || this.ctx.state === 'suspended') return;
            const t = this.ctx.currentTime;
            this.dangerGain.gain.cancelScheduledValues(t);
            if (isBeat) {
                // Latido doble
                this.dangerGain.gain.setValueAtTime(0.35, t);
                this.dangerGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                this.dangerGain.gain.setValueAtTime(0.35, t + 0.2);
                this.dangerGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            }
            isBeat = !isBeat;
        }, 500); // 120 bpm latidos
    }

    stopDangerBeat() {
        if (this.dangerInterval) {
            clearInterval(this.dangerInterval);
            this.dangerInterval = null;
        }
        if (this.dangerOsc) {
            try { this.dangerOsc.stop(); } catch(e) {}
            this.dangerOsc = null;
        }
        this.dangerGain = null;
    }

    startAmbientSounds() {
        if (!this.enabled || !this.ctx) return;
        if (this.bgWind) return;

        // 1. Ruido de Viento
        const bufferSize = this.ctx.sampleRate * 4; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; 
        }
        
        this.bgWind = this.ctx.createBufferSource();
        this.bgWind.buffer = buffer;
        this.bgWind.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350; 

        const windGain = this.ctx.createGain();
        windGain.gain.value = 0.08; 

        this.bgWind.connect(filter);
        filter.connect(windGain);
        windGain.connect(this.ctx.destination);
        this.bgWind.start();

        // 2. Grillos / Criquetes del Monte (Modulación procedimental de tono)
        // Usamos un LFO de frecuencia rápida modulando un oscilador de 4.2kHz en impulsos cortos
        this.bgCrickets = [];
        for(let j = 0; j < 3; j++) { // Tres "grillos" en diferentes frecuencias
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = 3800 + j * 300; // Alrededor de 4kHz

            lfo.type = 'sawtooth';
            lfo.frequency.value = 8 + j * 2; // Chirrido rápido de 8-12Hz
            lfoGain.gain.value = 1000; // Desviación en Hz

            // Modulación de amplitud para hacer los silencios entre chirridos
            const ampLfo = this.ctx.createOscillator();
            const ampGain = this.ctx.createGain();
            ampLfo.type = 'sine';
            ampLfo.frequency.value = 0.5 + Math.random() * 0.5; // Impulsos lentos de grillos cantando
            ampGain.gain.value = 0.02; // Volumen muy sutil

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            gain.gain.value = 0.003; // Volumen extremadamente bajo para ambiente sutil de fondo

            osc.start();
            lfo.start();
            
            this.bgCrickets.push({ osc, lfo });
        }

        // 3. Coro periódico de ranas (cada 8-15 segundos)
        const scheduleFrog = () => {
            const delay = 8000 + Math.random() * 7000;
            this.frogTimer = setTimeout(() => {
                this.playFrogChorus();
                scheduleFrog();
            }, delay);
        };
        scheduleFrog();

        // 4. Búho distante periódico (cada 25-40 segundos)
        const scheduleOwl = () => {
            const delay = 25000 + Math.random() * 15000;
            this.owlTimer = setTimeout(() => {
                this.playDistantOwl();
                scheduleOwl();
            }, delay);
        };
        scheduleOwl();

        // Inicializar el bioma de inicio (desierto) para que suenen los ambientes correctos al empezar
        this.playBiomeAmbient('desert');
    }

    stopAmbientSounds() {
        if (this.bgWind) {
            try { this.bgWind.stop(); } catch(e) {}
            this.bgWind = null;
        }
        if (this.bgCrickets) {
            this.bgCrickets.forEach(c => {
                try { c.osc.stop(); c.lfo.stop(); } catch(e) {}
            });
            this.bgCrickets = null;
        }
        if (this.frogTimer) {
            clearTimeout(this.frogTimer);
            this.frogTimer = null;
        }
        if (this.owlTimer) {
            clearTimeout(this.owlTimer);
            this.owlTimer = null;
        }
        this.stopWaterAmbient();
    }

    // ─── Coro ambiental de ranas ("ri-ri" cortos con vibrato) ───
    playFrogChorus() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const frogCount = 2 + Math.floor(Math.random() * 2); // 2-3 ranas

        for (let i = 0; i < frogCount; i++) {
            // Cada rana croa en un momento aleatorio dentro de una ventana de 2-3 s
            const offset = Math.random() * (2 + Math.random());
            const duration = 0.15 + Math.random() * 0.10; // 0.15-0.25 s
            const baseFreq = 180 + Math.random() * 70;      // 180-250 Hz

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const lfo = this.ctx.createOscillator();    // vibrato
            const lfoGain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(baseFreq, now + offset);

            // Vibrato rápido para el efecto "ri-ri"
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(28 + Math.random() * 12, now + offset); // 28-40 Hz
            lfoGain.gain.setValueAtTime(40 + Math.random() * 20, now + offset);  // desviación ±40-60 Hz

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            // Envolvente rápida: ataque inmediato, decaimiento suave
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.setValueAtTime(0.10, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + offset);
            osc.stop(now + offset + duration + 0.01);
            lfo.start(now + offset);
            lfo.stop(now + offset + duration + 0.01);
        }
    }

    // ─── Búho distante: suave "uhú-uhú" lejano ───
    playDistantOwl() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const vol = 0.06;

        // Primera nota: 340→300 Hz en 0.3 s
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(340, now);
        osc1.frequency.linearRampToValueAtTime(300, now + 0.3);
        g1.gain.setValueAtTime(vol, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(g1);
        g1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.38);

        // Segunda nota tras 0.4 s de pausa: 320→280 Hz en 0.3 s
        const startTwo = now + 0.7;
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(320, startTwo);
        osc2.frequency.linearRampToValueAtTime(280, startTwo + 0.3);
        g2.gain.setValueAtTime(0.001, now);
        g2.gain.setValueAtTime(vol, startTwo);
        g2.gain.exponentialRampToValueAtTime(0.001, startTwo + 0.35);
        osc2.connect(g2);
        g2.connect(this.ctx.destination);
        osc2.start(startTwo);
        osc2.stop(startTwo + 0.38);
    }

    // ─── Agua ambiental continua (ruido filtrado bandpass) ───
    playWaterAmbient() {
        if (!this.enabled || !this.ctx) return;
        if (this.waterAmbient) return; // ya reproduciendo

        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 800;
        bp.Q.value = 2;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.04;

        src.connect(bp);
        bp.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();

        this.waterAmbient = src;
        return src;
    }

    // ─── Detener agua ambiental ───
    stopWaterAmbient() {
        if (this.waterAmbient) {
            try { this.waterAmbient.stop(); } catch(e) {}
            this.waterAmbient = null;
        }
    }

    // ─── Crujido de hojas: ráfaga breve de ruido agudo ───
    playLeafRustle() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 0.08;

        const bufferSize = Math.ceil(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        src.connect(hp);
        hp.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
        src.stop(now + duration);
    }

    // ─── Ambiente adaptado por bioma ───
    playBiomeAmbient(biome) {
        if (!this.enabled || !this.ctx) return;

        // Detener fuentes ambientales previas que dependen del bioma
        this.stopWaterAmbient();

        // Ajustar grillos existentes según bioma
        if (this.bgCrickets) {
            switch (biome) {
                case 'desert':
                    // Desierto: menos grillos, frecuencia más baja, volumen reducido
                    this.bgCrickets.forEach((c, j) => {
                        c.osc.frequency.setValueAtTime(3200 + j * 200, this.ctx.currentTime);
                        c.lfo.frequency.setValueAtTime(5 + j, this.ctx.currentTime);
                    });
                    // Silenciar el tercer grillo
                    if (this.bgCrickets[2]) {
                        try { this.bgCrickets[2].osc.frequency.setValueAtTime(0, this.ctx.currentTime); } catch(e) {}
                    }
                    break;

                case 'forest':
                    // Bosque: grillos completos, valores originales
                    this.bgCrickets.forEach((c, j) => {
                        c.osc.frequency.setValueAtTime(3800 + j * 300, this.ctx.currentTime);
                        c.lfo.frequency.setValueAtTime(8 + j * 2, this.ctx.currentTime);
                    });
                    break;

                case 'canyon':
                    // Cañón: frecuencias medias, efecto espaciado (eco simulado por LFO lento)
                    this.bgCrickets.forEach((c, j) => {
                        c.osc.frequency.setValueAtTime(3500 + j * 250, this.ctx.currentTime);
                        c.lfo.frequency.setValueAtTime(3 + j, this.ctx.currentTime);
                    });
                    break;

                case 'lagoon':
                    // Laguna: grillos suaves + agua + ranas
                    this.bgCrickets.forEach((c, j) => {
                        c.osc.frequency.setValueAtTime(4000 + j * 200, this.ctx.currentTime);
                        c.lfo.frequency.setValueAtTime(6 + j * 2, this.ctx.currentTime);
                    });
                    this.playWaterAmbient();
                    this.playFrogChorus();
                    break;
            }
        }
    }
}

const audio = new SoundManager();


import { InputState } from '../types/game';

export class InputManager {
  private keys: Record<string, boolean> = {};
  private touchState: {
    steer: number;
    throttle: number;
    brake: number;
    handbrake: boolean;
  } = {
    steer: 0,
    throttle: 0,
    brake: 0,
    handbrake: false,
  };

  private restartRequested: boolean = false;
  private pauseRequested: boolean = false;

  constructor() {
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Prevent scrolling with Space/Arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.key.toLowerCase() === 'r') {
        this.restartRequested = true;
      }
      if (e.key.toLowerCase() === 'escape' || e.key.toLowerCase() === 'p') {
        this.pauseRequested = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  public setTouchInput(partial: Partial<typeof this.touchState>) {
    this.touchState = { ...this.touchState, ...partial };
  }

  public requestRestart() {
    this.restartRequested = true;
  }

  public requestPause() {
    this.pauseRequested = true;
  }

  public getState(): InputState {
    let steer = 0;
    let throttle = 0;
    let brake = 0;
    let handbrake = false;

    // Keyboard checks
    if (this.keys['arrowleft'] || this.keys['a'] || this.keys['keya']) steer -= 1;
    if (this.keys['arrowright'] || this.keys['d'] || this.keys['keyd']) steer += 1;
    if (this.keys['arrowup'] || this.keys['w'] || this.keys['keyw']) throttle = 1;
    if (this.keys['arrowdown'] || this.keys['s'] || this.keys['keys']) brake = 1;
    if (this.keys[' '] || this.keys['space']) handbrake = true;

    // Merge Touch inputs
    if (Math.abs(this.touchState.steer) > 0.01) {
      steer = this.touchState.steer;
    }
    if (this.touchState.throttle > 0) {
      throttle = Math.max(throttle, this.touchState.throttle);
    }
    if (this.touchState.brake > 0) {
      brake = Math.max(brake, this.touchState.brake);
    }
    if (this.touchState.handbrake) {
      handbrake = true;
    }

    // Gamepad check (if connected)
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads[1];
      if (gp) {
        // Analog stick steering (Axis 0)
        const stickX = gp.axes[0];
        if (Math.abs(stickX) > 0.1) {
          steer = stickX;
        }

        // Triggers: RT = Throttle (Button 7 / Axis 5), LT = Brake (Button 6 / Axis 4)
        if (gp.buttons[7] && gp.buttons[7].value > 0.05) {
          throttle = Math.max(throttle, gp.buttons[7].value);
        } else if (gp.buttons[0] && gp.buttons[0].pressed) {
          throttle = 1.0;
        }

        if (gp.buttons[6] && gp.buttons[6].value > 0.05) {
          brake = Math.max(brake, gp.buttons[6].value);
        } else if (gp.buttons[2] && gp.buttons[2].pressed) {
          brake = 1.0;
        }

        // Handbrake: 'B' button (button 1) or RB (button 5)
        if ((gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[5] && gp.buttons[5].pressed)) {
          handbrake = true;
        }

        // Pause: Start button (button 9)
        if (gp.buttons[9] && gp.buttons[9].pressed) {
          this.pauseRequested = true;
        }
      }
    } catch {}

    const restart = this.restartRequested;
    const pause = this.pauseRequested;
    this.restartRequested = false;
    this.pauseRequested = false;

    return {
      steer: Math.max(-1, Math.min(1, steer)),
      throttle: Math.max(0, Math.min(1, throttle)),
      brake: Math.max(0, Math.min(1, brake)),
      handbrake,
      restart,
      pause,
    };
  }

  public reset() {
    this.touchState = { steer: 0, throttle: 0, brake: 0, handbrake: false };
    this.restartRequested = false;
    this.pauseRequested = false;
  }
}

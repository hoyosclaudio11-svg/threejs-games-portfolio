class HapticsManager {
  private isVibrationSupported: boolean = false;
  private shakeTrauma: number = 0; // 0 to 1
  private shakeDecay: number = 0.92;
  private maxShakeOffset: number = 18;
  private maxShakeAngle: number = 0.05;

  constructor() {
    this.isVibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public vibrate(pattern: number | number[]) {
    if (this.isVibrationSupported) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration failure
      }
    }
  }

  // Trigger specific haptic feedback types
  public triggerShot(isSilenced: boolean = false) {
    if (isSilenced) {
      this.addShake(0.08);
      this.vibrate(15);
    } else {
      this.addShake(0.25);
      this.vibrate([40, 20, 30]);
    }
  }

  public triggerExplosion() {
    this.addShake(0.85);
    this.vibrate([80, 40, 120, 40, 80]);
  }

  public triggerAlarmTrip() {
    this.addShake(0.3);
    this.vibrate([100, 50, 100, 50, 150]);
  }

  public triggerSyncSuccess() {
    this.addShake(0.15);
    this.vibrate([30, 40, 60]);
  }

  public triggerDamageTaken() {
    this.addShake(0.45);
    this.vibrate([50, 30, 90]);
  }

  public triggerLoot() {
    this.vibrate(25);
  }

  public triggerDowned() {
    this.addShake(0.6);
    this.vibrate([200, 100, 200, 100, 300]);
  }

  public addShake(amount: number) {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + amount);
  }

  public update(dt: number): { offsetX: number; offsetY: number; angle: number } {
    if (this.shakeTrauma <= 0.001) {
      this.shakeTrauma = 0;
      return { offsetX: 0, offsetY: 0, angle: 0 };
    }

    const shake = this.shakeTrauma * this.shakeTrauma; // Non-linear feel
    const offsetX = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
    const offsetY = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
    const angle = (Math.random() * 2 - 1) * this.maxShakeAngle * shake;

    // Decay trauma
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * (1 - this.shakeDecay) * 60);

    return { offsetX, offsetY, angle };
  }

  public getTrauma(): number {
    return this.shakeTrauma;
  }
}

export const hapticsManager = new HapticsManager();

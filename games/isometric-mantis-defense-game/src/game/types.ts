import type * as THREE from "three";

export type GamePhase = "menu" | "playing" | "gameover";
export type EnemyType = "beetle" | "wasp" | "grub" | "stalker" | "brute";

/** Radio del escenario circular donde ocurre el combate. */
export const ARENA_RADIUS = 22;

export interface HudState {
  phase: GamePhase;
  mantisHp: number;
  mantisMaxHp: number;
  mantisInvuln: boolean;
  nestHp: number;
  nestMaxHp: number;
  wave: number;
  score: number;
  enemiesLeft: number;
  waveBreak: boolean;
  breakCountdown: number;
  slashCd: number;
  slashCdMax: number;
  spinCd: number;
  spinCdMax: number;
  dashCd: number;
  dashCdMax: number;
  combo: number;
  banner: string;
  bannerSub: string;
  boss: boolean;
  muted: boolean;
  kills: number;
  maxCombo: number;
}

export interface GameCallbacks {
  onHud: (s: HudState) => void;
}

/** Contexto mínimo que el juego pasa a cada enemigo cada frame. */
export interface EnemyContext {
  dt: number;
  mantisPos: THREE.Vector3;
  nestPos: THREE.Vector3;
  mantisAlive: boolean;
  mantisInvuln: boolean;
  nestRadius: number;
  damageNest: (dmg: number) => void;
  damageMantis: (dmg: number, from: THREE.Vector3) => void;
}

/** Entrada que el juego calcula y pasa a la mantis. */
export interface MantisInput {
  move: THREE.Vector3;
  aimPoint: THREE.Vector3;
  aimAngle: number;
  slash: boolean;
  spin: boolean;
  dash: boolean;
}

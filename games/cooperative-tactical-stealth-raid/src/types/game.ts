export type GameMode = 'SOLO_AI' | 'COOP_LOCAL';

export type OperativeClass = 'ghost' | 'viper' | 'titan' | 'spectre';

export interface OperativeInfo {
  id: OperativeClass;
  name: string;
  codename: string;
  role: string;
  avatarColor: string;
  speed: number;
  maxHp: number;
  armor: number;
  primaryWeapon: Weapon;
  gadget: GadgetType;
  description: string;
  specialAbility: string;
}

export type GadgetType = 'smoke_grenade' | 'emp_charge' | 'breach_c4' | 'recon_dart' | 'decoy_beacon';

export interface Weapon {
  name: string;
  type: 'pistol_silenced' | 'smg_silenced' | 'assault_rifle' | 'shotgun_suppressed' | 'sniper_suppressed';
  damage: number;
  fireRate: number; // shots per sec
  range: number;
  magSize: number;
  reloadTime: number; // seconds
  isSilenced: boolean;
  spread: number;
  bulletSpeed: number;
  color: string;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerState {
  id: 1 | 2;
  operativeClass: OperativeClass;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  ammo: number;
  isReloading: boolean;
  reloadProgress: number;
  isDowned: boolean;
  downedTimer: number; // seconds left to revive
  reviveProgress: number; // 0 to 1
  isInteracting: boolean;
  interactingTargetId: string | null;
  interactionProgress: number; // 0 to 1
  carriedLootValue: number;
  carriedLootWeight: number; // slows speed
  gadgetCount: number;
  gadgetType: GadgetType;
  lastShotTime: number;
  isShooting: boolean;
  isFlashlightOn: boolean;
  isStealthCrouch: boolean;
  color: string;
  name: string;
}

export type EnemyType = 'guard_patrol' | 'guard_elite' | 'swat_enforcer' | 'camera_turret' | 'drone_patrol' | 'heavy_boss';
export type EnemyState = 'patrol' | 'suspicious' | 'searching' | 'alert' | 'combat' | 'stunned' | 'dead';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  state: EnemyState;
  stateTimer: number;
  speed: number;
  viewDistance: number;
  viewAngle: number; // FOV cone in radians
  patrolPoints: Vector2D[];
  currentPatrolIdx: number;
  investigatePos: Vector2D | null;
  targetPlayerId: (1 | 2) | null;
  lastShotTime: number;
  detectionLevel: number; // 0 to 100
  isStunned: boolean;
  stunTimer: number;
  color: string;
  weapon: Weapon;
}

export interface SecurityCamera {
  id: string;
  x: number;
  y: number;
  angle: number;
  baseAngle: number;
  sweepAngle: number; // range of sweep
  sweepSpeed: number;
  viewDistance: number;
  viewFov: number; // radians
  isHacked: boolean;
  hackTimer: number;
  detectionLevel: number; // 0 to 100
  detectionTarget: Vector2D | null;
}

export interface SyncTerminal {
  id: string;
  pairedTerminalId: string;
  group: string;
  x: number;
  y: number;
  radius: number;
  isActivated: boolean;
  activeByPlayer: (1 | 2) | null;
  activatedTime: number;
  syncWindowSeconds: number; // e.g., 3.0s window for partner to press paired
  requiresKeycard: boolean;
  keycardColor?: 'blue' | 'red' | 'gold';
  label: string;
  isCompleted: boolean;
  unlocksDoorId: string;
  progress: number;
}

export interface SecurityLaser {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive: boolean;
  controlledByTerminalGroup: string;
  color: string;
  isOscillating?: boolean;
  oscSpeed?: number;
  oscOffset?: number;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  isLocked: boolean;
  lockedReason?: string;
  isVertical: boolean;
  unlockedByTerminalGroup?: string;
}

export interface LootItem {
  id: string;
  type: 'cash' | 'gold_bar' | 'crypto_core' | 'classified_intel' | 'prototype_disk' | 'bio_vial' | 'keycard';
  name: string;
  value: number;
  x: number;
  y: number;
  weight: number;
  isCollected: boolean;
  keycardColor?: 'blue' | 'red' | 'gold';
  isPrimaryObjective?: boolean;
}

export interface ExtractionZone {
  x: number;
  y: number;
  width: number;
  height: number;
  isActive: boolean;
  evacProgress: number; // 0 to 100
  evacRequiredSeconds: number;
  name: string;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  isCover?: boolean;
  isDestructible?: boolean;
  hp?: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  ownerType: 'player' | 'enemy';
  ownerId: 1 | 2 | string;
  color: string;
  isSilenced: boolean;
  lifetime: number;
}

export interface SmokeCloud {
  id: string;
  x: number;
  y: number;
  radius: number;
  duration: number; // seconds remaining
  maxDuration: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'blood' | 'laser' | 'dust' | 'flash' | 'casing' | 'emp';
  alpha?: number;
}

export interface Decal {
  x: number;
  y: number;
  type: 'bullet_hole' | 'blood_stain' | 'scorch';
  size: number;
  rotation: number;
  color: string;
}

export interface MissionObjective {
  id: string;
  text: string;
  isCompleted: boolean;
  isOptional: boolean;
  bonusScore: number;
}

export interface MissionConfig {
  id: string;
  name: string;
  code: string;
  location: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'NIGHTMARE';
  description: string;
  briefing: string[];
  targetLootValue: number;
  timeLimitSeconds: number;
  qrfSpawnInterval: number; // seconds when alarm is active
  mapWidth: number;
  mapHeight: number;
  spawnP1: Vector2D;
  spawnP2: Vector2D;
  walls: Wall[];
  doors: Door[];
  terminals: SyncTerminal[];
  lasers: SecurityLaser[];
  cameras: SecurityCamera[];
  enemies: Enemy[];
  loot: LootItem[];
  extractionZone: ExtractionZone;
  objectives: MissionObjective[];
}

export interface MissionResult {
  missionId: string;
  missionName: string;
  timestamp: number;
  success: boolean;
  score: number;
  grade: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  lootCollected: number;
  timeTaken: number;
  enemiesDowned: number;
  stealthKills: number;
  alarmsTriggered: number;
  syncHacksCompleted: number;
  revivesCount: number;
  damageTaken: number;
  gameMode: GameMode;
}

export interface HighScoreRecord {
  id: string;
  missionId: string;
  missionName: string;
  date: string;
  playerName: string;
  score: number;
  lootValue: number;
  timeSeconds: number;
  grade: string;
  gameMode: GameMode;
  stealthRank: string;
}

export type VisionMode = 'NORMAL' | 'NIGHT_VISION' | 'THERMAL';

export interface TacticalAlert {
  id: string;
  text: string;
  type: 'info' | 'sync' | 'alarm' | 'loot' | 'downed' | 'extraction';
  timestamp: number;
  duration: number;
}

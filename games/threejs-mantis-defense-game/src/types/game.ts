import * as THREE from 'three';

export type GameState = 
  | 'MENU' 
  | 'PLAYING' 
  | 'WAVE_CLEAR' 
  | 'EVOLUTION' 
  | 'PAUSED' 
  | 'GAME_OVER' 
  | 'VICTORY';

export type EnemyType = 
  | 'ant_worker'       // Fast, low HP, swarms
  | 'ant_soldier'      // High HP, sharp pincers
  | 'ant_acid'         // Ranged acid shooter
  | 'bee_drone'        // Aerial fast flyer
  | 'wasp_hunter'      // Aerial diver with venom
  | 'beetle_tank'      // Heavy armored tank, charges
  | 'spider_stalker'   // Fast, shoots slowing webs
  | 'boss_queen_hornet'// Wave 5 flying boss
  | 'boss_goliath_beetle' // Wave 10 behemoth
  | 'boss_locust_lord';  // Wave 15 plague lord

export interface EnemyStats {
  type: EnemyType;
  name: string;
  maxHealth: number;
  health: number;
  speed: number;
  damage: number;
  attackSpeed: number; // attacks per sec
  attackRange: number;
  isFlying: boolean;
  flyingHeight: number;
  biomassValue: number;
  scoreValue: number;
  size: number;
  color: number;
  armor: number; // percentage reduction
  targetPreference: 'nest' | 'player' | 'closest';
}

export interface EnemyInstance {
  id: string;
  type: EnemyType;
  stats: EnemyStats;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  mesh?: THREE.Object3D;
  isInstanced: boolean;
  instanceIndex?: number;
  targetPosition: THREE.Vector3;
  state: 'spawning' | 'running' | 'attacking' | 'dying' | 'stunned' | 'fleeing';
  attackCooldown: number;
  deathTimer: number;
  statusEffects: {
    slow: number; // duration remaining
    slowAmount: number; // 0..1
    poison: number; // duration
    poisonDps: number;
    stun: number; // duration
    fear: number; // duration
  };
  animationPhase: number;
  wingPhase?: number;
  chargeTimer?: number;
  isCharging?: boolean;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  biomass: number;
  totalBiomassEarned: number;
  score: number;
  level: number;
  
  // Combat stats
  meleeDamage: number;
  meleeRange: number;
  attackSpeed: number; // attacks per sec
  acidDamage: number;
  acidCooldown: number; // cooldown max
  acidSplashRadius: number;
  acidPoisonDps: number;
  
  moveSpeed: number;
  dashSpeed: number;
  dashCooldown: number;
  
  armor: number; // damage reduction %
  lifeLeech: number; // % of melee damage converted to HP
  critChance: number;
  critMultiplier: number;
  
  // Special abilities
  leapCooldown: number;
  frenzyCooldown: number;
  screechCooldown: number;
  nestPulseCooldown: number;
}

export interface Cooldowns {
  melee: number;
  acid: number;
  dash: number;
  leap: number;
  frenzy: number;
  screech: number;
  nestPulse: number;
}

export interface ActiveBuffs {
  frenzy: number; // duration
  stealth: number;
  damageBoost: number;
  speedBoost: number;
}

export interface NestStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenRate: number;
  pulseCooldown: number;
  sentryCount: number;
  radius: number;
  isUnderAttack: boolean;
  attackWarningTimer: number;
  pulseTimer: number;
}

export interface Projectile {
  id: string;
  isPlayer: boolean;
  type: 'acid' | 'stinger' | 'web' | 'spore' | 'boss_orb';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  radius: number;
  splashRadius: number;
  life: number;
  maxLife: number;
  mesh?: THREE.Object3D;
  color: number;
  effect?: 'poison' | 'slow' | 'stun';
  effectDuration?: number;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  type: 'spark' | 'blood' | 'acid' | 'spore' | 'feather' | 'shockwave' | 'smoke';
}

export interface BiomassOrb {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  value: number;
  life: number;
  type: 'green' | 'amber' | 'royal_jelly';
}

export interface DamageNumber {
  id: string;
  text: string;
  position: THREE.Vector3;
  screenPos: { x: number; y: number };
  color: string;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

export interface UpgradeOption {
  id: string;
  title: string;
  category: 'melee' | 'acid' | 'mobility' | 'nest' | 'survival' | 'ultimate';
  icon: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  cost: number;
  statBonus: (currentLevel: number) => Partial<PlayerStats> & { nestShield?: number; nestSentry?: number };
}

export interface WaveDefinition {
  waveNumber: number;
  title: string;
  totalEnemies: number;
  spawnInterval: number; // in seconds
  composition: { type: EnemyType; weight: number }[];
  bossType?: EnemyType;
  rewardBiomass: number;
  environmentMood: 'day' | 'sunset' | 'night' | 'toxic_fog' | 'blood_moon';
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  showDamageNumbers: boolean;
  screenShake: boolean;
  cameraSmoothing: number;
  showFps: boolean;
}

export interface GameSummary {
  wavesCleared: number;
  enemiesKilled: number;
  killsByType: Record<string, number>;
  totalDamageDealt: number;
  biomassCollected: number;
  timeSurvived: number; // seconds
  victory: boolean;
  reason: string;
}

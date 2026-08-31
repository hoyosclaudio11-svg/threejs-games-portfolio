export type SurfaceType = 'tarmac' | 'gravel' | 'mud' | 'snow' | 'ice' | 'grass';

export type DrivetrainType = 'AWD' | 'RWD' | 'FWD';

export interface CarSpec {
  id: string;
  name: string;
  class: string;
  drivetrain: DrivetrainType;
  horsePower: number;
  weightKg: number;
  topSpeedKmh: number;
  acceleration: number; // 0-100 rating
  handling: number;
  gripFactor: number;
  driftMultiplier: number;
  handbrakePower: number;
  suspensionStiffness: number;
  engineSoundProfile: 'v6_turbo' | 'flat4_boxer' | 'inline5_turbo' | 'inline4_revvy';
  color: string;
  accentColor: string;
  stripeColor: string;
  dimensions: {
    length: number;
    width: number;
    wheelbase: number;
    trackWidth: number;
  };
  description: string;
  difficulty: 'Novice' | 'Intermediate' | 'Master' | 'Legend';
}

export interface PaceNote {
  distanceMeters: number; // Stage distance at which note triggers
  type: 'left' | 'right' | 'hairpin_left' | 'hairpin_right' | 'crest' | 'jump' | 'caution' | 'chicane' | 'straight' | 'water_splash' | 'finish';
  severity: 1 | 2 | 3 | 4 | 5 | 6; // 1 = sharpest (first gear), 6 = slight bend (flat out)
  modifier?: 'cut' | 'dont_cut' | 'tightens' | 'opens' | 'over_crest' | 'into' | 'narrow' | 'slippery';
  text: string;
  audioCue?: string;
}

export interface Sector {
  id: number;
  distanceMeters: number;
  name: string;
  targetTimeSeconds: number;
}

export interface SplinePoint {
  x: number;
  y: number;
  width: number;
  surface: SurfaceType;
  elevation?: number;
  banking?: number;
  hazardLeft?: 'cliff' | 'trees' | 'snowbank' | 'rock' | 'barrier' | 'water';
  hazardRight?: 'cliff' | 'trees' | 'snowbank' | 'rock' | 'barrier' | 'water';
}

export interface StageObstacle {
  x: number;
  y: number;
  radius: number;
  type: 'tree' | 'rock' | 'haybale' | 'sign' | 'marshalls' | 'barrier_post';
  surface: SurfaceType;
}

export interface TrackStage {
  id: string;
  name: string;
  country: string;
  flag: string;
  location: string;
  primarySurface: SurfaceType;
  surfaceMix: { surface: SurfaceType; percentage: number }[];
  totalDistanceMeters: number;
  parTimeSeconds: number; // For Gold medal
  silverTimeSeconds: number;
  bronzeTimeSeconds: number;
  points: SplinePoint[];
  sectors: Sector[];
  paceNotes: PaceNote[];
  obstacles: StageObstacle[];
  weather: 'clear' | 'snowing' | 'raining' | 'dusty' | 'sunset';
  ambientColor: string;
  trackColor: string;
  roadsideColor: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  jumpCrests: number[];
}

export interface InputState {
  steer: number; // -1 to 1
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  handbrake: boolean;
  clutchKick?: boolean;
  restart: boolean;
  pause: boolean;
}

export interface WheelState {
  x: number;
  y: number;
  steerAngle: number;
  slipAngle: number;
  angularVelocity: number;
  skidding: boolean;
  skidIntensity: number;
  surface: SurfaceType;
  load: number; // vertical load in kg
}

export interface VehiclePhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number; // m/s
  speedKmh: number;
  angle: number; // radians
  angularVelocity: number;
  steerAngle: number;
  throttle: number;
  brake: number;
  handbrake: boolean;
  rpm: number;
  gear: number;
  weightTransferX: number; // roll (left/right)
  weightTransferY: number; // pitch (front/rear)
  lateralG: number;
  longitudinalG: number;
  driftAngle: number;
  driftScore: number;
  isDrifting: boolean;
  isAirborne: boolean;
  jumpHeight: number;
  surfaceCurrent: SurfaceType;
  distanceTravelled: number;
  wheels: {
    frontLeft: WheelState;
    frontRight: WheelState;
    rearLeft: WheelState;
    rearRight: WheelState;
  };
  boostPressure: number; // 0 to 1.8 bar
  backfireTimer: number;
  damage: number; // 0 to 100
  offTrackTime: number;
  isOffCliff: boolean;
}

export interface GhostPoint {
  time: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  steer: number;
  brake: boolean;
  drift: boolean;
}

export interface GhostData {
  stageId: string;
  carId: string;
  totalTime: number;
  points: GhostPoint[];
}

export interface HighScoreEntry {
  id: string;
  stageId: string;
  stageName: string;
  carId: string;
  carName: string;
  totalTimeSeconds: number;
  sectorTimes: number[];
  topSpeedKmh: number;
  avgSpeedKmh: number;
  maxDriftAngle: number;
  driftScore: number;
  date: string;
  cleanRun: boolean;
  medal: 'gold' | 'silver' | 'bronze' | 'none';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'mud' | 'snow' | 'gravel' | 'smoke' | 'fire' | 'water' | 'spark';
  rotation: number;
  vRot: number;
  scaleGrowth?: number;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  engineVolume: number;
  coDriverVoice: boolean;
  coDriverVolume: number;
  screenShake: boolean;
  haptics: boolean;
  dynamicCameraRotation: boolean;
  cameraZoom: 'dynamic' | 'close' | 'far';
  steeringSensitivity: number;
  speedUnit: 'kmh' | 'mph';
  touchControlsMode: 'buttons' | 'wheel' | 'joystick';
  showGhost: boolean;
  showPaceNotes: boolean;
  showTelemetry: boolean;
}

export type GameState = 'menu' | 'countdown' | 'racing' | 'paused' | 'finished' | 'crashed' | 'replay';

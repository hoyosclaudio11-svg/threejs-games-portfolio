import { HighScoreEntry, GameSettings } from '../types/game';

const HIGH_SCORES_KEY = 'apex_rally_high_scores';
const SETTINGS_KEY = 'apex_rally_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.8,
  musicVolume: 0.7,
  engineVolume: 0.85,
  coDriverVoice: true,
  coDriverVolume: 0.9,
  screenShake: true,
  haptics: true,
  dynamicCameraRotation: true,
  cameraZoom: 'dynamic',
  steeringSensitivity: 1.0,
  speedUnit: 'kmh',
  touchControlsMode: 'buttons',
  showGhost: true,
  showPaceNotes: true,
  showTelemetry: true,
};

// Initial default leaderboard records to beat
const SEED_SCORES: HighScoreEntry[] = [
  {
    id: 'rec_1',
    stageId: 'monte_carlo',
    stageName: 'Col de Turini',
    carId: 'quattro_s1',
    carName: 'Nordic Quattro S1',
    totalTimeSeconds: 67.42,
    sectorTimes: [21.8, 44.5, 67.42],
    topSpeedKmh: 198,
    avgSpeedKmh: 89.6,
    maxDriftAngle: 48,
    driftScore: 4250,
    date: '2025-01-14',
    cleanRun: true,
    medal: 'gold',
  },
  {
    id: 'rec_2',
    stageId: 'finland',
    stageName: 'Ouninpohja High Flight',
    carId: 'stratos_rs',
    carName: 'Apex Stratos HF',
    totalTimeSeconds: 57.94,
    sectorTimes: [18.9, 37.2, 57.94],
    topSpeedKmh: 218,
    avgSpeedKmh: 100.5,
    maxDriftAngle: 54,
    driftScore: 5800,
    date: '2025-01-18',
    cleanRun: true,
    medal: 'gold',
  },
  {
    id: 'rec_3',
    stageId: 'wales',
    stageName: 'Hafren Mud Ruts',
    carId: 'boxer_wrx',
    carName: 'Subaru Boxer WRX',
    totalTimeSeconds: 64.12,
    sectorTimes: [20.4, 42.8, 64.12],
    topSpeedKmh: 182,
    avgSpeedKmh: 75.8,
    maxDriftAngle: 42,
    driftScore: 3900,
    date: '2025-02-02',
    cleanRun: true,
    medal: 'gold',
  },
  {
    id: 'rec_4',
    stageId: 'corsica',
    stageName: 'Tour de Corse 10k',
    carId: 'cooper_sprint',
    carName: 'Mini Cooper Sprint',
    totalTimeSeconds: 58.45,
    sectorTimes: [17.5, 38.1, 58.45],
    topSpeedKmh: 174,
    avgSpeedKmh: 83.7,
    maxDriftAngle: 36,
    driftScore: 2800,
    date: '2025-02-10',
    cleanRun: true,
    medal: 'gold',
  },
  {
    id: 'rec_5',
    stageId: 'kenya',
    stageName: 'Safari Rift Valley',
    carId: 'quattro_s1',
    carName: 'Nordic Quattro S1',
    totalTimeSeconds: 53.25,
    sectorTimes: [15.8, 34.9, 53.25],
    topSpeedKmh: 206,
    avgSpeedKmh: 85.3,
    maxDriftAngle: 51,
    driftScore: 4600,
    date: '2025-02-15',
    cleanRun: true,
    medal: 'gold',
  },
];

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(HIGH_SCORES_KEY);
    if (raw) {
      const parsed: HighScoreEntry[] = JSON.parse(raw);
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return [...SEED_SCORES];
}

export function saveHighScore(newEntry: HighScoreEntry): boolean {
  const scores = loadHighScores();
  
  // Find if this is a new personal best for this stage
  const stageScores = scores.filter((s) => s.stageId === newEntry.stageId);
  const isBest = stageScores.length === 0 || newEntry.totalTimeSeconds < Math.min(...stageScores.map((s) => s.totalTimeSeconds));

  scores.push(newEntry);
  // Sort primarily by stage then ascending time
  scores.sort((a, b) => a.totalTimeSeconds - b.totalTimeSeconds);

  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  } catch {}

  return isBest;
}

export function getBestTimeForStage(stageId: string): number | null {
  const scores = loadHighScores().filter((s) => s.stageId === stageId);
  if (scores.length === 0) return null;
  return Math.min(...scores.map((s) => s.totalTimeSeconds));
}

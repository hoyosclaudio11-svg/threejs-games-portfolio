import { HighScoreRecord, MissionResult } from '../types/game';

const STORAGE_KEY_SCORES = 'ghost_protocol_highscores_v1';
const STORAGE_KEY_SETTINGS = 'ghost_protocol_settings_v1';
const STORAGE_KEY_UNLOCKED = 'ghost_protocol_unlocked_missions_v1';

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  vibrationEnabled: boolean;
  screenShake: boolean;
  crosshairType: 'dot' | 'tactical' | 'laser';
  nvgColor: 'green' | 'amber' | 'cyan';
  touchControlsScale: number; // 0.8 to 1.4
  playerName: string;
}

const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.85,
  musicVolume: 0.5,
  isMuted: false,
  vibrationEnabled: true,
  screenShake: true,
  crosshairType: 'tactical',
  nvgColor: 'green',
  touchControlsScale: 1.0,
  playerName: 'OPERATIVE_01',
};

const DEFAULT_SCORES: HighScoreRecord[] = [
  {
    id: 'rec_1',
    missionId: 'mission_1',
    missionName: 'Operación Blackout (Data Vault)',
    date: '2026-03-01',
    playerName: 'GHOST_ALPHA',
    score: 34500,
    lootValue: 250000,
    timeSeconds: 78,
    grade: 'S+',
    gameMode: 'COOP_LOCAL',
    stealthRank: 'GHOST SHADOW',
  },
  {
    id: 'rec_2',
    missionId: 'mission_1',
    missionName: 'Operación Blackout (Data Vault)',
    date: '2026-02-28',
    playerName: 'VIPER_NET',
    score: 28900,
    lootValue: 220000,
    timeSeconds: 94,
    grade: 'S',
    gameMode: 'SOLO_AI',
    stealthRank: 'SILENT INFILTRATOR',
  },
  {
    id: 'rec_3',
    missionId: 'mission_2',
    missionName: 'Búnker Criogénico (Bio-Tech)',
    date: '2026-03-02',
    playerName: 'APEX_DUO',
    score: 42000,
    lootValue: 500000,
    timeSeconds: 125,
    grade: 'S+',
    gameMode: 'COOP_LOCAL',
    stealthRank: 'MASTER HEIST',
  },
  {
    id: 'rec_4',
    missionId: 'mission_3',
    missionName: 'Ciudadela de Hierro (Black Site)',
    date: '2026-03-03',
    playerName: 'SHADOW_REAPER',
    score: 51200,
    lootValue: 750000,
    timeSeconds: 154,
    grade: 'S',
    gameMode: 'COOP_LOCAL',
    stealthRank: 'ZERO TRACE',
  }
];

export const getStoredHighScores = (): HighScoreRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(DEFAULT_SCORES));
      return DEFAULT_SCORES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SCORES;
  }
};

export const saveHighScore = (result: MissionResult, playerName: string = 'OPERATIVE'): HighScoreRecord => {
  const current = getStoredHighScores();
  const newRecord: HighScoreRecord = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    missionId: result.missionId,
    missionName: result.missionName,
    date: new Date().toISOString().split('T')[0],
    playerName: playerName.trim() || 'OPERATIVE',
    score: result.score,
    lootValue: result.lootCollected,
    timeSeconds: Math.floor(result.timeTaken),
    grade: result.grade,
    gameMode: result.gameMode,
    stealthRank: result.alarmsTriggered === 0 ? 'GHOST SHADOW' : result.alarmsTriggered <= 1 ? 'TACTICAL RAID' : 'ASSAULT SURVIVOR',
  };

  const updated = [newRecord, ...current].sort((a, b) => b.score - a.score).slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(updated));
  } catch {}
  return newRecord;
};

export const getStoredSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {}
};

export const getUnlockedMissions = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED);
    if (!raw) {
      const initial = ['mission_1', 'mission_2'];
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return ['mission_1', 'mission_2'];
  }
};

export const unlockMission = (missionId: string) => {
  const current = getUnlockedMissions();
  if (!current.includes(missionId)) {
    current.push(missionId);
    try {
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(current));
    } catch {}
  }
};

export interface HighScoreEntry {
  name: string;
  score: number;
  wave: number;
  date: string;
}

const STORAGE_KEY = "ant-blade-highscores-v1";
const MAX_ENTRIES = 10;

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is HighScoreEntry =>
          e &&
          typeof e.name === "string" &&
          typeof e.score === "number" &&
          typeof e.wave === "number" &&
          typeof e.date === "string"
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveHighScores(entries: HighScoreEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

export function qualifiesForHighScore(score: number): boolean {
  const scores = loadHighScores();
  if (scores.length < MAX_ENTRIES) return score > 0;
  return score > scores[scores.length - 1].score;
}

export function addHighScore(name: string, score: number, wave: number): HighScoreEntry[] {
  const scores = loadHighScores();
  const entry: HighScoreEntry = {
    name: name.trim().slice(0, 12) || "ANT",
    score: Math.floor(score),
    wave,
    date: new Date().toISOString().slice(0, 10),
  };
  const updated = [...scores, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  saveHighScores(updated);
  return updated;
}

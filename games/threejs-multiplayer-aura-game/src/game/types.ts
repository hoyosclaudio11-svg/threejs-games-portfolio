/**
 * Constantes, datos y tipos compartidos de AURA FARM 1v1.
 * El "farmeo de aura" se resuelve con un algoritmo de puntuación
 * basado en tiempo (carga), variedad (combos), distancia (intimidación)
 * y reacción del oponente (contraataques por tiers).
 */

export type Mode = 'local' | 'cpu'
export type Difficulty = 'facil' | 'normal' | 'dificil'
export type Phase = 'idle' | 'countdown' | 'running' | 'paused' | 'finished'

export const GAME_TIME = 90          // duración de la partida (segundos)
export const AURA_GOAL = 1500        // umbral de AURA para ganar
export const ARENA_RADIUS = 14       // radio del escenario circular
export const CENTER_RADIUS = 4.6     // zona central ("escenario"): +25% de aura
export const PLAYER_RADIUS = 0.55    // radio de colisión de los avatares

export interface PoseDef {
  id: string
  name: string
  emoji: string
  tier: number        // 1..3: define quién gana un choque de poses
  duration: number    // segundos que tarda en completarse
  cooldown: number    // segundos de recarga
  base: number        // aura base que otorga
}

export interface PlayerColors {
  primary: number
  accent: number
  skin: number
}

export interface PlayerSetup {
  name: string
  css: string
  keys: string[]      // etiquetas de teclas de poses (HUD)
  colors: PlayerColors
}

export const PLAYER_SETUPS: PlayerSetup[] = [
  {
    name: 'AZUL',
    css: '#38bdf8',
    keys: ['Z', 'X', 'C'],
    colors: { primary: 0x3b82f6, accent: 0x22d3ee, skin: 0xf6c99a },
  },
  {
    name: 'ROSA',
    css: '#e879f9',
    keys: ['U', 'I', 'O'],
    colors: { primary: 0xd946ef, accent: 0xfacc15, skin: 0xd8a97e },
  },
]

/** Poses por jugador: tier 1 (rápida), tier 2 (media), tier 3 (pesada). */
export const POSES: PoseDef[][] = [
  [
    { id: 'mirada',  name: 'Mirada Fría',  emoji: '🧊', tier: 1, duration: 1.5, cooldown: 2.5, base: 50 },
    { id: 'flex',    name: 'Doble Flex',   emoji: '💪', tier: 2, duration: 1.9, cooldown: 5.0, base: 95 },
    { id: 'final',   name: 'Pose Final',   emoji: '🌟', tier: 3, duration: 2.6, cooldown: 9.0, base: 190 },
  ],
  [
    { id: 'dab',     name: 'Dab Fugaz',    emoji: '🕶️', tier: 1, duration: 1.5, cooldown: 2.5, base: 50 },
    { id: 'esgrima', name: 'Arco Esgrima', emoji: '🤺', tier: 2, duration: 1.9, cooldown: 5.0, base: 95 },
    { id: 'rugido',  name: 'Rugido Titán', emoji: '🔥', tier: 3, duration: 2.6, cooldown: 9.0, base: 190 },
  ],
]

// ---------- Tipos para el HUD (React) ----------

export interface PoseHud extends PoseDef {
  cd: number          // recarga restante en segundos
}

export interface PlayerHud {
  name: string
  css: string
  aura: number
  combo: number
  charging: boolean
  poseName: string
  auraRate: number    // aura/s estimada mientras carga
  poses: PoseHud[]
}

export interface LogEntry {
  id: number
  text: string
  color: string
}

export interface HudState {
  phase: Phase
  countdown: number
  time: number
  muted: boolean
  winner: -1 | 0 | 1 | null   // -1 = empate
  players: PlayerHud[]
  log: LogEntry[]
}

// ---------- Utilidades ----------

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

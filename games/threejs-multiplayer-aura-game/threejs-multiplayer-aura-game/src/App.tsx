import { useEffect, useRef, useState } from 'react'
import { AuraGame } from './game/Game'
import {
  AURA_GOAL,
  GAME_TIME,
  PLAYER_SETUPS,
  POSES,
  type Difficulty,
  type HudState,
  type Mode,
  type PoseHud,
} from './game/types'

const INITIAL_HUD: HudState = {
  phase: 'idle',
  countdown: 0,
  time: GAME_TIME,
  muted: false,
  winner: null,
  players: [],
  log: [],
}

const fmtTime = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<AuraGame | null>(null)
  const [hud, setHud] = useState<HudState>(INITIAL_HUD)
  const [mode, setMode] = useState<Mode>('local')
  const [diff, setDiff] = useState<Difficulty>('normal')

  useEffect(() => {
    if (!mountRef.current) return
    const game = new AuraGame(mountRef.current, setHud)
    gameRef.current = game
    return () => {
      game.dispose()
      gameRef.current = null
    }
  }, [])

  const start = (m: Mode) => {
    setMode(m)
    gameRef.current?.start(m, diff)
  }

  const revancha = () => gameRef.current?.start(mode, diff)
  const menu = () => gameRef.current?.toMenu()
  const pauseToggle = () => gameRef.current?.togglePause()
  const mute = () => gameRef.current?.toggleMute()

  const inGame = hud.phase !== 'idle'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0d0a1f] text-white select-none">
      {/* Lienzo three.js */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ============ HUD EN PARTIDA ============ */}
      {inGame && (
        <>
          {/* Temporizador central */}
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-2 text-center backdrop-blur">
              <div
                className={`font-display text-3xl tracking-widest ${
                  hud.time <= 10 && hud.phase === 'running' ? 'animate-pulse text-red-400' : ''
                }`}
              >
                {fmtTime(hud.time)}
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                meta · {AURA_GOAL} aura
              </div>
            </div>
          </div>

          {/* Paneles de jugadores */}
          {hud.players.map((p, pi) => (
            <PlayerPanel key={pi} p={p} pi={pi} />
          ))}

          {/* Log de eventos */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4">
            {hud.log.map((l) => (
              <div
                key={l.id}
                className="anim-login rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-semibold backdrop-blur"
                style={{ color: l.color }}
              >
                {l.text}
              </div>
            ))}
          </div>

          {/* Botones de utilidad */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={mute}
              className="pointer-events-auto rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-lg backdrop-blur transition hover:bg-slate-800/80"
              title="Silencio (M)"
            >
              {hud.muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={pauseToggle}
              className="pointer-events-auto rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-lg backdrop-blur transition hover:bg-slate-800/80"
              title="Pausa (P / ESC)"
            >
              {hud.phase === 'paused' ? '▶️' : '⏸️'}
            </button>
          </div>
        </>
      )}

      {/* ============ CUENTA REGRESIVA ============ */}
      {hud.phase === 'countdown' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            key={Math.ceil(hud.countdown)}
            className="anim-pop font-display text-[10rem] text-yellow-300 drop-shadow-[0_0_40px_rgba(253,224,71,0.6)]"
          >
            {Math.ceil(hud.countdown)}
          </div>
        </div>
      )}

      {/* ============ PAUSA ============ */}
      {hud.phase === 'paused' && (
        <Overlay>
          <h2 className="font-display text-5xl tracking-widest">PAUSA</h2>
          <p className="mt-2 text-slate-400">El aura no espera… pero puede esperar.</p>
          <div className="mt-8 flex gap-4">
            <button onClick={pauseToggle} className={btnPrimary}>
              ▶ Reanudar
            </button>
            <button onClick={menu} className={btnGhost}>
              Menú
            </button>
          </div>
        </Overlay>
      )}

      {/* ============ FIN DE PARTIDA ============ */}
      {hud.phase === 'finished' && hud.winner !== null && (
        <Overlay>
          <div className="text-6xl">{hud.winner === -1 ? '🤝' : '🏆'}</div>
          <h2 className="mt-3 font-display text-5xl tracking-widest">
            {hud.winner === -1
              ? 'EMPATE'
              : `${hud.players[hud.winner]?.name} GANA`}
          </h2>
          <div className="mt-4 flex items-center gap-8 text-lg">
            {hud.players.map((p, i) => (
              <div key={i} className="text-center">
                <div className="text-xs uppercase tracking-widest text-slate-400">{p.name}</div>
                <div className="font-display text-3xl" style={{ color: p.css }}>
                  {p.aura}
                </div>
                <div className="text-xs text-slate-500">AURA</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={revancha} className={btnPrimary}>
              ⚔️ Revancha
            </button>
            <button onClick={menu} className={btnGhost}>
              Menú
            </button>
          </div>
        </Overlay>
      )}

      {/* ============ MENÚ PRINCIPAL ============ */}
      {hud.phase === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center">
              <div className="anim-float text-5xl">✨</div>
              <h1 className="font-display mt-2 bg-gradient-to-r from-sky-400 via-fuchsia-400 to-yellow-300 bg-clip-text text-6xl tracking-widest text-transparent">
                AURA FARM
              </h1>
              <p className="mt-2 text-sm uppercase tracking-[0.4em] text-slate-400">
                1 vs 1 · farmeo de aura · three.js
              </p>
              <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300">
                Posá, intimida y sorprendé a tu rival para farmear <b>AURA</b>. El primero en
                llegar a <b className="text-yellow-300">{AURA_GOAL} AURA</b> — o el que más
                tenga a los <b className="text-yellow-300">{GAME_TIME}s</b> — gana.
              </p>
            </div>

            {/* Selección de modo */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button onClick={() => start('local')} className={modeCard(mode === 'local')}>
                <span className="text-3xl">🕹️</span>
                <span className="font-display text-xl">1v1 LOCAL</span>
                <span className="text-xs text-slate-400">2 jugadores · mismo teclado</span>
              </button>
              <button onClick={() => start('cpu')} className={modeCard(mode === 'cpu')}>
                <span className="text-3xl">🤖</span>
                <span className="font-display text-xl">1v1 vs CPU</span>
                <span className="text-xs text-slate-400">IA con reacción por tiers</span>
              </button>
            </div>

            {/* Dificultad */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="mr-1 text-xs uppercase tracking-widest text-slate-500">
                Dificultad CPU
              </span>
              {(['facil', 'normal', 'dificil'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDiff(d)}
                  className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                    diff === d
                      ? 'bg-yellow-400 text-slate-950'
                      : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {d === 'facil' ? 'Fácil' : d === 'normal' ? 'Normal' : 'Difícil'}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {/* Controles */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                  🎮 Controles
                </h3>
                {PLAYER_SETUPS.map((s, pi) => (
                  <div key={pi} className="mb-3">
                    <div className="text-sm font-bold" style={{ color: s.css }}>
                      {s.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                      <span className="mr-2">Mover:</span>
                      <kbd>W</kbd>
                      <kbd>A</kbd>
                      <kbd>S</kbd>
                      <kbd>D</kbd>
                      <span className="mx-2 text-slate-500">|</span>
                      <kbd>↑</kbd>
                      <kbd>←</kbd>
                      <kbd>↓</kbd>
                      <kbd>→</kbd>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                      <span className="mr-2">Poses:</span>
                      {POSES[pi].map((pose, i) => (
                        <span key={pose.id} className="flex items-center gap-1">
                          <kbd>{s.keys[i]}</kbd>
                          <span>{pose.emoji}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-xs text-slate-500">
                  <kbd>P</kbd> / <kbd>ESC</kbd> pausa · <kbd>M</kbd> silencio
                </div>
              </div>

              {/* Reglas */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                  ⚡ Cómo farmear AURA
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>📍 Posá <b>cerca del rival</b>: la intimidación multiplica tu aura (hasta ×1.55).</li>
                  <li>🔵 El anillo central del escenario da <b>+25%</b> de aura.</li>
                  <li>🔁 <b>Variá las poses</b> para subir el combo (hasta ×1.75). Repetir lo rompe.</li>
                  <li>⚔️ Cada pose tiene un <b>tier (● ●● ●●●)</b>: un tier superior interrumpe al rival y <b>roba la mitad de su carga</b>.</li>
                  <li>🎭 Reaccionar a la pose rival suma <b>+12%</b>.</li>
                  <li>⛔ Posar te <b>enraíza</b>: elegí bien el momento.</li>
                </ul>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-500">
              Requiere teclado físico · Probado en Chrome / Firefox / Edge · three.js (última versión)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================= Componentes del HUD ================= */

const btnPrimary =
  'rounded-xl bg-yellow-400 px-8 py-3 font-display text-lg text-slate-950 shadow-lg shadow-yellow-400/20 transition hover:scale-105 hover:bg-yellow-300 cursor-pointer'
const btnGhost =
  'rounded-xl border border-white/15 bg-white/5 px-8 py-3 font-display text-lg text-slate-200 transition hover:bg-white/10 cursor-pointer'

const modeCard = (active: boolean) =>
  `flex flex-col items-center gap-1 rounded-2xl border p-5 transition cursor-pointer ${
    active
      ? 'border-yellow-400/60 bg-yellow-400/10 shadow-lg shadow-yellow-400/10'
      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
  }`

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-slate-950/80 px-10 py-8 text-center shadow-2xl">
        {children}
      </div>
    </div>
  )
}

function PlayerPanel({ p, pi }: { p: HudState['players'][number]; pi: number }) {
  const keys = PLAYER_SETUPS[pi].keys
  const pct = Math.min(100, (p.aura / AURA_GOAL) * 100)

  return (
    <div
      className={`pointer-events-none absolute top-20 w-52 rounded-2xl border bg-slate-950/70 p-3 backdrop-blur ${
        pi === 0 ? 'left-3' : 'right-3'
      }`}
      style={{ borderColor: `${p.css}55` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm tracking-widest" style={{ color: p.css }}>
          {p.name}
        </span>
        {p.combo > 1 && (
          <span className="anim-pop rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-bold text-orange-300">
            🔥 ×{p.combo}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-4xl" style={{ color: p.css }}>
          {p.aura}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">aura</span>
      </div>

      {/* Progreso hacia la meta */}
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: p.css }}
        />
      </div>

      {p.charging && (
        <div className="mt-2 rounded-lg px-2 py-1 text-[11px] font-semibold" style={{ background: `${p.css}22`, color: p.css }}>
          ⚡ {p.poseName} · +{p.auraRate}/s
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {p.poses.map((pose, i) => (
          <PoseChip key={pose.id} pose={pose} kbd={keys[i]} css={p.css} active={p.charging && p.poseName === pose.name} />
        ))}
      </div>
    </div>
  )
}

function PoseChip({ pose, kbd, css, active }: { pose: PoseHud; kbd: string; css: string; active: boolean }) {
  const pct = Math.min(100, (pose.cd / pose.cooldown) * 100)
  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-white/5 text-center ${
        active ? 'anim-pulse-glow' : ''
      }`}
      style={{ borderColor: active ? css : 'rgba(255,255,255,0.1)' }}
    >
      <div className="relative z-10 py-1">
        <div className="text-base leading-none">{pose.emoji}</div>
        <div className="mt-0.5 flex items-center justify-center gap-0.5">
          <kbd className="!px-1 !py-0 text-[9px]">{kbd}</kbd>
          <span className="text-[8px] leading-none" style={{ color: css }}>
            {'●'.repeat(pose.tier)}
            <span className="text-white/20">{'●'.repeat(3 - pose.tier)}</span>
          </span>
        </div>
      </div>
      {/* Recarga (se llena de abajo hacia arriba) */}
      {pct > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 z-0 bg-slate-950/80"
          style={{ height: `${pct}%` }}
        />
      )}
    </div>
  )
}

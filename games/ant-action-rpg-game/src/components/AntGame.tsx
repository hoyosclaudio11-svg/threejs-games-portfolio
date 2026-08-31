import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine, type GameStats } from "../game/engine";
import {
  addHighScore,
  loadHighScores,
  qualifiesForHighScore,
  type HighScoreEntry,
} from "../game/highScores";
import VirtualJoystick from "./VirtualJoystick";

type GameState = "start" | "playing" | "paused" | "gameover";

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};
const ATTACK_KEYS = new Set(["Space", "KeyJ", "KeyZ"]);
const DASH_KEYS = new Set(["ShiftLeft", "ShiftRight", "KeyK", "KeyX"]);
const PAUSE_KEYS = new Set(["Escape", "KeyP"]);

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export default function AntGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const keysDown = useRef<Set<string>>(new Set());
  const joystickVec = useRef({ x: 0, y: 0 });

  const [gameState, setGameState] = useState<GameState>("start");
  const [hud, setHud] = useState({ score: 0, hp: 100, maxHp: 100, combo: 0, wave: 1 });
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [touchAvailable] = useState(isTouchDevice);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    setHighScores(loadHighScores());
  }, []);

  // ---------- Engine setup ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onScoreChange: (score) => setHud((h) => (h.score === score ? h : { ...h, score })),
      onHealthChange: (hp, maxHp) => setHud((h) => ({ ...h, hp, maxHp })),
      onComboChange: (combo) => setHud((h) => (h.combo === combo ? h : { ...h, combo })),
      onWaveChange: (wave) => setHud((h) => (h.wave === wave ? h : { ...h, wave })),
      onGameOver: (stats) => {
        setFinalStats(stats);
        setScoreSaved(false);
        setNameInput("");
        setGameState("gameover");
      },
    });
    engineRef.current = engine;
    engine.start();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engine.resize(width, height);
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
    };
  }, []);

  // ---------- Keyboard input ----------
  const recomputeMoveVector = useCallback(() => {
    let x = 0;
    let y = 0;
    for (const code of keysDown.current) {
      const v = MOVE_KEYS[code];
      if (v) {
        x += v[0];
        y += v[1];
      }
    }
    const engine = engineRef.current;
    if (!engine) return;
    if (x !== 0 || y !== 0) {
      engine.input.moveX = x;
      engine.input.moveY = y;
    } else if (Math.abs(joystickVec.current.x) < 0.001 && Math.abs(joystickVec.current.y) < 0.001) {
      engine.input.moveX = 0;
      engine.input.moveY = 0;
    } else {
      engine.input.moveX = joystickVec.current.x;
      engine.input.moveY = joystickVec.current.y;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (PAUSE_KEYS.has(e.code)) {
        e.preventDefault();
        setGameState((prev) => {
          if (prev === "playing") return "paused";
          if (prev === "paused") return "playing";
          return prev;
        });
        return;
      }
      if (gameStateRef.current !== "playing") return;
      if (MOVE_KEYS[e.code] || ATTACK_KEYS.has(e.code) || DASH_KEYS.has(e.code)) {
        e.preventDefault();
      }
      if (MOVE_KEYS[e.code]) {
        keysDown.current.add(e.code);
        recomputeMoveVector();
      }
      const engine = engineRef.current;
      if (!engine) return;
      if (ATTACK_KEYS.has(e.code)) engine.input.attackPressed = true;
      if (DASH_KEYS.has(e.code)) engine.input.dashPressed = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (MOVE_KEYS[e.code]) {
        keysDown.current.delete(e.code);
        recomputeMoveVector();
      }
      const engine = engineRef.current;
      if (!engine) return;
      if (ATTACK_KEYS.has(e.code)) engine.input.attackPressed = false;
      if (DASH_KEYS.has(e.code)) engine.input.dashPressed = false;
    };
    const handleBlur = () => {
      keysDown.current.clear();
      const engine = engineRef.current;
      if (engine) {
        engine.input.moveX = 0;
        engine.input.moveY = 0;
        engine.input.attackPressed = false;
        engine.input.dashPressed = false;
      }
      setGameState((prev) => (prev === "playing" ? "paused" : prev));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleBlur();
    });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [recomputeMoveVector]);

  // ---------- Sync gameState with engine active flag ----------
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (gameState === "playing") {
      engine.resume();
    } else {
      engine.pause();
    }
  }, [gameState]);

  const handleJoystickChange = useCallback(
    (x: number, y: number) => {
      joystickVec.current = { x, y };
      if (keysDown.current.size === 0) {
        const engine = engineRef.current;
        if (engine) {
          engine.input.moveX = x;
          engine.input.moveY = y;
        }
      }
    },
    []
  );

  const handleStart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    setHud({ score: 0, hp: engine.player.maxHp, maxHp: engine.player.maxHp, combo: 0, wave: 1 });
    setGameState("playing");
  }, []);

  const handleRestart = useCallback(() => {
    handleStart();
  }, [handleStart]);

  const handleSaveScore = useCallback(() => {
    if (!finalStats) return;
    const updated = addHighScore(nameInput || "ANT", finalStats.score, finalStats.wave);
    setHighScores(updated);
    setScoreSaved(true);
  }, [finalStats, nameInput]);

  const heartsCount = 5;
  const heartValue = hud.maxHp / heartsCount;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#1a2a12] p-0 sm:p-4">
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-[#42602a] shadow-2xl sm:aspect-[16/10] sm:h-auto sm:max-h-full sm:max-w-5xl sm:rounded-2xl sm:border-4 sm:border-[#2d4318]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none" />

        {/* ---------- HUD (playing / paused) ---------- */}
        {(gameState === "playing" || gameState === "paused") && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {Array.from({ length: heartsCount }).map((_, i) => {
                    const filled = clampFrac(hud.hp - i * heartValue, heartValue);
                    return <Heart key={i} frac={filled} />;
                  })}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 backdrop-blur-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Wave</span>
                  <span className="text-sm font-black text-white">{hud.wave}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="rounded-full bg-black/35 px-4 py-1.5 backdrop-blur-sm">
                  <span className="font-mono text-lg font-black text-amber-300 drop-shadow">
                    {hud.score.toLocaleString()}
                  </span>
                </div>
                {hud.combo > 1 && (
                  <div className="animate-pulse rounded-full bg-orange-500/80 px-3 py-1 text-xs font-black text-white shadow-lg">
                    {hud.combo}x COMBO
                  </div>
                )}
                <button
                  onClick={() => setGameState((s) => (s === "playing" ? "paused" : "playing"))}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-90"
                  aria-label="Pause"
                >
                  <PauseIcon />
                </button>
              </div>
            </div>

            {/* Touch controls */}
            {touchAvailable && gameState === "playing" && (
              <div className="pointer-events-auto flex items-end justify-between">
                <VirtualJoystick onChange={handleJoystickChange} />
                <div className="flex items-end gap-3">
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const engine = engineRef.current;
                      if (engine) engine.input.dashPressed = true;
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      const engine = engineRef.current;
                      if (engine) engine.input.dashPressed = false;
                    }}
                    onPointerLeave={() => {
                      const engine = engineRef.current;
                      if (engine) engine.input.dashPressed = false;
                    }}
                    style={{ touchAction: "none" }}
                    className="flex h-16 w-16 select-none items-center justify-center rounded-full border-2 border-sky-200/50 bg-sky-500/40 text-2xl text-white shadow-lg backdrop-blur-sm active:scale-90"
                  >
                    💨
                  </button>
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const engine = engineRef.current;
                      if (engine) engine.input.attackPressed = true;
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      const engine = engineRef.current;
                      if (engine) engine.input.attackPressed = false;
                    }}
                    onPointerLeave={() => {
                      const engine = engineRef.current;
                      if (engine) engine.input.attackPressed = false;
                    }}
                    style={{ touchAction: "none" }}
                    className="flex h-20 w-20 select-none items-center justify-center rounded-full border-2 border-red-200/50 bg-red-500/50 text-3xl text-white shadow-lg backdrop-blur-sm active:scale-90"
                  >
                    ⚔️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- Start Screen ---------- */}
        {gameState === "start" && (
          <StartScreen onStart={handleStart} highScores={highScores} touchAvailable={touchAvailable} />
        )}

        {/* ---------- Pause overlay ---------- */}
        {gameState === "paused" && (
          <Overlay>
            <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">PAUSED</h2>
            <div className="flex flex-col gap-3 w-56">
              <MenuButton onClick={() => setGameState("playing")}>Resume</MenuButton>
              <MenuButton onClick={handleRestart} variant="secondary">
                Restart
              </MenuButton>
              <MenuButton onClick={() => setGameState("start")} variant="ghost">
                Main Menu
              </MenuButton>
            </div>
          </Overlay>
        )}

        {/* ---------- Game Over overlay ---------- */}
        {gameState === "gameover" && finalStats && (
          <Overlay>
            <h2 className="text-4xl font-black tracking-tight text-red-400 drop-shadow-lg">GAME OVER</h2>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-black/40 px-6 py-3 text-center">
              <Stat label="Score" value={finalStats.score.toLocaleString()} />
              <Stat label="Kills" value={finalStats.kills.toString()} />
              <Stat label="Wave" value={finalStats.wave.toString()} />
            </div>

            {!scoreSaved && qualifiesForHighScore(finalStats.score) && (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-black/30 p-3">
                <p className="text-sm font-bold text-amber-200">New High Score! Enter your name:</p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    maxLength={12}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveScore();
                    }}
                    placeholder="ANT"
                    className="w-32 rounded-md border-2 border-amber-300/50 bg-black/40 px-2 py-1 text-center font-mono text-lg font-bold uppercase text-white outline-none focus:border-amber-300"
                  />
                  <button
                    onClick={handleSaveScore}
                    className="rounded-md bg-amber-400 px-4 py-1 font-bold text-black hover:bg-amber-300 active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <HighScoreTable scores={highScores} />

            <div className="flex flex-col gap-3 w-56">
              <MenuButton onClick={handleRestart}>Play Again</MenuButton>
              <MenuButton onClick={() => setGameState("start")} variant="ghost">
                Main Menu
              </MenuButton>
            </div>
          </Overlay>
        )}
      </div>
    </div>
  );
}

function clampFrac(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

function Heart({ frac }: { frac: number }) {
  return (
    <div className="relative h-6 w-6 drop-shadow">
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
        <path
          d="M12 21s-7.5-4.8-10-9.3C.4 8.3 2 4.5 5.6 4.1c2-.2 3.7.8 4.7 2.3 1-1.5 2.7-2.5 4.7-2.3 3.6.4 5.2 4.2 3.6 7.6C19.5 16.2 12 21 12 21z"
          fill="rgba(0,0,0,0.35)"
        />
      </svg>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - frac * 100}% 0 0)` }}>
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <path
            d="M12 21s-7.5-4.8-10-9.3C.4 8.3 2 4.5 5.6 4.1c2-.2 3.7.8 4.7 2.3 1-1.5 2.7-2.5 4.7-2.3 3.6.4 5.2 4.2 3.6 7.6C19.5 16.2 12 21 12 21z"
            fill="#ff4d5e"
            stroke="#7a0f1c"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 p-4 text-center backdrop-blur-sm">
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-lg font-black text-white">{value}</span>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary:
      "bg-gradient-to-b from-amber-300 to-orange-500 text-black shadow-lg shadow-orange-900/40 hover:brightness-105",
    secondary: "bg-white/15 text-white hover:bg-white/25",
    ghost: "bg-transparent text-white/70 hover:text-white",
  }[variant];
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl py-3 text-base font-black uppercase tracking-wide transition active:scale-95 ${styles}`}
    >
      {children}
    </button>
  );
}

function HighScoreTable({ scores }: { scores: HighScoreEntry[] }) {
  if (scores.length === 0) return null;
  return (
    <div className="max-h-40 w-64 overflow-y-auto rounded-lg bg-black/30 p-2">
      <table className="w-full text-left text-xs text-white/90">
        <thead>
          <tr className="text-white/40">
            <th className="px-1 font-bold">#</th>
            <th className="px-1 font-bold">Name</th>
            <th className="px-1 font-bold">Wave</th>
            <th className="px-1 text-right font-bold">Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i} className="odd:bg-white/5">
              <td className="px-1 py-0.5">{i + 1}</td>
              <td className="px-1 py-0.5 font-bold">{s.name}</td>
              <td className="px-1 py-0.5">{s.wave}</td>
              <td className="px-1 py-0.5 text-right font-mono text-amber-300">{s.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StartScreen({
  onStart,
  highScores,
  touchAvailable,
}: {
  onStart: () => void;
  highScores: HighScoreEntry[];
  touchAvailable: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-gradient-to-b from-[#3a5a22] via-[#2e4a1c] to-[#1e3212] px-4 py-6 text-center">
      <div className="flex flex-col items-center gap-1">
        <span className="text-6xl drop-shadow-lg">🐜</span>
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
          ANT <span className="text-amber-400">BLADE</span>
        </h1>
        <p className="max-w-xs text-sm font-medium text-white/70">
          Defend the colony! Slash bugs, dash through danger, and survive the swarm.
        </p>
      </div>

      <button
        onClick={onStart}
        className="animate-bounce rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 px-10 py-4 text-xl font-black uppercase tracking-wide text-black shadow-xl shadow-orange-900/50 transition hover:brightness-105 active:scale-95"
      >
        Start Game
      </button>

      <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl bg-black/30 px-4 py-3 text-xs text-white/80">
        {touchAvailable ? (
          <>
            <ControlHint icon="🕹️" text="Move" />
            <ControlHint icon="⚔️" text="Attack" />
            <ControlHint icon="💨" text="Dash" />
          </>
        ) : (
          <>
            <ControlHint icon="⌨️" text="WASD / Arrows to move" />
            <ControlHint icon="␣" text="Space to attack" />
            <ControlHint icon="⇧" text="Shift to dash" />
            <ControlHint icon="Esc" text="Pause" />
          </>
        )}
      </div>

      {highScores.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-300">High Scores</h3>
          <HighScoreTable scores={highScores} />
        </div>
      )}
    </div>
  );
}

function ControlHint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex h-6 min-w-6 items-center justify-center rounded bg-white/15 px-1 font-bold">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

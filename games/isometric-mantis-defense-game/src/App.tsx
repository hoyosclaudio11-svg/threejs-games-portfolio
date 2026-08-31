import { useEffect, useRef, useState, type ReactNode } from "react";
import { Game } from "./game/game";
import type { HudState } from "./game/types";

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function HealthBar({
  label,
  icon,
  value,
  max,
  from,
  to,
  low,
  flash,
}: {
  label: string;
  icon: string;
  value: number;
  max: number;
  from: string;
  to: string;
  low: boolean;
  flash?: boolean;
}) {
  const pct = clamp(value / max) * 100;
  return (
    <div className="w-52 sm:w-60">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-xs tracking-[0.25em] text-emerald-100/90 sm:text-sm">
          <span className="mr-1">{icon}</span>
          {label}
        </span>
        <span className="font-ui text-[11px] tabular-nums text-emerald-200/60">
          {Math.ceil(value)}/{max}
        </span>
      </div>
      <div className="relative h-3.5 overflow-hidden rounded-full border border-white/10 bg-black/55 shadow-inner">
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${from}, ${to})`,
            boxShadow: `0 0 12px ${to}`,
            opacity: low ? 0.95 : 1,
          }}
        />
        {flash && (
          <div className="absolute inset-0 animate-pulse-glow rounded-full bg-cyan-200/30" />
        )}
      </div>
    </div>
  );
}

function Ability({
  glyph,
  name,
  hotkey,
  cd,
  cdMax,
  accent,
}: {
  glyph: string;
  name: string;
  hotkey: string;
  cd: number;
  cdMax: number;
  accent: string;
}) {
  const ready = cd <= 0.001;
  const frac = cdMax > 0 ? clamp(cd / cdMax) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative h-16 w-16 overflow-hidden rounded-xl border bg-black/45 backdrop-blur-sm"
        style={{
          borderColor: ready ? accent : "rgba(255,255,255,0.12)",
          boxShadow: ready ? `0 0 16px ${accent}66` : "none",
        }}
      >
        {/* relleno de enfriamiento */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/65 transition-[height] duration-100"
          style={{ height: `${frac * 100}%` }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl"
          style={{ filter: ready ? "none" : "grayscale(0.7) brightness(0.6)" }}
        >
          {glyph}
        </div>
        <span className="absolute right-1 top-0.5 font-ui text-[10px] font-bold tracking-wider text-white/80">
          {hotkey}
        </span>
        {ready && (
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{ boxShadow: `inset 0 0 14px ${accent}88` }}
          />
        )}
      </div>
      <span
        className="font-ui text-[10px] uppercase tracking-[0.15em]"
        style={{ color: ready ? "#d7ffe9" : "rgba(215,255,233,0.4)" }}
      >
        {name}
      </span>
    </div>
  );
}

function KeyChip({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-emerald-300/30 bg-black/40 px-2 py-0.5 font-ui text-xs font-semibold tracking-wide text-emerald-100 shadow">
      {children}
    </kbd>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new Game(containerRef.current, { onHud: setHud });
    gameRef.current = game;
    game.start();
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const phase = hud?.phase ?? "menu";

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-[#07050f] select-none"
    >
      {/* Viñeta cinematográfica */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Capa de interfaz */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {hud && phase === "playing" && (
          <>
            {/* Barras de vida */}
            <div className="absolute left-3 top-3 space-y-3 sm:left-5 sm:top-5">
              <HealthBar
                label="NIDO SAGRADO"
                icon="🪺"
                value={hud.nestHp}
                max={hud.nestMaxHp}
                from="#16a34a"
                to="#86efac"
                low={hud.nestHp / hud.nestMaxHp < 0.35}
              />
              <HealthBar
                label="MANTIS"
                icon="🦗"
                value={hud.mantisHp}
                max={hud.mantisMaxHp}
                from="#0e7490"
                to="#67e8f9"
                low={hud.mantisHp / hud.mantisMaxHp < 0.35}
                flash={hud.mantisInvuln}
              />
            </div>

            {/* Puntuación / oleada */}
            <div className="absolute left-1/2 top-3 -translate-x-1/2 text-center sm:top-4">
              <div className="font-ui text-[11px] tracking-[0.35em] text-emerald-300/70">
                PUNTUACIÓN
              </div>
              <div className="font-display text-3xl leading-none text-amber-200 text-shadow-glow sm:text-4xl">
                {hud.score.toLocaleString("es")}
              </div>
              <div className="mt-1 flex items-center justify-center gap-3 font-ui text-xs tracking-wider text-emerald-100/70">
                <span className="text-emerald-200">OLEADA {hud.wave}</span>
                <span className="text-white/30">•</span>
                <span>{hud.enemiesLeft} enemigos</span>
              </div>
            </div>

            {/* Botón silenciar */}
            <button
              onClick={() => gameRef.current?.toggleMute()}
              className="pointer-events-auto absolute right-3 top-3 rounded-lg border border-white/10 bg-black/45 px-3 py-2 font-ui text-sm text-emerald-100/80 backdrop-blur transition hover:bg-black/65 sm:right-5 sm:top-5"
            >
              {hud.muted ? "🔇" : "🔊"}
            </button>

            {/* Combo */}
            {hud.combo >= 2 && (
              <div className="absolute right-6 top-1/3 text-right">
                <div className="font-display text-3xl text-amber-300 text-shadow-glow animate-pulse-glow">
                  ×{hud.combo}
                </div>
                <div className="font-ui text-xs tracking-[0.3em] text-amber-200/70">
                  COMBO
                </div>
              </div>
            )}

            {/* Avisos de oleada */}
            {hud.banner && (
              <div className="animate-banner absolute left-1/2 top-[16%] -translate-x-1/2 text-center">
                <div className="font-display text-4xl text-emerald-200 text-shadow-glow sm:text-6xl">
                  {hud.banner}
                </div>
                {hud.bannerSub && (
                  <div className="mt-2 font-ui text-sm tracking-[0.3em] text-amber-300/90">
                    {hud.bannerSub}
                  </div>
                )}
              </div>
            )}

            {hud.waveBreak && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/30 bg-black/50 px-5 py-1.5 font-ui text-sm tracking-wider text-amber-200 backdrop-blur">
                Siguiente oleada en {hud.breakCountdown}…
              </div>
            )}

            {/* Habilidades */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 sm:gap-4">
              <Ability
                glyph="🗡️"
                name="Corte"
                hotkey="CLIC / J"
                cd={hud.slashCd}
                cdMax={hud.slashCdMax}
                accent="#8effc0"
              />
              <Ability
                glyph="🌀"
                name="Giro letal"
                hotkey="ESP / K"
                cd={hud.spinCd}
                cdMax={hud.spinCdMax}
                accent="#5ce0c8"
              />
              <Ability
                glyph="💨"
                name="Embestida"
                hotkey="SHIFT / L"
                cd={hud.dashCd}
                cdMax={hud.dashCdMax}
                accent="#9fe8ff"
              />
            </div>

            {/* Pista de controles */}
            <div className="absolute bottom-4 left-4 hidden max-w-[180px] font-ui text-[11px] leading-relaxed text-emerald-100/40 lg:block">
              <div>
                <KeyChip>WASD</KeyChip> moverse
              </div>
              <div className="mt-1">
                <KeyChip>Ratón</KeyChip> apuntar
              </div>
            </div>
          </>
        )}

        {/* MENÚ */}
        {hud && phase === "menu" && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/40 via-black/55 to-black/80 backdrop-blur-[2px]">
            <div className="mx-4 max-w-2xl text-center">
              <div className="animate-floaty">
                <div className="mb-2 font-ui text-sm tracking-[0.5em] text-emerald-300/70">
                  UN MUNDO FANTÁSTICO · CAMARA ISOMÉTRICA
                </div>
                <h1 className="font-display text-6xl font-black leading-none text-emerald-200 text-shadow-glow sm:text-8xl">
                  MANTIS
                </h1>
                <div className="mt-1 font-display text-xl tracking-[0.3em] text-amber-300 sm:text-2xl">
                  GUARDIÁN DEL NIDO
                </div>
              </div>

              <p className="mx-auto mt-6 max-w-xl font-ui text-base leading-relaxed text-emerald-100/75">
                Eres una mantis religiosa. Tu misión: proteger el nido sagrado
                de las incesantes oleadas de criaturas que avanzan en la
                penumbra. Usa tus garras raptoriales, giros letales y embestidas
                para abatirlos a todos.
              </p>

              <div className="mx-auto mt-7 grid max-w-lg grid-cols-2 gap-x-6 gap-y-2 text-left font-ui text-sm text-emerald-100/80">
                <div className="flex items-center gap-2">
                  <KeyChip>WASD</KeyChip>
                  <span>Moverse</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyChip>Ratón</KeyChip>
                  <span>Apuntar</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyChip>Clic / J</KeyChip>
                  <span>Corte de garras</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyChip>Espacio / K</KeyChip>
                  <span>Giro letal (Área)</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyChip>Shift / L</KeyChip>
                  <span>Embestida (esquiva)</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyChip>🪺</KeyChip>
                  <span>Defiende el nido</span>
                </div>
              </div>

              <button
                onClick={() => gameRef.current?.beginGame()}
                className="group mt-9 inline-flex items-center gap-3 rounded-xl border border-emerald-300/40 bg-gradient-to-b from-emerald-500/30 to-emerald-700/30 px-10 py-4 font-display text-2xl tracking-widest text-emerald-100 shadow-[0_0_30px_rgba(80,255,170,0.25)] transition hover:scale-105 hover:from-emerald-400/40 hover:to-emerald-600/40 hover:shadow-[0_0_45px_rgba(80,255,170,0.5)]"
              >
                ▶ JUGAR
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {hud && phase === "gameover" && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/60 via-black/70 to-black/90 backdrop-blur-sm">
            <div className="mx-4 max-w-md text-center">
              <div className="mb-1 font-ui text-sm tracking-[0.5em] text-red-300/70">
                {hud.mantisHp <= 0
                  ? "LA GUARDIANA HA CAÍDO"
                  : "EL NIDO HA SIDO DESTRUIDO"}
              </div>
              <h2 className="font-display text-6xl font-black text-red-300 text-shadow-glow sm:text-7xl">
                DERROTA
              </h2>

              <div className="mx-auto mt-7 grid grid-cols-2 gap-3">
                <Stat label="Oleada alcanzada" value={`${hud.wave}`} />
                <Stat label="Puntuación" value={hud.score.toLocaleString("es")} />
                <Stat label="Criaturas abatidas" value={`${hud.kills}`} />
                <Stat label="Combo máximo" value={`×${hud.maxCombo}`} />
              </div>

              <button
                onClick={() => gameRef.current?.beginGame()}
                className="mt-8 inline-flex items-center gap-3 rounded-xl border border-emerald-300/40 bg-gradient-to-b from-emerald-500/30 to-emerald-700/30 px-10 py-4 font-display text-2xl tracking-widest text-emerald-100 shadow-[0_0_30px_rgba(80,255,170,0.25)] transition hover:scale-105 hover:shadow-[0_0_45px_rgba(80,255,170,0.5)]"
              >
                ↻ REINTENTAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <div className="font-ui text-[11px] uppercase tracking-[0.2em] text-emerald-300/60">
        {label}
      </div>
      <div className="font-display text-2xl text-amber-200">{value}</div>
    </div>
  );
}

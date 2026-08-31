import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { CAPTIONS, DURATION_S, SHOTS, type Caption as CaptionData, type Shot } from "../lib/film";
import { Fireflies, Mist, Rays } from "./Atmosphere";

const N = SHOTS.length;
const FADE = 0.028; // crossfade window, in progress units

function ShotLayer({ i, shot, p }: { i: number; shot: Shot; p: MotionValue<number> }) {
  const s = i / N;
  const e = (i + 1) / N;

  const inP = i === 0 ? [s, s + 0.004] : [s, s + FADE];
  const outP = i === N - 1 ? [e - 0.004, e] : [e - FADE, e];
  const opacity = useTransform(p, [inP[0], inP[1], outP[0], outP[1]], [0, 1, 1, 0]);

  const x = useTransform(p, [s, e], [shot.pan.from, shot.pan.to]);
  const y = useTransform(p, [s, e], [shot.lift.from, shot.lift.to]);
  const scale = useTransform(p, [s, e], [shot.zoom.from, shot.zoom.to]);

  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <motion.div
        className="absolute inset-[-4%] bg-cover bg-center will-change-transform"
        style={{ x, y, scale, backgroundImage: `url(${shot.img})` }}
      />
      {/* per-shot grade + lettersoft edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-night/55" />
      <div className="absolute inset-0 bg-[radial-gradient(115%_95%_at_50%_50%,transparent_58%,rgba(4,6,5,0.62)_100%)]" />
    </motion.div>
  );
}

function Caption({ c, p }: { c: CaptionData; p: MotionValue<number> }) {
  const [a, b] = c.at;
  const d = 0.012;
  const opacity = useTransform(p, [a, a + d, b - d, b], [0, 1, 1, 0]);
  const y = useTransform(p, [a, b], [16, -16]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-x-0 bottom-[calc(var(--letterbox)+7vh)] z-20 flex flex-col items-center gap-3 px-6 text-center"
    >
      {c.kicker && (
        <span className="font-mono text-[9px] tracking-[0.45em] text-ember sm:text-[10px]">{c.kicker}</span>
      )}
      <p
        className="max-w-3xl font-display text-xl font-light italic leading-snug text-bone sm:text-3xl"
        style={{ textShadow: "0 2px 30px rgba(3,5,4,0.9), 0 0 6px rgba(3,5,4,0.8)" }}
      >
        {c.text}
      </p>
    </motion.div>
  );
}

function Hud({ p }: { p: MotionValue<number> }) {
  const vis = useTransform(p, [0, 0.006, 0.985, 1], [0, 1, 1, 0]);
  const tc = useTransform(p, (v) => {
    const frames = Math.floor(Math.min(0.9999, Math.max(0, v)) * DURATION_S * 24);
    const mm = String(Math.floor(frames / (24 * 60))).padStart(2, "0");
    const ss = String(Math.floor(frames / 24) % 60).padStart(2, "0");
    const ff = String(frames % 24).padStart(2, "0");
    return `${mm}:${ss}:${ff}`;
  });
  const shotTag = useTransform(p, (v) => {
    const i = Math.min(N - 1, Math.floor(Math.min(0.9999, Math.max(0, v)) * N));
    const sh = SHOTS[i];
    return `SHOT ${sh.n}/05 — ${sh.label}`;
  });
  const shotMeta = useTransform(p, (v) => {
    const i = Math.min(N - 1, Math.floor(Math.min(0.9999, Math.max(0, v)) * N));
    const sh = SHOTS[i];
    return `${sh.subtitle} · ${sh.dolly} · ${sh.lens}`;
  });

  return (
    <motion.div style={{ opacity: vis }} className="pointer-events-none absolute inset-0 z-30">
      {/* top row, just under letterbox */}
      <div className="absolute left-4 right-4 top-[calc(var(--letterbox)+16px)] flex items-start justify-between sm:left-8 sm:right-8">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-ember">
            <span className="animate-blink inline-block h-1.5 w-1.5 rounded-full bg-ember" />
            REC
          </span>
          <motion.span className="font-mono text-[9px] tracking-[0.3em] text-bone/80 sm:text-[10px]">
            {shotTag}
          </motion.span>
          <motion.span className="hidden font-mono text-[8px] tracking-[0.3em] text-smoke sm:block">
            {shotMeta}
          </motion.span>
        </div>
        <motion.span className="font-mono text-[10px] tabular-nums tracking-[0.3em] text-bone/85 sm:text-xs">
          {tc}
        </motion.span>
      </div>

      {/* progress rail, just above letterbox */}
      <div className="absolute inset-x-4 bottom-[calc(var(--letterbox)+16px)] sm:inset-x-8">
        <div className="relative h-[3px] bg-bone/12">
          <motion.div className="absolute inset-y-0 left-0 right-0 origin-left bg-ember" style={{ scaleX: p }} />
          {SHOTS.slice(1).map((_, i) => (
            <span
              key={i}
              className="absolute -top-[3px] h-[9px] w-px bg-bone/40"
              style={{ left: `${((i + 1) / N) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[8px] tracking-[0.3em] text-smoke">
          <span>REEL 01</span>
          <span>DUSK → NIGHTFALL</span>
        </div>
      </div>
    </motion.div>
  );
}

function Fin({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.928, 0.958], [0, 1]);
  const scale = useTransform(p, [0.928, 1], [0.92, 1]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-night/55 backdrop-blur-[2px]"
    >
      <motion.span
        style={{ scale }}
        className="font-display text-[26vw] font-light italic leading-none text-bone sm:text-[13vw]"
      >
        fin
      </motion.span>
      <span className="mt-4 font-mono text-[9px] tracking-[0.5em] text-smoke">
        A FILM BY THE FOREST
      </span>
    </motion.div>
  );
}

export function Film() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const cam = useSpring(scrollYProgress, { stiffness: 58, damping: 17, mass: 0.55 });

  return (
    <section ref={ref} className="relative h-[640vh] bg-night" data-cursor>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* the five shots */}
        {SHOTS.map((s, i) => (
          <ShotLayer key={s.n} i={i} shot={s} p={cam} />
        ))}

        {/* atmosphere above the frame */}
        <Mist className="z-10" />
        <Rays className="z-10 opacity-80" />
        <Fireflies count={24} seed={9} className="z-10" />

        {/* subtitles + HUD + fin */}
        {CAPTIONS.map((c, i) => (
          <Caption key={i} c={c} p={scrollYProgress} />
        ))}
        <Hud p={scrollYProgress} />
        <Fin p={scrollYProgress} />
      </div>
    </section>
  );
}

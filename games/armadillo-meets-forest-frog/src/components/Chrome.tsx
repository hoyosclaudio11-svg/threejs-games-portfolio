import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/** Permanent 2.39:1 letterbox bars with reel metadata */
export function Letterbox() {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[95] flex h-[var(--letterbox)] items-center justify-between bg-night px-4 sm:px-8">
        <span className="font-mono text-[9px] tracking-[0.28em] text-smoke sm:text-[10px]">
          SELVA PICTURE CO.
        </span>
        <span className="hidden font-mono text-[9px] tracking-[0.42em] text-bone/70 sm:block">
          TATÚ&nbsp;&nbsp;CARRETA
        </span>
        <span className="font-mono text-[9px] tracking-[0.28em] text-smoke sm:text-[10px]">
          24 FPS · 2.39:1 · 8K
        </span>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-[95] flex h-[var(--letterbox)] items-center justify-between bg-night px-4 sm:px-8">
        <span className="font-mono text-[9px] tracking-[0.28em] text-smoke sm:text-[10px]">
          SUBTROPICAL FOREST · DUSK
        </span>
        <span className="font-mono text-[9px] tracking-[0.28em] text-smoke sm:text-[10px]">
          RENDERED IN THE BROWSER
        </span>
      </div>
    </>
  );
}

/** Cinematic cursor — ember dot with a lagging scope reticle */
export function Cursor() {
  const [fine, setFine] = useState(false);
  const [hover, setHover] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 260, damping: 24, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 24, mass: 0.6 });
  const ringScale = useSpring(1, { stiffness: 300, damping: 22 });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;
    setFine(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const hit = !!t.closest("a,button,[data-cursor]");
      setHover(hit);
      ringScale.set(hit ? 1.9 : 1);
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y, ringScale]);

  if (!fine) return null;
  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[120] h-1.5 w-1.5 rounded-full bg-ember"
        style={{ x, y, marginLeft: -3, marginTop: -3 }}
      />
      <motion.div
        style={{ x: sx, y: sy, scale: ringScale, marginLeft: -18, marginTop: -18 }}
        className={`pointer-events-none fixed left-0 top-0 z-[119] flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
          hover ? "border-ember/80" : "border-bone/35"
        }`}
      >
        <span className={`h-px w-2 bg-current transition-colors ${hover ? "text-ember" : "text-bone/40"}`} />
      </motion.div>
    </>
  );
}

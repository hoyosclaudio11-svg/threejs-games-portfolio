import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function Preloader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(100, v + 3 + Math.random() * 9);
      setN(Math.floor(v));
      if (v >= 100 && !done.current) {
        done.current = true;
        clearInterval(id);
        setTimeout(onDone, 480);
      }
    }, 95);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-night"
      exit={{ y: "-100%" }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <p className="mb-6 font-mono text-[10px] tracking-[0.5em] text-smoke">
        SELVA PICTURE CO. PRESENTS
      </p>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[18vw] font-light leading-none tabular-nums text-bone sm:text-[9rem]">
          {n}
        </span>
        <span className="font-mono text-sm tracking-[0.3em] text-ember">%</span>
      </div>
      <div className="mt-8 h-px w-56 overflow-hidden bg-bone/10">
        <motion.div
          className="h-full bg-ember"
          animate={{ width: `${n}%` }}
          transition={{ ease: "easeOut", duration: 0.25 }}
        />
      </div>
      <p className="mt-6 font-mono text-[9px] tracking-[0.4em] text-bone/35">
        THREADING REEL · THREADING REEL ·
      </p>
    </motion.div>
  );
}

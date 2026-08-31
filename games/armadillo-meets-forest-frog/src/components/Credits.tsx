import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { END_CREDITS } from "../lib/film";
import { Fireflies } from "./Atmosphere";

export function Credits() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "0%"]);
  const glow = useTransform(scrollYProgress, [0.4, 1], [0.2, 0.5]);

  const rewind = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <section ref={ref} className="relative overflow-hidden bg-night">
      {/* dusk plate */}
      <motion.div
        className="absolute inset-[-10%] bg-cover bg-center"
        style={{ backgroundImage: "url(/images/shot-05-dusk.jpg)", y }}
      />
      <motion.div className="absolute inset-0 bg-night" style={{ opacity: glow }} />
      <div className="absolute inset-0 bg-gradient-to-b from-night via-night/30 to-night/85" />
      <Fireflies count={30} seed={17} />

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-[calc(var(--letterbox)+64px)] text-center">
        <p className="font-mono text-[10px] tracking-[0.5em] text-ember">THE FOREST ROLLS CREDITS</p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-4xl font-display text-4xl font-light leading-tight text-bone sm:text-6xl"
        >
          Somewhere past the last
          <em className="text-ember"> god-ray</em>,<br className="hidden sm:block" /> they are
          still listening.
        </motion.p>

        {/* credit roll */}
        <div className="mt-16 w-full max-w-2xl">
          {END_CREDITS.map((c, i) => (
            <motion.div
              key={c.k}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 gap-6 border-t border-bone/12 py-3.5 text-left font-mono text-[10px] tracking-[0.22em]"
            >
              <span className="text-right text-smoke">{c.k}</span>
              <span className="text-bone/90">{c.v}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={rewind}
          data-cursor
          className="group mt-16 flex items-center gap-3 border border-bone/25 px-7 py-3.5 font-mono text-[10px] tracking-[0.4em] text-bone/85 transition-colors duration-500 hover:border-ember hover:text-ember"
        >
          <ArrowUp className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5" strokeWidth={1.5} />
          REWIND THE REEL
        </button>
      </div>

      {/* footer strip */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-bone/10 bg-night/70 px-4 py-6 backdrop-blur-sm sm:px-8">
        <span className="font-mono text-[8px] tracking-[0.3em] text-smoke">
          © MMXXVI SELVA PICTURE CO.
        </span>
        <span className="font-mono text-[8px] tracking-[0.3em] text-smoke">
          A LOVE LETTER TO THE SMALL AND THE ENORMOUS
        </span>
        <span className="font-mono text-[8px] tracking-[0.3em] text-smoke">
          NO ARMADILLOS WERE ENLARGED
        </span>
      </footer>
    </section>
  );
}

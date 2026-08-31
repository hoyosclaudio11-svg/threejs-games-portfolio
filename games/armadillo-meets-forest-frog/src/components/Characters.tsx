import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CHARACTERS, type Character } from "../lib/film";

function ParallaxBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <div ref={ref} className="relative my-24 h-[68svh] overflow-hidden border-y border-bone/10 sm:my-32">
      <motion.div
        className="absolute inset-[-16%] bg-cover bg-center"
        style={{ backgroundImage: "url(/images/shot-06-scutes.jpg)", y }}
      />
      <div className="absolute inset-0 bg-night/35" />
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_50%,transparent_40%,rgba(6,9,7,0.75)_100%)]" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[9px] tracking-[0.5em] text-ember">FIELD NOTE IV · DETAIL PLATE</p>
        <p className="mt-6 max-w-3xl font-display text-3xl font-light italic leading-snug text-bone sm:text-5xl">
          “He did not stomp.
          <br />
          He arrived.”
        </p>
      </div>
    </div>
  );
}

function CharacterBlock({ c, flip }: { c: Character; flip: boolean }) {
  return (
    <div className="mx-auto grid max-w-[1500px] items-center gap-10 px-4 sm:px-8 md:grid-cols-12 md:gap-14">
      {/* plate */}
      <motion.div
        initial={{ opacity: 0, y: 42 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`group relative md:col-span-7 ${flip ? "md:order-2" : ""}`}
        data-cursor
      >
        <div className="relative aspect-[4/3] overflow-hidden border border-bone/10">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            style={{ backgroundImage: `url(${c.img})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/55 via-transparent to-night/20" />
          <span className="absolute bottom-3 left-3 font-mono text-[9px] tracking-[0.34em] text-bone/80">
            PLATE {c.n} — {c.latin.toUpperCase()}
          </span>
        </div>
      </motion.div>

      {/* dossier */}
      <motion.div
        initial={{ opacity: 0, y: 42 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className={`md:col-span-5 ${flip ? "md:order-1" : ""}`}
      >
        <p className="font-mono text-[10px] tracking-[0.5em] text-ember">CHARACTER FOLIO {c.n}</p>
        <h3 className="mt-4 font-display text-5xl font-light leading-none text-bone sm:text-6xl">
          {c.name}
        </h3>
        <p className="mt-2 font-display text-lg italic text-bone/65">{c.title}</p>
        <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-bone/70">{c.role}</p>

        <dl className="mt-8 max-w-md">
          {c.stats.map((s) => (
            <div
              key={s.k}
              className="flex items-baseline justify-between gap-6 border-t border-bone/10 py-2.5 font-mono text-[10px] tracking-[0.2em]"
            >
              <dt className="text-smoke">{s.k}</dt>
              <dd className="text-right text-bone/85">{s.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 font-mono text-[9px] italic tracking-[0.2em] text-moss">※ {c.note}</p>
      </motion.div>
    </div>
  );
}

export function Characters() {
  return (
    <section className="bg-night pb-24 pt-20 sm:pt-28">
      <div className="mx-auto mb-16 max-w-[1500px] px-4 sm:mb-24 sm:px-8">
        <p className="font-mono text-[10px] tracking-[0.5em] text-ember">03 — CAST OF TWO</p>
        <h2 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[0.95] text-bone sm:text-7xl">
          One small.
          <br />
          One <em className="text-ember">impossible.</em>
        </h2>
      </div>

      <CharacterBlock c={CHARACTERS[0]} flip={false} />
      <ParallaxBand />
      <CharacterBlock c={CHARACTERS[1]} flip={true} />
    </section>
  );
}

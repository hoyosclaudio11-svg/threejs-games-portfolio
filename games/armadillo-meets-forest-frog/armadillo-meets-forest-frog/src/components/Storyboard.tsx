import { motion } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import { SHOTS, SPECS } from "../lib/film";

export function Storyboard() {
  return (
    <section className="bg-night pb-24 pt-20 sm:pb-32 sm:pt-28">
      {/* header */}
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-6 px-4 sm:px-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.5em] text-ember">02 — STORYBOARD & CONTINUITY</p>
          <h2 className="mt-4 font-display text-5xl font-light leading-[0.95] text-bone sm:text-7xl">
            The shot list,
            <br />
            <em className="text-bone/70">fully rendered.</em>
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.35em] text-smoke">
          <MoveHorizontal className="h-4 w-4 text-ember" strokeWidth={1.5} />
          DRAG / SCROLL LATERALLY
        </div>
      </div>

      {/* lateral strip */}
      <div
        className="scrollbar-hide mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 sm:px-8"
        data-cursor
      >
        {SHOTS.map((s, i) => (
          <motion.figure
            key={s.n}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: Math.min(i * 0.05, 0.2), ease: [0.16, 1, 0.3, 1] }}
            className="group w-[82vw] shrink-0 snap-center sm:w-[52vw] lg:w-[36vw]"
          >
            <div className="relative aspect-[21/10] overflow-hidden border border-bone/10">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                style={{ backgroundImage: `url(${s.img})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-night/30" />
              <span className="absolute left-3 top-3 font-mono text-[9px] tracking-[0.3em] text-bone/80">
                FRAME {s.n}
              </span>
              <span className="absolute right-3 top-3 font-mono text-[9px] tracking-[0.3em] text-ember">
                {s.lens}
              </span>
              <span className="absolute bottom-3 right-3 font-display text-6xl font-light italic leading-none text-bone/25">
                {s.n}
              </span>
            </div>
            <figcaption className="mt-4 flex items-start justify-between gap-4 border-t border-bone/10 pt-3">
              <div>
                <p className="font-display text-lg font-light text-bone">
                  {s.label}
                  <span className="ml-2 text-sm italic text-smoke">{s.subtitle}</span>
                </p>
                <p className="mt-1 font-mono text-[9px] tracking-[0.3em] text-smoke">{s.dolly}</p>
              </div>
              <span className="mt-1 font-mono text-[9px] tracking-[0.3em] text-bone/50">24 FPS</span>
            </figcaption>
          </motion.figure>
        ))}

        {/* end card */}
        <div className="flex w-[60vw] shrink-0 snap-center items-center justify-center border border-dashed border-bone/15 sm:w-[30vw]">
          <p className="px-8 text-center font-mono text-[9px] leading-loose tracking-[0.35em] text-smoke">
            FRAMES 06 — 12
            <br />
            LOST TO THE MIST
          </p>
        </div>
      </div>

      {/* spec sheet */}
      <div className="mx-auto mt-24 grid max-w-[1500px] grid-cols-2 gap-px overflow-hidden border border-bone/10 bg-bone/10 md:grid-cols-4 sm:mx-8 xl:mx-auto">
        {SPECS.map((s) => (
          <div key={s.k} className="bg-night p-6 sm:p-8">
            <p className="font-mono text-[9px] tracking-[0.4em] text-ember">{s.k}</p>
            <p className="mt-3 font-display text-base font-light text-bone sm:text-lg">{s.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

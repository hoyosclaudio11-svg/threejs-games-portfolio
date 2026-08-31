import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Fireflies, Mist, Rays } from "./Atmosphere";

const reveal: Variants = {
  off: { y: "110%" },
  on: (i: number) => ({
    y: "0%",
    transition: { duration: 1.15, ease: [0.16, 1, 0.3, 1], delay: 0.12 + i * 0.1 },
  }),
};

export function Hero({ started }: { started: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const sImg = useTransform(scrollYProgress, [0, 1], [1.08, 1.22]);
  const fadeUI = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const yTitle = useTransform(scrollYProgress, [0, 1], ["0%", "-34%"]);

  const anim = started ? "on" : "off";

  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden bg-night">
      {/* Establishing still, drifting open */}
      <motion.div
        className="absolute inset-[-8%] bg-cover bg-center"
        style={{
          backgroundImage: "url(/images/shot-01-clearing.jpg)",
          y: yImg,
          scale: sImg,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night/60 via-night/10 to-night/85" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_42%,transparent_45%,rgba(6,9,7,0.5)_100%)]" />
      <Rays />
      <Mist />
      <Fireflies count={16} seed={3} />

      {/* Title */}
      <motion.div
        style={{ opacity: fadeUI, y: yTitle }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6"
      >
        <div className="overflow-hidden">
          <motion.p
            variants={reveal}
            custom={0}
            initial="off"
            animate={anim}
            className="mb-6 text-center font-mono text-[9px] tracking-[0.5em] text-ember sm:text-[10px]"
          >
            A FOREST FABLE IN FIVE SHOTS
          </motion.p>
        </div>

        <h1 className="text-center leading-[0.82]">
          <span className="block overflow-hidden">
            <motion.span
              variants={reveal}
              custom={1}
              initial="off"
              animate={anim}
              className="block font-display text-[clamp(4.8rem,21vw,16rem)] font-light tracking-[-0.03em] text-bone"
            >
              TATÚ
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              variants={reveal}
              custom={2}
              initial="off"
              animate={anim}
              className="stroke-bone block font-display text-[clamp(3.2rem,14.5vw,11rem)] font-light italic tracking-[0.06em]"
            >
              carreta
            </motion.span>
          </span>
        </h1>

        <div className="overflow-hidden">
          <motion.div variants={reveal} custom={3} initial="off" animate={anim} className="mt-8 flex items-center gap-5">
            <span className="h-px w-10 bg-ember/70 sm:w-16" />
            <p className="font-display text-sm italic text-bone/75 sm:text-base">
              the wagon that walks — el vagón que camina
            </p>
            <span className="h-px w-10 bg-ember/70 sm:w-16" />
          </motion.div>
        </div>
      </motion.div>

      {/* Corner metadata */}
      <motion.div style={{ opacity: fadeUI }} className="absolute inset-x-0 bottom-[calc(var(--letterbox)+22px)] z-10">
        <div className="flex items-end justify-between px-4 sm:px-8">
          <p className="hidden font-mono text-[9px] leading-relaxed tracking-[0.24em] text-smoke sm:block">
            25°41′S — 54°26′W
            <br />
            IGUAZÚ BASIN
          </p>
          <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.4em] text-bone/70">SCROLL TO PLAY</span>
            <span className="h-9 w-px overflow-hidden bg-bone/15">
              <span className="animate-cue block h-full w-full bg-ember" />
            </span>
            <span className="font-mono text-[9px] tracking-[0.3em] text-smoke">01:40 · 5 SHOTS</span>
          </div>
          <p className="hidden text-right font-mono text-[9px] leading-relaxed tracking-[0.24em] text-smoke sm:block">
            DUSK · 5,600K
            <br />
            MIST · DOUBLE SCATTER
          </p>
        </div>
      </motion.div>
    </section>
  );
}

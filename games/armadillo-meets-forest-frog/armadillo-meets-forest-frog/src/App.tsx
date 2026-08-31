import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Preloader } from "./components/Preloader";
import { Cursor, Letterbox } from "./components/Chrome";
import { Hero } from "./components/Hero";
import { Film } from "./components/Film";
import { Marquee } from "./components/Marquee";
import { Storyboard } from "./components/Storyboard";
import { Characters } from "./components/Characters";
import { Credits } from "./components/Credits";

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = booted ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [booted]);

  return (
    <div className="grain vignette bg-night">
      <AnimatePresence>{!booted && <Preloader onDone={() => setBooted(true)} />}</AnimatePresence>

      <Cursor />
      <Letterbox />

      <main>
        <Hero started={booted} />
        <Film />
        <Marquee />
        <Storyboard />
        <Characters />
        <Credits />
      </main>
    </div>
  );
}

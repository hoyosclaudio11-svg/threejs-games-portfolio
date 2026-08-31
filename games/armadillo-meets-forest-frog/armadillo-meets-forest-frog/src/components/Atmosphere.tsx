/** Volumetric atmosphere: drifting mist, dusk god-rays, fireflies */

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function Mist({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="animate-mist-a absolute -inset-[20%] mix-blend-screen"
        style={{
          background:
            "radial-gradient(45% 32% at 28% 78%, rgba(230,163,77,0.14), transparent 70%), radial-gradient(40% 30% at 74% 30%, rgba(154,178,120,0.10), transparent 70%)",
          filter: "blur(38px)",
        }}
      />
      <div
        className="animate-mist-b absolute -inset-[20%] mix-blend-screen"
        style={{
          background:
            "radial-gradient(50% 30% at 68% 82%, rgba(241,233,216,0.10), transparent 70%), radial-gradient(38% 28% at 18% 26%, rgba(230,163,77,0.08), transparent 70%)",
          filter: "blur(52px)",
        }}
      />
    </div>
  );
}

export function Rays({ className = "" }: { className?: string }) {
  const beams = [
    { left: "12%", width: "9rem", delay: "0s", dur: "9s" },
    { left: "34%", width: "14rem", delay: "-3s", dur: "12s" },
    { left: "60%", width: "7rem", delay: "-6s", dur: "8s" },
    { left: "78%", width: "12rem", delay: "-1.5s", dur: "11s" },
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen ${className}`}>
      {beams.map((b, i) => (
        <div
          key={i}
          className="animate-ray absolute -top-[30%] h-[160%] origin-top"
          style={{
            left: b.left,
            width: b.width,
            animationDelay: b.delay,
            animationDuration: b.dur,
            transform: "rotate(16deg) skewX(-8deg)",
            background:
              "linear-gradient(to bottom, rgba(255,205,130,0.32), rgba(255,205,130,0.06) 55%, transparent 85%)",
            filter: "blur(14px)",
          }}
        />
      ))}
    </div>
  );
}

export function Fireflies({ count = 20, seed = 1, className = "" }: { count?: number; seed?: number; className?: string }) {
  const flies = Array.from({ length: count }, (_, i) => {
    const r = (k: number) => rand(seed * 100 + i * 7 + k);
    return {
      left: `${6 + r(1) * 88}%`,
      top: `${18 + r(2) * 72}%`,
      size: 2 + r(3) * 3.2,
      dur: `${5 + r(4) * 7}s`,
      delay: `-${r(5) * 9}s`,
      dx: `${(r(6) - 0.5) * 140}px`,
      dy: `${-20 - r(7) * 90}px`,
    };
  });
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {flies.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              left: f.left,
              top: f.top,
              width: f.size,
              height: f.size,
              "--dur": f.dur,
              "--delay": f.delay,
              "--dx": f.dx,
              "--dy": f.dy,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

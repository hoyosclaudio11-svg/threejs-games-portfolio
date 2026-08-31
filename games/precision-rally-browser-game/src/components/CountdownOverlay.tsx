import React from 'react';

interface CountdownOverlayProps {
  countdownValue: number; // 3, 2, 1, 0 (GO)
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdownValue }) => {
  if (countdownValue < 0) return null;

  const text = countdownValue === 0 ? '¡GO!' : countdownValue.toString();
  const colorClass =
    countdownValue === 0
      ? 'text-emerald-400 border-emerald-400 bg-emerald-950/70 shadow-emerald-500/50 scale-125'
      : countdownValue === 1
      ? 'text-amber-400 border-amber-400 bg-amber-950/70 shadow-amber-500/50 scale-110'
      : 'text-red-400 border-red-400 bg-red-950/70 shadow-red-500/50 scale-100';

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center animate-fade-in">
      <div
        className={`w-36 h-36 md:w-44 md:h-44 rounded-3xl border-4 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-200 shadow-2xl ${colorClass}`}
      >
        <span className="font-chakra font-black text-6xl md:text-7xl tracking-tighter drop-shadow-2xl">
          {text}
        </span>
        <span className="text-xs font-mono-data font-bold uppercase tracking-widest text-slate-200 mt-1">
          {countdownValue === 0 ? 'FULL THROTTLE' : 'STAGE START'}
        </span>
      </div>
    </div>
  );
};

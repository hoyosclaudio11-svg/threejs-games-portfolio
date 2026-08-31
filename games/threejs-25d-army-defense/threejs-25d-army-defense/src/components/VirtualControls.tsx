import React, { useRef, useState, useEffect } from 'react';

interface VirtualControlsProps {
  onMove: (vector: { x: number; z: number }) => void;
  onAttack: () => void;
  onDash: () => void;
  lang: 'es' | 'en';
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onMove,
  onAttack,
  onDash,
  lang
}) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const isEs = lang === 'es';

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    updateKnob(e);
  };

  const updateKnob = (e: any) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.min(45, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const kx = Math.cos(angle) * distance;
    const ky = Math.sin(angle) * distance;

    setKnobPos({ x: kx, y: ky });
    onMove({ x: kx / 45, z: ky / 45 });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, z: 0 });
    touchIdRef.current = null;
  };

  useEffect(() => {
    const onMoveGlobal = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        updateKnob(e);
      }
    };
    const onEndGlobal = () => {
      if (isDragging) {
        handleTouchEnd();
      }
    };

    window.addEventListener('mousemove', onMoveGlobal);
    window.addEventListener('mouseup', onEndGlobal);
    window.addEventListener('touchmove', onMoveGlobal);
    window.addEventListener('touchend', onEndGlobal);

    return () => {
      window.removeEventListener('mousemove', onMoveGlobal);
      window.removeEventListener('mouseup', onEndGlobal);
      window.removeEventListener('touchmove', onMoveGlobal);
      window.removeEventListener('touchend', onEndGlobal);
    };
  }, [isDragging]);

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20 md:hidden">
      {/* Virtual Analog Joystick (Bottom Left) */}
      <div 
        ref={joystickRef}
        onMouseDown={handleTouchStart}
        onTouchStart={handleTouchStart}
        className="w-32 h-32 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-slate-700/80 flex items-center justify-center pointer-events-auto touch-none relative shadow-2xl"
      >
        <div 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 shadow-xl flex items-center justify-center transform transition-transform duration-75"
          style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
        >
          <div className="w-4 h-4 rounded-full bg-slate-950/40" />
        </div>
      </div>

      {/* Action Touch Buttons (Bottom Right) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onDash}
          className="w-14 h-14 rounded-2xl bg-blue-600 active:bg-blue-500 text-white font-black text-xs shadow-xl border border-blue-400 flex flex-col items-center justify-center active:scale-90 transition"
        >
          <span>DASH</span>
        </button>

        <button
          onClick={onAttack}
          className="w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 active:from-amber-300 active:to-amber-500 text-slate-950 font-black text-sm shadow-2xl border-2 border-amber-300 flex flex-col items-center justify-center active:scale-90 transition"
        >
          <span>{isEs ? 'ATACAR' : 'ATTACK'}</span>
        </button>
      </div>
    </div>
  );
};

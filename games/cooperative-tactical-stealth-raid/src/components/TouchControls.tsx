import React, { useRef, useEffect, useState } from 'react';
import { Crosshair, RefreshCw, Zap, ShieldAlert, Footprints } from 'lucide-react';
import { TacticalEngine, GameInputs } from '../game/engine';

interface TouchControlsProps {
  engine: TacticalEngine;
  inputsRef: React.MutableRefObject<GameInputs>;
  isMobile: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine, inputsRef, isMobile }) => {
  const leftStickRef = useRef<HTMLDivElement | null>(null);
  const leftKnobRef = useRef<HTMLDivElement | null>(null);
  const [leftTouchId, setLeftTouchId] = useState<number | null>(null);
  const [isNearInteractable, setIsNearInteractable] = useState(false);

  // Check proximity to terminals, loot, or downed teammate every few frames
  useEffect(() => {
    const interval = setInterval(() => {
      const p1 = engine.p1;
      const nearTerm = engine.terminals.some(
        t => !t.isCompleted && Math.hypot(t.x - p1.x, t.y - p1.y) < t.radius + 20
      );
      const nearRevive = engine.p2.isDowned && Math.hypot(engine.p2.x - p1.x, engine.p2.y - p1.y) < 60;
      setIsNearInteractable(nearTerm || nearRevive);
    }, 150);
    return () => clearInterval(interval);
  }, [engine]);

  // Touch handlers for Movement Joystick
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    if (leftTouchId !== null) return;
    const touch = e.changedTouches[0];
    setLeftTouchId(touch.identifier);
    updateLeftStick(touch.clientX, touch.clientY);
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === leftTouchId) {
        updateLeftStick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === leftTouchId) {
        setLeftTouchId(null);
        resetLeftStick();
        break;
      }
    }
  };

  const updateLeftStick = (clientX: number, clientY: number) => {
    const stick = leftStickRef.current;
    const knob = leftKnobRef.current;
    if (!stick || !knob) return;

    const rect = stick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 10;

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    const deadzone = 12;
    inputsRef.current.p1.left = dx < -deadzone;
    inputsRef.current.p1.right = dx > deadzone;
    inputsRef.current.p1.up = dy < -deadzone;
    inputsRef.current.p1.down = dy > deadzone;
  };

  const resetLeftStick = () => {
    if (leftKnobRef.current) {
      leftKnobRef.current.style.transform = 'translate(0px, 0px)';
    }
    inputsRef.current.p1.left = false;
    inputsRef.current.p1.right = false;
    inputsRef.current.p1.up = false;
    inputsRef.current.p1.down = false;
  };

  if (!isMobile) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none touch-none">
      {/* --- Left Joystick (Movement) --- */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={leftStickRef}
          onTouchStart={handleLeftTouchStart}
          onTouchMove={handleLeftTouchMove}
          onTouchEnd={handleLeftTouchEnd}
          onTouchCancel={handleLeftTouchEnd}
          className="w-32 h-32 rounded-full bg-slate-950/60 border-2 border-cyan-500/40 backdrop-blur-sm relative flex items-center justify-center shadow-2xl active:border-cyan-400"
        >
          <div
            ref={leftKnobRef}
            className="w-14 h-14 rounded-full bg-cyan-500/80 border border-cyan-300 shadow-lg pointer-events-none transition-transform duration-75 flex items-center justify-center"
          >
            <Footprints className="w-6 h-6 text-slate-950 opacity-80" />
          </div>
        </div>
      </div>

      {/* --- Right Tactical Action Buttons (Shoot, Reload, Gadget, Interact) --- */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-3">
        {/* Interact / Sync Hack Button (Pulsing when nearby terminal/partner) */}
        <button
          onTouchStart={e => {
            e.preventDefault();
            inputsRef.current.p1.interact = true;
            // Also trigger terminal interaction if near
            const p1 = engine.p1;
            const term = engine.terminals.find(
              t => !t.isCompleted && Math.hypot(t.x - p1.x, t.y - p1.y) < t.radius + 20
            );
            if (term) engine.interactTerminal(p1, term);
          }}
          onTouchEnd={e => {
            e.preventDefault();
            inputsRef.current.p1.interact = false;
          }}
          className={`px-5 py-3 rounded-xl border flex items-center gap-2 shadow-2xl font-bold tracking-wider transition-all duration-150 active:scale-95 ${
            isNearInteractable
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/50 animate-pulse scale-105'
              : 'bg-slate-900/80 text-cyan-300 border-cyan-500/40'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs">
            {engine.p2.isDowned ? 'REANIMAR' : isNearInteractable ? 'SYNC HACK' : 'INTERACT'}
          </span>
        </button>

        {/* Action Row: Gadget, Reload, Shoot */}
        <div className="flex items-center gap-2.5">
          {/* Gadget Button */}
          <button
            onTouchStart={e => {
              e.preventDefault();
              inputsRef.current.p1.gadget = true;
            }}
            className="w-14 h-14 rounded-full bg-amber-950/80 border border-amber-500/60 flex flex-col items-center justify-center text-amber-300 shadow-lg active:scale-90 active:bg-amber-800"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-0.5">{engine.p1.gadgetCount}</span>
          </button>

          {/* Reload Button */}
          <button
            onTouchStart={e => {
              e.preventDefault();
              inputsRef.current.p1.reload = true;
            }}
            onTouchEnd={e => {
              e.preventDefault();
              inputsRef.current.p1.reload = false;
            }}
            className="w-14 h-14 rounded-full bg-slate-900/80 border border-slate-600 flex flex-col items-center justify-center text-slate-200 shadow-lg active:scale-90 active:bg-slate-700"
          >
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <span className="text-[9px] font-bold mt-0.5">RECARGA</span>
          </button>

          {/* Primary Shoot Button */}
          <button
            onTouchStart={e => {
              e.preventDefault();
              inputsRef.current.p1.shoot = true;
            }}
            onTouchEnd={e => {
              e.preventDefault();
              inputsRef.current.p1.shoot = false;
            }}
            className="w-20 h-20 rounded-full bg-emerald-600 border-2 border-emerald-300 flex flex-col items-center justify-center text-white shadow-2xl active:scale-90 active:bg-emerald-500 shadow-emerald-950/60"
          >
            <Crosshair className="w-8 h-8 text-white" />
            <span className="text-[10px] font-black tracking-widest mt-0.5">FUEGO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Flame, Disc3 } from 'lucide-react';
import { audio } from '../game/audio';

interface TouchControlsProps {
  onSteer: (steer: number) => void;
  onThrottle: (throttle: number) => void;
  onBrake: (brake: number) => void;
  onHandbrake: (handbrake: boolean) => void;
  mode?: 'buttons' | 'wheel' | 'joystick';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onSteer,
  onThrottle,
  onBrake,
  onHandbrake,
}) => {
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [throttleActive, setThrottleActive] = useState(false);
  const [brakeActive, setBrakeActive] = useState(false);
  const [handbrakeActive, setHandbrakeActive] = useState(false);

  const handleLeftDown = () => {
    setLeftActive(true);
    onSteer(-1);
    audio.triggerHaptic([15]);
  };
  const handleLeftUp = () => {
    setLeftActive(false);
    onSteer(0);
  };

  const handleRightDown = () => {
    setRightActive(true);
    onSteer(1);
    audio.triggerHaptic([15]);
  };
  const handleRightUp = () => {
    setRightActive(false);
    onSteer(0);
  };

  const handleThrottleDown = () => {
    setThrottleActive(true);
    onThrottle(1);
    audio.triggerHaptic([20]);
  };
  const handleThrottleUp = () => {
    setThrottleActive(false);
    onThrottle(0);
  };

  const handleBrakeDown = () => {
    setBrakeActive(true);
    onBrake(1);
    audio.triggerHaptic([25]);
  };
  const handleBrakeUp = () => {
    setBrakeActive(false);
    onBrake(0);
  };

  const handleHandbrakeDown = () => {
    setHandbrakeActive(true);
    onHandbrake(true);
    audio.triggerHaptic([35, 45]);
  };
  const handleHandbrakeUp = () => {
    setHandbrakeActive(false);
    onHandbrake(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex justify-between items-end p-4 md:p-8 z-30">
      {/* LEFT CLUSTER: Steering Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={handleLeftDown}
          onTouchEnd={handleLeftUp}
          onTouchCancel={handleLeftUp}
          onMouseDown={handleLeftDown}
          onMouseUp={handleLeftUp}
          onMouseLeave={handleLeftUp}
          className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 flex flex-col items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl ${
            leftActive
              ? 'bg-cyan-500/40 border-cyan-400 text-white shadow-cyan-500/50'
              : 'bg-slate-900/60 border-white/20 text-slate-300'
          }`}
        >
          <ArrowLeft className="w-9 h-9 stroke-[2.5]" />
          <span className="text-[10px] font-mono-data font-bold">LEFT</span>
        </button>

        <button
          onTouchStart={handleRightDown}
          onTouchEnd={handleRightUp}
          onTouchCancel={handleRightUp}
          onMouseDown={handleRightDown}
          onMouseUp={handleRightUp}
          onMouseLeave={handleRightUp}
          className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 flex flex-col items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl ${
            rightActive
              ? 'bg-cyan-500/40 border-cyan-400 text-white shadow-cyan-500/50'
              : 'bg-slate-900/60 border-white/20 text-slate-300'
          }`}
        >
          <ArrowRight className="w-9 h-9 stroke-[2.5]" />
          <span className="text-[10px] font-mono-data font-bold">RIGHT</span>
        </button>
      </div>

      {/* RIGHT CLUSTER: Throttle, Brake & Prominent Handbrake */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Handbrake Button (E-Brake) */}
        <button
          onTouchStart={handleHandbrakeDown}
          onTouchEnd={handleHandbrakeUp}
          onTouchCancel={handleHandbrakeUp}
          onMouseDown={handleHandbrakeDown}
          onMouseUp={handleHandbrakeUp}
          onMouseLeave={handleHandbrakeUp}
          className={`w-20 h-24 md:w-24 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl ${
            handbrakeActive
              ? 'bg-red-600 border-white text-white shadow-red-500/80 scale-105'
              : 'bg-red-950/70 border-red-500/50 text-red-300 shadow-red-950/50'
          }`}
        >
          <Disc3 className={`w-8 h-8 ${handbrakeActive ? 'animate-spin' : ''}`} />
          <span className="text-xs font-chakra font-black tracking-wider uppercase mt-1">
            E-BRAKE
          </span>
          <span className="text-[9px] font-mono-data text-red-200">DRIFT</span>
        </button>

        {/* Foot Brake / Reverse */}
        <button
          onTouchStart={handleBrakeDown}
          onTouchEnd={handleBrakeUp}
          onTouchCancel={handleBrakeUp}
          onMouseDown={handleBrakeDown}
          onMouseUp={handleBrakeUp}
          onMouseLeave={handleBrakeUp}
          className={`w-18 h-20 md:w-20 md:h-24 rounded-2xl border-2 flex flex-col items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl ${
            brakeActive
              ? 'bg-amber-500/50 border-amber-400 text-white shadow-amber-500/50'
              : 'bg-slate-900/60 border-white/20 text-slate-300'
          }`}
        >
          <span className="font-chakra font-bold text-xl">BRAKE</span>
          <span className="text-[9px] font-mono-data text-slate-400">REV</span>
        </button>

        {/* Throttle (Gas) */}
        <button
          onTouchStart={handleThrottleDown}
          onTouchEnd={handleThrottleUp}
          onTouchCancel={handleThrottleUp}
          onMouseDown={handleThrottleDown}
          onMouseUp={handleThrottleUp}
          onMouseLeave={handleThrottleUp}
          className={`w-20 h-28 md:w-24 md:h-32 rounded-2xl border-2 flex flex-col items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl ${
            throttleActive
              ? 'bg-emerald-500/50 border-emerald-400 text-white shadow-emerald-500/60 scale-105'
              : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <Flame className="w-8 h-8 text-emerald-400" />
          <span className="font-chakra font-black text-2xl tracking-wide uppercase mt-1">GAS</span>
          <span className="text-[10px] font-mono-data text-emerald-200">ACCEL</span>
        </button>
      </div>
    </div>
  );
};

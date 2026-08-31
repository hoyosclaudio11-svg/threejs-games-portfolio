import { useRef, useState, useCallback } from "react";

interface VirtualJoystickProps {
  onChange: (x: number, y: number) => void;
  size?: number;
}

export default function VirtualJoystick({ onChange, size = 120 }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const pointerId = useRef<number | null>(null);

  const radius = size / 2;

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      const max = radius;
      if (dist > max) {
        dx = (dx / dist) * max;
        dy = (dy / dist) * max;
      }
      setKnob({ x: dx, y: dy });
      onChange(dx / max, dy / max);
    },
    [onChange, radius]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    pointerId.current = e.pointerId;
    setActive(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateFromPoint(e.clientX, e.clientY);
  };

  const endTouch = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setActive(false);
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endTouch}
      onPointerCancel={endTouch}
      onPointerLeave={endTouch}
      style={{ width: size, height: size, touchAction: "none" }}
      className={`relative rounded-full border-2 ${
        active ? "border-amber-300/70 bg-black/30" : "border-white/30 bg-black/20"
      } backdrop-blur-sm select-none`}
    >
      <div
        style={{
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-black/40 transition-transform duration-75"
      />
    </div>
  );
}

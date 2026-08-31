import React from 'react';
import { PaceNote } from '../types/game';
import {
  CornerUpLeft,
  CornerUpRight,
  TrendingUp,
  AlertTriangle,
  ArrowUp,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PaceNoteBannerProps {
  currentNote: PaceNote | null;
  distanceToNote: number;
}

export const PaceNoteBanner: React.FC<PaceNoteBannerProps> = ({
  currentNote,
  distanceToNote,
}) => {
  if (!currentNote) return null;

  const getSeverityColor = (severity: number, type: string) => {
    if (type === 'caution') return 'bg-amber-500/20 border-amber-500 text-amber-400';
    if (type === 'jump' || type === 'crest') return 'bg-cyan-500/20 border-cyan-500 text-cyan-400';
    if (type.includes('hairpin') || severity === 1)
      return 'bg-red-600/30 border-red-500 text-red-400';
    if (severity === 2) return 'bg-orange-500/20 border-orange-400 text-orange-400';
    if (severity === 3) return 'bg-yellow-500/20 border-yellow-400 text-yellow-300';
    if (severity === 4) return 'bg-lime-500/20 border-lime-400 text-lime-300';
    return 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
  };

  const getIcon = () => {
    switch (currentNote.type) {
      case 'hairpin_left':
        return <CornerUpLeft className="w-10 h-10 text-red-400 animate-pulse stroke-[2.5]" />;
      case 'hairpin_right':
        return <CornerUpRight className="w-10 h-10 text-red-400 animate-pulse stroke-[2.5]" />;
      case 'left':
        return currentNote.severity <= 2 ? (
          <CornerUpLeft className="w-9 h-9 stroke-[2.5]" />
        ) : (
          <ChevronLeft className="w-9 h-9 stroke-[2.5]" />
        );
      case 'right':
        return currentNote.severity <= 2 ? (
          <CornerUpRight className="w-9 h-9 stroke-[2.5]" />
        ) : (
          <ChevronRight className="w-9 h-9 stroke-[2.5]" />
        );
      case 'jump':
      case 'crest':
        return <TrendingUp className="w-9 h-9 stroke-[2.5] text-cyan-400 animate-bounce" />;
      case 'chicane':
        return <Layers className="w-9 h-9 stroke-[2.5] text-amber-400" />;
      case 'caution':
        return <AlertTriangle className="w-9 h-9 stroke-[2.5] text-yellow-400 animate-pulse" />;
      case 'water_splash':
        return <Sparkles className="w-9 h-9 stroke-[2.5] text-sky-400" />;
      default:
        return <ArrowUp className="w-9 h-9 stroke-[2.5]" />;
    }
  };

  const colorClasses = getSeverityColor(currentNote.severity, currentNote.type);
  const distanceStr =
    distanceToNote <= 15 ? 'NOW!' : `${Math.max(0, Math.round(distanceToNote))}m`;

  return (
    <div className="flex flex-col items-center pointer-events-none select-none drop-shadow-2xl">
      <div
        className={`flex items-center gap-4 px-5 py-2.5 rounded-xl border-2 backdrop-blur-md transition-all duration-150 ${colorClasses} shadow-lg shadow-black/60`}
      >
        <div className="flex items-center justify-center p-1 bg-black/40 rounded-lg border border-white/10">
          {getIcon()}
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="font-chakra font-bold text-xl tracking-wider text-white uppercase drop-shadow">
              {currentNote.text}
            </span>
            {currentNote.modifier && (
              <span className="px-2 py-0.5 text-xs font-mono-data font-bold uppercase rounded bg-black/60 border border-white/20 text-yellow-400">
                {currentNote.modifier.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-data font-semibold text-slate-300">
            <span>CALL DISTANCE:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded ${
                distanceToNote <= 20 ? 'bg-red-500 text-white animate-pulse' : 'text-cyan-300'
              }`}
            >
              {distanceStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

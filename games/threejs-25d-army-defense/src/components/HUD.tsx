import React from 'react';
import { 
  HeroCommander, 
  SquadMember, 
  VillageState, 
  FormationMode, 
  WaveScenario 
} from '../types/game';
import { 
  Shield, 
  Zap, 
  Swords, 
  Coins, 
  RotateCw, 
  Flame, 
  Target, 
  Bomb, 
  Crosshair, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Settings, 
  FastForward, 
  Compass,
  Sparkles
} from 'lucide-react';

interface HUDProps {
  hero: HeroCommander;
  squad: SquadMember[];
  village: VillageState;
  scenario: WaveScenario | null;
  waveNum: number;
  gold: number;
  combo: number;
  formation: FormationMode;
  gameSpeed: number;
  isPaused: boolean;
  isMuted: boolean;
  enemiesRemaining: number;
  totalEnemiesInWave: number;
  bossActive: boolean;
  onTriggerHeroSkill: (index: number) => void;
  onTriggerHeroDash: () => void;
  onHeroAttack: () => void;
  onTriggerSquadSkill: (index: number) => void;
  onSetFormation: (mode: FormationMode) => void;
  onToggleSpeed: () => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  lang: 'es' | 'en';
}

export const HUD: React.FC<HUDProps> = ({
  hero,
  squad,
  village,
  scenario,
  waveNum,
  gold,
  combo,
  formation,
  gameSpeed,
  isPaused,
  isMuted,
  enemiesRemaining,
  totalEnemiesInWave,
  bossActive,
  onTriggerHeroSkill,
  onTriggerHeroDash,
  onHeroAttack,
  onTriggerSquadSkill,
  onSetFormation,
  onToggleSpeed,
  onTogglePause,
  onToggleMute,
  onOpenSettings,
  lang
}) => {
  const isEs = lang === 'es';
  const heroHpPct = Math.max(0, Math.min(100, (hero.stats.hp / hero.stats.maxHp) * 100));
  const villageHpPct = Math.max(0, Math.min(100, (village.hp / village.maxHp) * 100));

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'RotateCw': return <RotateCw className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      case 'Bomb': return <Bomb className="w-5 h-5" />;
      case 'Crosshair': return <Crosshair className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden font-sans">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* TOP LEFT: HERO & VILLAGE HEALTH STATUS */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Hero Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 rounded-xl p-2.5 shadow-2xl min-w-[240px] max-w-[280px]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow">
                  ★
                </div>
                <div>
                  <div className="text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    {isEs ? 'Comandante Kaelen' : 'Commander Kaelen'}
                  </div>
                  <div className="text-[10px] text-slate-400">Nv. {hero.level} Guerrero Real</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400">{Math.round(hero.stats.hp)}</span>
                <span className="text-[10px] text-slate-400">/{hero.stats.maxHp}</span>
              </div>
            </div>

            {/* Health Bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-3.5 p-0.5 border border-slate-700/60 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-200 shadow-inner"
                style={{ width: `${heroHpPct}%` }}
              />
              {hero.shield > 0 && (
                <div 
                  className="absolute top-0 left-0 h-full bg-cyan-400/70 border-r border-cyan-200"
                  style={{ width: `${(hero.shield / hero.maxShield) * 100}%` }}
                />
              )}
            </div>
          </div>

          {/* Village Core Health Card */}
          <div className={`backdrop-blur-md border rounded-xl p-2.5 shadow-2xl min-w-[240px] max-w-[280px] transition-all duration-300 ${
            village.damageFlashTimer > 0 
              ? 'bg-rose-950/90 border-rose-500 animate-pulse' 
              : 'bg-slate-900/90 border-cyan-500/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-cyan-300 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    {isEs ? 'Núcleo de la Aldea' : 'Village Core Heart'}
                  </div>
                  <div className="text-[10px] text-slate-400">{isEs ? '¡Protégelo a toda costa!' : 'Defend at all costs!'}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold ${villageHpPct < 30 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {Math.round(village.hp)}
                </span>
                <span className="text-[10px] text-slate-400">/{village.maxHp}</span>
              </div>
            </div>

            {/* Village Health Bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-3 p-0.5 border border-slate-700/60 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  villageHpPct < 30 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${villageHpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* TOP CENTER: WAVE SCENARIO & PROGRESS */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          {scenario && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl px-4 py-2 shadow-2xl flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] border border-amber-500/40">
                  {isEs ? `OLEADA ${waveNum}` : `WAVE ${waveNum}`}
                </span>
                <span className="text-slate-200 font-black text-sm tracking-wide">
                  {isEs ? scenario.name : scenario.nameEn}
                </span>
                {bossActive && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-bold text-[10px] border border-rose-500/60 animate-bounce">
                    {isEs ? '¡JEFE ACTIVO!' : 'BOSS ACTIVE!'}
                  </span>
                )}
              </div>

              {/* Wave Progress Counter */}
              <div className="flex items-center gap-2 mt-1 w-full">
                <div className="w-36 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, ((totalEnemiesInWave - enemiesRemaining) / Math.max(1, totalEnemiesInWave)) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-300 font-mono">
                  {enemiesRemaining} {isEs ? 'restantes' : 'left'}
                </span>
              </div>
            </div>
          )}

          {/* COMBO MULTIPLIER NOTIFIER */}
          {combo > 2 && (
            <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-lg animate-bounce flex items-center gap-1 border border-amber-300">
              <Sparkles className="w-3 h-3" />
              <span>{combo}x COMBO STREAK!</span>
            </div>
          )}
        </div>

        {/* TOP RIGHT: GOLD, CONTROLS & SETTINGS */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Gold Counter */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/50 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-amber-300 font-black text-sm">{gold}</span>
          </div>

          {/* Speed Toggle (1x / 1.5x / 2x) */}
          <button 
            onClick={onToggleSpeed}
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl p-2 shadow-lg transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            title="Velocidad de juego"
          >
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>{gameSpeed}x</span>
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={onToggleMute}
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl p-2 shadow-lg transition active:scale-95"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Toggle */}
          <button 
            onClick={onTogglePause}
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl p-2 shadow-lg transition active:scale-95"
            title="Pausar"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Settings */}
          <button 
            onClick={onOpenSettings}
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl p-2 shadow-lg transition active:scale-95"
            title="Ajustes"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: SQUAD MEMBERS + FORMATION DOCK + HERO ACTION BAR */}
      <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto">
        {/* TACTICAL FORMATIONS BAR */}
        <div className="flex items-center justify-center gap-1.5 pointer-events-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            {isEs ? 'Táctica [Z,X,C,V]:' : 'Tactics [Z,X,C,V]:'}
          </span>
          
          <button 
            onClick={() => onSetFormation('follow')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border shadow ${
              formation === 'follow'
                ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isEs ? 'Escolta (Z)' : 'Escort (Z)'}</span>
          </button>

          <button 
            onClick={() => onSetFormation('defend_village')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border shadow ${
              formation === 'defend_village'
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-500/30'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isEs ? 'Defender Aldea (X)' : 'Guard Core (X)'}</span>
          </button>

          <button 
            onClick={() => onSetFormation('assault')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border shadow ${
              formation === 'assault'
                ? 'bg-rose-600 border-rose-400 text-white shadow-rose-500/30'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>{isEs ? 'Asalto Total (C)' : 'All-Out Attack (C)'}</span>
          </button>
        </div>

        {/* SQUAD MEMBERS CARDS BAR */}
        <div className="flex items-end justify-center gap-2 pointer-events-auto overflow-x-auto pb-1 max-w-full">
          {squad.map((member, index) => {
            const hpPct = Math.max(0, Math.min(100, (member.stats.hp / member.stats.maxHp) * 100));
            const isReady = member.skill.currentCooldown <= 0;
            const cdProgress = isReady ? 100 : ((member.skill.cooldown - member.skill.currentCooldown) / member.skill.cooldown) * 100;

            return (
              <div 
                key={member.id}
                className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-slate-500 rounded-xl p-2 shadow-xl flex flex-col gap-1.5 min-w-[125px] transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-200 truncate max-w-[80px]">
                    {member.name}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    Nv.{member.level}
                  </span>
                </div>

                {/* HP mini bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${hpPct}%`, backgroundColor: member.color }}
                  />
                </div>

                {/* Squad Skill Trigger Button */}
                <button
                  onClick={() => onTriggerSquadSkill(index)}
                  disabled={!isReady}
                  className={`relative w-full py-1.5 px-2 rounded-lg font-black text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 border ${
                    isReady 
                      ? 'text-slate-950 shadow-md hover:brightness-110' 
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 cursor-not-allowed opacity-80'
                  }`}
                  style={{
                    backgroundColor: isReady ? member.color : undefined,
                    borderColor: isReady ? member.accentColor : undefined
                  }}
                  title={isEs ? member.skill.description : member.skill.descriptionEn}
                >
                  {/* Cooldown radial/fill overlay */}
                  {!isReady && (
                    <div 
                      className="absolute left-0 top-0 h-full bg-slate-700/50 rounded-lg"
                      style={{ width: `${cdProgress}%` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    {getSkillIcon(member.skill.icon)}
                    <span>{isReady ? `[${member.skill.keybind || index + 1}]` : `${member.skill.currentCooldown.toFixed(1)}s`}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* HERO ACTIONS BAR */}
        <div className="bg-slate-950/90 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-center gap-2 pointer-events-auto mx-auto">
          {/* Normal Attack */}
          <button
            onClick={onHeroAttack}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 active:scale-95 text-slate-950 font-black shadow-lg border border-amber-300 transition"
            title="Ataque Primario (Click Izquierdo)"
          >
            <Swords className="w-5 h-5" />
            <span className="text-[9px]">ESPADA</span>
          </button>

          {/* Hero Skills (Q, E, R, F) */}
          {hero.skills.map((skill, idx) => {
            const isReady = skill.currentCooldown <= 0;
            const cdPct = isReady ? 100 : ((skill.cooldown - skill.currentCooldown) / skill.cooldown) * 100;

            return (
              <button
                key={skill.id}
                onClick={() => onTriggerHeroSkill(idx)}
                disabled={!isReady}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl font-black text-xs transition border shadow-lg active:scale-95 overflow-hidden ${
                  isReady 
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-white border-amber-400/60 shadow-amber-500/10' 
                    : 'bg-slate-900/90 text-slate-500 border-slate-800 cursor-not-allowed'
                }`}
                title={isEs ? `${skill.name}: ${skill.description}` : `${skill.nameEn}: ${skill.descriptionEn}`}
              >
                {!isReady && (
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-amber-500/20"
                    style={{ height: `${cdPct}%` }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <span style={{ color: isReady ? skill.color : undefined }}>
                    {getSkillIcon(skill.icon)}
                  </span>
                  <span className="text-[10px] font-mono mt-0.5">
                    {isReady ? `[${skill.keybind}]` : `${skill.currentCooldown.toFixed(1)}s`}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Spacebar Dash */}
          <button
            onClick={onTriggerHeroDash}
            disabled={hero.dashCooldown > 0}
            className={`flex flex-col items-center justify-center px-3 h-12 rounded-xl font-black text-xs transition border shadow-lg active:scale-95 ${
              hero.dashCooldown <= 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
                : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
            }`}
            title="Esquivar / Rodar (Espacio)"
          >
            <Zap className="w-4 h-4" />
            <span className="text-[9px] font-mono">[SPACE]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

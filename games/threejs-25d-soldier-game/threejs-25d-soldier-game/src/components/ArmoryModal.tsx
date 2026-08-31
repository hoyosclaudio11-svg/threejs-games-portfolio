import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Crosshair, 
  Shield, 
  Heart, 
  Zap, 
  Flame, 
  ChevronRight, 
  Coins,
  AlertTriangle,
  ArrowUpCircle
} from 'lucide-react';
import { 
  SoldierRuntimeStats, 
  WeaponStats, 
  RoguelitePerk, 
  UpgradeItem, 
  WeaponType 
} from '../types/game';
import { 
  ARMORY_UPGRADES, 
  ROGUELITE_PERKS, 
  SCENARIO_BIOMES 
} from '../game/constants';
import { soundManager } from '../audio/SoundManager';

interface ArmoryModalProps {
  waveCompleted: number;
  credits: number;
  stats: SoldierRuntimeStats;
  arsenal: Record<string, WeaponStats>;
  onBuyUpgrade: (upgrade: UpgradeItem) => void;
  onUnlockWeapon: (weaponId: WeaponType) => void;
  onUpgradeWeapon: (weaponId: WeaponType) => void;
  onSelectRoguelitePerk: (perk: RoguelitePerk) => void;
  onRefillAmmo: () => void;
  onHealPlayer: () => void;
  onStartNextWave: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  waveCompleted,
  credits,
  stats,
  arsenal,
  onBuyUpgrade,
  onUnlockWeapon,
  onUpgradeWeapon,
  onSelectRoguelitePerk,
  onRefillAmmo,
  onHealPlayer,
  onStartNextWave,
}) => {
  const [activeTab, setActiveTab] = useState<'perks' | 'weapons' | 'stats' | 'supplies'>('perks');
  const [selectedPerk, setSelectedPerk] = useState<RoguelitePerk | null>(null);
  
  // Pick 3 random perks for selection
  const [availablePerks] = useState<RoguelitePerk[]>(() => {
    const shuffled = [...ROGUELITE_PERKS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  const nextWaveNum = waveCompleted + 1;
  const nextBiome = SCENARIO_BIOMES[(nextWaveNum - 1) % SCENARIO_BIOMES.length];

  const handlePickPerk = (perk: RoguelitePerk) => {
    soundManager.playUIClick();
    setSelectedPerk(perk);
    onSelectRoguelitePerk(perk);
    setActiveTab('weapons');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-rajdhani">
      <div className="cyber-panel w-full max-w-5xl max-h-[92vh] flex flex-col border-sky-400/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-500/30 bg-slate-950/60">
          <div>
            <span className="text-xs font-orbitron text-sky-400 font-bold uppercase tracking-wider">
              ¡OLA {waveCompleted} COMPLETADA CON ÉXITO!
            </span>
            <h1 className="text-2xl md:text-3xl font-orbitron font-black text-white glow-cyan">
              MERCADO DE MEJORAS Y ARMAMENTO
            </h1>
          </div>

          <div className="flex items-center gap-2 cyber-panel-gold px-4 py-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div className="text-right">
              <span className="text-[10px] text-yellow-200 uppercase font-semibold">Tus Créditos</span>
              <div className="text-lg font-orbitron font-black text-white">{credits.toLocaleString()} CR</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('perks')}
            className={`py-3 px-4 font-orbitron text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'perks' 
                ? 'border-amber-400 text-amber-300 bg-amber-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            1. RECOMPENSA DE OLA {selectedPerk ? '✓' : '(Elegir)'}
          </button>

          <button
            onClick={() => setActiveTab('weapons')}
            className={`py-3 px-4 font-orbitron text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'weapons' 
                ? 'border-sky-400 text-sky-300 bg-sky-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-4 h-4 text-sky-400" />
            2. ARMERÍA Y ARMAS
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 font-orbitron text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'stats' 
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            3. MEJORAS DEL SOLDADO
          </button>

          <button
            onClick={() => setActiveTab('supplies')}
            className={`py-3 px-4 font-orbitron text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'supplies' 
                ? 'border-rose-400 text-rose-300 bg-rose-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-rose-400" />
            4. SUMINISTROS
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: PERKS */}
          {activeTab === 'perks' && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-orbitron font-bold text-white mb-1">
                  SELECCIONA 1 VENTAJA TÁCTICA GRATUITA
                </h3>
                <p className="text-sm text-slate-400">
                  Potencia las habilidades de tu soldado para sobrevivir al próximo escenario.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePerks.map((perk) => {
                  const isSelected = selectedPerk?.id === perk.id;
                  return (
                    <div 
                      key={perk.id}
                      onClick={() => !selectedPerk && handlePickPerk(perk)}
                      className={`cyber-panel p-5 cursor-pointer transition-all border-2 flex flex-col justify-between ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50' 
                          : selectedPerk 
                            ? 'opacity-40 cursor-not-allowed border-slate-700' 
                            : 'border-sky-500/40 hover:border-sky-400 hover:scale-[1.02]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2.5 py-0.5 text-[10px] font-orbitron font-bold uppercase rounded border ${
                            perk.rarity === 'legendary' 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400' 
                              : perk.rarity === 'epic' 
                                ? 'bg-purple-500/20 text-purple-300 border-purple-400' 
                                : 'bg-sky-500/20 text-sky-300 border-sky-400'
                          }`}>
                            {perk.rarity}
                          </span>
                          <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <h4 className="font-orbitron font-bold text-lg text-white mb-2">{perk.name}</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{perk.description}</p>
                      </div>

                      <button 
                        disabled={!!selectedPerk}
                        className={`mt-4 w-full py-2 font-orbitron font-bold text-xs rounded transition-all ${
                          isSelected 
                            ? 'bg-amber-500 text-black' 
                            : selectedPerk 
                              ? 'bg-slate-800 text-slate-500' 
                              : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        {isSelected ? '✓ SELECCIONADA' : 'EQUIPAR VENTAJA'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: WEAPONS */}
          {activeTab === 'weapons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(arsenal).map((w) => {
                const canUnlock = !w.unlocked && credits >= w.upgradeCost;
                const canUpgrade = w.unlocked && credits >= w.upgradeCost * w.level;

                return (
                  <div key={w.id} className="cyber-panel p-4 flex flex-col justify-between border-slate-700">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[10px] font-mono text-sky-400 uppercase">{w.category}</span>
                          <h4 className="font-orbitron font-bold text-base text-white">{w.name}</h4>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-orbitron font-bold rounded ${
                          w.unlocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {w.unlocked ? `Nivel ${w.level}` : 'Bloqueada'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-3">{w.description}</p>

                      {/* Weapon Specs */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded border border-slate-800 text-xs font-rajdhani mb-3">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Daño:</span>
                          <span className="text-red-400 font-bold font-orbitron">{w.damage * w.level}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cadencia:</span>
                          <span className="text-yellow-400 font-bold font-orbitron">{w.fireRate}/s</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cargador:</span>
                          <span className="text-cyan-400 font-bold font-orbitron">{w.magazineSize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!w.unlocked ? (
                      <button
                        onClick={() => onUnlockWeapon(w.id)}
                        disabled={!canUnlock}
                        className={`w-full py-2 px-3 font-orbitron text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${
                          canUnlock 
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        DESBLOQUEAR ({w.upgradeCost} CR)
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpgradeWeapon(w.id)}
                        disabled={!canUpgrade}
                        className={`w-full py-2 px-3 font-orbitron text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${
                          canUpgrade 
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        SUBIR A NIVEL {w.level + 1} ({w.upgradeCost * w.level} CR)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ARMORY_UPGRADES.map((upg) => {
                const currentCost = Math.round(upg.cost * Math.pow(upg.costMultiplier, upg.level - 1));
                const canAfford = credits >= currentCost && upg.level < upg.maxLevel;

                return (
                  <div key={upg.id} className="cyber-panel p-4 flex flex-col justify-between border-slate-700">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-orbitron font-bold text-sm text-white">{upg.name}</h4>
                        <span className="text-xs font-orbitron text-sky-400">
                          {upg.level}/{upg.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{upg.description}</p>
                    </div>

                    <button
                      onClick={() => onBuyUpgrade(upg)}
                      disabled={!canAfford}
                      className={`w-full py-2 px-3 font-orbitron text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
                        upg.level >= upg.maxLevel
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600 cursor-default'
                          : canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {upg.level >= upg.maxLevel ? (
                        'NIVEL MÁXIMO'
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          MEJORAR ({currentCost} CR)
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: SUPPLIES */}
          {activeTab === 'supplies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyber-panel p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-red-400">
                    <Heart className="w-5 h-5" />
                    <h4 className="font-orbitron font-bold text-base text-white">Botiquín de Regeneración Total</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Restaura el 100% de la vida y escudos del soldado.</p>
                </div>
                <button
                  onClick={onHealPlayer}
                  disabled={credits < 80 || stats.hp >= stats.maxHp}
                  className={`w-full py-2.5 font-orbitron text-xs font-bold rounded flex items-center justify-center gap-2 ${
                    credits >= 80 && stats.hp < stats.maxHp
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  REPARAR SALUD (80 CR)
                </button>
              </div>

              <div className="cyber-panel p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-amber-400">
                    <Flame className="w-5 h-5" />
                    <h4 className="font-orbitron font-bold text-base text-white">Caja de Munición de Reserva</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Rellena al máximo la munición de reserva de todas tus armas.</p>
                </div>
                <button
                  onClick={onRefillAmmo}
                  disabled={credits < 100}
                  className={`w-full py-2.5 font-orbitron text-xs font-bold rounded flex items-center justify-center gap-2 ${
                    credits >= 100
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  RECARGAR TODA LA MUNICIÓN (100 CR)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Next Wave Preview Banner & Start Button */}
        <div className="p-4 bg-slate-950 border-t border-sky-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Next Wave Biome Preview */}
          <div className="flex items-center gap-3">
            {nextBiome.bossType ? (
              <div className="p-2.5 bg-red-500/20 text-red-400 rounded border border-red-500/40">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
            ) : (
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded border border-sky-500/40">
                <Shield className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-orbitron font-bold text-sky-400 uppercase">
                  PRÓXIMO ESCENARIO: OLA {nextWaveNum}
                </span>
                {nextBiome.bossType && (
                  <span className="px-1.5 py-0.5 bg-red-600/80 text-white text-[9px] font-orbitron font-bold rounded">
                    ⚠️ JEFE INMINENTE
                  </span>
                )}
              </div>
              <h3 className="font-orbitron font-black text-sm md:text-base text-white">
                {nextBiome.name} ({nextBiome.subtitle})
              </h3>
            </div>
          </div>

          {/* Start Next Wave Button */}
          <button
            onClick={() => {
              soundManager.playUIClick();
              onStartNextWave();
            }}
            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 hover:from-sky-500 hover:to-emerald-400 text-black font-orbitron font-black text-sm rounded shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 cyber-button"
          >
            DESPLEGAR EN OLA {nextWaveNum}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

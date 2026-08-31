import React, { useState } from 'react';
import { 
  HeroCommander, 
  SquadMember, 
  VillageState, 
  WaveScenario, 
  RelicItem 
} from '../types/game';
import { 
  Shield, 
  Swords, 
  Coins, 
  Sparkles, 
  Crown, 
  Heart, 
  Clock, 
  Zap, 
  ArrowRight, 
  Check, 
  Home, 
  UserPlus
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ShopModalProps {
  gold: number;
  waveNum: number;
  nextScenario: WaveScenario | null;
  hero: HeroCommander;
  squad: SquadMember[];
  village: VillageState;
  relics: RelicItem[];
  onUpgradeHero: (type: 'attack' | 'hp' | 'speed' | 'crit', cost: number) => void;
  onUpgradeSquadMember: (memberId: string, cost: number) => void;
  onUpgradeVillage: (type: 'hp' | 'turret' | 'repair_full', cost: number) => void;
  onBuyRelic: (relicId: string, cost: number) => void;
  onStartNextWave: () => void;
  lang: 'es' | 'en';
}

export const ShopModal: React.FC<ShopModalProps> = ({
  gold,
  waveNum,
  nextScenario,
  hero,
  squad,
  village,
  relics,
  onUpgradeHero,
  onUpgradeSquadMember,
  onUpgradeVillage,
  onBuyRelic,
  onStartNextWave,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'hero' | 'squad' | 'village' | 'relics'>('squad');
  const isEs = lang === 'es';

  const heroUpgradeCosts = {
    attack: Math.round(100 * Math.pow(1.4, hero.level - 1)),
    hp: Math.round(100 * Math.pow(1.35, hero.level - 1)),
    speed: Math.round(120 * Math.pow(1.4, hero.level - 1)),
    crit: Math.round(140 * Math.pow(1.45, hero.level - 1))
  };

  const villageUpgradeCosts = {
    hp: Math.round(150 * Math.pow(1.4, village.level - 1)),
    turret: Math.round(200 * Math.pow(1.5, village.turretLevel)),
    repair_full: 100
  };

  const getRelicIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown': return <Crown className="w-5 h-5 text-amber-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-rose-400" />;
      case 'Clock': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-yellow-400" />;
      default: return <Coins className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/40">
                {isEs ? `¡OLEADA ${waveNum} SUPERADA!` : `WAVE ${waveNum} CLEARED!`}
              </span>
              <h2 className="text-xl font-black text-white tracking-wide">
                {isEs ? 'Arsenal y Campamento de Guerra' : 'War Camp & Armory'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEs 
                ? 'Mejora las habilidades de tus tropas y fortifica la aldea antes del siguiente asedio.' 
                : 'Upgrade your hero, promote squad units, and reinforce village defenses.'}
            </p>
          </div>

          {/* Gold Display */}
          <div className="flex items-center gap-2 bg-slate-950/90 border border-amber-500/60 rounded-2xl px-4 py-2 shadow-inner">
            <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">{isEs ? 'Oro Disponible' : 'Available Gold'}</div>
              <div className="text-lg font-black text-amber-300">{gold}</div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('squad')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'squad'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isEs ? 'Ejército / Escuadrón' : 'Squad Units'}</span>
          </button>

          <button
            onClick={() => setActiveTab('hero')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'hero'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>{isEs ? 'Comandante' : 'Commander'}</span>
          </button>

          <button
            onClick={() => setActiveTab('village')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'village'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{isEs ? 'Defensas de Aldea' : 'Village Defenses'}</span>
          </button>

          <button
            onClick={() => setActiveTab('relics')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'relics'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>{isEs ? 'Reliquias Mágicas' : 'Relics'}</span>
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* TAB 1: SQUAD UNITS UPGRADES */}
          {activeTab === 'squad' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {squad.map((member) => {
                const upgradeCost = Math.round(120 * Math.pow(1.35, member.level - 1));
                const canAfford = gold >= upgradeCost && member.isUnlocked;

                return (
                  <div 
                    key={member.id}
                    className={`bg-slate-950/70 border rounded-2xl p-3.5 flex flex-col justify-between transition ${
                      member.isUnlocked ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-black text-sm">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{isEs ? member.role : member.roleEn}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                          Nv. {member.level}
                        </span>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-2 my-2.5 bg-slate-900/80 rounded-xl p-2 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">{isEs ? 'Ataque:' : 'Attack:'}</span>
                          <span className="font-bold text-amber-300">{member.stats.attack}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">{isEs ? 'Vida Máx:' : 'Max HP:'}</span>
                          <span className="font-bold text-emerald-400">{member.stats.maxHp}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">{isEs ? 'Rango:' : 'Range:'}</span>
                          <span className="font-bold text-cyan-400">{member.stats.attackRange.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">{isEs ? 'Enfriamiento:' : 'Cooldown:'}</span>
                          <span className="font-bold text-purple-400">{member.skill.cooldown}s</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 italic">
                        {isEs ? member.skill.description : member.skill.descriptionEn}
                      </p>
                    </div>

                    {/* Upgrade button */}
                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundManager.playCoin();
                          onUpgradeSquadMember(member.id, upgradeCost);
                        }
                      }}
                      disabled={!canAfford}
                      className={`mt-3 w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 border ${
                        canAfford 
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-md' 
                          : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isEs ? `Promover a Nivel ${member.level + 1}` : `Promote to Level ${member.level + 1}`}</span>
                      <span className="font-mono text-amber-950 font-extrabold bg-amber-300/80 px-1.5 py-0.2 rounded text-[10px]">
                        {upgradeCost} G
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: HERO COMMANDER UPGRADES */}
          {activeTab === 'hero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Attack Upgrade */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="w-5 h-5 text-amber-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Filo Sagrado Legendario' : 'Legendary Holy Edge'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? '+20 Daño de Espada y mayor área de corte' : '+20 Sword Attack Damage and larger slice radius'}</p>
                  <div className="mt-2 text-xs font-bold text-amber-300">{isEs ? `Ataque Actual: ${hero.stats.attack}` : `Current Attack: ${hero.stats.attack}`}</div>
                </div>
                <button
                  onClick={() => onUpgradeHero('attack', heroUpgradeCosts.attack)}
                  disabled={gold < heroUpgradeCosts.attack}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= heroUpgradeCosts.attack 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Mejorar Ataque' : 'Upgrade Attack'}</span>
                  <span className="font-mono font-black">{heroUpgradeCosts.attack} G</span>
                </button>
              </div>

              {/* HP & Shield Upgrade */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Armadura de la Corona' : 'Royal Crown Armor'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? '+100 Vida Máxima y +50 Escudo de Absorción' : '+100 Max HP and +50 Absorption Shield'}</p>
                  <div className="mt-2 text-xs font-bold text-emerald-300">{isEs ? `Vida Actual: ${hero.stats.maxHp}` : `Current Max HP: ${hero.stats.maxHp}`}</div>
                </div>
                <button
                  onClick={() => onUpgradeHero('hp', heroUpgradeCosts.hp)}
                  disabled={gold < heroUpgradeCosts.hp}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= heroUpgradeCosts.hp 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Mejorar Vida' : 'Upgrade HP'}</span>
                  <span className="font-mono font-black">{heroUpgradeCosts.hp} G</span>
                </button>
              </div>

              {/* Speed Upgrade */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Botas de Velocidad del Viento' : 'Windrunner Greaves'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? '+15% Velocidad de Movimiento y menor recarga de esquiva' : '+15% Move Speed and reduced dash cooldown'}</p>
                  <div className="mt-2 text-xs font-bold text-blue-300">{isEs ? `Velocidad: ${hero.stats.moveSpeed.toFixed(1)}` : `Speed: ${hero.stats.moveSpeed.toFixed(1)}`}</div>
                </div>
                <button
                  onClick={() => onUpgradeHero('speed', heroUpgradeCosts.speed)}
                  disabled={gold < heroUpgradeCosts.speed}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= heroUpgradeCosts.speed 
                      ? 'bg-blue-500 hover:bg-blue-400 text-slate-950 border-blue-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Mejorar Velocidad' : 'Upgrade Speed'}</span>
                  <span className="font-mono font-black">{heroUpgradeCosts.speed} G</span>
                </button>
              </div>

              {/* Crit Upgrade */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Precisión Crítica Letal' : 'Lethal Critical Strike'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? '+10% Probabilidad de Golpe Crítico (x2 daño)' : '+10% Critical Strike Chance (x2 damage)'}</p>
                  <div className="mt-2 text-xs font-bold text-purple-300">{isEs ? `Prob. Crítico: ${(hero.stats.critChance * 100).toFixed(0)}%` : `Crit Chance: ${(hero.stats.critChance * 100).toFixed(0)}%`}</div>
                </div>
                <button
                  onClick={() => onUpgradeHero('crit', heroUpgradeCosts.crit)}
                  disabled={gold < heroUpgradeCosts.crit}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= heroUpgradeCosts.crit 
                      ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 border-purple-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Mejorar Crítico' : 'Upgrade Crit'}</span>
                  <span className="font-mono font-black">{heroUpgradeCosts.crit} G</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VILLAGE UPGRADES */}
          {activeTab === 'village' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Fortified Stone Walls */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-5 h-5 text-cyan-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Murallas Fortificadas de Piedra' : 'Fortified Stone Ramparts'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? '+300 Vida Máxima al Núcleo de la Aldea' : '+300 Max HP to the Village Core'}</p>
                  <div className="mt-2 text-xs font-bold text-cyan-300">{isEs ? `Vida Aldea: ${village.hp}/${village.maxHp}` : `Village HP: ${village.hp}/${village.maxHp}`}</div>
                </div>
                <button
                  onClick={() => onUpgradeVillage('hp', villageUpgradeCosts.hp)}
                  disabled={gold < villageUpgradeCosts.hp}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= villageUpgradeCosts.hp 
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Fortificar Muralla' : 'Fortify Wall'}</span>
                  <span className="font-mono font-black">{villageUpgradeCosts.hp} G</span>
                </button>
              </div>

              {/* Automated Ballista Turrets */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Torretas Centinela Automáticas' : 'Automated Ballista Turrets'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? '+50 Daño a los proyectiles de defensa del núcleo' : '+50 Damage to automatic village turret bolts'}</p>
                  <div className="mt-2 text-xs font-bold text-amber-300">{isEs ? `Nivel Torreta: ${village.turretLevel}` : `Turret Level: ${village.turretLevel}`}</div>
                </div>
                <button
                  onClick={() => onUpgradeVillage('turret', villageUpgradeCosts.turret)}
                  disabled={gold < villageUpgradeCosts.turret}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= villageUpgradeCosts.turret 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Mejorar Torretas' : 'Upgrade Turrets'}</span>
                  <span className="font-mono font-black">{villageUpgradeCosts.turret} G</span>
                </button>
              </div>

              {/* Instant Full Repair */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between md:col-span-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-5 h-5 text-rose-400" />
                    <div className="font-black text-white text-sm">{isEs ? 'Reparación de Emergencia Completa' : 'Full Emergency Repair'}</div>
                  </div>
                  <p className="text-xs text-slate-400">{isEs ? 'Restaura inmediatamente el 100% de la vida de la aldea y del héroe.' : 'Instantly restores 100% of Village Core and Hero HP.'}</p>
                </div>
                <button
                  onClick={() => onUpgradeVillage('repair_full', villageUpgradeCosts.repair_full)}
                  disabled={gold < villageUpgradeCosts.repair_full || (village.hp >= village.maxHp && hero.stats.hp >= hero.stats.maxHp)}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                    gold >= villageUpgradeCosts.repair_full 
                      ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 border-rose-300' 
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{isEs ? 'Restaurar 100% HP' : 'Restore 100% HP'}</span>
                  <span className="font-mono font-black">{villageUpgradeCosts.repair_full} G</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: RELICS */}
          {activeTab === 'relics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relics.map((relic) => {
                const canBuy = gold >= relic.cost && !relic.purchased;

                return (
                  <div 
                    key={relic.id}
                    className={`bg-slate-950/70 border rounded-2xl p-3.5 flex flex-col justify-between transition ${
                      relic.purchased ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getRelicIcon(relic.icon)}
                          <div className="font-black text-white text-sm">{isEs ? relic.name : relic.nameEn}</div>
                        </div>
                        {relic.purchased && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/40">
                            <Check className="w-3 h-3" />
                            <span>{isEs ? 'ACTIVA' : 'ACTIVE'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{isEs ? relic.description : relic.descriptionEn}</p>
                    </div>

                    <button
                      onClick={() => onBuyRelic(relic.id, relic.cost)}
                      disabled={!canBuy}
                      className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border ${
                        relic.purchased 
                          ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-default' 
                          : canBuy 
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300' 
                            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <span>{relic.purchased ? (isEs ? 'Ya Obtenida' : 'Owned') : (isEs ? 'Comprar Reliquia' : 'Buy Relic')}</span>
                      {!relic.purchased && <span className="font-mono font-black">{relic.cost} G</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER: NEXT WAVE BANNER & ACTION */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          {nextScenario ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-300">
                {nextScenario.waveNumber}
              </div>
              <div>
                <div className="text-xs text-slate-400">{isEs ? 'Siguiente Escenario:' : 'Next Scenario:'}</div>
                <div className="text-sm font-black text-white">{isEs ? nextScenario.name : nextScenario.nameEn}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm font-black text-amber-300">
              {isEs ? '¡Victoria Total sobre el Mal!' : 'Victory over the darkness!'}
            </div>
          )}

          <button
            onClick={() => {
              soundManager.playBattleHorn();
              onStartNextWave();
            }}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 border border-amber-200 transition"
          >
            <span>{isEs ? 'Iniciar Siguiente Oleada' : 'Start Next Wave'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

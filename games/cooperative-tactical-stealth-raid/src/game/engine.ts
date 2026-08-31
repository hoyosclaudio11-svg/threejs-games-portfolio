import {
  Bullet,
  Door,
  Enemy,
  ExtractionZone,
  GameMode,
  LootItem,
  MissionConfig,
  MissionResult,
  OperativeClass,
  Particle,
  PlayerState,
  SecurityCamera,
  SecurityLaser,
  SmokeCloud,
  SyncTerminal,
  TacticalAlert,
  VisionMode,
  Wall
} from '../types/game';
import { OPERATIVES } from './levels';
import { audioManager } from '../services/audio';
import { hapticsManager } from '../services/haptics';

export interface GameInputs {
  p1: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    aimX: number;
    aimY: number;
    shoot: boolean;
    interact: boolean;
    gadget: boolean;
    reload: boolean;
    crouch: boolean;
  };
  p2: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    aimX: number;
    aimY: number;
    shoot: boolean;
    interact: boolean;
    gadget: boolean;
    reload: boolean;
    crouch: boolean;
  };
}

export class TacticalEngine {
  public mission: MissionConfig;
  public gameMode: GameMode;
  public p1Class: OperativeClass;
  public p2Class: OperativeClass;

  public p1: PlayerState;
  public p2: PlayerState;
  public activeControlPlayer: 1 | 2 = 1; // Used for Solo AI swap

  public enemies: Enemy[] = [];
  public cameras: SecurityCamera[] = [];
  public terminals: SyncTerminal[] = [];
  public lasers: SecurityLaser[] = [];
  public doors: Door[] = [];
  public walls: Wall[] = [];
  public loot: LootItem[] = [];
  public extractionZone: ExtractionZone;
  public bullets: Bullet[] = [];
  public particles: Particle[] = [];
  public smokeClouds: SmokeCloud[] = [];

  // Game state meters
  public alarmLevel: number = 0; // 0 to 100
  public isAlarmLockdown: boolean = false;
  public alarmTimer: number = 0;
  public missionTime: number = 0;
  public totalLootExtracted: number = 0;
  public totalScore: number = 0;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;
  public isPaused: boolean = false;
  public visionMode: VisionMode = 'NORMAL';
  public reconActiveTimer: number = 0; // Active recon dart thermal scan

  // Stats tracking
  public stealthKillsCount: number = 0;
  public enemiesDownedCount: number = 0;
  public alarmsTriggeredCount: number = 0;
  public syncHacksCount: number = 0;
  public revivesCount: number = 0;
  public damageTakenTotal: number = 0;

  // Alerts HUD queue
  public alerts: TacticalAlert[] = [];
  private qrfSpawnTimer: number = 0;
  private syncHoldAudioTimer: number = 0;

  constructor(
    mission: MissionConfig,
    gameMode: GameMode,
    p1Class: OperativeClass = 'ghost',
    p2Class: OperativeClass = 'viper'
  ) {
    this.mission = mission;
    this.gameMode = gameMode;
    this.p1Class = p1Class;
    this.p2Class = p2Class;

    const op1Info = OPERATIVES[p1Class];
    const op2Info = OPERATIVES[p2Class];

    this.p1 = {
      id: 1,
      operativeClass: p1Class,
      x: mission.spawnP1.x,
      y: mission.spawnP1.y,
      vx: 0,
      vy: 0,
      angle: 0,
      targetAngle: 0,
      hp: op1Info.maxHp,
      maxHp: op1Info.maxHp,
      armor: op1Info.armor,
      maxArmor: op1Info.armor,
      ammo: op1Info.primaryWeapon.magSize,
      isReloading: false,
      reloadProgress: 0,
      isDowned: false,
      downedTimer: 35,
      reviveProgress: 0,
      isInteracting: false,
      interactingTargetId: null,
      interactionProgress: 0,
      carriedLootValue: 0,
      carriedLootWeight: 0,
      gadgetCount: 3,
      gadgetType: op1Info.gadget,
      lastShotTime: 0,
      isShooting: false,
      isFlashlightOn: true,
      isStealthCrouch: false,
      color: op1Info.avatarColor,
      name: op1Info.name,
    };

    this.p2 = {
      id: 2,
      operativeClass: p2Class,
      x: mission.spawnP2.x,
      y: mission.spawnP2.y,
      vx: 0,
      vy: 0,
      angle: 0,
      targetAngle: 0,
      hp: op2Info.maxHp,
      maxHp: op2Info.maxHp,
      armor: op2Info.armor,
      maxArmor: op2Info.armor,
      ammo: op2Info.primaryWeapon.magSize,
      isReloading: false,
      reloadProgress: 0,
      isDowned: false,
      downedTimer: 35,
      reviveProgress: 0,
      isInteracting: false,
      interactingTargetId: null,
      interactionProgress: 0,
      carriedLootValue: 0,
      carriedLootWeight: 0,
      gadgetCount: 3,
      gadgetType: op2Info.gadget,
      lastShotTime: 0,
      isShooting: false,
      isFlashlightOn: true,
      isStealthCrouch: false,
      color: op2Info.avatarColor,
      name: op2Info.name,
    };

    // Clone mission entities
    this.walls = JSON.parse(JSON.stringify(mission.walls));
    this.doors = JSON.parse(JSON.stringify(mission.doors));
    this.terminals = JSON.parse(JSON.stringify(mission.terminals));
    this.lasers = JSON.parse(JSON.stringify(mission.lasers));
    this.cameras = JSON.parse(JSON.stringify(mission.cameras));
    this.enemies = JSON.parse(JSON.stringify(mission.enemies));
    this.loot = JSON.parse(JSON.stringify(mission.loot));
    this.extractionZone = JSON.parse(JSON.stringify(mission.extractionZone));

    audioManager.startBackgroundTrack(false);
    this.addAlert('INCURSIÓN INICIADA: Coordina con tu compañero para desbloquear el área.', 'info', 4.0);
  }

  public addAlert(text: string, type: 'info' | 'sync' | 'alarm' | 'loot' | 'downed' | 'extraction', duration = 3.5) {
    this.alerts.unshift({
      id: `alert_${Date.now()}_${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
      duration,
    });
    if (this.alerts.length > 5) {
      this.alerts.pop();
    }
  }

  // --- Main Tick Engine (60 FPS) ---
  public update(dt: number, inputs: GameInputs) {
    if (this.isPaused || this.isGameOver || this.isVictory) return;

    const step = Math.min(dt, 0.05);
    this.missionTime += step;

    if (this.reconActiveTimer > 0) {
      this.reconActiveTimer -= step;
    }

    // Update Player 1
    this.updatePlayer(this.p1, inputs.p1, step, 1);

    // Update Player 2 (or AI Buddy in SOLO_AI mode)
    if (this.gameMode === 'COOP_LOCAL') {
      this.updatePlayer(this.p2, inputs.p2, step, 2);
    } else {
      this.updateAIBuddy(step);
    }

    // Update Revive Interaction between players
    this.updateReviveMechanic(step, inputs);

    // Update Sync Terminals
    this.updateSyncTerminals(step);

    // Update Security Cameras
    this.updateCameras(step);

    // Update Lasers
    this.updateLasers(step);

    // Update Enemies & Stealth AI
    this.updateEnemies(step);

    // Update Bullets & Projectiles
    this.updateBullets(step);

    // Update Loot collection
    this.updateLootCollection();

    // Update Extraction zone
    this.updateExtractionZone(step);

    // Update Smoke clouds
    this.updateSmokeClouds(step);

    // Update Particles
    this.updateParticles(step);

    // Update Alarm QRF Reinforcements
    this.updateAlarmAndQRF(step);

    // Check Victory & Defeat conditions
    this.checkEndConditions();
  }

  private updatePlayer(player: PlayerState, input: GameInputs['p1'], dt: number, playerId: 1 | 2) {
    if (player.isDowned) {
      player.downedTimer -= dt;
      if (player.downedTimer <= 0) {
        player.hp = 0;
      }
      return;
    }

    const opInfo = OPERATIVES[player.operativeClass];
    let baseSpeed = opInfo.speed * 60;

    baseSpeed *= Math.max(0.7, 1.0 - player.carriedLootWeight * 0.4);

    if (player.isStealthCrouch) {
      baseSpeed *= 0.6;
    }

    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    player.vx = dx * baseSpeed;
    player.vy = dy * baseSpeed;

    const nextX = player.x + player.vx * dt;
    const nextY = player.y + player.vy * dt;

    if (!this.checkWallCollision(nextX, player.y, 16)) {
      player.x = nextX;
    }
    if (!this.checkWallCollision(player.x, nextY, 16)) {
      player.y = nextY;
    }

    if (input.aimX !== 0 || input.aimY !== 0) {
      player.targetAngle = Math.atan2(input.aimY - player.y, input.aimX - player.x);
    } else if (dx !== 0 || dy !== 0) {
      player.targetAngle = Math.atan2(dy, dx);
    }
    player.angle = this.lerpAngle(player.angle, player.targetAngle, 0.25);

    if (input.reload && player.ammo < opInfo.primaryWeapon.magSize && !player.isReloading) {
      player.isReloading = true;
      player.reloadProgress = 0;
      audioManager.playButtonHover();
    }

    if (player.isReloading) {
      player.reloadProgress += dt / opInfo.primaryWeapon.reloadTime;
      if (player.reloadProgress >= 1) {
        player.ammo = opInfo.primaryWeapon.magSize;
        player.isReloading = false;
        player.reloadProgress = 0;
      }
    }

    if (input.shoot && !player.isReloading && player.ammo > 0) {
      const now = performance.now();
      const fireInterval = 1000 / opInfo.primaryWeapon.fireRate;
      if (now - player.lastShotTime >= fireInterval) {
        player.lastShotTime = now;
        player.ammo--;
        this.firePlayerWeapon(player, opInfo.primaryWeapon, playerId);

        if (player.ammo <= 0) {
          player.isReloading = true;
          player.reloadProgress = 0;
        }
      }
    }

    if (input.gadget && player.gadgetCount > 0) {
      input.gadget = false;
      this.usePlayerGadget(player);
    }

    if (input.interact) {
      this.checkStealthTakedown(player);
    }
  }

  // --- Smart AI Partner in SOLO Mode ---
  private updateAIBuddy(dt: number) {
    const ai = this.p2;
    const leader = this.p1;
    const opInfo = OPERATIVES[ai.operativeClass];

    if (ai.isDowned) {
      ai.downedTimer -= dt;
      return;
    }

    if (leader.isDowned) {
      const distToLeader = Math.hypot(leader.x - ai.x, leader.y - ai.y);
      if (distToLeader > 40) {
        const angle = Math.atan2(leader.y - ai.y, leader.x - ai.x);
        ai.angle = angle;
        const speed = opInfo.speed * 55;
        const nextX = ai.x + Math.cos(angle) * speed * dt;
        const nextY = ai.y + Math.sin(angle) * speed * dt;
        if (!this.checkWallCollision(nextX, ai.y, 16)) ai.x = nextX;
        if (!this.checkWallCollision(ai.x, nextY, 16)) ai.y = nextY;
      } else {
        leader.reviveProgress += dt / 2.0;
        if (leader.reviveProgress >= 1.0) {
          leader.isDowned = false;
          leader.hp = leader.maxHp * 0.6;
          leader.reviveProgress = 0;
          this.revivesCount++;
          audioManager.playRevived();
          hapticsManager.triggerSyncSuccess();
          this.addAlert('¡AGENTE REVIVIDO POR COMPAÑERO IA!', 'info');
        }
      }
      return;
    }

    const activeTerminal = this.terminals.find(t => t.isActivated && !t.isCompleted && t.activeByPlayer === 1);
    if (activeTerminal) {
      const paired = this.terminals.find(t => t.id === activeTerminal.pairedTerminalId);
      if (paired && !paired.isCompleted) {
        const distToPaired = Math.hypot(paired.x - ai.x, paired.y - ai.y);
        if (distToPaired > 30) {
          const angle = Math.atan2(paired.y - ai.y, paired.x - ai.x);
          ai.angle = angle;
          const speed = opInfo.speed * 60;
          const nextX = ai.x + Math.cos(angle) * speed * dt;
          const nextY = ai.y + Math.sin(angle) * speed * dt;
          if (!this.checkWallCollision(nextX, ai.y, 16)) ai.x = nextX;
          if (!this.checkWallCollision(ai.x, nextY, 16)) ai.y = nextY;
        } else {
          this.triggerTerminalSync(paired);
        }
        return;
      }
    }

    const targetEnemy = this.findNearestHostileTarget(ai.x, ai.y, 350);
    if (targetEnemy) {
      const angleToEnemy = Math.atan2(targetEnemy.y - ai.y, targetEnemy.x - ai.x);
      ai.angle = this.lerpAngle(ai.angle, angleToEnemy, 0.3);

      const now = performance.now();
      if (now - ai.lastShotTime >= 350) {
        ai.lastShotTime = now;
        this.firePlayerWeapon(ai, opInfo.primaryWeapon, 2);
      }
    } else {
      const distToLeader = Math.hypot(leader.x - ai.x, leader.y - ai.y);
      const targetDist = 75;

      if (distToLeader > targetDist + 20) {
        const offsetAngle = leader.angle + Math.PI * 0.8;
        const targetX = leader.x + Math.cos(offsetAngle) * targetDist;
        const targetY = leader.y + Math.sin(offsetAngle) * targetDist;

        const moveAngle = Math.atan2(targetY - ai.y, targetX - ai.x);
        ai.angle = this.lerpAngle(ai.angle, leader.angle, 0.2);

        const speed = opInfo.speed * (distToLeader > 200 ? 70 : 55);
        const nextX = ai.x + Math.cos(moveAngle) * speed * dt;
        const nextY = ai.y + Math.sin(moveAngle) * speed * dt;

        if (!this.checkWallCollision(nextX, ai.y, 16)) ai.x = nextX;
        if (!this.checkWallCollision(ai.x, nextY, 16)) ai.y = nextY;
      } else {
        ai.angle = this.lerpAngle(ai.angle, leader.angle + Math.PI, 0.1);
      }
    }
  }

  // --- Weapon Shooting & Gadget Mechanics ---
  private firePlayerWeapon(player: PlayerState, weapon: typeof OPERATIVES['ghost']['primaryWeapon'], playerId: 1 | 2) {
    const spreadAngle = (Math.random() * 2 - 1) * weapon.spread;
    const finalAngle = player.angle + spreadAngle;

    const muzzleDist = 20;
    const bulletX = player.x + Math.cos(player.angle) * muzzleDist;
    const bulletY = player.y + Math.sin(player.angle) * muzzleDist;

    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: bulletX,
      y: bulletY,
      vx: Math.cos(finalAngle) * weapon.bulletSpeed * 60,
      vy: Math.sin(finalAngle) * weapon.bulletSpeed * 60,
      damage: weapon.damage,
      ownerType: 'player',
      ownerId: playerId,
      color: weapon.color,
      isSilenced: weapon.isSilenced,
      lifetime: weapon.range / (weapon.bulletSpeed * 60),
    };

    this.bullets.push(bullet);
    this.createMuzzleFlash(bulletX, bulletY, player.angle, weapon.color);
    this.createShellCasing(player.x, player.y, player.angle - Math.PI / 2);

    if (weapon.isSilenced) {
      audioManager.playSilencedShot();
      hapticsManager.triggerShot(true);
    } else {
      audioManager.playLoudShot();
      hapticsManager.triggerShot(false);
      this.triggerNoiseAlert(player.x, player.y, 420);
    }
  }

  private usePlayerGadget(player: PlayerState) {
    player.gadgetCount--;
    const gadgetType = player.gadgetType;

    if (gadgetType === 'smoke_grenade') {
      const throwDist = 120;
      const targetX = player.x + Math.cos(player.angle) * throwDist;
      const targetY = player.y + Math.sin(player.angle) * throwDist;

      this.smokeClouds.push({
        id: `smoke_${Date.now()}`,
        x: targetX,
        y: targetY,
        radius: 110,
        duration: 9.0,
        maxDuration: 9.0,
      });

      audioManager.playSmokeGrenade();
      this.addAlert('¡GRANADA DE HUMO DESPLEGADA!', 'info');
      for (let i = 0; i < 24; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 20 + Math.random() * 40;
        this.particles.push({
          x: targetX,
          y: targetY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 15 + Math.random() * 25,
          color: '#94a3b8',
          life: 3.5,
          maxLife: 3.5,
          type: 'dust',
          alpha: 0.7,
        });
      }
    } else if (gadgetType === 'emp_charge') {
      audioManager.playEmpExplosion();
      hapticsManager.triggerExplosion();
      this.addAlert('¡PULSO EMP ACTIVADO! Cámaras y láseres deshabilitados', 'sync');

      this.cameras.forEach(c => {
        c.isHacked = true;
        c.hackTimer = 10;
      });
      this.lasers.forEach(l => {
        l.isActive = false;
      });

      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2;
        this.particles.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(ang) * 180,
          vy: Math.sin(ang) * 180,
          size: 8,
          color: '#38bdf8',
          life: 0.6,
          maxLife: 0.6,
          type: 'emp',
        });
      }
    } else if (gadgetType === 'breach_c4') {
      audioManager.playEmpExplosion();
      hapticsManager.triggerExplosion();
      this.addAlert('¡CARGA C4 DETONADA!', 'alarm');

      this.doors.forEach(d => {
        if (Math.hypot(d.x - player.x, d.y - player.y) < 180) {
          d.isLocked = false;
          d.isOpen = true;
        }
      });
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - player.x, e.y - player.y) < 220) {
          e.hp -= 150;
          e.isStunned = true;
          e.stunTimer = 4.0;
        }
      });
    } else if (gadgetType === 'recon_dart') {
      this.reconActiveTimer = 12.0;
      audioManager.playSyncSuccess();
      this.addAlert('¡DARDO DE RECONOCIMIENTO ACTIVO! Enemigos revelados', 'info');
    }
  }

  // --- Revive Mechanic ---
  private updateReviveMechanic(dt: number, inputs: GameInputs) {
    const dist = Math.hypot(this.p1.x - this.p2.x, this.p1.y - this.p2.y);
    const reviveRange = 55;

    if (this.p2.isDowned && !this.p1.isDowned && dist < reviveRange) {
      if (inputs.p1.interact) {
        this.p2.reviveProgress += dt / 2.2;
        if (this.p2.reviveProgress >= 1.0) {
          this.p2.isDowned = false;
          this.p2.hp = this.p2.maxHp * 0.6;
          this.p2.reviveProgress = 0;
          this.revivesCount++;
          audioManager.playRevived();
          hapticsManager.triggerSyncSuccess();
          this.addAlert('¡AGENTE 2 REANIMADO CON ÉXITO!', 'sync');
        }
      } else {
        this.p2.reviveProgress = Math.max(0, this.p2.reviveProgress - dt * 0.5);
      }
    }

    if (this.p1.isDowned && !this.p2.isDowned && dist < reviveRange) {
      if (inputs.p2.interact) {
        this.p1.reviveProgress += dt / 2.2;
        if (this.p1.reviveProgress >= 1.0) {
          this.p1.isDowned = false;
          this.p1.hp = this.p1.maxHp * 0.6;
          this.p1.reviveProgress = 0;
          this.revivesCount++;
          audioManager.playRevived();
          hapticsManager.triggerSyncSuccess();
          this.addAlert('¡AGENTE 1 REANIMADO CON ÉXITO!', 'sync');
        }
      } else {
        this.p1.reviveProgress = Math.max(0, this.p1.reviveProgress - dt * 0.5);
      }
    }
  }

  // --- Stealth Takedowns ---
  private checkStealthTakedown(player: PlayerState) {
    const takedownRange = 45;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < takedownRange) {
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        let angleDiff = Math.abs(enemy.angle - angleToPlayer);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        if (angleDiff > Math.PI / 2 || enemy.isStunned) {
          enemy.hp = 0;
          enemy.state = 'dead';
          this.stealthKillsCount++;
          this.enemiesDownedCount++;
          this.totalScore += 2000;
          audioManager.playTakedown();
          hapticsManager.triggerSyncSuccess();
          this.addAlert('¡ELIMINACIÓN SIGILOSA CONFIRMADA (+2,000 PTS)!', 'sync');

          for (let i = 0; i < 8; i++) {
            const ang = Math.random() * Math.PI * 2;
            this.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(ang) * 40,
              vy: Math.sin(ang) * 40,
              size: 4,
              color: '#dc2626',
              life: 0.8,
              maxLife: 0.8,
              type: 'blood',
            });
          }
          break;
        }
      }
    }
  }

  // --- Synchronized Dual Terminals ---
  public interactTerminal(player: PlayerState, terminal: SyncTerminal) {
    if (terminal.isCompleted) return;

    const partnerId = player.id === 1 ? 2 : 1;
    const paired = this.terminals.find(t => t.id === terminal.pairedTerminalId);

    if (paired && paired.isActivated && paired.activeByPlayer === partnerId) {
      this.triggerTerminalSync(terminal);
      return;
    }

    terminal.isActivated = true;
    terminal.activeByPlayer = player.id;
    terminal.activatedTime = this.missionTime;

    audioManager.playSyncTerminalHold(1.2);
    hapticsManager.triggerLoot();
    this.addAlert(
      `¡TERMINAL ${terminal.label} ACTIVADA! COMPAÑERO TIENE ${terminal.syncWindowSeconds}s PARA SINCRONIZAR!`,
      'sync',
      3.5
    );
  }

  private triggerTerminalSync(terminal: SyncTerminal) {
    const paired = this.terminals.find(t => t.id === terminal.pairedTerminalId);

    terminal.isCompleted = true;
    terminal.isActivated = false;
    if (paired) {
      paired.isCompleted = true;
      paired.isActivated = false;
    }

    const group = terminal.group;
    this.lasers.forEach(laser => {
      if (laser.controlledByTerminalGroup === group) {
        laser.isActive = false;
      }
    });

    this.doors.forEach(door => {
      if (door.unlockedByTerminalGroup === group) {
        door.isLocked = false;
        door.isOpen = true;
      }
    });

    const syncObj = this.mission.objectives.find(o => o.id.includes('sync'));
    if (syncObj) syncObj.isCompleted = true;

    this.syncHacksCount++;
    this.totalScore += 5000;

    audioManager.playSyncSuccess();
    hapticsManager.triggerSyncSuccess();
    this.addAlert('¡SINCRONIZACIÓN EXITOSA! BARRERAS LÁSER DESACTIVADAS (+5,000 PTS)', 'sync', 4.0);

    const termList = [terminal, paired].filter((t): t is SyncTerminal => t !== undefined);
    termList.forEach(t => {
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 80;
        this.particles.push({
          x: t.x,
          y: t.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 4,
          color: '#10b981',
          life: 0.7,
          maxLife: 0.7,
          type: 'spark',
        });
      }
    });
  }

  private updateSyncTerminals(dt: number) {
    this.syncHoldAudioTimer += dt;
    this.terminals.forEach(terminal => {
      if (terminal.isActivated && !terminal.isCompleted) {
        const elapsed = this.missionTime - terminal.activatedTime;
        terminal.progress = Math.max(0, 1.0 - elapsed / terminal.syncWindowSeconds);

        if (this.syncHoldAudioTimer >= 0.35) {
          audioManager.playSyncTerminalHold(1.0 + elapsed * 0.4);
        }

        if (elapsed >= terminal.syncWindowSeconds) {
          terminal.isActivated = false;
          terminal.activeByPlayer = null;
          terminal.progress = 0;
          this.addAlert('FALLO DE SINCRONIZACIÓN: Tiempo agotado. Vuelve a intentarlo.', 'alarm', 3.0);
        }
      }
    });

    if (this.syncHoldAudioTimer >= 0.35) {
      this.syncHoldAudioTimer = 0;
    }
  }

  // --- Security Cameras & Lasers ---
  private updateCameras(dt: number) {
    this.cameras.forEach(cam => {
      if (cam.isHacked) {
        cam.hackTimer -= dt;
        if (cam.hackTimer <= 0) {
          cam.isHacked = false;
        }
        return;
      }

      cam.angle = cam.baseAngle + Math.sin(this.missionTime * cam.sweepSpeed) * (cam.sweepAngle / 2);

      let detectedPlayer: PlayerState | null = null;
      for (const player of [this.p1, this.p2]) {
        if (player.isDowned) continue;
        if (this.isPointInsideSmoke(player.x, player.y)) continue;

        const dist = Math.hypot(player.x - cam.x, player.y - cam.y);
        if (dist <= cam.viewDistance) {
          const angleToP = Math.atan2(player.y - cam.y, player.x - cam.x);
          let diff = Math.abs(cam.angle - angleToP);
          while (diff > Math.PI) diff -= Math.PI * 2;
          diff = Math.abs(diff);

          if (diff <= cam.viewFov / 2) {
            if (!this.checkLineOfSightBlocked(cam.x, cam.y, player.x, player.y)) {
              detectedPlayer = player;
              break;
            }
          }
        }
      }

      if (detectedPlayer) {
        const dp: PlayerState = detectedPlayer;
        cam.detectionLevel = Math.min(100, cam.detectionLevel + dt * 140);
        cam.detectionTarget = { x: dp.x, y: dp.y };

        if (cam.detectionLevel >= 100 && !this.isAlarmLockdown) {
          this.triggerAlarmLockdown('CÁMARA DE SEGURIDAD DETECTÓ INTRUSOS');
        }
      } else {
        cam.detectionLevel = Math.max(0, cam.detectionLevel - dt * 45);
      }
    });
  }

  private updateLasers(dt: number) {
    this.lasers.forEach(laser => {
      if (!laser.isActive) return;

      [this.p1, this.p2].forEach(p => {
        if (p.isDowned) return;
        const dist = this.distToSegment(p.x, p.y, laser.x1, laser.y1, laser.x2, laser.y2);
        if (dist < 18) {
          p.hp -= 20 * dt * 60;
          audioManager.playLaserTrip();
          hapticsManager.triggerAlarmTrip();

          if (!this.isAlarmLockdown) {
            this.triggerAlarmLockdown('¡BARRERA LÁSER DISPARADA!');
          }
        }
      });
    });
  }

  // --- Enemies & Stealth AI State Machine ---
  private updateEnemies(dt: number) {
    this.enemies.forEach(enemy => {
      if (enemy.hp <= 0) {
        enemy.state = 'dead';
        return;
      }

      if (enemy.isStunned) {
        enemy.stunTimer -= dt;
        if (enemy.stunTimer <= 0) {
          enemy.isStunned = false;
        }
        return;
      }

      let spottedPlayer: PlayerState | null = null;
      for (const player of [this.p1, this.p2]) {
        if (player.isDowned) continue;
        if (this.isPointInsideSmoke(player.x, player.y)) continue;

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist <= enemy.viewDistance) {
          const angleToP = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          let diff = Math.abs(enemy.angle - angleToP);
          while (diff > Math.PI) diff -= Math.PI * 2;
          diff = Math.abs(diff);

          if (diff <= enemy.viewAngle / 2) {
            if (!this.checkLineOfSightBlocked(enemy.x, enemy.y, player.x, player.y)) {
              spottedPlayer = player;
              break;
            }
          }
        }
      }

      if (spottedPlayer) {
        const sp: PlayerState = spottedPlayer;
        enemy.detectionLevel = Math.min(100, enemy.detectionLevel + dt * (this.isAlarmLockdown ? 250 : 160));
        enemy.investigatePos = { x: sp.x, y: sp.y };
        enemy.targetPlayerId = sp.id;

        if (enemy.detectionLevel >= 100) {
          if (enemy.state !== 'combat') {
            enemy.state = 'combat';
            if (!this.isAlarmLockdown) {
              this.triggerAlarmLockdown('¡GUARDIA DIO LA ALARMA!');
            }
          }
        } else {
          enemy.state = 'suspicious';
          enemy.angle = Math.atan2(sp.y - enemy.y, sp.x - enemy.x);
        }
      } else {
        if (enemy.state !== 'combat' && !this.isAlarmLockdown) {
          enemy.detectionLevel = Math.max(0, enemy.detectionLevel - dt * 40);
          if (enemy.detectionLevel === 0 && enemy.state === 'suspicious') {
            enemy.state = 'patrol';
          }
        }
      }

      if (enemy.state === 'combat') {
        const p1Alive = !this.p1.isDowned;
        const p2Alive = !this.p2.isDowned;
        let target: PlayerState | null = null;
        if (p1Alive && p2Alive) {
          const d1 = Math.hypot(this.p1.x - enemy.x, this.p1.y - enemy.y);
          const d2 = Math.hypot(this.p2.x - enemy.x, this.p2.y - enemy.y);
          target = d1 < d2 ? this.p1 : this.p2;
        } else if (p1Alive) {
          target = this.p1;
        } else if (p2Alive) {
          target = this.p2;
        }

        if (target) {
          const angleToTarget = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          enemy.angle = this.lerpAngle(enemy.angle, angleToTarget, 0.15);

          const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);

          if (dist > 160) {
            const speed = enemy.speed * 60;
            const nextX = enemy.x + Math.cos(enemy.angle) * speed * dt;
            const nextY = enemy.y + Math.sin(enemy.angle) * speed * dt;
            if (!this.checkWallCollision(nextX, enemy.y, 16)) enemy.x = nextX;
            if (!this.checkWallCollision(enemy.x, nextY, 16)) enemy.y = nextY;
          }

          const now = performance.now();
          const fireInterval = 1000 / enemy.weapon.fireRate;
          if (now - enemy.lastShotTime >= fireInterval) {
            if (!this.checkLineOfSightBlocked(enemy.x, enemy.y, target.x, target.y)) {
              enemy.lastShotTime = now;
              this.fireEnemyWeapon(enemy, target);
            }
          }
        }
      } else if (enemy.state === 'suspicious') {
        if (enemy.investigatePos) {
          const angle = Math.atan2(enemy.investigatePos.y - enemy.y, enemy.investigatePos.x - enemy.x);
          enemy.angle = this.lerpAngle(enemy.angle, angle, 0.12);
          const speed = enemy.speed * 40;
          const nextX = enemy.x + Math.cos(angle) * speed * dt;
          const nextY = enemy.y + Math.sin(angle) * speed * dt;
          if (!this.checkWallCollision(nextX, enemy.y, 16)) enemy.x = nextX;
          if (!this.checkWallCollision(enemy.x, nextY, 16)) enemy.y = nextY;
        }
      } else if (enemy.state === 'patrol') {
        if (enemy.patrolPoints && enemy.patrolPoints.length > 1) {
          const targetPt = enemy.patrolPoints[enemy.currentPatrolIdx];
          const distToPt = Math.hypot(targetPt.x - enemy.x, targetPt.y - enemy.y);

          if (distToPt < 15) {
            enemy.currentPatrolIdx = (enemy.currentPatrolIdx + 1) % enemy.patrolPoints.length;
          } else {
            const angle = Math.atan2(targetPt.y - enemy.y, targetPt.x - enemy.x);
            enemy.angle = this.lerpAngle(enemy.angle, angle, 0.1);
            const speed = enemy.speed * 45;
            const nextX = enemy.x + Math.cos(angle) * speed * dt;
            const nextY = enemy.y + Math.sin(angle) * speed * dt;
            if (!this.checkWallCollision(nextX, enemy.y, 16)) enemy.x = nextX;
            if (!this.checkWallCollision(enemy.x, nextY, 16)) enemy.y = nextY;
          }
        }
      }
    });
  }

  private fireEnemyWeapon(enemy: Enemy, target: PlayerState) {
    const spread = (Math.random() * 2 - 1) * enemy.weapon.spread;
    const baseAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const finalAngle = baseAngle + spread;

    const bullet: Bullet = {
      id: `bullet_e_${Date.now()}_${Math.random()}`,
      x: enemy.x + Math.cos(enemy.angle) * 20,
      y: enemy.y + Math.sin(enemy.angle) * 20,
      vx: Math.cos(finalAngle) * enemy.weapon.bulletSpeed * 60,
      vy: Math.sin(finalAngle) * enemy.weapon.bulletSpeed * 60,
      damage: enemy.weapon.damage,
      ownerType: 'enemy',
      ownerId: enemy.id,
      color: enemy.weapon.color,
      isSilenced: false,
      lifetime: enemy.weapon.range / (enemy.weapon.bulletSpeed * 60),
    };

    this.bullets.push(bullet);
    this.createMuzzleFlash(bullet.x, bullet.y, enemy.angle, enemy.weapon.color);
    audioManager.playLoudShot();
  }

  // --- Projectile Physics & Collisions ---
  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.lifetime -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (this.checkWallCollision(b.x, b.y, 4)) {
        this.createHitSparks(b.x, b.y, '#fbbf24');
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.ownerType === 'enemy') {
        const targets = [this.p1, this.p2];
        let hit = false;
        for (const p of targets) {
          if (p.isDowned) continue;
          if (Math.hypot(p.x - b.x, p.y - b.y) < 18) {
            const damage = b.damage;
            this.damageTakenTotal += damage;
            hapticsManager.triggerDamageTaken();

            if (p.armor > 0) {
              const armorAbsorb = Math.min(p.armor, damage * 0.7);
              p.armor -= armorAbsorb;
              p.hp -= (damage - armorAbsorb);
            } else {
              p.hp -= damage;
            }

            this.createHitSparks(b.x, b.y, '#ef4444');

            if (p.hp <= 0) {
              p.hp = 0;
              p.isDowned = true;
              p.downedTimer = 35;
              p.reviveProgress = 0;
              audioManager.playDownedAlert();
              hapticsManager.triggerDowned();
              this.addAlert(`¡AGENTE ${p.id} INCAPACITADO! Acércate para reanimarlo.`, 'downed', 5.0);
            }

            this.bullets.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }

      if (b.ownerType === 'player') {
        let hit = false;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(e.x - b.x, e.y - b.y) < 20) {
            e.hp -= b.damage;
            this.createHitSparks(b.x, b.y, '#ef4444');

            for (let k = 0; k < 4; k++) {
              const ang = Math.random() * Math.PI * 2;
              this.particles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(ang) * 35,
                vy: Math.sin(ang) * 35,
                size: 3.5,
                color: '#dc2626',
                life: 0.5,
                maxLife: 0.5,
                type: 'blood',
              });
            }

            if (e.hp <= 0) {
              e.hp = 0;
              e.state = 'dead';
              this.enemiesDownedCount++;
              this.totalScore += 1000;
              audioManager.playTakedown();
            } else {
              e.state = 'combat';
              e.detectionLevel = 100;
              e.investigatePos = { x: b.x, y: b.y };
            }

            this.bullets.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }

      if (b.lifetime <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  // --- Loot & Extraction Systems ---
  private updateLootCollection() {
    this.loot.forEach(item => {
      if (item.isCollected) return;

      [this.p1, this.p2].forEach(player => {
        if (player.isDowned) return;
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < 32) {
          item.isCollected = true;
          player.carriedLootValue += item.value;
          player.carriedLootWeight += item.weight;
          this.totalLootExtracted += item.value;
          this.totalScore += item.value / 10;

          audioManager.playLootCollect();
          hapticsManager.triggerLoot();

          if (item.isPrimaryObjective) {
            const primObj = this.mission.objectives.find(o => o.id.includes('core') || o.id.includes('vial') || o.id.includes('proto'));
            if (primObj) primObj.isCompleted = true;
            this.addAlert(`¡OBJETIVO PRINCIPAL ASEGURADO: ${item.name}!`, 'loot', 5.0);
          } else {
            this.addAlert(`BOTÍN RECOGIDO: +$${item.value.toLocaleString()}`, 'loot', 2.5);
          }
        }
      });
    });
  }

  private updateExtractionZone(dt: number) {
    const lz = this.extractionZone;
    if (!lz.isActive) return;

    const p1In = !this.p1.isDowned &&
      this.p1.x >= lz.x && this.p1.x <= lz.x + lz.width &&
      this.p1.y >= lz.y && this.p1.y <= lz.y + lz.height;

    const p2In = !this.p2.isDowned &&
      this.p2.x >= lz.x && this.p2.x <= lz.x + lz.width &&
      this.p2.y >= lz.y && this.p2.y <= lz.y + lz.height;

    if (p1In && p2In) {
      lz.evacProgress += (dt / lz.evacRequiredSeconds) * 100;
      if (lz.evacProgress >= 100) {
        this.triggerVictory();
      }
    } else {
      lz.evacProgress = Math.max(0, lz.evacProgress - dt * 25);
    }
  }

  // --- Alarms & Armed Response (QRF) ---
  public triggerAlarmLockdown(reason: string) {
    if (this.isAlarmLockdown) return;
    this.isAlarmLockdown = true;
    this.alarmLevel = 100;
    this.alarmsTriggeredCount++;

    audioManager.updateMusicState(true);
    hapticsManager.triggerAlarmTrip();
    this.addAlert(`¡ALARMA GENERAL ACTIVADA! ${reason} - RESPUESTA SWAT EN CAMINO`, 'alarm', 6.0);

    this.enemies.forEach(e => {
      if (e.hp > 0) {
        e.state = 'combat';
        e.detectionLevel = 100;
      }
    });
  }

  private updateAlarmAndQRF(dt: number) {
    if (!this.isAlarmLockdown) return;

    this.alarmTimer += dt;
    this.qrfSpawnTimer += dt;

    if (this.qrfSpawnTimer >= this.mission.qrfSpawnInterval) {
      this.qrfSpawnTimer = 0;
      this.spawnQRFWave();
    }
  }

  private spawnQRFWave() {
    this.addAlert('¡REFUERZOS SWAT ENTRAN AL PERÍMETRO!', 'alarm', 3.5);
    const spawnPoints = [
      { x: 60, y: 460 },
      { x: 60, y: 540 },
    ];

    spawnPoints.forEach((sp, idx) => {
      const swat: Enemy = {
        id: `qrf_${Date.now()}_${idx}`,
        type: 'swat_enforcer',
        x: sp.x,
        y: sp.y,
        vx: 0,
        vy: 0,
        angle: 0,
        hp: 120,
        maxHp: 120,
        state: 'combat',
        stateTimer: 0,
        speed: 2.1,
        viewDistance: 280,
        viewAngle: Math.PI / 2.8,
        patrolPoints: [],
        currentPatrolIdx: 0,
        investigatePos: { x: this.p1.x, y: this.p1.y },
        targetPlayerId: 1,
        lastShotTime: 0,
        detectionLevel: 100,
        isStunned: false,
        stunTimer: 0,
        color: '#ef4444',
        weapon: {
          name: 'Tactical SWAT SMG',
          type: 'smg_silenced',
          damage: 16,
          fireRate: 6.0,
          range: 360,
          magSize: 30,
          reloadTime: 2.0,
          isSilenced: false,
          spread: 0.1,
          bulletSpeed: 18,
          color: '#f87171',
        },
      };
      this.enemies.push(swat);
    });
  }

  public triggerNoiseAlert(x: number, y: number, radius: number) {
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= radius) {
        if (e.state === 'patrol') {
          e.state = 'suspicious';
          e.investigatePos = { x, y };
          e.detectionLevel = Math.max(e.detectionLevel, 60);
        }
      }
    });
  }

  // --- End Conditions ---
  private checkEndConditions() {
    if (this.p1.isDowned && this.p2.isDowned) {
      this.triggerDefeat('AMBOS AGENTES INCAPACITADOS EN COMBATE');
    }
  }

  private triggerVictory() {
    if (this.isVictory || this.isGameOver) return;
    this.isVictory = true;
    audioManager.playExtractionReady();
    audioManager.stopBackgroundTrack();
    this.addAlert('¡EXTRACCIÓN COMPLETADA CON ÉXITO! MISIÓN CUMPLIDA', 'extraction', 8.0);
  }

  private triggerDefeat(reason: string) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    audioManager.stopBackgroundTrack();
    this.addAlert(`MISIÓN FALLIDA: ${reason}`, 'downed', 8.0);
  }

  public calculateMissionResult(): MissionResult {
    const success = this.isVictory;
    let score = this.totalScore;

    if (this.alarmsTriggeredCount === 0) score += 12000;
    score += this.stealthKillsCount * 2500;
    score += Math.max(0, Math.floor((this.mission.timeLimitSeconds - this.missionTime) * 80));

    let grade: MissionResult['grade'] = 'D';
    if (!success) {
      grade = 'F';
    } else if (this.alarmsTriggeredCount === 0 && score >= 40000) {
      grade = 'S+';
    } else if (this.alarmsTriggeredCount === 0 || score >= 32000) {
      grade = 'S';
    } else if (score >= 24000) {
      grade = 'A';
    } else if (score >= 16000) {
      grade = 'B';
    } else if (score >= 8000) {
      grade = 'C';
    }

    return {
      missionId: this.mission.id,
      missionName: this.mission.name,
      timestamp: Date.now(),
      success,
      score,
      grade,
      lootCollected: this.totalLootExtracted,
      timeTaken: this.missionTime,
      enemiesDowned: this.enemiesDownedCount,
      stealthKills: this.stealthKillsCount,
      alarmsTriggered: this.alarmsTriggeredCount,
      syncHacksCompleted: this.syncHacksCount,
      revivesCount: this.revivesCount,
      damageTaken: Math.floor(this.damageTakenTotal),
      gameMode: this.gameMode,
    };
  }

  // --- Particles & VFX ---
  private createMuzzleFlash(x: number, y: number, angle: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * 30,
      vy: Math.sin(angle) * 30,
      size: 10,
      color,
      life: 0.08,
      maxLife: 0.08,
      type: 'flash',
    });
  }

  private createShellCasing(x: number, y: number, angle: number) {
    const spd = 40 + Math.random() * 20;
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      size: 3,
      color: '#facc15',
      life: 1.2,
      maxLife: 1.2,
      type: 'casing',
    });
  }

  private createHitSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 3,
        color,
        life: 0.25,
        maxLife: 0.25,
        type: 'spark',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateSmokeClouds(dt: number) {
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const sc = this.smokeClouds[i];
      sc.duration -= dt;
      if (sc.duration <= 0) {
        this.smokeClouds.splice(i, 1);
      }
    }
  }

  // --- Geometry & Collision Math Helpers ---
  public checkWallCollision(x: number, y: number, radius: number): boolean {
    if (x - radius < 0 || x + radius > this.mission.mapWidth || y - radius < 0 || y + radius > this.mission.mapHeight) {
      return true;
    }

    for (const w of this.walls) {
      if (
        x + radius > w.x &&
        x - radius < w.x + w.width &&
        y + radius > w.y &&
        y - radius < w.y + w.height
      ) {
        return true;
      }
    }

    for (const d of this.doors) {
      if (d.isLocked && !d.isOpen) {
        if (
          x + radius > d.x &&
          x - radius < d.x + d.width &&
          y + radius > d.y &&
          y - radius < d.y + d.height
        ) {
          return true;
        }
      }
    }

    return false;
  }

  public checkLineOfSightBlocked(x1: number, y1: number, x2: number, y2: number): boolean {
    for (const w of this.walls) {
      if (this.lineIntersectsRect(x1, y1, x2, y2, w.x, w.y, w.width, w.height)) {
        return true;
      }
    }
    for (const d of this.doors) {
      if (d.isLocked && !d.isOpen) {
        if (this.lineIntersectsRect(x1, y1, x2, y2, d.x, d.y, d.width, d.height)) {
          return true;
        }
      }
    }
    return false;
  }

  public isPointInsideSmoke(x: number, y: number): boolean {
    return this.smokeClouds.some(sc => Math.hypot(sc.x - x, sc.y - y) <= sc.radius);
  }

  private lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number): boolean {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) return false;

    return (
      this.linesIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
      this.linesIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
      this.linesIntersect(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
      this.linesIntersect(x1, y1, x2, y2, rx, ry + rh, rx, ry)
    );
  }

  private linesIntersect(a1x: number, a1y: number, a2x: number, a2y: number, b1x: number, b1y: number, b2x: number, b2y: number): boolean {
    const denom = (b2y - b1y) * (a2x - a1x) - (b2x - b1x) * (a2y - a1y);
    if (denom === 0) return false;
    const ua = ((b2x - b1x) * (a1y - b1y) - (b2y - b1y) * (a1x - b1x)) / denom;
    const ub = ((a2x - a1x) * (a1y - b1y) - (a2y - a1y) * (a1x - b1x)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }

  private findNearestHostileTarget(x: number, y: number, range: number): Enemy | null {
    let bestDist = range;
    let bestEnemy: Enemy | null = null;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < bestDist && (e.state === 'combat' || e.state === 'alert' || this.isAlarmLockdown)) {
        if (!this.checkLineOfSightBlocked(x, y, e.x, e.y)) {
          bestDist = dist;
          bestEnemy = e;
        }
      }
    }
    return bestEnemy;
  }
}

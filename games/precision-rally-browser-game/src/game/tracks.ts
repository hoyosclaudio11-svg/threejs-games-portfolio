import { TrackStage, SplinePoint, PaceNote, Sector, StageObstacle, SurfaceType } from '../types/game';

type HazardType = 'cliff' | 'trees' | 'snowbank' | 'rock' | 'barrier' | 'water';

type SplineTuple = [
  x: number,
  y: number,
  width: number,
  surface: SurfaceType,
  elevation?: number,
  hazardLeft?: HazardType,
  hazardRight?: HazardType
];

// Helper to generate smooth curve points with elevation and surface variations
function createSpline(coords: SplineTuple[]): SplinePoint[] {
  return coords.map(([x, y, width, surface, elevation = 0, hazardLeft, hazardRight]) => ({
    x,
    y,
    width,
    surface,
    elevation,
    hazardLeft,
    hazardRight,
  }));
}

// 1. MONTE CARLO - COL DE TURINI (Snow, Ice & Tarmac Hairpins on Mountain Pass)
const monteCarloPoints = createSpline([
  [0, 0, 18, 'tarmac', 0, 'rock', 'barrier'],
  [0, -180, 18, 'tarmac', 5, 'rock', 'cliff'],
  [20, -320, 16, 'ice', 10, 'rock', 'cliff'],
  [70, -420, 15, 'ice', 15, 'snowbank', 'cliff'],
  // First Hairpin Right
  [140, -480, 17, 'ice', 18, 'snowbank', 'cliff'],
  [210, -480, 18, 'snow', 20, 'rock', 'snowbank'],
  [250, -420, 16, 'snow', 22, 'rock', 'snowbank'],
  // Hairpin Left into tight climb
  [250, -310, 15, 'snow', 28, 'snowbank', 'cliff'],
  [200, -220, 16, 'snow', 34, 'rock', 'snowbank'],
  [120, -170, 16, 'ice', 40, 'rock', 'cliff'],
  // Fast S-bend
  [40, -140, 17, 'tarmac', 44, 'rock', 'cliff'],
  [-70, -130, 18, 'tarmac', 47, 'snowbank', 'barrier'],
  [-180, -150, 18, 'tarmac', 50, 'snowbank', 'barrier'],
  [-290, -180, 17, 'ice', 52, 'snowbank', 'cliff'],
  // Tight Hairpin Right around cliff
  [-390, -230, 16, 'ice', 55, 'snowbank', 'cliff'],
  [-440, -320, 15, 'snow', 60, 'rock', 'cliff'],
  [-430, -430, 16, 'snow', 65, 'rock', 'snowbank'],
  [-360, -510, 17, 'snow', 70, 'snowbank', 'cliff'],
  // High mountain crest
  [-250, -560, 18, 'ice', 85, 'snowbank', 'cliff'], // CREST
  [-110, -590, 18, 'ice', 80, 'rock', 'cliff'],
  [40, -600, 17, 'tarmac', 75, 'rock', 'cliff'],
  // Downhill fast chicane
  [180, -630, 18, 'tarmac', 68, 'rock', 'barrier'],
  [310, -680, 17, 'ice', 58, 'snowbank', 'cliff'],
  [410, -750, 16, 'ice', 50, 'snowbank', 'cliff'],
  // Double Hairpin finish section
  [460, -840, 16, 'snow', 42, 'rock', 'cliff'],
  [430, -940, 15, 'snow', 35, 'snowbank', 'cliff'],
  [330, -990, 16, 'ice', 28, 'rock', 'cliff'],
  [200, -1010, 17, 'ice', 20, 'rock', 'snowbank'],
  [60, -1020, 18, 'tarmac', 15, 'barrier', 'cliff'],
  [-80, -1040, 18, 'tarmac', 10, 'barrier', 'snowbank'],
  [-220, -1070, 20, 'tarmac', 5, 'barrier', 'barrier'],
  [-360, -1110, 22, 'tarmac', 0, 'barrier', 'barrier'],
]);

const monteCarloPaceNotes: PaceNote[] = [
  { distanceMeters: 40, type: 'straight', severity: 6, text: 'Flat straight 100m' },
  { distanceMeters: 140, type: 'caution', severity: 3, modifier: 'slippery', text: 'Caution ICE - Left 3' },
  { distanceMeters: 280, type: 'hairpin_right', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Right - Handbrake!' },
  { distanceMeters: 430, type: 'hairpin_left', severity: 1, modifier: 'tightens', text: 'Hairpin Left uphill - Don\'t Cut' },
  { distanceMeters: 590, type: 'right', severity: 4, modifier: 'opens', text: 'Right 4 into Tarmac' },
  { distanceMeters: 780, type: 'caution', severity: 2, modifier: 'slippery', text: 'Caution ICE into Sharp Right 2' },
  { distanceMeters: 920, type: 'hairpin_right', severity: 1, modifier: 'dont_cut', text: 'Hairpin Right over snow' },
  { distanceMeters: 1100, type: 'crest', severity: 5, modifier: 'over_crest', text: 'Flat over Crest - Summit!' },
  { distanceMeters: 1260, type: 'chicane', severity: 3, modifier: 'slippery', text: 'Downhill Ice Chicane - Left into Right' },
  { distanceMeters: 1420, type: 'hairpin_left', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Left into Final Sector' },
  { distanceMeters: 1560, type: 'left', severity: 5, modifier: 'cut', text: 'Left 5 Flat out to FINISH!' },
];

const monteCarloSectors: Sector[] = [
  { id: 1, distanceMeters: 480, name: 'Sector 1 - Lower Switchbacks', targetTimeSeconds: 22.5 },
  { id: 2, distanceMeters: 1080, name: 'Sector 2 - Summit Crest', targetTimeSeconds: 46.0 },
  { id: 3, distanceMeters: 1680, name: 'Sector 3 - Turini Finish', targetTimeSeconds: 68.0 },
];

// 2. FINLAND - OUNINPOHJA (High-speed gravel, giant crest jumps & fast forest sweeps)
const finlandPoints = createSpline([
  [0, 0, 20, 'gravel', 0, 'trees', 'trees'],
  [0, -220, 20, 'gravel', 10, 'trees', 'trees'],
  [-40, -420, 19, 'gravel', 35, 'trees', 'trees'], // JUMP CREST 1
  [-90, -600, 21, 'gravel', 15, 'trees', 'trees'],
  // High-speed right 4
  [-170, -780, 20, 'gravel', 10, 'trees', 'trees'],
  [-290, -920, 19, 'gravel', 18, 'trees', 'trees'],
  [-440, -1000, 18, 'gravel', 25, 'trees', 'trees'],
  // Scandinavian Flick chicane
  [-570, -1020, 17, 'gravel', 20, 'trees', 'trees'],
  [-680, -970, 17, 'gravel', 15, 'trees', 'trees'],
  [-770, -880, 18, 'gravel', 10, 'trees', 'trees'],
  // Yellow House Crest Jump
  [-840, -740, 22, 'gravel', 45, 'trees', 'trees'], // JUMP CREST 2
  [-890, -560, 22, 'gravel', 20, 'trees', 'trees'],
  [-910, -360, 20, 'gravel', 15, 'trees', 'trees'],
  // Hairpin Left around sawmill
  [-880, -180, 16, 'gravel', 10, 'trees', 'barrier'],
  [-810, -50, 16, 'gravel', 5, 'barrier', 'trees'],
  [-700, 30, 17, 'gravel', 5, 'trees', 'trees'],
  [-560, 60, 19, 'gravel', 10, 'trees', 'trees'],
  [-380, 40, 20, 'gravel', 25, 'trees', 'trees'], // JUMP CREST 3
  [-200, 10, 21, 'gravel', 10, 'trees', 'trees'],
  [-50, -30, 22, 'gravel', 0, 'trees', 'trees'],
  [120, -100, 22, 'gravel', 0, 'trees', 'trees'],
  [280, -200, 24, 'gravel', 0, 'barrier', 'barrier'],
]);

const finlandPaceNotes: PaceNote[] = [
  { distanceMeters: 50, type: 'straight', severity: 6, text: 'Flat 150m into Crest' },
  { distanceMeters: 180, type: 'jump', severity: 6, modifier: 'over_crest', text: 'BIG JUMP! Keep middle' },
  { distanceMeters: 380, type: 'right', severity: 4, modifier: 'cut', text: 'Right 4 fast - Cut inside' },
  { distanceMeters: 590, type: 'left', severity: 3, modifier: 'dont_cut', text: 'Left 3 Sharp - Don\'t Cut' },
  { distanceMeters: 740, type: 'chicane', severity: 2, modifier: 'tightens', text: 'Flick Left into Right 2' },
  { distanceMeters: 920, type: 'jump', severity: 6, modifier: 'over_crest', text: 'YELLOW HOUSE JUMP - FLY!' },
  { distanceMeters: 1140, type: 'hairpin_left', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Left into Forest' },
  { distanceMeters: 1320, type: 'right', severity: 5, modifier: 'cut', text: 'Right 5 over small crest' },
  { distanceMeters: 1520, type: 'straight', severity: 6, modifier: 'cut', text: 'Flat out sprint to the line!' },
];

const finlandSectors: Sector[] = [
  { id: 1, distanceMeters: 520, name: 'Sector 1 - Forest Crests', targetTimeSeconds: 19.5 },
  { id: 2, distanceMeters: 1050, name: 'Sector 2 - Yellow House Flight', targetTimeSeconds: 38.0 },
  { id: 3, distanceMeters: 1620, name: 'Sector 3 - Sawmill Sprint', targetTimeSeconds: 58.5 },
];

// 3. WALES - HAFREN MUD FOREST (Deep mud ruts, water splashes, heavy slip and technical ruts)
const walesPoints = createSpline([
  [0, 0, 17, 'mud', 0, 'trees', 'trees'],
  [0, -160, 16, 'mud', 0, 'trees', 'trees'],
  [40, -290, 15, 'mud', 5, 'trees', 'water'],
  [120, -390, 16, 'mud', 5, 'trees', 'water'],
  // Muddy 90-degree Left into water splash
  [210, -440, 16, 'mud', 0, 'trees', 'water'],
  [310, -440, 18, 'mud', -2, 'water', 'water'], // WATER SPLASH
  [410, -390, 16, 'mud', 5, 'trees', 'trees'],
  // Slippery technical switchbacks
  [480, -290, 15, 'mud', 10, 'trees', 'trees'],
  [510, -170, 14, 'mud', 12, 'trees', 'trees'],
  [480, -60, 14, 'mud', 15, 'trees', 'trees'],
  [400, 30, 15, 'mud', 12, 'trees', 'trees'],
  // Hairpin right on slick mud
  [300, 80, 14, 'mud', 8, 'trees', 'trees'],
  [200, 60, 15, 'mud', 5, 'trees', 'trees'],
  [130, -10, 16, 'gravel', 5, 'trees', 'trees'],
  [80, -110, 16, 'mud', 5, 'trees', 'trees'],
  // Fast rutted sweep
  [50, -240, 17, 'mud', 5, 'trees', 'trees'],
  [-30, -370, 16, 'mud', 5, 'trees', 'trees'],
  [-130, -480, 16, 'mud', 8, 'trees', 'trees'],
  [-240, -560, 17, 'mud', 10, 'trees', 'trees'],
  [-370, -600, 18, 'mud', 8, 'trees', 'trees'],
  [-500, -590, 19, 'gravel', 5, 'trees', 'barrier'],
  [-640, -550, 20, 'gravel', 0, 'barrier', 'barrier'],
]);

const walesPaceNotes: PaceNote[] = [
  { distanceMeters: 40, type: 'straight', severity: 6, text: 'Muddy straight 100m' },
  { distanceMeters: 150, type: 'left', severity: 2, modifier: 'slippery', text: 'Left 2 Deep Mud - Transfer Weight!' },
  { distanceMeters: 290, type: 'water_splash', severity: 5, modifier: 'cut', text: 'WATER SPLASH! Grip tight' },
  { distanceMeters: 460, type: 'hairpin_right', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Right in deep ruts' },
  { distanceMeters: 620, type: 'hairpin_left', severity: 1, modifier: 'dont_cut', text: 'Hairpin Left - Watch camber' },
  { distanceMeters: 780, type: 'right', severity: 3, modifier: 'slippery', text: 'Right 3 SLIPPY into Gravel transition' },
  { distanceMeters: 960, type: 'left', severity: 4, modifier: 'opens', text: 'Left 4 opens over crest' },
  { distanceMeters: 1180, type: 'straight', severity: 6, text: 'Full throttle to Flying Finish!' },
];

const walesSectors: Sector[] = [
  { id: 1, distanceMeters: 420, name: 'Sector 1 - Water Splash Run', targetTimeSeconds: 21.0 },
  { id: 2, distanceMeters: 860, name: 'Sector 2 - Forest Rut Hairpins', targetTimeSeconds: 44.0 },
  { id: 3, distanceMeters: 1350, name: 'Sector 3 - Hafren Blast', targetTimeSeconds: 65.0 },
];

// 4. CORSICA - TOUR DE CORSE (10,000 Corners - Narrow Mountain Tarmac & Precision Hairpins)
const corsicaPoints = createSpline([
  [0, 0, 16, 'tarmac', 0, 'rock', 'cliff'],
  [0, -180, 15, 'tarmac', 10, 'rock', 'cliff'],
  [50, -320, 14, 'tarmac', 20, 'rock', 'cliff'],
  [120, -420, 14, 'tarmac', 28, 'rock', 'cliff'],
  // Hairpin Left 1
  [130, -520, 15, 'tarmac', 35, 'rock', 'cliff'],
  [70, -580, 14, 'tarmac', 40, 'rock', 'cliff'],
  [-20, -560, 14, 'tarmac', 45, 'rock', 'cliff'],
  // Sharp climb
  [-110, -480, 14, 'tarmac', 52, 'rock', 'cliff'],
  [-170, -370, 14, 'tarmac', 58, 'rock', 'cliff'],
  [-190, -240, 15, 'tarmac', 65, 'rock', 'cliff'],
  // Hairpin Right 2
  [-250, -140, 14, 'tarmac', 70, 'rock', 'cliff'],
  [-340, -110, 14, 'tarmac', 72, 'rock', 'cliff'],
  [-430, -150, 14, 'tarmac', 70, 'rock', 'cliff'],
  // Narrow stone bridge section
  [-490, -260, 13, 'tarmac', 65, 'barrier', 'barrier'],
  [-520, -390, 13, 'tarmac', 60, 'barrier', 'barrier'],
  [-510, -520, 14, 'tarmac', 52, 'rock', 'cliff'],
  [-460, -640, 14, 'tarmac', 45, 'rock', 'cliff'],
  // Rapid chicane sequence
  [-370, -730, 15, 'tarmac', 35, 'rock', 'cliff'],
  [-260, -780, 15, 'tarmac', 25, 'rock', 'cliff'],
  [-140, -820, 16, 'tarmac', 15, 'barrier', 'cliff'],
  [0, -850, 17, 'tarmac', 5, 'barrier', 'cliff'],
  [160, -870, 18, 'tarmac', 0, 'barrier', 'barrier'],
]);

const corsicaPaceNotes: PaceNote[] = [
  { distanceMeters: 40, type: 'straight', severity: 6, text: 'Tarmac blast 100m' },
  { distanceMeters: 170, type: 'right', severity: 3, modifier: 'dont_cut', text: 'Right 3 - Cliff outside!' },
  { distanceMeters: 310, type: 'hairpin_left', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Left - Razor precision' },
  { distanceMeters: 510, type: 'right', severity: 4, modifier: 'tightens', text: 'Right 4 uphill tightens' },
  { distanceMeters: 690, type: 'hairpin_right', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Right around rock face' },
  { distanceMeters: 850, type: 'caution', severity: 2, modifier: 'narrow', text: 'CAUTION: NARROW BRIDGE - Keep middle!' },
  { distanceMeters: 1040, type: 'chicane', severity: 3, modifier: 'cut', text: 'Downhill S-bends - Clip apexes' },
  { distanceMeters: 1220, type: 'straight', severity: 6, text: 'Sprint to the finish line!' },
];

const corsicaSectors: Sector[] = [
  { id: 1, distanceMeters: 410, name: 'Sector 1 - Cliffside Ascent', targetTimeSeconds: 18.0 },
  { id: 2, distanceMeters: 880, name: 'Sector 2 - Stone Bridge Gap', targetTimeSeconds: 39.0 },
  { id: 3, distanceMeters: 1360, name: 'Sector 3 - Mediterranean Descent', targetTimeSeconds: 59.0 },
];

// 5. KENYA - SAFARI RALLY (Rough Gravel, Rocks, Mud & Dust)
const kenyaPoints = createSpline([
  [0, 0, 22, 'gravel', 0, 'trees', 'trees'],
  [0, -200, 22, 'gravel', 0, 'rock', 'trees'],
  [-60, -380, 20, 'gravel', 5, 'rock', 'trees'],
  [-160, -520, 18, 'mud', 5, 'water', 'rock'], // MUD PATCH
  [-290, -610, 18, 'mud', 0, 'water', 'trees'],
  // High speed Savannah jump
  [-440, -660, 22, 'gravel', 30, 'trees', 'rock'], // JUMP
  [-600, -670, 24, 'gravel', 10, 'trees', 'trees'],
  [-760, -620, 20, 'gravel', 5, 'rock', 'trees'],
  // Hairpin right around Acacia
  [-880, -520, 17, 'gravel', 0, 'trees', 'rock'],
  [-930, -390, 16, 'gravel', 0, 'trees', 'rock'],
  [-890, -260, 17, 'mud', 0, 'trees', 'water'],
  [-790, -160, 18, 'mud', 0, 'trees', 'water'],
  // Rocky chicane
  [-660, -110, 17, 'gravel', 10, 'rock', 'rock'],
  [-510, -110, 18, 'gravel', 15, 'rock', 'rock'],
  [-360, -160, 20, 'gravel', 20, 'trees', 'trees'],
  [-200, -250, 22, 'gravel', 10, 'trees', 'trees'],
  [-60, -360, 24, 'gravel', 0, 'barrier', 'barrier'],
]);

const kenyaPaceNotes: PaceNote[] = [
  { distanceMeters: 40, type: 'straight', severity: 6, text: 'Savannah straight 150m' },
  { distanceMeters: 210, type: 'caution', severity: 3, modifier: 'slippery', text: 'Caution: Deep Mud & Ruts' },
  { distanceMeters: 380, type: 'jump', severity: 5, modifier: 'over_crest', text: 'BIG DUST JUMP - Pin it!' },
  { distanceMeters: 580, type: 'hairpin_right', severity: 1, modifier: 'handbrake' as any, text: 'Hairpin Right around Acacia tree' },
  { distanceMeters: 780, type: 'chicane', severity: 2, modifier: 'dont_cut', text: 'Rock Chicane - WATCH BOULDERS!' },
  { distanceMeters: 980, type: 'right', severity: 5, modifier: 'cut', text: 'Right 5 Full power to Finish!' },
];

const kenyaSectors: Sector[] = [
  { id: 1, distanceMeters: 390, name: 'Sector 1 - Red Dust Plain', targetTimeSeconds: 16.5 },
  { id: 2, distanceMeters: 820, name: 'Sector 2 - Acacia Hairpin', targetTimeSeconds: 36.0 },
  { id: 3, distanceMeters: 1260, name: 'Sector 3 - Boulders & Finish', targetTimeSeconds: 54.0 },
];

// Helper to generate scenery obstacles along track
function generateObstacles(points: SplinePoint[]): StageObstacle[] {
  const obstacles: StageObstacle[] = [];
  
  for (let i = 1; i < points.length - 1; i += 2) {
    const p = points[i];
    const prev = points[i - 1];
    const next = points[i + 1];
    
    // Normal vector to the road
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    
    const offset = p.width / 2 + 10 + Math.random() * 12;
    
    // Left side obstacle
    if (p.hazardLeft === 'trees' || p.surface === 'gravel' || p.surface === 'mud') {
      obstacles.push({
        x: p.x + nx * offset,
        y: p.y + ny * offset,
        radius: 4.5,
        type: p.hazardLeft === 'rock' ? 'rock' : 'tree',
        surface: p.surface,
      });
    }
    
    // Right side obstacle
    if (p.hazardRight === 'trees' || p.hazardRight === 'rock') {
      obstacles.push({
        x: p.x - nx * offset,
        y: p.y - ny * offset,
        radius: 4.5,
        type: p.hazardRight === 'rock' ? 'rock' : 'tree',
        surface: p.surface,
      });
    }
    
    // Haybales on hairpins / curbs
    if (i % 6 === 0 && p.surface === 'tarmac') {
      obstacles.push({
        x: p.x + nx * (p.width / 2 + 3),
        y: p.y + ny * (p.width / 2 + 3),
        radius: 3,
        type: 'haybale',
        surface: p.surface,
      });
    }
  }
  
  return obstacles;
}

export const RALLY_STAGES: TrackStage[] = [
  {
    id: 'monte_carlo',
    name: 'Col de Turini',
    country: 'Monaco / France',
    flag: '🇲🇨',
    location: 'Maritime Alps',
    primarySurface: 'snow',
    surfaceMix: [
      { surface: 'ice', percentage: 40 },
      { surface: 'snow', percentage: 35 },
      { surface: 'tarmac', percentage: 25 },
    ],
    totalDistanceMeters: 1680,
    parTimeSeconds: 68.0,
    silverTimeSeconds: 78.0,
    bronzeTimeSeconds: 95.0,
    points: monteCarloPoints,
    sectors: monteCarloSectors,
    paceNotes: monteCarloPaceNotes,
    obstacles: generateObstacles(monteCarloPoints),
    weather: 'snowing',
    ambientColor: '#0b1320',
    trackColor: '#e2e8f0',
    roadsideColor: '#334155',
    description: 'The crown jewel of winter rallying. Deadly icy switchbacks, cliff drop-offs and treacherous transitions between dry tarmac and black ice.',
    difficulty: 'Extreme',
    jumpCrests: [1100],
  },
  {
    id: 'finland',
    name: 'Ouninpohja High Flight',
    country: 'Finland',
    flag: '🇫🇮',
    location: 'Jyväskylä Lakes',
    primarySurface: 'gravel',
    surfaceMix: [
      { surface: 'gravel', percentage: 90 },
      { surface: 'tarmac', percentage: 10 },
    ],
    totalDistanceMeters: 1620,
    parTimeSeconds: 58.5,
    silverTimeSeconds: 67.0,
    bronzeTimeSeconds: 82.0,
    points: finlandPoints,
    sectors: finlandSectors,
    paceNotes: finlandPaceNotes,
    obstacles: generateObstacles(finlandPoints),
    weather: 'clear',
    ambientColor: '#061a14',
    trackColor: '#c29b62',
    roadsideColor: '#1e392a',
    description: 'The rollercoaster of rallying. Massive blind crest jumps, high-speed forest sweeps and razor sharp Scandinavian flicks.',
    difficulty: 'Hard',
    jumpCrests: [220, 920, 1380],
  },
  {
    id: 'wales',
    name: 'Hafren Mud Ruts',
    country: 'Wales, UK',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    location: 'Cambrian Mountains',
    primarySurface: 'mud',
    surfaceMix: [
      { surface: 'mud', percentage: 75 },
      { surface: 'gravel', percentage: 25 },
    ],
    totalDistanceMeters: 1350,
    parTimeSeconds: 65.0,
    silverTimeSeconds: 75.0,
    bronzeTimeSeconds: 90.0,
    points: walesPoints,
    sectors: walesSectors,
    paceNotes: walesPaceNotes,
    obstacles: generateObstacles(walesPoints),
    weather: 'raining',
    ambientColor: '#0c1815',
    trackColor: '#5a4632',
    roadsideColor: '#1b2f23',
    description: 'Treacherous Welsh forestry. Deep mud ruts, water splashes and greasy camber where traction control and handbrake finesse make the difference.',
    difficulty: 'Hard',
    jumpCrests: [],
  },
  {
    id: 'corsica',
    name: 'Tour de Corse 10k',
    country: 'France / Corsica',
    flag: '🇫🇷',
    location: 'Ajaccio Mountains',
    primarySurface: 'tarmac',
    surfaceMix: [
      { surface: 'tarmac', percentage: 100 },
    ],
    totalDistanceMeters: 1360,
    parTimeSeconds: 59.0,
    silverTimeSeconds: 68.0,
    bronzeTimeSeconds: 84.0,
    points: corsicaPoints,
    sectors: corsicaSectors,
    paceNotes: corsicaPaceNotes,
    obstacles: generateObstacles(corsicaPoints),
    weather: 'sunset',
    ambientColor: '#1c131d',
    trackColor: '#383b42',
    roadsideColor: '#453835',
    description: 'The Rally of 10,000 Corners. Mountain rock walls on one side, sheer cliff drops on the other. Uncompromising precision tarmac racing.',
    difficulty: 'Medium',
    jumpCrests: [],
  },
  {
    id: 'kenya',
    name: 'Safari Rift Valley',
    country: 'Kenya',
    flag: '🇰🇪',
    location: 'Naivasha Wilderness',
    primarySurface: 'gravel',
    surfaceMix: [
      { surface: 'gravel', percentage: 65 },
      { surface: 'mud', percentage: 35 },
    ],
    totalDistanceMeters: 1260,
    parTimeSeconds: 54.0,
    silverTimeSeconds: 63.0,
    bronzeTimeSeconds: 78.0,
    points: kenyaPoints,
    sectors: kenyaSectors,
    paceNotes: kenyaPaceNotes,
    obstacles: generateObstacles(kenyaPoints),
    weather: 'dusty',
    ambientColor: '#2b1b11',
    trackColor: '#a86938',
    roadsideColor: '#423120',
    description: 'Wild African wilderness. Roaring red dust, brutal ruts and high speed jumps across the savannah.',
    difficulty: 'Extreme',
    jumpCrests: [440],
  },
];

export function getStageById(id: string): TrackStage {
  return RALLY_STAGES.find((s) => s.id === id) || RALLY_STAGES[0];
}

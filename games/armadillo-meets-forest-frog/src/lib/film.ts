export const DURATION_S = 100;

export interface Shot {
  img: string;
  n: string;
  label: string;
  subtitle: string;
  dolly: string;
  lens: string;
  pan: { from: string; to: string };
  lift: { from: string; to: string };
  zoom: { from: number; to: number };
}

export const SHOTS: Shot[] = [
  {
    img: "/images/shot-01-clearing.jpg",
    n: "01",
    label: "THE CLEARING",
    subtitle: "El Claro",
    dolly: "SLOW PAN RIGHT",
    lens: "24MM ANAMORPHIC",
    pan: { from: "-11vw", to: "8vw" },
    lift: { from: "0vh", to: "-2vh" },
    zoom: { from: 1.42, to: 1.58 },
  },
  {
    img: "/images/shot-02-frog.jpg",
    n: "02",
    label: "THE SENTINEL",
    subtitle: "El Vigía",
    dolly: "MACRO PUSH-IN",
    lens: "100MM MACRO",
    pan: { from: "5vw", to: "-6vw" },
    lift: { from: "-1vh", to: "1vh" },
    zoom: { from: 1.34, to: 1.5 },
  },
  {
    img: "/images/shot-03-giant.jpg",
    n: "03",
    label: "THE GIANT EMERGES",
    subtitle: "El Despertar",
    dolly: "CRANE UP",
    lens: "32MM · T1.8",
    pan: { from: "-6vw", to: "4vw" },
    lift: { from: "3vh", to: "-3vh" },
    zoom: { from: 1.38, to: 1.56 },
  },
  {
    img: "/images/shot-04-encounter.jpg",
    n: "04",
    label: "FIRST CONTACT",
    subtitle: "Primer Contacto",
    dolly: "TRACK LEFT",
    lens: "50MM SPHERICAL",
    pan: { from: "8vw", to: "-8vw" },
    lift: { from: "0vh", to: "-1.5vh" },
    zoom: { from: 1.4, to: 1.52 },
  },
  {
    img: "/images/shot-05-dusk.jpg",
    n: "05",
    label: "DUSK KEEPS THEM",
    subtitle: "El Anochecer",
    dolly: "PULL BACK",
    lens: "18MM WIDE",
    pan: { from: "0vw", to: "-3vw" },
    lift: { from: "0vh", to: "1vh" },
    zoom: { from: 1.52, to: 1.36 },
  },
];

export interface Caption {
  at: [number, number];
  text: string;
  kicker?: string;
}

export const CAPTIONS: Caption[] = [
  {
    at: [0.018, 0.09],
    kicker: "EXT. SUBTROPICAL FOREST — DUSK",
    text: "At dusk, the forest holds its breath.",
  },
  {
    at: [0.235, 0.34],
    kicker: "CURURÚ · 4 CM TALL",
    text: "On a throne of moss — the smallest guardian keeps the watch.",
  },
  {
    at: [0.43, 0.5],
    text: "Then the ground remembers how to move.",
  },
  {
    at: [0.515, 0.588],
    kicker: "PRIODONTES MAXIMUS ×40",
    text: "Tatú carreta. The wagon that walks.",
  },
  {
    at: [0.635, 0.73],
    text: "Two worlds, meeting at the speed of wonder.",
  },
  {
    at: [0.818, 0.9],
    text: "And the light stayed — just to watch them listen.",
  },
];

export const SPECS = [
  { k: "RENDER", v: "Path-traced · 8K OpenEXR" },
  { k: "KEY LIGHT", v: "5,600K dusk · −12° azimuth" },
  { k: "ATMOSPHERE", v: "Double-scatter volumetric mist" },
  { k: "FRAME", v: "2.39:1 scope · 24 fps" },
];

export interface Character {
  n: string;
  img: string;
  latin: string;
  name: string;
  title: string;
  role: string;
  stats: { k: string; v: string }[];
  note: string;
}

export const CHARACTERS: Character[] = [
  {
    n: "01",
    img: "/images/shot-02-frog.jpg",
    latin: "Phyllomedusa sauvagii",
    name: "CURURÚ",
    title: "The Sentinel of the Log",
    role: "A frog the size of a fingertip, keeper of the clearing's oldest front porch. Nothing enters the forest at dusk without being seen by him first.",
    stats: [
      { k: "HEIGHT", v: "4 cm" },
      { k: "WEIGHT", v: "3 g" },
      { k: "TEMPERAMENT", v: "Unbothered" },
      { k: "DUTY", v: "Night watch" },
    ],
    note: "Cast after 400 auditions. Refused a stand-in.",
  },
  {
    n: "02",
    img: "/images/shot-03-giant.jpg",
    latin: "Priodontes maximus",
    name: "TATÚ",
    title: "The Giant Who Walks Gently",
    role: "A wagon of bronze and patience. In this fable he stands forty times life-size — a mountain that chose to be careful, armored in every growth ring of the forest itself.",
    stats: [
      { k: "LENGTH", v: "1.5 m · here ×40" },
      { k: "WEIGHT", v: "60 kg of calm" },
      { k: "CLAWS", v: "3 scythes, unused" },
      { k: "SPEED", v: "The pace of dusk" },
    ],
    note: "Armor detailed plate-by-plate. 312 scutes.",
  },
];

export const END_CREDITS = [
  { k: "DIRECTED BY", v: "The Forest Itself" },
  { k: "WRITTEN BY", v: "Fireflies, Unscripted" },
  { k: "CINEMATOGRAPHY", v: "Golden Hour · Unrendered" },
  { k: "SCORE", v: "Crickets & Distant Rainfall" },
  { k: "MIST SUPERVISOR", v: "The River Below" },
  { k: "STARRING", v: "Cururú · Tatú" },
];

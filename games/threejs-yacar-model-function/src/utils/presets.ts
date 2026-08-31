import { YacareColors } from '../models/crearyacare';

export interface YacarePreset {
  id: string;
  nombre: string;
  nombreCientifico: string;
  descripcion: string;
  habitat: string;
  colores: YacareColors;
}

export const PRESETS_YACARE: YacarePreset[] = [
  {
    id: 'overo',
    nombre: 'Yacaré Overo',
    nombreCientifico: 'Caiman latirostris',
    descripcion: 'Hocico ancho y robusto. Coloración verde oliva con manchas transversales oscuras y vientre crema amarillento.',
    habitat: 'Esteros del Iberá, Río Paraná, humedales subtropicales de Argentina, Brasil, Paraguay y Uruguay.',
    colores: {
      dorsal: 0x2c3b28,
      ventral: 0xbfb68b,
      escamas: 0x1f2b1d,
      manchas: 0x182116,
      ojos: 0xd4a017,
      pupilas: 0x0a0a0a,
      dientes: 0xf5f3ea,
      bocaInterior: 0xd98279,
      garras: 0x1a1a18
    }
  },
  {
    id: 'negro',
    nombre: 'Yacaré Negro / Pantanero',
    nombreCientifico: 'Caiman yacare',
    descripcion: 'Cuerpo esbelto y tonalidades oscuras casi negras con flancos moteados en bronce y gris pizarra.',
    habitat: 'Pantanal boliviano y brasileño, cuenca del río Paraguay y Chaco húmedo.',
    colores: {
      dorsal: 0x1c211e,
      ventral: 0xa8a89a,
      escamas: 0x121614,
      manchas: 0x0c0f0d,
      ojos: 0xbd901b,
      pupilas: 0x050505,
      dientes: 0xedebe4,
      bocaInterior: 0xd66b60,
      garras: 0x141414
    }
  },
  {
    id: 'dorado',
    nombre: 'Yacaré Dorado del Iberá',
    nombreCientifico: 'Variedad dorada de pantano',
    descripcion: 'Coloración pardo-dorada y ocre adaptada al agua con taninos y vegetación flotante (camalotales).',
    habitat: 'Aguas poco profundas con densa alfombra vegetal y luz solar directa.',
    colores: {
      dorsal: 0x54472d,
      ventral: 0xded19b,
      escamas: 0x3d321d,
      manchas: 0x2b2211,
      ojos: 0xe6b800,
      pupilas: 0x141108,
      dientes: 0xfffae8,
      bocaInterior: 0xe38f84,
      garras: 0x292116
    }
  },
  {
    id: 'albino',
    nombre: 'Yacaré Albino Mítico',
    nombreCientifico: 'Variación amelánica rara',
    descripcion: 'Ejemplar albino con piel blanco marfil / crema pálido y ojos con reflejos rosáceos o dorados.',
    habitat: 'Casos documentados en santuarios de conservación y zoocriaderos protegidos.',
    colores: {
      dorsal: 0xf2ede4,
      ventral: 0xfdfaf5,
      escamas: 0xe0d7c8,
      manchas: 0xd4c8b4,
      ojos: 0xd95763,
      pupilas: 0x6e1b23,
      dientes: 0xffffff,
      bocaInterior: 0xf7a8a1,
      garras: 0xc4b9a9
    }
  }
];

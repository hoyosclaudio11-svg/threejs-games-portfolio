import * as THREE from 'three';

export interface YacareColors {
  dorsal?: number | string;       // Color del lomo / escamas oscuras
  ventral?: number | string;      // Color del vientre / crema o amarillento
  escamas?: number | string;      // Color de crestas y osteodermos
  manchas?: number | string;      // Manchas oscuras características
  ojos?: number | string;         // Ojos dorados/ámbar
  pupilas?: number | string;      // Pupila vertical negra
  dientes?: number | string;      // Dientes blancos marfil
  bocaInterior?: number | string; // Interior de la boca rosado/salmón
  garras?: number | string;       // Garras córneas oscuras
}

export interface YacareGroup extends THREE.Group {
  // Métodos requeridos
  caminar: (velocidad?: number) => void;
  quedarseQuieto: () => void;
  
  // Métodos adicionales y de control
  actualizar: (delta?: number) => void;
  abrirBoca: (angulo?: number) => void;
  cerrarBoca: () => void;
  morder: () => void;
  nadar: (velocidad?: number) => void;
  girarMortal: () => void;
  establecerColor: (colores: Partial<YacareColors>) => void;
  obtenerEstadisticas: () => { cajas: number; cilindros: number; esferas: number; total: number };
  
  // Estado interno expuesto
  estado: {
    estaCaminando: boolean;
    estaNadando: boolean;
    estaMidiendo: boolean;
    anguloBoca: number;
    velocidad: number;
    tiempo: number;
    girandoMortal: boolean;
    progresoGiro: number;
  };

  // Partes anatómicas articuladas para inspección
  partes: {
    cabeza: THREE.Group;
    mandibulaInferior: THREE.Group;
    cuello: THREE.Group;
    torso: THREE.Group;
    colaSegmentos: THREE.Group[];
    pataDelanteraIzq: THREE.Group;
    pataDelanteraDer: THREE.Group;
    pataTraseraIzq: THREE.Group;
    pataTraseraDer: THREE.Group;
    ojos: THREE.Mesh[];
  };
}

/**
 * Función que construye y devuelve un modelo 3D realista de Yacaré (Caimán)
 * utilizando únicamente primitivas geométricas (esferas, cilindros, cajas) de Three.js.
 * 
 * Cumple estrictamente con no incluir escena, cámara, luces ni controles en su interior.
 * Incluye los métodos caminar() y quedarseQuieto(), además de actualizar() y gestos interactivos.
 */
export function crearyacaré(opcionesColores?: Partial<YacareColors>): YacareGroup {
  // Paleta de colores planos realista (Yacaré Overo / Caiman latirostris)
  const paletaDefecto = {
    dorsal: 0x2c3b28,        // Verde oliva oscuro pantano
    ventral: 0xbfb68b,       // Vientre crema pálido / amarillento
    escamas: 0x1f2b1d,       // Crestas y osteodermos verde negruzco
    manchas: 0x182116,       // Manchas oscuras de camuflaje
    ojos: 0xd4a017,          // Ojo reptiliano ámbar dorado
    pupilas: 0x0a0a0a,       // Pupila en hendidura vertical
    dientes: 0xf5f3ea,       // Blanco marfil
    bocaInterior: 0xd98279,  // Salmón rosáceo
    garras: 0x1a1a18,        // Garras oscuras
    lengua: 0xc46960         // Lengua carnosa
  };

  const configColores = { ...paletaDefecto, ...opcionesColores };

  // Materiales con colores planos (Flat Shading para estilo realista low-poly/escultura orgánica)
  const crearMaterial = (color: number | string, rugosidad = 0.85, metalico = 0.05) => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: rugosidad,
      metalness: metalico,
      flatShading: true
    });
  };

  const matDorsal = crearMaterial(configColores.dorsal);
  const matVentral = crearMaterial(configColores.ventral);
  const matEscamas = crearMaterial(configColores.escamas);
  const matManchas = crearMaterial(configColores.manchas);
  const matOjos = new THREE.MeshStandardMaterial({
    color: new THREE.Color(configColores.ojos),
    roughness: 0.15,
    metalness: 0.1,
    flatShading: true
  });
  const matPupilas = new THREE.MeshBasicMaterial({ color: new THREE.Color(configColores.pupilas) });
  const matDientes = crearMaterial(configColores.dientes, 0.3, 0.1);
  const matBoca = crearMaterial(configColores.bocaInterior, 0.6, 0.0);
  const matLengua = crearMaterial(configColores.lengua, 0.5, 0.0);
  const matGarras = crearMaterial(configColores.garras, 0.6, 0.2);

  // Contador de primitivas utilizadas
  let contadorCajas = 0;
  let contadorCilindros = 0;
  let contadorEsferas = 0;

  // Funciones auxiliares para crear primitivas registrando el tipo
  const crearCaja = (ancho: number, alto: number, largo: number, material: THREE.Material) => {
    contadorCajas++;
    const geo = new THREE.BoxGeometry(ancho, alto, largo);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const crearCilindro = (
    radioSuperior: number,
    radioInferior: number,
    altura: number,
    segmentosRadiales = 8,
    material: THREE.Material = matDorsal
  ) => {
    contadorCilindros++;
    const geo = new THREE.CylinderGeometry(radioSuperior, radioInferior, altura, segmentosRadiales);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const crearEsfera = (
    radio: number,
    segmentosAncho = 8,
    segmentosAlto = 6,
    material: THREE.Material = matDorsal
  ) => {
    contadorEsferas++;
    const geo = new THREE.SphereGeometry(radio, segmentosAncho, segmentosAlto);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Grupo principal del yacaré
  const yacare = new THREE.Group() as YacareGroup;
  yacare.name = "Yacare";

  // Estructura anatómica jerárquica
  const grupoRaiz = new THREE.Group();
  grupoRaiz.name = "CuerpoPrincipal";
  yacare.add(grupoRaiz);

  // ==========================================
  // 1. TORSO / TRONCO (Cuerpo amplio y aplanado)
  // ==========================================
  const grupoTorso = new THREE.Group();
  grupoTorso.name = "Torso";
  grupoTorso.position.set(0, 0.45, 0); // Altura sobre el suelo
  grupoRaiz.add(grupoTorso);

  // Núcleo principal del cuerpo (caja achatada de perfil crocodiliano)
  const cuerpoCentro = crearCaja(0.9, 0.42, 1.8, matDorsal);
  cuerpoCentro.position.set(0, 0, 0);
  grupoTorso.add(cuerpoCentro);

  // Vientre ventral (capa inferior más clara)
  const vientre = crearCaja(0.86, 0.12, 1.76, matVentral);
  vientre.position.set(0, -0.16, 0);
  grupoTorso.add(vientre);

  // Costados redondeados mediante cilindros horizontales
  const flancoIzq = crearCilindro(0.2, 0.2, 1.76, 6, matDorsal);
  flancoIzq.rotation.x = Math.PI / 2;
  flancoIzq.position.set(-0.43, -0.04, 0);
  flancoIzq.scale.set(0.8, 1, 0.6);
  grupoTorso.add(flancoIzq);

  const flancoDer = crearCilindro(0.2, 0.2, 1.76, 6, matDorsal);
  flancoDer.rotation.x = Math.PI / 2;
  flancoDer.position.set(0.43, -0.04, 0);
  flancoDer.scale.set(0.8, 1, 0.6);
  grupoTorso.add(flancoDer);

  // Crestas dorsales / Osteodermos en el lomo (filas dobles y cuádruples de escamas quincunciales)
  const filasCrestas = 7;
  const colCrestas = [-0.3, -0.1, 0.1, 0.3];
  for (let f = 0; f < filasCrestas; f++) {
    const zPos = -0.7 + f * 0.24;
    colCrestas.forEach((xPos, idx) => {
      // Escama piramidal/cono achatado hecha con cilindro de 4 lados (pirámide)
      const escama = crearCilindro(0.01, 0.055, 0.08, 4, (idx === 1 || idx === 2) ? matEscamas : matManchas);
      escama.position.set(xPos, 0.23, zPos);
      escama.rotation.y = Math.PI / 4;
      escama.rotation.x = 0.2; // Inclinación hacia atrás
      grupoTorso.add(escama);
    });
  }

  // ==========================================
  // 2. CUELLO
  // ==========================================
  const grupoCuello = new THREE.Group();
  grupoCuello.name = "Cuello";
  grupoCuello.position.set(0, 0.05, 0.95);
  grupoTorso.add(grupoCuello);

  const cuelloBase = crearCaja(0.72, 0.38, 0.55, matDorsal);
  cuelloBase.position.set(0, 0, 0.22);
  grupoCuello.add(cuelloBase);

  const cuelloVientre = crearCaja(0.68, 0.1, 0.52, matVentral);
  cuelloVientre.position.set(0, -0.15, 0.22);
  grupoCuello.add(cuelloVientre);

  // Escamas nucales (característica clave de los yacarés)
  for (let n = -0.18; n <= 0.18; n += 0.12) {
    const nucaEscama = crearCilindro(0.01, 0.045, 0.09, 4, matEscamas);
    nucaEscama.position.set(n, 0.2, 0.25);
    nucaEscama.rotation.x = 0.25;
    grupoCuello.add(nucaEscama);
  }

  // ==========================================
  // 3. CABEZA Y MANDÍBULA (Hocico ancho y aplanado)
  // ==========================================
  const grupoCabeza = new THREE.Group();
  grupoCabeza.name = "Cabeza";
  grupoCabeza.position.set(0, 0.04, 0.48);
  grupoCuello.add(grupoCabeza);

  // Base del cráneo posterior (Caja ancha y compacta)
  const craneo = crearCaja(0.65, 0.32, 0.48, matDorsal);
  craneo.position.set(0, 0.02, 0.2);
  grupoCabeza.add(craneo);

  // Mandíbula Superior / Hocico (Hocico en "U" característico del yacaré overo)
  const hocicoMedio = crearCaja(0.52, 0.18, 0.65, matDorsal);
  hocicoMedio.position.set(0, 0.01, 0.68);
  grupoCabeza.add(hocicoMedio);

  const hocicoPunta = crearCaja(0.44, 0.14, 0.38, matDorsal);
  hocicoPunta.position.set(0, -0.01, 1.1);
  grupoCabeza.add(hocicoPunta);

  // Borde curvado frontal del hocico con cilindro horizontal
  const bordeHocico = crearCilindro(0.07, 0.07, 0.42, 8, matDorsal);
  bordeHocico.rotation.z = Math.PI / 2;
  bordeHocico.position.set(0, -0.01, 1.28);
  grupoCabeza.add(bordeHocico);

  // Paladar / Techo de la boca (rosado)
  const paladar = crearCaja(0.46, 0.04, 0.85, matBoca);
  paladar.position.set(0, -0.07, 0.8);
  grupoCabeza.add(paladar);

  // Narinas elevadas (Bultos nasales en la punta para respirar sumergido)
  const narinaIzquierda = crearEsfera(0.045, 6, 6, matDorsal);
  narinaIzquierda.position.set(-0.11, 0.08, 1.2);
  grupoCabeza.add(narinaIzquierda);

  const narinaDerecha = crearEsfera(0.045, 6, 6, matDorsal);
  narinaDerecha.position.set(0.11, 0.08, 1.2);
  grupoCabeza.add(narinaDerecha);

  const orificioIzq = crearCilindro(0.018, 0.018, 0.03, 6, matPupilas);
  orificioIzq.rotation.x = -0.3;
  orificioIzq.position.set(-0.11, 0.1, 1.21);
  grupoCabeza.add(orificioIzq);

  const orificioDer = crearCilindro(0.018, 0.018, 0.03, 6, matPupilas);
  orificioDer.rotation.x = -0.3;
  orificioDer.position.set(0.11, 0.1, 1.21);
  grupoCabeza.add(orificioDer);

  // Crestas supraorbitales y Órbitas oculares elevadas
  const crestaOjoIzq = crearCaja(0.14, 0.14, 0.26, matDorsal);
  crestaOjoIzq.position.set(-0.25, 0.15, 0.28);
  crestaOjoIzq.rotation.y = 0.15;
  grupoCabeza.add(crestaOjoIzq);

  const crestaOjoDer = crearCaja(0.14, 0.14, 0.26, matDorsal);
  crestaOjoDer.position.set(0.25, 0.15, 0.28);
  crestaOjoDer.rotation.y = -0.15;
  grupoCabeza.add(crestaOjoDer);

  // Globos oculares (Esferas)
  const ojoIzq = crearEsfera(0.07, 8, 8, matOjos);
  ojoIzq.position.set(-0.27, 0.16, 0.3);
  ojoIzq.scale.set(0.9, 1, 1.1);
  grupoCabeza.add(ojoIzq);

  const ojoDer = crearEsfera(0.07, 8, 8, matOjos);
  ojoDer.position.set(0.27, 0.16, 0.3);
  ojoDer.scale.set(0.9, 1, 1.1);
  grupoCabeza.add(ojoDer);

  // Pupilas verticales de reptil (cilindros delgados)
  const pupilaIzq = crearCilindro(0.01, 0.01, 0.09, 4, matPupilas);
  pupilaIzq.position.set(-0.32, 0.16, 0.3);
  pupilaIzq.rotation.z = Math.PI / 2;
  grupoCabeza.add(pupilaIzq);

  const pupilaDer = crearCilindro(0.01, 0.01, 0.09, 4, matPupilas);
  pupilaDer.position.set(0.32, 0.16, 0.3);
  pupilaDer.rotation.z = Math.PI / 2;
  grupoCabeza.add(pupilaDer);

  // Crestas prefrontales (línea de quilla en el hocico)
  const quillaHocico = crearCaja(0.06, 0.04, 0.5, matEscamas);
  quillaHocico.position.set(0, 0.11, 0.7);
  grupoCabeza.add(quillaHocico);

  // Dientes del Maxilar Superior (Cilindros cónicos / pirámides)
  const dientesSuperiores: THREE.Mesh[] = [];
  for (let lado of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const z = 0.45 + i * 0.095;
      const x = lado * (0.26 - (i * 0.007));
      const alturaDiente = (i === 3 || i === 4) ? 0.07 : 0.045; // 4to diente prominente
      const diente = crearCilindro(0.002, 0.016, alturaDiente, 5, matDientes);
      diente.position.set(x, -0.09, z);
      diente.rotation.x = Math.PI; // Apunta hacia abajo
      diente.rotation.z = lado * 0.1;
      grupoCabeza.add(diente);
      dientesSuperiores.push(diente);
    }
  }

  // ==========================================
  // MANDÍBULA INFERIOR (Articulada para morder / rugir)
  // ==========================================
  const grupoMandibula = new THREE.Group();
  grupoMandibula.name = "MandibulaInferior";
  grupoMandibula.position.set(0, -0.1, 0.05); // Punto de pivote posterior
  grupoCabeza.add(grupoMandibula);

  // Ramas mandibulares y barbilla
  const mandibulaBase = crearCaja(0.58, 0.12, 0.45, matDorsal);
  mandibulaBase.position.set(0, 0, 0.2);
  grupoMandibula.add(mandibulaBase);

  const mandibulaMedia = crearCaja(0.48, 0.1, 0.65, matDorsal);
  mandibulaMedia.position.set(0, 0.01, 0.68);
  grupoMandibula.add(mandibulaMedia);

  const mandibulaPunta = crearCaja(0.4, 0.08, 0.35, matDorsal);
  mandibulaPunta.position.set(0, 0.02, 1.08);
  grupoMandibula.add(mandibulaPunta);

  // Mentón curvado
  const menton = crearCilindro(0.04, 0.04, 0.38, 8, matDorsal);
  menton.rotation.z = Math.PI / 2;
  menton.position.set(0, 0.02, 1.25);
  grupoMandibula.add(menton);

  // Vientre gular (debajo de la garganta, amarillento)
  const gargantaVentral = crearCaja(0.52, 0.06, 0.8, matVentral);
  gargantaVentral.position.set(0, -0.06, 0.55);
  grupoMandibula.add(gargantaVentral);

  // Lengua y suelo bucal (rosado)
  const sueloBoca = crearCaja(0.38, 0.04, 0.75, matBoca);
  sueloBoca.position.set(0, 0.06, 0.65);
  grupoMandibula.add(sueloBoca);

  const lengua = crearCaja(0.24, 0.035, 0.45, matLengua);
  lengua.position.set(0, 0.08, 0.6);
  grupoMandibula.add(lengua);

  // Dientes del Maxilar Inferior (encajan con los superiores)
  for (let lado of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const z = 0.48 + i * 0.098;
      const x = lado * (0.22 - (i * 0.006));
      const alturaDiente = (i === 3) ? 0.065 : 0.04;
      const diente = crearCilindro(0.002, 0.015, alturaDiente, 5, matDientes);
      diente.position.set(x, 0.07, z);
      diente.rotation.z = -lado * 0.12;
      grupoMandibula.add(diente);
    }
  }

  // ==========================================
  // 4. EXTREMIDADES (Patas delanteras y traseras articuladas)
  // ==========================================

  // Función fábrica para pata delantera
  const crearPataDelantera = (lado: 'izq' | 'der') => {
    const multX = lado === 'izq' ? -1 : 1;
    const grupoHombro = new THREE.Group();
    grupoHombro.name = `PataDelantera_${lado}`;
    grupoHombro.position.set(multX * 0.46, -0.05, 0.65);

    // Húmero / Brazo superior
    const humero = crearCilindro(0.1, 0.085, 0.42, 6, matDorsal);
    humero.position.set(multX * 0.18, -0.08, 0);
    humero.rotation.z = multX * (Math.PI / 3); // Extendido hacia los lados
    humero.rotation.y = -multX * 0.2;
    grupoHombro.add(humero);

    // Articulación del codo
    const codo = crearEsfera(0.09, 6, 6, matDorsal);
    codo.position.set(multX * 0.35, -0.18, 0.02);
    grupoHombro.add(codo);

    // Antebrazo (Radio y Cúbito)
    const grupoCodo = new THREE.Group();
    grupoCodo.position.copy(codo.position);
    grupoHombro.add(grupoCodo);

    const antebrazo = crearCilindro(0.08, 0.07, 0.4, 6, matDorsal);
    antebrazo.position.set(0, -0.18, 0.05);
    antebrazo.rotation.x = -0.3;
    antebrazo.rotation.z = -multX * 0.2;
    grupoCodo.add(antebrazo);

    // Mano / Pie delantero (5 dedos palmeados con garras)
    const mano = crearCaja(0.24, 0.05, 0.28, matDorsal);
    mano.position.set(0, -0.36, 0.12);
    grupoCodo.add(mano);

    // 5 Garras en abanico
    for (let d = -2; d <= 2; d++) {
      const garra = crearCilindro(0.003, 0.016, 0.09, 4, matGarras);
      garra.position.set(d * 0.045, -0.37, 0.26 + Math.abs(d) * -0.02);
      garra.rotation.x = Math.PI / 2 + 0.2;
      garra.rotation.y = multX * d * 0.15;
      grupoCodo.add(garra);
    }

    return { grupoHombro, grupoCodo };
  };

  // Función fábrica para pata trasera (más larga y musculosa)
  const crearPataTrasera = (lado: 'izq' | 'der') => {
    const multX = lado === 'izq' ? -1 : 1;
    const grupoCadera = new THREE.Group();
    grupoCadera.name = `PataTrasera_${lado}`;
    grupoCadera.position.set(multX * 0.44, -0.04, -0.65);

    // Fémur (Muslo potente)
    const femur = crearCilindro(0.13, 0.1, 0.52, 6, matDorsal);
    femur.position.set(multX * 0.22, -0.06, -0.08);
    femur.rotation.z = multX * (Math.PI / 2.8);
    femur.rotation.y = multX * 0.35;
    grupoCadera.add(femur);

    // Rodilla
    const rodilla = crearEsfera(0.1, 6, 6, matDorsal);
    rodilla.position.set(multX * 0.42, -0.16, -0.15);
    grupoCadera.add(rodilla);

    // Grupo articulado de la pierna
    const grupoRodilla = new THREE.Group();
    grupoRodilla.position.copy(rodilla.position);
    grupoCadera.add(grupoRodilla);

    // Pierna (Tibia)
    const tibia = crearCilindro(0.09, 0.075, 0.46, 6, matDorsal);
    tibia.position.set(0, -0.18, 0.1);
    tibia.rotation.x = 0.5;
    tibia.rotation.z = -multX * 0.15;
    grupoRodilla.add(tibia);

    // Pie trasero grande palmeado (4 dedos grandes característicos de caimán)
    const pie = crearCaja(0.28, 0.05, 0.34, matDorsal);
    pie.position.set(0, -0.36, 0.25);
    pie.rotation.x = -0.1;
    grupoRodilla.add(pie);

    // Membrana interdigital / dedos con garras
    for (let d = -1.5; d <= 1.5; d += 1) {
      const garra = crearCilindro(0.003, 0.018, 0.11, 4, matGarras);
      garra.position.set(d * 0.065, -0.37, 0.42 - Math.abs(d) * 0.02);
      garra.rotation.x = Math.PI / 2 + 0.15;
      garra.rotation.y = multX * d * 0.18;
      grupoRodilla.add(garra);
    }

    return { grupoCadera, grupoRodilla };
  };

  const pataDIzq = crearPataDelantera('izq');
  const pataDDer = crearPataDelantera('der');
  const pataTIzq = crearPataTrasera('izq');
  const pataTDer = crearPataTrasera('der');

  grupoTorso.add(pataDIzq.grupoHombro);
  grupoTorso.add(pataDDer.grupoHombro);
  grupoTorso.add(pataTIzq.grupoCadera);
  grupoTorso.add(pataTDer.grupoCadera);

  // ==========================================
  // 5. COLA ARTICULADA (Segmentada con crestas caudales)
  // ==========================================
  const segmentosCola: THREE.Group[] = [];
  let grupoAnterior: THREE.Group = grupoTorso;

  const datosSegmentos = [
    { ancho: 0.72, alto: 0.44, largo: 0.75, posZ: -0.9, crestas: 'doble', altoCresta: 0.14 },
    { ancho: 0.54, alto: 0.40, largo: 0.75, posZ: -0.7, crestas: 'doble_convergente', altoCresta: 0.16 },
    { ancho: 0.38, alto: 0.36, largo: 0.75, posZ: -0.7, crestas: 'simple_alta', altoCresta: 0.20 },
    { ancho: 0.24, alto: 0.28, largo: 0.70, posZ: -0.65, crestas: 'simple_media', altoCresta: 0.16 },
    { ancho: 0.12, alto: 0.18, largo: 0.65, posZ: -0.6, crestas: 'simple_baja', altoCresta: 0.10 }
  ];

  datosSegmentos.forEach((datos, index) => {
    const grupoSeg = new THREE.Group();
    grupoSeg.name = `Cola_Segmento_${index + 1}`;
    grupoSeg.position.set(0, 0, datos.posZ);
    grupoAnterior.add(grupoSeg);
    segmentosCola.push(grupoSeg);

    // Cuerpo del segmento
    const cuerpoSeg = crearCaja(datos.ancho, datos.alto, datos.largo, matDorsal);
    cuerpoSeg.position.set(0, 0, -datos.largo / 2);
    grupoSeg.add(cuerpoSeg);

    // Vientre de la cola
    const vientreSeg = crearCaja(datos.ancho * 0.9, datos.alto * 0.25, datos.largo * 0.96, matVentral);
    vientreSeg.position.set(0, -datos.alto * 0.38, -datos.largo / 2);
    grupoSeg.add(vientreSeg);

    // Crestas y aletas caudales (característica propulsora del yacaré)
    const cantCrestasSeg = 3;
    for (let c = 0; c < cantCrestasSeg; c++) {
      const zCresta = (-datos.largo / (cantCrestasSeg + 1)) * (c + 1);

      if (datos.crestas === 'doble') {
        // Doble fila de quillas dorsales
        [-0.14, 0.14].forEach(x => {
          const cr = crearCilindro(0.01, 0.04, datos.altoCresta, 4, matEscamas);
          cr.position.set(x, datos.alto * 0.5 + datos.altoCresta * 0.4, zCresta);
          cr.rotation.x = 0.3;
          grupoSeg.add(cr);
        });
      } else if (datos.crestas === 'doble_convergente') {
        // Doble quilla convergiendo hacia el centro
        const separacion = 0.1 - (c * 0.03);
        [-separacion, separacion].forEach(x => {
          const cr = crearCilindro(0.01, 0.035, datos.altoCresta, 4, matEscamas);
          cr.position.set(x, datos.alto * 0.5 + datos.altoCresta * 0.4, zCresta);
          cr.rotation.x = 0.3;
          grupoSeg.add(cr);
        });
      } else {
        // Fila simple de crestas verticales altas (aleta natatoria caudal)
        const aleta = crearCaja(0.03, datos.altoCresta, datos.largo / cantCrestasSeg * 0.8, matEscamas);
        aleta.position.set(0, datos.alto * 0.5 + datos.altoCresta * 0.45, zCresta);
        grupoSeg.add(aleta);
      }
    }

    grupoAnterior = grupoSeg;
  });

  // ==========================================
  // ESTADO INTERNO Y CONTROL DE ANIMACIONES
  // ==========================================
  yacare.estado = {
    estaCaminando: false,
    estaNadando: false,
    estaMidiendo: false,
    anguloBoca: 0,
    velocidad: 1.0,
    tiempo: 0,
    girandoMortal: false,
    progresoGiro: 0
  };

  yacare.partes = {
    cabeza: grupoCabeza,
    mandibulaInferior: grupoMandibula,
    cuello: grupoCuello,
    torso: grupoTorso,
    colaSegmentos: segmentosCola,
    pataDelanteraIzq: pataDIzq.grupoHombro,
    pataDelanteraDer: pataDDer.grupoHombro,
    pataTraseraIzq: pataTIzq.grupoCadera,
    pataTraseraDer: pataTDer.grupoCadera,
    ojos: [ojoIzq, ojoDer]
  };

  // ==========================================
  // MÉTODOS REQUERIDOS Y COMPORTAMIENTOS
  // ==========================================

  /**
   * Inicia el ciclo de marcha / caminata realista de reptil
   */
  yacare.caminar = function(velocidad: number = 1.0) {
    this.estado.estaCaminando = true;
    this.estado.estaNadando = false;
    this.estado.velocidad = velocidad;
  };

  /**
   * Detiene el movimiento y devuelve el cuerpo a su postura estática natural
   */
  yacare.quedarseQuieto = function() {
    this.estado.estaCaminando = false;
    this.estado.estaNadando = false;
    this.estado.girandoMortal = false;
  };

  /**
   * Modo natación: patas pegadas al cuerpo y ondulación sinusoidal vigorosa de la cola
   */
  yacare.nadar = function(velocidad: number = 1.2) {
    this.estado.estaNadando = true;
    this.estado.estaCaminando = false;
    this.estado.velocidad = velocidad;
  };

  /**
   * Abre la mandíbula inferior al ángulo deseado en radianes
   */
  yacare.abrirBoca = function(angulo: number = 0.55) {
    this.estado.anguloBoca = Math.min(Math.max(angulo, 0), 0.85);
  };

  /**
   * Cierra completamente la mandíbula
   */
  yacare.cerrarBoca = function() {
    this.estado.anguloBoca = 0;
  };

  /**
   * Ejecuta un mordisco rápido y contundente (snap)
   */
  yacare.morder = function() {
    this.abrirBoca(0.65);
    setTimeout(() => {
      this.cerrarBoca();
    }, 180);
  };

  /**
   * Giro de la muerte (Death roll) - Maniobra letal icónica de los caimanes
   */
  yacare.girarMortal = function() {
    this.estado.girandoMortal = true;
    this.estado.progresoGiro = 0;
    this.abrirBoca(0.4);
  };

  /**
   * Permite actualizar la paleta de colores dinámicamente
   */
  yacare.establecerColor = function(nuevosColores: Partial<YacareColors>) {
    if (nuevosColores.dorsal) matDorsal.color.set(nuevosColores.dorsal);
    if (nuevosColores.ventral) matVentral.color.set(nuevosColores.ventral);
    if (nuevosColores.escamas) matEscamas.color.set(nuevosColores.escamas);
    if (nuevosColores.manchas) matManchas.color.set(nuevosColores.manchas);
    if (nuevosColores.ojos) matOjos.color.set(nuevosColores.ojos);
    if (nuevosColores.pupilas) matPupilas.color.set(nuevosColores.pupilas);
    if (nuevosColores.dientes) matDientes.color.set(nuevosColores.dientes);
    if (nuevosColores.bocaInterior) matBoca.color.set(nuevosColores.bocaInterior);
    if (nuevosColores.garras) matGarras.color.set(nuevosColores.garras);
  };

  /**
   * Devuelve las estadísticas de primitivas utilizadas para construir el modelo
   */
  yacare.obtenerEstadisticas = function() {
    return {
      cajas: contadorCajas,
      cilindros: contadorCilindros,
      esferas: contadorEsferas,
      total: contadorCajas + contadorCilindros + contadorEsferas
    };
  };

  /**
   * Método de actualización por frame para integrar en bucles de renderizado externos
   * Calcula la cinemática articular de marcha reptiliana, natación y postura
   */
  yacare.actualizar = function(delta: number = 0.016) {
    const dt = Math.min(delta, 0.1);
    this.estado.tiempo += dt * this.estado.velocidad * 3.5;
    const t = this.estado.tiempo;

    // Suavizado de apertura de mandíbula
    grupoMandibula.rotation.x = THREE.MathUtils.lerp(
      grupoMandibula.rotation.x,
      -this.estado.anguloBoca,
      0.2
    );

    // Animación de Giro Mortal
    if (this.estado.girandoMortal) {
      this.estado.progresoGiro += dt * 6.5;
      grupoRaiz.rotation.z = this.estado.progresoGiro;
      grupoRaiz.position.y = Math.sin(this.estado.progresoGiro) * 0.1;
      
      // Ondulación del cuerpo durante el giro
      segmentosCola.forEach((seg, idx) => {
        seg.rotation.y = Math.sin(this.estado.progresoGiro * 2 + idx) * 0.3;
      });

      if (this.estado.progresoGiro >= Math.PI * 4) { // 2 giros completos
        this.estado.girandoMortal = false;
        grupoRaiz.rotation.z = 0;
        grupoRaiz.position.y = 0;
        this.cerrarBoca();
      }
      return;
    }

    if (this.estado.estaCaminando) {
      // Cinemática de marcha de reptil:
      // Movimiento serpenteante de la columna vertebral en fase diagonal cruzada (gait)
      const frecuencia = 1.0;
      const faseMarcha = t * frecuencia;

      // Balanceo lateral del tronco y cadera
      grupoTorso.rotation.y = Math.sin(faseMarcha) * 0.08;
      grupoTorso.position.y = 0.45 + Math.abs(Math.sin(faseMarcha * 2)) * 0.03;

      // Cuello y cabeza compensan suavemente la mirada hacia el frente
      grupoCuello.rotation.y = -Math.sin(faseMarcha) * 0.07;
      grupoCabeza.rotation.y = -Math.sin(faseMarcha) * 0.04;
      grupoCabeza.rotation.x = Math.sin(faseMarcha * 2) * 0.02;

      // Pata Delantera Izquierda vs Derecha (en oposición)
      const anguloDIzq = Math.sin(faseMarcha);
      const anguloDDer = Math.sin(faseMarcha + Math.PI);
      
      pataDIzq.grupoHombro.rotation.y = anguloDIzq * 0.45;
      pataDIzq.grupoHombro.rotation.z = -Math.max(0, -anguloDIzq) * 0.2;
      pataDIzq.grupoCodo.rotation.x = -Math.sin(faseMarcha) * 0.3;

      pataDDer.grupoHombro.rotation.y = anguloDDer * 0.45;
      pataDDer.grupoHombro.rotation.z = Math.max(0, -anguloDDer) * 0.2;
      pataDDer.grupoCodo.rotation.x = -Math.sin(faseMarcha + Math.PI) * 0.3;

      // Pata Trasera Izquierda vs Derecha (marcha diagonal: pata TIzq se mueve con pata DDer)
      const anguloTIzq = Math.sin(faseMarcha + Math.PI * 0.85);
      const anguloTDer = Math.sin(faseMarcha - Math.PI * 0.15);

      pataTIzq.grupoCadera.rotation.y = anguloTIzq * 0.48;
      pataTIzq.grupoCadera.rotation.z = -Math.max(0, -anguloTIzq) * 0.25;
      pataTIzq.grupoRodilla.rotation.x = Math.sin(faseMarcha + Math.PI * 0.85) * 0.35;

      pataTDer.grupoCadera.rotation.y = anguloTDer * 0.48;
      pataTDer.grupoCadera.rotation.z = Math.max(0, -anguloTDer) * 0.25;
      pataTDer.grupoRodilla.rotation.x = Math.sin(faseMarcha - Math.PI * 0.15) * 0.35;

      // Ondulación sinusoidal propagada a lo largo de la cola
      segmentosCola.forEach((seg, idx) => {
        const retrasoFase = (idx + 1) * 0.65;
        const amplitud = 0.12 + (idx * 0.06);
        seg.rotation.y = THREE.MathUtils.lerp(
          seg.rotation.y,
          Math.sin(faseMarcha - retrasoFase) * amplitud,
          0.2
        );
        seg.rotation.z = Math.sin(faseMarcha * 2 - retrasoFase) * 0.03;
      });

    } else if (this.estado.estaNadando) {
      // Modo natación: extremidades replegadas contra el cuerpo y natación sinusoidal
      const faseNado = t * 1.6;

      // Patas recogidas pegadas a los flancos
      pataDIzq.grupoHombro.rotation.y = THREE.MathUtils.lerp(pataDIzq.grupoHombro.rotation.y, -0.6, 0.15);
      pataDIzq.grupoHombro.rotation.z = THREE.MathUtils.lerp(pataDIzq.grupoHombro.rotation.z, -0.4, 0.15);
      pataDDer.grupoHombro.rotation.y = THREE.MathUtils.lerp(pataDDer.grupoHombro.rotation.y, 0.6, 0.15);
      pataDDer.grupoHombro.rotation.z = THREE.MathUtils.lerp(pataDDer.grupoHombro.rotation.z, 0.4, 0.15);

      pataTIzq.grupoCadera.rotation.y = THREE.MathUtils.lerp(pataTIzq.grupoCadera.rotation.y, -0.7, 0.15);
      pataTIzq.grupoCadera.rotation.z = THREE.MathUtils.lerp(pataTIzq.grupoCadera.rotation.z, -0.3, 0.15);
      pataTDer.grupoCadera.rotation.y = THREE.MathUtils.lerp(pataTDer.grupoCadera.rotation.y, 0.7, 0.15);
      pataTDer.grupoCadera.rotation.z = THREE.MathUtils.lerp(pataTDer.grupoCadera.rotation.z, 0.3, 0.15);

      // Serpenteo fluido del cuerpo y cabeza
      grupoTorso.rotation.y = Math.sin(faseNado) * 0.12;
      grupoCuello.rotation.y = -Math.sin(faseNado) * 0.1;
      grupoCabeza.rotation.y = -Math.sin(faseNado) * 0.06;

      // Potente latigazo caudal sinusoidal de natación
      segmentosCola.forEach((seg, idx) => {
        const retrasoFase = (idx + 1) * 0.8;
        const amplitud = 0.22 + (idx * 0.12);
        seg.rotation.y = THREE.MathUtils.lerp(
          seg.rotation.y,
          Math.sin(faseNado - retrasoFase) * amplitud,
          0.25
        );
      });

    } else {
      // Estado Quieto (Idle / Descanso natural sobre el suelo)
      const respiracion = Math.sin(t * 0.35) * 0.015;

      // Retorno suave a postura base
      grupoTorso.rotation.y = THREE.MathUtils.lerp(grupoTorso.rotation.y, 0, 0.1);
      grupoTorso.position.y = THREE.MathUtils.lerp(grupoTorso.position.y, 0.42 + respiracion, 0.1);
      grupoCuello.rotation.set(0, 0, 0);
      grupoCabeza.rotation.set(respiracion * 0.5, 0, 0);

      // Posición de patas en descanso
      pataDIzq.grupoHombro.rotation.set(0, -0.1, 0);
      pataDIzq.grupoCodo.rotation.set(0, 0, 0);
      pataDDer.grupoHombro.rotation.set(0, 0.1, 0);
      pataDDer.grupoCodo.rotation.set(0, 0, 0);

      pataTIzq.grupoCadera.rotation.set(0, 0.15, 0);
      pataTIzq.grupoRodilla.rotation.set(0, 0, 0);
      pataTDer.grupoCadera.rotation.set(0, -0.15, 0);
      pataTDer.grupoRodilla.rotation.set(0, 0, 0);

      // Cola reposa con una leve curva orgánica
      segmentosCola.forEach((seg, idx) => {
        const curvaBase = Math.sin((idx + 1) * 0.5) * 0.04;
        seg.rotation.y = THREE.MathUtils.lerp(seg.rotation.y, curvaBase, 0.1);
        seg.rotation.z = THREE.MathUtils.lerp(seg.rotation.z, 0, 0.1);
      });
    }
  };

  return yacare;
}

// Alias para compatibilidad de nomenclatura
export const crearYacare = crearyacaré;
export const crearYacaré = crearyacaré;
export default crearyacaré;

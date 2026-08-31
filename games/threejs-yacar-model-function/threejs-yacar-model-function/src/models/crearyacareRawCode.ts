/**
 * Código fuente JavaScript puro de la función crearyacaré()
 * Listo para copiar y usar directamente en cualquier proyecto Three.js.
 */
export const CREAR_YACARE_RAW_JS = `/**
 * Genera un modelo 3D realista de Yacaré (Caimán) como un THREE.Group
 * usando ÚNICAMENTE primitivas geométricas (esferas, cilindros, cajas) de Three.js.
 * 
 * Estilo realista con colores planos (Flat Shading).
 * No incluye escena, cámara, luces ni controles.
 * Incluye los métodos caminar(), quedarseQuieto(), actualizar() y funciones interactivas.
 * 
 * @param {Object} [opcionesColores] - Configuración opcional de colores
 * @returns {THREE.Group} Grupo de Three.js con el modelo y métodos integrados
 */
function crearyacaré(opcionesColores = {}) {
  // Paleta de colores planos realista (Yacaré Overo / Caiman latirostris)
  const paletaDefecto = {
    dorsal: 0x2c3b28,        // Verde oliva oscuro pantano
    ventral: 0xbfb68b,       // Vientre crema pálido / amarillento
    escamas: 0x1f2b1d,       // Crestas y osteodermos verde negruzco
    manchas: 0x182116,       // Manchas oscuras de camuflaje
    ojos: 0xd4a017,          // Ojos ámbar dorado reptiliano
    pupilas: 0x0a0a0a,       // Pupila en hendidura vertical
    dientes: 0xf5f3ea,       // Blanco marfil
    bocaInterior: 0xd98279,  // Salmón rosáceo
    garras: 0x1a1a18,        // Garras córneas oscuras
    lengua: 0xc46960         // Lengua carnosa
  };

  const config = Object.assign({}, paletaDefecto, opcionesColores);

  // Materiales con colores planos (Flat Shading)
  const crearMaterial = (color, rugosidad = 0.85, metalico = 0.05) => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: rugosidad,
      metalness: metalico,
      flatShading: true
    });
  };

  const matDorsal = crearMaterial(config.dorsal);
  const matVentral = crearMaterial(config.ventral);
  const matEscamas = crearMaterial(config.escamas);
  const matManchas = crearMaterial(config.manchas);
  const matOjos = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.ojos),
    roughness: 0.15,
    metalness: 0.1,
    flatShading: true
  });
  const matPupilas = new THREE.MeshBasicMaterial({ color: new THREE.Color(config.pupilas) });
  const matDientes = crearMaterial(config.dientes, 0.3, 0.1);
  const matBoca = crearMaterial(config.bocaInterior, 0.6, 0.0);
  const matLengua = crearMaterial(config.lengua, 0.5, 0.0);
  const matGarras = crearMaterial(config.garras, 0.6, 0.2);

  // Funciones auxiliares para construir ÚNICAMENTE con primitivas
  const crearCaja = (ancho, alto, largo, material = matDorsal) => {
    const geo = new THREE.BoxGeometry(ancho, alto, largo);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const crearCilindro = (radioSup, radioInf, altura, segmentos = 8, material = matDorsal) => {
    const geo = new THREE.CylinderGeometry(radioSup, radioInf, altura, segmentos);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const crearEsfera = (radio, segW = 8, segH = 6, material = matDorsal) => {
    const geo = new THREE.SphereGeometry(radio, segW, segH);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Grupo principal del yacaré
  const yacare = new THREE.Group();
  yacare.name = "Yacare";

  const grupoRaiz = new THREE.Group();
  yacare.add(grupoRaiz);

  // 1. TORSO / TRONCO
  const grupoTorso = new THREE.Group();
  grupoTorso.position.set(0, 0.45, 0);
  grupoRaiz.add(grupoTorso);

  const cuerpoCentro = crearCaja(0.9, 0.42, 1.8, matDorsal);
  grupoTorso.add(cuerpoCentro);

  const vientre = crearCaja(0.86, 0.12, 1.76, matVentral);
  vientre.position.set(0, -0.16, 0);
  grupoTorso.add(vientre);

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

  // Crestas dorsales en el lomo
  const colCrestas = [-0.3, -0.1, 0.1, 0.3];
  for (let f = 0; f < 7; f++) {
    const zPos = -0.7 + f * 0.24;
    colCrestas.forEach((xPos, idx) => {
      const escama = crearCilindro(0.01, 0.055, 0.08, 4, (idx === 1 || idx === 2) ? matEscamas : matManchas);
      escama.position.set(xPos, 0.23, zPos);
      escama.rotation.y = Math.PI / 4;
      escama.rotation.x = 0.2;
      grupoTorso.add(escama);
    });
  }

  // 2. CUELLO
  const grupoCuello = new THREE.Group();
  grupoCuello.position.set(0, 0.05, 0.95);
  grupoTorso.add(grupoCuello);

  const cuelloBase = crearCaja(0.72, 0.38, 0.55, matDorsal);
  cuelloBase.position.set(0, 0, 0.22);
  grupoCuello.add(cuelloBase);

  const cuelloVientre = crearCaja(0.68, 0.1, 0.52, matVentral);
  cuelloVientre.position.set(0, -0.15, 0.22);
  grupoCuello.add(cuelloVientre);

  // Escamas nucales
  for (let n = -0.18; n <= 0.18; n += 0.12) {
    const nucaEscama = crearCilindro(0.01, 0.045, 0.09, 4, matEscamas);
    nucaEscama.position.set(n, 0.2, 0.25);
    nucaEscama.rotation.x = 0.25;
    grupoCuello.add(nucaEscama);
  }

  // 3. CABEZA Y HOCICO
  const grupoCabeza = new THREE.Group();
  grupoCabeza.position.set(0, 0.04, 0.48);
  grupoCuello.add(grupoCabeza);

  const craneo = crearCaja(0.65, 0.32, 0.48, matDorsal);
  craneo.position.set(0, 0.02, 0.2);
  grupoCabeza.add(craneo);

  const hocicoMedio = crearCaja(0.52, 0.18, 0.65, matDorsal);
  hocicoMedio.position.set(0, 0.01, 0.68);
  grupoCabeza.add(hocicoMedio);

  const hocicoPunta = crearCaja(0.44, 0.14, 0.38, matDorsal);
  hocicoPunta.position.set(0, -0.01, 1.1);
  grupoCabeza.add(hocicoPunta);

  const bordeHocico = crearCilindro(0.07, 0.07, 0.42, 8, matDorsal);
  bordeHocico.rotation.z = Math.PI / 2;
  bordeHocico.position.set(0, -0.01, 1.28);
  grupoCabeza.add(bordeHocico);

  const paladar = crearCaja(0.46, 0.04, 0.85, matBoca);
  paladar.position.set(0, -0.07, 0.8);
  grupoCabeza.add(paladar);

  // Narinas elevadas
  const narinaIzq = crearEsfera(0.045, 6, 6, matDorsal);
  narinaIzq.position.set(-0.11, 0.08, 1.2);
  grupoCabeza.add(narinaIzq);

  const narinaDer = crearEsfera(0.045, 6, 6, matDorsal);
  narinaDer.position.set(0.11, 0.08, 1.2);
  grupoCabeza.add(narinaDer);

  // Ojos reptilianos y crestas
  const crestaOjoIzq = crearCaja(0.14, 0.14, 0.26, matDorsal);
  crestaOjoIzq.position.set(-0.25, 0.15, 0.28);
  grupoCabeza.add(crestaOjoIzq);

  const crestaOjoDer = crearCaja(0.14, 0.14, 0.26, matDorsal);
  crestaOjoDer.position.set(0.25, 0.15, 0.28);
  grupoCabeza.add(crestaOjoDer);

  const ojoIzq = crearEsfera(0.07, 8, 8, matOjos);
  ojoIzq.position.set(-0.27, 0.16, 0.3);
  grupoCabeza.add(ojoIzq);

  const ojoDer = crearEsfera(0.07, 8, 8, matOjos);
  ojoDer.position.set(0.27, 0.16, 0.3);
  grupoCabeza.add(ojoDer);

  const pupilaIzq = crearCilindro(0.01, 0.01, 0.09, 4, matPupilas);
  pupilaIzq.position.set(-0.32, 0.16, 0.3);
  pupilaIzq.rotation.z = Math.PI / 2;
  grupoCabeza.add(pupilaIzq);

  const pupilaDer = crearCilindro(0.01, 0.01, 0.09, 4, matPupilas);
  pupilaDer.position.set(0.32, 0.16, 0.3);
  pupilaDer.rotation.z = Math.PI / 2;
  grupoCabeza.add(pupilaDer);

  // Dientes superiores
  for (let lado of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const z = 0.45 + i * 0.095;
      const x = lado * (0.26 - (i * 0.007));
      const altura = (i === 3 || i === 4) ? 0.07 : 0.045;
      const diente = crearCilindro(0.002, 0.016, altura, 5, matDientes);
      diente.position.set(x, -0.09, z);
      diente.rotation.x = Math.PI;
      grupoCabeza.add(diente);
    }
  }

  // MANDÍBULA INFERIOR
  const grupoMandibula = new THREE.Group();
  grupoMandibula.position.set(0, -0.1, 0.05);
  grupoCabeza.add(grupoMandibula);

  const mandibulaBase = crearCaja(0.58, 0.12, 0.45, matDorsal);
  mandibulaBase.position.set(0, 0, 0.2);
  grupoMandibula.add(mandibulaBase);

  const mandibulaMedia = crearCaja(0.48, 0.1, 0.65, matDorsal);
  mandibulaMedia.position.set(0, 0.01, 0.68);
  grupoMandibula.add(mandibulaMedia);

  const mandibulaPunta = crearCaja(0.4, 0.08, 0.35, matDorsal);
  mandibulaPunta.position.set(0, 0.02, 1.08);
  grupoMandibula.add(mandibulaPunta);

  const gargantaVentral = crearCaja(0.52, 0.06, 0.8, matVentral);
  gargantaVentral.position.set(0, -0.06, 0.55);
  grupoMandibula.add(gargantaVentral);

  const sueloBoca = crearCaja(0.38, 0.04, 0.75, matBoca);
  sueloBoca.position.set(0, 0.06, 0.65);
  grupoMandibula.add(sueloBoca);

  const lengua = crearCaja(0.24, 0.035, 0.45, matLengua);
  lengua.position.set(0, 0.08, 0.6);
  grupoMandibula.add(lengua);

  // Dientes inferiores
  for (let lado of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const z = 0.48 + i * 0.098;
      const x = lado * (0.22 - (i * 0.006));
      const altura = (i === 3) ? 0.065 : 0.04;
      const diente = crearCilindro(0.002, 0.015, altura, 5, matDientes);
      diente.position.set(x, 0.07, z);
      grupoMandibula.add(diente);
    }
  }

  // 4. EXTREMIDADES (PATAS)
  const crearPataDelantera = (lado) => {
    const multX = lado === 'izq' ? -1 : 1;
    const grupoHombro = new THREE.Group();
    grupoHombro.position.set(multX * 0.46, -0.05, 0.65);

    const humero = crearCilindro(0.1, 0.085, 0.42, 6, matDorsal);
    humero.position.set(multX * 0.18, -0.08, 0);
    humero.rotation.z = multX * (Math.PI / 3);
    grupoHombro.add(humero);

    const codo = crearEsfera(0.09, 6, 6, matDorsal);
    codo.position.set(multX * 0.35, -0.18, 0.02);
    grupoHombro.add(codo);

    const grupoCodo = new THREE.Group();
    grupoCodo.position.copy(codo.position);
    grupoHombro.add(grupoCodo);

    const antebrazo = crearCilindro(0.08, 0.07, 0.4, 6, matDorsal);
    antebrazo.position.set(0, -0.18, 0.05);
    antebrazo.rotation.x = -0.3;
    grupoCodo.add(antebrazo);

    const mano = crearCaja(0.24, 0.05, 0.28, matDorsal);
    mano.position.set(0, -0.36, 0.12);
    grupoCodo.add(mano);

    for (let d = -2; d <= 2; d++) {
      const garra = crearCilindro(0.003, 0.016, 0.09, 4, matGarras);
      garra.position.set(d * 0.045, -0.37, 0.26);
      garra.rotation.x = Math.PI / 2 + 0.2;
      grupoCodo.add(garra);
    }

    return { grupoHombro, grupoCodo };
  };

  const crearPataTrasera = (lado) => {
    const multX = lado === 'izq' ? -1 : 1;
    const grupoCadera = new THREE.Group();
    grupoCadera.position.set(multX * 0.44, -0.04, -0.65);

    const femur = crearCilindro(0.13, 0.1, 0.52, 6, matDorsal);
    femur.position.set(multX * 0.22, -0.06, -0.08);
    femur.rotation.z = multX * (Math.PI / 2.8);
    grupoCadera.add(femur);

    const rodilla = crearEsfera(0.1, 6, 6, matDorsal);
    rodilla.position.set(multX * 0.42, -0.16, -0.15);
    grupoCadera.add(rodilla);

    const grupoRodilla = new THREE.Group();
    grupoRodilla.position.copy(rodilla.position);
    grupoCadera.add(grupoRodilla);

    const tibia = crearCilindro(0.09, 0.075, 0.46, 6, matDorsal);
    tibia.position.set(0, -0.18, 0.1);
    tibia.rotation.x = 0.5;
    grupoRodilla.add(tibia);

    const pie = crearCaja(0.28, 0.05, 0.34, matDorsal);
    pie.position.set(0, -0.36, 0.25);
    grupoRodilla.add(pie);

    for (let d = -1.5; d <= 1.5; d += 1) {
      const garra = crearCilindro(0.003, 0.018, 0.11, 4, matGarras);
      garra.position.set(d * 0.065, -0.37, 0.42);
      garra.rotation.x = Math.PI / 2 + 0.15;
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

  // 5. COLA ARTICULADA
  const segmentosCola = [];
  let grupoAnterior = grupoTorso;
  const datosSegmentos = [
    { ancho: 0.72, alto: 0.44, largo: 0.75, posZ: -0.9, crestas: 'doble', altoCresta: 0.14 },
    { ancho: 0.54, alto: 0.40, largo: 0.75, posZ: -0.7, crestas: 'doble', altoCresta: 0.16 },
    { ancho: 0.38, alto: 0.36, largo: 0.75, posZ: -0.7, crestas: 'simple', altoCresta: 0.20 },
    { ancho: 0.24, alto: 0.28, largo: 0.70, posZ: -0.65, crestas: 'simple', altoCresta: 0.16 },
    { ancho: 0.12, alto: 0.18, largo: 0.65, posZ: -0.6, crestas: 'simple', altoCresta: 0.10 }
  ];

  datosSegmentos.forEach((datos) => {
    const grupoSeg = new THREE.Group();
    grupoSeg.position.set(0, 0, datos.posZ);
    grupoAnterior.add(grupoSeg);
    segmentosCola.push(grupoSeg);

    const cuerpoSeg = crearCaja(datos.ancho, datos.alto, datos.largo, matDorsal);
    cuerpoSeg.position.set(0, 0, -datos.largo / 2);
    grupoSeg.add(cuerpoSeg);

    const vientreSeg = crearCaja(datos.ancho * 0.9, datos.alto * 0.25, datos.largo * 0.96, matVentral);
    vientreSeg.position.set(0, -datos.alto * 0.38, -datos.largo / 2);
    grupoSeg.add(vientreSeg);

    for (let c = 0; c < 3; c++) {
      const zC = (-datos.largo / 4) * (c + 1);
      if (datos.crestas === 'doble') {
        [-0.12, 0.12].forEach(x => {
          const cr = crearCilindro(0.01, 0.04, datos.altoCresta, 4, matEscamas);
          cr.position.set(x, datos.alto * 0.5 + datos.altoCresta * 0.4, zC);
          grupoSeg.add(cr);
        });
      } else {
        const aleta = crearCaja(0.03, datos.altoCresta, datos.largo / 4, matEscamas);
        aleta.position.set(0, datos.alto * 0.5 + datos.altoCresta * 0.45, zC);
        grupoSeg.add(aleta);
      }
    }
    grupoAnterior = grupoSeg;
  });

  // ESTADO Y MÉTODOS DEL MODELO
  yacare.estado = {
    estaCaminando: false,
    estaNadando: false,
    anguloBoca: 0,
    velocidad: 1.0,
    tiempo: 0
  };

  // Método requerido: caminar()
  yacare.caminar = function(velocidad = 1.0) {
    this.estado.estaCaminando = true;
    this.estado.estaNadando = false;
    this.estado.velocidad = velocidad;
  };

  // Método requerido: quedarseQuieto()
  yacare.quedarseQuieto = function() {
    this.estado.estaCaminando = false;
    this.estado.estaNadando = false;
  };

  // Métodos auxiliares
  yacare.abrirBoca = function(angulo = 0.55) {
    this.estado.anguloBoca = Math.min(Math.max(angulo, 0), 0.85);
  };

  yacare.cerrarBoca = function() {
    this.estado.anguloBoca = 0;
  };

  // Actualización cinemática por fotograma
  yacare.actualizar = function(delta = 0.016) {
    const dt = Math.min(delta, 0.1);
    this.estado.tiempo += dt * this.estado.velocidad * 3.5;
    const t = this.estado.tiempo;

    grupoMandibula.rotation.x = THREE.MathUtils.lerp(
      grupoMandibula.rotation.x,
      -this.estado.anguloBoca,
      0.2
    );

    if (this.estado.estaCaminando) {
      const faseMarcha = t;

      // Movimiento ondulatorio del lomo
      grupoTorso.rotation.y = Math.sin(faseMarcha) * 0.08;
      grupoTorso.position.y = 0.45 + Math.abs(Math.sin(faseMarcha * 2)) * 0.03;

      grupoCuello.rotation.y = -Math.sin(faseMarcha) * 0.07;
      grupoCabeza.rotation.y = -Math.sin(faseMarcha) * 0.04;

      // Patas Delanteras
      const anguloDIzq = Math.sin(faseMarcha);
      const anguloDDer = Math.sin(faseMarcha + Math.PI);
      pataDIzq.grupoHombro.rotation.y = anguloDIzq * 0.45;
      pataDDer.grupoHombro.rotation.y = anguloDDer * 0.45;

      // Patas Traseras
      const anguloTIzq = Math.sin(faseMarcha + Math.PI * 0.85);
      const anguloTDer = Math.sin(faseMarcha - Math.PI * 0.15);
      pataTIzq.grupoCadera.rotation.y = anguloTIzq * 0.48;
      pataTDer.grupoCadera.rotation.y = anguloTDer * 0.48;

      // Ondulación sinusoidal de la cola
      segmentosCola.forEach((seg, idx) => {
        const retraso = (idx + 1) * 0.65;
        const amp = 0.12 + (idx * 0.06);
        seg.rotation.y = Math.sin(faseMarcha - retraso) * amp;
      });
    } else {
      // Reposo (quedarse quieto)
      grupoTorso.rotation.y = THREE.MathUtils.lerp(grupoTorso.rotation.y, 0, 0.1);
      pataDIzq.grupoHombro.rotation.set(0, -0.1, 0);
      pataDDer.grupoHombro.rotation.set(0, 0.1, 0);
      pataTIzq.grupoCadera.rotation.set(0, 0.15, 0);
      pataTDer.grupoCadera.rotation.set(0, -0.15, 0);
      segmentosCola.forEach((seg) => {
        seg.rotation.y = THREE.MathUtils.lerp(seg.rotation.y, 0, 0.1);
      });
    }
  };

  return yacare;
}
`;

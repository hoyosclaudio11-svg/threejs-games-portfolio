import * as THREE from "three";

export type Sapo = THREE.Group & {
  caminar: () => void;
  saltar: () => void;
  quedarseQuieto: () => void;
};

type Modo = "quieto" | "caminar" | "saltar";

const PIEL = 0x62d36f;
const PIEL_OSCURA = 0x3aaa4e;
const PIEL_SOMBRA = 0x2a8a3c;
const BARRIGA = 0xffebb0;
const OJO = 0xfffdf6;
const IRIS = 0x243d18;
const PUPILA = 0x141414;
const BRILLO = 0xffffff;
const BOCA = 0xc42d45;
const MEJILLA = 0xff9aa8;
const FOSA = 0x1c4a28;

function toon(color: number, extras: THREE.MeshToonMaterialParameters = {}) {
  return new THREE.MeshToonMaterial({ color, ...extras });
}

function esfera(
  radio: number,
  material: THREE.Material,
  sx = 1,
  sy = 1,
  sz = 1,
  seg = 24,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radio, seg, 18), material);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cilindro(
  rArriba: number,
  rAbajo: number,
  alto: number,
  material: THREE.Material,
  seg = 14,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rArriba, rAbajo, alto, seg),
    material,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function caja(ancho: number, alto: number, prof: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, prof), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function suave(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Construye un sapo cartoon con primitivas (esferas, cilindros, cajas)
 * y lo devuelve como THREE.Group con caminar(), saltar() y quedarseQuieto().
 */
export function crearSapo(): Sapo {
  const sapo = new THREE.Group() as Sapo;
  sapo.name = "sapo";

  const matPiel = toon(PIEL);
  const matOscura = toon(PIEL_OSCURA);
  const matSombra = toon(PIEL_SOMBRA);
  const matBarriga = toon(BARRIGA);
  const matOjo = toon(OJO);
  const matIris = toon(IRIS);
  const matPupila = toon(PUPILA);
  const matBrillo = toon(BRILLO);
  const matBoca = toon(BOCA);
  const matMejilla = toon(MEJILLA);
  const matFosa = toon(FOSA);

  const cuerpoGrupo = new THREE.Group();
  cuerpoGrupo.name = "cuerpoGrupo";
  cuerpoGrupo.position.y = 0.58;
  sapo.add(cuerpoGrupo);

  const torso = esfera(0.92, matPiel, 1.18, 0.78, 1.02, 28);
  torso.position.set(0, 0.02, -0.04);
  cuerpoGrupo.add(torso);

  const lomo = esfera(0.72, matOscura, 1.05, 0.42, 0.95, 22);
  lomo.position.set(0, 0.28, -0.12);
  cuerpoGrupo.add(lomo);

  const barriga = esfera(0.74, matBarriga, 1.05, 0.62, 0.72, 22);
  barriga.position.set(0, -0.16, 0.28);
  cuerpoGrupo.add(barriga);

  const manchas = [
    [0.38, 0.3, -0.18, 0.14],
    [-0.32, 0.26, -0.32, 0.11],
    [0.08, 0.34, -0.48, 0.13],
    [-0.48, 0.12, 0.08, 0.09],
  ] as const;
  for (const [x, y, z, r] of manchas) {
    const m = esfera(r, matSombra, 1.2, 0.45, 1);
    m.position.set(x, y, z);
    cuerpoGrupo.add(m);
  }

  const cabeza = new THREE.Group();
  cabeza.name = "cabeza";
  cabeza.position.set(0, 0.42, 0.78);
  cuerpoGrupo.add(cabeza);

  const craneo = esfera(0.7, matPiel, 1.12, 0.88, 1.02, 26);
  cabeza.add(craneo);

  const menton = esfera(0.42, matBarriga, 1.25, 0.55, 0.85);
  menton.position.set(0, -0.28, 0.22);
  cabeza.add(menton);

  const saco = esfera(0.34, matBarriga, 1.35, 0.7, 0.85);
  saco.position.set(0, -0.38, 0.08);
  cabeza.add(saco);

  const mejillaI = esfera(0.2, matMejilla, 1, 0.75, 0.8);
  mejillaI.position.set(-0.52, -0.12, 0.32);
  cabeza.add(mejillaI);
  const mejillaD = esfera(0.2, matMejilla, 1, 0.75, 0.8);
  mejillaD.position.set(0.52, -0.12, 0.32);
  cabeza.add(mejillaD);

  function crearOjo(lado: number) {
    const g = new THREE.Group();
    g.position.set(0.34 * lado, 0.42, 0.38);

    const base = esfera(0.26, matOscura, 1.05, 0.85, 1);
    base.position.y = -0.04;
    g.add(base);

    const globo = esfera(0.24, matOjo, 1, 1, 1, 20);
    g.add(globo);

    const iris = esfera(0.13, matIris, 1, 1, 0.7);
    iris.position.set(lado * -0.02, -0.02, 0.16);
    g.add(iris);

    const pupila = esfera(0.075, matPupila, 0.85, 1, 0.6);
    pupila.position.set(lado * -0.02, -0.02, 0.22);
    g.add(pupila);

    const brillo = esfera(0.045, matBrillo);
    brillo.position.set(lado * -0.06, 0.06, 0.26);
    g.add(brillo);

    const parpado = esfera(0.255, matPiel, 1.05, 0.12, 1.05);
    parpado.position.y = 0.16;
    g.add(parpado);

    return { grupo: g, iris, pupila, parpado, globo };
  }

  const ojoI = crearOjo(-1);
  const ojoD = crearOjo(1);
  cabeza.add(ojoI.grupo, ojoD.grupo);

  const fosaI = esfera(0.035, matFosa, 1.2, 0.7, 0.8);
  fosaI.position.set(-0.1, 0.02, 0.68);
  cabeza.add(fosaI);
  const fosaD = esfera(0.035, matFosa, 1.2, 0.7, 0.8);
  fosaD.position.set(0.1, 0.02, 0.68);
  cabeza.add(fosaD);

  const sonrisa = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.032, 8, 20, Math.PI),
    matBoca,
  );
  sonrisa.position.set(0, -0.18, 0.58);
  sonrisa.rotation.set(0.35, 0, Math.PI);
  sonrisa.castShadow = true;
  cabeza.add(sonrisa);

  const labio = caja(0.42, 0.045, 0.06, matSombra);
  labio.position.set(0, -0.12, 0.66);
  labio.rotation.x = 0.2;
  cabeza.add(labio);

  function crearPataDelantera(lado: number) {
    const g = new THREE.Group();
    g.position.set(0.58 * lado, 0.28, 0.42);

    const hombro = esfera(0.16, matOscura);
    hombro.position.set(lado * 0.04, 0.04, 0);
    g.add(hombro);

    const brazo = cilindro(0.1, 0.085, 0.46, matPiel);
    brazo.position.set(lado * 0.1, -0.2, 0.06);
    brazo.rotation.z = lado * 0.38;
    brazo.rotation.x = 0.42;
    g.add(brazo);

    const mano = esfera(0.13, matPiel, 1.35, 0.5, 1.15);
    mano.position.set(lado * 0.2, -0.42, 0.22);
    g.add(mano);

    for (let i = 0; i < 3; i++) {
      const a = (i - 1) * 0.42;
      const dedo = esfera(0.05, matOscura, 1.7, 0.45, 0.75);
      dedo.position.set(
        lado * 0.2 + Math.sin(a) * 0.11,
        -0.44,
        0.32 + Math.cos(a) * 0.07,
      );
      g.add(dedo);
    }
    return g;
  }

  function crearPataTrasera(lado: number) {
    const g = new THREE.Group();
    g.position.set(0.5 * lado, 0.32, -0.18);

    const muslo = esfera(0.34, matOscura, 1.2, 0.78, 0.95);
    muslo.position.set(lado * 0.28, -0.02, 0.02);
    g.add(muslo);

    const rodilla = esfera(0.14, matPiel);
    rodilla.position.set(lado * 0.42, -0.16, -0.18);
    g.add(rodilla);

    const pantorrilla = cilindro(0.12, 0.09, 0.5, matPiel);
    pantorrilla.position.set(lado * 0.4, -0.28, -0.32);
    pantorrilla.rotation.x = 1.05;
    pantorrilla.rotation.z = lado * -0.18;
    g.add(pantorrilla);

    const pie = esfera(0.18, matPiel, 1.55, 0.38, 2.15);
    pie.position.set(lado * 0.42, -0.48, -0.58);
    pie.rotation.y = lado * 0.4;
    g.add(pie);

    const membrana = caja(0.4, 0.028, 0.3, matSombra);
    membrana.position.set(lado * 0.42, -0.505, -0.62);
    membrana.rotation.y = lado * 0.4;
    g.add(membrana);

    for (let i = 0; i < 4; i++) {
      const a = (i - 1.5) * 0.28 + lado * 0.15;
      const dedo = esfera(0.048, matOscura, 1.8, 0.4, 0.8);
      dedo.position.set(
        lado * 0.42 + Math.sin(a) * 0.16,
        -0.5,
        -0.78 + Math.cos(a) * 0.05,
      );
      g.add(dedo);
    }
    return g;
  }

  const pataDI = crearPataDelantera(-1);
  const pataDD = crearPataDelantera(1);
  const pataTI = crearPataTrasera(-1);
  const pataTD = crearPataTrasera(1);
  sapo.add(pataDI, pataDD, pataTI, pataTD);

  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 24),
    new THREE.MeshBasicMaterial({
      color: 0x0a2a14,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.02;
  sapo.add(sombra);

  const rest = {
    cuerpoY: cuerpoGrupo.position.y,
    cabezaRot: { x: 0, y: 0, z: 0 },
    pataDI: { x: 0, z: 0 },
    pataDD: { x: 0, z: 0 },
    pataTI: { x: 0, z: 0 },
    pataTD: { x: 0, z: 0 },
  };

  let modo: Modo = "quieto";
  let elapsed = 0;
  let tSalto = 0;
  let proximoParpadeo = 1.8;
  let tParpadeo = 99;
  let last = performance.now();
  const DURACION_SALTO = 1.22;

  function parpadearSiToca(dt: number) {
    tParpadeo += dt;
    if (elapsed > proximoParpadeo) {
      tParpadeo = 0;
      proximoParpadeo = elapsed + 2.2 + Math.random() * 2.8;
    }
    const p = tParpadeo < 0.14 ? Math.sin((tParpadeo / 0.14) * Math.PI) : 0;
    const sy = 1 - p * 0.88;
    ojoI.globo.scale.y = sy;
    ojoD.globo.scale.y = sy;
    ojoI.iris.scale.y = sy;
    ojoD.iris.scale.y = sy;
    ojoI.pupila.scale.y = sy;
    ojoD.pupila.scale.y = sy;
    ojoI.parpado.position.y = lerp(0.16, 0.02, p);
    ojoD.parpado.position.y = lerp(0.16, 0.02, p);
    ojoI.parpado.scale.y = lerp(0.12, 1.1, p);
    ojoD.parpado.scale.y = lerp(0.12, 1.1, p);
  }

  function mirar(t: number) {
    const ox = Math.sin(t * 0.7) * 0.035;
    const oy = Math.sin(t * 0.45) * 0.02;
    ojoI.iris.position.x = -0.02 + ox;
    ojoD.iris.position.x = 0.02 + ox;
    ojoI.pupila.position.x = -0.02 + ox;
    ojoD.pupila.position.x = 0.02 + ox;
    ojoI.iris.position.y = -0.02 + oy;
    ojoD.iris.position.y = -0.02 + oy;
  }

  function actualizar(dt: number) {
    elapsed += dt;
    parpadearSiToca(dt);
    mirar(elapsed);

    if (modo === "quieto") {
      const breath = Math.sin(elapsed * 2.1);
      cuerpoGrupo.scale.set(1 + breath * 0.012, 1 + breath * 0.03, 1 + breath * 0.012);
      cuerpoGrupo.position.y = rest.cuerpoY + breath * 0.012;
      cuerpoGrupo.rotation.z = lerp(cuerpoGrupo.rotation.z, 0, 0.12);
      cuerpoGrupo.rotation.x = lerp(cuerpoGrupo.rotation.x, 0, 0.12);
      cabeza.rotation.x = Math.sin(elapsed * 1.4) * 0.03;
      cabeza.rotation.y = Math.sin(elapsed * 0.6) * 0.06;
      saco.scale.set(1 + breath * 0.08, 1 + breath * 0.16, 1 + breath * 0.06);
      pataDI.rotation.x = lerp(pataDI.rotation.x, 0, 0.14);
      pataDD.rotation.x = lerp(pataDD.rotation.x, 0, 0.14);
      pataTI.rotation.x = lerp(pataTI.rotation.x, 0, 0.14);
      pataTD.rotation.x = lerp(pataTD.rotation.x, 0, 0.14);
      pataDI.rotation.z = lerp(pataDI.rotation.z, 0, 0.14);
      pataDD.rotation.z = lerp(pataDD.rotation.z, 0, 0.14);
      sapo.position.y = lerp(sapo.position.y, 0, 0.16);
      sapo.rotation.z = lerp(sapo.rotation.z, 0, 0.12);
      sombra.scale.setScalar(lerp(sombra.scale.x, 1, 0.16));
      (sombra.material as THREE.MeshBasicMaterial).opacity = lerp(
        (sombra.material as THREE.MeshBasicMaterial).opacity,
        0.28,
        0.16,
      );
    } else if (modo === "caminar") {
      const w = elapsed * 7.2;
      const paso = Math.sin(w);
      const paso2 = Math.sin(w + Math.PI);
      pataDI.rotation.x = paso * 0.7;
      pataDD.rotation.x = paso2 * 0.7;
      pataTI.rotation.x = paso2 * 0.45;
      pataTD.rotation.x = paso * 0.45;
      pataDI.rotation.z = Math.sin(w) * 0.08;
      pataDD.rotation.z = Math.sin(w + Math.PI) * 0.08;
      cuerpoGrupo.position.y = rest.cuerpoY + Math.abs(Math.sin(w)) * 0.09;
      cuerpoGrupo.rotation.z = paso * 0.1;
      cuerpoGrupo.rotation.x = Math.sin(w * 2) * 0.04;
      cabeza.rotation.y = paso * 0.12;
      cabeza.rotation.x = 0.05;
      saco.scale.setScalar(1);
      cuerpoGrupo.scale.set(1, 1 + Math.abs(Math.sin(w)) * 0.02, 1);
      sapo.position.y = Math.abs(Math.sin(w)) * 0.04;
      sapo.rotation.z = paso * 0.04;
      sombra.scale.set(1.05, 0.9, 1);
    } else if (modo === "saltar") {
      tSalto += dt;
      const p = tSalto / DURACION_SALTO;

      if (p < 0.18) {
        const c = Math.sin((p / 0.18) * Math.PI);
        cuerpoGrupo.scale.set(1 + c * 0.16, 1 - c * 0.28, 1 + c * 0.12);
        cuerpoGrupo.position.y = rest.cuerpoY - c * 0.16;
        pataDI.rotation.x = c * 0.55;
        pataDD.rotation.x = c * 0.55;
        pataTI.rotation.x = -c * 0.35;
        pataTD.rotation.x = -c * 0.35;
        cabeza.rotation.x = c * 0.2;
        sapo.position.y = 0;
        sombra.scale.setScalar(1 + c * 0.15);
      } else if (p < 0.88) {
        const air = (p - 0.18) / 0.7;
        const h = Math.sin(air * Math.PI);
        const stretch = air < 0.5 ? suave(air * 2) : suave((1 - air) * 2);
        sapo.position.y = h * 2.35;
        cuerpoGrupo.scale.set(1 - stretch * 0.1, 1 + stretch * 0.22, 1 - stretch * 0.08);
        cuerpoGrupo.position.y = rest.cuerpoY;
        pataDI.rotation.x = lerp(0.2, -0.7, stretch);
        pataDD.rotation.x = lerp(0.2, -0.7, stretch);
        pataTI.rotation.x = lerp(-0.1, 0.55, stretch);
        pataTD.rotation.x = lerp(-0.1, 0.55, stretch);
        cabeza.rotation.x = -stretch * 0.15;
        cuerpoGrupo.rotation.x = -h * 0.08;
        const sh = 1 - h * 0.55;
        sombra.scale.set(sh, sh, 1);
        (sombra.material as THREE.MeshBasicMaterial).opacity = 0.28 * (1 - h * 0.7);
      } else if (p < 1) {
        const land = suave((p - 0.88) / 0.12);
        const squash = Math.sin(land * Math.PI);
        sapo.position.y = 0;
        cuerpoGrupo.scale.set(1 + squash * 0.18, 1 - squash * 0.24, 1 + squash * 0.12);
        cuerpoGrupo.position.y = rest.cuerpoY - squash * 0.1;
        pataDI.rotation.x = (1 - land) * -0.3 + squash * 0.25;
        pataDD.rotation.x = (1 - land) * -0.3 + squash * 0.25;
        pataTI.rotation.x = (1 - land) * 0.2;
        pataTD.rotation.x = (1 - land) * 0.2;
        cabeza.rotation.x = squash * 0.12;
        sombra.scale.setScalar(1 + squash * 0.2);
        (sombra.material as THREE.MeshBasicMaterial).opacity = 0.28;
      } else {
        modo = "quieto";
        tSalto = 0;
      }
    }
  }

  torso.onBeforeRender = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    actualizar(dt);
  };

  sapo.caminar = () => {
    modo = "caminar";
  };

  sapo.saltar = () => {
    modo = "saltar";
    tSalto = 0;
  };

  sapo.quedarseQuieto = () => {
    modo = "quieto";
    tSalto = 0;
  };

  return sapo;
}

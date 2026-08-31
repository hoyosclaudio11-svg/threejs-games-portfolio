import * as THREE from 'three'
import { clamp, easeInOut } from './types'

/**
 * Avatar low-poly 100% procedural: torso, extremidades pivotadas,
 * cabeza con ojos emisivos y un anillo de "aura" bajo los pies.
 * Las poses son keyframes de rotación por extremidad con easing.
 *
 * Convención: el avatar mira hacia +Z. Rotaciones de brazos/piernas
 * sobre X negativa = hacia adelante, positiva = hacia atrás.
 */

interface PoseAnim {
  armL: [number, number, number]
  armR: [number, number, number]
  legL: [number, number, number]
  legR: [number, number, number]
  head: [number, number, number]
  torso: [number, number, number]
  spin: number   // rotación completa del cuerpo durante la pose (rad)
  bob: number    // amplitud del salto
  crouch: number // agachado
}

const REST: PoseAnim = {
  armL: [0, 0, 0.06], armR: [0, 0, -0.06],
  legL: [0, 0, 0], legR: [0, 0, 0],
  head: [0, 0, 0], torso: [0, 0, 0],
  spin: 0, bob: 0, crouch: 0,
}

/** Animación por id de pose (ids definidos en types.ts). */
const ANIMS: Record<string, PoseAnim> = {
  mirada: {
    armL: [-2.3, 0, 1.1], armR: [-2.3, 0, -1.1],
    legL: [0, 0, 0], legR: [0, 0, 0],
    head: [0.18, 0, 0], torso: [0, 0, 0],
    spin: 0, bob: 0.05, crouch: 0,
  },
  flex: {
    armL: [-2.75, 0.35, 0.7], armR: [-2.75, -0.35, -0.7],
    legL: [0, 0.15, 0], legR: [0, -0.15, 0],
    head: [-0.12, 0, 0], torso: [-0.3, 0, 0],
    spin: 0, bob: 0.12, crouch: 0,
  },
  final: {
    armL: [-2.8, 0, 1.2], armR: [-2.8, 0, -1.2],
    legL: [0, 0, 0.2], legR: [0, 0, -0.2],
    head: [0, 0, 0], torso: [-0.15, 0, 0],
    spin: Math.PI * 2, bob: 0.2, crouch: 0.1,
  },
  dab: {
    armL: [0.5, 0.7, 0.5], armR: [-2.5, 0.4, -1.3],
    legL: [0, 0, 0], legR: [0.15, 0, 0],
    head: [-0.5, 0, 0.3], torso: [-0.45, 0, 0],
    spin: 0, bob: 0.08, crouch: 0.05,
  },
  esgrima: {
    armL: [-1.5, 0, 0.15], armR: [1.1, 0, 0.1],
    legL: [-0.9, 0, 0], legR: [0.7, 0, 0],
    head: [0, 0, 0], torso: [0.55, 0, 0],
    spin: 0, bob: 0.03, crouch: 0.22,
  },
  rugido: {
    armL: [-2.5, 0.4, 1.0], armR: [-2.5, -0.4, -1.0],
    legL: [0, 0, 0.2], legR: [0, 0, -0.2],
    head: [-0.4, 0, 0], torso: [-0.28, 0, 0],
    spin: 0, bob: 0.18, crouch: 0,
  },
}

export class Avatar {
  readonly group = new THREE.Group()

  private body = new THREE.Group()
  private armL: THREE.Group
  private armR: THREE.Group
  private legL: THREE.Group
  private legR: THREE.Group
  private torsoG: THREE.Group
  private headG: THREE.Group
  private ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private eyeMat: THREE.MeshStandardMaterial
  private bodyMat: THREE.MeshStandardMaterial
  private flash = 0
  private walkPhase = 0

  constructor(primary: number, accent: number, skin: number) {
    const mk = (w: number, h: number, d: number, color: number) =>
      new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true })
      )
    const shadow = (m: THREE.Mesh) => {
      m.castShadow = true
      m.receiveShadow = true
      return m
    }

    const hipY = 0.62

    // Piernas (pivote en la cadera)
    const mkLeg = (x: number) => {
      const g = new THREE.Group()
      g.position.set(x, hipY, 0)
      const leg = shadow(mk(0.19, 0.55, 0.19, primary))
      leg.position.y = -0.27
      const foot = shadow(mk(0.2, 0.12, 0.34, accent))
      foot.position.y = -0.55
      g.add(leg, foot)
      return g
    }
    this.legL = mkLeg(-0.17)
    this.legR = mkLeg(0.17)

    // Torso
    this.torsoG = new THREE.Group()
    const hip = shadow(mk(0.5, 0.26, 0.34, accent))
    hip.position.y = hipY + 0.1
    const chest = shadow(mk(0.64, 0.62, 0.36, primary))
    chest.position.y = hipY + 0.52
    const belt = shadow(mk(0.54, 0.08, 0.38, 0x1f2937))
    belt.position.y = hipY + 0.25
    this.torsoG.add(hip, chest, belt)
    this.bodyMat = chest.material as THREE.MeshStandardMaterial

    // Cabeza + ojos emisivos
    this.headG = new THREE.Group()
    this.headG.position.y = hipY + 1.02
    const head = shadow(mk(0.46, 0.44, 0.44, skin))
    head.position.y = 0.18
    const hair = shadow(mk(0.5, 0.16, 0.5, accent))
    hair.position.y = 0.44
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    })
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMat)
    eyeL.position.set(-0.12, 0.22, 0.21)
    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMat)
    eyeR.position.set(0.12, 0.22, 0.21)
    this.headG.add(head, hair, eyeL, eyeR)

    // Brazos (pivote en el hombro)
    const shY = hipY + 0.72
    const mkArm = (x: number) => {
      const g = new THREE.Group()
      g.position.set(x, shY, 0)
      const arm = shadow(mk(0.16, 0.58, 0.16, primary))
      arm.position.y = -0.26
      const hand = shadow(mk(0.17, 0.14, 0.17, skin))
      hand.position.y = -0.56
      g.add(arm, hand)
      return g
    }
    this.armL = mkArm(-0.42)
    this.armR = mkArm(0.42)

    this.body.add(this.legL, this.legR, this.torsoG, this.headG, this.armL, this.armR)
    this.body.position.y = -0.07 // pies a ras del piso

    // Anillo de carga de aura (visible mientras se posa)
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 32),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false })
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.y = 0.02
    this.ring.visible = false

    this.group.add(this.body, this.ring)
  }

  /**
   * Avanza la animación.
   * @param poseId id de la pose en curso (null = caminar/idle)
   * @param poseT01 progreso normalizado de la pose (0..1)
   * @param charge ratio de carga acumulada respecto al aura base
   */
  update(dt: number, moving: boolean, speed: number, poseId: string | null, poseT01: number, charge: number) {
    const anim = poseId ? ANIMS[poseId] : null
    const t01 = clamp(poseT01, 0, 1)
    const ease = easeInOut(t01)
    const k = 1 - Math.exp(-12 * dt)

    const setRot = (g: THREE.Object3D, r: [number, number, number]) => {
      g.rotation.x += (r[0] - g.rotation.x) * k
      g.rotation.y += (r[1] - g.rotation.y) * k
      g.rotation.z += (r[2] - g.rotation.z) * k
    }

    if (anim) {
      // Pose en curso: interpolar hacia los keyframes
      setRot(this.armL, anim.armL)
      setRot(this.armR, anim.armR)
      setRot(this.legL, anim.legL)
      setRot(this.legR, anim.legR)
      setRot(this.headG, anim.head)
      setRot(this.torsoG, anim.torso)
      this.body.rotation.y = anim.spin * ease
    } else {
      // Caminata + respiración en reposo
      this.walkPhase += dt * speed * 2.6
      const sw = moving ? Math.sin(this.walkPhase) * 0.55 * Math.min(1, speed / 4) : 0
      setRot(this.legL, [sw, 0, 0])
      setRot(this.legR, [-sw, 0, 0])
      setRot(this.armL, [-sw * 0.7, 0, 0.06])
      setRot(this.armR, [sw * 0.7, 0, -0.06])
      setRot(this.headG, [0, 0, 0])
      setRot(this.torsoG, [0, 0, 0])
      this.body.rotation.y += (REST.spin - this.body.rotation.y) * k
    }

    // Salto durante la pose + agachado
    const bob = anim ? Math.abs(Math.sin(t01 * Math.PI)) * anim.bob : Math.sin(this.walkPhase * 0.5) * 0.02
    this.body.position.y = -0.07 + bob - (anim ? anim.crouch : 0) * 0.35

    // Flash al completar poses / ojos brillantes al posar
    this.flash = Math.max(0, this.flash - dt * 2.5)
    this.bodyMat.emissive.set(0xffffff).multiplyScalar(this.flash)
    this.eyeMat.emissiveIntensity = anim ? 2.6 : 0.5

    // Anillo de aura: escala y opacidad según la carga
    const c = clamp(charge, 0, 1.6)
    if (c > 0.02) {
      this.ring.visible = true
      this.ring.material.opacity = 0.25 + Math.min(c, 1) * 0.55
      this.ring.scale.setScalar(0.9 + c * 0.7)
      this.ring.rotation.z += dt * 2.5
    } else {
      this.ring.visible = false
    }
  }

  /** Destello de material al completar una pose. */
  pulse() {
    this.flash = 1
  }

  /** Devuelve el grupo a su estado neutral (para rematches). */
  reset() {
    const zero = (g: THREE.Object3D) => g.rotation.set(0, 0, 0)
    zero(this.armL); zero(this.armR); zero(this.legL); zero(this.legR)
    zero(this.headG); zero(this.torsoG); zero(this.body)
    this.ring.visible = false
    this.flash = 0
  }
}

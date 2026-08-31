import * as THREE from 'three'
import { ARENA_RADIUS, CENTER_RADIUS } from './types'

export interface Pillar {
  x: number
  z: number
  r: number
}

/**
 * Escenario circular: piso, anillo central (zona de +25% de aura),
 * borde, pilares con colisión y público low-poly animado por instancias.
 */
export class Arena {
  readonly group = new THREE.Group()

  private pillars: Pillar[] = []
  private crowd: THREE.InstancedMesh
  private crowdPhases: Float32Array
  private centerRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private cheer = 0
  private t = 0

  constructor() {
    // Piso cilíndrico
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 0.8, 1.4, 64),
      new THREE.MeshStandardMaterial({ color: 0x191534, roughness: 0.9, flatShading: true })
    )
    floor.position.y = -0.7
    floor.receiveShadow = true
    this.group.add(floor)

    // Anillo central: el "escenario" que multiplica la aura
    this.centerRing = new THREE.Mesh(
      new THREE.RingGeometry(CENTER_RADIUS - 0.25, CENTER_RADIUS, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55, depthWrite: false })
    )
    this.centerRing.rotation.x = -Math.PI / 2
    this.centerRing.position.y = 0.03
    this.group.add(this.centerRing)

    // Borde del escenario
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(ARENA_RADIUS - 0.5, ARENA_RADIUS - 0.3, 96),
      new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.8 })
    )
    rim.rotation.x = -Math.PI / 2
    rim.position.y = 0.03
    this.group.add(rim)

    // Pilares (obstáculos con colisión)
    const pillarDefs: [number, number][] = [
      [4.8, 4.8], [-4.8, 4.8], [4.8, -4.8], [-4.8, -4.8], [0, 6.5], [0, -6.5],
    ]
    pillarDefs.forEach(([x, z]) => this.addPillar(x, z))

    // Público: 110 espectadores instanciados en anillo
    const COUNT = 110
    this.crowd = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.3, 0.8, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true }),
      COUNT
    )
    this.crowdPhases = new Float32Array(COUNT)
    const palette = [0x60a5fa, 0xf472b6, 0xfbbf24, 0x34d399, 0xa78bfa, 0xf87171]
    const tmp = new THREE.Object3D()
    const R = ARENA_RADIUS + 3
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2
      const x = Math.cos(a) * R
      const z = Math.sin(a) * R
      tmp.position.set(x, 0.55, z)
      tmp.rotation.set(0, Math.atan2(-x, -z), 0) // mirando al centro
      tmp.scale.setScalar(0.85 + ((i * 37) % 10) / 18)
      tmp.updateMatrix()
      this.crowd.setMatrixAt(i, tmp.matrix)
      this.crowd.setColorAt(i, new THREE.Color(palette[i % palette.length]))
      this.crowdPhases[i] = (i * 0.61) % (Math.PI * 2)
    }
    this.group.add(this.crowd)
  }

  /** Obstáculos (usados también por la IA para evitarlos). */
  get obstacles(): Pillar[] {
    return this.pillars
  }

  private addPillar(x: number, z: number) {
    const r = 1.05
    this.pillars.push({ x, z, r })
    const g = new THREE.Group()
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 1.12, 2.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x2c2450, roughness: 0.5, flatShading: true })
    )
    col.position.y = 1.3
    col.castShadow = true
    col.receiveShadow = true
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(r + 0.12, 0.07, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6 })
    )
    glow.rotation.x = Math.PI / 2
    glow.position.y = 0.12
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(r + 0.15, r + 0.15, 0.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6 })
    )
    top.position.y = 2.62
    g.position.set(x, 0, z)
    g.add(col, glow, top)
    this.group.add(g)
  }

  /**
   * Detección de colisiones círculo-contra-escenario:
   * bordes circulares y pilares. Modifica `pos` y amortigua `vel`.
   */
  collide(pos: THREE.Vector3, radius: number, vel?: THREE.Vector3) {
    // Borde del escenario
    const len = Math.hypot(pos.x, pos.z)
    const max = ARENA_RADIUS - radius
    if (len > max && len > 0.0001) {
      const nx = pos.x / len
      const nz = pos.z / len
      pos.x = nx * max
      pos.z = nz * max
      if (vel) {
        const dot = vel.x * nx + vel.z * nz
        if (dot > 0) {
          vel.x -= nx * dot * 1.4
          vel.z -= nz * dot * 1.4
        }
      }
    }
    // Pilares
    for (const p of this.pillars) {
      const dx = pos.x - p.x
      const dz = pos.z - p.z
      const d = Math.hypot(dx, dz)
      const min = p.r + radius
      if (d < min && d > 0.0001) {
        const nx = dx / d
        const nz = dz / d
        pos.x = p.x + nx * min
        pos.z = p.z + nz * min
        if (vel) {
          const dot = vel.x * nx + vel.z * nz
          if (dot > 0) {
            vel.x -= nx * dot * 1.3
            vel.z -= nz * dot * 1.3
          }
        }
      }
    }
  }

  /** Animación: pulso del anillo central y salto del público según el ánimo. */
  update(dt: number, cheer: number) {
    this.t += dt
    this.cheer += (cheer - this.cheer) * Math.min(1, dt * 3)

    this.centerRing.material.opacity = 0.45 + Math.sin(this.t * 2.2) * 0.18

    const amp = 0.05 + this.cheer * 0.35
    const speed = 2 + this.cheer * 4
    const tmp = new THREE.Object3D()
    for (let i = 0; i < this.crowd.count; i++) {
      this.crowd.getMatrixAt(i, tmp.matrix)
      tmp.position.setFromMatrixPosition(tmp.matrix)
      tmp.position.y = 0.55 + Math.abs(Math.sin(this.t * speed + this.crowdPhases[i])) * amp
      tmp.rotation.x = Math.sin(this.t * 3 + this.crowdPhases[i]) * amp * 0.8
      tmp.updateMatrix()
      this.crowd.setMatrixAt(i, tmp.matrix)
    }
    this.crowd.instanceMatrix.needsUpdate = true
  }
}

import * as THREE from 'three'

interface Burst {
  pts: THREE.Points
  vel: Float32Array
  life: number
  max: number
}

interface Shock {
  mesh: THREE.Mesh
  life: number
  max: number
}

const N = 220 // partículas orbitales por jugador

/**
 * Efectos de partículas:
 *  - nubes orbitales de "aura" por jugador (se intensifican al posar)
 *  - ráfagas al completar una pose
 *  - ondas de choque en los contraataques
 */
export class AuraFX {
  private group = new THREE.Group()
  private pools: {
    pts: THREE.Points
    pos: Float32Array
    ang: Float32Array
    spd: Float32Array
    rad: Float32Array
    ph: Float32Array
  }[] = []
  private active = [0.3, 0.3]
  private bursts: Burst[] = []
  private shocks: Shock[] = []

  constructor(scene: THREE.Scene, colors: number[]) {
    scene.add(this.group)
    this.pools = colors.map((color) => {
      const pos = new Float32Array(N * 3)
      const ang = new Float32Array(N)
      const spd = new Float32Array(N)
      const rad = new Float32Array(N)
      const ph = new Float32Array(N)
      for (let i = 0; i < N; i++) {
        ang[i] = Math.random() * Math.PI * 2
        spd[i] = 0.5 + Math.random() * 1.5
        rad[i] = 0.4 + Math.random() * 1.3
        ph[i] = Math.random() * Math.PI * 2
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({
        color,
        size: 0.13,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const pts = new THREE.Points(geo, mat)
      this.group.add(pts)
      return { pts, pos, ang, spd, rad, ph }
    })
  }

  /** 0.3 = ambiente, 1 = pose en curso. */
  setActive(pi: number, v: number) {
    this.active[pi] = v
  }

  update(dt: number, time: number, p0: THREE.Vector3, p1: THREE.Vector3) {
    const players = [p0, p1]
    this.pools.forEach((pool, pi) => {
      const a = this.active[pi]
      for (let i = 0; i < N; i++) {
        pool.ang[i] += dt * (0.8 + pool.spd[i] * a * 3)
        const r = pool.rad[i] * (1.1 - a * 0.55)
        pool.pos[i * 3] = players[pi].x + Math.cos(pool.ang[i]) * r
        pool.pos[i * 3 + 1] = 0.4 + Math.sin(time * pool.spd[i] * 2 + pool.ph[i]) * 0.4 + a * 0.9
        pool.pos[i * 3 + 2] = players[pi].z + Math.sin(pool.ang[i]) * r
      }
      pool.pts.geometry.attributes.position.needsUpdate = true
    })
    this.updateBursts(dt)
    this.updateShocks(dt)
  }

  /** Ráfaga de partículas (completar pose, celebración). */
  burst(pos: THREE.Vector3, color: number, count = 26, spread = 5) {
    const positions = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y + 1
      positions[i * 3 + 2] = pos.z
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * spread
      vel[i * 3] = Math.cos(a) * s * (0.4 + Math.random())
      vel[i * 3 + 1] = 3 + Math.random() * 6
      vel[i * 3 + 2] = Math.sin(a) * s * (0.4 + Math.random())
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.16,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const pts = new THREE.Points(geo, mat)
    this.group.add(pts)
    this.bursts.push({ pts, vel, life: 1, max: 1 })
  }

  private updateBursts(dt: number) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i]
      b.life -= dt
      const attr = b.pts.geometry.attributes.position as THREE.BufferAttribute
      const arr = attr.array as Float32Array
      for (let j = 0; j < arr.length / 3; j++) {
        b.vel[j * 3 + 1] -= 12 * dt // gravedad
        arr[j * 3] += b.vel[j * 3] * dt
        arr[j * 3 + 1] = Math.max(0.05, arr[j * 3 + 1] + b.vel[j * 3 + 1] * dt)
        arr[j * 3 + 2] += b.vel[j * 3 + 2] * dt
      }
      attr.needsUpdate = true
      ;(b.pts.material as THREE.PointsMaterial).opacity = Math.max(0, b.life / b.max)
      if (b.life <= 0) {
        this.group.remove(b.pts)
        b.pts.geometry.dispose()
        ;(b.pts.material as THREE.Material).dispose()
        this.bursts.splice(i, 1)
      }
    }
  }

  /** Onda expansiva en el piso (choques y poses grandes). */
  shock(pos: THREE.Vector3, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1, 48),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(pos.x, 0.08, pos.z)
    this.group.add(mesh)
    this.shocks.push({ mesh, life: 0.55, max: 0.55 })
  }

  private updateShocks(dt: number) {
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      const s = this.shocks[i]
      s.life -= dt
      const k = 1 - s.life / s.max
      s.mesh.scale.setScalar(1 + k * 7)
      ;(s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, s.life / s.max) * 0.9
      if (s.life <= 0) {
        this.group.remove(s.mesh)
        s.mesh.geometry.dispose()
        ;(s.mesh.material as THREE.Material).dispose()
        this.shocks.splice(i, 1)
      }
    }
  }

  /** Limpia efectos transitorios entre partidas. */
  clear() {
    for (const b of this.bursts) {
      this.group.remove(b.pts)
      b.pts.geometry.dispose()
      ;(b.pts.material as THREE.Material).dispose()
    }
    this.bursts = []
    for (const s of this.shocks) {
      this.group.remove(s.mesh)
      s.mesh.geometry.dispose()
      ;(s.mesh.material as THREE.Material).dispose()
    }
    this.shocks = []
  }
}

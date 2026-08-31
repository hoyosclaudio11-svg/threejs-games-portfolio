import * as THREE from 'three'

/**
 * Cámara en tercera persona dinámica:
 *  - encuadra el punto medio entre ambos jugadores
 *  - el zoom depende de la distancia entre ellos
 *  - orbita lentamente como "attract mode" en el menú
 *  - sacudida (shake) en choques y poses pesadas
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera

  private az = 0          // acimut (órbita)
  private dist = 16
  private height = 11
  private shake = 0

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 300)
    this.camera.position.set(0, 11, 16)
    this.camera.lookAt(0, 1, 0)
  }

  addShake(v: number) {
    this.shake = Math.min(1, this.shake + v)
  }

  update(dt: number, mid: THREE.Vector3, playersDist: number, idle: boolean) {
    if (idle) {
      // Attract mode: órbita suave alrededor de la arena
      this.az += dt * 0.18
      this.dist += (17 - this.dist) * Math.min(1, dt * 2)
      this.height += (11 - this.height) * Math.min(1, dt * 2)
      mid.set(0, 0, 0)
    } else {
      this.az += (0 - this.az) * Math.min(1, dt * 2.5)
      this.dist += (11 + playersDist * 0.5 - this.dist) * Math.min(1, dt * 3)
      this.height += (8.5 + playersDist * 0.35 - this.height) * Math.min(1, dt * 3)
    }

    this.camera.position.set(
      mid.x + Math.sin(this.az) * this.dist,
      this.height,
      mid.z + Math.cos(this.az) * this.dist
    )

    this.shake = Math.max(0, this.shake - dt * 2.2)
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.5
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.4
      this.camera.position.z += (Math.random() - 0.5) * this.shake * 0.5
    }

    this.camera.lookAt(mid.x, 1.2, mid.z)
  }
}

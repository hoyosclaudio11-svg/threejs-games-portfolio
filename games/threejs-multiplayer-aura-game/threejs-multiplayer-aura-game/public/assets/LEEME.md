# assets/ — Placeholders de recursos gráficos

El juego AURA FARM 1v1 es **100% procedural**: todos los modelos low-poly
(personajes, pilares, público) y las animaciones de poses se generan con
geometrías y materiales simples de three.js, sin depender de archivos externos.

## Cómo integrar assets propios (opcional)

Si querés reemplazar los avatares procedurales por modelos GLTF/GLB y texturas:

1. Colocá los archivos en esta carpeta, por ejemplo:
   - `assets/models/avatar_p1.glb`
   - `assets/models/avatar_p2.glb`
   - `assets/textures/aura_particle.png` (para las partículas de aura)
2. Instalá el loader: `npm i three/examples/jsm/loaders/GLTFLoader.js`
3. En `src/game/Avatar.ts` reemplazá la construcción de geometrías por:

```js
const loader = new GLTFLoader();
loader.load('/assets/models/avatar_p1.glb', (gltf) => {
  // reemplazar group por gltf.scene y mapear huesos a las animaciones de poses
});
```

Las poses (`ANIMS` en `Avatar.ts`) mapean ids de poses a rotaciones por hueso;
con un rig estándar solo hay que conectar cada keyframe a los huesos del GLTF.

Este README cumple el rol de *placeholder* pedido en la consigna: la carpeta
`assets/` queda lista para el despliegue estático sin romper la build.

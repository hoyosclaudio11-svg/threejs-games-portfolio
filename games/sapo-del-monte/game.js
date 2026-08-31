// game.js
// Lógica principal en 3D para "Sapo del Monte: Una Aventura Chaqueña" - Edición Mundo Abierto

// --- Configuración y Variables de Estado ---
let scene, camera, renderer, clock, starField, skyDome;

// Post-Processing
let composer, bloomPass, vignettePass;

// Sistemas de Partículas y Efectos Visuales
let grassMesh; // InstancedMesh para pasto
let lowFogPlanes = []; // Planos de neblina baja
let fallingLeaves = []; // Hojas cayendo
let shootingStarSystem = { particles: null, active: [], lastSpawn: 0 };
let milkyWayPoints; // Vía Láctea
let moonHaloSprite; // Halo lunar
let flowerMeshes = []; // Flores del monte
let vineGroups = []; // Enredaderas
let smallRocks = []; // Piedras decorativas
let dustParticles; // Partículas de polvo/esporas
let gameState = 'START'; // START, PLAYING, DIALOGUE, GAMEOVER, VICTORY

// Físicas y Jugador (Mundo Abierto)
const GRAVITY = -32;
const JUMP_FORCE = 13;
const MOVE_SPEED = 8;
const player = {
    x: -140, y: 0.1, z: -140, // Empezar en la esquina Sudoeste (Zona Segura inicial)
    vx: 0, vy: 0, vz: 0,
    width: 2, height: 1.5,
    isGrounded: false,
    isHidden: false,
    energy: 100,
    water: 100,
    maxWater: 100,
    score: 0,
    mesh: null,
    cameraAngle: 0.8, // Ángulo diagonal al inicio para ver el nivel
    cameraPitch: 0.35,
    lastCheckpoint: { x: -140, y: 0.1, z: -140 },
    isHidingArea: false,
    jumpCharge: 0,
    isChargingJump: false
};

// NPCs y Misiones (Mundo Abierto con Coordenadas Clave)
let npcs = {};
let activeQuest = null;
const quests = {
    tatu: {
        id: 'tatu',
        title: 'Las Vainas del Tatú',
        textNeeded: 'Busca 3 vainas de algarrobo doradas entre los cactus del Sudoeste.',
        needed: 3,
        current: 0,
        status: 'locked'
    },
    carpincho: {
        id: 'carpincho',
        title: 'Agua para el Carpincho',
        textNeeded: 'Consigue 3 hojas de totora medicinal del charco del Norte.',
        needed: 3,
        current: 0,
        status: 'locked'
    },
    yacare: {
        id: 'yacare',
        title: 'Liberar al Yacaré',
        textNeeded: 'Escala las rocas del Este y empuja la gran rama de quebracho.',
        needed: 1,
        current: 0,
        status: 'locked'
    }
};

// Enemigo (Lechuza - IA Dinámica de Mundo Abierto)
const owl = {
    active: true,
    x: -50, y: 22, z: -50,
    angle: 0,
    patrolCenter: { x: -50, z: -50 },
    patrolRadius: 30,
    speed: 1.2,
    visionRadius: 12,
    detectionLevel: 0, // 0 a 100
    mesh: null,
    spotlight: null,
    visionDisc: null,
    state: 'patrol',
    swoopTimer: 0,
    targetPos: new THREE.Vector3()
};

// Grupos de la Escena
let terrainGroup, environmentGroup, npcGroup, itemGroup, obstacleGroup, helperGroup;
let platforms = [];
let cactusList = [];
let ferns = [];
let logs = [];
let waterPuddles = [];
let questItems = [];
let fireflies = [];
let barrierTatu, barrierCarpincho, barrierYacare;
let interactiveBranch;
let branchPushed = false;

// Teclado e Interacciones
const keys = {};
let currentInteractNPC = null;

// Elementos de la UI
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const victoryScreen = document.getElementById('victory-screen');
const hud = document.getElementById('hud');
const energyBar = document.getElementById('energy-bar');
const waterBar = document.getElementById('water-bar');
const scoreDisplay = document.getElementById('score-display');
const checkpointDisplay = document.getElementById('checkpoint-display');
const activeQuestTitle = document.getElementById('active-quest-title');
const questProgressText = document.getElementById('quest-progress-text');
const questProgressBar = document.getElementById('quest-progress-bar');
const interactionPrompt = document.getElementById('interaction-prompt');
const interactionText = document.getElementById('interaction-text');
const detectionMeter = document.getElementById('detection-meter');
const detectionBar = document.getElementById('detection-bar');
const hidingIndicator = document.getElementById('hiding-indicator');

// Pantalla de Diálogo
const dialogueScreen = document.getElementById('dialogue-screen');
const npcNameLabel = document.getElementById('npc-name');
const dialogueTextLabel = document.getElementById('dialogue-text');
const btnDialogueAction = document.getElementById('btn-dialogue-action');
const btnDialogueClose = document.getElementById('btn-dialogue-close');
const npcAvatar = document.getElementById('npc-avatar');

// --- Event Listeners de UI ---
document.getElementById('btn-start').addEventListener('click', () => { audio.init(); startGame(); });
document.getElementById('btn-respawn').addEventListener('click', respawn);
document.getElementById('btn-restart').addEventListener('click', startGame);

btnDialogueClose.addEventListener('click', closeDialogue);
btnDialogueAction.addEventListener('click', handleDialogueAction);

// Controles por Teclado
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE') {
        interactWithNPC();
    }
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Ratón para rotar cámara
let isMouseDown = false;
let previousMousePosition = { x: 0, y: 0 };

window.addEventListener('mousedown', e => {
    isMouseDown = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mousemove', e => {
    if (!isMouseDown || gameState !== 'PLAYING') return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    player.cameraAngle -= deltaX * 0.005;
    player.cameraPitch = Math.max(0.1, Math.min(1.2, player.cameraPitch + deltaY * 0.005));
    
    previousMousePosition = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mouseup', () => { isMouseDown = false; });
window.addEventListener('mouseleave', () => { isMouseDown = false; });

// Soporte Táctil
window.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        isMouseDown = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
});
window.addEventListener('touchmove', e => {
    if (!isMouseDown || gameState !== 'PLAYING' || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;
    
    player.cameraAngle -= deltaX * 0.008;
    player.cameraPitch = Math.max(0.1, Math.min(1.2, player.cameraPitch + deltaY * 0.008));
    
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
window.addEventListener('touchend', () => { isMouseDown = false; });

// --- Lógica de Inicialización de Tres.js ---
function initThree() {
    const container = document.getElementById('canvas-container');
    container.innerHTML = '';
    
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    
    // Cielo azul medianoche profundo con gradiente atmosférico
    scene.background = new THREE.Color(0x030810);
    scene.fog = new THREE.FogExp2(0x060a14, 0.0028); // Niebla exponencial para profundidad atmosférica natural
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    
    // Luces: HemisphereLight con tonos violeta/azul para cielo nocturno dramático
    const hemiLight = new THREE.HemisphereLight(0x1a2844, 0x0c1218, 0.6);
    scene.add(hemiLight);
    
    // Luz ambiente cálida sutil a nivel del suelo (simula reflejo de tierra)
    const groundWarmLight = new THREE.PointLight(0x443322, 0.3, 300);
    groundWarmLight.position.set(0, 2, 0);
    scene.add(groundWarmLight);
    
    // Luz de relleno azul fría desde el lado opuesto a la luna
    const fillLight = new THREE.DirectionalLight(0x1a2a4a, 0.25);
    fillLight.position.set(100, 50, 80);
    scene.add(fillLight);
    
    const moonLight = new THREE.DirectionalLight(0x6b82a8, 1.2); // Luz de luna con mayor intensidad
    moonLight.position.set(-150, 200, -100);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048; // Sombras más nítidas
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 400;
    const d = 200; // Frustum de sombras ampliado para mundo abierto
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    moonLight.shadow.bias = -0.0006;
    scene.add(moonLight);
    
    // Agregar la gran luna llena en el cielo en la dirección del foco de luz
    const moonGeo = new THREE.SphereGeometry(14, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
        map: createMoonTexture(),
        color: 0xffffff
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    // Colocarla en la misma dirección de la luz pero a una distancia de 500 unidades
    moon.position.set(-300, 400, -200);
    
    // Halo lunar atmosférico (sprite con glow)
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const haloCtx = haloCanvas.getContext('2d');
    const haloGrad = haloCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    haloGrad.addColorStop(0, 'rgba(200, 220, 255, 0.25)');
    haloGrad.addColorStop(0.2, 'rgba(150, 180, 220, 0.12)');
    haloGrad.addColorStop(0.5, 'rgba(100, 130, 180, 0.04)');
    haloGrad.addColorStop(1, 'rgba(50, 70, 120, 0.0)');
    haloCtx.fillStyle = haloGrad;
    haloCtx.fillRect(0, 0, 256, 256);
    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.SpriteMaterial({ map: haloTexture, transparent: true, opacity: 0.8, depthWrite: false });
    moonHaloSprite = new THREE.Sprite(haloMat);
    moonHaloSprite.position.copy(moon.position);
    moonHaloSprite.scale.set(120, 120, 1);
    scene.add(moonHaloSprite);
    
    // God rays simulados — plano frente a la luna con textura radial
    const raysCanvas = document.createElement('canvas');
    raysCanvas.width = 512;
    raysCanvas.height = 512;
    const raysCtx = raysCanvas.getContext('2d');
    raysCtx.fillStyle = 'rgba(0,0,0,0)';
    raysCtx.fillRect(0, 0, 512, 512);
    for (let ray = 0; ray < 16; ray++) {
        const angle = (ray / 16) * Math.PI * 2 + Math.random() * 0.2;
        const rayGrad = raysCtx.createLinearGradient(
            256, 256,
            256 + Math.cos(angle) * 256, 256 + Math.sin(angle) * 256
        );
        rayGrad.addColorStop(0, 'rgba(180, 200, 240, 0.06)');
        rayGrad.addColorStop(0.5, 'rgba(120, 150, 200, 0.02)');
        rayGrad.addColorStop(1, 'rgba(80, 100, 150, 0.0)');
        raysCtx.fillStyle = rayGrad;
        raysCtx.beginPath();
        raysCtx.moveTo(256, 256);
        raysCtx.arc(256, 256, 256, angle - 0.08, angle + 0.08);
        raysCtx.closePath();
        raysCtx.fill();
    }
    const raysTexture = new THREE.CanvasTexture(raysCanvas);
    const raysMat = new THREE.SpriteMaterial({ map: raysTexture, transparent: true, opacity: 0.5, depthWrite: false });
    const raysSprite = new THREE.Sprite(raysMat);
    raysSprite.position.copy(moon.position).multiplyScalar(0.7);
    raysSprite.scale.set(200, 200, 1);
    scene.add(raysSprite);
    scene.add(moon);
    
    // Grupos de la escena
    terrainGroup = new THREE.Group();
    environmentGroup = new THREE.Group();
    npcGroup = new THREE.Group();
    itemGroup = new THREE.Group();
    obstacleGroup = new THREE.Group();
    helperGroup = new THREE.Group();
    
    scene.add(terrainGroup);
    scene.add(environmentGroup);
    scene.add(npcGroup);
    scene.add(itemGroup);
    scene.add(obstacleGroup);
    scene.add(helperGroup);
    
    window.addEventListener('resize', onWindowResize);
    
    // Post-Processing
    setupPostProcessing();
}

// --- Post-Processing: Bloom, Vignette y Color Grading ---
function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom — brillo sutil en objetos emisivos (luciérnagas, luna, vainas doradas)
    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.55,   // intensidad
        0.6,    // radio
        0.72    // umbral
    );
    composer.addPass(bloomPass);
    
    // Vignette + Color Grading personalizado
    const vignetteShader = {
        uniforms: {
            tDiffuse: { value: null },
            darkness: { value: 1.3 },
            offset: { value: 1.05 },
            dangerMix: { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float darkness;
            uniform float offset;
            uniform float dangerMix;
            varying vec2 vUv;
            void main() {
                vec4 texel = texture2D(tDiffuse, vUv);
                
                // Vignette circular
                vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
                float vig = 1.0 - dot(uv, uv);
                vig = clamp(pow(vig, darkness), 0.0, 1.0);
                
                // Color grading nocturno — realzar azules y verdes esmeralda
                texel.r = pow(texel.r, 1.08);
                texel.g = pow(texel.g, 0.95);
                texel.b = pow(texel.b, 0.88);
                
                // Tinte azul sutil en la vignette
                vec3 tint = vec3(0.03, 0.05, 0.12) * (1.0 - vig) * 0.5;
                texel.rgb += tint;
                
                // Efecto de peligro — aberración cromática roja sutil cuando la lechuza detecta
                if (dangerMix > 0.01) {
                    vec2 distort = (vUv - 0.5) * dangerMix * 0.008;
                    float rShift = texture2D(tDiffuse, vUv + distort).r;
                    texel.r = mix(texel.r, rShift, dangerMix * 0.6);
                    texel.rgb = mix(texel.rgb, texel.rgb * vec3(1.1, 0.85, 0.85), dangerMix * 0.3);
                }
                
                texel.rgb *= vig;
                
                // Contraste leve
                texel.rgb = (texel.rgb - 0.5) * 1.08 + 0.5;
                texel.rgb = clamp(texel.rgb, 0.0, 1.0);
                
                gl_FragColor = texel;
            }
        `
    };
    
    vignettePass = new THREE.ShaderPass(vignetteShader);
    composer.addPass(vignettePass);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
    }
    if (bloomPass) {
        bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    }
}

// --- Materiales Procedimentales con Texturas Canvas ---

// 1. Textura del Suelo (Tierra Chaqueña con grietas, maleza y senderos)
function createSoilTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Tierra base marrón seca
    ctx.fillStyle = '#362b1f';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Ruido y granulado fino
    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = 1 + Math.random() * 2;
        ctx.fillStyle = Math.random() > 0.5 ? '#423526' : '#281f15';
        ctx.fillRect(x, y, size, size);
    }
    
    // Caminos/Senderos claros marcados
    // Dibujamos senderos sinuosos conectando biomas:
    // Camino principal de Sudoeste (inicio) a Norte (Carpincho) y Este (Yacaré)
    ctx.strokeStyle = '#5a4631';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    
    const drawPath = (points, width) => {
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // Bordes de caminos (tierra más suelta)
        ctx.strokeStyle = '#4e3b28';
        ctx.lineWidth = width * 1.2;
        ctx.stroke();
        ctx.strokeStyle = '#5a4631';
    };

    // Puntos mapeados de coordenadas locales a coordenadas de textura
    // De [-220, 220] a [0, 1024]
    const mapCoords = (lx, lz) => {
        return {
            x: ((lx + 220) / 440) * 1024,
            y: ((lz + 220) / 440) * 1024
        };
    };

    // Camino de la Madriguera del Tatú (-90, -110) a la zona del Carpincho (-20, 120)
    drawPath([
        mapCoords(-140, -140),
        mapCoords(-90, -110),
        mapCoords(-65, -80),
        mapCoords(-50, -30),
        mapCoords(-30, 20),
        mapCoords(-20, 120)
    ], 30);

    // Bifurcación del Carpincho (-20, 120) al Yacaré (120, 70)
    drawPath([
        mapCoords(-20, 120),
        mapCoords(10, 110),
        mapCoords(50, 40),
        mapCoords(80, 50),
        mapCoords(120, 70)
    ], 24);

    // Bifurcación hacia la Laguna Sagrada (150, 150)
    drawPath([
        mapCoords(120, 70),
        mapCoords(135, 110),
        mapCoords(150, 150)
    ], 20);

    // Quitar sombra para el resto de elementos
    ctx.shadowBlur = 0;
    
    // Grietas de sequía (patrón de barro agrietado)
    ctx.strokeStyle = '#1a130c';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        let cx = Math.random() * 1024;
        let cy = Math.random() * 1024;
        ctx.moveTo(cx, cy);
        for (let j = 0; j < 6; j++) {
            cx += (Math.random() - 0.5) * 80;
            cy += (Math.random() - 0.5) * 80;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }
    
    // Malezas secas verdes/amarillas
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = 1.5 + Math.random() * 3.5;
        ctx.fillStyle = Math.random() > 0.4 ? '#3d472c' : '#4d4f34';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Hojarasca / Hojas secas caídas del monte chaqueño (colores ocre y marrón)
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const w = 3 + Math.random() * 5;
        const h = 1.5 + Math.random() * 2.5;
        const angle = Math.random() * Math.PI;
        ctx.fillStyle = Math.random() > 0.5 ? '#5c3d24' : '#724320';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1); // Ya cubre el mundo completo de manera alineada, por lo que quitamos el tiling excesivo
    return texture;
}

// 2. Mapa de Relieve (Bump Map) del Suelo para sombras realistas en la luna
function createSoilBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    
    // Granulado para rugosidad de tierra
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillStyle = Math.random() > 0.5 ? '#959595' : '#6b6b6b';
        ctx.fillRect(x, y, 1.5, 1.5);
    }
    
    // Grietas oscuras (bajo relieve)
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 25; i++) {
        ctx.beginPath();
        let cx = Math.random() * 256;
        let cy = Math.random() * 256;
        ctx.moveTo(cx, cy);
        for (let j = 0; j < 5; j++) {
            cx += (Math.random() - 0.5) * 45;
            cy += (Math.random() - 0.5) * 45;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}

function createSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Gradiente vertical para la bóveda del cielo
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, '#01050a'); // Cenit (muy oscuro, azul-negro)
    grad.addColorStop(0.5, '#040b15'); // Mitad
    grad.addColorStop(0.85, '#0a162a'); // Horizonte (azul medianoche profundo)
    grad.addColorStop(1.0, '#1c1b2c'); // Brillo del horizonte chaqueño (púrpura cálido tenue)
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Añadir algunas nubes del monte tenues/nebulosas procedimentales
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 500 + 100; // Solo en la mitad superior
        const rad = 150 + Math.random() * 250;
        const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, rad);
        cloudGrad.addColorStop(0, 'rgba(45, 55, 90, 0.12)');
        cloudGrad.addColorStop(0.5, 'rgba(25, 30, 50, 0.05)');
        cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Nubes más brillantes y definidas cerca del horizonte
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 300 + 500; // Cerca del horizonte
        const rad = 100 + Math.random() * 200;
        const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, rad);
        cloudGrad.addColorStop(0, 'rgba(75, 65, 90, 0.07)');
        cloudGrad.addColorStop(0.6, 'rgba(35, 40, 60, 0.02)');
        cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// 3. Textura de la Piel del Sapo (Verde con manchas y verrugas)
function createSapoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base de piel verde musgo
    ctx.fillStyle = '#2d733e';
    ctx.fillRect(0, 0, 256, 256);
    
    // Verrugas e imperfecciones
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 2.5 + Math.random() * 5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, '#60a83e'); // Centro amarillento/verde claro
        grad.addColorStop(0.6, '#236637'); // Color piel
        grad.addColorStop(1, '#164222'); // Borde sombreado oscuro
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

// 4. Mapa de Relieve (Bump Map) del Sapo (hace que las verrugas sobresalgan en 3D)
function createSapoBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    
    // Verrugas blancas en relieve
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 2.5 + Math.random() * 5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, '#ffffff'); // Blanco (máxima altura)
        grad.addColorStop(0.7, '#808080'); // Plomo neutral
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

// 5. Textura del Tatú Mulita (Caparazón segmentado y escamoso)
function createTatuTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#564940';
    ctx.fillRect(0, 0, 256, 256);
    
    // Líneas divisorias de la armadura
    ctx.strokeStyle = '#3c322b';
    ctx.lineWidth = 3;
    for (let y = 12; y < 256; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
        
        // Escamas individuales dentro de cada franja
        ctx.fillStyle = '#68594e';
        for (let x = 6; x < 256; x += 14) {
            ctx.fillRect(x, y + 3, 8, 12);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// 6. Textura del Carpincho (Pelaje grueso y cerdoso)
function createCarpinchoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#825637';
    ctx.fillRect(0, 0, 256, 256);
    
    // Trazos de pelos individuales
    ctx.strokeStyle = '#52341f';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 900; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const len = 5 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + len * 0.25); // Pelos orientados de adelante hacia atrás
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

// 7. Textura del Yacaré (Escamas rectangulares blindadas)
function createYacareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e3820';
    ctx.fillRect(0, 0, 256, 256);
    
    // Líneas de rejilla de escamas
    ctx.strokeStyle = '#0e1c10';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 256; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, 256);
        ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(256, y);
        ctx.stroke();
    }
    
    // Relleno de volumen 3D para cada escama
    for (let x = 2; x < 256; x += 16) {
        for (let y = 2; y < 256; y += 16) {
            ctx.fillStyle = Math.random() > 0.4 ? '#274b2a' : '#172e19';
            ctx.fillRect(x, y, 12, 12);
            // Punto de brillo óseo central
            ctx.fillStyle = '#396d3d';
            ctx.fillRect(x + 4, y + 4, 4, 4);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// 8. Textura de la Lechuza (Patrón de plumas imbricadas)
function createOwlTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eae5df';
    ctx.fillRect(0, 0, 256, 256);
    
    // Plumas
    ctx.fillStyle = '#7a6f63';
    ctx.strokeStyle = '#4e433b';
    ctx.lineWidth = 1;
    for (let y = 8; y < 256; y += 16) {
        for (let x = -8; x < 256; x += 12) {
            ctx.beginPath();
            ctx.arc(x + 6, y, 7, 0, Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// 9. Textura del Agua Animada (Celeste/Turquesa con ondas)
function createWaterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Color base del agua translúcida profunda
    ctx.fillStyle = '#105273';
    ctx.fillRect(0, 0, 256, 256);
    
    // Ondas y espuma suave
    ctx.strokeStyle = 'rgba(110, 220, 255, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        const rx = Math.random() * 256;
        const ry = Math.random() * 256;
        const rad = 15 + Math.random() * 30;
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
}

// 10. Mapa de Relieve (Bump Map) del Agua para reflejar luz lunar en movimiento
function createWaterBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);
    
    // Ondas en escala de grises
    for (let i = 0; i < 22; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const r = 8 + Math.random() * 20;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, '#ffffff'); // Alto
        grad.addColorStop(0.5, '#808080'); // Neutral
        grad.addColorStop(1, '#000000'); // Bajo
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
}

// 11. Textura de la Luna Llena (Cráteres en escala de grises y crema)
function createMoonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Base crema luminosa
    ctx.fillStyle = '#fffaed';
    ctx.fillRect(0, 0, 128, 128);
    
    // Cráteres grisáceos suaves
    ctx.fillStyle = '#e8dfcc';
    for (let i = 0; i < 18; i++) {
        const cx = Math.random() * 128;
        const cy = Math.random() * 128;
        const r = 3 + Math.random() * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

// 12. Textura del Cactus (Estrías verticales y areolas blancas)
function createCactusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Verde cactus base
    ctx.fillStyle = '#246b41';
    ctx.fillRect(0, 0, 128, 256);
    
    // Estrías verticales (luz y sombra)
    ctx.lineWidth = 4;
    for (let x = 8; x < 128; x += 16) {
        // Sombra vertical
        ctx.strokeStyle = '#18472b';
        ctx.beginPath();
        ctx.moveTo(x - 2, 0); ctx.lineTo(x - 2, 256);
        ctx.stroke();
        
        // Relieve vertical
        ctx.strokeStyle = '#2f8f57';
        ctx.beginPath();
        ctx.moveTo(x + 2, 0); ctx.lineTo(x + 2, 256);
        ctx.stroke();
        
        // Areolas blancas (de donde salen las espinas)
        ctx.fillStyle = '#e5dec9';
        for (let y = 16; y < 256; y += 32) {
            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// 13. Textura de Hojas y Helechos (Nervaduras detalladas sobre verde oscuro)
function createLeavesTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Verde follaje profundo
    ctx.fillStyle = '#173f32';
    ctx.fillRect(0, 0, 128, 128);
    
    // Nervadura central y laterales
    ctx.strokeStyle = '#25634f';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, 128);
    ctx.stroke();
    
    for (let y = 16; y < 128; y += 24) {
        ctx.beginPath();
        ctx.moveTo(64, y);
        ctx.lineTo(24, y - 14);
        ctx.moveTo(64, y);
        ctx.lineTo(104, y - 14);
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

// 14. Textura de los Troncos (Corteza agrietada rugosa de Quebracho)
function createTrunkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Madera base
    ctx.fillStyle = '#4a3325';
    ctx.fillRect(0, 0, 128, 256);
    
    // Grietas longitudinales de corteza
    ctx.strokeStyle = '#2b1c14';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        let cx = Math.random() * 128;
        ctx.moveTo(cx, 0);
        for (let y = 30; y <= 256; y += 50) {
            cx += (Math.random() - 0.5) * 15;
            ctx.lineTo(cx, y);
        }
        ctx.stroke();
    }
    
    // Fibra y rugosidad
    for (let i = 0; i < 600; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 256;
        ctx.fillStyle = Math.random() > 0.5 ? '#5d4130' : '#332219';
        ctx.fillRect(x, y, 2.5, 5);
    }
    return new THREE.CanvasTexture(canvas);
}

// 15. Textura de las Totoras (Fibras y tallos verticales)
function createTotoraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e661e';
    ctx.fillRect(0, 0, 64, 128);
    
    ctx.strokeStyle = '#2d8b2d';
    ctx.lineWidth = 2;
    for (let x = 4; x < 64; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, 128);
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

const materials = {
    sapo: new THREE.MeshStandardMaterial({ 
        map: createSapoTexture(), 
        bumpMap: createSapoBumpTexture(),
        bumpScale: 0.04,
        roughness: 0.4,
        metalness: 0.05,
        emissive: 0x0a1a08,
        emissiveIntensity: 0.15
    }),
    sapoUnder: new THREE.MeshStandardMaterial({ color: 0x8fbc8f, roughness: 0.5, emissive: 0x1a3a18, emissiveIntensity: 0.1 }),
    eye: new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    tatu: new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 0.75, metalness: 0.05 }),
    tatuArmor: new THREE.MeshStandardMaterial({ 
        map: createTatuTexture(), 
        roughness: 0.6,
        metalness: 0.1
    }),
    carpincho: new THREE.MeshStandardMaterial({ 
        map: createCarpinchoTexture(), 
        roughness: 0.85 
    }),
    yacare: new THREE.MeshStandardMaterial({ 
        map: createYacareTexture(), 
        roughness: 0.5,
        metalness: 0.08,
        emissive: 0x0a1a08,
        emissiveIntensity: 0.08
    }),
    yacareBelly: new THREE.MeshStandardMaterial({ color: 0x6e7f45, roughness: 0.65 }),
    owlBody: new THREE.MeshStandardMaterial({ 
        map: createOwlTexture(), 
        roughness: 0.75 
    }),
    owlFeather: new THREE.MeshStandardMaterial({ color: 0x5f5f5f, roughness: 0.7 }),
    cactus: new THREE.MeshStandardMaterial({ 
        map: createCactusTexture(), 
        roughness: 0.85,
        emissive: 0x0a1a0a,
        emissiveIntensity: 0.05
    }),
    cactusSpikes: new THREE.MeshBasicMaterial({ color: 0xddddcc }),
    trunk: new THREE.MeshStandardMaterial({ 
        map: createTrunkTexture(), 
        roughness: 0.92
    }),
    leaves: new THREE.MeshStandardMaterial({ 
        map: createLeavesTexture(), 
        roughness: 0.65,
        emissive: 0x0a2a12,
        emissiveIntensity: 0.08
    }),
    rock: new THREE.MeshStandardMaterial({ color: 0x606670, roughness: 0.75, metalness: 0.05 }),
    water: new THREE.MeshStandardMaterial({ 
        map: createWaterTexture(),
        bumpMap: createWaterBumpTexture(),
        bumpScale: 0.1,
        roughness: 0.03, 
        metalness: 0.4,
        transparent: true, 
        opacity: 0.72,
        emissive: 0x0a1a2a,
        emissiveIntensity: 0.15
    }),
    gold: new THREE.MeshStandardMaterial({ 
        color: 0xffcc00, 
        metalness: 0.85, 
        roughness: 0.15, 
        emissive: 0xcc8800, 
        emissiveIntensity: 0.6 
    }),
    totora: new THREE.MeshStandardMaterial({ 
        map: createTotoraTexture(), 
        roughness: 0.8 
    }),
    totoraTip: new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.9 }),
    barrier: new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.88 })
};

// --- Constructores de Mallas Procedimentales ---
function createSapoMesh() {
    const sapoGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), materials.sapo);
    body.scale.set(1.1, 0.7, 0.9);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    sapoGroup.add(body);
    
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), materials.sapoUnder);
    belly.scale.set(0.9, 0.5, 0.8);
    belly.position.set(0.1, 0.35, 0);
    sapoGroup.add(belly);
    
    const eyeR = new THREE.Group();
    const eyeL = new THREE.Group();
    const globeR = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), materials.eye);
    const globeL = globeR.clone();
    
    const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), materials.pupil);
    pupil.rotation.x = Math.PI / 2;
    pupil.position.z = 0.2;
    
    eyeR.add(globeR); eyeR.add(pupil);
    eyeR.position.set(0.5, 0.9, 0.35);
    
    const pupilL = pupil.clone();
    eyeL.add(globeL); eyeL.add(pupilL);
    eyeL.position.set(0.5, 0.9, -0.35);
    
    sapoGroup.add(eyeR); sapoGroup.add(eyeL);
    
    const legGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const legR = new THREE.Mesh(legGeo, materials.sapo);
    legR.scale.set(1.5, 0.8, 0.8);
    legR.position.set(-0.6, 0.4, 0.7);
    const legL = legR.clone();
    legL.position.z = -0.7;
    sapoGroup.add(legR); sapoGroup.add(legL);
    
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6), materials.sapo);
    armR.position.set(0.6, 0.3, 0.4);
    armR.rotation.z = -Math.PI / 6;
    const armL = armR.clone();
    armL.position.z = -0.4;
    sapoGroup.add(armR); sapoGroup.add(armL);
    
    sapoGroup.scale.set(0.8, 0.8, 0.8);
    return sapoGroup;
}

function createTatuMesh() {
    const tatu = new THREE.Group();
    const armor = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), materials.tatuArmor);
    armor.scale.set(1.4, 0.9, 1);
    armor.position.y = 0.8;
    armor.castShadow = true;
    armor.receiveShadow = true;
    tatu.add(armor);
    
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), materials.tatu);
    body.scale.set(1.3, 0.8, 0.9);
    body.position.set(0, 0.6, 0);
    tatu.add(body);
    
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), materials.tatu);
    head.rotation.z = -Math.PI / 3;
    head.position.set(1.2, 0.8, 0);
    tatu.add(head);
    
    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 6), materials.tatu);
    earR.position.set(0.9, 1.3, 0.2);
    earR.rotation.z = -Math.PI/6;
    earR.rotation.x = Math.PI/12;
    const earL = earR.clone();
    earL.position.z = -0.2;
    earL.rotation.x = -Math.PI/12;
    tatu.add(earR); tatu.add(earL);
    
    const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeo, materials.tatu);
        leg.position.set(i < 2 ? 0.6 : -0.6, 0.3, i % 2 === 0 ? 0.6 : -0.6);
        leg.castShadow = true;
        tatu.add(leg);
    }
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.05, 1.2, 8), materials.tatuArmor);
    tail.rotation.z = Math.PI / 4;
    tail.position.set(-1.6, 0.6, 0);
    tatu.add(tail);
    tatu.scale.set(1.1, 1.1, 1.1);
    return tatu;
}

function createCarpinchoMesh() {
    const cp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 1.6), materials.carpincho);
    body.position.y = 1.0;
    body.castShadow = true;
    body.receiveShadow = true;
    cp.add(body);
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.1), materials.carpincho);
    head.position.set(1.4, 1.4, 0);
    head.castShadow = true;
    cp.add(head);
    
    const earR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), materials.carpincho);
    earR.position.set(1.2, 2.0, 0.45);
    const earL = earR.clone();
    earL.position.z = -0.45;
    cp.add(earR); cp.add(earL);
    
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), materials.pupil);
    eyeR.position.set(1.4, 1.6, 0.56);
    const eyeL = eyeR.clone();
    eyeL.position.z = -0.56;
    cp.add(eyeR); cp.add(eyeL);
    
    const legGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
    for(let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeo, materials.carpincho);
        leg.position.set(i < 2 ? 0.9 : -0.9, 0.4, i % 2 === 0 ? 0.65 : -0.65);
        leg.castShadow = true;
        cp.add(leg);
    }
    cp.scale.set(1.2, 1.2, 1.2);
    return cp;
}

function createYacareMesh() {
    const yac = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 1.5), materials.yacare);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    yac.add(body);
    
    const belly = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 1.3), materials.yacareBelly);
    belly.position.set(0, 0.1, 0);
    yac.add(belly);
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.1), materials.yacare);
    head.position.set(2.2, 0.5, 0);
    head.castShadow = true;
    yac.add(head);
    
    const snout = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.9), materials.yacare);
    snout.position.set(3.2, 0.425, 0);
    snout.castShadow = true;
    yac.add(snout);
    
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), materials.eye);
    eyeR.position.set(1.9, 0.75, 0.4);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), materials.pupil);
    pupilR.position.set(0.05, 0.05, 0.05);
    eyeR.add(pupilR);
    const eyeL = eyeR.clone();
    eyeL.position.z = -0.4;
    yac.add(eyeR); yac.add(eyeL);
    
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.5, 6), materials.yacare);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-3.2, 0.35, 0);
    tail.castShadow = true;
    yac.add(tail);
    
    const legGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
    for(let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeo, materials.yacare);
        leg.position.set(i < 2 ? 1.2 : -1.2, 0.2, i % 2 === 0 ? 0.95 : -0.95);
        leg.castShadow = true;
        yac.add(leg);
    }
    yac.scale.set(1.3, 1.3, 1.3);
    return yac;
}

function createOwlMesh() {
    const ow = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 2.2, 8), materials.owlBody);
    body.castShadow = true;
    ow.add(body);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), materials.owlBody);
    head.position.y = 1.3;
    head.castShadow = true;
    ow.add(head);
    
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
    eyeR.position.set(0.5, 1.4, 0.45);
    const pupilR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8), materials.pupil);
    pupilR.rotation.x = Math.PI / 2;
    pupilR.position.z = 0.25;
    eyeR.add(pupilR);
    const eyeL = eyeR.clone();
    eyeL.position.z = -0.45;
    ow.add(eyeR); ow.add(eyeL);
    
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), materials.pupil);
    beak.rotation.x = Math.PI;
    beak.rotation.z = Math.PI / 3;
    beak.position.set(0.8, 1.2, 0);
    ow.add(beak);
    
    const wingGeo = new THREE.BoxGeometry(0.2, 1.6, 1.8);
    const wingR = new THREE.Group();
    const wingMeshR = new THREE.Mesh(wingGeo, materials.owlFeather);
    wingMeshR.position.z = 0.9;
    wingR.add(wingMeshR);
    wingR.position.set(0, 0.4, 0.5);
    wingR.name = "wingR";
    
    const wingL = new THREE.Group();
    const wingMeshL = new THREE.Mesh(wingGeo, materials.owlFeather);
    wingMeshL.position.z = -0.9;
    wingL.add(wingMeshL);
    wingL.position.set(0, 0.4, -0.5);
    wingL.name = "wingL";
    
    ow.add(wingR); ow.add(wingL);
    
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), materials.owlFeather);
    tail.rotation.z = -Math.PI / 6;
    tail.position.set(-0.7, -0.9, 0);
    ow.add(tail);
    ow.scale.set(1.2, 1.2, 1.2);
    return ow;
}

function createQuebrachoTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    
    const baseHeight = 5 + Math.random() * 4;
    const baseRadius = 1.0 + Math.random() * 0.4;
    
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.6, baseRadius, baseHeight, 8), materials.trunk);
    trunk.position.y = baseHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Musgo en el tronco (parches verdes)
    if (Math.random() > 0.4) {
        const mossMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.95, emissive: 0x0a2a0a, emissiveIntensity: 0.1 });
        const moss = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.65, baseRadius * 1.05, baseHeight * 0.4, 8, 1, true), mossMat);
        moss.position.y = baseHeight * 0.3;
        tree.add(moss);
    }
    
    const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4, 5), materials.trunk);
    branch1.position.set(1, baseHeight - 1, 1);
    branch1.rotation.z = Math.PI / 4;
    branch1.rotation.y = Math.PI / 4;
    branch1.castShadow = true;
    tree.add(branch1);
    
    const branch2 = branch1.clone();
    branch2.position.set(-1, baseHeight - 1.5, -1);
    branch2.rotation.z = -Math.PI / 4;
    tree.add(branch2);
    
    // Tercera rama aleatoria para asimetría
    if (Math.random() > 0.4) {
        const branch3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 3.5, 5), materials.trunk);
        branch3.position.set(Math.random() - 0.5, baseHeight - 0.5, Math.random() - 0.5);
        branch3.rotation.z = (Math.random() - 0.5) * Math.PI / 2;
        branch3.rotation.y = Math.random() * Math.PI;
        branch3.castShadow = true;
        tree.add(branch3);
    }
    
    // Copa orgánica — múltiples esferas deformadas superpuestas
    const canopyCount = 3 + Math.floor(Math.random() * 3);
    for (let c = 0; c < canopyCount; c++) {
        const canopySize = 1.8 + Math.random() * 2.5;
        const leafMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(canopySize, 1), materials.leaves);
        leafMesh.position.set(
            (Math.random() - 0.5) * 3,
            baseHeight + 0.5 + Math.random() * 2,
            (Math.random() - 0.5) * 3
        );
        // Escala asimétrica para formas orgánicas
        leafMesh.scale.set(
            0.8 + Math.random() * 0.4,
            0.6 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );
        leafMesh.castShadow = true;
        tree.add(leafMesh);
    }
    
    // Enredaderas colgantes (solo en algunos árboles)
    if (Math.random() > 0.5) {
        const vineMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.9 });
        const vineCount = 1 + Math.floor(Math.random() * 3);
        for (let v = 0; v < vineCount; v++) {
            const vineLength = 2 + Math.random() * 4;
            const vine = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.04, vineLength, 4),
                vineMat
            );
            vine.position.set(
                (Math.random() - 0.5) * 3,
                baseHeight + 1 - vineLength / 2,
                (Math.random() - 0.5) * 3
            );
            // Leve inclinación para parecer natural
            vine.rotation.z = (Math.random() - 0.5) * 0.3;
            vine.rotation.x = (Math.random() - 0.5) * 0.3;
            tree.add(vine);
            
            // Pequeñas hojas en la enredadera
            const miniLeafGeo = new THREE.PlaneGeometry(0.2, 0.15);
            const miniLeafMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8, side: THREE.DoubleSide });
            for (let ml = 0; ml < 4; ml++) {
                const miniLeaf = new THREE.Mesh(miniLeafGeo, miniLeafMat);
                miniLeaf.position.set(
                    vine.position.x + (Math.random() - 0.5) * 0.3,
                    baseHeight + 1 - ml * (vineLength / 4),
                    vine.position.z + (Math.random() - 0.5) * 0.3
                );
                miniLeaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                tree.add(miniLeaf);
            }
        }
    }
    
    return tree;
}

function createDistantTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    
    const h = 5 + Math.random() * 4;
    // Tronco piramidal muy simple (4 caras)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, h, 4), materials.trunk);
    trunk.position.y = h / 2;
    tree.add(trunk);
    
    // Copa de árbol cónica simple (4 caras)
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.0, 4), materials.leaves);
    leaves.position.y = h + 1.2;
    tree.add(leaves);
    
    const scale = 0.8 + Math.random() * 0.5;
    tree.scale.set(scale, scale, scale);
    return tree;
}

function createCactus(x, z) {
    const cactus = new THREE.Group();
    cactus.position.set(x, 0, z);
    
    const height = 4 + Math.random() * 3;
    const mainBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, height, 7), materials.cactus);
    mainBody.position.y = height / 2;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    cactus.add(mainBody);
    
    const armGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 6);
    const arm1 = new THREE.Group();
    const subArm1 = new THREE.Mesh(armGeo, materials.cactus);
    subArm1.rotation.z = Math.PI / 2;
    subArm1.position.x = 0.75;
    const subArm1Up = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.5, 6), materials.cactus);
    subArm1Up.position.set(1.5, 0.75, 0);
    subArm1Up.castShadow = true;
    arm1.add(subArm1); arm1.add(subArm1Up);
    arm1.position.y = height * 0.5;
    cactus.add(arm1);
    
    if (height > 5) {
        const arm2 = new THREE.Group();
        const subArm2 = new THREE.Mesh(armGeo, materials.cactus);
        subArm2.rotation.z = -Math.PI / 2;
        subArm2.position.x = -0.75;
        const subArm2Up = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.8, 6), materials.cactus);
        subArm2Up.position.set(-1.5, 0.9, 0);
        subArm2Up.castShadow = true;
        arm2.add(subArm2); arm2.add(subArm2Up);
        arm2.position.y = height * 0.7;
        arm2.rotation.y = Math.PI / 3;
        cactus.add(arm2);
    }
    
    const spikeGeo = new THREE.ConeGeometry(0.04, 0.25, 4);
    for(let k = 0; k < 12; k++) {
        const spike = new THREE.Mesh(spikeGeo, materials.cactusSpikes);
        spike.rotation.z = Math.random() * Math.PI;
        spike.position.set((Math.random() - 0.5) * 0.9, Math.random() * height, (Math.random() - 0.5) * 0.9);
        cactus.add(spike);
    }
    cactus.userData = { radius: 1.2, height: height };
    return cactus;
}

function createFern(x, z) {
    const fern = new THREE.Group();
    fern.position.set(x, 0, z);
    
    const leafGeo = new THREE.BoxGeometry(0.2, 0.1, 2.5);
    const leavesNum = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < leavesNum; i++) {
        const leaf = new THREE.Mesh(leafGeo, materials.leaves);
        leaf.rotation.y = (i / leavesNum) * Math.PI * 2 + Math.random() * 0.3;
        leaf.rotation.x = 0.4 + Math.random() * 0.3;
        leaf.position.y = 0.5;
        leaf.castShadow = true;
        fern.add(leaf);
    }
    
    fern.scale.set(1.2, 1.2, 1.2);
    fern.userData = { radius: 2.2 };
    return fern;
}

function createHollowLog(x, z, rotY = 0) {
    const logGroup = new THREE.Group();
    logGroup.position.set(x, 0.6, z);
    logGroup.rotation.y = rotY;
    
    const logGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.0, 8, 1, true);
    const logMesh = new THREE.Mesh(logGeo, materials.trunk);
    logMesh.rotation.x = Math.PI / 2;
    logMesh.castShadow = true;
    logMesh.receiveShadow = true;
    logGroup.add(logMesh);
    
    logGroup.userData = { radius: 2.2 };
    return logGroup;
}

// --- Generador de Escenario Abierto y Horizonte de Árboles ---
function buildWorld() {
    platforms = [];
    cactusList = [];
    ferns = [];
    logs = [];
    waterPuddles = [];
    questItems = [];
    fireflies = [];
    branchPushed = false;
    lowFogPlanes = [];
    fallingLeaves = [];
    flowerMeshes = [];
    smallRocks = [];
    if (grassMesh) { scene.remove(grassMesh); grassMesh = null; }
    if (dustParticles) { scene.remove(dustParticles); dustParticles = null; }
    
    // Limpiar grupos previos
    while(terrainGroup.children.length > 0) terrainGroup.remove(terrainGroup.children[0]);
    while(environmentGroup.children.length > 0) environmentGroup.remove(environmentGroup.children[0]);
    while(npcGroup.children.length > 0) npcGroup.remove(npcGroup.children[0]);
    while(itemGroup.children.length > 0) itemGroup.remove(itemGroup.children[0]);
    while(obstacleGroup.children.length > 0) obstacleGroup.remove(obstacleGroup.children[0]);
    while(helperGroup.children.length > 0) helperGroup.remove(helperGroup.children[0]);

    // 1. TERRENO DE MUNDO ABIERTO Y VISUAL (1200x1200 unidades)
    const playableSize = 450;
    const visualSize = 1200;
    const floorGeo = new THREE.PlaneGeometry(visualSize, visualSize, 80, 80); // Doble de subdivisiones para lomas más suaves
    
    // Deformar el plano para crear lomas del monte e inmensas colinas en el horizonte
    const posAttr = floorGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        
        // No deformar bordes extremos de la geometría para evitar costuras
        if (Math.abs(vx) < visualSize/2 - 20 && Math.abs(vy) < visualSize/2 - 20) {
            // Lomas con senos/cosenos en el área de juego
            let zVal = (Math.sin(vx * 0.04) + Math.cos(vy * 0.04)) * 1.5;
            
            // Montañas lejanas en el horizonte
            const distFromCenter = Math.sqrt(vx*vx + vy*vy);
            if (distFromCenter > playableSize/2) {
                zVal += (distFromCenter - playableSize/2) * 0.15 + (Math.sin(vx * 0.05) * 6);
            }
            
            // Un canal seco/arroyo en el noreste (zona de la Laguna)
            if (vx > 60 && vy > 60 && distFromCenter < playableSize/2) {
                zVal = -0.5 + Math.sin(vx * 0.1) * 0.3;
            }
            posAttr.setZ(i, zVal);
        }
    }
    floorGeo.computeVertexNormals();
    
    const floorMat = new THREE.MeshStandardMaterial({
        map: createSoilTexture(),
        bumpMap: createSoilBumpTexture(),
        bumpScale: 0.08,
        roughness: 0.94,
        flatShading: true,
        vertexColors: true
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.2, 0);
    floor.receiveShadow = true;
    
    // --- Vertex Coloring por Bioma ---
    const floorColors = new Float32Array(floorGeo.attributes.position.count * 3);
    for (let i = 0; i < floorGeo.attributes.position.count; i++) {
        const vx = floorGeo.attributes.position.getX(i);
        const vy = floorGeo.attributes.position.getY(i);
        const distFC = Math.sqrt(vx*vx + vy*vy);
        
        let r, g, b;
        
        if (distFC > playableSize/2) {
            // Horizonte lejano: azul-gris oscuro
            r = 0.06; g = 0.07; b = 0.09;
        } else if (vx < -30 && vy < -30) {
            // Bioma Cactus (Sudoeste): tierra seca amarronada con parches ocre
            const noise = Math.random() * 0.04;
            r = 0.22 + noise; g = 0.16 + noise * 0.5; b = 0.10;
        } else if (vy > 20 && vx < 50) {
            // Bioma Bosque (Norte): verde musgo húmedo
            const noise = Math.random() * 0.03;
            r = 0.08; g = 0.15 + noise; b = 0.08 + noise * 0.3;
        } else if (vx > 50 && vy > 30) {
            if (vx > 128 && vy > 128) {
                // Laguna: turquesa/esmeralda
                const noise = Math.random() * 0.02;
                r = 0.06; g = 0.14 + noise; b = 0.13 + noise;
            } else {
                // Cañón de rocas: gris piedra con tintes marrones
                const noise = Math.random() * 0.03;
                r = 0.14 + noise; g = 0.13 + noise; b = 0.12;
            }
        } else {
            // Transición: mezcla de colores
            const noise = Math.random() * 0.03;
            r = 0.15 + noise; g = 0.13 + noise; b = 0.09;
        }
        
        floorColors[i * 3] = r;
        floorColors[i * 3 + 1] = g;
        floorColors[i * 3 + 2] = b;
    }
    floorGeo.setAttribute('color', new THREE.BufferAttribute(floorColors, 3));
    
    terrainGroup.add(floor);
    
    // Registrar la plataforma física base de todo el suelo de juego
    platforms.push({
        x: -playableSize/2,
        z: -playableSize/2,
        w: playableSize,
        d: playableSize,
        y: 0,
        type: 'ground'
    });

    // 2. LÍMITES NATURALES DEL MUNDO TRANSITABLE (Bordes en radio ~225)
    // Llenamos el perímetro del límite transitable con densos árboles y rocas de contención física
    const border = 225;
    
    for (let pos = -border; pos <= border; pos += 9) {
        // Borde Norte (Z = -border)
        environmentGroup.add(createQuebrachoTree(pos + (Math.random()-0.5)*4, -border));
        // Borde Sur (Z = border)
        environmentGroup.add(createQuebrachoTree(pos + (Math.random()-0.5)*4, border));
        // Borde Oeste (X = -border)
        environmentGroup.add(createQuebrachoTree(-border, pos + (Math.random()-0.5)*4));
        // Borde Este (X = border)
        environmentGroup.add(createQuebrachoTree(border, pos + (Math.random()-0.5)*4));
        
        // Agregar rocas de barrera intercaladas
        if (Math.random() > 0.3) {
            const rockScale = 4 + Math.random() * 5;
            const rN = new THREE.Mesh(new THREE.DodecahedronGeometry(rockScale, 0), materials.rock);
            rN.position.set(pos, rockScale/2 - 0.5, -border + 3);
            environmentGroup.add(rN);
            
            const rS = rN.clone();
            rS.position.set(pos, rockScale/2 - 0.5, border - 3);
            environmentGroup.add(rS);
        }
    }

    // 2.5. HORIZONTE DE ÁRBOLES (Visuales en el fondo)
    // Generar 600 árboles simplificados sobre las colinas lejanas
    for (let i = 0; i < 600; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 230 + Math.random() * 340;
        const tx = Math.cos(angle) * radius;
        const tz = Math.sin(angle) * radius;
        
        // Alinear con la altura del terreno deformado
        let ty = (Math.sin(tx * 0.04) + Math.cos(tz * 0.04)) * 1.5;
        const distFromCenter = Math.sqrt(tx*tx + tz*tz);
        if (distFromCenter > playableSize/2) {
            ty += (distFromCenter - playableSize/2) * 0.15 + (Math.sin(tx * 0.05) * 6);
        }
        
        const distTree = createDistantTree(tx, tz);
        distTree.position.y = ty - 0.2;
        environmentGroup.add(distTree);
    }

    // 2.6. CRESTAS DE CAÑÓN DIVISIONALES (Diseño de Niveles para Progresión)
    
    // Cresta 1: Separa Cactus (Sudoeste) de Bosque (Noroeste) a lo largo de Z = -50
    for (let rx = -220; rx < 100; rx += 8) {
        if (rx > -42 && rx < -18) continue; // Dejar paso libre para la barrera del Tatú Mulita
        
        const scale = 5 + Math.random() * 4;
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), materials.rock);
        r.position.set(rx + (Math.random()-0.5)*2, scale/2 - 0.5, -50 + (Math.random()-0.5)*4);
        r.castShadow = true;
        r.receiveShadow = true;
        environmentGroup.add(r);
        
        platforms.push({
            x: r.position.x - scale*0.8,
            z: r.position.z - scale*0.8,
            w: scale*1.6,
            d: scale*1.6,
            y: 0,
            h: scale,
            type: 'scenery_rock'
        });
        
        if (Math.random() > 0.4) {
            const c = createCactus(r.position.x + (Math.random()-0.5)*4, r.position.z + (Math.random()-0.5)*4);
            environmentGroup.add(c);
        }
    }

    // Cresta 2: Separa Bosque (Oeste) de Cañón (Este) a lo largo de X = 50
    for (let rz = -50; rz < 220; rz += 8) {
        if (rz > 25 && rz < 55) continue; // Dejar paso libre para la barrera del Carpincho
        
        const scale = 5 + Math.random() * 4;
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), materials.rock);
        r.position.set(50 + (Math.random()-0.5)*4, scale/2 - 0.5, rz + (Math.random()-0.5)*2);
        r.castShadow = true;
        r.receiveShadow = true;
        environmentGroup.add(r);
        
        platforms.push({
            x: r.position.x - scale*0.8,
            z: r.position.z - scale*0.8,
            w: scale*1.6,
            d: scale*1.6,
            y: 0,
            h: scale,
            type: 'scenery_rock'
        });
        
        if (Math.random() > 0.4) {
            const tree = createQuebrachoTree(r.position.x + (Math.random()-0.5)*5, r.position.z + (Math.random()-0.5)*5);
            environmentGroup.add(tree);
        }
    }

    // Cresta 3: Separa Cañón (Oeste) de Laguna (Este) a lo largo de X = 128
    for (let rz = -50; rz < 220; rz += 8) {
        if (rz > 75 && rz < 105) continue; // Dejar paso libre para el Yacaré
        
        const scale = 5 + Math.random() * 4;
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), materials.rock);
        r.position.set(128 + (Math.random()-0.5)*4, scale/2 - 0.5, rz + (Math.random()-0.5)*2);
        r.castShadow = true;
        r.receiveShadow = true;
        environmentGroup.add(r);
        
        platforms.push({
            x: r.position.x - scale*0.8,
            z: r.position.z - scale*0.8,
            w: scale*1.6,
            d: scale*1.6,
            y: 0,
            h: scale,
            type: 'scenery_rock'
        });
        
        if (Math.random() > 0.4) {
            const tree = createQuebrachoTree(r.position.x + (Math.random()-0.5)*5, r.position.z + (Math.random()-0.5)*5);
            environmentGroup.add(tree);
        }
    }

    // 3. GENERACIÓN DE BIOMAS EN MUNDO ABIERTO
    
    // --- BIOMA A: ZONA SECA DE CACTUS (Sudoeste: X entre -210 y -30, Z entre -210 y -30) ---
    for (let i = 0; i < 70; i++) {
        const rx = -210 + Math.random() * 180;
        const rz = -210 + Math.random() * 180;
        // Evitar el punto inicial de reaparición del sapo
        if (Math.sqrt(Math.pow(rx - player.x, 2) + Math.pow(rz - player.z, 2)) < 18) continue;
        
        const cactus = createCactus(rx, rz);
        environmentGroup.add(cactus);
        cactusList.push(cactus);
        
        if (Math.random() > 0.6) {
            const fern = createFern(rx + (Math.random()-0.5)*8, rz + (Math.random()-0.5)*8);
            environmentGroup.add(fern);
            ferns.push(fern);
        }
    }
    
    // NPC: Tatú Mulita en su madriguera (Cerca de la zona inicial pero en el desierto de cactus)
    npcs.tatu = {
        mesh: createTatuMesh(),
        x: -90, y: 0.1, z: -110,
        name: 'Tatú Mulita',
        avatar: '🦫',
        dialogueState: 0,
        quest: quests.tatu
    };
    npcs.tatu.mesh.position.set(npcs.tatu.x, npcs.tatu.y, npcs.tatu.z);
    npcs.tatu.mesh.rotation.y = Math.PI / 4;
    npcGroup.add(npcs.tatu.mesh);
    npcs.tatu.quest.status = 'available';

    // 3 Vainas de algarrobo doradas escondidas en el laberinto de cactus
    const tatuItemLocs = [
        { x: -130, z: -70 },
        { x: -60, z: -120 },
        { x: -40, z: -80 }
    ];
    tatuItemLocs.forEach((loc, index) => {
        const item = new THREE.Group();
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), materials.gold);
        pod.rotation.z = Math.PI / 3;
        pod.castShadow = true;
        item.add(pod);
        
        const light = new THREE.PointLight(0xffcc00, 0.8, 4);
        light.position.y = 0.5;
        item.add(light);
        
        item.position.set(loc.x, 0.8, loc.z);
        item.userData = { id: 'tatu_pod_' + index, type: 'tatu_pod', collected: false, radius: 1.5 };
        itemGroup.add(item);
        questItems.push(item);
    });

    // Barrera 1 (Troncos caídos de quebracho que bloquean el camino hacia el Norte en X = -30, Z = -50)
    barrierTatu = new THREE.Group();
    const woodGeo = new THREE.CylinderGeometry(0.5, 0.5, 18, 8);
    const wood1 = new THREE.Mesh(woodGeo, materials.barrier);
    wood1.rotation.z = Math.PI / 2;
    wood1.rotation.y = Math.PI / 6;
    wood1.position.set(-30, 1.5, -50);
    wood1.castShadow = true;
    const wood2 = wood1.clone();
    wood2.position.y = 3.5;
    wood2.rotation.y = -Math.PI / 6;
    barrierTatu.add(wood1); barrierTatu.add(wood2);
    obstacleGroup.add(barrierTatu);
    
    // Obstáculo físico
    platforms.push({ x: -40, z: -55, w: 20, d: 10, y: 0, h: 8, type: 'barrier_tatu' });

    // --- BIOMA B: BOSQUE HÚMEDO Y ESTANQUES (Norte / Noroeste: X entre -100 y 45, Z entre 20 y 210) ---
    for (let i = 0; i < 75; i++) {
        const rx = -100 + Math.random() * 145;
        const rz = 20 + Math.random() * 190;
        
        const tree = createQuebrachoTree(rx, rz);
        environmentGroup.add(tree);
        
        const fern = createFern(rx + (Math.random()-0.5)*6, rz + (Math.random()-0.5)*6);
        environmentGroup.add(fern);
        ferns.push(fern);
        
        if (Math.random() > 0.7) {
            const log = createHollowLog(rx + (Math.random()-0.5)*10, rz + (Math.random()-0.5)*10, Math.random()*Math.PI);
            environmentGroup.add(log);
            logs.push(log);
        }
    }
    
    // Gran charco de agua del bosque húmedo
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 16), materials.water);
    p1.position.set(-10, 0.05, 90);
    environmentGroup.add(p1);
    waterPuddles.push({ x: -21, z: 82, w: 22, d: 16, mesh: p1 });

    // NPC: Carpincho durmiendo junto al charco (X = 20, Z = 80)
    npcs.carpincho = {
        mesh: createCarpinchoMesh(),
        x: 20, y: 0.1, z: 80,
        name: 'Carpincho',
        avatar: '🦫',
        dialogueState: 0,
        quest: quests.carpincho
    };
    npcs.carpincho.mesh.position.set(npcs.carpincho.x, npcs.carpincho.y, npcs.carpincho.z);
    npcs.carpincho.mesh.rotation.y = -Math.PI / 4;
    npcGroup.add(npcs.carpincho.mesh);

    // 3 Hojas de totora curativa flotando en las orillas del charco grande
    const totoraItemLocs = [
        { x: -18, z: 85 },
        { x: -8, z: 96 },
        { x: -5, z: 84 }
    ];
    totoraItemLocs.forEach((loc, index) => {
        const item = new THREE.Group();
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), materials.totora);
        stalk.position.y = 0.9;
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), materials.totoraTip);
        tip.position.y = 1.6;
        item.add(stalk); item.add(tip);
        
        const light = new THREE.PointLight(0x00ff88, 0.6, 3);
        light.position.y = 0.9;
        item.add(light);
        
        item.position.set(loc.x, 0.1, loc.z);
        item.userData = { id: 'carpincho_totora_' + index, type: 'carpincho_totora', collected: false, radius: 1.5 };
        itemGroup.add(item);
        questItems.push(item);
    });

    // Barrera 2 (Enredaderas espinosas gigantes y ramas en X = 50, Z = 40 que tapan el paso al Cañón del Este)
    barrierCarpincho = new THREE.Group();
    const wood3 = new THREE.Mesh(woodGeo, materials.barrier);
    wood3.rotation.z = Math.PI / 2;
    wood3.rotation.y = Math.PI / 4;
    wood3.position.set(50, 2, 40);
    wood3.castShadow = true;
    const wood4 = wood3.clone();
    wood4.position.y = 4.5;
    wood4.rotation.y = -Math.PI / 4;
    barrierCarpincho.add(wood3); barrierCarpincho.add(wood4);
    obstacleGroup.add(barrierCarpincho);
    
    platforms.push({ x: 45, z: 30, w: 10, d: 20, y: 0, h: 9, type: 'barrier_carpincho' });

    // --- BIOMA C: CAÑÓN Y DESFILADERO DE PIEDRAS ALTAS (Este: X entre 60 y 130, Z entre 10 y 130) ---
    // Rocas flotantes gigantes para saltar y escalar en 3D
    const stepLocations = [
        { x: 70, y: 2.0, z: 40, w: 6, h: 2, d: 6 },
        { x: 80, y: 4.5, z: 52, w: 7, h: 4.5, d: 7 },
        { x: 72, y: 7.0, z: 66, w: 6, h: 7, d: 6 },
        { x: 85, y: 9.5, z: 78, w: 7, h: 9.5, d: 7 },
        { x: 98, y: 12.0, z: 90, w: 6, h: 12, d: 6 },
        { x: 114, y: 13.5, z: 104, w: 8, h: 13.5, d: 8 },
        { x: 125, y: 10.0, z: 88, w: 7, h: 10, d: 7 },
        { x: 122, y: 6.0, z: 72, w: 6, h: 6, d: 6 }
    ];
    
    stepLocations.forEach((step, index) => {
        const rockBlock = new THREE.Mesh(new THREE.BoxGeometry(step.w, step.h, step.d), materials.rock);
        rockBlock.position.set(step.x, step.h / 2, step.z);
        rockBlock.castShadow = true;
        rockBlock.receiveShadow = true;
        environmentGroup.add(rockBlock);
        
        platforms.push({
            x: step.x - step.w/2,
            z: step.z - step.d/2,
            w: step.w,
            d: step.d,
            y: step.y,
            h: step.h,
            type: 'rock_platform'
        });
    });

    // NPC: Yacaré (X = 110, Z = 90, Atascado cerca del desfiladero)
    npcs.yacare = {
        mesh: createYacareMesh(),
        x: 110, y: 0.1, z: 90,
        name: 'Yacaré',
        avatar: '🐊',
        dialogueState: 0,
        quest: quests.yacare
    };
    npcs.yacare.mesh.position.set(npcs.yacare.x, npcs.yacare.y, npcs.yacare.z);
    npcs.yacare.mesh.rotation.y = -Math.PI / 2;
    npcGroup.add(npcs.yacare.mesh);
    
    // Tronco caído sobre Yacaré (Bloqueando el paso de salida)
    interactiveBranch = new THREE.Group();
    const branchTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 15, 8), materials.trunk);
    branchTrunk.rotation.z = Math.PI / 3;
    branchTrunk.castShadow = true;
    interactiveBranch.add(branchTrunk);
    interactiveBranch.position.set(108, 5, 90);
    obstacleGroup.add(interactiveBranch);
    
    // Barrera de colisión que traba el paso hacia el cuadrante Noreste de la laguna
    platforms.push({ x: 128, z: 80, w: 10, d: 30, y: 0, h: 10, type: 'barrier_yacare' });
    
    // Indicador rosa de empuje arriba en la roca X=122, Y=6.0, Z=72
    const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.7 }));
    indicator.position.set(122, 6.6, 72);
    helperGroup.add(indicator);
    indicator.userData = { type: 'branch_trigger', active: true };

    // --- BIOMA D: LA LAGUNA SAGRADA (Noreste: X entre 130 y 170, Z entre 130 y 170) ---
    const swampWater = new THREE.Mesh(new THREE.BoxGeometry(45, 0.1, 45), materials.water);
    swampWater.position.set(150, 0.05, 150);
    environmentGroup.add(swampWater);
    waterPuddles.push({ x: 128, z: 128, w: 45, d: 45, mesh: swampWater });

    // Camalotes flotantes en la laguna para saltar hacia el centro
    const lilyPadGeo = new THREE.CylinderGeometry(2, 2, 0.1, 8);
    const lilyPadMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.9 });
    const lilyLocs = [
        { x: 135, z: 135 },
        { x: 146, z: 138 },
        { x: 140, z: 148 },
        { x: 154, z: 142 },
        { x: 148, z: 156 },
        { x: 160, z: 150 }
    ];
    lilyLocs.forEach((loc) => {
        const lp = new THREE.Mesh(lilyPadGeo, lilyPadMat);
        lp.position.set(loc.x, 0.1, loc.z);
        lp.receiveShadow = true;
        environmentGroup.add(lp);
        
        platforms.push({
            x: loc.x - 2.0,
            z: loc.z - 2.0,
            w: 4.0,
            d: 4.0,
            y: 0.1,
            h: 0.1,
            type: 'lily_pad'
        });
    });

    const lagoonLight = new THREE.PointLight(0x00ffff, 1.8, 25);
    lagoonLight.position.set(155, 3, 155);
    scene.add(lagoonLight);

    // Checkpoints de refugios de piedra en el mapa
    // Refugio 1 (Entre Bioma Cactus y Bosque: X = -50, Z = -30)
    const cave1 = new THREE.Group();
    cave1.position.set(-50, 0, -30);
    const stoneL = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 1), materials.rock);
    stoneL.position.set(0, 1.5, -2);
    stoneL.castShadow = true;
    const stoneR = stoneL.clone();
    stoneR.position.z = 2;
    const stoneTop = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 5), materials.rock);
    stoneTop.position.set(0, 3, 0);
    stoneTop.castShadow = true;
    cave1.add(stoneL); cave1.add(stoneR); cave1.add(stoneTop);
    environmentGroup.add(cave1);
    
    const puddleC1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 3), materials.water);
    puddleC1.position.set(-50, 0.05, -30);
    environmentGroup.add(puddleC1);
    waterPuddles.push({ x: -52, z: -32, w: 4, d: 4, mesh: puddleC1 });

    // Refugio 2 (Entre Bosque y Desfiladero: X = 40, Z = 60)
    const cave2 = cave1.clone();
    cave2.position.set(40, 0, 60);
    environmentGroup.add(cave2);
    
    const puddleC2 = puddleC1.clone();
    puddleC2.position.set(40, 0.05, 60);
    environmentGroup.add(puddleC2);
    waterPuddles.push({ x: 38, z: 58, w: 4, d: 4, mesh: puddleC2 });

    // 4. MOSCAS DE ALIMENTACIÓN POR TODO EL MAPA ABIERTO
    const flyPositions = [
        { x: -120, y: 1.5, z: -120 },
        { x: -100, y: 2.0, z: -70 },
        { x: -70, y: 1.5, z: -130 },
        { x: -40, y: 2.5, z: -90 },
        { x: -50, y: 1.5, z: -10 },
        { x: -10, y: 2.2, z: 30 },
        { x: -60, y: 1.8, z: 80 },
        { x: 10, y: 2.0, z: 110 },
        { x: -40, y: 3.0, z: 130 },
        // En las rocas de escalar
        { x: 70, y: 3.8, z: 40 },
        { x: 85, y: 11.2, z: 78 },
        { x: 114, y: 15.2, z: 104 },
        { x: 122, y: 8.0, z: 72 },
        // En el pantano
        { x: 135, y: 2.2, z: 135 },
        { x: 148, y: 2.2, z: 156 }
    ];
    flyPositions.forEach((pos, index) => {
        const fly = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
        fly.add(mesh);
        const fLight = new THREE.PointLight(0xffcc00, 0.5, 2);
        fly.add(fLight);
        fly.position.set(pos.x, pos.y, pos.z);
        fly.userData = { id: 'fly_' + index, type: 'fly', collected: false, radius: 1.5 };
        itemGroup.add(fly);
    });

    // 5. LUCIÉRNAGAS AMBIENTALES MEJORADAS — brillo pulsante e intermitente
    for (let f = 0; f < 80; f++) {
        const firefly = new THREE.Group();
        const ffMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x88ff44, transparent: true, opacity: 0.9 })
        );
        firefly.add(ffMesh);
        
        // Luz puntual para que iluminen su entorno
        const ffLight = new THREE.PointLight(0x88ff44, 0.4, 4);
        ffLight.position.y = 0;
        firefly.add(ffLight);
        
        firefly.position.set(
            (Math.random()-0.5) * 420,
            1.5 + Math.random() * 5,
            (Math.random()-0.5) * 420
        );
        // Fase aleatoria para parpadeo desfasado
        firefly.userData = { phase: Math.random() * Math.PI * 2, baseY: firefly.position.y };
        scene.add(firefly);
        fireflies.push(firefly);
    }
    
    // 6. CHARCO INICIAL (Donde sale el sapo en X = -140, Z = -140)
    const startPuddle = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 12), materials.water);
    startPuddle.position.set(-140, 0.05, -140);
    startPuddle.receiveShadow = true;
    environmentGroup.add(startPuddle);
    waterPuddles.push({ x: -146, z: -146, w: 12, d: 12, mesh: startPuddle });
    
    // 7. PASTO ONDULANTE — InstancedMesh para miles de briznas de pasto
    createGrassField();
    
    // 8. FLORES DEL MONTE — pequeños destellos de color dispersos por el bosque
    createFlowers();
    
    // 9. NEBLINA BAJA — planos transparentes a ras de suelo (especialmente en el bosque)
    createLowFog();
    
    // 10. HOJAS CAYENDO — partículas de hojas flotando lentamente en el bioma de bosque
    createFallingLeaves();
    
    // 11. PARTÍCULAS DE POLVO/ESPORAS — flotando en zonas iluminadas por la luna
    createDustParticles();
    
    // 12. PIEDRAS DECORATIVAS PEQUEÑAS — rompen la monotonía del suelo
    createSmallRocks();
}

// --- Sistemas de Vegetación y Partículas ---

function createGrassField() {
    const grassGeo = new THREE.PlaneGeometry(0.25, 1.4, 1, 3);
    // Curvar la hoja de pasto hacia arriba
    const gPosArr = grassGeo.attributes.position.array;
    for (let i = 0; i < gPosArr.length; i += 3) {
        if (gPosArr[i + 1] > 0.5) {
            gPosArr[i] += (Math.random() - 0.5) * 0.12;
            gPosArr[i + 2] += Math.random() * 0.05;
        }
    }
    
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x1a5c2a,
        roughness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.05
    });
    
    const grassCount = 4000;
    grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    grassMesh.castShadow = false;
    grassMesh.receiveShadow = false;
    
    const dummy = new THREE.Object3D();
    const grassColor = new THREE.Color();
    let idx = 0;
    
    for (let i = 0; i < grassCount; i++) {
        const x = (Math.random() - 0.5) * 420;
        const z = (Math.random() - 0.5) * 420;
        
        // Evitar agua y zonas lejanas
        if (Math.sqrt(x*x + z*z) > 210) continue;
        
        dummy.position.set(x, 0.6, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.rotation.x = (Math.random() - 0.5) * 0.15;
        dummy.scale.set(
            0.7 + Math.random() * 0.6,
            0.5 + Math.random() * 0.9,
            1
        );
        dummy.updateMatrix();
        grassMesh.setMatrixAt(idx, dummy.matrix);
        
        // Color por bioma
        if (x < -30 && z < -30) {
            // Desierto — pasto seco amarillento
            grassColor.setHSL(0.10 + Math.random() * 0.05, 0.35, 0.18 + Math.random() * 0.08);
        } else if (z > 20 && x < 50) {
            // Bosque húmedo — verde intenso
            grassColor.setHSL(0.30 + Math.random() * 0.08, 0.55, 0.12 + Math.random() * 0.08);
        } else if (x > 130 && z > 130) {
            // Laguna — verde esmeralda
            grassColor.setHSL(0.38 + Math.random() * 0.05, 0.5, 0.15 + Math.random() * 0.06);
        } else {
            // Transición
            grassColor.setHSL(0.20 + Math.random() * 0.10, 0.40, 0.15 + Math.random() * 0.07);
        }
        grassMesh.setColorAt(idx, grassColor);
        idx++;
    }
    
    grassMesh.count = idx;
    grassMesh.instanceMatrix.needsUpdate = true;
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
    scene.add(grassMesh);
}

function createFlowers() {
    const flowerColors = [0xff6b8a, 0xffcc44, 0xffffff, 0xcc88ff, 0xff8844, 0x88ccff];
    const petalGeo = new THREE.SphereGeometry(0.2, 6, 4);
    
    for (let i = 0; i < 120; i++) {
        // Solo en el bioma de bosque húmedo (Norte)
        const x = -80 + Math.random() * 120;
        const z = 30 + Math.random() * 170;
        
        if (Math.sqrt(x*x + z*z) > 210) continue;
        
        const flower = new THREE.Group();
        
        // Tallo
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4),
            new THREE.MeshStandardMaterial({ color: 0x2d6b2d, roughness: 0.9 })
        );
        stem.position.y = 0.3;
        flower.add(stem);
        
        // Pétalos
        const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        const petalMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: 0.15,
            roughness: 0.6 
        });
        
        const petalCount = 4 + Math.floor(Math.random() * 3);
        for (let p = 0; p < petalCount; p++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.scale.set(0.8, 0.5, 1.2);
            const angle = (p / petalCount) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.15, 0.6, Math.sin(angle) * 0.15);
            flower.add(petal);
        }
        
        // Centro de la flor
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 4, 4),
            new THREE.MeshStandardMaterial({ color: 0xffee00, emissive: 0xaa8800, emissiveIntensity: 0.2 })
        );
        center.position.y = 0.6;
        flower.add(center);
        
        flower.position.set(x, 0, z);
        flower.scale.setScalar(0.6 + Math.random() * 0.6);
        environmentGroup.add(flower);
        flowerMeshes.push(flower);
    }
}

function createLowFog() {
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = 128;
    fogCanvas.height = 128;
    const fCtx = fogCanvas.getContext('2d');
    const fogGrad = fCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    fogGrad.addColorStop(0, 'rgba(120, 150, 180, 0.18)');
    fogGrad.addColorStop(0.5, 'rgba(100, 130, 160, 0.08)');
    fogGrad.addColorStop(1, 'rgba(80, 110, 140, 0.0)');
    fCtx.fillStyle = fogGrad;
    fCtx.fillRect(0, 0, 128, 128);
    const fogTexture = new THREE.CanvasTexture(fogCanvas);
    
    const fogMat = new THREE.MeshBasicMaterial({
        map: fogTexture,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    
    // Neblina baja en el bioma de bosque húmedo
    const fogPositions = [
        { x: -30, z: 60, s: 35 },
        { x: -50, z: 120, s: 40 },
        { x: 10, z: 80, s: 30 },
        { x: -70, z: 150, s: 38 },
        { x: 20, z: 140, s: 32 },
        { x: -20, z: 180, s: 35 },
        // Neblina en la laguna
        { x: 145, z: 145, s: 30 },
        { x: 155, z: 160, s: 25 },
    ];
    
    fogPositions.forEach(fp => {
        const fogPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(fp.s, fp.s),
            fogMat.clone()
        );
        fogPlane.rotation.x = -Math.PI / 2;
        fogPlane.position.set(fp.x, 0.3 + Math.random() * 0.5, fp.z);
        fogPlane.userData = { baseX: fp.x, baseZ: fp.z, speed: 0.3 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2 };
        scene.add(fogPlane);
        lowFogPlanes.push(fogPlane);
    });
}

function createFallingLeaves() {
    const leafGeo = new THREE.PlaneGeometry(0.3, 0.4);
    const leafColors = [0x2d5a1e, 0x4a7a2e, 0x6b8f44, 0x886633, 0x997744];
    
    for (let i = 0; i < 60; i++) {
        const color = leafColors[Math.floor(Math.random() * leafColors.length)];
        const leafMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        // Posicionar en el bioma de bosque
        leaf.position.set(
            -80 + Math.random() * 120,
            5 + Math.random() * 10,
            30 + Math.random() * 170
        );
        leaf.userData = {
            fallSpeed: 0.3 + Math.random() * 0.5,
            swaySpeed: 1 + Math.random() * 2,
            swayAmount: 0.5 + Math.random() * 1.5,
            spinSpeed: 1 + Math.random() * 3,
            phase: Math.random() * Math.PI * 2,
            startY: leaf.position.y,
            resetY: 8 + Math.random() * 6
        };
        scene.add(leaf);
        fallingLeaves.push(leaf);
    }
}

function createDustParticles() {
    const dustCount = 300;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 400;
        dustPositions[i * 3 + 1] = 0.5 + Math.random() * 8;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
        
        // Dorado para esporas/polen
        const brightness = 0.4 + Math.random() * 0.4;
        dustColors[i * 3] = brightness;
        dustColors[i * 3 + 1] = brightness * 0.85;
        dustColors[i * 3 + 2] = brightness * 0.4;
    }
    
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    
    const dustMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.3,
        transparent: true,
        opacity: 0.25,
        sizeAttenuation: true,
        depthWrite: false
    });
    
    dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);
}

function createSmallRocks() {
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x556065, roughness: 0.85 });
    
    for (let i = 0; i < 80; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        if (Math.sqrt(x*x + z*z) > 210) continue;
        
        const rock = new THREE.Mesh(rockGeo, rockMat);
        const scale = 0.15 + Math.random() * 0.35;
        rock.scale.set(scale, scale * 0.6, scale);
        rock.position.set(x, scale * 0.2, z);
        rock.rotation.y = Math.random() * Math.PI;
        rock.castShadow = true;
        rock.receiveShadow = true;
        environmentGroup.add(rock);
        smallRocks.push(rock);
    }
}

// --- IA de la Lechuza en Mundo Abierto ---
function initOwl() {
    owl.mesh = createOwlMesh();
    scene.add(owl.mesh);
    
    owl.spotlight = new THREE.SpotLight(0xff3366, 4.0, 45, Math.PI / 6, 0.5, 1.0);
    owl.spotlight.castShadow = true;
    scene.add(owl.spotlight);
    
    const discGeo = new THREE.RingGeometry(0.1, owl.visionRadius, 16);
    const discMat = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    owl.visionDisc = new THREE.Mesh(discGeo, discMat);
    owl.visionDisc.rotation.x = -Math.PI / 2;
    owl.visionDisc.position.y = 0.05;
    scene.add(owl.visionDisc);
}

function createStarrySky() {
    // === DOMO DEL CIELO (SKY DOME) ===
    const skyGeo = new THREE.SphereGeometry(650, 32, 15);
    const skyMat = new THREE.MeshBasicMaterial({
        map: createSkyTexture(),
        side: THREE.BackSide,
        fog: false
    });
    skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    // === ESTRELLAS PRINCIPALES con colores estelares realistas y tamaños variados ===
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    // Paleta de colores estelares por temperatura (O, B, A, F, G, K, M)
    const starPalette = [
        new THREE.Color(0xeef4ff),  // Blanca pura (A)
        new THREE.Color(0xaaccff),  // Azul-blanca (B)
        new THREE.Color(0xd4e4ff),  // Blanca-azulada (A/F)
        new THREE.Color(0xfff4e8),  // Blanca cálida (F)
        new THREE.Color(0xffe8b0),  // Amarillenta (G - tipo solar)
        new THREE.Color(0xffc878),  // Anaranjada (K)
        new THREE.Color(0x88aaff),  // Azul profundo (O)
    ];
    
    for (let i = 0; i < starCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        const r = 560 + Math.random() * 140;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 25;
        const z = r * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Asignar color según "temperatura estelar"
        const palIdx = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * starPalette.length);
        const col = starPalette[palIdx];
        const brightness = 0.5 + Math.random() * 0.5;
        colors[i * 3] = col.r * brightness;
        colors[i * 3 + 1] = col.g * brightness;
        colors[i * 3 + 2] = col.b * brightness;
    }
    
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 1.8,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });
    
    starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    
    // === VÍA LÁCTEA — banda densa de partículas con nebulosa azul/violeta ===
    const mwCount = 2500;
    const mwGeo = new THREE.BufferGeometry();
    const mwPos = new Float32Array(mwCount * 3);
    const mwCol = new Float32Array(mwCount * 3);
    
    for (let i = 0; i < mwCount; i++) {
        // Arco diagonal que cruza el cielo
        const t = (Math.random() - 0.5) * Math.PI * 1.4;
        const spread = (Math.random() - 0.5) * 0.4;
        const r = 550 + Math.random() * 40;
        
        // Rotar la banda 45° a través del cielo
        const baseX = r * Math.cos(t);
        const baseY = r * 0.5 + r * Math.sin(t) * 0.6;
        const baseZ = r * Math.cos(t) * Math.sin(spread) + r * Math.sin(t) * 0.35;
        
        mwPos[i * 3] = baseX + (Math.random() - 0.5) * 30;
        mwPos[i * 3 + 1] = Math.abs(baseY) + 60 + (Math.random() - 0.5) * 20;
        mwPos[i * 3 + 2] = baseZ + (Math.random() - 0.5) * 30;
        
        // Colores nebulosos: mezcla de azul/violeta/blanco
        const nebulaType = Math.random();
        const br = 0.15 + Math.random() * 0.45;
        if (nebulaType < 0.4) {
            mwCol[i * 3] = 0.55 * br;  // Azul
            mwCol[i * 3 + 1] = 0.6 * br;
            mwCol[i * 3 + 2] = 1.0 * br;
        } else if (nebulaType < 0.7) {
            mwCol[i * 3] = 0.7 * br;  // Violeta
            mwCol[i * 3 + 1] = 0.5 * br;
            mwCol[i * 3 + 2] = 0.9 * br;
        } else {
            mwCol[i * 3] = 0.8 * br;  // Blanco tenue
            mwCol[i * 3 + 1] = 0.82 * br;
            mwCol[i * 3 + 2] = 0.85 * br;
        }
    }
    
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCol, 3));
    
    const mwMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.9,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true
    });
    
    milkyWayPoints = new THREE.Points(mwGeo, mwMat);
    scene.add(milkyWayPoints);
    
    // === ESTRELLAS FUGACES — sistema de partículas reutilizable ===
    const ssCount = 5; // Máximo de estrellas fugaces simultáneas
    const ssGeo = new THREE.BufferGeometry();
    const ssPositions = new Float32Array(ssCount * 2 * 3); // Cada estrella tiene cabeza + cola
    ssGeo.setAttribute('position', new THREE.BufferAttribute(ssPositions, 3));
    
    const ssMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.5,
        transparent: true,
        opacity: 0,
        sizeAttenuation: true
    });
    
    shootingStarSystem.particles = new THREE.Points(ssGeo, ssMat);
    shootingStarSystem.active = [];
    shootingStarSystem.lastSpawn = 0;
    scene.add(shootingStarSystem.particles);
}

// Generar una estrella fugaz en el cielo
function spawnShootingStar() {
    const ss = {
        startX: (Math.random() - 0.5) * 800,
        startY: 300 + Math.random() * 250,
        startZ: (Math.random() - 0.5) * 800,
        dirX: (Math.random() - 0.5) * 2,
        dirY: -0.5 - Math.random() * 0.5,
        dirZ: (Math.random() - 0.5) * 2,
        speed: 300 + Math.random() * 200,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.6
    };
    // Normalizar dirección
    const len = Math.sqrt(ss.dirX*ss.dirX + ss.dirY*ss.dirY + ss.dirZ*ss.dirZ);
    ss.dirX /= len; ss.dirY /= len; ss.dirZ /= len;
    shootingStarSystem.active.push(ss);
}

function updateShootingStars(dt) {
    const now = clock.getElapsedTime();
    
    // Generar nueva estrella fugaz cada 12-25 segundos
    if (now - shootingStarSystem.lastSpawn > 12 + Math.random() * 13) {
        spawnShootingStar();
        shootingStarSystem.lastSpawn = now;
    }
    
    // Actualizar estrellas activas
    const positions = shootingStarSystem.particles.geometry.attributes.position.array;
    let idx = 0;
    
    for (let i = shootingStarSystem.active.length - 1; i >= 0; i--) {
        const ss = shootingStarSystem.active[i];
        ss.life += dt;
        
        if (ss.life >= ss.maxLife) {
            shootingStarSystem.active.splice(i, 1);
            continue;
        }
        
        const t = ss.life;
        const alpha = 1.0 - (ss.life / ss.maxLife);
        
        // Posición actual (cabeza)
        if (idx < positions.length / 3 - 1) {
            positions[idx * 3] = ss.startX + ss.dirX * ss.speed * t;
            positions[idx * 3 + 1] = ss.startY + ss.dirY * ss.speed * t;
            positions[idx * 3 + 2] = ss.startZ + ss.dirZ * ss.speed * t;
            idx++;
            
            // Cola (posición ligeramente atrás)
            positions[idx * 3] = ss.startX + ss.dirX * ss.speed * (t - 0.03);
            positions[idx * 3 + 1] = ss.startY + ss.dirY * ss.speed * (t - 0.03);
            positions[idx * 3 + 2] = ss.startZ + ss.dirZ * ss.speed * (t - 0.03);
            idx++;
        }
        
        shootingStarSystem.particles.material.opacity = alpha * 0.9;
    }
    
    // Limpiar posiciones no usadas
    for (let i = idx * 3; i < positions.length; i++) {
        positions[i] = 0;
    }
    
    shootingStarSystem.particles.geometry.attributes.position.needsUpdate = true;
}

function updateOwl(dt) {
    if (!owl.active || !owl.mesh) return;

    // IA DINÁMICA: La lechuza traslada su órbita patrullera al cuadrante donde esté el Sapo
    if (player.x < -30 && player.z < -30) {
        // Bioma Sudoeste (Cactus)
        owl.patrolCenter.x = -90;
        owl.patrolCenter.z = -90;
        owl.patrolRadius = 35;
    } else if (player.z > 10 && player.x < 50) {
        // Bioma Norte (Bosque Húmedo)
        owl.patrolCenter.x = -10;
        owl.patrolCenter.z = 80;
        owl.patrolRadius = 30;
    } else if (player.x > 50 && player.z > 30) {
        // Bioma Noreste (Cañón / Laguna)
        owl.patrolCenter.x = 110;
        owl.patrolCenter.z = 100;
        owl.patrolRadius = 25;
    } else {
        // Patrulla por defecto en el centro
        owl.patrolCenter.x = 0;
        owl.patrolCenter.z = 0;
        owl.patrolRadius = 45;
    }

    if (owl.state === 'patrol') {
        owl.angle += owl.speed * dt;
        owl.x = owl.patrolCenter.x + Math.cos(owl.angle) * owl.patrolRadius;
        owl.z = owl.patrolCenter.z + Math.sin(owl.angle) * owl.patrolRadius;
        owl.y = 22 + Math.sin(owl.angle * 2) * 2;
        
        const dirX = -Math.sin(owl.angle);
        const dirZ = Math.cos(owl.angle);
        owl.mesh.rotation.y = Math.atan2(dirZ, dirX);
        
        const wingR = owl.mesh.getObjectByName("wingR");
        const wingL = owl.mesh.getObjectByName("wingL");
        if (wingR && wingL) {
            const flap = Math.sin(clock.getElapsedTime() * 10) * 0.4;
            wingR.rotation.x = flap;
            wingL.rotation.x = -flap;
        }

        owl.mesh.position.set(owl.x, owl.y, owl.z);
        owl.spotlight.position.set(owl.x, owl.y - 1, owl.z);
        owl.spotlight.target.position.set(owl.x, 0, owl.z);
        owl.spotlight.target.updateMatrixWorld();
        
        owl.visionDisc.position.set(owl.x, 0.05, owl.z);
        
        // --- Detección del Jugador en el cono circular ---
        const distToPlayer = Math.sqrt(Math.pow(player.x - owl.x, 2) + Math.pow(player.z - owl.z, 2));
        
        checkHidingState();
        
        if (distToPlayer < owl.visionRadius && player.y < owl.y && !player.isHidden) {
            owl.detectionLevel = Math.min(100, owl.detectionLevel + 70 * dt);
            detectionMeter.classList.remove('hidden');
            detectionBar.style.width = owl.detectionLevel + '%';
            
            audio.startDangerBeat();
            
            if (owl.detectionLevel >= 100) {
                owl.state = 'swoop';
                audio.playOwl();
                owl.swoopTimer = 0;
                owl.targetPos.set(player.x, player.y, player.z);
            }
        } else {
            owl.detectionLevel = Math.max(0, owl.detectionLevel - 45 * dt);
            detectionBar.style.width = owl.detectionLevel + '%';
            if (owl.detectionLevel <= 0) {
                detectionMeter.classList.add('hidden');
                audio.stopDangerBeat();
            }
        }
    } 
    else if (owl.state === 'swoop') {
        owl.swoopTimer += dt * 1.5;
        
        owl.x = THREE.MathUtils.lerp(owl.x, owl.targetPos.x, owl.swoopTimer);
        owl.z = THREE.MathUtils.lerp(owl.z, owl.targetPos.z, owl.swoopTimer);
        owl.y = THREE.MathUtils.lerp(owl.y, owl.targetPos.y + 0.8, owl.swoopTimer);
        
        owl.mesh.position.set(owl.x, owl.y, owl.z);
        owl.spotlight.position.set(owl.x, owl.y - 1, owl.z);
        owl.spotlight.target.position.set(owl.x, 0, owl.z);
        owl.spotlight.target.updateMatrixWorld();
        owl.visionDisc.position.set(owl.x, 0.05, owl.z);

        const wingR = owl.mesh.getObjectByName("wingR");
        const wingL = owl.mesh.getObjectByName("wingL");
        if (wingR && wingL) {
            wingR.rotation.x = Math.sin(clock.getElapsedTime() * 30) * 0.8;
            wingL.rotation.x = -Math.sin(clock.getElapsedTime() * 30) * 0.8;
        }

        if (owl.swoopTimer >= 1.0) {
            die("La Lechuza Vizcachera te divisó en campo abierto y te capturó en sus garras.");
        }
    }
}

// --- Físicas y Mecánicas del Sapo ---
function createPlayer() {
    player.mesh = createSapoMesh();
    scene.add(player.mesh);
    
    player.x = -140; player.y = 0.1; player.z = -140;
    player.vx = 0; player.vy = 0; player.vz = 0;
    player.energy = 100;
    player.water = 100;
    player.maxWater = 100;
    player.score = 0;
    player.isGrounded = false;
    player.cameraAngle = 0.8; // Ángulo diagonal de partida
    player.cameraPitch = 0.35;
    player.lastBiome = 'desert';
}

function checkHidingState() {
    player.isHidingArea = false;
    
    for (let f of ferns) {
        const dist = Math.sqrt(Math.pow(player.x - f.position.x, 2) + Math.pow(player.z - f.position.z, 2));
        if (dist < f.userData.radius && player.y < 1.0) {
            player.isHidingArea = true;
            break;
        }
    }
    
    for (let log of logs) {
        const dist = Math.sqrt(Math.pow(player.x - log.position.x, 2) + Math.pow(player.z - log.position.z, 2));
        if (dist < log.userData.radius && player.y < 1.2) {
            player.isHidingArea = true;
            break;
        }
    }
    
    if ((keys['ShiftLeft'] || keys['KeyS'] || keys['ArrowDown']) && player.isHidingArea && player.isGrounded) {
        player.isHidden = true;
        player.mesh.position.y = -0.2;
        player.mesh.scale.set(0.6, 0.4, 0.6);
        hidingIndicator.classList.remove('hidden');
    } else {
        player.isHidden = false;
        player.mesh.scale.set(0.8, 0.8, 0.8);
        hidingIndicator.classList.add('hidden');
    }
}

function updatePlayer(dt) {
    if (gameState !== 'PLAYING') return;

    let moving = false;
    let inputX = 0;
    let inputZ = 0;
    
    if (keys['KeyW'] || keys['ArrowUp']) { inputX = 1; moving = true; }
    if (keys['KeyS'] || keys['ArrowDown']) { inputX = -1; moving = true; }
    if (keys['KeyA'] || keys['ArrowLeft']) { inputZ = -1; moving = true; }
    if (keys['KeyD'] || keys['ArrowRight']) { inputZ = 1; moving = true; }
    
    let moveVector = new THREE.Vector3();
    if (moving && !player.isHidden) {
        const camDir = new THREE.Vector3(Math.cos(player.cameraAngle), 0, Math.sin(player.cameraAngle)).normalize();
        const camRight = new THREE.Vector3(-Math.sin(player.cameraAngle), 0, Math.cos(player.cameraAngle)).normalize();
        
        moveVector.addScaledVector(camDir, inputX);
        moveVector.addScaledVector(camRight, inputZ);
        moveVector.normalize();
        
        const targetRotY = Math.atan2(moveVector.z, moveVector.x);
        player.mesh.rotation.y = THREE.MathUtils.lerp(player.mesh.rotation.y, targetRotY, 0.15);
    }
    
    if (player.isGrounded) {
        player.vx *= 0.7;
        player.vz *= 0.7;
        
        if (keys['Space']) {
            player.isChargingJump = true;
            player.jumpCharge = Math.min(1.0, player.jumpCharge + dt * 2.0);
            player.mesh.scale.set(0.8 + player.jumpCharge*0.1, 0.8 - player.jumpCharge*0.3, 0.8 + player.jumpCharge*0.1);
        } else if (player.isChargingJump) {
            const force = JUMP_FORCE * (0.6 + player.jumpCharge * 0.4);
            player.vy = force;
            
            if (moving) {
                player.vx = moveVector.x * MOVE_SPEED * (0.8 + player.jumpCharge * 0.4);
                player.vz = moveVector.z * MOVE_SPEED * (0.8 + player.jumpCharge * 0.4);
            } else {
                const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(player.mesh.quaternion);
                player.vx = forward.x * MOVE_SPEED * 0.5;
                player.vz = forward.z * MOVE_SPEED * 0.5;
            }
            
            player.isGrounded = false;
            player.isChargingJump = false;
            player.jumpCharge = 0;
            player.energy = Math.max(0, player.energy - 0.8); // Costo reducido
            audio.playJump();
        }
    } else {
        player.vy += GRAVITY * dt;
        player.mesh.scale.set(0.7, 1.0, 0.7);
    }
    
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.z += player.vz * dt;
    
    // Límites de Mundo Abierto de Pared Invisible (440x440 área útil)
    const worldLimit = 220;
    if (player.x > worldLimit) { player.x = worldLimit; player.vx = 0; }
    if (player.x < -worldLimit) { player.x = -worldLimit; player.vx = 0; }
    if (player.z > worldLimit) { player.z = worldLimit; player.vz = 0; }
    if (player.z < -worldLimit) { player.z = -worldLimit; player.vz = 0; }
 
    // Colisiones con Plataformas y Terreno
    let highestGround = -20;
    let stoodOnBarrier = false;
    
    for (let plat of platforms) {
        if (player.x >= plat.x && player.x <= plat.x + plat.w &&
            player.z >= plat.z && player.z <= plat.z + plat.d) {
            
            const platY = plat.y;
            const platH = plat.h || 0.1;
            
            if (player.y >= platY + platH - 0.5 && player.y + player.vy * dt <= platY + platH) {
                if (plat.type === 'barrier_tatu' && quests.tatu.status !== 'completed') { stoodOnBarrier = true; continue; }
                if (plat.type === 'barrier_carpincho' && quests.carpincho.status !== 'completed') { stoodOnBarrier = true; continue; }
                if (plat.type === 'barrier_yacare' && !branchPushed) { stoodOnBarrier = true; continue; }
 
                if (platY + platH > highestGround) {
                    highestGround = platY + platH;
                }
            }
        }
    }
    
    if (stoodOnBarrier) {
        player.x -= player.vx * dt * 1.5;
        player.z -= player.vz * dt * 1.5;
        player.vx = 0; player.vz = 0;
    }
    if (highestGround > -19) {
        player.y = highestGround;
        player.vy = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }

    // Colisión con Cactus
    for (let cactus of cactusList) {
        const dist = Math.sqrt(Math.pow(player.x - cactus.position.x, 2) + Math.pow(player.z - cactus.position.z, 2));
        if (dist < cactus.userData.radius && player.y < cactus.userData.height) {
            player.x -= player.vx * dt * 2;
            player.z -= player.vz * dt * 2;
            player.vx = -player.vx * 0.5;
            player.vz = -player.vz * 0.5;
            player.water = Math.max(0, player.water - 4);
            player.energy = Math.max(0, player.energy - 4);
            audio.playHurt();
        }
    }
 
    // Consumo de Recursos
    if (moving && player.isGrounded) {
        player.energy = Math.max(0, player.energy - 0.015 * dt * 60);
    }
    player.water = Math.max(0, player.water - 0.012 * dt * 60);
    
    // Regeneración en agua/charcos
    let inWater = false;
    for (let puddle of waterPuddles) {
        if (player.x >= puddle.x && player.x <= puddle.x + puddle.w &&
            player.z >= puddle.z && player.z <= puddle.z + puddle.d &&
            player.y <= 0.5) {
            
            inWater = true;
            player.water = Math.min(player.maxWater, player.water + 1.5 * dt * 60);
            player.energy = Math.min(100, player.energy + 0.3 * dt * 60);
            break;
        }
    }
    if (inWater && Math.random() < 0.05) {
        audio.playWaterSplash();
    }

    // --- Determinar Bioma Actual para Sonido Ambiental y Efectos ---
    let currentBiome = 'transition';
    if (player.x < -30 && player.z < -30) {
        currentBiome = 'desert';
    } else if (player.z > 20 && player.x < 50) {
        currentBiome = 'forest';
    } else if (player.x > 50 && player.z > 30) {
        if (player.x > 128 && player.z > 128) {
            currentBiome = 'lagoon';
        } else {
            currentBiome = 'canyon';
        }
    }
    
    if (player.lastBiome !== currentBiome) {
        player.lastBiome = currentBiome;
        audio.playBiomeAmbient(currentBiome);
    }
 
    if (player.energy <= 0) die("Te has quedado sin energía para moverte. El sol seco del Chaco te ha consumido.");
    if (player.water <= 0) die("Te has deshidratado por completo. Un sapo necesita la humedad del monte.");
 
    // Checkpoints guardados
    if (player.x > -52 && player.x < -48 && player.z > -32 && player.z < -28 && player.lastCheckpoint.x < -100) {
        player.lastCheckpoint = { x: -50, y: 0.1, z: -30 };
        triggerCheckpointDisplay();
    }
    if (player.x > 38 && player.x < 42 && player.z > 58 && player.z < 62 && player.lastCheckpoint.x < 0) {
        player.lastCheckpoint = { x: 40, y: 0.1, z: 60 };
        triggerCheckpointDisplay();
    }
 
    // Recolección de Ítems
    itemGroup.children.forEach(item => {
        if (item.userData && !item.userData.collected) {
            const dist = Math.sqrt(Math.pow(player.x - item.position.x, 2) + Math.pow(player.z - item.position.z, 2));
            if (dist < item.userData.radius && Math.abs(player.y - item.position.y) < 2.0) {
                item.userData.collected = true;
                item.visible = false;
                
                if (item.userData.type === 'fly') {
                    player.score++;
                    player.energy = Math.min(100, player.energy + 25);
                    player.water = Math.min(player.maxWater, player.water + 15);
                    audio.playCollect();
                } 
                else if (item.userData.type === 'tatu_pod') {
                    quests.tatu.current++;
                    updateQuestUI();
                    audio.playCollect();
                } 
                else if (item.userData.type === 'carpincho_totora') {
                    quests.carpincho.current++;
                    updateQuestUI();
                    audio.playCollect();
                }
            }
        }
    });
 
    // Rama del Yacaré
    const distToTrigger = Math.sqrt(Math.pow(player.x - 122, 2) + Math.pow(player.z - 72, 2));
    if (distToTrigger < 1.8 && player.y >= 5.8 && !branchPushed) {
        pushBranch();
    }
 
    // Victoria: Caer en la Laguna (X = 150, Z = 150)
    if (player.x > 130 && player.x < 170 && player.z > 130 && player.z < 170 && player.y <= 0.2) {
        winGame();
    }
 
    player.mesh.position.set(player.x, player.y, player.z);
    if (moving && player.isGrounded) {
        player.mesh.rotation.x = Math.sin(clock.getElapsedTime() * 12) * 0.15;
    } else {
        player.mesh.rotation.x = 0;
    }
    updateHUD();
    updateContextualPrompt();
}

function updateHUD() {
    energyBar.style.width = (player.energy / 100) * 100 + '%';
    waterBar.style.width = (player.water / player.maxWater) * 100 + '%';
    scoreDisplay.textContent = 'Insectos: ' + player.score;
}
 
function triggerCheckpointDisplay() {
    checkpointDisplay.classList.remove('hidden-badge');
    audio.playMissionComplete();
    setTimeout(() => {
        checkpointDisplay.classList.add('hidden-badge');
    }, 2500);
}

function pushBranch() {
    branchPushed = true;
    audio.playMissionComplete();
    
    helperGroup.children.forEach(child => {
        if(child.userData && child.userData.type === 'branch_trigger') child.visible = false;
    });
    
    let animTimer = 0;
    function animBranch() {
        animTimer += 0.05;
        if(animTimer < 1.0) {
            interactiveBranch.rotation.z += 0.06;
            interactiveBranch.position.y -= 0.15;
            interactiveBranch.position.x += 0.1;
            requestAnimationFrame(animBranch);
        } else {
            quests.yacare.current = 1;
            quests.yacare.status = 'completed';
            updateQuestUI();
            npcs.yacare.dialogueState = 2;
            platforms = platforms.filter(plat => plat.type !== 'barrier_yacare');
        }
    }
    animBranch();
}

// --- Diálogos y Misiones ---
function updateQuestUI() {
    if (activeQuest) {
        activeQuestTitle.textContent = activeQuest.title;
        questProgressText.textContent = `${activeQuest.textNeeded} (${activeQuest.current}/${activeQuest.needed})`;
        const pct = (activeQuest.current / activeQuest.needed) * 100;
        questProgressBar.style.width = pct + '%';
        
        if (activeQuest.current >= activeQuest.needed && activeQuest.id !== 'yacare') {
            questProgressText.textContent = "¡Misión lista! Regresa con el animal.";
            questProgressBar.classList.add('ready');
            npcs[activeQuest.id].dialogueState = 2;
        }
    } else {
        activeQuestTitle.textContent = "Explora el monte";
        questProgressText.textContent = "Habla con los animales en tu camino.";
        questProgressBar.style.width = '0%';
        questProgressBar.classList.remove('ready');
    }
}

function updateContextualPrompt() {
    currentInteractNPC = null;
    
    for (let key in npcs) {
        const npc = npcs[key];
        const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.z - npc.z, 2));
        if (dist < 4.5) {
            currentInteractNPC = npc;
            interactionText.textContent = `Hablar con ${npc.name}`;
            interactionPrompt.classList.remove('hidden');
            break;
        }
    }
    if (!currentInteractNPC) {
        interactionPrompt.classList.add('hidden');
    }
}

function interactWithNPC() {
    if (gameState !== 'PLAYING' || !currentInteractNPC) return;
    
    gameState = 'DIALOGUE';
    keys['Space'] = false;
    audio.playTalk();
    
    npcNameLabel.textContent = currentInteractNPC.name;
    npcAvatar.textContent = currentInteractNPC.avatar;
    
    const npcKey = currentInteractNPC.name === 'Tatú Mulita' ? 'tatu' : 
                   currentInteractNPC.name === 'Carpincho' ? 'carpincho' : 'yacare';
                   
    const state = currentInteractNPC.dialogueState;
    btnDialogueAction.classList.remove('hidden');
    
    if (npcKey === 'tatu') {
        if (state === 0) {
            dialogueTextLabel.textContent = "¡Hola Sapito! Qué peligroso está el monte hoy. La Lechuza anda rondando y perdí mis 3 vainas de algarrobo doradas cerca de los cactus gigantes en la zona seca del Sudoeste. Sin ellas, mis crías pasarán hambre. ¿Podrías traérmelas?";
            btnDialogueAction.textContent = "Aceptar Misión";
        } else if (state === 1) {
            dialogueTextLabel.textContent = "Por favor, busca las 3 vainas de algarrobo entre los cactus del Sudoeste. ¡Cuidado con el haz de luz de la lechuza!";
            btnDialogueAction.classList.add('hidden');
        } else if (state === 2) {
            dialogueTextLabel.textContent = "¡Oh, majestuoso sapo! Has traído las vainas dulces de algarrobo. Te despejaré los troncos que tapan el desvío hacia el Norte. ¡Puedes avanzar por el bosque de quebrachos!";
            btnDialogueAction.textContent = "Entregar Vainas";
        } else {
            dialogueTextLabel.textContent = "Gracias a ti, mis crías están a salvo. ¡Cuida tu hidratación en los charcos del bosque de quebrachos al Norte!";
            btnDialogueAction.classList.add('hidden');
        }
    } 
    else if (npcKey === 'carpincho') {
        if (state === 0) {
            if (quests.tatu.status !== 'completed') {
                dialogueTextLabel.textContent = "Hola sapito... Qué calor hace. No puedo cruzar porque el paso al bosque está cerrado. Ayuda primero al Tatú.";
                btnDialogueAction.classList.add('hidden');
            } else {
                dialogueTextLabel.textContent = "¡Sapito! El calor chaqueño es inmenso y la lechuza no me deja acercarme al charco a beber. Estoy muy débil. Si pudieras buscar 3 hojas de totora medicinal que crecen en las orillas del charco grande y traérmelas, podría recuperar mis fuerzas.";
                btnDialogueAction.textContent = "Aceptar Misión";
            }
        } else if (state === 1) {
            dialogueTextLabel.textContent = "Busca las 3 hojas de totora en el charco grande. Está custodiado por la lechuza, avanza sigilosamente y escóndete en el helecho grande cuando vuele cerca.";
            btnDialogueAction.classList.add('hidden');
        } else if (state === 2) {
            dialogueTextLabel.textContent = "¡Excelente, esto me devolverá el aliento! Toma esta hoja de rocío para que tu piel aguante más hidratación (Máxima agua aumentada a 150). He despejado las enredaderas de la barrera del Este. ¡Buen viaje!";
            btnDialogueAction.textContent = "Entregar Hojas";
        } else {
            dialogueTextLabel.textContent = "Qué fresco que me siento... Que la Laguna te guarde, sapito astuto.";
            btnDialogueAction.classList.add('hidden');
        }
    }
    else if (npcKey === 'yacare') {
        if (state === 0) {
            if (quests.carpincho.status !== 'completed') {
                dialogueTextLabel.textContent = "Buenas noches, Sapo. Estoy bloqueado por estas ramas. Ayuda al Carpincho primero.";
                btnDialogueAction.classList.add('hidden');
            } else {
                dialogueTextLabel.textContent = "Buenas noches, Sapo. Estoy atascado entre estas ramas secas de quebracho caídas. Necesito que escales las rocas gigantes del desfiladero, saltes hasta la gran rama traba y la empujes con fuerza.";
                btnDialogueAction.textContent = "Entendido";
            }
        } else if (state === 1) {
            dialogueTextLabel.textContent = "Escala por el desfiladero de piedras y empuja la gran rama de quebracho que me traba desde la roca más alta.";
            btnDialogueAction.classList.add('hidden');
        } else if (state === 2) {
            dialogueTextLabel.textContent = "¡Increíble! Ya soy libre. Te he abierto el paso definitivo. La Laguna Sagrada está justo adelante, salta sobre los camalotes flotantes para cruzar sin ahogarte. ¡Que tengas un buen nado, amigo!";
            btnDialogueAction.textContent = "Completar";
        } else {
            dialogueTextLabel.textContent = "La laguna está a unos pasos. ¡Corre!";
            btnDialogueAction.classList.add('hidden');
        }
    }
    dialogueScreen.classList.remove('hidden');
}

function handleDialogueAction() {
    const npcKey = currentInteractNPC.name === 'Tatú Mulita' ? 'tatu' : 
                   currentInteractNPC.name === 'Carpincho' ? 'carpincho' : 'yacare';
    const npc = npcs[npcKey];
    
    if (npc.dialogueState === 0) {
        npc.dialogueState = 1;
        activeQuest = npc.quest;
        activeQuest.status = 'active';
        updateQuestUI();
        audio.playClick();
        closeDialogue();
    } 
    else if (npc.dialogueState === 2) {
        npc.dialogueState = 3;
        activeQuest.status = 'completed';
        activeQuest = null;
        updateQuestUI();
        audio.playMissionComplete();
        
        if (npcKey === 'tatu') {
            barrierTatu.visible = false;
            platforms = platforms.filter(plat => plat.type !== 'barrier_tatu');
            npcs.carpincho.quest.status = 'available';
        } 
        else if (npcKey === 'carpincho') {
            barrierCarpincho.visible = false;
            platforms = platforms.filter(plat => plat.type !== 'barrier_carpincho');
            player.maxWater = 150;
            player.water = 150;
            npcs.yacare.quest.status = 'available';
        }
        else if (npcKey === 'yacare') {
            // Se maneja al tirar la rama
        }
        closeDialogue();
    }
}

// --- Cámara Orbital en Tercera Persona ---
function updateCamera() {
    if (!player.mesh) return;
    
    const distance = 11;
    const height = 4.8;
    
    const targetCamX = player.x - Math.cos(player.cameraAngle) * distance;
    const targetCamZ = player.z - Math.sin(player.cameraAngle) * distance;
    const targetCamY = player.y + height + (player.cameraPitch * 3);
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.12);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.12);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.12);
    
    const lookAtTarget = new THREE.Vector3(player.x + Math.cos(player.cameraAngle)*1.5, player.y + 0.8, player.z + Math.sin(player.cameraAngle)*1.5);
    camera.lookAt(lookAtTarget);
}

// --- Ciclos del Juego y Pantallas ---
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    dialogueScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    audio.init();
    audio.startAmbientSounds();
    audio.stopDangerBeat();
    
    initThree();
    createStarrySky();
    buildWorld();
    createPlayer();
    initOwl();
    
    for (let key in quests) {
        quests[key].current = 0;
        quests[key].status = 'locked';
    }
    quests.tatu.status = 'available';
    activeQuest = null;
    updateQuestUI();
    
    gameState = 'PLAYING';
    clock.getDelta();
    animate();
}

function respawn() {
    player.x = player.lastCheckpoint.x;
    player.y = player.lastCheckpoint.y + 1.0;
    player.z = player.lastCheckpoint.z;
    player.vx = 0; player.vy = 0; player.vz = 0;
    player.energy = 100;
    player.water = player.maxWater;
    player.cameraAngle = 0.8; // Orientación diagonal inicial
    
    player.score = Math.max(0, player.score - 1);
    
    owl.state = 'patrol';
    owl.detectionLevel = 0;
    owl.x = player.x + 30;
    owl.y = 22;
    owl.swoopTimer = 0;
    detectionMeter.classList.add('hidden');
    
    audio.stopDangerBeat();
    audio.playJump();
    
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    gameState = 'PLAYING';
}

function die(reason) {
    if (gameState === 'GAMEOVER') return;
    gameState = 'GAMEOVER';
    
    audio.playHurt();
    audio.stopDangerBeat();
    
    document.getElementById('death-reason').textContent = reason;
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

function winGame() {
    if (gameState === 'VICTORY') return;
    gameState = 'VICTORY';
    
    audio.playMissionComplete();
    audio.stopDangerBeat();
    audio.stopAmbientSounds();
    
    document.getElementById('final-bugs').textContent = player.score;
    
    let questsDone = 0;
    if (quests.tatu.status === 'completed') questsDone++;
    if (quests.carpincho.status === 'completed') questsDone++;
    if (quests.yacare.status === 'completed') questsDone++;
    document.getElementById('final-quests').textContent = `${questsDone}/3`;
    
    hud.classList.add('hidden');
    victoryScreen.classList.remove('hidden');
}

// --- Animación / Bucle de Renderizado ---
function animate() {
    if (gameState === 'START') return;
    requestAnimationFrame(animate);
    
    const dt = Math.min(0.05, clock.getDelta());
    const elapsed = clock.getElapsedTime();
    
    // === Animaciones Ambientales (siempre activas) ===
    
    // Ondas del agua con movimiento orgánico
    if (materials.water.map && materials.water.bumpMap) {
        const waveOffset = elapsed * 0.025;
        materials.water.map.offset.x = waveOffset;
        materials.water.map.offset.y = waveOffset * 0.35;
        materials.water.bumpMap.offset.x = -waveOffset * 0.2;
        materials.water.bumpMap.offset.y = waveOffset * 0.55;
    }
    
    // Estrellas con titileo individual (variación por vertex color)
    if (starField) {
        starField.material.opacity = 0.65 + Math.sin(elapsed * 1.2) * 0.2;
        // Rotación lenta del cielo
        starField.rotation.y += dt * 0.001;
    }

    // Rotación lenta del domo del cielo para las nubes
    if (skyDome) {
        skyDome.rotation.y += dt * 0.0004;
    }
    
    // Vía Láctea con shimmer sutil
    if (milkyWayPoints) {
        milkyWayPoints.material.opacity = 0.28 + Math.sin(elapsed * 0.5) * 0.07;
        milkyWayPoints.rotation.y += dt * 0.001;
    }
    
    // Estrellas fugaces
    updateShootingStars(dt);
    
    // Luciérnagas pulsantes con parpadeo intermitente (como luciérnagas reales)
    fireflies.forEach((ff, idx) => {
        const phase = ff.userData ? ff.userData.phase : idx;
        const baseY = ff.userData ? ff.userData.baseY : 3;
        
        // Movimiento suave
        ff.position.x += Math.sin(elapsed * 1.2 + phase) * 0.06;
        ff.position.z += Math.cos(elapsed * 0.9 + phase * 1.3) * 0.06;
        ff.position.y = baseY + Math.sin(elapsed * 1.8 + phase) * 0.8;
        
        // Parpadeo intermitente realista
        const pulseWave = Math.sin(elapsed * 3.0 + phase * 2.1);
        const slowPulse = Math.sin(elapsed * 0.4 + phase);
        const brightness = Math.max(0, pulseWave * 0.5 + 0.5) * (slowPulse > 0.2 ? 1.0 : 0.08);
        
        // Actualizar mesh y luz
        if (ff.children && ff.children.length >= 2) {
            ff.children[0].material.opacity = brightness;
            ff.children[0].scale.setScalar(0.8 + brightness * 0.5);
            ff.children[1].intensity = brightness * 0.5;
        }
    });
    
    // Neblina baja — deriva lenta y ondulación
    lowFogPlanes.forEach(fp => {
        const ud = fp.userData;
        fp.position.x = ud.baseX + Math.sin(elapsed * ud.speed + ud.phase) * 3;
        fp.position.z = ud.baseZ + Math.cos(elapsed * ud.speed * 0.7 + ud.phase) * 2;
        fp.material.opacity = 0.2 + Math.sin(elapsed * 0.3 + ud.phase) * 0.1;
    });
    
    // Hojas cayendo — física de caída con balanceo
    fallingLeaves.forEach(leaf => {
        const ud = leaf.userData;
        leaf.position.y -= ud.fallSpeed * dt;
        leaf.position.x += Math.sin(elapsed * ud.swaySpeed + ud.phase) * ud.swayAmount * dt;
        leaf.position.z += Math.cos(elapsed * ud.swaySpeed * 0.7 + ud.phase) * ud.swayAmount * 0.5 * dt;
        leaf.rotation.x = Math.sin(elapsed * ud.spinSpeed + ud.phase) * 0.5;
        leaf.rotation.z = Math.cos(elapsed * ud.spinSpeed * 0.8 + ud.phase) * 0.3;
        leaf.rotation.y += ud.spinSpeed * dt * 0.3;
        
        // Resetear cuando llega al suelo
        if (leaf.position.y < 0.1) {
            leaf.position.y = ud.resetY;
            leaf.position.x = -80 + Math.random() * 120;
            leaf.position.z = 30 + Math.random() * 170;
        }
    });
    
    // Partículas de polvo/esporas — flotación suave
    if (dustParticles) {
        const dPos = dustParticles.geometry.attributes.position.array;
        for (let i = 0; i < dPos.length; i += 3) {
            dPos[i] += Math.sin(elapsed * 0.3 + i) * 0.02;
            dPos[i + 1] += Math.sin(elapsed * 0.5 + i * 0.3) * 0.008;
            dPos[i + 2] += Math.cos(elapsed * 0.25 + i) * 0.015;
        }
        dustParticles.geometry.attributes.position.needsUpdate = true;
        dustParticles.material.opacity = 0.15 + Math.sin(elapsed * 0.4) * 0.08;
    }
    
    // Flores — balanceo sutil con la brisa
    flowerMeshes.forEach((flower, i) => {
        flower.rotation.z = Math.sin(elapsed * 1.5 + i * 0.7) * 0.06;
        flower.rotation.x = Math.sin(elapsed * 1.2 + i * 0.5) * 0.04;
    });
    
    // === Gameplay Updates ===
    if (gameState === 'PLAYING') {
        updatePlayer(dt);
        updateOwl(dt);
        
        // Items girando y flotando
        itemGroup.children.forEach(item => {
            if (item.visible) {
                item.rotation.y += 1.5 * dt;
                item.position.y = (item.userData.type === 'fly' ? 1.8 : 0.8) + Math.sin(elapsed * 3 + item.position.x) * 0.15;
            }
        });
        
        // Animaciones de personajes
        updateCharacterAnimations(dt, elapsed);
        
        // Efecto de peligro — aberración cromática en el post-processing
        if (vignettePass && vignettePass.uniforms.dangerMix) {
            const dangerTarget = owl.detectionLevel / 100;
            vignettePass.uniforms.dangerMix.value = THREE.MathUtils.lerp(
                vignettePass.uniforms.dangerMix.value,
                dangerTarget,
                dt * 3
            );
        }
    }
    
    updateCamera();
    
    // Renderizar con post-processing
    if (composer) {
        composer.render();
    } else if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// --- Animaciones de Personajes y NPCs ---
function updateCharacterAnimations(dt, elapsed) {
    // Sapo — respiración (cuerpo pulsa sutilmente)
    if (player.mesh && player.mesh.children.length > 0) {
        const body = player.mesh.children[0];
        if (body && !player.isChargingJump) {
            const breathe = 1.0 + Math.sin(elapsed * 2.5) * 0.03;
            body.scale.set(1.1 * breathe, 0.7 / breathe, 0.9 * breathe);
        }
        
        // Parpadeo ocasional de los ojos del sapo
        const eyeR = player.mesh.children[2]; // eyeR group
        const eyeL = player.mesh.children[3]; // eyeL group
        if (eyeR && eyeL) {
            const blinkCycle = elapsed % 4.0;
            const blinkScale = (blinkCycle > 3.7 && blinkCycle < 3.85) ? 0.1 : 1.0;
            eyeR.scale.y = blinkScale;
            eyeL.scale.y = blinkScale;
        }
    }
    
    // Tatú Mulita — orejas temblando y hocico olfateando
    if (npcs.tatu && npcs.tatu.mesh) {
        const tatu = npcs.tatu.mesh;
        // Orejas temblando
        if (tatu.children.length > 5) {
            tatu.children[3].rotation.z = -Math.PI/6 + Math.sin(elapsed * 8) * 0.05;
            tatu.children[4].rotation.z = -Math.PI/6 + Math.sin(elapsed * 8 + 0.5) * 0.05;
        }
        // Cabeza olfateando (movimiento sutil)
        if (tatu.children[2]) {
            tatu.children[2].rotation.x = Math.sin(elapsed * 3) * 0.08;
        }
    }
    
    // Carpincho — respiración pesada
    if (npcs.carpincho && npcs.carpincho.mesh) {
        const cp = npcs.carpincho.mesh;
        if (cp.children[0]) {
            const cpBreathe = 1.0 + Math.sin(elapsed * 1.5) * 0.02;
            cp.children[0].scale.set(1 * cpBreathe, 1, 1);
        }
    }
    
    // Yacaré — cola oscilando lentamente
    if (npcs.yacare && npcs.yacare.mesh) {
        const yac = npcs.yacare.mesh;
        // La cola es uno de los últimos children
        const tailIdx = yac.children.length - 5; // tail mesh
        if (yac.children[tailIdx]) {
            yac.children[tailIdx].rotation.y = Math.sin(elapsed * 1.2) * 0.15;
        }
        // Mandíbula abriendo/cerrando
        if (yac.children[3]) { // snout
            yac.children[3].rotation.z = Math.sin(elapsed * 0.8) * 0.03;
        }
    }
    
    // Lechuza — ojos brillan más al detectar
    if (owl.mesh) {
        const detectionBrightness = 1.0 + (owl.detectionLevel / 100) * 2.0;
        // Ojos de la lechuza (children 2 y 3)
        if (owl.mesh.children[2] && owl.mesh.children[2].material) {
            owl.mesh.children[2].material.color.setHex(0xffcc00);
            owl.mesh.children[2].material.color.multiplyScalar(detectionBrightness);
        }
        if (owl.mesh.children[3] && owl.mesh.children[3].material) {
            owl.mesh.children[3].material.color.setHex(0xffcc00);
            owl.mesh.children[3].material.color.multiplyScalar(detectionBrightness);
        }
        
        // Cabeza gira hacia el jugador cuando detecta
        if (owl.detectionLevel > 30 && owl.mesh.children[1]) {
            const headToPlayer = Math.atan2(player.z - owl.z, player.x - owl.x);
            owl.mesh.children[1].rotation.y = THREE.MathUtils.lerp(
                owl.mesh.children[1].rotation.y,
                headToPlayer - owl.mesh.rotation.y,
                dt * 2
            );
        }
    }
}

function closeDialogue() {
    dialogueScreen.classList.add('hidden');
    gameState = 'PLAYING';
    audio.playClick();
}

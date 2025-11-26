<template>
  <div ref="container" class="scene">
    <div v-if="!projectList" class="overlay">
      Chargement de la galerie…
    </div>
    <div class="hint">
      Clique + drag pour regarder autour, molette pour zoomer. Clique un tableau pour voir le projet.
    </div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ProjectList, Project } from '../../types/projects';

const props = defineProps<{
  projectList: ProjectList | null;
}>();

const emit = defineEmits<{
  (e: 'projectSelected', project: Project | null): void;
}>();

const container = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// pour animer légèrement les tableaux (un peu de “vie”)
const animatedFrames: THREE.Mesh[] = [];
const frameMap: Record<string, THREE.Mesh> = {};

const clock = new THREE.Clock();

function createRoom() {
  if (!container.value) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight || 400;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#020617'); // bleu nuit profond

  // Caméra à hauteur d’yeux, au centre de la pièce
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
  camera.position.set(0, 1.6, 6);
  camera.lookAt(0, 1.6, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  // Contrôles orbit
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 12;
  controls.target.set(0, 1.6, 0);

  // Lumière globale douce
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // Lumière principale chaude
  const warmLight = new THREE.DirectionalLight(0xfff3e0, 0.9);
  warmLight.position.set(5, 6, 5);
  scene.add(warmLight);

  // Sol type parquet foncé
  const floorGeo = new THREE.PlaneGeometry(14, 10);
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.8,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Légère grille discrète au sol
  // const grid = new THREE.GridHelper(14, 14, 0x1f2937, 0x111827);
  // grid.position.y = 0.001;
  // scene.add(grid);

  // Murs (3 murs visibles : gauche, droite, fond)
  const wallColor = '#007BFF';
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.7,
    metalness: 0.05,
    side: THREE.BackSide,
  });

  // On crée un “boîte” pour la pièce
  const roomGeo = new THREE.BoxGeometry(14, 5, 10);
  const room = new THREE.Mesh(roomGeo, wallMat);
  room.position.set(0, 2.5 / 2, -1); // légèrement décalé
  scene.add(room);

  // Bande lumineuse au plafond (style galerie)
  const ceilingLightGeo = new THREE.BoxGeometry(10, 0.05, 0.2);
  const ceilingLightMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const ceilingLight = new THREE.Mesh(ceilingLightGeo, ceilingLightMat);
  ceilingLight.position.set(0, 4.4, -2);
  scene.add(ceilingLight);
}

function clearFrames() {
  if (!scene) return;
  animatedFrames.length = 0;
  Object.values(frameMap).forEach((mesh) => {
    scene!.remove(mesh);
  });
  for (const key in frameMap) delete frameMap[key];
}

function buildFrames() {
  if (!scene || !props.projectList) return;

  clearFrames();

  const projects = props.projectList.projects;
  if (!projects.length) return;

  // Géométries pour cadre + “toile”
  const frameOuterGeo = new THREE.BoxGeometry(2.2, 1.5, 0.08);
  const canvasGeo = new THREE.PlaneGeometry(1.9, 1.2);

  projects.forEach((project: Project, index: number) => {
    // Calcul de la position selon le mur et l'ordre
    const y = 2; // hauteur des tableaux
    const spacing = 2.8;

    let x = 0;
    let z = 0;
    let rotationY = 0;

    if (project.wall === 'left') {
      x = -5.5;
      z = - (project.order - 1) * spacing;
      rotationY = Math.PI / 2;
    } else {
      // right
      x = 5.5;
      z = - (project.order - 1) * spacing;
      rotationY = -Math.PI / 2;
    }

    // Cadre extérieur
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      metalness: 0.6,
      roughness: 0.4,
    });
    const outer = new THREE.Mesh(frameOuterGeo, frameMat);
    outer.position.set(x, y, z);
    outer.rotation.y = rotationY;
    scene!.add(outer);

    // “Toile” intérieure colorée
    const baseColor = project.wall === 'left' ? '#0ea5e9' : '#a855f7';
    const canvasMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide,
    });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.set(x, y, z + 0.05);
    canvas.rotation.y = rotationY;

    (canvas as any).userData.projectId = project.id;

    scene!.add(canvas);
    frameMap[project.id] = canvas;
    animatedFrames.push(canvas);
  });

  // Petite lumière ponctuelle au centre de la pièce
  const spot = new THREE.PointLight(0xfacc15, 0.7, 15);
  spot.position.set(0, 3.8, -2);
  scene.add(spot);
}

function animate() {
  if (!renderer || !scene || !camera) return;

  const t = clock.getElapsedTime();

  requestAnimationFrame(animate);

  // Animation très légère des tableaux (respiration)
  animatedFrames.forEach((mesh, i) => {
    const offset = i * 0.5;
    mesh.position.y = 2 + Math.sin(t * 0.6 + offset) * 0.03;
  });

  controls?.update();
  renderer.render(scene, camera);
}

function onResize() {
  if (!container.value || !camera || !renderer) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight || 400;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function onClick(event: MouseEvent) {
  if (!scene || !camera || !renderer || !props.projectList || !container.value) return;

  const rect = container.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(Object.values(frameMap));
  if(!intersects[0]) return;
  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh & { userData: any };
    const projectId = mesh.userData.projectId as string | undefined;
    if (projectId) {
      const project =
        props.projectList.projects.find((p) => p.id === projectId) ?? null;
      emit('projectSelected', project);
      return;
    }
  }

  emit('projectSelected', null);
}

onMounted(() => {
  createRoom();
  if (props.projectList) {
    buildFrames();
  }
  window.addEventListener('resize', onResize);
  container.value?.addEventListener('click', onClick);
  animate();
});

watch(
  () => props.projectList,
  (newVal) => {
    if (newVal && scene) {
      buildFrames();
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  container.value?.removeEventListener('click', onClick);
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  font-size: 0.9rem;
  pointer-events: none;
}

.hint {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  font-size: 0.8rem;
  color: #e5e7eb;
  opacity: 0.8;
  pointer-events: none;
}
</style>

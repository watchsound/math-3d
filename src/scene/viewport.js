import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Create the WebGL canvas, scene, camera, and orbit controls.
 * Returns helpers for adding/removing the active surface mesh and for resizing.
 */
export function createViewport(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x05060a, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.06);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(4.5, 3.0, 4.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 1.5;
  controls.maxDistance = 30;

  // Lighting is mostly handled inside the shader, but a faint hemisphere
  // light is added to seed ambient terms in case future surfaces opt into
  // the standard material.
  scene.add(new THREE.HemisphereLight(0xaaccff, 0x222233, 0.35));

  let currentMesh = null;

  function setMesh(mesh) {
    if (currentMesh) scene.remove(currentMesh);
    currentMesh = mesh;
    if (mesh) scene.add(mesh);
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    camera,
    controls,
    setMesh,
    getMesh: () => currentMesh,
    resize,
  };
}

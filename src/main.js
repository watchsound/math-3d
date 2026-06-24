import './styles/main.css';

import { createViewport } from './scene/viewport.js';
import { MeshClient } from './scene/meshClient.js';
import { buildSurfaceMesh, disposeSurfaceMesh } from './scene/surfaceMesh.js';
import { surfaces, surfaceById } from './surfaces/registry.js';
import { mountLeftPanel } from './ui/leftPanel.js';
import { mountRightPanel } from './ui/rightPanel.js';
import { mountControls } from './ui/controls.js';
import { tickAnime, animateSurfaceIn } from './ui/transitions.js';
import { ParticleTransition, sampleMeshPositions, PARTICLE_COUNT } from './scene/particleTransition.js';

const leftRoot = document.getElementById('left-panel');
const rightRoot = document.getElementById('right-panel');
const controlsRoot = document.getElementById('controls');
const viewportEl = document.getElementById('viewport');
const loadingEl   = document.getElementById('loading-overlay');
const computeBarEl = document.getElementById('compute-bar');

const viewport = createViewport(viewportEl);
const meshClient = new MeshClient();

let currentSurfaceId = null;
let pendingRequestKey = null;
let lastDispatchedKey = null;
let isRecomputing = false;
let nextMeshIsSurfaceSwitch = false;

// Particle morph state
let activeParticleTransition = null; // running ParticleTransition, or null
let pendingOldPositions = null;      // sampled from old mesh before it's disposed

const leftPanel = mountLeftPanel(leftRoot);
const rightPanel = mountRightPanel(rightRoot, {
  onSelect: (surfaceId) => switchSurface(surfaceId),
});
const controls = mountControls(controlsRoot, {
  onChange: (state) => {
    // We re-request the mesh on any state change other than pure curvature
    // shader changes (those are uniforms only).
    if (state.eventKey === 'curvature') {
      applyCurvatureUniforms(state.curvature);
      return;
    }
    requestMesh();
  },
});

async function switchSurface(surfaceId) {
  const surface = surfaceById.get(surfaceId);
  if (!surface) return;

  // Abort any particle transition that is still mid-flight.
  if (activeParticleTransition) {
    viewport.scene.remove(activeParticleTransition.points);
    activeParticleTransition.dispose();
    activeParticleTransition = null;
  }

  currentSurfaceId = surfaceId;
  leftPanel.update(surface);
  controls.setSurface(surface);
  rightPanel.setActive(surfaceId);
  rightPanel.update({
    gridRes: controls.getState().gridRes,
    isovalue: controls.getState().isovalue,
  });

  // Capture old-mesh positions NOW while it is still alive and visible.
  // The old mesh stays in the scene while the worker computes the new one —
  // no blank screen and no loading overlay during the wait.
  const oldMesh = viewport.getMesh();
  pendingOldPositions = oldMesh ? sampleMeshPositions(oldMesh, PARTICLE_COUNT) : null;

  nextMeshIsSurfaceSwitch = true;
  requestMesh();
}

async function requestMesh() {
  if (!currentSurfaceId) return;
  const surface = surfaceById.get(currentSurfaceId);
  const state = controls.getState();

  const req = {
    surfaceId: surface.id,
    equation: surface.equation,
    isovalue: state.isovalue,
    gridRes: state.gridRes,
    box: surface.box,
    params: state.params,
  };

  // Consume the surface-switch flag immediately so rapid slider changes after
  // a switch don't also get treated as surface switches.
  const isSurfaceSwitch = nextMeshIsSurfaceSwitch;
  nextMeshIsSurfaceSwitch = false;

  // De-duplicate: if a request with identical params is in flight, skip.
  const key = JSON.stringify(req);
  if (key === pendingRequestKey) return;
  pendingRequestKey = key;
  lastDispatchedKey = key;

  // The neon bar shows for every compute — surface switch or slider drag.
  // The full dark overlay only appears for slider changes (old mesh is gone);
  // surface switches keep the old mesh visible so no overlay is needed.
  showComputeBar(true);
  if (!isSurfaceSwitch) showLoading(true);
  isRecomputing = true;

  const result = await meshClient.request(req);

  pendingRequestKey = null;
  isRecomputing = false;
  showLoading(false);
  showComputeBar(false);

  if (result.stale) return;
  if (!result.ok) {
    console.error(`[mesh] ${surface.id}:`, result.error);
    return;
  }
  // If the user has moved on to another surface, drop this result.
  if (key !== lastDispatchedKey) return;

  const mesh = buildSurfaceMesh(result, surface.palette);
  applyCurvatureUniforms(state.curvature, mesh);

  if (isSurfaceSwitch && pendingOldPositions) {
    // ── Particle morph transition ──────────────────────────────────────────
    // Abort any stale transition from rapid switching.
    if (activeParticleTransition) {
      viewport.scene.remove(activeParticleTransition.points);
      activeParticleTransition.dispose();
      activeParticleTransition = null;
    }

    // Old mesh is still in the viewport — dispose it now that we have the new one.
    const old = viewport.getMesh();
    if (old) disposeSurfaceMesh(old);

    const newPositions = sampleMeshPositions(mesh, PARTICLE_COUNT);
    const pt = new ParticleTransition(pendingOldPositions, newPositions, surface.palette);
    pendingOldPositions = null;
    activeParticleTransition = pt;

    // New mesh is hidden (opacity 0) behind the particle cloud.
    viewport.setMesh(mesh);
    mesh.material.uniforms.uOpacity.value = 0;
    mesh.material.transparent = true;
    viewport.scene.add(pt.points);

    pt.start().then(() => {
      viewport.scene.remove(pt.points);
      pt.dispose();
      if (activeParticleTransition === pt) {
        activeParticleTransition = null;
        animateSurfaceIn(mesh);
      }
    });
  } else {
    // First load, or slider/param update — no particle morph.
    const old = viewport.getMesh();
    if (old) disposeSurfaceMesh(old);
    viewport.setMesh(mesh);
    if (isSurfaceSwitch) animateSurfaceIn(mesh); // first-ever load
  }

  rightPanel.update({
    gridRes: state.gridRes,
    isovalue: state.isovalue,
    vertexCount: result.vertexCount,
    triangleCount: result.triangleCount,
    elapsedMs: result.elapsedMs,
  });
}

function applyCurvatureUniforms(curv, meshArg) {
  const m = meshArg ?? viewport.getMesh();
  if (!m) return;
  m.material.uniforms.uCurvatureBlend.value = curv.blend;
  m.material.uniforms.uCurvatureMode.value = curv.mode;
  // Choose the right magnitude scale based on which curvature we color by.
  const scale = curv.mode === 1 ? m.userData.gaussianScale : m.userData.meanScale;
  m.material.uniforms.uCurvatureScale.value = scale;
}

function showLoading(active) {
  loadingEl.classList.toggle('active', active);
}

function showComputeBar(active) {
  computeBarEl.classList.toggle('active', active);
}

// Render loop: anime.js tick + Three.js draw.
viewport.renderer.setAnimationLoop((time) => {
  tickAnime(time);
  viewport.controls.update();
  const m = viewport.getMesh();
  if (m) m.material.uniforms.uTime.value = time * 0.001;
  if (activeParticleTransition) activeParticleTransition.tick(time * 0.001);
  viewport.renderer.render(viewport.scene, viewport.camera);
});

// Boot with the gyroid: a friendly first impression.
switchSurface('gyroid');

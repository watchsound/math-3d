import './styles/main.css';

import { createViewport } from './scene/viewport.js';
import { MeshClient } from './scene/meshClient.js';
import { buildSurfaceMesh, disposeSurfaceMesh } from './scene/surfaceMesh.js';
import { surfaces, surfaceById, categories, addCustomSurface, removeCustomSurface } from './surfaces/registry.js';
import { mountLeftPanel } from './ui/leftPanel.js';
import { mountRightPanel } from './ui/rightPanel.js';
import { createAddSurfaceModal } from './ui/addSurfaceModal.js';
import { mountControls } from './ui/controls.js';
import { animate } from 'animejs';
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
  onDelete: (surfaceId) => {
    removeCustomSurface(surfaceId);
    rightPanel.renderList();
    // If we deleted the active surface, fall back to gyroid
    if (currentSurfaceId === surfaceId) switchSurface('gyroid');
  },
  onOpenAdd: () => addModal.open(),
});

const addModal = createAddSurfaceModal({
  categories,
  onAdd: (def) => {
    addCustomSurface(def);
    rightPanel.renderList();
    switchSurface(def.id);
  },
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
    // ── Particle morph: disintegrate → cloud → reassemble ─────────────────
    if (activeParticleTransition) {
      viewport.scene.remove(activeParticleTransition.points);
      activeParticleTransition.dispose();
      activeParticleTransition = null;
    }

    // Old mesh is still alive in the viewport.  We take it out of viewport's
    // management but keep it in the scene so we can fade it out ourselves.
    const oldMesh = viewport.getMesh();
    viewport.setMesh(null); // clears viewport ref + removes from scene
    if (oldMesh) {
      viewport.scene.add(oldMesh); // manually re-add for the fade-out
      oldMesh.material.transparent = true;
      // Fade old mesh to zero WHILE particles are emerging — this is the
      // "mesh dissolves into particles" effect.
      animate(oldMesh, {
        uOpacity:   0,
        duration:   900,
        ease:       'outCubic',
        onComplete: () => {
          viewport.scene.remove(oldMesh);
          disposeSurfaceMesh(oldMesh);
        },
      });
    }

    // New mesh starts hidden; particles run in front of it.
    viewport.setMesh(mesh);
    mesh.material.uniforms.uOpacity.value = 0;
    mesh.material.transparent = true;

    const newPositions = sampleMeshPositions(mesh, PARTICLE_COUNT);
    const pt = new ParticleTransition(pendingOldPositions, newPositions, surface.palette);
    pendingOldPositions = null;
    activeParticleTransition = pt;
    viewport.scene.add(pt.points);

    pt.start().then(() => {
      viewport.scene.remove(pt.points);
      pt.dispose();
      if (activeParticleTransition === pt) {
        activeParticleTransition = null;
        animateSurfaceIn(mesh); // new mesh materialises
      }
    });
  } else {
    // First load, or slider/param update — no particle morph.
    const old = viewport.getMesh();
    if (old) disposeSurfaceMesh(old);
    viewport.setMesh(mesh);
    if (isSurfaceSwitch) animateSurfaceIn(mesh);
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

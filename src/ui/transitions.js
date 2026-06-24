import { animate, createTimeline, engine } from 'animejs';
import 'animejs/adapters/three';

/**
 * anime.js v4.5.0 with the Three.js adapter handles cross-surface transitions.
 *
 * We disable anime's default main loop and tick it manually from inside
 * Three.js's `setAnimationLoop` callback. This keeps everything on the same
 * frame clock — see https://animejs.com/documentation/adapters/threejs-adapter/.
 */

engine.useDefaultMainLoop = false;

export function tickAnime(timeMs) {
  engine.update();
  // (engine.update reads its own clock; we don't need to forward timeMs.)
}

/**
 * Fade in a freshly-attached mesh: rotate ~30° on Y, opacity 0 → 1, rim power
 * pulse from 3 → 1.5. Returns the anime timeline so the caller can chain.
 */
export function animateSurfaceIn(mesh) {
  if (!mesh) return;
  const u = mesh.material.uniforms;

  // Start from a transparent, over-rim look so the surface "materializes".
  mesh.material.transparent = true;
  u.uOpacity.value = 0;
  u.uRimPower.value = 4.0;
  mesh.rotation.y = -0.6;

  const tl = createTimeline({
    defaults: { ease: 'outExpo' },
    onComplete: () => {
      mesh.material.transparent = false;
    },
  });

  tl.add(mesh, {
    rotateY: 0,
    duration: 1200,
  }, 0);
  tl.add(mesh, {
    uOpacity: 1.0,
    uRimPower: 1.5,
    duration: 900,
  }, 0);

  return tl;
}

/** Fade out a mesh that is about to be replaced. */
export function animateSurfaceOut(mesh, onComplete) {
  if (!mesh) {
    onComplete?.();
    return;
  }
  mesh.material.transparent = true;
  animate(mesh, {
    uOpacity: 0,
    rotateY: '+=0.4',
    duration: 350,
    ease: 'inQuad',
    onComplete,
  });
}

/** Tween an isovalue change. Re-issues a mesh request when the worker is idle. */
export function pulseIsovalueUI(scrubElement) {
  if (!scrubElement) return;
  animate(scrubElement, {
    opacity: [0.4, 1],
    duration: 350,
    ease: 'outQuad',
  });
}

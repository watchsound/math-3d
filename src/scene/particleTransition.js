import * as THREE from 'three';
import { animate } from 'animejs';

export const PARTICLE_COUNT = 6000;

// ── GLSL ─────────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
attribute vec3  aEnd;
attribute float aRand;   // per-particle [0,1] uniform random
uniform float   uProgress;
uniform float   uTime;

#define PI 3.14159265358979

void main() {
  // scatter: 0→1 over first half  (sin arc: explode out, contract back)
  // morph:   0→1 over second half (flow from old shape to new shape)
  float scatter = smoothstep(0.0, 0.5, uProgress);
  float morph   = smoothstep(0.5, 1.0, uProgress);

  // Scatter direction: radially outward from origin, randomised per particle
  vec3 bDir = (length(position) > 1e-3)
    ? normalize(position)
    : vec3(0.0, 1.0, 0.0);
  bDir = normalize(bDir + 0.65 * normalize(vec3(
    sin(aRand * 7.31 + 1.10),
    cos(aRand * 5.71 + 2.30),
    sin(aRand * 6.17 - 0.70)
  )));

  // sin arc: burst peaks at scatter = 0.5, returns to 0 at scatter = 1
  float burst    = sin(scatter * PI) * (0.55 + aRand * 0.50);
  vec3 scattered = position + bDir * burst;

  // Organic turbulent swirl during the scatter arc
  float swirl = sin(scatter * PI) * 0.075;
  scattered += swirl * vec3(
    sin(aRand * 13.7 + uTime * 2.10),
    cos(aRand * 11.3 + uTime * 1.75),
    sin(aRand *  9.9 + uTime * 2.50)
  );

  // After scatter collapses back to old shape, flow linearly to new shape
  vec3 pos = mix(scattered, aEnd, morph);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position    = projectionMatrix * mv;
  gl_PointSize   = clamp(40.0 / -mv.z, 0.8, 5.5);
}
`;

const FRAG = /* glsl */`
uniform vec3  uColorMid;
uniform vec3  uColorEdge;
uniform float uProgress;

#define PI 3.14159265358979

void main() {
  vec2  uv = gl_PointCoord - 0.5;
  float r  = length(uv);
  if (r > 0.5) discard;

  float soft       = 1.0 - smoothstep(0.10, 0.50, r);
  float visibility = sin(uProgress * PI);       // fade in → peak → fade out
  float alpha      = soft * visibility * 0.88;

  vec3 col = mix(uColorMid, uColorEdge, smoothstep(0.0, 0.35, r));
  gl_FragColor = vec4(col, alpha);
}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Evenly subsample (or repeat) n vertices from a mesh into a Float32Array[n*3].
 * Positions are in the mesh's local space (= world space, since meshes sit at origin).
 */
export function sampleMeshPositions(mesh, n) {
  const src   = mesh.geometry.attributes.position.array;
  const total = src.length / 3;
  const out   = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const s = Math.min(Math.floor((i / n) * total), total - 1);
    out[i * 3]     = src[s * 3];
    out[i * 3 + 1] = src[s * 3 + 1];
    out[i * 3 + 2] = src[s * 3 + 2];
  }
  return out;
}

// ── ParticleTransition ────────────────────────────────────────────────────────

export class ParticleTransition {
  /**
   * @param {Float32Array} startPositions  PARTICLE_COUNT * 3 floats (old mesh)
   * @param {Float32Array} endPositions    PARTICLE_COUNT * 3 floats (new mesh)
   * @param {{ mid: string, edge: string }} palette
   */
  constructor(startPositions, endPositions, palette) {
    const rand = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) rand[i] = Math.random();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(startPositions, 3));
    geo.setAttribute('aEnd',     new THREE.BufferAttribute(endPositions,   3));
    geo.setAttribute('aRand',    new THREE.BufferAttribute(rand,           1));

    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uProgress:  { value: 0.0 },
        uTime:      { value: 0.0 },
        uColorMid:  { value: new THREE.Color(palette.mid) },
        uColorEdge: { value: new THREE.Color(palette.edge) },
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, mat);
    this._mat   = mat;
    this._geo   = geo;
  }

  /**
   * Begin the scatter → morph animation.
   * Returns a Promise that resolves when the 1 800 ms sequence completes.
   */
  start() {
    return new Promise((resolve) => {
      animate(this._mat.uniforms.uProgress, {
        value:      1.0,
        duration:   1800,
        ease:       'linear',
        onComplete: resolve,
      });
    });
  }

  /** Call each frame with elapsed seconds to drive the turbulence clock. */
  tick(timeSec) {
    this._mat.uniforms.uTime.value = timeSec;
  }

  dispose() {
    this._geo.dispose();
    this._mat.dispose();
  }
}

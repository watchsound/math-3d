import * as THREE from 'three';
import { animate } from 'animejs';

export const PARTICLE_COUNT = 6000;

// ── GLSL ─────────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
attribute vec3  aEnd;
attribute float aRand;
uniform float   uProgress;
uniform float   uTime;
uniform float   uPixelRatio;   // window.devicePixelRatio, for consistent apparent size

void main() {
  float scatter = smoothstep(0.0, 0.5, uProgress);
  float morph   = smoothstep(0.5, 1.0, uProgress);

  // Radially outward scatter direction, randomised per particle.
  vec3 bDir = (length(position) > 1e-3)
    ? normalize(position)
    : vec3(0.0, 1.0, 0.0);
  bDir = normalize(bDir + 0.65 * normalize(vec3(
    sin(aRand * 7.31 + 1.10),
    cos(aRand * 5.71 + 2.30),
    sin(aRand * 6.17 - 0.70)
  )));

  // Phase 1: burst outward — stays scattered once scatter = 1.
  float burst    = scatter * (0.65 + aRand * 0.55);
  vec3 scattered = position + bDir * burst;

  // Organic turbulence peaks at scatter = 0.5.
  float turb = scatter * (1.0 - scatter) * 4.0 * 0.14;
  scattered += turb * vec3(
    sin(aRand * 13.7 + uTime * 2.1),
    cos(aRand * 11.3 + uTime * 1.7),
    sin(aRand *  9.9 + uTime * 2.5)
  );

  // Phase 2: converge from scattered cloud to new-mesh positions.
  vec3 pos = mix(scattered, aEnd, morph);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Point size in device pixels → consistent apparent CSS size on any DPR.
  gl_PointSize = clamp(110.0 / -mv.z, 2.5, 20.0) * uPixelRatio;
}
`;

// Procedural particle texture:
//   • soft exponential glow  (hot ember core)
//   • 4-spike diffraction cross  (sci-fi crystal sparkle)
//   • palette-coloured halo

const FRAG = /* glsl */`
uniform vec3  uColorMid;
uniform vec3  uColorEdge;
uniform float uProgress;

void main() {
  vec2  uv = gl_PointCoord - 0.5;
  float r  = length(uv);
  if (r > 0.5) discard;

  // ── Core + halo glow ───────────────────────────────────────────────
  float core = exp(-r * r * 24.0);        // tight bright center
  float halo = exp(-r * r * 6.0) * 0.55; // wide soft bloom

  // ── 4-spike diffraction cross ──────────────────────────────────────
  // Each arm is a narrow ridge along x=0 or y=0, clipped to the disc.
  float armX  = pow(max(0.0, 1.0 - abs(uv.x) * 12.0), 2.5);
  float armY  = pow(max(0.0, 1.0 - abs(uv.y) * 12.0), 2.5);
  float cross = (armX + armY) * max(0.0, 1.0 - r * 2.1) * 0.32;

  float brightness = core + halo + cross;

  // ── Colour: white core → palette mid → palette edge ────────────────
  vec3 col = mix(vec3(0.92, 0.96, 1.00), uColorMid,  smoothstep(0.00, 0.18, r));
  col      = mix(col,                     uColorEdge,  smoothstep(0.18, 0.46, r));

  // ── Fade in/out envelope ───────────────────────────────────────────
  float fadeIn  = smoothstep(0.00, 0.18, uProgress);
  float fadeOut = 1.0 - smoothstep(0.82, 1.00, uProgress);

  gl_FragColor = vec4(col, brightness * fadeIn * fadeOut);
}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        uProgress:   { value: 0.0 },
        uTime:       { value: 0.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColorMid:   { value: new THREE.Color(palette.mid) },
        uColorEdge:  { value: new THREE.Color(palette.edge) },
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, mat);
    this._mat   = mat;
    this._geo   = geo;
  }

  start() {
    return new Promise((resolve) => {
      animate(this._mat.uniforms.uProgress, {
        value:      1.0,
        duration:   2000,
        ease:       'linear',
        onComplete: resolve,
      });
    });
  }

  tick(timeSec) {
    this._mat.uniforms.uTime.value = timeSec;
  }

  dispose() {
    this._geo.dispose();
    this._mat.dispose();
  }
}

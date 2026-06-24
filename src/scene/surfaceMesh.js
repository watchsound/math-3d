import * as THREE from 'three';
import vertSrc from './shaders/surface.vert.glsl?raw';
import fragSrc from './shaders/surface.frag.glsl?raw';

/**
 * Build a Three.js mesh from a worker payload. The returned mesh owns its
 * geometry and material; dispose via `disposeSurfaceMesh()` on swap.
 */
export function buildSurfaceMesh(payload, palette) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(payload.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(payload.normals, 3));
  geometry.setAttribute('curvature', new THREE.BufferAttribute(payload.curvature, 2));

  const cs = payload.curvatureStats;
  // Choose a sane scale: 1 / (p99 of |curvature|) so the diverging map saturates
  // at the 99th percentile of magnitude rather than at outliers.
  const meanScale = cs.hAbsP99 > 0 ? 1 / cs.hAbsP99 : 1;

  const material = new THREE.ShaderMaterial({
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    side: THREE.DoubleSide,
    transparent: false,
    uniforms: {
      uPaletteCore: { value: new THREE.Color(palette.core) },
      uPaletteMid:  { value: new THREE.Color(palette.mid) },
      uPaletteEdge: { value: new THREE.Color(palette.edge) },
      uCurvatureBlend: { value: 0.0 },
      uCurvatureMode:  { value: 0.0 }, // 0 = mean, 1 = gaussian
      uCurvatureScale: { value: meanScale },
      uRimPower:    { value: 1.5 },
      uGridStrength:{ value: 0.18 },
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.curvatureStats = cs;
  mesh.userData.meanScale = meanScale;
  mesh.userData.gaussianScale = cs.kAbsP99 > 0 ? 1 / cs.kAbsP99 : 1;
  return mesh;
}

export function disposeSurfaceMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
    else mesh.material.dispose();
  }
}

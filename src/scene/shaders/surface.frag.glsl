// Fragment shader: neon rim gradient + curvature colormap, blended.
//
//   uPaletteCore / Mid / Edge define the 3-stop "rim field" gradient.
//   uCurvatureBlend in [0, 1] mixes from rim-only to curvature-colored.
//   uCurvatureMode  0 = mean curvature H, 1 = Gaussian curvature K.
//   uCurvatureScale normalizes |curvature| -> [0, 1] before colormap lookup.

precision highp float;

uniform vec3  uPaletteCore;
uniform vec3  uPaletteMid;
uniform vec3  uPaletteEdge;
uniform float uCurvatureBlend;
uniform float uCurvatureMode;
uniform float uCurvatureScale;
uniform float uTime;
uniform float uRimPower;
uniform float uGridStrength;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vCurvature;

vec3 paletteLerp(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.5) {
    return mix(uPaletteCore, uPaletteMid, t * 2.0);
  } else {
    return mix(uPaletteMid, uPaletteEdge, (t - 0.5) * 2.0);
  }
}

// Diverging colormap for signed curvature: negative (cool) → 0 (dim) → positive (warm).
vec3 divergingMap(float s) {
  // s in [-1, 1]
  vec3 neg = vec3(0.20, 0.55, 1.00); // blue
  vec3 mid = vec3(0.05, 0.05, 0.08); // near black
  vec3 pos = vec3(1.00, 0.55, 0.20); // amber
  if (s < 0.0) {
    return mix(mid, neg, clamp(-s, 0.0, 1.0));
  }
  return mix(mid, pos, clamp(s, 0.0, 1.0));
}

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(vViewDir);

  float ndv = clamp(dot(N, V), 0.0, 1.0);
  // Rim field: 0 in the center, 1 at silhouette edges.
  float rim = pow(1.0 - ndv, uRimPower);

  vec3 rimColor = paletteLerp(rim);

  // Curvature colormap (signed, normalized).
  float curvSelected = mix(vCurvature.y, vCurvature.x, uCurvatureMode);
  float signedNorm = clamp(curvSelected * uCurvatureScale, -1.0, 1.0);
  vec3 curvColor = divergingMap(signedNorm);

  // Re-tint curvature output with the surface palette so it stays cohesive.
  vec3 paletteTint = paletteLerp(0.5 + 0.5 * signedNorm);
  curvColor = mix(curvColor, paletteTint, 0.35);

  vec3 base = mix(rimColor, curvColor, uCurvatureBlend);

  // Subtle world-space scan grid overlay (the wireframe-ish texture in the
  // screenshots). Period 0.5 in world units.
  vec3 wg = abs(fract(vWorldPos * 2.0) - 0.5);
  float gridLine = smoothstep(0.45, 0.5, max(max(wg.x, wg.y), wg.z));
  base += vec3(gridLine) * uGridStrength * (0.4 + 0.6 * rim);

  // Soft ambient + view-aligned glow.
  float glow = 0.6 + 0.4 * rim;
  vec3 color = base * glow;

  gl_FragColor = vec4(color, 1.0);
}

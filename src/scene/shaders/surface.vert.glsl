// Vertex shader for the topology lab surface.
// Passes world position, world-space normal, and (K, H) curvature attributes
// down to the fragment shader for rim + curvature blending.

attribute vec2 curvature;   // x = K (Gaussian), y = H (mean)

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vCurvature;

void main() {
  vec4 worldPos4 = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos4.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos4.xyz);
  vCurvature = curvature;

  gl_Position = projectionMatrix * viewMatrix * worldPos4;
}

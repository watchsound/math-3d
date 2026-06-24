/**
 * Differential geometry of an implicit surface f(x,y,z) = c.
 *
 * For implicit surfaces, with g = ∇f and H = Hess(f):
 *
 *   Mean curvature:
 *     H_mean = (g · H · gᵀ − |g|² · tr(H)) / (2 |g|³)
 *
 *   Gaussian curvature (Goldman 2005 formula):
 *     K = (g · adj(H) · gᵀ) / |g|⁴
 *
 *   where adj(H) is the classical adjugate (cofactor-transpose) of H.
 *
 * Reference: Ron Goldman, "Curvature formulas for implicit curves and surfaces",
 * Computer Aided Geometric Design 22 (2005) 632–658.
 */

export function meanCurvature(grad, H) {
  const [gx, gy, gz] = grad;
  const g2 = gx * gx + gy * gy + gz * gz;
  if (g2 === 0) return 0;
  const gmag = Math.sqrt(g2);

  const gHg =
    gx * (H[0][0] * gx + H[0][1] * gy + H[0][2] * gz) +
    gy * (H[1][0] * gx + H[1][1] * gy + H[1][2] * gz) +
    gz * (H[2][0] * gx + H[2][1] * gy + H[2][2] * gz);

  const trH = H[0][0] + H[1][1] + H[2][2];

  return (gHg - g2 * trH) / (2 * g2 * gmag);
}

export function gaussianCurvature(grad, H) {
  const [gx, gy, gz] = grad;
  const g2 = gx * gx + gy * gy + gz * gz;
  if (g2 === 0) return 0;

  const adj = adjugate3(H);

  const gAg =
    gx * (adj[0][0] * gx + adj[0][1] * gy + adj[0][2] * gz) +
    gy * (adj[1][0] * gx + adj[1][1] * gy + adj[1][2] * gz) +
    gz * (adj[2][0] * gx + adj[2][1] * gy + adj[2][2] * gz);

  return gAg / (g2 * g2);
}

/** Classical adjugate (transpose of cofactor matrix) of a 3x3 matrix. */
export function adjugate3(M) {
  const a = M[0][0], b = M[0][1], c = M[0][2];
  const d = M[1][0], e = M[1][1], f = M[1][2];
  const g = M[2][0], h = M[2][1], i = M[2][2];

  return [
    [ e * i - f * h, -(b * i - c * h),   b * f - c * e],
    [-(d * i - f * g),  a * i - c * g, -(a * f - c * d)],
    [ d * h - e * g, -(a * h - b * g),   a * e - b * d],
  ];
}

/** L2 length of a 3-vector. */
export function vlen3(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

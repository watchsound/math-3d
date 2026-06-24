import { describe, it, expect } from 'vitest';
import { compileSurface } from '../../src/math/expression.js';
import { extractSurface } from '../../src/marchingCubes/extract.js';
import { meanCurvature, gaussianCurvature } from '../../src/math/curvature.js';

/**
 * Integration: run the actual pipeline (compile -> sample -> march -> curvature)
 * on a unit sphere f(x,y,z) = x² + y² + z² - 1 = 0 and verify topology + curvature.
 */
describe('mesh pipeline end-to-end', () => {
  it('extracts a sphere with the right vertex count order of magnitude and known curvature', () => {
    const surface = compileSurface('x^2 + y^2 + z^2 - 1');

    const result = extractSurface({
      f: (x, y, z) => surface.f(x, y, z),
      grad: (x, y, z) => surface.gradient(x, y, z),
      hess: (x, y, z) => surface.hessian(x, y, z),
      isovalue: 0,
      gridRes: 48,
      box: { min: -1.4, max: 1.4 },
      curvature: (g, H) => [gaussianCurvature(g, H), meanCurvature(g, H)],
    });

    // The unit sphere should yield thousands of triangles at 48³ resolution.
    expect(result.triangleCount).toBeGreaterThan(1000);
    expect(result.vertexCount).toBe(result.triangleCount * 3);

    // Every vertex of a unit sphere has Gaussian curvature = 1 and mean = ±1.
    // Sampling a few vertices to confirm.
    const K0 = result.curvature[0];
    const H0 = result.curvature[1];
    expect(Math.abs(Math.abs(K0) - 1)).toBeLessThan(0.05);
    expect(Math.abs(Math.abs(H0) - 1)).toBeLessThan(0.05);

    // All emitted positions should lie close to the sphere of radius 1.
    let maxErr = 0;
    for (let i = 0; i < result.positions.length; i += 3) {
      const r = Math.hypot(result.positions[i], result.positions[i + 1], result.positions[i + 2]);
      const err = Math.abs(r - 1);
      if (err > maxErr) maxErr = err;
    }
    // With trilinear interpolation at 48³, max radial error stays under a few %.
    expect(maxErr).toBeLessThan(0.05);
  });
});

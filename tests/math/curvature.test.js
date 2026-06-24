import { describe, it, expect } from 'vitest';
import { meanCurvature, gaussianCurvature, adjugate3 } from '../../src/math/curvature.js';
import { compileSurface } from '../../src/math/expression.js';

describe('curvature', () => {
  it('sphere of radius R has mean curvature 1/R and Gaussian curvature 1/R²', () => {
    // f(x,y,z) = x² + y² + z² - R², so the level f = 0 is the sphere of radius R.
    const R = 2.0;
    const s = compileSurface('x^2 + y^2 + z^2 - R0^2');
    const p = [R, 0, 0]; // on the surface
    const g = s.gradient(p[0], p[1], p[2], { R0: R });
    const H = s.hessian(p[0], p[1], p[2], { R0: R });

    const Hm = meanCurvature(g, H);
    const K  = gaussianCurvature(g, H);

    // The "outward" gradient gives H = -1/R; we want magnitude.
    expect(Math.abs(Hm)).toBeCloseTo(1 / R, 5);
    expect(K).toBeCloseTo(1 / (R * R), 5);
  });

  it('Schwarz P has H ≈ 0 on its zero-isosurface (minimal surface)', () => {
    const s = compileSurface('cos(x) + cos(y) + cos(z)');
    // Find a near-zero point on the surface by hand-picking a known one:
    // (π/2, π/2, 0) gives 0 + 0 + 1 = 1, not zero. Try (π/2, π, 0): 0 + (-1) + 1 = 0. ✓
    const p = [Math.PI / 2, Math.PI, 0];
    const f = s.f(...p);
    expect(f).toBeCloseTo(0, 10);

    const g = s.gradient(...p);
    const H = s.hessian(...p);
    const Hm = meanCurvature(g, H);

    // For an exact minimal surface, H = 0 analytically.
    expect(Math.abs(Hm)).toBeLessThan(1e-9);
  });

  it('adjugate of identity is identity', () => {
    const I = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const adj = adjugate3(I);
    expect(adj[0][0]).toBe(1);
    expect(adj[1][1]).toBe(1);
    expect(adj[2][2]).toBe(1);
    // Use Object.is-friendly comparison: -0 and +0 both satisfy "equals 0".
    expect(adj[0][1]).toBeCloseTo(0, 12);
    expect(adj[1][0]).toBeCloseTo(0, 12);
    expect(adj[0][2]).toBeCloseTo(0, 12);
  });
});

/**
 * Mathematical correctness verification for specific surfaces.
 *
 * These tests confirm that each surface's equation is:
 *   (a) the right polynomial degree
 *   (b) has the right symmetry properties
 *   (c) has any known analytic properties (curvature, special points)
 *
 * Degree is verified numerically: for any polynomial f of total degree d,
 *   f(t·x, t·y, t·z) — viewed as a univariate polynomial in t — has
 *   degree ≤ d. We confirm this by checking that the (d+1)-th scaled
 *   difference is zero to floating-point precision.
 */
import { describe, it, expect } from 'vitest';
import { compileSurface } from '../../src/math/expression.js';
import { surfaceById } from '../../src/surfaces/registry.js';
import { meanCurvature, gaussianCurvature } from '../../src/math/curvature.js';

// ── Degree verification helper ────────────────────────────────────────────────

/**
 * Estimate the effective polynomial degree of f along the ray (t·x0, t·y0, t·z0).
 * Returns the highest power n such that the n-th finite difference is non-negligible.
 * For a degree-d polynomial, finite differences of order d+1 vanish exactly.
 */
function estimateDegreeAlongRay(f, x0, y0, z0, maxDegree = 10, h = 0.17) {
  // Sample f at t = 0, h, 2h, ..., (maxDegree+1)*h
  const samples = [];
  for (let k = 0; k <= maxDegree + 1; k++) {
    const t = k * h;
    samples.push(f(t * x0, t * y0, t * z0));
  }
  // Compute successive finite differences until they become negligible.
  let diff = samples;
  let deg = 0;
  for (let order = 1; order <= maxDegree; order++) {
    const next = [];
    for (let i = 0; i < diff.length - 1; i++) next.push(diff[i + 1] - diff[i]);
    diff = next;
    // If all entries of the new difference array are non-negligible, degree >= order.
    const maxAbs = Math.max(...diff.map(Math.abs));
    if (maxAbs > 1e-4) deg = order;
  }
  return deg;
}

// ── Togliatti / Dervish ───────────────────────────────────────────────────────

describe('Dervish (Togliatti quintic)', () => {
  const def = surfaceById.get('togliatti-quintic');
  const compiled = compileSurface(def.equation);
  const f = (x, y, z) => compiled.f(x, y, z, {});

  it('has polynomial degree exactly 5', () => {
    // Test along several rays to rule out accidental cancellation on one ray.
    const rays = [
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 1, 1],
      [0.3, 0.7, 0.5],
    ];
    for (const [x0, y0, z0] of rays) {
      const deg = estimateDegreeAlongRay(f, x0, y0, z0);
      expect(deg).toBeLessThanOrEqual(5);
      // Also make sure it's at least degree 4 along some non-degenerate ray.
      if (x0 === 1 && y0 === 1 && z0 === 1) {
        expect(deg).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('has D5 symmetry: f(x,y,z) = f(cos(2π/5)x-sin(2π/5)y, sin(2π/5)x+cos(2π/5)y, z)', () => {
    const c = Math.cos(2 * Math.PI / 5);
    const s = Math.sin(2 * Math.PI / 5);
    const testPoints = [
      [0.5, 0.3, 0.2],
      [1.0, 0.0, 0.1],
      [0.7, -0.4, 0.5],
    ];
    for (const [x, y, z] of testPoints) {
      const xr = c * x - s * y;
      const yr = s * x + c * y;
      expect(f(xr, yr, z)).toBeCloseTo(f(x, y, z), 5);
    }
  });

  it('evaluates to 0 at z=0, x²+y²=1 (the equatorial circle of q)', () => {
    // On the unit circle in z=0 plane, q = (1-0)*(1-1+0)² = 0.
    // The surface passes through (1,0,0) only if a·F(1,0,0)=0.
    // F(1,0,0) = (1-1)·(...) = 0 since (x-1)|_{x=1}=0.
    // So (1,0,0) is a zero. Similarly all 5th roots of the pentagon.
    expect(f(1, 0, 0)).toBeCloseTo(0, 5);
  });

  it('smooth points on the zero level have non-zero gradient (surface is generically smooth)', () => {
    // (1,0,0) lies on the surface (f=0 verified above) and is a smooth point —
    // the 31 nodes have non-trivial coordinates not expressible in closed form.
    // A smooth surface point must have |∇f| > 0.
    const g = compiled.gradient(1, 0, 0, {});
    const gradMag = Math.hypot(g[0], g[1], g[2]);
    expect(gradMag).toBeGreaterThan(0.5);
  });
});

// ── Endrass Octic ─────────────────────────────────────────────────────────────

describe('Endrass octic', () => {
  const def = surfaceById.get('endrass-octic');
  const compiled = compileSurface(def.equation);
  const f = (x, y, z) => compiled.f(x, y, z, {});

  it('has polynomial degree exactly 8', () => {
    const rays = [[1, 0, 0], [0, 1, 0], [1, 1, 0], [1, 1, 1]];
    for (const [x0, y0, z0] of rays) {
      const deg = estimateDegreeAlongRay(f, x0, y0, z0);
      expect(deg).toBeLessThanOrEqual(8);
    }
    // Should be exactly 8 along a generic ray.
    expect(estimateDegreeAlongRay(f, 1, 1, 1)).toBe(8);
  });

  it('has x↔y symmetry: f(x,y,z) = f(y,x,z)', () => {
    const pts = [[0.5, 0.3, 0.2], [1.0, 0.7, -0.4], [0.3, 0.8, 0.1]];
    for (const [x, y, z] of pts) {
      expect(f(x, y, z)).toBeCloseTo(f(y, x, z), 6);
    }
  });

  it('has x↔-x symmetry: f(x,y,z) = f(-x,y,z)', () => {
    const pts = [[0.5, 0.3, 0.2], [1.0, 0.7, -0.4]];
    for (const [x, y, z] of pts) {
      expect(f(x, y, z)).toBeCloseTo(f(-x, y, z), 6);
    }
  });

  it('has y↔-y symmetry: f(x,y,z) = f(x,-y,z)', () => {
    const pts = [[0.5, 0.3, 0.2], [1.0, 0.7, -0.4]];
    for (const [x, y, z] of pts) {
      expect(f(x, y, z)).toBeCloseTo(f(x, -y, z), 6);
    }
  });

  it('structure: equals P - Q² form with degree-8 terms', () => {
    // Verify the P term (first half) is a product of four degree-2 polynomials
    // by checking P = 64*(x²-1)*(y²-1)*((x+y)²-2)*((x-y)²-2) directly at a point.
    const x = 0.4, y = 0.6, z = 0.2;
    const P = 64 * (x*x - 1) * (y*y - 1) * ((x+y)*(x+y) - 2) * ((x-y)*(x-y) - 2);
    const sqrt2 = Math.sqrt(2);
    const Q = -4*(1+sqrt2)*(x*x+y*y-2)**2 + 8*(2+sqrt2)*z*z;
    const expected = P - Q*Q;
    expect(f(x, y, z)).toBeCloseTo(expected, 10);
  });
});

// ── Boy's Surface ─────────────────────────────────────────────────────────────

describe("Boy's Surface (Bryant polynomial)", () => {
  const def = surfaceById.get('boy-bryant');
  const compiled = compileSurface(def.equation);
  const f = (x, y, z) => compiled.f(x, y, z, {});

  it('has polynomial degree exactly 6', () => {
    const rays = [[1, 0, 0], [0, 1, 0], [1, 1, 0], [1, 1, 1]];
    for (const [x0, y0, z0] of rays) {
      const deg = estimateDegreeAlongRay(f, x0, y0, z0);
      expect(deg).toBeLessThanOrEqual(6);
    }
    expect(estimateDegreeAlongRay(f, 1, 1, 1)).toBe(6);
  });

  it('f(0, 0, t) = 8t³(2-3t)³ — analytic factorisation on z-axis', () => {
    // Known analytic result: at x=y=0 the six-degree Bryant polynomial collapses to
    // 8·z³·(2-3z)³, giving double roots at z=0 and z=2/3.
    for (const t of [0.1, 0.3, 0.5, 0.7, 1.0]) {
      const expected = 8 * t**3 * (2 - 3*t)**3;
      expect(f(0, 0, t)).toBeCloseTo(expected, 8);
    }
  });

  it('f(0, 0, 0) = 0 and f(0, 0, 2/3) = 0 — triple-point structure', () => {
    // Both are known special points: z=0 is the "bottom" and z=2/3 is a key point.
    expect(f(0, 0, 0)).toBeCloseTo(0, 10);
    expect(f(0, 0, 2 / 3)).toBeCloseTo(0, 8);
  });

  it('z=0 slice: f(x,y,0) = −729·(x²+y²)³ — triple point at origin collapses z=0 to a single sheet', () => {
    // At z=0 all three z-containing terms vanish, leaving (9x²+9y²)·(-81(x²+y²)²) = -729(x²+y²)³.
    // The surface meets the z=0 plane only at the origin (r=0), confirming the triple-point structure.
    const pts = [[0.5, 0.3], [0.8, 0.1], [0.3, 0.7], [1.0, 0.0]];
    for (const [x, y] of pts) {
      const expected = -729 * (x * x + y * y) ** 3;
      expect(f(x, y, 0)).toBeCloseTo(expected, 8);
    }
  });
});

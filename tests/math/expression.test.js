import { describe, it, expect } from 'vitest';
import { compileSurface } from '../../src/math/expression.js';

describe('compileSurface', () => {
  it('evaluates a simple polynomial', () => {
    const s = compileSurface('x^2 + y^2 + z^2');
    expect(s.f(1, 2, 3)).toBe(14);
  });

  it('returns the analytic gradient', () => {
    const s = compileSurface('x^2 + y^2 + z^2');
    const g = s.gradient(1, 2, 3);
    expect(g[0]).toBeCloseTo(2);
    expect(g[1]).toBeCloseTo(4);
    expect(g[2]).toBeCloseTo(6);
  });

  it('returns the Hessian', () => {
    const s = compileSurface('x*y + y*z');
    const H = s.hessian(0, 0, 0);
    // ∂²/(∂x ∂y) = 1, ∂²/(∂y ∂z) = 1, all others 0.
    expect(H[0][1]).toBeCloseTo(1);
    expect(H[1][0]).toBeCloseTo(1);
    expect(H[1][2]).toBeCloseTo(1);
    expect(H[2][1]).toBeCloseTo(1);
    expect(H[0][0]).toBeCloseTo(0);
  });

  it('passes parameter values through the scope', () => {
    const s = compileSurface('x^2 + y^2 - R0^2');
    expect(s.f(3, 4, 0, { R0: 5 })).toBeCloseTo(0);
  });

  it('handles trig expressions (Gyroid)', () => {
    const s = compileSurface('sin(x)*cos(y) + sin(y)*cos(z) + sin(z)*cos(x)');
    expect(s.f(0, 0, 0)).toBeCloseTo(0);
    expect(typeof s.gradient(0.3, 0.5, 0.7)[0]).toBe('number');
  });

  it('Schwarz P sphere identity: ∇f|origin = 0 (saddle)', () => {
    const s = compileSurface('cos(x) + cos(y) + cos(z)');
    const g = s.gradient(0, 0, 0);
    expect(g[0]).toBeCloseTo(0);
    expect(g[1]).toBeCloseTo(0);
    expect(g[2]).toBeCloseTo(0);
  });
});

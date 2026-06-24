import { describe, it, expect } from 'vitest';
import { compileSurface } from '../../src/math/expression.js';
import { surfaces, surfaceById, categories } from '../../src/surfaces/registry.js';

describe('surface registry', () => {
  it('has the expected 15 surfaces', () => {
    expect(surfaces.length).toBe(15);
  });

  it('every id is unique', () => {
    const ids = surfaces.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every surface declares a known category', () => {
    for (const s of surfaces) {
      expect(categories[s.category]).toBeDefined();
    }
  });

  it('every equation parses and evaluates to a finite number at a sample point', () => {
    for (const s of surfaces) {
      const paramValues = {};
      for (const [k, spec] of Object.entries(s.parameters || {})) {
        paramValues[k] = spec.default;
      }
      let compiled;
      try {
        compiled = compileSurface(s.equation);
      } catch (e) {
        throw new Error(`compile failed for ${s.id}: ${e.message}`);
      }
      // Sample at a point inside the box but offset from the origin to dodge
      // expressions singular at (0,0,0) (atan2(0, 0) is one such case).
      const c = (s.box.min + s.box.max) / 2 + 0.123;
      const v = compiled.f(c, c + 0.07, c + 0.13, paramValues);
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('every surface entry has matching id in lookup map', () => {
    for (const s of surfaces) {
      expect(surfaceById.get(s.id)).toBe(s);
    }
  });
});

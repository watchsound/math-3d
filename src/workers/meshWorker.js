/**
 * Off-main-thread mesh generation.
 *
 * Receives:  { id, surfaceId, equation, isovalue, gridRes, box, params, curvatureMode }
 * Replies:   { id, positions, normals, curvature, rim, vertexCount, triangleCount,
 *              curvatureStats, elapsedMs }
 *
 * The worker compiles the expression once per (surfaceId + parameter signature)
 * via a small cache, then reuses the compiled evaluator across isovalue changes.
 */

import { compileSurface } from '../math/expression.js';
import { extractSurface } from '../marchingCubes/extract.js';
import { meanCurvature, gaussianCurvature } from '../math/curvature.js';

/** @type {Map<string, ReturnType<typeof compileSurface>>} */
const compileCache = new Map();

function getCompiled(surfaceId, equation) {
  const key = `${surfaceId}::${equation}`;
  let compiled = compileCache.get(key);
  if (!compiled) {
    compiled = compileSurface(equation);
    compileCache.set(key, compiled);
  }
  return compiled;
}

self.onmessage = (ev) => {
  const { id, surfaceId, equation, isovalue, gridRes, box, params } = ev.data;
  const start = performance.now();

  let payload;
  try {
    const compiled = getCompiled(surfaceId, equation);

    // Bind parameter values into the call sites.
    const f = (x, y, z) => compiled.f(x, y, z, params);
    const grad = (x, y, z) => compiled.gradient(x, y, z, params);
    const hess = (x, y, z) => compiled.hessian(x, y, z, params);

    const curvature = (g, H) => [gaussianCurvature(g, H), meanCurvature(g, H)];

    const result = extractSurface({
      f, grad, hess, isovalue, gridRes, box, curvature,
    });

    const elapsedMs = performance.now() - start;
    payload = {
      id,
      ok: true,
      positions: result.positions,
      normals: result.normals,
      curvature: result.curvature,
      rim: result.rim,
      vertexCount: result.vertexCount,
      triangleCount: result.triangleCount,
      curvatureStats: result.curvatureStats,
      elapsedMs,
    };
  } catch (err) {
    payload = { id, ok: false, error: err.message, stack: err.stack };
    self.postMessage(payload);
    return;
  }

  self.postMessage(
    payload,
    [
      payload.positions.buffer,
      payload.normals.buffer,
      payload.curvature.buffer,
      payload.rim.buffer,
    ],
  );
};

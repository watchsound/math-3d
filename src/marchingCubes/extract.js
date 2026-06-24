import { EDGE_TABLE, TRI_TABLE, EDGE_CONNECTIONS, CORNER_OFFSETS } from './tables.js';

/**
 * Extract an iso-surface from a scalar field on a regular cubic grid.
 *
 * For each vertex, we also evaluate the analytic gradient (used as the surface
 * normal) and the symbolic Hessian (used for Gaussian + mean curvature). The
 * resulting buffers are designed to be transferred to the main thread via
 * `postMessage` with the `transfer` argument.
 *
 * @param {Object} args
 * @param {(x:number,y:number,z:number)=>number} args.f
 * @param {(x:number,y:number,z:number)=>[number,number,number]} args.grad
 * @param {(x:number,y:number,z:number)=>number[][]} args.hess
 * @param {number} args.isovalue
 * @param {number} args.gridRes
 * @param {{min:number,max:number}} args.box
 * @param {(K:number,H:number)=>[number,number]} args.curvature  - returns [K, H]
 */
export function extractSurface({ f, grad, hess, isovalue, gridRes, box, curvature }) {
  const N = gridRes;
  const lo = box.min;
  const hi = box.max;
  const span = hi - lo;
  const step = span / (N - 1);

  // Sample the scalar field on the (N x N x N) grid.
  const field = new Float32Array(N * N * N);
  const idx = (i, j, k) => i + N * (j + N * k);

  for (let k = 0; k < N; k++) {
    const z = lo + k * step;
    for (let j = 0; j < N; j++) {
      const y = lo + j * step;
      for (let i = 0; i < N; i++) {
        const x = lo + i * step;
        field[idx(i, j, k)] = f(x, y, z);
      }
    }
  }

  // March: for each cube, look up case index, emit triangles.
  // We grow the buffers dynamically (JS arrays of numbers), then convert to
  // typed arrays at the end.
  /** @type {number[]} */ const positions = [];
  /** @type {number[]} */ const normals = [];
  /** @type {number[]} */ const curvAttrs = []; // (K, H) per vertex
  /** @type {number[]} */ const rimAttrs = []; // scalar per vertex in ~[0, 1]

  const cornerPos = new Array(8);
  const cornerVal = new Array(8);
  const edgeVerts = new Array(12);
  const edgeNormals = new Array(12);
  const edgeKH = new Array(12);

  for (let k = 0; k < N - 1; k++) {
    for (let j = 0; j < N - 1; j++) {
      for (let i = 0; i < N - 1; i++) {
        let cubeIndex = 0;
        for (let v = 0; v < 8; v++) {
          const [oi, oj, ok] = CORNER_OFFSETS[v];
          const ci = i + oi, cj = j + oj, ck = k + ok;
          const val = field[idx(ci, cj, ck)];
          cornerVal[v] = val;
          cornerPos[v] = [lo + ci * step, lo + cj * step, lo + ck * step];
          if (val < isovalue) cubeIndex |= 1 << v;
        }

        const edges = EDGE_TABLE[cubeIndex];
        if (edges === 0) continue;

        // Interpolate vertex positions on crossed edges.
        for (let e = 0; e < 12; e++) {
          if (!(edges & (1 << e))) continue;
          const [a, b] = EDGE_CONNECTIONS[e];
          const va = cornerVal[a];
          const vb = cornerVal[b];
          let t;
          if (Math.abs(isovalue - va) < 1e-12) t = 0;
          else if (Math.abs(isovalue - vb) < 1e-12) t = 1;
          else if (Math.abs(va - vb) < 1e-12) t = 0.5;
          else t = (isovalue - va) / (vb - va);

          const pa = cornerPos[a];
          const pb = cornerPos[b];
          const px = pa[0] + t * (pb[0] - pa[0]);
          const py = pa[1] + t * (pb[1] - pa[1]);
          const pz = pa[2] + t * (pb[2] - pa[2]);
          edgeVerts[e] = [px, py, pz];

          // Analytic normal = normalized gradient. Inward vs outward depends
          // on f sign convention; we flip later if needed via shader.
          const g = grad(px, py, pz);
          let glen = Math.hypot(g[0], g[1], g[2]);
          if (glen < 1e-12) glen = 1;
          edgeNormals[e] = [-g[0] / glen, -g[1] / glen, -g[2] / glen];

          const H = hess(px, py, pz);
          const [K, Hm] = curvature(g, H);
          edgeKH[e] = [K, Hm];
        }

        // Emit triangles from the case row.
        const row = TRI_TABLE[cubeIndex];
        for (let t = 0; row[t] !== -1; t += 3) {
          const a = edgeVerts[row[t]];
          const b = edgeVerts[row[t + 1]];
          const c = edgeVerts[row[t + 2]];
          const na = edgeNormals[row[t]];
          const nb = edgeNormals[row[t + 1]];
          const nc = edgeNormals[row[t + 2]];
          const ka = edgeKH[row[t]];
          const kb = edgeKH[row[t + 1]];
          const kc = edgeKH[row[t + 2]];

          positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
          normals.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
          curvAttrs.push(ka[0], ka[1], kb[0], kb[1], kc[0], kc[1]);
          // rim seed = 0; the shader computes fresnel from view-dir at runtime
          rimAttrs.push(0, 0, 0);
        }
      }
    }
  }

  const positionsArr = new Float32Array(positions);
  const normalsArr = new Float32Array(normals);
  const curvArr = new Float32Array(curvAttrs);
  const rimArr = new Float32Array(rimAttrs);

  // Normalize curvature scale so the shader can use uniform [-1, 1]-ish range.
  // We do not clamp here; we hand the raw values + (min, max, percentile99) so
  // the shader can color-map consistently across surface switches.
  const curvStats = computeStats(curvArr);

  return {
    positions: positionsArr,
    normals: normalsArr,
    curvature: curvArr,
    rim: rimArr,
    vertexCount: positionsArr.length / 3,
    triangleCount: positionsArr.length / 9,
    curvatureStats: curvStats,
  };
}

function computeStats(arr) {
  // arr layout: (K, H) pairs. We return min/max/p99 for each separately.
  const n = arr.length / 2;
  if (n === 0) {
    return { kMin: 0, kMax: 0, hMin: 0, hMax: 0, kAbsP99: 1, hAbsP99: 1 };
  }
  let kMin = Infinity, kMax = -Infinity, hMin = Infinity, hMax = -Infinity;
  const kAbs = new Float32Array(n);
  const hAbs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const K = arr[2 * i];
    const H = arr[2 * i + 1];
    if (K < kMin) kMin = K;
    if (K > kMax) kMax = K;
    if (H < hMin) hMin = H;
    if (H > hMax) hMax = H;
    kAbs[i] = Math.abs(K);
    hAbs[i] = Math.abs(H);
  }
  return {
    kMin, kMax, hMin, hMax,
    kAbsP99: percentile(kAbs, 0.99),
    hAbsP99: percentile(hAbs, 0.99),
  };
}

function percentile(arr, p) {
  // Quickselect would be faster; sort is fine for our sizes (<300k).
  const copy = Array.from(arr);
  copy.sort((a, b) => a - b);
  const i = Math.min(copy.length - 1, Math.floor(p * copy.length));
  return copy[i] || 1;
}

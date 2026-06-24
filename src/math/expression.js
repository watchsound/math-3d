import { create, all } from 'mathjs';

const math = create(all, { number: 'number' });

/**
 * Compile a math expression string into:
 *  - a fast evaluator `f(x, y, z, params)`
 *  - gradient evaluator (symbolic if possible, central-difference fallback)
 *  - Hessian evaluator (symbolic if possible, central-difference fallback)
 *
 * The fallback kicks in when mathjs cannot symbolically differentiate one of
 * the involved functions (e.g. `atan2`, which is needed for the Seifert
 * fiber-space expression). In that case the gradient and Hessian are computed
 * via central differences with h = 1e-4 — sufficient for the rim/curvature
 * shading even though it costs more evaluations per vertex.
 */
export function compileSurface(expression, parameterNames = null) {
  const node = math.parse(expression);

  const detected = collectSymbolNames(node);
  const reserved = new Set(['x', 'y', 'z', 'pi', 'e', 'PI', 'E', 'phi', 'tau']);
  const autoParams = [...detected].filter((s) => !reserved.has(s));
  const params = parameterNames ?? autoParams;

  const evalF = node.compile();

  // Try to derive a symbolic gradient. If any partial derivative fails (e.g.
  // because of atan2), fall back to numerical differentiation for *all* three
  // partials so we don't mix symbolic and numerical (which would give an
  // inconsistent magnitude).
  let symbolicGrad = null;
  try {
    symbolicGrad = [
      math.derivative(node, 'x').compile(),
      math.derivative(node, 'y').compile(),
      math.derivative(node, 'z').compile(),
    ];
  } catch (_e) {
    symbolicGrad = null;
  }

  let symbolicHess = null;
  if (symbolicGrad) {
    try {
      const gradNodes = [
        math.derivative(node, 'x'),
        math.derivative(node, 'y'),
        math.derivative(node, 'z'),
      ];
      const vars = ['x', 'y', 'z'];
      const H = [];
      for (let i = 0; i < 3; i++) {
        H.push([]);
        for (let j = 0; j < 3; j++) {
          H[i].push(math.derivative(gradNodes[i], vars[j]).compile());
        }
      }
      symbolicHess = H;
    } catch (_e) {
      symbolicHess = null;
    }
  }

  const H_NUM = 1e-4;

  function fEval(x, y, z, paramValues) {
    return evalF.evaluate({ x, y, z, ...paramValues });
  }

  function gradEval(x, y, z, paramValues = {}) {
    if (symbolicGrad) {
      const scope = { x, y, z, ...paramValues };
      return [
        symbolicGrad[0].evaluate(scope),
        symbolicGrad[1].evaluate(scope),
        symbolicGrad[2].evaluate(scope),
      ];
    }
    return [
      (fEval(x + H_NUM, y, z, paramValues) - fEval(x - H_NUM, y, z, paramValues)) / (2 * H_NUM),
      (fEval(x, y + H_NUM, z, paramValues) - fEval(x, y - H_NUM, z, paramValues)) / (2 * H_NUM),
      (fEval(x, y, z + H_NUM, paramValues) - fEval(x, y, z - H_NUM, paramValues)) / (2 * H_NUM),
    ];
  }

  function hessEval(x, y, z, paramValues = {}) {
    if (symbolicHess) {
      const scope = { x, y, z, ...paramValues };
      const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          H[i][j] = symbolicHess[i][j].evaluate(scope);
        }
      }
      return H;
    }
    // Numerical Hessian via central differences of the (numerical) gradient.
    const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const dx = [H_NUM, 0, 0];
    const dy = [0, H_NUM, 0];
    const dz = [0, 0, H_NUM];
    const deltas = [dx, dy, dz];
    for (let j = 0; j < 3; j++) {
      const [dxj, dyj, dzj] = deltas[j];
      const gp = gradEval(x + dxj, y + dyj, z + dzj, paramValues);
      const gm = gradEval(x - dxj, y - dyj, z - dzj, paramValues);
      for (let i = 0; i < 3; i++) {
        H[i][j] = (gp[i] - gm[i]) / (2 * H_NUM);
      }
    }
    return H;
  }

  return {
    expression,
    parameters: params,
    derivedSymbolically: !!symbolicGrad,
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {Object.<string, number>} [paramValues]
     * @returns {number}
     */
    f: fEval,
    gradient: gradEval,
    hessian: hessEval,
  };
}

function collectSymbolNames(node) {
  const names = new Set();
  node.traverse((n) => {
    if (n.isSymbolNode && typeof n.name === 'string') {
      names.add(n.name);
    }
  });
  return names;
}

export function expressionToLatex(expression) {
  try {
    return math.parse(expression).toTex({ parenthesis: 'auto' });
  } catch {
    return expression;
  }
}

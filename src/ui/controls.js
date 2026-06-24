/**
 * Bottom-center controls: isovalue slider, grid-resolution stepper, per-surface
 * parameter sliders, curvature toggle.
 *
 * Emits `change` events to the caller via the `onChange` callback with the
 * shape `{ isovalue, gridRes, params, curvature: { blend, mode } }`.
 */

export function mountControls(root, { onChange }) {
  root.innerHTML = `
    <div class="ctrl-row">
      <label class="ctrl">
        <span class="ctrl-label">Isovalue <output data-bind="isoOut"></output></span>
        <input type="range" data-bind="iso" />
      </label>
      <label class="ctrl">
        <span class="ctrl-label">Grid Res <output data-bind="gridOut"></output></span>
        <input type="range" data-bind="grid" min="24" max="160" step="4" />
      </label>
      <label class="ctrl ctrl-toggle">
        <span class="ctrl-label">Curvature blend <output data-bind="curvOut"></output></span>
        <input type="range" data-bind="curvBlend" min="0" max="1" step="0.01" value="0" />
      </label>
      <label class="ctrl ctrl-toggle">
        <span class="ctrl-label">Mode</span>
        <select data-bind="curvMode">
          <option value="0">Mean H</option>
          <option value="1">Gaussian K</option>
        </select>
      </label>
    </div>
    <div class="ctrl-row ctrl-params" data-bind="params"></div>
  `;

  const isoEl = root.querySelector('[data-bind="iso"]');
  const isoOut = root.querySelector('[data-bind="isoOut"]');
  const gridEl = root.querySelector('[data-bind="grid"]');
  const gridOut = root.querySelector('[data-bind="gridOut"]');
  const curvBlendEl = root.querySelector('[data-bind="curvBlend"]');
  const curvOut = root.querySelector('[data-bind="curvOut"]');
  const curvModeEl = root.querySelector('[data-bind="curvMode"]');
  const paramsEl = root.querySelector('[data-bind="params"]');

  let state = {
    isovalue: 0,
    gridRes: 64,
    params: {},
    curvature: { blend: 0, mode: 0 },
  };

  function emit(eventKey) {
    onChange?.({ ...state, eventKey });
  }

  isoEl.addEventListener('input', () => {
    state.isovalue = parseFloat(isoEl.value);
    isoOut.value = state.isovalue.toFixed(3);
    emit('isovalue');
  });
  gridEl.addEventListener('change', () => {
    state.gridRes = parseInt(gridEl.value, 10);
    gridOut.value = `${state.gridRes}³`;
    emit('gridRes');
  });
  gridEl.addEventListener('input', () => {
    gridOut.value = `${gridEl.value}³`;
  });
  curvBlendEl.addEventListener('input', () => {
    state.curvature.blend = parseFloat(curvBlendEl.value);
    curvOut.value = state.curvature.blend.toFixed(2);
    emit('curvature');
  });
  curvModeEl.addEventListener('change', () => {
    state.curvature.mode = parseFloat(curvModeEl.value);
    emit('curvature');
  });

  function setSurface(surface) {
    // Configure isovalue slider for this surface.
    const iso = surface.isovalue;
    isoEl.min = iso.min;
    isoEl.max = iso.max;
    isoEl.step = iso.step ?? 0.01;
    isoEl.value = iso.default;
    state.isovalue = iso.default;
    isoOut.value = iso.default.toFixed(3);

    // Grid res defaults.
    const gr = surface.recommendedGridRes ?? 64;
    gridEl.value = gr;
    gridOut.value = `${gr}³`;
    state.gridRes = gr;

    // Build parameter sliders.
    paramsEl.innerHTML = '';
    state.params = {};
    const paramKeys = Object.keys(surface.parameters || {});
    for (const key of paramKeys) {
      const p = surface.parameters[key];
      state.params[key] = p.default;
      const wrap = document.createElement('label');
      wrap.className = 'ctrl ctrl-param';
      wrap.innerHTML = `
        <span class="ctrl-label">${escapeHtml(key)}
          <output></output>
        </span>
        <input type="range" min="${p.min}" max="${p.max}" step="${p.step ?? (p.max - p.min) / 200}" value="${p.default}" />
      `;
      const input = wrap.querySelector('input');
      const out = wrap.querySelector('output');
      out.value = formatNum(p.default);
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        state.params[key] = v;
        out.value = formatNum(v);
        emit('params');
      });
      paramsEl.appendChild(wrap);
    }
  }

  function getState() {
    return state;
  }

  return { setSurface, getState };
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

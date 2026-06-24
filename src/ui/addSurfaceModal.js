import { compileSurface, expressionToLatex } from '../math/expression.js';

const PALETTES = [
  { label: 'Cyan',   core: '#061820', mid: '#1e90c8', edge: '#9be7ff' },
  { label: 'Purple', core: '#100a30', mid: '#5a3fff', edge: '#c0a6ff' },
  { label: 'Green',  core: '#061a0e', mid: '#20c870', edge: '#9bffc0' },
  { label: 'Orange', core: '#1a0800', mid: '#c86420', edge: '#ffb09b' },
  { label: 'Pink',   core: '#200830', mid: '#c820c8', edge: '#ff96ff' },
  { label: 'Gold',   core: '#150e00', mid: '#c8a020', edge: '#ffe09b' },
  { label: 'Red',    core: '#200808', mid: '#c82020', edge: '#ff9b9b' },
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'surface';
}

/**
 * Create the Add-Surface modal.  Returns { open() }.
 *
 * @param {{ categories: object, onAdd: function }} options
 */
export function createAddSurfaceModal({ categories, onAdd }) {
  // ── Build DOM ────────────────────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('role', 'dialog');

  backdrop.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <span class="modal-title">ADD SURFACE</span>
        <button class="modal-close" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Name -->
        <div class="form-row">
          <label class="form-label">Name <span class="req">*</span></label>
          <input class="form-input" id="sf-name" type="text" placeholder="e.g. Torus" autocomplete="off">
        </div>

        <!-- Category -->
        <div class="form-row">
          <label class="form-label">Category</label>
          <select class="form-input" id="sf-category"></select>
        </div>

        <!-- Equation -->
        <div class="form-row form-col">
          <label class="form-label">
            Equation f(x,y,z) = 0 <span class="req">*</span>
            <span class="eq-status" id="sf-eq-status"></span>
          </label>
          <textarea class="form-input form-textarea" id="sf-equation"
            rows="3" placeholder="x^2 + y^2 + z^2 - 1" spellcheck="false"></textarea>
          <div class="form-hint">mathjs syntax — use x, y, z and standard functions</div>
        </div>

        <!-- Box -->
        <div class="form-row">
          <label class="form-label">Bounding box</label>
          <div class="form-inline">
            <input class="form-input form-num" id="sf-box-min" type="number" value="-2" step="0.5">
            <span class="form-sep">to</span>
            <input class="form-input form-num" id="sf-box-max" type="number" value="2" step="0.5">
          </div>
        </div>

        <!-- Isovalue -->
        <div class="form-row">
          <label class="form-label">Isovalue default</label>
          <input class="form-input form-num" id="sf-isovalue" type="number" value="0" step="0.1">
        </div>

        <!-- Parameters -->
        <div class="form-section">
          <div class="form-section-hdr">
            Parameters
            <button type="button" class="btn-add-param">+ Add</button>
          </div>
          <div class="param-list" id="sf-params"></div>
        </div>

        <!-- Palette -->
        <div class="form-row">
          <label class="form-label">Colour palette</label>
          <div class="palette-row" id="sf-palette"></div>
        </div>

        <!-- Description (optional) -->
        <div class="form-row form-col">
          <label class="form-label">Description <span class="optional">(optional)</span></label>
          <textarea class="form-input form-textarea" id="sf-desc" rows="2"
            placeholder="Short mathematical description shown in the left panel."></textarea>
        </div>
      </div><!-- /.modal-body -->

      <div class="modal-footer">
        <button class="btn-modal btn-cancel">Cancel</button>
        <button class="btn-modal btn-submit" id="sf-submit" disabled>Add Surface</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  // ── References ───────────────────────────────────────────────────────────
  const nameEl     = backdrop.querySelector('#sf-name');
  const catEl      = backdrop.querySelector('#sf-category');
  const eqEl       = backdrop.querySelector('#sf-equation');
  const eqStatus   = backdrop.querySelector('#sf-eq-status');
  const boxMinEl   = backdrop.querySelector('#sf-box-min');
  const boxMaxEl   = backdrop.querySelector('#sf-box-max');
  const isoEl      = backdrop.querySelector('#sf-isovalue');
  const paramList  = backdrop.querySelector('#sf-params');
  const paletteRow = backdrop.querySelector('#sf-palette');
  const submitBtn  = backdrop.querySelector('#sf-submit');
  const closeBtn   = backdrop.querySelector('.modal-close');
  const cancelBtn  = backdrop.querySelector('.btn-cancel');
  const addParamBtn = backdrop.querySelector('.btn-add-param');

  // ── Populate category select ──────────────────────────────────────────────
  for (const [k, v] of Object.entries(categories)) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = v;
    if (k === 'custom') opt.selected = true;
    catEl.appendChild(opt);
  }

  // ── Palette swatches ─────────────────────────────────────────────────────
  let selectedPalette = 0;
  PALETTES.forEach((p, i) => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'palette-swatch' + (i === 0 ? ' active' : '');
    sw.title = p.label;
    sw.style.background = `radial-gradient(circle, ${p.edge} 0%, ${p.mid} 50%, ${p.core} 100%)`;
    sw.addEventListener('click', () => {
      selectedPalette = i;
      paletteRow.querySelectorAll('.palette-swatch').forEach((s, j) => {
        s.classList.toggle('active', j === i);
      });
    });
    paletteRow.appendChild(sw);
  });

  // ── Equation validation (debounced) ──────────────────────────────────────
  let validEq = false;
  let eqTimer = null;
  function validateEq() {
    clearTimeout(eqTimer);
    eqTimer = setTimeout(() => {
      const eq = eqEl.value.trim();
      if (!eq) {
        eqStatus.textContent = '';
        eqStatus.className = 'eq-status';
        validEq = false;
        updateSubmit();
        return;
      }
      try {
        compileSurface(eq);
        eqStatus.textContent = '✓ valid';
        eqStatus.className = 'eq-status eq-ok';
        validEq = true;
      } catch (e) {
        eqStatus.textContent = '✗ ' + e.message.split('\n')[0].slice(0, 60);
        eqStatus.className = 'eq-status eq-err';
        validEq = false;
      }
      updateSubmit();
    }, 400);
  }
  eqEl.addEventListener('input', validateEq);

  function updateSubmit() {
    submitBtn.disabled = !(nameEl.value.trim() && validEq);
  }
  nameEl.addEventListener('input', updateSubmit);

  // ── Parameters ───────────────────────────────────────────────────────────
  function addParamRow(name = '', defVal = 1, mn = 0, mx = 5, step = 0.01) {
    const row = document.createElement('div');
    row.className = 'param-row';
    row.innerHTML = `
      <input class="form-input param-name"    type="text"   placeholder="Name"    value="${escHtml(name)}">
      <input class="form-input param-default" type="number" placeholder="Default" value="${defVal}" step="${step}">
      <input class="form-input param-min"     type="number" placeholder="Min"     value="${mn}"     step="${step}">
      <input class="form-input param-max"     type="number" placeholder="Max"     value="${mx}"     step="${step}">
      <input class="form-input param-step"    type="number" placeholder="Step"    value="${step}"   step="0.001">
      <button type="button" class="param-del" aria-label="Remove">×</button>
    `;
    row.querySelector('.param-del').addEventListener('click', () => row.remove());
    paramList.appendChild(row);
  }
  addParamBtn.addEventListener('click', () => addParamRow());

  // ── Close ────────────────────────────────────────────────────────────────
  function close() {
    backdrop.classList.remove('open');
  }
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && backdrop.classList.contains('open')) close(); });

  // ── Submit ───────────────────────────────────────────────────────────────
  submitBtn.addEventListener('click', () => {
    const name = nameEl.value.trim();
    const eq   = eqEl.value.trim();
    if (!name || !validEq) return;

    const boxMin  = parseFloat(boxMinEl.value)  || -2;
    const boxMax  = parseFloat(boxMaxEl.value)  ||  2;
    const isoVal  = parseFloat(isoEl.value)     ||  0;
    const palette = PALETTES[selectedPalette];
    const desc    = backdrop.querySelector('#sf-desc').value.trim()
                    || `User-defined surface: ${name}`;

    // Collect parameters
    const params = {};
    paramList.querySelectorAll('.param-row').forEach((row) => {
      const pName = row.querySelector('.param-name').value.trim();
      if (!pName) return;
      params[pName] = {
        default: parseFloat(row.querySelector('.param-default').value),
        min:     parseFloat(row.querySelector('.param-min').value),
        max:     parseFloat(row.querySelector('.param-max').value),
        step:    parseFloat(row.querySelector('.param-step').value),
      };
    });

    const def = {
      id:             `custom-${slugify(name)}-${Date.now()}`,
      name,
      category:       catEl.value,
      classification: desc,
      equationLatex:  expressionToLatex(eq),
      equation:       eq,
      parameters:     params,
      isovalue:       { default: isoVal, min: isoVal - 3, max: isoVal + 3, step: 0.01 },
      box:            { min: boxMin, max: boxMax },
      palette:        { core: palette.core, mid: palette.mid, edge: palette.edge },
      metrics:        [],
      recommendedGridRes: 80,
    };

    onAdd(def);
    close();
    reset();
  });

  // ── Reset form ───────────────────────────────────────────────────────────
  function reset() {
    nameEl.value = '';
    eqEl.value   = '';
    boxMinEl.value = '-2';
    boxMaxEl.value = '2';
    isoEl.value  = '0';
    backdrop.querySelector('#sf-desc').value = '';
    paramList.innerHTML = '';
    eqStatus.textContent = '';
    eqStatus.className = 'eq-status';
    validEq = false;
    selectedPalette = 0;
    paletteRow.querySelectorAll('.palette-swatch').forEach((s, i) => s.classList.toggle('active', i === 0));
    catEl.value = 'custom';
    submitBtn.disabled = true;
  }

  return {
    open() {
      reset();
      backdrop.classList.add('open');
      setTimeout(() => nameEl.focus(), 50);
    },
  };
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

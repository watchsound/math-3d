import { surfaces, categories } from '../surfaces/registry.js';

/**
 * Right-hand HUD: lab coordinates (grid res, isovalue, vertex/triangle counts)
 * + thumbnail surface selector grouped by category.
 */
export function mountRightPanel(root, { onSelect }) {
  root.innerHTML = `
    <div class="panel-section coord-block">
      <div class="panel-eyebrow">LAB COORDINATES</div>
      <div class="coord-row"><span>Grid Res</span><span data-bind="gridRes">—</span></div>
      <div class="coord-row"><span>Isovalue</span><span data-bind="isovalue">—</span></div>
      <div class="coord-row"><span>Elements</span><span data-bind="vertexCount">—</span></div>
      <div class="coord-row"><span>Triangles</span><span data-bind="triangleCount">—</span></div>
      <div class="coord-row"><span>Mesh (ms)</span><span data-bind="elapsedMs">—</span></div>
    </div>

    <div class="panel-section selector-block">
      <div class="panel-eyebrow">SURFACE LIBRARY</div>
      <div class="selector-list" data-bind="selector"></div>
    </div>
  `;

  const selectorEl = root.querySelector('[data-bind="selector"]');

  const grouped = {};
  for (const s of surfaces) {
    (grouped[s.category] ??= []).push(s);
  }

  for (const [catKey, catLabel] of Object.entries(categories)) {
    const items = grouped[catKey] ?? [];
    if (!items.length) continue;
    const groupHeader = document.createElement('div');
    groupHeader.className = 'selector-group-header';
    groupHeader.textContent = catLabel;
    selectorEl.appendChild(groupHeader);

    for (const s of items) {
      const card = document.createElement('button');
      card.className = 'surface-card';
      card.dataset.surfaceId = s.id;
      card.style.setProperty('--card-core', s.palette.core);
      card.style.setProperty('--card-mid', s.palette.mid);
      card.style.setProperty('--card-edge', s.palette.edge);
      card.innerHTML = `
        <div class="card-thumb"></div>
        <div class="card-body">
          <div class="card-name">${escapeHtml(s.name)}</div>
          <div class="card-iso">v = ${s.isovalue.default}</div>
        </div>
      `;
      card.addEventListener('click', () => onSelect(s.id));
      selectorEl.appendChild(card);
    }
  }

  function setActive(surfaceId) {
    root.querySelectorAll('.surface-card').forEach((el) => {
      el.classList.toggle('active', el.dataset.surfaceId === surfaceId);
    });
  }

  function update({ gridRes, isovalue, vertexCount, triangleCount, elapsedMs }) {
    if (gridRes != null) {
      root.querySelector('[data-bind="gridRes"]').textContent = `${gridRes}³ Voxels`;
    }
    if (isovalue != null) {
      root.querySelector('[data-bind="isovalue"]').textContent = isovalue.toFixed(3);
    }
    if (vertexCount != null) {
      root.querySelector('[data-bind="vertexCount"]').textContent = vertexCount.toLocaleString();
    }
    if (triangleCount != null) {
      root.querySelector('[data-bind="triangleCount"]').textContent = triangleCount.toLocaleString();
    }
    if (elapsedMs != null) {
      root.querySelector('[data-bind="elapsedMs"]').textContent = elapsedMs.toFixed(0);
    }
  }

  return { setActive, update };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

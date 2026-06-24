import katex from 'katex';
import { categories } from '../surfaces/registry.js';

/**
 * The "Topology Lab Deck" panel on the left — surface name, classification,
 * algebraic implicit equation (KaTeX-rendered), manifold metrics, rim-field
 * gradient swatch.
 */
export function mountLeftPanel(root) {
  root.innerHTML = `
    <div class="panel-section deck-header">
      <div class="panel-eyebrow">TOPOLOGY LAB DECK</div>
      <h1 class="deck-title" data-bind="name">—</h1>
      <p class="deck-sub" data-bind="categoryDesc">—</p>
    </div>

    <div class="panel-section">
      <div class="panel-eyebrow">TOPOLOGY CLASSIFICATION</div>
      <p class="classification" data-bind="classification">—</p>
    </div>

    <div class="panel-section">
      <div class="panel-eyebrow">ALGEBRAIC IMPLICIT EQUATION</div>
      <div class="equation" data-bind="equation"></div>
    </div>

    <div class="panel-section">
      <div class="panel-eyebrow">MANIFOLD METRICS</div>
      <ul class="metrics" data-bind="metrics"></ul>
    </div>

    <div class="panel-section">
      <div class="panel-eyebrow">MANIFOLD RIM FIELD GRADIENT</div>
      <div class="rim-bar" data-bind="rimBar"></div>
      <div class="rim-labels"><span>CORE</span><span>MID</span><span>EDGE</span></div>
    </div>
  `;

  return {
    update(surface) {
      root.querySelector('[data-bind="name"]').textContent = surface.name;
      root.querySelector('[data-bind="categoryDesc"]').textContent =
        categories[surface.category] ?? '';
      root.querySelector('[data-bind="classification"]').textContent = surface.classification;

      const eqEl = root.querySelector('[data-bind="equation"]');
      try {
        katex.render(surface.equationLatex, eqEl, {
          displayMode: true,
          throwOnError: false,
          strict: 'ignore',
        });
      } catch (e) {
        eqEl.textContent = surface.equationLatex;
      }

      const metricsEl = root.querySelector('[data-bind="metrics"]');
      metricsEl.innerHTML = surface.metrics
        .map((m) => `<li>${escapeHtml(m)}</li>`)
        .join('');

      const bar = root.querySelector('[data-bind="rimBar"]');
      bar.style.background = `linear-gradient(90deg, ${surface.palette.core} 0%, ${surface.palette.mid} 50%, ${surface.palette.edge} 100%)`;

      // Per-surface accent color drives panel borders and eyebrow text.
      root.style.setProperty('--surface-accent', surface.palette.edge);
      root.style.setProperty('--surface-accent-mid', surface.palette.mid);
    },
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

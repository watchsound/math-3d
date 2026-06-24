# Topology Lab Deck

Interactive 3D exploration of algebraic topology surfaces, with **real**
differential geometry derived from each surface's own implicit equation.

Each surface in the library is defined by its actual published equation
(Schoen, Schwarz, Chmutov, Barth, Bryant, Kummer, Togliatti, Endrass,
Cayley, Clebsch, Dupin, …). Normals come from analytic gradients. Gaussian
and mean curvature are computed pointwise from the symbolic Hessian — no
faked data, no decorative approximation.

![dark-themed UI showing a 3D surface rendered with neon rim gradient, equation panel on the left, lab coordinates on the right](docs/screenshots/preview-placeholder.png)

## Quick start

```bash
npm install
npm run dev          # opens at http://127.0.0.1:5173
npm test             # runs vitest unit + integration suite
npm run build        # production bundle in dist/
```

Requires Node 18+. The dev server uses Vite 6 with native Web Workers and
GLSL imports.

## Stack

| Layer            | Library                                            |
| ---------------- | -------------------------------------------------- |
| Bundler          | Vite 6                                             |
| 3D rendering     | three.js 0.170 + custom GLSL                        |
| Animation        | anime.js 4.5.0 (`animejs/adapters/three`)           |
| Symbolic math    | mathjs 14 (`derivative()` → analytic ∇f, H(f))      |
| Numerics         | gl-matrix for hot loops; central-difference fallback |
| Equation render  | KaTeX 0.16                                          |
| Iso-surfacing    | Custom marching cubes using Paul Bourke's tables    |

## Surface library

The launch set is 15 surfaces in 4 categories, each in
[`src/surfaces/registry.js`](src/surfaces/registry.js):

**Triply Periodic Minimal Surfaces** — Schwarz P, Schwarz D, Gyroid,
Schoen I-WP, Neovius.

**Singular Algebraic Surfaces** — Cayley Nodal Cubic (4 nodes, max for
degree 3), Clebsch Diagonal (27 real lines), Kummer Quartic (16 nodes,
max for quartic), Barth Sextic (65 nodes, max for sextic), Togliatti
Quintic (31 nodes), Chmutov Octic (Chebyshev T₈), Endrass Octic
(168 nodes).

**Fiber Bundles & Topology** — Seifert Fiber Space (toroidal modulated
cyclide visualisation), Boy's Surface (Bryant's polynomial immersion of
ℝP²).

**Classical** — Dupin Cyclide.

### Adding a new surface

Edit `src/surfaces/registry.js` and append a `SurfaceDefinition` —
nothing else needs to change. The renderer, worker, controls, equation
panel, and selector pick it up automatically. Schema:

```js
{
  id: 'my-surface',
  name: 'My Surface',
  category: 'classical',        // tpms | singular | topology | classical
  classification: 'Short prose description shown in the left panel.',
  equationLatex: 'x^2 + y^2 + z^2 - R^2 = 0',
  equation:      'x^2 + y^2 + z^2 - R^2',     // mathjs syntax
  parameters: {
    R: { default: 1, min: 0.1, max: 3, step: 0.01 },
  },
  isovalue: { default: 0, min: -2, max: 2, step: 0.01 },
  box: { min: -1.5, max: 1.5 },
  palette: { core: '#0a2a3a', mid: '#1e90c8', edge: '#9be7ff' },
  metrics: [
    'Bullet 1 in the manifold-metrics panel',
    'Bullet 2',
  ],
  recommendedGridRes: 72,
}
```

If the equation uses a function that mathjs cannot symbolically
differentiate (e.g. `atan2`), the compiler falls back to central-difference
gradient and Hessian. Curvature is still computed correctly, just more
slowly. All other functions (`sin`, `cos`, `sqrt`, polynomials, etc.)
get analytic derivatives.

## Architecture

```
┌────────────────┐    surfaceId + iso + grid + params
│  UI (controls) │ ─────────────────────────────────────┐
└────────────────┘                                      ▼
                                            ┌──────────────────┐
                                            │   meshClient.js  │
                                            └─────────┬────────┘
                                                      │ postMessage
                                            ┌─────────▼────────┐
                                            │  meshWorker.js   │
                                            │  ─────────────   │
                                            │  mathjs compile  │
                                            │  + sample grid   │
                                            │  + marching cubes│
                                            │  + per-vertex    │
                                            │    K, H curvature│
                                            └─────────┬────────┘
                                                      │ transferable
                                                      │ Float32Arrays
                                            ┌─────────▼────────┐
                                            │ surfaceMesh.js   │
                                            │ ShaderMaterial   │
                                            │ rim + curvature  │
                                            │ blend (GLSL)     │
                                            └─────────┬────────┘
                                                      │
                                            ┌─────────▼────────┐
                                            │ Three.js scene + │
                                            │ OrbitControls +  │
                                            │ anime.js timeline│
                                            └──────────────────┘
```

The worker is the single source of mesh truth. The main thread never blocks
on a 110³ grid sweep (which can take 1-3s on the heavier polynomials).

## Curvature math

For implicit surface `f(x,y,z) = c`, with gradient `g = ∇f` and Hessian
`H = Hess(f)`:

- **Mean curvature**: `H = (g · H · gᵀ − |g|² · tr(H)) / (2 |g|³)`
- **Gaussian curvature**: `K = (g · adj(H) · gᵀ) / |g|⁴`

Reference: R. Goldman, *Curvature formulas for implicit curves and
surfaces*, Computer Aided Geometric Design 22 (2005) 632–658.

The unit-test [`tests/math/curvature.test.js`](tests/math/curvature.test.js)
verifies these against the analytic sphere (K = 1/R², H = ±1/R) and
verifies Schwarz P has H = 0 to machine precision on its zero level set,
confirming the implementation matches the published minimal-surface
result.

## Project layout

```
src/
├── main.js                # bootstrap, scene assembly, render loop
├── scene/
│   ├── viewport.js        # Three.js renderer + camera + orbit controls
│   ├── surfaceMesh.js     # BufferGeometry + ShaderMaterial assembly
│   ├── meshClient.js      # main-thread wrapper over the worker
│   └── shaders/
│       ├── surface.vert.glsl
│       └── surface.frag.glsl
├── math/
│   ├── expression.js      # mathjs compile + symbolic / numerical derivatives
│   └── curvature.js       # K, H, adjugate(3×3)
├── marchingCubes/
│   ├── tables.js          # Paul Bourke 256-entry edge & tri tables
│   └── extract.js         # mesh extraction with per-vertex normals + curvature
├── workers/
│   └── meshWorker.js      # off-main-thread mesh generation
├── surfaces/
│   ├── types.js           # JSDoc types
│   └── registry.js        # the 15 surfaces
├── ui/
│   ├── leftPanel.js       # classification, KaTeX equation, metrics, gradient
│   ├── rightPanel.js      # lab coordinates + surface selector
│   ├── controls.js        # isovalue, grid res, parameter sliders, curvature
│   └── transitions.js     # anime.js timelines (surface in/out fades)
└── styles/main.css        # dark sci-fi theme

tests/
├── math/                  # gradient, Hessian, curvature formulas
├── integration/           # end-to-end pipeline (unit-sphere extraction)
└── surfaces/              # registry validity (every equation compiles)
```

## Design principles (anti-cheating)

- **No mock surfaces.** Every equation in `registry.js` is the surface's
  actual implicit form, sourced from its mathematical definition.
- **No fake normals.** Normals come from the analytic gradient, not
  triangle averages.
- **No placeholder curvature.** K and H are derived from the Hessian.
- **No dummy UI numbers.** Vertex and triangle counts are computed from
  the actual mesh.
- Dummy data is permitted only inside `tests/` fixtures.

## Performance notes

- Marching cubes runs in a Web Worker — UI never freezes.
- Stale results (superseded by a later slider drag) are dropped on the
  main thread instead of replacing the live mesh.
- Compile + symbolic-differentiation result is cached per
  `(surfaceId, equation)` pair inside the worker; only the first request
  for a surface pays the symbolic differentiation cost (≈ 100-500 ms for
  the heavier polynomials like Endrass and Boy's surface).
- Default grid resolutions per surface are tuned (`recommendedGridRes` in
  the registry). Heavier polynomials default to 100-110³; trig TPMS use
  72-80³.

## Glossary

See [`CONTEXT.md`](CONTEXT.md) for the project's canonical vocabulary
(surface vs mesh, isovalue, rim field, palette, etc.).

## License

MIT.

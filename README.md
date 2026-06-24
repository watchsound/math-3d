# Topology Lab Deck

Interactive 3D exploration of algebraic topology surfaces, with **real**
differential geometry derived from each surface's own implicit equation.

Each surface in the library is defined by its actual published equation
(Schoen, Schwarz, Chmutov, Barth, Bryant, Kummer, Togliatti, Endrass,
Cayley, Clebsch, Dupin, …). Normals come from analytic gradients. Gaussian
and mean curvature are computed pointwise from the symbolic Hessian — no
faked data, no decorative approximation.

## Quick start

```bash
npm install
npm run dev          # opens at http://127.0.0.1:5173
npm test             # runs vitest unit + integration suite
npm run build        # production bundle in dist/
```

Requires Node 18+. The dev server uses Vite 6 with native Web Workers and
GLSL imports.

---

## How to use

### Interface overview

The UI has four zones:

```
┌──────────────┬──────────────────────┬──────────────┐
│  Left panel  │     3D viewport      │  Right panel │
│              │                      │              │
│  Equation    │   (orbit, zoom,      │  Lab coords  │
│  Classification  │   pan with mouse)    │  Surface list│
│  Metrics     │                      │              │
│  Gradient bar│                      │              │
└──────────────┴──────────────────────┴──────────────┘
│                  Controls footer                    │
│  isovalue slider — grid resolution — parameters     │
└─────────────────────────────────────────────────────┘
```

### Navigating the 3D surface

| Input | Action |
|---|---|
| Left-drag | Orbit (rotate) |
| Right-drag | Pan |
| Scroll wheel | Zoom |
| Two-finger drag (trackpad) | Pan |
| Pinch (trackpad) | Zoom |

### Switching surfaces

Click any card in the **SURFACE LIBRARY** panel on the right.
The current surface **disintegrates into a particle cloud**, then the
particles **reassemble into the new shape** — a two-phase morph transition.
While the new mesh is being computed in the background, the old surface stays
visible with a thin neon progress bar at the top of the viewport.

### Controls footer

| Control | Effect |
|---|---|
| **Isovalue** slider | Morphs the level-set threshold (f = c). Move it to see the surface swell, pinch, and split. |
| **Grid Res** slider | Controls marching-cubes voxel density (40–128). Higher = more detail, slower compute. |
| **Parameters** (if any) | Surface-specific constants (e.g. golden ratio φ for Barth Sextic, radii for Kummer Quartic). |
| **Curvature** toggle | Switch between Gaussian (K) and mean (H) curvature coloring. The gradient bar in the left panel shows the active color scale. |
| **Curvature blend** | Fade between pure rim-gradient and curvature coloring. |

### Left panel

- **Equation** — the surface's defining implicit polynomial, typeset with KaTeX.
- **Classification** — mathematical description and historical context.
- **Manifold metrics** — key topological and geometric facts (node count, symmetry group, etc.).
- **Gradient bar** — current curvature or rim-field color scale (min → max).

### Right panel

- **Lab Coordinates** — live stats: grid resolution, isovalue, vertex count, triangle count, and last mesh compute time in ms.
- **Surface Library** — grouped by category. The active surface is highlighted.

---

## Adding a custom surface

Click the **`+`** button next to the **SURFACE LIBRARY** heading. A modal opens:

| Field | Description |
|---|---|
| **Name** | Display name shown in the surface list |
| **Category** | Which group to file it under |
| **Equation f(x,y,z) = 0** | The implicit equation in [mathjs syntax](https://mathjs.org/docs/expressions/syntax.html). Validation runs as you type: `✓ valid` or `✗ <error>`. |
| **Bounding box** | The spatial window for the marching-cubes grid (e.g. −2 to 2) |
| **Isovalue default** | The starting level-set value |
| **Parameters** | Click **+ Add** to define slider-controllable constants. Each parameter needs a name, default value, min, max, and step. |
| **Colour palette** | Pick one of 7 presets (cyan, purple, green, orange, pink, gold, red) |
| **Description** | Optional prose shown in the left panel |

Click **Add Surface** (enabled once name and equation are both valid).
The surface is added immediately to the library, switched to, and
**persisted in localStorage** — it survives page refresh.

To delete a custom surface, hover over its card and click the **`×`** button
that appears in the top-right corner.

### Equation syntax

The equation field accepts [mathjs](https://mathjs.org) expressions using `x`, `y`, `z` and any named parameters. Examples:

```
x^2 + y^2 + z^2 - 1            # unit sphere
x^2 + y^2 + z^2 - R^2          # sphere with radius parameter R
(sqrt(x^2+y^2) - 2)^2 + z^2 - 1  # torus  (major R=2, minor r=1)
cos(x) + cos(y) + cos(z)        # Schwarz P minimal surface
sin(x)*cos(y) + sin(y)*cos(z) + sin(z)*cos(x)  # Gyroid
```

Standard functions supported: `sin`, `cos`, `tan`, `exp`, `log`, `sqrt`,
`abs`, `atan2`, `pow`, and all other mathjs built-ins.

Mathjs will attempt **symbolic differentiation** for analytic normals and
curvature. If your equation uses `atan2` or similar non-differentiable
nodes, the system falls back to central-difference numerics automatically.

---

## Programmatic surface registration

You can also add a surface by editing [`src/surfaces/registry.js`](src/surfaces/registry.js) directly — nothing else needs to change. Schema:

```js
{
  id: 'my-surface',
  name: 'My Surface',
  category: 'classical',        // tpms | singular | topology | classical | custom
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

---

## Built-in surface library

15 surfaces across 4 categories:

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

---

## Stack

| Layer            | Library                                            |
| ---------------- | -------------------------------------------------- |
| Bundler          | Vite 6                                             |
| 3D rendering     | three.js 0.170 + custom GLSL                        |
| Animation        | anime.js 4.5.0                                      |
| Symbolic math    | mathjs 14 (`derivative()` → analytic ∇f, H(f))      |
| Numerics         | gl-matrix for hot loops; central-difference fallback |
| Equation render  | KaTeX 0.16                                          |
| Iso-surfacing    | Custom marching cubes (Paul Bourke tables)          |

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

## Project layout

```
src/
├── main.js                # bootstrap, scene assembly, render loop
├── scene/
│   ├── viewport.js        # Three.js renderer + camera + orbit controls
│   ├── surfaceMesh.js     # BufferGeometry + ShaderMaterial assembly
│   ├── meshClient.js      # main-thread wrapper over the worker
│   ├── particleTransition.js  # GLSL particle morph (scatter → cloud → reassemble)
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
│   └── registry.js        # 15 built-in surfaces + custom surface persistence
├── ui/
│   ├── leftPanel.js       # classification, KaTeX equation, metrics, gradient
│   ├── rightPanel.js      # lab coordinates + surface selector
│   ├── addSurfaceModal.js # modal form to add custom surfaces
│   ├── controls.js        # isovalue, grid res, parameter sliders, curvature
│   └── transitions.js     # anime.js timelines (surface in/out fades)
└── styles/main.css        # dark sci-fi theme

tests/
├── math/                  # gradient, Hessian, curvature formulas
├── integration/           # end-to-end pipeline (unit-sphere extraction)
└── surfaces/              # registry validity (every equation compiles)
```

## Design principles (anti-cheating)

- **No mock surfaces.** Every built-in equation is the surface's actual implicit form.
- **No fake normals.** Normals come from the analytic gradient, not triangle averages.
- **No placeholder curvature.** K and H are derived from the Hessian.
- **No dummy UI numbers.** Vertex and triangle counts are computed from the actual mesh.
- Dummy data is permitted only inside `tests/` fixtures.

## Performance notes

- Marching cubes runs in a Web Worker — UI never freezes.
- During a surface switch, the old mesh stays visible while the worker computes
  the new one — no blank screen. A neon progress bar at the top of the viewport
  indicates ongoing computation.
- Stale results (superseded by a later slider drag) are dropped on the main thread.
- Symbolic differentiation is cached per `(surfaceId, equation)` pair inside the
  worker; only the first request for a surface pays the cost (≈100–500 ms for
  heavier polynomials like Endrass or Boy's surface).
- Default grid resolutions per surface are tuned (`recommendedGridRes`).
  Heavier polynomials default to 100–110³; trig TPMS surfaces use 72–80³.

## Glossary

See [`CONTEXT.md`](CONTEXT.md) for the project's canonical vocabulary
(surface vs mesh, isovalue, rim field, palette, etc.).

## License

MIT.

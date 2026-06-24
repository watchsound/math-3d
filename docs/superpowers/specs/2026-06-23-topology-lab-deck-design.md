# Topology Lab Deck — Design

**Date:** 2026-06-23
**Status:** Approved for autonomous build (user authorized in chat)

## Goal

A personal, serious-use 3D mathematics tool for exploring algebraic topology surfaces. The user (a mathematician) needs an interactive visualization environment where each surface is described by a *real* implicit equation, with *real* differential geometry (gradient, Hessian, mean & Gaussian curvature) derived from that equation — no faked data, no approximations beyond standard numerical analysis.

## Success criteria

1. `npm run dev` opens a Vite dev server on a fresh clone; the UI matches the screenshot layout.
2. All 15 surfaces in the launch library render correctly via marching cubes, with their published implicit equations evaluated through mathjs.
3. Per-vertex curvature (K, H) is computed from symbolic derivatives of the user's equation string.
4. Isovalue, grid resolution, surface parameters, and curvature-blend are all live-adjustable; the UI never freezes (mesh extraction runs in a Web Worker).
5. Switching surfaces triggers an anime.js timeline animation (camera, opacity, palette).
6. Adding a 16th surface requires editing only `src/surfaces/registry.js`.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite** | Fast HMR, tree-shaking, native ES modules |
| 3D | **Three.js** | Direct GLSL access, mature, no React indirection |
| Animation | **anime.js v4.5.0 + `animejs/adapters/three`** | Animate Three.js properties (uniforms, position, color) declaratively; integrates with `renderer.setAnimationLoop` via `engine.useDefaultMainLoop = false` |
| Math expr | **mathjs** | Parses string equations, supports symbolic `derivative()` for gradient/Hessian |
| Linear algebra | **gl-matrix** | Typed-array vec3/mat3 inside marching-cubes hot loops |
| Equations | **KaTeX** | LaTeX rendering for the equation panel |
| Marching cubes | **custom** | ~200 LOC using Paul Bourke's edge/tri tables; full control over normals & curvature attributes |

## Walking Skeleton

End-to-end happy path that must work before any feature is added:

1. **HTML loads** → `index.html` mounts `#app` and imports `src/main.js`.
2. **Bootstrap** → `main.js` creates the Three.js renderer, scene, camera; mounts the UI scaffold (left panel, right panel, central viewport).
3. **Registry → first surface** → loads `SurfaceDefinition` for `gyroid` from `src/surfaces/registry.js`.
4. **Worker request** → posts `{surfaceId, isovalue, gridRes, params}` to `src/workers/meshWorker.js`.
5. **Worker compiles & evaluates** → mathjs parses the equation, builds a compiled evaluator and symbolic gradient. Samples a 64³ grid. Runs marching cubes. Returns transferable `Float32Array` of positions, normals, and curvature attributes.
6. **Render** → main thread builds a `THREE.BufferGeometry`, applies the surface's `ShaderMaterial` (custom GLSL with rim+curvature blend), adds to scene.
7. **UI populated** → left panel shows surface name, KaTeX-rendered equation, metric bullets; right panel shows grid res, vertex count, triangle count.
8. **Acceptance test**: open `npm run dev`, see the Gyroid rendered with the teal palette, see vertex/triangle counts populated, see the LaTeX equation.

Seams:
- `MeshRequest` / `MeshResult` message types between main and worker
- `SurfaceDefinition` interface in [src/surfaces/types.js](src/surfaces/types.js) (JSDoc-typed)
- `Palette` type
- Shader uniform contract: `uIsovalue`, `uCurvatureBlend`, `uPaletteCore/Mid/Edge`, `uTime`

## Project layout

```
math-3D/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                    # bootstrap, scene assembly
│   ├── scene/
│   │   ├── viewport.js            # Three.js renderer + camera + controls
│   │   ├── surfaceMesh.js         # builds BufferGeometry from worker results
│   │   └── shaders/
│   │       ├── surface.vert.glsl  # passes curvature, world-pos, view-dir
│   │       └── surface.frag.glsl  # rim + curvature blend, neon palette
│   ├── math/
│   │   ├── expression.js          # mathjs compile + symbolic derivatives
│   │   ├── curvature.js           # K, H formulas for implicit surfaces
│   │   └── grid.js                # voxel sampling helpers
│   ├── marchingCubes/
│   │   ├── tables.js              # Bourke edge & tri tables
│   │   └── extract.js             # main extraction algorithm
│   ├── workers/
│   │   └── meshWorker.js          # off-main-thread mesh generation
│   ├── surfaces/
│   │   ├── types.js               # JSDoc types for SurfaceDefinition, Palette
│   │   └── registry.js            # 15 surfaces
│   ├── ui/
│   │   ├── leftPanel.js           # classification + equation + metrics
│   │   ├── rightPanel.js          # lab coordinates + surface thumbnails
│   │   ├── controls.js            # isovalue, grid res, parameter sliders
│   │   └── transitions.js         # anime.js timelines for surface switch
│   └── styles/
│       └── main.css               # dark sci-fi theme, neon accents
└── tests/
    └── math/
        ├── expression.test.js
        └── curvature.test.js
```

## Surface library (launch set)

| Category | Surface | Notes |
|---|---|---|
| TPMS | Schwarz P, Schwarz D, Gyroid, **Schoen I-WP**, Neovius | All on `[-π, π]³` |
| Singular Algebraic | Cayley Nodal Cubic, Clebsch Diagonal, Kummer Quartic, Barth Sextic, Togliatti Quintic, **Chmutov Octic**, Endrass Octic | Bounded by sphere radii 2–4 |
| Fiber Bundles & Topology | **Seifert Fiber Space**, Boy's Surface (Bryant) | Custom domains |
| Classical | Dupin Cyclide | |

**Bold** = appears in the screenshot reference.

## Curvature pipeline

Per vertex emitted by marching cubes:
1. Evaluate symbolic `∇f` → use as normal (normalize).
2. Evaluate symbolic Hessian `H(f)`.
3. Compute mean curvature `H = (∇f · H · ∇fᵀ − |∇f|² · tr(H)) / (2|∇f|³)`.
4. Compute Gaussian curvature `K = (∇f · adj(H) · ∇fᵀ) / |∇f|⁴`.
5. Pack `(K, H)` into a `vec2` vertex attribute.

Fragment shader blends `uCurvatureBlend ∈ [0,1]` between the rim-fresnel palette and a curvature-magnitude colormap.

## Anti-cheating commitments

- **No mock surfaces.** Every published equation in `registry.js` is the surface's actual implicit form, sourced from its mathematical definition (Schoen, Schwarz, Chmutov, Barth, Bryant, etc.).
- **No fake normals.** Normals come from the analytic gradient, not from triangle averages.
- **No placeholder curvature.** K and H are derived from the actual Hessian; not random, not a heuristic.
- **No dummy UI numbers.** Vertex/triangle counts come from the actual mesh.
- **Dummy data is permitted only inside `tests/` fixtures.**

## Out of scope (for v1)

- Parametric surfaces (Klein bottle parametric form, etc.) — implicit only.
- Saving/loading user surfaces from disk (the registry IS the user's edit surface).
- Export to STL/OBJ.
- Multiple simultaneous surfaces.
- Mobile / touch controls.

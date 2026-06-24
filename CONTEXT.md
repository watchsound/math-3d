# CONTEXT — Topology Lab Deck

Canonical project vocabulary. Update inline as terms emerge or get refined.

## Domain terms

- **Surface** — an implicit algebraic surface defined by `f(x, y, z) = c`, where `f` is a math expression string and `c` is the isovalue. Stored as a `SurfaceDefinition` in the registry. Not synonymous with "mesh" — the mesh is what the renderer extracts at a given isovalue and grid resolution.

- **SurfaceDefinition** — one entry in [src/surfaces/registry.js](src/surfaces/registry.js). Carries: id, name, category, LaTeX source, mathjs expression string, parameters (with defaults and bounds), default isovalue, isovalue range, bounding box, palette, classification text, manifold-metric bullets. The single source of truth for everything the UI and renderer need to know about a surface.

- **Isovalue** — the constant `c` in `f(x,y,z) = c`. Default is usually `0`. User-adjustable per surface via the controls panel.

- **Marching cubes** — algorithm that extracts a triangle mesh from a scalar field on a regular grid. We implement it directly using Paul Bourke's 256-entry edge and triangle lookup tables.

- **Grid resolution** — the number of voxel samples per axis (e.g., 64 means a 64³ = 262,144 voxel grid). Labeled "Grid Res" in the Lab Coordinates panel.

- **Bounding box** — the cubic domain `[xmin, xmax] × [ymin, ymax] × [zmin, zmax]` over which marching cubes samples `f`. Surface-specific: TPMS need `[-π, π]³`; Barth Sextic needs a sphere-circumscribing box of radius ~3.

- **Gradient** `∇f` — vector of first partial derivatives `(∂f/∂x, ∂f/∂y, ∂f/∂z)`. Used as the surface normal (after normalization). Computed symbolically via mathjs `derivative()`, with central-difference fallback.

- **Hessian** `H(f)` — 3×3 matrix of second partials. Needed for curvature. Symbolic when possible.

- **Mean curvature** `H` — `(∇f · H(f) · ∇fᵀ − |∇f|² · tr(H(f))) / (2|∇f|³)`. Half the sum of principal curvatures.

- **Gaussian curvature** `K` — `(∇f · adj(H(f)) · ∇fᵀ) / |∇f|⁴`. Product of principal curvatures. Sign indicates local geometry (positive = elliptic, negative = hyperbolic, zero = parabolic).

- **Rim field** — per-vertex scalar, in `[0, 1]`, that drives the fragment shader's color gradient (`core → mid → edge`). Currently derived from a combination of view-dependent fresnel and curvature magnitude. The "Manifold Rim Field Gradient" bar in the UI displays this palette.

- **Palette** — 3-stop color gradient `{core, mid, edge}` defined per surface. Drives the neon look in the screenshots (pink/purple, teal, orange/red).

- **Lab Coordinates panel** — top-right HUD showing grid res, isovalue, vertex count ("Elements"), triangle count.

- **Topology Lab Deck** — top-left panel showing the current surface's classification, LaTeX equation, and manifold metrics list.

## Anti-terms (do not use)

- `Manager`, `Helper`, `Utils`, `Processor` — pick a domain term; if none fits, the abstraction may be wrong.
- "mesh definition" — use **SurfaceDefinition**. A surface is the math object; a mesh is the extracted geometry.
- "iso" alone — always **isovalue** to avoid confusion with "isosurface".

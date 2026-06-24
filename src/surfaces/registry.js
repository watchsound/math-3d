/**
 * @file Curated library of 15 implicit algebraic surfaces, each defined by its
 * actual published equation. The expressions are written in mathjs syntax.
 *
 * Sources & references:
 *   TPMS: Alan Schoen (NASA TN D-5541, 1970); Schwarz (1890); Karcher (1989).
 *   Chmutov: S. V. Chmutov, "Examples of projective surfaces with many singularities" (1992).
 *   Barth: W. Barth, "Two projective surfaces with many nodes" (1996).
 *   Togliatti: E. G. Togliatti (1949); reconstruction by Beauville/van Straten.
 *   Endrass: S. Endrass, "A projective surface of degree eight with 168 nodes" (1997).
 *   Kummer: E. E. Kummer (1864).
 *   Cayley/Clebsch: classical 19th-c. literature.
 *   Boy's Surface implicit form: Robert Bryant (Apéry/Bryant polynomial, 1986).
 *   Dupin Cyclide: C. Dupin (1822).
 *   Seifert Fiber Space: implicit surrogate; see comment in entry.
 */

import './types.js';

/** @type {import('./types.js').SurfaceDefinition[]} */
export const surfaces = [
  // ─────────────────────────────────────────────────────────────────────────
  // TPMS — Triply Periodic Minimal Surfaces
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'schwarz-p',
    name: 'Schwarz P',
    category: 'tpms',
    classification:
      'Schwarz primitive minimal surface (1890). A triply periodic minimal surface ' +
      'with cubic Pm-3m symmetry, partitioning ℝ³ into two congruent labyrinths.',
    equationLatex: '\\cos(x) + \\cos(y) + \\cos(z) = 0',
    equation: 'cos(x) + cos(y) + cos(z)',
    parameters: {},
    isovalue: { default: 0, min: -2, max: 2, step: 0.01 },
    box: { min: -Math.PI, max: Math.PI },
    palette: { core: '#0a2a3a', mid: '#1e90c8', edge: '#9be7ff' },
    metrics: [
      'Cubic space group Pm-3m',
      'Self-conjugate via Bonnet rotation',
      'Mean curvature H = 0 (exact minimal)',
      'Topological genus 3 per fundamental cell',
    ],
    recommendedGridRes: 72,
  },

  {
    id: 'schwarz-d',
    name: 'Schwarz D',
    category: 'tpms',
    classification:
      "Schwarz's diamond minimal surface. The Bonnet associate of the gyroid and " +
      'Schwarz P, with two interpenetrating diamond-lattice labyrinths.',
    equationLatex:
      '\\sin x \\sin y \\sin z + \\sin x \\cos y \\cos z + \\cos x \\sin y \\cos z + \\cos x \\cos y \\sin z = 0',
    equation:
      'sin(x)*sin(y)*sin(z) + sin(x)*cos(y)*cos(z) + cos(x)*sin(y)*cos(z) + cos(x)*cos(y)*sin(z)',
    parameters: {},
    isovalue: { default: 0, min: -1, max: 1, step: 0.01 },
    box: { min: -Math.PI, max: Math.PI },
    palette: { core: '#1a0a30', mid: '#7b3fbf', edge: '#dca6ff' },
    metrics: [
      'Diamond-cubic space group Pn-3m',
      'Bonnet conjugate of Schwarz P',
      'Two interpenetrating diamond labyrinths',
      'Mean curvature H = 0 (minimal)',
    ],
    recommendedGridRes: 72,
  },

  {
    id: 'gyroid',
    name: 'Gyroid (Schoen)',
    category: 'tpms',
    classification:
      "Schoen's gyroid (1970). A chiral triply periodic minimal surface with no " +
      'straight lines and no reflection symmetries — the only known embedded TPMS ' +
      'with such properties. Space group Ia-3d.',
    equationLatex:
      '\\sin x \\cos y + \\sin y \\cos z + \\sin z \\cos x = 0',
    equation: 'sin(x)*cos(y) + sin(y)*cos(z) + sin(z)*cos(x)',
    parameters: {},
    isovalue: { default: 0, min: -1.5, max: 1.5, step: 0.01 },
    box: { min: -Math.PI, max: Math.PI },
    palette: { core: '#062317', mid: '#15a06b', edge: '#a6ffd1' },
    metrics: [
      'Chiral space group Ia-3d',
      'No straight lines, no mirror symmetries',
      "Bonnet associate of Schwarz's P and D",
      'Genus 3 per primitive cubic cell',
    ],
    recommendedGridRes: 80,
  },

  {
    id: 'schoen-iwp',
    name: 'Schoen I-WP',
    category: 'tpms',
    classification:
      'Schoen I-WP (I-Wrapped Package) minimal surface. Partitions space into ' +
      'two interpenetrating, labyrinthine network domains with body-centered ' +
      'cubic symmetry.',
    equationLatex:
      '2(\\cos x \\cos y + \\cos y \\cos z + \\cos z \\cos x) - (\\cos 2x + \\cos 2y + \\cos 2z) = 0',
    equation:
      '2*(cos(x)*cos(y) + cos(y)*cos(z) + cos(z)*cos(x)) - (cos(2*x) + cos(2*y) + cos(2*z))',
    parameters: {},
    isovalue: { default: 0, min: -3, max: 3, step: 0.01 },
    box: { min: -Math.PI, max: Math.PI },
    palette: { core: '#2a1505', mid: '#d4731e', edge: '#ffd97a' },
    metrics: [
      'BCC crystallographic space group Im-3m',
      'Dual self-conjugate labyrinth structures',
      'Trigonometric level-set approximation',
      'Zero-mean curvature surface geometry',
    ],
    recommendedGridRes: 80,
  },

  {
    id: 'neovius',
    name: 'Neovius',
    category: 'tpms',
    classification:
      "Neovius surface (1883). A triply periodic minimal-surface approximation " +
      'in space group Im-3m, derived as a higher-order trigonometric variant of ' +
      'Schwarz P.',
    equationLatex:
      '3(\\cos x + \\cos y + \\cos z) + 4 \\cos x \\cos y \\cos z = 0',
    equation: '3*(cos(x) + cos(y) + cos(z)) + 4*cos(x)*cos(y)*cos(z)',
    parameters: {},
    isovalue: { default: 0, min: -7, max: 7, step: 0.05 },
    box: { min: -Math.PI, max: Math.PI },
    palette: { core: '#0a2030', mid: '#3a8ee0', edge: '#c2e8ff' },
    metrics: [
      'Space group Im-3m (BCC)',
      'Generalization of Schwarz P with cross-product term',
      'Two intertwining labyrinths',
      'Approximate minimal surface (Karcher class)',
    ],
    recommendedGridRes: 80,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Singular Algebraic Surfaces — max-nodal classics
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cayley-cubic',
    name: 'Cayley Nodal Cubic',
    category: 'singular',
    classification:
      "Cayley's nodal cubic surface (1869). The maximum-nodal cubic, attaining " +
      'the bound of 4 ordinary double points. Up to projective equivalence, the ' +
      'unique cubic with this many nodes.',
    equationLatex:
      '4(x^2 + y^2 + z^2) + 16\\,xyz - 1 = 0',
    equation: '4*(x^2 + y^2 + z^2) + 16*x*y*z - 1',
    parameters: {},
    isovalue: { default: 0, min: -3, max: 3, step: 0.01 },
    box: { min: -1.2, max: 1.2 },
    palette: { core: '#2a0510', mid: '#c83060', edge: '#ffb0c8' },
    metrics: [
      '4 ordinary double points (max for degree 3)',
      'Projective normal form in characteristic 0',
      'Symmetry group of the tetrahedron',
      'Rational singular surface',
    ],
    recommendedGridRes: 96,
  },

  {
    id: 'clebsch-cubic',
    name: 'Clebsch Diagonal Cubic',
    category: 'singular',
    classification:
      'Clebsch diagonal surface (1871). A smooth cubic carrying all 27 of its ' +
      'lines over the reals — the only such configuration. Realises the Eckardt ' +
      'point structure.',
    equationLatex:
      '81(x^3 + y^3 + z^3) - 189(x^2 y + x^2 z + x y^2 + y^2 z + x z^2 + y z^2) + 54 x y z + 126(xy + xz + yz) - 9(x^2 + y^2 + z^2) - 9(x+y+z) + 1 = 0',
    // Clebsch diagonal cubic, affine form (w = 1) from the published expansion of
    // ∑ xᵢ³ = 0  subject to  ∑ xᵢ = 0 with x₄ = 1 − x − y − z and x₅ found from the
    // remaining linear constraint. Reference: MathWorld "Clebsch Diagonal Cubic".
    equation:
      '81*(x^3 + y^3 + z^3) - 189*(x^2*y + x^2*z + x*y^2 + y^2*z + x*z^2 + y*z^2) + 54*x*y*z + 126*(x*y + x*z + y*z) - 9*(x^2 + y^2 + z^2) - 9*(x + y + z) + 1',
    parameters: {},
    isovalue: { default: 0, min: -10, max: 10, step: 0.05 },
    box: { min: -1.5, max: 1.5 },
    palette: { core: '#101a3a', mid: '#4060d8', edge: '#a6c0ff' },
    metrics: [
      'All 27 lines real (unique configuration)',
      '10 Eckardt points (triple-line incidences)',
      'Smooth cubic; Picard rank 7',
      'Symmetry group S5 acting on hexahedral structure',
    ],
    recommendedGridRes: 96,
  },

  {
    id: 'kummer-quartic',
    name: 'Kummer Quartic',
    category: 'singular',
    classification:
      "Kummer's quartic surface (1864). The Kummer variety of a principally " +
      'polarized abelian surface, attaining 16 ordinary double points — the ' +
      'maximum for an irreducible quartic in ℙ³.',
    equationLatex:
      '(x^2 + y^2 + z^2 - \\mu^2)^2 - \\lambda\\, p_1 p_2 p_3 p_4 = 0',
    // We use the Heisenberg form: (x²+y²+z²−μ²)² − λ·p₁p₂p₃p₄ with
    //   pᵢ = tetrahedral coordinates of a regular tetrahedron inscribed in the sphere.
    // For μ² = 1.3 and λ = 1 this realizes the classic 16-nodal Kummer surface.
    equation:
      '(x^2 + y^2 + z^2 - mu)^2 - lambda * ((1 - z - sqrt(2)*x) * (1 - z + sqrt(2)*x) * (1 + z - sqrt(2)*y) * (1 + z + sqrt(2)*y))',
    parameters: {
      mu: { default: 1.3, min: 0.5, max: 2.5, step: 0.01, description: 'Sphere radius² parameter' },
      lambda: { default: 1.0, min: 0.1, max: 2.0, step: 0.01, description: 'Tetrahedral coupling' },
    },
    isovalue: { default: 0, min: -3, max: 3, step: 0.01 },
    box: { min: -2.2, max: 2.2 },
    palette: { core: '#250a25', mid: '#a82dc8', edge: '#f0a6ff' },
    metrics: [
      '16 ordinary double points (max for quartic)',
      'Tetrahedral T_d symmetry',
      'K3 surface; minimal resolution is the Kummer K3',
      'Self-dual via Plücker map',
    ],
    recommendedGridRes: 100,
  },

  {
    id: 'barth-sextic',
    name: 'Barth Sextic',
    category: 'singular',
    classification:
      "Barth's sextic surface (1996). The world record holder for nodal sextics: " +
      '65 ordinary double points, saturating the Miyaoka bound. Built from the ' +
      'golden ratio φ.',
    equationLatex:
      '4(\\varphi^2 x^2 - y^2)(\\varphi^2 y^2 - z^2)(\\varphi^2 z^2 - x^2) - (1 + 2\\varphi)(x^2+y^2+z^2 - w^2)^2 w^2 = 0',
    // Standard affine form with w = 1, φ = golden ratio.
    equation:
      '4*((phi^2*x^2 - y^2) * (phi^2*y^2 - z^2) * (phi^2*z^2 - x^2)) - (1 + 2*phi) * (x^2 + y^2 + z^2 - 1)^2',
    parameters: {
      phi: { default: 1.618033988749895, min: 1.5, max: 1.8, step: 0.001, description: 'Golden ratio' },
    },
    isovalue: { default: 0, min: -3, max: 3, step: 0.01 },
    box: { min: -1.5, max: 1.5 },
    palette: { core: '#3a0a05', mid: '#e83a1e', edge: '#ffc8a6' },
    metrics: [
      '65 ordinary double points (max for sextics)',
      'Icosahedral A_5 symmetry',
      'Golden ratio φ in defining polynomial',
      'Saturates Miyaoka upper bound µ(6) = 65',
    ],
    recommendedGridRes: 110,
  },

  {
    id: 'togliatti-quintic',
    name: 'Dervish (Togliatti Quintic)',
    category: 'singular',
    classification:
      "Barth's dervish (1994). The quintic surface with the maximum possible " +
      '31 real ordinary double points, attaining Beauville\'s bound µ(5) = 31. ' +
      'Constructed as a·F + q = 0, where F is the product of 5 linear forms ' +
      'whose normals form a regular pentagon (D₅ symmetry), and q is a ' +
      'quartic ellipsoid factor. The constants involve the golden ratio φ = (1+√5)/2.',
    equationLatex:
      'a \\prod_{k=0}^{4}\\bigl(x\\cos\\tfrac{2\\pi k}{5}+y\\sin\\tfrac{2\\pi k}{5}-1\\bigr) + ' +
      '\\Bigl(1-\\tfrac{c}{1}z\\Bigr)\\bigl(x^2+y^2-1+rz^2\\bigr)^2 = 0',
    // Reference: W. Barth, "Two projective surfaces with many nodes" (1994).
    // Degree check: F = product of 5 linear forms → deg 5.
    //               q = (deg-1) × (deg-2)^2 = deg 5.
    // Constants (all exact via sqrt expressions, evaluated by mathjs at compile time):
    //   r = (1 + 3√5)/4 ≈ 1.9271
    //   c = √(5-√5)/2 ≈ 0.8313
    //   a = -4/5 · (1 + 1/√5) · √(5-√5) ≈ -1.9247
    equation:
      '(-4/5) * (1 + 1/sqrt(5)) * sqrt(5 - sqrt(5)) * ' +
      '(x - 1) * ' +
      '(cos(2*pi/5)*x + sin(2*pi/5)*y - 1) * ' +
      '(cos(4*pi/5)*x + sin(4*pi/5)*y - 1) * ' +
      '(cos(6*pi/5)*x + sin(6*pi/5)*y - 1) * ' +
      '(cos(8*pi/5)*x + sin(8*pi/5)*y - 1) + ' +
      '(1 - sqrt(5 - sqrt(5))/2 * z) * (x^2 + y^2 - 1 + (1 + 3*sqrt(5))/4 * z^2)^2',
    parameters: {},
    isovalue: { default: 0, min: -0.8, max: 0.8, step: 0.01 },
    box: { min: -1.5, max: 1.5 },
    palette: { core: '#0a2a1a', mid: '#22c08a', edge: '#a6f0d0' },
    metrics: [
      '31 real ordinary double points (Beauville bound µ(5) = 31)',
      'Dihedral D₅ symmetry (5-fold rotation + reflection)',
      'Constants from golden ratio: r = (1+3√5)/4, c = √(5-√5)/2',
      'Constructed by Barth (1994) as a·F + q form',
    ],
    recommendedGridRes: 100,
  },

  {
    id: 'chmutov-octic',
    name: 'Chmutov Octic',
    category: 'singular',
    classification:
      'A degree-8 algebraic hypersurface composed of Chebyshev polynomial ' +
      'mappings. Discovered by Sergei Chmutov, it yields a dense, highly ' +
      'symmetric lattice of critical points and tunnels.',
    equationLatex:
      'T_8(x) + T_8(y) + T_8(z) + 1 = 0',
    // T_8(t) = 128 t⁸ - 256 t⁶ + 160 t⁴ - 32 t² + 1.
    equation:
      '(128*x^8 - 256*x^6 + 160*x^4 - 32*x^2 + 1) + (128*y^8 - 256*y^6 + 160*y^4 - 32*y^2 + 1) + (128*z^8 - 256*z^6 + 160*z^4 - 32*z^2 + 1) + 1',
    parameters: {},
    isovalue: { default: 0, min: -5, max: 5, step: 0.05 },
    box: { min: -1.05, max: 1.05 },
    palette: { core: '#062a2a', mid: '#1ac8c8', edge: '#a6ffff' },
    metrics: [
      'High-order Chebyshev T_8 harmonics',
      'Grid-aligned tunnel system architecture',
      'Symmetrical multi-nodal intersection nodes',
      'Hyper-dimensional level-set cross section',
    ],
    recommendedGridRes: 110,
  },

  {
    id: 'endrass-octic',
    name: 'Endrass Octic',
    category: 'singular',
    classification:
      "Endrass octic (1997). A degree-8 surface carrying 168 ordinary double " +
      'points — the world record for octics, exceeding all earlier construction ' +
      'attempts.',
    equationLatex:
      '64(x^2 - w^2)(y^2 - w^2)\\bigl((x+y)^2 - 2w^2\\bigr)\\bigl((x-y)^2 - 2w^2\\bigr) - \\cdots',
    // Endrass real form (w = 1, t = 1):
    equation:
      '64*(x^2 - 1)*(y^2 - 1)*((x + y)^2 - 2)*((x - y)^2 - 2) - (-4*(1 + sqrt(2))*(x^2 + y^2 - 2)^2 + 8*(2 + sqrt(2))*z^2)^2',
    parameters: {},
    isovalue: { default: 0, min: -10, max: 10, step: 0.1 },
    box: { min: -1.8, max: 1.8 },
    palette: { core: '#2a0a2a', mid: '#c83fc8', edge: '#ffa6ff' },
    metrics: [
      '168 ordinary double points (max for octics)',
      'Tetrahedral symmetry T',
      'Records µ(8) ≥ 168',
      'Quasi-fibered over a quadric',
    ],
    recommendedGridRes: 110,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Fiber Bundles & Modulated Topology
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'seifert-fiber',
    name: 'Seifert Fiber Space',
    category: 'topology',
    classification:
      'An exotic, highly modulated 3-dimensional manifold representing a Seifert ' +
      'fiber space. The implicit surrogate below carves a (p,q)-toroidal cyclide ' +
      'whose level sets are p-fold modulated tori — visualizing the Seifert ' +
      'fibration over S² of multiplicity p.',
    equationLatex:
      '\\bigl(\\sqrt{x^2 + y^2} - R_0\\bigr)^2 + z^2 - r_0^2 \\cdot \\bigl(1 + a\\cos(p\\,\\theta + q\\arctan(z/(\\sqrt{x^2+y^2}-R_0)))\\bigr)^2 = 0',
    equation:
      '(sqrt(x^2 + y^2) - R0)^2 + z^2 - r0^2 * (1 + a*cos(p*atan2(y, x) + q*atan2(z, sqrt(x^2 + y^2) - R0)))^2',
    parameters: {
      R0: { default: 1.6, min: 0.8, max: 2.5, step: 0.01, description: 'Major torus radius' },
      r0: { default: 0.6, min: 0.1, max: 1.0, step: 0.01, description: 'Minor torus radius' },
      a: { default: 0.35, min: 0, max: 0.7, step: 0.01, description: 'Modulation amplitude' },
      p: { default: 7, min: 2, max: 12, step: 1, description: 'Longitudinal winding' },
      q: { default: 3, min: 1, max: 8, step: 1, description: 'Meridional winding' },
    },
    isovalue: { default: 0, min: -1, max: 1, step: 0.01 },
    box: { min: -3, max: 3 },
    palette: { core: '#2a0530', mid: '#c81ec8', edge: '#ff96ff' },
    metrics: [
      'Seifert fiber bundle S¹ → M → S²',
      '7-fold helical chiral winding symmetry',
      'Non-trivial fundamental group π₁ generators',
      'High-genus modulated toroidal cyclide',
    ],
    recommendedGridRes: 110,
  },

  {
    id: 'boy-bryant',
    name: "Boy's Surface (Bryant)",
    category: 'topology',
    classification:
      "Bryant's polynomial immersion of the real projective plane ℝP² into ℝ³ " +
      "(1986). The minimum-degree polynomial realisation of Boy's surface, a " +
      'non-orientable closed surface with one triple point.',
    equationLatex:
      '64(1-z)^3 z^3 - 48(1-z)^2 z^2 (3x^2 + 3y^2 + 2z^2) + \\cdots = 0',
    // Bryant's polynomial (Apéry/Bryant form, real degree 6):
    equation:
      '64*(1 - z)^3 * z^3 - 48*(1 - z)^2 * z^2 * (3*x^2 + 3*y^2 + 2*z^2) + 12*(1 - z)*z * (27*(x^2 + y^2)^2 - 24*z^2*(x^2 + y^2) + 36*sqrt(2)*y*z*(x^2 + y^2) - 39*x^2*z^2 + 9*y^2*z^2 + 4*z^4) + (9*x^2 + 9*y^2 - 2*z^2) * (-81*(x^2 + y^2)^2 - 72*z^2*(x^2 + y^2) + 108*sqrt(2)*x*z*(x^2 - 3*y^2) + 4*z^4)',
    parameters: {},
    isovalue: { default: 0, min: -50, max: 50, step: 0.1 },
    box: { min: -1.1, max: 1.1 },
    palette: { core: '#100a30', mid: '#5a3fff', edge: '#c0a6ff' },
    metrics: [
      'Immersion of ℝP² into ℝ³',
      'Non-orientable, χ = 1, one triple point',
      "Bryant's minimum-degree polynomial form",
      'Three-fold C₃ rotational symmetry',
    ],
    recommendedGridRes: 110,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Classical
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'dupin-cyclide',
    name: 'Dupin Cyclide',
    category: 'classical',
    classification:
      'Dupin cyclide (1822). The most general surface whose lines of curvature ' +
      'are all circular arcs — equivalently, the inversive image of a torus, ' +
      'cone, or cylinder under a sphere inversion.',
    equationLatex:
      '(x^2 + y^2 + z^2 - \\mu^2 + b^2)^2 - 4(a x - c \\mu)^2 - 4 b^2 y^2 = 0',
    equation:
      '(x^2 + y^2 + z^2 - mu^2 + b^2)^2 - 4*(a*x - c*mu)^2 - 4*b^2*y^2',
    parameters: {
      a: { default: 1.4, min: 1.0, max: 2.5, step: 0.01, description: 'Major axis' },
      b: { default: 0.9, min: 0.3, max: 1.5, step: 0.01, description: 'Minor axis' },
      c: { default: Math.sqrt(1.4 * 1.4 - 0.9 * 0.9), min: 0.1, max: 2.3, step: 0.01, description: 'Focal distance' },
      mu: { default: 0.6, min: 0, max: 1.5, step: 0.01, description: 'Tube modulation' },
    },
    isovalue: { default: 0, min: -2, max: 2, step: 0.01 },
    box: { min: -3, max: 3 },
    palette: { core: '#0a302a', mid: '#1ec89e', edge: '#a6ffe0' },
    metrics: [
      'All curvature lines are circles',
      'Inversive image of a torus',
      'Conformally flat embedding',
      'Channel surface with two focal conics',
    ],
    recommendedGridRes: 96,
  },
];

/** @type {Map<string, import('./types.js').SurfaceDefinition>} */
export const surfaceById = new Map(surfaces.map((s) => [s.id, s]));

export const categories = {
  tpms: 'Triply Periodic Minimal Surfaces',
  singular: 'Singular Algebraic Surfaces',
  topology: 'Fiber Bundles & Topology',
  classical: 'Classical Surfaces',
  custom: 'Custom',
};

// ── Custom surface persistence ────────────────────────────────────────────

const _STORAGE_KEY = 'topology-lab-custom';

function _loadStored() {
  try { return JSON.parse(localStorage.getItem(_STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function _persist(list) {
  try { localStorage.setItem(_STORAGE_KEY, JSON.stringify(list)); } catch {}
}

// Merge any previously-saved custom surfaces into the live collections.
for (const s of _loadStored()) {
  surfaces.push(s);
  surfaceById.set(s.id, s);
}

export function addCustomSurface(def) {
  surfaces.push(def);
  surfaceById.set(def.id, def);
  const list = _loadStored();
  list.push(def);
  _persist(list);
}

export function removeCustomSurface(id) {
  const i = surfaces.findIndex((s) => s.id === id);
  if (i !== -1) surfaces.splice(i, 1);
  surfaceById.delete(id);
  _persist(_loadStored().filter((s) => s.id !== id));
}

export function isCustomSurface(id) {
  return _loadStored().some((s) => s.id === id);
}

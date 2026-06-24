/**
 * @typedef {Object} Palette
 * @property {string} core  - CSS color for low rim-field values (interior)
 * @property {string} mid   - CSS color for mid rim-field values
 * @property {string} edge  - CSS color for high rim-field values (rim)
 */

/**
 * @typedef {Object} ParameterSpec
 * @property {number} default
 * @property {number} min
 * @property {number} max
 * @property {number} [step]
 * @property {string} [description]
 */

/**
 * @typedef {Object} IsoSpec
 * @property {number} default
 * @property {number} min
 * @property {number} max
 * @property {number} [step]
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {Object} SurfaceDefinition
 * @property {string}  id              - stable kebab-case identifier
 * @property {string}  name            - display name (e.g. "Schoen I-WP")
 * @property {('tpms'|'singular'|'topology'|'classical')} category
 * @property {string}  classification  - short prose: what is this object?
 * @property {string}  equationLatex   - LaTeX source for the equation panel
 * @property {string}  equation        - mathjs expression in x, y, z, plus parameters
 * @property {Object.<string, ParameterSpec>} parameters
 * @property {IsoSpec} isovalue
 * @property {BoundingBox} box         - cubic domain for marching cubes
 * @property {Palette} palette
 * @property {string[]} metrics        - bullet points for the "Manifold Metrics" panel
 * @property {number} [recommendedGridRes]
 */

export {};

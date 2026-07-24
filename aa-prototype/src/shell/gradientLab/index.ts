/**
 * Gradient Lab module (Phase 13) — the temporary in-browser tuning surface for
 * the mobile atmosphere, plus the atmosphere paint itself. Everything the lab
 * needs is re-exported here; deleting this folder (and flipping
 * `GRADIENT_LAB_ENABLED`) removes the lab cleanly, leaving the checked-in
 * atmosphere intact (it is sourced from `AA_DEFAULT_GRADIENT`).
 */
export { AtmosphereLayer } from './AtmosphereLayer'
export { GradientLab } from './GradientLab'
export { useMobileGradient, type GradientLabController, type UseMobileGradientResult } from './useGradientLab'

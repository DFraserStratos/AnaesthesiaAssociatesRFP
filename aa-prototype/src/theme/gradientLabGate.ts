/**
 * The single, named, removable feature gate for the Phase 13 Gradient Lab.
 *
 * TO REMOVE THE LAB AFTER SIGN-OFF: flip this to `false` (or delete the
 * `src/shell/gradientLab/` folder and this file). The in-phone atmosphere KEEPS
 * WORKING either way, because it is sourced from `AA_DEFAULT_GRADIENT` in
 * `mobileGradient.ts`, not from the lab. With the gate off the lab UI never
 * mounts and its localStorage key (`aa-gradient-lab`) is ignored, so the
 * checked-in default always shows.
 *
 * This is the only feature flag in the prototype (surfaces are otherwise
 * separated by convention/routing) — a deliberate, self-contained gate so the
 * temporary tuning UI can be lifted cleanly.
 */
export const GRADIENT_LAB_ENABLED = true

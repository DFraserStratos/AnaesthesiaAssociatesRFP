/**
 * Store layer — Zustand slices, lifecycle guards, audit writer.
 *
 * The domain store (Lists, Cards, seed hydration, guarded transitions) lands in
 * Phase 02. Phase 00 has only the tiny shell slice below, which owns the active
 * app + persona and persists them to localStorage.
 */

export { useShellStore } from './shellStore'

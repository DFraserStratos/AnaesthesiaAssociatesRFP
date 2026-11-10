/**
 * Domain layer — types, demo clock, RNG, NHI/NZHIS helpers, billing maths
 * (pure, no React — enforced by `domainPurity.test.ts`).
 *
 * Phase 01 filled the model + calculator; Phase 02 adds the seed + store.
 */

export * from './types'
export * from './clock'
export * from './slots'
export * from './listPairing'
export * from './draftLists'
export * from './rng'
export * from './nhi'
export * from './nzhis'
export * from './billing'
export * from './seed'
export * from './warnings'
// The anaesthetist's main view and search (catch-up Phase 38a).
export * from './listProgress'
export * from './outOfHours'
export * from './bookingSearch'

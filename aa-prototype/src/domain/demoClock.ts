/**
 * Demo clock constants.
 *
 * The whole prototype runs on a pinned demo date so seed data and screens match
 * the design mockups 1:1 (PROGRESS convention 5; Decisions log 2026-07-21).
 * Never call `Date.now()` / `new Date()` for domain logic — read the demo clock.
 *
 * Phase 00 exposes only pinned constants. A real, advanceable demo clock (with
 * time-of-day and a control-panel "advance" control) arrives in Phase 02.
 */

/** Pinned demo date — the mockups' content date. ISO `YYYY-MM-DD`. */
export const DEMO_TODAY = '2026-07-21'

/** Human-readable form of {@link DEMO_TODAY} (matches the mockups' headers). */
export const DEMO_TODAY_LABEL = 'Tuesday 21 July 2026'

/**
 * Pinned demo "now" for the phone-frame status bar. A fixed display string this
 * phase; Phase 02's demo clock will supersede it.
 */
export const DEMO_CLOCK_TIME = '9:41'

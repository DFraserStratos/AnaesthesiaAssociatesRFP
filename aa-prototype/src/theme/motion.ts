/**
 * Motion — the four named patterns (Design Language §05), transcribed 1:1.
 * "Delight in the actions, not the chrome." Reduced-motion collapses
 * everything to 80 ms fades (see the media query in `global.css`).
 *
 * Durations are in milliseconds. Components read these constants so timings
 * stay consistent with the mockups; keyframes with matching names live in
 * `global.css` for CSS-driven animations.
 */

/** Named easing curves used by the patterns below. */
export const easing = {
  /** Sheets & pickers. */
  sheet: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Card advance / return. */
  card: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  /** Completion tick draw & pulse. */
  tick: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Value roll. */
  easeOut: 'ease-out',
} as const

export const motion = {
  /** Bottom sheets, pickers. In 320 ms · out 260 ms; scrim fades 240 ms. */
  sheetIn: {
    in: 320,
    out: 260,
    easing: easing.sheet,
    scrimFade: 240,
  },
  /**
   * Card slides in from the right; the view behind parallaxes −24% and dims 8%.
   * In 260 ms · return 240 ms.
   */
  cardAdvance: {
    in: 260,
    return: 240,
    easing: easing.card,
    parallax: '-24%',
    dim: 0.08,
  },
  /**
   * Complete-tick: draw 360 ms after a 60 ms delay; container pulses
   * 1 → 1.04 → 1 over 420 ms; success tint floods. Haptic at 200 ms.
   */
  completeTick: {
    drawDuration: 360,
    drawDelay: 60,
    easing: easing.tick,
    pulseDuration: 420,
    hapticAt: 200,
  },
  /**
   * Value-tick: fees & unit counts roll 160 ms per step (ease-out); an
   * accent-tint flash decays over 240 ms. Tabular numerals mandatory.
   */
  valueTick: {
    stepDuration: 160,
    easing: easing.easeOut,
    tintDecay: 240,
  },
  /** Reduced-motion target: everything collapses to an 80 ms fade. */
  reducedMotionFade: 80,
} as const

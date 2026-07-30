/**
 * Haptics — the one line of the motion table that no keyframe can carry.
 *
 * Design Language §05 describes the complete-tick as "draw 360 ms after a 60 ms
 * delay; container pulses 1 → 1.04 → 1 over 420 ms; success tint floods. Haptic
 * at 200 ms." Every clause but the last is a CSS animation in `global.css`; the
 * haptic is a device call, so it lives here and reads its timing from
 * `motion.completeTick.hapticAt` rather than repeating the number.
 *
 * **A deliberate no-op on iOS.** Safari has never shipped the Vibration API, so
 * `navigator.vibrate` is simply absent there and the feature detection below
 * returns early. Android Chrome is where the buzz actually lands. Desktop
 * browsers that expose the method without vibration hardware no-op harmlessly,
 * and jsdom (no `navigator.vibrate` at all) takes the same early return, which
 * is why the unit suites stay silent without shimming anything.
 *
 * Pure TS on purpose: `src/theme/` holds no React, so the scheduler is a plain
 * timer that hands back its own canceller and drops straight into a `useEffect`.
 */

import { motion } from './motion'

/**
 * Buzz length. The Design Language specifies WHEN, not how long; 12 ms is the
 * shortest pulse that still registers as the tick landing rather than an alert.
 */
const COMPLETION_BUZZ_MS = 12

/** Reduced motion means reduced everything — a buzz is motion the user feels. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Buzz now. Never throws. Some browsers expose `navigator.vibrate` but reject
 * the call when the document has no user activation, and one failed haptic must
 * never take the success moment down with it.
 */
export function fireCompletionHaptic(): void {
  if (prefersReducedMotion()) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(COMPLETION_BUZZ_MS)
  } catch {
    // Blocked by the browser (no user activation) or by the device. Nothing to do.
  }
}

/**
 * Schedule the buzz at `motion.completeTick.hapticAt`, the point where the drawn
 * tick meets the container pulse. Returns the canceller, so a success moment
 * that ends early — the owner's timer fired, or the user tapped the overlay
 * away — never buzzes after the fact.
 */
export function scheduleCompletionHaptic(): () => void {
  const timer = window.setTimeout(fireCompletionHaptic, motion.completeTick.hapticAt)
  return () => window.clearTimeout(timer)
}

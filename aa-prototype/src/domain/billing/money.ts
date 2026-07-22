/**
 * Money helpers. All fee maths rounds to cents at the point a dollar amount is
 * produced; equality comparisons (e.g. the funder-split conservation rule) go
 * through `toCents` so floating point never decides a validation.
 */

/** Round a dollar amount to the nearest cent. */
export function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

/** A dollar amount as integer cents (for exact comparison). */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

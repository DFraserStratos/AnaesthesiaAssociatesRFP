/**
 * Money helpers. All fee maths rounds to cents at the point a dollar amount is
 * produced; equality comparisons (e.g. a split's shares against the fee) go
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

/**
 * How `formatMoney` prints an amount. `cents`: 'always' (the default) prints
 * two decimals; 'whenAny' drops ".00" on a whole-dollar amount ("$3,100").
 * `sign`: 'auto' (the default) prints a negative with a hyphen-minus before
 * the dollar sign ("-$5.00") and a positive unsigned; 'always' also signs a
 * positive ("+$5.00"). Zero, and a negative that rounds to zero, is always
 * "$0.00". Never "$-5.00", an en dash or a U+2212 minus.
 */
export interface MoneyFormat {
  cents?: 'always' | 'whenAny'
  sign?: 'auto' | 'always'
}

/**
 * NZ dollars as every screen prints them: "$3,100.00", grouped with `en-NZ`
 * (UI unification U1, question 21), a negative as "-$34.45" (the sign before
 * the dollar sign, as the remittance advice always printed it). The cent
 * rounding is `Intl`'s (half away from zero); on the cent amounts the fee
 * maths produces (`roundToCents`) there is nothing to round.
 * `shared/format.ts` re-exports it as `formatCurrency`.
 */
export function formatMoney(amount: number, options: MoneyFormat = {}): string {
  const figure = Math.abs(amount).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const shown = options.cents === 'whenAny' && figure.endsWith('.00') ? figure.slice(0, -3) : figure
  if (figure === '0.00') return `$${shown}`
  const sign = amount < 0 ? '-' : options.sign === 'always' ? '+' : ''
  return `${sign}$${shown}`
}

/**
 * A dollar amount as a person types it ("$1,234.50", "1234.5", "3 100"), or
 * undefined when it is no amount: blank, not a plain number of zero or more,
 * or more than two decimal places. `$`, commas and spaces are ignored; the
 * result is rounded to the cent. The one parser for typed money (U1); a caller
 * that refuses in its own words wraps it (`parseAmount(text) ?? Number.NaN`).
 */
export function parseAmount(text: string): number | undefined {
  const t = text.replace(/[$,\s]/g, '')
  if (t === '' || !/^\d+(\.\d{1,2})?$/.test(t)) return undefined
  return roundToCents(Number(t))
}

/** `parseAmount`, or NaN when it is no amount: for a save guard that refuses NaN in its own words (price ranges, AA fees). */
export function parseAmountOrNaN(text: string): number {
  return parseAmount(text) ?? Number.NaN
}

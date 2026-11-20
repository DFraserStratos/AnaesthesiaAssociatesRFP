/**
 * Valid NHIs for tests (catch-up Phase 40: the NHI is mandatory on every
 * create path, D11). `testNhi(n)` is a valid current-format NHI in the `ZZZ`
 * block, which the seed never generates; `nextTestNhi()` hands out the next
 * one, so each new test patient is a new record. Tests only.
 */

import { validateNhi } from '../domain/nhi'

/** A valid NHI `ZZZ` + three digits + its check digit; `n` skips forward past combinations never assigned. */
export function testNhi(n: number): string {
  for (let i = n; ; i++) {
    const stem = `ZZZ${String(i % 1000).padStart(3, '0')}`
    for (let d = 0; d <= 9; d++) {
      const candidate = `${stem}${d}`
      if (validateNhi(candidate).valid) return candidate
    }
  }
}

let next = 100

/** The next unused test NHI in this test file's run. */
export function nextTestNhi(): string {
  const nhi = testNhi(next)
  next = Number(nhi.slice(3, 6)) + 1
  return nhi
}

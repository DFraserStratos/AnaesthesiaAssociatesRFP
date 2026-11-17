/**
 * Catch-up Phase 25 parity (work item 1): the invoices raised for the S3, S5
 * and S4 billing-failure Lists, pinned in `__parity__/phase-25-invoices.json`
 * from the engine as Phase 24 left it. The lock changes where the numbers come
 * from, never the numbers. Never run with `-u`.
 */

import { describe, expect, it } from 'vitest'
import { capturePhase25 } from './__parity__/phase25Capture'

describe('Phase 25 invoice parity', () => {
  it('the S3, S5 and S4 Lists raise exactly the invoices Phase 24 raised', async () => {
    const captured = capturePhase25()
    expect(captured.lists.every((l) => l.ok)).toBe(true)
    await expect(JSON.stringify(captured, null, 2) + '\n').toMatchFileSnapshot('./__parity__/phase-25-invoices.json')
  })
})

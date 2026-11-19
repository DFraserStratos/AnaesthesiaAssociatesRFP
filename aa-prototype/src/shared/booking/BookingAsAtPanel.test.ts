import { describe, expect, it } from 'vitest'
import type { AuditEntry } from '../../domain/types'
import { PAYER_NOT_BILLED_YET } from '../../domain/billing/whoIsBilled'
import { createAppStore } from '../../store'
import { asAtEntriesFor, asAtPaidByText } from './BookingAsAtPanel'

const entry = (id: string, partial: Partial<AuditEntry> & Pick<AuditEntry, 'entityType' | 'entityId' | 'action'>): AuditEntry => ({
  id,
  who: 'Kirsty W.',
  role: 'office',
  source: 'office',
  atISO: '2026-07-21T09:00:00',
  ...partial,
})

describe('asAtEntriesFor', () => {
  it("includes a billing line's entries when it was on one of the Booking's Procedures, current or removed", () => {
    const audit = [
      entry('A1', { entityType: 'procedure', entityId: 'P-gone', action: 'procedure.remove', before: { id: 'P-gone', bookingId: 'BK1' } }),
      entry('A2', { entityType: 'billingLine', entityId: 'BL-gone', action: 'billingLine.remove', before: { id: 'BL-gone', procedureId: 'P-gone' } }),
      entry('A3', { entityType: 'billingLine', entityId: 'BL-now', action: 'billingLine.add', after: { id: 'BL-now', procedureId: 'P1' } }),
      entry('A4', { entityType: 'billingLine', entityId: 'BL-other', action: 'billingLine.add', after: { id: 'BL-other', procedureId: 'P-elsewhere' } }),
    ]
    const ids = asAtEntriesFor(audit, 'BK1', 'PT1', ['P1'], []).map((e) => e.id)
    expect(ids).toEqual(['A1', 'A2', 'A3'])
  })
})

describe('asAtPaidByText', () => {
  const { masters } = createAppStore().getState()
  const holderContract = Object.values(masters.contracts).find((c) => c.billsTo === 'holder' && masters.parties[c.holderId] !== undefined)!
  const payerContract = Object.values(masters.contracts).find((c) => c.billsTo !== 'holder')!
  const patient = { name: 'Grace Park' }

  it('names the payer only where the Contract bills the payer; else the holder', () => {
    expect(asAtPaidByText(payerContract, { kind: 'patient' }, patient, masters.parties)).toBe('Grace Park (Patient)')
    expect(asAtPaidByText(payerContract, { kind: 'other', id: 'BP0009', name: 'Hana Park', relationship: 'Mother' }, patient, masters.parties)).toBe('Hana Park (Mother)')
    expect(asAtPaidByText(holderContract, { kind: 'patient' }, patient, masters.parties)).toBe(masters.parties[holderContract.holderId]!.name)
    expect(asAtPaidByText(undefined, { kind: 'patient' }, patient, masters.parties)).toBe(PAYER_NOT_BILLED_YET)
  })
})

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
  atISO: '2026-11-24T09:00:00',
  ...partial,
})

describe('asAtEntriesFor', () => {
  it("includes the Booking's, its patient's and its Procedures' entries, current or removed", () => {
    const audit = [
      entry('A1', { entityType: 'procedure', entityId: 'P-gone', action: 'procedure.remove', before: { id: 'P-gone', bookingId: 'BK1' } }),
      entry('A2', { entityType: 'procedure', entityId: 'P1', action: 'procedure.update', after: { asaGrade: 2 } }),
      entry('A3', { entityType: 'booking', entityId: 'BK1', action: 'booking.update', after: { notes: 'x' } }),
      entry('A4', { entityType: 'procedure', entityId: 'P-elsewhere', action: 'procedure.update', after: { asaGrade: 3 } }),
      entry('A5', { entityType: 'patient', entityId: 'PT1', action: 'patient.update', after: { phone: '1' } }),
    ]
    const ids = asAtEntriesFor(audit, 'BK1', 'PT1', ['P1']).map((e) => e.id)
    expect(ids).toEqual(['A1', 'A2', 'A3', 'A5'])
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

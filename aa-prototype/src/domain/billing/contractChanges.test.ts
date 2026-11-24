/**
 * The Contract change warnings' two lists and the disable day (catch-up Phase
 * 25a; US-04.1.2, US-04.2.15, US-07.2.2, D79, D81). Pure: nothing here moves or
 * re-prices a Procedure.
 */
import { describe, expect, it } from 'vitest'
import type { AuditEntry, Booking, List, Procedure } from '../types'
import type { BookingLock, ProcedureSnapshot } from './lock'
import { mkProcedure } from './fixtures'
import { authorisedKeptPrice, keptPriceTitle, proceduresStillOnContract, stillOnTitle } from './contractChanges'
import { contractDisabledOn, disabledDaysByContract } from './contractHistory'

const ON = 'con-face'
const OTHER = 'con-other'

const list = (dateISO: string, state: List['state'] = 'ACTIVE') => ({ dateISO, state })
const booking = (id: string, listId: string, over: Partial<Booking> = {}): Booking =>
  ({ id, listId, patientId: `pat-${id}`, completed: false, ...over }) as unknown as Booking
const proc = (id: string, bookingId: string, contractId: string = ON, over: Partial<Procedure> = {}): Procedure =>
  mkProcedure({ id, bookingId, governingContractId: contractId, procedureText: { text: 'Face lift', source: 'surgeonPdf', receivedAtISO: '2026-11-04T09:00:00' }, ...over })

describe('proceduresStillOnContract (US-04.1.2, D79)', () => {
  const lists = {
    L1: list('2026-12-04'),
    L2: list('2026-12-14'),
    L3: list('2026-12-07', 'AUTHORISED'),
    L4: list('2026-12-16', 'SUBMITTED'),
  }
  const bookings = {
    B1: booking('B1', 'L1'),
    B2: booking('B2', 'L2', { scheduledTime: '15:00' }),
    B2b: booking('B2b', 'L2', { scheduledTime: '13:00' }),
    B3: booking('B3', 'L3'),
    B4: booking('B4', 'L4'),
    B5: booking('B5', 'L2', { cancellation: { reason: 'x', by: 'y', role: 'office', source: 'office', atISO: '2026-11-23T09:00:00' } }),
    B6: booking('B6', 'L2'),
  }
  const procedures = {
    P1: proc('P1', 'B1'),
    P2: proc('P2', 'B2'),
    P2b: proc('P2b', 'B2b'),
    P3: proc('P3', 'B3'),
    P4: proc('P4', 'B4'),
    P5: proc('P5', 'B5'),
    P6: proc('P6', 'B6', OTHER),
  }
  const patients = { 'pat-B2': { name: 'Sophie Matthews' } }
  const input = { procedures, bookings, lists, patients }

  it('lists the not-yet-authorised Procedures on the Contract dated on or after the day, by date then time', () => {
    const rows = proceduresStillOnContract(input, ON, '2026-12-05')
    expect(rows.map((r) => r.procedureId)).toEqual(['P2b', 'P2', 'P4'])
    expect(rows[1]).toEqual({ procedureId: 'P2', bookingId: 'B2', listId: 'L2', dateISO: '2026-12-14', scheduledTime: '15:00', patientName: 'Sophie Matthews', procedureText: 'Face lift' })
  })

  it('the day itself is included; earlier ones are not', () => {
    expect(proceduresStillOnContract(input, ON, '2026-12-04').map((r) => r.procedureId)).toEqual(['P1', 'P2b', 'P2', 'P4'])
  })

  it('leaves off an AUTHORISED List (locked), a cancelled Booking and another Contract', () => {
    const ids = proceduresStillOnContract(input, ON, '2026-01-01').map((r) => r.procedureId)
    expect(ids).not.toContain('P3')
    expect(ids).not.toContain('P5')
    expect(ids).not.toContain('P6')
  })

  it('moves nothing: the input is untouched', () => {
    const before = JSON.stringify(input)
    proceduresStillOnContract(input, ON, '2026-12-05')
    expect(JSON.stringify(input)).toBe(before)
  })

  it('titles', () => {
    expect(stillOnTitle(2, 'Sat 5 Dec', 'Face lift')).toBe('2 Procedures dated on or after Sat 5 Dec are still on Face lift.')
    expect(stillOnTitle(1, 'Sat 5 Dec', 'Face lift')).toBe('1 Procedure dated on or after Sat 5 Dec is still on Face lift.')
  })
})

describe('authorisedKeptPrice (US-04.2.15, D79)', () => {
  // The lock's Contract is cut to the range in force on the date (`contractAsLocked`); `price` is the whole fee.
  const snap = (procedureId: string, rangePrice: number, typed = false, contractId = ON, wholePrice = rangePrice): ProcedureSnapshot =>
    ({
      procedureId,
      procedure: { text: null, invoiceDescription: null, rvgCode: null, isPrimary: true },
      contract: { id: contractId, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-10-05', price: rangePrice }] } },
      price: wholePrice,
      typed,
      charges: [],
    }) as unknown as ProcedureSnapshot
  const lock = (bookingId: string, dateISO: string, procedures: ProcedureSnapshot[], state: BookingLock['state'] = 'locked'): BookingLock =>
    ({ bookingId, listId: `L-${bookingId}`, pricingDateISO: dateISO, state, patient: { name: `Patient ${bookingId}` }, procedures }) as unknown as BookingLock
  const locks = {
    B1: lock('B1', '2026-11-19', [snap('P1', 3100)]),
    B2: lock('B2', '2026-11-23', [snap('P2', 3100)]),
    B3: lock('B3', '2026-11-25', [snap('P3', 2950, true)]),
    B4: lock('B4', '2026-11-26', [snap('P4', 3300)]),
    B5: lock('B5', '2026-10-24', [snap('P5', 3100)]),
    B6: lock('B6', '2026-11-27', [snap('P6', 3100, false, OTHER)]),
    B7: lock('B7', '2026-11-28', [snap('P7', 3100)], 'rejected'),
    B8: lock('B8', '2027-01-06', [snap('P8', 3100)]),
  }
  const ranges = [
    { startISO: '2026-10-05', price: 3100 },
    { startISO: '2026-11-04', price: 3300 },
    { startISO: '2027-01-05', price: 3400 },
  ]
  const added = { startISO: '2026-11-04', price: 3300 }

  it('"Authorised kept, warned": two locked Procedures in the span at the old price are counted and listed', () => {
    const rows = authorisedKeptPrice(locks, ON, ranges, added)
    expect(rows.map((r) => r.procedureId)).toEqual(['P1', 'P2'])
    expect(rows[0]).toEqual({ procedureId: 'P1', bookingId: 'B1', listId: 'L-B1', dateISO: '2026-11-19', patientName: 'Patient B1', lockedPrice: 3100, rangePrice: 3300 })
    expect(keptPriceTitle(rows.length)).toBe('2 authorised Procedures kept their old price')
    expect(keptPriceTitle(1)).toBe('1 authorised Procedure kept its old price')
  })

  it('"No list of re-priced": one already at the range price is not listed; nor a typed price, another Contract, a rejected lock, or a date outside the span', () => {
    const ids = authorisedKeptPrice(locks, ON, ranges, added).map((r) => r.procedureId)
    for (const id of ['P3', 'P4', 'P5', 'P6', 'P7', 'P8']) expect(ids).not.toContain(id)
  })

  it('compares the locked range price, never the whole fee: a fixed billing line on top raises no row', () => {
    const withLine = { B9: lock('B9', '2026-10-24', [snap('P9', 3100, false, ON, 3250)]) }
    // Under the 1 Jun range ($3,100) it kept nothing, whatever its $150 line added.
    expect(authorisedKeptPrice(withLine, ON, ranges, ranges[0]!)).toEqual([])
    // Under a range that changed its price, the row shows the range price it kept, not the whole fee.
    const moved = [{ startISO: '2026-10-05', price: 3200 }]
    expect(authorisedKeptPrice(withLine, ON, moved, moved[0]!).map((r) => [r.lockedPrice, r.rangePrice])).toEqual([[3100, 3200]])
  })

  it('a range that is not among the ranges lists nothing', () => {
    expect(authorisedKeptPrice(locks, ON, ranges, { startISO: '2026-11-18', price: 9999 })).toEqual([])
  })

  it('the last range runs on with no end', () => {
    const ids = authorisedKeptPrice(locks, ON, ranges, { startISO: '2027-01-05', price: 3400 }).map((r) => r.procedureId)
    expect(ids).toEqual(['P8'])
  })
})

describe('the disable day, from the audit (US-07.2.2, US-04.1.3, D81)', () => {
  let n = 0
  const entry = (contractId: string, action: string, atISO: string): AuditEntry =>
    ({ id: `A${String(++n).padStart(4, '0')}`, entityType: 'contract', entityId: contractId, action, atISO, who: 'Kirsty W.', role: 'office', source: 'office' }) as AuditEntry

  it('disabled: the day of the disable entry', () => {
    const audit = [entry(ON, 'contract.create', '2026-10-05T09:00:00'), entry(ON, 'contract.disable', '2026-11-13T11:20:00')]
    expect(contractDisabledOn(audit, ON)).toBe('2026-11-13')
  })

  it('re-enabled: none; disabled again: the latest day', () => {
    const reEnabled = [entry(ON, 'contract.disable', '2026-11-13T11:20:00'), entry(ON, 'contract.enable', '2026-11-15T09:00:00')]
    expect(contractDisabledOn(reEnabled, ON)).toBeNull()
    const again = [...reEnabled, entry(ON, 'contract.disable', '2026-11-23T16:00:00')]
    expect(contractDisabledOn(again, ON)).toBe('2026-11-23')
  })

  it('under the pinned clock (same time), the later audit id wins', () => {
    const same = [entry(ON, 'contract.disable', '2026-11-24T08:00:00'), entry(ON, 'contract.enable', '2026-11-24T08:00:00')]
    expect(contractDisabledOn(same, ON)).toBeNull()
  })

  it('a never-disabled Contract has none; the map holds only Disabled ones', () => {
    const audit = [entry(ON, 'contract.disable', '2026-11-13T11:20:00'), entry(OTHER, 'contract.update', '2026-11-14T10:00:00')]
    expect(contractDisabledOn(audit, OTHER)).toBeNull()
    expect(disabledDaysByContract(audit)).toEqual({ [ON]: '2026-11-13' })
  })
})

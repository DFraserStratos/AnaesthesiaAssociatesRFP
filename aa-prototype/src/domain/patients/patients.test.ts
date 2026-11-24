import { describe, expect, it } from 'vitest'
import { addDaysISO } from '../clock'
import {
  buildNhiIndex,
  checksPatientBalance,
  countsTowardPatientBalance,
  detailDifferences,
  invoiceAgeDays,
  patientBalanceStrength,
  patientBalanceSummary,
  patientCentricBalance,
  waitingNhiUrgency,
  type PatientBalanceRow,
} from '.'

const TODAY = '2026-11-24'
const ME = 'PT0005'

function row(over: Partial<PatientBalanceRow> & Pick<PatientBalanceRow, 'invoiceId' | 'raisedAtISO'>): PatientBalanceRow {
  return {
    invoiceNumber: `AA-${over.invoiceId}`,
    bookingId: 'BK-OLD',
    billedTo: { kind: 'patient', id: ME },
    total: 100,
    outstanding: 100,
    status: 'unpaid',
    creditHeld: 0,
    ...over,
  }
}

const daysAgo = (n: number): string => `${addDaysISO(TODAY, -n)}T09:00:00`

describe('invoiceAgeDays: the only place the basis lives (the invoice date)', () => {
  it('counts whole calendar days from the invoice date', () => {
    expect(invoiceAgeDays('2026-08-18T09:00:00', TODAY)).toBe(98)
    expect(invoiceAgeDays('2026-10-25', TODAY)).toBe(30)
  })
})

describe('which invoices count, which Bookings are checked', () => {
  it('counts only rows billed to the patient themself', () => {
    expect(countsTowardPatientBalance({ billedTo: { kind: 'patient', id: ME } }, ME)).toBe(true)
    for (const kind of ['hospital', 'insurer', 'organisation', 'billableParty', 'payer'] as const) {
      expect(countsTowardPatientBalance({ billedTo: { kind, id: 'X' } }, ME)).toBe(false)
    }
    expect(countsTowardPatientBalance({ billedTo: { kind: 'patient', id: 'PT0099' } }, ME)).toBe(false)
  })

  it('checks a Booking when any Procedure is paid by the patient, never for guardians only', () => {
    expect(checksPatientBalance([{ kind: 'patient' }])).toBe(true)
    expect(checksPatientBalance([{ kind: 'other' }, { kind: 'patient' }])).toBe(true)
    expect(checksPatientBalance([{ kind: 'other' }, { kind: 'other' }])).toBe(false)
    expect(checksPatientBalance([])).toBe(false)
  })
})

describe('patientBalanceSummary and patientBalanceStrength (D24)', () => {
  const strength = (rows: PatientBalanceRow[], threshold = 90) => patientBalanceStrength(patientBalanceSummary(rows, { patientId: ME, todayISO: TODAY, excludeBookingId: 'BK-NEW' }), threshold)

  it('98 days at 90 is strong; exactly 90 mild; 91 strong; 100 strong', () => {
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(98) })])).toBe('strong')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(90) })])).toBe('mild')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(91) })])).toBe('strong')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(100) })])).toBe('strong')
  })

  it('a 30-day only invoice is mild, and strong once the threshold is 20', () => {
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(30) })])).toBe('mild')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(30) })], 20)).toBe('strong')
  })

  it('a paid 200-day invoice raises none; part paid at 120 days is strong with its outstanding amount', () => {
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(200), outstanding: 0, status: 'paid' })])).toBe('none')
    const s = patientBalanceSummary([row({ invoiceId: 'a', raisedAtISO: daysAgo(120), total: 300, outstanding: 120, status: 'partPaid' })], { patientId: ME, todayISO: TODAY })
    expect(s.owingTotal).toBe(120)
    expect(patientBalanceStrength(s, 90)).toBe('strong')
  })

  it('hospital, organisation and named-payer rows raise none', () => {
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(98), billedTo: { kind: 'hospital', id: 'H-STG' } })])).toBe('none')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(76), billedTo: { kind: 'organisation', id: 'O-COS' } })])).toBe('none')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(76), billedTo: { kind: 'payer', id: 'BP0001' } })])).toBe('none')
  })

  it('a credited invoice owes nothing; the Booking being checked is excluded', () => {
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(98), outstanding: 0, status: 'credited' })])).toBe('none')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(98), bookingId: 'BK-NEW' })])).toBe('none')
  })

  it('credit alone is mild; a credit held for a named payer is not the patient\'s', () => {
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(50), outstanding: 0, status: 'credited', creditHeld: 260 })])).toBe('mild')
    expect(strength([row({ invoiceId: 'a', raisedAtISO: daysAgo(50), outstanding: 0, status: 'credited', creditHeld: 260, billedTo: { kind: 'payer', id: 'BP0001' } })])).toBe('none')
  })

  it('owing decides when both: oldest first, with each invoice\'s age', () => {
    const s = patientBalanceSummary(
      [row({ invoiceId: 'b', raisedAtISO: daysAgo(30) }), row({ invoiceId: 'a', raisedAtISO: daysAgo(98), outstanding: 610 }), row({ invoiceId: 'c', raisedAtISO: daysAgo(10), outstanding: 0, status: 'credited', creditHeld: 50 })],
      { patientId: ME, todayISO: TODAY },
    )
    expect(s.owing.map((o) => [o.invoiceId, o.ageDays])).toEqual([['a', 98], ['b', 30]])
    expect([s.owingTotal, s.oldestAgeDays, s.creditTotal]).toEqual([710, 98, 50])
    expect(patientBalanceStrength(s, 90)).toBe('strong')
  })

  it('same input gives deep-equal output', () => {
    const rows = [row({ invoiceId: 'a', raisedAtISO: daysAgo(98) })]
    expect(patientBalanceSummary(rows, { patientId: ME, todayISO: TODAY })).toEqual(patientBalanceSummary(rows, { patientId: ME, todayISO: TODAY }))
  })
})

describe('patientCentricBalance (US-13.2.2)', () => {
  it('counts the rows the warning ignores, nets held credit, the patient\'s own first', () => {
    const rows = [
      row({ invoiceId: 'h', raisedAtISO: daysAgo(98), billedTo: { kind: 'hospital', id: 'H-STG' }, outstanding: 400, billedToName: "St George's" }),
      row({ invoiceId: 'p', raisedAtISO: daysAgo(30), outstanding: 380 }),
      row({ invoiceId: 'c', raisedAtISO: daysAgo(40), outstanding: 0, status: 'credited', creditHeld: 100 }),
    ]
    const b = patientCentricBalance(rows, ME)
    expect(b.outstandingTotal).toBe(680)
    expect(b.billedToPatient).toEqual({ outstanding: 380, creditHeld: 100 })
    expect(b.byPayer.map((p) => [p.billedTo.kind, p.outstanding, p.creditHeld])).toEqual([['patient', 380, 100], ['hospital', 400, 0]])
  })

  it('reads in credit (negative) when credit held exceeds what is owed', () => {
    expect(patientCentricBalance([row({ invoiceId: 'c', raisedAtISO: daysAgo(40), outstanding: 0, status: 'credited', creditHeld: 260 })], ME).outstandingTotal).toBe(-260)
  })
})

describe('waitingNhiUrgency (our reading of "close": within 3 days or passed)', () => {
  it.each([
    [4, 'normal'],
    [3, 'urgent'],
    [1, 'urgent'],
    [0, 'urgent'],
    [-1, 'urgent'],
  ] as const)('%i days to go is %s', (days, expected) => {
    expect(waitingNhiUrgency(addDaysISO(TODAY, days), TODAY)).toBe(expected)
  })
})

describe('detailDifferences (the "details differ" prompt)', () => {
  const existing = { name: 'Sarah Mitchell', dobISO: '1988-08-16', phone: '021 555 3458', email: 's@example.net', postalAddress: { line1: '4 Beach Road', city: 'Christchurch', postcode: '8081' } }

  it('finds none for the same details, trimmed and case-insensitive, phone by digits', () => {
    expect(detailDifferences(existing, { name: '  sarah  MITCHELL ', phone: '0215553458', dobISO: '1988-08-16' })).toEqual([])
  })

  it('reports each differing field', () => {
    expect(detailDifferences(existing, { name: 'Sarah Brown' }).map((d) => d.field)).toEqual(['name'])
    expect(detailDifferences(existing, { dobISO: '1988-08-17' }).map((d) => d.field)).toEqual(['dobISO'])
    expect(detailDifferences(existing, { phone: '021 555 0000' }).map((d) => d.field)).toEqual(['phone'])
    expect(detailDifferences(existing, { email: 'other@example.net' }).map((d) => d.field)).toEqual(['email'])
    expect(detailDifferences(existing, { postalAddress: { line1: '9 Hill Street', city: 'Christchurch', postcode: '8011' } })).toEqual([
      { field: 'address', existing: '4 Beach Road, Christchurch 8081', incoming: '9 Hill Street, Christchurch 8011' },
    ])
  })

  it('a field the record lacks is enrichment, not a difference; one the incoming side lacks is ignored', () => {
    expect(detailDifferences({ name: 'A', dobISO: '1980-05-06' }, { name: 'A', phone: '021 1' })).toEqual([])
    expect(detailDifferences(existing, {})).toEqual([])
  })
})

describe('buildNhiIndex (one record per NHI)', () => {
  it('reports a duplicate instead of picking one', () => {
    const idx = buildNhiIndex([
      { hiddenInternalId: 'PT1', nhi: 'ZAA0067' },
      { hiddenInternalId: 'PT2', nhi: 'zaa 0067' },
      { hiddenInternalId: 'PT3', nhi: 'CQY9304' },
    ])
    expect(idx.duplicates).toEqual([{ nhi: 'ZAA0067', patientIds: ['PT1', 'PT2'] }])
    expect(idx.byNhi.get('CQY9304')?.hiddenInternalId).toBe('PT3')
  })
})

/**
 * Change sets (catch-up Phase 35): the snapshot diff a save applies, and the
 * history's grouping of audit entries by change set.
 */

import { describe, expect, it } from 'vitest'
import { changeSetsFor, diffSnapshots, sameValue, snapshotBooking, type BookingSnapshot } from './changeSets'
import { buildSeed } from './seed'
import type { AuditEntry, BillingLine, Procedure } from './types'

const seed = buildSeed()

/** A seeded Booking with a Procedure, and its snapshot. */
function seeded(): BookingSnapshot {
  const procedure = Object.values(seed.schedule.procedures).find((p) => p.isPrimary)!
  return snapshotBooking(seed, procedure.bookingId)!
}

function firstProcedure(s: BookingSnapshot): Procedure {
  return Object.values(s.procedures).find((p) => p.isPrimary)!
}

function withProcedure(s: BookingSnapshot, p: Procedure): BookingSnapshot {
  return { ...s, procedures: { ...s.procedures, [p.id]: p } }
}

describe('snapshotBooking', () => {
  it('takes the Booking, its Procedures, their billing lines and the patient', () => {
    const s = seeded()
    expect(Object.values(s.procedures).every((p) => p.bookingId === s.booking.id)).toBe(true)
    expect(s.patient?.hiddenInternalId).toBe(s.booking.patientId)
    expect(snapshotBooking(seed, 'NO-SUCH-BOOKING')).toBeUndefined()
  })
})

describe('diffSnapshots', () => {
  it('ignores the Booking stamps', () => {
    const s = seeded()
    const next = { ...s, booking: { ...s.booking, lastModifiedBy: 'Someone else', lastModifiedAtISO: '2030-01-01T00:00:00' } }
    expect(diffSnapshots(s, next)).toEqual([])
  })

  it('reports a Booking field change with before and after', () => {
    const s = seeded()
    const next = { ...s, booking: { ...s.booking, notes: 'Changed' } }
    expect(diffSnapshots(s, next)).toEqual([
      { entityType: 'booking', entityId: s.booking.id, field: 'notes', before: s.booking.notes, after: 'Changed', kind: 'update' },
    ])
  })

  it('counts a changed array as one change', () => {
    const s = seeded()
    const p = firstProcedure(s)
    const next = withProcedure(s, {
      ...p,
      modifierClaims: [
        { modifierId: 'MOD-A', explanation: 'one' },
        { modifierId: 'MOD-B', explanation: 'two' },
      ],
    })
    const changes = diffSnapshots(s, next)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ entityType: 'procedure', entityId: p.id, field: 'modifierClaims', kind: 'update' })
  })

  it('reports created and removed Procedures and billing lines whole, field *', () => {
    const s = seeded()
    const p = firstProcedure(s)
    const added: Procedure = { ...p, id: 'PR-NEW', isPrimary: false, modifierClaims: [], removedModifierIds: [] }
    const line: BillingLine = { id: 'BL-NEW', procedureId: p.id, chargeBasis: 'fixed', amount: 50, description: 'Extra' }
    const grown: BookingSnapshot = { ...withProcedure(s, added), billingLines: { ...s.billingLines, [line.id]: line } }

    const created = diffSnapshots(s, grown)
    expect(created).toEqual([
      { entityType: 'procedure', entityId: 'PR-NEW', field: '*', before: undefined, after: added, kind: 'create' },
      { entityType: 'billingLine', entityId: 'BL-NEW', field: '*', before: undefined, after: line, kind: 'create' },
    ])
    const removed = diffSnapshots(grown, s)
    expect(removed).toEqual([
      { entityType: 'procedure', entityId: 'PR-NEW', field: '*', before: added, after: undefined, kind: 'remove' },
      { entityType: 'billingLine', entityId: 'BL-NEW', field: '*', before: line, after: undefined, kind: 'remove' },
    ])
  })

  it('compares nested objects structurally: the same content in another key order is no change', () => {
    const s = seeded()
    const p = firstProcedure(s)
    const split = {
      shares: [
        { party: { kind: 'insurer' as const, id: 'I-NIB' }, basis: { kind: 'amount' as const, amountExGst: 100 } },
        { party: { kind: 'patient' as const, id: s.booking.patientId }, basis: { kind: 'rest' as const } },
      ],
    }
    const reordered = {
      shares: [
        { basis: { amountExGst: 100, kind: 'amount' as const }, party: { id: 'I-NIB', kind: 'insurer' as const } },
        { basis: { kind: 'rest' as const }, party: { id: s.booking.patientId, kind: 'patient' as const } },
      ],
    }
    const a = withProcedure(s, { ...p, split })
    const b = withProcedure(s, { ...p, split: reordered })
    expect(diffSnapshots(a, b)).toEqual([])

    const payer = JSON.parse(JSON.stringify(p.payer)) as Procedure['payer']
    const reversedPayer = Object.fromEntries(Object.entries(payer).reverse()) as Procedure['payer']
    expect(diffSnapshots(withProcedure(s, { ...p, payer }), withProcedure(s, { ...p, payer: reversedPayer }))).toEqual([])

    // A real change inside the split is one change of the whole field.
    const changed = withProcedure(s, { ...p, split: { shares: [split.shares[0]!, { ...split.shares[1]!, basis: { kind: 'percent', percent: 10 } }] } })
    expect(diffSnapshots(a, changed).map((c) => c.field)).toEqual(['split'])
  })

  it("marks a change to a Procedure's text as received as a rewrite", () => {
    const s = seeded()
    const p = firstProcedure(s)
    const next = withProcedure(s, {
      ...p,
      procedureText: { text: 'Something else', source: 'rooms' as never, receivedAtISO: '2026-07-21T09:00:00' },
    })
    const changes = diffSnapshots(s, next)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ entityType: 'procedure', entityId: p.id, field: 'procedureText', kind: 'rewrite' })
  })

  it('reports a patient change', () => {
    const s = seeded()
    const next = { ...s, patient: { ...s.patient!, phone: '021 000 0000' } }
    expect(diffSnapshots(s, next)).toMatchObject([{ entityType: 'patient', entityId: s.patient!.hiddenInternalId, field: 'phone', kind: 'update' }])
  })
})

describe('sameValue', () => {
  it('treats undefined keys as absent and arrays by position', () => {
    expect(sameValue({ a: 1, b: undefined }, { a: 1 })).toBe(true)
    expect(sameValue([1, 2], [2, 1])).toBe(false)
    expect(sameValue(null, {})).toBe(false)
    expect(sameValue([], {})).toBe(false)
  })
})

describe('changeSetsFor', () => {
  let n = 0
  function entry(entityId: string, extra: Partial<AuditEntry> = {}): AuditEntry {
    n++
    return {
      id: `A${String(n).padStart(4, '0')}`,
      entityType: 'booking',
      entityId,
      who: 'Kirsty W.',
      role: 'office',
      source: 'office',
      action: 'booking.update',
      atISO: '2026-07-21T10:00:00',
      ...extra,
    }
  }

  it('groups by change set, newest first by audit order (not time), ungrouped entries one per group, filtered by entity', () => {
    const e1 = entry('BK1', { atISO: '2026-07-21T11:00:00' })
    const e2 = entry('BK1', { changeSetId: 'CS0001', changeSetKind: 'save', action: 'booking.save' })
    const e3 = entry('PR1', { entityType: 'procedure', changeSetId: 'CS0001', action: 'procedure.update' })
    const other = entry('BK2', { changeSetId: 'CS0002', changeSetKind: 'save' })
    const e4 = entry('BK1', { atISO: '2026-07-21T09:00:00' })
    const e5 = entry('PR1', { entityType: 'procedure', changeSetId: 'CS0003', changeSetKind: 'cancel', atISO: '2026-07-21T08:00:00' })
    const e6 = entry('BK1', { changeSetId: 'CS0003', atISO: '2026-07-21T08:00:00' })

    const groups = changeSetsFor([e1, e2, e3, other, e4, e5, e6], new Set(['BK1', 'PR1']))
    expect(groups.map((g) => g.changeSetId)).toEqual(['CS0003', null, 'CS0001', null])
    expect(groups[0]).toMatchObject({ kind: 'cancel', header: e5, entries: [e5, e6] })
    expect(groups[1]).toMatchObject({ kind: null, header: e4, entries: [e4] })
    expect(groups[2]).toMatchObject({ kind: 'save', header: e2, entries: [e2, e3] })
    expect(groups[3]).toMatchObject({ kind: null, header: e1, entries: [e1] })
    expect(groups.some((g) => g.entries.includes(other))).toBe(false)
  })

  it('takes the kind from a later entry when the first one in view has none', () => {
    const a = entry('PR9', { entityType: 'procedure', changeSetId: 'CS0009' })
    const b = entry('BK9', { changeSetId: 'CS0009', changeSetKind: 'move' })
    expect(changeSetsFor([a, b], new Set(['PR9', 'BK9']))[0]).toMatchObject({ kind: 'move', entries: [a, b] })
  })
})

/**
 * The audit reading layer (A7 presentation). Pins the four things the Booking
 * history sheet and the admin Audit viewer are now trusted to get right:
 *
 *   - a patch key holding `undefined` reads as "not set", never as `{}`
 *     (the defect: `JSON.stringify` dropped the key entirely);
 *   - a run of stepper taps coalesces to ONE net statement, steps intact;
 *   - the order is newest first, and stays deterministic when every entry
 *     shares the pinned demo clock's timestamp;
 *   - every action code the store can emit has a human label.
 */

import { describe, expect, it } from 'vitest'
import type { AuditEntry } from '../../domain/types'
import { ACTION_LABELS, actionLabel } from './actionLabels'
import { fieldLabel } from './fieldLabels'
import {
  auditNamesFor,
  CLEARED_TO_SEED,
  NOT_SET,
  auditFieldChanges,
  coalesceAudit,
  formatAuditValue,
  sortAuditNewestFirst,
  summariseAuditChanges,
} from './auditNarrative'

const AT = '2026-07-21T08:00:00'

function entry(partial: Partial<AuditEntry> & Pick<AuditEntry, 'id'>): AuditEntry {
  return {
    entityType: 'procedure',
    entityId: 'P0012',
    who: 'Dr Melanie Souter',
    role: 'anaesthetist',
    source: 'anaesthetist',
    action: 'procedure.update',
    atISO: AT,
    ...partial,
  }
}

/** One stepper tap: `editProcedure`'s exact meta shape (lifecycle.ts). */
function tap(id: string, from: number | undefined, to: number): AuditEntry {
  return entry({
    id,
    before: { baseUnitsCaptured: from === undefined ? undefined : { units: from, source: 'overridden' } },
    after: { baseUnitsCaptured: { units: to, source: 'overridden' } },
  })
}

describe('auditFieldChanges', () => {
  it('renders a key that was never set as "not set", not as an empty object', () => {
    // The defect: `before` is `{ baseUnitsCaptured: undefined }` — a PRESENT key
    // with no value, which JSON.stringify erases.
    const changes = auditFieldChanges(tap('A0101', undefined, 4))
    expect(changes).toEqual([{ key: 'baseUnitsCaptured', label: 'Base units', before: NOT_SET, after: '4' }])
  })

  it('renders a cleared B/T/M capture as going back to the seeded value', () => {
    const changes = auditFieldChanges(
      entry({
        id: 'A0102',
        before: { baseUnitsCaptured: { units: 4, source: 'overridden' } },
        after: { baseUnitsCaptured: undefined },
      }),
    )
    expect(changes).toEqual([
      { key: 'baseUnitsCaptured', label: 'Base units', before: '4', after: CLEARED_TO_SEED },
    ])
  })

  it('clears a non-capture field to "not set" (only B/T/M reverts to a seeded value)', () => {
    const changes = auditFieldChanges(
      entry({ id: 'A0103', before: { opNotes: 'Seen in recovery' }, after: { opNotes: undefined } }),
    )
    expect(changes[0]?.after).toBe(NOT_SET)
  })

  it('diffs over the union of both sides, so an after-only key is not lost', () => {
    const changes = auditFieldChanges(
      entry({ id: 'A0104', before: { intNotes: 'Grade 2 view' }, after: { intNotes: 'Grade 3 view', insuranceApprovalNumber: 'NIB-AP-9' } }),
    )
    expect(changes.map((c) => c.key)).toEqual(['intNotes', 'insuranceApprovalNumber'])
    expect(changes[1]).toEqual({ key: 'insuranceApprovalNumber', label: 'Approval number', before: NOT_SET, after: 'NIB-AP-9' })
  })

  it('drops fields that were re-saved without moving', () => {
    const changes = auditFieldChanges(
      entry({
        id: 'A0105',
        before: { intNotes: 'Grade 2 view', removedModifierIds: ['OB3'] },
        after: { intNotes: 'Grade 2 view', removedModifierIds: ['OB3', 'P1'] },
      }),
    )
    expect(changes.map((c) => c.key)).toEqual(['removedModifierIds'])
    expect(changes[0]).toMatchObject({ before: 'OB3', after: 'OB3, P1' })
  })

  it('shows one side only when the entry records one side only', () => {
    const created = auditFieldChanges(
      entry({ id: 'A0106', action: 'booking.create', entityType: 'booking', entityId: 'BK0088', after: { patientId: 'PT0004' } }),
    )
    expect(created).toEqual([{ key: 'patientId', label: 'Patient id', after: 'PT0004' }])

    const removed = auditFieldChanges(
      entry({ id: 'A0107', action: 'procedure.remove', before: { bookingId: 'BK0088', description: 'Hip' } }),
    )
    expect(removed.every((c) => c.after === undefined)).toBe(true)
  })

  it('returns nothing for an entry that carries no payload', () => {
    expect(auditFieldChanges(entry({ id: 'A0108', action: 'xero.handoffNoop' }))).toEqual([])
  })
})

describe('a typed price change (catch-up Phase 24)', () => {
  const entry = (before: number | null, after: number | null): AuditEntry =>
    ({ id: 'A1', entityType: 'procedure', entityId: 'P1', action: 'procedure.price', who: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00', before: { enteredPrice: before }, after: { enteredPrice: after } }) as AuditEntry
  it('reads "Price changed", Price $450.00, and a clear as computed again', () => {
    expect(actionLabel('procedure.price')).toBe('Price changed')
    expect(auditFieldChanges(entry(null, 450))).toEqual([{ key: 'enteredPrice', label: 'Price', before: 'not set', after: '$450.00' }])
    expect(auditFieldChanges(entry(450, null))).toEqual([{ key: 'enteredPrice', label: 'Price', before: '$450.00', after: 'cleared, computed again' }])
  })
})

describe('the anaesthetist profile (catch-up Phase 26)', () => {
  it('reads a bank account as its name and the masked number, never the full number', () => {
    expect(formatAuditValue('bankAccount', { accountName: 'Melanie Souter', accountNumber: '99-0101-•••••21-00' })).toBe('Melanie Souter · 99-0101-•••••21-00')
    expect(formatAuditValue('bankAccount', { accountName: 'Melanie Souter', accountNumber: '99-0101-0034821-00' })).toBe('Melanie Souter · 99-0101-•••••21-00')
    expect(fieldLabel('bankAccount')).toBe('Bank account')
    expect(fieldLabel('hpiId')).toBe('HPI CPN')
    expect(formatAuditValue('unitValue', 27)).toBe('$27.00')
  })
})

describe('formatAuditValue', () => {
  it('never stringifies JSON for the shapes the store stores', () => {
    expect(formatAuditValue('baseUnitsCaptured', { units: 3, source: 'overridden' })).toBe('3')
    expect(formatAuditValue('removedModifierIds', ['OB3', 'P1', 'AI1'])).toBe('OB3, P1, AI1')
    expect(formatAuditValue('removedModifierIds', [])).toBe('none')
    // The one typed price (catch-up Phase 24): money, no reason.
    expect(formatAuditValue('enteredPrice', 450)).toBe('$450.00')
    // Catch-up Phase 27: a prepayment invoice's approval (the deposit detail is gone).
    expect(formatAuditValue('approval', { mode: 'approved', by: 'Kirsty W.', role: 'office', atISO: '2026-07-21T09:00:00' })).toBe('Approved by Kirsty W.')
    expect(formatAuditValue('approval', { mode: 'automatic', by: 'System', role: 'system', atISO: '2026-07-21T09:00:00' })).toBe('Sent with approval off')
    expect(formatAuditValue('counterparty', { kind: 'hospital', id: 'HH001' })).toBe('Hospital HH001')
    expect(formatAuditValue('approvalRequired', false)).toBe('off')
    expect(formatAuditValue('approvalRequired', true)).toBe('on')
    expect(formatAuditValue('completed', true)).toBe('yes')
    expect(formatAuditValue('total', 1234.5)).toBe('$1,234.50')
    expect(formatAuditValue('handoverISO', '2026-07-21T10:15:00')).toBe('21 Jul 10:15')
    expect(formatAuditValue('dateISO', '2026-07-21')).toBe('21 Jul 2026')
  })

  it('degrades an unrecognised object to labelled fields, never to braces', () => {
    const rendered = formatAuditValue('somethingNew', { unitValue: 22, active: true })
    expect(rendered).toBe('unit value $22.00 · active yes')
    expect(rendered).not.toContain('{')
  })
})

describe('sortAuditNewestFirst', () => {
  it('sorts on atISO, newest first', () => {
    const rows = [
      entry({ id: 'A0001', atISO: '2026-07-20T09:05:00' }),
      entry({ id: 'A0002', atISO: '2026-07-21T08:00:00' }),
      entry({ id: 'A0003', atISO: '2026-07-19T16:40:00' }),
    ]
    expect(sortAuditNewestFirst(rows).map((r) => r.id)).toEqual(['A0002', 'A0001', 'A0003'])
  })

  it('falls back to the sequential id when the pinned clock shares a timestamp', () => {
    // Every live entry in the demo carries 2026-07-21T08:00:00, so the id is
    // the only thing that preserves the order the taps happened in.
    const rows = [tap('A0041', 4, 3), tap('A0043', 2, 1), tap('A0042', 3, 2)]
    expect(sortAuditNewestFirst(rows).map((r) => r.id)).toEqual(['A0043', 'A0042', 'A0041'])
  })

  it('does not mutate its input', () => {
    const rows = [entry({ id: 'A0002' }), entry({ id: 'A0001' })]
    sortAuditNewestFirst(rows)
    expect(rows.map((r) => r.id)).toEqual(['A0002', 'A0001'])
  })
})

describe('coalesceAudit', () => {
  it('collapses a four-tap ratchet into one net 4 to 1, steps intact', () => {
    const groups = coalesceAudit([tap('A0041', 4, 3), tap('A0042', 3, 2), tap('A0043', 2, 1)])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.entry.id).toBe('A0043') // newest leads the row
    expect(groups[0]?.steps.map((s) => s.id)).toEqual(['A0043', 'A0042', 'A0041']) // newest first
    expect(groups[0]?.changes).toEqual([{ key: 'baseUnitsCaptured', label: 'Base units', before: '4', after: '1' }])
  })

  it('keeps the "not set" start of a run in the net statement', () => {
    const groups = coalesceAudit([tap('A0051', undefined, 4), tap('A0052', 4, 5)])
    expect(groups[0]?.changes[0]).toMatchObject({ before: NOT_SET, after: '5' })
  })

  it('never merges across a different field, actor, entity or timestamp', () => {
    const groups = coalesceAudit([
      tap('A0061', 4, 3),
      entry({ id: 'A0062', before: { intNotes: 'Grade 2 view' }, after: { intNotes: 'Grade 3 view' } }), // other field
      entry({ id: 'A0063', entityId: 'P0013', before: { baseUnitsCaptured: { units: 4, source: 'overridden' } }, after: { baseUnitsCaptured: { units: 3, source: 'overridden' } } }), // other procedure
      entry({ id: 'A0064', who: 'Kate Ngata', role: 'office', source: 'office', before: { baseUnitsCaptured: { units: 3, source: 'overridden' } }, after: { baseUnitsCaptured: { units: 2, source: 'overridden' } } }), // other actor
      { ...tap('A0065', 2, 1), atISO: '2026-07-21T09:30:00' }, // other time
    ])
    expect(groups).toHaveLength(5)
    expect(groups.every((g) => g.steps.length === 1)).toBe(true)
  })

  it('leaves multi-field patches alone (no single value to state a net for)', () => {
    const multi = entry({
      id: 'A0071',
      before: { intNotes: 'Grade 2 view', opNotes: undefined },
      after: { intNotes: 'Grade 3 view', opNotes: 'Seen in recovery' },
    })
    const groups = coalesceAudit([multi, { ...multi, id: 'A0072' }])
    expect(groups).toHaveLength(2)
    expect(groups[0]?.changes).toHaveLength(2)
  })

  it('sorts on the way in, so insertion order cannot leak through', () => {
    const groups = coalesceAudit([tap('A0082', 3, 2), tap('A0081', 4, 3)])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.changes[0]).toMatchObject({ before: '4', after: '2' })
  })
})

describe('summariseAuditChanges', () => {
  it('leads with the first field and counts the rest', () => {
    expect(summariseAuditChanges(auditFieldChanges(tap('A0091', 4, 1)))).toBe('Base units 4 → 1')
    const many = auditFieldChanges(
      entry({ id: 'A0092', after: { status: 'queued', feed: 'webPAS', event: 'SIU^S14' } }),
    )
    expect(summariseAuditChanges(many)).toBe('Status queued · +2 more')
  })

  it('is empty for an entry with no payload', () => {
    expect(summariseAuditChanges([])).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Label coverage — a source scan, so a new action code cannot ship unlabelled.
// ---------------------------------------------------------------------------

const STORE_SOURCES = import.meta.glob('../../store/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const SEED_SOURCES = import.meta.glob('../../domain/seed/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function emittedActionCodes(): string[] {
  const codes = new Set<string>()
  for (const [file, source] of Object.entries({ ...STORE_SOURCES, ...SEED_SOURCES })) {
    if (file.endsWith('.test.ts')) continue // fixtures may invent codes
    // `createAction:` is the invoice materialiser's argument (catch-up Phase 22), passed through to `action:`.
    for (const match of source.matchAll(/(?:\baction|createAction): '([^']+)'/g)) codes.add(match[1]!)
    // A materialiser argument picked by a ternary (catch-up Phase 27's prepayment approval): both codes.
    for (const match of source.matchAll(/createAction: [^,?\n]+\? '([^']+)' : '([^']+)'/g)) {
      codes.add(match[1]!)
      codes.add(match[2]!)
    }
  }
  return [...codes].sort()
}

describe('action labels', () => {
  it("finds the store's emitted action codes", () => {
    expect(emittedActionCodes().length).toBeGreaterThan(50)
  })

  it('labels every action code the store or seed can emit', () => {
    const unlabelled = emittedActionCodes().filter((code) => ACTION_LABELS[code] === undefined)
    expect(unlabelled, 'add these to ACTION_LABELS').toEqual([])
  })

  it('labels no code that nothing emits (the map stays honest)', () => {
    // Catch-up Phase 27 retired the office's raise (approve and send replaced it); its label still reads audit rows written before.
    const legacy = new Set(['invoice.raisePrePayment'])
    const emitted = new Set(emittedActionCodes())
    expect(Object.keys(ACTION_LABELS).filter((code) => !emitted.has(code) && !legacy.has(code))).toEqual([])
  })

  it('degrades an unmapped code to English instead of rendering a machine code', () => {
    expect(actionLabel('widget.frobbedTwice')).toBe('Widget frobbed twice')
    expect(actionLabel('procedure.update')).toBe('Procedure updated')
  })
})

describe('field labels', () => {
  it('sentence-cases an unmapped key and drops the ISO suffix', () => {
    expect(fieldLabel('somethingNewAtISO')).toBe('Something new at')
    expect(fieldLabel('baseUnitsCaptured')).toBe('Base units')
  })
})

describe('Booking source values (catch-up Phase 15)', () => {
  it('render as their labels, and an unrelated source passes through', () => {
    expect(formatAuditValue('source', 'admin')).toBe('Office entry')
    expect(formatAuditValue('source', 'surgeonPdf')).toBe('Surgeon PDF')
    expect(formatAuditValue('source', 'webhook')).toBe('webhook')
    expect(formatAuditValue('source', 'constructor')).toBe('constructor')
  })
})

describe('an RVG code in the audit (catch-up Phase 19)', () => {
  const names = auditNamesFor({ rvgGroups: { RG005: { code: 'H4', description: 'Complex procedures' } } })

  it('reads as its code and description, never the hidden id', () => {
    expect(formatAuditValue('rvgGroupId', 'RG005', names)).toBe('H4 · Complex procedures')
    expect(formatAuditValue('rvgGroupId', 'RGN999', names)).toBe('an RVG code no longer listed')
    expect(formatAuditValue('rvgGroupId', 'RG005')).toBe('an RVG code')
    expect(formatAuditValue('baseUnitsRange', { min: 10, max: 12 })).toBe('10 to 12')
    expect(fieldLabel('rvgGroupId')).toBe('RVG code')
  })

  it('a pick narrates from row to row', () => {
    const entry = { id: 'A1', atISO: '2026-07-21T08:00:00', who: 'x', role: 'office', source: 'office', entityType: 'procedure', entityId: 'P1', action: 'procedure.update', before: { rvgGroupId: undefined }, after: { rvgGroupId: 'RG005' } } as unknown as AuditEntry
    expect(auditFieldChanges(entry, names)).toEqual([{ key: 'rvgGroupId', label: 'RVG code', before: 'not set', after: 'H4 · Complex procedures' }])
  })
})

describe('a record the seed load made (catch-up Phase 42)', () => {
  it('reads "Loaded from spreadsheet, row 3" in place of the load id and row number', () => {
    const changes = auditFieldChanges(entry({ id: 'A9', action: 'hospital.create', after: { name: 'Rangiora Day Surgery', loadId: 'ML001', rowNumber: 3 } }))
    expect(changes[0]).toEqual({ key: 'loadedFrom', label: 'Source', after: 'Loaded from spreadsheet, row 3' })
    expect(changes.map((c) => c.key)).toEqual(['loadedFrom', 'name'])
  })
})

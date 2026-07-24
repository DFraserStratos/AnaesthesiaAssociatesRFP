/**
 * Phase 06 store guard tests — the four office actions and the day-notes slice:
 * editList (field edits through the edit-rights matrix), setBillingLineAllocation
 * (office-only + conservation), createBillableParty, addDayNote, plus the seeded
 * Tue-21 notes and the Wed-22 advisory-conflict fixup. Isolated non-persisted
 * stores seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, editList } from './lifecycle'
import { setBillingLineAllocation, setProcedureFunderAllocation } from './billingLineActions'
import { createBillableParty } from './billablePartyActions'
import { addDayNote, initialsFor } from './dayNoteActions'
import {
  auditForEntity,
  dayNotesFor,
  listsForDate,
  proceduresForCard,
  submittedListCount,
  submittedLists,
} from './selectors'
import type { Actor } from './mutate'
import type { BillingLine } from '../domain/types'
import { ANAE, SEED_MARKERS } from '../domain/seed'
import { DEMO_TODAY } from '../domain/clock'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const MORRISON: Actor = {
  who: 'Dr Kate Morrison',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.morrison,
}

const WED22 = '2026-07-22'

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
const SOUTER_AM = marker('designDayAmList')
const MORRISON_LIST = marker('submittedListMorrison')
const TWO_FUNDER_CARD = marker('twoFunderCard')

function twoFunderLines(api: BoundAppStore): { proc: string; withOverride: BillingLine; other: BillingLine } {
  const proc = proceduresForCard(api.getState(), TWO_FUNDER_CARD)[0]
  if (proc === undefined) throw new Error('two-funder card has no procedure')
  const lines = Object.values(api.getState().schedule.billingLines).filter((l) => l.procedureId === proc.id)
  const withOverride = lines.find((l) => l.funderOverride !== undefined)
  const other = lines.find((l) => l.funderOverride === undefined)
  if (withOverride === undefined || other === undefined) throw new Error('expected two funder lines')
  return { proc: proc.id, withOverride, other }
}

// ---------------------------------------------------------------------------
// editList
// ---------------------------------------------------------------------------

describe('editList', () => {
  it('office overrides a DRAFT list start/end times, audited list.update', () => {
    const api = store()
    const before = api.getState().schedule.lists[SOUTER_AM]
    expect(before?.state).toBe('DRAFT')
    const r = editList(api, OFFICE, SOUTER_AM, { startTime: '08:30', endTime: '14:15' })
    expect(r.ok).toBe(true)
    const after = api.getState().schedule.lists[SOUTER_AM]
    expect(after?.startTime).toBe('08:30')
    expect(after?.endTime).toBe('14:15')
    const audit = auditForEntity(api.getState(), SOUTER_AM).filter((a) => a.action === 'list.update')
    expect(audit.length).toBe(1)
  })

  it('office edits a SUBMITTED list (hospital/surgeon)', () => {
    const api = store()
    expect(api.getState().schedule.lists[MORRISON_LIST]?.state).toBe('SUBMITTED')
    const r = editList(api, OFFICE, MORRISON_LIST, { notes: 'Ran long, theatre 5' })
    expect(r.ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_LIST]?.notes).toBe('Ran long, theatre 5')
  })

  it('clears a field when the patch value is empty', () => {
    const api = store()
    editList(api, OFFICE, SOUTER_AM, { notes: 'temp' })
    editList(api, OFFICE, SOUTER_AM, { notes: '' })
    expect(api.getState().schedule.lists[SOUTER_AM]?.notes).toBeUndefined()
  })

  it('anaesthetist edits own DRAFT, but not a colleague list or a submitted one', () => {
    const api = store()
    expect(editList(api, SOUTER, SOUTER_AM, { notes: 'mine' }).ok).toBe(true)
    const notOwn = editList(api, SOUTER, MORRISON_LIST, { notes: 'nope' })
    expect(notOwn.ok).toBe(false)
    if (!notOwn.ok) expect(notOwn.code).toBe('notOwnList')
    const submitted = editList(api, MORRISON, MORRISON_LIST, { notes: 'nope' })
    expect(submitted.ok).toBe(false)
    if (!submitted.ok) expect(submitted.code).toBe('listSubmitted')
  })

  it('refuses on an AUTHORISED list', () => {
    const api = store()
    authoriseList(api, OFFICE, MORRISON_LIST)
    const r = editList(api, OFFICE, MORRISON_LIST, { notes: 'nope' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('listAuthorised')
  })
})

// ---------------------------------------------------------------------------
// setBillingLineAllocation
// ---------------------------------------------------------------------------

describe('setBillingLineAllocation', () => {
  it('office reassigns a line funder while conserving the fee, audited billingLine.update', () => {
    const api = store()
    const { other } = twoFunderLines(api)
    const r = setBillingLineAllocation(api, OFFICE, other.id, {
      funderOverride: { kind: 'patient', id: 'PT0001' },
    })
    expect(r.ok).toBe(true)
    const updated = api.getState().schedule.billingLines[other.id]
    expect(updated?.funderOverride).toEqual({ kind: 'patient', id: 'PT0001' })
    const audit = auditForEntity(api.getState(), other.id).filter((a) => a.action === 'billingLine.update')
    expect(audit.length).toBe(1)
  })

  it('refuses a non-conserving amount with allocationNotConserved', () => {
    const api = store()
    const { withOverride } = twoFunderLines(api)
    const r = setBillingLineAllocation(api, OFFICE, withOverride.id, { amount: 100 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('allocationNotConserved')
    // The refused edit did not persist.
    expect(api.getState().schedule.billingLines[withOverride.id]?.amount).toBe(withOverride.amount)
  })

  it('is office-only (the anaesthetist is refused even on their own list)', () => {
    const api = store()
    const { other } = twoFunderLines(api)
    const r = setBillingLineAllocation(api, SOUTER, other.id, {
      funderOverride: { kind: 'patient', id: 'PT0001' },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('funderAllocationOfficeOnly')
  })
})

describe('setProcedureFunderAllocation (atomic batch)', () => {
  it('applies a conserving two-line re-split in one commit', () => {
    const api = store()
    const { proc, withOverride, other } = twoFunderLines(api)
    const total = withOverride.amount + other.amount
    // Move some dollars between the two lines, total unchanged.
    const r = setProcedureFunderAllocation(api, OFFICE, proc, [
      { billingLineId: withOverride.id, amount: withOverride.amount + 20 },
      { billingLineId: other.id, amount: other.amount - 20 },
    ])
    expect(r.ok).toBe(true)
    const a = api.getState().schedule.billingLines[withOverride.id]
    const b = api.getState().schedule.billingLines[other.id]
    expect((a?.amount ?? 0) + (b?.amount ?? 0)).toBeCloseTo(total, 2)
    expect(a?.amount).toBeCloseTo(withOverride.amount + 20, 2)
    // Both changed lines audited.
    expect(auditForEntity(api.getState(), withOverride.id).some((x) => x.action === 'billingLine.update')).toBe(true)
    expect(auditForEntity(api.getState(), other.id).some((x) => x.action === 'billingLine.update')).toBe(true)
  })

  it('refuses a non-conserving batch and persists nothing', () => {
    const api = store()
    const { proc, withOverride, other } = twoFunderLines(api)
    const r = setProcedureFunderAllocation(api, OFFICE, proc, [
      { billingLineId: withOverride.id, amount: withOverride.amount + 20 },
    ])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('allocationNotConserved')
    expect(api.getState().schedule.billingLines[withOverride.id]?.amount).toBe(withOverride.amount)
    expect(api.getState().schedule.billingLines[other.id]?.amount).toBe(other.amount)
  })

  it('is office-only', () => {
    const api = store()
    const { proc, withOverride } = twoFunderLines(api)
    const r = setProcedureFunderAllocation(api, SOUTER, proc, [{ billingLineId: withOverride.id, amount: 100 }])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('funderAllocationOfficeOnly')
  })
})

// ---------------------------------------------------------------------------
// createBillableParty
// ---------------------------------------------------------------------------

describe('createBillableParty', () => {
  it('allocates a BP id, writes the master row and audits the create', () => {
    const api = store()
    const before = Object.keys(api.getState().masters.billableParties).length
    const r = createBillableParty(api, OFFICE, {
      name: 'Jane Prentice',
      relationshipToPatient: 'Mother',
      phone: '021 555 0101',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const id = r.value.billablePartyId
    expect(id).toMatch(/^BP\d{4}$/)
    const party = api.getState().masters.billableParties[id]
    expect(party?.name).toBe('Jane Prentice')
    expect(party?.relationshipToPatient).toBe('Mother')
    expect(Object.keys(api.getState().masters.billableParties).length).toBe(before + 1)
    expect(auditForEntity(api.getState(), id).some((a) => a.action === 'billableParty.create')).toBe(true)
  })

  it('requires a name and a relationship', () => {
    const api = store()
    expect(createBillableParty(api, OFFICE, { name: '', relationshipToPatient: 'Mother' }).ok).toBe(false)
    expect(createBillableParty(api, OFFICE, { name: 'X', relationshipToPatient: '' }).ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// addDayNote + day-notes seed
// ---------------------------------------------------------------------------

describe('addDayNote', () => {
  it('appends a note to the date, derives initials, audits dayNote.add', () => {
    const api = store()
    const before = dayNotesFor(api.getState(), DEMO_TODAY).length
    const r = addDayNote(api, OFFICE, DEMO_TODAY, 'Dr Hughes to cover St Georges PM.', true)
    expect(r.ok).toBe(true)
    const notes = dayNotesFor(api.getState(), DEMO_TODAY)
    expect(notes.length).toBe(before + 1)
    const added = notes[notes.length - 1]
    expect(added?.initials).toBe('KW')
    expect(added?.flagged).toBe(true)
    expect(added?.by).toBe('Kirsty W.')
    if (r.ok) {
      expect(auditForEntity(api.getState(), r.value.dayNoteId).some((a) => a.action === 'dayNote.add')).toBe(true)
    }
  })

  it('rejects an empty note and persists notes on a fresh date', () => {
    const api = store()
    expect(addDayNote(api, OFFICE, DEMO_TODAY, '   ').ok).toBe(false)
    expect(dayNotesFor(api.getState(), '2026-08-15').length).toBe(0)
    addDayNote(api, OFFICE, '2026-08-15', 'Public holiday, skeleton roster.')
    expect(dayNotesFor(api.getState(), '2026-08-15').length).toBe(1)
  })

  it('initialsFor handles single and multi word names', () => {
    expect(initialsFor('Kirsty W.')).toBe('KW')
    expect(initialsFor('Dr Melanie Souter')).toBe('DMS')
    expect(initialsFor('')).toBe('?')
  })
})

describe('seeded day notes', () => {
  it('seeds the three Tue-21 notes, one flagged', () => {
    const api = store()
    const notes = dayNotesFor(api.getState(), DEMO_TODAY)
    expect(notes.length).toBe(3)
    expect(notes.map((n) => n.initials)).toEqual(['KW', 'RT', 'KW'])
    expect(notes.filter((n) => n.flagged).length).toBe(1)
    expect(notes[2]?.flagged).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Wed-22 advisory conflict fixup + submitted-list selectors
// ---------------------------------------------------------------------------

describe('Wed-22 advisory conflicts', () => {
  it('seeds one holiday and one availability conflict on Wed 22, leaving Tue 21 pristine', () => {
    const api = store()
    const wed = listsForDate(api.getState(), WED22)
    const kinds = wed.flatMap((l) => l.conflicts.map((c) => c.kind))
    expect(kinds).toContain('holiday')
    expect(kinds).toContain('availability')
    const tue = listsForDate(api.getState(), DEMO_TODAY)
    expect(tue.every((l) => l.conflicts.length === 0)).toBe(true)
  })
})

describe('submitted-list selectors', () => {
  it('counts the seeded SUBMITTED lists (the derived review badge)', () => {
    const api = store()
    // Morrison + Whitaker (Phase 02) + the Phase-09 billing-failure exemplar +
    // the Phase-11 locked-target list (Delaney Fri 17).
    expect(submittedListCount(api.getState())).toBe(4)
    expect(submittedLists(api.getState()).every((l) => l.state === 'SUBMITTED')).toBe(true)
  })
})

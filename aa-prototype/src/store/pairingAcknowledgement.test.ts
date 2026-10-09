/**
 * The acknowledgement on the store's office write paths (catch-up Phase 17;
 * US-01.3.5 "Still selectable", US-13.6.3 "Warns admin, never blocks"): a
 * not-preferred pairing is never refused; going ahead writes one
 * `*.pairingAcknowledged` entry in the same commit, only when the pairing
 * changed, and never for an anaesthetist's own write (US-01.4.5).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { editList, reassignList } from './lifecycle'
import { addPermanentList, editPermanentList } from './mastersActions'
import { addPairingPreference, endPairingPreference } from './officePrivate'
import { ANAE, SURG, listIdForSlot } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
const SHARMA_AM = listIdForSlot(ANAE.sharma, '2026-07-21', 'AM')
const CHEN_PM = listIdForSlot(ANAE.chen, '2026-07-21', 'PM')
const RUTHERFORD_WED = listIdForSlot(ANAE.rutherford, '2026-07-22', 'AM')

function acks(api: ReturnType<typeof createAppStore>) {
  return api.getState().audit.filter((a) => a.action.endsWith('.pairingAcknowledged'))
}

describe('editList', () => {
  it('an office surgeon change to a not-preferred pairing saves with exactly one acknowledgement', () => {
    const api = createAppStore()
    const out = editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.reid })
    expect(out.ok).toBe(true)
    expect(api.getState().schedule.lists[SHARMA_AM]?.surgeonId).toBe(SURG.reid)
    expect(acks(api)).toHaveLength(1)
    expect(acks(api)[0]).toMatchObject({
      action: 'list.pairingAcknowledged',
      entityType: 'list',
      entityId: SHARMA_AM,
      after: { anaesthetistId: ANAE.sharma, surgeonId: SURG.reid, pairingPreferenceIds: ['PP-001'] },
    })
    // Same commit as the update.
    const [update, ack] = api.getState().audit.slice(-2)
    expect(update?.action).toBe('list.update')
    expect(ack?.atISO).toBe(update?.atISO)
  })

  it('the same save again, or a notes-only edit, writes no second acknowledgement', () => {
    const api = createAppStore()
    editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.reid })
    editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.reid, notes: 'Bring the phaco' })
    editList(api, OFFICE, SHARMA_AM, { notes: 'Changed' })
    expect(acks(api)).toHaveLength(1)
  })

  it('both sides active: one acknowledgement naming both entries', () => {
    const api = createAppStore()
    addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'ANAESTHETIST', anaesthetistId: ANAE.sharma, surgeonId: SURG.reid })
    editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.reid })
    expect(acks(api)).toHaveLength(1)
    expect((acks(api)[0]?.after as { pairingPreferenceIds: string[] }).pairingPreferenceIds).toEqual(['PP-001', 'PPN001'])
  })

  it('an anaesthetist-side entry acknowledges like a surgeon-side one', () => {
    const api = createAppStore()
    addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'ANAESTHETIST', anaesthetistId: ANAE.sharma, surgeonId: SURG.tan })
    editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.tan })
    expect(acks(api)).toHaveLength(1)
  })

  it('an ended entry and a preferred entry write none', () => {
    const api = createAppStore()
    endPairingPreference(api, OFFICE, 'PP-001')
    editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.reid })
    editList(api, OFFICE, SHARMA_AM, { surgeonId: SURG.whitford })
    expect(acks(api)).toHaveLength(0)
  })

  it("an anaesthetist's own edit to a not-preferred surgeon succeeds and writes none", () => {
    const api = createAppStore()
    const out = editList(api, SHARMA, SHARMA_AM, { surgeonId: SURG.reid })
    expect(out.ok).toBe(true)
    expect(acks(api)).toHaveLength(0)
  })
})

describe('reassignList', () => {
  it('onto a not-preferred anaesthetist succeeds with one acknowledgement', () => {
    const api = createAppStore()
    const out = reassignList(api, OFFICE, CHEN_PM, ANAE.sharma)
    expect(out.ok).toBe(true)
    expect(acks(api)).toHaveLength(1)
    expect(acks(api)[0]).toMatchObject({ entityId: CHEN_PM, after: { anaesthetistId: ANAE.sharma, surgeonId: SURG.reid } })
  })

  it('onto a clear or preferred anaesthetist writes none', () => {
    const api = createAppStore()
    expect(reassignList(api, OFFICE, CHEN_PM, ANAE.hughes).ok).toBe(true)
    expect(reassignList(api, OFFICE, RUTHERFORD_WED, ANAE.sharma).ok).toBe(true)
    expect(acks(api)).toHaveLength(0)
  })
})

describe('Permanent Lists', () => {
  it('adding one with a not-preferred usual surgeon acknowledges; editing only when the pairing changes', () => {
    const api = createAppStore()
    const added = addPermanentList(api, OFFICE, { anaesthetistId: ANAE.sharma, dayOfWeek: 5, session: 'PM', statusKey: 'private', hospitalId: null, surgeonId: SURG.reid })
    expect(added.ok).toBe(true)
    expect(acks(api).map((a) => a.action)).toEqual(['permanentList.pairingAcknowledged'])
    const id = added.ok ? added.value.id : ''
    editPermanentList(api, OFFICE, id, { notes: 'Fridays' })
    expect(acks(api)).toHaveLength(1)
    editPermanentList(api, OFFICE, id, { surgeonId: SURG.hale })
    editPermanentList(api, OFFICE, id, { surgeonId: SURG.reid })
    expect(acks(api)).toHaveLength(2)
    const clear = addPermanentList(api, OFFICE, { anaesthetistId: ANAE.sharma, dayOfWeek: 5, session: 'AM', statusKey: 'private', hospitalId: null, surgeonId: SURG.whitford })
    expect(clear.ok).toBe(true)
    expect(acks(api)).toHaveLength(2)
  })
})

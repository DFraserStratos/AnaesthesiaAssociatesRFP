/**
 * Contact archiving job tests (Phase 10; WI5, X3).
 *
 * Organisational contacts (hospital payers + anaesthetist payees) are NEVER
 * archived; a fully-paid, inactive individual (patient / billableParty) contact
 * archives (the seeded, fully-paid pre-payment patient nair is the exemplar); a
 * not-fully-paid contact never archives; and changing the window changes
 * next-run eligibility (proving the window is a setting, not hardcoded).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { runArchiveJob, eligibleArchiveContactIds } from './archiveActions'
import { setArchiveWindowDays } from './demoSettingsActions'
import { advanceClockDays } from './clockActions'
import type { Actor } from './mutate'
import { SEED_MARKERS, PAT, BP } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
/** The Xero contactId for a contact keyed by its ContactNumber. */
function contactIdByNumber(api: BoundAppStore, contactNumber: string): string | undefined {
  return Object.values(api.getState().xero.contacts).find((c) => c.contactNumber === contactNumber)?.contactId
}

describe('contact archive job', () => {
  it('never archives organisational contacts, but archives a fully-paid inactive individual', () => {
    const api = store()
    // The seeded fully-paid pre-payment patient (nair) is recent; nothing is
    // eligible yet. Advance well past the 90-day window.
    expect(eligibleArchiveContactIds(api.getState())).toHaveLength(0)
    advanceClockDays(api, 120)

    const nairContactId = contactIdByNumber(api, PAT.nair)
    expect(nairContactId).toBeDefined()
    const eligible = eligibleArchiveContactIds(api.getState())
    expect(eligible).toContain(nairContactId)

    const activeBefore = api.getState().settings.volumeStory.activeContacts
    const res = runArchiveJob(api)
    expect(res.ok && res.value.count > 0).toBe(true)

    // No organisation contact was archived; nair (a patient) was.
    for (const c of Object.values(api.getState().xero.contacts)) {
      if (c.type === 'organisation') expect(c.archived).toBe(false)
    }
    expect(api.getState().xero.contacts[nairContactId!]!.archived).toBe(true)
    // The active-contact counter dropped by exactly what was archived.
    expect(api.getState().settings.volumeStory.activeContacts).toBe(activeBefore - (res.ok ? res.value.count : 0))
  })

  it('archives a fully-paid, inactive billableParty contact (not only patients)', () => {
    const api = store()
    advanceClockDays(api, 120)
    const guardianContactId = contactIdByNumber(api, BP.guardian)
    expect(guardianContactId).toBeDefined()
    expect(api.getState().xero.contacts[guardianContactId!]!.type).toBe('billableParty')
    expect(eligibleArchiveContactIds(api.getState())).toContain(guardianContactId)

    expect(runArchiveJob(api).ok).toBe(true)
    expect(api.getState().xero.contacts[guardianContactId!]!.archived).toBe(true)
  })

  it('does not archive a not-fully-paid individual contact (and unarchives a returning one)', () => {
    const api = store()
    // Riley's patient contact ships ARCHIVED (a past paid self-funded episode).
    // Raising her live pre-payment pre-invoice unarchives it (returning contact)
    // but leaves it unpaid, so it never archives while a balance is outstanding.
    const rileyContactBefore = contactIdByNumber(api, PAT.riley)
    expect(rileyContactBefore).toBeDefined()
    expect(api.getState().xero.contacts[rileyContactBefore!]!.archived).toBe(true)

    expect(raisePreProcedureInvoice(api, OFFICE, marker('prepaymentCard')).ok).toBe(true)
    expect(api.getState().xero.contacts[rileyContactBefore!]!.archived).toBe(false)

    advanceClockDays(api, 400)
    // Riley now has an unpaid ACCREC → never eligible.
    expect(eligibleArchiveContactIds(api.getState())).not.toContain(rileyContactBefore)
  })

  it('changing the window changes next-run eligibility (not hardcoded)', () => {
    const api = store()
    advanceClockDays(api, 100) // nair inactive ~107 days
    const nairContactId = contactIdByNumber(api, PAT.nair)!

    // Default window 90 → nair eligible at ~107 days.
    expect(eligibleArchiveContactIds(api.getState())).toContain(nairContactId)
    // Widen to 150 → no longer eligible.
    expect(setArchiveWindowDays(api, OFFICE, 150).ok).toBe(true)
    expect(eligibleArchiveContactIds(api.getState())).not.toContain(nairContactId)
    // Narrow to 50 → eligible again.
    expect(setArchiveWindowDays(api, OFFICE, 50).ok).toBe(true)
    expect(eligibleArchiveContactIds(api.getState())).toContain(nairContactId)
  })
})

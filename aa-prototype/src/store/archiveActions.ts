/**
 * Contact archiving job (Phase 10; WI5, X3, D-controls) — the RFP's nightly
 * archive of individual Xero contacts (Patient AND Billable Party; 4th review
 * #5) once fully paid and inactive for at least the configurable window
 * (seeded 90 days, NOT hardcoded). ORGANISATION contacts are exempt (they
 * persist). Each run decrements the narrated `volumeStory.activeContacts`.
 *
 * A SCHEDULED system job (D-controls): auto-runs on `dayAdvanced` and via a
 * manual "run nightly archive job now" trigger labelled as the scheduled job
 * (not a demo simulation). Audited `source:'system'` (`xero.contactArchived`).
 */

import { toCents } from '../domain/billing/money'
import { epochDayOf } from '../domain/dateDays'
import { mutate, ok, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { onAppEvent } from './events'

const ARCHIVE_ACTOR: Actor = { who: 'Contact archive job', role: 'system', source: 'system' }

export interface ArchiveJobResult {
  archivedContactIds: string[]
  count: number
}

/**
 * The individual (patient / billableParty) contacts eligible to archive right
 * now: not already archived, every ACCREC billed TO them fully paid, and their
 * last activity (latest invoice raise or payment) at least `window` days ago.
 * Pure — the UI preview and the job share it.
 */
export function eligibleArchiveContactIds(state: Pick<AppState, 'xero' | 'billing' | 'settings' | 'clock'>): string[] {
  const window = state.settings.contactArchiveInactivityDays
  const todayDay = epochDayOf(state.clock.todayISO)
  const eligible: string[] = []

  for (const contact of Object.values(state.xero.contacts)) {
    if (contact.archived) continue
    if (contact.type === 'organisation') continue // organisational contacts never archive

    const accRecs = Object.values(state.xero.accRecs).filter((r) => r.contactId === contact.contactId)
    if (accRecs.length === 0) continue // no billing history — leave it be
    const fullyPaid = accRecs.every((r) => toCents(r.amountReceived) >= toCents(r.amountDue))
    if (!fullyPaid) continue

    // Last activity = latest invoice raise / payment across this contact's ACCRECs.
    let lastActivityDay = -Infinity
    for (const r of accRecs) {
      const invoice = state.billing.invoices[r.invoiceId]
      if (invoice?.raisedAtISO !== undefined) lastActivityDay = Math.max(lastActivityDay, epochDayOf(invoice.raisedAtISO))
      for (const p of Object.values(state.xero.payments)) {
        if (p.accRecId === r.id) lastActivityDay = Math.max(lastActivityDay, epochDayOf(p.atISO))
      }
    }
    if (lastActivityDay === -Infinity) continue
    if (todayDay - lastActivityDay >= window) eligible.push(contact.contactId)
  }
  return eligible.sort((a, b) => a.localeCompare(b))
}

/**
 * Run the nightly archive job. Archives every eligible individual contact,
 * decrements the active-contact counter, and audits each archival. A no-op
 * (no mutation) when nothing is eligible.
 */
export function runArchiveJob(api: AppStoreApi): Outcome<ArchiveJobResult> {
  const eligible = eligibleArchiveContactIds(api.getState())
  if (eligible.length === 0) return ok({ archivedContactIds: [], count: 0 })

  const metas: MutationMeta[] = eligible.map((contactId) => ({
    entityType: 'xeroContact',
    entityId: contactId,
    action: 'xero.contactArchived',
    after: { archived: true },
  }))

  mutate(api, ARCHIVE_ACTOR, metas, (s) => {
    const contacts = { ...s.xero.contacts }
    for (const id of eligible) {
      const c = contacts[id]
      if (c !== undefined) contacts[id] = { ...c, archived: true }
    }
    const activeContacts = Math.max(0, s.settings.volumeStory.activeContacts - eligible.length)
    return {
      xero: { ...s.xero, contacts },
      settings: { ...s.settings, volumeStory: { ...s.settings.volumeStory, activeContacts } },
    }
  })

  return ok({ archivedContactIds: eligible, count: eligible.length })
}

/**
 * Subscribe the nightly archive job to `dayAdvanced` for one store. Wired after
 * the reconciliation poll so a payment the poll catches can make a contact
 * fully-paid before the same night's archive considers it.
 */
export function wireArchiveJob(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type === 'dayAdvanced') runArchiveJob(api)
  })
}

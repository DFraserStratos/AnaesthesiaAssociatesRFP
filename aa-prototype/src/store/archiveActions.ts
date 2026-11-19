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

import { eligibleArchiveContactIdsOf } from '../domain/billing/contactArchive'
import { mutate, ok, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { onAppEvent } from './events'
import { xeroAvailable } from './xeroGate'

const ARCHIVE_ACTOR: Actor = { who: 'Contact archive job', role: 'system', source: 'system' }

export interface ArchiveJobResult {
  archivedContactIds: string[]
  count: number
  /** Set when the job skipped because Xero was unavailable (catch-up Phase 37). */
  skippedReason?: string
}

/** The archive job's skip during an outage: it archives in Xero, so it waits for the next night (catch-up Phase 37). */
export const ARCHIVE_SKIPPED_OUTAGE = 'Xero unavailable; the next nightly run catches up'

/**
 * The individual (patient / billableParty) contacts eligible to archive right
 * now: not already archived, every ACCREC billed TO them fully paid, and their
 * last activity (latest invoice raise or payment) at least `window` days ago.
 * Pure — the UI preview and the job share it.
 */
export function eligibleArchiveContactIds(state: Pick<AppState, 'xero' | 'billing' | 'settings' | 'clock'>): string[] {
  // The one rule, linear (catch-up Phase 43: `domain/billing/contactArchive.ts`).
  return eligibleArchiveContactIdsOf({
    contacts: state.xero.contacts,
    accRecs: state.xero.accRecs,
    payments: state.xero.payments,
    invoices: state.billing.invoices,
    todayISO: state.clock.todayISO,
    windowDays: state.settings.contactArchiveInactivityDays,
  })
}

/**
 * Run the nightly archive job. Archives every eligible individual contact,
 * decrements the active-contact counter, and audits each archival. A no-op
 * (no mutation) when nothing is eligible.
 */
export function runArchiveJob(api: AppStoreApi): Outcome<ArchiveJobResult> {
  if (!xeroAvailable(api.getState())) return ok({ archivedContactIds: [], count: 0, skippedReason: ARCHIVE_SKIPPED_OUTAGE })
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

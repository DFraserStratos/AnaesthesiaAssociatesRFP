/**
 * Demo-settings mutations (Phase 10) — the archive-window master-data config
 * and the badged handoff-fault arming switch. Both audited through `mutate`
 * (the only permitted slice writer); `settings` is a DomainPatch member.
 */

import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

/**
 * Set the contact-archive inactivity window (RFP: a configurable setting seeded
 * at the illustrative 90 days, NOT a hardcoded rule; 2nd review #11). Office
 * master-data config. Changing it changes next-run archive eligibility.
 */
export function setArchiveWindowDays(api: AppStoreApi, actor: Actor, days: number): Outcome {
  if (!Number.isFinite(days) || days < 0) {
    return refuse('invalidWindow', 'The archive window must be a non-negative number of days.')
  }
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can change the archive window.')
  }
  const rounded = Math.round(days)
  mutate(
    api,
    actor,
    {
      entityType: 'settings',
      entityId: 'demo',
      action: 'settings.archiveWindow',
      before: { days: api.getState().settings.contactArchiveInactivityDays },
      after: { days: rounded },
    },
    (s) => ({ settings: { ...s.settings, contactArchiveInactivityDays: rounded } }),
  )
  return ok(undefined)
}

/**
 * Arm the NEXT Xero handoff to fault (badged demo-only trigger; D-handoff). The
 * handoff records a `handoffFailure`, clears this flag and creates no pair.
 */
export function armHandoffFault(api: AppStoreApi, actor: Actor): Outcome {
  mutate(
    api,
    actor,
    {
      entityType: 'settings',
      entityId: 'demo',
      action: 'settings.armHandoffFault',
      after: { failNextHandoff: true, atISO: clockISO(api.getState().clock) },
    },
    (s) => ({ settings: { ...s.settings, failNextHandoff: true } }),
  )
  return ok(undefined)
}

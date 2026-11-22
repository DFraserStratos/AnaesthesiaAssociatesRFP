/**
 * Demo-settings mutations (Phase 10) — the archive-window master-data config
 * and the badged handoff-fault arming switch. Both audited through `mutate`
 * (the only permitted slice writer); `settings` is a DomainPatch member.
 */

import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { NHI_HUB_MODES, type NhiHubMode } from '../domain/types'

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
 * Arm the NEXT Xero hand-off to fault once (badged demo-only trigger; D-handoff,
 * re-based in catch-up Phase 37): the gate queues it as one failed attempt, which
 * the Xero sync queue retries after its backoff, and clears this flag.
 * With `bookingId` the fault waits for that Booking's hand-off (catch-up Phase
 * 25's staged billing failure), so the List's other Bookings hand off.
 */
export function armHandoffFault(api: AppStoreApi, actor: Actor, opts: { bookingId?: string } = {}): Outcome {
  mutate(
    api,
    actor,
    {
      entityType: 'settings',
      entityId: 'demo',
      action: 'settings.armHandoffFault',
      after: { failNextHandoff: true, ...(opts.bookingId !== undefined ? { bookingId: opts.bookingId } : {}), atISO: clockISO(api.getState().clock) },
    },
    (s) => {
      const { failHandoffBookingId: _previous, ...rest } = s.settings
      return { settings: { ...rest, failNextHandoff: true, ...(opts.bookingId !== undefined ? { failHandoffBookingId: opts.bookingId } : {}) } }
    },
  )
  return ok(undefined)
}

/**
 * Set how the simulated Digital Services Hub answers NHI lookups (catch-up
 * Phase 40a): demo scaffolding in `settings`, never AA configuration.
 * Absent reads as `available`, and Reset clears it. Refuses an unknown mode;
 * setting the current mode again writes nothing.
 */
export function setNhiHubMode(api: AppStoreApi, actor: Actor, mode: NhiHubMode): Outcome {
  if (!NHI_HUB_MODES.includes(mode)) return refuse('unknownMode', 'The Hub is Available, Slow or Unavailable.')
  const before = api.getState().settings.nhiHubMode ?? 'available'
  if (before === mode) return ok(undefined)
  mutate(
    api,
    actor,
    { entityType: 'settings', entityId: 'demo', action: 'settings.nhiHubMode', before: { nhiHubMode: before }, after: { nhiHubMode: mode } },
    (s) => {
      const { nhiHubMode: _previous, ...rest } = s.settings
      return { settings: mode === 'available' ? rest : { ...rest, nhiHubMode: mode } }
    },
  )
  return ok(undefined)
}

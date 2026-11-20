/**
 * The demo's named actors, in one place (catch-up Phase 14). The demo
 * triggers, the Control Panel's scenario jumps, the Xero simulation, the Admin
 * app and the PWA's office simulation all act as one of these, so the audit
 * trail names the same person (or the same plainly simulated office) whichever
 * surface fired the action.
 */

import { ANAE } from '../domain/seed'
import type { Actor } from './mutate'
import type { AppState } from './appStore'

/** The office persona, Kirsty W., exactly as the Admin Web App acts. */
export const OFFICE_ACTOR: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/**
 * The second named office user (catch-up Phase 35; US-02.5.8): a seeded
 * name, so one Booking's history can name two office users. A demo stand-in
 * for each user signing in as themselves (US-13.5.1, not built).
 */
export const SECOND_OFFICE_ACTOR: Actor = { who: 'Sam T.', role: 'office', source: 'office' }

/**
 * The developer's one-off seed load (catch-up Phase 42; US-13.4.3): office
 * shaped, so a loaded row passes exactly the guards a hand-made one does, and
 * named so nobody reads it as a person. The Seed load and Go-live load views
 * and their demo triggers act as it; the office never loads master data.
 */
export const SEED_LOAD_ACTOR: Actor = { who: 'Developer seed load (simulated)', role: 'office', source: 'office' }

export type OfficeUserId = 'kirsty' | 'sam'

/** The office users the harness bar's Switch office user toggles between. */
export const OFFICE_USERS: Readonly<Record<OfficeUserId, Actor>> = { kirsty: OFFICE_ACTOR, sam: SECOND_OFFICE_ACTOR }

/** The office actor the Admin app acts as now (Kirsty W. unless switched). */
export function officeActorOf(shell: Pick<AppState['shell'], 'officeUser'>): Actor {
  return OFFICE_USERS[shell.officeUser ?? 'kirsty']
}

/** The other office user, for the switch. */
export function otherOfficeUser(shell: Pick<AppState['shell'], 'officeUser'>): OfficeUserId {
  return (shell.officeUser ?? 'kirsty') === 'kirsty' ? 'sam' : 'kirsty'
}

/** The anaesthetist persona, Dr Melanie Souter, as the mobile and web apps act. */
export const SOUTER_ACTOR: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}

/**
 * The office, simulated. Office-shaped exactly as the Admin Web App builds its
 * actor (`role: 'office'`, `source: 'office'`) because this performs a genuine
 * office action and must pass the same `officeOnly` guards, but the `who` says
 * plainly what it is: nobody reading the audit log in a workshop should come
 * away thinking a real person authorised this List.
 */
export const OFFICE_SIMULATION_ACTOR: Actor = { who: 'AA office (simulated)', role: 'office', source: 'office' }

/**
 * The demo actions themselves (catch-up Phase 15a): stages scenario data such
 * as the sample warnings, so the audit never shows the office (or anyone) doing
 * the staging. A system actor edits assigned and SUBMITTED Lists; an AUTHORISED
 * List refuses it, which is the triggers' disabled state.
 */
export const DEMO_TRIGGER_ACTOR: Actor = { who: 'Demo actions', role: 'system', source: 'demo' }

/**
 * The office as a demo trigger acts it (catch-up Phase 23): office rights,
 * audited with source `demo`, so a staged Booking reads as staged.
 */
export const DEMO_OFFICE_ACTOR: Actor = { who: 'Demo actions', role: 'office', source: 'demo' }

/**
 * Kirsty W.'s account id for the simulated sign-in audit rows. She has no
 * seeded master record (office staff are not modelled), so the rows need a
 * fixed id of their own.
 */
export const OFFICE_ACCOUNT_ID = 'office-kirsty'

/**
 * Any anaesthetist as herself (catch-up Phase 32), from the master record, so
 * a demo trigger that stages a colleague's own move audits and notifies
 * truthfully ("Dr Rawiri Hughes moved ..."). Phase 32a reuses it. Undefined for
 * an unknown id.
 */
export function anaesthetistActor(state: Pick<AppState, 'masters'>, anaesthetistId: string): Actor | undefined {
  const a = state.masters.anaesthetists[anaesthetistId]
  return a === undefined ? undefined : { who: a.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: a.registrationNumber }
}

/**
 * The hospital feed as an actor (catch-up Phase 43): the Matching screen's
 * "View raw row as another role" shows a system integration refused. `ActorRole`
 * has no integration role, so the role is `system` and the source `integration`.
 */
export const HOSPITAL_FEED_ACTOR: Actor = { who: 'Hospital feed', role: 'system', source: 'integration' }


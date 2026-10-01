/**
 * The demo's named actors, in one place (catch-up Phase 14). The demo
 * triggers, the Control Panel's scenario jumps, the Xero simulation, the Admin
 * app and the PWA's office simulation all act as one of these, so the audit
 * trail names the same person (or the same plainly simulated office) whichever
 * surface fired the action.
 */

import { ANAE } from '../domain/seed'
import type { Actor } from './mutate'

/** The office persona, Kirsty W., exactly as the Admin Web App acts. */
export const OFFICE_ACTOR: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

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
 * Kirsty W.'s account id for the simulated sign-in audit rows. She has no
 * seeded master record (office staff are not modelled), so the rows need a
 * fixed id of their own.
 */
export const OFFICE_ACCOUNT_ID = 'office-kirsty'

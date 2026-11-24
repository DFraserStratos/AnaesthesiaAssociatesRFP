/**
 * Out-of-hours words (catch-up Phase 32c; US-01.1.6), in their own module so
 * the anaesthetist apps can read them without reaching the office's Draft List
 * words (`scheduleTerms.ts` is office only, `draftListBoundary.test.ts`). The
 * session reads "Out-of-hours" where AM or PM would; never "slot".
 */

import { OUT_OF_HOURS_LABEL } from '../domain/outOfHours'

export const OUT_OF_HOURS = OUT_OF_HOURS_LABEL
export const OUT_OF_HOURS_SESSION = 'Out-of-hours session'
/** The Admin Day row control and its sheet's title. */
export const OPEN_OUT_OF_HOURS = 'Open out-of-hours session'
export const CLOSE_OUT_OF_HOURS = 'Close out-of-hours session'

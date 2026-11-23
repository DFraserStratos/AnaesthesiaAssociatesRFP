/**
 * The support panel's words (catch-up Phase 43b), in one place. The hours,
 * phone line and response times are not here: they come from
 * `SUPPORT_CONFIG` (`domain/support.ts`). Say "help line", never "help desk".
 */

import { SUPPORT_CONFIG } from '../../domain/support'
import type { SupportChannel, SupportReason, SupportTicket, SupportTicketKind, SupportTicketStatus } from '../../domain/types'

export const SUPPORT_TITLE = 'Help'

export const CHANNEL_LABEL: Readonly<Record<SupportChannel, string>> = {
  helpLine: 'Help line',
  productSupport: 'Product support',
}

export const CHANNEL_INTRO: Readonly<Record<SupportChannel, string>> = {
  helpLine: "Stratos' support line, for anything in the apps that is not working as expected, such as a forgotten password or not being able to sign in.",
  productSupport: "AA's route to Stratos for the product itself: incidents, fixes, changes and new features.",
}

/** The one simulated caption: shown once per panel beside the Simulated badge. */
export const SIMULATED_CAPTION = "Simulated: how Stratos' support works is the real service's, not this prototype's."

export const OUT_OF_HOURS_NOTE: Readonly<Record<SupportChannel, string>> = {
  helpLine: 'Out of hours: only a security breach or the platform being offline is answered. Anything else is logged and picked up at the next opening.',
  productSupport: 'Out of hours: product support is best effort, not guaranteed.',
}

export const PUBLIC_HOLIDAY_NOTE = "Public holiday: a call-out happens only with AA's approval."
export const CHRISTMAS_NOTE = 'Christmas and New Year: limited, best-effort cover.'

export const KIND_LABEL: Readonly<Record<SupportTicketKind, string>> = {
  request: 'Request',
  incident: 'Incident',
  fix: 'Fix',
  change: 'Change',
  newFeature: 'New feature',
}

export const NEW_FEATURE_LINE = 'Goes to the product owner or the development team, to plan.'

export const STATUS_LABEL: Readonly<Record<SupportTicketStatus, string>> = {
  logged: 'Logged',
  responded: 'Responded',
  closed: 'Closed',
}

export type OutOfHoursReason = SupportReason | 'other'

export const REASON_LABEL: Readonly<Record<OutOfHoursReason, string>> = {
  securityBreach: 'Security breach',
  platformOffline: 'Platform offline or unavailable',
  other: 'Something else',
}

export const NOT_ANSWERED_LINE = 'Not answered out of hours; picked up at the next opening'
export const BEST_EFFORT = 'Best effort'
export const AWAITING_APPROVAL = "Awaiting AA's approval"
export const CALL_OUT_APPROVED = 'Call-out approved'
export const OVERDUE = 'Response overdue'

/** The line under a ticket that has no respond-by time, or null where it has one. */
export function noTimeLine(t: SupportTicket): string | null {
  if (t.respondByISO !== undefined) return null
  if (t.callOut === 'awaitingApproval') return "Call-out waits for AA's approval"
  if (t.channel === 'helpLine' && t.cover !== 'inHours') return NOT_ANSWERED_LINE
  if (t.channel === 'productSupport' && t.cover !== 'inHours') return 'Best effort, no guaranteed time'
  if (t.priority === 'P4') return SUPPORT_CONFIG.response[t.channel].P4.label
  return null
}

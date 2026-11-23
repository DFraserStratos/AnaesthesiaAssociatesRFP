/**
 * Support tickets (catch-up Phase 43b; US-15.0.8 help line for app users,
 * US-15.0.9 product support for AA). Every change goes through `mutate()`,
 * stamped from the demo clock; the rules (cover, respond-by, call-out) come
 * from `domain/support.ts` and 42's master public-holiday calendar.
 *
 * Nothing here is a ticketing integration: the tickets are a small simulated
 * record, moved on by `STRATOS_SUPPORT_ACTOR` from the demo triggers.
 */

import { coverAt, PRODUCT_KINDS, respondBy, SUPPORT_PRIORITIES } from '../domain/support'
import type {
  PublicHoliday,
  SupportChannel,
  SupportPriority,
  SupportReason,
  SupportTicket,
  SupportTicketId,
  SupportTicketKind,
} from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'

export interface RaiseSupportTicketInput {
  channel: SupportChannel
  kind: SupportTicketKind
  priority: SupportPriority
  subject: string
  description: string
  /** Help line out of hours: what is happening. Only these two are answered after hours. */
  reason?: SupportReason
  app: SupportTicket['raisedBy']['app']
}

function publicHolidaysOf(state: Pick<AppState, 'masters'>): readonly PublicHoliday[] {
  return Object.values(state.masters.publicHolidays)
}

/**
 * Log a request. The cover, respond-by and call-out are worked out from the
 * clock and the calendar at the moment it is raised. A help-line ticket out
 * of hours for a security breach or the platform offline is P1 and answered
 * within the hour; anything else out of hours waits for the next opening. A
 * product-support ticket on a public holiday waits for AA's call-out approval.
 */
export function raiseSupportTicket(api: AppStoreApi, actor: Actor, input: RaiseSupportTicketInput): Outcome<{ ticketId: SupportTicketId }> {
  const subject = input.subject.trim()
  if (subject === '') return refuse('subjectRequired', 'Say what the request is about.')
  if (!SUPPORT_PRIORITIES.includes(input.priority)) return refuse('priorityRequired', 'Choose a priority.')
  const helpLine = input.channel === 'helpLine'
  if (helpLine ? input.kind !== 'request' : !PRODUCT_KINDS.includes(input.kind)) {
    return refuse('kindMismatch', helpLine ? 'A help-line ticket is a request.' : 'Choose incident, fix, change or new feature.')
  }

  const state = api.getState()
  const raisedAtISO = clockISO(state.clock)
  const holidays = publicHolidaysOf(state)
  const cover = coverAt(input.channel, state.clock.todayISO, state.clock.minutesSinceMidnight, holidays)
  // Only the help line out of hours takes a reason; in hours it is ignored.
  const reason = helpLine && cover.kind !== 'inHours' ? input.reason : undefined
  const priority: SupportPriority = reason !== undefined ? 'P1' : input.priority
  const due = respondBy(input.channel, priority, raisedAtISO, holidays, reason)
  const callOut = !helpLine && cover.kind === 'publicHoliday' ? ('awaitingApproval' as const) : undefined

  // The id the recipe allocates (synchronous, same counters), so the audit row names it.
  const ticketId = allocateId(state.counters, 'supportTicket').id
  mutate(
    api,
    actor,
    {
      entityType: 'supportTicket',
      entityId: ticketId,
      action: 'support.raise',
      after: {
        subject,
        channel: input.channel,
        priority,
        cover: cover.kind,
        status: 'logged',
        ...(reason !== undefined ? { reason } : {}),
        ...(due !== null ? { respondByISO: due } : {}),
        ...(callOut !== undefined ? { callOut } : {}),
      },
    },
    (s) => {
      const alloc = allocateId(s.counters, 'supportTicket')
      const ticket: SupportTicket = {
        id: alloc.id,
        channel: input.channel,
        kind: input.kind,
        priority,
        subject,
        description: input.description.trim(),
        ...(reason !== undefined ? { reason } : {}),
        raisedBy: { who: actor.who, app: input.app },
        raisedAtISO,
        cover: cover.kind,
        ...(due !== null ? { respondByISO: due } : {}),
        status: 'logged',
        ...(callOut !== undefined ? { callOut } : {}),
      }
      return { support: { ...s.support, tickets: { ...s.support.tickets, [alloc.id]: ticket } }, counters: alloc.counters }
    },
  )
  return ok({ ticketId })
}

/** Move a ticket on one step: Logged to Responded to Closed. A call-out awaiting AA's approval refuses. */
export function advanceSupportTicket(api: AppStoreApi, actor: Actor, id: SupportTicketId): Outcome<{ status: SupportTicket['status'] }> {
  const ticket = api.getState().support.tickets[id]
  if (ticket === undefined) return refuse('notFound', 'That request is not on record.')
  if (ticket.status === 'closed') return refuse('closed', `${id} is already closed.`)
  if (ticket.callOut === 'awaitingApproval') return refuse('awaitingApproval', `${id} waits for AA's approval of the call-out.`)
  const next = ticket.status === 'logged' ? 'responded' : 'closed'
  mutate(
    api,
    actor,
    {
      entityType: 'supportTicket',
      entityId: id,
      action: next === 'responded' ? 'support.respond' : 'support.close',
      before: { status: ticket.status },
      after: { status: next },
    },
    (s) => {
      const at = clockISO(s.clock)
      const current = s.support.tickets[id]!
      const updated: SupportTicket = next === 'responded' ? { ...current, status: next, respondedAtISO: at } : { ...current, status: next, closedAtISO: at }
      return { support: { ...s.support, tickets: { ...s.support.tickets, [id]: updated } } }
    },
  )
  return ok({ status: next })
}

/** AA approves a public-holiday call-out (given to Stratos outside the app). */
export function approveCallOut(api: AppStoreApi, actor: Actor, id: SupportTicketId): Outcome {
  const ticket = api.getState().support.tickets[id]
  if (ticket === undefined) return refuse('notFound', 'That request is not on record.')
  if (ticket.callOut !== 'awaitingApproval') return refuse('notAwaiting', `${id} is not waiting for a call-out approval.`)
  mutate(
    api,
    actor,
    { entityType: 'supportTicket', entityId: id, action: 'support.callOutApprove', before: { callOut: 'awaitingApproval' }, after: { callOut: 'approved' } },
    (s) => ({ support: { ...s.support, tickets: { ...s.support.tickets, [id]: { ...s.support.tickets[id]!, callOut: 'approved' } } } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export interface TicketScope {
  channel: SupportChannel
  /** The requester's name; absent for the office, who sees every request. */
  requester?: string
}

/** A channel's tickets, newest first (by raised time, then id). */
export function ticketsFor(state: Pick<AppState, 'support'>, scope: TicketScope): SupportTicket[] {
  return Object.values(state.support.tickets)
    .filter((t) => t.channel === scope.channel && (scope.requester === undefined || t.raisedBy.who === scope.requester))
    .sort((a, b) => (a.raisedAtISO === b.raisedAtISO ? b.id.localeCompare(a.id) : b.raisedAtISO.localeCompare(a.raisedAtISO)))
}

/** The newest ticket in scope that is not closed, or null. */
export function newestOpenTicket(state: Pick<AppState, 'support'>, scope: TicketScope): SupportTicket | null {
  return ticketsFor(state, scope).find((t) => t.status !== 'closed') ?? null
}

/** The newest product-support ticket waiting for AA's call-out approval, or null. */
export function newestAwaitingCallOut(state: Pick<AppState, 'support'>): SupportTicket | null {
  return ticketsFor(state, { channel: 'productSupport' }).find((t) => t.callOut === 'awaitingApproval') ?? null
}

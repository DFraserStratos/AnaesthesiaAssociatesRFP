/**
 * The seeded support tickets (catch-up Phase 43b; US-15.0.8, US-15.0.9): five
 * requests raised in hours before `DEMO_TODAY`, so the panel opens with a
 * history in every state. No `rng()` draw, so no other seeded value moves.
 * Respond-by times come from the one rule (`respondBy`), never typed here.
 */

import { respondBy } from '../support'
import type { SupportSlice, SupportTicket } from '../types'

const NO_HOLIDAYS = [] as const

function ticket(t: Omit<SupportTicket, 'respondByISO'>): SupportTicket {
  const due = respondBy(t.channel, t.priority, t.raisedAtISO, NO_HOLIDAYS)
  return due === null ? t : { ...t, respondByISO: due }
}

const SOUTER = 'Dr Melanie Souter'
const KIRSTY = 'Kirsty W.'

export const SEED_SUPPORT_TICKETS: readonly SupportTicket[] = [
  ticket({
    id: 'TK0001',
    channel: 'helpLine',
    kind: 'request',
    priority: 'P3',
    subject: 'Forgot my password',
    description: 'Locked out of the app on my phone after a new handset.',
    raisedBy: { who: SOUTER, app: 'mobile' },
    raisedAtISO: '2026-11-17T09:10:00',
    cover: 'inHours',
    status: 'closed',
    respondedAtISO: '2026-11-17T10:05:00',
    closedAtISO: '2026-11-17T10:30:00',
  }),
  ticket({
    id: 'TK0002',
    channel: 'helpLine',
    kind: 'request',
    priority: 'P3',
    subject: 'Cannot sign in to the Admin app',
    description: 'The sign-in page keeps asking for the code again after it is entered.',
    raisedBy: { who: KIRSTY, app: 'admin' },
    raisedAtISO: '2026-11-23T14:20:00',
    cover: 'inHours',
    status: 'responded',
    respondedAtISO: '2026-11-23T15:05:00',
  }),
  ticket({
    id: 'TK0003',
    channel: 'helpLine',
    kind: 'request',
    priority: 'P4',
    subject: 'Wording on the Accounts page',
    description: 'The heading says "Balance" where the figure is what is still owed to me.',
    raisedBy: { who: SOUTER, app: 'web' },
    raisedAtISO: '2026-11-20T11:00:00',
    cover: 'inHours',
    status: 'logged',
  }),
  ticket({
    id: 'TK0004',
    channel: 'productSupport',
    kind: 'newFeature',
    priority: 'P4',
    subject: 'Export the Day view to a spreadsheet',
    description: 'For the weekly planning meeting. Goes to the product owner to plan.',
    raisedBy: { who: KIRSTY, app: 'admin' },
    raisedAtISO: '2026-11-19T10:30:00',
    cover: 'inHours',
    status: 'logged',
  }),
  ticket({
    id: 'TK0005',
    channel: 'productSupport',
    kind: 'fix',
    priority: 'P3',
    subject: 'Remittance advice shows the wrong week',
    description: 'The remittance advice for week 28 is headed week 27.',
    raisedBy: { who: KIRSTY, app: 'admin' },
    raisedAtISO: '2026-11-18T13:00:00',
    cover: 'inHours',
    status: 'responded',
    respondedAtISO: '2026-11-20T10:00:00',
  }),
]

/** The next free `supportTicket` counter after the seed. */
export const SEED_SUPPORT_TICKET_NEXT = SEED_SUPPORT_TICKETS.length + 1

export function seedSupportSlice(): SupportSlice {
  const tickets: SupportSlice['tickets'] = {}
  for (const t of SEED_SUPPORT_TICKETS) tickets[t.id] = { ...t, raisedBy: { ...t.raisedBy } }
  return { tickets }
}

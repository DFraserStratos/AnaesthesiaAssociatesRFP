/**
 * The prepayment demo triggers' bodies (catch-up Phase 27; US-06.3.1,
 * US-06.3.2). Registered in `shared/demoTriggers/registry.ts`; the bodies live
 * here so the PWA build stays pure (`pwaPurity`). Every write goes through the
 * real store actions, so it is audited and guarded as usual.
 *
 *  - "Move to 2 days before procedure": the demo clock jumps forward to two
 *    days before an outstanding prepayment's procedure date, so its warning
 *    turns strong (a cleared mild one re-opens). Forward only.
 *  - "Add prepaid Booking": as the office stand-in, a Booking on Dr Souter's
 *    next ACTIVE List with her prepaid Rhinoplasty Contract (one payer), or
 *    with Blepharoplasty, upper lids added for a second payer (two payers).
 *  - The payment entries' choices on a Booking: its sent prepayment ACCRECs.
 */

import { format, parseISO, subDays } from 'date-fns'
import type { AssignedList } from '../domain/types'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { ANAE } from '../domain/seed'
import { PAT } from '../domain/seed/patients'
import { contractAllowedOn } from '../domain/billing/contractRail'
import { formatMoney } from '../domain/billing/money'
import { shortDay } from '../domain/dateText'
import { PREPAYMENT_NOT_NEEDED } from './prepaymentActions'
import type { AppState, AppStoreApi } from './appStore'
import { addProcedure, createBooking } from './bookingActions'
import { setProcedureContract } from './contractSelectionActions'
import { setProcedurePayer } from './payerActions'
import { cancelBooking } from './lifecycle'
import { advanceClockToDate } from './clockActions'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { patientNameFor, proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { prepaymentStatusFor, upcomingPrepayments } from './prepaymentSelectors'
import { isOutstanding } from '../domain/billing/prepayment'
import { refuse, type Outcome } from './mutate'

/** "Fri 24 Jul". */
const dayName = shortDay

// ---------------------------------------------------------------------------
// Move to 2 days before procedure
// ---------------------------------------------------------------------------

/** The outstanding prepayments (awaiting approval, unpaid, part paid) on Lists not yet authorised, earliest first, one per Booking. */
export function outstandingPrepaymentBookings(state: Pick<AppState, 'schedule' | 'billing' | 'masters' | 'clock'>): { bookingId: string; dateISO: string; label: string }[] {
  const seen = new Set<string>()
  const out: { bookingId: string; dateISO: string; label: string }[] = []
  for (const row of upcomingPrepayments(state)) {
    if (!isOutstanding(row.status) || seen.has(row.bookingId)) continue
    seen.add(row.bookingId)
    out.push({ bookingId: row.bookingId, dateISO: row.dateISO, label: `${row.patientName} · ${dayName(row.dateISO)}` })
  }
  return out
}

/** Why the clock cannot jump to 2 days before this Booking (or the first outstanding one), or null. */
export function twoDaysBeforeRefusal(state: Pick<AppState, 'schedule' | 'billing' | 'masters' | 'clock'>, bookingId?: string): string | null {
  const targets = outstandingPrepaymentBookings(state)
  const target = bookingId !== undefined ? targets.find((t) => t.bookingId === bookingId) : targets[0]
  if (target === undefined) return 'No outstanding pre-payments'
  const jumpTo = format(subDays(parseISO(target.dateISO), 2), 'yyyy-MM-dd')
  return jumpTo <= state.clock.todayISO ? 'Already 2 days or less before' : null
}

/** Jump the demo clock forward to 08:00 two days before the Booking's procedure date. Never rewinds. */
export function moveToTwoDaysBefore(api: AppStoreApi, bookingId?: string): Outcome<{ dateISO: string; patientName: string }> {
  const state = api.getState()
  const refused = twoDaysBeforeRefusal(state, bookingId)
  if (refused !== null) return refuse('unavailable', refused)
  const targets = outstandingPrepaymentBookings(state)
  const target = (bookingId !== undefined ? targets.find((t) => t.bookingId === bookingId) : targets[0])!
  const jumpTo = format(subDays(parseISO(target.dateISO), 2), 'yyyy-MM-dd')
  advanceClockToDate(api, jumpTo)
  const booking = state.schedule.bookings[target.bookingId]!
  return { ok: true, value: { dateISO: jumpTo, patientName: patientNameFor(state, booking.patientId) } }
}

// ---------------------------------------------------------------------------
// Add prepaid Booking
// ---------------------------------------------------------------------------

export type AddPrepaidMode = 'one-payer' | 'two-payers'

/** The staged Booking's patient (a seeded patient with no other Booking ahead) and the second payer. */
export const PREPAID_DEMO = {
  patientId: PAT.gray,
  email: 'fiona.gray@example.co.nz',
  secondPayer: { kind: 'other' as const, name: 'Ian Gray', relationship: 'Partner', email: 'ian.gray@example.co.nz' },
  rhinoplasty: PRICED_ITEM.souterRhinoplasty,
  blepharoplasty: PRICED_ITEM.souterBleph,
} as const

/** Dr Souter's next ACTIVE List (from today) on which both her prepaid Contracts are offered. */
export function nextPrepaidSouterList(state: Pick<AppState, 'schedule' | 'clock' | 'masters'>): AssignedList | undefined {
  const masters = railMastersOf(state)
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.anaesthetistId === ANAE.souter && l.state === 'ACTIVE' && l.dateISO >= state.clock.todayISO)
    .filter((l) => {
      const ctx = railContextForList(state, l)
      return contractAllowedOn(masters, ctx, PREPAID_DEMO.rhinoplasty) && contractAllowedOn(masters, ctx, PREPAID_DEMO.blepharoplasty)
    })
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session))[0]
}

/** Why "Add prepaid Booking" cannot run, or null. */
export function addPrepaidBookingRefusal(state: Pick<AppState, 'schedule' | 'clock' | 'masters'>): string | null {
  if (nextPrepaidSouterList(state) === undefined) return 'No ACTIVE List for Dr Souter'
  // Added already: a live Booking of hers with a Procedure on the prepaid Rhinoplasty Contract.
  const added = Object.values(state.schedule.bookings).some(
    (b) =>
      b.patientId === PREPAID_DEMO.patientId &&
      b.cancellation === undefined &&
      Object.values(state.schedule.procedures).some((p) => p.bookingId === b.id && p.governingContractId === PREPAID_DEMO.rhinoplasty),
  )
  return added ? 'Already added (Reset to repeat)' : null
}

function must<T>(outcome: Outcome<T>): T {
  if (!outcome.ok) throw new Error(outcome.message)
  return outcome.value
}

/**
 * As the office stand-in, add a prepaid Booking on Dr Souter's next ACTIVE
 * List. One payer: Rhinoplasty on her prepaid Contract, the patient paying.
 * Two payers: also Blepharoplasty, upper lids on her prepaid Contract, its
 * payer set to a second person with the offer to the Rhinoplasty unticked, so
 * two payer groups await approval. With approval off each is sent at once.
 */
export function addPrepaidBooking(api: AppStoreApi, mode: AddPrepaidMode): Outcome<{ bookingId: string; message: string }> {
  const state = api.getState()
  const refused = addPrepaidBookingRefusal(state)
  if (refused !== null) return refuse('unavailable', refused)
  const list = nextPrepaidSouterList(state)!
  const patient = state.masters.patients[PREPAID_DEMO.patientId]
  if (patient === undefined) return refuse('notFound', 'The demo patient is missing.')
  const actor = OFFICE_SIMULATION_ACTOR
  let bookingId: string | undefined
  try {
    ;({ bookingId } = must(
      createBooking(api, actor, list.id, {
        patient: { nhi: patient.nhi, name: patient.name, dobISO: patient.dobISO, email: PREPAID_DEMO.email },
        sourceText: { text: 'Rhinoplasty, self funded', source: 'email' },
        scheduledTime: list.session === 'AM' ? '11:30' : '16:30',
      }),
    ))
    const [rhino] = proceduresForBooking(api.getState(), bookingId)
    must(setProcedureContract(api, actor, rhino!.id, PREPAID_DEMO.rhinoplasty))
    if (mode === 'two-payers') {
      const { procedureId } = must(addProcedure(api, actor, bookingId, {}))
      // The payer first, so with approval off the Blepharoplasty is never sent to the patient first.
      must(setProcedurePayer(api, actor, procedureId, PREPAID_DEMO.secondPayer, []))
      must(setProcedureContract(api, actor, procedureId, PREPAID_DEMO.blepharoplasty))
    }
    const status = prepaymentStatusFor(api.getState(), bookingId)
    const parts = status.groups.map((g) => (g.amount !== null ? `${g.payerName} ${formatMoney(g.amount)}` : g.payerName))
    const sent = status.groups.some((g) => g.invoiceId !== undefined)
    const where = `Dr Souter's ${dayName(list.dateISO)} ${list.session} List`
    return {
      ok: true,
      value: {
        bookingId,
        message: sent
          ? `Added ${patient.name} on ${where}. Approval is off, so the prepayment ${status.groups.length > 1 ? 'invoices were' : 'invoice was'} generated and sent at once (${parts.join(', ')}).`
          : `Added ${patient.name} on ${where}: ${status.groups.length} ${status.groups.length > 1 ? 'payers await' : 'payer awaits'} approval on Invoices (${parts.join(', ')}).`,
      },
    }
  } catch (error) {
    // Never leave a part-built Booking: it would read as "Already added" with no way to retry.
    if (bookingId !== undefined) cancelBooking(api, actor, bookingId, 'Demo prepaid Booking did not complete')
    return refuse('stageFailed', (error as Error).message)
  }
}

// ---------------------------------------------------------------------------
// The payment entries on a Booking: its sent prepayment ACCRECs
// ---------------------------------------------------------------------------

/** A Booking's sent prepayment invoices as payment choices (the ACCREC id, labelled by number and payer). */
export function prepaymentAccRecChoices(state: Pick<AppState, 'schedule' | 'billing' | 'masters' | 'xero'>, bookingId: string): { id: string; label: string }[] {
  return prepaymentStatusFor(state, bookingId).groups.flatMap((g) => {
    if (g.invoiceId === undefined) return []
    const accRec = Object.values(state.xero.accRecs).find((r) => r.invoiceId === g.invoiceId)
    return accRec === undefined ? [] : [{ id: accRec.id, label: `${g.invoiceNumber ?? accRec.invoiceNumber} · ${g.payerName}` }]
  })
}

/** Why a payment cannot be simulated on this Booking's prepayment, or null. */
export function prepaymentPaymentRefusal(state: Pick<AppState, 'schedule' | 'billing' | 'masters' | 'xero'>, bookingId: string | undefined): string | null {
  if (bookingId === undefined) return 'Open a Booking'
  const status = prepaymentStatusFor(state, bookingId)
  if (status.groups.length === 0) return PREPAYMENT_NOT_NEEDED
  if (prepaymentAccRecChoices(state, bookingId).length === 0) return 'Not approved yet'
  return null
}

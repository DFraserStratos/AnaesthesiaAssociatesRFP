/**
 * Rebook with another anaesthetist (catch-up Phase 41; US-06.5.3, a true
 * cancellation only).
 *
 * The cancelled Booking's prepayment was already settled by its cancellation
 * (`prepaymentCancellation.ts`: credited, and refunded when paid). Rebooking it
 * with a colleague makes a NEW Booking on one of their ACTIVE Lists: the same
 * patient, each Procedure as a skeleton (the procedure text as received, the
 * RVG code, the primary flag; no times, modifiers or prices), each Procedure's
 * payer copied explicitly from the matching cancelled Procedure (never 22a's
 * copy rule, which is for a Procedure added to the same Booking), and the
 * Contract the replacement's own price-list Contract when its range in force
 * covers the procedure, else none (20's "Needs a Contract" and 27's `noLine`
 * take over), never the original's. 27's derivation then reads the new
 * Booking awaiting approval at the replacement's own price. Nothing from the
 * original moves.
 *
 * The writes go through the existing actions (15's `createBooking`, 15's
 * `addProcedure`, 20a's `replaceProcedureText`, `editProcedure` for an added
 * Procedure's RVG code, 22a's `setProcedurePayer`, 20's
 * `setProcedureContract`), each its own audited commit, then one small audited
 * commit links the two Bookings (`rebookedFromBookingId`) and audits
 * `booking.rebooked` on both. All of it is one change set (DM-35). A failure
 * part way cancels the part-built Booking, so a retry is never refused as
 * "already rebooked".
 *
 * To keep the prepayment instead, the office moves the Booking (US-06.5.4):
 * a move changes nothing about it.
 */

import type { AssignedList, Booking, Contract, Procedure, ProcedurePayer, Session } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { mutate, ok, refuse, withChangeSet, type Actor, type MutationMeta, type Outcome } from './mutate'
import { addProcedure, createBooking } from './bookingActions'
import { cancelBooking, editProcedure } from './lifecycle'
import { replaceProcedureText } from './procedureTextActions'
import { setProcedurePayer, type PayerInput } from './payerActions'
import { setProcedureContract } from './contractSelectionActions'
import { anaesthetistsInRosterOrder, prePaymentInvoicesForBooking, proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { prepaymentStatusFor } from './prepaymentSelectors'
import { contractCandidatesFor } from '../domain/billing/contractRail'
import { isPrepaidContract } from '../domain/billing/prepayment'
import { rangeInForce } from '../domain/billing/priceRanges'
import { payerKey } from '../domain/billing/procedurePayer'
import { roundToCents } from '../domain/billing/money'
import { drSurname } from '../shared/format'

export const REBOOK_MESSAGES = {
  officeOnly: 'Only the office rebooks a cancelled booking.',
  notFound: 'Booking not found.',
  listNotFound: 'That List could not be found.',
  notCancelled: 'Only a cancelled booking is rebooked. To keep the prepayment, move the booking instead.',
  sameAnaesthetist: 'Choose a different anaesthetist. To keep the prepayment, move the booking instead of cancelling it.',
  listLocked: 'That List is no longer open for bookings. Choose an ACTIVE List.',
  pastDate: 'That List is in the past. Choose a List from today.',
  alreadyRebooked: 'This booking has already been rebooked.',
  noProcedures: 'This booking has no procedures to rebook.',
} as const

type RebookState = Pick<AppState, 'schedule' | 'masters' | 'billing' | 'clock'>

// ---------------------------------------------------------------------------
// The replacement's own price list
// ---------------------------------------------------------------------------

const normalised = (text: string | null | undefined): string => (text ?? '').trim().toLowerCase()

/**
 * Whether an anaesthetist's own Contract covers a cancelled Procedure: the same
 * RVG code as the Contract's default, or the same item name as the cancelled
 * Procedure's Contract (both Rhinoplasty, say).
 */
function covers(contract: Contract, procedure: Procedure, sourceContract: Contract | undefined): boolean {
  if (procedure.rvgGroupId !== undefined && contract.defaultRvgGroupId !== null && contract.defaultRvgGroupId === procedure.rvgGroupId) return true
  if (sourceContract === undefined) return false
  const names = [normalised(sourceContract.name), normalised(sourceContract.invoiceDescription)].filter((n) => n !== '')
  return names.includes(normalised(contract.name)) || (contract.invoiceDescription !== null && names.includes(normalised(contract.invoiceDescription)))
}

/** The anaesthetist's own price-list Contracts (linked to them), active, prepaid ones first. */
function ownPriceList(state: Pick<AppState, 'masters'>, anaesthetistId: string): Contract[] {
  return Object.values(state.masters.contracts)
    .filter((c) => c.linkedAnaesthetistId === anaesthetistId && c.status === 'active' && c.systemRole === undefined)
    .sort((a, b) => Number(isPrepaidContract(b)) - Number(isPrepaidContract(a)) || a.aaCode.localeCompare(b.aaCode))
}

/**
 * The replacement's own price-list Contract for one cancelled Procedure: on a
 * List, the one the step rail offers there (`contractCandidatesFor`, so its
 * range is in force on the List's date and it fits the List's surgeon); with
 * no List, the one whose range is in force on the date. Undefined when their
 * price list has nothing for it.
 */
function ownContractFor(state: Pick<AppState, 'masters'>, anaesthetistId: string, procedure: Procedure, at: { list: AssignedList } | { dateISO: string }): Contract | undefined {
  const sourceContract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  const own = ownPriceList(state, anaesthetistId).filter((c) => covers(c, procedure, sourceContract))
  if ('list' in at) {
    const offered = new Set(contractCandidatesFor(railMastersOf(state), railContextForList(state, at.list)).map((c) => c.id))
    return own.find((c) => offered.has(c.id))
  }
  return own.find((c) => c.pricing.kind !== 'fixed' || rangeInForce(c, at.dateISO) !== null)
}

/** The rebook preview's price: the replacement's own prepaid price, an own price that is not prepaid, or none. */
export type RebookPrice = { kind: 'prepaid'; amount: number } | { kind: 'notPrepaid' } | { kind: 'none' }

/**
 * What a rebook with this anaesthetist would cost the payer up front (the
 * dialog's preview line): the sum, ex GST, of their own prepaid prices in force
 * for the cancelled Booking's procedures. On a chosen List, only the Contracts
 * the rail offers there; otherwise in force on the cancelled Booking's date.
 * `notPrepaid` when their price list covers the procedures but takes no
 * prepayment; `none` when it has no price for them.
 */
export function rebookPriceFor(state: Pick<AppState, 'schedule' | 'masters'>, bookingId: string, anaesthetistId: string, targetListId?: string): RebookPrice {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return { kind: 'none' }
  const target = targetListId !== undefined ? state.schedule.lists[targetListId] : undefined
  const at: { list: AssignedList } | { dateISO: string } =
    target !== undefined && target.state !== 'DRAFT' && target.anaesthetistId === anaesthetistId
      ? { list: target }
      : { dateISO: state.schedule.lists[booking.listId]?.dateISO ?? '' }
  const dateISO = 'list' in at ? at.list.dateISO : at.dateISO
  let amount = 0
  let prepaid = false
  let found = false
  for (const p of proceduresForBooking(state, bookingId)) {
    const contract = ownContractFor(state, anaesthetistId, p, at)
    if (contract === undefined) continue
    found = true
    if (!isPrepaidContract(contract)) continue
    const range = contract.pricing.kind === 'fixed' ? rangeInForce(contract, dateISO) : null
    if (range === null) continue
    prepaid = true
    amount += range.price
  }
  if (prepaid) return { kind: 'prepaid', amount: roundToCents(amount) }
  return found ? { kind: 'notPrepaid' } : { kind: 'none' }
}

/** The preview line, as the dialog prints it (amount ex GST). */
export function rebookPriceLine(price: RebookPrice, anaesthetistName: string, formatAmount: (amount: number) => string): string {
  const who = drSurname(anaesthetistName)
  if (price.kind === 'prepaid') return `New prepayment at ${who}'s own price: ${formatAmount(price.amount)} ex GST`
  if (price.kind === 'notPrepaid') return `${who} does not take prepayment for this procedure.`
  return `${who} has no price for this procedure; the office adds it to their price list.`
}

// ---------------------------------------------------------------------------
// Where it can go
// ---------------------------------------------------------------------------

export interface RebookTargetList {
  listId: string
  dateISO: string
  session: Session
  hospitalId: string
  hospitalName: string
  surgeonId: string
  surgeonName: string
}

export interface RebookTarget {
  anaesthetistId: string
  name: string
  /** Their ACTIVE Lists from today: the cancelled Booking's date first, then by date and session. */
  lists: RebookTargetList[]
}

const SESSION_ORDER: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

/**
 * The colleagues a cancelled Booking can be rebooked with: every other active
 * anaesthetist in roster order, each with their ACTIVE Lists from today (the
 * cancelled Booking's date first). An anaesthetist with none is still listed.
 */
export function rebookTargetsFor(state: Pick<AppState, 'schedule' | 'masters' | 'clock'>, bookingId: string): RebookTarget[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return []
  const source = state.schedule.lists[booking.listId]
  const sourceDate = source?.dateISO
  const byAnaesthetist = new Map<string, AssignedList[]>()
  for (const l of Object.values(state.schedule.lists)) {
    if (l.state !== 'ACTIVE' || l.anaesthetistId === undefined || l.dateISO < state.clock.todayISO) continue
    const lists = byAnaesthetist.get(l.anaesthetistId) ?? []
    lists.push(l)
    byAnaesthetist.set(l.anaesthetistId, lists)
  }
  const rank = (l: AssignedList) => (l.dateISO === sourceDate ? 0 : 1)
  return anaesthetistsInRosterOrder(state)
    .filter((a) => a.active && a.registrationNumber !== source?.anaesthetistId)
    .map((a) => ({
      anaesthetistId: a.registrationNumber,
      name: a.name,
      lists: (byAnaesthetist.get(a.registrationNumber) ?? [])
        .sort((x, y) => rank(x) - rank(y) || x.dateISO.localeCompare(y.dateISO) || SESSION_ORDER[x.session] - SESSION_ORDER[y.session])
        .map((l) => ({
          listId: l.id,
          dateISO: l.dateISO,
          session: l.session,
          hospitalId: l.hospitalId,
          hospitalName: state.masters.hospitals[l.hospitalId]?.name ?? l.hospitalId,
          surgeonId: l.surgeonId,
          surgeonName: state.masters.surgeons[l.surgeonId]?.name ?? l.surgeonId,
        })),
    }))
}

/** The Booking made by rebooking this one, if any. */
export function rebookedBookingOf(state: Pick<AppState, 'schedule'>, bookingId: string): Booking | undefined {
  return Object.values(state.schedule.bookings).find((b) => b.rebookedFromBookingId === bookingId)
}

/** Why this cancelled Booking cannot be rebooked onto this List, or null. */
export function rebookRefusal(state: RebookState, actor: Actor, bookingId: string, targetListId: string): Outcome<never> | null {
  if (actor.role !== 'office') return refuse('officeOnly', REBOOK_MESSAGES.officeOnly)
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return refuse('notFound', REBOOK_MESSAGES.notFound)
  if (booking.cancellation === undefined) return refuse('notCancelled', REBOOK_MESSAGES.notCancelled)
  const target = state.schedule.lists[targetListId]
  if (target === undefined) return refuse('listNotFound', REBOOK_MESSAGES.listNotFound)
  const source = state.schedule.lists[booking.listId]
  if (target.anaesthetistId === undefined || target.anaesthetistId === source?.anaesthetistId) return refuse('sameAnaesthetist', REBOOK_MESSAGES.sameAnaesthetist)
  if (target.state !== 'ACTIVE') return refuse('listLocked', REBOOK_MESSAGES.listLocked)
  if (target.dateISO < state.clock.todayISO) return refuse('pastDate', REBOOK_MESSAGES.pastDate)
  if (rebookedBookingOf(state, bookingId) !== undefined) return refuse('alreadyRebooked', REBOOK_MESSAGES.alreadyRebooked)
  if (proceduresForBooking(state, bookingId).length === 0) return refuse('noProcedures', REBOOK_MESSAGES.noProcedures)
  return null
}

// ---------------------------------------------------------------------------
// The action
// ---------------------------------------------------------------------------

/** A cancelled Procedure's payer as the payer form would type it: an other payer always a new person on the new Booking (no id). */
function payerInputOf(payer: ProcedurePayer): PayerInput {
  if (payer.kind === 'patient') {
    return { kind: 'patient', ...(payer.email !== undefined ? { email: payer.email } : {}), ...(payer.postalAddress !== undefined ? { postalAddress: payer.postalAddress } : {}) }
  }
  return {
    kind: 'other',
    name: payer.name,
    ...(payer.relationship !== undefined ? { relationship: payer.relationship } : {}),
    ...(payer.email !== undefined ? { email: payer.email } : {}),
    ...(payer.postalAddress !== undefined ? { postalAddress: payer.postalAddress } : {}),
    ...(payer.phone !== undefined ? { phone: payer.phone } : {}),
  }
}

function must<T>(outcome: Outcome<T>): T {
  if (!outcome.ok) throw Object.assign(new Error(outcome.message), { code: outcome.code })
  return outcome.value
}

/** The cancelled Booking's Procedures, the primary first, then in id order. */
function sourceProceduresOf(state: Pick<AppState, 'schedule'>, bookingId: string): Procedure[] {
  return proceduresForBooking(state, bookingId).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.id.localeCompare(b.id, undefined, { numeric: true }))
}

/**
 * Rebook a truly cancelled Booking with another anaesthetist on one of their
 * ACTIVE Lists (US-06.5.3). Office only. Refusals: `notCancelled`,
 * `sameAnaesthetist`, `listLocked`, `pastDate`, `alreadyRebooked`. Returns the
 * new Booking's id.
 */
export function rebookWithAnotherAnaesthetist(api: AppStoreApi, actor: Actor, bookingId: string, targetListId: string): Outcome<{ bookingId: string }> {
  const state = api.getState()
  const refused = rebookRefusal(state, actor, bookingId, targetListId)
  if (refused !== null) return refused
  const source = state.schedule.bookings[bookingId]!
  const target = state.schedule.lists[targetListId] as AssignedList
  const patient = state.masters.patients[source.patientId]
  if (patient === undefined) return refuse('notFound', 'The patient could not be found.')
  const procedures = sourceProceduresOf(state, bookingId)
  const [primary, ...others] = procedures as [Procedure, ...Procedure[]]

  return withChangeSet(api, 'create', () => {
    let newId: string | undefined
    try {
      // 1. The Booking and its primary skeleton: the same patient (matched by NHI), the text as received, the RVG code.
      ;({ bookingId: newId } = must(
        createBooking(api, actor, targetListId, {
          patient: { name: patient.name, dobISO: patient.dobISO, ...(patient.nhi !== undefined ? { nhi: patient.nhi } : {}) },
          ...(primary.procedureText !== null
            ? { sourceText: { text: primary.procedureText.text, source: primary.procedureText.source, ...(primary.procedureText.from !== undefined ? { from: primary.procedureText.from } : {}) } }
            : {}),
          ...(primary.rvgGroupId !== undefined ? { rvgGroupId: primary.rvgGroupId } : {}),
          source: 'rebook',
        }),
      ))
      const created = newId
      const [newPrimary] = proceduresForBooking(api.getState(), created)
      // Which new Procedure stands for which cancelled one.
      const pairs: { from: Procedure; to: string }[] = [{ from: primary, to: newPrimary!.id }]

      // 2. Each further Procedure as a skeleton: added, its text as received, its RVG code.
      for (const p of others) {
        const { procedureId } = must(addProcedure(api, actor, created, {}))
        if (p.procedureText !== null) {
          must(replaceProcedureText(api, actor, procedureId, { text: p.procedureText.text, source: p.procedureText.source, ...(p.procedureText.from !== undefined ? { from: p.procedureText.from } : {}) }))
        }
        if (p.rvgGroupId !== undefined) must(editProcedure(api, actor, procedureId, { rvgGroupId: p.rvgGroupId }))
        pairs.push({ from: p, to: procedureId })
      }

      // 3. The payers, copied explicitly per payer, before any Contract (so nothing is sent to the wrong payer first).
      //    One payer applies to every new Procedure that had it, so an other payer stays one person on the new Booking.
      const groups = new Map<string, { payer: ProcedurePayer; ids: string[] }>()
      for (const { from, to } of pairs) {
        const key = payerKey(from.payer, source.patientId)
        const group = groups.get(key) ?? { payer: from.payer, ids: [] }
        group.ids.push(to)
        groups.set(key, group)
      }
      for (const { payer, ids } of groups.values()) {
        const [first, ...rest] = ids as [string, ...string[]]
        must(setProcedurePayer(api, actor, first, payerInputOf(payer), rest))
      }

      // 4. The Contract: the replacement's own price-list Contract the rail offers on the List, else none.
      for (const { from, to } of pairs) {
        const contract = ownContractFor(api.getState(), target.anaesthetistId, from, { list: target })
        if (contract !== undefined) must(setProcedureContract(api, actor, to, contract.id))
      }

      // 5. The link, audited on both Bookings.
      const metas: MutationMeta[] = [
        { entityType: 'booking', entityId: created, action: 'booking.rebooked', after: { rebookedFromBookingId: bookingId, listId: targetListId, anaesthetistId: target.anaesthetistId } },
        { entityType: 'booking', entityId: bookingId, action: 'booking.rebooked', after: { rebookedToBookingId: created, listId: targetListId, anaesthetistId: target.anaesthetistId } },
      ]
      mutate(api, actor, metas, (s) => ({
        schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [created]: { ...s.schedule.bookings[created]!, rebookedFromBookingId: bookingId } } },
      }))
      return ok({ bookingId: created })
    } catch (error) {
      // Never leave a part-built Booking behind.
      if (newId !== undefined) cancelBooking(api, actor, newId, 'Rebook did not complete')
      const code = (error as { code?: string }).code ?? 'rebookFailed'
      return refuse(code, (error as Error).message)
    }
  })
}

// ---------------------------------------------------------------------------
// The history block
// ---------------------------------------------------------------------------

export interface PrepaymentHistoryRow {
  bookingId: string
  anaesthetistId: string | undefined
  /** Ex GST. */
  amount: number
  state: 'refunded' | 'credited' | 'current'
}

/**
 * A rebooked prepayment's history (the Booking panel's block): the chain of
 * Bookings linked by `rebookedFromBookingId`, oldest first, walked both ways
 * from this one. A cancelled Booking's row is its prepayment invoices' amount,
 * refunded when a refund was paid on one, else credited; a cancelled Booking
 * with no prepayment invoice has no row. A live Booking's row is its current
 * prepayment (invoiced, or awaiting approval at the price now); none, no row.
 */
export function prepaymentHistoryFor(state: Pick<AppState, 'schedule' | 'masters' | 'billing'>, bookingId: string): PrepaymentHistoryRow[] {
  const bookings = state.schedule.bookings
  if (bookings[bookingId] === undefined) return []
  const forward = new Map<string, string>()
  for (const b of Object.values(bookings)) if (b.rebookedFromBookingId !== undefined) forward.set(b.rebookedFromBookingId, b.id)
  // Back to the first, then forward to the last; a cycle is never followed twice.
  const seen = new Set<string>([bookingId])
  let first = bookingId
  for (let prev = bookings[first]?.rebookedFromBookingId; prev !== undefined && bookings[prev] !== undefined && !seen.has(prev); prev = bookings[prev]?.rebookedFromBookingId) {
    seen.add(prev)
    first = prev
  }
  const chain = [first]
  const walked = new Set<string>([first])
  for (let next = forward.get(first); next !== undefined && !walked.has(next); next = forward.get(next)) {
    walked.add(next)
    chain.push(next)
  }
  if (chain.length < 2) return []
  const refunded = new Set(Object.values(state.billing.prepaymentRefunds).map((r) => r.prepaymentInvoiceId))
  const rows: PrepaymentHistoryRow[] = []
  for (const id of chain) {
    const booking = bookings[id]!
    const anaesthetistId = state.schedule.lists[booking.listId]?.anaesthetistId
    if (booking.cancellation !== undefined) {
      const invoices = prePaymentInvoicesForBooking(state, id)
      if (invoices.length === 0) continue
      const amount = roundToCents(invoices.reduce((sum, i) => sum + i.subtotal, 0))
      rows.push({ bookingId: id, anaesthetistId, amount, state: invoices.some((i) => refunded.has(i.id)) ? 'refunded' : 'credited' })
      continue
    }
    const status = prepaymentStatusFor(state, id)
    if (status.groups.length === 0) continue
    const amount = roundToCents(status.groups.reduce((sum, g) => sum + (g.invoiceId !== undefined ? (state.billing.invoices[g.invoiceId]?.subtotal ?? 0) : (g.amount ?? 0)), 0))
    rows.push({ bookingId: id, anaesthetistId, amount, state: 'current' })
  }
  return rows
}

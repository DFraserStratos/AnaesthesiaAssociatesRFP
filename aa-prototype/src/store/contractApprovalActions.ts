/**
 * The office's approval of an anaesthetist's Contract change (catch-up Phase
 * 21a; US-07.2.2, US-03.4.1, DM-10, OQ-26). Phase 20 lets the anaesthetist
 * change a Procedure's Contract until the List is AUTHORISED and records it as
 * an audited `procedure.contract` entry; Review flags it until the office
 * approves it here, re-picks the Contract itself, or authorises the List
 * (which stamps every change still unapproved in the same commit). Approval is
 * never a gate.
 *
 * Whether a change is pending is read from the audit's order, not from
 * timestamps, so two writes in the same demo minute still order and a later
 * change by the anaesthetist opens the flag again.
 */

import type { AuditEntry, ContractApproval, ContractId, Procedure } from '../domain/types'
import type { ContractChangeRecord } from '../domain/billing/reviewFlags'
import { titledSurname } from '../domain/names'
import type { AppState, AppStoreApi } from './appStore'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'

type AuditState = Pick<AppState, 'audit' | 'masters'>

/**
 * The anaesthetist's latest Contract change on a Procedure, pending or
 * approved; undefined when the anaesthetist never changed it. Any other
 * actor's `procedure.contract` entry (the office's re-pick) and every
 * `procedure.contractApprove` entry approve what came before.
 */
export function contractChangeFor(state: AuditState, procedureId: string): ContractChangeRecord | undefined {
  let lastChange: AuditEntry | undefined
  let firstPending: AuditEntry | undefined
  let approval: AuditEntry | undefined
  const contractOf = (v: unknown) => (v as { governingContractId?: ContractId } | undefined)?.governingContractId
  for (const e of state.audit) {
    if (e.entityType !== 'procedure' || e.entityId !== procedureId) continue
    // Not a change: an amount typed on the same Contract, or the anaesthetist's first pick on a
    // Procedure with no Contract yet (choosing, not changing; our reading, logged).
    const sameContract = e.action === 'procedure.contract' && contractOf(e.before) === contractOf(e.after)
    const firstPick = e.action === 'procedure.contract' && contractOf(e.before) === undefined
    if (e.action === 'procedure.contract' && e.role === 'anaesthetist' && (sameContract || firstPick)) continue
    if (e.action === 'procedure.contract' && e.role === 'anaesthetist') {
      lastChange = e
      if (firstPending === undefined) firstPending = e
    } else if (e.action === 'procedure.contract' || e.action === 'procedure.contractApprove') {
      if (lastChange !== undefined) approval = e
      firstPending = undefined
    }
  }
  if (lastChange === undefined) return undefined
  if (firstPending === undefined) {
    // Approved: the entry after the anaesthetist's last change.
    const how = (approval?.after as { how?: ContractApproval['how'] } | undefined)?.how ?? 'explicit'
    return {
      status: 'approved',
      by: titledSurname(lastChange.who),
      atISO: lastChange.atISO,
      ...(approval !== undefined ? { approval: { by: approval.who, atISO: approval.atISO, how } } : {}),
    }
  }
  const was = contractOf(firstPending.before)
  // Changed and changed back to the Contract the office last saw: nothing left to approve.
  if (was !== undefined && contractOf(lastChange.after) === was) {
    return { status: 'approved', by: titledSurname(lastChange.who), atISO: lastChange.atISO }
  }
  return {
    status: 'pending',
    by: titledSurname(lastChange.who),
    atISO: lastChange.atISO,
    ...(was !== undefined ? { wasContractId: was } : {}),
  }
}

/** The non-cancelled Procedures with a pending change on a Booking, in id order. */
function pendingOnBooking(state: AppState, bookingId: string): Procedure[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined || booking.cancellation !== undefined) return []
  return Object.values(state.schedule.procedures)
    .filter((p) => p.bookingId === bookingId && contractChangeFor(state, p.id)?.status === 'pending')
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The Procedures with a pending change on a List's non-cancelled Bookings. */
export function pendingContractChangesOnList(state: AppState, listId: string): Procedure[] {
  return Object.values(state.schedule.bookings)
    .filter((b) => b.listId === listId)
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((b) => pendingOnBooking(state, b.id))
}

function approvalMeta(procedure: Procedure, approval: ContractApproval): MutationMeta {
  return {
    entityType: 'procedure',
    entityId: procedure.id,
    action: 'procedure.contractApprove',
    before: { contractApproved: false },
    after: { contractApproved: true, how: approval.how },
  }
}

/** The approve metas and the stamped Procedures, for the caller's own `mutate()` (`authoriseList`). */
export function approvalsAtAuthorise(
  state: AppState,
  actor: Actor,
  listId: string,
): { metas: MutationMeta[]; procedures: Record<string, Procedure> } {
  const approval: ContractApproval = { by: actor.who, atISO: clockISO(state.clock), how: 'authorise' }
  const metas: MutationMeta[] = []
  const procedures: Record<string, Procedure> = {}
  for (const p of pendingContractChangesOnList(state, listId)) {
    metas.push(approvalMeta(p, approval))
    procedures[p.id] = { ...p, contractApproval: approval }
  }
  return { metas, procedures }
}

/** Why the office cannot approve on this Booking now, or null: the trigger's disabled reason and the action's refusal. */
export function approveContractRefusal(state: AppState, bookingId: string, procedureId?: string): string | null {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined) return 'This Booking is not in the current demo data'
  if (list.state === 'AUTHORISED') return "This Booking's List is authorised"
  const pending = pendingOnBooking(state, bookingId).filter((p) => procedureId === undefined || p.id === procedureId)
  if (pending.length === 0) return 'No Contract change to approve'
  return null
}

/**
 * Approve the anaesthetist's Contract change on one Procedure, or on every
 * Procedure of the Booking when `procedureId` is left out (US-07.2.2). Office
 * only, on an ACTIVE or SUBMITTED List. Stamps `contractApproval` (`explicit`),
 * audited `procedure.contractApprove`, one commit.
 */
export function approveContractSelection(
  api: AppStoreApi,
  actor: Actor,
  target: { bookingId: string; procedureId?: string },
): Outcome<{ approved: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office approves a Contract change.')
  const state = api.getState()
  const refusal = approveContractRefusal(state, target.bookingId, target.procedureId)
  if (refusal !== null) return refuse('nothingToApprove', refusal)
  const pending = pendingOnBooking(state, target.bookingId).filter((p) => target.procedureId === undefined || p.id === target.procedureId)
  return commitApprovals(api, actor, pending)
}

/** Approve every pending Contract change on a List's Bookings (Review's approve-all). */
export function approveContractChangesOnList(api: AppStoreApi, actor: Actor, listId: string): Outcome<{ approved: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office approves a Contract change.')
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state === 'AUTHORISED') return refuse('listAuthorised', "This Booking's List is authorised")
  const pending = pendingContractChangesOnList(state, listId)
  if (pending.length === 0) return refuse('nothingToApprove', 'No Contract change to approve')
  return commitApprovals(api, actor, pending)
}

function commitApprovals(api: AppStoreApi, actor: Actor, pending: readonly Procedure[]): Outcome<{ approved: number }> {
  const approval: ContractApproval = { by: actor.who, atISO: clockISO(api.getState().clock), how: 'explicit' }
  mutate(
    api,
    actor,
    pending.map((p) => approvalMeta(p, approval)),
    (s) => {
      const procedures = { ...s.schedule.procedures }
      for (const p of pending) procedures[p.id] = { ...procedures[p.id]!, contractApproval: approval }
      return { schedule: { ...s.schedule, procedures } }
    },
  )
  return ok({ approved: pending.length })
}

/** The PWA's office stand-in (demo trigger "Office approves this Contract change"). */
export function approveContractChangeAsSimulatedOffice(api: AppStoreApi, bookingId: string): Outcome<{ approved: number }> {
  return approveContractSelection(api, OFFICE_SIMULATION_ACTOR, { bookingId })
}

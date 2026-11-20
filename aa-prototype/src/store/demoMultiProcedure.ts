/**
 * The multi-procedure demo triggers' bodies (catch-up Phase 23; US-03.2.2,
 * US-05.3.1). Registered in `shared/demoTriggers/registry.ts`; the bodies live
 * here so the PWA build stays pure (`pwaPurity`). Both go through the real
 * store actions, so every write is audited and guarded as usual.
 *
 *  - "Load 3-procedure Booking (7 modifier units)": the seeded spec
 *    (`MULTI_PROCEDURE_DEMO`) staged on Dr Souter's next open List, as the
 *    office would capture it: `createBooking`, `addProcedure` twice, the RVG
 *    code pick, No contract · RVG on each, the times, and AS3, OB3 and ASE
 *    claimed on the primary with their explanations. Idempotent per List.
 *  - "Hospital feed changes the primary": the List's hospital feed makes the
 *    next Procedure after the primary (in Booking order, cycling) primary
 *    through `setPrimaryProcedure`, audited as `integration`. This applies the
 *    feed's change directly because the matching screen does not exist yet
 *    (Phase 33's handoff).
 */

import { format, parseISO } from 'date-fns'
import type { AssignedList, Procedure } from '../domain/types'
import { MULTI_PROCEDURE_DEMO, multiProcedureStamp, multiProcedureStart } from '../domain/seed/multiProcedureDemo'
import { rvgGroupIdForLegacyCode } from '../domain/seed/rvgGroups'
import { seedModifierId } from '../domain/seed/modifiers'
import { CONTRACT } from '../domain/seed/contracts'
import { ANAE } from '../domain/seed'
import { procedureLabel } from '../domain/billing/procedureStack'
import type { AppState, AppStoreApi } from './appStore'
import { addProcedure, createBooking, setPrimaryProcedure } from './bookingActions'
import { setProcedureContract } from './contractSelectionActions'
import { cancelBooking, editProcedure } from './lifecycle'
import { pickRvgGroup } from './rvgGroupActions'
import { claimModifier } from './modifierActions'
import { DEMO_OFFICE_ACTOR } from './demoActors'
import { integrationActorForHospital } from './integrationActions'
import { proceduresForBooking } from './selectors'
import { refuse, type Outcome } from './mutate'

/** "Mon 27 Jul AM", for the messages. */
function listName(list: Pick<AssignedList, 'dateISO' | 'session'>): string {
  return `${format(parseISO(list.dateISO), 'EEE d MMM')} ${list.session}`
}

/**
 * Dr Souter's next open List: the earliest of her Lists dated after the demo
 * clock's today that is ACTIVE, already holds a Booking and has a hospital.
 */
export function nextOpenSouterList(state: Pick<AppState, 'schedule' | 'clock'>): AssignedList | undefined {
  const booked = new Set(Object.values(state.schedule.bookings).map((b) => b.listId))
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.anaesthetistId === ANAE.souter && l.state === 'ACTIVE' && l.dateISO > state.clock.todayISO && booked.has(l.id) && l.hospitalId !== undefined && l.hospitalId !== '')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session))[0]
}

/** Why the loader cannot run, or null. */
export function multiProcedureLoadRefusal(state: Pick<AppState, 'schedule' | 'clock'>): string | null {
  const list = nextOpenSouterList(state)
  if (list === undefined) return 'Dr Souter has no open List ahead'
  const loaded = Object.values(state.schedule.bookings).some((b) => b.listId === list.id && b.patientId === MULTI_PROCEDURE_DEMO.patientId && b.cancellation === undefined)
  return loaded ? `Already loaded on ${listName(list)}` : null
}

function must<T>(outcome: Outcome<T>): T {
  if (!outcome.ok) throw new Error(outcome.message)
  return outcome.value
}

/** Stage the three-procedure Booking on Dr Souter's next open List. Returns the Booking and the message. */
export function stageMultiProcedureBooking(api: AppStoreApi): Outcome<{ bookingId: string; message: string }> {
  const state = api.getState()
  const refused = multiProcedureLoadRefusal(state)
  if (refused !== null) return refuse('unavailable', refused)
  const list = nextOpenSouterList(state)!
  const patient = state.masters.patients[MULTI_PROCEDURE_DEMO.patientId]
  if (patient === undefined) return refuse('notFound', 'The demo patient is missing.')
  const actor = DEMO_OFFICE_ACTOR
  const [first, ...rest] = MULTI_PROCEDURE_DEMO.procedures
  let bookingId: string | undefined
  try {
    ;({ bookingId } = must(
      createBooking(api, actor, list.id, {
        patient: { nhi: patient.nhi, name: patient.name, dobISO: patient.dobISO },
        sourceText: { text: first!.text, source: 'email' },
        rvgGroupId: rvgGroupIdForLegacyCode(first!.legacyCode),
        governingContractId: CONTRACT.noContractRvg,
        scheduledTime: '16:30',
      }),
    ))
    for (const spec of rest) {
      const { procedureId } = must(addProcedure(api, actor, bookingId, { governingContractId: CONTRACT.noContractRvg }))
      // 19's RVG code pick, as the office would make it.
      must(pickRvgGroup(api, actor, procedureId, rvgGroupIdForLegacyCode(spec.legacyCode)))
    }
    const procedures = proceduresForBooking(api.getState(), bookingId)
    MULTI_PROCEDURE_DEMO.procedures.forEach((spec, i) => {
      const p = procedures[i]!
      if (p.governingContractId === undefined) must(setProcedureContract(api, actor, p.id, CONTRACT.noContractRvg))
      must(
        editProcedure(api, actor, p.id, {
          anaestheticStartISO: multiProcedureStamp(list.dateISO, multiProcedureStart(list.session), spec.fromMinute),
          handoverISO: multiProcedureStamp(list.dateISO, multiProcedureStart(list.session), spec.toMinute),
        }),
      )
    })
    // On the primary only: an additional Procedure refuses a claim (US-05.3.1).
    for (const claim of MULTI_PROCEDURE_DEMO.claims) {
      must(claimModifier(api, actor, procedures[0]!.id, { modifierId: seedModifierId(claim.code), explanation: claim.explanation }))
    }
    return { ok: true, value: { bookingId, message: `Loaded on Dr Souter's ${listName(list)} List: 3 procedures, 7 modifier units, split 3 · 2 · 2.` } }
  } catch (error) {
    // Never leave a part-loaded Booking: it would read as "Already loaded" with no way to retry.
    if (bookingId !== undefined) cancelBooking(api, actor, bookingId, 'Demo load did not complete')
    return refuse('stageFailed', (error as Error).message)
  }
}

/** The Procedure the feed makes primary: the next after the current primary in Booking order, cycling. */
export function nextPrimaryFor(procedures: readonly Procedure[]): Procedure | undefined {
  const at = procedures.findIndex((p) => p.isPrimary)
  if (procedures.length < 2) return undefined
  return procedures[(at + 1) % procedures.length]
}

/** Why the feed cannot change the primary on this Booking, or null. */
export function feedChangesPrimaryRefusal(state: Pick<AppState, 'schedule'>, bookingId: string): string | null {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return 'Open a Booking'
  if (booking.cancellation !== undefined) return 'This Booking is cancelled'
  const list = state.schedule.lists[booking.listId]
  if (list === undefined || list.state !== 'ACTIVE') return 'A hospital feed cannot change a submitted List'
  if (proceduresForBooking(state, bookingId).length < 2) return 'This Booking has one procedure'
  return null
}

/** The List's hospital feed makes the next Procedure primary (audited as `integration`). */
export function feedChangesPrimary(api: AppStoreApi, bookingId: string): Outcome<{ message: string }> {
  const state = api.getState()
  const refused = feedChangesPrimaryRefusal(state, bookingId)
  if (refused !== null) return refuse('unavailable', refused)
  const booking = state.schedule.bookings[bookingId]!
  const list = state.schedule.lists[booking.listId]!
  const procedures = proceduresForBooking(state, bookingId)
  const next = nextPrimaryFor(procedures)!
  const actor = integrationActorForHospital(list.hospitalId)
  const result = setPrimaryProcedure(api, actor, next.id)
  if (!result.ok) return result
  const name = procedureLabel(next, state.masters.rvgGroups, 1)
  return { ok: true, value: { message: `${actor.who} made ${name} the primary. Base units now come from it.` } }
}

/**
 * The S1 to S5 scenario jumps (catch-up Phase 44), as a pure module the Demo
 * control panel renders and `demoScenarios.test.ts` proves.
 *
 * Every `stage` starts from the pristine seed and then applies only what its
 * scenario cannot reach from there, through the product's own guarded store
 * actions as the office (`OFFICE_ACTOR`) or Dr Souter (`SOUTER_ACTOR`), never a
 * direct state write. Each scenario's `beats` follow the run sheet's core
 * beats in order, and each beat's `path` reads the deep link from state at the
 * moment it is clicked, `null` while its target does not exist yet (the label
 * says what it waits for). The steps for a beat live on its `does` line; the
 * jump's `message` says only what was staged.
 *
 * The ids S1 to S5 are stable: the catalogue capture's `{ "scenario": "Sn" }`
 * step clicks `scenario-sn` then `scenario-confirm` on `/demo/control`.
 */

import {
  OFFICE_ACTOR,
  SOUTER_ACTOR,
  authoriseList,
  bookingsForList,
  claimModifier,
  pairForInvoice,
  proceduresForBooking,
  removeModifier,
  resetDomainState,
  saveBookingPatch,
  useAppStore,
  type AppState,
  type AppStoreApi,
} from '../../store'
import { ANAE, CONTRACT, SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { contractPath } from '../admin/contractsPaths'
import { projectedListId } from '../../domain/slots'
import { rvgModifierByCode } from '../../domain/billing/modifiers'
import { resetFramedDemo } from '../../shell/framedReset'
import { DRAFT_LIST, DRAFT_LISTS } from '../../shared/scheduleTerms'
import type { Booking, Invoice } from '../../domain/types'

export type DemoScenarioId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5'

export interface ScenarioStageResult {
  ok: boolean
  message: string
}

export interface ScenarioBeatLink {
  /** The beat's name in the run sheet. */
  beat: string
  /** "Beat 2 · Admin Intake"; when `path` can be null, the label also says what it waits for. */
  label: string
  /** The deep link, read from state when clicked; `null` while the target does not exist. */
  path: (state: AppState) => string | null
  /**
   * What the presenter does there, in one short line under the beat's name:
   * product buttons by their labels, a harness-bar press as "Demo actions →
   * <its label in the registry>".
   */
  does?: string
}

export interface DemoScenario {
  /** Stable: capture recipes use `{ "scenario": "Sn" }`. */
  id: DemoScenarioId
  title: string
  blurb: string
  stage: (api: AppStoreApi) => ScenarioStageResult
  /** One per core beat, in script order. */
  beats: readonly ScenarioBeatLink[]
}

// ---------------------------------------------------------------------------
// The reset every jump starts with
// ---------------------------------------------------------------------------

/**
 * The pristine seed. On the framed app's own store this is the framed reset
 * (`resetFramedDemo`: the anaesthetist's sign-in session forgotten too, so no
 * jump lands on a login; catch-up Phase 43a). An isolated store (the tests) gets the same
 * domain reset with no session to forget.
 */
function resetFirst(api: AppStoreApi): void {
  if (api === useAppStore) resetFramedDemo()
  else resetDomainState(api)
}

/** The messages' shared sentences: the per-beat steps live on each beat's `does`. */
const NOTHING_STAGED = 'Reset to the pristine seed; nothing staged.'
const FOLLOW_THE_BEATS = 'Follow the beats below in order.'

// ---------------------------------------------------------------------------
// Path helpers: read from state, null when the target is missing
// ---------------------------------------------------------------------------

/** Souter's Tue 28 Jul AM List at St George's, where S1's import lands Sarah Mitchell. */
const S1_LIST_ID = SEED_LIST_IDS.integrationStgList
/** Souter's Wed 22 Jul AM List, where S2 Beat 6 hands Lachlan Robinson's Booking on. */
const S2_MOVE_LIST_ID = projectedListId(ANAE.souter, '2026-11-25', 'AM')
/** Dr Sharma's Tue 14 Jul AM List, where S4's post-op and additional invoice beats run. */
const S4_POST_OP_LIST_ID = projectedListId(ANAE.sharma, '2026-11-17', 'AM')

function markerId(key: string): string | undefined {
  return SEED_MARKERS[key]?.entityId
}

function liveBookingOn(state: AppState, listId: string, surname: string): Booking | undefined {
  return bookingsForList(state, listId).find(
    (b) => b.cancellation === undefined && (state.masters.patients[b.patientId]?.name ?? '').endsWith(` ${surname}`),
  )
}

function adminDayPath(state: AppState): string {
  return `/admin/day/${state.clock.todayISO}`
}

function adminBookingPath(state: AppState, bookingId: string | undefined): string | null {
  const booking = bookingId === undefined ? undefined : state.schedule.bookings[bookingId]
  const list = booking === undefined ? undefined : state.schedule.lists[booking.listId]
  return booking === undefined || list === undefined ? null : `/admin/day/${list.dateISO}/bookings/${booking.id}`
}

function mobileBookingPath(state: AppState, booking: Booking | undefined): string | null {
  return booking === undefined || state.schedule.lists[booking.listId] === undefined
    ? null
    : `/mobile/lists/${booking.listId}/bookings/${booking.id}`
}

function reviewPath(state: AppState, listId: string | undefined): string | null {
  return listId === undefined || state.schedule.lists[listId] === undefined ? null : `/admin/review/${listId}`
}

/** A Booking's standard invoices, oldest number first. */
function standardInvoicesFor(state: AppState, bookingId: string | undefined): Invoice[] {
  if (bookingId === undefined) return []
  return Object.values(state.billing.invoices)
    .filter((i) => i.bookingId === bookingId && i.kind === 'standard')
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
}

function invoicePath(invoice: Invoice | undefined): string | null {
  return invoice === undefined ? null : `/admin/invoices/${invoice.id}`
}

/** The Xero ACCREC of the fee-split Booking's insurer share (nib), once authorise has handed it off. */
function feeSplitXeroPath(state: AppState): string | null {
  const invoices = standardInvoicesFor(state, markerId('feeSplitBooking'))
  const insurerShare = invoices.find((i) => i.split !== undefined && i.counterparty.kind !== 'patient') ?? invoices[0]
  const accRecId = insurerShare === undefined ? undefined : pairForInvoice(state, insurerShare.id)?.receivable.xeroAccRecId
  return accRecId === undefined || state.xero.accRecs[accRecId] === undefined ? null : `/demo/xero/invoices/${accRecId}`
}

function listIsAtLeastSubmitted(state: AppState, listId: string): boolean {
  const s = state.schedule.lists[listId]?.state
  return s === 'SUBMITTED' || s === 'AUTHORISED'
}

/** A wall time moved by `minutes` (S5's grouped office save). */
function shiftedTime(time: string | undefined, minutes: number): string {
  const [h, m] = (time ?? '08:00').split(':').map(Number)
  const total = Math.min(23 * 60 + 55, (h ?? 8) * 60 + (m ?? 0) + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// S5's staging: David Chen's audit trail, then Dr Whitaker's Fri 17 Jul authorise
// ---------------------------------------------------------------------------

function stageCompliance(api: AppStoreApi): ScenarioStageResult {
  const chenBookingId = markerId('overriddenTimeUnitsBooking')
  const chenProcedure = chenBookingId === undefined ? undefined : proceduresForBooking(api.getState(), chenBookingId)[0]
  if (chenBookingId === undefined || chenProcedure === undefined) {
    return { ok: false, message: "Reset done, but David Chen's Booking was not found, so his audit trail is not staged." }
  }
  const as3 = rvgModifierByCode(api.getState().masters.modifiers, 'AS3')
  if (as3 === undefined) return { ok: false, message: 'Reset done, but the RVG modifier AS3 was not found, so the audit trail is not staged.' }
  // In this order (catch-up Phases 19b and 35): Dr Souter claims ASA III with its
  // explanation, the office saves the note and a later time as one change set,
  // then Dr Souter removes the claim, so his fee ends where it started.
  const staged = [
    () => claimModifier(api, SOUTER_ACTOR, chenProcedure.id, { modifierId: as3.id, explanation: 'Pre-op review: ASA III' }),
    () =>
      saveBookingPatch(api, OFFICE_ACTOR, chenBookingId, {
        booking: {
          notes: 'Rooms called: confirmed self-funded account details ahead of invoicing.',
          scheduledTime: shiftedTime(api.getState().schedule.bookings[chenBookingId]?.scheduledTime, 15),
        },
      }),
    () => removeModifier(api, SOUTER_ACTOR, chenProcedure.id, as3.id),
  ]
  for (const step of staged) {
    const result = step()
    if (!result.ok) return { ok: false, message: `Reset done, but staging David Chen's audit trail was refused: ${result.message}` }
  }
  // Authorise writes each Procedure's pricing snapshot (catch-up Phase 25); the
  // billing run wired to it raises the invoices from that record.
  const authorised = authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.whitakerFri17)
  if (!authorised.ok) return { ok: false, message: `Audit trail staged, but Dr Whitaker's Fri 20 Nov List was not authorised: ${authorised.message}` }
  return {
    ok: true,
    message:
      "Reset, then staged David Chen's audit trail (an ASA III modifier claimed with its explanation and removed, and Kirsty W.'s save of his note and time as one change set) and authorised Dr Whitaker's Fri 20 Nov List, which locked each Procedure's pricing and raised its invoices. " +
      FOLLOW_THE_BEATS,
  }
}

// ---------------------------------------------------------------------------
// The five scenarios
// ---------------------------------------------------------------------------

export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: 'S1',
    title: 'S1 · Booking to theatre',
    blurb:
      "A St George's file arrives, the office matches Sarah Mitchell onto Dr Souter's Tue 1 Dec AM List and sets her Contract, and Dr Souter captures her Booking on the day.",
    stage: (api) => {
      resetFirst(api)
      return { ok: true, message: `${NOTHING_STAGED} ${FOLLOW_THE_BEATS}` }
    },
    beats: [
      { beat: 'Sign-in', label: 'Beat 1 · Mobile sign-in', does: 'Sign out, then sign back in', path: () => '/mobile/more' },
      {
        beat: 'Import, then match',
        label: 'Beat 2 · Admin Intake',
        does: "Demo actions → Import hospital file (St George's), then Create Booking on Sarah Mitchell's row",
        path: () => '/admin/intake/matching',
      },
      {
        beat: 'The office sets the Contract',
        label: 'Beat 3 · Admin Day',
        does: 'Open her Booking from Needs an invoice destination and set its Contract on the step rail',
        path: adminDayPath,
      },
      {
        beat: 'The descriptions',
        label: 'Beat 4 · Admin Booking, after Create Booking',
        does: 'The wording as received and each description, kept apart',
        path: (s) => adminBookingPath(s, liveBookingOn(s, S1_LIST_ID, 'Mitchell')?.id),
      },
      {
        beat: 'The day arrives',
        label: 'Beat 5 · Mobile List, Tue 1 Dec AM',
        does: 'Procedure day · 1 Dec on the clock beside the app switcher',
        path: (s) => (s.schedule.lists[S1_LIST_ID] === undefined ? null : `/mobile/lists/${S1_LIST_ID}`),
      },
      {
        beat: 'Capture on mobile',
        label: 'Beat 6 · Mobile Booking, after Create Booking',
        does: 'Capture her Booking, Mark complete, then submit the List',
        path: (s) => mobileBookingPath(s, liveBookingOn(s, S1_LIST_ID, 'Mitchell')),
      },
      {
        beat: 'Edit until authorised, then find past work',
        label: 'Beat 7 · Mobile search',
        does: 'Change the submitted List until it is authorised, then search Mitchell or her NHI',
        path: () => '/mobile/lists?q=Mitchell',
      },
    ],
  },
  {
    id: 'S2',
    title: 'S2 · Office day',
    blurb: `The office reads the day, raises and clears warnings, assigns a ${DRAFT_LIST} from a recurring clash, covers illness, sees an anaesthetist move a List and a Booking, works the notification pool and authorises a List.`,
    stage: (api) => {
      resetFirst(api)
      return { ok: true, message: `${NOTHING_STAGED} ${FOLLOW_THE_BEATS}` }
    },
    beats: [
      { beat: 'Read the day', label: 'Beat 1 · Admin Day', does: 'Sessions, Lists, statuses and booking counts', path: adminDayPath },
      { beat: 'Warnings on the to-do list', label: 'Beat 2 · Admin Day to-do list', does: 'Demo actions → Raise sample warnings', path: adminDayPath },
      {
        beat: `A recurring clash becomes a ${DRAFT_LIST}`,
        label: 'Beat 3 · Recurring bookings',
        does: `Demo actions → Stage recurring clash, then on ${DRAFT_LISTS} assign Ms A. Reid's Wed 25 Nov ${DRAFT_LIST}, which becomes ACTIVE`,
        path: () => '/admin/masters?view=recurringBookings',
      },
      {
        beat: 'Illness cover and unavailability',
        label: 'Beat 4 · Admin Day, Wed 25 Nov',
        does: `Assign Mr J. Whitford's ${DRAFT_LIST}, Draft update email, Demo actions → Simulate sickness, then Conflicts`,
        path: () => '/admin/day/2026-11-25',
      },
      {
        beat: 'An anaesthetist moves their own List',
        label: 'Beat 5 · Mobile Lists',
        does: 'Return Tue 1 Dec PM to the office, then hand Mon 30 Nov PM on to Dr Ropata',
        path: () => '/mobile/lists',
      },
      {
        beat: 'An anaesthetist moves a single Booking',
        label: 'Beat 6 · Mobile Booking, Lachlan Robinson',
        does: 'Move to a colleague',
        path: (s) => mobileBookingPath(s, liveBookingOn(s, S2_MOVE_LIST_ID, 'Robinson')),
      },
      {
        beat: 'The notification pool',
        label: 'Beat 7 · Admin Notifications',
        does: 'Alert the office from the phone, Resolve it, then Show resolved; Demo actions → Colleague moves a List to the office',
        path: () => '/admin/notifications',
      },
      {
        beat: 'Authorise a submitted List',
        label: 'Beat 8 · Admin Review',
        does: "Authorise for billing on Dr Morrison's Mon 23 Nov List",
        path: (s) => reviewPath(s, SEED_LIST_IDS.morrisonMon20),
      },
    ],
  },
  {
    id: 'S3',
    title: 'S3 · Money end to end',
    blurb:
      "Authorise Dr Souter's two Mon 23 Nov Lists, follow the nib invoice's Xero pair to payment and payout, run the weekly payment run and AA's monthly fee run, then balance the ledger.",
    stage: (api) => {
      resetFirst(api)
      const state = api.getState()
      const am = state.schedule.lists[SEED_LIST_IDS.souterMon20Am]
      const pm = state.schedule.lists[SEED_LIST_IDS.souterMon20Pm]
      if (am?.state !== 'SUBMITTED' || pm?.state !== 'SUBMITTED') {
        return { ok: false, message: "Reset done, but Dr Souter's two Mon 23 Nov Lists are not both SUBMITTED in the Review queue." }
      }
      return {
        ok: true,
        message: `Reset to the pristine seed, where Dr Souter's Mon 23 Nov AM and PM Lists are SUBMITTED in the Review queue. ${FOLLOW_THE_BEATS}`,
      }
    },
    beats: [
      {
        beat: 'Authorise',
        label: 'Beat 1 · Admin Review',
        does: 'Authorise for billing on the AM List, then the PM List',
        path: (s) => reviewPath(s, SEED_LIST_IDS.souterMon20Am),
      },
      {
        beat: 'A discount line and a $0 invoice',
        label: 'Beat 2 · Admin Review, Mon 16 Nov',
        does: 'The $0 Booking raises a no-charge invoice when the List is authorised',
        path: (s) => {
          const id = markerId('noChargeBooking')
          return reviewPath(s, id === undefined ? undefined : s.schedule.bookings[id]?.listId)
        },
      },
      {
        beat: 'The Xero pair',
        label: 'Beat 3 · Xero pair, after authorise',
        does: "AA-2026-0005, nib's share, with its payable",
        path: feeSplitXeroPath,
      },
      {
        beat: 'Payment, ledger and disbursement',
        label: 'Beat 4 · Billing monitor',
        does: 'The payment in from Xero and the payout, by anaesthetist',
        path: () => '/admin/billing',
      },
      {
        beat: 'The weekly payment run',
        label: 'Beat 5 · Billing monitor',
        does: 'Demo actions → Stage a payment week, approve its BCTIs, then the remittance advice',
        path: () => '/admin/billing',
      },
      {
        beat: "AA's monthly fee run",
        label: 'Beat 6 · AA fee invoices',
        does: 'Demo actions → Seed a month of BCTIs, then Run monthly fee invoices',
        path: () => '/admin/billing/aa-fees',
      },
      {
        beat: 'The ledger balances',
        label: 'Beat 7 · Admin Ledger',
        does: 'Demo actions → Inject unmatched receipt, then Allocate to invoice',
        path: () => '/admin/ledger',
      },
    ],
  },
  {
    id: 'S4',
    title: 'S4 · Exceptions',
    blurb:
      "A prepaid Contract's prepayment from invoice to transfer, a prepaid Booking cancelled, events and an additional invoice, a billing failure retried, a credit and rebill netted on the remittance advice, and the warning as the date nears.",
    stage: (api) => {
      resetFirst(api)
      return { ok: true, message: `${NOTHING_STAGED} ${FOLLOW_THE_BEATS}` }
    },
    beats: [
      {
        beat: 'Prepayment from a prepaid Contract',
        label: 'Beat 1 · Admin Booking, Annette Riley',
        does: 'Approve on Invoices, Approve and send, then Demo actions → Payment received · half',
        path: (s) => adminBookingPath(s, markerId('prepaymentBooking')),
      },
      {
        beat: 'The prepaid Procedure billed',
        label: 'Beat 2 · Admin Review, after Fri 27 Nov PM is submitted',
        does: 'Dr Souter submits the List on Mobile, then Authorise for billing for the transfer',
        path: (s) => (listIsAtLeastSubmitted(s, SEED_LIST_IDS.prepaymentPaidList) ? reviewPath(s, SEED_LIST_IDS.prepaymentPaidList) : null),
      },
      {
        beat: 'Cancelling a prepaid Booking',
        label: 'Beat 3 · Admin Booking, Annette Riley',
        does: 'Cancel booking with a reason, then Rebook with another anaesthetist',
        path: (s) => adminBookingPath(s, markerId('prepaymentBooking')),
      },
      {
        beat: 'Events on a Procedure, on no List',
        label: 'Beat 4 · Admin Review, Tue 17 Nov AM',
        does: 'Demo actions → Stage post-op scenario',
        path: (s) => reviewPath(s, S4_POST_OP_LIST_ID),
      },
      {
        beat: 'An additional invoice to any party',
        label: 'Beat 5 · Admin Booking, after Stage post-op scenario',
        does: 'Create additional invoice, approve it in Review, then Demo actions → Run the next billing run',
        path: (s) =>
          s.schedule.lists[S4_POST_OP_LIST_ID]?.state === 'AUTHORISED' ? adminBookingPath(s, liveBookingOn(s, S4_POST_OP_LIST_ID, 'Mitchell')?.id) : null,
      },
      {
        beat: 'Billing failure and retry',
        label: 'Beat 6 · Billing monitor',
        does: 'Demo actions → Trigger billing failure, then Retry now on its queue row',
        path: () => '/admin/billing',
      },
      {
        beat: 'The credit note and credit and rebill',
        label: 'Beat 7 · Admin invoice, after Stage post-op scenario',
        does: 'Demo actions → Stage refund after payout, then Credit in full and rebill',
        path: (s) => invoicePath(standardInvoicesFor(s, liveBookingOn(s, S4_POST_OP_LIST_ID, 'Mitchell')?.id)[0]),
      },
      { beat: 'The date approaches', label: 'Beat 8 · Admin Day', does: 'Demo actions → Move to 2 days before procedure', path: adminDayPath },
    ],
  },
  {
    id: 'S5',
    title: 'S5 · Compliance tour',
    blurb:
      "David Chen's audit trail with a grouped office save and a claimed modifier, the NHI at entry and never in Xero, and Dr Whitaker's Fri 20 Nov invoices raised from each Procedure's locked pricing.",
    stage: (api) => {
      resetFirst(api)
      return stageCompliance(api)
    },
    beats: [
      {
        beat: 'The audit trail',
        label: 'Beat 1 · Admin Booking History, David Chen',
        does: "History, then View as at on Kirsty W.'s save",
        path: (s) => adminBookingPath(s, markerId('overriddenTimeUnitsBooking')),
      },
      {
        beat: 'NHI at entry',
        label: 'Beat 2 · Admin Patients, Waiting for NHI',
        does: 'Demo actions → Receive list with a missing NHI; on an NHI lookup, Demo actions → Hub: Available / Slow / Unavailable',
        path: () => '/admin/intake/waiting',
      },
      { beat: 'No NHI in Xero, and the leak scan', label: 'Beat 3 · Data inspector', does: 'Demo actions → Scan for NHI leaks', path: () => '/demo/data' },
      {
        beat: "The lock and each Contract's history",
        label: 'Beat 4 · Master data, Contracts',
        does: 'Health NZ agreed rate, then its History',
        path: () => contractPath(CONTRACT.healthNz),
      },
      {
        beat: 'Authorise, then edit the rate per unit',
        label: 'Beat 5 · Admin Review, Mon 23 Nov AM',
        does: "Authorise for billing, change Dr Souter's rate per unit on Master data, then Demo actions → Regenerate from locked data",
        path: (s) => reviewPath(s, SEED_LIST_IDS.souterMon20Am),
      },
    ],
  },
]

/** A scenario by id (the capture step's `{ "scenario": "Sn" }`). */
export function demoScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id)
}

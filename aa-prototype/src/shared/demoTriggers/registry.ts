/**
 * The demo-trigger registry (catch-up Phase 14): every demo action, on the
 * screen it belongs to. The harness bar's "Demo actions" menu and the installed
 * PWA's Demo sheet show the entries for the current route; the Control Panel
 * lists them all as the index.
 *
 * The bodies of the re-homed entries are the Control Panel's handlers moved
 * verbatim: same store calls, actors, guards, idempotency keys and messages.
 * Only where they show and how they find their target changed. An entry acts on
 * the entity in the URL or on published screen state wherever it can; a
 * seed-scoped entry names its seed constant and gates itself with `when`.
 *
 * Pure TypeScript over the store and the domain: nothing here imports
 * `src/apps/*` or `src/shell/*`, because the PWA closure contains it.
 */

import {
  replaceProcedureText,
  AA_FEE_RUN_ACTOR,
  BCTI_SEED_MONTH,
  BCTI_SEED_TARGET,
  DEMO_TRIGGER_ACTOR,
  OFFICE_ACTOR,
  OFFICE_SIMULATION_ACTOR,
  aaFeePaymentDisabledReason,
  aaFeeRunDisabledReason,
  allAaFeeInvoices,
  recordAaFeePayment,
  runMonthlyFeeInvoices,
  seedBctisDisabledReason,
  seedMonthOfBctis,
  WARNING_RULE_COUNT,
  allSampleClearRefusal,
  clearAllSamples,
  clearSamplesFor,
  clearWarning,
  daySampleRaiseRefusal,
  raiseDaySamples,
  raiseSamplesOn,
  sampleClearRefusal,
  sampleRaiseRefusal,
  skippedSampleNotes,
  warningsForBooking,
  armHandoffFault,
  assignNextFreeSlotAsSimulatedOffice,
  addOutOfHoursListAsSimulatedOffice,
  outOfHoursStandInRefusal,
  authoriseAsSimulatedOffice,
  nextOpenSlotFor,
  STAND_IN_ASSIGN_CHOICES,
  officeStandInRefusal,
  authoriseList,
  setProcedureContract,
  railContextForList,
  railMastersOf,
  ingestPdfRow,
  openAccRecs,
  processMessage,
  receivePayment,
  runArchiveJob,
  runReconciliationPoll,
  simulateSignInAttempts,
  submitList,
  slotFor,
  listInSlot,
  addDraftListForDay,
  assignDraftListAsSimulatedOffice,
  cannedRequestDay,
  dayDraftListRefusal,
  incomingRequestRefusal,
  simulateIncomingDraftListRequest,
  stageRecurringClash,
  stageableRecurringBookings,
  stagedAlready,
  type AppState,
  type AppStoreApi,
  BUSY_MORNING_MOVES,
  colleagueMoveRefusal,
  moveToPersonaRefusal,
  stageBusyMorning,
  stageColleagueMoveToOffice,
  stageColleagueMoveToPersona,
  bookingMoveCandidates,
  bookingMoveCandidateRefusal,
  stageColleagueBookingMove,
  closedColleagueSessions,
  officeResolvesAlert,
  officeResolvesAlertRefusal,
  approveContractChangeAsSimulatedOffice,
  approveContractRefusal,
  makeAvailableRefusal,
  makeSessionAvailableAsColleague,
  stageMultiProcedureBooking,
  multiProcedureLoadRefusal,
  nextOpenSouterList,
  feedChangesPrimary,
  feedChangesPrimaryRefusal,
  BACKDATED_RANGE_CONTRACT_ID,
  addBackdatedRangeDemo,
  backdatedRangeAdded,
} from '../../store'
import { CANNED_MESSAGES, SURGEON_PDFS } from '../../domain/integrations'
import { contractCandidatesFor, destinationOf } from '../../domain/billing/contractRail'
import { noContractRvg } from '../../domain/billing/contracts'
import { ANAE, CANNED_DAY_DRAFT_LISTS, CANNED_DRAFT_LIST_REQUESTS, CONTRACT, SEED_LIST_IDS, SEED_WARNING_SAMPLE_BOOKINGS } from '../../domain/seed'
import { MULTI_PROCEDURE_DEMO } from '../../domain/seed/multiProcedureDemo'
import { DRAFT_LIST, DRAFT_LISTS, SOURCE_LABELS } from '../scheduleTerms'
import { projectedListId } from '../../domain/slots'
import { SEED_STATUS, statusFor } from '../../domain/slotStatus'
import { roundToCents } from '../../domain/billing/money'
import { aaFeeFor, aaFeeMonthLabel } from '../../domain/billing/aaFee'
import { drSurname, formatCurrency, plural, shortDay } from '../format'
import { isAssignedList } from '../../domain/draftLists'
import { useDemoTriggerMemory } from './memory'
import { simulateSickness, sicknessCandidates, sicknessColleagueSlot, sicknessRefusal, type SicknessRoute } from '../../store/demoSimulations'
import type { DemoTrigger, DemoTriggerCtx, DemoTriggerResult } from './types'
import { sessionText } from '../../domain/outOfHours'
import { newerInvoiceDescription } from '../../domain/billing/procedureStack'
import {
  cannedMessageForBooking,
  defaultHospitalDescription,
  primaryProcedureOf,
  hospitalDescriptionChoices,
  hospitalDescriptionOutcome,
  hospitalDescriptionRefusal,
  hospitalDescriptionText,
} from './procedureTextTriggers'

// ---------------------------------------------------------------------------
// Route patterns (checked against `src/router.tsx` and `pwa/main.tsx`)
// ---------------------------------------------------------------------------

const BILLING_MONITOR = ['/admin/billing'] as const
/** The Billing monitor's index heading (the Control Panel adds its Run payables note under it). */
export const BILLING_MONITOR_SCREEN = 'Admin · Billing monitor'
const XERO_SIM = ['/demo/xero', '/demo/xero/invoices', '/demo/xero/invoices/:accRecId'] as const
const INVOICE_PAGES = ['/admin/invoices/:invoiceId', '/demo/xero/invoices/:accRecId'] as const
const ADMIN_INTEGRATIONS = '/admin/integrations'
const AA_FEE_INVOICES = '/admin/billing/aa-fees'
const XERO_PAIR = '/demo/xero/invoices/:accRecId'
const INTEGRATIONS_SIM = '/demo/integrations'
/** The mobile Lists tab is one splat route; registered as its three explicit layers (`listsStackLocation`). */
const MOBILE_LISTS = ['/mobile/lists', '/mobile/lists/:listId', '/mobile/lists/:listId/bookings/:bookingId'] as const
const ADMIN_DAY = '/admin/day/:dateISO'
const ADMIN_DRAFT_LISTS = '/admin/draft-lists'
const ADMIN_MASTERS = '/admin/masters'
const ADMIN_NOTIFICATIONS = '/admin/notifications'
const MOBILE_AVAILABILITY = '/mobile/availability'
/** A date route param, or undefined. */
const isoParam = (v: string | undefined) => (v !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** "St George's · Mr S. Tan" from the masters. */
function pairingOf(state: AppState, hospitalId: string, surgeonId: string): string {
  return `${state.masters.hospitals[hospitalId]?.name ?? hospitalId} · ${state.masters.surgeons[surgeonId]?.name ?? surgeonId}`
}
const ADMIN_CONFLICTS = '/admin/conflicts'
/** The hospital's download, as the demo stands it in (catch-up Phase 20a): an integration write, so a locked List refuses it. */
const HOSPITAL_DOWNLOAD_ACTOR = { who: 'Hospital booking download', role: 'system' as const, source: 'integration' as const }
const ADMIN_BOOKING = '/admin/day/:dateISO/bookings/:bookingId'
const MOBILE_BOOKING = '/mobile/lists/:listId/bookings/:bookingId'
const WEB_BOOKING = '/web/lists/:listId/bookings/:bookingId'
/** Where the sample warnings show (Admin in the bar; the mobile Booking in the bar and the PWA). */
const SAMPLE_WARNING_ROUTES = [ADMIN_DAY, ADMIN_BOOKING, MOBILE_BOOKING] as const

// ---------------------------------------------------------------------------
// Seed-scoped targets
// ---------------------------------------------------------------------------

/** Stage post-op: Dr Sharma's Tue 14 Jul AM List (Sarah Mitchell's first episode). */
export const POST_OP_ORIGINAL_LIST_ID = projectedListId(ANAE.sharma, '2026-07-14', 'AM')

/** The List in a surgeon PDF's target session (catch-up Phase 28: a session may hold none). */
function pdfTargetListId(
  state: AppState,
  pdf: { targetList: { anaesthetistId: string; dateISO: string; session: 'AM' | 'PM' } },
): string | undefined {
  const slot = slotFor(state, pdf.targetList.anaesthetistId, pdf.targetList.dateISO, pdf.targetList.session)
  return slot === undefined ? undefined : listInSlot(state, slot.id)?.id
}

/** The ingest-PDF sample: the first surgeon PDF's reviewed row R2. */
function samplePdfRow() {
  const pdf = SURGEON_PDFS[0]
  const row = pdf?.rows.find((r) => r.id === 'R2')
  return pdf === undefined || row === undefined ? undefined : { pdf, row }
}

const DEFAULT_MESSAGE_ID = CANNED_MESSAGES[0]?.id ?? 'MSG-STG-1001'

// ---------------------------------------------------------------------------
// Payments: one body for the bar's invoice pages and the PWA's Balances
// ---------------------------------------------------------------------------

/**
 * Record the anaesthetist's payment of a fee invoice: the one body behind the
 * "Record fee payment" trigger and the fee pair's in-page button.
 */
export function recordFeePaymentFor(api: AppStoreApi, aaFeeInvoiceId: string | undefined): DemoTriggerResult {
  const reason = aaFeePaymentDisabledReason(api.getState(), aaFeeInvoiceId)
  if (reason !== null || aaFeeInvoiceId === undefined) return { ok: false, message: reason ?? 'Not an AA fee invoice' }
  const fee = api.getState().billing.aaFeeInvoices[aaFeeInvoiceId]!
  const res = recordAaFeePayment(api, { aaFeeInvoiceId, idempotencyKey: `FEE-PAY-${aaFeeInvoiceId}` })
  if (!res.ok) return { ok: false, message: `Refused: ${res.message}` }
  return {
    ok: true,
    message: res.value.applied
      ? `${fee.invoiceNumber} paid: ${formatCurrency(fee.total - fee.amountReceived)} received into AA's own account.`
      : 'No change (already paid).',
  }
}

/** True on a Xero pair whose ACCREC is AA's own fee invoice (catch-up Phase 16). */
function isFeePairOnScreen(state: AppState, ctx: DemoTriggerCtx): boolean {
  const accRecId = ctx.params['accRecId']
  return accRecId !== undefined && state.xero.accRecs[accRecId]?.kind === 'aaFee'
}

/** The AA fee invoice behind the fee pair on screen. */
function feeInvoiceIdOnScreen(state: AppState, ctx: DemoTriggerCtx): string | undefined {
  const accRec = state.xero.accRecs[ctx.params['accRecId'] ?? '']
  return accRec?.kind === 'aaFee' ? accRec.invoiceId : undefined
}

/** The month in the AA fee invoices picker (default the demo clock's month). */
function feeMonthOnScreen(state: AppState, ctx: DemoTriggerCtx): string {
  return ctx.published['aaFees.month'] ?? state.clock.todayISO.slice(0, 7)
}

/** The ACCREC on screen: the URL's `accRecId`, or the ACCREC of the URL's `invoiceId`. */
function accRecIdOnScreen(state: AppState, ctx: DemoTriggerCtx): string | undefined {
  const fromUrl = ctx.params['accRecId']
  if (fromUrl !== undefined) return fromUrl
  const invoiceId = ctx.params['invoiceId']
  if (invoiceId === undefined) return undefined
  return Object.values(state.xero.accRecs).find((r) => r.invoiceId === invoiceId)?.id
}

/** Why a webhook cannot be sent for `accRecId`, or null. The target must be an `openAccRecs` row, as on the Control Panel. */
export function paymentDisabledReason(state: AppState, accRecId: string | undefined): string | null {
  if (accRecId === undefined) return 'Not handed off to Xero'
  const accRec = state.xero.accRecs[accRecId]
  if (accRec === undefined) return 'Not handed off to Xero'
  if (roundToCents(accRec.amountDue - accRec.amountReceived) <= 0) return 'Fully paid'
  if (!openAccRecs(state).some((c) => c.accRecId === accRecId)) return 'Seeded history invoice'
  return null
}

/**
 * The next free `<n>` for `WEBHOOK-<accRecId>-<n>`. The key format is the
 * Control Panel's; `n` also skips any key the receipts already hold, so a
 * reload (which forgets the counter) never reuses a key and lands a silent no-op.
 */
function nextWebhookN(state: AppState, accRecId: string): number {
  const prefix = `WEBHOOK-${accRecId}-`
  let used = 0
  for (const r of Object.values(state.billing.receipts)) {
    if (!r.idempotencyKey.startsWith(prefix)) continue
    const n = Number(r.idempotencyKey.slice(prefix.length))
    if (Number.isInteger(n) && n > used) used = n
  }
  return Math.max(used, useDemoTriggerMemory.getState().webhookCounter) + 1
}

/** Simulate a Xero payment webhook, full or half, exactly as the Control Panel's "Record payment" did. */
export function sendPaymentWebhook(api: AppStoreApi, accRecId: string | undefined, mode: 'full' | 'partial'): DemoTriggerResult {
  const state = api.getState()
  const reason = paymentDisabledReason(state, accRecId)
  const active = openAccRecs(state).find((c) => c.accRecId === accRecId)
  if (reason !== null || active === undefined) return { ok: false, message: reason ?? 'Not handed off to Xero' }
  const partial = roundToCents(active.remaining / 2)
  const amount = mode === 'partial' && partial > 0 ? partial : active.remaining
  const n = nextWebhookN(state, active.accRecId)
  const key = `WEBHOOK-${active.accRecId}-${n}`
  const res = receivePayment(api, { accRecId: active.accRecId, amount, idempotencyKey: key, source: 'webhook' })
  useDemoTriggerMemory.getState().rememberWebhook({ accRecId: active.accRecId, key, amount }, n)
  return {
    ok: res.ok,
    message: res.ok
      ? res.value.applied
        ? `Webhook for ${active.invoiceNumber}: ${formatCurrency(amount)} received, the paired ACCPAY is authorised for exactly ${formatCurrency(amount)}.`
        : 'No change (already fully paid).'
      : `Refused: ${res.message}`,
  }
}

/**
 * A replay re-sends a webhook Xero already delivered, so its key must still be
 * in the receipts. Checking the ACCREC alone is not enough: ids restart from
 * the counters after a reset, so the same `XR0001` can come back as a new
 * invoice, and replaying the forgotten key would land a real payment on it.
 */
function replayDisabledReason(state: AppState): string | null {
  const last = useDemoTriggerMemory.getState().lastWebhook
  if (last === null) return 'No payment event to replay yet'
  const received = Object.values(state.billing.receipts).some((r) => r.idempotencyKey === last.key)
  if (state.xero.accRecs[last.accRecId] === undefined || !received) return 'The last payment event was cleared by a reset'
  return null
}

/** The PWA's Balances choices: Dr Souter's open invoices (the demo-surface exemption `openAccRecs` documents). */
function souterOpenAccRecs(state: AppState) {
  return openAccRecs(state).filter((c) => {
    const invoice = state.billing.invoices[c.invoiceId]
    const booking = invoice !== undefined ? state.schedule.bookings[invoice.bookingId] : undefined
    const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
    return list?.anaesthetistId === ANAE.souter
  })
}

function souterPaymentChoices(state: AppState) {
  return souterOpenAccRecs(state).map((c) => ({
    id: c.accRecId,
    label: `${c.invoiceNumber} · ${c.patientName} · ${formatCurrency(c.remaining)} due`,
  }))
}

function souterPaymentDisabled(state: AppState, choiceId: string | undefined): string | null {
  if (souterOpenAccRecs(state).length === 0) return 'No open invoices yet'
  if (choiceId === undefined) return 'Choose an invoice'
  return paymentDisabledReason(state, choiceId)
}

/**
 * A message replay must find the message already in the integration log, or it
 * is not a replay: after a reset the same canned id would be processed afresh
 * and create its Booking again instead of showing the dedupe.
 */
function messageReplayDisabledReason(state: AppState): string | null {
  const last = useDemoTriggerMemory.getState().lastMessageId
  if (last === null) return 'Fire a message first'
  if (!Object.values(state.integrations.messages).some((m) => m.messageControlId === last)) {
    return 'The last message was cleared by a reset: fire it again first'
  }
  return null
}

/** Where the payment entries' "Open screen" goes: the first open invoice, if any. */
function firstOpenInvoicePath(state: AppState): string | null {
  const first = openAccRecs(state)[0]
  return first === undefined ? null : `/admin/invoices/${first.invoiceId}`
}

// ---------------------------------------------------------------------------
// Sample warnings (catch-up Phase 15a): bodies in `store/warningSamples.ts`
// ---------------------------------------------------------------------------

/** The rule count, said honestly (catch-up Phase 19 registered the second rule). */
const RULES_NOTE = `${plural(WARNING_RULE_COUNT, 'rule')} registered.`

function raiseSampleDisabled(state: AppState, ctx: DemoTriggerCtx): string | null {
  const bookingId = ctx.params['bookingId']
  return bookingId === undefined ? daySampleRaiseRefusal(state) : sampleRaiseRefusal(state, bookingId)
}

function clearSampleDisabled(state: AppState, ctx: DemoTriggerCtx): string | null {
  const bookingId = ctx.params['bookingId']
  return bookingId === undefined ? allSampleClearRefusal(state) : sampleClearRefusal(state, bookingId)
}

/** The Booking's open warnings, as the PWA stand-in's choices. */
function openWarningChoices(state: AppState, ctx: DemoTriggerCtx) {
  return warningsForBooking(state, ctx.params['bookingId'] ?? '')
    .filter((w) => w.clearance === undefined)
    .map((w) => ({ id: w.key, label: w.text }))
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

/** Dr Souter's Tue 21 PM List: open, and already used by the catalogue recipes. */
const PHOTO_CAPTURE_INDEX_LIST_ID = SEED_LIST_IDS.souterPm21

/** The photo demo adds a Booking, so it needs a List still open for new Bookings. */
function photoCaptureDisabledReason(state: AppState, listId: string): string | null {
  const list = state.schedule.lists[listId]
  if (list === undefined) return 'List not found'
  if (list.state !== 'ACTIVE') return 'This List is no longer open for new Bookings'
  return null
}


/** Simulate sickness: the viewed day's Lists (the Day view's date; on Conflicts, today), Lists with Bookings first. */
/**
 * One choice per candidate List "to the office" (an ACTIVE List), and "to Dr X"
 * when an open colleague exists (the office's first pick: tier, then
 * preferred pairing). Ids are `<listId>|office` or `<listId>|colleague`.
 */
function sicknessChoices(state: AppState, ctx: DemoTriggerCtx): { id: string; label: string }[] {
  const dateISO = ctx.params['dateISO'] ?? state.clock.todayISO
  return sicknessCandidates(state, dateISO).flatMap((l) => {
    const head = `${drSurname(state.masters.anaesthetists[l.anaesthetistId]?.name ?? l.anaesthetistId)} · ${sessionText(l.session)} · ${state.masters.hospitals[l.hospitalId]?.name ?? l.hospitalId}`
    const out: { id: string; label: string }[] = []
    if (l.state === 'ACTIVE') out.push({ id: `${l.id}|office`, label: `${head}, to the office` })
    const toSlotId = sicknessColleagueSlot(state, l.id)
    const to = toSlotId !== undefined ? state.schedule.slots[toSlotId] : undefined
    if (to !== undefined) out.push({ id: `${l.id}|colleague`, label: `${head}, to ${drSurname(state.masters.anaesthetists[to.anaesthetistId]?.name ?? to.anaesthetistId)}` })
    return out
  })
}

function sicknessChoiceParts(choiceId: string): { listId: string; route: SicknessRoute } {
  const [listId = '', route] = choiceId.split('|')
  return { listId, route: route === 'colleague' ? 'colleague' : 'office' }
}

/** Closed, empty colleague sessions for the List an open picker is assigning or moving (the stand-in's choices). */
function makeAvailableChoices(state: AppState, ctx: DemoTriggerCtx): { id: string; label: string }[] {
  const listId = ctx.published['adminPicker.listId']
  if (listId === undefined) return []
  return closedColleagueSessions(state, listId).map((slotId) => {
    const slot = state.schedule.slots[slotId]!
    return { id: slotId, label: `${drSurname(state.masters.anaesthetists[slot.anaesthetistId]?.name ?? slot.anaesthetistId)}, ${shortDay(slot.dateISO)} ${sessionText(slot.session)}` }
  })
}

/**
 * The Contracts the office stand-in sets on a Booking's Procedures with none
 * (catch-up Phase 20): the List's hospital's first Contract on offer, else
 * No contract · RVG. Read through the step rail's own rules.
 */
function officeContractPicks(state: AppState, bookingId: string): { procedureId: string; contractId: string }[] {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined || booking.cancellation !== undefined) return []
  if (list.state === 'AUTHORISED') return []
  const masters = railMastersOf(state)
  const ctx = railContextForList(state, list)
  const hospitalFirst = contractCandidatesFor(masters, ctx).find((c) => destinationOf(c, masters.parties).kind === 'hospital')
  const contractId = hospitalFirst?.id ?? noContractRvg(masters.contracts).id
  return Object.values(state.schedule.procedures)
    .filter((p) => p.bookingId === bookingId && p.governingContractId === undefined)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => ({ procedureId: p.id, contractId }))
}

export const DEMO_TRIGGERS: readonly DemoTrigger[] = [
  // ── Admin · Billing monitor ───────────────────────────────────────────
  {
    id: 'billing-failure',
    label: 'Trigger billing failure',
    description:
      "Points Losa Tuilagi's Procedure at the COS ACC fixed fees Contract, whose price starts on 1 Aug 2026, and authorises Dr Ropata's Thu 16 Jul List. Her Booking fails with Needs a price; its clean sibling still invoices.",
    screen: BILLING_MONITOR_SCREEN,
    routes: BILLING_MONITOR,
    surfaces: ['bar'],
    when: (state) => state.schedule.lists[SEED_LIST_IDS.billingFailure] !== undefined,
    disabledReason: (state) =>
      state.schedule.lists[SEED_LIST_IDS.billingFailure]?.billedAtISO !== undefined ? 'Already triggered' : null,
    // Re-based in catch-up Phase 18 (RV-32: no dates, and no Contract is
    // edited): point Losa Tuilagi's Procedure at COS ACC fixed fees (no price
    // range in force on her List's date, so never a step-rail candidate:
    // catch-up Phase 20 stages it through the rail's audited demo path), then
    // authorise as the office; the run fails her Booking and bills its sibling.
    run: (api) => {
      const listId = SEED_LIST_IDS.billingFailure
      const list = api.getState().schedule.lists[listId]
      if (list === undefined) return { ok: false, message: 'The billing-failure list is not present in this seed.' }
      if (list.billedAtISO !== undefined) {
        return { ok: false, message: 'Already triggered. Use Resolve & retry on the failed booking in the billing monitor.' }
      }
      if (list.state === 'ACTIVE') submitList(api, OFFICE_ACTOR, listId)
      const { procedures, bookings } = api.getState().schedule
      const losa = Object.values(procedures).find(
        (p) => p.governingContractId === CONTRACT.cosAcc && bookings[p.bookingId]?.listId === listId,
      )
      if (losa !== undefined) {
        const pointed = setProcedureContract(api, DEMO_TRIGGER_ACTOR, losa.id, CONTRACT.cosFixed, { demoStage: true })
        if (!pointed.ok) return { ok: false, message: `Refused: ${pointed.message}` }
      }
      const outcome = authoriseList(api, OFFICE_ACTOR, listId)
      return {
        ok: outcome.ok,
        message: outcome.ok
          ? 'Done. In the billing monitor Losa Tuilagi shows Needs a price while her clean sibling billed. Use Resolve & retry to choose her Contract.'
          : `Refused: ${outcome.message}`,
      }
    },
    indexPath: () => '/admin/billing',
  },
  {
    id: 'arm-handoff-fault',
    label: 'Arm handoff failure',
    description:
      'Arms the next ACCREC/ACCPAY handoff to fault once. Then authorise a List: the monitor shows the fault with a Resolve & retry.',
    screen: BILLING_MONITOR_SCREEN,
    routes: BILLING_MONITOR,
    surfaces: ['bar'],
    disabledReason: (state) => (state.settings.failNextHandoff === true ? 'Armed' : null),
    run: (api) => {
      armHandoffFault(api, OFFICE_ACTOR)
      return { ok: true, message: 'Armed. The next Xero handoff will fault once, then clear.' }
    },
    indexPath: () => '/admin/billing',
  },
  {
    id: 'run-reconciliation-poll',
    label: 'Run reconciliation poll',
    description:
      'Runs the daily missed-webhook safety net now, without advancing the clock. Also in the Xero simulation.',
    screen: BILLING_MONITOR_SCREEN,
    routes: [...BILLING_MONITOR, ...XERO_SIM],
    surfaces: ['bar'],
    disabledReason: () => null,
    run: (api) => {
      const n = runReconciliationPoll(api)
      return {
        ok: true,
        message:
          n > 0
            ? `Reconciliation poll applied ${plural(n, 'previously-missed payment')}.`
            : 'Reconciliation poll ran: no unmirrored payments to catch.',
      }
    },
    indexPath: () => '/admin/billing',
  },
  {
    id: 'run-archive-job',
    label: 'Run archive job',
    description:
      'Runs the nightly Xero contact-archive job now, without advancing the clock. Also in the Xero simulation.',
    screen: BILLING_MONITOR_SCREEN,
    routes: [...BILLING_MONITOR, ...XERO_SIM],
    surfaces: ['bar'],
    disabledReason: () => null,
    run: (api) => {
      const res = runArchiveJob(api)
      if (!res.ok) return { ok: false, message: `Refused: ${res.message}` }
      return {
        ok: true,
        message:
          res.value.count > 0
            ? `Archive job archived ${plural(res.value.count, 'inactive Xero contact')}.`
            : 'Archive job ran: no contacts past the inactivity window yet.',
      }
    },
    indexPath: () => '/admin/billing',
  },

  // ── Admin · Audit ─────────────────────────────────────────────────────
  {
    id: 'simulate-sign-in',
    label: 'Simulate sign-in attempts',
    description:
      'Adds five audited account rows: an account provisioned with no credential access, an Admin sign-in with MFA passed, a failed sign-in, a self-service password reset and a social-login sign-in on mobile.',
    screen: 'Admin · Audit',
    routes: ['/admin/audit'],
    surfaces: ['bar'],
    disabledReason: () => null,
    run: (api) => {
      const res = simulateSignInAttempts(api)
      return {
        ok: res.ok,
        message: res.ok
          ? `Added ${res.value.rows} sign-in rows to the audit log. Set Entity type to account to see them together. The identity service itself is simulated: the proposal is Auth0 or Entra External ID.`
          : `Refused: ${res.message}`,
      }
    },
    indexPath: () => '/admin/audit',
  },

  // ── Admin · Booking detail: a hospital description arrives (catch-up Phase 20a) ──
  {
    id: 'hospital-description-arrives',
    label: 'Hospital description arrives',
    description:
      "The hospital's download brings a description for the Booking on screen (AR-35's illustrative wording, not AA's), through the one replace path: the procedure text becomes the hospital's and the rooms' goes to the History. The invoice description follows it, unless the Contract's own description or an office edit holds; an edit then shows a newer description cue. Try it on Wiremu Tane's lap chole (Dr Souter, Tue 21 PM).",
    screen: 'Admin · Booking detail',
    routes: [ADMIN_BOOKING],
    surfaces: ['bar'],
    choices: () => hospitalDescriptionChoices().map(({ id, label }) => ({ id, label })),
    defaultChoice: (state, ctx) => defaultHospitalDescription(primaryProcedureOf(state, ctx.params['bookingId'])),
    disabledReason: (state, ctx, choiceId) =>
      hospitalDescriptionRefusal(
        primaryProcedureOf(state, ctx.params['bookingId']),
        hospitalDescriptionText(choiceId ?? defaultHospitalDescription(primaryProcedureOf(state, ctx.params['bookingId']))),
      ),
    run: (api, ctx, choiceId) => {
      const procedure = primaryProcedureOf(api.getState(), ctx.params['bookingId'])
      const text = hospitalDescriptionText(choiceId ?? defaultHospitalDescription(procedure))
      const refused = hospitalDescriptionRefusal(procedure, text)
      if (refused !== null || procedure === undefined || text === undefined) return { ok: false, message: refused ?? 'Nothing to replace.' }
      const state = api.getState()
      const booking = state.schedule.bookings[procedure.bookingId]
      const hospitalId = booking !== undefined ? state.schedule.lists[booking.listId]?.hospitalId : undefined
      const from = hospitalId !== undefined ? state.masters.hospitals[hospitalId]?.name : undefined
      const hadText = procedure.procedureText !== null
      const res = replaceProcedureText(api, HOSPITAL_DOWNLOAD_ACTOR, procedure.id, { text, source: 'hospitalDownload', ...(from !== undefined ? { from } : {}) })
      if (!res.ok) return { ok: false, message: `Refused: ${res.message}` }
      const after = api.getState().schedule.procedures[procedure.id]
      const cue = after !== undefined && newerInvoiceDescription(after, api.getState().masters.contracts) !== undefined
      return { ok: true, message: hospitalDescriptionOutcome(text, after?.invoiceDescription?.origin, cue, hadText) }
    },
    indexPath: () => '/admin/day/2026-07-21/bookings/BK0006',
  },

  // ── Admin · Review and Booking detail (seed-scoped) ──────────────────────
  {
    id: 'stage-post-op',
    label: 'Stage post-op scenario',
    description:
      'Submits and authorises Dr Sharma\'s Tue 14 Jul AM List, so "Add post-op event" can run on its locked Booking. It lands on a new List in her free Tue 21 PM session.',
    screen: 'Admin · Review and Booking detail',
    routes: ['/admin/review/:listId', '/admin/day/:dateISO/bookings/:bookingId'],
    surfaces: ['bar'],
    when: (state, ctx) => {
      const listId = ctx.params['listId'] ?? state.schedule.bookings[ctx.params['bookingId'] ?? '']?.listId
      return listId === POST_OP_ORIGINAL_LIST_ID && state.schedule.lists[listId] !== undefined
    },
    disabledReason: (state) =>
      state.schedule.lists[POST_OP_ORIGINAL_LIST_ID]?.state === 'AUTHORISED'
        ? 'Already staged: use Add post-op event on the Booking'
        : null,
    // Phase 09 demo trigger: authorise (lock + bill) an original episode and keep
    // a free empty session today for its anaesthetist, so "Add post-op event" on
    // the locked booking has somewhere to land.
    run: (api) => {
      const listId = POST_OP_ORIGINAL_LIST_ID
      const list = api.getState().schedule.lists[listId]
      if (list === undefined) return { ok: false, message: 'The post-op original list is not present in this seed.' }
      if (list.state === 'ACTIVE') submitList(api, OFFICE_ACTOR, listId)
      const submitted = api.getState().schedule.lists[listId]
      if (submitted?.state === 'SUBMITTED') authoriseList(api, OFFICE_ACTOR, listId)
      return {
        ok: true,
        message:
          'Done. Dr Sharma\'s Tue 14 Jul list is authorised and locked. In the Admin day view jump to Tue 14, open its booking and use "Add post-op event"; it lands on a new List in her free Tue 21 PM session.',
      }
    },
    indexPath: () => `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`,
  },

  // ── Admin · Integrations, Surgeon PDFs tab ────────────────────────────
  {
    id: 'ingest-pdf-row',
    label: 'Ingest PDF row',
    description:
      'A surgeon\'s emailed PDF arrives: ingests its reviewed row R2 onto Dr Souter\'s Mon 27 Jul AM List, deduped by NHI. Re-firing updates the same Booking.',
    screen: 'Admin · Integrations',
    routes: [ADMIN_INTEGRATIONS],
    surfaces: ['bar'],
    when: (_state, ctx) => ctx.published['integrations.tab'] === 'pdfs',
    disabledReason: (state) => {
      const sample = samplePdfRow()
      if (sample === undefined) return 'The sample PDF row is not present in this build.'
      return pdfTargetListId(state, sample.pdf) === undefined ? "The PDF's target session has no List" : null
    },
    run: (api) => {
      const sample = samplePdfRow()
      if (sample === undefined) return { ok: false, message: 'The sample PDF row is not present in this build.' }
      const { pdf, row } = sample
      const listId = pdfTargetListId(api.getState(), pdf)
      if (listId === undefined) return { ok: false, message: "The PDF's target session has no List." }
      const res = ingestPdfRow(api, OFFICE_ACTOR, listId, row)
      return {
        ok: res.ok,
        message: res.ok
          ? `${res.value.outcome === 'created' ? 'Created' : 'Updated'} a Booking for ${row.name} on Dr Souter's Mon 27 Jul AM List from ${pdf.fromSurgeon}'s emailed list. Re-firing updates the same Booking (deduped by NHI), never a duplicate. The full review-and-edit-before-ingest flow, including the deliberately mistyped NHI row, opens from the PDF in this tab.`
          : `Refused: ${res.message}`,
      }
    },
    indexPath: () => ADMIN_INTEGRATIONS,
    indexHint: 'Then open the Surgeon PDFs tab',
  },

  // ── Admin · Invoice (and the Xero sim pair) ───────────────────────────
  {
    id: 'payment-full',
    label: 'Payment received · full',
    description:
      'Simulates a Xero payment webhook for the remaining balance of the invoice on screen. Its paired ACCPAY is authorised for exactly the amount received. Also on the Xero simulation pair.',
    screen: 'Admin · Invoice',
    routes: INVOICE_PAGES,
    surfaces: ['bar'],
    // A fee payment is "Record fee payment", never a procedure webhook.
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    disabledReason: (state, ctx) => paymentDisabledReason(state, accRecIdOnScreen(state, ctx)),
    run: (api, ctx) => sendPaymentWebhook(api, accRecIdOnScreen(api.getState(), ctx), 'full'),
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'payment-half',
    label: 'Payment received · half',
    description:
      'Simulates a Xero payment webhook for half the remaining balance of the invoice on screen (a part payment). Its paired ACCPAY is authorised for exactly the amount received. Also on the Xero simulation pair.',
    screen: 'Admin · Invoice',
    routes: INVOICE_PAGES,
    surfaces: ['bar'],
    // A fee payment is "Record fee payment", never a procedure webhook.
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    disabledReason: (state, ctx) => paymentDisabledReason(state, accRecIdOnScreen(state, ctx)),
    run: (api, ctx) => sendPaymentWebhook(api, accRecIdOnScreen(api.getState(), ctx), 'partial'),
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'payment-replay',
    label: 'Replay last payment event',
    description:
      'Re-sends the last payment webhook with the same key, to show it is ignored (idempotent by key, no double effect).',
    screen: 'Admin · Invoice',
    routes: INVOICE_PAGES,
    surfaces: ['bar'],
    // A fee payment is "Record fee payment", never a procedure webhook.
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    disabledReason: (state) => replayDisabledReason(state),
    run: (api) => {
      const last = useDemoTriggerMemory.getState().lastWebhook
      const reason = replayDisabledReason(api.getState())
      if (last === null || reason !== null) return { ok: false, message: reason ?? 'No payment event to replay yet' }
      const res = receivePayment(api, { accRecId: last.accRecId, amount: last.amount, idempotencyKey: last.key, source: 'webhook' })
      return {
        ok: res.ok,
        message: res.ok && !res.value.applied ? 'Duplicate webhook ignored (idempotent by key). No double effect.' : 'Replayed.',
      }
    },
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },

  // ── Admin · AA fee invoices (catch-up Phase 16) ───────────────────────
  {
    id: 'run-scheduled-fee-run',
    label: 'Run scheduled month-end fee run',
    description:
      'Stands in for the month-end job: raises AA\'s fee invoice to every active anaesthetist not yet invoiced for the month in the picker, as the scheduled system run.',
    screen: 'Admin · AA fee invoices',
    routes: [AA_FEE_INVOICES],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => aaFeeRunDisabledReason(state, feeMonthOnScreen(state, ctx)),
    run: (api, ctx) => {
      const monthISO = feeMonthOnScreen(api.getState(), ctx)
      const res = runMonthlyFeeInvoices(api, AA_FEE_RUN_ACTOR, { monthISO })
      if (!res.ok) return { ok: false, message: `Refused: ${res.message}` }
      return {
        ok: true,
        message:
          res.value.raisedCount === 0
            ? `Nothing to raise: every active anaesthetist already has a fee invoice for ${aaFeeMonthLabel(monthISO)}.`
            : `The scheduled run raised ${plural(res.value.raisedCount, 'AA fee invoice')} for ${aaFeeMonthLabel(monthISO)}, ${formatCurrency(res.value.total)} incl GST.`,
      }
    },
    indexPath: () => AA_FEE_INVOICES,
  },
  {
    id: 'seed-month-of-bctis',
    label: 'Seed a month of BCTIs',
    description: `Tops Dr Rutherford up to ${BCTI_SEED_TARGET} BCTIs paid in ${aaFeeMonthLabel(BCTI_SEED_MONTH)} (paid and disbursed procedure invoices on 1 to 6 July), so the next fee run shows the worked example.`,
    screen: 'Admin · AA fee invoices',
    routes: [AA_FEE_INVOICES],
    surfaces: ['bar'],
    when: (state) => state.masters.anaesthetists[ANAE.rutherford] !== undefined,
    disabledReason: (state) => seedBctisDisabledReason(state, ANAE.rutherford),
    run: (api) => {
      const res = seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
      if (!res.ok) return { ok: false, message: `Refused: ${res.message}` }
      const fee = aaFeeFor(api.getState().appSettings.aaFee, BCTI_SEED_TARGET)
      return {
        ok: true,
        message: `Added ${res.value.added} paid BCTIs: Dr Rutherford now has ${BCTI_SEED_TARGET} paid in ${aaFeeMonthLabel(BCTI_SEED_MONTH)}. At the current settings his fee is ${formatCurrency(fee.subtotal)} before GST. Run monthly fee invoices to raise it.`,
      }
    },
    indexPath: () => AA_FEE_INVOICES,
  },

  // ── Xero simulation · an AA fee pair (catch-up Phase 16) ──────────────
  {
    id: 'record-fee-payment',
    label: 'Record fee payment',
    description:
      'The anaesthetist pays this AA fee invoice in full, by bank transfer into AA\'s own account (never deducted from a payment to them).',
    screen: 'Xero simulation · AA fee pair',
    routes: [XERO_PAIR],
    surfaces: ['bar'],
    when: (state, ctx) => isFeePairOnScreen(state, ctx),
    disabledReason: (state, ctx) => aaFeePaymentDisabledReason(state, feeInvoiceIdOnScreen(state, ctx)),
    run: (api, ctx) => recordFeePaymentFor(api, feeInvoiceIdOnScreen(api.getState(), ctx)),
    indexPath: (state) => {
      const oldestUnpaid = allAaFeeInvoices(state).filter((f) => f.status === 'unpaid').at(-1)
      return oldestUnpaid === undefined ? null : `/demo/xero/invoices/${oldestUnpaid.accRecId}`
    },
    indexEmptyReason: 'Every AA fee invoice is paid',
  },

  // ── Mobile · List, installed PWA only: the office stand-in ───────────
  // Before the hospital messages, so it leads the handset's sheet on a List.
  {
    id: 'office-authorises-list',
    label: 'Office authorises this List',
    description:
      'Stands in for the office, which has no app on the phone: authorises this submitted List and runs billing, as Kirsty would from the Admin review queue.',
    screen: 'Mobile · List',
    routes: ['/mobile/lists/:listId', '/mobile/lists/:listId/bookings/:bookingId'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => officeStandInRefusal(state, ctx.params['listId'] ?? ''),
    run: (api, ctx) => {
      const res = authoriseAsSimulatedOffice(api, ctx.params['listId'] ?? '')
      if (!res.ok) return { ok: false, message: res.message }
      return {
        ok: true,
        message: res.value.billed
          ? 'Done. The office authorised this List and the billing run raised its invoices. They are in Balances now, and search finds the List.'
          : 'The office authorised this List, but the billing run raised no invoices for it.',
      }
    },
    indexPath: () => null,
  },
  // ── Mobile · Lists: the office assigns a List (catch-up Phase 28) ──────
  {
    id: 'office-assigns-next-free',
    label: 'Office assigns a List to my next free session',
    description:
      "Stands in for the office, which has no app on the phone: assigns a List to Dr Souter's earliest free session from today, as Kirsty would with Assign List in Admin. The session then shows as a booked List.",
    screen: 'Mobile · Lists',
    routes: ['/mobile/lists'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    choices: (state) =>
      STAND_IN_ASSIGN_CHOICES.map((c) => ({
        id: c.id,
        label: `${state.masters.hospitals[c.hospitalId]?.name ?? c.hospitalId} · ${state.masters.surgeons[c.surgeonId]?.name ?? c.surgeonId}`,
      })),
    disabledReason: (state) => (nextOpenSlotFor(state, ANAE.souter) === undefined ? 'No free session before the schedule horizon ends' : null),
    run: (api, _ctx, choiceId) => {
      const res = assignNextFreeSlotAsSimulatedOffice(api, ANAE.souter, choiceId)
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const hospital = state.masters.hospitals[res.value.hospitalId]?.name ?? res.value.hospitalId
      const surgeon = state.masters.surgeons[res.value.surgeonId]?.name ?? res.value.surgeonId
      return {
        ok: true,
        message: `Assigned ${hospital} · ${surgeon} to your ${shortDay(res.value.slot.dateISO)} ${sessionText(res.value.slot.session)} session.`,
      }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build plays the office in Admin (Assign List).',
  },
  // ── Mobile · Lists: the office adds an out-of-hours List tonight (catch-up Phase 32c) ──
  {
    id: 'office-adds-out-of-hours-list',
    label: 'The office adds an out-of-hours List for me tonight',
    description:
      "Stands in for the office on the phone: opens Dr Souter's out-of-hours session for tonight and puts a List in it, at the hospital and with the surgeon of her latest List, as Kirsty would with Open out-of-hours session and Assign List on Admin Day. It shows on her day after PM.",
    screen: 'Mobile · Lists',
    routes: ['/mobile/lists'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state) => outOfHoursStandInRefusal(state, ANAE.souter),
    run: (api) => {
      const res = addOutOfHoursListAsSimulatedOffice(api, ANAE.souter)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `The office added an out-of-hours List for tonight at ${res.value.startTime}.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build plays the office in Admin (Open out-of-hours session on Admin Day).',
  },
  // ── Mobile · Lists: the office assigns a waiting request (catch-up Phase 31) ──
  {
    id: 'office-assigns-draft-list',
    label: `Office assigns a ${DRAFT_LIST} to me`,
    description:
      "Stands in for the office on the phone: assigns the waiting request that falls on Dr Souter's soonest open session and fits her, so it shows as a booked List with any Bookings it already holds. If none fits, the office logs a request for her next open session and assigns that.",
    screen: 'Mobile · Lists',
    routes: ['/mobile/lists'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state) => (nextOpenSlotFor(state, ANAE.souter) === undefined ? 'No free session in the schedule' : null),
    run: (api) => {
      const res = assignDraftListAsSimulatedOffice(api, ANAE.souter)
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const when = `${shortDay(res.value.slot.dateISO)} ${sessionText(res.value.slot.session)}`
      const what = pairingOf(state, res.value.hospitalId, res.value.surgeonId)
      // Never names a preference, a tier, a Draft List or a slot (D44, OQ-64).
      return {
        ok: true,
        message: res.value.logged
          ? `The office logged a request for your ${when} and assigned it: ${what}.`
          : `The office assigned a waiting request to your ${when}: ${what}, ${plural(res.value.bookings, 'booking')}.`,
      }
    },
    indexPath: () => null,
    indexEmptyReason: `PWA only: the framed build plays the office in Admin (Assign on ${DRAFT_LISTS}).`,
  },
  // ── Admin · Day and Conflicts: an office-recorded sickness (catch-up Phase 30, re-pointed in 32b) ──
  {
    id: 'simulate-sickness',
    label: 'Simulate sickness',
    description: `An anaesthetist phones in sick and the office records it: their session on the chosen List is marked unavailable and, in the same step, the List goes back to the office as a ${DRAFT_LIST} or on to the first free colleague in the office's order. Unavailability is never a conflict.`,
    screen: 'Admin · Day view and Conflicts',
    routes: [ADMIN_DAY, ADMIN_CONFLICTS],
    surfaces: ['bar'],
    choices: (state, ctx) => sicknessChoices(state, ctx),
    defaultChoice: (state, ctx) => {
      const slotId = ctx.published['adminDay.selectedSlotId']
      const held = slotId !== undefined ? listInSlot(state, slotId) : undefined
      if (held === undefined) return undefined
      return sicknessChoices(state, ctx).find((c) => sicknessChoiceParts(c.id).listId === held.id)?.id
    },
    disabledReason: (state, ctx, choiceId) => {
      const choices = sicknessChoices(state, ctx)
      if (choices.length === 0) return 'No Lists on this day'
      const { listId, route } = sicknessChoiceParts(choiceId ?? choices[0]!.id)
      return sicknessRefusal(state, listId, route)
    },
    run: (api, ctx, choiceId) => {
      const choices = sicknessChoices(api.getState(), ctx)
      const picked = choiceId ?? choices[0]?.id
      if (picked === undefined) return { ok: false, message: 'No Lists on this day' }
      const { listId, route } = sicknessChoiceParts(picked)
      const before = api.getState().schedule.lists[listId]
      if (!isAssignedList(before)) return { ok: false, message: 'This List has no anaesthetist yet' }
      const res = simulateSickness(api, listId, route)
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const who = drSurname(state.masters.anaesthetists[before.anaesthetistId]?.name ?? before.anaesthetistId)
      const when = `${shortDay(before.dateISO)} ${sessionText(before.session)}`
      const status = statusFor(state.masters.slotStatuses, SEED_STATUS.unavailable)?.label ?? 'unavailable'
      const where =
        res.value.toAnaesthetistId !== undefined
          ? `went to ${drSurname(state.masters.anaesthetists[res.value.toAnaesthetistId]?.name ?? res.value.toAnaesthetistId)}`
          : `went back to the ${DRAFT_LISTS}`
      return { ok: true, message: `${who} recorded as ${status} for ${when}. The List ${where} with its Bookings. No conflict.` }
    },
    indexPath: () => '/admin/day/2026-07-22',
  },
  // ── Admin · the Assign and Reassign pickers: a colleague makes a session available (catch-up Phase 32b) ──
  {
    id: 'ask-colleague-make-available',
    label: 'Ask a colleague to make their session available',
    description:
      'The office never assigns onto an unavailable session (US-01.6.3). This plays the colleague agreeing: they set their own session Free, so the picker row becomes assignable. Never a session that holds a List.',
    screen: `Admin · Assign ${DRAFT_LIST} and Reassign pickers`,
    routes: [ADMIN_DAY, ADMIN_DRAFT_LISTS, ADMIN_CONFLICTS],
    surfaces: ['bar'],
    badge: 'colleague-stand-in',
    when: (_state, ctx) => ctx.published['adminPicker.listId'] !== undefined,
    choices: (state, ctx) => makeAvailableChoices(state, ctx),
    disabledReason: (state, ctx, choiceId) => {
      const slotId = choiceId ?? makeAvailableChoices(state, ctx)[0]?.id
      if (slotId === undefined) return 'No colleague is marked not available for this session'
      return makeAvailableRefusal(state, slotId)
    },
    run: (api, ctx, choiceId) => {
      const slotId = choiceId ?? makeAvailableChoices(api.getState(), ctx)[0]?.id
      if (slotId === undefined) return { ok: false, message: 'No colleague is marked not available for this session' }
      const res = makeSessionAvailableAsColleague(api, slotId)
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const slot = state.schedule.slots[slotId]!
      const who = drSurname(state.masters.anaesthetists[res.value.anaesthetistId]?.name ?? res.value.anaesthetistId)
      return { ok: true, message: `${who} made ${shortDay(slot.dateISO)} ${sessionText(slot.session)} available. You can assign to them now.` }
    },
    indexPath: () => `/admin/draft-lists`,
    indexHint: `Open Assign on a ${DRAFT_LIST}, or Reassign on a List: the button sits on each unavailable colleague's row.`,
  },
  // ── Mobile · List and Booking: the office ticks an alert (catch-up Phase 32b; PWA parity) ──
  {
    id: 'office-resolves-alert',
    label: 'Office resolves this alert',
    description: "Plays the office ticking your open alert on this List or Booking resolved, so the handset shows that the office has dealt with it. In the framed build, tick it in Admin's notifications.",
    screen: 'Mobile · List and Booking',
    routes: ['/mobile/lists/:listId', MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => {
      const listId = ctx.params['listId']
      if (listId === undefined) return 'Open a List or Booking'
      return officeResolvesAlertRefusal(state, { listId, ...(ctx.params['bookingId'] !== undefined ? { bookingId: ctx.params['bookingId'] } : {}) })
    },
    run: (api, ctx) => {
      const listId = ctx.params['listId']
      if (listId === undefined) return { ok: false, message: 'Open a List or Booking' }
      const res = officeResolvesAlert(api, { listId, ...(ctx.params['bookingId'] !== undefined ? { bookingId: ctx.params['bookingId'] } : {}) })
      return res.ok ? { ok: true, message: 'The office resolved your alert.' } : { ok: false, message: res.message }
    },
    indexPath: () => null,
    indexEmptyReason: "PWA only: the framed build plays the office in Admin (Notifications, Resolve).",
  },
  // ── Mobile · Booking: the office approves the anaesthetist's Contract change (catch-up Phase 21a) ──
  {
    id: 'office-approves-contract-change',
    label: 'Office approves this Contract change',
    description:
      "Plays the office approving the Contract you changed on this Booking, as Kirsty would with Approve on Review, so the handset shows \"Approved by the office\" instead of \"Awaiting office approval\". In the framed build, approve it on Admin Review.",
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => {
      const bookingId = ctx.params['bookingId']
      if (bookingId === undefined) return 'Open a Booking'
      return approveContractRefusal(state, bookingId)
    },
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      if (bookingId === undefined) return { ok: false, message: 'Open a Booking' }
      const res = approveContractChangeAsSimulatedOffice(api, bookingId)
      return res.ok ? { ok: true, message: 'The office approved your Contract change.' } : { ok: false, message: res.message }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build plays the office on Admin Review (Approve).',
  },
  // ── Admin · Day and Notifications: a colleague's own move (catch-up Phase 32) ──
  {
    id: 'colleague-moves-list-to-office',
    label: 'Colleague moves a List to the office',
    description: `An anaesthetist returns one of their own Lists to the office, as themselves, at once: it becomes a ${DRAFT_LIST} and its notification tops the shared pool. The busy morning stages eight moves, alternating returns and hand-ons to free colleagues, so the Notifications page runs to two pages. Never a scripted beat's List.`,
    screen: 'Admin · Day view and Notifications',
    routes: [ADMIN_DAY, ADMIN_NOTIFICATIONS],
    surfaces: ['bar'],
    choices: () => [
      { id: 'one', label: 'One move' },
      { id: 'busy', label: `A busy morning (${BUSY_MORNING_MOVES} moves)` },
    ],
    disabledReason: (state, ctx, choiceId) => colleagueMoveRefusal(state, isoParam(ctx.params['dateISO']), choiceId === 'busy' ? BUSY_MORNING_MOVES : 1),
    run: (api, ctx, choiceId) => {
      const dateISO = isoParam(ctx.params['dateISO'])
      if (choiceId === 'busy') {
        const res = stageBusyMorning(api, dateISO)
        if (!res.ok) return { ok: false, message: res.message }
        const handedOn = res.value.moves.filter((m) => m.route === 'colleague').length
        return { ok: true, message: `${res.value.moves.length} Lists moved by their anaesthetists: ${res.value.moves.length - handedOn} returned to the office, ${handedOn} handed on. See them on the Notifications page.` }
      }
      const res = stageColleagueMoveToOffice(api, dateISO)
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const list = state.schedule.lists[res.value.listId]
      const who = drSurname(state.masters.anaesthetists[res.value.anaesthetistId]?.name ?? res.value.anaesthetistId)
      const where = list !== undefined ? state.masters.hospitals[list.hospitalId]?.name ?? list.hospitalId : ''
      return { ok: true, message: `${who} returned ${shortDay(res.value.dateISO)} ${sessionText(list?.session ?? '')} (${where}) to the office. It is now a ${DRAFT_LIST}.` }
    },
    indexPath: () => '/admin/day/2026-07-21',
  },
  // ── Mobile · Availability: a colleague moves a List to the persona (catch-up Phase 32; PWA parity) ──
  {
    id: 'colleague-moves-list-to-me',
    label: 'Colleague moves a List into my free session',
    description:
      "Stands in for a colleague on the phone: they hand one of their Lists on into Dr Souter's free session, as themselves, at once, so she sees the Moved to you notice and the List on her schedule. Nobody accepts or confirms.",
    screen: 'Mobile · Availability',
    routes: [MOBILE_AVAILABILITY],
    surfaces: ['pwa'],
    badge: 'colleague-stand-in',
    disabledReason: (state) => moveToPersonaRefusal(state, ANAE.souter),
    run: (api) => {
      const res = stageColleagueMoveToPersona(api, ANAE.souter)
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const list = state.schedule.lists[res.value.listId]
      const who = drSurname(state.masters.anaesthetists[res.value.fromAnaesthetistId]?.name ?? res.value.fromAnaesthetistId)
      const where = list !== undefined ? state.masters.hospitals[list.hospitalId]?.name ?? list.hospitalId : ''
      // Never names a preference, a tier, a Draft List or a slot (D44, OQ-64).
      return { ok: true, message: `${who} moved ${shortDay(res.value.dateISO)} ${sessionText(list?.session ?? '')} (${where}) into your free session.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: in the framed build, move a List as Dr Souter on Web Availability and see the notice as the office.',
  },
  // ── Admin · Day: a colleague hands one Booking to Dr Souter (catch-up Phase 32a) ──
  {
    id: 'colleague-hands-booking-to-souter',
    label: 'Colleague hands a Booking to Dr Souter',
    description:
      "A colleague moves one of their Bookings into Dr Souter's free session, as themselves, at once, with the optional office notice ticked: a new List appears on her row and the notice tops the shared pool. Only where her session is free and empty; nothing sets anyone available. Never a scripted beat's List.",
    screen: 'Admin · Day view',
    routes: [ADMIN_DAY],
    surfaces: ['bar'],
    disabledReason: (state, ctx) =>
      bookingMoveCandidateRefusal(state, ANAE.souter, 'No colleague Booking fits a session Dr Souter is free in', isoParam(ctx.params['dateISO'])),
    run: (api, ctx) => {
      const res = stageColleagueBookingMove(api, ANAE.souter, { dateISO: isoParam(ctx.params['dateISO']), tellOffice: true })
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const who = drSurname(state.masters.anaesthetists[res.value.fromAnaesthetistId]?.name ?? res.value.fromAnaesthetistId)
      const where = state.masters.hospitals[res.value.hospitalId]?.name ?? res.value.hospitalId
      return { ok: true, message: `${who} moved a Booking (${shortDay(res.value.dateISO)} ${sessionText(res.value.session)}, ${where}) to Dr Souter. A new List was created.` }
    },
    indexPath: () => '/admin/day/2026-07-22',
  },
  // ── Mobile · Lists: a colleague moves a Booking to the persona (catch-up Phase 32a; PWA parity) ──
  {
    id: 'colleague-moves-booking-to-me',
    label: 'Colleague moves a Booking to me',
    description:
      "Stands in for a colleague on the phone: they hand one of their Bookings into Dr Souter's free session, as themselves, at once, so a new List appears on her Lists with the Moved to you notice. A session she is not available in is not offered until she sets it available in My calendar. Nobody accepts or confirms.",
    screen: 'Mobile · Lists',
    routes: [...MOBILE_LISTS],
    surfaces: ['pwa'],
    badge: 'colleague-stand-in',
    choices: (state) =>
      bookingMoveCandidates(state, ANAE.souter).map((c) => ({
        id: c.bookingId,
        label: `${drSurname(state.masters.anaesthetists[c.fromAnaesthetistId]?.name ?? c.fromAnaesthetistId)} · ${shortDay(c.dateISO)} ${sessionText(c.session)} · ${state.masters.hospitals[c.hospitalId]?.name ?? c.hospitalId}`,
      })),
    defaultChoice: (state) => bookingMoveCandidates(state, ANAE.souter)[0]?.bookingId,
    disabledReason: (state, _ctx, choiceId) => {
      const none = bookingMoveCandidateRefusal(state, ANAE.souter, 'No colleague Booking fits a session you are free in. Set a session available first.')
      if (none !== null) return none
      return choiceId === undefined || bookingMoveCandidates(state, ANAE.souter).some((c) => c.bookingId === choiceId) ? null : 'Choose a colleague Booking'
    },
    run: (api, _ctx, choiceId) => {
      const res = stageColleagueBookingMove(api, ANAE.souter, {
        ...(choiceId !== undefined ? { choiceId } : {}),
        refusal: 'No colleague Booking fits a session you are free in. Set a session available first.',
      })
      if (!res.ok) return { ok: false, message: res.message }
      const state = api.getState()
      const who = drSurname(state.masters.anaesthetists[res.value.fromAnaesthetistId]?.name ?? res.value.fromAnaesthetistId)
      const where = state.masters.hospitals[res.value.hospitalId]?.name ?? res.value.hospitalId
      // Never names a preference, a tier, a Draft List or a slot (D44, D54).
      return { ok: true, message: `${who} moved a Booking (${shortDay(res.value.dateISO)} ${sessionText(res.value.session)}, ${where}) to you. It is on a new List in your free session.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: in the framed build, move a Booking as Dr Souter from its Booking screen and see the new List as the office.',
  },
  // ── Admin · Draft Lists: a request arrives from a surgeon's room (catch-up Phase 31) ──
  {
    id: 'simulate-incoming-request',
    label: 'Simulate incoming request',
    description: `A surgeon's secretary sends a request before an anaesthetist is found: the office logs it as a ${DRAFT_LIST}, with how it came in. It takes its place in date order, waiting from now, with no Bookings yet.`,
    screen: `Admin · ${DRAFT_LISTS}`,
    routes: [ADMIN_DRAFT_LISTS],
    surfaces: ['bar'],
    choices: (state) =>
      CANNED_DRAFT_LIST_REQUESTS.map((r) => {
        const day = cannedRequestDay(state, r.id)!
        return { id: r.id, label: `${pairingOf(state, r.hospitalId, r.surgeonId)} · ${shortDay(day.dateISO)} ${sessionText(day.session)} · ${SOURCE_LABELS[r.source]}` }
      }),
    disabledReason: (state, _ctx, choiceId) => incomingRequestRefusal(state, choiceId ?? CANNED_DRAFT_LIST_REQUESTS[0].id),
    run: (api, _ctx, choiceId) => {
      const id = choiceId ?? CANNED_DRAFT_LIST_REQUESTS[0].id
      const res = simulateIncomingDraftListRequest(api, id)
      if (!res.ok) return { ok: false, message: res.message }
      const r = CANNED_DRAFT_LIST_REQUESTS.find((x) => x.id === id)!
      return {
        ok: true,
        message: `A request came in by ${SOURCE_LABELS[r.source].toLowerCase()}: ${pairingOf(api.getState(), r.hospitalId, r.surgeonId)}, ${shortDay(res.value.dateISO)} ${sessionText(res.value.session)}. It waits on ${DRAFT_LISTS}, unassigned.`,
      }
    },
    indexPath: () => ADMIN_DRAFT_LISTS,
  },
  // ── Admin · Day: a Draft List on the day on screen (catch-up Phase 31) ──
  {
    id: 'add-draft-list-for-day',
    label: `Add ${DRAFT_LIST} for this day`,
    description: `Logs a ${DRAFT_LIST} for the day in the URL, which shows in the grid's ${DRAFT_LISTS} band and the rail card at once.`,
    screen: 'Admin · Day view',
    routes: [ADMIN_DAY],
    surfaces: ['bar'],
    choices: (state) => CANNED_DAY_DRAFT_LISTS.map((c) => ({ id: c.id, label: `${sessionText(c.session)} · ${pairingOf(state, c.hospitalId, c.surgeonId)}` })),
    disabledReason: (state, ctx, choiceId) => dayDraftListRefusal(state, ctx.params['dateISO'] ?? state.clock.todayISO, choiceId ?? CANNED_DAY_DRAFT_LISTS[0].id),
    run: (api, ctx, choiceId) => {
      const dateISO = ctx.params['dateISO'] ?? api.getState().clock.todayISO
      const id = choiceId ?? CANNED_DAY_DRAFT_LISTS[0].id
      const res = addDraftListForDay(api, dateISO, id)
      if (!res.ok) return { ok: false, message: res.message }
      const c = CANNED_DAY_DRAFT_LISTS.find((x) => x.id === id)!
      return { ok: true, message: `Added a ${DRAFT_LIST} for ${shortDay(dateISO)} ${sessionText(c.session)}: ${pairingOf(api.getState(), c.hospitalId, c.surgeonId)}. It shows in the band and the rail card.` }
    },
    indexPath: (state) => `/admin/day/${state.clock.todayISO}`,
  },
  // ── Admin · Master data, Contracts: a backdated range on Merivale's Face lift (catch-up Phase 24, US-05.2.8) ──
  {
    id: 'demo-backdated-range',
    label: 'Demo: add a backdated price range',
    description:
      "Adds a range from 1 Jul 2026 at $3,300.00 (a demo figure) to Merivale's Face lift, as the office. The unedited Face lift Bookings re-price; the one with a typed price and the AUTHORISED, invoiced one stay put.",
    screen: 'Admin · Master data, Contracts',
    routes: [ADMIN_MASTERS],
    surfaces: ['bar'],
    // On the Contracts view (the Contract detail panel is modal, so the bar is reached from the list) or with the Face lift open;
    // once the range is added it stays listed, disabled, so its result line can be read.
    when: (_state, ctx) => ctx.published['adminMasters.view'] === 'contracts' || ctx.published['adminContracts.openContractId'] === BACKDATED_RANGE_CONTRACT_ID,
    disabledReason: (state) => (backdatedRangeAdded(state) ? 'Already added' : null),
    run: (api) => {
      const res = addBackdatedRangeDemo(api)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: 'Added a range from 1 Jul 2026 at $3,300.00 to the Face lift. Unedited Face lift Bookings now price at $3,300.00; the typed and the invoiced ones are held.' }
    },
    indexPath: () => '/admin/masters?view=contracts',
    indexHint: "Then open Merivale's Face lift (search \"Face lift\", then Edit) to see its ranges.",
  },
  // ── Admin · Master data, Recurring bookings: the nightly roll meets a blocked-out day (catch-up Phase 31) ──
  {
    id: 'stage-recurring-clash',
    label: 'Stage recurring clash',
    description: `Marks the chosen recurring booking's anaesthetist Unavailable on its first day past the schedule, as the office. When Next day reaches that day, the recurring booking lands on a closed session and becomes a ${DRAFT_LIST}, not a List flagged on the anaesthetist.`,
    screen: 'Admin · Master data, Recurring bookings',
    routes: [ADMIN_MASTERS],
    surfaces: ['bar'],
    when: (_state, ctx) => ctx.published['adminMasters.view'] === 'recurringBookings',
    choices: (state) =>
      stageableRecurringBookings(state).map(({ rb }) => ({
        id: rb.id,
        label: `${drSurname(state.masters.anaesthetists[rb.anaesthetistId]?.name ?? rb.anaesthetistId)} · ${DAY_NAMES[rb.dayOfWeek]} ${sessionText(rb.session)} · ${pairingOf(state, rb.hospitalId, rb.surgeonId)}`,
      })),
    disabledReason: (state, _ctx, choiceId) => {
      const id = choiceId ?? stageableRecurringBookings(state)[0]?.rb.id
      const rb = id !== undefined ? state.masters.recurringBookings[id] : undefined
      if (rb === undefined) return 'No recurring booking runs in the next two weeks past the schedule'
      return stagedAlready(state, rb) ? 'Already staged' : null
    },
    run: (api, _ctx, choiceId) => {
      const id = choiceId ?? stageableRecurringBookings(api.getState())[0]?.rb.id
      if (id === undefined) return { ok: false, message: 'No recurring booking to stage' }
      const before = api.getState()
      const rb = before.masters.recurringBookings[id]!
      const res = stageRecurringClash(api, id)
      if (!res.ok) return { ok: false, message: res.message }
      const who = drSurname(before.masters.anaesthetists[rb.anaesthetistId]?.name ?? rb.anaesthetistId)
      const presses = res.value.presses === 1 ? 'once' : res.value.presses === 2 ? 'twice' : `${res.value.presses} times`
      return {
        ok: true,
        message: `${who} is marked unavailable for ${shortDay(res.value.dateISO)} ${sessionText(res.value.session)}. Press Next day ${presses}: when the schedule reaches that day, ${pairingOf(before, rb.hospitalId, rb.surgeonId)} becomes a ${DRAFT_LIST}.`,
      }
    },
    indexPath: () => '/admin/masters?view=recurringBookings',
  },
  // ── Admin · Day, Booking detail and Mobile · Booking: sample warnings ──
  {
    id: 'raise-sample-warnings',
    label: 'Raise sample warnings',
    description:
      "Stages every warning rule's sample, as Demo actions, on Dr Rutherford's Tue 21 Jul Bookings (from the Day view) or on the Booking on screen: an unpaid prepayment, base units outside the range, a child as the payer on each Procedure billed to the patient (on the Booking on screen when its patient is under 18, otherwise on Grace Park's two Procedures, one to-do row), and an insurer named with no approval number (on the Booking on screen when it names an insurer, otherwise on the first seeded NIB Booking). Later rules add theirs: a prepaid procedure with no price, a paying patient with a balance.",
    screen: 'Admin · Day and Booking detail, Mobile · Booking',
    routes: SAMPLE_WARNING_ROUTES,
    surfaces: ['bar', 'pwa'],
    disabledReason: raiseSampleDisabled,
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      const notes = skippedSampleNotes(api.getState(), bookingId ?? SEED_WARNING_SAMPLE_BOOKINGS.targets[0])
      const res = bookingId === undefined ? raiseDaySamples(api) : raiseSamplesOn(api, bookingId)
      if (!res.ok) return { ok: false, message: res.message }
      const skipped = notes.length > 0 ? ` ${notes.join(' ')}` : ''
      return {
        ok: true,
        message:
          bookingId === undefined
            ? `Raised ${plural(res.value, 'sample warning')} on Dr Rutherford's Tue 21 Jul Lists, Grace Park's Booking and a NIB Booking. They show on the To-do card, the day grid and each Booking. ${RULES_NOTE}${skipped}`
            : `Raised ${plural(res.value, 'sample warning')}: the triangle and the warning at the top of the Booking. The child payer sample stages on a minor's Booking (Grace Park's unless this one is a child's) and the approval number sample on an insurer's (BK0074 unless this one names an insurer). ${RULES_NOTE}${skipped}`,
      }
    },
    indexPath: () => '/admin/day/2026-07-21',
  },
  {
    id: 'clear-sample-warnings',
    label: 'Clear sample warnings',
    description:
      "Undoes the samples: restores the seeded values and drops their clearances, so the sample warnings disappear. Not the office's Clear on the To-do card.",
    screen: 'Admin · Day and Booking detail, Mobile · Booking',
    routes: SAMPLE_WARNING_ROUTES,
    surfaces: ['bar', 'pwa'],
    disabledReason: clearSampleDisabled,
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      const res = bookingId === undefined ? clearAllSamples(api) : clearSamplesFor(api, bookingId)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `Removed ${plural(res.value, 'sample warning')}. The seeded values are back.` }
    },
    indexPath: () => '/admin/day/2026-07-21',
  },
  // ── Mobile · Booking, installed PWA only: the office stand-in ─────────
  {
    id: 'office-clears-warning',
    label: 'Office clears this warning',
    description:
      'Stands in for the office, which has no app on the phone: clears a warning on this Booking, as Kirsty would from the To-do card in Admin.',
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    choices: openWarningChoices,
    disabledReason: (state, ctx, choiceId) => {
      const open = openWarningChoices(state, ctx)
      if (open.length === 0) return 'No open warnings on this Booking'
      if (choiceId !== undefined && !open.some((c) => c.id === choiceId)) return 'Choose a warning'
      return null
    },
    run: (api, ctx, choiceId) => {
      const bookingId = ctx.params['bookingId'] ?? ''
      const key = choiceId ?? openWarningChoices(api.getState(), ctx)[0]?.id
      if (key === undefined) return { ok: false, message: 'No open warnings on this Booking' }
      const res = clearWarning(api, OFFICE_SIMULATION_ACTOR, bookingId, key)
      return res.ok
        ? { ok: true, message: 'The office cleared this warning. The triangle turns grey and the Booking shows who cleared it.' }
        : { ok: false, message: res.message }
    },
    indexPath: () => null,
  },

  // ── Mobile · Booking, installed PWA only: the office sets the Contract (catch-up Phase 20)
  {
    id: 'office-sets-booking-contract',
    label: "Office sets this Booking's Contract",
    description:
      "Stands in for the office on a Booking that needs an invoice destination: sets each Procedure's Contract as the office would on the step rail (the List's hospital's first Contract on offer, else No contract · RVG), audited as the office.",
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => (officeContractPicks(state, ctx.params['bookingId'] ?? '').length === 0 ? 'This Booking has an invoice destination' : null),
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId'] ?? ''
      const picks = officeContractPicks(api.getState(), bookingId)
      if (picks.length === 0) return { ok: false, message: 'This Booking has an invoice destination' }
      for (const pick of picks) {
        const res = setProcedureContract(api, OFFICE_SIMULATION_ACTOR, pick.procedureId, pick.contractId)
        if (!res.ok) return { ok: false, message: `Refused: ${res.message}` }
      }
      return { ok: true, message: "The office set this Booking's Contract. It leaves the office's Needs an invoice destination list." }
    },
    indexPath: () => null,
  },

  // ── Photo capture (Future scope) ──────────────────────────────────────
  // Photo capture is Future Work (US-02.4.4, catch-up Phase 15b): out of the
  // Add a booking sheet, kept here so a presenter can still show it. UI-only:
  // it leaves a request that `MobileListsRoute` turns into the sheet.
  {
    id: 'photo-capture-future',
    label: 'Photo capture (Future scope)',
    description:
      'Opens the simulated photo of a paper booking card on this List. Photo capture is Future Work (US-02.4.4), not first-release scope.',
    screen: 'Mobile · List',
    routes: ['/mobile/lists/:listId'],
    surfaces: ['bar', 'pwa'],
    badge: 'future-scope',
    disabledReason: (state, ctx) => photoCaptureDisabledReason(state, ctx.params['listId'] ?? ''),
    run: (api, ctx) => {
      const listId = ctx.params['listId'] ?? ''
      const reason = photoCaptureDisabledReason(api.getState(), listId)
      if (reason !== null) return { ok: false, message: reason }
      useDemoTriggerMemory.getState().requestPhotoCapture(listId)
      return { ok: true, message: 'Photo capture opened on this List (Future scope).' }
    },
    indexPath: () => `/mobile/lists/${PHOTO_CAPTURE_INDEX_LIST_ID}`,
  },
  // ── Hospital messages (Future scope) ──────────────────────────────────
  {
    id: 'fire-hospital-message',
    label: 'Fire hospital message',
    description:
      "Sends a canned hospital HL7 v2 or FHIR message into the mock backend, including the Christchurch Public dead-letter case (MSG-CPH-2001). A new Booking arrives with no Contract and waits on Admin Day's Needs an invoice destination until the office sets one. On a Booking (mobile, web and Admin) it defaults to the message addressed to that Booking: on Diane Foster's, MSG-STG-1012's hospital description replaces the rooms' text, the original kept in the History. Also on Admin · Integrations and the Integrations simulator.",
    screen: 'Mobile · Lists',
    routes: [...MOBILE_LISTS, WEB_BOOKING, ADMIN_BOOKING, ADMIN_INTEGRATIONS, INTEGRATIONS_SIM],
    surfaces: ['bar', 'pwa'],
    badge: 'future-scope',
    choices: () => CANNED_MESSAGES.map((m) => ({ id: m.id, label: `${m.label} · ${m.id}` })),
    // On a Booking, the message addressed to it (catch-up Phase 20a); else the simulator's pick or the S1 create.
    defaultChoice: (state, ctx) =>
      cannedMessageForBooking(state, ctx.params['bookingId']) ?? ctx.published['integrationsSim.selectedMessageId'] ?? DEFAULT_MESSAGE_ID,
    disabledReason: () => null,
    run: (api, _ctx, choiceId) => {
      const selectedId = choiceId ?? DEFAULT_MESSAGE_ID
      const replacesBefore = api.getState().audit.filter((a) => a.action === 'procedure.procedureText.replace').length
      const res = processMessage(api, selectedId)
      useDemoTriggerMemory.getState().rememberMessage(selectedId)
      const replaced = api.getState().audit.filter((a) => a.action === 'procedure.procedureText.replace').length > replacesBefore
      return {
        ok: res.ok,
        message: !res.ok
          ? `Refused: ${res.message}`
          : replaced
            ? `Fired ${selectedId}: the hospital's description replaced the rooms' text; the original is in the History.`
            : `Fired ${selectedId}: ${res.value.outcome}. See the three-pane view in the integration simulator and the log in the Admin app Integrations monitor.`,
      }
    },
    indexPath: () => '/mobile/lists',
  },
  {
    id: 'replay-hospital-message',
    label: 'Replay last message (dedupe)',
    description:
      'Replays the last hospital message fired, to show idempotent dedupe: same message control ID, no second Booking.',
    screen: 'Mobile · Lists',
    routes: [...MOBILE_LISTS, ADMIN_INTEGRATIONS, INTEGRATIONS_SIM],
    surfaces: ['bar', 'pwa'],
    badge: 'future-scope',
    disabledReason: (state) => messageReplayDisabledReason(state),
    run: (api) => {
      const last = useDemoTriggerMemory.getState().lastMessageId
      const reason = messageReplayDisabledReason(api.getState())
      if (last === null || reason !== null) return { ok: false, message: reason ?? 'Fire a message first' }
      const res = processMessage(api, last)
      return {
        ok: res.ok,
        message: res.ok
          ? res.value.outcome === 'duplicate'
            ? 'Deduplicated: same message control ID, no second Booking created.'
            : `Replayed ${last}: ${res.value.outcome}.`
          : `Refused: ${res.message}`,
      }
    },
    indexPath: () => '/mobile/lists',
  },

  // ── Mobile · Balances, installed PWA only ─────────────────────────────
  {
    id: 'pwa-payment-full',
    label: 'Payment received · full',
    description: 'A Xero payment webhook for the full balance of one of Dr Souter\'s open invoices, chosen below.',
    screen: 'Mobile · Balances',
    routes: ['/mobile/balances'],
    surfaces: ['pwa'],
    choices: (state) => souterPaymentChoices(state),
    disabledReason: (state, _ctx, choiceId) => souterPaymentDisabled(state, choiceId),
    run: (api, _ctx, choiceId) => sendPaymentWebhook(api, choiceId, 'full'),
    indexPath: () => null,
  },
  {
    id: 'pwa-payment-half',
    label: 'Payment received · half',
    description: 'A Xero payment webhook for half the balance of one of Dr Souter\'s open invoices, chosen below (a part payment).',
    screen: 'Mobile · Balances',
    routes: ['/mobile/balances'],
    surfaces: ['pwa'],
    choices: (state) => souterPaymentChoices(state),
    disabledReason: (state, _ctx, choiceId) => souterPaymentDisabled(state, choiceId),
    run: (api, _ctx, choiceId) => sendPaymentWebhook(api, choiceId, 'partial'),
    indexPath: () => null,
  },
  // ── List and Booking detail, all three apps: the multi-procedure rule (catch-up Phase 23) ──
  {
    id: 'load-multi-procedure-booking',
    label: 'Load 3-procedure Booking (7 modifier units)',
    description:
      "Adds the domain model's worked example to Dr Souter's next open List: a laparoscopic cholecystectomy as the primary and two hernia repairs, each on No contract · RVG with its own times, AS3, OB3 and emergency claimed with their explanations and A1 pre-applied from the patient's age: 7 modifier units, split 3 · 2 · 2. Not marked complete.",
    screen: 'List and Booking detail',
    routes: [...MOBILE_LISTS.slice(1), '/web/lists/:listId', WEB_BOOKING, ADMIN_BOOKING],
    surfaces: ['bar', 'pwa'],
    disabledReason: (state) => multiProcedureLoadRefusal(state),
    run: (api) => {
      const res = stageMultiProcedureBooking(api)
      return res.ok ? { ok: true, message: res.value.message } : { ok: false, message: res.message }
    },
    indexPath: (state) => {
      const list = nextOpenSouterList(state)
      if (list === undefined) return null
      // The staged Booking once loaded; before that, a Booking already on that List (the entry shows on Booking detail).
      const onList = Object.values(state.schedule.bookings).filter((b) => b.listId === list.id).sort((a, b) => a.id.localeCompare(b.id))
      const target = onList.find((b) => b.patientId === MULTI_PROCEDURE_DEMO.patientId) ?? onList[0]
      return target !== undefined ? `/admin/day/${list.dateISO}/bookings/${target.id}` : null
    },
    indexEmptyReason: 'Dr Souter has no open List ahead.',
  },
  {
    id: 'feed-changes-primary',
    label: 'Hospital feed changes the primary',
    description:
      "Plays the List's hospital feed making the next procedure on this Booking the primary, audited as an integration: base units then come from it and it moves to the top. Applied directly until the matching screen exists (Phase 33).",
    screen: 'Booking detail',
    routes: [MOBILE_BOOKING, WEB_BOOKING, ADMIN_BOOKING],
    surfaces: ['bar', 'pwa'],
    when: (state, ctx) => {
      const bookingId = ctx.params['bookingId']
      return bookingId !== undefined && Object.values(state.schedule.procedures).filter((p) => p.bookingId === bookingId).length >= 2
    },
    disabledReason: (state, ctx) => {
      const bookingId = ctx.params['bookingId']
      return bookingId === undefined ? 'Open a Booking' : feedChangesPrimaryRefusal(state, bookingId)
    },
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      if (bookingId === undefined) return { ok: false, message: 'Open a Booking' }
      const res = feedChangesPrimary(api, bookingId)
      return res.ok ? { ok: true, message: res.value.message } : { ok: false, message: res.message }
    },
    indexPath: (state) => {
      const list = nextOpenSouterList(state)
      const staged = list !== undefined ? Object.values(state.schedule.bookings).find((b) => b.listId === list.id && b.patientId === MULTI_PROCEDURE_DEMO.patientId) : undefined
      return list !== undefined && staged !== undefined ? `/admin/day/${list.dateISO}/bookings/${staged.id}` : null
    },
    indexEmptyReason: 'Load the 3-procedure Booking first, or open any ACTIVE Booking with two procedures.',
  },
]

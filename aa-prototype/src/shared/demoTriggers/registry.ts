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
  setNhiHubMode,
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
  officeSetsPublicRefusal,
  setSessionPublicAsSimulatedOffice,
  outOfHoursStandInRefusal,
  authoriseAsSimulatedOffice,
  nextOpenSlotFor,
  STAND_IN_ASSIGN_CHOICES,
  officeStandInRefusal,
  authoriseList,
  setProcedureContract,
  railContextForList,
  railMastersOf,
  receiveResentPdfList,
  resendRefusal,
  openAccRecs,
  processMessage,
  runArchiveJob,
  runReconciliationPoll,
  deliverPaymentWebhook,
  setXeroOutage,
  xeroAvailable,
  disbursePayable,
  disbursePayableRefusal,
  paymentWeekFor,
  xeroBillPayable,
  voidAccRecInXero,
  bulkRemittanceRefusal,
  receiveBulkRemittance,
  voidInXeroRefusal,
  amendAccRecInXero,
  amendInXeroRefusal,
  XERO_DEMO_AMENDMENT,
  XERO_PAYABLES_ACTOR,
  XERO_STAFF_ACTOR,
  pairByAccRec,
  releasedAndPaidFor,
  viewerOfPair,
  transferForPair,
  type PollResult,
  type XeroBill,
  simulateSignInAttempts,
  submitList,
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
  BACKDATED_RANGE,
  BACKDATED_RANGE_CONTRACT_ID,
  keptPriceForRange,
  addBackdatedRangeDemo,
  backdatedRangeAdded,
  addPrepaidBooking,
  addPrepaidBookingRefusal,
  approvePrepaymentAsSimulatedOffice,
  moveToTwoDaysBefore,
  outstandingPrepaymentBookings,
  prepaymentAccRecChoices,
  prepaymentApprovalChoices,
  prepaymentPaymentRefusal,
  prepaymentStandInRefusal,
  twoDaysBeforeRefusal,
  officeMatchesHospitalRow,
  officeImportsS1File,
  officeAddsNhiRefusal,
  officeAddsNhiToStub,
  receiveTheatreList,
  sendUpdateRefusal,
  stageUpdateForBooking,
  standInRefusal,
  theatreListRefusal,
  updateTarget,
  type StandInChoice,
  officeEditsBooking,
  officeEditsBookingRefusal,
  OFFICE_USERS,
  otherOfficeUser,
} from '../../store'
import { CANNED_MESSAGES } from '../../domain/integrations'
import { PDF_LIST_SAMPLES, resendSampleFor } from '../../domain/intake'
import { contractCandidatesFor, destinationOf } from '../../domain/billing/contractRail'
import { noContractRvg } from '../../domain/billing/contracts'
import { ANAE, CANNED_DAY_DRAFT_LISTS, CANNED_DRAFT_LIST_REQUESTS, SEED_LIST_IDS, SEED_MARKERS, SEED_WARNING_SAMPLE_BOOKINGS } from '../../domain/seed'
import { MULTI_PROCEDURE_DEMO } from '../../domain/seed/multiProcedureDemo'
import { DRAFT_LIST, DRAFT_LISTS, SOURCE_LABELS } from '../scheduleTerms'
import { projectedListId, slotIdFor } from '../../domain/slots'
import { SEED_STATUS, statusFor, statusLine } from '../../domain/slotStatus'
import { formatMoney, roundToCents } from '../../domain/billing/money'
import { keptPriceTitle } from '../../domain/billing/contractChanges'
import { aaFeeFor, aaFeeMonthLabel } from '../../domain/billing/aaFee'
import { drSurname, formatCount, formatCurrency, plainDate, plural, shortDay } from '../format'
import { NHI_HUB_MODE_LABELS } from '../nhiHub/hub'
import { NHI_HUB_MODES } from '../../domain/types'
import { FULL_SCALE as FULL_SCALE_FIGURES } from '../../domain/seed/fullScale/constants'
import { loadFullScaleData, loadFullScaleRefusal } from '../../store/fullScaleActions'
import { isAssignedList } from '../../domain/draftLists'
import { useDemoTriggerMemory } from './memory'
import { simulateSickness, sicknessCandidates, sicknessColleagueSlot, sicknessRefusal, type SicknessRoute } from '../../store/demoSimulations'
import { BILLING_FAILURE_ALREADY, stageBillingFailure } from '../../store/demoStaging'
import { regenerateInvoiceFromLock, regenerateRefusal, regenerateSummary } from '../../store/locks'
import { nextRunRefusal, officeReviewRefusal, officeReviewsAdditionalInvoice, runNextBillingRun, stagePostOpForSouter, stagedSouterBooking } from '../../store/eventDemo'
import { CREDIT_COPY, CREDIT_DEMO_COPY, CREDIT_LABELS } from '../procedureEventCopy'
import {
  officeReviewsCredit,
  officeReviewsCreditRefusal,
  refundAfterPayoutRefusal,
  refundAfterPayoutTarget,
  stageCombinedProcedure,
  stageCombinedRefusal,
  stageRefundAfterPayout,
  stagedCombined,
} from '../../store/creditDemo'
import type { DemoTrigger, DemoTriggerCtx, DemoTriggerResult } from './types'
import { injectUnmatchedReceipt, injectUnmatchedRefusal, officeRunsWeeksCycle, officeRunsWeeksCycleRefusal, UNMATCHED_RECEIPT_DEMO } from '../../store/ledgerDemo'
import { PAYMENT_WEEK_CHOICES, stageBankMismatch, stageBankMismatchRefusal, stagePaymentWeek, stagePaymentWeekRefusal } from '../../store/paymentWeekDemo'
import { sessionText } from '../../domain/outOfHours'
import { isBookingPair } from '../../domain/billing/ledger'
import { APP_CONFIG } from '../../shell/appConfig'
import { recordAnaesthetistSignIn } from '../../store/authDemoActions'
import { tryInactiveSignIn } from '../../store/anaesthetistStatusActions'
import { dayAfterISO, statusOn } from '../../domain/anaesthetistStatus'
import { isSignedIn, signOutSession } from '../session/anaesthetistSession'
import { newerInvoiceDescription } from '../../domain/billing/procedureStack'
import {
  defaultHospitalDescription,
  primaryProcedureOf,
  hospitalDescriptionChoices,
  hospitalDescriptionOutcome,
  hospitalDescriptionRefusal,
  hospitalDescriptionText,
} from './procedureTextTriggers'
import { SAMPLE_SHEETS, type SampleSheet } from '../../domain/masterLoad/samples'
import type { LoadEntity } from '../../domain/masterLoad/types'
import { stageMasterLoad, stagedLoadFor } from '../../store/masterLoadActions'
import { stageGoLiveLoad } from '../../store/goLiveActions'
import { HOSPITAL_FEED_ACTOR, SEED_LOAD_ACTOR, SOUTER_ACTOR } from '../../store/demoActors'
import { leakScanSummary, scanForNhiLeaks } from '../../store/privacyScan'
import { rawRowRefusal, rawRowTarget, viewRawImportRow } from '../../store/rawRowActions'
import { reportDiagnostic } from '../../store/diagnostics'
import { LONGER_PREPAID_COPY, longerPrepaidChoices, stageLongerPrepaidProcedure, stageLongerRefusal } from '../../store/prepaymentFollowupDemo'
import {
  PREPAYMENT_SETTLEMENT_DEMO_COPY,
  contractChangeRefusal,
  latePaymentRefusal,
  sendReminderAsOfficeStandIn,
  stageLatePrepaymentPayment,
  stagePrepaidContractChange,
  standInReminderRefusal,
} from '../../store/prepaymentSettlementDemo'
import { addNhiAsSimulatedOffice, addNhiStandInRefusal } from '../../store/officeStandIn'
import { importHospitalDownload } from '../../store/matchingActions'
import { newlyStagedSampleNames, stagedSampleKeys } from '../../store/warningSamples'
import { NO_NHI_LIST, NO_NHI_NEW_PATIENT_NHI, NO_NHI_RETURNING_NHI } from '../../domain/intake/hospitalDownloads'
import { advanceSupportTicket, approveCallOut, newestAwaitingCallOut, newestOpenTicket, raiseSupportTicket, ticketsFor } from '../../store/supportActions'
import { advanceClockMinutes as moveClockMinutes, advanceClockToDate as moveClockToDate } from '../../store/clockActions'
import { replacementsAhead } from '../../store/replacedContractSelectors'
import type { ContractReplacement } from '../../domain/billing/contractHistory'
import { officeActorOf, STRATOS_SUPPORT_ACTOR } from '../../store/demoActors'
import { closesSupport, supportStampText, timeOfDayText } from '../../domain/support'
import { STATUS_LABEL } from '../support/supportCopy'
import { clockISO } from '../../store/mutate'
import { addDaysISO } from '../../domain/clock'
import { weekdayOf } from '../../domain/availabilitySeries'
import type { SupportChannel, SupportTicket } from '../../domain/types'

// ---------------------------------------------------------------------------
// Route patterns (checked against `src/router.tsx` and `pwa/main.tsx`)
// ---------------------------------------------------------------------------

/** Catch-up Phase 43b: the support panel opens over any route of the three apps. */
const SUPPORT_ROUTES = ['/mobile', '/mobile/*', '/web', '/web/*', '/admin', '/admin/*'] as const
const SUPPORT_SCREEN = 'All apps · Help'
/** The public-holiday sample's time of day: 10:00am. */
const PUBLIC_HOLIDAY_MINUTES = 10 * 60
/** The out-of-hours sample's time of day: 7:00pm. */
const EVENING_MINUTES = 19 * 60

function supportTab(ctx: DemoTriggerCtx): SupportChannel | null {
  return ctx.published['support.tab'] ?? null
}

function supportApp(ctx: DemoTriggerCtx): SupportTicket['raisedBy']['app'] {
  return ctx.pathname.startsWith('/admin') ? 'admin' : ctx.pathname.startsWith('/web') ? 'web' : 'mobile'
}

/** The requester the open panel lists ('' is the office, who sees every request). */
function supportRequester(state: AppState, ctx: DemoTriggerCtx) {
  return ctx.published['support.requester'] === '' || ctx.published['support.requester'] === undefined ? officeActorOf(state.shell) : SOUTER_ACTOR
}

/** The newest open ticket in the panel's scope that can move on; else the newest open one (waiting for AA's call-out approval). */
function supportTicketInScope(state: AppState, ctx: DemoTriggerCtx): SupportTicket | null {
  const tab = supportTab(ctx)
  if (tab === null) return null
  const requester = ctx.published['support.requester']
  const open = ticketsFor(state, { channel: tab, ...(requester !== undefined && requester !== '' ? { requester } : {}) }).filter((t) => t.status !== 'closed')
  return open.find((t) => t.callOut !== 'awaitingApproval') ?? open[0] ?? null
}

/** Forward to 7:00pm on the next weekday: today's when it is a weekday before 7:00pm. Never back. */
function moveClockToEvening(api: AppStoreApi): void {
  const clock = api.getState().clock
  let days = 0
  let date = clock.todayISO
  const todayOk = weekdayOf(date) <= 5 && clock.minutesSinceMidnight < EVENING_MINUTES
  if (!todayOk) {
    do {
      days += 1
      date = addDaysISO(clock.todayISO, days)
    } while (weekdayOf(date) > 5)
  }
  moveClockMinutes(api, days * 24 * 60 + EVENING_MINUTES - clock.minutesSinceMidnight)
}

/** The next national public holiday in 42's calendar at or after the clock (today's only before 10:00am). */
function nextNationalHoliday(state: AppState): { dateISO: string; name: string } | null {
  const { todayISO, minutesSinceMidnight } = state.clock
  return (
    Object.values(state.masters.publicHolidays)
      .filter((p) => closesSupport(p) && (p.dateISO > todayISO || (p.dateISO === todayISO && minutesSinceMidnight < PUBLIC_HOLIDAY_MINUTES)))
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0] ?? null
  )
}

/**
 * The Finances section (build plan Phase 58; D107, D111): its six tabs and the invoice page,
 * literal here because `src/shared/` never imports `apps/admin/screens/finances/financePaths.ts`.
 * `/admin/finances` redirects to Billing, so Billing's own address is enough.
 */
const FINANCES_BILLING = '/admin/finances/billing'
const FINANCES_INVOICES = '/admin/finances/invoices'
const FINANCES_INVOICE = '/admin/finances/invoices/:invoiceId'
const FINANCES_PAYMENTS = '/admin/finances/payments'
/** Ledger, whole and one anaesthetist's account. */
const FINANCES_LEDGER = ['/admin/finances/ledger', '/admin/finances/ledger/anaesthetists/:anaesthetistId'] as const
const FINANCES_XERO = '/admin/finances/xero'
const FINANCES_AA_FEES = '/admin/finances/aa-fees'
/** An invoice's page, as `financePaths.invoicePath` builds it. */
function financeInvoicePath(invoiceId: string): string {
  return `${FINANCES_INVOICES}/${encodeURIComponent(invoiceId)}`
}
/** The Finances headings in the Control Panel index, one per screen. */
export const FINANCES_BILLING_SCREEN = 'Admin · Finances · Billing'
export const FINANCES_INVOICES_SCREEN = 'Admin · Finances · Invoices'
/** Payments' heading (the Control Panel adds its Run payables note under it). */
export const FINANCES_PAYMENTS_SCREEN = 'Admin · Finances · Payments'
export const FINANCES_LEDGER_SCREEN = 'Admin · Finances · Ledger'
export const FINANCES_XERO_SCREEN = 'Admin · Finances · Xero'
export const FINANCES_AA_FEES_SCREEN = 'Admin · Finances · AA fees'
export const FINANCES_INVOICE_SCREEN = 'Admin · Finances · Invoice'
const XERO_SIM = ['/demo/xero', '/demo/xero/invoices', '/demo/xero/invoices/:accRecId', '/demo/xero/bank'] as const
/** The Xero simulator's Bank reconciliation tab (catch-up Phase 37; US-10.2.4). */
const XERO_BANK = '/demo/xero/bank'
const INVOICE_PAGES = [FINANCES_INVOICE, '/demo/xero/invoices/:accRecId'] as const
/** Admin Intake's tabs (catch-up Phase 34): Matching and the rooms' PDF lists. */
const ADMIN_MATCHING = '/admin/intake/matching'
const ADMIN_PDF_LISTS = '/admin/intake/pdfs'
/** The Admin Intake index heading (catch-up Phase 34). */
const ADMIN_INTAKE_SCREEN = 'Admin · Intake'
const XERO_PAIR = '/demo/xero/invoices/:accRecId'
/** Future scope: HL7 and FHIR (catch-up Phase 34): the simulator, its message log and feed mapping. */
const FUTURE_SCOPE_ROUTES = ['/demo/integrations', '/demo/integrations/log', '/demo/integrations/mapping'] as const
const FUTURE_SCOPE_SCREEN = 'Future scope: HL7 and FHIR'
/** The mobile Lists tab is one splat route; registered as its three explicit layers (`listsStackLocation`). */
const MOBILE_LISTS = ['/mobile/lists', '/mobile/lists/:listId', '/mobile/lists/:listId/bookings/:bookingId'] as const
const ADMIN_DAY = '/admin/day/:dateISO'
const ADMIN_DRAFT_LISTS = '/admin/draft-lists'
const ADMIN_MASTERS = '/admin/masters'
/** The People section (build plan Phase 53): `apps/admin/peoplePaths.ts` builds these in the app. */
const ANAESTHETIST_RECORD = '/admin/people/anaesthetists/:anaesthetistId'
/** The People tabs loaded from a spreadsheet: the sample-sheet trigger shows on them. */
const ADMIN_PEOPLE_SEEDED_TABS = ['/admin/people/anaesthetists', '/admin/people/surgeons', '/admin/people/specialties'] as const
/** The Contracts section (build plan Phase 45): the list and a Contract's page. `apps/admin/contractsPaths.ts` builds these in the app; this file stays out of `src/apps` (the PWA closure contains it). */
const ADMIN_CONTRACTS = '/admin/contracts'
const ADMIN_CONTRACT = '/admin/contracts/:contractId'
/** The section's Parties and Funding tags tabs (build plan Phase 48). */
const ADMIN_PARTIES = '/admin/contracts/parties'
const ADMIN_FUNDING_TAGS = '/admin/contracts/tags'

/** The Contract whose page is open, if any (build plan Phase 49's "Reach the change date"). */
function openContractOf(ctx: DemoTriggerCtx): string | undefined {
  const id = ctx.published['adminContracts.openContractId']
  return typeof id === 'string' ? id : undefined
}

/** "UNI-001 replaced by UNI-002 from 1 Jan 2027" */
function changeDateLabel(state: AppState, r: ContractReplacement): string {
  const code = (id: string) => state.masters.contracts[id]?.aaCode ?? id
  return `${code(r.replacesId)} replaced by ${code(r.contractId)} from ${plainDate(r.fromISO)}`
}
const ADMIN_NOTIFICATIONS = '/admin/notifications'
const MOBILE_AVAILABILITY = '/mobile/availability'
/** A date route param, or undefined. */
const isoParam = (v: string | undefined) => (v !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// ---------------------------------------------------------------------------
// Master data loads (catch-up Phase 42)
// ---------------------------------------------------------------------------

/**
 * The seed sheets each Master data view is loaded from at go-live: the
 * `seeded` field of `apps/admin/screens/masters/masterViews.ts`, restated here
 * because this file stays out of `src/apps` (the PWA closure contains it). A
 * test holds the two equal.
 */
export const SEEDED_SHEETS_BY_VIEW: Readonly<Record<string, readonly LoadEntity[]>> = {
  anaesthetists: ['anaesthetists'],
  hospitals: ['hospitals', 'hospitalHolidays'],
  surgeons: ['surgeons'],
  specialties: ['specialties'],
  publicHolidays: ['publicHolidays'],
  parties: ['parties'],
  fundingTags: ['fundingTags'],
  contracts: ['contracts', 'priceRanges'],
  rvgGroups: ['rvgGroups'],
  modifiers: ['modifiers'],
}

/** The Seed load view's id (`?view=seedLoad`). */
const SEED_LOAD_VIEW = 'seedLoad'

/** The sample sheets on offer for the published Contracts tab or Master data view: all of them on Seed load, else that view's own. */
function sampleSheetsFor(ctx: DemoTriggerCtx): readonly SampleSheet[] {
  // The Contracts section's tab first (build plan Phase 45), then People's (Phase 53): their tabs carry the Master data views' names.
  const view = ctx.published['adminContracts.tab'] ?? ctx.published['adminPeople.tab'] ?? ctx.published['adminMasters.view']
  if (view === SEED_LOAD_VIEW) return SAMPLE_SHEETS
  const entities = view !== undefined ? SEEDED_SHEETS_BY_VIEW[view] : undefined
  if (entities === undefined) return []
  return SAMPLE_SHEETS.filter((s) => entities.includes(s.entity))
}

/** The sample the presenter picked, or the first on offer. */
function chosenSample(ctx: DemoTriggerCtx, choiceId: string | undefined): SampleSheet | undefined {
  const offered = sampleSheetsFor(ctx)
  return (choiceId !== undefined ? offered.find((s) => s.id === choiceId) : undefined) ?? offered[0]
}

const NO_SAMPLE_HERE = 'Open Seed load, a Master data view, or a Contracts or People tab loaded from a spreadsheet'
const SAMPLE_WAITING = 'A load is already waiting for this sheet; load or discard it first'
const GO_LIVE_WAITING = 'A go-live load is already waiting; load or discard it first'

/** A Booking's Admin detail path, or null when it is not in the data (catch-up Phase 41's prepayment entries). */
function adminBookingPath(state: AppState, bookingId: string | undefined): string | null {
  const booking = bookingId !== undefined ? state.schedule.bookings[bookingId] : undefined
  const dateISO = booking !== undefined ? state.schedule.lists[booking.listId]?.dateISO : undefined
  return booking !== undefined && dateISO !== undefined ? `/admin/day/${dateISO}/bookings/${booking.id}` : null
}

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
export const POST_OP_ORIGINAL_LIST_ID = projectedListId(ANAE.sharma, '2026-11-17', 'AM')

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
      ? `${fee.invoiceNumber} paid: ${formatCurrency(fee.total)} received into AA's own account.`
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

/** The payment entries' screens: an invoice, the Xero pair and the Admin Booking detail for its prepayment (catch-up Phase 27). */
const PAYMENT_PAGES = [...INVOICE_PAGES, '/admin/day/:dateISO/bookings/:bookingId'] as const

/** The ACCREC a payment entry acts on: the invoice on screen, or the chosen (else first) prepayment ACCREC on a Booking. */
function paymentTargetOnScreen(state: AppState, ctx: DemoTriggerCtx, choiceId?: string): string | undefined {
  const bookingId = ctx.params['bookingId']
  if (bookingId === undefined) return accRecIdOnScreen(state, ctx)
  const choices = prepaymentAccRecChoices(state, bookingId)
  return choices.find((c) => c.id === choiceId)?.id ?? choices[0]?.id
}

/** Why a payment entry is disabled on this screen: on a Booking, "Not approved yet" until its prepayment is sent. */
function paymentReasonOnScreen(state: AppState, ctx: DemoTriggerCtx, choiceId?: string): string | null {
  const bookingId = ctx.params['bookingId']
  if (bookingId !== undefined) {
    const refused = prepaymentPaymentRefusal(state, bookingId)
    if (refused !== null) return refused
  }
  return paymentDisabledReason(state, paymentTargetOnScreen(state, ctx, choiceId))
}

/** Why a webhook cannot be sent for `accRecId`, or null. The target must be an `openAccRecs` row, as on the Control Panel. */
export function paymentDisabledReason(state: AppState, accRecId: string | undefined): string | null {
  if (accRecId === undefined) return 'Not handed off to Xero'
  const accRec = state.xero.accRecs[accRecId]
  if (accRec === undefined) return 'Not handed off to Xero'
  if (accRec.status === 'voided') return 'Voided in Xero'
  // Catch-up Phase 39: a credited invoice takes no payment, in Xero or the ledger (its correction may still be on its way to Xero).
  if (accRec.status === 'credited' || Object.values(state.billing.ledger).some((p) => 'credit' in p && p.credit !== undefined && p.receivable.xeroAccRecId === accRecId)) return CREDIT_LABELS.paymentDisabled
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
  // Xero's own payments too (catch-up Phase 37): an outage's landed payment has no receipt yet.
  for (const key of [...Object.values(state.billing.receipts), ...Object.values(state.xero.payments)].map((r) => r.idempotencyKey)) {
    if (!key.startsWith(prefix)) continue
    const n = Number(key.slice(prefix.length))
    if (Number.isInteger(n) && n > used) used = n
  }
  return Math.max(used, useDemoTriggerMemory.getState().webhookCounter) + 1
}

/** Simulate a Xero payment webhook, full or half, exactly as the Control Panel's "Record payment" did. */
export function sendPaymentWebhook(api: AppStoreApi, accRecId: string | undefined, mode: 'full' | 'partial'): DemoTriggerResult {
  return paymentWebhook(api, accRecId, mode).result
}

/** The webhook body, and whether the engine received the money into the ledger (not queued by an outage, not a no-op). */
function paymentWebhook(api: AppStoreApi, accRecId: string | undefined, mode: 'full' | 'partial'): { result: DemoTriggerResult; received: boolean } {
  const state = api.getState()
  const reason = paymentDisabledReason(state, accRecId)
  const active = openAccRecs(state).find((c) => c.accRecId === accRecId)
  if (reason !== null || active === undefined) return { result: { ok: false, message: reason ?? 'Not handed off to Xero' }, received: false }
  const partial = roundToCents(active.remaining / 2)
  const amount = mode === 'partial' && partial > 0 ? partial : active.remaining
  const n = nextWebhookN(state, active.accRecId)
  const key = `WEBHOOK-${active.accRecId}-${n}`
  // Through the outage-aware webhook (catch-up Phase 37): during an outage the money lands in Xero and the engine's sync queues.
  const res = deliverPaymentWebhook(api, { accRecId: active.accRecId, amount, idempotencyKey: key })
  useDemoTriggerMemory.getState().rememberWebhook({ accRecId: active.accRecId, key, amount }, n)
  const received = res.ok && res.value.queued !== true && res.value.applied
  return {
    received,
    result: {
    ok: res.ok,
    message: res.ok
      ? res.value.queued === true
        ? `${formatCurrency(amount)} landed in Xero for ${active.invoiceNumber}. Xero is unavailable to the engine, so the payment sync waits in the Xero sync queue: nothing is received in the ledger yet.`
        : res.value.applied
          ? `Webhook for ${active.invoiceNumber}: ${formatCurrency(amount)} received, the paired ACCPAY is authorised for exactly ${formatCurrency(amount)}.`
          : 'No change (already fully paid).'
      : `Refused: ${res.message}`,
    },
  }
}

/** The poll trigger's result line: payments, bill payments and changes made in Xero (catch-up Phase 37). */
export function pollMessage(r: PollResult): string {
  if (r.queued === true) return 'Xero is unavailable, so the reconciliation poll waits in the Xero sync queue.'
  const parts = [
    r.payments > 0 ? `applied ${plural(r.payments, 'missed payment')}` : null,
    r.disbursements > 0 ? `recorded ${plural(r.disbursements, 'missed bill payment')}` : null,
    r.divergences > 0 ? `flagged ${plural(r.divergences, 'invoice')} changed directly in Xero` : null,
  ].filter((p): p is string => p !== null)
  return parts.length > 0 ? `Reconciliation poll ${parts.join(', ')}.` : 'Reconciliation poll ran: nothing missed and nothing changed in Xero.'
}

/** The bill on a Xero pair that Xero's payables run would pay: its ACCPAY, or, for a prepayment, its transfer once posted. */
function billOnPair(state: AppState, accRecId: string | undefined): XeroBill | undefined {
  if (accRecId === undefined) return undefined
  const pair = pairByAccRec(state, accRecId)
  if (pair === undefined || pair.kind === 'aaFee' || pair.payable?.xeroAccPayId === undefined) return undefined
  if (pair.kind === 'prePayment') {
    const transfer = transferForPair(state, pair.id)
    return transfer !== undefined ? { transferId: transfer.id } : undefined
  }
  return { accPayId: pair.payable.xeroAccPayId }
}

/** Why "Pay anaesthetist in Xero" is disabled on this pair, or null. */
function payBillRefusal(state: AppState, accRecId: string | undefined): string | null {
  const rec = accRecId !== undefined ? state.xero.accRecs[accRecId] : undefined
  if (rec === undefined) return 'No invoice in Xero'
  if (rec.kind === 'aaFee') return 'Fee invoices have no bill'
  if (rec.status === 'voided') return 'Voided in Xero'
  const pair = pairByAccRec(state, rec.id)
  if (pair === undefined || pair.kind === 'aaFee' || pair.payable?.xeroAccPayId === undefined) return 'No bill to pay'
  const bill = billOnPair(state, rec.id)
  if (bill === undefined) return 'Held in the AA Holding account until the List is authorised'
  if (xeroBillPayable(state, bill) <= 0) return 'Nothing authorised to pay yet'
  // The gate (catch-up Phase 39a; US-10.2.6): only an unheld line of a scheduled run, with no negative netted on it.
  const refusal = disbursePayableRefusal(state, 'transferId' in bill ? bill.transferId : pair.id)
  if (refusal?.code === 'useRun') return XERO_PAY_BILL_COPY.useRun
  return refusal !== null ? XERO_PAY_BILL_COPY.notApproved : null
}

/** The Xero pair's bill-payment trigger's disabled states (catch-up Phase 39a). */
export const XERO_PAY_BILL_COPY = { notApproved: 'Not in an approved payment run yet', useRun: 'Pay this bill with its run' } as const

/**
 * A replay re-sends a webhook Xero already delivered, so its key must still be
 * in the receipts. Checking the ACCREC alone is not enough: ids restart from
 * the counters after a reset, so the same `XR0001` can come back as a new
 * invoice, and replaying the forgotten key would land a real payment on it.
 */
function replayDisabledReason(state: AppState): string | null {
  const last = useDemoTriggerMemory.getState().lastWebhook
  if (last === null) return 'No payment event to replay yet'
  // Recorded by the engine, or landed in Xero and waiting for the engine (catch-up Phase 37's outage).
  const received = Object.values(state.billing.receipts).some((r) => r.idempotencyKey === last.key) || Object.values(state.xero.payments).some((p) => p.idempotencyKey === last.key)
  if (state.xero.accRecs[last.accRecId] === undefined || !received) return 'The last payment event was cleared by a reset'
  return null
}

/**
 * An anaesthetist's open invoices, for the money screens' payment choosers (the PWA's Balances, and since
 * catch-up Phase 38 the web dashboard and Accounts): every open ACCREC whose pair shows in that
 * anaesthetist's views (`viewerOfPair`: the payee stamped on the pair, a prepayment's transfer payee, or
 * while held the anaesthetist who has the List), never a List join (the demo-surface exemption
 * `openAccRecs` documents).
 */
function personaOpenAccRecs(state: AppState, anaesthetistId: string, opts: { positionOnly?: boolean } = {}) {
  return openAccRecs(state).filter((c) => {
    const pair = pairByAccRec(state, c.accRecId)
    if (pair === undefined || !isBookingPair(pair) || viewerOfPair(state, pair) !== anaesthetistId) return false
    // The web money screens show only what reaches the anaesthetist's position: never a prepayment the AA Holding account holds.
    return opts.positionOnly !== true || !releasedAndPaidFor(state, pair).held
  })
}

function personaPaymentChoices(state: AppState, anaesthetistId: string, opts: { positionOnly?: boolean } = {}) {
  return personaOpenAccRecs(state, anaesthetistId, opts).map((c) => ({
    id: c.accRecId,
    label: `${c.invoiceNumber} · ${c.patientName} · ${formatCurrency(c.remaining)} due`,
  }))
}

function personaPaymentDisabled(state: AppState, anaesthetistId: string, choiceId: string | undefined, opts: { positionOnly?: boolean } = {}): string | null {
  if (personaOpenAccRecs(state, anaesthetistId, opts).length === 0) return 'No open invoices yet'
  if (choiceId === undefined) return 'Choose an invoice'
  return paymentDisabledReason(state, choiceId)
}

/** The web app's persona (`WebApp.tsx` reads the same): the web payment entries choose among her invoices. */
const WEB_PERSONA_ID: string = APP_CONFIG.web.persona.anaesthetistId ?? ANAE.souter

/** The web money screens' payment (catch-up Phase 38): the shared webhook body, and where the money goes next. */
function webPaymentEntry(id: 'web-payment-full' | 'web-payment-half', mode: 'full' | 'partial'): DemoTrigger {
  return {
    id,
    label: mode === 'full' ? 'Payment received · full' : 'Payment received · half',
    description:
      mode === 'full'
        ? "A Xero payment webhook for the full balance of one of the persona's open invoices, chosen below. Collected rises at once; the Outstanding row stays as paid in, due to you; the GST report gains no row until AA pays the anaesthetist."
        : "A Xero payment webhook for half the balance of one of the persona's open invoices, chosen below (a part payment). The Outstanding row stays; the GST report gains no row until AA pays the anaesthetist.",
    screen: 'Web · Dashboard and Accounts',
    routes: ['/web', '/web/accounts/:subTab'],
    surfaces: ['bar'],
    choices: (state) => personaPaymentChoices(state, WEB_PERSONA_ID, { positionOnly: true }),
    disabledReason: (state, _ctx, choiceId) => personaPaymentDisabled(state, WEB_PERSONA_ID, choiceId, { positionOnly: true }),
    run: (api, _ctx, choiceId) => {
      const out = paymentWebhook(api, choiceId, mode)
      // Only money the ledger received is collected; a queued or no-op webhook says so in its own words.
      return out.received ? { ok: true, message: `Payment received. It reaches the GST report when AA pays the anaesthetist. ${out.result.message}` } : out.result
    },
    indexPath: () => '/web/accounts/outstanding',
  }
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
  return first === undefined ? null : financeInvoicePath(first.invoiceId)
}

/** The same open invoice's Xero pair, for the entries that show only there (catch-up Phase 44's audit). */
function firstOpenXeroPairPath(state: AppState): string | null {
  const first = openAccRecs(state)[0]
  return first === undefined ? null : `/demo/xero/invoices/${first.accRecId}`
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

/**
 * The Booking's open warnings, as the PWA stand-in's choices. Never the
 * balance warning (catch-up Phase 40): the anaesthetist sees only its colour
 * code, which ignores the office's Clear, so clearing it from the phone would
 * show nothing.
 */
function openWarningChoices(state: AppState, ctx: DemoTriggerCtx) {
  return warningsForBooking(state, ctx.params['bookingId'] ?? '')
    .filter((w) => w.clearance === undefined && w.ruleId !== 'patientBalance')
    .map((w) => ({ id: w.key, label: w.text }))
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

/** Dr Souter's Tue 21 PM List: open, and already used by the catalogue recipes. */
const PHOTO_CAPTURE_INDEX_LIST_ID = SEED_LIST_IDS.souterPm21

/** Every screen an NHI lookup opens on (catch-up Phase 40a); the entry shows only while one is open. */
const NHI_HUB_ROUTES = [
  ...MOBILE_LISTS,
  '/web/lists/:listId',
  ADMIN_DAY,
  ADMIN_DRAFT_LISTS,
  '/admin/people/patients',
  '/admin/intake/waiting',
  '/admin/people/patients/:nhi',
] as const
const NHI_HUB_SCREEN = 'Add booking, and Admin · People · Patients'

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

/** The PWA office stand-in's choice from the route (catch-up Phase 33): S1, this List, or this Booking. */
function standInChoice(ctx: DemoTriggerCtx, choiceId: string | undefined): StandInChoice {
  if (choiceId === 'booking' && ctx.params['bookingId'] !== undefined) return { kind: 'booking', bookingId: ctx.params['bookingId'] }
  if (choiceId === 'list' && ctx.params['listId'] !== undefined) return { kind: 'list', listId: ctx.params['listId'] }
  return { kind: 's1' }
}

/**
 * The AM and PM sessions of the day open in My calendar (catch-up Phase 32d's
 * office stand-in), each named with its status line; a session that cannot take
 * Public stays listed and its disabled reason says why.
 */
function officePublicChoices(state: AppState, ctx: DemoTriggerCtx): { id: string; label: string }[] {
  const day = ctx.published['mobileCalendar.day']
  if (day === undefined) return []
  const [anaesthetistId, dateISO] = day.split('|') as [string, string]
  return (['AM', 'PM'] as const).flatMap((session) => {
    const slot = state.schedule.slots[slotIdFor(anaesthetistId, dateISO, session)]
    if (slot === undefined) return []
    return [{ id: slot.id, label: `${shortDay(dateISO)} ${sessionText(session)}, now ${statusLine(slot, state.masters.slotStatuses)}` }]
  })
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
  // ── Admin · Finances · Billing (build plan Phase 58; D111) ────────────
  {
    id: 'billing-failure',
    label: 'Trigger billing failure',
    description:
      "Arms the Xero hand-off to fault for Losa Tuilagi's Booking alone and authorises Dr Ropata's Thu 19 Nov List. Each Booking bills from its locked record: hers waits for Xero in the sync queue, Hemi Walker's bills and hands off, and the List is not failed. Retry now (or the clock) hands hers off once. No Contract changes.",
    screen: FINANCES_BILLING_SCREEN,
    routes: [FINANCES_BILLING],
    surfaces: ['bar'],
    when: (state) => state.schedule.lists[SEED_LIST_IDS.billingFailure] !== undefined,
    disabledReason: (state) => {
      const list = state.schedule.lists[SEED_LIST_IDS.billingFailure]
      return list?.billedAtISO !== undefined || list?.state === 'AUTHORISED' ? BILLING_FAILURE_ALREADY : null
    },
    // Re-based in catch-up Phase 25 (`stageBillingFailure`): the engine prices
    // only from the lock, so the cause is outside it (the hand-off).
    run: (api) => {
      const staged = stageBillingFailure(api)
      return {
        ok: staged.ok,
        message: staged.ok
          ? "Done. On Finances · Xero Losa Tuilagi's invoice waits for Xero in the sync queue while Hemi Walker's billed. Use Retry now on its queue row, or move the clock on."
          : staged.message === BILLING_FAILURE_ALREADY
            ? 'Already triggered.'
            : `Refused: ${staged.message}`,
      }
    },
    indexPath: () => FINANCES_BILLING,
  },
  // ── Admin · Finances · Xero, beside the Xero simulator (catch-up Phase 37; EP-09; build plan Phase 58) ──
  {
    id: 'arm-handoff-fault',
    label: 'Arm handoff failure',
    description:
      'The next Xero call fails once. The queue retries it automatically after a short backoff; advance the clock to see it land.',
    screen: FINANCES_XERO_SCREEN,
    routes: [FINANCES_XERO],
    surfaces: ['bar'],
    disabledReason: (state) => (state.settings.failNextHandoff === true ? 'Armed' : null),
    run: (api) => {
      armHandoffFault(api, OFFICE_ACTOR)
      return { ok: true, message: 'Armed. The next Xero hand-off fails once and waits in the sync queue, which retries it after its backoff.' }
    },
    indexPath: () => FINANCES_XERO,
  },
  {
    id: 'xero-outage-start',
    label: 'Simulate Xero outage',
    description:
      "Xero's API stops answering the Billing Engine. New hand-offs, payment syncs, disbursement syncs and the poll wait in the Xero sync queue and retry with increasing gaps. Authorising a List still works and bills.",
    screen: FINANCES_XERO_SCREEN,
    routes: [FINANCES_XERO, ...XERO_SIM],
    surfaces: ['bar'],
    disabledReason: (state) => (xeroAvailable(state) ? null : 'Xero is already unavailable'),
    run: (api) => {
      const out = setXeroOutage(api, DEMO_TRIGGER_ACTOR, true)
      return out.ok
        ? { ok: true, message: "Xero is unavailable to the Billing Engine. Authorise a List: its hand-offs wait in the Xero sync queue, and every clock change retries what is due." }
        : { ok: false, message: out.message }
    },
    indexPath: () => FINANCES_XERO,
  },
  {
    id: 'xero-outage-restore',
    label: 'Restore Xero',
    description: 'Xero answers again. The queue drains at once, in order, with no duplicate pair, contact, receipt or disbursement.',
    screen: FINANCES_XERO_SCREEN,
    routes: [FINANCES_XERO, ...XERO_SIM],
    surfaces: ['bar'],
    disabledReason: (state) => (xeroAvailable(state) ? 'Xero is connected' : null),
    run: (api) => {
      const out = setXeroOutage(api, DEMO_TRIGGER_ACTOR, false)
      return out.ok
        ? { ok: true, message: out.value.sent > 0 ? `Xero is back. The queue sent ${plural(out.value.sent, 'waiting call')} in order.` : 'Xero is back. Nothing was waiting.' }
        : { ok: false, message: out.message }
    },
    indexPath: () => FINANCES_XERO,
  },
  // ── Admin · Finances · Ledger (catch-up Phase 36; US-13.2.1, US-08.3.4) ──
  {
    id: 'inject-unmatched-receipt',
    label: 'Inject unmatched receipt',
    description:
      'A bank-feed notification arrives for $120.00 that matches no invoice number. The ledger goes out of balance by $120.00; naming Dr Souter puts her on the out-of-balance list. The office clears it with Allocate to invoice or Mark refunded.',
    screen: FINANCES_LEDGER_SCREEN,
    // Also on the Admin Day dashboard, whose Reconciliation card it puts out of balance (catch-up Phase 37; US-13.2.4).
    routes: [...FINANCES_LEDGER, ADMIN_DAY],
    surfaces: ['bar'],
    choices: () => [
      { id: UNMATCHED_RECEIPT_DEMO.namesSouter.id, label: UNMATCHED_RECEIPT_DEMO.namesSouter.label },
      { id: UNMATCHED_RECEIPT_DEMO.namesNoOne.id, label: UNMATCHED_RECEIPT_DEMO.namesNoOne.label },
    ],
    defaultChoice: () => UNMATCHED_RECEIPT_DEMO.namesSouter.id,
    disabledReason: (state) => injectUnmatchedRefusal(state),
    run: (api, _ctx, choiceId) => {
      const out = injectUnmatchedReceipt(api, choiceId)
      return out.ok ? { ok: true, message: out.value.message } : { ok: false, message: out.message }
    },
    indexPath: () => FINANCES_LEDGER[0],
  },
  {
    id: 'run-reconciliation-poll',
    label: 'Run reconciliation poll',
    description:
      'Runs the daily safety net now, without advancing the clock: payments and bill payments a webhook missed, and invoices voided or edited directly in Xero. During an outage it waits in the queue. Also in the Xero simulation.',
    screen: FINANCES_XERO_SCREEN,
    routes: [FINANCES_XERO, ...XERO_SIM],
    surfaces: ['bar'],
    disabledReason: () => null,
    run: (api) => {
      const r = runReconciliationPoll(api)
      return { ok: true, message: pollMessage(r) }
    },
    indexPath: () => FINANCES_XERO,
  },
  {
    id: 'run-archive-job',
    label: 'Run archive job',
    description:
      'Runs the nightly Xero contact-archive job now, without advancing the clock. Also in the Xero simulation.',
    screen: FINANCES_XERO_SCREEN,
    routes: [FINANCES_XERO, ...XERO_SIM],
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
    indexPath: () => FINANCES_XERO,
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
    indexPath: () => '/admin/day/2026-11-24/bookings/BK0006',
  },

  // ── Admin · Review and Booking detail (seed-scoped) ──────────────────────
  {
    id: 'stage-post-op',
    label: 'Stage post-op scenario',
    description:
      "Gives Dr Souter a submitted ACL reconstruction (Coral Bennett, Wed 18 Nov) awaiting review, to add pre-op and post-op events to, and keeps Dr Sharma's Tue 17 Nov List ready for the additional invoice.",
    screen: 'Admin · Review and Booking detail; Mobile and Web · Lists and Booking',
    // Catch-up Phase 39b: also on the anaesthetist's Lists and Booking (bar and the PWA sheet).
    routes: ['/admin/review/:listId', '/admin/day/:dateISO/bookings/:bookingId', ...MOBILE_LISTS, '/web/lists', '/web/lists/:listId', WEB_BOOKING],
    surfaces: ['bar', 'pwa'],
    when: (state, ctx) => {
      if (!ctx.pathname.startsWith('/admin')) return true
      const listId = ctx.params['listId'] ?? state.schedule.bookings[ctx.params['bookingId'] ?? '']?.listId
      return listId === POST_OP_ORIGINAL_LIST_ID && state.schedule.lists[listId] !== undefined
    },
    // Each half is idempotent on its own; the trigger stays enabled until both are staged.
    disabledReason: (state) =>
      state.schedule.lists[POST_OP_ORIGINAL_LIST_ID]?.state === 'AUTHORISED' && stagedSouterBooking(state) !== undefined
        ? 'Already staged: search Bennett and open Wednesday\'s Booking'
        : null,
    // 38b's half: authorise (lock and bill) Sarah Mitchell's episode for the additional invoice.
    // 39b's half: Dr Souter's submitted ACL reconstruction for pre-op and post-op events.
    run: (api) => {
      const listId = POST_OP_ORIGINAL_LIST_ID
      const list = api.getState().schedule.lists[listId]
      if (list === undefined) return { ok: false, message: 'The post-op original list is not present in this seed.' }
      if (list.state === 'ACTIVE') submitList(api, OFFICE_ACTOR, listId)
      const submitted = api.getState().schedule.lists[listId]
      // A refused authorise ("Needs a price", or an incomplete Booking) is the message (catch-up Phase 25).
      if (submitted?.state === 'SUBMITTED') {
        const authorised = authoriseList(api, OFFICE_ACTOR, listId)
        if (!authorised.ok) return { ok: false, message: `Refused: ${authorised.message}` }
      }
      const souter = stagePostOpForSouter(api)
      if (!souter.ok) return { ok: false, message: souter.message }
      return {
        ok: true,
        message:
          "Staged. Search Bennett, open Wednesday's Booking and use Add pre-op or post-op event. Sarah Mitchell's Tue 17 Nov List is authorised and billed for Create additional invoice.",
      }
    },
    indexPath: () => `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`,
  },
  // ── Admin · Finances · Billing and Review: the next billing run for events (catch-up Phase 38b) ──
  {
    id: 'run-next-billing-run',
    label: 'Run the next billing run',
    description:
      'Invoices every approved additional invoice: each becomes its own invoice with its own number, ledger pair and Xero pair, linked to the original. Stands in for the scheduled run of the real system.',
    screen: FINANCES_BILLING_SCREEN,
    routes: [FINANCES_BILLING, '/admin/review'],
    surfaces: ['bar'],
    disabledReason: (state) => nextRunRefusal(state),
    run: (api) => {
      const out = runNextBillingRun(api)
      if (!out.ok) return { ok: false, message: out.message }
      const skipped = out.value.skipped.length > 0 ? ` ${out.value.skipped.length} not invoiced: ${out.value.skipped[0]!.message}` : ''
      // Catch-up Phase 39: a credit note and its replacements are raised by the same run.
      const numbers = [...out.value.creditNoteNumbers, ...out.value.numbers].join(', ')
      return { ok: true, message: `Billing run done: ${CREDIT_COPY.runResult(out.value.creditNoteNumbers.length, out.value.numbers.length)} (${numbers}).${skipped}` }
    },
    indexPath: () => FINANCES_BILLING,
  },
  // ── Admin · Finances · Invoices: a billed Merivale combination to split (catch-up Phase 39) ──
  {
    id: 'stage-combined-procedure',
    label: 'Stage combined procedure',
    description:
      "Books, completes, authorises and bills a post-paid Merivale combination (Facelift plus 2 add ons) on Dr Delaney's Fri 13 Nov PM List, billed to the patient, so its invoice can be credited and split into additional invoices that add up to it.",
    screen: FINANCES_INVOICES_SCREEN,
    routes: [FINANCES_INVOICES],
    surfaces: ['bar'],
    disabledReason: (state) => stageCombinedRefusal(state),
    run: (api) => {
      const out = stageCombinedProcedure(api)
      if (!out.ok) return { ok: false, message: out.message }
      return {
        ok: true,
        message: CREDIT_DEMO_COPY.combinedStaged,
        link: { to: financeInvoicePath(out.value.invoiceId), label: CREDIT_DEMO_COPY.openInvoice(out.value.invoiceNumber) },
      }
    },
    indexPath: (state) => {
      const invoice = stagedCombined(state)?.invoice
      return invoice !== undefined ? financeInvoicePath(invoice.id) : FINANCES_INVOICES
    },
  },
  // ── Admin · Finances · Payments: the weekly payment cycle's staging (catch-up Phase 39a) ──
  {
    id: 'stage-payment-week',
    label: 'Stage a payment week',
    description:
      "Nineteen of Dr Sharma's invoices, each paid through the ordinary payment webhook, so 19 BCTIs are released into this week's run. The second choice also credits an earlier invoice already paid out to her, leaving a negative invoice to net in the run.",
    screen: FINANCES_PAYMENTS_SCREEN,
    routes: [FINANCES_PAYMENTS],
    surfaces: ['bar'],
    choices: () => PAYMENT_WEEK_CHOICES.map((c) => ({ id: c.id, label: c.label })),
    defaultChoice: () => 'bctis',
    disabledReason: (state) => stagePaymentWeekRefusal(state),
    run: (api, _ctx, choiceId) => {
      const out = stagePaymentWeek(api, DEMO_TRIGGER_ACTOR, choiceId)
      return out.ok ? { ok: true, message: out.value.message } : { ok: false, message: out.message }
    },
    indexPath: () => FINANCES_PAYMENTS,
  },
  {
    id: 'stage-bank-mismatch',
    label: 'Stage a bank mismatch',
    description: "Removes one receipt from the simulated bank download (the newest that released a payable in this week's run), so closing the week raises a \"Receipt not on the bank download\" anomaly.",
    screen: FINANCES_PAYMENTS_SCREEN,
    routes: [FINANCES_PAYMENTS],
    surfaces: ['bar'],
    disabledReason: (state) => stageBankMismatchRefusal(state),
    run: (api) => {
      const out = stageBankMismatch(api, DEMO_TRIGGER_ACTOR)
      return out.ok ? { ok: true, message: out.value.message } : { ok: false, message: out.message }
    },
    indexPath: () => FINANCES_PAYMENTS,
  },
  // ── Admin · Finances · Invoice: paid in full and paid out, before a credit (catch-up Phase 39) ──
  {
    id: 'stage-refund-after-payout',
    label: 'Stage refund after payout',
    description:
      "Records a payment in full on the invoice on screen and pays the anaesthetist out through Xero's payables run, so a following credit raises a negative invoice with an amount to net in their next payment run.",
    screen: FINANCES_INVOICE_SCREEN,
    routes: [FINANCES_INVOICE],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => refundAfterPayoutRefusal(state, ctx.params['invoiceId']),
    run: (api, ctx) => {
      const out = stageRefundAfterPayout(api, ctx.params['invoiceId'])
      return out.ok ? { ok: true, message: CREDIT_DEMO_COPY.paidOut(out.value.payee) } : { ok: false, message: out.message }
    },
    // Sarah Mitchell's invoice once Stage post-op scenario has run, else the first open invoice.
    indexPath: (state) => {
      const id = refundAfterPayoutTarget(state, undefined)
      return id !== undefined ? financeInvoicePath(id) : firstOpenInvoicePath(state)
    },
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },

  // ── Admin · Intake, PDF lists (catch-up Phase 34) ────────────────────
  {
    id: 'pdf-list-resend',
    label: 'Receive updated PDF from rooms',
    description:
      "The rooms re-send a PDF list already sent to matching, with one changed time and one new patient. It lands in the inbox as received, marked Re-sent, with the address it came from. Once sent, the matching screen shows the change as a difference for approval and the new patient as a new row.",
    screen: ADMIN_INTAKE_SCREEN,
    routes: [ADMIN_PDF_LISTS],
    surfaces: ['bar'],
    choices: (state) =>
      PDF_LIST_SAMPLES.filter((s) => Object.values(state.intake.pdfLists).some((l) => l.sampleId === s.id)).map((s) => ({
        id: s.id,
        label: `${s.surgeonName}, ${s.subject.split(' · ')[1] ?? s.subject}`,
      })),
    disabledReason: (state, _ctx, choiceId) => {
      const sampleId = choiceId ?? PDF_LIST_SAMPLES.find((s) => Object.values(state.intake.pdfLists).some((l) => l.sampleId === s.id))?.id
      return sampleId === undefined ? 'No PDF list has been sent to matching yet.' : resendRefusal(state, sampleId)
    },
    run: (api, _ctx, choiceId) => {
      const sampleId = choiceId ?? PDF_LIST_SAMPLES[0]!.id
      const res = receiveResentPdfList(api, OFFICE_ACTOR, sampleId)
      const resend = resendSampleFor(sampleId)
      return {
        ok: res.ok,
        message: res.ok
          ? `The updated list arrived from ${resend?.defaultSender ?? 'the rooms'}, marked Re-sent. Open it and Send to matching: unchanged rows are skipped, the changed time waits as a difference for approval and the new patient arrives as a new row.`
          : `Refused: ${res.message}`,
      }
    },
    indexPath: () => ADMIN_PDF_LISTS,
  },

  // ── Admin · Invoice (and the Xero sim pair) ───────────────────────────
  {
    id: 'regenerate-invoice',
    label: 'Regenerate from locked data',
    description:
      "Rebuilds the invoice on screen from its Booking's locked record (the pricing snapshot taken at authorise) and compares it with the invoice as stored: identical, with its line count and total, or the differences. Read-only. Try it after a Contract edit, a Disable, a backdated price range, an RVG group edit, a unit-value edit, or a patient address or payer email change. An additional invoice regenerates from its event's lines.",
    screen: FINANCES_INVOICE_SCREEN,
    routes: [FINANCES_INVOICE],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => {
      const invoiceId = ctx.params['invoiceId']
      return invoiceId === undefined ? 'Open an invoice first' : regenerateRefusal(state, invoiceId)
    },
    run: (api, ctx) => {
      const invoiceId = ctx.params['invoiceId']
      if (invoiceId === undefined) return { ok: false, message: 'Open an invoice first' }
      const result = regenerateInvoiceFromLock(api.getState(), invoiceId)
      useDemoTriggerMemory.getState().rememberRegenerate(invoiceId, result)
      return { ok: result.ok && result.comparison.identical, message: regenerateSummary(result) }
    },
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No invoice yet: authorise a List first',
  },
  {
    id: 'payment-full',
    label: 'Payment received · full',
    description:
      'Simulates a Xero payment webhook for the remaining balance of the invoice on screen. Its paired ACCPAY is authorised for exactly the amount received. Also on the Xero simulation pair.',
    screen: FINANCES_INVOICE_SCREEN,
    routes: PAYMENT_PAGES,
    surfaces: ['bar'],
    // A fee payment is "Record fee payment", never a procedure webhook.
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    // On the Admin Booking detail (catch-up Phase 27): that Booking's sent prepayment invoices.
    choices: (state, ctx) => (ctx.params['bookingId'] !== undefined ? prepaymentAccRecChoices(state, ctx.params['bookingId']) : []),
    disabledReason: (state, ctx, choiceId) => paymentReasonOnScreen(state, ctx, choiceId),
    run: (api, ctx, choiceId) => sendPaymentWebhook(api, paymentTargetOnScreen(api.getState(), ctx, choiceId), 'full'),
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'payment-half',
    label: 'Payment received · half',
    description:
      'Simulates a Xero payment webhook for half the remaining balance of the invoice on screen (a part payment). Its paired ACCPAY is authorised for exactly the amount received. Also on the Xero simulation pair.',
    screen: FINANCES_INVOICE_SCREEN,
    routes: PAYMENT_PAGES,
    surfaces: ['bar'],
    // A fee payment is "Record fee payment", never a procedure webhook.
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    // On the Admin Booking detail (catch-up Phase 27): that Booking's sent prepayment invoices.
    choices: (state, ctx) => (ctx.params['bookingId'] !== undefined ? prepaymentAccRecChoices(state, ctx.params['bookingId']) : []),
    disabledReason: (state, ctx, choiceId) => paymentReasonOnScreen(state, ctx, choiceId),
    run: (api, ctx, choiceId) => sendPaymentWebhook(api, paymentTargetOnScreen(api.getState(), ctx, choiceId), 'partial'),
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'payment-replay',
    label: 'Replay last payment event',
    description:
      'Re-sends the last payment webhook with the same key, to show it is ignored (idempotent by key, no double effect).',
    screen: FINANCES_INVOICE_SCREEN,
    routes: PAYMENT_PAGES,
    surfaces: ['bar'],
    // A fee payment is "Record fee payment", never a procedure webhook.
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    disabledReason: (state) => replayDisabledReason(state),
    run: (api) => {
      const last = useDemoTriggerMemory.getState().lastWebhook
      const reason = replayDisabledReason(api.getState())
      if (last === null || reason !== null) return { ok: false, message: reason ?? 'No payment event to replay yet' }
      const res = deliverPaymentWebhook(api, { accRecId: last.accRecId, amount: last.amount, idempotencyKey: last.key })
      return {
        ok: res.ok,
        message: !res.ok ? `Refused: ${res.message}` : !res.value.applied ? 'Duplicate webhook ignored (idempotent by key). No double effect.' : 'Replayed.',
      }
    },
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },

  // ── Admin · Finances · AA fees (catch-up Phase 16) ────────────────────
  {
    id: 'run-scheduled-fee-run',
    label: 'Run scheduled month-end fee run',
    description:
      'Stands in for the month-end job: raises AA\'s fee invoice to every active anaesthetist not yet invoiced for the month in the picker, as the scheduled system run.',
    screen: FINANCES_AA_FEES_SCREEN,
    routes: [FINANCES_AA_FEES],
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
    indexPath: () => FINANCES_AA_FEES,
  },
  {
    id: 'seed-month-of-bctis',
    label: 'Seed a month of BCTIs',
    description: `Tops Dr Rutherford up to ${BCTI_SEED_TARGET} BCTIs paid in ${aaFeeMonthLabel(BCTI_SEED_MONTH)} (paid and disbursed procedure invoices on 1 to 9 November), so the next fee run shows the worked example.`,
    screen: FINANCES_AA_FEES_SCREEN,
    routes: [FINANCES_AA_FEES],
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
    indexPath: () => FINANCES_AA_FEES,
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
      const accRecId = oldestUnpaid !== undefined ? state.billing.ledger[oldestUnpaid.ledgerPairId]?.receivable.xeroAccRecId : undefined
      return accRecId === undefined ? null : `/demo/xero/invoices/${accRecId}`
    },
    indexEmptyReason: 'Every AA fee invoice is paid',
  },

  // ── Xero simulation · a pair: what AA staff and Xero do there (catch-up Phase 37) ──
  {
    id: 'xero-amend-invoice',
    label: "Edit this invoice's total in Xero",
    description: `AA staff edit a line on this invoice directly in Xero and its total drops by ${formatCurrency(XERO_DEMO_AMENDMENT)}. The engine keeps the amount it issued and does not know until the next reconciliation poll.`,
    screen: 'Xero simulation · pair',
    routes: [XERO_PAIR],
    surfaces: ['bar'],
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    disabledReason: (state, ctx) => amendInXeroRefusal(state, ctx.params['accRecId']),
    run: (api, ctx) => {
      const out = amendAccRecInXero(api, XERO_STAFF_ACTOR, ctx.params['accRecId'] ?? '')
      return out.ok
        ? { ok: true, message: `${out.value.invoiceNumber} now totals ${formatCurrency(out.value.total)} in Xero. The engine still holds the amount it issued and finds out at the next poll (Run reconciliation poll, or Next day).` }
        : { ok: false, message: out.message }
    },
    indexPath: firstOpenXeroPairPath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'xero-void-invoice',
    label: 'Void this invoice in Xero',
    description: 'AA staff void this invoice directly in Xero. The engine does not know until the next reconciliation poll, which flags it for the office.',
    screen: 'Xero simulation · pair',
    routes: [XERO_PAIR],
    surfaces: ['bar'],
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    disabledReason: (state, ctx) => voidInXeroRefusal(state, ctx.params['accRecId']),
    run: (api, ctx) => {
      const out = voidAccRecInXero(api, XERO_STAFF_ACTOR, ctx.params['accRecId'] ?? '')
      return out.ok
        ? { ok: true, message: `${out.value.invoiceNumber} is voided in Xero. The engine does not know yet: run the reconciliation poll (or Next day) and it is flagged on Finances · Xero.` }
        : { ok: false, message: out.message }
    },
    indexPath: firstOpenXeroPairPath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'xero-pay-bill',
    label: 'Pay anaesthetist in Xero (payables run)',
    description:
      "Xero's payables run pays this pair's bill to the anaesthetist, as AA does in Xero. The Billing Engine records the disbursement when the bill-paid webhook arrives, or at the next poll if it is missed.",
    screen: 'Xero simulation · pair',
    routes: [XERO_PAIR],
    surfaces: ['bar'],
    when: (state, ctx) => !isFeePairOnScreen(state, ctx),
    choices: () => [
      { id: 'deliver', label: 'Bill-paid webhook delivers' },
      { id: 'missed', label: 'Webhook missed (the poll catches it)' },
    ],
    defaultChoice: () => 'deliver',
    disabledReason: (state, ctx) => payBillRefusal(state, ctx.params['accRecId']),
    run: (api, ctx, choiceId) => {
      const accRecId = ctx.params['accRecId']
      const reason = payBillRefusal(api.getState(), accRecId)
      const bill = billOnPair(api.getState(), accRecId)
      if (reason !== null || bill === undefined) return { ok: false, message: reason ?? 'No bill to pay' }
      const missed = choiceId === 'missed'
      const payoutId = 'transferId' in bill ? bill.transferId : pairByAccRec(api.getState(), accRecId!)!.id
      const out = disbursePayable(api, XERO_PAYABLES_ACTOR, payoutId, { webhook: missed ? 'missed' : 'deliver' })
      if (!out.ok) return { ok: false, message: out.message }
      if (out.value.billsPaid === 0) return { ok: false, message: 'Nothing authorised to pay yet' }
      const amount = formatCurrency(out.value.totalPaid)
      const week = paymentWeekFor(api.getState(), out.value.payablesRunId) ?? 'its'
      return {
        ok: true,
        message: missed
          ? `Paid ${amount} in Xero in ${week}'s payment run. The webhook was missed, so the engine still shows it released and not disbursed until the next poll.`
          : out.value.queued > 0
            ? `Paid ${amount} in Xero in ${week}'s payment run. Xero is unavailable to the engine, so recording the disbursement waits in the sync queue.`
            : `Paid ${amount} in Xero in ${week}'s payment run. The bill-paid webhook told the engine, which recorded the disbursement.`,
      }
    },
    indexPath: firstOpenXeroPairPath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'xero-bulk-remittance',
    label: 'Simulate bulk hospital remittance',
    description:
      "St George's pays several invoices with one bank payment. Xero's remittance add-on matches the lines by invoice number and the engine learns each payment by webhook; one line quotes a mistyped number and waits in Bank reconciliation for the office.",
    screen: 'Xero simulation · invoices',
    routes: ['/demo/xero/invoices', XERO_BANK],
    surfaces: ['bar'],
    disabledReason: (state) => bulkRemittanceRefusal(state),
    run: (api) => {
      const out = receiveBulkRemittance(api)
      if (!out.ok) return { ok: false, message: out.message }
      const r = out.value
      const learned = r.queued > 0 ? 'Xero is unavailable to the engine, so the payment syncs wait in the queue' : 'the engine learned each payment by webhook'
      return {
        ok: true,
        message: `St George's remittance landed in Xero: ${plural(r.matchedCount, 'line')} matched by invoice number (${formatCurrency(r.matchedTotal)}), and ${learned}. ${plural(r.unmatchedCount, 'line')} could not be matched and waits in Bank reconciliation.`,
      }
    },
    indexPath: () => '/demo/xero/invoices',
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
  // ── Mobile · Booking, installed PWA only: the office reviews an additional invoice (catch-up Phase 38b) ──
  {
    id: 'office-reviews-additional-invoice',
    // Catch-up Phase 39b: widened to every reviewed kind; 38b's id kept (tests and recipes name it).
    label: 'Office reviews this event',
    description:
      'Stands in for the office, which has no app on the phone: approves the oldest event awaiting review on this Booking (else takes the oldest approved one) and invoices it in the next billing run, as Kirsty would from Admin Review.',
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => officeReviewRefusal(state, ctx.params['bookingId'] ?? ''),
    run: (api, ctx) => {
      const res = officeReviewsAdditionalInvoice(api, ctx.params['bookingId'] ?? '')
      return res.ok
        ? { ok: true, message: `Reviewed by the office (simulated). Invoice ${res.value.number} raised in the next run.` }
        : { ok: false, message: res.message }
    },
    indexPath: () => null,
  },
  // ── Mobile · Booking, installed PWA only: the office reviews a credit (catch-up Phase 39) ──
  {
    id: 'office-reviews-credit',
    label: 'Office reviews this credit',
    description:
      'Stands in for the office, which has no app on the phone: approves the credit awaiting review on this Booking, with any new invoice raised with it, and issues it in the next billing run, as Kirsty would from Admin Review.',
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => officeReviewsCreditRefusal(state, ctx.params['bookingId'] ?? ''),
    run: (api, ctx) => {
      const res = officeReviewsCredit(api, ctx.params['bookingId'] ?? '')
      return res.ok ? { ok: true, message: CREDIT_DEMO_COPY.creditIssued(res.value.creditNoteNumber) } : { ok: false, message: res.message }
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
  // ── Mobile · My calendar: the office sets a session to Public (catch-up Phase 32d; PWA parity) ──
  {
    id: 'availability-office-sets-public',
    label: 'Office sets this session to Public',
    description:
      'Stands in for the office on the phone: sets the AM or PM session of the last day you opened in My calendar to Public with the note "CPH", as Kirsty would with Change status in the Admin Day drawer. Open a day, close it, then run this. Not on a session that holds a List, is already Public or is past.',
    screen: 'Mobile · My calendar, the day last opened',
    routes: [`${MOBILE_AVAILABILITY}/calendar`],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    when: (_state, ctx) => ctx.published['mobileCalendar.day'] !== undefined,
    choices: (state, ctx) => officePublicChoices(state, ctx),
    disabledReason: (state, ctx, choiceId) => {
      const slotId = choiceId ?? officePublicChoices(state, ctx)[0]?.id
      if (slotId === undefined) return 'Open a day in My calendar, then close it'
      return officeSetsPublicRefusal(state, slotId)
    },
    run: (api, ctx, choiceId) => {
      const slotId = choiceId ?? officePublicChoices(api.getState(), ctx)[0]?.id
      if (slotId === undefined) return { ok: false, message: 'Open a day in My calendar' }
      const res = setSessionPublicAsSimulatedOffice(api, slotId)
      if (!res.ok) return { ok: false, message: res.message }
      const status = api.getState().schedule.slots[slotId]
      return { ok: true, message: `The office set this session to ${status !== undefined ? statusLine(status, api.getState().masters.slotStatuses) : 'Public'}.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build plays the office in Admin (Change status in the Day drawer).',
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
    indexPath: () => '/admin/day/2026-11-25',
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
    indexPath: () => '/admin/day/2026-11-24',
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
    indexPath: () => '/admin/day/2026-11-25',
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
  // ── Admin · Contracts: a backdated range on Merivale's Face lift (catch-up Phase 24, US-05.2.8; on the Contracts section since build plan Phase 45) ──
  {
    id: 'demo-backdated-range',
    label: 'Demo: add a backdated price range',
    description:
      "Adds a range from 4 Nov 2026 at $3,300.00 (a demo figure) to Merivale's Face lift, as the office. The unedited Face lift Bookings re-price; the one with a typed price and the AUTHORISED, invoiced one stay put.",
    screen: 'Admin · Contracts',
    routes: [ADMIN_CONTRACTS, ADMIN_CONTRACT],
    surfaces: ['bar'],
    // On the Contract list, or on the Face lift's own page, where the new range shows as the table's top row;
    // once the range is added it stays listed, disabled, so its result line can be read.
    when: (_state, ctx) => ctx.published['adminContracts.tab'] === 'contracts' || ctx.published['adminContracts.openContractId'] === BACKDATED_RANGE_CONTRACT_ID,
    disabledReason: (state) => (backdatedRangeAdded(state) ? 'Already added' : null),
    run: (api) => {
      const res = addBackdatedRangeDemo(api)
      if (!res.ok) return { ok: false, message: res.message }
      // The kept-price count and names come from the same list the ranges table shows (catch-up Phase 25a, D79).
      const kept = keptPriceForRange(api.getState(), BACKDATED_RANGE_CONTRACT_ID, BACKDATED_RANGE)
      const keptText = kept.length > 0 ? ` ${keptPriceTitle(kept.length)}: ${kept.map((r) => `${r.patientName}, ${formatMoney(r.lockedPrice)}`).join('; ')}.` : ''
      return { ok: true, message: `Added a range from 4 Nov 2026 at $3,300.00 to the Face lift. Unedited Face lift Bookings now price at $3,300.00; the typed and the invoiced ones are held.${keptText}` }
    },
    indexPath: () => `${ADMIN_CONTRACTS}/${BACKDATED_RANGE_CONTRACT_ID}`,
    indexHint: "Merivale's Face lift: the new range shows as the top row of its price ranges, with the Procedures it priced and the kept-price warning.",
  },
  // ── Admin · Contracts: reach a replacement's change date (build plan Phase 49; US-04.1.8, DM-03) ──
  {
    id: 'contract-reach-change-date',
    label: 'Demo: reach the change date',
    description:
      "Moves the demo clock forward to a Contract replacement's change date, so the old Contract's \"Disable\" to-do shows in the Day view's To-do and on its page while it is still offered. On a Contract's page it takes that Contract's replacement; on the list, the soonest date still ahead. Reset puts the clock back.",
    screen: 'Admin · Contracts',
    routes: [ADMIN_CONTRACTS, ADMIN_CONTRACT],
    surfaces: ['bar'],
    when: (_state, ctx) => ctx.published['adminContracts.tab'] === 'contracts' || typeof ctx.published['adminContracts.openContractId'] === 'string',
    choices: (state, ctx) => {
      const ahead = replacementsAhead(state, openContractOf(ctx))
      return ahead.length < 2 ? [] : ahead.map((r) => ({ id: r.contractId, label: changeDateLabel(state, r) }))
    },
    disabledReason: (state, ctx) => (replacementsAhead(state, openContractOf(ctx)).length === 0 ? 'No replacement date ahead' : null),
    run: (api, ctx, choiceId) => {
      const ahead = replacementsAhead(api.getState(), openContractOf(ctx))
      const r = (choiceId !== undefined ? ahead.find((x) => x.contractId === choiceId) : undefined) ?? ahead[0]
      if (r === undefined) return { ok: false, message: 'No replacement date ahead' }
      const label = changeDateLabel(api.getState(), r)
      moveClockToDate(api, r.fromISO)
      return { ok: true, message: `Clock now ${shortDay(r.fromISO)}: ${label}. Its to-do shows in the Day view and on its page.` }
    },
    indexPath: () => ADMIN_CONTRACTS,
    indexHint: 'Replace a Contract from a later date first (Replace from a date on its page), leaving the old one active.',
  },
  // ── Admin · an anaesthetist's record: pass their last day (build plan Phase 52; US-12.1.6, DM-05, DM-06) ──
  {
    id: 'pass-last-day',
    label: 'Demo: pass the last day',
    description:
      "Moves the demo clock to the day after this anaesthetist's last day, so their sessions end, the finder skips them and their own Contracts show Disabled. Reset puts the clock back.",
    screen: "Admin · an anaesthetist's record",
    routes: [ANAESTHETIST_RECORD],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => {
      const a = state.masters.anaesthetists[ctx.params['anaesthetistId'] ?? '']
      return a !== undefined && statusOn(a, state.clock.todayISO).kind === 'leaving' ? null : 'No last day ahead: Make inactive first'
    },
    run: (api, ctx) => {
      const a = api.getState().masters.anaesthetists[ctx.params['anaesthetistId'] ?? '']
      const status = a === undefined ? null : statusOn(a, api.getState().clock.todayISO)
      if (a === undefined || status === null || status.kind !== 'leaving') return { ok: false, message: 'No last day ahead' }
      const next = dayAfterISO(status.lastDayISO)
      moveClockToDate(api, next)
      return { ok: true, message: `Clock now ${shortDay(next)}: ${drSurname(a.name)} is inactive. Their sessions after ${shortDay(status.lastDayISO)} are gone and their own Contracts are disabled.` }
    },
    indexPath: () => null,
    indexEmptyReason: "Open an anaesthetist's record and make them inactive from a last day first.",
  },
  // ── Mobile and PWA · Sign in: an anaesthetist whose last day has passed (build plan Phase 52; US-13.5.3, DM-07) ──
  {
    id: 'try-sign-in-after-last-day',
    label: 'Demo: try signing in after the last day',
    description:
      "Dr Souter's last day is set to yesterday (a simulated stand-in for the office's Make inactive), then her sign-in is tried. It is refused as no longer active, and the refusal is an audited row. Reset demo restores her.",
    screen: 'Mobile · Sign in',
    routes: ['/mobile', '/mobile/*'],
    surfaces: ['bar', 'pwa'],
    when: (_state, ctx) => ctx.published['mobile.signIn'] === true,
    disabledReason: (state) => (state.masters.anaesthetists[ANAE.souter] === undefined ? 'Dr Souter is not in the data' : null),
    run: (api) => {
      const tried = tryInactiveSignIn(api)
      return tried.ok
        ? { ok: true, message: `${tried.value.name} tried to sign in: refused, no longer active. The refusal is in the audit; Reset demo restores her.` }
        : { ok: false, message: tried.message }
    },
    indexPath: () => null,
    indexEmptyReason: 'Shows on the sign-in screen: sign out on More first.',
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
  // ── Admin · Master data: the developer's seed load and the go-live load (catch-up Phase 42) ──
  {
    id: 'load-sample-spreadsheet',
    label: 'Load sample spreadsheet',
    description:
      "Checks a sample spreadsheet as the developer's seed load: its valid rows wait on Seed load and its rejected rows show why. It stages and does not load: press Load on Seed load to load the valid rows.",
    screen: 'Admin · Master data, Contracts and People',
    routes: [ADMIN_MASTERS, ADMIN_CONTRACTS, ADMIN_PARTIES, ADMIN_FUNDING_TAGS, ...ADMIN_PEOPLE_SEEDED_TABS],
    surfaces: ['bar'],
    when: (_state, ctx) => sampleSheetsFor(ctx).length > 0,
    choices: (_state, ctx) => sampleSheetsFor(ctx).map((s) => ({ id: s.id, label: s.fileName })),
    disabledReason: (state, ctx, choiceId) => {
      const sample = chosenSample(ctx, choiceId)
      if (sample === undefined) return NO_SAMPLE_HERE
      return stagedLoadFor(state, sample.entity) !== undefined ? SAMPLE_WAITING : null
    },
    run: (api, ctx, choiceId) => {
      const sample = chosenSample(ctx, choiceId)
      if (sample === undefined) return { ok: false, message: NO_SAMPLE_HERE }
      if (stagedLoadFor(api.getState(), sample.entity) !== undefined) return { ok: false, message: SAMPLE_WAITING }
      const res = stageMasterLoad(api, SEED_LOAD_ACTOR, { entity: sample.entity, csvText: sample.csv, source: { kind: 'sample', sampleId: sample.id } })
      if (!res.ok) return { ok: false, message: res.message }
      return {
        ok: true,
        message: `${sample.fileName} checked: ${plural(res.value.valid, 'row')} valid, ${res.value.rejected} rejected. Open Master data, Seed load, and press Load.`,
      }
    },
    indexPath: () => `${ADMIN_MASTERS}?view=${SEED_LOAD_VIEW}`,
  },
  {
    id: 'go-live-data-load',
    label: 'Go-live data load (demo)',
    description:
      "Prepares the go-live load as the developer: the Solutions Plus operation names with AA's decisions, beside AA's controlled spreadsheets, checked and waiting. Approve or unapprove names on Go-live load, then press Load approved data.",
    screen: 'Admin · Master data',
    routes: [ADMIN_MASTERS],
    surfaces: ['bar'],
    disabledReason: (state) => (state.masterLoads.goLive?.status === 'staged' ? GO_LIVE_WAITING : null),
    run: (api) => {
      const res = stageGoLiveLoad(api, SEED_LOAD_ACTOR)
      if (!res.ok) return { ok: false, message: res.message }
      const v = res.value
      return {
        ok: true,
        message: `Go-live load prepared: ${plural(v.candidates, 'Solutions Plus name')} (${v.junk} excluded as junk, ${v.notApproved} not approved) and ${plural(v.sheets, 'controlled spreadsheet')}. Open Master data, Go-live load.`,
      }
    },
    indexPath: () => `${ADMIN_MASTERS}?view=goLive`,
  },
  // ── Admin · Review: a prepaid procedure that ran longer (catch-up Phase 41; US-06.4.1) ──
  {
    id: 'stage-longer-prepaid-procedure',
    label: 'Stage longer prepaid procedure',
    description:
      "On a submitted List, lengthens a Booking's prepaid procedure to four hours of anaesthetic time as the office, so Authorise can show that nothing further is billed for the difference: the prepaid amount is the price, and an additional invoice is created by hand if one is needed.",
    screen: 'Admin · Review',
    routes: ['/admin/review/:listId'],
    surfaces: ['bar'],
    choices: (state, ctx) => longerPrepaidChoices(state, ctx.params['listId'] ?? ''),
    disabledReason: (state, ctx) => stageLongerRefusal(state, ctx.params['listId']),
    run: (api, ctx, choiceId) => {
      const out = stageLongerPrepaidProcedure(api, OFFICE_ACTOR, ctx.params['listId'] ?? '', choiceId)
      return out.ok ? { ok: true, message: LONGER_PREPAID_COPY.staged(out.value.units) } : { ok: false, message: out.message }
    },
    indexPath: () => `/admin/review/${SEED_LIST_IDS.prepaymentPaidList}`,
    indexHint: "Submit Dr Souter's Fri 27 Nov PM List first.",
  },
  // ── Admin · Booking detail: a prepayment settled automatically (catch-up Phase 41; US-06.5.2, US-06.3.7) ──
  {
    id: 'prepayment-late-payment',
    label: 'Payment arrives after the credit note',
    description:
      "On a cancelled Booking whose prepayment invoice was credited while unpaid, the payer pays the invoice total anyway (the simulated bank feed). The system refunds it to the payer at once from the AA Holding account, and the Booking's prepayment panel adds the late payment line.",
    screen: 'Admin · Booking detail',
    routes: [ADMIN_BOOKING],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => latePaymentRefusal(state, ctx.params['bookingId']),
    run: (api, ctx) => {
      const out = stageLatePrepaymentPayment(api, ctx.params['bookingId'])
      return out.ok ? { ok: true, message: PREPAYMENT_SETTLEMENT_DEMO_COPY.lateRefunded(out.value.amount) } : { ok: false, message: out.message }
    },
    indexPath: (state) => adminBookingPath(state, SEED_MARKERS.prepaymentBooking?.entityId),
    indexHint: "Approve and send Annette Riley's prepayment invoice, then cancel her Booking.",
  },
  {
    id: 'prepayment-contract-changed',
    label: 'Change Contract after prepayment sent',
    description:
      "As the office, moves the Booking's prepaid procedure onto a Contract that is not prepaid after its prepayment invoice was sent: the system credits the whole prepayment invoice and refunds anything paid from the AA Holding account, and the procedure is billed after it under the new Contract. Runs once per Booking.",
    screen: 'Admin · Booking detail',
    routes: [ADMIN_BOOKING],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => contractChangeRefusal(state, ctx.params['bookingId']),
    run: (api, ctx) => {
      const out = stagePrepaidContractChange(api, OFFICE_ACTOR, ctx.params['bookingId'])
      if (!out.ok) return { ok: false, message: out.message }
      const name = api.getState().masters.contracts[out.value.contractId]?.name ?? out.value.contractId
      return { ok: true, message: PREPAYMENT_SETTLEMENT_DEMO_COPY.contractChanged(name, out.value.creditNoteNumber) }
    },
    indexPath: (state) => adminBookingPath(state, SEED_MARKERS.prepaymentBooking?.entityId),
    indexHint: "Approve and send Annette Riley's prepayment invoice first.",
  },
  // ── Admin · Day and Booking detail, Mobile · Booking: prepayment (catch-up Phase 27) ──
  {
    id: 'prepayment-two-days-before',
    label: 'Move to 2 days before procedure',
    description:
      "Moves the demo clock forward to 08:00 two days before a prepaid procedure whose prepayment is outstanding (awaiting approval, unpaid or part paid): the prepayment warning turns strong, and a mild one the office cleared re-opens. On a Booking it acts on that Booking; on the Day view choose one. The clock never goes back: Reset restores it.",
    screen: 'Admin · Day and Booking detail, Mobile · Booking',
    routes: [ADMIN_DAY, ADMIN_BOOKING, MOBILE_BOOKING],
    surfaces: ['bar', 'pwa'],
    choices: (state, ctx) => (ctx.params['bookingId'] !== undefined ? [] : outstandingPrepaymentBookings(state).map((t) => ({ id: t.bookingId, label: t.label }))),
    disabledReason: (state, ctx, choiceId) => twoDaysBeforeRefusal(state, ctx.params['bookingId'] ?? choiceId),
    run: (api, ctx, choiceId) => {
      const res = moveToTwoDaysBefore(api, ctx.params['bookingId'] ?? choiceId)
      return res.ok
        ? { ok: true, message: `The demo clock is now ${shortDay(res.value.dateISO)}, 2 days before ${res.value.patientName}'s procedure. The prepayment warning is strong.` }
        : { ok: false, message: res.message }
    },
    indexPath: () => '/admin/day/2026-11-24',
  },
  {
    id: 'add-prepaid-booking',
    label: 'Add prepaid Booking',
    description:
      "Adds a Booking for Fiona Gray on Dr Souter's next ACTIVE List. One payer: Rhinoplasty on Dr Souter's prepaid Contract, the patient paying ($1,200.00). Two payers: also Blepharoplasty, upper lids on her prepaid Contract ($900.00), paid by a second person, so each payer gets their own prepayment invoice. It waits on the Invoices strip, or is sent at once with approval off.",
    screen: 'Admin · Day and Booking detail',
    routes: [ADMIN_DAY, ADMIN_BOOKING],
    surfaces: ['bar'],
    choices: () => [
      { id: 'one-payer', label: 'One payer' },
      { id: 'two-payers', label: 'Two payers' },
    ],
    disabledReason: (state) => addPrepaidBookingRefusal(state),
    run: (api, _ctx, choiceId) => {
      const res = addPrepaidBooking(api, choiceId === 'two-payers' ? 'two-payers' : 'one-payer')
      return res.ok ? { ok: true, message: res.value.message } : { ok: false, message: res.message }
    },
    indexPath: () => '/admin/day/2026-11-24',
  },
  {
    id: 'pwa-office-approves-prepayment',
    label: 'Office approves and sends the prepayment invoice',
    description:
      "Stands in for the office, which approves prepayment invoices on Admin Invoices: approves and sends this Booking's prepayment invoice to its payer, with its payable to the AA Holding account. Where two payers each have one, choose which.",
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    choices: (state, ctx) => {
      const options = prepaymentApprovalChoices(state, ctx.params['bookingId'] ?? '')
      return options.length > 1 ? options : []
    },
    disabledReason: (state, ctx, choiceId) => {
      const bookingId = ctx.params['bookingId']
      return bookingId === undefined ? 'Open a Booking' : prepaymentStandInRefusal(state, bookingId, choiceId)
    },
    run: (api, ctx, choiceId) => {
      const bookingId = ctx.params['bookingId']
      if (bookingId === undefined) return { ok: false, message: 'Open a Booking' }
      const res = approvePrepaymentAsSimulatedOffice(api, bookingId, choiceId)
      return res.ok
        ? { ok: true, message: `The office approved and sent prepayment invoice ${res.value.invoiceNumber} for ${formatCurrency(res.value.amount)} including GST.` }
        : { ok: false, message: res.message }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build approves on Admin Invoices (Approve and send).',
  },
  {
    id: 'pwa-office-sends-prepayment-reminder',
    label: 'Office sends a prepayment reminder',
    description:
      "Stands in for the office, which sends prepayment reminders from Admin: while this Booking's prepayment is unpaid or part paid, emails the payer a reminder with the amount still to pay. The Booking's prepayment panel shows when it went and to whom.",
    screen: 'Mobile · Booking',
    routes: [MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => {
      const bookingId = ctx.params['bookingId']
      return bookingId === undefined ? 'Open a Booking' : standInReminderRefusal(state, bookingId)
    },
    run: (api, ctx) => {
      const out = sendReminderAsOfficeStandIn(api, OFFICE_SIMULATION_ACTOR, ctx.params['bookingId'])
      return out.ok ? { ok: true, message: PREPAYMENT_SETTLEMENT_DEMO_COPY.reminderSent } : { ok: false, message: out.message }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build sends reminders on the Admin Booking (Send prepayment reminder).',
  },
  // ── Admin · Day, Booking detail and Mobile · Booking: sample warnings ──
  {
    id: 'raise-sample-warnings',
    label: 'Raise sample warnings',
    description:
      "Stages every warning rule's sample, as Demo actions, on Dr Rutherford's Tue 24 Nov Bookings (from the Day view) or on the Booking on screen: a prepayment awaiting approval (the List's own prepaid Contract, else Prepaid · Fixed price at $500), base units outside the range, a child as the payer on each Procedure billed to the patient (on the Booking on screen when its patient is under 18, otherwise on Grace Park's two Procedures, one to-do row), and an insurer named with no approval number (on the Booking on screen when it names an insurer, otherwise on the first seeded NIB Booking). And a balance check on a Booking whose patient owes AA on an invoice billed to them and pays a Procedure (the strong balance warning; skipped where the patient owes nothing).",
    screen: 'Admin · Day and Booking detail, Mobile · Booking',
    routes: SAMPLE_WARNING_ROUTES,
    surfaces: ['bar', 'pwa'],
    disabledReason: raiseSampleDisabled,
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      const notes = skippedSampleNotes(api.getState(), bookingId ?? SEED_WARNING_SAMPLE_BOOKINGS.targets[0])
      const before = stagedSampleKeys(api.getState())
      const res = bookingId === undefined ? raiseDaySamples(api) : raiseSamplesOn(api, bookingId)
      if (!res.ok) return { ok: false, message: res.message }
      // Only the samples this raise staged are named (catch-up Phase 40: a skipped balance sample is not).
      const names = newlyStagedSampleNames(before, stagedSampleKeys(api.getState()))
      const skipped = `${names.length > 0 ? ` Staged: ${names.join(', ')}.` : ''}${notes.length > 0 ? ` ${notes.join(' ')}` : ''}`
      return {
        ok: true,
        message:
          bookingId === undefined
            ? `Raised ${plural(res.value, 'sample warning')} on Dr Rutherford's Tue 24 Nov Lists, Grace Park's Booking and a NIB Booking. They show on the To-do card, the day grid and each Booking. ${RULES_NOTE}${skipped}`
            : `Raised ${plural(res.value, 'sample warning')}: the triangle and the warning at the top of the Booking. The child payer sample stages on a minor's Booking (Grace Park's unless this one is a child's) and the approval number sample on an insurer's Booking (a nib Booking on Dr Ngata's Mon 23 Nov List unless this one names an insurer). ${RULES_NOTE}${skipped}`,
      }
    },
    indexPath: () => '/admin/day/2026-11-24',
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
    indexPath: () => '/admin/day/2026-11-24',
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
      return { ok: true, message: "The office set this Booking's Contract. It leaves the office's To-do." }
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
  // ── Admin · Intake, Matching (catch-up Phase 33; Intake since Phase 34) ──
  {
    id: 'matching-receive-theatre-list',
    label: 'Import hospital file',
    description:
      "Stands in for the hospital's file arriving: stages the sample theatre list's rows on Matching (St George's: a new Booking, a No change, a modification, and a day move as a cancellation plus a new Booking; Southern Cross: a new Booking, a modification with an insurer and approval number, a change for an authorised List, a row with no NHI and a row for a session with no List). Nothing changes the schedule until the office decides.",
    screen: ADMIN_INTAKE_SCREEN,
    routes: [ADMIN_MATCHING],
    surfaces: ['bar'],
    choices: () => [
      { id: 'stg', label: "St George's" },
      { id: 'sx', label: 'Southern Cross' },
    ],
    disabledReason: (state, _ctx, choiceId) => theatreListRefusal(state, choiceId === 'sx' ? 'sx' : 'stg'),
    run: (api, _ctx, choiceId) => {
      const hospital = choiceId === 'sx' ? 'sx' : 'stg'
      const res = receiveTheatreList(api, OFFICE_ACTOR, hospital)
      if (!res.ok) return { ok: false, message: res.message }
      const name = hospital === 'sx' ? 'Southern Cross' : "St George's"
      const n = res.value.rowIds.length
      return { ok: true, message: `${name} sent its theatre list: ${n} ${n === 1 ? 'row is' : 'rows are'} waiting on Matching. Nothing changes the schedule until the office decides.` }
    },
    indexPath: () => ADMIN_MATCHING,
  },
  {
    id: 'matching-send-update',
    label: 'Send update for a matched Booking',
    description:
      "Stands in for the hospital sending a later update: for the Booking matched by the row selected on Matching (if open and not authorised), else Diane Foster's (Tue 8 Dec AM), a row for the same List and patient with a later time and the hospital's fuller wording. It waits for the office to check the differences and approve it.",
    screen: ADMIN_INTAKE_SCREEN,
    routes: [ADMIN_MATCHING],
    surfaces: ['bar'],
    disabledReason: (state, ctx) => sendUpdateRefusal(state, ctx.published['matching.selectedRowId']),
    run: (api, ctx) => {
      const state = api.getState()
      const reason = sendUpdateRefusal(state, ctx.published['matching.selectedRowId'])
      const target = updateTarget(state, ctx.published['matching.selectedRowId'])
      if (reason !== null || target === undefined) return { ok: false, message: reason ?? 'Select a row matched to an open Booking' }
      const res = stageUpdateForBooking(api, OFFICE_ACTOR, target)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `${res.value.hospital} sent an update for ${res.value.patient}: a new time and fuller wording. Check the differences and approve it.` }
    },
    indexPath: () => ADMIN_MATCHING,
  },
  {
    id: 'matching-office-matches-row',
    label: 'Hospital file imported and my booking matched',
    description:
      "Stands in for the office on the phone: the office imports St George's file, as on Admin, Intake, decides the rows for your Tue 1 Dec AM List with the suggested decision, and answers where each new Booking's invoice goes (Patient › Standard, No contract · RVG; the RVG code stays yours). Sarah Mitchell arrives with the hospital's wording as received; the file's other rows wait for the office. On a St George's or Southern Cross List, a new hospital booking; on a Booking, a hospital update approved by the office (on Diane Foster's, the hospital's fuller wording replaces WLE MM).",
    screen: 'Mobile · Lists and the Booking screen',
    routes: [...MOBILE_LISTS],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    choices: (_state, ctx) => {
      const out = [{ id: 's1', label: "St George's file, Tue 1 Dec AM (S1)" }]
      if (ctx.params['bookingId'] !== undefined) out.push({ id: 'booking', label: 'A hospital update for this Booking, approved by the office' })
      else if (ctx.params['listId'] !== undefined) out.push({ id: 'list', label: 'A new hospital booking on this List' })
      return out
    },
    disabledReason: (state, ctx, choiceId) => standInRefusal(state, standInChoice(ctx, choiceId)),
    run: (api, ctx, choiceId) => {
      const choice = standInChoice(ctx, choiceId)
      if (choice.kind === 's1') {
        const s1 = officeImportsS1File(api)
        if (!s1.ok) return { ok: false, message: s1.message }
        const n = s1.value.patients.length
        return {
          ok: true,
          message:
            n > 0
              ? `The office imported St George's file and matched it. ${s1.value.patients.join(' and ')} ${n === 1 ? 'is' : 'are'} now on your Tue 1 Dec AM List, the invoice going to the patient at the standard rate (No contract · RVG). The RVG code is yours to add.`
              : "The office imported St George's file and matched it. Your Tue 1 Dec AM List already held everything it sent.",
        }
      }
      const res = officeMatchesHospitalRow(api, choice)
      if (!res.ok) return { ok: false, message: res.message }
      return choice.kind === 'booking'
        ? { ok: true, message: `The hospital sent an update for ${res.value.patient} and the office approved it.` }
        : { ok: true, message: `${res.value.hospital} sent ${res.value.patient}'s booking and the office matched it. ${res.value.patient} is now on your ${res.value.where} List; the office will set the Contract.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build plays the office in Admin, Intake.',
  },
  {
    id: 'stub-office-adds-nhi',
    label: 'Office adds the NHI to this stub',
    description:
      "Stands in for the office on the phone: on a List holding a stub, the office adds the NHI the sample holds for its waiting row on Matching, through the one resolve path, and the Booking takes the stub's place. On Dr Souter's Tue 8 Dec PM List, Mere Tipene (ZQA1024); after the Southern Cross import, Tama Henare on Tue 1 Dec PM (ZQA1008).",
    screen: 'Mobile · List detail',
    routes: ['/mobile/lists/:listId'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => officeAddsNhiRefusal(state, ctx.params['listId']),
    run: (api, ctx) => {
      const listId = ctx.params['listId']
      if (listId === undefined) return { ok: false, message: 'Open a List first' }
      const res = officeAddsNhiToStub(api, listId)
      if (!res.ok) return { ok: false, message: res.message }
      return res.value.kind === 'resolved'
        ? { ok: true, message: "The office added the NHI. The Booking now stands in the stub's place." }
        : { ok: true, message: `The office added ${res.value.patient}'s NHI. The row now waits for the office's decision on Matching.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build plays the office in Admin, Intake (Add NHI).',
  },
  // ── Admin · Intake · Waiting for NHI and Mobile · List (catch-up Phase 40; on Intake since Phase 51) ──
  {
    id: 'receive-no-nhi-list',
    label: 'Receive list with a missing NHI',
    description: `Imports a Forte Health sheet with two bookings sent without an NHI: ${NO_NHI_LIST.rows[0]!.patient.name} on Thu 26 Nov PM (urgent, a new patient) and ${NO_NHI_LIST.rows[1]!.patient.name} on Mon 30 Nov (a returning patient). Both wait here and on Matching; nothing is created until the office adds the NHI.`,
    screen: 'Admin · Intake · Waiting for NHI',
    routes: ['/admin/intake/waiting'],
    surfaces: ['bar'],
    disabledReason: (state) => (Object.values(state.intake.batches).some((b) => b.sampleId === NO_NHI_LIST.id) ? 'Already received' : null),
    run: (api) => {
      const res = importHospitalDownload(api, OFFICE_ACTOR, NO_NHI_LIST.id)
      if (!res.ok) return { ok: false, message: res.message }
      return {
        ok: true,
        message: `Forte Health sent two bookings with no NHI. They wait here and on Matching, and nothing is created yet. Add NHI ${NO_NHI_NEW_PATIENT_NHI} for ${NO_NHI_LIST.rows[0]!.patient.name} (a new patient) and ${NO_NHI_RETURNING_NHI} for ${NO_NHI_LIST.rows[1]!.patient.name} (an existing record).`,
      }
    },
    indexPath: () => '/admin/intake/waiting',
  },
  {
    id: 'pwa-office-adds-nhi',
    label: 'Office adds the NHI',
    description:
      'Stands in for the office on the phone: the hospital sends a booking for this List with no NHI, so it waits with the office as a stub on the List; then the office adds the NHI and the Booking takes the stub\'s place. A booking already waiting on this List is used first. From a Booking, it acts on that Booking\'s List.',
    screen: 'Mobile · List',
    alsoScreens: ['Mobile · Booking'],
    routes: ['/mobile/lists/:listId', MOBILE_BOOKING],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => addNhiStandInRefusal(state, ctx.params['listId']),
    run: (api, ctx) => {
      const listId = ctx.params['listId']
      if (listId === undefined) return { ok: false, message: 'Open a List first' }
      const res = addNhiAsSimulatedOffice(api, listId)
      if (!res.ok) return { ok: false, message: res.message }
      const fromBooking = ctx.params['bookingId'] !== undefined ? ' (on this Booking\'s List)' : ''
      return res.value.result.kind === 'resolved'
        ? {
            ok: true,
            message: `The hospital sent a booking with no NHI, so it waited with the office as a stub on your List${fromBooking}. The office added the NHI: ${res.value.patient} is now on your List.`,
          }
        : { ok: true, message: `The office added ${res.value.patient}'s NHI. The row now waits for the office's decision on Matching.` }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build adds the NHI on Admin, Patients, Waiting for NHI.',
  },
  // ── Future scope: HL7 and FHIR (catch-up Phase 34) ───────────────────
  {
    id: 'fire-hospital-message',
    label: 'Fire hospital message',
    description:
      "Sends a canned hospital HL7 v2 or FHIR message into the mock backend (Future scope, for discussion), including the Christchurch Public dead-letter case (MSG-CPH-2001); Christchurch Public is not integrated today. A message that reads stages one row on Admin, Intake, for the office to decide; nothing is applied by itself. Defaults to the message selected in the simulator.",
    screen: FUTURE_SCOPE_SCREEN,
    routes: [...FUTURE_SCOPE_ROUTES],
    surfaces: ['bar'],
    badge: 'future-scope',
    choices: () => CANNED_MESSAGES.map((m) => ({ id: m.id, label: `${m.label} · ${m.id}` })),
    // The simulator's pick, else its first message.
    defaultChoice: (_state, ctx) => ctx.published['integrationsSim.selectedMessageId'] ?? DEFAULT_MESSAGE_ID,
    disabledReason: () => null,
    run: (api, _ctx, choiceId) => {
      const selectedId = choiceId ?? DEFAULT_MESSAGE_ID
      const res = processMessage(api, selectedId)
      useDemoTriggerMemory.getState().rememberMessage(selectedId)
      const staged = res.ok && res.value.importRowId !== undefined
      return {
        ok: res.ok,
        message: !res.ok
          ? `Refused: ${res.message}`
          : staged
            ? `Sent ${selectedId}: its row waits on Admin, Intake, for the office to decide.`
            : `Fired ${selectedId}: ${res.value.outcome}. See it on the Message log.`,
      }
    },
    indexPath: () => '/demo/integrations',
  },
  {
    id: 'replay-hospital-message',
    label: 'Replay last message (dedupe)',
    description:
      'Replays the last hospital message fired, to show idempotent dedupe: same message control ID, no second row on Matching.',
    screen: FUTURE_SCOPE_SCREEN,
    routes: [...FUTURE_SCOPE_ROUTES],
    surfaces: ['bar'],
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
            ? 'Deduplicated: same message control ID, no second row staged.'
            : `Replayed ${last}: ${res.value.outcome}.`
          : `Refused: ${res.message}`,
      }
    },
    indexPath: () => '/demo/integrations',
  },

  // ── Mobile · Balances, installed PWA only ─────────────────────────────
  {
    id: 'pwa-office-runs-payables',
    label: "Office runs this week's payment cycle",
    description:
      "Stands in for the office, which has no app on the phone: closes this week, approves its BCTIs and sends the payment schedule, and the accountant pays it in Xero. The Billing Engine records each payment when Xero reports it, and Balances' Paid out rises by Dr Souter's share.",
    screen: 'Mobile · Balances',
    routes: ['/mobile/balances'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state) => officeRunsWeeksCycleRefusal(state),
    run: (api) => {
      const out = officeRunsWeeksCycle(api)
      return out.ok ? { ok: true, message: out.value.message } : { ok: false, message: out.message }
    },
    indexPath: () => null,
  },
  {
    id: 'pwa-payment-full',
    label: 'Payment received · full',
    description: 'A Xero payment webhook for the full balance of one of Dr Souter\'s open invoices, chosen below.',
    screen: 'Mobile · Balances and Booking',
    routes: ['/mobile/balances', MOBILE_BOOKING],
    surfaces: ['pwa'],
    // On a Booking (catch-up Phase 27): its sent prepayment invoices only.
    choices: (state, ctx) => (ctx.params['bookingId'] !== undefined ? prepaymentAccRecChoices(state, ctx.params['bookingId']) : personaPaymentChoices(state, ANAE.souter)),
    disabledReason: (state, ctx, choiceId) =>
      ctx.params['bookingId'] !== undefined
        ? prepaymentAccRecChoices(state, ctx.params['bookingId']).length === 0
          ? 'No sent pre-payment invoice yet'
          : paymentDisabledReason(state, paymentTargetOnScreen(state, ctx, choiceId))
        : personaPaymentDisabled(state, ANAE.souter, choiceId),
    run: (api, ctx, choiceId) => sendPaymentWebhook(api, ctx.params['bookingId'] !== undefined ? paymentTargetOnScreen(api.getState(), ctx, choiceId) : choiceId, 'full'),
    indexPath: () => null,
  },
  {
    id: 'pwa-payment-half',
    label: 'Payment received · half',
    description: 'A Xero payment webhook for half the balance of one of Dr Souter\'s open invoices, chosen below (a part payment).',
    screen: 'Mobile · Balances and Booking',
    routes: ['/mobile/balances', MOBILE_BOOKING],
    surfaces: ['pwa'],
    // On a Booking (catch-up Phase 27): its sent prepayment invoices only.
    choices: (state, ctx) => (ctx.params['bookingId'] !== undefined ? prepaymentAccRecChoices(state, ctx.params['bookingId']) : personaPaymentChoices(state, ANAE.souter)),
    disabledReason: (state, ctx, choiceId) =>
      ctx.params['bookingId'] !== undefined
        ? prepaymentAccRecChoices(state, ctx.params['bookingId']).length === 0
          ? 'No sent pre-payment invoice yet'
          : paymentDisabledReason(state, paymentTargetOnScreen(state, ctx, choiceId))
        : personaPaymentDisabled(state, ANAE.souter, choiceId),
    run: (api, ctx, choiceId) => sendPaymentWebhook(api, ctx.params['bookingId'] !== undefined ? paymentTargetOnScreen(api.getState(), ctx, choiceId) : choiceId, 'partial'),
    indexPath: () => null,
  },
  // ── Web · Dashboard and Accounts: the persona's payments (catch-up Phase 38) ──
  webPaymentEntry('web-payment-full', 'full'),
  webPaymentEntry('web-payment-half', 'partial'),
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
      "Plays the List's hospital feed making the next procedure on this Booking the primary, audited as an integration: base units then come from it and it moves to the top. A demo shortcut: a real hospital update waits on Matching for the office.",
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
  // ── Explicit save and named office users (catch-up Phase 35) ─────────
  {
    id: 'switch-office-user',
    label: 'Switch office user',
    description:
      'Stands in for each office user signing in as themselves (US-13.5.1, not built): the Admin app now acts as the other named office user (Kirsty W. or Sam T.), so two users\' saves show named in one Booking\'s History. No audit entry is changed.',
    screen: 'Admin · Day view and Booking detail',
    routes: ['/admin/day/:dateISO', '/admin/day/:dateISO/bookings/:bookingId'],
    surfaces: ['bar'],
    disabledReason: (_state, ctx) => (ctx.published['adminBooking.dirtyBookingId'] !== undefined ? 'Save or discard this Booking\'s changes first' : null),
    run: (api) => {
      const next = otherOfficeUser(api.getState().shell)
      api.getState().setOfficeUser(next)
      return { ok: true, message: `The office is now ${OFFICE_USERS[next].who}` }
    },
    indexPath: (state) => `/admin/day/${state.clock.todayISO}`,
  },
  {
    id: 'office-edits-booking',
    label: 'Office edits this Booking',
    description:
      'Stands in for the office: Kirsty W. saves one change on this Booking, its time 30 minutes later, as one change set. The handset shows that the office saved changes, and History shows the grouped office save.',
    screen: 'Mobile · Booking detail',
    routes: ['/mobile/lists/:listId/bookings/:bookingId'],
    surfaces: ['pwa'],
    badge: 'office-stand-in',
    disabledReason: (state, ctx) => officeEditsBookingRefusal(state, ctx.params['bookingId']),
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      if (bookingId === undefined) return { ok: false, message: 'Open a Booking first' }
      const res = officeEditsBooking(api, bookingId)
      return res.ok ? { ok: true, message: `The office moved this Booking to ${res.value.time}.` } : { ok: false, message: res.message }
    },
    indexPath: () => null,
    indexEmptyReason: 'PWA only: the framed build makes the change in Admin and saves it.',
  },
  // ── Scale and privacy (catch-up Phase 43) ─────────────────────────────
  {
    id: 'load-full-scale',
    label: 'Load full-scale data',
    description:
      `Replaces the demo data with the whole practice, built in this browser from the same seed: ${FULL_SCALE_FIGURES.anaesthetists} anaesthetists, their sessions across the scheduling horizon and about ${formatCount(FULL_SCALE_FIGURES.targetInvoicesPerYear)} invoices from the last ${FULL_SCALE_FIGURES.historyMonths} months. Held in memory only: saving pauses, and Reset or a reload returns to the demo data.`,
    screen: FINANCES_INVOICES_SCREEN,
    routes: [FINANCES_INVOICES, FINANCES_INVOICE, ADMIN_DAY],
    surfaces: ['bar'],
    confirm: 'Replaces the current demo data. Reset returns to it.',
    disabledReason: () => loadFullScaleRefusal(),
    run: (api) => {
      const res = loadFullScaleData(api, { report: (message) => reportDiagnostic('error', message) })
      return res.ok ? { ok: true, message: 'Generating full-scale data. Timings appear in the banner.' } : { ok: false, message: res.message }
    },
    indexPath: () => FINANCES_INVOICES,
  },
  {
    id: 'scan-nhi-leaks',
    label: 'Scan for NHI leaks',
    description:
      'Searches the Xero records and their sync queue for any NHI or personal detail (no personal information in Xero), and the diagnostic log, the messages people see and every failure reason for anything that looks like an NHI. The planted choice adds one test line to the scan to prove it finds one.',
    screen: 'Demo · Data inspector',
    routes: ['/demo/data'],
    surfaces: ['bar'],
    choices: () => [
      { id: 'now', label: 'Scan now' },
      { id: 'planted', label: 'Scan with a planted test leak (proves the scan finds one)' },
    ],
    disabledReason: () => null,
    run: (api, _ctx, choiceId) => {
      const report = scanForNhiLeaks(api.getState(), { plantTestLeak: choiceId === 'planted' })
      useDemoTriggerMemory.getState().rememberNhiScan(report)
      return { ok: true, message: leakScanSummary(report, formatCount) }
    },
    indexPath: () => '/demo/data',
  },
  {
    id: 'matching-raw-row-other-role',
    label: 'View raw row as another role',
    description:
      'Shows the restriction working: the same View raw row request, with the reason "Demo: access check", made as an anaesthetist or as the hospital feed, on the selected row (or the oldest row needing resolving). Only office staff can view a raw hospital row, and the refused attempt is recorded in the audit trail. No payload is shown.',
    screen: 'Admin · Intake, Matching',
    routes: [ADMIN_MATCHING],
    surfaces: ['bar'],
    choices: () => [
      { id: 'souter', label: 'As Dr Melanie Souter (anaesthetist)' },
      { id: 'feed', label: 'As the hospital feed (integration)' },
    ],
    disabledReason: (state, ctx) => rawRowRefusal(state, rawRowTarget(state, ctx.published['matching.selectedRowId'])),
    run: (api, ctx, choiceId) => {
      const state = api.getState()
      const rowId = rawRowTarget(state, ctx.published['matching.selectedRowId'])
      if (rowId === undefined) return { ok: false, message: 'No hospital row needs resolving' }
      const res = viewRawImportRow(api, choiceId === 'feed' ? HOSPITAL_FEED_ACTOR : SOUTER_ACTOR, rowId, 'Demo: access check')
      // Name the row it acted on: with none selected it falls back to the oldest row needing resolving.
      const name = state.intake.rows[rowId]?.incoming.patient.name
      const whose = name !== undefined && name !== '' ? ` (${name}'s row)` : ''
      return res.ok
        ? { ok: false, message: 'The view was not refused.' }
        : { ok: true, message: res.code === 'officeOnly' ? `Refused: only office staff can view a raw hospital row${whose}. The attempt is in the audit trail.` : res.message }
    },
    indexPath: () => ADMIN_MATCHING,
  },
  // ── Wherever an NHI is looked up: the simulated Digital Services Hub's mode (catch-up Phase 40a) ──
  {
    id: 'nhi-hub-mode',
    label: 'Hub: Available / Slow / Unavailable',
    description:
      'Sets how the simulated Digital Services Hub answers NHI lookups: Available, Slow (a long wait, with Stop waiting) or Unavailable (the manual fallback, with Retry). It stays set until changed or Reset, and the form shows a badge while it is not Available.',
    screen: NHI_HUB_SCREEN,
    routes: NHI_HUB_ROUTES,
    surfaces: ['bar', 'pwa'],
    overSheet: true,
    when: (_state, ctx) => ctx.published['nhiHub.inUse'] === true,
    choices: () => NHI_HUB_MODES.map((mode) => ({ id: mode, label: NHI_HUB_MODE_LABELS[mode] })),
    defaultChoice: (state) => NHI_HUB_MODES.find((m) => m !== (state.settings.nhiHubMode ?? 'available')),
    disabledReason: (state, _ctx, choiceId) => ((state.settings.nhiHubMode ?? 'available') === (choiceId ?? 'available') ? 'Already set' : null),
    run: (api, _ctx, choiceId) => {
      const mode = NHI_HUB_MODES.find((m) => m === choiceId) ?? 'available'
      const res = setNhiHubMode(api, OFFICE_ACTOR, mode)
      if (!res.ok) return { ok: false, message: res.message }
      const label = NHI_HUB_MODE_LABELS[mode]
      return {
        ok: true,
        message:
          mode === 'unavailable'
            ? `The simulated Hub now answers as ${label}. The next lookup shows the manual fallback.`
            : mode === 'slow'
              ? `The simulated Hub now answers as ${label}. The next lookup waits, with Stop waiting.`
              : `The simulated Hub now answers as ${label}.`,
      }
    },
    indexPath: () => `/web/lists/${SEED_LIST_IDS.souterPm21}`,
    indexHint: 'Open Add a booking (or a patient record\'s Refresh from NHI register) first: the entry shows only while a lookup surface is open.',
  },
  // ── Catch-up Phase 43a: sign-in ────────
  // Doesn't touch AppState: the session is per-viewer browser storage, so the
  // menus re-read it when it changes.
  {
    id: 'pwa-sign-out',
    label: 'Sign out',
    description: 'Signs Dr Souter out, as at the end of a shift. The sign-in screen shows with the account filled in.',
    screen: 'Mobile · any screen',
    routes: ['/mobile', '/mobile/*'],
    surfaces: ['pwa'],
    // The PWA opens signed out when nothing is stored, so its default is the one to read.
    disabledReason: () => (isSignedIn('signed-out') ? null : 'Already signed out'),
    run: (api) => {
      recordAnaesthetistSignIn(api, 'signedOut')
      signOutSession()
      return { ok: true, message: 'Signed out. Tap Sign in to come back.' }
    },
    indexPath: () => '/mobile/more',
    indexHint: 'On a handset, from the Demo sheet; in the framed phone, use Sign out on More.',
  },
  // ── Catch-up Phase 43b: support, the help line and product support (shown while the support panel is open) ──
  {
    id: 'support-advance-ticket',
    label: 'Advance ticket',
    description: "Plays Stratos' support line: moves the newest open request on the open tab one step, Logged to Responded to Closed.",
    screen: SUPPORT_SCREEN,
    routes: SUPPORT_ROUTES,
    surfaces: ['bar'],
    when: (_state, ctx) => supportTab(ctx) !== null,
    disabledReason: (state, ctx) => {
      const ticket = supportTicketInScope(state, ctx)
      if (ticket === null) return 'No open request'
      return ticket.callOut === 'awaitingApproval' ? `${ticket.id} waits for AA's approval of the call-out` : null
    },
    run: (api, ctx) => {
      const ticket = supportTicketInScope(api.getState(), ctx)
      if (ticket === null) return { ok: false, message: 'No open request' }
      const res = advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, ticket.id)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `${ticket.id} ${ticket.subject}: now ${STATUS_LABEL[res.value.status]}.` }
    },
    indexPath: () => '/admin',
    indexHint: 'Open Help first (Admin side nav, web top nav or mobile More): the entry shows only while the support panel is open.',
  },
  {
    id: 'support-raise-out-of-hours',
    label: 'Raise out of hours',
    description: 'Moves the clock forward to 7:00pm on the next weekday (today, if it is earlier) and raises a sample help-line request, so the after-hours rule shows. The clock only moves forward; Reset restores it.',
    screen: SUPPORT_SCREEN,
    routes: SUPPORT_ROUTES,
    surfaces: ['bar'],
    when: (_state, ctx) => supportTab(ctx) === 'helpLine',
    choices: () => [
      { id: 'other', label: 'Ordinary request' },
      { id: 'securityBreach', label: 'Security breach' },
      { id: 'platformOffline', label: 'Platform offline' },
    ],
    disabledReason: () => null,
    run: (api, ctx, choiceId) => {
      moveClockToEvening(api)
      const reason = choiceId === 'securityBreach' || choiceId === 'platformOffline' ? choiceId : undefined
      const sample = reason === 'securityBreach' ? 'Someone else signed in to my account' : reason === 'platformOffline' ? 'The app will not load at all' : 'Cannot change my rate per unit'
      const res = raiseSupportTicket(api, supportRequester(api.getState(), ctx), {
        channel: 'helpLine',
        kind: 'request',
        priority: 'P3',
        subject: sample,
        description: 'Raised by the demo, out of hours.',
        ...(reason !== undefined ? { reason } : {}),
        app: supportApp(ctx),
      })
      if (!res.ok) return { ok: false, message: res.message }
      const t = api.getState().support.tickets[res.value.ticketId]!
      const when = supportStampText(clockISO(api.getState().clock))
      return {
        ok: true,
        message: t.respondByISO !== undefined
          ? `Clock now ${when}. ${t.id} logged as P1 and answered out of hours: respond by ${supportStampText(t.respondByISO)}.`
          : `Clock now ${when}. ${t.id} logged: not answered out of hours, picked up at the next opening.`,
      }
    },
    indexPath: () => '/admin',
    indexHint: 'Open Help on the Help line tab first.',
  },
  {
    id: 'support-raise-public-holiday',
    label: 'Raise ticket on a public holiday',
    description: "Moves the clock forward to 10:00am on the next national public holiday in the holiday calendar and raises a sample P2 incident, which waits for AA's call-out approval. Reset restores the clock.",
    screen: SUPPORT_SCREEN,
    routes: SUPPORT_ROUTES,
    surfaces: ['bar'],
    when: (_state, ctx) => supportTab(ctx) === 'productSupport',
    disabledReason: (state) => (nextNationalHoliday(state) === null ? 'No later national public holiday in the calendar' : null),
    run: (api) => {
      const holiday = nextNationalHoliday(api.getState())
      if (holiday === null) return { ok: false, message: 'No later national public holiday in the calendar' }
      const clock = api.getState().clock
      if (holiday.dateISO === clock.todayISO) moveClockMinutes(api, PUBLIC_HOLIDAY_MINUTES - clock.minutesSinceMidnight)
      else {
        moveClockToDate(api, holiday.dateISO)
        moveClockMinutes(api, PUBLIC_HOLIDAY_MINUTES - api.getState().clock.minutesSinceMidnight)
      }
      const res = raiseSupportTicket(api, officeActorOf(api.getState().shell), {
        channel: 'productSupport',
        kind: 'incident',
        priority: 'P2',
        subject: 'Billing run stopped part way',
        description: 'Raised by the demo on a public holiday.',
        app: 'admin',
      })
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `Clock now ${timeOfDayText(PUBLIC_HOLIDAY_MINUTES)}, ${holiday.name}. ${res.value.ticketId} logged: the call-out waits for AA's approval.` }
    },
    indexPath: () => '/admin',
    indexHint: 'Open Help, then the Product support tab.',
  },
  {
    id: 'support-approve-call-out',
    label: 'AA approves call-out',
    description: "Stands in for AA telling Stratos, outside the app, that the public-holiday call-out may go ahead on the newest ticket waiting for it.",
    screen: SUPPORT_SCREEN,
    routes: SUPPORT_ROUTES,
    surfaces: ['bar'],
    badge: 'office-stand-in',
    when: (_state, ctx) => supportTab(ctx) === 'productSupport',
    disabledReason: (state) => (newestAwaitingCallOut(state) === null ? 'No call-out awaiting approval' : null),
    run: (api) => {
      const ticket = newestAwaitingCallOut(api.getState())
      if (ticket === null) return { ok: false, message: 'No call-out awaiting approval' }
      const res = approveCallOut(api, OFFICE_SIMULATION_ACTOR, ticket.id)
      return res.ok ? { ok: true, message: `Call-out approved for ${ticket.id}. Stratos can now respond.` } : { ok: false, message: res.message }
    },
    indexPath: () => '/admin',
    indexHint: 'Open Help, then the Product support tab.',
  },
  {
    id: 'support-help-line-responds',
    label: 'Help line responds to this request',
    description: "Plays Stratos' support line: moves Dr Souter's newest open help-line request on one step, Logged to Responded to Closed.",
    screen: 'Mobile · any screen',
    routes: ['/mobile', '/mobile/*'],
    surfaces: ['pwa'],
    // Only while the Help sheet is open (on More), so it never crowds other screens; the chip lifts above the sheet.
    overSheet: true,
    when: (_state, ctx) => supportTab(ctx) === 'helpLine',
    disabledReason: (state) => (newestOpenTicket(state, { channel: 'helpLine', requester: SOUTER_ACTOR.who }) === null ? 'No open request' : null),
    run: (api) => {
      const ticket = newestOpenTicket(api.getState(), { channel: 'helpLine', requester: SOUTER_ACTOR.who })
      if (ticket === null) return { ok: false, message: 'No open request' }
      const res = advanceSupportTicket(api, STRATOS_SUPPORT_ACTOR, ticket.id)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `${ticket.id} ${ticket.subject}: now ${STATUS_LABEL[res.value.status]}.` }
    },
    indexPath: () => '/mobile/more',
    indexHint: 'On a handset, open Help on More, then the Demo chip above the sheet.',
  },
]

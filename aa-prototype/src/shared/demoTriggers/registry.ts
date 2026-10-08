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
  OFFICE_ACTOR,
  OFFICE_SIMULATION_ACTOR,
  WARNING_RULE_COUNT,
  allSampleClearRefusal,
  clearAllSamples,
  clearSamplesOn,
  clearWarning,
  daySampleRaiseRefusal,
  raiseDaySamples,
  raiseSamplesOn,
  sampleClearRefusal,
  sampleRaiseRefusal,
  warningsForBooking,
  armHandoffFault,
  authoriseAsSimulatedOffice,
  officeStandInRefusal,
  authoriseList,
  editContract,
  ingestPdfRow,
  openAccRecs,
  processMessage,
  receivePayment,
  runArchiveJob,
  runReconciliationPoll,
  simulateSignInAttempts,
  submitList,
  type AppState,
  type AppStoreApi,
} from '../../store'
import { CANNED_MESSAGES, SURGEON_PDFS } from '../../domain/integrations'
import { ANAE, CONTRACT, SEED_LIST_IDS, listIdForSlot } from '../../domain/seed'
import { roundToCents } from '../../domain/billing/money'
import { formatCurrency } from '../format'
import { useDemoTriggerMemory } from './memory'
import type { DemoTrigger, DemoTriggerCtx, DemoTriggerResult } from './types'

// ---------------------------------------------------------------------------
// Route patterns (checked against `src/router.tsx` and `pwa/main.tsx`)
// ---------------------------------------------------------------------------

const BILLING_MONITOR = ['/admin/billing'] as const
/** The Billing monitor's index heading (the Control Panel adds its Run payables note under it). */
export const BILLING_MONITOR_SCREEN = 'Admin · Billing monitor'
const XERO_SIM = ['/demo/xero', '/demo/xero/invoices', '/demo/xero/invoices/:accRecId'] as const
const INVOICE_PAGES = ['/admin/invoices/:invoiceId', '/demo/xero/invoices/:accRecId'] as const
const ADMIN_INTEGRATIONS = '/admin/integrations'
const INTEGRATIONS_SIM = '/demo/integrations'
/** The mobile Lists tab is one splat route; registered as its three explicit layers (`listsStackLocation`). */
const MOBILE_LISTS = ['/mobile/lists', '/mobile/lists/:listId', '/mobile/lists/:listId/bookings/:bookingId'] as const
const ADMIN_DAY = '/admin/day/:dateISO'
const ADMIN_BOOKING = '/admin/day/:dateISO/bookings/:bookingId'
const MOBILE_BOOKING = '/mobile/lists/:listId/bookings/:bookingId'
/** Where the sample warnings show (Admin in the bar; the mobile Booking in the bar and the PWA). */
const SAMPLE_WARNING_ROUTES = [ADMIN_DAY, ADMIN_BOOKING, MOBILE_BOOKING] as const

// ---------------------------------------------------------------------------
// Seed-scoped targets
// ---------------------------------------------------------------------------

/** Stage post-op: Dr Sharma's Tue 14 Jul AM List (Sarah Mitchell's first episode). */
export const POST_OP_ORIGINAL_LIST_ID = listIdForSlot(ANAE.sharma, '2026-07-14', 'AM')

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
        ? `Webhook applied ${formatCurrency(amount)} to ${active.invoiceNumber}. The paired ACCPAY is authorised pro-rata.`
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

/** The rule count, said honestly: with one rule, two warnings on one Booking are proven in tests only. */
const RULES_NOTE =
  WARNING_RULE_COUNT === 1
    ? '1 rule registered, so each Booking shows one warning; a Booking with two is proven in tests until a second rule is added.'
    : `${WARNING_RULE_COUNT} rules registered.`

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

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

export const DEMO_TRIGGERS: readonly DemoTrigger[] = [
  // ── Admin · Billing monitor ───────────────────────────────────────────
  {
    id: 'billing-failure',
    label: 'Trigger billing failure',
    description:
      'Dates out the externally held COS ACC contract and authorises Dr Ropata\'s Thu 16 Jul List. One Booking fails to rate; its clean sibling still invoices.',
    screen: BILLING_MONITOR_SCREEN,
    routes: BILLING_MONITOR,
    surfaces: ['bar'],
    when: (state) => state.schedule.lists[SEED_LIST_IDS.billingFailure] !== undefined,
    disabledReason: (state) =>
      state.schedule.lists[SEED_LIST_IDS.billingFailure]?.billedAtISO !== undefined ? 'Already triggered' : null,
    // Phase 09 demo trigger: date out the COS ACC contract (no default fallback)
    // and authorise the seeded failure list; the wired billing run raises the
    // sibling's invoice and fails the COS booking, which surfaces in the monitor.
    run: (api) => {
      const listId = SEED_LIST_IDS.billingFailure
      const list = api.getState().schedule.lists[listId]
      if (list === undefined) return { ok: false, message: 'The billing-failure list is not present in this seed.' }
      if (list.billedAtISO !== undefined) {
        return { ok: false, message: 'Already triggered. Use Resolve & retry on the failed booking in the billing monitor.' }
      }
      editContract(api, OFFICE_ACTOR, CONTRACT.cosAcc, { effectiveToISO: '2026-07-15' })
      if (list.state === 'DRAFT') submitList(api, OFFICE_ACTOR, listId)
      const outcome = authoriseList(api, OFFICE_ACTOR, listId)
      return {
        ok: outcome.ok,
        message: outcome.ok
          ? 'Done. In the Admin app billing monitor the COS booking shows a rating failure while its clean sibling billed. Use Resolve & retry.'
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
            ? `Reconciliation poll applied ${n} previously-missed payment${n === 1 ? '' : 's'}.`
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
            ? `Archive job archived ${res.value.count} inactive Xero contact${res.value.count === 1 ? '' : 's'}.`
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

  // ── Admin · Review and Booking detail (seed-scoped) ──────────────────────
  {
    id: 'stage-post-op',
    label: 'Stage post-op scenario',
    description:
      'Submits and authorises Dr Sharma\'s Tue 14 Jul AM List, so "Add post-op event" can run on its locked Booking. It lands on her free Tue 21 PM session.',
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
      if (list.state === 'DRAFT') submitList(api, OFFICE_ACTOR, listId)
      const submitted = api.getState().schedule.lists[listId]
      if (submitted?.state === 'SUBMITTED') authoriseList(api, OFFICE_ACTOR, listId)
      return {
        ok: true,
        message:
          'Done. Dr Sharma\'s Tue 14 Jul list is authorised and locked. In the Admin day view jump to Tue 14, open its booking and use "Add post-op event"; it lands on her free Tue 21 PM session.',
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
    disabledReason: () => (samplePdfRow() === undefined ? 'The sample PDF row is not present in this build.' : null),
    run: (api) => {
      const sample = samplePdfRow()
      if (sample === undefined) return { ok: false, message: 'The sample PDF row is not present in this build.' }
      const { pdf, row } = sample
      const listId = listIdForSlot(pdf.targetList.anaesthetistId, pdf.targetList.dateISO, pdf.targetList.session)
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
      'Simulates a Xero payment webhook for the remaining balance of the invoice on screen. Its paired ACCPAY is authorised pro-rata. Also on the Xero simulation pair.',
    screen: 'Admin · Invoice',
    routes: INVOICE_PAGES,
    surfaces: ['bar'],
    disabledReason: (state, ctx) => paymentDisabledReason(state, accRecIdOnScreen(state, ctx)),
    run: (api, ctx) => sendPaymentWebhook(api, accRecIdOnScreen(api.getState(), ctx), 'full'),
    indexPath: firstOpenInvoicePath,
    indexEmptyReason: 'No open invoice yet: authorise a List first',
  },
  {
    id: 'payment-half',
    label: 'Payment received · half',
    description:
      'Simulates a Xero payment webhook for half the remaining balance of the invoice on screen (a part payment). Also on the Xero simulation pair.',
    screen: 'Admin · Invoice',
    routes: INVOICE_PAGES,
    surfaces: ['bar'],
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
          ? 'Done. The office authorised this List and the billing run raised its invoices. Balances moves the next day: use Next morning on More.'
          : 'The office authorised this List, but the billing run raised no invoices for it.',
      }
    },
    indexPath: () => null,
  },
  // ── Admin · Day, Booking detail and Mobile · Booking: sample warnings ──
  {
    id: 'raise-sample-warnings',
    label: 'Raise sample warnings',
    description:
      "Stages every warning rule's sample, as Demo actions, on Dr Rutherford's Tue 21 Jul Bookings (from the Day view) or on the Booking on screen: today an unpaid prepayment. Later rules add theirs: base units outside the range, a child as the payer on the Booking, insurer-will-pay with no insurer Contract, a prepaid procedure with no price, a paying patient with a balance.",
    screen: 'Admin · Day and Booking detail, Mobile · Booking',
    routes: SAMPLE_WARNING_ROUTES,
    surfaces: ['bar', 'pwa'],
    disabledReason: raiseSampleDisabled,
    run: (api, ctx) => {
      const bookingId = ctx.params['bookingId']
      const res = bookingId === undefined ? raiseDaySamples(api) : raiseSamplesOn(api, bookingId)
      if (!res.ok) return { ok: false, message: res.message }
      return {
        ok: true,
        message:
          bookingId === undefined
            ? `Raised ${plural(res.value, 'sample warning')} on Dr Rutherford's Tue 21 Jul Lists. They show on the To-do card, the day grid and each Booking. ${RULES_NOTE}`
            : `Raised ${plural(res.value, 'sample warning')} on this Booking: the triangle and the warning at the top of the Booking. ${RULES_NOTE}`,
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
      const res = bookingId === undefined ? clearAllSamples(api) : clearSamplesOn(api, bookingId)
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

  // ── Hospital messages (Future scope) ──────────────────────────────────
  {
    id: 'fire-hospital-message',
    label: 'Fire hospital message',
    description:
      'Sends a canned hospital HL7 v2 or FHIR message into the mock backend, including the Christchurch Public dead-letter case (MSG-CPH-2001). Also on Admin · Integrations and the Integrations simulator.',
    screen: 'Mobile · Lists',
    routes: [...MOBILE_LISTS, ADMIN_INTEGRATIONS, INTEGRATIONS_SIM],
    surfaces: ['bar', 'pwa'],
    badge: 'future-scope',
    choices: () => CANNED_MESSAGES.map((m) => ({ id: m.id, label: `${m.label} · ${m.id}` })),
    defaultChoice: (_state, ctx) => ctx.published['integrationsSim.selectedMessageId'] ?? DEFAULT_MESSAGE_ID,
    disabledReason: () => null,
    run: (api, _ctx, choiceId) => {
      const selectedId = choiceId ?? DEFAULT_MESSAGE_ID
      const res = processMessage(api, selectedId)
      useDemoTriggerMemory.getState().rememberMessage(selectedId)
      return {
        ok: res.ok,
        message: res.ok
          ? `Fired ${selectedId}: ${res.value.outcome}. See the three-pane view in the integration simulator and the log in the Admin app Integrations monitor.`
          : `Refused: ${res.message}`,
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
]

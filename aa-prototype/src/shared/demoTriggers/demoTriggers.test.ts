/**
 * The demo-trigger registry (catch-up Phase 14): its shape, its route scoping,
 * and that each re-homed body reproduces what its Control Panel card did.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { wireBillingRun } from '../../store/billingRun'
import { authoriseList, cancelBooking, submitList } from '../../store/lifecycle'
import { completeAnswered } from '../../test/completeAnswered'
import { LONGER_PREPAID_COPY, STAGE_LONGER_DURATION_MIN } from '../../store/prepaymentFollowupDemo'
import { approveProcedureEvent } from '../../store/procedureEventActions'
import { submitCredit, type CreditReplacementInput } from '../../store/creditActions'
import { resetDemo } from '../../store/clockActions'
import { bookingsForList, openAccRecs, proceduresForBooking } from '../../store/selectors'
import { handoffQueuedFor } from '../../store/ledgerSelectors'
import { clearWarning, warningsForBooking } from '../../store/warnings'
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR, SOUTER_ACTOR } from '../../store/demoActors'
import { PREPAYMENT_SETTLEMENT_DEMO_COPY } from '../../store/prepaymentSettlementDemo'
import { approvePrepayment } from '../../store/prepaymentActions'
import { prepaymentStatusFor } from '../../store/prepaymentSelectors'
import { formatCurrency } from '../format'
import { correctPdfListRow, sendPdfListToMatching } from '../../store/pdfListActions'
import { setAvailabilityRange } from '../../store/availabilityActions'
import { alertOffice } from '../../store/officeAlertActions'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS, SEED_PREPAID_BOOKING_ID, SEED_WARNING_SAMPLE_BOOKINGS } from '../../domain/seed'
import { deliverPaymentWebhook } from '../../store/paymentActions'
import { stagedSouterBooking } from '../../store/eventDemo'
import { BILLING_MONITOR_SCREEN, DEMO_TRIGGERS, POST_OP_ORIGINAL_LIST_ID } from './registry'
import { projectedListId } from '../../domain/slots'
import { demoTriggersFor, groupTriggersByScreen, initialChoice } from './match'
import { useDemoTriggerMemory } from './memory'
import type { DemoContextValues } from './context'
import type { DemoTrigger, DemoTriggerCtx } from './types'

function byId(id: string): DemoTrigger {
  const t = DEMO_TRIGGERS.find((x) => x.id === id)
  if (t === undefined) throw new Error(`no trigger ${id}`)
  return t
}

function ctxFor(pathname: string, params: Record<string, string> = {}, published: Partial<DemoContextValues> = {}): DemoTriggerCtx {
  return { pathname, params, published }
}

function ids(api: BoundAppStore, pathname: string, surface: 'bar' | 'pwa' = 'bar', published: Partial<DemoContextValues> = {}) {
  return demoTriggersFor(api.getState(), pathname, surface, published).map((m) => m.trigger.id)
}

beforeEach(() => {
  useDemoTriggerMemory.setState({ lastMessageId: null, lastWebhook: null, webhookCounter: 0 })
})

describe('registry shape', () => {
  it('has unique kebab-case ids', () => {
    const all = DEMO_TRIGGERS.map((t) => t.id)
    expect(new Set(all).size).toBe(all.length)
    for (const id of all) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('keeps every label, description, screen and hint free of en and em dashes', () => {
    for (const t of DEMO_TRIGGERS) {
      for (const text of [t.label, t.description, t.screen, t.indexHint ?? '', t.indexEmptyReason ?? '']) {
        expect(text, t.id).not.toMatch(/[–—]/)
      }
    }
  })

  it('registers no Run payables on the bar (the Billing monitor has its own badged "Run payables in Xero" button)', () => {
    expect(DEMO_TRIGGERS.some((t) => t.surfaces.includes('bar') && /run payables/i.test(t.label))).toBe(false)
  })

  it('the only label with "payables" is the Xero pair\'s bill payment (catch-up Phase 37); the PWA stand-in runs the office\'s weekly cycle and avoids the word (catch-up Phase 39a)', () => {
    const payables = DEMO_TRIGGERS.filter((t) => /payables/i.test(t.label))
    expect(payables.map((t) => [t.id, t.label, t.surfaces, t.badge])).toEqual([['xero-pay-bill', 'Pay anaesthetist in Xero (payables run)', ['bar'], undefined]])
    const standIn = DEMO_TRIGGERS.find((t) => t.id === 'pwa-office-runs-payables')!
    expect([standIn.label, standIn.surfaces, standIn.badge]).toEqual(["Office runs this week's payment cycle", ['pwa'], 'office-stand-in'])
  })

  it("the PWA stand-in runs this week's cycle: disabled with nothing due, then pays Dr Souter what was released through a weekly run", () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const standIn = DEMO_TRIGGERS.find((t) => t.id === 'pwa-office-runs-payables')!
    const ctx = ctxFor('/mobile/balances')
    expect(standIn.disabledReason(api.getState(), ctx)).toBe('Nothing due to pay out')
    const s = api.getState()
    const bill = Object.values(s.xero.accPays).find((p) => p.anaesthetistId === ANAE.souter && p.payeeAccount !== 'aaHoldingAccount' && s.xero.accRecs[p.accRecId]?.status === 'awaitingPayment')!
    const rec = s.xero.accRecs[bill.accRecId]!
    expect(deliverPaymentWebhook(api, { accRecId: rec.id, amount: rec.amountDue - rec.amountReceived, idempotencyKey: 'PWA-CYCLE' }).ok).toBe(true)
    expect(standIn.disabledReason(api.getState(), ctx)).toBeNull()
    const out = standIn.run(api, ctx)
    expect(out.ok, out.message).toBe(true)
    expect(out.message).toMatch(/^The office ran Week 30's payment cycle and the accountant paid it in Xero: \$[\d,]+\.\d\d to Dr Souter/)
    expect(Object.values(api.getState().billing.payablesRuns).some((r) => r.kind === 'week' && r.cycleId === '2026-W30' && r.status === 'paid')).toBe(true)
    expect(standIn.disabledReason(api.getState(), ctx)).toBe('Nothing due to pay out')
    unwire()
  })

  it('every bar entry\'s Open screen link lands where the entry is visible', () => {
    const api = createAppStore()
    const state = api.getState()
    for (const t of DEMO_TRIGGERS) {
      if (!t.surfaces.includes('bar')) continue
      const path = t.indexPath(state)
      if (path === null) continue
      const published: Partial<DemoContextValues> = {}
      // A Master data view rides in `?view=`, which the screen publishes (catch-up Phase 31).
      const view = new URLSearchParams(path.split('?')[1] ?? '').get('view')
      if (view !== null) published['adminMasters.view'] = view
      // The colleague stand-in shows while an Assign or Reassign picker is open (catch-up Phase 32b).
      if (t.id === 'ask-colleague-make-available') published['adminPicker.listId'] = 'L-29104-2026-07-22-AM'
      // The backdated range shows while Merivale's Face lift is open in its detail (catch-up Phase 24; the index hint says so).
      if (t.id === 'demo-backdated-range') published['adminContracts.openContractId'] = 'CT-MER-FACELIFT'
      expect(ids(api, path.split('?')[0]!, 'bar', published), `${t.id} at ${path}`).toContain(t.id)
    }
  })

  it('pwa-only entries never appear in the harness bar', () => {
    const api = createAppStore()
    const pwaOnly = DEMO_TRIGGERS.filter((t) => !t.surfaces.includes('bar'))
    for (const t of pwaOnly) {
      for (const pattern of t.routes) {
        const path = pattern.replace(/:[a-zA-Z]+/g, 'x')
        expect(ids(api, path)).not.toContain(t.id)
      }
    }
  })
})

describe("the backdated range trigger (catch-up Phase 24)", () => {
  it("shows on the Contracts view and on Merivale's Face lift detail; disabled once the range is added", () => {
    const api = createAppStore()
    expect(ids(api, '/admin/masters', 'bar', { 'adminMasters.view': 'parties' })).not.toContain('demo-backdated-range')
    expect(ids(api, '/admin/masters', 'bar', { 'adminMasters.view': 'contracts' })).toContain('demo-backdated-range')
    expect(ids(api, '/admin/masters', 'bar', { 'adminContracts.openContractId': 'CT-MER-FACELIFT-1' })).not.toContain('demo-backdated-range')
    expect(ids(api, '/admin/masters', 'bar', { 'adminContracts.openContractId': 'CT-MER-FACELIFT' })).toContain('demo-backdated-range')
    const trigger = DEMO_TRIGGERS.find((t) => t.id === 'demo-backdated-range')!
    const result = trigger.run(api, { pathname: '/admin/masters', params: {}, published: { 'adminContracts.openContractId': 'CT-MER-FACELIFT' } })
    expect(result.ok).toBe(true)
    expect(trigger.disabledReason(api.getState(), { pathname: '/admin/masters', params: {}, published: {} })).toBe('Already added')
  })
})

/** What the Xero simulator's Invoices list and Bank reconciliation tab offer (catch-up Phase 37). */
const PINNED_XERO_INVOICES = ['xero-outage-start', 'xero-outage-restore', 'run-reconciliation-poll', 'run-archive-job', 'xero-bulk-remittance']
const PINNED_XERO_BANK = PINNED_XERO_INVOICES

describe('route scoping', () => {
  it('the Billing monitor shows exactly its ten entries (catch-up Phase 37 adds the outage pair, 38b the next billing run, 39 the refund after payout, 39a the payment week and the bank mismatch); routes match the path, so search params never change them', () => {
    const api = createAppStore()
    const ten = ['billing-failure', 'arm-handoff-fault', 'xero-outage-start', 'xero-outage-restore', 'run-reconciliation-poll', 'run-archive-job', 'run-next-billing-run', 'stage-refund-after-payout', 'stage-payment-week', 'stage-bank-mismatch']
    expect([...ids(api, '/admin/billing')].sort()).toEqual([...ten].sort())
  })

  it('"Stage a payment week" and "Stage a bank mismatch": choices, disabled states and results (catch-up Phase 39a)', () => {
    const api = createAppStore()
    const week = byId('stage-payment-week')
    const mismatch = byId('stage-bank-mismatch')
    const ctx = ctxFor('/admin/billing')
    expect(week.choices!(api.getState(), ctx).map((c) => c.label)).toEqual(['19 BCTIs', '19 BCTIs and a credit after payout'])
    expect(mismatch.disabledReason(api.getState(), ctx)).toBe('Nothing received this week')
    const out = week.run(api, ctx, 'bctis')
    expect(out).toMatchObject({ ok: true, message: '19 payables released for Dr Sharma into Week 30. Close the week to start the run.' })
    expect(week.disabledReason(api.getState(), ctx)).toBe('Already staged for this week')
    expect(mismatch.disabledReason(api.getState(), ctx)).toBeNull()
    expect(mismatch.run(api, ctx).message).toMatch(/^The bank download is missing the receipt for AA-2026-PP\d\d\. Close the week to see the anomaly\.$/)
  })

  it('"Pay anaesthetist in Xero" pays a bill only as a line of a scheduled run (catch-up Phase 39a)', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const t = byId('xero-pay-bill')
    const s = api.getState()
    const bill = Object.values(s.xero.accPays).find((p) => p.anaesthetistId === ANAE.souter && p.payeeAccount !== 'aaHoldingAccount' && s.xero.accRecs[p.accRecId]?.status === 'awaitingPayment')!
    const rec = s.xero.accRecs[bill.accRecId]!
    expect(deliverPaymentWebhook(api, { accRecId: rec.id, amount: rec.amountDue - rec.amountReceived, idempotencyKey: 'PAY-BILL-GATE' }).ok).toBe(true)
    const ctx = ctxFor(`/demo/xero/invoices/${rec.id}`, { accRecId: rec.id })
    expect(t.disabledReason(api.getState(), ctx)).toBe('Not in an approved payment run yet')
    unwire()
  })

  it('the Xero outage pair, and the pair-only Xero actions, are bar-only with working disabled states (catch-up Phase 37)', () => {
    const api = createAppStore()
    const start = DEMO_TRIGGERS.find((t) => t.id === 'xero-outage-start')!
    const restore = DEMO_TRIGGERS.find((t) => t.id === 'xero-outage-restore')!
    const ctx = ctxFor('/admin/billing')
    expect(start.disabledReason(api.getState(), ctx)).toBeNull()
    expect(restore.disabledReason(api.getState(), ctx)).toBe('Xero is connected')
    expect(start.run(api, ctx).ok).toBe(true)
    expect(start.disabledReason(api.getState(), ctx)).toBe('Xero is already unavailable')
    expect(restore.run(api, ctx).ok).toBe(true)
    for (const id of ['xero-outage-start', 'xero-outage-restore', 'xero-void-invoice', 'xero-amend-invoice', 'xero-pay-bill', 'xero-bulk-remittance']) {
      const t = DEMO_TRIGGERS.find((e) => e.id === id)!
      expect(t.surfaces, id).toEqual(['bar'])
      expect(`${t.label} ${t.description}`, id).not.toMatch(/[–—]/)
    }
    expect(ids(api, '/demo/xero/invoices')).toEqual(PINNED_XERO_INVOICES)
    expect(ids(api, '/demo/xero/bank')).toEqual(PINNED_XERO_BANK)
  })

  it('the bulk remittance runs once from Xero Invoices or Bank reconciliation, then reads Already received (catch-up Phase 37)', () => {
    const api = createAppStore()
    const t = DEMO_TRIGGERS.find((e) => e.id === 'xero-bulk-remittance')!
    expect(t.routes).toEqual(['/demo/xero/invoices', '/demo/xero/bank'])
    const ctx = ctxFor('/demo/xero/bank')
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx).ok).toBe(true)
    expect(t.disabledReason(api.getState(), ctx)).toBe('Already received')
  })

  it('Inject unmatched receipt also shows on the Admin Day dashboard, for its Reconciliation card (catch-up Phase 37)', () => {
    expect(ids(createAppStore(), '/admin/day/2026-07-21')).toContain('inject-unmatched-receipt')
  })

  it('the Admin day view shows the sample-warning entries (15a) and Simulate sickness (catch-up Phase 30)', () => {
    const onDay = ids(createAppStore(), '/admin/day/2026-07-21')
    expect(onDay).toEqual(expect.arrayContaining(['raise-sample-warnings', 'clear-sample-warnings', 'simulate-sickness']))
  })

  it('Simulate sickness shows on the Day view and Conflicts, bar only, and not on a Booking', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/conflicts')).toContain('simulate-sickness')
    expect(ids(api, '/admin/day/2026-07-22/bookings/BK0001')).not.toContain('simulate-sickness')
    const entry = DEMO_TRIGGERS.find((t) => t.id === 'simulate-sickness')!
    expect(entry.surfaces).toEqual(['bar'])
  })

  it('Simulate sickness (re-pointed in catch-up Phase 32b): a "to the office" row per List and a "to Dr X" row; the List goes, never a conflict', () => {
    const api = createAppStore()
    const t = byId('simulate-sickness')
    const ctx = ctxFor('/admin/day/2026-07-22', { dateISO: '2026-07-22' })
    const choices = t.choices!(api.getState(), ctx)
    const sharma = choices.filter((c) => c.id.startsWith('L-41267-2026-07-22-PM|'))
    expect(sharma.map((c) => c.id)).toEqual(['L-41267-2026-07-22-PM|office', 'L-41267-2026-07-22-PM|colleague'])
    expect(sharma[0]!.label).toMatch(/, to the office$/)
    expect(sharma[1]!.label).toMatch(/, to Dr \w+$/)
    expect(choices.some((c) => c.id.startsWith('L-29104-2026-07-22-AM'))).toBe(false)
    expect(t.description).not.toMatch(/provisional|conflict shows/i)
    const office = t.run(api, ctx, sharma[0]!.id)
    expect(office.ok).toBe(true)
    expect(office.message).toMatch(/went back to the Draft Lists with its Bookings\. No conflict\.$/)
    expect(api.getState().schedule.lists['L-41267-2026-07-22-PM']?.state).toBe('DRAFT')
    const api2 = createAppStore()
    const colleague = t.run(api2, ctx, 'L-41267-2026-07-22-PM|colleague')
    expect(colleague.ok).toBe(true)
    expect(colleague.message).toMatch(/went to Dr \w+ with its Bookings\. No conflict\.$/)
    expect(api2.getState().schedule.lists['L-41267-2026-07-22-PM']?.state).toBe('ACTIVE')
    expect(api2.getState().audit.some((a) => a.action === 'list.conflict')).toBe(false)
  })

  it('Office resolves this alert (catch-up Phase 32b): PWA only, badged, on the List and Booking routes; disabled until there is an open alert', () => {
    const api = createAppStore()
    const t = byId('office-resolves-alert')
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    const listId = SEED_LIST_IDS.souterAm21
    expect(ids(api, `/mobile/lists/${listId}`, 'pwa')).toContain(t.id)
    expect(ids(api, `/mobile/lists/${listId}`, 'bar')).not.toContain(t.id)
    const ctx = ctxFor(`/mobile/lists/${listId}`, { listId })
    expect(t.disabledReason(api.getState(), ctx)).toBe('No open alert to the office here')
    expect(alertOffice(api, SOUTER_ACTOR, { listId, note: 'Please check' }).ok).toBe(true)
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx)).toEqual({ ok: true, message: 'The office resolved your alert.' })
    expect(Object.values(api.getState().notifications).find((n) => n.kind === 'officeAlert')?.resolvedBy).toBe('AA office (simulated)')
  })

  it('Office approves this Contract change (catch-up Phase 21a): PWA only, badged, on the Booking route; disabled with nothing to approve or on an AUTHORISED List; a second press does nothing new', () => {
    const api = createAppStore()
    const t = byId('office-approves-contract-change')
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    const bookingId = SEED_MARKERS.contractChangeBooking!.entityId
    const listId = SEED_LIST_IDS.reviewFlags
    const path = `/mobile/lists/${listId}/bookings/${bookingId}`
    expect(ids(api, path, 'pwa')).toContain(t.id)
    expect(ids(api, path, 'bar')).not.toContain(t.id)
    const ctx = ctxFor(path, { listId, bookingId })
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx)).toEqual({ ok: true, message: 'The office approved your Contract change.' })
    expect(t.disabledReason(api.getState(), ctx)).toBe('No Contract change to approve')
    const count = api.getState().audit.length
    expect(t.run(api, ctx).ok).toBe(false)
    expect(api.getState().audit.length).toBe(count)
    const typed = SEED_MARKERS.typedPriceBooking!.entityId
    expect(t.disabledReason(api.getState(), ctxFor(`/mobile/lists/${listId}/bookings/${typed}`, { listId, bookingId: typed }))).toBe('No Contract change to approve')
    const authorised = Object.values(api.getState().schedule.bookings).find((b) => api.getState().schedule.lists[b.listId]?.state === 'AUTHORISED')!
    expect(t.disabledReason(api.getState(), ctxFor(`/mobile/lists/${authorised.listId}/bookings/${authorised.id}`, { listId: authorised.listId, bookingId: authorised.id }))).toBe("This Booking's List is authorised")
  })

  it('Ask a colleague to make their session available (catch-up Phase 32b): only while a picker is open, badged, never a session holding a List', () => {
    const api = createAppStore()
    const t = byId('ask-colleague-make-available')
    expect(t.badge).toBe('colleague-stand-in')
    expect(ids(api, '/admin/draft-lists')).not.toContain(t.id)
    const published = { 'adminPicker.listId': 'L-29104-2026-07-22-AM' }
    expect(ids(api, '/admin/draft-lists', 'bar', published)).toContain(t.id)
    const ctx = ctxFor('/admin/draft-lists', {}, published)
    const rutherford = 'S-29104-2026-07-22-AM'
    expect(t.choices!(api.getState(), ctx).map((c) => c.id)).toContain(rutherford)
    expect(t.disabledReason(api.getState(), ctx, rutherford)).toBeNull()
    expect(t.disabledReason(api.getState(), ctx, `S-${'34821'}-2026-07-22-AM`)).toBe('This session holds a List')
    const out = t.run(api, ctx, rutherford)
    expect(out.ok).toBe(true)
    expect(out.message).toMatch(/^Dr Rutherford made Wed 22 Jul AM available\./)
    expect(api.getState().schedule.slots[rutherford]?.status).toBe('free')
    expect(t.disabledReason(api.getState(), ctx, rutherford)).toBe('Already available')
  })

  it('Stage post-op shows on Dr Sharma\'s Tue 14 AM review and Booking, and nowhere else', () => {
    const api = createAppStore()
    expect(ids(api, `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`)).toContain('stage-post-op')
    const booking = bookingsForList(api.getState(), POST_OP_ORIGINAL_LIST_ID)[0]
    expect(booking).toBeDefined()
    expect(ids(api, `/admin/day/2026-07-14/bookings/${booking?.id ?? ''}`)).toContain('stage-post-op')
    expect(ids(api, `/admin/review/${SEED_LIST_IDS.souterMon20Am}`)).not.toContain('stage-post-op')
  })

  it('Receive updated PDF from rooms shows only on Intake\'s PDF lists (catch-up Phase 34)', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/intake/pdfs')).toContain('pdf-list-resend')
    expect(ids(api, '/admin/intake/matching')).not.toContain('pdf-list-resend')
    expect(ids(api, '/admin/intake/pdfs', 'pwa')).not.toContain('pdf-list-resend')
  })

  it('the Intake entries sit on Intake\'s routes, the HL7 entries only on the Future-scope surface (catch-up Phase 34)', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/intake/matching')).toEqual(expect.arrayContaining(['matching-receive-theatre-list', 'matching-send-update']))
    for (const path of ['/mobile/lists', '/mobile/lists/L1', '/mobile/lists/L1/bookings/BK1', '/admin/intake/matching', '/admin/intake/pdfs', '/admin/integrations', '/admin/matching']) {
      expect(ids(api, path, 'bar')).not.toContain('fire-hospital-message')
      expect(ids(api, path, 'bar')).not.toContain('replay-hospital-message')
    }
    expect(ids(api, '/demo/integrations/log')).toEqual(expect.arrayContaining(['fire-hospital-message', 'replay-hospital-message']))
    for (const id of ['matching-receive-theatre-list', 'matching-send-update', 'pdf-list-resend']) expect(byId(id).screen).toBe('Admin · Intake')
    for (const id of ['fire-hospital-message', 'replay-hospital-message']) expect(byId(id).screen).toBe('Future scope: HL7 and FHIR')
  })

  it('no entry outside the Future-scope surface names Christchurch Public (catch-up Phase 34; RV-16)', () => {
    for (const t of DEMO_TRIGGERS) {
      if (t.routes.every((r) => r.startsWith('/demo/integrations'))) continue
      expect(`${t.label} ${t.description}`).not.toMatch(/Christchurch Public/)
    }
  })

  it('the simulator\'s published selection preselects the message', () => {
    const api = createAppStore()
    const t = byId('fire-hospital-message')
    expect(initialChoice(t, api.getState(), ctxFor('/demo/integrations'))).toBe('MSG-STG-1001')
    expect(initialChoice(t, api.getState(), ctxFor('/demo/integrations', {}, { 'integrationsSim.selectedMessageId': 'MSG-CPH-2001' }))).toBe('MSG-CPH-2001')
  })
})

describe('re-homed bodies match the Control Panel', () => {
  it("billing failure (re-based, catch-up Phase 25) holds Losa Tuilagi back at the Xero hand-off, bills Hemi Walker, fails no List, edits no Contract, then reads Already triggered", () => {
    const api = createAppStore()
    wireBillingRun(api)
    const t = byId('billing-failure')
    const ctx = ctxFor('/admin/billing')
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    // The seed's own Contract entries (catch-up Phase 25a's seeded disable) are there before the trigger runs.
    const contractEntries = (s: ReturnType<typeof api.getState>) => s.audit.filter((a) => a.action.startsWith('contract.')).length
    const seededContractEntries = contractEntries(api.getState())
    expect(t.run(api, ctx).ok).toBe(true)
    const state = api.getState()
    expect(state.masters.contracts).toEqual(createAppStore().getState().masters.contracts)
    expect(contractEntries(state)).toBe(seededContractEntries)
    const pairs = Object.values(state.billing.ledger).flatMap((p) =>
      p.kind !== 'aaFee' && bookingsForList(state, SEED_LIST_IDS.billingFailure).some((booking) => booking.id === p.bookingId) ? [p] : [],
    )
    const losa = pairs.find((p) => p.bookingId === SEED_MARKERS['billingFailureBooking']!.entityId)!
    // Catch-up Phase 37: her hand-off waits in the Xero sync queue.
    expect(handoffQueuedFor(state, losa.id)).toBeDefined()
    expect(losa.receivable.xeroAccRecId).toBeUndefined()
    expect(pairs.filter((p) => p.bookingId !== losa.bookingId).every((p) => p.receivable.xeroAccRecId !== undefined)).toBe(true)
    // (catch-up Phase 36: a billing-run failure is a BillingException, not a failed case.)
    expect(Object.values(state.billing.exceptions).some((x) => x.listId === SEED_LIST_IDS.billingFailure)).toBe(false)
    expect(state.schedule.lists[SEED_LIST_IDS.billingFailure]!.billedAtISO).toBeDefined()
    expect(t.disabledReason(api.getState(), ctx)).toBe('Already triggered')
    expect(t.run(api, ctx).message).toBe('Already triggered.')
  })

  it('arm handoff fault arms once and reads Armed', () => {
    const api = createAppStore()
    const t = byId('arm-handoff-fault')
    t.run(api, ctxFor('/admin/billing'))
    expect(api.getState().settings.failNextHandoff).toBe(true)
    expect(t.disabledReason(api.getState(), ctxFor('/admin/billing'))).toBe('Armed')
  })

  it("stage post-op authorises and bills the Sharma List (38b) and stages Dr Souter's submitted ACL reconstruction (39b), no event, then reads Already staged", () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const t = byId('stage-post-op')
    const ctx = ctxFor(`/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, { listId: POST_OP_ORIGINAL_LIST_ID })
    const lists = Object.keys(api.getState().schedule.lists).length
    const events = Object.keys(api.getState().schedule.procedureEvents)
    const out = t.run(api, ctx)
    expect(out).toEqual({
      ok: true,
      message: "Staged. Search Bennett, open Wednesday's Booking and use Add pre-op or post-op event. Sarah Mitchell's Tue 14 Jul List is authorised and billed for Create additional invoice.",
    })
    expect(api.getState().schedule.lists[POST_OP_ORIGINAL_LIST_ID]?.state).toBe('AUTHORISED')
    // Dr Souter's half: one List in her free Wed 15 Jul PM session, SUBMITTED, Coral Bennett on St George's ACC.
    expect(Object.keys(api.getState().schedule.lists)).toHaveLength(lists + 1)
    const staged = stagedSouterBooking(api.getState())!
    expect(api.getState().schedule.lists[staged.listId]).toMatchObject({ state: 'SUBMITTED', dateISO: '2026-07-15', session: 'PM', anaesthetistId: ANAE.souter })
    const procedure = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === staged.id)!
    expect(procedure).toMatchObject({ governingContractId: 'CT-STG-ACC', isPrimary: true })
    expect(Object.keys(api.getState().schedule.procedureEvents)).toEqual(events)
    expect(t.disabledReason(api.getState(), ctx)).toBe("Already staged: search Bennett and open Wednesday's Booking")
    // Each half is idempotent: a second run stages nothing more.
    expect(t.run(api, ctx).ok).toBe(true)
    unwire()
    expect(Object.keys(api.getState().schedule.lists)).toHaveLength(lists + 1)
    // On the anaesthetist's screens too, in the bar and the PWA sheet.
    expect(ids(api, '/mobile/lists', 'pwa')).toContain('stage-post-op')
    expect(ids(api, '/web/lists', 'bar')).toContain('stage-post-op')
  })

  it('Run the next billing run is on the Billing monitor and Review only, disabled until an event is approved, then raises its invoice once (catch-up Phase 38b)', () => {
    const api = createAppStore()
    const t = byId('run-next-billing-run')
    expect(t.surfaces).toEqual(['bar'])
    expect(ids(api, '/admin/review')).toContain('run-next-billing-run')
    expect(ids(api, '/admin/billing')).toContain('run-next-billing-run')
    expect(ids(api, '/admin/invoices')).not.toContain('run-next-billing-run')
    const ctx = ctxFor('/admin/billing')
    expect(t.disabledReason(api.getState(), ctx)).toBe('No approved events are waiting for the billing run.')
    expect(approveProcedureEvent(api, OFFICE_ACTOR, 'EV0001').ok).toBe(true)
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    const out = t.run(api, ctx)
    expect(out.ok).toBe(true)
    expect(out.message).toMatch(/^Billing run done: 1 additional invoice raised \(AA-2026-\d{4}\)\.$/)
    expect(t.disabledReason(api.getState(), ctx)).not.toBeNull()
  })

  it('"Office reviews this additional invoice" is PWA only on the mobile Booking, approves and invoices it, then is disabled (catch-up Phase 38b)', () => {
    const api = createAppStore()
    const t = byId('office-reviews-additional-invoice')
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    const path = '/mobile/lists/L-HIST-03/bookings/HBK03'
    expect(ids(api, path, 'pwa')).toContain('office-reviews-additional-invoice')
    expect(ids(api, path, 'bar')).not.toContain('office-reviews-additional-invoice')
    const ctx = ctxFor(path, { listId: 'L-HIST-03', bookingId: 'HBK03' })
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    const out = t.run(api, ctx)
    expect(out.ok).toBe(true)
    expect(out.message).toMatch(/^Reviewed by the office \(simulated\)\. Invoice AA-2026-\d{4} raised in the next run\.$/)
    expect(api.getState().schedule.procedureEvents['EV0001']?.invoiceId).toBeDefined()
    expect(t.disabledReason(api.getState(), ctx)).toBe('No event awaiting review or the next run on this Booking')
    expect(t.disabledReason(api.getState(), ctxFor('/mobile/lists/x/bookings/BK0001', { bookingId: 'BK0001' }))).toBe('No event awaiting review or the next run on this Booking')
  })

  it('Receive updated PDF from rooms waits for a sent list, then lands the re-sent one once (catch-up Phase 34)', () => {
    const api = createAppStore()
    const t = byId('pdf-list-resend')
    const ctx = ctxFor('/admin/intake/pdfs')
    expect(t.disabledReason(api.getState(), ctx, 'PDF-OKAFOR-0805')).toBe('Send the first version to matching first.')
    expect(correctPdfListRow(api, OFFICE_ACTOR, 'PDL0001', 'R2', { nhi: 'ZAA0067' }).ok).toBe(true)
    expect(sendPdfListToMatching(api, OFFICE_ACTOR, 'PDL0001').ok).toBe(true)
    expect(t.disabledReason(api.getState(), ctx, 'PDF-OKAFOR-0805')).toBeNull()
    expect(t.run(api, ctx, 'PDF-OKAFOR-0805').ok).toBe(true)
    expect(Object.values(api.getState().intake.pdfLists).filter((l) => l.replacesId === 'PDL0001')).toHaveLength(1)
    expect(t.disabledReason(api.getState(), ctx, 'PDF-OKAFOR-0805')).toBe('The updated list has already arrived.')
  })

  it('half then replay applies once, keyed WEBHOOK-<accRecId>-<n>', () => {
    const api = createAppStore()
    wireBillingRun(api)
    authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState())[0]
    expect(open).toBeDefined()
    if (open === undefined) return
    const ctx = ctxFor(`/admin/invoices/${open.invoiceId}`, { invoiceId: open.invoiceId })
    expect(byId('payment-replay').disabledReason(api.getState(), ctx)).not.toBeNull()

    const half = byId('payment-half').run(api, ctx)
    expect(half.ok).toBe(true)
    const afterHalf = api.getState().xero.accRecs[open.accRecId]?.amountReceived ?? 0
    expect(afterHalf).toBeGreaterThan(0)
    expect(afterHalf).toBeLessThan(open.amountDue)
    expect(useDemoTriggerMemory.getState().lastWebhook?.key).toBe(`WEBHOOK-${open.accRecId}-1`)

    const replay = byId('payment-replay').run(api, ctx)
    expect(replay.message).toMatch(/^Duplicate webhook ignored/)
    expect(api.getState().xero.accRecs[open.accRecId]?.amountReceived).toBe(afterHalf)

    // A forgotten counter (a reload) never reuses a key already in the receipts.
    useDemoTriggerMemory.setState({ webhookCounter: 0 })
    byId('payment-full').run(api, ctx)
    expect(useDemoTriggerMemory.getState().lastWebhook?.key).toBe(`WEBHOOK-${open.accRecId}-2`)
    expect(byId('payment-full').disabledReason(api.getState(), ctx)).toBe('Fully paid')
  })

  it('payment entries refuse an invoice not yet handed off, and a replay after a reset', () => {
    const api = createAppStore()
    expect(byId('payment-full').disabledReason(api.getState(), ctxFor('/admin/invoices/NOPE', { invoiceId: 'NOPE' }))).toBe('Not handed off to Xero')
    useDemoTriggerMemory.setState({ lastWebhook: { accRecId: 'GONE', key: 'WEBHOOK-GONE-1', amount: 10 } })
    const res = byId('payment-replay').run(api, ctxFor('/admin/invoices/NOPE', { invoiceId: 'NOPE' }))
    expect(res.ok).toBe(false)
    expect(res.message).toMatch(/reset/)
  })

  it('payment replay refuses after a reset even when the ACCREC id comes back', () => {
    const api = createAppStore()
    wireBillingRun(api)
    const stage = () => {
      authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Am)
      const open = openAccRecs(api.getState())[0]
      if (open === undefined) throw new Error('no open invoice')
      return { open, ctx: ctxFor(`/admin/invoices/${open.invoiceId}`, { invoiceId: open.invoiceId }) }
    }
    const first = stage()
    byId('payment-half').run(api, first.ctx)
    resetDemo(api)
    const again = stage()
    expect(again.open.accRecId).toBe(first.open.accRecId) // ids restart from the counters
    expect(byId('payment-replay').disabledReason(api.getState(), again.ctx)).toMatch(/reset/)
    const res = byId('payment-replay').run(api, again.ctx)
    expect(res.ok).toBe(false)
    expect(api.getState().xero.accRecs[again.open.accRecId]?.amountReceived).toBe(0)
  })

  it('poll and archive return their counts', () => {
    const api = createAppStore()
    expect(byId('run-reconciliation-poll').run(api, ctxFor('/admin/billing')).message).toMatch(/^Reconciliation poll/)
    expect(byId('run-archive-job').run(api, ctxFor('/admin/billing')).message).toMatch(/^Archive job/)
  })

  it('fire then replay dedupes', () => {
    const api = createAppStore()
    const ctx = ctxFor('/mobile/lists')
    expect(byId('replay-hospital-message').disabledReason(api.getState(), ctx)).toBe('Fire a message first')
    expect(byId('fire-hospital-message').run(api, ctx, 'MSG-STG-1001').ok).toBe(true)
    expect(byId('replay-hospital-message').run(api, ctx).message).toMatch(/^Deduplicated/)
    // After a reset the message is gone from the log: replay refuses rather than re-creating the Booking.
    resetDemo(api)
    expect(byId('replay-hospital-message').disabledReason(api.getState(), ctx)).toMatch(/reset/)
    expect(byId('replay-hospital-message').run(api, ctx).ok).toBe(false)
  })
})

describe('session 2 entries', () => {
  it('Simulate sign-in attempts shows on Admin Audit only', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/audit')).toEqual(['simulate-sign-in'])
    expect(byId('simulate-sign-in').run(api, ctxFor('/admin/audit')).ok).toBe(true)
    expect(api.getState().audit.filter((a) => a.entityType === 'account')).toHaveLength(5)
  })

  it('the office stand-in shows on a mobile List in the PWA only, and authorises a submitted one', () => {
    const api = createAppStore()
    wireBillingRun(api)
    const listId = SEED_LIST_IDS.souterMon20Am
    expect(ids(api, `/mobile/lists/${listId}`, 'pwa')).toContain('office-authorises-list')
    expect(ids(api, `/mobile/lists/${listId}/bookings/BK1`, 'pwa')).toContain('office-authorises-list')
    expect(ids(api, `/mobile/lists/${listId}`, 'bar')).not.toContain('office-authorises-list')
    expect(ids(api, '/mobile/lists', 'pwa')).not.toContain('office-authorises-list')
    const t = byId('office-authorises-list')
    const ctx = ctxFor(`/mobile/lists/${listId}`, { listId })
    expect(t.badge).toBe('office-stand-in')
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx).message).toMatch(/invoices/)
    expect(api.getState().schedule.lists[listId]?.state).toBe('AUTHORISED')
    expect(t.disabledReason(api.getState(), ctx)).toBe('Already authorised')
    const active = SEED_LIST_IDS.souterPm21
    expect(t.disabledReason(api.getState(), ctxFor(`/mobile/lists/${active}`, { listId: active }))).toBe('Submit the List first')
  })

  it('every office stand-in declares the PWA surface only; a colleague stand-in too, but for the Admin pickers\' one (catch-up Phase 32b)', () => {
    // The anaesthetist apps run only as Dr Souter, so in Admin the presenter cannot
    // play Dr Ngata agreeing to free his session: that one colleague stand-in is Admin's.
    const ADMIN_COLLEAGUE_STAND_INS = ['ask-colleague-make-available']
    for (const t of DEMO_TRIGGERS.filter((x) => x.badge === 'office-stand-in' || x.badge === 'colleague-stand-in')) {
      expect(t.surfaces, t.id).toEqual(ADMIN_COLLEAGUE_STAND_INS.includes(t.id) ? ['bar'] : ['pwa'])
    }
  })

  it('PWA Balances offers Dr Souter\'s open invoices as choices and pays the chosen one', () => {
    const api = createAppStore()
    wireBillingRun(api)
    const t = byId('pwa-payment-half')
    const ctx = ctxFor('/mobile/balances')
    expect(ids(api, '/mobile/balances', 'pwa')).toEqual(['pwa-office-runs-payables', 'pwa-payment-full', 'pwa-payment-half'])
    expect(ids(api, '/mobile/balances', 'bar')).toEqual([])
    expect(t.disabledReason(api.getState(), ctx, initialChoice(t, api.getState(), ctx))).toBe('No open invoices yet')
    authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Am)
    const choices = t.choices?.(api.getState(), ctx) ?? []
    expect(choices.length).toBeGreaterThan(0)
    const chosen = choices[choices.length - 1]?.id
    const message = t.run(api, ctx, chosen).message
    // Exactly the amount received is released; no fee wording (catch-up Phase 16).
    expect(message).toMatch(/^Webhook for AA-2026-\d{4}: \$[\d,.]+ received, the paired ACCPAY is authorised for exactly \$[\d,.]+\.$/)
    expect(message).not.toMatch(/fee|pro-rata|proportion/i)
    const received = api.getState().xero.accRecs[chosen ?? '']?.amountReceived ?? 0
    expect(received).toBeGreaterThan(0)
    const pay = Object.values(api.getState().xero.accPays).find((p) => p.accRecId === chosen)
    expect(pay?.amountAuthorised).toBe(received)
  })

  it('the PWA chip is absent on More; Availability has only the colleague-move stand-in (catch-up Phase 32)', () => {
    const api = createAppStore()
    expect(ids(api, '/mobile/more', 'pwa')).toEqual([])
    expect(ids(api, '/mobile/availability', 'pwa')).toEqual(['colleague-moves-list-to-me'])
  })
})

describe('an anaesthetist moves her own List (catch-up Phase 32)', () => {
  const ADMIN = 'colleague-moves-list-to-office'
  const PWA = 'colleague-moves-list-to-me'

  it('shows the Admin entry in the bar on Admin Day and Notifications, never on the PWA', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/day/2026-07-21')).toContain(ADMIN)
    expect(ids(api, '/admin/notifications')).toContain(ADMIN)
    expect(ids(api, '/admin/day/2026-07-21', 'pwa')).not.toContain(ADMIN)
    expect(ids(api, '/mobile/availability', 'pwa')).not.toContain(ADMIN)
  })

  it('shows the stand-in on the PWA on Mobile Availability only, never in the bar', () => {
    const api = createAppStore()
    expect(ids(api, '/mobile/availability', 'pwa')).toContain(PWA)
    expect(ids(api, '/mobile/availability')).not.toContain(PWA)
    expect(ids(api, '/mobile/lists', 'pwa')).not.toContain(PWA)
    expect(byId(PWA).badge).toBe('colleague-stand-in')
  })

  it('"One move" makes one move and one notification; the busy morning makes eight, two pages', () => {
    const api = createAppStore()
    const t = byId(ADMIN)
    const ctx = ctxFor('/admin/day/2026-07-21', { dateISO: '2026-07-21' })
    expect(t.disabledReason(api.getState(), ctx, 'one')).toBeNull()
    expect(t.run(api, ctx, 'one').ok).toBe(true)
    expect(Object.keys(api.getState().notifications)).toHaveLength(1)
    expect(api.getState().audit.filter((a) => a.action === 'list.ownerMove')).toHaveLength(1)
    const busy = createAppStore()
    const out = t.run(busy, ctx, 'busy')
    expect(out.ok).toBe(true)
    expect(out.message).not.toMatch(/[–—]/)
    expect(Object.keys(busy.getState().notifications)).toHaveLength(8)
  })

  it('the stand-in moves a colleague List into her free session, with a message that names no preference', () => {
    const api = createAppStore()
    const out = byId(PWA).run(api, ctxFor('/mobile/availability'))
    expect(out.ok).toBe(true)
    expect(out.message).toMatch(/into your free session\.$/)
    expect(out.message).not.toMatch(/Draft List|slot|prefer|tier|[–—]/i)
  })

  it('reads its disabled reasons when nothing fits', () => {
    const api = createAppStore()
    const state = api.getState()
    const empty = { ...state, schedule: { ...state.schedule, lists: {} } }
    expect(byId(ADMIN).disabledReason(empty, ctxFor('/admin/notifications'), 'one')).toBe('No List on the schedule fits')
    expect(byId(PWA).disabledReason(empty, ctxFor('/mobile/availability'))).toBe('No colleague List fits one of your free sessions')
  })
})

describe('a colleague hands a single Booking over (catch-up Phase 32a)', () => {
  const ADMIN = 'colleague-hands-booking-to-souter'
  const PWA = 'colleague-moves-booking-to-me'

  it('has unique ids and labels with no dash but the hyphen', () => {
    expect(DEMO_TRIGGERS.filter((t) => t.id === ADMIN || t.id === PWA)).toHaveLength(2)
    for (const t of [byId(ADMIN), byId(PWA)]) expect(`${t.label} ${t.description}`).not.toMatch(/[–—]/)
  })

  it('shows the Admin entry in the bar on Admin Day only, never on the PWA', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/day/2026-07-21')).toContain(ADMIN)
    expect(ids(api, '/admin/notifications')).not.toContain(ADMIN)
    expect(ids(api, '/admin/day/2026-07-21', 'pwa')).not.toContain(ADMIN)
    expect(ids(api, '/mobile/lists', 'pwa')).not.toContain(ADMIN)
  })

  it('shows the stand-in on the PWA on the mobile Lists routes, with its badge, never in the bar', () => {
    const api = createAppStore()
    for (const path of ['/mobile/lists', '/mobile/lists/L-34821-2026-07-22-AM', '/mobile/lists/L-34821-2026-07-22-AM/bookings/BK0046']) {
      expect(ids(api, path, 'pwa')).toContain(PWA)
      expect(ids(api, path)).not.toContain(PWA)
    }
    expect(ids(api, '/mobile/availability', 'pwa')).not.toContain(PWA)
    expect(byId(PWA).badge).toBe('colleague-stand-in')
  })

  it('the Admin entry makes exactly one move, with the office notice, a new List on Souter\'s row and a plain message', () => {
    const api = createAppStore()
    const ctx = ctxFor('/admin/day/2026-07-21', { dateISO: '2026-07-21' })
    expect(byId(ADMIN).disabledReason(api.getState(), ctx)).toBeNull()
    const out = byId(ADMIN).run(api, ctx)
    expect(out.ok).toBe(true)
    expect(out.message).toBe("Dr Hughes moved a Booking (Wed 22 Jul PM, Christchurch Eye Surgery) to Dr Souter. A new List was created.")
    const s = api.getState()
    expect(s.audit.filter((a) => a.action === 'booking.movedToAnaesthetist')).toHaveLength(1)
    expect(Object.values(s.notifications).map((n) => n.kind)).toEqual(['bookingMoved'])
    expect(s.schedule.bookings['BK0140']?.listId).toBe(Object.values(s.schedule.lists).find((l) => l.state === 'ACTIVE' && l.slotId === 'S-34821-2026-07-22-PM')?.id)
    // Its only candidate is used: nothing else fits a session she is free in.
    expect(byId(ADMIN).disabledReason(api.getState(), ctx)).toBe('No colleague Booking fits a session Dr Souter is free in')
  })

  it('the stand-in lists its candidates, runs one as the colleague, and names no preference', () => {
    const api = createAppStore()
    const t = byId(PWA)
    const ctx = ctxFor('/mobile/lists')
    const choices = t.choices!(api.getState(), ctx)
    expect(choices).toEqual([{ id: 'BK0140', label: 'Dr Hughes · Wed 22 Jul PM · Christchurch Eye Surgery' }])
    expect(t.defaultChoice!(api.getState(), ctx)).toBe('BK0140')
    const out = t.run(api, ctx, 'BK0140')
    expect(out.ok).toBe(true)
    expect(out.message).not.toMatch(/Draft List|slot|prefer|tier|[–—]/i)
    expect(api.getState().audit.filter((a) => a.action === 'booking.movedToAnaesthetist')).toHaveLength(1)
    expect(Object.keys(api.getState().notifications)).toEqual([])
  })

  it('offers the acceptance beat only after Souter sets Fri 31 AM available herself; no trigger sets it', () => {
    const api = createAppStore()
    const t = byId(PWA)
    const ctx = ctxFor('/mobile/lists')
    const slotBefore = api.getState().schedule.slots['S-34821-2026-07-31-AM']
    expect(t.choices!(api.getState(), ctx).map((c) => c.id)).not.toContain('BK0162')
    t.run(api, ctx, 'BK0140')
    expect(api.getState().schedule.slots['S-34821-2026-07-31-AM']).toEqual(slotBefore)
    expect(t.disabledReason(api.getState(), ctx)).toBe('No colleague Booking fits a session you are free in. Set a session available first.')
    expect(setAvailabilityRange(api, SOUTER_ACTOR, { anaesthetistId: '34821', fromISO: '2026-07-31', toISO: '2026-07-31', sessions: 'AM', statusKey: 'free' }).ok).toBe(true)
    expect(t.choices!(api.getState(), ctx).map((c) => c.id)).toEqual(['BK0162'])
    expect(t.run(api, ctx, 'BK0162').ok).toBe(true)
    expect(api.getState().schedule.lists[api.getState().schedule.bookings['BK0162']!.listId]?.anaesthetistId).toBe('34821')
  })
})

describe('sample warnings (catch-up Phase 15a)', () => {
  const [AM_TARGET] = SEED_WARNING_SAMPLE_BOOKINGS.targets
  const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId
  const rileyPath = `/mobile/lists/${SEED_LIST_IDS.prepaymentUnpaidList}/bookings/${RILEY}`

  it('show on Admin Day, Admin Booking detail and the mobile Booking, on both surfaces there, and nowhere else', () => {
    const api = createAppStore()
    for (const path of ['/admin/day/2026-07-24', `/admin/day/2026-07-21/bookings/${AM_TARGET}`]) {
      expect(ids(api, path, 'bar')).toEqual(expect.arrayContaining(['raise-sample-warnings', 'clear-sample-warnings']))
    }
    const mobile = `/mobile/lists/${SEED_LIST_IDS.rutherfordAm21}/bookings/${AM_TARGET}`
    for (const surface of ['bar', 'pwa'] as const) {
      expect(ids(api, mobile, surface)).toEqual(expect.arrayContaining(['raise-sample-warnings', 'clear-sample-warnings']))
    }
    for (const path of ['/admin/review', '/admin/billing', '/mobile/lists', `/mobile/lists/${SEED_LIST_IDS.rutherfordAm21}`, '/web/dashboard']) {
      expect(ids(api, path, 'bar')).not.toContain('raise-sample-warnings')
    }
  })

  it('"Office clears this warning" is PWA only, on the mobile Booking, badged as the office stand-in', () => {
    const api = createAppStore()
    const t = byId('office-clears-warning')
    expect(t.surfaces).toEqual(['pwa'])
    expect(t.badge).toBe('office-stand-in')
    expect(ids(api, rileyPath, 'bar')).not.toContain('office-clears-warning')
    expect(ids(api, rileyPath, 'pwa')).toContain('office-clears-warning')
    expect(ids(api, `/admin/day/2026-07-24/bookings/${RILEY}`, 'bar')).not.toContain('office-clears-warning')
  })

  it('raise then clear on the Day view: disabled states, seed values back, no clearance left', () => {
    const api = createAppStore()
    const raise = byId('raise-sample-warnings')
    const clear = byId('clear-sample-warnings')
    const day = ctxFor('/admin/day/2026-07-21')
    expect(clear.disabledReason(api.getState(), day)).toBe('Nothing staged')
    expect(raise.disabledReason(api.getState(), day)).toBeNull()
    const before = proceduresForBooking(api.getState(), AM_TARGET!)[0]!
    const res = raise.run(api, day)
    expect(res.ok).toBe(true)
    expect(res.message).toContain('Raised 8 sample warnings')
    expect(res.message).toContain('patient balance')
    expect(res.message).toContain('6 rules registered')
    // multiWarning (catch-up Phase 19): the prepayment sample and the base-units sample, each with its own text; (catch-up Phase 40) the balance sample.
    const multi = warningsForBooking(api.getState(), SEED_WARNING_SAMPLE_BOOKINGS.multiWarning)
    expect(multi.map((w) => w.ruleId).sort()).toEqual(['baseUnitsOutsideGuide', 'patientBalance', 'prepaymentUnpaid'])
    expect(multi.find((w) => w.ruleId === 'baseUnitsOutsideGuide')).toMatchObject({ kind: 'afterProcedure', strength: 'mild' })
    expect(raise.disabledReason(api.getState(), day)).toBe('Samples already raised')
    expect(clear.disabledReason(api.getState(), day)).toBeNull()
    const key = warningsForBooking(api.getState(), AM_TARGET!)[0]!.key
    clearWarning(api, OFFICE_ACTOR, AM_TARGET!, key)
    expect(clear.run(api, day).ok).toBe(true)
    expect(proceduresForBooking(api.getState(), AM_TARGET!)[0]).toEqual(before)
    expect(api.getState().schedule.warningClearances[key]).toBeUndefined()
    expect(clear.disabledReason(api.getState(), day)).toBe('Nothing staged')
  })

  it('on a Booking: Riley already carries the prepayment one, so takes only the base-units sample; an unknown Booking is not seeded', () => {
    const api = createAppStore()
    const raise = byId('raise-sample-warnings')
    const riley = ctxFor(rileyPath, { listId: SEED_LIST_IDS.prepaymentUnpaidList, bookingId: RILEY })
    expect(raise.disabledReason(api.getState(), riley)).toBeNull()
    expect(raise.run(api, riley).ok).toBe(true)
    expect(raise.disabledReason(api.getState(), riley)).toBe('Samples already raised')
    expect(raise.disabledReason(api.getState(), ctxFor('/admin/day/2026-07-21/bookings/BK9999', { bookingId: 'BK9999' }))).toBe(
      'Samples stage on seeded Bookings only',
    )
  })

  it('the PWA stand-in clears as the simulated office, then disables', () => {
    const api = createAppStore()
    const t = byId('office-clears-warning')
    const ctx = ctxFor(rileyPath, { listId: SEED_LIST_IDS.prepaymentUnpaidList, bookingId: RILEY })
    const choice = initialChoice(t, api.getState(), ctx)
    // Catch-up Phase 27: one warning per payer group, keyed by the payer's identity.
    expect(choice).toBe(`${RILEY}:prepaymentUnpaid:patient:PT0017`)
    expect(t.disabledReason(api.getState(), ctx, choice)).toBeNull()
    expect(t.run(api, ctx, choice).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'booking.warningCleared', who: 'AA office (simulated)' })
    expect(t.disabledReason(api.getState(), ctx)).toBe('No open warnings on this Booking')
    const none = ctxFor('/mobile/lists/L/bookings/X', { bookingId: AM_TARGET! })
    expect(t.disabledReason(api.getState(), none)).toBe('No open warnings on this Booking')
  })
})

describe('Photo capture (Future scope) (catch-up Phase 15b)', () => {
  const OPEN_LIST = SEED_LIST_IDS.souterPm21

  beforeEach(() => {
    useDemoTriggerMemory.getState().clearPhotoCaptureRequest()
  })

  it('shows only on the mobile List screen, on both surfaces, badged Future scope', () => {
    const api = createAppStore()
    const t = byId('photo-capture-future')
    expect(t.badge).toBe('future-scope')
    expect(ids(api, `/mobile/lists/${OPEN_LIST}`, 'bar')).toContain('photo-capture-future')
    expect(ids(api, `/mobile/lists/${OPEN_LIST}`, 'pwa')).toContain('photo-capture-future')
    for (const path of ['/mobile/lists', `/mobile/lists/${OPEN_LIST}/bookings/BK0009`, `/web/lists/${OPEN_LIST}`, '/admin/day/2026-07-21', '/mobile/more']) {
      expect(ids(api, path, 'bar'), path).not.toContain('photo-capture-future')
      expect(ids(api, path, 'pwa'), path).not.toContain('photo-capture-future')
    }
    expect(t.indexPath(api.getState())).toBe(`/mobile/lists/${OPEN_LIST}`)
  })

  it('is disabled on a List no longer open for new Bookings, and on a stale id', () => {
    const api = createAppStore()
    const t = byId('photo-capture-future')
    const submitted = SEED_MARKERS['submittedListMorrison']!.entityId
    expect(api.getState().schedule.lists[submitted]?.state).toBe('SUBMITTED')
    expect(t.disabledReason(api.getState(), ctxFor(`/mobile/lists/${OPEN_LIST}`, { listId: OPEN_LIST }))).toBeNull()
    expect(t.disabledReason(api.getState(), ctxFor(`/mobile/lists/${submitted}`, { listId: submitted }))).toBe(
      'This List is no longer open for new Bookings',
    )
    expect(authoriseList(api, OFFICE_ACTOR, submitted).ok).toBe(true)
    expect(t.disabledReason(api.getState(), ctxFor(`/mobile/lists/${submitted}`, { listId: submitted }))).toBe(
      'This List is no longer open for new Bookings',
    )
    expect(t.disabledReason(api.getState(), ctxFor('/mobile/lists/L-gone', { listId: 'L-gone' }))).toBe('List not found')
  })

  it('run only leaves a UI request for the List in the URL; a repeat request counts up', () => {
    const api = createAppStore()
    const t = byId('photo-capture-future')
    const before = JSON.stringify(api.getState())
    const ctx = ctxFor(`/mobile/lists/${OPEN_LIST}`, { listId: OPEN_LIST })
    const res = t.run(api, ctx)
    expect(res.ok).toBe(true)
    expect(JSON.stringify(api.getState())).toBe(before)
    const first = useDemoTriggerMemory.getState().photoCaptureRequest
    expect(first?.listId).toBe(OPEN_LIST)
    useDemoTriggerMemory.getState().clearPhotoCaptureRequest()
    t.run(api, ctx)
    expect(useDemoTriggerMemory.getState().photoCaptureRequest?.n).toBeGreaterThan(first!.n)
  })
})

describe('AA fee entries (catch-up Phase 16)', () => {
  const FEE = '/admin/billing/aa-fees'

  it('show only on their screens, bar only', () => {
    const api = createAppStore()
    expect(ids(api, FEE)).toEqual(['run-scheduled-fee-run', 'seed-month-of-bctis'])
    expect(ids(api, `${FEE}/settings`)).toEqual([])
    expect(ids(api, '/admin/billing')).not.toContain('run-scheduled-fee-run')
    for (const id of ['run-scheduled-fee-run', 'seed-month-of-bctis', 'record-fee-payment']) {
      expect(byId(id).surfaces).toEqual(['bar'])
    }
    // The PWA sheet lists none of them.
    expect(ids(api, '/mobile/balances', 'pwa')).toEqual(['pwa-office-runs-payables', 'pwa-payment-full', 'pwa-payment-half'])
  })

  it('"Record fee payment" shows on a fee pair only, and the payment webhook triggers never do', () => {
    const api = createAppStore()
    const fee = Object.values(api.getState().billing.aaFeeInvoices).find((f) => f.invoiceNumber === 'AA-FEE-2026-H02')!
    // (catch-up Phase 36: the fee's ACCREC id lives on its `aaFee` ledger pair.)
    const feeAccRecId = api.getState().billing.ledger[fee.ledgerPairId]!.receivable.xeroAccRecId!
    const feePath = `/demo/xero/invoices/${feeAccRecId}`
    expect(ids(api, feePath)).toContain('record-fee-payment')
    for (const id of ['payment-full', 'payment-half', 'payment-replay']) expect(ids(api, feePath)).not.toContain(id)
    const procedurePath = '/demo/xero/invoices/XRH01'
    expect(ids(api, procedurePath)).not.toContain('record-fee-payment')
    expect(ids(api, procedurePath)).toContain('payment-full')

    const t = byId('record-fee-payment')
    const ctx = ctxFor(feePath, { accRecId: feeAccRecId })
    expect(t.indexPath(api.getState())).toBe(feePath)
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx).message).toMatch(/^AA-FEE-2026-H02 paid: \$[\d,.]+ received into AA's own account\.$/)
    expect(t.disabledReason(api.getState(), ctx)).toBe('Already paid')
    expect(t.indexPath(api.getState())).toBeNull()
  })

  it('"Seed a month of BCTIs" then the run gives Dr Rutherford exactly $700.00 before GST ($805.00 with GST)', () => {
    const api = createAppStore()
    const seed = byId('seed-month-of-bctis')
    const run = byId('run-scheduled-fee-run')
    const ctx = ctxFor(FEE, {}, { 'aaFees.month': '2026-07' })
    expect(seed.disabledReason(api.getState(), ctx)).toBeNull()
    expect(seed.run(api, ctx).message).toMatch(/now has 40 paid in July 2026\. At the current settings his fee is \$700\.00 before GST/)
    expect(seed.disabledReason(api.getState(), ctx)).toBe('Already 40 BCTIs paid in July 2026')

    expect(run.disabledReason(api.getState(), ctx)).toBeNull()
    expect(run.run(api, ctx).ok).toBe(true)
    const rutherford = Object.values(api.getState().billing.aaFeeInvoices).find((f) => f.anaesthetistId === '29104' && f.monthISO === '2026-07')!
    expect([rutherford.bctiCount, rutherford.subtotal, rutherford.gst, rutherford.total]).toEqual([40, 700, 105, 805])
    expect(new Set(rutherford.bctis.map((b) => b.accPayId)).size).toBe(40)
    expect(rutherford.bctis.every((b) => b.receivablePaidAtISO?.startsWith('2026-07'))).toBe(true)
    expect(rutherford.raisedBy).toBe('scheduled')
    expect(run.disabledReason(api.getState(), ctx)).toBe('Every active anaesthetist already has a fee invoice for July 2026.')
    expect(seed.disabledReason(api.getState(), ctx)).toBe('Already invoiced for July 2026')
  })

  it('the seeded BCTIs add nothing to Outstanding or the payables run, and no List from 7 July on', () => {
    const api = createAppStore()
    const openBefore = openAccRecs(api.getState()).length
    byId('seed-month-of-bctis').run(api, ctxFor(FEE))
    const s = api.getState()
    expect(openAccRecs(s).length).toBe(openBefore)
    const added = Object.values(s.schedule.lists).filter((l) => l.id.startsWith('L-RB-'))
    expect(added).toHaveLength(8)
    expect(added.every((l) => l.anaesthetistId === '29104' && l.dateISO < '2026-07-07' && l.state === 'AUTHORISED')).toBe(true)
    const pays = Object.values(s.xero.accPays).filter((p) => p.id.startsWith('XPRB'))
    expect(pays.every((p) => p.amountDisbursed === p.amountPayable && p.status === 'paid')).toBe(true)
  })

  it('the run trigger reads the month in the picker and refuses a future one', () => {
    const api = createAppStore()
    const run = byId('run-scheduled-fee-run')
    expect(run.disabledReason(api.getState(), ctxFor(FEE, {}, { 'aaFees.month': '2026-08' }))).toBe('August 2026 has not started yet.')
    expect(run.run(api, ctxFor(FEE, {}, { 'aaFees.month': '2026-06' })).message).toMatch(/for June 2026/)
  })
})

describe('Regenerate from locked data (catch-up Phase 25)', () => {
  it('shows only on an Admin invoice; disabled with its reason on pre-payment and AA fee invoices; identical on S3 invoices', () => {
    const api = createAppStore()
    wireBillingRun(api)
    expect(authoriseList(api, { who: 'Kirsty W.', role: 'office', source: 'office' }, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
    const t = byId('regenerate-invoice')
    const s3 = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'standard' && api.getState().schedule.bookings[i.bookingId]?.listId === SEED_LIST_IDS.souterMon20Am)!
    expect(ids(api, `/admin/invoices/${s3.id}`)).toContain('regenerate-invoice')
    expect(ids(api, '/admin/billing')).not.toContain('regenerate-invoice')
    expect(ids(api, '/admin/invoices')).not.toContain('regenerate-invoice')
    const ctx = ctxFor(`/admin/invoices/${s3.id}`, { invoiceId: s3.id })
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    const res = t.run(api, ctx)
    expect(res.ok).toBe(true)
    expect(res.message).toMatch(/^Regenerated from locked data: identical/)
    expect(useDemoTriggerMemory.getState().regenerated[s3.id]?.ok).toBe(true)
    const prepayment = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'prePayment')!
    expect(t.disabledReason(api.getState(), ctxFor(`/admin/invoices/${prepayment.id}`, { invoiceId: prepayment.id }))).toBe('Raised at setup, before the lock')
    const fee = Object.keys(api.getState().billing.aaFeeInvoices)[0]!
    expect(t.disabledReason(api.getState(), ctxFor(`/admin/invoices/${fee}`, { invoiceId: fee }))).toBe('Not priced from a Procedure')
  })
})

describe('prepayment entries (catch-up Phase 27)', () => {
  const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
  const rileyList = (api: BoundAppStore) => api.getState().schedule.bookings[RILEY]!.listId
  const adminBooking = `/admin/day/2026-07-24/bookings/${RILEY}`

  it('show on their routes only', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/day/2026-07-21')).toEqual(expect.arrayContaining(['prepayment-two-days-before', 'add-prepaid-booking']))
    expect(ids(api, adminBooking)).toEqual(expect.arrayContaining(['prepayment-two-days-before', 'add-prepaid-booking', 'payment-full', 'payment-half']))
    const mobile = `/mobile/lists/${rileyList(api)}/bookings/${RILEY}`
    expect(ids(api, mobile, 'pwa')).toEqual(expect.arrayContaining(['prepayment-two-days-before', 'pwa-office-approves-prepayment', 'pwa-payment-full', 'pwa-payment-half']))
    expect(ids(api, mobile, 'bar')).not.toContain('pwa-office-approves-prepayment')
    expect(ids(api, '/admin/invoices')).not.toContain('add-prepaid-booking')
  })

  it('give their disabled reasons', () => {
    const api = createAppStore()
    const ctx = ctxFor(adminBooking, { dateISO: '2026-07-24', bookingId: RILEY })
    // Riley awaits approval: no payment yet.
    expect(byId('payment-half').disabledReason(api.getState(), ctx)).toBe('Not approved yet')
    expect(byId('prepayment-two-days-before').disabledReason(api.getState(), ctx)).toBeNull()
    const mobileCtx = ctxFor(`/mobile/lists/${rileyList(api)}/bookings/${RILEY}`, { listId: rileyList(api), bookingId: RILEY })
    expect(byId('pwa-payment-half').disabledReason(api.getState(), mobileCtx)).toBe('No sent pre-payment invoice yet')
    expect(byId('pwa-office-approves-prepayment').disabledReason(api.getState(), mobileCtx)).toBeNull()
    // The stand-in approves; then it reads "Already sent" and the payment opens.
    expect(byId('pwa-office-approves-prepayment').run(api, mobileCtx).ok).toBe(true)
    expect(byId('pwa-office-approves-prepayment').disabledReason(api.getState(), mobileCtx)).toBe('Already sent')
    expect(byId('pwa-payment-half').disabledReason(api.getState(), mobileCtx)).toBeNull()
    const paid = byId('pwa-payment-half').run(api, mobileCtx)
    expect(paid.ok).toBe(true)
    expect(paid.message).toContain('$690.00')
  })

  it('the clock jump never rewinds; add-prepaid-booking refuses a second run', () => {
    const api = createAppStore()
    const day = ctxFor('/admin/day/2026-07-21', { dateISO: '2026-07-21' })
    const jump = byId('prepayment-two-days-before')
    const first = jump.choices!(api.getState(), day)[0]!.id
    expect(jump.run(api, day, first).ok).toBe(true)
    expect(jump.disabledReason(api.getState(), day, first)).toBe('Already 2 days or less before')
    const add = byId('add-prepaid-booking')
    expect(add.run(api, day, 'two-payers').ok).toBe(true)
    expect(add.disabledReason(api.getState(), day)).toBe('Already added (Reset to repeat)')
  })
})

describe('Office sets this session to Public (catch-up Phase 32d; PWA parity)', () => {
  const SOUTER = '34821'
  const path = '/mobile/availability/calendar'
  const day = (dateISO: string): Partial<DemoContextValues> => ({ 'mobileCalendar.day': `${SOUTER}|${dateISO}` })

  it('shows on the PWA only, with a day open in My calendar', () => {
    const api = createAppStore()
    expect(ids(api, path, 'pwa')).not.toContain('availability-office-sets-public')
    expect(ids(api, path, 'pwa', day('2026-08-21'))).toContain('availability-office-sets-public')
    expect(ids(api, path, 'bar', day('2026-08-21'))).not.toContain('availability-office-sets-public')
  })

  it('sets the session Public with the note "CPH" as the simulated office, then is disabled; a List or a past day disables it', () => {
    const api = createAppStore()
    const t = byId('availability-office-sets-public')
    const ctx = ctxFor(path, {}, day('2026-08-21'))
    const am = `S-${SOUTER}-2026-08-21-AM`
    expect(t.disabledReason(api.getState(), ctx, am)).toBeNull()
    const out = t.run(api, ctx, am)
    expect(out).toEqual({ ok: true, message: 'The office set this session to Public · CPH.' })
    expect(api.getState().schedule.slots[am]).toMatchObject({ status: 'publicHospital', note: 'CPH' })
    expect(api.getState().audit.at(-1)).toMatchObject({ role: 'office', who: 'AA office (simulated)' })
    expect(t.disabledReason(api.getState(), ctx, am)).toBe('Already Public')
    expect(t.disabledReason(api.getState(), ctxFor(path, {}, day('2026-08-17')), `S-${SOUTER}-2026-08-17-AM`)).toBe('This session holds a List')
    expect(t.disabledReason(api.getState(), ctxFor(path, {}, day('2026-07-20')), `S-${SOUTER}-2026-07-20-AM`)).toBe('This session is past')
  })
})

describe('the Ledger triggers (catch-up Phase 36)', () => {
  it('Inject unmatched receipt shows only on the Ledger, both scopes', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/ledger')).toContain('inject-unmatched-receipt')
    expect(ids(api, '/admin/ledger/anaesthetists/34821')).toContain('inject-unmatched-receipt')
    expect(ids(api, '/admin/billing')).not.toContain('inject-unmatched-receipt')
    expect(ids(api, '/admin/ledger')).toEqual(expect.arrayContaining(['payment-full', 'payment-half', 'arm-handoff-fault', 'run-archive-job']))
  })

  it('names Dr Souter by default: one held receipt attributed to her; a second press is disabled until it is cleared', () => {
    const api = createAppStore()
    const t = byId('inject-unmatched-receipt')
    const ctx = ctxFor('/admin/ledger')
    expect(initialChoice(t, api.getState(), ctx)).toBe('souter')
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx, 'souter').ok).toBe(true)
    const held = Object.values(api.getState().billing.unmatchedReceipts)
    expect(held.map((u) => [u.amount, u.reference, u.anaesthetistId, u.status, u.idempotencyKey])).toEqual([[120, 'Bank deposit · SOUTER JULY', '34821', 'held', 'UNMATCHED-DEMO-1']])
    expect(t.disabledReason(api.getState(), ctx)).toBe('Resolve the held receipt first')
  })

  it('"Names no one" holds an unattributed receipt', () => {
    const api = createAppStore()
    expect(byId('inject-unmatched-receipt').run(api, ctxFor('/admin/ledger'), 'none').ok).toBe(true)
    const [u] = Object.values(api.getState().billing.unmatchedReceipts)
    expect([u?.reference, u?.anaesthetistId]).toEqual(['Bank deposit · JULY', undefined])
  })

  it('a payment on the Ledger lands in the ledger first, then Xero, on the chosen open receivable', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      authoriseList(api, OFFICE_ACTOR, projectedListId('34821', '2026-07-20', 'AM'))
    } finally {
      unwire()
    }
    const t = byId('payment-half')
    const ctx = ctxFor('/admin/ledger')
    const choices = t.choices!(api.getState(), ctx)
    expect(choices.length).toBe(openAccRecs(api.getState()).length)
    const accRecId = choices[0]!.id
    expect(t.run(api, ctx, accRecId).ok).toBe(true)
    const pair = Object.values(api.getState().billing.ledger).find((p) => p.receivable.xeroAccRecId === accRecId)!
    expect(pair.receivable.receivedAmount).toBe(api.getState().xero.accRecs[accRecId]!.amountReceived)
  })

  it('the PWA stand-in pays out only what is due to Dr Souter, and is disabled when nothing is', () => {
    const api = createAppStore()
    const t = byId('pwa-office-runs-payables')
    const ctx = ctxFor('/mobile/balances')
    expect(ids(api, '/mobile/balances', 'pwa')).toContain('pwa-office-runs-payables')
    expect(ids(api, '/mobile/balances', 'bar')).not.toContain('pwa-office-runs-payables')
    expect(t.disabledReason(api.getState(), ctx)).toBe('Nothing due to pay out')
    const unwire = wireBillingRun(api)
    try {
      authoriseList(api, OFFICE_ACTOR, projectedListId('34821', '2026-07-20', 'AM'))
    } finally {
      unwire()
    }
    const pay = byId('pwa-payment-half')
    const choice = pay.choices!(api.getState(), ctx)[0]!.id
    expect(pay.run(api, ctx, choice).ok).toBe(true)
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    const out = t.run(api, ctx)
    expect(out.ok).toBe(true)
    expect(out.message).toContain('to Dr Souter')
    expect(out.message).toContain('it leaves Outstanding and shows under GST this month')
    expect(t.disabledReason(api.getState(), ctx)).toBe('Nothing due to pay out')
  })
})

describe('the web money screens\' payment entries (catch-up Phase 38)', () => {
  it('show on the bar on Web Dashboard and Accounts only, never on Lists or Availability or the PWA', () => {
    const api = createAppStore()
    for (const path of ['/web', '/web/accounts/outstanding', '/web/accounts/gst']) {
      expect(ids(api, path, 'bar'), path).toEqual(expect.arrayContaining(['web-payment-full', 'web-payment-half']))
      expect(ids(api, path, 'pwa'), path).not.toContain('web-payment-full')
    }
    for (const path of ['/web/lists', '/web/availability']) expect(ids(api, path, 'bar'), path).not.toContain('web-payment-full')
    expect(byId('web-payment-full').surfaces).toEqual(['bar'])
  })

  it("offer only the persona's invoices that reach her position, and say where the money goes next", () => {
    const api = createAppStore()
    wireBillingRun(api)
    const t = byId('web-payment-full')
    const ctx = ctxFor('/web/accounts/outstanding', { subTab: 'outstanding' })
    expect(t.disabledReason(api.getState(), ctx, initialChoice(t, api.getState(), ctx))).toBe('No open invoices yet')
    authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Am)
    authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Pm)
    const choices = t.choices?.(api.getState(), ctx) ?? []
    const offered = new Set(choices.map((c) => c.id))
    const souters = openAccRecs(api.getState()).filter((c) => {
      const pair = Object.values(api.getState().billing.ledger).find((p) => p.receivable.xeroAccRecId === c.accRecId)
      return pair !== undefined && 'anaesthetistId' in pair && pair.anaesthetistId === SOUTER_ACTOR.anaesthetistId
    })
    expect(offered.size).toBeGreaterThan(0)
    expect([...offered].sort()).toEqual(souters.map((c) => c.accRecId).sort())
    const out = t.run(api, ctx, choices[0]!.id)
    expect(out.ok).toBe(true)
    expect(out.message).toMatch(/^Payment received\. It reaches the GST report when AA pays the anaesthetist\./)
  })
})

describe('Phase 43 entries (scale and privacy)', () => {
  const byId = (id: string) => DEMO_TRIGGERS.find((t) => t.id === id)!

  it('Load full-scale data sits on the Day view and Invoices, bar only, with a confirm line', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/day/2026-07-21')).toContain('load-full-scale')
    expect(ids(api, '/admin/invoices')).toContain('load-full-scale')
    expect(ids(api, '/admin/billing')).not.toContain('load-full-scale')
    expect(ids(api, '/mobile/lists', 'pwa')).not.toContain('load-full-scale')
    expect(byId('load-full-scale').confirm).toBe('Replaces the current demo data. Reset returns to it.')
    expect(byId('load-full-scale').disabledReason(api.getState(), ctxFor('/admin/invoices'))).toBeNull()
  })

  it('Scan for NHI leaks sits on the Data inspector, offers a planted choice, and stores its report', () => {
    const api = createAppStore()
    expect(ids(api, '/demo/data')).toContain('scan-nhi-leaks')
    const t = byId('scan-nhi-leaks')
    const out = t.run(api, ctxFor('/demo/data'), 'planted')
    expect(out.ok).toBe(true)
    expect(useDemoTriggerMemory.getState().nhiScan?.planted).toBe(true)
    expect(out.message).toMatch(/^Scanned 3 areas and [\d,]+ items in \d+ ms\. One hit found, the planted test line\.$/)
  })

  it('View raw row as another role: acts on the selected row, else the oldest row needing resolving; refuses and audits', () => {
    const api = createAppStore()
    const t = byId('matching-raw-row-other-role')
    // With no row selected it falls back to the seeded row waiting for its NHI.
    expect(t.disabledReason(api.getState(), ctxFor('/admin/intake/matching'))).toBeNull()
    const published = { 'matching.selectedRowId': 'IRS001' }
    expect(ids(api, '/admin/intake/matching', 'bar', published)).toContain(t.id)
    expect(t.disabledReason(api.getState(), ctxFor('/admin/intake/matching', {}, published))).toBeNull()
    const before = api.getState().audit.length
    const out = t.run(api, ctxFor('/admin/intake/matching', {}, published), 'souter')
    expect(out).toEqual({ ok: true, message: 'Refused: only office staff can view a raw hospital row. The attempt is in the audit trail.' })
    expect(api.getState().audit.slice(before).map((e) => e.action)).toEqual(['importRow.rawViewDenied'])
  })
})

describe('credit entries (catch-up Phase 39 session 2)', () => {
  const MOBILE_HBK03 = '/mobile/lists/L-HIST-03/bookings/HBK03'
  const hbk03 = () => ctxFor(MOBILE_HBK03, { listId: 'L-HIST-03', bookingId: 'HBK03' })
  const credit = (api: BoundAppStore, actor: typeof OFFICE_ACTOR, invoiceId: string, replacements: CreditReplacementInput[] = []) => {
    const out = submitCredit(api, actor, { invoiceId, reason: 'Less work than expected', cause: 'correction', replacements })
    if (!out.ok) throw new Error(out.message)
    return out.value
  }
  const runPostOp = (api: BoundAppStore) => expect(byId('stage-post-op').run(api, ctxFor(`/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, { listId: POST_OP_ORIGINAL_LIST_ID })).ok).toBe(true)

  it('register on their screens and surfaces only', () => {
    const api = createAppStore()
    expect(byId('stage-combined-procedure').surfaces).toEqual(['bar'])
    expect(byId('stage-refund-after-payout').surfaces).toEqual(['bar'])
    expect(byId('office-reviews-credit')).toMatchObject({ surfaces: ['pwa'], badge: 'office-stand-in' })
    expect(ids(api, '/admin/invoices')).toContain('stage-combined-procedure')
    expect(ids(api, '/admin/invoices/INV0001')).not.toContain('stage-combined-procedure')
    expect(ids(api, '/admin/billing')).toEqual(expect.arrayContaining(['stage-refund-after-payout', 'run-next-billing-run']))
    expect(ids(api, '/admin/invoices/INV0001')).toContain('stage-refund-after-payout')
    expect(ids(api, '/admin/invoices')).not.toContain('stage-refund-after-payout')
    expect(ids(api, MOBILE_HBK03, 'pwa')).toEqual(expect.arrayContaining(['office-reviews-credit', 'office-reviews-additional-invoice']))
    expect(ids(api, MOBILE_HBK03, 'bar')).not.toContain('office-reviews-credit')
    for (const id of ['stage-combined-procedure', 'stage-refund-after-payout']) {
      expect(ids(api, MOBILE_HBK03, 'pwa')).not.toContain(id)
    }
  })

  it('"Stage refund after payout" is listed in the Control Panel index under the Billing monitor and Admin · Invoice, the groups in registry order (Phase 39 review)', () => {
    const groups = groupTriggersByScreen(DEMO_TRIGGERS)
    const under = (screen: string) => groups.find((g) => g.screen === screen)?.entries.map((t) => t.id) ?? []
    expect(under(BILLING_MONITOR_SCREEN)).toContain('stage-refund-after-payout')
    expect(under('Admin · Invoice')).toEqual(expect.arrayContaining(['regenerate-invoice', 'stage-refund-after-payout']))
    // Every entry under its own screen, in registry order: the groups keep the order a plain grouping by `screen` gives.
    const plain: string[] = []
    for (const t of DEMO_TRIGGERS) if (!plain.includes(t.screen)) plain.push(t.screen)
    expect(groups.map((g) => g.screen)).toEqual(plain)
    expect(groups.reduce((n, g) => n + g.entries.length, 0)).toBe(DEMO_TRIGGERS.length + DEMO_TRIGGERS.reduce((n, t) => n + (t.alsoScreens?.length ?? 0), 0))
  })

  it('"Stage combined procedure" bills a Merivale combination once, links its invoice, then reads "Already staged"', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const t = byId('stage-combined-procedure')
    const ctx = ctxFor('/admin/invoices')
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    const out = t.run(api, ctx)
    unwire()
    expect(out.ok).toBe(true)
    expect(out.message).toBe('Staged: a billed Merivale combination. Open its invoice and use Split into additional invoices.')
    expect(out.link?.label).toMatch(/^Open AA-2026-\d{4}$/)
    const invoiceId = out.link!.to.split('/').pop()!
    expect(api.getState().billing.invoices[invoiceId]).toMatchObject({ kind: 'standard', total: 4255 })
    expect(t.indexPath(api.getState())).toBe(`/admin/invoices/${invoiceId}`)
    expect(t.disabledReason(api.getState(), ctx)).toBe('Already staged')
  })

  it('"Stage refund after payout": its disabled reasons, then paid in full and paid out to Dr Sharma', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const t = byId('stage-refund-after-payout')
    const monitor = ctxFor('/admin/billing')
    expect(t.disabledReason(api.getState(), monitor)).toBe('Stage post-op scenario first')
    expect(t.disabledReason(api.getState(), ctxFor('/admin/invoices/INV0001', { invoiceId: 'INV0001' }))).toBe('AA fee and prepayment invoices are not credited here')
    runPostOp(api)
    expect(t.disabledReason(api.getState(), monitor)).toBeNull()
    const out = t.run(api, monitor)
    unwire()
    expect(out).toMatchObject({ ok: true, message: "Paid in full, approved for payment and paid out to Dr Sharma in Xero. Credit it to see the negative invoice. Once credited, the negative invoice is netted in Dr Sharma's next payment run." })
    // The payout went through a one-line staged run the office approved (no back door).
    expect(Object.values(api.getState().billing.payablesRuns).filter((r) => r.kind === 'staged')).toEqual([expect.objectContaining({ status: 'paid', cycleId: '2026-W30' })])
    const invoiceId = out.link!.to.split('/').pop()!
    expect(t.disabledReason(api.getState(), monitor)).toBe('Already paid out')
    expect(t.disabledReason(api.getState(), ctxFor(`/admin/invoices/${invoiceId}`, { invoiceId }))).toBe('Already paid out')
  })

  it('"Stage refund after payout" reads "Credit waiting for review" then "Invoice credited"; the payment entries read "Invoice credited" and the PWA choices drop the credited ACCREC', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    runPostOp(api)
    const t = byId('stage-refund-after-payout')
    const original = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'standard' && i.bookingId === api.getState().schedule.bookings[Object.values(api.getState().schedule.bookings).find((b) => b.listId === POST_OP_ORIGINAL_LIST_ID)!.id]!.id)!
    const ctx = ctxFor(`/admin/invoices/${original.id}`, { invoiceId: original.id })
    const { creditEventId } = credit(api, OFFICE_ACTOR, original.id)
    expect(t.disabledReason(api.getState(), ctx)).toBe('Credit waiting for review')
    expect(approveProcedureEvent(api, OFFICE_ACTOR, creditEventId).ok).toBe(true)
    const runOut = byId('run-next-billing-run').run(api, ctxFor('/admin/billing'))
    expect(runOut.message).toMatch(/^Billing run done: 1 credit note raised \(CN-2026-0001\)\.$/)
    unwire()
    expect(t.disabledReason(api.getState(), ctx)).toBe('Invoice credited')
    expect(byId('payment-full').disabledReason(api.getState(), ctx)).toBe('Invoice credited')
    const accRecId = Object.values(api.getState().xero.accRecs).find((r) => r.invoiceId === original.id)!.id
    expect(byId('payment-half').disabledReason(api.getState(), ctxFor(`/demo/xero/invoices/${accRecId}`, { accRecId }))).toBe('Invoice credited')
    expect(openAccRecs(api.getState()).some((c) => c.accRecId === accRecId)).toBe(false)
  })

  it('"Run the next billing run" counts a correction: the credit note and its new invoice', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const { creditEventId } = credit(api, OFFICE_ACTOR, 'HINV03', [{ occurredOnISO: '2026-07-21', party: { sameAs: true }, lines: [{ description: 'Shorter case', quantity: 1, unitAmount: 400 }] }])
    expect(approveProcedureEvent(api, OFFICE_ACTOR, creditEventId).ok).toBe(true)
    const out = byId('run-next-billing-run').run(api, ctxFor('/admin/billing'))
    unwire()
    expect(out.message).toMatch(/^Billing run done: 1 credit note and 1 additional invoice raised \(CN-2026-0001, AA-2026-\d{4}\)\.$/)
  })

  it('"Office reviews this credit" approves and issues the credit on the Booking; "Office reviews this additional invoice" skips it and its replacement', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    const t = byId('office-reviews-credit')
    const additional = byId('office-reviews-additional-invoice')
    expect(t.disabledReason(api.getState(), hbk03())).toBe('No credit on this Booking is awaiting review')
    // The seeded additional invoice first, so only the credit and its replacement wait.
    expect(additional.run(api, hbk03()).ok).toBe(true)
    credit(api, SOUTER_ACTOR, 'HINV03', [{ occurredOnISO: '2026-07-21', party: { sameAs: true }, lines: [{ description: 'Shorter case', quantity: 1, unitAmount: 400 }] }])
    expect(additional.disabledReason(api.getState(), hbk03())).toBe('No event awaiting review or the next run on this Booking')
    expect(t.disabledReason(api.getState(), hbk03())).toBeNull()
    const out = t.run(api, hbk03())
    unwire()
    expect(out).toEqual({ ok: true, message: 'Approved by the office and issued in the next billing run (CN-2026-0001).' })
    expect(t.disabledReason(api.getState(), hbk03())).toBe('No credit on this Booking is awaiting review')
  })
})

describe('Stage longer prepaid procedure (catch-up Phase 41; US-06.4.1)', () => {
  const LIST = SEED_LIST_IDS.prepaymentPaidList
  const at = () => ctxFor(`/admin/review/${LIST}`, { listId: LIST })
  function submitNairList(api: BoundAppStore) {
    for (const b of bookingsForList(api.getState(), LIST)) completeAnswered(api, SOUTER_ACTOR, b.id)
    const out = submitList(api, SOUTER_ACTOR, LIST)
    if (!out.ok) throw new Error(out.message)
  }

  it('shows on Admin Review only, on the bar; disabled until the List is submitted, then runs once', () => {
    const api = createAppStore()
    const t = byId('stage-longer-prepaid-procedure')
    expect(t.surfaces).toEqual(['bar'])
    expect(ids(api, `/admin/review/${LIST}`)).toContain('stage-longer-prepaid-procedure')
    expect(ids(api, '/admin/invoices')).not.toContain('stage-longer-prepaid-procedure')
    expect(t.disabledReason(api.getState(), at())).toBe(LONGER_PREPAID_COPY.submitFirst)
    submitNairList(api)
    expect(t.disabledReason(api.getState(), at())).toBeNull()
    expect(t.choices!(api.getState(), at()).map((c) => c.id)).toEqual(['BK0038'])
    const out = t.run(api, at(), 'BK0038')
    expect(out.ok).toBe(true)
    expect(out.message).toMatch(/^Recorded BTM now \d+ units, for reference only\./)
    const p = api.getState().schedule.procedures[api.getState().billing.invoices['INV0001']!.procedureIds![0]!]!
    expect(Date.parse(p.handoverISO!) - Date.parse(p.anaestheticStartISO!)).toBe(STAGE_LONGER_DURATION_MIN * 60_000)
    expect(t.disabledReason(api.getState(), at())).toBe(LONGER_PREPAID_COPY.alreadyStaged)
  })

  it('a List with no sent prepayment says so', () => {
    const api = createAppStore()
    const other = SEED_LIST_IDS.souterPm21
    const list = api.getState().schedule.lists[other]
    if (list === undefined) return
    expect(byId('stage-longer-prepaid-procedure').disabledReason(api.getState(), ctxFor(`/admin/review/${other}`, { listId: other }))).not.toBeNull()
  })
})

describe('Prepayment settled automatically (catch-up Phase 41 session 2; US-06.5.2, US-06.3.7, US-06.3.6)', () => {
  const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
  const NAIR = SEED_PREPAID_BOOKING_ID
  const adminCtx = (api: BoundAppStore, bookingId: string) => {
    const booking = api.getState().schedule.bookings[bookingId]!
    const dateISO = api.getState().schedule.lists[booking.listId]!.dateISO
    return ctxFor(`/admin/day/${dateISO}/bookings/${bookingId}`, { dateISO, bookingId })
  }
  const mobileCtx = (api: BoundAppStore, bookingId: string) => {
    const listId = api.getState().schedule.bookings[bookingId]!.listId
    return ctxFor(`/mobile/lists/${listId}/bookings/${bookingId}`, { listId, bookingId })
  }
  function approveRiley(api: BoundAppStore) {
    for (const g of prepaymentStatusFor(api.getState(), RILEY).groups) {
      if (g.status !== 'awaitingApproval') continue
      const out = approvePrepayment(api, OFFICE_ACTOR, RILEY, g.payerKey)
      if (!out.ok) throw new Error(out.message)
    }
  }
  const refunds = (api: BoundAppStore) => Object.values(api.getState().billing.prepaymentRefunds)

  it('show on their routes only: the late payment and the Contract change on the Admin Booking (bar), the reminder on the PWA only', () => {
    const api = createAppStore()
    const admin = adminCtx(api, RILEY).pathname
    expect(ids(api, admin)).toEqual(expect.arrayContaining(['prepayment-late-payment', 'prepayment-contract-changed']))
    expect(ids(api, admin, 'pwa')).not.toContain('prepayment-late-payment')
    expect(ids(api, '/admin/invoices')).not.toContain('prepayment-contract-changed')
    const mobile = mobileCtx(api, RILEY).pathname
    expect(byId('pwa-office-sends-prepayment-reminder').surfaces).toEqual(['pwa'])
    expect(byId('pwa-office-sends-prepayment-reminder').badge).toBe('office-stand-in')
    expect(ids(api, mobile, 'pwa')).toContain('pwa-office-sends-prepayment-reminder')
    expect(ids(api, mobile, 'bar')).not.toContain('pwa-office-sends-prepayment-reminder')
    expect(ids(api, admin)).not.toContain('pwa-office-sends-prepayment-reminder')
  })

  it('Payment arrives after the credit note: disabled until a cancelled Booking holds a credited, unpaid prepayment; then refunds exactly one payment', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const t = byId('prepayment-late-payment')
      const ctx = adminCtx(api, RILEY)
      // Live and awaiting approval; then sent but not cancelled.
      expect(t.disabledReason(api.getState(), ctx)).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.lateOnlyCancelled)
      approveRiley(api)
      expect(t.disabledReason(api.getState(), ctx)).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.lateOnlyCancelled)
      // Nair was paid: cancelling refunds her, so a late payment has nothing to land on.
      expect(cancelBooking(api, OFFICE_ACTOR, NAIR, 'Patient withdrew').ok).toBe(true)
      expect(t.disabledReason(api.getState(), adminCtx(api, NAIR))).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.lateOnlyCancelled)
      expect(cancelBooking(api, OFFICE_ACTOR, RILEY, 'Surgery postponed').ok).toBe(true)
      expect(t.disabledReason(api.getState(), ctx)).toBeNull()
      const before = refunds(api).length
      const invoice = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === RILEY && i.kind === 'prePayment')!
      const out = t.run(api, ctx)
      expect(out).toEqual({ ok: true, message: `Late payment of ${formatCurrency(invoice.total)} refunded to the payer.` })
      const late = refunds(api).slice(before)
      expect(late).toEqual([expect.objectContaining({ cause: 'latePayment', amount: invoice.total, prepaymentInvoiceId: invoice.id })])
      expect(t.disabledReason(api.getState(), ctx)).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.lateOnlyCancelled)
      expect(t.run(api, ctx).ok).toBe(false)
      expect(refunds(api)).toHaveLength(before + 1)
    } finally {
      unwire()
    }
  })

  it('Change Contract after prepayment sent: disabled with no sent prepayment; settles once as the office, then is disabled', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const t = byId('prepayment-contract-changed')
      const ctx = adminCtx(api, RILEY)
      expect(t.disabledReason(api.getState(), ctx)).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.noSentPrepayment)
      approveRiley(api)
      expect(t.disabledReason(api.getState(), ctx)).toBeNull()
      const out = t.run(api, ctx)
      expect(out.ok).toBe(true)
      const invoice = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === RILEY && i.kind === 'prePayment')!
      const note = Object.values(api.getState().billing.creditNotes).find((c) => c.originalInvoiceId === invoice.id)!
      expect(note.cause).toBe('prepaidContractChanged')
      expect(out.message).toContain(note.creditNoteNumber)
      // Unpaid: credited only.
      expect(refunds(api)).toEqual([])
      const settled = api.getState().audit.filter((a) => a.action === 'procedure.prepaymentSettled')
      expect(settled).toHaveLength(1)
      expect(settled[0]!.who).toBe(OFFICE_ACTOR.who)
      expect(t.disabledReason(api.getState(), ctx)).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.noSentPrepayment)
      expect(t.run(api, ctx).ok).toBe(false)
      expect(api.getState().audit.filter((a) => a.action === 'procedure.prepaymentSettled')).toHaveLength(1)
      // Nair was paid: the change credits and refunds her in full.
      expect(t.run(api, adminCtx(api, NAIR)).ok).toBe(true)
      expect(refunds(api)).toEqual([expect.objectContaining({ cause: 'contractChanged', amount: 1380 })])
    } finally {
      unwire()
    }
  })

  it('Change Contract after prepayment sent: disabled on an authorised List', () => {
    const api = createAppStore()
    const t = byId('prepayment-contract-changed')
    const listId = api.getState().schedule.bookings[NAIR]!.listId
    for (const b of bookingsForList(api.getState(), listId)) completeAnswered(api, SOUTER_ACTOR, b.id)
    expect(submitList(api, SOUTER_ACTOR, listId).ok).toBe(true)
    const unwire = wireBillingRun(api)
    try {
      expect(authoriseList(api, OFFICE_ACTOR, listId).ok).toBe(true)
    } finally {
      unwire()
    }
    expect(t.disabledReason(api.getState(), adminCtx(api, NAIR))).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.listAuthorised)
  })

  it('Office sends a prepayment reminder: disabled with nothing unpaid or no invoice email; appends one reminder', () => {
    const api = createAppStore()
    const t = byId('pwa-office-sends-prepayment-reminder')
    // Awaiting approval: nothing unpaid yet. Nair is paid in full.
    expect(t.disabledReason(api.getState(), mobileCtx(api, RILEY))).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.noUnpaidPrepayment)
    expect(t.disabledReason(api.getState(), mobileCtx(api, NAIR))).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.noUnpaidPrepayment)
    approveRiley(api)
    const invoice = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === RILEY && i.kind === 'prePayment')!
    // No invoice email for the payer: the reason; then with one, the reminder goes.
    const { delivery: _sent, ...unsent } = invoice
    const withoutEmail = { ...unsent, billedTo: { ...invoice.billedTo!, email: '' } }
    api.setState((s) => ({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoice.id]: withoutEmail } } }))
    expect(t.disabledReason(api.getState(), mobileCtx(api, RILEY))).toBe(PREPAYMENT_SETTLEMENT_DEMO_COPY.noInvoiceEmail)
    api.setState((s) => ({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoice.id]: { ...withoutEmail, billedTo: { ...withoutEmail.billedTo, email: 'annette.riley@example.co.nz' } } } } }))
    expect(t.disabledReason(api.getState(), mobileCtx(api, RILEY))).toBeNull()
    const out = t.run(api, mobileCtx(api, RILEY))
    expect(out).toEqual({ ok: true, message: PREPAYMENT_SETTLEMENT_DEMO_COPY.reminderSent })
    const reminders = api.getState().billing.invoices[invoice.id]!.prepaymentReminders ?? []
    expect(reminders).toHaveLength(1)
    expect(reminders[0]!.by).toBe(OFFICE_SIMULATION_ACTOR.who)
  })
})

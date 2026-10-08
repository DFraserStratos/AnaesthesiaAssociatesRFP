/**
 * The demo-trigger registry (catch-up Phase 14): its shape, its route scoping,
 * and that each re-homed body reproduces what its Control Panel card did.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { wireBillingRun } from '../../store/billingRun'
import { authoriseList } from '../../store/lifecycle'
import { resetDemo } from '../../store/clockActions'
import { bookingsForList, openAccRecs, proceduresForBooking } from '../../store/selectors'
import { clearWarning, warningsForBooking } from '../../store/warnings'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { CONTRACT, SEED_LIST_IDS, SEED_MARKERS, SEED_WARNING_SAMPLE_BOOKINGS } from '../../domain/seed'
import { SURGEON_PDFS } from '../../domain/integrations'
import { DEMO_TRIGGERS, POST_OP_ORIGINAL_LIST_ID } from './registry'
import { demoTriggersFor, initialChoice } from './match'
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

  it('does not register Run payables (the Billing monitor has its own product button)', () => {
    expect(DEMO_TRIGGERS.some((t) => /payables/i.test(t.label))).toBe(false)
  })

  it('every bar entry\'s Open screen link lands where the entry is visible', () => {
    const api = createAppStore()
    const state = api.getState()
    for (const t of DEMO_TRIGGERS) {
      if (!t.surfaces.includes('bar')) continue
      const path = t.indexPath(state)
      if (path === null) continue
      const published: Partial<DemoContextValues> = t.indexHint?.includes('Surgeon PDFs') === true ? { 'integrations.tab': 'pdfs' } : {}
      expect(ids(api, path, 'bar', published), `${t.id} at ${path}`).toContain(t.id)
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

describe('route scoping', () => {
  it('the Billing monitor shows exactly its four entries', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/billing')).toEqual(['billing-failure', 'arm-handoff-fault', 'run-reconciliation-poll', 'run-archive-job'])
  })

  it('the Admin day view shows only the sample-warning entries (catch-up Phase 15a)', () => {
    expect(ids(createAppStore(), '/admin/day/2026-07-21')).toEqual(['raise-sample-warnings', 'clear-sample-warnings'])
  })

  it('Stage post-op shows on Dr Sharma\'s Tue 14 AM review and Booking, and nowhere else', () => {
    const api = createAppStore()
    expect(ids(api, `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`)).toContain('stage-post-op')
    const booking = bookingsForList(api.getState(), POST_OP_ORIGINAL_LIST_ID)[0]
    expect(booking).toBeDefined()
    expect(ids(api, `/admin/day/2026-07-14/bookings/${booking?.id ?? ''}`)).toContain('stage-post-op')
    expect(ids(api, `/admin/review/${SEED_LIST_IDS.souterMon20Am}`)).not.toContain('stage-post-op')
  })

  it('Ingest PDF row shows only on the Surgeon PDFs tab', () => {
    const api = createAppStore()
    expect(ids(api, '/admin/integrations')).not.toContain('ingest-pdf-row')
    expect(ids(api, '/admin/integrations', 'bar', { 'integrations.tab': 'messages' })).not.toContain('ingest-pdf-row')
    expect(ids(api, '/admin/integrations', 'bar', { 'integrations.tab': 'pdfs' })).toContain('ingest-pdf-row')
  })

  it('hospital messages show on the three mobile Lists layers, on both surfaces', () => {
    const api = createAppStore()
    for (const path of ['/mobile/lists', '/mobile/lists/L1', '/mobile/lists/L1/bookings/BK1']) {
      expect(ids(api, path, 'bar')).toContain('fire-hospital-message')
      expect(ids(api, path, 'pwa')).toContain('fire-hospital-message')
    }
    expect(ids(api, '/mobile/more', 'pwa')).not.toContain('fire-hospital-message')
  })

  it('the simulator\'s published selection preselects the message', () => {
    const api = createAppStore()
    const t = byId('fire-hospital-message')
    expect(initialChoice(t, api.getState(), ctxFor('/demo/integrations'))).toBe('MSG-STG-1001')
    expect(initialChoice(t, api.getState(), ctxFor('/demo/integrations', {}, { 'integrationsSim.selectedMessageId': 'MSG-CPH-2001' }))).toBe('MSG-CPH-2001')
  })
})

describe('re-homed bodies match the Control Panel', () => {
  it('billing failure fails the COS Booking, bills its sibling, then reads Already triggered', () => {
    const api = createAppStore()
    wireBillingRun(api)
    const t = byId('billing-failure')
    const ctx = ctxFor('/admin/billing')
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
    expect(t.run(api, ctx).ok).toBe(true)
    const state = api.getState()
    expect(state.masters.contracts[CONTRACT.cosAcc]?.effectiveToISO).toBe('2026-07-15')
    const cases = Object.values(state.billing.cases).filter((c) => bookingsForList(state, SEED_LIST_IDS.billingFailure).some((booking) => booking.id === c.bookingId))
    expect(cases.some((c) => c.status === 'failed')).toBe(true)
    expect(cases.some((c) => c.status !== 'failed' && c.invoiceId !== undefined)).toBe(true)
    expect(t.disabledReason(api.getState(), ctx)).toBe('Already triggered')
  })

  it('arm handoff fault arms once and reads Armed', () => {
    const api = createAppStore()
    const t = byId('arm-handoff-fault')
    t.run(api, ctxFor('/admin/billing'))
    expect(api.getState().settings.failNextHandoff).toBe(true)
    expect(t.disabledReason(api.getState(), ctxFor('/admin/billing'))).toBe('Armed')
  })

  it('stage post-op authorises the Sharma List, then reads Already staged', () => {
    const api = createAppStore()
    const t = byId('stage-post-op')
    const ctx = ctxFor(`/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, { listId: POST_OP_ORIGINAL_LIST_ID })
    expect(t.run(api, ctx).ok).toBe(true)
    expect(api.getState().schedule.lists[POST_OP_ORIGINAL_LIST_ID]?.state).toBe('AUTHORISED')
    expect(t.disabledReason(api.getState(), ctx)).toMatch(/^Already staged/)
  })

  it('PDF ingest creates, then updates the same Booking', () => {
    const api = createAppStore()
    const t = byId('ingest-pdf-row')
    const ctx = ctxFor('/admin/integrations', {}, { 'integrations.tab': 'pdfs' })
    const first = t.run(api, ctx)
    expect(first.message).toMatch(/^Created/)
    const second = t.run(api, ctx)
    expect(second.message).toMatch(/^Updated/)
    expect(SURGEON_PDFS[0]).toBeDefined()
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

  it('every office stand-in declares the PWA surface only', () => {
    for (const t of DEMO_TRIGGERS.filter((x) => x.badge === 'office-stand-in')) expect(t.surfaces).toEqual(['pwa'])
  })

  it('PWA Balances offers Dr Souter\'s open invoices as choices and pays the chosen one', () => {
    const api = createAppStore()
    wireBillingRun(api)
    const t = byId('pwa-payment-half')
    const ctx = ctxFor('/mobile/balances')
    expect(ids(api, '/mobile/balances', 'pwa')).toEqual(['pwa-payment-full', 'pwa-payment-half'])
    expect(ids(api, '/mobile/balances', 'bar')).toEqual([])
    expect(t.disabledReason(api.getState(), ctx, initialChoice(t, api.getState(), ctx))).toBe('No open invoices yet')
    authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.souterMon20Am)
    const choices = t.choices?.(api.getState(), ctx) ?? []
    expect(choices.length).toBeGreaterThan(0)
    const chosen = choices[choices.length - 1]?.id
    expect(t.run(api, ctx, chosen).message).toMatch(/^Webhook applied/)
    expect(api.getState().xero.accRecs[chosen ?? '']?.amountReceived).toBeGreaterThan(0)
  })

  it('the PWA chip is absent on More and Availability', () => {
    const api = createAppStore()
    expect(ids(api, '/mobile/more', 'pwa')).toEqual([])
    expect(ids(api, '/mobile/availability', 'pwa')).toEqual([])
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
    expect(res.message).toContain('1 rule registered')
    expect(raise.disabledReason(api.getState(), day)).toBe('Samples already raised')
    expect(clear.disabledReason(api.getState(), day)).toBeNull()
    const key = warningsForBooking(api.getState(), AM_TARGET!)[0]!.key
    clearWarning(api, OFFICE_ACTOR, AM_TARGET!, key)
    expect(clear.run(api, day).ok).toBe(true)
    expect(proceduresForBooking(api.getState(), AM_TARGET!)[0]).toEqual(before)
    expect(api.getState().schedule.warningClearances[key]).toBeUndefined()
    expect(clear.disabledReason(api.getState(), day)).toBe('Nothing staged')
  })

  it('on a Booking: Riley already carries it; an unknown Booking is not seeded', () => {
    const api = createAppStore()
    const raise = byId('raise-sample-warnings')
    expect(raise.disabledReason(api.getState(), ctxFor(rileyPath, { listId: SEED_LIST_IDS.prepaymentUnpaidList, bookingId: RILEY }))).toBe(
      'This Booking already carries these warnings',
    )
    expect(raise.disabledReason(api.getState(), ctxFor('/admin/day/2026-07-21/bookings/BK9999', { bookingId: 'BK9999' }))).toBe(
      'Samples stage on seeded Bookings only',
    )
  })

  it('the PWA stand-in clears as the simulated office, then disables', () => {
    const api = createAppStore()
    const t = byId('office-clears-warning')
    const ctx = ctxFor(rileyPath, { listId: SEED_LIST_IDS.prepaymentUnpaidList, bookingId: RILEY })
    const choice = initialChoice(t, api.getState(), ctx)
    expect(choice).toBe(`${RILEY}:prepaymentUnpaid`)
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

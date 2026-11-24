/**
 * Catch-up Phase 20a's Booking-route triggers: "Fire hospital message" (on the
 * Future-scope surface only since Phase 34), and "Hospital description arrives" (default pairing,
 * the three outcomes, the disabled reason, absent from the PWA).
 */

import { SEED_STUB } from '../../domain/seed/intakeSeed'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { setInvoiceDescription } from '../../store/procedureTextActions'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { SEED_MARKERS } from '../../domain/seed'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor, initialChoice } from './match'
import { useDemoTriggerMemory } from './memory'
import { primaryProcedureOf } from './procedureTextTriggers'
import type { DemoTrigger, DemoTriggerCtx } from './types'

const byId = (id: string): DemoTrigger => DEMO_TRIGGERS.find((t) => t.id === id)!
const FOSTER = SEED_MARKERS.integrationS14!.entityId
/** Wiremu Tane's lap chole (Tue 21 PM), Doyle's bariatric Booking (Contract invoice description). */
const TANE = 'BK0006'
const DOYLE = 'BK0028'
const adminCtx = (api: BoundAppStore, bookingId: string): DemoTriggerCtx => {
  const list = api.getState().schedule.lists[api.getState().schedule.bookings[bookingId]!.listId]!
  return { pathname: `/admin/day/${list.dateISO}/bookings/${bookingId}`, params: { dateISO: list.dateISO, bookingId }, published: {} }
}
const ids = (api: BoundAppStore, pathname: string, surface: 'bar' | 'pwa') =>
  demoTriggersFor(api.getState(), pathname, surface).map((m) => m.trigger.id)

beforeEach(() => {
  useDemoTriggerMemory.setState({ lastMessageId: null, lastWebhook: null, webhookCounter: 0 })
})

describe('Fire hospital message, Future scope only (catch-up Phase 34)', () => {
  it('shows only on the Future-scope surface, in the bar, badged: never on a Booking or in the PWA', () => {
    const api = createAppStore()
    for (const path of [`/mobile/lists/L-34821-2026-12-08-AM/bookings/${FOSTER}`, `/web/lists/L-34821-2026-12-08-AM/bookings/${FOSTER}`, `/admin/day/2026-12-08/bookings/${FOSTER}`]) {
      expect(ids(api, path, 'bar')).not.toContain('fire-hospital-message')
      expect(ids(api, path, 'pwa')).not.toContain('fire-hospital-message')
    }
    for (const path of ['/demo/integrations', '/demo/integrations/log', '/demo/integrations/mapping']) {
      expect(ids(api, path, 'bar')).toEqual(expect.arrayContaining(['fire-hospital-message', 'replay-hospital-message']))
      expect(ids(api, path, 'pwa')).not.toContain('fire-hospital-message')
    }
    expect(byId('fire-hospital-message').badge).toBe('future-scope')
  })

  it("sends the message to matching and changes nothing until the office applies the row (catch-up Phase 33; RV-13)", () => {
    const api = createAppStore()
    const ctx: DemoTriggerCtx = { pathname: '/demo/integrations', params: {}, published: {} }
    const text = primaryProcedureOf(api.getState(), FOSTER)!.procedureText
    const first = byId('fire-hospital-message').run(api, ctx, 'MSG-STG-1012')
    expect(first.message).toBe('Sent MSG-STG-1012: its row waits on Admin, Intake, for the office to decide.')
    expect(primaryProcedureOf(api.getState(), FOSTER)!.procedureText).toEqual(text)
    expect(Object.values(api.getState().intake.rows).filter((r) => r.id !== SEED_STUB.rowId)).toHaveLength(1)
    byId('fire-hospital-message').run(api, ctx, 'MSG-STG-1012')
    expect(Object.values(api.getState().intake.rows).filter((r) => r.id !== SEED_STUB.rowId)).toHaveLength(1)
  })
})

describe('Hospital description arrives', () => {
  const trigger = () => byId('hospital-description-arrives')

  it('sits on the Admin Booking route only, in the bar, with no Future-scope badge', () => {
    const api = createAppStore()
    expect(ids(api, `/admin/day/2026-11-24/bookings/${TANE}`, 'bar')).toContain('hospital-description-arrives')
    expect(ids(api, `/mobile/lists/L-34821-2026-11-24-PM/bookings/${TANE}`, 'pwa')).not.toContain('hospital-description-arrives')
    expect(ids(api, `/mobile/lists/L-34821-2026-11-24-PM/bookings/${TANE}`, 'bar')).not.toContain('hospital-description-arrives')
    expect(trigger().badge).toBeUndefined()
  })

  it('defaults to the row AR-35 pairs with the rooms\' text: "lap chole" for "lap chole +/- IOC"', () => {
    const api = createAppStore()
    expect(initialChoice(trigger(), api.getState(), adminCtx(api, TANE))).toBe('ar35-row-12')
  })

  it('the invoice description follows the hospital\'s text on Tane\'s Booking', () => {
    const api = createAppStore()
    const out = trigger().run(api, adminCtx(api, TANE), 'ar35-row-12')
    expect(out.ok).toBe(true)
    expect(out.message).toContain('The invoice description follows it')
    expect(primaryProcedureOf(api.getState(), TANE)!.invoiceDescription).toEqual({ text: 'lap chole', origin: 'hospital' })
    expect(trigger().disabledReason(api.getState(), adminCtx(api, TANE), 'ar35-row-12')).toBe('This Booking already holds that hospital description')
  })

  it("leaves the Contract's invoice description on Doyle's Booking", () => {
    const api = createAppStore()
    const out = trigger().run(api, adminCtx(api, DOYLE), 'ar35-row-20')
    expect(out.message).toContain("stays the Contract's")
    expect(primaryProcedureOf(api.getState(), DOYLE)!.invoiceDescription?.origin).toBe('contract')
  })

  it("keeps an office edit and reports the newer description cue", () => {
    const api = createAppStore()
    const p = primaryProcedureOf(api.getState(), TANE)!
    setInvoiceDescription(api, OFFICE_ACTOR, p.id, 'Laparoscopic cholecystectomy')
    const out = trigger().run(api, adminCtx(api, TANE), 'ar35-row-12')
    expect(out.message).toContain("The office's edit stays on the invoice, with a newer description cue")
    expect(primaryProcedureOf(api.getState(), TANE)!.invoiceDescription?.text).toBe('Laparoscopic cholecystectomy')
  })
})

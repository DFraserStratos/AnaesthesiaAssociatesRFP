/**
 * Catch-up Phase 20a's Booking-route triggers: "Fire hospital message" (on the
 * Future-scope surface only since Phase 34, retired by build plan Phase 68), and
 * "Hospital description arrives" (default pairing, the three outcomes, the
 * disabled reason, absent from the PWA).
 */

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
  useDemoTriggerMemory.setState({ lastWebhook: null, webhookCounter: 0 })
})

describe('Fire hospital message, retired (build plan Phase 68; D119)', () => {
  it('is gone, with its replay: a held feed message is Intake\'s "A feed message fails", on Arrivals only, never on a Booking or in the PWA', () => {
    const api = createAppStore()
    expect(DEMO_TRIGGERS.some((t) => t.id === 'fire-hospital-message' || t.id === 'replay-hospital-message')).toBe(false)
    for (const path of [`/mobile/lists/L-34821-2026-12-08-AM/bookings/${FOSTER}`, `/web/lists/L-34821-2026-12-08-AM/bookings/${FOSTER}`, `/admin/day/2026-12-08/bookings/${FOSTER}`, '/demo/integrations']) {
      expect(ids(api, path, 'bar')).not.toContain('intake-feed-fails')
      expect(ids(api, path, 'pwa')).not.toContain('intake-feed-fails')
    }
    expect(ids(api, '/admin/intake', 'bar')).toContain('intake-feed-fails')
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

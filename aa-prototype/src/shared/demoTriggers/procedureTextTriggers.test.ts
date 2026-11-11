/**
 * Catch-up Phase 20a's Booking-route triggers: "Fire hospital message" with a
 * per-Booking default, and "Hospital description arrives" (default pairing,
 * the three outcomes, the disabled reason, absent from the PWA).
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { setInvoiceDescription } from '../../store/procedureTextActions'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { RTK_BOOKING_ID, SEED_MARKERS } from '../../domain/seed'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor, initialChoice } from './match'
import { useDemoTriggerMemory } from './memory'
import { cannedMessageForBooking, firstProcedureOf } from './procedureTextTriggers'
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

describe('Fire hospital message on a Booking', () => {
  it('shows on the mobile, web and Admin Booking routes, and on the PWA', () => {
    const api = createAppStore()
    expect(ids(api, `/mobile/lists/L-34821-2026-08-04-AM/bookings/${FOSTER}`, 'pwa')).toContain('fire-hospital-message')
    expect(ids(api, `/web/lists/L-34821-2026-08-04-AM/bookings/${FOSTER}`, 'bar')).toContain('fire-hospital-message')
    expect(ids(api, `/admin/day/2026-08-04/bookings/${FOSTER}`, 'bar')).toContain('fire-hospital-message')
    expect(byId('fire-hospital-message').badge).toBe('future-scope')
  })

  it("defaults to the message addressed to the Booking on screen: MSG-STG-1012 on Diane Foster's", () => {
    const api = createAppStore()
    expect(cannedMessageForBooking(api.getState(), FOSTER)).toBe('MSG-STG-1012')
    expect(initialChoice(byId('fire-hospital-message'), api.getState(), adminCtx(api, FOSTER))).toBe('MSG-STG-1012')
    expect(cannedMessageForBooking(api.getState(), RTK_BOOKING_ID)).toBeUndefined()
  })

  it('says the hospital description replaced the rooms\' text, and a second firing changes nothing', () => {
    const api = createAppStore()
    const first = byId('fire-hospital-message').run(api, adminCtx(api, FOSTER), 'MSG-STG-1012')
    expect(first.message).toContain("the hospital's description replaced the rooms' text")
    const text = firstProcedureOf(api.getState(), FOSTER)!.procedureText
    byId('fire-hospital-message').run(api, adminCtx(api, FOSTER), 'MSG-STG-1012')
    expect(firstProcedureOf(api.getState(), FOSTER)!.procedureText).toEqual(text)
  })
})

describe('Hospital description arrives', () => {
  const trigger = () => byId('hospital-description-arrives')

  it('sits on the Admin Booking route only, in the bar, with no Future-scope badge', () => {
    const api = createAppStore()
    expect(ids(api, `/admin/day/2026-07-21/bookings/${TANE}`, 'bar')).toContain('hospital-description-arrives')
    expect(ids(api, `/mobile/lists/L-34821-2026-07-21-PM/bookings/${TANE}`, 'pwa')).not.toContain('hospital-description-arrives')
    expect(ids(api, `/mobile/lists/L-34821-2026-07-21-PM/bookings/${TANE}`, 'bar')).not.toContain('hospital-description-arrives')
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
    expect(firstProcedureOf(api.getState(), TANE)!.invoiceDescription).toEqual({ text: 'lap chole', origin: 'hospital' })
    expect(trigger().disabledReason(api.getState(), adminCtx(api, TANE), 'ar35-row-12')).toBe('This Booking already holds that hospital description')
  })

  it("leaves the Contract's invoice description on Doyle's Booking", () => {
    const api = createAppStore()
    const out = trigger().run(api, adminCtx(api, DOYLE), 'ar35-row-20')
    expect(out.message).toContain("stays the Contract's")
    expect(firstProcedureOf(api.getState(), DOYLE)!.invoiceDescription?.origin).toBe('contract')
  })

  it("keeps an office edit and reports the newer description cue", () => {
    const api = createAppStore()
    const p = firstProcedureOf(api.getState(), TANE)!
    setInvoiceDescription(api, OFFICE_ACTOR, p.id, 'Laparoscopic cholecystectomy')
    const out = trigger().run(api, adminCtx(api, TANE), 'ar35-row-12')
    expect(out.message).toContain("The office's edit stays on the invoice, with a newer description cue")
    expect(firstProcedureOf(api.getState(), TANE)!.invoiceDescription?.text).toBe('Laparoscopic cholecystectomy')
  })
})

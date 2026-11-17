/**
 * Catch-up Phase 25 (work item 6): every seeded AUTHORISED List is locked at
 * seed time, the history backdrop migrated from its invoices as loaded, every
 * raised invoice regenerates identically, and every non-prepayment case names
 * its List's anaesthetist as payee.
 */

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { regenerateInvoiceFromLock } from './locks'
import { MIGRATED_LOCK_TEXT } from '../domain/billing/lock'

const state = freshAppState()
const authorised = Object.values(state.schedule.lists).filter((l) => l.state === 'AUTHORISED')

describe('seeded locks', () => {
  it('every AUTHORISED List has a lock per non-cancelled Booking, each locked (none rejected)', () => {
    expect(authorised.length).toBeGreaterThan(0)
    for (const list of authorised) {
      for (const booking of Object.values(state.schedule.bookings).filter((b) => b.listId === list.id && b.cancellation === undefined)) {
        const lock = state.billing.locks[booking.id]
        expect(lock, booking.id).toBeDefined()
        expect(lock!.state, `${booking.id} ${lock!.rejections[0]?.message ?? ''}`).toBe('locked')
      }
    }
  })

  it('the history backdrop is migrated and labelled; any other AUTHORISED List is locked through the builder', () => {
    for (const lock of Object.values(state.billing.locks)) {
      if (lock.listId.startsWith('L-HIST')) {
        expect(lock.origin).toBe('migrated')
        expect(lock.takenBy).toBe(MIGRATED_LOCK_TEXT)
      } else expect(lock.origin).toBe('authorise')
    }
  })

  it('every seeded standard invoice on a locked Booking regenerates identically', () => {
    const invoices = Object.values(state.billing.invoices).filter((i) => i.kind === 'standard' && state.billing.locks[i.bookingId] !== undefined)
    expect(invoices.length).toBeGreaterThan(0)
    for (const invoice of invoices) {
      const result = regenerateInvoiceFromLock(state, invoice.id)
      expect(result.ok, invoice.id).toBe(true)
      if (result.ok) expect(result.comparison.differences, invoice.invoiceNumber).toEqual([])
    }
  })

  it("every non-prepayment case of a locked Booking names its List's anaesthetist as payee", () => {
    for (const c of Object.values(state.billing.cases)) {
      const lock = state.billing.locks[c.bookingId]
      const invoice = c.invoiceId !== undefined ? state.billing.invoices[c.invoiceId] : undefined
      if (lock === undefined || invoice?.kind === 'prePayment') continue
      const list = state.schedule.lists[lock.listId]!
      expect(c.payeeAnaesthetistId, c.id).toBe(list.anaesthetistId)
    }
  })

  it('the seed is identical across two builds', () => {
    expect(JSON.stringify(freshAppState().billing.locks)).toBe(JSON.stringify(state.billing.locks))
  })
})

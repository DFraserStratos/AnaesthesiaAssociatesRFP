/**
 * Build plan Phase 62's aged unpaid invoice (`seed/agedInvoiceBooking.ts`): the
 * one seeded invoice the office lists that is over a fortnight old, so the
 * Invoices tab shows "Unpaid · 40 days" on load.
 */

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { invoiceAddresseeName, isBackdropCreditNote, isBackdropInvoice } from './selectors'
import { pairByInvoice } from './indexes'
import { invoiceRows } from '../domain/billing/invoiceState'
import { AGED_INVOICE_BOOKING_ID, AGED_INVOICE_LIST_ID } from '../domain/seed/agedInvoiceBooking'

const s = freshAppState()

describe('the aged unpaid invoice', () => {
  it('is AA-2026-S2402, St George\'s, raised Thu 15 Oct on Dr Ngata\'s backdrop List, a ledger pair and no Xero mirror', () => {
    const invoice = s.billing.invoices['INV-S24-02']
    expect(invoice).toMatchObject({ invoiceNumber: 'AA-2026-S2402', bookingId: AGED_INVOICE_BOOKING_ID, kind: 'standard', counterparty: { kind: 'hospital', id: 'H-STG' }, total: 289.8, raisedAtISO: '2026-10-15T09:00:00' })
    expect(isBackdropInvoice(invoice!)).toBe(false)
    expect(s.schedule.lists[AGED_INVOICE_LIST_ID]).toMatchObject({ anaesthetistId: '38455', dateISO: '2026-10-14', state: 'AUTHORISED' })
    const pair = s.billing.ledger['BC-S24-02']
    expect(pair?.receivable).toMatchObject({ amount: 289.8, receivedAmount: 0 })
    expect(Object.values(s.xero.accRecs).some((r) => r.invoiceId === 'INV-S24-02')).toBe(false)
  })

  it('reads Unpaid, 40 days old on the demo day, through the invoice model', () => {
    const rows = invoiceRows({
      invoices: Object.values(s.billing.invoices).filter((i) => !isBackdropInvoice(i)),
      creditNotes: Object.values(s.billing.creditNotes).filter((c) => !isBackdropCreditNote(c)),
      pairByInvoice: pairByInvoice(s.billing.ledger),
      bookings: s.schedule.bookings,
      lists: s.schedule.lists,
      patients: s.masters.patients,
      anaesthetists: s.masters.anaesthetists,
      payerName: (doc) => invoiceAddresseeName(s, doc),
      pendingPrepayments: [],
      todayISO: s.clock.todayISO,
    })
    const row = rows.find((r) => r.id === 'INV-S24-02')
    expect(row).toMatchObject({ state: 'unpaid', ageDays: 40, owing: 289.8, payerName: "St George's", anaesthetistName: 'Dr Tom Ngata' })
  })
})

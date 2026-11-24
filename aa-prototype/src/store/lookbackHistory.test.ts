/**
 * The browsable history (catch-up Phase 38a): twelve multi-Booking backdrop
 * Lists for Dr Souter, January to March 2026, appended through the same
 * builder the existing backdrop uses. Every existing backdrop id and amount is
 * unchanged, and no money figure moves (the figures below were recorded from
 * the seed before the history was added and are identical after).
 */

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { aaFeeInvoicesFor, isBackdropList, outstandingPayableRowsFor, outstandingTotalFor } from './selectors'
import { bctiRecords } from './ledgerSelectors'
import { bctisFor } from '../domain/billing/bcti'
import { pairStatusLabel } from '../domain/billing/ledger'
import { horizonFor } from '../domain/clock'
import { ANAE, PAT, SEED_LOOKBACK } from '../domain/seed'
import type { AssignedList } from '../domain/types'

const state = freshAppState()
const TODAY = '2026-11-24'
const canvasStart = horizonFor(TODAY, state.appSettings.schedule.horizonMonths).startISO
const backdrop = Object.values(state.schedule.lists).filter((l): l is AssignedList => isBackdropList(l) && l.state !== 'DRAFT')
const lookback = backdrop.filter((l) => /^L-HIST-\d{4}-\d{2}-\d{2}-(AM|PM)$/.test(l.id))
const bookingsOn = (listId: string) => Object.values(state.schedule.bookings).filter((b) => b.listId === listId)

describe('the browsable history', () => {
  it('is deterministic', () => {
    expect(freshAppState().schedule.lists).toEqual(state.schedule.lists)
    expect(freshAppState().billing).toEqual(state.billing)
  })

  it('adds twelve Lists, January to March, before the canvas start, AUTHORISED and invoiced, 2 to 4 Bookings each', () => {
    expect(lookback).toHaveLength(12)
    expect(bookingsOn(lookback[0]!.id).length).toBeGreaterThan(0)
    let total = 0
    for (const l of lookback) {
      expect(l.anaesthetistId).toBe(ANAE.souter)
      expect(l.dateISO >= '2026-01-01' && l.dateISO <= '2026-03-31', l.id).toBe(true)
      expect(l.dateISO < canvasStart).toBe(true)
      expect(l.state).toBe('AUTHORISED')
      expect(l.billedAtISO).toBeDefined()
      expect(state.schedule.slots[l.slotId]).toBeUndefined()
      const n = bookingsOn(l.id).length
      expect(n >= 2 && n <= 4, `${l.id} has ${n}`).toBe(true)
      total += n
    }
    expect(total).toBe(29)
  })

  it('settles every new account before 1 April 2026: paid in and disbursed', () => {
    const ids = new Set(lookback.flatMap((l) => bookingsOn(l.id).map((b) => b.id)))
    const pairs = Object.values(state.billing.ledger).flatMap((p) => (p.kind !== 'aaFee' && ids.has(p.bookingId) ? [p] : []))
    expect(pairs).toHaveLength(29)
    for (const p of pairs) {
      expect(pairStatusLabel(p), p.id).toBe('disbursed')
      expect(p.receivable.paidInAtISO! < '2026-04-01').toBe(true)
      expect(p.payable!.paidOutAtISO! < '2026-04-01').toBe(true)
    }
  })

  it("pins SEED_LOOKBACK: Fri 13 March AM at St George's, three Bookings, Sarah Mitchell among them", () => {
    const l = state.schedule.lists[SEED_LOOKBACK.listId]
    expect(l).toMatchObject({ dateISO: '2026-03-13', session: 'AM', state: 'AUTHORISED', hospitalId: 'H-STG' })
    const bookings = bookingsOn(SEED_LOOKBACK.listId)
    expect(bookings).toHaveLength(3)
    expect(bookings.some((b) => b.patientId === PAT.mitchell)).toBe(true)
  })

  it('keeps every existing backdrop id, date and amount', () => {
    for (let n = 1; n <= 13; n++) {
      const id = `L-HIST-${String(n).padStart(2, '0')}`
      expect(state.schedule.lists[id], id).toBeDefined()
    }
    expect(state.schedule.lists['L-HIST-07']).toMatchObject({ dateISO: '2026-08-18', session: 'AM' })
    expect(state.schedule.lists['L-HIST-08']).toMatchObject({ dateISO: '2026-03-18', session: 'AM' })
    const h07 = Object.values(state.billing.invoices).find((i) => i.invoiceNumber === 'AA-2026-H07')
    expect(h07?.id).toBe('HINV07')
    expect(h07?.total).toBe(610)
    expect(state.schedule.bookings['HBK07']).toMatchObject({ listId: 'L-HIST-07', patientId: PAT.mitchell })
  })

  it('no two backdrop Lists share a date and session; Souter has history in every month January to June', () => {
    const keys = backdrop.map((l) => `${l.anaesthetistId}|${l.dateISO}|${l.session}`)
    expect(new Set(keys).size).toBe(keys.length)
    const months = new Set(backdrop.filter((l) => l.anaesthetistId === ANAE.souter).map((l) => l.dateISO.slice(0, 7)))
    for (const m of ['2026-01', '2026-02', '2026-03', '2026-08', '2026-09', '2026-10']) expect(months.has(m), m).toBe(true)
  })
})

describe('no money figure moves', () => {
  it('outstanding balances are as before', () => {
    expect(outstandingPayableRowsFor(state, ANAE.souter).map((r) => [r.invoiceNumber, r.outstandingToYou])).toEqual([
      ['AA-2026-H08', 250],
      ['AA-2026-H07', 610],
      ['AA-2026-H06', 1930],
      ['AA-2026-H05', 1410],
      ['AA-2026-H04', 980],
      ['AA-2026-H03', 520.5],
      ['AA-2026-H02', 1240],
      ['AA-2026-H01', 845],
      // (catch-up Phase 36: an unmirrored invoice is owed. The seed range beat AA-2026-S2401, never handed off,
      // is now Dr Souter's: +1 row, +$3,565.00 current. Every other figure is as before.)
      ['AA-2026-S2401', 3565],
    ])
    // (catch-up Phase 38: no ageing buckets, D8; one total, the unpaid payables.)
    expect(outstandingTotalFor(outstandingPayableRowsFor(state, ANAE.souter))).toBe(7785.5 + 3565)
  })

  it('the seeded AA fee invoices and their totals are as before; the new BCTIs fall in January to March only', () => {
    expect(aaFeeInvoicesFor(state, ANAE.souter).map((r) => [r.invoiceNumber, r.monthISO, r.bctiCount, r.total])).toEqual([
      ['AA-FEE-2026-H02', '2026-10', 1, 580.75],
      ['AA-FEE-2026-H01', '2026-09', 2, 586.5],
    ])
    const records = bctiRecords(state)
    const count = (m: string) => bctisFor(records, ANAE.souter, m).length
    // July was 3 until catch-up Phase 27a: Nair's prepayment payable credits the AA Holding account and is not a BCTI.
    expect(['2026-08', '2026-09', '2026-10', '2026-11'].map(count)).toEqual([0, 2, 1, 2])
    expect(['2026-01', '2026-02', '2026-03'].map(count)).toEqual([2, 10, 17])
  })
})

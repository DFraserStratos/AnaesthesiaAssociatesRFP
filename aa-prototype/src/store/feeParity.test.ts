/**
 * Phase 18 parity fixture: every seeded fee and counterparty, captured BEFORE
 * the Party and flat-Contract reshape and matched unchanged after it.
 *
 * Lives in `src/store` (not `src/domain/billing`) because it builds its
 * contexts exactly as the app does, through the store's selectors, and the
 * domain purity test forbids `src/domain` importing the store.
 *
 * Rules: only the context-building code below may change after the baseline;
 * the fixture file never changes, and this suite is never run with `-u`.
 */

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { billingContextForBooking, bookingsForList, prePaidByProcedure, proceduresForBooking } from './selectors'
import { procedureFee } from '../shared/capture/feeContext'
import { buildInvoicesForBooking, type InvoiceBuildContext } from '../domain/billing/invoiceBuild'
import { listHospitalFor } from '../domain/listPairing'
import type { AssignedList } from '../domain/types'

const state = freshAppState()

const assignedLists = Object.values(state.schedule.lists)
  .filter((l): l is AssignedList => l.anaesthetistId !== undefined)
  .sort((a, b) => a.id.localeCompare(b.id))

interface FeeRow {
  procedureId: string
  total: number
  billableUnits: number
  lines: { basis: string; amount: number }[]
}

interface InvoiceRow {
  bookingId: string
  result:
    | { kind: 'invoices'; invoices: { counterparty: string; subtotal: number; total: number }[] }
    | { kind: 'exception'; code: string }
}

const fees: FeeRow[] = []
const invoices: InvoiceRow[] = []

for (const list of assignedLists) {
  for (const booking of bookingsForList(state, list.id)) {
    const procedures = proceduresForBooking(state, booking.id)
    procedures.forEach((procedure, index) => {
      const { fee } = procedureFee({
        procedure,
        list,
        ordinal: index + 1,
        masters: state.masters,
        billingLines: state.schedule.billingLines,
      })
      fees.push({
        procedureId: procedure.id,
        total: fee.total,
        billableUnits: fee.billableUnits,
        lines: fee.lines.map((l) => ({ basis: l.chargeBasis, amount: l.amount })),
      })
    })

    const bookingCtx = billingContextForBooking(state, booking)
    if (bookingCtx === undefined) continue
    const prePaid = prePaidByProcedure(state, booking.id)
    const buildCtx: InvoiceBuildContext = {
      ...bookingCtx,
      listDateISO: list.dateISO,
      patientId: booking.patientId,
      ...listHospitalFor(list, state.masters.hospitals),
      ...(Object.keys(prePaid).length > 0 ? { prePaidByProcedure: prePaid } : {}),
    }
    const result = buildInvoicesForBooking(booking, procedures, buildCtx)
    invoices.push({
      bookingId: booking.id,
      result:
        result.kind === 'invoices'
          ? {
              kind: 'invoices',
              invoices: result.invoices.map((inv) => ({
                counterparty: `${inv.counterparty.kind}:${inv.counterparty.id}`,
                subtotal: inv.subtotal,
                total: inv.total,
              })),
            }
          : { kind: 'exception', code: result.code },
    })
  }
}

fees.sort((a, b) => a.procedureId.localeCompare(b.procedureId))
invoices.sort((a, b) => a.bookingId.localeCompare(b.bookingId))

const feeOf = (procedureId: string) => fees.find((f) => f.procedureId === procedureId)
const invoicesOf = (bookingId: string) => invoices.find((i) => i.bookingId === bookingId)?.result

describe('Phase 18 fee and counterparty parity', () => {
  it('matches the pre-reshape baseline for every seeded procedure and Booking', async () => {
    expect(fees.length).toBeGreaterThan(100)
    await expect(JSON.stringify({ fees, invoices }, null, 2)).toMatchFileSnapshot(
      './__parity__/phase-18-baseline.json',
    )
  })

  it('pins the named contract figures', () => {
    // SXAP $26.50 per unit: Wiremu Tane, 12 units.
    expect(feeOf('P0006')).toMatchObject({ total: 318, billableUnits: 12 })
    // ...and on Dr Strand's List, whose own rate is $42, so the $26.50 is the Contract's: 7 x $26.50.
    expect(feeOf('P0113')).toMatchObject({ total: 185.5, billableUnits: 7 })
    // Health NZ $23: Hemi Walker on Dr Whitaker's Fri 17 Jul List bills Christchurch Public.
    const hnz = feeOf('P0017')
    expect(hnz !== undefined && hnz.total / hnz.billableUnits).toBe(23)
    expect(invoicesOf('BK0017')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'hospital:H-CPH' }] })
    // St George's ACC $25.
    const stgAcc = feeOf('P0012')
    expect(stgAcc !== undefined && stgAcc.total / stgAcc.billableUnits).toBe(25)
    // COS ACC $24, billed to the COS organisation.
    const cos = feeOf('P0033')
    expect(cos !== undefined && cos.total / cos.billableUnits).toBe(24)
    expect(invoicesOf('BK0031')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'organisation:O-COS' }] })
    // Doyle's bariatric fixed prices: $2,800 and the ordinal-2 $950, billed to Doyle.
    expect(feeOf('P0029')?.total).toBe(2800)
    expect(feeOf('P0030')?.total).toBe(950)
    expect(invoicesOf('BK0028')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'surgeon:S-DOYLE' }] })
    // Aria rate x time: 3.0 h x $480 = $1,440.
    expect(feeOf('P0031')?.lines).toContainEqual({ basis: 'rateTime', amount: 1440 })
    // nib on the Insurer route.
    expect(invoicesOf('BK0007')).toMatchObject({ kind: 'invoices', invoices: [{ counterparty: 'insurer:I-NIB' }] })
  })
})

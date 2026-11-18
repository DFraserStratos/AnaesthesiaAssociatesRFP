/**
 * Catch-up Phase 23 parity capture (work item 1): every seeded Procedure's fee
 * (total, charged units, B, T, M and its lines), every seeded Booking's
 * invoices and prepayment invoices as a run would build them (counterparty,
 * subtotal, total and each line's Procedure, kind, units and amount), the BCTI
 * count per anaesthetist and month (`bctisFor`), and the census of every
 * seeded Booking with more than one Procedure.
 *
 * Written once from the code BEFORE Phase 23 made pricing Booking-level, into
 * `phase-23-baseline.json`, and compared after it by
 * `multiProcedureParity.test.ts`. Only `feesForBooking` (the one assembler the
 * UI reads) may change after the baseline. Imported only by tests.
 */

import type { AppState } from '../appStore'
import { bctiRecords, bctisToChargeFor, billingContextForBooking, bookingsForList, prepaidHeldFor, proceduresForBooking } from '../selectors'
import { buildInvoicesForBooking, type InvoiceBuildContext } from '../../domain/billing/invoiceBuild'
import { prepaymentDraftsAsRaised } from './phase22aCapture'
import type { FeeResult } from '../../domain/billing/fee'
import { listHospitalFor } from '../../domain/listPairing'
import { bookingFee } from '../../shared/capture/feeContext'
import type { AssignedList, Booking } from '../../domain/types'

export interface FeeRow23 {
  procedureId: string
  bookingId: string
  total: number
  billableUnits: number
  b: number
  t: number
  m: number
  needsPrice: boolean
  lines: { basis: string; amount: number; units?: number }[]
}

export interface InvoiceLine23 {
  procedureId?: string
  kind: string
  amount: number
  units?: number
  description: string
}

export type BuildRow23 =
  | { kind: 'invoices'; invoices: { counterparty: string; subtotal: number; total: number; lines: InvoiceLine23[] }[] }
  | { kind: 'exception'; code: string }

export interface BookingRow23 {
  bookingId: string
  result: BuildRow23
  prepayment?: BuildRow23
}

export interface CensusRow23 {
  bookingId: string
  procedures: {
    procedureId: string
    /** The flag as the seed holds it before and after the phase: the first is primary. */
    primary: boolean
    contractId?: string
    pricingKind?: string
    rvgGroupId?: string
    modifierClaims: string[]
    modifierItems: string[]
    m: number
  }[]
}

export interface BctiRow23 {
  anaesthetistId: string
  monthISO: string
  count: number
}

export interface Phase23Baseline {
  fees: FeeRow23[]
  bookings: BookingRow23[]
  census: CensusRow23[]
  bctis: BctiRow23[]
}

/** The fee of each Procedure of one Booking, as the capture UI assembles it. The only part that may change after the baseline. */
export function feesForBooking(state: AppState, list: AssignedList, booking: Booking): Record<string, FeeResult> {
  const procedures = proceduresForBooking(state, booking.id)
  const { views } = bookingFee({ procedures, list, masters: state.masters, billingLines: state.schedule.billingLines, patientId: booking.patientId })
  const out: Record<string, FeeResult> = {}
  for (const p of procedures) {
    const view = views[p.id]
    if (view !== undefined) out[p.id] = view.fee
  }
  return out
}

function buildRow(result: ReturnType<typeof buildInvoicesForBooking> | ReturnType<typeof prepaymentDraftsAsRaised>): BuildRow23 {
  if (result.kind === 'exception') return { kind: 'exception', code: result.code }
  return {
    kind: 'invoices',
    invoices: result.invoices.map((inv) => ({
      counterparty: `${inv.counterparty.kind}:${inv.counterparty.id}`,
      subtotal: inv.subtotal,
      total: inv.total,
      lines: inv.lines.map((l) => ({
        ...(l.procedureId !== undefined ? { procedureId: l.procedureId } : {}),
        kind: l.kind,
        amount: l.amount,
        ...(l.units !== undefined ? { units: l.units } : {}),
        description: l.description,
      })),
    })),
  }
}

/** `held`: read the price ladder's held amounts (catch-up Phase 24's own capture); off, the pre-24 form the Phase 23 fixture holds. */
export function capturePhase23(state: AppState, opts: { held?: boolean } = {}): Phase23Baseline {
  const fees: FeeRow23[] = []
  const bookings: BookingRow23[] = []
  const census: CensusRow23[] = []
  const lists = Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.anaesthetistId !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id))
  for (const list of lists) {
    for (const booking of bookingsForList(state, list.id)) {
      const procedures = proceduresForBooking(state, booking.id)
      const feeById = feesForBooking(state, list, booking)
      for (const procedure of procedures) {
        const fee = feeById[procedure.id]
        if (fee === undefined) continue
        fees.push({
          procedureId: procedure.id,
          bookingId: booking.id,
          total: fee.total,
          billableUnits: fee.billableUnits,
          b: fee.btm.base.units,
          t: fee.btm.time.units,
          m: fee.btm.modifiers.units,
          needsPrice: fee.needsPrice,
          lines: fee.lines.map((l) => ({ basis: l.chargeBasis, amount: l.amount, ...(l.units !== undefined ? { units: l.units } : {}) })),
        })
      }
      if (procedures.length > 1) {
        census.push({
          bookingId: booking.id,
          procedures: procedures.map((p, index) => {
            const contract = p.governingContractId !== undefined ? state.masters.contracts[p.governingContractId] : undefined
            const fee = feeById[p.id]
            return {
              procedureId: p.id,
              primary: index === 0,
              ...(p.governingContractId !== undefined ? { contractId: p.governingContractId } : {}),
              ...(contract !== undefined ? { pricingKind: contract.pricing.kind } : {}),
              ...(p.rvgGroupId !== undefined ? { rvgGroupId: p.rvgGroupId } : {}),
              modifierClaims: p.modifierClaims.map((c) => c.modifierId),
              modifierItems: (fee?.btm.modifierItems ?? []).map((i) => `${i.code}:${i.origin}:${i.units}`),
              m: fee?.btm.modifiers.units ?? 0,
            }
          }),
        })
      }
      const ctx = billingContextForBooking(opts.held === true ? state : { masters: state.masters, schedule: state.schedule }, booking)
      if (ctx === undefined) continue
      // Catch-up Phase 27: a raised prepayment's Procedures are left off (was: netted by a deduction line).
      const leftOff = prepaidHeldFor(state, booking.id)
      const buildCtx: InvoiceBuildContext = {
        ...ctx,
        listDateISO: list.dateISO,
        patientId: booking.patientId,
        ...listHospitalFor(list, state.masters.hospitals),
        ...(Object.keys(leftOff).length > 0 ? { prepaidLeftOff: leftOff } : {}),
      }
      const row: BookingRow23 = { bookingId: booking.id, result: buildRow(buildInvoicesForBooking(booking, procedures, buildCtx)) }
      const pre = prepaymentDraftsAsRaised(state, booking, procedures, buildCtx)
      if (pre.kind === 'exception' || pre.invoices.length > 0) row.prepayment = buildRow(pre)
      bookings.push(row)
    }
  }
  const months = new Set<string>()
  for (const r of bctiRecords(state)) months.add(r.issuedAtISO.slice(0, 7))
  const bctis: BctiRow23[] = []
  for (const a of Object.values(state.masters.anaesthetists).sort((x, y) => x.registrationNumber.localeCompare(y.registrationNumber))) {
    for (const monthISO of [...months].sort()) {
      const count = bctisToChargeFor(state, a.registrationNumber, monthISO).length
      if (count > 0) bctis.push({ anaesthetistId: a.registrationNumber, monthISO, count })
    }
  }
  fees.sort((a, b) => a.procedureId.localeCompare(b.procedureId))
  bookings.sort((a, b) => a.bookingId.localeCompare(b.bookingId))
  census.sort((a, b) => a.bookingId.localeCompare(b.bookingId))
  return { fees, bookings, census, bctis }
}

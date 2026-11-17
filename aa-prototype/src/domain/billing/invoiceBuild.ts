/**
 * Invoice building (Phase 08; catch-up Phase 25). Since catch-up Phase 25 the
 * standard invoices are built from the pricing snapshot taken at AUTHORISED
 * (`lock.ts`, the one place): `buildInvoicesForBooking` is the preview of
 * what a lock taken now would bill, `invoiceDraftsFromLock(buildBookingLock(..))`,
 * so the preview and the lock cannot disagree. The billing run never calls it:
 * it reads the stored lock only. What remains here is the pre-payment
 * build, raised at setup before any lock (INTERIM until Phase 27).
 */

import type { Booking, Contract, ContractId, CounterpartyRef, Procedure } from '../types'
import { NO_PRIMARY_MESSAGE } from './bookingFee'
import { inDisplayOrder } from './multiProcedure'
import { roundToCents } from './money'
import { gstOn, invoiceLayoutFor } from './invoicePresentation'
import { PREPAYMENT_DEPOSIT_DESCRIPTION } from './procedurePrice'
import { needsPriceMessage } from './priceRanges'
import { billablePartyForProcedure, billedToFor } from './whoIsBilled'
import { bookingFeesFor } from './validateBookingForBilling'
import {
  buildBookingLock,
  invoiceDraftsFromLock,
  PREPAID_SPLIT_MESSAGE,
  type BookingBuildResult,
  type DraftInvoice,
  type DraftInvoiceLine,
  type InvoiceBuildContext,
} from './lock'

export {
  NEEDS_INVOICE_DESTINATION_MESSAGE,
  PREPAID_SPLIT_MESSAGE,
  type BookingBuildResult,
  type DraftInvoice,
  type DraftInvoiceLine,
  type InvoiceBuildContext,
} from './lock'

/**
 * What a lock taken now would bill for this Booking (the preview, tests and
 * the seed's own invoices): every Procedure priced with its stored Contract
 * under the multi-procedure rule, billed to the party its Contract names (or
 * divided between its split's parties), grouped one invoice per party. Any
 * Procedure that cannot be priced or billed fails the whole Booking.
 */
export function buildInvoicesForBooking(booking: Booking, procedures: readonly Procedure[], ctx: InvoiceBuildContext): BookingBuildResult {
  // Cancelled Bookings are retained but never billed (7th review B23).
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }
  const lock = buildBookingLock({ booking, procedures, ctx, takenAtISO: '', takenBy: '', partyName: (ref) => ref.id })
  return invoiceDraftsFromLock(lock)
}

/**
 * INTERIM until Phase 27 (catch-up Phase 20; D23, US-04.3.4): a Procedure
 * requires prepayment when its Contract is prepaid, which always bills the
 * Procedure's payer (OQ-73 at Confirm, D23), never a holder.
 */
export function procedureRequiresPrepayment(contract: Pick<Contract, 'prepaid' | 'billsTo'> | undefined): boolean {
  return contract?.prepaid === true && contract.billsTo === 'payer'
}

/**
 * Build the PRE-PAYMENT (pre-procedure) invoice boundaries for one Booking
 * (Phase 09; B7). Covers ONLY the Procedures on a prepaid Contract billed to a
 * person (INTERIM until Phase 27, catch-up Phase 20; D23); a mixed booking's
 * other Procedures are untouched here (they bill normally after
 * authorisation). Two shapes, from `prepaymentDetail` (INTERIM until 27):
 *
 *   - `split`: a flat AGREED deposit line (the `depositAmount` figure, never
 *     via the fee engine: the deposit is a negotiated number, not a fraction of the
 *     estimated fee);
 *   - `full`:  the full fee on the prepaid Contract through `bookingFeesFor` (the same
 *     calculator the balance run uses, so the balance nets to exactly $0).
 *
 * Deposit lines are EX-GST subtotals (an $800 deposit invoices as
 * 800 / GST 120 / total 920); the later balance run subtracts the same ex-GST
 * figure from the ex-GST fee subtotal, so deposit + balance reconciles to the
 * full fee. Grouped by who is billed (each prepaid Procedure's own payer, the
 * patient unless another payer is ticked): one prepayment invoice per payer
 * (US-06.3.1 "One per payer", catch-up Phase 22a); always the patient layout.
 */
export function buildPrePaymentInvoiceForBooking(
  booking: Booking,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): BookingBuildResult {
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  // Every Procedure is ranked, prepaid or not (D57): the Booking is priced once under the rule.
  const priced = bookingFeesFor(procedures, ctx)
  const tagged: { counterparty: CounterpartyRef; contractId: ContractId; line: DraftInvoiceLine }[] = []
  for (const procedure of inDisplayOrder(procedures)) {
    const contract = procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
    if (contract === undefined || !procedureRequiresPrepayment(contract)) continue
    // A split fee is never prepaid by one party (catch-up Phase 22): the office removes the split first.
    if (procedure.split !== undefined) {
      return { kind: 'exception', procedureId: procedure.id, code: 'prepaidSplit', message: PREPAID_SPLIT_MESSAGE }
    }
    const counterparty = billablePartyForProcedure(contract, procedure, booking.patientId, ctx.parties)
    if (counterparty === undefined) continue
    const detail = procedure.prepaymentDetail
    if (detail?.type === 'split') {
      // The validator guarantees a positive depositAmount on a split.
      const amount = roundToCents(detail.depositAmount ?? 0)
      if (amount <= 0) continue
      tagged.push({
        counterparty,
        contractId: contract.id,
        line: { procedureId: procedure.id, kind: 'fee', description: PREPAYMENT_DEPOSIT_DESCRIPTION, amount },
      })
    } else {
      // Full prepayment: the full fee on the prepaid Contract, via the same
      // engine the balance run uses.
      if (priced.kind === 'structural') {
        return { kind: 'exception', procedureId: procedure.id, code: 'noPrimaryProcedure', message: `${NO_PRIMARY_MESSAGE}.` }
      }
      const fee = priced.fees[procedure.id]!
      // No price yet (an open price with no amount typed): nothing to prepay.
      if (fee.needsPrice) {
        return { kind: 'exception', procedureId: procedure.id, code: 'needsPrice', message: needsPriceMessage(contract, ctx.listDateISO, { named: true }) }
      }
      const amount = roundToCents(fee.total)
      if (amount <= 0) continue
      const line: DraftInvoiceLine = {
        procedureId: procedure.id,
        kind: 'fee',
        description: 'Pre-payment, estimated full fee',
        amount,
      }
      if (fee.billableUnits > 0) line.units = fee.billableUnits
      tagged.push({ counterparty, contractId: contract.id, line })
    }
  }

  const groups = new Map<string, { counterparty: CounterpartyRef; contractId?: ContractId; lines: DraftInvoiceLine[] }>()
  for (const { counterparty, contractId, line } of tagged) {
    const key = `${counterparty.kind}:${counterparty.id}`
    const group = groups.get(key)
    if (group === undefined) groups.set(key, { counterparty, contractId, lines: [line] })
    else group.lines.push(line)
  }

  const invoices: DraftInvoice[] = []
  for (const { counterparty, contractId, lines } of groups.values()) {
    const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))
    const gst = gstOn(subtotal)
    const procedureIds = [...new Set(lines.flatMap((l) => (l.procedureId !== undefined ? [l.procedureId] : [])))]
    const billedTo = billedToFor(counterparty, procedures.filter((p) => procedureIds.includes(p.id)), booking.patientId, ctx.patient)
    invoices.push({
      counterparty,
      ...(billedTo !== undefined ? { billedTo } : {}),
      // A prepaid Contract always bills the payer (D23), so this is the patient's layout.
      layout: invoiceLayoutFor(contractId !== undefined ? ctx.contracts[contractId] : undefined, counterparty, true),
      lines,
      subtotal,
      gst,
      total: roundToCents(subtotal + gst),
      ...(contractId !== undefined ? { contractId } : {}),
      procedureIds,
    })
  }
  return { kind: 'invoices', invoices }
}

/**
 * The pricing snapshot taken at AUTHORISED, the invoice's recipe (catch-up
 * Phase 25; US-04.3.5, US-07.3.1, US-08.1.1, US-08.4.4, US-15.0.3, DM-08,
 * RV-11; AR-58 2.8). The one place it lives: the snapshot types, the builder,
 * the lock-only pricing and drafting, the comparison and the one view every
 * screen reads (`lockViewFor`). A screen never reads a raw snapshot field.
 *
 * Contracts are edited in place (18), so the snapshot COPIES what it needs and
 * points at no version:
 *  - per Procedure: the Contract's settings as they then stood with only the
 *    price range in force on the procedure date, its RVG group as used, the
 *    Procedure's values (procedure text, invoice description, RVG code,
 *    billing reference), the fee as recorded and priced (B, T and M with 19b's
 *    items and the guide check, the units after 23's rule, the unit rate, the
 *    discount line and 24's price), who it bills (the holder Party, or the
 *    Procedure's own payer with its BP id, 22a) and its split shares (22),
 *    and the charges that make up its invoice lines;
 *  - once per Booking: the payee (the List's anaesthetist at authorise, DM-42,
 *    with the supplier block 22 prints), the patient as printed, each billed
 *    party as printed (addressee, delivery, layout, holder reference,
 *    cross-match), the GST rate, the pre-payment already invoiced (INTERIM:
 *    27 replaces it) and the totals as a checksum.
 *
 * `buildBookingLock` resolves everything once from live data with the same
 * pure functions the preview uses, so the lock and the preview cannot
 * disagree. `invoiceDraftsFromLock` and `priceBookingFromLock` take the lock
 * only: no masters argument, so the engine cannot read live data. A Booking
 * the builder cannot price locks as `rejected` with its reason; the run then
 * holds it back whole while the rest of the List bills (OQ-05). No price
 * source and no layer is stored: the price is the figure itself.
 *
 * What the snapshot holds is our reading of AR-58 2.8 plus what the printed
 * invoice and the payee need (US-04.3.5 leaves the exact fields to discovery);
 * a change is an edit here, its tests and the seed, never a screen.
 */

import type {
  Booking,
  Contract,
  ContractId,
  CounterpartyRef,
  Invoice,
  InvoiceBilledTo,
  InvoiceCrossMatch,
  InvoiceLine,
  InvoiceSplitInfo,
  InvoiceSupplier,
  Procedure,
  ProcedureId,
  RvgGroup,
} from '../types'
import type { FeeResult } from './fee'
import { NO_PRIMARY_MESSAGE } from './bookingFee'
import { inDisplayOrder } from './multiProcedure'
import { formatMoney, roundToCents, toCents } from './money'
import { crossMatchFor, GST_RATE, invoiceLayoutFor, invoiceLineViews, supplierFor, btmOf, type InvoiceLayout, type InvoiceLineView } from './invoicePresentation'
import { PARTY_GONE_REASON, resolveSplit, shareLabel, splitDoesNotFitMessage, splitLineText } from './splitShare'
import { splitPartiesOn } from './partyOptions'
import { PREPAYMENT_DEDUCTION_DESCRIPTION, procedureNeedsPrice } from './procedurePrice'
import { needsPriceMessage, rangeInForce } from './priceRanges'
import { groupOf } from './rvgGroups'
import { dayWithYear, stampText } from '../dateText'
import { billablePartyForProcedure, billedToFor, HOLDER_MISSING_MESSAGE, invoiceDeliveryFor, type DeliveryPlan } from './whoIsBilled'
import { bookingFeesFor, validateBookingForBilling, type BookingBillingContext } from './validateBookingForBilling'
import type { HeldPrices, PriceHeldBy } from './procedurePrice'

// ---------------------------------------------------------------------------
// The snapshot
// ---------------------------------------------------------------------------

/** One invoice line the Procedure contributes, and the party it bills. */
export interface LockedCharge {
  /** `kind:id` of the party in `BookingLock.parties`. */
  partyKey: string
  /** True when the party is the one the Procedure's Contract bills (not another split share's). */
  isContractParty: boolean
  /** The line as the holder's layout prints it (BTM included; the patient's layout drops it). */
  line: InvoiceLineView
  split?: InvoiceSplitInfo
}

/** The rate a Procedure's units were charged at: the Contract's fixed rate, or the anaesthetist's unit value in force (US-12.1.1). */
export interface LockedUnitRate {
  kind: 'contractFixedRate' | 'anaesthetistUnitValue'
  value: number
}

/** One split share as locked (22): who, the share as typed and the amount. */
export interface LockedShare {
  partyKey: string
  label: string
  amountExGst: number
  isRest: boolean
}

export interface ProcedureSnapshot {
  procedureId: ProcedureId
  /** The Procedure's values as at authorise. */
  procedure: {
    text: string | null
    invoiceDescription: string | null
    rvgCode: string | null
    billingReference?: string
    isPrimary: boolean
  }
  /** The Contract's settings as they stood, `pricing` cut to the range in force on the procedure date. Absent only on a migrated lock. */
  contract?: Contract
  /** The holder Party's name as it stood. */
  holderName?: string
  /** The RVG group as used (its base units and guide range). */
  rvgGroup?: RvgGroup
  /** The fee as recorded and priced: B, T and M with the modifier items, the units under the rule, the lines, the price. */
  fee?: FeeResult
  unitRate?: LockedUnitRate
  /** The Procedure's whole price, ex GST. */
  price: number
  /** The price was typed (by the anaesthetist or the office), not computed from the Contract. */
  typed: boolean
  /** The party the Procedure bills (the holder Party, or its own payer). */
  billedKey?: string
  split?: LockedShare[]
  charges: LockedCharge[]
}

/** A party one of the Booking's invoices goes to, as printed. */
export interface LockedParty {
  key: string
  ref: CounterpartyRef
  /** The addressee as printed: the payer's name, or the party's. */
  name: string
  /** A payer's BP id (22a's identity), or the patient's id. */
  billedTo?: InvoiceBilledTo
  delivery: DeliveryPlan
  layout: InvoiceLayout
  contractId?: ContractId
  holderReference?: string
  crossMatch?: InvoiceCrossMatch
  /** A migrated invoice's GST and total as printed (loaded as GST-inclusive totals); absent on every lock taken at authorise. */
  printed?: { gst: number; total: number }
}

export interface LockRejection {
  procedureId?: ProcedureId
  code: string
  message: string
}

export interface LockedPayee {
  /** The anaesthetist's registration number. */
  anaesthetistId: string
  name: string
  supplier: InvoiceSupplier
}

/** The patient as the invoice prints them ("For the care of"); never the NHI (D9: no NHI in billing data). */
export interface LockedPatient {
  name: string
}

export interface BookingLock {
  bookingId: string
  listId: string
  takenAtISO: string
  takenBy: string
  /** `migrated`: seeded history, locked from the invoice as loaded. */
  origin: 'authorise' | 'migrated'
  /** The procedure date that picked each fixed price's range in force (OQ-48). */
  pricingDateISO: string
  state: 'locked' | 'rejected'
  rejections: LockRejection[]
  payee: LockedPayee
  patient: LockedPatient
  /** The List's surgeon, for the holder layout's cross-match. */
  surgeonName?: string
  gstRate: number
  /** INTERIM until Phase 27: the pre-payment already invoiced per Procedure (ex GST), as at authorise. */
  prePaid: Record<ProcedureId, number>
  /** Checksum: the drafts' sum. */
  expected: { subtotal: number; gst: number; total: number }
  /** The Booking's units under the multi-procedure rule and its price, ex GST. */
  bookingUnits: number
  bookingPrice: number
  /** In display order (the primary first). */
  procedures: ProcedureSnapshot[]
  /** In first-appearance order. */
  parties: LockedParty[]
}

// ---------------------------------------------------------------------------
// Drafts (the invoice build's output; moved here from invoiceBuild.ts)
// ---------------------------------------------------------------------------

export type DraftInvoiceLine = InvoiceLineView

export interface DraftInvoice {
  counterparty: CounterpartyRef
  /** The payer's details as at authorise; only for the patient or another payer. */
  billedTo?: InvoiceBilledTo
  layout: InvoiceLayout
  lines: DraftInvoiceLine[]
  subtotal: number
  gst: number
  total: number
  /** The first Procedure's Contract, in display order (the primary first). */
  contractId?: ContractId
  /** The Procedures this invoice bills, in display order. */
  procedureIds: ProcedureId[]
  split?: InvoiceSplitInfo
  /** Indexes, in this result, of the drafts holding the other shares of the same split(s); the run resolves them to ids. */
  splitSiblings?: number[]
  holderReference?: string
  crossMatch?: InvoiceCrossMatch
  noCharge?: true
  /** How it goes out, as locked; absent on a pre-payment draft (the run's live rule). */
  delivery?: DeliveryPlan
}

export type BookingBuildResult =
  | { kind: 'invoices'; invoices: DraftInvoice[] }
  | { kind: 'exception'; procedureId: ProcedureId; code: string; message: string }

/** The context the builder reads: the Booking's billing context plus the run's own fields. */
export interface InvoiceBuildContext extends BookingBillingContext {
  patientId: string
  surgeonName?: string
  /** INTERIM until Phase 27: the pre-payment already invoiced per Procedure, with the party it was raised against. */
  prePaidByProcedure?: Record<ProcedureId, { amount: number; counterparty: CounterpartyRef }>
}

export interface LockInput {
  booking: Booking
  /** In Booking order. */
  procedures: readonly Procedure[]
  ctx: InvoiceBuildContext
  takenAtISO: string
  takenBy: string
  /** A party's name as it stands (the store's `counterpartyName`). */
  partyName: (ref: CounterpartyRef) => string
  origin?: BookingLock['origin']
}

/** The run's sentence for a Procedure with no Contract (US-04.3.4). */
export const NEEDS_INVOICE_DESTINATION_MESSAGE = 'This procedure needs an invoice destination.'

/** The run's sentence for a split on a prepaid Procedure (INTERIM until Phase 27). */
export const PREPAID_SPLIT_MESSAGE = 'A prepaid procedure is billed by its prepayment, so its fee cannot be split. Remove the split before rebilling.'

/** The run's sentence for a Booking with no lock. */
export const LOCK_MISSING_MESSAGE = 'This Booking has no locked billing record, so it is held back. A Booking is locked when its List is authorised.'

export const MIGRATED_LOCK_TEXT = 'Migrated history: locked from the invoice as loaded'

export function partyKeyOf(ref: CounterpartyRef): string {
  return `${ref.kind}:${ref.id}`
}

// ---------------------------------------------------------------------------
// Building the lock (from live data, once)
// ---------------------------------------------------------------------------

/** The Contract as it stood, with only the range in force on the date (a fixed price). */
export function contractAsLocked(contract: Contract, dateISO: string): Contract {
  if (contract.pricing.kind !== 'fixed') return { ...contract, pricing: { ...contract.pricing } }
  const range = rangeInForce(contract, dateISO)
  return { ...contract, pricing: { kind: 'fixed', ranges: range !== null ? [{ ...range }] : [] } }
}

function unitRateOf(contract: Contract | undefined, fee: FeeResult): LockedUnitRate | undefined {
  if (fee.unitRate === null) return undefined
  if (contract?.pricing.kind === 'rvgContractRate') return { kind: 'contractFixedRate', value: fee.unitRate }
  return { kind: 'anaesthetistUnitValue', value: fee.unitRate }
}

function rejected(base: Omit<BookingLock, 'state' | 'rejections' | 'procedures' | 'parties' | 'expected' | 'bookingUnits' | 'bookingPrice'>, rejection: LockRejection): BookingLock {
  return { ...base, state: 'rejected', rejections: [rejection], procedures: [], parties: [], expected: { subtotal: 0, gst: 0, total: 0 }, bookingUnits: 0, bookingPrice: 0 }
}

/**
 * The lock for one Booking, resolved once from live data (see the module
 * header). Warnings never block (15a): an out-of-guide base value or a child
 * payer locks as entered. It returns `rejected` only for what cannot be
 * priced or billed: no Contract, a missing one, "Needs a price", no party
 * to bill, a split that no longer fits, no primary, a negative group, or the
 * run's pre-flight; the authorise guard makes "Needs a price" unreachable.
 */
export function buildBookingLock(input: LockInput): BookingLock {
  const { booking, procedures, ctx } = input
  const base = {
    bookingId: booking.id,
    listId: booking.listId,
    takenAtISO: input.takenAtISO,
    takenBy: input.takenBy,
    origin: input.origin ?? ('authorise' as const),
    pricingDateISO: ctx.listDateISO,
    payee: { anaesthetistId: ctx.anaesthetist.registrationNumber, name: ctx.anaesthetist.name, supplier: supplierFor(ctx.anaesthetist) },
    patient: { name: ctx.patient?.name ?? '' },
    ...(ctx.surgeonName !== undefined ? { surgeonName: ctx.surgeonName } : {}),
    gstRate: GST_RATE,
    prePaid: Object.fromEntries(Object.entries(ctx.prePaidByProcedure ?? {}).map(([id, p]) => [id, roundToCents(p.amount)])),
  }

  // Every Procedure's Contract first, then the Booking priced once with them.
  const contracts = new Map<ProcedureId, Contract>()
  for (const procedure of procedures) {
    if (procedure.governingContractId === undefined) return rejected(base, { procedureId: procedure.id, code: 'noContract', message: NEEDS_INVOICE_DESTINATION_MESSAGE })
    const stored = ctx.contracts[procedure.governingContractId]
    if (stored === undefined) {
      return rejected(base, {
        procedureId: procedure.id,
        code: 'contractMissing',
        message: `The Contract ${procedure.governingContractId} on this procedure could not be found.`,
      })
    }
    if (procedureNeedsPrice(stored, ctx.listDateISO, procedure, ctx.held?.[procedure.id])) {
      return rejected(base, { procedureId: procedure.id, code: 'needsPrice', message: needsPriceMessage(stored, ctx.listDateISO, { named: true }) })
    }
    contracts.set(procedure.id, stored)
  }
  const priced = bookingFeesFor(procedures, ctx, (procedure) => contracts.get(procedure.id))
  if (priced.kind === 'structural') {
    return rejected(base, { procedureId: procedures[0]?.id ?? '', code: 'noPrimaryProcedure', message: `${NO_PRIMARY_MESSAGE}.` })
  }

  const snapshots: ProcedureSnapshot[] = []
  for (const procedure of inDisplayOrder(procedures)) {
    const contract = contracts.get(procedure.id)!
    const billed = billablePartyForProcedure(contract, procedure, booking.patientId, ctx.parties)
    if (billed === undefined) return rejected(base, { procedureId: procedure.id, code: 'noCounterparty', message: HOLDER_MISSING_MESSAGE })
    const fee = priced.fees[procedure.id]!
    const prePaid = ctx.prePaidByProcedure?.[procedure.id]
    if (prePaid !== undefined) {
      if (procedure.split !== undefined) return rejected(base, { procedureId: procedure.id, code: 'prepaidSplit', message: PREPAID_SPLIT_MESSAGE })
      if (prePaid.counterparty.kind !== billed.kind || prePaid.counterparty.id !== billed.id) {
        return rejected(base, {
          procedureId: procedure.id,
          code: 'prepaidCounterpartyChanged',
          message: 'This procedure was pre-invoiced to a different payer than it now bills to. Reallocate the pre-payment before rebilling the balance.',
        })
      }
    }

    const wording = procedure.invoiceDescription?.text ?? null
    const charges: LockedCharge[] = []
    let split: LockedShare[] | undefined
    if (procedure.split !== undefined) {
      // US-08.2.3: divide the final price between the split's parties; a split that no longer fits never bills a guess.
      if (!splitPartiesOn(procedure, booking.patientId, procedure.split.shares, ctx.parties)) {
        return rejected(base, { procedureId: procedure.id, code: 'splitDoesNotFit', message: splitDoesNotFitMessage(fee.total, PARTY_GONE_REASON) })
      }
      const resolved = resolveSplit(fee.total, procedure.split.shares)
      if (!resolved.ok) return rejected(base, { procedureId: procedure.id, code: 'splitDoesNotFit', message: splitDoesNotFitMessage(fee.total, resolved.reason) })
      const rvgLine = fee.lines.find((l) => l.chargeBasis === 'rvg' && l.rate !== undefined)
      const btm = rvgLine?.rate !== undefined ? btmOf(fee, rvgLine.rate) : undefined
      const lineWording = wording !== null && wording.trim() !== '' ? wording : (fee.lines[0]?.description ?? 'Anaesthesia')
      split = []
      for (const share of resolved.amounts) {
        const partyKey = partyKeyOf(share.party)
        split.push({ partyKey, label: shareLabel(share.basis), amountExGst: share.amountExGst, isRest: share.isRest })
        charges.push({
          partyKey,
          isContractParty: share.party.kind === billed.kind && share.party.id === billed.id,
          line: { procedureId: procedure.id, kind: 'fee', description: splitLineText(lineWording, fee.total, share.basis), amount: share.amountExGst, ...(btm !== undefined ? { btm } : {}) },
          split: { procedureId: procedure.id, feeExGst: fee.total, shareLabel: shareLabel(share.basis), isRest: share.isRest },
        })
      }
    } else {
      for (const view of invoiceLineViews('contractHolder', fee, { procedureId: procedure.id, wording })) {
        charges.push({ partyKey: partyKeyOf(billed), isContractParty: true, line: view })
      }
      // INTERIM until Phase 27 (D57 removes it): net any pre-payment already invoiced as a visible deduction line.
      if (prePaid !== undefined && prePaid.amount > 0) {
        charges.push({
          partyKey: partyKeyOf(billed),
          isContractParty: true,
          line: { procedureId: procedure.id, kind: 'adjustment', description: PREPAYMENT_DEDUCTION_DESCRIPTION, amount: -roundToCents(prePaid.amount) },
        })
      }
    }

    const group = groupOf(ctx.rvgGroups, procedure.rvgGroupId)
    const holder = ctx.parties[contract.holderId]
    const unitRate = unitRateOf(contract, fee)
    const heldBy: PriceHeldBy | null = fee.price.status === 'priced' ? fee.price.heldBy : null
    snapshots.push({
      procedureId: procedure.id,
      procedure: {
        text: procedure.procedureText?.text ?? null,
        invoiceDescription: wording,
        rvgCode: group?.code ?? null,
        ...(procedure.billingReference !== undefined ? { billingReference: procedure.billingReference } : {}),
        isPrimary: procedure.isPrimary,
      },
      contract: contractAsLocked(contract, ctx.listDateISO),
      ...(holder !== undefined ? { holderName: holder.name } : {}),
      ...(group !== undefined ? { rvgGroup: { ...group } } : {}),
      fee: lockedFee(fee),
      ...(unitRate !== undefined ? { unitRate } : {}),
      price: fee.total,
      typed: heldBy === 'typed',
      billedKey: partyKeyOf(billed),
      ...(split !== undefined ? { split } : {}),
      charges,
    })
  }

  // The parties in first-appearance order, each as its invoice prints it.
  const parties: LockedParty[] = []
  const firstCharge = new Map<string, { charge: LockedCharge; snapshot: ProcedureSnapshot }>()
  const ownCharge = new Map<string, ProcedureSnapshot>()
  const procedureIdsOf = new Map<string, ProcedureId[]>()
  for (const snapshot of snapshots) {
    for (const charge of snapshot.charges) {
      if (!firstCharge.has(charge.partyKey)) firstCharge.set(charge.partyKey, { charge, snapshot })
      if (!ownCharge.has(charge.partyKey) && charge.isContractParty && charge.split === undefined) ownCharge.set(charge.partyKey, snapshot)
      const ids = procedureIdsOf.get(charge.partyKey) ?? []
      if (!ids.includes(snapshot.procedureId)) ids.push(snapshot.procedureId)
      procedureIdsOf.set(charge.partyKey, ids)
    }
  }
  const refOf = (key: string): CounterpartyRef => {
    const at = key.indexOf(':')
    return { kind: key.slice(0, at) as CounterpartyRef['kind'], id: key.slice(at + 1) }
  }
  for (const [key, { charge, snapshot }] of firstCharge) {
    const ref = refOf(key)
    const groupProcedures = procedures.filter((p) => procedureIdsOf.get(key)?.includes(p.id) === true)
    const billedTo = billedToFor(ref, groupProcedures, booking.patientId, ctx.patient)
    // The run read delivery in the invoice's own order (display order, the primary first).
    const inInvoiceOrder = (procedureIdsOf.get(key) ?? []).flatMap((id) => procedures.filter((p) => p.id === id))
    const layout = invoiceLayoutFor(contracts.get(snapshot.procedureId), ref, charge.isContractParty)
    const own = ownCharge.get(key) ?? snapshot
    const ownContract = contracts.get(own.procedureId)
    const holderReference = layout === 'contractHolder' ? ownContract?.holderReference : undefined
    const firstProcedure = procedures.find((p) => p.id === procedureIdsOf.get(key)?.[0])
    parties.push({
      key,
      ref,
      name: billedTo?.name ?? input.partyName(ref),
      ...(billedTo !== undefined ? { billedTo } : {}),
      delivery: invoiceDeliveryFor(ref, inInvoiceOrder, booking.patientId, ctx.patient, ctx.parties),
      layout,
      ...(ownContract !== undefined ? { contractId: ownContract.id } : {}),
      ...(holderReference !== undefined && holderReference.trim() !== '' ? { holderReference } : {}),
      ...(layout === 'contractHolder' ? { crossMatch: crossMatchFor(ctx.listDateISO, ctx.surgeonName, firstProcedure?.billingReference) } : {}),
    })
  }

  const lock: BookingLock = {
    ...base,
    state: 'locked',
    rejections: [],
    expected: { subtotal: 0, gst: 0, total: 0 },
    bookingUnits: priced.units,
    bookingPrice: priced.total,
    procedures: snapshots,
    parties,
  }

  const drafts = invoiceDraftsFromLock(lock)
  if (drafts.kind === 'exception') return rejected(base, { procedureId: drafts.procedureId, code: drafts.code, message: drafts.message })
  // The run's pre-flight (21a): what completion no longer checks.
  const preflight = validateBookingForBilling(booking, procedures, ctx)[0]
  if (preflight !== undefined) return rejected(base, { procedureId: preflight.procedureId ?? '', code: 'preflight', message: preflight.message })
  lock.expected = sumDrafts(drafts.invoices)
  return lock
}

/** The fee as locked: the price read as held at AUTHORISED (the ladder's first rung), its computed figure kept beside it. */
function lockedFee(fee: FeeResult): FeeResult {
  const price = fee.price.status === 'priced' ? { ...fee.price, heldBy: 'authorised' as const } : fee.price
  return { ...fee, lines: fee.lines.map((l) => ({ ...l })), price }
}

function sumDrafts(drafts: readonly DraftInvoice[]): BookingLock['expected'] {
  const subtotal = roundToCents(drafts.reduce((s, d) => s + d.subtotal, 0))
  const gst = roundToCents(drafts.reduce((s, d) => s + d.gst, 0))
  return { subtotal, gst, total: roundToCents(drafts.reduce((s, d) => s + d.total, 0)) }
}

// ---------------------------------------------------------------------------
// Reading the lock (no live data)
// ---------------------------------------------------------------------------

/**
 * The Booking's invoices from its lock alone: one per party in first-appearance
 * order (FT-08.2, US-08.2.1; a payer by identity, never by name or email), the
 * split's shares on their parties' invoices, the lines and presentation as
 * locked, GST at the locked rate. A party whose lines net to below zero fails
 * the Booking (never a negative invoice); a fully netted pre-payment raises
 * none (INTERIM until 27); any other $0 group is a no-charge invoice (24).
 */
export function invoiceDraftsFromLock(lock: BookingLock): BookingBuildResult {
  if (lock.state === 'rejected') {
    const first = lock.rejections[0]
    return { kind: 'exception', procedureId: first?.procedureId ?? '', code: first?.code ?? 'rejected', message: first?.message ?? 'This Booking could not be locked.' }
  }
  interface Group { party: LockedParty; lines: DraftInvoiceLine[]; procedureIds: ProcedureId[]; split?: InvoiceSplitInfo; splitProcedureIds: Set<ProcedureId> }
  const groups = new Map<string, Group>(lock.parties.map((party) => [party.key, { party, lines: [], procedureIds: [], splitProcedureIds: new Set<ProcedureId>() }]))
  for (const snapshot of lock.procedures) {
    for (const charge of snapshot.charges) {
      const group = groups.get(charge.partyKey)
      if (group === undefined) continue
      group.lines.push(charge.line)
      const pid = charge.line.procedureId
      if (pid !== undefined && !group.procedureIds.includes(pid)) group.procedureIds.push(pid)
      if (charge.split !== undefined) {
        group.split ??= charge.split
        group.splitProcedureIds.add(charge.split.procedureId)
      }
    }
  }

  const kept: { group: Group; draft: DraftInvoice }[] = []
  for (const group of groups.values()) {
    if (group.lines.length === 0) continue
    const { party } = group
    const subtotal = roundToCents(group.lines.reduce((sum, l) => sum + l.amount, 0))
    if (subtotal < 0) {
      return {
        kind: 'exception',
        procedureId: group.lines[0]?.procedureId ?? '',
        code: 'negativeTotal',
        message: `The lines billed to one counterparty add up to a negative amount (${formatMoney(subtotal)}). Review the pre-payment or the price before rebilling; an overpaid pre-payment needs a manual credit.`,
      }
    }
    const netted = group.lines.some((l) => l.kind === 'adjustment' && l.description === PREPAYMENT_DEDUCTION_DESCRIPTION)
    if (toCents(subtotal) === 0 && netted) continue
    const noCharge = toCents(subtotal) === 0
    const gst = party.printed?.gst ?? roundToCents(subtotal * lock.gstRate)
    const lines = party.layout === 'contractHolder' ? group.lines.map((l) => ({ ...l })) : group.lines.map(withoutBtm)
    kept.push({
      group,
      draft: {
        counterparty: { ...party.ref },
        ...(party.billedTo !== undefined ? { billedTo: party.billedTo } : {}),
        layout: party.layout,
        lines,
        subtotal,
        gst,
        total: party.printed?.total ?? roundToCents(subtotal + gst),
        ...(party.contractId !== undefined ? { contractId: party.contractId } : {}),
        procedureIds: group.procedureIds,
        ...(group.split !== undefined ? { split: group.split } : {}),
        ...(party.holderReference !== undefined ? { holderReference: party.holderReference } : {}),
        ...(party.crossMatch !== undefined ? { crossMatch: party.crossMatch } : {}),
        ...(noCharge ? { noCharge: true as const } : {}),
        delivery: party.delivery,
      },
    })
  }
  kept.forEach(({ group, draft }, index) => {
    if (group.splitProcedureIds.size === 0) return
    const siblings = kept
      .map((other, i) => ({ other, i }))
      .filter(({ other, i }) => i !== index && [...group.splitProcedureIds].some((pid) => other.group.splitProcedureIds.has(pid)))
      .map(({ i }) => i)
    if (siblings.length > 0) draft.splitSiblings = siblings
  })
  return { kind: 'invoices', invoices: kept.map((k) => k.draft) }
}

function withoutBtm(line: DraftInvoiceLine): DraftInvoiceLine {
  if (line.btm === undefined) return { ...line }
  const { btm: _btm, ...rest } = line
  return rest
}

export interface LockedPrice {
  units: number
  total: number
  procedures: Record<ProcedureId, { price: number; units: number }>
}

/** The Booking's price from its lock alone (US-05.3.5: units and dollars per Procedure). */
export function priceBookingFromLock(lock: BookingLock): LockedPrice {
  const procedures: LockedPrice['procedures'] = {}
  for (const s of lock.procedures) procedures[s.procedureId] = { price: s.price, units: s.fee?.billableUnits ?? 0 }
  return { units: lock.bookingUnits, total: lock.bookingPrice, procedures }
}

// ---------------------------------------------------------------------------
// Regenerate: compare a stored invoice with its draft
// ---------------------------------------------------------------------------

export interface InvoiceDifference {
  field: string
  stored: string
  regenerated: string
}

export interface InvoiceComparison {
  identical: boolean
  differences: InvoiceDifference[]
}

/** A compared value in words: a line as "description, n units, $amount", an addressee by name, a figure as money. */
function show(value: unknown): string {
  if (value === undefined || value === null) return 'none'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return formatMoney(value)
  if (typeof value === 'object') {
    const v = value as { description?: string; units?: number | null; amount?: number; name?: string; method?: string; to?: string; lines?: string[] }
    if (v.description !== undefined && v.amount !== undefined) return `${v.description}${v.units != null ? `, ${v.units} units` : ''}, ${formatMoney(v.amount)}`
    if (v.name !== undefined) return v.name
    if (v.method === 'email') return `email to ${v.to ?? ''}`
    if (v.method === 'post') return `post to ${(v.lines ?? []).join(', ')}`
    if (v.method === 'none') return 'no address'
  }
  return JSON.stringify(value)
}

/** The delivery a stored invoice was raised with, as the plan that made it. */
export function deliveryPlanOf(invoice: Pick<Invoice, 'delivery'>): DeliveryPlan | undefined {
  const d = invoice.delivery
  if (d === undefined) return undefined
  if (d.status === 'sent') return { method: 'email', to: d.sends[0]?.to ?? '' }
  if (d.status === 'toPost') return { method: 'post', lines: [...d.address] }
  return { method: 'none' }
}

/**
 * Compare a stored invoice (and its lines) with the draft the lock makes for
 * the same party (US-08.4.4): party, addressee, supplier, layout, delivery,
 * every line, subtotal, GST and total. The patient line prints from the lock
 * on both, so it cannot differ.
 */
export function compareInvoice(
  stored: Invoice,
  storedLines: readonly Pick<InvoiceLine, 'procedureId' | 'kind' | 'description' | 'units' | 'amount' | 'btm'>[],
  draft: DraftInvoice,
  payee?: LockedPayee,
): InvoiceComparison {
  const differences: InvoiceDifference[] = []
  const check = (field: string, a: unknown, b: unknown) => {
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) differences.push({ field, stored: show(a), regenerated: show(b) })
  }
  check('Party', partyKeyOf(stored.counterparty), partyKeyOf(draft.counterparty))
  check('Addressee', stored.billedTo, draft.billedTo)
  if (payee !== undefined) check('Supplier', stored.supplier, payee.supplier)
  check('Layout', stored.layout, draft.layout)
  // A Resend can email an invoice the run raised to post or with no address: the office's later send, not the recipe.
  const resentByOffice = stored.delivery?.status === 'sent' && draft.delivery !== undefined && draft.delivery.method !== 'email'
  if (draft.delivery !== undefined && stored.delivery !== undefined && !resentByOffice) check('Delivery', deliveryPlanOf(stored), draft.delivery)
  check('Holder reference', stored.holderReference, draft.holderReference)
  check('Cross-match', stored.crossMatch, draft.crossMatch)
  check('Split', stored.split, draft.split)
  check('No charge', stored.noCharge === true, draft.noCharge === true)
  const lineOf = (l: Pick<InvoiceLine, 'procedureId' | 'kind' | 'description' | 'units' | 'amount' | 'btm'>) => ({
    procedureId: l.procedureId ?? null,
    kind: l.kind ?? 'fee',
    description: l.description,
    units: l.units ?? null,
    amount: roundToCents(l.amount),
    btm: l.btm ?? null,
  })
  const count = Math.max(storedLines.length, draft.lines.length)
  for (let i = 0; i < count; i++) {
    const a = storedLines[i]
    const b = draft.lines[i]
    check(`Line ${i + 1}`, a !== undefined ? lineOf(a) : undefined, b !== undefined ? lineOf(b) : undefined)
  }
  check('Subtotal', roundToCents(stored.subtotal), draft.subtotal)
  check('GST', roundToCents(stored.gst), draft.gst)
  check('Total', roundToCents(stored.total), draft.total)
  return { identical: differences.length === 0, differences }
}

// ---------------------------------------------------------------------------
// Migrated history (seeded AUTHORISED Lists whose invoices were loaded)
// ---------------------------------------------------------------------------

/**
 * A lock for a seeded history Booking, frozen from its invoices as loaded
 * (not the live pricing path): each stored line becomes a fixed charge on its
 * party, with the party and its presentation as printed and the payee the
 * List's anaesthetist. The Procedures' fees (for display) come from
 * `displayFrom`, a lock built for the same Booking with each price held at its
 * invoiced amount, when it locked; else the snapshot carries the price only.
 */
export function migratedLockFromInvoices(args: {
  bookingId: string
  listId: string
  pricingDateISO: string
  takenAtISO: string
  payee: LockedPayee
  patient: LockedPatient
  invoices: readonly Invoice[]
  lines: readonly InvoiceLine[]
  displayFrom?: BookingLock
}): BookingLock {
  const parties: LockedParty[] = []
  const charges = new Map<ProcedureId, LockedCharge[]>()
  const order: ProcedureId[] = []
  for (const invoice of [...args.invoices].sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))) {
    let key = partyKeyOf(invoice.counterparty)
    while (parties.some((p) => p.key === key)) key = `${key}#${parties.length}`
    parties.push({
      key,
      ref: { ...invoice.counterparty },
      name: invoice.billedTo?.name ?? invoice.counterparty.id,
      ...(invoice.billedTo !== undefined ? { billedTo: invoice.billedTo } : {}),
      delivery: deliveryPlanOf(invoice) ?? { method: 'none' },
      layout: invoice.layout,
      ...(invoice.holderReference !== undefined ? { holderReference: invoice.holderReference } : {}),
      ...(invoice.crossMatch !== undefined ? { crossMatch: invoice.crossMatch } : {}),
      printed: { gst: invoice.gst, total: invoice.total },
    })
    for (const line of args.lines.filter((l) => l.invoiceId === invoice.id).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))) {
      const pid = line.procedureId ?? ''
      if (!charges.has(pid)) {
        charges.set(pid, [])
        order.push(pid)
      }
      charges.get(pid)!.push({
        partyKey: key,
        isContractParty: true,
        line: {
          ...(line.procedureId !== undefined ? { procedureId: line.procedureId } : {}),
          kind: line.kind ?? 'fee',
          description: line.description,
          amount: line.amount,
          ...(line.units !== undefined ? { units: line.units } : {}),
          ...(line.btm !== undefined ? { btm: line.btm } : {}),
        },
      })
    }
  }
  const display = args.displayFrom?.state === 'locked' ? args.displayFrom : undefined
  const procedures: ProcedureSnapshot[] = order.map((pid) => {
    const shown = display?.procedures.find((s) => s.procedureId === pid)
    const own = charges.get(pid) ?? []
    const price = roundToCents(own.filter((c) => c.line.description !== PREPAYMENT_DEDUCTION_DESCRIPTION).reduce((s, c) => s + c.line.amount, 0))
    return {
      procedureId: pid,
      procedure: shown?.procedure ?? { text: null, invoiceDescription: null, rvgCode: null, isPrimary: order[0] === pid },
      ...(shown?.contract !== undefined ? { contract: shown.contract } : {}),
      ...(shown?.holderName !== undefined ? { holderName: shown.holderName } : {}),
      ...(shown?.rvgGroup !== undefined ? { rvgGroup: shown.rvgGroup } : {}),
      ...(shown?.fee !== undefined ? { fee: shown.fee } : {}),
      ...(shown?.unitRate !== undefined ? { unitRate: shown.unitRate } : {}),
      price,
      typed: false,
      billedKey: own[0]?.partyKey ?? '',
      charges: own,
    }
  })
  const lock: BookingLock = {
    bookingId: args.bookingId,
    listId: args.listId,
    takenAtISO: args.takenAtISO,
    takenBy: MIGRATED_LOCK_TEXT,
    origin: 'migrated',
    pricingDateISO: args.pricingDateISO,
    state: 'locked',
    rejections: [],
    payee: args.payee,
    patient: args.patient,
    gstRate: GST_RATE,
    prePaid: {},
    expected: { subtotal: 0, gst: 0, total: 0 },
    bookingUnits: display?.bookingUnits ?? 0,
    bookingPrice: roundToCents(procedures.reduce((s, p) => s + p.price, 0)),
    procedures,
    parties,
  }
  const drafts = invoiceDraftsFromLock(lock)
  if (drafts.kind === 'invoices') lock.expected = sumDrafts(drafts.invoices)
  return lock
}

// ---------------------------------------------------------------------------
// The one view every screen reads
// ---------------------------------------------------------------------------

export interface LockProcedureView {
  procedureId: ProcedureId
  /** The Procedure as the invoice names it: its invoice description, else its procedure text. */
  label?: string
  contractId?: ContractId
  contractName?: string
  contractAaCode?: string
  holderName?: string
  /** The Contract's pricing as locked (the UI words it with the shared contract labels). */
  pricing?: Contract['pricing']
  billsTo?: Contract['billsTo']
  prepaid: boolean
  /** A fixed price's range in force: "From 1 Jul 2026, $3,100.00". */
  rangeText?: string
  /** "@ $26.50/unit (locked)" or "@ $93.47/unit (Contract rate, locked)" for an RVG kind; absent otherwise. */
  rateText?: string
  /** "9 units @ $26.50/unit (locked), less 10%": the price's basis, one line for every screen. */
  basisText?: string
  unitRate?: LockedUnitRate
  units: number
  price: number
  typed: boolean
  outOfGuideRange: boolean
  /** Who the Procedure bills, as printed. */
  billedName?: string
  /** "Full", or "Split: $132.50 to nib, the rest to Alan Prentice". */
  splitText: string
}

export interface LockView {
  origin: BookingLock['origin']
  state: BookingLock['state']
  rejection?: string
  takenAtISO: string
  takenBy: string
  pricingDateISO: string
  payeeName: string
  /** The supplier block the invoice prints (the payee's). */
  supplier: InvoiceSupplier
  /** "For the care of": the patient as printed. */
  patientName: string
  /** Each billed party's name as printed, by `partyKeyOf`. */
  addressees: Record<string, string>
  total: number
  procedures: LockProcedureView[]
  /** The one Procedure asked for, when given. */
  procedure?: LockProcedureView
}

/** The locked badge's words (all three apps). */
export const LOCK_BADGE_TEXT = 'Contract locked at authorise'

/** "Locked Tue 21 Jul, 10:42 by Kirsty W.", or the migrated history's words: the badge's detail line. */
export function lockStampText(view: Pick<LockView, 'origin' | 'takenAtISO' | 'takenBy'>): string {
  return view.origin === 'migrated' ? MIGRATED_LOCK_TEXT : `Locked ${stampText(view.takenAtISO)} by ${view.takenBy}`
}

function rangeTextOf(contract: Contract | undefined): string | undefined {
  if (contract?.pricing.kind !== 'fixed') return undefined
  const range = contract.pricing.ranges[0]
  return range !== undefined ? `From ${dayWithYear(range.startISO)}, ${formatMoney(range.price)}` : undefined
}

/** The lock as every screen reads it (`procedureId` picks one Procedure's view too). */
export function lockViewFor(lock: BookingLock, procedureId?: ProcedureId): LockView {
  const nameOf = (key: string | undefined) => lock.parties.find((p) => p.key === key)?.name
  const procedures = lock.procedures.map((s): LockProcedureView => {
    const contract = s.contract
    const rateText =
      s.unitRate === undefined
        ? undefined
        : s.unitRate.kind === 'contractFixedRate'
          ? `@ ${formatMoney(s.unitRate.value)}/unit (Contract rate, locked)`
          : `@ ${formatMoney(s.unitRate.value)}/unit (locked)`
    const discountPercent = contract?.pricing.kind === 'rvgDiscount' ? contract.pricing.discountPct : undefined
    const units = s.fee?.billableUnits ?? s.charges.reduce((n, c) => n + (c.line.units ?? 0), 0)
    const rangeText = rangeTextOf(contract)
    const basisText = rateText !== undefined ? `${units} units ${rateText}${discountPercent !== undefined ? `, less ${discountPercent}%` : ''}` : rangeText
    const billedName = nameOf(s.billedKey)
    const label = s.procedure.invoiceDescription ?? s.procedure.text ?? undefined
    return {
      procedureId: s.procedureId,
      ...(label !== undefined && label !== null ? { label } : {}),
      ...(contract !== undefined ? { contractId: contract.id, contractName: contract.name, contractAaCode: contract.aaCode, pricing: contract.pricing, billsTo: contract.billsTo } : {}),
      prepaid: contract?.prepaid === true,
      ...(s.holderName !== undefined ? { holderName: s.holderName } : {}),
      ...(rangeText !== undefined ? { rangeText } : {}),
      ...(rateText !== undefined ? { rateText } : {}),
      ...(basisText !== undefined ? { basisText } : {}),
      ...(s.unitRate !== undefined ? { unitRate: s.unitRate } : {}),
      units,
      price: s.price,
      typed: s.typed,
      outOfGuideRange: s.fee?.btm.baseOutsideGuide === true,
      ...(billedName !== undefined ? { billedName } : {}),
      splitText: s.split === undefined ? 'Full' : `Split: ${s.split.map((share) => `${share.isRest ? 'the rest' : share.label} to ${nameOf(share.partyKey) ?? share.partyKey}`).join(', ')}`,
    }
  })
  const one = procedureId !== undefined ? procedures.find((p) => p.procedureId === procedureId) : undefined
  return {
    origin: lock.origin,
    state: lock.state,
    ...(lock.state === 'rejected' && lock.rejections[0] !== undefined ? { rejection: lock.rejections[0].message } : {}),
    takenAtISO: lock.takenAtISO,
    takenBy: lock.takenBy,
    pricingDateISO: lock.pricingDateISO,
    payeeName: lock.payee.name,
    supplier: lock.payee.supplier,
    patientName: lock.patient.name,
    addressees: Object.fromEntries(lock.parties.map((p) => [partyKeyOf(p.ref), p.name])),
    total: lock.expected.total,
    procedures,
    ...(one !== undefined ? { procedure: one } : {}),
  }
}

/** The Contracts a lock's Procedures were priced on (the History tab's "locked against"). */
export function lockedContractIds(lock: BookingLock): ContractId[] {
  return [...new Set(lock.procedures.flatMap((s) => (s.contract !== undefined ? [s.contract.id] : [])))]
}

/** The held AUTHORISED price per Procedure from a lock: the price ladder's first rung (24's `priceFor`). */
export function authorisedPricesFromLock(lock: BookingLock | undefined): Record<ProcedureId, HeldPrices> {
  const out: Record<ProcedureId, HeldPrices> = {}
  if (lock === undefined || lock.state !== 'locked') return out
  for (const s of lock.procedures) out[s.procedureId] = { authorised: s.price }
  return out
}


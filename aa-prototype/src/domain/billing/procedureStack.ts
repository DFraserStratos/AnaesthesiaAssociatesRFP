/**
 * The procedure stack (catch-up Phase 20a; US-03.1.9, US-03.1.2, US-02.5.7,
 * US-08.4.6, DM-51): the one place that decides what each Procedure shows on
 * every booking screen, and the rules for its two texts.
 *
 * - The procedure text: one per Procedure, exactly as received. The
 *   hospital's replaces the rooms'; the replaced text goes to the change
 *   history (`replacesProcedureText` decides; the store writes).
 * - The invoice description: the order of defaults (D37; AR-58 2.7), each
 *   replacing the one before: the Procedure's text, then the chosen
 *   Contract's invoice description where it is filled in. The RVG code plays
 *   no part. An admin's edit always wins (D73).
 * - The view the `ProcedureStack` component renders: the text with its
 *   source, the invoice description with its origin and any newer default,
 *   the Contract (name, holder, who is invoiced, pricing basis) and the RVG
 *   code. "Who is invoiced" and "pricing basis" are one function each, so
 *   Phase 21 (the payer) and Phase 24 (the one price precedence) re-point
 *   them without touching the component.
 *
 * The flat Contract model (AR-61 `contract`, `pricing-kind`, `procedure`,
 * `who-is-billed`): no Contract lines, versions or staged changes. Pure: no
 * React, no store.
 */

import type {
  Booking,
  CounterpartyRef,
  InvoiceDescription,
  InvoiceDescriptionOrigin,
  ContractId,
  IsoDateTime,
  Procedure,
  ProcedureText,
  ProcedureTextSource,
} from '../types'
import type { Contract } from './contracts'
import { isRvgKind } from './contracts'
import type { Party, PartyId } from './parties'
import { rangeInForce } from './priceRanges'
import type { RvgGroup, RvgGroupId } from './rvgGroups'
import { billablePartyForProcedure } from './whoIsBilled'

// ---------------------------------------------------------------------------
// Types the UI reads
// ---------------------------------------------------------------------------

/** Who the Procedure's invoice goes to, by name. */
export interface InvoicedParty {
  name: string
  kind: 'holder' | 'patient' | 'payer'
}

/**
 * The Contract's pricing basis with its figure, one member per pricing kind
 * (18's names). The basis, never the computed fee.
 */
export type PricingBasis =
  | { kind: 'rvgAnaesthetistRate' }
  | { kind: 'rvgContractRate'; perUnit: number }
  | { kind: 'rvgDiscount'; percent: number }
  | { kind: 'fixed'; amount: number | null }
  | { kind: 'open'; amount: number | null }

/** The surface a view is drawn for: the office's or the anaesthetist's. */
export type StackSurface = 'office' | 'anaesthetist'

export interface ProcedureStackView {
  procedureText: ProcedureText | null
  invoiceDescription:
    | { text: string; origin: InvoiceDescriptionOrigin; newer?: { text: string; origin: InvoiceDescriptionOrigin } }
    | null
  contract: {
    id: ContractId
    name: string
    aaCode?: string
    holderName: string
    invoiced: InvoicedParty | null
    basis: PricingBasis
  } | null
  /**
   * The RVG code wherever one is held; `toChoose` (the anaesthetist's
   * surface) or `forAnaesthetist` (the office's: the step rail's hand-off)
   * where an RVG kind, or no Contract yet, needs one; null on a fixed or
   * open price with none picked (the code is optional there).
   */
  rvg: { code: string; description: string } | 'toChoose' | 'forAnaesthetist' | null
}

/** What the view needs, gathered by the caller (the store's selector). */
export interface ProcedureStackCtx {
  contracts: Readonly<Record<string, Contract>>
  parties: Readonly<Record<PartyId, Party>>
  rvgGroups: Readonly<Record<RvgGroupId, RvgGroup>>
  /** The Booking's payer and patient: who a Contract that bills the payer bills (catch-up Phase 21). */
  booking: Pick<Booking, 'payer' | 'patientId'>
  /** The procedure date: the List's. */
  dateISO: string
  surface: StackSurface
  /** Names a party the invoice goes to (the store's `counterpartyName`). */
  nameOf: (ref: CounterpartyRef) => string
}

// ---------------------------------------------------------------------------
// The procedure text
// ---------------------------------------------------------------------------

/** The three kinds of text the order of defaults knows. */
export function procedureTextKind(source: ProcedureTextSource): 'rooms' | 'hospital' | 'entered' {
  switch (source) {
    case 'surgeonPdf':
    case 'email':
      return 'rooms'
    case 'hospitalDownload':
    case 'hospitalFeed':
      return 'hospital'
    case 'phone':
    case 'anaesthetist':
    case 'unrecorded':
      return 'entered'
  }
}

/** True when the text is blank: whitespace only. Such a text is never stored. */
export function isBlankText(text: string | null | undefined): boolean {
  return text === undefined || text === null || text.trim() === ''
}

/**
 * Whether an incoming text replaces the held one (US-02.5.7). A different
 * text replaces it with no check against the wording; an identical text
 * never does (a replayed message changes nothing). Our reading, logged: a
 * rooms' text never replaces a hospital's (the hospital's is the source of
 * truth, Ben, 5 November), so a rooms' PDF arriving after the hospital's
 * list leaves it.
 */
export function replacesProcedureText(
  current: Pick<ProcedureText, 'text' | 'source'> | null,
  incoming: Pick<ProcedureText, 'text' | 'source'>,
): boolean {
  if (isBlankText(incoming.text)) return false
  if (current === null) return true
  if (current.text === incoming.text) return false
  if (procedureTextKind(current.source) === 'hospital' && procedureTextKind(incoming.source) === 'rooms') return false
  return true
}

// ---------------------------------------------------------------------------
// The invoice description (US-08.4.6, D37, D73)
// ---------------------------------------------------------------------------

/**
 * D37's order of defaults, each replacing the one before: the Procedure's
 * text (the rooms', the hospital's when it replaced them, or a hand-entered
 * Booking's text, our reading: it stands in for the rooms' at the bottom
 * layer), replaced by the chosen Contract's invoice description where it is
 * filled in (a blank one falls through). Null when there is neither. It takes
 * no RVG code, so the code and its group can play no part.
 */
export function startingInvoiceDescription(
  procedureText: Pick<ProcedureText, 'text' | 'source'> | null,
  contractDescription?: string | null,
): InvoiceDescription | null {
  if (!isBlankText(contractDescription)) return { text: contractDescription as string, origin: 'contract' }
  if (procedureText !== null && !isBlankText(procedureText.text)) {
    return { text: procedureText.text, origin: procedureTextKind(procedureText.source) }
  }
  return null
}

/**
 * The one helper every path calls when the text arrives or the Contract
 * changes (this phase's intake, 19a's and 20's Contract actions; 33 and 35
 * later). It returns the default, unless the office has edited the
 * description: an admin's edit always wins (D73), over a late hospital text
 * and over a Contract chosen or changed. The view then shows the newer
 * default as a cue; it never applies itself.
 */
export function refreshInvoiceDescription(
  current: InvoiceDescription | null,
  procedureText: Pick<ProcedureText, 'text' | 'source'> | null,
  contractDescription?: string | null,
): InvoiceDescription | null {
  if (current !== null && current.origin === 'edited') return current
  return startingInvoiceDescription(procedureText, contractDescription)
}

/** The Contract's invoice description for a Procedure, or null (none chosen, or none filled in). */
export function contractInvoiceDescriptionFor(
  procedure: Pick<Procedure, 'governingContractId'>,
  contracts: Readonly<Record<string, Pick<Contract, 'invoiceDescription'>>>,
): string | null {
  if (procedure.governingContractId === undefined) return null
  return contracts[procedure.governingContractId]?.invoiceDescription ?? null
}

/** The default the order gives the Procedure now, from its text and its Contract. */
export function defaultInvoiceDescriptionFor(
  procedure: Pick<Procedure, 'procedureText' | 'governingContractId'>,
  contracts: Readonly<Record<string, Pick<Contract, 'invoiceDescription'>>>,
): InvoiceDescription | null {
  return startingInvoiceDescription(procedure.procedureText, contractInvoiceDescriptionFor(procedure, contracts))
}

/**
 * The Procedure's invoice description after a change to its text or its
 * Contract: `refreshInvoiceDescription` over its fields.
 */
export function refreshedInvoiceDescriptionFor(
  procedure: Pick<Procedure, 'procedureText' | 'governingContractId' | 'invoiceDescription'>,
  contracts: Readonly<Record<string, Pick<Contract, 'invoiceDescription'>>>,
): InvoiceDescription | null {
  return refreshInvoiceDescription(
    procedure.invoiceDescription,
    procedure.procedureText,
    contractInvoiceDescriptionFor(procedure, contracts),
  )
}

/**
 * The newer default the office has not used, when its edit holds: shown as a
 * cue ("A newer description has arrived"), never applied. Absent when the
 * description is not an edit, or the default is what it was when edited.
 */
export function newerInvoiceDescription(
  procedure: Pick<Procedure, 'procedureText' | 'governingContractId' | 'invoiceDescription'>,
  contracts: Readonly<Record<string, Pick<Contract, 'invoiceDescription'>>>,
): { text: string; origin: InvoiceDescriptionOrigin } | undefined {
  const current = procedure.invoiceDescription
  if (current === null || current.origin !== 'edited') return undefined
  const fallback = defaultInvoiceDescriptionFor(procedure, contracts)
  if (fallback === null) return undefined
  if (fallback.text === (current.editedOver ?? '')) return undefined
  if (fallback.text === current.text) return undefined
  return { text: fallback.text, origin: fallback.origin }
}

// ---------------------------------------------------------------------------
// The Contract part
// ---------------------------------------------------------------------------

/**
 * Who the Procedure's invoice goes to, by name: the one rule,
 * `billablePartyForProcedure` (catch-up Phase 21; AR-61 `who-is-billed`):
 * the holder's Party when its Contract bills its holder, otherwise the payer
 * on the Booking (the patient, or another payer). Never a second derivation.
 */
export function whoIsInvoicedFor(
  procedure: Pick<Procedure, 'governingContractId'>,
  ctx: Pick<ProcedureStackCtx, 'contracts' | 'parties' | 'booking' | 'nameOf'>,
): InvoicedParty | null {
  const contract = procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
  const ref = billablePartyForProcedure(contract, ctx.booking, ctx.parties)
  if (ref === undefined) return null
  const kind: InvoicedParty['kind'] = ref.kind === 'patient' ? 'patient' : ref.kind === 'payer' ? 'payer' : 'holder'
  return { name: ctx.nameOf(ref), kind }
}

/**
 * The Contract's pricing basis with its figure: the pricing kind (18), the
 * price range in force on the procedure date for a fixed price (19a), the
 * amount typed on an open price (20's `enteredPrice`); No contract · RVG is
 * RVG at the anaesthetist's rate. INTERIM: Phase 24 re-points it to the one
 * price precedence. The basis, never the computed fee.
 */
export function pricingBasisFor(
  procedure: Pick<Procedure, 'enteredPrice'>,
  contract: Contract,
  dateISO: string,
): PricingBasis {
  const pricing = contract.pricing
  switch (pricing.kind) {
    case 'rvgAnaesthetistRate':
      return { kind: 'rvgAnaesthetistRate' }
    case 'rvgContractRate':
      return { kind: 'rvgContractRate', perUnit: pricing.unitRate }
    case 'rvgDiscount':
      return { kind: 'rvgDiscount', percent: pricing.discountPct }
    case 'fixed':
      return { kind: 'fixed', amount: rangeInForce(contract, dateISO)?.price ?? null }
    case 'open':
      return { kind: 'open', amount: procedure.enteredPrice ?? null }
  }
}

// ---------------------------------------------------------------------------
// The view
// ---------------------------------------------------------------------------

/** Everything the `ProcedureStack` component shows for one Procedure. */
export function procedureStackView(procedure: Procedure, ctx: ProcedureStackCtx): ProcedureStackView {
  const contract = procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined

  const description = procedure.invoiceDescription
  const newer = newerInvoiceDescription(procedure, ctx.contracts)
  const invoiceDescription =
    description === null
      ? null
      : { text: description.text, origin: description.origin, ...(newer !== undefined ? { newer } : {}) }

  const group = procedure.rvgGroupId !== undefined ? ctx.rvgGroups[procedure.rvgGroupId] : undefined
  const needsCode = contract === undefined || isRvgKind(contract.pricing.kind)
  const rvg: ProcedureStackView['rvg'] =
    group !== undefined
      ? { code: group.code, description: group.description }
      : needsCode
        ? ctx.surface === 'office'
          ? 'forAnaesthetist'
          : 'toChoose'
        : null

  return {
    procedureText: procedure.procedureText,
    invoiceDescription,
    contract:
      contract === undefined
        ? null
        : {
            id: contract.id,
            name: contract.name,
            ...(contract.aaCode !== '' ? { aaCode: contract.aaCode } : {}),
            holderName: ctx.parties[contract.holderId]?.name ?? 'Unknown holder',
            invoiced: whoIsInvoicedFor(procedure, ctx),
            basis: pricingBasisFor(procedure, contract, ctx.dateISO),
          },
    rvg,
  }
}

// ---------------------------------------------------------------------------
// The short label
// ---------------------------------------------------------------------------

const LABEL_MAX = 40

/**
 * The short label every list, total, history scope and sheet title uses: the
 * Procedure's text, shortened; else its RVG code and description;
 * else "Procedure n".
 */
export function procedureLabel(
  procedure: Pick<Procedure, 'procedureText' | 'rvgGroupId'>,
  rvgGroups: Readonly<Record<RvgGroupId, Pick<RvgGroup, 'code' | 'description'>>>,
  ordinal: number,
): string {
  const text = procedure.procedureText?.text
  if (text !== undefined && !isBlankText(text)) {
    const flat = text.trim().replace(/\s+/g, ' ')
    const short = flat.length > LABEL_MAX ? `${flat.slice(0, LABEL_MAX - 1).trimEnd()}…` : flat
    return short
  }
  const group = procedure.rvgGroupId !== undefined ? rvgGroups[procedure.rvgGroupId] : undefined
  if (group !== undefined) return `${group.code} · ${group.description}`
  return `Procedure ${ordinal}`
}

/** Stamp an incoming text (the store's constructor; the seed's is `seedText`). */
export function procedureTextOf(
  text: string,
  source: ProcedureTextSource,
  receivedAtISO: IsoDateTime,
  from?: string,
): ProcedureText {
  return { text, source, receivedAtISO, ...(from !== undefined && from !== '' ? { from } : {}) }
}

/**
 * The invoice's lines grouped under one heading row per Procedure (catch-up
 * Phase 20a; US-08.4.6): each Procedure's lines in their first-appearance
 * order, under its invoice description (no heading when it has none), and any
 * line not tied to a Procedure after them with no heading. Line text, amounts
 * and totals are untouched; Phase 22 owns the layout.
 */
export function invoiceLineGroups<L extends { procedureId?: string }>(
  lines: readonly L[],
  procedures: Readonly<Record<string, Pick<Procedure, 'invoiceDescription'>>>,
): { procedureId?: string; heading?: string; lines: L[] }[] {
  const groups: { procedureId?: string; heading?: string; lines: L[] }[] = []
  const byProcedure = new Map<string, { procedureId?: string; heading?: string; lines: L[] }>()
  const loose: L[] = []
  for (const line of lines) {
    if (line.procedureId === undefined) {
      loose.push(line)
      continue
    }
    let group = byProcedure.get(line.procedureId)
    if (group === undefined) {
      const heading = procedures[line.procedureId]?.invoiceDescription?.text
      group = { procedureId: line.procedureId, ...(heading !== undefined && heading.trim() !== '' ? { heading } : {}), lines: [] }
      byProcedure.set(line.procedureId, group)
      groups.push(group)
    }
    group.lines.push(line)
  }
  if (loose.length > 0) groups.push({ lines: loose })
  return groups
}

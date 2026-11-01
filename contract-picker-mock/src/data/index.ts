import linesJson from './generated/lines.json'
import proceduresJson from './generated/procedures.json'
import rvgJson from './generated/rvgCodes.json'
import { CONTRACTS } from './contracts'
import { PREPAY_LINES } from './prepayLists'
import { FAMILY_BY_ID, familiesOf } from './mappings'
import type { Contract, Line, Procedure, RvgCode, Scenario } from './types'

export * from './types'
export { ANAESTHETISTS, CONTRACTS, HOSPITALS, SURGEONS } from './contracts'
export { SCENARIOS } from './scenarios'

export interface MappedLine extends Line {
  families: string[]
  /** RVG groups this line answers to in a reverse lookup (never used for base units). */
  rvgs: string[]
}

export interface MappedProcedure extends Procedure {
  families: string[]
}

export const LINES: MappedLine[] = [...(linesJson as Line[]), ...PREPAY_LINES].map((l) => {
  const families = familiesOf(l.description)
  return { ...l, families, rvgs: [...new Set(families.map((f) => FAMILY_BY_ID.get(f)!.rvg))] }
})

export const PROCEDURES: MappedProcedure[] = (proceduresJson as Procedure[]).map((p) => ({ ...p, families: familiesOf(p.name) }))

export const RVG_CODES: RvgCode[] = rvgJson as RvgCode[]

export const CONTRACT_BY_ID = new Map(CONTRACTS.map((c) => [c.id, c]))
export const LINE_BY_ID = new Map(LINES.map((l) => [l.id, l]))
export const RVG_BY_CODE = new Map(RVG_CODES.map((r) => [r.code, r]))

export const LINES_BY_CONTRACT = new Map<string, MappedLine[]>()
for (const l of LINES) {
  const list = LINES_BY_CONTRACT.get(l.contract) ?? []
  list.push(l)
  LINES_BY_CONTRACT.set(l.contract, list)
}

export function linesOf(contractId: string): MappedLine[] {
  return LINES_BY_CONTRACT.get(contractId) ?? []
}

// ── Context: which Contracts fit the List ───────────────────────────────────

export type Fit = 'default' | 'hospital' | 'surgeon' | 'anaesthetist' | 'insurer' | 'none'

/** Is the Contract in force on the List's day? */
export const inForce = (c: Contract, s: Scenario) => (!c.validFrom || c.validFrom <= s.day) && (!c.validTo || s.day <= c.validTo)

/**
 * Why a Contract is offered on this List: it is the List's hospital's, or linked
 * to the List's surgeon or anaesthetist, and in force on the day. Another
 * hospital's Contracts are never offered. Insurers carry no link, so they show
 * on every List (OQ-93). The session (AM or PM) narrows nothing.
 */
export function fitOf(c: Contract, s: Scenario): Fit {
  if (c.isDefault) return 'default'
  if (!inForce(c, s)) return 'none'
  if (c.surgeonIds?.includes(s.surgeon.id)) return 'surgeon'
  if (c.anaesthetistIds?.includes(s.anaesthetist.id)) return 'anaesthetist'
  if (c.hospitals?.includes(s.hospitalId)) return 'hospital'
  if (c.holderKind === 'insurer') return 'insurer'
  return 'none'
}

const FIT_ORDER: Record<Fit, number> = { default: 0, hospital: 1, surgeon: 2, anaesthetist: 3, insurer: 4, none: 5 }

export const FIT_LABEL: Record<Fit, string> = {
  default: 'Default',
  hospital: 'This List’s hospital',
  surgeon: 'The surgeon’s Contracts',
  anaesthetist: 'Anaesthetist price lists',
  insurer: 'Insurers and funders',
  none: 'Other Contracts',
}

/** No contract (RVG) first, then the hospital's, then surgeon and anaesthetist arrangements, then the rest. */
export function contractsFor(s: Scenario, useContext: boolean): Contract[] {
  return CONTRACTS.filter((c) => !useContext || fitOf(c, s) !== 'none').sort((a, b) => FIT_ORDER[fitOf(a, s)] - FIT_ORDER[fitOf(b, s)] || a.name.localeCompare(b.name))
}

// ── Search: every word must appear somewhere in the row ─────────────────────

export function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const hay = fields.filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => hay.includes(w))
}

// ── Formatting ──────────────────────────────────────────────────────────────

export function money(n: number): string {
  return '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
}


/** The Contract's pricing basis in a few words. */
export function basisOf(c: Contract): string {
  if (c.pricing.kind === 'lines') return `${linesOf(c.id).length} agreed fees`
  if (c.isDefault) return 'RVG at the anaesthetist’s unit value'
  return c.pricing.rate ? `RVG at ${money(c.pricing.rate)}/unit` : 'RVG, anaesthetist fills in'
}

export function lineFee(l: Line): string {
  return `${l.approx ? 'About ' : ''}${money(l.fee)}`
}

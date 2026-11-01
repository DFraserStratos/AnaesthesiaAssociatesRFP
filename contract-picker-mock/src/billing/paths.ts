import { CONTRACT_BY_ID, CONTRACTS, HOSPITALS, fitOf, linesOf, type Arrangement, type Branch, type Contract, type HospitalId, type MappedLine, type Scenario, type Selection } from '../data'

/**
 * Ben's decision tree (30 Oct) as pure functions. Where does the invoice go?
 *   Patient:      prepaid (the anaesthetist's own price) or not (No contract, RVG).
 *   The hospital: the List's own, under SXAP, HNZ or ACC.
 *   Special:      Bariatric, Unisports, a surgeon's set fees, NIB and the like.
 * Every list is the List's: its hospital, surgeon and anaesthetist, and the
 * Contracts in force on its day. Another hospital's Contracts never show.
 */

export interface Path {
  branch?: Branch
  /** The second answer: 'prepaid' or 'not-prepaid' for the patient, the contract type for the hospital. Special has none. */
  second?: Second
}

export type Second = 'prepaid' | 'not-prepaid' | Arrangement

export const ARRANGEMENT_LABEL: Record<Arrangement, string> = { sxap: 'SXAP', hnz: 'HNZ', acc: 'ACC' }
export const ARRANGEMENT_HINT: Record<Arrangement, string> = { sxap: 'Southern Cross Affiliated Provider', hnz: 'Health NZ', acc: 'ACC' }
const ARRANGEMENTS: Arrangement[] = ['sxap', 'hnz', 'acc']

export const SECOND_LABEL: Record<Second, string> = { prepaid: 'Prepaid', 'not-prepaid': 'Not prepaid', ...ARRANGEMENT_LABEL }

export interface Option<T> {
  value: T
  label: string
  hint?: string
  count: number
}

/** The Contracts this List can use: in force on the day, and the List's hospital's or linked to its people. */
export function listContracts(s: Scenario): Contract[] {
  return CONTRACTS.filter((c) => fitOf(c, s) !== 'none')
}

/** The Contracts a (partial) path leaves. */
export function poolOf(s: Scenario, path: Path): Contract[] {
  if (!path.branch) return []
  const all = listContracts(s).filter((c) => c.branch === path.branch)
  if (path.branch === 'patient') return path.second === 'prepaid' ? all.filter((c) => c.isPrepay) : path.second === 'not-prepaid' ? all.filter((c) => c.isDefault) : all
  if (path.branch === 'hospital') return path.second ? all.filter((c) => c.arrangement === path.second) : all
  return all
}

const hospitalName = (h: HospitalId) => HOSPITALS[h]

/** Ben's first question, with what each answer holds for this List. */
export function branchOptions(s: Scenario): Option<Branch>[] {
  const types = secondOptions(s, { branch: 'hospital' }).map((o) => o.label)
  const specials = [...new Set(poolOf(s, { branch: 'special' }).filter((c) => c.holderKind !== 'insurer').map((c) => c.name))]
  return [
    { value: 'patient', label: 'Patient', hint: 'Self-funding: prepaid, or the anaesthetist fills in the RVG', count: poolOf(s, { branch: 'patient' }).length },
    { value: 'hospital', label: hospitalName(s.hospitalId), hint: types.length ? `This List’s hospital, under ${listOf(types)}` : 'This List’s hospital holds no Contracts', count: poolOf(s, { branch: 'hospital' }).length },
    { value: 'special', label: 'Special contract', hint: specials.length ? `${listOf(specials.slice(0, 2))}${specials.length > 2 ? ' and more' : ''}, or an insurer such as NIB` : 'An insurer such as NIB', count: poolOf(s, { branch: 'special' }).length },
  ]
}

/** Ben's second question, which depends on the first. Special contracts have none: the Contract is picked straight from the list. */
export function secondOptions(s: Scenario, path: Path): Option<Second>[] {
  if (path.branch === 'patient') {
    const prepay = poolOf(s, { branch: 'patient', second: 'prepaid' })
    return [
      { value: 'prepaid', label: 'Prepaid', hint: prepay.length ? 'The anaesthetist’s own price, invoiced before the day' : 'No prepay price list for this List', count: prepay.length },
      { value: 'not-prepaid', label: 'Not prepaid', hint: 'The anaesthetist fills in the RVG or another amount', count: 1 },
    ]
  }
  if (path.branch === 'hospital')
    // Only the contract types this hospital holds: Southern Endo has no ACC.
    return ARRANGEMENTS.map((a) => ({ value: a as Second, label: ARRANGEMENT_LABEL[a], hint: ARRANGEMENT_HINT[a], count: poolOf(s, { branch: 'hospital', second: a }).length })).filter((o) => o.count > 0)
  return []
}

/** The one answer a step can have, if it has only one: it is filled in and shown as done. */
export function onlyOption<T>(options: Option<T>[]): T | undefined {
  const live = options.filter((o) => o.count > 0)
  return live.length === 1 ? live[0]!.value : undefined
}

/** What the booking's funder suggests (never decides). */
export function suggestedPath(s: Scenario): Path {
  switch (s.funder) {
    case 'Self-funding':
      return { branch: 'patient' }
    case 'NIB':
      return { branch: 'special' }
    case 'ACC':
      return { branch: 'hospital', second: 'acc' }
    case 'Southern Cross':
      return { branch: 'hospital', second: 'sxap' }
    case 'Health NZ':
      return { branch: 'hospital', second: 'hnz' }
    default:
      return {}
  }
}

/** The path a chosen Contract implies (for pre-filled bookings, and to keep the steps in step with a pick). */
export function pathOf(_s: Scenario, sel: Selection | null): Path {
  const c = sel ? CONTRACT_BY_ID.get(sel.contractId) : undefined
  if (!c) return {}
  if (c.branch === 'patient') return { branch: 'patient', second: c.isPrepay ? 'prepaid' : 'not-prepaid' }
  return { branch: c.branch, second: c.arrangement }
}

/** Does the branch ask a second question? */
export const hasSecond = (path: Path) => path.branch === 'patient' || path.branch === 'hospital'

/** One pickable row at the end of a path: an agreed fee, or a Contract priced from the RVG. */
export type PathRow = { kind: 'line'; contract: Contract; line: MappedLine } | { kind: 'contract'; contract: Contract }

export function rowsOnPath(s: Scenario, path: Path): PathRow[] {
  return poolOf(s, path).flatMap((c): PathRow[] =>
    c.pricing.kind === 'lines' ? linesOf(c.id).map((line) => ({ kind: 'line', contract: c, line })) : [{ kind: 'contract', contract: c }],
  )
}

/** The Selection a row stands for. */
export function selectionOf(row: PathRow): Selection {
  return row.kind === 'line' ? { contractId: row.contract.id, lineId: row.line.id } : { contractId: row.contract.id }
}

/** When a path leaves exactly one Contract priced from the RVG (Forte › SXAP, or Not prepaid), it is the pick. */
export function onlyContract(s: Scenario, path: Path): Selection | null {
  if (hasSecond(path) && !path.second) return null
  const rows = rowsOnPath(s, path)
  return rows.length === 1 && rows[0]!.kind === 'contract' ? selectionOf(rows[0]!) : null
}

/** "A, B and C". */
function listOf(xs: string[]) {
  return xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

export { hospitalName }

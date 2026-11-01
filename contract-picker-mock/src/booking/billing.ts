import { CONTRACT_BY_ID, LINE_BY_ID, RVG_BY_CODE, money, type Scenario, type Selection } from '../data'

/**
 * What the page shows for the current billing setup, worked out once so the
 * cards and the total panel never disagree.
 *
 * mode: none = no Contract; line = agreed fees with the procedure still to
 * pick; fixed = a line is picked (its price stands); rvg = priced from the RVG.
 */
export function billingOf(selection: Selection | null) {
  const contract = selection ? CONTRACT_BY_ID.get(selection.contractId) : undefined
  const line = selection?.lineId ? LINE_BY_ID.get(selection.lineId) : undefined
  const rvg = selection?.rvgCode ? RVG_BY_CODE.get(selection.rvgCode) : undefined
  const rate = contract?.pricing.kind === 'rvg' ? contract.pricing.rate : undefined
  const mode: 'none' | 'line' | 'fixed' | 'rvg' = !contract ? 'none' : line ? 'fixed' : contract.pricing.kind === 'lines' ? 'line' : 'rvg'
  // The patient pays and the anaesthetist names a fixed price instead of the RVG.
  const amount = mode === 'rvg' && contract!.isDefault && selection?.amount != null ? selection.amount : undefined
  const baseUnits = mode === 'rvg' && amount === undefined ? (rvg?.baseUnits ?? null) : null

  let rateLabel = 'NEEDS A CONTRACT'
  if (mode === 'line') rateLabel = 'NEEDS THE PROCEDURE'
  if (mode === 'fixed') rateLabel = line!.approx ? 'ESTIMATE FROM AGREED FEES' : 'AGREED FEE'
  if (mode === 'rvg') rateLabel = rate ? `FEE @ ${money(rate)}/UNIT` : contract!.isDefault ? 'FEE @ ANAESTHETIST’S RATE' : 'FEE @ CONTRACT RATE'
  // A prepaid Contract's line price is the prepaid amount: the full amount, never a deposit.
  const prepay = Boolean(contract?.isPrepay && line)
  if (prepay) rateLabel = 'PREPAID AMOUNT'
  if (amount !== undefined) rateLabel = 'FIXED PRICE'

  const fee = mode === 'fixed' ? line!.fee : amount !== undefined ? amount : mode === 'rvg' && baseUnits !== null && rate ? baseUnits * rate : null
  /** Is the price settled: a line picked, or an RVG Contract with its code or a fixed price. */
  const priced = mode === 'fixed' || (mode === 'rvg' && Boolean(rvg || amount !== undefined))

  return { contract, line, rvg, rate, mode, baseUnits, rateLabel, fee, prepay, amount, priced }
}

/**
 * Ben's leaves: who fills in the price once the Contract is chosen. The
 * office's job ends at the Contract; an RVG card goes to the anaesthetist.
 */
export function outcomeOf(selection: Selection | null, s: Scenario): { tone: 'card' | 'filled' | 'todo'; text: string } | null {
  const b = billingOf(selection)
  if (!b.contract) return null
  const who = `Dr ${s.anaesthetist.name.split(' ').pop()}`
  const billed = b.contract.holderBilled ? b.contract.holder : 'the patient'
  if (b.prepay) return { tone: 'filled', text: `Prepaid: ${money(b.line!.fee)} invoiced to the patient before the day.` }
  if (b.mode === 'line') return { tone: 'todo', text: 'Choose the procedure to pre-fill its agreed fee.' }
  if (b.mode === 'fixed') return { tone: 'filled', text: `${b.line!.approx ? 'Estimate' : 'Agreed fee'} pre-filled: ${money(b.line!.fee)}, invoiced to ${billed}.` }
  if (b.amount !== undefined) return { tone: 'filled', text: `Fixed price ${money(b.amount)} instead of the RVG, invoiced to the patient.` }
  if (b.contract.isDefault) return { tone: 'card', text: `Card sent to ${who} to fill in the RVG or another amount, invoiced to the patient.` }
  if (b.rate) return { tone: 'card', text: `RVG at the agreed ${money(b.rate)} a unit: card sent to ${who} for the RVG code, invoiced to ${billed}.` }
  return { tone: 'card', text: `Card sent to ${who} to fill in the RVG, invoiced to ${billed}.` }
}

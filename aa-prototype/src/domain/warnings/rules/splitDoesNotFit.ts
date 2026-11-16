/**
 * A split that no longer fits the fee (catch-up Phase 22; US-08.2.3): the fee
 * changed under a typed $ share (an office price change, a Contract change),
 * so the billing run would fail the Booking for review. This shows the same
 * reason on the Booking's triangle and at review before anyone authorises.
 * Mild, after the procedure, per Procedure; never a block. It reads
 * `resolveSplit`, never its own maths.
 */

import type { WarningFinding, WarningRule } from '../types'
import { PARTY_GONE_REASON, resolveSplit, splitDoesNotFitMessage } from '../../billing/splitShare'

export const splitDoesNotFitRule: WarningRule = {
  id: 'splitDoesNotFit',
  label: 'Split no longer fits the fee',
  defaultParams: {},
  evaluate(facts) {
    const splits = facts.splits
    if (splits === undefined) return []
    const out: WarningFinding[] = []
    for (const procedure of facts.procedures) {
      const check = splits[procedure.id]
      if (procedure.split === undefined || check === undefined) continue
      const fee = check.feeExGst ?? 0
      const resolved = resolveSplit(fee, procedure.split.shares)
      const reason = !check.partiesOn ? PARTY_GONE_REASON : !resolved.ok ? resolved.reason : null
      if (reason === null) continue
      out.push({ kind: 'afterProcedure', strength: 'mild', text: splitDoesNotFitMessage(fee, reason), procedureId: procedure.id })
    }
    return out
  },
}

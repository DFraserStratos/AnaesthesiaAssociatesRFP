import { roundToCents } from './money'

/**
 * Illustrative prototype assumption only. The RFP establishes AA's agency role
 * but does not state the fee rate, deduction point or GST treatment.
 */
export const AA_SERVICE_FEE_RATE = 0.05

export interface AaServiceFeeBreakdown {
  grossAmount: number
  serviceFeeRate: number
  serviceFeeAmount: number
  amountPayable: number
}

export function aaServiceFeeFor(grossAmount: number): AaServiceFeeBreakdown {
  const serviceFeeAmount = roundToCents(grossAmount * AA_SERVICE_FEE_RATE)
  return {
    grossAmount,
    serviceFeeRate: AA_SERVICE_FEE_RATE,
    serviceFeeAmount,
    amountPayable: roundToCents(grossAmount - serviceFeeAmount),
  }
}

/**
 * Who a Procedure bills, INTERIM until Phase 21's payer on the Booking
 * (catch-up Phase 20; US-04.3.1, US-03.4.1 "Pre-approval falls through").
 *
 * The Contract says: one that bills its holder bills that holder Party
 * (through 18's interim counterparty, so no seeded counterparty or Xero
 * contact moves); one that bills the payer bills the Procedure's
 * `billablePartyId` override when set (a guardian, a named payer), else the
 * patient. `billsHolderInterim` keeps the one seeded Booking the retired
 * contract-holder route billed to a payer-billing Contract's holder. Billing
 * lines' `funderOverride` is applied by the invoice build, unchanged (22).
 * Phase 21 rewrites this module.
 */

import type { Contract, CounterpartyRef, Procedure } from '../types'
import { routeCounterpartyForParty, type Party } from './parties'

export function billedPartyFor(
  procedure: Pick<Procedure, 'billablePartyId' | 'billsHolderInterim'>,
  contract: Pick<Contract, 'billsTo' | 'holderId'> | undefined,
  parties: Readonly<Record<string, Party>>,
  patientId: string,
): CounterpartyRef | undefined {
  if (contract === undefined) return undefined
  if (contract.billsTo === 'holder' || procedure.billsHolderInterim === true) {
    return routeCounterpartyForParty(parties[contract.holderId])
  }
  if (procedure.billablePartyId !== undefined) return { kind: 'billableParty', id: procedure.billablePartyId }
  return { kind: 'patient', id: patientId }
}

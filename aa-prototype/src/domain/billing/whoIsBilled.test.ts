/** Who is billed, INTERIM until Phase 21 (catch-up Phase 20). */

import { describe, expect, it } from 'vitest'
import { buildSeed } from '../seed'
import { billedPartyFor } from './whoIsBilled'

const seed = buildSeed()
const parties = seed.masters.parties
const contract = (id: string) => seed.masters.contracts[id]!

describe('billedPartyFor', () => {
  it('bills the holder when the Contract bills its holder (a hospital through its interim counterparty)', () => {
    expect(billedPartyFor({}, contract('CT-STG-D1'), parties, 'PT0001')).toEqual({ kind: 'hospital', id: 'H-STG' })
    expect(billedPartyFor({}, contract('CT-NIB-D1'), parties, 'PT0001')).toEqual({ kind: 'insurer', id: 'I-NIB' })
  })

  it('bills the Aria payer override on BP0002', () => {
    expect(billedPartyFor({ billablePartyId: 'BP0002' }, contract('CT-ARIA-HOURLY'), parties, 'PT0001')).toEqual(
      billedPartyFor({}, contract('CT-ARIA-HOURLY'), parties, 'PT0001'),
    )
  })

  it('bills the BP0001 guardian override on No contract · RVG, and without one the patient', () => {
    expect(billedPartyFor({ billablePartyId: 'BP0001' }, contract('CT-NO-CONTRACT'), parties, 'PT0001')).toEqual({ kind: 'billableParty', id: 'BP0001' })
    expect(billedPartyFor({}, contract('CT-NO-CONTRACT'), parties, 'PT0001')).toEqual({ kind: 'patient', id: 'PT0001' })
  })

  it("bills the holder of a payer-billing Contract only on the interim flag (Doyle's bariatric primary)", () => {
    expect(billedPartyFor({}, contract('CT-DOYLE-BAR'), parties, 'PT0015')).toEqual({ kind: 'patient', id: 'PT0015' })
    expect(billedPartyFor({ billsHolderInterim: true }, contract('CT-DOYLE-BAR'), parties, 'PT0015')).toEqual({ kind: 'surgeon', id: 'S-DOYLE' })
  })

  it('bills no one without a Contract', () => {
    expect(billedPartyFor({}, undefined, parties, 'PT0001')).toBeUndefined()
  })
})

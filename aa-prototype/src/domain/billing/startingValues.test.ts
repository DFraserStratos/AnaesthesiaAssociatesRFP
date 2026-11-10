import { describe, expect, it } from 'vitest'
import { fillFromContract } from './startingValues'
import { BASE_SINGLE_10, mkAnaesthetist, mkContract, mkProcedure } from './fixtures'
import { feeFor } from './fee'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import type { RvgGroup } from '../types'

const H3: RvgGroup = { id: 'rg-h3', code: 'H3', description: 'Moderate procedures', anatomy: 'Head', baseUnits: 6, modifierUnits: 0, retired: false }
const OLD: RvgGroup = { ...H3, id: 'rg-old', code: 'X9', retired: true }
const GROUPS = { [H3.id]: H3, [OLD.id]: OLD, [BASE_SINGLE_10.id]: BASE_SINGLE_10 }

describe('fillFromContract (DM-43; US-04.2.18 "Default RVG code"; A15)', () => {
  const faceLift = mkContract({ defaultRvgGroupId: H3.id, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-06-01', price: 3100 }] } })

  it('fills an empty RVG code from the default', () => {
    expect(fillFromContract(mkProcedure({ rvgGroupId: undefined }), faceLift, GROUPS)).toEqual({ rvgGroupId: H3.id })
  })

  it('keeps an existing RVG code (with its times and modifiers, which it never touches)', () => {
    expect(fillFromContract(mkProcedure({ rvgGroupId: BASE_SINGLE_10.id }), faceLift, GROUPS)).toBeNull()
  })

  it('a Contract with no default leaves the code empty; so does no Contract', () => {
    expect(fillFromContract(mkProcedure({ rvgGroupId: undefined }), mkContract(), GROUPS)).toBeNull()
    expect(fillFromContract(mkProcedure({ rvgGroupId: undefined }), undefined, GROUPS)).toBeNull()
  })

  it('a default that is retired or gone fills nothing', () => {
    expect(fillFromContract(mkProcedure({ rvgGroupId: undefined }), mkContract({ defaultRvgGroupId: OLD.id }), GROUPS)).toBeNull()
    expect(fillFromContract(mkProcedure({ rvgGroupId: undefined }), mkContract({ defaultRvgGroupId: 'rg-gone' }), GROUPS)).toBeNull()
  })

  it("on a fixed price the filled code's units never reach the fee (reference only)", () => {
    const filled = mkProcedure({ rvgGroupId: H3.id, anaestheticStartISO: '2026-07-21T08:00:00', handoverISO: '2026-07-21T10:00:00' })
    const fee = feeFor(filled, { anaesthetist: mkAnaesthetist(), contract: faceLift, rvgGroup: H3, dateISO: '2026-07-21', timeRule: DEFAULT_RVG_TIME_RULE })
    expect(fee.btm.base.units).toBe(6) // base units from the RVG group alone
    expect(fee.total).toBe(3100)
    expect(fee.lines.map((l) => l.chargeBasis)).toEqual(['fixed'])
  })
})

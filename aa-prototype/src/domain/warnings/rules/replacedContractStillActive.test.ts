/** The replaced-Contract to-do as a pure rule (build plan Phase 49; DM-03, D94). */
import { describe, expect, it } from 'vitest'
import type { Contract } from '../../types'
import type { ContractReplacement } from '../../billing/contractHistory'
import { WARNING_RULES } from './index'
import { replacedContractStillActive } from './replacedContractStillActive'

const base: Omit<Contract, 'id' | 'aaCode' | 'name'> = {
  holderId: 'PY-UNI',
  billsTo: 'holder',
  linkedSurgeonIds: ['S-HALE'],
  prepaid: false,
  anaesthetistMayOverridePrice: false,
  pricing: { kind: 'rvgContractRate', unitRate: 93.47 },
  status: 'active',
  specialtyIds: [],
  invoiceDescription: null,
  defaultRvgGroupId: null,
}
const old: Contract = { ...base, id: 'CT-OLD', aaCode: 'UNI-001', name: 'Unisports Ortho' }
const next: Contract = { ...base, id: 'CT-NEW', aaCode: 'UNI-002', name: 'Unisports Ortho', pricing: { kind: 'rvgContractRate', unitRate: 97 } }
const contracts = { [old.id]: old, [next.id]: next }
const replaced: ContractReplacement[] = [{ contractId: 'CT-NEW', replacesId: 'CT-OLD', fromISO: '2027-01-01', atISO: '2026-12-20T09:00:00', entryId: 'A0100' }]

describe('replacedContractStillActive (DM-03)', () => {
  it('none before the date, one on and after it', () => {
    expect(replacedContractStillActive(contracts, replaced, '2026-12-31')).toEqual([])
    expect(replacedContractStillActive(contracts, replaced, '2027-01-01')).toEqual([
      { contractId: 'CT-OLD', contractName: 'Unisports Ortho', aaCode: 'UNI-001', replacementId: 'CT-NEW', replacementName: 'Unisports Ortho', replacementCode: 'UNI-002', fromISO: '2027-01-01' },
    ])
    expect(replacedContractStillActive(contracts, replaced, '2027-03-01')).toHaveLength(1)
  })

  it('none once either is disabled; a system Contract never', () => {
    expect(replacedContractStillActive({ ...contracts, [old.id]: { ...old, status: 'disabled' } }, replaced, '2027-01-02')).toEqual([])
    expect(replacedContractStillActive({ ...contracts, [next.id]: { ...next, status: 'disabled' } }, replaced, '2027-01-02')).toEqual([])
    expect(replacedContractStillActive({ ...contracts, [old.id]: { ...old, systemRole: 'noContractRvg' } }, replaced, '2027-01-02')).toEqual([])
  })

  it('reads the newest replacement only', () => {
    const later: ContractReplacement = { contractId: 'CT-NEW', replacesId: 'CT-OLD', fromISO: '2027-02-01', atISO: '2026-12-21T09:00:00', entryId: 'A0101' }
    expect(replacedContractStillActive(contracts, [...replaced, later], '2027-01-15')).toEqual([])
  })

  it('is not a Booking rule: not in WARNING_RULES', () => {
    expect(WARNING_RULES.map((r) => r.id)).not.toContain('replacedContractStillActive')
    expect(WARNING_RULES.some((r) => (r as unknown) === replacedContractStillActive)).toBe(false)
  })
})

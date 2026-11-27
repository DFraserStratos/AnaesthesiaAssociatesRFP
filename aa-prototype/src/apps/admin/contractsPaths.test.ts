import { describe, expect, it } from 'vitest'
import { contractAddRangePath, contractsPath, replaceContractPath } from './contractsPaths'

describe('contractsPath', () => {
  it('opens a group, and every status when asked (the surgeon page counts Disabled Contracts, Wave 3 join)', () => {
    expect(contractsPath({ group: 'surgeon', in: 'S-HALE' })).toBe('/admin/contracts?group=surgeon&in=S-HALE')
    expect(contractsPath({ group: 'surgeon', in: 'S-HALE', status: 'all' })).toBe('/admin/contracts?group=surgeon&in=S-HALE&status=all')
    expect(contractsPath({ holder: 'PY-COS' })).toBe('/admin/contracts?group=holder&in=PY-COS')
  })
})

describe('replaceContractPath', () => {
  it('is a child of the Contract, keyed by its id; the range pointer opens the add-range row', () => {
    expect(replaceContractPath('CT-UNI 1')).toBe('/admin/contracts/CT-UNI%201/replace')
    expect(contractAddRangePath('CT-MER-FACELIFT')).toBe('/admin/contracts/CT-MER-FACELIFT?add=range')
  })
})

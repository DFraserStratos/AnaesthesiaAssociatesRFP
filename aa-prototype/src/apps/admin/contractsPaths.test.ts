import { describe, expect, it } from 'vitest'
import { contractsPath } from './contractsPaths'

describe('contractsPath', () => {
  it('opens a group, and every status when asked (the surgeon page counts Disabled Contracts, Wave 3 join)', () => {
    expect(contractsPath({ group: 'surgeon', in: 'S-HALE' })).toBe('/admin/contracts?group=surgeon&in=S-HALE')
    expect(contractsPath({ group: 'surgeon', in: 'S-HALE', status: 'all' })).toBe('/admin/contracts?group=surgeon&in=S-HALE&status=all')
    expect(contractsPath({ holder: 'PY-COS' })).toBe('/admin/contracts?group=holder&in=PY-COS')
  })
})

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState } from './appStore'
import { resetDemo } from './clockActions'

describe('the remembered Contract grouping (build plan Phase 47)', () => {
  it('keeps one grouping per office user, unaudited, and Reset clears it', () => {
    const api = createAppStore()
    const auditBefore = api.getState().audit.length
    api.getState().setContractGrouping('kirsty', 'tag')
    api.getState().setContractGrouping('sam', 'surgeon')
    expect(api.getState().shell.contractGrouping).toEqual({ kirsty: 'tag', sam: 'surgeon' })
    api.getState().setOfficeUser('sam')
    expect(api.getState().shell.contractGrouping?.sam).toBe('surgeon')
    expect(api.getState().audit.length).toBe(auditBefore)
    resetDemo(api)
    expect(api.getState().shell.contractGrouping).toBeUndefined()
    // The rest of the shell survives Reset, as before.
    expect(api.getState().shell.officeUser).toBe('sam')
  })

  it('is absent from a fresh state, so a stored state without it loads as it is', () => {
    expect(freshAppState().shell.contractGrouping).toBeUndefined()
  })
})

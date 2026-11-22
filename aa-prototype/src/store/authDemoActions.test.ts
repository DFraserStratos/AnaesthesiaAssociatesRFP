import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { recordAnaesthetistSignIn, simulateSignInAttempts } from './authDemoActions'
import { ACTION_LABELS } from '../shared/audit/actionLabels'

describe('simulateSignInAttempts (FT-13.5)', () => {
  it('appends five labelled account rows and touches no domain slice', () => {
    const api = createAppStore()
    const before = api.getState()
    expect(simulateSignInAttempts(api).ok).toBe(true)
    const after = api.getState()
    const rows = after.audit.slice(before.audit.length)
    expect(rows.map((r) => r.action)).toEqual([
      'account.provisioned',
      'auth.signIn',
      'auth.signInFailed',
      'auth.passwordReset',
      'auth.signIn',
    ])
    expect(rows.every((r) => r.entityType === 'account')).toBe(true)
    expect(rows.map((r) => `${r.role}/${r.source}`)).toEqual([
      'office/office',
      'office/office',
      'office/office',
      'anaesthetist/anaesthetist',
      'anaesthetist/anaesthetist',
    ])
    expect(rows[1]?.after).toMatchObject({ mfa: 'passed', app: 'Admin' })
    expect(rows[2]?.after).toMatchObject({ reason: 'Incorrect password' })
    expect(rows[4]?.after).toMatchObject({ provider: 'Apple (social login)', app: 'Mobile' })
    for (const r of rows) expect(ACTION_LABELS[r.action]).toBeDefined()
    for (const slice of ['schedule', 'masters', 'billing', 'xero', 'integrations', 'settings', 'dayNotes', 'clock'] as const) {
      expect(after[slice], slice).toBe(before[slice])
    }
  })

  it('recordAnaesthetistSignIn writes exactly one labelled row per outcome and touches no domain slice (Phase 43a)', () => {
    const cases = [
      ['signedIn', 'auth.signIn'],
      ['refused', 'auth.signInFailed'],
      ['signedOut', 'auth.signOut'],
    ] as const
    for (const [outcome, action] of cases) {
      const api = createAppStore()
      const before = api.getState()
      expect(recordAnaesthetistSignIn(api, outcome).ok).toBe(true)
      const after = api.getState()
      const rows = after.audit.slice(before.audit.length)
      expect(rows).toHaveLength(1)
      const row = rows[0]!
      expect(row.action).toBe(action)
      expect(row.entityType).toBe('account')
      expect(row.entityId).toBe('34821')
      expect(row.who).toBe('Dr Melanie Souter')
      expect(`${row.role}/${row.source}`).toBe('anaesthetist/anaesthetist')
      expect(Object.keys(row.after ?? {})[0]).toBe('app')
      expect(row.after).toMatchObject({ app: 'Mobile (PWA)', provider: 'Identity provider (simulated)' })
      if (outcome === 'refused') expect(row.after).toMatchObject({ reason: 'Unknown account' })
      expect(JSON.stringify(row).toLowerCase()).not.toContain('password"')
      expect(row.atISO.startsWith(before.clock.todayISO)).toBe(true)
      expect(ACTION_LABELS[row.action]).toBeDefined()
      for (const slice of ['schedule', 'masters', 'billing', 'xero', 'integrations', 'settings', 'dayNotes', 'clock'] as const) {
        expect(after[slice], slice).toBe(before[slice])
      }
    }
  })

  it('appends again on a repeat run', () => {
    const api = createAppStore()
    simulateSignInAttempts(api)
    const n = api.getState().audit.length
    simulateSignInAttempts(api)
    expect(api.getState().audit.length).toBe(n + 5)
  })
})

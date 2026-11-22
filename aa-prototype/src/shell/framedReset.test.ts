import { beforeEach, describe, expect, it } from 'vitest'
import { resetFramedDemo } from './framedReset'
import { useAppStore } from '../store'
import { isSignedIn, signOutSession, useSessionStore } from '../shared/session/anaesthetistSession'
import { anyHintDismissed, dismissHint } from '../shared/help/firstRunHints'

/** Every non-test source file under src/apps/demo and src/shell. */
const SOURCES = {
  ...(import.meta.glob('../apps/demo/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>),
  ...(import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>),
}

describe('resetFramedDemo (Phase 43a)', () => {
  beforeEach(() => window.localStorage.clear())

  it('lands the framed phone signed in after a sign-out', () => {
    signOutSession()
    expect(isSignedIn('signed-in')).toBe(false)
    resetFramedDemo({ clearHints: false })
    expect(useSessionStore.getState().stored).toBeNull()
    expect(isSignedIn('signed-in')).toBe(true)
  })

  it('brings the welcome cards back only when asked (the Resets, not the scenario jumps)', () => {
    dismissHint('admin')
    resetFramedDemo({ clearHints: false })
    expect(anyHintDismissed()).toBe(true)
    resetFramedDemo({ clearHints: true })
    expect(anyHintDismissed()).toBe(false)
  })

  it('restores the pristine seed', () => {
    const today = useAppStore.getState().clock.todayISO
    resetFramedDemo({ clearHints: true })
    expect(useAppStore.getState().clock.todayISO).toBe(today)
  })

  it('no file under src/apps/demo or src/shell calls resetDemo( except framedReset.ts', () => {
    const offenders = Object.entries(SOURCES)
      .filter(([file]) => !/\.test\.tsx?$/.test(file) && !file.endsWith('/framedReset.ts'))
      .filter(([, source]) => /\bresetDemo\(/.test(source))
      .map(([file]) => file)
    expect(offenders).toEqual([])
    expect(Object.keys(SOURCES).length).toBeGreaterThan(10)
  })
})

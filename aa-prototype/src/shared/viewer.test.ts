import { describe, expect, it } from 'vitest'
import { isOfficeViewer, viewerOf } from './viewer'

const SOURCE = import.meta.glob('./viewer.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('viewerOf (Phase 43a)', () => {
  it('maps each role, failing closed', () => {
    expect(viewerOf({ role: 'office' })).toBe('office')
    expect(viewerOf({ role: 'anaesthetist' })).toBe('anaesthetist')
    expect(viewerOf({ role: 'system' })).toBe('anaesthetist')
    expect(isOfficeViewer({ role: 'office' })).toBe(true)
    expect(isOfficeViewer({ role: 'system' })).toBe(false)
  })

  it('is deterministic', () => {
    const a = [viewerOf({ role: 'office' }), viewerOf({ role: 'anaesthetist' })]
    const b = [viewerOf({ role: 'office' }), viewerOf({ role: 'anaesthetist' })]
    expect(a).toEqual(b)
  })

  it('imports nothing from apps, shell, store or React (PWA-safe)', () => {
    const source = Object.values(SOURCE)[0] ?? ''
    const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!)
    for (const spec of specifiers) expect(spec).not.toMatch(/\/(apps|shell|store)(\/|$)|^react/)
  })
})

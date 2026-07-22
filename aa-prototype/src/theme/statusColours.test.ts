import { describe, it, expect } from 'vitest'
import { statusColours, STATUS_ORDER } from './statusColours'

/**
 * Smoke test — proves the Vitest rig runs and the status map carries the exact
 * Design Language hexes. The only test in Phase 00.
 */
describe('status colours', () => {
  it('defines all six statuses', () => {
    expect(STATUS_ORDER).toHaveLength(6)
    expect(Object.keys(statusColours)).toHaveLength(6)
    for (const key of STATUS_ORDER) {
      expect(statusColours[key]).toBeDefined()
    }
  })

  it('carries the exact Design Language hexes (spot-check)', () => {
    expect(statusColours.private.solid).toBe('#2E66E5')
    expect(statusColours.free.solid).toBe('#1FA463')
    expect(statusColours.private.tint).toBe('#E8EEFC')
    expect(statusColours.free.onTint).toBe('#157A49')
  })

  it('never relies on colour alone — every status carries a label', () => {
    for (const key of STATUS_ORDER) {
      expect(statusColours[key].label.length).toBeGreaterThan(0)
    }
  })

  it('flags the two special treatments', () => {
    expect(statusColours.unavailable.treatment).toBe('hatched')
    expect(statusColours.free.treatment).toBe('dashed')
  })
})

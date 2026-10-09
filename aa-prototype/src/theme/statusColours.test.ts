import { describe, it, expect } from 'vitest'
import { LIST_KIND_VISUAL, STATUS_PALETTE, resolveStatusVisual } from './statusColours'
import { LIST_KINDS, STATUS_COLOUR_TOKENS } from '../domain/types'

/**
 * The palette carries the exact Design Language hexes, and the treatments
 * resolve to exactly the strings the app drew before statuses became master
 * data (catch-up Phase 29): no new hex, no visual change.
 */
describe('status palette', () => {
  it('defines the six design tokens', () => {
    expect(Object.keys(STATUS_PALETTE)).toEqual([...STATUS_COLOUR_TOKENS])
  })

  it('carries the exact Design Language hexes', () => {
    expect(STATUS_PALETTE.private).toEqual({ solid: '#2E66E5', tint: '#E8EEFC', onTint: '#1F44A3' })
    expect(STATUS_PALETTE.public).toEqual({ solid: '#6E56CF', tint: '#EEEBFA', onTint: '#4C3D96' })
    expect(STATUS_PALETTE.preop).toEqual({ solid: '#C26A0E', tint: '#FBEFDF', onTint: '#8A4B09' })
    expect(STATUS_PALETTE.holiday).toEqual({ solid: '#D25C74', tint: '#FAE9ED', onTint: '#A03A52' })
    expect(STATUS_PALETTE.unavailable).toEqual({ solid: '#64716C', tint: '#ECEFEE', onTint: '#4A5551' })
    expect(STATUS_PALETTE.free).toEqual({ solid: '#1FA463', tint: '#E3F6EC', onTint: '#157A49' })
  })

  it('hatched grey resolves to today\'s exact Unavailable strings', () => {
    const v = resolveStatusVisual({ colour: 'unavailable', treatment: 'hatched' })
    expect(v.blockBackground).toBe('repeating-linear-gradient(135deg, #ECEFEE 0 5px, #E2E7E5 5px 10px)')
    expect(v.solidBackground).toBe('repeating-linear-gradient(135deg, #64716C 0 7px, #596560 7px 14px)')
    expect(v.border).toBeUndefined()
  })

  it('dashed green resolves to today\'s exact Free border', () => {
    const v = resolveStatusVisual({ colour: 'free', treatment: 'dashed' })
    expect(v.border).toBe('1.5px dashed #1FA463')
    expect(v.blockBackground).toBe('#E3F6EC')
    expect(v.leftBar).toBeUndefined()
  })

  it('generalises the treatments to any token with existing values only', () => {
    const hatched = resolveStatusVisual({ colour: 'holiday', treatment: 'hatched' })
    expect(hatched.blockBackground).toBe('repeating-linear-gradient(135deg, #FAE9ED 0 5px, #E2E7E5 5px 10px)')
    expect(hatched.solidBackground).toContain('#A03A52')
    expect(resolveStatusVisual({ colour: 'public', treatment: 'dashed' }).border).toBe('1.5px dashed #6E56CF')
  })

  it('every List kind resolves to its own token, solid, exactly as before', () => {
    for (const kind of LIST_KINDS) {
      const v = resolveStatusVisual(LIST_KIND_VISUAL[kind])
      expect(v.blockBackground).toBe(STATUS_PALETTE[kind].tint)
      expect(v.leftBar).toBe(STATUS_PALETTE[kind].solid)
      expect(v.border).toBeUndefined()
    }
  })
})

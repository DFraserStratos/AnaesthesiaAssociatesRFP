import { describe, expect, it } from 'vitest'
import { autoLayout, BAND_WIDTH, CARD, FEATURE_Y } from '../src/board/autoLayout.ts'
import { item, syntheticCatalogue } from './fixtures.ts'

// 12 epics x 6 features is wide enough to force several bands.
const items = syntheticCatalogue(12, 6, 3)

describe('autoLayout', () => {
  it('places every item, deterministically, regardless of input order', () => {
    const a = autoLayout(items)
    expect(Object.keys(a)).toHaveLength(items.length)
    expect(autoLayout([...items].reverse())).toEqual(a)
  })

  it('draws a story map: epics on row one, features on row two, stories under their feature', () => {
    const p = autoLayout(items)
    expect(p['EP-01']!.y).toBe(0)
    expect(p['FT-01.1']!.y).toBe(FEATURE_Y)
    expect(p['US-01.1.1']!.x).toBe(p['FT-01.1']!.x)
    expect(p['US-01.1.2']!.y).toBeGreaterThan(p['US-01.1.1']!.y)
    expect(p['FT-01.2']!.x).toBeGreaterThan(p['FT-01.1']!.x)
    expect(p['EP-02']!.x).toBeGreaterThan(p['EP-01']!.x + p['EP-01']!.w)
  })

  it('gives stories directly under an epic their own column', () => {
    const p = autoLayout(items)
    expect(p['US-12.0.1']!.x).toBeGreaterThan(p['FT-12.6']!.x)
    expect(p['US-12.0.1']!.y).toBe(p['FT-12.1']!.y)
  })

  it('wraps epics into bands no wider than BAND_WIDTH', () => {
    const p = autoLayout(items)
    const epicBoxes = Object.entries(p).filter(([id]) => id.startsWith('EP-'))
    expect(new Set(epicBoxes.map(([, b]) => b.y)).size).toBeGreaterThan(1)
    for (const [, b] of epicBoxes) expect(b.x + b.w <= BAND_WIDTH || b.x === 0).toBe(true)
  })

  it('never overlaps two cards', () => {
    const boxes = Object.values(autoLayout(items))
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!, b = boxes[j]!
        expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false)
      }
  })

  it('keeps retired items at the end of their stack', () => {
    const retired = items.map((i) => (i.id === 'US-01.1.1' ? { ...i, status: 'Retired' as const } : i))
    const p = autoLayout(retired)
    const last = items.filter((i) => i.parent === 'FT-01.1').at(-1)!.id
    expect(p['US-01.1.1']!.y).toBeGreaterThan(p[last]!.y)
    expect(p['US-01.1.2']!.y).toBe(autoLayout(items)['US-01.1.1']!.y)
  })

  it('still places orphans (parent missing) below the map', () => {
    const p = autoLayout([...items, item({ id: 'US-99.1.1', parent: 'FT-99.1' })])
    const maxY = Math.max(...Object.entries(p).filter(([id]) => id !== 'US-99.1.1').map(([, b]) => b.y + b.h))
    expect(p['US-99.1.1']!.y).toBeGreaterThan(maxY)
    expect(CARD.story.h).toBeGreaterThan(0)
  })
})

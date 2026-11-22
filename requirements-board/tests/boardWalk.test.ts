/**
 * B11: the arrow keys walk the cards as the board draws them (FINDINGS R-118, B11-Q3), and the camera
 * brings a card into view with its title showing (R-117). Pure: `walkStep` and `src/board/camera.ts`.
 */
import { describe, expect, it } from 'vitest'
import { retiredTest } from '../shared/statuses.ts'
import type { Item, Rev } from '../shared/types.ts'
import { CARD, COL_PITCH, COL_GAP } from '../src/board/autoLayout.ts'
import { cardInView, centreViewport, type Box, type Pane } from '../src/board/camera.ts'
import { isShown } from '../src/board/graph.ts'
import { mappedLayout } from '../src/board/mappedLayout.ts'
import { walkStep, type WalkContext, type WalkKey } from '../src/board/walk.ts'
import { buildIndex } from '../src/store.ts'
import { item } from './fixtures.ts'

const RETIRED = '5' as const
// EP-01's direct stories come first in its file order, its features after them: the walk must still keep them apart.
const cat: Item[] = [
  item({ id: 'EP-01', type: 'epic', order: 1 }),
  item({ id: 'US-01.0.1', parent: 'EP-01', order: 1 }),
  item({ id: 'US-01.0.2', parent: 'EP-01', order: 2 }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 3 }),
  item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 4 }),
  // File order .1 to .4; on screen in Mapped: the first lane (.3), MVP (.2, then the retired .4), Later (.1).
  item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'Later' }),
  item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }),
  item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3 }),
  item({ id: 'US-01.1.4', parent: 'FT-01.1', order: 4, swimlane: 'MVP', status: RETIRED }),
  item({ id: 'US-01.2.1', parent: 'FT-01.2', order: 1 }),
  item({ id: 'EP-02', type: 'epic', order: 3 }),
  item({ id: 'EP-03', type: 'epic', order: 2, status: RETIRED }),
]
const index = buildIndex(Object.fromEntries(cat.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }])), {})
const retired = retiredTest(index.config)
const lanes = ['MVP', 'Later']

function ctx({ mode, showRetired = true, collapsed = [] as string[], open = null as string | null }: { mode: 'mapped' | 'freeform'; showRetired?: boolean; collapsed?: string[]; open?: string | null }): WalkContext {
  const shown = (it: Item) => isShown(it, { index, showRetired, selected: open })
  return { index, shown, retired, map: mode === 'mapped' ? mappedLayout(cat, { lanes, collapsed: new Set(collapsed), visible: shown, retired, open }) : null }
}
/** Every card reached by pressing `key` again and again from `id`. */
function walk(key: WalkKey, id: string, c: WalkContext): string[] {
  const out: string[] = []
  for (let at: string | undefined = walkStep(key, id, c); at && out.length < 20; at = walkStep(key, at, c)) out.push(at)
  return out
}

describe('the arrow keys walk the cards as drawn (R-118)', () => {
  it("Down from an epic's direct story never reaches a feature, and Up leads to the epic", () => {
    for (const mode of ['mapped', 'freeform'] as const) {
      expect(walk('ArrowDown', 'US-01.0.1', ctx({ mode })), mode).toEqual(['US-01.0.2'])
      expect(walk('ArrowUp', 'US-01.0.2', ctx({ mode })), mode).toEqual(['US-01.0.1', 'EP-01'])
      expect(walk('ArrowRight', 'US-01.0.2', ctx({ mode })), mode).toEqual([])
    }
  })

  it('Mapped: Down runs lane by lane, live first in each lane; Up climbs back to the feature', () => {
    const c = ctx({ mode: 'mapped' })
    expect(walkStep('ArrowDown', 'FT-01.1', c)).toBe('US-01.1.3')
    expect(walk('ArrowDown', 'US-01.1.3', c)).toEqual(['US-01.1.2', 'US-01.1.4', 'US-01.1.1'])
    expect(walk('ArrowUp', 'US-01.1.1', c)).toEqual(['US-01.1.4', 'US-01.1.2', 'US-01.1.3', 'FT-01.1', 'EP-01'])
  })

  it('Freeform: the stack order, live first, whatever the lanes', () => {
    const c = ctx({ mode: 'freeform' })
    expect(walkStep('ArrowDown', 'FT-01.1', c)).toBe('US-01.1.1')
    expect(walk('ArrowDown', 'US-01.1.1', c)).toEqual(['US-01.1.2', 'US-01.1.3', 'US-01.1.4'])
  })

  it('skips retired cards while they are hidden', () => {
    expect(walk('ArrowDown', 'US-01.1.3', ctx({ mode: 'mapped', showRetired: false }))).toEqual(['US-01.1.2', 'US-01.1.1'])
    expect(walk('ArrowRight', 'EP-01', ctx({ mode: 'mapped', showRetired: false }))).toEqual(['EP-02'])
  })

  it('skips a collapsed lane, but steps through the open card drawn there (B11-Q3)', () => {
    expect(walk('ArrowDown', 'US-01.1.3', ctx({ mode: 'mapped', collapsed: ['MVP'] }))).toEqual(['US-01.1.1'])
    expect(walk('ArrowDown', 'US-01.1.3', ctx({ mode: 'mapped', collapsed: ['MVP'], open: 'US-01.1.2' }))).toEqual(['US-01.1.2', 'US-01.1.1'])
  })

  it('Left and Right step among the same type under the same parent, as drawn', () => {
    for (const mode of ['mapped', 'freeform'] as const) {
      const c = ctx({ mode })
      expect(walk('ArrowRight', 'FT-01.1', c), mode).toEqual(['FT-01.2'])
      expect(walk('ArrowLeft', 'FT-01.1', c), mode).toEqual([])
      // Epics live first: the retired EP-03 (order 2) is drawn last.
      expect(walk('ArrowRight', 'EP-01', c), mode).toEqual(['EP-02', 'EP-03'])
      expect(walkStep('ArrowDown', 'EP-01', c), mode).toBe('FT-01.1')
    }
    expect(walk('ArrowRight', 'US-01.1.3', ctx({ mode: 'mapped' }))).toEqual(['US-01.1.2', 'US-01.1.4', 'US-01.1.1'])
  })
})

describe('the walk in the column of cards no epic reaches (review)', () => {
  // FT-09.1's epic is missing: it stands in the orphan column, its first-lane story under it, its MVP story below.
  const orphan: Item[] = [
    item({ id: 'EP-01', type: 'epic' }),
    item({ id: 'FT-09.1', type: 'feature', parent: 'EP-09' }),
    item({ id: 'US-09.1.1', parent: 'FT-09.1', order: 1, swimlane: 'MVP' }),
    item({ id: 'US-09.1.2', parent: 'FT-09.1', order: 2 }),
  ]
  const idx = buildIndex(Object.fromEntries(orphan.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }])), {})
  const shown = (it: Item) => isShown(it, { index: idx, showRetired: false, selected: null })
  const c: WalkContext = { index: idx, shown, retired, map: mappedLayout(orphan, { lanes: ['MVP'], visible: shown, retired }) }

  it('Down from an orphan feature goes to the first story drawn under it, then down the column as drawn', () => {
    expect(walkStep('ArrowDown', 'FT-09.1', c)).toBe('US-09.1.2')
    expect(walk('ArrowDown', 'US-09.1.2', c)).toEqual(['US-09.1.1'])
  })
})

describe('the camera brings a card into view with its title showing (R-117)', () => {
  const pane: Pane = { w: 1600, h: 1000 }
  const dock = 520
  const narrow: Box = { x: 3000, y: 400, w: CARD.story.w, h: CARD.story.h }
  // An epic of eight features: about 2,100 flow pixels wide.
  const wide: Box = { x: 3000, y: 0, w: 8 * COL_PITCH - COL_GAP, h: CARD.epic.h }

  it('centres a card that fits in the board right of the panel', () => {
    for (const zoom of [0.5, 0.9, 1.4]) {
      const vp = centreViewport(narrow, pane, dock, zoom)
      expect((narrow.x + narrow.w / 2) * zoom + vp.x).toBeCloseTo((pane.w + dock) / 2)
      expect(cardInView(narrow, vp, pane, dock)).toBe(true)
    }
  })

  it('puts a card wider than the board with its left edge and title just right of the panel', () => {
    for (const zoom of [0.9, 1]) {
      const vp = centreViewport(wide, pane, dock, zoom)
      const left = wide.x * zoom + vp.x
      expect(left).toBeGreaterThanOrEqual(dock)
      expect(left).toBeLessThan(dock + 60)
      expect(cardInView(wide, vp, pane, dock)).toBe(true)
    }
  })
})

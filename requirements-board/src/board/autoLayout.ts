/**
 * The default story-map arrangement: epics as a row of column heads, each
 * epic's features side by side beneath it, stories stacked under their feature.
 * Stories that sit directly under an epic get their own headless column.
 * Epics wrap into bands (shelves on the wall) so the whole map fits a screen
 * instead of one very long strip. Pure and deterministic.
 */
import { compareSiblings } from '../../shared/ids.ts'
import type { Item, ItemType } from '../../shared/types.ts'

export const CARD: Record<ItemType, { w: number; h: number }> = {
  epic: { w: 0, h: 120 }, // width spans the epic's columns
  feature: { w: 232, h: 128 },
  story: { w: 232, h: 112 },
}
const COL_GAP = 40
const COL_PITCH = CARD.story.w + COL_GAP
const EPIC_GAP = 72
const BAND_GAP = 160
/** Epics wrap to a new band once a band would pass this width. */
export const BAND_WIDTH = 6400
const ROW_GAP = 48
const STACK_GAP = 14
export const FEATURE_Y = CARD.epic.h + ROW_GAP
const STORY_Y = FEATURE_Y + CARD.feature.h + ROW_GAP

export interface Placement {
  x: number
  y: number
  w: number
  h: number
}

/** Live items first, retired ones at the end of each stack, so toggling Retired never reflows the rest. */
const liveFirst = (a: Item, b: Item) => Number(a.status === 'Retired') - Number(b.status === 'Retired') || compareSiblings(a, b)

export function autoLayout(items: Item[]): Record<string, Placement> {
  const byId = new Map(items.map((i) => [i.id, i]))
  const kids = new Map<string, Item[]>()
  const epics: Item[] = []
  const orphans: Item[] = []
  for (const it of items) {
    if (it.type === 'epic' && !it.parent) epics.push(it)
    else if (it.parent && byId.has(it.parent)) {
      const list = kids.get(it.parent) ?? []
      list.push(it)
      kids.set(it.parent, list)
    } else orphans.push(it)
  }
  epics.sort(liveFirst)

  const out: Record<string, Placement> = {}
  const stack = (list: Item[], x: number, y0: number) => {
    let y = y0
    for (const s of list) {
      out[s.id] = { x, y, w: CARD.story.w, h: CARD.story.h }
      y += CARD.story.h + STACK_GAP
      // Anything nested deeper than the map expects (bad data) still gets a spot.
      const deeper = (kids.get(s.id) ?? []).sort(liveFirst)
      if (deeper.length) y = stack(deeper, x, y)
    }
    return y
  }

  let x = 0
  let top = 0
  let bandBottom = 0
  for (const epic of epics) {
    const children = (kids.get(epic.id) ?? []).sort(liveFirst)
    const features = children.filter((c) => c.type !== 'story')
    const direct = children.filter((c) => c.type === 'story')
    const cols = Math.max(1, features.length + (direct.length ? 1 : 0))
    const width = cols * COL_PITCH - COL_GAP
    if (x > 0 && x + width > BAND_WIDTH) {
      x = 0
      top = bandBottom + BAND_GAP
    }
    out[epic.id] = { x, y: top, w: width, h: CARD.epic.h }
    let bottom = top + CARD.epic.h
    let cx = x
    for (const f of features) {
      out[f.id] = { x: cx, y: top + FEATURE_Y, w: CARD.feature.w, h: CARD.feature.h }
      bottom = Math.max(bottom, top + FEATURE_Y + CARD.feature.h, stack((kids.get(f.id) ?? []).sort(liveFirst), cx, top + STORY_Y))
      cx += COL_PITCH
    }
    if (direct.length) bottom = Math.max(bottom, stack(direct, cx, top + FEATURE_Y))
    bandBottom = Math.max(bandBottom, bottom)
    x += width + EPIC_GAP
  }
  if (orphans.length) stack(orphans.sort(liveFirst), 0, bandBottom + BAND_GAP)
  return out
}

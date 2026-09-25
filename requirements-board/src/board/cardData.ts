/** A board card's node data and edge handles: the non-visual half of `CardNode.tsx`, shared with `graph.ts`. */
import { Position, type Node, type NodeHandle } from '@xyflow/react'
import type { Item } from '../../shared/types.ts'

export interface CardData extends Record<string, unknown> {
  item: Item
  w: number
  h: number
  openQuestions: number
  childCount: number
  /** 'lit' in the selected lineage, 'dim' outside it, 'faded' filtered out. */
  tone: '' | 'is-selected' | 'is-lit' | 'is-dim' | 'is-faded'
}
export type CardNodeType = Node<CardData, 'card'>

/**
 * Where a card's edge handles sit, given its size: the same 1px points the rendered
 * <Handle>s occupy (centred on the card's outer edge). Every node carries this, because
 * handles React Flow only measured from the DOM can be lost: a node rebuilt mid-measure
 * keeps its size but drops its handles, nothing re-measures an unchanged size, and every
 * line on the board vanishes until reload. Declared handles are re-read on every rebuild.
 */
export function cardHandles(w: number, h: number): NodeHandle[] {
  const at = (type: 'source' | 'target', position: Position, x: number, y: number, id: string | null = null) =>
    ({ id, type, position, x: x - 0.5, y: y - 0.5, width: 1, height: 1 }) as NodeHandle
  // Unnamed handles first: an edge without a handle id takes the first of its type.
  return [
    at('target', Position.Top, w / 2, 0),
    at('target', Position.Left, 0, h / 2, 'l'),
    at('source', Position.Bottom, w / 2, h),
    at('source', Position.Left, 0, h / 2, 'ls'),
  ]
}

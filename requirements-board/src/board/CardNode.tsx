import { Handle, Position, type Node, type NodeHandle, type NodeProps } from '@xyflow/react'
import { ImageIcon, MessageCircleQuestion } from 'lucide-react'
import { memo } from 'react'
import type { Item } from '../../shared/types.ts'
import { StatusLabel } from '../components/bits.tsx'
import { BASELINE_STATUS, TYPE_LABEL, excerpt, statusClass, typeClass } from '../vocab.ts'

export interface CardData extends Record<string, unknown> {
  item: Item
  w: number
  h: number
  openQuestions: number
  childCount: number
  /** 'lit' in the selected lineage, 'dim' outside it, 'faded' filtered out, 'hit' search match. */
  tone: '' | 'is-selected' | 'is-lit' | 'is-dim' | 'is-faded' | 'is-hit'
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

function CardNodeImpl({ data }: NodeProps<CardNodeType>) {
  const { item, w, h, openQuestions, childCount, tone } = data
  // The handles sit outside .card so its borders never shift them off the geometry in `cardHandles`.
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="target" position={Position.Left} id="l" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      <Handle type="source" position={Position.Left} id="ls" isConnectable={false} />
      <div className={`card ${item.type} ${typeClass(item.type)} ${statusClass(item.status)} ${tone}`} style={{ width: w, height: h }} title={`${TYPE_LABEL[item.type]} ${item.id} · ${item.title}`}>
        <p className="card-title">{item.title}</p>
        {item.description && <p className="card-excerpt">{excerpt(item.description, 220)}</p>}
        <div className="card-foot">
          {openQuestions > 0 && (
            <span className="badge q" title={`${openQuestions} open question${openQuestions > 1 ? 's' : ''}`}>
              <MessageCircleQuestion size={11} />
              <span>{openQuestions}</span>
            </span>
          )}
          {item.images.length > 0 && (
            <span className="badge" title={`${item.images.length} screenshot${item.images.length > 1 ? 's' : ''}`}>
              <ImageIcon size={11} />
              <span>{item.images.length}</span>
            </span>
          )}
          {item.type === 'epic' && (
            <span className="count">
              {childCount} item{childCount === 1 ? '' : 's'}
            </span>
          )}
          {/* Proposed is the baseline; a card only carries a pill when its status is worth noticing. */}
          {item.status !== BASELINE_STATUS && <StatusLabel status={item.status} />}
        </div>
      </div>
    </>
  )
}

export const CardNode = memo(CardNodeImpl)

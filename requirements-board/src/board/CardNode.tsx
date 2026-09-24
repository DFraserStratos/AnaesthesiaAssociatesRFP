import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ImageIcon, MessageCircleQuestion } from 'lucide-react'
import { memo } from 'react'
import type { Item } from '../../shared/types.ts'
import { Glyph } from '../components/bits.tsx'
import { excerpt, statusClass } from '../vocab.ts'

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

function CardNodeImpl({ data }: NodeProps<CardNodeType>) {
  const { item, w, h, openQuestions, childCount, tone } = data
  return (
    <div className={`card ${item.type} ${statusClass(item.status)} ${tone}`} style={{ width: w, height: h }} title={item.title}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="target" position={Position.Left} id="l" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      <Handle type="source" position={Position.Left} id="ls" isConnectable={false} />
      <div className="card-top">
        <span className="card-id">{item.id}</span>
        {item.type === 'epic' && (
          <span className="card-id" style={{ color: 'var(--ink-3)' }}>
            {childCount} item{childCount === 1 ? '' : 's'}
          </span>
        )}
        <span className="card-badges">
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
        </span>
      </div>
      <p className="card-title">{item.title}</p>
      {item.description && <p className="card-excerpt">{excerpt(item.description, 220)}</p>}
      <div className="card-foot">
        {item.components.slice(0, 3).map((c) => (
          <Glyph key={c} component={c} />
        ))}
        <span className={`status ${statusClass(item.status)}`}>{item.status}</span>
      </div>
    </div>
  )
}

export const CardNode = memo(CardNodeImpl)

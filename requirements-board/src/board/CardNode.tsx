import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ImageIcon, MessageCircleQuestion } from 'lucide-react'
import { memo } from 'react'
import type { Item } from '../../shared/types.ts'
import { StatusLabel } from '../components/bits.tsx'
import { TYPE_LABEL, excerpt, statusClass, typeClass } from '../vocab.ts'

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
    <div className={`card ${item.type} ${typeClass(item.type)} ${statusClass(item.status)} ${tone}`} style={{ width: w, height: h }} title={`${TYPE_LABEL[item.type]} ${item.id} · ${item.title}`}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="target" position={Position.Left} id="l" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      <Handle type="source" position={Position.Left} id="ls" isConnectable={false} />
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
        {/* "From RFP" is the baseline; a card only carries a pill when its status is worth noticing. */}
        {item.status !== 'RFP' && <StatusLabel status={item.status} />}
      </div>
    </div>
  )
}

export const CardNode = memo(CardNodeImpl)

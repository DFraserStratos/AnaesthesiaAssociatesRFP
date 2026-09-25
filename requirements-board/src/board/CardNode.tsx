import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ImageIcon, MessageCircleQuestion } from 'lucide-react'
import { memo } from 'react'
import { TYPE_LABEL } from '../../shared/types.ts'
import { StatusLabel } from '../components/bits.tsx'
import { BASELINE_STATUS, excerpt, statusClass, typeClass } from '../vocab.ts'
import type { CardNodeType } from './cardData.ts'

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

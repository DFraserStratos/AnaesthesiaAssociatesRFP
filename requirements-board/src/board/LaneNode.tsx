/**
 * The Mapped board's non-card nodes: one band per lane (ruled at its top), the quiet add button at
 * the foot of each column in each lane, and the insertion bar shown during a
 * drag. None of them can be dragged or selected, and only the add button takes
 * the pointer, so panning over the canvas works everywhere else.
 */
import type { Node, NodeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { memo, useState } from 'react'
import { guarded, useOpen } from '../nav.ts'
import { useCatalogue } from '../store.ts'

export type LaneNodeType = Node<{ w: number; h: number }, 'lane'>
export type AddNodeType = Node<{ w: number; parent: string; swimlane: string | null; label: string }, 'add'>
export type MarkerNodeType = Node<{ w: number; h: number }, 'marker'>

/** A lane's band across the whole map, ruled at its top. Its header lives in `LaneHeaders`, pinned to the screen's left edge. */
export const LaneNode = memo(function LaneNode({ data }: NodeProps<LaneNodeType>) {
  return <div className="lane-band" style={{ width: data.w, height: data.h }} />
})

/** Makes an untitled story in this column and lane, then opens it in Edit (the same flow as the teal plus). */
export const AddNode = memo(function AddNode({ data }: NodeProps<AddNodeType>) {
  const createItem = useCatalogue((s) => s.createItem)
  const open = useOpen()
  const [busy, setBusy] = useState(false)
  const add = () =>
    guarded(async () => {
      setBusy(true)
      try {
        const rec = await createItem({ type: 'story', parent: data.parent, swimlane: data.swimlane, title: 'Untitled', status: 'Proposed' })
        open.item(rec.data.id, { edit: true })
      } catch (e) {
        useCatalogue.setState({ moveError: `Story not created: ${(e as Error).message}` })
      } finally {
        setBusy(false)
      }
    })
  return (
    <button className="add-slot nodrag nopan" style={{ width: data.w }} disabled={busy} onClick={add} aria-label={data.label} title={data.label}>
      <Plus size={15} />
    </button>
  )
})

/** Marks where the dragged card will land. */
export const MarkerNode = memo(function MarkerNode({ data }: NodeProps<MarkerNodeType>) {
  return <div className="drop-bar" style={{ width: data.w, height: data.h }} />
})

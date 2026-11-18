/**
 * The stub's small markers (catch-up Phase 33a): presentational only, no store,
 * so `ListRow` and the Day grid can draw them. Built on 15a's `AttentionDot`.
 */

import type { CSSProperties } from 'react'
import { listStubNote } from '../../domain/intake/stubs'
import { semantic } from '../../theme/tokens'
import { AttentionDot } from '../warnings/AttentionDot'

/** The marker beside a List's count (Lists rows, the Day grid block): a triangle disc, labelled with the count. */
export function StubMarker({ count, size = 13, shot = 'stub-marker', style }: { count: number; size?: number; shot?: string; style?: CSSProperties }) {
  if (count <= 0) return null
  const text = listStubNote(count)
  return <AttentionDot size={size} glyph="triangle" tone="warning" label={text} title={text} shot={shot} style={style} />
}

/** "1 waiting at intake" beside a List's progress. */
export function ListStubNote({ count, style }: { count: number; style?: CSSProperties }) {
  if (count <= 0) return null
  return (
    <span data-shot="list-stub-note" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: semantic.warning.onTint, flex: 'none', ...style }}>
      <AttentionDot size={12} glyph="triangle" tone="warning" />
      {listStubNote(count)}
    </span>
  )
}

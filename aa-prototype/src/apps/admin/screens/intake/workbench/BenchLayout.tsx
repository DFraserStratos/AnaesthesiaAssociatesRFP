/**
 * The opened arrival's body (27 Nov 2026 rebuild; docs/explorations/intake-inbox-iterations.html, O1): the document on
 * the grey desk at the left, scrolling on its own, and the white decision column at the right with its actions pinned
 * in a footer directly under the choice (`DecisionColumn`). Every bench renders this with its three slots
 * (`benchProps.ts`), so every kind lays out the same way. Below `STACK_BELOW` wide the two stack, the document first.
 *
 * Hooks: `shot` as `data-shot` on the root (`intake-bench-<kind>`); `data-bench-document` on the desk,
 * `intake-decision-column` on the column.
 */

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { DecisionColumn } from '../../../../../shared/surface'
import { elevation, neutral, radius, space } from '../../../../../theme/tokens'
import type { BenchLayoutProps } from './benchProps'

/** Narrower than this, the document sits above the decision. */
const STACK_BELOW = 960
/** The decision column: about 560 at 1440 (O1), never under 480 or over 600; `wide` (an update's difference table) about 640. */
const DECISION_WIDTH = { standard: 'clamp(480px, 48%, 600px)', wide: 'clamp(520px, 55%, 680px)' } as const

function useStacked(ref: RefObject<HTMLElement>): boolean {
  const [stacked, setStacked] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const read = () => setStacked(el.clientWidth > 0 && el.clientWidth < STACK_BELOW)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return stacked
}

export function BenchLayout({ document, decision, actions, shot, decisionWidth = 'standard', ...data }: BenchLayoutProps) {
  const root = useRef<HTMLDivElement>(null)
  const stacked = useStacked(root)
  return (
    <div
      ref={root}
      {...data}
      data-shot={shot}
      data-bench-layout={stacked ? 'stacked' : 'split'}
      style={{
        flex: '1 1 0',
        minHeight: 0,
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: stacked ? 'minmax(0, 1fr)' : `minmax(0, 1fr) ${DECISION_WIDTH[decisionWidth]}`,
        gridTemplateRows: stacked ? 'auto auto' : 'minmax(0, 1fr)',
        overflow: stacked ? 'auto' : 'hidden',
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        boxShadow: elevation.e1,
        background: neutral.surface,
      }}
    >
      <div
        data-bench-document
        style={{ background: neutral.sunken, minWidth: 0, minHeight: 0, overflow: stacked ? 'visible' : 'auto', padding: space[6], display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: 820, minWidth: 0, display: 'flex', flexDirection: 'column', gap: space[4] }}>{document}</div>
      </div>
      <DecisionColumn
        shot="intake-decision-column"
        label="Decision"
        {...(actions !== undefined ? { footer: actions } : {})}
        style={stacked ? { borderTop: `1px solid ${neutral.line}` } : { borderLeft: `1px solid ${neutral.line}` }}
      >
        {decision}
      </DecisionColumn>
    </div>
  )
}

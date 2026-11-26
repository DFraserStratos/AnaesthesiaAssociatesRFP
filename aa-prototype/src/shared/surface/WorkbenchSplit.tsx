/**
 * The docked workbench split (build plan Phase 68; docs/explorations/intake-ideas.html #idea1): a list
 * on the left at a fixed width beside the detail of what is picked in it, both at the full height of
 * their container. Intake's arrivals feed and its workbench are the first use.
 *
 * SidePanel's non-modal sibling: no scrim, no portal, no focus trap, no Escape and nothing inert. The
 * split is part of the page, so focus and scroll stay in each column and the page around it stays
 * usable. Each column is a labelled region that scrolls on its own; a 1px `line` divider sits between
 * them. The feed is the white surface, the workbench the page's `bg`, as the mockup draws them.
 *
 * In an Admin `fit` page it takes the rest of the window (`flex: 1`, `min-height: 0`). `framed` (the
 * default) gives it the main data surface's frame, as `TableShell fit` has (line border,
 * `radius.card`, e1); `framed={false}` sits flush, for a page that draws its own edges. The columns
 * carry no padding: each caller lays out its own feed and bench.
 */

import type { CSSProperties, ReactNode } from 'react'
import { elevation, neutral, radius } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from '../ui/Field'

/** The feed column's width when none is given (the #idea1 mockup's 400px feed). */
export const WORKBENCH_FEED_WIDTH = 400

export interface WorkbenchSplitProps extends DataAttributes {
  /** The left column: the list (Intake's arrivals feed). */
  feed: ReactNode
  /** The right column: the detail of the picked item (Intake's workbench). */
  workbench: ReactNode
  /** The feed column's fixed width in px (default 400). */
  feedWidth?: number
  /** The feed region's accessible name (default "List"). */
  feedLabel?: string
  /** The workbench region's accessible name (default "Detail"). */
  workbenchLabel?: string
  /** The main data surface's frame (default true); false sits flush. */
  framed?: boolean
  shot?: string
  style?: CSSProperties
}

const COLUMN: CSSProperties = {
  minHeight: 0,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
}

export function WorkbenchSplit({
  feed,
  workbench,
  feedWidth = WORKBENCH_FEED_WIDTH,
  feedLabel = 'List',
  workbenchLabel = 'Detail',
  framed = true,
  shot,
  style,
  ...rest
}: WorkbenchSplitProps) {
  return (
    <div
      {...dataAttributesOf(rest)}
      data-shot={shot}
      data-workbench-split=""
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        alignItems: 'stretch',
        background: neutral.bg,
        ...(framed
          ? { border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: elevation.e1, overflow: 'hidden' }
          : {}),
        ...style,
      }}
    >
      <section
        aria-label={feedLabel}
        data-workbench-split-feed=""
        style={{ ...COLUMN, width: feedWidth, flex: 'none', background: neutral.surface, borderRight: `1px solid ${neutral.line}` }}
      >
        {feed}
      </section>
      <section aria-label={workbenchLabel} data-workbench-split-bench="" style={{ ...COLUMN, flex: 1, minWidth: 0 }}>
        {workbench}
      </section>
    </div>
  )
}

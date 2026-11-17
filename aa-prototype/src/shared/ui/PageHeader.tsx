import type { CSSProperties, ReactNode, Ref } from 'react'
import { neutral, type as typeScale } from '../../theme/tokens'
import type { DataAttributes } from './Field'

export type PageHeaderSize = 'web' | 'admin' | 'section'

const TITLE: Record<PageHeaderSize, CSSProperties> = {
  web: { fontSize: typeScale.pageTitleWeb.size, lineHeight: `${typeScale.pageTitleWeb.line}px`, fontWeight: typeScale.pageTitleWeb.weight, letterSpacing: typeScale.pageTitleWeb.tracking },
  admin: { fontSize: typeScale.pageTitle.size, lineHeight: `${typeScale.pageTitle.line}px`, fontWeight: typeScale.pageTitle.weight, letterSpacing: typeScale.pageTitle.tracking },
  section: { fontSize: 18, fontWeight: 700 },
}

const SUB: Record<PageHeaderSize, CSSProperties> = {
  web: { fontSize: 14, color: neutral.slate, marginTop: 4 },
  admin: { fontSize: 13, color: neutral.slate, marginTop: 4 },
  section: { fontSize: 12.5, color: neutral.mist, marginTop: 2, maxWidth: 820 },
}

/**
 * A page's title row (UI unification U6, group U31): the title, a slate sub-line and right-aligned
 * actions. `size` web is 28/34 (Web Dashboard), admin 24/30 (Admin Day, Admin Review), section the
 * 18/700 view title inside a page (Phase 42's `MasterHeader`). The title is an `h1` (`level` 2 for a
 * section). `count` sits beside the words inside the heading (a count badge, part of its name);
 * `aside` sits beside the heading outside it (an identifier chip, a warning triangle), `asideGap` from
 * it (10 by default); `headingRef` takes the heading for focus
 * return (it then gets `tabIndex={-1}`, as the Notifications page needs). `subStyle` widens or narrows
 * the sub-line; `wrap` lets the actions drop below the title on a narrow page (web).
 */
export function PageHeader({
  title,
  sub,
  actions,
  size,
  level,
  count,
  aside,
  asideGap = 10,
  headingRef,
  wrap = false,
  actionsStyle,
  subStyle,
  style,
  shot,
  ...data
}: {
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
  size: PageHeaderSize
  level?: 1 | 2
  count?: ReactNode
  aside?: ReactNode
  asideGap?: number
  headingRef?: Ref<HTMLHeadingElement>
  wrap?: boolean
  /** The actions wrapper's own style (Review pins its column right with `marginLeft: 'auto'` when wrapped). */
  actionsStyle?: CSSProperties
  subStyle?: CSSProperties
  style?: CSSProperties
  shot?: string
} & DataAttributes) {
  const H = (level ?? (size === 'section' ? 2 : 1)) === 2 ? 'h2' : 'h1'
  const h = (
      <H
        ref={headingRef}
        {...(headingRef !== undefined ? { tabIndex: -1 } : {})}
        style={{
          margin: 0,
          ...TITLE[size],
          ...(count !== undefined ? { display: 'flex', alignItems: 'center', gap: 10 } : {}),
          ...(headingRef !== undefined ? { outline: 'none' } : {}),
        }}
      >
        {title}
        {count}
      </H>
  )
  const heading = (
    <div style={{ minWidth: 0 }}>
      {aside !== undefined ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: asideGap, flexWrap: 'wrap' }}>
          {h}
          {aside}
        </div>
      ) : (
        h
      )}
      {sub !== undefined && <div style={{ ...SUB[size], ...subStyle }}>{sub}</div>}
    </div>
  )
  return (
    <div
      {...data}
      data-shot={shot}
      style={{
        ...(actions !== undefined
          ? { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: size === 'section' ? 12 : 16, ...(wrap ? { flexWrap: 'wrap' } : {}) }
          : {}),
        ...style,
      }}
    >
      {heading}
      {actions !== undefined && <div style={{ ...(wrap ? {} : { flex: 'none' }), ...(size === 'section' ? { whiteSpace: 'nowrap' } : {}), ...actionsStyle }}>{actions}</div>}
    </div>
  )
}

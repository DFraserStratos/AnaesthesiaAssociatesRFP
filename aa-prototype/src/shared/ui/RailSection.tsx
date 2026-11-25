/**
 * A record page's side panel section (lifted out of the Contract page's "On this Contract" by build
 * plan Phase 53; D104): a card titled with its count, an optional aside, the first few rows (five by
 * default), an empty line when there are none, and "See all N" to the full list when there are more.
 * A side panel shows a few rows of each kind with See all, never a tab listing everything. Each row is
 * a link title over a sub line (`RailRow`). The People pages (54 to 57) build their side panels from
 * it and extend it by a prop that defaults to today's behaviour; none copies it.
 */

import type { CSSProperties, ReactNode } from 'react'
import { neutral } from '../../theme/tokens'
import { Card } from './Card'
import { CountBadge } from './CountBadge'
import { TextAction } from './TextAction'

type DataProps = { [key: `data-${string}`]: string }

export interface RailRowProps extends DataProps {
  /** Where the title links. */
  to: string
  title: string
  sub: ReactNode
  /** The first row has no rule above it. */
  first: boolean
}

/** One row: the title as a link over its sub line, `data-*` passed through to the `li`. */
export function RailRow({ to, title, sub, first, ...data }: RailRowProps) {
  return (
    <li {...data} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderTop: first ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}>
      <TextAction size="sm" flush to={to}>{title}</TextAction>
      <span style={{ fontSize: 12, color: neutral.slate }}>{sub}</span>
    </li>
  )
}

/** A row of a section, keyed; `data` goes onto its `li`. */
export interface RailSectionRow {
  key: string
  to: string
  title: string
  sub: ReactNode
  data?: DataProps
}

export interface RailSectionProps {
  title: string
  /** The hidden noun after the count, for a screen reader ("Procedures and Bookings"). */
  countNoun?: string
  /** Every row, in order; the section shows the first `limit`. */
  rows: readonly RailSectionRow[]
  /** How many rows show before See all; default 5. */
  limit?: number
  /** The line shown when there are no rows. */
  empty: ReactNode
  /** Where See all opens: the whole list. */
  allTo: string
  /** A short note beside the title. */
  aside?: ReactNode
  /** The section's hook; See all carries `${shot}-all`. */
  shot: string
  style?: CSSProperties
}

export function RailSection({ title, countNoun, rows, limit = 5, empty, allTo, aside, shot, style }: RailSectionProps) {
  const shown = rows.slice(0, limit)
  return (
    <Card
      title={<>{title} <CountBadge count={rows.length} hideAtZero={false} mono {...(countNoun !== undefined ? { srNoun: countNoun } : {})} /></>}
      shot={shot}
      {...(aside !== undefined ? { aside } : {})}
      {...(style !== undefined ? { style } : {})}
    >
      {rows.length === 0 ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>{empty}</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {shown.map((r, i) => (
            <RailRow key={r.key} first={i === 0} to={r.to} title={r.title} sub={r.sub} {...r.data} />
          ))}
        </ul>
      )}
      {rows.length > shown.length && (
        <TextAction size="sm" flush to={allTo} shot={`${shot}-all`}>{`See all ${rows.length}`}</TextAction>
      )}
    </Card>
  )
}

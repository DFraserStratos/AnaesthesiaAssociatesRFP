/**
 * The one table kit (UI unification U6, README group U10): header cell, body cell, group row and the
 * density that sizes them. The header is the Admin Review mockup's (`Admin Review.dc.html` 77 to 87):
 * 11/600/0.06em mist caps on the `neutral.bg` band over a `line` rule; body rows are divided by
 * `sunken` (question 19). Web tables are `comfortable` (12px 20px, today's look); admin tables keep
 * their tighter padding and size as `compact` (10px 10px at 13) and `dense` (8px 10px at 12.5, the
 * audit and master tables), so no row changes height. Lives in `src/shared` so web and mobile can
 * import it and `pwaPurity.test.ts` holds.
 */

import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { accent, neutral, space, type as typeScale } from '../../theme/tokens'
import type { DataAttributes } from '../ui/Field'

export type TableDensity = 'comfortable' | 'compact' | 'dense'
export type CellAlign = 'left' | 'right' | 'center'

export const TableDensityContext = createContext<TableDensity>('comfortable')

/** Clickable rows set this to `middle`, so their cells centre beside the row's handle. */
export const RowAlignContext = createContext<'top' | 'middle' | undefined>(undefined)

const PADDING: Record<TableDensity, string> = { comfortable: '12px 20px', compact: '10px 10px', dense: '8px 10px' }
const BODY_SIZE: Record<TableDensity, number | undefined> = { comfortable: undefined, compact: 13, dense: 12.5 }

/** A body cell's style at a density: the padding, the `sunken` divider, left and top (middle on web). */
export function densityCellStyle(density: TableDensity): CSSProperties {
  const comfortable = density === 'comfortable'
  return {
    padding: PADDING[density],
    ...(BODY_SIZE[density] !== undefined ? { fontSize: BODY_SIZE[density] } : {}),
    borderBottom: `1px solid ${neutral.sunken}`,
    textAlign: 'left',
    verticalAlign: comfortable ? 'middle' : 'top',
    ...(comfortable ? { whiteSpace: 'nowrap' } : {}),
  }
}

/** A header cell's style at a density: the mockup's micro caps on the `bg` band over a `line` rule. */
export function densityHeadCellStyle(density: TableDensity): CSSProperties {
  return {
    padding: PADDING[density],
    fontSize: typeScale.micro.size,
    fontWeight: typeScale.micro.weight,
    letterSpacing: typeScale.micro.tracking,
    textTransform: 'uppercase',
    color: neutral.mist,
    background: neutral.bg,
    borderBottom: `1px solid ${neutral.line}`,
    textAlign: 'left',
    verticalAlign: density === 'comfortable' ? 'middle' : 'top',
    ...(density === 'comfortable' ? { whiteSpace: 'nowrap' } : {}),
  }
}

/** A sortable column's state (catch-up Phase 37's Billing monitor): `aria-sort` on the head, a button inside. */
export interface ThSort {
  direction: 'ascending' | 'descending' | 'none'
  onSort: () => void
}

/**
 * A column header (`scope="col"`). `nowrap` keeps a short head like "B · T · M" on one line. `sort`
 * makes it sortable: the head carries `aria-sort` and its label becomes a button, with a teal
 * underline and an arrow on the active column; without it the head is today's plain label.
 */
export function Th({
  children,
  align,
  width,
  nowrap,
  sort,
  style,
  ...data
}: {
  children?: ReactNode
  align?: CellAlign
  width?: number | string
  nowrap?: boolean
  sort?: ThSort
  style?: CSSProperties
} & DataAttributes) {
  const density = useContext(TableDensityContext)
  const active = sort !== undefined && sort.direction !== 'none'
  return (
    <th
      scope="col"
      {...(sort !== undefined ? { 'aria-sort': sort.direction } : {})}
      {...data}
      style={{
        ...densityHeadCellStyle(density),
        ...(align !== undefined ? { textAlign: align } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(nowrap === true ? { whiteSpace: 'nowrap' } : nowrap === false ? { whiteSpace: 'normal' } : {}),
        ...style,
      }}
    >
      {sort === undefined ? (
        children
      ) : (
        <button
          type="button"
          className="aa-ctl"
          onClick={sort.onSort}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            paddingBottom: 2,
            borderBottom: `2px solid ${active ? accent.base : 'transparent'}`,
            color: active ? accent.pressed : 'inherit',
          }}
        >
          {children}
          <span aria-hidden style={{ fontSize: 10, opacity: active ? 1 : 0.45 }}>{sort.direction === 'ascending' ? '↑' : sort.direction === 'descending' ? '↓' : '↕'}</span>
        </button>
      )}
    </th>
  )
}

/** A body cell: `mono` for figures and codes, `bold` 600, `clip` an ellipsis, `nowrap` on one line. */
export function Td({
  children,
  align,
  mono,
  bold,
  clip,
  nowrap,
  colSpan,
  style,
  ...data
}: {
  children?: ReactNode
  align?: CellAlign
  mono?: boolean
  bold?: boolean
  clip?: boolean
  nowrap?: boolean
  colSpan?: number
  style?: CSSProperties
} & DataAttributes) {
  const density = useContext(TableDensityContext)
  const rowAlign = useContext(RowAlignContext)
  return (
    <td
      {...data}
      colSpan={colSpan}
      className={mono === true ? 'mono' : undefined}
      style={{
        ...densityCellStyle(density),
        ...(rowAlign !== undefined ? { verticalAlign: rowAlign } : {}),
        ...(align !== undefined ? { textAlign: align } : {}),
        ...(bold === true ? { fontWeight: 600 } : {}),
        ...(nowrap === true ? { whiteSpace: 'nowrap' } : nowrap === false ? { whiteSpace: 'normal' } : {}),
        ...(clip === true ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
        ...style,
      }}
    >
      {children}
    </td>
  )
}

/**
 * A heading row across the table ("Earlier, not yet authorised"), always `th scope="colgroup"`.
 * `level="sub"` (build plan Phase 47) is the second-level heading under a group, as
 * `docs/explorations/contracts-section.html` #catalogue draws it: the small size, indented one
 * step, on the same `bg` band over a `sunken` rule. `group`, the default, is today's row.
 */
export function GroupRow({ span, level = 'group', children, style, ...data }: { span: number; level?: 'group' | 'sub'; children: ReactNode; style?: CSSProperties } & DataAttributes) {
  const density = useContext(TableDensityContext)
  const sub = level === 'sub'
  const [padY, padX] = (density === 'comfortable' ? '10px 20px' : PADDING[density]).split(' ')
  return (
    <tr {...data} {...(sub ? { 'data-group-level': 'sub' } : {})} style={{ background: neutral.bg }}>
      <th
        colSpan={span}
        scope="colgroup"
        style={{
          textAlign: 'left',
          padding: `${padY} ${padX}`,
          fontSize: sub ? typeScale.small.size : 13,
          fontWeight: 600,
          color: neutral.slate,
          borderBottom: `1px solid ${sub ? neutral.sunken : neutral.line}`,
          ...(sub ? { paddingLeft: `calc(${padX} + ${space[4]}px)` } : {}),
          ...style,
        }}
      >
        {children}
      </th>
    </tr>
  )
}

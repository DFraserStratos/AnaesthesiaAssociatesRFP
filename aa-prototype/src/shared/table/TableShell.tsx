import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { elevation, neutral, radius } from '../../theme/tokens'
import type { DataAttributes } from '../ui/Field'
import { TableDensityContext, type TableDensity } from './cells'

/**
 * The bordered white card with a horizontal scroller around a table (UI unification U6, group U10):
 * `line` border, `radius.card`, e1 (question 19: the main data surface carries e1, as the Admin Review
 * table and the Day grid do). `nested` is the flat `radius.ctl` table inside another card (Phase 37's
 * Billing monitor). `bare` drops the scroller's own chrome where a titled `Card` is the table's card (web
 * List detail, AA fees). It renders the `<table>`; pass `colgroup`, `thead` and `tbody` as children.
 *
 * When the table is wider than its scroller, the scroller becomes a named, focusable region
 * (`role="region"`, `aria-label` from `label`, `tabIndex={0}`) so the keyboard can scroll it; a
 * table that fits gets none of these. `label` is the screen's heading or the table's section title.
 * `shot`, `testId` and any `data-*` land on the scroller (where recipes and specs find them today);
 * `tableData` lands on the `<table>` itself.
 */
export function TableShell({
  children,
  label,
  minWidth,
  density,
  shot,
  testId,
  nested = false,
  bare = false,
  style,
  tableStyle,
  tableData,
  ...data
}: {
  children: ReactNode
  label: string
  minWidth?: number
  density?: TableDensity
  shot?: string
  testId?: string
  nested?: boolean
  bare?: boolean
  style?: CSSProperties
  tableStyle?: CSSProperties
  tableData?: DataAttributes
} & DataAttributes) {
  const scroller = useRef<HTMLDivElement>(null)
  const overflows = useOverflows(scroller)
  const resolved = density ?? 'comfortable'
  return (
    <TableDensityContext.Provider value={resolved}>
      <div
        ref={scroller}
        {...data}
        data-shot={shot}
        data-testid={testId}
        {...(overflows ? { role: 'region', 'aria-label': label, tabIndex: 0, className: 'aa-ctl' } : {})}
        style={{
          overflowX: 'auto',
          // The containing block for anything absolute inside (a visually hidden header label), so it
          // stays clipped by the scroller instead of stretching the page.
          position: 'relative',
          ...(bare
            ? {}
            : {
                background: nested ? undefined : neutral.surface,
                border: `1px solid ${neutral.line}`,
                borderRadius: nested ? radius.ctl : radius.card,
                boxShadow: nested ? undefined : elevation.e1,
              }),
          ...style,
        }}
      >
        <table
          {...tableData}
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            ...(minWidth !== undefined ? { minWidth } : {}),
            ...(resolved === 'comfortable' ? { fontSize: 14 } : {}),
            ...tableStyle,
          }}
        >
          {children}
        </table>
      </div>
    </TableDensityContext.Provider>
  )
}

/** True while the element's content is wider than the element (re-checked on resize). */
function useOverflows(ref: RefObject<HTMLElement | null>): boolean {
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1)
    check()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(el)
    if (el.firstElementChild !== null) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [ref])
  return overflows
}

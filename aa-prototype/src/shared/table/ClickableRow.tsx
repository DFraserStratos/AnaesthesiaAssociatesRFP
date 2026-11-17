import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { neutral } from '../../theme/tokens'
import type { DataAttributes } from '../ui/Field'
import { RowAlignContext } from './cells'

/** Keep links, buttons and fields inside a clickable table row in charge of their own action. */
export function isInteractiveRowTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('a, button, input, select, textarea') !== null
}

/**
 * A table row the mouse clicks to open its record (UI unification U6, group U09). It carries the
 * shared `.aa-clickable-table-row` class (pointer and the `sunken` hover on its cells, Design Language
 * "Hover on web rows") and ignores clicks on an inner link, button or field, so each keeps its own
 * action. The row itself never takes focus: put one `RowOpenButton` (or a link) in it as the keyboard
 * handle. Without `onOpen` it is a plain row (a free session with nothing to open) that still takes
 * the tones. `today` tints its cells `neutral.bg` (the hover still shows over it); `quiet` sets the
 * text slate (a submitted List). Its cells centre vertically; `align="top"` keeps a multi-line
 * row's cells at the top, as the Draft Lists and AA fee rows always were. `data-*` attributes pass through.
 */
export function ClickableRow({
  onOpen,
  today = false,
  quiet = false,
  align = 'middle',
  style,
  children,
  ...data
}: {
  onOpen?: () => void
  today?: boolean
  quiet?: boolean
  align?: 'top' | 'middle'
  style?: CSSProperties
  children: ReactNode
} & DataAttributes) {
  const classes = [onOpen !== undefined ? 'aa-clickable-table-row' : '', today ? 'aa-table-row-today' : ''].filter(Boolean).join(' ')
  return (
    <RowAlignContext.Provider value={align}>
      <tr
        {...data}
        className={classes === '' ? undefined : classes}
        onClick={
          onOpen !== undefined
            ? (event: MouseEvent<HTMLTableRowElement>) => {
                if (!isInteractiveRowTarget(event.target)) onOpen()
              }
            : undefined
        }
        style={{ ...(quiet ? { color: neutral.slate } : {}), ...style }}
      >
        {children}
      </tr>
    </RowAlignContext.Provider>
  )
}

/**
 * The row's one keyboard handle (U09): an unstyled text button (it reads as the cell's text) with a
 * full accessible name, "Open List Tue 21 Jul AM, Mercy Hospital". The row click stays for the mouse.
 */
export function RowOpenButton({
  label,
  onOpen,
  children,
  style,
  ...data
}: {
  label: string
  onOpen: () => void
  children: ReactNode
  style?: CSSProperties
} & DataAttributes) {
  return (
    <button
      type="button"
      className="aa-ctl"
      aria-label={label}
      {...data}
      onClick={onOpen}
      style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', ...style }}
    >
      {children}
    </button>
  )
}

/**
 * The one sheet and dialog title (UI unification U2, README U03): an h2 at
 * `type.sheetTitle` (18/24/700, question 12) and an optional 13px slate
 * description. Its id names the enclosing dialog (`aria-labelledby`), and on
 * web its presence shows the dialog's corner X (question 11); on the phone the
 * handle is the close (convention 16).
 *
 * Renders as two siblings, not a wrapper, so the sheet's own column gap keeps
 * spacing the title and description exactly as before. Inside the web `Dialog`
 * it portals into the dialog's pinned header instead, so it stays put while the
 * body scrolls (dialogSlots.ts).
 */

import { useId, useLayoutEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { neutral, type as typeScale } from '../../theme/tokens'
import { useOverlayTitleSeam } from './overlayTitle'
import { useDialogSlots } from './dialogSlots'

export interface OverlayHeaderProps {
  /** A fixed id where something else already points at the title (`contract-rail-title`); generated otherwise. */
  id?: string
  title: ReactNode
  description?: ReactNode
  /** Margins only, where a sheet spaced its title by hand (`marginBottom`). */
  style?: Pick<CSSProperties, 'marginBottom' | 'marginTop'>
  /** Something on the title's own row: a pill right after it (`inline`) or a link at the row's end (`end`). The web corner X's room is kept on the row. */
  trailing?: ReactNode
  trailingLayout?: 'inline' | 'end'
}

/** The room the web corner X needs beside the title. */
const CORNER_ROOM = 32

export function OverlayHeader({ id: fixedId, title, description, style, trailing, trailingLayout = 'inline' }: OverlayHeaderProps) {
  const generatedId = useId()
  const id = fixedId ?? generatedId
  const seam = useOverlayTitleSeam()
  const slots = useDialogSlots()
  const register = seam?.register
  useLayoutEffect(() => {
    if (register === undefined) return undefined
    register(id)
    return () => register(null)
  }, [register, id])
  const room = seam?.corner === true ? { paddingRight: CORNER_ROOM } : {}
  const heading = (
    <h2
      id={id}
      style={{
        margin: 0,
        fontSize: typeScale.sheetTitle.size,
        lineHeight: `${typeScale.sheetTitle.line}px`,
        fontWeight: typeScale.sheetTitle.weight,
        color: neutral.ink,
        ...(trailing === undefined ? room : {}),
        ...(trailing === undefined ? style : {}),
      }}
    >
      {title}
    </h2>
  )
  const end = trailingLayout === 'end'
  const header = (
    <>
      {trailing === undefined ? (
        heading
      ) : (
        <div style={{ display: 'flex', alignItems: end ? 'baseline' : 'center', justifyContent: end ? 'space-between' : undefined, gap: end ? 12 : 8, ...room, ...style }}>
          {heading}
          {trailing}
        </div>
      )}
      {description !== undefined && <p style={{ margin: 0, fontSize: 13, lineHeight: '19px', color: neutral.slate }}>{description}</p>}
    </>
  )
  return slots !== null ? createPortal(header, slots.header) : header
}

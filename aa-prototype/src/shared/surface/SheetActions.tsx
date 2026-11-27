/**
 * The one sheet footer (UI unification U2, README U18, question 13): the
 * surface decides the layout.
 *
 * - Phone (`mobile`): the primary stacked over the secondary (Mobile
 *   Availability mockup), each full width. Rendered as two siblings, so the
 *   sheet's own column gap spaces them as before.
 * - Web and Admin (`web`): one row, the secondary hugging its label first and
 *   the primary last, filling the rest.
 *
 * Pass the buttons as they are (`<Button block ...>`): labels, `disabled`,
 * `data-shot` and handlers stay on them. Footer buttons stay 54px
 * (question 7). Outside a `SurfaceProvider` it lays out as the phone. Hooks
 * stay on the buttons (`Button shot`), which render on both surfaces.
 *
 * Inside the web `Dialog` the row sticks to the dialog's bottom, so the action
 * stays on screen while the form scrolls (dialogPin.ts). `note` is
 * the quiet line about what the action does: above the row on web (in the
 * pinned footer), after the buttons on the phone.
 */

import { useContext, type ReactNode } from 'react'
import { neutral } from '../../theme/tokens'
import { SurfaceCtx } from './context'
import { usePinnedPart } from './dialogPin'

export interface SheetActionsProps {
  primary: ReactNode
  secondary?: ReactNode
  /** What the action does, in one quiet line (e.g. "Saves it and applies it to the schedule ahead"). */
  note?: ReactNode
}

function Note({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12, lineHeight: '18px', color: neutral.mist }}>{children}</div>
}

export function SheetActions({ primary, secondary, note }: SheetActionsProps) {
  const variant = useContext(SurfaceCtx)?.variant ?? 'mobile'
  const { pin, ref, style } = usePinnedPart('footer')
  const hasNote = note !== undefined && note !== null && note !== false
  const actions =
    variant === 'mobile' ? (
      <>
        {primary}
        {secondary}
        {hasNote && <Note>{note}</Note>}
      </>
    ) : (
      <>
        {hasNote && <Note>{note}</Note>}
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          {secondary !== undefined && secondary !== null && secondary !== false && <div style={{ flex: '0 0 auto', display: 'flex' }}>{secondary}</div>}
          <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex' }}>{primary}</div>
        </div>
      </>
    )
  if (pin === null) return actions
  return (
    <div ref={ref} data-aa-dialog-footer style={style}>
      {actions}
    </div>
  )
}

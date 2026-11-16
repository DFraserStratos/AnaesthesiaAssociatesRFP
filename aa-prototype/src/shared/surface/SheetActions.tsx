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
 */

import { useContext, type ReactNode } from 'react'
import { SurfaceCtx } from './context'

export interface SheetActionsProps {
  primary: ReactNode
  secondary?: ReactNode
}

export function SheetActions({ primary, secondary }: SheetActionsProps) {
  const variant = useContext(SurfaceCtx)?.variant ?? 'mobile'
  if (variant === 'mobile') {
    return (
      <>
        {primary}
        {secondary}
      </>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      {secondary !== undefined && secondary !== null && secondary !== false && <div style={{ flex: '0 0 auto', display: 'flex' }}>{secondary}</div>}
      <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex' }}>{primary}</div>
    </div>
  )
}

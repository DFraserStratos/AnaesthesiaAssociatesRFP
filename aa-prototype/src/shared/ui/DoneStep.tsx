/**
 * The one in-sheet done step (UI unification U2, README U18, F G10): the
 * TickBadge at 72, a title at 18/700 in `success.onTint`, an optional 13px
 * slate detail and the action, announced (`role="status"`) with focus on the
 * action at mount. Its title names the sheet it ends. The action node is the caller's: AddBookingFlow's primary
 * Done opens the new Booking; the others close the sheet.
 */

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { neutral, semantic, type as typeScale } from '../../theme/tokens'
import { TickBadge } from './TickBadge'
import { useOverlayTitleSeam } from '../surface/overlayTitle'

export interface DoneStepProps {
  title: ReactNode
  detail?: ReactNode
  /** The step's one button, usually `<Button block ...>Done</Button>`. */
  action: ReactNode
  shot?: string
}

export function DoneStep({ title, detail, action, shot }: DoneStepProps) {
  const actionRef = useRef<HTMLDivElement>(null)
  // The step's title names the sheet it ends (and keeps the web Dialog's corner X), like an OverlayHeader.
  const titleId = useId()
  const register = useOverlayTitleSeam()?.register
  useLayoutEffect(() => {
    if (register === undefined) return undefined
    register(titleId)
    return () => register(null)
  }, [register, titleId])
  useEffect(() => {
    actionRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus({ preventScroll: true })
  }, [])
  return (
    <div data-shot={shot} role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
      <TickBadge size={72} animate />
      <h2 id={titleId} style={{ margin: 0, fontSize: typeScale.sheetTitle.size, lineHeight: `${typeScale.sheetTitle.line}px`, fontWeight: typeScale.sheetTitle.weight, color: semantic.success.onTint, textAlign: 'center' }}>{title}</h2>
      {detail !== undefined && <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center', lineHeight: '19px' }}>{detail}</div>}
      <div ref={actionRef} style={{ alignSelf: 'stretch', marginTop: 4, display: 'flex' }}>
        {action}
      </div>
    </div>
  )
}

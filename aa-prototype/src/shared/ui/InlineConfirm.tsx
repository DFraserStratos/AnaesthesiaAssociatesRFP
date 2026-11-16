/**
 * The one in-card confirm (UI unification U2, README U18, F G6): the
 * AvailabilitySlotPanel block (a `neutral.bg` box with pill actions), with the
 * primary to the right of "Keep it" on web and on the phone (question 13).
 * Focus moves to "Keep it" on open; on "Keep it" it goes back to the control
 * that opened the confirm (`returnFocus`, the Delete link), which today was
 * lost when that link unmounted.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'

export interface InlineConfirmProps {
  /** The group's accessible name ("Delete the series"). */
  label: string
  message: ReactNode
  confirmLabel: ReactNode
  onConfirm: () => void
  cancelLabel: ReactNode
  onCancel: () => void
  /** Where focus goes back after "Keep it" (the Delete link); called once the confirm has gone and the link is back. */
  returnFocus?: () => HTMLElement | null | undefined
  shot?: string
}

export function InlineConfirm({ label, message, confirmLabel, onConfirm, cancelLabel, onCancel, returnFocus, shot }: InlineConfirmProps) {
  const keepRef = useRef<HTMLButtonElement>(null)
  const cancelled = useRef(false)
  // The latest return target, so the focus effect runs once per opening, never per render.
  const returnRef = useRef(returnFocus)
  returnRef.current = returnFocus
  useEffect(() => {
    keepRef.current?.focus({ preventScroll: true })
    return () => {
      // After "Keep it" the opener is back on screen: return focus to it.
      if (cancelled.current) queueMicrotask(() => returnRef.current?.()?.focus({ preventScroll: true }))
    }
  }, [])

  return (
    <div data-shot={shot} role="group" aria-label={label} style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, lineHeight: '19px', color: neutral.ink }}>{message}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          ref={keepRef}
          type="button"
          onClick={() => {
            cancelled.current = true
            onCancel()
          }}
          style={pillStyle(false)}
        >
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} style={pillStyle(true)}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

function pillStyle(primary: boolean): CSSProperties {
  return {
    minHeight: 38,
    padding: '0 14px',
    borderRadius: radius.pill,
    border: `1px solid ${primary ? accent.base : neutral.lineStrong}`,
    background: primary ? accent.base : neutral.surface,
    color: primary ? neutral.surface : accent.pressed,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

/**
 * The line that confirms in place that an action happened (UI unification U3,
 * README group U12; moved from `AvailabilityForm`). Success tint with the
 * success on-tint text (question 14: teal is never status), `radius.ctl`,
 * `10px 12px`, 13/18.
 *
 * The `role="status"` region is always mounted, empty and visually hidden until
 * a line arrives, so a screen reader hears the text when it lands (as the PWA's
 * update prompt does). It never takes focus. `actions` are real buttons after
 * the words; `onDismiss` adds a labelled close. Inside the phone each control is
 * at least 44px (question 25). `shot` lands on the region with the words (an
 * empty region carries none), so a recipe waiting on it waits for the text. The text is set one tick after the region mounts, so
 * even a line that mounts with its text (a result view that appears on apply)
 * is announced. `plain` is the text-only line (12.5, success on-tint, no box)
 * where a list already frames it (`SeriesList`).
 */

import { useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { radius, semantic } from '../../theme/tokens'
import { SurfaceCtx } from '../surface/context'
import { visuallyHidden } from './visuallyHidden'

export function ResultLine({
  line,
  actions,
  onDismiss,
  dismissLabel = 'Dismiss',
  plain = false,
  shot,
  style,
}: {
  line: ReactNode | null | undefined
  actions?: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  plain?: boolean
  shot?: string
  /** Placement only (margins, alignment). */
  style?: CSSProperties
}) {
  const touch = useContext(SurfaceCtx)?.variant === 'mobile'
  // The region mounts empty; the words arrive after it, so a screen reader announces them.
  const [text, setText] = useState<ReactNode>(null)
  useEffect(() => {
    setText(line ?? null)
  }, [line])
  const shown = text !== null && text !== ''
  const box: CSSProperties = plain
    ? { color: semantic.success.onTint, fontSize: 12.5, ...style }
    : {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: semantic.success.tint,
        color: semantic.success.onTint,
        borderRadius: radius.ctl,
        padding: '10px 12px',
        fontSize: 13,
        lineHeight: '18px',
        ...style,
      }
  return (
    // The hook joins the region with its words, so a recipe or spec waiting on it waits for the text.
    <div role="status" data-shot={shown ? shot : undefined} style={shown ? box : visuallyHidden}>
      {shown && (
        <>
          <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
          {actions !== undefined && <span style={{ display: 'flex', gap: 8, flex: 'none', alignItems: 'center', minHeight: touch ? 44 : undefined }}>{actions}</span>}
          {onDismiss !== undefined && (
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={onDismiss}
              style={{
                flex: 'none',
                width: touch ? 44 : 28,
                height: touch ? 44 : 28,
                margin: touch ? '-10px -8px -10px 0' : '-4px -4px -4px 0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: radius.pill,
                background: 'transparent',
                color: semantic.success.onTint,
                cursor: 'pointer',
              }}
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </>
      )}
    </div>
  )
}

/**
 * A non-blocking note inside a form, panel or page (UI unification U3, README
 * group U11): the ConflictCallout shell is the one look.
 *
 * - `warning`, `error`, `success`: the tone's tint and on-tint text, `radius.card`,
 *   `12px 14px`, 13/18, a 16px icon in the tone's solid. Warning and error
 *   draw the triangle by default. `error` is for booking-level banners only,
 *   never a form refusal (`FormError` owns those).
 * - `neutral`: `neutral.bg` with a `neutral.line` border, `radius.card`,
 *   `10px 12px`, 13/19, ink text; no icon unless one is passed. The teal info
 *   notes moved here (question 14: teal is never status).
 *
 * `live` gives the note the role it announces with ("status" for a note that
 * appears after a choice, such as the conflict and pairing warnings); a note
 * with no `live` has no role, so a note keeps exactly the role it had. The
 * icon is always `aria-hidden`. `shot` and `data-*` land on the box.
 */

import type { CSSProperties, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { neutral, radius, semantic } from '../../theme/tokens'

export type NoticeTone = 'warning' | 'error' | 'success' | 'neutral'

type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }

export type NoticeProps = {
  tone: NoticeTone
  /** A bold first line. */
  title?: ReactNode
  /** The leading icon; `false` for none. Warning and error default to the triangle. */
  icon?: ReactNode | false
  live?: 'status' | 'alert'
  /** A control at the right end (a tick, a text action): a real button, after the words. */
  action?: ReactNode
  shot?: string
  /** Placement only (margins, alignment). */
  style?: CSSProperties
  children?: ReactNode
} & DataAttributes

const TONED: Record<Exclude<NoticeTone, 'neutral'>, { tint: string; onTint: string; solid: string }> = semantic

export function Notice({ tone, title, icon, live, action, shot, style, children, ...data }: NoticeProps) {
  const shell: CSSProperties =
    tone === 'neutral'
      ? { background: neutral.bg, border: `1px solid ${neutral.line}`, color: neutral.ink, padding: '10px 12px', lineHeight: '19px' }
      : { background: TONED[tone].tint, color: TONED[tone].onTint, padding: '12px 14px', lineHeight: '18px' }
  const iconColor = tone === 'neutral' ? neutral.slate : TONED[tone].solid
  const glyph = icon === false ? null : icon ?? (tone === 'warning' || tone === 'error' ? <TriangleAlert size={16} /> : null)
  return (
    <div
      {...data}
      role={live}
      data-shot={shot}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: radius.card, fontSize: 13, ...shell, ...style }}
    >
      {glyph !== null && (
        <span aria-hidden style={{ display: 'inline-flex', flexShrink: 0, marginTop: 1, color: iconColor }}>
          {glyph}
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        {title !== undefined && <strong style={{ fontWeight: 600 }}>{title}</strong>}
        {children}
      </div>
      {action !== undefined && <div style={{ flex: 'none', alignSelf: 'center' }}>{action}</div>}
    </div>
  )
}

import type { CSSProperties, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { stampText } from '../../domain/dateText'
import { dataAttributesOf, type DataAttributes } from './Field'

export interface NoticeLineProps extends DataAttributes {
  /** The sentence ("Dr Hughes moved a List to you ..."). */
  text: ReactNode
  /** The sender's own words, printed quoted in slate. */
  message?: string
  /** Words before the quoted message ("Note: " on an office alert). */
  messagePrefix?: string
  /** `data-shot` on the message line. */
  messageShot?: string
  /** When it happened: printed through `stampText`, "Tue 21 Jul, 08:00" (question 24). */
  atISO?: string
  /** After the stamp on its line (" · Kirsty W."). */
  stampSuffix?: string
  /** The stamp inside the sentence, mono (the Admin drawer's "moved here" lines), after `stampJoin` (" · "). */
  stampInline?: boolean
  stampJoin?: string
  /** `md` (default: 13.5 sentence, 13 message, 12 stamp) or `sm`, the Admin rail's density (12.5, 12, 11). */
  size?: 'md' | 'sm'
  /** The sentence at 600 (a notice the office acts on). */
  strong?: boolean
  /** A resolved notice: the sentence in slate. */
  muted?: boolean
  /** `success`: every line in the success on-tint, inside a success `Notice` ("The office has dealt with this"). */
  tone?: 'neutral' | 'success'
  /** A line under the stamp (who resolved it; an inline refusal). */
  footer?: ReactNode
  /** Opens what the notice is about: the words become one button, named by them. */
  onOpen?: () => void
  /** The open chevron after the words (default on when `onOpen`; the Admin rail draws none). */
  chevron?: boolean
  /** A control beside the words (the Resolve tick). */
  action?: ReactNode
  /** The row's own grey box (`neutral.bg`, radius 10, `8px 10px`): the moved-to-you rows. */
  boxed?: boolean
  shot?: string
  style?: CSSProperties
}

const SIZES = {
  md: { text: 13.5, textLine: '19px', message: 13, messageLine: '18px', stamp: 12 },
  sm: { text: 12.5, textLine: '17px', message: 12, messageLine: '17px', stamp: 11 },
} as const

/**
 * One notice as a line of words (UI unification U7, U35; J N4): the sentence, the sender's message in quotes,
 * and when, through `stampText`. The Admin notifications rail and page, the moved-to-you panels, the office's
 * alert line and the Admin drawer's "moved here" lines all print a notice this one way. A notice that opens
 * something is one button named by its words (with the chevron where the screen draws one); a Resolve tick
 * sits beside it in `action`. The box around it (a `Notice`, a rail row) stays the caller's, unless `boxed`.
 */
export function NoticeLine({
  text,
  message,
  messagePrefix = '',
  messageShot,
  atISO,
  stampSuffix = '',
  stampInline = false,
  stampJoin = ' · ',
  size = 'md',
  strong = false,
  muted = false,
  tone = 'neutral',
  footer,
  onOpen,
  chevron = true,
  action,
  boxed = false,
  shot,
  style,
  ...rest
}: NoticeLineProps) {
  const s = SIZES[size]
  const ok = tone === 'success' ? semantic.success.onTint : undefined
  const stamp = atISO !== undefined ? stampText(atISO) : undefined
  const words = (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: stampInline ? 2 : 3 }}>
      <span style={{ fontSize: s.text, lineHeight: s.textLine, fontWeight: strong ? 600 : 400, color: ok ?? (muted ? neutral.slate : neutral.ink) }}>
        {text}
        {stampInline && stamp !== undefined && (
          <>
            {stampJoin}
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{stamp}</span>
          </>
        )}
      </span>
      {message !== undefined && (
        <span data-shot={messageShot} style={{ fontSize: s.message, lineHeight: s.messageLine, color: ok ?? neutral.slate }}>
          {messagePrefix}"{message}"
        </span>
      )}
      {!stampInline && stamp !== undefined && (
        <span style={{ fontSize: s.stamp, color: ok ?? neutral.mist }}>
          {stamp}
          {stampSuffix}
        </span>
      )}
      {footer}
    </span>
  )
  const box: CSSProperties = boxed ? { padding: '8px 10px', borderRadius: radius.ctl, background: neutral.bg } : {}
  const row: CSSProperties = { display: 'flex', alignItems: action !== undefined ? 'flex-start' : 'center', gap: 8, minWidth: 0, ...box, ...style }
  const reset: CSSProperties = { padding: 0, border: 'none', background: boxed ? neutral.bg : 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'inherit' }
  const chevronMark = chevron ? <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden /> : null

  // Openable with nothing beside it: the whole row is the one button (its box included).
  if (onOpen !== undefined && action === undefined) {
    return (
      <button type="button" className="aa-ctl" data-shot={shot} {...dataAttributesOf(rest)} onClick={onOpen} style={{ ...reset, ...row, width: '100%' }}>
        {words}
        {chevronMark}
      </button>
    )
  }
  return (
    <div data-shot={shot} {...dataAttributesOf(rest)} style={row}>
      {onOpen !== undefined ? (
        <button type="button" className="aa-ctl" onClick={onOpen} style={{ ...reset, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
          {words}
          {chevronMark}
        </button>
      ) : (
        words
      )}
      {action}
    </div>
  )
}

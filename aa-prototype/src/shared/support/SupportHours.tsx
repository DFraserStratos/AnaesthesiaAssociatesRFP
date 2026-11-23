import { Phone } from 'lucide-react'
import { hoursText, statusText, SUPPORT_CONFIG } from '../../domain/support'
import type { PublicHoliday, SupportChannel } from '../../domain/types'
import { fontFamily, neutral, radius, semantic } from '../../theme/tokens'

/**
 * The panel's first block (catch-up Phase 43b): whether the line is open at
 * the demo clock's moment, the phone line in mono and the hours, all read
 * from `SUPPORT_CONFIG` and 42's calendar. The block the eye lands on first:
 * a filled sunken card, the status dot success green when open, mist when
 * closed (status, never the teal action colour).
 */
export function SupportHours({
  channel,
  dateISO,
  minutes,
  publicHolidays,
}: {
  channel: SupportChannel
  dateISO: string
  minutes: number
  publicHolidays: readonly PublicHoliday[]
}) {
  const status = statusText(channel, dateISO, minutes, publicHolidays)
  return (
    <div style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div data-shot="support-status" data-open={status.open ? 'true' : 'false'} role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: status.open ? semantic.success.onTint : neutral.ink }}>
        <span aria-hidden style={{ width: 9, height: 9, borderRadius: radius.pill, background: status.open ? semantic.success.solid : neutral.mist, flex: 'none' }} />
        {status.text}
      </div>
      {/* Plain text, not a tel: link: the number is fictional, so a tap on a handset must not dial it. */}
      <div data-shot="support-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: neutral.ink, width: 'fit-content' }}>
        <Phone size={18} strokeWidth={2} aria-hidden color={neutral.slate} />
        <span style={{ fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 600, letterSpacing: '0.01em' }}>{SUPPORT_CONFIG.phone}</span>
      </div>
      <div data-shot="support-hours" style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
        {hoursText(channel)}
      </div>
    </div>
  )
}

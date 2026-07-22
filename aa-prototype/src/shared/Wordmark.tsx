import type { CSSProperties } from 'react'
import { brand, fontFamily } from '../theme/tokens'

interface WordmarkProps {
  /** `light` = for light surfaces (crimson text); `dark` = for dark surfaces (white text). */
  tone?: 'light' | 'dark'
  /** Font size of the two words, in px. */
  size?: number
  style?: CSSProperties
}

/**
 * Text rendering of the AA wordmark, echoing the real logo's structure:
 * "Anaesthesia │ Associates ʟᴛᴰ" in a serif, the words sitting tight against a
 * crimson divider that drops just below the baseline (as the logo's rule does),
 * with LTD baseline-aligned and tucked against "Associates". Used where the
 * crimson-on-transparent logo image does not sit well (the dark admin
 * side-nav); the web app keeps the actual `Logo` image on its light chrome.
 *
 * On dark the words go white and the divider lightens so the crimson still
 * reads against the ink background; on light everything is crimson.
 */
export function Wordmark({ tone = 'light', size = 16, style }: WordmarkProps) {
  const wordColor = tone === 'dark' ? '#FFFFFF' : brand.base
  const ltdColor = tone === 'dark' ? 'rgba(255,255,255,0.72)' : brand.base
  // brand.base is near-invisible at 1px on the dark nav, so lift it on dark.
  const dividerColor = tone === 'dark' ? '#C25B72' : brand.base
  const word: CSSProperties = {
    fontFamily: fontFamily.serif,
    fontSize: size,
    lineHeight: 1,
    color: wordColor,
    letterSpacing: '0.005em',
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: Math.round(size * 0.28),
        ...style,
      }}
    >
      <span style={word}>Anaesthesia</span>
      {/* Baseline-aligned box: its bottom sits on the text baseline, then the
          translate drops it below, matching the logo's rule. */}
      <span
        aria-hidden
        style={{
          // flex none: the empty span is otherwise the only shrinkable item
          // in the row and gets crushed to 0 width when space is tight.
          flex: 'none',
          width: 1.5,
          height: Math.round(size * 0.85),
          background: dividerColor,
          transform: `translateY(${Math.round(size * 0.15)}px)`,
        }}
      />
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
        <span style={word}>Associates</span>
        <span
          style={{
            fontFamily: fontFamily.serif,
            fontSize: Math.max(8, Math.round(size * 0.32)),
            letterSpacing: '0.05em',
            color: ltdColor,
          }}
        >
          LTD
        </span>
      </span>
    </span>
  )
}

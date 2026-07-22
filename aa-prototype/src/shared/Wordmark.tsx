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
 * "Anaesthesia │ Associates ᴸᵀᴰ" in a serif with a crimson divider. Used where
 * the crimson-on-transparent logo image does not sit well (the dark admin
 * side-nav); the web app keeps the actual `Logo` image on its light chrome.
 *
 * On dark the words go white with the crimson divider as the identity accent
 * (matching the reference admin design); on light the words are crimson.
 */
export function Wordmark({ tone = 'light', size = 16, style }: WordmarkProps) {
  const wordColor = tone === 'dark' ? '#FFFFFF' : brand.base
  const ltdColor = tone === 'dark' ? 'rgba(255,255,255,0.6)' : brand.base
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
        alignItems: 'center',
        gap: Math.round(size * 0.5),
        ...style,
      }}
    >
      <span style={word}>Anaesthesia</span>
      <span
        aria-hidden
        style={{ width: 1, height: Math.round(size * 1.15), background: brand.base }}
      />
      <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 3 }}>
        <span style={word}>Associates</span>
        <span
          style={{
            fontFamily: fontFamily.ui,
            fontSize: Math.max(8, Math.round(size * 0.34)),
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: ltdColor,
            marginTop: Math.round(size * 0.05),
          }}
        >
          LTD
        </span>
      </span>
    </span>
  )
}

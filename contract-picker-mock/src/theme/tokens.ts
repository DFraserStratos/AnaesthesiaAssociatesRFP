/**
 * Design tokens — transcribed 1:1 from `docs/design/Design Language.dc.html`
 * (PROGRESS convention 17: that file is the token source of truth).
 *
 * This TS module is the RUNTIME source components read programmatically.
 * `global.css`'s `@theme` block mirrors the SAME hexes so Tailwind generates
 * matching utilities. If a value changes, change it in both places.
 *
 * Two hard rules (Design Language §01):
 *  - AA crimson (`brand.*`) is IDENTITY ONLY — masthead, wordmark, active nav,
 *    avatars. Never buttons, never status.
 *  - Deep teal (`accent.*`) is the ONLY action colour.
 */

/** The 8 neutrals: ink → surface. */
export const neutral = {
  ink: '#172320',
  slate: '#58635F',
  mist: '#8A9490',
  lineStrong: '#C9D1CE',
  line: '#E2E7E5',
  sunken: '#EDF1EF',
  bg: '#F6F8F7',
  surface: '#FFFFFF',
} as const

/** AA crimson — identity only (masthead, wordmark, active nav, avatars). */
export const brand = {
  base: '#A91E3E',
  deep: '#8C1533',
  tint: '#F7E7EC',
} as const

/** Deep teal — primary actions & selection only, never status. */
export const accent = {
  base: '#0D6E63',
  hover: '#0A5A51',
  pressed: '#084A43',
  tint: '#E1F0ED',
  /** Focus ring per Design Language §01. */
  focusRing: '0 0 0 3px rgba(13,110,99,0.30)',
} as const

/** Semantic colours with solid / tint / on-tint triples (Design Language §01). */
export const semantic = {
  success: { solid: '#1E8E5A', tint: '#E3F4EB', onTint: '#157A49' },
  warning: { solid: '#A16207', tint: '#F9F0DC', onTint: '#7C4D08' },
  error: { solid: '#C2403C', tint: '#FAE9E7', onTint: '#9C332F' },
} as const

/** Font families. Georgia serif stack: the wordmark + the invoice document voice (Phase 08). */
export const fontFamily = {
  ui: "'Schibsted Grotesk', system-ui, sans-serif",
  mono: "'Spline Sans Mono', ui-monospace, monospace",
  serif: "Georgia, 'Times New Roman', serif",
} as const

/**
 * Type scale (Design Language §03). Sizes/line-heights in px.
 * `body` is 15/22 on desktop, 16/24 on mobile.
 */
export const type = {
  display: { size: 32, line: 38, weight: 700, tracking: '-0.02em' },
  title: { size: 22, line: 28, weight: 700, tracking: '-0.01em' },
  heading: { size: 17, line: 24, weight: 600, tracking: '0' },
  body: { size: 15, line: 22, weight: 400, tracking: '0' },
  bodyMobile: { size: 16, line: 24, weight: 400, tracking: '0' },
  label: { size: 13, line: 16, weight: 600, tracking: '0' },
  caption: { size: 12, line: 16, weight: 500, tracking: '0' },
  micro: { size: 11, line: 14, weight: 600, tracking: '0.06em', caps: true },
  data: { size: 14, line: 20, weight: 500, tracking: '0' },
} as const

/** 4pt spacing scale (Design Language §04), keyed by the design's s-N names. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  10: 40,
  14: 56,
} as const

/** Corner radii (Design Language §04). Sheets round the top corners only. */
export const radius = {
  ctl: 10,
  card: 14,
  panel: 20,
  sheet: 24,
  pill: 999,
} as const

/** Elevation (Design Language §04). e-0 is a 1px line only, no shadow. */
export const elevation = {
  e0: 'none',
  e1: '0 1px 2px rgba(23,35,32,0.05), 0 2px 6px rgba(23,35,32,0.05)',
  e2: '0 2px 4px rgba(23,35,32,0.06), 0 8px 20px rgba(23,35,32,0.09)',
  e3: '0 8px 16px rgba(23,35,32,0.10), 0 24px 56px rgba(23,35,32,0.18)',
} as const

/** Scrim under sheets (Design Language §04). */
export const scrim = 'rgba(23,35,32,0.32)'

/** Grey backdrop the phone frame floats on (Decisions log 2026-07-21). */
export const phoneBackdrop = '#E4E8E6'

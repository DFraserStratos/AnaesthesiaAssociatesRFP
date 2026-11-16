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
  /** Hour gridlines and row dividers inside the admin day grid, lighter than `line` (Admin Day mockup; U1). */
  gridline: '#F1F4F2',
} as const

/** AA crimson — identity only (masthead, wordmark, active nav, avatars). */
export const brand = {
  base: '#A91E3E',
  deep: '#8C1533',
  tint: '#F7E7EC',
  /** Muted crimson text on the ink side nav, the "ADMIN" eyebrow (Admin Day and Admin Review mockups; U1). */
  onDarkMuted: '#D89AA9',
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
  // The sizes the sample pages use beside the Design Language scale (UI unification U1, question 22).
  // Added for later phases to read; no literal is swapped to them in U1.
  /** 12.5/18: secondary and table text (Admin Day, Admin Review, Mobile Availability; 600 where it labels). */
  small: { size: 12.5, line: 18, weight: 400, tracking: '0' },
  /** 11.5: small captions and table meta (Admin Day, Admin Review). Line height is the caption's. */
  captionSm: { size: 11.5, line: 16, weight: 500, tracking: '0' },
  /** 13.5: rail and nav labels (Admin Day, Admin Review, at 500). Line height the app's own. */
  labelLg: { size: 13.5, line: 18, weight: 500, tracking: '0' },
  /** 24/30/700: the admin and mobile page title (Admin Day, Admin Review, Mobile App). */
  pageTitle: { size: 24, line: 30, weight: 700, tracking: '-0.01em' },
  /** 28/34/700: the web page title (Web Dashboard, Web Availability). Admin 24 and web 28 are both kept (README section 5). */
  pageTitleWeb: { size: 28, line: 34, weight: 700, tracking: '-0.015em' },
  /**
   * 18/24/700: sheet, dialog and drawer titles. The app's own convention, not the design's (no
   * mockup draws an 18/24 title); question 12 made it the one sheet title. U2's `OverlayHeader` reads it.
   */
  sheetTitle: { size: 18, line: 24, weight: 700, tracking: '0' },
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
  /** 6: status blocks and small chips (Design Language status blocks; Admin Day; U1). */
  xs: 6,
  /** 8: small cards and inner wells (Web Dashboard, Mobile App; U1). */
  sm: 8,
  ctl: 10,
  /** 12: mobile capture cards and steppers (Mobile App, Admin Review; U1). */
  md: 12,
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
  /** A segmented control's sliding highlight (Design Language selection-slide demo; Mobile App; U1). */
  thumb: '0 1px 3px rgba(23,35,32,0.2)',
  /** The left edge of an advancing mobile card (Mobile App; with `motion.cardAdvance`; U1). */
  cardEdge: '-16px 0 32px rgba(23,35,32,0.12)',
} as const

/** Surfaces that are not a flat neutral (U1). */
export const surface = {
  /** A sticky translucent dock or header over scrolling content: `neutral.bg` at 92% (Mobile App). */
  frosted: 'rgba(246,248,247,0.92)',
} as const

/**
 * Stacking layers (U1). Not design-sourced: an engineering scale named from the values the app
 * already uses (detail/H-tokens.md section 7). Known clashes are left for U2's `useModalLayer`:
 * Dialog and PhoneFrame both sit at 200, and four unrelated layers share 60.
 */
export const zIndex = {
  raised: 1,
  popover: 30,
  drawerScrim: 40,
  drawer: 41,
  sticky: 45,
  overlay: 60,
  sheet: 70,
  shellMenu: 120,
  dialog: 200,
} as const

/** Scrim under sheets (Design Language §04). */
export const scrim = 'rgba(23,35,32,0.32)'

/** Grey backdrop the phone frame floats on (Decisions log 2026-07-21). */
export const phoneBackdrop = '#E4E8E6'

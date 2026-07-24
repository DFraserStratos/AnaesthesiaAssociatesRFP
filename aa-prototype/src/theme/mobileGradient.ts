/**
 * Mobile atmospheric gradient — Phase 13.
 *
 * A calm, AA-branded depth field painted behind the whole in-phone mobile
 * canvas: a broad accent-tint teal field plus a quieter brand-tint blush over a
 * white base, reading white-first and colour-second. Everything here is pure,
 * deterministic, CSS-only maths — NO raster / canvas / video / noise / animation
 * and NO React, store, or domain imports (see `gradientLabPurity.test.ts`).
 *
 * The checked-in look ships as `AA_DEFAULT_GRADIENT`; the temporary Gradient Lab
 * (behind `GRADIENT_LAB_ENABLED`) tunes a live copy of the same config. The
 * atmosphere survives the lab's removal because it is sourced from this default,
 * not from the lab.
 *
 * The design tokens (`neutral`/`accent`/`brand` tints) are the source colours;
 * this module never touches `statusColours` or the `semantic.*` status triples
 * (the atmosphere is decorative, never status).
 */

import { accent, brand, neutral } from './tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One radial colour field of the atmosphere (accent teal or identity blush). */
export interface GradientField {
  /** Field is rendered only when true. */
  enabled: boolean
  /** Source hex (`#RGB` or `#RRGGBB`). */
  color: string
  /** Anchor X, in % of the canvas (may sit off-canvas, e.g. -8). */
  x: number
  /** Anchor Y, in %. */
  y: number
  /** Ellipse horizontal spread, in %. */
  spreadX: number
  /** Ellipse vertical spread, in %. */
  spreadY: number
  /** Layer opacity 0..1 (folds into the colour-stop alpha). */
  opacity: number
  /** Inner solid stop, in % (colour is full-alpha up to here). */
  innerStop: number
  /** Outer stop, in % (colour has faded fully to transparent by here). */
  fade: number
}

/** The vertical neutral return that settles the lower canvas back to base. */
export interface LowerFade {
  enabled: boolean
  /** Where the return begins, in % of canvas height. */
  start: number
  /** Where the canvas has fully settled back to base, in %. */
  end: number
}

/** The full atmosphere configuration. `enabled` is the master switch. */
export interface MobileGradientConfig {
  version: number
  enabled: boolean
  /** Global intensity multiplier applied to every field's alpha. */
  intensity: number
  /** Solid base colour beneath the fields. */
  baseColor: string
  accent: GradientField
  identity: GradientField
  lowerFade: LowerFade
}

// ---------------------------------------------------------------------------
// Persistence identifiers
// ---------------------------------------------------------------------------

/**
 * Third, independent localStorage key — separate from the phone scale
 * (`aa-phone-scale`) and the domain store (`aa-demo`). Untouched by Reset demo
 * data.
 */
export const STORAGE_KEY = 'aa-gradient-lab'
export const STORAGE_VERSION = 1

// ---------------------------------------------------------------------------
// Preset builders
// ---------------------------------------------------------------------------

/** Compact `GradientField` builder (innerStop is always 0 for these presets). */
function field(
  color: string,
  x: number,
  y: number,
  spreadX: number,
  spreadY: number,
  opacity: number,
  fade: number,
  enabled = true,
): GradientField {
  return { enabled, color, x, y, spreadX, spreadY, opacity, innerStop: 0, fade }
}

/** A disabled secondary field (values are placeholders the lab can turn on). */
const SECONDARY_OFF: GradientField = field(brand.tint, 96, 0, 80, 56, 0.55, 70, false)

interface PresetShape {
  primary: GradientField
  secondary?: GradientField
  lowerFade?: LowerFade
  enabled?: boolean
}

function makeConfig({ primary, secondary, lowerFade, enabled = true }: PresetShape): MobileGradientConfig {
  return {
    version: STORAGE_VERSION,
    enabled,
    intensity: 1,
    baseColor: neutral.bg,
    accent: primary,
    identity: secondary ?? { ...SECONDARY_OFF },
    lowerFade: lowerFade ?? { enabled: true, start: 44, end: 90 },
  }
}

// ---------------------------------------------------------------------------
// Brand-crimson atmosphere tints
// ---------------------------------------------------------------------------

/**
 * Soft crimson tints derived from `brand.base` (#A91E3E) lightened toward white.
 * These are NOT new design tokens (the Design Language token file is unchanged)
 * and are NEVER applied to buttons or status — they are ambient IDENTITY colour
 * only, the same category the mockups sanction crimson for (masthead, avatars).
 * They bring the logo's red into the mobile canvas as a soft wash; the lab lets
 * the user dial the strength. Ordered soft → warm (more present).
 */
const BRAND_ROSE_SOFT = '#F0D7DC' // brand.base lightened ~82%
const BRAND_ROSE = '#ECCED5' // ~78% — felt but not overpowering
const BRAND_ROSE_WARM = '#E7C0C9' // ~72% — the most present, still white-first

// ---------------------------------------------------------------------------
// The checked-in AA default (Phase 13 design pass — a soft brand-red wash)
// ---------------------------------------------------------------------------

/**
 * The atmosphere that ships (user's pick: "Brand whisper"). The mobile app
 * otherwise carries almost none of the logo's crimson (only the small avatar),
 * so the canvas gets the faintest broad brand-crimson haze from the top — the
 * red is present as AA identity but stays firmly white-first and dissolves to
 * white well before the cards. Crimson is used only as a soft ambient-identity
 * tint (never a button or status colour), consistent with the mockups' crimson-
 * is-identity rule. The lab's presets offer stronger reds, teal and neutral
 * alternatives, and a flat baseline for the user's final sign-off.
 */
export const AA_DEFAULT_GRADIENT: MobileGradientConfig = makeConfig({
  primary: field(BRAND_ROSE, 34, -20, 174, 106, 0.45, 84),
  lowerFade: { enabled: true, start: 56, end: 96 },
})

// ---------------------------------------------------------------------------
// Presets — switchable ideas for the tuning lab (Phase 13, user request)
// ---------------------------------------------------------------------------

export interface GradientPreset {
  id: string
  name: string
  note: string
  config: MobileGradientConfig
}

/**
 * Ten deliberate ideas to compare in the lab, now led by a brand-red family
 * (the user wants the logo's crimson felt on mobile): five soft-crimson washes
 * at varying strength/placement, two teal options, the original teal+blush duo,
 * a near-colourless neutral "mist", and a flat baseline. Every colour is a
 * design token or a brand-derived tint; each stays white-first.
 */
export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'brand-whisper',
    name: 'Brand whisper (default)',
    note: 'The faintest broad crimson haze. Maximum restraint. The checked-in default.',
    config: AA_DEFAULT_GRADIENT,
  },
  {
    id: 'brand-soft',
    name: 'Brand soft',
    note: 'A gentle red: the pale brand tint blushing the top.',
    config: makeConfig({
      primary: field(BRAND_ROSE_SOFT, 30, -18, 150, 86, 0.85, 74),
      lowerFade: { enabled: true, start: 48, end: 92 },
    }),
  },
  {
    id: 'brand-dawn',
    name: 'Brand dawn',
    note: 'Soft crimson wash from the top, biased left. Felt but not overpowering.',
    config: makeConfig({
      primary: field(BRAND_ROSE, 28, -16, 140, 84, 0.72, 66),
      lowerFade: { enabled: true, start: 42, end: 88 },
    }),
  },
  {
    id: 'brand-crown',
    name: 'Brand crown',
    note: 'Soft crimson arcing symmetrically from the top edge.',
    config: makeConfig({
      primary: field(BRAND_ROSE, 50, -22, 154, 76, 0.7, 62),
      lowerFade: { enabled: true, start: 40, end: 88 },
    }),
  },
  {
    id: 'brand-warm',
    name: 'Brand warm',
    note: 'The most present red: a warmer crimson wash, still white-first.',
    config: makeConfig({
      primary: field(BRAND_ROSE_WARM, 26, -16, 142, 86, 0.78, 62),
      lowerFade: { enabled: true, start: 44, end: 90 },
    }),
  },
  {
    id: 'teal-dawn',
    name: 'Teal dawn',
    note: 'Single teal wash from the top. Cool, clinical.',
    config: makeConfig({
      primary: field(accent.tint, 26, -16, 138, 84, 0.9, 70),
      lowerFade: { enabled: true, start: 42, end: 90 },
    }),
  },
  {
    id: 'teal-crown',
    name: 'Teal crown',
    note: 'Single teal arcing symmetrically from the top edge.',
    config: makeConfig({
      primary: field(accent.tint, 50, -22, 152, 76, 0.88, 64),
      lowerFade: { enabled: true, start: 40, end: 88 },
    }),
  },
  {
    id: 'duo',
    name: 'Teal + blush',
    note: 'The original two-tone: teal top-left, weak brand blush top-right.',
    config: makeConfig({
      primary: field(accent.tint, 10, -10, 108, 74, 0.82, 68),
      secondary: field(brand.tint, 97, 0, 80, 56, 0.6, 70),
      lowerFade: { enabled: true, start: 44, end: 90 },
    }),
  },
  {
    id: 'mist',
    name: 'Mist (colourless)',
    note: 'Near-colourless depth from a pale cool neutral. Barely there.',
    config: makeConfig({
      primary: field(neutral.sunken, 40, -16, 168, 96, 1, 82),
      lowerFade: { enabled: true, start: 58, end: 96 },
    }),
  },
  {
    id: 'flat',
    name: 'Flat white',
    note: 'No atmosphere. A clean white canvas for comparison.',
    config: makeConfig({ primary: field(BRAND_ROSE, 28, -16, 140, 84, 0.72, 66), enabled: false }),
  },
]

// ---------------------------------------------------------------------------
// Recommended brand envelope (advisory only — the lab warns, never clamps)
// ---------------------------------------------------------------------------

const ENVELOPE = {
  /** Max recommended global intensity. */
  maxIntensity: 1.3,
  /** Max recommended per-field layer opacity. */
  maxOpacity: 0.95,
  /** Max RGB euclidean distance from the nearest AA atmosphere tint. */
  maxColorDistance: 70,
} as const

/** The pale AA tints the atmosphere is meant to stay near. */
const AA_TINTS = [neutral.bg, accent.tint, brand.tint] as const

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const HEX_LOOSE_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** True for a strict `#RGB` / `#RRGGBB` string. */
export function isValidHex(hex: unknown): boolean {
  return typeof hex === 'string' && HEX_RE.test(hex.trim())
}

/**
 * Normalise a hex to upper-case `#RRGGBB`. Tolerant of a missing leading `#`
 * and `#RGB` shorthand; returns null for anything that is not a hex colour.
 */
export function normalizeHex(hex: unknown): string | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim()
  if (!HEX_LOOSE_RE.test(h)) return null
  if (h[0] !== '#') h = `#${h}`
  if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  return h.toUpperCase()
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))
const round4 = (n: number): number => Math.round(n * 10000) / 10000

/** `hex` → `rgba(r, g, b, a)` with `a` physically clamped to [0,1]. */
export function hexToRgba(hex: string, alpha: number): string {
  const norm = normalizeHex(hex) ?? '#000000'
  const r = parseInt(norm.slice(1, 3), 16)
  const g = parseInt(norm.slice(3, 5), 16)
  const b = parseInt(norm.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${round4(clamp01(alpha))})`
}

function rgbOf(hex: string): [number, number, number] | null {
  const norm = normalizeHex(hex)
  if (norm === null) return null
  return [parseInt(norm.slice(1, 3), 16), parseInt(norm.slice(3, 5), 16), parseInt(norm.slice(5, 7), 16)]
}

function colorDistance(a: string, b: string): number {
  const ra = rgbOf(a)
  const rb = rgbOf(b)
  if (ra === null || rb === null) return Number.POSITIVE_INFINITY
  return Math.sqrt((ra[0] - rb[0]) ** 2 + (ra[1] - rb[1]) ** 2 + (ra[2] - rb[2]) ** 2)
}

function nearestTintDistance(hex: string): number {
  return Math.min(...AA_TINTS.map((t) => colorDistance(hex, t)))
}

// ---------------------------------------------------------------------------
// CSS-var builder
// ---------------------------------------------------------------------------

export interface AtmosphereVars {
  '--aa-atmos-base': string
  '--aa-atmos-image': string
}

function radialFieldCss(field: GradientField, intensity: number): string {
  const alpha = clamp01(field.opacity * intensity)
  const inner = hexToRgba(field.color, alpha)
  // Fade to the SAME colour at zero alpha (not the `transparent` keyword) so the
  // halo never greys as it interpolates toward transparent-black.
  const outer = hexToRgba(field.color, 0)
  return `radial-gradient(${field.spreadX}% ${field.spreadY}% at ${field.x}% ${field.y}%, ${inner} ${field.innerStop}%, ${outer} ${field.fade}%)`
}

function lowerFadeCss(lf: LowerFade, base: string): string {
  return `linear-gradient(to bottom, ${hexToRgba(base, 0)} ${lf.start}%, ${hexToRgba(base, 1)} ${lf.end}%)`
}

/**
 * Build the two custom properties the atmosphere renders from. Layer order in
 * `background-image` paints first-listed on top, so: the lower fade sits over
 * the identity blush, which sits over the broad accent field. Disabled fields
 * are omitted; when the master switch is off (or nothing is enabled) the image
 * is `none` and the canvas is flat base. Field alpha = `opacity * intensity`,
 * physically clamped to [0,1].
 */
export function gradientCssVars(config: MobileGradientConfig): AtmosphereVars {
  const base = normalizeHex(config.baseColor) ?? AA_DEFAULT_GRADIENT.baseColor
  if (!config.enabled) {
    return { '--aa-atmos-base': base, '--aa-atmos-image': 'none' }
  }
  const layers: string[] = []
  if (config.lowerFade.enabled) layers.push(lowerFadeCss(config.lowerFade, base))
  if (config.identity.enabled) layers.push(radialFieldCss(config.identity, config.intensity))
  if (config.accent.enabled) layers.push(radialFieldCss(config.accent, config.intensity))
  return {
    '--aa-atmos-base': base,
    '--aa-atmos-image': layers.length > 0 ? layers.join(', ') : 'none',
  }
}

/**
 * Copy-CSS output: a self-contained rule setting the custom properties plus a
 * `background` fallback that reads them, so the block works pasted on its own.
 */
export function configToCssText(config: MobileGradientConfig): string {
  const vars = gradientCssVars(config)
  return [
    '.aa-mobile-atmosphere {',
    `  --aa-atmos-base: ${vars['--aa-atmos-base']};`,
    `  --aa-atmos-image: ${vars['--aa-atmos-image']};`,
    '  background-color: var(--aa-atmos-base);',
    '  background-image: var(--aa-atmos-image);',
    '}',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Serialisation + validation
// ---------------------------------------------------------------------------

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function orderField(f: GradientField): GradientField {
  return {
    enabled: f.enabled,
    color: f.color,
    x: f.x,
    y: f.y,
    spreadX: f.spreadX,
    spreadY: f.spreadY,
    opacity: f.opacity,
    innerStop: f.innerStop,
    fade: f.fade,
  }
}

/** Stable, readable JSON with a fixed key order (Copy configuration). */
export function serializeConfig(config: MobileGradientConfig): string {
  const ordered = {
    version: config.version,
    enabled: config.enabled,
    intensity: config.intensity,
    baseColor: config.baseColor,
    accent: orderField(config.accent),
    identity: orderField(config.identity),
    lowerFade: {
      enabled: config.lowerFade.enabled,
      start: config.lowerFade.start,
      end: config.lowerFade.end,
    },
  }
  return JSON.stringify(ordered, null, 2)
}

function mergeField(base: GradientField, partial: unknown): GradientField {
  const p = typeof partial === 'object' && partial !== null ? (partial as Record<string, unknown>) : {}
  const color = isValidHex(p.color) ? (normalizeHex(p.color) as string) : base.color
  return {
    enabled: typeof p.enabled === 'boolean' ? p.enabled : base.enabled,
    color,
    x: num(p.x, base.x),
    y: num(p.y, base.y),
    spreadX: num(p.spreadX, base.spreadX),
    spreadY: num(p.spreadY, base.spreadY),
    opacity: num(p.opacity, base.opacity),
    innerStop: num(p.innerStop, base.innerStop),
    fade: num(p.fade, base.fade),
  }
}

function mergeLowerFade(base: LowerFade, partial: unknown): LowerFade {
  const p = typeof partial === 'object' && partial !== null ? (partial as Record<string, unknown>) : {}
  return {
    enabled: typeof p.enabled === 'boolean' ? p.enabled : base.enabled,
    start: num(p.start, base.start),
    end: num(p.end, base.end),
  }
}

/** Merge an arbitrary object over the default, backfilling + coercing every key. */
function coerceConfig(obj: unknown): MobileGradientConfig {
  const o = typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>) : {}
  const d = AA_DEFAULT_GRADIENT
  return {
    version: num(o.version, d.version),
    enabled: typeof o.enabled === 'boolean' ? o.enabled : d.enabled,
    intensity: num(o.intensity, d.intensity),
    baseColor: isValidHex(o.baseColor) ? (normalizeHex(o.baseColor) as string) : d.baseColor,
    accent: mergeField(d.accent, o.accent),
    identity: mergeField(d.identity, o.identity),
    lowerFade: mergeLowerFade(d.lowerFade, o.lowerFade),
  }
}

/** Parse a JSON string, merge over the default, validate. Throws on bad JSON. */
export function parseConfig(raw: string): MobileGradientConfig {
  return coerceConfig(JSON.parse(raw))
}

// ---------------------------------------------------------------------------
// Envelope warnings (non-blocking; the lab shows them, never clamps input)
// ---------------------------------------------------------------------------

/**
 * Return human-readable warnings for values outside the recommended brand
 * envelope: a colour far from the AA tints, or an intensity / opacity stronger
 * than recommended. An empty array means everything sits inside the envelope.
 */
export function envelopeWarnings(config: MobileGradientConfig): string[] {
  const warnings: string[] = []
  if (config.intensity > ENVELOPE.maxIntensity) {
    warnings.push(`Global intensity ${config.intensity.toFixed(2)} is stronger than the recommended ${ENVELOPE.maxIntensity} ceiling.`)
  }
  const fields: [string, GradientField][] = [
    ['Primary field', config.accent],
    ['Secondary field', config.identity],
  ]
  for (const [name, f] of fields) {
    if (!f.enabled) continue
    if (f.opacity > ENVELOPE.maxOpacity) {
      warnings.push(`${name} opacity ${f.opacity.toFixed(2)} is stronger than the recommended ${ENVELOPE.maxOpacity}.`)
    }
    if (nearestTintDistance(f.color) > ENVELOPE.maxColorDistance) {
      warnings.push(`${name} colour ${normalizeHex(f.color) ?? f.color} sits well outside the pale AA tint palette.`)
    }
  }
  if (nearestTintDistance(config.baseColor) > ENVELOPE.maxColorDistance) {
    warnings.push(`Base colour ${normalizeHex(config.baseColor) ?? config.baseColor} sits well outside the AA neutral base.`)
  }
  return warnings
}

// ---------------------------------------------------------------------------
// Storage (guarded — private mode / disabled storage falls back to the default)
// ---------------------------------------------------------------------------

/** Load the persisted lab config, or the AA default on absence/parse/version/shape mismatch. */
export function loadStoredConfig(): MobileGradientConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return AA_DEFAULT_GRADIENT
    const obj = JSON.parse(raw) as Record<string, unknown>
    if (typeof obj !== 'object' || obj === null) return AA_DEFAULT_GRADIENT
    if (num(obj.version, -1) !== STORAGE_VERSION) return AA_DEFAULT_GRADIENT
    return coerceConfig(obj)
  } catch {
    return AA_DEFAULT_GRADIENT
  }
}

/** Persist the lab config (guarded). */
export function saveConfig(config: MobileGradientConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeConfig(config))
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
}

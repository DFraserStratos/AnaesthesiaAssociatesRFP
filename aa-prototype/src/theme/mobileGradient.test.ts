import { beforeEach, describe, expect, it } from 'vitest'
import {
  AA_DEFAULT_GRADIENT,
  configToCssText,
  envelopeWarnings,
  gradientCssVars,
  GRADIENT_PRESETS,
  hexToRgba,
  isValidHex,
  loadStoredConfig,
  normalizeHex,
  parseConfig,
  saveConfig,
  serializeConfig,
  STORAGE_KEY,
  STORAGE_VERSION,
  type GradientPreset,
  type MobileGradientConfig,
} from './mobileGradient'

const countRadials = (image: string): number => (image.match(/radial-gradient\(/g) ?? []).length

describe('AA_DEFAULT_GRADIENT', () => {
  it('is a complete, master-on, single-hue config', () => {
    expect(AA_DEFAULT_GRADIENT.version).toBe(STORAGE_VERSION)
    expect(AA_DEFAULT_GRADIENT.enabled).toBe(true)
    expect(AA_DEFAULT_GRADIENT.intensity).toBe(1)
    expect(AA_DEFAULT_GRADIENT.baseColor).toBe('#F6F8F7')
    // A single calm teal hue: the primary field on, the secondary field off.
    expect(AA_DEFAULT_GRADIENT.accent.enabled).toBe(true)
    expect(AA_DEFAULT_GRADIENT.identity.enabled).toBe(false)
  })

  it('sits inside the recommended brand envelope (no warnings)', () => {
    expect(envelopeWarnings(AA_DEFAULT_GRADIENT)).toEqual([])
  })
})

describe('GRADIENT_PRESETS', () => {
  it('offers ten presets with unique ids', () => {
    expect(GRADIENT_PRESETS).toHaveLength(10)
    expect(new Set(GRADIENT_PRESETS.map((p) => p.id)).size).toBe(10)
  })

  it('leads with the checked-in default', () => {
    expect(GRADIENT_PRESETS[0]?.config).toBe(AA_DEFAULT_GRADIENT)
  })

  it('every preset produces a valid, round-trippable config', () => {
    for (const p of GRADIENT_PRESETS) {
      expect(gradientCssVars(p.config)['--aa-atmos-base']).toMatch(/^#[0-9A-F]{6}$/)
      expect(parseConfig(serializeConfig(p.config))).toEqual(p.config)
    }
  })

  it('has a flat preset (master off → image none)', () => {
    const flat = GRADIENT_PRESETS.find((p) => p.id === 'flat') as GradientPreset
    expect(flat).toBeDefined()
    expect(gradientCssVars(flat.config)['--aa-atmos-image']).toBe('none')
  })
})

describe('isValidHex / normalizeHex', () => {
  it('accepts #RGB and #RRGGBB', () => {
    expect(isValidHex('#abc')).toBe(true)
    expect(isValidHex('#A91E3E')).toBe(true)
  })

  it('rejects non-hex', () => {
    expect(isValidHex('nope')).toBe(false)
    expect(isValidHex('#GGGGGG')).toBe(false)
    expect(isValidHex('#12')).toBe(false)
    expect(isValidHex(42)).toBe(false)
  })

  it('normalises to upper-case #RRGGBB and expands shorthand', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('e1f0ed')).toBe('#E1F0ED')
    expect(normalizeHex('  #f7e7ec ')).toBe('#F7E7EC')
    expect(normalizeHex('zzz')).toBeNull()
    expect(normalizeHex(undefined)).toBeNull()
  })

  it('hexToRgba emits the parsed channels and a clamped alpha', () => {
    expect(hexToRgba('#E1F0ED', 0.82)).toBe('rgba(225, 240, 237, 0.82)')
    expect(hexToRgba('#000', 0.5)).toBe('rgba(0, 0, 0, 0.5)')
    // Physical clamp, not a silent input clamp.
    expect(hexToRgba('#FFFFFF', 3)).toBe('rgba(255, 255, 255, 1)')
    expect(hexToRgba('#FFFFFF', -1)).toBe('rgba(255, 255, 255, 0)')
  })
})

describe('gradientCssVars', () => {
  // A two-field config (default is single-hue) for the multi-radial cases.
  const twoField: MobileGradientConfig = {
    ...AA_DEFAULT_GRADIENT,
    identity: { ...AA_DEFAULT_GRADIENT.identity, enabled: true },
  }

  it('contains the base plus a radial per enabled field, deterministically', () => {
    const a = gradientCssVars(AA_DEFAULT_GRADIENT)
    const b = gradientCssVars(AA_DEFAULT_GRADIENT)
    expect(a).toEqual(b)
    expect(a['--aa-atmos-base']).toBe('#F6F8F7')
    // The default is single-hue → exactly one radial (+ the lower-fade linear).
    expect(countRadials(a['--aa-atmos-image'])).toBe(1)
    expect(a['--aa-atmos-image']).toContain('linear-gradient(')
    // A two-field config → two radials.
    expect(countRadials(gradientCssVars(twoField)['--aa-atmos-image'])).toBe(2)
  })

  it('folds alpha = opacity × intensity into the inner colour stop', () => {
    // Explicit config so this stays independent of the shipped default's colour.
    const cfg: MobileGradientConfig = {
      ...AA_DEFAULT_GRADIENT,
      intensity: 1,
      accent: { ...AA_DEFAULT_GRADIENT.accent, color: '#E1F0ED', opacity: 0.8 },
    }
    // #E1F0ED = rgb(225,240,237); opacity 0.8 × intensity 1.
    expect(gradientCssVars(cfg)['--aa-atmos-image']).toContain('rgba(225, 240, 237, 0.8)')
    expect(gradientCssVars({ ...cfg, intensity: 0.5 })['--aa-atmos-image']).toContain('rgba(225, 240, 237, 0.4)')
  })

  it('physically clamps alpha to 1', () => {
    const cfg: MobileGradientConfig = {
      ...AA_DEFAULT_GRADIENT,
      intensity: 2,
      accent: { ...AA_DEFAULT_GRADIENT.accent, color: '#E1F0ED', opacity: 1 },
    }
    expect(gradientCssVars(cfg)['--aa-atmos-image']).toContain('rgba(225, 240, 237, 1)')
  })

  it('omits a disabled field', () => {
    expect(countRadials(gradientCssVars(twoField)['--aa-atmos-image'])).toBe(2)
    const one = { ...twoField, identity: { ...twoField.identity, enabled: false } }
    expect(countRadials(gradientCssVars(one)['--aa-atmos-image'])).toBe(1)
  })

  it('renders a flat base (image none) when the master switch is off', () => {
    const vars = gradientCssVars({ ...AA_DEFAULT_GRADIENT, enabled: false })
    expect(vars['--aa-atmos-base']).toBe('#F6F8F7')
    expect(vars['--aa-atmos-image']).toBe('none')
  })
})

describe('configToCssText', () => {
  it('emits a self-contained rule with the vars and a background fallback', () => {
    const css = configToCssText(AA_DEFAULT_GRADIENT)
    expect(css).toContain('--aa-atmos-base: #F6F8F7;')
    expect(css).toContain('--aa-atmos-image:')
    expect(css).toContain('background-color: var(--aa-atmos-base);')
    expect(css).toContain('background-image: var(--aa-atmos-image);')
  })
})

describe('serializeConfig / parseConfig', () => {
  it('serialises with a stable, fixed key order', () => {
    const json = serializeConfig(AA_DEFAULT_GRADIENT)
    expect(json).toBe(serializeConfig(AA_DEFAULT_GRADIENT))
    const keys = Object.keys(JSON.parse(json))
    expect(keys).toEqual(['version', 'enabled', 'intensity', 'baseColor', 'accent', 'identity', 'lowerFade'])
  })

  it('round-trips through parseConfig', () => {
    expect(parseConfig(serializeConfig(AA_DEFAULT_GRADIENT))).toEqual(AA_DEFAULT_GRADIENT)
  })

  it('backfills every missing key from the default', () => {
    const parsed = parseConfig('{"intensity": 0.5, "accent": {"opacity": 0.3}}')
    expect(parsed.intensity).toBe(0.5)
    expect(parsed.accent.opacity).toBe(0.3)
    // Untouched sub-keys fall back to the default.
    expect(parsed.accent.color).toBe(AA_DEFAULT_GRADIENT.accent.color)
    expect(parsed.identity).toEqual(AA_DEFAULT_GRADIENT.identity)
    expect(parsed.lowerFade).toEqual(AA_DEFAULT_GRADIENT.lowerFade)
  })

  it('ignores an invalid hex, keeping the default colour', () => {
    expect(parseConfig('{"baseColor": "purple"}').baseColor).toBe(AA_DEFAULT_GRADIENT.baseColor)
  })
})

describe('loadStoredConfig / saveConfig', () => {
  beforeEach(() => localStorage.clear())

  it('returns the default when nothing is stored', () => {
    expect(loadStoredConfig()).toEqual(AA_DEFAULT_GRADIENT)
  })

  it('round-trips a saved config', () => {
    const custom = { ...AA_DEFAULT_GRADIENT, intensity: 0.7 }
    saveConfig(custom)
    expect(loadStoredConfig()).toEqual(custom)
  })

  it('falls back to the default on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'definitely not json')
    expect(loadStoredConfig()).toEqual(AA_DEFAULT_GRADIENT)
  })

  it('falls back to the default on a version mismatch', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...AA_DEFAULT_GRADIENT, version: 999 }))
    expect(loadStoredConfig()).toEqual(AA_DEFAULT_GRADIENT)
  })
})

describe('envelopeWarnings', () => {
  it('flags an intensity beyond the recommended ceiling', () => {
    const warnings = envelopeWarnings({ ...AA_DEFAULT_GRADIENT, intensity: 3 })
    expect(warnings.some((w) => /intensity/i.test(w))).toBe(true)
  })

  it('flags an opacity beyond the recommended maximum', () => {
    const warnings = envelopeWarnings({
      ...AA_DEFAULT_GRADIENT,
      accent: { ...AA_DEFAULT_GRADIENT.accent, opacity: 1 },
    })
    expect(warnings.some((w) => /opacity/i.test(w))).toBe(true)
  })

  it('flags a colour far outside the pale AA tints', () => {
    const warnings = envelopeWarnings({
      ...AA_DEFAULT_GRADIENT,
      accent: { ...AA_DEFAULT_GRADIENT.accent, color: '#A91E3E' },
    })
    expect(warnings.some((w) => /colour/i.test(w))).toBe(true)
  })

  it('does not flag a disabled out-of-envelope field', () => {
    const warnings = envelopeWarnings({
      ...AA_DEFAULT_GRADIENT,
      accent: { ...AA_DEFAULT_GRADIENT.accent, enabled: false, opacity: 1, color: '#A91E3E' },
    })
    expect(warnings).toEqual([])
  })
})

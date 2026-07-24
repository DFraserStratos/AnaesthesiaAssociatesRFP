/**
 * Mechanical isolation guard for the Phase 13 Gradient Lab (mirrors
 * `domainPurity.test.ts`). The lab + the atmosphere module control ONLY the
 * decorative `--aa-atmos-*` background variables. They must never reach into the
 * store or domain, and must never touch the status/semantic colour tokens — the
 * atmosphere is decoration, never status (scope fence L4). This is also what
 * lets the whole lab be deleted (flip `GRADIENT_LAB_ENABLED`) without touching
 * product state.
 */

import { describe, expect, it } from 'vitest'

// The lab folder + the atmosphere module + the gate, as raw text.
const SOURCES = import.meta.glob(['./**/*.{ts,tsx}', '../../theme/mobileGradient.ts', '../../theme/gradientLabGate.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const IMPORT_LEAD = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)/

/** Any relative import reaching the store or domain layer, at any depth. */
const FORBIDDEN_RELATIVE = new RegExp(IMPORT_LEAD.source + `['"](?:\\.\\.\\/)+(store|domain)(?:\\/|['"])`)

// Prose in these files legitimately NAMES statusColours / semantic (to say it
// never uses them); strip comments so only real code is inspected.
const stripComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('gradient lab isolation', () => {
  const files = Object.keys(SOURCES)

  it('globs the lab + atmosphere sources', () => {
    expect(files.length).toBeGreaterThanOrEqual(5)
    expect(files.some((f) => f.includes('mobileGradient'))).toBe(true)
    expect(files.some((f) => f.includes('GradientLab'))).toBe(true)
  })

  it('reaches into no store or domain layer', () => {
    for (const file of files) {
      const code = stripComments(SOURCES[file] ?? '')
      expect(FORBIDDEN_RELATIVE.test(code), `${file} must not import the store/domain layers`).toBe(false)
    }
  })

  it('references no status / semantic colour tokens', () => {
    for (const file of files) {
      const code = stripComments(SOURCES[file] ?? '')
      expect(/statusColours/.test(code), `${file} must not use statusColours`).toBe(false)
      expect(/semantic\./.test(code), `${file} must not use the semantic status triples`).toBe(false)
    }
  })
})

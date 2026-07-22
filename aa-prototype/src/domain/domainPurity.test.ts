/**
 * Mechanical enforcement of the domain purity convention (phase doc / PROGRESS
 * convention 3): nothing under `src/domain/` imports React, react-dom, or any
 * DOM/UI library. Domain code is pure data + pure functions.
 */

import { describe, expect, it } from 'vitest'

// Every source under src/domain/, as raw text, resolved by Vite at transform
// time (keeps this test itself free of node imports).
const SOURCES = import.meta.glob('./**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const IMPORT_LEAD = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)/

/** UI-world package specifiers forbidden anywhere in src/domain/. */
const FORBIDDEN_PACKAGE = new RegExp(
  IMPORT_LEAD.source + `['"](react|react-dom|react-router-dom|lucide-react|zustand|@testing-library)(?:\\/|['"])`,
)

/**
 * Relative imports that reach OUT of the domain into the store/theme/app
 * layers, at any nesting depth (`../store`, `../../theme`, …). The literal
 * package regex above cannot see these.
 */
const FORBIDDEN_RELATIVE = new RegExp(
  IMPORT_LEAD.source + `['"](?:\\.\\.\\/)+(store|theme|apps|shell|shared)\\/`,
)

/** Bare side-effect imports (`import '...'`) — no pure-domain module needs one. */
const BARE_SIDE_EFFECT = /(?:^|\n)\s*import\s+['"][^'"]+['"]/

/**
 * The ONE sanctioned relative bridge: statusKeyParity.test.ts imports
 * `../theme/statusColours` on purpose, to assert the domain/theme status-key
 * parity at runtime (see its header). Everything else is forbidden.
 */
const RELATIVE_BRIDGE_FILES = new Set(['./statusKeyParity.test.ts'])

describe('domain purity', () => {
  const files = Object.keys(SOURCES)

  it('finds the domain sources', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('contains no .tsx files (no components in the domain)', () => {
    expect(files.filter((f) => f.endsWith('.tsx'))).toEqual([])
  })

  it('imports no React/DOM/UI libraries anywhere', () => {
    for (const file of files) {
      const source = SOURCES[file] ?? ''
      expect(FORBIDDEN_PACKAGE.test(source), `${file} must not import UI libraries`).toBe(false)
    }
  })

  it('reaches into no store/theme/app layer by relative path (the parity bridge excepted)', () => {
    for (const file of files) {
      if (RELATIVE_BRIDGE_FILES.has(file)) continue
      const source = SOURCES[file] ?? ''
      expect(FORBIDDEN_RELATIVE.test(source), `${file} must not import the store/theme/app layers`).toBe(false)
    }
  })

  it('uses no bare side-effect imports', () => {
    for (const file of files) {
      const source = SOURCES[file] ?? ''
      expect(BARE_SIDE_EFFECT.test(source), `${file} must not use a bare side-effect import`).toBe(false)
    }
  })

  it('calls neither Date.now() nor Math.random() in non-test domain sources (convention 5)', () => {
    // Strip comments first: the clock's header legitimately *names* Date.now()
    // in prose ("never call Date.now()"), which is the opposite of calling it.
    const stripComments = (src: string): string =>
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
    for (const file of files) {
      if (file.endsWith('.test.ts')) continue
      const code = stripComments(SOURCES[file] ?? '')
      expect(/Date\.now\s*\(/.test(code), `${file} must not call Date.now()`).toBe(false)
      expect(/Math\.random\s*\(/.test(code), `${file} must not call Math.random()`).toBe(false)
    }
  })
})

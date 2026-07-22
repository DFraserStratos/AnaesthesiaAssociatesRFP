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

/** UI-world module specifiers forbidden anywhere in src/domain/. */
const FORBIDDEN_IMPORT =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"](react|react-dom|react-router-dom|lucide-react|zustand|@testing-library)(?:\/|['"])/

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
      expect(FORBIDDEN_IMPORT.test(source), `${file} must not import UI libraries`).toBe(false)
    }
  })
})

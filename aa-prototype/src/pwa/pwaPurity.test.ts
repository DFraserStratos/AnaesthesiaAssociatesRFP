/**
 * Mechanical enforcement of the PWA target's bundle boundary, in the idiom of
 * `src/apps/moneyViewPurity.test.ts`.
 *
 * The whole case for a second build target rather than a fork rests on it
 * shipping meaningfully less: measured 2026-07-30, the all-apps prototype
 * bundle is 888 KiB raw / 235 KiB gzip and the mobile-only closure tree-shakes
 * to 549 KiB / 158 KiB. That win comes from ONE omission — the PWA entry does
 * not render `AppShell` — and it is invisible. Nothing about adding
 * `import { something } from '../../shared'` to a mobile screen warns you that
 * the barrel just dragged the admin app back in.
 *
 * So this walks the real import graph from `pwa/main.tsx` and asserts the
 * closure never reaches the two web apps, the demo surfaces or the shell's
 * harness. A resolver good enough for this codebase, not a general one: every
 * import in `src/` is either relative or a bare package specifier, and the
 * package specifiers are all external.
 */

import { describe, expect, it } from 'vitest'

const SRC = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>
const ENTRY_DIR = import.meta.glob('../../pwa/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

/** Where this test file sits, so glob keys can be re-anchored to the repo root. */
const HERE = 'aa-prototype/src/pwa'

const ENTRY = 'aa-prototype/pwa/main.tsx'

/**
 * Surfaces the PWA must never pull in. `AppShell` is the load-bearing one: it
 * imports the app switcher, which imports all three apps.
 */
const FORBIDDEN: readonly { label: string; test: (path: string) => boolean }[] = [
  { label: 'the anaesthetist web app', test: (p) => p.includes('/apps/web/') },
  { label: 'the admin web app', test: (p) => p.includes('/apps/admin/') },
  { label: 'the demo surfaces', test: (p) => p.includes('/apps/demo/') },
  { label: 'the prototype harness shell', test: (p) => p.endsWith('/shell/AppShell.tsx') },
  { label: 'the prototype router', test: (p) => p.endsWith('/src/router.tsx') || p.endsWith('/router.tsx') },
  { label: 'the simulated phone frame', test: (p) => p.endsWith('/PhoneFrame.tsx') },
  { label: 'the Gradient Lab panel', test: (p) => p.endsWith('/GradientLab.tsx') },
]

/** Collapse `a/b/../c` to `a/c` so two spellings of one file compare equal. */
function normalise(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '.' || part === '') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

/**
 * Vite hands back glob keys relative to THIS file (`../apps/…`,
 * `../../pwa/…`). Re-anchoring them against `HERE` before normalising is what
 * keeps the two globs in one address space; collapsing a leading `..` away
 * would map `src/apps/x` and `pwa/../apps/x` onto the same string.
 */
const MODULES = new Map<string, string>()
for (const [key, source] of Object.entries({ ...SRC, ...ENTRY_DIR })) {
  MODULES.set(normalise(`${HERE}/${key}`), source)
}

/** Resolve a relative specifier the way the bundler would: exact, then extensions, then index. */
function resolve(fromPath: string, specifier: string): string | null {
  const dir = fromPath.split('/').slice(0, -1).join('/')
  const base = normalise(`${dir}/${specifier}`)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    // `allowImportingTsExtensions` is on, so a specifier may already carry one.
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
  ]
  for (const candidate of candidates) {
    if (MODULES.has(candidate)) return candidate
  }
  return null
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/** Static `import`/`export … from` specifiers, plus dynamic `import(...)`. */
function specifiersOf(src: string): string[] {
  const code = stripComments(src)
  const found: string[] = []
  for (const m of code.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)) found.push(m[1] as string)
  for (const m of code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) found.push(m[1] as string)
  for (const m of code.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)) found.push(m[1] as string)
  return found
}

/** Breadth-first walk of the real module graph from the PWA entry. */
function closureFrom(entry: string): { modules: Set<string>; unresolved: string[] } {
  const seen = new Set<string>([entry])
  const queue = [entry]
  const unresolved: string[] = []
  while (queue.length > 0) {
    const current = queue.shift() as string
    const src = MODULES.get(current)
    if (src === undefined) continue
    for (const spec of specifiersOf(src)) {
      // Bare specifiers are external packages (react, zustand, date-fns,
      // lucide-react) or Vite virtual modules; none of them can reach an app.
      if (!spec.startsWith('.')) continue
      const target = resolve(current, spec)
      if (target === null) {
        // A non-JS asset import (`.css`, `.png`) is expected and uninteresting.
        if (!/\.(css|png|svg|jpg|json)$/.test(spec)) unresolved.push(`${current} -> ${spec}`)
        continue
      }
      if (seen.has(target)) continue
      seen.add(target)
      queue.push(target)
    }
  }
  return { modules: seen, unresolved }
}

describe('PWA bundle purity (the mobile app only)', () => {
  const { modules, unresolved } = closureFrom(ENTRY)

  it('finds the PWA entry and walks a real closure', () => {
    expect(MODULES.get(ENTRY), 'pwa/main.tsx must exist and be readable').toBeTypeOf('string')
    // Big enough that a broken resolver cannot pass this vacuously: the mobile
    // closure is around 150 modules.
    expect(modules.size).toBeGreaterThan(100)
  })

  it('resolves every relative import it walks', () => {
    expect(unresolved, `unresolved imports would silently hide part of the closure:\n${unresolved.join('\n')}`).toEqual(
      [],
    )
  })

  it('reaches the mobile app itself', () => {
    expect([...modules].some((p) => p.endsWith('src/apps/mobile/MobileApp.tsx'))).toBe(true)
    expect([...modules].some((p) => p.endsWith('src/pwa/MobileViewport.tsx'))).toBe(true)
  })

  for (const forbidden of FORBIDDEN) {
    it(`never reaches ${forbidden.label}`, () => {
      const hits = [...modules].filter(forbidden.test)
      expect(hits, `${forbidden.label} is in the PWA closure:\n${hits.join('\n')}`).toEqual([])
    })
  }
})

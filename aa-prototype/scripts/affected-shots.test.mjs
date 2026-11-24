// node --test scripts/affected-shots.test.mjs   (not a Vitest file: Vitest only collects src/**)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_CONFIG,
  analyse,
  buildGraph,
  cssClassesChanged,
  fsProvider,
  hooksIn,
  lex,
  matchRoute,
  parseDiff,
  parseModule,
  parseRoutes,
} from './affected-shots.mjs'

// ---------------------------------------------------------------------------
// A small fixture project, shaped like the prototype
// ---------------------------------------------------------------------------

const FILES = {
  'proto/src/main.tsx': `import './theme/global.css'
import App from './App.tsx'
import { wireTimers, useAppStore } from './store'

wireTimers(useAppStore)
createRoot(document.getElementById('root')!).render(<App />)
`,
  'proto/src/App.tsx': `import { AppRouter } from './router'

export default function App() {
  return <AppRouter />
}
`,
  'proto/src/router.tsx': `import { AppShell } from './shell/AppShell'
import { AdminApp } from './apps/admin/AdminApp'
import { MobileApp } from './apps/mobile/MobileApp'
import { DayRoute, LedgerRoute, BookingRoute } from './apps/admin/routes'
import { MobileListsRoute } from './apps/mobile/routes'

const routeTree = (
  <Route element={<AppShell />}>
    {/* admin */}
    <Route path="admin" element={<AdminApp />}>
      <Route path="day/:dateISO">
        <Route index element={<DayRoute />} />
        <Route path="bookings/:bookingId" element={<BookingRoute />} />
      </Route>
      <Route path="day/today" element={<LedgerRoute />} />
      <Route path="ledger" element={<LedgerRoute />} />
    </Route>
    <Route path="mobile" element={<MobileApp />}>
      <Route path="lists/*" element={<MobileListsRoute />} />
    </Route>
  </Route>
)

export function AppRouter() {
  return routeTree
}
`,
  'proto/src/shell/AppShell.tsx': `export function AppShell() {
  return <div><Outlet /></div>
}
`,
  'proto/src/apps/admin/AdminApp.tsx': `import { navCount } from '../../store/selectors'

export function AdminApp() {
  return <nav>{navCount}</nav>
}
`,
  'proto/src/apps/mobile/MobileApp.tsx': `export function MobileApp() {
  return <main />
}
`,
  'proto/src/apps/admin/routes.tsx': `import { DayGrid } from './DayGrid'
import { LedgerScreen } from './LedgerScreen'
import type { Thing } from '../../store/types'

export function DayRoute() {
  return <DayGrid />
}

export function BookingRoute() {
  return <p>Dr Souter's booking</p>
}

export function LedgerRoute(): Thing {
  return <LedgerScreen />
}
`,
  'proto/src/apps/admin/DayGrid.tsx': `import { Button } from '../../shared/ui'

export function DayGrid() {
  return <div data-shot="daygrid"><Button shot="daygrid-add">Add</Button></div>
}
`,
  'proto/src/apps/admin/LedgerScreen.tsx': `import { Pill } from '../../shared/ui'
import { ledgerTotal } from '../../store/selectors'

const SPLIT = 10 / 2

export function LedgerScreen() {
  const ratio = ledgerTotal! / 100
  return <section className="aa-ledger" data-shot={\`ledger-\${ratio}\`}><Pill /></section>
}

export function unusedHelper() {
  return SPLIT
}
`,
  'proto/src/apps/mobile/routes.tsx': `import { ListsHome } from './ListsHome'
import { BookingDetail } from './BookingDetail'

export function MobileListsRoute() {
  const layers = [<ListsHome key="a" />, <BookingDetail key="b" />]
  return <>{layers}</>
}
`,
  'proto/src/apps/mobile/ListsHome.tsx': `export function ListsHome() {
  return <ul data-testid="lists-home" />
}
`,
  'proto/src/apps/mobile/BookingDetail.tsx': `export function BookingDetail() {
  return <article data-shot="booking-detail" />
}
`,
  'proto/src/shared/ui/index.ts': `export { Button } from './Button'
export * from './Pill'
`,
  'proto/src/shared/ui/Button.tsx': `export function Button({ shot }: { shot?: string }) {
  return <button data-shot={shot} />
}
`,
  'proto/src/shared/ui/Pill.tsx': `export function Pill() {
  return <span />
}
`,
  'proto/src/store/index.ts': `export { useAppStore } from './appStore'
export { wireTimers } from './timers'
`,
  'proto/src/store/appStore.ts': `import { buildSeed } from '../domain/seed'

export const useAppStore = create(() => buildSeed())
`,
  'proto/src/store/timers.ts': `export function wireTimers(store) {
  return store
}
`,
  'proto/src/store/types.ts': `export interface Thing {
  id: string
}
`,
  'proto/src/store/selectors.ts': `export const ledgerTotal = (s) => s.billing.total

export const navCount = 3
`,
  'proto/src/domain/seed/index.ts': `export function buildSeed() {
  return { billing: { total: 1 } }
}
`,
  'proto/src/shared/demoTriggers/registry.ts': `import { ledgerTotal } from '../../store/selectors'

const LEDGER = ['/admin/ledger'] as const

export const DEMO_TRIGGERS = [
  {
    id: 'do-thing',
    label: 'Do the thing',
    screen: 'Admin · Day',
    routes: ['/admin/day/:dateISO'],
    run: () => 1,
  },
  {
    id: 'count-ledger',
    label: 'Count the ledger',
    screen: 'Admin · Ledger',
    routes: LEDGER,
    run: (s) => ledgerTotal(s),
  },
]
`,
  'proto/src/theme/global.css': `body {
  margin: 0;
}

.aa-ledger {
  color: red;
}
`,
  'recipes/R-DAY.json': JSON.stringify({ id: 'R-DAY', status: 'captured', shots: [{ name: 'day', app: 'admin', start: '/admin/day/2026-07-21', states: [{ steps: [], highlight: ['[data-shot=daygrid]'] }] }] }),
  'recipes/R-LEDGER.json': JSON.stringify({ id: 'R-LEDGER', status: 'captured', shots: [{ name: 'ledger', app: 'admin', start: '/admin/ledger', states: [{ steps: [] }] }] }),
  'recipes/R-BOOKING.json': JSON.stringify({ id: 'R-BOOKING', status: 'captured', shots: [{ name: 'booking', app: 'admin', start: '/admin/day/2026-07-21/bookings/BK1', states: [{ steps: [] }] }] }),
  'recipes/R-MOB-HOME.json': JSON.stringify({ id: 'R-MOB-HOME', status: 'captured', shots: [{ name: 'home', app: 'mobile', start: '/mobile/lists', states: [{ steps: [] }] }] }),
  'recipes/R-MOB-BOOKING.json': JSON.stringify({ id: 'R-MOB-BOOKING', status: 'captured', shots: [{ name: 'booking', app: 'mobile', start: '/mobile/lists/L1/bookings/B1', states: [{ steps: [] }] }] }),
  'recipes/R-TRIG.json': JSON.stringify({ id: 'R-TRIG', status: 'partial', shots: [{ name: 'trig', app: 'web', start: '/mobile/lists', states: [{ state: 'after', steps: [{ trigger: 'count-ledger' }] }] }] }),
  'recipes/R-GOTO.json': JSON.stringify({ id: 'R-GOTO', status: 'captured', shots: [{ name: 'goto', app: 'admin', start: '/mobile/lists', states: [{ steps: [{ goto: '/admin/ledger' }] }] }] }),
  'recipes/R-ABSENT.json': JSON.stringify({ id: 'R-ABSENT', status: 'absent', shots: [] }),
  'docs/script.md': `# Script

## Direct URLs

| Admin | URL |
|---|---|
| Ledger (the whole ledger) | \`/admin/ledger\` |

## S1 · Money

### Beat 1: the day

Open \`/admin/day/2026-07-21\` and look.

### Beat 2: the books

Admin Ledger reads In balance. Then Demo actions, Count the ledger.

### Beat 3: nothing here

The ledger is mentioned only in passing.
`,
}

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'affected-shots-'))
  for (const [f, text] of Object.entries(FILES)) {
    mkdirSync(path.dirname(path.join(root, f)), { recursive: true })
    writeFileSync(path.join(root, f), text)
  }
  const config = {
    ...DEFAULT_CONFIG,
    proto: 'proto',
    srcRoots: ['proto/src'],
    tsconfig: 'proto/tsconfig.json',
    routers: [
      { file: 'proto/src/router.tsx', target: 'framed' },
      { file: 'proto/src/router.tsx', target: 'pwa' },
    ],
    entries: [{ file: 'proto/src/main.tsx', target: 'framed' }],
    sinks: ['proto/src/App.tsx', 'proto/src/router.tsx#AppRouter', 'proto/src/shared/demoTriggers/registry.ts#DEMO_TRIGGERS'],
    hubs: ['proto/src/store/appStore.ts'],
    dataPrefixes: ['proto/src/store/', 'proto/src/domain/'],
    registry: 'proto/src/shared/demoTriggers/registry.ts',
    scenarios: 'proto/src/apps/demo/DemoControlPanel.tsx',
    recipes: 'recipes',
    guide: ['docs/script.md'],
    urlTable: 'docs/script.md',
    refinements: {
      'proto/src/apps/mobile/routes.tsx#MobileListsRoute': {
        ListsHome: ['/mobile/lists'],
        BookingDetail: ['/mobile/lists/:listId/bookings/:bookingId'],
      },
    },
    broadShare: 0.75,
  }
  return { root, config, provider: fsProvider(root), cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

/** Analyse whole-file changes (or `ranges`) to fixture files. */
function run(fx, files) {
  const changes = files.map((f) => (typeof f === 'string' ? { path: f, status: 'M', ranges: null, text: [] } : { status: 'M', text: [], ...f }))
  return analyse({ provider: fx.provider, changes, config: fx.config })
}
const ids = (rep) => rep.recipes.map((r) => r.id).sort()

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

test('lex blanks comments and strings, keeps template expressions, tracks top-level lines', () => {
  const src = "const a = 'x // y' // note\nconst b = `t ${c} u`\nfunction f() {\n  return d! / 2\n}\nconst e = /re'g/.test(z)\n"
  const { code, bare, lineTop } = lex(src)
  assert.ok(!code.includes('note'))
  assert.ok(code.includes("'x // y'"))
  assert.ok(!bare.includes('x // y'))
  assert.ok(bare.includes('${c}'))
  assert.deepEqual(lineTop.slice(0, 6), [true, true, true, false, false, true])
})

test('parseModule cuts top-level chunks and reads imports, re-exports and types', () => {
  const mod = parseModule('a.tsx', FILES['proto/src/apps/admin/LedgerScreen.tsx'])
  assert.deepEqual(
    mod.chunks.filter((c) => c.kind === 'decl').map((c) => c.name),
    ['SPLIT', 'LedgerScreen', 'unusedHelper'],
  )
  const routes = parseModule('r.tsx', FILES['proto/src/apps/admin/routes.tsx'])
  assert.ok(!routes.imports.has('Thing'), 'type-only imports carry no edge')
  // an apostrophe in JSX text does not open a string
  assert.deepEqual(routes.chunks.filter((c) => c.kind === 'decl').map((c) => c.name), ['DayRoute', 'BookingRoute', 'LedgerRoute'])
  const barrel = parseModule('i.ts', FILES['proto/src/shared/ui/index.ts'])
  assert.deepEqual(barrel.exportsMap.get('Button'), { spec: './Button', name: 'Button' })
  assert.deepEqual(barrel.stars, ['./Pill'])
})

test('parseRoutes nests routes, and matchRoute ranks static over param over splat', () => {
  const tree = parseRoutes(FILES['proto/src/router.tsx'])
  const leaf = (url) => matchRoute(tree, url)?.at(-1)
  assert.equal(leaf('/admin/day/2026-07-21').fullPath, '/admin/day/:dateISO')
  assert.equal(leaf('/admin/day/2026-07-21').index, true)
  assert.equal(leaf('/admin/day/today').elementIdents[0], 'LedgerRoute')
  assert.equal(leaf('/admin/day/x/bookings/B1').fullPath, '/admin/day/:dateISO/bookings/:bookingId')
  assert.equal(leaf('/mobile/lists/L1/bookings/B1').fullPath, '/mobile/lists/*')
  assert.deepEqual(matchRoute(tree, '/admin/ledger').map((n) => n.elementIdents[0]), [undefined, 'AppShell', 'AdminApp', 'LedgerRoute'])
  assert.equal(matchRoute(tree, '/nowhere'), null)
})

test('parseDiff reads -U0 hunks as new-file line ranges', () => {
  const out = [
    'diff --git a/proto/src/x.tsx b/proto/src/x.tsx',
    '--- a/proto/src/x.tsx',
    '+++ b/proto/src/x.tsx',
    '@@ -3,0 +4,2 @@ ctx',
    '+one',
    '+two',
    '@@ -10 +11,0 @@',
    '-gone',
    'diff --git a/proto/src/y.ts b/proto/src/y.ts',
    'new file mode 100644',
    '--- /dev/null',
    '+++ b/proto/src/y.ts',
    '@@ -0,0 +1 @@',
    '+x',
  ].join('\n')
  const [x, y] = parseDiff(out)
  assert.deepEqual(x.ranges, [[4, 5], [11, 12]])
  assert.deepEqual(x.added, [{ line: 4, text: 'one' }, { line: 5, text: 'two' }])
  assert.deepEqual(x.removed, ['gone'])
  assert.equal(y.status, 'A')
})

test('hooksIn reads data-shot, shot props and template prefixes', () => {
  const hooks = hooksIn(FILES['proto/src/apps/admin/DayGrid.tsx'] + FILES['proto/src/apps/admin/LedgerScreen.tsx'] + "<a data-shot={on ? 'x-on' : undefined} />")
  assert.deepEqual([...hooks].sort(), ['daygrid', 'daygrid-add', 'ledger-*', 'x-on'])
})

test('cssClassesChanged finds the rule a changed line sits in', () => {
  const css = FILES['proto/src/theme/global.css']
  assert.deepEqual(cssClassesChanged(css, { ranges: [[6, 6]], removed: [] }), { classes: ['aa-ledger'], global: null })
  assert.equal(cssClassesChanged(css, { ranges: [[2, 2]], removed: [] }).global, 'body')
})

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

test('a component reaches only the routes that render it, through the barrel', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  const rep = run(fx, ['proto/src/shared/ui/Button.tsx'])
  assert.deepEqual(ids(rep), ['R-DAY'])
  assert.equal(rep.recipes[0].reasons[0].kind, 'route')
  assert.equal(rep.broad, false)
  // Pill comes through `export *`
  assert.deepEqual(ids(run(fx, ['proto/src/shared/ui/Pill.tsx'])), ['R-GOTO', 'R-LEDGER'])
})

test('changed line ranges pick the changed declaration only', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  // line 13 is inside unusedHelper, which nothing renders
  const rep = run(fx, [{ path: 'proto/src/apps/admin/LedgerScreen.tsx', ranges: [[13, 13]] }])
  assert.deepEqual(rep.recipes, [])
  const rep2 = run(fx, [{ path: 'proto/src/apps/admin/LedgerScreen.tsx', ranges: [[8, 8]] }])
  assert.deepEqual(ids(rep2), ['R-GOTO', 'R-LEDGER'])
})

test('a goto step and a route-module change count; sibling routes in the same module do not', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  // BookingRoute is lines 9 to 11 of routes.tsx
  const rep = run(fx, [{ path: 'proto/src/apps/admin/routes.tsx', ranges: [[10, 10]] }])
  assert.deepEqual(ids(rep), ['R-BOOKING'])
})

test('the slide-stack refinement splits a splat route by URL depth', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  assert.deepEqual(ids(run(fx, ['proto/src/apps/mobile/BookingDetail.tsx'])), ['R-MOB-BOOKING'])
  assert.deepEqual(ids(run(fx, ['proto/src/apps/mobile/ListsHome.tsx'])), ['R-GOTO', 'R-MOB-HOME', 'R-TRIG'])
})

test('a layout change reaches every route under it', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  assert.deepEqual(ids(run(fx, ['proto/src/apps/admin/AdminApp.tsx'])), ['R-BOOKING', 'R-DAY', 'R-GOTO', 'R-LEDGER'])
})

test('class-scoped CSS reaches the components using the class; a global rule reaches everything', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  assert.deepEqual(ids(run(fx, [{ path: 'proto/src/theme/global.css', ranges: [[6, 6]] }])), ['R-GOTO', 'R-LEDGER'])
  const broad = run(fx, [{ path: 'proto/src/theme/global.css', ranges: [[2, 2]] }])
  assert.equal(broad.broad, true)
  assert.match(broad.broadReason, /whole framed prototype/)
})

test('seed and store changes are a data change; the walk stops at the store hub', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  const seed = run(fx, ['proto/src/domain/seed/index.ts'])
  assert.deepEqual(seed.recipes, [])
  assert.ok(seed.data)
  assert.match(seed.data.advice, /full capture/)
  assert.ok(seed.data.reachesStore)
  // a selector reaches the screens that call it, and the trigger that calls it
  const sel = run(fx, [{ path: 'proto/src/store/selectors.ts', ranges: [[1, 1]] }])
  assert.deepEqual(ids(sel), ['R-GOTO', 'R-LEDGER', 'R-TRIG'])
  assert.deepEqual(sel.data.slices, ['billing'])
  assert.equal(sel.recipes.find((r) => r.id === 'R-TRIG').reasons[0].kind, 'trigger')
  assert.equal(sel.recipes.find((r) => r.id === 'R-TRIG').images[0], 'web-trig-after')
  // a timer wired from the entry is data, not an app-wide visual change
  const timers = run(fx, ['proto/src/store/timers.ts'])
  assert.equal(timers.broad, false)
  assert.ok(timers.data)
})

test('a registry entry change marks its demo action and the beat that names it', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  const rep = run(fx, [{ path: 'proto/src/shared/demoTriggers/registry.ts', ranges: [[15, 15]] }])
  assert.deepEqual(rep.triggers.map((x) => x.id), ['count-ledger'])
  assert.deepEqual(ids(rep), ['R-TRIG'])
  assert.deepEqual(rep.beats.map((b) => b.title), ['Beat 2: the books'])
})

test('beats link by URL and by capitalised screen name, not by the plain word', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  const rep = run(fx, ['proto/src/apps/admin/LedgerScreen.tsx'])
  assert.deepEqual(rep.beats.map((b) => [b.title, b.strength]), [['Beat 2: the books', 'mention']])
  const day = run(fx, ['proto/src/apps/admin/DayGrid.tsx'])
  assert.deepEqual(day.beats.map((b) => [b.title, b.strength]), [['Beat 1: the day', 'link']])
})

test('tests and files outside src are ignored; absent recipes never match', (t) => {
  const fx = fixture()
  t.after(fx.cleanup)
  const rep = run(fx, ['proto/src/apps/admin/DayGrid.test.tsx', 'proto/visual/x.spec.ts'])
  assert.equal(rep.changed.length, 0)
  assert.equal(rep.ignored.length, 2)
  assert.equal(rep.totals.withShots, 7)
})

// ---------------------------------------------------------------------------
// Smoke test on the real tree
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const real = existsSync(path.join(repoRoot, DEFAULT_CONFIG.routers[0].file))

test('smoke: the real prototype parses cleanly and a screen change maps to its recipes', { skip: !real && 'not in the repo' }, () => {
  const provider = fsProvider(repoRoot)
  const g = buildGraph(provider)
  assert.ok(g.modules.size > 300)
  // every exported local declaration has a chunk of its own (the chunker did not swallow one)
  const missing = []
  for (const [file, mod] of g.modules) {
    for (const [, e] of mod.exportsMap) {
      if ('local' in e && !mod.chunks.some((c) => c.name === e.local) && !mod.imports.has(e.local)) missing.push(`${file}#${e.local}`)
    }
  }
  assert.deepEqual(missing, [])
  const rep = analyse({ provider, changes: [{ path: 'aa-prototype/src/apps/admin/screens/LedgerScreen.tsx', status: 'M', ranges: null, text: [] }] })
  assert.equal(rep.broad, false)
  assert.ok(rep.routes.some((r) => r.route === '/admin/ledger'))
  assert.ok(rep.recipes.length > 0 && rep.recipes.length < 20, `${rep.recipes.length} recipes`)
  assert.ok(rep.recipes.every((r) => r.reasons.length > 0))
  assert.ok(rep.beats.some((b) => b.strength === 'link'))
  // the mobile booking screen reaches mobile booking shots, not the Lists home
  const mob = analyse({ provider, changes: [{ path: 'aa-prototype/src/apps/mobile/screens/BookingDetailScreen.tsx', status: 'M', ranges: null, text: [] }] })
  const mobImages = mob.recipes.flatMap((r) => r.images).filter((i) => i.startsWith('mobile-'))
  assert.ok(mobImages.length > 0)
  assert.ok(!mob.routes.some((r) => r.target === 'pwa' && r.route === '/mobile/more'))
})

#!/usr/bin/env node
/**
 * affected-shots: which catalogue capture recipes and demo-guide beats does a prototype change affect?
 *
 *   npm run affected                              working tree vs HEAD (staged, unstaged, untracked)
 *   npm run affected -- --base master             everything since master: merge-base to the working tree
 *   npm run affected -- --base A --head B         commit A to commit B (also `--base A..B`, `--base A...B`)
 *   npm run affected -- src/shared/ui/Button.tsx  explicit files (paths from aa-prototype/ or the repo root)
 *   ... --json                                    machine-readable report
 *   ... --ids                                     comma list for `node scripts/capture.ts --only <ids>`
 *
 * How it works (plain Node, no dependencies, no TypeScript compiler):
 *
 * 1. Changed files under aa-prototype/ come from git (`diff -U0`, so each file carries its changed
 *    line ranges) or from the command line (whole file). Tests and files outside src/ and pwa/ are
 *    reported and ignored.
 * 2. Every .ts/.tsx under src/ and pwa/ is cut into top-level chunks (one per declaration, import
 *    or bare statement; formatted code puts each at column 0 and depth 0). A chunk's references are
 *    the identifiers it uses that name an import or another top-level declaration. Imports resolve
 *    relative paths, index files, `.ts` extensions and tsconfig `paths`, and named imports resolve
 *    through barrels (`export { X } from`, `export *`) to the file that defines them, so a change to
 *    one shared component does not reach every importer of `shared/ui`. Type-only imports and
 *    `interface`/`type` declarations carry no runtime edge.
 * 3. Changed line ranges pick the changed chunks (an import line marks the chunks that use the
 *    names it imports). From those, a reverse walk over chunk references finds every affected chunk.
 *    The walk does not pass through the store's construction (`store/appStore.ts`): reaching it is
 *    reported as a data change instead of reaching every screen.
 * 4. The route tables in `src/router.tsx` (framed prototype: admin, web, simulator shots) and
 *    `pwa/main.tsx` (mobile shots, which run on the PWA dev server) are parsed from their JSX:
 *    `<Route path element>` nesting, index routes, splats, layout routes. A route is affected when
 *    a component named in its element (or a layout above it) is affected. Two refinements narrow
 *    composite screens: a hand table for the mobile slide stacks (which layer a component renders
 *    at, by URL depth), and an automatic one for `{view === 'x' && <Comp/>}` switches on a search
 *    param read with `params.get('view')` (Master data's `?view=`).
 * 5. Each recipe state is matched by the URLs it visits (`start`, `goto` steps in setup and steps,
 *    `/demo/control` for a `scenario` step), resolved like react-router (static segments beat
 *    params beat splats); by its selectors (`data-shot`, `data-testid` values in highlights and
 *    steps) against the hooks rendered by affected chunks; and by its `trigger` steps against the
 *    demo actions whose registry entries changed or call changed code.
 * 6. Demo beats come first from `DEMO_SCENARIOS` (src/apps/demo/demoScenarios.ts): each S1 to S5 beat
 *    carries a deep link, read statically here (a `path` literal or template, or the URL in a path
 *    helper it calls), so a beat is affected when its link lands on an affected screen or its entry
 *    (or a helper it calls) changed. Scenario beat N is reported at "### Beat N" under the guide's
 *    "## Sn" section, or at its line in demoScenarios.ts when the guide has no such heading. As a
 *    fallback for everything else (asides, the cheat sheet), `###` sections of
 *    docs/demo-guide/03-demo-script.md and the cheat sheet are matched by URLs written in the beat, by
 *    screen names from the script's "Direct URLs" table and the trigger registry's `screen` headings,
 *    by demo action labels, and by scenario jump changes outside the beats.
 *
 * Known blind spots (see also the --help text):
 * - Screens reached only by clicking (a recipe that starts on Day and clicks into a sheet) are found
 *   only through hook selectors; a state with no hooks on the changed component is missed.
 * - A route wrapper that picks a screen from a URL param (e.g. `/admin/invoices/:invoiceId` showing
 *   the document) or local state is not split; both views count as affected.
 * - Seed and store changes move figures everywhere: they are reported as a data change, with the
 *   store slices the change names and the recipes whose screens read those slices, not as precise hits.
 * - A CSS change is traced by the class names in the rules it touches (to the chunks that name the
 *   class); a rule with no class (`body`, `:root`, an at-rule) reaches every screen. Classes built
 *   at runtime (`aa-${x}`) are not found. Other assets count through the modules that import them.
 * - Anything on a shot below the fold, or a change that does not alter pixels (a refactor, a memo),
 *   is still listed: the tool knows what renders a component, not what the change looks like.
 * - Strings and JSX text that merely mention an identifier can add false references.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Configuration (repo-relative paths)
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG = {
  proto: 'aa-prototype',
  srcRoots: ['aa-prototype/src', 'aa-prototype/pwa'],
  tsconfig: 'aa-prototype/tsconfig.app.json',
  /** Route tables: `target` names the dev server a recipe's app runs on. */
  routers: [
    { file: 'aa-prototype/src/router.tsx', target: 'framed' },
    { file: 'aa-prototype/pwa/main.tsx', target: 'pwa' },
  ],
  /** App entries: a change reaching their bare statements (not through the router) reaches every screen. */
  entries: [
    { file: 'aa-prototype/src/main.tsx', target: 'framed' },
    { file: 'aa-prototype/pwa/main.tsx', target: 'pwa' },
  ],
  /** Chunks the reverse walk never enters: the router plumbing above the route table. */
  sinks: [
    'aa-prototype/src/App.tsx',
    'aa-prototype/src/router.tsx#appRouter',
    'aa-prototype/src/router.tsx#AppRouter',
    // the demo actions list: its entries are matched one by one through recipes' `trigger` steps
    'aa-prototype/src/shared/demoTriggers/registry.ts#DEMO_TRIGGERS',
  ],
  /** Files whose chunks stop the walk: the store's construction, which every screen reads. */
  hubs: ['aa-prototype/src/store/appStore.ts'],
  dataPrefixes: ['aa-prototype/src/store/', 'aa-prototype/src/domain/'],
  registry: 'aa-prototype/src/shared/demoTriggers/registry.ts',
  /** DEMO_SCENARIOS: the S1 to S5 jumps and each beat's deep link, the primary beat source. */
  scenarios: 'aa-prototype/src/apps/demo/demoScenarios.ts',
  recipes: 'requirements-board/requirements/capture/recipes',
  /** recipe `app` → route table target */
  appTargets: { admin: 'framed', web: 'framed', simulator: 'framed', mobile: 'pwa' },
  guide: ['docs/demo-guide/03-demo-script.md', 'docs/demo-guide/04-presenter-cheat-sheet.md'],
  urlTable: 'docs/demo-guide/03-demo-script.md',
  /**
   * Composite route elements that render a different component per URL (the slide stacks). Key:
   * `file#Symbol` of the route element; value: identifier used in it → the URL pattern(s) it shows
   * on. Identifiers not listed count on every URL of the route.
   */
  refinements: {
    'aa-prototype/src/apps/mobile/routes.tsx#MobileListsRoute': {
      ForwardListsScreen: ['/mobile/lists'],
      LookbackDateSheet: ['/mobile/lists'],
      ListDetailScreen: ['/mobile/lists/:listId'],
      AddBookingFlow: ['/mobile/lists/:listId'],
      BookingDetailScreen: ['/mobile/lists/:listId/bookings/:bookingId'],
    },
    'aa-prototype/src/apps/mobile/routes.tsx#MobileAvailabilityRoute': {
      AvailabilityScreen: ['/mobile/availability'],
      MyAvailabilityCalendarScreen: ['/mobile/availability/calendar'],
    },
  },
  /** More than this share of recipes with shots is a broad change: recommend a full capture. */
  broadShare: 0.25,
}

const TS_EXT = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs']
const SLICES = [
  'masters', 'schedule', 'audit', 'settings', 'appSettings', 'dayNotes', 'officePrivate', 'notifications',
  'patientCare', 'support', 'counters', 'clock', 'billing', 'xero', 'integrations', 'intake', 'masterLoads', 'shell',
]

// ---------------------------------------------------------------------------
// Source providers: the working tree, or a commit (for --head)
// ---------------------------------------------------------------------------

export function fsProvider(root) {
  const cache = new Map()
  return {
    root,
    list(prefix) {
      const out = []
      const walk = (rel) => {
        const abs = path.join(root, rel)
        let entries
        try {
          entries = readdirSync(abs, { withFileTypes: true })
        } catch {
          return
        }
        for (const e of entries) {
          if (e.name === 'node_modules' || e.name.startsWith('.')) continue
          const r = `${rel}/${e.name}`
          if (e.isDirectory()) walk(r)
          else out.push(r)
        }
      }
      const abs = path.join(root, prefix)
      if (existsSync(abs) && statSync(abs).isFile()) return [prefix]
      walk(prefix)
      return out
    },
    read(rel) {
      if (cache.has(rel)) return cache.get(rel)
      let text = null
      try {
        text = readFileSync(path.join(root, rel), 'utf8')
      } catch {
        text = null
      }
      cache.set(rel, text)
      return text
    },
  }
}

export function gitProvider(root, rev, prefixes) {
  const listing = execFileSync('git', ['ls-tree', '-r', '--name-only', rev, '--', ...prefixes], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 })
  const files = listing.split('\n').filter(Boolean)
  const wanted = files.filter((f) => /\.(tsx?|mts|jsx?|mjs|json|md|css)$/.test(f))
  const res = spawnSync('git', ['cat-file', '--batch'], { cwd: root, input: wanted.map((f) => `${rev}:${f}`).join('\n') + '\n', maxBuffer: 512 << 20 })
  const buf = res.stdout
  const contents = new Map()
  let pos = 0
  for (const f of wanted) {
    const nl = buf.indexOf(10, pos)
    const header = buf.toString('utf8', pos, nl)
    pos = nl + 1
    const m = /^\S+ (\w+) (\d+)$/.exec(header)
    if (!m) continue
    const size = Number(m[2])
    contents.set(f, buf.toString('utf8', pos, pos + size))
    pos += size + 1
  }
  return {
    root,
    list(prefix) {
      return files.filter((f) => f === prefix || f.startsWith(prefix + '/'))
    },
    read(rel) {
      return contents.has(rel) ? contents.get(rel) : null
    },
  }
}

// ---------------------------------------------------------------------------
// Lexing: comments out, strings blanked, top-level statement starts
// ---------------------------------------------------------------------------

/**
 * One pass over the source. Returns `code` (comments replaced by spaces), `bare` (comments and
 * string/template text replaced by spaces, `${}` expressions kept) and, per line, whether the line
 * starts at depth 0 outside any string or comment. Regex literals are recognised by the character
 * before the slash.
 */
export function lex(src) {
  const n = src.length
  const code = src.split('')
  const bare = src.split('')
  const lineTop = [true]
  let depth = 0
  let i = 0
  const tplStack = [] // brace depth at which each open `${` returns to its template
  let lastSig = '' // last significant char in code
  const blank = (arr, a, b) => {
    for (let k = a; k < b; k++) if (arr[k] !== '\n') arr[k] = ' '
  }
  const lineDepth = [0]
  const pushLine = (top) => {
    lineTop.push(top)
    lineDepth.push(depth)
  }
  const newline = () => pushLine(depth === 0 && tplStack.length === 0)
  const readString = (q) => {
    const start = i
    i++
    while (i < n && src[i] !== q) {
      if (src[i] === '\\') i++
      else if (src[i] === '\n') break
      i++
    }
    blank(bare, start + 1, i)
    if (src[i] !== '\n') i++
  }
  const readTemplate = () => {
    // at a backtick or at the `}` closing a `${`
    let start = i + 1
    i++
    while (i < n) {
      const c = src[i]
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === '`') {
        blank(bare, start, i)
        i++
        return
      }
      if (c === '$' && src[i + 1] === '{') {
        blank(bare, start, i)
        tplStack.push(depth)
        depth++
        i += 2
        return
      }
      if (c === '\n') pushLine(false)
      i++
    }
    blank(bare, start, i)
  }
  while (i < n) {
    const c = src[i]
    if (c === '\n') {
      newline()
      i++
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      const s = i
      while (i < n && src[i] !== '\n') i++
      blank(code, s, i)
      blank(bare, s, i)
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const s = i
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') pushLine(false)
        i++
      }
      i += 2
      blank(code, s, i)
      blank(bare, s, i)
      continue
    }
    // an apostrophe inside a word is JSX text ("Dr Souter's"), not a string
    if (c === "'" && /[A-Za-z]/.test(src[i - 1] ?? '') && /[A-Za-z]/.test(src[i + 1] ?? '')) {
      i++
      continue
    }
    if (c === "'" || c === '"') {
      readString(c)
      lastSig = 'a'
      continue
    }
    if (c === '`') {
      readTemplate()
      lastSig = 'a'
      continue
    }
    if (c === '/' && src[i + 1] !== '>' && (lastSig === '' || '(,=:[!&|?{};~^'.includes(lastSig) || (lastSig === 'a' && /\b(return|typeof|case|in|of|void|yield|await|delete|throw)\s*$/.test(src.slice(Math.max(0, i - 12), i))))) {
      // a regex literal
      const s = i
      i++
      let inClass = false
      while (i < n && src[i] !== '\n') {
        if (src[i] === '\\') i++
        else if (src[i] === '[') inClass = true
        else if (src[i] === ']') inClass = false
        else if (src[i] === '/' && !inClass) break
        i++
      }
      if (src[i] === '/') i++
      while (i < n && /[a-z]/.test(src[i])) i++
      blank(bare, s, i)
      lastSig = 'a'
      continue
    }
    if (c === '{' || c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1)
    else if (c === '}') {
      if (tplStack.length && tplStack[tplStack.length - 1] === depth - 1) {
        depth--
        tplStack.pop()
        readTemplate()
        lastSig = 'a'
        continue
      }
      depth = Math.max(0, depth - 1)
    }
    // `x!` (a TypeScript non-null assertion) ends an operand, so a `/` after it divides
    if (!/\s/.test(c)) lastSig = /[\w$]/.test(c) || (c === '!' && (lastSig === 'a' || lastSig === ')' || lastSig === ']')) ? 'a' : c
    i++
  }
  return { code: code.join(''), bare: bare.join(''), lineTop, lineDepth }
}

// ---------------------------------------------------------------------------
// Module parsing
// ---------------------------------------------------------------------------

const IDENT = '[A-Za-z_$][\\w$]*'
const DECL_RE = new RegExp(
  `^(export\\s+)?(default\\s+)?(declare\\s+)?(async\\s+)?(function\\s*\\*?|const\\s+enum|const|let|var|abstract\\s+class|class|interface|type|enum|namespace)\\s+(${IDENT})`,
)

function parseSpecifiers(list) {
  // `a, type b, c as d` → [{ imported, local, type }]
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const type = /^type\s+/.test(s)
      const body = s.replace(/^type\s+/, '')
      const m = /^([\w$]+)(?:\s+as\s+([\w$]+))?$/.exec(body)
      if (!m) return null
      return { imported: m[1], local: m[2] ?? m[1], type }
    })
    .filter(Boolean)
}

/**
 * Cut one module into chunks and read its imports and exports.
 * chunk: { id, kind: 'decl'|'top'|'import'|'reexport'|'exportList', name, start, end (1-based lines),
 *          typeOnly, text (code), bare }
 */
export function parseModule(file, src) {
  const { code, bare, lineTop } = lex(src)
  const codeLines = code.split('\n')
  const bareLines = bare.split('\n')
  const starts = []
  for (let li = 0; li < codeLines.length; li++) {
    const line = codeLines[li]
    if (!lineTop[li]) continue
    if (!line || /^\s/.test(line)) continue
    if (/^[})\].?:+|&>,`'"]/.test(line)) continue
    starts.push(li)
  }
  const chunks = []
  const imports = new Map() // local → { spec, imported } ('default' | '*' | name)
  const sideEffects = [] // specs imported for side effects
  const exportsMap = new Map() // exported → { local } | { spec, name }
  const stars = [] // specs
  let tops = 0
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k]
    const e = (k + 1 < starts.length ? starts[k + 1] : codeLines.length) - 1
    const text = codeLines.slice(s, e + 1).join('\n')
    const bareText = bareLines.slice(s, e + 1).join('\n')
    const chunk = { kind: 'top', name: '', start: s + 1, end: e + 1, typeOnly: false, text, bare: bareText, importLocals: [] }
    let m
    if (/^import[\s{*'"]/.test(text) && !/^import\s*\(/.test(text)) {
      chunk.kind = 'import'
      if ((m = /^import\s+(type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/.exec(text))) {
        const typeAll = Boolean(m[1])
        const clause = m[2].trim()
        const spec = m[3]
        if (!typeAll) {
          const ns = /\*\s+as\s+([\w$]+)/.exec(clause)
          const named = /\{([\s\S]*)\}/.exec(clause)
          const def = /^([\w$]+)\s*(,|$)/.exec(clause)
          if (def) {
            imports.set(def[1], { spec, imported: 'default' })
            chunk.importLocals.push(def[1])
          }
          if (ns) {
            imports.set(ns[1], { spec, imported: '*' })
            chunk.importLocals.push(ns[1])
          }
          if (named) {
            for (const sp of parseSpecifiers(named[1])) {
              if (sp.type) continue
              imports.set(sp.local, { spec, imported: sp.imported })
              chunk.importLocals.push(sp.local)
            }
          }
        }
      } else if ((m = /^import\s*['"]([^'"]+)['"]/.exec(text))) {
        sideEffects.push(m[1])
      }
    } else if ((m = /^export\s+(type\s+)?\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]/.exec(text))) {
      chunk.kind = 'reexport'
      if (!m[1]) for (const sp of parseSpecifiers(m[2])) if (!sp.type) exportsMap.set(sp.local, { spec: m[3], name: sp.imported })
    } else if ((m = /^export\s+\*\s+(?:as\s+([\w$]+)\s+)?from\s*['"]([^'"]+)['"]/.exec(text))) {
      chunk.kind = 'reexport'
      if (m[1]) exportsMap.set(m[1], { spec: m[2], name: '*' })
      else stars.push(m[2])
    } else if ((m = /^export\s+(type\s+)?\{([\s\S]*?)\}/.exec(text))) {
      chunk.kind = 'exportList'
      if (!m[1]) for (const sp of parseSpecifiers(m[2])) if (!sp.type) exportsMap.set(sp.local, { local: sp.imported })
    } else if ((m = DECL_RE.exec(text))) {
      chunk.kind = 'decl'
      chunk.name = m[6]
      chunk.typeOnly = /^(interface|type)$/.test(m[5]) || Boolean(m[3])
      if (m[1] && !chunk.typeOnly) exportsMap.set(m[2] ? 'default' : chunk.name, { local: chunk.name })
      if (m[1] && m[2]) exportsMap.set(chunk.name, { local: chunk.name })
    } else if ((m = /^export\s+default\s+([\w$]+)\s*;?\s*$/.exec(text))) {
      chunk.kind = 'exportList'
      exportsMap.set('default', { local: m[1] })
    } else if (/^export\s+default\b/.test(text)) {
      chunk.kind = 'decl'
      chunk.name = 'default'
      exportsMap.set('default', { local: 'default' })
    } else {
      chunk.kind = 'top'
      chunk.name = tops === 0 ? '__top' : `__top${tops}`
      tops++
    }
    chunks.push(chunk)
  }
  return { file, src, chunks, imports, sideEffects, exportsMap, stars, lines: codeLines.length }
}

/** Identifiers a chunk references (not property names), and `ns.member` pairs. */
function chunkIdents(bareText) {
  const ids = new Set()
  const members = []
  const re = /(?<![\w$.])([A-Za-z_$][\w$]*)(\s*\??\.\s*([A-Za-z_$][\w$]*))?/g
  let m
  while ((m = re.exec(bareText))) {
    ids.add(m[1])
    if (m[3]) members.push([m[1], m[3]])
  }
  return { ids, members }
}

// ---------------------------------------------------------------------------
// The project graph
// ---------------------------------------------------------------------------

function stripJsonComments(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1')
}

export function buildGraph(provider, config = DEFAULT_CONFIG) {
  const allFiles = new Set(config.srcRoots.flatMap((r) => provider.list(r)))
  const isTest = (f) => /\.(test|spec)\.[mc]?[jt]sx?$/.test(f) || /\/src\/test\//.test(f)
  const isCode = (f) => /\.(tsx?|mts|jsx?|mjs)$/.test(f) && !f.endsWith('.d.ts') && !isTest(f)
  // tsconfig paths
  const aliases = []
  try {
    const tc = JSON.parse(stripJsonComments(provider.read(config.tsconfig) ?? '{}'))
    const base = path.posix.join(path.posix.dirname(config.tsconfig), tc.compilerOptions?.baseUrl ?? '.')
    for (const [k, vs] of Object.entries(tc.compilerOptions?.paths ?? {})) {
      aliases.push({ prefix: k.replace(/\*$/, ''), wildcard: k.endsWith('*'), targets: vs.map((v) => path.posix.join(base, v.replace(/\*$/, ''))) })
    }
  } catch {
    /* no tsconfig or no paths */
  }
  const modules = new Map()
  for (const f of allFiles) if (isCode(f)) modules.set(f, parseModule(f, provider.read(f) ?? ''))

  const resolveCache = new Map()
  function probe(p) {
    const cands = [p, ...TS_EXT.map((e) => p + e), ...TS_EXT.map((e) => `${p}/index${e}`)]
    if (/\.js$/.test(p)) cands.push(p.replace(/\.js$/, '.ts'), p.replace(/\.js$/, '.tsx'))
    for (const c of cands) if (allFiles.has(c) && !isTest(c)) return c
    return null
  }
  function resolveModule(from, spec) {
    const key = `${from}\0${spec}`
    if (resolveCache.has(key)) return resolveCache.get(key)
    let out = null
    if (spec.startsWith('.')) out = probe(path.posix.normalize(path.posix.join(path.posix.dirname(from), spec)))
    else {
      for (const a of aliases) {
        if (a.wildcard ? spec.startsWith(a.prefix) : spec === a.prefix) {
          for (const t of a.targets) {
            out = probe(path.posix.normalize(a.wildcard ? t + spec.slice(a.prefix.length) : t))
            if (out) break
          }
        }
        if (out) break
      }
    }
    resolveCache.set(key, out)
    return out
  }

  /** A local name with no chunk of its own (merged into another chunk): the chunk that declares it. */
  const aliasCache = new Map()
  function localKey(file, local) {
    const mod = modules.get(file)
    if (!mod) return `${file}#*`
    if (mod.chunks.some((c) => c.name === local)) return `${file}#${local}`
    const ck = `${file}#${local}`
    if (aliasCache.has(ck)) return aliasCache.get(ck)
    const re = new RegExp(`\\b(function\\s*\\*?|const|let|var|class|enum)\\s+${local.replace(/\$/g, '\\$')}\\b`)
    const host = mod.chunks.find((c) => c.name && re.test(c.text))
    const out = host ? `${file}#${host.name}` : `${file}#*`
    aliasCache.set(ck, out)
    return out
  }
  function hasExport(file, name, seen = new Set()) {
    const mod = modules.get(file)
    if (!mod || seen.has(file)) return false
    seen.add(file)
    if (mod.exportsMap.has(name)) return true
    return mod.stars.some((s) => {
      const t = resolveModule(file, s)
      return t ? hasExport(t, name, seen) : false
    })
  }
  /** The chunk keys a module's export resolves to, following re-exports. */
  function resolveExport(file, name, seen = new Set()) {
    const mod = modules.get(file)
    if (!mod || name === '*') return [`${file}#*`]
    const sk = `${file}#${name}`
    if (seen.has(sk)) return []
    seen.add(sk)
    const e = mod.exportsMap.get(name)
    if (e) {
      if ('local' in e) {
        const imp = mod.chunks.some((c) => c.name === e.local) ? null : mod.imports.get(e.local)
        if (imp) {
          const t = resolveModule(file, imp.spec)
          return t ? resolveExport(t, imp.imported, seen) : []
        }
        return [localKey(file, e.local)]
      }
      const t = resolveModule(file, e.spec)
      return t ? resolveExport(t, e.name, seen) : []
    }
    for (const s of mod.stars) {
      const t = resolveModule(file, s)
      if (t && hasExport(t, name)) return resolveExport(t, name, seen)
    }
    return [`${file}#*`]
  }

  // Nodes: `file#name` per chunk, `file#*` per module (and per asset).
  const nodes = new Map() // key → { file, chunk?, refs: Map<ident, Set<key>> }
  const deps = new Map() // key → Set<key>
  const addDep = (from, to) => {
    if (!deps.has(from)) deps.set(from, new Set())
    deps.get(from).add(to)
  }
  for (const [file, mod] of modules) {
    const localNames = new Map()
    for (const c of mod.chunks) {
      if ((c.kind === 'decl' || c.kind === 'top') && c.name) {
        c.key = `${file}#${c.name}`
        if (!localNames.has(c.name)) localNames.set(c.name, c)
      }
    }
    // the decl that declares a name also covers `export default Name` / `export { a as b }`
    const whole = `${file}#*`
    nodes.set(whole, { file, refs: new Map() })
    for (const c of mod.chunks) {
      if (!c.key || nodes.has(c.key)) continue
      const node = { file, chunk: c, refs: new Map() }
      nodes.set(c.key, node)
      if (!c.typeOnly) addDep(whole, c.key)
      if (c.typeOnly) continue
      const { ids, members } = chunkIdents(c.bare)
      for (const id of ids) {
        if (id === c.name) continue
        const keys = new Set()
        const imp = mod.imports.get(id)
        if (imp) {
          const t = resolveModule(file, imp.spec)
          if (!t) continue
          if (imp.imported === '*') {
            const used = members.filter(([ns]) => ns === id).map(([, mem]) => mem)
            if (used.length) for (const mem of used) for (const k of resolveExport(t, mem)) keys.add(k)
            else keys.add(`${t}#*`)
          } else for (const k of resolveExport(t, imp.imported)) keys.add(k)
        } else if (localNames.has(id)) {
          const lc = localNames.get(id)
          if (!lc.typeOnly) keys.add(lc.key)
        } else continue
        node.refs.set(id, keys)
        for (const k of keys) addDep(c.key, k)
      }
      // dynamic imports
      for (const dm of c.text.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        const t = resolveModule(file, dm[1])
        if (t) {
          node.refs.set(`import(${dm[1]})`, new Set([`${t}#*`]))
          addDep(c.key, `${t}#*`)
        }
      }
    }
    // module-level side-effect imports belong to the module's bare statements
    for (const s of mod.sideEffects) {
      const t = resolveModule(file, s)
      if (!t) continue
      const topKey = `${file}#__top`
      if (!nodes.has(topKey)) nodes.set(topKey, { file, chunk: null, refs: new Map() })
      nodes.get(topKey).refs.set(`import '${s}'`, new Set([`${t}#*`]))
      addDep(topKey, `${t}#*`)
      addDep(whole, topKey)
    }
    // a barrel's whole includes what it re-exports
    for (const [, e] of mod.exportsMap) {
      if ('spec' in e) {
        const t = resolveModule(file, e.spec)
        if (t) for (const k of resolveExport(t, e.name)) addDep(whole, k)
      }
    }
    for (const s of mod.stars) {
      const t = resolveModule(file, s)
      if (t) addDep(whole, `${t}#*`)
    }
  }
  // assets (css, images) as whole-module nodes
  for (const f of allFiles) if (!modules.has(f) && !isTest(f)) nodes.set(`${f}#*`, { file: f, refs: new Map() })

  const rdeps = new Map()
  for (const [from, tos] of deps) {
    for (const to of tos) {
      if (!rdeps.has(to)) rdeps.set(to, new Set())
      rdeps.get(to).add(from)
    }
  }
  return { modules, nodes, deps, rdeps, resolveModule, resolveExport, localKey, allFiles, isTest, isCode }
}

// ---------------------------------------------------------------------------
// Route tables
// ---------------------------------------------------------------------------

/**
 * Parse `<Route ...>` JSX nesting from a file. Returns a tree of
 * { path, fullPath, index, elementIdents, line, endLine, children, parent }.
 * Limits: attribute values must be string literals (`path="x"`) or brace expressions; routes built
 * in code (arrays, `createRoutesFromChildren` from data) are not seen.
 */
export function parseRoutes(src) {
  const { code } = lex(src)
  const root = { path: '', fullPath: '', index: false, elementIdents: [], children: [], line: 0, layout: true }
  const stack = [root]
  const re = /<Route\b|<\/Route\s*>/g
  let m
  const lineAt = (i) => code.slice(0, i).split('\n').length
  while ((m = re.exec(code))) {
    if (m[0].startsWith('</')) {
      if (stack.length > 1) stack.pop().endLine = lineAt(m.index)
      continue
    }
    // scan attributes to the closing `>` at brace depth 0
    let i = m.index + m[0].length
    let depth = 0
    let selfClosing = false
    const attrStart = i
    while (i < code.length) {
      const c = code[i]
      if (c === '{') depth++
      else if (c === '}') depth--
      else if (depth === 0 && c === '/' && code[i + 1] === '>') {
        selfClosing = true
        break
      } else if (depth === 0 && c === '>') break
      i++
    }
    const attrs = code.slice(attrStart, i)
    re.lastIndex = i + 1
    const pathM = /\bpath\s*=\s*["']([^"']*)["']/.exec(attrs)
    const index = /\bindex\b(?!\s*=\s*\{\s*false)/.test(attrs.replace(/\{[\s\S]*\}/g, ''))
    const elementIdents = []
    const el = /\belement\s*=\s*\{/.exec(attrs)
    if (el) {
      let j = el.index + el[0].length
      let d = 1
      const s = j
      while (j < attrs.length && d > 0) {
        if (attrs[j] === '{') d++
        else if (attrs[j] === '}') d--
        j++
      }
      const expr = attrs.slice(s, j - 1)
      for (const im of expr.matchAll(/<([A-Z][\w$]*)/g)) elementIdents.push(im[1])
      for (const im of expr.matchAll(/\{\s*([A-Z][\w$]*)\s*\}/g)) elementIdents.push(im[1])
    }
    const parent = stack[stack.length - 1]
    const p = pathM ? pathM[1] : ''
    const fullPath = p.startsWith('/') ? p : [parent.fullPath, p].filter(Boolean).join('/').replace(/\/+/g, '/')
    const node = { path: p, fullPath: fullPath.startsWith('/') ? fullPath : `/${fullPath}`, index, elementIdents, children: [], parent, line: lineAt(m.index), endLine: lineAt(i) }
    parent.children.push(node)
    if (!selfClosing) stack.push(node)
  }
  return root
}

function scoreRoute(fullPath, index) {
  const segs = fullPath.split('/').filter(Boolean)
  let score = segs.length
  if (segs.includes('*')) score -= 2
  if (index) score += 2
  for (const s of segs) if (s !== '*') score += s.startsWith(':') ? 3 : 10
  return score
}

/** Does a URL path match a route pattern exactly (`*` takes the rest)? */
export function matchPattern(pattern, urlPath) {
  const ps = pattern.split('/').filter(Boolean)
  const us = urlPath.split('?')[0].split('#')[0].split('/').filter(Boolean)
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i]
    if (p === '*') return true
    if (i >= us.length) return false
    if (p.startsWith(':')) continue
    if (p !== us[i] && !us[i].startsWith(':') && us[i] !== '*') return false
    if (us[i].startsWith(':') && !p.startsWith(':')) return false
  }
  return ps.length === us.length
}

/** The best matching route chain (root first) for a URL, like react-router's ranking. */
export function matchRoute(tree, url) {
  let best = null
  const visit = (node, chain) => {
    const here = [...chain, node]
    const leaf = node.children.length === 0 || node.index
    if (node !== tree && leaf && matchPattern(node.fullPath, url)) {
      const score = scoreRoute(node.fullPath, node.index)
      if (!best || score > best.score || (score === best.score && here.length > best.chain.length)) best = { score, chain: here }
    }
    for (const ch of node.children) visit(ch, here)
  }
  visit(tree, [])
  return best ? best.chain : null
}

// ---------------------------------------------------------------------------
// Git changes
// ---------------------------------------------------------------------------

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 << 20 })
}

/** Parse `git diff -U0` output into [{ path, status, ranges: [[a, b]], text }] (new-file lines). */
export function parseDiff(out) {
  const files = []
  let cur = null
  let newLine = 0
  for (const line of out.split('\n')) {
    if (line.startsWith('diff --git ')) {
      cur = { path: null, oldPath: null, status: 'M', ranges: [], text: [], added: [], removed: [] }
      newLine = 0
      files.push(cur)
      continue
    }
    if (!cur) continue
    if (line.startsWith('new file mode')) cur.status = 'A'
    else if (line.startsWith('deleted file mode')) cur.status = 'D'
    else if (line.startsWith('--- ')) cur.oldPath = line.slice(4).replace(/^a\//, '')
    else if (line.startsWith('+++ ')) cur.path = line.slice(4) === '/dev/null' ? cur.oldPath : line.slice(4).replace(/^b\//, '')
    else if (line.startsWith('@@')) {
      const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line)
      if (m) {
        const start = Number(m[1])
        const count = m[2] === undefined ? 1 : Number(m[2])
        cur.ranges.push(count === 0 ? [start, start + 1] : [start, start + count - 1])
        newLine = start
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      cur.text.push(line.slice(1))
      cur.added.push({ line: newLine++, text: line.slice(1) })
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      cur.text.push(line.slice(1))
      cur.removed.push(line.slice(1))
    }
  }
  for (const f of files) if (!f.path) f.path = f.oldPath
  return files.filter((f) => f.path)
}

export function collectChanges(root, opts, config = DEFAULT_CONFIG) {
  const proto = config.proto
  let baseRev = null
  let headRev = null
  if (opts.base) {
    const tri = opts.base.split('...')
    const two = opts.base.split('..')
    if (tri.length === 2) {
      headRev = tri[1] || 'HEAD'
      baseRev = git(root, ['merge-base', tri[0], headRev]).trim()
    } else if (two.length === 2) {
      baseRev = two[0]
      headRev = two[1] || 'HEAD'
    } else {
      baseRev = opts.head ? opts.base : git(root, ['merge-base', opts.base, 'HEAD']).trim()
      headRev = opts.head ?? null
    }
  } else if (opts.head) {
    baseRev = `${opts.head}^`
    headRev = opts.head
  }
  if (opts.files?.length) {
    return {
      mode: 'files',
      baseRev: null,
      headRev: null,
      changes: opts.files.map((f) => {
        const p = f.startsWith(`${proto}/`) ? f : `${proto}/${f.replace(/^\.\//, '')}`
        return { path: p, status: 'M', ranges: null, text: [] }
      }),
    }
  }
  const args = ['diff', '-U0', '--no-color', '--no-ext-diff', '--find-renames']
  if (baseRev && headRev) args.push(baseRev, headRev)
  else args.push(baseRev ?? 'HEAD')
  args.push('--', proto)
  const changes = parseDiff(git(root, args))
  if (!headRev) {
    const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '--', proto]).split('\n').filter(Boolean)
    for (const u of untracked) changes.push({ path: u, status: 'A', ranges: null, text: [] })
  }
  return { mode: headRev ? 'range' : baseRev && opts.base ? 'base' : 'worktree', baseRev: baseRev ?? 'HEAD', headRev, changes }
}

// ---------------------------------------------------------------------------
// Recipes, triggers, guide
// ---------------------------------------------------------------------------

export function loadRecipes(provider, config = DEFAULT_CONFIG) {
  const out = []
  for (const f of provider.list(config.recipes)) {
    if (!f.endsWith('.json')) continue
    try {
      const r = JSON.parse(provider.read(f))
      out.push({ ...r, file: f })
    } catch {
      /* a broken recipe is the runner's business */
    }
  }
  return out.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }))
}

const SEL_RE = /data-(shot|testid)\s*([~^$*|]?=)\s*["']?([\w:.-]+)/g
function selectorsOf(value) {
  const out = []
  if (typeof value !== 'string') return out
  for (const m of value.matchAll(SEL_RE)) out.push({ attr: m[1], op: m[2], value: m[3] })
  return out
}

/** One entry per recipe state: the URLs it visits, its selectors and its triggers. */
export function recipeStates(recipe, config = DEFAULT_CONFIG) {
  const out = []
  for (const shot of recipe.shots ?? []) {
    const target = config.appTargets[shot.app] ?? 'framed'
    const baseVisits = []
    if (shot.start) baseVisits.push({ target, url: shot.start })
    const stepInfo = (steps) => {
      const visits = []
      const sels = []
      const triggers = []
      for (const st of steps ?? []) {
        if (st.goto) visits.push({ target, url: st.goto })
        if (st.scenario) visits.push({ target: 'framed', url: '/demo/control' })
        if (st.trigger) triggers.push(st.trigger)
        for (const k of ['click', 'dblclick', 'fill', 'hover', 'select', 'scroll', 'on', 'wait']) if (typeof st[k] === 'string') sels.push(...selectorsOf(st[k]))
      }
      return { visits, sels, triggers }
    }
    const setup = stepInfo(shot.setup)
    const states = shot.states?.length ? shot.states : [{ steps: [] }]
    for (const st of states) {
      const own = stepInfo(st.steps)
      const sels = [...setup.sels, ...own.sels, ...(st.highlight ?? []).flatMap(selectorsOf)]
      out.push({
        shot: shot.name,
        app: shot.app,
        image: `${shot.app}-${shot.name}${st.state ? `-${st.state}` : ''}`,
        visits: [...baseVisits, ...setup.visits, ...own.visits],
        sels,
        triggers: [...setup.triggers, ...own.triggers],
      })
    }
  }
  return out
}

/** Demo trigger entries: id, label, screen, routes, line span. */
export function parseRegistry(src) {
  if (!src) return []
  const lines = src.split('\n')
  // top-level string and string-array constants (`const BILLING_MONITOR = ['/admin/billing'] as const`)
  const consts = new Map()
  for (const m of src.matchAll(/^(?:export\s+)?const\s+([A-Z][\w$]*)(?::[^=\n]+)?\s*=\s*(['"`])([^'"`\n]*)\2/gm)) consts.set(m[1], [m[3]])
  for (const m of src.matchAll(/^(?:export\s+)?const\s+([A-Z][\w$]*)(?::[^=\n]+)?\s*=\s*\[([^\]]*)\]/gm)) consts.set(m[1], [...m[2].matchAll(/['"`]([^'"`]+)['"`]/g)].map((r) => r[1]))
  const valuesOf = (expr) => [
    ...[...expr.matchAll(/['"`]([^'"`]+)['"`]/g)].map((r) => r[1]),
    ...[...expr.matchAll(/\b([A-Z][A-Z0-9_]+)\b/g)].flatMap((r) => consts.get(r[1]) ?? []),
  ]
  // an entry is an `id:` line whose object also names a `screen:` (choices have ids too)
  const cands = []
  lines.forEach((l, i) => {
    const m = /^\s*id:\s*['"`]([a-z0-9-]+)['"`]/.exec(l)
    if (m) cands.push({ id: m[1], idLine: i + 1 })
  })
  const entries = cands.filter((c, k) => {
    const upto = k + 1 < cands.length ? cands[k + 1].idLine - 1 : Math.min(lines.length, c.idLine + 40)
    return /\bscreen:/.test(lines.slice(c.idLine, upto).join('\n'))
  })
  for (let k = 0; k < entries.length; k++) {
    const e = entries[k]
    e.start = e.idLine - 1
    e.end = k + 1 < entries.length ? entries[k + 1].idLine - 2 : lines.length
    const body = lines.slice(e.start - 1, e.end).join('\n')
    e.label = /\blabel:\s*['"`]([^'"`]+)['"`]/.exec(body)?.[1] ?? ''
    const screen = /\bscreen:\s*([^\n]+)/.exec(body)?.[1] ?? ''
    e.screen = valuesOf(screen)[0] ?? ''
    const routes = /\broutes:\s*([^\n]+)/.exec(body)?.[1] ?? ''
    e.routes = valuesOf(routes).filter((r) => r.startsWith('/'))
    e.body = body
  }
  return entries
}

/** Phrase → URLs from the script's Direct URLs tables and the registry's screen headings. */
export function screenPhrases(urlTableSrc, triggers) {
  const phrases = new Map()
  const add = (phrase, url) => {
    // screen names keep their capitals: prose that navigates names the screen ("Admin Ledger reads"),
    // prose that explains uses the plain word ("the ledger balances")
    const p = phrase.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
    if (p.length < 5 || /^(booking|bookings|list|lists|day|more|dashboard|booking detail|list detail)$/i.test(p)) return
    if (!phrases.has(p)) phrases.set(p, new Set())
    phrases.get(p).add(url)
  }
  for (const line of (urlTableSrc ?? '').split('\n')) {
    const m = /^\|\s*([^|]+?)\s*\|\s*`(\/[^`]+)`/.exec(line)
    if (m && !/^-+$/.test(m[1])) add(m[1], m[2].replace(/<[^>]+>/g, ':x'))
  }
  const fromTable = new Set([...phrases.keys()].map((k) => k.toLowerCase()))
  for (const t of triggers) {
    const name = t.screen.split('·').pop()?.trim()
    if (name && t.routes.length === 1 && !fromTable.has(name.toLowerCase())) add(name, t.routes[0])
  }
  return phrases
}

/** App URLs in a piece of source: string literals and templates (`${...}` read as a `:x` param). */
function urlsInSource(text) {
  const out = new Set()
  for (const m of text.matchAll(/(['"`])(\/(?:admin|web|mobile|demo)(?:(?!\1)[^\n])*)\1/g)) {
    // the query stays: a `?view=` switch narrows the screen
    out.add(m[2].replace(/\$\{[^}]*\}/g, ':x'))
  }
  return out
}

/**
 * The beats of `DEMO_SCENARIOS` (demoScenarios.ts), read statically: per beat its scenario, number,
 * run-sheet name, label, line span and the URL patterns its `path` can link to (literals in the path,
 * plus the URLs of the module's top-level path helpers it calls, followed transitively). Helper line
 * spans are returned too, so a change to a helper marks the beats that call it.
 */
export function parseScenarioBeats(src) {
  const lines = (src ?? '').split('\n')
  // top-level helpers: `function name(` at column 0 (optionally exported) up to the next `}` at column 0
  const helpers = new Map()
  lines.forEach((l, i) => {
    const m = /^(?:export\s+)?function\s+(\w+)\s*\(/.exec(l)
    if (!m) return
    let end = i
    while (end < lines.length - 1 && !/^}/.test(lines[end])) end++
    const text = lines.slice(i, end + 1).join('\n')
    helpers.set(m[1], { name: m[1], start: i + 1, end: end + 1, text, urls: urlsInSource(text) })
  })
  // a call (`reviewPath(s, id)`) or a bare reference (`path: adminDayPath`)
  const helperRe = (name) => new RegExp(`(?<![\\w.])${name}(?![\\w])`)
  const helperUrls = (text, seen = new Set()) => {
    const out = new Set(urlsInSource(text))
    const used = []
    for (const h of helpers.values()) {
      if (seen.has(h.name) || !helperRe(h.name).test(text)) continue
      seen.add(h.name)
      used.push(h.name)
      const inner = helperUrls(h.text.split('\n').slice(1).join('\n'), seen)
      for (const u of inner.urls) out.add(u)
      used.push(...inner.used)
    }
    return { urls: out, used }
  }
  const startAt = lines.findIndex((l) => /DEMO_SCENARIOS\b.*=\s*\[/.test(l))
  const beats = []
  if (startAt < 0) return { beats, helpers: [...helpers.values()] }
  let scenario = null
  let scenarioTitle = ''
  let inBeats = false
  let n = 0
  const str = (l, key) => new RegExp(`\\b${key}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`).exec(l)?.[2]
  for (let i = startAt + 1; i < lines.length; i++) {
    const l = lines[i]
    const id = /^\s*id:\s*'(S\d)'/.exec(l)?.[1]
    if (id) {
      scenario = id
      scenarioTitle = id
      inBeats = false
      n = 0
      continue
    }
    const title = str(l, 'title')
    if (title && scenario && !inBeats) scenarioTitle = title
    if (/^\s*beats:\s*\[/.test(l)) {
      inBeats = true
      continue
    }
    if (inBeats && /^\s*\],?\s*$/.test(l)) {
      inBeats = false
      continue
    }
    const beat = inBeats ? str(l, 'beat') : undefined
    if (beat === undefined || !scenario) continue
    const start = /^\s*\{\s*$/.test(lines[i - 1]) ? i : i + 1
    let end = i
    // the entry runs to the line before the next entry or the close of the beats array
    while (end + 1 < lines.length && !/^\s*(\{|\],?\s*$)/.test(lines[end + 1])) end++
    const text = lines.slice(start - 1, end + 1).join('\n')
    const pathAt = text.search(/\bpath:/)
    const { urls, used } = helperUrls(pathAt >= 0 ? text.slice(pathAt) : '')
    n++
    beats.push({ scenario, scenarioTitle, n, beat, label: str(text, 'label') ?? beat, does: str(text, 'does') ?? '', start, end: end + 1, urls: [...urls], helpers: used })
  }
  return { beats, helpers: [...helpers.values()] }
}

/** `###` beats (and `##` sections) of a guide file, with the URLs and phrases each mentions. */
export function parseBeats(file, src, phrases) {
  const lines = (src ?? '').split('\n')
  const heads = []
  lines.forEach((l, i) => {
    const m = /^(#{2,3})\s+(.*)$/.exec(l)
    if (m) heads.push({ level: m[1].length, title: m[2].trim(), line: i + 1 })
  })
  const beats = []
  let section = ''
  for (let k = 0; k < heads.length; k++) {
    const h = heads[k]
    if (h.level === 2) section = h.title
    if (/^direct urls$/i.test(section)) continue
    const end = k + 1 < heads.length ? heads[k + 1].line - 1 : lines.length
    const text = lines.slice(h.line, end).join('\n')
    const scenario = /^(S\d)\b/.exec(section)?.[1] ?? null
    const urls = new Set()
    for (const m of text.matchAll(/(?<![\w/])\/(?:admin|web|mobile|demo)(?:\/[\w:<>.-]*)*/g)) urls.add(m[0].replace(/<[^>]+>/g, ':x'))
    const viaPhrase = []
    for (const [p, us] of phrases) {
      const re = new RegExp(`(?<![\\w])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`)
      if (re.test(text)) for (const u of us) viaPhrase.push({ phrase: p, url: u })
    }
    beats.push({ file, line: h.line, level: h.level, section, scenario, title: h.title, text, urls: [...urls], viaPhrase })
  }
  return beats
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

const rel = (k) => k.replace(/^aa-prototype\//, '')

/** Hook values a chunk renders: data-shot / data-testid / shot props. Template prefixes end in `*`. */
export function hooksIn(text) {
  const out = new Set()
  const re = /(?:data-shot|data-testid|\bshot|\btestId)\s*(=|:)\s*/g
  let m
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length
    let expr = ''
    if (text[i] === '{') {
      let d = 0
      const s = i
      for (; i < text.length; i++) {
        if (text[i] === '{') d++
        else if (text[i] === '}' && --d === 0) break
      }
      expr = text.slice(s + 1, i)
    } else {
      const sm = /^(['"`])((?:\\.|(?!\1).)*)\1/.exec(text.slice(i))
      expr = sm ? sm[0] : ''
    }
    for (const s of expr.matchAll(/(['"])([\w:.-]+)\1/g)) out.add(s[2])
    for (const s of expr.matchAll(/`([\w:.-]*)\$\{/g)) if (s[1]) out.add(`${s[1]}*`)
    for (const s of expr.matchAll(/`([\w:.-]+)`/g)) out.add(s[1])
  }
  return out
}

/**
 * The class names a CSS change touches: the selectors of every rule holding a changed line (and any
 * removed selector). `global` names the first selector with no class (`body`, `:root`, `button`),
 * which makes the change reach every screen.
 */
export function cssClassesChanged(src, ch) {
  const lines = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n')
  const selectors = new Set()
  const selectorAt = (lineNo) => {
    // the rule a line sits in: back to the nearest `{`, then its selector lines
    let depth = 0
    for (let i = Math.min(lineNo, lines.length) - 1; i >= 0; i--) {
      const l = lines[i]
      if (l.includes('}') && i !== lineNo - 1) depth++
      if (l.includes('{')) {
        if (depth > 0) {
          depth--
          continue
        }
        const sel = [l.split('{')[0]]
        for (let j = i - 1; j >= 0 && /,\s*$/.test(lines[j]); j--) sel.unshift(lines[j])
        return sel.join(' ').trim()
      }
    }
    return ''
  }
  for (const [a, b] of ch.ranges ?? []) for (let n = a; n <= Math.min(b, lines.length); n++) if (lines[n - 1]?.trim()) selectors.add(selectorAt(n))
  for (const r of ch.removed ?? []) if (/[{,]\s*$/.test(r)) selectors.add(r.split('{')[0].trim())
  const classes = new Set()
  let global = null
  for (const s of selectors) {
    if (!s) continue
    if (s.startsWith('@')) {
      global ??= s
      continue
    }
    for (const part of s.split(',')) {
      const p = part.trim()
      if (!p) continue
      const cls = [...p.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1])
      if (!cls.length) global ??= p
      for (const c of cls) classes.add(c)
    }
  }
  return { classes: [...classes], global }
}

function hookMatches(hook, sel) {
  const value = sel.value
  if (hook.endsWith('*')) {
    const pre = hook.slice(0, -1)
    return sel.op === '^=' ? value.startsWith(pre) || pre.startsWith(value) : value.startsWith(pre)
  }
  if (sel.op === '^=') return hook.startsWith(value)
  if (sel.op === '*=') return hook.includes(value)
  if (sel.op === '$=') return hook.endsWith(value)
  return hook === value
}

/**
 * Analyse a set of changes against a source tree.
 * @param {{ provider, changes: Array<{path, status, ranges: [number, number][] | null, text: string[]}>, config? }} input
 */
export function analyse({ provider, changes, config = DEFAULT_CONFIG }) {
  const g = buildGraph(provider, config)
  const report = {
    changed: [],
    ignored: [],
    deleted: [],
    seeds: [],
    appWide: [],
    routes: [],
    recipes: [],
    beats: [],
    data: null,
    triggers: [],
    totals: {},
    broad: false,
    broadReason: '',
  }

  // ---- seeds ------------------------------------------------------------
  const seeds = new Map() // key → reason
  const changedHookText = []
  const isData = (f) => config.dataPrefixes.some((p) => f.startsWith(p))
  const dataFiles = []
  for (const ch of changes) {
    const f = ch.path
    if (!f.startsWith(`${config.proto}/`)) continue
    const inSrc = config.srcRoots.some((r) => f.startsWith(r + '/'))
    if (ch.status === 'D') {
      report.deleted.push(f)
      continue
    }
    if (!inSrc || g.isTest(f) || f.endsWith('.d.ts')) {
      report.ignored.push({ file: f, why: g.isTest(f) ? 'test' : 'outside src/ and pwa/' })
      continue
    }
    const mod = g.modules.get(f)
    const entry = { file: f, symbols: [], data: isData(f) }
    report.changed.push(entry)
    if (isData(f)) dataFiles.push(f)
    changedHookText.push(...(ch.text ?? []))
    if (!mod) {
      const css = f.endsWith('.css') && ch.ranges ? cssClassesChanged(provider.read(f) ?? '', ch) : null
      if (css && !css.global) {
        // class-scoped CSS: seed the chunks that name those classes, not every importer of the sheet
        entry.symbols.push(...css.classes.map((c) => `.${c}`))
        for (const cls of css.classes) {
          const re = new RegExp(`(?<![\\w-])${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`)
          for (const [mf, m] of g.modules) {
            if (mf === f) continue
            for (const c of m.chunks) if (c.key && !c.typeOnly && re.test(c.text)) seeds.set(c.key, `uses .${cls} from ${rel(f)}`)
          }
        }
        continue
      }
      seeds.set(`${f}#*`, `${rel(f)} changed${css?.global ? ` (global selector ${css.global})` : ''}`)
      entry.symbols.push('*')
      continue
    }
    const hit = new Set()
    const touches = (c) => !ch.ranges || ch.ranges.some(([a, b]) => a <= c.end && b >= c.start)
    for (const c of mod.chunks) {
      if (!touches(c)) continue
      if (c.kind === 'import') {
        // only names whose binding changed: on an added line, and not imported the same way before
        const spec = /from\s*['"]([^'"]+)['"]/.exec(c.text)?.[1] ?? /^import\s*['"]([^'"]+)['"]/.exec(c.text)?.[1]
        const addedText = (ch.added ?? []).filter((a) => a.line >= c.start && a.line <= c.end).map((a) => a.text).join('\n')
        const removedText = (ch.removed ?? []).join('\n')
        const sameBefore = (local) =>
          (ch.removed ?? []).some((r) => new RegExp(`\\b${local}\\b`).test(r) && (!/from\s*['"]/.test(r) || r.includes(`'${spec}'`) || r.includes(`"${spec}"`)))
        for (const local of c.importLocals) {
          if (ch.ranges && ch.added && !new RegExp(`\\b${local}\\b`).test(addedText)) continue
          if (ch.ranges && ch.added && removedText && sameBefore(local)) continue
          for (const c2 of mod.chunks) {
            if (c2.key && !c2.typeOnly && g.nodes.get(c2.key)?.refs.has(local)) hit.add(c2.key)
          }
        }
        if (/^import\s*['"]/.test(c.text)) hit.add(`${f}#__top`)
      } else if (c.key && !c.typeOnly) hit.add(c.key)
    }
    for (const k of hit) {
      seeds.set(k, `${rel(k)} changed`)
      entry.symbols.push(k.split('#')[1])
    }
  }

  // ---- reverse walk -------------------------------------------------------
  const hubFiles = new Set(config.hubs)
  const sinks = new Set(config.sinks)
  const isSink = (k) => sinks.has(k) || sinks.has(k.split('#')[0])
  const affected = new Map() // key → parent key (null for seeds)
  const queue = []
  let reachedHub = null
  for (const k of seeds.keys()) {
    affected.set(k, null)
    queue.push(k)
  }
  while (queue.length) {
    const k = queue.shift()
    if (isSink(k)) continue
    for (const p of g.rdeps.get(k) ?? []) {
      if (affected.has(p)) continue
      const pf = p.split('#')[0]
      if (hubFiles.has(pf)) {
        reachedHub ??= { key: p, via: k }
        continue
      }
      if (isSink(p)) continue
      affected.set(p, k)
      queue.push(p)
    }
  }
  report.seeds = [...seeds.keys()].map(rel)
  const chainOf = (k) => {
    const out = []
    for (let c = k; c; c = affected.get(c)) out.push(rel(c))
    return out.reverse()
  }

  // ---- URL-aware evaluation (refinements) --------------------------------
  // automatic `?param` view switches: `const v = parse(params.get('view'))` … `{v === 'x' && <Comp`
  const queryRefine = new Map() // key → Map<ident, {param, value}>
  for (const [, mod] of g.modules) {
    for (const c of mod.chunks) {
      if (!c.key) continue
      const vars = new Map()
      for (const m of c.text.matchAll(/const\s+([\w$]+)\s*=\s*[\w$.]*\(?\s*\w*[pP]arams\.get\(\s*['"]([\w-]+)['"]\s*\)/g)) vars.set(m[1], m[2])
      if (!vars.size) continue
      const map = new Map()
      for (const m of c.text.matchAll(/\b([\w$]+)\s*===\s*['"]([\w-]+)['"]\s*&&\s*<([A-Z][\w$]*)/g)) {
        if (vars.has(m[1])) map.set(m[3], { param: vars.get(m[1]), value: m[2] })
      }
      if (map.size) queryRefine.set(c.key, map)
    }
  }
  const refineFor = (key, ident, url) => {
    const pathRef = config.refinements[key]?.[ident]
    if (pathRef && !pathRef.some((p) => matchPattern(p, url))) return false
    const q = queryRefine.get(key)?.get(ident)
    if (q) {
      const qs = new URLSearchParams(url.split('?')[1] ?? '')
      const v = qs.get(q.param)
      if (v !== null && v !== q.value) return false
    }
    return true
  }
  const memo = new Map()
  function evalKey(key, url, stack = new Set()) {
    if (!affected.has(key)) return null
    if (seeds.has(key)) return [key]
    const mk = `${key}\0${url}`
    if (memo.has(mk)) return memo.get(mk)
    if (stack.has(key)) return null
    stack.add(key)
    const node = g.nodes.get(key)
    let result = null
    const refined = config.refinements[key] || queryRefine.has(key)
    if (!refined) {
      // no refinement on this node: the walk's own parent is the explanation, unless a refined node lies on it
      const parent = affected.get(key)
      const r = evalKey(parent, url, stack)
      if (r) result = [...r, key]
      else {
        // another affected dependency may still hold for this URL
        for (const d of g.deps.get(key) ?? []) {
          if (d === parent || !affected.has(d)) continue
          const r2 = evalKey(d, url, stack)
          if (r2) {
            result = [...r2, key]
            break
          }
        }
      }
    } else {
      outer: for (const [ident, keys] of node?.refs ?? []) {
        if (!refineFor(key, ident, url)) continue
        for (const d of keys) {
          const r = evalKey(d, url, stack)
          if (r) {
            result = [...r, key]
            break outer
          }
        }
      }
    }
    stack.delete(key)
    memo.set(mk, result)
    return result
  }

  // ---- route tables --------------------------------------------------------
  const tables = new Map()
  for (const r of config.routers) {
    const src = provider.read(r.file)
    if (!src) continue
    const tree = parseRoutes(src)
    const mod = g.modules.get(r.file)
    const changed = changes.find((c) => c.path === r.file)
    const keyOf = (ident) => {
      const imp = mod?.imports.get(ident)
      if (imp) {
        const t = g.resolveModule(r.file, imp.spec)
        return t ? g.resolveExport(t, imp.imported) : []
      }
      const local = mod?.chunks.find((c) => c.name === ident && c.key)
      return local ? [local.key] : []
    }
    const all = []
    const walk = (n) => {
      n.elementKeys = n.elementIdents.flatMap(keyOf)
      n.directChange = Boolean(changed && n !== tree && (!changed.ranges || changed.ranges.some(([a, b]) => a <= n.endLine && b >= n.line)))
      if (n !== tree) all.push(n)
      n.children.forEach(walk)
    }
    walk(tree)
    tables.set(r.target, { tree, file: r.file, all })
  }
  /** Why a URL on a target is affected: { route, chain } or null. */
  const visitMemo = new Map()
  function visitHit(target, url) {
    const mk = `${target}\0${url}`
    if (visitMemo.has(mk)) return visitMemo.get(mk)
    let out = null
    const t = tables.get(target)
    if (t) {
      if (report.appWide.some((a) => a.target === target)) out = { route: '(whole app)', chain: report.appWide.find((a) => a.target === target).chain }
      const chain = out ? null : matchRoute(t.tree, url.split('?')[0])
      for (const n of chain ?? []) {
        if (n.directChange) {
          out = { route: n.fullPath, chain: [`${rel(t.file)} route ${n.fullPath} changed`] }
          break
        }
        for (const k of n.elementKeys) {
          const r = evalKey(k, url)
          if (r) {
            out = { route: n.fullPath, chain: r.map(rel) }
            break
          }
        }
        if (out) break
      }
    }
    visitMemo.set(mk, out)
    return out
  }

  // app-wide: an entry's bare statements reached by something other than the routes or the data layer
  for (const e of config.entries) {
    const mod = g.modules.get(e.file)
    if (!mod) continue
    const routeIdents = new Set((tables.get(e.target)?.all ?? []).flatMap((n) => n.elementIdents))
    for (const c of mod.chunks) {
      if (!c.key || !c.name.startsWith('__top')) continue
      const node = g.nodes.get(c.key)
      for (const [ident, keys] of node?.refs ?? []) {
        if (routeIdents.has(ident) || ident === 'App') continue
        for (const k of keys) {
          if (!affected.has(k) || isData(k.split('#')[0])) continue
          // `wireBillingRun(useAppStore)` and friends run the store's timers: a data change, not a visual one
          if (/^wire[A-Z]/.test(ident)) {
            reachedHub ??= { key: `${e.file}#${ident}`, via: k }
            continue
          }
          report.appWide.push({ target: e.target, chain: [...chainOf(k), `${rel(e.file)} (${ident})`] })
        }
      }
      if (seeds.has(c.key)) {
        // a changed route line is a route change (handled per route), anything else in the entry reaches every screen
        const ch = changes.find((x) => x.path === e.file)
        const routeSpans = (tables.get(e.target)?.file === e.file ? tables.get(e.target).all : []).map((n) => [n.line, n.endLine])
        const outside = !ch?.ranges || ch.ranges.some(([a, b]) => a <= c.end && b >= c.start && !routeSpans.some(([s, t]) => a >= s && b <= t))
        if (outside) report.appWide.push({ target: e.target, chain: [`${rel(e.file)} changed`] })
      }
    }
  }
  // dedupe app-wide by target
  report.appWide = [...new Map(report.appWide.map((a) => [a.target, a])).values()]

  // routes reached (for the summary)
  for (const [target, t] of tables) {
    for (const n of t.all) {
      if (!(n.index || n.children.length === 0)) continue
      // a refined splat route reports the URL patterns its layers show on
      const urls = new Set(n.elementKeys.flatMap((k) => Object.values(config.refinements[k] ?? {}).flat()))
      if (!urls.size) urls.add(n.fullPath)
      for (const url of urls) {
        const hit = visitHit(target, url)
        if (hit) report.routes.push({ target, route: url, because: hit.chain })
      }
    }
  }

  // ---- triggers -------------------------------------------------------------
  const triggers = parseRegistry(provider.read(config.registry))
  const triggerIds = new Set(triggers.map((t) => t.id))
  const affectedTriggers = new Map() // id → reason
  const regChange = changes.find((c) => c.path === config.registry)
  const regMod = g.modules.get(config.registry)
  for (const t of triggers) {
    if (regChange && (!regChange.ranges || regChange.ranges.some(([a, b]) => a <= t.end && b >= t.start))) {
      affectedTriggers.set(t.id, 'its registry entry changed')
      continue
    }
    if (!regMod) continue
    const { ids } = chunkIdents(lex(t.body).bare)
    for (const id of ids) {
      const imp = regMod.imports.get(id)
      let k
      if (imp) {
        const tf = g.resolveModule(config.registry, imp.spec)
        if (!tf) continue
        k = g.resolveExport(tf, imp.imported).find((x) => affected.has(x))
      } else if (regMod.chunks.some((c) => c.name === id && c.name !== 'DEMO_TRIGGERS')) {
        const lk = `${config.registry}#${id}`
        k = affected.has(lk) ? lk : undefined
      }
      if (k) {
        affectedTriggers.set(t.id, `it calls ${id} (${chainOf(k).join(' → ')})`)
        break
      }
    }
  }
  for (const ch of changes) {
    if (ch.path === config.registry) continue
    for (const line of ch.text ?? []) {
      for (const m of line.matchAll(/['"`]([a-z0-9]+(?:-[a-z0-9]+)+)['"`]/g)) {
        if (triggerIds.has(m[1]) && !affectedTriggers.has(m[1])) affectedTriggers.set(m[1], `named on a changed line of ${rel(ch.path)}`)
      }
    }
  }
  report.triggers = [...affectedTriggers].map(([id, why]) => ({ id, label: triggers.find((t) => t.id === id)?.label ?? '', why }))

  // ---- hooks -----------------------------------------------------------------
  const hooks = new Map() // hook → source
  for (const k of affected.keys()) {
    const node = g.nodes.get(k)
    if (!node?.chunk || node.chunk.kind !== 'decl') continue
    for (const h of hooksIn(node.chunk.text)) if (!hooks.has(h)) hooks.set(h, `${rel(k)}${seeds.has(k) ? ' (changed)' : ''}`)
  }
  for (const h of hooksIn(changedHookText.join('\n'))) if (!hooks.has(h)) hooks.set(h, 'a changed line')

  // ---- recipes ---------------------------------------------------------------
  const recipes = loadRecipes(provider, config)
  const withShots = recipes.filter((r) => (r.shots ?? []).length > 0)
  const hitRecipes = []
  for (const r of withShots) {
    const images = []
    const reasons = new Map()
    for (const st of recipeStates(r, config)) {
      let why = null
      for (const v of st.visits) {
        const h = visitHit(v.target, v.url)
        if (h) {
          why = { kind: 'route', detail: `${v.url} (${h.route}) ← ${h.chain[0]}`, chain: h.chain }
          break
        }
      }
      if (!why) {
        for (const s of st.sels) {
          for (const [h, src] of hooks) {
            if (hookMatches(h, s)) {
              why = { kind: 'hook', detail: `[data-${s.attr}${s.op}${s.value}] rendered by ${src}` }
              break
            }
          }
          if (why) break
        }
      }
      if (!why) {
        const t = st.triggers.find((id) => affectedTriggers.has(id))
        if (t) why = { kind: 'trigger', detail: `demo action ${t}: ${affectedTriggers.get(t)}` }
      }
      if (why) {
        images.push(st.image)
        const key = `${why.kind}:${why.detail}`
        if (!reasons.has(key)) reasons.set(key, why)
      }
    }
    if (images.length) hitRecipes.push({ id: r.id, status: r.status, images: [...new Set(images)], reasons: [...reasons.values()] })
  }
  report.recipes = hitRecipes

  // ---- data change -----------------------------------------------------------
  if (dataFiles.length || reachedHub) {
    const slices = new Set()
    const sliceRe = new RegExp(`\\b(?:s|state|st|getState\\(\\)|get\\(\\))\\s*\\??\\.\\s*(${SLICES.join('|')})\\b`, 'g')
    for (const ch of changes) {
      if (!isData(ch.path)) continue
      // the changed lines as they read now, plus what was removed
      const now = (provider.read(ch.path) ?? '').split('\n')
      const text = ch.ranges
        ? [...ch.ranges.flatMap(([a, b]) => now.slice(a - 1, b)), ...(ch.removed ?? [])].join('\n')
        : now.join('\n')
      for (const m of text.matchAll(sliceRe)) slices.add(m[1])
      for (const m of text.matchAll(new RegExp(`\\b(${SLICES.join('|')})\\s*:`, 'g'))) slices.add(m[1])
    }
    const seedTouched = dataFiles.some((f) => /\/domain\/seed\//.test(f)) || Boolean(reachedHub)
    // which routes read those slices: forward closure from each route element, outside the hub
    const readers = new Map() // target\0route → slices read
    if (slices.size) {
      const sliceOf = new Map()
      const closureSlices = (start) => {
        const seen = new Set()
        const found = new Set()
        const stack = [...start]
        while (stack.length) {
          const k = stack.pop()
          if (seen.has(k) || hubFiles.has(k.split('#')[0])) continue
          seen.add(k)
          if (sliceOf.has(k)) {
            for (const s of sliceOf.get(k)) found.add(s)
          } else {
            const ch = g.nodes.get(k)?.chunk
            const here = new Set()
            if (ch) for (const m of ch.bare.matchAll(sliceRe)) here.add(m[1])
            sliceOf.set(k, here)
            for (const s of here) found.add(s)
          }
          for (const d of g.deps.get(k) ?? []) stack.push(d)
        }
        return found
      }
      for (const [target, t] of tables) {
        for (const n of t.all) {
          if (!(n.index || n.children.length === 0)) continue
          // the route and its parents below the app layout (`/admin`, `/mobile`): the layouts read everything
          const chainKeys = []
          for (let p = n; p; p = p.parent) if (p === n || p.fullPath.split('/').filter(Boolean).length >= 2) chainKeys.push(...(p.elementKeys ?? []))
          readers.set(`${target}\0${n.fullPath}`, closureSlices(chainKeys))
        }
      }
    }
    const dataRecipes = []
    if (slices.size) {
      for (const r of withShots) {
        const images = []
        for (const st of recipeStates(r, config)) {
          for (const v of st.visits) {
            const t = tables.get(v.target)
            const chain = t ? matchRoute(t.tree, v.url.split('?')[0]) : null
            const leaf = chain?.[chain.length - 1]
            const read = leaf ? readers.get(`${v.target}\0${leaf.fullPath}`) : null
            if (read && [...slices].some((s) => read.has(s))) {
              images.push(st.image)
              break
            }
          }
        }
        if (images.length) dataRecipes.push({ id: r.id, images })
      }
    }
    report.data = {
      files: dataFiles.map(rel),
      reachesStore: reachedHub ? `${rel(reachedHub.via)} → ${rel(reachedHub.key)}` : null,
      seedTouched,
      slices: [...slices],
      recipes: dataRecipes.map((d) => d.id),
      recipeImages: dataRecipes,
      advice:
        !slices.size || seedTouched
          ? 'data change: may move figures on many screens; run a full capture'
          : dataRecipes.length > config.broadShare * withShots.length
            ? `data change on ${[...slices].join(', ')}: read by most screens; run a full capture`
            : `data change on ${[...slices].join(', ')}: recapture the listed recipes`,
    }
  }

  // ---- beats -----------------------------------------------------------------
  const phrases = screenPhrases(provider.read(config.urlTable), triggers)
  const scenarioChange = new Set()
  const scChange = changes.find((c) => c.path === config.scenarios)
  const scenarioSrc = provider.read(config.scenarios) ?? ''
  const scenarioParse = parseScenarioBeats(scenarioSrc)
  // Primary source: each DEMO_SCENARIOS beat's deep link. Key `Sn#N` → why[].
  const scenarioHits = new Map()
  const overlaps = (ranges, a, b) => (ranges ?? []).some(([x, y]) => x <= b && y >= a)
  const changedHelpers = new Set(
    scChange ? scenarioParse.helpers.filter((h) => !scChange.ranges || overlaps(scChange.ranges, h.start, h.end)).map((h) => h.name) : [],
  )
  for (const sb of scenarioParse.beats) {
    const why = []
    const name = `${sb.scenario} ${sb.label}`
    if (scChange && (!scChange.ranges || overlaps(scChange.ranges, sb.start, sb.end))) why.push(`${name}: its DEMO_SCENARIOS entry changed`)
    for (const h of sb.helpers) if (changedHelpers.has(h) && scChange?.ranges) why.push(`${name}: its link helper ${h} changed`)
    const does = sb.does.toLowerCase()
    for (const t of report.triggers) if (t.label && does.includes(t.label.toLowerCase())) why.push(`${name} presses demo action "${t.label}" (${t.why})`)
    for (const u of sb.urls) {
      for (const target of u.startsWith('/mobile') ? ['framed', 'pwa'] : ['framed']) {
        const h = visitHit(target, u)
        if (h) {
          why.push(`${name} links ${u}${target === 'pwa' ? ' (PWA)' : ''} ← ${h.chain[0]}`)
          break
        }
      }
    }
    if (why.length) scenarioHits.set(`${sb.scenario}#${sb.n}`, { sb, why: [...new Set(why)] })
  }
  if (scChange) {
    const lines = scenarioSrc.split('\n')
    const marks = []
    lines.forEach((l, i) => {
      const m = /^\s*id:\s*'(S\d)'/.exec(l)
      if (m) marks.push({ id: m[1], line: i + 1 })
    })
    const inBeat = (a, b) => scenarioParse.beats.some((sb) => sb.start <= b && sb.end >= a)
    for (const [a, b] of scChange.ranges ?? []) {
      // a change inside a beat entry is that beat's (above); the rest of a scenario is its jump
      if (inBeat(a, b)) continue
      const before = marks.filter((mk) => mk.line <= a + 2).pop()
      const next = marks.find((mk) => mk.line > a + 2)
      if (before && (next || a < lines.length) && a - before.line < 60) scenarioChange.add(before.id)
    }
  }
  const usedScenarioHits = new Set()
  const affectedLabels = report.triggers.filter((t) => t.label).map((t) => ({ ...t, lower: t.label.toLowerCase() }))
  for (const gf of config.guide) {
    for (const b of parseBeats(gf, provider.read(gf), phrases)) {
      const why = []
      const beatNo = b.level === 3 && b.scenario ? /^Beat (\d+)\b/.exec(b.title)?.[1] : undefined
      const linked = beatNo ? scenarioHits.get(`${b.scenario}#${beatNo}`) : undefined
      if (linked) {
        why.push(...linked.why)
        usedScenarioHits.add(`${b.scenario}#${beatNo}`)
      }
      if (b.level === 2 && b.scenario && scenarioChange.has(b.scenario)) why.push(`scenario ${b.scenario} jump changed`)
      for (const u of b.urls) {
        for (const target of ['framed']) {
          const h = visitHit(target, u)
          if (h) why.push(`${u} ← ${h.chain[0]}`)
        }
      }
      for (const { phrase, url } of b.viaPhrase) {
        const h = visitHit('framed', url)
        if (h) why.push(`"${phrase}" (${url}) ← ${h.chain[0]}`)
      }
      const lower = b.text.toLowerCase()
      for (const t of affectedLabels) if (lower.includes(t.lower)) why.push(`demo action "${t.label}" (${t.why})`)
      if (why.length) {
        const strong = why.some((w) => !w.startsWith('"'))
        report.beats.push({ file: b.file, line: b.line, title: b.title, section: b.section, strength: strong ? 'link' : 'mention', why: [...new Set(why)] })
      }
    }
  }
  // a scenario beat the guide has no heading for is still reported, at its entry
  for (const [key, { sb, why }] of scenarioHits) {
    if (usedScenarioHits.has(key)) continue
    report.beats.push({ file: config.scenarios, line: sb.start, title: `Beat ${sb.n}: ${sb.beat}`, section: sb.scenarioTitle, strength: 'link', why })
  }

  // ---- totals and broadness ------------------------------------------------------
  const share = withShots.length ? hitRecipes.length / withShots.length : 0
  report.totals = { recipes: recipes.length, withShots: withShots.length, hit: hitRecipes.length, images: hitRecipes.reduce((n, r) => n + r.images.length, 0), share }
  if (report.appWide.length) {
    report.broad = true
    report.broadReason = `reaches the whole ${report.appWide.map((a) => (a.target === 'pwa' ? 'PWA' : 'framed prototype')).join(' and ')} (${report.appWide[0].chain.join(' → ')})`
  } else if (share > config.broadShare) {
    report.broad = true
    report.broadReason = `${hitRecipes.length} of ${withShots.length} recipes with shots (${Math.round(share * 100)}%)`
  }
  return report
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export function formatHuman(report, input) {
  const out = []
  const what =
    input.mode === 'files' ? 'named files' : input.mode === 'range' ? `${input.baseRev.slice(0, 10)}..${input.headRev}` : input.mode === 'base' ? `${input.baseRev.slice(0, 10)} to the working tree` : 'working tree vs HEAD'
  out.push(`affected-shots: ${report.changed.length} changed source file(s) under aa-prototype (${what})`)
  for (const c of report.changed) out.push(`  ${rel(c.file)}${c.data ? '  [data]' : ''}${c.symbols.length ? `  ${c.symbols.slice(0, 8).join(', ')}${c.symbols.length > 8 ? ', ...' : ''}` : ''}`)
  for (const d of report.deleted) out.push(`  ${rel(d)}  [deleted]`)
  if (report.ignored.length) out.push(`  (ignored: ${report.ignored.map((i) => `${rel(i.file)} [${i.why}]`).join(', ')})`)
  if (!report.changed.length) {
    out.push('', 'No prototype source changes: no recipes or beats affected.')
    return out.join('\n')
  }
  out.push('')
  if (report.broad) {
    out.push(`BROAD CHANGE: ${report.broadReason}.`)
    out.push(`Run a full capture instead of a list: \`npm run capture\` in requirements-board/ (${report.totals.hit} recipes, ${report.totals.images} images matched; --json lists them).`)
  } else {
    const routes = [...new Set(report.routes.map((r) => `${r.route}${r.target === 'pwa' ? ' (PWA)' : ''}`))]
    out.push(`Screens reached: ${routes.length ? routes.join(', ') : 'none by route'}`)
    out.push('')
    out.push(`Recipes: ${report.recipes.length} of ${report.totals.withShots} with shots, ${report.totals.images} image(s)`)
    for (const r of report.recipes) {
      out.push(`  ${r.id}${r.status === 'captured' ? '' : ` (${r.status})`}  ${r.images.join(', ')}`)
      for (const w of r.reasons.slice(0, 2)) out.push(`      ${w.kind}: ${w.detail}`)
    }
  }
  if (report.triggers.length) {
    out.push('')
    out.push(`Demo actions changed: ${report.triggers.map((t) => `${t.id} (${t.why})`).join('; ')}`)
  }
  if (report.data) {
    out.push('')
    out.push(`DATA CHANGE: ${report.data.advice}.`)
    if (report.data.reachesStore) out.push(`  reaches the store's construction: ${report.data.reachesStore}`)
    if (report.data.slices.length) out.push(`  slices named: ${report.data.slices.join(', ')}`)
    if (report.data.slices.length && !report.data.seedTouched) out.push(`  recipes whose screens read them: ${report.data.recipes.length}${report.data.recipes.length && report.data.recipes.length <= 40 ? ` (${report.data.recipes.join(', ')})` : ''}`)
  }
  out.push('')
  const beatLine = (b) => `  ${b.file}:${b.line}  ${b.section !== b.title ? `${b.section.split(' · ')[0]} · ` : ''}${b.title}\n      ${b.why.slice(0, 2).join('; ')}`
  const links = report.beats.filter((b) => b.strength === 'link')
  const mentions = report.beats.filter((b) => b.strength === 'mention')
  if (links.length) {
    out.push(`Demo guide beats to re-read (${links.length}: a URL, scenario jump or demo action in the beat):`)
    for (const b of links) out.push(beatLine(b))
  } else out.push('Demo guide: no beat links to an affected screen by URL, scenario or demo action.')
  if (mentions.length) {
    out.push(`Beats that name an affected screen (${mentions.length}; skim): ${mentions.map((b) => `${path.posix.basename(b.file)}:${b.line}`).join(', ')}`)
  }
  const ids = report.recipes.map((r) => r.id)
  if (ids.length && !report.broad) {
    out.push('')
    out.push(`Capture (from requirements-board/): node scripts/capture.ts --only ${ids.join(',')}`)
  }
  return out.join('\n')
}

const HELP = `Usage: node scripts/affected-shots.mjs [options] [files...]   (npm run affected -- ...)

Which catalogue capture recipes and demo-guide beats does a prototype change affect?

Input (default: the working tree vs HEAD, staged + unstaged + untracked, under aa-prototype/):
  --base <ref>        changes since <ref> (merge-base with HEAD) up to the working tree
  --base <a>..<b>     commit a to commit b; <a>...<b> uses their merge-base
  --head <ref>        with --base: the end commit (the source graph is read at that commit)
                      alone: that one commit (<ref>^..<ref>)
  files...            explicit paths (from aa-prototype/ or the repo root), whole files

Output:
  (default)           human-readable report
  --json              the full report as JSON
  --ids               a comma list of recipe IDs for \`node scripts/capture.ts --only\`
                      (a broad change still prints them, with a warning on stderr; exit code 0)

Blind spots: screens reached only by clicks are matched through their data-shot/data-testid
hooks only; a route wrapper that switches screens on a URL param or local state counts every view;
seed and store changes are reported as a data change (full capture advised) rather than per screen.`

function parseArgs(argv) {
  const opts = { files: [], json: false, ids: false, base: null, head: null, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') opts.json = true
    else if (a === '--ids') opts.ids = true
    else if (a === '--base') opts.base = argv[++i]
    else if (a.startsWith('--base=')) opts.base = a.slice(7)
    else if (a === '--head') opts.head = argv[++i]
    else if (a.startsWith('--head=')) opts.head = a.slice(7)
    else if (a === '-h' || a === '--help') opts.help = true
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`)
    else opts.files.push(a)
  }
  return opts
}

export function run(argv, { cwd = process.cwd() } = {}) {
  const opts = parseArgs(argv)
  if (opts.help) return { text: HELP, code: 0 }
  const root = git(cwd, ['rev-parse', '--show-toplevel']).trim()
  // explicit file paths are taken relative to the cwd when they exist there
  opts.files = opts.files.map((f) => {
    const abs = path.resolve(cwd, f)
    return existsSync(abs) ? path.relative(root, abs).split(path.sep).join('/') : f
  })
  const input = collectChanges(root, opts)
  const provider = input.headRev
    ? gitProvider(root, input.headRev, [DEFAULT_CONFIG.proto, DEFAULT_CONFIG.recipes, 'docs/demo-guide'])
    : fsProvider(root)
  const report = analyse({ provider, changes: input.changes })
  report.input = { mode: input.mode, baseRev: input.baseRev, headRev: input.headRev }
  if (opts.json) return { text: JSON.stringify(report, null, 2), code: 0 }
  if (opts.ids) {
    const warn = report.broad ? `affected-shots: broad change (${report.broadReason}); a full capture is advised` : ''
    return { text: report.recipes.map((r) => r.id).join(','), warn, code: 0 }
  }
  return { text: formatHuman(report, input), code: 0 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { text, warn, code } = run(process.argv.slice(2))
    if (warn) process.stderr.write(warn + '\n')
    process.stdout.write(text + '\n')
    process.exitCode = code
  } catch (err) {
    process.stderr.write(`affected-shots: ${err.message}\n`)
    process.exitCode = 1
  }
}

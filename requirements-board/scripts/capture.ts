/**
 * Take screenshots of the aa-prototype from recipes and link them to the catalogue.
 *
 *   npm run capture                              every recipe, then capture/REPORT.md
 *   node scripts/capture.ts --only US-03.2.4,EP-03   those items (an epic or feature takes its descendants)
 *   node scripts/capture.ts --only US-03.2.4 --dry   run every step and selector, write nothing
 *
 * One recipe per item: capture/recipes/<ID>.json (format in capture/ATLAS.md). Every state
 * gets a fresh browser context, so the seed and demo clock are identical each time. Web, admin
 * and simulator shots come from the framed prototype on :5173 with its harness bar hidden;
 * mobile shots come from the PWA dev server on :5174 at phone size. Files are written to
 * catalogue/assets/<ID>/<app>-<name>[-<state>].png and listed in the item's `images`; images
 * the runner did not generate are kept. A step or highlight selector that matches nothing
 * fails the recipe: it never writes a silently wrong shot.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { CATALOGUE_DIR, itemPath, loadCatalogue, readItemFile, writeItem } from '../server/catalogueFs.ts'
import { serialiseItem } from '../shared/files.ts'
import { compareIds } from '../shared/ids.ts'
import { IMAGE_APPS, type ImageApp, type ImageRef, type Item } from '../shared/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const CAPTURE_DIR = resolve(here, '../capture')
const RECIPES_DIR = join(CAPTURE_DIR, 'recipes')
const REPORT_PATH = join(CAPTURE_DIR, 'REPORT.md')

const PROTOTYPE = 'http://localhost:5173'
const PWA = 'http://localhost:5174'
/**
 * Hides the prototype's demo harness bar (the first child of the AppShell), so the app fills
 * the window as it would in production. Hiding beats clipping: fixed overlays such as the
 * admin list drawer are pinned to top:0 and would lose their header under a clip.
 */
const HIDE_HARNESS = '#root > div > header:first-child { display: none !important; }'
const DESKTOP = { width: 1440, height: 900, dpr: 2 }
const MOBILE = { width: 390, height: 844, dpr: 3 }
const ACTION_TIMEOUT = 6000
const SETTLE_MS = 500
const WORKERS = 4

const HIGHLIGHT = { pad: 8, colour: '#E0243A', width: 3, radius: 12 }

// ── Recipe types ─────────────────────────────────────────────────────────────

type Step =
  | { click: string; force?: boolean }
  | { dblclick: string }
  | { fill: string; value: string }
  | { press: string; on?: string }
  | { hover: string }
  | { select: string; value: string }
  | { wait: number | string }
  | { scroll: string; by?: number }
  | { goto: string }
  | { scenario: string }

interface State {
  state?: string
  /** Caption for this state's image; defaults to the shot caption plus the state name. */
  caption?: string
  steps?: Step[]
  highlight?: string[]
}

interface Shot {
  name: string
  app: ImageApp
  caption: string
  start: string
  setup?: Step[]
  states: State[]
}

interface Recipe {
  id: string
  status: 'captured' | 'partial' | 'absent'
  absentReason?: string
  shots?: Shot[]
}

interface Job {
  recipe: Recipe
  shot: Shot
  state: State
  file: string // catalogue-relative, e.g. assets/US-01.1.1/web-dashboard.png
}

// ── Args ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const flag = (name: string) => argv.includes(name)
const opt = (name: string) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const DRY = flag('--dry')
const only = opt('--only')
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const fullRun = !only

// ── Recipes ──────────────────────────────────────────────────────────────────

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DASHES = /[–—]/
const GENERATED = new RegExp(`^(?:${IMAGE_APPS.join('|')})-[a-z0-9-]+\\.png$`)

function validate(r: Recipe, fileId: string): string[] {
  const out: string[] = []
  if (r.id !== fileId) out.push(`recipe file ${fileId}.json holds id ${r.id}`)
  if (!['captured', 'partial', 'absent'].includes(r.status)) out.push(`status "${r.status}" is not captured, partial or absent`)
  if ((r.status === 'absent' || r.status === 'partial') && !r.absentReason?.trim()) out.push(`status ${r.status} needs an absentReason`)
  if (r.status === 'absent' && r.shots?.length) out.push('an absent recipe has no shots')
  if (r.status !== 'absent' && !r.shots?.length) out.push(`status ${r.status} needs at least one shot`)
  const files = new Set<string>()
  for (const s of r.shots ?? []) {
    const where = `shot "${s.name}"`
    if (!SLUG.test(s.name ?? '')) out.push(`${where}: name must be a kebab-case slug`)
    if (!IMAGE_APPS.includes(s.app)) out.push(`${where}: app "${s.app}" is not one of ${IMAGE_APPS.join(', ')}`)
    if (!s.caption?.trim()) out.push(`${where}: caption is empty`)
    if (DASHES.test(s.caption ?? '')) out.push(`${where}: caption has an en or em dash`)
    if (!s.start?.startsWith('/')) out.push(`${where}: start must be a path starting with /`)
    if (!s.states?.length) out.push(`${where}: needs at least one state`)
    for (const st of s.states ?? []) {
      if (st.state !== undefined && !SLUG.test(st.state)) out.push(`${where}: state "${st.state}" must be a kebab-case slug`)
      if (DASHES.test(st.caption ?? '')) out.push(`${where}: state caption has an en or em dash`)
      if (s.states.length > 1 && !st.state) out.push(`${where}: every state needs a name when there are several`)
      const f = fileFor(r.id, s, st)
      if (files.has(f)) out.push(`${where}: two states write ${f}`)
      files.add(f)
    }
  }
  return out
}

const fileFor = (id: string, s: Shot, st: State) => `assets/${id}/${s.app}-${s.name}${st.state ? `-${st.state}` : ''}.png`

function readRecipes(): { recipes: Map<string, Recipe>; broken: Map<string, string[]> } {
  const recipes = new Map<string, Recipe>()
  const broken = new Map<string, string[]>()
  if (!existsSync(RECIPES_DIR)) return { recipes, broken }
  for (const f of readdirSync(RECIPES_DIR).filter((f) => f.endsWith('.json'))) {
    const id = f.replace(/\.json$/, '')
    try {
      const r = JSON.parse(readFileSync(join(RECIPES_DIR, f), 'utf8')) as Recipe
      const problems = validate(r, id)
      if (problems.length) broken.set(id, problems)
      else recipes.set(id, r)
    } catch (e) {
      broken.set(id, [`not valid JSON: ${(e as Error).message}`])
    }
  }
  return { recipes, broken }
}

// ── Browser ──────────────────────────────────────────────────────────────────

async function serverUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

async function newContext(browser: Browser, app: ImageApp): Promise<BrowserContext> {
  const mobile = app === 'mobile'
  const v = mobile ? MOBILE : DESKTOP
  const ctx = await browser.newContext({
    baseURL: mobile ? PWA : PROTOTYPE,
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.dpr,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: 'reduce',
    locale: 'en-NZ',
    timezoneId: 'Pacific/Auckland',
    serviceWorkers: 'block',
  })
  ctx.setDefaultTimeout(ACTION_TIMEOUT)
  if (!mobile) {
    await ctx.addInitScript((css) => {
      const d = (globalThis as any).document
      const add = () => {
        const el = d.createElement('style')
        el.textContent = css
        d.head.appendChild(el)
      }
      if (d.head) add()
      else d.addEventListener('DOMContentLoaded', add)
    }, HIDE_HARNESS)
  }
  return ctx
}

/** Navigate inside the running app (no reload), so state a setup step created is kept. */
async function softGoto(page: Page, path: string) {
  await page.evaluate((p) => {
    const w = globalThis as any
    w.history.pushState({}, '', p)
    w.dispatchEvent(new w.PopStateEvent('popstate'))
  }, path)
}

async function settle(page: Page, ms = SETTLE_MS) {
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await page.evaluate(() => (globalThis as any).document.fonts.ready)
  await page.waitForTimeout(ms)
}

/** Fails loudly when a selector matches nothing visible. */
async function mustFind(page: Page, selector: string, what: string) {
  const loc = page.locator(selector).first()
  try {
    await loc.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT })
  } catch {
    const n = await page.locator(selector).count()
    throw new Error(`${what}: selector ${selector} ${n ? `matched ${n} element(s) but none became visible` : 'matched nothing'} (at ${page.url()})`)
  }
  return loc
}

async function runStep(page: Page, step: Step, i: number) {
  const what = `step ${i + 1} ${JSON.stringify(step)}`
  if ('goto' in step) {
    await page.goto(step.goto)
    await settle(page, 200)
  } else if ('scenario' in step) {
    await runScenario(page, step.scenario, what)
  } else if ('click' in step) {
    await (await mustFind(page, step.click, what)).click({ force: step.force })
  } else if ('dblclick' in step) {
    await (await mustFind(page, step.dblclick, what)).dblclick()
  } else if ('fill' in step) {
    await (await mustFind(page, step.fill, what)).fill(step.value)
  } else if ('press' in step) {
    if (step.on) await (await mustFind(page, step.on, what)).press(step.press)
    else await page.keyboard.press(step.press)
  } else if ('hover' in step) {
    await (await mustFind(page, step.hover, what)).hover()
  } else if ('select' in step) {
    await (await mustFind(page, step.select, what)).selectOption(step.value)
  } else if ('wait' in step) {
    if (typeof step.wait === 'number') await page.waitForTimeout(step.wait)
    else await mustFind(page, step.wait, what)
  } else if ('scroll' in step) {
    const loc = await mustFind(page, step.scroll, what)
    if (step.by) await loc.evaluate((el, by) => (el as any).scrollBy(0, by), step.by)
    else await loc.scrollIntoViewIfNeeded()
  } else {
    throw new Error(`${what}: unknown step`)
  }
}

/** Jump to a demo scenario (S1 to S5) from the demo control panel on :5173. */
async function runScenario(page: Page, id: string, what: string) {
  if (!page.url().startsWith(PROTOTYPE)) throw new Error(`${what}: scenario jumps live on the framed prototype (:5173) and cannot set up a mobile (:5174) shot`)
  await page.goto('/demo/control')
  await settle(page, 200)
  const btn = page.locator(`[data-shot="scenario-${id.toLowerCase()}"]`)
  if (!(await btn.count())) throw new Error(`${what}: no scenario button [data-shot=scenario-${id.toLowerCase()}] on /demo/control`)
  await btn.first().click()
  await page.locator('[data-shot="scenario-confirm"]').first().click()
  await settle(page, 300)
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

async function highlightBox(page: Page, selectors: string[]): Promise<Box | null> {
  if (!selectors.length) return null
  const boxes: Box[] = []
  for (const sel of selectors) {
    const first = await mustFind(page, sel, `highlight ${sel}`)
    await first.scrollIntoViewIfNeeded().catch(() => undefined)
  }
  await page.waitForTimeout(150)
  for (const sel of selectors) {
    for (const loc of await page.locator(sel).all()) {
      if (!(await loc.isVisible())) continue
      const b = await loc.boundingBox()
      if (b && b.width > 0 && b.height > 0) boxes.push(b)
    }
  }
  if (!boxes.length) throw new Error(`highlight ${selectors.join(', ')}: nothing visible with a size`)
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  }
}

/** Draw the red box into the page itself, so the shot needs no editing afterwards. */
async function drawHighlight(page: Page, box: Box) {
  const vp = page.viewportSize()!
  const { pad, colour, width, radius } = HIGHLIGHT
  const inset = width + 1
  const x1 = Math.max(inset, box.x - pad)
  const y1 = Math.max(inset, box.y - pad)
  const x2 = Math.min(vp.width - inset, box.x + box.width + pad)
  const y2 = Math.min(vp.height - inset, box.y + box.height + pad)
  if (x2 - x1 < 8 || y2 - y1 < 8) throw new Error('highlight: the element is outside the visible screen')
  await page.evaluate(
    ({ x1, y1, x2, y2, colour, width, radius }) => {
      const d = (globalThis as any).document
      const el = d.createElement('div')
      el.setAttribute('data-capture-highlight', '')
      Object.assign(el.style, {
        position: 'fixed',
        left: `${x1 - width}px`,
        top: `${y1 - width}px`,
        width: `${x2 - x1 + 2 * width}px`,
        height: `${y2 - y1 + 2 * width}px`,
        boxSizing: 'border-box',
        border: `${width}px solid ${colour}`,
        borderRadius: `${radius}px`,
        boxShadow: `0 0 0 3px rgba(224,36,58,0.18), 0 0 18px 2px rgba(224,36,58,0.35)`,
        pointerEvents: 'none',
        zIndex: '2147483647',
      })
      d.body.appendChild(el)
    },
    { x1, y1, x2, y2, colour, width, radius },
  )
}

async function capture(browser: Browser, job: Job): Promise<Buffer> {
  const { shot, state } = job
  const ctx = await newContext(browser, shot.app)
  const page = await ctx.newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  try {
    if (shot.setup?.length) {
      await page.goto(shot.app === 'mobile' ? '/mobile/lists' : '/')
      await settle(page, 200)
      for (const [i, s] of shot.setup.entries()) await runStep(page, s, i)
      await softGoto(page, shot.start)
    } else {
      await page.goto(shot.start)
    }
    await settle(page)
    for (const [i, s] of (state.steps ?? []).entries()) await runStep(page, s, i)
    await settle(page)
    const box = await highlightBox(page, state.highlight ?? [])
    if (box) await drawHighlight(page, box)
    if (errors.length) throw new Error(`page error: ${errors[0]}`)
    // Wait for a stable frame: two identical screenshots in a row (a late scroll or tween settles).
    let prev = await page.screenshot({ animations: 'disabled', caret: 'hide' })
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(250)
      const next = await page.screenshot({ animations: 'disabled', caret: 'hide' })
      if (next.equals(prev)) return next
      prev = next
    }
    return prev
  } finally {
    await ctx.close()
  }
}

// ── Catalogue linking ────────────────────────────────────────────────────────

const isGenerated = (id: string, src: string) => src.startsWith(`assets/${id}/`) && GENERATED.test(src.slice(`assets/${id}/`.length))

function imagesFor(recipe: Recipe): ImageRef[] {
  return (recipe.shots ?? []).flatMap((s) =>
    s.states.map((st) => {
      const img: ImageRef = { src: fileFor(recipe.id, s, st), viewport: s.app === 'mobile' ? 'mobile' : 'desktop', app: s.app }
      img.caption = st.caption ?? (st.state && s.states.length > 1 ? `${s.caption} · ${st.state.replace(/-/g, ' ')}` : s.caption)
      return img
    }),
  )
}

/** Replace only this item's generated images, keep hand-added ones, and write only if the text changed. */
function linkItem(recipe: Recipe): boolean {
  const loaded = readItemFile(itemPath(recipe.id))
  if (!loaded.record) throw new Error(`catalogue item ${recipe.id} could not be read: ${loaded.error}`)
  const item: Item = loaded.record.data
  const kept = item.images.filter((i) => !isGenerated(recipe.id, i.src))
  const next: Item = { ...item, images: [...kept, ...imagesFor(recipe)] }
  const before = readFileSync(itemPath(recipe.id), 'utf8')
  if (serialiseItem(next) === before) return false
  writeItem(next)
  return true
}

/** Delete generated files for this item that the recipe no longer produces. */
function pruneAssets(recipe: Recipe): string[] {
  const dir = join(CATALOGUE_DIR, 'assets', recipe.id)
  if (!existsSync(dir)) return []
  const wanted = new Set(imagesFor(recipe).map((i) => i.src.split('/').pop()))
  const removed: string[] = []
  for (const f of readdirSync(dir)) {
    if (GENERATED.test(f) && !wanted.has(f)) {
      unlinkSync(join(dir, f))
      removed.push(f)
    }
  }
  return removed
}

// ── Report ───────────────────────────────────────────────────────────────────

function writeReport(items: Item[], recipes: Map<string, Recipe>, broken: Map<string, string[]>, failed: Map<string, string>) {
  const inScope = items.filter((i) => i.type === 'story' || (i.type === 'feature' && !items.some((c) => c.parent === i.id)))
  const title = (id: string) => items.find((i) => i.id === id)?.title ?? ''
  const line = (id: string, extra = '') => `- **${id}** ${title(id)}${extra ? ` · ${extra}` : ''}`
  const by = (st: Recipe['status']) => [...recipes.values()].filter((r) => r.status === st && !failed.has(r.id)).sort((a, b) => compareIds(a.id, b.id))
  const captured = by('captured')
  const partial = by('partial')
  const absent = by('absent')
  const missing = inScope.filter((i) => !recipes.has(i.id) && !broken.has(i.id)).map((i) => i.id)
  const appCount = new Map<string, number>()
  for (const r of recipes.values()) {
    if (failed.has(r.id)) continue
    for (const app of new Set((r.shots ?? []).map((s) => s.app))) appCount.set(app, (appCount.get(app) ?? 0) + 1)
  }
  const shots = [...recipes.values()].filter((r) => !failed.has(r.id)).reduce((n, r) => n + imagesFor(r).length, 0)
  const stories = items.filter((i) => i.type === 'story')
  const storyIds = new Set(stories.map((s) => s.id))
  const storyCount = (list: { id: string }[]) => list.filter((r) => storyIds.has(r.id)).length

  const out = [
    '# Prototype screenshot report',
    '',
    'Written by `npm run capture` (requirements-board/scripts/capture.ts) on a full run. Do not edit by hand.',
    '',
    `Scope: every story plus every feature with no stories (${inScope.length} items, ${stories.length} stories). Features with stories are captured only when they have an overview screen.`,
    '',
    '| | Items | Stories |',
    '|---|---:|---:|',
    `| Captured | ${captured.length} | ${storyCount(captured)} |`,
    `| Partial | ${partial.length} | ${storyCount(partial)} |`,
    `| Absent from the prototype | ${absent.length} | ${storyCount(absent)} |`,
    `| Failed recipe | ${failed.size + broken.size} | ${storyCount([...failed.keys(), ...broken.keys()].map((id) => ({ id })))} |`,
    `| No recipe | ${missing.length} | ${storyCount(missing.map((id) => ({ id })))} |`,
    '',
    `${shots} screenshots. Items per app: ${IMAGE_APPS.map((a) => `${a} ${appCount.get(a) ?? 0}`).join(', ')}.`,
    '',
  ]
  const section = (heading: string, lines: string[]) => {
    out.push(`## ${heading} (${lines.length})`, '')
    out.push(...(lines.length ? lines : ['None.']), '')
  }
  section('Failed recipes', [
    ...[...broken].sort(([a], [b]) => compareIds(a, b)).map(([id, p]) => line(id, p.join('; '))),
    ...[...failed].sort(([a], [b]) => compareIds(a, b)).map(([id, e]) => line(id, e)),
  ])
  section('Absent from the prototype', absent.map((r) => line(r.id, r.absentReason)))
  section('Partial', partial.map((r) => line(r.id, r.absentReason)))
  section('No recipe', missing.sort(compareIds).map((id) => line(id)))
  section(
    'Captured',
    captured.map((r) => line(r.id, [...new Set((r.shots ?? []).map((s) => s.app))].join(', '))),
  )
  writeFileSync(REPORT_PATH, out.join('\n'))
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const catalogue = loadCatalogue()
  const items = Object.values(catalogue.items).map((r) => r.data)
  const byId = new Map(items.map((i) => [i.id, i]))
  const { recipes, broken } = readRecipes()

  let scope: Set<string>
  if (only) {
    scope = new Set<string>()
    const add = (id: string) => {
      scope.add(id)
      for (const c of items) if (c.parent === id) add(c.id)
    }
    for (const id of only) {
      if (!byId.has(id)) throw new Error(`--only ${id}: no such catalogue item`)
      add(id)
    }
  } else {
    scope = new Set(items.map((i) => i.id))
  }

  for (const [id, problems] of broken) if (scope.has(id)) console.error(`✗ ${id} recipe is invalid:\n    ${problems.join('\n    ')}`)
  for (const id of recipes.keys()) if (!byId.has(id)) console.error(`✗ ${id}.json: no catalogue item with that ID`)
  const selected = [...recipes.values()].filter((r) => scope.has(r.id) && byId.has(r.id)).sort((a, b) => compareIds(a.id, b.id))
  if (only && !selected.length && ![...broken.keys()].some((id) => scope.has(id))) {
    console.error(`No recipes for ${only.join(', ')} in capture/recipes/.`)
    process.exit(1)
  }

  const jobs: Job[] = selected.flatMap((recipe) => (recipe.shots ?? []).flatMap((shot) => shot.states.map((state) => ({ recipe, shot, state, file: fileFor(recipe.id, shot, state) }))))
  const needs = new Set(jobs.map((j) => (j.shot.app === 'mobile' ? PWA : PROTOTYPE)))
  const down: string[] = []
  for (const url of needs) if (!(await serverUp(url))) down.push(url)
  if (down.length) {
    console.error(`Dev server not running: ${down.join(', ')}.`)
    console.error('Start the prototype with `npm run dev` at the repo root (5173) and the PWA with `npm --prefix aa-prototype run dev:pwa` (5174).')
    process.exit(2)
  }

  const browser = await chromium.launch()
  const shots = new Map<string, Buffer>()
  const failed = new Map<string, string>()
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]!
      if (failed.has(job.recipe.id)) continue
      try {
        shots.set(job.file, await capture(browser, job))
        console.log(`  ✓ ${job.file}`)
      } catch (e) {
        const msg = `${job.shot.app}-${job.shot.name}${job.state.state ? `-${job.state.state}` : ''}: ${(e as Error).message.split('\n')[0]}`
        failed.set(job.recipe.id, msg)
        console.error(`  ✗ ${job.recipe.id} ${msg}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, worker))
  await browser.close()

  let written = 0
  let linked = 0
  const pruned: string[] = []
  for (const recipe of selected) {
    if (failed.has(recipe.id)) continue
    if (!DRY) {
      for (const img of imagesFor(recipe)) {
        const abs = join(CATALOGUE_DIR, img.src)
        const buf = shots.get(img.src)!
        mkdirSync(dirname(abs), { recursive: true })
        if (!existsSync(abs) || !readFileSync(abs).equals(buf)) {
          writeFileSync(abs, buf)
          written++
        }
      }
      pruned.push(...pruneAssets(recipe).map((f) => `${recipe.id}/${f}`))
      if (linkItem(recipe)) linked++
    }
  }

  const ok = selected.length - failed.size
  console.log(`\n${DRY ? '[dry run] ' : ''}${ok}/${selected.length} recipe(s) OK, ${jobs.length} shot(s); ${written} PNG(s) changed, ${linked} item file(s) updated${pruned.length ? `, removed ${pruned.join(', ')}` : ''}.`)

  if (!DRY) {
    const after = loadCatalogue()
    const errors = after.issues.filter((i) => i.severity === 'error')
    const mine = errors.filter((i) => scope.has(i.id))
    for (const i of mine) console.error(`catalogue ERROR ${i.id}: ${i.message}`)
    if (errors.length > mine.length) console.error(`(${errors.length - mine.length} other catalogue error(s) outside this run; see npm run check)`)
    if (fullRun) {
      writeReport(Object.values(after.items).map((r) => r.data), recipes, broken, failed)
      console.log(`Report: ${REPORT_PATH}`)
    }
  }
  const brokenInScope = [...broken.keys()].filter((id) => scope.has(id)).length
  process.exit(failed.size || brokenInScope ? 1 : 0)
}

await main()

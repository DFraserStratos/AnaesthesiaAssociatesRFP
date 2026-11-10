/**
 * Screenshot a stepped diagram from the running board, one picture per step, to check each step
 * by eye: the whole drawing first, then every step in order, at a laptop viewport (1600x1000).
 *
 *   npm run artifact:steps -- AR-nn [--out <dir>] [--url <base>]
 *
 * Writes `00-whole.png`, `01-<step-id>.png`, `02-<step-id>.png` ... into --out (default: a folder
 * under the OS temp dir, printed at the end), replacing earlier shots of this kind there. The steps
 * are read from the artifact's sidecar in the requirements folder (`REQUIREMENTS_DIR`, as the other
 * scripts read it), so the board at --url (default http://localhost:5180) must be serving the same
 * catalogue. Each shot opens `/#/artifacts/AR-nn?region=<step-id>` and waits for the fonts and the
 * step's transition to settle; motion is reduced, so no shot catches a fade halfway. An artifact
 * with no steps gets the whole-drawing shot only.
 */
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium, type Browser, type Page } from '@playwright/test'
import { ID_PATTERNS } from '../shared/check.ts'
import { REQUIREMENTS_DIR, artifactSidecarPath, readArtifactFile } from '../server/catalogueFs.ts'

const argv = process.argv.slice(2)
const opt = (name: string) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const id = argv.find((a, i) => !a.startsWith('--') && !['--out', '--url'].includes(argv[i - 1] ?? ''))
if (!id || argv.includes('--help')) fail('Usage: npm run artifact:steps -- AR-nn [--out <dir>] [--url <base>]', !id ? 1 : 0)
if (!ID_PATTERNS.artifact.test(id)) fail(`${id} is not an artifact ID (AR-nn).`)

const base = (opt('--url') ?? 'http://localhost:5180').replace(/\/+$/, '')
const out = resolve(opt('--out') ?? join(tmpdir(), 'artifact-steps', id))

const read = readArtifactFile(artifactSidecarPath(id))
if (read.missing) fail(`There is no ${id} in ${REQUIREMENTS_DIR}.`)
if (!read.record) fail(`${id} does not read: ${read.error}`)
const steps = read.record.data.steps
const drawing = /\.svg$/i.test(read.record.data.file ?? '')

if (!(await answers(base))) fail(`The board is not answering at ${base}: start it (npm run dev:board from the repo root, or npm --prefix requirements-board run dev) and run this again.`)

if (!steps.length) console.log(`${id} has no steps, so only the whole drawing is shot.`)

mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (/^\d{2,}-.+\.png$/.test(f)) rmSync(join(out, f))

const width = Math.max(2, String(steps.length).length)
const shots: { file: string; region: string | null }[] = [
  { file: `${'0'.padStart(width, '0')}-whole.png`, region: null },
  ...steps.map((s, i) => ({ file: `${String(i + 1).padStart(width, '0')}-${s.id}.png`, region: s.id })),
]

let browser: Browser
try {
  browser = await chromium.launch()
} catch (e) {
  fail(`Could not start Playwright's browser (${(e as Error).message.split('\n')[0]}). Install it with: npx --prefix requirements-board playwright install chromium`)
}
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' })
const page = await context.newPage()
let failed = 0
try {
  for (const shot of shots) {
    const url = `${base}/#/artifacts/${id}${shot.region ? `?region=${encodeURIComponent(shot.region)}` : ''}`
    try {
      await page.goto(url)
      await settle(page)
      await page.screenshot({ path: join(out, shot.file) })
      console.log(`  ✓ ${shot.file}`)
    } catch (e) {
      failed++
      console.error(`  ✗ ${shot.file}: ${(e as Error).message.split('\n')[0]}`)
    }
  }
} finally {
  await browser.close()
}

console.log(`${shots.length - failed} of ${shots.length} shot(s) of ${id} in ${out}`)
if (failed) process.exit(1)

/** Wait until the page shows the drawing as it will stay: drawn, fonts in, nothing animating. */
async function settle(p: Page) {
  const notShown = () => {
    throw new Error(`the board showed no ${drawing ? 'drawing' : 'file'} for ${id}; is it serving the catalogue in ${REQUIREMENTS_DIR}?`)
  }
  await p.locator('.artifact-viewer').waitFor({ state: 'attached', timeout: 15_000 }).catch(notShown)
  // Playwright's CSS locators reach into the open shadow root the board draws an SVG in.
  if (drawing) await p.locator('.canvas-host svg').waitFor({ state: 'attached', timeout: 15_000 }).catch(notShown)
  // "Drawing", "Opening the document": the viewer's loading notes; a bad one says what went wrong.
  await p.waitForFunction(() => !document.querySelector('.artifact-viewer .viewer-note:not(.bad)'), undefined, { timeout: 15_000 })
  const bad = await p.locator('.artifact-viewer .viewer-note.bad').first().textContent({ timeout: 100 }).catch(() => null)
  if (bad) throw new Error(bad)
  await p.evaluate(() => document.fonts.ready.then(() => undefined))
  await p.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), undefined, { timeout: 10_000 })
  // Two frames for the last effect (the step state is applied after the drawing mounts), then a beat.
  await p.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))))
  await p.waitForTimeout(300)
}

async function answers(url: string): Promise<boolean> {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok
  } catch {
    return false
  }
}

function fail(message: string, code = 1): never {
  ;(code ? console.error : console.log)(message)
  process.exit(code)
}

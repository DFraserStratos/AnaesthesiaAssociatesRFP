/**
 * Export the board as a clean, shareable kit: the board's code and agent skills, the starter
 * catalogue in place of this project's requirements, each skill's "This repo" section swapped for
 * its starter version, and `START-HERE.html`. It is one folder, `requirements-board/`: whoever
 * receives it opens START-HERE.html (a static page, no server needed), drops the folder into a repo
 * and follows it. The kit is built
 * in a scratch folder and checked for this project's words (`starter/deny.txt`) before anything in
 * the target changes. Run it again after any change to the board; bump the version first.
 *   npm run kit:export -- --to "<folder>" [--dry-run]
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const BOARD = 'requirements-board'
const boardDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const starter = join(boardDir, 'starter')
const argv = process.argv.slice(2)
const toArg = argv[argv.indexOf('--to') + 1]
const dryRun = argv.includes('--dry-run')
if (!argv.includes('--to') || !toArg) fail('Pass --to "<folder>"')
const target = resolve(toArg)

/** Left out of the kit: generated or local folders, this project's data, and the export's own tooling. */
const SKIP_TOP = new Set(['node_modules', 'dist', '.history', '.links', 'test-results', 'playwright-report', 'shots', 'requirements', 'starter', '.DS_Store'])
const SKIP_PATHS = new Set([
  'e2e/artifacts-real.spec.ts',
  'scripts/export-kit.ts',
  'tests/starter.test.ts',
  'agent/skills/svg-diagram/examples/procedure-and-contract-selection.py',
  'agent/skills/svg-diagram/examples/how-a-procedure-is-priced.py',
])
/** Shared format files that come from this project's catalogue: kept project-neutral. */
const SHARED_REQ = ['SCHEMA.md', 'notes/README.md', 'changes/README.md']
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.woff', '.woff2', '.ico', '.zip'])

const pkg = JSON.parse(readFileSync(join(boardDir, 'package.json'), 'utf8')) as { version: string; scripts: Record<string, string> }
const version = pkg.version

// 1. Build the kit in a scratch folder.
const stage = mkdtempSync(join(tmpdir(), 'board-kit-'))
const kitBoard = join(stage, BOARD)
cpSync(boardDir, kitBoard, {
  recursive: true,
  verbatimSymlinks: true,
  filter: (src) => {
    const rel = relative(boardDir, src).split(sep).join('/')
    if (!rel) return true
    if (SKIP_TOP.has(rel.split('/')[0]!) || SKIP_PATHS.has(rel)) return false
    return !rel.endsWith('/.DS_Store') && !rel.startsWith('.DS_Store')
  },
})
cpSync(join(starter, 'requirements'), join(kitBoard, 'requirements'), { recursive: true })
for (const f of SHARED_REQ) {
  mkdirSync(dirname(join(kitBoard, 'requirements', f)), { recursive: true })
  cpSync(join(boardDir, 'requirements', f), join(kitBoard, 'requirements', f))
}

// The kit's package.json has no export script (the kit has no starter folder to export from).
const kitPkgPath = join(kitBoard, 'package.json')
const kitPkg = JSON.parse(readFileSync(kitPkgPath, 'utf8')) as { scripts: Record<string, string> }
delete kitPkg.scripts['kit:export']
writeFileSync(kitPkgPath, JSON.stringify(kitPkg, null, 2) + '\n')

// 2. Swap each skill's "This repo" section for its starter version.
const problems: string[] = []
const skillsDir = join(kitBoard, 'agent', 'skills')
for (const skill of readdirSync(skillsDir)) {
  const file = join(skillsDir, skill, 'SKILL.md')
  if (!existsSync(file)) continue
  const text = readFileSync(file, 'utf8')
  const start = text.search(/^## This repo\s*$/m)
  if (start < 0) continue
  const block = join(starter, 'this-repo', `${skill}.md`)
  if (!existsSync(block)) {
    problems.push(`${skill}: has a "This repo" section but no starter/this-repo/${skill}.md`)
    continue
  }
  const rest = text.slice(start + 1).search(/^## /m)
  const end = rest < 0 ? text.length : start + 1 + rest
  writeFileSync(file, text.slice(0, start) + readFileSync(block, 'utf8').trimEnd() + '\n\n' + text.slice(end))
}

// 3. The start-here page, with the loop diagram drawn in.
const loop = readFileSync(join(starter, 'requirements', 'artifacts', 'files', 'AR-01.svg'), 'utf8').replace(/^<\?xml[^>]*>\s*/, '')
writeFileSync(join(kitBoard, 'START-HERE.html'), readFileSync(join(starter, 'START-HERE.html'), 'utf8').replaceAll('{{version}}', version).replace('{{loop-svg}}', () => loop))

// 4. Nothing of this project may ship.
const deny = readFileSync(join(starter, 'deny.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => (l.startsWith('=') ? new RegExp(l.slice(1)) : new RegExp(l, 'i')))
for (const file of walk(stage)) {
  if (BINARY.has(extname(file).toLowerCase())) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, n) => {
    for (const re of deny) if (re.test(line)) problems.push(`${relative(stage, file)}:${n + 1} matches ${re}: ${line.trim().slice(0, 100)}`)
  })
}

const changelog = readFileSync(join(boardDir, 'CHANGELOG.md'), 'utf8')
if (!changelog.includes(`## ${version}`)) console.warn(`warn: CHANGELOG.md has no entry for ${version}; bump the version and add one`)

if (problems.length) {
  for (const p of problems) console.error(`ERROR  ${p}`)
  console.error(`${problems.length} problem(s); nothing exported. The staged kit is in ${stage}`)
  process.exit(1)
}

console.log(`Kit ${version} staged in ${stage}: ${walk(stage).length} files`)
if (dryRun) process.exit(0)

// 5. Replace the board and its links in the target; anything else there is left alone.
if (existsSync(target) && readdirSync(target).filter((f) => f !== '.DS_Store').length && !existsSync(join(target, BOARD)))
  fail(`${target} has other files and no ${BOARD}/: export into an empty folder, or one that holds an earlier kit`)
mkdirSync(target, { recursive: true })
// An installed node_modules stays, so a re-export needs no fresh install.
mkdirSync(join(target, BOARD), { recursive: true })
for (const f of readdirSync(join(target, BOARD))) if (f !== 'node_modules') rmSync(join(target, BOARD, f), { recursive: true, force: true, maxRetries: 5 })
cpSync(join(stage, BOARD), join(target, BOARD), { recursive: true, verbatimSymlinks: true })
rmSync(stage, { recursive: true, force: true })
console.log(`Exported kit ${version} to ${join(target, BOARD)}`)

/** Every real file under `dir`; links are skipped (they point at files already listed). */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    return d.isDirectory() ? walk(p) : d.isFile() ? [p] : []
  })
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

/**
 * Register a file (or a mermaid diagram) as an artifact: take the next AR-nn, bring the file into
 * the requirements folder's `artifacts/files/` (a drawing is copied in as AR-nn.<ext>; a transcript
 * or document keeps its name and is moved in, with `git mv` when git tracks it), and write the
 * sidecar with what is known. Prints what the file holds, to choose anchors from.
 *
 *   npm run artifact:new -- <file> --title "Name" --kind diagram --date 2026-10-06 [--author "..."] [--source "..."] [--keep]
 *   npm run artifact:new -- --mermaid <file.mmd> --title "Name" [--kind diagram]
 *
 * --date is when the artifact itself was made (the meeting, the publication, the drawing), YYYY-MM-DD,
 * YYYY-MM or YYYY. --keep leaves the file where it is (a path from the repository root) instead of bringing it in. Then add regions and a description
 * to the sidecar, link items to it (`artifacts: [AR-nn#spot]`), and run `npm run check`.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import { markdownFacts, svgFacts } from '../shared/artifacts.ts'
import { isArtifactDate } from '../shared/check.ts'
import { serialiseArtifact } from '../shared/files.ts'
import { nextArtifactId } from '../shared/ids.ts'
import { ARTIFACT_KINDS, artifactFormat, type Artifact, type ArtifactKind } from '../shared/types.ts'
import { artifactInfo, REPO_ROOT } from '../server/artifactFiles.ts'
import { REQUIREMENTS_DIR, artifactSidecarPath, artifactsDir, createAtomic, loadCatalogue, takenIds } from '../server/catalogueFs.ts'

const argv = process.argv.slice(2)
const opt = (name: string) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const opts = (name: string) => argv.flatMap((a, i) => (a === name && argv[i + 1] ? [argv[i + 1]!] : []))
const flag = (name: string) => argv.includes(name)
const fail = (msg: string): never => {
  console.error(msg)
  process.exit(1)
}

if (flag('--help') || !argv.length) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]!.replace(/^\/\*\*?|^ \* ?/gm, ''))
  process.exit(0)
}

const mermaid = opt('--mermaid')
const valued = new Set(['--title', '--kind', '--date', '--author', '--source', '--mermaid'])
const positional = argv.filter((a, i) => !a.startsWith('--') && !valued.has(argv[i - 1] ?? ''))
const given = mermaid ? null : positional[0]
const title = opt('--title') ?? fail('--title is required: the artifact\'s name, in sentence case')
const kind = (opt('--kind') ?? 'diagram') as ArtifactKind
if (!ARTIFACT_KINDS.includes(kind)) fail(`--kind must be one of ${ARTIFACT_KINDS.join(', ')}`)
const date = opt('--date') ?? null
if (date !== null && !isArtifactDate(date)) fail('--date must be YYYY-MM-DD, YYYY-MM or YYYY')

const loaded = loadCatalogue()
const id = nextArtifactId(new Set([...takenIds(artifactsDir()), ...Object.keys(loaded.artifacts)]))
const inside = (abs: string, base: string) => abs.startsWith(resolve(base) + sep)

let file: string | null = null
let source = ''
if (mermaid) {
  if (!existsSync(mermaid)) fail(`${mermaid} does not exist`)
  source = readFileSync(mermaid, 'utf8').trim()
} else {
  if (!given) fail('give a file, or --mermaid <file.mmd>')
  const abs = resolve(given!)
  if (!existsSync(abs)) fail(`${given} does not exist`)
  const format = artifactFormat({ file: abs, source: '' })
  if (!format) fail(`${given} is not a kind the board shows (.svg, .png, .jpg, .jpeg, .webp, .md, .pdf)`)
  const drawing = format === 'svg' || format === 'raster'
  const filesDir = join(artifactsDir(), 'files')
  if (inside(abs, REQUIREMENTS_DIR)) {
    file = relative(REQUIREMENTS_DIR, abs).split(sep).join('/')
  } else if (flag('--keep')) {
    if (!inside(abs, REPO_ROOT)) fail(`${given} is outside the repository; --keep needs a file inside it`)
    file = '/' + relative(REPO_ROOT, abs).split(sep).join('/')
  } else {
    const name = drawing ? `${id}${extname(abs).toLowerCase()}` : basename(abs)
    const to = join(filesDir, name)
    if (existsSync(to)) fail(`${relative(process.cwd(), to)} already exists; rename the file or pass --keep`)
    mkdirSync(filesDir, { recursive: true })
    if (drawing || !inside(abs, REPO_ROOT)) {
      copyFileSync(abs, to)
      console.log(`copied ${relative(process.cwd(), abs)} to ${relative(process.cwd(), to)} (delete the original when it is no longer needed)`)
    } else {
      let tracked = true
      try {
        execFileSync('git', ['ls-files', '--error-unmatch', abs], { cwd: REPO_ROOT, stdio: 'ignore' })
      } catch {
        tracked = false
      }
      if (tracked) execFileSync('git', ['mv', abs, to], { cwd: REPO_ROOT })
      else renameSync(abs, to)
      console.log(`moved ${relative(process.cwd(), abs)} to ${relative(process.cwd(), to)}${tracked ? ' (git mv)' : ''}; fix any links to its old place`)
    }
    file = `artifacts/files/${name}`
  }
}

const a: Artifact = {
  id,
  title,
  kind,
  status: 'Current',
  supersededBy: null,
  date,
  author: opt('--author') ?? '',
  components: [],
  sources: opts('--source'),
  file,
  regions: [],
  description: '',
  source,
  extra: {},
}
createAtomic(artifactSidecarPath(id), serialiseArtifact(a))
console.log(`wrote ${relative(process.cwd(), artifactSidecarPath(id))}`)

// What the file holds, to pick anchors from.
const info = artifactInfo(a, REQUIREMENTS_DIR)
if (!info.facts.ok) console.log(`warning: ${info.facts.error}`)
if (info.meta.format === 'svg' && file) {
  const f = svgFacts(readFileSync(resolve(file.startsWith('/') ? REPO_ROOT : REQUIREMENTS_DIR, file.replace(/^\//, '')), 'utf8'))
  const ids = f.elements.filter((e) => e.attrs.id).map((e) => `#${e.attrs.id}`)
  console.log(`\nviewBox ${JSON.stringify(f.bounds)}; ${f.texts.length} texts${ids.length ? `; ids: ${ids.slice(0, 30).join(' ')}` : ''}`)
  console.log('texts (text= anchors):')
  for (const t of [...new Set(f.texts)].filter(Boolean).slice(0, 60)) console.log(`  ${t}`)
} else if (info.meta.format === 'markdown' && file) {
  const f = markdownFacts(readFileSync(resolve(file.startsWith('/') ? REPO_ROOT : REQUIREMENTS_DIR, file.replace(/^\//, '')), 'utf8'))
  console.log(`\n${f.lines} lines; headings (spots of their own, by slug):`)
  for (const h of f.headings) console.log(`  ${'  '.repeat(h.depth - 1)}${h.slug}  ${h.text}`)
} else if (info.meta.format === 'pdf') {
  console.log(`\n${info.meta.pages?.length ?? 0} pages (p1, p2 ... are spots of their own)`)
} else if (info.meta.format === 'raster') {
  console.log(`\n${info.meta.bounds?.w} x ${info.meta.bounds?.h} pixels: regions are boxes, [x, y, width, height]`)
} else if (info.facts.nodeIds) {
  console.log(`\nnodes (node= anchors): ${[...info.facts.nodeIds].join(' ')}`)
}
console.log('\nNext: add regions and a description to the sidecar, link items to it, then npm run check.')

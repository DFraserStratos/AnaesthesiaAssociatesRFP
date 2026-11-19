/**
 * Register a file (or a mermaid diagram) as an artifact: take the next AR-nn, bring the file into
 * the requirements folder's `artifacts/files/` (a drawing is copied in as AR-nn.<ext>; a transcript
 * or document keeps its name and is moved in, never staged), and write the sidecar with what is known.
 * The ID is claimed (the sidecar created exclusively) before the file is touched, so two sessions at once
 * get two IDs, and nothing is ever written over another file. Prints what the file holds, to choose anchors from.
 *
 *   npm run artifact:new -- <file> --title "Name" --kind diagram --date 2026-10-06 [--author "..."] [--source "..."] [--keep]
 *     [--cited-as "Prefix"] [--page-offset 1] [--within <heading-slug>]
 *   npm run artifact:new -- --mermaid <file.mmd> --title "Name" [--kind diagram]
 *
 * --date is when the artifact itself was made (the meeting, the publication, the drawing), YYYY-MM-DD,
 * YYYY-MM or YYYY. --cited-as (repeatable) is how sources cite it, when not by the notes convention: a
 * transcript's "Transcript <date> · <name>", a document's "RFP" (sources then add "p.27"); --page-offset
 * adds to a cited page (a printed page that runs behind the PDF's), --within looks for cited points
 * under that heading. Both apply to every --cited-as. --keep leaves the file where it is (a path from the repository root) instead of bringing it in. Then add regions and a description
 * to the sidecar, link items to it (`artifacts: [AR-nn#spot]`), and run `npm run check`.
 */
import { execFileSync } from 'node:child_process'
import { constants, copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, rmSync, unlinkSync } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import { markdownFacts, svgFacts } from '../shared/artifacts.ts'
import { isArtifactDate } from '../shared/check.ts'
import { serialiseArtifact } from '../shared/files.ts'
import { nextArtifactId } from '../shared/ids.ts'
import { ARTIFACT_KINDS, artifactFormat, type Artifact, type ArtifactKind } from '../shared/types.ts'
import { artifactInfo, REPO_ROOT } from '../server/artifactFiles.ts'
import { REQUIREMENTS_DIR, artifactSidecarPath, artifactsDir, claimNext, createAtomic, loadCatalogue, takenIds } from '../server/catalogueFs.ts'

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
const filesDir = join(artifactsDir(), 'files')

/**
 * Move a file without ever replacing one at `to`: a hard link refuses an existing target; where links
 * are not possible (another volume, exFAT), an exclusive copy. Then the original goes.
 */
function moveExclusive(from: string, to: string) {
  try {
    linkSync(from, to)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw e
    copyExclusive(from, to)
  }
  try {
    unlinkSync(from)
  } catch (e) {
    rmSync(to, { force: true }) // the original stays; no second copy is left behind
    throw e
  }
}

/** Copy a file, never over another; a copy that fails part way is removed. */
function copyExclusive(from: string, to: string) {
  try {
    copyFileSync(from, to, constants.COPYFILE_EXCL)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') rmSync(to, { force: true })
    throw e
  }
}

if (flag('--help') || !argv.length) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]!.replace(/^\/\*\*?|^ \* ?/gm, ''))
  process.exit(0)
}

const mermaid = opt('--mermaid')
const valued = new Set(['--title', '--kind', '--date', '--author', '--source', '--mermaid', '--cited-as', '--page-offset', '--within'])
const positional = argv.filter((a, i) => !a.startsWith('--') && !valued.has(argv[i - 1] ?? ''))
const given = mermaid ? null : positional[0]
const title = opt('--title') ?? fail('--title is required: the artifact\'s name, in sentence case')
const kind = (opt('--kind') ?? 'diagram') as ArtifactKind
if (!ARTIFACT_KINDS.includes(kind)) fail(`--kind must be one of ${ARTIFACT_KINDS.join(', ')}`)
const date = opt('--date') ?? null
if (date !== null && !isArtifactDate(date)) fail('--date must be YYYY-MM-DD, YYYY-MM or YYYY')
const pageOffset = opt('--page-offset') === undefined ? null : Number(opt('--page-offset'))
if (pageOffset !== null && !Number.isInteger(pageOffset)) fail('--page-offset must be a whole number')
const citedAs = opts('--cited-as').map((as) => ({ as, pageOffset, within: opt('--within') ?? null, spot: null }))

const loaded = loadCatalogue()
const inside = (abs: string, base: string) => abs.startsWith(resolve(base) + sep)

/** How the file comes in: already in the folder, kept where it is, copied in (a drawing), or moved in. */
let bring: { how: 'none' } | { how: 'as-is'; file: string } | { how: 'copy' | 'move'; from: string; name: (id: string) => string; tracked: boolean } = { how: 'none' }
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
  if (inside(abs, REQUIREMENTS_DIR)) {
    bring = { how: 'as-is', file: relative(REQUIREMENTS_DIR, abs).split(sep).join('/') }
  } else if (flag('--keep')) {
    if (!inside(abs, REPO_ROOT)) fail(`${given} is outside the repository; --keep needs a file inside it`)
    bring = { how: 'as-is', file: '/' + relative(REPO_ROOT, abs).split(sep).join('/') }
  } else {
    const name = (id: string) => (drawing ? `${id}${extname(abs).toLowerCase()}` : basename(abs))
    // A transcript or document keeps its name: say so now, before anything is claimed.
    if (!drawing && existsSync(join(filesDir, name('')))) fail(`${relative(process.cwd(), join(filesDir, name('')))} already exists; rename the file or pass --keep`)
    const copy = drawing || !inside(abs, REPO_ROOT)
    let tracked = false
    if (!copy) {
      try {
        execFileSync('git', ['ls-files', '--error-unmatch', abs], { cwd: REPO_ROOT, stdio: 'ignore', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } })
        tracked = true
      } catch {
        tracked = false
      }
    }
    bring = { how: copy ? 'copy' : 'move', from: abs, name, tracked }
  }
}

const record = (id: string): Artifact => ({
  id,
  title,
  kind,
  status: 'Current',
  supersededBy: null,
  date,
  author: opt('--author') ?? '',
  components: [],
  sources: opts('--source'),
  citedAs,
  file: bring.how === 'none' ? null : bring.how === 'as-is' ? bring.file : `artifacts/files/${bring.name(id)}`,
  regions: [],
  steps: [],
  stepView: null,
  description: '',
  source,
  extra: {},
})

// Claim the ID first (FINDINGS R-67): the sidecar is created exclusively, and if another session took
// that AR-nn a moment ago the next one is tried, as the board's create routes do. Only then is the file
// brought in, never over an existing file; if that fails, the claim is given back and the file is where it was.
const taken = new Set([...takenIds(artifactsDir()), ...Object.keys(loaded.artifacts)])
let claimed: Artifact | null = null
for (let attempt = 0; attempt < 5 && !claimed; attempt++) {
  const a = claimNext(taken, (t) => record(nextArtifactId(t)), (rec) => createAtomic(artifactSidecarPath(rec.id), serialiseArtifact(rec)))
  if (!a) break
  if (bring.how !== 'copy' && bring.how !== 'move') {
    claimed = a
    break
  }
  const to = join(filesDir, bring.name(a.id))
  try {
    mkdirSync(filesDir, { recursive: true })
    if (bring.how === 'copy') {
      copyExclusive(bring.from, to)
      console.log(`copied ${relative(process.cwd(), bring.from)} to ${relative(process.cwd(), to)} (delete the original when it is no longer needed)`)
    } else {
      moveExclusive(bring.from, to)
      // Moved without staging (convention: never stage mid-phase); git pairs the two paths when both are added.
      console.log(`moved ${relative(process.cwd(), bring.from)} to ${relative(process.cwd(), to)}${bring.tracked ? ' (not staged: add both paths when you commit)' : ''}; fix any links to its old place`)
    }
    claimed = a
  } catch (e) {
    rmSync(artifactSidecarPath(a.id), { force: true }) // give the claim back
    const exists = (e as NodeJS.ErrnoException).code === 'EEXIST'
    // A drawing is named after its ID: a file already there under that name means the ID is taken; try the next.
    if (exists && bring.how === 'copy' && bring.name(a.id) !== bring.name('')) {
      taken.add(a.id)
      continue
    }
    const why = exists ? `${relative(process.cwd(), to)} already exists` : (e as Error).message
    fail(`could not bring ${relative(process.cwd(), bring.from)} in (${why}); nothing was registered and the file is where it was`)
  }
}
if (!claimed) fail('could not find a free AR-nn: other sessions are adding artifacts at the same moment; run it again')
const a = claimed!
const id = a.id
const file = a.file
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

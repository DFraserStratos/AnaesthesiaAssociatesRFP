/**
 * The Diff review's git reading, read-only: the commits that changed catalogue records, and every
 * record that differs between two states (a commit, or the files on disk now), with both versions
 * parsed. Outside a repository, or with no git, there is nothing to compare: `available: false`.
 * Status codes are read as today's (`status-recodes.json`), so a renumbering is no change.
 *
 * Records are the requirements folder's cards, outstanding items and artifact sidecars; an artifact
 * also changes when its file does, wherever the sidecar says that file is (the folder's own
 * subfolders, or a `/`-rooted path elsewhere in the repository). A folder that has moved is read at
 * the path it had at each side (`gitRenames.ts`), so a move alone is no change.
 *
 * `createDiffReader` adds what the dev server needs on top: results cached and shared by identical
 * requests in flight, the tab's count, and the page's default comparison in one request.
 */
import { spawn } from 'node:child_process'
import { readdir, readFile, realpath } from 'node:fs/promises'
import { join, posix, relative, resolve, sep } from 'node:path'
import { EMPTY_TREE, WORKTREE, isCommitRef, type ArtifactDiff, type CatalogueCommit, type CommitsResponse, type DiffCountResponse, type DiffRecord, type DiffResponse, type ItemDiff } from '../shared/diff.ts'
import { countChanges, entriesOf, hash } from '../shared/diffModel.ts'
import { parseArtifact, parseItem, parseQuestion } from '../shared/files.ts'
import { normaliseStatus, type Recode } from '../shared/statuses.ts'
import type { Artifact, Item, Question } from '../shared/types.ts'
import { repoRootFor } from './artifactFiles.ts'
import { realPath } from './realPaths.ts'
import { RECORD_DIRS, readRecodes } from './catalogueFs.ts'
import { Lru, memo, nulSplit, workingNames } from './gitCore.ts'
import { emptyTree, git, readBlobs, repoTop, tryParse } from './gitHistory.ts'
import { priorDirs } from './gitRenames.ts'

type RecordKind = keyof typeof RECORD_DIRS
const KINDS = Object.keys(RECORD_DIRS) as RecordKind[]


interface Repo {
  top: string
  /** The requirements folder now, relative to the repository's top ('' when it is the top). */
  rel: string
}

/** Where each kind of record's folder is, relative to the repository's top. */
type Dirs = Record<RecordKind, string>

/**
 * One side of a comparison: a commit (or the empty tree), or the files on disk. `base` is where the
 * requirements folder is at that side (artifact files are named from it), `dirs` where each kind of
 * record is (a record folder may have been renamed as the folder moved).
 */
type Side = { kind: 'commit'; ref: string; base: string; dirs: Dirs } | { kind: 'worktree'; base: string; dirs: Dirs }

/** Every place the folder and each record folder have been, newest first, today's first of each. */
interface Layout {
  roots: string[]
  dirs: Record<RecordKind, string[]>
}

export class DiffRefError extends Error {}

/* ------------------------------------------------------------------ small caches */

const repos = new Map<string, Repo>()

async function repoOf(root: string): Promise<Repo | null> {
  const hit = repos.get(root)
  if (hit) return hit
  const top = await repoTop(root)
  if (!top) return null
  try {
    // git reports its top level with symlinks resolved (macOS: /var is /private/var).
    const repo = { top, rel: relative(top, await realpath(root)).split(sep).join('/') }
    if (repos.size > 64) repos.clear()
    repos.set(root, repo)
    return repo
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ paths */

const under = (base: string, p: string) => !base || p.startsWith(`${base}/`)
const inBase = (base: string, p: string) => (base ? `${base}/${p}` : p)
const outOf = (base: string, p: string) => (base ? p.slice(base.length + 1) : p)
const spec = (base: string) => base || '.'

/** A path that stays where it starts: no `..` out of it, not absolute. */
function contained(p: string): string | null {
  const n = posix.normalize(p.split('\\').join('/'))
  return n === '.' || n === '..' || n.startsWith('../') || n.startsWith('/') ? null : n
}

/**
 * An artifact's file or a screenshot as the repository names it, with the folder at `base`: a
 * `/`-rooted path is from the repository (as `artifactPath` reads it), anything else from the
 * folder. Null for a path that steps outside its start.
 */
function fileInRepo(repo: Repo, base: string, file: string): string | null {
  if (file.startsWith('/')) {
    const rest = contained(file.slice(1))
    if (!rest) return null
    // git names its top by its real path; REPO_ROOT may be given through a link, so compare real with real.
    const p = relative(repo.top, resolve(realPath(repoRootFor(repo.top)), rest)).split(sep).join('/')
    return contained(p)
  }
  const rest = contained(file)
  return rest && inBase(base, rest)
}

/** A record's file name in its folder, by kind. */
const RECORD_FILE: Record<RecordKind, RegExp> = { item: /^([A-Z]{2}-[\d.]+)\.md$/, question: /^([A-Z]{2}-[\d.]+)\.md$/, artifact: /^(AR-\d+)\.md$/ }

/** What a path is, given where each kind of record may be: a record's file, or null. */
function recordIn(dirs: Record<RecordKind, string[]>, path: string): { kind: RecordKind; id: string } | null {
  const slash = path.lastIndexOf('/')
  const dir = slash < 0 ? '' : path.slice(0, slash)
  const name = path.slice(slash + 1)
  for (const kind of KINDS) {
    if (!dirs[kind].includes(dir)) continue
    const m = RECORD_FILE[kind].exec(name)
    if (m) return { kind, id: m[1]! }
  }
  return null
}

const one = (dirs: Dirs): Record<RecordKind, string[]> => ({ item: [dirs.item], question: [dirs.question], artifact: [dirs.artifact] })
const both = (a: Dirs, b: Dirs): Record<RecordKind, string[]> => ({ item: [a.item, b.item], question: [a.question, b.question], artifact: [a.artifact, b.artifact] })

/** What a path relative to the requirements folder is: a record's file, or null. */
export function classify(path: string): { kind: RecordKind; id: string } | null {
  return recordIn(one(RECORD_DIRS), path)
}

/** A record's file at one side, relative to the repository's top. */
const recordPath = (side: Side, kind: RecordKind, id: string) => `${side.dirs[kind]}/${id}.md`

/** Where each kind of record is now. */
const dirsNow = (repo: Repo): Dirs => ({ item: inBase(repo.rel, RECORD_DIRS.item), question: inBase(repo.rel, RECORD_DIRS.question), artifact: inBase(repo.rel, RECORD_DIRS.artifact) })

/**
 * Where the folder and its record folders used to be, from the renames git saw of the record
 * folders. Each record folder is followed on its own, so a move that also renamed one (`items/` to
 * `stories/`) is still followed; the folder itself is the one each record folder sat in.
 */
async function layoutOf(repo: Repo, head: string | null): Promise<Layout> {
  const now = dirsNow(repo)
  const layout: Layout = { roots: [repo.rel], dirs: one(now) }
  if (!head) return layout
  const prior = await Promise.all(KINDS.map((kind) => priorDirs(repo.top, head, now[kind]).catch(() => [] as string[])))
  KINDS.forEach((kind, i) => {
    for (const d of prior[i]!) {
      if (!layout.dirs[kind].includes(d)) layout.dirs[kind].push(d)
      const sub = RECORD_DIRS[kind]
      const parent = d.endsWith(`/${sub}`) ? d.slice(0, -sub.length - 1) : d === sub ? '' : posix.dirname(d) === '.' ? '' : posix.dirname(d)
      if (!layout.roots.includes(parent)) layout.roots.push(parent)
    }
  })
  return layout
}

/** A layout as a cache key: two layouts with the same key read every commit the same. */
const layoutKey = (l: Layout) => JSON.stringify(l)

/** Today's places for everything: the files on disk. */
const worktreeSide = (repo: Repo): Side => ({ kind: 'worktree', base: repo.rel, dirs: dirsNow(repo) })

const sideCache = new Lru<Promise<Side>>(64)

/** Commit `ref` as a side: for the folder and each record folder, today's path, else the newest earlier one there. */
function commitSide(repo: Repo, ref: string, layout: Layout): Promise<Side> {
  const now = dirsNow(repo)
  const moved = layout.roots.length > 1 || KINDS.some((k) => layout.dirs[k].length > 1)
  if (!moved) return Promise.resolve({ kind: 'commit', ref, base: repo.rel, dirs: now })
  return memo(sideCache, `${repo.top}|${ref}|${layoutKey(layout)}`, async () => {
    const asked = [...new Set([...layout.roots, ...KINDS.flatMap((k) => layout.dirs[k])].filter(Boolean))]
    const types = await objectTypes(repo.top, asked.map((p) => `${ref}:${p}`)).catch(() => [] as string[])
    const there = new Set(asked.filter((_, i) => types[i] === 'tree'))
    // The repository's top is always there.
    const base = layout.roots.find((r) => !r || there.has(r)) ?? repo.rel
    const dir = (kind: RecordKind) => layout.dirs[kind].find((d) => there.has(d)) ?? inBase(base, RECORD_DIRS[kind])
    return { kind: 'commit', ref, base, dirs: { item: dir('item'), question: dir('question'), artifact: dir('artifact') } }
  })
}

/** Each `ref:path`'s object type (`tree`, `blob`), or '' where there is none, in one git process. */
function objectTypes(top: string, specs: string[]): Promise<string[]> {
  if (!specs.length || specs.some((s) => s.includes('\n'))) return Promise.resolve(specs.map(() => ''))
  return new Promise((resolve, reject) => {
    const p = spawn('git', ['cat-file', '--batch-check=%(objecttype)'], { cwd: top })
    let out = ''
    p.stdout.setEncoding('utf8').on('data', (c: string) => (out += c))
    p.on('error', reject)
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`git cat-file exited ${code}`))
      const lines = out.split('\n')
      resolve(specs.map((_, i) => (/^(tree|blob|commit|tag)$/.test(lines[i] ?? '') ? lines[i]! : '')))
    })
    p.stdin.end(specs.map((s) => `${s}\n`).join(''))
  })
}

/* ------------------------------------------------------------------ reading a side */

/** Files (relative to the repository's top) as text at one side; null where absent. */
async function readSide(repo: Repo, side: Side, paths: string[]): Promise<(string | null)[]> {
  if (!paths.length) return []
  if (side.kind === 'worktree') return Promise.all(paths.map((p) => readFile(join(repo.top, p), 'utf8').catch(() => null)))
  return readBlobs(repo.top, paths.map((p) => `${side.ref}:${p}`))
}

/**
 * What the page needs of an artifact it does not show (to name it, and to read sources citing it):
 * the sidecar without its prose, its highlights and steps by name only.
 */
const slim = (a: Artifact): Artifact => ({
  ...a,
  description: '',
  sources: [],
  components: [],
  extra: {},
  regions: a.regions.map((r) => ({ id: r.id, name: r.name, around: [], box: null, page: null, pad: null, note: '' })),
  steps: a.steps.map((s) => ({ id: s.id, name: s.name, group: s.group, caption: '', show: [], highlight: [], moves: [], balances: [] })),
})

const sidecarOfText = new Map<string, Artifact | null>()

/** A sidecar's artifact, slimmed (null: it does not parse), remembered by the sidecar's text. */
function sidecarOf(text: string): Artifact | null {
  let a = sidecarOfText.get(text)
  if (a === undefined) {
    const parsed = tryParse(parseArtifact)(text)
    a = parsed && slim(parsed)
    if (sidecarOfText.size > 4000) sidecarOfText.clear()
    sidecarOfText.set(text, a)
  }
  return a
}

/** The artifacts at one side: their files by repository path (with the artifacts that name them), and each artifact slimmed. */
interface SideArtifacts {
  files: Map<string, string[]>
  artifacts: Record<string, Artifact>
}

const indexCache = new Lru<Promise<SideArtifacts>>(16)

async function buildIndex(repo: Repo, side: Side): Promise<SideArtifacts> {
  let names: string[]
  if (side.kind === 'worktree') {
    names = await readdir(join(repo.top, side.dirs.artifact)).catch(() => [] as string[])
  } else {
    const listed = await git(repo.top, ['ls-tree', '-z', '--name-only', side.ref, '--', `${side.dirs.artifact}/`]).catch(() => '')
    names = nulSplit(listed).map((l) => l.split('/').pop() ?? '')
  }
  const ids = names.filter((n) => RECORD_FILE.artifact.test(n)).map((n) => n.slice(0, -3))
  const texts = await readSide(repo, side, ids.map((id) => recordPath(side, 'artifact', id)))
  const out: SideArtifacts = { files: new Map(), artifacts: {} }
  ids.forEach((id, i) => {
    const a = texts[i] == null ? null : sidecarOf(texts[i]!)
    if (!a) return
    out.artifacts[id] = a
    const p = a.file ? fileInRepo(repo, side.base, a.file) : null
    if (p) out.files.set(p, [...(out.files.get(p) ?? []), id])
  })
  return out
}

/** The artifacts at a side; a commit's never change, so they are kept. */
function fileIndex(repo: Repo, side: Side, generation: number | null): Promise<SideArtifacts> {
  if (side.kind === 'worktree' && generation == null) return buildIndex(repo, side)
  const key = side.kind === 'worktree' ? `${repo.top}|${side.dirs.artifact}|worktree@${generation}` : `${repo.top}|${side.ref}|${side.base}|${side.dirs.artifact}`
  return memo(indexCache, key, () => buildIndex(repo, side))
}

/** Git blob names of files (relative to the repository's top) at one side; absent or unreadable files are left out. */
async function blobShas(repo: Repo, side: Side, repoPaths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const unique = [...new Set(repoPaths)]
  if (!unique.length) return out
  // The files on disk: named as `git add` would store them (line endings, filters, the repository's width).
  if (side.kind === 'worktree') return workingNames(repo.top, unique)
  const text = await git(repo.top, ['ls-tree', '-z', side.ref, '--', ...unique]).catch(() => '')
  for (const entry of text.split('\0')) {
    const m = /^\d+ blob ([0-9a-f]{40}|[0-9a-f]{64})\t(.+)$/s.exec(entry)
    if (m) out.set(m[2]!, m[1]!)
  }
  return out
}

/* ------------------------------------------------------------------ refs */

/**
 * HEAD or a commit hash as a full commit hash, the API's EMPTY_TREE as the repository's own empty
 * tree, in one git process; and HEAD itself (null with no commits yet).
 */
async function resolveRefs(repo: Repo, refs: string[]): Promise<{ shas: string[]; head: string | null }> {
  for (const ref of refs) if (ref !== EMPTY_TREE && !isCommitRef(ref)) throw new DiffRefError(`${ref} is not a commit`)
  const commits = refs.filter((r) => r !== EMPTY_TREE)
  const one = (r: string) => git(repo.top, ['rev-parse', '--verify', '--quiet', `${r}^{commit}`]).then((s) => s.trim())
  let head: string | null
  let resolved: string[]
  try {
    // Every ref is HEAD or plain hex (checked above), so none can read as an option.
    ;[head = '', ...resolved] = (await git(repo.top, ['rev-parse', ...['HEAD', ...commits].map((r) => `${r}^{commit}`)])).trim().split('\n')
  } catch {
    // No commits yet, or one ref is not a commit: find which, for the message.
    head = await one('HEAD').catch(() => null)
    resolved = []
    for (const r of commits) resolved.push(await one(r).catch(() => Promise.reject(new DiffRefError(`${r} is not a commit in this repository`))))
  }
  const empty = refs.includes(EMPTY_TREE) ? await emptyTree(repo.top) : ''
  let i = 0
  return { shas: refs.map((r) => (r === EMPTY_TREE ? empty : resolved[i++]!)), head: head || null }
}

/* ------------------------------------------------------------------ commits */

/** The commits that touched a record's file, from the log: the ones that may have changed a record. */
const logCache = new Lru<Promise<CatalogueCommit[]>>(4)
/** How many records a commit changed, read as the comparison reads them; a commit never changes, so these are kept. */
const countCache = new Lru<Promise<number>>(4096)

/** A key per record (or artifact file) a path touches: enough to tell which commits may have changed a record. */
function recordKeys(p: string, layout: Layout, rel: string, files: Map<string, string[]>): string[] {
  const root = layout.roots.find((r) => under(r, p))
  // Today's path for it, so a file from before a move still finds its artifact.
  const now = root === undefined ? p : inBase(rel, outOf(root, p))
  const owners = files.get(now) ?? files.get(p)
  if (owners) return owners.map((id) => `artifact:${id}`)
  const rec = recordIn(layout.dirs, p)
  if (rec) return [`${rec.kind}:${rec.id}`]
  // A file in an artifacts folder no sidecar names now (its artifact since removed, or named from an older place).
  if (!layout.dirs.artifact.some((d) => under(d, p))) return []
  const stem = /(?:^|\/)(AR-\d+)\.[^/]+$/.exec(p)?.[1]
  return [stem ? `artifact:${stem}` : `file:${p}`]
}

/** Calls `fn` on each of `list`, at most `limit` at once, in order. */
async function mapLimit<T, R>(list: T[], limit: number, fn: (v: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(list.length)
  let next = 0
  const worker = async () => {
    while (next < list.length) {
      const i = next++
      out[i] = await fn(list[i]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))
  return out
}

/**
 * The commit list. The log finds the commits that touched a record's file; each is then counted
 * by the comparison itself (`parent..sha`), so a commit that only rewrote records to read the same
 * (a status renumbering, a reformat, a move) is left out, and a listed commit's count is the number
 * of records that commit changed. With `firstOnly`, counting stops at the first commit that changed
 * a record.
 */
async function readCommits(root: string, generation: number | null, firstOnly = false): Promise<CommitsResponse> {
  const repo = await repoOf(root)
  if (!repo) return { available: false, commits: [], head: null }
  let head: string
  try {
    head = (await git(repo.top, ['rev-parse', '--verify', 'HEAD^{commit}'])).trim()
  } catch {
    return { available: true, commits: [], head: null } // a repository with no commits yet
  }
  const [layout, index] = await Promise.all([layoutOf(repo, head), fileIndex(repo, worktreeSide(repo), generation)])
  const folders = [...new Set([...layout.roots, ...KINDS.flatMap((k) => layout.dirs[k])])]
  const outside = [...index.files.keys()].filter((p) => !folders.some((r) => under(r, p))).sort()
  const key = `${repo.top}|${repo.rel}@${head}|${layoutKey(layout)}|${outside.join('\0')}|${hash(JSON.stringify([...index.files]))}`
  const candidates = await memo(logCache, key, async () => {
    const log = await git(repo.top, [
      'log',
      '-z',
      '--first-parent',
      '--diff-merges=first-parent',
      // Renames found, so a file moved unchanged (the folder moving) is no change to its record.
      '-M',
      '-l0',
      '--name-status',
      '--format=%x1e%H%x1f%P%x1f%h%x1f%aI%x1f%s',
      head,
      '--',
      ...folders.map(spec),
      ...outside,
    ])
    const out: CatalogueCommit[] = []
    for (const block of log.split('\x1e').slice(1)) {
      const nul = block.indexOf('\0')
      const meta = nul < 0 ? block : block.slice(0, nul)
      const [sha = '', parents = '', short = '', at = '', subject = ''] = meta.split('\x1f')
      const keys = new Set<string>()
      const fields = nul < 0 ? [] : block.slice(nul + 1).replace(/^\n/, '').split('\0')
      for (let i = 0; i < fields.length; ) {
        const status = fields[i++]!.replace(/^\n/, '')
        if (!status) continue
        const paths = /^[RC]/.test(status) ? [fields[i++]!, fields[i++]!] : [fields[i++]!]
        const touched = paths.map((p) => recordKeys(p, layout, repo.rel, index.files))
        // A rename at 100% similarity that lands on the same record (or file) changed nothing in it.
        if (status === 'R100' && JSON.stringify(touched[0]) === JSON.stringify(touched[1])) continue
        for (const k of touched.flat()) keys.add(k)
      }
      if (sha && keys.size) out.push({ sha, short, at, subject, records: keys.size, parent: parents.split(' ')[0] || null })
    }
    return out
  })

  const recodes = readRecodes(root)
  const recodesKey = hash(JSON.stringify(recodes))
  const empty = candidates.some((c) => !c.parent) ? await emptyTree(repo.top).catch(() => '') : ''
  // What the comparison shows for the commit; if it cannot be read, what the log says.
  const count = (c: CatalogueCommit) =>
    memo(countCache, `${repo.top}|${repo.rel}|${c.parent ?? ''}..${c.sha}|${layoutKey(layout)}|${recodesKey}`, async () => {
      const [from, to] = await Promise.all([c.parent ? commitSide(repo, c.parent, layout) : Promise.resolve<Side>({ kind: 'commit', ref: empty, base: repo.rel, dirs: dirsNow(repo) }), commitSide(repo, c.sha, layout)])
      const res = await diffSides(repo, from as Side & { kind: 'commit' }, to, recodes, null, { from: c.parent ?? EMPTY_TREE, to: c.sha }, false)
      return entriesOf(res).length
    }).catch(() => c.records)
  const commits: CatalogueCommit[] = []
  if (firstOnly) {
    for (const c of candidates) {
      const n = await count(c)
      if (n) {
        commits.push({ ...c, records: n })
        break
      }
    }
  } else {
    const counts = await mapLimit(candidates, 4, count)
    candidates.forEach((c, i) => counts[i] && commits.push({ ...c, records: counts[i]! }))
  }
  return { available: true, commits, head }
}

/** The commits that changed at least one catalogue record, newest first along HEAD's first parents. */
export function catalogueCommits(root: string): Promise<CommitsResponse> {
  return readCommits(root, null)
}

/* ------------------------------------------------------------------ the comparison */

/** Changed repository paths between From and To, under `specs`. */
async function changedPaths(repo: Repo, from: Side & { kind: 'commit' }, to: Side, specs: string[]): Promise<string[]> {
  if (!specs.length) return []
  const [tracked, untracked] = await Promise.all([
    git(repo.top, ['diff', '-z', '--no-renames', '--name-only', from.ref, ...(to.kind === 'commit' ? [to.ref] : []), '--', ...specs]),
    to.kind === 'worktree' ? git(repo.top, ['ls-files', '-z', '--others', '--exclude-standard', '--', ...specs]) : Promise.resolve(''),
  ])
  return [...new Set([...nulSplit(tracked), ...nulSplit(untracked)])]
}

interface Parsed<T> {
  rec: T | null
  error?: string
  text?: string
}

async function computeDiff(root: string, fromRef: string, toRef: string, generation: number | null, resolved?: Resolved): Promise<DiffResponse> {
  const none: DiffResponse = { available: false, from: fromRef, to: toRef, records: [], context: { before: {}, after: {} } }
  const repo = resolved?.repo ?? (await repoOf(root))
  if (!repo) return none
  const worktree = toRef === WORKTREE
  const {
    shas: [from, toSha],
    head,
  } = resolved ?? (await resolveRefs(repo, worktree ? [fromRef] : [fromRef, toRef]))
  const layout = await layoutOf(repo, head)
  const [fromSide, to] = await Promise.all([
    fromRef === EMPTY_TREE ? Promise.resolve<Side>({ kind: 'commit', ref: from!, base: repo.rel, dirs: dirsNow(repo) }) : commitSide(repo, from!, layout),
    worktree ? Promise.resolve(worktreeSide(repo)) : commitSide(repo, toSha!, layout),
  ])
  return diffSides(repo, fromSide as Side & { kind: 'commit' }, to, readRecodes(root), generation, { from: fromRef === EMPTY_TREE ? EMPTY_TREE : from!, to: worktree ? WORKTREE : toSha! })
}

interface Resolved {
  repo: Repo
  shas: string[]
  head: string | null
}

/** A sidecar's `file:` line, read without parsing the rest (for a sidecar that does not parse). */
function looseFile(text: string | undefined): string | null {
  const m = text ? /^file:[ \t]*(['"]?)(.+?)\1[ \t]*$/m.exec(text) : null
  return m && m[2] !== 'null' && m[2] !== '~' ? m[2]! : null
}

async function diffSides(
  repo: Repo,
  fromSide: Side & { kind: 'commit' },
  to: Side,
  recodes: Recode[],
  generation: number | null,
  refs: { from: string; to: string },
  withContext = true,
): Promise<DiffResponse> {
  const folders = [...new Set([...Object.values(fromSide.dirs), ...Object.values(to.dirs)])]
  // The record folders' own changes, and both sides' artifacts, read side by side.
  const [inside, idxBefore, idxAfter] = await Promise.all([changedPaths(repo, fromSide, to, folders), fileIndex(repo, fromSide, generation), fileIndex(repo, to, generation)])
  const files = [...new Set([...idxBefore.files.keys(), ...idxAfter.files.keys()])].filter((p) => !folders.some((d) => under(d, p)))
  const changed = [...inside, ...(await changedPaths(repo, fromSide, to, files))]

  // Which records changed: their own files (at either side's folders), and artifacts whose file changed.
  const dirs = both(fromSide.dirs, to.dirs)
  const wanted = new Map<string, { kind: RecordKind; id: string }>()
  for (const p of changed) {
    const rec = recordIn(dirs, p)
    if (rec) wanted.set(`${rec.kind}:${rec.id}`, rec)
    for (const id of [...(idxBefore.files.get(p) ?? []), ...(idxAfter.files.get(p) ?? [])]) wanted.set(`artifact:${id}`, { kind: 'artifact', id })
  }

  const list = [...wanted.values()]
  const [beforeText, afterText] = await Promise.all([
    readSide(repo, fromSide, list.map((r) => recordPath(fromSide, r.kind, r.id))),
    readSide(repo, to, list.map((r) => recordPath(to, r.kind, r.id))),
  ])

  const parse = (kind: RecordKind, text: string | null): Parsed<Item | Question | Artifact> => {
    if (text == null) return { rec: null }
    try {
      if (kind === 'artifact') return { rec: parseArtifact(text) }
      const rec = kind === 'item' ? parseItem(text) : parseQuestion(text)
      return { rec: { ...rec, status: normaliseStatus(recodes, kind, rec.status) } }
    } catch (e) {
      // There, but not readable: never the same as absent (that would read as added or removed).
      return { rec: null, error: (e as Error).message || 'does not parse', text }
    }
  }

  const records: DiffRecord[] = []
  list.forEach((r, i) => {
    const b = parse(r.kind, beforeText[i] ?? null)
    const a = parse(r.kind, afterText[i] ?? null)
    if (!b.rec && !a.rec && b.error == null && a.error == null) return
    const errors = {
      ...(b.error != null && { beforeError: b.error, beforeText: b.text }),
      ...(a.error != null && { afterError: a.error, afterText: a.text }),
    }
    if (r.kind === 'artifact') records.push({ kind: 'artifact', id: r.id, before: b.rec as Artifact | null, after: a.rec as Artifact | null, fileBefore: null, fileAfter: null, ...errors })
    else if (r.kind === 'item') records.push({ kind: 'item', id: r.id, before: b.rec as Item | null, after: a.rec as Item | null, ...errors })
    else records.push({ kind: 'question', id: r.id, before: b.rec as Question | null, after: a.rec as Question | null, ...errors })
  })

  // Artifact files and changed screenshot lists: each version's blob name, so the page can show both.
  const arts = records.filter((r): r is ArtifactDiff => r.kind === 'artifact')
  // A side whose sidecar does not parse: its own `file:` line, else the file the other side names.
  for (const r of arts) {
    if (r.beforeError != null) r.fileNameBefore = looseFile(r.beforeText) ?? r.after?.file ?? null
    if (r.afterError != null) r.fileNameAfter = looseFile(r.afterText) ?? r.before?.file ?? null
  }
  const fileOf = (r: ArtifactDiff, side: 'before' | 'after') => r[side]?.file ?? (side === 'before' ? r.fileNameBefore : r.fileNameAfter) ?? null
  const shotItems = records.filter((r): r is ItemDiff => r.kind === 'item' && JSON.stringify(r.before?.images ?? []) !== JSON.stringify(r.after?.images ?? []))
  const at = (side: 'before' | 'after', file: string) => fileInRepo(repo, side === 'before' ? fromSide.base : to.base, file)
  const wantedAt = (side: 'before' | 'after') =>
    [...arts.flatMap((r) => (fileOf(r, side) ? [at(side, fileOf(r, side)!)] : [])), ...shotItems.flatMap((r) => (r[side]?.images ?? []).map((img) => at(side, img.src)))].filter((p): p is string => !!p)
  const [shasBefore, shasAfter] = await Promise.all([blobShas(repo, fromSide, wantedAt('before')), blobShas(repo, to, wantedAt('after'))])
  const shaOf = (side: 'before' | 'after', file: string) => {
    const p = at(side, file)
    return (p && (side === 'before' ? shasBefore : shasAfter).get(p)) || null
  }
  for (const r of arts) {
    const b = fileOf(r, 'before')
    const a = fileOf(r, 'after')
    r.fileBefore = b ? shaOf('before', b) : null
    r.fileAfter = a ? shaOf('after', a) : null
  }
  for (const r of shotItems) {
    const shas = (side: 'before' | 'after') => Object.fromEntries((r[side]?.images ?? []).flatMap((img) => (shaOf(side, img.src) ? [[img.src, shaOf(side, img.src)!]] : [])))
    r.images = { before: shas('before'), after: shas('after') }
  }

  // A file rewritten to the same record (formatting, a recode, a move of the folder) is no change.
  const differs = (r: DiffRecord) =>
    JSON.stringify(r.before) !== JSON.stringify(r.after) ||
    r.beforeError !== r.afterError ||
    r.beforeText !== r.afterText ||
    (r.kind === 'artifact' && r.fileBefore !== r.fileAfter) ||
    (r.kind === 'item' && JSON.stringify(r.images?.before ?? {}) !== JSON.stringify(r.images?.after ?? {}))
  const kept = records.filter(differs)
  if (!withContext) return { available: true, from: refs.from, to: refs.to, records: kept, context: { before: {}, after: {} } }

  const [before, after, today] = await Promise.all([
    ancestors(repo, fromSide, kept, 'before', recodes),
    ancestors(repo, to, kept, 'after', recodes),
    to.kind === 'worktree' ? idxAfter : fileIndex(repo, worktreeSide(repo), generation),
  ])
  const res: DiffResponse = { available: true, from: refs.from, to: refs.to, records: kept, context: { before, after } }
  sideArtifacts.set(res, { before: idxBefore.artifacts, after: idxAfter.artifacts })
  return withToday(res, today)
}

/** Each comparison's artifacts at both sides, for reading against today's afresh on every response. */
const sideArtifacts = new WeakMap<DiffResponse, { before: Record<string, Artifact>; after: Record<string, Artifact> }>()

/**
 * The page has today's artifacts, so each side sends only the ones that read differently then (or are
 * gone now). Applied per response: a comparison of two commits is kept, but today's artifacts change.
 */
function withToday(res: DiffResponse, today: SideArtifacts): DiffResponse {
  const sides = sideArtifacts.get(res)
  if (!sides) return res
  const then = (arts: Record<string, Artifact>) => Object.fromEntries(Object.entries(arts).filter(([id, a]) => JSON.stringify(a) !== JSON.stringify(today.artifacts[id])))
  const out: DiffResponse = { ...res, context: { ...res.context, artifacts: { before: then(sides.before), after: then(sides.after) } } }
  sideArtifacts.set(out, sides)
  return out
}

/** Every catalogue record that differs between From (a commit) and To (a commit, or `worktree`), with both versions. */
export function catalogueDiff(root: string, fromRef: string, toRef: string): Promise<DiffResponse> {
  return computeDiff(root, fromRef, toRef, null)
}

/** The epics and features the changed cards sit under at one side, read at that side, unless they are themselves changed. */
async function ancestors(repo: Repo, side: Side, records: DiffRecord[], at: 'before' | 'after', recodes: Recode[]): Promise<Record<string, Item>> {
  const known = new Map<string, Item>()
  for (const r of records) if (r.kind === 'item' && r[at]) known.set(r.id, r[at] as Item)
  const out: Record<string, Item> = {}
  let need = [...new Set([...known.values()].map((i) => i.parent).filter((p): p is string => !!p && !known.has(p)))]
  for (let depth = 0; need.length && depth < 4; depth++) {
    const texts = await readSide(repo, side, need.map((id) => recordPath(side, 'item', id)))
    const next: string[] = []
    need.forEach((id, i) => {
      const it = texts[i] == null ? null : tryParse(parseItem)(texts[i]!)
      if (!it) return
      const rec = { ...it, status: normaliseStatus(recodes, 'item', it.status) }
      out[id] = rec
      known.set(id, rec)
      if (rec.parent && !known.has(rec.parent)) next.push(rec.parent)
    })
    need = [...new Set(next)]
  }
  return out
}

/* ------------------------------------------------------------------ the dev server's reader */

export interface DiffReaderOptions {
  /**
   * Every change to the files on disk is reported through `touched()` (the dev server's watcher),
   * so comparisons with the files on disk can be kept until the next one. Otherwise only commit
   * to commit comparisons are kept.
   */
  watched?: boolean
}

export interface DiffReader {
  commits(): Promise<CommitsResponse>
  diff(from: string, to: string): Promise<DiffResponse>
  /** How many records differ (minor changes left out); From defaults to HEAD, To to the files on disk. */
  count(from?: string, to?: string): Promise<DiffCountResponse>
  /**
   * The page's default: HEAD against the files on disk; with nothing there, what the last commit
   * that changed the catalogue changed (`jumped`). One request, so the page needs no other first.
   */
  auto(): Promise<DiffResponse>
  /** A file in the folder (or an artifact's file) changed, or the API wrote one: comparisons with the disk are stale. */
  touched(): void
  /** Start counting the commit list's commits in the background (watched only); never throws. */
  warm(): void
}

/** The Diff review's reading for one requirements folder, with its results cached and shared. */
export function createDiffReader(root: string, opts: DiffReaderOptions = {}): DiffReader {
  let generation = 0
  const results = new Lru<Promise<DiffResponse>>(8)
  const running = new Lru<Promise<DiffResponse>>(32)
  /** The count of each kept result, so asking again costs nothing. */
  const counted = new WeakMap<DiffResponse, number>()

  /** A comparison as kept: its artifact context read against the artifacts of when it was made. */
  async function kept(fromRef: string, toRef: string): Promise<DiffResponse> {
    const repo = await repoOf(root)
    if (!repo) return computeDiff(root, fromRef, toRef, null)
    const worktree = toRef === WORKTREE
    // The key names commits by hash, so HEAD moving (a commit, a checkout) is a new comparison.
    const resolved = { repo, ...(await resolveRefs(repo, worktree ? [fromRef] : [fromRef, toRef])) }
    const [from, to] = resolved.shas
    // The folder's earlier paths come from HEAD's history, so HEAD is in the key too.
    const key = [repo.top, root, resolved.head, fromRef === EMPTY_TREE ? EMPTY_TREE : from, worktree ? WORKTREE : to, hash(JSON.stringify(readRecodes(root)))].join('|')
    if (worktree && !opts.watched) {
      // Nothing says when the disk changes: share a request in flight, keep nothing after.
      const hit = running.get(key)
      if (hit) return hit
      const p = computeDiff(root, fromRef, toRef, null, resolved).finally(() => running.delete(key))
      running.set(key, p)
      return p
    }
    const gen = generation
    return memo(results, worktree ? `${key}@${gen}` : key, () => computeDiff(root, fromRef, toRef, worktree ? gen : null, resolved))
  }

  /** A comparison, its artifact context read against today's artifacts (R-74: never a stale "today"). */
  async function diff(fromRef: string, toRef: string): Promise<DiffResponse> {
    const res = await kept(fromRef, toRef)
    if (toRef === WORKTREE || !res.available) return res
    const repo = await repoOf(root)
    return repo ? withToday(res, await fileIndex(repo, worktreeSide(repo), opts.watched ? generation : null)) : res
  }

  async function commits() {
    return readCommits(root, opts.watched ? generation : null)
  }

  async function count(from = 'HEAD', to = WORKTREE): Promise<DiffCountResponse> {
    const res = await kept(from, to).catch((e: unknown) => {
      // A repository with no commits yet: everything on disk is new.
      if (e instanceof DiffRefError && from === 'HEAD' && to === WORKTREE) return kept(EMPTY_TREE, to)
      throw e
    })
    if (!res.available) return { available: false, count: 0 }
    let n = counted.get(res)
    if (n === undefined) counted.set(res, (n = countChanges(res)))
    warm()
    return { available: true, count: n }
  }

  /**
   * The dev server starts this when it starts, and every board page's count starts it again: the
   * commit list's commits are counted in the background (each one is a comparison, read once and
   * kept), so the Diff review's list is ready when the tab is opened. One at a time; nothing when
   * the disk is not watched (a test, a script).
   */
  let warming: Promise<unknown> | null = null
  function warm() {
    if (!opts.watched || warming) return
    warming = commits()
      .catch(() => null)
      .finally(() => (warming = null))
  }

  return {
    commits,
    diff,
    count,
    async auto() {
      const now = await diff('HEAD', WORKTREE).catch((e: unknown) => {
        if (e instanceof DiffRefError) return diff(EMPTY_TREE, WORKTREE) // no commits yet
        throw e
      })
      if (!now.available || entriesOf(now).length) return { ...now, jumped: false }
      // Nothing uncommitted: what the last commit that changed a record changed (counting stops there).
      const latest = (await readCommits(root, opts.watched ? generation : null, true)).commits[0]
      if (!latest) return { ...now, jumped: false }
      return { ...(await diff(latest.parent ?? EMPTY_TREE, latest.sha)), jumped: true }
    },
    touched() {
      generation++
    },
    warm,
  }
}

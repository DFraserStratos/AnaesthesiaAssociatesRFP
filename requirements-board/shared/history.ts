/**
 * A card's change history, as pure functions: what changed between two versions of a record
 * (`diffItems`), a line diff for its Markdown fields (`lineDiff`), and the timeline the sheet
 * shows (`buildTimeline`), merged from the dev server's journal and the file's git commits.
 */
import type { Artifact, Item } from './types.ts'

/**
 * Record fields a history row can name, plus `position` (a Freeform drag, from board-layout.json),
 * `screenshot` (an image file under `assets/<ID>/` rewritten in place, e.g. by `npm run capture`)
 * and `content` (an artifact's file changed).
 */
export type HistoryField = Exclude<keyof Item, 'id'> | Exclude<keyof Artifact, 'id'> | 'position' | 'screenshot' | 'content'

/**
 * One version of a screenshot file: its catalogue-relative path and git blob hash, so any version
 * that was ever committed can be read back out of git for a before and after.
 */
export interface ScreenshotVersion {
  src: string
  sha: string
}

export interface FieldChange {
  field: HistoryField
  from: unknown
  to: unknown
}

/** Who made a change: the board's own API, or someone else's edit to the file (an agent, an editor, git). */
export type HistorySource = 'board' | 'disk'

/** One line of the server's per-card journal. */
export interface JournalEntry {
  at: string
  source: HistorySource
  kind: 'created' | 'changed' | 'position'
  /** The file's rev after the change (not for `position`). */
  rev?: string
  changes: FieldChange[]
  /** Changed on disk while the board was not running: noticed at the next start. */
  offline?: true
}

export interface CommitInfo {
  sha: string
  author: string
  at: string
  subject: string
}

/** One version of a record's file in git (newest first). `item` is null where the file did not parse. */
export interface GitVersion<T = Item> {
  commit: CommitInfo
  item: T | null
}

export interface GitFileHistory<T = Item> {
  versions: GitVersion<T>[]
  /** The working file differs from HEAD. */
  dirty: boolean
  /** The working file's record, for a "not committed yet" entry the journal did not see. */
  working: T | null
  /** When the working file was last written. */
  mtime?: string
  /** board-layout.json (where Freeform drags live) differs from HEAD. */
  layoutDirty?: boolean
  /** Commits that rewrote one of the card's screenshot files in place (newest first). */
  screenshots?: ScreenshotCommit[]
  /** A file under the card's `assets/<ID>/` differs from HEAD. */
  screenshotsDirty?: boolean
}

export interface ScreenshotCommit {
  commit: CommitInfo
  files: { from: ScreenshotVersion; to: ScreenshotVersion }[]
}

export type TimelineEntry =
  | {
      type: 'change'
      at: string
      source: HistorySource | 'git'
      kind: JournalEntry['kind']
      changes: FieldChange[]
      offline?: true
      commit?: CommitInfo
      /** Newer than the last commit that touched the file, and the file is not committed yet. */
      uncommitted?: true
    }
  | { type: 'commit'; at: string; commit: CommitInfo }

/** Fields in the order a history row lists them. `id` never changes; `extra` is agent-only frontmatter. */
const FIELDS: Exclude<keyof Item, 'id'>[] = ['title', 'status', 'type', 'parent', 'swimlane', 'order', 'components', 'sources', 'related', 'artifacts', 'images', 'description', 'acceptance', 'technical', 'notes', 'extra']

/** A field's value, reading a snapshot saved before the field existed as its empty value. */
const valueOf = (it: Item, f: (typeof FIELDS)[number]) => (f === 'related' || f === 'artifacts' ? (it[f] ?? []) : it[f])

export function diffItems(a: Item, b: Item): FieldChange[] {
  return FIELDS.filter((f) => JSON.stringify(valueOf(a, f)) !== JSON.stringify(valueOf(b, f))).map((field) => ({ field, from: valueOf(a, field), to: valueOf(b, field) }))
}

/** The Markdown fields (and a mermaid source): shown as a line diff behind a disclosure, not inline. */
export const TEXT_FIELDS: ReadonlySet<HistoryField> = new Set(['description', 'acceptance', 'technical', 'notes', 'source'])

/** An artifact's fields in the order a history row lists them. */
const ARTIFACT_FIELDS: Exclude<keyof Artifact, 'id'>[] = ['title', 'status', 'supersededBy', 'kind', 'date', 'author', 'components', 'sources', 'file', 'regions', 'description', 'source', 'extra']

export function diffArtifacts(a: Artifact, b: Artifact): FieldChange[] {
  return ARTIFACT_FIELDS.filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map((field) => ({ field, from: a[field], to: b[field] }))
}

/** What happened to an artifact's regions between two versions, by region ID. */
export function regionChanges(from: Artifact['regions'], to: Artifact['regions']) {
  const before = new Map(from.map((r) => [r.id, r]))
  const after = new Map(to.map((r) => [r.id, r]))
  const changed: { id: string; name: string; what: string[] }[] = []
  for (const [id, r] of after) {
    const was = before.get(id)
    if (!was) continue
    const what: string[] = []
    if (was.name !== r.name) what.push('renamed')
    if (JSON.stringify(was.around) !== JSON.stringify(r.around) || JSON.stringify(was.box) !== JSON.stringify(r.box) || was.page !== r.page || was.pad !== r.pad) what.push('moved')
    if (was.note !== r.note) what.push('note changed')
    if (what.length) changed.push({ id, name: r.name, what })
  }
  return { added: to.filter((r) => !before.has(r.id)), removed: from.filter((r) => !after.has(r.id)), changed }
}

export interface DiffLine {
  op: 'same' | 'add' | 'del'
  text: string
}

/** Longer than this (lines, either side) and the diff is shown as everything removed, then everything added. */
const MAX_DIFF_LINES = 400

/** A line diff of two texts (LCS). Empty text has no lines. Past `max` lines a side, everything removed then added. */
export function lineDiff(a: string, b: string, max = MAX_DIFF_LINES): DiffLine[] {
  const x = a ? a.split('\n') : []
  const y = b ? b.split('\n') : []
  if (x.length > max || y.length > max) return [...x.map((text) => ({ op: 'del' as const, text })), ...y.map((text) => ({ op: 'add' as const, text }))]
  // lcs[i][j]: the longest common run of x[i..] and y[j..].
  const lcs = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) lcs[i]![j] = x[i] === y[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      out.push({ op: 'same', text: x[i]! })
      i++
      j++
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) out.push({ op: 'del', text: x[i++]! })
    else out.push({ op: 'add', text: y[j++]! })
  }
  while (i < x.length) out.push({ op: 'del', text: x[i++]! })
  while (j < y.length) out.push({ op: 'add', text: y[j++]! })
  return out
}

/** Added / removed line counts, for a row's summary. */
export function lineCounts(d: DiffLine[]): { add: number; del: number } {
  return { add: d.filter((l) => l.op === 'add').length, del: d.filter((l) => l.op === 'del').length }
}

/** Consecutive drags (or sibling reorders) from one source this close together read as one change. */
const COALESCE_MS = 10 * 60 * 1000

const onlyField = (e: JournalEntry, f: HistoryField) => e.changes.length === 1 && e.changes[0]!.field === f
const allScreenshots = (e: JournalEntry) => e.changes.length > 0 && e.changes.every((c) => c.field === 'screenshot')
const shotSrc = (c: FieldChange) => (c.to as ScreenshotVersion).src

/** Merge the screenshot changes of two entries: per file, the earliest before and the latest after. */
function mergeShots(a: FieldChange[], b: FieldChange[]): FieldChange[] {
  const out = [...a]
  for (const c of b) {
    const i = out.findIndex((o) => shotSrc(o) === shotSrc(c))
    if (i >= 0) out[i] = { field: 'screenshot', from: out[i]!.from, to: c.to }
    else out.push(c)
  }
  return out
}

/** Merge runs of Freeform drags, of order-only reorders, and of screenshot re-captures into one entry each (journal order, oldest first). */
export function collapse(entries: JournalEntry[]): JournalEntry[] {
  const out: JournalEntry[] = []
  for (const e of entries) {
    const prev = out.at(-1)
    // A capture run rewrites a card's images over several syncs: one entry, every file once.
    if (prev && allScreenshots(e) && allScreenshots(prev) && prev.source === e.source && Date.parse(e.at) - Date.parse(prev.at) <= COALESCE_MS) {
      out[out.length - 1] = { ...e, changes: mergeShots(prev.changes, e.changes) }
      continue
    }
    const field = e.kind === 'position' ? 'position' : onlyField(e, 'order') ? 'order' : null
    if (prev && field && prev.source === e.source && onlyField(prev, field) && prev.kind === e.kind && Date.parse(e.at) - Date.parse(prev.at) <= COALESCE_MS) {
      out[out.length - 1] = { ...e, changes: [{ field, from: prev.changes[0]!.from, to: e.changes[0]!.to }] }
      continue
    }
    out.push(e)
  }
  // A drag that ended where it began is no change at all.
  return out
    .map((e) => (allScreenshots(e) ? { ...e, changes: e.changes.filter((c) => (c.from as ScreenshotVersion).sha !== (c.to as ScreenshotVersion).sha) } : e))
    .filter((e) => (e.changes.length === 0 ? e.kind === 'created' : e.changes.some((c) => JSON.stringify(c.from) !== JSON.stringify(c.to))))
}

/**
 * The sheet's timeline, newest first. The journal holds every change since the dev server began
 * keeping it; commits older than its first entry fill in the past as field diffs, and newer ones
 * show only as dividers (the journal already has their detail). An edit git sees as uncommitted
 * but the journal never saw (made before it started) becomes a "not committed yet" entry.
 */
export function buildTimeline<T = Item>(
  journal: JournalEntry[],
  git: GitFileHistory<T>,
  diff: (a: T, b: T) => FieldChange[] = diffItems as unknown as (a: T, b: T) => FieldChange[],
): TimelineEntry[] {
  const collapsed = collapse(journal)
  const start = collapsed.length ? Date.parse(collapsed[0]!.at) : Infinity
  const out: TimelineEntry[] = []

  let prev: T | null = null
  for (const v of [...git.versions].reverse()) {
    if (Date.parse(v.commit.at) >= start) out.push({ type: 'commit', at: v.commit.at, commit: v.commit })
    else if (v.item) {
      if (!prev) out.push({ type: 'change', at: v.commit.at, source: 'git', kind: 'created', changes: [], commit: v.commit })
      else {
        const changes = diff(prev, v.item)
        if (changes.length) out.push({ type: 'change', at: v.commit.at, source: 'git', kind: 'changed', changes, commit: v.commit })
      }
    }
    if (v.item) prev = v.item
  }

  // Screenshot rewrites in git: folded into that commit's entry (or divider), else an entry of their own.
  for (const s of git.screenshots ?? []) {
    const changes: FieldChange[] = s.files.map((f) => ({ field: 'screenshot', from: f.from, to: f.to }))
    const same = out.find((e) => (e.type === 'commit' ? e.commit.sha : e.commit?.sha) === s.commit.sha)
    if (Date.parse(s.commit.at) >= start) {
      if (!same) out.push({ type: 'commit', at: s.commit.at, commit: s.commit })
    } else if (same?.type === 'change') same.changes = [...same.changes, ...changes]
    else out.push({ type: 'change', at: s.commit.at, source: 'git', kind: 'changed', changes, commit: s.commit })
  }

  const head = git.versions[0]
  const headAt = head ? Date.parse(head.commit.at) : -Infinity
  const shotsAt = git.screenshots?.[0] ? Date.parse(git.screenshots[0].commit.at) : -Infinity
  let unseen = git.dirty
  for (const e of collapsed) {
    // Freeform drags live in board-layout.json and screenshots in assets/, not the card's file: each follows its own file's dirty flag.
    const uncommitted =
      e.kind === 'position' ? Date.parse(e.at) > headAt && !!git.layoutDirty : allScreenshots(e) ? Date.parse(e.at) > shotsAt && !!git.screenshotsDirty : Date.parse(e.at) > headAt && git.dirty
    if (uncommitted && !allScreenshots(e) && e.kind !== 'position') unseen = false
    out.push({ type: 'change', at: e.at, source: e.source, kind: e.kind, changes: e.changes, ...(e.offline ? { offline: true } : {}), ...(uncommitted ? { uncommitted: true } : {}) })
  }
  if (unseen && head?.item && git.working) {
    const changes = diff(head.item, git.working)
    if (changes.length) out.push({ type: 'change', at: git.mtime ?? head.commit.at, source: 'disk', kind: 'changed', changes, uncommitted: true })
  }

  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

/* -------------------------------------------------------------- artifacts */

/** One version of an artifact's file, by git blob hash: read back through `/history-blob/<sha>?artifact=<ID>`. */
export interface ContentVersion {
  sha: string
}

/** A commit that added, rewrote or removed an artifact's file. */
export interface AssetCommit {
  commit: CommitInfo
  /** Null where the commit added the file. */
  from: string | null
  /** Null where the commit removed it. */
  to: string | null
}

/** An artifact file's history in git (newest first), and how the file on disk stands against HEAD. */
export interface AssetHistory {
  commits: AssetCommit[]
  dirty: boolean
  /** The file's blob at HEAD, and on disk now. */
  head: string | null
  working: string | null
  mtime?: string
}

const version = (sha: string | null): ContentVersion | null => (sha ? { sha } : null)

/**
 * An artifact's timeline, newest first: its sidecar's commits as field changes (`buildTimeline`
 * with no journal), and its file's commits as `content` changes, folded into the same commit's
 * entry where both changed together. A file or sidecar changed and not yet committed shows as a
 * "not committed yet" entry.
 */
export function buildArtifactTimeline(git: GitFileHistory<Artifact>, asset: AssetHistory | null): TimelineEntry[] {
  const out = buildTimeline<Artifact>([], git, diffArtifacts)
  if (!git.versions.length && git.working) out.push({ type: 'change', at: git.mtime ?? new Date(0).toISOString(), source: 'disk', kind: 'created', changes: [], uncommitted: true })
  for (const c of asset?.commits ?? []) {
    const change: FieldChange = { field: 'content', from: version(c.from), to: version(c.to) }
    const same = out.find((e) => e.type === 'change' && e.commit?.sha === c.commit.sha)
    if (same?.type === 'change') {
      // The commit that brought the artifact in brings its file too: "Added" says it all.
      if (same.kind === 'created' && !c.from) continue
      same.changes = [...same.changes, change]
    } else {
      const divider = out.findIndex((e) => e.type === 'commit' && e.commit.sha === c.commit.sha)
      if (divider >= 0) out.splice(divider, 1)
      out.push({ type: 'change', at: c.commit.at, source: 'git', kind: 'changed', changes: [change], commit: c.commit })
    }
  }
  if (asset?.dirty && asset.working && asset.working !== asset.head) {
    const change: FieldChange = { field: 'content', from: version(asset.head), to: version(asset.working) }
    const pending = out.find((e) => e.type === 'change' && e.uncommitted)
    if (pending?.type === 'change' && pending.kind !== 'created') pending.changes = [...pending.changes, change]
    else if (!pending) out.push({ type: 'change', at: asset.mtime ?? new Date(0).toISOString(), source: 'disk', kind: 'changed', changes: [change], uncommitted: true })
  }
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

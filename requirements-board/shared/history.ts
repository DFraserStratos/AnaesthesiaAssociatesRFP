/**
 * A card's change history, as pure functions: what changed between two versions of a record
 * (`diffItems`), a line diff for its Markdown fields (`lineDiff`), and the timeline the sheet
 * shows (`buildTimeline`), merged from the dev server's journal and the file's git commits.
 */
import { sameBlocks } from './proseDiff.ts'
import { lcsPairs, squashSpace } from './textCompare.ts'
import type { Artifact, Item, Question } from './types.ts'

/**
 * Record fields a history row can name, plus `position` (a Freeform drag, from board-layout.json),
 * `screenshot` (an image file under `assets/<ID>/` rewritten in place, e.g. by `npm run capture`)
 * and `content` (an artifact's file changed).
 */
export type HistoryField = Exclude<keyof Item, 'id'> | Exclude<keyof Artifact, 'id'> | Exclude<keyof Question, 'id'> | 'position' | 'screenshot' | 'content'

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

/**
 * One line of the server's per-card journal. `seen` marks when the journal first saw a card it had no
 * record of (at a start), with no changes: from then on the journal has the detail (FINDINGS R-87). It
 * is never shown, and a board from before it ignores it (a line with no changes that is not `created`).
 */
export interface JournalEntry {
  at: string
  source: HistorySource
  kind: 'created' | 'changed' | 'position' | 'seen'
  /** The file's rev after the change (not for `position`). */
  rev?: string
  changes: FieldChange[]
  /** Changed on disk while the board was not running: noticed at the next start. */
  offline?: true
  /** On a `created` entry: the record as it began, so the timeline can tell a new card reusing the ID from a restore. */
  item?: Item
}

export interface CommitInfo {
  sha: string
  author: string
  at: string
  subject: string
}

/**
 * One version of a record's file in git (newest first), along HEAD's first parents: each version is
 * the file as that commit left it, against its first parent (a merge is listed once, as the merge).
 * `item` is null where the file did not parse, or where the commit deleted it (`deleted`).
 */
export interface GitVersion<T = Item> {
  commit: CommitInfo
  item: T | null
  /**
   * The deletion bound: this commit deleted the file (a committed deletion on HEAD's first parents).
   * Versions after it in the list (older) are the path's earlier life: a record deleted and later
   * added again at the same path, either restored (the same record) or a new one reusing the ID.
   */
  deleted?: true
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
  /** Deletion bounds of the card's screenshot files: the commit that deleted each (newest first). */
  screenshotsEnded?: { src: string; commit: string }[]
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
      kind: Exclude<JournalEntry['kind'], 'seen'>
      changes: FieldChange[]
      offline?: true
      commit?: CommitInfo
      /** Newer than the last commit that touched the file, and the file is not committed yet. */
      uncommitted?: true
    }
  | { type: 'commit'; at: string; commit: CommitInfo }

type Fields<T> = Exclude<keyof T, 'id'>

/**
 * A record's fields in order, checked to name every one but `id`: a field added to the type and
 * left out here fails to compile ("Expected 2 arguments"; the second names it), rather than its
 * changes going unseen in a history row or the Diff review.
 */
const fieldList =
  <T>() =>
  <const L extends readonly Fields<T>[]>(list: L, ..._missing: [Exclude<Fields<T>, L[number]>] extends [never] ? [] : [missing: Exclude<Fields<T>, L[number]>]) =>
    list

/** Fields in the order a history row lists them. `id` never changes; `extra` is agent-only frontmatter. */
const FIELDS = fieldList<Item>()(['title', 'status', 'type', 'parent', 'swimlane', 'order', 'components', 'sources', 'related', 'artifacts', 'images', 'description', 'acceptance', 'technical', 'notes', 'extra'])

/** A field's value, reading a snapshot saved before the field existed as its empty value. */
const valueOf = (it: Item, f: (typeof FIELDS)[number]) => (f === 'related' || f === 'artifacts' ? (it[f] ?? []) : it[f])

export function diffItems(a: Item, b: Item): FieldChange[] {
  return FIELDS.filter((f) => JSON.stringify(valueOf(a, f)) !== JSON.stringify(valueOf(b, f))).map((field) => ({ field, from: valueOf(a, field), to: valueOf(b, field) }))
}

/** The Markdown fields (and a mermaid source): shown as a line diff behind a disclosure, not inline. */
export const TEXT_FIELDS: ReadonlySet<HistoryField> = new Set(['description', 'acceptance', 'technical', 'notes', 'source'])

/** An artifact's fields in the order a history row lists them. */
const ARTIFACT_FIELDS = fieldList<Artifact>()(['title', 'status', 'supersededBy', 'kind', 'date', 'author', 'components', 'sources', 'citedAs', 'file', 'regions', 'steps', 'stepView', 'description', 'source', 'extra'])

export function diffArtifacts(a: Artifact, b: Artifact): FieldChange[] {
  return ARTIFACT_FIELDS.filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map((field) => ({ field, from: a[field], to: b[field] }))
}

/** An outstanding item's fields in the order the Diff review lists them. */
const QUESTION_FIELDS = fieldList<Question>()(['title', 'status', 'kind', 'owner', 'affects', 'question', 'answer', 'sources', 'extra'])

export function diffQuestions(a: Question, b: Question): FieldChange[] {
  return QUESTION_FIELDS.filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map((field) => ({ field, from: a[field], to: b[field] }))
}

const LIST_FIELDS: ReadonlySet<string> = new Set(['components', 'sources', 'related', 'artifacts', 'affects'])
const sortedJson = (v: unknown) => JSON.stringify(Array.isArray(v) ? v.map((x) => JSON.stringify(x)).sort() : v)

/** A diagram's source line by line, blank lines left out and each line's spacing squashed: line breaks are its syntax. */
const sourceLines = (v: unknown) => String(v ?? '').split(/\r?\n/).map(squashSpace).filter(Boolean)

/**
 * A change that alters nothing a reader would notice: a reorder among siblings, a list reordered
 * without anything added or removed, a one-line text that differs only in its spacing, a Markdown
 * field with the same blocks each differing only in spacing or a list's marker (`sameBlocks`), or a
 * diagram source with the same lines. Joined or split paragraphs and list items, a new depth or
 * heading, and lines added, removed, joined or split are changes.
 */
export function isMinorChange(c: FieldChange): boolean {
  if (c.field === 'order' || c.field === 'position') return true
  if (LIST_FIELDS.has(c.field) || c.field === 'images' || c.field === 'regions') return sortedJson(c.from ?? []) === sortedJson(c.to ?? [])
  if (c.field === 'source') return JSON.stringify(sourceLines(c.from)) === JSON.stringify(sourceLines(c.to))
  if (TEXT_FIELDS.has(c.field) || c.field === 'question' || c.field === 'answer') return sameBlocks(String(c.from ?? ''), String(c.to ?? ''))
  if (c.field === 'title' || c.field === 'author') return squashSpace(c.from) === squashSpace(c.to)
  return false
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

/** The line diff's table budget: this many lines a side (between the texts' common start and end) are compared in full. */
const MAX_DIFF_LINES = 400

/**
 * A line diff of two texts (LCS). Empty text has no lines. The common start and end are matched at any
 * length; past `max` lines a side in between, lines found once on each side anchor the rest, and a
 * part with nothing in common reads as everything removed, then added.
 */
export function lineDiff(a: string, b: string, max = MAX_DIFF_LINES): DiffLine[] {
  const x = a ? a.split('\n') : []
  const y = b ? b.split('\n') : []
  const pairs = lcsPairs(x, y, (p, q) => p === q, (max + 1) * (max + 1))
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  // Between two kept lines: the removed ones, then the added ones.
  for (const [pi, pj] of [...pairs, [x.length, y.length] as const]) {
    while (i < pi) out.push({ op: 'del', text: x[i++]! })
    while (j < pj) out.push({ op: 'add', text: y[j++]! })
    if (pi < x.length && pj < y.length) out.push({ op: 'same', text: x[pi]! })
    i = pi + 1
    j = pj + 1
  }
  return out
}

/** What a list gained and lost, by value (a reorder is neither). */
export function setDiff<T>(from: readonly T[], to: readonly T[]): { added: T[]; removed: T[] } {
  return { added: to.filter((s) => !from.includes(s)), removed: from.filter((s) => !to.includes(s)) }
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
/**
 * A record's current life (FINDINGS R-54; accepted decisions 19 and 20): an ID can be reissued after its
 * record is deleted, and the new record's history must not show the old one's as its own. The life starts
 * at the newer of two marks:
 * - a committed deletion (B08's bound, `deleted`) whose two sides read as different records; when the
 *   record re-added reads as the one deleted (same type, no field changed: a revert, an undo) it is a
 *   restore and its history carries on across the gap;
 * - the journal's newest `created` entry, when the record it began as differs from the newest git version
 *   before it (or nothing in git came before it). That catches an ID reissued before the deletion was
 *   committed, where git sees only an edit. An entry from before `created` entries held the record counts
 *   only when the board made it (the board's create is never a restore).
 * Git versions, journal lines and screenshot rewrites before the start are dropped; nothing is deleted
 * from the journal or git, only left out of the timeline.
 */
export function currentLife<T>(journal: JournalEntry[], git: Pick<GitFileHistory<T>, 'versions' | 'working'>, diff: (a: T, b: T) => FieldChange[]): { versions: GitVersion<T>[]; journal: JournalEntry[]; own: (at: string) => boolean } {
  const kind = (r: T) => (r as { type?: unknown }).type
  const sameRecord = (a: T | null, b: T | null) => !!a && !!b && kind(a) === kind(b) && diff(a, b).length === 0
  let versions = git.versions
  let journalFrom = 0
  let own = (_at: string) => true
  for (let i = 0; i < versions.length; i++) {
    const v = versions[i]!
    if (!v.deleted) continue
    const readded = i > 0 ? versions[i - 1]!.item : git.working
    const deleted = versions.slice(i + 1).find((x) => x.item)?.item ?? null
    if (sameRecord(deleted, readded)) continue // a restore
    const bound = Date.parse(v.commit.at)
    versions = versions.slice(0, i)
    own = (at) => Date.parse(at) > bound
    break
  }
  let created = -1
  for (let j = journal.length - 1; j >= 0 && created < 0; j--) if (journal[j]!.kind === 'created') created = j
  if (created >= 0) {
    const e = journal[created]!
    // Commit times have one-second resolution (`%aI`): a commit in the same second as the start is the new record's.
    const second = Math.floor(Date.parse(e.at) / 1000) * 1000
    const before = versions.find((v) => v.item && Date.parse(v.commit.at) < second)?.item ?? null
    const fresh = e.item ? !before || !sameRecord(before, e.item as unknown as T) : e.source === 'board'
    // A start moves the life on only when it is newer than the deletion bound.
    if (fresh && own(e.at)) {
      versions = versions.filter((v) => Date.parse(v.commit.at) >= second)
      journalFrom = created
      own = (x) => Date.parse(x) >= second
    }
  }
  return { versions, journal: journal.slice(journalFrom).filter((e) => own(e.at)), own }
}

export function buildTimeline<T = Item>(
  journalIn: JournalEntry[],
  gitIn: GitFileHistory<T>,
  diff: (a: T, b: T) => FieldChange[] = diffItems as unknown as (a: T, b: T) => FieldChange[],
): TimelineEntry[] {
  const life = currentLife(journalIn, gitIn, diff)
  const git: GitFileHistory<T> = { ...gitIn, versions: life.versions, screenshots: gitIn.screenshots?.filter((s) => life.own(s.commit.at)) }
  const seen = life.journal.find((e) => e.kind === 'seen')
  const collapsed = collapse(life.journal.filter((e) => e.kind !== 'seen')) as (JournalEntry & { kind: Exclude<JournalEntry['kind'], 'seen'> })[]
  // The journal has the detail from when it first saw the card (R-87), or else from its first entry
  // (journals from before `seen`). To the second, as git dates are: a commit in that second is after it.
  const first = Math.min(seen ? Date.parse(seen.at) : Infinity, collapsed.length ? Date.parse(collapsed[0]!.at) : Infinity)
  const start = Number.isFinite(first) ? Math.floor(first / 1000) * 1000 : Infinity
  const out: TimelineEntry[] = []

  // A card the journal saw first, in a repository, with no version in git before then: its beginning is
  // that first sight ("Not committed yet" until git has a version of it), unless the journal saw it created.
  const inGit = git.versions.some((v) => v.item)
  const before = git.versions.some((v) => v.item && Date.parse(v.commit.at) < start)
  if (seen && (inGit || git.dirty) && !before && !collapsed.some((e) => e.kind === 'created')) {
    out.push({ type: 'change', at: seen.at, source: 'disk', kind: 'created', changes: [], ...(inGit ? {} : { uncommitted: true as const }) })
  }

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
  /** The deletion bound: this commit deleted the file (older entries are the path's earlier life). */
  deleted?: true
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
 * An artifact file's commits in its current life: up to its newest deletion whose file came back as
 * other content (the same content back is a restore, and the history carries on).
 */
function assetLife(commits: AssetCommit[]): AssetCommit[] {
  for (let i = 0; i < commits.length; i++) {
    const c = commits[i]!
    if (!c.deleted) continue
    const back = i > 0 ? commits[i - 1]!.to : null
    if (back && back === c.from) continue
    return commits.slice(0, i)
  }
  return commits
}

/**
 * An artifact's timeline, newest first: its sidecar's commits as field changes (`buildTimeline`
 * with no journal), and its file's commits as `content` changes, folded into the same commit's
 * entry where both changed together. A file or sidecar changed and not yet committed shows as a
 * "not committed yet" entry.
 */
export function buildArtifactTimeline(gitIn: GitFileHistory<Artifact>, asset: AssetHistory | null): TimelineEntry[] {
  // An artifact ID can be reissued too: its sidecar's history and its file's start at the current life (R-54).
  const life = currentLife<Artifact>([], gitIn, diffArtifacts)
  const git = { ...gitIn, versions: life.versions }
  const out = buildTimeline<Artifact>([], git, diffArtifacts)
  if (!git.versions.length && git.working) out.push({ type: 'change', at: git.mtime ?? new Date(0).toISOString(), source: 'disk', kind: 'created', changes: [], uncommitted: true })
  for (const c of assetLife(asset?.commits ?? []).filter((x) => life.own(x.commit.at))) {
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

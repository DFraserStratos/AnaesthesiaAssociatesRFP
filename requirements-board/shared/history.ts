/**
 * A card's change history, as pure functions: what changed between two versions of a record
 * (`diffItems`), a line diff for its Markdown fields (`lineDiff`), and the timeline the sheet
 * shows (`buildTimeline`), merged from the dev server's journal and the file's git commits.
 */
import type { Item } from './types.ts'

/**
 * Record fields a history row can name, plus `position` (a Freeform drag, from board-layout.json)
 * and `screenshot` (an image file under `assets/<ID>/` rewritten in place, e.g. by `npm run capture`).
 */
export type HistoryField = Exclude<keyof Item, 'id'> | 'position' | 'screenshot'

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

/** One version of a card's file in git (newest first). `item` is null where the file did not parse. */
export interface GitVersion {
  commit: CommitInfo
  item: Item | null
}

export interface GitFileHistory {
  versions: GitVersion[]
  /** The working file differs from HEAD. */
  dirty: boolean
  /** The working file's record, for a "not committed yet" entry the journal did not see. */
  working: Item | null
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
const FIELDS: Exclude<HistoryField, 'position' | 'screenshot'>[] = ['title', 'status', 'type', 'parent', 'swimlane', 'order', 'components', 'sources', 'images', 'description', 'acceptance', 'technical', 'notes', 'extra']

export function diffItems(a: Item, b: Item): FieldChange[] {
  return FIELDS.filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map((field) => ({ field, from: a[field], to: b[field] }))
}

/** The Markdown fields: shown as a line diff behind a disclosure, not inline. */
export const TEXT_FIELDS: ReadonlySet<HistoryField> = new Set(['description', 'acceptance', 'technical', 'notes'])

export interface DiffLine {
  op: 'same' | 'add' | 'del'
  text: string
}

/** Longer than this (lines, either side) and the diff is shown as everything removed, then everything added. */
const MAX_DIFF_LINES = 400

/** A line diff of two texts (LCS). Empty text has no lines. */
export function lineDiff(a: string, b: string): DiffLine[] {
  const x = a ? a.split('\n') : []
  const y = b ? b.split('\n') : []
  if (x.length > MAX_DIFF_LINES || y.length > MAX_DIFF_LINES) return [...x.map((text) => ({ op: 'del' as const, text })), ...y.map((text) => ({ op: 'add' as const, text }))]
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
export function buildTimeline(journal: JournalEntry[], git: GitFileHistory): TimelineEntry[] {
  const collapsed = collapse(journal)
  const start = collapsed.length ? Date.parse(collapsed[0]!.at) : Infinity
  const out: TimelineEntry[] = []

  let prev: Item | null = null
  for (const v of [...git.versions].reverse()) {
    if (Date.parse(v.commit.at) >= start) out.push({ type: 'commit', at: v.commit.at, commit: v.commit })
    else if (v.item) {
      if (!prev) out.push({ type: 'change', at: v.commit.at, source: 'git', kind: 'created', changes: [], commit: v.commit })
      else {
        const changes = diffItems(prev, v.item)
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
    const changes = diffItems(head.item, git.working)
    if (changes.length) out.push({ type: 'change', at: git.mtime ?? head.commit.at, source: 'disk', kind: 'changed', changes, uncommitted: true })
  }

  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

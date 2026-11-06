/**
 * The Diff review's model, as pure functions shared by the server (the tab's count) and the page:
 * each changed record as an entry (added, removed or edited, its field changes, whether they are
 * only minor), the count of changes worth a reader's attention, the filters, the refs as the page
 * names them, and the page's order, as on the Mapped view: each epic, its features in order, each
 * followed by its stories (by lane, then order), with the unchanged epics and features they sit
 * under as headings. Outstanding items and artifacts follow in sections of their own.
 */
import { EMPTY_TREE, type ArtifactDiff, type CommitsResponse, type DiffResponse, type ItemDiff, type QuestionDiff } from './diff.ts'
import { diffArtifacts, diffItems, diffQuestions, isMinorChange, type FieldChange } from './history.ts'
import { compareIds, compareSiblings } from './ids.ts'
import { ARTIFACT_KINDS, type Item, type ItemType } from './types.ts'

export type Change = 'added' | 'removed' | 'edited'

interface EntryBase {
  /** `kind:id`, unique on the page. */
  key: string
  id: string
  change: Change
  /** Every field that differs (edited, with both sides read). */
  changes: FieldChange[]
  /** Edited, and nothing a reader would notice: a reorder, spacing. */
  minor: boolean
  /** A side whose file is there but does not parse (`beforeError`, `afterError`); null when both read. */
  unreadable: 'before' | 'after' | 'both' | null
  title: string
  /** Changes when the record changes again, so a Viewed tick can clear itself. */
  fingerprint: string
}

/** A changed card. `type` comes from its ID when no side of it parses. */
export interface ItemEntry extends EntryBase {
  kind: 'item'
  rec: ItemDiff
  type: ItemType
  /** It sits under a different parent now. */
  moved: boolean
}

export interface QuestionEntry extends EntryBase {
  kind: 'question'
  rec: QuestionDiff
}

export interface ArtifactEntry extends EntryBase {
  kind: 'artifact'
  rec: ArtifactDiff
  /** The artifact's file differs. */
  fileChanged: boolean
}

/** One changed record; its `kind` narrows `rec` to that kind's versions. */
export type Entry = ItemEntry | QuestionEntry | ArtifactEntry

/** A short stable hash (FNV-1a), to keep Viewed state small. */
export function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** An item's type from its ID's prefix, for a card no side of which parses. */
const typeFromId = (id: string): ItemType => (id.startsWith('EP-') ? 'epic' : id.startsWith('FT-') ? 'feature' : 'story')

/** The version shown for a record: the after side, else the before. */
export const shownOf = <T>(rec: { before: T | null; after: T | null }): T | null => rec.after ?? rec.before

export function entryOf(rec: ItemDiff): ItemEntry
export function entryOf(rec: QuestionDiff): QuestionEntry
export function entryOf(rec: ArtifactDiff): ArtifactEntry
export function entryOf(rec: ItemDiff | QuestionDiff | ArtifactDiff): Entry
export function entryOf(rec: ItemDiff | QuestionDiff | ArtifactDiff): Entry {
  // A file that is there but does not parse still existed: it is never an addition or a removal.
  const was = !!rec.before || rec.beforeError != null
  const is = !!rec.after || rec.afterError != null
  const change: Change = !was ? 'added' : !is ? 'removed' : 'edited'
  const unreadable = rec.beforeError != null && rec.afterError != null ? 'both' : rec.beforeError != null ? 'before' : rec.afterError != null ? 'after' : null
  const changes =
    !rec.before || !rec.after ? [] : rec.kind === 'item' ? diffItems(rec.before, rec.after) : rec.kind === 'question' ? diffQuestions(rec.before, rec.after) : diffArtifacts(rec.before, rec.after)
  const fileChanged = rec.kind === 'artifact' && rec.fileBefore !== rec.fileAfter
  const base: EntryBase = {
    key: `${rec.kind}:${rec.id}`,
    id: rec.id,
    change,
    changes,
    unreadable,
    minor: change === 'edited' && !unreadable && !fileChanged && changes.every(isMinorChange),
    title: shownOf<{ title: string }>(rec)?.title ?? rec.id,
    // Unreadable sides add their raw text, so Viewed ticks made before still hold for readable records.
    fingerprint: hash(
      JSON.stringify([
        rec.before,
        rec.after,
        rec.kind === 'artifact' ? [rec.fileBefore, rec.fileAfter] : null,
        ...(unreadable ? [rec.beforeError ?? null, rec.afterError ?? null, rec.beforeText ?? null, rec.afterText ?? null] : []),
      ]),
    ),
  }
  if (rec.kind === 'item') {
    const moved = change === 'edited' && !!rec.before && !!rec.after && rec.before.parent !== rec.after.parent
    return { ...base, kind: 'item', rec, type: shownOf(rec)?.type ?? typeFromId(rec.id), moved }
  }
  if (rec.kind === 'question') return { ...base, kind: 'question', rec }
  return { ...base, kind: 'artifact', rec, fileChanged }
}

/** Every changed record as an entry, leaving out any whose versions read the same. */
export function entriesOf(res: Pick<DiffResponse, 'records'>): Entry[] {
  return res.records.map((r) => entryOf(r)).filter((e) => e.change !== 'edited' || e.changes.length > 0 || (e.kind === 'artifact' && e.fileChanged) || e.unreadable)
}

/** The changes a reader would notice (minor ones left out): the Diff review tab's count. */
export const countChanges = (res: Pick<DiffResponse, 'records'>): number => entriesOf(res).filter((e) => !e.minor).length

/* ------------------------------------------------------------------ Filters */

/** The filter groups in the bar: the item types, then outstanding items and artifacts. */
export type Group = 'epic' | 'feature' | 'story' | 'question' | 'artifact'
export const GROUPS: Group[] = ['epic', 'feature', 'story', 'question', 'artifact']
export const groupOf = (e: Entry): Group => (e.kind === 'item' ? e.type : e.kind)

export interface Filters {
  groups: Set<Group>
  changes: Set<Change>
  minor: boolean
}

export const ALL_FILTERS = (): Filters => ({ groups: new Set(GROUPS), changes: new Set<Change>(['added', 'edited', 'removed']), minor: false })

export const passes = (e: Entry, f: Filters) => f.groups.has(groupOf(e)) && f.changes.has(e.change) && (f.minor || !e.minor)

export interface Counts {
  byGroup: Record<Group, number>
  byChange: Record<Change, number>
  minor: number
}

/** Counts for the bar: per group and per change, of what the other filters let through. */
export function counts(entries: Entry[], f: Filters): Counts {
  const byGroup = Object.fromEntries(GROUPS.map((g) => [g, 0])) as Record<Group, number>
  const byChange: Record<Change, number> = { added: 0, edited: 0, removed: 0 }
  let minor = 0
  for (const e of entries) {
    if (e.minor) minor++
    if (e.minor && !f.minor) continue
    if (f.changes.has(e.change)) byGroup[groupOf(e)]++
    if (f.groups.has(groupOf(e))) byChange[e.change]++
  }
  return { byGroup, byChange, minor }
}

/* ------------------------------------------------------------------ Order */

type PageRow =
  /** An epic or feature over shown cards: unchanged, or changed with its own card hidden by the filters (`changed`). */
  | { row: 'heading'; item: Item; changed: boolean }
  | { row: 'card'; entry: Entry }
  | { row: 'section'; title: string; count: number }

interface OrderInput {
  context: DiffResponse['context']
  /**
   * Every entry, shown or not: a changed epic or feature a filter hides still heads the cards
   * under it (as a heading), so they keep their place. Defaults to the entries shown.
   */
  all?: Entry[]
  /** The Mapped board's named lanes, top to bottom (the unnamed first lane goes above them). */
  lanes: string[]
  /** Question status codes in the Outstanding items tab's group order. */
  questionOrder: string[]
}

const laneRank = (lanes: string[], lane: string | null) => (lane == null ? 0 : lanes.indexOf(lane) + 1 || lanes.length + 1)
const isItem = (e: Entry): e is ItemEntry => e.kind === 'item'

/** The page, top to bottom, for the entries shown. */
export function pageRows(entries: Entry[], { context, lanes, questionOrder, all = entries }: OrderInput): PageRow[] {
  const out: PageRow[] = []
  // A card none of whose versions can be read has no place in the tree: it goes after it.
  const items = entries.filter(isItem).filter((e) => shownOf(e.rec))
  const lost = entries.filter(isItem).filter((e) => !shownOf(e.rec))
  // Where each card sits: a removed card where it was, every other one where it is now. Changed
  // cards a filter hides are placed too, so the cards under them keep their place.
  const nodes = new Map<string, Item>()
  for (const [id, it] of Object.entries(context.before)) nodes.set(id, it)
  for (const [id, it] of Object.entries(context.after)) nodes.set(id, it)
  for (const e of all.filter(isItem)) {
    const it = shownOf(e.rec)
    if (it) nodes.set(e.id, it)
  }
  const entryOfId = new Map<string, Entry>()
  for (const e of items) {
    nodes.set(e.id, shownOf(e.rec)!)
    entryOfId.set(e.id, e)
  }
  // Only the branches that hold a shown change.
  const needed = new Set<string>()
  for (const e of items) {
    let id: string | null = e.id
    for (let guard = 0; id && !needed.has(id) && guard < 8; guard++) {
      needed.add(id)
      id = nodes.get(id)?.parent ?? null
    }
  }
  const kids = new Map<string | null, Item[]>()
  for (const id of needed) {
    const it = nodes.get(id)
    if (!it) continue
    const parent = it.parent && needed.has(it.parent) && nodes.has(it.parent) ? it.parent : null
    kids.set(parent, [...(kids.get(parent) ?? []), it])
  }
  const typeRank = (t: ItemType) => (t === 'epic' ? 0 : t === 'feature' ? 1 : 2)
  const sort = (list: Item[]) =>
    list.sort((a, b) => typeRank(a.type) - typeRank(b.type) || (a.type === 'story' && b.type === 'story' ? laneRank(lanes, a.swimlane) - laneRank(lanes, b.swimlane) : 0) || compareSiblings(a, b))
  const changed = new Set(all.filter(isItem).map((e) => e.id))
  const visit = (it: Item) => {
    const e = entryOfId.get(it.id)
    out.push(e ? { row: 'card', entry: e } : { row: 'heading', item: it, changed: changed.has(it.id) })
    for (const c of sort(kids.get(it.id) ?? [])) visit(c)
  }
  for (const root of sort(kids.get(null) ?? [])) visit(root)
  for (const e of [...lost].sort((a, b) => compareIds(a.id, b.id))) out.push({ row: 'card', entry: e })

  const questions = entries.filter((e): e is QuestionEntry => e.kind === 'question')
  if (questions.length) {
    const rank = (e: QuestionEntry) => {
      const i = questionOrder.indexOf(shownOf(e.rec)?.status ?? '')
      return i < 0 ? questionOrder.length : i
    }
    out.push({ row: 'section', title: 'Outstanding items', count: questions.length })
    for (const e of [...questions].sort((a, b) => rank(a) - rank(b) || compareIds(a.id, b.id))) out.push({ row: 'card', entry: e })
  }
  const artifacts = entries.filter((e): e is ArtifactEntry => e.kind === 'artifact')
  if (artifacts.length) {
    const kind = (e: ArtifactEntry) => {
      const k = shownOf(e.rec)?.kind
      return k ? ARTIFACT_KINDS.indexOf(k) : ARTIFACT_KINDS.length
    }
    out.push({ row: 'section', title: 'Artifacts', count: artifacts.length })
    for (const e of [...artifacts].sort((a, b) => kind(a) - kind(b) || compareIds(a.id, b.id))) out.push({ row: 'card', entry: e })
  }
  return out
}

/* ------------------------------------------------------------------ Refs */

/**
 * A ref as the page names it: the commit in the list whose records it holds. HEAD (when the last
 * commit changed no record) holds what the newest listed commit left; a listed commit's first parent
 * holds what the next one down left (the list follows first parents, and leaves out only commits
 * that changed no record), or nothing before the first. So the pickers name a listed commit, and a
 * comparison keeps its Viewed ticks whichever of these the server answered with.
 */
export function canonicalRef(ref: string, list: Pick<CommitsResponse, 'commits' | 'head'> | null): string {
  if (!list) return ref
  const { commits, head } = list
  if (commits.some((c) => c.sha === ref)) return ref
  if (head && ref === head) return commits[0]?.sha ?? EMPTY_TREE
  const i = commits.findIndex((c) => c.parent === ref)
  if (i >= 0) return commits[i + 1]?.sha ?? EMPTY_TREE
  return ref
}

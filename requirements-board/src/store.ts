/**
 * App state. The catalogue mirrors the files on disk (via the dev-server API
 * and its change events); view preferences live in `useView` and localStorage.
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { compareIds, compareSiblings } from '../shared/ids.ts'
import { applyChanges, canParent, driftFrom, invertChanges, laneListProblem, type Change } from '../shared/move.ts'
import { UNASSIGNED_LANE, firstLaneName, isOpenQuestion, type CatalogueEvent, type Issue, type Item, type ItemStatus, type ItemType, type Layout, type Question, type Rev } from '../shared/types.ts'
import { ApiError, api } from './api.ts'

type PosPatch = Record<string, { x: number; y: number } | null>

/** One undoable card move: Freeform positions, or the catalogue fields a Mapped drop rewrote. */
export type MoveEntry = { label: string } & ({ kind: 'positions'; before: PosPatch; after: PosPatch } | { kind: 'fields'; before: Change[]; after: Change[] })

/** Options for a card move. `record: false` keeps it out of undo history (undo itself, lane edits). */
interface MoveOpts {
  record?: boolean
  label?: string
}

const HISTORY_CAP = 50

interface CatalogueState {
  status: 'loading' | 'ready' | 'error'
  error?: string
  items: Record<string, Rev<Item>>
  questions: Record<string, Rev<Question>>
  layout: Layout
  issues: Issue[]
  /** Set when card moves could not be saved; they are retried on the next move, layout change on disk, or reconnect. */
  layoutError?: string
  load: () => Promise<void>
  applyEvent: (e: CatalogueEvent) => void
  saveItem: (item: Item, baseRev?: string) => Promise<Rev<Item>>
  createItem: (partial: Partial<Item> & Pick<Item, 'type'>) => Promise<Rev<Item>>
  saveQuestion: (q: Question, baseRev?: string) => Promise<Rev<Question>>
  createQuestion: (partial: Partial<Question>) => Promise<Rev<Question>>
  /** Take the server's current copy (e.g. from a 409) into the store. */
  adoptItem: (rec: Rev<Item>) => void
  adoptQuestion: (rec: Rev<Question>) => void
  /** Set when a Mapped board move or lane edit was refused or failed; the move is rolled back. */
  moveError?: string
  clearMoveError: () => void
  /**
   * Apply a planned move (`shared/move.ts`) at once, so the map reflows, then save it as one
   * batch. Rolled back if the server refuses it. Resolves true when it saved.
   */
  moveItems: (changes: Change[], opts?: MoveOpts) => Promise<boolean>
  /** Card moves this tab can undo (newest last) and redo (next redo last). In memory only. */
  past: MoveEntry[]
  future: MoveEntry[]
  /** Set while an undo or redo is saving; further presses are ignored. */
  stepping: boolean
  /** Undo the last card move. Refused (and that history dropped) if a moved card has changed since. Resolves true when it applied. */
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  /** Replace the lane list. Rename and delete also repoint the lane's stories, in one batch, first. */
  setLanes: (lanes: string[]) => Promise<boolean>
  /** Rename a lane: a named one (its stories follow), one only a story names (it becomes a lane), or the first lane (null). */
  renameLane: (from: string | null, to: string) => Promise<boolean>
  deleteLane: (name: string) => Promise<boolean>
  setPositions: (patch: PosPatch, opts?: MoveOpts) => void
  /** Send any card moves not yet saved. Resolves true when nothing is left pending. */
  flushLayout: () => Promise<boolean>
}

let layoutTimer: ReturnType<typeof setTimeout> | undefined
/** Moves not yet acknowledged by the server, sent as a patch so other cards are never touched. */
let pendingLayout: Record<string, { x: number; y: number } | null> = {}
/** Moves are sent one after another, each with the revs the one before it returned. */
let moveQueue: Promise<unknown> = Promise.resolve()
/** Mapped moves sent but not yet answered: undo waits for them, so it never steps over a move still in flight. */
let movesInFlight = 0

export const useCatalogue = create<CatalogueState>((set, get) => ({
  status: 'loading',
  items: {},
  questions: {},
  layout: { positions: {}, lanes: [] },
  issues: [],
  past: [],
  future: [],
  stepping: false,

  async load() {
    try {
      const snap = await api.catalogue()
      // Keep unsaved moves on top of the server copy until they are flushed.
      const positions = { ...snap.layout.positions }
      for (const [id, p] of Object.entries(pendingLayout)) {
        if (p) positions[id] = p
        else delete positions[id]
      }
      set({ status: 'ready', error: undefined, ...snap, layout: withFirst({ positions, lanes: snap.layout.lanes ?? [] }, snap.layout.firstLane) })
    } catch (e) {
      set({ status: 'error', error: (e as Error).message })
    }
  },

  applyEvent(e) {
    const s = get()
    if (e.kind === 'item') {
      if (s.items[e.id]?.rev === e.record?.rev) return
      const items = { ...s.items }
      if (e.record) items[e.id] = e.record
      else delete items[e.id]
      set({ items })
    } else if (e.kind === 'question') {
      if (s.questions[e.id]?.rev === e.record?.rev) return
      const questions = { ...s.questions }
      if (e.record) questions[e.id] = e.record
      else delete questions[e.id]
      set({ questions })
    } else if (e.kind === 'layout') {
      const pending = Object.keys(pendingLayout).length > 0
      // Moves left over from a failed save: the file just changed (perhaps fixed), so try them again now.
      if (pending && !layoutTimer) void get().flushLayout()
      // Our own debounced write echoes back; don't let it undo moves still in flight. Lanes have no such race.
      const positions = !layoutTimer && !pending ? e.layout.positions : s.layout.positions
      const next = withFirst({ positions, lanes: e.layout.lanes ?? [] }, e.layout.firstLane)
      if (JSON.stringify(next) !== JSON.stringify(s.layout)) set({ layout: next })
    } else {
      set({ issues: e.issues })
    }
  },

  async saveItem(item, baseRev) {
    const rec = await api.putItem(item, baseRev)
    set({ items: { ...get().items, [rec.data.id]: rec } })
    return rec
  },
  async createItem(partial) {
    const rec = await api.createItem(partial)
    set({ items: { ...get().items, [rec.data.id]: rec } })
    return rec
  },
  async saveQuestion(q, baseRev) {
    const rec = await api.putQuestion(q, baseRev)
    set({ questions: { ...get().questions, [rec.data.id]: rec } })
    return rec
  },
  async createQuestion(partial) {
    const rec = await api.createQuestion(partial)
    set({ questions: { ...get().questions, [rec.data.id]: rec } })
    return rec
  },

  adoptItem(rec) {
    set({ items: { ...get().items, [rec.data.id]: rec } })
  },
  adoptQuestion(rec) {
    set({ questions: { ...get().questions, [rec.data.id]: rec } })
  },

  clearMoveError() {
    set({ moveError: undefined })
  },

  moveItems(changes, opts) {
    if (!changes.length) return Promise.resolve(true)
    const before = get().items
    const prev = new Map(changes.map((c) => [c.id, before[c.id]]))
    if ([...prev.values()].some((r) => !r)) return Promise.resolve(false)
    const inverse = invertChanges(
      changes.map((c) => before[c.id]!.data),
      changes,
    )
    const moved = applyChanges(
      changes.map((c) => before[c.id]!.data),
      changes,
    )
    const optimistic = new Map(moved.map((it) => [it.id, { data: it, rev: before[it.id]!.rev }]))
    set({ items: { ...before, ...Object.fromEntries(optimistic) } })

    const send = async () => {
      const now = get().items
      try {
        const { records } = await api.batchItems(
          changes.map(({ id, ...patch }) => ({ id, baseRev: (now[id] ?? prev.get(id))!.rev, patch })),
        )
        set({ items: { ...get().items, ...Object.fromEntries(records.map((r) => [r.data.id, r])) }, moveError: undefined })
        // Only a move that saved enters history: a refused one is already rolled back.
        if (opts?.record !== false) record({ kind: 'fields', label: opts?.label ?? 'Move', before: inverse, after: changes })
        return true
      } catch (e) {
        // Put back what we moved, unless something newer has already replaced it.
        const items = { ...get().items }
        for (const [id, rec] of optimistic) if (items[id] === rec) items[id] = prev.get(id)!
        if (e instanceof ApiError && e.current) {
          const cur = e.current as Rev<Item>
          items[cur.data.id] = cur
        }
        set({ items, moveError: `Move not saved: ${(e as Error).message}` })
        return false
      } finally {
        movesInFlight--
      }
    }
    movesInFlight++
    const run = moveQueue.then(send)
    moveQueue = run
    return run
  },

  async setLanes(lanes) {
    const prev = get().layout
    set({ layout: { ...prev, lanes } })
    try {
      const saved = await api.putLayout({ lanes })
      set({ layout: { ...get().layout, lanes: saved.lanes }, moveError: undefined })
      return true
    } catch (e) {
      set({ layout: { ...get().layout, lanes: prev.lanes }, moveError: `Lanes not saved: ${(e as Error).message}` })
      return false
    }
  },

  async renameLane(from, to) {
    const layout = get().layout
    const first = firstLaneName(layout)
    if (from === null) {
      if (to === first) return true
      const problem = laneListProblem([to, ...layout.lanes])
      if (problem) {
        set({ moveError: `Lane not renamed: ${problem}` })
        return false
      }
      set({ layout: withFirst({ ...layout }, to) })
      try {
        const saved = await api.putLayout({ firstLane: to === UNASSIGNED_LANE ? null : to })
        set({ layout: withFirst({ ...get().layout }, saved.firstLane), moveError: undefined })
        return true
      } catch (e) {
        set({ layout: withFirst({ ...get().layout }, layout.firstLane), moveError: `Lane not renamed: ${(e as Error).message}` })
        return false
      }
    }
    if (from === to) return true
    // A name only a story uses (not a lane yet) becomes a lane under its new name.
    const next = layout.lanes.includes(from) ? layout.lanes.map((l) => (l === from ? to : l)) : [...layout.lanes, to]
    // Check the name before touching any story, so a refused name never leaves stories pointing at nothing.
    const problem = laneListProblem([first, ...next])
    if (problem) {
      set({ moveError: `Lane not renamed: ${problem}` })
      return false
    }
    if (!(await get().moveItems(storiesIn(get().items, from).map((id) => ({ id, swimlane: to })), { record: false }))) return false
    return get().setLanes(next)
  },

  async deleteLane(name) {
    if (!(await get().moveItems(storiesIn(get().items, name).map((id) => ({ id, swimlane: null })), { record: false }))) return false
    return get().setLanes(get().layout.lanes.filter((l) => l !== name))
  },

  setPositions(patch, opts) {
    const positions = { ...get().layout.positions }
    const before: PosPatch = {}
    const after: PosPatch = {}
    for (const [id, p] of Object.entries(patch)) {
      const rounded = p ? { x: Math.round(p.x), y: Math.round(p.y) } : null
      const was = positions[id] ?? null
      if (JSON.stringify(was) !== JSON.stringify(rounded)) {
        before[id] = was
        after[id] = rounded
      }
      if (rounded) positions[id] = rounded
      else delete positions[id]
      pendingLayout[id] = rounded
    }
    set({ layout: { ...get().layout, positions } })
    if (opts?.record !== false && Object.keys(after).length) record({ kind: 'positions', label: opts?.label ?? 'Move', before, after })
    clearTimeout(layoutTimer)
    layoutTimer = setTimeout(() => {
      layoutTimer = undefined
      void get().flushLayout()
    }, 400)
  },

  undo: () => step('undo'),
  redo: () => step('redo'),

  async flushLayout() {
    const sending = pendingLayout
    if (!Object.keys(sending).length) return true
    pendingLayout = {}
    try {
      await api.putLayout({ positions: sending as Layout['positions'] })
      set({ layoutError: undefined })
      return true
    } catch (e) {
      pendingLayout = { ...sending, ...pendingLayout } // newer moves win
      set({ layoutError: `Card moves not saved yet: ${(e as Error).message}` })
      return false
    }
  },
}))

/** Push a new move onto the undo history; a new move clears redo. */
function record(entry: MoveEntry) {
  const { past } = useCatalogue.getState()
  useCatalogue.setState({ past: [...past, entry].slice(-HISTORY_CAP), future: [] })
}

/** Undo (or redo) the newest entry: check the moved cards still sit where it left them, then apply the other side. */
async function step(dir: 'undo' | 'redo'): Promise<boolean> {
  const s = useCatalogue.getState()
  if (s.stepping || movesInFlight > 0) return false
  const from = dir === 'undo' ? 'past' : 'future'
  const to = dir === 'undo' ? 'future' : 'past'
  const entry = s[from].at(-1)
  if (!entry) return false
  const rest = s[from].slice(0, -1)
  const land = () => useCatalogue.setState((cur) => ({ [to]: [...cur[to], entry].slice(-HISTORY_CAP) }))

  if (entry.kind === 'positions') {
    // Positions are cosmetic: apply even if a card was dragged since.
    useCatalogue.setState({ [from]: rest })
    s.setPositions(dir === 'undo' ? entry.before : entry.after, { record: false })
    land()
    return true
  }

  const [expected, apply] = dir === 'undo' ? [entry.after, entry.before] : [entry.before, entry.after]
  const items = Object.values(s.items).map((r) => r.data)
  const byId = new Map(items.map((i) => [i.id, i]))
  const drifted =
    driftFrom(items, expected) ??
    apply.find((c) => c.parent !== undefined && !canParent(byId.get(c.id)!, c.parent === null ? null : (byId.get(c.parent) ?? null)))?.id ??
    null
  if (drifted) {
    // Everything older builds on this entry, so that side of history goes too.
    const name = byId.get(drifted)?.title ?? drifted
    useCatalogue.setState({ [from]: [], moveError: `Can't ${dir}: ${name} changed since` })
    return false
  }
  useCatalogue.setState({ [from]: rest, stepping: true })
  try {
    const ok = await s.moveItems(apply, { record: false })
    // A refused step is rolled back by moveItems (which says why); the entry is dropped.
    if (ok) land()
    return ok
  } finally {
    useCatalogue.setState({ stepping: false })
  }
}

/** A layout with the first lane's name set, or left out when it is the default. */
function withFirst(layout: Layout, firstLane: string | undefined): Layout {
  const { firstLane: _drop, ...rest } = layout
  return firstLane && firstLane !== UNASSIGNED_LANE ? { ...rest, firstLane } : rest
}

const storiesIn = (items: Record<string, Rev<Item>>, lane: string) =>
  Object.values(items)
    .filter((r) => r.data.type === 'story' && r.data.swimlane === lane)
    .map((r) => r.data.id)

/* ------------------------------------------------------------------ derived */

export interface Index {
  items: Item[]
  byId: Map<string, Item>
  children: Map<string, Item[]>
  epics: Item[]
  /** Questions that name an item in `affects`. */
  questionsFor: Map<string, Question[]>
  questions: Question[]
}

export function buildIndex(itemRecs: Record<string, Rev<Item>>, questionRecs: Record<string, Rev<Question>>): Index {
  const items = Object.values(itemRecs).map((r) => r.data)
  const byId = new Map(items.map((i) => [i.id, i]))
  const children = new Map<string, Item[]>()
  const epics: Item[] = []
  for (const it of items) {
    if (!it.parent) {
      if (it.type === 'epic') epics.push(it)
      continue
    }
    const list = children.get(it.parent) ?? []
    list.push(it)
    children.set(it.parent, list)
  }
  for (const list of children.values()) list.sort(compareSiblings)
  epics.sort(compareSiblings)
  const questions = Object.values(questionRecs)
    .map((r) => r.data)
    .sort((a, b) => compareIds(a.id, b.id))
  const questionsFor = new Map<string, Question[]>()
  for (const q of questions) {
    for (const id of q.affects) {
      const list = questionsFor.get(id) ?? []
      list.push(q)
      questionsFor.set(id, list)
    }
  }
  return { items, byId, children, epics, questionsFor, questions }
}

export function useIndex(): Index {
  const items = useCatalogue((s) => s.items)
  const questions = useCatalogue((s) => s.questions)
  return useMemo(() => buildIndex(items, questions), [items, questions])
}

export function ancestorsOf(index: Index, id: string): Item[] {
  const out: Item[] = []
  const seen = new Set<string>()
  let cur = index.byId.get(id)?.parent
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const it = index.byId.get(cur)
    if (!it) break
    out.unshift(it)
    cur = it.parent
  }
  return out
}

export function descendantsOf(index: Index, id: string): Item[] {
  const out: Item[] = []
  const walk = (pid: string) => {
    for (const c of index.children.get(pid) ?? []) {
      out.push(c)
      walk(c.id)
    }
  }
  walk(id)
  return out
}

export const openQuestionsFor = (index: Index, id: string) => (index.questionsFor.get(id) ?? []).filter(isOpenQuestion)

/* --------------------------------------------------------------- view prefs */

export interface ViewPrefs {
  search: string
  statuses: ItemStatus[]
  components: string[]
  types: ItemType[]
  onlyWithQuestions: boolean
  showRetired: boolean
  showMinimap: boolean
  /** Freeform: cards anywhere, positions in board-layout.json. Mapped: a story map with lanes, order in the files. */
  boardMode: BoardMode
  /** Mapped lanes drawn as a header strip only, by `laneKey`. A per-browser preference, not a catalogue fact. */
  collapsedLanes: string[]
}

export type BoardMode = 'freeform' | 'mapped'

const PREFS_KEY = 'requirements-board:view'
const DEFAULT_PREFS: ViewPrefs = {
  search: '',
  statuses: [],
  components: [],
  types: [],
  onlyWithQuestions: false,
  showRetired: false,
  showMinimap: true,
  boardMode: 'freeform',
  collapsedLanes: [],
}

function readPrefs(): ViewPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ViewPrefs>), search: '' } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

interface ViewState extends ViewPrefs {
  set: (patch: Partial<ViewPrefs>) => void
  clearFilters: () => void
}

export const useView = create<ViewState>((set, get) => ({
  ...readPrefs(),
  set(patch) {
    set(patch)
    try {
      const { set: _s, clearFilters: _c, ...prefs } = get()
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      /* private window: prefs just don't persist */
    }
  },
  clearFilters() {
    get().set({ search: '', statuses: [], components: [], types: [], onlyWithQuestions: false })
  },
}))

export const filtersActive = (v: ViewPrefs) =>
  !!v.search.trim() || v.statuses.length > 0 || v.components.length > 0 || v.types.length > 0 || v.onlyWithQuestions

/** Does an item pass the current filters? (Retired visibility is handled separately.) */
export function matchesFilters(it: Item, v: ViewPrefs, index: Index): boolean {
  if (v.statuses.length && !v.statuses.includes(it.status)) return false
  if (v.types.length && !v.types.includes(it.type)) return false
  if (v.components.length && !it.components.some((c) => v.components.includes(c))) return false
  if (v.onlyWithQuestions && openQuestionsFor(index, it.id).length === 0) return false
  const q = v.search.trim().toLowerCase()
  if (q) {
    const hay = `${it.id} ${it.title} ${it.description} ${it.acceptance} ${it.technical} ${it.notes} ${it.sources.join(' ')}`.toLowerCase()
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
  }
  return true
}

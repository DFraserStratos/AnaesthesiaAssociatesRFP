/**
 * App state. The catalogue mirrors the files on disk (via the dev-server API
 * and its change events); view preferences live in `useView` and localStorage.
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { compareIds, compareSiblings } from '../shared/ids.ts'
import { isOpenQuestion, type CatalogueEvent, type Issue, type Item, type ItemStatus, type ItemType, type Layout, type Question, type Rev } from '../shared/types.ts'
import { api } from './api.ts'

interface CatalogueState {
  status: 'loading' | 'ready' | 'error'
  error?: string
  items: Record<string, Rev<Item>>
  questions: Record<string, Rev<Question>>
  layout: Layout
  issues: Issue[]
  /** Set when card moves could not be saved; they are retried on the next move or reconnect. */
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
  setPositions: (patch: Record<string, { x: number; y: number } | null>) => void
  /** Send any card moves not yet saved. Resolves true when nothing is left pending. */
  flushLayout: () => Promise<boolean>
}

let layoutTimer: ReturnType<typeof setTimeout> | undefined
/** Moves not yet acknowledged by the server, sent as a patch so other cards are never touched. */
let pendingLayout: Record<string, { x: number; y: number } | null> = {}

export const useCatalogue = create<CatalogueState>((set, get) => ({
  status: 'loading',
  items: {},
  questions: {},
  layout: { positions: {} },
  issues: [],

  async load() {
    try {
      const snap = await api.catalogue()
      // Keep unsaved moves on top of the server copy until they are flushed.
      const positions = { ...snap.layout.positions }
      for (const [id, p] of Object.entries(pendingLayout)) {
        if (p) positions[id] = p
        else delete positions[id]
      }
      set({ status: 'ready', error: undefined, ...snap, layout: { positions } })
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
      // Our own debounced write echoes back; don't let it undo moves still in flight.
      if (!layoutTimer && !Object.keys(pendingLayout).length && JSON.stringify(e.layout) !== JSON.stringify(s.layout)) set({ layout: e.layout })
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

  setPositions(patch) {
    const positions = { ...get().layout.positions }
    for (const [id, p] of Object.entries(patch)) {
      const rounded = p ? { x: Math.round(p.x), y: Math.round(p.y) } : null
      if (rounded) positions[id] = rounded
      else delete positions[id]
      pendingLayout[id] = rounded
    }
    set({ layout: { positions } })
    clearTimeout(layoutTimer)
    layoutTimer = setTimeout(() => {
      layoutTimer = undefined
      void get().flushLayout()
    }, 400)
  },

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
}

const PREFS_KEY = 'requirements-board:view'
const DEFAULT_PREFS: ViewPrefs = {
  search: '',
  statuses: [],
  components: [],
  types: [],
  onlyWithQuestions: false,
  showRetired: false,
  showMinimap: true,
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
    const hay = `${it.id} ${it.title} ${it.description} ${it.notes} ${it.sources.join(' ')}`.toLowerCase()
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
  }
  return true
}

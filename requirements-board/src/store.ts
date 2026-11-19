/**
 * App state. The catalogue mirrors the files on disk (via the dev-server API
 * and its change events); view preferences live in `useView` and localStorage.
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { compareIds, compareSiblings } from '../shared/ids.ts'
import { applyChanges, canParent, driftFrom, invertChanges, laneListProblem, type Change } from '../shared/move.ts'
import { isArtifactId, itemLinkTargets } from '../shared/links.ts'
import { UNASSIGNED_LANE, firstLaneName, type Artifact, type ArtifactRec, type AssetVersions, type CatalogueDelivery, type Issue, type Item, type ItemStatus, type ItemType, type Layout, type Question, type Rev } from '../shared/types.ts'
import { DEFAULT_CONFIG, componentNames, type BoardConfig, type ConfigPatch } from '../shared/config.ts'
import type { ArtifactDetails } from '../shared/files.ts'
import { isOpenQuestion, isRetired, statusCodes } from '../shared/statuses.ts'
import { ApiError, api, type RecordPatch } from './api.ts'
import { forgetDrafts } from './drafts.ts'
import { fields, isBoolean, isRecord, isStringArray, oneOf, readJson, removeJson, writeJson } from './storage.ts'
import { idMatch } from './itemSearch.ts'

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
  /** Agents write artifacts; the board shows them and edits only their details (`saveArtifact`). */
  artifacts: Record<string, ArtifactRec>
  layout: Layout
  /** The project's vocabulary (`board.config.json`): read it through `useConfig`. */
  config: BoardConfig
  issues: Issue[]
  /** Every screenshot's version (D-10): `assets/<ID>/<name>` to its git blob hash. Read it for an image URL (`assetUrl`). */
  assets: AssetVersions
  /**
   * Set when card moves could not be saved. They are kept (in this tab, across a reload) and sent again
   * with the next move, when the layout file changes on disk, after the next load, and when the server
   * answers again after being offline.
   */
  layoutError?: string
  /** Read the whole catalogue; deliveries that arrive meanwhile are applied over it, never under it. */
  load: () => Promise<void>
  /** Apply one `catalogue:changed` delivery: one store update, however much it carries. */
  applyDelivery: (d: CatalogueDelivery) => void
  /**
   * Save the fields a sheet (or a one-click action) changed: `patch`, the rev they were edited on and each
   * one's starting value (`base`), laid over the card as it is on disk (write protocol, accepted decision 20).
   */
  saveItem: (id: string, change: RecordPatch<Item>) => Promise<Rev<Item>>
  /** Replace sections of board.config.json (the Settings page); `bases` from `config.revs` are required. */
  saveConfig: (patch: ConfigPatch) => Promise<BoardConfig>
  createItem: (partial: Partial<Item> & Pick<Item, 'type'>) => Promise<Rev<Item>>
  saveQuestion: (id: string, change: RecordPatch<Question>) => Promise<Rev<Question>>
  createQuestion: (partial: Partial<Question>) => Promise<Rev<Question>>
  deleteQuestion: (id: string, baseRev: string) => Promise<void>
  /** Delete an item and everything under it (`ids`: that set, as shown), with every reference to them. */
  deleteItem: (id: string, baseRev: string, ids: string[]) => Promise<void>
  /** Take the server's current copy (e.g. from a 409) into the store. */
  adoptItem: (rec: Rev<Item>) => void
  adoptQuestion: (rec: Rev<Question>) => void
  /** Save an artifact's details; its file, regions and source are kept as they are on disk. */
  saveArtifact: (id: string, change: RecordPatch<Artifact>) => Promise<ArtifactRec>
  adoptArtifact: (rec: ArtifactRec) => void
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
  /** Replace the lane list (adding or reordering lanes; rename and delete go through `changeLane`). */
  setLanes: (lanes: string[]) => Promise<boolean>
  /** Rename a lane: a named one (its stories follow), one only a story names (it becomes a lane), or the first lane (null). */
  renameLane: (from: string | null, to: string) => Promise<boolean>
  deleteLane: (name: string) => Promise<boolean>
  /** Rename or remove a named lane and repoint its stories in one server write; `refused` starts the error shown. */
  changeLane: (change: { op: 'rename'; from: string; to: string } | { op: 'remove'; from: string }, refused: string) => Promise<boolean>
  setPositions: (patch: PosPatch, opts?: MoveOpts) => void
  /** Send any card moves not yet saved. Resolves true when nothing is left pending. */
  flushLayout: () => Promise<boolean>
}

let layoutTimer: ReturnType<typeof setTimeout> | undefined
/** Freeform moves not sent yet (or sent and failed), as a patch so other cards are never touched. */
let pendingLayout: PosPatch = {}
/** The Freeform moves being sent right now. One save at a time, so they reach the file in order (FINDINGS R-59). */
let inflightLayout: PosPatch = {}
let layoutQueue: Promise<unknown> = Promise.resolve()
/** Moves are sent one after another, each with the revs the one before it returned. */
let moveQueue: Promise<unknown> = Promise.resolve()
/** Mapped moves sent but not yet answered: undo waits for them, so it never steps over a move still in flight. */
let movesInFlight = 0
/** The changes of each Mapped move in flight, kept for a reload (B07-Q5: checked after it, never replayed). */
const mappedInFlight = new Map<number, Change[]>()
let mappedKey = 0

/*
 * Ordering (FINDINGS R-58). Every delivery is numbered within its server process; the snapshot says which
 * number it is current to. `seen` is the newest the store holds. While a load is in flight, deliveries are
 * applied as they come and also logged; when the snapshot lands, the log's newer deliveries are applied
 * again over it, so a snapshot never takes the store back. A load that started earlier than one already
 * applied is dropped.
 */
let seen: { epoch: string; seq: number } | null = null
let loadsStarted = 0
let loadApplied = 0
let loadsInFlight = 0
let logged: CatalogueDelivery[] = []

/*
 * Unsaved moves outlive a reload of this tab (FINDINGS R-40; B07-Q6: this tab only). They are mirrored
 * into session storage whenever they change, put back on top of the first load after a reload, and sent.
 */
const KEPT_KEY = 'requirements-board:unsaved-moves'
interface Kept {
  positions: PosPatch
  mapped: Change[][]
}
const isPos = (v: unknown) => v === null || (isRecord(v) && Number.isFinite(v.x) && Number.isFinite(v.y))
const kept0 = readJson<Kept>(
  KEPT_KEY,
  'unsaved card moves',
  { positions: {}, mapped: [] },
  (raw, bad) => {
    const positions: PosPatch = {}
    if (!isRecord(raw)) {
      bad()
      return { positions, mapped: [] }
    }
    if (isRecord(raw.positions)) {
      for (const [id, p] of Object.entries(raw.positions)) {
        if (isPos(p)) positions[id] = p as PosPatch[string]
        else bad()
      }
    }
    const mapped = Array.isArray(raw.mapped) ? (raw.mapped.filter((m) => Array.isArray(m) && m.every((c) => isRecord(c) && typeof c.id === 'string')) as Change[][]) : []
    return { positions, mapped }
  },
  'session',
)
pendingLayout = { ...kept0.positions }
/** Mapped moves that were in flight when this tab last unloaded: checked against the first load. */
let mappedAtReload = kept0.mapped
let firstLoad = true

/** Mirror the unsaved moves into session storage (or forget them when there are none). */
function keep() {
  const positions = { ...inflightLayout, ...pendingLayout }
  const mapped = [...mappedInFlight.values()]
  if (!Object.keys(positions).length && !mapped.length) removeJson(KEPT_KEY, 'session')
  else writeJson(KEPT_KEY, { positions, mapped }, 'session')
}

/** Card moves this tab has not saved yet: waiting, failed, or being sent (the leave-page guard asks while any are). */
export const hasUnsavedMoves = () => Object.keys(pendingLayout).length > 0 || Object.keys(inflightLayout).length > 0 || movesInFlight > 0

export const useCatalogue = create<CatalogueState>((set, get) => ({
  status: 'loading',
  items: {},
  questions: {},
  artifacts: {},
  layout: { positions: {}, lanes: [] },
  config: DEFAULT_CONFIG,
  issues: [],
  assets: {},
  past: [],
  future: [],
  stepping: false,

  async load() {
    const token = ++loadsStarted
    loadsInFlight++
    try {
      const snap = await api.catalogue()
      if (token < loadApplied) return // a load started after this one has already landed
      loadApplied = token
      const restoring = firstLoad
      firstLoad = false
      // Moves kept from before a reload, for cards that are gone now, are dropped (FINDINGS R-57).
      if (restoring) for (const id of Object.keys(kept0.positions)) if (!snap.items[id]) delete pendingLayout[id]
      set({
        status: 'ready',
        error: undefined,
        items: snap.items,
        questions: snap.questions,
        artifacts: snap.artifacts ?? {},
        config: snap.config ?? DEFAULT_CONFIG,
        issues: snap.issues,
        assets: snap.assets ?? {},
        layout: layoutOver(snap.layout),
      })
      seen = snap.epoch ? { epoch: snap.epoch, seq: snap.seq } : null
      // Everything that arrived while the snapshot was on its way and is newer than it goes on top.
      for (const d of logged.filter((x) => x.epoch === snap.epoch && x.seq > snap.seq)) get().applyDelivery(d)
      dropUnknownStatuses(get().config)
      if (restoring) {
        keep()
        if (Object.keys(pendingLayout).length) void get().flushLayout() // kept from before the reload: send them now
        checkMappedAtReload()
      }
    } catch (e) {
      if (token >= loadApplied) set({ status: get().status === 'ready' ? 'ready' : 'error', error: (e as Error).message })
    } finally {
      if (--loadsInFlight === 0) logged = []
    }
  },

  applyDelivery(d) {
    if (loadsInFlight) logged.push(d)
    if (seen) {
      // Another server process (a restart the socket outlived): read everything again.
      if (d.epoch !== seen.epoch) {
        if (!loadsInFlight) void get().load()
        return
      }
      if (d.seq <= seen.seq) return // already in what the store holds
      seen = { epoch: d.epoch, seq: d.seq }
    }
    const s = get()
    const next: Partial<CatalogueState> = {}
    const removed: string[] = []
    // Records the tab already holds at that rev are skipped: its own echoes cost nothing.
    const items = merged(s.items, d.items, (a, b) => a?.rev === b?.rev)
    if (items !== s.items) {
      next.items = items
      for (const [id, rec] of Object.entries(d.items!)) if (!rec && s.items[id]) removed.push(id)
    }
    const questions = merged(s.questions, d.questions, (a, b) => a?.rev === b?.rev)
    if (questions !== s.questions) next.questions = questions
    // An artifact's file facts can change with its sidecar's rev unchanged: compare both.
    const artifacts = merged(s.artifacts, d.artifacts, (a, b) => a?.rev === b?.rev && JSON.stringify(a?.meta) === JSON.stringify(b?.meta))
    if (artifacts !== s.artifacts) next.artifacts = artifacts
    if (d.layout) {
      // Moves the server may not have yet (its own echo, an earlier save's, another writer's file) stay
      // where the user put them; every other card follows the file. Lanes have no such race.
      const layout = layoutOver(d.layout)
      if (JSON.stringify(layout) !== JSON.stringify(s.layout)) next.layout = layout
    }
    if (d.config) next.config = d.config
    if (d.issues) next.issues = d.issues
    if (d.assets) {
      const assets = { ...s.assets }
      for (const [src, v] of Object.entries(d.assets)) {
        if (v) assets[src] = v
        else delete assets[src]
      }
      next.assets = assets
    }
    if (removed.length) Object.assign(next, forgetCards(removed))
    if (Object.keys(next).length) set(next)
    if (d.config) dropUnknownStatuses(d.config)
    // Moves left over from a failed save: the file just changed (perhaps fixed), so try them again now.
    if (d.layout && Object.keys(pendingLayout).length && !layoutTimer && !Object.keys(inflightLayout).length) void get().flushLayout()
  },

  async saveItem(id, change) {
    const rec = await api.patchItem(id, change)
    set({ items: { ...get().items, [rec.data.id]: rec } })
    return rec
  },
  async saveConfig(patch) {
    const config = await api.putConfig(patch)
    set({ config })
    dropUnknownStatuses(config)
    return config
  },
  async createItem(partial) {
    const rec = await api.createItem(partial)
    // A reused ID never opens with an earlier card's unsaved edits.
    forgetDrafts('item', [rec.data.id])
    set({ items: { ...get().items, [rec.data.id]: rec } })
    return rec
  },
  async saveQuestion(id, change) {
    const rec = await api.patchQuestion(id, change)
    set({ questions: { ...get().questions, [rec.data.id]: rec } })
    return rec
  },
  async saveArtifact(id, change) {
    const rec = await api.patchArtifact(id, change as RecordPatch<ArtifactDetails>)
    set({ artifacts: { ...get().artifacts, [rec.data.id]: rec } })
    return rec
  },
  async createQuestion(partial) {
    const rec = await api.createQuestion(partial)
    forgetDrafts('question', [rec.data.id])
    set({ questions: { ...get().questions, [rec.data.id]: rec } })
    return rec
  },

  async deleteQuestion(id, baseRev) {
    await api.deleteQuestion(id, baseRev)
    forgetDrafts('question', [id])
    const questions = { ...get().questions }
    delete questions[id]
    set({ questions })
  },

  async deleteItem(id, baseRev, ids) {
    const res = await api.deleteItem(id, baseRev, ids)
    forgetDrafts('item', res.deleted)
    const s = get()
    const items = { ...s.items }
    const questions = { ...s.questions }
    const positions = { ...s.layout.positions }
    for (const x of res.deleted) {
      delete items[x]
      delete positions[x]
    }
    for (const r of res.records) items[r.data.id] = r
    for (const q of res.questions) questions[q.data.id] = q
    set({ items, questions, layout: { ...s.layout, positions }, ...forgetCards(res.deleted) })
  },

  adoptItem(rec) {
    set({ items: { ...get().items, [rec.data.id]: rec } })
  },
  adoptQuestion(rec) {
    set({ questions: { ...get().questions, [rec.data.id]: rec } })
  },
  adoptArtifact(rec) {
    // A 409 carries the sidecar as it is now; keep what the file holds if it came without it.
    const meta = rec.meta ?? get().artifacts[rec.data.id]?.meta
    set({ artifacts: { ...get().artifacts, [rec.data.id]: { ...rec, meta } } })
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

    const key = ++mappedKey
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
        mappedInFlight.delete(key)
        keep()
      }
    }
    movesInFlight++
    // Kept for a reload from the moment it is queued, not only once it is sent (B07-Q5).
    mappedInFlight.set(key, changes)
    keep()
    const run = moveQueue.then(send)
    moveQueue = run
    return run
  },

  async setLanes(lanes) {
    const prev = get().layout
    set({ layout: { ...prev, lanes } })
    try {
      const saved = await api.putLayout({ lanes })
      set({ layout: { ...get().layout, lanes: saved.lanes, lanesRev: saved.lanesRev }, moveError: undefined })
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
        const saved = await api.putLayout({ firstLane: to === UNASSIGNED_LANE ? null : to, lanesRev: layout.lanesRev })
        set({ layout: { ...withFirst({ ...get().layout }, saved.firstLane), lanesRev: saved.lanesRev }, moveError: undefined })
        return true
      } catch (e) {
        set({ layout: withFirst({ ...get().layout }, layout.firstLane), moveError: `Lane not renamed: ${(e as Error).message}` })
        return false
      }
    }
    if (from === to) return true
    // A name only a story uses (not a lane yet) becomes a lane under its new name.
    const next = layout.lanes.includes(from) ? layout.lanes.map((l) => (l === from ? to : l)) : [...layout.lanes, to]
    // Check the name before sending, so an obviously refused name never makes a request.
    const problem = laneListProblem([first, ...next])
    if (problem) {
      set({ moveError: `Lane not renamed: ${problem}` })
      return false
    }
    return get().changeLane({ op: 'rename', from, to }, 'Lane not renamed')
  },

  deleteLane(name) {
    return get().changeLane({ op: 'remove', from: name }, 'Lane not removed')
  },

  /**
   * One write for a lane rename or removal: the stories in the lane and the lane list change together on
   * the server or not at all (FINDINGS R-56). Nothing changes here until it answers; a refusal leaves the
   * stories and lanes as they were. Outside undo, as lane changes always were.
   */
  async changeLane(change, refused) {
    const { items, layout } = get()
    const stories = Object.fromEntries(storiesIn(items, change.from).map((id) => [id, items[id]!.rev]))
    try {
      const saved = await api.changeLane({ ...change, lanesRev: layout.lanesRev ?? '', stories } as Parameters<typeof api.changeLane>[0])
      set({ items: { ...get().items, ...Object.fromEntries(saved.records.map((r) => [r.data.id, r])) }, layout: { ...get().layout, lanes: saved.layout.lanes, firstLane: saved.layout.firstLane, lanesRev: saved.layout.lanesRev }, moveError: undefined })
      return true
    } catch (e) {
      // A newer copy of a story that blocked it is news: show it, so a second try can work.
      if (e instanceof ApiError && e.blocked) {
        const fresh = e.blocked.map((b) => b.current as Rev<Item> | null).filter((r): r is Rev<Item> => !!r?.data)
        if (fresh.length) set({ items: { ...get().items, ...Object.fromEntries(fresh.map((r) => [r.data.id, r])) } })
      }
      set({ moveError: `${refused}: ${(e as Error).message}` })
      return false
    }
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
    keep()
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

  /**
   * One save at a time (FINDINGS R-59): a flush waits for the one before it, so saves reach the server in
   * the order they were made, and a failure can only put back moves older than any made since.
   */
  flushLayout() {
    const run = layoutQueue.then(async () => {
      const sending = pendingLayout
      if (!Object.keys(sending).length) return true
      pendingLayout = {}
      inflightLayout = sending
      try {
        await api.putLayout({ positions: sending as Layout['positions'] })
        inflightLayout = {}
        keep()
        set({ layoutError: undefined })
        return Object.keys(pendingLayout).length === 0
      } catch (e) {
        inflightLayout = {}
        pendingLayout = { ...sending, ...pendingLayout } // newer moves win (a card removed meanwhile left `sending` too)
        keep()
        set({ layoutError: `Card moves not saved yet (${(e as Error).message}). They are kept in this tab and sent again with your next move, or when the page reloads.` })
        return false
      }
    })
    layoutQueue = run
    return run
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
    // Positions are cosmetic: apply even if a card was dragged since. A removed card is already out of
    // every entry (`forgetCards`), so this never writes a position for it (R-57).
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

/** A record map with a delivery's entries applied, or the same map when none changes it (`same`). */
function merged<T>(cur: Record<string, T>, changes: Record<string, T | null> | undefined, same: (a: T | undefined, b: T | null) => boolean): Record<string, T> {
  if (!changes) return cur
  let out = cur
  for (const [id, rec] of Object.entries(changes)) {
    if (same(cur[id], rec) && (rec !== null || !(id in cur))) continue
    if (out === cur) out = { ...cur }
    if (rec) out[id] = rec
    else delete out[id]
  }
  return out
}

/** The layout as the file holds it, with the moves this tab has not had saved yet on top (waiting or being sent). */
function layoutOver(file: Layout): Layout {
  const positions = { ...file.positions }
  for (const [id, p] of Object.entries({ ...inflightLayout, ...pendingLayout })) {
    if (p) positions[id] = p
    else delete positions[id]
  }
  return withFirst({ positions, lanes: file.lanes ?? [], lanesRev: file.lanesRev }, file.firstLane)
}

/**
 * Cards that left the catalogue (deleted here or on disk) leave no position behind (FINDINGS R-57): not in
 * a waiting, failed, in-flight or kept save, and not in undo or redo. A history entry left with nothing to
 * move is dropped. Returns the history to set (with the caller's own update), or nothing when it is unchanged.
 */
function forgetCards(ids: string[]): Pick<CatalogueState, 'past' | 'future'> | undefined {
  const gone = new Set(ids)
  for (const id of gone) {
    delete pendingLayout[id]
    delete inflightLayout[id] // the same object as the save being sent: a failure puts back the rest only
  }
  keep()
  const strip = (list: MoveEntry[]): MoveEntry[] =>
    list.flatMap((e): MoveEntry[] => {
      if (e.kind !== 'positions') return [e]
      const before = Object.fromEntries(Object.entries(e.before).filter(([id]) => !gone.has(id)))
      const after = Object.fromEntries(Object.entries(e.after).filter(([id]) => !gone.has(id)))
      if (Object.keys(after).length === Object.keys(e.after).length && Object.keys(before).length === Object.keys(e.before).length) return [e]
      return Object.keys(after).length || Object.keys(before).length ? [{ ...e, before, after }] : []
    })
  const { past, future } = useCatalogue.getState()
  const next = { past: strip(past), future: strip(future) }
  const same = (a: MoveEntry[], b: MoveEntry[]) => a.length === b.length && a.every((e, i) => e === b[i])
  return same(next.past, past) && same(next.future, future) ? undefined : next
}

/**
 * Mapped moves that were still saving when this tab reloaded (B07-Q5): if a move's fields are what the
 * cards now hold, it landed and nothing is said; if not, say so. Never sent again.
 */
function checkMappedAtReload() {
  const lost = mappedAtReload.filter((changes) => {
    const items = useCatalogue.getState().items
    return !changes.every(({ id, ...fields }) => {
      const it = items[id]?.data as Record<string, unknown> | undefined
      return !!it && Object.entries(fields).every(([k, v]) => JSON.stringify(it[k] ?? null) === JSON.stringify(v ?? null))
    })
  })
  mappedAtReload = []
  if (lost.length) {
    const ids = [...new Set(lost.flat().map((c) => c.id))]
    useCatalogue.setState({ moveError: `Move not saved: the page reloaded while ${ids.join(', ')} ${ids.length === 1 ? 'was' : 'were'} being moved, and the move did not land. Move ${ids.length === 1 ? 'it' : 'them'} again if you still want to.` })
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
  /** Items that list this one in their `related` (the other side of a relation stored once). */
  relatedFrom: Map<string, string[]>
  /** Items whose text links to or mentions this one, in ID order. */
  mentionedBy: Map<string, string[]>
  /** The config the index was built under: what each status means (which is retired, which answered). */
  config: BoardConfig
}

export function buildIndex(itemRecs: Record<string, Rev<Item>>, questionRecs: Record<string, Rev<Question>>, config: BoardConfig = DEFAULT_CONFIG): Index {
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
  const relatedFrom = new Map<string, string[]>()
  const mentionedBy = new Map<string, string[]>()
  const push = (map: Map<string, string[]>, key: string, id: string) => {
    const list = map.get(key) ?? []
    if (!list.includes(id)) list.push(id)
    map.set(key, list)
  }
  for (const it of [...items].sort((a, b) => compareIds(a.id, b.id))) {
    for (const r of it.related) if (r !== it.id) push(relatedFrom, r, it.id)
    for (const t of itemLinkTargets(it)) if (t !== it.id && !isArtifactId(t)) push(mentionedBy, t, it.id)
  }
  return { items, byId, children, epics, questionsFor, questions, relatedFrom, mentionedBy, config }
}

/**
 * What the item sheet lists under Related: the relations either card stores, then the items whose
 * text mentions this one. The lineage and the children are already on the sheet, so they are left out
 * of the mentions, as are items already related.
 */
export function relatedFor(index: Index, item: Item): { related: Item[]; mentionedIn: Item[] } {
  const resolve = (ids: string[]) => ids.map((id) => index.byId.get(id)).filter((it): it is Item => !!it)
  const related = resolve([...new Set([...item.related, ...(index.relatedFrom.get(item.id) ?? [])])].filter((id) => id !== item.id))
  const skip = new Set([item.id, ...related.map((r) => r.id), ...ancestorsOf(index, item.id).map((a) => a.id), ...(index.children.get(item.id) ?? []).map((c) => c.id)])
  const mentionedIn = resolve((index.mentionedBy.get(item.id) ?? []).filter((id) => !skip.has(id)))
  return { related, mentionedIn }
}

/** The project's vocabulary: components, screenshot apps, status wording. */
export const useConfig = () => useCatalogue((s) => s.config)

/** The components to offer: the project's list in its order, or, with none configured, every one the catalogue uses. */
export function useComponents(): string[] {
  const config = useCatalogue((s) => s.config)
  const items = useCatalogue((s) => s.items)
  const artifacts = useCatalogue((s) => s.artifacts)
  return useMemo(() => {
    if (config.components.length) return componentNames(config)
    const used = new Set<string>()
    for (const r of [...Object.values(items), ...Object.values(artifacts)]) for (const c of r.data.components) used.add(c)
    return [...used].sort((a, b) => a.localeCompare(b))
  }, [config, items, artifacts])
}

/**
 * The catalogue index for one catalogue state, built once and shared: every `useIndex` caller (a
 * page can hold thousands, one per Markdown block) gets the same object until the items, questions
 * or config change.
 */
let lastIndex: { items: Record<string, Rev<Item>>; questions: Record<string, Rev<Question>>; config: BoardConfig; index: Index } | null = null
export function sharedIndex(items: Record<string, Rev<Item>>, questions: Record<string, Rev<Question>>, config: BoardConfig): Index {
  if (lastIndex && lastIndex.items === items && lastIndex.questions === questions && lastIndex.config === config) return lastIndex.index
  const index = buildIndex(items, questions, config)
  lastIndex = { items, questions, config, index }
  return index
}

/** The shared index of the catalogue as it is now, outside React (a remark plugin, an event handler). */
export function currentIndex(): Index {
  const { items, questions, config } = useCatalogue.getState()
  return sharedIndex(items, questions, config)
}

export function useIndex(): Index {
  const items = useCatalogue((s) => s.items)
  const questions = useCatalogue((s) => s.questions)
  const config = useCatalogue((s) => s.config)
  return sharedIndex(items, questions, config)
}

/** Is the item retired, or does it sit under a retired card? Either way it is hidden with retired cards. */
export function isRetiredOrUnder(index: Index, it: Item): boolean {
  const seen = new Set<string>()
  for (let cur: Item | undefined = it; cur && !seen.has(cur.id); cur = cur.parent ? index.byId.get(cur.parent) : undefined) {
    if (isRetired(index.config, cur)) return true
    seen.add(cur.id)
  }
  return false
}

/**
 * The index as the app shows it: with `showRetired` off, retired cards (and everything under them)
 * leave `items`, `epics` and every `children` list, so counts, sibling steps and lists never see
 * them. `keep` (the open card) stays in its own sibling list. `byId` and the questions stay
 * complete, so a retired card still resolves by ID.
 */
export function shownIndex(index: Index, showRetired: boolean, keep?: string | null): Index {
  if (showRetired) return index
  const shown = (it: Item) => it.id === keep || !isRetiredOrUnder(index, it)
  const children = new Map<string, Item[]>()
  for (const [id, list] of index.children) {
    const live = list.filter(shown)
    if (live.length) children.set(id, live)
  }
  return { ...index, items: index.items.filter(shown), epics: index.epics.filter(shown), children }
}

/**
 * The catalogue in reading order, for the item sheet's Previous and Next: each epic, then each of
 * its features followed by that feature's stories, then the next epic. Cards whose parent is
 * missing are left out (the sheet falls back to their siblings).
 */
export function readingWalk(index: Index): Item[] {
  const out: Item[] = []
  const seen = new Set<string>()
  const visit = (it: Item) => {
    if (seen.has(it.id)) return
    seen.add(it.id)
    out.push(it)
    for (const c of index.children.get(it.id) ?? []) visit(c)
  }
  for (const e of index.epics) visit(e)
  return out
}

/** `shownIndex` over the live catalogue and the Retired toggle. */
export function useShownIndex(keep?: string | null): Index {
  const index = useIndex()
  const showRetired = useView((s) => s.showRetired)
  return useMemo(() => shownIndex(index, showRetired, keep), [index, showRetired, keep])
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

/** Everything under a card, each once, never the card itself, whatever parent cycles the data holds. */
export function descendantsOf(index: Index, id: string): Item[] {
  const out: Item[] = []
  const seen = new Set([id])
  const walk = (pid: string) => {
    for (const c of index.children.get(pid) ?? []) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      out.push(c)
      walk(c.id)
    }
  }
  walk(id)
  return out
}

export const openQuestionsFor = (index: Index, id: string) => (index.questionsFor.get(id) ?? []).filter((q) => isOpenQuestion(index.config, q))

/* --------------------------------------------------------------- view prefs */

export interface ViewPrefs {
  search: string
  statuses: ItemStatus[]
  components: string[]
  types: ItemType[]
  onlyWithQuestions: boolean
  showRetired: boolean
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
  boardMode: 'mapped',
  collapsedLanes: [],
}

/**
 * Saved view preferences, field by field (`storage.ts`): a field of the wrong type falls back alone.
 * Only types are judged here; whether a saved status code still exists is `dropUnknownStatuses`'s
 * call (B02's rule), never this one's.
 */
const prefsShape = fields<ViewPrefs>(DEFAULT_PREFS, {
  statuses: isStringArray,
  components: isStringArray,
  types: isStringArray,
  onlyWithQuestions: isBoolean,
  showRetired: isBoolean,
  boardMode: oneOf<BoardMode>('freeform', 'mapped'),
  collapsedLanes: isStringArray,
})

function readPrefs(): ViewPrefs {
  return { ...readJson(PREFS_KEY, 'board view settings', DEFAULT_PREFS, prefsShape), search: '' }
}

interface ViewState extends ViewPrefs {
  set: (patch: Partial<ViewPrefs>) => void
  clearFilters: () => void
}

export const useView = create<ViewState>((set, get) => ({
  ...readPrefs(),
  set(patch) {
    set(patch)
    const { set: _s, clearFilters: _c, ...prefs } = get()
    writeJson(PREFS_KEY, prefs) // a private window: prefs just don't persist
  },
  clearFilters() {
    get().set({ search: '', statuses: [], components: [], types: [], onlyWithQuestions: false })
  },
}))

/**
 * A saved status filter naming a status the config no longer has (removed) would hide every card:
 * drop it. Never while a status list is damaged or the file can't be read: that is a moment's
 * breakage, not a removal, and the filter is kept as saved.
 */
function dropUnknownStatuses(config: BoardConfig) {
  if (config.statusState?.statuses.state === 'damaged' || config.statusState?.questionStatuses.state === 'damaged') return
  const v = useView.getState()
  const known = new Set(statusCodes(config, 'item'))
  if (v.statuses.some((s) => !known.has(s))) v.set({ statuses: v.statuses.filter((s) => known.has(s)) })
}

export const filtersActive = (v: ViewPrefs) =>
  !!v.search.trim() || v.statuses.length > 0 || v.components.length > 0 || v.types.length > 0 || v.onlyWithQuestions

/** Does an item pass the current filters? (Retired visibility is handled separately.) */
export function matchesFilters(it: Item, v: ViewPrefs, index: Index): boolean {
  if (v.statuses.length && !v.statuses.includes(it.status)) return false
  if (v.types.length && !v.types.includes(it.type)) return false
  if (v.components.length && !it.components.some((c) => v.components.includes(c))) return false
  if (v.onlyWithQuestions && openQuestionsFor(index, it.id).length === 0) return false
  const q = v.search.trim().toLowerCase()
  if (q && !idMatch(it.id, q)) {
    const hay = `${it.id} ${it.title} ${it.description} ${it.acceptance} ${it.technical} ${it.notes} ${it.sources.join(' ')}`.toLowerCase()
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
  }
  return true
}

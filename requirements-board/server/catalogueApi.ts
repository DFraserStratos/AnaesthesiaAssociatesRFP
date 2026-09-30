/**
 * The catalogue file API, independent of Vite so it can be tested directly.
 * `cataloguePlugin.ts` wires it to the dev server's middleware and watcher.
 *
 *   GET  /api/catalogue          everything, parsed, with a rev per record
 *   PUT  /api/items/:id          { record, baseRev }  409 if the file on disk is not at baseRev
 *   POST /api/items/batch        { changes: [{ id, baseRev, patch }] }  all or nothing (a Mapped board move)
 *   POST /api/items              { type, parent, title, ... }  server assigns the ID
 *   DELETE /api/items/:id       { baseRev, ids }  removes it and everything under it (`ids`: the set the user
 *                                was shown, 409 if that is no longer it) and every reference to them
 *   PUT  /api/questions/:id      { record, baseRev }
 *   DELETE /api/questions/:id   { baseRev }  removes the file; 409 if it changed on disk since baseRev
 *   POST /api/questions          { title, ... }
 *   GET  /api/items/:id/history  the card's timeline: the change journal, backfilled from git
 *   PUT  /api/layout             { positions?: { id: {x,y} | null }, lanes?: string[], firstLane?: string | null }
 *                                positions are a patch (null restores the story-map place); lanes replace the
 *                                list; firstLane renames the implicit first lane (null: back to Unassigned)
 *
 * Every write re-reads the target file first (so an edit made on disk a moment
 * ago is never overwritten), checks the record would survive a round trip,
 * and runs the integrity rules on exactly what will be written.
 */
import { join } from 'node:path'
import { checkCatalogue, issueKey } from '../shared/check.ts'
import { itemRoundTripProblems, normaliseItem, normaliseQuestion, parseItem, parseQuestion, questionRoundTripProblems, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { compareSiblings, nextItemId, nextQuestionId } from '../shared/ids.ts'
import { buildTimeline } from '../shared/history.ts'
import { laneListProblem } from '../shared/move.ts'
import { planDelete } from '../shared/remove.ts'
import { ITEM_TYPES, UNASSIGNED_LANE, firstLaneName, type Layout, type CatalogueEvent, type Item, type ItemType, type Question, type Rev } from '../shared/types.ts'
import {
  FileExistsError,
  deleteItemAssets,
  deleteItemFile,
  deleteQuestionFile,
  fileExistsIn,
  issuesFor,
  itemPath,
  itemsDir,
  layoutPath,
  loadCatalogue,
  questionPath,
  questionsDir,
  readItemFile,
  readLayout,
  readQuestionFile,
  takenIds,
  writeItem,
  writeLayout,
  writeQuestion,
  type LoadResult,
  type LoadedFile,
} from './catalogueFs.ts'
import { gitDirty, gitFileHistory, gitScreenshots } from './gitHistory.ts'
import { NO_JOURNAL, type Journal } from './historyJournal.ts'

export class HttpError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export interface ApiRequest {
  method: string
  path: string
  body?: unknown
  /** Lower-cased request headers; used to refuse cross-site writes. */
  headers?: Record<string, string | undefined>
}

const MAX_CREATE_ATTEMPTS = 5

export interface ApiOptions {
  /** Where card changes are journalled; omitted, nothing is kept (history is git only). */
  journal?: Journal
  /** A card file's git history (injectable for tests). */
  gitHistory?: typeof gitFileHistory
  /** A card's screenshot rewrites in git (injectable for tests). */
  gitScreenshots?: typeof gitScreenshots
}

export function createCatalogueApi(root: string, emit: (e: CatalogueEvent) => void = () => {}, opts: ApiOptions = {}) {
  let state: LoadResult = loadCatalogue(root)
  const journal = opts.journal ?? NO_JOURNAL
  const gitHistory = opts.gitHistory ?? gitFileHistory
  const gitShots = opts.gitScreenshots ?? gitScreenshots
  journal.baseline(state.items)
  journal.screenshots(join(root, 'assets'), { offline: true })

  const itemList = () => Object.values(state.items).map((r) => r.data)
  const questionList = () => Object.values(state.questions).map((r) => r.data)
  const refreshIssues = () => {
    state.issues = issuesFor(state.items, state.questions, state.parseIssues, root, state.layout.lanes)
  }

  /** Refuse a change that would introduce an integrity error not already present. */
  function guard(items: Item[], questions: Question[]) {
    const before = new Set(state.issues.map(issueKey))
    const after = checkCatalogue({ items, questions, fileExists: fileExistsIn(root), lanes: state.layout.lanes })
    const added = after.filter((i) => i.severity === 'error' && !before.has(issueKey(i)))
    if (added.length) throw new HttpError(422, added.map((i) => `${i.id}: ${i.message}`).join('\n'))
  }

  /** Normalise an untrusted record into exactly what will be written, or refuse it. */
  function prepareItem(raw: unknown): Item {
    const item = normaliseItem(raw)
    const problems = itemRoundTripProblems(item)
    if (problems.length) throw new HttpError(422, `${item.id}: ${problems.join('; ')}`)
    return parseItem(serialiseItem(item))
  }
  function prepareQuestion(raw: unknown): Question {
    const q = normaliseQuestion(raw)
    const problems = questionRoundTripProblems(q)
    if (problems.length) throw new HttpError(422, `${q.id}: ${problems.join('; ')}`)
    return parseQuestion(serialiseQuestion(q))
  }

  /**
   * The record as it is on disk right now. If that differs from what we hold
   * (the watcher has not caught up yet), adopt it and tell the clients.
   */
  function checked<T extends { id: string }>(id: string, r: LoadedFile<T>): Rev<T> {
    if (r.missing) throw new HttpError(404, `${id} does not exist`)
    // 422, not 409: a 409 means "someone else changed it", which "Keep mine" can answer; this it cannot.
    if (r.error || !r.record) throw new HttpError(422, `${id}.md cannot be read (${r.error}); fix the file on disk first`)
    if (r.record.data.id !== id) throw new HttpError(422, `${id}.md holds id ${r.record.data.id}; fix the file on disk first`)
    return r.record
  }
  function itemOnDisk(id: string): Rev<Item> {
    const rec = checked(id, readItemFile(itemPath(id, root)))
    if (state.items[id]?.rev !== rec.rev) {
      state.items[id] = rec
      journal.item(rec, 'disk')
      refreshIssues()
      emit({ kind: 'item', id, record: rec })
      emit({ kind: 'issues', issues: state.issues })
    }
    return rec
  }
  function questionOnDisk(id: string): Rev<Question> {
    const rec = checked(id, readQuestionFile(questionPath(id, root)))
    if (state.questions[id]?.rev !== rec.rev) {
      state.questions[id] = rec
      refreshIssues()
      emit({ kind: 'question', id, record: rec })
      emit({ kind: 'issues', issues: state.issues })
    }
    return rec
  }

  function checkBase<T>(current: Rev<T>, id: string, baseRev: unknown) {
    if (typeof baseRev !== 'string' || !baseRev) throw new HttpError(400, 'baseRev is required: send the rev of the version you edited')
    if (current.rev !== baseRev) throw new HttpError(409, `${id} changed on disk since you opened it`, { current })
  }

  function commitItem(item: Item, create: boolean): Rev<Item> {
    const rec = writeItem(item, root, { create })
    state.items[item.id] = rec
    journal.item(rec, 'board')
    refreshIssues()
    emit({ kind: 'item', id: item.id, record: rec })
    emit({ kind: 'issues', issues: state.issues })
    return rec
  }
  function commitQuestion(q: Question, create: boolean): Rev<Question> {
    const rec = writeQuestion(q, root, { create })
    state.questions[q.id] = rec
    refreshIssues()
    emit({ kind: 'question', id: q.id, record: rec })
    emit({ kind: 'issues', issues: state.issues })
    return rec
  }

  /** Create with the next free ID; if another writer takes it first, move on to the next. */
  function create<T extends { id: string }>(taken: () => Set<string>, next: (taken: Set<string>) => T, commit: (rec: T) => Rev<T>): Rev<T> {
    const claimed = taken()
    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
      const rec = next(claimed)
      try {
        return commit(rec)
      } catch (e) {
        if (!(e instanceof FileExistsError)) throw e
        claimed.add(rec.id)
      }
    }
    throw new HttpError(503, 'could not find a free ID; the catalogue folder is changing too fast, try again')
  }

  function refuseCrossSite(req: ApiRequest) {
    if (req.method === 'GET') return
    const h = req.headers ?? {}
    if (!(h['content-type'] ?? '').startsWith('application/json')) throw new HttpError(415, 'writes must be sent as application/json')
    const origin = h.origin
    if (origin && h.host && origin !== `http://${h.host}` && origin !== `https://${h.host}`) {
      throw new HttpError(403, `writes from ${origin} are not allowed`)
    }
  }

  function handle(req: ApiRequest): unknown {
    const { method, path } = req
    const body = (req.body ?? {}) as Record<string, unknown>
    refuseCrossSite(req)

    if (path === '/api/catalogue' && method === 'GET') {
      return { items: state.items, questions: state.questions, layout: state.layout, issues: state.issues }
    }

    let m = /^\/api\/items\/([^/]+)\/history$/.exec(path)
    if (m && method === 'GET') {
      const id = decodeURIComponent(m[1]!)
      if (!state.items[id]) throw new HttpError(404, `${id} does not exist`)
      // The one asynchronous route: git runs in child processes, off the request path of every other call.
      return Promise.all([
        gitHistory(itemPath(id, root)).catch(() => ({ versions: [], dirty: false, working: null })),
        gitDirty(layoutPath(root)),
        gitShots(root, id).catch(() => ({ commits: [], dirty: false })),
      ]).then(([git, layoutDirty, shots]) => ({
        entries: buildTimeline(journal.read(id), { ...git, layoutDirty, screenshots: shots.commits, screenshotsDirty: shots.dirty }),
      }))
    }

    m = /^\/api\/items\/([^/]+)$/.exec(path)
    if (m && method === 'PUT') {
      const id = decodeURIComponent(m[1]!)
      const item = prepareItem(body.record)
      if (item.id !== id) throw new HttpError(400, 'the record id does not match the URL')
      const current = itemOnDisk(id)
      checkBase(current, id, body.baseRev)
      if (current.data.type !== item.type) throw new HttpError(422, `${id}: the type of an item cannot change`)
      guard([...itemList().filter((i) => i.id !== id), item], questionList())
      return commitItem(item, false)
    }

    if (m && method === 'DELETE') {
      const id = decodeURIComponent(m[1]!)
      // The plan rewrites records across the catalogue, so plan it from the folder as it is right now.
      syncFromDisk()
      checkBase(itemOnDisk(id), id, body.baseRev)
      const plan = planDelete(itemList(), questionList(), id)
      const doomed = plan.doomed.map((i) => i.id)
      const shown = Array.isArray(body.ids) ? [...(body.ids as unknown[])].map(String).sort() : null
      if (!shown) throw new HttpError(400, 'ids is required: send the items you are deleting, the item and everything under it')
      if (JSON.stringify(shown) !== JSON.stringify([...doomed].sort())) {
        throw new HttpError(409, `what sits under ${id} changed since you asked; look again before deleting`)
      }
      const rewrites = new Map(plan.items.map((it) => [it.id, prepareItem(it)]))
      const qRewrites = new Map(plan.questions.map((q) => [q.id, prepareQuestion(q)]))
      guard(
        [...itemList().filter((i) => !doomed.includes(i.id) && !rewrites.has(i.id)), ...rewrites.values()],
        [...questionList().filter((q) => !qRewrites.has(q.id)), ...qRewrites.values()],
      )

      // References first, then the files: a failure part way leaves dangling links at worst, never a lost record.
      const records = [...rewrites.values()].map((item) => commitItem(item, false))
      const questions = [...qRewrites.values()].map((q) => commitQuestion(q, false))
      const keptImages = new Set(itemList().filter((i) => !doomed.includes(i.id)).flatMap((i) => i.images.map((img) => img.src.split('/')[1])))
      for (const x of doomed) {
        deleteItemFile(x, root)
        if (!keptImages.has(x)) deleteItemAssets(x, root)
        delete state.items[x]
        journal.forget(x)
        emit({ kind: 'item', id: x, record: null })
      }
      const onDisk = readLayout(root)
      if (!onDisk.error && doomed.some((x) => onDisk.layout.positions[x])) {
        const positions = { ...onDisk.layout.positions }
        for (const x of doomed) delete positions[x]
        state.layout = { ...onDisk.layout, positions }
        writeLayout(state.layout, root)
        emit({ kind: 'layout', layout: state.layout })
      }
      refreshIssues()
      emit({ kind: 'issues', issues: state.issues })
      return { deleted: doomed, records, questions }
    }

    if (path === '/api/items/batch' && method === 'POST') {
      // Check every record first, then write them all: a move never lands half done.
      const changes = Array.isArray(body.changes) ? (body.changes as Record<string, unknown>[]) : null
      if (!changes) throw new HttpError(400, 'changes must be a list of { id, baseRev, patch }')
      const next = new Map<string, Item>()
      for (const c of changes) {
        const id = typeof c?.id === 'string' ? c.id : ''
        if (!id) throw new HttpError(400, 'every change needs an id')
        if (next.has(id)) throw new HttpError(400, `${id} appears twice in one batch`)
        const current = itemOnDisk(id)
        checkBase(current, id, c.baseRev)
        const patch = (c.patch ?? {}) as Record<string, unknown>
        const item = prepareItem({ ...current.data, ...patch, id })
        if (item.type !== current.data.type) throw new HttpError(422, `${id}: the type of an item cannot change`)
        next.set(id, item)
      }
      if (!next.size) return { records: [] }
      guard([...itemList().filter((i) => !next.has(i.id)), ...next.values()], questionList())
      return { records: [...next.values()].map((item) => commitItem(item, false)) }
    }

    if (path === '/api/items' && method === 'POST') {
      const type = body.type as ItemType
      if (!ITEM_TYPES.includes(type)) throw new HttpError(422, `type must be one of ${ITEM_TYPES.join(', ')}`)
      const parentId = typeof body.parent === 'string' && body.parent ? body.parent : null
      const parent = parentId ? (state.items[parentId]?.data ?? null) : null
      if (parentId && !parent) throw new HttpError(422, `parent ${parentId} does not exist`)
      const siblings = itemList().filter((i) => i.parent === (parent?.id ?? null)).sort(compareSiblings)
      return create<Item>(
        () => new Set([...takenIds(itemsDir(root)), ...Object.keys(state.items)]),
        (taken) => {
          let id: string
          try {
            id = nextItemId(taken, type, parent)
          } catch (e) {
            throw new HttpError(422, (e as Error).message)
          }
          const item = prepareItem({
            status: 'Proposed',
            components: parent?.components ?? [],
            ...body,
            id,
            type,
            parent: parent?.id ?? null,
            title: String(body.title ?? '').trim() || 'Untitled',
            order: (siblings.at(-1)?.order ?? 0) + 1,
            images: [],
            extra: {},
          })
          guard([...itemList(), item], questionList())
          return item
        },
        (item) => commitItem(item, true),
      )
    }

    m = /^\/api\/questions\/([^/]+)$/.exec(path)
    if (m && method === 'PUT') {
      const id = decodeURIComponent(m[1]!)
      const q = prepareQuestion(body.record)
      if (q.id !== id) throw new HttpError(400, 'the record id does not match the URL')
      checkBase(questionOnDisk(id), id, body.baseRev)
      guard(itemList(), [...questionList().filter((x) => x.id !== id), q])
      return commitQuestion(q, false)
    }
    if (m && method === 'DELETE') {
      const id = decodeURIComponent(m[1]!)
      checkBase(questionOnDisk(id), id, body.baseRev)
      deleteQuestionFile(id, root)
      delete state.questions[id]
      refreshIssues()
      emit({ kind: 'question', id, record: null })
      emit({ kind: 'issues', issues: state.issues })
      return { id }
    }

    if (path === '/api/questions' && method === 'POST') {
      return create<Question>(
        () => new Set([...takenIds(questionsDir(root)), ...Object.keys(state.questions)]),
        (taken) => {
          const q = prepareQuestion({
            status: 'Open',
            ...body,
            id: nextQuestionId(taken),
            title: String(body.title ?? '').trim() || 'Untitled question',
            answer: '',
            extra: {},
          })
          guard(itemList(), [...questionList(), q])
          return q
        },
        (q) => commitQuestion(q, true),
      )
    }

    if (path === '/api/layout' && method === 'PUT') {
      // Patch what is on disk now, not what we last synced: a git pull may have rewritten it a moment ago.
      const onDisk = readLayout(root)
      if (onDisk.error) throw new HttpError(422, 'board-layout.json cannot be read; fix or delete it before moving cards')
      const patch = (body.positions ?? {}) as Record<string, { x: number; y: number } | null>
      const positions = { ...onDisk.layout.positions }
      for (const [id, p] of Object.entries(patch)) {
        if (p === null) delete positions[id]
        else if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) positions[id] = { x: Math.round(p.x), y: Math.round(p.y) }
      }
      const moved = Object.keys(patch).filter((id) => state.items[id])
      if (body.lanes !== undefined && !Array.isArray(body.lanes)) throw new HttpError(422, 'lanes must be a list of names')
      const lanes = body.lanes !== undefined ? (body.lanes as string[]) : onDisk.layout.lanes
      let firstLane = onDisk.layout.firstLane
      if (body.firstLane !== undefined) {
        if (body.firstLane !== null && typeof body.firstLane !== 'string') throw new HttpError(422, 'firstLane must be a name or null')
        firstLane = typeof body.firstLane === 'string' && body.firstLane !== UNASSIGNED_LANE ? body.firstLane : undefined
      }
      const problem = laneListProblem([firstLaneName({ firstLane }), ...lanes])
      if (problem) throw new HttpError(422, problem)
      const lanesChanged = JSON.stringify(lanes) !== JSON.stringify(state.layout.lanes)
      state.layout = { positions, lanes } as Layout
      if (firstLane) state.layout.firstLane = firstLane
      state.layoutReadable = true
      writeLayout(state.layout, root)
      for (const id of moved) journal.position(id, onDisk.layout.positions[id] ?? null, positions[id] ?? null, 'board')
      emit({ kind: 'layout', layout: state.layout })
      if (lanesChanged) {
        refreshIssues() // lane names feed the swimlane check
        emit({ kind: 'issues', issues: state.issues })
      }
      return state.layout
    }

    throw new HttpError(404, `no route for ${method} ${path}`)
  }

  /** Re-read the folder and emit an event for every record whose file changed. */
  function syncFromDisk() {
    // Screenshot files carry no rev in the catalogue: the journal fingerprints them itself.
    journal.screenshots(join(root, 'assets'))
    const prev = state
    const next = loadCatalogue(root)
    const events: CatalogueEvent[] = []
    for (const id of new Set([...Object.keys(prev.items), ...Object.keys(next.items)])) {
      if (prev.items[id]?.rev !== next.items[id]?.rev) {
        events.push({ kind: 'item', id, record: next.items[id] ?? null })
        if (next.items[id]) journal.item(next.items[id]!, 'disk')
      }
    }
    for (const id of new Set([...Object.keys(prev.questions), ...Object.keys(next.questions)])) {
      if (prev.questions[id]?.rev !== next.questions[id]?.rev) events.push({ kind: 'question', id, record: next.questions[id] ?? null })
    }
    if (JSON.stringify(prev.layout) !== JSON.stringify(next.layout)) {
      events.push({ kind: 'layout', layout: next.layout })
      for (const id of new Set([...Object.keys(prev.layout.positions), ...Object.keys(next.layout.positions)])) {
        if (next.items[id]) journal.position(id, prev.layout.positions[id] ?? null, next.layout.positions[id] ?? null, 'disk')
      }
    }
    const issuesChanged = JSON.stringify(prev.issues) !== JSON.stringify(next.issues)
    state = next
    if (!events.length && !issuesChanged) return
    events.push({ kind: 'issues', issues: next.issues })
    for (const e of events) emit(e)
  }

  return { handle, syncFromDisk, getState: () => state }
}

export type CatalogueApi = ReturnType<typeof createCatalogueApi>

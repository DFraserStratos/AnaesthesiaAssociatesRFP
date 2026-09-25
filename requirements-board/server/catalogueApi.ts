/**
 * The catalogue file API, independent of Vite so it can be tested directly.
 * `cataloguePlugin.ts` wires it to the dev server's middleware and watcher.
 *
 *   GET  /api/catalogue          everything, parsed, with a rev per record
 *   PUT  /api/items/:id          { record, baseRev }  409 if the file on disk is not at baseRev
 *   POST /api/items              { type, parent, title, ... }  server assigns the ID
 *   PUT  /api/questions/:id      { record, baseRev }
 *   POST /api/questions          { title, ... }
 *   PUT  /api/layout             { positions: { id: {x,y} | null } }  a patch; null restores the story-map place
 *
 * Every write re-reads the target file first (so an edit made on disk a moment
 * ago is never overwritten), checks the record would survive a round trip,
 * and runs the integrity rules on exactly what will be written.
 */
import { checkCatalogue, issueKey } from '../shared/check.ts'
import { itemRoundTripProblems, normaliseItem, normaliseQuestion, parseItem, parseQuestion, questionRoundTripProblems, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { compareSiblings, nextItemId, nextQuestionId } from '../shared/ids.ts'
import { ITEM_TYPES, type CatalogueEvent, type Item, type ItemType, type Question, type Rev } from '../shared/types.ts'
import {
  FileExistsError,
  fileExistsIn,
  issuesFor,
  itemPath,
  itemsDir,
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

export function createCatalogueApi(root: string, emit: (e: CatalogueEvent) => void = () => {}) {
  let state: LoadResult = loadCatalogue(root)

  const itemList = () => Object.values(state.items).map((r) => r.data)
  const questionList = () => Object.values(state.questions).map((r) => r.data)
  const refreshIssues = () => {
    state.issues = issuesFor(state.items, state.questions, state.parseIssues, root)
  }

  /** Refuse a change that would introduce an integrity error not already present. */
  function guard(items: Item[], questions: Question[]) {
    const before = new Set(state.issues.map(issueKey))
    const after = checkCatalogue({ items, questions, fileExists: fileExistsIn(root) })
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

    let m = /^\/api\/items\/([^/]+)$/.exec(path)
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
      state.layout = { positions }
      state.layoutReadable = true
      writeLayout(state.layout, root)
      emit({ kind: 'layout', layout: state.layout })
      return state.layout
    }

    throw new HttpError(404, `no route for ${method} ${path}`)
  }

  /** Re-read the folder and emit an event for every record whose file changed. */
  function syncFromDisk() {
    const prev = state
    const next = loadCatalogue(root)
    const events: CatalogueEvent[] = []
    for (const id of new Set([...Object.keys(prev.items), ...Object.keys(next.items)])) {
      if (prev.items[id]?.rev !== next.items[id]?.rev) events.push({ kind: 'item', id, record: next.items[id] ?? null })
    }
    for (const id of new Set([...Object.keys(prev.questions), ...Object.keys(next.questions)])) {
      if (prev.questions[id]?.rev !== next.questions[id]?.rev) events.push({ kind: 'question', id, record: next.questions[id] ?? null })
    }
    if (JSON.stringify(prev.layout) !== JSON.stringify(next.layout)) events.push({ kind: 'layout', layout: next.layout })
    const issuesChanged = JSON.stringify(prev.issues) !== JSON.stringify(next.issues)
    state = next
    if (!events.length && !issuesChanged) return
    events.push({ kind: 'issues', issues: next.issues })
    for (const e of events) emit(e)
  }

  return { handle, syncFromDisk, getState: () => state }
}

export type CatalogueApi = ReturnType<typeof createCatalogueApi>

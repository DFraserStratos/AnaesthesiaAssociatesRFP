/**
 * The catalogue file API, independent of Vite so it can be tested directly.
 * `cataloguePlugin.ts` wires it to the dev server's middleware and watcher.
 *
 *   GET  /api/catalogue          everything, parsed, with a rev per record (config.revs: one per Settings section;
 *                                layout.lanesRev: the lane list's), every screenshot's version (`assets`), and the
 *                                server's run (`epoch`) and last delivery (`seq`) it is current to
 *   GET  /api/ping               { epoch, seq }: the server answers (the board asks while offline)
 *   PUT  /api/items/:id          { patch, baseRev, base? }  the fields changed, laid over the file as it is now
 *                                (or, until B06, { record, baseRev }: a whole record, refused on any disk change)
 *   POST /api/items/batch        { changes: [{ id, baseRev, patch, base? }] }  all or nothing (a Mapped board move)
 *   POST /api/items              { type, parent, title, ... }  server assigns the ID
 *   DELETE /api/items/:id       { baseRev, ids }  removes it and everything under it (`ids`: the set the user
 *                                was shown, 409 if that is no longer it) and every reference to them
 *   PUT  /api/questions/:id      { patch, baseRev, base? }  (or { record, baseRev })
 *   DELETE /api/questions/:id   { baseRev }  removes the file; 409 if it changed on disk since baseRev
 *   POST /api/questions          { title, ... }
 *   GET  /api/items/:id/history  the card's timeline: the change journal, backfilled from git
 *   GET  /api/artifacts/:id/history  an artifact's timeline from git: its sidecar and its file
 *   GET  /api/diff/commits       the commits that changed catalogue records, newest first along HEAD's first
 *                                parents, each with its first parent, and HEAD (Diff review)
 *   GET  /api/diff?from=&to=     every record that differs between two commits, or a commit and the files
 *                                on disk (`to=worktree`), with both versions (Diff review)
 *   GET  /api/diff/count?from=&to=  { available, count }: how many records differ, minor changes left out
 *                                (From defaults to HEAD, To to `worktree`): the Diff review tab's count
 *   GET  /api/diff/auto          the Diff review's default: HEAD against the files on disk, or with nothing
 *                                there what the last catalogue commit changed (`jumped: true`)
 *   PUT  /api/artifacts/:id      { patch, baseRev, base? }  its details only (title, kind, status, supersededBy,
 *                                date, author, components, sources, description); or { record, baseRev }
 *   PUT  /api/config             { project?, components?, statuses?, questionStatuses?, bases? }  replaces those
 *                                sections of board.config.json (the rest of the file is kept); `bases` are the
 *                                `config.revs` each was edited from (409 if one changed on disk); 422 if a list
 *                                breaks the rules or drops a status in use
 *   PUT  /api/layout             { positions?: { id: {x,y} | null }, lanes?: string[], firstLane?: string | null, lanesRev? }
 *                                positions are a patch (null restores the story-map place) and never refused for
 *                                the lane list; lanes replace the list; firstLane renames the implicit first lane
 *                                (null: back to Unassigned); with lanesRev, 409 if the lane list changed on disk
 *   POST /api/lanes              { op: 'rename' | 'remove', from, to?, lanesRev, stories: { id: rev } }  renames or
 *                                removes a named lane and rewrites the swimlane of every story in it, all or nothing
 *
 * The write protocol (B05, accepted decision 20; PROGRESS.md has the contract):
 * - A record write sends the fields it changed (`patch`), the rev it edited (`baseRev`) and optionally the
 *   value each patched field had when it started (`base`). The patch is laid over the file as it is on
 *   disk now: fields it does not name stay as the file has them. If the file moved on since `baseRev`, a
 *   write with `base` still applies unless one of its own fields changed there; any other is a 409.
 * - A 409 carries `current` (the record as it is now, with its rev), `collisions` (the patched fields that
 *   changed on disk, when `base` was sent) and, for a write of several records, `blocked` (each blocker's
 *   id, current copy and collisions). 422: a refusal "Keep mine" cannot answer; 400: a malformed request.
 * - A write that changes nothing writes nothing (no journal entry, no event) and returns the record as is.
 * - Saves edit the file in place: only the changed fields' lines change; a change that would lose data is 422.
 * - A write of several files lands whole: on a failure part way the files already written are put back.
 * - One write request runs the integrity check once after writing and sends one delivery (B07).
 *
 * Deliveries (`catalogue:changed`, B07): every change one re-sync or one write request makes, merged into one
 * message (`shared/delivery.ts`), numbered by `seq` within this process (`epoch`). A re-sync given the paths
 * the watcher saw re-reads only those files (`planSync`, `partialLoad`); anything it cannot judge alone reads
 * the whole folder.
 *
 * Every write re-reads the target file first (so an edit made on disk a moment
 * ago is never overwritten), checks the record would survive a round trip,
 * and runs the integrity rules on exactly what will be written.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { addChange, isEmptyBody, type DeliveryBody } from '../shared/delivery.ts'
import { stripBom } from '../shared/bom.ts'
import { checkCatalogue, issueKey } from '../shared/check.ts'
import { artifactRoundTripProblems, itemRoundTripProblems, normaliseItem, normaliseQuestion, parseItem, parseQuestion, questionRoundTripProblems, serialiseItem, serialiseQuestion, withArtifactDetails } from '../shared/files.ts'
import { LossyEditError, editItemText, editQuestionText } from '../shared/inPlace.ts'
import { applyPatch, collisions, patchProblem, sameValue as same, type RecordKind } from '../shared/patch.ts'
import { compareSiblings, nextItemId, nextQuestionId } from '../shared/ids.ts'
import { buildArtifactTimeline, buildTimeline, diffItems } from '../shared/history.ts'
import { RECODES_FILE, STATUS_FIELDS, defaultStatus, highestCode, nextStatusCode, normaliseStatus, readStatusList, statusCodes, type StatusDef, type StatusField, type StatusKind } from '../shared/statuses.ts'
import { parseArtifact, revOf } from '../shared/files.ts'
import { ACCENT_PATTERN, CONFIG_FILE, CONFIG_SECTIONS, configRevs, parseConfig } from '../shared/config.ts'
import { addedProblems, laneListProblems, lanesRevOf } from '../shared/move.ts'
import { planDelete } from '../shared/remove.ts'
import { ITEM_TYPES, UNASSIGNED_LANE, firstLaneName, type Artifact, type ArtifactRec, type Layout, type AssetVersions, type CatalogueChange, type CatalogueDelivery, type Issue, type Item, type ItemType, type Question, type Rev } from '../shared/types.ts'
import {
  artifactCheck,
  artifactSidecarPath,
  claimNext,
  configIssues,
  configPath,
  deleteItemAssets,
  deleteItemFile,
  deleteQuestionFile,
  fileExistsIn,
  formatJson,
  imageLinkOut,
  inFileOrder,
  issuesFor,
  itemPath,
  judgeRecordFile,
  layoutIssues,
  layoutPath,
  loadCatalogue,
  parseIssuesOf,
  questionPath,
  questionsDir,
  readArtifactFile,
  readConfig,
  readItemFile,
  readLayout,
  readQuestionFile,
  readRecodes,
  RECORD_DIRS,
  storiesDir,
  takenIds,
  withMeta,
  writeArtifact,
  writeAtomic,
  writeItem,
  writeLayout,
  writeQuestion,
  type LoadedFile,
  type LoadResult,
  type RecordFileKind,
} from './catalogueFs.ts'
import { artifactInfo, artifactPath } from './artifactFiles.ts'
import { gitAssetHistory, gitDirty, gitFileHistory, gitScreenshots } from './gitHistory.ts'
import { DiffRefError, createDiffReader } from './catalogueDiff.ts'
import { memoryJournal, type Journal } from './historyJournal.ts'

export class HttpError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

/**
 * A record ID taken from a URL path: every route that takes one reads it through this. A malformed
 * escape is a client error, and so is an ID that could name another file once decoded (a path
 * separator, `.` or `..`, or a control character), refused before any file is read. No ID pattern is
 * assumed, so every ID a catalogue can hold still routes.
 */
export function idFromPath(segment: string): string {
  let id: string
  try {
    id = decodeURIComponent(segment)
  } catch {
    throw new HttpError(400, 'the URL has a malformed % escape')
  }
  if (!id || id === '.' || id === '..' || /[\\/\u0000-\u001f\u007f]/.test(id)) throw new HttpError(400, `${JSON.stringify(id)} is not a record ID`)
  return id
}

export interface ApiRequest {
  method: string
  path: string
  body?: unknown
  /** Lower-cased request headers; used to refuse cross-site writes. */
  headers?: Record<string, string | undefined>
  /** The URL's query parameters (read by the GET routes that take any). */
  query?: Record<string, string>
}

const MAX_CREATE_ATTEMPTS = 5

export interface ApiOptions {
  /** Where card changes are journalled; omitted, nothing is kept (history is git only). */
  journal?: Journal
  /** A card file's git history (injectable for tests). */
  gitHistory?: typeof gitFileHistory
  /** A card's screenshot rewrites in git (injectable for tests). */
  gitScreenshots?: typeof gitScreenshots
  /** An artifact file's versions in git (injectable for tests). */
  gitAssetHistory?: typeof gitAssetHistory
  /**
   * The caller reports every file change in the folder (and in artifacts' files) through
   * `worktreeChanged()`, as the dev server's watcher does, so the Diff review can keep its
   * comparisons with the files on disk until the next change. Otherwise it reads them afresh.
   */
  watched?: boolean
  /** Called before each file of a write of several files (tests make one fail, to prove the put-back). */
  beforeWrite?: (file: string) => void
}

/** A record that stopped a write of several: its current copy and, when the client sent base values, the fields that clash. */
interface Blocker {
  id: string
  current: unknown
  collisions?: string[]
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** The 409 for a record changed on disk since the client's base. */
function conflict(id: string, current: unknown, cols: string[]): HttpError {
  const what = cols.length ? `: ${cols.join(', ')} changed there too` : ''
  return new HttpError(409, `${id} changed on disk since you opened it${what}`, { current, ...(cols.length ? { collisions: cols } : {}) })
}

/** The 409 for a write of several records: every blocker, the first also as `current`. */
function blockedBy(message: string, blocked: Blocker[]): HttpError {
  return new HttpError(409, message, { current: blocked[0]!.current, blocked })
}

export function createCatalogueApi(root: string, emit: (d: CatalogueDelivery) => void = () => {}, opts: ApiOptions = {}) {
  let state: LoadResult = loadCatalogue(root)
  const journal = opts.journal ?? memoryJournal()
  const gitHistory = opts.gitHistory ?? gitFileHistory
  const gitShots = opts.gitScreenshots ?? gitScreenshots
  const gitAsset = opts.gitAssetHistory ?? gitAssetHistory
  const diffs = createDiffReader(root, { watched: opts.watched })
  journal.baseline(state.items)
  /** Every screenshot's version (D-10), as the snapshot gives it; a re-sync updates the folders that changed. */
  let assets: AssetVersions = byPath(Object.entries(journal.screenshots(join(root, 'assets'), { offline: true })))

  const itemList = () => Object.values(state.items).map((r) => r.data)
  const readVoice = (): { text: string | null; rev: string | null } => {
    try {
      const text = stripBom(readFileSync(join(root, 'VOICE.md'), 'utf8')) // its mark is kept on save (writeAtomic)
      return { text, rev: revOf(text) }
    } catch {
      return { text: null, rev: null }
    }
  }
  const questionList = () => Object.values(state.questions).map((r) => r.data)
  /** After writing a well-formed layout: drop its read problems. True when there were any. */
  const layoutRewritten = () => {
    const had = state.sources.layout.length > 0
    if (had) {
      state.sources.layout = []
      state.parseIssues = parseIssuesOf(state.sources)
    }
    return had
  }
  /*
   * The check resolves every image's real path (B01's symbolic-link warning), the larger part of its cost
   * on a big catalogue. The answers are kept until that image's folder changes (or a full re-read).
   */
  const links = new Map<string, string | null>()
  const linkOutOf = imageLinkOut(root)
  const cachedLinkOut = (rel: string) => {
    if (!links.has(rel)) links.set(rel, linkOutOf(rel))
    return links.get(rel)!
  }
  const refreshIssues = () => {
    state.issues = issuesFor(state.items, state.questions, state.parseIssues, root, state.layout.lanes, state.artifacts, state.config, state.layout.firstLane, cachedLinkOut)
  }

  /*
   * One write request, one check, one delivery (FINDINGS R-26, R-159). While a write request runs, its
   * changes are merged into `pending` and a change to the records only marks the issues stale; at the end
   * the issues are checked once and everything goes to the tabs as one delivery. A re-sync builds its own
   * delivery the same way. Each delivery is numbered (`seq`) within this server process (`epoch`), and the
   * snapshot says which number it is current to, so a tab never lets an older snapshot win.
   */
  const epoch = randomUUID()
  let seq = 0
  const send = (body: DeliveryBody) => {
    if (!isEmptyBody(body)) emit({ epoch, seq: ++seq, ...body })
  }
  let pending: { body: DeliveryBody; stale: boolean; issues: boolean } | null = null
  const notify = (c: CatalogueChange) => {
    if (pending) addChange(pending.body, c)
    else {
      const body: DeliveryBody = {}
      addChange(body, c)
      send(body)
    }
  }
  /** Records changed: the issues need checking again, and the tabs need the result. */
  const issuesChanged = () => {
    if (pending) {
      pending.stale = true
      pending.issues = true
      return
    }
    refreshIssues()
    send({ issues: state.issues })
  }
  /** Bring the issues up to date with records adopted earlier in this request (before judging a change against them). */
  const freshIssues = () => {
    if (!pending?.stale) return
    refreshIssues()
    pending.stale = false
  }
  function flush() {
    const p = pending
    pending = null
    if (!p) return
    if (p.stale) refreshIssues()
    if (p.issues) p.body.issues = state.issues
    send(p.body)
  }

  /** Refuse a change that would introduce an integrity error not already present. */
  function guard(items: Item[], questions: Question[], artifacts: Record<string, Rev<Artifact>> = state.artifacts, layout: Pick<Layout, 'lanes' | 'firstLane'> = state.layout) {
    freshIssues()
    const before = new Set(state.issues.map(issueKey))
    let after: Issue[]
    try {
      after = checkCatalogue({ items, questions, fileExists: fileExistsIn(root), lanes: layout.lanes, firstLane: layout.firstLane, config: state.config, ...artifactCheck(artifacts, root) })
    } catch (e) {
      // The check's own backstop, as `issuesFor` words it: a write is refused only if the load had no such error.
      after = [{ severity: 'error', id: 'check', message: `the check could not finish (${(e as Error)?.message ?? String(e)}); the other issues may be incomplete` }]
    }
    const added = after.filter((i) => i.severity === 'error' && !before.has(issueKey(i)))
    if (added.length) throw new HttpError(422, added.map((i) => `${i.id}: ${i.message}`).join('\n'))
  }

  /**
   * A status written by the board comes from the project's own list. The check says so for a healthy
   * list; this also holds while a list is damaged (when the check is quiet about cards). A card keeping
   * the status it already has is never refused for it.
   */
  function guardStatus(kind: StatusKind, id: string, status: string, was?: string) {
    if (status === was) return
    const codes = statusCodes(state.config, kind)
    if (!status) throw new HttpError(422, `${id}: the ${STATUS_FIELDS[kind]} list in ${CONFIG_FILE} has no single default status, so new ${kind === 'item' ? 'cards' : 'questions'} can't start anywhere until it is fixed`)
    if (!codes.includes(status)) throw new HttpError(422, `${id}: status "${status}" is not one of the project's statuses (${codes.join(', ') || 'none readable'})`)
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
      notify({ kind: 'item', id, record: rec })
      issuesChanged()
    }
    return rec
  }
  function questionOnDisk(id: string): Rev<Question> {
    const rec = checked(id, readQuestionFile(questionPath(id, root)))
    if (state.questions[id]?.rev !== rec.rev) {
      state.questions[id] = rec
      notify({ kind: 'question', id, record: rec })
      issuesChanged()
    }
    return rec
  }

  function artifactOnDisk(id: string): ArtifactRec {
    const rec = checked(id, readArtifactFile(artifactSidecarPath(id, root)))
    if (state.artifacts[id]?.rev !== rec.rev) {
      state.artifacts[id] = { ...rec, meta: artifactInfo(rec.data, root).meta }
      notify({ kind: 'artifact', id, record: state.artifacts[id]! })
      issuesChanged()
    }
    return state.artifacts[id]!
  }

  function checkBase<T>(current: Rev<T>, id: string, baseRev: unknown) {
    if (typeof baseRev !== 'string' || !baseRev) throw new HttpError(400, 'baseRev is required: send the rev of the version you edited')
    if (current.rev !== baseRev) throw new HttpError(409, `${id} changed on disk since you opened it`, { current })
  }

  /**
   * Whether a patch can still apply to the record as it is now: null when it can, else the colliding
   * fields (empty when the client sent only a rev, so any change on disk blocks it).
   */
  function staleness<T extends Item | Question | Artifact>(kind: RecordKind, current: Rev<T>, c: { baseRev?: unknown; base?: unknown; patch: Record<string, unknown> }): string[] | null {
    if (typeof c.baseRev !== 'string' || !c.baseRev) throw new HttpError(400, 'baseRev is required: send the rev of the version you edited')
    if (current.rev === c.baseRev) return null
    if (c.base === undefined) return []
    if (!isObject(c.base)) throw new HttpError(400, 'base must be an object: the value each patched field had when you started')
    let cols: string[]
    try {
      cols = collisions(kind, current.data, c.base, c.patch)
    } catch (e) {
      throw new HttpError(400, (e as Error).message)
    }
    return cols.length ? cols : null
  }

  /** A patch from the request, checked for shape (400) and, for an item, an unchanged type (422). */
  function patchOf(kind: RecordKind, id: string, raw: unknown, current: Item | Question | Artifact): Record<string, unknown> {
    const problem = patchProblem(kind, raw, id)
    if (problem) throw new HttpError(400, problem)
    const patch = raw as Record<string, unknown>
    if (kind === 'item' && patch.type !== undefined && patch.type !== (current as Item).type) throw new HttpError(422, `${id}: the type of an item cannot change`)
    return patch
  }

  /** A record file written in place; a change that would lose data is refused (422), nothing written. */
  function lossless<T>(id: string, write: () => T): T {
    try {
      return write()
    } catch (e) {
      if (e instanceof LossyEditError) throw new HttpError(422, `${id}: ${e.message}`)
      throw e
    }
  }
  const writeItemRec = (item: Item, create = false) => lossless(item.id, () => writeItem(item, root, { create }))
  const writeQuestionRec = (q: Question, create = false) => lossless(q.id, () => writeQuestion(q, root, { create }))
  /** A dry run of an in-place save, so a write of several files refuses a lossy one before writing any (B05-REQ-12). */
  function dryRun<T>(id: string, file: string, rec: T, edit: (text: string, r: T) => string) {
    lossless(id, () => {
      try {
        edit(stripBom(readFileSync(file, 'utf8')), rec)
      } catch (e) {
        if (e instanceof LossyEditError) throw e // a missing or unreadable file is the writer's to handle, as before
      }
    })
  }
  const itemStep = (item: Item, done: (rec: Rev<Item>) => void) => ({ file: itemPath(item.id, root), write: () => done(writeItemRec(item)), check: () => dryRun(item.id, itemPath(item.id, root), item, editItemText) })
  const questionStep = (q: Question, done: (rec: Rev<Question>) => void) => ({ file: questionPath(q.id, root), write: () => done(writeQuestionRec(q)), check: () => dryRun(q.id, questionPath(q.id, root), q, editQuestionText) })

  /** A written card enters the state, the journal and the events. */
  function recordItem(rec: Rev<Item>): Rev<Item> {
    state.items[rec.data.id] = rec
    journal.item(rec, 'board')
    notify({ kind: 'item', id: rec.data.id, record: rec })
    issuesChanged()
    return rec
  }
  function recordQuestion(rec: Rev<Question>): Rev<Question> {
    state.questions[rec.data.id] = rec
    notify({ kind: 'question', id: rec.data.id, record: rec })
    issuesChanged()
    return rec
  }

  /**
   * Write several files as one change (FINDINGS R-56, B05-REQ-12). Every precondition is checked before
   * this runs; if a write then fails part way, the files already written are put back as they were (a
   * removed file comes back). The error says whether that worked and names any file it could not restore.
   */
  function writeAll(steps: { file: string; write: () => void; check?: () => void }[]) {
    // Every step's own refusal (a change it cannot write without loss) is found before any file changes.
    for (const step of steps) step.check?.()
    const done: { file: string; before: Buffer | null }[] = []
    for (const step of steps) {
      let before: Buffer | null = null
      try {
        before = readFileSync(step.file)
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
          const lost = putBack(done)
          throw new HttpError(500, `${relative(root, step.file)} cannot be read (${(e as Error).message}); ${lost.length ? `these files could not be put back: ${lost.join(', ')}` : 'nothing was changed'}`)
        }
      }
      try {
        opts.beforeWrite?.(step.file)
        step.write()
      } catch (e) {
        // A step that wrote its file and then failed is put back too.
        let now: Buffer | null = null
        try {
          now = readFileSync(step.file)
        } catch {
          now = null
        }
        if (now === null ? before !== null : before === null || !now.equals(before)) done.push({ file: step.file, before })
        const lost = putBack(done)
        if (e instanceof HttpError && !lost.length) throw e
        throw new HttpError(500, `the change stopped part way (${(e as Error).message}); ${lost.length ? `these files could not be put back and may hold part of it: ${lost.join(', ')}` : 'every file it had already written was put back'}`)
      }
      done.push({ file: step.file, before })
    }
  }
  function putBack(done: { file: string; before: Buffer | null }[]): string[] {
    const lost: string[] = []
    for (const d of [...done].reverse()) {
      try {
        if (d.before === null) rmSync(d.file, { force: true })
        else {
          const tmp = `${d.file}.${process.pid}.tmp`
          writeFileSync(tmp, d.before)
          renameSync(tmp, d.file)
        }
      } catch {
        lost.push(relative(root, d.file))
      }
    }
    return lost
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
    if (req.method === 'GET') return route(req)
    // A write changes files on disk: comparisons with them are stale, now and once it is done.
    diffs.touched()
    pending = { body: {}, stale: false, issues: false }
    try {
      const out = route(req)
      return out instanceof Promise ? out.finally(() => diffs.touched()) : out
    } finally {
      flush() // even after a refusal: records adopted from disk on the way are still news
    }
  }

  const refError = (e: unknown) => {
    throw e instanceof DiffRefError ? new HttpError(400, e.message) : e
  }

  function route(req: ApiRequest): unknown {
    const { method, path } = req
    const body = (req.body ?? {}) as Record<string, unknown>
    refuseCrossSite(req)

    if (path === '/api/catalogue' && method === 'GET') {
      return { epoch, seq, items: state.items, questions: state.questions, artifacts: state.artifacts, layout: state.layout, config: state.config, issues: state.issues, assets }
    }
    // The tab asks this while it is offline, to learn when the server is back (and whether it restarted).
    if (path === '/api/ping' && method === 'GET') return { epoch, seq }

    // Diff review: read-only git, in child processes like the history routes.
    if (path === '/api/diff/commits' && method === 'GET') return diffs.commits()
    if (path === '/api/diff/count' && method === 'GET') return diffs.count(req.query?.from || undefined, req.query?.to || undefined).catch(refError)
    if (path === '/api/diff/auto' && method === 'GET') return diffs.auto().catch(refError)
    if (path === '/api/diff' && method === 'GET') {
      const q = req.query ?? {}
      if (!q.from || !q.to) throw new HttpError(400, 'from and to are required')
      return diffs.diff(q.from, q.to).catch(refError)
    }

    const a = /^\/api\/artifacts\/([^/]+)\/history$/.exec(path)
    if (a && method === 'GET') {
      const id = idFromPath(a[1]!)
      const rec = Object.hasOwn(state.artifacts, id) ? state.artifacts[id] : undefined
      if (!rec) throw new HttpError(404, `${id} does not exist`)
      const file = rec.data.file ? artifactPath(rec.data.file, root) : null
      return Promise.all([
        gitHistory(artifactSidecarPath(id, root), parseArtifact).catch(() => ({ versions: [], dirty: false, working: null })),
        file ? gitAsset(file).catch(() => null) : Promise.resolve(null),
      ]).then(([git, asset]) => ({ entries: buildArtifactTimeline(git, asset) }))
    }

    const ap = /^\/api\/artifacts\/([^/]+)$/.exec(path)
    if (ap && method === 'PUT') {
      // Only an artifact's details: whatever else the record carries, its file, regions and source stay as on disk.
      const id = idFromPath(ap[1]!)
      const current = artifactOnDisk(id)
      let next: Artifact
      if (body.patch !== undefined) {
        const patch = patchOf('artifact', id, body.patch, current.data)
        const cols = staleness('artifact', current, { baseRev: body.baseRev, base: body.base, patch })
        if (cols) throw conflict(id, current, cols)
        next = withArtifactDetails(current.data, patch)
      } else {
        checkBase(current, id, body.baseRev)
        const sent = (body.record ?? {}) as Record<string, unknown>
        if (sent.id !== undefined && sent.id !== id) throw new HttpError(400, 'the record id does not match the URL')
        next = withArtifactDetails(current.data, sent)
      }
      const problems = artifactRoundTripProblems(next)
      if (problems.length) throw new HttpError(422, `${id}: ${problems.join('; ')}`)
      if (same(next, current.data)) return current // nothing changed: nothing written (B05-REQ-05)
      guard(itemList(), questionList(), { ...state.artifacts, [id]: { data: next, rev: '' } })
      const rec = lossless(id, () => writeArtifact(next, root))
      state.artifacts[id] = rec
      notify({ kind: 'artifact', id, record: rec })
      issuesChanged()
      return rec
    }

    let m = /^\/api\/items\/([^/]+)\/history$/.exec(path)
    if (m && method === 'GET') {
      const id = idFromPath(m[1]!)
      if (!Object.hasOwn(state.items, id)) throw new HttpError(404, `${id} does not exist`)
      // The one asynchronous route: git runs in child processes, off the request path of every other call.
      return Promise.all([
        gitHistory(itemPath(id, root)).catch(() => ({ versions: [], dirty: false, working: null })),
        gitDirty(layoutPath(root)),
        gitShots(root, id).catch(() => ({ commits: [], dirty: false, ended: [] })),
      ]).then(([git, layoutDirty, shots]) => {
        // Versions from before a status recode store the old value: compare as today's codes, so a relabel is no change.
        const recodes = readRecodes(root)
        const now = (it: Item): Item => ({ ...it, status: normaliseStatus(recodes, 'item', it.status) })
        const diff = (a: Item, b: Item) => diffItems(now(a), now(b))
        return { entries: buildTimeline(journal.read(id), { ...git, layoutDirty, screenshots: shots.commits, screenshotsDirty: shots.dirty, screenshotsEnded: shots.ended }, diff) }
      })
    }

    m = /^\/api\/items\/([^/]+)$/.exec(path)
    if (m && method === 'PUT') {
      const id = idFromPath(m[1]!)
      let item: Item
      let current: Rev<Item>
      if (body.patch !== undefined) {
        current = itemOnDisk(id)
        const patch = patchOf('item', id, body.patch, current.data)
        const cols = staleness('item', current, { baseRev: body.baseRev, base: body.base, patch })
        if (cols) throw conflict(id, current, cols)
        item = prepareItem(applyPatch('item', current.data, patch))
      } else {
        // Until B06: a whole record, refused on any change on disk; written as the fields that differ from the file.
        item = prepareItem(body.record)
        if (item.id !== id) throw new HttpError(400, 'the record id does not match the URL')
        current = itemOnDisk(id)
        checkBase(current, id, body.baseRev)
        if (current.data.type !== item.type) throw new HttpError(422, `${id}: the type of an item cannot change`)
      }
      guardStatus('item', id, item.status, current.data.status)
      if (same(item, current.data)) return current // nothing changed: nothing written (B05-REQ-05)
      guard([...itemList().filter((i) => i.id !== id), item], questionList())
      return recordItem(writeItemRec(item))
    }

    if (m && method === 'DELETE') {
      const id = idFromPath(m[1]!)
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

      // References first, then the files: all or nothing, and in this order a crash part way leaves
      // dangling links at worst, never a lost record.
      const records: Rev<Item>[] = []
      const questions: Rev<Question>[] = []
      writeAll([
        ...[...rewrites.values()].map((item) => itemStep(item, (rec) => void records.push(rec))),
        ...[...qRewrites.values()].map((q) => questionStep(q, (rec) => void questions.push(rec))),
        ...doomed.map((x) => ({ file: itemPath(x, root), write: () => deleteItemFile(x, root) })),
      ])
      for (const rec of records) recordItem(rec)
      for (const rec of questions) recordQuestion(rec)
      const keptImages = new Set(itemList().filter((i) => !doomed.includes(i.id)).flatMap((i) => i.images.map((img) => img.src.split('/')[1])))
      for (const x of doomed) {
        if (!keptImages.has(x)) deleteItemAssets(x, root)
        delete state.items[x]
        journal.forget(x)
        notify({ kind: 'item', id: x, record: null })
      }
      // The records are gone: a layout that can't be tidied never turns that into a failure.
      try {
        const onDisk = readLayout(root)
        if (!onDisk.error && doomed.some((x) => onDisk.layout.positions[x])) {
          const positions = { ...onDisk.layout.positions }
          for (const x of doomed) delete positions[x]
          state.layout = { ...onDisk.layout, positions }
          writeLayout(state.layout, root)
          layoutRewritten()
          notify({ kind: 'layout', layout: state.layout })
        }
      } catch (e) {
        console.warn(`[catalogue] deleted ${doomed.join(', ')}, but board-layout.json could not be tidied: ${(e as Error).message}`)
      }
      issuesChanged()
      return { deleted: doomed, records, questions }
    }

    if (path === '/api/items/batch' && method === 'POST') {
      // Check every record first, then write them all: a move never lands half done.
      const changes = Array.isArray(body.changes) ? (body.changes as Record<string, unknown>[]) : null
      if (!changes) throw new HttpError(400, 'changes must be a list of { id, baseRev, patch }')
      const next = new Map<string, Item>()
      const blocked: Blocker[] = []
      for (const c of changes) {
        const id = typeof c?.id === 'string' ? c.id : ''
        if (!id) throw new HttpError(400, 'every change needs an id')
        if (next.has(id) || blocked.some((b) => b.id === id)) throw new HttpError(400, `${id} appears twice in one batch`)
        const current = itemOnDisk(id)
        const patch = patchOf('item', id, c.patch ?? {}, current.data)
        const cols = staleness('item', current, { baseRev: c.baseRev, base: c.base, patch })
        if (cols) {
          blocked.push({ id, current, ...(cols.length ? { collisions: cols } : {}) })
          continue
        }
        const item = prepareItem(applyPatch('item', current.data, patch))
        guardStatus('item', id, item.status, current.data.status)
        next.set(id, item)
      }
      if (blocked.length) throw blockedBy(`${blocked.map((b) => b.id).join(', ')} changed on disk since you looked`, blocked)
      if (!next.size) return { records: [] }
      guard([...itemList().filter((i) => !next.has(i.id)), ...next.values()], questionList())
      const changed = [...next.values()].filter((item) => !same(item, state.items[item.id]!.data))
      const written = new Map<string, Rev<Item>>()
      writeAll(changed.map((item) => itemStep(item, (rec) => void written.set(item.id, rec))))
      for (const rec of written.values()) recordItem(rec)
      return { records: [...next.keys()].map((id) => written.get(id) ?? state.items[id]!) }
    }

    if (path === '/api/items' && method === 'POST') {
      const type = body.type as ItemType
      if (!ITEM_TYPES.includes(type)) throw new HttpError(422, `type must be one of ${ITEM_TYPES.join(', ')}`)
      const parentId = typeof body.parent === 'string' && body.parent ? body.parent : null
      const parent = parentId ? (state.items[parentId]?.data ?? null) : null
      if (parentId && !parent) throw new HttpError(422, `parent ${parentId} does not exist`)
      const siblings = itemList().filter((i) => i.parent === (parent?.id ?? null)).sort(compareSiblings)
      let written: Rev<Item> | null = null
      const made = claimNext<Item>(
        new Set([...takenIds(storiesDir(root)), ...Object.keys(state.items)]),
        (taken) => {
          let id: string
          try {
            id = nextItemId(taken, type, parent)
          } catch (e) {
            throw new HttpError(422, (e as Error).message)
          }
          const item = prepareItem({
            status: defaultStatus(state.config, 'item'),
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
          guardStatus('item', id, item.status)
          guard([...itemList(), item], questionList())
          return item
        },
        (item) => {
          written = writeItemRec(item, true)
        },
        MAX_CREATE_ATTEMPTS,
      )
      if (!made || !written) throw new HttpError(503, 'could not find a free ID; the requirements folder is changing too fast, try again')
      // A new card is never a restore: whatever journal an earlier card with this ID left is set aside (R-54).
      journal.forget(made.id)
      return recordItem(written)
    }

    m = /^\/api\/questions\/([^/]+)$/.exec(path)
    if (m && method === 'PUT') {
      const id = idFromPath(m[1]!)
      let q: Question
      let current: Rev<Question>
      if (body.patch !== undefined) {
        current = questionOnDisk(id)
        const patch = patchOf('question', id, body.patch, current.data)
        const cols = staleness('question', current, { baseRev: body.baseRev, base: body.base, patch })
        if (cols) throw conflict(id, current, cols)
        q = prepareQuestion(applyPatch('question', current.data, patch))
      } else {
        q = prepareQuestion(body.record)
        if (q.id !== id) throw new HttpError(400, 'the record id does not match the URL')
        current = questionOnDisk(id)
        checkBase(current, id, body.baseRev)
      }
      guardStatus('question', id, q.status, current.data.status)
      if (same(q, current.data)) return current // nothing changed: nothing written (B05-REQ-05)
      guard(itemList(), [...questionList().filter((x) => x.id !== id), q])
      return recordQuestion(writeQuestionRec(q))
    }
    if (m && method === 'DELETE') {
      const id = idFromPath(m[1]!)
      checkBase(questionOnDisk(id), id, body.baseRev)
      deleteQuestionFile(id, root)
      delete state.questions[id]
      notify({ kind: 'question', id, record: null })
      issuesChanged()
      return { id }
    }

    if (path === '/api/questions' && method === 'POST') {
      let written: Rev<Question> | null = null
      const made = claimNext<Question>(
        new Set([...takenIds(questionsDir(root)), ...Object.keys(state.questions)]),
        (taken) => {
          const q = prepareQuestion({
            status: defaultStatus(state.config, 'question'),
            ...body,
            id: nextQuestionId(taken),
            title: String(body.title ?? '').trim() || 'Untitled question',
            answer: '',
            extra: {},
          })
          guardStatus('question', q.id, q.status)
          guard(itemList(), [...questionList(), q])
          return q
        },
        (q) => {
          written = writeQuestionRec(q, true)
        },
        MAX_CREATE_ATTEMPTS,
      )
      if (!made || !written) throw new HttpError(503, 'could not find a free ID; the requirements folder is changing too fast, try again')
      return recordQuestion(written)
    }

    // How requirements are written (VOICE.md): read and edited on the Settings page, and by agents as a file.
    if (path === '/api/voice' && method === 'GET') return readVoice()
    if (path === '/api/voice' && method === 'PUT') {
      const current = readVoice()
      // Saved over what was shown only: an agent may have rewritten the file since.
      if ((body.baseRev ?? null) !== current.rev) throw new HttpError(409, 'VOICE.md changed on disk since you opened it', { current: { data: current.text, rev: current.rev } })
      if (typeof body.text !== 'string') throw new HttpError(400, 'text must be a string')
      const text = body.text.endsWith('\n') ? body.text : `${body.text}\n`
      writeAtomic(join(root, 'VOICE.md'), text)
      return { text, rev: revOf(text) }
    }

    if (path === '/api/config' && method === 'PUT') {
      // Patch the file as it is on disk now: only the fields sent change, every other setting stays as written.
      let raw: Record<string, unknown> = {}
      try {
        raw = JSON.parse(stripBom(readFileSync(configPath(root), 'utf8'))) as Record<string, unknown>
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw new HttpError(422, 'board.config.json cannot be read; fix it on disk first')
      }
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(422, 'board.config.json must hold an object; fix it on disk first')
      // A section edited from a version the file no longer holds is a conflict, not an overwrite (R-45, accepted decision 20).
      if (body.bases !== undefined && !isObject(body.bases)) throw new HttpError(400, 'bases must map each section you send to the config.revs value you edited')
      const bases = (body.bases ?? {}) as Record<string, unknown>
      const revs = configRevs(raw)
      const stale = CONFIG_SECTIONS.filter((k) => body[k] !== undefined && bases[k] !== undefined && bases[k] !== revs[k])
      if (stale.length) {
        const disk = parseConfig(JSON.stringify(raw), readRecodes(root)).config
        const blocked = stale.map((k) => ({ id: k, current: { data: disk[k], rev: revs[k] } }))
        throw new HttpError(409, `${stale.join(', ')} changed in ${CONFIG_FILE} since you opened Settings`, { section: stale[0], current: blocked[0]!.current, blocked })
      }
      const next = { ...raw }
      const problems: string[] = []
      const fields: [StatusField, StatusKind, { status: string }[]][] = [
        ['statuses', 'item', itemList()],
        ['questionStatuses', 'question', questionList()],
      ]
      for (const [field, kind, records] of fields) {
        if (body[field] === undefined) continue
        // Judge against the list as it is on disk now, never the server's copy: a damaged list is
        // never saved over (its codes would change meaning), and in-use and reuse are disk facts.
        const onDisk = parseConfig(JSON.stringify({ [field]: raw[field], removedStatuses: raw.removedStatuses }), readRecodes(root))
        const diskState = onDisk.config.statusState[field]
        if (diskState.state === 'damaged') {
          problems.push(`${CONFIG_FILE}: ${field} is damaged, so status saves are refused until it is fixed in the file:\n${diskState.problems.join('\n')}`)
          continue
        }
        const diskList = onDisk.config[field]
        const { list, problems: bad } = readStatusList(body[field], kind, field)
        problems.push(...bad)
        // A status still on a card can't go: its files would name a status the board no longer knows.
        const kept = new Set(list.map((d) => d.code))
        const dropped = new Map<string, number>()
        for (const r of records) if (!kept.has(r.status)) dropped.set(r.status, (dropped.get(r.status) ?? 0) + 1)
        for (const [code, n] of dropped) {
          const was = diskList.find((d) => d.code === code)
          if (was) problems.push(`${field}: ${was.label} is still used by ${n} ${kind === 'item' ? 'item' : 'question'}${n === 1 ? '' : 's'}`)
        }
        // A code is never reissued: a new entry takes a code past every code the list has used.
        const highWater = highestCode([String(diskState.highWater)], records.map((r) => r.status))
        for (const d of list)
          if (!diskList.some((x) => x.code === d.code) && Number(d.code) <= highWater)
            problems.push(`${field}: "${d.label}" can't take code ${d.code}, which was used before (removed, recoded or held by a card): use ${nextStatusCode([String(highWater)], list.map((x) => x.code))}`)
        // A removed status keeps its code spent and its last label, so old versions storing it never read as another.
        const removed = diskList.filter((d) => !kept.has(d.code))
        if (removed.length) {
          const was = next.removedStatuses
          if (onDisk.problems.some((p) => p.startsWith('removedStatuses must') || p.startsWith(`removedStatuses.${field}`))) {
            problems.push(`${CONFIG_FILE}: removedStatuses is not readable; fix it in the file before removing a status`)
            continue
          }
          // Entries already there stay exactly as written; only the newly removed are appended.
          const wasList = ((was ?? {}) as Record<string, unknown>)[field]
          const prior = Array.isArray(wasList) ? wasList : []
          const added = removed.filter((d) => !onDisk.config.removedStatuses[field].some((r) => r.code === d.code)).map((d) => ({ code: Number(d.code), label: d.label }))
          next.removedStatuses = { ...((was ?? {}) as Record<string, unknown>), [field]: [...prior, ...added] }
        }
        next[field] = list.map(clean)
      }
      if (body.project !== undefined) {
        const v = body.project as Record<string, unknown> | null
        const name = typeof v?.name === 'string' ? v.name.trim() : ''
        const accent = typeof v?.accent === 'string' ? v.accent.trim().toLowerCase() : ''
        if (accent && !ACCENT_PATTERN.test(accent)) problems.push(`project: the accent must be a colour like #2f5dbe, not ${accent}`)
        // The board's name and the locale are fixed now; a file that still names them is tidied on save.
        const was: Record<string, unknown> = { ...((raw.project ?? {}) as Record<string, unknown>) }
        delete was.locale
        delete was.accent
        next.project = { ...was, name, ...(accent ? { accent } : {}) }
        delete next.board
      }
      if (body.components !== undefined) {
        const { config: parsed, problems: bad } = parseConfig(JSON.stringify({ components: body.components }))
        problems.push(...bad)
        // A component still on a card can't go: its files would name an area the board no longer knows.
        const kept = new Set(parsed.components.map((c) => c.name))
        const dropped = new Map<string, number>()
        for (const it of [...itemList(), ...Object.values(state.artifacts).map((r) => r.data)]) for (const c of it.components) if (!kept.has(c)) dropped.set(c, (dropped.get(c) ?? 0) + 1)
        for (const [name, n] of dropped)
          if (state.config.components.some((c) => c.name === name)) problems.push(`components: ${name} is still used by ${n} card${n === 1 ? '' : 's'} or artifact${n === 1 ? '' : 's'}`)
        next.components = parsed.components
      }
      if (problems.length) throw new HttpError(422, problems.join('\n'))
      writeAtomic(configPath(root), formatJson(next))
      const read = readConfig(root)
      state.config = read.config
      state.sources.config = configIssues(read.problems)
      state.parseIssues = parseIssuesOf(state.sources)
      notify({ kind: 'config', config: state.config })
      issuesChanged()
      return state.config
    }

    if (path === '/api/layout' && method === 'PUT') {
      // Patch what is on disk now, not what we last synced: a git pull may have rewritten it a moment ago.
      const onDisk = readLayout(root)
      if (onDisk.error) throw new HttpError(422, 'board-layout.json cannot be read; fix or delete it before moving cards')
      const patch = (body.positions ?? {}) as Record<string, { x: number; y: number } | null>
      const positions = { ...onDisk.layout.positions }
      for (const [id, p] of Object.entries(patch)) {
        if (p === null) delete positions[id]
        // Never a position for a card with no file (FINDINGS R-57): judged on disk, not on what was last
        // synced, so a card an agent created a moment ago keeps the place it was dragged to.
        else if (Number.isFinite(p?.x) && Number.isFinite(p?.y) && existsSync(itemPath(id, root))) positions[id] = { x: Math.round(p.x), y: Math.round(p.y) }
      }
      const moved = Object.keys(patch).filter((id) => state.items[id])
      let lanes = onDisk.layout.lanes
      let firstLane = onDisk.layout.firstLane
      // The lane rules judge only a write that changes the lane list, and refuse only a problem it adds:
      // a drag is never refused for a lane problem it did not cause (FINDINGS R-55).
      if (body.lanes !== undefined || body.firstLane !== undefined) {
        if (body.lanesRev !== undefined && body.lanesRev !== onDisk.layout.lanesRev) throw lanesChangedOnDisk(onDisk.layout)
        if (body.lanes !== undefined && !Array.isArray(body.lanes)) throw new HttpError(422, 'lanes must be a list of names')
        if (body.lanes !== undefined) lanes = body.lanes as string[]
        if (body.firstLane !== undefined) {
          if (body.firstLane !== null && typeof body.firstLane !== 'string') throw new HttpError(422, 'firstLane must be a name or null')
          firstLane = typeof body.firstLane === 'string' && body.firstLane !== UNASSIGNED_LANE ? body.firstLane : undefined
        }
        const added = addedProblems(laneListProblems([firstLaneName(onDisk.layout), ...onDisk.layout.lanes]), laneListProblems([firstLaneName({ firstLane }), ...lanes]))
        if (added.length) throw new HttpError(422, added.join('\n'))
      }
      const lanesChanged = JSON.stringify(lanes) !== JSON.stringify(state.layout.lanes) || firstLane !== state.layout.firstLane
      state.layout = { positions, lanes, ...(firstLane ? { firstLane } : {}), lanesRev: lanesRevOf({ firstLane, lanes }) } as Layout
      state.layoutReadable = true
      writeLayout(state.layout, root) // only well-formed positions: damaged entries are dropped here (accepted decision 17)
      for (const id of moved) journal.position(id, onDisk.layout.positions[id] ?? null, positions[id] ?? null, 'board')
      notify({ kind: 'layout', layout: state.layout })
      if (layoutRewritten() || lanesChanged) issuesChanged() // lane names feed the swimlane and lane-list checks
      return state.layout
    }

    if (path === '/api/lanes' && method === 'POST') {
      // Renaming or removing a named lane rewrites its stories and the lane list as one change (FINDINGS R-56).
      const op = body.op
      if (op !== 'rename' && op !== 'remove') throw new HttpError(400, "op must be 'rename' or 'remove'")
      const from = typeof body.from === 'string' ? body.from : ''
      if (!from) throw new HttpError(400, 'from must name the lane')
      const to = typeof body.to === 'string' ? body.to : ''
      if (op === 'rename' && !to) throw new HttpError(400, 'to must name the lane it becomes')
      if (!isObject(body.stories)) throw new HttpError(400, 'stories must map every story in the lane to the rev you hold')
      const sent = body.stories
      syncFromDisk() // plan from the folder as it is right now
      const onDisk = readLayout(root)
      if (onDisk.error) throw new HttpError(422, 'board-layout.json cannot be read; fix or delete it before changing lanes')
      if (typeof body.lanesRev !== 'string' || !body.lanesRev) throw new HttpError(400, 'lanesRev is required: send layout.lanesRev as you last saw it')
      if (onDisk.layout.lanesRev !== body.lanesRev) throw lanesChangedOnDisk(onDisk.layout)
      const inLane = itemList().filter((i) => i.type === 'story' && i.swimlane === from)
      const listed = onDisk.layout.lanes.includes(from)
      // A name only stories use (not in the list yet) is a lane too: renaming it makes it one.
      if (!listed && !inLane.length) throw new HttpError(409, `lane "${from}" is no longer on the board`, { current: { data: lanesOf(onDisk.layout), rev: onDisk.layout.lanesRev } })
      const blocked: Blocker[] = []
      for (const it of inLane) if (sent[it.id] !== state.items[it.id]!.rev) blocked.push({ id: it.id, current: state.items[it.id]! })
      for (const id of Object.keys(sent)) if (!inLane.some((i) => i.id === id)) blocked.push({ id, current: Object.hasOwn(state.items, id) ? state.items[id]! : null })
      if (blocked.length) throw blockedBy(`the stories in "${from}" changed on disk since you looked; look again`, blocked)
      if (op === 'rename' && from === to) return { records: [], layout: state.layout }
      const lanes = op === 'remove' ? onDisk.layout.lanes.filter((l) => l !== from) : listed ? onDisk.layout.lanes.map((l) => (l === from ? to : l)) : [...onDisk.layout.lanes, to]
      if (op === 'rename') {
        // Renaming onto an existing lane is a lane-rule refusal (a merge is B11's).
        const added = addedProblems(laneListProblems([firstLaneName(onDisk.layout), ...onDisk.layout.lanes]), laneListProblems([firstLaneName(onDisk.layout), ...lanes]))
        if (added.length) throw new HttpError(422, `lane not renamed: ${added.join('\n')}`)
      }
      const stories = inLane.map((it) => prepareItem({ ...it, swimlane: op === 'rename' ? to : null }))
      const layout: Layout = { ...onDisk.layout, lanes, lanesRev: lanesRevOf({ firstLane: onDisk.layout.firstLane, lanes }) }
      const ids = new Set(stories.map((s) => s.id))
      guard([...itemList().filter((i) => !ids.has(i.id)), ...stories], questionList(), state.artifacts, layout)
      const records: Rev<Item>[] = []
      writeAll([
        ...stories.map((item) => itemStep(item, (rec) => void records.push(rec))),
        { file: layoutPath(root), write: () => writeLayout(layout, root) },
      ])
      for (const rec of records) recordItem(rec)
      state.layout = layout
      state.layoutReadable = true
      layoutRewritten()
      notify({ kind: 'layout', layout: state.layout })
      issuesChanged()
      return { records, layout: state.layout }
    }

    throw new HttpError(404, `no route for ${method} ${path}`)
  }

  /**
   * Which of the server's inputs the changed paths touch: the record files to re-read, the layout, the
   * config, the screenshot folders, the artifacts whose file changed. Mirrors what `loadCatalogue` reads,
   * so any other path (notes, change logs, reference files no artifact shows) feeds nothing. Null when a
   * path cannot be judged one file at a time (the folder itself, a record folder): read everything.
   */
  function planSync(paths: readonly string[]): SyncPlan | null {
    const rootAbs = resolve(root)
    const plan: SyncPlan = { files: [], layout: false, config: false, assets: new Set(), artifactFiles: new Set() }
    const fileOf = new Map<string, string[]>()
    for (const [id, rec] of Object.entries(state.artifacts)) {
      const abs = rec.data.file ? artifactPath(rec.data.file, root) : null
      if (abs) fileOf.set(abs, [...(fileOf.get(abs) ?? []), id])
    }
    for (const p of paths) {
      const abs = resolve(p)
      // The path is an artifact's file, or a folder holding one (moved or removed as a whole).
      for (const [file, ids] of fileOf) if (file === abs || file.startsWith(abs + sep)) for (const id of ids) plan.artifactFiles.add(id)
      if (abs === rootAbs) return null
      if (!abs.startsWith(rootAbs + sep)) continue // an artifact's file outside the folder (handled above)
      const parts = abs.slice(rootAbs.length + 1).split(sep)
      const kind = RECORD_FOLDERS.get(parts[0]!)
      if (parts.length === 1) {
        if (parts[0] === 'board-layout.json') plan.layout = true
        else if (parts[0] === CONFIG_FILE || parts[0] === RECODES_FILE) plan.config = true
        else if (kind || parts[0] === 'assets') return null // a whole folder came or went
      } else if (kind) {
        const name = parts[1]!
        if (parts.length === 2 && name.endsWith('.md') && !name.startsWith('.')) plan.files.push({ kind, name: name.slice(0, -3), file: abs })
      } else if (parts[0] === 'assets') plan.assets.add(parts[1]!)
    }
    return plan
  }

  /**
   * The state after re-reading only what `plan` names, the rest kept as it is (FINDINGS R-158). Records
   * come from the state (so the board's own writes since the last sync stay), parse issues per source.
   * The result equals a fresh `loadCatalogue` of the folder as it is now (tests/resync.test.ts proves it).
   */
  function partialLoad(plan: SyncPlan, shots: AssetVersions): LoadResult {
    const sources = { ...state.sources, item: new Map(state.sources.item), question: new Map(state.sources.question), artifact: new Map(state.sources.artifact) }
    const records = { item: { ...state.items }, question: { ...state.questions }, artifact: { ...state.artifacts } } as Record<RecordFileKind, Record<string, Rev<Item | Question | Artifact> | ArtifactRec>>
    const sidecars: Record<string, Rev<Artifact>> = {}
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
    // A changed screenshot folder always re-runs the check: what it judges (an image's existence, a nested
    // file, a symbolic link) can change with no screenshot's version changing (B07 review).
    let changed = plan.assets.size > 0 || plan.artifactFiles.size > 0 || shots !== assets
    for (const { kind, name, file } of plan.files) {
      const j = judgeRecordFile(kind, file)
      const was = records[kind][name]
      if (j?.issues.length) sources[kind].set(name, j.issues)
      else sources[kind].delete(name)
      if (j?.record) {
        if (kind === 'artifact') sidecars[name] = j.record as Rev<Artifact>
        else records[kind][name] = j.record
      } else delete records[kind][name]
      if (was?.rev !== j?.record?.rev || !same(j?.issues ?? [], state.sources[kind].get(name) ?? [])) changed = true
    }
    // The layout and config are read here, so the echo of the board's own drag or Settings save costs no check.
    let { layout, layoutReadable, config } = state
    if (plan.layout) {
      const read = readLayout(root)
      sources.layout = layoutIssues(read)
      if (!same(read.layout, layout) || layoutReadable !== !read.error || !same(sources.layout, state.sources.layout)) changed = true
      layout = read.layout
      layoutReadable = !read.error
    }
    if (plan.config) {
      const read = readConfig(root)
      sources.config = configIssues(read.problems)
      if (!same(read.config, config) || !same(sources.config, state.sources.config)) changed = true
      config = read.config
    }
    if (!changed) return state // only echoes of what the server already holds
    // Artifacts whose sidecar or file changed take their file facts afresh; the rest keep theirs.
    for (const id of plan.artifactFiles) if (records.artifact[id] && !sidecars[id]) sidecars[id] = records.artifact[id] as Rev<Artifact>
    Object.assign(records.artifact, withMeta(sidecars, root))
    const items = inFileOrder(records.item) as Record<string, Rev<Item>>
    const questions = inFileOrder(records.question) as Record<string, Rev<Question>>
    const artifacts = inFileOrder(records.artifact) as Record<string, ArtifactRec>
    const parseIssues = parseIssuesOf(sources)
    return { items, questions, artifacts, layout, layoutReadable, config, sources, parseIssues, issues: issuesFor(items, questions, parseIssues, root, layout.lanes, artifacts, config, layout.firstLane, cachedLinkOut) }
  }

  /** The state and screenshot versions as on disk now: re-reading only `paths` when it can, else everything. */
  function readChanges(paths?: readonly string[]): { next: LoadResult; shots: AssetVersions } {
    const plan = paths ? planSync(paths) : null
    if (plan) {
      try {
        // Screenshot files carry no rev in the catalogue: the journal fingerprints them itself.
        let shots = assets
        for (const rel of links.keys()) if (plan.assets.has(rel.split('/')[1]!)) links.delete(rel)
        if (plan.assets.size) {
          const kept = Object.entries(assets).filter(([src]) => !plan.assets.has(src.split('/')[1]!))
          const merged = byPath([...kept, ...Object.entries(journal.screenshots(join(root, 'assets'), { ids: plan.assets }))])
          if (JSON.stringify(merged) !== JSON.stringify(assets)) shots = merged
        }
        return { next: partialLoad(plan, shots), shots }
      } catch (e) {
        console.warn(`[catalogue] re-reading the changed files failed (${(e as Error).message}); reading the whole folder`)
      }
    }
    links.clear()
    const shots = byPath(Object.entries(journal.screenshots(join(root, 'assets'))))
    return { next: loadCatalogue(root), shots: JSON.stringify(shots) === JSON.stringify(assets) ? assets : shots }
  }

  /**
   * Bring the state up to the folder as it is on disk and send the tabs one delivery of what changed.
   * `paths`: the files the watcher saw change, re-read alone (FINDINGS R-158); without them, or when they
   * cannot be judged one at a time, the whole folder is read again (the fallback, and what start-up and the
   * delete and lane routes use).
   */
  function syncFromDisk(paths?: readonly string[]) {
    diffs.touched()
    const prev = state
    const { next, shots } = readChanges(paths)
    if (next === prev && shots === assets) return
    const events: CatalogueChange[] = []
    // A card left out of the last load because its file could not be read was there all along: fixed, it is no reappearance.
    const unreadable = new Set(prev.parseIssues.filter((i) => i.severity === 'error').map((i) => i.id))
    for (const id of new Set([...Object.keys(prev.items), ...Object.keys(next.items)])) {
      if (prev.items[id]?.rev !== next.items[id]?.rev) {
        events.push({ kind: 'item', id, record: next.items[id] ?? null })
        // A card whose file was gone and comes back as a different record (not a restore) starts a new life (R-54).
        if (next.items[id]) journal.item(next.items[id]!, 'disk', { reappeared: !prev.items[id] && !unreadable.has(id) })
      }
    }
    for (const id of new Set([...Object.keys(prev.questions), ...Object.keys(next.questions)])) {
      if (prev.questions[id]?.rev !== next.questions[id]?.rev) events.push({ kind: 'question', id, record: next.questions[id] ?? null })
    }
    for (const id of new Set([...Object.keys(prev.artifacts), ...Object.keys(next.artifacts)])) {
      const was = prev.artifacts[id]
      const now = next.artifacts[id]
      if (was?.rev !== now?.rev || JSON.stringify(was?.meta) !== JSON.stringify(now?.meta)) events.push({ kind: 'artifact', id, record: now ?? null })
    }
    if (JSON.stringify(prev.layout) !== JSON.stringify(next.layout)) {
      events.push({ kind: 'layout', layout: next.layout })
      for (const id of new Set([...Object.keys(prev.layout.positions), ...Object.keys(next.layout.positions)])) {
        if (next.items[id]) journal.position(id, prev.layout.positions[id] ?? null, next.layout.positions[id] ?? null, 'disk')
      }
    }
    if (JSON.stringify(prev.config) !== JSON.stringify(next.config)) events.push({ kind: 'config', config: next.config })
    // Screenshots rewritten, added or removed: their new versions, null for one gone (D-10).
    const moved: Record<string, string | null> = {}
    for (const src of new Set([...Object.keys(assets), ...Object.keys(shots)])) if (assets[src] !== shots[src]) moved[src] = shots[src] ?? null
    if (Object.keys(moved).length) events.push({ kind: 'assets', assets: moved })
    const issuesDiffer = JSON.stringify(prev.issues) !== JSON.stringify(next.issues)
    state = next
    assets = shots
    if (pending) pending.stale = false // the load just checked everything
    if (!events.length && !issuesDiffer) return
    if (pending) {
      for (const e of events) addChange(pending.body, e)
      pending.issues = true
      return
    }
    const body: DeliveryBody = {}
    for (const e of events) addChange(body, e)
    if (issuesDiffer) body.issues = next.issues
    send(body)
  }

  return {
    handle,
    syncFromDisk,
    getState: () => state,
    /** A file in the folder, or an artifact's file elsewhere, changed on disk (see `ApiOptions.watched`). */
    worktreeChanged: () => diffs.touched(),
    /** Start reading the Diff review's commit list in the background (see `DiffReader.warm`). */
    warmDiff: () => diffs.warm(),
  }
}

export type CatalogueApi = ReturnType<typeof createCatalogueApi>

/** Screenshot versions in path order, so two scans of the same files compare equal whatever order the folders were listed in. */
const byPath = (entries: [string, string][]): AssetVersions => Object.fromEntries(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))

/** What a re-sync re-reads (`planSync`). */
interface SyncPlan {
  files: { kind: RecordFileKind; name: string; file: string }[]
  layout: boolean
  config: boolean
  /** Card IDs whose `assets/<ID>/` folder changed. */
  assets: Set<string>
  /** Artifacts whose file changed. */
  artifactFiles: Set<string>
}

/** The record folders by name (`stories` holds items, and so on). */
const RECORD_FOLDERS = new Map<string, RecordFileKind>(Object.entries(RECORD_DIRS).map(([kind, dir]): [string, RecordFileKind] => [dir, kind as RecordFileKind]))

/** The lane list a lane write is judged against: the first lane's name and the named lanes. */
const lanesOf = (layout: Layout) => ({ firstLane: layout.firstLane ?? null, lanes: layout.lanes })

/** The 409 for a lane write made from a lane list the file no longer holds. */
function lanesChangedOnDisk(layout: Layout): HttpError {
  return new HttpError(409, 'the lanes changed on disk since you looked; look again', { current: { data: lanesOf(layout), rev: layout.lanesRev } })
}

/** A status as the config file holds it: its code a bare number, no empty fields. */
function clean(d: StatusDef): Record<string, unknown> {
  const out: Record<string, unknown> = { code: Number(d.code), label: d.label }
  if (d.heading) out.heading = d.heading
  out.help = d.help
  out.tone = d.tone
  if (d.role) out.role = d.role
  if (d.settle) out.settle = true
  return out
}

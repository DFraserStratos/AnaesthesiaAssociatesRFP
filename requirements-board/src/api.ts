/** Thin client for the dev-server file API (server/cataloguePlugin.ts). */
import type { BoardConfig, ConfigPatch } from '../shared/config.ts'
import type { ArtifactDetails } from '../shared/files.ts'
import type { CommitsResponse, DiffCountResponse, DiffResponse } from '../shared/diff.ts'
import type { TimelineEntry } from '../shared/history.ts'
import type { Artifact, ArtifactRec, CatalogueSnapshot, Item, Layout, Question, Rev } from '../shared/types.ts'

export interface BatchChange {
  id: string
  baseRev: string
  patch: Partial<Item>
  /** The value each patched field had when the client started: with it, a change on disk to other fields merges (accepted decision 20). */
  base?: Partial<Item>
}

/** A record that stopped a write: its current copy and, when base values were sent, the fields that clash. */
export interface Blocker {
  id: string
  current: unknown
  collisions?: string[]
}

/** VOICE.md as it is on disk, with the revision a save must start from; null when there is none. */
export interface Voice {
  text: string | null
  rev: string | null
}

/**
 * A refused write. A 409 (changed on disk) carries `current`, the record as it is now with the rev to retry
 * on, and may carry `collisions` (the patched fields that changed on disk too) and, for a write of several
 * records (a batch, a lane change, Settings sections), `blocked`: every blocker. See the write protocol in
 * `server/catalogueApi.ts`.
 */
export class ApiError extends Error {
  status: number
  current?: Rev<unknown>
  collisions?: string[]
  blocked?: Blocker[]
  /** For a Settings conflict: the section that changed on disk. */
  section?: string
  constructor(status: number, message: string, current?: Rev<unknown>, extra: { collisions?: string[]; blocked?: Blocker[]; section?: string } = {}) {
    super(message)
    this.status = status
    this.current = current
    this.collisions = extra.collisions
    this.blocked = extra.blocked
    this.section = extra.section
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { error?: string; current?: Rev<unknown>; collisions?: string[]; blocked?: Blocker[]; section?: string }
  if (!res.ok) throw new ApiError(res.status, json.error ?? `${method} ${path} failed (${res.status})`, json.current, { collisions: json.collisions, blocked: json.blocked, section: json.section })
  return json as T
}

/** A record write: the fields changed, the rev they were edited on, and optionally each field's starting value. */
export interface RecordPatch<T> {
  patch: Partial<T>
  baseRev: string
  base?: Partial<T>
}

export const api = {
  catalogue: () => call<CatalogueSnapshot>('GET', '/api/catalogue'),
  /** Whether the board's server answers (asked while offline): its process (`epoch`) and last delivery. */
  ping: () => call<{ epoch: string; seq: number }>('GET', '/api/ping'),
  voice: () => call<Voice>('GET', '/api/voice'),
  /** Writes VOICE.md; refused with a 409 (and the file as it is now) if it changed on disk since baseRev. */
  putVoice: (text: string, baseRev: string | null) => call<Voice>('PUT', '/api/voice', { text, baseRev }),
  /** Today's whole-record save (until B06 switches to `patchItem`): refused on any change on disk since baseRev. */
  putItem: (record: Item, baseRev?: string) => call<Rev<Item>>('PUT', `/api/items/${encodeURIComponent(record.id)}`, { record, baseRev }),
  /**
   * Saves only the fields in `patch`, laid over the card as it is on disk now. With `base`, a change on disk
   * to other fields merges; a change to a patched field is a 409 naming it (`collisions`). Unchanged: nothing written.
   */
  patchItem: (id: string, change: RecordPatch<Item>) => call<Rev<Item>>('PUT', `/api/items/${encodeURIComponent(id)}`, change),
  /** The card's timeline, newest first: the dev server's change journal, backfilled from git. */
  itemHistory: (id: string) => call<{ entries: TimelineEntry[] }>('GET', `/api/items/${encodeURIComponent(id)}/history`),
  /** An artifact's timeline, newest first, from git: its sidecar's changes and its file's. */
  artifactHistory: (id: string) => call<{ entries: TimelineEntry[] }>('GET', `/api/artifacts/${encodeURIComponent(id)}/history`),
  /** Commits that changed catalogue records, newest first (the Diff review's pickers). */
  diffCommits: () => call<CommitsResponse>('GET', '/api/diff/commits'),
  /** Every record that differs between two commits, or a commit and the files on disk (`worktree`). */
  diff: (from: string, to: string) => call<DiffResponse>('GET', `/api/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  /** How many records differ, minor changes left out (From defaults to HEAD, To to the files on disk): the tab's count. */
  diffCount: (from?: string, to?: string) =>
    call<DiffCountResponse>('GET', `/api/diff/count${from || to ? `?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) })}` : ''}`),
  /** The Diff review's default: HEAD against the files on disk, or with nothing there what the last catalogue commit changed (`jumped`). */
  diffAuto: () => call<DiffResponse>('GET', '/api/diff/auto'),
  /** An artifact's details (name, kind, status, date, author, area, sources, description); the server keeps the rest as on disk. */
  putArtifact: (record: Artifact, baseRev?: string) => call<ArtifactRec>('PUT', `/api/artifacts/${encodeURIComponent(record.id)}`, { record, baseRev }),
  /** An artifact's details as a patch (see `patchItem`); the sidecar is edited in place. */
  patchArtifact: (id: string, change: RecordPatch<ArtifactDetails>) => call<ArtifactRec>('PUT', `/api/artifacts/${encodeURIComponent(id)}`, change),
  createItem: (partial: Partial<Item> & Pick<Item, 'type'>) => call<Rev<Item>>('POST', '/api/items', partial),
  /**
   * Removes the item and everything under it (`ids`, as the user was shown them) and strips every reference to them.
   * Refused with a 409 if the item changed on disk since baseRev, or what sits under it is no longer `ids`.
   */
  deleteItem: (id: string, baseRev: string, ids: string[]) =>
    call<{ deleted: string[]; records: Rev<Item>[]; questions: Rev<Question>[] }>('DELETE', `/api/items/${encodeURIComponent(id)}`, { baseRev, ids }),
  putQuestion: (record: Question, baseRev?: string) =>
    call<Rev<Question>>('PUT', `/api/questions/${encodeURIComponent(record.id)}`, { record, baseRev }),
  /** A question's fields as a patch (see `patchItem`). */
  patchQuestion: (id: string, change: RecordPatch<Question>) => call<Rev<Question>>('PUT', `/api/questions/${encodeURIComponent(id)}`, change),
  /** Removes the question's file; refused with a 409 if it changed on disk since baseRev. */
  deleteQuestion: (id: string, baseRev: string) => call<{ id: string }>('DELETE', `/api/questions/${encodeURIComponent(id)}`, { baseRev }),
  createQuestion: (partial: Partial<Question>) => call<Rev<Question>>('POST', '/api/questions', partial),
  /** All or nothing: every record must still be at its baseRev (a Mapped board move). */
  batchItems: (changes: BatchChange[]) => call<{ records: Rev<Item>[] }>('POST', '/api/items/batch', { changes }),
  /** The sections sent replace those in board.config.json; with `bases` (from `config.revs`), a section changed on disk since is a 409. */
  putConfig: (patch: ConfigPatch) => call<BoardConfig>('PUT', '/api/config', patch),
  /**
   * Positions are a patch (null puts a card back in its story-map place) and never refused for the lane list;
   * lanes, when sent, replace the list. With `lanesRev`, a lane list changed on disk since is a 409.
   */
  putLayout: (patch: { positions?: Record<string, { x: number; y: number } | null>; lanes?: string[]; firstLane?: string | null; lanesRev?: string }) => call<Layout>('PUT', '/api/layout', patch),
  /**
   * Renames or removes a named lane and rewrites the swimlane of every story in it, all or nothing. `stories`
   * maps each story the client holds in that lane to its rev; a stale or unknown one is a 409 naming it.
   */
  changeLane: (change: { op: 'rename'; from: string; to: string; lanesRev: string; stories: Record<string, string> } | { op: 'remove'; from: string; lanesRev: string; stories: Record<string, string> }) =>
    call<{ records: Rev<Item>[]; layout: Layout }>('POST', '/api/lanes', change),
}

/** URL of one version of a screenshot (by git blob hash), for a card's history. */
export const historyBlobUrl = (v: { src: string; sha: string }) => `/history-blob/${v.sha}?src=${encodeURIComponent(v.src)}`

/** The file an artifact shows, versioned by its content so a change on disk reloads it. */
export const artifactFileUrl = (id: string, fileRev: string | null) => `/artifact-file/${encodeURIComponent(id)}${fileRev ? `?v=${fileRev.slice(0, 12)}` : ''}`

/** One version of an artifact's file (by git blob hash), for its history. `file` names its type when the artifact is gone. */
export const artifactBlobUrl = (id: string, sha: string, file?: string | null) =>
  `/history-blob/${sha}?artifact=${encodeURIComponent(id)}${file ? `&file=${encodeURIComponent(file)}` : ''}`

/**
 * A screenshot's URL. With its version (`assets` in the store, D-10) the URL changes when the file's
 * content does, so a re-captured screenshot is fetched afresh and an unchanged one stays cached. Any
 * version is served the current file.
 */
export const assetUrl = (src: string, version?: string) => `/requirements/${src.split('/').map(encodeURIComponent).join('/')}${version ? `?v=${encodeURIComponent(version)}` : ''}`

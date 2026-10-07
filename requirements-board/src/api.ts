/** Thin client for the dev-server file API (server/cataloguePlugin.ts). */
import type { TimelineEntry } from '../shared/history.ts'
import type { Artifact, ArtifactRec, CatalogueSnapshot, Item, Layout, Question, Rev } from '../shared/types.ts'

export interface BatchChange {
  id: string
  baseRev: string
  patch: Partial<Item>
}

export class ApiError extends Error {
  status: number
  current?: Rev<unknown>
  constructor(status: number, message: string, current?: Rev<unknown>) {
    super(message)
    this.status = status
    this.current = current
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { error?: string; current?: Rev<unknown> }
  if (!res.ok) throw new ApiError(res.status, json.error ?? `${method} ${path} failed (${res.status})`, json.current)
  return json as T
}

export const api = {
  catalogue: () => call<CatalogueSnapshot>('GET', '/api/catalogue'),
  putItem: (record: Item, baseRev?: string) => call<Rev<Item>>('PUT', `/api/items/${encodeURIComponent(record.id)}`, { record, baseRev }),
  /** The card's timeline, newest first: the dev server's change journal, backfilled from git. */
  itemHistory: (id: string) => call<{ entries: TimelineEntry[] }>('GET', `/api/items/${encodeURIComponent(id)}/history`),
  /** An artifact's timeline, newest first, from git: its sidecar's changes and its file's. */
  artifactHistory: (id: string) => call<{ entries: TimelineEntry[] }>('GET', `/api/artifacts/${encodeURIComponent(id)}/history`),
  /** An artifact's details (name, kind, status, date, author, area, sources, description); the server keeps the rest as on disk. */
  putArtifact: (record: Artifact, baseRev?: string) => call<ArtifactRec>('PUT', `/api/artifacts/${encodeURIComponent(record.id)}`, { record, baseRev }),
  createItem: (partial: Partial<Item> & Pick<Item, 'type'>) => call<Rev<Item>>('POST', '/api/items', partial),
  /**
   * Removes the item and everything under it (`ids`, as the user was shown them) and strips every reference to them.
   * Refused with a 409 if the item changed on disk since baseRev, or what sits under it is no longer `ids`.
   */
  deleteItem: (id: string, baseRev: string, ids: string[]) =>
    call<{ deleted: string[]; records: Rev<Item>[]; questions: Rev<Question>[] }>('DELETE', `/api/items/${encodeURIComponent(id)}`, { baseRev, ids }),
  putQuestion: (record: Question, baseRev?: string) =>
    call<Rev<Question>>('PUT', `/api/questions/${encodeURIComponent(record.id)}`, { record, baseRev }),
  /** Removes the question's file; refused with a 409 if it changed on disk since baseRev. */
  deleteQuestion: (id: string, baseRev: string) => call<{ id: string }>('DELETE', `/api/questions/${encodeURIComponent(id)}`, { baseRev }),
  createQuestion: (partial: Partial<Question>) => call<Rev<Question>>('POST', '/api/questions', partial),
  /** All or nothing: every record must still be at its baseRev (a Mapped board move). */
  batchItems: (changes: BatchChange[]) => call<{ records: Rev<Item>[] }>('POST', '/api/items/batch', { changes }),
  /** Positions are a patch (null puts a card back in its story-map place); lanes, when sent, replace the list. */
  putLayout: (patch: { positions?: Record<string, { x: number; y: number } | null>; lanes?: string[]; firstLane?: string | null }) => call<Layout>('PUT', '/api/layout', patch),
}

/** URL of one version of a screenshot (by git blob hash), for a card's history. */
export const historyBlobUrl = (v: { src: string; sha: string }) => `/history-blob/${v.sha}?src=${encodeURIComponent(v.src)}`

/** The file an artifact shows, versioned by its content so a change on disk reloads it. */
export const artifactFileUrl = (id: string, fileRev: string | null) => `/artifact-file/${encodeURIComponent(id)}${fileRev ? `?v=${fileRev.slice(0, 12)}` : ''}`

/** One version of an artifact's file (by git blob hash), for its history. */
export const artifactBlobUrl = (id: string, sha: string) => `/history-blob/${sha}?artifact=${encodeURIComponent(id)}`

/** URL the dev server serves a catalogue-relative asset path from. */
export const assetUrl = (src: string) => `/requirements/${src.split('/').map(encodeURIComponent).join('/')}`

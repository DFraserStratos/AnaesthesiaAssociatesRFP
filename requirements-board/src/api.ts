/** Thin client for the dev-server file API (server/cataloguePlugin.ts). */
import type { TimelineEntry } from '../shared/history.ts'
import type { CatalogueSnapshot, Item, Layout, Question, Rev } from '../shared/types.ts'

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
  createItem: (partial: Partial<Item> & Pick<Item, 'type'>) => call<Rev<Item>>('POST', '/api/items', partial),
  putQuestion: (record: Question, baseRev?: string) =>
    call<Rev<Question>>('PUT', `/api/questions/${encodeURIComponent(record.id)}`, { record, baseRev }),
  createQuestion: (partial: Partial<Question>) => call<Rev<Question>>('POST', '/api/questions', partial),
  /** All or nothing: every record must still be at its baseRev (a Mapped board move). */
  batchItems: (changes: BatchChange[]) => call<{ records: Rev<Item>[] }>('POST', '/api/items/batch', { changes }),
  /** Positions are a patch (null puts a card back in its story-map place); lanes, when sent, replace the list. */
  putLayout: (patch: { positions?: Record<string, { x: number; y: number } | null>; lanes?: string[]; firstLane?: string | null }) => call<Layout>('PUT', '/api/layout', patch),
}

/** URL of one version of a screenshot (by git blob hash), for a card's history. */
export const historyBlobUrl = (v: { src: string; sha: string }) => `/history-blob/${v.sha}?src=${encodeURIComponent(v.src)}`

/** URL the dev server serves a catalogue-relative asset path from. */
export const assetUrl = (src: string) => `/catalogue/${src.split('/').map(encodeURIComponent).join('/')}`

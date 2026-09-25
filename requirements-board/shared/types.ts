/**
 * The catalogue's record shapes. Shared by the dev-server file API, the
 * scripts (migrate / check / export:csv) and the browser app, so all three
 * read and write the same thing.
 */

export const ITEM_TYPES = ['epic', 'feature', 'story'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const ITEM_STATUSES = ['Proposed', 'Open', 'Confirmed', 'Future', 'Retired'] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const COMPONENTS = [
  'Scheduling Engine',
  'Billing/Invoice Engine',
  'Anaesthetist App (mobile + web)',
  'Admin App',
  'Xero Integration',
  'Health Integration',
  'Master Data',
  'Cross-cutting',
] as const
export type Component = (typeof COMPONENTS)[number]

export const QUESTION_STATUSES = ['Open', 'Confirm', 'Proposed', 'Answered'] as const
export type QuestionStatus = (typeof QUESTION_STATUSES)[number]

/** What an outstanding item asks for: a decision (`question`) or where a requirement came from (`missing-source`). */
export const QUESTION_KINDS = ['question', 'missing-source'] as const
export type QuestionKind = (typeof QUESTION_KINDS)[number]

export const VIEWPORTS = ['desktop', 'mobile'] as const
export type Viewport = (typeof VIEWPORTS)[number]

/** Which app a screenshot shows. The board groups an item's gallery by it, in this order. */
export const IMAGE_APPS = ['admin', 'web', 'mobile', 'simulator'] as const
export type ImageApp = (typeof IMAGE_APPS)[number]

export interface ImageRef {
  /** Path relative to the catalogue folder, e.g. `assets/US-01.1.1/dashboard.png`. */
  src: string
  viewport: Viewport
  app?: ImageApp
  caption?: string
}

export interface Item {
  id: string
  type: ItemType
  /** Null only for epics. */
  parent: string | null
  title: string
  status: ItemStatus
  components: string[]
  sources: string[]
  /** Sort position among siblings (1-based). */
  order: number
  images: ImageRef[]
  description: string
  /** `## Acceptance criteria` section: Markdown, typically one criterion per list item. */
  acceptance: string
  /** `## Technical discussion` section: Markdown. */
  technical: string
  notes: string
  /** Frontmatter keys this tool doesn't know about, kept verbatim so agents can add fields. */
  extra: Record<string, unknown>
}

export interface Question {
  id: string
  kind: QuestionKind
  title: string
  affects: string[]
  owner: string
  status: QuestionStatus
  sources: string[]
  question: string
  answer: string
  extra: Record<string, unknown>
}

export interface Layout {
  /** Card positions that override the auto story-map layout. */
  positions: Record<string, { x: number; y: number }>
}

/** A record plus the hash of the file text it was read from (for optimistic concurrency). */
export interface Rev<T> {
  data: T
  rev: string
}

export interface Issue {
  severity: 'error' | 'warning'
  /** The record (or file) the issue is about. */
  id: string
  message: string
}

export interface CatalogueSnapshot {
  items: Record<string, Rev<Item>>
  questions: Record<string, Rev<Question>>
  layout: Layout
  issues: Issue[]
}

/** Pushed over Vite's HMR socket when a catalogue file changes on disk. */
export type CatalogueEvent =
  | { kind: 'item'; id: string; record: Rev<Item> | null }
  | { kind: 'question'; id: string; record: Rev<Question> | null }
  | { kind: 'layout'; layout: Layout }
  | { kind: 'issues'; issues: Issue[] }

export function isOpenQuestion(q: Question): boolean {
  return q.status !== 'Answered'
}

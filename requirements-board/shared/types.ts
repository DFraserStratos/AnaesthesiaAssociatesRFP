/**
 * The catalogue's record shapes. Shared by the dev-server file API, the
 * scripts (migrate / check / export:csv) and the browser app, so all three
 * read and write the same thing.
 */

export const ITEM_TYPES = ['epic', 'feature', 'story'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const TYPE_LABEL: Record<ItemType, string> = { epic: 'Epic', feature: 'Feature', story: 'Story' }

/** What an item of this type may sit under: a feature under an epic, a story under a feature or straight under an epic. */
export const PARENT_TYPES: Record<ItemType, readonly ItemType[]> = { epic: [], feature: ['epic'], story: ['feature', 'epic'] }

export const ITEM_STATUSES = ['Proposed', 'Open', 'Verify', 'Confirmed', 'Future', 'Retired'] as const
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
  /** Path relative to the requirements folder, e.g. `assets/US-01.1.1/dashboard.png`. */
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
  /** Sort position among siblings (1-based). The Mapped board rewrites it when a card is dragged. */
  order: number
  /** Stories only: the Mapped board's swim lane, by name (one of `Layout.lanes`), or null for the unnamed first lane. */
  swimlane: string | null
  /** Items this one is related to, by ID (epics, features, stories). Stored on one side, shown on both. */
  related: string[]
  /** Artifacts this item points at: `AR-01`, or `AR-01#region` for a spot inside one. Shown on both sides. */
  artifacts: string[]
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
  /** Card positions that override the auto story-map layout (Freeform mode only). */
  positions: Record<string, { x: number; y: number }>
  /** The Mapped board's named swim lanes, top to bottom, below the implicit first lane. */
  lanes: string[]
  /** What the implicit first lane (stories with no `swimlane`) is called. Unset: `UNASSIGNED_LANE`. */
  firstLane?: string
}

/** The implicit first lane's name until it is renamed. */
export const UNASSIGNED_LANE = 'Unassigned'
export const firstLaneName = (layout: Pick<Layout, 'firstLane'>) => layout.firstLane || UNASSIGNED_LANE

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
  artifacts: Record<string, ArtifactRec>
  layout: Layout
  issues: Issue[]
}

/** Pushed over Vite's HMR socket when a catalogue file changes on disk. */
export type CatalogueEvent =
  | { kind: 'item'; id: string; record: Rev<Item> | null }
  | { kind: 'question'; id: string; record: Rev<Question> | null }
  | { kind: 'artifact'; id: string; record: ArtifactRec | null }
  | { kind: 'layout'; layout: Layout }
  | { kind: 'issues'; issues: Issue[] }

export function isOpenQuestion(q: Question): boolean {
  return q.status !== 'Answered'
}

/* -------------------------------------------------------------- artifacts */

/** What an artifact is, for its icon and for filtering. Not its file format (that follows from the file). */
export const ARTIFACT_KINDS = ['diagram', 'mockup', 'screenshot', 'photo', 'transcript', 'note', 'document'] as const
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number]

/** Current is the baseline and goes unmarked; Superseded keeps the record (and its ID) with a pointer to what replaced it. */
export const ARTIFACT_STATUSES = ['Draft', 'Current', 'Superseded'] as const
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number]

/** How the board shows an artifact, from its file's extension (or its inline mermaid source). */
export type ArtifactFormat = 'svg' | 'raster' | 'mermaid' | 'markdown' | 'pdf'

/** The file extensions an artifact may have, by format. */
export const ARTIFACT_EXTENSIONS: Record<Exclude<ArtifactFormat, 'mermaid'>, readonly string[]> = {
  svg: ['.svg'],
  raster: ['.png', '.jpg', '.jpeg', '.webp'],
  markdown: ['.md'],
  pdf: ['.pdf'],
}

/** x, y, width, height in the artifact's own units: SVG viewBox units, image pixels, or PDF points (top left origin). */
export type Box = [number, number, number, number]

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * A named spot inside an artifact that items can link to, drawn as a red box. `around` lists
 * anchors (`text=`, `quote=`, `heading=`, `node=`, or a CSS selector) and the box goes round all
 * their matches together, like a capture recipe's highlight; `box` is the fallback, or the only
 * way for an image. `page` places it in a PDF.
 */
export interface Region {
  id: string
  name: string
  around: string[]
  box: Box | null
  page: number | null
  /** Space between the matches and the box, in the artifact's units. Unset: `HIGHLIGHT.pad`. */
  pad: number | null
  /** A line on what the spot shows. */
  note: string
}

export interface Artifact {
  id: string
  /** The artifact's name, independent of its file name. */
  title: string
  kind: ArtifactKind
  status: ArtifactStatus
  /** The artifact that replaced this one (Superseded only). */
  supersededBy: string | null
  /**
   * When the artifact itself was made: a meeting's date for its transcript or notes, a document's
   * publication, a diagram's drawing. `YYYY-MM-DD`, or `YYYY-MM` or `YYYY` when that is all that is
   * known. Null when not given.
   */
  date: string | null
  author: string
  components: string[]
  sources: string[]
  /**
   * The file it shows. Relative to the requirements folder (`artifacts/files/AR-01.svg`, `notes/x.md`), or
   * to the repository root with a leading slash (`/docs/rfp-reference/RFP.pdf`). Null for a
   * mermaid diagram, whose source sits in the sidecar.
   */
  file: string | null
  regions: Region[]
  /** Markdown, before any `## Source` section. */
  description: string
  /** The mermaid source (the fenced block under `## Source`), or empty. */
  source: string
  extra: Record<string, unknown>
}

export interface Heading {
  depth: number
  text: string
  /** The automatic region ID: GitHub-style slug, made unique within the document. */
  slug: string
}

/** What the server worked out from an artifact's file, for the board (format, size, pages, headings). */
export interface ArtifactMeta {
  format: ArtifactFormat | null
  /** Hash of the file's bytes (git's blob hash), so a changed file reloads. Null for mermaid or a missing file. */
  fileRev: string | null
  /** The drawing's extent (SVG viewBox, image pixels). */
  bounds: Rect | null
  /** PDF page sizes in points. */
  pages: { w: number; h: number }[] | null
  /** Markdown headings, the document's automatic regions (with line ranges, `L12-20`). */
  headings: Heading[] | null
  /** A Markdown document's line count. */
  lines: number | null
  bytes: number | null
  /** Repository-relative path of the file, for display and history. */
  path: string | null
}

export interface ArtifactRec extends Rev<Artifact> {
  meta: ArtifactMeta
}

export function artifactFormat(a: Pick<Artifact, 'file' | 'source'>): ArtifactFormat | null {
  if (!a.file) return a.source.trim() ? 'mermaid' : null
  const ext = a.file.slice(a.file.lastIndexOf('.')).toLowerCase()
  for (const [format, exts] of Object.entries(ARTIFACT_EXTENSIONS)) if (exts.includes(ext)) return format as ArtifactFormat
  return null
}

/** Canvas formats pan and zoom like a map; documents scroll like a page. */
export const isCanvasFormat = (f: ArtifactFormat | null) => f === 'svg' || f === 'raster' || f === 'mermaid'

/** `AR-01#price-rules` as its artifact and region (null for the whole artifact). */
export function parseArtifactRef(ref: string): { id: string; region: string | null } {
  const at = ref.indexOf('#')
  return at < 0 ? { id: ref.trim(), region: null } : { id: ref.slice(0, at).trim(), region: ref.slice(at + 1).trim() || null }
}

export const artifactRef = (id: string, region: string | null) => (region ? `${id}#${region}` : id)

/** A PDF page's automatic region ID. */
export const pageRegionId = (n: number) => `p${n}`
export const pageOfRegionId = (id: string): number | null => (/^p\d+$/.test(id) ? Number(id.slice(1)) : null)

/** A Markdown document's automatic line-range region, `L27` or `L27-33` (as the notes cite transcript lines). */
export function linesOfRegionId(id: string): { from: number; to: number } | null {
  const m = /^L(\d+)(?:-L?(\d+))?$/.exec(id)
  if (!m) return null
  const from = Number(m[1])
  const to = m[2] ? Number(m[2]) : from
  return from >= 1 && to >= from ? { from, to } : null
}

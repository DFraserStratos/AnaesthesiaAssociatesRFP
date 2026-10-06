/**
 * Artifacts as the board reads them: which items and questions point at each one (and where in
 * it), each artifact's regions (named, plus a PDF's pages and a document's headings), and the
 * Artifacts view's per-browser preferences.
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { isArtifactId, itemTexts, mentions } from '../shared/links.ts'
import { ARTIFACT_KINDS, linesOfRegionId, pageOfRegionId, pageRegionId, parseArtifactRef, type ArtifactKind, type ArtifactRec, type ArtifactStatus, type Item, type Question, type Region } from '../shared/types.ts'
import { useCatalogue, useIndex, type Index } from './store.ts'

export interface ArtifactLink {
  item: Item
  region: string | null
  /** `field`: listed in the item's `artifacts`; `text`: linked or mentioned in its text. */
  via: 'field' | 'text'
}

export interface ArtifactIndex {
  /** In kind order, then newest first, then by title. */
  list: ArtifactRec[]
  byId: Map<string, ArtifactRec>
  links: Map<string, ArtifactLink[]>
  questions: Map<string, { question: Question; region: string | null }[]>
}

const KIND_ORDER = new Map(ARTIFACT_KINDS.map((k, i) => [k, i]))

export function buildArtifactIndex(artifacts: Record<string, ArtifactRec>, index: Index): ArtifactIndex {
  // By kind, then newest first (an undated one last), then by name.
  const list = Object.values(artifacts).sort(
    (a, b) =>
      (KIND_ORDER.get(a.data.kind) ?? 99) - (KIND_ORDER.get(b.data.kind) ?? 99) ||
      (b.data.date ?? '').localeCompare(a.data.date ?? '') ||
      a.data.title.localeCompare(b.data.title),
  )
  const byId = new Map(list.map((r) => [r.data.id, r]))
  const links = new Map<string, ArtifactLink[]>()
  const add = (ref: string, item: Item, via: ArtifactLink['via']) => {
    const { id, region } = parseArtifactRef(ref)
    const list = links.get(id) ?? []
    if (!list.some((l) => l.item.id === item.id && l.region === region)) list.push({ item, region, via })
    links.set(id, list)
  }
  for (const it of index.items) {
    for (const ref of it.artifacts ?? []) add(ref, it, 'field')
    for (const m of mentions(itemTexts(it).join('\n\n'))) if (isArtifactId(m.id)) add(m.id, it, 'text')
  }
  const questions = new Map<string, { question: Question; region: string | null }[]>()
  for (const q of index.questions) {
    for (const m of mentions(`${q.question}\n\n${q.answer}`)) {
      if (!isArtifactId(m.id)) continue
      const { id, region } = parseArtifactRef(m.id)
      questions.set(id, [...(questions.get(id) ?? []), { question: q, region }])
    }
  }
  return { list, byId, links, questions }
}

export function useArtifactIndex(): ArtifactIndex {
  const artifacts = useCatalogue((s) => s.artifacts)
  const index = useIndex()
  return useMemo(() => buildArtifactIndex(artifacts, index), [artifacts, index])
}

/** How many items point at an artifact, each counted once. */
export const linkCount = (ix: ArtifactIndex, id: string) => new Set((ix.links.get(id) ?? []).map((l) => l.item.id)).size

/** A spot an item can link to: a named region, or one the document has of itself (a page, a heading). */
export interface Spot {
  id: string
  name: string
  /** Named in the sidecar (red box), or the document's own (a page or a section). */
  auto: boolean
  region?: Region
  depth?: number
}

export function namedSpots(rec: ArtifactRec): Spot[] {
  return rec.data.regions.map((r) => ({ id: r.id, name: r.name || r.id, auto: false, region: r }))
}

export function autoSpots(rec: ArtifactRec): Spot[] {
  if (rec.meta.pages) return rec.meta.pages.map((_, i) => ({ id: pageRegionId(i + 1), name: `Page ${i + 1}`, auto: true }))
  if (rec.meta.headings) return rec.meta.headings.map((h) => ({ id: h.slug, name: h.text, auto: true, depth: h.depth }))
  return []
}

/** What a link's region is called, or null when the artifact has no such spot. */
export function spotName(rec: ArtifactRec, region: string): string | null {
  const named = rec.data.regions.find((r) => r.id === region)
  if (named) return named.name || named.id
  const page = pageOfRegionId(region)
  if (page !== null && rec.meta.pages) return page >= 1 && page <= rec.meta.pages.length ? `Page ${page}` : null
  const lines = linesOfRegionId(region)
  if (lines && rec.meta.lines) return lines.to <= rec.meta.lines ? (lines.from === lines.to ? `Line ${lines.from}` : `Lines ${lines.from} to ${lines.to}`) : null
  return rec.meta.headings?.find((h) => h.slug === region)?.text ?? null
}

/* --------------------------------------------------------------- view prefs */

export type ArtifactLayout = 'grid' | 'list'

export interface ArtifactPrefs {
  layout: ArtifactLayout
  kinds: ArtifactKind[]
  statuses: ArtifactStatus[]
  components: string[]
  /** The artifact page's side panel, in percent of the width. */
  panelW: number | null
  /** A PDF's page thumbnails, down its right side. */
  pdfPages: boolean
}

const PREFS_KEY = 'requirements-board:artifacts'
const DEFAULTS: ArtifactPrefs = { layout: 'grid', kinds: [], statuses: [], components: [], panelW: null, pdfPages: true }

function readPrefs(): ArtifactPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ArtifactPrefs>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

interface ArtifactViewState extends ArtifactPrefs {
  set: (patch: Partial<ArtifactPrefs>) => void
}

export const useArtifactView = create<ArtifactViewState>((set, get) => ({
  ...readPrefs(),
  set(patch) {
    set(patch)
    try {
      const { set: _s, ...prefs } = get()
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      /* private window: prefs just don't persist */
    }
  },
}))

/** Does an artifact pass the filters and the search? */
export function artifactMatches(rec: ArtifactRec, p: Pick<ArtifactPrefs, 'kinds' | 'statuses' | 'components'>, query: string): boolean {
  const a = rec.data
  if (p.kinds.length && !p.kinds.includes(a.kind)) return false
  if (p.statuses.length && !p.statuses.includes(a.status)) return false
  if (p.components.length && !a.components.some((c) => p.components.includes(c))) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = `${a.id} ${a.title} ${a.description} ${a.author} ${a.sources.join(' ')} ${a.regions.map((r) => `${r.name} ${r.note}`).join(' ')} ${rec.meta.path ?? ''}`.toLowerCase()
  return q.split(/\s+/).every((w) => hay.includes(w))
}

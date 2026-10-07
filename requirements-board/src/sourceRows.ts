/**
 * The artifact links on a sheet, sorted by what they are for: **Diagrams** (pictures that show where
 * the card sits in the wider workflow) and **Sources** (the evidence, in the order the card cites it).
 * Both draw on the card's `artifacts:` links and on its `sources:` strings, resolved to artifact
 * spots (`shared/sources.ts`). Pure, so the sheet and the tests agree.
 */
import { useMemo } from 'react'
import { buildSourceIndex, resolveSource, spotFactsOfMeta, type SourceIndex, type SourceSpot } from '../shared/sources.ts'
import { parseArtifactRef, type ArtifactKind, type ArtifactRec } from '../shared/types.ts'
import { spotName } from './artifactIndex.ts'
import { useCatalogue } from './store.ts'

export type SheetRow =
  /** An artifact, whole or at one or more spots. `source` is the string it was cited as, or null for an `artifacts:` link. */
  | { kind: 'artifact'; id: string; spots: SourceSpot[]; source: string | null }
  | { kind: 'question'; id: string; source: string }
  /** A source that cites nothing the catalogue holds (a typed decision, a sketch). */
  | { kind: 'plain'; source: string }
  /** A source, or an `artifacts:` link, that should open an artifact but finds none. */
  | { kind: 'missing'; text: string; reason: string }

/** Kinds that are pictures: they go under Diagrams. Everything else (documents, notes, transcripts) is evidence. */
export const PICTURE_KINDS: readonly ArtifactKind[] = ['diagram', 'mockup', 'screenshot', 'photo']

const WHOLE: SourceSpot = { region: null, label: null, detail: null, problem: null }

export function useSourceIndex(): SourceIndex {
  const artifacts = useCatalogue((s) => s.artifacts)
  return useMemo(() => sourceIndexOf(artifacts), [artifacts])
}

export const sourceIndexOf = (artifacts: Record<string, ArtifactRec>) =>
  buildSourceIndex(
    Object.values(artifacts).map((r) => r.data),
    (id) => (artifacts[id] ? spotFactsOfMeta(artifacts[id]!.meta) : null),
  )

/** One row for a source string. `self` is the artifact the source sits on (its own origin shows plain). */
export function sourceRow(index: SourceIndex, source: string, self?: string): SheetRow {
  const r = resolveSource(index, source, self)
  if (r.kind === 'artifact') return { kind: 'artifact', id: r.id, spots: r.spots, source }
  if (r.kind === 'question') return { kind: 'question', id: r.id, source }
  if (r.kind === 'unresolved') return { kind: 'missing', text: source, reason: r.reason }
  return { kind: 'plain', source }
}

/** One row for an `artifacts:` entry (`AR-01` or `AR-01#spot`). */
export function refRow(artifacts: Record<string, ArtifactRec>, ref: string): SheetRow {
  const { id, region } = parseArtifactRef(ref)
  const rec = artifacts[id]
  if (!rec) return { kind: 'missing', text: ref, reason: `${id} is not in the catalogue` }
  const label = region ? spotName(rec, region) : null
  if (region && !label) return { kind: 'missing', text: ref, reason: `${rec.data.title} has no spot "${region}"` }
  return { kind: 'artifact', id, spots: [region ? { region, label, detail: null, problem: null } : WHOLE], source: null }
}

const isPicture = (artifacts: Record<string, ArtifactRec>, row: SheetRow) => row.kind === 'artifact' && PICTURE_KINDS.includes(artifacts[row.id]?.data.kind as ArtifactKind)
const spotKey = (row: SheetRow) => (row.kind === 'artifact' ? `${row.id}#${row.spots.map((s) => s.region ?? '').join(',')}` : null)

/**
 * Rows in order with repeats dropped: the same artifact and spots once, and a whole-artifact row
 * when the same list already opens a spot in that artifact.
 */
function tidy(rows: SheetRow[]): SheetRow[] {
  const keys = new Set<string>()
  const out = rows.filter((row) => {
    const key = spotKey(row)
    if (key === null) return true
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
  return out.filter((row) => {
    if (row.kind !== 'artifact' || row.spots.some((s) => s.region !== null)) return true
    return !out.some((o) => o !== row && o.kind === 'artifact' && o.id === row.id && o.spots.some((s) => s.region !== null))
  })
}

/**
 * A card's Diagrams and Sources. Diagrams: its `artifacts:` pictures, then pictures its sources
 * cite. Sources: each source line in the order written (a picture moves to Diagrams), then its
 * `artifacts:` links to documents, notes and transcripts.
 */
export function sheetArtifacts(
  record: { sources: string[]; artifacts?: string[] },
  index: SourceIndex,
  artifacts: Record<string, ArtifactRec>,
): { diagrams: SheetRow[]; sources: SheetRow[] } {
  const refs = (record.artifacts ?? []).map((r) => refRow(artifacts, r))
  const cited = record.sources.map((s) => sourceRow(index, s))
  return {
    diagrams: tidy([...refs.filter((r) => isPicture(artifacts, r)), ...cited.filter((r) => isPicture(artifacts, r))]),
    sources: tidy([...cited.filter((r) => !isPicture(artifacts, r)), ...refs.filter((r) => !isPicture(artifacts, r))]),
  }
}

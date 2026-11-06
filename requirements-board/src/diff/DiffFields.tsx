/**
 * The Diff review's non-text fields, drawn as the sheet draws them: a status pill, the lineage
 * pills, area chips, rows for related cards, artifacts and sources, screenshots. Each field is a
 * pair of cells; a list marks what was removed on the before side and what was added on the after.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ItemDiff } from '../../shared/diff.ts'
import { shownOf, type Entry } from '../../shared/diffModel.ts'
import { regionChanges } from '../../shared/history.ts'
import { TYPE_LABEL, firstLaneName, parseArtifactRef, type Artifact, type ImageRef, type Item, type ItemType, type Question, type Region } from '../../shared/types.ts'
import { historyBlobUrl } from '../api.ts'
import { ArtifactIcon, ArtifactName, ArtifactRefName, Lineage, QuestionName, RecordMark, RecordName, TypeIcon, type MarkOf } from '../components/bits.tsx'
import type { SourceIndex } from '../../shared/sources.ts'
import { sourceRow } from '../sourceRows.ts'
import { useCatalogue } from '../store.ts'
import { ARTIFACT_KIND_LABEL, KIND_LABEL } from '../vocab.ts'

export type Side = 'before' | 'after'

/** A changed record's mark: its type, the question mark, or its artifact kind (a document when no side reads). */
export const markOf = (e: Entry): MarkOf =>
  e.kind === 'item' ? { kind: 'item', type: e.type } : e.kind === 'question' ? { kind: 'question' } : { kind: 'artifact', artifactKind: shownOf(e.rec)?.kind ?? 'document' }

/**
 * Finds a record as it stood at one side: a changed record's own version (a removed one too), the
 * context the server sent, else the catalogue now. `sources` reads source strings against that
 * side's artifacts (today's, with the ones that read differently then as they were).
 */
export interface Lookup {
  item: (id: string, side: Side) => Item | undefined
  question: (id: string, side: Side) => Question | undefined
  artifact: (id: string, side: Side) => Artifact | undefined
  sources: (side: Side) => SourceIndex | null
}

export const LookupContext = createContext<Lookup>({ item: () => undefined, question: () => undefined, artifact: () => undefined, sources: () => null })

/** Keys for a list's rows: each value's own key, a repeat counted on, so a row keeps its state as the list changes. */
function rowKeys<T>(list: T[], keyOf: (v: T) => string): string[] {
  const seen = new Map<string, number>()
  return list.map((v) => {
    const k = keyOf(v)
    const n = seen.get(k) ?? 0
    seen.set(k, n + 1)
    return n ? `${k}#${n}` : k
  })
}

function useChain(parent: string | null, side: Side): Item[] {
  const look = useContext(LookupContext)
  const out: Item[] = []
  for (let id = parent, guard = 0; id && guard < 6; guard++) {
    const it = look.item(id, side)
    if (!it) break
    out.unshift(it)
    id = it.parent
  }
  return out
}

export function Empty({ children = 'None' }: { children?: ReactNode }) {
  return <span className="diff-empty">{children}</span>
}

export function ParentCell({ parent, side }: { parent: string | null; side: Side }) {
  const chain = useChain(parent, side)
  if (!parent) return <Empty>The top level</Empty>
  if (!chain.length) return <span className="mono">{parent}</span>
  return <Lineage chain={chain} />
}

export function TypeCell({ type }: { type: ItemType }) {
  return (
    <span className="diff-inline">
      <TypeIcon type={type} /> {TYPE_LABEL[type]}
    </span>
  )
}

export function LaneCell({ lane }: { lane: string | null }) {
  const layout = useCatalogue((s) => s.layout)
  return <span className="chip">{lane ?? firstLaneName(layout)}</span>
}

export function PlainCell({ value, mono }: { value: string | number | null | undefined; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return <Empty />
  return <span className={mono ? 'mono diff-mono' : undefined}>{String(value)}</span>
}

export function QuestionKindCell({ kind }: { kind: Question['kind'] }) {
  return (
    <span className="diff-inline ty-question">
      <RecordMark mark={{ kind: 'question' }} /> {KIND_LABEL[kind] ?? kind}
    </span>
  )
}

export function ArtifactKindCell({ kind }: { kind: Artifact['kind'] }) {
  return (
    <span className="diff-inline ty-artifact">
      <ArtifactIcon kind={kind} /> {ARTIFACT_KIND_LABEL[kind] ?? kind}
    </span>
  )
}

/** A list field (related, artifacts, sources, area...): this side's entries, the ones only on this side marked. */
export function ListCell<T>({
  list,
  other,
  side,
  keyOf = (v) => JSON.stringify(v),
  render,
  expanded,
  chips,
}: {
  list: T[]
  other: T[]
  side: Side
  keyOf?: (v: T) => string
  render: (v: T) => ReactNode
  expanded: boolean
  chips?: boolean
}) {
  const [all, setAll] = useState(false)
  const theirs = new Set(other.map(keyOf))
  const keys = rowKeys(list, keyOf)
  const rows = list.map((v, i) => ({ v, key: keys[i]!, only: !theirs.has(keyOf(v)) }))
  const shown = expanded || all ? rows : rows.filter((r) => r.only)
  const hidden = rows.length - shown.length
  if (!rows.length) return <Empty />
  const mark = side === 'before' ? 'del' : 'add'
  return (
    <div className={chips ? 'diff-chips' : 'diff-list'}>
      {shown.map((r) => (
        <div key={r.key} className={`diff-li${r.only ? ` ${mark}` : ''}`}>
          {render(r.v)}
        </div>
      ))}
      {hidden > 0 && (
        <button type="button" className="diff-more" onClick={() => setAll(true)}>
          {shown.length ? `and ${hidden} unchanged` : `${hidden} unchanged`}
        </button>
      )}
    </div>
  )
}

/** A card or outstanding item named as it stood at one side; the bare ID only once it is gone. */
export function RecordAt({ id, side }: { id: string; side: Side }) {
  const look = useContext(LookupContext)
  const item = look.item(id, side)
  return <RecordName id={id} item={item} question={item ? undefined : look.question(id, side)} />
}

/** An artifact (at a spot) as it stood at one side. */
export function ArtifactRefAt({ refText, side }: { refText: string; side: Side }) {
  const look = useContext(LookupContext)
  return <ArtifactRefName refText={refText} at={look.artifact(parseArtifactRef(refText).id, side)} />
}

/** A source as the sheet names it: the artifact and spot it cites, an outstanding item, or its words. */
export function SourceName({ source, self, side }: { source: string; self?: string; side: Side }) {
  const look = useContext(LookupContext)
  const index = look.sources(side)
  if (!index) return <span className="diff-source-plain">{source}</span>
  const row = sourceRow(index, source, self)
  const artifact = row.kind === 'artifact' ? look.artifact(row.id, side) : undefined
  if (artifact) {
    const label = row.kind === 'artifact' ? row.spots.map((s) => s.label).filter(Boolean).join(', ') : ''
    return (
      <span title={source}>
        <ArtifactName artifact={artifact} spot={label || null} />
      </span>
    )
  }
  const question = row.kind === 'question' ? look.question(row.id, side) : undefined
  if (question) return <QuestionName question={question} title={source} />
  return <span className={row.kind === 'missing' ? 'diff-source-missing' : 'diff-source-plain'}>{source}</span>
}

export function ShotsCell({ rec, side, list, other, expanded }: { rec: ItemDiff; side: Side; list: ImageRef[]; other: ImageRef[]; expanded: boolean }) {
  const shas = rec.images?.[side] ?? {}
  return (
    <ListCell
      list={list}
      other={other}
      side={side}
      expanded={expanded}
      keyOf={(i) => i.src}
      render={(img) => {
        const sha = shas[img.src]
        const name = img.caption || img.src.split('/').pop()
        return (
          <figure className="diff-shot">
            {sha ? (
              <a href={historyBlobUrl({ src: img.src, sha })} target="_blank" rel="noreferrer" title="Open full size">
                <img src={historyBlobUrl({ src: img.src, sha })} alt={name} loading="lazy" />
              </a>
            ) : (
              <div className="diff-shot-gone">Not in git</div>
            )}
            <figcaption>{name}</figcaption>
          </figure>
        )
      }}
    />
  )
}

/** An artifact's highlights: names, with what changed about the ones on both sides. */
export function RegionsCell({ side, before, after, expanded }: { side: Side; before: Region[]; after: Region[]; expanded: boolean }) {
  const ch = regionChanges(before, after)
  const what = new Map(ch.changed.map((c) => [c.id, c.what.join(', ')]))
  const list = side === 'before' ? before : after
  return (
    <ListCell
      list={list}
      other={side === 'before' ? after : before}
      side={side}
      expanded={expanded || what.size > 0}
      keyOf={(r) => r.id}
      render={(r) => (
        <span>
          {r.name || r.id}
          {side === 'after' && what.has(r.id) && <span className="diff-note"> · {what.get(r.id)}</span>}
        </span>
      )}
    />
  )
}

/** Frontmatter only agents use: each key and its value. */
export function ExtraCell({ side, before, after, expanded }: { side: Side; before: Record<string, unknown>; after: Record<string, unknown>; expanded: boolean }) {
  const mine = side === 'before' ? before : after
  const theirs = side === 'before' ? after : before
  const entries = Object.entries(mine).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  const others = Object.entries(theirs).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  return <ListCell list={entries} other={others} side={side} expanded={expanded} keyOf={(s) => s} render={(s) => <span className="mono diff-mono">{s}</span>} />
}

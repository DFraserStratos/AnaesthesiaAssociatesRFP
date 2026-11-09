/**
 * One changed record in the Diff review: a white sheet, its head (type mark, title, what happened
 * to it, Whole card, Open, Viewed), then its fields side by side, before on the left and after on
 * the right, split by the seam. Only changed fields show unless the card is expanded. An added or
 * removed record keeps both columns: a placeholder opposite the whole card.
 */
import { ArrowUpRight, Maximize2, Minimize2 } from 'lucide-react'
import { Fragment, memo, useEffect, useMemo, useState, type ReactNode } from 'react'
import { shownOf, type ArtifactEntry, type Entry, type ItemEntry, type QuestionEntry } from '../../shared/diffModel.ts'
import { isMinorChange, setDiff } from '../../shared/history.ts'
import type { Artifact, Citation, Item, Question } from '../../shared/types.ts'
import { RecordMark, StatusLabel, markClass } from '../components/bits.tsx'
import { guarded, useOpenRecord } from '../nav.ts'
import {
  ArtifactKindCell,
  ArtifactRefAt,
  Empty,
  ExtraCell,
  LaneCell,
  ListCell,
  ParentCell,
  PlainCell,
  QuestionKindCell,
  RecordAt,
  RegionsCell,
  ShotsCell,
  SourceName,
  TypeCell,
  markOf,
  type Side,
} from './DiffFields.tsx'
import { FileRows, FileSide } from './DiffFile.tsx'
import { Pair, TextBlocks, TextRows } from './DiffProse.tsx'

/* ------------------------------------------------------------------ Field definitions */

/** A field of record `R` whose value is text (so it can be read as Markdown). */
type TextKey<R> = { [K in keyof R]-?: R[K] extends string | null | undefined ? K : never }[keyof R] & string

/** A side's cell: `mine` is the record at that side, `other` the one opposite (itself when there is none). */
type Cell<R, E> = (side: Side, mine: R, other: R, expanded: boolean, entry: E) => ReactNode

/**
 * How one field of a record is drawn: as Markdown text, paired by paragraph (`lines`: line by line,
 * as code), or as a cell per side. A `simple` field is short (status, area, kind...): it goes on the
 * card's summary line under its head, not in a row, and `summary` draws its change there as one.
 */
type FieldDef<R, E> =
  | { field: TextKey<R>; label: string; text: { lines?: boolean } }
  | { field: Exclude<keyof R, 'id'> & string; label: string; simple?: true; cell: Cell<R, E>; summary?: (before: R, after: R) => ReactNode }

/** A list field's cell: this side's entries, the ones only on this side marked. */
const listOf =
  <R, E>(get: (r: R) => string[], render: (v: string, side: Side, entry: E) => ReactNode, chips = false): Cell<R, E> =>
  (side, mine, other, expanded, entry) => <ListCell list={get(mine)} other={get(other)} side={side} expanded={expanded} chips={chips} keyOf={(s) => s} render={(v) => render(v, side, entry)} />

/** The area: chips, and on the summary line the ones taken off struck and the ones put on tinted. */
const area = <R extends { components: string[] }, E>() => ({
  cell: listOf<R, E>((r) => r.components, (v) => <span className="chip">{v}</span>, true),
  summary: (b: R, a: R) => <ListChange before={b.components} after={a.components} />,
})
const sources = <R extends { sources: string[] }, E extends Entry>(): Cell<R, E> =>
  listOf<R, E>((r) => r.sources, (v, side, e) => <SourceName source={v} side={side} self={e.kind === 'artifact' ? e.id : undefined} />)
const extra = <R extends { extra: Record<string, unknown> }, E>(): Cell<R, E> => (side, mine, other, expanded) => (
  <ExtraCell side={side} before={(side === 'before' ? mine : other).extra} after={(side === 'before' ? other : mine).extra} expanded={expanded} />
)

const ITEM_FIELDS: FieldDef<Item, ItemEntry>[] = [
  { field: 'parent', label: 'Sits under', cell: (side, mine) => <ParentCell parent={mine.parent} side={side} /> },
  { field: 'title', label: 'Title', text: {} },
  { field: 'status', simple: true, label: 'Status', cell: (_s, mine) => <StatusLabel kind="item" status={mine.status} /> },
  { field: 'type', simple: true, label: 'Type', cell: (_s, mine) => <TypeCell type={mine.type} /> },
  { field: 'description', label: 'Description', text: {} },
  { field: 'acceptance', label: 'Acceptance criteria', text: {} },
  { field: 'technical', label: 'Technical discussion', text: {} },
  { field: 'notes', label: 'Notes', text: {} },
  { field: 'related', label: 'Related', cell: listOf((r) => r.related ?? [], (v, side) => <RecordAt id={v} side={side} />) },
  { field: 'artifacts', label: 'Artifacts', cell: listOf((r) => r.artifacts ?? [], (v, side) => <ArtifactRefAt refText={v} side={side} />) },
  { field: 'sources', label: 'Sources', cell: sources() },
  {
    field: 'images',
    label: 'Screenshots',
    cell: (side, mine, other, expanded, entry) => <ShotsCell rec={entry.rec} side={side} list={mine.images} other={other.images} expanded={expanded} />,
  },
  { field: 'components', simple: true, label: 'Area', ...area<Item, ItemEntry>() },
  { field: 'swimlane', simple: true, label: 'Swimlane', cell: (_s, mine) => (mine.type === 'story' ? <LaneCell lane={mine.swimlane} /> : <Empty />) },
  { field: 'order', simple: true, label: 'Position among its siblings', cell: (_s, mine) => <PlainCell value={mine.order} /> },
  { field: 'extra', label: 'Other details', cell: extra() },
]

const QUESTION_FIELDS: FieldDef<Question, QuestionEntry>[] = [
  { field: 'title', label: 'Title', text: {} },
  { field: 'status', simple: true, label: 'Status', cell: (_s, mine) => <StatusLabel kind="question" status={mine.status} /> },
  { field: 'kind', simple: true, label: 'Kind', cell: (_s, mine) => <QuestionKindCell kind={mine.kind} /> },
  { field: 'owner', simple: true, label: 'Owner', cell: (_s, mine) => <PlainCell value={mine.owner} /> },
  { field: 'affects', label: 'Affects', cell: listOf((r) => r.affects, (v, side) => <RecordAt id={v} side={side} />) },
  { field: 'question', label: 'Question', text: {} },
  { field: 'answer', label: 'Answer', text: {} },
  { field: 'sources', label: 'Sources', cell: sources() },
  { field: 'extra', label: 'Other details', cell: extra() },
]

const ARTIFACT_FIELDS: FieldDef<Artifact, ArtifactEntry>[] = [
  { field: 'title', label: 'Name', text: {} },
  { field: 'status', simple: true, label: 'Status', cell: (_s, mine) => <StatusLabel kind="artifact" status={mine.status} /> },
  { field: 'supersededBy', simple: true, label: 'Replaced by', cell: (side, mine) => (mine.supersededBy ? <ArtifactRefAt refText={mine.supersededBy} side={side} /> : <Empty />) },
  { field: 'kind', simple: true, label: 'Kind', cell: (_s, mine) => <ArtifactKindCell kind={mine.kind} /> },
  { field: 'date', simple: true, label: 'Date', cell: (_s, mine) => <PlainCell value={mine.date} /> },
  { field: 'author', simple: true, label: 'Author', cell: (_s, mine) => <PlainCell value={mine.author} /> },
  { field: 'components', simple: true, label: 'Area', ...area<Artifact, ArtifactEntry>() },
  { field: 'description', label: 'Description', text: {} },
  { field: 'file', label: 'File path', cell: (_s, mine) => <PlainCell value={mine.file} mono /> },
  {
    field: 'regions',
    label: 'Highlights',
    cell: (side, mine, other, expanded) => <RegionsCell side={side} before={(side === 'before' ? mine : other).regions} after={(side === 'before' ? other : mine).regions} expanded={expanded} />,
  },
  { field: 'source', label: 'Diagram source', text: { lines: true } },
  { field: 'sources', label: 'Sources', cell: sources() },
  {
    field: 'citedAs',
    label: 'Cited as',
    cell: (side, mine, other, expanded) => (
      <ListCell list={mine.citedAs ?? []} other={other.citedAs ?? []} side={side} expanded={expanded} keyOf={(c) => JSON.stringify(c)} render={(c) => <CitationName c={c} />} />
    ),
  },
  { field: 'extra', label: 'Other details', cell: extra() },
]

const hasContent = (v: unknown) =>
  !(v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0))

/** A field bound to one card's record: what the card draws, with no record type left to cast. */
type Field = { field: string; label: string; simple: boolean; has: (side: Side) => boolean } & (
  | { kind: 'text'; lines?: boolean; text: (side: Side) => string }
  | { kind: 'cell'; cell: (side: Side, expanded: boolean) => ReactNode; summary?: () => ReactNode }
)

const opposite = (side: Side): Side => (side === 'before' ? 'after' : 'before')

function bind<R extends object, E extends Entry>(defs: FieldDef<R, E>[], entry: E, rec: { before: R | null; after: R | null }): Field[] {
  return defs.map((d): Field => {
    const has = (side: Side) => !!rec[side] && hasContent(rec[side][d.field])
    if ('text' in d) return { kind: 'text', field: d.field, label: d.label, simple: false, has, lines: d.text.lines, text: (side) => String(rec[side]?.[d.field] ?? '') }
    const { before, after } = rec
    return {
      kind: 'cell',
      field: d.field,
      label: d.label,
      simple: !!d.simple,
      has,
      // An added or removed card has one side: it stands in for the other, so nothing reads as changed.
      cell: (side, expanded) => {
        const mine = rec[side]
        return mine ? d.cell(side, mine, rec[opposite(side)] ?? mine, expanded, entry) : <Empty />
      },
      summary: d.summary && before && after ? () => d.summary!(before, after) : undefined,
    }
  })
}

/** Each card's fields, bound once (entries are kept while their record reads the same). */
const BOUND = new WeakMap<Entry, Field[]>()
function fieldsOf(entry: Entry): Field[] {
  let out = BOUND.get(entry)
  if (!out) {
    out = entry.kind === 'item' ? bind(ITEM_FIELDS, entry, entry.rec) : entry.kind === 'question' ? bind(QUESTION_FIELDS, entry, entry.rec) : bind(ARTIFACT_FIELDS, entry, entry.rec)
    BOUND.set(entry, out)
  }
  return out
}

/** A `cited_as` entry: the words a source starts with, then where it opens, quieter. */
function CitationName({ c }: { c: Citation }) {
  const where = [c.within && `within ${c.within}`, c.spot && `at ${c.spot}`, c.pageOffset ? `pages offset by ${c.pageOffset}` : null].filter(Boolean).join(', ')
  return (
    <span>
      {c.as}
      {where && <span className="diff-note"> · {where}</span>}
    </span>
  )
}

/** Fields shown in the card: those that changed (minor ones only when shown), or all with something in them when expanded. */
function shownFields(entry: Entry, expanded: boolean, showMinor: boolean): { f: Field; changed: boolean }[] {
  const changed = new Set<string>(entry.changes.filter((c) => showMinor || !isMinorChange(c)).map((c) => c.field))
  return fieldsOf(entry).flatMap((f): { f: Field; changed: boolean }[] => {
    if (entry.change !== 'edited') {
      // The title is the card's head; the order is only where the card sits.
      return f.field !== 'title' && f.field !== 'order' && f.has(entry.change === 'added' ? 'after' : 'before') ? [{ f, changed: true }] : []
    }
    if (changed.has(f.field)) return [{ f, changed: true }]
    if (expanded && f.field !== 'title' && (f.has('before') || f.has('after'))) return [{ f, changed: false }]
    return []
  })
}

const PLACEHOLDER: Record<'added' | 'removed', string> = { added: "Didn't exist yet", removed: 'Deleted' }

/** A list's change, as chips: the ones taken off struck, the ones put on tinted. */
function ListChange({ before, after }: { before: string[]; after: string[] }) {
  const { added, removed } = setDiff(before, after)
  if (!removed.length && !added.length) return <span className="diff-empty">Reordered</span>
  return (
    <span className="diff-chips inline">
      {removed.map((v) => (
        <span key={`-${v}`} className="diff-li del">
          <span className="chip">{v}</span>
        </span>
      ))}
      {added.map((v) => (
        <span key={`+${v}`} className="diff-li add">
          <span className="chip">{v}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * The short fields (status, area, kind, owner...) on one line under the card's head, so a status
 * change costs a line, not two rows: "Status (Agreed) to (Verify)". `side` for an added or removed
 * card, which shows its values; an edited one shows each change, and unchanged values when expanded.
 */
function SummaryLine({ fields, side }: { fields: { f: Field; changed: boolean }[]; side?: Side }) {
  if (!fields.length) return null
  const changedAny = !side && fields.some((f) => f.changed)
  return (
    <div className="diff-summary" data-hunk={changedAny ? '' : undefined}>
      {fields.map(({ f, changed }) =>
        f.kind !== 'cell' ? null : (
          <span key={f.field} className={`diff-sum${side || changed ? '' : ' same'}`}>
            <span className="diff-sum-k">{f.label}</span>
            {side ? (
              f.cell(side, true)
            ) : !changed ? (
              f.cell('after', true)
            ) : f.summary ? (
              f.summary()
            ) : (
              <>
                <span className="diff-sum-was">{f.cell('before', true)}</span>
                <span className="diff-sum-to">to</span>
                {f.cell('after', true)}
              </>
            )}
          </span>
        ),
      )}
    </div>
  )
}

const textLength = (r: object | null | undefined, fields?: Set<string>) =>
  r ? Object.entries(r).reduce((n, [k, v]) => n + (typeof v === 'string' && (!fields || fields.has(k)) ? v.length : 0), 0) : 0

/**
 * About how tall the card is, from what it holds (fitted to real cards): the space a card not yet
 * drawn keeps, and the size the browser assumes for one it has not laid out, so the page keeps
 * about its length and the scrollbar about its place.
 */
function guessHeight(entry: Entry): number {
  const { before, after } = entry.rec
  if (entry.unreadable) return Math.round(Math.min(900, 160 + 0.2 * Math.max(entry.rec.beforeText?.length ?? 0, entry.rec.afterText?.length ?? 0, textLength(before ?? after))))
  if (entry.change !== 'edited') return Math.round(Math.min(2500, 350 + 0.37 * textLength(before ?? after)))
  const fields = new Set<string>(entry.changes.filter((c) => !isMinorChange(c)).map((c) => c.field))
  const text = Math.max(textLength(before, fields), textLength(after, fields))
  return Math.round(Math.min(2500, Math.max(100, 90 + 110 * fields.size + 0.12 * text)))
}

/**
 * The card; memoised, so it redraws only when its own props change. `pending`: not drawn yet (the
 * page fills its cards in a few at a time), only its head and a space about its height.
 */
/** The record's ID, quiet beside its title: a click copies the ID itself, to paste anywhere. */
function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const copy = () => void navigator.clipboard?.writeText(id).then(() => setCopied(true), () => {})
  return (
    <button type="button" className="copy-link diff-card-id" onClick={copy} title={`Copy ${id}`} aria-label={copied ? `${id} copied` : `Copy ${id}`}>
      {copied ? 'Copied' : id}
    </button>
  )
}

export const DiffCard = memo(function DiffCard({
  entry,
  expanded,
  viewed,
  showMinor,
  pending,
  onExpand,
  onViewed,
}: {
  entry: Entry
  expanded: boolean
  viewed: boolean
  /** Show minor changes: passed only to a card that has a minor change. */
  showMinor: boolean
  pending?: boolean
  onExpand: (key: string) => void
  onViewed: (entry: Entry, on: boolean) => void
}) {
  const open = useOpenRecord()
  const guess = useMemo(() => guessHeight(entry), [entry])
  const all = shownFields(entry, expanded, showMinor)
  const short = all.filter(({ f }) => f.simple)
  const fields = all.filter(({ f }) => !f.simple)
  const art = entry.kind === 'artifact' ? entry : null
  const showFile = !!art && (art.fileChanged || (entry.change !== 'edited' && (art.rec.fileBefore || art.rec.fileAfter || shownOf(art.rec)?.source)) || expanded)
  // A record whose file does not parse now is not on the board to open.
  const canOpen = entry.change !== 'removed' && !!entry.rec.after
  const go = () => guarded(() => (entry.kind === 'item' ? open.item(entry.id) : entry.kind === 'question' ? open.question(entry.id) : open.artifact(entry.id)))
  const mark = markOf(entry)
  const fileFirst = art && showFile && !fields.some(({ f }) => f.field === 'description')

  return (
    <article
      id={`diff-${entry.key}`}
      className={`diff-card ${markClass(mark)} change-${entry.change}${viewed ? ' viewed' : ''}`}
      aria-label={entry.title}
      style={{ containIntrinsicSize: `auto ${viewed ? 60 : guess}px` }}
    >
      <header className="diff-card-head">
        <div className="diff-card-title">
          <RecordMark mark={mark} size={entry.kind === 'item' ? (entry.type === 'epic' ? 17 : 15) : 16} />
          <h3>{entry.title}</h3>
          <CopyId id={entry.id} />
          {entry.change === 'added' && <span className="diff-pill add">Added</span>}
          {entry.change === 'removed' && <span className="diff-pill del">Removed</span>}
          {entry.kind === 'item' && entry.moved && <span className="diff-pill moved">Moved</span>}
          {entry.minor && <span className="diff-pill quiet">Minor</span>}
          {entry.unreadable && <span className="diff-pill bad">Could not be read</span>}
        </div>
        <div className="diff-card-actions">
          {!viewed && entry.change === 'edited' && (
            <button type="button" className="btn ghost sm" onClick={() => onExpand(entry.key)} aria-pressed={expanded} title={expanded ? 'Show only what changed' : 'Show every field, changed or not'}>
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {expanded ? 'Changes only' : 'Whole card'}
            </button>
          )}
          {canOpen && (
            <button type="button" className="btn ghost sm" onClick={go} title="Open it as it is now">
              <ArrowUpRight size={14} /> Open
            </button>
          )}
          <label className="diff-viewed">
            <input type="checkbox" checked={viewed} onChange={(e) => onViewed(entry, e.target.checked)} />
            Viewed
          </label>
        </div>
      </header>
      {!viewed && pending && <div className="diff-card-pending" style={{ height: Math.max(0, guess - 48) }} />}
      {!viewed && !pending && !entry.unreadable && <SummaryLine fields={short} side={entry.change === 'added' ? 'after' : entry.change === 'removed' ? 'before' : undefined} />}
      {!viewed &&
        !pending &&
        (entry.unreadable ? (
          <Unreadable entry={entry} />
        ) : entry.change === 'edited' ? (
          (fields.length > 0 || (art && showFile)) && (
            <div className="diff-grid">
              {fileFirst && <FileRows rec={art.rec} changed={art.fileChanged} />}
              {fields.map(({ f, changed }) => (
                <Fragment key={f.field}>
                  {f.kind === 'text' ? (
                    <TextRows before={f.text('before')} after={f.text('after')} lines={f.lines} expanded={expanded || !changed} tag={f.label} />
                  ) : (
                    <Pair op={changed ? 'edited' : 'same'} tag={f.label} before={f.cell('before', expanded)} after={f.cell('after', expanded)} />
                  )}
                  {f.field === 'description' && art && showFile && <FileRows rec={art.rec} changed={art.fileChanged} />}
                </Fragment>
              ))}
            </div>
          )
        ) : (
          <OneSided entry={entry} fields={fields.map(({ f }) => f)} art={showFile ? art : null} />
        ))}
    </article>
  )
})

/** One side's record whole, field by field (an added or removed record, or the readable side of one that does not parse). */
function Whole({ side, fields, art }: { side: Side; fields: Field[]; art: ArtifactEntry | null }) {
  const tag = side === 'after' ? 'ins' : 'del'
  return (
    <div className="diff-whole">
      {fields.map((f) => (
        <section key={f.field} className="diff-sec">
          <h4>{f.label}</h4>
          {f.kind === 'text' ? <TextBlocks text={f.text(side)} tag={tag} lines={f.lines} /> : f.cell(side, true)}
        </section>
      ))}
      {art && (
        <section className="diff-sec">
          <h4>File</h4>
          <FileSide rec={art.rec} side={side} />
        </section>
      )}
    </div>
  )
}

/**
 * A record whose file is there but does not parse on one side or both (a hand edit gone wrong, a
 * merge conflict): that side says so, with the parser's message and the file's text; the other
 * side, when it reads, is the record whole.
 */
function Unreadable({ entry }: { entry: Entry }) {
  const cell = (side: Side) => {
    const error = side === 'before' ? entry.rec.beforeError : entry.rec.afterError
    if (error != null) {
      const text = side === 'before' ? entry.rec.beforeText : entry.rec.afterText
      return (
        <div className="diff-unreadable">
          <p>
            <strong>This file does not parse.</strong> {error}
          </p>
          {text ? <pre className="diff-raw">{text}</pre> : null}
        </div>
      )
    }
    if (!entry.rec[side]) return <div className="diff-placeholder">{PLACEHOLDER[side === 'before' ? 'added' : 'removed']}</div>
    const fields = fieldsOf(entry).filter((f) => f.field !== 'title' && f.field !== 'order' && f.has(side))
    return <Whole side={side} fields={fields} art={null} />
  }
  // An artifact's details sit in their own file: its drawing or document still compares, wherever
  // either side names it (a side that does not parse, by its `file:` line).
  const art = entry.kind === 'artifact' && (entry.rec.fileBefore || entry.rec.fileAfter) ? entry : null
  return (
    <div className="diff-grid one">
      <Pair op={entry.change} tag={entry.kind === 'artifact' ? 'Details' : 'File'} before={cell('before')} after={cell('after')} />
      {art && <FileRows rec={art.rec} changed={art.fileChanged} />}
    </div>
  )
}

/** An added or removed record: a placeholder on the side it is missing from, the whole card on the other. */
function OneSided({ entry, fields, art }: { entry: Entry; fields: Field[]; art: ArtifactEntry | null }) {
  if (entry.change === 'edited' || (!fields.length && !art)) return null
  const side: Side = entry.change === 'added' ? 'after' : 'before'
  const body = <Whole side={side} fields={fields} art={art} />
  const placeholder = <div className="diff-placeholder">{PLACEHOLDER[entry.change]}</div>
  return (
    <div className="diff-grid one">
      <Pair op={entry.change} before={side === 'before' ? body : placeholder} after={side === 'after' ? body : placeholder} />
    </div>
  )
}

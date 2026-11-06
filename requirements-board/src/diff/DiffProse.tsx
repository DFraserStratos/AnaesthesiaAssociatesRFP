/**
 * Markdown blocks in the Diff review, typeset like the sheet's prose (links to cards work), with the
 * changed words marked: struck on a rose tint on the before side, on a green tint on the after.
 * To keep a long card short: each field's name is a tag on the seam at its first row (no row of its
 * own), an unchanged paragraph kept beside a change shows as one quiet line until clicked, and an
 * edited paragraph shows only the sentences that changed, the rest a "…" that opens it.
 */
import { Fragment, memo, useCallback, useId, useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import Markdown, { type Components, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { hash } from '../../shared/diffModel.ts'
import { MARK_CLOSE, MARK_OPEN, foldRows, markPair, pairBlocks, sentenceFold, splitBlocks, type Block, type Row } from '../../shared/proseDiff.ts'
import { liveRecordLinkComponents, remarkLiveRecordIds } from '../components/Prose.tsx'
import { currentIndex, useCatalogue } from '../store.ts'
import { remarkDiffMarks } from './diffMarks.ts'

type Tag = 'del' | 'ins'

function ProseTable({ children }: { children?: ReactNode }) {
  return (
    <div className="prose-table">
      <table>{children}</table>
    </div>
  )
}

/**
 * The Markdown kit, one per side, built once for the page: the plugins read the catalogue when a
 * block is parsed and the links read it when they draw, so a parsed block stays parsed as the
 * store changes.
 */
const COMPONENTS: Components = { ...liveRecordLinkComponents, table: ProseTable }
const PLUGINS: Record<Tag, Options['remarkPlugins']> = {
  del: [[remarkGfm, { singleTilde: false }], remarkLiveRecordIds, remarkDiffMarks('del')],
  ins: [[remarkGfm, { singleTilde: false }], remarkLiveRecordIds, remarkDiffMarks('ins')],
}

/**
 * Parsed blocks, by side and text, kept across renders and visits to the tab: parsing is the cost
 * of the page. Cleared when the catalogue's records change, as a parse folds in record titles.
 */
const PARSED = new Map<string, ReactNode>()
const PARSED_MAX = 8000
let parsedFor: { index: unknown; artifacts: unknown } = { index: null, artifacts: null }
function parsed(text: string, tag: Tag): ReactNode {
  const now = { index: currentIndex(), artifacts: useCatalogue.getState().artifacts }
  if (now.index !== parsedFor.index || now.artifacts !== parsedFor.artifacts) {
    PARSED.clear()
    parsedFor = now
  }
  const key = `${tag}:${text}`
  let out = PARSED.get(key)
  if (out === undefined) {
    out = Markdown({ children: text, remarkPlugins: PLUGINS[tag], components: COMPONENTS })
    if (PARSED.size >= PARSED_MAX) PARSED.delete(PARSED.keys().next().value!)
    PARSED.set(key, out)
  }
  return out
}

/** One block of Markdown, its marked words (if any) drawn as `tag`. A "…" left by a sentence fold calls `onEllipsis`. */
export const DiffProse = memo(function DiffProse({ text, tag, block, onEllipsis }: { text: string; tag: Tag; block?: Block; onEllipsis?: () => void }) {
  const line = block?.kind === 'line'
  const md = useMemo(() => (line ? null : parsed(text, tag)), [line, text, tag])
  if (line) return <CodeLine text={text} tag={tag} />
  const onClick = (e: MouseEvent) => {
    if (onEllipsis && (e.target as Element).closest('.diff-ell')) onEllipsis()
  }
  return (
    <div className={`prose diff-prose${block?.depth ? ` depth-${Math.min(block.depth, 4)}` : ''}`} onClick={onClick}>
      {md}
    </div>
  )
})

/** A line of a diagram's source, in the code face, its changed words marked. */
function CodeLine({ text, tag }: { text: string; tag: Tag }) {
  const parts: ReactNode[] = []
  let on = false
  text.split(new RegExp(`([${MARK_OPEN}${MARK_CLOSE}])`)).forEach((p, i) => {
    if (p === MARK_OPEN) on = true
    else if (p === MARK_CLOSE) on = false
    else if (p) parts.push(on ? (tag === 'del' ? <del key={i} className="dm">{p}</del> : <ins key={i} className="dm">{p}</ins>) : <Fragment key={i}>{p}</Fragment>)
  })
  return <div className="diff-code">{parts.length ? parts : ' '}</div>
}

type PairOp = Row['op'] | 'rewritten'

/** A field's name as a tag on the seam, at the first row of the field. */
const SeamTag = ({ label }: { label?: string }) => (label ? <span className="diff-tag">{label}</span> : null)

/**
 * A preview's content, inert while folded: its links and buttons can't be focused or clicked (a
 * click goes to the row, which opens it), and a screen reader meets one button, not links inside one.
 */
const Inert = ({ children }: { children: ReactNode }) => <div {...{ inert: '' }}>{children}</div>

/**
 * The three cells of one row: before, the seam, after. `tag` puts the field's name on the seam
 * above this row. A changed row is a stop for the j and k keys (`data-hunk` on its before cell), and
 * its two cells share a `data-row`, so a key rings the whole row. `onOpen` makes the row a quiet
 * one-line preview that opens on a click or Enter.
 */
export function Pair({ op, before, after, tag, onOpen }: { op: PairOp; before: ReactNode; after: ReactNode; tag?: string; onOpen?: () => void }) {
  const row = useId()
  // A rewritten block is tinted whole on both sides, its seam band as for any edit.
  const del = op === 'removed' || op === 'rewritten'
  const add = op === 'added' || op === 'rewritten'
  const extra = `${tag ? ' tagged' : ''}${onOpen ? ' ctx' : ''}`
  const open = onOpen
    ? {
        onClick: onOpen,
        onKeyDown: (e: KeyboardEvent) => e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen()),
        role: 'button',
        tabIndex: 0,
        title: 'Unchanged. Click to read it whole',
      }
    : {}
  return (
    <>
      <div className={`dc before${del ? ' blk-del' : ''}${before == null ? ' gap' : ''}${extra}`} data-row={row} data-hunk={op !== 'same' ? '' : undefined} {...open}>
        {onOpen && before != null ? <Inert>{before}</Inert> : before}
      </div>
      <div className={`seam ${op === 'rewritten' ? 'edited' : op}`} aria-hidden={!tag}>
        <SeamTag label={tag} />
      </div>
      <div className={`dc after${add ? ' blk-add' : ''}${after == null ? ' gap' : ''}${extra}`} data-row={row} {...(onOpen ? { onClick: onOpen } : {})}>
        {onOpen && after != null ? <Inert>{after}</Inert> : after}
      </div>
    </>
  )
}

/**
 * Keys for a field's rows, from what they hold (a repeat counted on), so a row opened by the reader
 * stays with its paragraph when a refresh adds one above it, or the card switches to Whole card.
 */
function rowKeys(rows: (Row | { fold: Row[] })[]): string[] {
  const seen = new Map<string, number>()
  const keyOfRow = (r: Row) => `${r.op}:${hash(r.before?.text ?? '')}|${hash(r.after?.text ?? '')}`
  return rows.map((r) => {
    const k = 'fold' in r ? `f:${r.fold[0] ? keyOfRow(r.fold[0]) : ''}` : keyOfRow(r)
    const n = seen.get(k) ?? 0
    seen.set(k, n + 1)
    return n ? `${k}#${n}` : k
  })
}

/**
 * One row of a text field, as a pair of cells. `context`: an unchanged row kept beside a change,
 * shown as one quiet line until opened. `whole`: no sentence folding (the card is expanded).
 */
const TextRow = memo(function TextRow({ row, tag, context, whole }: { row: Row; tag?: string; context?: boolean; whole?: boolean }) {
  const [open, setOpen] = useState(false)
  const more = useCallback(() => setOpen(true), [])
  // The word diff and the sentence fold, once per row (and fold state), not on every render.
  const m = useMemo(() => (row.op === 'edited' ? markPair(row.before!, row.after!) : null), [row])
  const fold = !!m && !m.rewritten && !whole && !open
  const folded = useMemo(() => (m && fold ? [sentenceFold(m.before, row.before!.kind), sentenceFold(m.after, row.after!.kind)] : null), [m, fold, row])
  if (m) {
    const b = folded?.[0] || m.before
    const a = folded?.[1] || m.after
    return (
      <Pair
        op={m.rewritten ? 'rewritten' : 'edited'}
        tag={tag}
        before={<DiffProse text={b} tag="del" block={row.before!} onEllipsis={more} />}
        after={<DiffProse text={a} tag="ins" block={row.after!} onEllipsis={more} />}
      />
    )
  }
  return (
    <Pair
      op={row.op}
      tag={tag}
      onOpen={context && row.op === 'same' && !open ? () => setOpen(true) : undefined}
      before={row.before ? <DiffProse text={row.before.text} tag="del" block={row.before} /> : null}
      after={row.after ? <DiffProse text={row.after.text} tag="ins" block={row.after} /> : null}
    />
  )
})

const UNIT: Record<string, [string, string]> = { item: ['item', 'items'], line: ['line', 'lines'] }

/** A run of unchanged rows folded to one line that opens it; once open, a line above it folds it again. */
function FoldRow({ rows, tag }: { rows: Row[]; tag?: string }) {
  const [open, setOpen] = useState(false)
  const kind = rows[0]?.before?.kind
  const [one, many] = UNIT[kind === 'item' ? 'item' : kind === 'line' ? 'line' : ''] ?? ['paragraph', 'paragraphs']
  const what = `${rows.length} unchanged ${rows.length === 1 ? one : many}`
  return (
    <>
      <div className={`diff-fold-row${tag ? ' tagged' : ''}`}>
        <SeamTag label={tag} />
        <button type="button" className={`diff-fold${open ? ' open' : ''}`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? `Hide ${what}` : what}
        </button>
      </div>
      {open && rowKeys(rows).map((k, i) => <TextRow key={k} row={rows[i]!} whole />)}
    </>
  )
}

/**
 * A Markdown field, side by side: paired paragraph by paragraph. Unless the card is expanded,
 * unchanged runs fold, the row kept either side of a change is a one-line preview, and edited
 * paragraphs show only their changed sentences. `tag` is the field's name, put on its first row.
 */
export function TextRows({ before, after, lines, expanded, tag }: { before: string; after: string; lines?: boolean; expanded: boolean; tag?: string }) {
  const rows = useMemo(() => pairBlocks(splitBlocks(before, { lines }), splitBlocks(after, { lines })), [before, after, lines])
  const shown = useMemo(() => (expanded ? rows : foldRows(rows, 1)), [rows, expanded])
  const keys = useMemo(() => rowKeys(shown), [shown])
  return (
    <>
      {shown.map((r, i) => {
        const t = i === 0 ? tag : undefined
        return 'fold' in r ? <FoldRow key={keys[i]} rows={r.fold} tag={t} /> : <TextRow key={keys[i]} row={r} tag={t} context={!expanded} whole={expanded} />
      })}
    </>
  )
}

/** A Markdown field on one side only (an added or removed record): typeset whole. */
export function TextBlocks({ text, tag, lines }: { text: string; tag: Tag; lines?: boolean }) {
  const blocks = useMemo(() => splitBlocks(text, { lines }), [text, lines])
  return (
    <>
      {blocks.map((b, i) => (
        <DiffProse key={i} text={b.text} tag={tag} block={b} />
      ))}
    </>
  )
}

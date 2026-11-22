/**
 * The Diff review tab: the catalogue compared between two git states, every changed card,
 * outstanding item and artifact as a before and after, in the order of the Mapped view. By default
 * the last commit that changed the catalogue against what is on disk now; with nothing uncommitted,
 * what that last commit changed. While To is what is on disk, it refreshes in place as files change.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EMPTY_TREE, WORKTREE } from '../../shared/diff.ts'
import { ALL_FILTERS, canonicalRef, counts as countsOf, pageRows, passes, type Filters } from '../../shared/diffModel.ts'
import { isMinorChange } from '../../shared/history.ts'
import { statusCodes } from '../../shared/statuses.ts'
import type { SourceIndex } from '../../shared/sources.ts'
import type { Artifact, Item, Question } from '../../shared/types.ts'
import { TypeIcon } from '../components/bits.tsx'
import { guarded, useOpenRecord } from '../nav.ts'
import { sourceIndexAt, useSourceIndex } from '../sourceRows.ts'
import { useCatalogue, useConfig, useIndex } from '../store.ts'
import { usePersistentState } from '../usePersistentState.ts'
import { typeClass } from '../vocab.ts'
import { DENSITIES, DiffBar, StickyBar } from './DiffBar.tsx'
import { DiffCard } from './DiffCard.tsx'
import { LookupContext, type Lookup, type Side } from './DiffFields.tsx'
import './diff.css'
import { cancelLanding, flash, land } from './scroll.ts'
import { comparisonOf, useDiffData } from './useDiffData.ts'
import { useDiffKeys } from './useDiffKeys.ts'
import { useProgressiveDraw } from './useProgressiveDraw.ts'
import { isViewed, useViewed } from './viewedStore.ts'

export function DiffView() {
  const [params, setParams] = useSearchParams()
  const fromParam = params.get('from')
  const toParam = params.get('to')
  const page = useRef<HTMLDivElement>(null)
  const face = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  // Another comparison altogether: start it from the top.
  const { auto, commits, data, error, stale } = useDiffData(fromParam, toParam, () => page.current?.scrollTo({ top: 0 }))
  const viewed = useViewed(comparisonOf(data))
  const [filters, setFilters] = useState<Filters>(ALL_FILTERS)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // Compact unless the reader picked Comfortable (kept per browser).
  const [density, setDensity] = usePersistentState('requirements-board:diff-density', 'compact', DENSITIES)

  const toggleExpanded = useCallback((key: string) => {
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const lanes = useCatalogue((s) => s.layout.lanes)
  const config = useConfig()
  const index = useIndex()
  const artifacts = useCatalogue((s) => s.artifacts)
  const todaySources = useSourceIndex()
  const entries = useMemo(() => data?.entries ?? [], [data])
  const shown = useMemo(() => entries.filter((e) => passes(e, filters)), [entries, filters])
  const rows = useMemo(
    () => (data ? pageRows(shown, { context: data.res.context, all: entries, lanes, questionOrder: statusCodes(config, 'question') }) : []),
    [data, entries, shown, lanes, config],
  )
  const cardsInOrder = useMemo(() => rows.flatMap((r) => (r.row === 'card' ? [r.entry] : [])), [rows])
  const counts = useMemo(() => countsOf(entries, filters), [entries, filters])
  /** Cards with a minor change: only these redraw when Show minor changes is switched. */
  const hasMinor = useMemo(() => new Set(entries.filter((e) => e.changes.some(isMinorChange)).map((e) => e.key)), [entries])

  // Names as they stood at each side: the changed records' own versions (removed ones too), the
  // context the server sent, else the catalogue now.
  const lookup = useMemo((): Lookup => {
    const sides = () => ({ items: new Map<string, Item>(), questions: new Map<string, Question>(), artifacts: new Map<string, Artifact>() })
    const bySide = { before: sides(), after: sides() }
    if (data) {
      for (const side of ['before', 'after'] as const) {
        const at = bySide[side]
        for (const [id, it] of Object.entries(data.res.context[side])) at.items.set(id, it)
        for (const e of data.entries) {
          if (e.kind === 'item') {
            const r = e.rec[side]
            if (r) at.items.set(e.id, r)
          } else if (e.kind === 'question') {
            const r = e.rec[side]
            if (r) at.questions.set(e.id, r)
          } else {
            const r = e.rec[side]
            if (r) at.artifacts.set(e.id, r)
          }
        }
      }
    }
    // Artifacts that read differently at a side (or are gone now), as the server sent them.
    const then = { before: data?.res.context.artifacts?.before ?? {}, after: data?.res.context.artifacts?.after ?? {} }
    const sourceIndexes: Partial<Record<Side, SourceIndex>> = {}
    return {
      item: (id, side) => bySide[side].items.get(id) ?? index.byId.get(id),
      question: (id, side) => bySide[side].questions.get(id) ?? useCatalogue.getState().questions[id]?.data,
      artifact: (id, side) => bySide[side].artifacts.get(id) ?? then[side][id] ?? artifacts[id]?.data,
      sources: (side) => (sourceIndexes[side] ??= sourceIndexAt(artifacts, then[side], todaySources)),
    }
  }, [data, index, artifacts, todaySources])

  const { isDrawn, drawAround } = useProgressiveDraw(cardsInOrder, page)
  const barHeight = useCallback(() => face.current?.offsetHeight ?? 0, [])
  // Leaving the tab ends any landing still moving the page.
  useEffect(() => {
    const el = page.current
    return () => {
      if (el) cancelLanding(el)
    }
  }, [])
  useDiffKeys({ page, barHeight, paused: stale || params.has('item') || params.has('question'), cards: cardsInOrder, drawAround, viewed })

  /** The jump list's pick: draw it, land it under the bar, ring it. */
  const jump = (key: string) => {
    drawAround(key)
    const el = document.getElementById(`diff-${key}`)
    if (!el || !page.current) return
    land(page.current, el, barHeight)
    flash([el])
  }

  const pick = (from: string, to: string) => {
    const next = new URLSearchParams(params)
    next.set('from', from)
    next.set('to', to)
    setParams(next)
  }

  // The bar names what was asked for at once; the cards follow when git has been read.
  const from = !auto ? canonicalRef(fromParam!, commits) : data && !stale ? data.res.from : commits ? canonicalRef(commits.head ?? EMPTY_TREE, commits) : ''
  const to = !auto ? (toParam === WORKTREE ? toParam : canonicalRef(toParam!, commits)) : data && !stale ? data.res.to : WORKTREE
  const viewedCount = shown.filter((e) => isViewed(viewed.viewed, e)).length

  return (
    <div className={`page diff-page ${density}`} ref={page}>
      <div className="diff-inner">
        <div className="page-head diff-head" ref={head}>
          <div>
            <h1>Diff review</h1>
            <p>What changed in the catalogue between two versions, before on the left and after on the right.</p>
          </div>
        </div>
        {commits && !commits.available ? (
          <p className="diff-state">This catalogue isn&rsquo;t in a git repository, so there&rsquo;s nothing to compare. Commit the requirements folder to git to start.</p>
        ) : (
          <>
            <StickyBar page={page} head={head} face={face}>
              {(slim, showAll) => (
                <DiffBar
                  from={from}
                  to={to}
                  commits={commits?.commits ?? []}
                  onPick={pick}
                  filters={filters}
                  setFilters={setFilters}
                  counts={counts}
                  shown={cardsInOrder}
                  viewedCount={viewedCount}
                  onJump={jump}
                  note={data?.jumped && !stale ? 'Nothing is uncommitted, so this shows what the last commit changed.' : null}
                  slim={slim}
                  onShowAll={showAll}
                  density={density}
                  setDensity={setDensity}
                />
              )}
            </StickyBar>
            {/* While a new comparison is read, nothing the old one said speaks for it: only its cards stay, dimmed (R-94). */}
            {error ? (
              <p className="diff-state bad">Git could not be read: {error}</p>
            ) : !data || (stale && !shown.length) ? (
              <p className="diff-state">Reading git</p>
            ) : !entries.length ? (
              <p className="diff-state">No card, outstanding item or artifact differs between these two versions.</p>
            ) : !shown.length ? (
              <p className="diff-state">
                Nothing matches the filters.{' '}
                <button type="button" className="btn sm" onClick={() => setFilters(ALL_FILTERS())}>
                  Show every change
                </button>
              </p>
            ) : (
              <LookupContext.Provider value={lookup}>
                {stale && (
                  <p className="diff-reading" role="status">
                    Reading git
                  </p>
                )}
                <div className={`diff-stream${stale ? ' stale' : ''}`} {...(stale ? { inert: '' } : {})}>
                  {rows.map((r) =>
                    r.row === 'heading' ? (
                      <Heading key={`h:${r.item.id}`} item={r.item} changed={r.changed} />
                    ) : r.row === 'section' ? (
                      <h2 key={`s:${r.title}`} className="diff-section">
                        {r.title} <span className="count">{r.count}</span>
                      </h2>
                    ) : (
                      <DiffCard
                        key={r.entry.key}
                        entry={r.entry}
                        expanded={expanded.has(r.entry.key)}
                        viewed={isViewed(viewed.viewed, r.entry)}
                        showMinor={filters.minor && hasMinor.has(r.entry.key)}
                        pending={!isDrawn(r.entry.key)}
                        onExpand={toggleExpanded}
                        onViewed={viewed.set}
                      />
                    ),
                  )}
                </div>
              </LookupContext.Provider>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * An epic or feature that changed cards sit under: a quiet heading, not a card. Unchanged, or
 * changed with its own card hidden by the filters (marked so, as the cards under it keep their place).
 */
const Heading = memo(function Heading({ item, changed }: { item: Item; changed: boolean }) {
  const open = useOpenRecord()
  return (
    <div className={`diff-heading ${typeClass(item.type)}${changed ? ' changed' : ''}`}>
      <button type="button" onClick={() => guarded(() => open.item(item.id))} title={`${item.id} · ${changed ? 'changed, hidden by the filters' : 'unchanged'}`}>
        <TypeIcon type={item.type} size={item.type === 'epic' ? 16 : 14} />
        <span>{item.title}</span>
        {changed && <span className="diff-pill quiet">Changed, hidden by the filters</span>}
      </button>
    </div>
  )
})

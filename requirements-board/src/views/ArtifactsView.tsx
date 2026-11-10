/**
 * Every artifact, grouped by kind, two ways (kept per browser): Grid, the light table, each artifact
 * a plate showing the thing itself; List, one row each, its picture small beside its name and a
 * line of its description. Either way one click opens the artifact's own page. Search covers
 * names, descriptions, highlights, sources and file paths. Retired artifacts stay off the tab (and
 * out of its counts) unless Show retired is on; a link or URL still opens one.
 */
import { Crosshair, LayoutGrid, Link2, ListOrdered, Rows3, Search } from 'lucide-react'
import { useState } from 'react'
import { ARTIFACT_KINDS, ARTIFACT_STATUSES, isPastArtifact, type ArtifactKind, type ArtifactRec } from '../../shared/types.ts'
import { artifactMatches, artifactShown, linkCount, useArtifactIndex, useArtifactView, type ArtifactIndex } from '../artifactIndex.ts'
import { Thumb } from '../artifacts/Thumb.tsx'
import { ArtifactIcon, Highlight, StatusLabel } from '../components/bits.tsx'
import { useOpen } from '../nav.ts'
import { useComponents } from '../store.ts'
import { ARTIFACT_KIND_LABEL, ARTIFACT_KIND_PLURAL, BASELINE_ARTIFACT_STATUS, artifactDate, excerpt } from '../vocab.ts'

export function ArtifactsView() {
  const ix = useArtifactIndex()
  const view = useArtifactView()
  const components = useComponents()
  const [query, setQuery] = useState('')
  const shown = ix.list.filter((r) => artifactMatches(r, view, query))
  const groups = ARTIFACT_KINDS.map((kind) => ({ kind, list: shown.filter((r) => r.data.kind === kind) })).filter((g) => g.list.length)
  // What is on the tab at all: retired artifacts only while Show retired is on.
  const onShow = ix.list.filter((r) => artifactShown(r, view))
  const retiredCount = ix.list.filter((r) => r.data.status === 'Retired').length
  const kindsPresent = ARTIFACT_KINDS.filter((k) => onShow.some((r) => r.data.kind === k))
  const componentsPresent = components.filter((c) => onShow.some((r) => r.data.components.includes(c)))
  // Retired is offered only while retired artifacts are on show (or still picked, so it can be cleared).
  const statusesPresent = ARTIFACT_STATUSES.filter((s) => onShow.some((r) => r.data.status === s) || view.statuses.includes(s))
  const toggleRetired = () => view.set({ showRetired: !view.showRetired, ...(view.showRetired && view.statuses.includes('Retired') ? { statuses: [] } : {}) })
  const toggleKind = (k: ArtifactKind) => view.set({ kinds: view.kinds.includes(k) ? view.kinds.filter((x) => x !== k) : [...view.kinds, k] })

  const tools = (
    <div className="page-tools artifact-tools">
      <label className="search">
        <Search size={15} />
        <span className="sr-only">Search artifacts</span>
        <input className="input" placeholder="Search artifacts" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="kind-filter" role="group" aria-label="Kinds">
        {kindsPresent.map((k) => (
          <button key={k} className="btn sm ty-artifact kind-toggle" aria-pressed={view.kinds.includes(k)} onClick={() => toggleKind(k)}>
            <ArtifactIcon kind={k} size={13} />
            {ARTIFACT_KIND_PLURAL[k]}
            <span className="mono kind-count">{onShow.filter((r) => r.data.kind === k).length}</span>
          </button>
        ))}
      </div>
      {statusesPresent.length > 1 && (
        <select className="select" value={view.statuses[0] ?? ''} onChange={(e) => view.set({ statuses: e.target.value ? [e.target.value as (typeof ARTIFACT_STATUSES)[number]] : [] })} aria-label="Status">
          <option value="">Any status</option>
          {statusesPresent.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
      {componentsPresent.length > 1 && (
        <select className="select" value={view.components[0] ?? ''} onChange={(e) => view.set({ components: e.target.value ? [e.target.value] : [] })} aria-label="Area">
          <option value="">Every area</option>
          {componentsPresent.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      )}
      {(retiredCount > 0 || view.showRetired) && (
        <button
          className="btn sm kind-toggle"
          aria-pressed={view.showRetired}
          onClick={toggleRetired}
          title={`${retiredCount} retired artifact${retiredCount === 1 ? '' : 's'}: no longer reflecting the design, kept for traceability`}
        >
          Show retired
          <span className="mono kind-count">{retiredCount}</span>
        </button>
      )}
      <span className="toolbar-spacer" />
      <div className="mode-switch" role="radiogroup" aria-label="Layout">
        <button role="radio" aria-checked={view.layout === 'grid'} onClick={() => view.set({ layout: 'grid' })} title="Grid: every artifact as a picture">
          <LayoutGrid size={13} /> Grid
        </button>
        <button role="radio" aria-checked={view.layout === 'list'} onClick={() => view.set({ layout: 'list' })} title="List: one row each, with a line of its description">
          <Rows3 size={13} /> List
        </button>
      </div>
    </div>
  )

  const empty = !ix.list.length ? (
    <p className="empty">No artifacts yet. An agent adds one as a file in the catalogue's artifacts folder (see the catalogue's SCHEMA.md).</p>
  ) : !onShow.length ? (
    <p className="empty">Every artifact is retired. Show retired to see them.</p>
  ) : !groups.length ? (
    <p className="empty">Nothing matches.</p>
  ) : null

  const list = view.layout === 'list'
  return (
    <div className="page artifacts-page">
      <div className="page-inner wide">
        <div className="page-head">
          <div>
            <h1>Artifacts</h1>
            <p>The diagrams, transcripts, notes and documents behind the requirements. A card can link to one, or to a highlighted spot in one.</p>
          </div>
        </div>
        {tools}
        {empty}
        {groups.map(({ kind, list: items }) => (
          <section key={kind} className="group">
            <h2 className="group-head">
              {ARTIFACT_KIND_PLURAL[kind]} <span className="mono">{items.length}</span>
            </h2>
            {list ? (
              <div className="artifact-rows">
                {items.map((r) => (
                  <Row key={r.data.id} rec={r} ix={ix} query={query} />
                ))}
              </div>
            ) : (
              <div className="plate-grid">
                {items.map((r) => (
                  <Plate key={r.data.id} rec={r} ix={ix} query={query} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

/** An artifact on the light table: the thing itself, then its name, then what points at it. */
function Plate({ rec, ix, query }: { rec: ArtifactRec; ix: ArtifactIndex; query: string }) {
  const open = useOpen()
  const a = rec.data
  return (
    <button className={`plate ty-artifact${isPastArtifact(a.status) ? ' is-past' : ''}`} onClick={() => open.artifact(a.id)} title={a.id}>
      <Thumb rec={rec} />
      <span className="plate-title">
        <Highlight text={a.title} query={query} />
      </span>
      <span className="plate-foot">
        <ArtifactIcon kind={a.kind} size={13} />
        <Counts rec={rec} ix={ix} />
        {a.date && (
          <time className="artifact-date" dateTime={a.date}>
            {artifactDate(a.date)}
          </time>
        )}
        {a.status !== BASELINE_ARTIFACT_STATUS && <StatusLabel kind="artifact" status={a.status} />}
      </span>
    </button>
  )
}

/** An artifact as a row: its picture small, its name and a line of its description, then what points at it. */
function Row({ rec, ix, query }: { rec: ArtifactRec; ix: ArtifactIndex; query: string }) {
  const open = useOpen()
  const a = rec.data
  const line = excerpt(a.description, 180)
  return (
    <button className={`artifact-row ty-artifact${isPastArtifact(a.status) ? ' is-past' : ''}`} onClick={() => open.artifact(a.id)} title={a.id}>
      <Thumb rec={rec} />
      <span className="artifact-row-text">
        <span className="artifact-row-title">
          <Highlight text={a.title} query={query} />
        </span>
        {line && (
          <span className="artifact-row-desc">
            <Highlight text={line} query={query} />
          </span>
        )}
      </span>
      {/* Right-aligned: what is only sometimes there (status, counts) to the left, the kind and date always in the same place at the edge. */}
      <span className="artifact-row-meta">
        {a.status !== BASELINE_ARTIFACT_STATUS && <StatusLabel kind="artifact" status={a.status} />}
        <Counts rec={rec} ix={ix} />
        <span className="artifact-row-kind">
          <ArtifactIcon kind={a.kind} size={13} />
          {ARTIFACT_KIND_LABEL[a.kind]}
        </span>
        <time className="artifact-date artifact-row-date" dateTime={a.date ?? undefined}>
          {artifactDate(a.date)}
        </time>
      </span>
    </button>
  )
}

/** How many cards link here, how many highlights it has and how many steps, each only when there are some. */
function Counts({ rec, ix }: { rec: ArtifactRec; ix: ArtifactIndex }) {
  const n = linkCount(ix, rec.data.id)
  const spots = rec.data.regions.length
  const steps = rec.data.steps?.length ?? 0
  return (
    <>
      {n > 0 && (
        <span className="badge" title={`Linked from ${n} card${n === 1 ? '' : 's'}`}>
          <Link2 size={11} /> {n}
        </span>
      )}
      {spots > 0 && (
        <span className="badge" title={`${spots} highlight${spots === 1 ? '' : 's'}`}>
          <Crosshair size={11} /> {spots}
        </span>
      )}
      {steps > 0 && (
        <span className="badge" title={`${steps} step${steps === 1 ? '' : 's'}`}>
          <ListOrdered size={11} /> {steps}
        </span>
      )}
    </>
  )
}

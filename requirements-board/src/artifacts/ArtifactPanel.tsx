/**
 * The artifact page's side panel: the artifact's name and kind, then four tabs. Highlights lists
 * the spots cards can link to (the named red-box regions, then a document's own pages or
 * sections); Linked lists the cards that point here; Details holds the rest of its facts; History
 * its changes. Edit details changes the facts about the artifact (name, kind, status, date, author,
 * area, sources, description) and nothing else: agents write the file, its highlights and links.
 */
import { ChevronLeft, Link2, Pencil } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isArtifactDate } from '../../shared/check.ts'
import { tidyText } from '../../shared/files.ts'
import { ARTIFACT_KINDS, ARTIFACT_STATUSES, COMPONENTS, type Artifact, type ArtifactKind, type ArtifactRec, type ArtifactStatus, type Item } from '../../shared/types.ts'
import { autoSpots, linkCount, namedSpots, spotName, useArtifactIndex, type ArtifactLink, type Spot } from '../artifactIndex.ts'
import { ArtifactRowsSection } from '../components/ArtifactRows.tsx'
import { ArtifactIcon, Glyph, ItemName, StatusLabel } from '../components/bits.tsx'
import { EditActions, EditBanners, discardConfirm } from '../components/EditChrome.tsx'
import { MarkdownTextarea } from '../components/MarkdownTextarea.tsx'
import { Prose } from '../components/Prose.tsx'
import { useEditableRecord } from '../components/useEditableRecord.ts'
import { artifactUrl, useOpen } from '../nav.ts'
import { sourceRow, useSourceIndex } from '../sourceRows.ts'
import { useCatalogue, useView } from '../store.ts'
import { ARTIFACT_KIND_LABEL, ARTIFACT_STATUS_HELP, BASELINE_ARTIFACT_STATUS, artifactDate, statusClass } from '../vocab.ts'
import { ArtifactHistory } from './ArtifactHistory.tsx'

export type PanelTab = 'spots' | 'linked' | 'details' | 'history'

interface Props {
  rec: ArtifactRec
  spot: string | null
  onSpot: (id: string | null) => void
  onPreview: (id: string | null) => void
}

/** As a file read would leave it: trimmed, blank sources dropped, no replacement unless Superseded. */
const normalise = (a: Artifact): Artifact => ({
  ...a,
  title: a.title.trim(),
  author: a.author.trim(),
  date: a.date?.trim() || null,
  sources: a.sources.map((s) => s.trim()).filter(Boolean),
  description: tidyText(a.description),
  supersededBy: a.status === 'Superseded' ? a.supersededBy : null,
})

export function ArtifactPanel({ rec, spot, onSpot, onPreview }: Props) {
  const saveArtifact = useCatalogue((s) => s.saveArtifact)
  const adoptArtifact = useCatalogue((s) => s.adoptArtifact)
  const ed = useEditableRecord<Artifact>({ key: `artifact:${rec.data.id}`, rec, save: saveArtifact, adopt: (r) => adoptArtifact(r as ArtifactRec), normalise })
  const a = rec.data
  const ix = useArtifactIndex()
  const navigate = useNavigate()
  const named = namedSpots(rec)
  const auto = autoSpots(rec)
  const links = ix.links.get(a.id) ?? []
  const asked = ix.questions.get(a.id) ?? []
  const [tab, setTab] = useState<PanelTab>(named.length || auto.length ? 'spots' : 'details')
  useEffect(() => setTab(named.length || auto.length ? 'spots' : 'details'), [a.id])
  const superseder = a.supersededBy ? ix.byId.get(a.supersededBy) : undefined
  const open = useOpen()
  const confirm = discardConfirm(ed, a.title)

  // The panel is no sheet, so it listens itself: Cmd S saves, Esc cancels the edit or answers the veil.
  const keys = useRef({ ed, confirm })
  keys.current = { ed, confirm }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { ed, confirm } = keys.current
      if (document.querySelector('.scrim')) return // a sheet open over the page keeps its own keys
      if (confirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          confirm.onCancel()
        }
        return
      }
      if (ed.editing) ed.onKey(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tabs: [PanelTab, string, number | null][] = [
    ['spots', 'Highlights', named.length || null],
    ['linked', 'Linked', linkCount(ix, a.id) + asked.length || null],
    ['details', 'Details', null],
    ['history', 'History', null],
  ]

  return (
    <div className="artifact-panel">
      <header className="artifact-panel-head">
        <button className="crumb" onClick={() => ed.leave(() => navigate('/artifacts'))}>
          <ChevronLeft size={14} /> <span>Artifacts</span>
        </button>
        <h2>{a.title}</h2>
        <div className="artifact-panel-meta ty-artifact">
          <ArtifactIcon kind={a.kind} />
          <span>{ARTIFACT_KIND_LABEL[a.kind] ?? a.kind}</span>
          {a.date && (
            <time className="artifact-date" dateTime={a.date}>
              {artifactDate(a.date)}
            </time>
          )}
          {a.status !== BASELINE_ARTIFACT_STATUS && <StatusLabel status={a.status} />}
          {superseder && (
            <button className="superseded-by" onClick={() => ed.leave(() => open.artifact(superseder.data.id))}>
              by {superseder.data.title}
            </button>
          )}
        </div>
        {ed.editing ? (
          <div className="panel-tabs" aria-hidden>
            <span className="tab is-static">Edit details</span>
          </div>
        ) : (
          <div className="panel-tabs" role="tablist" aria-label="Artifact">
            {tabs.map(([t, label, n]) => (
              <button key={t} role="tab" className="tab" aria-selected={tab === t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
                {label}
                {n !== null && <span className="count">{n}</span>}
              </button>
            ))}
          </div>
        )}
      </header>
      <EditBanners ed={ed} noun="artifact" />
      {ed.editing && ed.draft ? (
        <div className="artifact-panel-body">
          <DetailsForm draft={ed.draft} set={(patch) => ed.setDraft((d) => (d ? { ...d, ...patch } : d))} others={ix.list.filter((r) => r.data.id !== a.id)} />
        </div>
      ) : (
        <div className="artifact-panel-body" role="tabpanel">
          {tab === 'spots' && <Spots rec={rec} named={named} auto={auto} spot={spot} links={links} onSpot={onSpot} onPreview={onPreview} />}
          {tab === 'linked' && <Linked rec={rec} links={links} asked={asked} onSpot={onSpot} />}
          {tab === 'details' && <Details rec={rec} />}
          {tab === 'history' && <ArtifactHistory rec={rec} />}
        </div>
      )}
      <footer className="sheet-foot artifact-panel-foot">
        {ed.editing ? (
          <EditActions ed={ed} />
        ) : (
          <>
            <span className="spacer" />
            <button className="btn" onClick={() => ed.startEdit()} title="Change its name, kind, status, date, author, area, sources or description">
              <Pencil size={15} /> Edit details
            </button>
          </>
        )}
      </footer>
      {confirm && <PanelVeil confirm={confirm} />}
    </div>
  )
}

/** The panel's "Discard your changes?", over its own content, as a sheet asks. */
function PanelVeil({ confirm }: { confirm: NonNullable<ReturnType<typeof discardConfirm>> }) {
  const keep = useRef<HTMLButtonElement>(null)
  useEffect(() => keep.current?.focus({ preventScroll: true }), [])
  return (
    <div className="sheet-veil" role="alertdialog" aria-label={confirm.title}>
      <div className="veil-ask">
        <h3>{confirm.title}</h3>
        <p>{confirm.body}</p>
        <div className="veil-actions">
          <button ref={keep} className="btn primary" onClick={confirm.onCancel}>
            {confirm.cancelLabel}
          </button>
          <button className="btn danger" onClick={confirm.onConfirm}>
            {confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The artifact's details, editable: its name, kind, status (and what replaced it), date, author,
 * area, sources and description. The file, its highlights and its ID are not here: agents write those.
 */
function DetailsForm({ draft, set, others }: { draft: Artifact; set: (p: Partial<Artifact>) => void; others: ArtifactRec[] }) {
  const date = draft.date?.trim() ?? ''
  const dateOk = !date || isArtifactDate(date)
  const authors = useCatalogue((s) => [...new Set(Object.values(s.artifacts).map((r) => r.data.author).filter(Boolean))].sort().join('\n'))
  return (
    <>
      <label className="field">
        <span>Name</span>
        <input className="input title-input" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Kind</span>
          <select className="select" value={draft.kind} onChange={(e) => set({ kind: e.target.value as ArtifactKind })}>
            {ARTIFACT_KINDS.map((k) => (
              <option key={k} value={k}>
                {ARTIFACT_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select className="select" value={draft.status} title={ARTIFACT_STATUS_HELP[draft.status]} onChange={(e) => set({ status: e.target.value as ArtifactStatus })}>
            {ARTIFACT_STATUSES.map((s) => (
              <option key={s} value={s} title={ARTIFACT_STATUS_HELP[s]}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      {draft.status === 'Superseded' && (
        <label className="field">
          <span>Replaced by</span>
          <select className="select" value={draft.supersededBy ?? ''} onChange={(e) => set({ supersededBy: e.target.value || null })}>
            <option value="">Not said</option>
            {others.map((r) => (
              <option key={r.data.id} value={r.data.id}>
                {r.data.title}
              </option>
            ))}
          </select>
          <span className="field-note">Cards that link here keep their links; an agent moves them to the replacement.</span>
        </label>
      )}
      <div className="field-grid">
        <label className="field">
          <span>Date{date && dateOk ? ` · ${artifactDate(date)}` : ''}</span>
          <input className="input mono" value={draft.date ?? ''} placeholder="2026-10-01, 2026-10 or 2026" aria-invalid={!dateOk || undefined} onChange={(e) => set({ date: e.target.value })} />
          <span className={`field-note${dateOk ? '' : ' bad'}`}>{dateOk ? 'When it was made: the meeting, the publication, the drawing' : 'Write it as YYYY-MM-DD, YYYY-MM or YYYY'}</span>
        </label>
        <label className="field">
          <span>Author</span>
          <input className="input" list="artifact-authors" value={draft.author} onChange={(e) => set({ author: e.target.value })} />
          <datalist id="artifact-authors">
            {authors.split('\n').filter(Boolean).map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="field">
        <span>Area</span>
        <div className="chip-row">
          {COMPONENTS.map((c) => {
            const on = draft.components.includes(c)
            return (
              <button key={c} type="button" className="chip toggle" aria-pressed={on} onClick={() => set({ components: on ? draft.components.filter((x) => x !== c) : [...draft.components, c] })}>
                <Glyph component={c} /> {c}
              </button>
            )
          })}
        </div>
      </div>
      <label className="field">
        <span>Sources · one per line</span>
        <textarea className="textarea" rows={3} value={draft.sources.join('\n')} onChange={(e) => set({ sources: e.target.value.split('\n') })} />
      </label>
      <label className="field">
        <span>Description · Markdown</span>
        <MarkdownTextarea className="textarea" rows={5} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <p className="field-note">The file, its highlights and its ID are written by agents, so they are not edited here.</p>
    </>
  )
}

function Spots({ rec, named, auto, spot, links, onSpot, onPreview }: { rec: ArtifactRec; named: Spot[]; auto: Spot[]; spot: string | null; links: ArtifactLink[]; onSpot: (id: string | null) => void; onPreview: (id: string | null) => void }) {
  const [showAll, setShowAll] = useState(false)
  const usedBy = (id: string) => new Set(links.filter((l) => l.region === id).map((l) => l.item.id)).size
  const autoLabel = rec.meta.pages ? 'Pages' : 'Sections'
  // A long document lists its sections folded, but the open one always shows.
  const shownAuto = showAll || auto.length <= 12 ? auto : auto.filter((s, i) => i < 8 || s.id === spot)
  if (!named.length && !auto.length) {
    return <p className="empty-note">No highlights yet. An agent adds them to the artifact's file as regions, each a red box cards can link to.</p>
  }
  return (
    <>
      {named.length > 0 && (
        <section className="section">
          <div className="spot-list" role="list">
            {named.map((s) => (
              <SpotRow key={s.id} rec={rec} s={s} active={spot === s.id} used={usedBy(s.id)} onSpot={onSpot} onPreview={onPreview}>
                {s.region?.note && <span className="spot-note">{s.region.note}</span>}
              </SpotRow>
            ))}
          </div>
        </section>
      )}
      {auto.length > 0 && (
        <section className="section">
          <h3 className="section-head">
            {autoLabel} <span className="count">{auto.length}</span>
          </h3>
          <div className="spot-list auto" role="list">
            {shownAuto.map((s) => (
              <SpotRow key={s.id} rec={rec} s={s} active={spot === s.id} used={usedBy(s.id)} onSpot={onSpot} onPreview={() => onPreview(null)} />
            ))}
          </div>
          {shownAuto.length < auto.length && (
            <button className="btn ghost sm show-all" onClick={() => setShowAll(true)}>
              Show all {auto.length} {autoLabel.toLowerCase()}
            </button>
          )}
        </section>
      )}
    </>
  )
}

function SpotRow({ rec, s, active, used, onSpot, onPreview, children }: { rec: ArtifactRec; s: Spot; active: boolean; used: number; onSpot: (id: string | null) => void; onPreview: (id: string | null) => void; children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const copy = () => void navigator.clipboard?.writeText(artifactUrl(rec.data.id, s.id)).then(() => setCopied(true), () => {})
  return (
    <div className={`spot-row${active ? ' is-active' : ''}${s.auto ? ' auto' : ''}`} role="listitem" style={s.depth ? { paddingLeft: 10 + (s.depth - 1) * 12 } : undefined}>
      <button className="spot-go" onClick={() => onSpot(s.id)} onPointerEnter={() => onPreview(s.id)} onPointerLeave={() => onPreview(null)} aria-current={active || undefined} title={`${rec.data.id}#${s.id}`}>
        {!s.auto && <span className="spot-mark" aria-hidden />}
        <span className="spot-text">
          <span className="spot-name">{s.name}</span>
          {children}
        </span>
        {used > 0 && (
          <span className="badge" title={`Linked from ${used} card${used === 1 ? '' : 's'}`}>
            <Link2 size={11} /> {used}
          </span>
        )}
      </button>
      <button className="spot-copy copy-link" onClick={copy} title="Copy a link to this spot, to paste over text in a description or note" aria-label={`Copy a link to ${s.name}`}>
        {copied ? <span className="copied">Copied</span> : <Link2 size={13} />}
      </button>
    </div>
  )
}

function Linked({ rec, links, asked, onSpot }: { rec: ArtifactRec; links: ArtifactLink[]; asked: { question: { id: string; title: string; status: string }; region: string | null }[]; onSpot: (id: string | null) => void }) {
  const open = useOpen()
  const showRetired = useView((s) => s.showRetired)
  const shown = links.filter((l) => showRetired || l.item.status !== 'Retired')
  const listed = shown.filter((l) => l.via === 'field')
  const mentioned = shown.filter((l) => l.via === 'text' && !listed.some((x) => x.item.id === l.item.id && x.region === l.region))
  if (!shown.length && !asked.length) return <p className="empty-note">No card links here yet. Link one from its file: <code>artifacts: [{rec.data.id}]</code>, or to a spot, <code>{rec.data.id}#spot</code>.</p>
  const row = (l: ArtifactLink) => (
    <div key={`${l.item.id}|${l.region}`} className={`link-row linked-row ${statusClass(l.item.status)}`}>
      <button className="linked-item" onClick={() => open.item(l.item.id)} title={l.item.id}>
        <span style={l.item.status === 'Retired' ? { color: 'var(--ink-3)', textDecoration: 'line-through' } : undefined}>
          <ItemName item={l.item as Item} />
        </span>
      </button>
      {l.region ? (
        <button className="chip spot-chip" onClick={() => onSpot(l.region)} title="Show this spot">
          <span className="spot-mark" aria-hidden />
          <span className="spot-chip-name">{spotName(rec, l.region) ?? l.region}</span>
        </button>
      ) : (
        <span />
      )}
      <StatusLabel status={l.item.status} />
    </div>
  )
  return (
    <>
      {listed.length > 0 && (
        <section className="section">
          <div className="link-list">{listed.map(row)}</div>
        </section>
      )}
      {mentioned.length > 0 && (
        <section className="section">
          <h4 className="related-sub">Mentioned in</h4>
          <div className="link-list">{mentioned.map(row)}</div>
        </section>
      )}
      {asked.length > 0 && (
        <section className="section">
          <h4 className="related-sub">Outstanding items</h4>
          <div className="link-list">
            {asked.map(({ question: q, region }) => (
              <div key={`${q.id}|${region}`} className={`link-row linked-row ${statusClass(q.status)}`}>
                <button className="linked-item" onClick={() => open.question(q.id)} title={q.id}>
                  {q.title}
                </button>
                {region ? (
                  <button className="chip spot-chip" onClick={() => onSpot(region)}>
                    <span className="spot-mark" aria-hidden />
                    <span className="spot-chip-name">{spotName(rec, region) ?? region}</span>
                  </button>
                ) : (
                  <span />
                )}
                <StatusLabel status={q.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function Details({ rec }: { rec: ArtifactRec }) {
  const a = rec.data
  const m = rec.meta
  const index = useSourceIndex()
  const sources = useMemo(() => a.sources.map((s) => sourceRow(index, s, a.id)), [a.sources, a.id, index])
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const size = [
    m.bounds && m.format !== 'pdf' ? `${Math.round(m.bounds.w)} × ${Math.round(m.bounds.h)}` : null,
    m.pages ? `${m.pages.length} page${m.pages.length === 1 ? '' : 's'}` : null,
    m.lines ? `${m.lines} lines` : null,
    m.bytes ? kb(m.bytes) : null,
  ].filter(Boolean)
  return (
    <>
      {a.description ? <Prose text={a.description} /> : <p className="prose small">No description yet.</p>}
      <ArtifactRowsSection title="Sources" rows={sources} className="sources-section" />
      <section className="section sheet-tail">
        <div className="facts">
          {a.date && (
            <div>
              <h3 className="section-head">Date</h3>
              <time dateTime={a.date}>{artifactDate(a.date)}</time>
            </div>
          )}
          {a.author && (
            <div>
              <h3 className="section-head">Author</h3>
              <span>{a.author}</span>
            </div>
          )}
          {a.components.length > 0 && (
            <div>
              <h3 className="section-head">Area</h3>
              <div className="sources">
                {a.components.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {a.citedAs.length > 0 && (
            <div>
              <h3 className="section-head">Cited as</h3>
              <div className="sources" title="Sources that start with these words open this artifact">
                {a.citedAs.map((c) => (
                  <span key={c.as} className="chip">
                    {c.as}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="section-head">File</h3>
            <p className="file-fact">
              <span className="mono">{m.path ?? (m.format === 'mermaid' ? 'Mermaid source in the artifact file' : (a.file ?? 'none'))}</span>
              {size.length > 0 && <span className="quiet">{size.join(', ')}</span>}
            </p>
          </div>
        </div>
        <button type="button" className="copy-link item-id ty-artifact" onClick={() => void navigator.clipboard?.writeText(artifactUrl(a.id)).then(() => setCopied(true), () => {})} title="Copy a link to this artifact, to paste over text in a description or note">
          {copied ? 'Link copied' : (
            <>
              <ArtifactIcon kind={a.kind} size={12} /> {a.id}
            </>
          )}
        </button>
      </section>
    </>
  )
}

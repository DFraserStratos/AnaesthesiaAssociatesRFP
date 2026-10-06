/**
 * An artifact's history, on the same time column as a card's: its sidecar's changes (name,
 * status, highlights, description, a mermaid source) from git, and its file's, each new version
 * a "File updated" disclosure over a before and after.
 */
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { lineCounts, lineDiff, regionChanges, TEXT_FIELDS, type ContentVersion, type FieldChange, type TimelineEntry } from '../../shared/history.ts'
import type { ArtifactRec, Region } from '../../shared/types.ts'
import { api } from '../api.ts'
import { StatusLabel } from '../components/bits.tsx'
import { Counts, Diff, HistoryTimeline, setDiff, TEXT_LABEL } from '../components/HistoryView.tsx'
import { useCatalogue } from '../store.ts'
import { ARTIFACT_KIND_LABEL, artifactDate } from '../vocab.ts'
import { VisualCompare } from './VisualCompare.tsx'

export function ArtifactHistory({ rec }: { rec: ArtifactRec }) {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const id = rec.data.id
  useEffect(() => {
    let live = true
    api
      .artifactHistory(id)
      .then((r) => live && (setEntries(r.entries), setError(null)))
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [id, rec.rev, rec.meta.fileRev])

  const changes = entries?.filter((e) => e.type === 'change').length ?? 0
  return (
    <div className="history artifact-history">
      <h3 className="section-head">History {entries && <span className="count">{changes}</span>}</h3>
      {error ? (
        <p className="hist-note bad">History could not be read: {error}</p>
      ) : !entries ? (
        <p className="hist-note">Reading history</p>
      ) : !entries.length ? (
        <p className="hist-note">Nothing in git yet. Once the artifact is committed, every change to it and to its file shows here.</p>
      ) : (
        <HistoryTimeline entries={entries}>
          {(e) => (
            <ul className="hist-changes">
              {e.changes.map((c, i) => (
                <li key={`${c.field}${i}`}>
                  <ArtifactChangeRow change={c} rec={rec} />
                </li>
              ))}
            </ul>
          )}
        </HistoryTimeline>
      )}
    </div>
  )
}

function ArtifactChangeRow({ change: c, rec }: { change: FieldChange; rec: ArtifactRec }) {
  const [open, setOpen] = useState(false)
  const artifacts = useCatalogue((s) => s.artifacts)
  if (c.field === 'content') return <ContentRow change={c} rec={rec} />
  if (TEXT_FIELDS.has(c.field)) {
    const diff = lineDiff(String(c.from ?? ''), String(c.to ?? ''))
    const n = lineCounts(diff)
    return (
      <>
        <button type="button" className="hist-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{TEXT_LABEL[c.field] ?? c.field}</span>
          <Counts add={n.add} del={n.del} unit="line" />
        </button>
        {open && <Diff lines={diff} />}
        {open && c.field === 'source' && rec.meta.format === 'mermaid' && <VisualCompare rec={rec} from={{ source: String(c.from ?? '') }} to={{ source: String(c.to ?? '') }} />}
      </>
    )
  }
  switch (c.field) {
    case 'title':
      return (
        <p className="hist-row">
          <span className="hist-field">Name</span> <del>{String(c.from)}</del> to <ins>{String(c.to)}</ins>
        </p>
      )
    case 'status':
      return (
        <p className="hist-row">
          <span className="hist-field">Status</span> <StatusLabel status={String(c.from)} /> to <StatusLabel status={String(c.to)} />
        </p>
      )
    case 'kind':
      return (
        <p className="hist-row">
          <span className="hist-field">Kind</span> {ARTIFACT_KIND_LABEL[c.from as keyof typeof ARTIFACT_KIND_LABEL] ?? String(c.from)} to {ARTIFACT_KIND_LABEL[c.to as keyof typeof ARTIFACT_KIND_LABEL] ?? String(c.to)}
        </p>
      )
    case 'date':
      return (
        <p className="hist-row">
          <span className="hist-field">Date</span> {c.from ? <del>{artifactDate(c.from as string)}</del> : null} {c.from && c.to ? 'to' : null} {c.to ? <ins>{artifactDate(c.to as string)}</ins> : 'removed'}
        </p>
      )
    case 'supersededBy': {
      const by = c.to ? artifacts[String(c.to)]?.data.title ?? String(c.to) : null
      return <p className="hist-row">{by ? <>Superseded by <strong>{by}</strong></> : 'No longer marked as superseded'}</p>
    }
    case 'author':
      return (
        <p className="hist-row">
          <span className="hist-field">Author</span> {c.from ? <del>{String(c.from)}</del> : null} {c.from && c.to ? 'to' : null} {c.to ? <ins>{String(c.to)}</ins> : 'removed'}
        </p>
      )
    case 'file':
      return (
        <p className="hist-row">
          <span className="hist-field">File</span> <span className="mono">{String(c.from ?? 'none')}</span> to <span className="mono">{String(c.to ?? 'none')}</span>
        </p>
      )
    case 'components':
    case 'sources': {
      const { added, removed } = setDiff(c.from as string[], c.to as string[])
      return (
        <div className="hist-row">
          <span className="hist-field">{c.field === 'components' ? 'Area' : 'Sources'}</span>
          <ul className="hist-lines">
            {added.map((s) => (
              <li key={`+${s}`} className="add">
                {s}
              </li>
            ))}
            {removed.map((s) => (
              <li key={`-${s}`} className="del">
                {s}
              </li>
            ))}
            {!added.length && !removed.length && <li className="quiet">Reordered</li>}
          </ul>
        </div>
      )
    }
    case 'regions': {
      const { added, removed, changed } = regionChanges(c.from as Region[], c.to as Region[])
      return (
        <div className="hist-row">
          <span className="hist-field">Highlights</span>
          <ul className="hist-lines">
            {added.map((r) => (
              <li key={`+${r.id}`} className="add">
                {r.name || r.id}
              </li>
            ))}
            {removed.map((r) => (
              <li key={`-${r.id}`} className="del">
                {r.name || r.id}
              </li>
            ))}
            {changed.map((r) => (
              <li key={`~${r.id}`}>
                {r.name || r.id} <span className="quiet">{r.what.join(', ')}</span>
              </li>
            ))}
            {!added.length && !removed.length && !changed.length && <li className="quiet">Reordered</li>}
          </ul>
        </div>
      )
    }
    default:
      return <p className="hist-row quiet">Other file details changed</p>
  }
}

/** The artifact's file changed: a disclosure over the two versions compared. */
function ContentRow({ change: c, rec }: { change: FieldChange; rec: ArtifactRec }) {
  const [open, setOpen] = useState(false)
  const from = c.from as ContentVersion | null
  const to = c.to as ContentVersion | null
  const label = !from ? 'File added' : !to ? 'File removed' : 'File updated'
  return (
    <>
      <button type="button" className="hist-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{label}</span>
        {rec.meta.path && <span className="quiet hist-shot-name">{rec.meta.path.split('/').pop()}</span>}
      </button>
      {open && <VisualCompare rec={rec} from={from ? { sha: from.sha } : null} to={to ? { sha: to.sha } : null} />}
    </>
  )
}

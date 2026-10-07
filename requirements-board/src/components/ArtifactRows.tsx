/**
 * The rows that open artifacts from a sheet: Diagrams and Sources on a card, Sources on a question
 * and on an artifact's Details. Each row names the artifact (kind mark, name, then the spot after a
 * middot) and opens it at that spot in the red box; the words the card cites it by are its tooltip.
 */
import { MessageCircleQuestion } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SourceSpot } from '../../shared/sources.ts'
import { guarded, useOpen } from '../nav.ts'
import type { SheetRow } from '../sourceRows.ts'
import { useCatalogue } from '../store.ts'
import { BASELINE_ARTIFACT_STATUS } from '../vocab.ts'
import { ArtifactName, StatusLabel } from './bits.tsx'

const tip = (row: { source: string | null }, spot?: SourceSpot) =>
  [row.source, spot?.detail && `${spot.label}: ${spot.detail}`, spot?.problem].filter(Boolean).join('\n') || undefined

function Row({ row }: { row: SheetRow }) {
  const open = useOpen()
  const artifacts = useCatalogue((s) => s.artifacts)
  const questions = useCatalogue((s) => s.questions)

  if (row.kind === 'plain') {
    return (
      <div className="link-row source-plain">
        <span>{row.source}</span>
        <span />
      </div>
    )
  }
  if (row.kind === 'missing') {
    return (
      <div className="link-row missing" title={row.reason}>
        <span>{row.text}</span>
        <span className="quiet">Not found</span>
      </div>
    )
  }
  if (row.kind === 'question') {
    const q = questions[row.id]?.data
    if (!q) {
      return (
        <div className="link-row missing" title={`${row.id} is not in the catalogue`}>
          <span className="mono">{row.id}</span>
          <span className="quiet">Not found</span>
        </div>
      )
    }
    return (
      <button className="link-row source-question" onClick={() => guarded(() => open.question(q.id))} title={q.id}>
        <span className="record-name">
          <MessageCircleQuestion size={14} className="record-link-icon" aria-hidden />
          {q.title}
        </span>
        <StatusLabel status={q.status} />
      </button>
    )
  }

  const rec = artifacts[row.id]
  if (!rec) return null
  const status: ReactNode = rec.data.status !== BASELINE_ARTIFACT_STATUS ? <StatusLabel status={rec.data.status} /> : <span />
  const go = (spot: SourceSpot) => guarded(() => open.artifact(row.id, spot.region))
  const [first] = row.spots
  if (row.spots.length <= 1) {
    const spot = first ?? { region: null, label: null, detail: null, problem: null }
    if (spot.problem) {
      return (
        <div className="link-row missing" title={tip(row, spot)}>
          <ArtifactName artifact={rec.data} spot={spot.label} />
          <span className="quiet">Not found</span>
        </div>
      )
    }
    return (
      <button className="link-row artifact-link-row" onClick={() => go(spot)} title={tip(row, spot) ?? `${row.id}${spot.region ? `#${spot.region}` : ''}`}>
        <ArtifactName artifact={rec.data} spot={spot.label} />
        {status}
      </button>
    )
  }
  // Several points cited at once: the name opens the first, each point opens itself.
  return (
    <div className="link-row artifact-link-row multi-spot">
      <span className="multi-spot-line">
        <button className="multi-spot-name" onClick={() => go(first!)} title={tip(row, first)}>
          <ArtifactName artifact={rec.data} />
        </button>
        {row.spots.map((s, i) =>
          s.problem ? (
            <span key={i} className="multi-spot-point missing" title={s.problem}>
              {s.label}
            </span>
          ) : (
            <button key={i} className="multi-spot-point" onClick={() => go(s)} title={tip(row, s)}>
              {s.label}
            </button>
          ),
        )}
      </span>
      {status}
    </div>
  )
}

/** A titled list of rows, or nothing when it is empty. */
export function ArtifactRowsSection({ title, rows, className = '' }: { title: string; rows: SheetRow[]; className?: string }) {
  if (!rows.length) return null
  return (
    <section className={`section artifacts-section ${className}`.trim()}>
      <h3 className="section-head">
        {title} <span className="count">{rows.length}</span>
      </h3>
      <div className="link-list">
        {rows.map((row, i) => (
          <Row key={i} row={row} />
        ))}
      </div>
    </section>
  )
}

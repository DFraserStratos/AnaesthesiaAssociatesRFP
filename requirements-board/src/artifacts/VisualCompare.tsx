/**
 * Two versions of an artifact, compared: side by side, or one swiped over the other, or (for a
 * file that is text) as a line diff. Versions come out of git by blob hash, or are drawn from a
 * mermaid source. Pictures only: shown as images, so nothing in an old SVG ever runs.
 */
import { useState } from 'react'
import { lineDiff } from '../../shared/history.ts'
import type { ArtifactRec } from '../../shared/types.ts'
import { artifactBlobUrl } from '../api.ts'
import { Diff } from '../components/HistoryView.tsx'
import { useLoaded } from './content.ts'
import { renderMermaid } from './mermaid.ts'
import { loadPdf } from './PdfReader.tsx'
import { fetchText } from './ArtifactViewer.tsx'

export type Version = { sha: string } | { source: string } | null
type Mode = 'side' | 'swipe' | 'source'

const MAX_SOURCE_LINES = 3000

/** A picture of one version: an image URL (a blob for a drawn mermaid diagram or a PDF page). */
async function pictureOf(rec: ArtifactRec, v: Exclude<Version, null>, page: number): Promise<string> {
  if ('source' in v) {
    const svg = await renderMermaid(`${rec.data.id}-history`, v.source)
    return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  }
  const url = artifactBlobUrl(rec.data.id, v.sha)
  if (rec.meta.format !== 'pdf') {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) throw new Error('not kept')
    return url
  }
  const { doc } = await loadPdf(url)
  const n = Math.min(page, doc.numPages)
  const p = await doc.getPage(n)
  const viewport = p.getViewport({ scale: 1.5 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await p.render({ canvas, viewport }).promise
  return canvas.toDataURL('image/png')
}

export function VisualCompare({ rec, from, to }: { rec: ArtifactRec; from: Version; to: Version }) {
  const format = rec.meta.format
  const textual = format === 'svg' || format === 'markdown'
  const pictured = format !== 'markdown'
  const [mode, setMode] = useState<Mode>(pictured ? 'side' : 'source')
  const [page, setPage] = useState(1)
  const modes: [Mode, string][] = [
    ...(pictured ? ([['side', 'Side by side'], ['swipe', 'Swipe']] as [Mode, string][]) : []),
    ...(textual ? ([['source', 'Source']] as [Mode, string][]) : []),
  ]
  return (
    <div className="compare">
      <div className="compare-bar">
        {modes.length > 1 && (
          <div className="mode-switch" role="radiogroup" aria-label="Compare">
            {modes.map(([m, label]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>
                {label}
              </button>
            ))}
          </div>
        )}
        {format === 'pdf' && mode !== 'source' && (
          <label className="compare-page">
            Page
            <input className="input sm" type="number" min={1} max={rec.meta.pages?.length ?? 999} value={page} onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))} />
          </label>
        )}
      </div>
      {mode === 'source' ? <SourceDiff rec={rec} from={from} to={to} /> : <Pictures rec={rec} from={from} to={to} page={page} swipe={mode === 'swipe'} />}
    </div>
  )
}

const versionKey = (v: Version) => (!v ? 'none' : 'sha' in v ? v.sha : `src:${v.source.length}:${v.source.slice(0, 64)}`)

function Pictures({ rec, from, to, page, swipe }: { rec: ArtifactRec; from: Version; to: Version; page: number; swipe: boolean }) {
  const before = useLoaded(`${versionKey(from)}|${page}`, () => (from ? pictureOf(rec, from, page) : Promise.reject(new Error('none'))))
  const after = useLoaded(`${versionKey(to)}|${page}`, () => (to ? pictureOf(rec, to, page) : Promise.reject(new Error('none'))))
  const [at, setAt] = useState(50)
  const pic = (l: typeof before, v: Version, label: string) =>
    l.status === 'ready' ? (
      <img src={l.value} alt={`${label}: ${rec.data.title}`} draggable={false} />
    ) : (
      <div className="hist-shot-gone">{l.status === 'loading' ? 'Loading' : !v ? (label === 'Before' ? 'Not there yet' : 'Removed') : 'Not kept: this version was never committed'}</div>
    )
  if (swipe && before.status === 'ready' && after.status === 'ready') {
    return (
      <div className="swipe">
        <div className="swipe-stage">
          <img src={before.value} alt={`Before: ${rec.data.title}`} draggable={false} />
          <img className="swipe-after" src={after.value} alt={`After: ${rec.data.title}`} draggable={false} style={{ clipPath: `inset(0 0 0 ${at}%)` }} />
          <span className="swipe-handle" style={{ left: `${at}%` }} aria-hidden />
          <input className="swipe-range" type="range" min={0} max={100} value={at} onChange={(e) => setAt(Number(e.target.value))} aria-label="Swipe between before and after" />
        </div>
        <div className="swipe-labels">
          <span>Before</span>
          <span>After</span>
        </div>
      </div>
    )
  }
  return (
    <div className="hist-shot-pair compare-pair">
      <figure className="hist-shot">
        {pic(before, from, 'Before')}
        <figcaption>Before</figcaption>
      </figure>
      <figure className="hist-shot">
        {pic(after, to, 'After')}
        <figcaption>After</figcaption>
      </figure>
    </div>
  )
}

function SourceDiff({ rec, from, to }: { rec: ArtifactRec; from: Version; to: Version }) {
  const text = (v: Version) => (!v ? Promise.resolve('') : 'source' in v ? Promise.resolve(v.source) : fetchText(artifactBlobUrl(rec.data.id, v.sha)))
  const loaded = useLoaded(`${versionKey(from)}>${versionKey(to)}`, () => Promise.all([text(from), text(to)]))
  if (loaded.status === 'loading') return <p className="hist-note">Reading both versions</p>
  if (loaded.status === 'error') return <p className="hist-note bad">A version could not be read: {loaded.error}</p>
  return <Diff lines={lineDiff(loaded.value[0], loaded.value[1], MAX_SOURCE_LINES)} />
}

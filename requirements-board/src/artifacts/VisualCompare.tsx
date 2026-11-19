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
import { dropUrl, ownUrl } from './objectUrls.ts'
import { withPdf } from './pdfDocs.ts'
import { askServer, decodes, failureLabel, NOT_AN_IMAGE, pdfFailure, type PictureFailure } from './pictureFailure.ts'
import { fetchText } from './ArtifactViewer.tsx'

export type Version = { sha: string } | { source: string } | null
type Mode = 'side' | 'swipe' | 'source'

const MAX_SOURCE_LINES = 3000

/** A picture of one version, or why there is none (`pictureFailure.ts`). */
type Picture = { url: string } | { failed: PictureFailure }

/**
 * A picture of one version: an image URL (an object URL for a drawn mermaid diagram, a data URL for a
 * PDF page, the blob's own URL otherwise), or the truthful reason it cannot be shown. Never throws.
 */
async function pictureOf(rec: ArtifactRec, v: Version, page: number): Promise<Picture> {
  if (!v || ('source' in v && !v.source.trim())) return { failed: { kind: 'none' } }
  if ('source' in v) {
    try {
      const svg = await renderMermaid(`${rec.data.id}-history`, v.source)
      return { url: ownUrl(new Blob([svg], { type: 'image/svg+xml' })) }
    } catch (e) {
      return { failed: { kind: 'drawn', why: (e as Error).message } }
    }
  }
  const url = artifactBlobUrl(rec.data.id, v.sha)
  if (rec.meta.format !== 'pdf') {
    const failed = await askServer(url)
    if (failed) return { failed }
    return (await decodes(url)) ? { url } : { failed: { kind: 'drawn', why: NOT_AN_IMAGE } }
  }
  try {
    // The document is held only while the page draws; the next page finds it still open (`pdfDocs.ts`).
    return {
      url: await withPdf(url, async ({ doc }) => {
        const p = await doc.getPage(Math.min(page, doc.numPages))
        const viewport = p.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        await p.render({ canvas, viewport }).promise
        return canvas.toDataURL('image/png')
      }),
    }
  } catch (e) {
    return { failed: pdfFailure(e) }
  }
}

/** A picture no longer shown gives back its object URL (a mermaid drawing's; others are left alone). */
const dropPicture = (p: Picture) => 'url' in p && dropUrl(p.url)

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

// The whole source, so two sources that differ only past their start never share a picture.
const versionKey = (v: Version) => (!v ? 'none' : 'sha' in v ? v.sha : `src:${v.source}`)

function Pictures({ rec, from, to, page, swipe }: { rec: ArtifactRec; from: Version; to: Version; page: number; swipe: boolean }) {
  // The page matters only to a PDF; a drawing is not drawn again when it changes.
  const pageKey = rec.meta.format === 'pdf' ? `|${page}` : ''
  const before = useLoaded(`${versionKey(from)}${pageKey}`, () => pictureOf(rec, from, page), dropPicture)
  const after = useLoaded(`${versionKey(to)}${pageKey}`, () => pictureOf(rec, to, page), dropPicture)
  const [at, setAt] = useState(50)
  const urlOf = (l: typeof before) => (l.status === 'ready' && 'url' in l.value ? l.value.url : null)
  const pic = (l: typeof before, label: 'Before' | 'After') => {
    const url = urlOf(l)
    if (url) return <img src={url} alt={`${label}: ${rec.data.title}`} draggable={false} />
    const text = l.status === 'ready' && 'failed' in l.value ? failureLabel(l.value.failed, label) : l.status === 'error' ? `Could not be read: ${l.error}` : 'Loading'
    return <div className="hist-shot-gone">{text}</div>
  }
  const [beforeUrl, afterUrl] = [urlOf(before), urlOf(after)]
  if (swipe && beforeUrl && afterUrl) {
    return (
      <div className="swipe">
        <div className="swipe-stage">
          <img src={beforeUrl} alt={`Before: ${rec.data.title}`} draggable={false} />
          <img className="swipe-after" src={afterUrl} alt={`After: ${rec.data.title}`} draggable={false} style={{ clipPath: `inset(0 0 0 ${at}%)` }} />
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
        {pic(before, 'Before')}
        <figcaption>Before</figcaption>
      </figure>
      <figure className="hist-shot">
        {pic(after, 'After')}
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

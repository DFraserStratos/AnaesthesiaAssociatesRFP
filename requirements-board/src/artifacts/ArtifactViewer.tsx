/**
 * Any artifact, shown the way its format reads best: a drawing on a canvas that pans and zooms, a
 * document as pages that scroll. Given a spot (a named region, a page, a heading, a line range),
 * it brings that into view inside the red box, and says so when the spot can't be found.
 */
import { AlertTriangle, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useDeferredValue, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { isCanvasFormat, type ArtifactRec, type Region } from '../../shared/types.ts'
import { artifactFileUrl } from '../api.ts'
import { spotName } from '../artifactIndex.ts'
import { ARTIFACT_KIND_LABEL } from '../vocab.ts'
import { CanvasViewer, type FindProps } from './CanvasViewer.tsx'
import { loadCanvas, useLoaded } from './content.ts'
import { MarkdownReader } from './MarkdownReader.tsx'
import { PdfReader } from './PdfReader.tsx'

export interface ArtifactViewerProps {
  rec: ArtifactRec
  /** A region ID, page (`p3`), heading slug or line range (`L12-20`); null for the whole artifact. */
  spot: string | null
  /** Changes when the same spot is asked for again, so the view goes back to it. */
  focusKey?: string
  /** A named region to outline while it is hovered in the panel. */
  preview?: string | null
}

export const fetchText = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status === 404 ? 'the file is missing' : `the file could not be read (${res.status})`)
  return res.text()
}

export function ArtifactViewer({ rec, spot, focusKey, preview = null }: ArtifactViewerProps) {
  const a = rec.data
  const format = rec.meta.format
  const url = artifactFileUrl(a.id, rec.meta.fileRev)
  const region: Region | null = spot ? (a.regions.find((r) => r.id === spot) ?? null) : null
  const auto = spot && !region ? spot : null
  const [found, setFound] = useState<boolean | null>(null)
  useEffect(() => setFound(null), [spot, rec.rev, rec.meta.fileRev])
  const unknownSpot = !!spot && !spotName(rec, spot)

  // Find in the artifact: the query (deferred, so typing stays quick in a long transcript), the
  // current match and how many there are. An image has no text, so it has no find.
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const [active, setActive] = useState(0)
  const [count, setCount] = useState(0)
  useEffect(() => setActive(0), [deferred])
  useEffect(() => setQuery(''), [a.id])
  const find: FindProps = { query: deferred, active, onCount: setCount }
  const searchable = !!format && format !== 'raster'

  let body
  if (!format) body = <div className="viewer-note bad">This artifact has no file the board can show.</div>
  else if (isCanvasFormat(format)) body = <CanvasBody rec={rec} url={url} region={region} focusKey={focusKey} preview={preview} onRegionFound={setFound} find={find} />
  else if (format === 'markdown') body = <MarkdownBody url={url} rec={rec} region={region} auto={auto} focusKey={focusKey} onRegionFound={setFound} find={find} />
  else body = <PdfReader url={url} spot={{ region, auto }} focusKey={focusKey} label={a.title} onRegionFound={setFound} find={find} />

  return (
    <div className="artifact-viewer">
      {body}
      {searchable && (
        <FindBar
          noun={(ARTIFACT_KIND_LABEL[a.kind] ?? 'artifact').toLowerCase()}
          query={query}
          setQuery={setQuery}
          count={deferred === query ? count : null}
          active={Math.min(active, Math.max(0, count - 1))}
          step={(d) => count && setActive((i) => (Math.min(i, count - 1) + d + count) % count)}
        />
      )}
      {(unknownSpot || found === false) && (
        <div className="viewer-flag" role="status">
          <AlertTriangle size={14} />
          {unknownSpot ? `${a.title} has no spot called "${spot}"` : `The highlight could not be found in the ${format === 'pdf' || format === 'markdown' ? 'document' : 'drawing'}`}
        </div>
      )}
    </div>
  )
}

/**
 * Find in this artifact, top right of it: matches tinted like the board's search, the current one
 * stronger and brought into view. The down and up arrows (or Enter and Shift Enter) step through
 * them; Ctrl F, Cmd F or / jumps to the box from anywhere on the page; Esc clears it and leaves.
 */
function FindBar({ noun, query, setQuery, count, active, step }: { noun: string; query: string; setQuery: (q: string) => void; count: number | null; active: number; step: (d: 1 | -1) => void }) {
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      const findKey = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f'
      if (!findKey && !(e.key === '/' && !typing && !e.metaKey && !e.ctrlKey)) return
      // A sheet open over the artifact keeps its own keys.
      if (document.querySelector('.scrim')) return
      e.preventDefault()
      input.current?.focus()
      input.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  // The arrow keys walk the matches as they walk the board's search results; Esc closes the search.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      step(e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey) ? -1 : 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      input.current?.blur()
    }
  }
  const has = !!query.trim()
  return (
    <div className="find-bar toolbar-group" role="search">
      <label className="search">
        <Search size={15} />
        <span className="sr-only">Find in this {noun}</span>
        <input ref={input} className="input" placeholder={`Find in this ${noun}`} title={`Find in this ${noun} (/ or Ctrl F)`} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} />
      </label>
      {has && (
        <>
          <span className="search-count" aria-live="polite">
            {count === null ? '' : count ? `${active + 1} of ${count}` : 'No matches'}
          </span>
          <button className="btn icon ghost sm" onClick={() => step(-1)} disabled={!count} aria-label="Previous match" title="Previous match (up arrow)">
            <ChevronUp size={14} />
          </button>
          <button className="btn icon ghost sm" onClick={() => step(1)} disabled={!count} aria-label="Next match" title="Next match (down arrow)">
            <ChevronDown size={14} />
          </button>
          <button className="btn icon ghost sm" onClick={() => setQuery('')} aria-label="Clear the search" title="Clear (Esc)">
            <X size={14} />
          </button>
        </>
      )}
    </div>
  )
}

function CanvasBody({ rec, url, region, focusKey, preview, onRegionFound, find }: { rec: ArtifactRec; url: string; region: Region | null; focusKey?: string; preview: string | null; onRegionFound: (f: boolean) => void; find: FindProps }) {
  const a = rec.data
  const format = rec.meta.format!
  const key = `${a.id}|${rec.meta.fileRev ?? ''}|${format === 'mermaid' ? a.source : ''}`
  const loaded = useLoaded(key, () => loadCanvas({ format, url, source: a.source, seed: a.id, bounds: rec.meta.bounds }))
  if (loaded.status === 'loading') return <div className="viewer-note">Drawing</div>
  if (loaded.status === 'error') return <div className="viewer-note bad">{format === 'mermaid' ? 'The diagram could not be drawn' : 'The file could not be shown'}: {loaded.error}</div>
  const previewRegion = preview ? (a.regions.find((r) => r.id === preview) ?? null) : null
  return <CanvasViewer content={loaded.value} region={region} focusKey={focusKey} preview={previewRegion} dragPans={format === 'raster'} label={a.title} onRegionFound={onRegionFound} find={find} />
}

function MarkdownBody({ url, rec, region, auto, focusKey, onRegionFound, find }: { url: string; rec: ArtifactRec; region: Region | null; auto: string | null; focusKey?: string; onRegionFound: (f: boolean) => void; find: FindProps }) {
  const loaded = useLoaded(url, () => fetchText(url))
  if (loaded.status === 'loading') return <div className="viewer-note">Opening the document</div>
  if (loaded.status === 'error') return <div className="viewer-note bad">The document could not be opened: {loaded.error}</div>
  return <MarkdownReader text={loaded.value} spot={{ region, auto }} focusKey={focusKey} label={rec.data.title} onRegionFound={onRegionFound} find={find} />
}

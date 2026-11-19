/**
 * Any artifact, shown the way its format reads best: a drawing on a canvas that pans and zooms, a
 * document as pages that scroll. Given a spot (a named region, a page, a heading, a line range),
 * it brings that into view inside the red box, and says so when the spot can't be found. A
 * stepped diagram also gets its step bar, and a step as the spot shows the drawing at that step
 * (no red box). The view stays where it is as the steps change, unless the sidecar asks it to
 * follow them (`step_view: follow`): then each step is framed when it is not already in view.
 */
import { AlertTriangle, ChevronDown, ChevronUp, Maximize2, Minimize2, Search, X } from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { isArtifactId, isQuestionId } from '../../shared/links.ts'
import { stepFocusAnchors, stepIndex, stepState } from '../../shared/steps.ts'
import { isCanvasFormat, type ArtifactRec, type Region } from '../../shared/types.ts'
import { artifactFileUrl } from '../api.ts'
import { spotName } from '../artifactIndex.ts'
import { guarded, useOpen } from '../nav.ts'
import { useCatalogue, useIndex } from '../store.ts'
import { ARTIFACT_KIND_LABEL } from '../vocab.ts'
import { CanvasViewer, type FindProps } from './CanvasViewer.tsx'
import { loadCanvas, releaseCanvas, useLoaded } from './content.ts'
import type { FullScreen } from './fullScreen.ts'
import { MarkdownReader } from './MarkdownReader.tsx'
import { PdfReader } from './PdfReader.tsx'
import { StepBar } from './StepBar.tsx'
import { beforeSteps, movesToPlay } from './stepMoves.ts'
import { catalogueResolver } from './svgLinks.ts'

export interface ArtifactViewerProps {
  rec: ArtifactRec
  /** A region ID, page (`p3`), heading slug or line range (`L12-20`); null for the whole artifact. */
  spot: string | null
  /** Changes when the same spot is asked for again, so the view goes back to it. */
  focusKey?: string
  /** A named region to outline while it is hovered in the panel. */
  preview?: string | null
  /** Go to another spot (a step from the step bar), or null for the whole artifact. */
  onSpot?: (id: string | null) => void
  /** Full screen, where the page offers it: a button at the end of the view bar, bottom right. */
  fullScreen?: FullScreen
}

export const fetchText = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status === 404 ? 'the file is missing' : `the file could not be read (${res.status})`)
  return res.text()
}

export function ArtifactViewer({ rec, spot, focusKey, preview = null, onSpot, fullScreen }: ArtifactViewerProps) {
  const a = rec.data
  const format = rec.meta.format
  const url = artifactFileUrl(a.id, rec.meta.fileRev)
  const region: Region | null = spot ? (a.regions.find((r) => r.id === spot) ?? null) : null
  const auto = spot && !region ? spot : null
  // Whether the viewer found the spot, kept with the request it answers (the spot, the file version and
  // the region as it reads now), so an answer about another request is never shown and nothing has to
  // wipe it: a viewer reports in its layout effect, before any reset of the parent's could run (R-98).
  const asked = JSON.stringify([spot, rec.meta.fileRev, region])
  const [answer, setAnswer] = useState<{ asked: string; found: boolean } | null>(null)
  const found = answer?.asked === asked ? answer.found : null
  const setFound = useCallback((f: boolean) => setAnswer({ asked, found: f }), [asked])
  const unknownSpot = !!spot && !spotName(rec, spot)
  // A stepped diagram: the step chosen (-1 for none: the whole drawing). Steps are only for a drawing file.
  const steps = format && isCanvasFormat(format) && format !== 'raster' ? (a.steps ?? []) : []
  const at = spot && steps.length ? stepIndex(a, spot) : -1
  // A flight: stepping forward by one (the bar or the keys) onto a step with moves flies them; so
  // does Replay. A jump (the panel, a link) never does, so a flight is dropped once the step is left.
  const [flight, setFlight] = useState<{ to: number; n: number; replay: boolean } | null>(null)
  const flights = useRef(0)
  useEffect(() => {
    if (flight && flight.to !== at) setFlight(null)
  }, [at])
  const go = (i: number) => {
    setFlight(movesToPlay(steps, at, i).length ? { to: i, n: ++flights.current, replay: false } : null)
    onSpot?.(i < 0 ? null : (steps[i]?.id ?? null))
  }
  const replay = at >= 0 && steps[at]?.moves.length ? () => setFlight({ to: at, n: ++flights.current, replay: true }) : undefined
  // The arrow keys step, with the drawing or the step bar in focus (not while typing, not with a modifier).
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!steps.length || !onSpot || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    const t = e.target
    if (!(t instanceof Element) || !t.closest('.canvas-frame, .step-bar') || t.closest('input, textarea, select, [contenteditable="true"]')) return
    const next = e.key === 'ArrowRight' ? (at < 0 ? 0 : at + 1) : at - 1
    if (next < 0 || next >= steps.length) return
    e.preventDefault()
    go(next)
  }

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

  // Full screen sits at the end of the view bar; a document with no view bar (Markdown) gets one of its own.
  const fullButton = fullScreen ? <FullScreenButton {...fullScreen} /> : null

  let body
  if (!format) body = <div className="viewer-note bad">This artifact has no file the board can show.</div>
  // Moving between steps (or back to the whole drawing) is one key for them all: the view stays where
  // it is, unless it follows the steps (`step_view: follow`), when each step's focus is framed.
  else if (isCanvasFormat(format)) {
    const stepping = steps.length > 0 && (!spot || at >= 0)
    const follow = stepping && a.stepView === 'follow' ? { key: at >= 0 ? String(at) : '', anchors: at >= 0 ? stepFocusAnchors(steps[at]!) : [] } : null
    body = <CanvasBody rec={rec} url={url} region={region} focusKey={stepping ? 'steps' : focusKey} preview={preview} onRegionFound={setFound} find={find} step={at} flight={flight && flight.to === at ? flight : null} follow={follow} viewExtra={fullButton} />
  }
  else if (format === 'markdown') body = <MarkdownBody url={url} rec={rec} region={region} auto={auto} focusKey={focusKey} onRegionFound={setFound} find={find} />
  else body = <PdfReader url={url} spot={{ region, auto }} focusKey={focusKey} label={a.title} onRegionFound={setFound} find={find} viewExtra={fullButton} />
  const ownBar = !!fullButton && (!format || format === 'markdown')

  return (
    <div className="artifact-viewer" onKeyDown={onKeyDown}>
      {body}
      {steps.length > 0 && onSpot && <StepBar steps={steps} at={at} onGo={go} onReplay={replay} />}
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
      {ownBar && (
        <div className="view-dock doc-dock">
          <div className="view-bar" role="toolbar" aria-label="View">
            {fullButton}
          </div>
        </div>
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

function FullScreenButton({ on, toggle }: FullScreen): ReactNode {
  return (
    <button className="btn icon ghost sm" onClick={toggle} aria-pressed={on} aria-label={on ? 'Leave full screen' : 'Full screen'} title={on ? 'Leave full screen (Esc)' : 'Full screen'}>
      {on ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
    </button>
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

function CanvasBody({ rec, url, region, focusKey, preview, onRegionFound, find, step, flight, follow, viewExtra }: { rec: ArtifactRec; url: string; region: Region | null; focusKey?: string; preview: string | null; onRegionFound: (f: boolean) => void; find: FindProps; step: number; flight: { to: number; n: number; replay: boolean } | null; follow: { key: string; anchors: string[] } | null; viewExtra: ReactNode }) {
  const a = rec.data
  const format = rec.meta.format!
  const key = `${a.id}|${rec.meta.fileRev ?? ''}|${format === 'mermaid' ? a.source : ''}`
  const loaded = useLoaded(key, () => loadCanvas({ format, url, source: a.source, seed: a.id, bounds: rec.meta.bounds }), releaseCanvas)
  // Record IDs drawn in the text open their record, as a bare ID in Markdown does.
  const index = useIndex()
  const artifacts = useCatalogue((s) => s.artifacts)
  const resolveLink = useMemo(() => (format === 'raster' ? undefined : catalogueResolver(index, artifacts, a.id)), [format, index, artifacts, a.id])
  const open = useOpen()
  const openRef = useRef(open)
  openRef.current = open
  const onLink = useCallback((id: string) => guarded(() => (isQuestionId(id) ? openRef.current.question(id) : isArtifactId(id) ? openRef.current.artifact(id) : openRef.current.item(id))), [])
  const steps = a.steps
  const view = useMemo(() => (steps?.length && step >= 0 ? stepState(steps, step) : null), [steps, step])
  // The moves to fly at this step, once per flight asked for; a replay starts from the step before.
  const moves = flight && steps?.[step]?.moves.length ? steps[step]!.moves : null
  const flying = useMemo(
    () => (flight && moves ? { key: `${flight.to}|${flight.n}`, moves, before: flight.replay ? (step > 0 ? stepState(steps, step - 1) : beforeSteps(steps)) : null } : null),
    [flight, moves, steps, step],
  )
  if (loaded.status === 'loading') return <div className="viewer-note">Drawing</div>
  if (loaded.status === 'error') return <div className="viewer-note bad">{format === 'mermaid' ? 'The diagram could not be drawn' : 'The file could not be shown'}: {loaded.error}</div>
  const previewRegion = preview ? (a.regions.find((r) => r.id === preview) ?? null) : null
  return <CanvasViewer content={loaded.value} region={region} focusKey={focusKey} preview={previewRegion} dragPans={format === 'raster'} label={a.title} onRegionFound={onRegionFound} find={find} resolveLink={resolveLink} onLink={onLink} stepState={view} flight={flying} follow={follow} viewExtra={viewExtra} />
}

function MarkdownBody({ url, rec, region, auto, focusKey, onRegionFound, find }: { url: string; rec: ArtifactRec; region: Region | null; auto: string | null; focusKey?: string; onRegionFound: (f: boolean) => void; find: FindProps }) {
  const loaded = useLoaded(url, () => fetchText(url))
  if (loaded.status === 'loading') return <div className="viewer-note">Opening the document</div>
  if (loaded.status === 'error') return <div className="viewer-note bad">The document could not be opened: {loaded.error}</div>
  return <MarkdownReader text={loaded.value} spot={{ region, auto }} focusKey={focusKey} label={rec.data.title} onRegionFound={onRegionFound} find={find} />
}

import { Info, Settings } from 'lucide-react'
import { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BOARD_NAME, STARTER_PROJECT_NAME } from '../shared/config.ts'
import { isOpenQuestion } from '../shared/statuses.ts'
import { isPastArtifact, type CatalogueEvent } from '../shared/types.ts'
import { ItemModal } from './components/ItemModal.tsx'
import { NewCardButton } from './components/NewCardButton.tsx'
import { QuestionModal } from './components/QuestionModal.tsx'
import { hasUnsavedDrafts } from './components/useEditableRecord.ts'
import { useOpen } from './nav.ts'
import { useCatalogue, useConfig, useIndex, useShownIndex } from './store.ts'
import { useArtifactIndex } from './artifactIndex.ts'
import { BrandMark } from './components/BrandMark.tsx'
import { ProblemPill } from './components/ProblemPill.tsx'
import { RegionBoundary } from './components/RegionBoundary.tsx'
import { AboutView } from './views/AboutView.tsx'
import { ArtifactPage } from './views/ArtifactPage.tsx'
import { ArtifactsView } from './views/ArtifactsView.tsx'
import { BoardView } from './views/BoardView.tsx'
import { OutlineView } from './views/OutlineView.tsx'
import { useUncommittedCount } from './diff/useUncommittedCount.ts'
import { QuestionsView } from './views/QuestionsView.tsx'
import { SettingsView } from './views/SettingsView.tsx'

/** The Diff review (its Markdown kit, its styles) loads the first time the tab is opened. */
const DiffView = lazy(() => import('./diff/DiffView.tsx').then((m) => ({ default: m.DiffView })))

export function App() {
  const status = useCatalogue((s) => s.status)
  const error = useCatalogue((s) => s.error)
  const load = useCatalogue((s) => s.load)
  const applyEvent = useCatalogue((s) => s.applyEvent)
  const [connected, setConnected] = useState(true)
  const open = useOpen()
  const pathname = useLocation().pathname
  const onBoard = pathname === '/board'

  useEffect(() => {
    void load()
  }, [load])

  // Files edited outside the app (an agent, a terminal, git) arrive over Vite's HMR socket.
  useEffect(() => {
    const hot = import.meta.hot
    if (!hot) return
    const onChange = (e: CatalogueEvent) => applyEvent(e)
    const onDown = () => setConnected(false)
    const onUp = () => {
      setConnected(true)
      // Save card moves made while the server was away before re-reading, so they aren't lost.
      void useCatalogue.getState().flushLayout().then(load)
    }
    hot.on('catalogue:changed', onChange)
    hot.on('vite:ws:disconnect', onDown)
    hot.on('vite:ws:connect', onUp)
    return () => {
      hot.off('catalogue:changed', onChange)
      hot.off('vite:ws:disconnect', onDown)
      hot.off('vite:ws:connect', onUp)
    }
  }, [applyEvent, load])

  // Unsaved sheet edits survive in-app navigation, but not a reload or closed tab: ask first.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedDrafts()) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const itemId = open.params.get('item')
  // An artifact's page has no new-card plus: its corner is the artifact's view bar.
  const onArtifact = useLocation().pathname.startsWith('/artifacts/')
  const questionId = open.params.get('question')

  return (
    <div className="shell">
      <Masthead connected={connected} />
      <main className="main">
        {status === 'loading' && <div className="loading">Reading the catalogue…</div>}
        {status === 'error' && (
          <div className="loading">
            <p>Could not read the catalogue: {error}</p>
          </div>
        )}
        {status === 'ready' && (
          // One view at a time, each with a fresh boundary (keyed by path): a failed view leaves the
          // masthead, its problem list and the open sheets working.
          <RegionBoundary
            key={pathname}
            region="view"
            label={viewLabel(pathname)}
            toBoard={!onBoard}
            closes={itemId && questionId ? 'both' : itemId ? 'item' : questionId ? 'question' : undefined}
            resetKey={`${itemId ?? ''}|${questionId ?? ''}`}
          >
          <Routes>
            <Route path="/board" element={<BoardView />} />
            <Route path="/artifacts" element={<ArtifactsView />} />
            <Route path="/artifacts/:id" element={<ArtifactPage />} />
            <Route path="/questions" element={<QuestionsView />} />
            <Route path="/outline" element={<OutlineView />} />
            <Route
              path="/diff"
              element={
                <Suspense fallback={<div className="page" />}>
                  <DiffView />
                </Suspense>
              }
            />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Routes>
          </RegionBoundary>
        )}
        {status === 'ready' && !onArtifact && <NewCardButton />}
      </main>
      {/* On the board the item docks beside the map (BoardView); elsewhere it is a modal. */}
      {status === 'ready' && itemId && !onBoard && (
        <RegionBoundary key={itemId} region="sheet:item" label="This card" frame="sheet" closes="item">
          <ItemModal id={itemId} />
        </RegionBoundary>
      )}
      {status === 'ready' && questionId && (
        <RegionBoundary key={questionId} region="sheet:question" label="This outstanding item" frame="sheet" closes="question">
          <QuestionModal id={questionId} />
        </RegionBoundary>
      )}
    </div>
  )
}

/** A view's name, as a recovery panel's sentence starts ("The Board couldn't be shown."). */
function viewLabel(pathname: string): string {
  if (pathname === '/board') return 'The Board'
  if (pathname === '/artifacts') return 'The Artifacts list'
  if (pathname.startsWith('/artifacts/')) return "This artifact's page"
  if (pathname === '/questions') return 'Outstanding items'
  if (pathname === '/outline') return 'The Outline'
  if (pathname === '/diff') return 'The Diff review'
  if (pathname === '/settings') return 'Settings'
  if (pathname === '/about') return 'About'
  return 'This page'
}

function Masthead({ connected }: { connected: boolean }) {
  const index = useIndex()
  const shown = useShownIndex()
  const artifacts = useArtifactIndex()
  const liveArtifacts = artifacts.list.filter((r) => !isPastArtifact(r.data.status)).length
  const config = useConfig()
  const project = config.project.name
  const accent = config.project.accent
  const board = BOARD_NAME
  useEffect(() => {
    document.title = project ? `${project} · ${board}` : board
  }, [project, board])
  useEffect(() => setFavicon(accent), [accent])
  const openCount = index.questions.filter((q) => isOpenQuestion(index.config, q)).length
  const uncommitted = useUncommittedCount()

  return (
    <header className={accent ? 'masthead accented' : 'masthead'} style={accent ? ({ '--accent': accent } as CSSProperties) : undefined}>
      <div className="brand">
        <BrandMark accent={accent} />
        <span className="brand-name">{board}</span>
        {project && (
          <span className="brand-project" title={project}>
            {project}
          </span>
        )}
      </div>
      <nav className="tabs" aria-label="Views">
        <NavLink className="tab" to="/board">
          Board
        </NavLink>
        <NavLink className="tab" to="/artifacts">
          Artifacts <span className="count">{liveArtifacts}</span>
        </NavLink>
        <NavLink className="tab" to="/questions">
          Outstanding items <span className="count">{openCount}</span>
        </NavLink>
        <NavLink className="tab" to="/outline">
          Outline <span className="count">{shown.items.length}</span>
        </NavLink>
        <NavLink className="tab" to="/diff" title={uncommitted ? `${uncommitted} record${uncommitted === 1 ? '' : 's'} changed since the last commit` : 'Compare the catalogue between two versions'}>
          Diff review {!!uncommitted && <span className="count">{uncommitted}</span>}
        </NavLink>
      </nav>
      <div className="masthead-right">
        {/* Nothing shows while all is well: the pill appears only when something needs attention. */}
        <ProblemPill connected={connected} />
        {/* Until the project is named, a new team is pointed at the guide. */}
        {(!project || project === STARTER_PROJECT_NAME) && (
          <NavLink className="btn ghost sm start-here" to="/about">
            Start here
          </NavLink>
        )}
        <NavLink className="btn icon ghost settings-link" to="/about" title="How to use this board" aria-label="About this board">
          <Info size={16} />
        </NavLink>
        <NavLink className="btn icon ghost settings-link" to="/settings" title="Settings" aria-label="Settings">
          <Settings size={16} />
        </NavLink>
      </div>
    </header>
  )
}

/**
 * The tab icon: the board's card on a grid, its card drawn in the project's accent when one is set,
 * so tabs for different projects tell apart. Without one it is the teal mark from `index.html`. Its
 * grid lines are darker and heavier than the masthead mark's, or they vanish at tab-icon size.
 */
function setFavicon(accent: string | undefined) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) return
  const stroke = accent ?? '#0d6e63'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='#edf2f0'/><path d='M0 8h32M0 16h32M0 24h32M8 0v32M16 0v32M24 0v32' stroke='#b3c2bd' stroke-width='1.3'/><rect x='6' y='9' width='20' height='14' rx='2' fill='${accent ? stroke : '#fff'}' stroke='${stroke}' stroke-width='2'/></svg>`
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}


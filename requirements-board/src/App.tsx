import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { isOpenQuestion, type CatalogueEvent } from '../shared/types.ts'
import { ItemModal } from './components/ItemModal.tsx'
import { QuestionModal } from './components/QuestionModal.tsx'
import { hasUnsavedDrafts } from './components/useEditableRecord.ts'
import { useOpen } from './nav.ts'
import { useCatalogue, useIndex } from './store.ts'
import { BoardView } from './views/BoardView.tsx'
import { OutlineView } from './views/OutlineView.tsx'
import { QuestionsView } from './views/QuestionsView.tsx'

export function App() {
  const status = useCatalogue((s) => s.status)
  const error = useCatalogue((s) => s.error)
  const load = useCatalogue((s) => s.load)
  const applyEvent = useCatalogue((s) => s.applyEvent)
  const [connected, setConnected] = useState(true)
  const open = useOpen()

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
          <Routes>
            <Route path="/board" element={<BoardView />} />
            <Route path="/questions" element={<QuestionsView />} />
            <Route path="/outline" element={<OutlineView />} />
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Routes>
        )}
      </main>
      {status === 'ready' && itemId && <ItemModal key={itemId} id={itemId} />}
      {status === 'ready' && questionId && <QuestionModal key={questionId} id={questionId} />}
    </div>
  )
}

function Masthead({ connected }: { connected: boolean }) {
  const index = useIndex()
  const issues = useCatalogue((s) => s.issues)
  const layoutError = useCatalogue((s) => s.layoutError)
  const [showIssues, setShowIssues] = useState(false)
  const openCount = index.questions.filter(isOpenQuestion).length
  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.length - errors

  return (
    <header className="masthead">
      <div className="brand">
        <span className="brand-mark" aria-label="Anaesthesia Associates">
          AA
        </span>
        <span className="brand-name">Requirements board</span>
      </div>
      <nav className="tabs" aria-label="Views">
        <NavLink className="tab" to="/board">
          Board
        </NavLink>
        <NavLink className="tab" to="/questions">
          Outstanding items <span className="count">{openCount}</span>
        </NavLink>
        <NavLink className="tab" to="/outline">
          Outline <span className="count">{index.items.length}</span>
        </NavLink>
      </nav>
      <div className="masthead-right">
        {layoutError && (
          <span className="checks bad" role="alert" title={layoutError}>
            <AlertTriangle size={14} /> Card moves not saved
          </span>
        )}
        <span className="live" title={connected ? 'Watching the catalogue folder for changes' : 'Dev server not reachable'}>
          <span className={`live-dot${connected ? '' : ' off'}`} />
          {connected ? 'Live' : 'Offline'}
        </span>
        <button className={`checks${errors ? ' bad' : ''}`} onClick={() => setShowIssues((v) => !v)} aria-expanded={showIssues}>
          {errors ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {errors ? `${errors} error${errors > 1 ? 's' : ''}` : 'Checks pass'}
          {warnings > 0 && <span className="mono">· {warnings} note{warnings > 1 ? 's' : ''}</span>}
        </button>
      </div>
      {showIssues && (
        <div className="checks-panel" role="dialog" aria-label="Catalogue checks">
          {issues.length === 0 ? (
            <p className="empty">Every ID, parent, link and value checks out.</p>
          ) : (
            <ul>
              {issues.map((i, n) => (
                <li key={n}>
                  <span className={`mono sev-${i.severity}`}>{i.id}</span>
                  <span className={`sev-${i.severity}`}>{i.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </header>
  )
}

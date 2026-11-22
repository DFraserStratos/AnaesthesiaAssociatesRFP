import { AlertTriangle, CheckCircle2, Unplug } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Issue } from '../../shared/types.ts'
import { useClientProblems } from '../clientProblems.ts'
import { useCatalogue } from '../store.ts'
import { useDismiss } from '../useDismiss.ts'
import { useCloseOpen } from './RegionBoundary.tsx'

/** How long "All clear" stays after the last problem goes, so a fix is seen to land (matches the CSS fade). */
const CLEARED_MS = 3400

/**
 * The masthead's one status mark, shown only while something is wrong: offline first (card moves are
 * kept and sent when the server is back, which it then says, offering a Reload), then card moves not
 * saved, a refused move, a part of the page that failed or an uncaught error, a saved preference that
 * was reset, and catalogue errors. One problem names
 * itself; more say how many. It opens one list of them all. Notes are not problems: they never show
 * the pill, and are listed under the errors here and in full on Settings. Problems found in the
 * browser come from `clientProblems.ts` (accepted decision 17).
 */
export function ProblemPill({ connected, serverBack = false, onReload }: { connected: boolean; serverBack?: boolean; onReload?: () => void }) {
  const issues = useCatalogue((s) => s.issues)
  const layoutError = useCatalogue((s) => s.layoutError)
  const moveError = useCatalogue((s) => s.moveError)
  const crashes = useClientProblems((s) => s.crashes.length)
  const pageErrors = useClientProblems((s) => s.errors.length)
  const repairs = useClientProblems((s) => s.repairs.length)
  const errors = issues.filter((i) => i.severity === 'error').length

  const problems: string[] = []
  if (!connected) problems.push(serverBack ? 'Server is back' : 'Offline')
  if (layoutError) problems.push('Card moves not saved')
  if (moveError) problems.push(moveError.split(':')[0] ?? moveError)
  if (crashes) problems.push(crashes === 1 ? 'Part of the page failed' : `${crashes} parts of the page failed`)
  if (pageErrors) problems.push(pageErrors === 1 ? 'Page error' : `${pageErrors} page errors`)
  if (repairs) problems.push('Saved preferences reset')
  if (errors) problems.push(`${errors} error${errors > 1 ? 's' : ''}`)
  const count = problems.length

  const [open, setOpen] = useState(false)
  const [cleared, setCleared] = useState(false)
  const had = useRef(count)
  useEffect(() => {
    if (had.current > 0 && count === 0) {
      setOpen(false)
      setCleared(true)
      const t = setTimeout(() => setCleared(false), CLEARED_MS)
      had.current = count
      return () => clearTimeout(t)
    }
    if (count > 0) setCleared(false)
    had.current = count
  }, [count])

  const ref = useRef<HTMLButtonElement>(null)
  if (count === 0) {
    return cleared ? (
      <span className="problem-pill good cleared" role="status">
        <CheckCircle2 size={14} /> All clear
      </span>
    ) : null
  }
  const offline = !connected
  return (
    <>
      <button
        ref={ref}
        className={`problem-pill ${offline ? 'warn' : 'bad'}`}
        role="alert"
        aria-expanded={open}
        title={problems.join('\n')}
        onClick={() => setOpen((v) => !v)}
      >
        {offline ? <Unplug size={14} /> : <AlertTriangle size={14} />}
        {count === 1 ? problems[0] : `${count} problems`}
      </button>
      {open && <ProblemPanel anchor={ref} connected={connected} serverBack={serverBack} onReload={onReload} onClose={() => setOpen(false)} />}
    </>
  )
}

function ProblemPanel({ anchor, connected, serverBack, onReload, onClose }: { anchor: RefObject<HTMLButtonElement | null>; connected: boolean; serverBack: boolean; onReload?: () => void; onClose: () => void }) {
  const issues = useCatalogue((s) => s.issues)
  const layoutError = useCatalogue((s) => s.layoutError)
  const moveError = useCatalogue((s) => s.moveError)
  const clearMoveError = useCatalogue((s) => s.clearMoveError)
  const { crashes, errors: pageErrors, repairs, retry, dismissError, dismissRepair } = useClientProblems()
  const closeOpen = useCloseOpen()
  const ref = useDismiss<HTMLDivElement>(onClose, anchor)
  const errors = issues.filter((i) => i.severity === 'error')
  return (
    <div ref={ref} className="problem-panel" role="dialog" aria-label="Problems">
      {!connected && (
        <section>
          <h3>Connection</h3>
          {serverBack ? (
            <p className="problem-row">
              <span>{layoutError ? "The board's server is back, but card moves still could not be saved (below)." : "The board's server is back and your card moves are saved."} Reload to see changes made on disk again.</span>
              {onReload && (
                <button className="btn ghost sm" onClick={onReload}>
                  Reload
                </button>
              )}
            </p>
          ) : (
            <p>
              Offline: the board's server isn't answering. Card moves are kept and sent when it's back; sheet edits stay as drafts until you save them. Run <code>npm run dev</code> to start it again.
            </p>
          )}
        </section>
      )}
      {(layoutError || moveError) && (
        <section>
          <h3>Card moves</h3>
          {layoutError && <p className="sev-error">{layoutError}</p>}
          {moveError && (
            <p className="sev-error problem-row">
              <span>{moveError}</span>
              <button className="btn ghost sm" onClick={clearMoveError}>
                Dismiss
              </button>
            </p>
          )}
        </section>
      )}
      {(crashes.length > 0 || pageErrors.length > 0) && (
        <section>
          <h3>This page</h3>
          {crashes.map((c) => (
            <div key={c.region} className="sev-error problem-row">
              <span>
                {c.label} couldn't be shown: {c.message}
              </span>
              <span className="problem-actions">
                {c.closable && (
                  <button className="btn ghost sm" onClick={() => closeOpen(c.region === 'sheet:question' ? 'question' : c.region === 'view' ? 'both' : 'item')}>
                    Close card
                  </button>
                )}
                <button className="btn ghost sm" onClick={() => retry(c.region)}>
                  Try again
                </button>
              </span>
            </div>
          ))}
          {pageErrors.map((e) => (
            <p key={e.message} className="sev-error problem-row" title={e.detail}>
              <span>
                Error: {e.message}
                {e.count > 1 && ` (${e.count} times)`}
              </span>
              <button className="btn ghost sm" onClick={() => dismissError(e.message)}>
                Dismiss
              </button>
            </p>
          ))}
        </section>
      )}
      {repairs.length > 0 && (
        <section>
          <h3>Saved preferences</h3>
          {repairs.map((r) => (
            <p key={r.key} className="problem-row">
              <span>Your saved {r.label} could not be read in this browser, so they were reset.</span>
              <button className="btn ghost sm" onClick={() => dismissRepair(r.key)}>
                Dismiss
              </button>
            </p>
          ))}
        </section>
      )}
      {errors.length > 0 && (
        <section>
          <h3>Checks</h3>
          <IssueList issues={issues} />
        </section>
      )}
    </div>
  )
}

/** Catalogue check results, errors first, then notes. Shared by the problem list and Settings. */
export function IssueList({ issues }: { issues: Issue[] }) {
  const sorted = [...issues.filter((i) => i.severity === 'error'), ...issues.filter((i) => i.severity !== 'error')]
  return (
    <ul className="issue-list">
      {sorted.map((i, n) => (
        <li key={n} className={`sev-${i.severity}`}>
          <span className="mono">{i.id}</span>
          <span>
            {i.severity !== 'error' && 'Note: '}
            {i.message}
          </span>
        </li>
      ))}
    </ul>
  )
}

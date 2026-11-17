import { AlertTriangle, CheckCircle2, Unplug } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Issue } from '../../shared/types.ts'
import { useCatalogue } from '../store.ts'
import { useDismiss } from '../useDismiss.ts'

/** How long "All clear" stays after the last problem goes, so a fix is seen to land (matches the CSS fade). */
const CLEARED_MS = 3400

/**
 * The masthead's one status mark, shown only while something is wrong: offline first (nothing is
 * being saved), then card moves not saved, a refused move, and catalogue errors. One problem names
 * itself; more say how many. It opens one list of them all. Notes are not problems: they never show
 * the pill, and are listed under the errors here and in full on Settings.
 */
export function ProblemPill({ connected }: { connected: boolean }) {
  const issues = useCatalogue((s) => s.issues)
  const layoutError = useCatalogue((s) => s.layoutError)
  const moveError = useCatalogue((s) => s.moveError)
  const errors = issues.filter((i) => i.severity === 'error').length

  const problems: string[] = []
  if (!connected) problems.push('Offline')
  if (layoutError) problems.push('Card moves not saved')
  if (moveError) problems.push(moveError.split(':')[0] ?? moveError)
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
      {open && <ProblemPanel anchor={ref} connected={connected} onClose={() => setOpen(false)} />}
    </>
  )
}

function ProblemPanel({ anchor, connected, onClose }: { anchor: RefObject<HTMLButtonElement | null>; connected: boolean; onClose: () => void }) {
  const issues = useCatalogue((s) => s.issues)
  const layoutError = useCatalogue((s) => s.layoutError)
  const moveError = useCatalogue((s) => s.moveError)
  const clearMoveError = useCatalogue((s) => s.clearMoveError)
  const ref = useDismiss<HTMLDivElement>(onClose, anchor)
  const errors = issues.filter((i) => i.severity === 'error')
  return (
    <div ref={ref} className="problem-panel" role="dialog" aria-label="Problems">
      {!connected && (
        <section>
          <h3>Connection</h3>
          <p>
            Offline. Changes aren't being saved. Run <code>npm run dev</code> to start the board's server again.
          </p>
        </section>
      )}
      {(layoutError || moveError) && (
        <section>
          <h3>Card moves</h3>
          {layoutError && <p className="sev-error">Card moves not saved: {layoutError}</p>}
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

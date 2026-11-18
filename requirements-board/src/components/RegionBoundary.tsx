/**
 * The safety net round each part of the board that can fail on its own: every routed view, the item
 * sheet (modal and docked) and the question sheet (accepted decision 17, D-06). Known crash causes
 * are fixed where they start; this catches what still slips through.
 *
 * A caught crash replaces only its region with a recovery panel (what failed, the message, Close
 * card when a card or question is open, Try again, Go to board for other views, and Details with the
 * stack to copy), keeps the masthead and its problem list working, and lists the failure there under
 * "This page" until the region recovers. The error goes to the console too.
 *
 * Recovery never loops: the region renders again only when something changes (Try again, the open
 * card, the view, or the catalogue: an agent may have fixed the file), and a render that fails again
 * just shows the panel again. Unsaved sheet drafts live outside the sheet (`useEditableRecord.ts`),
 * so a crash never discards them and the leave-page prompt still protects them.
 *
 * Later phases put their own regions (a viewer, the canvas) inside one of these, or in another.
 */
import { AlertTriangle } from 'lucide-react'
import { Component, useCallback, useState, type ErrorInfo, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useClientProblems } from '../clientProblems.ts'
import { useCatalogue } from '../store.ts'
import { Sheet } from './Sheet.tsx'

/** Which open record Close card closes. */
export type Closes = 'item' | 'question' | 'both'

/** Clear the open card and/or question from the address, so a reload never reopens what failed. */
export function useCloseOpen() {
  const [, setParams] = useSearchParams()
  return useCallback(
    (which: Closes) =>
      setParams((p) => {
        const next = new URLSearchParams(p)
        if (which !== 'question') next.delete('item')
        if (which !== 'item') next.delete('question')
        next.delete('edit')
        return next
      }),
    [setParams],
  )
}

interface Props {
  /** Stable name of the region, as the problem list keys it ("view", "sheet:item", "dock:item"). */
  region: string
  /** The region in words, as the panel's sentence starts: "The Board", "This card". */
  label: string
  /** How the panel is framed: in the page, in a modal sheet, or in the board's docked panel. */
  frame?: 'page' | 'sheet' | 'docked'
  /** What Close card closes; omitted when nothing is open in this region. */
  closes?: Closes
  /** Offer Go to board (a view other than the board). */
  toBoard?: boolean
  /** Anything whose change should give a failed region a fresh start (the open card, say). */
  resetKey?: string
  children: ReactNode
}

export function RegionBoundary(props: Props) {
  const retries = useClientProblems((s) => s.retries[props.region] ?? 0)
  // The catalogue's records: when they change, a failed region tries once more.
  const items = useCatalogue((s) => s.items)
  const questions = useCatalogue((s) => s.questions)
  const artifacts = useCatalogue((s) => s.artifacts)
  const config = useCatalogue((s) => s.config)
  const layout = useCatalogue((s) => s.layout)
  const closeOpen = useCloseOpen()
  const navigate = useNavigate()
  return (
    <Boundary
      {...props}
      resets={[props.resetKey, retries, items, questions, artifacts, config, layout]}
      onRetry={() => useClientProblems.getState().retry(props.region)}
      onClose={props.closes ? () => closeOpen(props.closes!) : undefined}
      onBoard={props.toBoard ? () => navigate('/board') : undefined}
    />
  )
}

interface BoundaryProps extends Props {
  resets: unknown[]
  onRetry: () => void
  onClose?: () => void
  onBoard?: () => void
}

interface BoundaryState {
  error: Error | null
  detail: string
}

const asError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)))

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, detail: '' }
  /** What `resets` held when it failed: it starts afresh only once one of them has changed. */
  private failedWith: unknown[] = []

  static getDerivedStateFromError(e: unknown): Partial<BoundaryState> {
    return { error: asError(e) }
  }

  componentDidCatch(e: unknown, info: ErrorInfo) {
    const error = asError(e)
    useClientProblems.getState().caughtCrash(error.message) // React in development may also report it to the page
    this.failedWith = this.props.resets
    const detail = `${error.stack ?? error.message}\n\nIn the board's components:${info.componentStack ?? ''}`
    console.error(`[board] ${this.props.label} failed to show (${this.props.region}):`, error, info.componentStack)
    this.setState({ detail })
    useClientProblems.getState().crashed({ region: this.props.region, label: this.props.label, message: error.message, detail, closable: !!this.props.closes })
  }

  componentDidUpdate() {
    // A fresh start only when something changed since it failed: never straight back into the same render.
    if (this.state.error && this.failedWith.some((r, n) => r !== this.props.resets[n])) {
      useClientProblems.getState().recovered(this.props.region)
      this.setState({ error: null, detail: '' })
    }
  }

  componentWillUnmount() {
    if (this.state.error) useClientProblems.getState().recovered(this.props.region)
  }

  render() {
    const { error, detail } = this.state
    if (!error)
      return (
        <>
          <CrashProbe region={this.props.region} />
          {this.props.children}
        </>
      )
    const panel = <RecoveryPanel label={this.props.label} message={error.message} detail={detail} onRetry={this.props.onRetry} onClose={this.props.onClose} onBoard={this.props.onBoard} />
    const frame = this.props.frame ?? 'page'
    if (frame === 'page') return <div className="page">{panel}</div>
    return (
      <Sheet label={`${this.props.label} failed to show`} onClose={this.props.onClose ?? (() => {})} docked={frame === 'docked'}>
        <div className="sheet-body">{panel}</div>
      </Sheet>
    )
  }
}

function RecoveryPanel({ label, message, detail, onRetry, onClose, onBoard }: { label: string; message: string; detail: string; onRetry: () => void; onClose?: () => void; onBoard?: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard
      ?.writeText(detail)
      .then(() => setCopied(true))
      .catch(() => {})
  }
  return (
    <div className="crash-panel" role="alert">
      <h2>
        <AlertTriangle size={18} /> {label} couldn't be shown.
      </h2>
      <p>Something in the data or the board stopped this part of the page. The rest of the board still works, and the problem list in the masthead says what the checks found.</p>
      <p className="crash-message mono">{message}</p>
      <div className="crash-actions">
        {onClose && (
          <button className="btn primary" onClick={onClose}>
            Close card
          </button>
        )}
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
        {onBoard && (
          <button className="btn" onClick={onBoard}>
            Go to board
          </button>
        )}
      </div>
      <details className="crash-details">
        <summary>Details</summary>
        <pre>{detail}</pre>
        <button className="btn ghost sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy details'}
        </button>
      </details>
    </div>
  )
}

declare global {
  interface Window {
    /** Tests only: the region named here throws while rendering, to prove the boundary (`e2e/bad-data.spec.ts`). */
    __BOARD_CRASH_TEST__?: string
  }
}

/** Throws in development when a test names this region; renders nothing otherwise. */
function CrashProbe({ region }: { region: string }) {
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.__BOARD_CRASH_TEST__ === region) throw new Error(`crash test in ${region}`)
  return null
}

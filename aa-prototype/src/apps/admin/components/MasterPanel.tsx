/**
 * The wide desktop side panel Master data opens a record in (catch-up Phase
 * 18: Parties and Contracts). It extends the Admin List drawer's anatomy (a
 * scrim, a right-docked surface, a header with the record's name and pills, a
 * scrolling body, a footer of actions) to a wider form so a record's fields
 * read in two columns beside the table they came from.
 */

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { elevation, neutral, scrim } from '../../../theme/tokens'

export const MASTER_PANEL_WIDTH = 600

interface MasterPanelProps {
  open: boolean
  onClose: () => void
  /** The record's name, or "New ..." when creating. */
  title: ReactNode
  /** Pills and one mist line under the title. */
  meta?: ReactNode
  shot?: string
  children: ReactNode
  /** Actions, right-aligned; the primary (teal) one last. */
  footer?: ReactNode
}

export function MasterPanel({ open, onClose, title, meta, shot, children, footer }: MasterPanelProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  // Held in a ref so a parent's inline onClose never re-runs the effect (and steals focus).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Escape closes, focus moves into the panel on open and back where it was on close.
  useEffect(() => {
    if (!open) return undefined
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnTo?.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: scrim, zIndex: 40 }} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-shot={shot}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: MASTER_PANEL_WIDTH, maxWidth: '100%', background: neutral.surface, zIndex: 41, boxShadow: elevation.e3, display: 'flex', flexDirection: 'column', outline: 'none' }}
      >
        <header style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <h2 id={titleId} style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: '26px' }}>{title}</h2>
            {meta !== undefined && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: neutral.slate }}>{meta}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4 }}>
            <X size={20} aria-hidden />
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
        {footer !== undefined && (
          <footer style={{ padding: '14px 24px', borderTop: `1px solid ${neutral.line}`, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>{footer}</footer>
        )}
      </aside>
    </>
  )
}

/** Two fields side by side in the panel; one column when a field needs the width. */
export function PanelGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>{children}</div>
}

/** A titled group of fields in the panel. */
export function PanelSection({ title, children, shot }: { title: string; children: ReactNode; shot?: string }) {
  return (
    <section data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: neutral.ink }}>{title}</h3>
      {children}
    </section>
  )
}

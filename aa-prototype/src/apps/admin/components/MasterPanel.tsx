/**
 * The wide desktop side panel Master data opens a record in (catch-up Phase
 * 18: Parties and Contracts). It extends the Admin List drawer's anatomy (a
 * scrim, a right-docked surface, a header with the record's name and pills, a
 * scrolling body, a footer of actions) to a wider form so a record's fields
 * read in two columns beside the table they came from.
 */

import { type ReactNode } from 'react'
import { neutral } from '../../../theme/tokens'
import { SidePanel, SIDE_PANEL_WIDTH } from '../../../shared/surface/SidePanel'

export const MASTER_PANEL_WIDTH = SIDE_PANEL_WIDTH.record

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

/**
 * The `record` preset of the one Admin `SidePanel` (UI unification U2, README
 * U19): 600px, the record's name as the h2, the right-aligned footer. Escape,
 * focus in and back, the Tab trap and the inert page come from the one modal
 * stack, so a sheet opened over it (the RVG code picker) closes first.
 */
export function MasterPanel({ open, onClose, title, meta, shot, children, footer }: MasterPanelProps) {
  return (
    <SidePanel open={open} onClose={onClose} title={title} meta={meta} shot={shot} width="record" footer={footer}>
      {children}
    </SidePanel>
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

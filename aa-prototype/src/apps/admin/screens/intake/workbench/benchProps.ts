/**
 * The one props shape every Intake bench takes (build plan Phase 68; D117), and the three slots each bench fills on the
 * opened arrival's page (27 Nov 2026 rebuild; docs/explorations/intake-inbox-iterations.html, O1): the document on the
 * left (the PDF, or the rows as a hospital sent them), the decision in the right-hand column, and the actions in that
 * column's footer, directly under the choice (secondary first, primary last). Each bench renders `BenchLayout` with
 * its three slots, so every kind lays out the same way.
 */

import type { ReactNode } from 'react'
import type { ArrivalItem } from '../../../../../domain/intake/arrivals'
import type { Actor } from '../../../../../store/mutate'

export interface BenchProps {
  arrival: ArrivalItem
  actor: Actor
  /** Called once the arrival is decided: the page keeps it open, showing the outcome. */
  onDone: () => void
  /** Opens the next arrival in the inbox's order; absent at the end of the inbox. */
  onNext?: () => void
}

/** The footer of the decision column: a short note over the buttons, then the secondary and primary buttons. */
export interface BenchActions {
  note?: ReactNode
  secondary?: ReactNode
  primary?: ReactNode
  /** `data-shot` on the footer. */
  shot?: string
}

export interface BenchLayoutProps {
  /** The left pane, on the grey desk: the PDF as received, or the rows as the hospital sent them. */
  document: ReactNode
  /** The right-hand column's scrolling body: what will change and the choices. */
  decision: ReactNode
  /** The right-hand column's footer; absent when there is nothing to do. */
  actions?: BenchActions
  /** `data-shot` on the layout's root (`intake-bench-<kind>`). */
  shot?: string
  /** `data-*` (`data-arrival-key`) on the layout's root. */
  [key: `data-${string}`]: string | undefined
}

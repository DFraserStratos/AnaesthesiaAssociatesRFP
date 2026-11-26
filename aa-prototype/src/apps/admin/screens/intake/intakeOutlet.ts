/**
 * What `IntakeSection` hands its two routed views through the outlet (build plan Phase 68), on top of the
 * Admin shell's own outlet context, which it passes straight through (the route wrappers still read
 * `useAdminOutlet()`). The section owns "Add a PDF by hand" and its sheet; the Arrivals feed shows the
 * action in its foot, where #idea1's layout B draws it.
 */

import type { ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'

export interface IntakeOutletExtras {
  /** The section's "Add a PDF by hand" action, for the feed's foot. */
  addPdfByHand?: ReactNode
}

/** The section's extras; empty outside an `IntakeSection` (a view rendered on its own in a test). */
export function useIntakeOutlet(): IntakeOutletExtras {
  const context = useOutletContext<IntakeOutletExtras | null | undefined>()
  return context ?? {}
}

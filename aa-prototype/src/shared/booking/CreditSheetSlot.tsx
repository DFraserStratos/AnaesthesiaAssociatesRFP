/**
 * Which sheet opens the credit form (catch-up Phase 39). A shared control (the
 * Procedure's Credit note button, the events list's Edit on a credit) asks
 * `useCreditSheet()` for it: Admin provides its side sheet (`CreditSheet`,
 * through `CreditSheetSlot`); anywhere else gets `CreditFormSheet`, the form
 * in the surface's own overlay (a bottom sheet on the phone, a 520 dialog on
 * the web, as 38b's additional invoice), which the anaesthetist's wrappers use
 * (work item 11). PWA-safe.
 */

import { createContext, useContext, type ComponentType } from 'react'
import type { Actor } from '../../store'
import { useSurface } from '../surface'
import { CreditForm, type CreditFormMode } from './CreditForm'

export interface CreditSheetProps {
  open: boolean
  invoiceId: string
  actor: Actor
  /** The Procedure it was opened from, credited on that Procedure. */
  procedureId?: string
  /** The Procedure's live invoices, to choose which to credit when there are several. */
  invoiceIds?: readonly string[]
  mode?: CreditFormMode
  /** A credit event to edit. */
  editing?: string
  onClose: () => void
  onDone?: (creditEventId: string) => void
}

export const CreditSheetSlot = createContext<ComponentType<CreditSheetProps> | null>(null)

/** The form in the surface's own overlay, mounted only while open so each opening starts afresh. */
export function CreditFormSheet({ open, onClose, ...rest }: CreditSheetProps) {
  const { Overlay } = useSurface()
  return (
    <Overlay open={open} onClose={onClose}>
      {open && <CreditForm {...rest} onClose={onClose} />}
    </Overlay>
  )
}

export function useCreditSheet(): ComponentType<CreditSheetProps> {
  return useContext(CreditSheetSlot) ?? CreditFormSheet
}

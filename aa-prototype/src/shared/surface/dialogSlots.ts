/**
 * The web `Dialog`'s pinned header and footer (docs/explorations/dialog-scroll-ideas.html,
 * option C): the dialog owns a fixed header and footer around one scrolling body,
 * and the shared `OverlayHeader` and `SheetActions` portal into them, so every
 * dialog gets a title, X and action row that stay put while only its form
 * scrolls, with no change to the dialog's own markup. The phone's `BottomSheet`
 * provides no slots, so its sheets render as before.
 */

import { createContext, useContext } from 'react'

export interface DialogSlots {
  header: HTMLElement
  footer: HTMLElement
  /** A footer row is present; returns its unregister. */
  registerFooter: () => () => void
}

export const DialogSlotsContext = createContext<DialogSlots | null>(null)

export function useDialogSlots(): DialogSlots | null {
  return useContext(DialogSlotsContext)
}

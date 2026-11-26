/**
 * Add a PDF by hand (build plan Phase 68 creates the stub; Phase 70 fills it): the fallback for a
 * rooms' PDF that did not come through the mailbox. `IntakeSection` keeps "Add a PDF by hand"
 * disabled while `ADD_PDF_BY_HAND_READY` is false, so Phase 70 fills this file and flips the
 * constant without editing the section.
 */

import type { Actor } from '../../../../../../store/mutate'

export const ADD_PDF_BY_HAND_READY = false

export function AddPdfByHand({ open, onClose, actor }: { open: boolean; onClose: () => void; actor: Actor }) {
  void open
  void onClose
  void actor
  return null
}

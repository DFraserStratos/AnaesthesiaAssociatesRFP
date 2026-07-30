import { useOutletContext } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Actor } from '../../store'

/** What the routed mobile screens read from the `MobileApp` layout. */
export interface MobileOutletContext {
  actor: Actor
  anaesthetistId: string
  personaName: string
  personaRole: string
  initials: string
  /**
   * Host-supplied extra content for the More tab, appended below the demo note.
   *
   * The installed PWA has no harness bar, so it injects its presenter controls
   * here. The prototype passes nothing and its More tab is unchanged. A slot
   * rather than a flag, so every line of PWA-only code stays in `src/pwa/` and
   * out of the prototype's bundle.
   */
  moreExtra?: ReactNode
}

export function useMobileOutlet(): MobileOutletContext {
  return useOutletContext<MobileOutletContext>()
}

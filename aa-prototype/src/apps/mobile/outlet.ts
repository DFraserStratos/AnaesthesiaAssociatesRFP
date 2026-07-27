import { useOutletContext } from 'react-router-dom'
import type { Actor } from '../../store'

/** What the routed mobile screens read from the `MobileApp` layout. */
export interface MobileOutletContext {
  actor: Actor
  anaesthetistId: string
  personaName: string
  personaRole: string
  initials: string
}

export function useMobileOutlet(): MobileOutletContext {
  return useOutletContext<MobileOutletContext>()
}

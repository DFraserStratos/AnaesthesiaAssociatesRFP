import { useOutletContext } from 'react-router-dom'
import type { Actor } from '../../store'
import type { CoverTarget } from './types'

/** What the routed web screens read from the `WebApp` layout. */
export interface WebOutletContext {
  anaesthetistId: string
  personaName: string
  actor: Actor
  todayISO: string
  /** Open the Request/Offer cover dialog — a transient overlay, not a route. */
  onCover: (target: CoverTarget) => void
}

export function useWebOutlet(): WebOutletContext {
  return useOutletContext<WebOutletContext>()
}

import { useOutletContext } from 'react-router-dom'
import type { Actor } from '../../store'

/** What the routed web screens read from the `WebApp` layout. */
export interface WebOutletContext {
  anaesthetistId: string
  personaName: string
  actor: Actor
  todayISO: string
}

export function useWebOutlet(): WebOutletContext {
  return useOutletContext<WebOutletContext>()
}

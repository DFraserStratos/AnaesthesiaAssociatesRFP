/**
 * Intake's two tabs in one registry (build plan Phase 68; D117): Arrivals and Sources, each its own
 * address (`intakePaths.ts`), in the strip's order. Intake opens on Arrivals. Kept apart from
 * `IntakeSection.tsx` so the component file only exports components.
 */

import { arrivalsPath, sourcesPath } from './intakePaths'

export type IntakeTab = 'arrivals' | 'sources'

export interface IntakeTabEntry {
  tab: IntakeTab
  label: string
  path: string
}

export const INTAKE_TABS: readonly IntakeTabEntry[] = [
  { tab: 'arrivals', label: 'Arrivals', path: arrivalsPath() },
  { tab: 'sources', label: 'Sources', path: sourcesPath() },
]

/** The tab a pathname shows: Sources under `/admin/intake/sources`, else Arrivals. */
export function intakeTabFromPath(pathname: string): IntakeTab {
  return pathname.replace(/\/+$/, '').startsWith(sourcesPath()) ? 'sources' : 'arrivals'
}

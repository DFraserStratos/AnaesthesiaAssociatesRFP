import { ChevronsRight, MapPin, type LucideIcon } from 'lucide-react'
import type { AppStoreApi } from '../store/appStore'
import {
  advanceClockDays,
  advanceClockMinutes,
  advanceClockToDate,
  advanceClockToNextMorning,
} from '../store/clockActions'

/** The S1 booking's procedure day (Dr Souter's seeded Tue 28 Jul St George's List). */
export const S1_PROCEDURE_DAY = '2026-07-28'

export interface DemoClockShortcut {
  id: string
  label: string
  icon: LucideIcon
  run: () => void
  /** Disabled when the jump would be a no-op (the clock is forward-only). */
  disabled: boolean
}

/**
 * The single shortcut definition used by both presenter clock surfaces.
 * Clock arithmetic remains in the store; this module owns only demo labels
 * and the mapping from a labelled control to an existing action.
 */
export function demoClockShortcuts(api: AppStoreApi, todayISO: string): readonly DemoClockShortcut[] {
  return [
    {
      id: 'plus-15-minutes',
      label: '+15 min',
      icon: ChevronsRight,
      run: () => advanceClockMinutes(api, 15),
      disabled: false,
    },
    {
      id: 'plus-1-hour',
      label: '+1 hour',
      icon: ChevronsRight,
      run: () => advanceClockMinutes(api, 60),
      disabled: false,
    },
    {
      id: 'next-day',
      label: 'Next day',
      icon: ChevronsRight,
      run: () => advanceClockDays(api, 1),
      disabled: false,
    },
    {
      id: 'next-morning',
      label: 'Next morning',
      icon: ChevronsRight,
      run: () => advanceClockToNextMorning(api),
      disabled: false,
    },
    {
      id: 'plus-7-days',
      label: '+7 days',
      icon: ChevronsRight,
      run: () => advanceClockDays(api, 7),
      disabled: false,
    },
    {
      id: 'procedure-day',
      label: 'Procedure day · 28 Jul',
      icon: MapPin,
      run: () => advanceClockToDate(api, S1_PROCEDURE_DAY),
      disabled: todayISO >= S1_PROCEDURE_DAY,
    },
  ]
}

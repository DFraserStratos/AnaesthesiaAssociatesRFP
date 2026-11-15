import { useMemo } from 'react'
import { parseISO } from 'date-fns'
import { scheduleHorizon, useAppStore, useToday } from '@proto/store'

/** Read-only store access for this slice (the replacement side never writes to the prototype store). */
export function useStore<T>(select: (s: any) => T): T {
  return useAppStore(select) as T
}

/** The demo clock's today as an ISO day and a Date (DEMO_TODAY unless the demo clock moved). */
export function useDemoToday(): { todayISO: string; today: Date } {
  const todayISO = useToday() as string
  return useMemo(() => ({ todayISO, today: parseISO(todayISO) }), [todayISO])
}

/** The live schedule horizon (FT-01.1): the clock's today to the horizon setting. */
export function useHorizon(): { startISO: string; endISO: string } {
  const clock = useStore((s) => s.clock)
  const appSettings = useStore((s) => s.appSettings)
  return useMemo(() => scheduleHorizon({ clock, appSettings }) as { startISO: string; endISO: string }, [clock, appSettings])
}

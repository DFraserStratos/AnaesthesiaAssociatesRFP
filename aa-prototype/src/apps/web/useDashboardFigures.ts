import { useMemo } from 'react'
import { deriveDashboardFigures, type DashboardFigures } from '../../domain/seed'
import { useAppStore, useToday } from '../../store'

/**
 * The web component adapter for the seeded dashboard figures (W1/W4): subscribes
 * narrowly to the `dashboards` seed slice + the demo clock's today and memoises
 * the pure `deriveDashboardFigures` derivation. One derivation home for both the
 * Dashboard and Accounts screens; the store selector `dashboardFiguresFor`
 * serves non-component callers. Returns undefined when no figures are seeded for
 * the anaesthetist (honest-empty). Narrow subscription avoids the fresh-object
 * selector footgun (a `useAppStore((s) => dashboardFiguresFor(s, id))` would
 * re-render on every store change).
 */
export function useDashboardFigures(anaesthetistId: string): DashboardFigures | undefined {
  const dashboards = useAppStore((s) => s.dashboards)
  const todayISO = useToday()
  return useMemo(() => {
    const seed = dashboards[anaesthetistId]
    return seed !== undefined ? deriveDashboardFigures(seed, todayISO) : undefined
  }, [dashboards, anaesthetistId, todayISO])
}

/**
 * The availability calendars' store reads (catch-up Phase 29). PWA-safe:
 * store and domain only.
 */

import { useMemo } from 'react'
import { activeSeriesFor, availabilityMonthFor, scheduleHorizon, useAppStore, type CalendarDay } from '../../store'

/** Today and the schedule horizon's last day (Phase 28's setting, FT-01.1): the calendars' bounds. */
export function useAvailabilityBounds(): { todayISO: string; horizonEndISO: string } {
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  return useMemo(() => ({ todayISO: clock.todayISO, horizonEndISO: scheduleHorizon({ clock, appSettings }).endISO }), [clock, appSettings])
}

/** An anaesthetist's month of sessions. */
export function useAvailabilityMonth(anaesthetistId: string, monthISO: string): CalendarDay[] {
  const slots = useAppStore((s) => s.schedule.slots)
  const lists = useAppStore((s) => s.schedule.lists)
  const availabilitySeries = useAppStore((s) => s.schedule.availabilitySeries)
  const appSettings = useAppStore((s) => s.appSettings)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  return useMemo(
    () =>
      availabilityMonthFor(
        { schedule: { slots, lists, availabilitySeries }, appSettings, masters: { slotStatuses, hospitals } },
        anaesthetistId,
        monthISO,
      ),
    [slots, lists, availabilitySeries, appSettings, slotStatuses, hospitals, anaesthetistId, monthISO],
  )
}

/** One day of an anaesthetist's sessions. */
export function useAvailabilityDay(anaesthetistId: string, dateISO: string): CalendarDay | undefined {
  const month = useAvailabilityMonth(anaesthetistId, dateISO.slice(0, 7))
  return month.find((d) => d.dateISO === dateISO)
}

/** An anaesthetist's active series, in words. */
export function useActiveSeries(anaesthetistId: string): { id: string; line: string }[] {
  const availabilitySeries = useAppStore((s) => s.schedule.availabilitySeries)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const todayISO = useAppStore((s) => s.clock.todayISO)
  return useMemo(
    () => activeSeriesFor({ schedule: { availabilitySeries }, masters: { slotStatuses } }, anaesthetistId, todayISO),
    [availabilitySeries, slotStatuses, anaesthetistId, todayISO],
  )
}

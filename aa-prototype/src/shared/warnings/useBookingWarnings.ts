import { useMemo } from 'react'
import type { Warning, WarningStrength } from '../../domain/warnings'
import { isOpen, strongerOf } from '../../domain/warnings'
import { useAppStore, warningsForBooking, warningsForList } from '../../store'

/** The slices the warning selectors read, selected one by one (never a fresh object from a selector). */
function useWarningSlices() {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  return { schedule, billing, appSettings, clock }
}

/** A Booking's warnings, open and cleared, strong first (catch-up Phase 15a). */
export function useBookingWarnings(bookingId: string): Warning[] {
  const { schedule, billing, appSettings, clock } = useWarningSlices()
  return useMemo(
    () => warningsForBooking({ schedule, billing, appSettings, clock }, bookingId),
    [schedule, billing, appSettings, clock, bookingId],
  )
}

/** Every warning on a List's Bookings, grouped by Booking id (one memoised pass for a row list). */
export function useListWarnings(listId: string): ReadonlyMap<string, Warning[]> {
  const { schedule, billing, appSettings, clock } = useWarningSlices()
  return useMemo(() => {
    const out = new Map<string, Warning[]>()
    for (const w of warningsForList({ schedule, billing, appSettings, clock }, listId)) {
      const arr = out.get(w.bookingId)
      if (arr === undefined) out.set(w.bookingId, [w])
      else arr.push(w)
    }
    return out
  }, [schedule, billing, appSettings, clock, listId])
}

/** The strongest OPEN warning's strength, or undefined when none is open. */
export function strongestOpen(warnings: readonly Warning[]): WarningStrength | undefined {
  return warnings.filter(isOpen).reduce<WarningStrength | undefined>((acc, w) => (acc === undefined ? w.strength : strongerOf(acc, w.strength)), undefined)
}

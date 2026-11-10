/**
 * The look-back hooks both anaesthetist apps share (catch-up Phase 38a):
 * search over the anaesthetist's own Bookings, and the date lookup's bounds,
 * each memoised over the records it reads.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { lookbackBoundsFor, searchBookingsFor, useAppStore, type BookingSearchResult } from '../../store'

export function useBookingSearch(anaesthetistId: string, rawQuery: string, todayISO: string): BookingSearchResult {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => searchBookingsFor({ schedule, masters }, anaesthetistId, rawQuery, todayISO), [schedule, masters, anaesthetistId, rawQuery, todayISO])
}

export function useLookbackBounds(anaesthetistId: string): { firstISO: string; lastISO: string } {
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  return useMemo(() => lookbackBoundsFor({ schedule, clock, appSettings }, anaesthetistId), [schedule, clock, appSettings, anaesthetistId])
}

/**
 * The field's own text, kept in step with the URL's `?q=` (catch-up Phase 38a).
 * The router writes the URL in a transition, and a controlled input driven
 * straight from a transition loses its caret; so the field types into local
 * state and follows the URL only when it changes from elsewhere (a Clear, a pop).
 */
export function useFieldText(query: string, onQueryChange: (q: string) => void): [string, (v: string) => void] {
  const [text, setText] = useState(query)
  const last = useRef(query)
  useEffect(() => {
    if (query !== last.current) {
      last.current = query
      setText(query)
    }
  }, [query])
  return [
    text,
    (v: string) => {
      last.current = v
      setText(v)
      onQueryChange(v)
    },
  ]
}

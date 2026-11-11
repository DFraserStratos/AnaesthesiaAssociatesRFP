import { useMemo, useState } from 'react'
import { APP_CONFIG } from '../../../../shell/appConfig'
import { useAppStore, type Actor, type AppState } from '../../../../store'
import { isAssignedList } from '../../../../domain/draftLists'
import type { AssignedList } from '../../../../domain/types'

/**
 * The Mobile catalogue's persona and seeded picks. The persona is the one the
 * Mobile app runs as (APP_CONFIG), and every id is read from the store, never
 * typed in. Picks are taken ONCE (on first render) so a row's subject does not
 * jump to another Booking after a demo tap changes the data; components then
 * read the live record by id.
 */

export interface MobilePersona {
  actor: Actor
  anaesthetistId: string
  personaName: string
  initials: string
}

export function useMobilePersona(): MobilePersona {
  const persona = APP_CONFIG.mobile.persona
  const anaesthetistId = persona.anaesthetistId ?? ''
  return useMemo(
    () => ({
      actor: { who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId },
      anaesthetistId,
      personaName: persona.name,
      initials: persona.initials,
    }),
    [persona, anaesthetistId],
  )
}

export interface SeedPicks {
  /** Her own Lists, oldest first. */
  ownListIds: string[]
  /** An ACTIVE List of hers with Bookings, today's if there is one. */
  listId: string | null
  /** An incomplete Booking with a procedure on one of her ACTIVE Lists (no start time stamped, if possible). */
  bookingId: string | null
  procedureId: string | null
}

function pick(state: AppState, anaesthetistId: string): SeedPicks {
  const { lists, bookings, procedures } = state.schedule
  const todayISO = state.clock.todayISO
  const own = Object.values(lists)
    .filter((l): l is AssignedList => isAssignedList(l) && l.anaesthetistId === anaesthetistId)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.id.localeCompare(b.id))
  const bookingsOf = (listId: string) =>
    Object.values(bookings)
      .filter((b) => b.listId === listId && b.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
  const procsOf = (bookingId: string) =>
    Object.values(procedures)
      .filter((p) => p.bookingId === bookingId)
      .sort((a, b) => a.id.localeCompare(b.id))
  const active = own.filter((l) => l.state === 'ACTIVE' && bookingsOf(l.id).length > 0)
  const list = active.find((l) => l.dateISO === todayISO) ?? active.find((l) => l.dateISO >= todayISO) ?? active[0] ?? own[0]
  const candidates = [list, ...active.filter((l) => l !== list)]
    .filter((l): l is AssignedList => l !== undefined && l.state === 'ACTIVE')
    .flatMap((l) => bookingsOf(l.id))
    .filter((b) => !b.completed && procsOf(b.id).length > 0)
  const booking = candidates.find((b) => procsOf(b.id)[0]?.anaestheticStartISO === undefined) ?? candidates[0]
  return {
    ownListIds: own.map((l) => l.id),
    listId: list?.id ?? null,
    bookingId: booking?.id ?? null,
    procedureId: booking !== undefined ? (procsOf(booking.id)[0]?.id ?? null) : null,
  }
}

/** The seeded subjects the rows demonstrate on, taken once from the live store. */
export function useSeedPicks(anaesthetistId: string): SeedPicks {
  const [picks] = useState(() => pick(useAppStore.getState(), anaesthetistId))
  return picks
}

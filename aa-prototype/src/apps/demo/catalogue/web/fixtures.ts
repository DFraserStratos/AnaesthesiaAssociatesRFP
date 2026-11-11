import { useMemo } from 'react'
import { APP_CONFIG } from '../../../../shell/appConfig'
import { isAssignedList } from '../../../../domain/draftLists'
import type { AssignedList, Attachment, Booking } from '../../../../domain/types'
import { movedToMe, useAppStore, useToday, type Actor } from '../../../../store'

/**
 * The seeded records the Web catalogue rows show, picked from the store (never
 * hard-coded ids): the web persona's Lists, Bookings and history. Pure reads.
 */
export interface WebFixtures {
  actor: Actor
  anaesthetistId: string
  personaName: string
  initials: string
  todayISO: string
  /** Her next ACTIVE List holding Bookings (one still to finish when there is one). */
  detailListId: string | undefined
  /** A Booking on that List still to finish, and its first Procedure. */
  capture: { listId: string; bookingId: string; procedureId: string } | undefined
  /** Her latest authorised List (for its invoices). */
  authorisedListId: string | undefined
  /** Her latest earlier day holding a List (the day table). */
  pastDayISO: string | undefined
  /** A patient surname from her Lists, to seed the search examples. */
  searchSeed: string
  /** The Booking with the longest audit trail. */
  historyEntityId: string | undefined
  /** Someone with "Moved to you" notices (the persona when nobody has one). */
  movedToId: string
  /** A few real attachments from the seed. */
  attachments: Attachment[]
}

const byDateSession = (a: AssignedList, b: AssignedList) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session) || a.id.localeCompare(b.id)

export function useWebFixtures(): WebFixtures {
  const persona = APP_CONFIG.web.persona
  const anaesthetistId = persona.anaesthetistId ?? '34821'
  const todayISO = useToday()
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const procedures = useAppStore((s) => s.schedule.procedures)
  const patients = useAppStore((s) => s.masters.patients)
  const audit = useAppStore((s) => s.audit)
  const notifications = useAppStore((s) => s.notifications)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)

  const actor: Actor = useMemo(() => ({ who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }), [persona.name, anaesthetistId])

  const picks = useMemo(() => {
    const mine = Object.values(lists)
      .filter((l): l is AssignedList => isAssignedList(l) && l.anaesthetistId === anaesthetistId)
      .sort(byDateSession)
    const activeOn = new Map<string, Booking[]>()
    for (const b of Object.values(bookings)) {
      if (b.cancellation !== undefined) continue
      const arr = activeOn.get(b.listId)
      if (arr === undefined) activeOn.set(b.listId, [b])
      else arr.push(b)
    }
    const upcomingActive = mine.filter((l) => l.state === 'ACTIVE' && l.dateISO >= todayISO && (activeOn.get(l.id)?.length ?? 0) > 0)
    const withOpenWork = upcomingActive.find((l) => (activeOn.get(l.id) ?? []).some((b) => !b.completed))
    const detail = withOpenWork ?? upcomingActive[0]

    let capture: WebFixtures['capture']
    if (withOpenWork !== undefined) {
      const booking = (activeOn.get(withOpenWork.id) ?? []).filter((b) => !b.completed).sort((a, b) => a.id.localeCompare(b.id))[0]
      const proc = booking !== undefined ? Object.values(procedures).filter((p) => p.bookingId === booking.id).sort((a, b) => a.id.localeCompare(b.id))[0] : undefined
      if (booking !== undefined && proc !== undefined) capture = { listId: withOpenWork.id, bookingId: booking.id, procedureId: proc.id }
    }

    const authorised = [...mine].reverse().find((l) => l.state === 'AUTHORISED')
    const pastDay = [...mine].reverse().find((l) => l.dateISO < todayISO)?.dateISO

    const firstBooking = detail !== undefined ? (activeOn.get(detail.id) ?? [])[0] : undefined
    const patientName = firstBooking !== undefined ? (patients[firstBooking.patientId]?.name ?? '') : ''
    const searchSeed = patientName.split(' ').filter((w) => w !== '').pop() ?? ''

    const counts = new Map<string, number>()
    for (const a of audit) if (a.entityType === 'booking') counts.set(a.entityId, (counts.get(a.entityId) ?? 0) + 1)
    let historyEntityId: string | undefined
    let best = 0
    for (const [id, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (n > best) {
        best = n
        historyEntityId = id
      }
    }

    const movedToId =
      Object.keys(anaesthetists)
        .sort()
        .find((id) => movedToMe({ notifications }, id, todayISO).length > 0) ?? anaesthetistId

    const attachments: Attachment[] = []
    for (const l of mine) for (const a of l.attachments ?? []) attachments.push(a)
    for (const b of Object.values(bookings).sort((x, y) => x.id.localeCompare(y.id))) for (const a of b.attachments) attachments.push(a)

    return {
      detailListId: detail?.id,
      capture,
      authorisedListId: authorised?.id,
      pastDayISO: pastDay,
      searchSeed,
      historyEntityId: historyEntityId ?? capture?.bookingId,
      movedToId,
      attachments: attachments.slice(0, 3),
    }
  }, [lists, bookings, procedures, patients, audit, notifications, anaesthetists, anaesthetistId, todayISO])

  return { actor, anaesthetistId, personaName: persona.name, initials: persona.initials, todayISO, ...picks }
}

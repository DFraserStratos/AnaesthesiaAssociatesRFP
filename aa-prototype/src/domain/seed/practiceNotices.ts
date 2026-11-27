/**
 * The practice's morning in the shared notification pool (FT-13.8): nine notices the 71 generated colleagues
 * posted before the office came in, so the Admin Day rail's Notifications tab and the Notifications page show
 * what the pool looks like on an ordinary day. Seven are active (more than one page) and two the office has
 * already resolved, one of each kind among them: Lists returned to the office, Lists handed on to a colleague
 * (one when marking the session not available), a single Booking moved with "Tell the office", and alerts on
 * a List and on a Booking.
 *
 * Pure, and the store is never imported (the practice is built while the store is created). Each notice is
 * written with what its action leaves behind, as the store's own actions write it: a returned List becomes a
 * Draft List and its session Unavailable; the audit carries the move's `list.ownerMove`,
 * `booking.movedToAnaesthetist`, `notification.alert` and `notification.resolve` events, with the
 * `notificationId` the update email reads; the Booking move makes its new List and re-points the Booking. A
 * hand-on is told from what the practice already holds: the List is the receiver's now, and the mover's
 * session is left as it was vacated.
 *
 * Only generated colleagues and their Lists from tomorrow on, never the scripted cast, a scripted List or
 * session, or a List with a conflict, so no demo beat changes.
 */

import { addDaysISO } from '../clock'
import { isActiveOn } from '../anaesthetistStatus'
import { draftFromActive } from '../draftLists'
import { instanceKey } from '../availabilitySeries'
import { originForNewList } from '../lists/listOrigin'
import { surnameCommaInitial } from '../names'
import { compareSessions } from '../outOfHours'
import { slotIdFor } from '../slots'
import { SEED_STATUS } from '../slotStatus'
import type { Anaesthetist, AssignedList, AuditEntry, AvailabilitySeries, Booking, List, Notification, Patient, Slot } from '../types'
import { SCRIPTED_BEAT_SCHEDULE } from './index'

export interface PracticeNoticesInput {
  masters: { anaesthetists: Record<string, Anaesthetist>; patients: Record<string, Patient> }
  schedule: {
    slots: Record<string, Slot>
    lists: Record<string, List>
    bookings: Record<string, Booking>
    availabilitySeries: Record<string, AvailabilitySeries>
  }
  notifications: Record<string, Notification>
  audit: AuditEntry[]
  counters: Record<string, number>
}

/** The office users who resolved the two older notices (the store's `OFFICE_ACTOR` and `SECOND_OFFICE_ACTOR`). */
const OFFICE_WHO = { kirsty: 'Kirsty W.', sam: 'Sam T.' } as const

const ID_FORMAT: Record<'notification' | 'audit' | 'list', { prefix: string; pad: number }> = {
  list: { prefix: 'LG', pad: 4 },
  notification: { prefix: 'NT', pad: 4 },
  audit: { prefix: 'A', pad: 4 },
}

type Step =
  | { kind: 'returned'; at: string; fromDays: number; message?: string; resolved?: { at: string; by: string } }
  | { kind: 'handedOn'; at: string; fromDays: number; message?: string; unavailableNote?: string }
  | { kind: 'bookingMoved'; at: string; fromDays: number; message?: string }
  | { kind: 'alertList'; at: string; fromDays: number; note: string; resolved?: { at: string; by: string } }
  | { kind: 'alertBooking'; at: string; fromDays: number; note: string }

/**
 * The morning, oldest first: when each was posted (HH:MM today, before the 08:00 demo clock) and how far ahead its
 * List is. A returned List is more than four weeks out, so the scripted Draft Lists stay the soonest.
 */
const MORNING: readonly Step[] = [
  { kind: 'returned', at: '05:41', fromDays: 31, message: 'Away at a conference that week, sorry.', resolved: { at: '07:31', by: OFFICE_WHO.kirsty } },
  { kind: 'returned', at: '05:52', fromDays: 29, message: 'A family commitment has come up that day. Sorry!' },
  { kind: 'alertList', at: '06:03', fromDays: 6, note: 'Theatre has this List starting at 07:00. It is usually 08:00 here. Can you confirm?', resolved: { at: '07:46', by: OFFICE_WHO.sam } },
  { kind: 'handedOn', at: '06:14', fromDays: 4, message: 'We have agreed this between us. Thanks!' },
  { kind: 'bookingMoved', at: '06:31', fromDays: 3, message: 'The surgery moved to the afternoon, so I have passed it on.' },
  { kind: 'alertBooking', at: '06:48', fromDays: 5, note: 'Patient says their insurer has not approved this yet. Can you check before the day?' },
  { kind: 'handedOn', at: '07:05', fromDays: 1, message: 'Not feeling well, so I have arranged cover for tomorrow.', unavailableNote: 'Unwell' },
  { kind: 'alertList', at: '07:22', fromDays: 8, note: 'The surgeon rang to add two more cases. Can you check with theatre that the List can run late?' },
  { kind: 'returned', at: '07:40', fromDays: 44 },
]

/**
 * The practice with its morning's notices. `castIds` are the scripted cast's anaesthetists (the core seed's),
 * left out. Returns the input unchanged if a step finds nothing that fits (never throws on a thin practice).
 */
export function withPracticeNotices<S extends PracticeNoticesInput>(base: S, castIds: ReadonlySet<string>, todayISO: string): S {
  const counters = { ...base.counters }
  const nextId = (kind: 'notification' | 'audit' | 'list'): string => {
    const n = counters[kind] ?? 1
    counters[kind] = n + 1
    return `${ID_FORMAT[kind].prefix}${String(n).padStart(ID_FORMAT[kind].pad, '0')}`
  }
  const lists = { ...base.schedule.lists }
  const bookings = { ...base.schedule.bookings }
  const slots = { ...base.schedule.slots }
  const series = { ...base.schedule.availabilitySeries }
  const notifications = { ...base.notifications }
  const audit: AuditEntry[] = []
  const scriptedLists = new Set<string>(SCRIPTED_BEAT_SCHEDULE.listIds)
  const scriptedSlots = new Set<string>(SCRIPTED_BEAT_SCHEDULE.slotIds)
  const used = new Set<string>()

  const generated = Object.values(base.masters.anaesthetists)
    .filter((a) => !castIds.has(a.registrationNumber))
    .sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber))
  const generatedIds = new Set(generated.map((a) => a.registrationNumber))
  const occupied = new Set<string>()
  for (const l of Object.values(lists)) if (l.state !== 'DRAFT' && l.removedAtISO === undefined) occupied.add(l.slotId)
  const bookingsByList = new Map<string, Booking[]>()
  for (const b of Object.values(base.schedule.bookings).sort((a, b) => a.id.localeCompare(b.id))) {
    if (b.cancellation !== undefined) continue
    bookingsByList.set(b.listId, [...(bookingsByList.get(b.listId) ?? []), b])
  }

  /** Generated colleagues' ACTIVE Lists from `fromISO` on, date then session then id, none used yet (with a Booking unless `test` says). */
  const hasBookings = (l: AssignedList): boolean => (bookingsByList.get(l.id)?.length ?? 0) > 0
  const candidates = (fromISO: string, test: (l: AssignedList) => boolean = hasBookings): AssignedList[] =>
    Object.values(lists)
      .filter((l): l is AssignedList => l.state === 'ACTIVE')
      .filter((l) => l.dateISO >= fromISO && l.removedAtISO === undefined && l.conflicts.length === 0)
      .filter((l) => generatedIds.has(l.anaesthetistId) && !used.has(l.anaesthetistId) && !scriptedLists.has(l.id) && !scriptedSlots.has(l.slotId))
      .filter((l) => isActiveOn(base.masters.anaesthetists[l.anaesthetistId]!, l.dateISO))
      .filter((l) => slots[l.slotId] !== undefined && test(l))
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || compareSessions(a, b) || a.id.localeCompare(b.id))

  /** A generated colleague (not the List's holder, none used) whose session at the List's day and time is Free and empty. */
  const freeColleague = (list: AssignedList): { anaesthetist: Anaesthetist; slot: Slot } | undefined => {
    for (const a of generated) {
      if (a.registrationNumber === list.anaesthetistId || used.has(a.registrationNumber) || !isActiveOn(a, list.dateISO)) continue
      const slot = slots[slotIdFor(a.registrationNumber, list.dateISO, list.session)]
      if (slot === undefined || slot.status !== SEED_STATUS.free || occupied.has(slot.id) || scriptedSlots.has(slot.id)) continue
      return { anaesthetist: a, slot }
    }
    return undefined
  }

  const snapshot = (list: List) => ({ dateISO: list.dateISO, session: list.session, hospitalId: list.hospitalId, surgeonId: list.surgeonId })

  const event = (atISO: string, who: string, role: AuditEntry['role'], e: Pick<AuditEntry, 'entityType' | 'entityId' | 'action'> & Partial<Pick<AuditEntry, 'before' | 'after'>>): void => {
    audit.push({ id: nextId('audit'), who, role, source: role === 'office' ? 'office' : 'anaesthetist', atISO, ...e })
  }

  /** What `vacateSlot` leaves: the new status (and note), no times or series, the series' exception kept. */
  const vacate = (slot: Slot, status: string, atISO: string, who: string, note?: string): void => {
    const next: Slot = { ...slot, status }
    delete next.startTime
    delete next.endTime
    delete next.seriesId
    if (note !== undefined) next.note = note
    slots[slot.id] = next
    const s = slot.seriesId !== undefined ? series[slot.seriesId] : undefined
    if (s !== undefined) {
      series[s.id] = { ...s, exceptions: { ...s.exceptions, [instanceKey(slot.dateISO, slot.session)]: { kind: 'edited', statusKey: status, ...(note !== undefined ? { note } : {}) } } }
    }
    if (status !== slot.status || note !== undefined) {
      event(atISO, who, 'anaesthetist', {
        entityType: 'session',
        entityId: slot.id,
        action: 'session.status',
        before: { status: slot.status, ...(slot.note !== undefined ? { note: slot.note } : {}) },
        after: { status, ...(note !== undefined ? { note } : {}) },
      })
    }
  }

  const post = (record: Omit<Notification, 'id'>): string => {
    const id = nextId('notification')
    notifications[id] = { id, ...record }
    return id
  }

  const resolve = (id: string, at: { at: string; by: string }): void => {
    const n = notifications[id]!
    const resolvedAt = `${todayISO}T${at.at}:00`
    notifications[id] = { ...n, resolvedAt, resolvedBy: at.by }
    event(resolvedAt, at.by, 'office', {
      entityType: 'notification',
      entityId: id,
      action: 'notification.resolve',
      before: { resolvedAt: null, resolvedBy: null },
      after: { resolvedAt, resolvedBy: at.by, kind: n.kind, listId: n.listId, ...(n.bookingId !== undefined ? { bookingId: n.bookingId } : {}) },
    })
  }

  for (const step of MORNING) {
    const atISO = `${todayISO}T${step.at}:00`
    const fromISO = addDaysISO(todayISO, step.fromDays)

    if (step.kind === 'returned') {
      // A List that far out may have no Bookings yet.
      const list = candidates(fromISO, () => true)[0]
      if (list === undefined) continue
      const mover = base.masters.anaesthetists[list.anaesthetistId]!
      used.add(mover.registrationNumber)
      lists[list.id] = draftFromActive(list, { origin: 'movedToOffice', by: mover.name, atISO, fromAnaesthetistId: mover.registrationNumber })
      occupied.delete(list.slotId)
      const id = post({ atISO, kind: 'listMoved', byActor: mover.name, listId: list.id, route: 'office', cause: 'move', fromAnaesthetistId: mover.registrationNumber, ...snapshot(list), ...(step.message !== undefined ? { message: step.message } : {}) })
      event(atISO, mover.name, 'anaesthetist', {
        entityType: 'list',
        entityId: list.id,
        action: 'list.ownerMove',
        before: { slotId: list.slotId, anaesthetistId: mover.registrationNumber, state: 'ACTIVE' },
        after: { slotId: null, anaesthetistId: null, state: 'DRAFT', route: 'office', cause: 'move', notificationId: id },
      })
      vacate(slots[list.slotId]!, SEED_STATUS.unavailable, atISO, mover.name)
      if (step.resolved !== undefined) resolve(id, step.resolved)
      continue
    }

    if (step.kind === 'handedOn') {
      // The List is the receiver's already; the mover is a colleague whose session then was Free and empty.
      let found: { list: AssignedList; mover: Anaesthetist; slot: Slot } | undefined
      for (const list of candidates(fromISO)) {
        const free = freeColleague(list)
        if (free !== undefined) {
          found = { list, mover: free.anaesthetist, slot: free.slot }
          break
        }
      }
      if (found === undefined) continue
      const { list, mover, slot } = found
      used.add(mover.registrationNumber)
      used.add(list.anaesthetistId)
      const cause = step.unavailableNote !== undefined ? 'unavailable' : 'move'
      const id = post({ atISO, kind: 'listMoved', byActor: mover.name, listId: list.id, route: 'colleague', cause, fromAnaesthetistId: mover.registrationNumber, toAnaesthetistId: list.anaesthetistId, ...snapshot(list), ...(step.message !== undefined ? { message: step.message } : {}) })
      event(atISO, mover.name, 'anaesthetist', {
        entityType: 'list',
        entityId: list.id,
        action: 'list.ownerMove',
        before: { slotId: slot.id, anaesthetistId: mover.registrationNumber, state: 'ACTIVE' },
        after: { slotId: list.slotId, anaesthetistId: list.anaesthetistId, state: 'ACTIVE', route: 'colleague', cause, notificationId: id },
      })
      if (step.unavailableNote !== undefined) vacate(slot, SEED_STATUS.unavailable, atISO, mover.name, step.unavailableNote)
      continue
    }

    if (step.kind === 'bookingMoved') {
      // As `moveBookingToAnaesthetist` does it: a new List in a free colleague's empty session at the same day and
      // time, derived from the source List, and the Booking re-pointed to it.
      let found: { source: AssignedList; booking: Booking; receiver: Anaesthetist; slot: Slot } | undefined
      for (const source of candidates(fromISO, (l) => (bookingsByList.get(l.id)?.length ?? 0) > 1)) {
        const free = freeColleague(source)
        if (free !== undefined) {
          found = { source, booking: bookingsByList.get(source.id)![0]!, receiver: free.anaesthetist, slot: free.slot }
          break
        }
      }
      if (found === undefined) continue
      const { source, booking, receiver, slot } = found
      const mover = base.masters.anaesthetists[source.anaesthetistId]!
      used.add(mover.registrationNumber)
      used.add(receiver.registrationNumber)
      const created: AssignedList = {
        id: nextId('list'),
        slotId: slot.id,
        dateISO: slot.dateISO,
        anaesthetistId: receiver.registrationNumber,
        session: slot.session,
        state: 'ACTIVE',
        kind: source.kind,
        hospitalId: source.hospitalId,
        surgeonId: source.surgeonId,
        conflicts: [],
        origin: originForNewList({ kind: 'derived', from: source }),
      }
      if (lists[created.id] !== undefined) throw new Error(`withPracticeNotices would overwrite List ${created.id}`)
      lists[created.id] = created
      occupied.add(slot.id)
      bookings[booking.id] = { ...booking, listId: created.id, lastModifiedBy: mover.name, lastModifiedAtISO: atISO }
      event(atISO, mover.name, 'anaesthetist', {
        entityType: 'list',
        entityId: created.id,
        action: 'list.create',
        after: { state: 'ACTIVE', slotId: slot.id, kind: created.kind, hospitalId: created.hospitalId, surgeonId: created.surgeonId, origin: created.origin },
      })
      const patient = base.masters.patients[booking.patientId]
      const id = post({
        atISO,
        kind: 'bookingMoved',
        byActor: mover.name,
        listId: created.id,
        bookingId: booking.id,
        ...(patient !== undefined ? { patientName: surnameCommaInitial(patient.name) } : {}),
        route: 'colleague',
        cause: 'move',
        fromAnaesthetistId: mover.registrationNumber,
        toAnaesthetistId: receiver.registrationNumber,
        ...snapshot(source),
        ...(step.message !== undefined ? { message: step.message } : {}),
      })
      event(atISO, mover.name, 'anaesthetist', {
        entityType: 'booking',
        entityId: booking.id,
        action: 'booking.movedToAnaesthetist',
        before: { listId: source.id, anaesthetistId: mover.registrationNumber },
        after: { listId: created.id, anaesthetistId: receiver.registrationNumber, createdListId: created.id, ...(step.message !== undefined ? { message: step.message } : {}), notificationId: id },
      })
      continue
    }

    // An alert on a List, or on the first Booking of one.
    const list = candidates(fromISO)[0]
    if (list === undefined) continue
    const raiser = base.masters.anaesthetists[list.anaesthetistId]!
    used.add(raiser.registrationNumber)
    const booking = step.kind === 'alertBooking' ? bookingsByList.get(list.id)![0]! : undefined
    const patient = booking !== undefined ? base.masters.patients[booking.patientId] : undefined
    const id = post({
      atISO,
      kind: 'officeAlert',
      byActor: raiser.name,
      listId: list.id,
      ...(booking !== undefined ? { bookingId: booking.id } : {}),
      ...(patient !== undefined ? { patientName: surnameCommaInitial(patient.name) } : {}),
      fromAnaesthetistId: raiser.registrationNumber,
      ...snapshot(list),
      message: step.note,
    })
    event(atISO, raiser.name, 'anaesthetist', {
      entityType: booking !== undefined ? 'booking' : 'list',
      entityId: booking?.id ?? list.id,
      action: 'notification.alert',
      after: { notificationId: id, listId: list.id, ...(booking !== undefined ? { bookingId: booking.id } : {}), note: step.note },
    })
    if (step.kind === 'alertList' && step.resolved !== undefined) resolve(id, step.resolved)
  }

  if (audit.length === 0) return base
  return {
    ...base,
    schedule: { ...base.schedule, lists, bookings, slots, availabilitySeries: series },
    notifications,
    audit: [...base.audit, ...audit],
    counters,
  }
}

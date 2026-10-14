import { useMemo } from 'react'
import { isMovableByOwner, movableListsFor, pushTargets, type ListMoveInput } from '../../domain/listMoves'
import { addDaysISO } from '../../domain/clock'
import type { AssignedList, Notification, Session } from '../../domain/types'
import { movedToMe, movedToMeForList, useAppStore, useToday } from '../../store'

/** The slices a move reads, memoised on exactly those four (not every schedule edit). */
export function useMoveInput(): ListMoveInput {
  const lists = useAppStore((s) => s.schedule.lists)
  const slots = useAppStore((s) => s.schedule.slots)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  return useMemo(() => ({ lists, slots, anaesthetists, slotStatuses }), [lists, slots, anaesthetists, slotStatuses])
}

/** Her movable List in one session, and the colleague sessions it could go into (the receive rule). */
export interface MovableSession {
  list: AssignedList
  targetSlotIds: ReadonlySet<string>
}

/** The key the targets map uses: `2026-07-27-PM`. */
export const sessionKey = (dateISO: string, session: Session) => `${dateISO}-${session}`

/**
 * The persona's movable Lists from `fromISO` to `untilISO`, keyed by day and
 * session (catch-up Phase 32): what the availability views and the web
 * dashboard offer "Move" on, and which colleagues' free sessions may be
 * tapped to move one straight into them. Availability only: no preference.
 */
export function useMoveTargets(anaesthetistId: string, fromISO: string, untilISO: string): ReadonlyMap<string, MovableSession> {
  const input = useMoveInput()
  const todayISO = useToday()
  return useMemo(() => {
    const out = new Map<string, MovableSession>()
    const start = fromISO > todayISO ? fromISO : todayISO
    for (const list of movableListsFor(input, anaesthetistId, start, untilISO)) {
      if (list.dateISO < fromISO) continue
      out.set(sessionKey(list.dateISO, list.session), { list, targetSlotIds: new Set(pushTargets(input, list.id).map((t) => t.slotId)) })
    }
    return out
  }, [input, anaesthetistId, fromISO, untilISO, todayISO])
}

/** One day's movable sessions (the availability views). */
export function useMovableSessions(anaesthetistId: string, dateISO: string): Partial<Record<Session, MovableSession>> {
  const targets = useMoveTargets(anaesthetistId, dateISO, dateISO)
  return useMemo(() => {
    const am = targets.get(sessionKey(dateISO, 'AM'))
    const pm = targets.get(sessionKey(dateISO, 'PM'))
    return { ...(am !== undefined ? { AM: am } : {}), ...(pm !== undefined ? { PM: pm } : {}) }
  }, [targets, dateISO])
}

/** Whether one List is hers to move now (List detail's "Move this List"). */
export function useIsMovable(listId: string, anaesthetistId: string | undefined): boolean {
  const lists = useAppStore((s) => s.schedule.lists)
  const todayISO = useToday()
  return useMemo(
    () => anaesthetistId !== undefined && isMovableByOwner({ lists }, listId, anaesthetistId, todayISO),
    [lists, listId, anaesthetistId, todayISO],
  )
}

/** Her movable Lists from today for the next `days` days (the web dashboard's "Move a List" picker). */
export function useMovableLists(anaesthetistId: string, days = 6): AssignedList[] {
  const lists = useAppStore((s) => s.schedule.lists)
  const todayISO = useToday()
  return useMemo(() => movableListsFor({ lists }, anaesthetistId, todayISO, addDaysISO(todayISO, days)), [lists, anaesthetistId, todayISO, days])
}

/** Lists colleagues moved to her in the notice window, newest first (US-01.4.3 AC2), from the shared pool's records. */
export function useMovedToMe(anaesthetistId: string): Notification[] {
  const notifications = useAppStore((s) => s.notifications)
  const todayISO = useToday()
  return useMemo(() => movedToMe({ notifications }, anaesthetistId, todayISO), [notifications, anaesthetistId, todayISO])
}

/** The notice for one List a colleague moved to her, inside the window (List detail's "Moved to you by"), and who moved it. */
export function useMovedToMeNotice(listId: string, anaesthetistId: string | undefined): { notification: Notification; fromName: string | undefined } | undefined {
  const notifications = useAppStore((s) => s.notifications)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const todayISO = useToday()
  return useMemo(() => {
    if (anaesthetistId === undefined) return undefined
    const n = movedToMeForList({ notifications }, anaesthetistId, listId, todayISO)
    return n === undefined ? undefined : { notification: n, fromName: anaesthetists[n.fromAnaesthetistId]?.name }
  }, [notifications, anaesthetists, anaesthetistId, listId, todayISO])
}

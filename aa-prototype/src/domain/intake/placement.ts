/**
 * Where a new List can go (build plan Phase 68; DM-19, US-02.1.2, US-01.3.3). Pure: it reads the matcher's view.
 *
 * Placing a new List in a free Slot is the manual assignment act. The options, in order: the free Slot of the
 * anaesthetist the sender named, at that date and session (suggested); the other free Slots at that date and
 * session, then the same day's other sessions; the existing Lists that could take it; and a Draft List, always
 * possible. A Slot's openness is the matcher's reading (`MatchingView.openSlots`, read through `openSlotsForRow`),
 * the same one the assign flows use: never re-derived here.
 */

import type { IncomingBookingFields, Session } from '../types'
import type { MatchingList, MatchingSlot, MatchingView } from './matching'
import { listsForRow, openSlotsForRow, sessionLabel } from './matching'
import { titledSurname } from '../names'

/** Where the List would be: its hospital, day and session, and the surgeon when known. */
export interface PlacementAt {
  hospitalId: string
  dateISO: string
  session: Session
  surgeonId?: string
}

export interface PlacementOptions {
  /** The named anaesthetist's free Slot at that date and session. */
  suggested?: MatchingSlot
  /** The other free Slots: that date and session first, then the same day's other sessions. */
  otherSlots: MatchingSlot[]
  /** Existing Lists that could take it (`listsForRow`). */
  lists: MatchingList[]
  /** The Draft List's fields, if the office places it as a Draft List. */
  draft: PlacementAt
}

const SESSIONS: readonly Session[] = ['AM', 'PM', 'OOH']

/** The row-shaped fields the matcher's readers take (only the hospital, day and session are read). */
function fieldsAt(at: PlacementAt, session: Session = at.session): IncomingBookingFields {
  return { hospitalId: at.hospitalId, dateISO: at.dateISO, session, patient: { name: '' }, hospitalStatus: 'booked' }
}

/** The placement options for a new List at `at`, suggesting the named anaesthetist's free Slot first. */
export function placementOptions(
  view: Pick<MatchingView, 'openSlots' | 'lists'>,
  at: PlacementAt,
  namedAnaesthetistId?: string,
): PlacementOptions {
  const sameSession = openSlotsForRow(view, fieldsAt(at))
  const suggested = namedAnaesthetistId !== undefined ? sameSession.find((s) => s.anaesthetistId === namedAnaesthetistId) : undefined
  const otherSessions = SESSIONS.filter((s) => s !== at.session).flatMap((s) => openSlotsForRow(view, fieldsAt(at, s)))
  const otherSlots = [...sameSession, ...otherSessions].filter((s) => s.id !== suggested?.id)
  const draft: PlacementAt = { hospitalId: at.hospitalId, dateISO: at.dateISO, session: at.session, ...(at.surgeonId !== undefined ? { surgeonId: at.surgeonId } : {}) }
  return { ...(suggested !== undefined ? { suggested } : {}), otherSlots, lists: listsForRow(view, fieldsAt(at)), draft }
}

/**
 * A free Slot in words: "Dr Rutherford's AM, free", or with its day ("Dr Rutherford's Wed 25 Nov AM, free") when
 * it is not on the day being placed.
 */
export function placementSlotLabel(
  slot: Pick<MatchingSlot, 'anaesthetistId' | 'dateISO' | 'session'>,
  anaesthetists: Readonly<Record<string, { name: string }>>,
  options?: { withDay?: boolean },
): string {
  const name = anaesthetists[slot.anaesthetistId]?.name
  const who = name !== undefined ? titledSurname(name) : 'An anaesthetist'
  const when = options?.withDay === true ? sessionLabel(slot.dateISO, slot.session) : slot.session === 'OOH' ? 'Out-of-hours' : slot.session
  return `${who}'s ${when}, free`
}

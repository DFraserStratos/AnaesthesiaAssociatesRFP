import { useOutletContext } from 'react-router-dom'
import type { Anaesthetist, DayNote, DraftList } from '../../domain/types'
import type { Actor, AppState, ListWarningSummary, OpenWarningRow, SlotView } from '../../store'
import type { SortMode } from './components/DayNav'

interface ReviewRow {
  listId: string
  title: string
  sub: string
}

/** What the routed admin screens read from the `AdminApp` layout. */
export interface AdminOutletContext {
  actor: Actor
  todayISO: string
  /** The day the day view is on: the `:dateISO` segment, remembered while the
   *  office is off in another section so "Day view" returns where it left. */
  selectedDate: string
  sortMode: SortMode
  /** The roster for the selected day (`rosterForDate`), in the chosen row order. */
  anaesthetists: Anaesthetist[]
  /** The selected day's sessions per anaesthetist (catch-up Phase 28). */
  viewsByAnaesthetist: Record<string, SlotView[]>
  /** The schedule horizon's last day (the setting, FT-01.1): the date picker's bound. */
  horizonEndISO: string
  masters: AppState['masters']
  /** Open warnings per List on the selected date (the day grid outline). */
  warningFlags: ReadonlyMap<string, ListWarningSummary>
  /** Every open warning, all dates (the To-do card, US-13.7.2). */
  todoRows: OpenWarningRow[]
  summary: string
  notes: DayNote[]
  reviewRows: ReviewRow[]
  /** Width reserved by the harness' vertical scrollbar, or zero for overlay scrollbars. */
  shellScrollbarWidth: number
  /** Open the session drawer (a Slot id), a transient overlay, not a route. */
  onSelectSlot: (slotId: string) => void
  /** The session open in the drawer, if any (Find available starts on its session). */
  selectedSlotId: string | null
  /** Open a session's drawer straight on Assign List, with a surgeon already chosen (Find available). */
  onAssignFromFinder: (slotId: string, surgeonId: string | undefined) => void
  onAddNote: (text: string, flagged: boolean) => void
  /** The selected day's live Draft Lists, in the one order (the Day grid's band; catch-up Phase 31). */
  dayDraftLists: readonly DraftList[]
  /** Active Bookings per List id (every block's count, the band, the rail card). */
  bookingCounts: ReadonlyMap<string, number>
  /** Open a Draft List's drawer (it has no session). */
  onOpenDraftList: (listId: string) => void
  /** Open an assigned List on its day in the session drawer. */
  onOpenList: (listId: string) => void
}

export function useAdminOutlet(): AdminOutletContext {
  return useOutletContext<AdminOutletContext>()
}

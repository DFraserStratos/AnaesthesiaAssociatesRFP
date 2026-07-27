import { useOutletContext } from 'react-router-dom'
import type { Anaesthetist, DayNote, List } from '../../domain/types'
import type { Actor, AppState } from '../../store'
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
  anaesthetists: Anaesthetist[]
  listsByAnaesthetist: Record<string, List[]>
  masters: AppState['masters']
  activeCardCounts: Record<string, number>
  prepaymentFlags: Map<string, 'outstanding' | 'overridden'>
  summary: string
  notes: DayNote[]
  reviewRows: ReviewRow[]
  /** Width reserved by the harness' vertical scrollbar, or zero for overlay scrollbars. */
  shellScrollbarWidth: number
  /** Open the List drawer — a transient overlay, not a route. */
  onSelectList: (listId: string) => void
  onAddNote: (text: string, flagged: boolean) => void
}

export function useAdminOutlet(): AdminOutletContext {
  return useOutletContext<AdminOutletContext>()
}

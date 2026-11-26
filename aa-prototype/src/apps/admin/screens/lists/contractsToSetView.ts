/**
 * Lists › Contracts to set, as rows (US-04.3.12; US-13.1.3): the pure view model the tab renders.
 * One item per List with Procedures still needing a Contract, any date, from `listsNeedingContracts`
 * (the Day rail's selector), with the names and words a row shows; the toolbar's search, When and
 * Hospital filters; the two groups (past Lists first, holding up submission, then the rest soonest
 * first); and the result count. Only a missing Contract puts a List here: RVG codes, times and
 * modifiers never appear. The demo clock's day, never the machine's.
 */

import { addDaysISO } from '../../../../domain/clock'
import type { List } from '../../../../domain/types'
import { sessionText } from '../../../../domain/outOfHours'
import { matchesNameQuery } from '../../../../domain/names'
import { drSurname, locationName, shortDay } from '../../../../shared/format'
import type { AppState } from '../../../../store/appStore'
import { listsNeedingContracts } from './listsCounts'

/** The slices the rows read. */
export type ContractsToSetState = Pick<AppState, 'masters' | 'schedule' | 'clock'>

/** The When filter: every date (default), past Lists only, or the next two weeks from the demo day. */
export type ContractsWhen = 'any' | 'past' | 'next2w'

/** Days ahead "Next 2 weeks" reaches, the demo day included. */
export const NEXT_WEEKS_DAYS = 14

export const CONTRACTS_WHEN_OPTIONS: readonly { value: ContractsWhen; label: string }[] = [
  { value: 'any', label: 'Any date' },
  { value: 'past', label: 'Past only' },
  { value: 'next2w', label: 'Next 2 weeks' },
]

/** The tab's URL state and its defaults (a module constant, so `useListParams` keeps its identity). */
export const CONTRACTS_TO_SET_DEFAULTS = { q: '', when: 'any', hospital: 'all' } as const

/** Lists a page holds before the pager shows. */
export const CONTRACTS_TO_SET_PAGE_SIZE = 25

export function parseContractsWhen(value: string): ContractsWhen {
  return value === 'past' || value === 'next2w' ? value : 'any'
}

/** How far a Procedure still to set has got: nothing chosen, or where the invoice goes chosen with the Contract to pick. */
export type ContractStage = 'nothing' | 'partWay'

export interface ContractsToSetProcedure {
  bookingId: string
  procedureId: string
  patientName: string
  stage: ContractStage
  /** "Nothing chosen", or the answers so far with the Contract still to pick ("Patient › Standard · Contract to pick"). */
  progressText: string
  /** Prepaid is the answer so far (Patient › Prepaid): the prepayment can't go out until the Contract is set. */
  prepaid: boolean
}

export interface ContractsToSetNote {
  tone: 'error' | 'warning'
  text: string
  /** A stable hook for tests and capture. */
  kind: 'holdsSubmission' | 'prepaid'
}

export interface ContractsToSetItem {
  listId: string
  dateISO: string
  session: List['session']
  /** The List's day is before the demo day: it holds up submission. */
  past: boolean
  /** "Mon 23 Nov" */
  dayText: string
  /** "AM", "PM", "Full day" ... */
  sessionLabel: string
  anaesthetistName: string
  surgeonName: string
  hospitalId: string
  hospitalName: string
  set: number
  total: number
  procedures: ContractsToSetProcedure[]
  /** Procedures with nothing chosen yet, and those part way. */
  nothingChosen: number
  partWay: number
  notes: ContractsToSetNote[]
}

export const NOTHING_CHOSEN = 'Nothing chosen'
export const CONTRACT_TO_PICK = 'Contract to pick'
export const HOLDS_SUBMISSION = "Can't be submitted until set"

/** Every List still needing Contracts, any date, past ones first then soonest first (the selector's order). */
export function contractsToSetItems(state: ContractsToSetState): ContractsToSetItem[] {
  const { masters, schedule } = state
  return listsNeedingContracts(state).map((r) => {
    const list = schedule.lists[r.listId]
    const surgeonId = list?.surgeonId
    const anae = masters.anaesthetists[r.anaesthetistId]
    const procedures: ContractsToSetProcedure[] = r.toSet.map((p) => {
      const answers = schedule.procedures[p.procedureId]?.railAnswers
      const prepaid = p.started && answers?.destination === 'patient' && answers.narrow === 'prepaid'
      return {
        bookingId: p.bookingId,
        procedureId: p.procedureId,
        patientName: p.patientName,
        stage: p.started ? 'partWay' : 'nothing',
        progressText: p.started ? `${p.answersText} · ${CONTRACT_TO_PICK}` : NOTHING_CHOSEN,
        prepaid,
      }
    })
    const notes: ContractsToSetNote[] = []
    if (r.past) notes.push({ tone: 'error', text: HOLDS_SUBMISSION, kind: 'holdsSubmission' })
    const prepaid = procedures.filter((p) => p.prepaid).length
    if (prepaid > 0) notes.push({ tone: 'warning', text: prepaid === 1 ? 'Prepaid chosen, Contract to pick' : `${prepaid} prepaid, Contracts to pick`, kind: 'prepaid' })
    return {
      listId: r.listId,
      dateISO: r.dateISO,
      session: r.session,
      past: r.past,
      dayText: shortDay(r.dateISO),
      sessionLabel: sessionText(r.session),
      anaesthetistName: anae !== undefined ? drSurname(anae.name) : r.anaesthetistId,
      surgeonName: surgeonId !== undefined ? (masters.surgeons[surgeonId]?.name ?? surgeonId) : '',
      hospitalId: r.hospitalId,
      hospitalName: locationName(r.hospitalId, masters.hospitals),
      set: r.set,
      total: r.total,
      procedures,
      nothingChosen: procedures.filter((p) => p.stage === 'nothing').length,
      partWay: procedures.filter((p) => p.stage === 'partWay').length,
      notes,
    }
  })
}

export interface ContractsToSetFilters {
  q: string
  when: ContractsWhen
  /** A hospital id, or 'all'. */
  hospital: string
}

/** Whether a search matches the List's anaesthetist (full name too), surgeon, hospital or a patient still to set. */
function matchesSearch(item: ContractsToSetItem, q: string, fullAnaesthetistName: string): boolean {
  const query = q.trim()
  if (query === '') return true
  const words = [fullAnaesthetistName, item.anaesthetistName, item.surgeonName, item.hospitalName, ...item.procedures.map((p) => p.patientName)]
  return words.some((w) => w !== '' && matchesNameQuery(w, query))
}

/** The items the toolbar's filters keep, in the same order. */
export function filterContractsToSet(state: ContractsToSetState, items: readonly ContractsToSetItem[], filters: ContractsToSetFilters): ContractsToSetItem[] {
  const today = state.clock.todayISO
  const until = addDaysISO(today, NEXT_WEEKS_DAYS - 1)
  return items.filter((item) => {
    if (filters.when === 'past' && !item.past) return false
    if (filters.when === 'next2w' && (item.dateISO < today || item.dateISO > until)) return false
    if (filters.hospital !== 'all' && item.hospitalId !== filters.hospital) return false
    const list = state.schedule.lists[item.listId]
    const full = list?.anaesthetistId !== undefined ? (state.masters.anaesthetists[list.anaesthetistId]?.name ?? '') : ''
    return matchesSearch(item, filters.q, full)
  })
}

/** The Hospital filter's choices: the hospitals with a List here, by name. */
export function contractsToSetHospitals(items: readonly ContractsToSetItem[]): { id: string; name: string }[] {
  const byId = new Map<string, string>()
  for (const item of items) byId.set(item.hospitalId, item.hospitalName)
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}

export type ContractsToSetGroupKey = 'past' | 'coming'

export const CONTRACTS_TO_SET_GROUP_LABELS: Record<ContractsToSetGroupKey, string> = {
  past: 'Past, holding up submission',
  coming: 'Coming up',
}

export interface ContractsToSetGroup {
  key: ContractsToSetGroupKey
  label: string
  items: ContractsToSetItem[]
}

/** Past Lists first (they hold up submission), then the rest soonest first; empty groups left out. */
export function groupContractsToSet(items: readonly ContractsToSetItem[]): ContractsToSetGroup[] {
  const past = items.filter((i) => i.past)
  const coming = items.filter((i) => !i.past)
  const groups: ContractsToSetGroup[] = []
  if (past.length > 0) groups.push({ key: 'past', label: CONTRACTS_TO_SET_GROUP_LABELS.past, items: past })
  if (coming.length > 0) groups.push({ key: 'coming', label: CONTRACTS_TO_SET_GROUP_LABELS.coming, items: coming })
  return groups
}

/** "12 Lists, 23 Procedures" */
export function contractsToSetCountText(items: readonly ContractsToSetItem[]): string {
  const procedures = items.reduce((n, i) => n + i.procedures.length, 0)
  return `${items.length} ${items.length === 1 ? 'List' : 'Lists'}, ${procedures} ${procedures === 1 ? 'Procedure' : 'Procedures'}`
}

/** The short line under a List: "2 with nothing chosen · 1 part way". */
export function contractsToSetStageText(item: Pick<ContractsToSetItem, 'nothingChosen' | 'partWay'>): string {
  const bits: string[] = []
  if (item.nothingChosen > 0) bits.push(`${item.nothingChosen} with nothing chosen`)
  if (item.partWay > 0) bits.push(`${item.partWay} part way`)
  return bits.join(' · ')
}

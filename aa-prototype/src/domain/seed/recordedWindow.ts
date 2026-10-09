/**
 * The seed's placement helpers and its recorded demo window (catch-up Phase 28).
 *
 * The seed is a snapshot of a practice that has been running, so inside one
 * fixed window (2026-07-07 to 2026-08-16, the golden fixture's window) it
 * RECORDS the office's ad hoc assignments and the anaesthetists' marked
 * unavailability. They are drawn with exactly the per-slot draws the old
 * generator made (`slotRng(SEED, 'fill', ...)` on exactly the sessions its RNG
 * branch reached), so the Admin Day grid, S2, every scenario List and every
 * filler Booking read as they always have. This is seeded history, not
 * generation: nothing outside the window, and nothing at runtime, is filled;
 * the generator writes every new Slot free (US-01.1.1).
 */

import { parseISO } from 'date-fns'
import type { HospitalHoliday, List, ListKind, PermanentList, SeedLeaveWindow, Session, Slot, SlotStatusKey, SurgeonId } from '../types'
import { enumerateDatesISO } from '../clock'
import { projectedListId, slotIdFor } from '../slots'
import { closedHospitalConflict } from './canvas'
import { slotRng } from './slotHash'
import { HOSP, SURG } from './cast'

/** The recorded window: the demo's fixed past and near future. */
export const RECORDED_WINDOW = { fromISO: '2026-07-07', toISO: '2026-08-16' } as const

// ---------------------------------------------------------------------------
// Placement helpers (seed only)
// ---------------------------------------------------------------------------

export interface SlotPatch {
  status?: SlotStatusKey
  note?: string | null
  startTime?: string | null
  endTime?: string | null
}

function slotAt(slots: Record<string, Slot>, anaesthetistId: string, dateISO: string, session: Session): Slot {
  const slot = slots[slotIdFor(anaesthetistId, dateISO, session)]
  if (slot === undefined) throw new Error(`fixup references missing session ${anaesthetistId} ${dateISO} ${session}`)
  return slot
}

/** Patch a Slot's status, note or times (`null` clears a field). */
export function setSlot(
  slots: Record<string, Slot>,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  patch: SlotPatch,
): void {
  const next: Slot = { ...slotAt(slots, anaesthetistId, dateISO, session) }
  if (patch.status !== undefined) next.status = patch.status
  for (const key of ['note', 'startTime', 'endTime'] as const) {
    const value = patch[key]
    if (value === undefined) continue
    if (value === null) delete next[key]
    else next[key] = value
  }
  slots[next.id] = next
}

export function listInSlotOf(lists: Record<string, List>, slotId: string): List | undefined {
  return Object.values(lists).find((l) => l.slotId === slotId)
}

export interface ListPlacement {
  kind?: ListKind
  hospitalId?: string | null
  surgeonId?: string | null
  notes?: string | null
  startTime?: string | null
  endTime?: string | null
}

/**
 * Put a List in a Slot, or patch the List already there (`null` clears a
 * field; times are the Slot's overrides). A new List takes the projected id
 * for the Slot, state ACTIVE, and the closed-hospital conflict; the Slot it
 * goes into becomes free with no note, since the List now shows in its place.
 */
export function placeList(
  lists: Record<string, List>,
  slots: Record<string, Slot>,
  holidays: readonly HospitalHoliday[],
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  placement: ListPlacement,
): void {
  const slot = slotAt(slots, anaesthetistId, dateISO, session)
  const existing = listInSlotOf(lists, slot.id)
  let next: List
  if (existing !== undefined) {
    next = { ...existing }
  } else {
    if (placement.kind === undefined) throw new Error(`placeList needs a kind for a new List in ${slot.id}`)
    next = {
      id: projectedListId(anaesthetistId, dateISO, session),
      slotId: slot.id,
      dateISO,
      anaesthetistId,
      session,
      state: 'ACTIVE',
      kind: placement.kind,
      conflicts: [],
    }
    setSlot(slots, anaesthetistId, dateISO, session, { status: 'free', note: null })
  }
  if (placement.kind !== undefined) next.kind = placement.kind
  for (const key of ['hospitalId', 'surgeonId', 'notes'] as const) {
    const value = placement[key]
    if (value === undefined) continue
    if (value === null) delete next[key]
    else next[key] = value
  }
  if (existing === undefined) {
    const conflict = closedHospitalConflict(next, holidays)
    if (conflict !== null) next.conflicts = [conflict]
  }
  lists[next.id] = next
  if (placement.startTime !== undefined || placement.endTime !== undefined) {
    setSlot(slots, anaesthetistId, dateISO, session, {
      ...(placement.startTime !== undefined ? { startTime: placement.startTime } : {}),
      ...(placement.endTime !== undefined ? { endTime: placement.endTime } : {}),
    })
  }
}

/** Empty a Slot: remove any List in it and leave it free, with an optional note and no own times. */
export function clearSlot(
  lists: Record<string, List>,
  slots: Record<string, Slot>,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  note?: string,
): void {
  const slot = slotAt(slots, anaesthetistId, dateISO, session)
  const existing = listInSlotOf(lists, slot.id)
  if (existing !== undefined) delete lists[existing.id]
  setSlot(slots, anaesthetistId, dateISO, session, {
    status: 'free',
    note: note ?? null,
    startTime: null,
    endTime: null,
  })
}

// ---------------------------------------------------------------------------
// The recorded window
// ---------------------------------------------------------------------------

/** The office's ad hoc pools the recorded draws pick from (CES stays ophthalmic). */
const ADHOC_HOSPITALS = [HOSP.stg, HOSP.sx, HOSP.forte, HOSP.ces] as const
const CES_SURGEONS: readonly SurgeonId[] = [SURG.whitford, SURG.reid] as const
const GENERAL_SURGEONS: readonly SurgeonId[] = [
  SURG.hale, SURG.patel, SURG.okafor, SURG.lim, SURG.doyle, SURG.tan, SURG.nand, SURG.cameron,
] as const

function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error('pick from empty pool')
  return item
}

export interface RecordedWindowInput {
  seed: number
  anaesthetistIds: readonly string[]
  permanentLists: readonly PermanentList[]
  leave: readonly SeedLeaveWindow[]
  holidays: readonly HospitalHoliday[]
}

/**
 * Record the window's ad hoc assignments and marked unavailability onto the
 * generated Slots, with the same per-slot draws (and thresholds) the old
 * generator used, on exactly the sessions its RNG branch reached: not under
 * leave, and with no recurring booking or on a weekend. Weekday: under 0.11 a
 * private List at an ad hoc hospital and surgeon, under 0.17 a public acute
 * List, under 0.22 unavailable. Weekend: under 0.08 unavailable.
 */
export function seedRecordedWindow(
  lists: Record<string, List>,
  slots: Record<string, Slot>,
  input: RecordedWindowInput,
): void {
  const templates = new Set(input.permanentLists.map((t) => `${t.anaesthetistId}|${t.dayOfWeek}|${t.session}`))
  const leave = new Set(input.leave.map((w) => `${w.anaesthetistId}|${w.dateISO}|${w.session}`))
  for (const dateISO of enumerateDatesISO(RECORDED_WINDOW.fromISO, RECORDED_WINDOW.toISO)) {
    const dayOfWeek = parseISO(dateISO).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    for (const anaesthetistId of input.anaesthetistIds) {
      for (const session of ['AM', 'PM'] as const) {
        if (slots[slotIdFor(anaesthetistId, dateISO, session)] === undefined) continue
        if (leave.has(`${anaesthetistId}|${dateISO}|${session}`)) continue
        if (!isWeekend && templates.has(`${anaesthetistId}|${dayOfWeek}|${session}`)) continue
        const rng = slotRng(input.seed, 'fill', anaesthetistId, dateISO, session)
        const draw = rng()
        if (isWeekend) {
          if (draw < 0.08) setSlot(slots, anaesthetistId, dateISO, session, { status: 'unavailable', note: 'Not available' })
        } else if (draw < 0.11) {
          const hospitalId = pick(rng, ADHOC_HOSPITALS)
          const surgeonId = hospitalId === HOSP.ces ? pick(rng, CES_SURGEONS) : pick(rng, GENERAL_SURGEONS)
          placeList(lists, slots, input.holidays, anaesthetistId, dateISO, session, { kind: 'private', hospitalId, surgeonId })
        } else if (draw < 0.17) {
          placeList(lists, slots, input.holidays, anaesthetistId, dateISO, session, {
            kind: 'public',
            hospitalId: HOSP.cph,
            notes: 'Acute theatre',
          })
        } else if (draw < 0.22) {
          setSlot(slots, anaesthetistId, dateISO, session, { status: 'unavailable', note: 'Not available' })
        }
      }
    }
  }
}

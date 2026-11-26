import { useMemo } from 'react'
import {
  bookingCountsByList,
  draftListsForDate,
  listInSlot,
  openWarnings,
  rosterForDate,
  scheduleHorizon,
  slotViewsForDate,
  useAppStore,
  useToday,
  warningSummaryByList,
  type SlotView,
} from '../../../../store'

/**
 * Seeded data for the Admin catalogue rows, derived the way the Admin layout
 * (`AdminApp.tsx`) derives it: memoised over the store slices, so a selector
 * never returns a fresh object per render. Ids are read from the store, never
 * hard-coded, so a reseed cannot strand a row.
 */
export function useAdminDay(dateISO: string, rosterLimit?: number) {
  const slots = useAppStore((s) => s.schedule.slots)
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)

  const anaesthetists = useMemo(() => {
    const all = rosterForDate({ schedule: { slots }, masters }, dateISO)
    return rosterLimit === undefined ? all : all.slice(0, rosterLimit)
  }, [slots, masters, dateISO, rosterLimit])

  const viewsByAnaesthetist = useMemo(() => {
    const views = slotViewsForDate({ schedule: { slots, lists }, appSettings, masters: { slotStatuses: masters.slotStatuses } }, dateISO)
    const map: Record<string, SlotView[]> = {}
    for (const v of views) (map[v.slot.anaesthetistId] ??= []).push(v)
    return map
  }, [slots, lists, appSettings, masters.slotStatuses, dateISO])

  const warningState = useMemo(() => ({ schedule, billing, appSettings, clock, masters }), [schedule, billing, appSettings, clock, masters])
  const warningFlags = useMemo(() => warningSummaryByList(warningState, dateISO), [warningState, dateISO])
  const todoRows = useMemo(() => openWarnings(warningState), [warningState])
  const draftLists = useMemo(() => draftListsForDate({ schedule: { lists } }, dateISO), [lists, dateISO])
  const bookingCounts = useMemo(() => bookingCountsByList(bookings), [bookings])
  const horizonEndISO = useMemo(() => scheduleHorizon({ clock, appSettings }).endISO, [clock, appSettings])

  return { masters, anaesthetists, viewsByAnaesthetist, warningFlags, todoRows, draftLists, bookingCounts, horizonEndISO }
}

/** Real seeded ids the rows open (each a primitive, so the selectors are stable). */
export function useSeedIds() {
  const todayISO = useToday()
  const submittedListId = useAppStore((s) => Object.values(s.schedule.lists).find((l) => l.state === 'SUBMITTED')?.id)
  const draftListId = useAppStore((s) => Object.values(s.schedule.lists).find((l) => l.state === 'DRAFT')?.id)
  const conflictedListId = useAppStore((s) => Object.values(s.schedule.lists).find((l) => l.conflicts.length > 0)?.id)
  const activeSlotId = useAppStore((s) => Object.values(s.schedule.lists).find((l) => l.state === 'ACTIVE' && l.dateISO === todayISO && l.slotId !== undefined)?.slotId)
  const emptySlotId = useAppStore((s) => Object.values(s.schedule.slots).find((sl) => sl.dateISO === todayISO && listInSlot(s, sl.id) === undefined)?.id)
  const invoiceId = useAppStore((s) => Object.keys(s.billing.invoices)[0])
  const fixedContractId = useAppStore((s) => Object.values(s.masters.contracts).find((c) => c.pricing.kind === 'fixed' && c.status === 'active')?.id)
  const holidayId = useAppStore((s) => Object.values(s.masters.holidays).sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0]?.id)
  return { todayISO, submittedListId, draftListId, conflictedListId, activeSlotId, emptySlotId, invoiceId, fixedContractId, holidayId }
}


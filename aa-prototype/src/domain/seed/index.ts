/**
 * buildSeed() — the deterministic pristine dataset the store hydrates from and
 * resetDemo() restores. Same seed, identical data (PROGRESS convention 5); no
 * Date.now(), no Math.random() anywhere in the seed path.
 *
 * Composition: masters + the canvas generator over the full horizon + fixups
 * that paint the design mockups' content (Tue 21 Jul design day, Souter's week
 * Mon 20 to Sun 26, the Thu 23 availability grid) + the booking tableau and
 * scenario states + rich per-Booking demo history + demo settings.
 */

import type {
  Attachment,
  Anaesthetist,
  AuditEntry,
  BillableParty,
  BillingLine,
  Booking,
  Contract,
  ContractHolderOrganisation,
  ContractPrice,
  DayNote,
  DemoSettings,
  Hospital,
  HospitalHoliday,
  Insurer,
  IsoDate,
  List,
  AvailabilitySeries,
  SlotStatus,
  ModifierCode,
  Patient,
  RecurringBooking,
  Procedure,
  RvgCode,
  OfficePrivateSlice,
  Slot,
  Surgeon,
  SurgeonGroup,
  SurgeonRoom,
} from '../types'
import { DEMO_TODAY, enumerateDatesISO, horizonFor } from '../clock'
import { MODIFIER_CODES } from '../billing/modifierCodes'
import { canvasAnaesthetists, generateCanvasForDates, type CanvasMasters, type RecurringClash } from './canvas'
import { projectedListId, slotIdFor } from '../slots'
import { isClosedKey, SEED_STATUS } from '../slotStatus'
import { reconcileAllConflicts } from '../conflicts'
import { isAssignedList } from '../draftLists'
import { clearSlot, listInSlotOf, placeList, seedRecordedWindow, setSlot } from './recordedWindow'
import {
  ANAE,
  ANAESTHETISTS,
  HOSP,
  HOSPITALS,
  INSURERS,
  SEED_SLOT_STATUSES,
  ORGANISATIONS,
  SURG,
  SURGEONS,
  SURGEON_GROUPS,
  SURGEON_ROOMS,
} from './cast'
import { buildOfficePrivate } from './officePrivate'
import { CONTRACT, CONTRACTS, CONTRACT_PRICES } from './contracts'
import { RECURRING_BOOKINGS } from './recurringBookings'
import { HOSPITAL_HOLIDAYS, SEED_LEAVE } from './availabilityAndHolidays'
import { BILLABLE_PARTIES, PAT, buildPatients } from './patients'
import { DAY_NOTES, DAY_NOTE_NEXT } from './dayNotes'
import { RVG_CODES } from './rvgCodes'
import { defaultAppSettings } from '../warnings/settings'
import { SAMPLE_AA_FEE_SETTINGS } from './aaFee'
import type { AppSettings, WarningClearance } from '../warnings/types'
import { buildBookings, type BookingScenarioIds } from './bookings'
import { ANAESTHETIST_DASHBOARD, type AnaesthetistDashboardSeed } from './anaesthetistDashboard'
import { buildHistory } from './history'
import { SEED_DRAFT_LIST_IDS, SEED_DRAFT_LISTS, seedDraftListAudit, seedDraftListBookings, seedRecurringClashDraftLists } from './draftLists'
import { buildSeedAudit } from './audit'
import { SAMPLE_THEATRE_LIST } from '../../assets/sampleAttachments'

export {
  canvasAnaesthetists,
  generateCanvasForDates,
  seriesPaintedCount,
  type CanvasAnaesthetist,
  type CanvasMasters,
  type GeneratedCanvas,
  type RecurringClash,
  type SeriesCalendarEntry,
} from './canvas'
export { RECORDED_WINDOW } from './recordedWindow'
export { SEED_DRAFT_LIST_IDS, SEED_DRAFT_LISTS, SEED_CLASH_RUN_ISO, SEED_CLASH_BY, CANNED_DRAFT_LIST_REQUESTS, CANNED_DAY_DRAFT_LISTS } from './draftLists'
export { SEED_LEAVE } from './availabilityAndHolidays'
export { slotRng, hashStringToSeed } from './slotHash'
export { ANAE, HOSP, INS, SURG, ORG, ROOM, ANAESTHETISTS, SEED_SLOT_STATUSES } from './cast'

/** The seeded availability statuses keyed by ID (generator input for tests and tools). */
export function seedSlotStatusRecords(): Record<string, SlotStatus> {
  return Object.fromEntries(SEED_SLOT_STATUSES.map((s) => [s.key, s]))
}
export { CONTRACT } from './contracts'
export { BP, PAT } from './patients'
export {
  ANAESTHETIST_DASHBOARD,
  deriveDashboardFigures,
  type AnaesthetistDashboardSeed,
  type DashboardFigures,
  type ProductivitySeed,
  type LeaveSeed,
} from './anaesthetistDashboard'
export { bucketForAgingDays, epochDayOf, daysBetween, type AgingBucketKey } from '../dateDays'

/** The demo seed constant (the pinned demo date as a number). */
export const SEED = 20260721

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface SeedMasters {
  anaesthetists: Record<string, Anaesthetist>
  surgeons: Record<string, Surgeon>
  /** Surgeons' rooms (catch-up Phase 17, US-13.6.1); members derived from `Surgeon.roomId`. */
  surgeonRooms: Record<string, SurgeonRoom>
  /** Surgeon groups (catch-up Phase 17, US-13.4.1), beside `organisations`. */
  surgeonGroups: Record<string, SurgeonGroup>
  hospitals: Record<string, Hospital>
  insurers: Record<string, Insurer>
  organisations: Record<string, ContractHolderOrganisation>
  contracts: Record<string, Contract>
  contractPrices: Record<string, ContractPrice>
  rvgCodes: Record<string, RvgCode>
  modifierCodes: Record<string, ModifierCode>
  /** The availability statuses (catch-up Phase 29; US-01.2.2): a user-maintained master keyed by fixed ID. */
  slotStatuses: Record<string, SlotStatus>
  recurringBookings: Record<string, RecurringBooking>
  holidays: Record<string, HospitalHoliday>
  patients: Record<string, Patient>
  billableParties: Record<string, BillableParty>
}

export interface SeedSchedule {
  /**
   * Every Slot across the horizon (catch-up Phase 28; OQ-64: "every Slot is
   * created and stored"), keyed by `S-<reg>-<date>-<session>`.
   */
  slots: Record<string, Slot>
  /** Lists only: assigned or projected, each in one Slot (plus the pre-horizon backdrop history). */
  lists: Record<string, List>
  bookings: Record<string, Booking>
  procedures: Record<string, Procedure>
  billingLines: Record<string, BillingLine>
  /**
   * Office clearances of derived warnings (catch-up Phase 15a), keyed by
   * warning key. Kept outside the Booking so clearing never touches a Booking
   * an AUTHORISED List has locked. Empty at seed.
   */
  warningClearances: Record<string, WarningClearance>
  /** Repeating days off (catch-up Phase 29; US-01.5.3): rules that write their Slots. None is seeded. */
  availabilitySeries: Record<string, AvailabilitySeries>
}

export interface SeedState {
  masters: SeedMasters
  schedule: SeedSchedule
  audit: AuditEntry[]
  settings: DemoSettings
  /**
   * App settings (catch-up Phase 15a; DM-31): warning-rule switches and
   * parameters. Kept apart from `settings`, which holds demo controls. No
   * screen edits it (US-13.7.4 is Future).
   */
  appSettings: AppSettings
  /**
   * Seeded anaesthetist-dashboard figures (Phase 05; W1/W4), keyed by
   * registration number. Labelled demo figures; Phase 10 replaces the
   * receivables/overdue portion with billing-mirror derivation.
   */
  dashboards: Record<string, AnaesthetistDashboardSeed>
  /** Per-day internal office notes (Phase 06), keyed by calendar date. */
  dayNotes: Record<IsoDate, DayNote[]>
  /**
   * Pairing preferences and priority tiers (catch-up Phase 17). OFFICE ONLY:
   * see `OfficePrivateSlice` and `src/apps/officePrivacy.test.ts`. A top-level
   * slice, not inside `masters`, so `masters` stays safe for any screen.
   */
  officePrivate: OfficePrivateSlice
  /** Next free numeric suffix per runtime-allocated entity kind. */
  counters: Record<string, number>
}

function byId<T>(items: readonly T[], key: (item: T) => string): Record<string, T> {
  const out: Record<string, T> = {}
  for (const item of items) out[key(item)] = item
  return out
}

// ---------------------------------------------------------------------------
// Design fixups
// ---------------------------------------------------------------------------

interface Canvas {
  slots: Record<string, Slot>
  lists: Record<string, List>
}

/** Paint the mockups' content days over the generated canvas. */
function applyDesignFixups({ slots, lists }: Canvas): void {
  const TUE21 = DEMO_TODAY
  const WED22 = '2026-07-22'
  const THU23 = '2026-07-23'
  const times = (startTime: string, endTime: string) => ({ startTime, endTime })

  // --- Tuesday 21 July: the Admin Day slate (statuses from recurring bookings
  // and the calendar already match; pin the design's times, the free sessions
  // and the noted rows) ---
  setSlot(slots, ANAE.rutherford, TUE21, 'AM', times('08:00', '13:00'))
  placeList(lists, slots, ANAE.rutherford, TUE21, 'PM', {
    kind: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.okafor,
    ...times('13:30', '17:00'),
  })
  setSlot(slots, ANAE.sharma, TUE21, 'AM', times('07:30', '12:00'))
  clearSlot(lists, slots, ANAE.sharma, TUE21, 'PM', 'Free / open for cover')
  setSlot(slots, ANAE.chen, TUE21, 'AM', times('08:00', '12:30'))
  setSlot(slots, ANAE.chen, TUE21, 'PM', times('13:00', '16:30'))
  clearSlot(lists, slots, ANAE.delaney, TUE21, 'PM', 'Free / keep free, on call for ICU tonight')
  // Fitzgerald's PM is free (catch-up Phase 31): St George's request, with its
  // surgeon named, waits as a Draft List (`seed/draftLists.ts`, LD-001), not as
  // a "Surgeon TBC" List on her row. The catalogue rule wins over the mockup
  // (US-01.3.1, OQ-44; convention 17's rule 2).
  clearSlot(lists, slots, ANAE.hughes, TUE21, 'AM')
  clearSlot(lists, slots, ANAE.hughes, TUE21, 'PM')
  setSlot(slots, ANAE.morrison, TUE21, 'AM', times('08:00', '13:00'))
  setSlot(slots, ANAE.morrison, TUE21, 'PM', times('14:00', '18:00'))
  setSlot(slots, ANAE.whitaker, TUE21, 'PM', times('13:00', '17:00'))
  setSlot(slots, ANAE.strand, TUE21, 'AM', times('08:00', '12:00'))
  clearSlot(lists, slots, ANAE.strand, TUE21, 'PM', 'Free / open for cover')

  // --- Souter's design week: Wed 22 PM is free ("Open for cover") ---
  clearSlot(lists, slots, ANAE.souter, WED22, 'PM', 'Free / open for cover')

  // --- Thursday 23 July: the Web Availability grid (recurring rows already
  // match; pin the free sessions) ---
  clearSlot(lists, slots, ANAE.sharma, THU23, 'PM')
  clearSlot(lists, slots, ANAE.ngata, THU23, 'AM')
  clearSlot(lists, slots, ANAE.chen, THU23, 'PM')
  clearSlot(lists, slots, ANAE.hughes, THU23, 'AM')
  clearSlot(lists, slots, ANAE.hughes, THU23, 'PM')
  clearSlot(lists, slots, ANAE.whitaker, THU23, 'PM')
  clearSlot(lists, slots, ANAE.strand, THU23, 'PM')
}

/**
 * The Wed 22 Jul conflicts, as real facts (catch-up Phase 30; replaces Phase
 * 06's two fabricated messages). Both are flagged by the one rule at the seed's
 * last step (`reconcileAllConflicts`), so they clear the way live ones do:
 * - Dr Rutherford phoned in sick for Wed 22 AM and the office recorded it
 *   (OQ-81 part 3, provisional: a sickness the office records keeps the List
 *   and its Bookings and is a conflict). His Christchurch Eye Surgery List
 *   stays in the session. S2 Beat 3 covers it from the Conflicts screen.
 * - Southern Cross is closed on Wed 22 (`HH900`, in `HOSPITAL_HOLIDAYS`), so
 *   every List there that day is flagged.
 * Tue 21 and every Souter session stay untouched.
 */
export const SEED_SICKNESS = {
  anaesthetistId: ANAE.rutherford,
  dateISO: '2026-07-22',
  session: 'AM' as const,
  note: 'Unwell, short notice',
  /** When the office recorded the phone call (before the clock's 08:00 start). */
  recordedAtISO: `${DEMO_TODAY}T07:40:00`,
}

function applyWed22Facts({ slots }: Canvas): void {
  setSlot(slots, SEED_SICKNESS.anaesthetistId, SEED_SICKNESS.dateISO, SEED_SICKNESS.session, {
    status: SEED_STATUS.unavailable,
    note: SEED_SICKNESS.note,
  })
}

/**
 * Phase 09 scenario Lists: place the three Lists the prepayment and
 * billing-failure exemplars sit on (Souter Fri 24 AM and PM, Ropata Thu 16 AM)
 * as private Lists with a hospital and surgeon, so they read coherently in the
 * day grid and monitor. Souter's leave starts on Fri 24 in the calendar, but
 * she works these two sessions: placing a List leaves the Slot free with no
 * leave note (before Phase 28 the booked List kept the leave note, an
 * artefact the golden test names). Pinned in `bookings.ts` so the filler
 * never books them.
 */
function applyPhase09Slots({ slots, lists }: Canvas): void {
  const FRI24 = '2026-07-24'
  const THU16 = '2026-07-16'
  placeList(lists, slots, ANAE.souter, FRI24, 'AM', {
    kind: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.lim,
    startTime: '09:00',
    endTime: '12:00',
  })
  placeList(lists, slots, ANAE.souter, FRI24, 'PM', {
    kind: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.nand,
    startTime: '13:00',
    endTime: '15:30',
  })
  placeList(lists, slots, ANAE.ropata, THU16, 'AM', {
    kind: 'private',
    hospitalId: HOSP.stg,
    surgeonId: SURG.hale,
    startTime: '08:00',
    endTime: '11:00',
  })
}

// ---------------------------------------------------------------------------
// buildSeed
// ---------------------------------------------------------------------------

interface SeedBuild {
  state: SeedState
  scenario: BookingScenarioIds
  /** The recurring bookings the seed's generation could not project (Phase 31 makes them Draft Lists). */
  clashes: RecurringClash[]
}

/** Dr Souter's Tue 28 Jul AM List (St George's), S1's destination List. */
const SEED_LIST_ATTACHMENT_LIST_ID = projectedListId(ANAE.souter, '2026-07-28', 'AM')
/** Its seeded attachment: `AT0001`, so the store's counter continues at 2. */
const SEED_LIST_ATTACHMENT: Attachment = {
  id: 'AT0001',
  name: "Theatre list · St George's",
  kind: 'pdf',
  dataUrl: SAMPLE_THEATRE_LIST,
}

function buildSeedInternal(): SeedBuild {
  const slotStatuses = byId(SEED_SLOT_STATUSES, (s) => s.key)
  const canvasMasters: CanvasMasters = {
    anaesthetists: canvasAnaesthetists(ANAESTHETISTS),
    recurringBookings: RECURRING_BOOKINGS,
    leave: SEED_LEAVE,
    series: [],
    statuses: slotStatuses,
  }
  const appSettings: AppSettings = { ...defaultAppSettings(), aaFee: SAMPLE_AA_FEE_SETTINGS }
  const horizon = horizonFor(DEMO_TODAY, appSettings.schedule.horizonMonths)
  const generated = generateCanvasForDates(canvasMasters, enumerateDatesISO(horizon.startISO, horizon.endISO))
  const slots = byId(generated.slots, (s) => s.id)
  const lists = byId(generated.lists, (l) => l.id)
  const canvas: Canvas = { slots, lists }

  seedRecordedWindow(lists, slots, {
    seed: SEED,
    anaesthetistIds: ANAESTHETISTS.map((a) => a.registrationNumber),
    recurringBookings: RECURRING_BOOKINGS,
    leave: SEED_LEAVE,
  })
  applyDesignFixups(canvas)
  applyWed22Facts(canvas)
  applyPhase09Slots(canvas)
  // A clash under a Slot a fixup later freed is not a clash any more.
  const clashes = generated.clashes.filter((c) => {
    const slot = slots[c.slotId]
    return slot !== undefined && isClosedKey(slotStatuses, slot.status) && listInSlotOf(lists, c.slotId) === undefined
  })

  const bookingsBuild = buildBookings(SEED, Object.values(lists).filter(isAssignedList))

  // The seeded SUBMITTED lists awaiting authorisation (past dates — the clock
  // seeds at 08:00, so today's lists are ACTIVE mid-capture): the two Phase-02
  // queue lists, S3's two Souter money-story Lists, the Phase-09 billing-failure
  // exemplar (Ropata Thu 16), and the Phase-11 locked-target list (Delaney Fri
  // 17 — its integration-origin Booking is what the locked-target message parks
  // against).
  for (const id of [
    SEED_LIST_IDS.morrisonMon20,
    SEED_LIST_IDS.whitakerFri17,
    SEED_LIST_IDS.souterMon20Am,
    SEED_LIST_IDS.souterMon20Pm,
    SEED_LIST_IDS.billingFailure,
    SEED_LIST_IDS.integrationLocked,
  ]) {
    const list = lists[id]
    if (list !== undefined && list.state !== 'DRAFT') lists[id] = { ...list, state: 'SUBMITTED' }
  }

  const patients = buildPatients(SEED)

  const anaesthetistsRec = byId(ANAESTHETISTS, (a) => a.registrationNumber)
  const hospitalsRec = byId(HOSPITALS, (h) => h.id)
  const surgeonsRec = byId(SURGEONS, (s) => s.id)
  const organisationsRec = byId(ORGANISATIONS, (o) => o.id)
  const patientsRec = byId(patients, (p) => p.hiddenInternalId)

  // Seeded historical billing-mirror rows (Phase 10): merge their Lists/Bookings/
  // Procedures into the schedule. Their billing + Xero side is composed by
  // `buildSeedBillingSlice`, which rebuilds the same deterministic graph.
  const history = buildHistory({
    anaesthetists: anaesthetistsRec,
    hospitals: hospitalsRec,
    surgeons: surgeonsRec,
    organisations: organisationsRec,
  })
  const bookingsRec = byId(bookingsBuild.bookings, (c) => c.id)
  const proceduresRec = byId(bookingsBuild.procedures, (p) => p.id)
  const billingLinesRec = byId(bookingsBuild.billingLines, (l) => l.id)
  for (const [id, l] of Object.entries(history.lists)) lists[id] = l
  // The one seeded List attachment (US-03.1.3; catch-up Phase 15), so List
  // attachments show after Reset: the theatre list on S1's destination List.
  const theatreList = lists[SEED_LIST_ATTACHMENT_LIST_ID]
  if (theatreList !== undefined) lists[theatreList.id] = { ...theatreList, attachments: [SEED_LIST_ATTACHMENT] }
  for (const [id, c] of Object.entries(history.bookings)) bookingsRec[id] = c
  for (const [id, p] of Object.entries(history.procedures)) proceduresRec[id] = p
  // Draft Lists (catch-up Phase 31): the office's waiting requests, and every
  // recurring clash from today on, through the store's own rule. They take no
  // Slot, so no Slot above changes; LD-002's two Bookings follow every other
  // seeded Booking, so no id moves.
  const seededDraftLists = [
    ...SEED_DRAFT_LISTS,
    ...seedRecurringClashDraftLists(clashes, slots, RECURRING_BOOKINGS),
  ]
  for (const d of seededDraftLists) lists[d.id] = d
  const draftBookings = seedDraftListBookings(bookingsBuild.next)
  for (const b of draftBookings.bookings) bookingsRec[b.id] = b
  for (const p of draftBookings.procedures) proceduresRec[p.id] = p
  // Conflicts come from facts, by the same rule `mutate()` runs (catch-up Phase 30).
  // Stamped at the seed clock (08:00), as a live mutation at that moment would be.
  const reconciled = reconcileAllConflicts(lists, { slots, statuses: slotStatuses, holidays: HOSPITAL_HOLIDAYS }, `${DEMO_TODAY}T08:00:00`)
  for (const [id, l] of Object.entries(reconciled)) lists[id] = l
  const sicknessSlot = slots[slotIdFor(SEED_SICKNESS.anaesthetistId, SEED_SICKNESS.dateISO, SEED_SICKNESS.session)]!
  const audit = buildSeedAudit({
    existing: [
      ...bookingsBuild.audit,
      ...seedDraftListAudit(seededDraftLists),
      {
        id: 'seed-sickness',
        entityType: 'session',
        entityId: sicknessSlot.id,
        who: 'Kirsty W.',
        role: 'office',
        source: 'office',
        action: 'session.status',
        atISO: SEED_SICKNESS.recordedAtISO,
        before: { status: SEED_STATUS.free, statusLabel: slotStatuses[SEED_STATUS.free]!.label },
        after: { status: SEED_STATUS.unavailable, statusLabel: slotStatuses[SEED_STATUS.unavailable]!.label, note: SEED_SICKNESS.note },
      },
    ],
    anaesthetists: anaesthetistsRec,
    lists,
    bookings: bookingsRec,
    procedures: proceduresRec,
    billingLines: billingLinesRec,
  })

  const state: SeedState = {
    masters: {
      anaesthetists: anaesthetistsRec,
      surgeons: surgeonsRec,
      surgeonRooms: byId(SURGEON_ROOMS, (r) => r.id),
      surgeonGroups: byId(SURGEON_GROUPS, (g) => g.id),
      hospitals: hospitalsRec,
      insurers: byId(INSURERS, (i) => i.id),
      organisations: organisationsRec,
      contracts: byId(CONTRACTS, (c) => c.id),
      contractPrices: byId(CONTRACT_PRICES, (p) => p.id),
      rvgCodes: byId(RVG_CODES, (r) => r.code),
      modifierCodes: byId(MODIFIER_CODES, (m) => m.code),
      slotStatuses,
      recurringBookings: byId(RECURRING_BOOKINGS, (p) => p.id),
      holidays: byId(HOSPITAL_HOLIDAYS, (h) => h.id),
      patients: patientsRec,
      billableParties: byId(BILLABLE_PARTIES, (b) => b.hiddenInternalId),
    },
    schedule: {
      slots,
      lists,
      bookings: bookingsRec,
      procedures: proceduresRec,
      billingLines: billingLinesRec,
      warningClearances: {},
      availabilitySeries: {},
    },
    audit,
    settings: {
      contactArchiveInactivityDays: 90,
      // Narrated scale (N4): counters near Xero's ~10k soft contact limit, the
      // archive job decrements `activeContacts`. Not ~28k seeded records.
      volumeStory: { invoicesPerYear: 28000, oneTimePct: 99, activeContacts: 9820, softLimit: 10000 },
    },
    appSettings,
    dashboards: ANAESTHETIST_DASHBOARD,
    dayNotes: DAY_NOTES,
    officePrivate: buildOfficePrivate(),
    counters: {
      audit: audit.length + 1,
      booking: draftBookings.next.booking,
      procedure: draftBookings.next.procedure,
      billingLine: bookingsBuild.next.billingLine,
      patient: patients.length + 1,
      billableParty: BILLABLE_PARTIES.length + 1,
      dayNote: DAY_NOTE_NEXT,
      list: 1,
      hospital: 1,
      contract: 1,
      attachment: 2,
      slotStatus: 1,
      availabilitySeries: 1,
    },
  }

  return { state, scenario: bookingsBuild.scenario, clashes }
}

/** Pinned seeded List ids (the projected-id form) the markers and tests reference. */
export const SEED_LIST_IDS = {
  souterAm21: projectedListId(ANAE.souter, DEMO_TODAY, 'AM'),
  souterPm21: projectedListId(ANAE.souter, DEMO_TODAY, 'PM'),
  rutherfordAm21: projectedListId(ANAE.rutherford, DEMO_TODAY, 'AM'),
  rutherfordPm21: projectedListId(ANAE.rutherford, DEMO_TODAY, 'PM'),
  morrisonMon20: projectedListId(ANAE.morrison, '2026-07-20', 'AM'),
  whitakerFri17: projectedListId(ANAE.whitaker, '2026-07-17', 'AM'),
  souterMon20Am: projectedListId(ANAE.souter, '2026-07-20', 'AM'),
  souterMon20Pm: projectedListId(ANAE.souter, '2026-07-20', 'PM'),
  // Phase 09: the unpaid pre-payment booking's list, the mixed + full (seeded
  // paid) booking's list, and the multi-booking billing-failure exemplar list.
  prepaymentUnpaidList: projectedListId(ANAE.souter, '2026-07-24', 'AM'),
  prepaymentPaidList: projectedListId(ANAE.souter, '2026-07-24', 'PM'),
  billingFailure: projectedListId(ANAE.ropata, '2026-07-16', 'AM'),
  // Phase 11: the SUBMITTED (office-locked) List holding the locked-target
  // integration Booking, the clean S1 create destination, and separate modify
  // targets that keep S1's List uncluttered.
  integrationLocked: projectedListId(ANAE.delaney, '2026-07-17', 'AM'),
  integrationStgList: projectedListId(ANAE.souter, '2026-07-28', 'AM'),
  integrationModifyStgList: projectedListId(ANAE.souter, '2026-08-04', 'AM'),
  integrationMoveSourceStgList: projectedListId(ANAE.souter, '2026-08-03', 'PM'),
  integrationSxList: projectedListId(ANAE.souter, '2026-07-28', 'PM'),
  integrationCphList: projectedListId(ANAE.souter, '2026-07-30', 'AM'),
} as const

/**
 * The seed is built ONCE at module load and shared. The store only ever reads
 * it and applies immutable (spread) updates through `mutate()` (storeDiscipline
 * enforces this), and `freshAppState()` spreads the top level per store, so the
 * cached graph is never mutated in place. This removes the second full build
 * that `SEED_MARKERS` used to trigger just to read ~20 scenario ids.
 *
 * Declared after SEED_LIST_IDS because `buildSeedInternal()` reads it.
 */
const SEED_BUILD: SeedBuild = buildSeedInternal()

/** The pristine seed state. Deterministic: two calls are deep-equal. */
export function buildSeed(): SeedState {
  return SEED_BUILD.state
}

/**
 * The recurring bookings the seed's generation met on an unavailable or
 * holiday Slot and did not project (US-01.1.1; OQ-81 part 2). Kept nowhere in
 * state yet: Phase 31 turns each into a Draft List. A seed test pins the set.
 */
export function seedRecurringClashes(): readonly RecurringClash[] {
  return SEED_BUILD.clashes
}

/** The earliest non-cancelled Booking on a seeded List (by time, then id). */
function firstSeedBookingOn(listId: string): string {
  const first = Object.values(SEED_BUILD.state.schedule.bookings)
    .filter((b) => b.listId === listId && b.cancellation === undefined)
    .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))[0]
  if (first === undefined) throw new Error(`Seed List ${listId} has no Booking for the warning samples`)
  return first.id
}

/**
 * The demo day's sample-warning targets (catch-up Phase 15a): the first Booking
 * on each of Dr Rutherford's Tue 21 Jul Lists (assigned, not submitted), which
 * no Booking-level scenario marker and no S1 to S5 beat uses. "Raise sample
 * warnings" stages every rule's sample on them; `multiWarning` is the Booking
 * every rule's sample lands on, so it carries two warnings once a second rule
 * is registered. Constants derived from the cached seed, not seed content.
 */
export const SEED_WARNING_SAMPLE_BOOKINGS = {
  targets: [firstSeedBookingOn(SEED_LIST_IDS.rutherfordAm21), firstSeedBookingOn(SEED_LIST_IDS.rutherfordPm21)],
  multiWarning: firstSeedBookingOn(SEED_LIST_IDS.rutherfordAm21),
} as const

export { buildSeedBillingSlice, type SeedBillingSlice } from './billing'

/**
 * The Booking whose full pre-payment invoice the seeded billing slice materialises
 * as PAID (Phase 09). `freshAppState`/`resetDomainState` pass this to
 * `buildSeedBillingSlice`.
 */
export const SEED_PREPAID_BOOKING_ID: string = SEED_BUILD.scenario.prepaymentPaid

// ---------------------------------------------------------------------------
// Seeded-scenario markers (the inspector's finder + the seed tests)
// ---------------------------------------------------------------------------

export interface SeedMarker {
  label: string
  entityType: 'list' | 'booking' | 'procedure' | 'patient' | 'contract'
  entityId: string
  detail: string
}

function buildMarkers(scenario: BookingScenarioIds): Record<string, SeedMarker> {
  return {
    // Catch-up Phase 31: the waiting requests (the recurring clashes are listed by the Draft Lists page).
    draftListStGeorges: {
      label: "Draft List: St George's request (Tue 21 PM)",
      entityType: 'list',
      entityId: SEED_DRAFT_LIST_IDS.stGeorges,
      detail: "St George's / Mr Tan, no anaesthetist yet, waiting since Mon 20 15:40 (S2 Beat 1b).",
    },
    draftListForte: {
      label: 'Draft List with Bookings: Forte Health (Wed 22 PM)',
      entityType: 'list',
      entityId: SEED_DRAFT_LIST_IDS.forte,
      detail: "Forte Health / Mr Nand, 2 Bookings before an anaesthetist is assigned; fits Dr Souter's free Wed 22 PM.",
    },
    draftListEyeSurgery: {
      label: 'Draft List, long wait: Christchurch Eye Surgery (Mon 27 AM)',
      entityType: 'list',
      entityId: SEED_DRAFT_LIST_IDS.eyeSurgery,
      detail: 'Christchurch Eye Surgery / Ms Reid, waiting since Fri 17; Dr Sharma is not preferred with Ms Reid.',
    },
    designDayAmList: {
      label: 'Design day AM list (done, unbilled)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.souterAm21,
      detail: "Souter, St George's / Mr Hale, 5 bookings all complete, ACTIVE.",
    },
    designDayPmList: {
      label: 'Design day PM list (mid capture)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.souterPm21,
      detail: 'Souter, Southern Cross / Ms Patel, 4 bookings, Ellison pending.',
    },
    pendingCaptureBooking: {
      label: 'Pending capture booking (Ellison)',
      entityType: 'booking',
      entityId: scenario.ellison,
      detail: 'Margaret Ellison, hip replacement, the one booking left to finish.',
    },
    overriddenTimeUnitsBooking: {
      label: 'Manually adjusted T booking (Chen)',
      entityType: 'booking',
      entityId: scenario.chen,
      detail: 'Captured time units carry overridden provenance for authorisation review.',
    },
    submittedListMorrison: {
      label: 'SUBMITTED list (Morrison, Mon 20)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.morrisonMon20,
      detail: "St George's / Mr Tan, 6 completed bookings plus 1 cancelled, awaiting authorisation.",
    },
    submittedListWhitaker: {
      label: 'SUBMITTED list (Whitaker, Fri 17)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.whitakerFri17,
      detail: 'Christchurch Public acute, 5 completed bookings, awaiting authorisation.',
    },
    cancelledBooking: {
      label: 'Cancelled booking (audited soft cancel)',
      entityType: 'booking',
      entityId: scenario.cancelled,
      detail: 'On the SUBMITTED Morrison list; visible, excluded from validation and billing.',
    },
    splitBillingBooking: {
      label: 'Split billing multi procedure booking',
      entityType: 'booking',
      entityId: scenario.splitBilling,
      detail: 'Second procedure isAdditional: time units only on the BTM path.',
    },
    twoFunderBooking: {
      label: 'One procedure, two funders',
      entityType: 'booking',
      entityId: scenario.twoFunder,
      detail: 'Two stored rvg lines, one with a nib funder override; amounts conserve to the fee.',
    },
    rateTimeBooking: {
      label: 'Rate x time booking (Method 3)',
      entityType: 'booking',
      entityId: scenario.rateTime,
      detail: 'Hourly rate line under the billable-party-held individual arrangement contract.',
    },
    rateTimeCaptureBooking: {
      label: 'Rate x time capture booking (Souter, Mon 27)',
      entityType: 'booking',
      entityId: scenario.rateTimeCapture,
      detail: 'Not yet captured; the hours x rate line is added live in the mobile app under the Aria contract.',
    },
    bariatricType3Booking: {
      label: 'Type 3 fixed price booking (bariatric)',
      entityType: 'booking',
      entityId: scenario.bariatric,
      detail: 'Mr Doyle price list; second procedure priced by the ordinal rule.',
    },
    cosAccContractBooking: {
      label: 'Externally held ACC contract booking (COS)',
      entityType: 'booking',
      entityId: scenario.cosAcc,
      detail: 'Billed under the Canterbury Orthopaedic Surgeons ACC Type 2.',
    },
    accRelatedBooking: {
      label: 'ACC related procedure (hospital route)',
      entityType: 'booking',
      entityId: scenario.accRelated,
      detail: "Billed under St George's ACC Type 2; sources W4's ACC column.",
    },
    guardianMinorBooking: {
      label: 'Guardian pays for a minor',
      entityType: 'booking',
      entityId: scenario.guardianMinor,
      detail: 'Grace Park (12); billable party override set to her mother.',
    },
    prepaymentBooking: {
      label: 'Pre-payment booking (split, unpaid)',
      entityType: 'booking',
      entityId: scenario.prepayment,
      detail: 'Souter Fri 24 AM; selfFundedPrepayment split, an $800 prepayment on a $1,200 self funded fee. Unpaid: raises the prepayment warning, never a block.',
    },
    prepaymentPaidBooking: {
      label: 'Pre-payment booking (mixed + full, seeded paid)',
      entityType: 'booking',
      entityId: scenario.prepaymentPaid,
      detail: 'Souter Fri 24 PM; one hospital procedure + one full pre-payment (seeded PAID). Paid: no warning; no balance invoice.',
    },
    billingFailureBooking: {
      label: 'Billing failure booking (COS ACC)',
      entityType: 'booking',
      entityId: scenario.billingFailure,
      detail: 'Ropata Thu 16, SUBMITTED. Fails when the COS ACC contract is dated out (no default fallback); its sibling still invoices.',
    },
    insuredReimbursementBooking: {
      label: 'Insured reimbursement booking',
      entityType: 'booking',
      entityId: scenario.insuredReimbursement,
      detail: 'Patient pays and claims from AIA Health; NOT the direct claim Insurer route.',
    },
    provisionalNoNhiPatient: {
      label: 'Provisional patient (NHI pending)',
      entityType: 'patient',
      entityId: PAT.provisional,
      detail: 'Arrived via the PDF pathway; hidden internal ID only.',
    },
    repeatPatientMitchell: {
      label: 'Repeat patient (Sarah Mitchell)',
      entityType: 'patient',
      entityId: PAT.mitchell,
      detail: `Two episodes: bookings ${scenario.repeatMitchell[0]} and ${scenario.repeatMitchell[1]}.`,
    },
    repeatPatientWalker: {
      label: 'Repeat patient (Hemi Walker)',
      entityType: 'patient',
      entityId: PAT.walker,
      detail: `Two episodes: bookings ${scenario.repeatWalker[0]} and ${scenario.repeatWalker[1]}.`,
    },
    missingBillingRef1: {
      label: 'Missing billing reference 1 of 2',
      entityType: 'procedure',
      entityId: scenario.missingRefProcedures[0],
      detail: 'Hospital route procedure flagged for a missing billing reference.',
    },
    missingBillingRef2: {
      label: 'Missing billing reference 2 of 2',
      entityType: 'procedure',
      entityId: scenario.missingRefProcedures[1],
      detail: 'Hospital route procedure flagged for a missing billing reference.',
    },
    allDayBooking: {
      label: 'All day booking (Rutherford)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.rutherfordAm21,
      detail: 'AM and PM Lists share Forte Health / Mr Okafor; no special entity.',
    },
    individualArrangementContract: {
      label: 'Individual arrangement contract',
      entityType: 'contract',
      entityId: CONTRACT.ariaHourly,
      detail: 'Billable-party held; permitsIndividualArrangement gates rate x time capture.',
    },
    integrationS13Time: {
      label: 'Integration booking · S13 reschedule target (same list)',
      entityType: 'booking',
      entityId: scenario.integrationS13Time,
      detail: "Souter Tue 4 Aug AM (St George's); correlationRef set. The same-list S13 message retimes it.",
    },
    integrationS13Move: {
      label: 'Integration booking · S13 move target',
      entityType: 'booking',
      entityId: scenario.integrationS13Move,
      detail: "Souter Mon 3 Aug PM (St George's); the cross-list S13 message reassigns it to Tue 4 Aug AM.",
    },
    integrationS14: {
      label: 'Integration booking · S14 modification target',
      entityType: 'booking',
      entityId: scenario.integrationS14,
      detail: "Souter Tue 4 Aug AM (St George's); the S14 message updates it, located by appointment id.",
    },
    integrationS15: {
      label: 'Integration booking · S15 cancellation target',
      entityType: 'booking',
      entityId: scenario.integrationS15,
      detail: "Souter Tue 4 Aug AM (St George's); the S15 message soft-cancels it.",
    },
    listAttachment: {
      label: 'List attachment (theatre list PDF)',
      entityType: 'list',
      entityId: SEED_LIST_ATTACHMENT_LIST_ID,
      detail: "Souter Tue 28 Jul AM (St George's); the List carries the seeded theatre-list PDF.",
    },
    integrationLockedTarget: {
      label: 'Integration booking · locked target (SUBMITTED list)',
      entityType: 'booking',
      entityId: scenario.integrationLockedTarget,
      detail: 'Delaney Fri 17 (SUBMITTED); the locked-target S14 message parks as manual intervention, booking unchanged.',
    },
  }
}

/** Every seeded checklist state, one click away in the `/demo/data` finder. */
export const SEED_MARKERS: Readonly<Record<string, SeedMarker>> = buildMarkers(SEED_BUILD.scenario)

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
  AnaesthetistAvailability,
  AnaesthetistId,
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
  ListStatus,
  ListStatusKey,
  ModifierCode,
  Patient,
  PermanentList,
  Procedure,
  RvgCode,
  Session,
  Surgeon,
} from '../types'
import { DEMO_TODAY, enumerateDatesISO, horizonFor } from '../clock'
import { MODIFIER_CODES } from '../billing/modifierCodes'
import { generateListsForDates, listIdForSlot, type CanvasMasters } from './canvas'
import {
  ANAE,
  ANAESTHETISTS,
  HOSP,
  HOSPITALS,
  INSURERS,
  LIST_STATUSES,
  ORGANISATIONS,
  SURG,
  SURGEONS,
} from './cast'
import { CONTRACT, CONTRACTS, CONTRACT_PRICES } from './contracts'
import { PERMANENT_LISTS } from './permanentLists'
import { AVAILABILITY, HOSPITAL_HOLIDAYS } from './availabilityAndHolidays'
import { BILLABLE_PARTIES, PAT, buildPatients } from './patients'
import { DAY_NOTES, DAY_NOTE_NEXT } from './dayNotes'
import { RVG_CODES } from './rvgCodes'
import { buildBookings, type BookingScenarioIds } from './bookings'
import { ANAESTHETIST_DASHBOARD, type AnaesthetistDashboardSeed } from './anaesthetistDashboard'
import { buildHistory } from './history'
import { buildSeedAudit } from './audit'
import { SAMPLE_THEATRE_LIST } from '../../assets/sampleAttachments'

export { generateListsForDates, listIdForSlot, type CanvasMasters } from './canvas'
export { slotRng, hashStringToSeed } from './slotHash'
export { ANAE, HOSP, INS, SURG, ORG, ANAESTHETISTS } from './cast'
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
  hospitals: Record<string, Hospital>
  insurers: Record<string, Insurer>
  organisations: Record<string, ContractHolderOrganisation>
  contracts: Record<string, Contract>
  contractPrices: Record<string, ContractPrice>
  rvgCodes: Record<string, RvgCode>
  modifierCodes: Record<string, ModifierCode>
  listStatuses: Record<string, ListStatus>
  permanentLists: Record<string, PermanentList>
  availability: Record<string, AnaesthetistAvailability>
  holidays: Record<string, HospitalHoliday>
  patients: Record<string, Patient>
  billableParties: Record<string, BillableParty>
}

export interface SeedSchedule {
  lists: Record<string, List>
  bookings: Record<string, Booking>
  procedures: Record<string, Procedure>
  billingLines: Record<string, BillingLine>
}

export interface SeedState {
  masters: SeedMasters
  schedule: SeedSchedule
  audit: AuditEntry[]
  settings: DemoSettings
  /**
   * Seeded anaesthetist-dashboard figures (Phase 05; W1/W4), keyed by
   * registration number. Labelled demo figures; Phase 10 replaces the
   * receivables/overdue portion with billing-mirror derivation.
   */
  dashboards: Record<string, AnaesthetistDashboardSeed>
  /** Per-day internal office notes (Phase 06), keyed by calendar date. */
  dayNotes: Record<IsoDate, DayNote[]>
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

interface SlotPatch {
  statusKey?: ListStatusKey
  hospitalId?: string | null
  surgeonId?: string | null
  startTime?: string | null
  endTime?: string | null
  notes?: string | null
}

function patchSlot(
  lists: Record<string, List>,
  anaesthetistId: AnaesthetistId,
  dateISO: string,
  session: Session,
  patch: SlotPatch,
): void {
  const id = listIdForSlot(anaesthetistId, dateISO, session)
  const list = lists[id]
  if (list === undefined) throw new Error(`fixup references missing slot ${id}`)
  const next: List = { ...list }
  if (patch.statusKey !== undefined) next.statusKey = patch.statusKey
  if (patch.hospitalId !== undefined) {
    if (patch.hospitalId === null) delete next.hospitalId
    else next.hospitalId = patch.hospitalId
  }
  if (patch.surgeonId !== undefined) {
    if (patch.surgeonId === null) delete next.surgeonId
    else next.surgeonId = patch.surgeonId
  }
  if (patch.startTime !== undefined) {
    if (patch.startTime === null) delete next.startTime
    else next.startTime = patch.startTime
  }
  if (patch.endTime !== undefined) {
    if (patch.endTime === null) delete next.endTime
    else next.endTime = patch.endTime
  }
  if (patch.notes !== undefined) {
    if (patch.notes === null) delete next.notes
    else next.notes = patch.notes
  }
  lists[id] = next
}

const FREE: SlotPatch = {
  statusKey: 'free',
  hospitalId: null,
  surgeonId: null,
  startTime: null,
  endTime: null,
  notes: null,
}

/** Paint the mockups' content days over the generated canvas. */
function applyDesignFixups(lists: Record<string, List>): void {
  const TUE21 = DEMO_TODAY
  const WED22 = '2026-07-22'
  const THU23 = '2026-07-23'

  // --- Tuesday 21 July: the Admin Day slate (statuses from templates and the
  // availability master already match; pin the design's times, the free
  // sessions the slot RNG must not book, and the noted rows) ---
  patchSlot(lists, ANAE.rutherford, TUE21, 'AM', { startTime: '08:00', endTime: '13:00' })
  patchSlot(lists, ANAE.rutherford, TUE21, 'PM', {
    statusKey: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.okafor,
    startTime: '13:30',
    endTime: '17:00',
  })
  patchSlot(lists, ANAE.sharma, TUE21, 'AM', { startTime: '07:30', endTime: '12:00' })
  patchSlot(lists, ANAE.sharma, TUE21, 'PM', { ...FREE, notes: 'Free / open for cover' })
  patchSlot(lists, ANAE.chen, TUE21, 'AM', { startTime: '08:00', endTime: '12:30' })
  patchSlot(lists, ANAE.chen, TUE21, 'PM', { startTime: '13:00', endTime: '16:30' })
  patchSlot(lists, ANAE.delaney, TUE21, 'PM', { ...FREE, notes: 'Free / keep free, on call for ICU tonight' })
  patchSlot(lists, ANAE.fitzgerald, TUE21, 'PM', {
    statusKey: 'private',
    hospitalId: HOSP.stg,
    surgeonId: null,
    startTime: '13:00',
    endTime: '17:30',
    notes: "Surgeon TBC, chasing St George's booking office",
  })
  patchSlot(lists, ANAE.hughes, TUE21, 'AM', { ...FREE })
  patchSlot(lists, ANAE.hughes, TUE21, 'PM', { ...FREE })
  patchSlot(lists, ANAE.morrison, TUE21, 'AM', { startTime: '08:00', endTime: '13:00' })
  patchSlot(lists, ANAE.morrison, TUE21, 'PM', { startTime: '14:00', endTime: '18:00' })
  patchSlot(lists, ANAE.whitaker, TUE21, 'PM', { startTime: '13:00', endTime: '17:00' })
  patchSlot(lists, ANAE.strand, TUE21, 'AM', { startTime: '08:00', endTime: '12:00' })
  patchSlot(lists, ANAE.strand, TUE21, 'PM', { ...FREE, notes: 'Free / open for cover' })

  // --- Souter's design week: Wed 22 PM is free ("Open for cover") ---
  patchSlot(lists, ANAE.souter, WED22, 'PM', { ...FREE, notes: 'Free / open for cover' })

  // --- Thursday 23 July: the Web Availability grid (template-derived rows
  // already match; pin the free sessions the slot RNG must not book) ---
  patchSlot(lists, ANAE.sharma, THU23, 'PM', { ...FREE })
  patchSlot(lists, ANAE.ngata, THU23, 'AM', { ...FREE })
  patchSlot(lists, ANAE.chen, THU23, 'PM', { ...FREE })
  patchSlot(lists, ANAE.hughes, THU23, 'AM', { ...FREE })
  patchSlot(lists, ANAE.hughes, THU23, 'PM', { ...FREE })
  patchSlot(lists, ANAE.whitaker, THU23, 'PM', { ...FREE })
  patchSlot(lists, ANAE.strand, THU23, 'PM', { ...FREE })
}

/**
 * Phase 06 conflict fixup: seed one holiday-kind and one availability-kind
 * advisory `ListConflict` onto two different BOOKED Wed 22 Jul Lists, so the
 * admin day view's advisory flags are one `>` click from today (Tue 21 stays
 * pristine). Applied after generation so it does not fight the generator's
 * clean-generation rule. Deterministic: the two lowest-id booked Wed-22 Lists
 * with distinct anaesthetists (Souter excluded — she is the mobile persona, her
 * forward view stays clean).
 */
function applyPhase06Conflicts(lists: Record<string, List>): void {
  const WED22 = '2026-07-22'
  const isBooked = (k: ListStatusKey) => k === 'private' || k === 'public' || k === 'preop'
  const booked = Object.values(lists)
    .filter((l) => l.dateISO === WED22 && isBooked(l.statusKey) && l.anaesthetistId !== ANAE.souter)
    .sort((a, b) => a.id.localeCompare(b.id))
  const holidayList = booked[0]
  if (holidayList !== undefined) {
    lists[holidayList.id] = {
      ...holidayList,
      conflicts: [
        ...holidayList.conflicts,
        {
          kind: 'holiday',
          message:
            'This List falls on a hospital holiday closure. Advisory only: confirm the theatre is running or rebook.',
        },
      ],
    }
  }
  const availList = booked.find((l) => holidayList !== undefined && l.anaesthetistId !== holidayList.anaesthetistId)
  if (availList !== undefined) {
    lists[availList.id] = {
      ...availList,
      conflicts: [
        ...availList.conflicts,
        {
          kind: 'availability',
          message:
            'The anaesthetist is now marked unavailable for this session. Advisory only: rebook or clear this List.',
        },
      ],
    }
  }
}

/**
 * Phase 09 scenario slots: paint the three lists the pre-payment and
 * billing-failure exemplars sit on (Souter Fri 24 AM/PM, Ropata Thu 16 AM) as
 * booked private sessions with a hospital + surgeon, so they read coherently in
 * the day grid and monitor. Applied after generation (like the design fixups)
 * and pinned in `bookings.ts` so the filler never books them.
 */
function applyPhase09Slots(lists: Record<string, List>): void {
  const FRI24 = '2026-07-24'
  const THU16 = '2026-07-16'
  patchSlot(lists, ANAE.souter, FRI24, 'AM', {
    statusKey: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.lim,
    startTime: '09:00',
    endTime: '12:00',
  })
  patchSlot(lists, ANAE.souter, FRI24, 'PM', {
    statusKey: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.nand,
    startTime: '13:00',
    endTime: '15:30',
  })
  patchSlot(lists, ANAE.ropata, THU16, 'AM', {
    statusKey: 'private',
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
}

/** Dr Souter's Tue 28 Jul AM List (St George's), S1's destination List. */
const SEED_LIST_ATTACHMENT_LIST_ID = listIdForSlot(ANAE.souter, '2026-07-28', 'AM')
/** Its seeded attachment: `AT0001`, so the store's counter continues at 2. */
const SEED_LIST_ATTACHMENT: Attachment = {
  id: 'AT0001',
  name: "Theatre list · St George's",
  kind: 'pdf',
  dataUrl: SAMPLE_THEATRE_LIST,
}

function buildSeedInternal(): SeedBuild {
  const canvasMasters: CanvasMasters = {
    seed: SEED,
    anaesthetistIds: ANAESTHETISTS.map((a) => a.registrationNumber),
    permanentLists: PERMANENT_LISTS,
    availability: AVAILABILITY,
    holidays: HOSPITAL_HOLIDAYS,
  }
  const horizon = horizonFor(DEMO_TODAY)
  const generated = generateListsForDates(canvasMasters, enumerateDatesISO(horizon.startISO, horizon.endISO))
  const lists = byId(generated, (l) => l.id)

  applyDesignFixups(lists)
  applyPhase06Conflicts(lists)
  applyPhase09Slots(lists)

  const bookingsBuild = buildBookings(SEED, Object.values(lists))

  // The seeded SUBMITTED lists awaiting authorisation (past dates — the clock
  // seeds at 08:00, so today's lists are DRAFT mid-capture): the two Phase-02
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
    if (list !== undefined) lists[id] = { ...list, state: 'SUBMITTED' }
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
    patients: patientsRec,
    billableParties: byId(BILLABLE_PARTIES, (b) => b.hiddenInternalId),
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
  const audit = buildSeedAudit({
    existing: bookingsBuild.audit,
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
      hospitals: hospitalsRec,
      insurers: byId(INSURERS, (i) => i.id),
      organisations: organisationsRec,
      contracts: byId(CONTRACTS, (c) => c.id),
      contractPrices: byId(CONTRACT_PRICES, (p) => p.id),
      rvgCodes: byId(RVG_CODES, (r) => r.code),
      modifierCodes: byId(MODIFIER_CODES, (m) => m.code),
      listStatuses: byId(LIST_STATUSES, (s) => s.key),
      permanentLists: byId(PERMANENT_LISTS, (p) => p.id),
      availability: byId(AVAILABILITY, (a) => a.id),
      holidays: byId(HOSPITAL_HOLIDAYS, (h) => h.id),
      patients: patientsRec,
      billableParties: byId(BILLABLE_PARTIES, (b) => b.hiddenInternalId),
    },
    schedule: {
      lists,
      bookings: bookingsRec,
      procedures: proceduresRec,
      billingLines: billingLinesRec,
    },
    audit,
    settings: {
      contactArchiveInactivityDays: 90,
      // Narrated scale (N4): counters near Xero's ~10k soft contact limit, the
      // archive job decrements `activeContacts`. Not ~28k seeded records.
      volumeStory: { invoicesPerYear: 28000, oneTimePct: 99, activeContacts: 9820, softLimit: 10000 },
    },
    dashboards: ANAESTHETIST_DASHBOARD,
    dayNotes: DAY_NOTES,
    counters: {
      audit: audit.length + 1,
      booking: bookingsBuild.next.booking,
      procedure: bookingsBuild.next.procedure,
      billingLine: bookingsBuild.next.billingLine,
      patient: patients.length + 1,
      billableParty: BILLABLE_PARTIES.length + 1,
      availability: AVAILABILITY.length + 1,
      dayNote: DAY_NOTE_NEXT,
      list: 1,
      hospital: 1,
      contract: 1,
      attachment: 2,
    },
  }

  return { state, scenario: bookingsBuild.scenario }
}

/** Pinned slot-derived list ids the markers and tests reference. */
export const SEED_LIST_IDS = {
  souterAm21: listIdForSlot(ANAE.souter, DEMO_TODAY, 'AM'),
  souterPm21: listIdForSlot(ANAE.souter, DEMO_TODAY, 'PM'),
  rutherfordAm21: listIdForSlot(ANAE.rutherford, DEMO_TODAY, 'AM'),
  rutherfordPm21: listIdForSlot(ANAE.rutherford, DEMO_TODAY, 'PM'),
  morrisonMon20: listIdForSlot(ANAE.morrison, '2026-07-20', 'AM'),
  whitakerFri17: listIdForSlot(ANAE.whitaker, '2026-07-17', 'AM'),
  souterMon20Am: listIdForSlot(ANAE.souter, '2026-07-20', 'AM'),
  souterMon20Pm: listIdForSlot(ANAE.souter, '2026-07-20', 'PM'),
  // Phase 09: the unpaid pre-payment booking's list, the mixed + full (seeded
  // paid) booking's list, and the multi-booking billing-failure exemplar list.
  prepaymentUnpaidList: listIdForSlot(ANAE.souter, '2026-07-24', 'AM'),
  prepaymentPaidList: listIdForSlot(ANAE.souter, '2026-07-24', 'PM'),
  billingFailure: listIdForSlot(ANAE.ropata, '2026-07-16', 'AM'),
  // Phase 11: the SUBMITTED (office-locked) List holding the locked-target
  // integration Booking, the clean S1 create destination, and separate modify
  // targets that keep S1's List uncluttered.
  integrationLocked: listIdForSlot(ANAE.delaney, '2026-07-17', 'AM'),
  integrationStgList: listIdForSlot(ANAE.souter, '2026-07-28', 'AM'),
  integrationModifyStgList: listIdForSlot(ANAE.souter, '2026-08-04', 'AM'),
  integrationMoveSourceStgList: listIdForSlot(ANAE.souter, '2026-08-03', 'PM'),
  integrationSxList: listIdForSlot(ANAE.souter, '2026-07-28', 'PM'),
  integrationCphList: listIdForSlot(ANAE.souter, '2026-07-30', 'AM'),
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
    designDayAmList: {
      label: 'Design day AM list (done, unbilled)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.souterAm21,
      detail: "Souter, St George's / Mr Hale, 5 bookings all complete, DRAFT.",
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
      detail: 'Souter Fri 24 AM; selfFundedPrepayment split, $800 deposit on a $1,200 self funded fee. Unpaid: gate blocks completion.',
    },
    prepaymentPaidBooking: {
      label: 'Pre-payment booking (mixed + full, seeded paid)',
      entityType: 'booking',
      entityId: scenario.prepaymentPaid,
      detail: 'Souter Fri 24 PM; one hospital procedure + one full pre-payment (seeded PAID). Completes with no override; no balance invoice.',
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

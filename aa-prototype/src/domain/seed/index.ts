/**
 * buildSeed() — the deterministic pristine dataset the store hydrates from and
 * resetDemo() restores. Same seed, identical data (PROGRESS convention 5); no
 * Date.now(), no Math.random() anywhere in the seed path.
 *
 * Composition: masters + the canvas generator over the full horizon + fixups
 * that paint the design mockups' content (Tue 21 Jul design day, Souter's week
 * Mon 20 to Sun 26, the Thu 23 availability grid) + the card tableau and
 * scenario states + minimal staged audit + demo settings.
 */

import type {
  Anaesthetist,
  AnaesthetistAvailability,
  AnaesthetistId,
  AuditEntry,
  BillableParty,
  BillingLine,
  Card,
  Contract,
  ContractHolderOrganisation,
  ContractPrice,
  DemoSettings,
  Hospital,
  HospitalHoliday,
  Insurer,
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
import { RVG_CODES } from './rvgCodes'
import { buildCards, type CardScenarioIds } from './cards'

export { generateListsForDates, listIdForSlot, type CanvasMasters } from './canvas'
export { slotRng, hashStringToSeed } from './slotHash'
export { ANAE, HOSP, INS, SURG, ORG, ANAESTHETISTS } from './cast'
export { CONTRACT } from './contracts'
export { BP, PAT } from './patients'

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
  cards: Record<string, Card>
  procedures: Record<string, Procedure>
  billingLines: Record<string, BillingLine>
}

export interface SeedState {
  masters: SeedMasters
  schedule: SeedSchedule
  audit: AuditEntry[]
  settings: DemoSettings
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

// ---------------------------------------------------------------------------
// buildSeed
// ---------------------------------------------------------------------------

interface SeedBuild {
  state: SeedState
  scenario: CardScenarioIds
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

  const cardsBuild = buildCards(SEED, Object.values(lists))

  // The two seeded SUBMITTED lists awaiting authorisation (past dates — the
  // clock seeds at 08:00, so today's lists are DRAFT mid-capture).
  for (const id of [SEED_LIST_IDS.morrisonMon20, SEED_LIST_IDS.whitakerFri17]) {
    const list = lists[id]
    if (list !== undefined) lists[id] = { ...list, state: 'SUBMITTED' }
  }

  const patients = buildPatients(SEED)

  const state: SeedState = {
    masters: {
      anaesthetists: byId(ANAESTHETISTS, (a) => a.registrationNumber),
      surgeons: byId(SURGEONS, (s) => s.id),
      hospitals: byId(HOSPITALS, (h) => h.id),
      insurers: byId(INSURERS, (i) => i.id),
      organisations: byId(ORGANISATIONS, (o) => o.id),
      contracts: byId(CONTRACTS, (c) => c.id),
      contractPrices: byId(CONTRACT_PRICES, (p) => p.id),
      rvgCodes: byId(RVG_CODES, (r) => r.code),
      modifierCodes: byId(MODIFIER_CODES, (m) => m.code),
      listStatuses: byId(LIST_STATUSES, (s) => s.key),
      permanentLists: byId(PERMANENT_LISTS, (p) => p.id),
      availability: byId(AVAILABILITY, (a) => a.id),
      holidays: byId(HOSPITAL_HOLIDAYS, (h) => h.id),
      patients: byId(patients, (p) => p.hiddenInternalId),
      billableParties: byId(BILLABLE_PARTIES, (b) => b.hiddenInternalId),
    },
    schedule: {
      lists,
      cards: byId(cardsBuild.cards, (c) => c.id),
      procedures: byId(cardsBuild.procedures, (p) => p.id),
      billingLines: byId(cardsBuild.billingLines, (l) => l.id),
    },
    audit: cardsBuild.audit,
    settings: { contactArchiveInactivityDays: 90 },
    counters: {
      audit: cardsBuild.next.audit,
      card: cardsBuild.next.card,
      procedure: cardsBuild.next.procedure,
      billingLine: cardsBuild.next.billingLine,
      patient: patients.length + 1,
      billableParty: BILLABLE_PARTIES.length + 1,
      availability: AVAILABILITY.length + 1,
      list: 1,
      hospital: 1,
      contract: 1,
    },
  }

  return { state, scenario: cardsBuild.scenario }
}

/** The pristine seed state. Deterministic: two calls are deep-equal. */
export function buildSeed(): SeedState {
  return buildSeedInternal().state
}

/** Pinned slot-derived list ids the markers and tests reference. */
export const SEED_LIST_IDS = {
  souterAm21: listIdForSlot(ANAE.souter, DEMO_TODAY, 'AM'),
  souterPm21: listIdForSlot(ANAE.souter, DEMO_TODAY, 'PM'),
  rutherfordAm21: listIdForSlot(ANAE.rutherford, DEMO_TODAY, 'AM'),
  rutherfordPm21: listIdForSlot(ANAE.rutherford, DEMO_TODAY, 'PM'),
  morrisonMon20: listIdForSlot(ANAE.morrison, '2026-07-20', 'AM'),
  whitakerFri17: listIdForSlot(ANAE.whitaker, '2026-07-17', 'AM'),
} as const

// ---------------------------------------------------------------------------
// Seeded-scenario markers (the inspector's finder + the seed tests)
// ---------------------------------------------------------------------------

export interface SeedMarker {
  label: string
  entityType: 'list' | 'card' | 'procedure' | 'patient' | 'contract'
  entityId: string
  detail: string
}

function buildMarkers(scenario: CardScenarioIds): Record<string, SeedMarker> {
  return {
    designDayAmList: {
      label: 'Design day AM list (done, unbilled)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.souterAm21,
      detail: "Souter, St George's / Mr Hale, 5 cards all complete, DRAFT.",
    },
    designDayPmList: {
      label: 'Design day PM list (mid capture)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.souterPm21,
      detail: 'Souter, Southern Cross / Ms Patel, 4 cards, Ellison pending.',
    },
    pendingCaptureCard: {
      label: 'Pending capture card (Ellison)',
      entityType: 'card',
      entityId: scenario.ellison,
      detail: 'Margaret Ellison, hip replacement, the one card left to finish.',
    },
    overriddenTimeUnitsCard: {
      label: 'Manually adjusted T card (Chen)',
      entityType: 'card',
      entityId: scenario.chen,
      detail: 'Captured time units carry overridden provenance (Phase 07 flag).',
    },
    submittedListMorrison: {
      label: 'SUBMITTED list (Morrison, Mon 20)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.morrisonMon20,
      detail: "St George's / Mr Tan, 6 completed cards plus 1 cancelled, awaiting authorisation.",
    },
    submittedListWhitaker: {
      label: 'SUBMITTED list (Whitaker, Fri 17)',
      entityType: 'list',
      entityId: SEED_LIST_IDS.whitakerFri17,
      detail: 'Christchurch Public acute, 5 completed cards, awaiting authorisation.',
    },
    cancelledCard: {
      label: 'Cancelled card (audited soft cancel)',
      entityType: 'card',
      entityId: scenario.cancelled,
      detail: 'On the SUBMITTED Morrison list; visible, excluded from validation and billing.',
    },
    splitBillingCard: {
      label: 'Split billing multi procedure card',
      entityType: 'card',
      entityId: scenario.splitBilling,
      detail: 'Second procedure isAdditional: time units only on the BTM path.',
    },
    twoFunderCard: {
      label: 'One procedure, two funders',
      entityType: 'card',
      entityId: scenario.twoFunder,
      detail: 'Two stored rvg lines, one with a nib funder override; amounts conserve to the fee.',
    },
    rateTimeCard: {
      label: 'Rate x time card (Method 3)',
      entityType: 'card',
      entityId: scenario.rateTime,
      detail: 'Hourly rate line under the billable-party-held individual arrangement contract.',
    },
    bariatricType3Card: {
      label: 'Type 3 fixed price card (bariatric)',
      entityType: 'card',
      entityId: scenario.bariatric,
      detail: 'Mr Doyle price list; second procedure priced by the ordinal rule.',
    },
    cosAccContractCard: {
      label: 'Externally held ACC contract card (COS)',
      entityType: 'card',
      entityId: scenario.cosAcc,
      detail: 'Billed under the Canterbury Orthopaedic Surgeons ACC Type 2.',
    },
    accRelatedCard: {
      label: 'ACC related procedure (hospital route)',
      entityType: 'card',
      entityId: scenario.accRelated,
      detail: "Billed under St George's ACC Type 2; sources W4's ACC column.",
    },
    guardianMinorCard: {
      label: 'Guardian pays for a minor',
      entityType: 'card',
      entityId: scenario.guardianMinor,
      detail: 'Grace Park (12); billable party override set to her mother.',
    },
    prepaymentCard: {
      label: 'Pre-payment card (split deposit)',
      entityType: 'card',
      entityId: scenario.prepayment,
      detail: 'selfFundedPrepayment with typed split detail and an $800 deposit.',
    },
    insuredReimbursementCard: {
      label: 'Insured reimbursement card',
      entityType: 'card',
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
      detail: `Two episodes: cards ${scenario.repeatMitchell[0]} and ${scenario.repeatMitchell[1]}.`,
    },
    repeatPatientWalker: {
      label: 'Repeat patient (Hemi Walker)',
      entityType: 'patient',
      entityId: PAT.walker,
      detail: `Two episodes: cards ${scenario.repeatWalker[0]} and ${scenario.repeatWalker[1]}.`,
    },
    missingBillingRef1: {
      label: 'Missing billing reference 1 of 2',
      entityType: 'procedure',
      entityId: scenario.missingRefProcedures[0],
      detail: 'Hospital route procedure without a billing reference (Phase 07 flag).',
    },
    missingBillingRef2: {
      label: 'Missing billing reference 2 of 2',
      entityType: 'procedure',
      entityId: scenario.missingRefProcedures[1],
      detail: 'Hospital route procedure without a billing reference (Phase 07 flag).',
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
  }
}

/** Every seeded checklist state, one click away in the `/demo/data` finder. */
export const SEED_MARKERS: Readonly<Record<string, SeedMarker>> = buildMarkers(buildSeedInternal().scenario)

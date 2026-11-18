/**
 * Seed Bookings, Procedures and BillingLines — the design-day tableau, the
 * ready-made scenario states later phases rely on, and generic filler (past
 * two weeks rich, thinning about ten days out).
 *
 * This builder records authoritative staged lifecycle facts (submitted Lists,
 * the cancelled Booking, and pinned completions). `seed/audit.ts` then composes
 * those with deterministic booking, Procedure, fee-line and missing completion
 * history for every Booking, including generic and historical rows.
 */

import type {
  FeeSplit,
  AuditEntry,
  BillingLine,
  Booking,
  BookingCancellation,
  ProcedurePayer,
  BookingSource,
  IntegrationCorrelationRef,
  AssignedList,
  Procedure,
  ProcedureTextSource,
  RailAnswers,
} from '../types'
import { APPT, FEED } from '../integrations'
import { slotRng } from './slotHash'
import { projectedListId } from '../slots'
import { ANAE, ANAESTHETISTS, HOSP, INS } from './cast'
import { CONTRACT } from './contracts'
import { PRICED_ITEM } from './pricedItems'
import { HANA_PARK_PAYER, PAT, genericPatientIds } from './patients'
import { EYE_CODES, GENERAL_CODES, LEGACY_CODE_TO_RVG_GROUP, RVG_GROUP, rvgGroupIdForLegacyCode } from './rvgGroups'
import { compareSessions } from '../outOfHours'
import { claimsForSeedAsa } from './modifiers'
import { seedText } from './procedureText'
import { SOURCE_WORDING } from './sourceWording'

// ---------------------------------------------------------------------------
// Result & scenario id shapes
// ---------------------------------------------------------------------------

export interface BookingScenarioIds {
  tane: string
  marsh: string
  chen: string
  ellison: string
  splitBilling: string
  feeSplit: string
  cancelled: string
  contractRate: string
  contractRateCapture: string
  bariatric: string
  cosAcc: string
  accRelated: string
  guardianMinor: string
  prepayment: string
  prepaymentPaid: string
  billingFailure: string
  aiaClaim: string
  /** The Booking whose Contract the office left at Patient › Standard (catch-up Phase 20). */
  railPickUp: string
  /** A Booking that arrived with no Contract (the NHI-pending PDF Booking, catch-up Phase 20). */
  needsDestination: string
  provisionalNoNhi: string
  repeatMitchell: [string, string]
  repeatWalker: [string, string]
  /** Procedure ids with the deliberately missing billing references. */
  missingRefProcedures: [string, string]
  /** Phase 11 integration-origin Bookings (correlationRef set) the modify messages target. */
  integrationS13Time: string
  integrationS13Move: string
  integrationS14: string
  integrationS15: string
  integrationLockedTarget: string
  /** The generated, uncaptured future Booking re-coded to a Spine group (P1 included; catch-up Phase 19b). */
  includedModifier: string
}

export interface BookingsBuild {
  bookings: Booking[]
  procedures: Procedure[]
  billingLines: BillingLine[]
  audit: AuditEntry[]
  scenario: BookingScenarioIds
  /** Next free numeric suffix per entity (store counters continue from here). */
  next: { booking: number; procedure: number; billingLine: number; audit: number }
}

// ---------------------------------------------------------------------------
// Dates & helpers
// ---------------------------------------------------------------------------

const TUE21 = '2026-07-21'
const MON20 = '2026-07-20'
const WED22 = '2026-07-22'
const THU23 = '2026-07-23'
const FRI24 = '2026-07-24'
const MON27 = '2026-07-27'
const MON03_AUG = '2026-08-03'
const TUE04_AUG = '2026-08-04'
const THU09 = '2026-07-09'
const TUE14 = '2026-07-14'
const WED15 = '2026-07-15'
const THU16 = '2026-07-16'
const FRI17 = '2026-07-17'

const NAME_BY_ID = new Map(ANAESTHETISTS.map((a) => [a.registrationNumber, a.name]))
/** The legacy five-digit codes the scenarios and generator still name, through the one seed-only bridge (catch-up Phase 19). */
const RVG_BY_CODE = new Map(Object.entries(LEGACY_CODE_TO_RVG_GROUP))

function iso(dateISO: string, time: string): string {
  return `${dateISO}T${time}:00`
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** The seed clock instant (Tue 21 Jul 08:00 = DEMO_TODAY at 08:00): the
 *  modification stamp for bookings that have not yet been completed. */
const SEED_NOW_ISO = iso(TUE21, '08:00')

const REF_PREFIX: Record<string, string> = {
  [HOSP.stg]: 'SG',
  [HOSP.sx]: 'SX',
  [HOSP.forte]: 'FH',
  [HOSP.ces]: 'CE',
  [HOSP.cph]: 'HNZ',
}

/** The Contract the generic filler Bookings at each hospital are on (catch-up Phase 18 renamed it from the default map: SXAP and Health NZ are rate Contracts, not plain RVG). */
const FILLER_CONTRACT_BY_HOSPITAL: Record<string, string> = {
  [HOSP.stg]: CONTRACT.stgRvg,
  [HOSP.sx]: CONTRACT.sxap,
  [HOSP.forte]: CONTRACT.forteRvg,
  [HOSP.ces]: CONTRACT.cesRvg,
  [HOSP.cph]: CONTRACT.healthNz,
}

// ---------------------------------------------------------------------------
// The build
// ---------------------------------------------------------------------------

/** Hospitals with a seeded hospital feed (`domain/integrations` feeds). */
const FEED_HOSPITALS: ReadonlySet<string> = new Set([HOSP.stg, HOSP.sx, HOSP.cph])
/** The surgeon-PDF hospitals (`domain/integrations/pdfSamples.ts`). */
const PDF_HOSPITALS: ReadonlySet<string> = new Set([HOSP.forte, HOSP.ces])

/**
 * The seed's Booking source rule, in order: (1) a Booking the script describes
 * as phoned in or added by the anaesthetist (none is seeded today); (2) a
 * Booking with a correlation ref, or on a feed hospital's List, came from the
 * hospital download; (3) one at a surgeon-PDF hospital came from the surgeon's
 * PDF; (4) anything else (a List at AA rooms, or any other location) is an office entry.
 */
function seedSourceFor(booking: Booking, list: AssignedList | undefined): BookingSource {
  const hospitalId = list?.hospitalId
  if (booking.correlationRef !== undefined || (hospitalId !== undefined && FEED_HOSPITALS.has(hospitalId))) return 'hospitalDownload'
  if (hospitalId !== undefined && PDF_HOSPITALS.has(hospitalId)) return 'surgeonPdf'
  return 'admin'
}

/** Seeds Bookings on assigned Lists only (catch-up Phase 31: Draft Lists join the seed after this step). */
export function buildBookings(seed: number, lists: readonly AssignedList[]): BookingsBuild {
  const listById = new Map(lists.map((l) => [l.id, l]))

  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  // No seeded billing line since catch-up Phase 24 (Fitzgerald's rate x time line was the only one).
  const billingLines: BillingLine[] = []
  const audit: AuditEntry[] = []

  let bookingN = 0
  let procN = 0
  const lineN = 0
  let auditN = 0

  const pool = genericPatientIds()
  let poolIdx = 0
  /** Next unused generic patient, or null once the pool is spent. */
  const takePatient = (): string | null => {
    const id = pool[poolIdx]
    if (id === undefined) return null
    poolIdx += 1
    return id
  }

  interface BookingSpec {
    listId: string
    patientId: string
    scheduledTime?: string
    /** Completion time; presence marks the booking completed. */
    completedAtISO?: string
    cancellation?: BookingCancellation
    /** Write a booking.complete audit entry (staged bookings only). */
    auditComplete?: boolean
    /** Integration provenance (Phase 11) — modify messages locate the Booking by it. */
    correlationRef?: IntegrationCorrelationRef
    /**
     * The payer each of the Booking's Procedures takes (catch-up Phase 21; on
     * each Procedure since 22a): the patient unless given; `addProcedure`'s
     * own `payer` overrides it for one Procedure.
     */
    payer?: ProcedurePayer
  }

  /** The payer each Booking's Procedures default to (`BookingSpec.payer`), by Booking id. */
  const defaultPayerOf = new Map<string, ProcedurePayer>()

  function anaesthetistNameFor(listId: string): string {
    const list = listById.get(listId)
    return list !== undefined ? (NAME_BY_ID.get(list.anaesthetistId) ?? 'Unknown') : 'Unknown'
  }

  function addBooking(spec: BookingSpec): Booking {
    const list = listById.get(spec.listId)
    if (list === undefined) throw new Error(`seed booking references missing list ${spec.listId}`)
    bookingN += 1
    const who = anaesthetistNameFor(spec.listId)
    const booking: Booking = {
      id: `BK${String(bookingN).padStart(4, '0')}`,
      listId: spec.listId,
      patientId: spec.patientId,
      completed: spec.completedAtISO !== undefined,
      lastModifiedBy: spec.completedAtISO !== undefined ? who : 'Kirsty W.',
      // Completed bookings carry their completion time; not-yet-completed bookings
      // are stamped at the seed clock (Tue 21 Jul 08:00), never their list's
      // own date, so bookings on upcoming lists don't read "modified in the
      // future" relative to the demo clock (2026-07-23 review fix).
      lastModifiedAtISO: spec.completedAtISO ?? SEED_NOW_ISO,
    }
    if (spec.scheduledTime !== undefined) booking.scheduledTime = spec.scheduledTime
    if (spec.completedAtISO !== undefined) booking.completedAtISO = spec.completedAtISO
    if (spec.correlationRef !== undefined) booking.correlationRef = spec.correlationRef
    if (spec.cancellation !== undefined) {
      booking.cancellation = spec.cancellation
      booking.lastModifiedBy = spec.cancellation.by
      booking.lastModifiedAtISO = spec.cancellation.atISO
    }
    bookings.push(booking)
    if (spec.payer !== undefined) defaultPayerOf.set(booking.id, spec.payer)

    if (spec.auditComplete === true && spec.completedAtISO !== undefined) {
      auditN += 1
      audit.push({
        id: `A${String(auditN).padStart(4, '0')}`,
        entityType: 'booking',
        entityId: booking.id,
        who,
        role: 'anaesthetist',
        source: 'anaesthetist',
        action: 'booking.complete',
        after: { completed: true },
        atISO: spec.completedAtISO,
      })
    }
    if (spec.cancellation !== undefined) {
      auditN += 1
      audit.push({
        id: `A${String(auditN).padStart(4, '0')}`,
        entityType: 'booking',
        entityId: booking.id,
        who: spec.cancellation.by,
        role: spec.cancellation.role,
        source: spec.cancellation.source,
        action: 'booking.cancel',
        after: { cancelled: true, reason: spec.cancellation.reason },
        atISO: spec.cancellation.atISO,
      })
    }
    return booking
  }

  interface ProcedureSpec {
    /**
     * The procedure text as received (catch-up Phase 20a): stored verbatim; its
     * source and time come from `finaliseSeedProcedureTexts` unless given here.
     */
    procedureText: string
    textSource?: ProcedureTextSource
    textReceivedAtISO?: string
    /** A legacy five-digit code, written to the Procedure as its RVG group (`LEGACY_CODE_TO_RVG_GROUP`). */
    legacyCode?: string
    baseUnitsSelected?: number
    startISO?: string
    handoverISO?: string
    /**
     * The ASA grade the original build recorded (catch-up Phase 19b, RV-22):
     * never stored; mapped to a claim by `claimsForSeedAsa` (AS3 and AS4 claim
     * their code with an explanation, AS1 and AS2 nothing). The generator still
     * draws it, so the RNG sequence is unchanged.
     */
    asaClass?: 'AS1' | 'AS2' | 'AS3' | 'AS4'
    /** The Contract the office chose (catch-up Phase 20: exactly one per Procedure; none needs an invoice destination). */
    governingContractId?: string
    /** The step rail's answers so far on a Procedure with no Contract (catch-up Phase 20). */
    railAnswers?: RailAnswers
    prepaymentDetail?: { type: 'full' | 'split'; depositAmount?: number }
    billingReference?: string
    /** False on an additional Procedure (catch-up Phase 23); a Booking's first Procedure is its primary. */
    isPrimary?: boolean
    timeUnitsOverride?: number
    /** The fee split typed on the Booking (catch-up Phase 22; US-08.2.3). */
    split?: FeeSplit
    /** This Procedure's payer (catch-up Phase 22a): the Booking's default (`BookingSpec.payer`) unless given; Phase 23's seed uses it. */
    payer?: ProcedurePayer
  }

  function addProcedure(booking: Booking, spec: ProcedureSpec): Procedure {
    procN += 1
    const procedure: Procedure = {
      id: `P${String(procN).padStart(4, '0')}`,
      bookingId: booking.id,
      payer: spec.payer ?? defaultPayerOf.get(booking.id) ?? { kind: 'patient' },
      procedureText: seedText(spec.procedureText, spec.textSource, spec.textReceivedAtISO),
      invoiceDescription: null,
      isPrimary: spec.isPrimary ?? true,
      // Modifiers are recorded once for the Booking, on the primary (catch-up
      // Phase 23): an additional Procedure's seeded ASA claim was a duplicate
      // of its primary's (the bariatric AS3) or worth nothing (Holt's AS2).
      modifierClaims: spec.isPrimary === false ? [] : claimsForSeedAsa(spec.asaClass),
      removedModifierIds: [],
    }
    if (spec.legacyCode !== undefined) procedure.rvgGroupId = rvgGroupIdForLegacyCode(spec.legacyCode)
    if (spec.baseUnitsSelected !== undefined) procedure.baseUnitsSelected = spec.baseUnitsSelected
    if (spec.startISO !== undefined) procedure.anaestheticStartISO = spec.startISO
    if (spec.handoverISO !== undefined) procedure.handoverISO = spec.handoverISO
    if (spec.governingContractId !== undefined) procedure.governingContractId = spec.governingContractId
    if (spec.railAnswers !== undefined) procedure.railAnswers = spec.railAnswers
    if (spec.prepaymentDetail !== undefined) procedure.prepaymentDetail = spec.prepaymentDetail
    if (spec.billingReference !== undefined) procedure.billingReference = spec.billingReference
    if (spec.timeUnitsOverride !== undefined) {
      procedure.timeUnitsCaptured = { units: spec.timeUnitsOverride, source: 'overridden' }
    }
    if (spec.split !== undefined) procedure.split = spec.split
    procedures.push(procedure)
    return procedure
  }

  function addListAudit(listId: string, action: string, who: string, atISO: string): void {
    auditN += 1
    audit.push({
      id: `A${String(auditN).padStart(4, '0')}`,
      entityType: 'list',
      entityId: listId,
      who,
      role: 'anaesthetist',
      source: 'anaesthetist',
      action,
      after: { state: 'SUBMITTED' },
      atISO,
    })
  }

  // -------------------------------------------------------------------------
  // Souter's design day (Tue 21 Jul): AM St George's / Mr Hale, 5 complete
  // -------------------------------------------------------------------------

  const souterAm21 = projectedListId(ANAE.souter, TUE21, 'AM')
  const amSpecs = [
    { patient: PAT.walker, code: '47516', sched: '07:30', start: '07:34', end: '08:52', asa: 'AS2' as const, desc: 'Right total hip replacement' },
    { patient: takePatient() ?? PAT.walker, code: '47519', sched: '09:00', start: '09:00', end: '10:05', asa: 'AS3' as const, desc: 'Hip hemiarthroplasty' },
    // AR-35 row 3 (AI-made, illustrative; catch-up Phase 20a): the rooms' shorthand as received.
    { patient: takePatient() ?? PAT.walker, code: '49518', sched: '10:10', start: '10:12', end: '11:15', asa: 'AS1' as const, desc: SOURCE_WORDING[3].asReceived, textSource: SOURCE_WORDING[3].source },
    { patient: takePatient() ?? PAT.walker, code: '50120', sched: '11:20', start: '11:22', end: '12:10', asa: 'AS2' as const, desc: 'Femur ORIF, proximal' },
    { patient: takePatient() ?? PAT.walker, code: '49558', sched: '12:15', start: '12:15', end: '12:52', asa: 'AS1' as const, desc: 'Knee arthroscopy' },
  ]
  const amBookings: Booking[] = []
  amSpecs.forEach((s, i) => {
    const booking = addBooking({
      listId: souterAm21,
      patientId: s.patient,
      scheduledTime: s.sched,
      completedAtISO: iso(TUE21, minutesToTime(Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3)) + 4)),
      auditComplete: true,
    })
    addProcedure(booking, {
      procedureText: s.desc,
      ...('textSource' in s ? { textSource: s.textSource } : {}),
      legacyCode: s.code,
      startISO: iso(TUE21, s.start),
      handoverISO: iso(TUE21, s.end),
      asaClass: s.asa,
      governingContractId: CONTRACT.stgRvg,
      billingReference: `SG-2026-08${21 + i}`,
    })
    amBookings.push(booking)
  })

  // -------------------------------------------------------------------------
  // Souter PM Southern Cross / Ms Patel: the four mockup bookings
  // -------------------------------------------------------------------------

  const souterPm21 = projectedListId(ANAE.souter, TUE21, 'PM')

  const taneBooking = addBooking({
    listId: souterPm21,
    patientId: PAT.tane,
    scheduledTime: '13:00',
    completedAtISO: iso(TUE21, '14:22'),
    auditComplete: true,
  })
  addProcedure(taneBooking, {
    // AR-35 row 11 (illustrative): the rooms' text; "Hospital description arrives" demos row 12 replacing it.
    procedureText: SOURCE_WORDING[11].asReceived,
    textSource: SOURCE_WORDING[11].source,
    legacyCode: '20941',
    startISO: iso(TUE21, '13:02'),
    handoverISO: iso(TUE21, '14:18'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.sxap,
    billingReference: 'SX-2026-1201',
  })

  const marshBooking = addBooking({
    listId: souterPm21,
    patientId: PAT.marsh,
    scheduledTime: '14:15',
    completedAtISO: iso(TUE21, '15:09'),
    auditComplete: true,
  })
  addProcedure(marshBooking, {
    procedureText: 'Right knee arthroscopy',
    legacyCode: '49558',
    startISO: iso(TUE21, '14:20'),
    handoverISO: iso(TUE21, '15:05'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.nibRvg,
  })

  const chenBooking = addBooking({
    listId: souterPm21,
    patientId: PAT.chen,
    scheduledTime: '15:10',
    completedAtISO: iso(TUE21, '16:02'),
    auditComplete: true,
  })
  addProcedure(chenBooking, {
    // AR-35 row 13 (AI-made, illustrative; catch-up Phase 20a): the rooms' text as received.
    procedureText: SOURCE_WORDING[13].asReceived,
    textSource: SOURCE_WORDING[13].source,
    legacyCode: '49115',
    startISO: iso(TUE21, '15:12'),
    handoverISO: iso(TUE21, '15:58'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.noContractRvg,
    // The mockup's "T adjusted +1 manually" story: captured T carries
    // overridden provenance (Phase 07's review flag keys off this).
    timeUnitsOverride: 4,
  })

  const ellisonBooking = addBooking({
    listId: souterPm21,
    patientId: PAT.ellison,
    scheduledTime: '16:00',
  })
  addProcedure(ellisonBooking, {
    procedureText: 'Left total hip replacement',
    legacyCode: '47516',
    // No handover: the finish is stamped LIVE in the demo ("Tap Finish now →
    // fee ticks up", the mockup's demo script). The post-capture $344.50/13u
    // pins moved to btmCapture.test.ts (Decisions log 2026-07-23).
    startISO: iso(TUE21, '16:05'),
    asaClass: 'AS1',
    // Margaret Ellison is 72 on 21 Jul 2026, so A1 (1 unit) is pre-applied from
    // her age (catch-up Phase 19b, US-03.3.8), keeping the pinned $344.50 fee;
    // it is no longer a claim.
    governingContractId: CONTRACT.sxap,
    billingReference: 'SX-2026-1204',
  })

  // -------------------------------------------------------------------------
  // Morrison Mon 20 St George's / Mr Tan — SUBMITTED, 6 complete + 1 cancelled
  // -------------------------------------------------------------------------

  const morrisonMon20 = projectedListId(ANAE.morrison, MON20, 'AM')
  const morrisonSpecs = [
    { code: '36840', start: '08:04', end: '09:10', asa: 'AS3' as const, desc: 'TURP', ref: 'SG-2026-0771' },
    // Deliberately missing billing reference #1 (Phase 07 reference-completeness flag).
    { code: '36561', start: '09:18', end: '09:52', asa: 'AS1' as const, desc: 'Cystoscopy' },
    { code: '37623', start: '10:00', end: '10:56', asa: 'AS2' as const, desc: 'Ureteroscopy with lithotripsy, ACC claim', ref: 'ACC45-118203', acc: true },
    { code: '36840', start: '11:04', end: '12:02', asa: 'AS2' as const, desc: 'TURP', ref: 'SG-2026-0774' },
    { code: '36561', start: '12:10', end: '12:38', asa: 'AS1' as const, desc: 'Cystoscopy', ref: 'SG-2026-0775' },
    { code: '37623', start: '12:44', end: '13:22', asa: 'AS1' as const, desc: 'Ureteroscopy with lithotripsy', ref: 'SG-2026-0776' },
  ]
  let missingRefProc1 = ''
  let accRelatedBookingId = ''
  morrisonSpecs.forEach((s, i) => {
    const booking = addBooking({
      listId: morrisonMon20,
      patientId: takePatient() ?? PAT.walker,
      scheduledTime: s.start,
      completedAtISO: iso(MON20, minutesToTime(Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3)) + 5)),
      auditComplete: true,
    })
    const procedure = addProcedure(booking, {
      procedureText: s.desc,
      legacyCode: s.code,
      startISO: iso(MON20, s.start),
      handoverISO: iso(MON20, s.end),
      asaClass: s.asa,
      governingContractId: s.acc === true ? CONTRACT.stgAcc : CONTRACT.stgRvg,
      ...(s.ref !== undefined ? { billingReference: s.ref } : {}),
    })
    if (i === 1) missingRefProc1 = procedure.id
    if (s.acc === true) accRelatedBookingId = booking.id
  })

  const cancelledBooking = addBooking({
    listId: morrisonMon20,
    patientId: PAT.gray,
    scheduledTime: '12:45',
    cancellation: {
      reason: 'Patient unwell on admission, procedure postponed',
      by: 'Kirsty W.',
      role: 'office',
      source: 'office',
      atISO: iso(MON20, '09:05'),
    },
  })
  addProcedure(cancelledBooking, {
    procedureText: 'Cystoscopy',
    legacyCode: '36561',
    governingContractId: CONTRACT.stgRvg,
    billingReference: 'SG-2026-0777',
  })

  // After her last completion (13:27): a submit is completion-gated, and catch-up
  // Phase 38a's "Changed since submitted" reads every anaesthetist write after it
  // (it was 13:10, before two of her own seeded completions).
  addListAudit(morrisonMon20, 'list.submit', 'Dr Kate Morrison', iso(MON20, '13:35'))

  // -------------------------------------------------------------------------
  // Whitaker Fri 17 Christchurch Public acute — SUBMITTED, 5 complete
  // -------------------------------------------------------------------------

  const whitakerFri17 = projectedListId(ANAE.whitaker, FRI17, 'AM')
  const whitakerSpecs = [
    { patient: PAT.walker, code: '20950', start: '07:40', end: '08:46', asa: 'AS2' as const, desc: 'Appendicectomy, laparoscopic', ref: 'HNZ-2026-3311' },
    { patient: takePatient() ?? PAT.walker, code: '20941', start: '08:55', end: '10:02', asa: 'AS1' as const, desc: 'Laparoscopic cholecystectomy', ref: 'HNZ-2026-3312' },
    { patient: takePatient() ?? PAT.walker, code: '46360', start: '10:10', end: '11:00', asa: 'AS1' as const, desc: 'Wrist ORIF, distal radius', ref: 'HNZ-2026-3313' },
    { patient: takePatient() ?? PAT.walker, code: '49115', start: '11:08', end: '11:52', asa: 'AS2' as const, desc: 'Inguinal hernia repair', ref: 'HNZ-2026-3314' },
    { patient: takePatient() ?? PAT.walker, code: '20905', start: '12:00', end: '13:10', asa: 'AS3' as const, desc: 'Laparotomy, exploratory', ref: 'HNZ-2026-3315' },
  ]
  const whitakerBookings: Booking[] = []
  for (const s of whitakerSpecs) {
    const booking = addBooking({
      listId: whitakerFri17,
      patientId: s.patient,
      scheduledTime: s.start,
      completedAtISO: iso(FRI17, minutesToTime(Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3)) + 5)),
      auditComplete: true,
    })
    addProcedure(booking, {
      procedureText: s.desc,
      legacyCode: s.code,
      startISO: iso(FRI17, s.start),
      handoverISO: iso(FRI17, s.end),
      asaClass: s.asa,
      governingContractId: CONTRACT.healthNz,
      billingReference: s.ref,
    })
    whitakerBookings.push(booking)
  }
  addListAudit(whitakerFri17, 'list.submit', 'Dr Ben Whitaker', iso(FRI17, '16:38'))

  // -------------------------------------------------------------------------
  // Souter Mon 20 AM Forte / Mr Okafor — the multi-procedure Booking (Holt) + missing ref #2
  // -------------------------------------------------------------------------

  const souterMon20Am = projectedListId(ANAE.souter, MON20, 'AM')

  const splitBooking = addBooking({
    listId: souterMon20Am,
    patientId: PAT.holt,
    scheduledTime: '08:00',
    completedAtISO: iso(MON20, '09:50'),
    auditComplete: true,
  })
  addProcedure(splitBooking, {
    procedureText: 'Inguinal hernia repair',
    legacyCode: '49115',
    startISO: iso(MON20, '08:05'),
    handoverISO: iso(MON20, '09:15'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.forteRvg,
    billingReference: 'FH-2026-2101',
  })
  addProcedure(splitBooking, {
    procedureText: 'Umbilical hernia repair, same anaesthetic',
    legacyCode: '49120',
    startISO: iso(MON20, '09:15'),
    handoverISO: iso(MON20, '09:45'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.forteRvg,
    billingReference: 'FH-2026-2101',
    isPrimary: false,
  })

  const missingRefBooking = addBooking({
    listId: souterMon20Am,
    patientId: takePatient() ?? PAT.holt,
    scheduledTime: '09:55',
    completedAtISO: iso(MON20, '11:05'),
    auditComplete: true,
  })
  // Deliberately missing billing reference #2.
  const missingRefProc2 = addProcedure(missingRefBooking, {
    procedureText: 'Laparoscopic cholecystectomy',
    legacyCode: '20941',
    startISO: iso(MON20, '09:58'),
    handoverISO: iso(MON20, '11:00'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.forteRvg,
  })

  const monAmFiller = addBooking({
    listId: souterMon20Am,
    patientId: takePatient() ?? PAT.holt,
    scheduledTime: '11:10',
    completedAtISO: iso(MON20, '12:10'),
    auditComplete: true,
  })
  addProcedure(monAmFiller, {
    procedureText: 'Appendicectomy, laparoscopic',
    legacyCode: '20950',
    startISO: iso(MON20, '11:12'),
    handoverISO: iso(MON20, '12:05'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.forteRvg,
    billingReference: 'FH-2026-2103',
  })
  addListAudit(souterMon20Am, 'list.submit', NAME_BY_ID.get(ANAE.souter) ?? 'Dr Melanie Souter', iso(MON20, '12:20'))

  // -------------------------------------------------------------------------
  // Souter Mon 20 PM St George's / Ms Lim: the fee-split booking
  // -------------------------------------------------------------------------

  const souterMon20Pm = projectedListId(ANAE.souter, MON20, 'PM')

  // Fee: B4 + T4 (60 min) + M0 (AS1) = 8 units x $26.50 = $212.00, on No
  // contract · RVG, which bills the Procedure's payer (Alan Prentice).
  // The office split the fee on the Booking (catch-up Phase 22; US-08.2.3):
  // nib pays $132.50 and Alan the rest, each invoiced on its own invoice.
  const feeSplitBooking = addBooking({
    listId: souterMon20Pm,
    patientId: PAT.prentice,
    scheduledTime: '14:00',
    completedAtISO: iso(MON20, '15:05'),
    auditComplete: true,
  })
  addProcedure(feeSplitBooking, {
    procedureText: 'Knee arthroscopy',
    legacyCode: '49558',
    startISO: iso(MON20, '14:00'),
    handoverISO: iso(MON20, '15:00'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.noContractRvg,
    billingReference: 'SG-2026-0791',
    split: {
      shares: [
        { party: { kind: 'insurer', id: INS.nib }, basis: { kind: 'amount', amountExGst: 132.5 } },
        { party: { kind: 'patient', id: PAT.prentice }, basis: { kind: 'rest' } },
      ],
    },
  })

  const rangeBooking = addBooking({
    listId: souterMon20Pm,
    patientId: takePatient() ?? PAT.prentice,
    scheduledTime: '15:15',
    completedAtISO: iso(MON20, '16:25'),
    auditComplete: true,
  })
  addProcedure(rangeBooking, {
    procedureText: 'Complex skin flap repair',
    legacyCode: '45030',
    baseUnitsSelected: 5,
    startISO: iso(MON20, '15:15'),
    handoverISO: iso(MON20, '16:20'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.stgRvg,
    billingReference: 'SG-2026-0792',
  })

  const monPmFiller = addBooking({
    listId: souterMon20Pm,
    patientId: takePatient() ?? PAT.prentice,
    scheduledTime: '16:30',
    completedAtISO: iso(MON20, '17:30'),
    auditComplete: true,
  })
  addProcedure(monPmFiller, {
    procedureText: 'Breast reduction',
    legacyCode: '45200',
    startISO: iso(MON20, '16:30'),
    handoverISO: iso(MON20, '17:25'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.stgRvg,
    billingReference: 'SG-2026-0793',
  })
  addListAudit(souterMon20Pm, 'list.submit', NAME_BY_ID.get(ANAE.souter) ?? 'Dr Melanie Souter', iso(MON20, '17:40'))

  // -------------------------------------------------------------------------
  // Scenario bookings on past lists
  // -------------------------------------------------------------------------

  // Bariatric fixed price (Fitzgerald, Tue 14 Jul, Southern Cross / Mr Doyle):
  // the gastric bypass on Doyle's "Gastric bypass" Contract at its range in
  // force ($2,800). Catch-up Phase 19a (RV-07, OQ-90): no Contract prices a
  // second procedure, so the old ordinal row went and the concurrent hernia
  // repair is on No contract · RVG. Under the multi-procedure rule (catch-up
  // Phase 23) it is the RVG-priced additional procedure of a mixed Booking:
  // its own time units, no base billed (OQ-132, provisional). No contract ·
  // RVG is AA's and bills the Procedure's payer (AA, its holder, is never
  // billed); since catch-up Phase 21 the bypass bills the payer too.
  const fitzTue14 = projectedListId(ANAE.fitzgerald, TUE14, 'AM')
  const bariatricBooking = addBooking({
    listId: fitzTue14,
    patientId: PAT.mills,
    scheduledTime: '08:00',
    completedAtISO: iso(TUE14, '10:50'),
    auditComplete: true,
  })
  addProcedure(bariatricBooking, {
    procedureText: 'Gastric bypass, laparoscopic',
    legacyCode: '20880',
    baseUnitsSelected: 10,
    startISO: iso(TUE14, '08:10'),
    handoverISO: iso(TUE14, '10:15'),
    asaClass: 'AS3',
    governingContractId: CONTRACT.doyleBariatric,
    // Doyle's price list bills the Procedure's payer (catch-up Phase 21,
    // US-11.2.1): until then the retired contract-holder route billed Mr Doyle.
    billingReference: 'BAR-2026-014',
  })
  addProcedure(bariatricBooking, {
    procedureText: 'Umbilical hernia repair, concurrent',
    legacyCode: '49120',
    startISO: iso(TUE14, '10:15'),
    handoverISO: iso(TUE14, '10:45'),
    asaClass: 'AS3',
    governingContractId: CONTRACT.noContractRvg,
    isPrimary: false,
  })

  // RVG at the Contract's rate on Aria's Contract (Fitzgerald, Wed 15 Jul,
  // Forte / Ms Lim). Until catch-up Phase 24 a rate x time line (3.0 hours at
  // $480, $1,440); now the abdominoplasty's A5 base 8, 08:30 to 11:30 (T 14),
  // no modifiers, at Aria's $26.50: 22 units, $583.00.
  const fitzWed15 = projectedListId(ANAE.fitzgerald, WED15, 'AM')
  const contractRateBooking = addBooking({
    listId: fitzWed15,
    patientId: PAT.bennett,
    scheduledTime: '08:30',
    completedAtISO: iso(WED15, '11:45'),
    auditComplete: true,
  })
  const contractRateProc = addProcedure(contractRateBooking, {
    procedureText: 'Abdominoplasty (Aria Skin and Laser Clinic)',
    governingContractId: CONTRACT.ariaContractRate,
    startISO: iso(WED15, '08:30'),
    handoverISO: iso(WED15, '11:30'),
  })
  contractRateProc.rvgGroupId = RVG_GROUP['a5']

  // An AIA claim: the patient pays on No contract · RVG and claims back from AIA
  // Health; AIA is named only in the description (catch-up Phase 20).
  const ruthThu16 = projectedListId(ANAE.rutherford, THU16, 'AM')
  const reimbursementBooking = addBooking({
    listId: ruthThu16,
    patientId: PAT.webb,
    scheduledTime: '08:15',
    completedAtISO: iso(THU16, '09:35'),
    auditComplete: true,
  })
  addProcedure(reimbursementBooking, {
    procedureText: 'Shoulder arthroscopy, patient to claim from AIA Health (reimbursement)',
    legacyCode: '48939',
    startISO: iso(THU16, '08:20'),
    handoverISO: iso(THU16, '09:30'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.noContractRvg,
  })

  // COS externally held ACC contract (Rutherford, Thu 9 Jul, STG / Mr Hale).
  const ruthThu09 = projectedListId(ANAE.rutherford, THU09, 'AM')
  const cosAccBooking = addBooking({
    listId: ruthThu09,
    patientId: PAT.foster,
    scheduledTime: '08:00',
    completedAtISO: iso(THU09, '09:30'),
    auditComplete: true,
  })
  addProcedure(cosAccBooking, {
    procedureText: 'ACL reconstruction, ACC claim via Canterbury Orthopaedic Surgeons',
    legacyCode: '49561',
    startISO: iso(THU09, '08:05'),
    handoverISO: iso(THU09, '09:25'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.cosAcc,
    billingReference: 'ACC45-104772',
  })

  // Repeat patient: Sarah Mitchell's first episode (Sharma, Tue 14 Jul, CPH).
  const sharmaTue14 = projectedListId(ANAE.sharma, TUE14, 'AM')
  const mitchellFirst = addBooking({
    listId: sharmaTue14,
    patientId: PAT.mitchell,
    scheduledTime: '08:00',
    completedAtISO: iso(TUE14, '09:10'),
    auditComplete: true,
  })
  addProcedure(mitchellFirst, {
    procedureText: 'Appendicectomy, laparoscopic',
    legacyCode: '20950',
    startISO: iso(TUE14, '08:10'),
    handoverISO: iso(TUE14, '09:05'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.healthNz,
    billingReference: 'HNZ-2026-3102',
  })

  // -------------------------------------------------------------------------
  // Scenario bookings on upcoming lists
  // -------------------------------------------------------------------------

  // Guardian pays for a minor (Grace Park, 12) — Chen, Fri 24 Jul, CES / Reid.
  const chenFri24 = projectedListId(ANAE.chen, FRI24, 'AM')
  const guardianBooking = addBooking({
    listId: chenFri24,
    patientId: PAT.park,
    scheduledTime: '08:30',
    payer: HANA_PARK_PAYER,
  })
  addProcedure(guardianBooking, {
    procedureText: 'Strabismus correction, guardian to be invoiced',
    legacyCode: '42794',
    governingContractId: CONTRACT.noContractRvg,
  })

  // Pre-payment (split deposit) — the UNPAID exemplar, on Souter's own Fri 24
  // AM list so the unpaid-prepayment warning is reachable in the mobile app
  // (Phase 09; B7; a warning, never a block, since catch-up Phase 15a / D5). A self funded cosmetic case billed as a flat
  // agreed professional fee ($1,200), so an $800 deposit leaves a coherent
  // $400 balance (deposit + balance = the full fee).
  const souterFri24Am = projectedListId(ANAE.souter, FRI24, 'AM')
  const prepaymentBooking = addBooking({
    listId: souterFri24Am,
    patientId: PAT.riley,
    scheduledTime: '09:00',
  })
  // Catch-up Phase 20: on Dr Souter's own prepaid price list (Rhinoplasty,
  // $1,200 in force on 24 Jul), which is what requires the prepayment; the
  // $1,200 is the Contract's price, no longer a typed billing line.
  addProcedure(prepaymentBooking, {
    procedureText: 'Rhinoplasty, self funded, pre-payment required',
    governingContractId: PRICED_ITEM.souterRhinoplasty,
    prepaymentDetail: { type: 'split', depositAmount: 800 },
  })

  // Provisional no-NHI patient (PDF pathway) + Sarah Mitchell's repeat episode
  // — Souter, Mon 27 Jul, Forte / Mr Okafor.
  const souterMon27 = projectedListId(ANAE.souter, MON27, 'AM')
  const provisionalBooking = addBooking({
    listId: souterMon27,
    patientId: PAT.provisional,
    scheduledTime: '08:00',
  })
  addProcedure(provisionalBooking, {
    procedureText: 'Inguinal hernia repair, booked from PDF referral (NHI pending)',
    legacyCode: '49115',
  })
  const mitchellRepeat = addBooking({
    listId: souterMon27,
    patientId: PAT.mitchell,
    scheduledTime: '09:30',
  })
  addProcedure(mitchellRepeat, {
    procedureText: 'Laparoscopic cholecystectomy',
    legacyCode: '20941',
    governingContractId: CONTRACT.forteRvg,
    billingReference: 'FH-2026-2140',
  })

  // Aria at the Contract's rate, uncaptured (Phase 04; catch-up Phase 24): on
  // Souter's own pinned Mon 27 List so the phone reaches it; her price line
  // reads the units at Aria's $26.50, read-only (the override is off).
  const contractRateCaptureBooking = addBooking({
    listId: souterMon27,
    patientId: PAT.sinclair,
    scheduledTime: '10:45',
  })
  addProcedure(contractRateCaptureBooking, {
    procedureText: 'Laser skin resurfacing (Aria Skin and Laser Clinic)',
    governingContractId: CONTRACT.ariaContractRate,
  })

  // MIXED + FULL pre-payment booking, designated for the seeded PAID pre-invoice
  // (Phase 09; B7) — Souter Fri 24 PM. One hospital-funded procedure that bills
  // normally, plus one BillableParty selfFundedPrepayment{full} procedure whose
  // full fee is pre-invoiced and seeded paid (see domain/seed/billing.ts): it
  // demos the mixed case (hospital portion untouched), the full case (no balance
  // invoice) and the paid state (no prepayment warning). Left NOT completed so
  // the presenter can complete it live; both procedures carry full capture.
  const souterFri24Pm = projectedListId(ANAE.souter, FRI24, 'PM')
  const prepaidBooking = addBooking({
    listId: souterFri24Pm,
    patientId: PAT.nair,
    scheduledTime: '13:00',
  })
  addProcedure(prepaidBooking, {
    procedureText: 'Septoplasty, hospital funded',
    legacyCode: '41789',
    startISO: iso(FRI24, '13:00'),
    handoverISO: iso(FRI24, '14:00'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.forteRvg,
    billingReference: 'FH-2026-2150',
  })
  addProcedure(prepaidBooking, {
    procedureText: 'Rhinoplasty, cosmetic component, self funded (pre-paid in full)',
    legacyCode: '41800',
    startISO: iso(FRI24, '14:00'),
    handoverISO: iso(FRI24, '15:00'),
    asaClass: 'AS1',
    // Catch-up Phase 20: Dr Souter's prepaid price list, at the $238.50 she prepaid.
    governingContractId: PRICED_ITEM.souterRhinoCosmetic,
    prepaymentDetail: { type: 'full' },
    // Additional (catch-up Phase 23): exactly one primary per Booking. A fixed price, so nothing moves.
    isPrimary: false,
  })

  // Billing FAILURE exemplar (Phase 09; A5) — a dedicated SUBMITTED, complete,
  // MULTI-booking list (Ropata, Thu 16 Jul, St George's / Mr Hale). The failing
  // booking is on the COS ACC rate Contract; since catch-up Phase 25 the
  // billing-failure demo trigger arms a Xero hand-off fault for it alone and
  // authorises this list, so it is held back at the hand-off while the clean
  // hospital-route sibling invoices, demonstrating per-booking isolation.
  const ropataThu16 = projectedListId(ANAE.ropata, THU16, 'AM')
  const failureBooking = addBooking({
    listId: ropataThu16,
    patientId: PAT.tuilagi,
    scheduledTime: '08:00',
    completedAtISO: iso(THU16, '09:35'),
    auditComplete: true,
  })
  addProcedure(failureBooking, {
    procedureText: 'ACL reconstruction, ACC via Canterbury Orthopaedic Surgeons',
    legacyCode: '49561',
    startISO: iso(THU16, '08:05'),
    handoverISO: iso(THU16, '09:30'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.cosAcc,
    billingReference: 'ACC45-118844',
  })
  const failureSiblingBooking = addBooking({
    listId: ropataThu16,
    patientId: PAT.walker,
    scheduledTime: '09:45',
    completedAtISO: iso(THU16, '10:40'),
    auditComplete: true,
  })
  addProcedure(failureSiblingBooking, {
    procedureText: 'Knee arthroscopy',
    legacyCode: '49558',
    startISO: iso(THU16, '09:50'),
    handoverISO: iso(THU16, '10:35'),
    asaClass: 'AS1',
    governingContractId: CONTRACT.stgRvg,
    billingReference: 'SG-2026-0810',
  })
  addListAudit(ropataThu16, 'list.submit', NAME_BY_ID.get(ANAE.ropata) ?? 'Dr Hannah Ropata', iso(THU16, '11:00'))

  // -------------------------------------------------------------------------
  // Integration-origin bookings (Phase 11) — bookings that arrived via the St
  // George's feed, each carrying `{sourceFeedId, externalAppointmentId}` so the
  // S13/S14/S15 messages locate them by appointment id (never patient
  // guesswork). Their forward ACTIVE St George's Lists are deliberately separate
  // from Tue 28 AM, so a modify message can never be confused with S1's own
  // create. The fifth is on a SUBMITTED List (closed to integrations) for manual
  // intervention.
  // -------------------------------------------------------------------------

  const souterTue28Am = projectedListId(ANAE.souter, '2026-07-28', 'AM')
  const souterTue04AugAm = projectedListId(ANAE.souter, TUE04_AUG, 'AM')
  const souterMon03AugPm = projectedListId(ANAE.souter, MON03_AUG, 'PM')
  // Delaney Fri 17 AM (St George's / Mr Doyle) — a real past operating list (Delaney
  // is not on leave then; Beaumont/Morrison/Whitaker were unsuitable). Marked
  // SUBMITTED in index.ts to host the locked-target Booking.
  const delaneyFri17Am = projectedListId(ANAE.delaney, FRI17, 'AM')

  const stgRef = (appointmentId: string): IntegrationCorrelationRef => ({ sourceFeedId: FEED.stg, externalAppointmentId: appointmentId })

  const s13TimeBooking = addBooking({ listId: souterTue04AugAm, patientId: PAT.holt, scheduledTime: '08:30', correlationRef: stgRef(APPT.s13Time) })
  addProcedure(s13TimeBooking, { procedureText: 'Knee arthroscopy', legacyCode: '49558', governingContractId: CONTRACT.stgRvg, billingReference: 'SG-2026-0901' })

  const s13MoveBooking = addBooking({ listId: souterMon03AugPm, patientId: PAT.webb, scheduledTime: '13:30', correlationRef: stgRef(APPT.s13Move) })
  addProcedure(s13MoveBooking, { procedureText: 'Wrist ORIF, distal radius', legacyCode: '46360', governingContractId: CONTRACT.stgRvg, billingReference: 'SG-2026-0902' })

  const s14Booking = addBooking({ listId: souterTue04AugAm, patientId: PAT.foster, scheduledTime: '11:00', correlationRef: stgRef(APPT.s14) })
  // AR-35 row 26 (illustrative; catch-up Phase 20a): the rooms' "WLE MM", which MSG-STG-1012's row 27 replaces. The one
  // recorded parity exception: its RVG code is cleared (the site is not given) and it sits on No contract · RVG. Forward
  // ACTIVE List, uncaptured, never invoiced.
  addProcedure(s14Booking, { procedureText: SOURCE_WORDING[26].asReceived, textSource: SOURCE_WORDING[26].source, governingContractId: CONTRACT.noContractRvg, billingReference: 'SG-2026-0903' })

  const s15Booking = addBooking({ listId: souterTue04AugAm, patientId: PAT.gray, scheduledTime: '12:00', correlationRef: stgRef(APPT.s15) })
  addProcedure(s15Booking, { procedureText: 'Cystoscopy', legacyCode: '36561', governingContractId: CONTRACT.stgRvg, billingReference: 'SG-2026-0904' })

  // Locked target on a SUBMITTED List (Delaney Fri 17, St George's / Mr Doyle):
  // completed + valid, so index.ts marks the List SUBMITTED. The S14
  // locked-target message addresses it and parks as manual-intervention.
  const lockedTargetBooking = addBooking({
    listId: delaneyFri17Am,
    patientId: PAT.prentice,
    scheduledTime: '10:00',
    completedAtISO: iso(FRI17, '11:05'),
    auditComplete: true,
    correlationRef: stgRef(APPT.lockedTarget),
  })
  addProcedure(lockedTargetBooking, {
    procedureText: 'TURP',
    legacyCode: '36840',
    startISO: iso(FRI17, '10:05'),
    handoverISO: iso(FRI17, '11:00'),
    asaClass: 'AS2',
    governingContractId: CONTRACT.stgRvg,
    billingReference: 'SG-2026-0905',
  })

  // -------------------------------------------------------------------------
  // Near-future mockup counts: Wed 22 CES x6, Thu 23 CPH x8 + pre-op x6
  // -------------------------------------------------------------------------

  const wed22Ces = projectedListId(ANAE.souter, WED22, 'AM')
  const eyeSpecs = ['42702', '42702', '42725', '42794', '42702', '42725']
  eyeSpecs.forEach((code, i) => {
    const patient = takePatient()
    if (patient === null) return
    const booking = addBooking({
      listId: wed22Ces,
      patientId: patient,
      scheduledTime: minutesToTime(8 * 60 + i * 40),
    })
    const rvg = RVG_BY_CODE.get(code)
    addProcedure(booking, {
      procedureText: rvg?.description ?? 'Eye procedure',
      legacyCode: code,
      governingContractId: CONTRACT.cesRvg,
      billingReference: `CE-2026-05${41 + i}`,
    })
  })

  const thu23Cph = projectedListId(ANAE.souter, THU23, 'AM')
  const acuteSpecs = ['20950', '49115', '20941', '46360', '20905', '49120', '36561', '20950']
  acuteSpecs.forEach((code, i) => {
    const patient = takePatient()
    if (patient === null) return
    const booking = addBooking({
      listId: thu23Cph,
      patientId: patient,
      scheduledTime: minutesToTime(7 * 60 + 45 + i * 35),
    })
    const rvg = RVG_BY_CODE.get(code)
    addProcedure(booking, {
      procedureText: rvg?.description ?? 'Acute procedure',
      legacyCode: code,
      governingContractId: CONTRACT.healthNz,
      billingReference: `HNZ-2026-34${11 + i}`,
    })
  })

  // Catch-up Phase 20: no Contract chosen yet, so each "Needs an invoice
  // destination" and waits on the office's list. The office has answered the
  // first as far as Patient › Standard, for Dr Souter to pick up and finish.
  const thu23Preop = projectedListId(ANAE.souter, THU23, 'PM')
  let railPickUpBookingId = ''
  for (let i = 0; i < 6; i++) {
    const patient = takePatient()
    if (patient === null) break
    const booking = addBooking({
      listId: thu23Preop,
      patientId: patient,
      scheduledTime: minutesToTime(13 * 60 + i * 40),
    })
    addProcedure(booking, {
      procedureText: 'Pre-op assessment',
      ...(i === 0 ? { railAnswers: { destination: 'patient' as const, narrow: 'standard' } } : {}),
    })
    if (i === 0) railPickUpBookingId = booking.id
  }

  // -------------------------------------------------------------------------
  // Souter Tue 28 AM St George's / Mr Hale — S1's booked-but-not-captured list
  //
  // The S1 headline still turns on the S12 message arriving visibly, so these
  // three stay uncaptured and Sarah Mitchell lands among them at 08:30 as the
  // fourth row. Deliberately no completions: a List a week out has none, and
  // the demo's interest is the arrival and the capture, not the submit (three
  // incomplete Bookings keep the List's completion gate closed, by design).
  // -------------------------------------------------------------------------

  // AR-35 rows 6 and 8 (AI-made, illustrative; catch-up Phase 20a) on the 07:45 and 11:15 cases, as the rooms sent them.
  const tue28AmSpecs: { sched: string; code: string; ref: string; wording?: { asReceived: string; source: ProcedureTextSource } }[] = [
    { sched: '07:45', code: '49558', ref: 'SG-2026-0911', wording: SOURCE_WORDING[6] },
    { sched: '09:45', code: '48939', ref: 'SG-2026-0912' },
    { sched: '11:15', code: '46360', ref: 'SG-2026-0913', wording: SOURCE_WORDING[8] },
  ]
  tue28AmSpecs.forEach((s) => {
    const patient = takePatient()
    if (patient === null) return
    const booking = addBooking({
      listId: souterTue28Am,
      patientId: patient,
      scheduledTime: s.sched,
    })
    addProcedure(booking, {
      procedureText: s.wording?.asReceived ?? RVG_BY_CODE.get(s.code)?.description ?? 'Orthopaedic procedure',
      ...(s.wording !== undefined ? { textSource: s.wording.source } : {}),
      legacyCode: s.code,
      governingContractId: CONTRACT.stgRvg,
      billingReference: s.ref,
    })
  })

  // -------------------------------------------------------------------------
  // Generic filler — past two weeks rich, today mid-capture, thinning to +10d
  // -------------------------------------------------------------------------

  const pinnedListIds = new Set<string>([
    souterAm21, souterPm21, morrisonMon20, whitakerFri17, souterMon20Am, souterMon20Pm,
    fitzTue14, fitzWed15, ruthThu16, ruthThu09, sharmaTue14, chenFri24,
    souterMon27, souterFri24Am, souterFri24Pm, ropataThu16, wed22Ces, thu23Cph, thu23Preop,
    // Phase 11 integration demo lists: S1's S12 destination (hand-authored
    // above), the separate seeded modify targets, and the create destinations.
    souterTue28Am, souterTue04AugAm, souterMon03AugPm, delaneyFri17Am,
    projectedListId(ANAE.souter, '2026-07-28', 'PM'), projectedListId(ANAE.souter, '2026-07-30', 'AM'),
  ])

  const sortedLists = [...lists].sort((a, b) =>
    a.dateISO === b.dateISO
      ? a.anaesthetistId === b.anaesthetistId
        ? compareSessions(a, b)
        : a.anaesthetistId.localeCompare(b.anaesthetistId)
      : a.dateISO.localeCompare(b.dateISO),
  )

  /** The generated future Procedures, in generation order (for the post-generation pass below). */
  const generatedFuture: { list: AssignedList; procedure: Procedure }[] = []

  function fillList(list: AssignedList, count: number, capture: 'past' | 'today' | 'future', rng: () => number): void {
    const sessionStart = list.session === 'AM' ? 7 * 60 + 45 : 13 * 60 + 5
    let cursor = sessionStart
    for (let i = 0; i < count; i++) {
      const patient = takePatient()
      if (patient === null) return

      const codePool = list.hospitalId === HOSP.ces ? EYE_CODES : GENERAL_CODES
      const code = codePool[Math.floor(rng() * codePool.length)] ?? '20941'
      const rvg = RVG_BY_CODE.get(code)
      const duration = 35 + Math.floor(rng() * 50)
      const start = cursor + Math.floor(rng() * 8)
      const end = start + duration
      cursor = end + 8

      const captured = capture === 'past'
      const booking = addBooking({
        listId: list.id,
        patientId: patient,
        scheduledTime: minutesToTime(start),
        ...(captured ? { completedAtISO: iso(list.dateISO, minutesToTime(end + 4)) } : {}),
      })

      const routeDraw = rng()
      const asaDraw = rng()
      const asa = asaDraw < 0.55 ? 'AS1' : asaDraw < 0.85 ? 'AS2' : 'AS3'
      const spec: ProcedureSpec = {
        procedureText: rvg?.description ?? 'Procedure',
        legacyCode: code,
        asaClass: asa,
      }
      // The draw reads the legacy range, so the RNG sequence is unchanged.
      if (rvg?.legacyRange !== undefined) {
        spec.baseUnitsSelected = rvg.legacyRange.min + Math.floor(rng() * (rvg.legacyRange.max - rvg.legacyRange.min + 1))
      }
      if (captured) {
        spec.startISO = iso(list.dateISO, minutesToTime(start))
        spec.handoverISO = iso(list.dateISO, minutesToTime(end))
      }
      // The draw picks the Contract the office chose (catch-up Phase 20): nib's,
      // No contract · RVG, or the hospital's. Drawn as before, so the RNG
      // sequence is unchanged.
      if (routeDraw < 0.12) {
        spec.governingContractId = CONTRACT.nibRvg
      } else if (routeDraw < 0.2) {
        spec.governingContractId = CONTRACT.noContractRvg
      } else {
        // AA rooms is never a Contract holder (catch-up Phase 31): it falls back as no hospital did.
        const hospitalId = list.hospitalId === HOSP.aaRooms ? HOSP.stg : list.hospitalId
        spec.governingContractId = FILLER_CONTRACT_BY_HOSPITAL[hospitalId] ?? CONTRACT.stgRvg
        spec.billingReference = `${REF_PREFIX[hospitalId] ?? 'SG'}-2026-${4000 + procN}`
      }
      const procedure = addProcedure(booking, spec)
      if (capture === 'future') generatedFuture.push({ list, procedure })
    }
  }

  const bookable = (list: AssignedList): boolean =>
    // Catch-up Phase 32d: the public sessions' Lists are projected as private in the first pass, so this selects exactly what it did.
    list.kind === 'private' && !pinnedListIds.has(list.id)

  let pastBudget = 50
  let todayBudget = 20
  let futureBudget = 24

  // Past: newest first so the fortnight nearest today is richest.
  const pastLists = sortedLists.filter((l) => l.dateISO >= '2026-07-07' && l.dateISO <= MON20 && bookable(l)).reverse()
  for (const list of pastLists) {
    if (pastBudget <= 0) break
    const rng = slotRng(seed, 'cards', list.id)
    if (rng() < 0.45) continue
    const count = Math.min(2 + Math.floor(rng() * 3), pastBudget)
    fillList(list, count, 'past', rng)
    pastBudget -= count
  }

  // Today: other anaesthetists' lists are booked but not yet captured (the
  // clock seeds at 08:00 — the day is just starting).
  for (const list of sortedLists.filter((l) => l.dateISO === TUE21 && bookable(l))) {
    if (todayBudget <= 0) break
    const rng = slotRng(seed, 'cards', list.id)
    if (rng() < 0.2) continue
    const count = Math.min(2 + Math.floor(rng() * 3), todayBudget)
    fillList(list, count, 'today', rng)
    todayBudget -= count
  }

  // Future: thinning out to ten days ahead.
  for (const list of sortedLists.filter((l) => l.dateISO >= WED22 && l.dateISO <= '2026-07-31' && bookable(l))) {
    if (futureBudget <= 0) break
    const rng = slotRng(seed, 'cards', list.id)
    const daysAhead = (Date.parse(list.dateISO) - Date.parse(TUE21)) / 86400000
    if (rng() > 0.55 * (1 - daysAhead / 12)) continue
    const count = Math.min(1 + Math.floor(rng() * 2), futureBudget)
    fillList(list, count, 'future', rng)
    futureBudget -= count
  }

  // The included modifier on a Spine group (catch-up Phase 19b, US-05.1.4):
  // the first generated, uncaptured future Booking on a Dr Souter List (no
  // run-sheet beat counts it) is re-coded to S3a, whose base units include P1.
  // Its procedure text stays as generated. It is uncaptured and unbilled; only
  // its estimate moves with the S3a base (7 to 10 base units).
  // No RNG draw: the generated Bookings are otherwise identical.
  const spineTarget = generatedFuture.find(({ list }) => list.anaesthetistId === ANAE.souter)
  if (spineTarget === undefined) throw new Error('No generated future Booking on a Dr Souter List to re-code to a Spine group')
  spineTarget.procedure.rvgGroupId = RVG_GROUP.s3a!
  delete spineTarget.procedure.baseUnitsSelected

  // Booking.source (catch-up Phase 15, DM-39): optional and display-only, so
  // nothing reads it. Stamped deterministically (no RNG draw) on every Booking
  // built here; the generated history Bookings in `history.ts` stay unset.
  for (const booking of bookings) booking.source = seedSourceFor(booking, listById.get(booking.listId))

  return {
    bookings,
    procedures,
    billingLines,
    audit,
    scenario: {
      tane: taneBooking.id,
      marsh: marshBooking.id,
      chen: chenBooking.id,
      ellison: ellisonBooking.id,
      splitBilling: splitBooking.id,
      feeSplit: feeSplitBooking.id,
      cancelled: cancelledBooking.id,
      contractRate: contractRateBooking.id,
      contractRateCapture: contractRateCaptureBooking.id,
      bariatric: bariatricBooking.id,
      cosAcc: cosAccBooking.id,
      accRelated: accRelatedBookingId,
      guardianMinor: guardianBooking.id,
      prepayment: prepaymentBooking.id,
      prepaymentPaid: prepaidBooking.id,
      billingFailure: failureBooking.id,
      aiaClaim: reimbursementBooking.id,
      railPickUp: railPickUpBookingId,
      needsDestination: provisionalBooking.id,
      provisionalNoNhi: provisionalBooking.id,
      repeatMitchell: [mitchellFirst.id, mitchellRepeat.id],
      repeatWalker: [whitakerBookings[0]?.id ?? '', amBookings[0]?.id ?? ''],
      missingRefProcedures: [missingRefProc1, missingRefProc2.id],
      integrationS13Time: s13TimeBooking.id,
      integrationS13Move: s13MoveBooking.id,
      integrationS14: s14Booking.id,
      integrationS15: s15Booking.id,
      integrationLockedTarget: lockedTargetBooking.id,
      includedModifier: spineTarget.procedure.bookingId,
    },
    next: { booking: bookingN + 1, procedure: procN + 1, billingLine: lineN + 1, audit: auditN + 1 },
  }
}

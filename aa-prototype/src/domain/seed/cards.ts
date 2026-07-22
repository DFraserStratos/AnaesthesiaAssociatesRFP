/**
 * Seed Cards, Procedures and BillingLines — the design-day tableau, the
 * ready-made scenario states later phases rely on, and generic filler (past
 * two weeks rich, thinning about ten days out).
 *
 * Audit is minimal by decision: seeding is initial state, not mutation — only
 * the staged lifecycle facts are audited (the two SUBMITTED lists' submits,
 * the cancelled card's cancel, completes on staged/pinned cards). Generic
 * filler history is state-only.
 */

import type {
  AuditEntry,
  BillingLine,
  Card,
  CardCancellation,
  List,
  Procedure,
} from '../types'
import { slotRng } from './slotHash'
import { listIdForSlot } from './canvas'
import { ANAE, ANAESTHETISTS, HOSP, INS } from './cast'
import { CONTRACT } from './contracts'
import { BP, PAT, genericPatientIds } from './patients'
import { EYE_CODES, GENERAL_CODES, RVG_CODES } from './rvgCodes'

// ---------------------------------------------------------------------------
// Result & scenario id shapes
// ---------------------------------------------------------------------------

export interface CardScenarioIds {
  tane: string
  marsh: string
  chen: string
  ellison: string
  splitBilling: string
  twoFunder: string
  cancelled: string
  rateTime: string
  rateTimeCapture: string
  bariatric: string
  cosAcc: string
  accRelated: string
  guardianMinor: string
  prepayment: string
  insuredReimbursement: string
  provisionalNoNhi: string
  repeatMitchell: [string, string]
  repeatWalker: [string, string]
  /** Procedure ids with the deliberately missing billing references. */
  missingRefProcedures: [string, string]
}

export interface CardsBuild {
  cards: Card[]
  procedures: Procedure[]
  billingLines: BillingLine[]
  audit: AuditEntry[]
  scenario: CardScenarioIds
  /** Next free numeric suffix per entity (store counters continue from here). */
  next: { card: number; procedure: number; billingLine: number; audit: number }
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
const WED29 = '2026-07-29'
const THU09 = '2026-07-09'
const TUE14 = '2026-07-14'
const WED15 = '2026-07-15'
const THU16 = '2026-07-16'
const FRI17 = '2026-07-17'

const NAME_BY_ID = new Map(ANAESTHETISTS.map((a) => [a.registrationNumber, a.name]))
const RVG_BY_CODE = new Map(RVG_CODES.map((r) => [r.code, r]))

function iso(dateISO: string, time: string): string {
  return `${dateISO}T${time}:00`
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** The seed clock instant (Tue 21 Jul 08:00 = DEMO_TODAY at 08:00): the
 *  modification stamp for cards that have not yet been completed. */
const SEED_NOW_ISO = iso(TUE21, '08:00')

const REF_PREFIX: Record<string, string> = {
  [HOSP.stg]: 'SG',
  [HOSP.sx]: 'SX',
  [HOSP.forte]: 'FH',
  [HOSP.ces]: 'CE',
  [HOSP.cph]: 'HNZ',
}

const DEFAULT_CONTRACT_BY_HOSPITAL: Record<string, string> = {
  [HOSP.stg]: CONTRACT.stgDefault,
  [HOSP.sx]: CONTRACT.sxap,
  [HOSP.forte]: CONTRACT.forteDefault,
  [HOSP.ces]: CONTRACT.cesDefault,
  [HOSP.cph]: CONTRACT.healthNz,
}

// ---------------------------------------------------------------------------
// The build
// ---------------------------------------------------------------------------

export function buildCards(seed: number, lists: readonly List[]): CardsBuild {
  const listById = new Map(lists.map((l) => [l.id, l]))
  const cards: Card[] = []
  const procedures: Procedure[] = []
  const billingLines: BillingLine[] = []
  const audit: AuditEntry[] = []

  let cardN = 0
  let procN = 0
  let lineN = 0
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

  interface CardSpec {
    listId: string
    patientId: string
    scheduledTime?: string
    /** Completion time; presence marks the card completed. */
    completedAtISO?: string
    cancellation?: CardCancellation
    /** Write a card.complete audit entry (staged cards only). */
    auditComplete?: boolean
  }

  function anaesthetistNameFor(listId: string): string {
    const list = listById.get(listId)
    return list !== undefined ? (NAME_BY_ID.get(list.anaesthetistId) ?? 'Unknown') : 'Unknown'
  }

  function addCard(spec: CardSpec): Card {
    const list = listById.get(spec.listId)
    if (list === undefined) throw new Error(`seed card references missing list ${spec.listId}`)
    cardN += 1
    const who = anaesthetistNameFor(spec.listId)
    const card: Card = {
      id: `C${String(cardN).padStart(4, '0')}`,
      listId: spec.listId,
      patientId: spec.patientId,
      completed: spec.completedAtISO !== undefined,
      attachments: [],
      lastModifiedBy: spec.completedAtISO !== undefined ? who : 'Kirsty W.',
      // Completed cards carry their completion time; not-yet-completed cards
      // are stamped at the seed clock (Tue 21 Jul 08:00), never their list's
      // own date, so cards on upcoming lists don't read "modified in the
      // future" relative to the demo clock (2026-07-23 review fix).
      lastModifiedAtISO: spec.completedAtISO ?? SEED_NOW_ISO,
    }
    if (spec.scheduledTime !== undefined) card.scheduledTime = spec.scheduledTime
    if (spec.completedAtISO !== undefined) card.completedAtISO = spec.completedAtISO
    if (spec.cancellation !== undefined) {
      card.cancellation = spec.cancellation
      card.lastModifiedBy = spec.cancellation.by
      card.lastModifiedAtISO = spec.cancellation.atISO
    }
    cards.push(card)

    if (spec.auditComplete === true && spec.completedAtISO !== undefined) {
      auditN += 1
      audit.push({
        id: `A${String(auditN).padStart(4, '0')}`,
        entityType: 'card',
        entityId: card.id,
        who,
        role: 'anaesthetist',
        source: 'anaesthetist',
        action: 'card.complete',
        after: { completed: true },
        atISO: spec.completedAtISO,
      })
    }
    if (spec.cancellation !== undefined) {
      auditN += 1
      audit.push({
        id: `A${String(auditN).padStart(4, '0')}`,
        entityType: 'card',
        entityId: card.id,
        who: spec.cancellation.by,
        role: spec.cancellation.role,
        source: spec.cancellation.source,
        action: 'card.cancel',
        after: { cancelled: true, reason: spec.cancellation.reason },
        atISO: spec.cancellation.atISO,
      })
    }
    return card
  }

  interface ProcedureSpec {
    description: string
    rvgBaseCode?: string
    baseUnitsSelected?: number
    startISO?: string
    handoverISO?: string
    asaClass?: 'AS1' | 'AS2' | 'AS3' | 'AS4'
    selectedModifierCodes?: string[]
    billingRoute?: 'hospital' | 'billableParty' | 'insurer'
    governingContractId?: string
    insurerId?: string
    billablePartyId?: string
    patientPaymentCategory?: 'selfFundedPostProcedure' | 'selfFundedPrepayment' | 'insuredReimbursement'
    prepaymentDetail?: { type: 'full' | 'split'; depositAmount?: number }
    billingReference?: string
    accRelated?: boolean
    isAdditional?: boolean
    timeUnitsOverride?: number
  }

  function addProcedure(card: Card, spec: ProcedureSpec): Procedure {
    procN += 1
    const procedure: Procedure = {
      id: `P${String(procN).padStart(4, '0')}`,
      cardId: card.id,
      description: spec.description,
      accRelated: spec.accRelated ?? false,
      isAdditional: spec.isAdditional ?? false,
      selectedModifierCodes: spec.selectedModifierCodes ?? [],
    }
    if (spec.rvgBaseCode !== undefined) procedure.rvgBaseCode = spec.rvgBaseCode
    if (spec.baseUnitsSelected !== undefined) procedure.baseUnitsSelected = spec.baseUnitsSelected
    if (spec.startISO !== undefined) procedure.anaestheticStartISO = spec.startISO
    if (spec.handoverISO !== undefined) procedure.handoverISO = spec.handoverISO
    if (spec.asaClass !== undefined) procedure.asaClass = spec.asaClass
    if (spec.billingRoute !== undefined) procedure.billingRoute = spec.billingRoute
    if (spec.governingContractId !== undefined) procedure.governingContractId = spec.governingContractId
    if (spec.insurerId !== undefined) procedure.insurerId = spec.insurerId
    if (spec.billablePartyId !== undefined) procedure.billablePartyId = spec.billablePartyId
    if (spec.patientPaymentCategory !== undefined) procedure.patientPaymentCategory = spec.patientPaymentCategory
    if (spec.prepaymentDetail !== undefined) procedure.prepaymentDetail = spec.prepaymentDetail
    if (spec.billingReference !== undefined) procedure.billingReference = spec.billingReference
    if (spec.timeUnitsOverride !== undefined) {
      procedure.timeUnitsCaptured = { units: spec.timeUnitsOverride, source: 'overridden' }
    }
    procedures.push(procedure)
    return procedure
  }

  function addLine(procedure: Procedure, spec: Omit<BillingLine, 'id' | 'procedureId'>): BillingLine {
    lineN += 1
    const line: BillingLine = { ...spec, id: `BL${String(lineN).padStart(4, '0')}`, procedureId: procedure.id }
    billingLines.push(line)
    return line
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

  const souterAm21 = listIdForSlot(ANAE.souter, TUE21, 'AM')
  const amSpecs = [
    { patient: PAT.walker, code: '47516', sched: '07:30', start: '07:34', end: '08:52', asa: 'AS2' as const, desc: 'Right total hip replacement' },
    { patient: takePatient() ?? PAT.walker, code: '47519', sched: '09:00', start: '09:00', end: '10:05', asa: 'AS3' as const, desc: 'Hip hemiarthroplasty' },
    { patient: takePatient() ?? PAT.walker, code: '49518', sched: '10:10', start: '10:12', end: '11:15', asa: 'AS1' as const, desc: 'Left total knee replacement' },
    { patient: takePatient() ?? PAT.walker, code: '50120', sched: '11:20', start: '11:22', end: '12:10', asa: 'AS2' as const, desc: 'Femur ORIF, proximal' },
    { patient: takePatient() ?? PAT.walker, code: '49558', sched: '12:15', start: '12:15', end: '12:52', asa: 'AS1' as const, desc: 'Knee arthroscopy' },
  ]
  const amCards: Card[] = []
  amSpecs.forEach((s, i) => {
    const card = addCard({
      listId: souterAm21,
      patientId: s.patient,
      scheduledTime: s.sched,
      completedAtISO: iso(TUE21, minutesToTime(Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3)) + 4)),
      auditComplete: true,
    })
    addProcedure(card, {
      description: s.desc,
      rvgBaseCode: s.code,
      startISO: iso(TUE21, s.start),
      handoverISO: iso(TUE21, s.end),
      asaClass: s.asa,
      billingRoute: 'hospital',
      governingContractId: CONTRACT.stgDefault,
      billingReference: `SG-2026-08${21 + i}`,
    })
    amCards.push(card)
  })

  // -------------------------------------------------------------------------
  // Souter PM Southern Cross / Ms Patel: the four mockup cards
  // -------------------------------------------------------------------------

  const souterPm21 = listIdForSlot(ANAE.souter, TUE21, 'PM')

  const taneCard = addCard({
    listId: souterPm21,
    patientId: PAT.tane,
    scheduledTime: '13:00',
    completedAtISO: iso(TUE21, '14:22'),
    auditComplete: true,
  })
  addProcedure(taneCard, {
    description: 'Laparoscopic cholecystectomy',
    rvgBaseCode: '20941',
    startISO: iso(TUE21, '13:02'),
    handoverISO: iso(TUE21, '14:18'),
    asaClass: 'AS1',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.sxap,
    billingReference: 'SX-2026-1201',
  })

  const marshCard = addCard({
    listId: souterPm21,
    patientId: PAT.marsh,
    scheduledTime: '14:15',
    completedAtISO: iso(TUE21, '15:09'),
    auditComplete: true,
  })
  addProcedure(marshCard, {
    description: 'Right knee arthroscopy',
    rvgBaseCode: '49558',
    startISO: iso(TUE21, '14:20'),
    handoverISO: iso(TUE21, '15:05'),
    asaClass: 'AS1',
    billingRoute: 'insurer',
    insurerId: INS.nib,
    governingContractId: CONTRACT.nibDefault,
  })

  const chenCard = addCard({
    listId: souterPm21,
    patientId: PAT.chen,
    scheduledTime: '15:10',
    completedAtISO: iso(TUE21, '16:02'),
    auditComplete: true,
  })
  addProcedure(chenCard, {
    description: 'Inguinal hernia repair',
    rvgBaseCode: '49115',
    startISO: iso(TUE21, '15:12'),
    handoverISO: iso(TUE21, '15:58'),
    asaClass: 'AS1',
    billingRoute: 'billableParty',
    patientPaymentCategory: 'selfFundedPostProcedure',
    // The mockup's "T adjusted +1 manually" story: captured T carries
    // overridden provenance (Phase 07's review flag keys off this).
    timeUnitsOverride: 4,
  })

  const ellisonCard = addCard({
    listId: souterPm21,
    patientId: PAT.ellison,
    scheduledTime: '16:00',
  })
  addProcedure(ellisonCard, {
    description: 'Left total hip replacement',
    rvgBaseCode: '47516',
    // No handover: the finish is stamped LIVE in the demo ("Tap Finish now →
    // fee ticks up", the mockup's demo script). The post-capture $344.50/13u
    // pins moved to btmCapture.test.ts (Decisions log 2026-07-23).
    startISO: iso(TUE21, '16:05'),
    asaClass: 'AS1',
    // Age-extreme modifier (Margaret Ellison, over 70): A1 = 1 unit, keeping
    // the pinned $344.50 fee (RVG-over-mockup relabel, 2026-07-23 review fix).
    selectedModifierCodes: ['A1'],
    billingRoute: 'hospital',
    governingContractId: CONTRACT.sxap,
    billingReference: 'SX-2026-1204',
  })

  // -------------------------------------------------------------------------
  // Morrison Mon 20 St George's / Mr Tan — SUBMITTED, 6 complete + 1 cancelled
  // -------------------------------------------------------------------------

  const morrisonMon20 = listIdForSlot(ANAE.morrison, MON20, 'AM')
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
  let accRelatedCardId = ''
  morrisonSpecs.forEach((s, i) => {
    const card = addCard({
      listId: morrisonMon20,
      patientId: takePatient() ?? PAT.walker,
      scheduledTime: s.start,
      completedAtISO: iso(MON20, minutesToTime(Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3)) + 5)),
      auditComplete: true,
    })
    const procedure = addProcedure(card, {
      description: s.desc,
      rvgBaseCode: s.code,
      startISO: iso(MON20, s.start),
      handoverISO: iso(MON20, s.end),
      asaClass: s.asa,
      billingRoute: 'hospital',
      governingContractId: s.acc === true ? CONTRACT.stgAcc : CONTRACT.stgDefault,
      ...(s.ref !== undefined ? { billingReference: s.ref } : {}),
      ...(s.acc === true ? { accRelated: true } : {}),
    })
    if (i === 1) missingRefProc1 = procedure.id
    if (s.acc === true) accRelatedCardId = card.id
  })

  const cancelledCard = addCard({
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
  addProcedure(cancelledCard, {
    description: 'Cystoscopy',
    rvgBaseCode: '36561',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.stgDefault,
    billingReference: 'SG-2026-0777',
  })

  addListAudit(morrisonMon20, 'list.submit', 'Dr Kate Morrison', iso(MON20, '13:10'))

  // -------------------------------------------------------------------------
  // Whitaker Fri 17 Christchurch Public acute — SUBMITTED, 5 complete
  // -------------------------------------------------------------------------

  const whitakerFri17 = listIdForSlot(ANAE.whitaker, FRI17, 'AM')
  const whitakerSpecs = [
    { patient: PAT.walker, code: '20950', start: '07:40', end: '08:46', asa: 'AS2' as const, desc: 'Appendicectomy, laparoscopic', ref: 'HNZ-2026-3311' },
    { patient: takePatient() ?? PAT.walker, code: '20941', start: '08:55', end: '10:02', asa: 'AS1' as const, desc: 'Laparoscopic cholecystectomy', ref: 'HNZ-2026-3312' },
    { patient: takePatient() ?? PAT.walker, code: '46360', start: '10:10', end: '11:00', asa: 'AS1' as const, desc: 'Wrist ORIF, distal radius', ref: 'HNZ-2026-3313' },
    { patient: takePatient() ?? PAT.walker, code: '49115', start: '11:08', end: '11:52', asa: 'AS2' as const, desc: 'Inguinal hernia repair', ref: 'HNZ-2026-3314' },
    { patient: takePatient() ?? PAT.walker, code: '20905', start: '12:00', end: '13:10', asa: 'AS3' as const, desc: 'Laparotomy, exploratory', ref: 'HNZ-2026-3315' },
  ]
  const whitakerCards: Card[] = []
  for (const s of whitakerSpecs) {
    const card = addCard({
      listId: whitakerFri17,
      patientId: s.patient,
      scheduledTime: s.start,
      completedAtISO: iso(FRI17, minutesToTime(Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3)) + 5)),
      auditComplete: true,
    })
    addProcedure(card, {
      description: s.desc,
      rvgBaseCode: s.code,
      startISO: iso(FRI17, s.start),
      handoverISO: iso(FRI17, s.end),
      asaClass: s.asa,
      billingRoute: 'hospital',
      governingContractId: CONTRACT.healthNz,
      billingReference: s.ref,
    })
    whitakerCards.push(card)
  }
  addListAudit(whitakerFri17, 'list.submit', 'Dr Ben Whitaker', iso(FRI17, '16:38'))

  // -------------------------------------------------------------------------
  // Souter Mon 20 AM Forte / Mr Okafor — split billing + missing ref #2
  // -------------------------------------------------------------------------

  const souterMon20Am = listIdForSlot(ANAE.souter, MON20, 'AM')

  const splitCard = addCard({
    listId: souterMon20Am,
    patientId: PAT.holt,
    scheduledTime: '08:00',
    completedAtISO: iso(MON20, '09:50'),
    auditComplete: true,
  })
  addProcedure(splitCard, {
    description: 'Inguinal hernia repair',
    rvgBaseCode: '49115',
    startISO: iso(MON20, '08:05'),
    handoverISO: iso(MON20, '09:15'),
    asaClass: 'AS2',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.forteDefault,
    billingReference: 'FH-2026-2101',
  })
  addProcedure(splitCard, {
    description: 'Umbilical hernia repair, same anaesthetic',
    rvgBaseCode: '49120',
    startISO: iso(MON20, '09:15'),
    handoverISO: iso(MON20, '09:45'),
    asaClass: 'AS2',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.forteDefault,
    billingReference: 'FH-2026-2101',
    isAdditional: true,
  })

  const missingRefCard = addCard({
    listId: souterMon20Am,
    patientId: takePatient() ?? PAT.holt,
    scheduledTime: '09:55',
    completedAtISO: iso(MON20, '11:05'),
    auditComplete: true,
  })
  // Deliberately missing billing reference #2.
  const missingRefProc2 = addProcedure(missingRefCard, {
    description: 'Laparoscopic cholecystectomy',
    rvgBaseCode: '20941',
    startISO: iso(MON20, '09:58'),
    handoverISO: iso(MON20, '11:00'),
    asaClass: 'AS1',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.forteDefault,
  })

  const monAmFiller = addCard({
    listId: souterMon20Am,
    patientId: takePatient() ?? PAT.holt,
    scheduledTime: '11:10',
    completedAtISO: iso(MON20, '12:10'),
    auditComplete: true,
  })
  addProcedure(monAmFiller, {
    description: 'Appendicectomy, laparoscopic',
    rvgBaseCode: '20950',
    startISO: iso(MON20, '11:12'),
    handoverISO: iso(MON20, '12:05'),
    asaClass: 'AS2',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.forteDefault,
    billingReference: 'FH-2026-2103',
  })

  // -------------------------------------------------------------------------
  // Souter Mon 20 PM St George's / Ms Lim — the two-funder card
  // -------------------------------------------------------------------------

  const souterMon20Pm = listIdForSlot(ANAE.souter, MON20, 'PM')

  // Fee: B4 + T4 (60 min) + M0 (AS1) = 8 units x $26.50 = $212.00. Once any
  // line carries a funder override, the stored lines are the explicit
  // allocation of the WHOLE fee (validator-checked to the cent).
  const twoFunderCard = addCard({
    listId: souterMon20Pm,
    patientId: PAT.prentice,
    scheduledTime: '14:00',
    completedAtISO: iso(MON20, '15:05'),
    auditComplete: true,
  })
  const twoFunderProc = addProcedure(twoFunderCard, {
    description: 'Knee arthroscopy, funding split with nib',
    rvgBaseCode: '49558',
    startISO: iso(MON20, '14:00'),
    handoverISO: iso(MON20, '15:00'),
    asaClass: 'AS1',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.stgDefault,
    billingReference: 'SG-2026-0791',
  })
  addLine(twoFunderProc, {
    chargeBasis: 'rvg',
    amount: 132.5,
    description: 'nib insured portion',
    funderOverride: { kind: 'insurer', id: INS.nib },
  })
  addLine(twoFunderProc, {
    chargeBasis: 'rvg',
    amount: 79.5,
    description: 'Patient portion',
  })

  const rangeCard = addCard({
    listId: souterMon20Pm,
    patientId: takePatient() ?? PAT.prentice,
    scheduledTime: '15:15',
    completedAtISO: iso(MON20, '16:25'),
    auditComplete: true,
  })
  addProcedure(rangeCard, {
    description: 'Complex skin flap repair',
    rvgBaseCode: '45030',
    baseUnitsSelected: 5,
    startISO: iso(MON20, '15:15'),
    handoverISO: iso(MON20, '16:20'),
    asaClass: 'AS2',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.stgDefault,
    billingReference: 'SG-2026-0792',
  })

  const monPmFiller = addCard({
    listId: souterMon20Pm,
    patientId: takePatient() ?? PAT.prentice,
    scheduledTime: '16:30',
    completedAtISO: iso(MON20, '17:30'),
    auditComplete: true,
  })
  addProcedure(monPmFiller, {
    description: 'Breast reduction',
    rvgBaseCode: '45200',
    startISO: iso(MON20, '16:30'),
    handoverISO: iso(MON20, '17:25'),
    asaClass: 'AS1',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.stgDefault,
    billingReference: 'SG-2026-0793',
  })

  // -------------------------------------------------------------------------
  // Scenario cards on past lists
  // -------------------------------------------------------------------------

  // Bariatric Type 3 with the second-procedure ordinal rule (Fitzgerald,
  // Tue 14 Jul, Southern Cross / Mr Doyle).
  const fitzTue14 = listIdForSlot(ANAE.fitzgerald, TUE14, 'AM')
  const bariatricCard = addCard({
    listId: fitzTue14,
    patientId: PAT.mills,
    scheduledTime: '08:00',
    completedAtISO: iso(TUE14, '10:50'),
    auditComplete: true,
  })
  addProcedure(bariatricCard, {
    description: 'Gastric bypass, laparoscopic',
    rvgBaseCode: '20880',
    baseUnitsSelected: 10,
    startISO: iso(TUE14, '08:10'),
    handoverISO: iso(TUE14, '10:15'),
    asaClass: 'AS3',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.doyleBariatric,
    billingReference: 'BAR-2026-014',
  })
  addProcedure(bariatricCard, {
    description: 'Umbilical hernia repair, concurrent',
    rvgBaseCode: '49120',
    startISO: iso(TUE14, '10:15'),
    handoverISO: iso(TUE14, '10:45'),
    asaClass: 'AS3',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.doyleBariatric,
    billingReference: 'BAR-2026-014',
    isAdditional: true,
  })

  // Rate x time under the billable-party-held individual-arrangement contract
  // (Fitzgerald, Wed 15 Jul, Forte / Ms Lim).
  const fitzWed15 = listIdForSlot(ANAE.fitzgerald, WED15, 'AM')
  const rateTimeCard = addCard({
    listId: fitzWed15,
    patientId: PAT.bennett,
    scheduledTime: '08:30',
    completedAtISO: iso(WED15, '11:45'),
    auditComplete: true,
  })
  const rateTimeProc = addProcedure(rateTimeCard, {
    description: 'Abdominoplasty, individually arranged hourly rate (Aria Skin and Laser Clinic)',
    billingRoute: 'billableParty',
    billablePartyId: BP.ariaClinic,
    patientPaymentCategory: 'selfFundedPostProcedure',
    governingContractId: CONTRACT.ariaHourly,
  })
  addLine(rateTimeProc, {
    chargeBasis: 'rateTime',
    hours: 3,
    rate: 480,
    amount: 1440,
    description: 'Anaesthesia, 3.0 hours at $480 per hour',
  })

  // Insured reimbursement: the patient pays and claims back from AIA Health
  // (informational only — NOT the direct-claim Insurer route).
  const ruthThu16 = listIdForSlot(ANAE.rutherford, THU16, 'AM')
  const reimbursementCard = addCard({
    listId: ruthThu16,
    patientId: PAT.webb,
    scheduledTime: '08:15',
    completedAtISO: iso(THU16, '09:35'),
    auditComplete: true,
  })
  addProcedure(reimbursementCard, {
    description: 'Shoulder arthroscopy, patient to claim from AIA Health (reimbursement)',
    rvgBaseCode: '48939',
    startISO: iso(THU16, '08:20'),
    handoverISO: iso(THU16, '09:30'),
    asaClass: 'AS2',
    billingRoute: 'billableParty',
    patientPaymentCategory: 'insuredReimbursement',
  })

  // COS externally held ACC contract (Rutherford, Thu 9 Jul, STG / Mr Hale).
  const ruthThu09 = listIdForSlot(ANAE.rutherford, THU09, 'AM')
  const cosAccCard = addCard({
    listId: ruthThu09,
    patientId: PAT.foster,
    scheduledTime: '08:00',
    completedAtISO: iso(THU09, '09:30'),
    auditComplete: true,
  })
  addProcedure(cosAccCard, {
    description: 'ACL reconstruction, ACC claim via Canterbury Orthopaedic Surgeons',
    rvgBaseCode: '49561',
    startISO: iso(THU09, '08:05'),
    handoverISO: iso(THU09, '09:25'),
    asaClass: 'AS2',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.cosAcc,
    billingReference: 'ACC45-104772',
    accRelated: true,
  })

  // Repeat patient: Sarah Mitchell's first episode (Sharma, Tue 14 Jul, CPH).
  const sharmaTue14 = listIdForSlot(ANAE.sharma, TUE14, 'AM')
  const mitchellFirst = addCard({
    listId: sharmaTue14,
    patientId: PAT.mitchell,
    scheduledTime: '08:00',
    completedAtISO: iso(TUE14, '09:10'),
    auditComplete: true,
  })
  addProcedure(mitchellFirst, {
    description: 'Appendicectomy, laparoscopic',
    rvgBaseCode: '20950',
    startISO: iso(TUE14, '08:10'),
    handoverISO: iso(TUE14, '09:05'),
    asaClass: 'AS1',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.healthNz,
    billingReference: 'HNZ-2026-3102',
  })

  // -------------------------------------------------------------------------
  // Scenario cards on upcoming lists
  // -------------------------------------------------------------------------

  // Guardian pays for a minor (Grace Park, 12) — Chen, Fri 24 Jul, CES / Reid.
  const chenFri24 = listIdForSlot(ANAE.chen, FRI24, 'AM')
  const guardianCard = addCard({
    listId: chenFri24,
    patientId: PAT.park,
    scheduledTime: '08:30',
  })
  addProcedure(guardianCard, {
    description: 'Strabismus correction, guardian to be invoiced',
    rvgBaseCode: '42794',
    billingRoute: 'billableParty',
    billablePartyId: BP.guardian,
    patientPaymentCategory: 'selfFundedPostProcedure',
  })

  // Pre-payment (split deposit) — Fitzgerald, Wed 29 Jul, Forte / Ms Lim.
  const fitzWed29 = listIdForSlot(ANAE.fitzgerald, WED29, 'AM')
  const prepaymentCard = addCard({
    listId: fitzWed29,
    patientId: PAT.riley,
    scheduledTime: '09:00',
  })
  addProcedure(prepaymentCard, {
    description: 'Rhinoplasty, pre-payment required',
    rvgBaseCode: '41800',
    billingRoute: 'billableParty',
    patientPaymentCategory: 'selfFundedPrepayment',
    prepaymentDetail: { type: 'split', depositAmount: 800 },
  })

  // Provisional no-NHI patient (PDF pathway) + Sarah Mitchell's repeat episode
  // — Souter, Mon 27 Jul, Forte / Mr Okafor.
  const souterMon27 = listIdForSlot(ANAE.souter, MON27, 'AM')
  const provisionalCard = addCard({
    listId: souterMon27,
    patientId: PAT.provisional,
    scheduledTime: '08:00',
  })
  addProcedure(provisionalCard, {
    description: 'Inguinal hernia repair, booked from PDF referral (NHI pending)',
    rvgBaseCode: '49115',
  })
  const mitchellRepeat = addCard({
    listId: souterMon27,
    patientId: PAT.mitchell,
    scheduledTime: '09:30',
  })
  addProcedure(mitchellRepeat, {
    description: 'Laparoscopic cholecystectomy',
    rvgBaseCode: '20941',
    billingRoute: 'hospital',
    governingContractId: CONTRACT.forteDefault,
    billingReference: 'FH-2026-2140',
  })

  // Rate x time CAPTURE card (Phase 04): not yet captured, on Souter's own
  // pinned Mon 27 list so the mobile app can reach it — the presenter adds the
  // hours x rate billing line live under the Aria individual-arrangement
  // contract. Fitzgerald's completed card above stays Phase 08's billing
  // exemplar (Decisions log 2026-07-23).
  const rateTimeCaptureCard = addCard({
    listId: souterMon27,
    patientId: PAT.sinclair,
    scheduledTime: '10:45',
  })
  addProcedure(rateTimeCaptureCard, {
    description: 'Laser skin resurfacing, individually arranged hourly rate (Aria Skin and Laser Clinic)',
    billingRoute: 'billableParty',
    billablePartyId: BP.ariaClinic,
    patientPaymentCategory: 'selfFundedPostProcedure',
    governingContractId: CONTRACT.ariaHourly,
  })

  // -------------------------------------------------------------------------
  // Near-future mockup counts: Wed 22 CES x6, Thu 23 CPH x8 + pre-op x6
  // -------------------------------------------------------------------------

  const wed22Ces = listIdForSlot(ANAE.souter, WED22, 'AM')
  const eyeSpecs = ['42702', '42702', '42725', '42794', '42702', '42725']
  eyeSpecs.forEach((code, i) => {
    const patient = takePatient()
    if (patient === null) return
    const card = addCard({
      listId: wed22Ces,
      patientId: patient,
      scheduledTime: minutesToTime(8 * 60 + i * 40),
    })
    const rvg = RVG_BY_CODE.get(code)
    addProcedure(card, {
      description: rvg?.description ?? 'Eye procedure',
      rvgBaseCode: code,
      billingRoute: 'hospital',
      governingContractId: CONTRACT.cesDefault,
      billingReference: `CE-2026-05${41 + i}`,
    })
  })

  const thu23Cph = listIdForSlot(ANAE.souter, THU23, 'AM')
  const acuteSpecs = ['20950', '49115', '20941', '46360', '20905', '49120', '36561', '20950']
  acuteSpecs.forEach((code, i) => {
    const patient = takePatient()
    if (patient === null) return
    const card = addCard({
      listId: thu23Cph,
      patientId: patient,
      scheduledTime: minutesToTime(7 * 60 + 45 + i * 35),
    })
    const rvg = RVG_BY_CODE.get(code)
    addProcedure(card, {
      description: rvg?.description ?? 'Acute procedure',
      rvgBaseCode: code,
      billingRoute: 'hospital',
      governingContractId: CONTRACT.healthNz,
      billingReference: `HNZ-2026-34${11 + i}`,
    })
  })

  const thu23Preop = listIdForSlot(ANAE.souter, THU23, 'PM')
  for (let i = 0; i < 6; i++) {
    const patient = takePatient()
    if (patient === null) break
    const card = addCard({
      listId: thu23Preop,
      patientId: patient,
      scheduledTime: minutesToTime(13 * 60 + i * 40),
    })
    addProcedure(card, { description: 'Pre-op assessment' })
  }

  // -------------------------------------------------------------------------
  // Generic filler — past two weeks rich, today mid-capture, thinning to +10d
  // -------------------------------------------------------------------------

  const pinnedListIds = new Set<string>([
    souterAm21, souterPm21, morrisonMon20, whitakerFri17, souterMon20Am, souterMon20Pm,
    fitzTue14, fitzWed15, ruthThu16, ruthThu09, sharmaTue14, chenFri24, fitzWed29,
    souterMon27, wed22Ces, thu23Cph, thu23Preop,
  ])

  const sortedLists = [...lists].sort((a, b) =>
    a.dateISO === b.dateISO
      ? a.anaesthetistId === b.anaesthetistId
        ? a.session.localeCompare(b.session)
        : a.anaesthetistId.localeCompare(b.anaesthetistId)
      : a.dateISO.localeCompare(b.dateISO),
  )

  function fillList(list: List, count: number, capture: 'past' | 'today' | 'future', rng: () => number): void {
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
      const card = addCard({
        listId: list.id,
        patientId: patient,
        scheduledTime: minutesToTime(start),
        ...(captured ? { completedAtISO: iso(list.dateISO, minutesToTime(end + 4)) } : {}),
      })

      const routeDraw = rng()
      const asaDraw = rng()
      const asa = asaDraw < 0.55 ? 'AS1' : asaDraw < 0.85 ? 'AS2' : 'AS3'
      const spec: ProcedureSpec = {
        description: rvg?.description ?? 'Procedure',
        rvgBaseCode: code,
        asaClass: asa,
      }
      if (rvg !== undefined && rvg.baseUnits.kind === 'range') {
        spec.baseUnitsSelected = rvg.baseUnits.min + Math.floor(rng() * (rvg.baseUnits.max - rvg.baseUnits.min + 1))
      }
      if (captured) {
        spec.startISO = iso(list.dateISO, minutesToTime(start))
        spec.handoverISO = iso(list.dateISO, minutesToTime(end))
      }
      if (routeDraw < 0.12) {
        spec.billingRoute = 'insurer'
        spec.insurerId = INS.nib
        spec.governingContractId = CONTRACT.nibDefault
      } else if (routeDraw < 0.2) {
        spec.billingRoute = 'billableParty'
        spec.patientPaymentCategory = 'selfFundedPostProcedure'
      } else {
        spec.billingRoute = 'hospital'
        const hospitalId = list.hospitalId ?? HOSP.stg
        spec.governingContractId = DEFAULT_CONTRACT_BY_HOSPITAL[hospitalId] ?? CONTRACT.stgDefault
        spec.billingReference = `${REF_PREFIX[hospitalId] ?? 'SG'}-2026-${4000 + procN}`
      }
      addProcedure(card, spec)
    }
  }

  const bookable = (list: List): boolean =>
    (list.statusKey === 'private' || list.statusKey === 'public') && !pinnedListIds.has(list.id)

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

  return {
    cards,
    procedures,
    billingLines,
    audit,
    scenario: {
      tane: taneCard.id,
      marsh: marshCard.id,
      chen: chenCard.id,
      ellison: ellisonCard.id,
      splitBilling: splitCard.id,
      twoFunder: twoFunderCard.id,
      cancelled: cancelledCard.id,
      rateTime: rateTimeCard.id,
      rateTimeCapture: rateTimeCaptureCard.id,
      bariatric: bariatricCard.id,
      cosAcc: cosAccCard.id,
      accRelated: accRelatedCardId,
      guardianMinor: guardianCard.id,
      prepayment: prepaymentCard.id,
      insuredReimbursement: reimbursementCard.id,
      provisionalNoNhi: provisionalCard.id,
      repeatMitchell: [mitchellFirst.id, mitchellRepeat.id],
      repeatWalker: [whitakerCards[0]?.id ?? '', amCards[0]?.id ?? ''],
      missingRefProcedures: [missingRefProc1, missingRefProc2.id],
    },
    next: { card: cardN + 1, procedure: procN + 1, billingLine: lineN + 1, audit: auditN + 1 },
  }
}

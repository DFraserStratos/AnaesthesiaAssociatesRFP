/**
 * Shared TEST fixtures for the billing suites (fee + validation). Not part of
 * the public domain API — not re-exported from any index; Phase 02's seeder
 * builds its own data.
 */

import type {
  Anaesthetist,
  Booking,
  Contract,
  Insurer,
  Party,
  Procedure,
  RvgGroup,
} from '../types'
import { modifierFromRvgRow, type Modifier, type ModifierClaim } from './modifiers'
import { RVG_MODIFIER_ROWS } from '../seed/rvgModifiers.generated'
import { bookingFeeFor, type ProcedureFeeContext } from './bookingFee'
import type { FeeResult } from './fee'

/** The RVG modifier master as the seed builds it (generated from the catalogue), keyed by id. */
export const RVG_MODIFIER_MASTER: Readonly<Record<string, Modifier>> = Object.fromEntries(
  RVG_MODIFIER_ROWS.map(modifierFromRvgRow).map((m) => [m.id, m]),
)

/** The id of an RVG modifier by its printed code. */
export function modId(code: string): string {
  const m = Object.values(RVG_MODIFIER_MASTER).find((x) => x.code === code)
  if (m === undefined) throw new Error(`No RVG modifier ${code}`)
  return m.id
}

/** A claim of an RVG modifier with an explanation. */
export function mkClaim(code: string, explanation = 'Test reason', units?: number): ModifierClaim {
  return { modifierId: modId(code), explanation, ...(units !== undefined ? { units } : {}) }
}

/** Modifier inputs with no patient (no age modifier) and the RVG master. */
export const NO_PATIENT_MODIFIERS = { procedureDateISO: '2026-07-21', modifiers: RVG_MODIFIER_MASTER }

export function mkAnaesthetist(overrides: Partial<Anaesthetist> = {}): Anaesthetist {
  return {
    registrationNumber: 'REG-30821',
    name: 'Dr Melanie Souter',
    phone: '021 555 0100',
    email: 'm.souter@example.co.nz',
    unitValue: 30,
    gstPeriod: 'biMonthly',
    hpiId: '91ZBBB',
    startDateISO: '2015-01-05',
    active: true,
    ...overrides,
  }
}

export function mkProcedure(overrides: Partial<Procedure> = {}): Procedure {
  return {
    id: 'proc-1',
    bookingId: 'booking-1',
    payer: { kind: 'patient' },
    procedureText: null,
    invoiceDescription: null,
    isPrimary: true,
    modifierClaims: [],
    removedModifierIds: [],
    ...overrides,
  }
}

export function mkBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    listId: 'list-1',
    patientId: 'pat-1',
    completed: false,
    lastModifiedBy: 'Dr Melanie Souter',
    lastModifiedAtISO: '2026-07-21T08:00:00',
    ...overrides,
  }
}

/** A hospital-held, holder-billed plain RVG Contract (catch-up Phase 18's flat shape). */
export function mkContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'con-1',
    aaCode: 'TST-001',
    name: 'Test contract',
    holderId: 'party-hosp-1',
    billsTo: 'holder',
    linkedSurgeonIds: [],
    prepaid: false,
    anaesthetistMayOverridePrice: false,
    pricing: { kind: 'rvgAnaesthetistRate' },
    invoiceDescription: null,
    defaultRvgGroupId: null,
    status: 'active',
    permitsRateTime: false,
    specialtyIds: [],
    ...overrides,
  }
}

export function mkInsurer(overrides: Partial<Insurer> = {}): Insurer {
  return {
    id: 'ins-1',
    name: 'Southern Health Insurance',
    ...overrides,
  }
}

/** A hospital Party for `hosp-1`, billed by its Contracts (billing details filled). */
export function mkParty(overrides: Partial<Party> = {}): Party {
  return {
    id: 'party-hosp-1',
    kind: 'hospital',
    name: 'Test hospital',
    codePrefix: 'TST',
    hospitalId: 'hosp-1',
    billingName: 'Test Hospital Limited',
    email: 'accounts@test-hospital.example',
    deliveryMethod: 'email',
    ...overrides,
  }
}

/** A plain 10-unit RVG group. */
export const BASE_SINGLE_10: RvgGroup = {
  id: 'RG-T-GA10',
  code: 'GA10',
  description: 'Upper abdominal procedure',
  anatomy: 'Abdomen',
  baseUnits: 10,
  modifierUnits: 0,
  retired: false,
  includedModifierIds: [],
}

/** A Spine group whose base units include P1 (catch-up Phase 19b, US-05.1.4): S3a, 10 units. */
export const BASE_INCLUDES_P1: RvgGroup = {
  id: 'RG-T-S3A',
  code: 'S3a',
  description: 'Cervical, posterior procedures, 1 to 2 levels',
  anatomy: 'Spine',
  baseUnits: 10,
  modifierUnits: 0,
  retired: false,
  includedModifierIds: ['MOD-RVG-P1'],
}

/** A ranged RVG group (5 to 9 units, starting at 5). */
export const BASE_RANGE_5_9: RvgGroup = {
  id: 'RG-T-NR59',
  code: 'NR59',
  description: 'Complex regional procedure, graded',
  anatomy: 'Lower limb',
  baseUnits: 5,
  baseUnitsRange: { min: 5, max: 9 },
  modifierUnits: 0,
  retired: false,
  includedModifierIds: [],
}

/** 2h30m on the demo day: 08:00 start, 10:30 handover (T = 11 units). */
export const START_0800 = '2026-07-21T08:00:00'
export const HANDOVER_1030 = '2026-07-21T10:30:00'

/**
 * Test support (catch-up Phase 23): the fee of a Booking's only Procedure,
 * through the one engine (`bookingFeeFor`), the Procedure priced as the
 * Booking's primary. The app never prices a Procedure alone.
 */
export function soleProcedureFee(procedure: Procedure, ctx: ProcedureFeeContext): FeeResult {
  const result = bookingFeeFor([{ ...procedure, isPrimary: true }], () => ctx)
  if (result.kind !== 'ok') throw new Error('structural')
  return result.fees[procedure.id] as FeeResult
}

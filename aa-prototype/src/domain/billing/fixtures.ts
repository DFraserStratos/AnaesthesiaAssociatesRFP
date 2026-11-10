/**
 * Shared TEST fixtures for the billing suites (fee + validation). Not part of
 * the public domain API — not re-exported from any index; Phase 02's seeder
 * builds its own data.
 */

import type {
  Anaesthetist,
  BillableParty,
  Booking,
  Contract,
  Insurer,
  Party,
  Procedure,
  RvgGroup,
} from '../types'

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
    description: 'Laparoscopic cholecystectomy',
    billingRoute: 'hospital',
    isAdditional: false,
    selectedModifierCodes: [],
    ...overrides,
  }
}

export function mkBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    listId: 'list-1',
    patientId: 'pat-1',
    completed: false,
    attachments: [],
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

export function mkBillableParty(overrides: Partial<BillableParty> = {}): BillableParty {
  return {
    hiddenInternalId: 'bp-1',
    name: 'Angela Park',
    relationshipToPatient: 'Mother',
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
}

/** An RVG group that includes positioning (P1): the interim `includesModifierCodes`. */
export const BASE_ABSORBS_P1: RvgGroup = {
  id: 'RG-T-SP07',
  code: 'SP07',
  description: 'Spinal procedure, prone positioning included',
  anatomy: 'Spine',
  baseUnits: 7,
  modifierUnits: 0,
  retired: false,
  includesModifierCodes: ['P1'],
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
}

/** 2h30m on the demo day: 08:00 start, 10:30 handover (T = 11 units). */
export const START_0800 = '2026-07-21T08:00:00'
export const HANDOVER_1030 = '2026-07-21T10:30:00'

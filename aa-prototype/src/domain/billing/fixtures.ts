/**
 * Shared TEST fixtures for the billing suites (fee + validation). Not part of
 * the public domain API — not re-exported from any index; Phase 02's seeder
 * builds its own data.
 */

import type {
  Anaesthetist,
  BillableParty,
  Card,
  Contract,
  Insurer,
  Procedure,
  RvgCode,
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
    active: true,
    ...overrides,
  }
}

export function mkProcedure(overrides: Partial<Procedure> = {}): Procedure {
  return {
    id: 'proc-1',
    cardId: 'card-1',
    description: 'Laparoscopic cholecystectomy',
    billingRoute: 'hospital',
    accRelated: false,
    isAdditional: false,
    selectedModifierCodes: [],
    ...overrides,
  }
}

export function mkCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    listId: 'list-1',
    patientId: 'pat-1',
    completed: false,
    attachments: [],
    lastModifiedBy: 'Dr Melanie Souter',
    lastModifiedAtISO: '2026-07-21T08:00:00',
    ...overrides,
  }
}

export function mkContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'con-1',
    name: 'Test contract',
    type: 1,
    holderType: 'hospital',
    holderId: 'hosp-1',
    scope: { kind: 'organisation' },
    permitsIndividualArrangement: false,
    isDefault: false,
    effectiveFromISO: '2026-01-01',
    ...overrides,
  }
}

export function mkInsurer(overrides: Partial<Insurer> = {}): Insurer {
  return {
    id: 'ins-1',
    name: 'Southern Health Insurance',
    acceptsDirectClaims: true,
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

/** A plain 10-unit base code that absorbs nothing. */
export const BASE_SINGLE_10: RvgCode = {
  code: 'GA10',
  description: 'Upper abdominal procedure',
  anatomicalSite: 'Abdomen',
  baseUnits: { kind: 'single', units: 10 },
  absorbsModifierCodes: [],
}

/** A base code that absorbs positioning (P1). */
export const BASE_ABSORBS_P1: RvgCode = {
  code: 'SP07',
  description: 'Spinal procedure, prone positioning included',
  anatomicalSite: 'Spine',
  baseUnits: { kind: 'single', units: 7 },
  absorbsModifierCodes: ['P1'],
}

/** A range base code (5 to 9 units, anaesthetist selects). */
export const BASE_RANGE_5_9: RvgCode = {
  code: 'NR59',
  description: 'Complex regional procedure, graded',
  anatomicalSite: 'Limb',
  baseUnits: { kind: 'range', min: 5, max: 9 },
  absorbsModifierCodes: [],
}

/** 2h30m on the demo day: 08:00 start, 10:30 handover (T = 11 units). */
export const START_0800 = '2026-07-21T08:00:00'
export const HANDOVER_1030 = '2026-07-21T10:30:00'

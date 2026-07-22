/**
 * Seed patients (~150, all fictional) and the two BillableParty records.
 *
 * Pinned rows: the four design-day PM patients (NHIs from the mockups; David
 * Chen's ZAE0311 corrected to ZAE0310 — the mockup value fails the mod 11
 * check and the RFP rule beats the mockup simplification), the five canned
 * `lookupNhi` patients from Phase 01, the named scenario patients, and one
 * provisional no-NHI patient (the PDF pathway story; renders "NHI pending").
 * The generic pool is generated from the seeded RNG — mostly current-format
 * NHIs with several new-format ones, every patient carrying an NZHIS Level 4
 * ethnicity code from the demo subset.
 */

import type { BillableParty, Patient } from '../types'
import { generateNhi } from '../nhi'
import { ETHNICITY_DEMO_SUBSET } from '../nzhis'
import { slotRng } from './slotHash'

export const BP = {
  guardian: 'BP0001',
  ariaClinic: 'BP0002',
} as const

export const BILLABLE_PARTIES: readonly BillableParty[] = [
  {
    hiddenInternalId: BP.guardian,
    name: 'Hana Park',
    relationshipToPatient: 'Mother',
    phone: '021 555 7301',
    email: 'hana.park@example.net',
    address: '18 Clifford Avenue, Fendalton, Christchurch',
  },
  {
    hiddenInternalId: BP.ariaClinic,
    name: 'Aria Skin and Laser Clinic',
    relationshipToPatient: 'Contracting clinic',
    phone: '03 555 8140',
    email: 'accounts@aria-clinic.example',
    address: '210 Papanui Road, Merivale, Christchurch',
  },
] as const

/** Pinned patient ids the card seeder references by name. */
export const PAT = {
  tane: 'PT0001',
  marsh: 'PT0002',
  chen: 'PT0003',
  ellison: 'PT0004',
  mitchell: 'PT0005',
  walker: 'PT0006',
  tuilagi: 'PT0007',
  nair: 'PT0008',
  park: 'PT0009',
  provisional: 'PT0010',
  prentice: 'PT0011',
  holt: 'PT0012',
  bennett: 'PT0013',
  webb: 'PT0014',
  mills: 'PT0015',
  foster: 'PT0016',
  riley: 'PT0017',
  gray: 'PT0018',
} as const

const PINNED: readonly Patient[] = [
  // The design day's Southern Cross PM cards.
  { hiddenInternalId: PAT.tane, nhi: 'ZBC1123', name: 'Wiremu Tane', dobISO: '1979-08-22', phone: '021 555 3011', ethnicityCode: '21111' },
  { hiddenInternalId: PAT.marsh, nhi: 'ZAD2210', name: 'Susan Marsh', dobISO: '1961-02-09', phone: '03 555 3122', ethnicityCode: '11111' },
  { hiddenInternalId: PAT.chen, nhi: 'ZAE0310', name: 'David Chen', dobISO: '1988-11-30', phone: '021 555 3230', ethnicityCode: '42111' },
  { hiddenInternalId: PAT.ellison, nhi: 'ZAA0067', name: 'Margaret Ellison', dobISO: '1954-03-14', phone: '03 555 3349', ethnicityCode: '11111' },
  // The five canned lookupNhi patients (Phase 01's simulated Hub).
  { hiddenInternalId: PAT.mitchell, nhi: 'CQY9304', name: 'Sarah Mitchell', dobISO: '1988-04-12', phone: '021 555 3458', ethnicityCode: '11111' },
  { hiddenInternalId: PAT.walker, nhi: 'WQS3635', name: 'Hemi Walker', dobISO: '1975-09-03', phone: '021 555 3560', ethnicityCode: '21111' },
  { hiddenInternalId: PAT.tuilagi, nhi: 'JKL1188', name: 'Losa Tuilagi', dobISO: '1992-01-27', phone: '021 555 3676', ethnicityCode: '31111' },
  { hiddenInternalId: PAT.nair, nhi: 'MYY54SL', name: 'Priya Nair', dobISO: '1969-11-08', phone: '03 555 3781', ethnicityCode: '43111' },
  { hiddenInternalId: PAT.park, nhi: 'RUE29KR', name: 'Grace Park', dobISO: '2014-06-30', ethnicityCode: '42111' },
  // Provisional record: booked from a PDF referral, NHI to follow.
  { hiddenInternalId: PAT.provisional, name: 'Noah Prescott', dobISO: '1983-05-17', phone: '021 555 3899', ethnicityCode: '11111' },
  // Scenario patients.
  { hiddenInternalId: PAT.prentice, nhi: 'ZAC3326', name: 'Alan Prentice', dobISO: '1966-07-04', phone: '03 555 3902', ethnicityCode: '11111' },
  { hiddenInternalId: PAT.holt, nhi: 'ZAF4434', name: 'Brian Holt', dobISO: '1971-12-18', phone: '021 555 4013', ethnicityCode: '61118' },
  { hiddenInternalId: PAT.bennett, nhi: 'ZAG5541', name: 'Coral Bennett', dobISO: '1985-04-02', phone: '021 555 4127', ethnicityCode: '11111' },
  { hiddenInternalId: PAT.webb, nhi: 'ZAH6659', name: 'Marcus Webb', dobISO: '1977-10-11', phone: '021 555 4238', ethnicityCode: '53111' },
  { hiddenInternalId: PAT.mills, nhi: 'ZAJ7766', name: 'Gareth Mills', dobISO: '1969-03-25', phone: '03 555 4344', ethnicityCode: '11111' },
  { hiddenInternalId: PAT.foster, nhi: 'ZAK8873', name: 'Diane Foster', dobISO: '1958-09-19', phone: '03 555 4459', ethnicityCode: '11111' },
  { hiddenInternalId: PAT.riley, nhi: 'ZAL9972', name: 'Annette Riley', dobISO: '1990-01-06', phone: '021 555 4561', ethnicityCode: '52111' },
  { hiddenInternalId: PAT.gray, nhi: 'ZAM1098', name: 'Fiona Gray', dobISO: '1963-06-13', phone: '03 555 4678', ethnicityCode: '11111' },
] as const

// ---------------------------------------------------------------------------
// Generic pool
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Alice', 'Andrew', 'Anika', 'Aroha', 'Ben', 'Bridget', 'Callum', 'Charlotte', 'Chris', 'Claire',
  'Daniel', 'Dawn', 'Dylan', 'Eleanor', 'Eru', 'Esther', 'Finn', 'Fleur', 'Gavin', 'Gemma',
  'George', 'Hamish', 'Harriet', 'Hine', 'Ian', 'Isla', 'Jack', 'Jenny', 'Joanne', 'Jordan',
  'Kauri', 'Kylie', 'Lachlan', 'Laura', 'Leon', 'Lucy', 'Manaia', 'Marama', 'Matthew', 'Mei',
  'Mere', 'Michael', 'Mila', 'Nathan', 'Ngaire', 'Nikau', 'Olive', 'Owen', 'Paul', 'Rebecca',
  'Rangi', 'Ruth', 'Sam', 'Sina', 'Sione', 'Sophie', 'Stephen', 'Tama', 'Tessa', 'Wei',
] as const

const SURNAMES = [
  'Adams', 'Ahmed', 'Anderson', 'Baker', 'Barrett', 'Bishop', 'Brown', 'Campbell', 'Carter', 'Clark',
  'Collins', 'Davies', 'Dixon', 'Edwards', 'Faʻaoso', 'Fletcher', 'Fraser', 'Gibson', 'Graham', 'Harris',
  'Henare', 'Hopa', 'Huang', 'Hunter', 'Ioane', 'Jackson', 'Kaur', 'Kelly', 'Kereama', 'Kim',
  'Lawson', 'Lee', 'Liu', 'MacDonald', 'Mahmood', 'Matthews', 'McKenzie', 'Mete', 'Murray', 'Ngu',
  'Parata', 'Patel', 'Pereira', 'Peters', 'Rangi', 'Ratima', 'Robinson', 'Ryan', 'Scott', 'Sharma',
  'Simpson', 'Singh', 'Stewart', 'Taylor', 'Thompson', 'Tui', 'Turner', 'Walsh', 'Watson', 'Zhang',
] as const

const ETHNICITY_CODES = ETHNICITY_DEMO_SUBSET.map((e) => e.code)

/** Number of generated (non-pinned) patients. */
const GENERIC_COUNT = 132

/**
 * Build the full patient master. Deterministic: one dedicated RNG stream,
 * NHIs regenerated on (rare) duplicates so every seeded NHI is unique and
 * valid; roughly one in nine gets a new-format NHI.
 */
export function buildPatients(seed: number): Patient[] {
  const rng = slotRng(seed, 'patients')
  const usedNhis = new Set<string>(PINNED.flatMap((p) => (p.nhi !== undefined ? [p.nhi] : [])))
  const patients: Patient[] = [...PINNED]

  for (let i = 0; i < GENERIC_COUNT; i++) {
    const format = i % 9 === 8 ? 'new' : 'current'
    let nhi = generateNhi(format, rng)
    while (usedNhis.has(nhi)) nhi = generateNhi(format, rng)
    usedNhis.add(nhi)

    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)] ?? 'Alex'
    const last = SURNAMES[Math.floor(rng() * SURNAMES.length)] ?? 'Smith'
    const year = 1938 + Math.floor(rng() * 70)
    const month = 1 + Math.floor(rng() * 12)
    const day = 1 + Math.floor(rng() * 28)
    const ethnicity = ETHNICITY_CODES[Math.floor(rng() * ETHNICITY_CODES.length)] ?? '11111'

    const patient: Patient = {
      hiddenInternalId: `PT${String(PINNED.length + i + 1).padStart(4, '0')}`,
      nhi,
      name: `${first} ${last}`,
      dobISO: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      ethnicityCode: ethnicity,
    }
    if (rng() < 0.7) patient.phone = `021 555 ${String(4700 + i).padStart(4, '0')}`
    patients.push(patient)
  }

  return patients
}

/** Ids of the generic pool (assigned to generated cards in order). */
export function genericPatientIds(): string[] {
  return Array.from({ length: GENERIC_COUNT }, (_, i) => `PT${String(PINNED.length + i + 1).padStart(4, '0')}`)
}

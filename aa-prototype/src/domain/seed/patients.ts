/**
 * Seed patients (~150, all fictional) and the seeded payer records.
 *
 * Pinned rows: the four design-day PM patients (NHIs from the mockups; David
 * Chen's ZAE0311 corrected to ZAE0310 — the mockup value fails the mod 11
 * check and the RFP rule beats the mockup simplification), the five canned
 * `lookupNhi` patients from Phase 01, the named scenario patients, and one
 * provisional no-NHI patient (the PDF pathway story; renders "NHI pending").
 * The generic pool is generated from the seeded RNG — mostly current-format
 * NHIs with several new-format ones, every patient carrying an NZHIS Level 4
 * ethnicity code from the demo subset. Catch-up Phase 21 appends the payer
 * review patients after the pool (so no generated id moves) and gives every
 * patient a deterministic email and NZ Post postal address, derived from the
 * id with no RNG draw, except the ones left blank on purpose.
 */

import type { Patient, PostalAddress, ProcedurePayer } from '../types'
import { generateNhi } from '../nhi'
import { ETHNICITY_DEMO_SUBSET } from '../nzhis'
import { slotRng } from './slotHash'

/**
 * The `BP####` ids the retired guardian master held (catch-up Phase 21, RV-30):
 * `guardian` is now Hana Park's id as the payer on Grace Park's Booking; Aria's
 * is the billing identity its Party carries (`seed/parties.ts`). Both keep
 * their Xero contacts. New payers are allocated from `counters.billableParty`.
 */
export const BP = {
  guardian: 'BP0001',
  ariaClinic: 'BP0002',
} as const

/**
 * The next payer id the seed leaves for runtime allocation: BP0001, Aria's
 * BP0002, the seeded family trust's BP0003 and the two-payer Booking's BP0004
 * and BP0005 (catch-up Phase 22a) are taken.
 */
export const SEED_PAYER_COUNTER = 6

/** Hana Park's postal address (re-expressed from the retired master's free text). */
const HANA_PARK_ADDRESS: PostalAddress = { line1: '18 Clifford Avenue', suburb: 'Fendalton', city: 'Christchurch', postcode: '8052' }

/** Hana Park, Grace Park's mother, as the payer on her Booking (the retired guardian row, BP0001). */
export const HANA_PARK_PAYER: ProcedurePayer = {
  kind: 'other',
  id: BP.guardian,
  name: 'Hana Park',
  relationship: 'Mother',
  email: 'hana.park@example.net',
  phone: '021 555 7301',
  postalAddress: HANA_PARK_ADDRESS,
}

/** Pinned patient ids the booking seeder references by name. */
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
  sinclair: 'PT0019',
} as const

const PINNED: readonly Patient[] = [
  // The design day's Southern Cross PM bookings.
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
  // The Phase 04 rate x time CAPTURE booking's patient (Souter, Mon 27 Jul).
  { hiddenInternalId: PAT.sinclair, nhi: 'ZAN2219', name: 'Heather Sinclair', dobISO: '1968-02-21', phone: '021 555 4785', ethnicityCode: '11111' },
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

  patients.push(...PAYER_REVIEW_PATIENTS, ...COMPLETION_PATIENTS, ...REVIEW_FLAG_PATIENTS, ...PROCEDURE_PAYER_PATIENTS)
  return patients.map(withSeedContact)
}

/**
 * The payer review patients (catch-up Phase 21): dedicated pinned patients
 * for the payer review List and the Southern Cross "Suggested" Booking,
 * appended after the generated pool so no generated id moves. Fixed, valid
 * NHIs; none is ever handed out by `takePatient`.
 */
export const PAT_REVIEW = {
  childPayer: `PT${String(19 + 132 + 1).padStart(4, '0')}`,
  contactMissing: `PT${String(19 + 132 + 2).padStart(4, '0')}`,
  familyTrust: `PT${String(19 + 132 + 3).padStart(4, '0')}`,
  approvalMissing: `PT${String(19 + 132 + 4).padStart(4, '0')}`,
  funderNoWarning: `PT${String(19 + 132 + 5).padStart(4, '0')}`,
  suggestedTag: `PT${String(19 + 132 + 6).padStart(4, '0')}`,
} as const

/** Catch-up Phase 21a's dedicated patients (`seed/completionBookings.ts`), after the payer review's. */
export const PAT_21A = {
  fixedPriceNoTimes: `PT${String(19 + 132 + 7).padStart(4, '0')}`,
  needsPrice: `PT${String(19 + 132 + 8).padStart(4, '0')}`,
} as const

/** Catch-up Phase 21a session 2's dedicated patients (`seed/reviewFlagBookings.ts`), after session 1's. */
export const PAT_21A_REVIEW = {
  contractChange: `PT${String(19 + 132 + 9).padStart(4, '0')}`,
  typedPrice: `PT${String(19 + 132 + 10).padStart(4, '0')}`,
  needsPrice: `PT${String(19 + 132 + 11).padStart(4, '0')}`,
  otherSurgeon: `PT${String(19 + 132 + 12).padStart(4, '0')}`,
  movableFixed: `PT${String(19 + 132 + 13).padStart(4, '0')}`,
} as const

/** Catch-up Phase 22a's dedicated patient (`seed/procedurePayerBookings.ts`), after 21a's. */
export const PAT_22A = {
  twoPayers: `PT${String(19 + 132 + 14).padStart(4, '0')}`,
} as const

/** The two-payer Booking's patient: an adult whose two Procedures name two payers typed in separately. */
const PROCEDURE_PAYER_PATIENTS: readonly Patient[] = [
  { hiddenInternalId: PAT_22A.twoPayers, nhi: 'ZBC1000', name: 'Joyce Halvorsen', dobISO: '1944-07-30', phone: '03 555 6434', ethnicityCode: '11111' },
]

const REVIEW_FLAG_PATIENTS: readonly Patient[] = [
  { hiddenInternalId: PAT_21A_REVIEW.contractChange, nhi: 'ZAX1009', name: 'Diane Fairweather', dobISO: '1953-02-11', phone: '021 555 5989', ethnicityCode: '11111' },
  { hiddenInternalId: PAT_21A_REVIEW.typedPrice, nhi: 'ZAY1004', name: 'Owen Prendergast', dobISO: '1947-11-30', phone: '03 555 6090', ethnicityCode: '11111' },
  { hiddenInternalId: PAT_21A_REVIEW.needsPrice, nhi: 'ZAZ1000', name: 'Hemi Walker', dobISO: '1970-06-18', phone: '021 555 6101', ethnicityCode: '21111' },
  { hiddenInternalId: PAT_21A_REVIEW.otherSurgeon, nhi: 'ZBA1009', name: 'Rosalind Kerr', dobISO: '1961-09-05', phone: '021 555 6212', ethnicityCode: '11111' },
  { hiddenInternalId: PAT_21A_REVIEW.movableFixed, nhi: 'ZBB1004', name: 'Fiona Lattimer', dobISO: '1968-01-24', phone: '021 555 6323', ethnicityCode: '11111' },
]

const COMPLETION_PATIENTS: readonly Patient[] = [
  { hiddenInternalId: PAT_21A.fixedPriceNoTimes, nhi: 'ZAV1008', name: 'Miriam Holloway', dobISO: '1966-04-21', phone: '021 555 5767', ethnicityCode: '11111' },
  { hiddenInternalId: PAT_21A.needsPrice, nhi: 'ZAW1003', name: 'Graham Pulley', dobISO: '1958-09-03', phone: '021 555 5878', ethnicityCode: '11111' },
]

const PAYER_REVIEW_PATIENTS: readonly Patient[] = [
  // 15 on the review List's date: the child payer warning (US-11.2.4).
  { hiddenInternalId: PAT_REVIEW.childPayer, nhi: 'ZAP3318', name: 'Ella Moana', dobISO: '2011-03-08', phone: '021 555 5101', ethnicityCode: '21111' },
  // An adult with no email and no postal address on file: "Email or postal address needed" (US-11.2.3).
  { hiddenInternalId: PAT_REVIEW.contactMissing, nhi: 'ZAQ4425', name: 'Kevin Doherty', dobISO: '1972-10-14', phone: '03 555 5212', ethnicityCode: '11111' },
  // An adult whose payer is a family trust by post (no flag; Phase 22 posts its invoice).
  { hiddenInternalId: PAT_REVIEW.familyTrust, nhi: 'ZAR5532', name: 'Robert Whitcombe', dobISO: '1949-05-02', phone: '03 555 5323', ethnicityCode: '11111' },
  // Session 2's insurance cases (US-11.4.3) and the "Suggested" Booking (US-04.3.10).
  { hiddenInternalId: PAT_REVIEW.approvalMissing, nhi: 'ZAS6640', name: 'Janet Ormsby', dobISO: '1981-08-27', phone: '021 555 5434', ethnicityCode: '11111' },
  { hiddenInternalId: PAT_REVIEW.funderNoWarning, nhi: 'ZAT7757', name: 'Peter Tawhiri', dobISO: '1964-12-09', phone: '021 555 5545', ethnicityCode: '21111' },
  { hiddenInternalId: PAT_REVIEW.suggestedTag, nhi: 'ZAU8864', name: 'Lucy Fairhall', dobISO: '1977-02-16', phone: '021 555 5656', ethnicityCode: '11111' },
]

/** Patients left with no email or postal address on purpose. */
const NO_CONTACT: ReadonlySet<string> = new Set([PAT_REVIEW.contactMissing])

/** A Christchurch suburb and its NZ Post postcode, picked by id for the seed's addresses. */
const SUBURBS: readonly { suburb: string; postcode: string }[] = [
  { suburb: 'Fendalton', postcode: '8052' },
  { suburb: 'Merivale', postcode: '8014' },
  { suburb: 'Riccarton', postcode: '8041' },
  { suburb: 'Sydenham', postcode: '8023' },
  { suburb: 'St Albans', postcode: '8014' },
  { suburb: 'Papanui', postcode: '8053' },
  { suburb: 'Cashmere', postcode: '8022' },
  { suburb: 'Sumner', postcode: '8081' },
  { suburb: 'Halswell', postcode: '8025' },
  { suburb: 'Burnside', postcode: '8053' },
  { suburb: 'Hornby', postcode: '8042' },
  { suburb: 'Linwood', postcode: '8062' },
]

const STREETS: readonly string[] = [
  'Clyde Road', 'Ilam Road', 'Papanui Road', 'Strickland Street', 'Bealey Avenue', 'Harewood Road',
  'Dyers Pass Road', 'Nayland Street', 'Halswell Road', 'Memorial Avenue', 'Main South Road', 'Linwood Avenue',
  'Rossall Street', 'Innes Road', 'Colombo Street', 'Barrington Street', 'Wairakei Road', 'Hills Road',
]

/** `Sarah Mitchell` → `sarah.mitchell`: letters only, lower case, joined by dots. */
function emailLocalPart(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[^A-Za-z ]/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join('.')
}

/**
 * The seed's contact for a patient (catch-up Phase 21, US-11.2.3): an
 * `@example.net` email (the id's number keeps it unique) and an NZ Post postal
 * address, both derived from the id, so no RNG draw moves. Grace Park, a
 * child, shares her mother's postal address and has no email.
 */
function withSeedContact(patient: Patient): Patient {
  if (NO_CONTACT.has(patient.hiddenInternalId)) return patient
  const n = Number(patient.hiddenInternalId.replace(/\D/g, '')) || 0
  if (patient.hiddenInternalId === PAT.park) return { ...patient, postalAddress: HANA_PARK_ADDRESS }
  const place = SUBURBS[n % SUBURBS.length] as { suburb: string; postcode: string }
  const street = STREETS[(n * 7) % STREETS.length] as string
  return {
    ...patient,
    email: `${emailLocalPart(patient.name)}${n}@example.net`,
    postalAddress: { line1: `${(n * 13) % 240 + 2} ${street}`, suburb: place.suburb, city: 'Christchurch', postcode: place.postcode },
  }
}

/** Ids of the generic pool (assigned to generated bookings in order). */
export function genericPatientIds(): string[] {
  return Array.from({ length: GENERIC_COUNT }, (_, i) => `PT${String(PINNED.length + i + 1).padStart(4, '0')}`)
}

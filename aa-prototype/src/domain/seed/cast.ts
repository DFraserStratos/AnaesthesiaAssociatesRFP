/**
 * The seed cast — anaesthetists, surgeons, hospitals, insurers, the contract
 * holder organisation and the list-status master. All 14 anaesthetists and the
 * hospital/surgeon spellings come from the design mockups (PROGRESS Decisions
 * 2026-07-21); every person is fictional.
 */

import type {
  Anaesthetist,
  ContractHolderOrganisation,
  Hospital,
  Insurer,
  ListStatus,
  Surgeon,
  SurgeonGroup,
  SurgeonRoom,
} from '../types'

// ---------------------------------------------------------------------------
// Anaesthetists (the design's 14; Souter is the demo persona)
// ---------------------------------------------------------------------------

/** Registration numbers double as IDs (RFP master; fictional values). */
export const ANAE = {
  souter: '34821',
  rutherford: '29104',
  sharma: '41267',
  ngata: '38455',
  beaumont: '31902',
  chen: '45178',
  ropata: '39560',
  delaney: '27731',
  fitzgerald: '43015',
  hughes: '46822',
  morrison: '25490',
  whitaker: '36208',
  ngatai: '44519',
  strand: '47733',
} as const

/**
 * Distinct unit values $26 to $42 (Souter $26.50 per the mockups' "@ $26.50
 * per unit"); exactly one non-monthly GST period (Whitaker, six monthly).
 * HPI identifiers are fictional. Start dates (catch-up Phase 28, US-01.1.3)
 * are staggered joining dates, all before the schedule horizon and the
 * seeded billing history, so every seeded anaesthetist has Slots on every
 * horizon day.
 */
export const ANAESTHETISTS: readonly Anaesthetist[] = [
  { registrationNumber: ANAE.souter, name: 'Dr Melanie Souter', phone: '021 555 0134', email: 'm.souter@aa-associates.example', unitValue: 26.5, gstPeriod: 'monthly', hpiId: '10SOUM', startDateISO: '2014-02-03', active: true },
  { registrationNumber: ANAE.rutherford, name: 'Dr James Rutherford', phone: '021 555 0217', email: 'j.rutherford@aa-associates.example', unitValue: 32, gstPeriod: 'monthly', hpiId: '11RUTJ', startDateISO: '2009-03-02', active: true },
  { registrationNumber: ANAE.sharma, name: 'Dr Priya Sharma', phone: '021 555 0342', email: 'p.sharma@aa-associates.example', unitValue: 30, gstPeriod: 'monthly', hpiId: '12SHAP', startDateISO: '2016-07-04', active: true },
  { registrationNumber: ANAE.ngata, name: 'Dr Tom Ngata', phone: '021 555 0458', email: 't.ngata@aa-associates.example', unitValue: 28, gstPeriod: 'monthly', hpiId: '13NGAT', startDateISO: '2018-01-15', active: true },
  { registrationNumber: ANAE.beaumont, name: 'Dr Sarah Beaumont', phone: '021 555 0563', email: 's.beaumont@aa-associates.example', unitValue: 31, gstPeriod: 'monthly', hpiId: '14BEAS', startDateISO: '2011-05-02', active: true },
  { registrationNumber: ANAE.chen, name: 'Dr Alistair Chen', phone: '021 555 0629', email: 'a.chen@aa-associates.example', unitValue: 29.5, gstPeriod: 'monthly', hpiId: '15CHEA', startDateISO: '2013-09-02', active: true },
  { registrationNumber: ANAE.ropata, name: 'Dr Hannah Ropata', phone: '021 555 0771', email: 'h.ropata@aa-associates.example', unitValue: 27.5, gstPeriod: 'monthly', hpiId: '16ROPH', startDateISO: '2019-02-04', active: true },
  { registrationNumber: ANAE.delaney, name: 'Dr Mark Delaney', phone: '021 555 0808', email: 'm.delaney@aa-associates.example', unitValue: 33, gstPeriod: 'monthly', hpiId: '17DELM', startDateISO: '2010-08-02', active: true },
  { registrationNumber: ANAE.fitzgerald, name: 'Dr Emma Fitzgerald', phone: '021 555 0915', email: 'e.fitzgerald@aa-associates.example', unitValue: 30.5, gstPeriod: 'monthly', hpiId: '18FITE', startDateISO: '2017-03-06', active: true },
  { registrationNumber: ANAE.hughes, name: 'Dr Rawiri Hughes', phone: '021 555 1046', email: 'r.hughes@aa-associates.example', unitValue: 26, gstPeriod: 'monthly', hpiId: '19HUGR', startDateISO: '2021-01-11', active: true },
  { registrationNumber: ANAE.morrison, name: 'Dr Kate Morrison', phone: '021 555 1187', email: 'k.morrison@aa-associates.example', unitValue: 35, gstPeriod: 'monthly', hpiId: '20MORK', startDateISO: '2012-04-02', active: true },
  { registrationNumber: ANAE.whitaker, name: 'Dr Ben Whitaker', phone: '021 555 1253', email: 'b.whitaker@aa-associates.example', unitValue: 28.5, gstPeriod: 'sixMonthly', hpiId: '21WHIB', startDateISO: '2015-10-05', active: true },
  { registrationNumber: ANAE.ngatai, name: 'Dr Aroha Ngatai', phone: '021 555 1394', email: 'a.ngatai@aa-associates.example', unitValue: 27, gstPeriod: 'monthly', hpiId: '22NGAA', startDateISO: '2022-06-06', active: true },
  { registrationNumber: ANAE.strand, name: 'Dr Oliver Strand', phone: '021 555 1420', email: 'o.strand@aa-associates.example', unitValue: 42, gstPeriod: 'monthly', hpiId: '23STRO', startDateISO: '2024-02-05', active: true },
] as const

// ---------------------------------------------------------------------------
// Surgeons (the design's 9 + 1 to reach ~10)
// ---------------------------------------------------------------------------

export const SURG = {
  hale: 'S-HALE',
  patel: 'S-PATEL',
  whitford: 'S-WHITFORD',
  okafor: 'S-OKAFOR',
  lim: 'S-LIM',
  doyle: 'S-DOYLE',
  tan: 'S-TAN',
  reid: 'S-REID',
  nand: 'S-NAND',
  cameron: 'S-CAMERON',
} as const

/**
 * Surgeons' rooms (catch-up Phase 17, US-13.6.1). Fictional names, `.example`
 * emails and 03 555 phones. A room's surgeons are derived from
 * `Surgeon.roomId`; every room has at least one.
 */
export const ROOM = {
  riccarton: 'RM-RICC',
  merivale: 'RM-MERI',
  avonside: 'RM-AVON',
  fendalton: 'RM-FEND',
  papanui: 'RM-PAPA',
} as const

export const SURGEON_ROOMS: readonly SurgeonRoom[] = [
  { id: ROOM.riccarton, name: 'Riccarton Orthopaedic Rooms', contactEmail: 'reception@riccartonortho.example', phone: '03 555 0141' },
  { id: ROOM.merivale, name: 'Merivale Eye Rooms', contactEmail: 'bookings@merivaleeye.example', phone: '03 555 0172' },
  { id: ROOM.avonside, name: 'Avonside Surgical Rooms', contactEmail: 'admin@avonsidesurgical.example', phone: '03 555 0118' },
  { id: ROOM.fendalton, name: 'Fendalton Specialist Rooms', contactEmail: 'rooms@fendaltonspecialists.example', phone: '03 555 0193' },
  { id: ROOM.papanui, name: 'Papanui Specialist Rooms', contactEmail: 'reception@papanuispecialists.example', phone: '03 555 0127' },
] as const

/**
 * Every surgeon carries a room, a fictional HPI CPN (`NNAAAA`, 40 to 49, so
 * none clashes with the anaesthetists' 10 to 23) and a fictional NZ medical
 * registration number held for information. The canvas's pick arrays
 * (`CES_SURGEONS`, `GENERAL_SURGEONS`) read only the ids, so these fields move
 * no List (canvasFingerprint.test.ts).
 */
export const SURGEONS: readonly Surgeon[] = [
  { id: SURG.hale, name: 'Mr T. Hale', specialty: 'Orthopaedics', roomId: ROOM.riccarton, hpiId: '40HALT', medicalRegistrationNumber: '70412' },
  { id: SURG.patel, name: 'Ms K. Patel', specialty: 'General surgery', roomId: ROOM.avonside, hpiId: '41PATK', medicalRegistrationNumber: '71588' },
  { id: SURG.whitford, name: 'Mr J. Whitford', specialty: 'Ophthalmology', roomId: ROOM.merivale, hpiId: '42WHIJ', medicalRegistrationNumber: '72905' },
  { id: SURG.okafor, name: 'Mr C. Okafor', specialty: 'General surgery', roomId: ROOM.avonside, hpiId: '43OKAC', medicalRegistrationNumber: '73318' },
  { id: SURG.lim, name: 'Ms G. Lim', specialty: 'Plastics', roomId: ROOM.fendalton, hpiId: '44LIMG', medicalRegistrationNumber: '74071' },
  { id: SURG.doyle, name: 'Mr P. Doyle', specialty: 'General surgery', roomId: ROOM.avonside, hpiId: '45DOYP', medicalRegistrationNumber: '75264' },
  { id: SURG.tan, name: 'Mr S. Tan', specialty: 'Urology', roomId: ROOM.papanui, hpiId: '46TANS', medicalRegistrationNumber: '76630' },
  { id: SURG.reid, name: 'Ms A. Reid', specialty: 'Ophthalmology', roomId: ROOM.merivale, hpiId: '47REIA', medicalRegistrationNumber: '77149' },
  { id: SURG.nand, name: 'Mr V. Nand', specialty: 'ENT', roomId: ROOM.fendalton, hpiId: '48NANV', medicalRegistrationNumber: '78852' },
  { id: SURG.cameron, name: 'Ms H. Cameron', specialty: 'Gynaecology', roomId: ROOM.papanui, hpiId: '49CAMH', medicalRegistrationNumber: '79503' },
] as const

/**
 * Surgeon groups (US-13.4.1), a master beside `ORGANISATIONS` (left untouched
 * for Phase 18, whose COS rooms holder links to `SG-COS`).
 */
export const SURGEON_GROUPS: readonly SurgeonGroup[] = [
  {
    id: 'SG-COS',
    name: 'Canterbury Orthopaedic Surgeons',
    description: 'Orthopaedic group; holds an externally held ACC contract.',
    memberSurgeonIds: [SURG.hale],
  },
  {
    id: 'SG-EYE',
    name: 'Christchurch Eye Surgeons',
    description: 'The eye surgeons who operate at Christchurch Eye Surgery.',
    memberSurgeonIds: [SURG.whitford, SURG.reid],
  },
] as const

// ---------------------------------------------------------------------------
// Hospitals, insurers, contract-holder organisations
// ---------------------------------------------------------------------------

export const HOSP = {
  stg: 'H-STG',
  sx: 'H-SX',
  forte: 'H-FORTE',
  ces: 'H-CES',
  cph: 'H-CPH',
} as const

export const HOSPITALS: readonly Hospital[] = [
  { id: HOSP.stg, name: "St George's", contactEmail: 'bookings@stgeorges.example' },
  { id: HOSP.sx, name: 'Southern Cross', contactEmail: 'theatre.bookings@southerncross.example' },
  { id: HOSP.forte, name: 'Forte Health', contactEmail: 'bookings@fortehealth.example' },
  { id: HOSP.ces, name: 'Christchurch Eye Surgery', contactEmail: 'bookings@chcheyesurgery.example' },
  { id: HOSP.cph, name: 'Christchurch Public', contactEmail: 'theatre.bookings@chchpublic.example' },
] as const

export const INS = {
  nib: 'I-NIB',
  aia: 'I-AIA',
} as const

/**
 * nib accepts direct claims (the Insurer billing route); AIA Health does not —
 * it exists as the informational insurer behind the insured reimbursement
 * scenario and the validator's direct-claims rejection tests.
 */
export const INSURERS: readonly Insurer[] = [
  { id: INS.nib, name: 'nib', acceptsDirectClaims: true },
  { id: INS.aia, name: 'AIA Health', acceptsDirectClaims: false },
] as const

export const ORG = {
  cos: 'O-COS',
} as const

export const ORGANISATIONS: readonly ContractHolderOrganisation[] = [
  {
    id: ORG.cos,
    name: 'Canterbury Orthopaedic Surgeons',
    description: 'Surgical group holding an externally held ACC contract (the RFP group holder case).',
  },
] as const

// ---------------------------------------------------------------------------
// List-status master (labels match theme/statusColours.ts)
// ---------------------------------------------------------------------------

export const LIST_STATUSES: readonly ListStatus[] = [
  { key: 'private', label: 'Private', description: 'Private list booked for a surgeon at a private hospital.' },
  { key: 'public', label: 'Public', description: 'Public hospital session (Te Whatu Ora).' },
  { key: 'preop', label: 'Pre-op', description: 'Pre-op assessment clinic at AA rooms.' },
  { key: 'holiday', label: 'Holiday', description: 'Annual or other approved leave.' },
  { key: 'unavailable', label: 'Unavailable', description: 'Not available for booking.' },
  { key: 'free', label: 'Free', description: 'Free and open for booking or cover.' },
] as const

/**
 * The seed cast — anaesthetists, surgeons, hospitals, insurers, the contract
 * holder organisation and the list-status master. All 14 anaesthetists and the
 * hospital/surgeon spellings come from the design mockups (PROGRESS Decisions
 * 2026-07-21); every person is fictional.
 */

import { SPC } from './specialties'
import { seedBankAccountNumber } from '../bankAccount'
import { nameWithoutTitle } from '../names'
import type {
  Anaesthetist,
  BankAccount,
  ContractHolderOrganisation,
  Hospital,
  Insurer,
  SlotStatus,
  Surgeon,
  SurgeonContact,
  SurgeonGroup,
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
 * per unit"). HPI CPNs are fictional, one each (mandatory, Phase 26). Start
 * dates (catch-up Phase 28, US-01.1.3) are staggered joining dates, all
 * before the schedule horizon and the seeded billing history, so every seeded
 * anaesthetist has Slots on every horizon day. Bank details and GST numbers
 * are added below.
 */
type SeedAnaesthetistRecord = Omit<Anaesthetist, 'bankAccount' | 'gstNumber'>

const ANAESTHETIST_RECORDS: readonly SeedAnaesthetistRecord[] = [
  { registrationNumber: ANAE.souter, name: 'Dr Melanie Souter', phone: '021 555 0134', email: 'm.souter@aa-associates.example', unitValue: 26.5, hpiId: '10SOUM', startDateISO: '2014-06-09', active: true },
  { registrationNumber: ANAE.rutherford, name: 'Dr James Rutherford', phone: '021 555 0217', email: 'j.rutherford@aa-associates.example', unitValue: 32, hpiId: '11RUTJ', startDateISO: '2009-07-06', active: true },
  { registrationNumber: ANAE.sharma, name: 'Dr Priya Sharma', phone: '021 555 0342', email: 'p.sharma@aa-associates.example', unitValue: 30, hpiId: '12SHAP', startDateISO: '2016-11-07', active: true },
  { registrationNumber: ANAE.ngata, name: 'Dr Tom Ngata', phone: '021 555 0458', email: 't.ngata@aa-associates.example', unitValue: 28, hpiId: '13NGAT', startDateISO: '2018-05-21', active: true },
  { registrationNumber: ANAE.beaumont, name: 'Dr Sarah Beaumont', phone: '021 555 0563', email: 's.beaumont@aa-associates.example', unitValue: 31, hpiId: '14BEAS', startDateISO: '2011-09-05', active: true },
  { registrationNumber: ANAE.chen, name: 'Dr Alistair Chen', phone: '021 555 0629', email: 'a.chen@aa-associates.example', unitValue: 29.5, hpiId: '15CHEA', startDateISO: '2014-01-06', active: true },
  { registrationNumber: ANAE.ropata, name: 'Dr Hannah Ropata', phone: '021 555 0771', email: 'h.ropata@aa-associates.example', unitValue: 27.5, hpiId: '16ROPH', startDateISO: '2019-06-10', active: true },
  { registrationNumber: ANAE.delaney, name: 'Dr Mark Delaney', phone: '021 555 0808', email: 'm.delaney@aa-associates.example', unitValue: 33, hpiId: '17DELM', startDateISO: '2010-12-06', active: true },
  { registrationNumber: ANAE.fitzgerald, name: 'Dr Emma Fitzgerald', phone: '021 555 0915', email: 'e.fitzgerald@aa-associates.example', unitValue: 30.5, hpiId: '18FITE', startDateISO: '2017-07-10', active: true },
  { registrationNumber: ANAE.hughes, name: 'Dr Rawiri Hughes', phone: '021 555 1046', email: 'r.hughes@aa-associates.example', unitValue: 26, hpiId: '19HUGR', startDateISO: '2021-01-11', active: true },
  { registrationNumber: ANAE.morrison, name: 'Dr Kate Morrison', phone: '021 555 1187', email: 'k.morrison@aa-associates.example', unitValue: 35, hpiId: '20MORK', startDateISO: '2012-08-06', active: true },
  { registrationNumber: ANAE.whitaker, name: 'Dr Ben Whitaker', phone: '021 555 1253', email: 'b.whitaker@aa-associates.example', unitValue: 28.5, hpiId: '21WHIB', startDateISO: '2016-02-08', active: true },
  { registrationNumber: ANAE.ngatai, name: 'Dr Aroha Ngatai', phone: '021 555 1394', email: 'a.ngatai@aa-associates.example', unitValue: 27, hpiId: '22NGAA', startDateISO: '2022-06-06', active: true },
  { registrationNumber: ANAE.strand, name: 'Dr Oliver Strand', phone: '021 555 1420', email: 'o.strand@aa-associates.example', unitValue: 42, hpiId: '23STRO', startDateISO: '2024-02-05', active: true },
] as const

/**
 * The anaesthetists' GST numbers (catch-up Phase 22; DM-62, US-08.4.5):
 * SYNTHETIC, nine digits made from the registration number ("104", the
 * registration number, "1"), so each is unique and stable; Dr Souter's is
 * 104-348-211, the one the demo guide quotes. Dr Strand, off every scripted
 * beat, is left blank so "GST number not held" shows.
 */
export function syntheticGstNumber(registrationNumber: string): string {
  return `104${registrationNumber}1`
}

/**
 * The anaesthetists' bank details (catch-up Phase 26; US-12.1.4, OQ-14,
 * DM-32): every one of the 14 has them, since they are mandatory. The account
 * name is the anaesthetist's name without the title (`nameWithoutTitle`); the number comes from
 * the registration number on bank 99, a code no NZ bank is issued
 * (`seedBankAccountNumber`), so it is plainly fictional. No RNG draw.
 */
function seedBankAccount(a: SeedAnaesthetistRecord): BankAccount {
  return { accountName: nameWithoutTitle(a.name), accountNumber: seedBankAccountNumber(a.registrationNumber) }
}

export const ANAESTHETISTS: readonly Anaesthetist[] = ANAESTHETIST_RECORDS.map((a) => ({
  ...a,
  bankAccount: seedBankAccount(a),
  ...(a.registrationNumber === ANAE.strand ? {} : { gstNumber: syntheticGstNumber(a.registrationNumber) }),
}))

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
 * The cast's practices (catch-up Phase 17b, D74): plain text on each surgeon,
 * with the practice's shared inbox as the surgeon's one office contact.
 * Fictional names, `.example` emails and 03 555 phones (the five rooms Phase
 * 17 seeded, kept as practice names; the system holds no room record).
 */
const PRACTICE = {
  riccarton: { name: 'Riccarton Orthopaedic Rooms', email: 'reception@riccartonortho.example', phone: '03 555 0141' },
  merivale: { name: 'Merivale Eye Rooms', email: 'bookings@merivaleeye.example', phone: '03 555 0172' },
  avonside: { name: 'Avonside Surgical Rooms', email: 'admin@avonsidesurgical.example', phone: '03 555 0118' },
  fendalton: { name: 'Fendalton Specialist Rooms', email: 'rooms@fendaltonspecialists.example', phone: '03 555 0193' },
  papanui: { name: 'Papanui Specialist Rooms', email: 'reception@papanuispecialists.example', phone: '03 555 0127' },
} as const

/** A practice's shared inbox as an office contact, named for the practice. */
function practiceInbox(practice: (typeof PRACTICE)[keyof typeof PRACTICE]): SurgeonContact {
  return { name: practice.name, email: practice.email, phone: practice.phone }
}

/**
 * Every surgeon carries a practice name, a personal contact (an invented
 * `.example` email and a 021 555 phone), the practice inbox as their office
 * contact, a fictional HPI CPN (`NNAAAA`, 40 to 49, so none clashes with the
 * anaesthetists' 10 to 23) and a fictional NZ medical registration number held
 * for information. The canvas's pick arrays (`CES_SURGEONS`,
 * `GENERAL_SURGEONS`) read only the ids, so these fields move no List
 * (canvasFingerprint.test.ts).
 */
export const SURGEONS: readonly Surgeon[] = [
  { id: SURG.hale, name: 'Mr T. Hale', specialtyIds: [SPC.orthopaedics], practiceName: PRACTICE.riccarton.name, personalContact: { name: 'Mr T. Hale', email: 't.hale@surgeons.example', phone: '021 555 0401' }, officeContacts: [practiceInbox(PRACTICE.riccarton)], hpiId: '40HALT', medicalRegistrationNumber: '70412' },
  { id: SURG.patel, name: 'Ms K. Patel', specialtyIds: [SPC.generalSurgery], practiceName: PRACTICE.avonside.name, personalContact: { name: 'Ms K. Patel', email: 'k.patel@surgeons.example', phone: '021 555 0412' }, officeContacts: [practiceInbox(PRACTICE.avonside)], hpiId: '41PATK', medicalRegistrationNumber: '71588' },
  { id: SURG.whitford, name: 'Mr J. Whitford', specialtyIds: [SPC.ophthalmology], practiceName: PRACTICE.merivale.name, personalContact: { name: 'Mr J. Whitford', email: 'j.whitford@surgeons.example', phone: '021 555 0423' }, officeContacts: [practiceInbox(PRACTICE.merivale)], hpiId: '42WHIJ', medicalRegistrationNumber: '72905' },
  { id: SURG.okafor, name: 'Mr C. Okafor', specialtyIds: [SPC.generalSurgery], practiceName: PRACTICE.avonside.name, personalContact: { name: 'Mr C. Okafor', email: 'c.okafor@surgeons.example', phone: '021 555 0434' }, officeContacts: [practiceInbox(PRACTICE.avonside)], hpiId: '43OKAC', medicalRegistrationNumber: '73318' },
  { id: SURG.lim, name: 'Ms G. Lim', specialtyIds: [SPC.plasticSurgery], practiceName: PRACTICE.fendalton.name, personalContact: { name: 'Ms G. Lim', email: 'g.lim@surgeons.example', phone: '021 555 0445' }, officeContacts: [practiceInbox(PRACTICE.fendalton)], hpiId: '44LIMG', medicalRegistrationNumber: '74071' },
  { id: SURG.doyle, name: 'Mr P. Doyle', specialtyIds: [SPC.generalSurgery], practiceName: PRACTICE.avonside.name, personalContact: { name: 'Mr P. Doyle', email: 'p.doyle@surgeons.example', phone: '021 555 0456' }, officeContacts: [practiceInbox(PRACTICE.avonside)], hpiId: '45DOYP', medicalRegistrationNumber: '75264' },
  { id: SURG.tan, name: 'Mr S. Tan', specialtyIds: [SPC.urology], practiceName: PRACTICE.papanui.name, personalContact: { name: 'Mr S. Tan', email: 's.tan@surgeons.example', phone: '021 555 0467' }, officeContacts: [practiceInbox(PRACTICE.papanui)], hpiId: '46TANS', medicalRegistrationNumber: '76630' },
  { id: SURG.reid, name: 'Ms A. Reid', specialtyIds: [SPC.ophthalmology], practiceName: PRACTICE.merivale.name, personalContact: { name: 'Ms A. Reid', email: 'a.reid@surgeons.example', phone: '021 555 0478' }, officeContacts: [practiceInbox(PRACTICE.merivale)], hpiId: '47REIA', medicalRegistrationNumber: '77149' },
  { id: SURG.nand, name: 'Mr V. Nand', specialtyIds: [SPC.ent], practiceName: PRACTICE.fendalton.name, personalContact: { name: 'Mr V. Nand', email: 'v.nand@surgeons.example', phone: '021 555 0489' }, officeContacts: [practiceInbox(PRACTICE.fendalton)], hpiId: '48NANV', medicalRegistrationNumber: '78852' },
  { id: SURG.cameron, name: 'Ms H. Cameron', specialtyIds: [SPC.gynaecology], practiceName: PRACTICE.papanui.name, personalContact: { name: 'Ms H. Cameron', email: 'h.cameron@surgeons.example', phone: '021 555 0490' }, officeContacts: [practiceInbox(PRACTICE.papanui)], hpiId: '49CAMH', medicalRegistrationNumber: '79503' },
] as const

/**
 * Surgeon groups (US-13.4.1). Catch-up Phase 18's COS surgeon-group Party
 * links `SG-COS`'s members on its Contracts; a Party has no group link.
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
  /** AA's own rooms: the pre-op clinic's location, never a Contract holder (catch-up Phase 31). */
  aaRooms: 'H-AAROOMS',
} as const

export const HOSPITALS: readonly Hospital[] = [
  { id: HOSP.stg, name: "St George's", locationType: 'hospital', contactEmail: 'bookings@stgeorges.example' },
  { id: HOSP.sx, name: 'Southern Cross', locationType: 'hospital', contactEmail: 'theatre.bookings@southerncross.example' },
  { id: HOSP.forte, name: 'Forte Health', locationType: 'hospital', contactEmail: 'bookings@fortehealth.example' },
  { id: HOSP.ces, name: 'Christchurch Eye Surgery', locationType: 'hospital', contactEmail: 'bookings@chcheyesurgery.example' },
  { id: HOSP.cph, name: 'Christchurch Public', locationType: 'hospital', contactEmail: 'theatre.bookings@chchpublic.example' },
  // Catch-up Phase 31 (US-01.3.1): the pre-op clinic's location record. A
  // location, not a hospital: never a Contract holder, a feed or a sync target.
  { id: HOSP.aaRooms, name: 'AA rooms', locationType: 'aaRooms', contactEmail: 'rooms@aa.example' },
] as const

export const INS = {
  nib: 'I-NIB',
  aia: 'I-AIA',
  schs: 'I-SCHS',
} as const

/**
 * INTERIM identities only (catch-up Phase 18, RV-39): every insurer is a Party
 * (`seed/parties.ts`). These bare records remain as the ids an insurer
 * Party's `billingIdentity` points at, so no counterparty moves. There is no direct-claims flag. Southern Cross Health
 * Society's id is new with its Party, so the insurer selects can name it.
 */
export const INSURERS: readonly Insurer[] = [
  { id: INS.nib, name: 'nib' },
  { id: INS.aia, name: 'AIA Health' },
  { id: INS.schs, name: 'Southern Cross Health Society' },
] as const

export const ORG = {
  cos: 'O-COS',
} as const

/** INTERIM identity (catch-up Phase 18): the counterparty behind the COS surgeon-group Party. */
export const ORGANISATIONS: readonly ContractHolderOrganisation[] = [
  {
    id: ORG.cos,
    name: 'Canterbury Orthopaedic Surgeons',
    description: 'Surgical group holding an externally held ACC contract (the RFP group holder case).',
  },
] as const

// ---------------------------------------------------------------------------
// Availability statuses (catch-up Phase 29; US-01.2.1, US-01.2.2, OQ-64): the
// owner's starting set, keyed by the IDs Phase 28 stores on Slots, with the
// Design Language colours. The final values are to be agreed with AA's users;
// an admin adds, renames, recolours or retires them in Master data. The List
// kinds (private, pre-op) are not here: they are a List attribute.
// ---------------------------------------------------------------------------

export const SEED_SLOT_STATUSES: readonly SlotStatus[] = [
  {
    key: 'free',
    label: 'Free',
    longLabel: 'Free',
    description: 'Free by default and open for a List or cover.',
    colour: 'free',
    treatment: 'dashed',
    bookable: true,
    anaesthetistCanSet: true,
    isDefault: true,
    order: 1,
  },
  {
    key: 'holiday',
    label: 'Holiday',
    longLabel: 'On holiday',
    description: 'On holiday. Clearly not bookable, but not an error.',
    colour: 'holiday',
    treatment: 'solid',
    bookable: false,
    anaesthetistCanSet: true,
    order: 2,
  },
  {
    key: 'unavailable',
    label: 'Unavailable',
    longLabel: 'Unavailable',
    description: 'Not available for Lists. Add other kinds of unavailable here if they help, with the same effect.',
    colour: 'unavailable',
    treatment: 'hatched',
    bookable: false,
    anaesthetistCanSet: true,
    order: 3,
  },
  // Catch-up Phase 32d (D86, OQ-139 answered): Public works like Unavailable, a
  // status with an optional note ("CPH"), never a kind of List. Its key is not
  // `public`, so no status key can equal a List kind.
  {
    key: 'publicHospital',
    label: 'Public',
    longLabel: 'Public hospital',
    description: 'Working at a public hospital. Not open for bookings or cover.',
    colour: 'public',
    treatment: 'solid',
    bookable: false,
    anaesthetistCanSet: true,
    order: 4,
  },
]

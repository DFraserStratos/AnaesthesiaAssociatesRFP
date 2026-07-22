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
 * HPI identifiers are fictional.
 */
export const ANAESTHETISTS: readonly Anaesthetist[] = [
  { registrationNumber: ANAE.souter, name: 'Dr Melanie Souter', phone: '021 555 0134', email: 'm.souter@aa-associates.example', unitValue: 26.5, gstPeriod: 'monthly', hpiId: '10SOUM', active: true },
  { registrationNumber: ANAE.rutherford, name: 'Dr James Rutherford', phone: '021 555 0217', email: 'j.rutherford@aa-associates.example', unitValue: 32, gstPeriod: 'monthly', hpiId: '11RUTJ', active: true },
  { registrationNumber: ANAE.sharma, name: 'Dr Priya Sharma', phone: '021 555 0342', email: 'p.sharma@aa-associates.example', unitValue: 30, gstPeriod: 'monthly', hpiId: '12SHAP', active: true },
  { registrationNumber: ANAE.ngata, name: 'Dr Tom Ngata', phone: '021 555 0458', email: 't.ngata@aa-associates.example', unitValue: 28, gstPeriod: 'monthly', hpiId: '13NGAT', active: true },
  { registrationNumber: ANAE.beaumont, name: 'Dr Sarah Beaumont', phone: '021 555 0563', email: 's.beaumont@aa-associates.example', unitValue: 31, gstPeriod: 'monthly', hpiId: '14BEAS', active: true },
  { registrationNumber: ANAE.chen, name: 'Dr Alistair Chen', phone: '021 555 0629', email: 'a.chen@aa-associates.example', unitValue: 29.5, gstPeriod: 'monthly', hpiId: '15CHEA', active: true },
  { registrationNumber: ANAE.ropata, name: 'Dr Hannah Ropata', phone: '021 555 0771', email: 'h.ropata@aa-associates.example', unitValue: 27.5, gstPeriod: 'monthly', hpiId: '16ROPH', active: true },
  { registrationNumber: ANAE.delaney, name: 'Dr Mark Delaney', phone: '021 555 0808', email: 'm.delaney@aa-associates.example', unitValue: 33, gstPeriod: 'monthly', hpiId: '17DELM', active: true },
  { registrationNumber: ANAE.fitzgerald, name: 'Dr Emma Fitzgerald', phone: '021 555 0915', email: 'e.fitzgerald@aa-associates.example', unitValue: 30.5, gstPeriod: 'monthly', hpiId: '18FITE', active: true },
  { registrationNumber: ANAE.hughes, name: 'Dr Rawiri Hughes', phone: '021 555 1046', email: 'r.hughes@aa-associates.example', unitValue: 26, gstPeriod: 'monthly', hpiId: '19HUGR', active: true },
  { registrationNumber: ANAE.morrison, name: 'Dr Kate Morrison', phone: '021 555 1187', email: 'k.morrison@aa-associates.example', unitValue: 35, gstPeriod: 'monthly', hpiId: '20MORK', active: true },
  { registrationNumber: ANAE.whitaker, name: 'Dr Ben Whitaker', phone: '021 555 1253', email: 'b.whitaker@aa-associates.example', unitValue: 28.5, gstPeriod: 'sixMonthly', hpiId: '21WHIB', active: true },
  { registrationNumber: ANAE.ngatai, name: 'Dr Aroha Ngatai', phone: '021 555 1394', email: 'a.ngatai@aa-associates.example', unitValue: 27, gstPeriod: 'monthly', hpiId: '22NGAA', active: true },
  { registrationNumber: ANAE.strand, name: 'Dr Oliver Strand', phone: '021 555 1420', email: 'o.strand@aa-associates.example', unitValue: 42, gstPeriod: 'monthly', hpiId: '23STRO', active: true },
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

export const SURGEONS: readonly Surgeon[] = [
  { id: SURG.hale, name: 'Mr T. Hale', specialty: 'Orthopaedics' },
  { id: SURG.patel, name: 'Ms K. Patel', specialty: 'General surgery' },
  { id: SURG.whitford, name: 'Mr J. Whitford', specialty: 'Ophthalmology' },
  { id: SURG.okafor, name: 'Mr C. Okafor', specialty: 'General surgery' },
  { id: SURG.lim, name: 'Ms G. Lim', specialty: 'Plastics' },
  { id: SURG.doyle, name: 'Mr P. Doyle', specialty: 'General surgery' },
  { id: SURG.tan, name: 'Mr S. Tan', specialty: 'Urology' },
  { id: SURG.reid, name: 'Ms A. Reid', specialty: 'Ophthalmology' },
  { id: SURG.nand, name: 'Mr V. Nand', specialty: 'ENT' },
  { id: SURG.cameron, name: 'Ms H. Cameron', specialty: 'Gynaecology' },
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
  { id: HOSP.stg, name: "St George's" },
  { id: HOSP.sx, name: 'Southern Cross' },
  { id: HOSP.forte, name: 'Forte Health' },
  { id: HOSP.ces, name: 'Christchurch Eye Surgery' },
  { id: HOSP.cph, name: 'Christchurch Public' },
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

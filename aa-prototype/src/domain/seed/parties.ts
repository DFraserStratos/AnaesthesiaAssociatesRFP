/**
 * Seed Parties (catch-up Phase 18; US-04.1.5, DM-48; AR-58 2.1). Every seeded
 * holder, insurer and funder becomes a Party: the old holders keep billing the
 * same counterparty through `billingIdentity` (kept by catch-up Phase 21 so no
 * issued invoice or Xero contact moves), and a hospital Party bills its hospital.
 *
 * Billing details are filled where a Contract bills the Party (A43); the
 * funders, AIA, Southern Cross Health Society, Merivale and Dr Souter hold
 * nothing yet (18a's tags and 19a's price lists reach them). Fictional
 * `.example` addresses throughout.
 */

import type { Party } from '../types'
import { HOSP, INS, ORG, SURG } from './cast'
import { BP } from './patients'

export const PARTY = {
  aa: 'PY-AA',
  stg: 'PY-STG',
  sx: 'PY-SX',
  forte: 'PY-FORTE',
  ces: 'PY-CES',
  cph: 'PY-CPH',
  nib: 'PY-NIB',
  schs: 'PY-SCHS',
  aia: 'PY-AIA',
  acc: 'PY-ACC',
  healthNz: 'PY-HNZ',
  nzdf: 'PY-NZDF',
  veterans: 'PY-VA',
  cos: 'PY-COS',
  aria: 'PY-ARIA',
  unisports: 'PY-UNI',
  merivale: 'PY-MER',
  doyle: 'PY-DOYLE',
  souter: 'PY-SOUTER',
} as const

export const PARTIES: readonly Party[] = [
  { id: PARTY.aa, kind: 'aa', name: 'Anaesthesia Associates', codePrefix: 'AA', billingName: 'Anaesthesia Associates Limited' },

  // Hospitals: each points at its hospital, billed by its Contracts, so billing
  // details and email delivery from the hospital record.
  { id: PARTY.stg, kind: 'hospital', name: "St George's", codePrefix: 'STG', hospitalId: HOSP.stg, billingName: "St George's Hospital", email: 'accounts@stgeorges.example', deliveryMethod: 'email' },
  { id: PARTY.sx, kind: 'hospital', name: 'Southern Cross', codePrefix: 'SX', hospitalId: HOSP.sx, billingName: 'Southern Cross Hospital Christchurch', email: 'accounts@southerncross.example', deliveryMethod: 'email' },
  { id: PARTY.forte, kind: 'hospital', name: 'Forte Health', codePrefix: 'FORTE', hospitalId: HOSP.forte, billingName: 'Forte Health Limited', email: 'accounts@fortehealth.example', deliveryMethod: 'email' },
  { id: PARTY.ces, kind: 'hospital', name: 'Christchurch Eye Surgery', codePrefix: 'CES', hospitalId: HOSP.ces, billingName: 'Christchurch Eye Surgery Limited', email: 'accounts@chcheyesurgery.example', deliveryMethod: 'email' },
  { id: PARTY.cph, kind: 'hospital', name: 'Christchurch Public', codePrefix: 'CPH', hospitalId: HOSP.cph, billingName: 'Health New Zealand, Christchurch Hospital', email: 'accounts.payable@chchpublic.example', deliveryMethod: 'email' },

  // Insurers. nib is billed by its Contract and delivers by email (D55's
  // default: no portal value). AIA and Southern Cross Health Society hold nothing.
  { id: PARTY.nib, kind: 'insurer', name: 'nib', codePrefix: 'NIB', billingName: 'nib nz limited', email: 'claims@nib.example', deliveryMethod: 'email', billingIdentity: { kind: 'insurer', id: INS.nib } },
  { id: PARTY.schs, kind: 'insurer', name: 'Southern Cross Health Society', codePrefix: 'SCHS', billingIdentity: { kind: 'insurer', id: INS.schs } },
  { id: PARTY.aia, kind: 'insurer', name: 'AIA Health', codePrefix: 'AIA', billingIdentity: { kind: 'insurer', id: INS.aia } },

  // Funders (A42: a kind apart from insurer), holding nothing; 18a's funding tags point at them.
  { id: PARTY.acc, kind: 'funder', name: 'ACC', codePrefix: 'ACC' },
  { id: PARTY.healthNz, kind: 'funder', name: 'Health NZ', codePrefix: 'HNZ' },
  { id: PARTY.nzdf, kind: 'funder', name: 'NZDF', codePrefix: 'NZDF' },
  { id: PARTY.veterans, kind: 'funder', name: 'Veterans Affairs', codePrefix: 'VA' },

  // Surgeon groups.
  { id: PARTY.cos, kind: 'surgeonGroup', name: 'Canterbury Orthopaedic Surgeons', codePrefix: 'COS', billingName: 'Canterbury Orthopaedic Surgeons Limited', email: 'accounts@canterburyortho.example', deliveryMethod: 'email', billingIdentity: { kind: 'organisation', id: ORG.cos } },
  { id: PARTY.aria, kind: 'surgeonGroup', name: 'Aria Skin and Laser Clinic', codePrefix: 'ARIA', billingName: 'Aria Skin and Laser Clinic', email: 'accounts@aria-clinic.example', deliveryMethod: 'email', billingIdentity: { kind: 'billableParty', id: BP.ariaClinic } },
  { id: PARTY.unisports, kind: 'surgeonGroup', name: 'Unisports Ortho', codePrefix: 'UNI', billingName: 'Unisports Orthopaedics Limited', postalAddress: 'PO Box 29 101, Riccarton, Christchurch 8440', deliveryMethod: 'post' },
  { id: PARTY.merivale, kind: 'surgeonGroup', name: 'Merivale Plastic Surgery', codePrefix: 'MER' },

  // A surgeon, and an anaesthetist (19a seeds her price list).
  { id: PARTY.doyle, kind: 'surgeon', name: 'Mr P. Doyle', codePrefix: 'DOYLE', billingIdentity: { kind: 'surgeon', id: SURG.doyle } },
  { id: PARTY.souter, kind: 'anaesthetist', name: 'Dr Melanie Souter', codePrefix: 'SOUTER' },
] as const


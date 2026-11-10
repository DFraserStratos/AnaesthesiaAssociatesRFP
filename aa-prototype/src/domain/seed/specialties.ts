/**
 * Seed specialties (catch-up Phase 18a; US-13.4.4, US-13.6.6; AR-58 2.5 and
 * 8.2). Fixed ids, no clock, no randomness. Imports nothing from the seed, so
 * `cast.ts` can name these ids.
 *
 * Specialties: the catalogue's nine (D3's six plus Urology, Gastroenterology
 * and Cardiothoracic surgery, A11), plus Neurosurgery, Vascular surgery and
 * Oral and maxillofacial surgery, added because the specialist directory holds
 * surgeons in them with no broad home in the nine (our reading; AA's
 * spreadsheet will replace the list).
 *
 * The directory's free text maps onto the list with subspecialties folded in
 * (`SPECIALTY_FOR_DIRECTORY_TEXT`): Colorectal, Breast, Upper GI and HPB under
 * General surgery, Fertility under Gynaecology, Plastics as Plastic surgery.
 */

import type { Specialty } from '../types'

export const SPC = {
  ophthalmology: 'SPC-OPHTH',
  generalSurgery: 'SPC-GENSURG',
  plasticSurgery: 'SPC-PLASTIC',
  ent: 'SPC-ENT',
  gynaecology: 'SPC-GYNAE',
  orthopaedics: 'SPC-ORTHO',
  urology: 'SPC-UROLOGY',
  gastroenterology: 'SPC-GASTRO',
  cardiothoracic: 'SPC-CARDIO',
  neurosurgery: 'SPC-NEURO',
  vascular: 'SPC-VASCULAR',
  oralMaxillofacial: 'SPC-OMFS',
} as const

export const SPECIALTIES: readonly Specialty[] = [
  { id: SPC.ophthalmology, name: 'Ophthalmology' },
  { id: SPC.generalSurgery, name: 'General surgery' },
  { id: SPC.plasticSurgery, name: 'Plastic surgery' },
  { id: SPC.ent, name: 'ENT' },
  { id: SPC.gynaecology, name: 'Gynaecology' },
  { id: SPC.orthopaedics, name: 'Orthopaedics' },
  { id: SPC.urology, name: 'Urology' },
  { id: SPC.gastroenterology, name: 'Gastroenterology' },
  { id: SPC.cardiothoracic, name: 'Cardiothoracic surgery' },
  { id: SPC.neurosurgery, name: 'Neurosurgery' },
  { id: SPC.vascular, name: 'Vascular surgery' },
  { id: SPC.oralMaxillofacial, name: 'Oral and maxillofacial surgery' },
]

/** The specialist list's free text (3 November) onto AA's broad list, subspecialties folded in. */
export const SPECIALTY_FOR_DIRECTORY_TEXT: Readonly<Record<string, string>> = {
  Orthopaedics: SPC.orthopaedics,
  Ophthalmology: SPC.ophthalmology,
  ENT: SPC.ent,
  Urology: SPC.urology,
  Gynaecology: SPC.gynaecology,
  Fertility: SPC.gynaecology,
  'General surgery': SPC.generalSurgery,
  Colorectal: SPC.generalSurgery,
  Breast: SPC.generalSurgery,
  'Upper GI': SPC.generalSurgery,
  HPB: SPC.generalSurgery,
  Plastics: SPC.plasticSurgery,
  'Oral and maxillofacial': SPC.oralMaxillofacial,
  Vascular: SPC.vascular,
  Neurosurgery: SPC.neurosurgery,
}

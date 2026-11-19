/**
 * The sample hospital files the matching screen imports (catch-up Phase 33;
 * US-02.1.1, US-02.1.2). Pure fixtures, in the style of the rooms' PDF list
 * samples (`pdfLists.ts`).
 *
 * OQ-13 is open: how each hospital provides its bookings, and which fields,
 * is not yet known, so these are labelled sample files (a "Sample file" badge
 * on the picker and on each batch). A real list is one day's, sent the evening
 * before; each sample spans a few days so every case shows.
 *
 * Every patient is synthetic. The procedure wording comes from AR-35's
 * "Illustrative source wording" table (the note
 * `requirements/notes/2026-10-08-procedure-picker-and-source-text.md`): AI-made
 * wording, not from AA, as received and never trimmed. It agrees with what
 * Phase 20a seeded on the same Bookings and canned messages (MSG-STG-1001's
 * `lap appy ?conv to open`, MSG-STG-1012's row 27 line for Diane Foster).
 *
 * The rows' seeded targets are pinned in `hospitalDownloads.test.ts`.
 */

import type { ImportChannel, IncomingBookingFields } from '../types'
import { FEED } from '../integrations/feeds'
import { APPT } from '../integrations/messages'
import { HOSP } from '../seed/cast'

export interface HospitalDownloadSample {
  id: string
  channel: ImportChannel
  hospitalId: string
  label: string
  description: string
  rows: readonly IncomingBookingFields[]
}

const HALE = { name: 'Mr T. Hale', hpiId: '40HALT' } as const
const PATEL = { name: 'Ms K. Patel', hpiId: '41PATK' } as const
const LIM = { name: 'Ms G. Lim', hpiId: '44LIMG' } as const

/** The NHI the manual test types into Southern Cross R4 (the row with none). */
export const SX_NO_NHI_TYPED = 'ZQA1008'
/** Forte R2's mistyped NHI and its correction. */
export const FORTE_MISTYPED_NHI = 'ZQA2111'
export const FORTE_CORRECTED_NHI = 'ZQA2110'

/** The hospital's fuller wording for Sarah Mitchell's appendicectomy: AR-35 row 14's meaning, spelt as a hospital would. */
export const SARAH_UPDATE_WORDING = 'Laparoscopic appendicectomy, may convert to open'
/** AR-35 row 27: the hospital's fuller line for Diane Foster (the rooms sent row 26, `WLE MM`). */
export const FOSTER_HOSPITAL_WORDING = 'WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC'

export const SAMPLE_STG: HospitalDownloadSample = {
  id: 'SAMPLE_STG',
  channel: 'download',
  hospitalId: HOSP.stg,
  label: "St George's theatre list, Tue 28 Jul to Tue 4 Aug",
  description: 'A new booking, one with no change, an update with fuller wording, and a day move sent as a cancellation plus a new booking. Spans a week so every case shows.',
  rows: [
    // R1: Sarah Mitchell (seeded, reused by NHI), new on Dr Souter's Tue 28 Jul AM List. AR-35 row 14.
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-07-28',
      session: 'AM',
      externalRef: APPT.s12,
      surgeon: HALE,
      scheduledTime: '08:30',
      patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-04-12' },
      procedure: { text: 'lap appy ?conv to open', code: 'A3' },
      hospitalStatus: 'booked',
    },
    // R2: the 07:45 Booking already on that List, sent again unchanged (no wording supplied): No change.
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-07-28',
      session: 'AM',
      surgeon: HALE,
      scheduledTime: '07:45',
      patient: { name: 'Dylan Kereama', nhi: 'GBB9305', dobISO: '1992-04-16' },
      hospitalStatus: 'booked',
    },
    // R3: Diane Foster (Tue 4 Aug AM, the rooms' `WLE MM`): a new time, a booking-office note and the hospital's fuller wording (AR-35 row 27).
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-08-04',
      session: 'AM',
      externalRef: APPT.s14,
      surgeon: HALE,
      scheduledTime: '12:15',
      patient: { name: 'Diane Foster', nhi: 'ZAK8873', dobISO: '1958-09-19' },
      procedure: { text: FOSTER_HOSPITAL_WORDING, code: 'LL4' },
      note: 'Bumped 15 min at surgeon request',
      hospitalStatus: 'booked',
    },
    // R4 and R5: a day move as the hospital sends it (D62). R4 cancels Marcus Webb on Mon 3 Aug PM ...
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-08-03',
      session: 'PM',
      externalRef: APPT.s13Move,
      surgeon: LIM,
      scheduledTime: '13:30',
      patient: { name: 'Marcus Webb', nhi: 'ZAH6659', dobISO: '1977-10-11' },
      procedure: { text: 'Wrist ORIF, distal radius', code: 'UL2' },
      hospitalStatus: 'cancelled',
      cancelReason: "Moved to another day by St George's booking office",
    },
    // ... and R5 books him on Tue 4 Aug AM on Mr Hale's List. Nothing links the two rows.
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-08-04',
      session: 'AM',
      externalRef: '1661312',
      surgeon: HALE,
      scheduledTime: '09:00',
      patient: { name: 'Marcus Webb', nhi: 'ZAH6659', dobISO: '1977-10-11' },
      procedure: { text: 'Wrist ORIF, distal radius', code: 'UL2' },
      hospitalStatus: 'booked',
    },
  ],
}

export const SAMPLE_STG_UPDATE: HospitalDownloadSample = {
  id: 'SAMPLE_STG_UPDATE',
  channel: 'download',
  hospitalId: HOSP.stg,
  label: "St George's theatre list, a day later",
  description: "An update for Sarah Mitchell on the same List: a new time, a note and the hospital's fuller wording, waiting for the office to approve it.",
  rows: [
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-07-28',
      session: 'AM',
      externalRef: APPT.s12,
      surgeon: HALE,
      scheduledTime: '09:00',
      patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-04-12' },
      procedure: { text: SARAH_UPDATE_WORDING, code: 'A3' },
      note: 'Moved to 09:00 at theatre request',
      hospitalStatus: 'booked',
    },
  ],
}

export const SAMPLE_SX: HospitalDownloadSample = {
  id: 'SAMPLE_SX',
  channel: 'download',
  hospitalId: HOSP.sx,
  label: 'Southern Cross theatre list, Tue 28 Jul to Thu 6 Aug',
  description: 'A new booking, a patient correction with an insurer and approval number, a change for an authorised List, a row with no NHI and a row for a session with no List.',
  rows: [
    // R1: Priya Nair (seeded, reused), new on Dr Souter's Tue 28 Jul PM List. AR-35 row 7.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-07-28',
      session: 'PM',
      externalRef: '1662101',
      surgeon: PATEL,
      scheduledTime: '14:30',
      patient: { name: 'Priya Nair', nhi: 'MYY54SL', dobISO: '1969-11-08' },
      procedure: { text: 'ACL recon R', code: 'LL3' },
      hospitalStatus: 'booked',
    },
    // R2: Olive Ratima (Tue 28 Jul PM, No contract): a corrected name and date of birth, nib with an approval number, a note.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-07-28',
      session: 'PM',
      surgeon: PATEL,
      scheduledTime: '14:00',
      patient: { name: 'Olivia Ratima', nhi: 'YKH3215', dobISO: '1955-02-27' },
      insurer: { text: 'nib', insurerPartyId: 'PY-NIB', approvalNumber: '4471203' },
      note: 'Pre-admission clinic booked',
      hospitalStatus: 'booked',
    },
    // R3: a late time correction for Hemi Walker on the authorised Wed 18 Mar List: locked (US-02.5.4).
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-03-18',
      session: 'AM',
      surgeon: PATEL,
      scheduledTime: '08:15',
      patient: { name: 'Hemi Walker', nhi: 'WQS3635', dobISO: '1975-09-03' },
      hospitalStatus: 'booked',
    },
    // R4: no NHI: waits on the unmatched queue (D11). AR-35 row 20.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-07-28',
      session: 'PM',
      surgeon: PATEL,
      scheduledTime: '15:30',
      patient: { name: 'Tama Henare', dobISO: '2014-05-03' },
      procedure: { text: 'T&A', code: 'H2' },
      hospitalStatus: 'booked',
    },
    // R5: a session with no List or Draft List (Thu 6 Aug PM). AR-35 row 12.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-08-06',
      session: 'PM',
      externalRef: '1662140',
      surgeon: PATEL,
      scheduledTime: '13:30',
      patient: { name: 'Grace Whitu', nhi: 'ZQA1377', dobISO: '1972-09-30' },
      procedure: { text: 'lap chole', code: 'A3' },
      hospitalStatus: 'booked',
    },
  ],
}

export const SAMPLE_FORTE_SHEET: HospitalDownloadSample = {
  id: 'SAMPLE_FORTE_SHEET',
  channel: 'manualSheet',
  hospitalId: HOSP.forte,
  label: 'Forte Health daily sheet, keyed by the office',
  description: 'A sheet the office keys by hand: a new booking, one with a mistyped NHI to correct, and one for a session with no List.',
  rows: [
    // R1: new onto Mr Okafor's Tue 28 Jul AM List. AR-35 row 16.
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-07-28',
      session: 'AM',
      surgeon: { name: 'Mr Okafor' },
      scheduledTime: '08:00',
      patient: { name: 'Peter Langley', nhi: 'ZQA1741', dobISO: '1949-03-11' },
      procedure: { text: 'phaco + IOL R' },
      hospitalStatus: 'booked',
    },
    // R2: a mistyped NHI check digit (flagged, corrected inline). AR-35 row 9.
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-07-28',
      session: 'PM',
      surgeon: { name: 'Mr Nand' },
      scheduledTime: '13:30',
      patient: { name: 'Rosa Mendes', nhi: FORTE_MISTYPED_NHI, dobISO: '1983-12-02' },
      procedure: { text: 'carpal tunnel decomp L' },
      hospitalStatus: 'booked',
    },
    // R3: Fri 31 Jul PM, no Forte List: create a Draft List holding the Booking. AR-35 row 24.
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-07-31',
      session: 'PM',
      surgeon: { name: 'Mr Okafor' },
      scheduledTime: '14:00',
      patient: { name: 'Hugh Barnett', nhi: 'ZQA2489', dobISO: '1956-07-21' },
      procedure: { text: 'TURBT' },
      hospitalStatus: 'booked',
    },
  ],
}

/** The four samples, in the import dialog's order. */
export const HOSPITAL_DOWNLOAD_SAMPLES: readonly HospitalDownloadSample[] = [SAMPLE_STG, SAMPLE_STG_UPDATE, SAMPLE_SX, SAMPLE_FORTE_SHEET]

export function hospitalDownloadSample(id: string): HospitalDownloadSample | undefined {
  return HOSPITAL_DOWNLOAD_SAMPLES.find((s) => s.id === id)
}

/**
 * The hospital's source key for a correlation ref: its seeded feed id where
 * one exists, else `MANUAL-<hospitalId>`, so a row and a feed message about the
 * same appointment carry the same `correlationRef` shape. (The field keeps its
 * name, `sourceFeedId`; it is now the hospital's source key.)
 */
export function hospitalSourceKey(hospitalId: string): string {
  if (hospitalId === HOSP.stg) return FEED.stg
  if (hospitalId === HOSP.sx) return FEED.sx
  if (hospitalId === HOSP.cph) return FEED.cph
  return `MANUAL-${hospitalId}`
}

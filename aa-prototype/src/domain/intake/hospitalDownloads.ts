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

import type { ImportChannel, IncomingBookingFields, PdfReadField, PdfScan, PdfTemplateId, PdfTemplateVariant, Session } from '../types'
import { FEED } from '../integrations/feeds'
import { APPT } from '../integrations/messages'
import { ANAE, HOSP, SURG } from '../seed/cast'
import { buildUnreadableFacsimile, type PdfListSampleRow } from './pdfLists'
import { UNREADABLE_REASONS, type PdfHeaderField } from './pdfRead'
import { longDay } from '../dateText'

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
  label: "St George's theatre list, Tue 1 Dec to Tue 8 Dec",
  description: 'A new booking, one with no change, an update with fuller wording, and a day move sent as a cancellation plus a new booking. Spans a week so every case shows.',
  rows: [
    // R1: Sarah Mitchell (seeded, reused by NHI), new on Dr Souter's Tue 28 Jul AM List. AR-35 row 14.
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-12-01',
      session: 'AM',
      externalRef: APPT.s12,
      surgeon: HALE,
      scheduledTime: '08:30',
      patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-08-16' },
      procedure: { text: 'lap appy ?conv to open', code: 'A3' },
      hospitalStatus: 'booked',
    },
    // R2: the 07:45 Booking already on that List, sent again unchanged (no wording supplied): No change.
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-12-01',
      session: 'AM',
      surgeon: HALE,
      scheduledTime: '07:45',
      patient: { name: 'Dylan Kereama', nhi: 'GBB9305', dobISO: '1992-08-20' },
      hospitalStatus: 'booked',
    },
    // R3: Diane Foster (Tue 4 Aug AM, the rooms' `WLE MM`): a new time, a booking-office note and the hospital's fuller wording (AR-35 row 27).
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-12-08',
      session: 'AM',
      externalRef: APPT.s14,
      surgeon: HALE,
      scheduledTime: '12:15',
      patient: { name: 'Diane Foster', nhi: 'ZAK8873', dobISO: '1959-01-23' },
      procedure: { text: FOSTER_HOSPITAL_WORDING, code: 'LL4' },
      note: 'Bumped 15 min at surgeon request',
      hospitalStatus: 'booked',
    },
    // R4 and R5: a day move as the hospital sends it (D62). R4 cancels Marcus Webb on Mon 3 Aug PM ...
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-12-07',
      session: 'PM',
      externalRef: APPT.s13Move,
      surgeon: LIM,
      scheduledTime: '13:30',
      patient: { name: 'Marcus Webb', nhi: 'ZAH6659', dobISO: '1978-02-14' },
      procedure: { text: 'Wrist ORIF, distal radius', code: 'UL2' },
      hospitalStatus: 'cancelled',
      cancelReason: "Moved to another day by St George's booking office",
    },
    // ... and R5 books him on Tue 4 Aug AM on Mr Hale's List. Nothing links the two rows.
    {
      hospitalId: HOSP.stg,
      dateISO: '2026-12-08',
      session: 'AM',
      externalRef: '1661312',
      surgeon: HALE,
      scheduledTime: '09:00',
      patient: { name: 'Marcus Webb', nhi: 'ZAH6659', dobISO: '1978-02-14' },
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
      dateISO: '2026-12-01',
      session: 'AM',
      externalRef: APPT.s12,
      surgeon: HALE,
      scheduledTime: '09:00',
      patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-08-16' },
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
  label: 'Southern Cross theatre list, Tue 1 Dec to Thu 10 Dec',
  description: 'A new booking, a patient correction with an insurer and approval number, a change for an authorised List, a row with no NHI and a row for a session with no List.',
  rows: [
    // R1: Priya Nair (seeded, reused), new on Dr Souter's Tue 28 Jul PM List. AR-35 row 7.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-12-01',
      session: 'PM',
      externalRef: '1662101',
      surgeon: PATEL,
      scheduledTime: '14:30',
      patient: { name: 'Priya Nair', nhi: 'MYY54SL', dobISO: '1970-03-14' },
      procedure: { text: 'ACL recon R', code: 'LL3' },
      hospitalStatus: 'booked',
    },
    // R2: Olive Ratima (Tue 28 Jul PM, No contract): a corrected name and date of birth, nib with an approval number, a note.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-12-01',
      session: 'PM',
      surgeon: PATEL,
      scheduledTime: '14:00',
      patient: { name: 'Olivia Ratima', nhi: 'YKH3215', dobISO: '1955-07-03' },
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
      patient: { name: 'Hemi Walker', nhi: 'WQS3635', dobISO: '1976-01-07' },
      hospitalStatus: 'booked',
    },
    // R4: no NHI: waits on the unmatched queue (D11). AR-35 row 20.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-12-01',
      session: 'PM',
      surgeon: PATEL,
      scheduledTime: '15:30',
      patient: { name: 'Tama Henare', dobISO: '2014-09-06' },
      procedure: { text: 'T&A', code: 'H2' },
      hospitalStatus: 'booked',
    },
    // R5: a session with no List or Draft List (Thu 6 Aug PM). AR-35 row 12.
    {
      hospitalId: HOSP.sx,
      dateISO: '2026-12-10',
      session: 'PM',
      externalRef: '1662140',
      surgeon: PATEL,
      scheduledTime: '13:30',
      patient: { name: 'Grace Whitu', nhi: 'ZQA1377', dobISO: '1973-02-03' },
      procedure: { text: 'lap chole', code: 'A3' },
      hospitalStatus: 'booked',
    },
  ],
}

/**
 * The Forte Health daily sheet as the office keyed it (channel `manualSheet`, no catalogue source). Re-cast as a
 * rooms' mailbox PDF (build plan Phase 68; D125): `FORTE_ROOMS_PDF` below is what Intake receives now, and nothing in
 * the app stages this sheet any more. It stays as fixture data (`matchingFixtures.test.ts`, the privacy masking test),
 * as does the `manualSheet` channel, which the matcher's and the raw row's labels still read.
 */
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
      dateISO: '2026-12-01',
      session: 'AM',
      surgeon: { name: 'Mr Okafor' },
      scheduledTime: '08:00',
      patient: { name: 'Peter Langley', nhi: 'ZQA1741', dobISO: '1949-07-15' },
      procedure: { text: 'phaco + IOL R' },
      hospitalStatus: 'booked',
    },
    // R2: a mistyped NHI check digit (flagged, corrected inline). AR-35 row 9.
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-12-01',
      session: 'PM',
      surgeon: { name: 'Mr Nand' },
      scheduledTime: '13:30',
      patient: { name: 'Rosa Mendes', nhi: FORTE_MISTYPED_NHI, dobISO: '1984-04-06' },
      procedure: { text: 'carpal tunnel decomp L' },
      hospitalStatus: 'booked',
    },
    // R3: Fri 31 Jul PM, no Forte List: create a Draft List holding the Booking. AR-35 row 24.
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-12-04',
      session: 'PM',
      surgeon: { name: 'Mr Okafor' },
      scheduledTime: '14:00',
      patient: { name: 'Hugh Barnett', nhi: 'ZQA2489', dobISO: '1956-11-24' },
      procedure: { text: 'TURBT' },
      hospitalStatus: 'booked',
    },
  ],
}

/** The NHI the office adds for NO_NHI_LIST's new patient (Aroha Ngata): valid, held by no seeded patient. */
export const NO_NHI_NEW_PATIENT_NHI = 'ZQA3019'
/** The NHI the office adds for NO_NHI_LIST's returning patient: Losa Tuilagi's own (PT0007). */
export const NO_NHI_RETURNING_NHI = 'JKL1188'

/**
 * Two rows with no NHI (catch-up Phase 40; US-11.1.5), for the office's
 * waiting view: one close to its date (Thu 23 Jul PM, Mr Okafor's List, so
 * urgent) for a new patient, and one later (Mon 27 Jul 10:30 on Dr Souter's
 * Forte List with Mr Okafor) for Losa Tuilagi as received, so Add NHI
 * JKL1188 matches her record and her Booking raises the mild balance
 * warning. Neither dedupes against SAMPLE_FORTE_SHEET (other days, patients
 * and times).
 */
export const NO_NHI_LIST: HospitalDownloadSample = {
  id: 'NO_NHI_LIST',
  channel: 'manualSheet',
  hospitalId: HOSP.forte,
  label: 'Forte Health sheet with two missing NHIs',
  description: 'Two bookings sent without an NHI: one in two days for a new patient, one next week for a returning patient.',
  rows: [
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-11-26',
      session: 'PM',
      surgeon: { name: 'Mr Okafor' },
      scheduledTime: '14:15',
      patient: { name: 'Aroha Ngata', dobISO: '1980-01-18' },
      procedure: { text: 'lap chole' },
      hospitalStatus: 'booked',
    },
    {
      hospitalId: HOSP.forte,
      dateISO: '2026-11-30',
      session: 'AM',
      surgeon: { name: 'Mr Okafor' },
      scheduledTime: '10:30',
      patient: { name: 'Losa Tuilagi', dobISO: '1992-06-01' },
      procedure: { text: 'carpal tunnel decomp L' },
      hospitalStatus: 'booked',
    },
  ],
}

/** The five samples (the retired import dialog's order), read by the matching fixtures and the privacy tests. */
export const HOSPITAL_DOWNLOAD_SAMPLES: readonly HospitalDownloadSample[] = [SAMPLE_STG, SAMPLE_STG_UPDATE, SAMPLE_SX, SAMPLE_FORTE_SHEET, NO_NHI_LIST]

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

// ---------------------------------------------------------------------------
// Intake's front door (build plan Phase 68; D119, D120, D125): the samples the six demo actions play
// ---------------------------------------------------------------------------

/** One row of a rooms' PDF as printed, with the reader's confidence for a field when it is not the default (D120). */
export interface MailboxPdfSampleRow extends PdfListSampleRow {
  confidence?: Partial<Record<PdfReadField, number>>
  /** Changed since the List was last sent (a re-sent spreadsheet prints it in red). */
  changed?: boolean
}

/**
 * A rooms' PDF as it arrives in the mailbox (D125): the List it prints (surgeon, hospital, day, session, and the
 * anaesthetist when the rooms name one, DM-19), the address the email came from, its rows as printed, and the
 * reader's confidence overrides. A scan is read with lower confidences (`readConfidence`): a scanned value with no
 * override reads unsure, and an override of 0.98 or more keeps it sure. Synthetic patients only.
 */
export interface MailboxPdfSample {
  id: string
  fileName: string
  surgeonId: string
  /** As printed on the letterhead. */
  surgeonName: string
  hospitalId: string
  hospitalName: string
  subject: string
  /** The address the email came from. */
  senderEmail: string
  dateISO: string
  session: Session
  /** The anaesthetist the rooms name, when they name one (resolved to the master on arrival). */
  anaesthetist?: { name: string; hpiId?: string }
  rows: readonly MailboxPdfSampleRow[]
  headerConfidence?: Partial<Record<PdfHeaderField, number>>
  scanned?: boolean
  /** How the scan sits on the glass (a turned page, a skew); a scan when given. */
  scan?: PdfScan
  /** The layout the rooms print in (`pdfTemplates/`), and its second look. */
  template?: PdfTemplateId
  variant?: PdfTemplateVariant
  /** The practice as printed (else the surgeon's own practice from the masters, else read from the address). */
  practice?: string
  /** Patients a re-sent List prints as cancelled (not read). */
  cancelledRows?: readonly MailboxPdfSampleRow[]
  /** What the presenter should notice. */
  note?: string
}

/** The header values the reader reads from a rooms' PDF: surgeon, hospital, date, session and a named anaesthetist. */
export function mailboxPdfHeaderValues(sample: MailboxPdfSample): Partial<Record<PdfHeaderField, string>> {
  return {
    surgeon: sample.surgeonName,
    hospital: sample.hospitalName,
    date: longDay(sample.dateISO),
    session: sample.session,
    ...(sample.anaesthetist !== undefined ? { anaesthetist: sample.anaesthetist.name } : {}),
  }
}

/** Every field a row is read for, at a confidence a scan keeps sure, except the fields named (left to read unsure). */
function sureExcept(...unsure: PdfReadField[]): Partial<Record<PdfReadField, number>> {
  const fields: PdfReadField[] = ['nhi', 'name', 'procedureText', 'scheduledTime', 'dobISO']
  return Object.fromEntries(fields.filter((f) => !unsure.includes(f)).map((f) => [f, 0.99]))
}

const OKAFOR = { name: 'Mr C. Okafor', hpiId: '43OKAC' } as const
const RUTHERFORD = { name: 'Dr James Rutherford', hpiId: '11RUTJ' } as const
/** Avonside Surgical Rooms' own address (Mr Okafor's practice). */
const AVONSIDE_ADDRESS = 'admin@avonsidesurgical.example'

/** Where the Okafor story's List sits (D119): Mr Okafor, St George's, Wed 25 Nov PM, Dr Rutherford named. */
export const OKAFOR_STORY_LIST = {
  surgeonId: SURG.okafor,
  hospitalId: HOSP.stg,
  dateISO: '2026-11-25',
  session: 'PM' as const,
  anaesthetistId: ANAE.rutherford,
} as const

/**
 * The story's patients (synthetic; every NHI valid and held by no seeded patient). Sione Faleolo is sent by the rooms
 * with no NHI; St George's day-before List brings `nhiFromHospital` with the same name and birth date.
 */
export const OKAFOR_STORY_PATIENTS = {
  ngata: { name: 'Wiremu Ngata', nhi: 'ZQE1000', dobISO: '1958-03-14' },
  pike: { name: 'Gordon Pike', nhi: 'ZQE1018', dobISO: '1949-11-02' },
  lindqvist: { name: 'Ingrid Lindqvist', nhi: 'ZQE1026', dobISO: '1971-06-30' },
  faleolo: { name: 'Sione Faleolo', dobISO: '1966-04-09', nhiFromHospital: 'ZQE1042' },
  brooks: { name: 'Helen Brooks', nhi: 'ZQE1034', dobISO: '1983-01-21' },
} as const
const P = OKAFOR_STORY_PATIENTS

/** (1) The rooms email the List: four patients, one with no NHI, naming Dr Rutherford, from the practice's address. */
export const OKAFOR_ROOMS_PDF: MailboxPdfSample = {
  id: 'PDF-OKAFOR-STG-1125',
  fileName: 'Okafor theatre list Wed 25 Nov PM.pdf',
  surgeonId: SURG.okafor,
  surgeonName: OKAFOR.name,
  hospitalId: HOSP.stg,
  hospitalName: "St George's",
  subject: 'Operating list · Wednesday 25 November (PM)',
  senderEmail: AVONSIDE_ADDRESS,
  dateISO: OKAFOR_STORY_LIST.dateISO,
  session: OKAFOR_STORY_LIST.session,
  anaesthetist: RUTHERFORD,
  // The practice's day-surgery letter to St George's.
  template: 'hospitalLetter',
  note: 'Four patients; Sione Faleolo has no NHI. Names Dr Rutherford.',
  rows: [
    { id: 'R1', nhi: P.ngata.nhi, name: P.ngata.name, dobISO: P.ngata.dobISO, scheduledTime: '13:00', procedureText: 'RTK' },
    { id: 'R2', nhi: P.pike.nhi, name: P.pike.name, dobISO: P.pike.dobISO, scheduledTime: '14:00', procedureText: 'L inguinal hernia mesh' },
    { id: 'R3', nhi: P.lindqvist.nhi, name: P.lindqvist.name, dobISO: P.lindqvist.dobISO, scheduledTime: '15:00', procedureText: 'lap chole' },
    { id: 'R4', name: P.faleolo.name, dobISO: P.faleolo.dobISO, scheduledTime: '16:00', procedureText: 'carpal tunnel decomp R' },
  ],
}

/** (2) The rooms re-send it: Lindqvist moved to 15:30, Helen Brooks added, Gordon Pike missing. */
export const OKAFOR_ROOMS_RESEND: MailboxPdfSample = {
  ...OKAFOR_ROOMS_PDF,
  id: 'PDF-OKAFOR-STG-1125-R2',
  fileName: 'Okafor theatre list Wed 25 Nov PM (updated).pdf',
  subject: 'Operating list · Wednesday 25 November (PM) · updated',
  note: 'Ingrid Lindqvist moved to 15:30, Helen Brooks added, Gordon Pike no longer on it.',
  rows: [
    { id: 'R1', nhi: P.ngata.nhi, name: P.ngata.name, dobISO: P.ngata.dobISO, scheduledTime: '13:00', procedureText: 'RTK' },
    { id: 'R2', nhi: P.lindqvist.nhi, name: P.lindqvist.name, dobISO: P.lindqvist.dobISO, scheduledTime: '15:30', procedureText: 'lap chole' },
    { id: 'R3', name: P.faleolo.name, dobISO: P.faleolo.dobISO, scheduledTime: '16:00', procedureText: 'carpal tunnel decomp R' },
    { id: 'R4', nhi: P.brooks.nhi, name: P.brooks.name, dobISO: P.brooks.dobISO, scheduledTime: '16:45', procedureText: 'lap appy' },
  ],
}

const STG_OKAFOR_ROW = {
  hospitalId: HOSP.stg,
  dateISO: OKAFOR_STORY_LIST.dateISO,
  session: OKAFOR_STORY_LIST.session,
  surgeon: OKAFOR,
  anaesthetist: RUTHERFORD,
  hospitalStatus: 'booked',
} as const

/**
 * (3) St George's day-before List, Mr Okafor's part (a hospital feed message): the hospital's fuller wording and an
 * insurer approval number for Wiremu Ngata, Ingrid Lindqvist shifted to 15:45, Sione Faleolo with his NHI (the waiting
 * stub's patient, same name and birth date), Helen Brooks as held. Gordon Pike is not sent: a hospital List is never
 * checked for missing Bookings. The rest of the day's message (Lists that match exactly) is built from the schedule
 * (`stgDayBeforeRows` in the store).
 */
export const STG_DAY_BEFORE_OKAFOR_ROWS: readonly IncomingBookingFields[] = [
  {
    ...STG_OKAFOR_ROW,
    externalRef: '1663501',
    scheduledTime: '13:00',
    patient: { name: P.ngata.name, nhi: P.ngata.nhi, dobISO: P.ngata.dobISO },
    procedure: { text: 'Right total knee replacement', code: 'LL3' },
    insurer: { text: 'Southern Cross Health Society', insurerPartyId: 'PY-SCHS', approvalNumber: '5528170' },
  },
  { ...STG_OKAFOR_ROW, externalRef: '1663502', scheduledTime: '15:45', patient: { name: P.lindqvist.name, nhi: P.lindqvist.nhi, dobISO: P.lindqvist.dobISO } },
  { ...STG_OKAFOR_ROW, externalRef: '1663503', scheduledTime: '16:00', patient: { name: P.faleolo.name, nhi: P.faleolo.nhiFromHospital, dobISO: P.faleolo.dobISO } },
  { ...STG_OKAFOR_ROW, externalRef: '1663504', scheduledTime: '16:45', patient: { name: P.brooks.name, nhi: P.brooks.nhi, dobISO: P.brooks.dobISO } },
]

export const STG_DAY_BEFORE = {
  id: 'STG-DAY-BEFORE-1125',
  hospitalId: HOSP.stg,
  label: "St George's theatre Lists · Wed 25 Nov",
  dateISO: OKAFOR_STORY_LIST.dateISO,
  okaforRows: STG_DAY_BEFORE_OKAFOR_ROWS,
  /** How many of the day's other St George's Lists the message carries, each matching exactly what AA holds. */
  matchingListCount: 2,
} as const

/** (4) Southern Cross cancels one Booking (the Booking is picked from the schedule: `sxCancellationRow` in the store). */
export const SX_CANCELLATION = {
  id: 'SX-CANCEL-1',
  hospitalId: HOSP.sx,
  label: 'Southern Cross · appointment cancelled',
  cancelReason: 'Cancelled by the patient, to rebook with the rooms',
} as const

/** (5) A scanned PDF: Mr Whitford's cataract List, read from a scan; three values read unsure, the rest kept sure. */
export const SCAN_PDF: MailboxPdfSample = {
  id: 'PDF-SCAN-WHITFORD-1203',
  fileName: 'Scan_0958.pdf',
  surgeonId: SURG.whitford,
  surgeonName: 'Mr J. Whitford',
  hospitalId: HOSP.ces,
  hospitalName: 'Christchurch Eye Surgery',
  subject: 'Cataract list · Thursday 3 December (PM)',
  senderEmail: 'bookings@merivaleeye.example',
  dateISO: '2026-12-03',
  session: 'PM',
  anaesthetist: { name: 'Dr Oliver Strand', hpiId: '23STRO' },
  scanned: true,
  // The practice's Word table, printed and scanned back in.
  template: 'wordGrid',
  scan: { skewDeg: -0.7 },
  headerConfidence: { surgeon: 0.99, hospital: 0.99, date: 0.99, session: 0.99, anaesthetist: 0.99 },
  note: 'Read from a scan: three values to check (an NHI, a date of birth and a time).',
  rows: [
    { id: 'R1', nhi: 'ZQE1069', name: 'Mavis Thornton', dobISO: '1944-02-11', scheduledTime: '13:00', procedureText: 'phaco + IOL R', confidence: sureExcept() },
    { id: 'R2', nhi: 'ZQE1077', name: 'Rewi Tamatea', dobISO: '1952-09-30', scheduledTime: '13:40', procedureText: 'phaco + IOL L', confidence: sureExcept('nhi') },
    { id: 'R3', nhi: 'ZQE1085', name: 'Joyce Abernethy', dobISO: '1939-12-05', scheduledTime: '14:20', procedureText: 'phaco + IOL R', confidence: sureExcept('dobISO') },
    { id: 'R4', nhi: 'ZQE1093', name: 'Arjun Mehta', dobISO: '1961-07-17', scheduledTime: '15:00', procedureText: 'blephs', confidence: sureExcept('scheduledTime') },
  ],
}

/** (5, second choice) A page that cannot be read: an arrival with no rows and its reason (D120, D125). */
export const UNREADABLE_PDF = {
  id: 'PDF-UNREADABLE-1012',
  fileName: 'Scan_1012.pdf',
  facsimile: buildUnreadableFacsimile('Scan_1012.pdf'),
  senderEmail: 'reception@riccartonortho.example',
  reason: UNREADABLE_REASONS.tooFaint,
} as const

/** (6) A Southern Cross message with no patient: held with its reason, never dropped; its raw text kept. */
export const SX_FAILED_MESSAGE = {
  id: 'SX-FAILED-1',
  hospitalId: HOSP.sx,
  label: 'Southern Cross message · Appointment',
  reason: 'The message names no patient, so it cannot become a Booking.',
  raw: JSON.stringify(
    {
      resourceType: 'Appointment',
      id: '1662188',
      status: 'booked',
      start: '2026-12-02T13:30:00+13:00',
      participant: [{ actor: { reference: 'Practitioner/41PATK', display: 'Ms K. Patel' }, status: 'accepted' }],
      serviceType: [{ text: 'lap chole' }],
    },
    null,
    2,
  ),
} as const

/** The Okafor story's samples, one per demo action (D119), in the order the actions play them. */
export const OKAFOR_STORY = {
  roomsList: OKAFOR_ROOMS_PDF,
  roomsResend: OKAFOR_ROOMS_RESEND,
  stgDayBefore: STG_DAY_BEFORE,
  sxCancellation: SX_CANCELLATION,
  scan: SCAN_PDF,
  unreadable: UNREADABLE_PDF,
  failedMessage: SX_FAILED_MESSAGE,
} as const

/**
 * The Forte Health sheet re-cast as a rooms' mailbox PDF (D125: the `manualSheet` channel has no catalogue source;
 * Forte Health is not connected, so its Lists come by PDF): Mr Okafor's Forte List for Tue 1 Dec AM, the sheet's first
 * row as it had it, and Rosa Mendes with the mistyped NHI, which the reader reads unsure.
 */
export const FORTE_ROOMS_PDF: MailboxPdfSample = {
  id: 'PDF-FORTE-OKAFOR-1201',
  fileName: 'Okafor Forte list Tue 1 Dec AM.pdf',
  surgeonId: SURG.okafor,
  surgeonName: OKAFOR.name,
  hospitalId: HOSP.forte,
  hospitalName: 'Forte Health',
  subject: 'Operating list · Tuesday 1 December (AM)',
  senderEmail: AVONSIDE_ADDRESS,
  dateISO: '2026-12-01',
  session: 'AM',
  // The practice's database report (one patient block after another).
  template: 'report',
  note: `Rosa Mendes's NHI is printed wrongly (${FORTE_MISTYPED_NHI}); the correct NHI is ${FORTE_CORRECTED_NHI}.`,
  rows: [
    { id: 'R1', nhi: 'ZQA1741', name: 'Peter Langley', dobISO: '1949-07-15', scheduledTime: '08:00', procedureText: 'phaco + IOL R' },
    { id: 'R2', nhi: FORTE_MISTYPED_NHI, name: 'Rosa Mendes', dobISO: '1984-04-06', scheduledTime: '09:30', procedureText: 'carpal tunnel decomp L', confidence: { nhi: 0.64 } },
  ],
}

// ---------------------------------------------------------------------------
// The seeded morning (Intake's everyday feed): what the sources sent before the office arrived on the demo day. The
// fixed parts live here; `seed/intakeMorning.ts` places them on the schedule (which Lists they update, which day a
// new List lands on, which anaesthetist the rooms name). Every patient is synthetic; every NHI valid and held by no
// seeded patient. None of it is a Booking, List or file the six demo actions use.
// ---------------------------------------------------------------------------

/** A patient a seeded arrival brings, as the sender prints them (no NHI: the row waits for one). */
export interface MorningPatient {
  name: string
  nhi?: string
  dobISO: string
  scheduledTime: string
  procedureText: string
  ethnicityCode?: string
}

/**
 * St George's new List in its day-before file for Wed 25 Nov: a surgeon whose List AA does not hold, the first of
 * `surgeonIds` with no List at St George's that AM. Three patients, every one new to AA.
 */
export const MORNING_STG_NEW_LIST = {
  surgeonIds: [SURG.doyle, SURG.cameron, SURG.nand, SURG.reid],
  session: 'AM' as Session,
  patients: [
    { name: 'Hemi Parata', nhi: 'ZQG1019', dobISO: '1957-05-22', scheduledTime: '08:00', procedureText: 'Right total hip joint replacement, primary' },
    { name: 'Claire Donovan', nhi: 'ZQG1027', dobISO: '1969-11-03', scheduledTime: '09:45', procedureText: 'Left knee arthroscopy and partial meniscectomy' },
    { name: 'Tavita Leaupepe', nhi: 'ZQG1035', dobISO: '1984-02-17', scheduledTime: '11:00', procedureText: 'ORIF right ankle, bimalleolar' },
  ] as readonly MorningPatient[],
} as const

/** The patient St George's adds to a List AA holds, sent with no NHI: they wait for one, their stub on the List. */
export const MORNING_STG_NO_NHI: MorningPatient = { name: 'Kahu Rangihuna', dobISO: '1975-08-09', scheduledTime: '12:15', procedureText: 'Excision of lipoma, upper back' }

/** The hospital's fuller wording for a procedure AA holds in short (the day-before file's wording change). */
export const MORNING_HOSPITAL_WORDING: Readonly<Record<string, string>> = {
  'Cataract extraction with IOL': 'Phacoemulsification and posterior chamber IOL, right eye',
  'Knee, total replacement': 'Right total knee joint replacement, cemented',
  'Hip, total replacement, primary': 'Left total hip joint replacement, primary, uncemented',
  'Laparoscopic cholecystectomy': 'Laparoscopic cholecystectomy +/- intraoperative cholangiogram',
  'Inguinal hernia repair': 'Right inguinal hernia repair with mesh, open',
  'Shoulder arthroscopy': 'Right shoulder arthroscopy, subacromial decompression',
  'Knee arthroscopy': 'Left knee arthroscopy, debridement',
  'Knee, ACL reconstruction': 'Right ACL reconstruction, hamstring graft',
  'Appendicectomy, laparoscopic': 'Laparoscopic appendicectomy, may convert to open',
  'Tonsillectomy': 'Bilateral tonsillectomy, cold steel',
  'Septoplasty': 'Septoplasty and bilateral inferior turbinate reduction',
  'Cystoscopy': 'Flexible cystoscopy, surveillance',
  'TURP': 'Transurethral resection of prostate, bipolar',
  'Umbilical hernia repair': 'Umbilical hernia repair, primary suture',
  'Wrist, ORIF distal radius': 'ORIF left distal radius, volar plate',
  'Thyroidectomy': 'Total thyroidectomy',
  'Varicose veins, bilateral': 'Bilateral endovenous laser ablation, long saphenous veins',
  'Ureteroscopy with lithotripsy': 'Right ureteroscopy, laser lithotripsy and stent',
}

/** Southern Cross's reasons, as its feed sends them. */
export const MORNING_SX = {
  cancelReason: 'Patient unwell, to be rebooked by the rooms',
  updateNote: 'Theatre order changed',
  /** The held message: its patient reference does not resolve. */
  held: {
    label: 'Southern Cross message · Appointment 1662231',
    reason: 'The patient reference does not resolve, so the message cannot tell who the patient is.',
  },
  /** Yesterday's held message, dismissed by the office. */
  heldYesterday: {
    label: 'Southern Cross message · Appointment 1661977',
    reason: 'The message names no patient, so it cannot become a Booking.',
    dismissReason: 'Southern Cross re-sent it with the patient, and that copy was applied',
  },
  /** Yesterday's update the office rejected. */
  rejectedNote: 'Start moved at theatre request',
  rejectReason: 'Theatre confirmed the original time by phone',
} as const

/** A rooms' PDF the seeded morning places on a day: its fixed parts and the days it may land on, in order. */
export interface MorningPdfSpec extends Omit<MailboxPdfSample, 'dateISO' | 'session' | 'anaesthetist' | 'subject'> {
  /** The days and sessions it may print, in order: the first whose List AA does not hold. */
  candidates: readonly { dateISO: string; session: Session }[]
  /** The rooms name a free anaesthetist for the day. */
  namesAnaesthetist: boolean
}

/** Mr Nand's rooms email a new List for Forte Health: four patients, one with no NHI, naming a free anaesthetist. */
export const MORNING_NAND_PDF: MorningPdfSpec = {
  id: 'PDF-MORNING-NAND',
  fileName: 'Nand hand list.pdf',
  surgeonId: SURG.nand,
  surgeonName: 'Mr V. Nand',
  hospitalId: HOSP.forte,
  hospitalName: 'Forte Health',
  senderEmail: 'bookings@nandhandsurgery.example',
  // A practice system's landscape operation list export.
  template: 'oplistx',
  candidates: [
    { dateISO: '2026-12-15', session: 'PM' },
    { dateISO: '2026-12-16', session: 'PM' },
    { dateISO: '2026-12-17', session: 'PM' },
  ],
  namesAnaesthetist: true,
  note: 'A new List naming a free anaesthetist; Sina Leota has no NHI.',
  rows: [
    { id: 'R1', nhi: 'ZQG1043', name: 'Aroha Tamihana', dobISO: '1979-04-12', scheduledTime: '13:00', procedureText: 'R carpal tunnel release' },
    { id: 'R2', nhi: 'ZQG1051', name: 'Graham Whitcombe', dobISO: '1950-09-30', scheduledTime: '13:45', procedureText: 'L trigger finger release' },
    { id: 'R3', name: 'Sina Leota', dobISO: '1991-01-25', scheduledTime: '14:30', procedureText: "Dupuytren's fasciectomy R" },
    { id: 'R4', nhi: 'ZQG1060', name: 'Peter Kowalczyk', dobISO: '1962-07-08', scheduledTime: '15:30', procedureText: 'ganglion excision L wrist' },
  ],
}

/** Ms Reid's rooms send a scanned eye List: read from a scan, three values below the check threshold. */
export const MORNING_REID_SCAN: MorningPdfSpec = {
  id: 'PDF-MORNING-REID-SCAN',
  fileName: 'Scan_0712.pdf',
  surgeonId: SURG.reid,
  surgeonName: 'Ms A. Reid',
  hospitalId: HOSP.ces,
  hospitalName: 'Christchurch Eye Surgery',
  senderEmail: 'reception@papanuieyecare.example',
  candidates: [
    { dateISO: '2026-12-14', session: 'AM' },
    { dateISO: '2026-12-15', session: 'AM' },
    { dateISO: '2026-12-21', session: 'AM' },
  ],
  namesAnaesthetist: false,
  scanned: true,
  // The older export, printed landscape and scanned onto a portrait page.
  template: 'oplist',
  scan: { rotated: true, skewDeg: 0.8 },
  headerConfidence: { surgeon: 0.99, hospital: 0.99, date: 0.99, session: 0.99, anaesthetist: 0.99 },
  note: 'Read from a scan: three values to check (an NHI, a time and a date of birth).',
  rows: [
    { id: 'R1', nhi: 'ZQG1078', name: 'Ngaire Hohaia', dobISO: '1948-03-02', scheduledTime: '08:00', procedureText: 'phaco + IOL L', confidence: sureExcept('nhi') },
    { id: 'R2', nhi: 'ZQG1086', name: 'Bruce McAllister', dobISO: '1941-12-19', scheduledTime: '08:40', procedureText: 'phaco + IOL R', confidence: sureExcept() },
    { id: 'R3', nhi: 'ZQG1094', name: 'Mei Ling Chua', dobISO: '1958-06-27', scheduledTime: '09:20', procedureText: 'squint correction R', confidence: sureExcept('scheduledTime') },
    { id: 'R4', nhi: 'ZQG1108', name: 'Rangi Paewai', dobISO: '1966-10-14', scheduledTime: '10:15', procedureText: 'vitrectomy L', confidence: sureExcept('dobISO') },
  ],
}

/** A PDF that cannot be read: no surgeon or session can be made out on it. */
export const MORNING_UNREADABLE = {
  fileName: 'Scan_0655.pdf',
  senderEmail: 'frontdesk@cashmeresurgical.example',
  reason: UNREADABLE_REASONS.noSurgeon,
} as const

/** The address a rooms' PDF from a surgeon's own practice comes from (the re-sent List): `lists@<surname>rooms.example`. */
export function morningRoomsAddress(surgeonName: string): string {
  const parts = surgeonName.trim().split(/\s+/)
  const surname = (parts[parts.length - 1] ?? 'surgeon').toLowerCase().replace(/[^a-z]/g, '')
  return `lists@${surname}rooms.example`
}

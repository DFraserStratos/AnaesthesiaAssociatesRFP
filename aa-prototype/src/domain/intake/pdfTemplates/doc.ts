/**
 * What a rooms' PDF template is given: the List's header, its patients with the details a practice system prints
 * (address, phones, email, GP, funder, approval numbers, anaesthetic, admission), and the keys of the values the
 * reader reads. Every detail beyond the sample's own values is synthetic and seeded from the patient, so the same
 * patient prints the same address on every PDF, and the same PDF prints the same page on every draw.
 *
 * Names printed come only from the source: the surgeon and anaesthetist as our masters hold them, the patients as the
 * sample has them. Streets, practices, GPs and email domains are invented; phone numbers sit in the 555 ranges.
 */

import { differenceInYears, format, parseISO } from 'date-fns'
import type { PdfReadField, PdfScan, PdfTemplateId, PdfTemplateVariant, Session } from '../../types'
import { addDaysISO } from '../../clock'
import { ENGLISH_NAMES, PATIENT_NAME_POOLS } from '../../seed/fullScale/names'

/** One patient as the source prints them: the values read, and how a re-sent List marks them. */
export interface PdfSourceRow {
  id: string
  name: string
  nhi?: string
  dobISO?: string
  scheduledTime?: string
  procedureText: string
  /** Changed since the List was last sent (a re-sent List may print it in red). */
  changed?: boolean
}

/** Everything a rooms' PDF is drawn from. */
export interface PdfDocumentSource {
  /** Seeds every synthetic detail and the scan's grain. */
  seed: string
  template: PdfTemplateId
  variant?: PdfTemplateVariant
  practice: string
  surgeonName: string
  hospitalName: string
  dateISO: string
  session: Session
  anaesthetistName?: string
  rows: readonly PdfSourceRow[]
  /** Patients the rooms print as cancelled on a re-sent List (not read: the List's removals come from AA's Bookings). */
  cancelledRows?: readonly PdfSourceRow[]
  /** Present when the PDF is a scan. */
  scan?: PdfScan
  /** The header values the reader reads (each the same string the read gives), present ones only. */
  header: Partial<Record<'surgeon' | 'hospital' | 'date' | 'session' | 'anaesthetist', string>>
}

/** A small deterministic hash (FNV-1a) and a generator seeded from it. */
export function seededSequence(seed: string): () => number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let state = h || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function pick<T>(next: () => number, from: readonly T[]): T {
  return from[Math.floor(next() * from.length) % from.length]!
}

function digits(next: () => number, n: number): string {
  let out = ''
  for (let i = 0; i < n; i++) out += String(Math.floor(next() * 10) % 10)
  return out
}

// ---------------------------------------------------------------------------
// Pools (invented names; real NZ suburbs, postcodes and funders only)
// ---------------------------------------------------------------------------

const STREETS = [
  'Kowhai Street', 'Rata Road', 'Totara Avenue', 'Matai Street', 'Rimu Place', 'Miro Lane', 'Harakeke Street', 'Tui Crescent',
  'Kereru Lane', 'Karaka Street', 'Manuka Terrace', 'Titoki Place', 'Ngaio Street', 'Hinau Road', 'Puriri Street', 'Tawa Crescent',
  'Wharariki Drive', 'Kanuka Grove', 'Pingao Place', 'Raupo Road', 'Toetoe Street', 'Korimako Lane',
]

const PLACES: readonly { suburb: string; city: string; postcode: string }[] = [
  { suburb: 'Riccarton', city: 'Christchurch', postcode: '8011' },
  { suburb: 'Fendalton', city: 'Christchurch', postcode: '8052' },
  { suburb: 'Papanui', city: 'Christchurch', postcode: '8053' },
  { suburb: 'Bishopdale', city: 'Christchurch', postcode: '8053' },
  { suburb: 'Ilam', city: 'Christchurch', postcode: '8041' },
  { suburb: 'Halswell', city: 'Christchurch', postcode: '8025' },
  { suburb: 'Cashmere', city: 'Christchurch', postcode: '8022' },
  { suburb: 'Sydenham', city: 'Christchurch', postcode: '8023' },
  { suburb: 'St Albans', city: 'Christchurch', postcode: '8014' },
  { suburb: 'Linwood', city: 'Christchurch', postcode: '8062' },
  { suburb: 'Hornby', city: 'Christchurch', postcode: '8042' },
  { suburb: 'Avonhead', city: 'Christchurch', postcode: '8042' },
  { suburb: 'Northwood', city: 'Christchurch', postcode: '8051' },
  { suburb: 'Shirley', city: 'Christchurch', postcode: '8061' },
  { suburb: 'Spreydon', city: 'Christchurch', postcode: '8024' },
  { suburb: 'Sumner', city: 'Christchurch', postcode: '8081' },
  { suburb: 'Kaiapoi', city: 'Kaiapoi', postcode: '7630' },
  { suburb: 'Rangiora', city: 'Rangiora', postcode: '7400' },
  { suburb: 'Rolleston', city: 'Rolleston', postcode: '7614' },
  { suburb: 'Lincoln', city: 'Lincoln', postcode: '7608' },
  { suburb: 'Darfield', city: 'Darfield', postcode: '7510' },
  { suburb: 'Ashburton', city: 'Ashburton', postcode: '7700' },
]

const GP_PRACTICES = [
  'Harakeke Medical', 'Totara Family Practice', 'Plainsview Medical Centre', 'Avon Loop Health', 'Westmere Family Doctors',
  'Southbridge Road Medical', 'Port Hills Health', 'Tui Street Medical', 'Kahikatea Health Centre', 'Riverbend Doctors',
]
const GP_SURNAMES = ['Haldane', 'Pryor', 'Whitlow', 'Ferrier', 'Mackie', 'Tregear', 'Ostler', 'Kingi', 'Sefo', 'Varga', 'Lomax', 'Rennie', 'Aitcheson', 'Brabant']
const INITIALS = 'ABCDEGHJKLMNPRST'

const EMAIL_DOMAINS = ['kiwimail.co.nz', 'southnet.co.nz', 'plainsnet.nz', 'harbourmail.co.nz', 'tuinet.co.nz', 'cantymail.co.nz']

/** A patient's funder as a practice prints it: short and long forms, and how an approval is numbered. */
export interface Funder {
  short: string
  long: string
  kind: 'insurer' | 'acc' | 'self' | 'public'
  approval?: string
  policy?: string
}

const INSURERS: readonly { short: string; long: string }[] = [
  { short: 'Southern Cross', long: 'Southern Cross Healthcare' },
  { short: 'Southern Cross', long: 'Southern Cross Healthcare' },
  { short: 'nib', long: 'nib nz' },
  { short: 'AIA', long: 'AIA Health' },
  { short: 'Partners Life', long: 'Partners Life' },
  { short: 'Accuro', long: 'Accuro Health Insurance' },
]

const ALLERGIES = ['NKDA', 'NKDA', 'Nil known', 'Penicillin', 'Codeine', 'Latex', 'Elastoplast', 'NKDA']
const CONDITIONS = ['Nil', 'Hypertension', 'Asthma, well controlled', 'Diabetes, diet controlled', 'Nil', 'Reflux', 'Hypothyroid']
const MEDS = ['Nil', 'Cilazapril', 'Salbutamol PRN', 'Metformin', 'Nil', 'Omeprazole', 'Levothyroxine']

const FEMALE = new Set<string>([...ENGLISH_NAMES.female, ...PATIENT_NAME_POOLS.flatMap((p) => p.female)].map((n) => n.toLowerCase()))
const MALE = new Set<string>([...ENGLISH_NAMES.male, ...PATIENT_NAME_POOLS.flatMap((p) => p.male)].map((n) => n.toLowerCase()))
for (const n of ['margaret', 'coral', 'annette', 'joan', 'ruth', 'ingrid', 'helen', 'rosa', 'mavis', 'joyce', 'ngaire', 'aroha', 'sina', 'claire', 'mere', 'mei', 'susan', 'hana']) FEMALE.add(n)
for (const n of ['brian', 'hemi', 'peter', 'wiremu', 'gordon', 'sione', 'rewi', 'arjun', 'bruce', 'graham', 'tavita', 'david', 'rangi']) MALE.add(n)

/** A title a practice system prints for a patient, when the given name tells it (else none, never a guess). */
function titleFor(given: string, age: number | undefined, next: () => number): string | undefined {
  const first = given.split(/\s+/)[0]!.toLowerCase()
  const f = FEMALE.has(first)
  const m = MALE.has(first)
  if (f === m) return undefined
  if (age !== undefined && age < 16) return f ? 'Miss' : 'Master'
  if (m) return 'Mr'
  return age !== undefined && age > 55 ? (next() < 0.7 ? 'Mrs' : 'Ms') : next() < 0.5 ? 'Ms' : 'Mrs'
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

/** The details a practice system holds for a patient (all synthetic, from the patient's own seed). */
export interface PatientDetails {
  title?: string
  street: string
  suburb: string
  city: string
  postcode: string
  mobile: string
  home?: string
  email: string
  gp: { name: string; practice: string }
  funder: Funder
  /** "Day case", "Overnight x 1". */
  admission: string
  /** Day stay or an overnight. */
  dayStay: boolean
  anaesthetic: string
  allergies: string
  conditions: string
  meds: string
  smoker: string
  /** The practice's own patient number. */
  patientNo: string
  side?: 'Left' | 'Right'
}

export interface DocRow {
  id: string
  /** 1-based, in the order printed. */
  order: number
  name: string
  given: string
  surname: string
  nhi?: string
  dobISO?: string
  age?: number
  /** The time as the sample has it (HH:MM), printed by a layout that prints times. */
  time?: string
  /** Minutes from midnight this patient's slot starts, worked out from the start and the durations before it. */
  startMin: number
  durationMin: number
  /** When the patient is to report, before their slot. */
  reportMin: number
  procedureText: string
  changed: boolean
  p: PatientDetails
}

export interface PdfDoc {
  seed: string
  variant?: PdfTemplateVariant
  practice: string
  surgeonName: string
  hospitalName: string
  anaesthetistName?: string
  dateISO: string
  session: Session
  /** When the rooms printed it (a weekday afternoon one to three days before). */
  printed: { dateISO: string; hour: number; minute: number }
  /** The session's start and end, minutes from midnight. */
  startMin: number
  endMin: number
  rows: DocRow[]
  cancelled: DocRow[]
  /** A row value's key when the reader reads it (the value is present), else undefined. */
  key: (rowId: string, field: PdfReadField) => string | undefined
  /** A header value's key when it is present. */
  headerKey: (field: 'surgeon' | 'hospital' | 'date' | 'session' | 'anaesthetist') => string | undefined
}

export const HEADER_ROW_ID = 'header'
export const valueKey = (rowId: string, field: PdfReadField) => `${rowId}:${field}`

const minutesOf = (hhmm: string | undefined): number | undefined => {
  if (hhmm === undefined || !/^\d{1,2}:\d{2}$/.test(hhmm)) return undefined
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

function sideOf(text: string): 'Left' | 'Right' | undefined {
  if (/\b(L|left|Lt)\b/i.test(text) && !/\b(R|right|Rt)\b/i.test(text)) return 'Left'
  if (/\b(R|right|Rt)\b/i.test(text)) return 'Right'
  return undefined
}

function detailsFor(row: PdfSourceRow, age: number | undefined, given: string, surname: string): PatientDetails {
  const next = seededSequence(`patient|${row.nhi ?? ''}|${row.name}|${row.dobISO ?? ''}`)
  const place = pick(next, PLACES)
  const number = 2 + Math.floor(next() * 220)
  const unit = next() < 0.15 ? `${1 + Math.floor(next() * 6)}/` : ''
  const mobilePrefix = pick(next, ['021', '022', '027', '027'])
  const mobile = `${mobilePrefix} 555 0${digits(next, 3)}`
  const home = next() < 0.4 ? `03 555 ${digits(next, 4)}` : undefined
  const sep = pick(next, ['.', '', '_'])
  const email = `${given.split(/\s+/)[0]!.toLowerCase()}${sep}${surname.toLowerCase().replace(/[^a-z]/g, '')}${next() < 0.5 ? digits(next, 2) : ''}@${pick(next, EMAIL_DOMAINS)}`
  const gpSurname = pick(next, GP_SURNAMES)
  const gp = { name: `${gpSurname}, Dr ${INITIALS[Math.floor(next() * INITIALS.length)]}`, practice: pick(next, GP_PRACTICES) }
  const roll = next()
  const eye = /phaco|IOL|cataract|vitrect|squint|bleph/i.test(row.procedureText)
  let funder: Funder
  if (roll < 0.58) {
    const ins = pick(next, INSURERS)
    funder = { ...ins, kind: 'insurer', approval: digits(next, 8), policy: digits(next, 7) }
  } else if (roll < 0.7) funder = { short: 'ACC', long: 'ACC', kind: 'acc', approval: `${pick(next, ['M', 'K', 'P'])}${digits(next, 9)}` }
  else if (roll < 0.86) funder = { short: 'Self pay', long: 'Self-funding', kind: 'self' }
  else funder = { short: 'HNZ', long: 'Health NZ contract', kind: 'public', approval: digits(next, 7) }
  const dayStay = eye || next() < 0.65
  const nights = 1 + Math.floor(next() * 3)
  const title = titleFor(given, age, seededSequence(`title|${row.name}`))
  const side = sideOf(row.procedureText)
  return {
    ...(title !== undefined ? { title } : {}),
    street: `${unit}${number} ${pick(next, STREETS)}`,
    suburb: place.suburb,
    city: place.city,
    postcode: place.postcode,
    mobile,
    ...(home !== undefined ? { home } : {}),
    email,
    gp,
    funder,
    admission: dayStay ? 'Day case' : `Overnight x ${nights}`,
    dayStay,
    anaesthetic: eye ? pick(next, ['LA', 'LA/DS', 'LA + sedation']) : 'GA',
    allergies: pick(next, ALLERGIES),
    conditions: pick(next, CONDITIONS),
    meds: pick(next, MEDS),
    smoker: next() < 0.85 ? 'Non-smoker' : 'Smoker',
    patientNo: String(140000 + Math.floor(next() * 40000)),
    ...(side !== undefined ? { side } : {}),
  }
}

function splitName(name: string): { given: string; surname: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { given: parts[0]!, surname: parts[0]! }
  return { given: parts.slice(0, -1).join(' '), surname: parts[parts.length - 1]! }
}

/** The document a template lays out: the source's values, each patient's slot and details, and the read keys. */
export function docOf(src: PdfDocumentSource): PdfDoc {
  const next = seededSequence(`doc|${src.seed}`)
  const defaultStart = src.session === 'AM' ? 8 * 60 : src.session === 'PM' ? 13 * 60 : 18 * 60
  const times = src.rows.map((r) => minutesOf(r.scheduledTime))
  const startMin = times.find((t) => t !== undefined) ?? defaultStart
  const listDay = parseISO(src.dateISO)
  const rowOf = (r: PdfSourceRow, i: number, startAt: number, duration: number): DocRow => {
    const { given, surname } = splitName(r.name)
    const age = r.dobISO !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(r.dobISO) ? differenceInYears(listDay, parseISO(r.dobISO)) : undefined
    return {
      id: r.id,
      order: i + 1,
      name: r.name,
      given,
      surname,
      ...(r.nhi !== undefined && r.nhi !== '' ? { nhi: r.nhi } : {}),
      ...(r.dobISO !== undefined && r.dobISO !== '' ? { dobISO: r.dobISO } : {}),
      ...(age !== undefined ? { age } : {}),
      ...(r.scheduledTime !== undefined && r.scheduledTime !== '' ? { time: r.scheduledTime } : {}),
      startMin: startAt,
      durationMin: duration,
      reportMin: Math.max(6 * 60 + 30, startAt - (i === 0 ? 60 : 90)),
      procedureText: r.procedureText,
      changed: r.changed === true,
      p: detailsFor(r, age, given, surname),
    }
  }
  // Each slot runs to the next patient's time; one with no next time takes a usual length for a List.
  let at = startMin
  const rows = src.rows.map((r, i) => {
    const here = times[i] ?? at
    const after = times.slice(i + 1).find((t) => t !== undefined)
    const gap = after !== undefined ? after - here : undefined
    const duration = gap !== undefined && gap > 0 && gap <= 300 ? gap : pick(next, [30, 45, 45, 60, 90])
    const row = rowOf(r, i, here, duration)
    at = here + duration
    return row
  })
  const endMin = Math.max(startMin + 180, Math.ceil(at / 30) * 30)
  const cancelled = (src.cancelledRows ?? []).map((r, i) => rowOf(r, rows.length + i, at, 30))
  const printedDay = addDaysISO(src.dateISO, -(1 + Math.floor(next() * 3)))
  const present = new Set<string>()
  for (const r of src.rows) {
    if (r.name.trim() !== '') present.add(valueKey(r.id, 'name'))
    if (r.procedureText.trim() !== '') present.add(valueKey(r.id, 'procedureText'))
    if (r.nhi !== undefined && r.nhi.trim() !== '') present.add(valueKey(r.id, 'nhi'))
    if (r.dobISO !== undefined && r.dobISO.trim() !== '') present.add(valueKey(r.id, 'dobISO'))
    if (r.scheduledTime !== undefined && r.scheduledTime.trim() !== '') present.add(valueKey(r.id, 'scheduledTime'))
  }
  for (const [field, value] of Object.entries(src.header)) if (value !== undefined && value.trim() !== '') present.add(valueKey(HEADER_ROW_ID, field as PdfReadField))
  return {
    seed: src.seed,
    ...(src.variant !== undefined ? { variant: src.variant } : {}),
    practice: src.practice,
    surgeonName: src.surgeonName,
    hospitalName: src.hospitalName,
    ...(src.anaesthetistName !== undefined ? { anaesthetistName: src.anaesthetistName } : {}),
    dateISO: src.dateISO,
    session: src.session,
    printed: { dateISO: printedDay, hour: 13 + Math.floor(next() * 4), minute: Math.floor(next() * 60) },
    startMin,
    endMin,
    rows,
    cancelled,
    key: (rowId, field) => (present.has(valueKey(rowId, field)) ? valueKey(rowId, field) : undefined),
    headerKey: (field) => (present.has(valueKey(HEADER_ROW_ID, field)) ? valueKey(HEADER_ROW_ID, field) : undefined),
  }
}

// ---------------------------------------------------------------------------
// Formatting as practice systems print
// ---------------------------------------------------------------------------

/** A date in a pattern of date-fns tokens ("dd.MM.yy", "dd/MM/yyyy", "EEEE d MMMM yyyy"). */
export function fmtDate(dateISO: string, pattern: string): string {
  return format(parseISO(dateISO.slice(0, 10)), pattern)
}

/** "1:30 pm", "07:30 am", "1:30PM": minutes from midnight on a twelve-hour clock. */
export function clock12(minutes: number, opts: { pad?: boolean; upper?: boolean; space?: boolean } = {}): string {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  const suffix = h24 < 12 ? 'am' : 'pm'
  const hh = opts.pad === true ? String(h).padStart(2, '0') : String(h)
  return `${hh}:${String(m).padStart(2, '0')}${opts.space === false ? '' : ' '}${opts.upper === true ? suffix.toUpperCase() : suffix}`
}

/** "13:30" or "1330": minutes from midnight on a 24-hour clock. */
export function clock24(minutes: number, colon = true): string {
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return colon ? `${h}:${m}` : `${h}${m}`
}

/** The ordinal suffix of a day of the month ("st", "nd", "rd", "th"). */
export function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th'
  return day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th'
}

/**
 * Demo-grade HL7 v2 parsing + the mapping-driven field extractor (Phase 11).
 *
 * This is NOT a general-purpose HL7 parser (the §10 scope fence stands): it
 * covers exactly the canned SIU segment shapes this demo sends (MSH / SCH /
 * PID / AIS). What it IS is genuinely MAPPING-DRIVEN — `extractViaMapping`
 * resolves every domain field through the feed's `fieldMapping`, so editing a
 * mapping (the failure-fix flow) changes what reprocessing produces. Two
 * hospitals put the NHI in different fields (St George's PID-2, Christchurch
 * Public PID-3); the mapping is what makes that difference load-bearing rather
 * than decorative.
 */

/**
 * The neutral message the store acts on, produced by BOTH the HL7 extractor and
 * the FHIR extractor (`fhir.ts`) — so a create/update/cancel effect never has to
 * know which transport it arrived on.
 */
export interface ParsedMessage {
  /** SIU trigger event (S12 book, S13 reschedule, S14 modify, S15 cancel). */
  eventType: string
  /** MSH-10 — the message-level idempotency key. */
  messageControlId: string
  /** SCH-2 filler appointment id — the APPOINTMENT correlation key. */
  appointmentId?: string
  /** Procedure / service description (AIS-3 component 2). */
  operation?: string
  /** Appointment date `YYYY-MM-DD` (from the scheduled datetime). */
  scheduledDateISO?: string
  /** Appointment time `HH:mm`. */
  scheduledTime?: string
  /** S15 cancellation reason (SCH-6 filler status / event reason). */
  cancelReason?: string
  /** S14 free-text note the update carries (NTE-3), if any. */
  note?: string
  patient: {
    /** As extracted (may be an invalid value under a wrong mapping — the store validates). */
    nhi?: string
    name?: string
    dobISO?: string
    ethnicityCode?: string
  }
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** One parsed segment: its name and its `|`-split fields (fields[0] is the name). */
export interface Hl7Segment {
  name: string
  fields: string[]
}

export interface ParsedHl7 {
  segments: Hl7Segment[]
}

/** Split a raw HL7 message (CR- or LF-delimited) into addressable segments. */
export function parseHl7(raw: string): ParsedHl7 {
  const lines = raw
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const segments: Hl7Segment[] = lines.map((line) => {
    const fields = line.split('|')
    return { name: fields[0] ?? '', fields }
  })
  return { segments }
}

function firstSegment(parsed: ParsedHl7, name: string): Hl7Segment | undefined {
  return parsed.segments.find((s) => s.name === name)
}

/**
 * Read a `SEG-n` (1-based) field, honouring MSH's off-by-one: MSH-1 IS the
 * field separator, so MSH-n sits at split index n-1, while for every other
 * segment SEG-n sits at split index n. Returns '' when absent.
 */
export function readField(parsed: ParsedHl7, segmentName: string, fieldNumber: number): string {
  const segment = firstSegment(parsed, segmentName)
  if (segment === undefined) return ''
  const index = segmentName === 'MSH' ? fieldNumber - 1 : fieldNumber
  return segment.fields[index] ?? ''
}

/** The c-th (1-based) `^`-delimited component of a field value. */
function component(fieldValue: string, c: number): string {
  return fieldValue.split('^')[c - 1] ?? ''
}

/**
 * Resolve a mapping path like `PID-2`, `PID-3`, `PID-5.2` or `AIS-3.2` against a
 * parsed message. `SEG-F` returns the field's first component; `SEG-F.C` the
 * explicit component. This is the ONE reader the extractor uses, so a mapping
 * edit is the only thing that changes what a field resolves to.
 */
export function resolvePath(parsed: ParsedHl7, path: string): string {
  const match = /^([A-Z0-9]{2,3})-(\d+)(?:\.(\d+))?$/.exec(path.trim())
  if (match === null) return ''
  const [, seg, fieldStr, compStr] = match
  const field = readField(parsed, seg ?? '', Number(fieldStr))
  return component(field, compStr !== undefined ? Number(compStr) : 1).trim()
}

// ---------------------------------------------------------------------------
// Formatting helpers (HL7 wire formats → domain shapes)
// ---------------------------------------------------------------------------

/** `YYYYMMDD` → `YYYY-MM-DD` (returns '' if it doesn't look like a date). */
function toDateISO(hl7: string): string {
  const digits = hl7.replace(/[^0-9]/g, '')
  if (digits.length < 8) return ''
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

/** `YYYYMMDDHHMM[SS]` → `{ dateISO, time }` (`HH:mm`). */
function toDateTime(hl7: string): { dateISO: string; time: string } {
  const digits = hl7.replace(/[^0-9]/g, '')
  const dateISO = toDateISO(digits)
  const time = digits.length >= 12 ? `${digits.slice(8, 10)}:${digits.slice(10, 12)}` : ''
  return { dateISO, time }
}

/** `family^given` → `given family` (trimmed). */
function toDisplayName(fieldValue: string): string {
  const family = component(fieldValue, 1)
  const given = component(fieldValue, 2)
  return [given, family].map((s) => s.trim()).filter((s) => s.length > 0).join(' ')
}

// ---------------------------------------------------------------------------
// The mapping-driven extractor
// ---------------------------------------------------------------------------

/** The domain field names a feed mapping keys onto HL7 paths. */
export const HL7_MAPPING_KEYS = [
  'nhi',
  'patientName',
  'dob',
  'ethnicity',
  'appointmentId',
  'scheduledDateTime',
  'operation',
] as const

/**
 * Extract the neutral `ParsedMessage` from raw HL7 using a feed's field mapping.
 * `eventType` (MSH-9.2) and `messageControlId` (MSH-10) are read from their
 * fixed MSH positions (they are transport plumbing, not per-hospital config);
 * every patient / appointment field is resolved THROUGH the mapping.
 */
export function extractViaMapping(raw: string, mapping: Record<string, string>): ParsedMessage {
  const parsed = parseHl7(raw)

  const eventType = component(readField(parsed, 'MSH', 9), 2) || readField(parsed, 'MSH', 9)
  const messageControlId = readField(parsed, 'MSH', 10)

  const at = (key: string): string => {
    const path = mapping[key]
    return path === undefined ? '' : resolvePath(parsed, path)
  }

  const message: ParsedMessage = { eventType, messageControlId, patient: {} }

  const nhi = at('nhi')
  if (nhi !== '') message.patient.nhi = nhi
  const nameField = mapping.patientName !== undefined ? readField(parsed, ...splitPath(mapping.patientName)) : ''
  const name = nameField !== '' ? toDisplayName(nameField) : ''
  if (name !== '') message.patient.name = name
  const dob = toDateISO(at('dob'))
  if (dob !== '') message.patient.dobISO = dob
  const ethnicity = at('ethnicity')
  if (ethnicity !== '') message.patient.ethnicityCode = ethnicity

  const appointmentId = at('appointmentId')
  if (appointmentId !== '') message.appointmentId = appointmentId
  const operation = at('operation')
  if (operation !== '') message.operation = operation

  const dt = toDateTime(at('scheduledDateTime'))
  if (dt.dateISO !== '') message.scheduledDateISO = dt.dateISO
  if (dt.time !== '') message.scheduledTime = dt.time

  // Cancellation reason + update note come from fixed positions (SCH-6 / NTE-3);
  // they are not part of the per-hospital demographic mapping.
  const cancelReason = resolvePath(parsed, 'SCH-6')
  if (cancelReason !== '') message.cancelReason = cancelReason
  const note = readField(parsed, 'NTE', 3)
  if (note !== '') message.note = note

  return message
}

/** `PID-5` / `PID-5.1` → `['PID', 5]` for the whole-field name read. */
function splitPath(path: string): [string, number] {
  const match = /^([A-Z0-9]{2,3})-(\d+)/.exec(path.trim())
  if (match === null) return ['', 0]
  return [match[1] ?? '', Number(match[2])]
}

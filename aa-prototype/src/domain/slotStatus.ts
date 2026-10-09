/**
 * The availability statuses (catch-up Phase 29; US-01.2.1, US-01.2.2, FT-01.2;
 * OQ-17, OQ-27 and OQ-64, answered). Pure: no React, no store, no clock reads.
 *
 * A Slot's status is a row of the user-maintained master `masters.slotStatuses`:
 * a fixed internal ID that rules read, and an editable label, description and
 * colour (one of the design's six tokens). Every finder, filter, count and clash
 * rule in the app goes through the helpers here, by ID, never by label. Literal
 * availability keys appear only in this module and the seed.
 *
 * The master holds availability only. A List's state (DRAFT, ACTIVE, SUBMITTED,
 * AUTHORISED; EP-07) lives on the List and is never a status here (US-01.2.2
 * since 2026-10-07). "Slot" is a code word: no label may say it (OQ-64).
 */

import { format, parseISO } from 'date-fns'
import { enumerateDatesISO } from './clock'
import {
  LIST_KIND_LABELS,
  LIST_KINDS,
  LIST_STATE_LABELS,
  LIST_STATES,
  STATUS_COLOUR_TOKENS,
  STATUS_TREATMENTS,
  type DisplayKey,
  type List,
  type ListKind,
  type Session,
  type Slot,
  type SlotStatus,
  type SlotStatusKey,
  type StatusColourToken,
  type StatusTreatment,
} from './types'

/** The seeded statuses' fixed IDs (Phase 28's stored values). The only home of these literals outside the seed. */
export const SEED_STATUS = {
  free: 'free',
  holiday: 'holiday',
  unavailable: 'unavailable',
} as const satisfies Record<string, SlotStatusKey>

export type SlotStatusRecords = Readonly<Record<SlotStatusKey, SlotStatus>>

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** The status record for an ID, or undefined (undefined-safe). */
export function statusFor(statuses: SlotStatusRecords, key: SlotStatusKey | undefined): SlotStatus | undefined {
  if (key === undefined) return undefined
  return Object.prototype.hasOwnProperty.call(statuses, key) ? statuses[key] : undefined
}

const byOrder = (a: SlotStatus, b: SlotStatus) => a.order - b.order || a.key.localeCompare(b.key)

/** Every status not retired, in `order`. */
export function activeStatuses(statuses: SlotStatusRecords): SlotStatus[] {
  return Object.values(statuses)
    .filter((s) => s.retiredAtISO === undefined)
    .sort(byOrder)
}

/** Every status, in-use ones first (in `order`), then retired ones. */
export function allStatusesForEditor(statuses: SlotStatusRecords): SlotStatus[] {
  const all = Object.values(statuses)
  return [...all.filter((s) => s.retiredAtISO === undefined).sort(byOrder), ...all.filter((s) => s.retiredAtISO !== undefined).sort(byOrder)]
}

/** What an anaesthetist may choose: active and settable, in `order`. */
export function anaesthetistChoices(statuses: SlotStatusRecords): SlotStatus[] {
  return activeStatuses(statuses).filter((s) => s.anaesthetistCanSet)
}

/**
 * The default status: the one every new session takes and a cleared or vacated
 * one returns to ("a Slot is free by default", US-01.2.1). The master always
 * holds exactly one (the validator guarantees it); the fallback keeps a damaged
 * record from crashing a render.
 */
export function defaultSlotStatus(statuses: SlotStatusRecords): SlotStatus {
  const found = Object.values(statuses).find((s) => s.isDefault === true)
  if (found !== undefined) return found
  const free = statusFor(statuses, SEED_STATUS.free)
  if (free !== undefined) return free
  return {
    key: SEED_STATUS.free,
    label: 'Free',
    longLabel: 'Free',
    description: 'Open for a List.',
    colour: 'free',
    treatment: 'dashed',
    bookable: true,
    anaesthetistCanSet: true,
    isDefault: true,
    order: 0,
  }
}

/** The default status's ID. */
export function defaultSlotStatusKey(statuses: SlotStatusRecords): SlotStatusKey {
  return defaultSlotStatus(statuses).key
}

// ---------------------------------------------------------------------------
// Behaviour (by ID, never by label)
// ---------------------------------------------------------------------------

/** Open for bookings: the office may place a List and the finders count it as free. An unknown status is not. */
export function isOpenForBooking(status: Pick<SlotStatus, 'bookable'> | undefined): boolean {
  return status !== undefined && status.bookable
}

/** Closed: not open for bookings (an unknown status counts as closed). */
export function isClosed(status: Pick<SlotStatus, 'bookable'> | undefined): boolean {
  return !isOpenForBooking(status)
}

/** `isClosed` by ID. */
export function isClosedKey(statuses: SlotStatusRecords, key: SlotStatusKey): boolean {
  return isClosed(statusFor(statuses, key))
}

/**
 * Open for a List or cover (US-01.4.2): no List is in the session and its
 * status is open for bookings. The finders, cover chips, "Free only" filters
 * and free counts all mean this, so a session holding a List, or one marked
 * with any closed status (an admin-added kind of unavailable included), is
 * never offered as free.
 */
export function isOpenSlot(
  slot: Pick<Slot, 'status'>,
  list: Pick<List, 'id'> | undefined,
  statuses: SlotStatusRecords,
): boolean {
  return list === undefined && isOpenForBooking(statusFor(statuses, slot.status))
}

/** A display key is a List kind (the List shows in place of the status). */
export function isListKind(key: DisplayKey): key is ListKind {
  return (LIST_KINDS as readonly string[]).includes(key)
}

/**
 * The one label lookup for a displayed status (catch-up Phase 28's
 * `displayStatusLabel`, now reading the master): a List kind's fixed label, the
 * status record's label otherwise, and "Unknown status" for an unknown ID
 * (never the raw ID). A retired status still names the sessions that carry it.
 */
export function displayStatusLabel(key: DisplayKey, statuses: SlotStatusRecords, long = false): string {
  if (isListKind(key)) return long ? LIST_KIND_LABELS[key].longLabel : LIST_KIND_LABELS[key].label
  const status = statusFor(statuses, key)
  if (status === undefined) return 'Unknown status'
  return long ? status.longLabel : status.label
}

// ---------------------------------------------------------------------------
// The status master's validator
// ---------------------------------------------------------------------------

/** What an admin edits (the ID is never part of a draft: assigned on create, fixed on edit). */
export interface SlotStatusDraft {
  label: string
  longLabel: string
  description: string
  colour: StatusColourToken
  treatment: StatusTreatment
  bookable: boolean
  anaesthetistCanSet: boolean
  isDefault: boolean
}

export const SLOT_STATUS_LIMITS = { label: 16, longLabel: 32, description: 160 } as const

/** The words a status may not be named, because they are a List's state or its label (plus Phase 31's Draft and Draft List). */
export function listStateWords(): string[] {
  return [...new Set([...LIST_STATES, ...Object.values(LIST_STATE_LABELS), 'DRAFT', 'DRAFT LIST'].map((w) => w.toUpperCase()))]
}

export const LIST_STATE_LABEL_MESSAGE = "That is a List's state, not availability. A List's state is shown on the List."

const DASHES = /[–—]/
const SLOT_WORD = /slot/i

function textIssues(field: string, value: string, max: number): string[] {
  const trimmed = value.trim()
  const issues: string[] = []
  if (trimmed.length === 0) issues.push(`Enter a ${field}.`)
  else if (trimmed.length > max) issues.push(`Keep the ${field} to ${max} characters.`)
  if (DASHES.test(value)) issues.push(`Use a hyphen or a comma, not a long dash, in the ${field}.`)
  if (SLOT_WORD.test(value)) issues.push(`The apps call each half-day a session. Use that word in the ${field}.`)
  return issues
}

/**
 * Plain-language issues with a status draft (US-01.2.2). `key` is the status
 * being edited (absent on create: the store assigns the ID). Empty means valid.
 */
export function validateSlotStatusDraft(
  draft: SlotStatusDraft,
  statuses: SlotStatusRecords,
  ctx: { key?: SlotStatusKey } = {},
): string[] {
  const issues: string[] = []
  const current = ctx.key === undefined ? undefined : statusFor(statuses, ctx.key)
  if (ctx.key !== undefined && current === undefined) return ['That status no longer exists.']

  issues.push(...textIssues('label', draft.label, SLOT_STATUS_LIMITS.label))
  issues.push(...textIssues('long label', draft.longLabel, SLOT_STATUS_LIMITS.longLabel))
  issues.push(...textIssues('description', draft.description, SLOT_STATUS_LIMITS.description))

  const stateWords = listStateWords()
  const isStateWord = (v: string) => stateWords.includes(v.trim().toUpperCase())
  if (isStateWord(draft.label) || isStateWord(draft.longLabel)) issues.push(LIST_STATE_LABEL_MESSAGE)

  const label = draft.label.trim().toLowerCase()
  const clash = activeStatuses(statuses).find((s) => s.key !== ctx.key && s.label.trim().toLowerCase() === label)
  if (label.length > 0 && clash !== undefined) issues.push(`Another status is already called ${clash.label}.`)
  const kindClash = LIST_KINDS.find((k) => LIST_KIND_LABELS[k].label.toLowerCase() === label)
  if (kindClash !== undefined) issues.push(`${LIST_KIND_LABELS[kindClash].label} is a List type, not availability.`)

  if (!(STATUS_COLOUR_TOKENS as readonly string[]).includes(draft.colour)) issues.push('Choose one of the six status colours.')
  if (!(STATUS_TREATMENTS as readonly string[]).includes(draft.treatment)) issues.push('Choose solid, hatched or dashed.')

  if (draft.isDefault && !draft.bookable) issues.push('The default status must be open for bookings.')
  if (current?.isDefault === true && !draft.isDefault) {
    issues.push('There must be one default status. Make another status the default instead.')
  }
  if (current?.retiredAtISO !== undefined && draft.isDefault) issues.push('Restore this status before making it the default.')
  return issues
}

/** Issues with retiring a status: never the default, never one an active series uses (`ctx` carries the count). */
export function validateRetireSlotStatus(
  statuses: SlotStatusRecords,
  key: SlotStatusKey,
  ctx: { activeSeriesUsing: number },
): string[] {
  const status = statusFor(statuses, key)
  if (status === undefined) return ['That status no longer exists.']
  if (status.retiredAtISO !== undefined) return ['That status is already retired.']
  if (status.isDefault === true) return ['The default status cannot be retired. Make another status the default first.']
  if (ctx.activeSeriesUsing > 0) {
    const n = ctx.activeSeriesUsing
    return [`${n} repeating ${n === 1 ? 'series uses' : 'series use'} this status. Delete ${n === 1 ? 'it' : 'them'} first.`]
  }
  return []
}

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

export type SessionChoice = 'AM' | 'PM' | 'both'

/** The sessions a choice covers, AM first. */
export function sessionsOf(choice: SessionChoice): Session[] {
  return choice === 'both' ? ['AM', 'PM'] : [choice]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** "Tue 21 Jul" for refusal copy. */
export function shortDateLabel(dateISO: string): string {
  return format(parseISO(dateISO), 'EEE d MMM')
}

/**
 * Issues with a date range (US-01.2.1, US-01.5.3): `to` not before `from`, no
 * date before today, none past the horizon end (Phase 28's setting, FT-01.1).
 */
export function validateAvailabilityRange(input: {
  fromISO: string
  toISO: string
  todayISO: string
  horizonEndISO: string
}): string[] {
  const { fromISO, toISO, todayISO, horizonEndISO } = input
  if (!ISO_DATE.test(fromISO) || !ISO_DATE.test(toISO)) return ['Choose the dates.']
  const issues: string[] = []
  if (toISO < fromISO) issues.push('The end date is before the start date.')
  if (fromISO < todayISO) issues.push('Choose dates from today on. Past sessions cannot be changed.')
  if (toISO > horizonEndISO) issues.push(`The schedule runs to ${shortDateLabel(horizonEndISO)}. Choose dates up to then.`)
  return issues
}

/** Every `{dateISO, session}` in a range, date then session order. */
export function slotsInRange(fromISO: string, toISO: string, sessions: SessionChoice): { dateISO: string; session: Session }[] {
  if (toISO < fromISO) return []
  return enumerateDatesISO(fromISO, toISO).flatMap((dateISO) => sessionsOf(sessions).map((session) => ({ dateISO, session })))
}

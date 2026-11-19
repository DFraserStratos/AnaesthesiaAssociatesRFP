/**
 * The update email (catch-up Phase 35; US-02.3.3, US-02.3.4, DM-35; OQ-69,
 * OQ-46): the pure maths behind the office's "Draft update email".
 *
 * - `pickableChanges` lists the rows of a Booking's (or a List's) history the
 *   admin can pick: each change set, each run of ungrouped edits, and each
 *   change of the List's anaesthetist. Each row carries the email lines its
 *   changes give, from the `EMAIL_FIELDS` allowlist only.
 * - `netPicked` nets the picked rows into one set of lines (first before,
 *   last after; a field changed and changed back drops out and is counted).
 * - `defaultKindFor` picks the kind of email (and so the default template).
 * - `validateTemplate` and `renderTemplate` are the template rules.
 * - `buildUpdateEmail` renders the email and its `mailto:` link, shortened to
 *   fit `MAILTO_MAX_LENGTH`.
 *
 * Nothing here sends anything: the admin's own mail client does (AC "Nothing
 * sent"). Never in an email: the NHI, the date of birth, notes, the procedure
 * text as received, the invoice description, the RVG code, the Contract or its
 * holder, the payer, prices, units, modifiers, prepayment, warnings or pairing
 * preferences. No React, no store imports.
 */

import { changeSetsFor } from './changeSets'
import { inDisplayOrder } from './billing/multiProcedure'
import { sessionText } from './outOfHours'
import { shortDateLabel } from './slotStatus'
import type { ActorRole, AuditEntry, EmailTemplate, UpdateEmailKind, UpdateEmailRecipient } from './types'

export type { EmailTemplate, UpdateEmailKind, UpdateEmailRecipient } from './types'

// ---------------------------------------------------------------------------
// Kinds, placeholders and labels
// ---------------------------------------------------------------------------

/** The kinds in the order the editor and the composer list them. */
export const UPDATE_EMAIL_KINDS: readonly UpdateEmailKind[] = ['anaesthetistChange', 'cancellation', 'correction', 'bookingChange']

export const UPDATE_EMAIL_KIND_LABELS: Record<UpdateEmailKind, string> = {
  anaesthetistChange: 'Change of anaesthetist',
  cancellation: 'Cancellation',
  correction: 'Correction of an error',
  bookingChange: 'Booking change',
}

export const UPDATE_EMAIL_RECIPIENT_LABELS: Record<UpdateEmailRecipient, string> = {
  office: "Surgeon's office",
  hospital: 'Hospital',
  both: 'Both',
}

/** Every placeholder a template may use, in the editor's order. */
export const EMAIL_PLACEHOLDERS = [
  'patient',
  'date',
  'session',
  'hospital',
  'surgeon',
  'anaesthetist',
  'previousAnaesthetist',
  'bookingCount',
  'changes',
  'signature',
] as const
export type EmailPlaceholder = (typeof EMAIL_PLACEHOLDERS)[number]

/** What each placeholder fills in with (the editor's list). */
export const EMAIL_PLACEHOLDER_HINTS: Record<EmailPlaceholder, string> = {
  patient: "The patient's name (blank for a whole List)",
  date: 'The List date, such as Tue 21 Jul',
  session: 'AM, PM or out of hours',
  hospital: 'The hospital',
  surgeon: 'The surgeon',
  anaesthetist: 'The anaesthetist now',
  previousAnaesthetist: 'The anaesthetist before the change',
  bookingCount: 'How many Bookings are on the List',
  changes: 'The picked changes, one line each',
  signature: "The office user's sign-off",
}

/**
 * The one limit on the whole encoded `mailto:` link: longer links are cut
 * short by some mail clients and browsers, so the change lines are shortened
 * to fit.
 */
export const MAILTO_MAX_LENGTH = 2000

// ---------------------------------------------------------------------------
// Email lines and the allowlist
// ---------------------------------------------------------------------------

/**
 * One line of an email: `key` says which field it is (lines with the same key
 * net together), `before`/`after` are display text (null: not set, or for a
 * `collection` line, not there). `text` replaces the whole line (an event,
 * such as a cancellation).
 */
export interface EmailLine {
  key: string
  label: string
  before: string | null
  after: string | null
  /** An item added or removed ("Procedure added: ..."), not a field set or cleared. */
  collection?: boolean
  text?: string
}

/**
 * The allowlist: what an update email may say, with its plain label. Anything
 * else a change touched (the Contract, the payer, prices, the text as
 * received, the invoice description, the RVG code, notes, the NHI ...) gives
 * no line.
 */
export const EMAIL_FIELDS = {
  time: 'Time',
  patientName: 'Patient name',
  procedure: 'Procedure',
  cancellation: 'Cancellation',
  list: 'List',
  anaesthetist: 'Anaesthetist',
  hospital: 'Hospital',
  surgeon: 'Surgeon',
  newBooking: 'New booking',
} as const

/** One change line as the email prints it: "- Time: was 09:00, now 09:30". */
export function emailLineText(line: EmailLine): string {
  if (line.text !== undefined) return `- ${line.text}`
  if (line.collection === true) {
    if (line.before === null) return `- ${line.label} added: ${line.after ?? ''}`
    if (line.after === null) return `- ${line.label} removed: ${line.before}`
  }
  if (line.before === null) return `- ${line.label}: now ${line.after ?? 'not set'}`
  return `- ${line.label}: was ${line.before}, now ${line.after ?? 'not set'}`
}

// ---------------------------------------------------------------------------
// Pickable changes
// ---------------------------------------------------------------------------

export type UpdateEmailSubject = { kind: 'booking'; bookingId: string } | { kind: 'list'; listId: string }

export type PickableKind = 'save' | 'create' | 'cancel' | 'move' | 'match' | 'cover' | 'edit'

/**
 * One row of the picker. `key` is stable across sessions: `cs:<changeSetId>`
 * for a change set, `a:<auditId>` (its oldest entry) for an ungrouped entry or
 * run of edits. `seq` is the row's place in audit order (its newest entry's
 * index), which netting reads.
 */
export interface PickableChange {
  key: string
  atISO: string
  who: string
  role: ActorRole
  kind: PickableKind
  lines: EmailLine[]
  emailable: boolean
  /** Why a row cannot be emailed on its own. */
  reason?: string
  seq: number
}

export const NOTHING_TO_EMAIL_REASON = "Nothing here for the surgeon's office or the hospital"
export const RETURNED_TO_OFFICE_REASON = 'No new anaesthetist yet. Assign the Draft List first.'

/** The plain records `pickableChanges` reads (the store passes its schedule and masters). */
export interface PickLookups {
  bookings: Readonly<Record<string, { id: string; listId: string; patientId: string }>>
  procedures: Readonly<Record<string, { id: string; bookingId: string; isPrimary: boolean; rvgGroupId?: string }>>
  lists: Readonly<Record<string, { id: string; dateISO: string; session: string; hospitalId: string; surgeonId: string; anaesthetistId?: string }>>
  rvgGroups: Readonly<Record<string, { description: string }>>
  anaesthetists: Readonly<Record<string, { name: string }>>
  hospitals: Readonly<Record<string, { name: string }>>
  surgeons: Readonly<Record<string, { name: string }>>
}

/** Actions that change who a List's anaesthetist is (28, 31, 32). */
const LIST_OWNER_ACTIONS: ReadonlySet<string> = new Set(['list.reassign', 'list.ownerMove', 'draftList.detach', 'draftList.assign'])

/** Actions that move one Booking to another List (32a's to a colleague included). */
const BOOKING_MOVE_ACTIONS: ReadonlySet<string> = new Set(['booking.reassign', 'booking.movedToAnaesthetist'])

function rec(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

/** A List owner change that leaves the List with no anaesthetist (back to the office). */
function isReturnToOffice(e: AuditEntry): boolean {
  if (e.action === 'draftList.detach') return true
  return e.action === 'list.ownerMove' && rec(e.after)['route'] === 'office'
}

/** The procedure's email name: its RVG group's description, else "Procedure n". */
function procedureNamer(lookups: PickLookups, bookingId: string | null, audit: readonly AuditEntry[]): (procedureId: string, snapshot?: Record<string, unknown>) => string {
  const current = Object.values(lookups.procedures).filter((p) => p.bookingId === bookingId).sort((a, b) => a.id.localeCompare(b.id))
  const numbers = new Map<string, number>()
  inDisplayOrder(current).forEach((p, i) => numbers.set(p.id, i + 1))
  const gone = new Set<string>()
  for (const e of audit) {
    if (e.entityType !== 'procedure' || numbers.has(e.entityId)) continue
    const owner = rec(e.before)['bookingId'] ?? rec(e.after)['bookingId']
    if (owner === bookingId) gone.add(e.entityId)
  }
  for (const id of [...gone].sort()) numbers.set(id, numbers.size + 1)
  return (procedureId, snapshot) => {
    const groupId = str(snapshot?.['rvgGroupId']) ?? lookups.procedures[procedureId]?.rvgGroupId ?? null
    const group = groupId !== null ? lookups.rvgGroups[groupId] : undefined
    if (group !== undefined) return group.description
    return `Procedure ${numbers.get(procedureId) ?? 1}`
  }
}

function rvgName(lookups: PickLookups, groupId: unknown, fallback: string): string {
  const id = str(groupId)
  return id !== null ? (lookups.rvgGroups[id]?.description ?? fallback) : fallback
}

function anaesthetistName(lookups: PickLookups, id: unknown): string | null {
  const reg = str(id)
  return reg === null ? null : (lookups.anaesthetists[reg]?.name ?? reg)
}

function listWhen(list: { dateISO: string; session: string }): string {
  return `${shortDateLabel(list.dateISO)} ${sessionText(list.session)}`
}

/** The lines a move from one List to another gives: the List, and the anaesthetist, hospital and surgeon where they differ. */
function moveLines(lookups: PickLookups, fromId: unknown, toId: unknown, fromAnaesthetist?: unknown, toAnaesthetist?: unknown): EmailLine[] {
  const from = lookups.lists[String(fromId)]
  const to = lookups.lists[String(toId)]
  if (from === undefined || to === undefined) return []
  const lines: EmailLine[] = []
  const fromWhen = listWhen(from)
  const toWhen = listWhen(to)
  if (fromWhen !== toWhen) lines.push({ key: 'list', label: EMAIL_FIELDS.list, before: fromWhen, after: toWhen })
  const a = anaesthetistName(lookups, fromAnaesthetist ?? from.anaesthetistId)
  const b = anaesthetistName(lookups, toAnaesthetist ?? to.anaesthetistId)
  if (a !== b) lines.push({ key: 'anaesthetist', label: EMAIL_FIELDS.anaesthetist, before: a, after: b })
  if (from.hospitalId !== to.hospitalId) {
    lines.push({ key: 'hospital', label: EMAIL_FIELDS.hospital, before: lookups.hospitals[from.hospitalId]?.name ?? null, after: lookups.hospitals[to.hospitalId]?.name ?? null })
  }
  if (from.surgeonId !== to.surgeonId) {
    lines.push({ key: 'surgeon', label: EMAIL_FIELDS.surgeon, before: lookups.surgeons[from.surgeonId]?.name ?? null, after: lookups.surgeons[to.surgeonId]?.name ?? null })
  }
  return lines
}

interface LineContext {
  lookups: PickLookups
  audit: readonly AuditEntry[]
  index: Map<AuditEntry, number>
  nameProcedure: (procedureId: string, snapshot?: Record<string, unknown>) => string
}

/** The anaesthetist a Draft List had before it went back to the office (for its later assignment's line). */
function anaesthetistBeforeReturn(ctx: LineContext, e: AuditEntry): string | null {
  const at = ctx.index.get(e) ?? -1
  for (let i = at - 1; i >= 0; i--) {
    const prior = ctx.audit[i]!
    if (prior.entityType !== 'list' || prior.entityId !== e.entityId || !LIST_OWNER_ACTIONS.has(prior.action)) continue
    if (isReturnToOffice(prior)) return anaesthetistName(ctx.lookups, rec(prior.before)['anaesthetistId'])
    return null
  }
  return null
}

/** The allowlisted lines one audit entry gives (none for anything outside `EMAIL_FIELDS`). */
function linesOf(ctx: LineContext, e: AuditEntry): EmailLine[] {
  const before = rec(e.before)
  const after = rec(e.after)
  const { lookups } = ctx
  if (e.entityType === 'list' && LIST_OWNER_ACTIONS.has(e.action)) {
    const prev = e.action === 'draftList.assign' ? anaesthetistBeforeReturn(ctx, e) : anaesthetistName(lookups, before['anaesthetistId'])
    const next = anaesthetistName(lookups, after['anaesthetistId'])
    if (prev === next) return []
    return [{ key: 'anaesthetist', label: EMAIL_FIELDS.anaesthetist, before: prev, after: next }]
  }
  if (e.entityType === 'booking') {
    if (e.action === 'booking.cancel') return [{ key: 'cancellation', label: EMAIL_FIELDS.cancellation, before: null, after: 'Cancelled', text: 'This booking is cancelled' }]
    if (e.action === 'booking.create') {
      const lines: EmailLine[] = [{ key: 'newBooking', label: EMAIL_FIELDS.newBooking, before: null, after: 'Added', text: 'New booking on the list' }]
      const time = str(after['scheduledTime'])
      if (time !== null) lines.push({ key: 'time', label: EMAIL_FIELDS.time, before: null, after: time })
      return lines
    }
    if (BOOKING_MOVE_ACTIONS.has(e.action)) {
      return moveLines(lookups, before['listId'], after['listId'], before['anaesthetistId'], after['anaesthetistId'])
    }
    const lines: EmailLine[] = []
    if ('scheduledTime' in before || 'scheduledTime' in after) {
      lines.push({ key: 'time', label: EMAIL_FIELDS.time, before: str(before['scheduledTime']), after: str(after['scheduledTime']) })
    }
    if (('listId' in before || 'listId' in after) && before['listId'] !== after['listId']) lines.push(...moveLines(lookups, before['listId'], after['listId']))
    if ('cancellation' in after && after['cancellation'] !== undefined && after['cancellation'] !== null && (before['cancellation'] === undefined || before['cancellation'] === null)) {
      lines.push({ key: 'cancellation', label: EMAIL_FIELDS.cancellation, before: null, after: 'Cancelled', text: 'This booking is cancelled' })
    }
    return lines
  }
  if (e.entityType === 'patient') {
    if (!('name' in before) && !('name' in after)) return []
    if (e.action === 'patient.create' || e.action === 'patient.reuse') return []
    return [{ key: `patient:${e.entityId}:name`, label: EMAIL_FIELDS.patientName, before: str(before['name']), after: str(after['name']) }]
  }
  if (e.entityType === 'procedure') {
    const key = `procedure:${e.entityId}`
    if (e.action === 'procedure.create') {
      return [{ key, label: EMAIL_FIELDS.procedure, before: null, after: ctx.nameProcedure(e.entityId, after), collection: true }]
    }
    if (e.action === 'procedure.remove') {
      return [{ key, label: EMAIL_FIELDS.procedure, before: ctx.nameProcedure(e.entityId, before), after: null, collection: true }]
    }
    if (!('rvgGroupId' in before) && !('rvgGroupId' in after)) return []
    const fallback = ctx.nameProcedure(e.entityId, {})
    return [{ key, label: EMAIL_FIELDS.procedure, before: rvgName(lookups, before['rvgGroupId'], fallback), after: rvgName(lookups, after['rvgGroupId'], fallback) }]
  }
  return []
}

/** The lines of a run of entries, netted within the run (a run is one gesture). */
function rowLines(ctx: LineContext, entries: readonly AuditEntry[]): EmailLine[] {
  const ordered = [...entries].sort((a, b) => (ctx.index.get(a) ?? 0) - (ctx.index.get(b) ?? 0))
  return netLines(ordered.flatMap((e) => linesOf(ctx, e))).lines
}

const CHANGE_SET_KIND_TO_PICKABLE: Record<string, PickableKind> = {
  save: 'save',
  create: 'create',
  cancel: 'cancel',
  move: 'move',
  listReassign: 'cover',
  match: 'match',
}

/**
 * The row's kind. Only a change of the List's anaesthetist is a cover; a
 * single Booking moved to a colleague (`booking.movedToAnaesthetist`, a `move`
 * change set) is a move, which defaults to a Booking change to the surgeon's
 * office, its line naming the new anaesthetist.
 */
function kindOfEntries(entries: readonly AuditEntry[], changeSetKind: string | null): PickableKind {
  if (entries.some((e) => e.entityType === 'list' && LIST_OWNER_ACTIONS.has(e.action))) return 'cover'
  if (changeSetKind !== null) return CHANGE_SET_KIND_TO_PICKABLE[changeSetKind] ?? 'save'
  if (entries.some((e) => e.action === 'booking.cancel')) return 'cancel'
  if (entries.some((e) => e.action === 'booking.create')) return 'create'
  if (entries.some((e) => BOOKING_MOVE_ACTIONS.has(e.action))) return 'move'
  return 'edit'
}

/** Entries that are never a row of their own: a drafted update email is a record of the picker, not a change to pick. */
const NOT_PICKABLE_ACTIONS: ReadonlySet<string> = new Set(['updateEmail.drafted'])

/** Ungrouped entries that are one gesture: same actor, same minute (`coalesceAudit`'s rule, across fields). */
function sameGesture(a: AuditEntry, b: AuditEntry): boolean {
  return a.who === b.who && a.role === b.role && a.source === b.source && a.atISO === b.atISO
}

/** An entry that is always its own row (an owner change, a move): never coalesced into an edit run. */
function standsAlone(e: AuditEntry): boolean {
  return (e.entityType === 'list' && LIST_OWNER_ACTIONS.has(e.action)) || BOOKING_MOVE_ACTIONS.has(e.action)
}

/** The entries of the given subject's history, in audit order. */
function subjectEntries(audit: readonly AuditEntry[], subject: UpdateEmailSubject, lookups: PickLookups): AuditEntry[] {
  if (subject.kind === 'list') {
    const owner = audit.filter((e) => e.entityType === 'list' && e.entityId === subject.listId && LIST_OWNER_ACTIONS.has(e.action))
    const sets = new Set(owner.map((e) => e.changeSetId).filter((id): id is string => id !== undefined))
    const picked = new Set(owner)
    return audit.filter((e) => picked.has(e) || (e.changeSetId !== undefined && sets.has(e.changeSetId)))
  }
  const { bookingId } = subject
  const booking = lookups.bookings[bookingId]
  const own = (e: AuditEntry): boolean => {
    if (e.entityType === 'booking') return e.entityId === bookingId
    if (e.entityType === 'procedure') {
      const owner = lookups.procedures[e.entityId]?.bookingId ?? rec(e.before)['bookingId'] ?? rec(e.after)['bookingId']
      return owner === bookingId
    }
    return false
  }
  // Where the Booking was, entry by entry: its moves in audit order.
  const moves = audit
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.entityType === 'booking' && e.entityId === bookingId && typeof rec(e.before)['listId'] === 'string' && typeof rec(e.after)['listId'] === 'string' && rec(e.before)['listId'] !== rec(e.after)['listId'])
  const firstIndex = audit.findIndex((e) => e.entityType === 'booking' && e.entityId === bookingId)
  const startList = moves.length > 0 ? String(rec(moves[0]!.e.before)['listId']) : (booking?.listId ?? null)
  const listAt = (index: number): string | null => {
    let at = startList
    for (const m of moves) {
      if (m.i >= index) break
      at = String(rec(m.e.after)['listId'])
    }
    return at
  }
  const sets = new Set<string>()
  const picked = new Set<AuditEntry>()
  audit.forEach((e, i) => {
    let include = own(e)
    if (!include && e.entityType === 'list' && LIST_OWNER_ACTIONS.has(e.action)) {
      include = (firstIndex === -1 || i > firstIndex) && listAt(i) === e.entityId
    }
    // A patient's name change while the Booking is theirs (an ungrouped edit; a save's comes with its change set).
    if (!include && e.entityType === 'patient' && e.changeSetId === undefined && booking !== undefined && e.entityId === booking.patientId) {
      include = firstIndex === -1 || i > firstIndex
    }
    if (include) {
      picked.add(e)
      if (e.changeSetId !== undefined) sets.add(e.changeSetId)
    }
  })
  return audit.filter((e) => !NOT_PICKABLE_ACTIONS.has(e.action) && (picked.has(e) || (e.changeSetId !== undefined && sets.has(e.changeSetId))))
}

/**
 * The rows of a Booking's (or a List's) history the admin can pick for an
 * update email, newest first. Each change set is one row; ungrouped entries
 * by one person in one minute are one "edit" row; each change of the List's
 * anaesthetist (while the Booking was on it) is a "cover" row. A row whose
 * changes are all outside `EMAIL_FIELDS`, or a return to the office on its own
 * (OQ-46), is `emailable: false` with its reason.
 */
export function pickableChanges(audit: readonly AuditEntry[], subject: UpdateEmailSubject, lookups: PickLookups): PickableChange[] {
  const index = new Map<AuditEntry, number>()
  audit.forEach((e, i) => index.set(e, i))
  const entries = subjectEntries(audit, subject, lookups)
  const bookingId = subject.kind === 'booking' ? subject.bookingId : null
  const ctx: LineContext = { lookups, audit, index, nameProcedure: procedureNamer(lookups, bookingId, audit) }
  const groups = changeSetsFor(entries, new Set(entries.map((e) => e.entityId)))

  // Coalesce adjacent ungrouped entries (newest first) that are one gesture.
  const runs: { changeSetId: string | null; kind: string | null; entries: AuditEntry[] }[] = []
  for (const g of groups) {
    const last = runs[runs.length - 1]
    const entry = g.entries[0]!
    if (g.changeSetId === null && last !== undefined && last.changeSetId === null && !standsAlone(entry) && !standsAlone(last.entries[0]!) && sameGesture(last.entries[0]!, entry)) {
      last.entries.push(entry)
      continue
    }
    runs.push({ changeSetId: g.changeSetId, kind: g.kind, entries: [...g.entries] })
  }

  return runs.map((run) => {
    const ordered = [...run.entries].sort((a, b) => (index.get(a) ?? 0) - (index.get(b) ?? 0))
    const oldest = ordered[0]!
    const newest = ordered[ordered.length - 1]!
    const lines = rowLines(ctx, ordered)
    const returnOnly = ordered.some(isReturnToOffice) && !ordered.some((e) => e.action === 'draftList.assign' || (e.entityType === 'list' && LIST_OWNER_ACTIONS.has(e.action) && !isReturnToOffice(e)))
    const emailable = lines.length > 0 && !returnOnly
    const reason = returnOnly ? RETURNED_TO_OFFICE_REASON : lines.length === 0 ? NOTHING_TO_EMAIL_REASON : undefined
    return {
      key: run.changeSetId !== null ? `cs:${run.changeSetId}` : `a:${oldest.id}`,
      atISO: oldest.atISO,
      who: oldest.who,
      role: oldest.role,
      kind: kindOfEntries(ordered, run.kind),
      lines,
      emailable,
      ...(reason !== undefined ? { reason } : {}),
      seq: index.get(newest) ?? 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Netting
// ---------------------------------------------------------------------------

function netLines(lines: readonly EmailLine[]): { lines: EmailLine[]; cancelledOut: number } {
  const byKey = new Map<string, EmailLine>()
  const order: string[] = []
  for (const line of lines) {
    const seen = byKey.get(line.key)
    if (seen === undefined) {
      byKey.set(line.key, { ...line })
      order.push(line.key)
      continue
    }
    byKey.set(line.key, { ...line, before: seen.before })
  }
  const out: EmailLine[] = []
  let cancelledOut = 0
  for (const key of order) {
    const line = byKey.get(key)!
    if (line.text === undefined && line.before === line.after) {
      cancelledOut += 1
      continue
    }
    out.push(line)
  }
  return { lines: out, cancelledOut }
}

/**
 * The picked rows as one set of lines, in audit order: where several rows
 * touch the same field, its first `before` and last `after`; a field that
 * netted back to where it started is dropped and counted. Two cover changes
 * give one line, first anaesthetist to last.
 */
export function netPicked(rows: readonly PickableChange[]): { lines: EmailLine[]; cancelledOut: number } {
  const ordered = [...rows].sort((a, b) => a.seq - b.seq)
  return netLines(ordered.flatMap((r) => r.lines))
}

/** "1 picked change cancelled out and is not listed" (singular and plural). */
export function cancelledOutNote(count: number): string {
  return count === 1 ? '1 picked change cancelled out and is not listed' : `${count} picked changes cancelled out and are not listed`
}

/**
 * The kind of email the picked rows suggest: any cover row is a change of
 * anaesthetist, a cancellation a cancellation, otherwise a booking change.
 * A correction is the admin's choice only.
 */
export function defaultKindFor(picked: readonly PickableChange[]): UpdateEmailKind {
  if (picked.some((r) => r.kind === 'cover')) return 'anaesthetistChange'
  if (picked.some((r) => r.kind === 'cancel' || r.lines.some((l) => l.key === 'cancellation'))) return 'cancellation'
  return 'bookingChange'
}

/** The default template for a kind: the first active one (by id). */
export function defaultTemplateFor(templates: Readonly<Record<string, EmailTemplate>>, kind: UpdateEmailKind): EmailTemplate | undefined {
  return Object.values(templates)
    .filter((t) => t.active && t.kind === kind)
    .sort((a, b) => a.id.localeCompare(b.id))[0]
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface TemplateIssue {
  field: 'name' | 'subject' | 'body'
  message: string
}

const PLACEHOLDER = /\{([^{}]*)\}/g
const KNOWN: ReadonlySet<string> = new Set(EMAIL_PLACEHOLDERS)

function placeholdersIn(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((m) => m[1]!)
}

/**
 * What is wrong with a template, field by field: a blank name, subject or
 * body; an unknown placeholder; a body without `{changes}` (a change of
 * anaesthetist may carry `{previousAnaesthetist}` and `{anaesthetist}`
 * instead). Empty when it is fine.
 */
export function validateTemplate(template: Pick<EmailTemplate, 'name' | 'kind' | 'subject' | 'body'>): TemplateIssue[] {
  const issues: TemplateIssue[] = []
  if (template.name.trim() === '') issues.push({ field: 'name', message: 'Give the template a name.' })
  if (template.subject.trim() === '') issues.push({ field: 'subject', message: 'The subject cannot be empty.' })
  for (const field of ['subject', 'body'] as const) {
    const unknown = [...new Set(placeholdersIn(template[field]).filter((p) => !KNOWN.has(p)))]
    for (const p of unknown) issues.push({ field, message: `{${p}} is not a placeholder. Choose one from the list.` })
  }
  if (template.body.trim() === '') {
    issues.push({ field: 'body', message: 'The body cannot be empty.' })
  } else if (templateLinkLength(template) > MAILTO_MAX_LENGTH - TEMPLATE_LINK_RESERVE) {
    issues.push({ field: 'body', message: 'The body is too long to fit an email link. Shorten it.' })
  } else {
    const used = new Set(placeholdersIn(template.body))
    const coverWords = template.kind === 'anaesthetistChange' && used.has('previousAnaesthetist') && used.has('anaesthetist')
    if (!used.has('changes') && !coverWords) {
      issues.push({
        field: 'body',
        message: template.kind === 'anaesthetistChange'
          ? 'The body needs {changes}, or both {previousAnaesthetist} and {anaesthetist}.'
          : 'The body needs {changes}, where the picked changes go.',
      })
    }
  }
  return issues
}

/**
 * Room a template leaves in the link for the To address, the filled-in
 * placeholders and at least one change line.
 */
export const TEMPLATE_LINK_RESERVE = 400

/** The encoded link a template gives with every placeholder empty and no To. */
function templateLinkLength(template: Pick<EmailTemplate, 'subject' | 'body'>): number {
  return mailtoHref('', renderTemplate(template.subject, {}), crlf(renderTemplate(template.body, {}))).length
}

export const NOTHING_LEFT_TO_EMAIL_REASON = 'The picked changes cancel out. There is nothing to email.'
export const NO_COVER_TO_REPORT_REASON = 'The picked changes of anaesthetist cancel out, so there is no change of anaesthetist to report. Choose another template.'

/**
 * Why the netted pick cannot be emailed with this template, or null: every
 * picked change cancelled out, or the template names the anaesthetist before
 * the change (`{previousAnaesthetist}`) when the picked changes of
 * anaesthetist cancel out (back to the first one), which would print an empty
 * name.
 */
export function nothingToReportReason(template: Pick<EmailTemplate, 'subject' | 'body'>, lines: readonly EmailLine[]): string | null {
  if (lines.length === 0) return NOTHING_LEFT_TO_EMAIL_REASON
  const namesPrevious = [...placeholdersIn(template.subject), ...placeholdersIn(template.body)].includes('previousAnaesthetist')
  if (namesPrevious && !lines.some((l) => l.key === 'anaesthetist')) return NO_COVER_TO_REPORT_REASON
  return null
}

/** Fill a template's placeholders. An unknown or missing one fills in empty, never as braces. */
export function renderTemplate(text: string, values: Partial<Record<EmailPlaceholder, string>>): string {
  return text.replace(PLACEHOLDER, (_m, name: string) => (KNOWN.has(name) ? (values[name as EmailPlaceholder] ?? '') : ''))
}

// ---------------------------------------------------------------------------
// The email
// ---------------------------------------------------------------------------

/** What the template's placeholders fill in with (no patient for a whole List). */
export interface UpdateEmailContext {
  patient?: string
  date: string
  session: string
  hospital: string
  surgeon: string
  anaesthetist: string
  previousAnaesthetist: string
  bookingCount: number
}

/**
 * The context for a subject: the List's date, session, hospital and surgeon,
 * its Booking count, the patient for a Booking, and the anaesthetists from
 * the netted anaesthetist line where there is one (else the List's own).
 */
export function updateEmailContext(input: {
  list: { dateISO: string; session: string; hospitalId: string; surgeonId: string; anaesthetistId?: string }
  lookups: Pick<PickLookups, 'anaesthetists' | 'hospitals' | 'surgeons'>
  bookingCount: number
  patientName?: string
  lines?: readonly EmailLine[]
}): UpdateEmailContext {
  const { list, lookups } = input
  const now = list.anaesthetistId !== undefined ? (lookups.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId) : ''
  const cover = input.lines?.find((l) => l.key === 'anaesthetist')
  return {
    ...(input.patientName !== undefined ? { patient: input.patientName } : {}),
    date: shortDateLabel(list.dateISO),
    session: sessionText(list.session),
    hospital: lookups.hospitals[list.hospitalId]?.name ?? '',
    surgeon: lookups.surgeons[list.surgeonId]?.name ?? '',
    anaesthetist: cover?.after ?? now,
    previousAnaesthetist: cover?.before ?? '',
    bookingCount: input.bookingCount,
  }
}

export interface BuiltUpdateEmail {
  to: string
  subject: string
  body: string
  href: string
  shortened: boolean
  /** Change lines left out to fit the link. */
  omittedCount: number
  /** The whole encoded link's length (`href.length`). */
  length: number
  /**
   * False when the link is still over `MAILTO_MAX_LENGTH` with every change
   * line left out (a very long template): the composer cannot open it.
   */
  fits: boolean
}

/** "This list was shortened to fit an email link. 3 more changes are in the booking record." */
export function shortenedNote(omitted: number): string {
  return omitted === 1
    ? 'This list was shortened to fit an email link. 1 more change is in the booking record.'
    : `This list was shortened to fit an email link. ${omitted} more changes are in the booking record.`
}

/** Plain text with CRLF line breaks (RFC 6068 bodies). */
function crlf(text: string): string {
  return text.replace(/\r\n|\r|\n/g, '\r\n')
}

function encodeTo(to: string): string {
  return to
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a !== '')
    .map((a) => encodeURIComponent(a).replace(/%40/g, '@'))
    .join(',')
}

/** The `mailto:` link: `mailto:?subject=...` when To is empty. */
export function mailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${encodeTo(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Render the update email and its link. The change lines go where the
 * template says `{changes}`; past `MAILTO_MAX_LENGTH` they are dropped from
 * the end, down to none if need be, and the shortened note is added. The
 * template's greeting, context and sign-off are always kept, so a template
 * too long on its own gives `fits: false`.
 */
export function buildUpdateEmail(input: {
  template: Pick<EmailTemplate, 'subject' | 'body'>
  context: UpdateEmailContext
  lines: readonly EmailLine[]
  to: string
  signature: string
}): BuiltUpdateEmail {
  const { template, context, lines, signature } = input
  const to = input.to.trim()
  const values = (changes: string): Record<EmailPlaceholder, string> => ({
    patient: context.patient ?? '',
    date: context.date,
    session: context.session,
    hospital: context.hospital,
    surgeon: context.surgeon,
    anaesthetist: context.anaesthetist,
    previousAnaesthetist: context.previousAnaesthetist,
    bookingCount: String(context.bookingCount),
    changes,
    signature,
  })
  const subject = renderTemplate(template.subject, values('')).replace(/\s+/g, ' ').trim()
  const render = (kept: number): { body: string; href: string } => {
    const shown = lines.slice(0, kept).map(emailLineText)
    const omitted = lines.length - kept
    if (omitted > 0) shown.push('', shortenedNote(omitted))
    const body = crlf(renderTemplate(template.body, values(shown.join('\n'))))
    return { body, href: mailtoHref(to, subject, body) }
  }
  let kept = lines.length
  let built = render(kept)
  while (built.href.length > MAILTO_MAX_LENGTH && kept > 0) {
    kept -= 1
    built = render(kept)
  }
  const omittedCount = lines.length - kept
  const fits = built.href.length <= MAILTO_MAX_LENGTH
  return { to, subject, body: built.body, href: built.href, shortened: omittedCount > 0, omittedCount, length: built.href.length, fits }
}

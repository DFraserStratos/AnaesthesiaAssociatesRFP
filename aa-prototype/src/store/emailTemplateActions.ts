/**
 * The update email templates and the drafted-email record (catch-up Phase 35;
 * US-02.3.3, US-02.3.4, DM-35). Office only, one audited `mutate()` commit
 * each, refusals as data. The template rules are `validateTemplate`
 * (`domain/updateEmail.ts`).
 *
 * - `saveEmailTemplate` edits a template's name, recipient, subject and body.
 * - `addEmailTemplate` adds a template for a kind (active).
 * - `setEmailTemplateActive` retires or restores one; a kind always keeps one
 *   active template.
 * - `recordUpdateEmailDrafted` notes that the office opened an update email in
 *   its mail client: which rows were picked, the template and the kind of
 *   recipient. Never the body or the address, and nothing is sent (AC
 *   "Nothing sent").
 */

import type { EmailTemplate, UpdateEmailKind, UpdateEmailRecipient } from '../domain/types'
import { UPDATE_EMAIL_KIND_LABELS, UPDATE_EMAIL_KINDS, validateTemplate, type UpdateEmailSubject } from '../domain/updateEmail'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

const OFFICE_ONLY = 'Only the office can change the email templates.'
const RECIPIENTS: readonly UpdateEmailRecipient[] = ['office', 'hospital', 'both']

export interface EmailTemplateFields {
  name: string
  recipient: UpdateEmailRecipient
  subject: string
  body: string
}

function tidy(fields: EmailTemplateFields): EmailTemplateFields {
  return { name: fields.name.trim(), recipient: fields.recipient, subject: fields.subject.trim(), body: fields.body.replace(/\r\n?/g, '\n').trimEnd() }
}

function fieldsRefusal(fields: EmailTemplateFields, kind: UpdateEmailKind): Outcome<never> | null {
  if (!RECIPIENTS.includes(fields.recipient)) return refuse('badRecipient', 'Choose who the email goes to.')
  const issues = validateTemplate({ ...fields, kind })
  if (issues.length > 0) return refuse('invalidTemplate', issues[0]!.message, { issues })
  return null
}

/** Edit a template's name, recipient, subject and body. Audited `emailTemplate.update` with the changed fields. */
export function saveEmailTemplate(api: AppStoreApi, actor: Actor, id: string, raw: EmailTemplateFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const existing = api.getState().masters.emailTemplates[id]
  if (existing === undefined) return refuse('notFound', 'Email template not found.')
  const fields = tidy(raw)
  const refused = fieldsRefusal(fields, existing.kind)
  if (refused !== null) return refused
  const before: Record<string, unknown> = {}
  const after: Record<string, unknown> = {}
  for (const k of ['name', 'recipient', 'subject', 'body'] as const) {
    if (existing[k] !== fields[k]) {
      before[k] = existing[k]
      after[k] = fields[k]
    }
  }
  if (Object.keys(after).length === 0) return ok(undefined)
  const next: EmailTemplate = { ...existing, ...fields }
  mutate(api, actor, { entityType: 'emailTemplate', entityId: id, action: 'emailTemplate.update', before, after, stampBookingId: null }, (s) => ({
    masters: { ...s.masters, emailTemplates: { ...s.masters.emailTemplates, [id]: next } },
  }))
  return ok(undefined)
}

/** Add an active template for a kind. Audited `emailTemplate.create`. */
export function addEmailTemplate(api: AppStoreApi, actor: Actor, raw: EmailTemplateFields & { kind: UpdateEmailKind }): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  if (!UPDATE_EMAIL_KINDS.includes(raw.kind)) return refuse('badKind', 'Choose the kind of change.')
  const fields = tidy(raw)
  const refused = fieldsRefusal(fields, raw.kind)
  if (refused !== null) return refused
  let id = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'emailTemplate')
    id = alloc.id
    const template: EmailTemplate = { id, kind: raw.kind, ...fields, active: true }
    metas.push({ entityType: 'emailTemplate', entityId: id, action: 'emailTemplate.create', after: { ...fields, kind: raw.kind, active: true }, stampBookingId: null })
    return { masters: { ...s.masters, emailTemplates: { ...s.masters.emailTemplates, [id]: template } }, counters: alloc.counters }
  })
  return ok({ id })
}

/**
 * Retire (false) or restore (true) a template. Retiring the last active
 * template of a kind is refused: every kind keeps one. Audited
 * `emailTemplate.retire` / `emailTemplate.restore`.
 */
export function setEmailTemplateActive(api: AppStoreApi, actor: Actor, id: string, active: boolean): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const templates = api.getState().masters.emailTemplates
  const existing = templates[id]
  if (existing === undefined) return refuse('notFound', 'Email template not found.')
  if (existing.active === active) return ok(undefined)
  if (!active) {
    const others = Object.values(templates).filter((t) => t.kind === existing.kind && t.active && t.id !== id)
    if (others.length === 0) {
      return refuse('lastActive', `${existing.name} is the only active ${UPDATE_EMAIL_KIND_LABELS[existing.kind]} template. Add or restore another first.`)
    }
  }
  mutate(
    api,
    actor,
    active
      ? { entityType: 'emailTemplate', entityId: id, action: 'emailTemplate.restore', before: { active: false }, after: { active: true }, stampBookingId: null }
      : { entityType: 'emailTemplate', entityId: id, action: 'emailTemplate.retire', before: { active: true }, after: { active: false }, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, emailTemplates: { ...s.masters.emailTemplates, [id]: { ...existing, active } } } }),
  )
  return ok(undefined)
}

export interface UpdateEmailDraftRecord {
  subject: UpdateEmailSubject
  /** The picked rows' keys (`PickableChange.key`). */
  pickedKeys: readonly string[]
  templateId: string
  /** The kind of recipient only, never the address. */
  recipient: UpdateEmailRecipient
}

/**
 * The office opened an update email in its mail client: one audited
 * `updateEmail.drafted` entry on the Booking or List, holding the picked
 * keys, the template and the kind of recipient. Nothing else changes: no
 * "sent" flag, no outbox, no copy of the body or the address.
 */
export function recordUpdateEmailDrafted(api: AppStoreApi, actor: Actor, record: UpdateEmailDraftRecord): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office drafts update emails.')
  const state = api.getState()
  const { subject } = record
  const entity = subject.kind === 'booking'
    ? (state.schedule.bookings[subject.bookingId] !== undefined ? { entityType: 'booking', entityId: subject.bookingId } : null)
    : (state.schedule.lists[subject.listId] !== undefined ? { entityType: 'list', entityId: subject.listId } : null)
  if (entity === null) return refuse('notFound', subject.kind === 'booking' ? 'Booking not found.' : 'List not found.')
  if (state.masters.emailTemplates[record.templateId] === undefined) return refuse('templateNotFound', 'Email template not found.')
  if (!RECIPIENTS.includes(record.recipient)) return refuse('badRecipient', 'Choose who the email goes to.')
  if (record.pickedKeys.length === 0) return refuse('nothingPicked', 'Pick at least one change.')
  mutate(
    api,
    actor,
    {
      ...entity,
      action: 'updateEmail.drafted',
      after: { pickedKeys: [...record.pickedKeys], templateId: record.templateId, recipient: record.recipient },
      stampBookingId: null,
    },
    () => ({}),
  )
  return ok(undefined)
}

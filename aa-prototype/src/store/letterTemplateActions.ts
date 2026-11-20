/**
 * Prepayment letter template maintenance (catch-up Phase 41; US-06.3.6,
 * DM-20). Office only, one audited `mutate()` commit each, refusals as data.
 * The rules are `validateLetterTemplate` (`domain/billing/prepaymentLetter.ts`);
 * here are the master's own: a name not taken within its kind, one default per
 * kind, a default never switched off, and every kind keeping an active one.
 *
 * Kept beside 35's `emailTemplateActions.ts`, not in `mastersActions.ts`, so
 * the reference-data editors stay as Phase 42 left them.
 */

import type { PrepaymentLetterKind, PrepaymentLetterTemplate } from '../domain/types'
import { LETTER_KIND_LABEL, LETTER_KINDS, validateLetterTemplate } from '../domain/billing/prepaymentLetter'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

export const LETTER_TEMPLATE_MESSAGES = {
  officeOnly: 'Only the office maintains the prepayment letters.',
  notFound: 'Letter template not found.',
  badKind: 'Choose what the template is for.',
  nameTaken: (name: string) => `There is already a template called ${name} of this kind.`,
  lastActiveTemplate: (kind: PrepaymentLetterKind) => `This is the only active ${LETTER_KIND_LABEL[kind].toLowerCase()} template. Add or switch on another first.`,
  defaultInactive: 'The default template cannot be switched off. Make another one the default first.',
  defaultMustBeActive: 'Switch the template on before making it the default.',
} as const

export interface LetterTemplateFields {
  name: string
  body: string
}

function tidy(fields: LetterTemplateFields): LetterTemplateFields {
  return { name: fields.name.trim().replace(/\s+/g, ' '), body: fields.body.replace(/\r\n?/g, '\n').trim() }
}

function nameTaken(templates: Readonly<Record<string, PrepaymentLetterTemplate>>, kind: PrepaymentLetterKind, name: string, exceptId?: string): boolean {
  const key = name.toLowerCase()
  return Object.values(templates).some((t) => t.kind === kind && t.id !== exceptId && t.name.toLowerCase() === key)
}

function fieldsRefusal(templates: Readonly<Record<string, PrepaymentLetterTemplate>>, fields: LetterTemplateFields, kind: PrepaymentLetterKind, exceptId?: string): Outcome<never> | null {
  const issue = validateLetterTemplate({ ...fields, kind })
  if (issue !== null) return refuse(issue.code, issue.message, { field: issue.field })
  if (nameTaken(templates, kind, fields.name, exceptId)) return refuse('nameTaken', LETTER_TEMPLATE_MESSAGES.nameTaken(fields.name), { field: 'name' })
  return null
}

/** Add an active template of a kind (not the default). Audited `letterTemplate.create`. */
export function createLetterTemplate(api: AppStoreApi, actor: Actor, raw: LetterTemplateFields & { kind: PrepaymentLetterKind }): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', LETTER_TEMPLATE_MESSAGES.officeOnly)
  if (!LETTER_KINDS.includes(raw.kind)) return refuse('badKind', LETTER_TEMPLATE_MESSAGES.badKind)
  const fields = tidy(raw)
  const refused = fieldsRefusal(api.getState().masters.prepaymentLetterTemplates, fields, raw.kind)
  if (refused !== null) return refused
  let id = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'letterTemplate')
    id = alloc.id
    const template: PrepaymentLetterTemplate = { id, kind: raw.kind, ...fields, isDefault: false, active: true, updatedBy: actor.who, updatedAtISO: clockISO(s.clock) }
    metas.push({ entityType: 'letterTemplate', entityId: id, action: 'letterTemplate.create', after: { name: fields.name, kind: raw.kind, body: fields.body }, stampBookingId: null })
    return { masters: { ...s.masters, prepaymentLetterTemplates: { ...s.masters.prepaymentLetterTemplates, [id]: template } }, counters: alloc.counters }
  })
  return ok({ id })
}

/** Edit a template's name and body (its kind is fixed). Audited `letterTemplate.update` with what changed. A letter already sent keeps its words. */
export function editLetterTemplate(api: AppStoreApi, actor: Actor, id: string, raw: LetterTemplateFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', LETTER_TEMPLATE_MESSAGES.officeOnly)
  const templates = api.getState().masters.prepaymentLetterTemplates
  const existing = templates[id]
  if (existing === undefined) return refuse('notFound', LETTER_TEMPLATE_MESSAGES.notFound)
  const fields = tidy(raw)
  const refused = fieldsRefusal(templates, fields, existing.kind, id)
  if (refused !== null) return refused
  const before: Record<string, unknown> = {}
  const after: Record<string, unknown> = {}
  for (const k of ['name', 'body'] as const) {
    if (existing[k] !== fields[k]) {
      before[k] = existing[k]
      after[k] = fields[k]
    }
  }
  if (Object.keys(after).length === 0) return ok(undefined)
  mutate(api, actor, { entityType: 'letterTemplate', entityId: id, action: 'letterTemplate.update', before, after, stampBookingId: null }, (s) => ({
    masters: { ...s.masters, prepaymentLetterTemplates: { ...s.masters.prepaymentLetterTemplates, [id]: { ...existing, ...fields, updatedBy: actor.who, updatedAtISO: clockISO(s.clock) } } },
  }))
  return ok(undefined)
}

/**
 * Switch a template on (true) or off (false). The default cannot be switched
 * off (`defaultInactive`), and a kind keeps one active template
 * (`lastActiveTemplate`). Audited `letterTemplate.activate` / `.deactivate`.
 */
export function setLetterTemplateActive(api: AppStoreApi, actor: Actor, id: string, active: boolean): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', LETTER_TEMPLATE_MESSAGES.officeOnly)
  const templates = api.getState().masters.prepaymentLetterTemplates
  const existing = templates[id]
  if (existing === undefined) return refuse('notFound', LETTER_TEMPLATE_MESSAGES.notFound)
  if (existing.active === active) return ok(undefined)
  if (!active) {
    if (existing.isDefault) return refuse('defaultInactive', LETTER_TEMPLATE_MESSAGES.defaultInactive)
    if (!Object.values(templates).some((t) => t.kind === existing.kind && t.active && t.id !== id)) return refuse('lastActiveTemplate', LETTER_TEMPLATE_MESSAGES.lastActiveTemplate(existing.kind))
  }
  mutate(
    api,
    actor,
    active
      ? { entityType: 'letterTemplate', entityId: id, action: 'letterTemplate.activate', before: { active: false }, after: { active: true }, stampBookingId: null }
      : { entityType: 'letterTemplate', entityId: id, action: 'letterTemplate.deactivate', before: { active: true }, after: { active: false }, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, prepaymentLetterTemplates: { ...s.masters.prepaymentLetterTemplates, [id]: { ...existing, active, updatedBy: actor.who, updatedAtISO: clockISO(s.clock) } } } }),
  )
  return ok(undefined)
}

/** Make a template its kind's default (one default per kind; it must be active). Audited `letterTemplate.setDefault`, naming the one it replaced. */
export function setDefaultLetterTemplate(api: AppStoreApi, actor: Actor, id: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', LETTER_TEMPLATE_MESSAGES.officeOnly)
  const templates = api.getState().masters.prepaymentLetterTemplates
  const existing = templates[id]
  if (existing === undefined) return refuse('notFound', LETTER_TEMPLATE_MESSAGES.notFound)
  if (existing.isDefault) return ok(undefined)
  if (!existing.active) return refuse('defaultMustBeActive', LETTER_TEMPLATE_MESSAGES.defaultMustBeActive)
  const previous = Object.values(templates).find((t) => t.kind === existing.kind && t.isDefault)
  mutate(
    api,
    actor,
    { entityType: 'letterTemplate', entityId: id, action: 'letterTemplate.setDefault', before: { defaultTemplate: previous?.name ?? null }, after: { defaultTemplate: existing.name }, stampBookingId: null },
    (s) => {
      const next = { ...s.masters.prepaymentLetterTemplates }
      for (const t of Object.values(next)) if (t.kind === existing.kind && t.isDefault) next[t.id] = { ...t, isDefault: false }
      next[id] = { ...existing, isDefault: true, updatedBy: actor.who, updatedAtISO: clockISO(s.clock) }
      return { masters: { ...s.masters, prepaymentLetterTemplates: next } }
    },
  )
  return ok(undefined)
}

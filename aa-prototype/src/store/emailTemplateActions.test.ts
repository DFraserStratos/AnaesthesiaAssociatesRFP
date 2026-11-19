/**
 * The update email templates and the drafted-email record (catch-up Phase 35;
 * US-02.3.3, US-02.3.4), and the update email's recipients
 * (`updateEmailRecipients`, built on `officeAddressFor`; OQ-127, D74).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import type { Actor } from './mutate'
import { addEmailTemplate, recordUpdateEmailDrafted, saveEmailTemplate, setEmailTemplateActive } from './emailTemplateActions'
import { updateEmailRecipients } from './selectors'
import { UPDATE_EMAIL_KINDS, validateTemplate } from '../domain/updateEmail'
import { SEED_ORIGIN_LISTS, SEED_PDF_LIST_SENDER } from '../domain/seed/listOrigins'
import { ANAE } from '../domain/seed/cast'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function store(): BoundAppStore {
  return createAppStore()
}

const FIELDS = { name: 'Correction, short', recipient: 'office' as const, subject: 'Correction: {patient}', body: 'Kia ora,\n{changes}\nNgā mihi,\n{signature}' }

describe('email templates (US-02.3.4)', () => {
  it('seeds four, one active per kind, each valid', () => {
    const templates = Object.values(store().getState().masters.emailTemplates)
    expect(templates.map((t) => t.id)).toEqual(['ET001', 'ET002', 'ET003', 'ET004'])
    for (const kind of UPDATE_EMAIL_KINDS) expect(templates.filter((t) => t.kind === kind && t.active)).toHaveLength(1)
    for (const t of templates) expect(validateTemplate(t)).toEqual([])
  })

  it('edits are audited with only the changed fields; an invalid edit is refused and writes nothing', () => {
    const api = store()
    const before = api.getState().masters.emailTemplates.ET004!
    expect(saveEmailTemplate(api, OFFICE, 'ET004', { ...before, subject: 'Booking changed: {patient}' }).ok).toBe(true)
    expect(api.getState().masters.emailTemplates.ET004!.subject).toBe('Booking changed: {patient}')
    const last = api.getState().audit.at(-1)!
    expect(last).toMatchObject({ action: 'emailTemplate.update', entityType: 'emailTemplate', entityId: 'ET004', who: 'Kirsty W.', before: { subject: before.subject }, after: { subject: 'Booking changed: {patient}' } })

    const auditLength = api.getState().audit.length
    const refused = saveEmailTemplate(api, OFFICE, 'ET004', { ...before, body: 'Hello {unknown}' })
    expect(refused).toMatchObject({ ok: false, code: 'invalidTemplate' })
    expect(api.getState().audit).toHaveLength(auditLength)
    expect(saveEmailTemplate(api, SOUTER, 'ET004', before)).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('adds a template as ET005, and each kind keeps one active template', () => {
    const api = store()
    const added = addEmailTemplate(api, OFFICE, { ...FIELDS, kind: 'correction' })
    expect(added).toEqual({ ok: true, value: { id: 'ET005' } })
    expect(api.getState().masters.emailTemplates.ET005).toMatchObject({ kind: 'correction', active: true, body: FIELDS.body })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'emailTemplate.create', entityId: 'ET005' })

    // Two corrections: either may go, not both.
    expect(setEmailTemplateActive(api, OFFICE, 'ET005', false).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'emailTemplate.retire', before: { active: true }, after: { active: false } })
    const refused = setEmailTemplateActive(api, OFFICE, 'ET003', false)
    expect(refused).toMatchObject({ ok: false, code: 'lastActive' })
    expect(api.getState().masters.emailTemplates.ET003!.active).toBe(true)
    expect(setEmailTemplateActive(api, OFFICE, 'ET005', true).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.action).toBe('emailTemplate.restore')
    expect(setEmailTemplateActive(api, OFFICE, 'ET003', false).ok).toBe(true)

    for (const kind of UPDATE_EMAIL_KINDS) {
      expect(Object.values(api.getState().masters.emailTemplates).some((t) => t.kind === kind && t.active)).toBe(true)
    }
  })
})

describe('recordUpdateEmailDrafted (AC "Nothing sent")', () => {
  it('writes exactly one entry, with the picked keys, template and recipient kind, and nothing else', () => {
    const api = store()
    const bookingId = Object.keys(api.getState().schedule.bookings)[0]!
    const before = api.getState()
    const outcome = recordUpdateEmailDrafted(api, OFFICE, { subject: { kind: 'booking', bookingId }, pickedKeys: ['cs:CS0001'], templateId: 'ET004', recipient: 'office' })
    expect(outcome.ok).toBe(true)
    const after = api.getState()
    expect(after.audit).toHaveLength(before.audit.length + 1)
    expect(after.audit.at(-1)).toMatchObject({
      action: 'updateEmail.drafted',
      entityType: 'booking',
      entityId: bookingId,
      after: { pickedKeys: ['cs:CS0001'], templateId: 'ET004', recipient: 'office' },
    })
    expect(Object.keys(after.audit.at(-1)!.after as object).sort()).toEqual(['pickedKeys', 'recipient', 'templateId'])
    // No other slice changes, and the Booking is not stamped.
    expect(after.schedule).toBe(before.schedule)
    expect(after.masters).toBe(before.masters)
    expect(after.notifications).toBe(before.notifications)
    expect(after.billing).toBe(before.billing)
    const { audit: _a, counters: _c, ...restAfter } = after
    const { audit: _b, counters: _d, ...restBefore } = before
    expect(restAfter).toEqual(restBefore)
  })

  it('is office only, and can be on a List', () => {
    const api = store()
    const listId = SEED_ORIGIN_LISTS.hospital
    expect(recordUpdateEmailDrafted(api, SOUTER, { subject: { kind: 'list', listId }, pickedKeys: ['a:A0001'], templateId: 'ET001', recipient: 'hospital' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(recordUpdateEmailDrafted(api, OFFICE, { subject: { kind: 'list', listId }, pickedKeys: ['a:A0001'], templateId: 'ET001', recipient: 'hospital' }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ entityType: 'list', entityId: listId, action: 'updateEmail.drafted' })
  })
})

describe('updateEmailRecipients (one surgeon-side address, D74)', () => {
  it("a List from a rooms' PDF goes to the address the PDF came from, the office contacts offered", () => {
    const api = store()
    const r = updateEmailRecipients(api.getState(), { kind: 'list', listId: SEED_ORIGIN_LISTS.pdf }, { sendTo: 'office' })
    expect(r.to).toBe(SEED_PDF_LIST_SENDER)
    expect(r.alternatives.length).toBeGreaterThan(0)
    expect(r.alternatives.map((a) => a.email)).not.toContain(SEED_PDF_LIST_SENDER)
    expect(r.reason).toBeUndefined()
  })

  it("a rooms' PDF List with no surgeon on it still goes to the address the PDF came from", () => {
    const api = store()
    const listId = SEED_ORIGIN_LISTS.pdf
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...s.schedule.lists[listId]!, surgeonId: '' } } } }))
    const r = updateEmailRecipients(api.getState(), { kind: 'list', listId }, { sendTo: 'office' })
    expect(r.to).toBe(SEED_PDF_LIST_SENDER)
    expect(r.reason).toBeUndefined()
  })

  it('no sender: the first office contact, the second offered, never both; choosing the second changes only To', () => {
    const api = store()
    const listId = SEED_ORIGIN_LISTS.hospital
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...s.schedule.lists[listId]!, surgeonId: 'S-FORSYTHE' } } } }))
    const booking = Object.values(api.getState().schedule.bookings).find((b) => b.listId === listId)
    const subject = booking !== undefined ? { kind: 'booking' as const, bookingId: booking.id } : { kind: 'list' as const, listId }
    const first = updateEmailRecipients(api.getState(), subject, { sendTo: 'office' })
    expect(first.to).toBe('maree@burnsideent.example')
    expect(first.alternatives).toEqual([{ email: 'nicola@burnsideent.example', label: 'Nicola Holloway' }])
    const second = updateEmailRecipients(api.getState(), subject, { sendTo: 'office', officeEmail: 'nicola@burnsideent.example' })
    expect(second.to).toBe('nicola@burnsideent.example')
    expect(second.alternatives).toEqual([{ email: 'maree@burnsideent.example', label: 'Maree' }])

    const hospital = api.getState().masters.hospitals[api.getState().schedule.lists[listId]!.hospitalId]!.contactEmail!
    expect(updateEmailRecipients(api.getState(), subject, { sendTo: 'hospital' })).toEqual({ to: hospital, alternatives: [] })
    expect(updateEmailRecipients(api.getState(), subject, { sendTo: 'both' }).to).toBe(`maree@burnsideent.example, ${hospital}`)
  })

  it('a surgeon with no office contact: To is empty, with the reason, never the personal contact', () => {
    const api = store()
    const listId = SEED_ORIGIN_LISTS.hospital
    const surgeonId = api.getState().schedule.lists[listId]!.surgeonId
    api.setState((s) => ({ masters: { ...s.masters, surgeons: { ...s.masters.surgeons, [surgeonId]: { ...s.masters.surgeons[surgeonId]!, officeContacts: [] } } } }))
    const r = updateEmailRecipients(api.getState(), { kind: 'list', listId }, { sendTo: 'office' })
    expect(r.to).toBe('')
    expect(r.alternatives).toEqual([])
    expect(r.reason).toBe("No contact email held for Mr Hale's office. To will be left empty.")
    // Both still reaches the hospital, and says only what is missing.
    const both = updateEmailRecipients(api.getState(), { kind: 'list', listId }, { sendTo: 'both' })
    expect(both.to).not.toBe('')
    expect(both.reason).toBe("No contact email held for Mr Hale's office.")
  })

  it('a List with no surgeon gives an empty To and a reason, never a thrown lookup', () => {
    const api = store()
    const listId = SEED_ORIGIN_LISTS.hospital
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...s.schedule.lists[listId]!, surgeonId: '' } } } }))
    expect(updateEmailRecipients(api.getState(), { kind: 'list', listId }, { sendTo: 'office' })).toEqual({ to: '', alternatives: [], reason: 'No surgeon on this List. To will be left empty.' })
    expect(updateEmailRecipients(api.getState(), { kind: 'list', listId: 'L-NOPE' }, { sendTo: 'office' }).to).toBe('')
  })
})

/**
 * Catch-up Phase 40, session 2 (item 12; US-11.3.1, US-11.3.3): the patient
 * record's follow-up log, its Resend (appending to the send history) and
 * clearing a balance warning with a note.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import type { Actor } from './mutate'
import { createBooking } from './bookingActions'
import { warningsForBooking } from './warnings'
import { clearBalanceWarningWithNote, completeFollowUp, logPatientFollowUp, resendInvoiceFromRecord } from './patientActions'
import { followUpsDue, openBalanceWarnings, patientRecordView } from './patientSelectors'
import { advanceClockDays } from './clockActions'
import { ANAE } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const MITCHELL = 'CQY9304'
const SOUTER_FORTE = 'L-34821-2026-11-30-AM'

const unpaidPatientInvoice = (api: AppStoreApi) => patientRecordView(api.getState(), MITCHELL)!.invoices.find((i) => i.countsTowardBalance && i.status === 'unpaid')!

describe('logPatientFollowUp and completeFollowUp', () => {
  it('logs a call, a note and a reminder, newest first on the record, each audited', () => {
    const api = createAppStore()
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'call', text: 'Left a voicemail' }).ok).toBe(true)
    expect(logPatientFollowUp(api, OFFICE, { nhi: 'cqy 9304', kind: 'note', text: 'Will pay Friday' }).ok).toBe(true)
    const today = api.getState().clock.todayISO
    const reminder = logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'Call again', dueDateISO: today })
    expect(reminder.ok).toBe(true)
    const view = patientRecordView(api.getState(), MITCHELL)!
    expect(view.followUps.map((f) => f.kind)).toEqual(['reminder', 'note', 'call'])
    expect(view.followUps[0]).toMatchObject({ by: 'Kirsty W.', dueDateISO: today })
    expect(view.followUps[0]!.id).toMatch(/^FUN\d{4}$/)
    expect(api.getState().audit.filter((a) => a.action === 'patient.followUp')).toHaveLength(3)
    expect(followUpsDue(api.getState()).map((f) => f.text)).toEqual(['Call again'])
  })

  it('refuses an anaesthetist, blank text, a past reminder and a reminder with no day', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    const yesterday = '2026-11-23'
    expect(logPatientFollowUp(api, SOUTER, { nhi: MITCHELL, kind: 'call', text: 'x' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'note', text: '   ' })).toMatchObject({ ok: false, code: 'textRequired' })
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'x', dueDateISO: yesterday })).toMatchObject({ ok: false, code: 'reminderDate' })
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'x' })).toMatchObject({ ok: false, code: 'reminderDate' })
    expect(logPatientFollowUp(api, OFFICE, { nhi: 'ZZZ0000', kind: 'note', text: 'x' })).toMatchObject({ ok: false, code: 'notFound' })
    expect(api.getState().audit.length).toBe(before)
  })

  it('Done ticks an open reminder once; a later reminder is not due until its day', () => {
    const api = createAppStore()
    const today = api.getState().clock.todayISO
    const later = logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'Next week', dueDateISO: '2026-12-01' })
    const now = logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'Today', dueDateISO: today })
    if (!later.ok || !now.ok) throw new Error('not logged')
    expect(followUpsDue(api.getState()).map((f) => f.text)).toEqual(['Today'])
    expect(completeFollowUp(api, SOUTER, now.value.followUpId)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(completeFollowUp(api, OFFICE, now.value.followUpId).ok).toBe(true)
    expect(completeFollowUp(api, OFFICE, now.value.followUpId)).toMatchObject({ ok: false, code: 'alreadyDone' })
    expect(api.getState().patientCare.followUps[now.value.followUpId]).toMatchObject({ doneBy: 'Kirsty W.' })
    expect(api.getState().audit.at(-1)?.action).toBe('patient.followUpDone')
    expect(followUpsDue(api.getState())).toEqual([])
    advanceClockDays(api, 7)
    expect(followUpsDue(api.getState()).map((f) => f.text)).toEqual(['Next week'])
  })
})

describe('Resend from the record', () => {
  it('a second Resend appends to the send history and each logs a resend follow-up', () => {
    const api = createAppStore()
    const row = unpaidPatientInvoice(api)
    const sendsBefore = row.sends.length
    expect(resendInvoiceFromRecord(api, OFFICE, MITCHELL, row.invoiceId).ok).toBe(true)
    expect(resendInvoiceFromRecord(api, OFFICE, MITCHELL, row.invoiceId).ok).toBe(true)
    const after = patientRecordView(api.getState(), MITCHELL)!
    const sends = after.invoices.find((i) => i.invoiceId === row.invoiceId)!.sends
    expect(sends).toHaveLength(sendsBefore + 2)
    const resends = after.followUps.filter((f) => f.kind === 'resend')
    expect(resends).toHaveLength(2)
    expect(resends[0]).toMatchObject({ invoiceId: row.invoiceId, text: `Resent ${row.invoiceNumber} to ${sends.at(-1)!.to}` })
    expect(api.getState().audit.filter((a) => a.action === 'invoice.resend' && a.entityId === row.invoiceId)).toHaveLength(2)
  })

  it('refuses an anaesthetist and writes nothing', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    expect(resendInvoiceFromRecord(api, SOUTER, MITCHELL, unpaidPatientInvoice(api).invoiceId)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(api.getState().audit.length).toBe(before)
  })
})

describe('clearing a balance warning with a note', () => {
  function mitchellWarning() {
    const api = createAppStore()
    const made = createBooking(api, OFFICE, SOUTER_FORTE, { patient: { nhi: MITCHELL, name: 'Sarah Mitchell', dobISO: '1988-08-16' }, sourceText: { text: 'Knee arthroscopy', source: 'phone' } })
    if (!made.ok) throw new Error(made.message)
    const w = warningsForBooking(api.getState(), made.value.bookingId).find((x) => x.ruleId === 'patientBalance')!
    return { api, bookingId: made.value.bookingId, key: w.key }
  }

  it('clears it and logs a note linked by the warning key', () => {
    const { api, bookingId, key } = mitchellWarning()
    expect(clearBalanceWarningWithNote(api, OFFICE, bookingId, key, 'Spoke to Sarah; paying this week').ok).toBe(true)
    expect(openBalanceWarnings(api.getState())).toEqual([])
    const notes = patientRecordView(api.getState(), MITCHELL)!.followUps
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ kind: 'note', warningKey: key, text: 'Spoke to Sarah; paying this week' })
  })

  it('without a note it only clears; an anaesthetist is refused', () => {
    const { api, bookingId, key } = mitchellWarning()
    expect(clearBalanceWarningWithNote(api, SOUTER, bookingId, key, 'x')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(clearBalanceWarningWithNote(api, OFFICE, bookingId, key).ok).toBe(true)
    expect(patientRecordView(api.getState(), MITCHELL)!.followUps).toEqual([])
  })
})

/**
 * Catch-up Phase 40, review fixes: the matching preview leaves out the matched
 * Booking's own invoices, the record's money totals, Resend's limits, pending
 * details merged by field, editPatient's office gate and NHI uniqueness, a
 * real match keeping the sample's stamp, cancelled rows off the waiting list,
 * real reminder dates, one patientByNhi, and createBooking's patient outcome.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { createBooking } from './bookingActions'
import { decideImportRow, importHospitalDownload } from './matchingActions'
import { editPatient, upsertPatient } from './intake'
import { logPatientFollowUp, nhiRequestAddressFor, patientBalancePreview, resendInvoiceFromRecord } from './patientActions'
import { pdfRowIssues } from '../domain/intake/pdfLists'
import { auditNamesFor, formatAuditValue } from '../shared/audit/auditNarrative'
import { patientRecordView, waitingNhiRows } from './patientSelectors'
import { patientByNhi } from './patientLookup'
import { patientBalanceRows } from './patientLedger'
import { clearAllSamples, WARNING_SAMPLES } from './warningSamples'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { assessImportRow } from './matchingSelectors'
import { ANAE, PAT } from '../domain/seed'
import { validNhiOf, effectiveIncoming } from '../domain/intake/matching'
import { HOSPITAL_DOWNLOAD_SAMPLES } from '../domain/intake/hospitalDownloads'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const SOUTER_FORTE = 'L-34821-2026-07-27-AM'
const MITCHELL = { nhi: 'CQY9304', name: 'Sarah Mitchell', dobISO: '1988-04-12' }

describe('bug 1: the matching preview reads the matched Booking', () => {
  it("leaves out the matched Booking's own invoices, as the warning does", () => {
    const s = createAppStore().getState()
    const own = patientRecordView(s, MITCHELL.nhi)!.invoices.find((i) => i.countsTowardBalance && i.status === 'unpaid')!
    expect(patientBalancePreview(s, { patientId: PAT.mitchell }, [{ kind: 'patient' }]).strength).toBe('strong')
    expect(patientBalancePreview(s, { patientId: PAT.mitchell }, [{ kind: 'patient' }], { excludeBookingId: own.bookingId }).strength).toBe('none')
  })
})

describe('bug 2 / quality 8: the record computes its money totals in cents', () => {
  it('billed to the patient is owing less credit held; other payers and the footer come from the view', () => {
    const s = createAppStore().getState()
    const sinclair = patientRecordView(s, s.masters.patients[PAT.sinclair]!.nhi)!
    expect(sinclair.billedToPatient).toMatchObject({ owingTotal: 0, creditHeld: 260, net: -260 })
    const mitchell = patientRecordView(s, MITCHELL.nhi)!
    expect(mitchell.billedToPatient.net).toBe(610)
    const others = mitchell.invoices.filter((i) => !i.countsTowardBalance)
    const otherSum = others.reduce((t, i) => t + Math.round(((i.status === 'credited' ? 0 : i.outstanding) - i.creditHeld) * 100), 0) / 100
    expect(mitchell.otherPayersTotal).toBe(otherSum)
    const footer = mitchell.invoices.reduce((t, i) => t + Math.round((i.status === 'credited' ? 0 : i.outstanding) * 100), 0) / 100
    expect(mitchell.invoicesOutstanding).toBe(footer)
  })
})

describe("bug 3: Resend only a sent, uncredited invoice of this patient", () => {
  it("refuses another patient's invoice in both actions and a credited one", () => {
    const api = createAppStore()
    const s = api.getState()
    const sinclairNhi = s.masters.patients[PAT.sinclair]!.nhi
    const mitchellInvoice = patientBalanceRows(s, PAT.mitchell)[0]!.invoiceId
    const credited = patientRecordView(s, sinclairNhi)!.invoices.find((i) => i.status === 'credited')!
    expect(credited.resendable).toBe(false)
    expect(resendInvoiceFromRecord(api, OFFICE, sinclairNhi, mitchellInvoice)).toMatchObject({ ok: false, code: 'notThisPatient' })
    expect(logPatientFollowUp(api, OFFICE, { nhi: sinclairNhi, kind: 'note', text: 'x', invoiceId: mitchellInvoice })).toMatchObject({ ok: false, code: 'notThisPatient' })
    expect(resendInvoiceFromRecord(api, OFFICE, sinclairNhi, credited.invoiceId)).toMatchObject({ ok: false, code: 'notResendable' })
    for (const row of patientRecordView(s, MITCHELL.nhi)!.invoices) {
      expect(row.resendable).toBe(row.status !== 'credited' && s.billing.invoices[row.invoiceId]?.delivery?.status === 'sent')
    }
  })
})

describe('bug 4: a later arrival merges pending details by field', () => {
  it('a new phone then a new name keeps both for review, the newest value per field', () => {
    const api = createAppStore()
    expect(upsertPatient(api, OFFICE, { ...MITCHELL, phone: '021 111 2222' }).ok).toBe(true)
    expect(upsertPatient(api, OFFICE, { ...MITCHELL, name: 'Sarah Mitchell-Hart' }).ok).toBe(true)
    expect(upsertPatient(api, OFFICE, { ...MITCHELL, phone: '021 333 4444' }).ok).toBe(true)
    const pending = api.getState().masters.patients[PAT.mitchell]!.pendingDetails!
    expect(Object.fromEntries(pending.differences.map((d) => [d.field, d.incoming]))).toEqual({ name: 'Sarah Mitchell-Hart', phone: '021 333 4444' })
  })
})

describe('bugs 5 and 6: editPatient outside a Booking and the NHI correction', () => {
  it('outside a Booking only the office edits', () => {
    const api = createAppStore()
    expect(editPatient(api, SOUTER, PAT.mitchell, { name: 'Changed' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(editPatient(api, OFFICE, PAT.mitchell, { phone: '021 000 0000' }).ok).toBe(true)
  })

  it("refuses an NHI another record holds; its own NHI is fine", () => {
    const api = createAppStore()
    const tuilagiNhi = api.getState().masters.patients[PAT.tuilagi]!.nhi
    expect(editPatient(api, OFFICE, PAT.mitchell, { nhi: tuilagiNhi.toLowerCase() })).toMatchObject({ ok: false, code: 'nhiTaken' })
    expect(editPatient(api, OFFICE, PAT.mitchell, { nhi: MITCHELL.nhi }).ok).toBe(true)
  })
})

describe('bug 7: a real match keeps the stamp a sample made', () => {
  it('after the match the stamp is no longer the sample\'s, so Clear sample warnings leaves it', () => {
    const api = createAppStore()
    for (const sample of HOSPITAL_DOWNLOAD_SAMPLES) importHospitalDownload(api, OFFICE, sample.id)
    const st = api.getState()
    const found = Object.values(st.intake.rows)
      .map((r) => ({ r, a: assessImportRow(st, r.id), f: effectiveIncoming(r) }))
      .find(({ r, a, f }) => r.status === 'open' && a?.match !== undefined && validNhiOf(f) !== undefined && f.hospitalStatus !== 'cancelled' && st.schedule.bookings[a.match.bookingId]?.balanceCheck === undefined)
    expect(found).toBeDefined()
    const bookingId = found!.a!.match!.bookingId
    const sample = WARNING_SAMPLES.find((x) => x.ruleId === 'patientBalance')!
    expect(sample.stage(api, DEMO_TRIGGER_ACTOR, bookingId).ok).toBe(true)
    expect(sample.isStaged(api.getState(), bookingId)).toBe(true)
    const decided = decideImportRow(api, OFFICE, found!.r.id, { kind: 'match', bookingId, fieldsApplied: [] })
    expect(decided.ok ? '' : decided.message).toBe('')
    expect(api.getState().audit.some((a) => a.action === 'booking.balanceCheckStamped' && a.entityId === bookingId)).toBe(true)
    expect(sample.isStaged(api.getState(), bookingId)).toBe(false)
    clearAllSamples(api)
    expect(api.getState().schedule.bookings[bookingId]!.balanceCheck).toBeDefined()
  })
})

describe('bug 8: a cancellation without an NHI is not waiting for one', () => {
  it('drops the cancelled row from the list', () => {
    const api = createAppStore()
    expect(waitingNhiRows(api.getState()).map((r) => r.rowId)).toEqual(['IRS001'])
    api.setState((s) => {
      const row = s.intake.rows['IRS001']!
      return { intake: { ...s.intake, rows: { ...s.intake.rows, IRS001: { ...row, incoming: { ...row.incoming, hospitalStatus: 'cancelled' } } } } }
    })
    expect(waitingNhiRows(api.getState())).toEqual([])
  })
})

describe('bug 10: a reminder needs a real calendar day', () => {
  it.each(['2026-02-30', '2026-13-01', '2027-02-29'])('refuses %s', (day) => {
    const api = createAppStore()
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL.nhi, kind: 'reminder', text: 'x', dueDateISO: day })).toMatchObject({ ok: false, code: 'reminderDate' })
  })
  it('takes a leap day', () => {
    const api = createAppStore()
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL.nhi, kind: 'reminder', text: 'x', dueDateISO: '2028-02-29' }).ok).toBe(true)
  })
})

describe('quality 7 and 9: one patientByNhi; createBooking reports the patient outcome', () => {
  it('normalises case and spaces the one way', () => {
    const s = createAppStore().getState()
    expect(patientByNhi(s, ' cqy 9304 ')?.hiddenInternalId).toBe(PAT.mitchell)
    expect(patientRecordView(s, 'cqy9304')?.patient.name).toBe('Sarah Mitchell')
    expect(patientByNhi(s, '')).toBeUndefined()
  })

  it('reused with differences, and created', () => {
    const api = createAppStore()
    const reused = createBooking(api, OFFICE, SOUTER_FORTE, { patient: { ...MITCHELL, phone: '021 999 8888' }, sourceText: { text: 'x', source: 'phone' } })
    expect(reused.ok && reused.value.patientOutcome).toBe('reused')
    expect(reused.ok && reused.value.pendingDifferences?.map((d) => d.field)).toEqual(['phone'])
    const created = createBooking(api, OFFICE, SOUTER_FORTE, { patient: { nhi: 'ZQE4017', name: 'Tomasz Nowak', dobISO: '1970-01-01' }, sourceText: { text: 'x', source: 'phone' } })
    expect(created.ok && created.value.patientOutcome).toBe('created')
  })
})

describe('checklist fixes', () => {
  it("(a) a rooms' PDF row waiting for an NHI chases the PDF's own sender first", () => {
    const api = createAppStore()
    api.setState((st) => {
      const row = st.intake.rows['IRS001']!
      const batch = st.intake.batches[row.batchId]!
      return {
        intake: {
          ...st.intake,
          rows: { ...st.intake.rows, IRS001: { ...row, source: 'rooms' } },
          batches: { ...st.intake.batches, [row.batchId]: { ...batch, senderEmail: 'leanne.pa@avonsidesurgical.example' } },
        },
      }
    })
    expect(nhiRequestAddressFor(api.getState(), 'IRS001').to).toBe('leanne.pa@avonsidesurgical.example')
  })

  it('(b) a blanked phone or email is not stored as an empty string', () => {
    const api = createAppStore()
    expect(editPatient(api, OFFICE, PAT.mitchell, { phone: '', email: '  ' }).ok).toBe(true)
    const p = api.getState().masters.patients[PAT.mitchell]!
    expect('phone' in p).toBe(false)
    expect('email' in p).toBe(false)
  })

  it('(c) every invoice row names its payer (hospitals, insurers, organisations)', () => {
    const s = createAppStore().getState()
    for (const id of [PAT.mitchell, PAT.tuilagi, PAT.sinclair]) {
      for (const row of patientBalanceRows(s, id)) expect(row.billedToName, row.invoiceNumber).toBeDefined()
    }
  })

  it('(d) details an anaesthetist entered are held as hers, not the office\'s', () => {
    const api = createAppStore()
    const made = createBooking(api, SOUTER, SOUTER_FORTE, { patient: { ...MITCHELL, phone: '021 999 1111' }, sourceText: { text: 'x', source: 'phone' } })
    expect(made.ok).toBe(true)
    expect(api.getState().masters.patients[PAT.mitchell]!.pendingDetails).toMatchObject({ source: 'anaesthetist', by: 'Dr Melanie Souter' })
  })

  it('(f) an audited patient counterparty reads by name and NHI, never the internal id', () => {
    const s = createAppStore().getState()
    const text = formatAuditValue('party', { kind: 'patient', id: PAT.mitchell }, auditNamesFor({ rvgGroups: {}, patients: s.masters.patients }))
    expect(text).toBe('Sarah Mitchell (NHI CQY9304)')
    expect(formatAuditValue('party', { kind: 'patient', id: PAT.mitchell })).not.toContain(PAT.mitchell)
  })

  it('(g) an invalid PDF NHI message has one full stop', () => {
    const [issue] = pdfRowIssues({ asRead: { nhi: 'ZAE0311' }, corrections: [] } as never)
    expect(issue!.message).not.toContain('..')
  })
})

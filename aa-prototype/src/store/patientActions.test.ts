/**
 * Catch-up Phase 40, session 1: the mandatory NHI, the balance check and
 * warning, the anaesthetist's alert, the shared note and the waiting rows.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import type { Actor } from './mutate'
import { createBooking } from './bookingActions'
import { importHospitalDownload } from './matchingActions'
import { clearWarning, warningsForBooking } from './warnings'
import { setProcedurePayer } from './payerActions'
import { resolvePatientDetails, upsertPatient, editPatient } from './intake'
import {
  addNhiToWaitingRow,
  addSharedNote,
  nhiRowPreview,
  patientBalancePreview,
  requestNhiFromOffice,
  setPatientBalanceThreshold,
} from './patientActions'
import { patientRecordView, patientSearch, waitingNhiRows, patientAttentionCount, openBalanceWarnings } from './patientSelectors'
import { proceduresForBooking } from './selectors'
import { balanceAlertForBooking } from '../shared/patients/balanceAlert'
import { advanceClockDays } from './clockActions'
import { ANAE, PAT } from '../domain/seed'
import { NO_NHI_LIST, NO_NHI_NEW_PATIENT_NHI, NO_NHI_RETURNING_NHI } from '../domain/intake/hospitalDownloads'
import { buildNhiIndex } from '../domain/patients'
import { deliverPaymentWebhook } from './paymentActions'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const MORRISON: Actor = { who: 'Dr Kate Morrison', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.morrison }
/** Dr Souter's Mon 27 Jul AM Forte List with Mr Okafor. */
const SOUTER_FORTE = 'L-34821-2026-11-30-AM'

function book(api: AppStoreApi, actor: Actor, patient: { nhi: string; name: string; dobISO: string }, listId = SOUTER_FORTE) {
  const made = createBooking(api, actor, listId, { patient, sourceText: { text: 'Knee arthroscopy', source: 'phone' } })
  if (!made.ok) throw new Error(made.message)
  return made.value.bookingId
}

const MITCHELL = { nhi: 'CQY9304', name: 'Sarah Mitchell', dobISO: '1988-08-16' }
const TUILAGI = { nhi: 'JKL1188', name: 'Losa Tuilagi', dobISO: '1992-06-01' }
const FOSTER_NHI = 'ZAK8873'
const CHEN_NHI = 'ZAE0310'

const balanceOf = (api: AppStoreApi, bookingId: string) => warningsForBooking(api.getState(), bookingId).filter((w) => w.ruleId === 'patientBalance')

describe('the mandatory NHI (D11): createBooking is the one guard', () => {
  it.each([
    ['blank', '', 'nhiRequired'],
    ['invalid', 'ZAE0311', 'invalidNhi'],
  ])('refuses a %s NHI and writes nothing', (_label, nhi, code) => {
    const api = createAppStore()
    const before = api.getState()
    const made = createBooking(api, OFFICE, SOUTER_FORTE, { patient: { nhi, name: 'No One', dobISO: '1980-05-06' }, sourceText: { text: 'x', source: 'phone' } })
    expect(made).toMatchObject({ ok: false, code })
    expect(api.getState().schedule.bookings).toBe(before.schedule.bookings)
    expect(api.getState().masters.patients).toBe(before.masters.patients)
    expect(api.getState().audit.length).toBe(before.audit.length)
  })

  it('an anaesthetist is refused the same way', () => {
    const api = createAppStore()
    expect(createBooking(api, SOUTER, SOUTER_FORTE, { patient: { nhi: '', name: 'X', dobISO: '1980-05-06' }, sourceText: { text: 'x', source: 'anaesthetist' } })).toMatchObject({ ok: false, code: 'nhiRequired' })
  })

  it('every seeded patient has a valid NHI and no NHI is held twice', () => {
    const api = createAppStore()
    const patients = Object.values(api.getState().masters.patients)
    expect(patients.every((p) => typeof p.nhi === 'string' && p.nhi.length === 7)).toBe(true)
    expect(buildNhiIndex(patients).duplicates).toEqual([])
    expect(api.getState().masters.patients[PAT.provisional]!.nhi).toBe('ZAP3016')
  })

  it('Sarah Mitchell re-entered with a new address makes no second record and holds one difference', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().masters.patients).length
    const made = createBooking(api, OFFICE, SOUTER_FORTE, {
      patient: { ...MITCHELL, postalAddress: { line1: '9 Hill Street', city: 'Christchurch', postcode: '8011' } },
      sourceText: { text: 'x', source: 'phone' },
    })
    expect(made.ok).toBe(true)
    expect(Object.keys(api.getState().masters.patients).length).toBe(before)
    const pending = api.getState().masters.patients[PAT.mitchell]!.pendingDetails
    expect(pending?.differences.map((d) => d.field)).toEqual(['address'])
    expect(api.getState().masters.patients[PAT.mitchell]!.postalAddress?.line1).not.toBe('9 Hill Street')
    // The same details again store nothing new.
    const again = upsertPatient(api, OFFICE, MITCHELL)
    expect(again.ok && again.value.pendingDifferences).toBeFalsy()
    // An anaesthetist cannot resolve; the office applies "use incoming".
    expect(resolvePatientDetails(api, SOUTER, PAT.mitchell, { address: 'useIncoming' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(resolvePatientDetails(api, OFFICE, PAT.mitchell, { address: 'useIncoming' }).ok).toBe(true)
    const after = api.getState().masters.patients[PAT.mitchell]!
    expect(after.postalAddress?.line1).toBe('9 Hill Street')
    expect(after.pendingDetails).toBeUndefined()
    expect(resolvePatientDetails(api, OFFICE, PAT.mitchell, {})).toMatchObject({ ok: false, code: 'nothingToReview' })
  })

  it('an ethnicity edit validates, quarantines outside the subset and clears the quarantine', () => {
    const api = createAppStore()
    expect(editPatient(api, OFFICE, PAT.tuilagi, { ethnicityCode: 'abc' })).toMatchObject({ ok: false, code: 'ethnicityInvalid' })
    expect(editPatient(api, OFFICE, PAT.tuilagi, { ethnicityCode: '99999' }).ok).toBe(true)
    expect(api.getState().masters.patients[PAT.tuilagi]!.ethnicityPending?.receivedCode).toBe('99999')
    expect(editPatient(api, OFFICE, PAT.tuilagi, { ethnicityCode: '21111' }).ok).toBe(true)
    const p = api.getState().masters.patients[PAT.tuilagi]!
    expect([p.ethnicityCode, p.ethnicityPending]).toEqual(['21111', undefined])
  })
})

describe('the balance check and the patientBalance warning (US-11.3.2)', () => {
  it('no seeded Booking raises a balance warning', () => {
    const api = createAppStore()
    expect(openBalanceWarnings(api.getState())).toEqual([])
  })

  it('Sarah Mitchell: stamped created, one strong warning on oa07 at 98 days and $610.00', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, MITCHELL)
    expect(api.getState().schedule.bookings[bookingId]!.balanceCheck).toMatchObject({ trigger: 'created' })
    const w = balanceOf(api, bookingId)
    expect(w).toHaveLength(1)
    expect(w[0]).toMatchObject({ kind: 'beforeProcedure', strength: 'strong', text: 'Sarah Mitchell owes $610.00 on 1 invoice, unpaid 98 days (over the 90 day threshold). Follow up before the procedure.' })
    expect(w[0]!.shortText).toBe('This patient owes AA money. The office is following up.')
  })

  it('Losa Tuilagi is mild at 30 days and strong at a threshold of 20; the threshold is office only and 1 to 730', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, TUILAGI)
    expect(balanceOf(api, bookingId).map((w) => [w.strength, w.text])).toEqual([['mild', 'Losa Tuilagi owes $380.00 on 1 invoice, unpaid 30 days (within the 90 day threshold).']])
    expect(setPatientBalanceThreshold(api, SOUTER, 20)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(setPatientBalanceThreshold(api, OFFICE, 0)).toMatchObject({ ok: false, message: 'Enter a whole number of days from 1 to 730.' })
    expect(setPatientBalanceThreshold(api, OFFICE, 12.5)).toMatchObject({ ok: false, code: 'thresholdRange' })
    expect(setPatientBalanceThreshold(api, OFFICE, 20).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.action).toBe('settings.patientBalanceThreshold')
    expect(balanceOf(api, bookingId)[0]!.strength).toBe('strong')
  })

  it('advancing 61 days turns the mild case strong and re-opens a cleared one', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, TUILAGI)
    const w = balanceOf(api, bookingId)[0]!
    expect(clearWarning(api, OFFICE, bookingId, w.key).ok).toBe(true)
    expect(balanceOf(api, bookingId)[0]!.clearance).toBeDefined()
    advanceClockDays(api, 61)
    const after = balanceOf(api, bookingId)[0]!
    expect(after.strength).toBe('strong')
    expect(after.clearance).toBeUndefined()
  })

  it('organisation- and hospital-billed patients raise none; creating as an anaesthetist still stamps', () => {
    const api = createAppStore()
    const foster = api.getState().masters.patients[PAT.foster]!
    const chen = api.getState().masters.patients[PAT.chen]!
    expect([foster.nhi, chen.nhi]).toEqual([FOSTER_NHI, CHEN_NHI])
    expect(balanceOf(api, book(api, OFFICE, { nhi: foster.nhi, name: foster.name, dobISO: foster.dobISO }))).toEqual([])
    expect(balanceOf(api, book(api, OFFICE, { nhi: chen.nhi, name: chen.name, dobISO: chen.dobISO }))).toEqual([])
    const byAnaesthetist = book(api, SOUTER, MITCHELL)
    expect(api.getState().schedule.bookings[byAnaesthetist]!.balanceCheck?.trigger).toBe('created')
    expect(balanceOf(api, byAnaesthetist)).toHaveLength(1)
  })

  it('a guardian payer on every Procedure removes it, a patient-paid Procedure keeps it, the patient restores it', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, MITCHELL)
    const [p] = proceduresForBooking(api.getState(), bookingId)
    const guardian = { kind: 'other' as const, name: 'Pat Mitchell', relationship: 'Parent', email: 'pat@example.net' }
    expect(setProcedurePayer(api, OFFICE, p!.id, guardian).ok).toBe(true)
    expect(balanceOf(api, bookingId)).toEqual([])
    expect(setProcedurePayer(api, OFFICE, p!.id, { kind: 'patient' }).ok).toBe(true)
    expect(balanceOf(api, bookingId)).toHaveLength(1)
  })

  it('paying her patient-billed 98-day invoice removes the warning', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, MITCHELL)
    const owed = Object.values(api.getState().billing.ledger).find((pair) => pair.kind === 'procedure' && pair.receivable.counterparty.kind === 'patient' && pair.patientId === PAT.mitchell && pair.receivable.amount === 610)!
    expect(owed.kind === 'procedure' && deliverPaymentWebhook(api, { accRecId: owed.receivable.xeroAccRecId!, amount: 610, idempotencyKey: 'TEST-HS01' }).ok).toBe(true)
    expect(balanceOf(api, bookingId)).toEqual([])
  })

  it('the office preview reads the form\'s payers and never stops the save', () => {
    const api = createAppStore()
    expect(patientBalancePreview(api.getState(), { nhi: 'CQY9304' }, [{ kind: 'patient' }])).toMatchObject({ strength: 'strong' })
    expect(patientBalancePreview(api.getState(), { nhi: 'CQY9304' }, [{ kind: 'other' }])).toEqual({ strength: 'none' })
    expect(patientBalancePreview(api.getState(), { patientId: PAT.tuilagi }, [{ kind: 'patient' }])).toMatchObject({ strength: 'mild' })
  })
})

describe('the anaesthetist\'s alert (no name, no amount; not hidden by the office\'s Clear)', () => {
  it('strong for Mitchell on Souter\'s List, still strong after the office clears it; none for another anaesthetist', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, MITCHELL)
    const alert = balanceAlertForBooking(api.getState(), bookingId, ANAE.souter)
    expect(alert).toEqual({ strength: 'strong', text: 'This patient owes AA money. The office is following up.' })
    expect(alert.text).not.toMatch(/\$|Mitchell/)
    expect(clearWarning(api, OFFICE, bookingId, balanceOf(api, bookingId)[0]!.key).ok).toBe(true)
    expect(balanceAlertForBooking(api.getState(), bookingId, ANAE.souter).strength).toBe('strong')
    expect(balanceAlertForBooking(api.getState(), bookingId, MORRISON.anaesthetistId)).toEqual({ strength: 'none' })
    const tuilagi = book(api, OFFICE, TUILAGI)
    expect(balanceAlertForBooking(api.getState(), tuilagi, ANAE.souter).strength).toBe('mild')
  })
})

describe('the shared note (US-11.3.3)', () => {
  it('a note by Dr Souter on her Booking and one by the office on her List show to the other side, in order', () => {
    const api = createAppStore()
    const bookingId = book(api, OFFICE, TUILAGI)
    expect(addSharedNote(api, SOUTER, { bookingId }, 'Patient asked about payment options.').ok).toBe(true)
    expect(addSharedNote(api, OFFICE, { listId: SOUTER_FORTE }, 'Theatre 2 today.').ok).toBe(true)
    expect(addSharedNote(api, OFFICE, { bookingId }, 'Called, will pay Friday.').ok).toBe(true)
    const b = api.getState().schedule.bookings[bookingId]!
    expect(b.noteLog?.map((n) => [n.text, n.by])).toEqual([
      ['Patient asked about payment options.', 'Dr Melanie Souter'],
      ['Called, will pay Friday.', 'Kirsty W.'],
    ])
    expect(api.getState().schedule.lists[SOUTER_FORTE]!.noteLog?.[0]).toMatchObject({ text: 'Theatre 2 today.', by: 'Kirsty W.' })
    expect(api.getState().audit.at(-1)?.action).toBe('note.added')
  })

  it('refuses a blank note and an anaesthetist on another\'s List', () => {
    const api = createAppStore()
    expect(addSharedNote(api, OFFICE, { listId: SOUTER_FORTE }, '   ')).toMatchObject({ ok: false, code: 'noteRequired' })
    expect(addSharedNote(api, MORRISON, { listId: SOUTER_FORTE }, 'Hi')).toMatchObject({ ok: false, code: 'notOwnList' })
    expect(addSharedNote(api, OFFICE, { listId: SOUTER_FORTE }, 'x'.repeat(501))).toMatchObject({ ok: false, code: 'noteTooLong' })
  })
})

describe('waiting rows: add the NHI, ask the one address (US-11.1.5)', () => {
  function staged() {
    const api = createAppStore()
    const imported = importHospitalDownload(api, OFFICE, NO_NHI_LIST.id)
    if (!imported.ok) throw new Error(imported.message)
    // The seed's own waiting row (33a's IRS001, Mere Tipene) stays beside the sample's two.
    const rows = waitingNhiRows(api.getState()).filter((r) => r.rowId !== 'IRS001')
    return { api, rows }
  }

  it('lists both rows by date, the close one urgent, each with one address to chase', () => {
    const { rows } = staged()
    expect(rows.map((r) => [r.patientName, r.dateISO, r.urgency])).toEqual([
      ['Aroha Ngata', '2026-11-26', 'urgent'],
      ['Losa Tuilagi', '2026-11-30', 'normal'],
    ])
    for (const r of rows) expect(r.chase.to.includes(',')).toBe(false)
  })

  it('no patient exists while a row waits; adding a new NHI makes exactly one', () => {
    const { api, rows } = staged()
    const before = Object.keys(api.getState().masters.patients).length
    const row = rows.find((r) => r.patientName === 'Aroha Ngata')!
    expect(Object.keys(api.getState().masters.patients).length).toBe(before)
    const added = addNhiToWaitingRow(api, OFFICE, row.rowId, NO_NHI_NEW_PATIENT_NHI)
    expect(added.ok).toBe(true)
    expect(Object.values(api.getState().masters.patients).filter((p) => p.nhi === NO_NHI_NEW_PATIENT_NHI)).toHaveLength(1)
    expect(waitingNhiRows(api.getState()).map((r) => r.rowId)).not.toContain(row.rowId)
  })

  it('Tuilagi\'s existing NHI leaves one patient; her Booking takes the stub\'s place and raises the mild warning', () => {
    const { api, rows } = staged()
    const row = rows.find((r) => r.patientName === 'Losa Tuilagi')!
    expect(nhiRowPreview(api.getState(), row.rowId, NO_NHI_RETURNING_NHI).existing?.name).toBe('Losa Tuilagi')
    expect(nhiRowPreview(api.getState(), row.rowId, 'ZAE0311').invalidReason).toBeDefined()
    const added = addNhiToWaitingRow(api, OFFICE, row.rowId, NO_NHI_RETURNING_NHI)
    expect(added).toMatchObject({ ok: true, value: { kind: 'resolved' } })
    expect(Object.values(api.getState().masters.patients).filter((p) => p.nhi === NO_NHI_RETURNING_NHI)).toHaveLength(1)
    if (added.ok && added.value.kind === 'resolved') {
      expect(balanceOf(api, added.value.bookingId).map((w) => w.strength)).toEqual(['mild'])
    }
  })

  it('refuses an invalid NHI (validateNhi\'s reason), a second add and an anaesthetist', () => {
    const { api, rows } = staged()
    const row = rows[0]!
    expect(addNhiToWaitingRow(api, SOUTER, row.rowId, NO_NHI_NEW_PATIENT_NHI)).toMatchObject({ ok: false, message: 'The office adds the NHI.' })
    expect(addNhiToWaitingRow(api, OFFICE, row.rowId, 'ZAE0311')).toMatchObject({ ok: false, message: 'The check digit does not match.' })
    expect(addNhiToWaitingRow(api, OFFICE, row.rowId, NO_NHI_NEW_PATIENT_NHI).ok).toBe(true)
    expect(addNhiToWaitingRow(api, OFFICE, row.rowId, NO_NHI_NEW_PATIENT_NHI).ok).toBe(false)
  })

  it('the request carries no DOB or NHI, goes to one address and is audited', () => {
    const { api, rows } = staged()
    const row = rows.find((r) => r.patientName === 'Losa Tuilagi')!
    const asked = requestNhiFromOffice(api, OFFICE, row.rowId)
    expect(asked.ok).toBe(true)
    if (!asked.ok) return
    const body = decodeURIComponent(asked.value.href)
    expect(body).toContain('NHI needed: Losa Tuilagi')
    expect(body).not.toContain('1992')
    expect(body).not.toMatch(/[A-HJ-NP-Z]{3}\d{4}/)
    expect(asked.value.to.includes(',')).toBe(false)
    expect(api.getState().audit.at(-1)?.action).toBe('importRow.nhiRequested')
    expect(waitingNhiRows(api.getState()).find((r) => r.rowId === row.rowId)?.requestedAtISO).toBeDefined()
    expect(requestNhiFromOffice(api, SOUTER, row.rowId).ok).toBe(false)
  })
})

describe('patient selectors', () => {
  it('search by name, normalised NHI and DOB; no internal id in the rows', () => {
    const api = createAppStore()
    const s = api.getState()
    expect(patientSearch(s, 'mitchell').map((r) => r.nhi)).toContain('CQY9304')
    expect(patientSearch(s, 'cqy 9304').map((r) => r.name)).toEqual(['Sarah Mitchell'])
    expect(patientSearch(s, '16/08/1988').map((r) => r.name)).toContain('Sarah Mitchell')
    expect(patientSearch(s, '1988-08-16').map((r) => r.name)).toContain('Sarah Mitchell')
    expect(JSON.stringify(patientSearch(s, 'mitchell'))).not.toContain('PT0005')
  })

  it('Sarah Mitchell\'s record: two anaesthetists, billed to her $610.00 strong, and her patient-centric balance', () => {
    const api = createAppStore()
    const view = patientRecordView(api.getState(), 'CQY9304')!
    const anaesthetists = new Set(view.invoices.map((i) => i.anaesthetist))
    expect(anaesthetists.size).toBeGreaterThanOrEqual(2)
    expect(view.billedToPatient).toMatchObject({ owingTotal: 610, owingCount: 1, oldestAgeDays: 98, strength: 'strong' })
    const sum = view.invoices.reduce((t, i) => t + (i.status === 'credited' ? 0 : i.outstanding) - i.creditHeld, 0)
    expect(Math.round(view.balance.outstandingTotal * 100)).toBe(Math.round(sum * 100))
  })

  it('the badge adds the waiting rows', () => {
    const api = createAppStore()
    const base = patientAttentionCount(api.getState())
    importHospitalDownload(api, OFFICE, NO_NHI_LIST.id)
    expect(patientAttentionCount(api.getState())).toBe(base + 2)
    expect(waitingNhiRows(createAppStore().getState()).map((r) => r.rowId)).toEqual(['IRS001'])
  })
})

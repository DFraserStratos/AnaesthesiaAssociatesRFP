/**
 * Build plan Phase 57 (DM-10; US-11.3.1, US-11.3.3): one row per patient needing the office, its
 * reasons on it; the People badge is the number of rows; the Patients list's filters, uncapped.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { createBooking } from './bookingActions'
import type { Actor } from './mutate'
import { clearBalanceWarningWithNote, completeFollowUp, logPatientFollowUp } from './patientActions'
import { upsertPatient, resolvePatientDetails } from './intake'
import { openBalanceWarnings, patientAttentionCount, patientList, patientsNeedingOffice, PATIENT_SEARCH_UPCOMING_DAYS } from './patientSelectors'
import { stageNoNhiList } from '../test/intakeSamples'
import { addDaysISO } from '../domain/clock'
import { daysBetween } from '../domain/dateDays'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const MITCHELL = 'CQY9304'

const SOUTER_FORTE = 'L-34821-2026-11-30-AM'

/** A Booking for a patient on Dr Souter's Forte List: it raises the patient's balance warning, if any. */
function book(api: ReturnType<typeof createAppStore>, nhi: string) {
  const p = Object.values(api.getState().masters.patients).find((x) => x.nhi === nhi)!
  const made = createBooking(api, OFFICE, SOUTER_FORTE, { patient: { nhi, name: p.name, dobISO: p.dobISO }, sourceText: { text: 'Knee arthroscopy', source: 'phone' } })
  if (!made.ok) throw new Error(made.message)
  return made.value.bookingId
}

/** Sarah Mitchell (strong) and Heather Sinclair (mild, in credit) booked, so each has a balance warning. */
function withWarnings() {
  const api = createAppStore()
  const sinclair = Object.values(api.getState().masters.patients).find((p) => p.name === 'Heather Sinclair')!
  book(api, MITCHELL)
  book(api, sinclair.nhi)
  return { api, sinclairNhi: sinclair.nhi }
}

const rowOf = (api: ReturnType<typeof createAppStore>, nhi: string) => patientsNeedingOffice(api.getState()).find((r) => r.nhi === nhi)

describe('patientsNeedingOffice', () => {
  it('one row per patient, its reasons on it; the count is the rows, mild warnings included', () => {
    const { api, sinclairNhi } = withWarnings()
    const rows = patientsNeedingOffice(api.getState())
    expect(new Set(rows.map((r) => r.nhi)).size).toBe(rows.length)
    expect(rows.every((r) => r.reasons.length > 0)).toBe(true)
    expect(patientAttentionCount(api.getState())).toBe(rows.length)
    // Every patient with an open balance warning, mild or strong, is on the list.
    const warned = new Set(openBalanceWarnings(api.getState()).map((w) => api.getState().masters.patients[w.patientId]?.nhi))
    for (const nhi of warned) expect(rows.some((r) => r.nhi === nhi)).toBe(true)
    expect(rowOf(api, MITCHELL)?.reasons[0]).toMatchObject({ kind: 'balance', strength: 'strong' })
    const mild = rowOf(api, sinclairNhi)?.reasons.find((r) => r.kind === 'balance')
    expect(mild).toMatchObject({ kind: 'balance', strength: 'mild' })
    expect(JSON.stringify(rows)).not.toMatch(/PT0\d/)
  })

  it('a balance warning and a due reminder are one row with two reasons; a reminder for tomorrow is no reason', () => {
    const { api } = withWarnings()
    const today = api.getState().clock.todayISO
    const before = patientAttentionCount(api.getState())
    const tomorrow = addDaysISO(today, 1)
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'Later', dueDateISO: tomorrow }).ok).toBe(true)
    expect(rowOf(api, MITCHELL)!.reasons.map((r) => r.kind)).toEqual(['balance'])
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'Call about the invoice', dueDateISO: today }).ok).toBe(true)
    expect(logPatientFollowUp(api, OFFICE, { nhi: MITCHELL, kind: 'reminder', text: 'Second reminder', dueDateISO: today }).ok).toBe(true)
    const row = rowOf(api, MITCHELL)!
    expect(row.reasons.map((r) => r.kind)).toEqual(['balance', 'followUpDue'])
    expect(row.reasons[1]).toMatchObject({ kind: 'followUpDue', dueDateISO: today, more: 1 })
    expect(patientAttentionCount(api.getState())).toBe(before)
  })

  it('a patient whose only reason is a due reminder leaves when it is done, and the count drops by one', () => {
    const api = createAppStore()
    const today = api.getState().clock.todayISO
    const quiet = patientList(api.getState(), 'all', '').rows.find((r) => r.reasons.length === 0)!
    const before = patientAttentionCount(api.getState())
    const logged = logPatientFollowUp(api, OFFICE, { nhi: quiet.nhi, kind: 'reminder', text: 'Ring back', dueDateISO: today })
    expect(logged.ok).toBe(true)
    expect(rowOf(api, quiet.nhi)?.reasons).toEqual([expect.objectContaining({ kind: 'followUpDue' })])
    expect(patientAttentionCount(api.getState())).toBe(before + 1)
    const id = Object.values(api.getState().patientCare.followUps).find((f) => f.text === 'Ring back')!.id
    expect(completeFollowUp(api, OFFICE, id).ok).toBe(true)
    expect(rowOf(api, quiet.nhi)).toBeUndefined()
    expect(patientAttentionCount(api.getState())).toBe(before)
  })

  it('held details are a reason naming the fields; Keep clears it', () => {
    const api = createAppStore()
    const quiet = patientList(api.getState(), 'all', '').rows.find((r) => r.reasons.length === 0 && r.dobISO !== '')!
    const patient = Object.values(api.getState().masters.patients).find((p) => p.nhi === quiet.nhi)!
    const res = upsertPatient(api, OFFICE, { nhi: patient.nhi, name: patient.name, dobISO: patient.dobISO, phone: '021 999 0000', detailsSource: 'hospital' })
    expect(res.ok).toBe(true)
    expect(rowOf(api, patient.nhi)?.reasons).toEqual([expect.objectContaining({ kind: 'detailsDiffer', fields: ['phone'], source: 'hospital' })])
    expect(resolvePatientDetails(api, OFFICE, patient.hiddenInternalId, {}).ok).toBe(true)
    expect(rowOf(api, patient.nhi)).toBeUndefined()
  })

  it('strong warnings on two Bookings are one balance reason; clearing both takes the patient off', () => {
    const { api } = withWarnings()
    book(api, MITCHELL)
    const mine = openBalanceWarnings(api.getState()).filter((w) => api.getState().masters.patients[w.patientId]?.nhi === MITCHELL)
    expect(mine.length).toBe(2)
    expect(rowOf(api, MITCHELL)!.reasons).toEqual([expect.objectContaining({ kind: 'balance', strength: 'strong', net: 610 })])
    const before = patientAttentionCount(api.getState())
    for (const w of mine) expect(clearBalanceWarningWithNote(api, OFFICE, w.bookingId, w.warning.key, 'Agreed a plan').ok).toBe(true)
    expect(rowOf(api, MITCHELL)).toBeUndefined()
    expect(patientAttentionCount(api.getState())).toBe(before - 1)
  })

  it('counts no row waiting for an NHI', () => {
    const api = createAppStore()
    const before = patientAttentionCount(api.getState())
    stageNoNhiList(api)
    expect(patientAttentionCount(api.getState())).toBe(before)
  })
})

describe('patientList', () => {
  it('Coming up: a Booking within 14 days, nearest first; no follow-up patients appended', () => {
    const api = createAppStore()
    const s = api.getState()
    const { rows } = patientList(s, 'comingUp', '')
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(daysBetween(s.clock.todayISO, r.nextBooking!.dateISO)).toBeLessThanOrEqual(PATIENT_SEARCH_UPCOMING_DAYS)
    const dates = rows.map((r) => r.nextBooking!.dateISO)
    expect([...dates].sort()).toEqual(dates)
  })

  it('All is uncapped, by name; a search narrows the chosen filter and reports the All count', () => {
    const api = createAppStore()
    const s = api.getState()
    const all = patientList(s, 'all', '')
    expect(all.rows.length).toBe(Object.keys(s.masters.patients).length)
    const names = all.rows.map((r) => r.name)
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names)
    const followUp = patientList(s, 'followUp', 'mitchell')
    expect(followUp.rows).toEqual([])
    expect(followUp.allCount).toBeGreaterThanOrEqual(1)
    const warned = withWarnings().api.getState()
    expect(patientList(warned, 'followUp', 'mitchell').rows.map((r) => r.nhi)).toEqual([MITCHELL])
    const none = patientList(s, 'followUp', 'zzzz-nobody')
    expect(none).toEqual({ rows: [], allCount: 0 })
  })

  it('returns more than 50 rows for a broad query', () => {
    const api = createAppStore()
    const s = api.getState()
    const broad = patientList(s, 'all', '')
    if (Object.keys(s.masters.patients).length > 50) expect(broad.rows.length).toBeGreaterThan(50)
  })
})


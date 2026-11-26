/**
 * Catch-up Phase 33: the matching screen's store actions against the real seed
 * (US-02.1.1 to US-02.1.4, FT-02.5). The sample files' targets are pinned in
 * `matchingFixtures.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { correctImportRow, decideImportRow, stageImportRows } from './matchingActions'
import { receiveHospitalBatch, receiveMailboxPdf } from './intakeIngest'
import { assessImportRow, matchingAttentionCount } from './matchingSelectors'
import { needsInvoiceDestinationBookings, proceduresForBooking } from './selectors'
import { SX_NO_NHI_TYPED, FORTE_CORRECTED_NHI, FORTE_ROOMS_PDF, HOSPITAL_DOWNLOAD_SAMPLES, SAMPLE_STG, SARAH_UPDATE_WORDING, FOSTER_HOSPITAL_WORDING } from '../domain/intake'
import { receiveSample } from '../test/intakeSamples'
import { setInvoiceDescription } from './procedureTextActions'
import { warningsForBooking } from './warnings'

function fresh(): AppStoreApi {
  return createAppStore()
}

/** A connected hospital's sample sent by its feed (Phase 68: no import); its row ids in file order. */
function imported(api: AppStoreApi, sampleId: string): string[] {
  return receiveSample(api, HOSPITAL_DOWNLOAD_SAMPLES.find((s) => s.id === sampleId)!).rowIds
}

/** Forte Health's List by PDF to the rooms' mailbox (D125); its row ids in PDF order. */
function forteByPdf(api: AppStoreApi): string[] {
  const res = receiveMailboxPdf(api, FORTE_ROOMS_PDF)
  if (!res.ok) throw new Error(res.message)
  return res.value.rowIds
}

function scheduleOf(api: AppStoreApi) {
  const s = api.getState()
  return JSON.stringify({ schedule: s.schedule, patients: s.masters.patients })
}

describe('import (US-02.1.1)', () => {
  it('stages the rows, applies nothing; a re-send skips the open rows (a corrected one included) and stages the decided one again (DM-21)', () => {
    const api = fresh()
    const before = scheduleOf(api)
    const batchesBefore = Object.keys(api.getState().intake.batches).length
    const send = () => receiveHospitalBatch(api, SAMPLE_STG.hospitalId, SAMPLE_STG.label, SAMPLE_STG.rows, { sampleId: SAMPLE_STG.id })
    const res = send()
    expect(res.ok && res.value.rowIds).toHaveLength(5)
    expect(scheduleOf(api)).toBe(before)
    // D125's unit: the file's three Lists, each once, plus the seed's rooms PDF List and its row waiting for an NHI.
    expect(matchingAttentionCount(api.getState())).toBe(5)
    const rows = api.getState().intake.batches[res.ok ? res.value.batchId : '']!.rowIds
    expect(decideImportRow(api, OFFICE_ACTOR, rows[1]!, { kind: 'reject', reason: 'Duplicate of another row' }).ok).toBe(true)
    expect(correctImportRow(api, OFFICE_ACTOR, rows[0]!, { scheduledTime: '08:45' }).ok).toBe(true)
    const again = send()
    expect(again.ok && again.value.rowIds.map((id) => api.getState().intake.rows[id]!.incoming.patient.name)).toEqual([SAMPLE_STG.rows[1]!.patient.name])
    expect(Object.keys(api.getState().intake.batches)).toHaveLength(batchesBefore + 2)
  })
  it('refuses a hospital that is not connected and an unknown hospital', () => {
    const api = fresh()
    expect(receiveHospitalBatch(api, 'H-FORTE', 'x', SAMPLE_STG.rows.map((r) => ({ ...r, hospitalId: 'H-FORTE' })))).toMatchObject({ ok: false, code: 'notConnected' })
    expect(receiveHospitalBatch(api, 'H-NOPE', 'x', SAMPLE_STG.rows)).toMatchObject({ ok: false, code: 'notFound' })
  })
  it('audits the batch and each row', () => {
    const api = fresh()
    imported(api, 'SAMPLE_SX')
    const actions = api.getState().audit.map((a) => a.action)
    expect(actions.filter((a) => a === 'importBatch.create')).toHaveLength(1)
    expect(actions.filter((a) => a === 'importRow.receive')).toHaveLength(5)
  })
})

describe('corrections', () => {
  it('the wording is kept as received; an invalid NHI is refused; a valid one releases a waiting row', () => {
    const api = fresh()
    const rows = imported(api, 'SAMPLE_SX')
    const waiting = rows[3]!
    expect(correctImportRow(api, OFFICE_ACTOR, waiting, { procedure: { text: 'Tonsils' } } as never)).toMatchObject({ ok: false, code: 'wordingKeptAsReceived' })
    expect(correctImportRow(api, OFFICE_ACTOR, waiting, { nhi: 'ZQA1009' })).toMatchObject({ ok: false, code: 'invalidNhi' })
    expect(assessImportRow(api.getState(), waiting)?.waitingForNhi).toBe(true)
    expect(correctImportRow(api, OFFICE_ACTOR, waiting, { nhi: SX_NO_NHI_TYPED }).ok).toBe(true)
    const a = assessImportRow(api.getState(), waiting)!
    expect(a).toMatchObject({ waitingForNhi: false, changeType: 'new', queue: 'ready', suggestion: { kind: 'createBooking', listId: 'L-34821-2026-12-01-PM' } })
    expect(api.getState().intake.rows[waiting]!.incoming.procedure?.text).toBe('T&A')
  })
})

describe('decisions (US-02.1.2, US-02.1.3, FT-02.5)', () => {
  it('a row with no NHI is refused every decision but reject, creating nothing', () => {
    const api = fresh()
    const waiting = imported(api, 'SAMPLE_SX')[3]!
    const before = scheduleOf(api)
    expect(decideImportRow(api, OFFICE_ACTOR, waiting, { kind: 'createBooking', listId: 'L-34821-2026-12-01-PM' })).toMatchObject({ ok: false, code: 'nhiRequired' })
    expect(decideImportRow(api, OFFICE_ACTOR, waiting, { kind: 'createDraft' })).toMatchObject({ ok: false, code: 'nhiRequired' })
    expect(scheduleOf(api)).toBe(before)
    expect(decideImportRow(api, OFFICE_ACTOR, waiting, { kind: 'reject', reason: '' })).toMatchObject({ ok: false, code: 'reasonRequired' })
    expect(decideImportRow(api, OFFICE_ACTOR, waiting, { kind: 'reject', reason: 'Not an AA booking' }).ok).toBe(true)
    expect(api.getState().intake.rows[waiting]).toMatchObject({ status: 'rejected', decidedBy: 'Kirsty W.' })
    expect(scheduleOf(api)).toBe(before)
  })

  it('Create Booking: source hospitalDownload, the text verbatim, no Contract or RVG code, the patient reused, History names the row', () => {
    const api = fresh()
    const r1 = imported(api, 'SAMPLE_STG')[0]!
    const patientsBefore = Object.keys(api.getState().masters.patients).length
    const res = decideImportRow(api, OFFICE_ACTOR, r1, { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM' })
    expect(res.ok).toBe(true)
    const bookingId = res.ok ? res.value.bookingId! : ''
    const s = api.getState()
    const booking = s.schedule.bookings[bookingId]!
    expect(booking).toMatchObject({ listId: 'L-34821-2026-12-01-AM', patientId: 'PT0005', scheduledTime: '08:30', source: 'hospitalDownload', correlationRef: { sourceFeedId: 'FEED-STG', externalAppointmentId: '1661243' } })
    expect(Object.keys(s.masters.patients)).toHaveLength(patientsBefore)
    const [procedure] = proceduresForBooking(s, bookingId)
    expect(procedure!.procedureText).toMatchObject({ text: 'lap appy ?conv to open', source: 'hospitalDownload', from: "St George's" })
    expect(procedure!.invoiceDescription).toEqual({ text: 'lap appy ?conv to open', origin: 'hospital' })
    expect(procedure!.governingContractId).toBeUndefined()
    expect(procedure!.rvgGroupId).toBeUndefined()
    expect(procedure!.payer).toEqual({ kind: 'patient' })
    expect(needsInvoiceDestinationBookings(s).some((r) => r.bookingId === bookingId)).toBe(true)
    // Sarah Mitchell owes AA: the Booking made from her row carries the strong balance warning (catch-up Phase 40; moved from the retired Matching screen's test).
    expect(warningsForBooking(s, bookingId).filter((w) => w.ruleId === 'patientBalance').map((w) => w.strength)).toEqual(['strong'])
    const last = s.audit.slice(-2)
    expect(last.map((a) => a.action)).toEqual(['importRow.decide', 'booking.fromHospitalRow'])
    expect(last[1]).toMatchObject({ entityId: bookingId, after: { importRowId: r1, hospital: "St George's", channel: 'download', changeType: 'new' } })
    expect(decideImportRow(api, OFFICE_ACTOR, r1, { kind: 'reject', reason: 'x' })).toMatchObject({ ok: false, code: 'alreadyDecided' })
  })

  it("a later update for the Booking R1 created matches it, changes nothing until decided, then applies time, note and text", () => {
    const api = fresh()
    const r1 = imported(api, 'SAMPLE_STG')[0]!
    const created = decideImportRow(api, OFFICE_ACTOR, r1, { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM' })
    const bookingId = created.ok ? created.value.bookingId! : ''
    const before = scheduleOf(api)
    const update = imported(api, 'SAMPLE_STG_UPDATE')[0]!
    expect(scheduleOf(api)).toBe(before)
    const a = assessImportRow(api.getState(), update)!
    expect(a).toMatchObject({ changeType: 'modification', match: { bookingId, basis: 'listAndPatient' } })
    expect(a.diffs.map((d) => d.key)).toEqual(['time', 'procedureText', 'note'])
    expect(decideImportRow(api, OFFICE_ACTOR, update, { kind: 'match', bookingId, fieldsApplied: ['time', 'procedureText', 'note'] }).ok).toBe(true)
    const s = api.getState()
    expect(s.schedule.bookings[bookingId]).toMatchObject({ scheduledTime: '09:00', notes: "St George's, 24 Nov: Moved to 09:00 at theatre request" })
    expect(proceduresForBooking(s, bookingId)[0]!.procedureText?.text).toBe(SARAH_UPDATE_WORDING)
    const procedureId = proceduresForBooking(s, bookingId)[0]!.id
    const replaced = s.audit.find((e) => e.action === 'procedure.procedureText.replace' && e.entityId === procedureId)
    expect(replaced?.before).toMatchObject({ procedureText: { text: 'lap appy ?conv to open' } })
  })

  it("Foster's Modification: only ticked fields, the note appended, WLE MM replaced and kept in the change history, Contract and RVG untouched", () => {
    const api = fresh()
    const r3 = imported(api, 'SAMPLE_STG')[2]!
    const prior = api.getState().schedule.procedures['P0046']!
    const res = decideImportRow(api, OFFICE_ACTOR, r3, { kind: 'match', bookingId: 'BK0043', fieldsApplied: ['procedureText', 'note'] })
    expect(res).toMatchObject({ ok: true, value: { decision: { kind: 'match', changeType: 'modification', fieldsApplied: ['procedureText', 'note'] } } })
    const s = api.getState()
    expect(s.schedule.bookings['BK0043']!.scheduledTime).toBe('11:00')
    expect(s.schedule.bookings['BK0043']!.notes).toContain('Bumped 15 min at surgeon request')
    const p = s.schedule.procedures['P0046']!
    expect(p.procedureText).toMatchObject({ text: FOSTER_HOSPITAL_WORDING, source: 'hospitalDownload' })
    expect(p.governingContractId).toBe(prior.governingContractId)
    expect(p.rvgGroupId).toBe(prior.rvgGroupId)
    expect(p.invoiceDescription).toEqual({ text: FOSTER_HOSPITAL_WORDING, origin: 'hospital' })
    const history = s.audit.filter((e) => e.action === 'procedure.procedureText.replace' && e.entityId === 'P0046')
    expect(history).toHaveLength(1)
    expect(history[0]!.before).toMatchObject({ procedureText: { text: 'WLE MM' } })
  })

  it('a day move: the cancellation row cancels the old Booking, the New row creates a separate one', () => {
    const api = fresh()
    const rows = imported(api, 'SAMPLE_STG')
    expect(decideImportRow(api, OFFICE_ACTOR, rows[3]!, { kind: 'match', bookingId: 'BK0042', fieldsApplied: [] }).ok).toBe(true)
    const created = decideImportRow(api, OFFICE_ACTOR, rows[4]!, { kind: 'createBooking', listId: 'L-34821-2026-12-08-AM' })
    expect(created.ok).toBe(true)
    const s = api.getState()
    expect(s.schedule.bookings['BK0042']).toMatchObject({ listId: 'L-34821-2026-12-07-PM', cancellation: { reason: "Moved to another day by St George's booking office" } })
    const newId = created.ok ? created.value.bookingId! : ''
    expect(newId).not.toBe('BK0042')
    expect(s.schedule.bookings[newId]).toMatchObject({ listId: 'L-34821-2026-12-08-AM', patientId: s.schedule.bookings['BK0042']!.patientId })
  })

  it('an AUTHORISED List is refused listLocked and nothing changes; a SUBMITTED List applies (US-02.5.4)', () => {
    const api = fresh()
    const r3 = imported(api, 'SAMPLE_SX')[2]!
    const before = scheduleOf(api)
    expect(decideImportRow(api, OFFICE_ACTOR, r3, { kind: 'match', bookingId: 'HBK08', fieldsApplied: ['time'] })).toMatchObject({ ok: false, code: 'listLocked' })
    expect(scheduleOf(api)).toBe(before)
    const staged = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-STG', 'test', [
      { hospitalId: 'H-STG', dateISO: '2026-11-20', session: 'AM', surgeon: { name: 'Mr P. Doyle', hpiId: '45DOYP' }, scheduledTime: '10:15', patient: { name: 'Alan Prentice', nhi: 'ZAC3326' }, hospitalStatus: 'booked' },
    ])
    const rowId = staged.ok ? staged.value.rowIds[0]! : ''
    const a = assessImportRow(api.getState(), rowId)!
    expect(api.getState().schedule.lists[api.getState().schedule.bookings[a.match!.bookingId]!.listId]!.state).toBe('SUBMITTED')
    expect(decideImportRow(api, OFFICE_ACTOR, rowId, { kind: 'match', bookingId: a.match!.bookingId, fieldsApplied: ['time'] }).ok).toBe(true)
    expect(api.getState().schedule.bookings[a.match!.bookingId]!.scheduledTime).toBe('10:15')
  })

  it('a patient correction and the insurer land through their writers; never a payer or billable party', () => {
    const api = fresh()
    const r2 = imported(api, 'SAMPLE_SX')[1]!
    const res = decideImportRow(api, OFFICE_ACTOR, r2, { kind: 'match', bookingId: 'BK0166', fieldsApplied: ['patientName', 'dob', 'insurer', 'note'] })
    expect(res.ok).toBe(true)
    const s = api.getState()
    const b = s.schedule.bookings['BK0166']!
    expect(b).toMatchObject({ funderPartyId: 'PY-NIB', insuranceApprovalNumber: '4471203' })
    expect(s.masters.patients[b.patientId]).toMatchObject({ name: 'Olivia Ratima', dobISO: '1955-07-03' })
    expect(proceduresForBooking(s, 'BK0166')[0]!.payer).toEqual({ kind: 'patient' })
  })

  it('Create a List in a session (through assignListToSlot) and Create a Draft List holding the Booking', () => {
    const api = fresh()
    const sx5 = imported(api, 'SAMPLE_SX')[4]!
    const list = decideImportRow(api, OFFICE_ACTOR, sx5, { kind: 'createList', slotId: 'S-41267-2026-12-10-PM' })
    expect(list.ok).toBe(true)
    const s1 = api.getState()
    const listId = list.ok ? list.value.listId! : ''
    expect(s1.schedule.lists[listId]).toMatchObject({ state: 'ACTIVE', hospitalId: 'H-SX', surgeonId: 'S-PATEL', anaesthetistId: '41267' })
    expect(s1.schedule.bookings[list.ok ? list.value.bookingId! : '']!.listId).toBe(listId)

    // Forte Health's List by PDF (Phase 68; D125): its first row held as a Draft List.
    const forte1 = forteByPdf(api)[0]!
    const draft = decideImportRow(api, OFFICE_ACTOR, forte1, { kind: 'createDraft' })
    expect(draft.ok).toBe(true)
    const s2 = api.getState()
    const draftId = draft.ok ? draft.value.listId! : ''
    expect(s2.schedule.lists[draftId]).toMatchObject({ state: 'DRAFT', hospitalId: 'H-FORTE', surgeonId: 'S-OKAFOR', dateISO: '2026-12-01', session: 'AM', draft: { origin: 'hospitalRow' } })
    expect(s2.schedule.lists[draftId]!.notes).toBe("From Mr C. Okafor's rooms PDF list: Peter Langley, 08:00, phaco + IOL R")
    const bookingId = draft.ok ? draft.value.bookingId! : ''
    expect(proceduresForBooking(s2, bookingId)[0]!.procedureText).toMatchObject({ text: 'phaco + IOL R', source: 'surgeonPdf', from: "Mr C. Okafor's rooms" })
  })

  it('a Draft List needs a surgeon; a mistyped NHI must be corrected first', () => {
    const api = fresh()
    const forte = forteByPdf(api)
    expect(correctImportRow(api, OFFICE_ACTOR, forte[0]!, { surgeonId: 'S-NOPE' })).toMatchObject({ ok: false, code: 'notFound' })
    expect(decideImportRow(api, OFFICE_ACTOR, forte[1]!, { kind: 'createBooking', listId: 'L-29104-2026-12-01-AM' })).toMatchObject({ ok: false, code: 'invalidNhi' })
    expect(correctImportRow(api, OFFICE_ACTOR, forte[1]!, { nhi: FORTE_CORRECTED_NHI }).ok).toBe(true)
    expect(decideImportRow(api, OFFICE_ACTOR, forte[1]!, { kind: 'createBooking', listId: 'L-29104-2026-12-01-AM' }).ok).toBe(true)
    const staged = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-SX', 'test', [
      { hospitalId: 'H-SX', dateISO: '2026-12-10', session: 'PM', patient: { name: 'No Surgeon', nhi: 'ZQA4333' }, procedure: { text: 'x' }, hospitalStatus: 'booked' },
    ])
    expect(decideImportRow(api, OFFICE_ACTOR, staged.ok ? staged.value.rowIds[0]! : '', { kind: 'createDraft' })).toMatchObject({ ok: false, code: 'surgeonRequired' })
  })

  it('a row with no wording needs an RVG code; picks land through their checks; an unoffered Contract changes nothing', () => {
    const api = fresh()
    const staged = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-STG', 'test', [
      { hospitalId: 'H-STG', dateISO: '2026-12-01', session: 'AM', surgeon: { name: 'Mr T. Hale', hpiId: '40HALT' }, patient: { name: 'Ana Code', nhi: 'ZQA4708' }, hospitalStatus: 'booked' },
    ])
    const rowId = staged.ok ? staged.value.rowIds[0]! : ''
    expect(decideImportRow(api, OFFICE_ACTOR, rowId, { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM' })).toMatchObject({ ok: false, code: 'wordingOrCodeRequired' })
    const before = JSON.stringify({ s: api.getState().schedule, a: api.getState().audit.length, i: api.getState().intake })
    const bad = decideImportRow(api, OFFICE_ACTOR, rowId, { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM', picks: { rvgGroupId: 'RG001', contract: { contractId: 'CT-FORTE-D1' } } })
    expect(bad.ok).toBe(false)
    expect(JSON.stringify({ s: api.getState().schedule, a: api.getState().audit.length, i: api.getState().intake })).toBe(before)
    const good = decideImportRow(api, OFFICE_ACTOR, rowId, { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM', picks: { rvgGroupId: 'RG001', contract: { contractId: 'CT-STG-D1' } } })
    expect(good.ok).toBe(true)
    const p = proceduresForBooking(api.getState(), good.ok ? good.value.bookingId! : '')[0]!
    expect(p.governingContractId).toBe('CT-STG-D1')
    expect(p.procedureText).toBeNull()
  })

  it('a stale decision is refused; another hospital is refused', () => {
    const api = fresh()
    const r1 = imported(api, 'SAMPLE_STG')[0]!
    expect(decideImportRow(api, OFFICE_ACTOR, r1, { kind: 'createBooking', listId: 'L-43015-2026-12-01-AM' })).toMatchObject({ ok: false, code: 'hospitalMismatch' })
    expect(decideImportRow(api, OFFICE_ACTOR, r1, { kind: 'match', bookingId: 'BK0043', fieldsApplied: [] })).toMatchObject({ ok: false, code: 'staleSuggestion' })
  })
})

describe('review fixes (catch-up Phase 33)', () => {
  const stg = (over: Record<string, unknown> = {}) => ({
    hospitalId: 'H-STG',
    dateISO: '2026-12-01',
    session: 'AM' as const,
    surgeon: { name: 'Mr T. Hale', hpiId: '40HALT' },
    scheduledTime: '07:45',
    patient: { name: 'Dylan Kereama', nhi: 'GBB9305', dobISO: '1992-08-20' },
    hospitalStatus: 'booked' as const,
    ...over,
  })
  const stage = (api: AppStoreApi, row: ReturnType<typeof stg>) => {
    const res = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-STG', 'test', [row])
    return res.ok ? res.value.rowIds[0] : undefined
  }

  it("a Booking chosen by hand with another NHI never renames that patient's record", () => {
    const api = fresh()
    const rowId = stage(api, stg({ patient: { name: 'Jane Doe', nhi: 'ZQA1008', dobISO: '1970-05-07' }, procedure: { text: 'x' } }))!
    const before = api.getState().masters.patients[api.getState().schedule.bookings['BK0066']!.patientId]
    expect(decideImportRow(api, OFFICE_ACTOR, rowId, { kind: 'match', bookingId: 'BK0066', fieldsApplied: ['patientName', 'dob', 'procedureText'] }).ok).toBe(true)
    expect(api.getState().masters.patients[api.getState().schedule.bookings['BK0066']!.patientId]).toEqual(before)
  })

  it("an insurer row with no approval number keeps the Booking's own", () => {
    const api = fresh()
    const rowId = stage(api, stg({ patient: { name: 'Leon Pereira', nhi: 'LMF9498' } }))
    expect(rowId).toBeDefined()
    // BK0133 holds nib; give it a number, then a row naming Southern Cross Health Society with none.
    const sx = stageImportRows(api, OFFICE_ACTOR, 'download', 'H-SX', 'test', [
      { hospitalId: 'H-SX', dateISO: '2026-11-24', session: 'AM', surgeon: { name: 'Mr P. Doyle', hpiId: '45DOYP' }, patient: { name: 'Leon Pereira', nhi: 'LMF9498' }, insurer: { text: 'nib', insurerPartyId: 'PY-NIB', approvalNumber: '111' }, hospitalStatus: 'booked' },
      { hospitalId: 'H-SX', dateISO: '2026-11-24', session: 'AM', surgeon: { name: 'Mr P. Doyle', hpiId: '45DOYP' }, patient: { name: 'Leon Pereira', nhi: 'LMF9498' }, insurer: { text: 'Southern Cross', insurerPartyId: 'PY-SCHS' }, hospitalStatus: 'booked' },
    ])
    const [a, b] = sx.ok ? sx.value.rowIds : []
    expect(decideImportRow(api, OFFICE_ACTOR, a!, { kind: 'match', bookingId: 'BK0133', fieldsApplied: ['insurer'] }).ok).toBe(true)
    expect(decideImportRow(api, OFFICE_ACTOR, b!, { kind: 'match', bookingId: 'BK0133', fieldsApplied: ['insurer'] }).ok).toBe(true)
    expect(api.getState().schedule.bookings['BK0133']).toMatchObject({ funderPartyId: 'PY-SCHS', insuranceApprovalNumber: '111' })
  })

  it('a revert to an earlier value is a new row; an identical repeat of the latest, already decided, is staged again (DM-21)', () => {
    const api = fresh()
    const first = stage(api, stg({ scheduledTime: '08:00' }))!
    expect(decideImportRow(api, OFFICE_ACTOR, first, { kind: 'match', bookingId: 'BK0066', fieldsApplied: ['time'] }).ok).toBe(true)
    const second = stage(api, stg({ scheduledTime: '08:30' }))!
    expect(decideImportRow(api, OFFICE_ACTOR, second, { kind: 'match', bookingId: 'BK0066', fieldsApplied: ['time'] }).ok).toBe(true)
    const repeat = stage(api, stg({ scheduledTime: '08:30' }))
    expect(repeat).toBeDefined()
    // While that repeat is still open, the same row again is skipped: the one job stays one.
    expect(stage(api, stg({ scheduledTime: '08:30' }))).toBeUndefined()
    expect(stage(api, stg({ scheduledTime: '08:00' }))).toBeDefined()
  })

  it('a create never double-books a patient already booked in that session', () => {
    const api = fresh()
    const rows = imported(api, 'SAMPLE_STG')
    const dupe = stage(api, stg({ scheduledTime: '08:30', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-08-16' }, procedure: { text: 'appendicectomy' } }))!
    expect(decideImportRow(api, OFFICE_ACTOR, rows[0]!, { kind: 'createBooking', listId: 'L-34821-2026-12-01-AM' }).ok).toBe(true)
    const before = scheduleOf(api)
    expect(decideImportRow(api, OFFICE_ACTOR, dupe, { kind: 'createDraft' })).toMatchObject({ ok: false, code: 'alreadyBooked' })
    expect(scheduleOf(api)).toBe(before)
  })

  it('corrections validate the date of birth and the time', () => {
    const api = fresh()
    const rowId = imported(api, 'SAMPLE_STG')[0]!
    expect(correctImportRow(api, OFFICE_ACTOR, rowId, { dobISO: '12/03/66' })).toMatchObject({ ok: false, code: 'invalidDob' })
    expect(correctImportRow(api, OFFICE_ACTOR, rowId, { scheduledTime: '9am' })).toMatchObject({ ok: false, code: 'invalidTime' })
  })

  it('"Use it" applies inside the decision: an edited invoice description takes the hospital text', () => {
    const api = fresh()
    expect(setInvoiceDescription(api, OFFICE_ACTOR, 'P0046', 'Excision, melanoma').ok).toBe(true)
    const r3 = imported(api, 'SAMPLE_STG')[2]!
    expect(decideImportRow(api, OFFICE_ACTOR, r3, { kind: 'match', bookingId: 'BK0043', fieldsApplied: ['procedureText'], useNewerText: true }).ok).toBe(true)
    expect(api.getState().schedule.procedures['P0046']!.invoiceDescription?.text).toBe(FOSTER_HOSPITAL_WORDING)
  })
})

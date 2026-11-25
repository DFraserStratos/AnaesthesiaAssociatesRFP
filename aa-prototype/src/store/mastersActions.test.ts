/**
 * Master-data mutation guards (Phase 07): anaesthetist edit/add (+ canvas
 * forward), hospital-holiday add + live reconcile and recurring-booking
 * add/edit. The Contract surface is tested in contractActions.test.ts, the
 * Party surface in partyActions.test.ts (catch-up Phase 18).
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { setProcedurePrice } from './pricingActions'
import { setProcedureContract } from './contractSelectionActions'
import { bookingsForList, proceduresForBooking } from './selectors'
import {
  addAnaesthetist,
  addHospitalHoliday,
  addRecurringBooking,
  editAnaesthetist,
  editRecurringBooking,
} from './mastersActions'
import type { Actor } from './mutate'
import { procedureFeeAlone as procedureFee } from './testFees'
import { enumerateDatesISO, horizonFor } from '../domain/clock'
import { ANAE, HOSP, SEED_LEAVE, SEED_MARKERS, SURG, generateCanvasForDates } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { assignListToSlot, reassignList } from './slotActions'
import { advanceClockDays } from './clockActions'
import { rosterForDate } from './selectors'
import { clearLastDay, makeAnaesthetistInactive } from './anaesthetistStatusActions'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const MORRISON_LIST = marker('submittedListMorrison')

describe('editAnaesthetist', () => {
  it('updates unit value / contact / active and audits before to after', () => {
    const api = createAppStore()
    const outcome = editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 40, phone: '021 000 0000' })
    expect(outcome.ok).toBe(true)
    const anae = api.getState().masters.anaesthetists[ANAE.souter]
    expect(anae?.unitValue).toBe(40)
    expect(anae?.phone).toBe('021 000 0000')
    const entry = api.getState().audit.at(-1)
    expect(entry?.action).toBe('anaesthetist.update')
    expect(entry?.entityId).toBe(ANAE.souter)
    // Souter has Lists ahead, so making her inactive from today is refused until they are reassigned (Phase 52).
    const off = makeAnaesthetistInactive(api, OFFICE, ANAE.souter, '2026-11-24', 'leftPractice')
    expect(off.ok ? '' : off.code).toBe('listsAfterLastDay')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.lastDayISO).toBeNull()
  })

  it("re-prices an RVG fee that reads the anaesthetist's unit value", () => {
    const api = createAppStore()
    const booking = bookingsForList(api.getState(), MORRISON_LIST)[0]
    if (booking === undefined) throw new Error('no booking')
    const proc = proceduresForBooking(api.getState(), booking.id)[0]
    if (proc === undefined) throw new Error('no procedure')
    // Force RVG at the anaesthetist's rate (units x own unit value): No contract · RVG, no override (catch-up Phase 20).
    expect(setProcedureContract(api, OFFICE, proc.id, 'CT-NO-CONTRACT').ok).toBe(true)
    expect(setProcedurePrice(api, OFFICE, proc.id, null).ok).toBe(true)

    const feeArgs = () => {
      const s = api.getState()
      return { procedure: s.schedule.procedures[proc.id]!, list: assigned(s.schedule.lists[MORRISON_LIST]), masters: s.masters, patientId: booking.patientId }
    }
    const before = procedureFee(feeArgs()).fee.total
    expect(before).toBeGreaterThan(0)
    expect(editAnaesthetist(api, OFFICE, ANAE.morrison, { unitValue: 70 }).ok).toBe(true)
    const after = procedureFee(feeArgs()).fee.total
    expect(after).not.toBe(before)
    expect(after).toBeGreaterThan(before)
  })

  it('rejects a non-positive or non-numeric unit value and an unknown anaesthetist', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 0 }).ok).toBe(false)
    expect(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: Number.NaN }).ok).toBe(false)
    expect(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: -5 }).ok).toBe(false)
    expect(editAnaesthetist(api, OFFICE, 'nope', { unitValue: 30 }).ok).toBe(false)
  })
})

describe('editAnaesthetist: who edits what (catch-up Phase 26; US-12.1.1, US-12.1.4)', () => {
  const SYSTEM: Actor = { who: 'System', role: 'system', source: 'system' }
  const RUTHERFORD: Actor = { who: 'Dr James Rutherford', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.rutherford }
  const BANK = { accountName: 'Melanie Souter', accountNumber: '12-3456-7654321-00' }
  const OFFICE_HELD: [string, Parameters<typeof editAnaesthetist>[3]][] = [
    ['phone', { phone: '021 999 9999' }],
    ['email', { email: 'x@example.test' }],
    ['hpiId', { hpiId: '88ZZZZ' }],
    ['bankAccount', { bankAccount: BANK }],
    ['startDateISO', { startDateISO: '2014-05-07' }],
    ['gstNumber', { gstNumber: '' }],
  ]

  it('the anaesthetist edits their own rate per unit, rounded to cents, audited as theirs', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: 27.004 }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.unitValue).toBe(27)
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({ action: 'anaesthetist.update', role: 'anaesthetist', before: { unitValue: 26.5 }, after: { unitValue: 27 } })
  })

  it.each(OFFICE_HELD)('the anaesthetist may not change their own %s (officeOnlyField), and nothing is written', (_field, patch) => {
    const api = createAppStore()
    const before = api.getState().masters.anaesthetists[ANAE.souter]
    const auditLength = api.getState().audit.length
    const outcome = editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: 27, ...patch })
    expect(outcome.ok ? '' : outcome.code).toBe('officeOnlyField')
    expect(outcome.ok ? '' : outcome.message).toMatch(/AA office/)
    expect(api.getState().masters.anaesthetists[ANAE.souter]).toBe(before)
    expect(api.getState().audit).toHaveLength(auditLength)
  })

  it("the anaesthetist may not change a colleague's record, even the rate (notOwnProfile)", () => {
    const api = createAppStore()
    const outcome = editAnaesthetist(api, RUTHERFORD, ANAE.souter, { unitValue: 99 })
    expect(outcome.ok ? '' : outcome.code).toBe('notOwnProfile')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.unitValue).toBe(26.5)
  })

  it('a system actor writes nothing', () => {
    const api = createAppStore()
    for (const patch of [{ unitValue: 30 }, ...OFFICE_HELD.map(([, p]) => p)]) {
      const outcome = editAnaesthetist(api, SYSTEM, ANAE.souter, patch)
      expect(outcome.ok ? '' : outcome.code).toBe('systemActor')
    }
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.unitValue).toBe(26.5)
  })

  it('the office edits every field; the bank number is stored dashed and audited masked, before and after', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { phone: '021 999 9999', email: 'x@example.test', bankAccount: { accountName: ' Melanie Souter ', accountNumber: '12 3456 7654321 00' } }).ok).toBe(true)
    const a = api.getState().masters.anaesthetists[ANAE.souter]
    expect(a?.bankAccount).toEqual(BANK)
    const entry = api.getState().audit.at(-1)
    expect(entry?.before).toEqual({ phone: '021 555 0134', email: 'm.souter@aa-associates.example', bankAccount: { accountName: 'Melanie Souter', accountNumber: '99-0101-•••••21-00' } })
    expect(entry?.after).toEqual({ phone: '021 999 9999', email: 'x@example.test', bankAccount: { accountName: 'Melanie Souter', accountNumber: '12-3456-•••••21-00' } })
    expect(JSON.stringify(entry)).not.toMatch(/7654321|0034821/)
  })

  it('a patch that changes nothing is ok and writes no audit entry; only changed fields are audited', () => {
    const api = createAppStore()
    const s = api.getState()
    const souter = s.masters.anaesthetists[ANAE.souter]!
    const auditLength = s.audit.length
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 26.5, phone: souter.phone, hpiId: '10soum', bankAccount: { ...souter.bankAccount } }).ok).toBe(true)
    expect(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: 26.5 }).ok).toBe(true)
    expect(api.getState().audit).toHaveLength(auditLength)
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 28, phone: souter.phone }).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.after).toEqual({ unitValue: 28 })
  })

  it('the HPI CPN and the bank details are mandatory and validated on edit', () => {
    const api = createAppStore()
    const code = (patch: Parameters<typeof editAnaesthetist>[3]) => {
      const o = editAnaesthetist(api, OFFICE, ANAE.souter, patch)
      return o.ok ? 'ok' : o.code
    }
    expect(code({ hpiId: '  ' })).toBe('hpiCpnRequired')
    expect(code({ hpiId: '1ABCDE' })).toBe('invalidHpiCpn')
    expect(code({ hpiId: '11RUTJ' })).toBe('duplicateHpiCpn')
    expect(code({ bankAccount: { accountName: '', accountNumber: '12-3456-7654321-00' } })).toBe('bankAccountRequired')
    expect(code({ bankAccount: { accountName: 'Melanie Souter', accountNumber: ' ' } })).toBe('bankAccountRequired')
    expect(code({ bankAccount: { accountName: 'Melanie Souter', accountNumber: '12-3456-765-00' } })).toBe('invalidBankAccount')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.hpiId).toBe('10SOUM')
    expect(code({ hpiId: '24newm' })).toBe('ok')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.hpiId).toBe('24NEWM')
  })

  it("her new rate re-prices her ACTIVE List's Procedure and leaves her AUTHORISED Lists' locks and invoices untouched (Phase 25)", () => {
    const api = createAppStore()
    const s0 = api.getState()
    const activeList = Object.values(s0.schedule.lists).find(
      (l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.souter && bookingsForList(s0, l.id).some((b) => proceduresForBooking(s0, b.id).length > 0),
    )
    if (activeList === undefined) throw new Error('no ACTIVE Souter List with a Procedure')
    const booking = bookingsForList(s0, activeList.id).find((b) => proceduresForBooking(s0, b.id).length > 0)!
    const proc = proceduresForBooking(s0, booking.id)[0]!
    expect(setProcedureContract(api, OFFICE, proc.id, 'CT-NO-CONTRACT').ok).toBe(true)
    expect(setProcedurePrice(api, OFFICE, proc.id, null).ok).toBe(true)
    const fee = () => {
      const s = api.getState()
      return procedureFee({ procedure: s.schedule.procedures[proc.id]!, list: assigned(s.schedule.lists[activeList.id]), masters: s.masters, patientId: booking.patientId }).fee.total
    }
    const before = fee()

    const souterLocks = Object.values(api.getState().billing.locks).filter((l) => l.payee.anaesthetistId === ANAE.souter)
    expect(souterLocks.length).toBeGreaterThan(0)
    const locksBefore = JSON.stringify(api.getState().billing.locks)
    const invoicesBefore = JSON.stringify(api.getState().billing.invoices)

    expect(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: 40 }).ok).toBe(true)
    expect(fee()).toBeGreaterThan(before)
    expect(JSON.stringify(api.getState().billing.locks)).toBe(locksBefore)
    expect(JSON.stringify(api.getState().billing.invoices)).toBe(invoicesBefore)
  })

  it('a new number that masks the same as the old one still reads as a change in the audit', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { bankAccount: { accountName: 'Melanie Souter', accountNumber: '99-0101-5555521-00' } }).ok).toBe(true)
    const entry = api.getState().audit.at(-1)
    expect(entry?.before).toEqual({ bankAccount: { accountName: 'Melanie Souter', accountNumber: '99-0101-•••••21-00' } })
    expect(entry?.after).toEqual({ bankAccount: { accountName: 'Melanie Souter', accountNumber: '99-0101-•••••21-00 (new number)' } })
    expect(JSON.stringify(entry)).not.toMatch(/55555|0034821/)
  })

  it('refuses a field that is not on the profile, and a rate that rounds to nothing', () => {
    const api = createAppStore()
    const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
    expect(code(editAnaesthetist(api, OFFICE, ANAE.souter, { registrationNumber: '1' } as never))).toBe('unknownField')
    expect(code(editAnaesthetist(api, SOUTER, ANAE.souter, { name: 'X' } as never))).toBe('unknownField')
    expect(code(editAnaesthetist(api, SOUTER, ANAE.souter, { unitValue: 0.004 }))).toBe('invalidUnitValue')
    expect(code(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 1.7e307 }))).toBe('invalidUnitValue')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.unitValue).toBe(26.5)
  })
})

describe('addAnaesthetist: HPI CPN and bank details mandatory (catch-up Phase 26; US-12.1.4)', () => {
  const NEW = { registrationNumber: '99009', name: 'Dr Nadia Kerr', phone: '021 555 9009', email: 'n.kerr@aa-associates.example', unitValue: 30, startDateISO: '2026-11-24', hpiId: '12abcd', bankAccount: { accountName: 'Nadia Kerr', accountNumber: '990101009900900' } }
  const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)

  it('refuses a missing or malformed HPI CPN and missing or malformed bank details', () => {
    const api = createAppStore()
    expect(code(addAnaesthetist(api, OFFICE, { ...NEW, hpiId: '' }))).toBe('hpiCpnRequired')
    expect(code(addAnaesthetist(api, OFFICE, { ...NEW, hpiId: '1ABCDE' }))).toBe('invalidHpiCpn')
    expect(code(addAnaesthetist(api, OFFICE, { ...NEW, hpiId: '10SOUM' }))).toBe('duplicateHpiCpn')
    expect(code(addAnaesthetist(api, OFFICE, { ...NEW, bankAccount: { accountName: '', accountNumber: '' } }))).toBe('bankAccountRequired')
    expect(code(addAnaesthetist(api, OFFICE, { ...NEW, bankAccount: { accountName: 'Nadia Kerr', accountNumber: '12345' } }))).toBe('invalidBankAccount')
    expect(api.getState().masters.anaesthetists['99009']).toBeUndefined()
  })

  it('with both, stores the HPI CPN upper-cased and the bank number dashed', () => {
    const api = createAppStore()
    expect(code(addAnaesthetist(api, OFFICE, NEW))).toBe('ok')
    const a = api.getState().masters.anaesthetists['99009']
    expect(a?.hpiId).toBe('12ABCD')
    expect(a?.bankAccount).toEqual({ accountName: 'Nadia Kerr', accountNumber: '99-0101-0099009-00' })
    expect(JSON.stringify(api.getState().audit.filter((e) => e.entityId === '99009'))).not.toMatch(/0099009/)
  })
})

describe('addAnaesthetist (catch-up Phase 28: Slots from the start date, US-01.1.3)', () => {
  const NEW = { registrationNumber: '99001', name: 'Dr New Person', phone: '021 555 9001', email: 'n.person@aa-associates.example', unitValue: 30, hpiId: '99NEWP', bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099001-00' } }

  function theirSlots(api: ReturnType<typeof createAppStore>, reg = '99001') {
    return Object.values(api.getState().schedule.slots).filter((s) => s.anaesthetistId === reg)
  }

  it('from today: two free Slots per day to the horizon end, deep-matching a fresh generation, audited', () => {
    const api = createAppStore()
    const todayISO = api.getState().clock.todayISO
    const outcome = addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: todayISO })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const state = api.getState()
    expect(state.masters.anaesthetists['99001']).toMatchObject({ name: 'Dr New Person', startDateISO: todayISO, lastDayISO: null, activeAgainISO: null })

    const slots = theirSlots(api)
    const dates = enumerateDatesISO(todayISO, horizonFor(todayISO, 4).endISO)
    expect(slots.length).toBe(dates.length * 2)
    expect(outcome.value.generatedSlots).toBe(slots.length)
    expect(outcome.value.fromISO).toBe(todayISO)
    // A new anaesthetist has no recurring booking: every session is free, and no List is created.
    expect(slots.every((s) => s.status === 'free')).toBe(true)
    expect(Object.values(state.schedule.lists).some((l) => l.anaesthetistId === '99001')).toBe(false)

    const fresh = generateCanvasForDates(
      { anaesthetists: [{ id: '99001', startDateISO: todayISO, lastDayISO: null, activeAgainISO: null }], recurringBookings: Object.values(state.masters.recurringBookings), leave: SEED_LEAVE, series: [], statuses: state.masters.slotStatuses },
      dates,
    )
    const stored = new Map(slots.map((s) => [s.id, s]))
    for (const f of fresh.slots) expect(stored.get(f.id)).toEqual(f)

    const actions = state.audit.slice(-2).map((a) => a.action)
    expect(actions).toEqual(['anaesthetist.create', 'canvas.generate'])
    expect(state.audit.at(-1)?.after).toMatchObject({ slots: slots.length, lists: 0, fromISO: todayISO })
  })

  it('from a future date inside the horizon: no Slot before it', () => {
    const api = createAppStore()
    expect(addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-12-07' }).ok).toBe(true)
    const slots = theirSlots(api)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((s) => s.dateISO >= '2026-12-07')).toBe(true)
    expect(slots.some((s) => s.dateISO === '2026-12-07')).toBe(true)
  })

  it('from a date beyond the horizon: none yet, then the roll-forward creates them when the horizon reaches it', () => {
    const api = createAppStore()
    const end = horizonFor(api.getState().clock.todayISO, 4).endISO
    const outcome = addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2027-03-26' })
    expect(end).toBe('2027-03-24')
    expect(outcome.ok && outcome.value.generatedSlots).toBe(0)
    expect(theirSlots(api)).toHaveLength(0)
    advanceClockDays(api, 3)
    const after = theirSlots(api)
    expect(after.map((s) => s.dateISO).sort()).toEqual(['2027-03-26', '2027-03-26', '2027-03-27', '2027-03-27'])
  })

  it('refuses a missing or malformed start date, a duplicate registration number, and is office-only', () => {
    const api = createAppStore()
    const bad = addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '' })
    expect(bad.ok ? '' : bad.code).toBe('invalidStartDate')
    const dup = addAnaesthetist(api, OFFICE, { ...NEW, registrationNumber: ANAE.souter, startDateISO: '2026-11-24' })
    expect(dup.ok ? '' : dup.code).toBe('duplicateRegistration')
    expect(addAnaesthetist(api, SOUTER, { ...NEW, startDateISO: '2026-11-24' }).ok).toBe(false)
  })
})

describe('editAnaesthetist: start date and active (catch-up Phase 28; US-01.1.3, FT-01.1)', () => {
  const NEW = { registrationNumber: '99002', name: 'Dr Second Person', phone: '', email: '', unitValue: 30, hpiId: '99NEWP', bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099001-00' } }
  const slotsOf = (api: ReturnType<typeof createAppStore>) =>
    Object.values(api.getState().schedule.slots).filter((s) => s.anaesthetistId === '99002')

  it('moving the start date earlier fills the Slots in, later removes the early ones, and nothing before today is touched', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-12-07' })
    expect(editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-12-02' }).ok).toBe(true)
    expect(slotsOf(api).some((s) => s.dateISO === '2026-12-02')).toBe(true)
    expect(slotsOf(api).some((s) => s.dateISO < '2026-12-02')).toBe(false)
    expect(api.getState().audit.at(-1)?.action).toBe('canvas.generate')

    expect(editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-12-09' }).ok).toBe(true)
    expect(slotsOf(api).some((s) => s.dateISO < '2026-12-09')).toBe(false)
    expect(api.getState().audit.at(-1)?.action).toBe('canvas.trim')

    // A start date in the past never creates past Slots (only today on is touched).
    expect(editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-11-04' }).ok).toBe(true)
    expect(slotsOf(api).every((s) => s.dateISO >= '2026-11-24')).toBe(true)
  })

  it('refuses a later start date while a removed session holds a List (listsBeforeStart)', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-12-07' })
    const slotId = slotIdFor('99002', '2026-12-07', 'AM')
    expect(assignListToSlot(api, OFFICE, slotId, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }).ok).toBe(true)
    const before = api.getState()
    const out = editAnaesthetist(api, OFFICE, '99002', { startDateISO: '2026-12-08' })
    expect(out.ok ? '' : out.code).toBe('listsBeforeStart')
    expect(out.ok ? '' : out.message).toBe('Dr Second Person has 1 List before that date. Reassign it first.')
    expect(api.getState().schedule).toBe(before.schedule)
  })

  it('a last day removes the Slots after it (refused while a List stands); clearing it brings them back', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-11-24' })
    const slotId = slotIdFor('99002', '2026-11-25', 'PM')
    expect(assignListToSlot(api, OFFICE, slotId, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }).ok).toBe(true)
    const refused = makeAnaesthetistInactive(api, OFFICE, '99002', '2026-11-24', 'leftPractice')
    expect(refused.ok ? '' : refused.code).toBe('listsAfterLastDay')
    expect(refused.ok ? '' : refused.message).toBe('Dr Person has 1 List after 24 Nov. Reassign it first.')
    expect(api.getState().masters.anaesthetists['99002']?.lastDayISO).toBeNull()

    const listId = Object.values(api.getState().schedule.lists).find((l) => l.slotId === slotId)!.id
    expect(reassignList(api, OFFICE, listId, ANAE.souter).ok).toBe(true)
    expect(makeAnaesthetistInactive(api, OFFICE, '99002', '2026-11-24', 'leftPractice').ok).toBe(true)
    expect(slotsOf(api).map((s) => s.dateISO)).toEqual(['2026-11-24', '2026-11-24'])
    expect(rosterForDate(api.getState(), '2026-11-25').some((a) => a.registrationNumber === '99002')).toBe(false)

    expect(clearLastDay(api, OFFICE, '99002').ok).toBe(true)
    expect(slotsOf(api).length).toBe(enumerateDatesISO('2026-11-24', '2027-03-24').length * 2)
  })

  it('an inactive anaesthetist gets no Slots on roll-forward, and keeps past days', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { ...NEW, startDateISO: '2026-11-24' })
    advanceClockDays(api, 1)
    expect(makeAnaesthetistInactive(api, OFFICE, '99002', '2026-11-25', 'longLeave').ok).toBe(true)
    advanceClockDays(api, 2)
    // Tue 24 and Wed 25, the last day, keep their Slots; nothing after it.
    expect(slotsOf(api).map((s) => s.dateISO).sort()).toEqual(['2026-11-24', '2026-11-24', '2026-11-25', '2026-11-25'])
  })
})

describe('addHospitalHoliday', () => {
  it('flags an already-booked list at that hospital/date and audits it', () => {
    const api = createAppStore()
    const listId = marker('designDayAmList')
    const list = api.getState().schedule.lists[listId]
    if (list === undefined) throw new Error('no design-day AM list')
    const hospitalId = list.hospitalId
    expect(hospitalId).toBeDefined()
    if (hospitalId === undefined) return

    const outcome = addHospitalHoliday(api, OFFICE, hospitalId, list.dateISO, 'Unplanned closure')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.value.flaggedListCount).toBeGreaterThan(0)

    const flagged = api.getState().schedule.lists[listId]
    expect(flagged?.conflicts.some((c) => c.kind === 'holiday')).toBe(true)

    const actions = api.getState().audit.slice(-(1 + outcome.value.flaggedListCount)).map((a) => a.action)
    expect(actions[0]).toBe('holiday.create')
    expect(actions).toContain('list.conflict')
  })

  it('refuses a duplicate holiday and is office-only', () => {
    const api = createAppStore()
    expect(addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-12-07', 'Test day').ok).toBe(true)
    const dup = addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-12-07', 'Test day again')
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.code).toBe('duplicateHoliday')
    expect(addHospitalHoliday(api, SOUTER, HOSP.stg, '2026-12-08', 'x').ok).toBe(false)
  })
})

describe('recurring bookings', () => {
  it('adds a recurring booking (incl. usual surgeon) with a runtime RCBN id and edits it', () => {
    const api = createAppStore()
    const add = addRecurringBooking(api, OFFICE, {
      anaesthetistId: ANAE.souter,
      dayOfWeek: 3,
      session: 'AM',
      kind: 'private',
      hospitalId: HOSP.stg,
      surgeonId: SURG.hale,
      notes: 'Wed ortho',
    })
    expect(add.ok).toBe(true)
    if (!add.ok) return
    expect(add.value.id.startsWith('RCBN')).toBe(true)
    expect(api.getState().masters.recurringBookings[add.value.id]?.surgeonId).toBe(SURG.hale)

    // The pairing rule (US-01.3.1, catch-up Phase 31): the surgeon can change, never clear.
    const cleared = editRecurringBooking(api, OFFICE, add.value.id, { surgeonId: '' })
    expect(cleared.ok ? '' : cleared.code).toBe('pairingRequired')
    const auditBefore = api.getState().audit.length
    expect(editRecurringBooking(api, OFFICE, add.value.id, { surgeonId: SURG.patel }).ok).toBe(true)
    expect(api.getState().masters.recurringBookings[add.value.id]?.surgeonId).toBe(SURG.patel)
    // The edit is audited first; any projected List it re-pairs follows as its own list.update.
    const entries = api.getState().audit.slice(auditBefore)
    expect(entries[0]).toMatchObject({ action: 'recurringBooking.update', entityId: add.value.id })
    expect(entries.slice(1).every((e) => e.action === 'list.update')).toBe(true)
  })

  it('is office-only', () => {
    const api = createAppStore()
    const denied = addRecurringBooking(api, SOUTER, { anaesthetistId: ANAE.souter, dayOfWeek: 1, session: 'AM', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale })
    expect(denied.ok).toBe(false)
  })

  it('takes a kind (private, public or pre-op) and optional times, refusing anything else (catch-up Phase 28)', () => {
    const api = createAppStore()
    const base = { anaesthetistId: ANAE.souter, dayOfWeek: 3 as const, session: 'PM' as const, hospitalId: HOSP.aaRooms, surgeonId: SURG.patel }
    const free = addRecurringBooking(api, OFFICE, { ...base, kind: 'free' as never })
    expect(free.ok ? '' : free.code).toBe('invalidKind')
    const backwards = addRecurringBooking(api, OFFICE, { ...base, kind: 'preop', startTime: '15:00', endTime: '14:00' })
    expect(backwards.ok ? '' : backwards.code).toBe('invalidTimes')
    const ok = addRecurringBooking(api, OFFICE, { ...base, kind: 'preop', startTime: '13:30', endTime: '' })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(api.getState().masters.recurringBookings[ok.value.id]).toMatchObject({ kind: 'preop', startTime: '13:30' })
    if (ok.ok) expect(api.getState().masters.recurringBookings[ok.value.id]?.endTime).toBeUndefined()
  })
})

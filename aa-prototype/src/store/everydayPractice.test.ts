/**
 * The everyday data is the whole practice (`practiceAppState`: the core seed
 * and the 71 who join it). The unit tests run on the core seed (the scripted
 * demo's own figures); this file holds the practice to the same invariants,
 * and checks that the scripted demo around the 14 is left exactly as seeded.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { coreAppState, practiceAppState, type AppState } from './appStore'
import { openWarnings } from './warnings'
import { scanForNhiLeaks } from './privacyScan'
import { previewApplyAllRecurringBookings, rosterForDate } from './selectors'
import { isInPracticeOn, practiceAnaesthetistCount } from '../domain/anaesthetistStatus'
import { deltaOf } from './persistDelta'
import { reconcileAllConflicts } from '../domain/conflicts'
import { addDaysISO } from '../domain/clock'

const TODAY = '2026-11-24'
let core: AppState
let s: AppState

beforeAll(() => {
  core = coreAppState()
  s = practiceAppState()
}, 120_000)

const generated = (map: Record<string, unknown>, coreMap: Record<string, unknown>): string[] => Object.keys(map).filter((id) => coreMap[id] === undefined)

describe('the everyday practice', () => {
  it('is AA\'s whole company: 85 anaesthetists, each with sessions over the horizon', () => {
    expect(Object.keys(s.masters.anaesthetists)).toHaveLength(85)
    const withSlots = new Set(Object.values(s.schedule.slots).map((x) => x.anaesthetistId))
    // The two new starters join in January and February 2027; everyone has sessions by the horizon's end.
    expect(withSlots.size).toBe(85)
  })

  it('counts 84 anaesthetists on 24 Nov, 82 of them rostered: the leaver out, the two joiners in the count but without a session yet', () => {
    const all = Object.values(s.masters.anaesthetists)
    expect(practiceAnaesthetistCount(all, TODAY)).toBe(84)
    const rostered = new Set(rosterForDate(s, TODAY).map((a) => a.registrationNumber))
    expect(rostered.size).toBe(82)
    const notRostered = all.filter((a) => !rostered.has(a.registrationNumber))
    expect(notRostered.map((a) => [a.name, isInPracticeOn(a, TODAY)]).sort()).toEqual([
      ['Dr Kavya Reddy', true],
      ['Dr Minh Nguyen', true],
      ['Dr Oscar Reeves', false],
    ])
  })

  it('has one inactive colleague (Phase 52): Dr Reeves left on 20 Nov, with no Slot or List after it and no own Contract', () => {
    const inactive = Object.values(s.masters.anaesthetists).filter((a) => a.lastDayISO !== null)
    expect(inactive.map((a) => [a.name, a.lastDayISO, a.inactiveReason])).toEqual([['Dr Oscar Reeves', '2026-11-20', 'leftPractice']])
    const id = inactive[0]!.registrationNumber
    expect(Object.values(s.schedule.slots).filter((x) => x.anaesthetistId === id && x.dateISO > '2026-11-20')).toEqual([])
    expect(Object.values(s.schedule.lists).filter((l) => l.anaesthetistId === id && l.dateISO > '2026-11-20')).toEqual([])
    expect(Object.values(s.schedule.lists).some((l) => l.anaesthetistId === id && l.dateISO <= '2026-11-20')).toBe(true)
    expect(Object.values(s.masters.contracts).filter((c) => c.linkedAnaesthetistId === id)).toEqual([])
    // Nobody in the scripted cast is inactive.
    expect(Object.values(core.masters.anaesthetists).every((a) => a.lastDayISO === null)).toBe(true)
  })

  it('keeps every record of the core seed exactly, and its audit as the trail\'s start', () => {
    const maps: [string, Record<string, unknown>, Record<string, unknown>][] = [
      ['anaesthetists', core.masters.anaesthetists, s.masters.anaesthetists],
      ['surgeons', core.masters.surgeons, s.masters.surgeons],
      ['patients', core.masters.patients, s.masters.patients],
      ['contracts', core.masters.contracts, s.masters.contracts],
      ['slots', core.schedule.slots, s.schedule.slots],
      ['lists', core.schedule.lists, s.schedule.lists],
      ['bookings', core.schedule.bookings, s.schedule.bookings],
      ['procedures', core.schedule.procedures, s.schedule.procedures],
      ['invoices', core.billing.invoices, s.billing.invoices],
      ['ledger', core.billing.ledger, s.billing.ledger],
      ['xeroContacts', core.xero.contacts, s.xero.contacts],
    ]
    for (const [name, before, after] of maps) {
      for (const [id, record] of Object.entries(before)) expect(JSON.stringify(after[id]), `${name} ${id}`).toBe(JSON.stringify(record))
    }
    expect(JSON.stringify(s.audit.slice(0, core.audit.length))).toBe(JSON.stringify(core.audit))
    expect(s.officePrivate.pairingPreferences).toMatchObject(core.officePrivate.pairingPreferences)
  })

  it('leaves the scripted demo\'s queues as seeded: Review queue, intake, problems, payment runs, invoice numbers, settings', () => {
    const submitted = (x: AppState) => Object.values(x.schedule.lists).filter((l) => l.state === 'SUBMITTED').map((l) => l.id).sort()
    expect(submitted(s)).toEqual(submitted(core))
    expect(s.intake).toEqual(core.intake)
    expect(s.billing.exceptions).toEqual(core.billing.exceptions)
    expect(s.billing.payablesRuns).toEqual(core.billing.payablesRuns)
    expect(s.billing.disbursements).toEqual(core.billing.disbursements)
    expect(s.xero.batchPayments).toEqual(core.xero.batchPayments)
    expect(s.xero.disbursements).toEqual(core.xero.disbursements)
    expect(s.settings).toEqual(core.settings)
    expect(s.counters['invoiceNumber']).toBe(core.counters['invoiceNumber'])
    for (const id of generated(s.billing.invoices, core.billing.invoices)) expect(s.billing.invoices[id]!.invoiceNumber.startsWith('AA-S-'), id).toBe(true)
  })

  it('raises no warning the core seed does not', () => {
    const ids = (x: AppState) => openWarnings(x).map((r) => r.warning.key).sort()
    expect(ids(s)).toEqual(ids(core))
  })

  it('every past List of the 71 is billed, and none of their Draft Lists falls in the next four weeks', () => {
    const lists = generated(s.schedule.lists, core.schedule.lists).map((id) => s.schedule.lists[id]!)
    for (const l of lists) if (l.dateISO < TODAY && l.state !== 'DRAFT') expect(l.state, l.id).toBe('AUTHORISED')
    for (const l of lists) if (l.state === 'DRAFT') expect(l.dateISO > addDaysISO(TODAY, 28), l.id).toBe(true)
    const locked = lists.filter((l) => l.state === 'AUTHORISED')
    expect(locked.length).toBeGreaterThan(200)
  })

  it('is settled: conflicts reconciled, and applying every recurring booking now changes nothing', () => {
    expect(reconcileAllConflicts(s.schedule.lists, { holidays: s.masters.holidays, publicHolidays: s.masters.publicHolidays }, `${TODAY}T08:00:00`)).toBe(s.schedule.lists)
    // The S2 day's Southern Cross closure flags exactly the Lists it flagged in the core seed.
    const flaggedWed22 = (x: AppState) => Object.values(x.schedule.lists).filter((l) => l.dateISO === '2026-11-25' && l.conflicts.length > 0).map((l) => l.id).sort()
    expect(flaggedWed22(s)).toEqual(flaggedWed22(core))
    const plan = previewApplyAllRecurringBookings(s)
    const mentionsGenerated = (rows: readonly unknown[]): unknown[] => rows.filter((r) => JSON.stringify(r).includes('RB-FS-'))
    for (const rows of [plan.create, plan.update, plan.remove, plan.skipped, plan.draftUpdate, plan.draftRemove]) expect(mentionsGenerated(rows)).toEqual([])
  }, 60_000)

  it('holds no NHI outside the core platform and no personal details in Xero', () => {
    const report = scanForNhiLeaks(s)
    for (const area of report.areas) if (!area.heldByDesign) expect(area.hits, area.label).toEqual([])
  }, 60_000)

  it('saves as an empty delta untouched (persistDelta.ts)', () => {
    expect(deltaOf(s as unknown as Record<string, unknown>, s as unknown as Record<string, unknown>).top).toEqual({})
  })
})

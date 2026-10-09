/**
 * Seed tests — determinism, the canvas invariant, design-day fidelity (the
 * PM booking fees to the cent, Ellison in her pre-capture state), the ~80%
 * recurring-booking share of surgeon assignments, marker resolution and the
 * staged scenario states.
 */

import { assigned, assignedLists } from '../../test/lists'
import { describe, expect, it } from 'vitest'
import { buildSeed, ANAE, HOSP, SURG, SEED_LIST_IDS, SEED_MARKERS, SEED_LEAVE, SEED_SICKNESS, RECORDED_WINDOW, seedRecurringClashes } from './index'
import { conflictFactsFor, expectedConflicts, holidayIndex } from '../conflicts'
import { ANAESTHETISTS } from './cast'
import { RECURRING_BOOKINGS } from './recurringBookings'
import { DEMO_TODAY, enumerateDatesISO, horizonFor } from '../clock'
import { validateNhi } from '../nhi'
import { lookupNhi } from '../nzhis'
import { feeFor } from '../billing/fee'
import { validateBookingForBilling, type BookingBillingContext } from '../billing/validateBookingForBilling'
import type { Booking, List, Procedure } from '../types'
import type { SeedState } from './index'
import { parseISO } from 'date-fns'
import { displayStatusKey, projectedListId, slotIdFor } from '../slots'

/** Pre-horizon backdrop history (the store's `isBackdropList`; the domain test does not import the store). */
const isBackdropList = (l: Pick<List, 'id'>) => l.id.startsWith('L-HIST') || l.id.startsWith('L-RB-')

const seed = buildSeed()

function proceduresForBooking(state: SeedState, bookingId: string): Procedure[] {
  return Object.values(state.schedule.procedures)
    .filter((p) => p.bookingId === bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function billingContextFor(state: SeedState, booking: Booking): BookingBillingContext {
  const list = assigned(state.schedule.lists[booking.listId], `booking ${booking.id}`)
  const anaesthetist = state.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) throw new Error(`list ${list.id} has no anaesthetist`)
  const ctx: BookingBillingContext = {
    anaesthetist,
    rvgCodes: state.masters.rvgCodes,
    contracts: state.masters.contracts,
    contractPrices: Object.values(state.masters.contractPrices),
    insurers: state.masters.insurers,
    billableParties: state.masters.billableParties,
    billingLines: Object.values(state.schedule.billingLines),
  }
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
  return ctx
}

describe('seed determinism', () => {
  it('two builds are deep-equal', () => {
    expect(buildSeed()).toEqual(seed)
  })
})

describe('rich seeded Booking history', () => {
  it('gives every Booking a booking-to-clinical trail, including historical billing Bookings', () => {
    const auditByEntity = new Map<string, typeof seed.audit>()
    for (const entry of seed.audit) {
      const rows = auditByEntity.get(entry.entityId) ?? []
      rows.push(entry)
      auditByEntity.set(entry.entityId, rows)
    }

    for (const booking of Object.values(seed.schedule.bookings)) {
      const bookingRows = auditByEntity.get(booking.id) ?? []
      expect(
        bookingRows.filter((entry) => entry.action === 'booking.create'),
        `${booking.id} booking.create`,
      ).toHaveLength(1)

      const procedures = proceduresForBooking(seed, booking.id)
      expect(procedures.length, `${booking.id} has a Procedure`).toBeGreaterThan(0)
      const mergedRows = [...bookingRows]
      for (const procedure of procedures) {
        const procedureRows = auditByEntity.get(procedure.id) ?? []
        expect(
          procedureRows.filter((entry) => entry.action === 'procedure.create'),
          `${procedure.id} procedure.create`,
        ).toHaveLength(1)
        expect(
          procedureRows.some((entry) => entry.action === 'procedure.update'),
          `${procedure.id} procedure.update`,
        ).toBe(true)
        mergedRows.push(...procedureRows)

        const lines = Object.values(seed.schedule.billingLines).filter(
          (line) => line.procedureId === procedure.id,
        )
        for (const line of lines) {
          const lineRows = auditByEntity.get(line.id) ?? []
          expect(
            lineRows.filter((entry) => entry.action === 'billingLine.add'),
            `${line.id} billingLine.add`,
          ).toHaveLength(1)
          mergedRows.push(...lineRows)
        }
      }

      expect(mergedRows.length, `${booking.id} merged History rows`).toBeGreaterThanOrEqual(3)
      if (booking.completed) {
        expect(
          bookingRows.filter((entry) => entry.action === 'booking.complete'),
          `${booking.id} booking.complete`,
        ).toHaveLength(1)
      }
      if (booking.cancellation !== undefined) {
        expect(
          bookingRows.filter((entry) => entry.action === 'booking.cancel'),
          `${booking.id} booking.cancel`,
        ).toHaveLength(1)
      }
    }

    expect(auditByEntity.get('HBK01')?.map((entry) => entry.action)).toContain('booking.complete')
  })

  it('allocates the seed trail chronologically and leaves the next audit id free', () => {
    for (let index = 0; index < seed.audit.length; index += 1) {
      const entry = seed.audit[index]!
      expect(entry.id).toBe(`A${String(index + 1).padStart(4, '0')}`)
      if (index > 0) expect(entry.atISO >= seed.audit[index - 1]!.atISO).toBe(true)
    }
    expect(seed.counters.audit).toBe(seed.audit.length + 1)
    for (const entry of seed.audit.filter((row) => row.action === 'booking.create')) {
      expect(
        entry.atISO < `${DEMO_TODAY}T08:00:00`,
        `${entry.entityId} is booked by the reset clock`,
      ).toBe(true)
    }
  })
})

describe('the canvas (catch-up Phase 28: Slots and Lists)', () => {
  const horizon = horizonFor(DEMO_TODAY, seed.appSettings.schedule.horizonMonths)
  const dates = enumerateDatesISO(horizon.startISO, horizon.endISO)
  const slots = Object.values(seed.schedule.slots)
  // The seeded historical billed Lists (L-HIST-*) sit before the horizon and have no Slot record.
  // Assigned Lists only: a Draft List takes no session (catch-up Phase 31; its own tests are below).
  const lists = assignedLists(seed.schedule.lists).filter((l) => !isBackdropList(l))
  const listBySlot = new Map(lists.map((l) => [l.slotId, l]))
  const inWindow = (d: string) => d >= RECORDED_WINDOW.fromISO && d <= RECORDED_WINDOW.toISO

  it('holds exactly two Slots per active anaesthetist per day across the horizon, none before a start date', () => {
    const byKey = new Map<string, number>()
    for (const slot of slots) {
      const key = `${slot.anaesthetistId}|${slot.dateISO}`
      byKey.set(key, (byKey.get(key) ?? 0) + 1)
    }
    expect(slots.length).toBe(dates.length * ANAESTHETISTS.length * 2)
    for (const a of ANAESTHETISTS) {
      expect(a.active).toBe(true)
      // Every seeded start date precedes the horizon and the billing history.
      expect(a.startDateISO < horizon.startISO).toBe(true)
      for (const date of dates) expect(byKey.get(`${a.registrationNumber}|${date}`)).toBe(2)
    }
    for (const slot of slots) expect(slot.id).toBe(slotIdFor(slot.anaesthetistId, slot.dateISO, slot.session))
  })

  it('puts every List in one existing Slot, with the denormalised fields equal to the Slot\'s', () => {
    const seen = new Set<string>()
    for (const list of lists) {
      const slot = seed.schedule.slots[list.slotId]
      expect(slot, list.id).toBeDefined()
      expect(list.anaesthetistId).toBe(slot?.anaesthetistId)
      expect(list.dateISO).toBe(slot?.dateISO)
      expect(list.session).toBe(slot?.session)
      expect(seen.has(list.slotId), `two Lists in ${list.slotId}`).toBe(false)
      seen.add(list.slotId)
      expect(['private', 'public', 'preop']).toContain(list.kind)
    }
    // Backdrop history names a Slot before the horizon but no Slot record exists.
    for (const list of assignedLists(seed.schedule.lists).filter(isBackdropList)) {
      expect(seed.schedule.slots[list.slotId]).toBeUndefined()
      expect(list.dateISO < horizon.startISO).toBe(true)
    }
  })

  it('keeps List-only fields off empty Slots (no state, kind, hospital or surgeon)', () => {
    for (const slot of slots.filter((s) => !listBySlot.has(s.id))) {
      for (const key of ['state', 'kind', 'hospitalId', 'surgeonId', 'conflicts']) expect(key in slot, `${slot.id}.${key}`).toBe(false)
    }
  })

  it('outside the recorded window, invents nothing: every session is free, painted by the calendar, or holds a projected recurring booking', () => {
    const leave = new Set(SEED_LEAVE.map((w) => `${w.anaesthetistId}|${w.dateISO}|${w.session}`))
    const recurringKeys = new Set(RECURRING_BOOKINGS.map((t) => `${t.anaesthetistId}|${t.dayOfWeek}|${t.session}`))
    const outside = slots.filter((s) => !inWindow(s.dateISO))
    expect(outside.length).toBeGreaterThan(1000)
    for (const slot of outside) {
      const list = listBySlot.get(slot.id)
      if (list !== undefined) {
        expect(recurringKeys.has(`${slot.anaesthetistId}|${parseISO(slot.dateISO).getDay()}|${slot.session}`), slot.id).toBe(true)
        expect(list.id).toBe(projectedListId(slot.anaesthetistId, slot.dateISO, slot.session))
      } else if (slot.status !== 'free') {
        expect(leave.has(`${slot.anaesthetistId}|${slot.dateISO}|${slot.session}`), slot.id).toBe(true)
      }
    }
  })

  it('traces the recurring bookings the calendar blocked as clashes (pinned for Phase 31)', () => {
    const clashes = seedRecurringClashes()
    for (const c of clashes) {
      expect(seed.schedule.slots[c.slotId]?.status).not.toBe('free')
      expect(listBySlot.has(c.slotId)).toBe(false)
    }
    expect(clashes.length).toBe(PINNED_CLASHES)
  })

  it('uses every status colour somewhere in the horizon, through the one derivation', () => {
    const used = new Set(slots.map((s) => displayStatusKey(s, listBySlot.get(s.id))))
    for (const key of ['private', 'public', 'preop', 'holiday', 'unavailable', 'free']) {
      expect(used.has(key), `status ${key} in use`).toBe(true)
    }
  })

  it('derives roughly 80% of surgeon-assigned Lists in the recorded window from recurring bookings (0.7 to 0.9)', () => {
    const recurringKeys = new Set(
      RECURRING_BOOKINGS.filter((t) => t.surgeonId !== null).map(
        (t) => `${t.anaesthetistId}|${t.dayOfWeek}|${t.session}|${t.surgeonId}`,
      ),
    )
    const surgeonLists = lists.filter((l) => l.surgeonId !== undefined && inWindow(l.dateISO))
    const fromRecurring = surgeonLists.filter((l) =>
      recurringKeys.has(`${l.anaesthetistId}|${parseISO(l.dateISO).getDay()}|${l.session}|${l.surgeonId}`),
    )
    const share = fromRecurring.length / surgeonLists.length
    expect(surgeonLists.length).toBeGreaterThan(150)
    expect(share).toBeGreaterThanOrEqual(0.7)
    expect(share).toBeLessThanOrEqual(0.9)
  })

  it('paints the design day: Souter STG/Hale AM and SX/Patel PM, Rutherford all day Forte/Okafor', () => {
    const souterAm = seed.schedule.lists[SEED_LIST_IDS.souterAm21]
    const souterPm = seed.schedule.lists[SEED_LIST_IDS.souterPm21]
    const ruthAm = assigned(seed.schedule.lists[SEED_LIST_IDS.rutherfordAm21])
    const ruthPm = assigned(seed.schedule.lists[SEED_LIST_IDS.rutherfordPm21])
    expect(souterAm?.kind).toBe('private')
    expect(souterAm?.hospitalId).toBe('H-STG')
    expect(souterAm?.surgeonId).toBe('S-HALE')
    expect(souterPm?.hospitalId).toBe('H-SX')
    expect(souterPm?.surgeonId).toBe('S-PATEL')
    expect(ruthAm?.hospitalId).toBe('H-FORTE')
    expect(ruthAm?.surgeonId).toBe('S-OKAFOR')
    expect(ruthPm?.hospitalId).toBe('H-FORTE')
    expect(ruthPm?.surgeonId).toBe('S-OKAFOR')
    // Rutherford's Tue 21 PM keeps its own times, on the Slot.
    expect(seed.schedule.slots[ruthPm!.slotId]).toMatchObject({ startTime: '13:30', endTime: '17:00' })

    // Fitzgerald's recurring-booking-derived design days.
    const fitzTueAm = seed.schedule.lists[projectedListId(ANAE.fitzgerald, '2026-07-21', 'AM')]
    const fitzThuAm = seed.schedule.lists[projectedListId(ANAE.fitzgerald, '2026-07-23', 'AM')]
    const fitzThuPm = seed.schedule.lists[projectedListId(ANAE.fitzgerald, '2026-07-23', 'PM')]
    expect(fitzTueAm?.kind).toBe('private')
    expect(fitzTueAm?.hospitalId).toBe(HOSP.sx)
    expect(fitzTueAm?.surgeonId).toBe(SURG.doyle)
    expect(fitzThuAm?.hospitalId).toBe(HOSP.sx)
    expect(fitzThuAm?.surgeonId).toBe(SURG.patel)
    expect(fitzThuPm?.kind).toBe('preop')

    // The free design sessions are empty Slots, with their notes on the Slot.
    const sharmaPm = seed.schedule.slots[slotIdFor(ANAE.sharma, DEMO_TODAY, 'PM')]
    expect(sharmaPm).toMatchObject({ status: 'free', note: 'Free / open for cover' })
    expect(listBySlot.has(sharmaPm!.id)).toBe(false)
  })

  it('flags Lists on hospital holidays (conflict, never a status change)', () => {
    const conflicted = Object.values(seed.schedule.lists).filter(
      (l) => l.conflicts.some((c) => c.kind === 'holiday') && (l.dateISO === '2026-10-26' || l.dateISO === '2026-11-13'),
    )
    expect(conflicted.length).toBeGreaterThan(0)
    for (const list of conflicted) {
      expect(list.hospitalId).toBeDefined()
      expect(['private', 'public']).toContain(list.kind)
    }
  })

  it('seeds the schedule settings: four months, AM 07:30 to 12:30, PM 13:00 to 17:30', () => {
    expect(seed.appSettings.schedule).toEqual({
      horizonMonths: 4,
      defaultTimes: { AM: { startTime: '07:30', endTime: '12:30' }, PM: { startTime: '13:00', endTime: '17:30' } },
    })
    expect('availability' in seed.masters).toBe(false)
    expect(seed.counters['availability']).toBeUndefined()
  })
})

const PINNED_CLASHES = 18

/**
 * The seed's conflicts are facts (catch-up Phase 30). Before this phase the
 * seed flagged 15 Lists: Wed 22 Jul 2 (fabricated messages on Morrison PM and
 * Rutherford AM), Mon 26 Oct 8 and Fri 13 Nov 5 (Labour Day and Canterbury
 * Anniversary). After it, the same Lists plus the Southern Cross Wed 22
 * closure's three others (Ngata PM, Sharma PM, Hughes AM), each with a real
 * cause: Rutherford's office-recorded sickness and the closure HH900.
 */
const FLAGGED_BEFORE_PHASE_30 = [
  'L-25490-2026-07-22-PM',
  'L-25490-2026-10-26-AM',
  'L-27731-2026-10-26-PM',
  'L-27731-2026-11-13-AM',
  'L-29104-2026-07-22-AM',
  'L-29104-2026-10-26-AM',
  'L-31902-2026-10-26-AM',
  'L-31902-2026-11-13-AM',
  'L-34821-2026-10-26-AM',
  'L-34821-2026-10-26-PM',
  'L-36208-2026-11-13-AM',
  'L-38455-2026-11-13-AM',
  'L-44519-2026-10-26-PM',
  'L-45178-2026-11-13-AM',
  'L-46822-2026-10-26-AM',
]
const SOUTHERN_CROSS_WED22_ADDITIONS = ['L-38455-2026-07-22-PM', 'L-41267-2026-07-22-PM', 'L-46822-2026-07-22-AM']
/** Catch-up Phase 31: Dr Beaumont's Wed 22 recurring clashes at Southern Cross are Draft Lists, and carry HH900 like any List. */
const SOUTHERN_CROSS_WED22_DRAFT_LISTS = ['LD-RCB020-2026-07-22-AM', 'LD-RCB021-2026-07-22-PM']

describe('seed conflicts are facts (catch-up Phase 30)', () => {
  const lists = Object.values(seed.schedule.lists)
  const holidays = holidayIndex(seed.masters.holidays)

  it('every seeded conflict equals the one rule for its List: no fabricated flag, none missing', () => {
    for (const list of lists) {
      const expected = expectedConflicts(list, conflictFactsFor(list, { slots: seed.schedule.slots, statuses: seed.masters.slotStatuses, holidays }))
      expect(list.conflicts.map(({ raisedAtISO: _r, ...c }) => c), list.id).toEqual(expected)
    }
  })

  it('flags the pre-phase set plus the Southern Cross Wed 22 additions, and nothing else', () => {
    const flagged = lists.filter((l) => l.conflicts.length > 0).map((l) => l.id).sort()
    expect(flagged).toEqual([...FLAGGED_BEFORE_PHASE_30, ...SOUTHERN_CROSS_WED22_DRAFT_LISTS, ...SOUTHERN_CROSS_WED22_ADDITIONS].sort())
  })

  it('Rutherford Wed 22 AM: an office-recorded sickness, the List in place (it seeds no Bookings)', () => {
    const list = assigned(seed.schedule.lists[projectedListId(ANAE.rutherford, '2026-07-22', 'AM')])
    expect(seed.schedule.slots[list.slotId]).toMatchObject({ status: 'unavailable', note: SEED_SICKNESS.note })
    expect(list.conflicts).toMatchObject([{ kind: 'availability', statusKey: 'unavailable' }])
    const recorded = seed.audit.find((a) => a.action === 'session.status' && a.entityId === list.slotId)
    expect(recorded).toMatchObject({ role: 'office', who: 'Kirsty W.' })
  })

  it('the Southern Cross Wed 22 closure (HH900) flags every List there that day, Morrison PM included', () => {
    expect(seed.masters.holidays['HH900']).toMatchObject({ hospitalId: HOSP.sx, dateISO: '2026-07-22' })
    const sx = lists.filter((l) => l.dateISO === '2026-07-22' && l.hospitalId === HOSP.sx)
    expect(sx.map((l) => l.id).sort()).toEqual(['L-25490-2026-07-22-PM', ...SOUTHERN_CROSS_WED22_ADDITIONS, ...SOUTHERN_CROSS_WED22_DRAFT_LISTS].sort())
    for (const l of sx) expect(l.conflicts).toMatchObject([{ kind: 'holiday', holidayId: 'HH900' }])
  })

  it('keeps Tue 21 and every Souter session pristine', () => {
    expect(lists.filter((l) => l.dateISO === DEMO_TODAY && l.conflicts.length > 0)).toEqual([])
    const souterWindow = lists.filter((l) => l.anaesthetistId === ANAE.souter && l.dateISO <= '2026-08-16')
    expect(souterWindow.filter((l) => l.conflicts.length > 0)).toEqual([])
  })

  it('projected Lists carry their recurring booking; a hand-placed seed List does not', () => {
    expect(seed.schedule.lists[SEED_LIST_IDS.souterAm21]?.recurringBookingId).toMatch(/^RCB/)
    expect(seed.schedule.lists[SEED_LIST_IDS.rutherfordPm21]?.recurringBookingId).toBeUndefined()
  })
})

describe('patients & NHIs', () => {
  const patients = Object.values(seed.masters.patients)

  it('seeds ~150 patients, all ethnicity-coded from the demo subset', () => {
    expect(patients.length).toBeGreaterThanOrEqual(145)
    expect(patients.length).toBeLessThanOrEqual(155)
    for (const p of patients) {
      expect(p.ethnicityCode, `${p.hiddenInternalId} has ethnicity`).toBeDefined()
    }
  })

  it('every seeded NHI validates; both formats are present', () => {
    const formats = new Set<string>()
    for (const p of patients) {
      if (p.nhi === undefined) continue
      const verdict = validateNhi(p.nhi)
      expect(verdict.valid, `${p.name} ${p.nhi}: ${verdict.reason ?? ''}`).toBe(true)
      if (verdict.format !== null) formats.add(verdict.format)
    }
    expect(formats).toEqual(new Set(['current', 'new']))
  })

  it('includes the 5 canned lookupNhi patients, matching the Hub data', () => {
    for (const nhi of ['CQY9304', 'WQS3635', 'JKL1188', 'MYY54SL', 'RUE29KR']) {
      const hit = lookupNhi(nhi)
      expect(hit.found).toBe(true)
      const patient = patients.find((p) => p.nhi === nhi)
      expect(patient, `patient ${nhi} seeded`).toBeDefined()
      if (hit.found && patient !== undefined) {
        expect(patient.name).toBe(hit.name)
        expect(patient.dobISO).toBe(hit.dobISO)
      }
    }
  })

  it('seeds exactly one provisional no-NHI patient', () => {
    const provisional = patients.filter((p) => p.nhi === undefined)
    expect(provisional.length).toBe(1)
    expect(provisional[0]?.name).toBe('Noah Prescott')
  })
})

describe('design-day fees (the mockup figures, from the real calculator)', () => {
  const cases: Array<{ marker: string; total: number; units: number }> = [
    { marker: 'twoFunderBooking', total: 212, units: 8 },
  ]

  function feeForBooking(bookingId: string): { totals: number[]; unitSums: number[] } {
    const booking = seed.schedule.bookings[bookingId]
    if (booking === undefined) throw new Error(`missing booking ${bookingId}`)
    const list = assigned(seed.schedule.lists[booking.listId])
    const anaesthetist = seed.masters.anaesthetists[list.anaesthetistId]
    if (anaesthetist === undefined) throw new Error('missing context')
    const procedures = proceduresForBooking(seed, bookingId)
    const totals: number[] = []
    const unitSums: number[] = []
    procedures.forEach((procedure, index) => {
      const contract =
        procedure.governingContractId !== undefined
          ? seed.masters.contracts[procedure.governingContractId]
          : undefined
      const baseCode =
        procedure.rvgBaseCode !== undefined ? seed.masters.rvgCodes[procedure.rvgBaseCode] : undefined
      const nonRvgLines = Object.values(seed.schedule.billingLines).filter(
        (l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg',
      )
      const ctx: Parameters<typeof feeFor>[1] = {
        anaesthetist,
        contractPrices: Object.values(seed.masters.contractPrices),
        procedureOrdinal: index + 1,
        nonRvgLines,
      }
      if (contract !== undefined) ctx.contract = contract
      if (baseCode !== undefined) ctx.baseCode = baseCode
      if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
      const fee = feeFor(procedure, ctx)
      totals.push(fee.total)
      unitSums.push(fee.billableUnits)
    })
    return { totals, unitSums }
  }

  it('Tane: B6 T6 = 12 units, $318.00; Ellison pre-capture 8 units, $212.00', () => {
    const marker = SEED_MARKERS['designDayPmList']
    expect(marker).toBeDefined()
    const bookings = Object.values(seed.schedule.bookings)
      .filter((c) => c.listId === SEED_LIST_IDS.souterPm21)
      .sort((a, b) => a.id.localeCompare(b.id))
    expect(bookings.length).toBe(4)
    const [tane, marsh, chen, ellison] = bookings
    expect(tane && feeForBooking(tane.id)).toEqual({ totals: [318], unitSums: [12] })
    expect(marsh && feeForBooking(marsh.id)).toEqual({ totals: [185.5], unitSums: [7] })
    expect(chen && feeForBooking(chen.id)).toEqual({ totals: [238.5], unitSums: [9] })
    // Ellison seeds PRE-capture (no handover — the live Finish-now demo booking):
    // B7 + T0 + M1 (A1 + AS1) = 8 units at the SXAP $26.50. The post-capture
    // $344.50/13u and 41u/$1,086.50 mockup pins live in btmCapture.test.ts,
    // after a simulated Finish-now at 17:20 (Decisions log 2026-07-23).
    expect(ellison && feeForBooking(ellison.id)).toEqual({ totals: [212], unitSums: [8] })
    const all = bookings.map((c) => feeForBooking(c.id))
    expect(all.reduce((s, f) => s + (f.unitSums[0] ?? 0), 0)).toBe(36)
    expect(all.reduce((s, f) => s + (f.totals[0] ?? 0), 0)).toBeCloseTo(954, 2)
  })

  it('bariatric Type 3: $2,800 first procedure, $950 by the second-procedure ordinal rule', () => {
    const marker = SEED_MARKERS['bariatricType3Booking']
    expect(marker).toBeDefined()
    if (marker === undefined) return
    expect(feeForBooking(marker.entityId).totals).toEqual([2800, 950])
  })

  it('rate x time: 3 hours at $480 = $1,440', () => {
    const marker = SEED_MARKERS['rateTimeBooking']
    expect(marker).toBeDefined()
    if (marker === undefined) return
    expect(feeForBooking(marker.entityId).totals).toEqual([1440])
  })

  it('spot table entries hold', () => {
    // Keeps the table shape honest even though the named tests above cover it.
    for (const c of cases) {
      const marker = SEED_MARKERS[c.marker]
      expect(marker).toBeDefined()
      if (marker === undefined) continue
      const fee = feeForBooking(marker.entityId)
      expect(fee.totals[0]).toBeCloseTo(c.total, 2)
      expect(fee.unitSums[0]).toBe(c.units)
    }
  })
})

describe('scenario states', () => {
  it('every SEED_MARKER resolves to a live entity', () => {
    for (const [key, marker] of Object.entries(SEED_MARKERS)) {
      const pool =
        marker.entityType === 'list'
          ? seed.schedule.lists
          : marker.entityType === 'booking'
            ? seed.schedule.bookings
            : marker.entityType === 'procedure'
              ? seed.schedule.procedures
              : marker.entityType === 'patient'
                ? seed.masters.patients
                : seed.masters.contracts
      expect(marker.entityId, `${key} has an id`).not.toBe('')
      expect(
        (pool as Record<string, unknown>)[marker.entityId],
        `${key} -> ${marker.entityId} exists`,
      ).toBeDefined()
    }
  })

  it('the two-funder booking passes conservation via validateBookingForBilling', () => {
    const marker = SEED_MARKERS['twoFunderBooking']
    if (marker === undefined) throw new Error('marker missing')
    const booking = seed.schedule.bookings[marker.entityId]
    if (booking === undefined) throw new Error('booking missing')
    const failures = validateBookingForBilling(booking, proceduresForBooking(seed, booking.id), billingContextFor(seed, booking))
    expect(failures).toEqual([])
    const lines = Object.values(seed.schedule.billingLines).filter(
      (l) => proceduresForBooking(seed, booking.id).some((p) => p.id === l.procedureId),
    )
    expect(lines.some((l) => l.funderOverride !== undefined)).toBe(true)
    expect(lines.length).toBe(2)
  })

  it("the seeded review Lists' non-cancelled bookings are completed and valid", () => {
    for (const listId of [
      SEED_LIST_IDS.morrisonMon20,
      SEED_LIST_IDS.whitakerFri17,
      SEED_LIST_IDS.souterMon20Am,
      SEED_LIST_IDS.souterMon20Pm,
    ]) {
      const list = seed.schedule.lists[listId]
      expect(list?.state).toBe('SUBMITTED')
      const bookings = Object.values(seed.schedule.bookings).filter((c) => c.listId === listId)
      expect(bookings.length).toBeGreaterThan(0)
      for (const booking of bookings) {
        if (booking.cancellation !== undefined) continue
        expect(booking.completed, `${booking.id} completed`).toBe(true)
        const failures = validateBookingForBilling(booking, proceduresForBooking(seed, booking.id), billingContextFor(seed, booking))
        expect(failures, `${booking.id} valid`).toEqual([])
      }
    }
  })

  it('the cancelled booking sits on a SUBMITTED list with its cancel audited', () => {
    const marker = SEED_MARKERS['cancelledBooking']
    if (marker === undefined) throw new Error('marker missing')
    const booking = seed.schedule.bookings[marker.entityId]
    expect(booking?.cancellation?.reason).toContain('postponed')
    const list = booking !== undefined ? seed.schedule.lists[booking.listId] : undefined
    expect(list?.state).toBe('SUBMITTED')
    expect(seed.audit.some((a) => a.entityId === marker.entityId && a.action === 'booking.cancel')).toBe(true)
  })

  it('exactly the two marked hospital-route procedures are missing billing references', () => {
    const missing = Object.values(seed.schedule.procedures).filter(
      (p) => p.billingRoute === 'hospital' && p.billingReference === undefined,
    )
    const expected = [
      SEED_MARKERS['missingBillingRef1']?.entityId,
      SEED_MARKERS['missingBillingRef2']?.entityId,
    ]
    expect(missing.map((p) => p.id).sort()).toEqual([...expected].sort())
  })

  it('seeds the staged submit audit entries', () => {
    const submits = seed.audit.filter((a) => a.action === 'list.submit')
    expect(submits.map((s) => s.entityId).sort()).toEqual(
      [
        SEED_LIST_IDS.morrisonMon20,
        SEED_LIST_IDS.whitakerFri17,
        SEED_LIST_IDS.souterMon20Am,
        SEED_LIST_IDS.souterMon20Pm,
        SEED_LIST_IDS.billingFailure,
      ].sort(),
    )
  })
})

describe('Booking id numbering (catch-up Phase 15)', () => {
  // The Card to Booking rename changed only the prefix: allocation order, and so
  // every number, is unchanged. The legacy `/cards/` redirect relies on it.
  function pin(bookingId: string) {
    const booking = seed.schedule.bookings[bookingId]
    const list = booking !== undefined ? seed.schedule.lists[booking.listId] : undefined
    return {
      patient: booking !== undefined ? seed.masters.patients[booking.patientId]?.name : undefined,
      anaesthetist: list?.anaesthetistId,
      dateISO: list?.dateISO,
      session: list?.session,
    }
  }

  it('BK0001 is Hemi Walker on Dr Souter\'s Tue 21 AM List', () => {
    expect(pin('BK0001')).toEqual({ patient: 'Hemi Walker', anaesthetist: ANAE.souter, dateISO: '2026-07-21', session: 'AM' })
  })

  it('BK0009 is Margaret Ellison on Dr Souter\'s Tue 21 PM List', () => {
    expect(pin('BK0009')).toEqual({ patient: 'Margaret Ellison', anaesthetist: ANAE.souter, dateISO: '2026-07-21', session: 'PM' })
  })

  it('no Booking or history Booking keeps a legacy Card id', () => {
    const ids = Object.keys(seed.schedule.bookings)
    expect(ids.every((id) => /^(BK\d{4}|HBK\d+)$/.test(id))).toBe(true)
    expect(ids.some((id) => id.startsWith('HBK'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Draft Lists and the pairing rule (catch-up Phase 31)
// ---------------------------------------------------------------------------

/** Every seeded Draft List: three requests and the recurring clashes from today on (OQ-81 part 2). */
const SEEDED_DRAFT_LISTS = [
  'LD-001',
  'LD-002',
  'LD-003',
  'LD-RCB013-2026-09-15-AM',
  'LD-RCB014-2026-09-16-PM',
  'LD-RCB016-2026-07-21-AM',
  'LD-RCB020-2026-07-22-AM',
  'LD-RCB021-2026-07-22-PM',
  'LD-RCB022-2026-07-24-AM',
  'LD-RCB027-2026-08-25-AM',
  'LD-RCB028-2026-08-25-PM',
  'LD-RCB029-2026-08-27-AM',
  'LD-RCB030-2026-08-27-PM',
  'LD-RCB044-2026-07-27-PM',
  'LD-RCB045-2026-07-22-AM',
]

describe('seeded Draft Lists (catch-up Phase 31; FT-01.6, US-01.6.1, OQ-81 part 2)', () => {
  const all = Object.values(seed.schedule.lists)
  const drafts = all.filter((l) => l.state === 'DRAFT')

  it('pins the fifteen: three requests and twelve recurring clashes', () => {
    expect(drafts.map((l) => l.id).sort()).toEqual(SEEDED_DRAFT_LISTS)
    expect(drafts.filter((l) => l.draft?.origin === 'request')).toHaveLength(3)
    expect(drafts.filter((l) => l.draft?.origin === 'recurringClash')).toHaveLength(12)
  })

  it('every Draft List is DRAFT with a hospital and surgeon that resolve and neither anaesthetist nor session; every other List has both', () => {
    for (const l of all) {
      expect(seed.masters.hospitals[l.hospitalId], `${l.id} hospital`).toBeDefined()
      expect(seed.masters.surgeons[l.surgeonId], `${l.id} surgeon`).toBeDefined()
      if (l.state === 'DRAFT') {
        expect(l.anaesthetistId, l.id).toBeUndefined()
        expect(l.slotId, l.id).toBeUndefined()
        expect(l.draft, l.id).toBeDefined()
      } else {
        expect(l.anaesthetistId, l.id).toBeDefined()
        expect(l.slotId, l.id).toBeDefined()
      }
    }
  })

  it('the requests take no session: Fitzgerald Tue 21 PM and Souter Wed 22 PM are open, and the seed stamps are constants', () => {
    const open = (a: string, d: string, s: 'AM' | 'PM') => {
      const slot = seed.schedule.slots[slotIdFor(a, d, s)]!
      return slot.status === 'free' && !all.some((l) => l.slotId === slot.id)
    }
    expect(open(ANAE.fitzgerald, DEMO_TODAY, 'PM')).toBe(true)
    expect(open(ANAE.souter, '2026-07-22', 'PM')).toBe(true)
    expect(seed.schedule.lists['LD-001']).toMatchObject({ hospitalId: HOSP.stg, surgeonId: SURG.tan, dateISO: DEMO_TODAY, session: 'PM', draft: { origin: 'request', source: 'phone', sinceISO: '2026-07-20T15:40:00', by: 'Kirsty W.' } })
    expect(seed.schedule.lists['LD-003']).toMatchObject({ hospitalId: HOSP.ces, surgeonId: SURG.reid, dateISO: '2026-07-27', session: 'AM', draft: { sinceISO: '2026-07-17T09:50:00' } })
  })

  it('LD-002 holds two active Bookings with a procedure each, on no prepaid category, and fits Souter\'s open Wed 22 PM', () => {
    const bookings = Object.values(seed.schedule.bookings).filter((b) => b.listId === 'LD-002')
    expect(bookings.map((b) => b.id)).toEqual(['BK0160', 'BK0161'])
    for (const b of bookings) {
      expect(b.cancellation).toBeUndefined()
      const procs = proceduresForBooking(seed, b.id)
      expect(procs).toHaveLength(1)
      expect(procs[0]).toMatchObject({ billingRoute: 'billableParty', patientPaymentCategory: 'selfFundedPostProcedure' })
      expect(procs[0]!.rvgBaseCode).toBeDefined()
    }
    expect(seed.schedule.lists['LD-002']).toMatchObject({ dateISO: '2026-07-22', session: 'PM', hospitalId: HOSP.forte })
  })

  it('every recurring booking running on a closed session from today on has exactly one Draft List for it, with no availability conflict; no past day has one', () => {
    for (const clash of seedRecurringClashes()) {
      const slot = seed.schedule.slots[clash.slotId]!
      const matching = drafts.filter((l) => l.draft?.projectedFor?.recurringBookingId === clash.recurringBookingId && l.draft.projectedFor.dateISO === slot.dateISO && l.draft.projectedFor.session === slot.session)
      expect(matching, clash.slotId).toHaveLength(slot.dateISO >= DEMO_TODAY ? 1 : 0)
      for (const l of matching) {
        expect(l.recurringBookingId).toBe(clash.recurringBookingId)
        expect(l.conflicts.some((c) => c.kind === 'availability')).toBe(false)
      }
    }
    // The closed sessions keep their status: the clash takes no session.
    expect(seed.schedule.slots[slotIdFor(ANAE.ngata, DEMO_TODAY, 'AM')]?.status).toBe('unavailable')
  })

  it('the S2 not-preferred beat is reachable: Dr Sharma is open on Thu 23 PM (the canned Reid request) and Mon 27 AM (LD-003)', () => {
    for (const [d, s] of [['2026-07-23', 'PM'], ['2026-07-27', 'AM']] as const) {
      const slot = seed.schedule.slots[slotIdFor(ANAE.sharma, d, s)]!
      expect(slot.status).toBe('free')
      expect(all.some((l) => l.slotId === slot.id)).toBe(false)
    }
  })

  it('the pre-op Lists are at the AA rooms location and the acute Lists name a surgeon; AA rooms is a location, never a hospital feed', () => {
    const preop = all.filter((l) => l.kind === 'preop' && !isBackdropList(l))
    expect(preop.length).toBeGreaterThan(0)
    for (const l of preop) expect(l.hospitalId, l.id).toBe(HOSP.aaRooms)
    expect(seed.masters.hospitals[HOSP.aaRooms]).toMatchObject({ name: 'AA rooms', locationType: 'aaRooms' })
    expect(Object.values(seed.masters.hospitals).filter((h) => h.locationType === 'aaRooms')).toHaveLength(1)
    expect(Object.values(seed.masters.holidays).some((h) => h.hospitalId === HOSP.aaRooms)).toBe(false)
    for (const rb of Object.values(seed.masters.recurringBookings)) {
      expect(seed.masters.hospitals[rb.hospitalId], rb.id).toBeDefined()
      expect(seed.masters.surgeons[rb.surgeonId], rb.id).toBeDefined()
    }
  })
})

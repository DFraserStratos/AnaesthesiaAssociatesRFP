/**
 * The seeded procedure texts and AR-35's illustrative wording (catch-up Phase
 * 20a; US-02.5.7, US-08.4.6). The AR-35 rows are found by patient and List,
 * not by a new id; existing ids are pinned by `canvasGolden.test.ts`.
 */

import { describe, expect, it } from 'vitest'
import { buildSeed, RTK_BOOKING_ID, SEED_LIST_IDS, SEED_MARKERS, SOURCE_WORDING_BOOKING_IDS } from './index'
import { projectedListId } from '../slots'
import { ANAE } from './cast'
import { SOURCE_WORDING } from './sourceWording'
import { contractInvoiceDescriptionFor, startingInvoiceDescription } from '../billing/procedureStack'
import type { Procedure } from '../types'

const seed = buildSeed()
const procedures = Object.values(seed.schedule.procedures)
const firstOf = (bookingId: string): Procedure =>
  procedures.filter((p) => p.bookingId === bookingId).sort((a, b) => a.id.localeCompare(b.id))[0]!
const onList = (listId: string) => Object.values(seed.schedule.bookings).filter((b) => b.listId === listId)
const textsOn = (listId: string) => onList(listId).map((b) => firstOf(b.id).procedureText?.text)

describe('every seeded Procedure\'s text', () => {
  it('no seeded text is blank, each has a source and a time before the demo clock', () => {
    for (const p of procedures) {
      if (p.procedureText === null) continue
      expect(p.procedureText.text.trim(), p.id).not.toBe('')
      expect(p.procedureText.receivedAtISO < '2026-07-21T08:00:00', p.id).toBe(true)
    }
  })

  it('the migration keeps every former description as the text, its source from the Booking\'s', () => {
    // A sample across builders: the design day, the Merivale addition and a history Booking.
    const ellison = firstOf(SEED_MARKERS.pendingCaptureBooking!.entityId)
    expect(ellison.procedureText).toMatchObject({ text: 'Left total hip replacement' })
    const merivale = procedures.find((p) => p.procedureText?.text === 'Face lift')!
    expect(merivale.procedureText?.source).toBe('hospitalDownload')
    const history = procedures.find((p) => p.bookingId.startsWith('HBK'))!
    expect(history.procedureText?.source).toBe('unrecorded')
  })

  it('every invoice description is the order of defaults over its text and Contract (no seeded edit)', () => {
    for (const p of procedures) {
      expect(p.invoiceDescription, p.id).toEqual(startingInvoiceDescription(p.procedureText, contractInvoiceDescriptionFor(p, seed.masters.contracts)))
    }
    const origins = new Set(procedures.map((p) => p.invoiceDescription?.origin))
    for (const o of ['rooms', 'hospital', 'contract', 'entered']) expect(origins.has(o as 'rooms'), o).toBe(true)
  })

  it('is deterministic (two builds deep-equal)', () => {
    expect(buildSeed()).toEqual(seed)
  })
})

describe("AR-35's rows, placed as the plan's table says", () => {
  it('the S1 List: rows 6 and 8 on the 07:45 and 11:15 cases, the 09:45 case unchanged, three Bookings', () => {
    const list = projectedListId(ANAE.souter, '2026-07-28', 'AM')
    const rows = onList(list).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''))
    expect(rows.map((b) => b.scheduledTime)).toEqual(['07:45', '09:45', '11:15'])
    expect(firstOf(rows[0]!.id).procedureText).toMatchObject({ text: SOURCE_WORDING[6].asReceived, source: 'surgeonPdf' })
    expect(firstOf(rows[2]!.id).procedureText).toMatchObject({ text: SOURCE_WORDING[8].asReceived, source: 'email' })
  })

  it('the "RTK" Booking holds "right total knee" (hospital) on Tue 4 Aug AM, and its history "RTK" (rooms) earlier', () => {
    const booking = seed.schedule.bookings[RTK_BOOKING_ID]!
    expect(booking.listId).toBe(projectedListId(ANAE.souter, '2026-08-04', 'AM'))
    expect(booking.scheduledTime).toBe('09:30')
    const p = firstOf(RTK_BOOKING_ID)
    expect(p.procedureText).toMatchObject({ text: 'right total knee', source: 'hospitalDownload' })
    expect(p.invoiceDescription).toEqual({ text: 'right total knee', origin: 'hospital' })
    expect(seed.masters.rvgGroups[p.rvgGroupId!]?.code).toBe('LL4')
    const replace = seed.audit.find((a) => a.action === 'procedure.procedureText.replace' && a.entityId === p.id)!
    expect(replace.before).toMatchObject({ procedureText: { text: 'RTK', source: 'surgeonPdf' } })
  })

  it("Foster's S14 target holds only the rooms' \"WLE MM\" before firing, with no RVG code, on No contract · RVG", () => {
    const p = firstOf(SEED_MARKERS.integrationS14!.entityId)
    expect(p.procedureText).toMatchObject({ text: 'WLE MM', source: 'surgeonPdf' })
    expect(p.rvgGroupId).toBeUndefined()
    expect(p.governingContractId).toBe('CT-NO-CONTRACT')
  })

  it('the expert rows sit on Dr Souter\'s forward Lists with their sources and codes', () => {
    const tue28pm = textsOn(projectedListId(ANAE.souter, '2026-07-28', 'PM'))
    expect(tue28pm).toEqual(expect.arrayContaining([SOURCE_WORDING[15].asReceived, SOURCE_WORDING[17].asReceived]))
    const thu30am = textsOn(projectedListId(ANAE.souter, '2026-07-30', 'AM'))
    expect(thu30am).toEqual(expect.arrayContaining([SOURCE_WORDING[21].asReceived, SOURCE_WORDING[34].asReceived, SOURCE_WORDING[35].asReceived]))
    const byText = (t: string) => procedures.find((p) => p.procedureText?.text === t)!
    expect(byText('L3-5 decomp + fusion').procedureText?.source).toBe('email')
    expect(seed.masters.rvgGroups[byText('L3-5 decomp + fusion').rvgGroupId!]?.code).toBe('S9b')
    expect(seed.masters.rvgGroups[byText('hystero D&C').rvgGroupId!]?.code).toBe('P1')
    for (const t of ['gastro/colon', 'blephs', 'EUA +/- cysto +/- biopsy']) expect(byText(t).rvgGroupId, t).toBeUndefined()
  })

  it('today\'s and S3\'s Lists read as received: rows 3, 11, 13 and 25', () => {
    const am21 = textsOn(SEED_LIST_IDS.souterAm21)
    expect(am21).toContain(SOURCE_WORDING[3].asReceived)
    const pm21 = textsOn(projectedListId(ANAE.souter, '2026-07-21', 'PM'))
    expect(pm21).toEqual(expect.arrayContaining([SOURCE_WORDING[11].asReceived, SOURCE_WORDING[13].asReceived]))
    expect(textsOn(projectedListId(ANAE.morrison, '2026-07-20', 'AM'))).toContain(SOURCE_WORDING[25].asReceived)
  })

  it('a Contract invoice description shows on the Doyle Booking', () => {
    expect(procedures.find((p) => p.invoiceDescription?.origin === 'contract' && p.invoiceDescription.text === 'Gastric bypass, laparoscopic')).toBeDefined()
  })

  it('each new Booking uses a generated patient with no other Booking that day, and has a Contract', () => {
    expect(SOURCE_WORDING_BOOKING_IDS).toHaveLength(6)
    for (const id of SOURCE_WORDING_BOOKING_IDS) {
      const booking = seed.schedule.bookings[id]!
      const date = seed.schedule.lists[booking.listId]!.dateISO
      const sameDay = Object.values(seed.schedule.bookings).filter(
        (b) => b.patientId === booking.patientId && b.id !== id && seed.schedule.lists[b.listId]?.dateISO === date,
      )
      expect(sameDay, id).toHaveLength(0)
      expect(firstOf(id).governingContractId, id).toBeDefined()
    }
  })
})

import { describe, expect, it } from 'vitest'
import { closuresAt, closuresFor, closuresIndex, closureLabel } from './holidays'
import { buildSeed } from './seed'
import { closureSourcesOf } from './holidays'
import type { HospitalHoliday, PublicHoliday } from './types'

const hh = (id: string, hospitalId: string, dateISO: string, name = 'Closure'): HospitalHoliday => ({ id, hospitalId, dateISO, name })
const ph = (id: string, dateISO: string, openHospitalIds: string[] = [], name = 'Labour Day'): PublicHoliday => ({
  id,
  dateISO,
  name,
  kind: 'national',
  openHospitalIds,
})

describe('closuresFor (catch-up Phase 42)', () => {
  it('a public holiday closes every hospital', () => {
    const sources = { hospitalHolidays: [], publicHolidays: [ph('PH1', '2026-10-26')] }
    for (const h of ['H-STG', 'H-SX', 'H-AAROOMS', 'H-RETIRED']) {
      expect(closuresFor('2026-10-26', h, sources)).toEqual([{ source: 'public', publicHolidayId: 'PH1', name: 'Labour Day' }])
    }
    expect(closuresFor('2026-10-27', 'H-STG', sources)).toEqual([])
  })

  it('a hospital listed open that day is excluded', () => {
    const sources = { hospitalHolidays: [], publicHolidays: [ph('PH1', '2026-10-26', ['H-CPH'])] }
    expect(closuresFor('2026-10-26', 'H-CPH', sources)).toEqual([])
    expect(closuresFor('2026-10-26', 'H-STG', sources)).toHaveLength(1)
  })

  it('a hospital holiday and a public holiday on the same day give two closures, its own first', () => {
    const sources = { hospitalHolidays: [hh('HH2', 'H-SX', '2026-10-26', 'Lift repairs')], publicHolidays: [ph('PH1', '2026-10-26')] }
    expect(closuresFor('2026-10-26', 'H-SX', sources).map((c) => c.source)).toEqual(['hospital', 'public'])
    expect(closuresFor('2026-10-26', 'H-SX', sources).map(closureLabel)).toEqual(['Lift repairs', 'Labour Day (public holiday)'])
  })

  it('the index is stable for equal input, whatever the order', () => {
    const a = closuresIndex({ hospitalHolidays: [hh('HH2', 'H-SX', '2026-10-26'), hh('HH1', 'H-SX', '2026-10-26')], publicHolidays: [ph('PH2', '2026-10-26'), ph('PH1', '2026-10-26')] })
    const b = closuresIndex({ hospitalHolidays: [hh('HH1', 'H-SX', '2026-10-26'), hh('HH2', 'H-SX', '2026-10-26')], publicHolidays: [ph('PH1', '2026-10-26'), ph('PH2', '2026-10-26')] })
    expect(closuresAt(a, '2026-10-26', 'H-SX')).toEqual(closuresAt(b, '2026-10-26', 'H-SX'))
    expect(closuresAt(a, '2026-10-26', 'H-SX').map((c) => (c.source === 'hospital' ? c.holidayId : c.publicHolidayId))).toEqual(['HH1', 'HH2', 'PH1', 'PH2'])
  })
})

describe('the seeded master calendar (catch-up Phase 42)', () => {
  const seed = buildSeed()

  it('holds PH001 to PH007 in date order; no hospital holiday is a statutory day', () => {
    const rows = Object.values(seed.masters.publicHolidays).sort((a, b) => a.id.localeCompare(b.id))
    expect(rows.map((r) => r.id)).toEqual(['PH001', 'PH002', 'PH003', 'PH004', 'PH005', 'PH006', 'PH007'])
    expect(rows.map((r) => r.dateISO)).toEqual([...rows.map((r) => r.dateISO)].sort())
    expect(rows[1]).toMatchObject({ name: 'Canterbury Anniversary Day', kind: 'regional', region: 'Canterbury' })
    for (const h of Object.values(seed.masters.holidays)) {
      expect(['Labour Day', 'Canterbury Anniversary Day']).not.toContain(h.name)
    }
  })

  it('Labour Day still closes every hospital for a reader of the closures (not AA rooms, as before)', () => {
    const sources = closureSourcesOf(seed.masters)
    for (const h of Object.values(seed.masters.hospitals)) {
      const closed = closuresFor('2026-10-26', h.id, sources).length > 0
      expect(closed, h.id).toBe(h.locationType === 'hospital')
    }
  })
})

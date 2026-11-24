/**
 * Catch-up Phase 42: the per-hospital Labour Day and Canterbury Anniversary
 * rows moved to the master public-holiday calendar, and the flagged-List set
 * did not move. The baseline is the seed's set before the move (taken at the
 * phase's drift check, HEAD cd213e2e): only the cause key changes,
 * `holiday:HH0xx` to `publicHoliday:PH001` (odd rows, Labour Day) or `PH002`
 * (even rows, Canterbury Anniversary Day).
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from './index'

const BEFORE = [
  'L-25490-2026-07-22-PM holiday:HH900',
  'L-25490-2026-10-26-AM holiday:HH001',
  'L-27731-2026-11-13-AM holiday:HH002',
  'L-29104-2026-10-26-AM holiday:HH003',
  'L-31902-2026-10-26-AM holiday:HH001',
  'L-31902-2026-11-13-AM holiday:HH008',
  'L-34821-2026-10-26-AM holiday:HH005',
  'L-34821-2026-10-26-PM holiday:HH001',
  'L-38455-2026-07-22-PM holiday:HH900',
  'L-38455-2026-11-13-AM holiday:HH006',
  'L-41267-2026-07-22-PM holiday:HH900',
  'L-44519-2026-10-26-PM holiday:HH003',
  'L-45178-2026-11-13-AM holiday:HH008',
  'L-46822-2026-07-22-AM holiday:HH900',
  'LD-RCB020-2026-07-22-AM holiday:HH900',
  'LD-RCB021-2026-07-22-PM holiday:HH900',
]

function moved(row: string): string {
  const [listId, cause] = row.split(' ')
  const m = /^holiday:HH0(\d\d)$/.exec(cause!)
  if (m === null) return row
  return `${listId} publicHoliday:${Number(m[1]) % 2 === 1 ? 'PH001' : 'PH002'}`
}

describe('the public-holiday migration (catch-up Phase 42)', () => {
  it('flags the same hospital-closure Lists; the public-holiday ones are no longer made (recurring Lists skip public holidays, 24 Nov 2026)', () => {
    const seed = buildSeed()
    const now: string[] = []
    for (const l of Object.values(seed.schedule.lists)) for (const c of l.conflicts) now.push(`${l.id} ${c.cause}`)
    const publicRows = BEFORE.map(moved).filter((r) => r.includes('publicHoliday:'))
    expect(publicRows.length).toBe(10)
    expect(now.sort()).toEqual(BEFORE.map(moved).filter((r) => !r.includes('publicHoliday:')).sort())
    for (const row of publicRows) expect(seed.schedule.lists[row.split(' ')[0]!], row).toBeUndefined()
  })

  it('two builds deep-equal', () => {
    expect(buildSeed().masters.publicHolidays).toEqual(buildSeed().masters.publicHolidays)
    expect(buildSeed().schedule.lists).toEqual(buildSeed().schedule.lists)
  })
})

import { describe, expect, it } from 'vitest'
import type { Contract } from './contracts'
import { nameWords, namesSimilar, similarContracts } from './contractSimilarity'

type Held = Pick<Contract, 'id' | 'name' | 'status' | 'systemRole' | 'holderId'>

const held = (id: string, name: string, extra: Partial<Held> = {}): Held => ({ id, name, status: 'active', holderId: 'PY-MER', ...extra })

describe('nameWords', () => {
  it('lowercases, drops punctuation, plurals and filler words', () => {
    expect(nameWords('Abdominoplasty, with Liposuction!')).toEqual(['abdominoplasty', 'liposuction'])
    expect(nameWords('Implants and the Grafts')).toEqual(['implant', 'graft'])
    expect(nameWords('Glass')).toEqual(['glass'])
  })
})

describe('namesSimilar', () => {
  it('matches on the first remaining word (the criterion)', () => {
    expect(namesSimilar('Abdominoplasty with liposuction', 'Abdominoplasty, simple')).toBe(true)
  })
  it('does not match unrelated names', () => {
    expect(namesSimilar('Abdominoplasty with liposuction', 'Face lift')).toBe(false)
    expect(namesSimilar('Face lift', 'Abdominoplasty, simple')).toBe(false)
  })
  it('matches on half the shorter name', () => {
    expect(namesSimilar('Revision rhinoplasty', 'Rhinoplasty')).toBe(true)
    expect(namesSimilar('Left breast reduction', 'Bilateral breast reduction')).toBe(true)
  })
  it('ignores case, punctuation and plurals', () => {
    expect(namesSimilar('BREAST IMPLANTS', 'breast implant.')).toBe(true)
  })
})

describe('similarContracts', () => {
  const list: Held[] = [
    held('C1', 'Abdominoplasty, simple'),
    held('C2', 'Face lift'),
    held('C3', 'Abdominoplasty extended', { status: 'disabled' }),
    held('C4', 'Abdominoplasty with liposuction'),
    held('C5', 'Abdominoplasty revision'),
    held('C6', 'Abdominoplasty, other holder', { holderId: 'PY-OTHER' }),
    held('C7', 'Abdominoplasty fallback', { systemRole: 'openPriceFallback' }),
  ]

  it('lists the similar ones: same name first, Active before Disabled, then by name', () => {
    expect(similarContracts('Abdominoplasty with liposuction', list, 'PY-MER').map((c) => c.id)).toEqual(['C4', 'C5', 'C1', 'C3'])
  })
  it('keeps a Disabled match, with its status', () => {
    const found = similarContracts('Abdominoplasty', list, 'PY-MER').find((c) => c.id === 'C3')
    expect(found?.status).toBe('disabled')
  })
  it("ignores another holder's Contracts and system Contracts", () => {
    const ids = similarContracts('Abdominoplasty', list, 'PY-MER').map((c) => c.id)
    expect(ids).not.toContain('C6')
    expect(ids).not.toContain('C7')
  })
  it('finds nothing for "Face lift" among the Abdominoplasty names', () => {
    expect(similarContracts('Face lift', list.filter((c) => c.id !== 'C2'), 'PY-MER')).toEqual([])
  })
  it('finds an identical name', () => {
    expect(similarContracts('face lift', list, 'PY-MER').map((c) => c.id)).toEqual(['C2'])
  })
  it('matches nothing on a blank or two-letter name', () => {
    expect(similarContracts('', list)).toEqual([])
    expect(similarContracts('  ', list)).toEqual([])
    expect(similarContracts('Ab', list)).toEqual([])
  })
})

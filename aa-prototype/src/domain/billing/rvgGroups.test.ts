import { describe, expect, it } from 'vitest'
import {
  baseUnitsFor,
  baseUnitsShort,
  baseUnitsText,
  defaultPickerRows,
  guideText,
  isOutsideGuide,
  outsideGuideText,
  resolveStartingUnits,
  rvgGroupLabel,
  rvgGroupPickRefusal,
  rvgGroupRefusal,
  searchRvgGroups,
  type RvgGroup,
} from './rvgGroups'

const row = (id: string, code: string, baseUnits: number, extra: Partial<RvgGroup> = {}): RvgGroup => ({
  id,
  code,
  description: `${code} description`,
  anatomy: 'Head',
  baseUnits,
  modifierUnits: 0,
  retired: false,
  ...extra,
})

const H1 = row('g1', 'H1', 4, { description: 'Minor procedures, e.g. myringotomies' })
const H1_AA = row('g2', 'H1', 5, { description: 'Brow lift' })
const H10 = row('g3', 'H10', 6, { description: 'Not a guide code' })
const H4 = row('g4', 'H4', 10, { description: 'Complex procedures', baseUnitsRange: { min: 10, max: 12 } })
const T2_MINOR = row('g5', 'T2', 4, { anatomy: 'Thorax', description: 'Breast, minor procedures' })
const T2_SIMPLE = row('g6', 'T2', 5, { anatomy: 'Thorax', description: 'Breast, wide local excision' })
const RETIRED = row('g7', 'H1', 7, { description: 'Old H1 row', retired: true })
const A3 = row('g8', 'A3', 6, { anatomy: 'Abdomen', description: 'Moderate procedures, e.g. appendectomy' })
const GROUPS = Object.fromEntries([H1, H1_AA, H10, H4, T2_MINOR, T2_SIMPLE, RETIRED, A3].map((g) => [g.id, g]))

describe('searchRvgGroups (the type-ahead)', () => {
  it('"H1" lists every live H1 row first, then codes starting H1', () => {
    expect(searchRvgGroups('H1', GROUPS).map((g) => g.id)).toEqual(['g1', 'g2', 'g3'])
  })

  it('is case-insensitive on code and description', () => {
    expect(searchRvgGroups('h1', GROUPS).map((g) => g.id)).toEqual(['g1', 'g2', 'g3'])
    expect(searchRvgGroups('APPENDECTOMY', GROUPS).map((g) => g.id)).toEqual(['g8'])
  })

  it('a description search needs every word', () => {
    expect(searchRvgGroups('breast wide', GROUPS).map((g) => g.id)).toEqual(['g6'])
  })

  it('keeps rows sharing one code apart (both T2s)', () => {
    expect(searchRvgGroups('T2', GROUPS).map((g) => g.baseUnits)).toEqual([4, 5])
  })

  it('leaves retired rows out unless asked', () => {
    expect(searchRvgGroups('H1', GROUPS).some((g) => g.retired)).toBe(false)
    expect(searchRvgGroups('H1', GROUPS, { includeRetired: true }).map((g) => g.id)).toContain('g7')
  })

  it('an empty query lists every live row in guide order (anatomy, then code)', () => {
    const ids = searchRvgGroups('', GROUPS).map((g) => g.id)
    expect(ids[0]).toBe('g1')
    expect(ids).not.toContain('g7')
    expect(ids.indexOf('g4')).toBeLessThan(ids.indexOf('g3')) // H4 before H10 (natural order)
    expect(ids.indexOf('g5')).toBeLessThan(ids.indexOf('g8')) // Thorax before Abdomen
  })

  it('the default picker list is short and leads with the current row', () => {
    const rows = defaultPickerRows(GROUPS, 'g8', 3)
    expect(rows.map((g) => g.id)).toEqual(['g8', 'g1', 'g2'])
  })
})

describe('display text', () => {
  it('base units read as a figure or a range with "to"', () => {
    expect(baseUnitsText(H1)).toBe('4')
    expect(baseUnitsText(H4)).toBe('10 to 12')
    expect(baseUnitsShort(H4)).toBe('B 10 to 12')
    expect(rvgGroupLabel(H1)).toBe('H1 · Minor procedures, e.g. myringotomies · B 4')
  })

  it('the warning sentence names the range or the guide value', () => {
    expect(outsideGuideText(14, 'H4', { figure: 10, range: { min: 10, max: 12 } })).toBe(
      'Base units 14 are outside the RVG guide for H4 (10 to 12).',
    )
    expect(outsideGuideText(9, 'H1', { figure: 4 })).toBe('Base units 9 are outside the RVG guide for H1 (guide value 4).')
    expect(guideText({ figure: 4 })).toBe('guide value 4')
  })
})

describe('the starting-units resolver (DM-43)', () => {
  it('starting units come from the row alone', () => {
    expect(resolveStartingUnits({ group: H4 })).toEqual({
      base: { units: 10 },
      modifier: { units: 0 },
      guide: { figure: 10, range: { min: 10, max: 12 } },
    })
    expect(resolveStartingUnits({ group: { ...H1, modifierUnits: 2 } }).modifier.units).toBe(2)
  })

  it('the typed override wins over everything', () => {
    const r = baseUnitsFor({ procedure: { baseUnitsCaptured: { units: 3, source: 'overridden' }, baseUnitsSelected: 11 }, group: H4 })
    expect(r).toMatchObject({ units: 3, source: 'overridden', starting: 10, outsideGuide: true })
  })

  it('a seeded captured value is not an override', () => {
    const r = baseUnitsFor({ procedure: { baseUnitsCaptured: { units: 3, source: 'seeded' } }, group: H1 })
    expect(r).toMatchObject({ units: 4, source: 'rvgGroup' })
  })

  it('a chosen value counts only on a ranged row', () => {
    expect(baseUnitsFor({ procedure: { baseUnitsSelected: 11 }, group: H4 })).toMatchObject({ units: 11, source: 'chosen', outsideGuide: false })
    expect(baseUnitsFor({ procedure: { baseUnitsSelected: 11 }, group: H1 })).toMatchObject({ units: 4, source: 'rvgGroup' })
  })

  it('else the starting figure; with no row, 0 and none', () => {
    expect(baseUnitsFor({ procedure: {}, group: H4 })).toMatchObject({ units: 10, source: 'rvgGroup', outsideGuide: false })
    expect(baseUnitsFor({ procedure: {} })).toEqual({ units: 0, source: 'none', starting: 0, outsideGuide: false })
  })

  it('outsideGuide at the range edges: min and max inside, min-1 and max+1 outside', () => {
    const at = (n: number) => baseUnitsFor({ procedure: { baseUnitsSelected: n }, group: H4 }).outsideGuide
    expect(at(10)).toBe(false)
    expect(at(12)).toBe(false)
    expect(at(9)).toBe(true)
    expect(at(13)).toBe(true)
  })

  it('a typed value on a single-figure row is outside; the starting value never is', () => {
    const typed = (n: number) => baseUnitsFor({ procedure: { baseUnitsCaptured: { units: n, source: 'overridden' } }, group: H1 })
    expect(typed(5).outsideGuide).toBe(true)
    expect(typed(4).outsideGuide).toBe(false)
  })

  it('an override with no row is never outside (there is no guide)', () => {
    expect(baseUnitsFor({ procedure: { baseUnitsCaptured: { units: 9, source: 'overridden' } } }).outsideGuide).toBe(false)
  })

  it('isOutsideGuide reads the range, else the figure', () => {
    expect(isOutsideGuide(11, { figure: 10, range: { min: 10, max: 12 } })).toBe(false)
    expect(isOutsideGuide(5, { figure: 4 })).toBe(true)
  })
})

describe('rvgGroupRefusal (saving a row)', () => {
  const ok = { code: 'H3', description: 'Brow lift', anatomy: 'Head', baseUnits: 5, modifierUnits: 0 }

  it('passes a good row, and a second row with an existing code', () => {
    expect(rvgGroupRefusal(ok, GROUPS)).toBeNull()
    expect(rvgGroupRefusal({ ...ok, code: 'H1', description: 'Another H1' }, GROUPS)).toBeNull()
  })

  it('refuses blank text, base units of 0 or a fraction, and negative or fractional modifier units', () => {
    expect(rvgGroupRefusal({ ...ok, code: ' ' }, GROUPS)?.code).toBe('codeRequired')
    expect(rvgGroupRefusal({ ...ok, description: '' }, GROUPS)?.code).toBe('descriptionRequired')
    expect(rvgGroupRefusal({ ...ok, anatomy: '' }, GROUPS)?.code).toBe('anatomyRequired')
    expect(rvgGroupRefusal({ ...ok, baseUnits: 0 }, GROUPS)?.message).toBe('Base units must be a whole number above 0.')
    expect(rvgGroupRefusal({ ...ok, baseUnits: 4.5 }, GROUPS)?.code).toBe('baseUnitsInvalid')
    expect(rvgGroupRefusal({ ...ok, modifierUnits: -1 }, GROUPS)?.code).toBe('modifierUnitsInvalid')
    expect(rvgGroupRefusal({ ...ok, modifierUnits: Number.NaN }, GROUPS)?.code).toBe('modifierUnitsInvalid')
  })

  it('a range must hold the figure', () => {
    expect(rvgGroupRefusal({ ...ok, baseUnitsRange: { min: 6, max: 8 } }, GROUPS)?.message).toBe('The range must hold the base units.')
    expect(rvgGroupRefusal({ ...ok, baseUnitsRange: { min: 8, max: 6 } }, GROUPS)?.code).toBe('rangeInvalid')
    expect(rvgGroupRefusal({ ...ok, baseUnitsRange: { min: 5, max: 7 } }, GROUPS)).toBeNull()
  })

  it('refuses an exact duplicate (code, description and figure), but not the row itself on edit', () => {
    const dup = { code: 'h1', description: 'brow  lift', anatomy: 'Head', baseUnits: 5, modifierUnits: 0 }
    expect(rvgGroupRefusal(dup, GROUPS)?.code).toBe('duplicateGroup')
    expect(rvgGroupRefusal(dup, GROUPS, 'g2')).toBeNull()
    expect(rvgGroupRefusal({ ...dup, baseUnits: 6 }, GROUPS)).toBeNull()
  })
})

describe('rvgGroupPickRefusal', () => {
  it('clearing is always allowed; an unknown row is refused', () => {
    expect(rvgGroupPickRefusal(GROUPS, null, 'g1')).toBeNull()
    expect(rvgGroupPickRefusal(GROUPS, 'nope', undefined)?.code).toBe('rvgGroupNotFound')
  })

  it('a retired row is refused as a new pick, kept where it already is', () => {
    expect(rvgGroupPickRefusal(GROUPS, 'g7', undefined)?.code).toBe('rvgGroupRetired')
    expect(rvgGroupPickRefusal(GROUPS, 'g7', 'g7')).toBeNull()
  })
})

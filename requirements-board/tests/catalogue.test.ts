import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { checkCatalogue, hasErrors } from '../shared/check.ts'
import { depthFirst, parseCsv, questionsCsv, requirementsCsv } from '../shared/csv.ts'
import { parseItem, parseQuestion, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { nextItemId, nextQuestionId } from '../shared/ids.ts'
import type { Item, Question } from '../shared/types.ts'
import { itemsDir, loadCatalogue, questionsDir, serialiseLayout, writeItem } from '../server/catalogueFs.ts'

const item = (over: Partial<Item>): Item => ({
  id: 'US-01.1.1',
  type: 'story',
  parent: 'FT-01.1',
  title: 'A story',
  status: 'Proposed',
  components: ['Scheduling Engine'],
  sources: [],
  order: 1,
  images: [],
  description: '',
  notes: '',
  extra: {},
  ...over,
})
const epic = item({ id: 'EP-01', type: 'epic', parent: null })
const feature = item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' })
const question = (over: Partial<Question>): Question => ({
  id: 'OQ-01', kind: 'question', title: 'Q', status: 'Open', owner: 'AA', affects: ['US-01.1.1'], sources: [], question: 'Why?', answer: '', extra: {}, ...over,
})

describe('catalogue files', () => {
  const real = loadCatalogue()

  // The one test that depends on live content: the committed catalogue must stay valid.
  it('loads the real catalogue with no errors', () => {
    expect(Object.keys(real.items).length).toBeGreaterThan(200)
    expect(real.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('round-trips every item file byte for byte', () => {
    for (const f of readdirSync(itemsDir())) {
      const text = readFileSync(join(itemsDir(), f), 'utf8')
      expect(serialiseItem(parseItem(text)), f).toBe(text)
    }
  })

  it('round-trips every question file byte for byte', () => {
    for (const f of readdirSync(questionsDir())) {
      const text = readFileSync(join(questionsDir(), f), 'utf8')
      expect(serialiseQuestion(parseQuestion(text)), f).toBe(text)
    }
  })

  it('keeps unknown frontmatter keys, notes, answers and awkward strings', () => {
    const it1 = item({
      title: 'Colon: "quotes" # and hash',
      sources: ['RFP: Schedule Management', 'Q&A 2026-09-24 #7'],
      description: 'Line one.\n\nLine two with *markdown*.',
      notes: 'A note.',
      images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'mobile', caption: 'Home' }],
      extra: { owner: 'Donald', tags: ['x'] },
    })
    expect(parseItem(serialiseItem(it1))).toEqual(it1)
    const q = question({ answer: 'Yes, always.' })
    expect(parseQuestion(serialiseQuestion(q))).toEqual(q)
  })

  it('round-trips an image app byte for byte, in src, viewport, app, caption order', () => {
    const it1 = item({ images: [{ src: 'assets/US-01.1.1/mobile-home.png', viewport: 'mobile', app: 'mobile', caption: 'Home' }] })
    const text = serialiseItem(it1)
    expect(text).toContain('  - src: assets/US-01.1.1/mobile-home.png\n    viewport: mobile\n    app: mobile\n    caption: Home\n')
    expect(parseItem(text)).toEqual(it1)
    expect(serialiseItem(parseItem(text))).toBe(text)
  })

  it('flags an unknown image app and a mobile-app shot with a desktop viewport', () => {
    const bad = parseItem(serialiseItem(item({ images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'desktop', app: 'phone' as never }] })))
    const odd = item({ images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'desktop', app: 'mobile' }] })
    const msgs = (i: typeof bad) => checkCatalogue({ items: [epic, feature, i], questions: [] }).map((x) => x.message)
    expect(msgs(bad)).toContain('image app "phone" is not one of admin, web, mobile, simulator')
    expect(msgs(odd)).toContain('image assets/US-01.1.1/a.png is from the mobile app but its viewport is desktop')
  })

  it('keeps a leading indent (a code block) through a round trip', () => {
    const it1 = item({ description: '    code line\nmore', notes: '    indented note' })
    expect(parseItem(serialiseItem(it1))).toEqual(it1)
  })

  it('flags a mistyped image viewport instead of silently making it desktop', () => {
    const it1 = parseItem(serialiseItem(item({ images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'moblie' as never }] })))
    expect(it1.images[0]!.viewport).toBe('moblie')
    expect(checkCatalogue({ items: [epic, feature, it1], questions: [] }).map((i) => i.message)).toContain('image viewport "moblie" is not desktop or mobile')
  })

  it('exports CSV in the old shape and reads it back', () => {
    const items = Object.values(real.items).map((r) => r.data)
    const rows = parseCsv(requirementsCsv(items))
    expect(rows).toHaveLength(items.length)
    expect(rows[0]!.ID).toBe(depthFirst(items)[0]!.id)
    const qs = parseCsv(questionsCsv(Object.values(real.questions).map((r) => r.data)))
    expect(qs.map((q) => q.ID ?? '')).toEqual([...qs.map((q) => q.ID ?? '')].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })))
  })

  it('writes layout one card per line with rounded, sorted positions', () => {
    expect(serialiseLayout({ positions: { 'FT-01.10': { x: 1.4, y: 2.6 }, 'FT-01.9': { x: 0, y: 0 } } })).toBe(
      '{\n  "positions": {\n    "FT-01.9": {"x":0,"y":0},\n    "FT-01.10": {"x":1,"y":3}\n  }\n}\n',
    )
    expect(serialiseLayout({ positions: {} })).toBe('{\n  "positions": {}\n}\n')
  })
})

describe('check rules', () => {
  const ok = [epic, feature, item({})]
  it('passes a clean tree', () => {
    expect(hasErrors(checkCatalogue({ items: ok, questions: [question({})] }))).toBe(false)
  })
  const msgs = (items: Item[], questions: Question[] = [], fileExists?: (p: string) => boolean) =>
    checkCatalogue({ items, questions, fileExists }).filter((i) => i.severity === 'error').map((i) => i.message)

  it('flags duplicates, missing parents and wrong parent types', () => {
    expect(msgs([...ok, item({})])).toContain('duplicate ID US-01.1.1')
    expect(msgs([epic, item({ parent: 'FT-09.9' })])).toContain('parent FT-09.9 does not exist')
    expect(msgs([epic, feature, item({ id: 'FT-01.2', type: 'feature', parent: 'FT-01.1' })])[0]).toMatch(/feature's parent must be an epic/)
    expect(msgs([...ok, item({ id: 'US-01.1.2', parent: 'US-01.1.1' })])[0]).toMatch(/story's parent must be a feature or epic/)
    expect(msgs([item({ id: 'EP-02', type: 'epic', parent: 'EP-01' }), epic])).toContain('an epic has no parent')
  })
  it('allows a story directly under an epic', () => {
    expect(msgs([epic, item({ id: 'US-01.0.1', parent: 'EP-01' })])).toEqual([])
  })
  it('flags vocabulary, ID shape, bad affects and missing images', () => {
    expect(msgs([epic, feature, item({ status: 'Maybe' as never })])[0]).toMatch(/status "Maybe"/)
    expect(msgs([epic, feature, item({ components: ['Blockchain'] })])[0]).toMatch(/component "Blockchain"/)
    expect(msgs([epic, feature, item({ id: 'US-1.1' })])[0]).toMatch(/does not match/)
    expect(msgs(ok, [question({ affects: ['US-99.1.1'] })])).toContain('affects US-99.1.1, which does not exist')
    const withImg = item({ images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'desktop' }] })
    expect(msgs([epic, feature, withImg], [], () => false)).toContain('image file assets/US-01.1.1/a.png is missing')
    expect(msgs([epic, feature, withImg], [], () => true)).toEqual([])
  })
})

describe('next IDs', () => {
  const items = [epic, feature, item({}), item({ id: 'US-01.1.9' }), item({ id: 'FT-01.3', type: 'feature', parent: 'EP-01' }), item({ id: 'EP-07', type: 'epic', parent: null })]
  it('numbers under the parent', () => {
    const taken = items.map((i) => i.id)
    expect(nextItemId(taken, 'epic', null)).toBe('EP-08')
    expect(nextItemId(taken, 'feature', epic)).toBe('FT-01.4')
    expect(nextItemId(taken, 'story', feature)).toBe('US-01.1.10')
    expect(nextItemId(taken, 'story', epic)).toBe('US-01.0.1')
    expect(() => nextItemId(taken, 'feature', feature)).toThrow()
  })
  it('numbers questions', () => {
    expect(nextQuestionId(['OQ-09', 'OQ-34'])).toBe('OQ-35')
  })
})

describe('writing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalogue-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  it('writes atomically and reloads what it wrote', () => {
    writeItem(epic, dir)
    writeItem(feature, dir)
    const rec = writeItem(item({ title: 'Written' }), dir)
    const loaded = loadCatalogue(dir)
    expect(loaded.items['US-01.1.1']).toEqual(rec)
    expect(readdirSync(itemsDir(dir))).toEqual(['EP-01.md', 'FT-01.1.md', 'US-01.1.1.md'])
  })
})

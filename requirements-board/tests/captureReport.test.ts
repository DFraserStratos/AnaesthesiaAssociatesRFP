import { describe, expect, it } from 'vitest'
import { INVALID_RECIPE, mergeFailures, priorFailures } from '../scripts/captureReport.ts'

// A report as a full capture run writes it (scripts/capture.ts writeReport).
const REPORT = [
  '# Screenshot report',
  '',
  'Written by `npm run capture` (the board\'s scripts/capture.ts) on a full run. Do not edit by hand.',
  '',
  '| | Items | Stories |',
  '|---|---:|---:|',
  '| Captured | 1 | 1 |',
  '| Failed recipe | 3 | 3 |',
  '',
  '## Failed recipes (3)',
  '',
  '- **US-01.1.1** Book a list · step 2: selector [data-x] matched nothing',
  '- **US-01.1.2** Price · with a dot · timeout after 30 s',
  '- **US-01.1.3** Gone · old error',
  '',
  '## Absent from the app (0)',
  '',
  'None.',
  '',
  '## Captured (1)',
  '',
  '- **US-02.1.1** Other · admin',
  '',
].join('\n')
const titles: Record<string, string> = { 'US-01.1.1': 'Book a list', 'US-01.1.2': 'Price · with a dot', 'US-01.1.3': 'Gone', 'US-02.1.1': 'Other' }
const titleOf = (id: string) => titles[id] ?? ''

describe('the capture report after a run limited to some IDs (R-139)', () => {
  it('reads the failures an earlier report recorded, by id, with their error text', () => {
    const prior = priorFailures(REPORT, titleOf)!
    expect([...prior]).toEqual([
      ['US-01.1.1', 'step 2: selector [data-x] matched nothing'],
      ['US-01.1.2', 'timeout after 30 s'],
      ['US-01.1.3', 'old error'],
    ])
  })

  it('a recipe the run fixed leaves the failures; failures outside the run are kept; a removed recipe is dropped', () => {
    const prior = priorFailures(REPORT, titleOf)!
    const merged = mergeFailures(prior, new Set(['US-01.1.1']), new Map(), new Map(), (id) => id !== 'US-01.1.3')
    expect([...merged.keys()]).toEqual(['US-01.1.2'])
    expect(merged.get('US-01.1.2')).toBe('timeout after 30 s')
  })

  it('a recipe that fails in the run takes its new error; an unreadable recipe is left to the broken list', () => {
    const prior = priorFailures(REPORT, titleOf)!
    const merged = mergeFailures(prior, new Set(['US-01.1.1']), new Map([['US-01.1.1', 'new error']]), new Map([['US-01.1.2', ['bad json']]]), () => true)
    expect([...merged]).toEqual([['US-01.1.3', 'old error'], ['US-01.1.1', 'new error']])
  })

  it('an unreadable-recipe line is never carried over: the run lists unreadable recipes from the files as they are now', () => {
    const report = REPORT.replace('## Failed recipes (3)\n\n', `## Failed recipes (4)\n\n- **US-02.1.1** Other · ${INVALID_RECIPE}shots[0].app: unknown\n`)
    const prior = priorFailures(report, titleOf)!
    expect(prior.has('US-02.1.1')).toBe(false)
    expect(prior.size).toBe(3)
  })

  it('a missing report, or a file this runner did not write, is not read (the caller leaves it)', () => {
    expect(priorFailures(null, titleOf)).toBeNull()
    expect(priorFailures('# Notes\n\nnothing here\n', titleOf)).toBeNull()
    expect(priorFailures(REPORT.replace(/## Failed recipes \(3\)[\s\S]*?(?=## Absent)/, '## Failed recipes (0)\n\nNone.\n\n'), titleOf)).toEqual(new Map())
  })
})

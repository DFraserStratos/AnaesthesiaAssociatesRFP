import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseMap, planFolder, recodeJournal, statusOf, withStatus } from '../scripts/recode-statuses.ts'

const FILE = '---\nid: US-01.1.1\ntitle: A story\nstatus: Confirmed\ncomponents: [Core]\n---\nIts status: Confirmed, as the text says.\n'

describe('recoding statuses', () => {
  let dir = ''
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }))

  it('reads and rewrites only the frontmatter status line', () => {
    expect(statusOf(FILE)).toBe('Confirmed')
    const next = withStatus(FILE, '4')
    expect(next).toBe(FILE.replace('status: Confirmed\n', 'status: 4\n'))
    expect(statusOf('---\nstatus: "Open"\n---\n')).toBe('Open')
  })

  it('parses old=new pairs, refusing a target that is not a code', () => {
    expect(parseMap('Confirmed=4, Future=1')).toEqual({ Confirmed: '4', Future: '1' })
    expect(() => parseMap('Confirmed=agreed')).toThrow(/not a code/)
    expect(() => parseMap('Confirmed')).toThrow(/old=new/)
  })

  it('plans a folder, skipping files already at a target and naming values it cannot place', () => {
    dir = mkdtempSync(join(tmpdir(), 'recode-'))
    mkdirSync(join(dir, 'stories'))
    writeFileSync(join(dir, 'stories', 'A.md'), FILE)
    writeFileSync(join(dir, 'stories', 'B.md'), FILE.replace('Confirmed\n', '4\n'))
    writeFileSync(join(dir, 'stories', 'C.md'), FILE.replace('Confirmed\n', 'Maybe\n'))
    const plan = planFolder(join(dir, 'stories'), { Confirmed: '4' })
    expect(plan.changes.map((c) => [c.from, c.to])).toEqual([['Confirmed', '4']])
    expect([...plan.unknown]).toEqual([['Maybe', ['C.md']]])
  })

  it('rewrites status values in journal lines and snapshots, nothing else', () => {
    const line = { at: 't', kind: 'changed', changes: [{ field: 'status', from: 'Proposed', to: 'Confirmed' }, { field: 'title', from: 'Confirmed', to: 'x' }] }
    expect(recodeJournal(line, { Proposed: '1', Confirmed: '4' })).toEqual({
      ...line,
      changes: [{ field: 'status', from: '1', to: '4' }, { field: 'title', from: 'Confirmed', to: 'x' }],
    })
    expect(recodeJournal({ data: { id: 'X', status: 'Future' } }, { Future: '1' })).toEqual({ data: { id: 'X', status: '1' } })
  })
})

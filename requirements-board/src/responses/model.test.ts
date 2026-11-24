import { describe, expect, it } from 'vitest'
import type { SnapshotInfo } from '../../shared/snapshot.ts'
import { changedFields, isEmptyResponse, localDay, responsesFile, responsesFileName, responsesKey, responsesShape, sortResponses, type ReaderResponse } from './model.ts'

const r = (over: Partial<ReaderResponse> & Pick<ReaderResponse, 'id' | 'kind' | 'target'>): ReaderResponse => ({ text: '', edits: [], snapshotCommit: 'abc', at: '2026-11-25T01:00:00.000Z', ...over })
const snapshot: SnapshotInfo = { takenAt: '2026-11-24T21:00:00.000Z', commit: 'ed60129efaceb74560583cc8', dirty: true, boardVersion: '1.29.0', project: 'Fixture' }

describe('responsesShape', () => {
  const read = (raw: unknown) => {
    let bad = 0
    const value = responsesShape(raw, () => bad++)
    return { value, bad }
  }

  it('keeps a good value whole', () => {
    const good = { reader: { name: 'Pat', organisation: 'Org' }, responses: [r({ id: '1', kind: 'comment', target: { type: 'item', id: 'US-01', title: 'A' }, text: 'Hi' })] }
    expect(read(JSON.parse(JSON.stringify(good)))).toEqual({ value: good, bad: 0 })
  })

  it('drops a response it cannot read, and a broken edit, and keeps the rest', () => {
    const { value, bad } = read({
      reader: { name: 'Pat' },
      responses: [
        { id: '1', kind: 'nonsense', target: { type: 'item', id: 'US-01' }, at: 'x' },
        { id: '2', kind: 'edit', target: { type: 'item', id: 'US-01', title: 'A' }, at: 'x', edits: [{ field: 'title', before: 'a', after: 'b' }, { field: 'owner', before: 'a', after: 'b' }] },
      ],
    })
    expect(bad).toBe(2)
    expect(value.reader).toEqual({ name: 'Pat', organisation: '' })
    expect(value.responses.map((x) => x.id)).toEqual(['2'])
    expect(value.responses[0]!.edits).toEqual([{ field: 'title', before: 'a', after: 'b' }])
  })

  it('reads anything else as no responses', () => {
    expect(read('junk')).toEqual({ value: { reader: { name: '', organisation: '' }, responses: [] }, bad: 1 })
  })
})

describe('responses', () => {
  it('counts only what says something', () => {
    expect(isEmptyResponse({ text: '  ', edits: [] })).toBe(true)
    expect(isEmptyResponse({ text: '', edits: [{ field: 'title', before: 'a', after: 'a' }] })).toBe(true)
    expect(isEmptyResponse({ text: '', edits: [{ field: 'title', before: 'a', after: 'b' }] })).toBe(false)
  })

  it('keeps only the fields an edit changed, in the card order', () => {
    const before = { title: 'T', description: 'D', acceptance: 'A' }
    expect(changedFields(before, { title: 'T', description: 'D2', acceptance: 'A2' })).toEqual([
      { field: 'description', before: 'D', after: 'D2' },
      { field: 'acceptance', before: 'A', after: 'A2' },
    ])
  })

  it('sorts questions, then cards, then artifacts, by ID, oldest first', () => {
    const list = [
      r({ id: 'a', kind: 'comment', target: { type: 'artifact', id: 'AR-02', title: '' } }),
      r({ id: 'b', kind: 'comment', target: { type: 'item', id: 'US-10', title: '' } }),
      r({ id: 'c', kind: 'comment', target: { type: 'item', id: 'US-2', title: '' }, at: '2026-11-25T03:00:00Z' }),
      r({ id: 'd', kind: 'answer', target: { type: 'question', id: 'OQ-1', title: '' } }),
      r({ id: 'e', kind: 'comment', target: { type: 'item', id: 'US-2', title: '' }, at: '2026-11-25T02:00:00Z' }),
    ]
    expect(sortResponses(list).map((x) => x.id)).toEqual(['d', 'e', 'c', 'b', 'a'])
  })

  it('names the file after the reader and their day, and keys storage by project', () => {
    expect(responsesFileName({ name: ' Jane O’Brien ', organisation: '' }, '2026-11-25')).toBe('responses-jane-o-brien-2026-11-25.md')
    expect(responsesFileName({ name: '', organisation: '' }, '2026-11-25')).toBe('responses-reader-2026-11-25.md')
    expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
    expect(responsesKey('Fixture')).toBe('requirements-board:responses:Fixture')
  })
})

describe('responsesFile', () => {
  const data = {
    reader: { name: 'Pat Reader', organisation: 'Clinic' },
    responses: [
      r({ id: '1', kind: 'edit', target: { type: 'item', id: 'US-01', title: 'Book a list' }, text: 'Clearer.', edits: [{ field: 'description', before: 'Old line.\n\nSecond.', after: 'New line.' }] }),
      r({ id: '2', kind: 'answer', target: { type: 'question', id: 'OQ-04', title: 'Who signs off' }, text: 'The manager.' }),
      r({ id: '3', kind: 'comment', target: { type: 'artifact', id: 'AR-01', title: 'Flow', spot: 'totals', spotName: 'Totals' }, text: 'Wrong sum.' }),
      r({ id: '4', kind: 'comment', target: { type: 'item', id: 'US-09', title: 'Blank' }, text: '   ' }),
    ],
  }
  const file = responsesFile(data, snapshot, '2026-11-25T02:00:00.000Z')

  it('heads it with who, which snapshot and how many', () => {
    expect(file).toContain('# Responses to the Fixture requirements board')
    expect(file).toContain('- **From:** Pat Reader · Clinic')
    expect(file).toContain('- **Snapshot:** taken 2026-11-24 · commit ed60129eface with uncommitted changes · board 1.29.0')
    expect(file).toContain('- **Responses:** 3')
  })

  it('cites each response by kind, ID and title, in reading order, leaving out empty ones', () => {
    const heads = file.split('\n').filter((l) => l.startsWith('## '))
    expect(heads).toEqual(['## Answer · OQ-04 · Who signs off', '## Suggested edit · US-01 · Book a list', '## Comment · AR-01#totals · Flow (spot: Totals)', '## Data'])
  })

  it('shows an edit as the text it was and the text suggested', () => {
    expect(file).toContain('### Description\n\n**Was:**\n\n> Old line.\n>\n> Second.\n\n**Suggested:**\n\n> New line.')
  })

  it('carries the same data as JSON', () => {
    const json = JSON.parse(file.split('```json\n')[1]!.split('\n```')[0]!) as { reader: unknown; snapshot: SnapshotInfo; responses: ReaderResponse[] }
    expect(json.reader).toEqual(data.reader)
    expect(json.snapshot.commit).toBe(snapshot.commit)
    expect(json.responses.map((x) => x.id)).toEqual(['2', '1', '3'])
  })
})

/** Sources: a `sources:` string resolved to the artifact spot it cites, the check's warnings, `cited_as` in the sidecar, and the sheet's rows. */
import { describe, expect, it } from 'vitest'
import { markdownFacts, markdownPoints } from '../shared/artifacts.ts'
import { checkCatalogue, type ArtifactFacts } from '../shared/check.ts'
import { parseArtifact, serialiseArtifact } from '../shared/files.ts'
import { buildSourceIndex, resolveSource, type SpotFacts } from '../shared/sources.ts'
import type { Artifact, ArtifactRec, Citation } from '../shared/types.ts'
import { sheetArtifacts, sourceIndexOf } from '../src/sourceRows.ts'
import { item, question } from './fixtures.ts'

const artifact = (over: Partial<Artifact> & Pick<Artifact, 'id'>): Artifact => ({
  title: `Artifact ${over.id}`,
  kind: 'document',
  status: 'Current',
  supersededBy: null,
  citedAs: [],
  date: '2026-10-01',
  author: '',
  components: [],
  sources: ['Fixture'],
  file: `artifacts/files/${over.id}.pdf`,
  regions: [],
  description: '',
  source: '',
  extra: {},
  ...over,
})
const cite = (as: string, o: Partial<Citation> = {}): Citation => ({ as, pageOffset: null, within: null, spot: null, ...o })

const NOTE = [
  '# Notes on the meeting, 1 October', // 1
  '', // 2
  '## Questions answered', // 3
  '', // 4
  '1. **OQ-02 Fee basis.** Answer: per invoice.', // 5
  '   More on that.', // 6
  '', // 7
  '3. **Out of order.** Three comes before two.', // 8
  '   1. A nested list', // 9
  '   2. stays inside point 3', // 10
  '', // 11
  '## Donald\'s notes', // 12
  '', // 13
  '2. **Two, later.** Numbered once across the note.', // 14
  '', // 15
  'A closing paragraph at the margin.', // 16
  '', // 17
].join('\n')

const SOURCE_NOTES = [
  '# Source notes, 2026-09-24', // 1
  '', // 2
  '## Future-state diagrams supplied', // 3
  '', // 4
  '1. High level process.', // 5
  '2. Entity infographic.', // 6
  '', // 7
  '## Q&A with Donald, 2026-09-24', // 8
  '', // 9
  '1. **Modifier split.** More than four.', // 10
  '2. **Contract list.** An idea.', // 11
  '', // 12
].join('\n')

const md = (text: string): SpotFacts => {
  const f = markdownFacts(text)
  return { pages: null, headings: f.headings, points: f.points, lines: f.lines }
}

function catalogue() {
  const arts = [
    artifact({ id: 'AR-15', title: 'RFP', citedAs: [cite('RFP', { pageOffset: 1 }), cite('RFP, July 2026')] }),
    artifact({ id: 'AR-36', title: 'RFP response', citedAs: [cite('RFP response')] }),
    artifact({ id: 'AR-11', kind: 'note', file: 'notes/2026-10-01-aa-meeting-with-greg.md' }),
    artifact({ id: 'AR-09', kind: 'note', file: 'notes/2026-09-24-source-notes.md', citedAs: [cite('Q&A 2026-09-24', { within: 'qa-with-donald-2026-09-24' }), cite('Meeting notes 2026-09', { within: 'future-state-diagrams-supplied' })] }),
    artifact({ id: 'AR-04', kind: 'transcript', file: 'artifacts/files/t.md', sources: ['Recording 2026-10-01 · AA meeting with Greg (A)'], citedAs: [cite('Recording 2026-10-01 · AA meeting with Greg (A)'), cite('Transcript 2026-10-01 · AA meeting with Greg (A)')] }),
    artifact({ id: 'AR-20', kind: 'diagram', file: 'artifacts/files/AR-20.svg', status: 'Superseded', supersededBy: 'AR-24', regions: [{ id: 'old-only', name: 'Old', around: [], box: [0, 0, 1, 1], page: null, pad: null, note: '' }], citedAs: [cite('Diagram: Billing route', { spot: 'old-only' })] }),
    artifact({ id: 'AR-24', kind: 'diagram', file: 'artifacts/files/AR-24.svg', regions: [{ id: 'setup', name: 'Booking setup', around: [], box: [0, 0, 1, 1], page: null, pad: null, note: '' }], citedAs: [cite('Diagram: Setup', { spot: 'setup' })] }),
    artifact({ id: 'AR-16', citedAs: [cite('Data files')] }),
  ]
  const facts: Record<string, SpotFacts> = {
    'AR-15': { pages: 50, headings: null, points: null, lines: null },
    'AR-36': { pages: 66, headings: null, points: null, lines: null },
    'AR-11': md(NOTE),
    'AR-09': md(SOURCE_NOTES),
    'AR-04': { pages: null, headings: [], points: [], lines: 400 },
  }
  return { arts, index: buildSourceIndex(arts, (id) => facts[id] ?? null) }
}

describe('note points', () => {
  it('reads top-level numbered items, each to the next point, heading or margin paragraph', () => {
    expect(markdownPoints(NOTE)).toEqual([
      { n: 1, from: 5, to: 6, title: 'OQ-02 Fee basis' },
      { n: 3, from: 8, to: 10, title: 'Out of order' },
      { n: 2, from: 14, to: 14, title: 'Two, later' },
    ])
    expect(markdownFacts(NOTE).headings.map((h) => [h.slug, h.line])).toEqual([
      ['notes-on-the-meeting-1-october', 1],
      ['questions-answered', 3],
      ['donalds-notes', 12],
    ])
  })
})

describe('resolving a source', () => {
  const { index } = catalogue()
  const at = (s: string, self?: string) => resolveSource(index, s, self)

  it('opens the RFP at the PDF page, one past the printed page it is named by, and the response at its own page', () => {
    expect(at('RFP p.27 · Billing Engine › Contract holders')).toEqual({ kind: 'artifact', id: 'AR-15', prefix: 'RFP', spots: [{ region: 'p28', label: 'Page 27', detail: 'PDF page 28', problem: null }] })
    expect(at('RFP response p.13 · Detailed Solution Design')).toMatchObject({ id: 'AR-36', spots: [{ region: 'p13', label: 'Page 13', detail: null }] })
    expect(at('RFP, July 2026')).toMatchObject({ id: 'AR-15', spots: [{ region: null }] })
    expect(at('RFP p.60 · Nowhere')).toMatchObject({ spots: [{ problem: 'AR-15 has no page 61' }] })
  })

  it("finds a note by its file name and each point by number, wherever it sits", () => {
    expect(at('Notes 2026-10-01 · AA meeting with Greg #2')).toMatchObject({ kind: 'artifact', id: 'AR-11', spots: [{ region: 'L14', label: 'Point 2', detail: 'Two, later' }] })
    const multi = at('Notes 2026-10-01 · AA meeting with Greg #1 #3')
    expect(multi).toMatchObject({ id: 'AR-11', spots: [{ region: 'L5-6', label: 'Point 1' }, { region: 'L8-10', label: 'Point 3' }] })
    expect(at('Notes 2026-10-01 · AA meeting with Greg')).toMatchObject({ id: 'AR-11', spots: [{ region: null }] })
    expect(at('Notes 2026-10-01 · AA meeting with Greg #9')).toMatchObject({ spots: [{ problem: 'AR-11 has no point 9' }] })
    expect(at('Notes 2026-10-05 · A meeting that never was #1')).toEqual({ kind: 'unresolved', reason: 'no note notes/2026-10-05-a-meeting-that-never-was.md' })
  })

  it('looks for points only under the cited section, so repeated numbers resolve', () => {
    expect(at('Q&A 2026-09-24 #2')).toMatchObject({ id: 'AR-09', spots: [{ region: 'L11', label: 'Point 2', detail: 'Contract list' }] })
    expect(at('Q&A 2026-09-24')).toMatchObject({ id: 'AR-09', spots: [{ region: 'qa-with-donald-2026-09-24', label: 'Q&A with Donald, 2026-09-24' }] })
    expect(at('Q&A 2026-09-24 #7')).toMatchObject({ spots: [{ problem: 'AR-09 has no point 7 under "Q&A with Donald, 2026-09-24"' }] })
  })

  it('takes the longest prefix, line ranges, a named spot, and words for the reader after it', () => {
    expect(at('Transcript 2026-10-01 · AA meeting with Greg (A) L27-33')).toMatchObject({ id: 'AR-04', spots: [{ region: 'L27-33', label: 'Lines 27 to 33' }] })
    expect(at('Diagram: Setup')).toMatchObject({ id: 'AR-24', spots: [{ region: 'setup', label: 'Booking setup' }] })
    expect(at('Data files (fee schedules, NZSA RVG 2021) (Merivale terms)')).toMatchObject({ id: 'AR-16', spots: [{ region: null }] })
    expect(at('RFP responses are great').kind).toBe('unresolved')
  })

  it('hands a superseded artifact on to its replacement, dropping a spot the replacement lacks', () => {
    expect(at('Diagram: Billing route')).toMatchObject({ id: 'AR-24', spots: [{ region: null, label: null }] })
  })

  it("shows an artifact's own origin plain, a question as a question, and a non-citation plain", () => {
    expect(at('Recording 2026-10-01 · AA meeting with Greg (A)', 'AR-04')).toEqual({ kind: 'plain' })
    expect(at('Recording 2026-10-01 · AA meeting with Greg (A)')).toMatchObject({ id: 'AR-04' })
    expect(at('OQ-62')).toEqual({ kind: 'question', id: 'OQ-62' })
    expect(at('Typed decision 2026-10-05 · Donald (product owner)')).toEqual({ kind: 'plain' })
    expect(at('Audit 2026-09-24 #5')).toEqual({ kind: 'plain' })
    // Starts the way citations do (Diagram, Q&A, Notes) but matches nothing: flagged.
    expect(at('Diagram authored by Donald')).toEqual({ kind: 'unresolved', reason: 'matches no artifact' })
  })
})

describe('the check on sources', () => {
  const pdf = (pages: number): ArtifactFacts => ({ format: 'pdf', ok: true, bounds: null, pdf: { pages: Array.from({ length: pages }, () => ({ w: 1, h: 1, loose: '' })) } })
  const note = (text: string): ArtifactFacts => ({ format: 'markdown', ok: true, bounds: null, markdown: markdownFacts(text) })
  const run = (artifacts: Artifact[], items = [item({ id: 'US-01.1.1' })], questions = [question({ id: 'OQ-01', affects: ['US-01.1.1'] })]) =>
    checkCatalogue({ items, questions, artifacts, artifactFacts: (a) => (a.id === 'AR-11' ? note(NOTE) : pdf(50)) })
      .filter((i) => /^source |cited_as/.test(i.message))
      .map((i) => `${i.severity} ${i.id}: ${i.message}`)

  it('warns on sources that cite nothing or a spot that is not there, on items, questions and artifacts', () => {
    const arts = [artifact({ id: 'AR-15', citedAs: [cite('RFP', { pageOffset: 1 })] }), artifact({ id: 'AR-11', kind: 'note', file: 'notes/2026-10-01-aa-meeting-with-greg.md', sources: ['Notes 2026-10-01 · AA meeting with Greg'] })]
    const items = [item({ id: 'US-01.1.1', sources: ['RFP p.27 · Fine', 'RFP p.80 · Past the end', 'Notes 2026-10-01 · AA meeting with Greg #2 #9', 'Notes 2026-10-04 · Nothing', 'Typed decision 2026-10-05 · Donald', 'OQ-99'] })]
    const questions = [question({ id: 'OQ-01', affects: ['US-01.1.1'], sources: ['Notes 2026-10-01 · AA meeting with Greg #12'] })]
    expect(run(arts, items, questions)).toEqual([
      'warning US-01.1.1: source "RFP p.80 · Past the end": AR-15 has no page 81',
      'warning US-01.1.1: source "Notes 2026-10-01 · AA meeting with Greg #2 #9": AR-11 has no point 9',
      'warning US-01.1.1: source "Notes 2026-10-04 · Nothing" no note notes/2026-10-04-nothing.md',
      'warning US-01.1.1: source OQ-99 names a question that does not exist',
      'warning OQ-01: source "Notes 2026-10-01 · AA meeting with Greg #12": AR-11 has no point 12',
    ])
  })

  it('errors on a malformed cited_as, and a prefix two artifacts claim', () => {
    const arts = [
      artifact({ id: 'AR-01', citedAs: [cite(''), cite('Spec', { pageOffset: 1.5 })] }),
      artifact({ id: 'AR-02', citedAs: [cite('Spec')] }),
      artifact({ id: 'AR-11', kind: 'note', file: 'notes/2026-10-01-aa-meeting-with-greg.md', citedAs: [cite('Notes 2026-10-01 · AA meeting with Greg'), cite('Old', { within: 'nope', pageOffset: 1 })] }),
    ]
    expect(run(arts)).toEqual([
      'error AR-01: a cited_as entry has no "as"',
      'error AR-01: cited_as "Spec": page_offset is a whole number, for a PDF',
      'error AR-11: cited_as "Notes 2026-10-01 · AA meeting with Greg": a note is cited by its file name already; drop the entry',
      'error AR-11: cited_as "Old": page_offset is a whole number, for a PDF',
      'error AR-11: cited_as "Old": within "nope" is not a heading in AR-11',
      'error AR-01: cited_as "Spec" is also claimed by AR-02',
      'error AR-02: cited_as "Spec" is also claimed by AR-01',
    ])
  })
})

describe('cited_as in the sidecar', () => {
  it('round-trips, quoting only what YAML needs quoted', () => {
    const a = artifact({ id: 'AR-01', citedAs: [cite('RFP', { pageOffset: 1 }), cite('Q&A 2026-09-24', { within: 'qa' }), cite('Diagram: Billing route', { spot: 'setup' })] })
    const text = serialiseArtifact(a)
    expect(text).toContain('cited_as:\n  - as: RFP\n    page_offset: 1\n  - as: Q&A 2026-09-24\n    within: qa\n  - as: "Diagram: Billing route"\n    spot: setup\nfile:')
    expect(parseArtifact(text)).toEqual(a)
    expect(serialiseArtifact(parseArtifact(text))).toBe(text)
  })
})

describe("a card's Diagrams and Sources", () => {
  const { arts } = catalogue()
  const recs: Record<string, ArtifactRec> = Object.fromEntries(
    arts.map((a) => [
      a.id,
      {
        data: a,
        rev: 'r',
        meta: {
          format: a.kind === 'diagram' ? 'svg' : a.file?.endsWith('.md') ? 'markdown' : 'pdf',
          fileRev: null,
          bounds: null,
          pages: a.id === 'AR-15' ? Array.from({ length: 50 }, () => ({ w: 1, h: 1 })) : null,
          headings: a.id === 'AR-11' ? markdownFacts(NOTE).headings : null,
          points: a.id === 'AR-11' ? markdownFacts(NOTE).points : null,
          lines: a.id === 'AR-11' ? 17 : null,
          bytes: null,
          path: null,
        },
      } satisfies ArtifactRec,
    ]),
  )
  const index = sourceIndexOf(recs)

  it('puts pictures under Diagrams and evidence under Sources, in the order cited, each once', () => {
    const card = item({
      id: 'US-01.1.1',
      sources: ['RFP p.27 · Billing', 'Diagram: Billing route', 'Notes 2026-10-01 · AA meeting with Greg #1 #3', 'Typed decision 2026-10-05 · Donald', 'OQ-62', 'Diagram: Nothing'],
      artifacts: ['AR-24#setup', 'AR-15#p28', 'AR-16', 'AR-99'],
    })
    const { diagrams, sources } = sheetArtifacts(card, index, recs)
    const show = (r: (typeof diagrams)[number]) => (r.kind === 'artifact' ? `${r.id}${r.spots.map((s) => (s.region ? `#${s.region}` : '')).join('')}` : r.kind === 'plain' ? `plain: ${r.source}` : r.kind === 'question' ? r.id : `missing: ${r.text}`)
    // The cited diagram (the whole of AR-24, via its replacement) gives way to the spot the card links.
    expect(diagrams.map(show)).toEqual(['AR-24#setup'])
    expect(sources.map(show)).toEqual(['AR-15#p28', 'AR-11#L5-6#L8-10', 'plain: Typed decision 2026-10-05 · Donald', 'OQ-62', 'missing: Diagram: Nothing', 'AR-16', 'missing: AR-99'])
  })
})

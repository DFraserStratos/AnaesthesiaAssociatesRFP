/**
 * B04, one rule, one helper: each catalogue text rule has one implementation, and the check, the
 * server, the viewer and the scripts all give the same answer (FINDINGS systemic issue 4).
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCatalogueApi } from '../server/catalogueApi.ts'
import { itemPath, loadCatalogue, writeItem, writeLayout } from '../server/catalogueFs.ts'
import { markdownFacts, matchSimpleSelector, mermaidNodeIds, svgFacts } from '../shared/artifacts.ts'
import { checkCatalogue } from '../shared/check.ts'
import { lintArtifact, lintFrontmatter, parseArtifact } from '../shared/files.ts'
import { mentions, pastedTarget } from '../shared/links.ts'
import { planDelete, unlink } from '../shared/remove.ts'
import { buildArtifactIndex } from '../src/artifactIndex.ts'
import { item, question } from './fixtures.ts'
import { existsSync } from 'node:fs'
import type { Artifact, ArtifactRec, Citation, Item } from '../shared/types.ts'
import { buildSourceIndex, citationProblems, resolveNoteCite, resolveSource, spotExists, type SpotFacts } from '../shared/sources.ts'
import { CODE_CORPUS, HEADING_CORPUS } from './oneRuleCorpus.ts'

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
  steps: [],
  stepView: null,
  description: '',
  source: '',
  extra: {},
  ...over,
})

const ids = (md: string) => mentions(md).map((m) => `${m.id}${m.bare ? '*' : ''}`)

describe('one code rule for links (R-60, R-61, R-62)', () => {
  const STRAY = 'Press the ` key, then see [the other story](US-01.1.2).\n\n```\ncode\n```\n'
  it('a lone backtick is text and never pairs with a fence', () => {
    expect(ids(STRAY)).toEqual(['US-01.1.2'])
    expect(unlink(STRAY, new Set(['US-01.1.2']))).toBe('Press the ` key, then see the other story.\n\n```\ncode\n```\n')
  })
  it('a code span never crosses a blank line (R-61)', () => {
    const md = 'A stray ` here.\n\nSee [the rule](US-01.1.1).\n\nAnd ` later.'
    expect(ids(md)).toEqual(['US-01.1.1'])
    expect(unlink(md, new Set(['US-01.1.1']))).toBe('A stray ` here.\n\nSee the rule.\n\nAnd ` later.')
  })
  it('code spans pair only runs of the same length, and fences close on the same character, at least as long', () => {
    expect(ids('``a ` [x](US-01.1.1) ``')).toEqual([])
    expect(ids('`` a `` [x](US-01.1.1)')).toEqual(['US-01.1.1'])
    expect(ids('````\n```\n[x](US-01.1.1)\n````\n[y](US-01.1.2)')).toEqual(['US-01.1.2'])
    expect(ids('~~~\n```\n[x](US-01.1.1)\n~~~\n[y](US-01.1.2)')).toEqual(['US-01.1.2'])
    expect(ids('   ```\n[x](US-01.1.1)\n```')).toEqual([])
    expect(ids('    ```\n[x](US-01.1.1)')).toEqual(['US-01.1.1']) // four spaces: not a fence
    expect(ids('```\n[x](US-01.1.1)')).toEqual([]) // an unclosed fence runs to the end
    expect(ids('\\` [x](US-01.1.1) `')).toEqual(['US-01.1.1']) // an escaped backtick is text
  })
  it('mentions and unlink agree on every corpus body', () => {
    for (const [md, linked] of CODE_CORPUS) {
      expect(mentions(md).filter((m) => !m.bare).map((m) => m.id), md).toEqual(linked)
      const after = unlink(md, new Set(['US-01.1.1', 'US-01.1.2']))
      expect(mentions(after).filter((m) => !m.bare), md).toEqual([])
    }
  })
  it('an image whose target is a record ID is not a link, for both mentions and unlink (B04-Q1)', () => {
    expect(ids('![x](US-01.1.2)')).toEqual([])
    expect(unlink('![x](US-01.1.2)', new Set(['US-01.1.2']))).toBe('![x](US-01.1.2)')
  })
  it('after any delete plan, no explicit link into the deleted set is left outside code', () => {
    const bodies = [
      STRAY,
      'A stray ` here.\n\nSee [a](US-01.1.2).\n\nAnd ` later.',
      '``x` [a](US-01.1.2) `` and [b](US-01.1.2)',
      '~~~\n[in](US-01.1.2)\n~~~\n[out](US-01.1.2) ` tail',
      '[one](US-01.1.2) `[code](US-01.1.2)` [two](FT-01.1)',
      '```js `\n[in](US-01.1.2)\n```\n[out](US-01.1.2)',
      'see [`x`](US-01.1.2) and [the `fee` rule](US-01.1.2)',
    ]
    const items = [
      item({ id: 'EP-01', type: 'epic' }),
      item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
      item({ id: 'US-01.1.2', parent: 'FT-01.1' }),
      ...bodies.map((b, i) => item({ id: `US-02.1.${i + 1}`, parent: 'FT-02.1', description: b, notes: b })),
    ]
    const questions = [question({ id: 'OQ-01', question: STRAY, answer: bodies[1]! })]
    for (const gone of ['US-01.1.2', 'FT-01.1', 'EP-01']) {
      const plan = planDelete(items, questions, gone)
      const doomed = new Set(plan.doomed.map((d) => d.id))
      // Every record that stays, as the plan leaves it (rewritten, or untouched).
      const after = [
        ...items.filter((i) => !doomed.has(i.id)).map((i) => plan.items.find((r) => r.id === i.id) ?? i).flatMap((i) => [i.description, i.acceptance, i.technical, i.notes]),
        ...questions.map((q) => plan.questions.find((r) => r.id === q.id) ?? q).flatMap((q) => [q.question, q.answer]),
      ]
      for (const t of after) expect(mentions(t).filter((m) => !m.bare && doomed.has(m.id)), `${gone}: ${t}`).toEqual([])
    }
  })
  it('the check and the artifact index read each field on its own (R-62)', () => {
    const it1 = item({ id: 'US-01.1.1', parent: 'FT-01.1', description: 'One ` here.\n\n```\nunclosed fence', acceptance: 'See [the step](AR-03#step-2).', notes: 'And ` there.' })
    const recs: Record<string, ArtifactRec> = { 'AR-03': { data: artifact({ id: 'AR-03' }), rev: 'r', meta: null } as unknown as ArtifactRec }
    const ix = buildArtifactIndex(recs, { items: [it1], questions: [question({ id: 'OQ-01', question: 'x `', answer: '[s](AR-03) `' })] } as never)
    expect(ix.links.get('AR-03')?.map((l) => [l.item.id, l.region])).toEqual([['US-01.1.1', 'step-2']])
    expect(ix.questions.get('AR-03')?.map((q) => q.question.id)).toEqual(['OQ-01'])
    // The check finds the broken link the joined text hid.
    const issues = checkCatalogue({ items: [item({ id: 'EP-01', type: 'epic', description: 'A ` mark.', notes: 'See [gone](US-09.9.9) and ` this.' })], questions: [], artifacts: [] } as never)
    expect(issues.some((i) => i.id === 'EP-01' && i.severity === 'error' && i.message.includes('links to US-09.9.9'))).toBe(true)
  })
  it('the heading, point and line reader uses the same fence rule', () => {
    const md = '# One\n\n````\n```\n# Not a heading\n````\n\n## Two\n'
    expect(markdownFacts(md).headings.map((h) => h.text)).toEqual(['One', 'Two'])
    expect(markdownFacts('# A\n```\n# x\n~~~\n# y\n```\n# B').headings.map((h) => h.text)).toEqual(['A', 'B'])
  })
})

describe('a delete the dialog allows is never refused for a link it said it would unlink (R-60)', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'one-rule-'))
    writeItem(item({ id: 'EP-01', type: 'epic' }), root)
    writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, description: 'Press the ` key, then see [the other story](US-01.1.2).\n\n```\ncode\n```' }), root)
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }), root)
    writeLayout({ positions: {}, lanes: [] }, root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))
  it('deletes and leaves no link', () => {
    const a = createCatalogueApi(root, () => {})
    a.handle({ method: 'DELETE', path: '/api/items/US-01.1.2', body: { baseRev: a.getState().items['US-01.1.2']!.rev, ids: ['US-01.1.2'] }, headers: { 'content-type': 'application/json', host: 'localhost:5180' } })
    expect(existsSync(itemPath('US-01.1.2', root))).toBe(false)
    expect(loadCatalogue(root).items['US-01.1.1']!.data.description).toBe('Press the ` key, then see the other story.\n\n```\ncode\n```')
  })
})

/** The check's view of one Markdown artifact, from its text, as the server builds it. */
function checkMarkdown(text: string, regions: Artifact['regions'], items: Item[] = []) {
  const a = artifact({ id: 'AR-05', kind: 'note', file: 'artifacts/files/AR-05.md', regions })
  const f = markdownFacts(text)
  return checkCatalogue({ items, questions: [], artifacts: [a], artifactFacts: () => ({ format: 'markdown', ok: true, bounds: null, markdown: f }) } as never).filter((i) => i.severity === 'error')
}
const region = (id: string, around: string[]) => ({ id, name: id, around, box: null, page: null, pad: null, note: '' })

describe('heading text and slugs from the source, one derivation (R-28, R-83)', () => {
  it('reads each heading as the board renders its words', () => {
    for (const [md, text] of HEADING_CORPUS) expect(markdownFacts(md).headings[0]?.text, md).toBe(text)
  })
  it('slugs: an entity decodes, a record ID keeps its ID, repeats count on, empty is "section"', () => {
    expect(markdownFacts('# Q&amp;A').headings[0]!.slug).toBe('qa')
    expect(markdownFacts('### 9.1 Catalogue, EP-04 Contracts').headings[0]!.slug).toBe('91-catalogue-ep-04-contracts')
    expect(markdownFacts('# A\n\n# A\n\n# !!!').headings.map((h) => h.slug)).toEqual(['a', 'a-1', 'section'])
  })
  it('the check accepts heading= anchors and slug spots exactly as the viewer reads them', () => {
    const doc = '# Intro\n\n## fee_schedule rules\n\nText.\n\n## Q&amp;A\n\nMore.\n'
    expect(checkMarkdown(doc, [region('fees', ['heading=fee_schedule rules']), region('qa-region', ['heading=Q&A'])])).toEqual([])
    expect(checkMarkdown(doc, [], [item({ id: 'EP-01', type: 'epic', artifacts: ['AR-05#qa'] })])).toEqual([])
  })
  it('heading text and slugs are NFC, so a heading typed either way matches and slugs alike (REQ-03.4)', () => {
    const nfd = '# Ma\u0304ori health\n'
    expect(markdownFacts(nfd).headings[0]).toMatchObject({ text: 'Māori health', slug: 'māori-health' })
    expect(checkMarkdown(nfd, [region('m', ['heading=Māori health']), region('n', ['heading=Ma\u0304ori health'])])).toEqual([])
  })
})

describe('mermaid node IDs as the board resolves them (R-27)', () => {
  const nodes = (src: string) => [...(mermaidNodeIds(src) ?? [])].sort()
  it("R-27's own cases: square-bracket targets, the flag shape, o and x heads, @{} shapes", () => {
    expect(nodes('flowchart LR; A --> B[Label]; C[x] --> D[y]; E --o F; G@{ shape: rect }')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(nodes('flowchart LR\n  A --> B>Flag]\n  C --x D')).toEqual(['A', 'B', 'C', 'D'])
    expect(nodes('flowchart TD\n  A@{ shape: circle, label: "Start" } --> B@{ shape: rect }')).toEqual(['A', 'B'])
  })
  it('every shape, link form, label, chain, class, comment, styling line and subgraph', () => {
    const src = [
      'flowchart TB',
      '  %% a comment, with A2 --> B2 in it',
      '  A[square] --> B(round) --> C{rhombus}',
      '  D((circle)) --- E[[sub]] -.-> F[(db)]',
      '  G{{hex}} ==> H>flag] ~~~ I[/para/]',
      '  J -- yes --> K',
      '  L -->|label| M',
      '  N -. dotted .-> O',
      '  P == thick ==> Q',
      '  R o--o S x--x T <--> U',
      '  V ----> W ====> X -...-> Y',
      '  Z1 & Z2 --> Z3 & Z4',
      '  Z5:::hot --> Z6["A quoted label --> with arrow"]',
      '  subgraph group1 [The group]',
      '    direction LR',
      '    in-1 --> in-2',
      '  end',
      '  style A fill:#fff',
      '  classDef hot fill:#f00',
      '  class A,B hot',
      '  click A callback',
      '  linkStyle 0 stroke:#f00',
    ].join('\n')
    expect(nodes(src)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'in-1', 'in-2'].sort())
  })
  it('a node= anchor on A --> B[Label] passes the check; one naming no node still errors', () => {
    const a = artifact({ id: 'AR-05', kind: 'diagram', file: null, source: 'flowchart LR\n  A --> B[Label]', regions: [region('b', ['node=B']), region('z', ['node=Label'])] })
    const issues = checkCatalogue({ items: [], questions: [], artifacts: [a], artifactFacts: () => ({ format: 'mermaid', ok: true, bounds: null, nodeIds: mermaidNodeIds(a.source) }) } as never).filter((i) => i.severity === 'error')
    expect(issues.map((i) => i.message)).toEqual(['region z: anchor "node=Label": the diagram has no node Label'])
  })
  it('another diagram type is still not read', () => {
    expect(mermaidNodeIds('sequenceDiagram\n  A->>B: hi')).toBeNull()
  })
})

describe('selector matching never counts what the browser rejects (R-84)', () => {
  const svg = svgFacts('<svg viewBox="0 0 100 100"><rect class="panel"/><rect class="panel"/><rect class="panel"/></svg>')
  it('an empty comma part is invalid, never every element; simple selectors keep their counts', () => {
    for (const sel of ['rect.panel,', ',rect.panel', 'rect.panel,,rect']) expect(matchSimpleSelector(sel, svg.elements), sel).toBe('invalid')
    expect(matchSimpleSelector('rect.panel', svg.elements)).toBe(3)
    expect(matchSimpleSelector('rect.panel, rect', svg.elements)).toBe(3)
    expect(matchSimpleSelector('g > rect', svg.elements)).toBeNull()
  })
  it('the check warns that it draws nothing, and never says the box spans them all', () => {
    const a = artifact({ id: 'AR-05', kind: 'diagram', file: 'artifacts/files/AR-05.svg', regions: [region('p', ['rect.panel,'])] })
    const issues = checkCatalogue({ items: [], questions: [], artifacts: [a], artifactFacts: () => ({ format: 'svg', ok: true, bounds: svg.bounds, svg }) } as never).filter((i) => i.id === 'AR-05')
    expect(issues).toEqual([{ severity: 'warning', id: 'AR-05', message: 'region p: anchor "rect.panel," is not a valid selector (an empty part, as after a stray comma), so the board draws nothing for it' }])
  })
})

describe('quote text and normalisation on both sides (R-101, R-83)', () => {
  const NFD = 'Māori health'
  it('a decomposed passage passes the check either way it is written', () => {
    const doc = `# Note\n\nWe talked about ${NFD} and more.\n`
    expect(checkMarkdown(doc, [region('m', ['quote=Māori health'])])).toEqual([])
    expect(checkMarkdown(doc, [region('m', [`quote=${NFD}`])])).toEqual([])
  })
  it('a passage across a bare record ID, an entity, emphasis and an autolink reads as the source', () => {
    const doc = '# Note\n\nSee EP-04 for *the* rules &amp; fees, and <https://x.y/a_b> too.\n'
    expect(checkMarkdown(doc, [region('a', ['quote=See EP-04 for the rules & fees']), region('b', ['quote=https://x.y/a_b too'])])).toEqual([])
  })
  it('a stray < never swallows the text after it', () => {
    const doc = '| a | Age <2 | x |\n|---|---|---|\n| b | Age >1 and later text | y |\n'
    expect(checkMarkdown(doc, [region('a', ['quote=Age >1 and later text'])])).toEqual([])
  })
})

describe('one spot rule (R-75, R-76, R-77, R-79)', () => {
  const md = (text: string): SpotFacts => {
    const f = markdownFacts(text)
    return { pages: null, headings: f.headings, points: f.points, lines: f.lines }
  }
  const TRANSCRIPT = '# Transcript\n\n## Te reo māori\n\n1. A point.\n' + 'line\n'.repeat(40)
  const pdf = (pages: number): SpotFacts => ({ pages, headings: null, points: null, lines: null })
  const cite = (as: string, o: Partial<Citation> = {}): Citation => ({ as, pageOffset: null, within: null, spot: null, ...o })
  const arts = () => [
    artifact({ id: 'AR-08', file: 'artifacts/files/AR-08.pdf', citedAs: [cite('Spec p27', { spot: 'p27' })] }),
    artifact({ id: 'AR-05', kind: 'transcript', file: 'artifacts/files/AR-05.md', citedAs: [cite('Transcript A'), cite('Transcript lines', { spot: 'L1-10' })] }),
    artifact({ id: 'AR-06', kind: 'diagram', file: 'artifacts/files/AR-06.svg', citedAs: [cite('Diagram X')] }),
    artifact({ id: 'AR-01', file: 'artifacts/files/AR-01.pdf', status: 'Retired', supersededBy: 'AR-02', citedAs: [cite('Old spec')] }),
    artifact({ id: 'AR-02', file: 'artifacts/files/AR-02.pdf' }),
  ]
  const facts: Record<string, SpotFacts> = { 'AR-08': pdf(30), 'AR-05': md(TRANSCRIPT), 'AR-01': pdf(30), 'AR-02': pdf(50) }
  const index = () => buildSourceIndex(arts(), (id) => facts[id] ?? null)
  const problems = (s: string) => {
    const r = resolveSource(index(), s)
    return r.kind === 'artifact' ? r.spots.map((x) => x.problem) : [r.kind]
  }

  it('the rule itself: pages on a PDF, lines on Markdown, ordered and from 1, headings by slug, drawings only by name', () => {
    const [p, t, d] = arts()
    expect([spotExists(p!, 'p27', pdf(30)), spotExists(p!, 'p31', pdf(30)), spotExists(p!, 'p0', pdf(30))]).toEqual([true, false, false])
    expect([spotExists(t!, 'L1-10', md(TRANSCRIPT)), spotExists(t!, 'L0', md(TRANSCRIPT)), spotExists(t!, 'L33-27', md(TRANSCRIPT)), spotExists(t!, 'p3', md(TRANSCRIPT))]).toEqual([true, false, false, false])
    expect(spotExists(t!, 'te-reo-māori', md(TRANSCRIPT))).toBe(true)
    expect([spotExists(d!, 'p2', null), spotExists(d!, 'anything', null), spotExists(t!, 'p3', null)]).toEqual([false, false, true])
  })
  it('a cited_as spot may be a page or a line range (R-75); a missing one is still an error', () => {
    const issues = checkCatalogue({ items: [], questions: [], artifacts: arts(), artifactFacts: (a: Artifact) => ({ format: a.file!.endsWith('.md') ? 'markdown' : a.file!.endsWith('.svg') ? 'svg' : 'pdf', ok: true, bounds: null, ...(a.file!.endsWith('.md') ? { markdown: markdownFacts(TRANSCRIPT) } : a.file!.endsWith('.pdf') ? { pdf: { pages: Array.from({ length: a.id === 'AR-02' ? 50 : 30 }, () => ({ w: 1, h: 1, loose: '' })) } } : {}) }) } as never)
    expect(issues.filter((i) => /cited_as/.test(i.message))).toEqual([])
    const bad = artifact({ id: 'AR-09', file: 'artifacts/files/AR-09.pdf', citedAs: [cite('Spec p99', { spot: 'p99' })] })
    expect(citationProblems(bad, pdf(30), true)).toEqual(['cited_as "Spec p99": spot "p99" is not a spot in AR-09 (a region, step, page, line range or heading)'])
  })
  it('page, line and point spots on files without them, and reversed or zero ranges, warn (R-76)', () => {
    expect(problems('Transcript A p.3')).toEqual(['AR-05 is not a PDF, so it has no page 3'])
    expect(problems('Diagram X p.2')).toEqual(['AR-06 is not a PDF, so it has no page 2'])
    expect(problems('Transcript A L33-27')).toEqual(['AR-05: lines 33 to 27 is not a range of lines (it runs from line 1, first line first)'])
    expect(problems('Transcript A L0')).toEqual(['AR-05: lines 0 to 0 is not a range of lines (it runs from line 1, first line first)'])
    expect(problems('Diagram X #2')).toEqual(['AR-06 has no numbered points, so it has no point 2'])
    expect(problems('Old spec #2')).toEqual(['AR-02 has no numbered points, so it has no point 2'])
    expect(problems('Transcript A L2-5')).toEqual([null])
    expect(problems('Transcript A #1')).toEqual([null])
  })
  it('a retired artifact hands on first, then spots are worked out on its replacement (R-79)', () => {
    const r = resolveSource(index(), 'Old spec p.40')
    expect(r).toMatchObject({ kind: 'artifact', id: 'AR-02', spots: [{ region: 'p40', problem: null }] })
    // A spot the replacement lacks still opens the whole replacement.
    expect(resolveSource(index(), 'Old spec p.60')).toMatchObject({ kind: 'artifact', id: 'AR-02', spots: [{ region: null, problem: null }] })
  })
  it('an artifacts: entry or a pasted link takes any spot the slug rule makes (R-77)', () => {
    const it1 = item({ id: 'EP-01', type: 'epic', artifacts: ['AR-05#te-reo-māori', 'AR-05#l1_x'] })
    const issues = checkCatalogue({ items: [it1], questions: [], artifacts: [arts()[1]!], artifactFacts: () => ({ format: 'markdown', ok: true, bounds: null, markdown: markdownFacts(TRANSCRIPT) }) } as never).filter((i) => i.id === 'EP-01' && i.severity === 'error')
    expect(issues.map((i) => i.message)).toEqual(['artifacts lists AR-05#l1_x: AR-05 has no region "l1_x"'])
    expect(pastedTarget('AR-05#te-reo-māori')).toBe('AR-05#te-reo-māori')
    expect(checkCatalogue({ items: [item({ id: 'EP-01', type: 'epic', artifacts: ['AR-05 #x'] })], questions: [], artifacts: [] } as never).some((i) => i.severity === 'error' && i.message.includes('is not AR-nn'))).toBe(true)
  })
})

describe('one source-string grammar (R-78, R-80, R-81, R-82)', () => {
  const cite = (as: string): Citation => ({ as, pageOffset: null, within: null, spot: null })
  const NOTE = '# Notes\n\n1. One.\n2. Two.\n3. Three.\n'
  const noteFacts = (): SpotFacts => {
    const f = markdownFacts(NOTE)
    return { pages: null, headings: f.headings, points: f.points, lines: f.lines }
  }
  const note = artifact({ id: 'AR-11', kind: 'note', file: 'notes/2026-10-09-gone-meeting.md' })
  const index = (more: Artifact[] = []) => buildSourceIndex([note, ...more], (id) => (id === 'AR-11' ? noteFacts() : null))
  it('a question ID followed by words is that question (R-78); a mistyped one still names a question, so it warns', () => {
    expect(resolveSource(index(), 'OQ-01 · answered by Sam')).toEqual({ kind: 'question', id: 'OQ-01' })
    expect(resolveSource(index(), 'OQ-01')).toEqual({ kind: 'question', id: 'OQ-01' })
    expect(resolveSource(index(), 'OQ-01.5 (typo)')).toEqual({ kind: 'question', id: 'OQ-01.5' })
  })
  it('resolveNoteCite gives the note a cite opens, and nothing else (D-03)', () => {
    const spec = artifact({ id: 'AR-08', file: 'artifacts/files/AR-08.pdf', citedAs: [cite('Spec')] })
    const ix = index([spec])
    expect(resolveNoteCite(ix, 'Notes 2026-10-09 · Gone meeting #2')).toEqual({ id: 'AR-11', file: 'notes/2026-10-09-gone-meeting.md' })
    expect(resolveNoteCite(ix, 'Notes 2026-10-09 · Gone meeting')).toEqual({ id: 'AR-11', file: 'notes/2026-10-09-gone-meeting.md' })
    expect(resolveNoteCite(ix, 'Notes 2026-10-09 · Another meeting')).toBeNull()
    expect(resolveNoteCite(ix, 'Spec p.3')).toBeNull()
  })
  it('a points list is read whole: #2 #3, #2#3 and #2, #3 (R-80)', () => {
    for (const s of ['Notes 2026-10-09 · Gone meeting #2 #3', 'Notes 2026-10-09 · Gone meeting #2#3', 'Notes 2026-10-09 · Gone meeting #2, #3']) {
      expect(resolveSource(index(), s), s).toMatchObject({ kind: 'artifact', spots: [{ label: 'Point 2', problem: null }, { label: 'Point 3', problem: null }] })
    }
    expect(resolveSource(index(), 'Notes 2026-10-09 · Gone meeting #2, #9')).toMatchObject({ spots: [{ problem: null }, { problem: 'AR-11 has no point 9' }] })
    expect(resolveSource(index(), 'Notes 2026-10-09 · Gone meeting #2, see below')).toMatchObject({ spots: [{ label: 'Point 2' }] })
  })
  it('the unresolved-note warning names the right file and says what failed (R-81)', () => {
    expect(resolveSource(index(), 'Notes 2026-10-09 · Gone meeting p.3x')).toEqual({ kind: 'unresolved', reason: 'names the note notes/2026-10-09-gone-meeting.md, but "p.3x" after its words is not a spot (#n, Ln, p.n) or words after " · "' })
    expect(resolveSource(index(), 'Notes 2026-10-09 · Other meeting p.3')).toEqual({ kind: 'unresolved', reason: 'no note notes/2026-10-09-other-meeting.md' })
  })
  it('two sidecars on one file warn naming both; a prefix listed twice is no clash with itself (R-82)', () => {
    const twin = artifact({ id: 'AR-66', kind: 'note', file: 'notes/2026-10-09-gone-meeting.md' })
    const dup = artifact({ id: 'AR-09', citedAs: [cite('Board pack'), cite('Board pack')] })
    const issues = checkCatalogue({ items: [], questions: [], artifacts: [note, twin, dup] } as never).filter((i) => /registered by|cited_as/.test(i.message))
    expect(issues).toEqual([
      { severity: 'warning', id: 'AR-09', message: 'cited_as lists "Board pack" more than once; once is enough' },
      { severity: 'warning', id: 'AR-11', message: 'file notes/2026-10-09-gone-meeting.md is also registered by AR-66; sources open only one of them, so keep one sidecar' },
      { severity: 'warning', id: 'AR-66', message: 'file notes/2026-10-09-gone-meeting.md is also registered by AR-11; sources open only one of them, so keep one sidecar' },
    ])
  })
})

describe('frontmatter lint that tells the truth (R-38, R-85)', () => {
  const sidecar = (yaml: string) => `---\nid: AR-09\ntitle: Board pack\nkind: document\nfile: artifacts/files/AR-09.pdf\n${yaml}---\n\nAbout it.\n`
  const lint = (yaml: string) => {
    const text = sidecar(yaml)
    return [...lintFrontmatter(text), ...lintArtifact(text, parseArtifact(text))]
  }
  it('cited_as is linted: not a list, an odd entry, an unknown or misspelt key', () => {
    expect(lint('cited_as:\n  as: Board pack\n')).toEqual(['cited_as is not a list (write each prefix as a "- " line), so it is ignored, and dropped on the next board save'])
    expect(lint('cited_as:\n  - 12\n')).toEqual(['a cited_as entry is neither a prefix nor a mapping (as, page_offset, within, spot), so it is ignored, and dropped on the next board save'])
    expect(lint('cited_as:\n  - as: Board pack\n    pageOffset: 1\n    colour: red\n')).toEqual([
      'cited_as "Board pack" has a key the board ignores, "pageOffset" (did you mean "page_offset"?); it is dropped on the next board save',
      'cited_as "Board pack" has a key the board ignores, "colour"; it is dropped on the next board save',
    ])
    expect(lint('cited_as:\n  - Board pack\n  - as: Board pack v2\n    page_offset: 1\n')).toEqual([])
  })
  it('a # inside a block scalar or a quoted list-item value is no comment', () => {
    expect(lint('steps:\n  - id: pay\n    name: Pay\n    caption: |-\n      Pays invoice #3 in full.\n      Then #4.\n    show: ["#pay"]\n')).toEqual([])
    expect(lint('cited_as:\n  - as: "Board pack #2"\n')).toEqual([])
    expect(lint('note: >\n  A folded #1 line\n')).toEqual([])
    expect(lint('# a whole-line comment loses nothing\nauthor: Sam\n')).toEqual([])
  })
  it('a real unquoted # still warns, after a list-item key too', () => {
    expect(lint('cited_as:\n  - as: Board pack #2\n')).toEqual(['unquoted "#" in `- as: Board pack #2` starts a YAML comment, so the rest is dropped; quote the value'])
    expect(lint('author: Sam #lead\n')).toEqual(['unquoted "#" in `author: Sam #lead` starts a YAML comment, so the rest is dropped; quote the value'])
    // After a block scalar ends, the next key is YAML again.
    expect(lint('description: |\n  Text #1\nauthor: Sam #lead\n')).toEqual(['unquoted "#" in `author: Sam #lead` starts a YAML comment, so the rest is dropped; quote the value'])
  })
})

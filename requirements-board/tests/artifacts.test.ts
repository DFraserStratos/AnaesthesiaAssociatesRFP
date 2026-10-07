/** Artifacts: the sidecar format, reading files without a DOM, the check's rules, links, history and the API. */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { looseText, markdownFacts, matchSimpleSelector, mermaidNodeIds, parseAnchor, rasterSize, slugify, svgFacts } from '../shared/artifacts.ts'
import { checkCatalogue, isArtifactDate, type ArtifactFacts } from '../shared/check.ts'
import { parseArtifact, serialiseArtifact } from '../shared/files.ts'
import { buildArtifactTimeline, diffArtifacts, regionChanges } from '../shared/history.ts'
import { nextArtifactId } from '../shared/ids.ts'
import { mentions, pastedTarget } from '../shared/links.ts'
import { artifactFormat, linesOfRegionId, parseArtifactRef, type Artifact, type ArtifactRec, type Region } from '../shared/types.ts'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { loadCatalogue, writeItem, writeLayout } from '../server/catalogueFs.ts'
import { serveArtifactFile } from '../server/cataloguePlugin.ts'
import { autoSpots, buildArtifactIndex, spotName } from '../src/artifactIndex.ts'
import { buildIndex } from '../src/store.ts'
import { fitRect, lerpCamera, viewOf, zoomAbout } from '../src/artifacts/camera.ts'
import { countIn, normQuery, normText, pdfPageText } from '../src/artifacts/find.ts'
import { artifactDate } from '../src/vocab.ts'
import { item } from './fixtures.ts'

const region = (over: Partial<Region> & Pick<Region, 'id'>): Region => ({ name: over.id, around: [], box: null, page: null, pad: null, note: '', ...over })
const artifact = (over: Partial<Artifact> & Pick<Artifact, 'id'>): Artifact => ({
  title: `Artifact ${over.id}`,
  kind: 'diagram',
  status: 'Current',
  supersededBy: null,
  citedAs: [],
  date: '2026-10-01',
  author: '',
  components: [],
  sources: ['Fixture'],
  file: `artifacts/${over.id}.svg`,
  regions: [],
  description: '',
  source: '',
  extra: {},
  ...over,
})

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 58 800 400">
<!-- <text>not this</text> -->
<rect id="panel" class="card big" x="40" y="90" width="300" height="200"/>
<text x="60" y="130">Rate &amp; units</text>
<text x="60" y="170"><tspan>Two</tspan><tspan> parts</tspan></text>
<text x="60" y="210">Rate &amp; units</text>
</svg>`

describe('the sidecar file', () => {
  it('round-trips, keeping regions, a mermaid source and unknown keys', () => {
    const a = artifact({
      id: 'AR-03',
      file: null,
      source: 'flowchart LR\n  A --> B',
      author: 'Someone',
      regions: [region({ id: 'step-b', name: 'Step B', around: ['node=B'], pad: 4, note: 'The second step' })],
      description: 'A flow.',
      extra: { reviewed: true },
    })
    const text = serialiseArtifact(a)
    expect(text).toContain('## Source\n\n```mermaid\nflowchart LR')
    expect(parseArtifact(text)).toEqual(a)
    expect(serialiseArtifact(parseArtifact(text))).toBe(text)
  })

  it('keeps a date as text, however YAML reads it, and as much of it as is known', () => {
    for (const date of ['2026-10-01', '2026-07', '2021']) {
      const text = serialiseArtifact(artifact({ id: 'AR-01', date }))
      expect(parseArtifact(text).date).toBe(date)
    }
    expect(parseArtifact(serialiseArtifact(artifact({ id: 'AR-01', date: null }))).date).toBeNull()
    expect(artifactDate('2026-10-01')).toBe('1 Oct 2026')
    expect(artifactDate('2026-07')).toBe('July 2026')
    expect(artifactDate('2021')).toBe('2021')
    expect(isArtifactDate('2026-02-30')).toBe(false)
    expect(isArtifactDate('2026-13')).toBe(false)
    expect(isArtifactDate('1 Oct 2026')).toBe(false)
  })

  it('knows its format from the file, or from a mermaid source', () => {
    expect(artifactFormat({ file: 'artifacts/AR-01.SVG', source: '' })).toBe('svg')
    expect(artifactFormat({ file: '/docs/x.pdf', source: '' })).toBe('pdf')
    expect(artifactFormat({ file: 'notes/n.md', source: '' })).toBe('markdown')
    expect(artifactFormat({ file: 'artifacts/a.jpeg', source: '' })).toBe('raster')
    expect(artifactFormat({ file: null, source: 'graph TD' })).toBe('mermaid')
    expect(artifactFormat({ file: 'artifacts/a.docx', source: '' })).toBeNull()
  })

  it('reads refs, page and line spots, and gives the next ID', () => {
    expect(parseArtifactRef('AR-01#price-rules')).toEqual({ id: 'AR-01', region: 'price-rules' })
    expect(parseArtifactRef('AR-01')).toEqual({ id: 'AR-01', region: null })
    expect(linesOfRegionId('L27-33')).toEqual({ from: 27, to: 33 })
    expect(linesOfRegionId('L9')).toEqual({ from: 9, to: 9 })
    expect(linesOfRegionId('L9-3')).toBeNull()
    expect(nextArtifactId(['AR-01', 'AR-09', 'US-01.1.1'])).toBe('AR-10')
  })
})

describe('reading files without a DOM', () => {
  it('parses anchors', () => {
    expect(parseAnchor('text=Rate & units')).toEqual({ kind: 'text', value: 'Rate & units' })
    expect(parseAnchor('quote=a = b')).toEqual({ kind: 'quote', value: 'a = b' })
    expect(parseAnchor('rect[x="460"]')).toEqual({ kind: 'css', value: 'rect[x="460"]' })
  })

  it('reads an SVG: its offset viewBox, its texts (tspans joined, entities decoded), and its elements', () => {
    const f = svgFacts(SVG)
    expect(f.bounds).toEqual({ x: 0, y: 58, w: 800, h: 400 })
    expect(f.texts).toEqual(['Rate & units', 'Two parts', 'Rate & units'])
    expect(matchSimpleSelector('rect[x="40"][y="90"]', f.elements)).toBe(1)
    expect(matchSimpleSelector('#panel', f.elements)).toBe(1)
    expect(matchSimpleSelector('rect.card.big', f.elements)).toBe(1)
    expect(matchSimpleSelector('rect[x="41"]', f.elements)).toBe(0)
    expect(matchSimpleSelector('g > rect', f.elements)).toBeNull()
    expect(svgFacts('<html/>').error).toBeTruthy()
  })

  it("reads a flowchart's node IDs, and leaves other diagram types unread", () => {
    const ids = mermaidNodeIds('flowchart LR\n  A[Booking] -->|then| B(Contract)\n  B -- yes --> C{Price?}\n  C ==> D:::hot\n  style A fill:#fff\n  %% a comment')
    expect([...ids!].sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(mermaidNodeIds('sequenceDiagram\n  A->>B: hi')).toBeNull()
  })

  it('reads the size of a PNG, a JPEG and a WebP', () => {
    const png = Buffer.alloc(24)
    png.set([0x89, 0x50, 0x4e, 0x47])
    png.writeUInt32BE(640, 16)
    png.writeUInt32BE(480, 20)
    expect(rasterSize(png)).toEqual({ w: 640, h: 480 })
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x01, 0x90, 0x03, 0, 0, 0])
    expect(rasterSize(jpeg)).toEqual({ w: 400, h: 300 })
    const webp = Buffer.alloc(30)
    webp.write('RIFF', 0, 'latin1')
    webp.write('WEBPVP8X', 8, 'latin1')
    webp.writeUIntLE(1023, 24, 3)
    webp.writeUIntLE(767, 27, 3)
    expect(rasterSize(webp)).toEqual({ w: 1024, h: 768 })
    expect(rasterSize(Buffer.from('nope'))).toBeNull()
    // A real PNG, for good measure.
    const real = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]), Buffer.from('IHDR'), Buffer.from([0, 0, 0, 3, 0, 0, 0, 2, 8, 2, 0, 0, 0]), deflateSync(Buffer.alloc(1))])
    expect(rasterSize(real)).toEqual({ w: 3, h: 2 })
  })

  it("reads a Markdown document's headings (slugged as GitHub does) and lines, ignoring code", () => {
    const md = '# Title\n\nSetext heading\n--------------\n\n## Prepayment, *cancellation* and [reassignment](x)\n\n```\n# not a heading\n```\n\n## Title\n\n**Greg:** We wear it.\n'
    const f = markdownFacts(md)
    expect(f.headings.map((h) => [h.depth, h.slug])).toEqual([
      [1, 'title'],
      [2, 'setext-heading'],
      [2, 'prepayment-cancellation-and-reassignment'],
      [2, 'title-1'],
    ])
    expect(f.lines).toBe(14)
    expect(f.loose.includes(looseText('Greg: We wear it.'))).toBe(true)
    expect(slugify('Fees, BCTIs & GST: 2026')).toBe('fees-bctis--gst-2026')
  })
})

describe('the check', () => {
  const facts = (over: Partial<ArtifactFacts>): ArtifactFacts => ({ format: 'svg', ok: true, bounds: { x: 0, y: 58, w: 800, h: 400 }, ...over })
  const svg = facts({ svg: { texts: svgFacts(SVG).texts, elements: svgFacts(SVG).elements } })
  const run = (artifacts: Artifact[], items = [item({ id: 'US-01.1.1' })], get: (a: Artifact) => ArtifactFacts | null = () => svg) =>
    checkCatalogue({ items, questions: [], artifacts, artifactFacts: get }).filter((i) => (i.id.startsWith('AR-') || i.id.startsWith('US-')) && !/needs a parent/.test(i.message))
  const errors = (issues: ReturnType<typeof run>) => issues.filter((i) => i.severity === 'error').map((i) => `${i.id}: ${i.message}`)

  it('passes a well-formed artifact whose anchors all match', () => {
    const a = artifact({ id: 'AR-01', regions: [region({ id: 'rates', around: ['text=Rate & units'] }), region({ id: 'panel', around: ['#panel'] }), region({ id: 'corner', box: [0, 60, 10, 10] })] })
    expect(errors(run([a]))).toEqual([])
    // Two texts match: it still passes, with a note.
    expect(run([a]).some((i) => /matches 2 texts/.test(i.message))).toBe(true)
  })

  it('names every way a region can be wrong', () => {
    const a = artifact({
      id: 'AR-01',
      regions: [
        region({ id: 'Bad Id', around: ['text=Rate & units'] }),
        region({ id: 'gone', around: ['text=Not in the drawing'] }),
        region({ id: 'nowhere', around: ['rect[x="999"]'] }),
        region({ id: 'outside', box: [700, 400, 200, 100] }),
        region({ id: 'empty' }),
        region({ id: 'node', around: ['node=A'] }),
      ],
    })
    const e = errors(run([a]))
    expect(e).toEqual([
      'AR-01: region Bad Id: the id must be lower-case words joined by hyphens',
      'AR-01: region gone: anchor "text=Not in the drawing" matches no text in the drawing',
      'AR-01: region nowhere: anchor "rect[x="999"]" matches nothing in the drawing',
      'AR-01: region outside: the box lies outside the drawing',
      'AR-01: region empty needs anchors (around) or a box',
      'AR-01: region node: anchor "node=A" does not apply to a SVG',
    ])
  })

  it('checks the sidecar: kind, status, a file or a source, a readable file, what supersedes it', () => {
    const e = errors(
      run([
        artifact({ id: 'AR-01', kind: 'poster' as never, status: 'Old' as never }),
        artifact({ id: 'AR-02', file: null }),
        artifact({ id: 'AR-03', file: 'artifacts/AR-03.docx' }),
        artifact({ id: 'AR-04', status: 'Superseded', supersededBy: 'AR-99' }),
        artifact({ id: 'AR-05', date: '2026-10-32' }),
      ], undefined, (a) => (a.id === 'AR-01' ? facts({ ok: false, error: 'file artifacts/AR-01.svg is missing' }) : svg)),
    )
    expect(e).toEqual([
      'AR-01: kind "poster" is not one of diagram, mockup, screenshot, photo, transcript, note, document',
      'AR-01: status "Old" is not one of Draft, Current, Superseded',
      'AR-01: file artifacts/AR-01.svg is missing',
      'AR-02: has neither a file nor a mermaid source under ## Source',
      'AR-03: file artifacts/AR-03.docx is not a kind the board shows (.svg, .png, .jpg, .jpeg, .webp, .md, .pdf)',
      'AR-04: superseded_by AR-99, which does not exist',
      'AR-05: date "2026-10-32" is not YYYY-MM-DD, YYYY-MM or YYYY',
    ])
  })

  it("holds documents' quotes, headings, pages and lines to their text", () => {
    const md = markdownFacts('# Notes\n\n## Who pays\n\nThe guardian pays.\n')
    const pdf = { pages: [{ w: 612, h: 792, loose: looseText('Page one text') }, { w: 612, h: 792, loose: looseText('Time units table') }] }
    const doc = artifact({ id: 'AR-01', kind: 'note', file: 'notes/n.md', regions: [region({ id: 'ok', around: ['quote=The guardian  pays.', 'heading=Who pays'] }), region({ id: 'bad', around: ['quote=Nobody pays'] })] })
    const book = artifact({ id: 'AR-02', kind: 'document', file: 'artifacts/AR-02.pdf', regions: [region({ id: 'ok', page: 2, around: ['quote=Time units table'] }), region({ id: 'wrong-page', page: 1, around: ['quote=Time units table'] }), region({ id: 'past', page: 3, box: [0, 0, 10, 10] })] })
    const items = [item({ id: 'US-01.1.1', artifacts: ['AR-01#who-pays', 'AR-01#L3-5', 'AR-02#p2', 'AR-02#p9', 'AR-01#L99'] })]
    const e = errors(run([doc, book], items, (a) => (a.id === 'AR-01' ? { format: 'markdown', ok: true, bounds: null, markdown: md } : { format: 'pdf', ok: true, bounds: null, pdf })))
    expect(e).toEqual([
      'AR-01: region bad: anchor "quote=Nobody pays" is not in the document',
      'AR-02: region wrong-page: anchor "quote=Time units table" is not on page 1',
      'AR-02: region past: page 3 is past the end (2 pages)',
      'US-01.1.1: artifacts lists AR-02#p9: AR-02 has no region "p9"',
      'US-01.1.1: artifacts lists AR-01#L99: AR-01 has no region "L99"',
    ])
  })

  it("checks a card's artifact links and text links, warning on a superseded artifact", () => {
    const items = [
      item({ id: 'US-01.1.1', artifacts: ['AR-01#rates', 'AR-02', 'AR-01#nope', 'not-a-ref'], description: 'See [the rates](AR-01#rates) and [this](AR-09).' }),
    ]
    const a = artifact({ id: 'AR-01', regions: [region({ id: 'rates', around: ['text=Two parts'] })] })
    const b = artifact({ id: 'AR-02', status: 'Superseded', supersededBy: 'AR-01' })
    const issues = run([a, b], items)
    expect(errors(issues)).toEqual([
      'US-01.1.1: artifacts lists AR-01#nope: AR-01 has no region "nope"',
      'US-01.1.1: artifacts entry "not-a-ref" is not AR-nn or AR-nn#region',
      'US-01.1.1: the text links to AR-09: that artifact does not exist',
    ])
    expect(issues.some((i) => i.severity === 'warning' && /AR-02, which is superseded by AR-01/.test(i.message))).toBe(true)
  })

  it("only warns about broken links in an artifact's own description, which the board cannot fix", () => {
    const a = artifact({ id: 'AR-01', description: 'Drawn for [the story](US-09.9.9).' })
    const issues = run([a])
    expect(errors(issues)).toEqual([])
    expect(issues.some((i) => i.id === 'AR-01' && /US-09.9.9, which does not exist/.test(i.message))).toBe(true)
  })
})

describe('links to artifacts', () => {
  it('reads explicit links (with a spot) and bare IDs', () => {
    expect(mentions('See [the rules](AR-01#price-rules), AR-02 and US-01.1.1.')).toEqual([
      { id: 'AR-01#price-rules', bare: false },
      { id: 'AR-02', bare: true },
      { id: 'US-01.1.1', bare: true },
    ])
  })
  it('turns a pasted artifact link into a ref', () => {
    expect(pastedTarget('http://localhost:5180/#/artifacts/AR-01?region=price-rules')).toBe('AR-01#price-rules')
    expect(pastedTarget('http://localhost:5180/#/artifacts/AR-01')).toBe('AR-01')
    expect(pastedTarget('AR-04#L27-33')).toBe('AR-04#L27-33')
    expect(pastedTarget('AR-04#who-pays')).toBe('AR-04#who-pays')
  })
  it('keeps artifact refs out of the cards a card mentions', () => {
    const index = buildIndex({ 'US-01.1.1': { data: item({ id: 'US-01.1.1', description: 'See AR-01 and US-01.1.2.' }), rev: 'r' } }, {})
    expect([...index.mentionedBy.keys()]).toEqual(['US-01.1.2'])
  })
})

describe('the artifact index', () => {
  const rec = (a: Artifact, meta: Partial<ArtifactRec['meta']> = {}): ArtifactRec => ({
    data: a,
    rev: 'r',
    meta: { format: artifactFormat(a), fileRev: null, bounds: null, pages: null, headings: null, lines: null, points: null, bytes: null, path: null, ...meta },
  })
  it('lists the cards that point at each artifact, by field and by text, and names their spots', () => {
    const a = rec(artifact({ id: 'AR-01', regions: [region({ id: 'rates', name: 'Rates' })] }))
    const doc = rec(artifact({ id: 'AR-02', kind: 'transcript', file: 'notes/t.md' }), { headings: [{ depth: 2, text: 'Who pays', slug: 'who-pays', line: 3 }], lines: 40 })
    const pdf = rec(artifact({ id: 'AR-03', kind: 'document', file: 'x.pdf' }), { pages: [{ w: 1, h: 1 }, { w: 1, h: 1 }] })
    const index = buildIndex(
      {
        'US-01.1.1': { data: item({ id: 'US-01.1.1', artifacts: ['AR-01#rates', 'AR-02#who-pays'] }), rev: 'r' },
        'US-01.1.2': { data: item({ id: 'US-01.1.2', description: 'Per [the rates](AR-01#rates).' }), rev: 'r' },
      },
      {},
    )
    const ix = buildArtifactIndex({ 'AR-01': a, 'AR-02': doc, 'AR-03': pdf }, index)
    expect(ix.list.map((r) => r.data.id)).toEqual(['AR-01', 'AR-02', 'AR-03'])
    expect(ix.links.get('AR-01')!.map((l) => `${l.item.id}|${l.region}|${l.via}`)).toEqual(['US-01.1.1|rates|field', 'US-01.1.2|rates|text'])
    expect(spotName(a, 'rates')).toBe('Rates')
    expect(spotName(doc, 'who-pays')).toBe('Who pays')
    expect(spotName(doc, 'L3-9')).toBe('Lines 3 to 9')
    expect(spotName(doc, 'L41')).toBeNull()
    expect(spotName(pdf, 'p2')).toBe('Page 2')
    expect(spotName(pdf, 'p3')).toBeNull()
    expect(autoSpots(pdf).map((s) => s.id)).toEqual(['p1', 'p2'])
  })
})

describe('history', () => {
  const commit = (sha: string, at: string) => ({ sha, author: 'A', at, subject: sha })
  it('diffs fields and regions', () => {
    const a = artifact({ id: 'AR-01', regions: [region({ id: 'x', name: 'X', around: ['#a'] }), region({ id: 'y', name: 'Y' })] })
    const b = { ...a, title: 'Renamed', regions: [region({ id: 'x', name: 'X2', around: ['#b'] }), region({ id: 'z', name: 'Z' })] }
    expect(diffArtifacts(a, b).map((c) => c.field)).toEqual(['title', 'regions'])
    const r = regionChanges(a.regions, b.regions)
    expect(r.added.map((x) => x.id)).toEqual(['z'])
    expect(r.removed.map((x) => x.id)).toEqual(['y'])
    expect(r.changed).toEqual([{ id: 'x', name: 'X2', what: ['renamed', 'moved'] }])
  })

  it("folds the file's commits into the sidecar's, and shows an uncommitted file change", () => {
    const a = artifact({ id: 'AR-01' })
    const git = {
      versions: [
        { commit: commit('c2', '2026-10-03T10:00:00Z'), item: { ...a, title: 'Two' } },
        { commit: commit('c1', '2026-10-01T10:00:00Z'), item: a },
      ],
      dirty: false,
      working: { ...a, title: 'Two' },
    }
    const asset = {
      commits: [
        { commit: commit('c3', '2026-10-04T10:00:00Z'), from: 'b'.repeat(40), to: 'c'.repeat(40) },
        { commit: commit('c2', '2026-10-03T10:00:00Z'), from: 'a'.repeat(40), to: 'b'.repeat(40) },
        { commit: commit('c1', '2026-10-01T10:00:00Z'), from: null, to: 'a'.repeat(40) },
      ],
      dirty: true,
      head: 'c'.repeat(40),
      working: 'd'.repeat(40),
      mtime: '2026-10-05T10:00:00Z',
    }
    const t = buildArtifactTimeline(git, asset)
    const summary = t.map((e) => (e.type === 'change' ? `${e.commit?.sha ?? 'disk'}:${e.kind}:${e.changes.map((c) => c.field).join(',')}${e.uncommitted ? ':uncommitted' : ''}` : `commit:${e.commit.sha}`))
    expect(summary).toEqual(['disk:changed:content:uncommitted', 'c3:changed:content', 'c2:changed:title,content', 'c1:created:'])
  })

  it('shows an artifact never committed as created, not yet committed', () => {
    const a = artifact({ id: 'AR-01' })
    const t = buildArtifactTimeline({ versions: [], dirty: true, working: a, mtime: '2026-10-05T10:00:00Z' }, { commits: [], dirty: true, head: null, working: 'd'.repeat(40) })
    expect(t).toEqual([{ type: 'change', at: '2026-10-05T10:00:00Z', source: 'disk', kind: 'created', changes: [], uncommitted: true }])
  })
})

describe('find', () => {
  it('ignores case and runs of whitespace, and counts without overlaps', () => {
    expect(normQuery('  Trust   Account ')).toBe('trust account')
    expect(normText('The  trust\n account')).toBe('the trust account')
    expect(countIn('Trust account. The TRUST\naccount, and a trust  account.', 'trust account')).toBe(3)
    expect(countIn('aaaa', 'aa')).toBe(2)
    expect(countIn('anything', '   ')).toBe(0)
  })
  it("reads a PDF page's text as its text layer does: a line end is a space", () => {
    expect(pdfPageText([{ str: 'TIME', hasEOL: false }, { str: ' UNITS', hasEOL: true }, { str: 'and more' }])).toBe('TIME UNITS and more')
    expect(countIn(pdfPageText([{ str: 'billable', hasEOL: true }, { str: 'party' }]), 'billable party')).toBe(1)
  })
})

describe('the camera', () => {
  const pane = { w: 1000, h: 500 }
  it('fits a box in the middle, capped at a zoom', () => {
    const c = fitRect({ x: 0, y: 58, w: 1760, h: 1090 }, pane, { margin: 0 })
    expect(c.zoom).toBeCloseTo(500 / 1090)
    const v = viewOf(c, pane)
    expect(v.y).toBeCloseTo(58)
    expect(v.x + v.w / 2).toBeCloseTo(880)
    expect(fitRect({ x: 0, y: 0, w: 10, h: 10 }, pane, { maxZoom: 2 }).zoom).toBe(2)
  })
  it('zooms about a point, keeping it still, and eases between two views', () => {
    const c = { x: 100, y: 50, zoom: 1 }
    const z = zoomAbout(c, 2, 300, 200, 0.1)
    expect((300 - z.x) / z.zoom).toBeCloseTo((300 - c.x) / c.zoom)
    expect(lerpCamera(c, z, 0, pane)).toEqual(c)
    const end = lerpCamera(c, z, 1, pane)
    expect(end.zoom).toBeCloseTo(z.zoom)
    expect(end.x).toBeCloseTo(z.x)
  })
})

describe('the API', () => {
  let root: string
  const HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'artifacts-api-'))
    writeItem(item({ id: 'EP-01', type: 'epic' }), root)
    writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1' }), root)
    writeLayout({ positions: {}, lanes: [] }, root)
    mkdirSync(join(root, 'artifacts'), { recursive: true })
    writeFileSync(join(root, 'artifacts', 'AR-01.svg'), SVG)
    writeFileSync(join(root, 'artifacts', 'AR-01.md'), serialiseArtifact(artifact({ id: 'AR-01', regions: [region({ id: 'panel', around: ['#panel'] })] })))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('loads artifacts with what their files hold, and checks them', () => {
    const cat = loadCatalogue(root)
    expect(cat.artifacts['AR-01']!.meta).toMatchObject({ format: 'svg', bounds: { x: 0, y: 58, w: 800, h: 400 } })
    expect(cat.artifacts['AR-01']!.meta.fileRev).toMatch(/^[0-9a-f]{40}$/)
    expect(cat.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('refuses a card save that links to a missing artifact or spot', () => {
    const a = createCatalogueApi(root)
    const rec = a.getState().items['US-01.1.1']!
    const save = (artifacts: string[]) => a.handle({ method: 'PUT', path: '/api/items/US-01.1.1', body: { record: { ...rec.data, artifacts }, baseRev: a.getState().items['US-01.1.1']!.rev }, headers: HEADERS })
    expect(() => save(['AR-01#nope'])).toThrow(HttpError)
    expect(() => save(['AR-09'])).toThrow(/does not exist/)
    expect((save(['AR-01#panel']) as { data: { artifacts: string[] } }).data.artifacts).toEqual(['AR-01#panel'])
  })

  it("saves an artifact's details and nothing else: its file, regions and source stay as on disk", () => {
    const events: { kind: string }[] = []
    const a = createCatalogueApi(root, (e) => events.push(e))
    const rec = a.getState().artifacts['AR-01']!
    const record = { ...rec.data, title: '  Renamed  ', date: '2021', author: 'Peritia', status: 'Draft', supersededBy: 'AR-01', file: 'artifacts/AR-09.svg', regions: [], source: 'flowchart LR\n A', extra: { hack: 1 } }
    const saved = a.handle({ method: 'PUT', path: '/api/artifacts/AR-01', body: { record, baseRev: rec.rev }, headers: HEADERS }) as ArtifactRec
    expect(saved.data).toMatchObject({ title: 'Renamed', date: '2021', author: 'Peritia', status: 'Draft', supersededBy: null, file: 'artifacts/AR-01.svg', source: '', extra: {} })
    expect(saved.data.regions.map((r) => r.id)).toEqual(['panel'])
    expect(saved.meta.format).toBe('svg')
    expect(loadCatalogue(root).artifacts['AR-01']!.data.title).toBe('Renamed')
    expect(events.map((e) => e.kind)).toContain('artifact')
  })

  it('refuses an artifact save from a stale version, or one that breaks the check', () => {
    const a = createCatalogueApi(root)
    const rec = a.getState().artifacts['AR-01']!
    const put = (patch: Partial<Artifact>, baseRev = a.getState().artifacts['AR-01']!.rev) =>
      a.handle({ method: 'PUT', path: '/api/artifacts/AR-01', body: { record: { ...rec.data, ...patch }, baseRev }, headers: HEADERS })
    expect(() => put({ date: '6 Oct' })).toThrow(/YYYY-MM-DD/)
    expect(() => put({ title: ' ' })).toThrow(/title is empty/)
    expect(() => put({ status: 'Superseded', supersededBy: 'AR-09' })).toThrow(/does not exist/)
    expect(() => put({ description: 'Intro\n## Source\nmore' })).toThrow(/## Source/)
    put({ title: 'First' })
    expect(() => put({ title: 'Second' }, rec.rev)).toThrow(expect.objectContaining({ status: 409 }))
    expect(() => a.handle({ method: 'PUT', path: '/api/artifacts/AR-09', body: { record: {}, baseRev: 'x' }, headers: HEADERS })).toThrow(/does not exist/)
  })

  it("tells clients when an artifact's file changes on disk", () => {
    const events: unknown[] = []
    const a = createCatalogueApi(root, (e) => events.push(e))
    writeFileSync(join(root, 'artifacts', 'AR-01.svg'), SVG.replace('Two', 'Three'))
    a.syncFromDisk()
    expect(events).toContainEqual(expect.objectContaining({ kind: 'artifact', id: 'AR-01' }))
  })

  it('reads an artifact history from injected git', async () => {
    const a = createCatalogueApi(root, () => {}, {
      gitHistory: (async () => ({ versions: [], dirty: true, working: parseArtifact(serialiseArtifact(artifact({ id: 'AR-01' }))), mtime: '2026-10-05T10:00:00Z' })) as never,
      gitAssetHistory: async () => ({ commits: [], dirty: true, head: null, working: 'd'.repeat(40) }),
    })
    const res = (await a.handle({ method: 'GET', path: '/api/artifacts/AR-01/history' })) as { entries: { kind: string }[] }
    expect(res.entries.map((e) => e.kind)).toEqual(['created'])
  })

  it("serves an artifact's file through its sidecar only, with script blocked for an SVG", () => {
    const headers: Record<string, string> = {}
    const res = { setHeader: (k: string, v: string) => (headers[k] = v), end: () => {}, on: () => res, once: () => res, emit: () => true, write: () => true } as unknown as ServerResponse
    const arts = loadCatalogue(root).artifacts
    expect(serveArtifactFile(root, arts, new URL('/artifact-file/AR-09', 'http://local'), res)).toBe(false)
    expect(serveArtifactFile(root, arts, new URL('/artifact-file/..%2Frequirements%2FEP-01', 'http://local'), res)).toBe(false)
    expect(serveArtifactFile(root, arts, new URL('/artifact-file/AR-01', 'http://local'), res)).toBe(true)
    expect(headers['Content-Type']).toBe('image/svg+xml')
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'")
  })
})

/**
 * A small synthetic catalogue for the specs that write (drags, lane edits), so
 * they never touch the real requirements. `playwright.config.ts` writes it
 * before booting the board over it; specs call `writeFixture` to reset it.
 *   node e2e/fixtureCatalogue.ts <dir>
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'
import { writeItem, writeLayout } from '../server/catalogueFs.ts'
import { serialiseArtifact } from '../shared/files.ts'
import type { Artifact, Item } from '../shared/types.ts'

export const FIXTURE_DIR = join(tmpdir(), 'requirements-board-e2e')
export const FIXTURE_LANES = ['MVP', 'Phase 2']

/** 2 epics x 4 features x 3 stories; each feature's first story is in MVP. */
export function fixtureItems(): Item[] {
  const base = { status: 'Proposed', components: ['Scheduling Engine'], sources: ['Fixture'], images: [], description: '', acceptance: '', technical: '', notes: '', extra: {}, swimlane: null } as const
  const out: Item[] = []
  for (let e = 1; e <= 2; e++) {
    const ep = `EP-0${e}`
    out.push({ ...base, id: ep, type: 'epic', parent: null, title: `Epic ${e}`, order: e, components: [...base.components], sources: [...base.sources], images: [], related: [], artifacts: [] })
    for (let f = 1; f <= 4; f++) {
      const ft = `FT-0${e}.${f}`
      out.push({ ...base, id: ft, type: 'feature', parent: ep, title: `Feature ${e}.${f}`, order: f, components: [...base.components], sources: [...base.sources], images: [], related: [], artifacts: [] })
      for (let s = 1; s <= 3; s++) {
        out.push({ ...base, id: `US-0${e}.${f}.${s}`, type: 'story', parent: ft, title: `Story ${e}.${f}.${s}`, order: s, swimlane: s === 1 ? 'MVP' : null, components: [...base.components], sources: [...base.sources], images: [], related: [], artifacts: [] })
      }
    }
  }
  return out
}

export function writeFixture(dir = FIXTURE_DIR) {
  rmSync(join(dir, 'requirements'), { recursive: true, force: true })
  rmSync(join(dir, 'questions'), { recursive: true, force: true })
  mkdirSync(join(dir, 'questions'), { recursive: true })
  for (const it of fixtureItems()) writeItem(it, dir)
  writeLayout({ positions: {}, lanes: FIXTURE_LANES }, dir)
  writeFixtureArtifacts(dir)
}

/* -------------------------------------------------------------- artifacts */

/**
 * An SVG with an offset viewBox and things that must never run (a script, an onload, embedded
 * HTML); a PNG; a mermaid flowchart; a Markdown note; a two-page PDF. Each has a region.
 */
export const FIXTURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 50 800 400" width="800" height="400" onload="window.__pwned=1">
<title>Fixture drawing</title>
<script>window.__pwned = 1</script>
<rect x="0" y="50" width="800" height="400" fill="#f3f6fa"/>
<rect id="panel-a" x="40" y="90" width="300" height="200" rx="12" fill="#ffffff" stroke="#cccccc"/>
<text x="60" y="130" font-size="24">Totals panel</text>
<text x="60" y="170" font-size="16">Copy this sentence please</text>
<rect x="420" y="90" width="300" height="200" rx="12" fill="#ffffff" stroke="#cccccc"/>
<text x="440" y="130" font-size="24">Other panel</text>
<foreignObject x="0" y="50" width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml" id="pwned-html">x</div></foreignObject>
</svg>
`

export const FIXTURE_NOTE = `# Fixture note

An opening paragraph.

## First section

Alpha line one.
Alpha line two.

## Second section

The quick brown fox jumps over the lazy dog.
`

/** A solid-colour PNG, w x h. */
function png(w: number, h: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 0xc8)])
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

/** A plain PDF, one page per list of lines, in Helvetica. */
export function tinyPdf(pages: string[][]): Buffer {
  const objs: string[] = []
  const pageId = (i: number) => 4 + i * 2
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  pages.forEach((lines, i) => {
    const stream = `BT /F1 18 Tf 72 720 Td 26 TL ${lines.map((l) => `(${l}) Tj T*`).join(' ')} ET`
    objs[pageId(i)] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId(i) + 1} 0 R >>`
    objs[pageId(i) + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })
  let out = '%PDF-1.4\n'
  const at: number[] = []
  for (let n = 1; n < objs.length; n++) {
    at[n] = out.length
    out += `${n} 0 obj\n${objs[n]}\nendobj\n`
  }
  const xref = out.length
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n${at.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}

const artifact = (a: Partial<Artifact> & Pick<Artifact, 'id' | 'title' | 'kind'>): Artifact => ({
  status: 'Current',
  supersededBy: null,
  date: null,
  author: 'Fixture',
  components: ['Scheduling Engine'],
  sources: ['Fixture'],
  file: null,
  regions: [],
  description: '',
  source: '',
  extra: {},
  ...a,
})
const region = (id: string, name: string, around: string[], more: { page?: number; box?: [number, number, number, number] } = {}) => ({ id, name, around, box: more.box ?? null, page: more.page ?? null, pad: null, note: '' })

export function fixtureArtifacts(): Artifact[] {
  return [
    artifact({ id: 'AR-01', title: 'Fixture drawing', kind: 'diagram', date: '2026-10-06', file: 'artifacts/AR-01.svg', regions: [region('totals', 'Totals', ['text=Totals panel', 'text=Copy this sentence please']), region('panel-a', 'Panel A', ['#panel-a'])] }),
    artifact({ id: 'AR-02', title: 'Fixture picture', kind: 'screenshot', date: '2026-09-30', file: 'artifacts/AR-02.png', regions: [region('corner', 'Corner', [], { box: [0, 0, 120, 80] })] }),
    artifact({ id: 'AR-03', title: 'Fixture flow', kind: 'diagram', date: '2026-10', source: 'flowchart LR\n  A[Booking] --> B[Contract]\n  B --> C[Invoice]', regions: [region('contract', 'The contract step', ['node=B'])] }),
    artifact({ id: 'AR-04', title: 'Fixture note', kind: 'note', date: '2026-10-01', file: 'notes/fixture-note.md', regions: [region('fox', 'The fox', ['quote=The quick brown fox jumps over the lazy dog.'])] }),
    artifact({ id: 'AR-05', title: 'Fixture document', kind: 'document', date: '2021', file: 'artifacts/AR-05.pdf', regions: [region('time-table', 'Time table', ['quote=Time units table'], { page: 2 })] }),
  ]
}

export function writeFixtureArtifacts(dir = FIXTURE_DIR) {
  rmSync(join(dir, 'artifacts'), { recursive: true, force: true })
  rmSync(join(dir, 'notes'), { recursive: true, force: true })
  mkdirSync(join(dir, 'artifacts'), { recursive: true })
  mkdirSync(join(dir, 'notes'), { recursive: true })
  writeFileSync(join(dir, 'artifacts', 'AR-01.svg'), FIXTURE_SVG)
  writeFileSync(join(dir, 'artifacts', 'AR-02.png'), png(240, 160))
  writeFileSync(join(dir, 'notes', 'fixture-note.md'), FIXTURE_NOTE)
  writeFileSync(join(dir, 'artifacts', 'AR-05.pdf'), tinyPdf([['Fixture page one', 'Totals live here'], ['Second page heading', 'Time units table']]))
  for (const a of fixtureArtifacts()) writeFileSync(join(dir, 'artifacts', `${a.id}.md`), serialiseArtifact(a))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeFixture(process.argv[2] ?? FIXTURE_DIR)

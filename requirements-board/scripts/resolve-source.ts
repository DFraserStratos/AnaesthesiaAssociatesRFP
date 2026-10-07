/**
 * Where a source points: the artifact, its file and the page or lines a `sources:` string cites,
 * resolved as the board resolves it (shared/sources.ts). For agents that need the reasoning
 * behind a requirement without reading a whole transcript.
 *
 *   npm run source -- "Notes 2026-10-01 · AA meeting with Greg #16"   one source string
 *   npm run source -- --item US-04.2.3                                 every source of an item, question or artifact
 *   npm run source -- --item US-04.2.3 --text                          ... and print each cited passage
 *   npm run source -- --report                                         the whole catalogue: counts, unresolved, a sample
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSourceIndex, resolveSource, spotFactsOfMeta, type SourceResolution } from '../shared/sources.ts'
import { linesOfRegionId, pageOfRegionId, type ArtifactRec } from '../shared/types.ts'
import { REPO_ROOT } from '../server/artifactFiles.ts'
import { loadCatalogue } from '../server/catalogueFs.ts'

const argv = process.argv.slice(2)
const opt = (name: string) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const flag = (name: string) => argv.includes(name)
if (flag('--help') || !argv.length) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]!.replace(/^\/\*\*?|^ \* ?/gm, ''))
  process.exit(0)
}

const { items, questions, artifacts } = loadCatalogue()
const recs = artifacts as Record<string, ArtifactRec>
const index = buildSourceIndex(
  Object.values(recs).map((r) => r.data),
  (id) => (recs[id] ? spotFactsOfMeta(recs[id]!.meta) : null),
)
const withText = flag('--text')
const pdfPages = new Map<string, string[]>()
const pdfText = (path: string, page: number) => {
  if (!pdfPages.has(path)) {
    const script = join(dirname(fileURLToPath(import.meta.url)), '../server/pdfFacts.ts')
    const out = JSON.parse(execFileSync(process.execPath, [script, join(REPO_ROOT, path)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })) as { pages?: { text: string }[] }
    pdfPages.set(path, (out.pages ?? []).map((p) => p.text))
  }
  return pdfPages.get(path)![page - 1] ?? ''
}

function describe(source: string, r: SourceResolution): string {
  if (r.kind === 'plain') return `${source}\n  not a citation of an artifact`
  if (r.kind === 'question') return `${source}\n  question ${r.id}${questions[r.id] ? `: ${questions[r.id]!.data.title}` : ' (does not exist)'}`
  if (r.kind === 'unresolved') return `${source}\n  UNRESOLVED: ${r.reason}`
  const rec = recs[r.id]!
  const out = [`${source}`, `  ${r.id} ${rec.data.title}${rec.meta.path ? `\n  file: ${rec.meta.path}` : ''}`]
  for (const s of r.spots) {
    const page = s.region ? pageOfRegionId(s.region) : null
    const lines = s.region ? linesOfRegionId(s.region) : null
    const where = page !== null ? `PDF page ${page}${rec.meta.pages ? ` of ${rec.meta.pages.length}` : ''}` : lines ? `lines ${lines.from}-${lines.to}` : s.region ? `#${s.region}` : 'the whole artifact'
    out.push(`  ${[s.label, where, page === null ? s.detail : null].filter(Boolean).join(' · ')}${s.problem ? `  PROBLEM: ${s.problem}` : ''}  (${s.region ? `${r.id}#${s.region}` : r.id})`)
    if (withText && rec.meta.path && !s.problem) {
      let text = ''
      if (page !== null) text = pdfText(rec.meta.path, page)
      else if (lines || (s.region && rec.meta.headings)) {
        const all = readFileSync(join(REPO_ROOT, rec.meta.path), 'utf8').split('\n')
        const h = rec.meta.headings?.find((x) => x.slug === s.region)
        const next = h ? rec.meta.headings!.find((x) => x.line > h.line && x.depth <= h.depth) : undefined
        const [from, to] = lines ? [lines.from, lines.to] : h ? [h.line, next ? next.line - 1 : all.length] : [0, -1]
        text = all.slice(from - 1, to).join('\n')
      }
      if (text) out.push(text.replace(/^/gm, '    | '))
    }
  }
  return out.join('\n')
}

const recordSources = (id: string): { sources: string[]; self?: string } | null => {
  if (items[id]) return { sources: items[id]!.data.sources }
  if (questions[id]) return { sources: questions[id]!.data.sources }
  if (recs[id]) return { sources: recs[id]!.data.sources, self: id }
  return null
}

if (flag('--report')) {
  const all: { owner: string; source: string; self?: string }[] = []
  for (const r of Object.values(items)) for (const s of r.data.sources) all.push({ owner: r.data.id, source: s })
  for (const r of Object.values(questions)) for (const s of r.data.sources) all.push({ owner: r.data.id, source: s })
  for (const r of Object.values(recs)) for (const s of r.data.sources) all.push({ owner: r.data.id, source: s, self: r.data.id })
  const kinds = new Map<string, number>()
  const perArtifact = new Map<string, number>()
  const unresolved: string[] = []
  const problems: string[] = []
  const plain = new Map<string, number>()
  for (const { owner, source, self } of all) {
    const r = resolveSource(index, source, self)
    const own = self && r.kind === 'plain' && resolveSource(index, source).kind === 'artifact'
    kinds.set(own ? 'own (an artifact citing itself, shown plain)' : r.kind, (kinds.get(own ? 'own (an artifact citing itself, shown plain)' : r.kind) ?? 0) + 1)
    if (own) continue
    if (r.kind === 'artifact') {
      perArtifact.set(r.id, (perArtifact.get(r.id) ?? 0) + 1)
      for (const s of r.spots) if (s.problem) problems.push(`${owner.padEnd(10)} ${source}  ->  ${s.problem}`)
    } else if (r.kind === 'unresolved') unresolved.push(`${owner.padEnd(10)} ${source}  ->  ${r.reason}`)
    else if (r.kind === 'plain') {
      const key = source.replace(/ #\d+/g, ' #n').replace(/\d{4}-\d{2}-\d{2}/, 'DATE')
      plain.set(key, (plain.get(key) ?? 0) + 1)
    }
  }
  console.log(`${all.length} sources: ${[...kinds].map(([k, n]) => `${n} ${k}`).join(', ')}`)
  console.log('\nResolved, per artifact:')
  for (const [id, n] of [...perArtifact].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${id} ${recs[id]!.data.title}`)
  console.log(`\nUnresolved (${unresolved.length}):`)
  for (const u of unresolved) console.log(`  ${u}`)
  console.log(`\nResolved, but the spot is missing (${problems.length}):`)
  for (const p of problems) console.log(`  ${p}`)
  console.log(`\nPlain, not citations (${[...plain.values()].reduce((a, b) => a + b, 0)}):`)
  for (const [k, n] of [...plain].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
  const n = Number(opt('--sample') ?? 0)
  if (n) {
    const shapes = new Map<string, { owner: string; source: string; self?: string }>()
    for (const x of all) {
      const key = `${x.source.split(/ \d| ·|:/)[0]}|${/#\d+ #\d+/.test(x.source)}`
      if (!shapes.has(key)) shapes.set(key, x)
    }
    const picks = [...shapes.values(), ...all.filter((_, i) => i % Math.max(1, Math.floor(all.length / n)) === 0)].slice(0, n)
    console.log(`\nSample (${picks.length}):`)
    for (const { owner, source, self } of picks) console.log(`\n[${owner}] ${describe(source, resolveSource(index, source, self))}`)
  }
  process.exit(0)
}

const id = opt('--item')
if (id) {
  const rec = recordSources(id)
  if (!rec) {
    console.error(`${id} is not an item, question or artifact`)
    process.exit(1)
  }
  if (!rec.sources.length) console.log(`${id} has no sources`)
  for (const s of rec.sources) console.log(describe(s, resolveSource(index, s, rec.self)) + '\n')
} else {
  const s = argv.find((a) => !a.startsWith('--'))!
  console.log(describe(s, resolveSource(index, s)))
}

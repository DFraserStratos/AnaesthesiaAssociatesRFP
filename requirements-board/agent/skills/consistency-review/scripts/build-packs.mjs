// Builds the read-only reading packs for stage 2 of the consistency review, and index.json (the workflow's arguments).
// Usage: node build-packs.mjs --out <run dir> [--repo <repo root, default .>] [--req <catalogue dir relative to the repo,
//          default requirements-board/requirements>] [--rulings <rulings.md, default <out>/rulings.md>]
// Writes <out>/packs/<EP|FT id>.md (one per live epic, holding its direct stories, and one per live feature with all its
// descendants), <out>/artifact-packs/<AR id>.md (one per diagram artifact: sidecar, text drawn in the SVG, linking items)
// and <out>/index.json: units, diagrams, topics (the rulings' "###" headings under "Rulings by topic", when the rulings
// file exists), notes, changes, answeredQuestions, counts. Run it on the committed baseline.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'

const { values: a } = parseArgs({ options: { repo: { type: 'string', default: '.' }, req: { type: 'string', default: 'requirements-board/requirements' }, out: { type: 'string' }, rulings: { type: 'string' } } })
if (!a.out) { console.error('usage: node build-packs.mjs --out <run dir> [--repo <root>] [--req <catalogue dir>] [--rulings <rulings.md>]'); process.exit(2) }
const repo = path.resolve(a.repo)
const out = path.resolve(a.out)
const REQ_REL = a.req.replace(/\/+$/, '')
const REQ = path.join(repo, REQ_REL)
// Which status numbers mean answered and retired: the roles in the board's config (statuses.ts defaults without one).
// A number means nothing by itself, so packs show statuses by label.
const roleCode = (list, role, fallback) => String((Array.isArray(list) ? list.find((d) => d?.role === role)?.code : undefined) ?? fallback)
const labelOf = (list, code) => (Array.isArray(list) ? list.find((d) => String(d?.code) === String(code))?.label : undefined) ?? String(code)
const boardConfig = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(REQ, 'board.config.json'), 'utf8'))
  } catch {
    return {}
  }
})()
const ANSWERED = roleCode(boardConfig.questionStatuses, 'answered', 4)
const RETIRED = roleCode(boardConfig.statuses, 'retired', 5)
// yaml is a dependency of the board app, which sits one level above its catalogue folder
const require = createRequire(path.join(REQ, '..', 'package.json'))
const YAML = require('yaml')

const read = (p) => fs.readFileSync(p, 'utf8')
function parse(file) {
  const raw = read(file)
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  return m ? { fm: YAML.parse(m[1]) ?? {}, body: m[2].trim(), raw } : { fm: {}, body: raw.trim(), raw }
}
const ID_RE = /\b(EP-\d+|FT-\d+\.\d+|US-\d+\.\d+\.\d+|OQ-\d+|AR-\d+)\b/g
const idsIn = (s) => [...new Set((s.match(ID_RE) ?? []))]

// ---- load
const items = {}
for (const f of fs.readdirSync(path.join(REQ, 'stories')).filter((f) => f.endsWith('.md'))) {
  const { fm, body, raw } = parse(path.join(REQ, 'stories', f))
  items[fm.id] = { ...fm, body, raw, file: `${REQ_REL}/stories/${f}` }
}
const questions = {}
for (const f of fs.readdirSync(path.join(REQ, 'questions')).filter((f) => /^OQ-/.test(f))) {
  const { fm, body, raw } = parse(path.join(REQ, 'questions', f))
  questions[fm.id] = { ...fm, body, raw, file: `${REQ_REL}/questions/${f}` }
}
const artifacts = {}
for (const f of fs.readdirSync(path.join(REQ, 'artifacts')).filter((f) => /^AR-\d+\.md$/.test(f))) {
  const { fm, body, raw } = parse(path.join(REQ, 'artifacts', f))
  artifacts[fm.id] = { ...fm, src: fm.file, body, raw, file: `${REQ_REL}/artifacts/${f}` }
}
const notes = fs.readdirSync(path.join(REQ, 'notes')).filter((f) => /^\d{4}-/.test(f)).sort()

// ---- link graph (related both ways, text links, mentioned-in)
const links = {}
const add = (a, b) => { if (a === b || !items[a] || !items[b]) return; (links[a] ??= new Set()).add(b); (links[b] ??= new Set()).add(a) }
for (const it of Object.values(items)) {
  for (const r of it.related ?? []) add(it.id, r)
  for (const r of idsIn(it.body)) add(it.id, r)
}
const qAffecting = {}
for (const q of Object.values(questions)) for (const a of q.affects ?? []) (qAffecting[a] ??= []).push(q.id)
for (const q of Object.values(questions)) for (const r of idsIn(q.body)) if (items[r] && !(q.affects ?? []).includes(r)) (qAffecting[r] ??= []).push(q.id)

// ---- note points: "Notes <date> · <words> #n #m"
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const notePoints = {}
function pointsOf(noteFile) {
  if (notePoints[noteFile]) return notePoints[noteFile]
  const lines = read(path.join(REQ, 'notes', noteFile)).split('\n')
  const pts = {}
  let cur = null
  for (const line of lines) {
    const m = line.match(/^(\d+)\. /)
    if (m) { cur = m[1]; pts[cur] = [line]; continue }
    if (cur && (/^\s+\S/.test(line) || line === '')) { pts[cur].push(line); continue }
    cur = null
  }
  for (const k of Object.keys(pts)) pts[k] = pts[k].join('\n').trim()
  return (notePoints[noteFile] = pts)
}
function citedPoints(source) {
  const m = String(source).match(/^Notes (\d{4}-\d{2}-\d{2}) · ([^#]+?)\s*((?:#\d+\s*)*)$/)
  if (!m) return []
  const file = notes.find((n) => n === `${m[1]}-${slug(m[2])}.md`)
  if (!file) return [{ source, text: '(note not found)' }]
  const nums = [...m[3].matchAll(/#(\d+)/g)].map((x) => x[1])
  const pts = pointsOf(file)
  return nums.map((n) => ({ source: `${m[1]} ${m[2]} #${n}`, text: pts[n] ?? '(point not found)' }))
}

// ---- pack writers
const summary = (it) => {
  const first = it.body.split(/\n## /)[0].trim().replace(/\s+/g, ' ')
  return first.length > 700 ? first.slice(0, 700) + ' …' : first
}
function questionBlock(q) {
  if (String(q.status) === ANSWERED) return `### ${q.id} (answered, may define a rule) · ${q.title}\nFile: ${q.file}\n\n${q.body}\n`
  return `### ${q.id} (${labelOf(boardConfig.questionStatuses, q.status)}: NOT a ruling, never a basis for an edit) · ${q.title}\n`
}
function pack(title, coreIds) {
  const core = new Set(coreIds)
  const out = [`# Reading pack: ${title}\n`, `Core items (check these): ${coreIds.join(', ')}\n`]
  out.push('## Core items, full text\n')
  for (const id of coreIds) out.push(`---\nFile: ${items[id].file}\n\n${items[id].raw.trim()}\n`)
  const neighbours = new Set()
  for (const id of coreIds) for (const n of links[id] ?? []) if (!core.has(n)) neighbours.add(n)
  if (neighbours.size) {
    out.push('\n## Linked items outside this pack (summary only; full file at the path given)\n')
    for (const n of [...neighbours].sort()) {
      const it = items[n]
      out.push(`- **${n}** · ${it.title} · ${labelOf(boardConfig.statuses, it.status)} · parent ${it.parent ?? '-'} · ${it.file}\n  ${summary(it)}`)
    }
  }
  const qs = [...new Set(coreIds.flatMap((id) => qAffecting[id] ?? []))].sort()
  if (qs.length) { out.push('\n## Questions that affect or mention the core items\n'); for (const q of qs) out.push(questionBlock(questions[q])) }
  const arts = [...new Set(coreIds.flatMap((id) => (items[id].artifacts ?? []).map((a) => String(a).split('#')[0])))].sort()
  if (arts.length) {
    out.push('\n## Artifacts the core items point at\n')
    for (const a of arts) { const ar = artifacts[a]; if (ar) out.push(`- ${a} · ${ar.title} · ${ar.kind} · ${ar.date ?? ''}`) }
  }
  const cites = []
  for (const id of coreIds) for (const s of items[id].sources ?? []) for (const c of citedPoints(s)) cites.push({ id, ...c })
  if (cites.length) {
    out.push('\n## Note points the core items cite (verbatim)\n')
    const seen = new Set()
    for (const c of cites) {
      if (seen.has(c.source)) continue
      seen.add(c.source)
      out.push(`### ${c.source} (cited by ${cites.filter((x) => x.source === c.source).map((x) => x.id).join(', ')})\n${c.text}\n`)
    }
  }
  return out.join('\n')
}

fs.mkdirSync(path.join(out, 'packs'), { recursive: true })
fs.mkdirSync(path.join(out, 'artifact-packs'), { recursive: true })
const live = (id) => String(items[id].status) !== RETIRED
const childrenOf = (id) => Object.values(items).filter((x) => x.parent === id && live(x.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((x) => x.id)
const units = []
for (const ep of Object.keys(items).filter((id) => /^EP-/.test(id) && live(id)).sort()) {
  const direct = childrenOf(ep).filter((id) => /^US-/.test(id))
  const epUnit = { id: ep, epic: ep, title: items[ep].title, core: [ep, ...direct] }
  units.push(epUnit)
  for (const ft of childrenOf(ep).filter((id) => /^FT-/.test(id))) {
    const desc = (function walk(id) { return childrenOf(id).flatMap((c) => [c, ...walk(c)]) })(ft)
    units.push({ id: ft, epic: ep, title: items[ft].title, core: [ft, ...desc] })
  }
}
for (const u of units) {
  const text = pack(`${u.id} · ${u.title}`, u.core)
  fs.writeFileSync(path.join(out, 'packs', `${u.id}.md`), text)
  u.pack = path.join(out, 'packs', `${u.id}.md`)
  u.chars = text.length
}

// ---- artifact packs: diagrams (SVG text extracted) + every sidecar
const svgText = (file) => {
  const svg = read(file)
  return [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim())
    .filter(Boolean).join('\n')
}
const linkedFrom = {}
for (const it of Object.values(items)) for (const a of it.artifacts ?? []) (linkedFrom[String(a).split('#')[0]] ??= new Set()).add(it.id)
const diagramIds = Object.keys(artifacts).filter((a) => artifacts[a].kind === 'diagram').sort()
for (const a of diagramIds) {
  const ar = artifacts[a]
  const file = path.join(REQ, ar.src ?? '')
  let body = `# Artifact pack: ${a} · ${ar.title}\n\nSidecar: ${ar.file ? ar.file : '-'}\n\n\`\`\`\n${ar.raw.trim()}\n\`\`\`\n`
  if (ar.src && ar.src.endsWith('.svg') && fs.existsSync(file)) body += `\n## Text drawn in the diagram (${REQ_REL}/${ar.src}), in document order\n\n${svgText(file)}\n`
  else if (ar.src && fs.existsSync(file) && /\.(md|mmd|mermaid)$/.test(ar.src)) body += `\n## Diagram source (${REQ_REL}/${ar.src})\n\n${read(file)}\n`
  body += `\n## Items that link to it\n${[...(linkedFrom[a] ?? [])].sort().map((i) => `- ${i} · ${items[i]?.title}`).join('\n')}\n`
  fs.writeFileSync(path.join(out, 'artifact-packs', `${a}.md`), body)
}

function topicsFrom(file) {
  if (!fs.existsSync(file)) return []
  let inTopics = false
  const t = []
  for (const l of read(file).split('\n')) {
    if (/^## /.test(l)) inTopics = /^## Rulings by topic/.test(l)
    else if (inTopics && /^### /.test(l)) t.push(l.slice(4).trim())
  }
  return t
}
const index = {
  units: units.map(({ id, epic, title, core, pack, chars }) => ({ id, epic, title, core, pack, chars })),
  diagrams: diagramIds.map((a) => ({ id: a, title: artifacts[a].title, pack: path.join(out, 'artifact-packs', `${a}.md`), svg: artifacts[a].src ? `${REQ_REL}/${artifacts[a].src}` : null })),
  notes: notes.map((n) => `${REQ_REL}/notes/${n}`),
  changes: fs.readdirSync(path.join(REQ, 'changes')).filter((f) => /^\d{4}-/.test(f)).sort().map((f) => `${REQ_REL}/changes/${f}`),
  answeredQuestions: Object.values(questions).filter((q) => String(q.status) === ANSWERED).map((q) => q.id).sort(),
  topics: topicsFrom(a.rulings ?? path.join(out, 'rulings.md')),
  counts: { items: Object.keys(items).length, live: Object.keys(items).filter(live).length, questions: Object.keys(questions).length },
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2))
const sizes = units.map((u) => u.chars).sort((a, b) => a - b)
console.log(`units ${units.length}, diagrams ${diagramIds.length}, pack chars min ${sizes[0]} median ${sizes[sizes.length >> 1]} max ${sizes.at(-1)} total ${sizes.reduce((a, b) => a + b, 0)}`)
console.log(units.filter((u) => u.chars > 120000).map((u) => `${u.id} ${u.chars}`).join('\n'))

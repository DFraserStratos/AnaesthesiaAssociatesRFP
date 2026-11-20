/**
 * The consistency review's scripts, run as an agent runs them (plain `node`, no build step), on a scratch
 * catalogue made here with the board beside it. Never touches the real catalogue.
 *
 *   node --test requirements-board/agent/skills/consistency-review/consistency-review.test.mjs
 *   CR_SCRIPTS=<folder> node --test ...   the scripts to test (default: scripts/ beside this file)
 *   CR_NO_PROTECTED=1                      leave out --protected (only to run these proofs on scripts
 *                                          older than that option, to show they fail there)
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const K = path.resolve(process.env.CR_SCRIPTS ?? path.join(here, 'scripts'))
const BOARD = path.resolve(here, '..', '..', '..')
const { JSDOM } = createRequire(path.join(BOARD, 'package.json'))('jsdom')
const PROTECT = process.env.CR_NO_PROTECTED ? [] : ['--protected', 'AR-03']
const made = []
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }) })

// ---------- a scratch repository: <repo>/board/requirements, the real board's code beside it
const REQ_REL = 'board/requirements'
const md = (fm, body = '') => `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${Array.isArray(v) ? (v.length ? '\n' + v.map((x) => `  - ${JSON.stringify(x)}`).join('\n') : '[]') : v}`).join('\n')}\n---\n${body}`
const item = (id, type, parent, status, body, extra = {}) => md({ id, type, title: `Title of ${id}`, status, ...(parent ? { parent } : {}), components: [], related: [], sources: [], ...extra }, body)
const sidecar = (id, kind, title, file, status = 'Current') => md({ id, title: JSON.stringify(title), kind, status, date: '2026-10-16', author: 'Sam', components: [], sources: [], file })

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'cr-'))
  made.push(repo)
  const board = path.join(repo, 'board')
  const REQ = path.join(repo, REQ_REL)
  for (const d of ['stories', 'questions', 'artifacts/files', 'notes', 'changes', 'reference']) fs.mkdirSync(path.join(REQ, d), { recursive: true })
  for (const d of ['shared', 'server', 'node_modules']) fs.symlinkSync(path.join(BOARD, d), path.join(board, d))
  fs.copyFileSync(path.join(BOARD, 'package.json'), path.join(board, 'package.json'))
  const w = (f, t) => fs.writeFileSync(path.join(REQ, f), t)
  w('board.config.json', JSON.stringify({ statuses: [{ code: 1, label: 'Draft', role: 'default' }, { code: 3, label: 'Agreed' }, { code: 5, label: 'Retired', role: 'retired' }], questionStatuses: [{ code: 1, label: 'Open', role: 'default' }, { code: 4, label: 'Answered', role: 'answered' }] }))
  w('stories/EP-01.md', item('EP-01', 'epic', null, 3, 'An epic.\n'))
  w('stories/FT-01.1.md', item('FT-01.1', 'feature', 'EP-01', 3, 'A feature.\n'))
  w('stories/US-01.1.1.md', item('US-01.1.1', 'story', 'FT-01.1', 3, 'Old rule text. Second line here.\n', { sources: ['Notes 2026-10-16 · Sam pricing call #1', "Notes 2026-10-16 · Sam's pricing call #2"] }))
  w('stories/US-01.1.2.md', item('US-01.1.2', 'story', 'FT-01.1', 5, 'Retired words.\n'))
  w('stories/US-01.1.3.md', item('US-01.1.3', 'story', 'FT-01.1', 3, 'Third story words.\n'))
  w('questions/OQ-01.md', md({ id: 'OQ-01', title: 'A question', status: 4, owner: 'Sam', affects: [], sources: [] }, 'What is it?\n\n## Answer\n\nThe answer text.\n'))
  // notes: a title that differs from the file's slug words (apostrophe, &, colon, non-ASCII)
  const notes = [
    ['AR-10', '2026-10-16-sam-pricing-call', "Sam's pricing call", '1. Prices are set per list.\n2. Prices round to cents.\n'],
    ['AR-11', '2026-10-16-r-d-review', 'R&D review', '1. Research first.\n'],
    ['AR-12', '2026-10-17-decision-payer', 'Decision: payer', '1. A payer on each item.\n'],
    ['AR-13', '2026-10-18-te-reo-māori-hui', 'Te reo Māori hui', '1. Names in te reo.\n'],
  ]
  for (const [id, base, title, points] of notes) {
    w(`notes/${base}.md`, `# ${title}, ${base.slice(0, 10)}\n\n${points}`)
    w(`artifacts/${id}.md`, sidecar(id, 'note', title, `notes/${base}.md`))
  }
  // diagrams: live, retired, protected, and one whose file is written from the repository root
  const svg = (t) => `<svg xmlns="http://www.w3.org/2000/svg"><text>${t}</text></svg>`
  w('artifacts/files/live.svg', svg('Live words'))
  w('artifacts/files/old.svg', svg('Old words'))
  w('artifacts/files/prot.svg', svg('Protected words'))
  w('artifacts/files/rooted.svg', svg('Rooted words'))
  w('artifacts/AR-01.md', sidecar('AR-01', 'diagram', 'Live diagram', 'artifacts/files/live.svg'))
  w('artifacts/AR-02.md', sidecar('AR-02', 'diagram', 'Old diagram', 'artifacts/files/old.svg', 'Retired'))
  w('artifacts/AR-03.md', sidecar('AR-03', 'diagram', 'Protected diagram', 'artifacts/files/prot.svg'))
  w('artifacts/AR-04.md', sidecar('AR-04', 'diagram', 'Rooted diagram', `/${REQ_REL}/artifacts/files/rooted.svg`))
  w('notes/README.md', '# Notes\n')
  w('changes/2026-10-16-update.md', '# Update\n')
  const rulings = path.join(repo, 'rulings.md')
  fs.writeFileSync(rulings, '# Current rulings\nCite shorthand: G1016 = Notes 2026-10-16 · Sam pricing call · Bv1016 = Notes 2026-10-16 · R&D review · CL<date> = change log of that date\n## Rulings by topic\n### Pricing\n- **R-001** Prices are set per list. _2026-10-16 · meeting · G1016 #1_\n## No longer true\n- **S-104** Prices were set per item (was G1016 #2) → see R-001.\n')
  const out = path.join(repo, 'run')
  fs.mkdirSync(out)
  return { repo, REQ, out, rulings }
}

const node = (script, args, cwd) => spawnSync(process.execPath, [path.join(K, script), ...args], { encoding: 'utf8', cwd })
const journal = (file, entries) => fs.writeFileSync(file, entries.flatMap(([label, result], i) => [JSON.stringify({ type: 'started', key: `k${i}`, label }), ...(result === undefined ? [] : [JSON.stringify({ type: 'result', key: `k${i}`, result })])]).join('\n') + '\n')
const finding = (o) => ({ items: ['US-01.1.1'], topic: 'Pricing', kind: 'other', summary: o.summary ?? 'Wrong', change: 'Fix it', evidence: [], rulings: [], edits: [], size: 'small', confidence: 'high', ...o })
const change = (keys, o = {}) => ({ title: o.title ?? `Change ${keys.join(' ')}`, size: 'small', topic: 'Pricing', why: 'Because.', confidence: 'high', keys, editsOverride: [], extraEdits: [], ...o })
function build(fx, entries, extra = []) {
  const j = path.join(fx.repo, `journal-${Math.random().toString(36).slice(2)}.jsonl`)
  journal(j, entries)
  const r = node('build-review.mjs', ['--journal', j, '--rulings', fx.rulings, '--out', fx.out, '--baseline', 'abc1234', '--repo', fx.repo, '--req', REQ_REL, ...extra], fx.repo)
  assert.equal(r.status, 0, r.stderr)
  return { ...JSON.parse(fs.readFileSync(path.join(fx.out, 'changes.json'), 'utf8')), stdout: r.stdout, stderr: r.stderr, html: fs.readFileSync(path.join(fx.out, 'review.html'), 'utf8') }
}
const story = (id) => `${REQ_REL}/stories/${id}.md`
const byTitle = (cj, t) => cj.changes.find((c) => c.title === t)

test('REQ-01 (R-34): edits outside the catalogue, to records or to protected artifacts are refused and shown with their full path', () => {
  const fx = makeRepo()
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cr-out-'))
  made.push(outsideDir)
  const outside = path.join(outsideDir, 'outside.txt')
  fs.writeFileSync(outside, 'secret old\n')
  fs.symlinkSync(outside, path.join(fx.REQ, 'stories', 'link.md'))
  const cases = {
    absolute: { file: outside, old: 'secret old', new: 'pwned' },
    dotdot: { file: `${REQ_REL}/../../${path.relative(fx.repo, outside)}`, old: 'secret old', new: 'pwned' },
    symlink: { file: story('link'), old: 'secret old', new: 'pwned' },
    sidecar: { file: `${REQ_REL}/artifacts/AR-03.md`, old: 'Protected diagram', new: 'x' },
    drawn: { file: `${REQ_REL}/artifacts/files/prot.svg`, old: 'Protected words', new: 'x' },
    missing: { file: story('US-09.9.9'), old: 'a', new: 'b' },
    note: { file: `${REQ_REL}/notes/2026-10-16-sam-pricing-call.md`, old: 'Prices round', new: 'x' },
    answer: { file: `${REQ_REL}/questions/OQ-01.md`, old: 'The answer text.', new: 'x' },
    retired: { file: story('US-01.1.2'), old: 'Retired words.', new: 'x' },
    // another spelling of a record folder or a protected sidecar (a file system that ignores case finds them)
    notesCase: { file: `${REQ_REL}/Notes/2026-10-16-sam-pricing-call.md`, old: 'Prices round', new: 'x' },
    sidecarCase: { file: `${REQ_REL}/Artifacts/ar-03.md`, old: 'Protected diagram', new: 'x' },
    folder: { file: `${REQ_REL}/stories`, old: 'a', new: 'b' },
  }
  const names = Object.keys(cases)
  const healthy = { file: story('US-01.1.3'), old: 'Third story words.', new: 'Third story, fixed.' }
  const cj = build(fx, [
    ['verify:EP-01', { verified: [...names.map((n) => finding({ summary: n, edits: [cases[n]] })), finding({ summary: 'healthy', edits: [healthy] })], dropped: [], newQuestions: [] }],
    ['consolidate:All', { changes: [...names, 'healthy'].map((n, i) => change([`EP-01/${i + 1}`], { title: n })), dropped: [], newQuestions: [], notes: '' }],
  ], PROTECT)
  assert.equal(byTitle(cj, 'healthy').edits[0].problem, undefined)
  for (const n of names) {
    const e = byTitle(cj, n).edits[0]
    assert.match(e.problem ?? '', n === 'missing' ? /file not found/ : /^refused: /, `${n}: ${e.problem}`)
  }
  assert.ok(cj.html.includes(`${REQ_REL}/artifacts/files/prot.svg`), 'the full path is on the page')
  const ids = cj.changes.map((c) => `${c.id}@${c.fp}`)
  const dry = node('apply.mjs', [path.join(fx.out, 'changes.json'), fx.repo, ...ids, '--dry-run'], fx.repo)
  assert.equal(dry.status, 0, dry.stderr)
  assert.equal((dry.stdout.match(/^FAIL /gm) ?? []).length, names.length, dry.stdout)
  assert.equal((dry.stdout.match(/^ok /gm) ?? []).length, 1, dry.stdout)
  const real = node('apply.mjs', [path.join(fx.out, 'changes.json'), fx.repo, ...ids], fx.repo)
  assert.equal(real.status, 0, real.stderr)
  assert.equal(fs.readFileSync(outside, 'utf8'), 'secret old\n')
  assert.match(fs.readFileSync(path.join(fx.REQ, 'questions/OQ-01.md'), 'utf8'), /The answer text\./)
  assert.match(fs.readFileSync(path.join(fx.REQ, 'notes/2026-10-16-sam-pricing-call.md'), 'utf8'), /Prices round/)
  assert.match(fs.readFileSync(path.join(fx.REQ, 'stories/US-01.1.3.md'), 'utf8'), /Third story, fixed\./, 'a healthy change lands beside the refusals')
  // apply adds protected ids named on its command line to the run's own, never replaces them
  const again = node('apply.mjs', [path.join(fx.out, 'changes.json'), fx.repo, ...ids, '--protected', 'AR-01', '--dry-run'], fx.repo)
  if (PROTECT.length) assert.match(again.stdout, /AR-03 is a protected artifact/)
  // ids that are not change ids are reported, never silently dropped
  assert.match(node('apply.mjs', [path.join(fx.out, 'changes.json'), fx.repo, 'l-01', '--dry-run'], fx.repo).stdout, /^UNKNOWN l-01/m)
})

test('REQ-02 (R-140): a change applies whole or not at all, and its own edits are checked together', () => {
  const fx = makeRepo()
  const cj = build(fx, [
    ['verify:EP-01', { verified: [
      finding({ edits: [{ file: story('US-01.1.1'), old: 'Old rule text.', new: 'New rule text.' }, { file: story('US-01.1.1'), old: 'Old rule', new: 'Odd rule' }] }),
      finding({ edits: [{ file: story('US-01.1.1'), old: 'Second line here.', new: 'Second line A.' }, { file: story('US-01.1.1'), old: 'Second line here.', new: 'Second line B.' }] }),
      finding({ edits: [{ file: story('US-01.1.3'), old: 'Third story words.', new: 'Third story, fixed.' }] }),
    ], dropped: [], newQuestions: [] }],
    ['consolidate:All', { changes: [change(['EP-01/1'], { title: 'dependent' }), change(['EP-01/2'], { title: 'two ways' }), change(['EP-01/3'], { title: 'healthy' })], dropped: [], newQuestions: [], notes: '' }],
  ])
  const dep = byTitle(cj, 'dependent'), two = byTitle(cj, 'two ways'), ok = byTitle(cj, 'healthy')
  assert.equal(dep.edits[1].problem, 'no longer applies after an earlier edit of this change')
  assert.equal(two.edits.length, 2, 'same old, different new: both kept')
  assert.ok(two.edits.every((e) => /different replacement/.test(e.problem ?? '')))
  assert.equal(ok.edits[0].problem, undefined)
  const r = node('apply.mjs', [path.join(fx.out, 'changes.json'), fx.repo, ...[dep, two, ok].map((c) => `${c.id}@${c.fp}`)], fx.repo)
  assert.match(r.stdout, new RegExp(`^HELD ${dep.id}:`, 'm'))
  assert.match(r.stdout, new RegExp(`^HELD ${two.id}:`, 'm'))
  assert.match(r.stdout, /after an earlier edit of this change/)
  const text = fs.readFileSync(path.join(fx.REQ, 'stories/US-01.1.1.md'), 'utf8')
  assert.match(text, /Old rule text\. Second line here\./, 'nothing of a held change is written')
  assert.match(fs.readFileSync(path.join(fx.REQ, 'stories/US-01.1.3.md'), 'utf8'), /Third story, fixed\./)
})

test('REQ-03 (R-09): a decision binds to the change the user saw, on the page, in files, pasted text and apply', () => {
  const fx = makeRepo()
  const editX = { file: story('US-01.1.1'), old: 'Old rule text.', new: 'New rule text.' }
  const editY = { file: story('US-01.1.3'), old: 'Third story words.', new: 'Third story, fixed.' }
  const entries = (topicX) => [
    ['verify:EP-01', { verified: [finding({ topic: topicX, edits: [editX] }), finding({ topic: 'b', edits: [editY] })], dropped: [], newQuestions: [] }],
    ['consolidate:All', { changes: [change(['EP-01/1'], { title: 'X', topic: topicX }), change(['EP-01/2'], { title: 'Y', topic: 'b' })], dropped: [], newQuestions: [], notes: '' }],
  ]
  const one = build(fx, entries('a'))
  const x1 = byTitle(one, 'X')
  assert.equal(x1.id, 'S-01')
  fs.writeFileSync(path.join(fx.repo, 'acc1.txt'), `S-01@${x1.fp}\n`)
  const two = build(fx, entries('c')) // X now sorts after Y
  const x2 = byTitle(two, 'X'), y2 = byTitle(two, 'Y')
  assert.equal(x2.id, 'S-02')
  assert.equal(x2.fp, x1.fp)
  const changes = path.join(fx.out, 'changes.json')

  // the page: the original change keeps its decision under its new id; the change now at S-01 is undecided
  const dom = (seed) => new JSDOM(two.html, { url: 'http://localhost/', runScripts: 'dangerously', beforeParse(w) { w.localStorage.setItem('consistency-review-abc1234', JSON.stringify(seed)) } })
  let doc = dom({ [`fp:${x1.fp}`]: { v: 'accept', note: '', id: 'S-01' } }).window.document
  assert.equal(doc.getElementById('S-02').dataset.state, 'accept')
  assert.equal(doc.getElementById('S-01').dataset.state, '')
  doc = dom({ 'S-01': { v: 'accept', note: '' } }).window.document // saved by a page from before fingerprints
  assert.equal(doc.getElementById('S-01').dataset.state, '')
  assert.ok(!doc.getElementById('stale').classList.contains('hidden'))

  // the saved decisions file, by fingerprint
  fs.writeFileSync(path.join(fx.repo, 'dec.json'), JSON.stringify({ version: 2, baseline: 'abc1234', decisions: { 'S-01': { v: 'accept', note: '', fp: x1.fp } } }))
  let d = node('decisions.mjs', [path.join(fx.repo, 'dec.json'), changes, '--write', fx.repo], fx.repo)
  assert.match(d.stdout, /ACCEPT \(1\): S-02\b/)
  assert.match(d.stdout, /S-01 is now S-02/)
  assert.equal(fs.readFileSync(path.join(fx.repo, 'accepted-ids.txt'), 'utf8').trim(), `S-02@${x1.fp}`)
  // pasted text
  fs.writeFileSync(path.join(fx.repo, 'pasted.txt'), `Consistency review decisions (baseline abc1234)\nACCEPT: S-01@${x1.fp}\nREJECT: \nCHANGE:\nUNDECIDED: S-02\n`)
  d = node('decisions.mjs', [path.join(fx.repo, 'pasted.txt'), changes], fx.repo)
  assert.match(d.stdout, /ACCEPT \(1\): S-02\b/)
  // a decisions file from before fingerprints: unverified, never counted
  fs.writeFileSync(path.join(fx.repo, 'old.json'), JSON.stringify({ baseline: 'abc1234', decisions: { 'S-01': { v: 'accept', note: '' } } }))
  d = node('decisions.mjs', [path.join(fx.repo, 'old.json'), changes], fx.repo)
  assert.match(d.stdout, /ACCEPT \(0\)/)
  assert.match(d.stdout, /Unverified .*S-01/)
  // apply: the first build's accepted ids now name a different change; a bare id is unverified
  let r = node('apply.mjs', [changes, fx.repo, '--ids-file', path.join(fx.repo, 'acc1.txt')], fx.repo)
  assert.match(r.stdout, /^FAIL S-01: decided on an earlier build/m)
  r = node('apply.mjs', [changes, fx.repo, 'S-01'], fx.repo)
  assert.match(r.stdout, /^UNVERIFIED S-01/m)
  assert.match(fs.readFileSync(path.join(fx.REQ, 'stories/US-01.1.3.md'), 'utf8'), /Third story words\./, `${y2.id} untouched`)
  assert.match(fs.readFileSync(path.join(fx.REQ, 'stories/US-01.1.1.md'), 'utf8'), /Old rule text\./)
})

test('REQ-03 (R-09): a question fixup never acts on a different question in a later build', () => {
  const fx = makeRepo()
  const q = (title) => ({ title, body: `${title} body`, affects: ['US-01.1.1'] })
  const entries = (qs) => [
    ['verify:EP-01', { verified: [], dropped: [], newQuestions: [] }],
    ['consolidate:All', { changes: [], dropped: [], newQuestions: qs, notes: '' }],
  ]
  fs.writeFileSync(path.join(fx.out, 'question-fixups.json'), JSON.stringify({ remove: { 'Q-01': 'answered already' } }))
  let cj = build(fx, entries([q('Alpha'), q('Beta')]))
  assert.deepEqual(cj.questions.map((x) => x.title), ['Beta'])
  cj = build(fx, entries([q('Gamma'), q('Alpha'), q('Beta')]))
  assert.deepEqual(cj.questions.map((x) => x.title).sort(), ['Alpha', 'Beta', 'Gamma'], 'Q-01 is now Gamma: the fixup is skipped')
  assert.match(cj.stderr, /Q-01 was written for another question/)
})

test('REQ-04 (R-20): every verifier question reaches the page unless a consolidator dismissed it with a reason', () => {
  const fx = makeRepo()
  const q = (title) => ({ title, body: `${title} body`, affects: [] })
  // (i) no findings, so no consolidator ran
  let cj = build(fx, [['verify:EP-01', { verified: [], dropped: [], newQuestions: [q('Lonely')] }]])
  assert.deepEqual(cj.questions.map((x) => [x.title, !!x.unreviewed]), [['Lonely', true]])
  assert.match(cj.html, /not reviewed by the final pass/)
  // (ii) the consolidator returned nothing
  cj = build(fx, [['verify:EP-01', { verified: [finding({})], dropped: [], newQuestions: [q('Orphan')] }], ['consolidate:All', null]])
  assert.deepEqual(cj.questions.map((x) => x.title), ['Orphan'])
  // (iii) a consolidator keeps another question, merges one and dismisses one with a reason
  cj = build(fx, [
    ['verify:EP-01', { verified: [finding({})], dropped: [], newQuestions: [q('Kept'), q('Merged'), q('Elsewhere'), q('Settled'), q('No reason')] }],
    ['consolidate:All', { changes: [change(['EP-01/1'])], dropped: [], newQuestions: [{ ...q('Kept and merged'), from: ['Kept', 'Merged'] }], dismissedQuestions: [{ title: 'Settled', reason: 'R-001 settles it' }, { title: 'No reason', reason: ' ' }], notes: '' }],
  ])
  assert.deepEqual(cj.questions.map((x) => [x.title, !!x.unreviewed]), [['Kept and merged', false], ['Elsewhere', true], ['No reason', true]])
  assert.deepEqual(cj.dismissedQuestions.map((x) => [x.title, x.reason]), [['Settled', 'R-001 settles it']])
  assert.equal(JSON.parse(cj.stdout).questionsUnreviewed, 2)
})

test('REQ-05 (R-21): each change says whether it is an edit, a redraw or a flag', () => {
  const fx = makeRepo()
  const cj = build(fx, [
    ['verify:diagrams.1', { verified: [
      finding({ summary: 'protected', items: ['AR-03'] }),
      finding({ summary: 'retired', items: ['AR-02'] }),
      finding({ summary: 'redraw', items: ['AR-01'] }),
      finding({ summary: 'said redraw on protected', items: ['AR-03'], action: 'redraw' }),
    ], dropped: [], newQuestions: [] }],
    ['verify:EP-01', { verified: [finding({ summary: 'blocked' }), finding({ summary: 'edit', edits: [{ file: story('US-01.1.3'), old: 'Third story words.', new: 'x' }] })], dropped: [], newQuestions: [] }],
  ], PROTECT)
  const act = Object.fromEntries(cj.changes.map((c) => [c.title, c.action]))
  assert.deepEqual(act, { protected: 'flag', retired: 'flag', redraw: 'redraw', 'said redraw on protected': 'flag', blocked: 'flag', edit: 'edit' })
  assert.equal((cj.html.match(/needs redrawing<\/span>/g) ?? []).length, 1)
  assert.equal((cj.html.match(/flag only<\/span>/g) ?? []).length, 4)
  const counts = JSON.parse(cj.stdout)
  assert.equal(counts.redraw, 1)
  assert.equal(counts.flag, 4)
})

test('REQ-06 (R-144): change ids past 99 never read as ruling codes', async () => {
  const fx = makeRepo()
  const many = Array.from({ length: 104 }, (_, i) => finding({ summary: `small ${i}` }))
  const cj = build(fx, [['verify:EP-01', { verified: many, dropped: [], newQuestions: [] }]])
  const ids = cj.changes.map((c) => c.id)
  assert.ok(ids.every((id) => !/^[LMSQ]-\d{3}$/.test(id)), ids.slice(-3).join(' '))
  assert.ok(ids.includes('S-0104'))
  const { buildRe, isChangeId } = await import(pathToFileURL(path.join(K, 'ref-kit.mjs')).href)
  const keys = [...'clashes with an edit in S-0104; ruling S-104; L-01'.matchAll(buildRe([], []))].map((m) => m[0])
  assert.deepEqual(keys, ['S-0104', 'S-104', 'L-01'])
  assert.deepEqual(keys.map((k) => isChangeId(k)), [true, false, true])
  const last = cj.changes.find((c) => c.id === 'S-0104')
  const r = node('apply.mjs', [path.join(fx.out, 'changes.json'), fx.repo, `S-0104@${last.fp}`, '--dry-run'], fx.repo)
  assert.doesNotMatch(r.stdout, /UNKNOWN|UNVERIFIED|FAIL/)
})

test('REQ-07 (R-141, R-142): note cites resolve as the board resolves them', async () => {
  const fx = makeRepo()
  const { makeResolver, loadRulings } = await import(pathToFileURL(path.join(K, 'ref-kit.mjs')).href)
  const board = (p) => import(pathToFileURL(path.join(BOARD, p)).href)
  const { resolveNoteCite } = await board('shared/sources.ts')
  const { loadSourceIndex } = await board('server/sourceIndex.ts')
  const idx = loadSourceIndex(fx.REQ)
  const cites = [
    'Notes 2026-10-16 · Sam pricing call #1', "Notes 2026-10-16 · Sam's pricing call #1", 'Notes 2026-10-16 · R&D review #1', 'Notes 2026-10-16 · R D review #1',
    'Notes 2026-10-17 · Decision payer #1', 'Notes 2026-10-17 · Decision: payer #1', 'Notes 2026-10-18 · Te reo Māori hui #1', 'Notes 2026-10-16 · nothing like it #1',
  ]
  const { refsFor } = await makeResolver(fx.REQ, fx.rulings)
  const page = JSON.parse(refsFor(`<p>${cites.join('. ')}. Also Notes 2026-10-16 · Sam pricing call says so, and Notes 2026-10-16 #1.</p>`).blob)
  const baseOf = { "Sam's pricing call": '2026-10-16-sam-pricing-call', 'R&D review': '2026-10-16-r-d-review', 'Decision: payer': '2026-10-17-decision-payer', 'Te reo Māori hui': '2026-10-18-te-reo-māori-hui' }
  let resolved = 0
  for (const c of cites) {
    const b = resolveNoteCite(idx, c)
    const mine = page.refs[c]
    assert.equal(mine ? baseOf[mine.title] : null, b ? path.basename(b.file, '.md') : null, c)
    if (b) resolved++
  }
  assert.ok(resolved >= 4, `${resolved} of the cites resolve`)
  // (d) a whole cite without points is one reference, opening its own note
  assert.equal(page.refs['Notes 2026-10-16 · Sam pricing call']?.title, "Sam's pricing call")
  // (c) a date with no words names no note
  assert.equal(page.refs['Notes 2026-10-16 #1'], undefined)
  // (e) every shorthand key, whatever its case, gets its own words
  const { shorthand } = loadRulings(fx.rulings)
  assert.deepEqual(shorthand, { G1016: { date: '2026-10-16', words: 'Sam pricing call' }, Bv1016: { date: '2026-10-16', words: 'R&D review' } })
  // build-packs: the cited point is found as the board finds the note; an unresolved cite says so
  const r = spawnSync(process.execPath, [path.join(K, 'build-packs.mjs'), '--repo', fx.repo, '--req', REQ_REL, '--out', fx.out, '--rulings', fx.rulings], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  const pack = fs.readFileSync(path.join(fx.out, 'packs', 'FT-01.1.md'), 'utf8')
  assert.match(pack, /### 2026-10-16 Sam pricing call #1 .*\n1\. Prices are set per list\./)
  assert.match(pack, /2026-10-16 Sam's pricing call #2 .*\n\(note not found\)/)
})

test('REQ-08 (R-143): retired diagrams are left out; a repository-rooted file is found', () => {
  const fx = makeRepo()
  const r = spawnSync(process.execPath, [path.join(K, 'build-packs.mjs'), '--repo', fx.repo, '--req', REQ_REL, '--out', fx.out], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  const index = JSON.parse(fs.readFileSync(path.join(fx.out, 'index.json'), 'utf8'))
  assert.deepEqual(index.diagrams.map((d) => d.id), ['AR-01', 'AR-03', 'AR-04'])
  assert.deepEqual(index.skippedDiagrams.map((d) => d.id), ['AR-02'])
  assert.ok(!fs.existsSync(path.join(fx.out, 'artifact-packs', 'AR-02.md')))
  assert.equal(index.diagrams.find((d) => d.id === 'AR-04').svg, `${REQ_REL}/artifacts/files/rooted.svg`)
  assert.match(fs.readFileSync(path.join(fx.out, 'artifact-packs', 'AR-04.md'), 'utf8'), /Rooted words/)
  for (const k of ['units', 'diagrams', 'notes', 'changes', 'answeredQuestions', 'topics', 'counts']) assert.ok(k in index, k)
})

test('REQ-15: a changes.json from before this phase still applies, and decisions.mjs keeps its sections', () => {
  const fx = makeRepo()
  const changes = path.join(fx.out, 'changes.json')
  fs.writeFileSync(changes, JSON.stringify({ baseline: 'abc1234', changes: [{ id: 'S-01', title: 'Old', size: 'small', topic: 'x', why: '', items: [], evidence: [], rulings: [], edits: [{ file: story('US-01.1.3'), old: 'Third story words.', new: 'Third story, fixed.' }], needsRedraw: false }], questions: [{ id: 'Q-01', title: 'Q', body: 'b', affects: [] }], dropped: [], rawCount: 1, findings: 1 }))
  fs.writeFileSync(path.join(fx.repo, 'ids.txt'), 'S-01\n')
  let r = node('apply.mjs', [changes, fx.repo, '--ids-file', path.join(fx.repo, 'ids.txt'), '--req', REQ_REL, '--dry-run', '--unverified'], fx.repo)
  assert.match(r.stdout, /^ok {3}S-01 /m)
  assert.match(r.stdout, /^\[dry run\]/m)
  fs.writeFileSync(path.join(fx.repo, 'dec.json'), JSON.stringify({ baseline: 'abc1234', decisions: {} }))
  r = node('decisions.mjs', [path.join(fx.repo, 'dec.json'), changes], fx.repo)
  for (const s of ['Changes', 'ACCEPT (0)', 'REJECT (0)', 'CHANGE (0)', 'UNDECIDED (1): S-01', 'Questions']) assert.ok(r.stdout.includes(s), s)
})

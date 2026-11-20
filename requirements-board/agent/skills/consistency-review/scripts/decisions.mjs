// Reads the decisions from the review page and lists them against changes.json.
// Usage: node decisions.mjs <decisions> <changes.json> [--write <dir>]
//   <decisions> is the "Save decisions file" JSON, or a text file holding the pasted "Copy decisions" text.
//   Prints accepted, rejected, change-requested (with the notes) and undecided ids, for changes and questions.
//   Each decision is matched to its change by fingerprint: one whose change now has another id is listed under
//   its new id; one whose change has changed or gone is named as decided on an earlier build (decide again);
//   one with no fingerprint (saved before decisions carried one) is named as unverified and never counted.
//   --write <dir> also writes <dir>/accepted-ids.txt (accepted change ids with their fingerprints, one per
//   line: the input to apply.mjs --ids-file).
import fs from 'node:fs'
import path from 'node:path'
import { DECISION_ID, fingerprint, questionFingerprint } from './guard.mjs'

const args = process.argv.slice(2)
const wi = args.indexOf('--write')
const dir = wi >= 0 ? args[wi + 1] : null
const [decPath, changesPath] = args.filter((_, i) => wi < 0 || (i !== wi && i !== wi + 1))
if (!decPath || !changesPath) { console.error('usage: node decisions.mjs <decisions.json | pasted text> <changes.json> [--write <dir>]'); process.exit(2) }

// Saved file: { baseline, decisions: { id: { v, note, fp } } }; older files had no fp. Pasted text: the page's lines.
function readDecisions(file) {
  const raw = fs.readFileSync(file, 'utf8')
  try {
    const dec = JSON.parse(raw)
    return { baseline: dec.baseline, entries: Object.entries(dec.decisions ?? dec).map(([id, d]) => ({ id, v: d?.v, note: d?.note ?? '', fp: d?.fp })) }
  } catch {
    const entries = []
    const tok = (t, v, note = '') => { const m = t.match(DECISION_ID); if (m) entries.push({ id: m[1], fp: m[2], v, note }) }
    const baseline = raw.match(/\(baseline ([^)]+)\)/)?.[1]
    for (const line of raw.split('\n')) {
      let m
      if ((m = line.match(/^(ACCEPT|REJECT):(.*)$/))) for (const t of m[2].trim().split(/\s+/).filter(Boolean)) tok(t, m[1].toLowerCase())
      else if ((m = line.match(/^- (\S+): ?(.*)$/))) tok(m[1], 'change', m[2])
    }
    return { baseline, entries }
  }
}

const dec = readDecisions(decPath)
const { baseline, changes, questions = [] } = JSON.parse(fs.readFileSync(changesPath, 'utf8'))
if (dec.baseline && baseline && dec.baseline !== baseline) console.warn(`WARNING: decisions are for baseline ${dec.baseline}, changes.json is ${baseline}`)
const fpOf = (x, isQ) => (isQ ? questionFingerprint(x) : fingerprint(x))
const all = [...changes.map((c) => ({ x: c, fp: fpOf(c, false) })), ...questions.map((q) => ({ x: q, fp: fpOf(q, true) }))]

const st = {} // current id -> { v, note }
const moved = [], stale = [], unverified = []
for (const d of dec.entries) {
  if (!d.v) continue
  if (!d.fp) { unverified.push(`${d.id} (${d.v})`); continue }
  // Two changes proposing exactly the same thing share a fingerprint: the decision holds for both.
  const hits = all.filter((a) => a.fp === d.fp)
  if (!hits.length) { stale.push(`${d.id}@${d.fp}`); continue }
  for (const hit of hits) {
    if (hit.x.id !== d.id) moved.push(`${d.id} is now ${hit.x.id}`)
    st[hit.x.id] = { v: d.v, note: d.note }
  }
}
const fpById = Object.fromEntries(all.map((a) => [a.x.id, a.fp]))
const pick = (list, v) => list.filter((x) => st[x.id]?.v === v).map((x) => x.id)
const report = (name, list) => [
  `${name}`,
  `  ACCEPT (${pick(list, 'accept').length}): ${pick(list, 'accept').join(' ')}`,
  `  REJECT (${pick(list, 'reject').length}): ${pick(list, 'reject').join(' ')}`,
  `  CHANGE (${pick(list, 'change').length}):`,
  ...pick(list, 'change').map((id) => `    - ${id}: ${(st[id].note || '').replace(/\s*\n\s*/g, ' ')}`),
  `  UNDECIDED (${list.filter((x) => !st[x.id]).length}): ${list.filter((x) => !st[x.id]).map((x) => x.id).join(' ')}`,
].join('\n')
console.log(report('Changes', changes))
console.log(report('Questions (accept = add as an open question)', questions))
if (moved.length) console.log(`Same change, new id (decision kept): ${moved.join('; ')}`)
if (stale.length) console.log(`Decided on an earlier build (the change has changed or gone; decide again): ${stale.join(' ')}`)
if (unverified.length) console.log(`Unverified (saved without a fingerprint, so not matched to any change; decide again): ${unverified.join(' ')}`)
if (dir) {
  fs.writeFileSync(path.join(dir, 'accepted-ids.txt'), pick(changes, 'accept').map((id) => `${id}@${fpById[id]}`).join('\n') + '\n')
  console.log(`wrote ${path.join(dir, 'accepted-ids.txt')}`)
}

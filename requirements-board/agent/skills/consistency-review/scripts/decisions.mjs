// Reads the "Save decisions file" JSON from the review page and lists the decisions against changes.json.
// Usage: node decisions.mjs <consistency-review-decisions.json> <changes.json> [--write <dir>]
//   Prints accepted, rejected, change-requested (with the notes) and undecided ids, for changes and questions.
//   --write <dir> also writes <dir>/accepted-ids.txt (accepted change ids, one per line: the input to apply.mjs --ids-file).
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const wi = args.indexOf('--write')
const dir = wi >= 0 ? args[wi + 1] : null
const [decPath, changesPath] = args.filter((_, i) => wi < 0 || (i !== wi && i !== wi + 1))
if (!decPath || !changesPath) { console.error('usage: node decisions.mjs <decisions.json> <changes.json> [--write <dir>]'); process.exit(2) }
const dec = JSON.parse(fs.readFileSync(decPath, 'utf8'))
const { baseline, changes, questions = [] } = JSON.parse(fs.readFileSync(changesPath, 'utf8'))
if (dec.baseline && baseline && dec.baseline !== baseline) console.warn(`WARNING: decisions are for baseline ${dec.baseline}, changes.json is ${baseline}`)
const st = dec.decisions ?? dec
const known = new Set([...changes.map((c) => c.id), ...questions.map((q) => q.id)])
const unknown = Object.keys(st).filter((id) => !known.has(id))
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
if (unknown.length) console.log(`Not in changes.json (stale decisions from an earlier build?): ${unknown.join(' ')}`)
if (dir) {
  fs.writeFileSync(path.join(dir, 'accepted-ids.txt'), pick(changes, 'accept').join('\n') + '\n')
  console.log(`wrote ${path.join(dir, 'accepted-ids.txt')}`)
}

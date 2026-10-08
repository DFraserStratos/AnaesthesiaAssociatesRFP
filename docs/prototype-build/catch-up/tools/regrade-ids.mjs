// Which catalogue items to re-grade after a requirements change (Stage 1 of the update-build-plan skill).
// Usage (repo root): node docs/prototype-build/catch-up/tools/regrade-ids.mjs <to-ref> [--ids-only]
// Picks, from the plan's baseline (plan.json "commit") to <to-ref>:
//   - items changed in substance (req-changes.mjs substance(): not just artifacts, related, sources,
//     order, swimlane, images or link markup; a status change counts) or added;
//   - every item in the `affects` of a question changed in substance or added;
//   less Retired and Future items and the Future Work lane (build-args.mjs drops those too).
// Prints JSON with the counts, the IDs, and the share of in-scope items, which decides Update mode
// against a fresh plan. --ids-only prints the IDs space-separated, for build-args.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { pathOf, requirementChanges, changedInSubstance } from './req-changes.mjs'

const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const argv = process.argv.slice(2)
const to = argv.find(a => !a.startsWith('--'))
if (!to) { console.error('usage: regrade-ids.mjs <to-ref> [--ids-only]'); process.exit(2) }
const plan = JSON.parse(fs.readFileSync(path.join(CU, 'plan.json'), 'utf8'))
const from = plan.commit

const changes = requirementChanges({ cwd: ROOT, from, to })
const exists = rel => fs.existsSync(path.join(ROOT, rel))
const head = id => {
  const f = path.join(ROOT, pathOf(id, exists))
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n---')[0] : ''
}
const field = (id, k) => (head(id).match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '')
const outOfScope = id => /^(Retired|Future)$/i.test(field(id, 'status') || '') || field(id, 'swimlane') === 'Future Work' || !field(id, 'status')

const sub = e => changedInSubstance({ cwd: ROOT, from, to, entry: e })
const items = changes.items.filter(e => e.change !== 'D')
const substantive = items.filter(sub)
const cosmetic = items.filter(e => !substantive.includes(e))
const questions = changes.questions.filter(e => e.change !== 'D' && sub(e))

const direct = substantive.map(e => e.id)
const affects = new Set()
for (const q of questions) {
  const m = head(q.id).match(/^affects:\n((?:\s+-.*\n?)+)/m)
  for (const id of m ? m[1].match(/[A-Z]{2}-[\d.]+/g) || [] : []) affects.add(id)
}
const fromAffects = [...affects].filter(id => !direct.includes(id))
const byId = (a, b) => a.localeCompare(b, undefined, { numeric: true })
const ids = [...new Set([...direct, ...fromAffects])].filter(id => !outOfScope(id)).sort(byId)

// In scope: every live item outside the Future Work lane (the build-args.mjs rule).
const stories = path.join(ROOT, 'requirements-board/requirements/stories')
const inScope = fs.readdirSync(stories).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).filter(id => !outOfScope(id)).length

if (argv.includes('--ids-only')) { console.log(ids.join(' ')); process.exit(0) }
console.log(JSON.stringify({
  baseline: from, to,
  counts: {
    itemsChanged: changes.items.length,
    changedInSubstance: substantive.filter(e => e.change === 'M').length,
    added: substantive.filter(e => e.change === 'A').length,
    cosmeticOnly: cosmetic.length,
    retiredOrFuture: direct.filter(outOfScope).length,
    questionsChanged: questions.length,
    fromAffects: fromAffects.filter(id => !outOfScope(id)).length,
    toRegrade: ids.length,
    inScope,
    share: `${Math.round(100 * ids.length / inScope)}%`,
  },
  ids,
  cosmeticOnly: cosmetic.map(e => e.id).sort(byId),
}, null, 1))

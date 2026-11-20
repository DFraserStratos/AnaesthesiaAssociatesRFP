// Which catalogue items to re-grade after a requirements change (Stage 1 of the update-build-plan skill).
// Usage (repo root): node <tools>/regrade-ids.mjs [--plan <dir>] <to-ref> [--ids-only]
// Picks, from the plan's baseline (plan.json "commit") to <to-ref>:
//   - items changed in substance (req-changes.mjs substance(): not just artifacts, related, sources,
//     order, swimlane, images or link markup; a status change counts) or added;
//   - items whose scope changed: in scope at <to-ref> but out of scope at the baseline (a story dragged out
//     of an out-of-scope lane with no other edit, a feature whose stories moved), even if the change
//     itself was only cosmetic;
//   - every item in the `affects` of a question changed in substance or added;
//   less out-of-scope items (scope.mjs: retired, the config's out-of-scope lanes; build-args.mjs drops those too).
//   A status recode recorded in status-recodes.json is not a change (req-changes.mjs substance()).
// Everything it judges about <to-ref> (the item list, each item's parent, status and lane, the recodes and
// status roles, each question's affects) is read at <to-ref>, not from the working tree; the baseline side
// likewise at the baseline. All file reads go through one `git cat-file --batch`.
// Prints JSON with the counts, the IDs, and the share of in-scope items, which decides Update mode
// against a fresh plan; `scopeChanged` lists the ids re-graded because their scope changed, and `dropped`
// the ids in scope at the baseline that are out of scope (or gone) at <to-ref> (set runReverse for them).
// --ids-only prints the IDs space-separated, for build-args.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { layoutsOf, requirementChanges, substanceVerdicts, readBlobs } from './req-changes.mjs'
import { recodesPath, statusesFrom, outOfScopeRule } from './scope.mjs'
import { loadConfig, stripPlanArg } from './config.mjs'

const ROOT = process.cwd()
const config = loadConfig()
const CU = path.join(ROOT, config.plan)
const REQ = config.requirements
const LAYOUTS = layoutsOf(config)
const argv = stripPlanArg()
const to = argv.find(a => !a.startsWith('--'))
if (!to) { console.error('usage: regrade-ids.mjs <to-ref> [--ids-only]'); process.exit(2) }
const plan = JSON.parse(fs.readFileSync(path.join(CU, 'plan.json'), 'utf8'))
const from = plan.commit
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const changes = requirementChanges({ cwd: ROOT, from, to, layouts: LAYOUTS })

/** The item files at a ref, in the first layout that has any there: { layout, files: Map(id -> path) }. */
function itemsAt(ref) {
  for (const L of LAYOUTS) {
    let names = []
    try { names = git('ls-tree', '-r', '--name-only', ref, '--', `${L.root}/${L.items}/`).split('\n').filter(f => f.endsWith('.md')) } catch {}
    if (names.length) return new Map(names.map(f => [path.basename(f, '.md'), f]))
  }
  return new Map()
}
const toFiles = itemsAt(to)
const fromFiles = itemsAt(from)
const questionSpec = e => `${to}:${e.file}`
const configSpec = `${to}:${REQ}/board.config.json`
const recodeSpec = `${to}:${recodesPath(REQ)}`
const blobs = readBlobs(ROOT, [
  ...[...toFiles.values()].map(f => `${to}:${f}`),
  ...[...fromFiles.values()].map(f => `${from}:${f}`),
  ...changes.questions.filter(e => e.change !== 'D').map(questionSpec),
  configSpec, recodeSpec,
])
const json = spec => { try { return JSON.parse(blobs.get(spec) ?? '') } catch { return null } }
const recodes = (() => { const r = json(recodeSpec); return Array.isArray(r) ? r : [] })()
const statuses = statusesFrom(json(configSpec) ?? {})
const head = text => (text ?? '').split('\n---')[0]
const field = (h, k) => (h.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '')
const catalogueOf = (files, ref) => Object.fromEntries([...files].map(([id, f]) => {
  const h = head(blobs.get(`${ref}:${f}`))
  return [id, { id, parent: field(h, 'parent'), status: field(h, 'status'), swimlane: field(h, 'swimlane') }]
}))
// Both sides are judged by the target's recodes and roles: the newest recode list covers every older version.
const outOfScope = outOfScopeRule(catalogueOf(toFiles, to), recodes, statuses.retired, config.outOfScopeLanes)
const wasOutOfScope = outOfScopeRule(catalogueOf(fromFiles, from), recodes, statuses.retired, config.outOfScopeLanes)

const verdict = substanceVerdicts({ cwd: ROOT, from, to, entries: [...changes.items, ...changes.questions].filter(e => e.change !== 'D'), req: REQ })
const items = changes.items.filter(e => e.change !== 'D')
const substantive = items.filter(e => verdict.get(e))
const questions = changes.questions.filter(e => e.change !== 'D' && verdict.get(e))

const direct = substantive.map(e => e.id)
const byId = (a, b) => a.localeCompare(b, undefined, { numeric: true })
// Scope moves: every id whose out-of-scope verdict differs between the two sides.
const everyId = [...new Set([...toFiles.keys(), ...fromFiles.keys()])]
const scopeChanged = everyId.filter(id => wasOutOfScope(id) && !outOfScope(id) && !direct.includes(id)).sort(byId)
const dropped = everyId.filter(id => !wasOutOfScope(id) && outOfScope(id)).sort(byId)
const cosmetic = items.filter(e => !verdict.get(e) && !scopeChanged.includes(e.id))
const affects = new Set()
for (const q of questions) {
  const m = head(blobs.get(questionSpec(q))).match(/^affects:\n((?:\s+-.*\n?)+)/m)
  for (const id of m ? m[1].match(/[A-Z]{2}-[\d.]+/g) || [] : []) affects.add(id)
}
const fromAffects = [...affects].filter(id => !direct.includes(id) && !scopeChanged.includes(id))
const ids = [...new Set([...direct, ...scopeChanged, ...fromAffects])].filter(id => !outOfScope(id)).sort(byId)

// In scope: every item scope.mjs keeps (the build-args.mjs rule).
const inScope = [...toFiles.keys()].filter(id => !outOfScope(id)).length

if (argv.includes('--ids-only')) { console.log(ids.join(' ')); process.exit(0) }
console.log(JSON.stringify({
  baseline: from, to,
  counts: {
    itemsChanged: changes.items.length,
    changedInSubstance: substantive.filter(e => e.change === 'M').length,
    added: substantive.filter(e => e.change === 'A').length,
    cosmeticOnly: cosmetic.length,
    outOfScope: direct.filter(outOfScope).length,
    questionsChanged: questions.length,
    fromAffects: fromAffects.filter(id => !outOfScope(id)).length,
    toRegrade: ids.length,
    inScope,
    share: `${Math.round(100 * ids.length / inScope)}%`,
    scopeChanged: scopeChanged.length,
    dropped: dropped.length,
  },
  ids,
  cosmeticOnly: cosmetic.map(e => e.id).sort(byId),
  scopeChanged,
  dropped,
}, null, 1))

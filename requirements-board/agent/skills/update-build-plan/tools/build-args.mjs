// Prints the `epics` args for workflow-gap-analysis.js: every in-scope catalogue item grouped by
// epic (walking the parent chain, since reparented items keep their IDs), with status and any
// unresolved outstanding items. Out-of-scope items (scope.mjs: retired, the config's out-of-scope lanes) are excluded.
// Usage (repo root): node <tools>/build-args.mjs [--plan <dir>] [ID ...]
// With IDs, only those items are kept (for a re-run over changed items).
import fs from 'node:fs'
import path from 'node:path'
import { loadRecodes, loadStatuses, normaliseStatus, outOfScopeRule } from './scope.mjs'
import { loadConfig, stripPlanArg } from './config.mjs'

const config = loadConfig()
const CAT = path.join(process.cwd(), config.requirements)
const recodes = loadRecodes(process.cwd(), config.requirements)
const statuses = loadStatuses(process.cwd(), config.requirements)
const only = new Set(stripPlanArg())
const fm = file => {
  const head = fs.readFileSync(file, 'utf8').split('---')[1]
  const g = k => { const m = head.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null }
  return { head, g }
}
const items = {}
for (const f of fs.readdirSync(path.join(CAT, 'stories')).filter(f => f.endsWith('.md'))) {
  const { g } = fm(path.join(CAT, 'stories', f))
  items[g('id')] = { id: g('id'), parent: g('parent'), title: g('title'), status: normaliseStatus(recodes, 'item', g('status')), swimlane: g('swimlane') }
}
const open = {}
for (const f of fs.readdirSync(path.join(CAT, 'questions')).filter(f => f.endsWith('.md'))) {
  const { head, g } = fm(path.join(CAT, 'questions', f))
  if (normaliseStatus(recodes, 'question', g('status')) === statuses.answered) continue
  for (const m of head.matchAll(/^\s+-\s*(\S+)\s*$/gm)) (open[m[1]] ||= []).push(g('id'))
}
const epicOf = id => { let x = items[id]; while (x && x.parent) x = items[x.parent]; return x.id }
const outOfScope = outOfScopeRule(items, recodes, statuses.retired, config.outOfScopeLanes)
// Agents read a status as its label and number ("Agreed (4)"); an excluded item gives why: retired, or out of scope.
const shown = it => statuses.label('item', it.status)
const out = {}
for (const it of Object.values(items)) {
  const e = epicOf(it.id)
  out[e] ||= { id: e, title: items[e].title, status: shown(items[e]), items: [], excluded: [] }
  const ex = outOfScope(it.id)
  if (ex) out[e].excluded.push(`${it.id}|${it.status === statuses.retired ? 'retired' : 'out-of-scope'}${it.swimlane ? `|${it.swimlane}` : ''}`)
  else if (!only.size || only.has(it.id)) out[e].items.push(`${it.id}|${shown(it)}${open[it.id] ? `|${open[it.id].join(',')}` : ''}`)
}
const byId = (a, b) => a.localeCompare(b, undefined, { numeric: true })
const epics = Object.values(out).filter(e => e.items.length).sort((a, b) => byId(a.id, b.id))
for (const e of epics) { e.items.sort(byId); e.excluded.sort(byId) }
console.log(JSON.stringify(epics))

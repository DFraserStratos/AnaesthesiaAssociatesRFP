// Prints the `epics` args for workflow-gap-analysis.js: every in-scope catalogue item grouped by
// epic (walking the parent chain, since reparented items keep their IDs), with status and any
// unresolved outstanding items. Retired and Future items (and the Future Work lane) are excluded.
// Usage (repo root): node docs/prototype-build/catch-up/tools/build-args.mjs [ID ...]
// With IDs, only those items are kept (for a re-run over changed items).
import fs from 'node:fs'
import path from 'node:path'

const CAT = path.join(process.cwd(), 'requirements-board/requirements')
const only = new Set(process.argv.slice(2))
const fm = file => {
  const head = fs.readFileSync(file, 'utf8').split('---')[1]
  const g = k => { const m = head.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null }
  return { head, g }
}
const items = {}
for (const f of fs.readdirSync(path.join(CAT, 'stories')).filter(f => f.endsWith('.md'))) {
  const { g } = fm(path.join(CAT, 'stories', f))
  items[g('id')] = { id: g('id'), parent: g('parent'), title: g('title'), status: g('status'), swimlane: g('swimlane') }
}
const open = {}
for (const f of fs.readdirSync(path.join(CAT, 'questions')).filter(f => f.endsWith('.md'))) {
  const { head, g } = fm(path.join(CAT, 'questions', f))
  if (g('status') === 'Answered') continue
  for (const m of head.matchAll(/^\s+-\s*(\S+)\s*$/gm)) (open[m[1]] ||= []).push(g('id'))
}
const epicOf = id => { let x = items[id]; while (x && x.parent) x = items[x.parent]; return x.id }
const out = {}
for (const it of Object.values(items)) {
  const e = epicOf(it.id)
  out[e] ||= { id: e, title: items[e].title, status: items[e].status, items: [], excluded: [] }
  const ex = ['Retired', 'Future'].includes(it.status) || it.swimlane === 'Future Work' || ['Retired', 'Future'].includes(items[e].status)
  if (ex) out[e].excluded.push(`${it.id}|${it.status}${it.swimlane ? `|${it.swimlane}` : ''}`)
  else if (!only.size || only.has(it.id)) out[e].items.push(`${it.id}|${it.status}${open[it.id] ? `|${open[it.id].join(',')}` : ''}`)
}
const byId = (a, b) => a.localeCompare(b, undefined, { numeric: true })
const epics = Object.values(out).filter(e => e.items.length).sort((a, b) => byId(a.id, b.id))
for (const e of epics) { e.items.sort(byId); e.excluded.sort(byId) }
console.log(JSON.stringify(epics))

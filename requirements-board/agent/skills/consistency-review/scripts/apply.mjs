// Applies the edits of accepted changes by exact string replacement (each "old" must occur exactly once).
// Usage: node apply.mjs <changes.json> <repo root> [ID ...] [--ids-file <file>] [--dry-run] [--unverified]
//          [--req <catalogue dir relative to the repo>] [--protected <AR ids, comma separated>]
//   IDs are change ids from the review page with their fingerprint (L-01@1a2b3c4d5e6f); --ids-file reads them
//   from a file (whitespace or newline separated, e.g. the accepted-ids.txt written by decisions.mjs).
//   An id whose fingerprint does not match its change in changes.json is refused (decided on an earlier build).
//   A bare id (no fingerprint: a decision saved before fingerprints) is applied only with --unverified.
//   Edits apply only inside the catalogue folder, never to notes/, changes/, reference/, a question's answer,
//   a retired item or artifact, or a protected artifact (changes.json "protected", or --protected). A change
//   applies whole or not at all. Run --dry-run first.
import fs from 'node:fs'
import { parseArgs } from 'node:util'
import { DECISION_ID, fingerprint, makeGuard } from './guard.mjs'

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: { 'ids-file': { type: 'string' }, 'dry-run': { type: 'boolean' }, unverified: { type: 'boolean' }, req: { type: 'string' }, protected: { type: 'string' } },
})
const [changesPath, repo, ...cliIds] = positionals
if (!changesPath || !repo) {
  console.error('usage: node apply.mjs <changes.json> <repo root> [ID ...] [--ids-file <file>] [--dry-run] [--unverified] [--req <dir>] [--protected <ids>]')
  process.exit(2)
}
const dry = !!o['dry-run']
const given = [...cliIds, ...(o['ids-file'] ? fs.readFileSync(o['ids-file'], 'utf8').split(/\s+/) : [])].filter(Boolean)
const tokens = given.filter((x) => DECISION_ID.test(x))
const unreadable = given.filter((x) => !DECISION_ID.test(x))
const run = JSON.parse(fs.readFileSync(changesPath, 'utf8'))
const changes = run.changes ?? []
// Protected artifacts: the run's list and any named here, together (naming more never unprotects one).
const protectedIds = [...new Set([...(run.protected ?? []), ...(o.protected ?? '').split(/[\s,]+/).filter(Boolean)])]
const guard = makeGuard({ repo, req: o.req ?? run.req ?? 'requirements-board/requirements', protectedIds })

const report = unreadable.map((t) => `UNKNOWN ${t}: not a change id (L-01, or L-01@<12-character fingerprint>)`)
const want = []
for (const t of new Set(tokens)) {
  const [, id, fp] = t.match(DECISION_ID)
  const ch = changes.find((c) => c.id === id)
  if (!ch) { if (!id.startsWith('Q-')) report.push(`UNKNOWN ${t}: no change with that id in ${changesPath}`); continue }
  if (fp && fp !== fingerprint(ch)) { report.push(`FAIL ${id}: decided on an earlier build (the change now proposes something else); decide it again`); continue }
  if (!fp && !o.unverified) { report.push(`UNVERIFIED ${id}: no fingerprint, so this decision cannot be checked against the change; not applied (decide again, or pass --unverified)`); continue }
  want.push(ch)
}

const files = {} // absolute path -> text after the changes applied so far
const read = (abs) => (files[abs] ??= fs.readFileSync(abs, 'utf8'))
const touched = new Set()
let applied = 0, held = 0
for (const ch of want.sort((a, b) => changes.indexOf(a) - changes.indexOf(b))) {
  // Every edit of a change runs on a scratch copy; the change lands only if all of them apply.
  const scratch = {}
  const fails = []
  for (const e of ch.edits ?? []) {
    const why = guard.refusal(e.file, e.old)
    if (why) { fails.push(`FAIL ${ch.id} ${e.file}: refused, ${why}`); continue }
    const abs = guard.target(e.file)
    if (!fs.existsSync(abs)) { fails.push(`FAIL ${ch.id} ${e.file}: file not found`); continue }
    const text = scratch[abs] ?? read(abs)
    const n = text.split(e.old).length - 1
    // Found once in the file as it was, but not after this change's earlier edits: say which broke it.
    const brokeByEarlier = scratch[abs] != null && read(abs).split(e.old).length === 2
    if (n !== 1) { fails.push(`FAIL ${ch.id} ${e.file}: old text found ${n} times${brokeByEarlier ? ' (after an earlier edit of this change)' : ''}`); continue }
    scratch[abs] = text.replace(e.old, () => e.new)
  }
  if (fails.length) {
    report.push(...fails, `HELD ${ch.id}: whole change held back, none of its ${ch.edits?.length ?? 0} edits written`)
    held++
    continue
  }
  Object.assign(files, scratch)
  for (const p of Object.keys(scratch)) touched.add(p)
  for (const e of ch.edits ?? []) report.push(`ok   ${ch.id} ${e.file}`)
  applied++
}
if (!dry) for (const p of touched) fs.writeFileSync(p, files[p])
console.log(report.join('\n'))
console.log(`${dry ? '[dry run] ' : ''}${report.filter((r) => r.startsWith('ok')).length} edits applied (${applied} changes), ${held} changes held back, ${report.filter((r) => /^(FAIL|UNVERIFIED|UNKNOWN)/.test(r)).length} problems, ${touched.size} files`)

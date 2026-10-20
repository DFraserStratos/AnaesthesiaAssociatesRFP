// Applies the edits of accepted changes by exact string replacement (each "old" must occur exactly once).
// Usage: node apply.mjs <changes.json> <repo root> [ID ...] [--ids-file <file>] [--dry-run]
//   IDs are change ids from the review page (L-01, M-03, S-12); --ids-file reads them from a file
//   (whitespace or newline separated, e.g. the accepted-ids.txt written by decisions.mjs). Run --dry-run first.
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const dry = args.includes('--dry-run')
const fi = args.indexOf('--ids-file')
const idsFile = fi >= 0 ? args[fi + 1] : null
const rest = args.filter((a, i) => a !== '--dry-run' && (fi < 0 || (i !== fi && i !== fi + 1)))
const [changesPath, repo, ...cliIds] = rest
if (!changesPath || !repo) { console.error('usage: node apply.mjs <changes.json> <repo root> [ID ...] [--ids-file <file>] [--dry-run]'); process.exit(2) }
const ids = [...cliIds, ...(idsFile ? fs.readFileSync(idsFile, 'utf8').split(/\s+/).filter((x) => /^[LMS]-\d+$/.test(x)) : [])]
const { changes } = JSON.parse(fs.readFileSync(changesPath, 'utf8'))
const want = new Set(ids)
const files = {}
const report = []
for (const ch of changes.filter((c) => want.has(c.id))) {
  for (const e of ch.edits) {
    const p = path.join(repo, e.file)
    files[p] ??= fs.readFileSync(p, 'utf8')
    const n = files[p].split(e.old).length - 1
    if (n !== 1) { report.push(`FAIL ${ch.id} ${e.file}: old text found ${n} times`); continue }
    files[p] = files[p].replace(e.old, () => e.new)
    report.push(`ok   ${ch.id} ${e.file}`)
  }
}
const missing = ids.filter((i) => !changes.find((c) => c.id === i))
if (missing.length) report.push(`UNKNOWN IDs: ${missing.join(' ')}`)
if (!dry) for (const [p, t] of Object.entries(files)) fs.writeFileSync(p, t)
console.log(report.join('\n'))
console.log(`${dry ? '[dry run] ' : ''}${report.filter((r) => r.startsWith('ok')).length} edits applied, ${report.filter((r) => r.startsWith('FAIL')).length} failed, ${Object.keys(files).length} files`)

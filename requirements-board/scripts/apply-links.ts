/**
 * Apply the verified link proposals of one `link-requirements` run to the catalogue.
 *   npm run links:apply [-- <run dir>] [-- --dry-run]   default run: .links/current in this folder (the run
 *   `links:index` started last)
 * Reads every `*.verified.json` in the run folder (`{ accepted: Proposal[] }`), and only that folder: an
 * earlier run's proposals are never applied unless its folder is named. Checks each proposal again against
 * the files as they are now, and writes through the board's own serialiser. Refuses to write if the result
 * would add a `check` error. Writes `links-report.md` in the run folder either way, naming the run. Safe to
 * run twice: anything already applied is skipped.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkCatalogue, issueKey } from '../shared/check.ts'
import type { Item } from '../shared/types.ts'
import { REQUIREMENTS_DIR, fileExistsIn, loadCatalogue, readConfig, readLayout, writeItem } from '../server/catalogueFs.ts'
import { applyProposals, type Outcome, type Proposal } from './linkProposals.ts'
import { pickLinkRun, type LinkRun } from './linkRuns.ts'
import { shown, userPath } from './userPath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../.links')
const named = process.argv.slice(2).find((a) => !a.startsWith('--'))
// A folder named on the command line is read from the folder the command was run from.
const dirArg = named === undefined ? undefined : userPath(named)
const dry = process.argv.includes('--dry-run')

let run: LinkRun
try {
  run = pickLinkRun(root, dirArg)
} catch (e) {
  console.error((e as Error).message)
  process.exit(1)
}
const { dir, files } = run
const runName = `${shown(dir)}${run.started ? ` (started ${run.started})` : ''}`
const proposals: Proposal[] = files.flatMap((f) => (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { accepted?: Proposal[] }).accepted ?? [])

const { items, questions, config } = loadCatalogue()
const itemList = Object.values(items).map((r) => r.data)
const questionList = Object.values(questions).map((r) => r.data)
const { changed, outcomes } = applyProposals(itemList, questionList, proposals, config)

const check = (list: Item[]) => checkCatalogue({ items: list, questions: questionList, fileExists: fileExistsIn(REQUIREMENTS_DIR), lanes: readLayout().layout.lanes, config: readConfig().config })
const before = new Set(check(itemList).map(issueKey))
const after = check(itemList.map((it) => changed.get(it.id) ?? it))
const added = after.filter((i) => !before.has(issueKey(i)))
const newErrors = added.filter((i) => i.severity === 'error')

writeFileSync(join(dir, 'links-report.md'), report(outcomes, added.map((i) => `${i.severity} ${i.id}: ${i.message}`)))
const applied = outcomes.filter((o) => !o.skipped).length
console.log(`Run ${runName}`)
console.log(`${files.length} batch file(s), ${proposals.length} proposal(s): ${applied} apply, ${outcomes.length - applied} skipped, ${changed.size} file(s) change`)
for (const i of added) console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '}  ${i.id.padEnd(10)} ${i.message}`)
if (!files.length) {
  const earlier = run.earlier[0]
  console.warn(`WARNING: no proposal files in ${dir}.${earlier ? ` The newest earlier run with proposals is ${earlier}: pass it (links:apply -- ${earlier}) if that is the run to apply (links:index started a new run since).` : ' Run the link-requirements workflow first.'}`)
}
if (run.loose.length) console.log(`Not applied: ${run.loose.length} proposal file(s) left in ${root} from before link runs had their own folders (${run.loose.join(', ')}). Delete them when you no longer need them.`)
console.log(`Report: ${join(dir, 'links-report.md')}`)
if (newErrors.length) {
  console.error(`Not written: ${newErrors.length} new check error(s).`)
  process.exit(1)
}
if (dry) {
  console.log('Dry run: nothing written.')
} else {
  for (const it of changed.values()) writeItem(it)
  console.log(`Wrote ${changed.size} file(s). Run npm run check, then review git diff.`)
}

function report(outcomes: Outcome[], issues: string[]): string {
  const name = (id: string) => {
    const r = items[id]?.data ?? questions[id]?.data
    return r ? `${r.title} (${id})` : id
  }
  const owner = (p: Proposal) => (p.kind === 'inline' ? p.item : p.from)
  const line = ({ proposal: p, skipped }: Outcome) => {
    const what = p.kind === 'inline' ? `${p.field}: "${p.anchor}" → ${name(p.target)}` : `related → ${name(p.to)}`
    return `- ${what}${p.reason ? `. ${p.reason}` : ''}${skipped ? `\n  - **Skipped:** ${skipped}` : ''}`
  }
  const byItem = new Map<string, Outcome[]>()
  for (const o of outcomes) byItem.set(owner(o.proposal), [...(byItem.get(owner(o.proposal)) ?? []), o])
  const ids = [...byItem.keys()].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  const applied = outcomes.filter((o) => !o.skipped).length
  return [
    '# Link proposals',
    '',
    `Run: ${runName}, ${files.length} batch file(s)${files.length ? `: ${files.join(', ')}` : ''}.`,
    '',
    `${applied} ${dry ? 'to apply' : 'applied'}, ${outcomes.length - applied} skipped, across ${ids.length} item(s).`,
    '',
    ...(run.loose.length ? [`Not applied: ${run.loose.length} proposal file(s) from before link runs had their own folders, left in ${root}.`, ''] : []),
    ...(issues.length ? ['## New check issues', '', ...issues.map((i) => `- ${i}`), ''] : []),
    ...ids.flatMap((id) => [`## ${name(id)}`, '', ...byItem.get(id)!.map(line), '']),
  ].join('\n')
}

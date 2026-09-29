/**
 * A compact index of the live catalogue, for agents linking requirements: one line per live item,
 * in tree order, with its gist, its `related` entries and the records its text already links to,
 * then the open questions.
 *   npm run links:index [-- <out.md>]   default .links/index.md in this folder (gitignored); `-` prints it
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { depthFirst } from '../shared/csv.ts'
import { itemLinkTargets, linkTargets, plainText } from '../shared/links.ts'
import { TYPE_LABEL, isOpenQuestion, type Item } from '../shared/types.ts'
import { loadCatalogue } from '../server/catalogueFs.ts'

const { items, questions } = loadCatalogue()
const all = Object.values(items).map((r) => r.data)
const byId = new Map(all.map((i) => [i.id, i]))
const retiredOrUnder = (it: Item): boolean => it.status === 'Retired' || (!!it.parent && !!byId.get(it.parent) && retiredOrUnder(byId.get(it.parent)!))
const depth = (it: Item): number => (it.parent && byId.get(it.parent) ? depth(byId.get(it.parent)!) + 1 : 0)

/** The first sentence of a text, as plain words, at most `max` characters. */
function gist(md: string, max = 220): string {
  const text = plainText(md).replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim()
  const end = text.search(/[.!?](\s|$)/)
  const first = end >= 0 ? text.slice(0, end + 1) : text
  return first.length > max ? first.slice(0, max - 1).trimEnd() + '…' : first
}

const live = depthFirst(all).filter((it) => !retiredOrUnder(it))
const lines = [
  '# Catalogue index',
  '',
  `${live.length} live items (retired ones left out), then the open questions. Each line: ID, type, status, title: first sentence.`,
  '`related:` lists relations stored on that card; `links:` the records its text already links to or mentions.',
  'Files: docs/discovery-reference/Updated Requirements/catalogue/requirements/<ID>.md and questions/<ID>.md.',
  '',
]
for (const it of live) {
  const extras = [it.related.length ? `related: ${it.related.join(', ')}` : '', itemLinkTargets(it).length ? `links: ${itemLinkTargets(it).join(', ')}` : ''].filter(Boolean)
  const head = `${'  '.repeat(depth(it))}- ${it.id} · ${TYPE_LABEL[it.type]} · ${it.status} · ${it.title}`
  lines.push(`${head}${it.description ? `: ${gist(it.description)}` : ''}${extras.length ? ` [${extras.join('; ')}]` : ''}`)
}
lines.push('', '## Open questions', '')
for (const q of Object.values(questions)
  .map((r) => r.data)
  .filter(isOpenQuestion)
  .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))) {
  const links = linkTargets(q.question)
  lines.push(`- ${q.id} · ${q.status} · ${q.title}: ${gist(q.question)} [affects: ${q.affects.join(', ') || 'none'}${links.length ? `; links: ${links.join(', ')}` : ''}]`)
}

const text = lines.join('\n') + '\n'
const out = process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '../.links/index.md')
if (out === '-') process.stdout.write(text)
else {
  mkdirSync(dirname(resolve(out)), { recursive: true })
  writeFileSync(resolve(out), text)
  console.log(`Wrote ${live.length} items to ${resolve(out)}`)
}

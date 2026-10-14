/**
 * A compact index of the live catalogue, for agents linking requirements: one line per live item,
 * in tree order, with its gist, its `related` entries and the records its text already links to,
 * then the open questions. Beside it, `batches.json`: the live epics in tree order, grouped into
 * batches of roughly BATCH_ITEMS items, for the `link-requirements` workflow's `batches` argument.
 *   npm run links:index [-- <out.md>]   default .links/index.md in this folder (gitignored); `-` prints it
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { depthFirst } from '../shared/csv.ts'
import { itemLinkTargets, linkTargets, plainText } from '../shared/links.ts'
import { TYPE_LABEL, isOpenQuestion, type Item } from '../shared/types.ts'
import { REQUIREMENTS_DIR, loadCatalogue } from '../server/catalogueFs.ts'

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
  `Files: ${relative(process.cwd(), join(REQUIREMENTS_DIR, 'stories')) || '.'}/<ID>.md and questions/<ID>.md.`,
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
  const batchFile = join(dirname(resolve(out)), 'batches.json')
  writeFileSync(batchFile, JSON.stringify(batches(), null, 2) + '\n')
  console.log(`Wrote ${live.length} items to ${resolve(out)}, and the epic batches to ${batchFile}`)
}

/** Live epics in order, gathered into batches of about BATCH_ITEMS live items; a big epic is a batch of its own. */
function batches(): string[][] {
  const BATCH_ITEMS = 45
  const top = new Map<string, number>()
  const epicOf = (it: Item): Item => (it.parent && byId.get(it.parent) ? epicOf(byId.get(it.parent)!) : it)
  for (const it of live) {
    const e = epicOf(it)
    if (e.type === 'epic') top.set(e.id, (top.get(e.id) ?? 0) + 1)
  }
  const out: string[][] = []
  let cur: string[] = []
  let n = 0
  for (const [id, count] of top) {
    if (cur.length && n + count > BATCH_ITEMS) {
      out.push(cur)
      cur = []
      n = 0
    }
    cur.push(id)
    n += count
  }
  if (cur.length) out.push(cur)
  return out
}

/**
 * D-03 (accepted decision 18): agent tools use the board's own rules by importing `shared/*.ts`
 * directly under Node's type stripping, found from the catalogue path the tool already takes. This
 * proves it the way a tool runs (plain `node`, an `.mjs`, no build step), and that the note-cite
 * resolver an agent gets gives the same note as the board's source resolver, as the check runs it,
 * for every note and every `Notes <date> · ...` source in the catalogue.
 *
 *   node --test requirements-board/agent/shared-rules.test.mjs
 *   REQUIREMENTS_DIR=<catalogue> node --test ...      another catalogue (default: the board's own)
 */
import assert from 'node:assert/strict'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const req = resolve(process.env.REQUIREMENTS_DIR ?? join(here, '..', 'requirements'))

// The agent side, exactly as a tool does it: the board sits one folder above its catalogue.
const board = join(req, '..')
const load = (path) => import(pathToFileURL(join(board, path)).href)
const { resolveNoteCite } = await load('shared/sources.ts')
const { loadSourceIndex } = await load('server/sourceIndex.ts')

// The board side: the catalogue loaded as the check and the dev server load it, facts and all.
async function boardResolver() {
  process.env.REQUIREMENTS_DIR = req
  const { loadCatalogue } = await import(pathToFileURL(join(board, 'server', 'catalogueFs.ts')).href)
  const { buildSourceIndex: build, resolveSource, spotFactsOfMeta } = await load('shared/sources.ts')
  const cat = loadCatalogue(req)
  const recs = cat.artifacts
  const index = build(
    Object.values(recs).map((r) => r.data),
    (id) => (recs[id] ? spotFactsOfMeta(recs[id].meta) : null),
  )
  const sources = [...Object.values(cat.items), ...Object.values(cat.questions), ...Object.values(recs)].flatMap((r) => r.data.sources ?? [])
  return { resolve: (cite) => resolveSource(index, cite), sources, recs }
}

test('an agent imports the shared rules directly, with plain node', () => {
  assert.equal(typeof resolveNoteCite, 'function')
  assert.equal(typeof loadSourceIndex, 'function')
})

test('the agent-side note-cite resolver opens the same note as the board, for every note and Notes source', async () => {
  const agent = loadSourceIndex(req)
  const boardSide = await boardResolver()
  const notes = Object.values(boardSide.recs).map((r) => r.data.file).filter((f) => f && /^notes\/\d{4}-\d{2}-\d{2}-.+\.md$/.test(f))
  assert.ok(notes.length > 0, 'the catalogue has notes')
  const nobody = /^notes\/(\d{4}-\d{2}-\d{2})-/.exec(notes[0])[1]
  const cites = new Set([
    // Every note by its own file name's words: with a point, without one (FINDINGS R-141), and with
    // its first word given an apostrophe as a title would ("Donald's", "AA's"), which slugs elsewhere.
    ...notes.flatMap((f) => {
      const [, date, slug] = /^notes\/(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(f)
      const [first, ...rest] = slug.split('-')
      const words = [first, ...rest].join(' ')
      return [`Notes ${date} · ${words}`, `Notes ${date} · ${words} #1`, `Notes ${date} · ${first}'s ${rest.join(' ')} #1`]
    }),
    // Every Notes source the catalogue holds.
    ...boardSide.sources.filter((s) => s.startsWith('Notes ')),
    // Words that match no note of a date that has notes.
    `Notes ${nobody} · A meeting nobody had`,
  ])
  let resolved = 0
  for (const cite of cites) {
    const fromAgent = resolveNoteCite(agent, cite)?.id ?? null
    const r = boardSide.resolve(cite)
    // The board's answer, when it is a note (the resolver answers for notes only).
    const fromBoard = r.kind === 'artifact' && /^notes\//.test(boardSide.recs[r.id]?.data.file ?? '') ? r.id : null
    assert.equal(fromAgent, fromBoard, cite)
    if (fromBoard) resolved++
  }
  // A cite whose words match no note is unresolved, never the first note of that date.
  assert.equal(resolveNoteCite(agent, `Notes ${nobody} · A meeting nobody had`), null)
  assert.ok(resolved >= notes.length, `most cites resolve (${resolved} of ${cites.size})`)
})

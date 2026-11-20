/**
 * The workflows, run in a stubbed Workflow runtime (args, log, agent, parallel, pipeline, phase, top-level
 * return): what they log, ask the agents and return, with no agent run.
 *
 *   node --test requirements-board/agent/workflows/workflows.test.mjs
 *   WF_DIR=<folder> node --test ...   the workflows to test (default: this folder)
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.resolve(process.env.WF_DIR ?? here)
const BOARD = path.resolve(here, '..', '..')
const AsyncFunction = (async () => {}).constructor

async function runWorkflow(name, args, respond = () => null) {
  const src = fs.readFileSync(path.join(DIR, `${name}.js`), 'utf8').replace(/^export const meta =/m, 'const meta =')
  const calls = [], logs = []
  const agent = async (prompt, opts) => { calls.push({ prompt, opts }); return respond(prompt, opts) }
  const parallel = (thunks) => Promise.all(thunks.map((t) => t()))
  const pipeline = (items, first, then) => Promise.all(items.map(async (it) => (then ? then(await first(it), it) : first(it))))
  const result = await new AsyncFunction('args', 'log', 'agent', 'parallel', 'pipeline', 'phase', src)(args, (m) => logs.push(m), agent, parallel, pipeline, () => {})
  return { result, calls, logs }
}

test('REQ-13 (R-146): link-requirements takes epic groups, a flat list of epics, or a mix', async () => {
  const counts = () => ({ file: 'x', inline: 0, related: 0, rejected: 0 })
  const labels = async (batches) => (await runWorkflow('link-requirements', { batches }, counts)).calls.map((c) => c.opts.label)
  assert.deepEqual(await labels([['EP-06']]), ['propose:EP-06', 'verify:EP-06'])
  assert.deepEqual((await labels(['EP-04', 'EP-06'])).sort(), ['propose:EP-04', 'propose:EP-06', 'verify:EP-04', 'verify:EP-06'])
  assert.deepEqual((await labels(['EP-01', ['EP-04', 'EP-06']])).sort(), ['propose:EP-01', 'propose:EP-04+EP-06', 'verify:EP-01', 'verify:EP-04+EP-06'])
  const flat = await runWorkflow('link-requirements', { batches: ['EP-04', 'EP-06'] }, counts)
  assert.ok(flat.logs.some((l) => /2 batch\(es\): EP-04, EP-06/.test(l)), flat.logs.join('\n'))
  const bad = await runWorkflow('link-requirements', { batches: ['EP-04', 'FT-06.1', [], 7] }, counts)
  assert.equal(bad.calls.length, 0)
  assert.equal(bad.result.error, 'bad batches')
  assert.deepEqual(bad.result.bad, ['FT-06.1', [], 7])
  const notList = await runWorkflow('link-requirements', { batches: 'EP-04' }, counts)
  assert.equal(notList.calls.length, 0)
  assert.equal(notList.result.error, 'bad batches')
  // a batch named twice runs once
  assert.deepEqual((await labels(['EP-04', ['EP-04']])).sort(), ['propose:EP-04', 'verify:EP-04'])
})

test('REQ-11 (R-08): the link workflow writes into the run links:index started', async () => {
  const { calls } = await runWorkflow('link-requirements', { batches: ['EP-06'] }, () => ({ file: 'x', inline: 0, related: 0 }))
  assert.match(calls[0].prompt, /requirements-board\/\.links\/current\/EP-06\.proposed\.json/)
  assert.match(calls[1].prompt, /requirements-board\/\.links\/current\/EP-06\.verified\.json/)
})

const rulingsArgs = { out: '/run', baseline: 'abc1234', notes: ['req/notes/2026-10-16-sam-pricing-call.md', 'req/notes/2026-10-17-decision-payer.md'] }
const extract = () => ({ decisions: [], caveats: '' })
const mergeOf = async (args) => (await runWorkflow('consistency-rulings', args, (p, o) => (o.label === 'merge:rulings' ? { rulings: 0 } : extract()))).calls.find((c) => c.opts.label === 'merge:rulings').prompt

test('REQ-09 (R-145): the Conflicts heading reads properly with or without an owner', async () => {
  assert.match(await mergeOf(rulingsArgs), /^## Conflicts for the product owner$/m)
  assert.match(await mergeOf({ ...rulingsArgs, owner: 'Rosa' }), /^## Conflicts for Rosa$/m)
  assert.match(await mergeOf({ ...rulingsArgs, owner: 'Sam (product owner)' }), /^## Conflicts for Sam$/m)
  assert.match(await mergeOf({ ...rulingsArgs, owner: 'The product owner (Sam)' }), /^## Conflicts for The product owner \(Sam\)$/m)
  assert.match(await mergeOf({ ...rulingsArgs, owner: 'Sam Jones', ownerShort: 'Sam J' }), /^## Conflicts for Sam J$/m)
})

test('REQ-07a (R-141): the rulings prompts teach slug words and list the note prefixes that resolve', async () => {
  const { calls } = await runWorkflow('consistency-rulings', rulingsArgs, (p, o) => (o.label === 'merge:rulings' ? { rulings: 0 } : extract()))
  for (const c of calls) {
    assert.match(c.prompt, /file name after its date, hyphens as spaces, not its title/, c.opts.label)
    // a note's extractor is given its own prefix; the merge (and change logs, questions) every prefix
    if (c.opts.label === 'note:2026-10-16-sam-pricing-call') assert.ok(c.prompt.includes("This note's prefix is: Notes 2026-10-16 · sam pricing call."), c.opts.label)
    else if (c.opts.label === 'note:2026-10-17-decision-payer') assert.ok(c.prompt.includes("This note's prefix is: Notes 2026-10-17 · decision payer."), c.opts.label)
    else assert.ok(c.prompt.includes('Notes 2026-10-16 · sam pricing call; Notes 2026-10-17 · decision payer'), c.opts.label)
  }
  const extractor = calls.find((c) => c.opts.label.startsWith('note:'))
  assert.match(extractor.opts.schema.properties.decisions.items.properties.cite.description, /slug words/)
  assert.doesNotMatch(calls.find((c) => c.opts.label === 'merge:rulings').prompt, /note title words/)
})

const changesArgs = (extra = {}) => ({ run: '/run', units: [{ id: 'EP-01', epic: 'EP-01', title: 'E' }], topics: ['Pricing', 'Lists'], diagrams: [], ...extra })
const stage2 = (topic) => (prompt, o) => {
  if (o.label.startsWith('find:')) return { reachedEnd: true, findings: [{ item: 'US-01.1.1', kind: 'other', itemQuote: 'q', against: 'R-001', evidence: 'e', suggestion: 's' }] }
  if (o.label.startsWith('verify:')) return { verified: o.label === 'verify:EP-01' ? [{ action: 'edit', items: ['US-01.1.1'], topic, kind: 'other', summary: 's', change: 'c', evidence: [], rulings: [], edits: [], size: 'small', confidence: 'high' }] : [], dropped: [], newQuestions: [] }
  return { changes: [], dropped: [], newQuestions: [], dismissedQuestions: [], notes: '' }
}

test('REQ-10 (R-147): group topics that match no rulings topic are named, with the catch-all count', async () => {
  const groups = [{ name: 'Money', topics: ['Pricing', 'Prices and pricing'] }, { name: 'Rest', topics: null }]
  const { result, logs } = await runWorkflow('consistency-changes', changesArgs({ groups }), stage2('Lists'))
  assert.deepEqual(result.groupCheck, { unmatched: ['Prices and pricing'], catchAll: ['Rest'], toCatchAll: 1 })
  assert.ok(logs.some((l) => /WARNING: 1 group topic\(s\) match no rulings topic.*"Prices and pricing"/.test(l)), logs.join('\n'))
  assert.ok(logs.some((l) => /Group check: 1 of 1 findings have a topic no group lists and go to the catch-all group/.test(l)), logs.join('\n'))
  const clean = await runWorkflow('consistency-changes', changesArgs({ groups: [{ name: 'Money', topics: ['Pricing'] }, { name: 'Rest', topics: null }] }), stage2('Pricing'))
  assert.deepEqual(clean.result.groupCheck.unmatched, [])
  assert.ok(!clean.logs.some((l) => /WARNING/.test(l)))
})

test("REQ-10 (R-147): this repo's consolidation groups name only its suggested topics", () => {
  const skill = fs.readFileSync(path.join(BOARD, 'agent', 'skills', 'consistency-review', 'SKILL.md'), 'utf8')
  const json = JSON.parse(skill.match(/```json\n([\s\S]*?)\n```/)[1])
  const topics = new Set(json.rulings.topics)
  const listed = json.review.groups.flatMap((g) => g.topics ?? [])
  assert.deepEqual(listed.filter((t) => !topics.has(t)), [])
  assert.equal(json.review.groups.filter((g) => g.topics === null).length, 1)
})

test('REQ-04, REQ-05 (R-20, R-21): stage 2 asks for an action and lets consolidators keep, merge or dismiss questions', async () => {
  const { calls } = await runWorkflow('consistency-changes', changesArgs(), stage2('Pricing'))
  const verify = calls.find((c) => c.opts.label === 'verify:EP-01')
  assert.deepEqual(verify.opts.schema.properties.verified.items.properties.action.enum, ['edit', 'redraw', 'flag'])
  const cons = calls.find((c) => c.opts.label.startsWith('consolidate:'))
  const s = cons.opts.schema
  assert.ok(s.required.includes('dismissedQuestions'))
  assert.ok(s.properties.newQuestions.items.required.includes('from'))
  assert.deepEqual(s.properties.changes.items.properties.action.enum, ['edit', 'redraw', 'flag'])
  assert.match(cons.prompt, /dismiss it in dismissedQuestions/)
})

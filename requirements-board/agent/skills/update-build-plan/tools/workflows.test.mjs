// node --test: the plan workflows in a stubbed Workflow runtime (args, log, agent, parallel, pipeline, phase,
// top-level return): what they ask the agents and return, with no agent run.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const AsyncFunction = (async () => {}).constructor

async function runWorkflow(name, args, respond = () => null) {
  const src = fs.readFileSync(path.join(HERE, `${name}.js`), 'utf8').replace(/^export const meta =/m, 'const meta =')
  const calls = [], logs = []
  const agent = async (prompt, opts) => { calls.push({ prompt, opts }); return respond(prompt, opts, calls) }
  const parallel = thunks => Promise.all(thunks.map(t => t()))
  const pipeline = (items, first, then) => Promise.all(items.map(async it => (then ? then(await first(it), it) : first(it))))
  const result = await new AsyncFunction('args', 'log', 'agent', 'parallel', 'pipeline', 'phase', src)(args, m => logs.push(m), agent, parallel, pipeline, () => {})
  return { result, calls, logs, labels: calls.map(c => c.opts.label) }
}

const phase = (num, covers = []) => ({ num, slug: `p${num}`, title: `P${num}`, track: 'T', goal: 'g', delivers: 'd', depends_on: [], est_sessions: '1', covers, demo_triggers: [], blocked_by_oqs: [], risks: '' })
const outline = (phases, parked = []) => ({ phases, parked, sequencing_rules: '', milestones: [], affected: [] })
const outlineArgs = extra => ({
  root: '/repo', config: { plan: 'plan', firstPhase: '01' }, baseline: 'a'.repeat(40), commit: 'b'.repeat(40),
  units: ['US-01.1.1'], oldPhases: [{ num: '44', title: 'P44', file: 'phases/phase-44-p44.md', covers: ['US-01.1.1'] }],
  builtPhases: ['44'], changeNotes: 'US-01.1.1 changed.', ...extra,
})

test('outline: a re-graded gap left only on a built phase is stranded until it moves', async () => {
  const { labels, calls, result } = await runWorkflow('workflow-plan-outline', outlineArgs({ regraded: ['US-01.1.1'] }), (p, o) => {
    if (o.label === 'architect:update') return outline([phase('44', ['US-01.1.1'])])
    if (o.label === 'coverage-fix-1') return outline([phase('44'), phase('45', ['US-01.1.1'])])
    if (o.label === 'critic') return { verdict: 'ok', issues: [] }
  })
  assert.deepEqual(labels, ['architect:update', 'coverage-fix-1', 'critic'])
  assert.match(calls[0].prompt, /Re-graded this update: US-01\.1\.1/)
  assert.match(calls[1].prompt, /^Stranded .*: US-01\.1\.1 \(built 44\)$/m)
  assert.equal(result.coverage.ok, true)
  assert.deepEqual(result.coverage.stranded, [])
})

test('outline: a gap on a built phase that was not re-graded is not stranded', async () => {
  const { labels } = await runWorkflow('workflow-plan-outline', outlineArgs({ regraded: [] }), (p, o) =>
    o.label === 'critic' ? { verdict: 'ok', issues: [] } : outline([phase('44', ['US-01.1.1'])]))
  assert.deepEqual(labels, ['architect:update', 'critic'])
})

test('outline: new phases number upward from the highest; a letter only beside an unbuilt phase', async () => {
  const args = outlineArgs({ units: ['US-01.1.1', 'US-01.1.2'], oldPhases: [{ num: '44', covers: [] }, { num: '20', covers: [] }], builtPhases: ['44', '20'] })
  const { calls, labels, result } = await runWorkflow('workflow-plan-outline', args, (p, o) => {
    if (o.label === 'architect:update') return outline([phase('20'), phase('44'), phase('44a', ['US-01.1.1']), phase('21', ['US-01.1.2'])])
    if (o.label.startsWith('coverage-fix')) return outline([phase('20'), phase('44'), phase('45', ['US-01.1.1']), phase('46', ['US-01.1.2'])])
    if (o.label === 'critic') return { verdict: 'ok', issues: [] }
  })
  assert.match(calls[0].prompt, /the next new phase is 45, then upward/)
  assert.deepEqual(labels, ['architect:update', 'coverage-fix-1', 'critic'])
  assert.match(calls[1].prompt, /44a: phase 44 is built/)
  assert.match(calls[1].prompt, /21: a new phase numbers from 45 upward/)
  assert.equal(result.coverage.ok, true)
})

test('outline: with no phases, numbering starts at config firstPhase', async () => {
  const args = outlineArgs({ config: { plan: 'plan', firstPhase: '45' }, units: [], oldPhases: [], builtPhases: [] })
  const { calls } = await runWorkflow('workflow-plan-outline', args, (p, o) => (o.label === 'critic' ? { verdict: 'ok', issues: [] } : outline([])))
  assert.match(calls[0].prompt, /the next new phase is 45, then upward \(the plan has no phases yet, so numbering starts at config firstPhase 45\)/)
})

test('outline: a revision that breaks coverage gets one final fix', async () => {
  const { labels, result } = await runWorkflow('workflow-plan-outline', outlineArgs({ builtPhases: [], regraded: ['US-01.1.1'] }), (p, o) => {
    if (o.label === 'critic') return { verdict: 'revise', issues: [{ severity: 'major', issue: 'i', suggestion: 's' }] }
    if (o.label === 'architect:revise') return outline([phase('44')])
    return outline([phase('44', ['US-01.1.1'])])
  })
  assert.deepEqual(labels, ['architect:update', 'critic', 'architect:revise', 'coverage-fix-final'])
  assert.equal(result.coverage.ok, true)
})

const gapArgs = extra => ({ root: '/repo', config: { plan: 'plan', appNoun: 'app', gapAnalysis: { maps: [{ key: 'ui', scope: 'u' }, { key: 'data', scope: 'd' }] } }, commit: 'b'.repeat(40), baseline: 'a'.repeat(40), epics: [], runReverse: false, runThemes: false, ...extra })
const gapRespond = (p, o) => (o.label.includes('domain-model') ? { deltas: [], summary: '' } : null)

test('gap analysis: reuseMaps still makes the maps that are missing', async () => {
  const { labels } = await runWorkflow('workflow-gap-analysis', gapArgs({ reuseMaps: true, runDelta: false, missingMaps: ['data'] }), gapRespond)
  assert.deepEqual(labels, ['map:data'])
  const none = await runWorkflow('workflow-gap-analysis', gapArgs({ reuseMaps: true, runDelta: false }), gapRespond)
  assert.deepEqual(none.labels, [])
})

test('gap analysis: a missing delta file runs the delta fresh, even with runDelta false', async () => {
  const { labels, calls } = await runWorkflow('workflow-gap-analysis', gapArgs({ reuseMaps: true, runDelta: false, deltaMissing: true }), gapRespond)
  assert.deepEqual(labels, ['delta:domain-model', 'verify:domain-model'])
  assert.doesNotMatch(calls[0].prompt, /This is an UPDATE/)
  assert.match(calls[0].prompt, /There is no earlier .*domain-model-delta\.md": write it fresh/)
  const update = await runWorkflow('workflow-gap-analysis', gapArgs({ reuseMaps: true, runDelta: true }), gapRespond)
  assert.match(update.calls[0].prompt, /This is an UPDATE/)
})

/**
 * Stepped diagrams, as pure functions. A stepped diagram is an SVG artifact whose sidecar lists
 * `steps`: each reveals more of the drawing (cumulative, nothing is ever hidden again), may
 * highlight some of it (that step only), and carries a caption and a balances table. A step is a
 * spot like a region (`AR-01#step-id`), in the same namespace.
 *
 * Pure: no DOM, no React. The viewer applies `stepState` to the live drawing; the check, the
 * source resolver and the spot names use `stepOf`.
 */
import { lcsPairs } from './textCompare.ts'
import type { Artifact, Step } from './types.ts'

/** The step with this ID, or null. */
export function stepOf(a: Pick<Artifact, 'steps'>, id: string): Step | null {
  return a.steps?.find((s) => s.id === id) ?? null
}

/** The step's position (from 0), or -1 when the artifact has no such step. */
export function stepIndex(a: Pick<Artifact, 'steps'>, id: string): number {
  return a.steps?.findIndex((s) => s.id === id) ?? -1
}

const anchorsOf = (list: string[]) => list.map((x) => x.trim()).filter(Boolean)

/**
 * What the drawing looks like at a step. `hidden`: every anchor a later step's `show` names that
 * no step up to this one has revealed yet. `highlight`: this step's own list (the rest dims).
 * `index` null is the whole drawing: nothing hidden, nothing dimmed.
 */
export function stepState(steps: Step[], index: number | null): { hidden: string[]; highlight: string[] } {
  if (index === null) return { hidden: [], highlight: [] }
  const shown = new Set(steps.slice(0, index + 1).flatMap((s) => anchorsOf(s.show)))
  const hidden: string[] = []
  for (const s of steps.slice(index + 1)) for (const a of anchorsOf(s.show)) if (!shown.has(a) && !hidden.includes(a)) hidden.push(a)
  return { hidden, highlight: anchorsOf(steps[index]?.highlight ?? []) }
}

/** Consecutive steps under one `group` label, in order, each with its position. */
export function stepGroups(steps: Step[]): { group: string; steps: { step: Step; index: number }[] }[] {
  const out: { group: string; steps: { step: Step; index: number }[] }[] = []
  steps.forEach((step, index) => {
    const last = out.at(-1)
    if (last && last.group === step.group) last.steps.push({ step, index })
    else out.push({ group: step.group, steps: [{ step, index }] })
  })
  return out
}

/** The accounts at this step whose amount differs from the previous step's, or that are new. Empty for the first step. */
export function changedBalances(steps: Step[], index: number): Set<string> {
  const out = new Set<string>()
  const cur = steps[index]
  const prev = index > 0 ? steps[index - 1] : undefined
  if (!cur || !prev) return out
  const before = new Map(prev.balances.map((b) => [b.account, b.amount]))
  for (const b of cur.balances) if (before.get(b.account) !== b.amount) out.add(b.account)
  return out
}

const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y)

/**
 * What happened to an artifact's steps between two versions, by step ID, shaped like
 * `regionChanges`: steps added, removed, and changed with a short reason list each. A step whose
 * place in the order changed (among the steps both versions have) is `moved`.
 */
export function stepChanges(from: Step[], to: Step[]) {
  const before = new Map(from.map((s) => [s.id, s]))
  const after = new Map(to.map((s) => [s.id, s]))
  const keptFrom = from.filter((s) => after.has(s.id)).map((s) => s.id)
  const keptTo = to.filter((s) => before.has(s.id)).map((s) => s.id)
  const inPlace = new Set((lcsPairs(keptFrom, keptTo, (x, y) => x === y) ?? []).map(([i]) => keptFrom[i]!))
  const changed: { id: string; name: string; what: string[] }[] = []
  for (const s of to) {
    const was = before.get(s.id)
    if (!was) continue
    const what: string[] = []
    if (was.name !== s.name) what.push('renamed')
    if (was.group !== s.group) what.push('group changed')
    if (was.caption !== s.caption) what.push('caption changed')
    if (!same(was.show, s.show)) what.push('reveals changed')
    if (!same(was.highlight, s.highlight)) what.push('highlight changed')
    if (!same(was.moves ?? [], s.moves ?? [])) what.push('moves changed')
    if (!same(was.balances, s.balances)) what.push('balances changed')
    if (!inPlace.has(s.id)) what.push('moved')
    if (what.length) changed.push({ id: s.id, name: s.name, what })
  }
  return { added: to.filter((s) => !before.has(s.id)), removed: from.filter((s) => !after.has(s.id)), changed }
}

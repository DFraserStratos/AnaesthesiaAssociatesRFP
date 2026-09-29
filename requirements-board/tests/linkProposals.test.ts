import { describe, expect, it } from 'vitest'
import type { Question } from '../shared/types.ts'
import { anchorPositions, applyProposals, type Proposal } from '../scripts/linkProposals.ts'
import { item } from './fixtures.ts'

const epic = item({ id: 'EP-06', type: 'epic' })
const feature = item({ id: 'FT-06.2', type: 'feature', parent: 'EP-06' })
const detect = item({ id: 'US-06.2.1', parent: 'FT-06.2', description: "Flags a Booking whose RVG code is in the anaesthetist's prepaid set. The prepaid set is per anaesthetist." })
const tick = item({ id: 'US-06.1.1', parent: 'EP-06', description: 'Tick codes.' })
const retired = item({ id: 'US-06.1.9', parent: 'EP-06', status: 'Retired' })
const q = { id: 'OQ-25', kind: 'question', title: 'Q', affects: [], owner: '', status: 'Open', sources: [], question: '', answer: '', extra: {} } as Question
const items = [epic, feature, detect, tick, retired]

const run = (proposals: Proposal[]) => applyProposals(items, [q], proposals)

describe('anchorPositions', () => {
  it('finds whole-word occurrences outside links and code', () => {
    expect(anchorPositions('set, reset, `set`, [set](US-01.1.1), set.', 'set')).toEqual([0, 37])
  })
})

describe('applyProposals', () => {
  it('wraps the chosen occurrence and leaves the rest of the text alone', () => {
    const { changed, outcomes } = run([{ kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'prepaid set', occurrence: 2, target: 'US-06.1.1' }])
    expect(outcomes.map((o) => o.skipped)).toEqual([null])
    expect(changed.get('US-06.2.1')!.description).toBe("Flags a Booking whose RVG code is in the anaesthetist's prepaid set. The [prepaid set](US-06.1.1) is per anaesthetist.")
  })

  it('applies several links to one field in turn, and skips a second link to the same target', () => {
    const { changed, outcomes } = run([
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: "anaesthetist's prepaid set", target: 'US-06.1.1' },
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'prepaid set', target: 'US-06.1.1' },
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'Booking', target: 'OQ-25' },
    ])
    expect(outcomes.map((o) => o.skipped)).toEqual([null, 'the description already links to US-06.1.1', null])
    expect(changed.get('US-06.2.1')!.description).toBe("Flags a [Booking](OQ-25) whose RVG code is in the [anaesthetist's prepaid set](US-06.1.1). The prepaid set is per anaesthetist.")
  })

  it('skips what no longer fits: a missing anchor, a retired or family target, a retired item', () => {
    const { changed, outcomes } = run([
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'not there', target: 'US-06.1.1' },
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'Booking', target: 'US-06.1.9' },
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'Booking', target: 'FT-06.2' },
      { kind: 'inline', item: 'US-06.1.9', field: 'description', anchor: 'x', target: 'US-06.1.1' },
    ])
    expect(outcomes.every((o) => o.skipped)).toBe(true)
    expect(changed.size).toBe(0)
  })

  it('adds a relation once, whichever side proposed it', () => {
    const { changed, outcomes } = run([
      { kind: 'related', from: 'US-06.1.1', to: 'US-06.2.1' },
      { kind: 'related', from: 'US-06.2.1', to: 'US-06.1.1' },
      { kind: 'related', from: 'US-06.2.1', to: 'EP-06' },
    ])
    expect(outcomes.map((o) => o.skipped)).toEqual([null, 'already related', 'an item is not related to itself, its lineage or its children'])
    expect(changed.get('US-06.1.1')!.related).toEqual(['US-06.2.1'])
    expect(changed.has('US-06.2.1')).toBe(false)
  })

  it('skips a relation the text already makes', () => {
    const { outcomes } = run([
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'prepaid set', target: 'US-06.1.1' },
      { kind: 'related', from: 'US-06.1.1', to: 'US-06.2.1' },
    ])
    expect(outcomes.map((o) => o.skipped)).toEqual([null, 'the text already links them'])
  })

  it('is idempotent: applying the result again changes nothing', () => {
    const proposals: Proposal[] = [
      { kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'prepaid set', target: 'US-06.1.1' },
      { kind: 'related', from: 'US-06.1.1', to: 'US-06.1.9' },
      { kind: 'related', from: 'FT-06.2', to: 'US-06.1.1' },
    ]
    const first = run(proposals)
    const again = applyProposals(
      items.map((it) => first.changed.get(it.id) ?? it),
      [q],
      proposals,
    )
    expect(again.changed.size).toBe(0)
  })
})

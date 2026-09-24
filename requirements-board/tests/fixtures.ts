/** A small synthetic catalogue, so tests don't depend on the live requirements content. */
import type { Item, Question } from '../shared/types.ts'

export const item = (over: Partial<Item> & Pick<Item, 'id'>): Item => ({
  type: 'story',
  parent: null,
  title: `Title of ${over.id}`,
  status: 'Proposed',
  components: ['Scheduling Engine'],
  sources: [],
  order: 1,
  images: [],
  description: '',
  notes: '',
  extra: {},
  ...over,
})

export const question = (over: Partial<Question> & Pick<Question, 'id'>): Question => ({
  kind: 'question',
  title: `Question ${over.id}`,
  status: 'Open',
  owner: 'AA',
  affects: [],
  sources: [],
  question: 'Why?',
  answer: '',
  extra: {},
  ...over,
})

/**
 * `epics` x `features` per epic x `stories` per feature, plus two stories
 * directly under the last epic. Orders follow ID order.
 */
export function syntheticCatalogue(epics = 6, features = 5, stories = 4): Item[] {
  const out: Item[] = []
  const pad = (n: number) => String(n).padStart(2, '0')
  for (let e = 1; e <= epics; e++) {
    const ep = `EP-${pad(e)}`
    out.push(item({ id: ep, type: 'epic', parent: null, order: e }))
    for (let f = 1; f <= features; f++) {
      const ft = `FT-${pad(e)}.${f}`
      out.push(item({ id: ft, type: 'feature', parent: ep, order: f }))
      for (let s = 1; s <= stories + ((e + f) % 3); s++) out.push(item({ id: `US-${pad(e)}.${f}.${s}`, parent: ft, order: s }))
    }
  }
  const last = `EP-${pad(epics)}`
  out.push(item({ id: `US-${pad(epics)}.0.1`, parent: last, order: features + 1 }), item({ id: `US-${pad(epics)}.0.2`, parent: last, order: features + 2 }))
  return out
}

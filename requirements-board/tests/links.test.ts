import { describe, expect, it } from 'vitest'
import { isRecordId, linkTargets, mentions, pastedTarget, plainText } from '../shared/links.ts'
import type { Item, Rev } from '../shared/types.ts'
import { linkSelection } from '../src/linkEdit.ts'
import { buildIndex, relatedFor } from '../src/store.ts'
import { item } from './fixtures.ts'

describe('mentions', () => {
  it('finds explicit links and bare IDs, once each, in order', () => {
    expect(mentions('Uses [the prepaid set](US-06.1.1), see OQ-25 and US-06.1.1.')).toEqual([
      { id: 'US-06.1.1', bare: false },
      { id: 'OQ-25', bare: true },
    ])
  })

  it('reads an ID at the end of a sentence, and not part of a longer ID', () => {
    expect(linkTargets('Under FT-06.2. Then EP-06, US-06.2.1; and (OQ-05).')).toEqual(['FT-06.2', 'EP-06', 'US-06.2.1', 'OQ-05'])
    expect(linkTargets('FT-06.2.1 is not a feature, nor US-06.2 a story, nor XUS-06.1.1 or US-06.1.1a an ID')).toEqual([])
  })

  it('skips code spans and fenced blocks, and a link’s own words', () => {
    expect(linkTargets('`US-01.1.1` and\n\n```\nUS-01.1.2\n```\n\n[see US-01.1.3](US-01.1.4)')).toEqual(['US-01.1.4'])
  })

  it('treats any ID-shaped href as a link, so a malformed one is caught', () => {
    expect(mentions('[x](US-6.1) and [site](https://example.com)')).toEqual([{ id: 'US-6.1', bare: false }])
  })

  it('reduces links to their words', () => {
    expect(plainText('the [prepaid set](US-06.1.1) and ![shot](a.png)')).toBe('the prepaid set and shot')
  })
})

describe('pastedTarget', () => {
  it('reads a bare ID or a board link', () => {
    expect(pastedTarget(' US-06.1.1 ')).toBe('US-06.1.1')
    expect(pastedTarget('http://localhost:5180/#/board?item=US-06.1.1')).toBe('US-06.1.1')
    expect(pastedTarget('http://localhost:5180/#/questions?question=OQ-25&edit=OQ-25')).toBe('OQ-25')
  })

  it('leaves anything else to paste as text', () => {
    expect(pastedTarget('see US-06.1.1')).toBeNull()
    expect(pastedTarget('https://example.com/?item=nope')).toBeNull()
    expect(pastedTarget('')).toBeNull()
    expect(isRecordId('US-06.1')).toBe(false)
  })
})

/** Link the selection in `text`, where « and » mark it; return the result the same way. */
const run = (text: string, id = 'US-06.1.1', title = 'Tick codes or groups') => {
  const start = text.indexOf('«')
  const end = text.indexOf('»') - 1
  const value = text.replace('«', '').replace('»', '')
  const e = linkSelection(value, start, end, id, title)
  if (!e) return null
  const out = value.slice(0, e.from) + e.insert + value.slice(e.to)
  return out.slice(0, e.selStart) + '«' + out.slice(e.selStart, e.selEnd) + '»' + out.slice(e.selEnd)
}

describe('linkSelection', () => {
  it('links the selected words and puts the caret after the link', () => {
    expect(run("the anaesthetist's «prepaid set» here")).toBe("the anaesthetist's [prepaid set](US-06.1.1)«» here")
  })

  it('keeps whitespace at either end outside the link', () => {
    expect(run('the « prepaid set » here')).toBe('the  [prepaid set](US-06.1.1)«»  here')
  })

  it('inserts the title, selected, when nothing is selected', () => {
    expect(run('see «» for more')).toBe('see [«Tick codes or groups»](US-06.1.1) for more')
  })

  it('retargets a link the selection sits in', () => {
    expect(run('the [prep«aid» set](US-01.1.1) here')).toBe('the [«prepaid set»](US-06.1.1) here')
    expect(run('the «[prepaid set](US-01.1.1)» here')).toBe('the [«prepaid set»](US-06.1.1) here')
  })

  it('does not retarget a link the caret only touches', () => {
    expect(run('«»[a](US-01.1.1)')).toBe('[«Tick codes or groups»](US-06.1.1)[a](US-01.1.1)')
  })

  it('refuses text that cannot be a link’s words', () => {
    expect(run('«one\n\ntwo»')).toBeNull()
    expect(run('«a [b](US-01.1.1) c»')).toBeNull()
  })
})

describe('relatedFor', () => {
  const recs = (items: Item[]) => Object.fromEntries(items.map((it) => [it.id, { data: it, rev: 'r' } as Rev<Item>]))
  const epic = item({ id: 'EP-01', type: 'epic', description: 'Covers US-01.1.1.' })
  const feature = item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' })

  it('shows a relation on both cards, and mentions from other cards', () => {
    const a = item({ id: 'US-01.1.1', parent: 'FT-01.1', related: ['US-01.1.2'] })
    const b = item({ id: 'US-01.1.2', parent: 'FT-01.1', description: 'Needs [the rule](US-01.1.1).' })
    const c = item({ id: 'US-01.1.3', parent: 'FT-01.1', notes: 'See US-01.1.1 and US-01.1.3.' })
    const index = buildIndex(recs([epic, feature, a, b, c]), {})
    const ids = (list: Item[]) => list.map((i) => i.id)

    // b mentions a but is already related; the epic mentions a but is its lineage.
    expect(ids(relatedFor(index, a).related)).toEqual(['US-01.1.2'])
    expect(ids(relatedFor(index, a).mentionedIn)).toEqual(['US-01.1.3'])
    expect(ids(relatedFor(index, b).related)).toEqual(['US-01.1.1'])
    // A card never mentions itself; a parent's children list already shows its stories.
    expect(ids(relatedFor(index, c).mentionedIn)).toEqual([])
    expect(ids(relatedFor(index, epic).mentionedIn)).toEqual([])
  })
})

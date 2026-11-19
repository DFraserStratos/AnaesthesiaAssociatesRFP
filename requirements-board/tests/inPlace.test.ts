/** In-place record edits (B05: R-37, REQ-09 to REQ-11): a save changes only the lines it means to. */
import { describe, expect, it } from 'vitest'
import { parseArtifact, parseItem, parseQuestion, serialiseItem, withArtifactDetails } from '../shared/files.ts'
import { LossyEditError, editArtifactText, editItemText, editQuestionText } from '../shared/inPlace.ts'
import type { Item } from '../shared/types.ts'

/** The lines of `after` that differ from `before`, by position (both must have the same line count). */
function changedLines(before: string, after: string): string[] {
  const a = before.split('\n')
  const b = after.split('\n')
  expect(b.length).toBe(a.length)
  return b.filter((l, i) => l !== a[i])
}

const SIDECAR = `---
id: AR-09
title: Pricing flow   # agent note
kind: diagram
status: Current
components: [Billing, Scheduling]
sources:
  - RFP p.12
cited_as:
  as: RFP
  page_offset: 1
  pageoffset: 2
file: artifacts/files/AR-09.svg
regions:
  - id: tiers
    name: Tiers
    around: [Tier]
    pad: wide
    colour: red   # a key the board does not know
  - just a string row
steps:
  - id: s1
    name: Start
    shine: true
    moves:
      - from: a
        to: b
        speed: 2
# a comment before an unknown key
owner_note: keep me
---

The description.

## Source

Some legend prose.

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

More prose.

\`\`\`text
not a diagram
\`\`\`
`

describe('artifact details saved in place (R-37)', () => {
  it('a title change rewrites only the title, keeping its comment', () => {
    const next = withArtifactDetails(parseArtifact(SIDECAR), { title: 'Pricing flow v2' })
    const out = editArtifactText(SIDECAR, next)
    expect(changedLines(SIDECAR, out)).toEqual(['title: Pricing flow v2   # agent note'])
  })

  it('every editable detail at once changes only those keys and the description', () => {
    const next = withArtifactDetails(parseArtifact(SIDECAR), {
      kind: 'flow',
      status: 'Retired',
      supersededBy: 'AR-10',
      date: '2026-10-01',
      author: 'Sam',
      components: ['Billing'],
      sources: ['RFP p.13'],
      description: 'A new description.\n\nTwo paragraphs.',
    })
    const out = editArtifactText(SIDECAR, next)
    // Untouched, byte for byte: cited_as (a mapping, with a mistyped key), file, regions and steps
    // with their unknown keys, the string row, `pad: wide`, the comments, and the whole Source section.
    const keep = (from: string, to: string) => SIDECAR.slice(SIDECAR.indexOf(from), SIDECAR.indexOf(to))
    expect(out).toContain(keep('cited_as:', '---\n\nThe description.'))
    expect(out).toContain(SIDECAR.slice(SIDECAR.indexOf('## Source')))
    expect(out).toContain('title: Pricing flow   # agent note')
    expect(out).toContain('components: [Billing]\n') // a flow list stays a flow list
    expect(out).toMatch(/status: Retired\nsuperseded_by: AR-10\ndate: 2026-10-01\nauthor: Sam\ncomponents/)
    const back = parseArtifact(out)
    expect(back).toMatchObject({ kind: 'flow', status: 'Retired', supersededBy: 'AR-10', date: '2026-10-01', author: 'Sam', description: 'A new description.\n\nTwo paragraphs.' })
  })

  it('an unchanged save returns the file as it is', () => {
    const next = withArtifactDetails(parseArtifact(SIDECAR), { title: 'Pricing flow' })
    expect(editArtifactText(SIDECAR, next)).toBe(SIDECAR)
  })

  it('refuses, rather than writes, a change it cannot make without losing data', () => {
    // A flow-mapping frontmatter cannot be spliced, and the canonical form would drop the mapping cited_as.
    const flow = '---\n{ id: AR-09, title: Old, kind: diagram, cited_as: { as: RFP } }\n---\n\nText.\n'
    const next = withArtifactDetails(parseArtifact(flow), { title: 'New' })
    expect(() => editArtifactText(flow, next)).toThrow(LossyEditError)
    expect(() => editArtifactText(flow, next)).toThrow(/"cited_as"/)
  })

  it('never edits the Source section', () => {
    const a = parseArtifact(SIDECAR)
    expect(() => editArtifactText(SIDECAR, { ...a, source: 'flowchart TD\n  X' })).toThrow(/never edits the Source/)
  })
})

const HAND = `---
# written by an agent
id: US-01.1.6
type: story
parent: FT-01.1
title: "Bulk accept: slots"
status: 3
components: [Scheduling]
sources: ["RFP p.9", 'Notes 2026-10-01 #3']
order: 6
reviewer: Sam   # not a board key
images: []
---
Lead paragraph,
two lines.

## Notes

A note.

## Acceptance criteria

- one
- two
`

const edit = (text: string, patch: Partial<Item>) => editItemText(text, { ...parseItem(text), ...patch })

describe('item saves in place (REQ-09, REQ-11)', () => {
  it('a description change touches only the lead', () => {
    const out = edit(HAND, { description: 'One line now.' })
    expect(out).toBe(HAND.replace('Lead paragraph,\ntwo lines.\n\n', '\nOne line now.\n\n'))
  })

  it('keeps sections in the order the author wrote them', () => {
    const out = edit(HAND, { notes: 'A changed note.' })
    expect(out).toBe(HAND.replace('A note.', 'A changed note.'))
  })

  it('removes an emptied section, and adds a new one where the board puts it', () => {
    expect(edit(HAND, { notes: '' })).toBe(HAND.replace('## Notes\n\nA note.\n\n', ''))
    const out = edit(HAND, { technical: 'How.' })
    expect(parseItem(out).technical).toBe('How.')
    expect(out).toContain('## Acceptance criteria\n\n- one\n- two\n\n## Technical discussion\n\nHow.\n')
    expect(out.startsWith(HAND.slice(0, HAND.indexOf('## Acceptance')))).toBe(true)
  })

  it('a field change rewrites only its key; a new key goes after its neighbour in the board order', () => {
    expect(changedLines(HAND, edit(HAND, { title: 'Bulk accept slots' }))).toEqual(['title: Bulk accept slots'])
    expect(changedLines(HAND, edit(HAND, { status: '4' }))).toEqual(['status: 4'])
    expect(edit(HAND, { components: ['Scheduling', 'Billing'] })).toBe(HAND.replace('[Scheduling]', '[Scheduling, Billing]'))
    expect(edit(HAND, { swimlane: 'MVP' })).toBe(HAND.replace('order: 6\n', 'order: 6\nswimlane: MVP\n'))
    expect(edit(HAND, { parent: null })).toBe(HAND.replace('parent: FT-01.1\n', ''))
  })

  it('keeps the agent comment, the quoting and the unknown key exactly', () => {
    const out = edit(HAND, { order: 7, description: 'x' })
    for (const line of ['# written by an agent', 'title: "Bulk accept: slots"', `sources: ["RFP p.9", 'Notes 2026-10-01 #3']`, 'reviewer: Sam   # not a board key']) expect(out).toContain(line)
  })

  it('keeps a byte-order mark out of the text (writeAtomic adds it back) and CRLF line endings', () => {
    const crlf = HAND.replace(/\n/g, '\r\n')
    const out = editItemText(crlf, { ...parseItem(crlf), title: 'New', notes: 'Changed.' })
    expect(out).not.toMatch(/[^\r]\n/)
    expect(out.replace(/\r\n/g, '\n')).toBe(edit(HAND, { title: 'New', notes: 'Changed.' }))
  })

  it('on a canonical file the result is exactly the canonical form', () => {
    const canonical = serialiseItem(parseItem(HAND))
    const next = { ...parseItem(canonical), title: 'T', related: ['US-01.1.1'], notes: '', technical: 'Tech.', images: [{ src: 'assets/US-01.1.6/a.png', viewport: 'desktop' as const }] }
    expect(editItemText(canonical, next)).toBe(serialiseItem(next))
  })

  it('image keys the board does not know survive a save that leaves images alone', () => {
    const text = HAND.replace('images: []', 'images:\n  - src: assets/US-01.1.6/a.png\n    viewport: mobile\n    zoom: 2')
    const out = edit(text, { title: 'Again' })
    expect(out).toContain('    zoom: 2')
  })
})

describe('hand-written shapes the review found (B05 review)', () => {
  it('a title edit leaves a body with a repeated heading exactly as written', () => {
    const text = `---\nid: US-01.1.6\ntype: story\ntitle: T\nstatus: 3\n---\n\nLead.\n\n## Notes\n\nn1\n\n## Acceptance criteria\n\n- a\n\n## Notes\n\ndup\n`
    expect(editItemText(text, { ...parseItem(text), title: 'New' })).toBe(text.replace('title: T', 'title: New'))
  })

  it('an empty value keeps the comment after it when it gets a value', () => {
    const text = HAND.replace('parent: FT-01.1', 'parent: # none yet')
    expect(edit(text, { parent: 'FT-01.2' })).toBe(text.replace('parent: # none yet', 'parent: FT-01.2 # none yet'))
    expect(edit(text, { title: 'Other' })).toContain('parent: # none yet')
  })

  it('a file the splice cannot handle (anchors) still saves when nothing is lost, rather than being refused', () => {
    const text = `---\nid: US-01.1.6\ntype: story\ntitle: &t T\nsources: [*t]\nstatus: 3\n---\n\nLead.\n`
    const out = edit(text, { title: 'New' })
    expect(parseItem(out)).toMatchObject({ title: 'New', sources: ['T'], description: 'Lead.' })
  })
})

describe('question saves in place', () => {
  const Q = `---\nid: OQ-07\nkind: question\ntitle: Who signs?   # ask Greg\nstatus: 1\nowner: ""\naffects: [US-01.1.1]\nsources: []\n---\n\nWho signs off?\n`
  it('an answer is added after the question, and the rest is untouched', () => {
    const out = editQuestionText(Q, { ...parseQuestion(Q), answer: 'Greg does.', status: '3' })
    expect(out).toBe(Q.replace('status: 1', 'status: 3') + '\n## Answer\n\nGreg does.\n')
    expect(parseQuestion(out)).toMatchObject({ answer: 'Greg does.', status: '3', title: 'Who signs?' })
  })
})

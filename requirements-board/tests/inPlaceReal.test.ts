/**
 * In-place edits over every record file in the real catalogue (B05: R-37, REQ-09): each editable field
 * changed alone leaves every other byte as it was. Reads the catalogue; writes nothing.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.setConfig({ testTimeout: 120_000 }) // thousands of edits; the machine is often loaded
import { parseArtifact, parseItem, parseQuestion, serialiseArtifact, serialiseItem, serialiseQuestion, withArtifactDetails } from '../shared/files.ts'
import { editArtifactText, editItemText, editQuestionText } from '../shared/inPlace.ts'
import type { Artifact, Item, Question } from '../shared/types.ts'
import { REQUIREMENTS_DIR } from '../server/catalogueFs.ts'

const files = (dir: string) =>
  readdirSync(join(REQUIREMENTS_DIR, dir))
    .filter((n) => n.endsWith('.md') && !n.startsWith('.'))
    .map((n) => ({ name: n, text: readFileSync(join(REQUIREMENTS_DIR, dir, n), 'utf8').replace(/^﻿/, '') }))

/** The frontmatter and the body: `---` ... `---`, then the rest. */
const halves = (text: string) => {
  const end = text.indexOf('\n---', 3)
  return { front: text.slice(0, end), body: text.slice(text.indexOf('\n', end + 1) + 1) }
}

const itemChanges = (it: Item): Partial<Item>[] => [
  { title: `${it.title} (edited)` },
  { description: `${it.description}\n\nAn added paragraph.` },
  { notes: it.notes ? '' : 'A new note.' },
  { acceptance: it.acceptance ? `${it.acceptance}\n- one more` : '- a criterion' },
  { swimlane: it.swimlane ? null : 'Some lane' },
  { status: it.status === '2' ? '3' : '2' },
  { components: [...it.components, 'Another area'] },
  { order: it.order + 1 },
  { related: it.related.length ? [] : ['EP-01'] },
  { artifacts: [...it.artifacts, 'AR-01'] },
]

describe('every story edits in place (canonical files give the canonical form)', () => {
  const all = files('stories')
  it(`reads ${all.length} story files`, () => expect(all.length).toBeGreaterThan(0))
  it('each field changed alone, with LF and with CRLF line endings', () => {
    const bad: string[] = []
    for (const { name, text } of all) {
      const it = parseItem(text)
      const canonical = serialiseItem(it) === text
      for (const patch of itemChanges(it)) {
        const next = { ...it, ...patch }
        const out = editItemText(text, next)
        expect(parseItem(out)).toEqual(parseItem(serialiseItem(next)))
        if (canonical && out !== serialiseItem(next)) bad.push(`${name} ${Object.keys(patch)[0]}`)
        const crlf = text.replace(/\n/g, '\r\n')
        if (editItemText(crlf, next).replace(/\r\n/g, '\n') !== out) bad.push(`${name} ${Object.keys(patch)[0]} (CRLF)`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('every question edits in place', () => {
  const all = files('questions')
  it(`each field changed alone in ${all.length} question files`, () => {
    const bad: string[] = []
    for (const { name, text } of all) {
      const q = parseQuestion(text)
      const canonical = serialiseQuestion(q) === text
      const patches: Partial<Question>[] = [{ title: `${q.title}?` }, { answer: q.answer ? '' : 'An answer.' }, { question: `${q.question}\n\nMore.` }, { owner: q.owner ? '' : 'Sam' }, { affects: [...q.affects, 'EP-01'] }]
      for (const patch of patches) {
        const next = { ...q, ...patch }
        const out = editQuestionText(text, next)
        expect(parseQuestion(out)).toEqual(parseQuestion(serialiseQuestion(next)))
        if (canonical && out !== serialiseQuestion(next)) bad.push(`${name} ${Object.keys(patch)[0]}`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('every artifact sidecar edits in place (R-37)', () => {
  const all = files('artifacts')
  it(`each editable detail changed alone in ${all.length} sidecars keeps every other line`, () => {
    const bad: string[] = []
    for (const { name, text } of all) {
      const a = parseArtifact(text)
      const canonical = serialiseArtifact(a) === text
      const patches: Record<string, unknown>[] = [
        { title: `${a.title} (edited)` },
        { description: `${a.description}\n\nAn added paragraph.` },
        { author: a.author ? '' : 'Someone' },
        { date: a.date ? '' : '2026-01-02' },
        { components: [...a.components, 'Another area'] },
        { sources: [...a.sources, 'RFP p.1'] },
        { status: 'Retired', supersededBy: 'AR-01' },
        { kind: a.kind === 'diagram' ? 'document' : 'diagram' },
      ]
      for (const patch of patches) {
        const next: Artifact = withArtifactDetails(a, patch)
        const out = editArtifactText(text, next)
        expect(parseArtifact(out)).toEqual(parseArtifact(serialiseArtifact(next)))
        if (canonical && out !== serialiseArtifact(next)) bad.push(`${name} ${Object.keys(patch)[0]}`)
        const before = halves(text)
        const after = halves(out)
        // The description is the only body text the board writes: everything from the Source heading on is untouched.
        const src = (b: string) => (b.includes('\n## Source') ? b.slice(b.indexOf('\n## Source')) : '')
        if (src(after.body) !== src(before.body)) bad.push(`${name} ${Object.keys(patch)[0]}: Source changed`)
        if (!('description' in patch) && after.body !== before.body) bad.push(`${name} ${Object.keys(patch)[0]}: body changed`)
        // Only the lines of the keys changed: the rest of the frontmatter, in order, is the old frontmatter's lines minus those keys'.
        if ('title' in patch) {
          const diff = after.front.split('\n').filter((l, i) => l !== before.front.split('\n')[i])
          if (diff.length !== 1 || !diff[0]!.startsWith('title: ')) bad.push(`${name} title: ${JSON.stringify(diff)}`)
        }
      }
    }
    expect(bad).toEqual([])
  })
})

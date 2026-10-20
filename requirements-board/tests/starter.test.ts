import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { loadCatalogue } from '../server/catalogueFs.ts'
import { parseItem, parseQuestion, serialiseItem, serialiseQuestion } from '../shared/files.ts'

// The starter catalogue and "This repo" sections the kit export ships (scripts/export-kit.ts).
const starter = join(import.meta.dirname, '..', 'starter')
const live = join(import.meta.dirname, '..', 'requirements')

describe.runIf(existsSync(starter))('kit starter', () => {
  const dir = mkdtempSync(join(tmpdir(), 'starter-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('is a catalogue that passes the check with no warnings', () => {
    cpSync(join(starter, 'requirements'), dir, { recursive: true })
    cpSync(join(live, 'SCHEMA.md'), join(dir, 'SCHEMA.md'))
    const { issues } = loadCatalogue(dir)
    expect(issues).toEqual([])
  })

  it('is written exactly as the board writes it, so the first save changes nothing else', () => {
    const req = join(starter, 'requirements')
    for (const f of readdirSync(join(req, 'stories'))) {
      const text = readFileSync(join(req, 'stories', f), 'utf8')
      expect(serialiseItem(parseItem(text)), f).toBe(text)
    }
    for (const f of readdirSync(join(req, 'questions'))) {
      const text = readFileSync(join(req, 'questions', f), 'utf8')
      expect(serialiseQuestion(parseQuestion(text)), f).toBe(text)
    }
  })

  it('has a starter "This repo" section for every skill that has one', () => {
    const skills = join(import.meta.dirname, '..', 'agent', 'skills')
    for (const skill of readdirSync(skills)) {
      const file = join(skills, skill, 'SKILL.md')
      if (!existsSync(file) || !/^## This repo\s*$/m.test(readFileSync(file, 'utf8'))) continue
      expect(existsSync(join(starter, 'this-repo', `${skill}.md`)), skill).toBe(true)
      expect(readFileSync(join(starter, 'this-repo', `${skill}.md`), 'utf8')).toMatch(/^## This repo\n/)
    }
  })
})

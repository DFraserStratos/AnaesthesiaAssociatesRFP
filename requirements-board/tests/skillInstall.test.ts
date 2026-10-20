import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { installStatus, linkSkills } from '../server/skillInstall.ts'

// A repo with the board's agent folder dropped in, and a skill of its own named like one of ours.
const repo = mkdtempSync(join(tmpdir(), 'skills-'))
const board = 'requirements-board'
cpSync(join(import.meta.dirname, '..', 'agent'), join(repo, board, 'agent'), { recursive: true })
mkdirSync(join(repo, '.claude', 'skills', 'svg-diagram'), { recursive: true })
writeFileSync(join(repo, '.claude', 'skills', 'svg-diagram', 'SKILL.md'), 'theirs\n')
afterAll(() => rmSync(repo, { recursive: true, force: true }))
const state = (name: string) => installStatus(repo, board).skills.find((s) => s.name === name)?.state

describe('install-skills', () => {
  it('copies the skills beside the repo’s own, marks each copy, and leaves a same-named skill alone', () => {
    expect(state('update-requirements')).toBe('missing')
    const { skipped } = linkSkills(repo, board)
    expect(skipped).toEqual(['.claude/skills/svg-diagram (already there and not the board\'s)'])
    expect(state('update-requirements')).toBe('current')
    expect(state('svg-diagram')).toBe('foreign')
    expect(readFileSync(join(repo, '.claude', 'skills', 'svg-diagram', 'SKILL.md'), 'utf8')).toBe('theirs\n')
    expect(readFileSync(join(repo, '.claude', 'skills', 'update-requirements', 'SKILL.md'), 'utf8')).toContain('> Installed copy.')
  })

  it('sees an edited copy as outdated, and the next install puts the source back', () => {
    const copy = join(repo, '.claude', 'skills', 'update-requirements', 'SKILL.md')
    appendFileSync(copy, 'EDITED-IN-THE-COPY\n')
    expect(state('update-requirements')).toBe('outdated')
    linkSkills(repo, board)
    expect(readFileSync(copy, 'utf8')).not.toContain('EDITED-IN-THE-COPY')
  })

  it('switches to links when asked, and back', () => {
    linkSkills(repo, board, 'link')
    expect(installStatus(repo, board).mode).toBe('link')
    linkSkills(repo, board)
    expect(installStatus(repo, board).mode).toBe('copy')
    expect(state('svg-diagram')).toBe('foreign')
  })
})

import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { isJunk } from '../server/junk.ts'
import type * as Install from '../server/skillInstall.ts'

// SKILL_INSTALL_UNDER_TEST points at another copy of skillInstall.ts (the fail-first proof runs the old one).
const { linkSkills, installMode } = (await import(process.env.SKILL_INSTALL_UNDER_TEST ? pathToFileURL(process.env.SKILL_INSTALL_UNDER_TEST).href : '../server/skillInstall.ts')) as typeof Install

const board = 'requirements-board'
const roots: string[] = []
afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })))

/** A repo with the board's agent folder dropped in, and a skill of its own named like one of ours. */
function makeRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'skills-'))
  roots.push(repo)
  cpSync(join(import.meta.dirname, '..', 'agent'), join(repo, board, 'agent'), { recursive: true, filter: (s) => !s.includes('__pycache__') })
  mkdirSync(join(repo, '.claude', 'skills', 'svg-diagram'), { recursive: true })
  writeFileSync(join(repo, '.claude', 'skills', 'svg-diagram', 'SKILL.md'), 'theirs\n')
  return repo
}
const skill = (repo: string, name: string) => join(repo, '.claude', 'skills', name)
const workflow = (repo: string, name: string) => join(repo, '.claude', 'workflows', name)
const isLink = (p: string) => {
  try {
    return lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}
const there = (p: string) => existsSync(p) || isLink(p)
/** Every path under `.claude/`, links listed but not followed. */
const tree = (repo: string) => {
  const out: string[] = []
  const walk = (dir: string, rel: string) => {
    for (const f of readdirSync(dir).sort()) {
      const p = join(dir, f)
      out.push(`${rel}${f}${isLink(p) ? ' ->' : ''}`)
      if (!isLink(p) && lstatSync(p).isDirectory()) walk(p, `${rel}${f}/`)
    }
  }
  walk(join(repo, '.claude'), '')
  return out
}

// Each test copies the whole agent folder, which takes seconds under load.
describe('install-skills', { timeout: 60_000 }, () => {
  let repo: string
  beforeEach(() => {
    repo = makeRepo()
  })

  it('copies the skills beside the repo’s own, marks each copy, and leaves a same-named skill alone', () => {
    const { skipped } = linkSkills(repo, board)
    expect(skipped).toEqual(['.claude/skills/svg-diagram (already there and not the board\'s)'])
    expect(readFileSync(join(skill(repo, 'svg-diagram'), 'SKILL.md'), 'utf8')).toBe('theirs\n')
    expect(readFileSync(join(skill(repo, 'update-requirements'), 'SKILL.md'), 'utf8')).toContain('> Installed copy.')
  })

  it('puts an edited copy back from the source', () => {
    linkSkills(repo, board)
    const copy = join(skill(repo, 'update-requirements'), 'SKILL.md')
    writeFileSync(copy, readFileSync(copy, 'utf8') + 'EDITED-IN-THE-COPY\n')
    linkSkills(repo, board)
    expect(readFileSync(copy, 'utf8')).not.toContain('EDITED-IN-THE-COPY')
  })

  for (const mode of ['copy', 'link'] as const) {
    it(`removes, in ${mode} mode, a skill and a workflow the board no longer has, and nothing foreign (R-129)`, () => {
      linkSkills(repo, board, mode)
      // The board renames a skill and drops a workflow.
      renameSync(join(repo, board, 'agent', 'skills', 'add-artifact'), join(repo, board, 'agent', 'skills', 'add-artifact-2'))
      rmSync(join(repo, board, 'agent', 'workflows', 'link-requirements.js'))
      mkdirSync(skill(repo, 'their-own'))
      writeFileSync(join(skill(repo, 'their-own'), 'SKILL.md'), 'theirs\n')
      writeFileSync(workflow(repo, 'their-flow.js'), '// theirs\n')
      const report = linkSkills(repo, board, mode) as Install.LinkReport
      expect(report.removed?.sort()).toEqual(['.claude/skills/add-artifact', '.claude/workflows/link-requirements.js'])
      expect(there(skill(repo, 'add-artifact'))).toBe(false)
      expect(there(workflow(repo, 'link-requirements.js'))).toBe(false)
      expect(there(skill(repo, 'add-artifact-2'))).toBe(true)
      expect(readFileSync(join(skill(repo, 'their-own'), 'SKILL.md'), 'utf8')).toBe('theirs\n')
      expect(readFileSync(workflow(repo, 'their-flow.js'), 'utf8')).toBe('// theirs\n')
      expect(readFileSync(join(skill(repo, 'svg-diagram'), 'SKILL.md'), 'utf8')).toBe('theirs\n')
    })

    it(`keeps owning a ${mode} skill folder that gains a .DS_Store, and refreshes it (R-130)`, () => {
      linkSkills(repo, board, mode)
      writeFileSync(join(skill(repo, 'add-artifact'), '.DS_Store'), 'x')
      const { skipped } = linkSkills(repo, board, mode)
      expect(skipped).not.toContain('.claude/skills/add-artifact (already there and not the board\'s)')
      expect(there(join(skill(repo, 'add-artifact'), 'SKILL.md'))).toBe(true)
    })

    it(`never installs __pycache__ or dotfiles in ${mode} mode (R-131)`, () => {
      const src = join(repo, board, 'agent', 'skills', 'add-artifact')
      mkdirSync(join(src, '__pycache__'))
      writeFileSync(join(src, '__pycache__', 'x.cpython-312.pyc'), 'x')
      writeFileSync(join(src, '.DS_Store'), 'x')
      linkSkills(repo, board, mode)
      expect(there(join(skill(repo, 'add-artifact'), '__pycache__'))).toBe(false)
      expect(there(join(skill(repo, 'add-artifact'), '.DS_Store'))).toBe(false)
      expect(there(join(skill(repo, 'add-artifact'), 'SKILL.md'))).toBe(true)
    })

    it(`changes nothing when run twice in ${mode} mode`, () => {
      linkSkills(repo, board, mode)
      const before = tree(repo)
      const again = linkSkills(repo, board, mode) as Install.LinkReport
      expect(again.removed ?? []).toEqual([])
      expect(tree(repo)).toEqual(before)
    })
  }

  it('keeps the mode in use when none is given, and a fresh repo gets copies (R-155)', () => {
    expect(installMode(repo, board)).toBeNull()
    linkSkills(repo, board, 'link')
    expect(installMode(repo, board)).toBe('link')
    linkSkills(repo, board)
    expect(isLink(join(skill(repo, 'add-artifact'), 'SKILL.md'))).toBe(true)
    expect(there(join(repo, '.claude', 'requirements-board.json'))).toBe(false)
    linkSkills(repo, board, 'copy')
    expect(installMode(repo, board)).toBe('copy')
    linkSkills(repo, board)
    expect(isLink(join(skill(repo, 'add-artifact'), 'SKILL.md'))).toBe(false)
  })

  it('leaves nothing of the other mode behind when switching', () => {
    linkSkills(repo, board, 'copy')
    linkSkills(repo, board, 'link')
    expect(tree(repo).filter((p) => !p.startsWith('skills/svg-diagram')).every((p) => p.endsWith(' ->') || !p.includes('/') || /^skills\/[^/]+$/.test(p))).toBe(true)
    expect(there(join(repo, '.claude', 'requirements-board.json'))).toBe(false)
    linkSkills(repo, board, 'copy')
    expect(tree(repo).some((p) => p.endsWith(' ->'))).toBe(false)
  })

  it('shares one junk rule with the kit export (R-131)', () => {
    // Both decide what ships or installs through server/junk.ts, so the two cannot drift again.
    const install = readFileSync(join(import.meta.dirname, '..', 'server', 'skillInstall.ts'), 'utf8')
    const exporter = join(import.meta.dirname, '..', 'scripts', 'export-kit.ts')
    expect(install).toMatch(/from '\.\/junk\.ts'/)
    if (existsSync(exporter)) expect(readFileSync(exporter, 'utf8')).toMatch(/from '\.\.\/server\/junk\.ts'/)
    for (const [name, junk] of [['.DS_Store', true], ['__pycache__', true], ['x.cpython-312.pyc', true], ['.swp', true], ['.gitignore', false], ['SKILL.md', false], ['tools', false]] as const) {
      expect(isJunk(name), name).toBe(junk)
    }
  })

  it('installs a new source file into a linked skill on the next run', () => {
    linkSkills(repo, board, 'link')
    writeFileSync(join(repo, board, 'agent', 'skills', 'add-artifact', 'reference.md'), 'new\n')
    linkSkills(repo, board)
    expect(readFileSync(join(skill(repo, 'add-artifact'), 'reference.md'), 'utf8')).toBe('new\n')
  })
})

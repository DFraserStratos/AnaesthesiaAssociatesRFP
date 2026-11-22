/**
 * `kit:export` (R-05, R-31, R-149, R-153, R-154; D-09, accepted decision 29) on scratch repositories only:
 * a small synthetic board committed in a throwaway git repository, exported into throwaway folders. It
 * never points at this repository. EXPORT_KIT_UNDER_TEST runs another export-kit.ts in the scratch board
 * (the fail-first proof runs the pre-B14 one). Not part of the kit (the kit has no export).
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.setConfig({ testTimeout: 60_000 }) // each export starts node and git

const HERE = join(import.meta.dirname, '..')
const UNDER_TEST = process.env.EXPORT_KIT_UNDER_TEST ?? join(HERE, 'scripts', 'export-kit.ts')
const roots: string[] = []
afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })))

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com' } })
const put = (file: string, text: string) => {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}

/** A scratch folder `<tmp>/<outer>/<repo>` (so `..` from the repo root is a scratch folder too). */
function scratch() {
  const top = realpathSync(mkdtempSync(join(tmpdir(), 'kit-export-')))
  roots.push(top)
  return top
}

/** A git repository holding a small, committed board: one skill with a "This repo" block, a starter, a live catalogue. */
function sourceRepo() {
  const top = scratch()
  const root = join(top, 'outer', 'repo')
  const board = join(root, 'requirements-board')
  put(join(board, 'package.json'), JSON.stringify({ name: 'requirements-board', version: '9.9.9', type: 'module', scripts: { check: 'node scripts/check.ts', 'kit:export': 'node scripts/export-kit.ts' } }, null, 2) + '\n')
  put(join(board, 'CHANGELOG.md'), '# Changelog\n\n## 9.9.9\n\n- A test version.\n')
  put(join(board, 'README.md'), '# Board\n\nRun `npm run check`. The skill is in `agent/skills/demo/SKILL.md`.\n\n<!-- kit:omit -->\n## Sharing\n\n`npm run kit:export` and `starter/deny.txt` live only here.\n<!-- /kit:omit -->\n')
  put(join(board, '.gitignore'), 'node_modules\n/.pdf-facts/\n/.history/\n')
  put(join(board, 'agent', 'skills', 'demo', 'SKILL.md'), '---\nname: demo\n---\n\n# Demo\n\n## This repo\n\n- Live project facts.\n\n## Steps\n\n1. Do it.\n')
  put(join(board, 'starter', 'this-repo', 'demo.md'), '## This repo\n\n- <TODO: your facts>\n')
  put(join(board, 'starter', 'START-HERE.html'), '<p>Kit {{version}} · {{commit}}</p>\n<div>{{loop-svg}}</div>\n')
  cpSync(join(HERE, 'starter', 'deny.txt'), join(board, 'starter', 'deny.txt'))
  put(join(board, 'starter', 'requirements', 'stories', 'EP-01.md'), '---\nid: EP-01\ntitle: Starter epic\n---\n')
  put(join(board, 'starter', 'requirements', 'artifacts', 'files', 'AR-01.svg'), '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"><text>loop</text></svg>\n')
  put(join(board, 'starter', 'requirements', 'notes', 'README.md'), '# Notes\n\nNeutral folder guide.\n')
  put(join(board, 'starter', 'requirements', 'changes', 'README.md'), '# Changes\n\nNeutral folder guide.\n')
  put(join(board, 'requirements', 'SCHEMA.md'), '# Format\n\nStatuses are named by role.\n')
  put(join(board, 'requirements', 'notes', 'README.md'), '# Notes\n\nThe live guide, with a legacy table.\n')
  put(join(board, 'requirements', 'changes', 'README.md'), '# Changes\n')
  put(join(board, 'requirements', 'stories', 'EP-01.md'), '---\nid: EP-01\ntitle: Live project epic\n---\n')
  for (const f of ['scripts/userPath.ts', 'server/boardPaths.ts', 'server/junk.ts']) cpSync(join(HERE, f), join(board, f))
  cpSync(UNDER_TEST, join(board, 'scripts', 'export-kit.ts'))
  git(root, 'init', '-q')
  git(root, 'add', '-A')
  git(root, 'commit', '-q', '-m', 'board')
  return { top, root, board }
}

/** Run the export as `npm --prefix requirements-board run kit:export -- ...` from `from` would. */
function exportKit(board: string, from: string, ...args: string[]) {
  return spawnSync(process.execPath, [join(board, 'scripts', 'export-kit.ts'), ...args], {
    cwd: board,
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, INIT_CWD: from, npm_lifecycle_script: 'node scripts/export-kit.ts' },
  })
}

/** Every file and link under `dir`, with a hash of each, for "byte for byte unchanged". */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!existsSync(dir)) return out
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name)
      const r = rel ? `${rel}/${name}` : name
      const st = lstatSync(p)
      if (st.isSymbolicLink()) out[r] = `-> ${readlinkSync(p)}`
      else if (st.isDirectory()) {
        if (name !== '.git') walk(p, r)
      } else out[r] = createHash('sha256').update(readFileSync(p)).digest('hex')
    }
  }
  walk(dir, '')
  return out
}

describe('kit:export refuses a target that holds or is a live board (R-05)', () => {
  it('refuses the repo root itself (its requirements-board/ is the board), and changes nothing', () => {
    const { root, board } = sourceRepo()
    const before = snapshot(root)
    const r = exportKit(board, root, '--to', '.')
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/Refused/)
    expect(snapshot(root)).toEqual(before)
  })

  it('reads --to .. from the repo root, as npm --prefix runs it: never the board (R-31)', () => {
    const { root, board } = sourceRepo()
    const before = snapshot(root)
    const r = exportKit(board, root, '--to', '..')
    // `..` from the root is the scratch folder above it, which holds the repo: refused, the board untouched.
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/has other files and no requirements-board/)
    expect(snapshot(root)).toEqual(before)
  })

  it('reads a relative --to from the repo root, and a second export there does not nest (R-31)', () => {
    const { top, root, board } = sourceRepo()
    const out = join(top, 'outer', 'kit-out')
    expect(exportKit(board, join(top, 'outer'), '--to', 'kit-out').status).toBe(0)
    const again = exportKit(board, join(top, 'outer'), '--to', 'kit-out')
    expect(again.status, again.stderr).toBe(0)
    expect(existsSync(join(out, 'requirements-board', '.kit-export.json'))).toBe(true)
    expect(existsSync(join(out, 'requirements-board', 'kit-out'))).toBe(false)
    expect(existsSync(join(board, 'kit-out'))).toBe(false)
    expect(existsSync(join(root, 'kit-out'))).toBe(false)
  })

  it('--dry-run stages and checks, and writes nothing to the target', () => {
    const { top, root, board } = sourceRepo()
    const out = join(top, 'staging')
    const r = exportKit(board, root, '--to', out, '--dry-run')
    expect(r.status, r.stderr).toBe(0)
    expect(r.stdout).toMatch(/staged in/)
    expect(existsSync(out)).toBe(false)
  })

  it('refuses a folder inside the board, and a path spelled through a link to the repo root', () => {
    const { top, root, board } = sourceRepo()
    const before = snapshot(root)
    const inside = exportKit(board, root, '--to', 'requirements-board/kit-out')
    expect(inside.status).toBe(1)
    expect(inside.stderr).toMatch(/inside it/)
    symlinkSync(root, join(top, 'alias'))
    const linked = exportKit(board, root, '--to', join(top, 'alias'))
    expect(linked.status).toBe(1)
    expect(linked.stderr).toMatch(/Refused/)
    expect(snapshot(root)).toEqual(before)
  })

  it('refuses a folder holding another live board (no marker), byte for byte unchanged', () => {
    const { top, root, board } = sourceRepo()
    const other = join(top, 'adopter')
    put(join(other, 'requirements-board', 'requirements', 'stories', 'EP-01.md'), 'their work\n')
    put(join(other, 'requirements-board', '.links', 'current', 'x.verified.json'), '{}\n')
    const before = snapshot(other)
    const r = exportKit(board, root, '--to', other)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/not written by kit:export/)
    expect(snapshot(other)).toEqual(before)
  })

  it('replaces an untouched earlier kit, keeping its node_modules and the folder’s other files', () => {
    const { top, root, board } = sourceRepo()
    const out = join(top, 'staging')
    expect(exportKit(board, root, '--to', out).status).toBe(0)
    put(join(out, 'requirements-board', 'node_modules', 'dep', 'index.js'), 'kept\n')
    put(join(out, 'NOTES.txt'), 'mine\n')
    writeFileSync(join(out, 'requirements-board', '.DS_Store'), 'x')
    const again = exportKit(board, root, '--to', out)
    expect(again.status, again.stderr).toBe(0)
    expect(readFileSync(join(out, 'requirements-board', 'node_modules', 'dep', 'index.js'), 'utf8')).toBe('kept\n')
    expect(readFileSync(join(out, 'NOTES.txt'), 'utf8')).toBe('mine\n')
    expect(readdirSync(out).filter((f) => f.startsWith('.requirements-board'))).toEqual([])
  })

  it('is not blocked by a swap folder an interrupted export left behind', () => {
    const { top, root, board } = sourceRepo()
    const out = join(top, 'staging')
    put(join(out, '.requirements-board.incoming-4242', 'half.txt'), 'half written\n')
    const r = exportKit(board, root, '--to', out)
    expect(r.status, r.stderr).toBe(0)
    expect(existsSync(join(out, 'requirements-board', '.kit-export.json'))).toBe(true)
  })

  for (const [what, change] of [
    ['an edited catalogue', (kit: string) => writeFileSync(join(kit, 'requirements', 'stories', 'EP-01.md'), 'edited\n')],
    ['a journal from opening its board', (kit: string) => put(join(kit, '.history', 'EP-01.jsonl'), '{}\n')],
    ['a new file', (kit: string) => put(join(kit, 'requirements', 'stories', 'US-01.1.1.md'), 'new\n')],
    ['a missing marker', (kit: string) => rmSync(join(kit, '.kit-export.json'))],
  ] as const) {
    it(`refuses an earlier kit with ${what}, byte for byte unchanged`, () => {
      const { top, root, board } = sourceRepo()
      const out = join(top, 'staging')
      expect(exportKit(board, root, '--to', out).status).toBe(0)
      change(join(out, 'requirements-board'))
      const before = snapshot(out)
      const r = exportKit(board, root, '--to', out)
      expect(r.status).toBe(1)
      expect(r.stderr).toMatch(/Refused/)
      expect(snapshot(out)).toEqual(before)
    })
  }
})

describe('kit:export builds from committed files only (R-154, D-09)', () => {
  it('ships neither an untracked nor an ignored file, and records its commit', () => {
    const { top, root, board } = sourceRepo()
    put(join(board, 'agent', 'skills', 'demo', 'scratch-note.md'), 'an agent’s untracked scratch note\n')
    put(join(board, '.pdf-facts', 'cache.json'), '{}\n')
    const out = join(top, 'staging')
    const r = exportKit(board, root, '--to', out)
    expect(r.status, r.stderr).toBe(0)
    const kit = join(out, 'requirements-board')
    expect(existsSync(join(kit, 'agent', 'skills', 'demo', 'scratch-note.md'))).toBe(false)
    expect(existsSync(join(kit, '.pdf-facts'))).toBe(false)
    const marker = JSON.parse(readFileSync(join(kit, '.kit-export.json'), 'utf8')) as { commit: string; source: string; files: Record<string, string> }
    expect(marker.commit).toBe(git(root, 'rev-parse', 'HEAD').trim())
    expect(marker.source).toBe('HEAD')
    expect(Object.keys(marker.files)).toContain('requirements/stories/EP-01.md')
  })

  it('exports HEAD with a warning when a board file is edited, and the edit only with --uncommitted', () => {
    const { top, root, board } = sourceRepo()
    writeFileSync(join(board, 'README.md'), '# Board\n\nRun `npm run check`. Edited, not committed.\n')
    const head = exportKit(board, root, '--to', join(top, 'a'))
    expect(head.status, head.stderr).toBe(0)
    expect(head.stderr).toMatch(/uncommitted changes[\s\S]*README\.md/)
    expect(readFileSync(join(top, 'a', 'requirements-board', 'README.md'), 'utf8')).not.toContain('Edited')
    const wt = exportKit(board, root, '--to', join(top, 'b'), '--uncommitted')
    expect(wt.status, wt.stderr).toBe(0)
    expect(wt.stderr).toMatch(/working tree[\s\S]*README\.md/)
    expect(readFileSync(join(top, 'b', 'requirements-board', 'README.md'), 'utf8')).toContain('Edited')
  })

  it('ships the starter catalogue and folder guides, the starter "This repo" block, and leaves out marked passages', () => {
    const { top, root, board } = sourceRepo()
    const out = join(top, 'staging')
    expect(exportKit(board, root, '--to', out).status).toBe(0)
    const kit = join(out, 'requirements-board')
    expect(readFileSync(join(kit, 'requirements', 'stories', 'EP-01.md'), 'utf8')).toContain('Starter epic')
    expect(readFileSync(join(kit, 'requirements', 'notes', 'README.md'), 'utf8')).toContain('Neutral folder guide')
    expect(readFileSync(join(kit, 'agent', 'skills', 'demo', 'SKILL.md'), 'utf8')).toContain('<TODO: your facts>')
    expect(readFileSync(join(kit, 'README.md'), 'utf8')).not.toContain('kit:export')
    expect(readFileSync(join(kit, 'START-HERE.html'), 'utf8')).toContain(`Kit 9.9.9 · ${git(root, 'rev-parse', 'HEAD').trim().slice(0, 12)}`)
    expect(JSON.parse(readFileSync(join(kit, 'package.json'), 'utf8')).scripts['kit:export']).toBeUndefined()
  })
})

describe('kit:export checks what ships (R-149, R-153, R-154)', () => {
  const failsWith = (file: string, text: string, problem: RegExp) => {
    const { top, root, board } = sourceRepo()
    put(join(board, file), text)
    git(root, 'add', '-A')
    git(root, 'commit', '-q', '-m', 'plant')
    const out = join(top, 'staging')
    const r = exportKit(board, root, '--to', out)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(problem)
    expect(existsSync(out)).toBe(false)
  }

  it('fails on a person the project names', () => failsWith('agent/skills/demo/SKILL.md', '# Demo\n\nAsk Vanessa first.\n', /Vanessa/))
  it('fails on a status pinned to the project’s number', () => failsWith('requirements/SCHEMA.md', '# Format\n\nSet it to Agreed (4 here).\n', /4 here/))
  it('fails on a script the kit does not have', () => failsWith('README.md', '# Board\n\nRun `npm run publish-site`.\n', /npm run publish-site/))
  it('fails on a board file the kit does not have', () => failsWith('README.md', '# Board\n\nSee `e2e/missing.spec.ts`.\n', /e2e\/missing\.spec\.ts/))
  it('passes ordinary words that merely contain a name', () => {
    const { top, root, board } = sourceRepo()
    put(join(board, 'README.md'), '# Board\n\nThe benefit of a michaelmas daisy, and 4 items here and there.\n')
    git(root, 'add', '-A')
    git(root, 'commit', '-q', '-m', 'words')
    const r = exportKit(board, root, '--to', join(top, 'staging'))
    expect(r.status, r.stderr).toBe(0)
  })
})

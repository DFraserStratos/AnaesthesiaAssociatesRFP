/**
 * R-31: a path a user types means the folder they ran the command from, under `npm --prefix` too; and
 * B14-Q1 (accepted decision 29): a relative folder in the environment is relative to the board folder.
 * The scripts run as npm runs them: working folder the board, the caller's folder in INIT_CWD, and npm's
 * script line in npm_lifecycle_script. BOARD_UNDER_TEST runs another copy of the board's scripts (the
 * fail-first proof runs the pre-B14 copy; its scripts then write inside that copy, never here).
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { BOARD_DIR, envPath } from '../server/boardPaths.ts'
import { boardPort, loadLaneEnv } from '../server/laneEnv.ts'
import { callerDir, shown, userPath } from '../scripts/userPath.ts'

vi.setConfig({ testTimeout: 60_000 }) // each run starts node

const BOARD = process.env.BOARD_UNDER_TEST ?? join(import.meta.dirname, '..')
const STARTER = join(import.meta.dirname, '..', 'starter', 'requirements')
const roots: string[] = []
afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })))

/** A scratch repository root with a catalogue in it (the starter's), as a user's repo would hold one. */
function scratchRepo() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'user-path-')))
  roots.push(root)
  execFileSync('git', ['init', '-q'], { cwd: root })
  cpSync(STARTER, join(root, 'catalogue'), { recursive: true })
  return root
}

/** Run a board script as `npm --prefix <board> run <script>` from `root` would. */
function npmRun(root: string, script: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [join(BOARD, 'scripts', script), ...args], {
    cwd: BOARD,
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, INIT_CWD: root, npm_lifecycle_script: `node scripts/${script}`, REQUIREMENTS_DIR: join(root, 'catalogue'), HISTORY_DIR: join(root, '.history'), REPO_ROOT: root, ...env },
  })
}

describe('callerDir and userPath', () => {
  it('trusts INIT_CWD only when npm is running this very script', () => {
    const env = { INIT_CWD: '/repo', npm_lifecycle_script: 'node scripts/export-csv.ts' }
    expect(callerDir(env, '/b/scripts/export-csv.ts', '/b')).toBe('/repo')
    // A script started some other way inside an npm script (a test, a nested node call) keeps its own folder.
    expect(callerDir({ INIT_CWD: '/repo', npm_lifecycle_script: 'vitest run' }, '/b/scripts/export-csv.ts', '/work')).toBe('/work')
    expect(callerDir({}, '/b/scripts/export-csv.ts', '/work')).toBe('/work')
    expect(userPath('out', '/repo')).toBe(join('/repo', 'out'))
    expect(userPath('/abs/out', '/repo')).toBe('/abs/out')
  })

  it('prints a path relative to the caller when it is under them, else absolute', () => {
    expect(shown('/repo/a/b.md', '/repo')).toBe('a/b.md')
    expect(shown('/elsewhere/b.md', '/repo')).toBe('/elsewhere/b.md')
    expect(shown('/repo', '/repo')).toBe('.')
  })

  it('reads a relative folder in the environment against the board folder (B14-Q1)', () => {
    expect(envPath('X', { X: 'some/folder' })).toBe(join(BOARD_DIR, 'some', 'folder'))
    expect(envPath('X', { X: '/abs' })).toBe('/abs')
    expect(envPath('X', {})).toBeUndefined()
  })
})

describe.runIf(existsSync(STARTER))('board scripts under npm --prefix, from a repo root (R-31)', () => {
  it('export:csv --out writes under the folder the command was run from', () => {
    const root = scratchRepo()
    const r = npmRun(root, 'export-csv.ts', ['--out', 'csv-out'])
    expect(r.status, r.stderr).toBe(0)
    expect(existsSync(join(root, 'csv-out', 'requirements.csv'))).toBe(true)
    expect(r.stdout).toContain('csv-out')
  })

  it('artifact:new finds a root-relative file, and its --mermaid file, and prints paths from the root', () => {
    const root = scratchRepo()
    mkdirSync(join(root, 'notes'))
    writeFileSync(join(root, 'notes', 'x.md'), '# A note\n\nWords.\n')
    writeFileSync(join(root, 'flow.mmd'), 'flowchart LR\n  A --> B\n')
    const a = npmRun(root, 'new-artifact.ts', ['notes/x.md', '--title', 'A note', '--kind', 'note'])
    expect(a.status, a.stderr).toBe(0)
    expect(a.stdout).toContain('catalogue/artifacts/AR-02.md')
    expect(existsSync(join(root, 'catalogue', 'artifacts', 'files', 'x.md'))).toBe(true)
    const m = npmRun(root, 'new-artifact.ts', ['--mermaid', 'flow.mmd', '--title', 'A flow'])
    expect(m.status, m.stderr).toBe(0)
    expect(readFileSync(join(root, 'catalogue', 'artifacts', 'AR-03.md'), 'utf8')).toContain('A --> B')
  })

  it('artifact:new sees a path into the catalogue, typed from the root, as already inside it', () => {
    const root = scratchRepo()
    mkdirSync(join(root, 'catalogue', 'notes'), { recursive: true })
    writeFileSync(join(root, 'catalogue', 'notes', 'y.md'), '# Y\n')
    const r = npmRun(root, 'new-artifact.ts', ['catalogue/notes/y.md', '--title', 'Y', '--kind', 'note'])
    expect(r.status, r.stderr).toBe(0)
    expect(readFileSync(join(root, 'catalogue', 'artifacts', 'AR-02.md'), 'utf8')).toContain('file: notes/y.md')
    expect(existsSync(join(root, 'catalogue', 'notes', 'y.md'))).toBe(true)
  })

  it('links:index writes its index where the user said, and links:apply reads a root-relative run folder', () => {
    const root = scratchRepo()
    const i = npmRun(root, 'link-index.ts', ['out/index.md'])
    expect(i.status, i.stderr).toBe(0)
    expect(existsSync(join(root, 'out', 'index.md'))).toBe(true)
    expect(existsSync(join(root, 'out', 'current'))).toBe(true)
    const a = npmRun(root, 'apply-links.ts', ['out/current', '--dry-run'])
    expect(a.stderr).not.toMatch(/No link run at/)
    expect(a.status, a.stderr).toBe(0)
  })

  it('check reads a relative REQUIREMENTS_DIR against the board folder, wherever it runs (B14-Q1)', () => {
    const root = scratchRepo()
    const rel = relative(BOARD, join(root, 'catalogue'))
    const elsewhere = realpathSync(mkdtempSync(join(tmpdir(), 'elsewhere-')))
    roots.push(elsewhere)
    const r = spawnSync(process.execPath, [join(BOARD, 'scripts', 'check.ts')], { cwd: elsewhere, encoding: 'utf8', timeout: 60_000, env: { ...process.env, REQUIREMENTS_DIR: rel, HISTORY_DIR: join(root, '.history') } })
    expect(r.status, r.stdout + r.stderr).toBe(0)
    // The starter catalogue, not an empty folder (a missing folder reads as an empty catalogue that passes).
    expect(r.stdout.split('\n')[0]).toBe(join(root, 'catalogue'))
    expect(r.stdout).toMatch(/\b1 epics, 3 features, 9 stories, 1 questions, 1 artifacts\b/)
  })
})

describe.runIf(existsSync(STARTER))('artifact:steps shoots this worktree’s board (R-148)', () => {
  const steps = (env: Record<string, string>, args: string[] = []) => {
    const root = scratchRepo()
    writeFileSync(join(root, 'catalogue', 'artifacts', 'files', 'x.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    return npmRun(root, 'shoot-steps.ts', ['AR-01', ...args], env)
  }

  it('defaults to BOARD_PORT, and --url wins', () => {
    expect(steps({ BOARD_PORT: '5999' }).stderr).toContain('http://localhost:5999')
    expect(steps({ BOARD_PORT: '5999' }, ['--url', 'http://localhost:6001']).stderr).toContain('http://localhost:6001')
  })

  it('fills BOARD_PORT from the worktree’s .lane.env, an explicit value winning, else 5180', () => {
    const root = scratchRepo()
    mkdirSync(join(root, 'board'))
    writeFileSync(join(root, '.lane.env'), 'BOARD_PORT=5777\n')
    const env: NodeJS.ProcessEnv = {}
    expect(loadLaneEnv(env, join(root, 'board'))).toBe(join(root, '.lane.env'))
    expect(boardPort(env)).toBe(5777)
    const set: NodeJS.ProcessEnv = { BOARD_PORT: '5888' }
    loadLaneEnv(set, join(root, 'board'))
    expect(boardPort(set)).toBe(5888)
    expect(boardPort({})).toBe(5180)
    // A quoted value reads as a shell would; a value that is not a port stops instead of falling back.
    writeFileSync(join(root, '.lane.env'), 'BOARD_PORT="5779"\n')
    const quoted: NodeJS.ProcessEnv = {}
    loadLaneEnv(quoted, join(root, 'board'))
    expect(boardPort(quoted)).toBe(5779)
    expect(() => boardPort({ BOARD_PORT: 'abc' })).toThrow(/not a port/)
  })
})

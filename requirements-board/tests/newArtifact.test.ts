/**
 * `artifact:new` claims its ID before it touches any file, never writes over a file, and never stages
 * (B05: R-67, REQ-18; B05-Q6). Runs the real script against a scratch repository.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.setConfig({ testTimeout: 60_000 }) // each run starts node

const SCRIPT = fileURLToPath(new URL('../scripts/new-artifact.ts', import.meta.url))
let repo: string
let req: string
const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } })
const SIDE = (id: string, file: string) => `---\nid: ${id}\ntitle: Taken by another session\nkind: diagram\nstatus: Current\ncomponents: []\nsources: []\nfile: ${file}\n---\n`
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text id="t">Hi</text></svg>\n'

beforeEach(() => {
  repo = realpathSync(mkdtempSync(join(tmpdir(), 'artifact-new-')))
  req = join(repo, 'requirements')
  mkdirSync(join(req, 'artifacts', 'files'), { recursive: true })
  writeFileSync(join(req, 'artifacts', 'AR-01.md'), SIDE('AR-01', 'artifacts/files/AR-01.svg'))
  writeFileSync(join(req, 'artifacts', 'files', 'AR-01.svg'), SVG)
  mkdirSync(join(repo, 'incoming'))
  writeFileSync(join(repo, 'incoming', 'pic.svg'), SVG)
  mkdirSync(join(repo, 'docs'))
  writeFileSync(join(repo, 'docs', 'transcript.md'), '# Meeting\n\nWords.\n')
  git('init', '-q')
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A')
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'start')
})
afterEach(() => {
  try {
    chmodSync(join(req, 'artifacts', 'files'), 0o755)
  } catch {}
  rmSync(repo, { recursive: true, force: true })
})

const env = () => ({ ...process.env, REQUIREMENTS_DIR: req, REPO_ROOT: repo, GIT_OPTIONAL_LOCKS: '0' })
const run = (args: string[], preload?: string) => spawnSync(process.execPath, [...(preload ? ['--import', preload] : []), SCRIPT, ...args], { cwd: repo, env: env(), encoding: 'utf8' })
const sidecars = () => readdirSync(join(req, 'artifacts')).filter((n) => n.endsWith('.md')).sort()
const fileOf = (id: string) => /^file: (.*)$/m.exec(readFileSync(join(req, 'artifacts', `${id}.md`), 'utf8'))?.[1]

/** A preload that hides AR-02.md from directory listings: the snapshot of a session that started a moment before another claimed AR-02. */
function stalePreload(): string {
  const p = join(repo, 'stale.mjs')
  writeFileSync(
    p,
    `import fs from 'node:fs'\nimport { syncBuiltinESMExports } from 'node:module'\nconst real = fs.readdirSync\nfs.readdirSync = function (dir, ...rest) {\n  const out = real.call(this, dir, ...rest)\n  return String(dir).endsWith('artifacts') ? out.filter((n) => (typeof n === 'string' ? n : n.name) !== 'AR-02.md') : out\n}\nsyncBuiltinESMExports()\n`,
  )
  return p
}

describe('artifact:new claims its ID first (R-67)', () => {
  it('a run whose snapshot misses an ID another session just claimed moves on to the next, with its own file', () => {
    writeFileSync(join(req, 'artifacts', 'AR-02.md'), SIDE('AR-02', 'artifacts/files/other.svg'))
    const before = readFileSync(join(req, 'artifacts', 'AR-02.md'), 'utf8')
    const r = run(['incoming/pic.svg', '--title', 'A picture'], stalePreload())
    expect([r.status, r.stderr]).toEqual([0, ''])
    expect(sidecars()).toEqual(['AR-01.md', 'AR-02.md', 'AR-03.md'])
    expect(readFileSync(join(req, 'artifacts', 'AR-02.md'), 'utf8')).toBe(before)
    expect(fileOf('AR-03')).toBe('artifacts/files/AR-03.svg')
    expect(readFileSync(join(req, 'artifacts', 'files', 'AR-03.svg'), 'utf8')).toBe(SVG)
    expect(existsSync(join(req, 'artifacts', 'files', 'AR-02.svg'))).toBe(false)
    expect(r.stdout).toMatch(/wrote .*AR-03\.md/)
  })

  it('moves a tracked document in without staging anything', () => {
    const r = run(['docs/transcript.md', '--title', 'Meeting', '--kind', 'transcript'])
    expect([r.status, r.stderr]).toEqual([0, ''])
    expect(existsSync(join(repo, 'docs', 'transcript.md'))).toBe(false)
    expect(readFileSync(join(req, 'artifacts', 'files', 'transcript.md'), 'utf8')).toBe('# Meeting\n\nWords.\n')
    expect(fileOf('AR-02')).toBe('artifacts/files/transcript.md')
    expect(git('diff', '--cached', '--name-only')).toBe('')
  })

  it('a file step that fails gives the claim back and leaves the file where it was, nothing staged', () => {
    chmodSync(join(req, 'artifacts', 'files'), 0o555)
    const r = run(['docs/transcript.md', '--title', 'Meeting', '--kind', 'transcript'])
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/nothing was registered and the file is where it was/)
    expect(sidecars()).toEqual(['AR-01.md'])
    expect(readFileSync(join(repo, 'docs', 'transcript.md'), 'utf8')).toBe('# Meeting\n\nWords.\n')
    expect(git('diff', '--cached', '--name-only')).toBe('')
  })

  it('a drawing never lands on an existing file: a stray AR-02.svg makes it take AR-03, the stray untouched', () => {
    writeFileSync(join(req, 'artifacts', 'files', 'AR-02.svg'), 'an orphan someone left\n')
    const r = run(['incoming/pic.svg', '--title', 'A picture'])
    expect([r.status, r.stderr]).toEqual([0, ''])
    expect(sidecars()).toEqual(['AR-01.md', 'AR-03.md'])
    expect(fileOf('AR-03')).toBe('artifacts/files/AR-03.svg')
    expect(readFileSync(join(req, 'artifacts', 'files', 'AR-02.svg'), 'utf8')).toBe('an orphan someone left\n')
  })

  it('a document whose name is already taken in files/ is refused before anything is claimed', () => {
    writeFileSync(join(req, 'artifacts', 'files', 'transcript.md'), 'another transcript\n')
    const r = run(['docs/transcript.md', '--title', 'Meeting', '--kind', 'transcript'])
    expect(r.status).toBe(1)
    expect(sidecars()).toEqual(['AR-01.md'])
    expect(readFileSync(join(repo, 'docs', 'transcript.md'), 'utf8')).toBe('# Meeting\n\nWords.\n')
  })

  it('two runs at once end with two IDs, each sidecar naming its own file', async () => {
    writeFileSync(join(repo, 'incoming', 'b.svg'), SVG.replace('Hi', 'Bye'))
    const start = (file: string) =>
      new Promise<number>((done) => spawn(process.execPath, [SCRIPT, file, '--title', file], { cwd: repo, env: env(), stdio: 'ignore' }).on('exit', (code) => done(code ?? 1)))
    expect(await Promise.all([start('incoming/pic.svg'), start('incoming/b.svg')])).toEqual([0, 0])
    expect(sidecars()).toEqual(['AR-01.md', 'AR-02.md', 'AR-03.md'])
    const titles = ['AR-02', 'AR-03'].map((id) => /^title: (.*)$/m.exec(readFileSync(join(req, 'artifacts', `${id}.md`), 'utf8'))?.[1])
    expect(titles.sort()).toEqual(['incoming/b.svg', 'incoming/pic.svg'])
    for (const id of ['AR-02', 'AR-03']) {
      const title = /^title: (.*)$/m.exec(readFileSync(join(req, 'artifacts', `${id}.md`), 'utf8'))![1]!
      expect(fileOf(id)).toBe(`artifacts/files/${id}.svg`)
      expect(readFileSync(join(req, 'artifacts', 'files', `${id}.svg`), 'utf8')).toBe(title.endsWith('b.svg') ? SVG.replace('Hi', 'Bye') : SVG)
    }
  })
})

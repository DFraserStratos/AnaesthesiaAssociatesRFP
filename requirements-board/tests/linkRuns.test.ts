import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFixture } from '../e2e/fixtureCatalogue.ts'
import { afterEach, describe, expect, it } from 'vitest'
import { applyProposals, type Proposal } from '../scripts/linkProposals.ts'
import { pickLinkRun, startLinkRun } from '../scripts/linkRuns.ts'
import { item } from './fixtures.ts'

const epic = item({ id: 'EP-06', type: 'epic' })
const tick = item({ id: 'US-06.1.1', parent: 'EP-06', description: 'Tick codes.' })
const detect = item({ id: 'US-06.2.1', parent: 'EP-06', description: 'Flags an order in the prepaid set.' })
const other = item({ id: 'US-06.3.1', parent: 'EP-06', description: 'Bills the prepaid set later.' })
const items = [epic, tick, detect, other]

let root = ''
afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true })
})
const write = (dir: string, name: string, accepted: Proposal[]) => writeFileSync(join(dir, name), JSON.stringify({ batch: name, accepted }))
const proposalsOf = (dir: string, files: string[]) => files.flatMap((f) => (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { accepted: Proposal[] }).accepted)

describe('link runs (R-08)', () => {
  it('applies only the latest run: a link removed after an earlier run does not come back', () => {
    root = mkdtempSync(join(tmpdir(), 'links-'))
    // Run 1 links US-06.2.1 and is applied; the user then removes that link (the items stay as they were).
    const one = startLinkRun(root, new Date('2026-11-10T09:00:00Z'))
    write(one.dir, 'EP-06.verified.json', [{ kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'prepaid set', target: 'US-06.1.1' }])
    const r1 = pickLinkRun(root)
    expect(applyProposals(items, [], proposalsOf(r1.dir, r1.files)).changed.has('US-06.2.1')).toBe(true)
    // Run 2, over a different batch grouping.
    const two = startLinkRun(root, new Date('2026-11-18T09:00:00Z'))
    expect(two.archived).toBe(join(root, 'runs', '2026-11-10T09-00-00Z'))
    write(two.dir, 'EP-06+EP-12.verified.json', [{ kind: 'inline', item: 'US-06.3.1', field: 'description', anchor: 'prepaid set', target: 'US-06.1.1' }])
    const r2 = pickLinkRun(root)
    expect(r2.started).toBe('2026-11-18T09-00-00Z')
    expect(r2.files).toEqual(['EP-06+EP-12.verified.json'])
    const { changed } = applyProposals(items, [], proposalsOf(r2.dir, r2.files))
    expect([...changed.keys()]).toEqual(['US-06.3.1'])
    // Re-applying run 2 over its own result changes nothing.
    const again = applyProposals(items.map((it) => changed.get(it.id) ?? it), [], proposalsOf(r2.dir, r2.files))
    expect(again.changed.size).toBe(0)
  })

  it('never applies loose files from before runs had folders, names them and leaves them in place', () => {
    root = mkdtempSync(join(tmpdir(), 'links-'))
    write(root, 'EP-06.verified.json', [{ kind: 'inline', item: 'US-06.2.1', field: 'description', anchor: 'prepaid set', target: 'US-06.1.1' }])
    startLinkRun(root, new Date('2026-11-20T09:00:00Z'))
    const r = pickLinkRun(root)
    expect(r.files).toEqual([])
    expect(r.loose).toEqual(['EP-06.verified.json'])
    expect(readdirSync(root)).toContain('EP-06.verified.json')
    // Naming the folder applies it, as before.
    expect(pickLinkRun(root, root).files).toEqual(['EP-06.verified.json'])
  })

  it('replaces a run that never got proposals, and refuses when there is no run', () => {
    root = mkdtempSync(join(tmpdir(), 'links-'))
    expect(() => pickLinkRun(root)).toThrow(/No link run/)
    startLinkRun(root, new Date('2026-11-20T09:00:00Z'))
    expect(startLinkRun(root, new Date('2026-11-20T10:00:00Z')).archived).toBeNull()
    expect(pickLinkRun(root).started).toBe('2026-11-20T10-00-00Z')
  })

  it('links:apply on a run folder reports that run, and a dry run writes nothing to the catalogue', () => {
    root = mkdtempSync(join(tmpdir(), 'links-'))
    const cat = join(root, 'requirements')
    writeFixture(cat)
    const run = startLinkRun(join(root, '.links'), new Date('2026-11-20T09:00:00Z'))
    writeFileSync(join(run.dir, 'index.md'), '# index\n') // links:index copies these in; not a proposal
    write(run.dir, 'EP-01+EP-02.verified.json', [{ kind: 'related', from: 'US-01.1.1', to: 'US-02.1.1' }])
    const before = readFileSync(join(cat, 'stories', 'US-01.1.1.md'), 'utf8')
    const r = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/apply-links.ts', import.meta.url)), run.dir, '--dry-run'], { env: { ...process.env, REQUIREMENTS_DIR: cat }, encoding: 'utf8' })
    expect(r.status, r.stderr).toBe(0)
    expect(r.stdout).toContain(`Run ${run.dir} (started 2026-11-20T09-00-00Z)`)
    expect(r.stdout).toMatch(/1 proposal\(s\): 1 apply/)
    const report = readFileSync(join(run.dir, 'links-report.md'), 'utf8')
    expect(report).toContain(`Run: ${run.dir} (started 2026-11-20T09-00-00Z), 1 batch file(s): EP-01+EP-02.verified.json.`)
    expect(readFileSync(join(cat, 'stories', 'US-01.1.1.md'), 'utf8')).toBe(before)
    // The next links:index keeps this run (it has proposals); a run with only the copied index is replaced.
    expect(startLinkRun(join(root, '.links'), new Date('2026-11-20T10:00:00Z')).archived).toBe(join(root, '.links', 'runs', '2026-11-20T09-00-00Z'))
    const empty = startLinkRun(join(root, '.links'), new Date('2026-11-20T11:00:00Z'))
    expect(empty.archived).toBeNull()
  }, 60_000)

  it('names the newest earlier run with proposals when the current run has none', () => {
    root = mkdtempSync(join(tmpdir(), 'links-'))
    const one = startLinkRun(root, new Date('2026-11-18T09:00:00Z'))
    write(one.dir, 'EP-06.verified.json', [])
    startLinkRun(root, new Date('2026-11-20T09:00:00Z'))
    const r = pickLinkRun(root)
    expect(r.files).toEqual([])
    expect(r.earlier).toEqual([join(root, 'runs', '2026-11-18T09-00-00Z')])
  })
})

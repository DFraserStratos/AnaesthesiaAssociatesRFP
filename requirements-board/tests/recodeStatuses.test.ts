import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseMap, planFolder, recodeJournal, statusOf, withStatus } from '../scripts/recode-statuses.ts'
import { holdBoardLock } from '../server/historyDir.ts'
import { normaliseStatus, parseRecodes } from '../shared/statuses.ts'

const FILE = '---\nid: US-01.1.1\ntitle: A story\nstatus: Confirmed\ncomponents: [Core]\n---\nIts status: Confirmed, as the text says.\n'

describe('recoding statuses', () => {
  let dir = ''
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }))

  it('reads and rewrites only the frontmatter status line', () => {
    expect(statusOf(FILE)).toBe('Confirmed')
    const next = withStatus(FILE, '4')
    expect(next).toBe(FILE.replace('status: Confirmed\n', 'status: 4\n'))
    expect(statusOf('---\nstatus: "Open"\n---\n')).toBe('Open')
  })

  it('parses old=new pairs, refusing a target that is not a code', () => {
    expect(parseMap('Confirmed=4, Future=1')).toEqual({ Confirmed: '4', Future: '1' })
    expect(() => parseMap('Confirmed=agreed')).toThrow(/not a code/)
    expect(() => parseMap('Confirmed')).toThrow(/old=new/)
  })

  it('plans a folder, skipping files already at a target and naming values it cannot place', () => {
    dir = mkdtempSync(join(tmpdir(), 'recode-'))
    mkdirSync(join(dir, 'stories'))
    writeFileSync(join(dir, 'stories', 'A.md'), FILE)
    writeFileSync(join(dir, 'stories', 'B.md'), FILE.replace('Confirmed\n', '4\n'))
    writeFileSync(join(dir, 'stories', 'C.md'), FILE.replace('Confirmed\n', 'Maybe\n'))
    const plan = planFolder(join(dir, 'stories'), { Confirmed: '4' })
    expect(plan.changes.map((c) => [c.from, c.to])).toEqual([['Confirmed', '4']])
    expect([...plan.unknown]).toEqual([['Maybe', ['C.md']]])
  })

  it('rewrites status values in journal lines and snapshots, nothing else', () => {
    const line = { at: 't', kind: 'changed', changes: [{ field: 'status', from: 'Proposed', to: 'Confirmed' }, { field: 'title', from: 'Confirmed', to: 'x' }] }
    expect(recodeJournal(line, { Proposed: '1', Confirmed: '4' })).toEqual({
      ...line,
      changes: [{ field: 'status', from: '1', to: '4' }, { field: 'title', from: 'Confirmed', to: 'x' }],
    })
    expect(recodeJournal({ data: { id: 'X', status: 'Future' } }, { Future: '1' })).toEqual({ data: { id: 'X', status: '1' } })
  })
})

/** The script itself, run as `npm run statuses:recode` runs it, on a scratch catalogue and journal. */
// Each test runs the script in child processes: slow under the full suite's parallel load.
describe('statuses:recode on a scratch catalogue (R-06, R-07, R-44, A-2)', { timeout: 60_000 }, () => {
  const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'recode-statuses.ts')
  const SIX = [
    { code: 1, label: 'Proposed', help: '', tone: 'neutral', role: 'default' },
    { code: 2, label: 'Open', help: '', tone: 'amber', role: 'waiting' },
    { code: 3, label: 'Verify', help: '', tone: 'olive', settle: true },
    { code: 4, label: 'Agreed', help: '', tone: 'green', settle: true },
    { code: 5, label: 'Confirmed', help: '', tone: 'forest', settle: true },
    { code: 6, label: 'Retired', help: '', tone: 'hatched', role: 'retired' },
  ]
  const ALL = '1=1,2=2,3=3,4=4'
  let root = ''
  let hist = ''
  const story = (n: number, status: string) => writeFileSync(join(root, 'stories', `US-01.1.${n}.md`), `---\nid: US-01.1.${n}\ntitle: Story ${n}\nstatus: ${status}\n---\nBody ${n}.\n`)
  const statuses = () => readdirSync(join(root, 'stories')).sort().map((f) => statusOf(readFileSync(join(root, 'stories', f), 'utf8')))
  const recodesOnDisk = () => (existsSync(join(root, 'status-recodes.json')) ? JSON.parse(readFileSync(join(root, 'status-recodes.json'), 'utf8')) : null)
  const configCodes = () => (JSON.parse(readFileSync(join(root, 'board.config.json'), 'utf8')).statuses as { code: number; label: string }[]).map((d) => `${d.code} ${d.label}`)
  const run = (...args: string[]) => {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, REQUIREMENTS_DIR: root, HISTORY_DIR: hist }, encoding: 'utf8' })
    return { status: r.status, out: `${r.stdout}${r.stderr}` }
  }
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'recode-cat-'))
    hist = mkdtempSync(join(tmpdir(), 'recode-hist-'))
    mkdirSync(join(root, 'stories'))
    writeFileSync(join(root, 'board.config.json'), JSON.stringify({ project: { name: 'Acme' }, statuses: SIX }, null, 2) + '\n')
    for (let n = 1; n <= 6; n++) story(n, String(n))
  })
  afterEach(() => {
    chmodSync(join(root, 'stories'), 0o755)
    rmSync(root, { recursive: true, force: true })
    rmSync(hist, { recursive: true, force: true })
  })

  it('refuses a renumber that forgets a live status, instead of merging it silently (R-06)', () => {
    const r = run('--items', '1=1,2=2,3=4,5=6,6=7')
    expect(r.status).toBe(1)
    expect(r.out).toMatch(/"4" is not mapped \(1 file, e\.g\. US-01\.1\.4\.md\)/)
    expect(statuses()).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(recodesOnDisk()).toBeNull()
  })

  it('merges only when every merged value is named, and says it is a merge', () => {
    const dry = run('--items', '1=1,2=2,3=4,4=4,5=5,6=6', '--dry-run')
    expect(dry.status).toBe(0)
    expect(dry.out).toMatch(/merge: 3 into 4/)
    expect(statuses()).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(run('--items', '1=1,2=2,3=4,4=4,5=5,6=6').status).toBe(0)
    expect(statuses()).toEqual(['1', '2', '4', '4', '5', '6'])
    expect(configCodes()).toEqual(['1 Proposed', '2 Open', '4 Agreed', '5 Confirmed', '6 Retired'])
  })

  it('still reruns a names-to-codes recode over partly recoded files', () => {
    for (const n of [2, 3, 4, 6]) rmSync(join(root, 'stories', `US-01.1.${n}.md`))
    story(7, 'Confirmed')
    story(8, 'Proposed')
    const r = run('--items', 'Proposed=1,Confirmed=5')
    expect(r.status).toBe(0)
    expect(statuses()).toEqual(['1', '5', '5', '1'])
  })

  it('refuses a recode whose target is a code it, or an earlier recode, moves away (R-07)', () => {
    const r = run('--items', `${ALL.replace('4=4', '4=5')},5=6,6=6`)
    expect(r.status).toBe(1)
    expect(r.out).toMatch(/4=5 targets "5", which this recode also moves/)
    expect(statuses()).toEqual(['1', '2', '3', '4', '5', '6'])
    writeFileSync(join(root, 'status-recodes.json'), JSON.stringify([{ date: '2026-11-01', items: { '9': '1' }, questions: {} }]))
    expect(run('--items', `${ALL},5=9,6=6`).out).toMatch(/targets "9", which an earlier recode moved away/)
    expect(run('--items', `${ALL},5=6,6=6`).out).not.toMatch(/moved away/)
  })

  it('renumbers to fresh codes, updates the config, and reads every version right afterwards (R-07, B02-Q5)', () => {
    writeFileSync(join(root, 'status-recodes.json'), JSON.stringify([{ date: '2026-10-20', items: { Proposed: '1', Confirmed: '4' }, questions: {} }], null, 2))
    expect(run('--items', `${ALL},5=7,6=8`, '--note', 'fresh codes').status).toBe(0)
    expect(statuses()).toEqual(['1', '2', '3', '4', '7', '8'])
    expect(configCodes()).toEqual(['1 Proposed', '2 Open', '3 Verify', '4 Agreed', '7 Confirmed', '8 Retired'])
    const recodes = parseRecodes(readFileSync(join(root, 'status-recodes.json'), 'utf8'))
    expect(recodes).toHaveLength(2)
    expect(recodes[1]).toMatchObject({ note: 'fresh codes', items: { '5': '7', '6': '8' } })
    // A version saved after the recode reads as stored; one saved before reads as the recode gave it.
    for (const now of ['1', '2', '3', '4', '7', '8']) expect(normaliseStatus(recodes, 'item', now)).toBe(now)
    expect(['Proposed', 'Confirmed', '5', '6'].map((old) => normaliseStatus(recodes, 'item', old))).toEqual(['1', '4', '7', '8'])
    // A later renumber can't take back a spent code.
    expect(run('--items', '1=1,2=2,3=3,4=4,7=5,8=8').out).toMatch(/targets "5", which an earlier recode moved away/)
  })

  it('keeps an unreadable journal line byte for byte, and records the recode (R-44)', () => {
    const truncated = '{"at":"2026-11-02T10:00:00.000Z","changes":[{"field":"status","from":"5","to'
    writeFileSync(join(hist, 'US-01.1.5.jsonl'), `${JSON.stringify({ at: '2026-11-01T10:00:00.000Z', changes: [{ field: 'status', from: '5', to: '6' }] })}\n${truncated}\n`)
    writeFileSync(join(hist, 'US-01.1.5.last.json'), JSON.stringify({ data: { id: 'US-01.1.5', status: '5' } }))
    const r = run('--items', `${ALL},5=7,6=8`)
    expect(r.status).toBe(0)
    expect(r.out).toMatch(/1 unreadable journal line kept as it was/)
    const lines = readFileSync(join(hist, 'US-01.1.5.jsonl'), 'utf8').split('\n')
    expect(JSON.parse(lines[0]!).changes[0]).toEqual({ field: 'status', from: '7', to: '8' })
    expect(lines[1]).toBe(truncated)
    expect(JSON.parse(readFileSync(join(hist, 'US-01.1.5.last.json'), 'utf8')).data.status).toBe('7')
    expect(recodesOnDisk()).toHaveLength(1)
  })

  it('records the recode before rewriting files, so a rerun after a failure finishes it once (R-44)', () => {
    chmodSync(join(root, 'stories'), 0o555)
    const failed = run('--items', `${ALL},5=7,6=8`)
    expect(failed.status).toBe(1)
    expect(failed.out).toMatch(/US-01\.1\.5\.md: could not rewrite \(files\)/)
    expect(recodesOnDisk()).toHaveLength(1)
    chmodSync(join(root, 'stories'), 0o755)
    const again = run('--items', `${ALL},5=7,6=8`)
    expect(again.status).toBe(0)
    expect(again.out).toMatch(/finishing the recode recorded/i)
    expect(statuses()).toEqual(['1', '2', '3', '4', '7', '8'])
    expect(recodesOnDisk()).toHaveLength(1)
    expect(configCodes()).toEqual(['1 Proposed', '2 Open', '3 Verify', '4 Agreed', '7 Confirmed', '8 Retired'])
  })

  it('refuses to run beside a board watching the same catalogue, and ignores a stale lock (A-2)', () => {
    const release = holdBoardLock(hist)
    const r = run('--items', `${ALL},5=7,6=8`)
    expect(r.status).toBe(1)
    expect(r.out).toMatch(/stop the board/i)
    expect(statuses()).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(recodesOnDisk()).toBeNull()
    expect(run('--items', `${ALL},5=7,6=8`, '--dry-run').status).toBe(0)
    release()
    // A lock left by a board that has gone (its process ended) does not block.
    const gone = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout
    holdBoardLock(hist, Number(gone))
    expect(run('--items', `${ALL},5=7,6=8`).status).toBe(0)
  })

  it('refuses, writing nothing, when status-recodes.json cannot be read, and keeps what an entry holds when it appends', () => {
    const truncated = '[{"date":"2026-10-20","items":{"Old":"1"},"questions":{}},'
    writeFileSync(join(root, 'status-recodes.json'), truncated)
    const r = run('--items', `${ALL},5=7,6=8`)
    expect(r.status).toBe(1)
    expect(r.out).toMatch(/status-recodes\.json can't be read/)
    expect(readFileSync(join(root, 'status-recodes.json'), 'utf8')).toBe(truncated)
    expect(statuses()).toEqual(['1', '2', '3', '4', '5', '6'])
    writeFileSync(join(root, 'status-recodes.json'), JSON.stringify([{ date: '2026-10-20', items: { Old: '1' }, questions: {}, by: 'kept' }]))
    expect(run('--items', `${ALL},5=7,6=8`).status).toBe(0)
    expect(recodesOnDisk()[0]).toEqual({ date: '2026-10-20', items: { Old: '1' }, questions: {}, by: 'kept' })
  })

  it('refuses to merge away a status that holds a role', () => {
    const r = run('--items', '1=1,2=4,3=3,4=4,5=5,6=6')
    expect(r.status).toBe(1)
    expect(r.out).toMatch(/2=4 merges away "2", which holds the waiting role/)
    expect(configCodes()).toHaveLength(6)
  })

  it('never maps an old name to a spent code', () => {
    writeFileSync(join(root, 'board.config.json'), JSON.stringify({ statuses: SIX, removedStatuses: { statuses: [{ code: 7, label: 'On hold' }] } }))
    story(7, 'Parked')
    expect(run('--items', `${ALL},5=5,6=6,Parked=7`).out).toMatch(/Parked=7 targets "7", a code used before that is not live/)
    expect(run('--items', `${ALL},5=5,6=6,Parked=9`).status).toBe(0)
  })

  it('reads the recorded 2026-10-20 names-to-codes recode exactly as before', () => {
    const real = [{ date: '2026-10-20', items: { Proposed: '1', Future: '1', Open: '2', Verify: '3', Confirmed: '4', Retired: '6' }, questions: { Open: '1', Confirm: '2', Proposed: '3', Answered: '4' } }]
    expect(['Proposed', 'Future', 'Confirmed', 'Retired', '1', '4', '5', '6'].map((v) => normaliseStatus(real, 'item', v))).toEqual(['1', '1', '4', '6', '1', '4', '5', '6'])
    expect(['Answered', '4'].map((v) => normaliseStatus(real, 'question', v))).toEqual(['4', '4'])
  })
})

/** History reaches back past moves: a renamed subfolder, and the whole requirements folder moved. */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { serialiseItem } from '../shared/files.ts'
import { itemPath } from '../server/catalogueFs.ts'
import { gitAssetHistory, gitFileHistory, gitScreenshots } from '../server/gitHistory.ts'
import { gitBlobSha } from '../server/historyJournal.ts'
import { item } from './fixtures.ts'

const hasGit = (() => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

let repo: string
beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'history-moves-'))
})
afterEach(() => rmSync(repo, { recursive: true, force: true }))

describe.skipIf(!hasGit)('history across moves', () => {
  const g = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'ignore' })
  const commit = (msg: string) => {
    g('add', '-A')
    g('-c', 'user.name=Tester', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', msg)
  }
  const write = (rel: string, text: string | Buffer) => {
    mkdirSync(join(repo, rel, '..'), { recursive: true })
    writeFileSync(join(repo, rel), text)
  }
  const story = (title: string) => serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, title }))
  const TALK = `# Talk\n\n${Array.from({ length: 20 }, (_, i) => `Line ${i + 1} of what was said.`).join('\n')}\n`
  const OLD = 'docs/reqs/catalogue'
  const NEW = 'board/requirements'

  /** The old layout's history: added under items/, items/ renamed requirements/, then edits. */
  function oldHistory() {
    g('init', '-q')
    write(`${OLD}/items/US-01.1.1.md`, story('First'))
    write(`${OLD}/artifacts/AR-01.svg`, '<svg>one</svg>')
    write(`${OLD}/assets/US-01.1.1/web.png`, Buffer.from('one'))
    write('docs/Meetings/Talk.md', TALK)
    commit('Add')
    g('mv', `${OLD}/items`, `${OLD}/requirements`)
    commit('Rename items')
    write(`${OLD}/requirements/US-01.1.1.md`, story('Second'))
    write(`${OLD}/artifacts/AR-01.svg`, '<svg>two</svg>')
    write(`${OLD}/assets/US-01.1.1/web.png`, Buffer.from('two'))
    commit('Edit before')
  }

  /** The move: the folder to its new home, requirements/ to stories/, the svg and a transcript into artifacts/files/. */
  function move() {
    mkdirSync(join(repo, 'board'), { recursive: true })
    g('mv', OLD, NEW)
    g('mv', `${NEW}/requirements`, `${NEW}/stories`)
    mkdirSync(join(repo, NEW, 'artifacts', 'files'), { recursive: true })
    g('mv', `${NEW}/artifacts/AR-01.svg`, `${NEW}/artifacts/files/AR-01.svg`)
    g('mv', 'docs/Meetings/Talk.md', `${NEW}/artifacts/files/Talk.md`)
  }

  const card = () => join(repo, NEW, 'stories', 'US-01.1.1.md')

  it('reads a card back past the move before it is committed', async () => {
    oldHistory()
    move()
    const h = await gitFileHistory(card())
    expect(h.versions.map((v) => [v.commit.subject, v.item?.title])).toEqual([
      ['Edit before', 'Second'],
      ['Add', 'First'],
    ])
  })

  it('reads a card back past every move once committed, leaving out the moves themselves', async () => {
    oldHistory()
    move()
    commit('Move')
    write(`${NEW}/stories/US-01.1.1.md`, story('Third'))
    commit('Edit after')
    const h = await gitFileHistory(card())
    expect(h.versions.map((v) => [v.commit.subject, v.item?.title])).toEqual([
      ['Edit after', 'Third'],
      ['Edit before', 'Second'],
      ['Add', 'First'],
    ])
    expect(h.dirty).toBe(false)
  })

  it('keeps a move that also edited the file, as one change', async () => {
    oldHistory()
    move()
    writeFileSync(card(), story('Moved and edited'))
    commit('Move')
    const h = await gitFileHistory(card())
    expect(h.versions.map((v) => [v.commit.subject, v.item?.title])).toEqual([
      ['Move', 'Moved and edited'],
      ['Edit before', 'Second'],
      ['Add', 'First'],
    ])
  })

  it('reads an artifact file back past the move', async () => {
    oldHistory()
    move()
    write(`${NEW}/artifacts/files/Talk.md`, `${TALK}And more.\n`)
    commit('Move')
    const svg = await gitAssetHistory(join(repo, NEW, 'artifacts', 'files', 'AR-01.svg'))
    const sha = (s: string) => gitBlobSha(Buffer.from(s))
    expect(svg.commits.map((c) => [c.commit.subject, c.from, c.to])).toEqual([
      ['Edit before', sha('<svg>one</svg>'), sha('<svg>two</svg>')],
      ['Add', null, sha('<svg>one</svg>')],
    ])
    const talk = await gitAssetHistory(join(repo, NEW, 'artifacts', 'files', 'Talk.md'))
    expect(talk.commits.map((c) => [c.commit.subject, c.from, c.to])).toEqual([
      ['Move', sha(TALK), sha(`${TALK}And more.\n`)],
      ['Add', null, sha(TALK)],
    ])
  })

  it('reads screenshot rewrites back past the move', async () => {
    oldHistory()
    move()
    commit('Move')
    const { commits } = await gitScreenshots(join(repo, NEW), 'US-01.1.1')
    expect(commits.map((c) => c.commit.subject)).toEqual(['Edit before'])
    expect(commits[0]!.files[0]!.to).toEqual({ src: 'assets/US-01.1.1/web.png', sha: gitBlobSha(Buffer.from('two')) })
  })

  it('still reads a card that never moved', async () => {
    g('init', '-q')
    const root = join(repo, NEW)
    write(`${NEW}/stories/US-01.1.1.md`, story('Only'))
    commit('Add')
    expect((await gitFileHistory(itemPath('US-01.1.1', root))).versions.map((v) => v.item?.title)).toEqual(['Only'])
  })
})

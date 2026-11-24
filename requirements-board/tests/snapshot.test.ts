/**
 * `npm run snapshot`'s files (scripts/snapshotFiles.ts): where a snapshot may go, and what it writes
 * beside the built page. The page itself is checked in e2e/snapshot.spec.ts.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { writeFixture } from '../e2e/fixtureCatalogue.ts'
import { writeItem } from '../server/catalogueFs.ts'
import { SNAPSHOT_DATA, SNAPSHOT_MARKER, snapshotArtifactFile, type StaticCatalogue } from '../shared/snapshot.ts'
import { outProblem, sizeOf, staticCatalogue, writeSnapshotData } from '../scripts/snapshotFiles.ts'
import { item } from './fixtures.ts'

const BOARD = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let scratch: string
let catalogue: string

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'board-snapshot-'))
  catalogue = join(scratch, 'requirements')
  writeFixture(catalogue)
  writeItem({ ...item({ id: 'US-01.1.1', type: 'story', parent: 'FT-01.1' }), images: [{ src: 'assets/US-01.1.1/screen.png', viewport: 'desktop' }] }, catalogue)
  mkdirSync(join(catalogue, 'assets', 'US-01.1.1'), { recursive: true })
  writeFileSync(join(catalogue, 'assets', 'US-01.1.1', 'screen.png'), 'png')
  writeFileSync(join(catalogue, 'assets', 'US-01.1.1', '.DS_Store'), 'junk')
})
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

describe('outProblem', () => {
  it('takes a new or empty folder, or an earlier snapshot', () => {
    expect(outProblem(join(scratch, 'new-site'), BOARD)).toBeNull()
    const empty = join(scratch, 'empty')
    mkdirSync(empty)
    writeFileSync(join(empty, '.DS_Store'), '')
    expect(outProblem(empty, BOARD)).toBeNull()
    const earlier = join(scratch, 'earlier')
    mkdirSync(earlier)
    writeFileSync(join(earlier, SNAPSHOT_MARKER), '{}')
    writeFileSync(join(earlier, 'index.html'), '')
    expect(outProblem(earlier, BOARD)).toBeNull()
  })

  it('refuses the board, a folder in it, a folder holding it, a file, and a folder of other things', () => {
    expect(outProblem(BOARD, BOARD)).toMatch(/inside the board/)
    expect(outProblem(join(BOARD, 'dist-snapshot'), BOARD)).toMatch(/inside the board/)
    expect(outProblem(dirname(BOARD), BOARD)).toMatch(/holds the board/)
    const file = join(scratch, 'a-file')
    writeFileSync(file, '')
    expect(outProblem(file, BOARD)).toMatch(/is a file/)
    const busy = join(scratch, 'busy')
    mkdirSync(busy)
    writeFileSync(join(busy, 'notes.txt'), '')
    expect(outProblem(busy, BOARD)).toMatch(/no earlier snapshot/)
  })
})

describe('writeSnapshotData', () => {
  let site: string
  let data: StaticCatalogue
  beforeAll(() => {
    site = join(scratch, 'site')
    mkdirSync(site)
    data = staticCatalogue(catalogue, { takenAt: '2026-11-25T00:00:00.000Z', commit: null, dirty: false, boardVersion: '9.9.9' })
    writeSnapshotData(catalogue, site, data)
  })

  it('writes the catalogue as the dev server serves it, without check output, with where it came from', () => {
    const json = JSON.parse(readFileSync(join(site, SNAPSHOT_DATA), 'utf8')) as StaticCatalogue
    expect(Object.keys(json.items)).toContain('EP-01')
    expect(json.artifacts['AR-01']?.meta.format).toBe('svg')
    expect(json.issues).toEqual([])
    expect(json.epoch).toBe('')
    expect(json.snapshot).toEqual({ takenAt: '2026-11-25T00:00:00.000Z', commit: null, dirty: false, boardVersion: '9.9.9', project: 'Fixture project' })
    expect(json.assets['assets/US-01.1.1/screen.png']).toMatch(/^[0-9a-f]{40}$/)
  })

  it('copies screenshots where assetUrl finds them, junk left out', () => {
    expect(readFileSync(join(site, 'requirements', 'assets', 'US-01.1.1', 'screen.png'), 'utf8')).toBe('png')
    expect(existsSync(join(site, 'requirements', 'assets', 'US-01.1.1', '.DS_Store'))).toBe(false)
  })

  it('copies each artifact file under its ID with its extension, wherever it lives; mermaid has none', () => {
    expect(snapshotArtifactFile('AR-04', 'notes/2026-01-02-fixture-meeting.md')).toBe('artifact-file/AR-04.md')
    expect(readFileSync(join(site, 'artifact-file', 'AR-01.svg'), 'utf8')).toContain('<svg')
    expect(readFileSync(join(site, 'artifact-file', 'AR-04.md'), 'utf8')).toContain('Fixture note')
    expect(existsSync(join(site, 'artifact-file', 'AR-05.pdf'))).toBe(true)
    expect(existsSync(join(site, 'artifact-file', 'AR-02.png'))).toBe(true)
    expect(existsSync(join(site, 'artifact-file', 'AR-03'))).toBe(false)
  })

  it('writes the host files and the marker', () => {
    expect(existsSync(join(site, '.nojekyll'))).toBe(true)
    expect(readFileSync(join(site, '_headers'), 'utf8')).toContain('/artifact-file/*.svg\n  Content-Security-Policy:')
    expect(JSON.parse(readFileSync(join(site, SNAPSHOT_MARKER), 'utf8'))).toMatchObject({ boardVersion: '9.9.9', screenshots: 1 })
    expect(sizeOf(site).files).toBeGreaterThan(5)
  })
})

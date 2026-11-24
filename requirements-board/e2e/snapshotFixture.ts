/**
 * A snapshot of the synthetic fixture catalogue, for `snapshot.spec.ts`: the fixture, an open question
 * and a story with a screenshot, written to their own folder (the write specs reset theirs), then
 * `npm run snapshot` over it. `playwright.config.ts` runs this, then serves the snapshot with `vite preview`.
 *   node e2e/snapshotFixture.ts
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeItem, writeQuestion } from '../server/catalogueFs.ts'
import { fixtureItems, png, writeFixture } from './fixtureCatalogue.ts'

export const SNAPSHOT_CATALOGUE_DIR = join(tmpdir(), 'requirements-board-e2e-snapshot-catalogue')
export const SNAPSHOT_SITE_DIR = join(tmpdir(), 'requirements-board-e2e-snapshot-site')
export const SNAPSHOT_QUESTION = 'OQ-01'
export const SNAPSHOT_STORY = 'US-01.1.1'
const SHOT = `assets/${SNAPSHOT_STORY}/screen.png`

export function writeSnapshotFixture() {
  const dir = SNAPSHOT_CATALOGUE_DIR
  writeFixture(dir)
  writeQuestion({ id: SNAPSHOT_QUESTION, kind: 'question', title: 'Who signs it off', status: '1', owner: '', question: 'Who signs the list off?', answer: '', affects: ['FT-01.1'], sources: [], extra: {} }, dir)
  const story = fixtureItems().find((i) => i.id === SNAPSHOT_STORY)!
  writeItem({ ...story, description: 'The story as written.', images: [{ src: SHOT, viewport: 'desktop', app: 'web', caption: 'The screen' }] }, dir)
  mkdirSync(join(dir, 'assets', SNAPSHOT_STORY), { recursive: true })
  writeFileSync(join(dir, SHOT), png(320, 200))
  const board = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  execFileSync(process.execPath, [join(board, 'scripts', 'snapshot.ts'), '--out', SNAPSHOT_SITE_DIR], { cwd: board, env: { ...process.env, REQUIREMENTS_DIR: dir }, stdio: 'inherit' })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeSnapshotFixture()

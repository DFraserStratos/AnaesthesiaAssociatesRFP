/**
 * A small synthetic catalogue for the specs that write (drags, lane edits), so
 * they never touch the real requirements. `playwright.config.ts` writes it
 * before booting the board over it; specs call `writeFixture` to reset it.
 *   node e2e/fixtureCatalogue.ts <dir>
 */
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeItem, writeLayout } from '../server/catalogueFs.ts'
import type { Item } from '../shared/types.ts'

export const FIXTURE_DIR = join(tmpdir(), 'requirements-board-e2e')
export const FIXTURE_LANES = ['MVP', 'Phase 2']

/** 2 epics x 4 features x 3 stories; each feature's first story is in MVP. */
export function fixtureItems(): Item[] {
  const base = { status: 'Proposed', components: ['Scheduling Engine'], sources: ['Fixture'], images: [], description: '', acceptance: '', technical: '', notes: '', extra: {}, swimlane: null } as const
  const out: Item[] = []
  for (let e = 1; e <= 2; e++) {
    const ep = `EP-0${e}`
    out.push({ ...base, id: ep, type: 'epic', parent: null, title: `Epic ${e}`, order: e, components: [...base.components], sources: [...base.sources], images: [] })
    for (let f = 1; f <= 4; f++) {
      const ft = `FT-0${e}.${f}`
      out.push({ ...base, id: ft, type: 'feature', parent: ep, title: `Feature ${e}.${f}`, order: f, components: [...base.components], sources: [...base.sources], images: [] })
      for (let s = 1; s <= 3; s++) {
        out.push({ ...base, id: `US-0${e}.${f}.${s}`, type: 'story', parent: ft, title: `Story ${e}.${f}.${s}`, order: s, swimlane: s === 1 ? 'MVP' : null, components: [...base.components], sources: [...base.sources], images: [] })
      }
    }
  }
  return out
}

export function writeFixture(dir = FIXTURE_DIR) {
  rmSync(join(dir, 'requirements'), { recursive: true, force: true })
  rmSync(join(dir, 'questions'), { recursive: true, force: true })
  mkdirSync(join(dir, 'questions'), { recursive: true })
  for (const it of fixtureItems()) writeItem(it, dir)
  writeLayout({ positions: {}, lanes: FIXTURE_LANES }, dir)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeFixture(process.argv[2] ?? FIXTURE_DIR)

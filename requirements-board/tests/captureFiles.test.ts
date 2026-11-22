import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fileFor, isGenerated, parseOnly, pruneGenerated, pruneShots } from '../scripts/captureFiles.ts'

const APPS = ['web', 'admin']
let dir: string
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }))

describe('capture file naming', () => {
  it('names a shot by app, shot and state', () => {
    expect(fileFor('US-01.1.1', { app: 'web', name: 'dashboard' }, {})).toBe('assets/US-01.1.1/web-dashboard.png')
    expect(fileFor('US-01.1.1', { app: 'web', name: 'dashboard' }, { state: 'open' })).toBe('assets/US-01.1.1/web-dashboard-open.png')
  })

  it('treats only app-prefixed PNGs in the item folder as generated', () => {
    expect(isGenerated('US-01.1.1', 'assets/US-01.1.1/web-dashboard.png', APPS)).toBe(true)
    expect(isGenerated('US-01.1.1', 'assets/US-01.1.1/hand-dashboard.png', APPS)).toBe(false)
    expect(isGenerated('US-01.1.1', 'assets/US-02.1.1/web-dashboard.png', APPS)).toBe(false)
  })

  it('takes the app names from the project, and treats nothing as generated without any', () => {
    expect(isGenerated('US-01.1.1', 'assets/US-01.1.1/kiosk-home.png', ['kiosk'])).toBe(true)
    expect(isGenerated('US-01.1.1', 'assets/US-01.1.1/web-dashboard.png', ['kiosk'])).toBe(false)
    expect(isGenerated('US-01.1.1', 'assets/US-01.1.1/web-dashboard.png', [])).toBe(false)
  })

  it('prunes stale generated files and never touches hand-added ones', () => {
    dir = mkdtempSync(join(tmpdir(), 'capture-'))
    for (const f of ['web-keep.png', 'web-stale.png', 'hand-shot.png', 'notes.txt']) writeFileSync(join(dir, f), 'x')
    expect(pruneGenerated(dir, new Set(['web-keep.png']), APPS)).toEqual(['web-stale.png'])
    expect(['web-keep.png', 'hand-shot.png', 'notes.txt'].every((f) => existsSync(join(dir, f)))).toBe(true)
  })
})

describe('capture never deletes a shot another item lists (R-39)', () => {
  it('keeps a stale generated file another item still uses, names its users, and still removes an unused one', () => {
    dir = mkdtempSync(join(tmpdir(), 'capture-'))
    for (const f of ['web-keep.png', 'web-shared.png', 'web-stale.png', 'hand-shot.png']) writeFileSync(join(dir, f), 'x')
    const usedBy = (name: string) => (name === 'web-shared.png' ? ['FT-03.5'] : [])
    const { removed, kept } = pruneShots(dir, new Set(['web-keep.png']), APPS, usedBy)
    expect(removed).toEqual(['web-stale.png'])
    expect(kept).toEqual([{ file: 'web-shared.png', users: ['FT-03.5'] }])
    expect(['web-keep.png', 'web-shared.png', 'hand-shot.png'].every((f) => existsSync(join(dir, f)))).toBe(true)
    expect(existsSync(join(dir, 'web-stale.png'))).toBe(false)
  })
})

describe('capture --only is strict (R-134)', () => {
  it('reads --only ID and --only=ID the same, and an absent flag as a full run', () => {
    expect(parseOnly(['--only', 'US-01.1.1,EP-02'])).toEqual({ ids: ['US-01.1.1', 'EP-02'] })
    expect(parseOnly(['--only=US-01.1.1,EP-02'])).toEqual({ ids: ['US-01.1.1', 'EP-02'] })
    expect(parseOnly(['--only', 'US-01.1.1', '--dry'])).toEqual({ ids: ['US-01.1.1'] })
    expect(parseOnly(['--dry'])).toEqual({})
  })

  it('refuses a missing, empty, flag or ID-less value instead of running everything', () => {
    for (const argv of [['--only'], ['--only', ''], ['--only='], ['--only', '--dry'], ['--only', ','], ['--only', ' , '], ['--only', 'A', '--only', 'B']]) {
      expect(parseOnly(argv).error, JSON.stringify(argv)).toBeTruthy()
    }
  })
})

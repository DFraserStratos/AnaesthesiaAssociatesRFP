import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fileFor, isGenerated, pruneGenerated } from '../scripts/captureFiles.ts'

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

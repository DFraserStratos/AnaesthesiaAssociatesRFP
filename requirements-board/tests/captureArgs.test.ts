import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// R-134: a bad `--only` stops before any shot, item write or report. CAPTURE_UNDER_TEST runs another copy of
// capture.ts (the fail-first proof runs the old one, which took these as a full run and rewrote the report).
const script = process.env.CAPTURE_UNDER_TEST ?? join(import.meta.dirname, '..', 'scripts', 'capture.ts')
const STARTER = join(import.meta.dirname, '..', 'starter', 'requirements')

describe.runIf(existsSync(STARTER))('capture --only from the command line (R-134)', () => {
  let dir: string
  let report: string
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'capture-args-'))
    cpSync(STARTER, dir, { recursive: true })
    const configPath = join(dir, 'board.config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>
    config.screenshotApps = [{ key: 'web', label: 'Web', viewport: 'desktop' }]
    config.capture = { recipes: 'capture/recipes', report: 'capture/REPORT.md', apps: { web: { url: 'http://localhost:9' } } }
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
    mkdirSync(join(dir, 'capture', 'recipes'), { recursive: true })
    report = join(dir, 'capture', 'REPORT.md')
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  for (const args of [['--only'], ['--only', ''], ['--only', ','], ['--only', '--dry'], ['--only=']]) {
    it(`refuses ${JSON.stringify(args)} before doing anything`, () => {
      const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 60_000, env: { ...process.env, REQUIREMENTS_DIR: dir, HISTORY_DIR: join(dir, '.history') } })
      expect(r.status, r.stderr).toBe(1)
      expect(r.stderr).toMatch(/--only/)
      expect(existsSync(report)).toBe(false)
    }, 60_000)
  }
})

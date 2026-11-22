/**
 * Catch-up Phase 40 (item 7, RV-36): the old prior-episode flag and the
 * provisional no-NHI patient are gone for good. Nothing under `src` or
 * `visual` names them, apart from the frozen `__fixtures__` JSON baselines.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')
const SELF = resolve(__dirname, 'priorBalanceGone.test.ts')
// Built from parts so this file does not match itself.
const RETIRED = new RegExp(
  ['patientHasOutstanding' + 'PriorEpisode', 'outstanding' + 'PriorBalance', 'Prior ' + 'balance', 'NHI ' + 'pending', 'NHI ' + 'missing', 'created' + 'Provisional'].join('|'),
)

function walk(dir: string, out: string[]): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx|json|css|html)$/.test(name)) out.push(path)
  }
  return out
}

describe('the prior-episode flag and the provisional patient are retired', () => {
  it('appear nowhere in src or visual (frozen __fixtures__ JSON aside)', () => {
    const files = [...walk(join(ROOT, 'src'), []), ...walk(join(ROOT, 'visual'), [])].filter(
      (f) => f !== SELF && !(f.includes(`${'/'}__fixtures__${'/'}`) && f.endsWith('.json')),
    )
    expect(files.length).toBeGreaterThan(100)
    const hits = files.filter((f) => RETIRED.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f))
    expect(hits).toEqual([])
    // It reads every file under src and visual: allow for a slow disk or an on-access scanner (Wave 5 join).
  }, 30_000)
})

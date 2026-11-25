/**
 * DM-08 (build plan Phase 55; OQ-148's default): the surgeon group record is
 * gone from the model, the store and the seed, while the Party of kind surgeon
 * group and every Contract it holds stay exactly as they were.
 */
import { describe, expect, it } from 'vitest'
import { buildSeed } from './index'
import type { RetireKind } from '../masterLifecycle'
import { createAppStore } from '../../store/appStore'

/** Every retire kind, spelled out: adding a kind back fails the typecheck here. */
const RETIRE_KINDS: Record<RetireKind, true> = { hospital: true, surgeon: true, aaModifier: true }

describe('DM-08: no surgeon group record', () => {
  it('no masters slice and no retire kind names a surgeon group', () => {
    const seed = buildSeed()
    expect(Object.keys(seed.masters).filter((k) => /surgeon.?group/i.test(k))).toEqual([])
    expect(Object.keys(createAppStore().getState().masters).filter((k) => /surgeon.?group/i.test(k))).toEqual([])
    expect(Object.keys(RETIRE_KINDS).sort()).toEqual(['aaModifier', 'hospital', 'surgeon'])
    expect(Object.keys(createAppStore().getState().counters)).not.toContain('surgeonGroup')
  })

  it('the four surgeon-group Parties and every Contract they hold are unchanged', () => {
    const m = buildSeed().masters
    const parties = Object.values(m.parties)
      .filter((p) => p.kind === 'surgeonGroup')
      .map((p) => [p.id, p.name])
      .sort()
    expect(parties).toEqual([
      ['PY-ARIA', 'Aria Skin and Laser Clinic'],
      ['PY-COS', 'Canterbury Orthopaedic Surgeons'],
      ['PY-MER', 'Merivale Plastic Surgery'],
      ['PY-UNI', 'Unisports Ortho'],
    ])
    const ids = parties.map(([id]) => id)
    const contracts = Object.values(m.contracts)
      .filter((c) => ids.includes(c.holderId))
      .map((c) => [c.id, c.holderId, c.linkedSurgeonIds])
      .sort()
    expect(contracts).toEqual([
      ['CT-ARIA-HOURLY', 'PY-ARIA', ['S-LIM', 'S-OKAFOR']],
      ['CT-COS-ACC', 'PY-COS', ['S-HALE']],
      ['CT-COS-FIXED', 'PY-COS', ['S-HALE']],
      ['CT-FIX-SPECIAL-PY-ARIA', 'PY-ARIA', []],
      ['CT-FIX-SPECIAL-PY-COS', 'PY-COS', []],
      ['CT-FIX-SPECIAL-PY-UNI', 'PY-UNI', []],
      ['CT-MER-FACELIFT', 'PY-MER', ['S-LIM', 'S-WOLFENDEN']],
      ['CT-MER-FACELIFT-1', 'PY-MER', ['S-LIM', 'S-WOLFENDEN']],
      ['CT-MER-FACELIFT-2', 'PY-MER', ['S-LIM', 'S-WOLFENDEN']],
      ['CT-RVG-SPECIAL-PY-ARIA', 'PY-ARIA', []],
      ['CT-RVG-SPECIAL-PY-COS', 'PY-COS', []],
      ['CT-RVG-SPECIAL-PY-UNI', 'PY-UNI', []],
      ['CT-UNISPORTS', 'PY-UNI', ['S-HALE']],
    ])
  })
})

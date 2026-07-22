/**
 * The mutation wrapper: lastModifiedBy/At stamped in LOCKSTEP with every
 * audit entry — plus `storeDiscipline`, the source-scan proving no module
 * outside mutate.ts raw-writes a domain slice (the grep-provable convention).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { cancelCard, completeCard, editCard, editProcedure } from './lifecycle'
import { auditForEntity, proceduresForCard } from './selectors'
import type { Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: '34821',
}

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const ELLISON_CARD = marker('pendingCaptureCard')

describe('the wrapper stamps lastModifiedBy/At in lockstep with the audit entry', () => {
  it('on card edits', () => {
    const api = createAppStore()
    expect(editCard(api, OFFICE, ELLISON_CARD, { notes: 'note' }).ok).toBe(true)
    const state = api.getState()
    const card = state.schedule.cards[ELLISON_CARD]
    const entry = auditForEntity(state, ELLISON_CARD).at(-1)
    expect(entry?.action).toBe('card.update')
    expect(card?.lastModifiedBy).toBe('Kirsty W.')
    expect(card?.lastModifiedAtISO).toBe(entry?.atISO)
  })

  it('on procedure edits (stamping the PARENT card)', () => {
    const api = createAppStore()
    const procedure = proceduresForCard(api.getState(), ELLISON_CARD)[0]
    if (procedure === undefined) throw new Error('no procedure')
    expect(editProcedure(api, OFFICE, procedure.id, { billingReference: 'SX-2026-7000' }).ok).toBe(true)
    const state = api.getState()
    const card = state.schedule.cards[ELLISON_CARD]
    const entry = auditForEntity(state, procedure.id).at(-1)
    expect(entry?.action).toBe('procedure.update')
    expect(card?.lastModifiedBy).toBe('Kirsty W.')
    expect(card?.lastModifiedAtISO).toBe(entry?.atISO)
  })

  it('on completion and cancellation', () => {
    const api = createAppStore()
    expect(completeCard(api, SOUTER, ELLISON_CARD).ok).toBe(true)
    let state = api.getState()
    expect(state.schedule.cards[ELLISON_CARD]?.lastModifiedBy).toBe('Dr Melanie Souter')
    expect(state.schedule.cards[ELLISON_CARD]?.lastModifiedAtISO).toBe(
      auditForEntity(state, ELLISON_CARD).at(-1)?.atISO,
    )

    const cancelTarget = marker('twoFunderCard')
    expect(cancelCard(api, OFFICE, cancelTarget, 'Rebooked').ok).toBe(true)
    state = api.getState()
    expect(state.schedule.cards[cancelTarget]?.lastModifiedBy).toBe('Kirsty W.')
    expect(state.schedule.cards[cancelTarget]?.lastModifiedAtISO).toBe(
      auditForEntity(state, cancelTarget).at(-1)?.atISO,
    )
  })

  it('audit is append-only and ids are sequential', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    expect(editCard(api, OFFICE, ELLISON_CARD, { notes: 'a' }).ok).toBe(true)
    expect(editCard(api, OFFICE, ELLISON_CARD, { notes: 'b' }).ok).toBe(true)
    const audit = api.getState().audit
    expect(audit.length).toBe(before + 2)
    const [first, second] = audit.slice(-2)
    expect(first?.id).not.toBe(second?.id)
  })
})

// ---------------------------------------------------------------------------
// storeDiscipline — the source scan (same pattern as domainPurity)
// ---------------------------------------------------------------------------

const SOURCES = import.meta.glob(
  ['./**/*.ts', '../apps/**/*.tsx', '../shell/**/*.tsx', '!./**/*.test.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

describe('storeDiscipline', () => {
  const files = Object.keys(SOURCES)

  it('finds the store and app sources', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('only mutate.ts and clockActions.ts ever call setState', () => {
    for (const file of files) {
      if (file.endsWith('/mutate.ts') || file.endsWith('/clockActions.ts')) continue
      const source = SOURCES[file] ?? ''
      expect(/\.setState\s*\(/.test(source), `${file} must not call setState directly`).toBe(false)
    }
  })

  it("clockActions' setState calls write only the clock", () => {
    const source = SOURCES['./clockActions.ts'] ?? ''
    const calls = source.match(/\.setState\s*\(/g) ?? []
    const clockOnly = source.match(/\.setState\s*\(\s*\{\s*clock/g) ?? []
    expect(calls.length).toBeGreaterThan(0)
    expect(clockOnly.length).toBe(calls.length)
  })

  it("appStore's initializer set() writes only the shell slice", () => {
    const source = SOURCES['./appStore.ts'] ?? ''
    const calls = source.match(/[^.\w]set\s*\(\s*\{/g) ?? []
    const shellOnly = source.match(/[^.\w]set\s*\(\s*\{\s*shell/g) ?? []
    expect(calls.length).toBe(shellOnly.length)
  })
})

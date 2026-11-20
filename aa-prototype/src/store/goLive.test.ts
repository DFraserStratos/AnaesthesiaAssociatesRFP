import { describe, expect, it } from 'vitest'
import { goLiveCandidates, junkReason, normaliseOperationName, SOLUTIONS_PLUS_OPERATIONS } from '../domain/masterLoad/solutionsPlus'
import { NOT_APPROVED_FOR_GO_LIVE } from '../domain/masterLoad/goLive'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR, SEED_LOAD_ACTOR, SOUTER_ACTOR } from './demoActors'
import { commitGoLiveLoad, discardGoLiveLoad, goLiveOutcomes, setGoLiveApproval, stageGoLiveLoad } from './goLiveActions'

describe('the Solutions Plus list (catch-up Phase 42; US-13.4.2)', () => {
  it('14 rows: 5 junk, 2 not approved, the rest approved', () => {
    const c = goLiveCandidates()
    expect(c).toHaveLength(14)
    expect(c.filter((x) => x.decision === 'junk').map((x) => x.scanRow)).toEqual([3, 5, 7, 9, 10])
    expect(c.filter((x) => x.decision === 'notApproved').map((x) => x.scanRow)).toEqual([6, 12])
    expect(c.filter((x) => x.decision === 'approved')).toHaveLength(7)
  })
  it('names each junk pattern, and a repeat as a duplicate of its scan row', () => {
    expect(junkReason('10% discount')).toBe('Looks like a pricing note, not an operation')
    expect(junkReason('DO NOT USE - old code')).toBe('Marked not for use')
    expect(junkReason('Test op')).toBe('Not an operation')
    expect(junkReason('Misc')).toBe('Not an operation')
    expect(junkReason('Knee arthroscopy')).toBeNull()
    expect(goLiveCandidates().find((x) => x.scanRow === 10)?.reason).toBe('Duplicate of scan row 1')
    expect(normaliseOperationName('LAPAROSCOPIC  CHOLECYSTECTOMY ')).toBe(normaliseOperationName('Laparoscopic cholecystectomy'))
  })
})

describe('the go-live load (catch-up Phase 42; US-13.4.2, US-13.4.3)', () => {
  it('stages the pack without touching master data, and refuses a second stage', () => {
    const api = createAppStore()
    const masters = api.getState().masters
    const out = stageGoLiveLoad(api, SEED_LOAD_ACTOR)
    expect(out.ok && out.value).toMatchObject({ candidates: 14, junk: 5, notApproved: 2, sheets: 6 })
    expect(api.getState().masters).toBe(masters)
    expect(stageGoLiveLoad(api, SEED_LOAD_ACTOR)).toMatchObject({ ok: false, code: 'alreadyStaged' })
    expect(stageGoLiveLoad(createAppStore(), SOUTER_ACTOR)).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('gives one outcome per name', () => {
    const api = createAppStore()
    stageGoLiveLoad(api, SEED_LOAD_ACTOR)
    const o = goLiveOutcomes(api.getState())
    const kind = (row: number) => o.get(row)?.kind
    expect([1, 2, 4, 8].map(kind)).toEqual(['loads', 'loads', 'loads', 'loads'])
    expect([3, 5, 7, 9, 10].map(kind)).toEqual(['junk', 'junk', 'junk', 'junk', 'junk'])
    expect([6, 12].map(kind)).toEqual(['notApproved', 'notApproved'])
    expect(kind(11)).toBe('alreadyInMaster')
    expect(kind(13)).toBe('noControlledRow')
    expect(kind(14)).toBe('controlledRowRejected')
  })

  it('loads only approved data from the controlled sheets, in one commit (US-13.4.2 AC1, AC2)', () => {
    const api = createAppStore()
    stageGoLiveLoad(api, SEED_LOAD_ACTOR)
    const contractsBefore = Object.keys(api.getState().masters.contracts).length
    const auditBefore = api.getState().audit.length
    const out = commitGoLiveLoad(api, SEED_LOAD_ACTOR)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.bySheet).toEqual({ surgeons: 3, rvgGroups: 1, parties: 1, contracts: 5, priceRanges: 1, publicHolidays: 4 })
    expect(out.value.notLoaded).toBe(10)
    const s = api.getState()
    const made = Object.values(s.masters.contracts).filter((c) => c.aaCode.startsWith('HSG-GL'))
    expect(made.map((c) => c.aaCode).sort()).toEqual(['HSG-GL01', 'HSG-GL02', 'HSG-GL03', 'HSG-GL04', 'HSG-GL07'])
    expect(made.every((c) => c.status === 'active')).toBe(true)
    // Prices come from the controlled sheet, never from Solutions Plus units.
    const lap = made.find((c) => c.aaCode === 'HSG-GL01')!
    expect(lap.pricing).toEqual({ kind: 'fixed', ranges: [{ startISO: '2026-04-01', price: 1450 }, { startISO: '2026-07-01', price: 1490 }] })
    const units = new Set(SOLUTIONS_PLUS_OPERATIONS.map((o) => o.spUnits))
    for (const c of made) if (c.pricing.kind === 'fixed') for (const r of c.pricing.ranges) expect(units.has(r.price)).toBe(false)
    // Not approved (Tonsillectomy) never loads, nor its range.
    expect(made.some((c) => c.invoiceDescription === 'Tonsillectomy')).toBe(false)
    const tonsils = s.masterLoads.loads[s.masterLoads.goLive!.loadIds[3]!]!.rows.find((r) => r.cells.includes('Tonsillectomy'))
    expect(tonsils?.reasons).toEqual([NOT_APPROVED_FOR_GO_LIVE])
    expect(Object.keys(s.masters.contracts).length - contractsBefore).toBeGreaterThanOrEqual(5)
    // One commit: every entry of it shares the clock and is contiguous at the end of the audit.
    const added = s.audit.slice(auditBefore)
    expect(added.filter((a) => a.action === 'goLive.commit')).toHaveLength(1)
    expect(added.filter((a) => a.action === 'contract.create').every((a) => (a.after as { loadId?: string }).loadId !== undefined)).toBe(true)
    expect(s.masterLoads.goLive?.status).toBe('loaded')
    expect(commitGoLiveLoad(api, SEED_LOAD_ACTOR)).toMatchObject({ ok: false, code: 'notStaged' })
  })

  it('un-approving a name before the commit removes its Contract and price ranges from the load', () => {
    const api = createAppStore()
    stageGoLiveLoad(api, SEED_LOAD_ACTOR)
    expect(setGoLiveApproval(api, OFFICE_ACTOR, 1, false, 'Done elsewhere now').ok).toBe(true)
    expect(goLiveOutcomes(api.getState()).get(1)?.kind).toBe('notApproved')
    expect(setGoLiveApproval(api, OFFICE_ACTOR, 3, true)).toMatchObject({ ok: false, message: 'Junk is excluded and cannot be approved.' })
    const out = commitGoLiveLoad(api, SEED_LOAD_ACTOR)
    expect(out.ok && out.value.bySheet).toMatchObject({ contracts: 4, priceRanges: 0 })
    expect(Object.values(api.getState().masters.contracts).some((c) => c.aaCode === 'HSG-GL01')).toBe(false)
    expect(api.getState().audit.some((a) => a.action === 'goLive.unapprove' && a.who === OFFICE_ACTOR.who)).toBe(true)
  })

  it('a Reset then the same load again gives identical records (US-13.4.3 AC2)', () => {
    const run = () => {
      const api = createAppStore()
      stageGoLiveLoad(api, SEED_LOAD_ACTOR)
      commitGoLiveLoad(api, SEED_LOAD_ACTOR)
      return api.getState().masters
    }
    expect(run()).toEqual(run())
  })

  it('discard drops the batch', () => {
    const api = createAppStore()
    stageGoLiveLoad(api, SEED_LOAD_ACTOR)
    expect(discardGoLiveLoad(api, SEED_LOAD_ACTOR).ok).toBe(true)
    expect(api.getState().masterLoads.goLive).toBeNull()
    expect(Object.values(api.getState().masterLoads.loads).every((l) => l.status === 'discarded')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { contractsLinkedToSurgeon, nextListsForSurgeon } from './surgeonPageSelectors'
import { pairingsOnProfile } from '../domain/pairingPreferences'
import { FIXTURE_SURGEON, withSurgeonSidePanel } from '../test/surgeonSidePanelFixture'

describe('the surgeon page side panel (Phase 55; US-13.6.2 Side panel)', () => {
  it("Mr Hale's Contracts: COS's two and Unisports Ortho, each naming its holder", () => {
    const rows = contractsLinkedToSurgeon(freshAppState(), 'S-HALE')
    expect(rows.map((r) => [r.contract.id, r.holderName]).sort()).toEqual([
      ['CT-COS-ACC', 'Canterbury Orthopaedic Surgeons'],
      ['CT-COS-FIXED', 'Canterbury Orthopaedic Surgeons'],
      ['CT-UNISPORTS', 'Unisports Ortho'],
    ])
  })

  it("the example: four pairings, two linked Contracts (a hospital's one Disabled, after the Active), six upcoming Lists", () => {
    const state = withSurgeonSidePanel(freshAppState())
    const p = pairingsOnProfile(state.officePrivate.pairingPreferences, { surgeonId: FIXTURE_SURGEON })
    expect(p.notPreferred.length + p.preferred.length).toBe(4)

    const contracts = contractsLinkedToSurgeon(state, FIXTURE_SURGEON)
    expect(contracts.map((r) => r.contract.id)).toEqual(['CT-FX-GROUP', 'CT-FX-HOSP'])
    expect(state.masters.parties[contracts[1]!.contract.holderId]?.kind).toBe('hospital')

    const lists = nextListsForSurgeon(state, FIXTURE_SURGEON, state.clock.todayISO)
    expect(lists.map((l) => l.id)).toEqual(['L-FX-6', 'L-FX-5', 'L-FX-4', 'L-FX-3', 'L-FX-2', 'L-FX-1'])
    const dates = lists.map((l) => l.dateISO)
    expect([...dates].sort()).toEqual(dates)
  })

  it('a surgeon on nothing returns empty', () => {
    const state = freshAppState()
    expect(contractsLinkedToSurgeon(state, FIXTURE_SURGEON)).toEqual([])
    expect(nextListsForSurgeon(state, FIXTURE_SURGEON, state.clock.todayISO)).toEqual([])
  })

  it('next Lists start today, by day then session, and leave out removed ones', () => {
    const state = freshAppState()
    const today = state.clock.todayISO
    const lists = nextListsForSurgeon(state, 'S-HALE', today)
    expect(lists.length).toBeGreaterThan(0)
    for (const l of lists) {
      expect(l.dateISO >= today).toBe(true)
      expect(l.removedAtISO).toBeUndefined()
    }
    const order = { AM: 0, PM: 1, OOH: 2 } as const
    for (let i = 1; i < lists.length; i += 1) {
      const a = lists[i - 1]!
      const b = lists[i]!
      expect(a.dateISO < b.dateISO || (a.dateISO === b.dateISO && order[a.session] <= order[b.session])).toBe(true)
    }
  })
})

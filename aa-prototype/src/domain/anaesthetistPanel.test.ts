/**
 * The anaesthetist page's side panel rows (build plan Phase 54; US-12.1.4 "Side panel"): eight
 * upcoming Lists all come back, in order; past and Draft Lists never show, today's
 * does; another anaesthetist's rows never show; a Contract linked to them but held by a hospital
 * still shows, and a Disabled one comes after the Active ones.
 */

import { describe, expect, it } from 'vitest'
import type { Contract } from './billing/contracts'
import type { List, Session } from './types'
import { linkedContractsOf, nextListsOf } from './anaesthetistPanel'

const ME = '41267'
const OTHER = '31902'
const TODAY = '2026-11-24'

function list(id: string, dateISO: string, session: Session, anaesthetistId: string | undefined): List {
  const base = { id, dateISO, session, kind: 'private', hospitalId: 'H1', surgeonId: 'S1', conflicts: [], origin: { kind: 'office' } }
  return (anaesthetistId === undefined ? { ...base, state: 'DRAFT' } : { ...base, state: 'ACTIVE', anaesthetistId, slotId: `slot-${id}` }) as unknown as List
}

function contract(id: string, name: string, linked: string | undefined, holderId: string, status: 'active' | 'disabled' = 'active'): Contract {
  return { id, name, holderId, status, linkedSurgeonIds: [], ...(linked !== undefined ? { linkedAnaesthetistId: linked } : {}) } as unknown as Contract
}

const byId = <T extends { id: string }>(rows: T[]) => Object.fromEntries(rows.map((r) => [r.id, r]))

describe('nextListsOf', () => {
  const upcoming = ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03'].map((d, i) => list(`L${i}`, d, 'AM', ME))
  const lists = byId([
    ...upcoming,
    list('PAST', '2026-11-23', 'AM', ME),
    list('DRAFT', '2026-11-25', 'AM', undefined),
    list('THEIRS', '2026-11-25', 'AM', OTHER),
  ])

  it('gives the eight upcoming Lists in order', () => {
    const rows = nextListsOf(lists, ME, TODAY)
    expect(rows.map((l) => l.id)).toEqual(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'])
  })

  it("includes today's List and never a past, Draft or another anaesthetist's List", () => {
    const ids = nextListsOf(lists, ME, TODAY).map((l) => l.id)
    expect(ids).toContain('L0')
    expect(ids).not.toContain('PAST')
    expect(ids).not.toContain('DRAFT')
    expect(ids).not.toContain('THEIRS')
  })

  it('puts AM before PM on the same day', () => {
    const rows = nextListsOf(byId([list('PM', TODAY, 'PM', ME), list('AM', TODAY, 'AM', ME)]), ME, TODAY)
    expect(rows.map((l) => l.id)).toEqual(['AM', 'PM'])
  })
})

describe('linkedContractsOf', () => {
  const contracts = byId([
    contract('C1', 'Zeta own list', ME, 'P-ME'),
    contract('C2', 'Alpha hospital list', ME, 'P-HOSPITAL'),
    contract('C3', 'Beta old list', ME, 'P-ME', 'disabled'),
    contract('C4', 'Their list', OTHER, 'P-OTHER'),
    contract('C5', 'Unlinked', undefined, 'P-HOSPITAL'),
  ])

  it('lists every Contract linked to them, a hospital-held one included, Active by name then Disabled', () => {
    expect(linkedContractsOf(contracts, ME).map((c) => c.id)).toEqual(['C2', 'C1', 'C3'])
  })

  it("never shows another anaesthetist's or an unlinked Contract", () => {
    const ids = linkedContractsOf(contracts, ME).map((c) => c.id)
    expect(ids).not.toContain('C4')
    expect(ids).not.toContain('C5')
  })
})

import { describe, expect, it } from 'vitest'
import { freshAppState, type AppState } from './appStore'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import {
  arrivalByKey,
  arrivalFeed,
  arrivalFeedCounts,
  arrivalItemsOf,
  arrivalKeyForRow,
  arrivalRows,
  connectedHospitals,
  intakeSources,
} from './intakeSelectors'

const NHI_KEY = `nhi~${SEED_STUB.rowId}`

function withNhi(state: AppState): AppState {
  const row = state.intake.rows[SEED_STUB.rowId]!
  return { ...state, intake: { ...state.intake, rows: { ...state.intake.rows, [row.id]: { ...row, corrections: { nhi: SEED_STUB.nhiToType } } } } }
}

describe('intake selectors over the seed', () => {
  it('shows the seeded row waiting for an NHI as its own item, at the foot of To decide', () => {
    const state = freshAppState()
    expect(arrivalItemsOf(state)).toBe(arrivalItemsOf(state))
    const feed = arrivalFeed(state, { kind: 'toDecide' }, '')
    expect(feed.map((g) => [g.kind, g.items.map((i) => i.key)])).toEqual([['waiting', [NHI_KEY]]])
    expect(arrivalByKey(state, NHI_KEY)).toMatchObject({ kind: 'needsNhi', title: expect.stringContaining(SEED_STUB.patientName) })
    expect(arrivalFeedCounts(state)).toMatchObject({ toDecide: 1, needsNhi: 1, roomsPdfs: 0, decided: 0 })
    expect(arrivalKeyForRow(state, SEED_STUB.rowId)).toBe(NHI_KEY)
    expect(arrivalRows(state, NHI_KEY)).toMatchObject([{ rowId: SEED_STUB.rowId, change: 'waiting', flags: ['needsNhi'] }])
    expect(arrivalKeyForRow(state, 'nope')).toBeUndefined()
    expect(arrivalRows(state, 'nope')).toEqual([])
  })

  it('once the NHI is added the row is decided under its List, and the counts move', () => {
    const state = withNhi(freshAppState())
    const counts = arrivalFeedCounts(state)
    expect(counts).toMatchObject({ toDecide: 1, needsNhi: 0, decided: 0 })
    const key = arrivalKeyForRow(state, SEED_STUB.rowId)!
    expect(key.startsWith(`${SEED_STUB.batchId}~`)).toBe(true)
    expect(arrivalByKey(state, key)).toMatchObject({ source: { kind: 'hospital' }, counts: { open: 1, waitingNhi: 0, added: 1 } })
    expect(arrivalFeed(state, { kind: 'hospital', hospitalId: arrivalByKey(state, key)!.hospitalId }, '').flatMap((g) => g.items.map((i) => i.key))).toEqual([key])
    expect(arrivalFeed(state, { kind: 'toDecide' }, 'no such patient')).toEqual([])
  })

  it('lists the connected hospitals and every source in order', () => {
    const state = freshAppState()
    expect(connectedHospitals(state).map((h) => h.name)).toEqual(['Southern Cross', "St George's"])
    expect(intakeSources(state).map((s) => [s.kind, s.state])).toEqual([
      ['hospitalFeed', 'receiving'],
      ['hospitalFeed', 'receiving'],
      ['mailbox', 'reading'],
      ['hospitalFeed', 'notConnected'],
    ])
  })
})

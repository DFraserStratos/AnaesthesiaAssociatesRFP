/**
 * The match-basis strip (build plan Phase 69, Work item 3) on the Okafor story, in the real store: the office places
 * the rooms' List in Dr Rutherford's Wed 25 Nov PM session (Sione Faleolo waiting for his NHI as a stub), then
 * St George's sends the day-before List with his NHI. Four lines, each ticked; the patients line counts by NHI and
 * by name and date of birth to the stub; never a score or a percentage.
 */

import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { OKAFOR_STORY, OKAFOR_STORY_LIST } from '../../../../../../domain/intake/hospitalDownloads'
import { HOSP, SURG } from '../../../../../../domain/seed/cast'
import { SEED_STUB } from '../../../../../../domain/seed/intakeSeed'
import type { IncomingBookingFields } from '../../../../../../domain/types'
import { slotIdFor } from '../../../../../../domain/slots'
import { OFFICE_ACTOR, freshAppState, receiveHospitalBatch, receiveMailboxPdf, stgDayBeforeRows, useAppStore } from '../../../../../../store'
import { decideArrivingLists } from '../../../../../../store/intakeDecide'
import { arrivalItemsOf } from '../../../../../../store/intakeSelectors'
import { MatchBasisStrip } from './MatchBasisStrip'

const S = OKAFOR_STORY

function ok<T>(out: { ok: true; value: T } | { ok: false; message: string }): T {
  if (!out.ok) throw new Error(out.message)
  return out.value
}

function stgUpdate(): ArrivalItem {
  const api = useAppStore
  const first = ok(receiveMailboxPdf(api, S.roomsList))
  const rows = api.getState().intake.rows
  const placeable = first.rowIds.filter((id) => rows[id]!.incoming.patient.nhi !== undefined)
  const slotId = slotIdFor(OKAFOR_STORY_LIST.anaesthetistId, OKAFOR_STORY_LIST.dateISO, OKAFOR_STORY_LIST.session)
  const listId = ok(decideArrivingLists(api, OFFICE_ACTOR, [{ rows: placeable.map((rowId) => ({ rowId, kind: 'place' as const })), placement: { kind: 'slot', slotId, surgeonId: SURG.okafor } }])).placedListIds[0]!
  const stg = ok(receiveHospitalBatch(api, S.stgDayBefore.hospitalId, S.stgDayBefore.label, stgDayBeforeRows(api.getState()), { sampleId: S.stgDayBefore.id }))
  return arrivalItemsOf(api.getState()).find((i) => i.batchId === stg.batchId && i.heldListId === listId)!
}

const strip = () => document.querySelector<HTMLElement>('[data-shot="intake-match-basis"]')
const line = (key: string) => strip()!.querySelector<HTMLElement>(`[data-key="${key}"]`)!

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('MatchBasisStrip', () => {
  it('shows the four lines, each ticked, with the patients line and no score', () => {
    const arrival = stgUpdate()
    expect(arrival.kind).toBe('update')
    render(<MatchBasisStrip arrival={arrival} />)
    const lines = Array.from(strip()!.querySelectorAll<HTMLElement>('[data-key]'))
    expect(lines.map((l) => [l.getAttribute('data-key'), l.getAttribute('data-agreed')])).toEqual([
      ['surgeon', 'true'],
      ['hospital', 'true'],
      ['daySession', 'true'],
      ['patients', 'true'],
    ])
    expect(lines.map((l) => l.querySelector('dt')?.textContent)).toEqual(['Surgeon', 'Hospital', 'Day and session', 'Patients'])
    for (const l of lines) expect(l.querySelector('[role="img"]')).toHaveAccessibleName('Agrees')
    expect(line('surgeon')).toHaveTextContent('Mr Okafor')
    expect(line('hospital')).toHaveTextContent("St George's")
    expect(line('daySession')).toHaveTextContent('Wed 25 Nov PM')
    // Ngata and Lindqvist by NHI; Sione Faleolo (no stub stands for his rooms' row) and Helen Brooks are new to the List.
    expect(line('patients')).toHaveTextContent('2 of 4 found2 by NHI')
    expect(line('patients')).not.toHaveTextContent('stub')
    const text = strip()!.textContent ?? ''
    expect(text).not.toMatch(/%|score|confiden/i)
    expect(text).not.toMatch(/[–—]/)
  })

  it('counts a patient found by name and date of birth to a stub when the NHI arrives for it', () => {
    // The seeded stub (Mere Tipene, no NHI, on Southern Cross Tue 8 Dec PM), sent again by Southern Cross with her NHI.
    const waiting = useAppStore.getState().intake.rows[SEED_STUB.rowId]!
    const row: IncomingBookingFields = { ...waiting.incoming, patient: { ...waiting.incoming.patient, nhi: SEED_STUB.nhiToType } }
    const sent = ok(receiveHospitalBatch(useAppStore, HOSP.sx, 'Southern Cross theatre list, Tue 8 Dec (updated)', [row]))
    const arrival = arrivalItemsOf(useAppStore.getState()).find((i) => i.batchId === sent.batchId && i.kind !== 'needsNhi')!
    expect(arrival.heldListId).toBe(SEED_STUB.listId)
    render(<MatchBasisStrip arrival={arrival} />)
    expect(line('patients')).toHaveAttribute('data-agreed', 'true')
    expect(line('patients')).toHaveTextContent('1 of 1 found1 by name and date of birth to a stub')
    expect(strip()!.textContent ?? '').not.toMatch(/%|score/i)
  })

  it('crosses a key that differs and names what AA holds', () => {
    const arrival = stgUpdate()
    render(<MatchBasisStrip arrival={{ ...arrival, session: 'AM' }} />)
    // The basis reads the arrival's own keys: a different session crosses Day and session only.
    expect(line('daySession')).toHaveAttribute('data-agreed', 'false')
    expect(line('daySession').querySelector('[role="img"]')).toHaveAccessibleName('Differs')
    expect(line('daySession')).toHaveTextContent('We hold Wed 25 Nov PM')
    expect(line('surgeon')).toHaveAttribute('data-agreed', 'true')
  })

  it('shows what arrived, unmarked, for an arrival with no held List', () => {
    const first = ok(receiveMailboxPdf(useAppStore, S.roomsList))
    const arrival = arrivalItemsOf(useAppStore.getState()).find((i) => i.batchId === first.batchId && i.kind === 'newList')!
    const { container } = render(<MatchBasisStrip arrival={arrival} />)
    const lines = [...container.querySelectorAll('[data-key]')]
    expect(lines.map((l) => l.getAttribute('data-key'))).toEqual(['surgeon', 'hospital', 'daySession', 'patients'])
    expect(container.querySelector('[data-agreed]')).toBeNull()
    expect(container.querySelector('[data-key="patients"]')).toHaveTextContent(/\d+ patients?/)
  })
})

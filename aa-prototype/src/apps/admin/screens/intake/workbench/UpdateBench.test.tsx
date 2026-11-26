/**
 * The update bench (build plan Phase 69; US-02.1.2, US-02.1.3, US-02.2.3, DM-17, D118) on the real store: Mr Okafor's
 * re-sent rooms' PDF read as one List-level difference table, applied as one change set with a row left out, rejected
 * with a reason, read only once locked or decided; and Mere Tipene's stub turned into a Booking by an arriving NHI.
 */

import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OKAFOR_STORY, OKAFOR_STORY_LIST, OKAFOR_STORY_PATIENTS } from '../../../../../domain/intake/hospitalDownloads'
import { SEED_STUB } from '../../../../../domain/seed/intakeSeed'
import { HOSP } from '../../../../../domain/seed/cast'
import type { IncomingBookingFields, List } from '../../../../../domain/types'
import { OFFICE_ACTOR, freshAppState, receiveHospitalBatch, receiveMailboxPdf, useAppStore } from '../../../../../store'
import { decideArrivingLists } from '../../../../../store/intakeDecide'
import { arrivalItemsOf } from '../../../../../store/intakeSelectors'
import { matchingView } from '../../../../../store/matchingSelectors'
import { UpdateBench } from './UpdateBench'

const P = OKAFOR_STORY_PATIENTS
const api = useAppStore

/** The arriving List item of a batch (never a Needs NHI item), read fresh from the store. */
function listItemOf(batchId: string) {
  const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === batchId && i.kind !== 'needsNhi')
  if (item === undefined) throw new Error(`no arriving List for ${batchId}`)
  return item
}

/** Mr Okafor's rooms PDF arrives and the office places its rows (not the one waiting for an NHI) in Dr Rutherford's free PM session. */
function placeOkaforList(): string {
  const first = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
  if (!first.ok) throw new Error(first.message)
  const s = api.getState()
  const slot = matchingView(s).openSlots.find(
    (o) => o.anaesthetistId === OKAFOR_STORY_LIST.anaesthetistId && o.dateISO === OKAFOR_STORY_LIST.dateISO && o.session === OKAFOR_STORY_LIST.session,
  )
  if (slot === undefined) throw new Error("Dr Rutherford's session is not free")
  const placeable = first.value.rowIds.filter((id) => s.intake.rows[id]!.incoming.patient.nhi !== undefined)
  const placed = decideArrivingLists(api, OFFICE_ACTOR, [
    { placement: { kind: 'slot', slotId: slot.id, surgeonId: OKAFOR_STORY_LIST.surgeonId }, rows: placeable.map((rowId) => ({ rowId, kind: 'place' as const })) },
  ])
  if (!placed.ok) throw new Error(placed.message)
  return placed.value.placedListIds[0]!
}

/** The re-sent PDF's batch. */
function resend(): string {
  const re = receiveMailboxPdf(api, OKAFOR_STORY.roomsResend)
  if (!re.ok) throw new Error(re.message)
  return re.value.batchId
}

/** The patient's Booking on a List, by NHI. */
function bookingOf(listId: string, nhi: string) {
  const s = api.getState()
  return Object.values(s.schedule.bookings).find((b) => b.listId === listId && s.masters.patients[b.patientId]?.nhi === nhi)
}

/** The seeded stub's patient (Mere Tipene, no NHI), sent again by Southern Cross with an NHI. */
function tipeneWithNhi(): { batchId: string; rowId: string } {
  const waiting = api.getState().intake.rows[SEED_STUB.rowId]!
  const row: IncomingBookingFields = {
    ...waiting.incoming,
    scheduledTime: '14:30',
    patient: { ...waiting.incoming.patient, nhi: SEED_STUB.nhiToType },
    procedure: { text: 'Laparoscopic cholecystectomy', code: 'G4' },
  }
  const out = receiveHospitalBatch(api, HOSP.sx, 'Southern Cross theatre list, Tue 8 Dec (updated)', [row])
  if (!out.ok) throw new Error(out.message)
  return { batchId: out.value.batchId, rowId: out.value.rowIds[0]! }
}

function renderBench(batchId: string, onDone = vi.fn()) {
  const utils = render(
    <MemoryRouter>
      <UpdateBench arrival={listItemOf(batchId)} actor={OFFICE_ACTOR} onDone={onDone} />
    </MemoryRouter>,
  )
  return { ...utils, onDone }
}

const q = (sel: string) => document.querySelector<HTMLElement>(sel)
const bench = () => q('[data-shot="intake-bench-update"]')!
const rowEl = (sel: string) => bench().querySelector<HTMLElement>(`tr[data-row-id]${sel}`)!

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('UpdateBench: a re-sent rooms PDF', () => {
  it('reads the List line, the removal ticked by default and the change count; nothing changes before Apply', () => {
    placeOkaforList()
    const batchId = resend()
    const auditBefore = api.getState().audit.length
    const scheduleBefore = api.getState().schedule
    renderBench(batchId)

    expect(bench()).toBeInTheDocument()
    const line = q('[data-shot="intake-update-list-line"]')!
    expect(line).toHaveTextContent("Dr Rutherford's List")
    expect(line).toHaveTextContent('Active, open to changes until it is authorised')

    const removal = rowEl('[data-change="removed"]')
    expect(removal).toHaveAttribute('data-ticked', 'true')
    expect(within(removal).getByRole('checkbox')).toBeChecked()

    expect(q('[data-shot="intake-update-count"]')!.textContent).toMatch(/^\d+ changes? on \d+ Bookings?/)
    expect(q('[data-shot="matching-apply"]')).toBeInTheDocument()

    expect(api.getState().audit).toHaveLength(auditBefore)
    expect(api.getState().schedule).toBe(scheduleBefore)
  })

  it('unticked, a changed row is left out; the removal cancels its Booking on its List; one change set', () => {
    const listId = placeOkaforList()
    const batchId = resend()
    const pike = bookingOf(listId, P.pike.nhi)!
    const from = api.getState().audit.length
    const { onDone } = renderBench(batchId)

    const changed = rowEl('[data-change="changed"]')
    const changedRowId = changed.getAttribute('data-row-id')!
    fireEvent.click(within(changed).getByRole('checkbox'))
    expect(changed).toHaveAttribute('data-ticked', 'false')

    fireEvent.click(q('[data-shot="matching-apply"]')!)
    expect(onDone).toHaveBeenCalledTimes(1)

    const s = api.getState()
    expect(s.intake.rows[changedRowId]!.status).toBe('leftOut')
    const cancelled = s.schedule.bookings[pike.id]!
    expect(cancelled.cancellation).toBeDefined()
    expect(cancelled.listId).toBe(listId)

    const entries = s.audit.slice(from)
    expect(entries.length).toBeGreaterThan(0)
    const sets = new Set(entries.map((a) => a.changeSetId))
    expect(sets.size).toBe(1)
    expect([...sets][0]).toBeDefined()
  })

  it('Reject needs a reason; a quick reason rejects every row and changes no Booking', () => {
    placeOkaforList()
    const batchId = resend()
    const rowIds = listItemOf(batchId).rowIds
    const scheduleBefore = api.getState().schedule
    const { onDone } = renderBench(batchId)

    fireEvent.click(q('[data-shot="intake-update-reject"]')!)
    expect(q('[data-shot="intake-update-reject-form"]')).toBeInTheDocument()
    const rejectList = within(bench()).getByRole('button', { name: 'Reject List' })
    expect(rejectList).toBeDisabled()

    fireEvent.click(within(bench()).getByRole('button', { name: 'Not an AA booking' }))
    expect(rejectList).toBeEnabled()
    fireEvent.click(rejectList)
    expect(onDone).toHaveBeenCalledTimes(1)

    const s = api.getState()
    for (const id of rowIds) {
      const row = s.intake.rows[id]!
      if (row.status === 'open') continue // a row waiting for its NHI stays open for Needs NHI
      expect(row).toMatchObject({ status: 'rejected', decision: { kind: 'reject', reason: 'Not an AA booking' } })
    }
    expect(rowIds.some((id) => s.intake.rows[id]!.status === 'rejected')).toBe(true)
    expect(s.schedule).toBe(scheduleBefore)
  })

  it('a locked (authorised) List shows the lock and no Apply', () => {
    const listId = placeOkaforList()
    const batchId = resend()
    const s0 = api.getState()
    api.setState({ schedule: { ...s0.schedule, lists: { ...s0.schedule.lists, [listId]: { ...s0.schedule.lists[listId]!, state: 'AUTHORISED' } as List } } })
    renderBench(batchId)

    expect(q('[data-shot="intake-update-locked"]')).toHaveTextContent('This List is authorised and locked.')
    expect(q('[data-shot="matching-apply"]')).toBeNull()
  })

  it('a decided arrival reads its applied and left-out counts, with no Apply', () => {
    placeOkaforList()
    const batchId = resend()
    const first = renderBench(batchId)
    const changed = rowEl('[data-change="changed"]')
    fireEvent.click(within(changed).getByRole('checkbox'))
    fireEvent.click(q('[data-shot="matching-apply"]')!)
    expect(first.onDone).toHaveBeenCalledTimes(1)
    first.unmount()

    const item = listItemOf(batchId)
    const rows = api.getState().intake.rows
    const applied = item.rowIds.filter((id) => rows[id]!.status === 'applied').length
    const leftOut = item.rowIds.filter((id) => rows[id]!.status === 'leftOut').length
    expect(applied).toBeGreaterThan(0)
    expect(leftOut).toBe(1)

    renderBench(batchId)
    const decided = q('[data-shot="intake-update-decided"]')!
    expect(decided).toHaveTextContent(`${applied} ${applied === 1 ? 'row' : 'rows'} applied`)
    expect(decided).toHaveTextContent(`${leftOut} left out`)
    expect(q('[data-shot="matching-apply"]')).toBeNull()
    expect(q('[data-shot="intake-update-footer"]')).toBeNull()
  })

  it('copy: no dashes, no build vocabulary, no percentages or scores', () => {
    placeOkaforList()
    const batchId = resend()
    renderBench(batchId)
    const text = bench().textContent ?? ''
    expect(text.length).toBeGreaterThan(0)
    expect(text).not.toMatch(/[–—]/)
    expect(text).not.toMatch(/\b(slots?|swaps?|timesheets?)\b/i)
    expect(text).not.toContain('%')
    expect(text).not.toMatch(/score/i)
  })
})

describe('UpdateBench: an arriving NHI turns the stub into a Booking (DM-17)', () => {
  it('reads the stub row and card, and Apply resolves the stub', () => {
    const arriving = tipeneWithNhi()
    expect(api.getState().intake.stubs[SEED_STUB.stubId]!.status).toBe('standing')
    const { onDone } = renderBench(arriving.batchId)

    expect(rowEl(`[data-row-id="${arriving.rowId}"]`)).toHaveTextContent('NHI arrives, stub becomes a Booking')
    expect(q('[data-shot="intake-update-stub"]')).toHaveTextContent('On apply: stub becomes a Booking.')

    fireEvent.click(q('[data-shot="matching-apply"]')!)
    expect(onDone).toHaveBeenCalledTimes(1)
    const stub = api.getState().intake.stubs[SEED_STUB.stubId]!
    expect(stub.status).not.toBe('standing')
    expect(stub.status).toBe('resolved')
  })
})

/**
 * Where it lands (build plan Phase 69, Work item 3) in the real store: the List the office placed from the rooms' PDF
 * in Dr Rutherford's Wed 25 Nov PM session names the anaesthetist, day and session, hospital, surgeon and Bookings,
 * its state in words, and links to that day's Day view; a List that is gone reads as a quiet empty state.
 */

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OKAFOR_STORY, OKAFOR_STORY_LIST } from '../../../../../../domain/intake/hospitalDownloads'
import { SURG } from '../../../../../../domain/seed/cast'
import { slotIdFor } from '../../../../../../domain/slots'
import { OFFICE_ACTOR, freshAppState, receiveMailboxPdf, useAppStore } from '../../../../../../store'
import { decideArrivingLists } from '../../../../../../store/intakeDecide'
import { SlotCard } from './SlotCard'

function placedOkaforList(): string {
  const api = useAppStore
  const first = receiveMailboxPdf(api, OKAFOR_STORY.roomsList)
  if (!first.ok) throw new Error(first.message)
  const rows = api.getState().intake.rows
  const placeable = first.value.rowIds.filter((id) => rows[id]!.incoming.patient.nhi !== undefined)
  const slotId = slotIdFor(OKAFOR_STORY_LIST.anaesthetistId, OKAFOR_STORY_LIST.dateISO, OKAFOR_STORY_LIST.session)
  const out = decideArrivingLists(api, OFFICE_ACTOR, [{ rows: placeable.map((rowId) => ({ rowId, kind: 'place' as const })), placement: { kind: 'slot', slotId, surgeonId: SURG.okafor } }])
  if (!out.ok) throw new Error(out.message)
  return out.value.placedListIds[0]!
}

function renderCard(listId: string | undefined, title?: string) {
  return render(
    <MemoryRouter>
      <SlotCard listId={listId} {...(title !== undefined ? { title } : {})} />
    </MemoryRouter>,
  )
}

const card = () => document.querySelector<HTMLElement>('[data-shot="intake-slot-card"]')!

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('SlotCard', () => {
  it('names the anaesthetist, day and session, where, the Bookings and the List state, with a link to the Day view', () => {
    const listId = placedOkaforList()
    renderCard(listId)
    expect(card()).toHaveAttribute('data-list-id', listId)
    expect(card()).toHaveAttribute('data-list-state', 'ACTIVE')
    expect(screen.getByRole('heading', { level: 3, name: 'Where it lands' })).toBeInTheDocument()
    expect(card()).toHaveTextContent('Dr Rutherford · Wed 25 Nov PM')
    expect(card()).toHaveTextContent("St George's · Mr Okafor · 3 Bookings")
    expect(card()).toHaveTextContent('Active, open to changes until it is authorised')
    const link = screen.getByRole('link', { name: /Day view/ })
    expect(link).toHaveAttribute('href', '/admin/day/2026-11-25')
    expect(card().textContent ?? '').not.toMatch(/[–—]|\bslot\b/i)
  })

  it('reads an authorised List as locked, and takes another title', () => {
    const listId = placedOkaforList()
    const s = useAppStore.getState()
    const list = s.schedule.lists[listId]!
    if (list.state === 'DRAFT') throw new Error('expected an assigned List')
    useAppStore.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...list, state: 'AUTHORISED' } } } })
    renderCard(listId, 'Its List')
    expect(card()).toHaveAttribute('data-list-state', 'AUTHORISED')
    expect(card()).toHaveTextContent('Authorised and locked')
    expect(screen.getByRole('heading', { level: 3, name: 'Its List' })).toBeInTheDocument()
  })

  it('a List that is gone reads as a quiet empty state, with no link', () => {
    renderCard('L-NOT-THERE')
    expect(card()).toHaveTextContent('This List is no longer on the schedule.')
    expect(card()).not.toHaveAttribute('data-list-id')
    expect(screen.queryByRole('link')).toBeNull()
  })
})

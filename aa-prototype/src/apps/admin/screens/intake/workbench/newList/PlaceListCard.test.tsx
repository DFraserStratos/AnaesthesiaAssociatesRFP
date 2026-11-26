/**
 * Place this List (build plan Phase 70; DM-19): the named anaesthetist's session suggested and chosen first, the
 * button naming the result, the summary counting Bookings and the stub, a Draft List placing as one act, and a
 * session taken meanwhile refused in place.
 */

import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OFFICE_ACTOR, arrivalItemsOf, freshAppState, receiveMailboxPdf, useAppStore } from '../../../../../../store'
import { assignListToSlot } from '../../../../../../store/slotActions'
import { OKAFOR_ROOMS_PDF, OKAFOR_STORY_LIST } from '../../../../../../domain/intake/hospitalDownloads'
import { PlaceListCard } from './PlaceListCard'

function okaforArrival() {
  const out = receiveMailboxPdf(useAppStore, OKAFOR_ROOMS_PDF)
  if (!out.ok) throw new Error(out.message)
  return arrivalItemsOf(useAppStore.getState()).find((i) => i.batchId === out.value.batchId && i.kind === 'newList')!
}

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
const submit = () => q('[data-shot="intake-place-list-submit"]') as HTMLButtonElement

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('PlaceListCard', () => {
  it("suggests Dr Rutherford's PM, checked, and names the result", () => {
    const arrival = okaforArrival()
    render(<PlaceListCard arrival={arrival} actor={OFFICE_ACTOR} onPlaced={() => {}} />)
    const suggested = q('[data-place-option="suggested"]')!
    expect(suggested.getAttribute('aria-checked')).toBe('true')
    expect(suggested.textContent).toContain("Dr Rutherford's PM, Wed 25 Nov")
    expect(suggested.textContent).toContain('Suggested')
    expect(submit().textContent).toBe("Place in Dr Rutherford's PM")
    expect(q('[data-shot="intake-place-list-summary"]')!.textContent).toBe('Creates the List with 3 Bookings and a stub for Sione Faleolo.')
    expect(document.querySelectorAll('[data-place-option="session"]').length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/slot|[–—]/i)
  })

  it('makes a Draft List in one act', () => {
    const arrival = okaforArrival()
    const onPlaced = vi.fn()
    render(<PlaceListCard arrival={arrival} actor={OFFICE_ACTOR} onPlaced={onPlaced} />)
    fireEvent.click(q('[data-place-option="draft"]')!)
    expect(submit().textContent).toBe('Make a Draft List')
    fireEvent.click(submit())
    expect(onPlaced).toHaveBeenCalledTimes(1)
    const listId = onPlaced.mock.calls[0]![0].listId as string
    expect(useAppStore.getState().schedule.lists[listId]?.state).toBe('DRAFT')
  })

  it('drops a session taken meanwhile: no suggestion, a quiet line, nothing chosen', () => {
    const arrival = okaforArrival()
    const onPlaced = vi.fn()
    render(<PlaceListCard arrival={arrival} actor={OFFICE_ACTOR} onPlaced={onPlaced} />)
    const slotId = q('[data-place-option="suggested"]')!.getAttribute('data-slot-id')!
    // Taken behind the card's back (another surgeon's List in Dr Rutherford's session).
    const other = Object.keys(useAppStore.getState().masters.surgeons).find((id) => id !== OKAFOR_STORY_LIST.surgeonId)!
    act(() => {
      expect(assignListToSlot(useAppStore, OFFICE_ACTOR, slotId, { hospitalId: OKAFOR_STORY_LIST.hospitalId, surgeonId: other, kind: 'private' }).ok).toBe(true)
    })
    expect(q('[data-place-option="suggested"]')).toBeNull()
    expect(q('[data-slot-id="' + slotId + '"]')).toBeNull()
    expect(q('[data-shot="intake-place-list-named-busy"]')!.textContent).toContain('Dr Rutherford')
    expect(submit().disabled).toBe(true)
    expect(onPlaced).not.toHaveBeenCalled()
  })

  it('is disabled with the reason given', () => {
    const arrival = okaforArrival()
    render(<PlaceListCard arrival={arrival} actor={OFFICE_ACTOR} onPlaced={() => {}} disabledReason="Correct the invalid NHI first." />)
    expect(submit().disabled).toBe(true)
    expect(document.body.textContent).toContain('Correct the invalid NHI first.')
  })
})

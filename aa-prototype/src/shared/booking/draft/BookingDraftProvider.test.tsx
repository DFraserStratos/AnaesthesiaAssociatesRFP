import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SEED_MARKERS } from '../../../domain/seed'
import {
  createAppStore,
  editBooking,
  editProcedure,
  onAppEvent,
  OFFICE_ACTOR,
  proceduresForBooking,
  setProcedureContract,
  type BoundAppStore,
} from '../../../store'
import { resetDomainState } from '../../../store/mutate'
import { BookingDraftProvider, DRAFT_RESET_NOTICE } from './BookingDraftProvider'
import { useBookingApi, useBookingDraft, useBookingStoreMode, type BookingDraftValue } from './BookingStoreContext'

const BOOKING_ID = SEED_MARKERS.pendingCaptureBooking!.entityId

interface Seen {
  api: BoundAppStore
  draft: BookingDraftValue | null
  mode: string
}

function Probe({ seen }: { seen: { current: Seen | null } }) {
  seen.current = { api: useBookingApi(), draft: useBookingDraft(), mode: useBookingStoreMode() }
  return null
}

function mount(real: BoundAppStore) {
  const seen: { current: Seen | null } = { current: null }
  render(
    <BookingDraftProvider bookingId={BOOKING_ID} real={real}>
      <Probe seen={seen} />
    </BookingDraftProvider>,
  )
  const get = (): Seen => {
    if (seen.current === null) throw new Error('Probe never rendered')
    return seen.current
  }
  return get
}

const notesOf = (api: BoundAppStore) => api.getState().schedule.bookings[BOOKING_ID]?.notes
const timeOf = (api: BoundAppStore) => api.getState().schedule.bookings[BOOKING_ID]?.scheduledTime

describe('BookingDraftProvider', () => {
  it('gives its children the draft store, in draft mode', () => {
    const real = createAppStore()
    const get = mount(real)
    expect(get().mode).toBe('draft')
    expect(get().api).not.toBe(real)
    expect(get().draft?.dirty).toBe(false)
  })

  it('keeps a drafted write out of the real store, and discard restores the draft', () => {
    const real = createAppStore()
    const get = mount(real)
    const before = notesOf(real)
    act(() => {
      expect(editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { notes: 'Drafted note' }).ok).toBe(true)
    })
    expect(notesOf(get().api)).toBe('Drafted note')
    expect(notesOf(real)).toBe(before)
    expect(get().draft?.dirty).toBe(true)
    expect(get().draft?.changes.some((c) => c.entityType === 'booking' && c.field === 'notes')).toBe(true)

    act(() => get().draft!.discard())
    expect(get().draft?.dirty).toBe(false)
    expect(notesOf(get().api)).toBe(before)
  })

  it('follows a real change while clean, and stops following once dirty', () => {
    const real = createAppStore()
    const get = mount(real)
    act(() => {
      editBooking(real, OFFICE_ACTOR, BOOKING_ID, { notes: 'Saved elsewhere' })
    })
    expect(notesOf(get().api)).toBe('Saved elsewhere')
    expect(get().draft?.dirty).toBe(false)

    act(() => {
      editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { notes: 'Mine, unsaved' })
    })
    const draftTime = timeOf(get().api)
    act(() => {
      editBooking(real, OFFICE_ACTOR, BOOKING_ID, { scheduledTime: '17:55' })
    })
    expect(timeOf(real)).toBe('17:55')
    expect(timeOf(get().api)).toBe(draftTime)
    expect(notesOf(get().api)).toBe('Mine, unsaved')
    expect(get().draft?.dirty).toBe(true)
  })

  it('is clean again when an edit is undone by hand', () => {
    const real = createAppStore()
    const get = mount(real)
    const original = timeOf(real)!
    act(() => {
      editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { scheduledTime: '17:55' })
    })
    expect(get().draft?.dirty).toBe(true)
    act(() => {
      editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { scheduledTime: original })
    })
    expect(get().draft?.dirty).toBe(false)
    expect(get().draft?.changes).toEqual([])
  })

  it('saves the changes to the real store as one change set', () => {
    const real = createAppStore()
    const get = mount(real)
    const auditBefore = real.getState().audit.length
    act(() => {
      editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { notes: 'Saved note' })
      editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { scheduledTime: '17:55' })
    })
    let out: ReturnType<BookingDraftValue['save']> | undefined
    act(() => {
      out = get().draft!.save(OFFICE_ACTOR)
    })
    expect(out?.ok).toBe(true)
    expect(notesOf(real)).toBe('Saved note')
    expect(timeOf(real)).toBe('17:55')
    const written = real.getState().audit.slice(auditBefore)
    expect(written.length).toBeGreaterThan(0)
    const ids = new Set(written.map((e) => e.changeSetId))
    expect(ids.size).toBe(1)
    expect([...ids][0]).toBeDefined()
    expect(written[0]?.action).toBe('booking.save')
    expect(get().draft?.dirty).toBe(false)
  })

  // The Reset is seen when the real audit no longer continues the one the draft copied. (A Reset of a
  // store still exactly at the seed changes nothing the draft could see: the seed is built once.)
  it('discards a dirty draft with one line of notice on a demo Reset', () => {
    const real = createAppStore()
    const get = mount(real)
    act(() => {
      editBooking(real, OFFICE_ACTOR, BOOKING_ID, { notes: 'Saved first' })
    })
    act(() => {
      editBooking(get().api, OFFICE_ACTOR, BOOKING_ID, { scheduledTime: '17:55' })
    })
    expect(get().draft?.dirty).toBe(true)
    act(() => resetDomainState(real))
    expect(get().draft?.dirty).toBe(false)
    expect(get().draft?.notice).toBe(DRAFT_RESET_NOTICE)
    expect(notesOf(get().api)).toBe(notesOf(real))
    expect(timeOf(get().api)).toBe(timeOf(real))
  })

  it('drafts a Contract or Procedure edit without an app event or a billing write', () => {
    const real = createAppStore()
    const get = mount(real)
    const procedure = proceduresForBooking(get().api.getState(), BOOKING_ID)[0]!
    const billingBefore = real.getState().billing
    const events: unknown[] = []
    const off = onAppEvent((e) => events.push(e))
    try {
      act(() => {
        expect(editProcedure(get().api, OFFICE_ACTOR, procedure.id, { opNotes: 'Drafted procedure note' }).ok).toBe(true)
        // The first Contract the store accepts for this Procedure.
        for (const id of Object.keys(get().api.getState().masters.contracts)) {
          if (id === procedure.governingContractId) continue
          if (setProcedureContract(get().api, OFFICE_ACTOR, procedure.id, id).ok) break
        }
      })
    } finally {
      off()
    }
    expect(get().api.getState().schedule.procedures[procedure.id]?.governingContractId).not.toBe(procedure.governingContractId)
    expect(events).toEqual([])
    expect(real.getState().billing).toBe(billingBefore)
    expect(real.getState().schedule.procedures[procedure.id]).toBe(procedure)
    expect(get().draft?.dirty).toBe(true)
  })
})

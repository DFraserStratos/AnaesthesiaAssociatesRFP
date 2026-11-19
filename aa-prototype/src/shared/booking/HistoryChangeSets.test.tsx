import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, OFFICE_ACTOR, replaceProcedureText, saveBookingPatch, SECOND_OFFICE_ACTOR, useAppStore, withChangeSet, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { HistorySheet } from './HistorySheet'
import { SEED_MARKERS } from '../../domain/seed'

/** The Booking's change history (catch-up Phase 35; US-02.5.8): who, when and what, one row per save. */
const HOSPITAL: Actor = { who: 'Hospital booking download', role: 'system', source: 'integration' }
const BOOKING = SEED_MARKERS['pendingCaptureBooking']!.entityId

function renderHistory() {
  const s = useAppStore.getState()
  const procedureIds = Object.values(s.schedule.procedures).filter((p) => p.bookingId === BOOKING).map((p) => p.id)
  return render(
    <SurfaceProvider variant="web">
      <HistorySheet open entityIds={[BOOKING, ...procedureIds]} title="Booking history" onClose={() => {}} coverListId={s.schedule.bookings[BOOKING]!.listId} />
    </SurfaceProvider>,
  )
}

describe('the Booking change history', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('names each office user on their own grouped save', () => {
    expect(saveBookingPatch(useAppStore, OFFICE_ACTOR, BOOKING, { booking: { notes: 'Rooms called', scheduledTime: '09:40' } }).ok).toBe(true)
    expect(saveBookingPatch(useAppStore, SECOND_OFFICE_ACTOR, BOOKING, { booking: { notes: 'Rooms called again' } }).ok).toBe(true)
    const { container } = renderHistory()
    const rows = container.querySelectorAll('[data-shot="history-change-set"]')
    expect(rows).toHaveLength(2)
    expect(within(rows[0] as HTMLElement).getByText('Saved by Sam T.')).toBeTruthy()
    expect(within(rows[1] as HTMLElement).getByText('Saved by Kirsty W.')).toBeTruthy()
    expect(within(rows[1] as HTMLElement).getByText('2 changes')).toBeTruthy()
  })

  it("names the hospital's list and shows the procedure text it replaced", () => {
    const procedure = Object.values(useAppStore.getState().schedule.procedures).find((p) => p.bookingId === BOOKING && p.procedureText !== null)!
    const held = procedure.procedureText!.text
    const out = withChangeSet(useAppStore, 'match', () => replaceProcedureText(useAppStore, HOSPITAL, procedure.id, { text: 'Hospital wording for this', source: 'hospitalDownload' }))
    expect(out.ok && out.value.replaced).toBe(true)
    renderHistory()
    expect(screen.getByText("Updated from the hospital's list")).toBeTruthy()
    expect(screen.getAllByText((t) => t.includes(held)).length).toBeGreaterThan(0)
    expect(screen.getAllByText((t) => t.includes('Hospital booking download')).length).toBeGreaterThan(0)
  })
})

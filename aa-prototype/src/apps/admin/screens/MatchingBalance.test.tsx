/**
 * Catch-up Phase 40 (item 13) on the Matching screen: a row whose NHI matches a
 * record with a balance previews the warning before the decision, Create
 * Booking repeats it, and a row waiting for an NHI links to Waiting for NHI.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, OFFICE_ACTOR, useAppStore, warningsForBooking } from '../../../store'
import { emptyIntakeSlice } from '../../../store/appStore'
import { SurfaceProvider } from '../../../shared'
import { NO_NHI_LIST } from '../../../domain/intake/hospitalDownloads'
import { importHospitalDownload } from '../../../store/matchingActions'
import { MatchingScreen } from './MatchingScreen'

afterEach(cleanup)

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/admin/intake/matching']}>
      <SurfaceProvider variant="web">
        <MatchingScreen actor={OFFICE_ACTOR} todayISO="2026-07-21" onOpenBooking={() => undefined} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

describe('the balance warning on Matching (catch-up Phase 40)', () => {
  beforeEach(() => {
    useAppStore.setState({ ...freshAppState(), intake: emptyIntakeSlice() })
  })

  it("previews Sarah Mitchell's strong warning before the decision, then the result repeats it", () => {
    const { container } = renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /Import hospital file/ }))
    fireEvent.click(within(container.ownerDocument.querySelector('[data-shot="matching-import"]') as HTMLElement).getByRole('button', { name: 'Import' }))
    const panel = screen.getByTestId('matching-panel')
    const preview = panel.querySelector('[data-shot="matching-balance-preview"]') as HTMLElement
    expect(preview).toHaveAttribute('data-strength', 'strong')
    expect(preview).toHaveTextContent('Sarah Mitchell owes $610.00 on 1 invoice, unpaid 98 days')
    expect(preview).toHaveTextContent('Staff can go ahead. The warning stays on the to-do list until cleared.')
    expect(within(preview).getByRole('button', { name: 'Open patient record' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Create Booking' })).toBeEnabled()

    fireEvent.click(within(panel).getByRole('button', { name: 'Create Booking' }))
    const banner = container.ownerDocument.querySelector('[data-shot="matching-banner"]') as HTMLElement
    expect(banner.querySelector('[data-shot="matching-balance-result"]')).toHaveTextContent('Booking created. Strong balance warning on the to-do list.')
    const decided = Object.values(useAppStore.getState().intake.rows).find((r) => r.status === 'applied')!
    const bookingId = decided.decision !== undefined && 'bookingId' in decided.decision ? decided.decision.bookingId : ''
    expect(warningsForBooking(useAppStore.getState(), bookingId).filter((w) => w.ruleId === 'patientBalance')).toHaveLength(1)
  })

  it('a row waiting for an NHI keeps its No NHI pill and links to Waiting for NHI', () => {
    importHospitalDownload(useAppStore, OFFICE_ACTOR, NO_NHI_LIST.id)
    const { container } = renderScreen()
    const links = container.querySelectorAll('[data-shot="matching-waiting-link"]')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/admin/patients/waiting')
    expect(links[0]!.parentElement).toHaveTextContent('No NHI')
  })
})

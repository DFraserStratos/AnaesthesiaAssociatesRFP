/**
 * The office's Change status sheet (catch-up Phase 32b; US-01.5.5, US-01.5.4,
 * D59, D60): an empty session saves at once; closing a session that holds a
 * List forces "Where does this List go?", then the vacated choice.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE } from '../../../domain/seed'
import { slotIdFor } from '../../../domain/slots'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { SessionStatusSheet } from './SessionStatusSheet'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const CHEN_PM_SLOT = slotIdFor(ANAE.chen, '2026-11-24', 'PM')
const CHEN_PM = `L-${ANAE.chen}-2026-11-24-PM`

function renderSheet(slotId: string) {
  return render(
    <SurfaceProvider variant="web">
      <SessionStatusSheet open slotId={slotId} actor={OFFICE} onClose={vi.fn()} />
    </SurfaceProvider>,
  )
}

const chooseStatus = (label: RegExp) => fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Status' })).getByRole('radio', { name: label }))

describe('SessionStatusSheet', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('an empty session saves at once', () => {
    const slotId = slotIdFor(ANAE.sharma, '2026-11-24', 'PM')
    renderSheet(slotId)
    chooseStatus(/Unavailable/)
    fireEvent.click(screen.getByRole('button', { name: 'Save status' }))
    expect(useAppStore.getState().schedule.slots[slotId]?.status).toBe('unavailable')
    expect(screen.getByText('Status saved')).toBeInTheDocument()
  })

  it('closing a booked session forces Return to the office or a colleague, then the vacated choice (the status being set first, no provisional text)', () => {
    const { container } = renderSheet(CHEN_PM_SLOT)
    chooseStatus(/Unavailable/)
    expect(container.querySelector('[data-shot="office-status-holds-list"]')).toHaveTextContent('Next, choose whether it goes back to the office or to a colleague.')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Where does this List go?')).toBeInTheDocument()
    fireEvent.click(container.querySelector('[data-shot="office-status-choice-office"]') as HTMLElement)
    const group = screen.getByRole('radiogroup', { name: /session after the move/ })
    expect(within(group).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Unavailable', 'Free'])
    expect(within(group).getByRole('radio', { name: 'Unavailable' })).toHaveAttribute('aria-checked', 'true')
    expect(document.body.textContent).not.toMatch(/still being confirmed|Keep as is|slot|conflict/i)
    fireEvent.click(screen.getByRole('button', { name: 'Return to the office' }))
    expect(useAppStore.getState().schedule.lists[CHEN_PM]).toMatchObject({ state: 'DRAFT', draft: { origin: 'unavailableReturn' } })
    expect(useAppStore.getState().schedule.slots[CHEN_PM_SLOT]?.status).toBe('unavailable')
    expect(screen.getByText('Returned to the office')).toBeInTheDocument()
  })

  it('a hand-on lists open colleagues in tier order with closed ones apart and unselectable; Free can be chosen for the session', () => {
    const { container } = renderSheet(CHEN_PM_SLOT)
    chooseStatus(/Unavailable/)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(container.querySelector('[data-shot="office-status-choice-colleague"]') as HTMLElement)
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-shot="candidates-clear"] button[data-candidate]'))
    const tiers = rows.map((r) => Number(r.querySelector('[data-tier]')?.getAttribute('data-tier')))
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
    const closed = container.querySelector('[data-shot="office-status-not-available"]') as HTMLElement
    expect(closed.querySelector(`[data-candidate-closed="${ANAE.ngata}"]`)?.tagName).not.toBe('BUTTON')
    const pick = rows[0]!
    const pickedId = pick.getAttribute('data-candidate')!
    fireEvent.click(pick)
    fireEvent.click(within(screen.getByRole('radiogroup', { name: /session after the move/ })).getByRole('radio', { name: 'Free' }))
    fireEvent.click(container.querySelector('[data-shot="office-status-confirm-button"] button') as HTMLElement)
    expect(useAppStore.getState().schedule.lists[CHEN_PM]).toMatchObject({ state: 'ACTIVE', anaesthetistId: pickedId })
    expect(useAppStore.getState().schedule.slots[CHEN_PM_SLOT]?.status).toBe('free')
  })
})

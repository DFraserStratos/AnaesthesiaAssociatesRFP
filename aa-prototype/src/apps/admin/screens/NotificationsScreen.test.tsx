/**
 * Notices that resolve, on the page and the rail card (catch-up Phase 32b;
 * US-13.8.1, US-13.8.3): the active count, the tick (the To-do card's shape),
 * the row leaving for everyone, Show resolved with who and when, and no
 * provisional caption.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alertOffice, freshAppState, stageColleagueMoveToOffice, useAppStore } from '../../../store'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../../store/demoActors'
import { SEED_LIST_IDS } from '../../../domain/seed'
import { NotificationsScreen } from './NotificationsScreen'
import { NotificationsCard } from '../components/NotificationsCard'

function renderPage(path = '/admin/notifications') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/notifications" element={<NotificationsScreen actor={OFFICE_ACTOR} onOpen={vi.fn()} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Notifications: active or resolved', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
    vi.useFakeTimers()
    expect(stageColleagueMoveToOffice(useAppStore).ok).toBe(true)
    expect(alertOffice(useAppStore, SOUTER_ACTOR, { listId: SEED_LIST_IDS.souterAm21, note: 'Is the funder right?' }).ok).toBe(true)
  })
  afterEach(() => vi.useRealTimers())

  it('shows the active count, the alert with its note, and no provisional caption', () => {
    const { container } = renderPage()
    expect(container.querySelector('[data-shot="admin-notifications-page-count"]')).toHaveTextContent('2')
    expect(container.querySelector('[data-shot="admin-notifications-provisional"]')).toBeNull()
    expect(document.body.textContent).not.toMatch(/still being confirmed/)
    expect(screen.getByText(/^Dr .* asked the office to check/)).toBeInTheDocument()
    expect(container.querySelector('[data-shot="notification-alert-note"]')).toHaveTextContent('Note: "Is the funder right?"')
  })

  it('a tick plays the complete-tick, resolves the notice for everyone and the row leaves; Show resolved brings it back with who and when', () => {
    const { container } = renderPage()
    const alertRow = Array.from(container.querySelectorAll<HTMLElement>('[data-notification-row]')).find((r) => r.textContent?.includes('asked the office'))!
    const id = alertRow.getAttribute('data-notification-row')!
    fireEvent.click(within(alertRow).getByRole('button', { name: /^Resolve notice: / }))
    act(() => vi.advanceTimersByTime(500))
    expect(useAppStore.getState().notifications[id]).toMatchObject({ resolvedBy: 'Kirsty W.' })
    expect(container.querySelector(`[data-notification-row="${id}"]`)).toBeNull()
    expect(container.querySelector('[data-shot="admin-notifications-page-count"]')).toHaveTextContent('1')
    fireEvent.click(container.querySelector('[data-shot="admin-notifications-show-resolved"]') as HTMLElement)
    const back = container.querySelector(`[data-notification-row="${id}"]`) as HTMLElement
    expect(back.getAttribute('data-notification-resolved')).toBe('true')
    expect(back).toHaveTextContent(/Resolved by Kirsty W\., Tue 24 Nov, \d\d:\d\d/)
    expect(within(back).queryByRole('button', { name: /^Resolve notice/ })).toBeNull()
  })

  it('reads as a feed: a day band, a short headline, the List on its own line, and the open action as words', () => {
    const { container } = renderPage()
    const card = container.querySelector('[data-shot="admin-notifications-table"]') as HTMLElement
    expect(card).toHaveTextContent(/Today, Tue 24 Nov\s*2 notices/)
    expect(within(card).getByText(/^Dr .* returned a List to the office$/)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Open Draft List' })).toBeInTheDocument()
    expect(container.querySelector('[data-shot="admin-notifications-resolved-today"]')).toHaveTextContent('Nothing resolved yet today.')
  })

  it('a resolved notice joins the rail\'s Resolved today with who and when', () => {
    const { container } = renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /^Resolve notice: / })[0]!)
    act(() => vi.advanceTimersByTime(500))
    expect(container.querySelector('[data-shot="admin-notifications-resolved-today"]')).toHaveTextContent(/Kirsty W\., \d\d:\d\d/)
  })

  it('the rail card carries the count and the same tick; a ticked row leaves the card', () => {
    const { container } = render(<NotificationsCard actor={OFFICE_ACTOR} onOpen={vi.fn()} onSeeAll={vi.fn()} />)
    expect(container.querySelector('[data-shot="admin-notifications-count"]')).toHaveTextContent('2')
    const ticks = screen.getAllByRole('button', { name: /^Resolve notice: / })
    expect(ticks).toHaveLength(2)
    fireEvent.click(ticks[0]!)
    act(() => vi.advanceTimersByTime(500))
    expect(screen.getAllByRole('button', { name: /^Resolve notice: / })).toHaveLength(1)
    expect(container.querySelector('[data-shot="admin-notifications-count"]')).toHaveTextContent('1')
  })
})

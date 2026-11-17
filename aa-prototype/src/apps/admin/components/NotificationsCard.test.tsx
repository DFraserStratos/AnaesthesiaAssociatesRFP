/**
 * The Notifications rail card on the shared `Card` (UI unification U6): a section named by its
 * heading, and after a tick the row leaves and focus goes to the heading (`useResolveWithTick`).
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alertOffice, freshAppState, stageColleagueMoveToOffice, useAppStore } from '../../../store'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../../store/demoActors'
import { SEED_LIST_IDS } from '../../../domain/seed'
import { NotificationsCard } from './NotificationsCard'

describe('NotificationsCard', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
    vi.useFakeTimers()
    expect(stageColleagueMoveToOffice(useAppStore).ok).toBe(true)
    expect(alertOffice(useAppStore, SOUTER_ACTOR, { listId: SEED_LIST_IDS.souterAm21, note: 'Is the funder right?' }).ok).toBe(true)
  })
  afterEach(() => vi.useRealTimers())

  it('is a section named by its heading, which keeps its id and shot', () => {
    render(<NotificationsCard actor={OFFICE_ACTOR} onOpen={vi.fn()} onSeeAll={vi.fn()} />)
    const section = screen.getByRole('region', { name: /^Notifications/ })
    expect(section).toHaveAttribute('data-shot', 'admin-notifications-rail')
    const heading = screen.getByRole('heading', { level: 2, name: /^Notifications/ })
    expect(heading).toHaveAttribute('id', 'admin-notifications-heading')
    expect(heading).toHaveStyle({ fontSize: '14px', fontWeight: '600' })
  })

  it('after a tick the row leaves and focus returns to the card heading', () => {
    render(<NotificationsCard actor={OFFICE_ACTOR} onOpen={vi.fn()} onSeeAll={vi.fn()} />)
    fireEvent.click(screen.getAllByRole('button', { name: /^Resolve notice: / })[0]!)
    act(() => vi.advanceTimersByTime(500))
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: /^Notifications/ }))
  })
})

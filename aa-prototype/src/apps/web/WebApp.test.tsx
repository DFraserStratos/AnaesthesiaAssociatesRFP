/** The web app for an inactive persona (build plan Phase 52; US-13.5.3, DM-07): no sign-in there, so a page in place of the screens. */
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ANAE } from '../../domain/seed'
import { freshAppState, makeAnaesthetistInactive, useAppStore, type Actor } from '../../store'
import { advanceClockDays } from '../../store/clockActions'
import { WebApp } from './WebApp'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderWeb() {
  return render(
    <MemoryRouter initialEntries={['/web']}>
      <Routes>
        <Route path="/web" element={<WebApp />}>
          <Route index element={<div data-testid="screen">screen</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(cleanup)
beforeEach(() => useAppStore.setState(freshAppState()))

describe('WebApp, Dr Souter after her last day', () => {
  it('shows the screens until the last day, then the no-longer-active page', () => {
    const s = useAppStore.getState()
    const lists = Object.fromEntries(Object.entries(s.schedule.lists).filter(([, l]) => !(l.anaesthetistId === ANAE.souter && l.dateISO > '2026-11-24')))
    useAppStore.setState({ schedule: { ...s.schedule, lists } })
    expect(makeAnaesthetistInactive(useAppStore, OFFICE, ANAE.souter, '2026-11-24', 'leftPractice').ok).toBe(true)
    const { container } = renderWeb()
    expect(screen.getByTestId('screen')).toBeInTheDocument()
    act(() => advanceClockDays(useAppStore, 1))
    expect(screen.queryByTestId('screen')).toBeNull()
    expect(container.querySelector('[data-shot="web-no-longer-active"]')?.textContent).toContain('You are no longer active with AA')
  })
})

/**
 * The simulated PWA sign-in (catch-up Phase 43a; US-13.5.3): the screen, the
 * gate in `MobileApp` for each host default, and Sign out on More.
 */

import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NO_LONGER_ACTIVE, freshAppState, makeAnaesthetistInactive, tryInactiveSignIn, useAppStore, type Actor } from '../../../store'
import { advanceClockDays } from '../../../store/clockActions'
import { SurfaceProvider } from '../../../shared'
import { ANAE } from '../../../domain/seed'
import { clearAnaesthetistSession, isSignedIn, signOutSession, useSessionStore } from '../../../shared/session/anaesthetistSession'
import { MobileApp } from '../MobileApp'
import { MoreScreen } from './MoreScreen'
import { SignInScreen } from './SignInScreen'

const EMAIL = 'm.souter@aa-associates.example'
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function Host({ children }: { children: ReactNode }) {
  return <div style={{ position: 'relative' }}>{children}</div>
}

function accountRows() {
  return useAppStore.getState().audit.filter((r) => r.entityType === 'account')
}

afterEach(cleanup)
beforeEach(() => {
  window.localStorage.clear()
  clearAnaesthetistSession()
  useAppStore.setState(freshAppState())
})

describe('SignInScreen', () => {
  function renderScreen() {
    return render(
      <SurfaceProvider variant="mobile">
        <SignInScreen />
      </SurfaceProvider>,
    )
  }

  it("pre-fills Dr Souter's email from the store and a masked password, with the provisional caption", () => {
    const { container } = renderScreen()
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL)
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    expect((password as HTMLInputElement).value).not.toBe('')
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
    const text = container.textContent ?? ''
    expect(text).toContain('Provisional')
    expect(text).toContain('still to be decided')
    expect(text).not.toMatch(/[–—]|Forgot|Google|Face ID sign/)
  })

  it('shows the three inline messages, and a blank field writes no audit row', () => {
    renderScreen()
    const before = accountRows().length
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(accountRows().length).toBe(before)

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('No account with that email. Use the demo account.')).toBeInTheDocument()
    expect(accountRows().at(-1)).toMatchObject({ action: 'auth.signInFailed' })
    expect(isSignedIn('signed-out')).toBe(false)
  })

  it('the demo account (any case, trimmed) signs in at once and writes one row', () => {
    renderScreen()
    const before = accountRows().length
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: `  ${EMAIL.toUpperCase()} ` } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(isSignedIn('signed-out')).toBe(true)
    expect(useSessionStore.getState().stored?.account).toBe(EMAIL)
    expect(accountRows().length).toBe(before + 1)
    expect(accountRows().at(-1)).toMatchObject({ action: 'auth.signIn', who: 'Dr Melanie Souter' })
  })
})

describe('MobileApp sign-in gate', () => {
  function renderApp(sessionDefault: 'signed-in' | 'signed-out', path = '/mobile/more') {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/mobile" element={<MobileApp host={Host} sessionDefault={sessionDefault} />}>
            <Route path="*" element={<div data-testid="screen">screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('the framed default opens signed in, with no row written', () => {
    const before = accountRows().length
    const { container } = renderApp('signed-in')
    expect(screen.getByTestId('screen')).toBeInTheDocument()
    expect(container.querySelector('[data-shot="sign-in-screen"]')).toBeNull()
    expect(accountRows().length).toBe(before)
  })

  it('the PWA default opens on the sign-in screen with no tab bar, and signing in shows the route', () => {
    const { container } = renderApp('signed-out', '/mobile/lists/L1/bookings/B1')
    expect(container.querySelector('[data-shot="sign-in-screen"]')).not.toBeNull()
    expect(screen.queryByTestId('screen')).toBeNull()
    expect(screen.queryByTestId('mobile-tab-bar')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByTestId('screen')).toBeInTheDocument()
  })

  it('a sign-out shows the sign-in screen in the framed build too', () => {
    const { container } = renderApp('signed-in')
    act(() => signOutSession())
    expect(container.querySelector('[data-shot="sign-in-screen"]')).not.toBeNull()
  })

  // Build plan Phase 52 (US-13.5.3, DM-07).
  const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

  /** Dr Souter with no List after `lastDayISO` (her later Lists dropped for the test), made inactive from it. */
  function souterLeaves(lastDayISO: string) {
    const s = useAppStore.getState()
    const lists = Object.fromEntries(Object.entries(s.schedule.lists).filter(([, l]) => !(l.anaesthetistId === ANAE.souter && l.dateISO > lastDayISO)))
    useAppStore.setState({ schedule: { ...s.schedule, lists } })
    expect(makeAnaesthetistInactive(useAppStore, OFFICE, ANAE.souter, lastDayISO, 'leftPractice').ok).toBe(true)
  }

  it('after the last day a signed-in handset is signed out once, with the reason, and sign-in is refused', () => {
    souterLeaves('2026-11-24')
    const { container } = renderApp('signed-in')
    expect(screen.getByTestId('screen')).toBeInTheDocument()
    const before = accountRows().length
    act(() => advanceClockDays(useAppStore, 1))
    expect(container.querySelector('[data-shot="sign-in-screen"]')).not.toBeNull()
    expect(accountRows().length).toBe(before + 1)
    expect(accountRows().at(-1)).toMatchObject({ action: 'auth.signOut', after: { reason: NO_LONGER_ACTIVE } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(accountRows().at(-1)).toMatchObject({ action: 'auth.signInFailed', after: { reason: NO_LONGER_ACTIVE } })
    expect(container.querySelector('[data-shot="sign-in-no-longer-active"]')?.textContent).toContain('Dr Melanie Souter')
    expect(screen.queryByTestId('screen')).toBeNull()
  })

  it('the "try signing in after the last day" demo action refuses Dr Souter: notice, email field and audit row all name her', () => {
    const { container } = renderApp('signed-out')
    const email = () => (container.querySelector('[data-shot="sign-in-email"] input, input[type="email"]') as HTMLInputElement).value
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'someone@else.example' } })
    act(() => {
      expect(tryInactiveSignIn(useAppStore).ok).toBe(true)
    })
    const souter = useAppStore.getState().masters.anaesthetists[ANAE.souter]!
    expect(container.querySelector('[data-shot="sign-in-no-longer-active"]')?.textContent).toContain('Dr Melanie Souter')
    expect(email()).toBe(souter.email)
    expect(accountRows().at(-1)).toMatchObject({ entityId: ANAE.souter, who: 'Dr Melanie Souter', action: 'auth.signInFailed', after: { reason: NO_LONGER_ACTIVE } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.queryByTestId('screen')).toBeNull()
    expect(accountRows().at(-1)).toMatchObject({ entityId: ANAE.souter, action: 'auth.signInFailed', after: { reason: NO_LONGER_ACTIVE } })
  })
})

describe('More: Sign out', () => {
  it('shows the account and signs out with one audited row', () => {
    render(
      <SurfaceProvider variant="mobile">
        <MoreScreen personaName="Dr Melanie Souter" personaRole="Anaesthetist" initials="MS" actor={SOUTER} anaesthetistId={ANAE.souter} />
      </SurfaceProvider>,
    )
    const row = document.querySelector('[data-shot="more-account"]') as HTMLElement
    expect(row.textContent).toContain(`Signed in as${EMAIL}`)
    const before = accountRows().length
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(isSignedIn('signed-in')).toBe(false)
    expect(accountRows().length).toBe(before + 1)
    expect(accountRows().at(-1)).toMatchObject({ action: 'auth.signOut' })
  })
})

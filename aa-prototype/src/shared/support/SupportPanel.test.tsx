/**
 * The support panel (catch-up Phase 43b; US-15.0.8, US-15.0.9): closed at the
 * seed's 8:00am, open after +1 hour, a request logged at the top with its
 * respond-by, the office's two tabs, the out-of-hours notice and reason, the
 * one Simulated badge and readings caption.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { advanceClockMinutes, freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore } from '../../store'
import { SurfaceProvider } from '../surface'
import { useDemoContextStore } from '../demoTriggers/context'
import { SupportPanel } from './SupportPanel'
import { SupportSidePanel } from './SupportHosts'

function souterPanel() {
  return render(
    <SurfaceProvider variant="web">
      <SupportPanel channels={['helpLine']} actor={SOUTER_ACTOR} app="web" seesEveryRequest={false} buttonSize="desktop" />
    </SurfaceProvider>,
  )
}

const shot = (name: string) => document.querySelector<HTMLElement>(`[data-shot="${name}"]`)!

describe('SupportPanel (catch-up Phase 43b)', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))
  afterEach(cleanup)

  it('reads closed at 8:00am and open after +1 hour, with the phone and hours from the config', () => {
    souterPanel()
    expect(shot('support-status').textContent).toBe('Closed, opens 8:30am')
    expect(shot('support-cover-note').textContent).toMatch(/^Out of hours: only a security breach/)
    expect(shot('support-phone').textContent).toBe('0800 787 286')
    expect(shot('support-hours').textContent).toBe('8:30am to 5:00pm NZT, Monday to Friday, excluding New Zealand public holidays')
    act(() => advanceClockMinutes(useAppStore, 60))
    expect(shot('support-status').textContent).toBe('Open now')
    expect(document.querySelector('[data-shot="support-cover-note"]')).toBeNull()
    expect(screen.getAllByText('Simulated')).toHaveLength(1)
    expect(screen.getAllByText('How the support terms apply')).toHaveLength(1)
  })

  it('lists only the persona\'s requests and logs a new one at the top with its respond-by', () => {
    act(() => advanceClockMinutes(useAppStore, 60))
    souterPanel()
    const list = shot('support-ticket-list')
    expect([...list.querySelectorAll('[data-ticket-id]')].map((r) => r.getAttribute('data-ticket-id'))).toEqual(['TK0003', 'TK0001'])
    fireEvent.change(within(shot('support-request-form')).getByLabelText('Subject'), { target: { value: 'Lists not loading' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    const first = list.querySelector('[data-ticket-id]')!
    expect(first.getAttribute('data-ticket-id')).toBe('TK0006')
    expect(first.textContent).toContain('Respond by Tue 24 Nov, 1:00pm')
    expect((within(shot('support-request-form')).getByLabelText('Subject') as HTMLInputElement).value).toBe('')
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ action: 'support.raise', entityId: 'TK0006' })
  })

  it('refuses a request with no subject, in the form', () => {
    act(() => advanceClockMinutes(useAppStore, 60))
    souterPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(screen.getByText('Say what the request is about.')).toBeTruthy()
  })

  it('out of hours asks what is happening and logs a security breach as P1', () => {
    act(() => advanceClockMinutes(useAppStore, 11 * 60))
    souterPanel()
    const form = shot('support-request-form')
    fireEvent.click(within(form).getByRole('radio', { name: 'Security breach' }))
    fireEvent.change(within(form).getByLabelText('Subject'), { target: { value: 'Strange sign-in' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(useAppStore.getState().support.tickets['TK0006']).toMatchObject({ priority: 'P1', reason: 'securityBreach', respondByISO: '2026-11-24T20:00:00' })
  })

  it('Admin shows both tabs, every request with its requester, and product support\'s own table', () => {
    act(() => advanceClockMinutes(useAppStore, 60))
    render(
      <SurfaceProvider variant="web">
        <SupportSidePanel open onClose={() => undefined} actor={OFFICE_ACTOR} app="admin" />
      </SurfaceProvider>,
    )
    expect(useDemoContextStore.getState().values['support.tab']).toBe('helpLine')
    expect(shot('support-ticket-list').textContent).toContain('Dr Melanie Souter')
    expect(shot('support-response-table').textContent).toContain('4 hours')
    fireEvent.click(shot('support-tab-productSupport'))
    expect(useDemoContextStore.getState().values['support.tab']).toBe('productSupport')
    expect(shot('support-response-table').textContent).toContain('3 business days')
    expect(shot('support-response-table').textContent).not.toContain('4 hours')
    fireEvent.click(screen.getByText('New feature'))
    expect(shot('support-new-feature-line').textContent).toBe('Goes to the product owner or the development team, to plan.')
  })

  it('shows how NHI and ethnicity codes are checked in Admin\'s Help only, as text', () => {
    render(
      <SurfaceProvider variant="web">
        <SupportPanel channels={['helpLine', 'productSupport']} actor={OFFICE_ACTOR} app="admin" seesEveryRequest buttonSize="desktop" />
      </SurfaceProvider>,
    )
    const checks = shot('support-format-checks')
    expect(checks.textContent).toContain('How NHI and ethnicity codes are checked')
    expect(checks.textContent).toContain('AAANNNC')
    expect(checks.textContent).toContain('AAANNAX')
    expect(checks.textContent).toContain('4 November 2027')
    expect(checks.textContent).toContain('for AA to confirm')
    expect(checks.textContent).toContain("outside this demo's subset")
    expect(checks.querySelector('input')).toBeNull()
    cleanup()
    for (const app of ['web', 'mobile', 'pwa'] as const) {
      render(
        <SurfaceProvider variant="web">
          <SupportPanel channels={['helpLine']} actor={SOUTER_ACTOR} app={app} seesEveryRequest={false} buttonSize="desktop" />
        </SurfaceProvider>,
      )
      expect(document.querySelector('[data-shot="support-format-checks"]')).toBeNull()
      cleanup()
    }
  })
})

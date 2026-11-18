/**
 * The anaesthetist's own profile on the More tab (catch-up Phase 26; US-12.1.4,
 * US-12.1.1): the rate per unit is theirs to change in a bottom sheet; contact,
 * registration, HPI CPN and the masked bank account are read-only.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { ANAE } from '../../../domain/seed'
import { MoreScreen } from './MoreScreen'

afterEach(cleanup)

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function renderMore() {
  return render(
    <SurfaceProvider variant="mobile">
      <MoreScreen personaName="Dr Melanie Souter" personaRole="Anaesthetist" initials="MS" actor={SOUTER} anaesthetistId={ANAE.souter} />
    </SurfaceProvider>,
  )
}

describe('More: the Profile card', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('shows the rate, contact, registration, HPI CPN and the masked bank number, and nothing office-only', () => {
    const { container } = renderMore()
    const card = container.querySelector('[data-shot="mobile-profile"]') as HTMLElement
    expect(card).not.toBeNull()
    const text = card.textContent ?? ''
    for (const fact of ['$26.50', '021 555 0134', 'm.souter@aa-associates.example', '34821', '10SOUM', '99-0101-•••••21-00', 'Held by the AA office']) {
      expect(text).toContain(fact)
    }
    expect(text).not.toContain('0034821')
    expect(text).not.toMatch(/Tier|prefer|GST|HPI id|HPI number|[–—]/)
    expect(within(card).getAllByRole('img', { name: 'Held by the AA office' })).toHaveLength(5)
  })

  it('saves a new rate from the bottom sheet, audited as hers, and refuses a zero or text rate verbatim', () => {
    renderMore()
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    const field = screen.getByLabelText('Rate per unit ($)')
    fireEvent.change(field, { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }))
    expect(screen.getByRole('alert')).toHaveTextContent('The rate per unit must be greater than zero.')
    fireEvent.change(field, { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }))
    expect(screen.getByRole('alert')).toHaveTextContent('The rate per unit must be greater than zero.')
    fireEvent.change(field, { target: { value: '27.00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }))
    expect(useAppStore.getState().masters.anaesthetists[ANAE.souter]?.unitValue).toBe(27)
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ action: 'anaesthetist.update', who: 'Dr Melanie Souter', role: 'anaesthetist', before: { unitValue: 26.5 }, after: { unitValue: 27 } })
    expect(document.querySelector('[data-shot="mobile-profile-rate"]')?.textContent).toContain('$27.00')
  })
})

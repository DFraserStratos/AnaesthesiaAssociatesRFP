/**
 * "Alert the office" in the anaesthetist apps (catch-up Phase 32b; US-03.6.3):
 * owner only, a required note, the sent and dealt-with states, and the
 * office's line with the tick.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { activeAlertFor, freshAppState, resolveNotification, useAppStore, type Actor } from '../../store'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../store/demoActors'
import { ANAE, SEED_LIST_IDS } from '../../domain/seed'
import { SurfaceProvider } from '../surface'
import { AlertOfficeEntry, OfficeAlertLine } from './AlertOfficeSheet'

const LIST = SEED_LIST_IDS.souterAm21
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }

describe('AlertOfficeEntry', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  for (const variant of ['web', 'mobile'] as const) {
    it(`${variant}: sends a required note, then shows the alert; once ticked, "The office has dealt with this"`, () => {
      render(
        <SurfaceProvider variant={variant}>
          <AlertOfficeEntry actor={SOUTER_ACTOR} target={{ listId: LIST }} />
        </SurfaceProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Alert the office' }))
      const send = screen.getByRole('button', { name: 'Send to the office' })
      expect(send).toBeDisabled()
      fireEvent.change(screen.getByLabelText('Note for the office'), { target: { value: 'Is the Contract right?' } })
      expect(send).not.toBeDisabled()
      fireEvent.click(send)
      expect(screen.getAllByText('The office has been alerted').length).toBeGreaterThan(0)
      fireEvent.click(screen.getByRole('button', { name: 'Done' }))
      expect(screen.queryByRole('button', { name: 'Alert the office' })).toBeNull()
      expect(screen.getByText('"Is the Contract right?"')).toBeInTheDocument()
      const alert = activeAlertFor(useAppStore.getState(), { listId: LIST })!
      act(() => {
        expect(resolveNotification(useAppStore, OFFICE_ACTOR, alert.id).ok).toBe(true)
      })
      expect(screen.getByText('The office has dealt with this')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Alert the office' })).toBeInTheDocument()
      expect(document.body.textContent).not.toMatch(/flag|Draft List|slot|[–—]/i)
    })
  }

  it("is not offered to a colleague or the office on her List", () => {
    const { container } = render(
      <SurfaceProvider variant="web">
        <AlertOfficeEntry actor={SHARMA} target={{ listId: LIST }} />
        <AlertOfficeEntry actor={OFFICE_ACTOR} target={{ listId: LIST }} />
      </SurfaceProvider>,
    )
    expect(container.textContent).toBe('')
  })

  it("the office sees the open alert where it works, with the tick", () => {
    useAppStore.setState(freshAppState())
    render(
      <SurfaceProvider variant="web">
        <AlertOfficeEntry actor={SOUTER_ACTOR} target={{ listId: LIST }} />
        <OfficeAlertLine actor={OFFICE_ACTOR} target={{ listId: LIST }} />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Alert the office' }))
    fireEvent.change(screen.getByLabelText('Note for the office'), { target: { value: 'Please check' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send to the office' }))
    expect(screen.getByText('Alert from Dr Souter')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Resolve alert from Dr Souter' }))
    expect(screen.queryByText('Alert from Dr Souter')).toBeNull()
  })
})

/**
 * New Draft List (catch-up Phase 34; US-02.2.4): a request that came in by PDF
 * asks "Sent from" and the List records a rooms' PDF origin with that address;
 * any other source asks nothing and records "Entered by hand".
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOSP, SURG } from '../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { DraftListSheet } from './DraftListSheet'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderSheet() {
  const onCreated = vi.fn()
  render(
    <SurfaceProvider variant="web">
      <DraftListSheet open actor={OFFICE} initialDateISO="2026-11-26" onClose={vi.fn()} onCreated={onCreated} />
    </SurfaceProvider>,
  )
  fireEvent.change(screen.getByLabelText('Hospital'), { target: { value: HOSP.stg } })
  fireEvent.change(screen.getByLabelText('Surgeon'), { target: { value: SURG.tan } })
  return onCreated
}

describe('DraftListSheet: where the request came from', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('a PDF request asks Sent from and records a pdf origin with that address', () => {
    const onCreated = renderSheet()
    expect(screen.queryByLabelText('Sent from')).toBeNull()
    fireEvent.click(screen.getByText('PDF', { selector: 'button, button *' }))
    fireEvent.change(screen.getByLabelText('Sent from'), { target: { value: 'pa@rooms.example' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    const listId = onCreated.mock.calls[0]![0] as string
    expect(useAppStore.getState().schedule.lists[listId]!.origin).toEqual({ kind: 'pdf', senderEmail: 'pa@rooms.example' })
  })

  it('a phone request asks nothing and records Entered by hand', () => {
    const onCreated = renderSheet()
    fireEvent.click(screen.getByText('Phone', { selector: 'button, button *' }))
    expect(screen.queryByLabelText('Sent from')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    const listId = onCreated.mock.calls[0]![0] as string
    expect(useAppStore.getState().schedule.lists[listId]!.origin).toEqual({ kind: 'manual' })
  })
})

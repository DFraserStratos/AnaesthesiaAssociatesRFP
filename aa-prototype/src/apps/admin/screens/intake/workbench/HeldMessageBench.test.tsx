/**
 * The held-message bench (build plan Phase 71): the message, its source and reason, View raw (the restricted sheet,
 * taking the held batch's id) and Dismiss with a required reason; a dismissed message shows its reason and no controls.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OFFICE_ACTOR, freshAppState, useAppStore } from '../../../../../store'
import { receiveFailedMessage } from '../../../../../store/intakeIngest'
import { arrivalItemsOf } from '../../../../../store/intakeSelectors'
import { OKAFOR_STORY } from '../../../../../domain/intake/hospitalDownloads'
import type { ArrivalItem } from '../../../../../domain/intake/arrivals'
import { SurfaceProvider } from '../../../../../shared/surface'
import { HeldMessageBench } from './HeldMessageBench'

const FAILED = OKAFOR_STORY.failedMessage

function holdMessage(): ArrivalItem {
  const out = receiveFailedMessage(useAppStore, FAILED.hospitalId, { label: FAILED.label, reason: FAILED.reason, raw: FAILED.raw })
  if (!out.ok) throw new Error(out.message)
  const item = arrivalItemsOf(useAppStore.getState()).find((a) => a.batchId === out.value.batchId)
  if (item === undefined) throw new Error('no held arrival')
  return item
}

function renderBench(arrival: ArrivalItem, onDone = vi.fn()) {
  const view = render(
    <SurfaceProvider variant="web">
      <HeldMessageBench arrival={arrival} actor={OFFICE_ACTOR} onDone={onDone} />
    </SurfaceProvider>,
  )
  return { ...view, onDone }
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('HeldMessageBench', () => {
  it('shows the message, its reason and source, View raw and Dismiss', () => {
    const arrival = holdMessage()
    const { container } = renderBench(arrival)
    const bench = container.querySelector('[data-shot="intake-bench-held"]')!
    expect(bench).toHaveTextContent(FAILED.reason)
    expect(bench).toHaveTextContent(arrival.title)
    expect(bench).toHaveTextContent(arrival.source.label)
    expect(screen.getByRole('button', { name: 'View raw' })).toHaveAttribute('data-shot', 'intake-held-view-raw')
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveAttribute('data-shot', 'intake-held-dismiss')
    expect(container.textContent ?? '').not.toMatch(/[–—]/)
  })

  it('View raw opens the restricted sheet, which shows the masked message once a reason is given', () => {
    const arrival = holdMessage()
    renderBench(arrival)
    fireEvent.click(screen.getByRole('button', { name: 'View raw' }))
    const sheet = screen.getByTestId('matching-raw-row-sheet')
    fireEvent.change(within(sheet).getByLabelText('Or type a reason'), { target: { value: 'Check what the hospital sent' } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'View raw row' }))
    expect(document.querySelector('[data-raw-column="resourceType"]')).toHaveTextContent('Appointment')
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ action: 'importRow.rawViewed', entityId: arrival.batchId })
  })

  it('Dismiss needs a reason, then dismisses the message and moves on', () => {
    const arrival = holdMessage()
    const { onDone } = renderBench(arrival)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    const sheet = document.querySelector('[data-shot="intake-held-dismiss-sheet"]')!.closest('[role="dialog"]') as HTMLElement
    const confirm = within(sheet).getByRole('button', { name: 'Dismiss' })
    expect(confirm).toBeDisabled()
    fireEvent.change(within(sheet).getByLabelText('Reason'), { target: { value: 'Sent again with the patient' } })
    expect(confirm).toBeEnabled()
    act(() => fireEvent.click(confirm))
    expect(useAppStore.getState().intake.batches[arrival.batchId]!.dismissed).toMatchObject({ reason: 'Sent again with the patient' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('a dismissed message shows its reason and no controls', () => {
    const arrival = holdMessage()
    const s = useAppStore.getState()
    useAppStore.setState({
      intake: { ...s.intake, batches: { ...s.intake.batches, [arrival.batchId]: { ...s.intake.batches[arrival.batchId]!, dismissed: { by: 'Office', atISO: '2026-11-24T09:00:00', reason: 'Duplicate' } } } },
    })
    const { container } = renderBench({ ...arrival, decided: true })
    expect(container.querySelector('[data-shot="intake-held-dismissed"]')).toHaveTextContent('Duplicate')
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})

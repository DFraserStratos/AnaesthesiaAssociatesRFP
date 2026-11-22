import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SurfaceProvider } from '../surface'
import { BottomSheet } from '../surface/BottomSheet'
import { CaptureSection } from '../capture/ui'
import { InfoTip, InfoTipHeader } from './InfoTip'
import { FirstRunHint } from './FirstRunHint'
import { HELP_TOPICS } from './helpTopics'
import { clearFirstRunHintDismissals, useHintStore } from './firstRunHints'

describe('InfoTip (Phase 43a, US-15.0.1)', () => {
  it('is named "About {title}" and opens a bottom sheet with the topic on the phone', () => {
    render(
      <SurfaceProvider variant="mobile">
        <InfoTip topic="capture.stack" />
      </SurfaceProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'About Reading a procedure' })
    expect(trigger.getAttribute('data-shot')).toBe('info-tip-capture-stack')
    fireEvent.click(trigger)
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText(HELP_TOPICS['capture.stack'].body[0]!)).toBeTruthy()
    expect(within(sheet).getByRole('button', { name: 'Got it' })).toBeTruthy()
    expect(document.querySelector('[data-shot="info-tip-capture-stack-sheet"]')).not.toBeNull()
  })

  it('opens an anchored popover with role dialog on desktop; Escape closes it and returns focus', () => {
    render(
      <SurfaceProvider variant="web">
        <InfoTip topic="day.statuses" />
      </SurfaceProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'About Reading the day' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const popover = screen.getByRole('dialog', { name: 'Reading the day' })
    expect(trigger.getAttribute('aria-controls')).toBe(popover.id)
    expect(popover.style.position).toBe('fixed')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('opening a second tip closes the first', () => {
    render(
      <SurfaceProvider variant="web">
        <InfoTip topic="review.flags" />
        <InfoTip topic="review.price" />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'About Flags' }))
    expect(screen.getByRole('dialog', { name: 'Flags' })).toBeTruthy()
    const second = screen.getByRole('button', { name: 'About How the price is set' })
    fireEvent.pointerDown(second)
    fireEvent.click(second)
    expect(screen.queryByRole('dialog', { name: 'Flags' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'How the price is set' })).toBeTruthy()
  })

  it('opening a second tip by keyboard closes the first', () => {
    render(
      <SurfaceProvider variant="web">
        <InfoTip topic="review.contracts" />
        <InfoTip topic="review.price" />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'About Procedures and Contracts' }))
    expect(screen.getByRole('dialog', { name: 'Procedures and Contracts' })).toBeTruthy()
    // Enter on a focused button fires click without a pointerdown, so the outside-click close never runs.
    fireEvent.click(screen.getByRole('button', { name: 'About How the price is set' }))
    expect(screen.queryByRole('dialog', { name: 'Procedures and Contracts' })).toBeNull()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('inside a sheet on the phone it expands an inline note, never a second sheet', () => {
    render(
      <SurfaceProvider variant="mobile">
        <BottomSheet open onClose={() => {}}>
          <InfoTipHeader title="RVG code" topic="capture.rvg" />
        </BottomSheet>
      </SurfaceProvider>,
    )
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'About Choosing an RVG code' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    const note = screen.getByRole('note')
    expect(within(note).getByText(HELP_TOPICS['capture.rvg'].body[0]!)).toBeTruthy()
    fireEvent.click(within(note).getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('CaptureSection draws a tip only when given help', () => {
    const { rerender } = render(
      <SurfaceProvider variant="mobile">
        <CaptureSection label="Times">body</CaptureSection>
      </SurfaceProvider>,
    )
    expect(screen.queryByRole('button', { name: /^About / })).toBeNull()
    rerender(
      <SurfaceProvider variant="mobile">
        <CaptureSection label="Times" help="capture.times">
          body
        </CaptureSection>
      </SurfaceProvider>,
    )
    expect(screen.getByRole('button', { name: 'About Times' })).toBeTruthy()
    expect(screen.getByText('Times')).toBeTruthy()
  })
})

describe('FirstRunHint (Phase 43a)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearFirstRunHintDismissals()
  })
  afterEach(() => window.localStorage.clear())

  it('shows until Got it, then stays dismissed for this browser', () => {
    render(<FirstRunHint app="admin" />)
    expect(screen.getByText('The day at a glance')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByText('The day at a glance')).toBeNull()
    expect(window.localStorage.getItem('aa-first-run-hint-admin')).not.toBeNull()
    act(() => clearFirstRunHintDismissals())
    expect(screen.getByText('The day at a glance')).toBeTruthy()
    expect(useHintStore.getState().dismissed.admin).toBe(false)
  })
})

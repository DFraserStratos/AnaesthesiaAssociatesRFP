/**
 * The Billing monitor's Xero panels (catch-up Phase 37; EP-09): the sync queue
 * (rows, Retry now, empty state, alert banner) and the changes made directly in
 * Xero with the Resolve side panel (note required, provisional, no money moved).
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  advanceClockMinutes,
  authoriseList,
  freshAppState,
  pairsForList,
  processXeroQueue,
  runReconciliationPoll,
  setXeroOutage,
  useAppStore,
  voidAccRecInXero,
  wireBillingRun,
  XERO_STAFF_ACTOR,
  type Actor,
} from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { ANAE } from '../../../domain/seed'
import { projectedListId } from '../../../domain/slots'
import { XeroDivergencePanel, XeroQueuePanel } from './XeroPanels'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const AM20 = projectedListId(ANAE.souter, '2026-07-20', 'AM')

let unwire: () => void = () => {}
beforeEach(() => {
  useAppStore.setState(freshAppState())
  unwire = wireBillingRun(useAppStore)
})
afterEach(() => unwire())

function renderPanels() {
  render(
    <SurfaceProvider variant="web">
      <MemoryRouter>
        <XeroQueuePanel actor={OFFICE} />
        <XeroDivergencePanel actor={OFFICE} />
      </MemoryRouter>
    </SurfaceProvider>,
  )
  return () => document.querySelector('[data-shot="billing-xero-queue"]') as HTMLElement
}

describe('Xero sync queue panel', () => {
  it('reads empty when nothing waits, and lists an outage hand-off with Retry now', () => {
    const queue = renderPanels()
    expect(queue()).toHaveTextContent('Nothing is waiting for Xero.')
    act(() => {
      setXeroOutage(useAppStore, OFFICE, true)
      authoriseList(useAppStore, OFFICE, AM20)
    })
    const rows = queue().querySelectorAll('[data-queue-item]')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveTextContent('Hand off')
    expect(rows[0]).toHaveTextContent('Waiting')
    fireEvent.click(within(rows[0] as HTMLElement).getByRole('button', { name: 'Retry now' }))
    expect(queue()).toHaveTextContent('Xero did not answer; the next try is set.')
  })

  it('raises the alert banner after five attempts, and Retry now sends once Xero is back', () => {
    const queue = renderPanels()
    act(() => {
      setXeroOutage(useAppStore, OFFICE, true)
      authoriseList(useAppStore, OFFICE, AM20)
      for (let i = 0; i < 6; i += 1) {
        advanceClockMinutes(useAppStore, 60)
        processXeroQueue(useAppStore)
      }
    })
    expect(document.querySelector('[data-shot="billing-xero-alert"]')).toHaveTextContent('In production this alerts AA\'s support team (simulated).')
    expect(queue()).toHaveTextContent('Alert raised')
    act(() => {
      useAppStore.setState({ settings: { ...useAppStore.getState().settings, xeroOutage: undefined } })
    })
    const row = queue().querySelector('[data-queue-item]') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Retry now' }))
    expect(queue()).toHaveTextContent('sent to Xero')
  })
})

describe('Changed directly in Xero panel', () => {
  it('shows only when the poll flags a change; Resolve needs a note, records the outcome and moves no money', () => {
    renderPanels()
    act(() => {
      authoriseList(useAppStore, OFFICE, AM20)
    })
    expect(document.querySelector('[data-shot="billing-xero-divergence"]')).toBeNull()
    const pair = pairsForList(useAppStore.getState(), AM20).find((p) => p.receivable.xeroAccRecId !== undefined)!
    const before = useAppStore.getState().billing.ledger[pair.id]
    act(() => {
      voidAccRecInXero(useAppStore, XERO_STAFF_ACTOR, pair.receivable.xeroAccRecId!)
    })
    expect(document.querySelector('[data-shot="billing-xero-divergence"]')).toBeNull()
    act(() => {
      runReconciliationPoll(useAppStore)
    })
    const panel = document.querySelector('[data-shot="billing-xero-divergence"]') as HTMLElement
    expect(panel).toHaveTextContent('Voided in Xero')
    expect(panel).toHaveTextContent('Receivable open')
    fireEvent.click(within(panel).getByRole('button', { name: 'Resolve' }))
    expect(screen.getByText('Provisional: the policy for each mismatch is to be agreed with AA.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Record resolution' }))
    expect(document.querySelector('[data-shot="billing-xero-resolve-panel"]')).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Re-issued in Xero by Kirsty' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record resolution' }))
    expect(document.querySelector('[data-shot="billing-xero-divergence"]')).toBeNull()
    expect(useAppStore.getState().billing.ledger[pair.id]).toEqual(before)
  })
})

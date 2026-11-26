/**
 * The Xero panels (catch-up Phase 37; EP-09; build plan Phases 58 and 61), as
 * the Xero tab shows them: the hand-off rows (Retry now, its result in place,
 * the alert banner after repeated attempts), the changed-in-Xero rows and the
 * Resolve side panel (note required, provisional, no money moved). The three
 * panel exports the catalogue shows still render on their own.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, MemoryRouter, Route, RouterProvider } from 'react-router-dom'
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
import { AdminApp } from '../AdminApp'
import { financesRoutes } from '../../../test/adminRoutes'
import { XeroConnectionLine, XeroDivergencePanel, XeroQueuePanel } from './XeroPanels'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const AM20 = projectedListId(ANAE.souter, '2026-11-23', 'AM')

let unwire: () => void = () => {}
beforeEach(() => {
  useAppStore.setState(freshAppState())
  unwire = wireBillingRun(useAppStore)
})
afterEach(() => {
  cleanup()
  unwire()
})

/** The Xero tab, opened on All so every group shows. */
function renderTab() {
  const router = createMemoryRouter(createRoutesFromElements(<Route path="/admin" element={<AdminApp />}>{financesRoutes()}</Route>), { initialEntries: ['/admin/finances/xero?show=all'] })
  render(<RouterProvider router={router} />)
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null
const queueRows = () => Array.from(document.querySelectorAll('[data-shot="xero-table"] tr[data-queue-item]')) as HTMLElement[]

describe('the hand-off rows', () => {
  it('none at first; an outage hand-off lists with Retry now, which says in place that Xero did not answer', () => {
    renderTab()
    expect(queueRows()).toHaveLength(0)
    expect(shot('billing-xero-connection')).toHaveTextContent('Connected')
    act(() => {
      setXeroOutage(useAppStore, OFFICE, true)
      authoriseList(useAppStore, OFFICE, AM20)
    })
    expect(shot('billing-xero-connection')).toHaveTextContent('Xero is unavailable.')
    const rows = queueRows()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveAttribute('data-queue-kind', 'handoff')
    expect(rows[0]).toHaveTextContent('Waiting')
    expect(rows[0]).toHaveTextContent('1')
    fireEvent.click(within(rows[0]!).getByRole('button', { name: 'Retry now' }))
    expect(document.body).toHaveTextContent('Xero did not answer; the next try is set.')
    expect(queueRows()).toHaveLength(rows.length)
  })

  it('raises the alert after five attempts; Retry now sends once Xero is back and the row leaves', () => {
    renderTab()
    act(() => {
      setXeroOutage(useAppStore, OFFICE, true)
      authoriseList(useAppStore, OFFICE, AM20)
      for (let i = 0; i < 6; i += 1) {
        advanceClockMinutes(useAppStore, 60)
        processXeroQueue(useAppStore)
      }
    })
    expect(shot('billing-xero-alert')).toHaveTextContent("In production this alerts AA's support team (simulated).")
    const row = queueRows()[0]!
    expect(row).toHaveTextContent('Alert raised')
    const id = row.getAttribute('data-queue-item')!
    act(() => {
      useAppStore.setState({ settings: { ...useAppStore.getState().settings, xeroOutage: undefined } })
    })
    fireEvent.click(within(row).getByRole('button', { name: 'Retry now' }))
    expect(document.body).toHaveTextContent('sent to Xero')
    expect(document.querySelector(`[data-shot="xero-table"] tr[data-queue-item="${id}"]`)).toBeNull()
  })
})

describe('Changed directly in Xero and Resolve', () => {
  it('lists only once the poll flags a change; Resolve needs a note, records the outcome and moves no money', () => {
    renderTab()
    act(() => {
      authoriseList(useAppStore, OFFICE, AM20)
    })
    const pair = pairsForList(useAppStore.getState(), AM20).find((p) => p.receivable.xeroAccRecId !== undefined)!
    const before = useAppStore.getState().billing.ledger[pair.id]
    act(() => {
      voidAccRecInXero(useAppStore, XERO_STAFF_ACTOR, pair.receivable.xeroAccRecId!)
    })
    expect(document.querySelector('[data-divergence-id]')).toBeNull()
    act(() => {
      runReconciliationPoll(useAppStore)
    })
    const row = document.querySelector('[data-shot="xero-table"] tr[data-divergence-kind="voidedInXero"]') as HTMLElement
    expect(row).not.toBeNull()
    expect(row).toHaveTextContent(useAppStore.getState().billing.invoices[pair.invoiceId]!.invoiceNumber)
    fireEvent.click(within(row).getByRole('button', { name: 'Resolve' }))
    expect(screen.getByText('Provisional: the policy for each mismatch is to be agreed with AA.')).toBeInTheDocument()
    expect(shot('billing-xero-resolve-panel')).toHaveTextContent('Recording a resolution moves no money')
    fireEvent.click(screen.getByRole('button', { name: 'Record resolution' }))
    expect(shot('billing-xero-resolve-panel')).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Re-issued in Xero by Kirsty' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record resolution' }))
    expect(shot('billing-xero-resolve-panel')).toBeNull()
    expect(document.querySelector('[data-divergence-id]')).toBeNull()
    expect(useAppStore.getState().billing.ledger[pair.id]).toEqual(before)
  })
})

describe('the panel exports the catalogue shows', () => {
  it('the connection line, the queue and the divergence panel render on their own', () => {
    act(() => {
      setXeroOutage(useAppStore, OFFICE, true)
      authoriseList(useAppStore, OFFICE, AM20)
    })
    render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <XeroConnectionLine />
          <XeroQueuePanel actor={OFFICE} />
          <XeroDivergencePanel actor={OFFICE} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    expect(shot('billing-xero-connection')).toHaveTextContent('Xero unavailable since')
    expect(document.querySelectorAll('[data-queue-item]').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Retry now' }).length).toBeGreaterThan(0)
  })
})

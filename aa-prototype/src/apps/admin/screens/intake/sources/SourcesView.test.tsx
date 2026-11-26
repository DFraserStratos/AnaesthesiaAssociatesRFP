/**
 * The Sources view (build plan Phase 71; US-02.1.7) over the store's seed: the inbound-only line, each connected
 * or reading source, Today's messages, Forte Health under not connected, and a held feed message under Southern
 * Cross with its reason and View raw once 'A feed message fails' has played.
 */

import { act, cleanup, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OKAFOR_STORY } from '../../../../../domain/intake'
import { OFFICE_ACTOR, freshAppState, receiveFailedMessage, useAppStore } from '../../../../../store'
import { intakeSources } from '../../../../../store/intakeSelectors'
import { IntakeSection } from '../IntakeSection'
import { sourcesPath } from '../intakePaths'
import { SourcesView } from '../SourcesView'

function mount() {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin/intake" element={<IntakeSection actor={OFFICE_ACTOR} />}>
        <Route path="sources" element={<SourcesView />} />
      </Route>,
    ),
    { initialEntries: [sourcesPath()] },
  )
  render(<RouterProvider router={router} />)
}

const view = () => document.querySelector('[data-shot="intake-sources"]') as HTMLElement

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('SourcesView', () => {
  it('states that AA reads from its sources and never writes back', () => {
    mount()
    expect(document.querySelector('[data-shot="intake-sources-inbound"]')).toHaveTextContent('AA reads from these sources and never writes back to them')
  })

  it('shows one row per connected or reading source, each with its state and last sent', () => {
    mount()
    const live = intakeSources(useAppStore.getState()).filter((s) => s.state !== 'notConnected')
    const rows = [...view().querySelectorAll('[data-shot="intake-sources-row"]')]
    expect(rows.map((r) => r.getAttribute('data-source-id'))).toEqual(live.map((s) => s.id))
    for (const row of rows) {
      expect(row).toHaveTextContent(/Receiving|Reading/)
      expect(row).toHaveTextContent(/Last sent|Nothing received yet/)
      expect(row).toHaveTextContent('today')
    }
    expect(document.querySelector('[data-shot="intake-sources-messages"]')).not.toBeNull()
  })

  it('lists Forte Health as not connected, its Lists coming by PDF to the mailbox', () => {
    mount()
    const box = document.querySelector('[data-shot="intake-sources-not-connected"]') as HTMLElement
    const forte = within(box).getByText('Forte Health').closest('li') as HTMLElement
    expect(forte).toHaveAttribute('data-source-state', 'notConnected')
    expect(forte).toHaveTextContent('Not connected')
    expect(forte).toHaveTextContent('Lists come by PDF to the mailbox')
  })

  it('shows a held feed message under Southern Cross with its reason and View raw, and in Today as Held', () => {
    mount()
    const sample = OKAFOR_STORY.failedMessage
    let batchId = ''
    act(() => {
      const res = receiveFailedMessage(useAppStore, sample.hospitalId, { label: sample.label, reason: sample.reason, raw: sample.raw })
      expect(res.ok).toBe(true)
      if (res.ok) batchId = res.value.batchId
    })
    const held = document.querySelector('[data-shot="intake-sources-held"]') as HTMLElement
    const sx = intakeSources(useAppStore.getState()).find((s) => s.name === 'Southern Cross')!
    const card = held.querySelector(`[data-source-id="${sx.id}"]`) as HTMLElement
    expect(card).toHaveTextContent('Southern Cross')
    const item = card.querySelector(`[data-batch-id="${batchId}"]`) as HTMLElement
    expect(item).toHaveTextContent(sample.reason)
    expect(within(item).getByRole('button', { name: 'View raw' })).toBeInTheDocument()
    const msgRow = document.querySelector(`[data-shot="intake-sources-messages"] tr[data-batch-id="${batchId}"]`) as HTMLElement
    expect(msgRow).toHaveAttribute('data-message-state', 'held')
    expect(within(msgRow).getByText('Held', { selector: 'span' })).toBeInTheDocument()
    const sxRow = view().querySelector(`[data-shot="intake-sources-row"][data-source-id="${sx.id}"]`) as HTMLElement
    expect(sxRow).toHaveTextContent('1 message held')
  })

  it('has no control that writes to a source', () => {
    mount()
    const buttons = within(view()).queryAllByRole('button').map((b) => b.textContent ?? '')
    for (const label of buttons) expect(label).not.toMatch(/retry|connect|disconnect|send|switch/i)
    expect(screen.queryByText(/–|—/)).toBeNull()
  })
})

/** One feed item (build plan Phase 68): its kind, source mark, counts in words, flags and pick. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ArrivalItem } from '../../../../../domain/intake/arrivals'
import { freshAppState, useAppStore } from '../../../../../store'
import { FeedItem } from './FeedItem'
import { itemCountsText } from './feedText'

function arrival(patch: Partial<ArrivalItem> = {}): ArrivalItem {
  return {
    key: 'arr-1',
    kind: 'update',
    batchId: 'batch-1',
    rowIds: ['r1', 'r2', 'r3', 'r4'],
    openRowIds: ['r1', 'r2', 'r3', 'r4'],
    hospitalId: 'h-stg',
    source: { kind: 'rooms', label: 'Rooms PDF', senderEmail: 'tait.rooms@example.test' },
    receivedAtISO: `${useAppStore.getState().clock.todayISO}T07:42:00`,
    title: "Mr Okafor · St George's · Wed 25 Nov AM",
    counts: { rows: 4, open: 4, added: 1, changed: 1, cancelled: 0, unchanged: 1, removed: 1, waitingNhi: 1 },
    flags: { needsNhi: 1, toCheck: 3, dataQuality: 1, removals: 1 },
    decided: false,
    ...patch,
  }
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('FeedItem', () => {
  it('shows the kind, the source mark, the title, the counts in words, the flags and the time', () => {
    const item = arrival()
    render(<FeedItem item={item} selected={false} onSelect={() => {}} />)
    const option = screen.getByRole('option')
    expect(option).toHaveAttribute('data-arrival-kind', 'update')
    expect(option).toHaveAttribute('data-arrival-key', 'arr-1')
    expect(option).toHaveAttribute('aria-selected', 'false')
    expect(option).toHaveTextContent('Update')
    expect(option).toHaveTextContent("Mr Okafor · St George's · Wed 25 Nov AM")
    expect(option).toHaveTextContent('1 added · 1 changed · 1 removal · 1 the same')
    expect(option).toHaveTextContent('07:42')
    expect(option.querySelector('[data-source-kind="rooms"]')).toHaveTextContent('Rooms PDF')
    const flags = Array.from(option.querySelectorAll('[data-arrival-flag]')).map((f) => f.textContent)
    expect(flags).toEqual(['Needs NHI 1', 'Values to check 3', 'Removals 1', 'Data quality'])
  })

  it('marks a PDF added by hand, and a hospital feed by its name', () => {
    const { rerender } = render(<FeedItem item={arrival({ source: { kind: 'rooms', label: 'Rooms PDF', byHand: true } })} selected={false} onSelect={() => {}} />)
    expect(document.querySelector('[data-source-kind="rooms"]')).toHaveTextContent('Rooms PDF · by hand')
    rerender(<FeedItem item={arrival({ source: { kind: 'hospital', hospitalId: 'h-stg', label: "St George's" } })} selected={false} onSelect={() => {}} />)
    expect(document.querySelector('[data-source-kind="hospital"]')).toHaveTextContent("St George's")
  })

  it('inside a hospital file leaves the source and the time to the heading', () => {
    render(<FeedItem item={arrival()} grouped selected={false} onSelect={() => {}} />)
    expect(document.querySelector('[data-source-kind]')).toBeNull()
    expect(screen.getByRole('option')).not.toHaveTextContent('07:42')
  })

  it('is picked by a click, Enter or Space, and shows the pick with aria-selected', () => {
    const onSelect = vi.fn()
    const { rerender } = render(<FeedItem item={arrival()} selected={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('option'))
    fireEvent.keyDown(screen.getByRole('option'), { key: 'Enter' })
    fireEvent.keyDown(screen.getByRole('option'), { key: ' ' })
    expect(onSelect).toHaveBeenCalledTimes(3)
    expect(onSelect).toHaveBeenCalledWith('arr-1')
    rerender(<FeedItem item={arrival()} selected onSelect={onSelect} />)
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
  })

  it('renders every kind from the read model, and a needs-NHI row without repeating its flag', () => {
    for (const kind of ['update', 'newList', 'cancellation', 'unreadable', 'matchesExactly', 'held', 'needsNhi'] as const) {
      render(<FeedItem item={arrival({ kind, key: kind, reason: 'No text in the PDF' })} selected={false} onSelect={() => {}} />)
      expect(document.querySelector(`[data-arrival-kind="${kind}"]`)).not.toBeNull()
      cleanup()
    }
    render(<FeedItem item={arrival({ kind: 'needsNhi', flags: { needsNhi: 1 } })} selected={false} onSelect={() => {}} />)
    expect(document.querySelector('[data-arrival-flag="needsNhi"]')).toBeNull()
  })

  it('words the counts per kind', () => {
    expect(itemCountsText(arrival({ kind: 'newList' }))).toBe('4 patients')
    expect(itemCountsText(arrival({ kind: 'unreadable', reason: 'No text in the PDF' }))).toBe('No text in the PDF')
    expect(itemCountsText(arrival({ kind: 'needsNhi' }))).toBe('Waiting for an NHI')
    expect(itemCountsText(arrival({ counts: { rows: 1, open: 1, added: 0, changed: 0, cancelled: 0, unchanged: 1, removed: 0, waitingNhi: 0 } }))).toBe('1 patient')
  })
})

/** J and K through the feed (build plan Phase 68): next and previous across groups, never while typing. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { feedKeyAfter, useFeedKeys } from './useFeedKeys'

const KEYS = ['a', 'b', 'c']

function Harness({ start }: { start?: string }) {
  const [selected, setSelected] = useState<string | undefined>(start)
  useFeedKeys(KEYS, selected, setSelected)
  return (
    <div>
      <output data-testid="selected">{selected ?? 'none'}</output>
      <input aria-label="Search" />
      <div role="dialog" aria-modal="true">
        <button type="button">In a dialog</button>
      </div>
    </div>
  )
}

const selected = () => screen.getByTestId('selected').textContent

afterEach(cleanup)

describe('useFeedKeys', () => {
  it('J moves to the next item and K to the one before, stopping at either end', () => {
    render(<Harness start="a" />)
    fireEvent.keyDown(document.body, { key: 'j' })
    expect(selected()).toBe('b')
    fireEvent.keyDown(document.body, { key: 'j' })
    fireEvent.keyDown(document.body, { key: 'j' })
    expect(selected()).toBe('c')
    fireEvent.keyDown(document.body, { key: 'k' })
    expect(selected()).toBe('b')
    fireEvent.keyDown(document.body, { key: 'k' })
    fireEvent.keyDown(document.body, { key: 'k' })
    expect(selected()).toBe('a')
  })

  it('J with nothing picked picks the first item', () => {
    render(<Harness />)
    fireEvent.keyDown(document.body, { key: 'j' })
    expect(selected()).toBe('a')
  })

  it('is ignored while typing in the search box, inside a modal dialog, or with a modifier held', () => {
    render(<Harness start="a" />)
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search' }), { key: 'j' })
    fireEvent.keyDown(screen.getByRole('button', { name: 'In a dialog' }), { key: 'j' })
    fireEvent.keyDown(document.body, { key: 'j', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'j', metaKey: true })
    fireEvent.keyDown(document.body, { key: 'J', shiftKey: true })
    expect(selected()).toBe('a')
  })

  it('feedKeyAfter reads the feed order', () => {
    expect(feedKeyAfter(KEYS, 'b', 1)).toBe('c')
    expect(feedKeyAfter(KEYS, 'b', -1)).toBe('a')
    expect(feedKeyAfter(KEYS, 'c', 1)).toBeUndefined()
    expect(feedKeyAfter(KEYS, 'gone', 1)).toBe('a')
    expect(feedKeyAfter([], undefined, 1)).toBeUndefined()
  })
})

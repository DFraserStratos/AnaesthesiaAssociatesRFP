/**
 * A demo trigger's confirm step (catch-up Phase 43): on an entry with a
 * `confirm` line the first Run only arms it (the line and a Confirm button
 * show) and nothing runs; Cancel disarms it.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DemoActionsMenu } from './DemoActionsMenu'
import { scaleMode } from '../store/scaleMode'

describe('the confirm step', () => {
  it('Load full-scale data needs a second click; Cancel disarms it', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/finances/invoices']}>
        <DemoActionsMenu />
      </MemoryRouter>,
    )
    fireEvent.click(container.querySelector('[data-shot="demo-actions"]')!)
    const row = container.querySelector('[data-shot="demo-action-load-full-scale"]') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Run' }))
    expect(within(row).getByText('Replaces the current demo data. Reset returns to it.')).toBeTruthy()
    expect(within(row).getByRole('button', { name: 'Confirm' })).toBeTruthy()
    expect(scaleMode().mode).toBe('demo')
    fireEvent.click(within(row).getByRole('button', { name: 'Cancel' }))
    expect(within(row).getByRole('button', { name: 'Run' })).toBeTruthy()
    expect(screen.queryByText('Replaces the current demo data. Reset returns to it.')).toBeNull()
  })
})

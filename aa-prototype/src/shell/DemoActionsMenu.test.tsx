import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { resetDemo, useAppStore } from '../store'
import { DemoActionsMenu } from './DemoActionsMenu'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DemoActionsMenu />
    </MemoryRouter>,
  )
}

describe('DemoActionsMenu', () => {
  afterEach(() => {
    resetDemo(useAppStore)
  })

  it('is not rendered on a screen with no entries', () => {
    const { container } = renderAt('/admin/review')
    expect(container.innerHTML).toBe('')
  })

  it('lists the Billing monitor entries, runs one, and closes on Escape', () => {
    renderAt('/admin/billing')
    const pill = screen.getByRole('button', { name: /Demo actions for this screen, 4/ })
    fireEvent.click(pill)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    for (const label of ['Trigger billing failure', 'Arm handoff failure', 'Run reconciliation poll', 'Run archive job']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    const row = document.querySelector('[data-shot="demo-action-arm-handoff-fault"]')
    const run = row?.querySelector('button')
    expect(run).toBeTruthy()
    if (run !== null && run !== undefined) fireEvent.click(run)
    expect(row?.querySelector('[role="status"]')?.textContent).toMatch(/^Armed\./)
    // Re-evaluated live: the entry is now disabled with its reason.
    expect(row?.querySelector('button')).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(pill)
  })
})

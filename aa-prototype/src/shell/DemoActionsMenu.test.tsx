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
    // Not an app route: since catch-up Phase 43a every Mobile, Web and Admin screen holds "Show first-run hints again".
    const { container } = renderAt('/demo/catalogue/admin')
    expect(container.innerHTML).toBe('')
  })

  it('lists the Billing monitor entries, runs one, and closes on Escape', () => {
    renderAt('/admin/billing')
    // Ten Billing monitor entries and catch-up Phase 43a's app-wide "Show first-run hints again".
    const pill = screen.getByRole('button', { name: /Demo actions for this screen, 11/ })
    fireEvent.click(pill)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    for (const label of ['Trigger billing failure', 'Arm handoff failure', 'Simulate Xero outage', 'Restore Xero', 'Run reconciliation poll', 'Run archive job', 'Run the next billing run', 'Stage refund after payout', 'Stage a payment week', 'Stage a bank mismatch', 'Show first-run hints again']) {
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

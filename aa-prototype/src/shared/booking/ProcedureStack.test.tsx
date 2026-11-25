/**
 * The procedure card (catch-up Phase 20a; US-02.5.7, US-03.1.9): on a Booking
 * only the latest procedure text, as received, with when and where it came
 * from; the compact Review row adds the Contract and the RVG code. It renders
 * the view and derives nothing.
 */

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ProcedureStack } from './ProcedureStack'
import type { ProcedureStackView } from '../../domain/billing/procedureStack'

const VIEW: ProcedureStackView = {
  procedureText: { text: 'right total knee', source: 'hospitalDownload', receivedAtISO: '2026-11-23T16:00:00', from: "St George's" },
  invoiceDescription: { text: 'Knee replacement', origin: 'edited', newer: { text: 'right total knee', origin: 'hospital' } },
  contract: {
    id: 'CT-X',
    name: 'Southern Cross knee replacement',
    aaCode: 'SX-901',
    holderName: 'Southern Cross',
    invoiced: { name: 'Southern Cross', kind: 'holder' },
    basis: { kind: 'fixed', amount: 3565 },
  },
  rvg: { code: 'LL4', description: 'Major hip or knee joint procedures' },
}

describe('ProcedureStack, the Booking card', () => {
  it('shows only the latest text with its time and source', () => {
    const { container } = render(<ProcedureStack view={VIEW} density="full" surface="anaesthetist" />)
    const text = container.querySelector('[data-shot=procedure-text]')!
    expect(text.textContent).toContain('right total knee')
    expect(text.textContent).toContain('23 Nov, 16:00 · Hospital download, St George')
  })

  it('shows no invoice description, Contract or RVG code: those live on the invoice and in the Billing and RVG cards', () => {
    const { container } = render(<ProcedureStack view={VIEW} density="full" surface="office" />)
    expect(container.textContent).not.toContain('Knee replacement')
    expect(container.textContent).not.toContain('Southern Cross knee replacement')
    expect(container.textContent).not.toContain('LL4')
    expect(container.querySelector('[data-shot=procedure-contract]')).toBeNull()
    expect(container.querySelector('[data-shot=procedure-invoice-description]')).toBeNull()
  })

  it('keeps procedure-header on its heading row with the actions inside', () => {
    render(<ProcedureStack view={VIEW} density="full" surface="office" heading="Procedure 2" actions={<button>Edit</button>} />)
    const header = screen.getByTestId('procedure-header')
    expect(within(header).getByText('Procedure 2')).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('says so when no text has been received', () => {
    render(<ProcedureStack view={{ ...VIEW, procedureText: null }} density="full" surface="office" />)
    expect(screen.getByText('No procedure text received yet')).toBeInTheDocument()
  })

  it('has no en or em dash in any rendered string', () => {
    const { container } = render(<ProcedureStack view={VIEW} density="full" surface="anaesthetist" />)
    expect(container.textContent).not.toMatch(/[–—]/)
  })
})

describe('ProcedureStack, the compact Review line', () => {
  it('the text, the Contract ellipsed with its full words in a title; no invoice description', () => {
    const { container } = render(<ProcedureStack view={VIEW} density="compact" surface="office" />)
    const contract = container.querySelector('[data-shot=procedure-contract]') as HTMLElement
    expect(contract.style.textOverflow).toBe('ellipsis')
    expect(contract.getAttribute('title')).toContain('Southern Cross knee replacement, held by Southern Cross')
    expect(container.querySelector('[data-shot=procedure-text]')!.getAttribute('title')).toBe('right total knee')
    expect(container.querySelector('[data-shot=procedure-invoice-description]')).toBeNull()
    expect(screen.getByText('Fixed price $3,565.00', { exact: false })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/[–—]/)
  })

  it('marks an RVG code still to choose in neutral words', () => {
    render(<ProcedureStack view={{ ...VIEW, contract: null, rvg: 'forAnaesthetist' }} density="compact" surface="office" />)
    expect(screen.getByText('Needs an invoice destination', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('RVG code: for the anaesthetist', { exact: false })).toBeInTheDocument()
  })

  it('leads with the RVG code chip, says the description in full, and leaves a typed price to the Fee cell', () => {
    const view: ProcedureStackView = {
      ...VIEW,
      rvg: { code: 'A3', description: 'Moderate procedures' },
      contract: { ...VIEW.contract!, name: 'No contract · RVG', basis: { kind: 'rvgAnaesthetistRate', typed: 0 } },
    }
    const { container } = render(<ProcedureStack view={view} density="compact" surface="office" badge={<span>Primary</span>} />)
    expect(container.querySelector('[data-shot=procedure-rvg-chip]')!.textContent).toBe('A3')
    expect(container.querySelector('[data-shot=procedure-rvg-code]')!.textContent).toContain('Moderate procedures')
    const contract = container.querySelector('[data-shot=procedure-contract]')!
    expect(contract.textContent).toContain("No contract · RVG, at the anaesthetist's rate")
    expect(contract.textContent).not.toContain('Price typed')
    expect(container.querySelector('[data-shot=procedure-text]')!.textContent).toContain('Primary')
  })
})

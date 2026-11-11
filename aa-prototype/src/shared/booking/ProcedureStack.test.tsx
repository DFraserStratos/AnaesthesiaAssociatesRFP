/**
 * The procedure stack component (catch-up Phase 20a; US-03.1.9, US-03.1.2):
 * it renders the view and derives nothing.
 */

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ProcedureStack } from './ProcedureStack'
import type { ProcedureStackView } from '../../domain/billing/procedureStack'

const FULL: ProcedureStackView = {
  procedureText: { text: 'right total knee', source: 'hospitalDownload', receivedAtISO: '2026-07-20T16:00:00' },
  invoiceDescription: { text: 'right total knee', origin: 'hospital' },
  contract: {
    id: 'CT-X',
    name: 'Southern Cross knee replacement',
    aaCode: 'SX-901',
    holderName: 'Southern Cross',
    invoiced: { name: 'Southern Cross', kind: 'holder' },
    basis: { kind: 'fixed', amount: 3565 },
  },
  rvg: null,
}

const NOT_MATCHED: ProcedureStackView = {
  procedureText: { text: 'blephs', source: 'surgeonPdf', receivedAtISO: '2026-07-21T09:00:00' },
  invoiceDescription: { text: 'blephs', origin: 'rooms' },
  contract: null,
  rvg: 'toChoose',
}

function allText(container: HTMLElement): string {
  return container.textContent ?? ''
}

describe('ProcedureStack, full density', () => {
  it('shows the parts in order, each label before its value', () => {
    const { container } = render(<ProcedureStack view={FULL} density="full" surface="anaesthetist" />)
    const items = within(container.querySelector('ol')!).getAllByRole('listitem')
    expect(items.map((li) => li.getAttribute('data-shot'))).toEqual(['procedure-text', 'procedure-invoice-description', 'procedure-contract'])
    expect(items[0]!.textContent).toMatch(/^Procedure text.*right total knee.*Hospital download · Mon 20 Jul$/)
    expect(items[2]!.textContent).toContain('Held by Southern Cross')
    expect(items[2]!.textContent).toContain('Invoiced: Southern Cross')
    expect(items[2]!.textContent).toContain('Fixed price $3,565')
  })

  it('leaves the RVG code out on a fixed price with none picked, shows it where picked, "to choose" on an RVG Contract', () => {
    const { container, rerender } = render(<ProcedureStack view={FULL} density="full" surface="office" />)
    expect(container.querySelector('[data-shot=procedure-rvg-code]')).toBeNull()
    rerender(<ProcedureStack view={{ ...FULL, rvg: { code: 'LL4', description: 'Major hip or knee joint procedures' } }} density="full" surface="office" />)
    expect(container.querySelector('[data-shot=procedure-rvg-code]')!.textContent).toContain('LL4')
    rerender(<ProcedureStack view={{ ...FULL, rvg: 'forAnaesthetist' }} density="full" surface="office" />)
    expect(screen.getByText('RVG code: for the anaesthetist to fill in')).toBeInTheDocument()
    rerender(<ProcedureStack view={{ ...FULL, rvg: 'toChoose' }} density="full" surface="anaesthetist" />)
    expect(screen.getByText('RVG code to choose')).toBeInTheDocument()
  })

  it('"Not matched yet": the text shows, the Contract needs an invoice destination', () => {
    render(<ProcedureStack view={NOT_MATCHED} density="full" surface="anaesthetist" />)
    expect(screen.getAllByText('blephs')).toHaveLength(2)
    expect(screen.getByText('Needs an invoice destination')).toBeInTheDocument()
    expect(screen.getByText('RVG code to choose')).toBeInTheDocument()
  })

  it.each([
    ['rooms', "From the surgeon's rooms"],
    ['entered', 'As entered'],
    ['hospital', 'From the hospital'],
    ['contract', 'From the Contract'],
    ['edited', 'Edited by the office'],
  ] as const)('names the invoice description origin %s', (origin, line) => {
    render(<ProcedureStack view={{ ...FULL, invoiceDescription: { text: 'x', origin } }} density="full" surface="office" />)
    expect(screen.getByText(line)).toBeInTheDocument()
  })

  it('shows the newer-description cue only when the view carries one, with the caller\'s action', () => {
    const { container, rerender } = render(<ProcedureStack view={FULL} density="full" surface="office" newerAction={<button>Use it</button>} />)
    expect(container.querySelector('[data-shot=procedure-newer-description]')).toBeNull()
    rerender(
      <ProcedureStack
        view={{ ...FULL, invoiceDescription: { text: 'Knee replacement', origin: 'edited', newer: { text: 'right total knee', origin: 'hospital' } } }}
        density="full"
        surface="office"
        newerAction={<button>Use it</button>}
      />,
    )
    const cue = container.querySelector('[data-shot=procedure-newer-description]')!
    expect(cue.textContent).toContain('A newer description has arrived')
    expect(within(cue as HTMLElement).getByRole('button', { name: 'Use it' })).toBeInTheDocument()
  })

  it('keeps procedure-header on its heading row with the actions inside, and "No description received" when empty', () => {
    render(
      <ProcedureStack view={{ ...NOT_MATCHED, procedureText: null, invoiceDescription: null }} density="full" surface="office" heading="Procedure 2" actions={<button>Edit</button>} />,
    )
    const header = screen.getByTestId('procedure-header')
    expect(within(header).getByText('Procedure 2')).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByText('No description received')).toBeInTheDocument()
    expect(screen.getByText('Invoice description to choose')).toBeInTheDocument()
  })

  it('has no en or em dash in any rendered string', () => {
    const { container } = render(<ProcedureStack view={FULL} density="full" surface="anaesthetist" />)
    expect(allText(container)).not.toMatch(/[–—]/)
  })
})

describe('ProcedureStack, compact density', () => {
  it('one line per part, ellipsed, with the full text in a title; the Contract part keeps procedure-contract', () => {
    const { container } = render(<ProcedureStack view={FULL} density="compact" surface="office" />)
    const contract = container.querySelector('[data-shot=procedure-contract]') as HTMLElement
    expect(contract.style.textOverflow).toBe('ellipsis')
    expect(contract.getAttribute('title')).toContain('Southern Cross knee replacement, held by Southern Cross')
    expect(container.querySelector('[data-shot=procedure-text]')!.getAttribute('title')).toBe('right total knee')
    expect(allText(container)).not.toMatch(/[–—]/)
  })
})

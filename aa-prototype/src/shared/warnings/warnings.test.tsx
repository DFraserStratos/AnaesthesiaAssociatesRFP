/**
 * Shared warning UI (catch-up Phase 15a; US-13.7.2, US-13.7.3): the triangle is
 * a marker (no button, no dialog), the panel lists each warning with its own
 * text, Clear is office only and a cleared row shows who cleared it.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore } from '../../store'
import { SEED_MARKERS } from '../../domain/seed'
import type { Warning } from '../../domain/warnings'
import { WarningTriangle } from './WarningTriangle'
import { WarningsPanel } from './WarningsPanel'

const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId

function warning(over: Partial<Warning> = {}): Warning {
  return {
    key: `${RILEY}:prepaymentUnpaid`,
    bookingId: RILEY,
    ruleId: 'prepaymentUnpaid',
    kind: 'beforeProcedure',
    strength: 'strong',
    text: 'Prepayment required. No prepayment invoice has been raised yet.',
    ...over,
  }
}

const TWO: Warning[] = [
  warning(),
  warning({ key: `${RILEY}:prepaymentUnpaid:P9`, kind: 'afterProcedure', strength: 'mild', text: 'A second, mild warning.', procedureId: 'P9' }),
]

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('WarningTriangle', () => {
  it('is a labelled image, never a button or a dialog (no tap-to-read)', () => {
    const { container } = render(<WarningTriangle warnings={TWO} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAccessibleName(/^2 warnings: Prepayment required/)
    expect(img).toHaveAttribute('data-shot', 'booking-warning')
    expect(img).toHaveAttribute('data-strength', 'strong')
    expect(img).toHaveTextContent('2')
    expect(container.querySelector('button')).toBeNull()
    fireEvent.click(img)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders nothing with no warnings, and reads cleared when every warning is cleared', () => {
    const { container, rerender } = render(<WarningTriangle warnings={[]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(
      <WarningTriangle
        warnings={[warning({ clearance: { key: 'k', bookingId: RILEY, ruleId: 'prepaymentUnpaid', strength: 'strong', by: 'Kirsty W.', role: 'office', atISO: '2026-07-21T10:05:00' } })]}
      />,
    )
    expect(screen.getByRole('img')).toHaveAttribute('data-strength', 'cleared')
    expect(screen.getByRole('img')).toHaveAccessibleName(/^Warning cleared/)
  })
})

describe('WarningsPanel', () => {
  it('two warnings render two rows, each with its own text, kind and strength', () => {
    render(<WarningsPanel warnings={TWO} actor={SOUTER_ACTOR} canClear={false} />)
    const panel = screen.getByRole('region', { name: /Warnings/ })
    const rows = within(panel).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Prepayment required')
    expect(rows[0]).toHaveTextContent('Before procedure')
    expect(rows[0]).toHaveTextContent('Strong')
    expect(rows[1]).toHaveTextContent('A second, mild warning.')
    expect(rows[1]).toHaveTextContent('After procedure')
    expect(rows[1]).toHaveTextContent('Mild')
    expect(within(panel).queryByRole('button')).toBeNull()
  })

  it('Clear shows for the office only; a mild one reads optional', () => {
    render(<WarningsPanel warnings={TWO} actor={OFFICE_ACTOR} canClear />)
    expect(screen.getByRole('button', { name: 'Clear warning: Prepayment required. No prepayment invoice has been raised yet.' })).toHaveTextContent(/^Clear$/)
    expect(screen.getByRole('button', { name: 'Clear (optional) warning: A second, mild warning.' })).toHaveTextContent('Clear (optional)')
  })

  it('Clear records the clearance; the re-rendered row reads who cleared it and when', () => {
    const { rerender } = render(<WarningsPanel warnings={[warning()]} actor={OFFICE_ACTOR} canClear />)
    fireEvent.click(screen.getByRole('button', { name: /^Clear warning:/ }))
    const clearance = useAppStore.getState().schedule.warningClearances[`${RILEY}:prepaymentUnpaid`]
    expect(clearance).toMatchObject({ by: 'Kirsty W.', role: 'office' })
    rerender(<WarningsPanel warnings={[warning({ clearance })]} actor={OFFICE_ACTOR} canClear />)
    expect(screen.getByText(/^Cleared by Kirsty W\., Tue 21 Jul \d\d:\d\d$/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull()
    expect(screen.getByRole('heading', { name: /All cleared/ })).toBeInTheDocument()
  })
})

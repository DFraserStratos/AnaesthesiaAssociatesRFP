import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { accent, neutral } from '../../theme/tokens'
import { OptionRow } from './OptionRow'
import { RadioCard } from './RadioCard'
import { useRovingRadio } from './useRovingRadio'

/** Catch-up Phase 33's review: the one radio card (Matching's decision and import dialog) and the pick-list row. */
function Cards() {
  const values = ['create', 'draft', 'reject'] as const
  const [value, setValue] = useState<string | undefined>('create')
  const radio = useRovingRadio<string>({ values, value, onChange: setValue, isDisabled: (v) => v === 'draft' })
  return (
    <div {...radio.groupProps} aria-label="Decision">
      <RadioCard radio={radio.itemProps(0)} checked={value === 'create'} onSelect={() => setValue('create')} title="Create Booking" description="On a List." data-decision="create">
        <span>List picker</span>
      </RadioCard>
      <RadioCard radio={radio.itemProps(1)} checked={value === 'draft'} onSelect={() => setValue('draft')} title="Create a Draft List" description="Holds it." disabledReason="Add the NHI first." data-decision="draft" />
      <RadioCard radio={radio.itemProps(2)} checked={value === 'reject'} onSelect={() => setValue('reject')} title="Reject" description="Nothing changes." data-decision="reject">
        <span>Reason</span>
      </RadioCard>
    </div>
  )
}

describe('RadioCard', () => {
  it('is a radio named by its words, data-* on the radio, the checked card in the teal accent with its controls', () => {
    render(<Cards />)
    const create = screen.getByRole('radio', { name: /Create Booking/ })
    expect(create).toHaveAttribute('data-decision', 'create')
    expect(create).toHaveAttribute('aria-checked', 'true')
    const card = create.parentElement as HTMLElement
    expect(card.style.boxShadow).toContain('inset 0 0 0 1px')
    expect(card).toHaveStyle({ borderColor: accent.base })
    expect(screen.getByText('List picker')).toBeInTheDocument()
    expect(screen.queryByText('Reason')).toBeNull()
  })

  it('a disabled card shows its reason, is aria-disabled and ignores clicks and keys', () => {
    render(<Cards />)
    const draft = screen.getByRole('radio', { name: /Draft List/ })
    expect(draft).toHaveAttribute('aria-disabled', 'true')
    expect(draft).toHaveTextContent('Add the NHI first.')
    expect(draft.parentElement).toHaveStyle({ background: neutral.bg })
    fireEvent.click(draft)
    fireEvent.keyDown(draft, { key: ' ' })
    expect(draft).toHaveAttribute('aria-checked', 'false')
  })

  it('a click or Space selects; arrows skip the disabled card', () => {
    render(<Cards />)
    const reject = screen.getByRole('radio', { name: /Reject/ })
    fireEvent.keyDown(reject, { key: ' ' })
    expect(reject).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Reason')).toBeInTheDocument()
    fireEvent.keyDown(reject, { key: 'ArrowDown' })
    expect(screen.getByRole('radio', { name: /Create Booking/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(reject)
    expect(reject).toHaveAttribute('aria-checked', 'true')
  })
})

describe('OptionRow', () => {
  it('a button with its trailing facts; selected reads aria-pressed in the teal accent; data-* pass through', () => {
    let picked = 0
    render(
      <>
        <OptionRow data-search-booking="B1" trailing="AM · 08:30" selected onClick={() => picked++}>Rosa Mendes</OptionRow>
        <OptionRow data-search-booking="B2" onClick={() => {}}>Ana Ruiz</OptionRow>
      </>,
    )
    const rosa = screen.getByRole('button', { name: /Rosa Mendes/ })
    expect(rosa).toHaveAttribute('data-search-booking', 'B1')
    expect(rosa).toHaveAttribute('aria-pressed', 'true')
    expect(rosa).toHaveStyle({ border: `1px solid ${accent.base}`, background: accent.tint })
    expect(rosa).toHaveTextContent('AM · 08:30')
    expect(screen.getByRole('button', { name: 'Ana Ruiz' })).toHaveStyle({ border: `1px solid ${neutral.line}`, background: neutral.surface })
    fireEvent.click(rosa)
    expect(picked).toBe(1)
  })
})

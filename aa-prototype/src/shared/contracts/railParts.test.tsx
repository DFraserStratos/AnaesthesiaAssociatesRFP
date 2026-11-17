import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Contract } from '../../domain/types'
import type { RailOption } from '../../domain/billing/contractRail'
import { contractMatchesQuery } from '../../domain/billing/contracts'
import { buildSeed } from '../../domain/seed'
import { BackstopAmountField, NoContractGroup, RailOptionGroup, StepRail, type RailStep } from './railParts'
import { railContractLabel } from './railText'

/** UI unification U4 (U24): the Contract chooser's parts, built once. */

const OPTIONS: RailOption[] = [
  { value: 'patient', label: 'Patient', count: 3, selectable: true, suggested: true },
  { value: 'hospital', label: 'Hospital', count: 0, selectable: false },
  { value: 'holder', label: 'Special holder', count: 2, selectable: true },
] as RailOption[]

describe('RailOptionGroup', () => {
  it.each(['list', 'tiles'] as const)('%s: a named radio group with one Tab stop and one Suggested pill', (layout) => {
    render(<RailOptionGroup layout={layout} label="Where does the invoice go?" options={OPTIONS} value={undefined} onPick={() => undefined} />)
    const group = screen.getByRole('radiogroup', { name: 'Where does the invoice go?' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1)
    expect(within(group).getAllByText('Suggested')).toHaveLength(1)
    expect(group.querySelector('[data-rail-option=patient]')).not.toBeNull()
  })

  it('arrows move focus without picking (a pick saves and moves the rail on); Space or a click picks', () => {
    const onPick = vi.fn()
    render(<RailOptionGroup layout="tiles" label="Where" options={OPTIONS} value="patient" onPick={onPick} />)
    const patient = screen.getByRole('radio', { name: /Patient/ })
    patient.focus()
    fireEvent.keyDown(patient, { key: 'ArrowDown' })
    // Hospital is disabled: skipped.
    const holder = screen.getByRole('radio', { name: /Special holder/ })
    expect(holder).toHaveFocus()
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.click(holder)
    expect(onPick).toHaveBeenCalledWith('holder')
  })
})

describe('StepRail', () => {
  const steps: RailStep[] = [
    { n: 1, label: 'Invoice to', value: 'Patient', auto: false, done: true, current: false, onJump: () => undefined },
    { n: 2, label: 'Payment type', auto: false, done: false, current: true },
    { n: 3, label: 'Price', auto: false, done: false, current: false },
  ]

  it.each(['vertical', 'compact'] as const)('%s: an ordered list with the current step marked', (orientation) => {
    const { container } = render(<StepRail steps={steps} orientation={orientation} label="Billing steps" />)
    const nav = screen.getByRole('navigation', { name: 'Billing steps' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3)
    expect(nav.querySelector('ol')).not.toBeNull()
    const current = container.querySelector('[aria-current="step"]')
    expect(current).toHaveAttribute('data-shot', 'contract-rail-step-2')
    expect(container.querySelector('[data-shot="contract-rail-step-3"]')).toBeDisabled()
  })
})

describe('NoContractGroup', () => {
  it('heads the list with "No contract" and its two backstops', () => {
    const seed = buildSeed()
    const backstops = Object.values(seed.masters.contracts).filter((c) => c.systemRole === 'noContractRvg' || (c.systemRole === 'openPriceFallback' && !c.prepaid)).slice(0, 2)
    render(<NoContractGroup backstops={backstops} renderRow={(c: Contract) => <div key={c.id}>{railContractLabel(c)}</div>} />)
    expect(screen.getByText('No contract')).toBeInTheDocument()
    expect(screen.getByText('No contract · RVG')).toBeInTheDocument()
    expect(screen.getByText('No contract · Fixed price')).toBeInTheDocument()
  })
})

describe('BackstopAmountField', () => {
  function Harness() {
    const [v, setV] = useState('12.345')
    return <BackstopAmountField label={<span>Fixed price</span>} ariaLabel="Fixed price, ex GST" value={v} onChange={setV} invalid={v === '12.345'} />
  }

  it('is 44px with the amount hook, and says why it is invalid', () => {
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Fixed price, ex GST' })
    expect(input).toHaveAttribute('data-shot', 'contract-rail-amount')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveStyle({ minHeight: '44px' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Type the amount in dollars and cents.')
    fireEvent.change(input, { target: { value: '12.35' } })
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAccessibleDescription('Type the price for this procedure.')
  })
})

describe('the Contract combo matcher', () => {
  it('is the one matcher: "Southern" finds what contractMatchesQuery finds', () => {
    const seed = buildSeed()
    const all = Object.values(seed.masters.contracts)
    const hits = all.filter((c) => contractMatchesQuery(c, 'Southern', seed.masters.rvgGroups))
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((c) => [c.name, c.aaCode, c.holderReference ?? '', c.invoiceDescription ?? ''].some((f) => f.replace(/\s+/g, '').toLowerCase().includes('southern')))).toBe(true)
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { neutral } from '../../theme/tokens'
import { Checkbox } from './Checkbox'
import { FieldHint, SelectField, TextArea, TextField } from './Field'
import { FIELD_FILL } from './fieldChrome'
import { NameSearchBox } from './NameSearchBox'
import { Switch } from './Switch'

/** UI unification U4 (U15, U07, U06): one field chrome, one fill rule, one focus ring. */
describe('the field chrome', () => {
  it('every field control carries aa-field for the one focus ring', () => {
    render(
      <>
        <TextField label="Name" value="" onChange={() => undefined} />
        <TextArea label="Note" value="" onChange={() => undefined} />
        <SelectField label="Hospital" value="a" onChange={() => undefined}>
          <option value="a">A</option>
        </SelectField>
        <NameSearchBox label="Find" value="" onChange={() => undefined} />
        <Checkbox checked={false} onChange={() => undefined}>Show resolved</Checkbox>
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveClass('aa-field')
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveClass('aa-field')
    expect(screen.getByRole('combobox', { name: 'Hospital' })).toHaveClass('aa-field')
    expect(screen.getByRole('searchbox', { name: 'Find' })).toHaveClass('aa-field')
    expect(screen.getByRole('checkbox', { name: 'Show resolved' })).toHaveClass('aa-field')
  })

  it('defaults keep today\'s look: TextField 48px in a grey well', () => {
    render(<TextField label="Name" value="" onChange={() => undefined} />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveStyle({ minHeight: '48px', background: neutral.bg })
  })

  it('compact is 36px and surface is white', () => {
    render(
      <SelectField label="When" value="a" onChange={() => undefined} size="compact" fill="surface" hideLabel>
        <option value="a">A</option>
      </SelectField>,
    )
    expect(screen.getByRole('combobox', { name: 'When' })).toHaveStyle({ minHeight: '36px', background: FIELD_FILL.surface })
  })
})

describe('TextField', () => {
  it('invalid sets aria-invalid and the hint is read with the field', () => {
    render(<TextField label="Amount" value="1.234" onChange={() => undefined} invalid hint="Type the amount in dollars and cents." inputMode="decimal" align="right" />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Type the amount in dollars and cents.')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveStyle({ textAlign: 'right' })
  })

  it('hideLabel names the control; shot and data-* land on the input', () => {
    render(<TextField label="New range start" value="" onChange={() => undefined} type="date" hideLabel shot="range-start" data-testid="start" />)
    const input = screen.getByLabelText('New range start')
    expect(input).toHaveAttribute('aria-label', 'New range start')
    expect(input).toHaveAttribute('data-shot', 'range-start')
    expect(input).toHaveAttribute('data-testid', 'start')
  })

  it('takes number, time, min and max', () => {
    render(<TextField label="Months" type="number" min={1} max={12} value="4" onChange={() => undefined} />)
    const input = screen.getByRole('spinbutton', { name: 'Months' })
    expect(input).toHaveAttribute('min', '1')
    expect(input).toHaveAttribute('max', '12')
  })
})

describe('TextArea', () => {
  it('counts and caps with maxLength', () => {
    function Harness() {
      const [v, setV] = useState('abc')
      return <TextArea ariaLabel="Reason" value={v} onChange={setV} maxLength={10} />
    }
    render(<Harness />)
    const area = screen.getByRole('textbox', { name: 'Reason' })
    expect(area).toHaveAttribute('maxlength', '10')
    expect(screen.getByText('3/10')).toBeInTheDocument()
    fireEvent.change(area, { target: { value: 'abcdef' } })
    expect(screen.getByText('6/10')).toBeInTheDocument()
  })

  it('a soft limit counts the trimmed text and does not cap', () => {
    render(<TextArea label="Note" value="  hello  " onChange={() => undefined} maxLength={3} cap={false} countTrimmed />)
    expect(screen.getByRole('textbox', { name: 'Note' })).not.toHaveAttribute('maxlength')
    expect(screen.getByText('5/3')).toBeInTheDocument()
  })
})

describe('FieldHint', () => {
  it('is 12px mist and takes an id', () => {
    render(<FieldHint id="h">Quiet line</FieldHint>)
    expect(screen.getByText('Quiet line')).toHaveAttribute('id', 'h')
    expect(screen.getByText('Quiet line')).toHaveStyle({ fontSize: '12px', color: neutral.mist })
  })
})

describe('SelectField', () => {
  it('ties its label, puts shot on the select and labelShot on the wrapper', () => {
    const onChange = vi.fn()
    const { container } = render(
      <SelectField label="Surgeon" value="a" onChange={onChange} shot="surgeon-picker" labelShot="surgeon-filter" hint="Only surgeons at this hospital">
        <option value="a">A</option>
        <option value="b">B</option>
      </SelectField>,
    )
    const select = screen.getByRole('combobox', { name: 'Surgeon' })
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveAttribute('data-shot', 'surgeon-picker')
    expect(select).toHaveAccessibleDescription('Only surgeons at this hospital')
    expect(container.querySelector('[data-shot="surgeon-filter"]')).toContainElement(select)
    fireEvent.change(select, { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('hideLabel gives a literal aria-label', () => {
    render(
      <SelectField label="Hospital" value="" onChange={() => undefined} hideLabel>
        <option value="">Every hospital</option>
      </SelectField>,
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Hospital')
  })
})

describe('Checkbox', () => {
  it('is teal and toggles from its label', () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} shot="show-resolved">Show resolved</Checkbox>)
    const box = screen.getByRole('checkbox', { name: 'Show resolved' })
    expect(box).toHaveStyle({ accentColor: '#0D6E63' })
    expect(box).toHaveAttribute('data-shot', 'show-resolved')
    fireEvent.click(screen.getByText('Show resolved'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('Switch', () => {
  it('toggles on click and reports aria-checked', () => {
    function Harness() {
      const [on, setOn] = useState(false)
      return <Switch checked={on} onChange={setOn} label="Ask for approval" description="Before the invoice is sent" />
    }
    render(<Harness />)
    const sw = screen.getByRole('switch', { name: /Ask for approval/ })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('is a native button, so Space toggles it', () => {
    render(<Switch checked={false} onChange={() => undefined} label="On" />)
    const sw = screen.getByRole('switch', { name: 'On' })
    expect(sw.tagName).toBe('BUTTON')
    expect(sw).toHaveAttribute('type', 'button')
  })
})

describe('NameSearchBox', () => {
  function Harness({ onKey }: { onKey?: () => void }) {
    const [v, setV] = useState('Mitchell')
    return (
      <div onKeyDown={onKey}>
        <NameSearchBox value={v} onChange={setV} label="Search your Bookings" testId="mobile-lists-search" fill="well" touch clearLabel="Clear search" />
      </div>
    )
  }

  it('fills by the rule and puts testId on the input', () => {
    render(<Harness />)
    const box = screen.getByRole('searchbox', { name: 'Search your Bookings' })
    expect(box).toHaveAttribute('data-testid', 'mobile-lists-search')
    expect(box).toHaveStyle({ background: neutral.bg })
  })

  it('Escape clears and does not bubble to a sheet behind', () => {
    const outer = vi.fn()
    render(<Harness onKey={outer} />)
    const box = screen.getByRole('searchbox', { name: 'Search your Bookings' })
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(box).toHaveValue('')
    expect(outer).not.toHaveBeenCalled()
  })

  it('the clear button is named, 44px with touch, and returns focus to the box', () => {
    render(<Harness />)
    const clear = screen.getByRole('button', { name: 'Clear search' })
    expect(clear).toHaveStyle({ width: '44px', height: '44px' })
    fireEvent.click(clear)
    const box = screen.getByRole('searchbox', { name: 'Search your Bookings' })
    expect(box).toHaveValue('')
    expect(box).toHaveFocus()
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ChipMultiSelect } from './ChipMultiSelect'

/** UI unification U4 (U34): the Contract panel's Linked surgeons on the shared chip multi-select. */
function Harness() {
  const [ids, setIds] = useState<string[]>([])
  return <ChipMultiSelect label="Linked surgeons" addLabel="Add a surgeon" options={[{ id: 'a', name: 'Mr Ash' }, { id: 'b', name: 'Ms Birch' }]} value={ids} onChange={setIds} />
}

describe('ChipMultiSelect', () => {
  it('is named, adds a chip to a named list, and returns focus to the select after a remove', () => {
    render(<Harness />)
    const select = screen.getByRole('combobox', { name: 'Linked surgeons' })
    fireEvent.change(select, { target: { value: 'b' } })
    const list = screen.getByRole('list', { name: 'Linked surgeons chosen' })
    expect(within(list).getByText('Ms Birch')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Ms Birch' }))
    expect(screen.queryByRole('list', { name: 'Linked surgeons chosen' })).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Linked surgeons' })).toHaveFocus()
  })

  it('ordered (catch-up Phase 17a): the first chip is the main one, Make main moves another to the front and returns focus', () => {
    function Ordered() {
      const [ids, setIds] = useState<string[]>(['a', 'b'])
      return (
        <ChipMultiSelect
          label="Surgeons' rooms"
          addLabel="Add another room"
          options={[{ id: 'a', name: 'Avonhead ENT' }, { id: 'b', name: 'Burnside ENT' }, { id: 'c', name: 'Redwood Eye' }]}
          value={ids}
          onChange={setIds}
          ordered={{ firstLabel: 'Main room', promoteLabel: 'Make main' }}
        />
      )
    }
    render(<Ordered />)
    const chips = () => Array.from(document.querySelectorAll('[data-chip]')).map((c) => c.getAttribute('data-chip'))
    expect(chips()).toEqual(['a', 'b'])
    expect(within(document.querySelector('[data-chip="a"]') as HTMLElement).getByText('Main room')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Make main: Avonhead ENT' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Make main: Burnside ENT' }))
    expect(chips()).toEqual(['b', 'a'])
    expect(screen.getByRole('combobox', { name: "Surgeons' rooms" })).toHaveFocus()
  })

  it('without ordered, no chip carries a main pill or a Make main action', () => {
    render(<ChipMultiSelect label="Specialties" addLabel="Add" options={[{ id: 'a', name: 'ENT' }, { id: 'b', name: 'Urology' }]} value={['a', 'b']} onChange={() => undefined} />)
    expect(screen.queryByText('Main room')).toBeNull()
    expect(screen.queryByRole('button', { name: /Make main/ })).toBeNull()
  })
})

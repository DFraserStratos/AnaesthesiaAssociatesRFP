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
})

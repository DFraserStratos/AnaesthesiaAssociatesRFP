/**
 * The shared editable card and its hook (build plan Phase 53; D104): Edit
 * opens the draft, Cancel restores, Save hands the commit only the card's
 * patch, and a refusal shows on the card with the draft kept open.
 */

import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditableCard, useCardEdit, type CardCommit } from './EditableCard'

type Patch = { name: string }

function NameCard({ commit, editable = true }: { commit: CardCommit<Patch>; editable?: boolean }) {
  const [saved] = useState('Ophthalmology')
  const edit = useCardEdit(() => ({ name: saved }), commit)
  const d = edit.draft
  return (
    <EditableCard title="Name" shot="t-card" editable={editable} editing={d !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={() => d !== null && edit.save({ name: d.name })} error={edit.error}>
      {d === null ? <span data-testid="value">{saved}</span> : <input aria-label="Specialty name" value={d.name} onChange={(e) => edit.setDraft({ name: e.target.value })} />}
    </EditableCard>
  )
}

const hook = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null

describe('EditableCard and useCardEdit', () => {
  it('Edit opens the draft from the saved values; Cancel restores and commits nothing', () => {
    const commit = vi.fn<CardCommit<Patch>>(() => ({ ok: true }))
    render(<NameCard commit={commit} />)
    expect(hook('t-card-save')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edit name' }))
    expect(hook('t-card')).not.toBeNull()
    expect((screen.getByLabelText('Specialty name') as HTMLInputElement).value).toBe('Ophthalmology')
    fireEvent.change(screen.getByLabelText('Specialty name'), { target: { value: 'Eyes' } })
    fireEvent.click(hook('t-card-cancel')!)
    expect(screen.getByTestId('value').textContent).toBe('Ophthalmology')
    expect(commit).not.toHaveBeenCalled()
  })

  it("Save calls the commit once with the card's patch only, then closes", () => {
    const commit = vi.fn<CardCommit<Patch>>(() => ({ ok: true }))
    render(<NameCard commit={commit} />)
    fireEvent.click(hook('t-card-edit')!)
    fireEvent.change(screen.getByLabelText('Specialty name'), { target: { value: 'Eyes' } })
    fireEvent.click(hook('t-card-save')!)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith({ name: 'Eyes' })
    expect(screen.queryByLabelText('Specialty name')).toBeNull()
  })

  it('a refusal shows on the card in its own words and keeps the draft open; Cancel clears it', () => {
    const commit = vi.fn<CardCommit<Patch>>(() => ({ ok: false, message: 'That specialty is already on the list.' }))
    render(<NameCard commit={commit} />)
    fireEvent.click(hook('t-card-edit')!)
    fireEvent.change(screen.getByLabelText('Specialty name'), { target: { value: 'ENT' } })
    fireEvent.click(hook('t-card-save')!)
    expect(hook('t-card-error')?.textContent).toBe('That specialty is already on the list.')
    expect((screen.getByLabelText('Specialty name') as HTMLInputElement).value).toBe('ENT')
    fireEvent.click(hook('t-card-cancel')!)
    expect(hook('t-card-error')).toBeNull()
  })

  it('a card that is not editable offers no Edit', () => {
    render(<NameCard commit={() => ({ ok: true })} editable={false} />)
    expect(hook('t-card-edit')).toBeNull()
  })
})

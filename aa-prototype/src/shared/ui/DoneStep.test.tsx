/**
 * The one done step and the one in-card confirm (UI unification U2, README
 * U18): the done step announces and focuses its action; the in-card confirm
 * puts the primary right of "Keep it" (question 13), moves focus in, and
 * after "Keep it" gives it back to the Delete link.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { DoneStep } from './DoneStep'
import { InlineConfirm } from './InlineConfirm'

describe('DoneStep', () => {
  it('is a status region with its title and detail, focusing the action', () => {
    render(<DoneStep title="The office has been alerted" detail="It shows in the office's notifications." action={<Button block>Done</Button>} shot="alert-office-done" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('data-shot', 'alert-office-done')
    expect(status).toHaveTextContent('The office has been alerted')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Done' }))
  })
})

describe('InlineConfirm', () => {
  function Series({ onDelete = vi.fn() }: { onDelete?: () => void }) {
    const [confirming, setConfirming] = useState(false)
    const deleteRef = useRef<HTMLButtonElement>(null)
    return (
      <div>
        {!confirming && (
          <button ref={deleteRef} type="button" onClick={() => setConfirming(true)}>
            Delete
          </button>
        )}
        {confirming && (
          <InlineConfirm
            label="Delete the series"
            message="Delete the series?"
            confirmLabel="Delete the series"
            onConfirm={onDelete}
            cancelLabel="Keep it"
            onCancel={() => setConfirming(false)}
            returnFocus={() => deleteRef.current}
            shot="availability-series-confirm"
          />
        )}
      </div>
    )
  }

  it('puts the primary to the right of Keep it and focuses Keep it', () => {
    render(<Series />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const group = screen.getByRole('group', { name: 'Delete the series' })
    expect(group).toHaveAttribute('data-shot', 'availability-series-confirm')
    const labels = [...group.querySelectorAll('button')].map((b) => b.textContent)
    expect(labels).toEqual(['Keep it', 'Delete the series'])
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep it' }))
  })

  it('gives focus back to the Delete link after Keep it', async () => {
    render(<Series />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }))
    await Promise.resolve()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete' }))
  })

  it('runs the confirm', () => {
    const onDelete = vi.fn()
    render(<Series onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete the series' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })
})

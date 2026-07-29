import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, listIdForSlot } from '../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { ReassignListFlow } from './ReassignListFlow'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOURCE_ID = listIdForSlot(ANAE.rutherford, '2026-07-22', 'AM')

describe('ReassignListFlow', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the success fanfare before completing the flow', () => {
    vi.useFakeTimers()
    const onReassigned = vi.fn()
    const source = useAppStore.getState().schedule.lists[SOURCE_ID]!

    render(
      <SurfaceProvider variant="web">
        <ReassignListFlow
          open
          list={source}
          actor={OFFICE}
          onClose={vi.fn()}
          onReassigned={onReassigned}
        />
      </SurfaceProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Sharma, Priya.*Free AM/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reassignment' }))

    expect(screen.getByRole('status')).toHaveTextContent('List reassigned')
    expect(screen.getByTestId('list-reassignment-overlay')).toHaveTextContent('Moved to Sharma, Priya')
    expect(onReassigned).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1050))
    expect(onReassigned).toHaveBeenCalledOnce()
  })
})

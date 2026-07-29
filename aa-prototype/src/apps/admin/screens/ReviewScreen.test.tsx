import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SurfaceProvider } from '../../../shared'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { ReviewScreen } from './ReviewScreen'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function submittedListIds() {
  return Object.values(useAppStore.getState().schedule.lists)
    .filter((list) => list.state === 'SUBMITTED')
    .sort((a, b) => (a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO)))
    .map((list) => list.id)
}

function renderReview(listId: string, onOpen = vi.fn(), onViewInvoices = vi.fn()) {
  render(
    <SurfaceProvider variant="web">
      <ReviewScreen
        listId={listId}
        actor={OFFICE}
        onBack={vi.fn()}
        onOpen={onOpen}
        onViewInvoices={onViewInvoices}
      />
    </SurfaceProvider>,
  )
  return { onOpen, onViewInvoices }
}

describe('review queue detail navigation', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('always shows previous, next and invoice controls in the header', () => {
    const listIds = submittedListIds()
    const { onOpen, onViewInvoices } = renderReview(listIds[1]!)

    fireEvent.click(screen.getByRole('button', { name: 'Previous in queue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next in queue' }))
    fireEvent.click(screen.getByRole('button', { name: 'View invoices' }))

    expect(onOpen).toHaveBeenNthCalledWith(1, listIds[0])
    expect(onOpen).toHaveBeenNthCalledWith(2, listIds[2])
    expect(onViewInvoices).toHaveBeenCalledOnce()
  })

  it('keeps the current list anchored after authorisation and disables missing neighbours', () => {
    const listIds = submittedListIds()
    const firstListId = listIds[0]!
    useAppStore.setState((state) => ({
      schedule: {
        ...state.schedule,
        lists: {
          ...state.schedule.lists,
          [firstListId]: { ...state.schedule.lists[firstListId]!, state: 'AUTHORISED' },
        },
      },
    }))
    const { onOpen } = renderReview(firstListId)

    expect(screen.getByRole('button', { name: 'Previous in queue' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next in queue' }))
    expect(onOpen).toHaveBeenCalledWith(listIds[1])
    expect(screen.getByRole('button', { name: 'View invoices' })).toBeEnabled()
  })
})

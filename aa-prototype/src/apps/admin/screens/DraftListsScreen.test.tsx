import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, useAppStore, waitingDraftLists, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { DraftListsScreen } from './DraftListsScreen'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderScreen(onOpenDraftList = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/admin/draft-lists']}>
      <SurfaceProvider variant="web">
        <DraftListsScreen actor={OFFICE} onOpenDraftList={onOpenDraftList} onOpenList={vi.fn()} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
  return onOpenDraftList
}

/** UI unification U6 (U09, bug 3): the Draft Lists table opens its drawer by mouse and by keyboard. */
describe('Draft Lists table rows', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('every row has one keyboard handle that opens its Draft List drawer, past the rail\'s first five too', () => {
    const waiting = waitingDraftLists(useAppStore.getState())
    expect(waiting.length).toBeGreaterThan(5)
    const onOpen = renderScreen()
    const handles = screen.getAllByRole('button', { name: /^Open Draft List / })
    expect(handles).toHaveLength(waiting.length)
    const sixth = waiting[5]!
    const handle = document.querySelector(`tr[data-draft-list-row="${sixth.id}"]`)!.querySelector('button[aria-label^="Open Draft List"]') as HTMLButtonElement
    handle.focus()
    expect(document.activeElement).toBe(handle)
    fireEvent.click(handle)
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(sixth.id)
  })

  it('a row click opens the drawer; the row is clickable, never focusable', () => {
    const first = waitingDraftLists(useAppStore.getState())[0]!
    const onOpen = renderScreen()
    const row = document.querySelector(`tr[data-draft-list-row="${first.id}"]`)!
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row).not.toHaveAttribute('tabindex')
    fireEvent.click(row.querySelector('td')!)
    expect(onOpen).toHaveBeenCalledWith(first.id)
  })

  it('an inner action (Assign, Change date) does its own job and does not open the drawer', () => {
    const first = waitingDraftLists(useAppStore.getState())[0]!
    const onOpen = renderScreen()
    const row = document.querySelector(`tr[data-draft-list-row="${first.id}"]`)!
    fireEvent.click(Array.from(row.querySelectorAll('button')).find((b) => b.textContent === 'Change date')!)
    const assign = screen.getAllByRole('button', { name: /^Assign Draft List/ }).find((b) => !(b as HTMLButtonElement).disabled)!
    fireEvent.click(assign)
    expect(onOpen).not.toHaveBeenCalled()
  })
})

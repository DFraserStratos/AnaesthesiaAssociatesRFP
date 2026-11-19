import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Pager, pageOf, pageParam, pageWindow } from './Pager'

describe('pageWindow and pageOf', () => {
  it('handles no rows, exactly one page and a last partial page', () => {
    expect(pageWindow(0, 50, 1)).toEqual({ page: 1, pages: 1, start: 0, end: 0 })
    expect(pageWindow(50, 50, 1)).toEqual({ page: 1, pages: 1, start: 0, end: 50 })
    expect(pageWindow(51, 50, 2)).toEqual({ page: 2, pages: 2, start: 50, end: 51 })
    // A page past the end clamps to the last; below 1 to the first.
    expect(pageWindow(51, 50, 9).page).toBe(2)
    expect(pageWindow(51, 50, 0).page).toBe(1)
    expect(pageOf([1, 2, 3, 4, 5], 2, 3)).toEqual([5])
  })

  it('reads ?page= safely', () => {
    expect(pageParam(null)).toBe(1)
    expect(pageParam('abc')).toBe(1)
    expect(pageParam('3')).toBe(3)
    expect(pageParam('-2')).toBe(1)
  })
})

describe('Pager', () => {
  it('shows the range in the mono face and pages with first, previous, next and last', () => {
    const onPage = vi.fn()
    render(<Pager total={28114} size={50} page={2} onPage={onPage} shot="invoices-pager" />)
    expect(screen.getByText('Showing 51 to 100 of 28,114')).toBeTruthy()
    expect(screen.getByText('2 of 563')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Next page'))
    fireEvent.click(screen.getByLabelText('Previous page'))
    fireEvent.click(screen.getByLabelText('First page'))
    fireEvent.click(screen.getByLabelText('Last page'))
    expect(onPage.mock.calls.map((c) => c[0])).toEqual([3, 1, 1, 563])
  })

  it('disables first and previous on the first page, next and last on the last', () => {
    render(<Pager total={85} size={30} page={3} onPage={() => {}} lead="Anaesthetists" />)
    expect(screen.getByText('Anaesthetists 61 to 85 of 85')).toBeTruthy()
    expect((screen.getByLabelText('Next page') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Last page') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('First page') as HTMLButtonElement).disabled).toBe(false)
  })
})

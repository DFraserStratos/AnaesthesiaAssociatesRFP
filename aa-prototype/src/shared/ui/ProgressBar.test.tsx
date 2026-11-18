import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

/** UI unification U5 (U32): "n of N complete" read as progress. */
describe('ProgressBar', () => {
  it('is a progressbar with its values and label', () => {
    render(<ProgressBar done={3} total={5} width={200} />)
    const bar = screen.getByRole('progressbar', { name: 'Bookings complete' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '5')
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 5')
    expect(bar).toHaveStyle({ width: '200px', height: '6px' })
    expect((bar.firstChild as HTMLElement).style.width).toBe('60%')
  })

  it('fills its row on the phone and reads 0% with nothing to do', () => {
    render(<ProgressBar done={0} total={0} label="Lists complete" />)
    const bar = screen.getByRole('progressbar', { name: 'Lists complete' })
    expect(bar.style.flex).toContain('1')
    expect((bar.firstChild as HTMLElement).style.width).toBe('0%')
  })

  it('held (catch-up Phase 33a): a stub stands on the List, so a full bar is amber, never the done green', () => {
    const { rerender } = render(<ProgressBar done={3} total={3} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('data-tone', 'done')
    expect((bar.firstChild as HTMLElement).style.background).toBe('rgb(30, 142, 90)')
    rerender(<ProgressBar done={3} total={3} tone="held" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-tone', 'held')
    expect((screen.getByRole('progressbar').firstChild as HTMLElement).style.background).toBe('rgb(161, 98, 7)')
  })
})

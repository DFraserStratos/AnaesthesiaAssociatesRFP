import { act, fireEvent, render, screen } from '@testing-library/react'
import { motion } from '../../theme/motion'
import { BottomSheet } from './BottomSheet'

describe('BottomSheet dismissal', () => {
  afterEach(() => vi.useRealTimers())

  it('slides down before closing when the backdrop is clicked', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(
      <BottomSheet open onClose={onClose}>
        Sheet content
      </BottomSheet>,
    )

    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.previousElementSibling
    expect(backdrop).not.toBeNull()

    fireEvent.click(backdrop!)

    expect(onClose).not.toHaveBeenCalled()
    expect(dialog.style.animation).toContain('aa-sheet-out')

    act(() => vi.advanceTimersByTime(motion.sheetIn.out))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('uses the same exit motion when the grab handle is clicked', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(
      <BottomSheet open onClose={onClose}>
        Sheet content
      </BottomSheet>,
    )

    const dialog = screen.getByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Close sheet' }))

    expect(onClose).not.toHaveBeenCalled()
    expect(dialog.style.animation).toContain('aa-sheet-out')

    act(() => vi.advanceTimersByTime(motion.sheetIn.out))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

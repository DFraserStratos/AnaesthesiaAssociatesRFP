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

  it('closes on Escape with the same exit motion (U2, F question 7), the top sheet only', () => {
    vi.useFakeTimers()
    const outer = vi.fn()
    const inner = vi.fn()
    render(
      <BottomSheet open onClose={outer}>
        Outer sheet
        <BottomSheet open onClose={inner}>
          Inner sheet
        </BottomSheet>
      </BottomSheet>,
    )
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    act(() => vi.advanceTimersByTime(motion.sheetIn.out))
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).not.toHaveBeenCalled()
  })

  it('moves focus into the sheet on open', () => {
    render(
      <BottomSheet open onClose={() => {}}>
        Sheet content
      </BottomSheet>,
    )
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })
})

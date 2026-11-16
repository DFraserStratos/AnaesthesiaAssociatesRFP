/**
 * The one sheet title (UI unification U2, README U03, questions 11 and 12):
 * the header names its dialog in Dialog and BottomSheet; the corner X shows
 * on web only with a header, and closes through the one onClose.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'
import { OverlayHeader } from './OverlayHeader'

describe('OverlayHeader', () => {
  it('names the web dialog, at 18/700, and brings the corner X that closes through onClose', () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose}>
        <OverlayHeader title="Clear this conflict" description="The List stays as it is." />
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Clear this conflict' })
    const heading = screen.getByRole('heading', { level: 2, name: 'Clear this conflict' })
    expect(heading.style.fontSize).toBe('18px')
    expect(heading.style.fontWeight).toBe('700')
    expect(screen.getByText('The List stays as it is.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(dialog).toBeInTheDocument()
  })

  it('shows no corner X on a web dialog without a header', () => {
    render(
      <Dialog open onClose={() => {}}>
        <div>Body only</div>
      </Dialog>,
    )
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('names the bottom sheet, with no corner X (the handle is the close)', () => {
    render(
      <BottomSheet open onClose={() => {}}>
        <OverlayHeader title="Cancel this booking" />
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog', { name: 'Cancel this booking' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Close sheet' })).toBeInTheDocument()
  })

  it('a nested dialog takes its own name', () => {
    render(
      <Dialog open onClose={() => {}}>
        <OverlayHeader title="Outer" />
        <Dialog open onClose={() => {}}>
          <OverlayHeader title="Inner" />
        </Dialog>
      </Dialog>,
    )
    expect(screen.getByRole('dialog', { name: 'Inner' })).toBeInTheDocument()
    expect(document.querySelectorAll('[role=dialog][aria-labelledby]')).toHaveLength(2)
  })
})

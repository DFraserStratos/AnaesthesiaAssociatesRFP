/**
 * The one popover behaviour (UI unification U2, README U30): an outside click
 * closes, Escape closes and puts focus back on the trigger, `aria-expanded`
 * follows, and a popover open inside a dialog closes alone on Escape.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Dialog } from '../surface/Dialog'
import { PopoverPanel } from './PopoverPanel'
import { usePopover } from './usePopover'

function Menu({ label = 'Menu' }: { label?: string }) {
  const { open, toggle, rootRef, panelId, triggerProps } = usePopover()
  return (
    <div ref={rootRef}>
      <button {...triggerProps} type="button" onClick={toggle}>
        {label}
      </button>
      {open && (
        <PopoverPanel id={panelId} placement="end">
          <button type="button">Inside</button>
        </PopoverPanel>
      )}
    </div>
  )
}

describe('usePopover', () => {
  it('opens on the trigger, closes on an outside pointerdown, and aria-expanded follows', () => {
    render(
      <>
        <Menu />
        <p>Outside</p>
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger.getAttribute('aria-controls')).toBe(screen.getByText('Inside').parentElement?.id)
    fireEvent.pointerDown(screen.getByText('Inside'))
    expect(screen.getByText('Inside')).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByText('Outside'))
    expect(screen.queryByText('Inside')).toBeNull()
  })

  it('Escape closes and returns focus to the trigger', () => {
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(trigger)
    screen.getByText('Inside').focus()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByText('Inside')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('a popover open inside a dialog closes alone on Escape', () => {
    function InDialog() {
      const [open, setOpen] = useState(true)
      return (
        <Dialog open={open} onClose={() => setOpen(false)}>
          <p>Dialog body</p>
          <Menu label="Combo" />
        </Dialog>
      )
    }
    render(<InDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Combo' }))
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByText('Inside')).toBeNull()
    expect(screen.getByText('Dialog body')).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByText('Dialog body')).toBeNull()
  })

  it("a harness menu below a dialog stays open on the dialog's Escape", () => {
    function MenuThenDialog() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Menu label="Harness" />
          <button type="button" onClick={() => setOpen(true)}>
            Open dialog
          </button>
          <Dialog open={open} onClose={() => setOpen(false)}>
            <p>Dialog body</p>
          </Dialog>
        </>
      )
    }
    render(<MenuThenDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Harness' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }))
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByText('Dialog body')).toBeNull()
    expect(screen.getByText('Inside')).toBeInTheDocument()
  })
})

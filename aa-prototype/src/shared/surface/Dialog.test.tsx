/**
 * Escape closes only the topmost dialog (catch-up Phase 19 review): the RVG
 * code picker opens over the Add booking dialog, which must survive it.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Dialog } from './Dialog'
import { OverlayHeader } from './OverlayHeader'
import { SheetActions } from './SheetActions'
import { SurfaceProvider } from './SurfaceProvider'
import { Button } from '../ui/Button'

function Nested() {
  const [outer, setOuter] = useState(true)
  const [inner, setInner] = useState(true)
  return (
    <Dialog open={outer} onClose={() => setOuter(false)}>
      <div>Outer form</div>
      <Dialog open={inner} onClose={() => setInner(false)}>
        <div>Inner picker</div>
      </Dialog>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('Escape closes the inner dialog first, then the outer one', () => {
    render(<Nested />)
    expect(screen.getByText('Inner picker')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Inner picker')).not.toBeInTheDocument()
    expect(screen.getByText('Outer form')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Outer form')).not.toBeInTheDocument()
  })

  it('keeps the header and actions inside the sheet, wrapped to stick around the one scrolling body, the note above the buttons', () => {
    render(
      <SurfaceProvider variant="web">
        <Dialog open onClose={() => {}}>
          <div data-shot="sheet">
            <OverlayHeader title="Add recurring booking" description="A pattern of Lists" />
            <div>Form</div>
            <SheetActions primary={<Button block>Apply</Button>} note="Saves it" />
          </div>
        </Dialog>
      </SurfaceProvider>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Add recurring booking' })
    const sheet = dialog.querySelector('[data-shot="sheet"]')!
    const header = sheet.querySelector<HTMLElement>(':scope > [data-aa-dialog-header]')!
    const footer = sheet.querySelector<HTMLElement>(':scope > [data-aa-dialog-footer]')!
    expect(header).toHaveTextContent('Add recurring booking')
    expect(header).toHaveTextContent('A pattern of Lists')
    expect(header.style.position).toBe('sticky')
    expect(footer.style.position).toBe('sticky')
    expect(footer.textContent).toBe('Saves itApply')
    expect(dialog.querySelector('[data-aa-dialog-body]')).toContainElement(footer)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('leaves actions nested deeper in the sheet inline', () => {
    render(
      <SurfaceProvider variant="web">
        <Dialog open onClose={() => {}}>
          <div>
            <OverlayHeader title="Edit" />
            <div data-testid="box">
              <SheetActions primary={<Button block>Retire</Button>} />
            </div>
          </div>
        </Dialog>
      </SurfaceProvider>,
    )
    const footer = screen.getByTestId('box').querySelector<HTMLElement>('[data-aa-dialog-footer]')!
    expect(footer.style.display).toBe('contents')
    expect(footer.style.position).toBe('')
  })
})

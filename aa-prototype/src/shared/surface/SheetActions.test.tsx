/**
 * The one sheet footer and the one sheet confirm (UI unification U2, README
 * U18, question 13): stacked on a phone surface, one row on web with the
 * primary last; a confirm opens on its safe button and runs once.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../ui/Button'
import { ConfirmSheet } from './ConfirmSheet'
import { SheetActions } from './SheetActions'
import { SurfaceProvider } from './SurfaceProvider'

function Footer({ secondary = true }: { secondary?: boolean }) {
  return (
    <div data-testid="sheet" style={{ display: 'flex', flexDirection: 'column' }}>
      <SheetActions
        primary={<Button block>Save</Button>}
        {...(secondary ? { secondary: <Button variant="secondary" block>Cancel</Button> } : {})}
      />
    </div>
  )
}

describe('SheetActions', () => {
  it('stacks the primary over the secondary on a phone surface', () => {
    render(
      <SurfaceProvider variant="mobile">
        <Footer />
      </SurfaceProvider>,
    )
    const buttons = screen.getByTestId('sheet').querySelectorAll(':scope > button')
    expect([...buttons].map((b) => b.textContent)).toEqual(['Save', 'Cancel'])
  })

  it('is one row on web: the secondary first, hugging; the primary last, filling', () => {
    render(
      <SurfaceProvider variant="web">
        <Footer />
      </SurfaceProvider>,
    )
    const row = screen.getByTestId('sheet').firstElementChild as HTMLElement
    expect(row.style.display).toBe('flex')
    const cells = [...row.children] as HTMLElement[]
    expect(cells.map((c) => c.textContent)).toEqual(['Cancel', 'Save'])
    expect(cells[0]?.style.flex).toBe('0 0 auto')
    expect(cells[1]?.style.flex).toBe('1 1 auto')
  })

  it('takes no secondary', () => {
    render(
      <SurfaceProvider variant="web">
        <Footer secondary={false} />
      </SurfaceProvider>,
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})

describe('ConfirmSheet', () => {
  function renderConfirm(variant: 'web' | 'mobile', onConfirm = vi.fn()) {
    render(
      <SurfaceProvider variant={variant}>
        <ConfirmSheet open onClose={() => {}} title="Submit this List?" confirmLabel="Submit" cancelLabel="Keep it" onConfirm={onConfirm} />
      </SurfaceProvider>,
    )
    return onConfirm
  }

  it('opens with focus on the safe button and a named dialog (web)', () => {
    renderConfirm('web')
    expect(screen.getByRole('dialog', { name: 'Submit this List?' })).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep it' }))
  })

  it('opens with focus on the safe button (phone)', () => {
    renderConfirm('mobile')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep it' }))
  })

  it('runs the primary once on a double click, even when the run re-renders the sheet', () => {
    const attempts = vi.fn()
    function Rerendering() {
      const [n, setN] = useState(0)
      return (
        <SurfaceProvider variant="web">
          <ConfirmSheet open onClose={() => {}} title={`Submit ${n}`} confirmLabel="Submit" cancelLabel="Keep it" onConfirm={() => { attempts(); setN((x) => x + 1) }} />
        </SurfaceProvider>
      )
    }
    render(<Rerendering />)
    const submit = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submit)
    fireEvent.click(submit)
    expect(attempts).toHaveBeenCalledOnce()
  })

  it('can be retried after a refusal shown in the sheet', () => {
    const attempts = vi.fn()
    function Refusing() {
      const [error, setError] = useState<string | null>(null)
      return (
        <SurfaceProvider variant="web">
          <ConfirmSheet
            open
            onClose={() => {}}
            title="Remove it?"
            confirmLabel="Remove"
            cancelLabel="Keep it"
            onConfirm={() => {
              attempts()
              setError('Not yet.')
            }}
          >
            {error !== null && <div role="alert">{error}</div>}
          </ConfirmSheet>
        </SurfaceProvider>
      )
    }
    vi.useFakeTimers()
    render(<Refusing />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Not yet.')
    for (let i = 0; i < 2; i += 1) {
      act(() => vi.advanceTimersByTime(500))
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    }
    // The same refusal twice more: each retry still runs.
    expect(attempts).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})

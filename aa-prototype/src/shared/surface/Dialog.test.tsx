/**
 * Escape closes only the topmost dialog (catch-up Phase 19 review): the RVG
 * code picker opens over the Add booking dialog, which must survive it.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Dialog } from './Dialog'

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
})

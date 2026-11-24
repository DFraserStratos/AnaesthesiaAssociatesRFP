import { useRef, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { accent, neutral, radius } from '../../theme/tokens'
import { CloseButton, IconButton } from './IconButton'

/** UI unification U5 (U20): one icon button with a required name, and the close or clear X. */
describe('IconButton', () => {
  it('its label is the accessible name (Admin Day\'s step buttons had none, bug 5)', () => {
    render(<IconButton label="Next day" onClick={() => {}}>›</IconButton>)
    expect(screen.getByRole('button', { name: 'Next day' })).toHaveTextContent('›')
  })

  it.each([32, 36, 38] as const)('the %ipx square is white with a line border and a slate glyph', (size) => {
    render(<IconButton label="Step" size={size} onClick={() => {}}>‹</IconButton>)
    expect(screen.getByRole('button', { name: 'Step' })).toHaveStyle({ width: `${size}px`, height: `${size}px`, borderRadius: `${radius.ctl}px`, background: neutral.surface, color: neutral.slate, border: `1px solid ${neutral.line}` })
  })

  it('the 44px square keeps radius 12 (the capture steppers); the round one is a pill in the action tone', () => {
    render(<><IconButton label="More units" size={44} onClick={() => {}}>+</IconButton><IconButton label="Next month" size={44} shape="round" tone="action" onClick={() => {}}>›</IconButton></>)
    expect(screen.getByRole('button', { name: 'More units' })).toHaveStyle({ borderRadius: `${radius.md}px` })
    expect(screen.getByRole('button', { name: 'Next month' })).toHaveStyle({ borderRadius: `${radius.pill}px`, color: accent.pressed })
  })

  it('disabled draws the glyph in lineStrong and never runs onClick', () => {
    const onClick = vi.fn()
    render(<IconButton label="Previous month" disabled onClick={onClick}>‹</IconButton>)
    const b = screen.getByRole('button', { name: 'Previous month' })
    expect(b).toBeDisabled()
    expect(b).toHaveStyle({ color: neutral.lineStrong })
    fireEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('IconButton returnFocusTo', () => {
  function Rows({ start }: { start: string[] }) {
    const [rows, setRows] = useState(start)
    const add = useRef<HTMLButtonElement>(null)
    return (
      <>
        {rows.map((r, i) => (
          <IconButton
            key={r}
            label={`Remove ${r}`}
            data-row-remove
            returnFocusTo={() => {
              const rest = Array.from(document.querySelectorAll<HTMLElement>('[data-row-remove]')).filter((_, j) => j !== i)
              return rest[Math.min(i, rest.length - 1)] ?? add.current
            }}
            onClick={() => setRows((prev) => prev.filter((x) => x !== r))}
          >
            x
          </IconButton>
        ))}
        <button ref={add} type="button">Add</button>
      </>
    )
  }

  it('a function target is read before the click and focused after it, so a removed row hands focus on', () => {
    render(<Rows start={['a', 'b', 'c']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove b' }))
    expect(screen.getByRole('button', { name: 'Remove c' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Remove c' }))
    expect(screen.getByRole('button', { name: 'Remove a' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Remove a' }))
    expect(screen.getByRole('button', { name: 'Add' })).toHaveFocus()
  })

  it('passes data attributes through, and a ref target is focused after the click', () => {
    function One() {
      const ref = useRef<HTMLInputElement>(null)
      return (
        <>
          <input ref={ref} aria-label="Field" />
          <IconButton label="Go" data-kind="go" returnFocusTo={ref} onClick={() => {}}>›</IconButton>
        </>
      )
    }
    render(<One />)
    const go = screen.getByRole('button', { name: 'Go' })
    expect(go).toHaveAttribute('data-kind', 'go')
    fireEvent.click(go)
    expect(screen.getByRole('textbox', { name: 'Field' })).toHaveFocus()
  })
})

describe('CloseButton', () => {
  it('is named "Close" by default', () => {
    const onClick = vi.fn()
    render(<CloseButton onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('hands focus back after a clear, as the button leaves with the text (bug 9)', () => {
    function Search() {
      const [value, setValue] = useState('Holt')
      const ref = useRef<HTMLInputElement>(null)
      return (
        <>
          <input ref={ref} aria-label="Search" value={value} onChange={(e) => setValue(e.target.value)} />
          {value !== '' && <CloseButton label="Clear search" returnFocusTo={ref} onClick={() => setValue('')} />}
        </>
      )
    }
    render(<Search />)
    const clear = screen.getByRole('button', { name: 'Clear search' })
    clear.focus()
    fireEvent.click(clear)
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus()
  })
})

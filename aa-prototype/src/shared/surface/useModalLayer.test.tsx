/**
 * The one modal stack (UI unification U2, README U02): one Escape closes only
 * the top layer, in open order; focus goes in and comes back; Tab wraps; the
 * background is inert within its scope and restored, keeping an element's own
 * `inert`; a search box with text keeps its Escape.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { NameSearchBox } from '../ui/NameSearchBox'
import { openLayerCount, useModalLayer } from './useModalLayer'

function Layer({ name, open, onClose, children }: { name: string; open: boolean; onClose: () => void; children?: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useModalLayer({ open, onClose, rootRef, panelRef })
  if (!open) return null
  return (
    <div ref={rootRef} data-testid={`${name}-root`}>
      <div ref={panelRef} role="dialog" aria-modal aria-label={name} tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}

const escapeOn = (el: Element | null = document.activeElement) => fireEvent.keyDown(el ?? document.body, { key: 'Escape' })
const tab = (shiftKey = false) => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab', shiftKey })

/** Two siblings in document order; B is opened first, A second, so A is on top though B comes later in the DOM. */
function OpenOrder() {
  const [a, setA] = useState(false)
  const [b, setB] = useState(false)
  return (
    <div data-aa-modal-scope>
      <button onClick={() => setB(true)}>Open B</button>
      <button onClick={() => setA(true)}>Open A</button>
      <Layer name="A" open={a} onClose={() => setA(false)}>
        <button>In A</button>
      </Layer>
      <Layer name="B" open={b} onClose={() => setB(false)}>
        <button>In B</button>
      </Layer>
    </div>
  )
}

describe('useModalLayer', () => {
  it('nested layers: one Escape closes the top only', () => {
    function Nested() {
      const [outer, setOuter] = useState(true)
      const [inner, setInner] = useState(true)
      return (
        <Layer name="outer" open={outer} onClose={() => setOuter(false)}>
          <Layer name="inner" open={inner} onClose={() => setInner(false)} />
        </Layer>
      )
    }
    render(<Nested />)
    escapeOn()
    expect(screen.queryByRole('dialog', { name: 'inner' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'outer' })).toBeInTheDocument()
    escapeOn()
    expect(screen.queryByRole('dialog', { name: 'outer' })).toBeNull()
    expect(openLayerCount()).toBe(0)
  })

  it('open order wins over document order', () => {
    render(<OpenOrder />)
    fireEvent.click(screen.getByText('Open B'))
    fireEvent.click(screen.getByText('Open A'))
    escapeOn()
    expect(screen.queryByRole('dialog', { name: 'A' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'B' })).toBeInTheDocument()
    escapeOn()
    expect(screen.queryByRole('dialog', { name: 'B' })).toBeNull()
  })

  it('focus moves in on open and back to the opener on close', () => {
    render(<OpenOrder />)
    const opener = screen.getByText('Open A')
    opener.focus()
    fireEvent.click(opener)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'A' }))
    escapeOn()
    expect(document.activeElement).toBe(opener)
  })

  it('keeps an autoFocus child and an initialFocusRef', () => {
    function WithInitial() {
      const rootRef = useRef<HTMLDivElement>(null)
      const safeRef = useRef<HTMLButtonElement>(null)
      useModalLayer({ open: true, onClose: () => {}, rootRef, initialFocusRef: safeRef })
      return (
        <div ref={rootRef}>
          <button>Go</button>
          <button ref={safeRef}>Keep it</button>
        </div>
      )
    }
    const { unmount } = render(<WithInitial />)
    expect(document.activeElement).toBe(screen.getByText('Keep it'))
    unmount()
    render(
      <Layer name="auto" open onClose={() => {}}>
        <input aria-label="Search" autoFocus />
      </Layer>,
    )
    expect(document.activeElement).toBe(screen.getByLabelText('Search'))
  })

  it('Tab and Shift+Tab wrap inside the top layer', () => {
    render(
      <Layer name="trap" open onClose={() => {}}>
        <button>First</button>
        <button>Last</button>
      </Layer>,
    )
    screen.getByText('Last').focus()
    tab()
    expect(document.activeElement).toBe(screen.getByText('First'))
    tab(true)
    expect(document.activeElement).toBe(screen.getByText('Last'))
  })

  it('marks the siblings inert within the scope, keeps an existing inert, and restores on close', () => {
    function Page() {
      const [open, setOpen] = useState(true)
      return (
        <div>
          <header data-testid="harness">Harness bar</header>
          <main data-aa-modal-scope>
            <nav data-testid="nav">Nav</nav>
            <section data-testid="parked" {...({ inert: '' } as object)}>Parked layer</section>
            <div>
              <p data-testid="beside">Beside the layer</p>
              <Layer name="sheet" open={open} onClose={() => setOpen(false)} />
            </div>
          </main>
        </div>
      )
    }
    render(<Page />)
    expect(screen.getByTestId('nav')).toHaveAttribute('inert')
    expect(screen.getByTestId('beside')).toHaveAttribute('inert')
    expect(screen.getByTestId('parked')).toHaveAttribute('inert')
    // Outside the scope: never touched.
    expect(screen.getByTestId('harness')).not.toHaveAttribute('inert')
    expect(screen.getByTestId('sheet-root')).not.toHaveAttribute('inert')
    escapeOn()
    expect(screen.getByTestId('nav')).not.toHaveAttribute('inert')
    expect(screen.getByTestId('beside')).not.toHaveAttribute('inert')
    // The parked layer keeps its own inert.
    expect(screen.getByTestId('parked')).toHaveAttribute('inert')
  })

  it('a search box with text swallows the first Escape; the next one closes the layer', () => {
    function WithSearch() {
      const [open, setOpen] = useState(true)
      const [q, setQ] = useState('H1')
      return (
        <Layer name="picker" open={open} onClose={() => setOpen(false)}>
          <NameSearchBox value={q} onChange={setQ} label="Search" />
        </Layer>
      )
    }
    render(<WithSearch />)
    const box = screen.getByRole('searchbox')
    box.focus()
    escapeOn(box)
    expect(box).toHaveValue('')
    expect(screen.getByRole('dialog', { name: 'picker' })).toBeInTheDocument()
    escapeOn(box)
    expect(screen.queryByRole('dialog', { name: 'picker' })).toBeNull()
  })

  it('a popover layer above a modal closes alone on Escape', () => {
    function PopoverInDialog() {
      const [dialog, setDialog] = useState(true)
      const [pop, setPop] = useState(true)
      const popRef = useRef<HTMLDivElement>(null)
      useModalLayer({ open: pop, onClose: () => setPop(false), rootRef: popRef, kind: 'popover' })
      return (
        <Layer name="dialog" open={dialog} onClose={() => setDialog(false)}>
          {pop && <div ref={popRef}>Popover</div>}
        </Layer>
      )
    }
    render(<PopoverInDialog />)
    escapeOn()
    expect(screen.queryByText('Popover')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'dialog' })).toBeInTheDocument()
  })

  it('a layer that remounts under an open sheet keeps its place: the sheet stays on top and live', () => {
    function Drawer({ body }: { body: 'list' | 'empty' }) {
      return (
        <Layer name={`drawer-${body}`} open onClose={() => {}}>
          <p>{body}</p>
        </Layer>
      )
    }
    function Page() {
      const [body, setBody] = useState<'list' | 'empty'>('list')
      const [sheet, setSheet] = useState(true)
      return (
        <div data-aa-modal-scope>
          {/* A different component per body, as SlotDrawer does: a remount. */}
          {body === 'list' ? <Drawer key="list" body="list" /> : <Drawer key="empty" body="empty" />}
          <Layer name="sheet" open={sheet} onClose={() => setSheet(false)}>
            <button onClick={() => setBody('empty')}>Return to the office</button>
          </Layer>
        </div>
      )
    }
    render(<Page />)
    fireEvent.click(screen.getByText('Return to the office'))
    expect(screen.getByRole('dialog', { name: 'drawer-empty' })).toBeInTheDocument()
    // The sheet is still the top layer, not made inert by the remounted drawer.
    expect(screen.getByTestId('sheet-root').closest('[inert]')).toBeNull()
    escapeOn()
    expect(screen.queryByRole('dialog', { name: 'sheet' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'drawer-empty' })).toBeInTheDocument()
  })

  it('a harness popover outside the modal scope stays above a modal opened while it is up', () => {
    function Harness() {
      const [menu, setMenu] = useState(true)
      const [sheet, setSheet] = useState(false)
      const menuRef = useRef<HTMLDivElement>(null)
      useModalLayer({ open: menu, onClose: () => setMenu(false), rootRef: menuRef, kind: 'popover' })
      return (
        <div>
          <header>
            <div ref={menuRef}>{menu && <button onClick={() => setSheet(true)}>Run</button>}</div>
          </header>
          <main data-aa-modal-scope>
            <Layer name="sheet" open={sheet} onClose={() => setSheet(false)} />
          </main>
        </div>
      )
    }
    render(<Harness />)
    const run = screen.getByText('Run')
    run.focus()
    fireEvent.click(run)
    expect(screen.getByRole('dialog', { name: 'sheet' })).toBeInTheDocument()
    // Focus stays in the menu, and Escape closes the menu first.
    expect(document.activeElement).toBe(run)
    escapeOn()
    expect(screen.queryByText('Run')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'sheet' })).toBeInTheDocument()
    escapeOn()
    expect(screen.queryByRole('dialog', { name: 'sheet' })).toBeNull()
  })
})

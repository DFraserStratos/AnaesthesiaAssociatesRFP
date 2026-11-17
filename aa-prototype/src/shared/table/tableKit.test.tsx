import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { elevation, neutral, radius } from '../../theme/tokens'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th } from '.'

/** UI unification U6 (U10, U09): the one table kit. */
describe('table kit', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Th is a column header with scope col, on the mockup header (11/600 mist caps on bg, line rule)', () => {
    render(
      <TableShell label="Lists">
        <thead><tr><Th>Date</Th><Th align="right" nowrap>Units</Th></tr></thead>
      </TableShell>,
    )
    const head = screen.getByRole('columnheader', { name: 'Date' })
    expect(head).toHaveAttribute('scope', 'col')
    expect(head).toHaveStyle({ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: neutral.mist, background: neutral.bg, borderBottom: `1px solid ${neutral.line}` })
    expect(screen.getByRole('columnheader', { name: 'Units' })).toHaveStyle({ textAlign: 'right', whiteSpace: 'nowrap' })
  })

  it('GroupRow is a th with scope colgroup across the span', () => {
    render(
      <TableShell label="T">
        <tbody><GroupRow span={7}>Earlier, not yet authorised</GroupRow></tbody>
      </TableShell>,
    )
    const group = screen.getByText('Earlier, not yet authorised')
    expect(group.tagName).toBe('TH')
    expect(group).toHaveAttribute('scope', 'colgroup')
    expect(group).toHaveAttribute('colspan', '7')
  })

  it('density: comfortable 12px 20px (web), compact 10px 10px at 13, dense 8px 10px at 12.5; sunken dividers', () => {
    const { rerender } = render(
      <TableShell label="T"><tbody><tr><Td>cell</Td></tr></tbody></TableShell>,
    )
    expect(screen.getByText('cell')).toHaveStyle({ padding: '12px 20px', verticalAlign: 'middle', borderBottom: `1px solid ${neutral.sunken}` })
    rerender(<TableShell label="T" density="compact"><tbody><tr><Td>cell</Td></tr></tbody></TableShell>)
    expect(screen.getByText('cell')).toHaveStyle({ padding: '10px 10px', fontSize: '13px', verticalAlign: 'top' })
    rerender(<TableShell label="T" density="dense"><tbody><tr><Td>cell</Td></tr></tbody></TableShell>)
    expect(screen.getByText('cell')).toHaveStyle({ padding: '8px 10px', fontSize: '12.5px' })
  })

  it('the shell is white, line, card radius and e1 by default; nested is flat at the control radius', () => {
    const { rerender } = render(
      <TableShell label="T" shot="draft-lists-table" testId="review-queue-table-shell" data-room="x"><tbody /></TableShell>,
    )
    const shell = screen.getByTestId('review-queue-table-shell')
    expect(shell).toHaveAttribute('data-shot', 'draft-lists-table')
    expect(shell).toHaveAttribute('data-room', 'x')
    expect(shell).toHaveStyle({ overflowX: 'auto', borderRadius: `${radius.card}px`, boxShadow: elevation.e1, background: neutral.surface })
    expect(shell.firstElementChild?.tagName).toBe('TABLE')
    rerender(<TableShell label="T" nested testId="n"><tbody /></TableShell>)
    const nested = screen.getByTestId('n')
    expect(nested).toHaveStyle({ borderRadius: `${radius.ctl}px` })
    expect(nested.style.boxShadow).toBe('')
  })

  it('a table that fits has no region and no tab stop', () => {
    render(<TableShell label="Invoices" testId="t"><tbody /></TableShell>)
    const shell = screen.getByTestId('t')
    expect(shell).not.toHaveAttribute('role')
    expect(shell).not.toHaveAttribute('tabindex')
  })

  it('an overflowing table becomes a named, focusable region', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(1380)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(900)
    render(<TableShell label="Invoices" testId="t" minWidth={1380}><tbody /></TableShell>)
    const region = screen.getByRole('region', { name: 'Invoices' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('data-testid', 't')
  })

  it('ClickableRow opens on a row click, not on an inner button; data attributes pass through; never focusable', () => {
    const onOpen = vi.fn()
    const inner = vi.fn()
    render(
      <TableShell label="T">
        <tbody>
          <ClickableRow onOpen={onOpen} data-list-id="L1" data-quiet="true" quiet today>
            <Td>Tue 21 Jul</Td>
            <Td><button type="button" onClick={inner}>Assign</button></Td>
          </ClickableRow>
        </tbody>
      </TableShell>,
    )
    const row = document.querySelector('tr[data-list-id="L1"]')!
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row).toHaveClass('aa-table-row-today')
    expect(row).toHaveAttribute('data-quiet', 'true')
    expect(row).not.toHaveAttribute('tabindex')
    expect(row).toHaveStyle({ color: neutral.slate })
    expect(screen.getByText('Tue 21 Jul')).toHaveStyle({ verticalAlign: 'middle' })
    fireEvent.click(screen.getByText('Tue 21 Jul'))
    expect(onOpen).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }))
    expect(inner).toHaveBeenCalledOnce()
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('a compact clickable row centres its cells (ClickableTableRows pins middle)', () => {
    render(
      <TableShell label="T" density="compact">
        <tbody><ClickableRow onOpen={() => {}}><Td>x</Td></ClickableRow></tbody>
      </TableShell>,
    )
    expect(screen.getByText('x')).toHaveStyle({ verticalAlign: 'middle' })
  })

  it('without onOpen the row is plain: no class, no click', () => {
    render(<TableShell label="T"><tbody><ClickableRow data-slot-id="S1"><Td>Free</Td></ClickableRow></tbody></TableShell>)
    expect(document.querySelector('tr[data-slot-id="S1"]')).not.toHaveClass('aa-clickable-table-row')
  })

  it('RowOpenButton is the keyboard handle: found by role and full name, opens once', () => {
    const onOpen = vi.fn()
    render(
      <TableShell label="T">
        <tbody>
          <ClickableRow onOpen={onOpen}>
            <Td><RowOpenButton label="Open List Tue 21 Jul AM, Mercy" onOpen={onOpen}>Tue 21 Jul</RowOpenButton></Td>
          </ClickableRow>
        </tbody>
      </TableShell>,
    )
    const handle = screen.getByRole('button', { name: 'Open List Tue 21 Jul AM, Mercy' })
    expect(handle).toHaveAttribute('type', 'button')
    fireEvent.click(handle)
    expect(onOpen).toHaveBeenCalledOnce()
  })
})

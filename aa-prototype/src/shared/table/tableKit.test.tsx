import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { elevation, neutral, radius, semantic } from '../../theme/tokens'
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

  it('GroupRow level sub (Phase 47) is still a colgroup header across the span, smaller and indented; group is unchanged', () => {
    render(
      <TableShell label="T" density="dense">
        <tbody>
          <GroupRow span={5} data-g="a">Hospitals</GroupRow>
          <GroupRow span={5} level="sub" data-g="b">St George&apos;s</GroupRow>
        </tbody>
      </TableShell>,
    )
    const group = screen.getByText('Hospitals')
    expect(group).toHaveStyle({ fontSize: '13px', padding: '8px 10px', borderBottom: `1px solid ${neutral.line}` })
    expect(group.closest('tr')).toHaveAttribute('data-g', 'a')
    const sub = screen.getByText("St George's")
    expect(sub.tagName).toBe('TH')
    expect(sub).toHaveAttribute('scope', 'colgroup')
    expect(sub).toHaveAttribute('colspan', '5')
    expect(sub).toHaveStyle({ fontSize: '12.5px', paddingLeft: 'calc(10px + 16px)', borderBottom: `1px solid ${neutral.sunken}` })
    expect(sub.closest('tr')).toHaveAttribute('data-g', 'b')
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
            <Td>Tue 24 Nov</Td>
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
    expect(screen.getByText('Tue 24 Nov')).toHaveStyle({ verticalAlign: 'middle' })
    fireEvent.click(screen.getByText('Tue 24 Nov'))
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
            <Td><RowOpenButton label="Open List Tue 24 Nov AM, Mercy" onOpen={onOpen}>Tue 24 Nov</RowOpenButton></Td>
          </ClickableRow>
        </tbody>
      </TableShell>,
    )
    const handle = screen.getByRole('button', { name: 'Open List Tue 24 Nov AM, Mercy' })
    expect(handle).toHaveAttribute('type', 'button')
    fireEvent.click(handle)
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('tone warning tints a row and its text; no tone leaves it plain', () => {
    render(
      <TableShell label="Differences" nested density="dense">
        <tbody>
          <ClickableRow tone="warning" align="top" data-diff="time"><Td>Time</Td></ClickableRow>
          <ClickableRow data-diff="plain"><Td>Plain</Td></ClickableRow>
        </tbody>
      </TableShell>,
    )
    expect(document.querySelector('tr[data-diff="time"]')).toHaveStyle({ background: semantic.warning.tint, color: semantic.warning.onTint })
    expect(screen.getByText('Time')).toHaveStyle({ verticalAlign: 'top' })
    expect((document.querySelector('tr[data-diff="plain"]') as HTMLElement).style.background).toBe('')
  })
  it('fit puts aa-table-fit on the table and wraps the scroller in the card', () => {
    render(<TableShell label="Notifications" fit testId="t" tableData={{ 'data-table': 'n' }}><tbody /></TableShell>)
    const scroller = screen.getByTestId('t')
    expect(document.querySelector('table')).toHaveClass('aa-table-fit')
    expect(scroller).toHaveStyle({ overflowY: 'auto' })
    // The card is the frame around the scroller now, not the scroller itself.
    expect(scroller.style.boxShadow).toBe('')
    const card = scroller.parentElement as HTMLElement
    expect(card).toHaveAttribute('data-table-card')
    expect(card).toHaveStyle({ borderRadius: `${radius.card}px`, boxShadow: elevation.e1, background: neutral.surface })
    expect(document.querySelector('[data-table-footer]')).toBeNull()
  })

  it('footer renders below the scroller, outside it, with or without fit', () => {
    for (const fit of [true, false]) {
      const { unmount } = render(
        <TableShell label="Invoices" fit={fit} testId="t" footer={<span>Showing 1 to 50 of 120</span>}><tbody /></TableShell>,
      )
      const scroller = screen.getByTestId('t')
      const footer = document.querySelector('[data-table-footer]') as HTMLElement
      expect(footer, `fit ${fit}`).toHaveTextContent('Showing 1 to 50 of 120')
      expect(scroller.contains(footer)).toBe(false)
      expect(footer.parentElement).toBe(scroller.parentElement)
      expect(footer.previousElementSibling).toBe(scroller)
      expect(scroller.parentElement).toHaveAttribute('data-table-card')
      expect(document.querySelector('table')?.classList.contains('aa-table-fit')).toBe(fit)
      unmount()
    }
  })

  it('without fit or footer the scroller is still the card', () => {
    render(<TableShell label="T" testId="t"><tbody /></TableShell>)
    const scroller = screen.getByTestId('t')
    expect(document.querySelector('[data-table-card]')).toBeNull()
    expect(scroller).toHaveStyle({ borderRadius: `${radius.card}px`, boxShadow: elevation.e1 })
    expect(document.querySelector('table')).not.toHaveClass('aa-table-fit')
  })
})

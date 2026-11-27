/**
 * Master data · Prepayment letters (catch-up Phase 41; US-06.3.6): the table
 * with one default per kind, the editor's refusals on Save, a new template,
 * and the merge-field chips.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import { PrepaymentLettersView } from './PrepaymentLettersView'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderView() {
  return render(
    <SurfaceProvider variant="web">
      <PrepaymentLettersView actor={OFFICE} />
    </SurfaceProvider>,
  )
}

function openNew() {
  fireEvent.click(screen.getByRole('button', { name: 'New template' }))
  return document.querySelector('[data-shot="letter-template-editor"]') as HTMLElement
}

describe('Prepayment letters master', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('lists the three seeded templates, one default per kind', () => {
    const { container } = renderView()
    expect(container.querySelector('[data-shot="letter-templates"]')).not.toBeNull()
    const rows = [...container.querySelectorAll('[data-letter-template]')] as HTMLElement[]
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.querySelectorAll('td')[1]!.textContent)).toEqual(['Prepayment letter', 'Reminder', 'Anaesthetist changed email'])
    for (const row of rows) expect(within(row).getAllByText('Default')).toHaveLength(1)
    const first = [...rows[0]!.querySelectorAll('td')].map((td) => td.textContent)
    expect(first.slice(0, 4)).toEqual(['Standard prepayment letterDefault', 'Prepayment letter', 'Active', 'Seeded'])
  })

  it('refuses an unknown merge field, verbatim', () => {
    renderView()
    const editor = openNew()
    fireEvent.change(within(editor).getByLabelText('Name'), { target: { value: 'Short letter' } })
    fireEvent.change(within(editor).getByLabelText('Letter'), { target: { value: 'Please pay {{prepaidAmount}}, about {{estimate}}.' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Add template' }))
    expect(within(editor).getByText('Unknown merge field {{estimate}}. Use one of the fields offered.')).toBeTruthy()
    expect(Object.keys(useAppStore.getState().masters.prepaymentLetterTemplates)).toHaveLength(3)
  })

  it('refuses estimate wording in a prepayment letter', () => {
    renderView()
    const editor = openNew()
    fireEvent.change(within(editor).getByLabelText('Name'), { target: { value: 'Short letter' } })
    fireEvent.change(within(editor).getByLabelText('Letter'), { target: { value: 'The estimated fee is {{prepaidAmount}}.' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Add template' }))
    expect(within(editor).getByText('State the prepaid amount as the price payable, not an estimate.')).toBeTruthy()
  })

  it('adds a valid template, which appears in the table', () => {
    const { container } = renderView()
    const editor = openNew()
    fireEvent.change(within(editor).getByLabelText('Name'), { target: { value: 'Short letter' } })
    fireEvent.change(within(editor).getByLabelText('Letter'), { target: { value: 'Dear {{patientName}}, please pay {{prepaidAmount}} before your procedure.' } })
    expect(within(editor).getByText('Dear Jordan Sample, please pay $1,380.00 before your procedure.')).toBeTruthy()
    fireEvent.click(within(editor).getByRole('button', { name: 'Add template' }))
    expect(document.querySelector('[data-shot="letter-template-editor"]')).toBeNull()
    expect(container.querySelectorAll('[data-letter-template]')).toHaveLength(4)
    expect(screen.getByText('Short letter')).toBeTruthy()
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('letterTemplate.create')
  })

  it('a merge-field chip inserts its placeholder at the cursor', () => {
    renderView()
    const editor = openNew()
    const area = within(editor).getByLabelText('Letter') as HTMLTextAreaElement
    fireEvent.change(area, { target: { value: 'Dear , hello' } })
    area.setSelectionRange(5, 5)
    const chips = editor.querySelector('[data-shot="letter-merge-chips"]') as HTMLElement
    fireEvent.click(within(chips).getByRole('button', { name: 'Insert Patient name' }))
    expect(area.value).toBe('Dear {{patientName}}, hello')
    expect(area.selectionStart).toBe(5 + '{{patientName}}'.length)
  })

  it('refuses to deactivate the default, with the reason', () => {
    renderView()
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Prepayment reminder' }))
    expect(screen.getByRole('alert').textContent).toBe('The default template cannot be switched off. Make another one the default first.')
    expect(useAppStore.getState().masters.prepaymentLetterTemplates.LT002!.active).toBe(true)
  })
})

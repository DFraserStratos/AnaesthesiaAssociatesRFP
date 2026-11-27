/**
 * Master data · Email templates (catch-up Phase 35; US-02.3.4): the table,
 * the editor's inline messages and preview, Save, and the refused retire.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import { EmailTemplatesView } from './EmailTemplatesView'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderView() {
  return render(
    <SurfaceProvider variant="web">
      <EmailTemplatesView actor={OFFICE} />
    </SurfaceProvider>,
  )
}

describe('Email templates master', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('lists the four templates with kind, sends to and active', () => {
    const { container } = renderView()
    const table = container.querySelector('[data-shot="email-templates"]') as HTMLElement
    expect(table).not.toBeNull()
    expect(container.querySelectorAll('[data-email-template]')).toHaveLength(4)
    const cover = container.querySelector('[data-email-template="ET001"]') as HTMLElement
    const cells = [...cover.querySelectorAll('td')].map((td) => td.textContent)
    expect(cells.slice(0, 4)).toEqual(['Change of anaesthetist', 'Change of anaesthetist', 'Hospital', 'Active'])
  })

  it('edits the subject with a live preview, reports an unknown placeholder, and saves', () => {
    renderView()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Booking change' }))
    const editor = document.querySelector('[data-shot="email-template-editor"]') as HTMLElement
    expect(within(editor).getByText('Sample')).toBeTruthy()
    const subject = within(editor).getByLabelText('Subject') as HTMLInputElement
    fireEvent.change(subject, { target: { value: 'Changed: {patient} {unknown}' } })
    expect(within(editor).getByText('{unknown} is not a placeholder. Choose one from the list.')).toBeTruthy()
    expect((within(editor).getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(subject, { target: { value: 'Changed: {patient}' } })
    expect(within(editor).getByText('Changed: Aroha Sample')).toBeTruthy()
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))
    expect(useAppStore.getState().masters.emailTemplates.ET004!.subject).toBe('Changed: {patient}')
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('emailTemplate.update')
  })

  it('refuses to retire the last active template of a kind, with the reason', () => {
    renderView()
    fireEvent.click(screen.getByRole('button', { name: 'Retire Cancellation' }))
    expect(screen.getByRole('alert').textContent).toContain('the only active Cancellation template')
    expect(useAppStore.getState().masters.emailTemplates.ET002!.active).toBe(true)
  })
})

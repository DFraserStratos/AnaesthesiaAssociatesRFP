import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { SEED_STUB } from '../../../domain/seed/intakeSeed'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, importHospitalDownload, OFFICE_ACTOR, useAppStore } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { MatchingScreen } from './MatchingScreen'
import { emptyIntakeSlice } from '../../../store/appStore'

afterEach(cleanup)

function renderScreen(state?: unknown) {
  const onOpenBooking = vi.fn()
  const utils = render(
    <MemoryRouter initialEntries={[{ pathname: '/admin/matching', state }]}>
      <SurfaceProvider variant="web">
        <MatchingScreen actor={OFFICE_ACTOR} todayISO="2026-07-21" onOpenBooking={onOpenBooking} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
  return { ...utils, onOpenBooking }
}

const stat = (container: HTMLElement, key: string) => container.querySelector(`[data-stat="${key}"]`)?.textContent

describe('MatchingScreen', () => {
  beforeEach(() => {
    // Phase 33's flows start from an empty Matching screen; the seeded waiting row and its stub (33a) are tested below.
    useAppStore.setState({ ...freshAppState(), intake: emptyIntakeSlice() })
  })

  it('starts empty with the interim line and the Import button, and never says "download"', () => {
    const { container } = renderScreen()
    expect(screen.getByText("No rows waiting. Imported St George's and Southern Cross files, the rooms' PDF lists and received sheets land here.")).toBeInTheDocument()
    expect(container.querySelector('[data-shot="matching-interim"]')).toHaveTextContent('Sample files stand in for each hospital')
    expect(screen.getByRole('button', { name: /Import hospital file/ })).toBeInTheDocument()
    expect(container.textContent?.toLowerCase()).not.toContain('download')
    expect(container.textContent).not.toMatch(/[–—]/)
  })

  it("imports St George's: five rows, the stats, the wording as received, and the first row's panel", () => {
    const { container } = renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /Import hospital file/ }))
    const dialog = container.ownerDocument.querySelector('[data-shot="matching-import"]') as HTMLElement
    expect(within(dialog).getByText('Sample file')).toBeInTheDocument()
    expect(dialog.querySelectorAll('[data-sample-id]')).toHaveLength(4)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import' }))

    expect(screen.getByText("5 rows imported from St George's")).toBeInTheDocument()
    expect(stat(container, 'open')).toContain('5')
    expect(stat(container, 'new')).toContain('2')
    expect(stat(container, 'modification')).toContain('1')
    expect(stat(container, 'cancellation')).toContain('1')
    expect(stat(container, 'unmatched')).toContain('0')
    expect(container.querySelectorAll('[data-shot^="matching-row-"]')).toHaveLength(5)
    expect(container.textContent).toContain('“lap appy ?conv to open”')

    // The first new row is selected: Sarah Mitchell, suggested Create Booking.
    const panel = screen.getByTestId('matching-panel')
    expect(within(panel).getByRole('heading', { name: 'Sarah Mitchell' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Create Booking' })).toBeEnabled()
  })

  it('creates the Booking from R1, shows the banner and moves to the next row', () => {
    const { container } = renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /Import hospital file/ }))
    fireEvent.click(within(container.ownerDocument.querySelector('[data-shot="matching-import"]') as HTMLElement).getByRole('button', { name: 'Import' }))
    const panel = screen.getByTestId('matching-panel')
    fireEvent.click(within(panel).getByRole('button', { name: 'Create Booking' }))

    const banner = container.ownerDocument.querySelector('[data-shot="matching-banner"]') as HTMLElement
    expect(banner).toHaveTextContent("Applied: Booking created on Dr Souter's Tue 28 Jul AM List")
    expect(banner).toHaveTextContent('Needs an invoice destination')
    expect(stat(container, 'open')).toContain('4')
    const decided = Object.values(useAppStore.getState().intake.rows).filter((r) => r.status === 'applied')
    expect(decided).toHaveLength(1)

    fireEvent.click(within(banner).getByRole('button', { name: 'Next row' }))
    expect(within(screen.getByTestId('matching-panel')).getByRole('heading', { name: 'Dylan Kereama' })).toBeInTheDocument()
  })

  it('says nothing new when the same file is imported again', () => {
    importHospitalDownload(useAppStore, OFFICE_ACTOR, 'SAMPLE_STG')
    const { container } = renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /Import hospital file/ }))
    fireEvent.click(within(container.ownerDocument.querySelector('[data-shot="matching-import"]') as HTMLElement).getByRole('button', { name: 'Import' }))
    expect(screen.getByText('All 5 rows were already imported. Nothing new.')).toBeInTheDocument()
  })

  it('applies only the ticked differences on a Modification (R3, Diane Foster)', () => {
    importHospitalDownload(useAppStore, OFFICE_ACTOR, 'SAMPLE_STG')
    const row = Object.values(useAppStore.getState().intake.rows).find((r) => r.incoming.patient.name === 'Diane Foster')!
    const { container } = renderScreen({ selectRowId: row.id })
    const panel = screen.getByTestId('matching-panel')
    const diff = container.ownerDocument.querySelector('[data-shot="matching-diff"]') as HTMLElement
    expect(diff.querySelector('[data-diff="time"]')).not.toBeNull()
    expect(diff.querySelector('[data-diff="procedureText"]')).toHaveTextContent('Replaces the current text')
    expect(within(panel).getByRole('button', { name: 'Apply 3 changes' })).toBeEnabled()
    fireEvent.click(within(diff.querySelector('[data-diff="note"]') as HTMLElement).getByRole('checkbox'))
    fireEvent.click(within(panel).getByRole('button', { name: 'Apply 2 changes' }))
    const decided = useAppStore.getState().intake.rows[row.id]!
    expect(decided.status).toBe('applied')
    expect(decided.decision?.kind === 'match' ? decided.decision.fieldsApplied : []).toEqual(['time', 'procedureText'])
  })

  it('holds a row with no NHI until one is added; its stub stands until then (33a)', () => {
    importHospitalDownload(useAppStore, OFFICE_ACTOR, 'SAMPLE_SX')
    const row = Object.values(useAppStore.getState().intake.rows).find((r) => r.incoming.patient.name === 'Tama Henare')!
    const { container } = renderScreen({ selectRowId: row.id })
    const panel = screen.getByTestId('matching-panel')
    expect(within(panel).getByRole('button', { name: 'Choose a decision' })).toBeDisabled()
    expect(within(panel).getAllByText('Add the NHI first.').length).toBeGreaterThan(0)
    expect(container.ownerDocument.querySelector('[data-shot="matching-stub"]')).toHaveTextContent("A stub stands on Dr Souter's Tue 28 Jul PM List")
    fireEvent.change(within(panel).getByRole('textbox', { name: 'NHI' }), { target: { value: 'ZQA1008' } })
    // The NHI waits for Add NHI: one audited path (resolveStub).
    expect(useAppStore.getState().intake.rows[row.id]?.corrections?.nhi).toBeUndefined()
    fireEvent.click(within(panel).getByRole('button', { name: 'Add NHI' }))
    const decided = useAppStore.getState().intake.rows[row.id]!
    expect(decided).toMatchObject({ status: 'applied', decision: { kind: 'createBooking', listId: 'L-34821-2026-07-28-PM' } })
    expect(container.ownerDocument.querySelector('[data-shot="matching-stub-resolved"]')).toHaveTextContent("The Booking takes the stub's place on the List.")
  })
})

describe('MatchingScreen with the seeded stub (catch-up Phase 33a)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows the seeded waiting row; Add NHI refuses an invalid NHI and changes nothing', () => {
    renderScreen({ selectRowId: SEED_STUB.rowId })
    const panel = screen.getByTestId('matching-panel')
    expect(within(panel).getByRole('heading', { name: 'Mere Tipene' })).toBeInTheDocument()
    const add = within(panel).getByRole('button', { name: 'Add NHI' })
    expect(add).toBeDisabled()
    fireEvent.change(within(panel).getByRole('textbox', { name: 'NHI' }), { target: { value: 'ZQA1025' } })
    expect(within(panel).getByRole('button', { name: 'Add NHI' })).toBeDisabled()
    expect(useAppStore.getState().intake.stubs[SEED_STUB.stubId]?.status).toBe('standing')
  })

  it("Reject from the stub removes it with the row, through the panel's reason", () => {
    renderScreen({ selectRowId: SEED_STUB.rowId })
    fireEvent.click(within(screen.getByTestId('matching-panel-footer')).getByRole('button', { name: 'Reject' }))
    fireEvent.click(within(screen.getByTestId('matching-panel')).getByRole('button', { name: 'Not an AA booking' }))
    const footer = screen.getByTestId('matching-panel-footer')
    fireEvent.click(within(footer).getByRole('button', { name: /Reject/ }))
    expect(useAppStore.getState().intake.stubs[SEED_STUB.stubId]?.status).toBe('removed')
    expect(useAppStore.getState().audit.some((a) => a.action === 'stub.remove')).toBe(true)
  })
})

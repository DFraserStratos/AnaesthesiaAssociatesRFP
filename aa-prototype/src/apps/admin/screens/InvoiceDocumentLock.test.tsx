/**
 * The invoice document prints from its recipe (catch-up Phase 25, work item
 * 11; US-08.4.4): after authorise, the payer's email, the patient's name and
 * address and the anaesthetist's name change in the masters, and the document
 * still prints what was locked; the Locked record card names the payee.
 */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SurfaceProvider } from '../../../shared'
import { authoriseList, freshAppState, runBillingForList, useAppStore, type Actor } from '../../../store'
import { SEED_LIST_IDS, SEED_MARKERS } from '../../../domain/seed'
import { InvoiceDocument } from './InvoiceDocument'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

describe('a locked invoice prints from its lock', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it("keeps the addressee, the patient line and the supplier after the masters change", () => {
    const listId = SEED_LIST_IDS.souterMon20Pm
    expect(authoriseList(useAppStore, OFFICE, listId).ok).toBe(true)
    runBillingForList(useAppStore, listId)
    const split = SEED_MARKERS['feeSplitBooking']!.entityId
    const s = useAppStore.getState()
    const personal = Object.values(s.billing.invoices).find((i) => i.bookingId === split && i.layout === 'patient')!
    const patientId = s.schedule.bookings[split]!.patientId
    const souter = s.schedule.lists[listId]!.anaesthetistId!
    useAppStore.setState({
      masters: {
        ...s.masters,
        patients: { ...s.masters.patients, [patientId]: { ...s.masters.patients[patientId]!, name: 'Renamed Patient', email: 'moved@example.net' } },
        anaesthetists: { ...s.masters.anaesthetists, [souter]: { ...s.masters.anaesthetists[souter]!, name: 'Dr Someone Else' } },
      },
    })
    render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <InvoiceDocument invoiceId={personal.id} actor={OFFICE} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByText(/Renamed Patient/)).toBeNull()
    expect(screen.queryByText(/moved@example\.net/)).toBeNull()
    expect(screen.queryByText(/Dr Someone Else/)).toBeNull()
    expect(screen.getAllByText(/Dr Melanie Souter/).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-shot="invoice-locked-record"]')).not.toBeNull()
  })
})

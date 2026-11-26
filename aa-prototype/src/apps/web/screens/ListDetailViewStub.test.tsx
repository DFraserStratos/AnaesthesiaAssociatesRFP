/**
 * The stub guard on the web List (US-02.6.4): a List holding only a stub reads
 * "1 waiting at intake" in place of "0 of 0 complete", and its submit action is
 * the greyed state whose click opens the reason, never the confirm.
 */

import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { SEED_STUB } from '../../../domain/seed/intakeSeed'
import { STUB_ONLY_REASON } from '../../../domain/intake/stubs'
import { ListDetailView } from './ListDetailView'

afterEach(cleanup)

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

describe('a List holding only a stub on the web', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('reads "1 waiting at intake" and its greyed submit opens the reason', () => {
    const { container } = render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <ListDetailView listId={SEED_STUB.listId} actor={SOUTER} todayISO={useAppStore.getState().clock.todayISO} onBack={() => undefined} onOpenBooking={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    expect(container.textContent).not.toContain('0 of 0 complete')
    expect(container.querySelectorAll('[data-shot="list-stub-note"]')).toHaveLength(1)
    const submit = container.querySelector('[data-shot="list-submit-held"]') as HTMLElement
    expect(submit).toHaveTextContent('Mark list completed · 1 waiting at intake')
    fireEvent.click(submit)
    const body = container.ownerDocument.body
    expect(within(body).getByText('Waiting at intake')).toBeInTheDocument()
    expect(body.querySelector('[data-shot="submit-list-reason"]')).toHaveTextContent(STUB_ONLY_REASON)
    expect(within(body).queryByText('Submit this list to the office?')).toBeNull()
  })
})

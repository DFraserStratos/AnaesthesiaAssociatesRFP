/**
 * Catalogue examples for the stub components (catch-up Phase 33a): a fixed
 * stub, never written to the demo data.
 */

import { useState } from 'react'
import type { Stub } from '../../../domain/types'
import { neutral } from '../../../theme/tokens'
import { ListStubNote, StubMarker, StubRow, StubSheet, StubTableRow } from '../../../shared/stubs'
import { ProgressBar } from '../../../shared/ui'
import { StubResolveLink } from '../../admin/components/StubResolveLink'

const EXAMPLE: Stub = {
  id: 'STB-EXAMPLE',
  listId: 'L-EXAMPLE',
  importRowId: 'IR-EXAMPLE',
  reason: 'noNhi',
  asReceived: { patientName: 'Mere Tipene', procedureText: 'Lap chole', scheduledTime: '14:00', hospitalId: 'H-SX', sourceLabel: 'Southern Cross theatre list, Tue 8 Dec' },
  createdAtISO: '2026-11-24T07:30:00',
  status: 'standing',
}

/** Admin: the drawer row with "Resolve at Intake", the Review table row, the Day grid and Lists marker, the note. */
export function StubSetExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <StubRow stub={EXAMPLE} density="table" trailing={<StubResolveLink stub={EXAMPLE} />} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <StubTableRow stub={EXAMPLE} colSpan={1} />
        </tbody>
      </table>
      <span style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: neutral.slate }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          St George's · Mr T. Hale <StubMarker count={1} />
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <ProgressBar done={3} total={3} tone="held" />
          <ListStubNote count={1} />
        </span>
      </span>
    </div>
  )
}

/** Mobile: the stub on the phone's List and its read-only sheet. */
export function StubSheetExample() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
      <StubRow stub={EXAMPLE} onOpen={() => setOpen(true)} />
      <StubSheet stub={open ? EXAMPLE : undefined} onClose={() => setOpen(false)} />
    </div>
  )
}

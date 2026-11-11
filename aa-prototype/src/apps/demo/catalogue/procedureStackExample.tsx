/**
 * The procedure stack in the component catalogue (catch-up Phase 20a): the
 * real `ProcedureStack` over fixed views, so its two densities, the
 * still-to-choose parts and the newer-description cue can be compared without
 * the store. Nothing here writes to the demo data.
 */

import { useState } from 'react'
import { ProcedureStack } from '../../../shared/booking/ProcedureStack'
import { TextAction } from '../../../shared/ui/TextAction'
import { Segmented } from '../../../shared/ui'
import type { ProcedureStackView } from '../../../domain/billing/procedureStack'

const HELD: ProcedureStackView = {
  procedureText: { text: 'right total knee', source: 'hospitalDownload', receivedAtISO: '2026-07-20T16:00:00', from: "St George's" },
  invoiceDescription: { text: 'Total knee joint replacement, right', origin: 'edited', newer: { text: 'right total knee', origin: 'hospital' } },
  contract: {
    id: 'CT-STG-D1',
    name: "St George's RVG",
    aaCode: 'STG-001',
    holderName: "St George's",
    invoiced: { name: "St George's", kind: 'holder' },
    basis: { kind: 'rvgAnaesthetistRate' },
  },
  rvg: { code: 'LL4', description: 'Major hip or knee joint procedures, e.g. hip replacement, knee replacement' },
}

const EMPTY: ProcedureStackView = {
  procedureText: { text: 'blephs', source: 'surgeonPdf', receivedAtISO: '2026-07-20T09:00:00' },
  invoiceDescription: { text: 'blephs', origin: 'rooms' },
  contract: null,
  rvg: 'forAnaesthetist',
}

export function ProcedureStackExample({ layout = 'columns' }: { layout?: 'stacked' | 'columns' }) {
  const [density, setDensity] = useState<'full' | 'compact'>('full')
  const [which, setWhich] = useState<'held' | 'empty'>('held')
  const [used, setUsed] = useState(false)
  const view = which === 'held' ? (used ? { ...HELD, invoiceDescription: { text: 'right total knee', origin: 'hospital' as const } } : HELD) : EMPTY
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Segmented value={density} options={[{ value: 'full', label: 'Full' }, { value: 'compact', label: 'Compact' }]} onChange={setDensity} />
        <Segmented value={which} options={[{ value: 'held', label: 'Matched' }, { value: 'empty', label: 'Still to choose' }]} onChange={setWhich} />
      </div>
      <ProcedureStack
        view={view}
        density={density}
        surface="office"
        layout={layout}
        heading="Procedure"
        newerAction={<TextAction small onClick={() => setUsed(true)}>Use it</TextAction>}
      />
    </div>
  )
}

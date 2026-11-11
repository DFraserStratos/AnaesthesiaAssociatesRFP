/**
 * The procedure card in the component catalogue (catch-up Phase 20a): the
 * real `ProcedureStack` over fixed views, its full card (the latest text, short
 * and long) and its compact Review row. Nothing here writes to the demo data.
 */

import { useState } from 'react'
import { ProcedureStack } from '../../../shared/booking/ProcedureStack'
import { Segmented } from '../../../shared/ui'
import type { ProcedureStackView } from '../../../domain/billing/procedureStack'

const SHORT: ProcedureStackView = {
  procedureText: { text: 'right total knee', source: 'hospitalDownload', receivedAtISO: '2026-07-20T16:00:00', from: "St George's" },
  invoiceDescription: { text: 'right total knee', origin: 'hospital' },
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

const LONG: ProcedureStackView = {
  ...SHORT,
  procedureText: {
    text: 'WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC, under general anaesthetic, day stay with overnight option if the flap needs observation',
    source: 'hospitalFeed',
    receivedAtISO: '2026-07-21T08:00:00',
    from: "St George's",
  },
  contract: null,
  rvg: 'forAnaesthetist',
}

export function ProcedureStackExample(_props: { layout?: 'stacked' | 'columns' }) {
  const [density, setDensity] = useState<'full' | 'compact'>('full')
  const [which, setWhich] = useState<'short' | 'long'>('short')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Segmented value={density} options={[{ value: 'full', label: 'Booking card' }, { value: 'compact', label: 'Review row' }]} onChange={setDensity} />
        <Segmented value={which} options={[{ value: 'short', label: 'Short text' }, { value: 'long', label: 'Long text' }]} onChange={setWhich} />
      </div>
      <ProcedureStack view={which === 'short' ? SHORT : LONG} density={density} surface="office" heading="Procedure" />
    </div>
  )
}

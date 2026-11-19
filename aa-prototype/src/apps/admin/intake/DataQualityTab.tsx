/**
 * Admin Intake · Data quality (`/admin/intake/quality`; Phase 11, moved under
 * Intake in catch-up Phase 34): the ethnicity codes quarantined "pending
 * correction". Product UI, unbadged; on the shared `Pill` and `EmptyState`.
 */

import { useMemo, useState } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { correctEthnicityCode, dataQualityItems, useAppStore, type Actor } from '../../../store'
import { Button, EmptyState, FormError, Pill, TextField } from '../../../shared/ui'

export function DataQualityTab({ actor }: { actor: Actor }) {
  const masters = useAppStore((s) => s.masters)
  const items = useMemo(() => dataQualityItems({ masters }), [masters])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate, maxWidth: 820, lineHeight: 1.5 }}>
        The RFP mandates NZHIS Level 4 ethnicity codes, so an inbound code that is not a valid code is
        quarantined &ldquo;pending correction&rdquo;, never stored, and the Booking still books. Supply a valid code to
        clear each item.
      </div>
      {items.length === 0 ? (
        <EmptyState variant="card" shot="data-quality-empty">No data-quality items. Every stored ethnicity code is a valid NZHIS code.</EmptyState>
      ) : (
        items.map((item) => <DataQualityCard key={item.patientId} item={item} actor={actor} />)
      )}
    </div>
  )
}

function DataQualityCard({ item, actor }: { item: { patientId: string; name: string; nhi?: string; receivedCode: string; reason: string }; actor: Actor }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  function apply() {
    const outcome = correctEthnicityCode(useAppStore, actor, item.patientId, code)
    setError(outcome.ok ? null : outcome.message)
  }
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</span>
        {item.nhi !== undefined && <span className="mono" style={{ fontSize: 12, color: neutral.mist }}>{item.nhi}</span>}
        <Pill tone="warning">Pending correction · received {item.receivedCode}</Pill>
      </div>
      <div style={{ fontSize: 12, color: neutral.slate }}>{item.reason}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TextField
          label={`Valid NZHIS code for ${item.name}`}
          hideLabel
          value={code}
          onChange={(v) => {
            setCode(v)
            setError(null)
          }}
          placeholder="Valid NZHIS code"
          mono
          size="compact"
          width={160}
          invalid={error !== null}
        />
        <Button variant="primary" size="compact" onClick={apply}>Apply code</Button>
      </div>
      <FormError message={error} />
    </div>
  )
}

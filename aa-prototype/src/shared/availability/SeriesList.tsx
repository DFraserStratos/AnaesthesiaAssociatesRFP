import { useState } from 'react'
import { Repeat } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { defaultSlotStatus } from '../../domain/slotStatus'
import { deleteAvailabilitySeries, useAppStore, type Actor } from '../../store'
import { FormError } from '../ui'
import { describeAvailabilityOutcome } from './describeAvailabilityOutcome'
import { useActiveSeries } from './useAvailability'

/**
 * "Your series" (catch-up Phase 29; US-01.5.3): the anaesthetist's running
 * repeating days off, each as its rule in words with Delete (and a confirm
 * that says what happens). Shared by the mobile and web calendars.
 */
export function SeriesList({ actor, anaesthetistId, shot, emptyText }: { actor: Actor; anaesthetistId: string; shot: string; emptyText: string }) {
  const series = useActiveSeries(anaesthetistId)
  const defaultLabel = useAppStore((s) => defaultSlotStatus(s.masters.slotStatuses).longLabel)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [line, setLine] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function remove(id: string) {
    const out = deleteAvailabilitySeries(useAppStore, actor, id)
    setConfirmId(null)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    setLine(describeAvailabilityOutcome(out.value, { kind: 'seriesDeleted', statusLabel: defaultLabel }))
  }

  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {series.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>{emptyText}</div>}
      {series.map((s) => (
        <div key={s.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Repeat size={14} color={neutral.slate} aria-hidden />
            <span style={{ flex: 1, fontSize: 13, color: neutral.ink }}>{s.line}</span>
            {confirmId !== s.id && (
              <button type="button" onClick={() => setConfirmId(s.id)} aria-label={`Delete ${s.line}`} style={linkStyle}>Delete</button>
            )}
          </div>
          {confirmId === s.id && (
            <div role="group" aria-label="Delete the series" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: neutral.slate }}>Its sessions from today on return to {defaultLabel}. Days you changed on their own keep their status.</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => remove(s.id)} style={{ ...pill, background: accent.base, color: neutral.surface, borderColor: accent.base }}>Delete the series</button>
                <button type="button" onClick={() => setConfirmId(null)} style={pill}>Keep it</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <FormError message={error} />
      {line !== null && <div role="status" style={{ fontSize: 12.5, color: accent.pressed }}>{line}</div>}
    </div>
  )
}

const linkStyle: React.CSSProperties = { border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 4px' }
const pill: React.CSSProperties = { minHeight: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: accent.pressed, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }

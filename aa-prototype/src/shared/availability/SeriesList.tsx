import { useRef, useState } from 'react'
import { Repeat } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import { defaultSlotStatus } from '../../domain/slotStatus'
import { deleteAvailabilitySeries, useAppStore, type Actor } from '../../store'
import { FormError } from '../ui'
import { InlineConfirm } from '../ui/InlineConfirm'
import { TextAction } from '../ui/TextAction'
import { describeAvailabilityOutcome } from './describeAvailabilityOutcome'
import { useActiveSeries } from './useAvailability'
import { ResultLine } from '../ui/ResultLine'
import { EmptyState } from '../ui/EmptyState'

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
  // Each series' row, to find its Delete again when "Keep it" returns focus.
  const deleteRows = useRef<Record<string, HTMLDivElement | null>>({})

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
      {series.length === 0 && <EmptyState>{emptyText}</EmptyState>}
      {series.map((s) => (
        <div key={s.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div ref={(el) => { deleteRows.current[s.id] = el }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Repeat size={14} color={neutral.slate} aria-hidden />
            <span style={{ flex: 1, fontSize: 13, color: neutral.ink }}>{s.line}</span>
            {confirmId !== s.id && (
              <TextAction onClick={() => setConfirmId(s.id)} label={`Delete ${s.line}`} style={{ fontSize: 13, padding: '6px 4px' }}>Delete</TextAction>
            )}
          </div>
          {confirmId === s.id && (
            <InlineConfirm
              label="Delete the series"
              message={<>Its sessions from today on return to {defaultLabel}. Days you changed on their own keep their status.</>}
              confirmLabel="Delete the series"
              onConfirm={() => remove(s.id)}
              cancelLabel="Keep it"
              onCancel={() => setConfirmId(null)}
              returnFocus={() => deleteRows.current[s.id]?.querySelector<HTMLButtonElement>('button')}
            />
          )}
        </div>
      ))}
      <FormError message={error} />
      <ResultLine plain line={line} />
    </div>
  )
}

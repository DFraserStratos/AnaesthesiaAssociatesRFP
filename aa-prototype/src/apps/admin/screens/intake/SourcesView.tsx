/**
 * Sources (build plan Phases 68 and 71; D117; US-02.1.7, DM-14; docs/explorations/intake-ideas.html #sources):
 * the promise that AA only reads from its sources, then one row per connected or reading source with its state,
 * last sent and today's traffic, Today's messages, anything held under its source, and last the hospitals not
 * connected. Every measure is derived from the stored sources and the arrivals on the demo clock
 * (`domain/intake/sources.ts`). Read only: no retry, alert, switch or write-back control.
 */

import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { today } from '../../../../domain/clock'
import { heldBySource, notConnected, sourceRows, todaysMessages, type SourcesInput } from '../../../../domain/intake/sources'
import { Notice } from '../../../../shared/ui'
import { useAppStore } from '../../../../store'
import { arrivalItemsOf, useIntakeSources } from '../../../../store/intakeSelectors'
import type { Actor } from '../../../../store/mutate'
import { RawRowSheet } from '../../matching/RawRowSheet'
import { HeldBySource } from './sources/HeldBySource'
import { NotConnected } from './sources/NotConnected'
import { SourceRow } from './sources/SourceRow'
import { TodaysMessages } from './sources/TodaysMessages'

/** The acting office user, handed down by `IntakeSection`'s outlet (on top of the Admin shell's context). */
function useOutletActor(): Actor | undefined {
  const context = useOutletContext<{ actor?: Actor } | null | undefined>()
  return context?.actor
}

export function SourcesView() {
  const actor = useOutletActor()
  const sources = useIntakeSources()
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  const clock = useAppStore((s) => s.clock)
  const todayISO = today(clock)

  const input = useMemo<SourcesInput>(
    () => ({ sources, batches: intake.batches, items: arrivalItemsOf({ masters, schedule, intake }), todayISO }),
    [sources, masters, schedule, intake, todayISO],
  )
  const rows = useMemo(() => sourceRows(input), [input])
  const messages = useMemo(() => todaysMessages(input), [input])
  const held = useMemo(() => heldBySource(input), [input])
  const offline = useMemo(() => {
    const ids = new Set(notConnected(input).map((s) => s.id))
    return sources.filter((s) => ids.has(s.id))
  }, [input, sources])

  const [raw, setRaw] = useState<{ batchId: string; sourceName: string } | null>(null)

  return (
    <div data-shot="intake-sources" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Notice tone="neutral" shot="intake-sources-inbound">
        AA reads from these sources and never writes back to them
      </Notice>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {rows.map((row) => (
          <SourceRow key={row.source.id} row={row} todayISO={todayISO} />
        ))}
      </div>
      <TodaysMessages messages={messages} />
      <HeldBySource
        sources={sources}
        held={held}
        todayISO={todayISO}
        {...(actor !== undefined ? { onViewRaw: (batchId: string, sourceName: string) => setRaw({ batchId, sourceName }) } : {})}
      />
      <NotConnected sources={offline} />
      {raw !== null && actor !== undefined && <RawRowSheet rowId={raw.batchId} patientName={raw.sourceName} actor={actor} onClose={() => setRaw(null)} />}
    </div>
  )
}

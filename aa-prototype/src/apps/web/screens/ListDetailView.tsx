import { useMemo, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic } from '../../../theme/tokens'
import type { Card } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { ListRow, StatusChip, TickBadge } from '../../../shared'
import { AddCardFlow, SubmitListSheet } from '../../../shared/flows'
import { sessionTimeRange } from '../../../shared/format'

interface ListDetailViewProps {
  listId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  onOpenCard: (cardId: string) => void
}

interface CardRow {
  card: Card
  time: string
  patientName: string
  operation: string
}

/**
 * Web List detail (drill-down page; W2 / M6-M7 parity). Desktop chrome around
 * the same guarded flows as mobile: a progress bar, time-ordered card rows
 * (shared `ListRow`), the shared `AddCardFlow` (a dialog on web via the surface
 * seam) and the shared completion-gated `SubmitListSheet`. A card row opens the
 * web card detail (the shared `CardDetailBody`), so BTM capture behaves exactly
 * as on mobile.
 */
export function ListDetailView({ listId, actor, todayISO, onBack, onOpenCard }: ListDetailViewProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const patients = useAppStore((s) => s.masters.patients)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [addOpen, setAddOpen] = useState(false)
  const [submitSheet, setSubmitSheet] = useState<'none' | 'blockers' | 'confirm'>('none')

  const model = useMemo(() => {
    if (list === undefined) return undefined
    const firstProcByCard = new Map<string, { id: string; description: string }>()
    for (const p of Object.values(proceduresRecord)) {
      const current = firstProcByCard.get(p.cardId)
      if (current === undefined || p.id < current.id) firstProcByCard.set(p.cardId, { id: p.id, description: p.description })
    }
    const rows: CardRow[] = Object.values(cardsRecord)
      .filter((c) => c.listId === listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((card) => ({
        card,
        time: card.scheduledTime ?? '·',
        patientName: patients[card.patientId]?.name ?? 'Unknown patient',
        operation: firstProcByCard.get(card.id)?.description || 'Procedure to capture',
      }))
    const active = rows.filter((r) => r.card.cancellation === undefined)
    return { rows, activeCount: active.length, done: active.filter((r) => r.card.completed).length }
  }, [list, listId, cardsRecord, proceduresRecord, patients])

  if (list === undefined || model === undefined) return null

  const hospitalName = list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
  const surgeon = list.surgeonId !== undefined ? surgeons[list.surgeonId] : undefined
  const isPreop = list.statusKey === 'preop'
  const title = isPreop ? 'Pre-op assessment' : hospitalName
  const dayLabel = list.dateISO === todayISO ? 'Today' : list.dateISO
  const subline = [surgeon?.name, surgeon?.specialty, dayLabel, sessionTimeRange(list)]
    .filter((p): p is string => p !== undefined && p !== '')
    .join(' · ')
  const canEdit = list.state === 'DRAFT'
  const incomplete = model.activeCount - model.done
  const pct = model.activeCount > 0 ? Math.round((model.done / model.activeCount) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Lists
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {title} {list.session}
          </h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>{subline}</div>
        </div>
        <StatusChip status={list.statusKey} style={{ marginTop: 4, flex: 'none' }} />
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>
          {model.done} of {model.activeCount} complete
        </span>
        <span style={{ flex: 1, maxWidth: 320, height: 6, borderRadius: 99, background: neutral.line, overflow: 'hidden', display: 'block' }}>
          <span style={{ display: 'block', height: '100%', borderRadius: 99, background: semantic.success.solid, transition: 'width 300ms cubic-bezier(0.2,0.8,0.2,1)', width: `${pct}%` }} />
        </span>
      </div>

      {/* Card rows (shared ListRow) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {model.rows.map((r) => {
          const cancelled = r.card.cancellation !== undefined
          return (
            <ListRow
              key={r.card.id}
              statusKey={list.statusKey}
              title={r.patientName}
              subtitle={`${r.time} · ${r.operation}`}
              onClick={() => onOpenCard(r.card.id)}
              right={
                cancelled
                  ? { kind: 'custom', node: <span style={{ fontSize: 12, fontWeight: 600, color: semantic.error.onTint }}>Cancelled</span> }
                  : r.card.completed
                    ? { kind: 'custom', node: <TickBadge size={28} /> }
                    : { kind: 'custom', node: <span style={{ padding: '8px 16px', borderRadius: 999, background: accent.tint, fontSize: 13, fontWeight: 600, color: accent.pressed }}>Capture</span> }
              }
            />
          )
        })}

        {canEdit && (
          <button
            onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 16px', background: neutral.surface, border: `1.5px dashed ${neutral.lineStrong}`, borderRadius: radius.card, fontFamily: 'inherit', color: accent.base, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={18} strokeWidth={2.4} aria-hidden /> Add a card
          </button>
        )}
      </div>

      {/* Submit footer */}
      <div style={{ maxWidth: 420 }}>
        {list.state !== 'DRAFT' ? (
          <div style={{ height: 52, borderRadius: radius.card, background: semantic.success.solid, color: neutral.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 700 }}>
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
              <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" fill="none" stroke={neutral.surface} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Submitted to office
          </div>
        ) : incomplete > 0 ? (
          <button
            type="button"
            onClick={() => setSubmitSheet('blockers')}
            style={{ height: 52, width: '100%', borderRadius: radius.card, border: 'none', background: neutral.line, color: neutral.mist, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            <span>Mark list completed · {incomplete} to finish</span>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Click to see what is left</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSubmitSheet('confirm')}
            style={{ height: 52, width: '100%', borderRadius: radius.card, border: 'none', background: accent.base, color: neutral.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: elevation.e2 }}
          >
            Mark list completed
          </button>
        )}
      </div>

      <AddCardFlow open={addOpen} listId={listId} actor={actor} onClose={() => setAddOpen(false)} onCreated={() => undefined} />
      {submitSheet !== 'none' && (
        <SubmitListSheet open listId={listId} actor={actor} mode={submitSheet} onClose={() => setSubmitSheet('none')} onSubmitted={() => setSubmitSheet('none')} />
      )}
    </div>
  )
}

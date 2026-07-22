import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic } from '../../../theme/tokens'
import { motion } from '../../../theme/motion'
import type { Card } from '../../../domain/types'
import { useAppStore, useToday, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { TickBadge } from '../components'
import { SubmitListSheet } from '../flows/SubmitListSheet'
import { sessionTimeRange } from '../format'

interface ListDetailScreenProps {
  listId: string
  actor: Actor
  onBack: () => void
  onOpenCard: (cardId: string) => void
  onAddCard: () => void
}

interface CardRow {
  card: Card
  time: string
  patientName: string
  nhi: string | undefined
  operation: string
}

export function ListDetailScreen({ listId, actor, onBack, onOpenCard, onAddCard }: ListDetailScreenProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const patients = useAppStore((s) => s.masters.patients)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const todayISO = useToday()
  const [sheet, setSheet] = useState<'none' | 'blockers' | 'confirm'>('none')

  // Tick choreography: rows completed AFTER this screen last showed the list
  // animate their tick in (the mockup's tick-pop); rows already done render
  // still. The set resets when the screen moves to a different list.
  const initialCompleted = useRef<Set<string> | null>(null)
  const seenListId = useRef(listId)
  if (seenListId.current !== listId) {
    seenListId.current = listId
    initialCompleted.current = null
  }
  if (initialCompleted.current === null) {
    initialCompleted.current = new Set(
      Object.values(cardsRecord)
        .filter((c) => c.listId === listId && c.completed)
        .map((c) => c.id),
    )
  }

  const model = useMemo(() => {
    if (list === undefined) return undefined
    // Primary op per card = the lowest-id (first-created) procedure's description.
    const firstProcByCard = new Map<string, { id: string; description: string }>()
    for (const p of Object.values(proceduresRecord)) {
      const current = firstProcByCard.get(p.cardId)
      if (current === undefined || p.id < current.id) firstProcByCard.set(p.cardId, { id: p.id, description: p.description })
    }
    const rows: CardRow[] = Object.values(cardsRecord)
      .filter((c) => c.listId === listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((card) => {
        const patient = patients[card.patientId]
        return {
          card,
          time: card.scheduledTime ?? '·',
          patientName: patient?.name ?? 'Unknown patient',
          nhi: patient?.nhi,
          operation: firstProcByCard.get(card.id)?.description || 'Procedure to capture',
        }
      })
    const active = rows.filter((r) => r.card.cancellation === undefined)
    const done = active.filter((r) => r.card.completed).length
    return { rows, activeCount: active.length, done }
  }, [list, listId, cardsRecord, proceduresRecord, patients])

  if (list === undefined || model === undefined) return null

  const hospitalName = list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
  const surgeon = list.surgeonId !== undefined ? surgeons[list.surgeonId] : undefined
  const isPreop = list.statusKey === 'preop'
  const title = isPreop ? 'Pre-op assessment' : hospitalName
  const dayLabel = list.dateISO === todayISO ? 'Today' : list.dateISO
  const sublineParts = [
    surgeon?.name,
    surgeon?.specialty,
    dayLabel,
    sessionTimeRange(list),
  ].filter((p): p is string => p !== undefined && p !== '')
  const canEdit = list.state === 'DRAFT'
  const incomplete = model.activeCount - model.done
  const pct = model.activeCount > 0 ? Math.round((model.done / model.activeCount) * 100) : 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 20px 14px', flex: 'none' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            minHeight: 44,
            border: 'none',
            background: 'none',
            padding: 0,
            color: accent.base,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          Lists
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {title} {list.session}
            </div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>{sublineParts.join(' · ')}</div>
          </div>
          <StatusChip status={list.statusKey} style={{ marginTop: 4, flex: 'none' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>
            {model.done} of {model.activeCount} complete
          </span>
          <span style={{ flex: 1, height: 6, borderRadius: 99, background: neutral.line, overflow: 'hidden', display: 'block' }}>
            <span
              style={{
                display: 'block',
                height: '100%',
                borderRadius: 99,
                background: semantic.success.solid,
                transition: 'width 300ms cubic-bezier(0.2,0.8,0.2,1)',
                width: `${pct}%`,
              }}
            />
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 130px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {model.rows.map((r) => {
          const cancelled = r.card.cancellation !== undefined
          return (
            <button
              key={r.card.id}
              onClick={() => onOpenCard(r.card.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: neutral.surface,
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.card,
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                opacity: cancelled ? 0.6 : 1,
              }}
            >
              <span className="mono" style={{ width: 44, flex: 'none', fontSize: 12, fontWeight: 600, color: neutral.mist }}>
                {r.time}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: cancelled ? 'line-through' : 'none',
                  }}
                >
                  {r.patientName}
                </span>
                {r.nhi !== undefined && (
                  <span className="mono" style={{ fontSize: 11, color: neutral.mist }}>
                    {r.nhi}
                  </span>
                )}
                <span style={{ fontSize: 13, color: neutral.slate }}>{r.operation}</span>
              </span>
              {cancelled ? (
                <span style={{ fontSize: 11, fontWeight: 600, color: semantic.error.onTint, flex: 'none' }}>Cancelled</span>
              ) : r.card.completed ? (
                <TickBadge size={28} animate={!(initialCompleted.current?.has(r.card.id) ?? false)} />
              ) : (
                <span
                  style={{
                    padding: '9px 16px',
                    borderRadius: 999,
                    background: accent.tint,
                    fontSize: 13,
                    fontWeight: 600,
                    color: accent.pressed,
                    flex: 'none',
                  }}
                >
                  Capture
                </span>
              )}
            </button>
          )
        })}

        {canEdit && (
          <button
            onClick={onAddCard}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 16px',
              background: neutral.surface,
              border: `1.5px dashed ${neutral.lineStrong}`,
              borderRadius: radius.card,
              fontFamily: 'inherit',
              color: accent.base,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} strokeWidth={2.4} aria-hidden />
            Add a card
          </button>
        )}
      </div>

      {/* Sticky submit footer — the mockup's disabled → enabled → submitted
          walk. Completion-gated at the store; the greyed bar stays TAPPABLE
          and opens the explanatory sheet naming the offenders. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 20px 32px',
          background: 'rgba(246,248,247,0.92)',
          backdropFilter: 'blur(14px)',
          borderTop: `1px solid ${neutral.line}`,
        }}
      >
        {list.state !== 'DRAFT' ? (
          <div
            style={{
              height: 54,
              borderRadius: radius.card,
              background: semantic.success.solid,
              color: neutral.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 17,
              fontWeight: 700,
              animation: `aa-tick-pop 340ms ${motion.completeTick.easing}`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
                fill="none"
                stroke={neutral.surface}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Submitted to office
          </div>
        ) : incomplete > 0 ? (
          <button
            type="button"
            onClick={() => setSheet('blockers')}
            style={{
              height: 54,
              width: '100%',
              borderRadius: radius.card,
              border: 'none',
              background: neutral.line,
              color: neutral.mist,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: '18px',
              cursor: 'pointer',
            }}
          >
            <span>Mark list completed · {incomplete} to finish</span>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Tap to see what is left</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSheet('confirm')}
            style={{
              height: 54,
              width: '100%',
              borderRadius: radius.card,
              border: 'none',
              background: accent.base,
              color: neutral.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: elevation.e2,
            }}
          >
            Mark list completed
          </button>
        )}
      </div>

      {sheet !== 'none' && (
        <SubmitListSheet
          open
          listId={listId}
          actor={actor}
          mode={sheet}
          onClose={() => setSheet('none')}
          onSubmitted={() => setSheet('none')}
        />
      )}
    </div>
  )
}

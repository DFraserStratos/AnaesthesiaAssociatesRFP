import { useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { accent, elevation, neutral, radius } from '../../../theme/tokens'
import type { Procedure } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { CardDetailBody } from '../../../shared/card'
import { ageYears, formatDob, nhiBadge } from '../../../shared/format'

interface AdminCardDetailProps {
  cardId: string
  actor: Actor
  todayISO: string
  onBack: () => void
}

/**
 * Admin card detail — desktop chrome around the shared `CardDetailBody` with the
 * OFFICE actor, so it gains the office billing-setup section (Step 2), edit
 * rights on SUBMITTED lists, the audited soft-cancel, and BTM/patient edits, all
 * audited `source=office`. Identical guards and validation to the other apps.
 */
export function AdminCardDetail({ cardId, actor, todayISO, onBack }: AdminCardDetailProps) {
  const card = useAppStore((s) => s.schedule.cards[cardId])
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)

  const list = card !== undefined ? listsRecord[card.listId] : undefined
  const primary: Procedure | undefined = useMemo(() => {
    if (card === undefined) return undefined
    return Object.values(proceduresRecord)
      .filter((p) => p.cardId === cardId)
      .sort((a, b) => a.id.localeCompare(b.id))[0]
  }, [card, cardId, proceduresRecord])

  if (card === undefined || list === undefined) return null
  const patient = masters.patients[card.patientId]
  const badge = nhiBadge(patient?.nhi)
  const hospitalName = list.hospitalId !== undefined ? (masters.hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Day view
      </button>

      <div>
        <h1 style={{ margin: 0, fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.01em' }}>{patient?.name ?? 'Unknown patient'}</h1>
        <div className="mono" style={{ fontSize: 12, color: neutral.slate, marginTop: 4 }}>
          {badge.text}
          {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14 }}>{primary?.description || 'Operation to capture'}</span>
          <StatusChip status={list.statusKey} />
          <span style={{ fontSize: 12, color: neutral.mist }}>{hospitalName}</span>
        </div>
      </div>

      <div style={{ position: 'relative', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.panel, boxShadow: elevation.e1 }}>
        <CardDetailBody cardId={cardId} actor={actor} onBack={onBack} onCopied={onBack} />
      </div>
    </div>
  )
}

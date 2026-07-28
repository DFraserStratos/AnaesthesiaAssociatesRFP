import { useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { accent, neutral } from '../../../theme/tokens'
import type { Procedure } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { CardDetailBody } from '../../../shared/card'
import { ageYears, formatDob, nhiBadge } from '../../../shared/format'

interface CardDetailViewProps {
  cardId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  onCopied: () => void
}

/**
 * Web card detail (drill-down page; W2 / M6-M7 parity). Desktop chrome around
 * the shared `CardDetailBody` — identical BTM capture, validation and lifecycle
 * guards to mobile; the edit / copy / add-card flows render as centred dialogs
 * via the web surface.
 *
 * The chrome is a page header in the web app's own language (the 28/34 title
 * and slate sub-line the dashboard and lists table use), and then the body
 * spans the full page width. There is deliberately no wrapping panel: the web
 * `CardLayout` puts the capture cards straight onto the grey canvas the way
 * every other web screen puts its panels there. Nesting white cards inside one
 * white panel was the mobile stack borrowed whole, and it flattened the
 * hierarchy on a surface that has room for a real one.
 */
export function CardDetailView({ cardId, actor, todayISO, onBack, onCopied }: CardDetailViewProps) {
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

  const header = (_collapsed: boolean, history: React.ReactNode) => (
    <div
      data-testid="web-card-header"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>
          {patient?.name ?? 'Unknown patient'}
        </h1>
        <div className="mono" style={{ fontSize: 12.5, color: neutral.mist, marginTop: 6 }}>
          {badge.text}
          {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
        </div>
        <div style={{ fontSize: 14, color: neutral.slate, marginTop: 2 }}>
          {primary?.description || 'Operation to capture'} · {hospitalName}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 2 }}>
        <StatusChip status={list.statusKey} />
        {history}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> List
      </button>

      <CardDetailBody cardId={cardId} actor={actor} onBack={onBack} onCopied={onCopied} header={header} />
    </div>
  )
}

import { useMemo, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { accent, neutral } from '../../../theme/tokens'
import { motion } from '../../../theme/motion'
import type { Procedure } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { CardDetailBody } from '../../../shared/card'

interface CardDetailScreenProps {
  cardId: string
  actor: Actor
  onBack: () => void
  onCopied: () => void
}

/**
 * The fold. A collapsing large title is not one of the four named motion
 * patterns, so it borrows the closest one: `cardAdvance`'s curve and return
 * duration, which is what the rest of the phone's forward-and-back movement
 * uses. Reduced motion flattens all of it to an 80 ms fade via `global.css`.
 */
const FOLD = `max-height ${motion.cardAdvance.return}ms ${motion.cardAdvance.easing}, opacity 180ms ease-out, margin-top ${motion.cardAdvance.return}ms ${motion.cardAdvance.easing}`
const REVEAL = `max-width ${motion.cardAdvance.return}ms ${motion.cardAdvance.easing}, opacity 200ms ease-out`

/**
 * Mobile card detail — phone chrome (60px status-bar inset, back link, patient
 * masthead) around the shared `CardDetailBody` (Phase 05). All the capture,
 * validation and lifecycle behaviour lives in the shared body, so mobile and the
 * web card view behave identically; only this masthead and the surrounding
 * `position:relative` phone-frame column are mobile-specific.
 *
 * The masthead FOLDS. At rest it is the patient's name over a status / History
 * action row and the operation; past 24px of scroll it becomes a 44px nav row
 * carrying the name inline beside the back link, iOS large-title fashion.
 * History folds away with the expanded row so the compact title cannot crowd.
 * The fold reclaims the room that pays for the Card total pinned in the dock.
 *
 * It is handed to the layout as a function of `collapsed` rather than rendered
 * here, because the scroll region it reacts to belongs to `MobileCardLayout`.
 *
 * The NHI and date of birth are deliberately NOT here. They were duplicated
 * verbatim by the Patient card two rows into the column, which is the card's one
 * home for patient reference data; the masthead's job is to say whose record
 * this is and which list it belongs to.
 */
export function CardDetailScreen({ cardId, actor, onBack, onCopied }: CardDetailScreenProps) {
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
  const patientName = patient?.name ?? 'Unknown patient'
  const hospitalName = list.hospitalId !== undefined ? (masters.hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'

  const header = (collapsed: boolean, history: ReactNode) => (
    <div
      data-testid="mobile-card-header"
      style={{ flex: 'none', padding: '60px 20px 14px', borderBottom: `1px solid ${neutral.line}`, background: neutral.surface }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none', minHeight: 44, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          List
        </button>
        {/* The folded title. Kept mounted so the reveal can animate, and hidden
            from assistive tech while closed so the name is never read twice. */}
        <span
          aria-hidden={!collapsed}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: collapsed ? 1 : 0, maxWidth: collapsed ? '100%' : 0, overflow: 'hidden', transition: REVEAL }}
        >
          <span style={{ fontSize: 17, lineHeight: '24px', fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {patientName}
          </span>
          <StatusChip status={list.statusKey} style={{ flex: 'none', padding: '3px 8px' }} />
        </span>
      </div>

      {/* max-height allows two lines: a long name should wrap at rest, never
          truncate. Overshooting the real height is harmless — it is a max. */}
      <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em', maxHeight: collapsed ? 0 : 62, opacity: collapsed ? 0 : 1, overflow: 'hidden', transition: FOLD }}>
        {patientName}
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: collapsed ? 0 : 8, maxHeight: collapsed ? 0 : 64, opacity: collapsed ? 0 : 1, overflow: 'hidden', transition: FOLD }}
        aria-hidden={collapsed}
      >
        <div
          data-testid="mobile-card-header-actions"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <StatusChip status={list.statusKey} />
          {!collapsed ? history : null}
        </div>
        <span style={{ minWidth: 0, fontSize: 12, color: neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {primary?.description || 'Operation to capture'} · {hospitalName}
        </span>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardDetailBody cardId={cardId} actor={actor} onBack={onBack} onCopied={onCopied} header={header} />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { List } from '../../../domain/types'
import { reassignCard, useAppStore, type Actor } from '../../../store'
import { Button } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { surnameOf } from '../util'

interface MoveCardFlowProps {
  open: boolean
  cardId: string
  actor: Actor
  onClose: () => void
  onMoved: () => void
}

/**
 * Move a single Card to another List (3rd review #3; the RFP's routine case).
 * The office picks a target day, then a candidate List (any anaesthetist, either
 * session); each candidate shows its surgeon/hospital and an advisory pairing
 * mismatch flag before confirm (5th review #5 — no hard guard on pairing). The
 * store's `reassignCard` blocks AUTHORISED source/target.
 */
export function MoveCardFlow({ open, cardId, actor, onClose, onMoved }: MoveCardFlowProps) {
  const { Overlay } = useSurface()
  const card = useAppStore((s) => s.schedule.cards[cardId])
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)

  const sourceList = card !== undefined ? lists[card.listId] : undefined
  const [targetDate, setTargetDate] = useState(sourceList?.dateISO ?? '')
  const [error, setError] = useState<string | null>(null)

  const sourceId = sourceList?.id
  const candidates = useMemo(() => {
    if (sourceId === undefined || targetDate === '') return []
    return Object.values(lists)
      .filter((l) => l.dateISO === targetDate && l.id !== sourceId && l.state !== 'AUTHORISED')
      .sort((a, b) => (a.anaesthetistId === b.anaesthetistId ? a.session.localeCompare(b.session) : a.anaesthetistId.localeCompare(b.anaesthetistId)))
  }, [sourceId, targetDate, lists])

  function mismatch(target: List): string | null {
    if (sourceList === undefined) return null
    const reasons: string[] = []
    if (sourceList.hospitalId !== undefined && target.hospitalId !== undefined && sourceList.hospitalId !== target.hospitalId) reasons.push('different hospital')
    if (sourceList.surgeonId !== undefined && target.surgeonId !== undefined && sourceList.surgeonId !== target.surgeonId) reasons.push('different surgeon')
    return reasons.length > 0 ? reasons.join(', ') : null
  }

  function move(target: List) {
    setError(null)
    const outcome = reassignCard(useAppStore, actor, cardId, target.id)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onMoved()
  }

  if (sourceList === undefined) return null

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Move card to another list</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          The Card moves alone. Both lists' other cards and their status are untouched, and the move is recorded in the Card's audit trail.
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>Target day</span>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }} />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflow: 'auto' }}>
          {candidates.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No candidate lists on {targetDate !== '' ? format(parseISO(targetDate), 'd MMM') : 'that day'}.</div>}
          {candidates.map((l) => {
            const anae = masters.anaesthetists[l.anaesthetistId]
            const hosp = l.hospitalId !== undefined ? masters.hospitals[l.hospitalId]?.name : 'Unassigned'
            const surg = l.surgeonId !== undefined ? masters.surgeons[l.surgeonId]?.name : 'No surgeon'
            const flag = mismatch(l)
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => move(l)}
                style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'stretch', textAlign: 'left', padding: '10px 12px', borderRadius: radius.card, border: `1px solid ${neutral.line}`, background: neutral.surface, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{anae !== undefined ? surnameOf(anae.name) : l.anaesthetistId} · {l.session} · {l.state}</span>
                <span style={{ fontSize: 12, color: neutral.slate }}>{hosp} · {surg}</span>
                {flag !== null && (
                  <span style={{ fontSize: 11, color: semantic.warning.onTint, fontWeight: 600 }}>Advisory: {flag}. Pairing is not enforced.</span>
                )}
              </button>
            )
          })}
        </div>

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="secondary" block onClick={onClose}>Cancel</Button>
        <div style={{ fontSize: 11, color: accent.pressed }}>Select a target list to move the card immediately.</div>
      </div>
    </Overlay>
  )
}

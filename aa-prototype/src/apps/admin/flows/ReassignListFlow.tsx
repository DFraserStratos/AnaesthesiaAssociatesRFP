import { useMemo, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { List, ListStatusKey } from '../../../domain/types'
import { cardsForList, listForSlot, reassignList, useAppStore, type Actor } from '../../../store'
import { Button } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { surnameFirst } from '../util'

interface ReassignListFlowProps {
  open: boolean
  list: List
  actor: Actor
  onClose: () => void
  onReassigned: () => void
}

const VACATED_OPTIONS: { value: ListStatusKey; label: string }[] = [
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'free', label: 'Free' },
  { value: 'holiday', label: 'Holiday' },
]

/**
 * List reassignment (illness cover). Surfaces only anaesthetists whose same-slot
 * session is genuinely Free (the store guard rejects non-free targets), then a
 * confirm step states the slot mechanics with the vacated-slot status pickable
 * (default Unavailable). The mechanism (free target absorbed, vacated slot
 * regenerated) is the prototype's PROPOSED reading of the RFP's open question
 * (REQUIREMENTS §11) — stated as replaceable in the help copy.
 */
export function ReassignListFlow({ open, list, actor, onClose, onReassigned }: ReassignListFlowProps) {
  const { Overlay } = useSurface()
  const state = useAppStore()
  const anaesthetists = state.masters.anaesthetists

  const [targetId, setTargetId] = useState<string | null>(null)
  const [vacatedStatus, setVacatedStatus] = useState<ListStatusKey>('unavailable')
  const [error, setError] = useState<string | null>(null)

  const freeTargets = useMemo(() => {
    return Object.values(anaesthetists)
      .filter((a) => a.registrationNumber !== list.anaesthetistId)
      .map((a) => ({ anae: a, slot: listForSlot(state, a.registrationNumber, list.dateISO, list.session) }))
      .filter(({ slot }) => slot !== undefined && slot.statusKey === 'free' && slot.state === 'DRAFT' && cardsForList(state, slot.id).length === 0)
  }, [anaesthetists, list.anaesthetistId, list.dateISO, list.session, state])

  const target = targetId !== null ? anaesthetists[targetId] : undefined
  const sourceName = anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId

  function confirm() {
    if (target === undefined) return
    setError(null)
    const outcome = reassignList(useAppStore, actor, list.id, target.registrationNumber, vacatedStatus)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onReassigned()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Reassign list (cover)</div>

        {targetId === null ? (
          <>
            <div style={{ fontSize: 13, color: neutral.slate }}>
              Choose an anaesthetist whose {list.session} session is free. Only genuinely free sessions can absorb this list.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflow: 'auto' }}>
              {freeTargets.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No anaesthetist has a free {list.session} session on this day.</div>}
              {freeTargets.map(({ anae }) => (
                <button
                  key={anae.registrationNumber}
                  type="button"
                  onClick={() => setTargetId(anae.registrationNumber)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: radius.card, border: `1px solid ${neutral.line}`, background: neutral.surface, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{surnameFirst(anae.name)}</span>
                  <span style={{ fontSize: 12, color: accent.base, fontWeight: 600 }}>Free {list.session} →</span>
                </button>
              ))}
            </div>
            <Button variant="secondary" block onClick={onClose}>Cancel</Button>
          </>
        ) : (
          <>
            <div style={{ background: accent.tint, borderRadius: radius.card, padding: 12, fontSize: 13, color: accent.pressed }}>
              {surnameFirst(target?.name ?? '')}'s free {list.session} becomes this list (cards, status and audit intact).
              {' '}{surnameFirst(sourceName)}'s {list.session} slot regenerates as the status below.
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>Vacated slot becomes</span>
              <select value={vacatedStatus} onChange={(e) => setVacatedStatus(e.target.value as ListStatusKey)} style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}>
                {VACATED_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <div style={{ fontSize: 11, color: neutral.mist, lineHeight: '16px' }}>
              Proposed reading: the RFP leaves the precise reassignment mechanism open. This prototype absorbs the target's free slot and regenerates the vacated one, keeping two sessions per anaesthetist. This mechanism is replaceable.
            </div>
            {error !== null && (
              <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setTargetId(null)}>Back</Button>
              <Button variant="primary" block onClick={confirm}>Confirm reassignment</Button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  )
}

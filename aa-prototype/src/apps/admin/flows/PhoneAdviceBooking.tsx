import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { List } from '../../../domain/types'
import { editList, useAppStore, type Actor, type ListPatch } from '../../../store'
import { Button, FieldLabel } from '../../../shared/ui'
import { AddCardFlow } from '../../../shared/flows'
import { useSurface } from '../../../shared/surface'

interface PhoneAdviceBookingProps {
  open: boolean
  list: List
  actor: Actor
  onClose: () => void
  onBooked: (cardId: string) => void
}

const selectStyle = {
  minHeight: 44,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.bg,
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 14,
} as const

/**
 * Phone-advice booking on a Free list ("call from the surgeon's rooms"). Step 1
 * sets the list context (hospital / surgeon / times) via `editList`; step 2
 * reuses the shared `AddCardFlow` to capture the patient, procedure and initial
 * billing route. The Free block then renders booked on the grid (Step 3's
 * derived display) and appears in the anaesthetist's own views.
 */
export function PhoneAdviceBooking({ open, list, actor, onClose, onBooked }: PhoneAdviceBookingProps) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const [step, setStep] = useState<'context' | 'card'>('context')
  const [hospitalId, setHospitalId] = useState('')
  const [surgeonId, setSurgeonId] = useState('')
  const [startTime, setStartTime] = useState(list.session === 'AM' ? '08:00' : '13:00')
  const [endTime, setEndTime] = useState(list.session === 'AM' ? '12:00' : '17:00')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep('context')
      setHospitalId('')
      setSurgeonId('')
      setStartTime(list.session === 'AM' ? '08:00' : '13:00')
      setEndTime(list.session === 'AM' ? '12:00' : '17:00')
      setError(null)
    }
  }, [open, list.session])

  function continueToCard() {
    setError(null)
    if (hospitalId === '') {
      setError('Choose the hospital advising this booking.')
      return
    }
    setStep('card')
  }

  // Write the list context only once the card is actually created, so an
  // abandoned flow never leaves a Free list carrying a hospital but no card.
  function onCardCreated(cardId: string) {
    const patch: ListPatch = { hospitalId, startTime, endTime }
    if (surgeonId !== '') patch.surgeonId = surgeonId
    editList(useAppStore, actor, list.id, patch)
    onBooked(cardId)
  }

  if (step === 'card') {
    return <AddCardFlow open={open} listId={list.id} actor={actor} onClose={onClose} onCreated={onCardCreated} />
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Book (phone advice)</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          A call from the surgeon's rooms. Set the list context, then add the patient's card.
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Hospital</FieldLabel>
          <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} style={selectStyle}>
            <option value="">Select a hospital</option>
            {Object.values(hospitals).map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Surgeon</FieldLabel>
          <select value={surgeonId} onChange={(e) => setSurgeonId(e.target.value)} style={selectStyle}>
            <option value="">Not assigned yet</option>
            {Object.values(surgeons).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Start</FieldLabel>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={selectStyle} />
          </label>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>End</FieldLabel>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={selectStyle} />
          </label>
        </div>

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="primary" block onClick={continueToCard}>Continue to add card</Button>
      </div>
    </Overlay>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { ANAE, HOSP, SURG } from '../../../domain/seed'
import { effectiveSlotTimes } from '../../../domain/slots'
import { assignListToSlot, setSlotTimes, useAppStore, type Actor } from '../../../store'
import { Button, FormError } from '../../../shared/ui'
import { AddBookingFlow } from '../../../shared/flows'
import { useSurface } from '../../../shared/surface'
import { NotPreferredWarning, useNotPreferredWarning } from '../components/pairing'
import { AssignListFields, assignDraftError, emptyAssignDraft, type AssignDraft } from './AssignListFields'
import { SessionTimesFields, timesDraftError, timesPatch, type TimesDraft } from './SessionTimesFields'

interface PhoneAdviceBookingProps {
  open: boolean
  /** The free session the call is about. */
  slotId: string
  actor: Actor
  onClose: () => void
  onBooked: (bookingId: string) => void
}

const PHONE_ADVICE_LOOKUP_PREFILL = {
  nhi: 'DEM1239',
  rvgBaseCode: '20950',
  operation: 'Appendicectomy, laparoscopic',
  scheduledTime: '15:00',
  billingRoute: 'hospital',
  insurerId: 'I-NIB',
  billingReference: 'STG-HALE-2107',
} as const

/**
 * Phone-advice booking on a free session ("a call from the surgeon's rooms";
 * catch-up Phase 28 rebuilt it on assignment). Step 1 is Assign List's fields
 * (hospital and surgeon required, US-01.3.3) plus the session's times,
 * prefilled from its effective times (the settings default, or its own).
 * "Continue" assigns the List (`assignListToSlot`, which records Phase 17's
 * acknowledgement for a not-preferred pairing, once), saves the times only if
 * they changed, then opens the shared `AddBookingFlow` on the new List. The
 * session reads as a Private List everywhere from that moment. Abandoning step
 * 2 leaves an assigned List with no Bookings, which the catalogue allows.
 */
export function PhoneAdviceBooking({ open, slotId, actor, onClose, onBooked }: PhoneAdviceBookingProps) {
  const { Overlay } = useSurface()
  const slot = useAppStore((s) => s.schedule.slots[slotId])
  const settings = useAppStore((s) => s.appSettings.schedule)
  // The session's current times (its own, or the settings default) prefill the fields.
  const current = useMemo<TimesDraft | undefined>(() => {
    if (slot === undefined) return undefined
    const t = effectiveSlotTimes(slot, settings)
    return { startTime: t.startTime, endTime: t.endTime }
  }, [slot, settings])

  const [step, setStep] = useState<'context' | 'booking'>('context')
  const [listId, setListId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AssignDraft>(() => emptyAssignDraft())
  const [times, setTimes] = useState<TimesDraft>(current ?? { startTime: '', endTime: '' })
  const [error, setError] = useState<string | null>(null)
  const pairingWarning = useNotPreferredWarning(slot?.anaesthetistId, draft.surgeonId !== '' ? draft.surgeonId : undefined)

  useEffect(() => {
    if (open) {
      setStep('context')
      setListId(null)
      setDraft(emptyAssignDraft())
      setTimes(current ?? { startTime: '', endTime: '' })
      setError(null)
    }
    // Reset only when the flow opens; a later default change must not wipe the form.
  }, [open])

  if (slot === undefined || current === undefined) return null
  const sessionDefaults = settings.defaultTimes[slot.session]

  function continueToBooking() {
    if (slot === undefined || current === undefined) return
    setError(null)
    const invalid = assignDraftError(draft)
    if (invalid !== null) {
      setError(invalid)
      return
    }
    const timesError = timesDraftError(times)
    if (timesError !== null) {
      setError(timesError)
      return
    }
    const assigned = assignListToSlot(useAppStore, actor, slot.id, {
      hospitalId: draft.hospitalId,
      surgeonId: draft.surgeonId,
      kind: draft.kind,
    })
    if (!assigned.ok) {
      setError(assigned.message)
      return
    }
    // Only changed times are saved, as overrides only where they differ from the default.
    if (times.startTime !== current.startTime || times.endTime !== current.endTime) {
      const timed = setSlotTimes(useAppStore, actor, slot.id, timesPatch(times, sessionDefaults))
      if (!timed.ok) setError(timed.message)
    }
    setListId(assigned.value.listId)
    setStep('booking')
  }

  const isScriptedS2Booking =
    slot.anaesthetistId === ANAE.sharma &&
    slot.dateISO === '2026-07-21' &&
    slot.session === 'PM' &&
    draft.hospitalId === HOSP.stg &&
    draft.surgeonId === SURG.hale

  if (step === 'booking' && listId !== null) {
    return (
      <AddBookingFlow
        open={open}
        listId={listId}
        actor={actor}
        manualEmptyLookupPrefill={isScriptedS2Booking ? PHONE_ADVICE_LOOKUP_PREFILL : undefined}
        onClose={onClose}
        onCreated={onBooked}
      />
    )
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-phone-advice" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Book (phone advice)</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          A call from the surgeon's rooms. Assign the List for this session, then add the patient's booking.
        </div>

        <AssignListFields
          anaesthetistId={slot.anaesthetistId}
          dateISO={slot.dateISO}
          draft={draft}
          withNote={false}
          slotId={slot.id}
          subject="Booking"
          onChange={(next) => {
            setDraft(next)
            setError(null)
          }}
        />

        <SessionTimesFields session={slot.session} draft={times} defaults={sessionDefaults} onChange={setTimes} />

        <FormError message={error} />
        {/* Catch-up Phase 17: warn, never block; the acknowledgement lands with the assignment. */}
        <NotPreferredWarning warning={pairingWarning} shot="phone-advice-pairing-warning" />
        <Button variant="primary" block onClick={continueToBooking}>{pairingWarning !== null ? 'Continue anyway' : 'Continue to add booking'}</Button>
      </div>
    </Overlay>
  )
}

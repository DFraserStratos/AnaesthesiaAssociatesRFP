/**
 * The payer sheet (catch-up Phase 21; US-11.2.2, US-11.2.3, US-11.2.4; AR-44
 * `#payer`): a bottom sheet on the phone, a dialog on web and Admin, through
 * `useSurface().Overlay`. Greg's "different payer" tick is the control: clear,
 * the patient pays and their details come from the patient record (an email
 * or address the record lacks can be added for this Booking); ticked, any
 * party who pays, such as a parent, a guardian, a benefactor or a family
 * trust. A billed payer with neither an email nor a postal address is asked
 * for one, and still saves (Review flags it; never a block). No money.
 */

import { useEffect, useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { PostalAddress } from '../../domain/types'
import { anyPayerBilled, cleanPostalAddress, isMinorOn, onlyHoldersBilled, payerHasContact } from '../../domain/billing'
import { formatPostalAddress } from '../../domain/billing/payer'
import { setBookingPayer, useAppStore, type Actor, type PayerInput } from '../../store'
import { Button, FormError, Notice, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { PostalAddressFields, addressDraftOf, type PostalAddressDraft } from './PostalAddressFields'
import { DifferentPayerTick, EMPTY_OTHER_PAYER, OtherPayerFields, otherPayerInput, type OtherPayerDraft } from './PayerFields'

export const PAYER_CONTACT_ASK = 'Add an email or a postal address. A payer needs one to receive the invoice.'
export const CHILD_PAYER_HINT = 'Under 18. Check whether a parent or guardian should be the payer.'

interface PayerSheetProps {
  open: boolean
  bookingId: string
  actor: Actor
  onClose: () => void
}

export function PayerSheet({ open, bookingId, actor, onClose }: PayerSheetProps) {
  const { Overlay, variant } = useSurface()
  const booking = useAppStore((s) => s.schedule.bookings[bookingId])
  const patient = useAppStore((s) => (booking !== undefined ? s.masters.patients[booking.patientId] : undefined))
  const listDate = useAppStore((s) => (booking !== undefined ? s.schedule.lists[booking.listId]?.dateISO : undefined))
  const contracts = useAppStore((s) => s.masters.contracts)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const procedures = useMemo(() => Object.values(proceduresRecord).filter((p) => p.bookingId === bookingId), [proceduresRecord, bookingId])

  const [different, setDifferent] = useState(false)
  const [other, setOther] = useState<OtherPayerDraft>(EMPTY_OTHER_PAYER)
  // The patient's own fill-ins for this Booking, where the record has none.
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState<PostalAddressDraft>(addressDraftOf(undefined))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || booking === undefined) return
    const payer = booking.payer
    setError(null)
    if (payer.kind === 'other') {
      setDifferent(true)
      setOther({
        name: payer.name,
        relationship: payer.relationship ?? '',
        email: payer.email ?? '',
        phone: payer.phone ?? '',
        address: addressDraftOf(payer.postalAddress),
      })
      setEmail('')
      setAddress(addressDraftOf(undefined))
    } else {
      setDifferent(false)
      setOther(EMPTY_OTHER_PAYER)
      setEmail(payer.email ?? '')
      setAddress(addressDraftOf(payer.postalAddress))
    }
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const billed = anyPayerBilled(procedures, contracts)
  // The child hint follows the warning's rule (`childPayerOn`), but also shows while no Contract is chosen yet.
  const isChild = patient !== undefined && listDate !== undefined && isMinorOn(patient.dobISO, listDate) && !onlyHoldersBilled(procedures, contracts)
  const recordEmail = patient?.email !== undefined && patient.email.trim() !== '' ? patient.email : undefined
  const recordAddress: PostalAddress | undefined = patient?.postalAddress

  // The contact the payer would have once saved, for the inline ask.
  const contactAfter = different
    ? { email: other.email, postalAddress: cleanPostalAddress(other.address) }
    : { email: recordEmail ?? email, postalAddress: recordAddress ?? cleanPostalAddress(address) }
  const needsContact = billed && !payerHasContact(contactAfter)

  if (booking === undefined) return null

  function save() {
    setError(null)
    const current = booking?.payer
    const input: PayerInput = different
      ? otherPayerInput(other, current?.kind === 'other' ? current.id : undefined)
      : {
          kind: 'patient',
          ...(recordEmail === undefined ? { email } : {}),
          ...(recordAddress === undefined ? { postalAddress: address } : {}),
        }
    const outcome = setBookingPayer(useAppStore, actor, bookingId, input)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="payer-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: variant === 'web' ? 480 : undefined, maxWidth: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <OverlayHeader title="Payer" description="Invoiced for every procedure whose Contract bills the payer." />
        </div>

        <DifferentPayerTick checked={different} onChange={setDifferent} />

        {!different ? (
          <div data-shot="payer-patient-details" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{patient?.name ?? 'The patient'}</div>
              <div style={{ fontSize: 13, color: neutral.slate }}>{recordEmail ?? 'No email on the patient record'}</div>
              <div style={{ fontSize: 13, color: neutral.slate }}>
                {recordAddress !== undefined ? formatPostalAddress(recordAddress) : 'No postal address on the patient record'}
              </div>
            </div>
            {isChild && (
              <div data-shot="payer-child-hint" style={{ background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, lineHeight: '19px' }}>
                {CHILD_PAYER_HINT}
              </div>
            )}
            {recordEmail === undefined && (
              <TextField label="Email for this Booking" value={email} onChange={setEmail} type="email" hint="Used for this Booking only. The patient record is not changed." />
            )}
            {recordAddress === undefined && <PostalAddressFields value={address} onChange={setAddress} shot="payer-postal-address" />}
          </div>
        ) : (
          <OtherPayerFields draft={other} onChange={setOther} />
        )}

        {needsContact && (
          <Notice tone="warning" live="status" shot="payer-contact-ask">
            {PAYER_CONTACT_ASK}
          </Notice>
        )}
        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={different && other.name.trim() === ''}>
              Save payer
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}

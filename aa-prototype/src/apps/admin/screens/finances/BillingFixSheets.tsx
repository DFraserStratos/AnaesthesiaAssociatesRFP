/**
 * The Billing tab's fix sheets (build plan Phase 60; US-13.3.2 "Fix beside the
 * Booking", D116). Fix the payer edits the billing email and postal address of
 * whoever is billed for a failed Booking, then retries it, in one click (two
 * audited steps, `fixBookingPayer`). Where the payer cannot be edited here (no
 * payer found, or a raised prepayment locks them) it says why and offers Mark
 * resolved only. Mark resolved asks for a short note and stamps who and why on
 * the failure (`markBillingExceptionResolved`).
 */

import { useState } from 'react'
import { fixBookingPayer, markBillingExceptionResolved, payerFixTarget, useAppStore, type Actor, type PayerFixTarget } from '../../../../store'
import { OverlayHeader, SheetActions, useSurface } from '../../../../shared/surface'
import { Button, FormError, Notice, TextArea, TextField } from '../../../../shared/ui'
import { addressDraftOf, PostalAddressFields, type PostalAddressDraft } from '../../../../shared/flows/PostalAddressFields'

const BODY = { display: 'flex', flexDirection: 'column', gap: 14 } as const

/** Why the sheet cannot edit this payer, or undefined when it can. */
function cannotEdit(target: PayerFixTarget | undefined): string | undefined {
  if (target === undefined) return 'No payer could be found for this Booking, so there is nothing to edit here. Mark the failure resolved and say why.'
  if (target.kind === 'payer' && target.locked) return `A prepayment has been raised to ${target.name}, so their details are locked. Mark the failure resolved and say why.`
  return undefined
}

export function FixPayerSheet({
  exceptionId,
  patientName,
  actor,
  onClose,
  onMarkResolved,
}: {
  exceptionId: string
  patientName: string
  actor: Actor
  onClose: () => void
  /** Leave this sheet for Mark resolved (a payer this sheet cannot edit). */
  onMarkResolved: () => void
}) {
  const { Overlay } = useSurface()
  // Read once when the sheet opens: the fields start from what is held, and a save re-reads the payer.
  const [target] = useState(() => payerFixTarget(useAppStore.getState(), exceptionId))
  const blocked = cannotEdit(target)
  const [email, setEmail] = useState(target?.email ?? '')
  const [partyAddress, setPartyAddress] = useState(target?.kind === 'party' ? (target.postalAddress ?? '') : '')
  const [address, setAddress] = useState<PostalAddressDraft>(target !== undefined && target.kind !== 'party' ? addressDraftOf(target.postalAddress) : addressDraftOf(undefined))
  const [error, setError] = useState<string | null>(null)

  function save() {
    if (target === undefined) return
    const outcome = fixBookingPayer(useAppStore, actor, exceptionId, { email, postalAddress: target.kind === 'party' ? partyAddress : address })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="billing-fix-payer-sheet" data-exception-id={exceptionId} style={BODY}>
        <OverlayHeader
          title="Fix the payer"
          description={
            target !== undefined
              ? `${patientName}'s Booking was not invoiced: ${target.name} has no billing email or postal address. Add one, then the Booking is billed again.`
              : `${patientName}'s Booking was not invoiced.`
          }
        />
        {blocked !== undefined ? (
          <>
            <Notice tone="warning" shot="billing-fix-payer-blocked">
              {blocked}
            </Notice>
            <SheetActions
              secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
              primary={<Button variant="primary" size="desktop" block onClick={onMarkResolved} shot="billing-fix-payer-mark-resolved">Mark resolved</Button>}
            />
          </>
        ) : target !== undefined ? (
          <>
            <TextField label="Billing email" type="email" value={email} onChange={setEmail} placeholder="accounts@example.co.nz" autoComplete="off" shot="billing-fix-payer-email" />
            {target.kind === 'party' ? (
              <TextArea label="Postal address" value={partyAddress} onChange={setPartyAddress} rows={3} hint="Used when there is no billing email: the invoice goes to post." shot="billing-fix-payer-address" />
            ) : (
              <PostalAddressFields value={address} onChange={setAddress} shot="billing-fix-payer-address" />
            )}
            <FormError message={error} shot="billing-fix-payer-error" />
            <SheetActions
              secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
              primary={<Button variant="primary" size="desktop" block onClick={save} shot="billing-fix-payer-save">Save and retry</Button>}
            />
          </>
        ) : null}
      </div>
    </Overlay>
  )
}

export function MarkResolvedSheet({ exceptionId, patientName, actor, onClose }: { exceptionId: string; patientName: string; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function resolve() {
    const outcome = markBillingExceptionResolved(useAppStore, actor, exceptionId, note)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="billing-mark-resolved-sheet" data-exception-id={exceptionId} style={BODY}>
        <OverlayHeader title="Mark resolved" description={`Say why ${patientName}'s Booking needs nothing more from this billing run. The note stays with the failure, and the Booking moves to Done.`} />
        <TextField label="Note" value={note} onChange={setNote} placeholder="For example: billed by hand in Xero" maxLength={160} autoFocus shot="billing-mark-resolved-note" />
        <FormError message={error} shot="billing-mark-resolved-error" />
        <SheetActions
          secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
          primary={<Button variant="primary" size="desktop" block onClick={resolve} shot="billing-mark-resolved-confirm">Mark resolved</Button>}
        />
      </div>
    </Overlay>
  )
}

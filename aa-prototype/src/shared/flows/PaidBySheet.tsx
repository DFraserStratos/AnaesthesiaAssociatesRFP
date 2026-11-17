/**
 * The Paid by sheet (catch-up Phase 22a; US-11.2.2, US-11.2.3, US-11.2.4,
 * US-08.2.3; D85, provisional on OQ-140): the one place to see and change who
 * pays for one Procedure. A bottom sheet on the phone, a dialog on web and
 * Admin, through `useSurface().Overlay`; opened by the Paid by line of the
 * Procedure's Billing card: its Change opens who pays (with the offer), its
 * Split opens the split alone (owner, 2026-11-17), titled for what it holds.
 *
 * - **Who pays** (where the Procedure's Contract bills its payer, or a split
 *   share does):
 *   Greg's "different payer" tick. Clear, the patient pays, from the patient
 *   record (an email or address the record lacks can be added here); ticked,
 *   any party who pays. A payer with neither an email nor a postal address is
 *   asked for one and still saves (Review flags it; never a block).
 * - **The offer**: when the payer changes, the Booking's other Procedures
 *   holding the same payer (`payerOfferFor`), each ticked, never forced. The
 *   one provisional label of the phase sits here (OQ-140).
 * - **The split**: 22's split (`SplitFeeSection`), opened by Split.
 *
 * Save writes what the sheet shows through `savePaidBy` (refused as a whole,
 * nothing written); a split's share billed to the old payer follows a new one.
 * No money outside the split.
 */

import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { PostalAddress, Procedure } from '../../domain/types'
import { cleanPostalAddress, isMinorOn, isPayerBilled, payerCounterparty, payerDetails, payerHasContact } from '../../domain/billing'
import { formatPostalAddress } from '../../domain/billing/payer'
import { PAYER_OFFER_PROVISIONAL, payerOfferFor } from '../../domain/billing/procedurePayer'
import { procedureLabel } from '../../domain/billing/procedureStack'
import { PAYER_LOCKED_BY_PREPAYMENT, payerLockedByPrepayment, sameName, savePaidBy, useAppStore, type Actor, type PaidByChange, type PayerInput } from '../../store'
import { Button, FormError, Notice, Pill, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { PostalAddressFields, addressDraftOf, type PostalAddressDraft } from './PostalAddressFields'
import { DifferentPayerTick, EMPTY_OTHER_PAYER, OtherPayerFields, otherPayerInput, type OtherPayerDraft } from './PayerFields'
import { SECTION_HEADING, SplitFeeSection, useSplitDraft } from './SplitFeeSection'

export const PAYER_CONTACT_ASK = 'Add an email or a postal address. A payer needs one to receive the invoice.'
export const CHILD_PAYER_HINT = 'Under 18. Check whether a parent or guardian should be the payer.'

interface PaidBySheetProps {
  open: boolean
  procedureId: string
  actor: Actor
  onClose: () => void
  /** Which part the line's action opened: who pays (Change) or the split (Split: started and scrolled to). */
  focus?: 'payer' | 'split'
}

const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: `1px solid ${neutral.line}` } as const

export function PaidBySheet({ open, procedureId, actor, onClose, focus = 'payer' }: PaidBySheetProps) {
  const { Overlay } = useSurface()
  const procedure = useAppStore((s) => s.schedule.procedures[procedureId])
  const booking = useAppStore((s) => (procedure !== undefined ? s.schedule.bookings[procedure.bookingId] : undefined))
  const patient = useAppStore((s) => (booking !== undefined ? s.masters.patients[booking.patientId] : undefined))
  const listDate = useAppStore((s) => (booking !== undefined ? s.schedule.lists[booking.listId]?.dateISO : undefined))
  const contracts = useAppStore((s) => s.masters.contracts)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const locked = useAppStore((s) => payerLockedByPrepayment(s, procedureId))
  // Re-read the per-payer locks when an invoice is raised (the lock reads invoices).
  useAppStore((s) => s.billing.invoices)
  const procedures = useMemo(
    () => (procedure !== undefined ? Object.values(proceduresRecord).filter((p) => p.bookingId === procedure.bookingId).sort((a, b) => a.id.localeCompare(b.id)) : []),
    [proceduresRecord, procedure],
  )

  const [different, setDifferent] = useState(false)
  const [other, setOther] = useState<OtherPayerDraft>(EMPTY_OTHER_PAYER)
  // The patient's own fill-ins for this Procedure, where the record has none.
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState<PostalAddressDraft>(addressDraftOf(undefined))
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const split = useSplitDraft(procedureId, open, focus === 'split', () => setError(null))

  useEffect(() => {
    if (!open || procedure === undefined) return
    const payer = procedure.payer
    setError(null)
    setUnticked(new Set())
    if (payer.kind === 'other') {
      setDifferent(true)
      setOther({ name: payer.name, relationship: payer.relationship ?? '', email: payer.email ?? '', phone: payer.phone ?? '', address: addressDraftOf(payer.postalAddress) })
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

  if (procedure === undefined || booking === undefined) return null

  const contract = procedure.governingContractId !== undefined ? contracts[procedure.governingContractId] : undefined
  // Who pays shows where the Contract bills the payer, or where a split share bills them (its contact is then asked here too).
  const payerRef = payerCounterparty(procedure, booking.patientId)
  const billsPayer = isPayerBilled(contract) || (procedure.split?.shares.some((s) => s.person === undefined && s.party.kind === payerRef.kind && s.party.id === payerRef.id) ?? false)
  // Change opens who pays (and the offer); Split opens the split alone (owner, 2026-11-17).
  const showWhoPays = focus === 'payer' && billsPayer
  const showSplit = focus === 'split'
  const ordinal = procedures.findIndex((p) => p.id === procedureId) + 1
  const labelOf = (p: Procedure) => procedureLabel(p, rvgGroups, procedures.findIndex((q) => q.id === p.id) + 1)

  const current = procedure.payer
  // A change of payer (not the same person's contact): the offer applies only then.
  const changesPayer = current.kind === 'other' ? !different || !sameName(current.name, other.name) : different
  const offer = showWhoPays && changesPayer ? payerOfferFor(procedures, procedureId, contracts, booking.patientId) : []
  // An offered Procedure covered by its payer's raised prepayment keeps its payer (US-06.3.1 "Payer locked"): shown, never ticked.
  const lockedInOffer = new Set(offer.filter((p) => payerLockedByPrepayment(useAppStore.getState(), p.id)).map((p) => p.id))

  const isChild = !different && patient !== undefined && listDate !== undefined && isMinorOn(patient.dobISO, listDate)
  const recordEmail = patient?.email !== undefined && patient.email.trim() !== '' ? patient.email : undefined
  const recordAddress: PostalAddress | undefined = patient?.postalAddress
  const contactAfter = different
    ? { email: other.email, postalAddress: cleanPostalAddress(other.address) }
    : { email: recordEmail ?? email, postalAddress: recordAddress ?? cleanPostalAddress(address) }
  const needsContact = !payerHasContact(contactAfter)

  function save() {
    if (procedure === undefined) return
    setError(null)
    const change: PaidByChange = {}
    if (showWhoPays) {
      const input: PayerInput = different
        ? otherPayerInput(other, current.kind === 'other' ? current.id : undefined)
        : { kind: 'patient', ...(recordEmail === undefined ? { email } : {}), ...(recordAddress === undefined ? { postalAddress: address } : {}) }
      change.payer = { input, alsoApplyTo: offer.map((p) => p.id).filter((id) => !unticked.has(id) && !lockedInOffer.has(id)) }
    }
    if (showSplit && split.change !== undefined) change.split = split.change
    else if (showSplit && split.blocked) {
      setError(split.problem)
      return
    }
    const outcome = savePaidBy(useAppStore, actor, procedureId, change)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="paid-by-sheet" data-procedure-id={procedureId} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <OverlayHeader title={showSplit ? 'Split the fee' : 'Who pays'} description={procedures.length > 1 ? `Procedure ${ordinal} · ${labelOf(procedure)}` : labelOf(procedure)} />

        {showWhoPays && (
          <section aria-label="Who pays" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {locked && (
              <Notice tone="neutral" shot="payer-locked">
                {PAYER_LOCKED_BY_PREPAYMENT}
              </Notice>
            )}
            <DifferentPayerTick checked={different} onChange={setDifferent} />
            {!different ? (
              <div data-shot="payer-patient-details" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{patient?.name ?? 'The patient'}</div>
                  <div style={{ fontSize: 13, color: neutral.slate }}>{recordEmail ?? 'No email on the patient record'}</div>
                  <div style={{ fontSize: 13, color: neutral.slate }}>{recordAddress !== undefined ? formatPostalAddress(recordAddress) : 'No postal address on the patient record'}</div>
                </div>
                {isChild && (
                  <Notice tone="warning" shot="payer-child-hint">
                    {CHILD_PAYER_HINT}
                  </Notice>
                )}
                {recordEmail === undefined && (
                  <TextField label="Email for this procedure" value={email} onChange={setEmail} type="email" hint="Used to send this procedure's invoice. The patient record is not changed." />
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
          </section>
        )}

        {offer.length > 0 && (
          <section data-shot="payer-offer" aria-label="Change the payer on other procedures too" style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={SECTION_HEADING}>Also change</h3>
              <Pill tone="neutral" shot="payer-offer-provisional" title="A payer on each procedure, with the change offered to the others, is provisional until AA confirms it (OQ-140).">
                {PAYER_OFFER_PROVISIONAL}
              </Pill>
            </div>
            <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>These procedures have the same payer now. Untick any that should keep it.</span>
            <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}>
              {offer.map((p, i) => {
                const held = lockedInOffer.has(p.id)
                const ticked = !held && !unticked.has(p.id)
                return (
                  <label
                    key={p.id}
                    data-shot="payer-offer-row"
                    data-procedure-id={p.id}
                    data-locked={held ? 'true' : undefined}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minHeight: 44, padding: '10px 12px', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, cursor: held ? 'default' : 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={ticked}
                      disabled={held}
                      onChange={(e) => {
                        const next = new Set(unticked)
                        if (e.target.checked) next.delete(p.id)
                        else next.add(p.id)
                        setUnticked(next)
                      }}
                      style={{ width: 20, height: 20, margin: '1px 0 0', accentColor: accent.base, flex: 'none', cursor: held ? 'default' : 'pointer' }}
                    />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: held ? neutral.slate : neutral.ink }}>{`Procedure ${procedures.findIndex((q) => q.id === p.id) + 1} · ${labelOf(p)}`}</span>
                      <span style={{ fontSize: 12.5, color: neutral.slate }}>
                        {held ? `Keeps ${payerDetails(p.payer, patient).name}: a prepayment invoice has been raised to them for it` : `Paid by ${payerDetails(p.payer, patient).name} now`}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        )}

        {showSplit && <SplitFeeSection draft={split} heading={false} />}

        {/* The split's own problem shows once, in its section; any other refusal here. */}
        <FormError message={error !== null && !(showSplit && split.showsProblem && error === split.problem) ? error : null} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={showWhoPays && different && other.name.trim() === ''} shot="paid-by-save">
              Save
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}

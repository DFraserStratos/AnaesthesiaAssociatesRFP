import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { BookingSource, RailAnswers } from '../../domain/types'
import { railAnswersFor, railAnswersText } from '../../domain/billing/contractRail'
import { lookupNhi } from '../../domain/nzhis'
import { createBooking, railActorOf, railContextForList, useAppStore, type Actor } from '../../store'
import { ContractRail, type ContractRailPick } from './ContractRail'
import { DemoBadge } from '../DemoBadge'
import { CodePickerSheet } from '../capture/CodePickerSheet'
import { baseUnitsShort } from '../../domain/billing/rvgGroups'
import { Button, TextField, FieldLabel } from '../ui'

/** Fields a photo extraction may pre-fill. */
export interface ExtractionFields {
  nhi?: string
  name?: string
  dobISO?: string
  phone?: string
  ethnicityCode?: string
  operation?: string
  /** The optional RVG code: an RVG group row by id (catch-up Phase 19). */
  rvgGroupId?: string
  scheduledTime?: string
  billingReference?: string
}

interface ManualBookingFormProps {
  listId: string
  actor: Actor
  initial?: ExtractionFields
  emptyLookupPrefill?: ExtractionFields & { nhi: string }
  attachment?: { name: string; kind: 'photo' | 'pdf' | 'other'; dataUrl?: string }
  /** How this Booking entered the system (display-only, DM-39); the add flow passes it. */
  source?: BookingSource
  onSaved: (result: { bookingId: string; reused: boolean }) => void
}

type LookupState =
  | { kind: 'idle' }
  | { kind: 'hit'; name: string; fullBooking: boolean }
  | { kind: 'miss' }

/** Saved with no Contract: it waits on the office's list (US-04.3.4, catch-up Phase 20). */
export const SAVED_WITHOUT_CONTRACT = 'Saved without a Contract, this Booking waits on Needs an invoice destination.'

export function ManualBookingForm({ listId, actor, initial, emptyLookupPrefill, attachment, source, onSaved }: ManualBookingFormProps) {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const masters = useAppStore((s) => s.masters)
  const list = useAppStore((s) => s.schedule.lists[listId])
  const railContext = useMemo(() => (list !== undefined ? railContextForList({ masters }, list) : undefined), [masters, list])
  const billableParties = masters.billableParties

  const [nhi, setNhi] = useState(initial?.nhi ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [dob, setDob] = useState(initial?.dobISO ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [ethnicityCode, setEthnicityCode] = useState(initial?.ethnicityCode ?? '')
  const [operation, setOperation] = useState(initial?.operation ?? '')
  const [rvgGroupId, setRvgGroupId] = useState(initial?.rvgGroupId ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(initial?.scheduledTime ?? '')
  // The Contract, never preselected (US-04.3.4): chosen on the step rail, or left for the office's list.
  const [pick, setPick] = useState<ContractRailPick | undefined>(undefined)
  const [answers, setAnswers] = useState<RailAnswers | undefined>(undefined)
  const [railOpen, setRailOpen] = useState(false)
  const [billablePartyId, setBillablePartyId] = useState('')
  const [billingReference, setBillingReference] = useState(initial?.billingReference ?? '')

  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' })
  const [error, setError] = useState<string | null>(null)

  const rvgGroup = rvgGroupId !== '' ? rvgGroups[rvgGroupId] : undefined
  const pickedContract = pick !== undefined ? masters.contracts[pick.contractId] : undefined

  function runLookup() {
    const useEmptyPrefill = nhi.trim() === '' && emptyLookupPrefill !== undefined
    const lookupValue = useEmptyPrefill ? emptyLookupPrefill.nhi : nhi
    const result = lookupNhi(lookupValue)
    if (result.found) {
      setNhi(lookupValue)
      setName(result.name)
      setDob(result.dobISO)
      if (result.phone !== undefined) setPhone(result.phone)
      setEthnicityCode(result.ethnicityCode)
      if (useEmptyPrefill) {
        if (emptyLookupPrefill.operation !== undefined) setOperation(emptyLookupPrefill.operation)
        if (emptyLookupPrefill.rvgGroupId !== undefined) setRvgGroupId(emptyLookupPrefill.rvgGroupId)
        if (emptyLookupPrefill.scheduledTime !== undefined) setScheduledTime(emptyLookupPrefill.scheduledTime)
        if (emptyLookupPrefill.billingReference !== undefined) setBillingReference(emptyLookupPrefill.billingReference)
      }
      setLookup({ kind: 'hit', name: result.name, fullBooking: useEmptyPrefill })
    } else {
      setLookup({ kind: 'miss' })
    }
  }

  /** Pick (or clear) the optional RVG code; typed Operation text is never overwritten, only an empty one filled. */
  function pickCode(id: string | null) {
    setPickerOpen(false)
    setRvgGroupId(id ?? '')
    const group = id !== null ? rvgGroups[id] : undefined
    if (group !== undefined && operation.trim() === '') setOperation(group.description)
  }

  function save() {
    setError(null)
    const outcome = createBooking(useAppStore, actor, listId, {
      patient: {
        ...(nhi.trim() !== '' ? { nhi: nhi.trim() } : {}),
        name: name.trim(),
        dobISO: dob,
        ...(phone.trim() !== '' ? { phone: phone.trim() } : {}),
        ...(ethnicityCode.trim() !== '' ? { ethnicityCode: ethnicityCode.trim() } : {}),
      },
      operation,
      ...(rvgGroupId !== '' ? { rvgGroupId } : {}),
      ...(scheduledTime.trim() !== '' ? { scheduledTime: scheduledTime.trim() } : {}),
      ...(pick !== undefined ? { governingContractId: pick.contractId } : {}),
      ...(pick?.enteredPrice !== undefined ? { enteredPrice: pick.enteredPrice } : {}),
      ...(pick === undefined && answers !== undefined ? { railAnswers: answers } : {}),
      ...(billablePartyId !== '' ? { billablePartyId } : {}),
      ...(billingReference.trim() !== '' ? { billingReference: billingReference.trim() } : {}),
      ...(attachment !== undefined ? { attachment } : {}),
      ...(source !== undefined ? { source } : {}),
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    // Was the patient reused? Detect via the just-written audit action.
    const lastPatientAudit = [...useAppStore.getState().audit].reverse().find((a) => a.entityType === 'patient')
    onSaved({ bookingId: outcome.value.bookingId, reused: lastPatientAudit?.action === 'patient.reuse' })
  }

  const canSave = name.trim() !== '' && dob !== '' && operation.trim() !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 17, fontWeight: 700 }}>Patient</div>

      {/* NHI + Look up NHI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextField label="NHI" value={nhi} onChange={(v) => { setNhi(v); setLookup({ kind: 'idle' }) }} placeholder="ABC1234" mono />
          </div>
          <Button variant="secondary" onClick={runLookup} disabled={nhi.trim() === '' && emptyLookupPrefill === undefined} style={{ minHeight: 48 }}>
            <Search size={16} strokeWidth={2.2} aria-hidden /> Look up
          </Button>
        </div>
        <DemoBadge label="NHI FHIR lookup · Digital Services Hub" />
        {lookup.kind === 'hit' && (
          <div style={{ fontSize: 13, color: semantic.success.onTint }}>
            Found {lookup.name}. {lookup.fullBooking ? 'Patient and booking details' : 'Patient details'} pre-filled, still editable.
          </div>
        )}
        {lookup.kind === 'miss' && (
          <div style={{ fontSize: 13, color: neutral.slate }}>
            Not found in this demo's records. Enter the details manually.
          </div>
        )}
      </div>

      <TextField label="Name" value={name} onChange={setName} placeholder="Patient name" />
      <TextField label="Date of birth" value={dob} onChange={setDob} type="date" />
      <TextField label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="Optional" />

      <div style={{ height: 1, background: neutral.line }} />
      <div style={{ fontSize: 17, fontWeight: 700 }}>Operation</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-shot="manual-rvg-code">
        <FieldLabel>RVG code (optional)</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={rvgGroup !== undefined ? `RVG code ${rvgGroup.code}, ${rvgGroup.description}. Change` : rvgGroupId !== '' ? 'RVG code no longer listed. Change' : 'Choose an RVG code'}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              minHeight: 48,
              boxSizing: 'border-box',
              borderRadius: radius.ctl,
              border: `1px solid ${neutral.line}`,
              background: neutral.bg,
              padding: '8px 12px',
              fontFamily: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {rvgGroup !== undefined ? (
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: accent.base }}>{rvgGroup.code}</span>
                  <span className="mono" style={{ fontSize: 12, color: neutral.slate, whiteSpace: 'nowrap' }}>{baseUnitsShort(rvgGroup)}</span>
                </span>
                <span style={{ fontSize: 14.5, color: neutral.ink, lineHeight: 1.35 }}>{rvgGroup.description}</span>
              </span>
            ) : (
              <span style={{ fontSize: 15, color: neutral.mist }}>
                {rvgGroupId !== '' ? 'This RVG code is no longer in the RVG groups' : 'No RVG code'}
              </span>
            )}
            <span aria-hidden style={{ fontSize: 14, fontWeight: 600, color: accent.base, flex: 'none' }}>
              {rvgGroupId !== '' ? 'Change' : 'Choose'}
            </span>
          </button>
          {rvgGroupId !== '' && (
            <button
              type="button"
              onClick={() => pickCode(null)}
              style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: accent.base, cursor: 'pointer', padding: '8px 4px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <CodePickerSheet
        open={pickerOpen}
        {...(rvgGroupId !== '' ? { currentId: rvgGroupId } : {})}
        rvgGroups={rvgGroups}
        onPick={pickCode}
        onClose={() => setPickerOpen(false)}
      />
      <TextField label="Operation" value={operation} onChange={setOperation} placeholder="Operation description" />
      <TextField label="Scheduled time" value={scheduledTime} onChange={setScheduledTime} placeholder="e.g. 15:30" mono />

      <div style={{ height: 1, background: neutral.line }} />
      <div style={{ fontSize: 17, fontWeight: 700 }}>Contract</div>
      <div
        data-shot="manual-contract"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '8px 12px' }}
      >
        {pickedContract !== undefined ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink }}>{pickedContract.name}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>
              {pickedContract.aaCode}
              {pick?.enteredPrice !== undefined ? ` · $${pick.enteredPrice.toFixed(2)}` : ''}
            </span>
          </span>
        ) : (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, color: neutral.mist }}>Not chosen</span>
            {answers !== undefined && railContext !== undefined && (
              <span style={{ fontSize: 12.5, color: neutral.slate }}>So far: {railAnswersText(masters, railContext, answers)}</span>
            )}
          </span>
        )}
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          disabled={railContext === undefined}
          style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: accent.base, cursor: 'pointer', padding: '8px 4px', flex: 'none' }}
        >
          {pick !== undefined ? 'Change' : 'Choose'}
        </button>
      </div>
      {pick === undefined && <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: -8 }}>{SAVED_WITHOUT_CONTRACT}</div>}
      {railContext !== undefined && (
        <ContractRail
          open={railOpen}
          actor={railActorOf(actor)}
          context={railContext}
          start={pick !== undefined ? railAnswersFor(masters, pick.contractId) : answers}
          {...(pick !== undefined ? { currentContractId: pick.contractId } : {})}
          {...(pick?.enteredPrice !== undefined ? { currentEnteredPrice: pick.enteredPrice } : {})}
          onDone={(next) => {
            setPick(next)
            setAnswers(undefined)
            return null
          }}
          onLeave={setAnswers}
          onClose={() => setRailOpen(false)}
        />
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Payer (defaults to the patient)</FieldLabel>
        <select
          value={billablePartyId}
          onChange={(e) => setBillablePartyId(e.target.value)}
          style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 15 }}
        >
          <option value="">The patient pays</option>
          {Object.values(billableParties).map((b) => (
            <option key={b.hiddenInternalId} value={b.hiddenInternalId}>
              {b.name} ({b.relationshipToPatient})
            </option>
          ))}
        </select>
      </label>

      <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract or approval reference" />

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
          {error}
        </div>
      )}

      <Button variant="primary" block onClick={save} disabled={!canSave} style={{ marginTop: 4 }}>
        Save booking
      </Button>
      {!canSave && (
        <div style={{ fontSize: 12, color: neutral.mist, textAlign: 'center', marginTop: -8 }}>
          Name, date of birth and operation are required.
        </div>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

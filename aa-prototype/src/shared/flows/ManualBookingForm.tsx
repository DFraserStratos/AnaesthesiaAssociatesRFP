import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { BillingRoute, BookingSource, PatientPaymentCategory } from '../../domain/types'
import { insurerPartyOptions } from '../../domain/billing/parties'
import { lookupNhi } from '../../domain/nzhis'
import { createBooking, useAppStore, type Actor } from '../../store'
import { DemoBadge } from '../DemoBadge'
import { CodePickerSheet } from '../capture/CodePickerSheet'
import { baseUnitsShort } from '../../domain/billing/rvgGroups'
import { Button, Segmented, TextField, FieldLabel } from '../ui'

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
  billingRoute?: BillingRoute
  insurerId?: string
  patientPaymentCategory?: PatientPaymentCategory
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

const ROUTE_OPTIONS: { value: BillingRoute; label: string }[] = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'billableParty', label: 'Billable party' },
  { value: 'insurer', label: 'Insurer' },
]

const CATEGORY_OPTIONS: { value: PatientPaymentCategory; label: string }[] = [
  { value: 'selfFundedPostProcedure', label: 'Self-funded' },
  { value: 'selfFundedPrepayment', label: 'Pre-payment' },
  { value: 'insuredReimbursement', label: 'Reimbursement' },
]

export function ManualBookingForm({ listId, actor, initial, emptyLookupPrefill, attachment, source, onSaved }: ManualBookingFormProps) {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const parties = useAppStore((s) => s.masters.parties)
  const insurerOptions = useMemo(() => insurerPartyOptions(parties), [parties])
  const billableParties = useAppStore((s) => s.masters.billableParties)

  const [nhi, setNhi] = useState(initial?.nhi ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [dob, setDob] = useState(initial?.dobISO ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [ethnicityCode, setEthnicityCode] = useState(initial?.ethnicityCode ?? '')
  const [operation, setOperation] = useState(initial?.operation ?? '')
  const [rvgGroupId, setRvgGroupId] = useState(initial?.rvgGroupId ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(initial?.scheduledTime ?? '')
  const [billingRoute, setBillingRoute] = useState<BillingRoute>(initial?.billingRoute ?? 'hospital')
  const [insurerId, setInsurerId] = useState(initial?.insurerId ?? '')
  const [billablePartyId, setBillablePartyId] = useState('')
  const [category, setCategory] = useState<PatientPaymentCategory>(initial?.patientPaymentCategory ?? 'selfFundedPostProcedure')
  const [billingReference, setBillingReference] = useState(initial?.billingReference ?? '')

  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' })
  const [error, setError] = useState<string | null>(null)

  const rvgGroup = rvgGroupId !== '' ? rvgGroups[rvgGroupId] : undefined

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
        if (emptyLookupPrefill.billingRoute !== undefined) setBillingRoute(emptyLookupPrefill.billingRoute)
        if (emptyLookupPrefill.insurerId !== undefined) setInsurerId(emptyLookupPrefill.insurerId)
        if (emptyLookupPrefill.patientPaymentCategory !== undefined) setCategory(emptyLookupPrefill.patientPaymentCategory)
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
      billingRoute,
      ...((billingRoute === 'insurer' || billingRoute === 'hospital') && insurerId !== '' ? { insurerId } : {}),
      ...(billingRoute === 'billableParty' && billablePartyId !== '' ? { billablePartyId } : {}),
      ...(billingRoute === 'billableParty' ? { patientPaymentCategory: category } : {}),
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
      <div style={{ fontSize: 17, fontWeight: 700 }}>Billing route</div>
      <div style={{ fontSize: 13, color: neutral.slate, marginTop: -8 }}>
        Set explicitly on the hospital's or surgeon's advice. The office can correct it later.
      </div>
      <Segmented value={billingRoute} options={ROUTE_OPTIONS} onChange={setBillingRoute} />

      {(billingRoute === 'insurer' || billingRoute === 'hospital') && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{billingRoute === 'insurer' ? 'Insurer' : 'Insurer (optional)'}</FieldLabel>
          <select
            value={insurerId}
            onChange={(e) => setInsurerId(e.target.value)}
            style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 15 }}
          >
            <option value="">Select an insurer</option>
            {insurerOptions.map(({ insurerId: id, party }) => (
              <option key={id} value={id}>
                {party.name}
              </option>
            ))}
          </select>
          {billingRoute === 'hospital' && (
            <span style={{ fontSize: 13, color: neutral.slate }}>
              Informational only: records the patient's insurer for office reference. The hospital is still invoiced.
            </span>
          )}
        </label>
      )}

      {billingRoute === 'billableParty' && (
        <>
          <Segmented label="Payment category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Billable party (defaults to the patient)</FieldLabel>
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
        </>
      )}

      {billingRoute === 'hospital' && (
        <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract / approval ref" />
      )}

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

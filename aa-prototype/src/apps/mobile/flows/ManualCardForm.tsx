import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { BillingRoute, PatientPaymentCategory } from '../../../domain/types'
import { lookupNhi } from '../../../domain/nzhis'
import { createCard, useAppStore, type Actor } from '../../../store'
import { DemoBadge } from '../../../shared'
import { MobileButton, Segmented, TextField, FieldLabel } from '../components'

/** Fields a photo extraction may pre-fill. */
export interface ExtractionFields {
  nhi?: string
  name?: string
  dobISO?: string
  ethnicityCode?: string
  operation?: string
  rvgBaseCode?: string
  scheduledTime?: string
  billingRoute?: BillingRoute
  insurerId?: string
  patientPaymentCategory?: PatientPaymentCategory
}

interface ManualCardFormProps {
  listId: string
  actor: Actor
  initial?: ExtractionFields
  attachment?: { name: string; kind: 'photo' | 'pdf' | 'other'; dataUrl?: string }
  onSaved: (result: { cardId: string; reused: boolean }) => void
}

type LookupState =
  | { kind: 'idle' }
  | { kind: 'hit'; name: string }
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

export function ManualCardForm({ listId, actor, initial, attachment, onSaved }: ManualCardFormProps) {
  const rvgCodes = useAppStore((s) => s.masters.rvgCodes)
  const insurers = useAppStore((s) => s.masters.insurers)
  const billableParties = useAppStore((s) => s.masters.billableParties)

  const [nhi, setNhi] = useState(initial?.nhi ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [dob, setDob] = useState(initial?.dobISO ?? '')
  const [phone, setPhone] = useState('')
  const [ethnicityCode, setEthnicityCode] = useState(initial?.ethnicityCode ?? '')
  const [operation, setOperation] = useState(initial?.operation ?? '')
  const [rvgBaseCode, setRvgBaseCode] = useState(initial?.rvgBaseCode ?? '')
  const [scheduledTime, setScheduledTime] = useState(initial?.scheduledTime ?? '')
  const [billingRoute, setBillingRoute] = useState<BillingRoute>(initial?.billingRoute ?? 'hospital')
  const [insurerId, setInsurerId] = useState(initial?.insurerId ?? '')
  const [billablePartyId, setBillablePartyId] = useState('')
  const [category, setCategory] = useState<PatientPaymentCategory>(initial?.patientPaymentCategory ?? 'selfFundedPostProcedure')
  const [billingReference, setBillingReference] = useState('')

  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' })
  const [error, setError] = useState<string | null>(null)

  const rvgList = useMemo(() => Object.values(rvgCodes).sort((a, b) => a.description.localeCompare(b.description)), [rvgCodes])

  function runLookup() {
    const result = lookupNhi(nhi)
    if (result.found) {
      setName(result.name)
      setDob(result.dobISO)
      setEthnicityCode(result.ethnicityCode)
      setLookup({ kind: 'hit', name: result.name })
    } else {
      setLookup({ kind: 'miss' })
    }
  }

  function pickCode(code: string) {
    setRvgBaseCode(code)
    const rvg = rvgCodes[code]
    if (rvg !== undefined && operation.trim() === '') setOperation(rvg.description)
  }

  function save() {
    setError(null)
    const outcome = createCard(useAppStore, actor, listId, {
      patient: {
        ...(nhi.trim() !== '' ? { nhi: nhi.trim() } : {}),
        name: name.trim(),
        dobISO: dob,
        ...(phone.trim() !== '' ? { phone: phone.trim() } : {}),
        ...(ethnicityCode.trim() !== '' ? { ethnicityCode: ethnicityCode.trim() } : {}),
      },
      operation,
      ...(rvgBaseCode !== '' ? { rvgBaseCode } : {}),
      ...(scheduledTime.trim() !== '' ? { scheduledTime: scheduledTime.trim() } : {}),
      billingRoute,
      ...(billingRoute === 'insurer' && insurerId !== '' ? { insurerId } : {}),
      ...(billingRoute === 'billableParty' && billablePartyId !== '' ? { billablePartyId } : {}),
      ...(billingRoute === 'billableParty' ? { patientPaymentCategory: category } : {}),
      ...(billingReference.trim() !== '' ? { billingReference: billingReference.trim() } : {}),
      ...(attachment !== undefined ? { attachment } : {}),
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    // Was the patient reused? Detect via the just-written audit action.
    const lastPatientAudit = [...useAppStore.getState().audit].reverse().find((a) => a.entityType === 'patient')
    onSaved({ cardId: outcome.value.cardId, reused: lastPatientAudit?.action === 'patient.reuse' })
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
          <MobileButton variant="secondary" onClick={runLookup} disabled={nhi.trim() === ''} style={{ minHeight: 48 }}>
            <Search size={16} strokeWidth={2.2} aria-hidden /> Look up
          </MobileButton>
        </div>
        <DemoBadge label="NHI FHIR lookup · Digital Services Hub" />
        {lookup.kind === 'hit' && (
          <div style={{ fontSize: 13, color: semantic.success.onTint }}>
            Found {lookup.name}. Details pre-filled, still editable.
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

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Procedure code</FieldLabel>
        <select
          value={rvgBaseCode}
          onChange={(e) => pickCode(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            minHeight: 48,
            borderRadius: radius.ctl,
            border: `1px solid ${neutral.line}`,
            background: neutral.bg,
            padding: '0 12px',
            fontFamily: 'inherit',
            fontSize: 15,
            color: neutral.ink,
          }}
        >
          <option value="">Select a code (optional)</option>
          {rvgList.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} · {r.description}
            </option>
          ))}
        </select>
      </label>
      <TextField label="Operation" value={operation} onChange={setOperation} placeholder="Operation description" />
      <TextField label="Scheduled time" value={scheduledTime} onChange={setScheduledTime} placeholder="e.g. 15:30" mono />

      <div style={{ height: 1, background: neutral.line }} />
      <div style={{ fontSize: 17, fontWeight: 700 }}>Billing route</div>
      <div style={{ fontSize: 13, color: neutral.slate, marginTop: -8 }}>
        Set explicitly on the hospital's or surgeon's advice. The office can correct it later.
      </div>
      <Segmented value={billingRoute} options={ROUTE_OPTIONS} onChange={setBillingRoute} />

      {billingRoute === 'insurer' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Insurer</FieldLabel>
          <select
            value={insurerId}
            onChange={(e) => setInsurerId(e.target.value)}
            style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 15 }}
          >
            <option value="">Select an insurer</option>
            {Object.values(insurers).map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.acceptsDirectClaims ? ' (direct claims)' : ''}
              </option>
            ))}
          </select>
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

      <MobileButton variant="primary" block onClick={save} disabled={!canSave} style={{ marginTop: 4 }}>
        Save card
      </MobileButton>
      {!canSave && (
        <div style={{ fontSize: 12, color: neutral.mist, textAlign: 'center', marginTop: -8 }}>
          Name, date of birth and operation are required.
        </div>
      )}
      <div style={{ height: 8 }} />
      <div style={{ fontSize: 12, color: accent.pressed, textAlign: 'center' }}>
        Billing detail (BTM) is captured later, in Phase 04.
      </div>
    </div>
  )
}

/**
 * Add or edit a Party (catch-up Phase 18; US-04.1.5) in Master data's wide side
 * panel. The store is the rule source: every refusal shows `partyRefusal`'s
 * own sentence. The Anaesthesia Associates Party opens read-only. There is no
 * delete, and saving a Party creates no Contract.
 */

import { isOfficeContract } from '../../../domain/billing/fallbacks'
import { useMemo, useState } from 'react'
import type { DeliveryMethod, Party, PartyKind } from '../../../domain/types'
import { CREATABLE_PARTY_KINDS, PARTY_REFUSAL_MESSAGES, suggestCodePrefix } from '../../../domain/billing/parties'
import { createParty, editParty, partyContractFacts, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, FormError, Segmented, TextField } from '../../../shared'
import { DELIVERY_LABEL, PARTY_KIND_LABEL } from '../../../shared/contracts'
import { neutral } from '../../../theme/tokens'
import { MasterPanel, PanelGrid, PanelSection } from '../components/MasterPanel'
import { Pill } from '../components/MasterPills'
import { selectControlStyle as selectStyle } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  /** Present: edit; absent: add. */
  party?: Party
  onClose: () => void
}

type DeliveryChoice = DeliveryMethod | 'none'

export function PartyPanel({ open, actor, party, onClose }: Props) {
  const masters = useAppStore((s) => s.masters)
  const editing = party !== undefined
  const readOnly = party?.kind === 'aa'
  const facts = useMemo(
    () => (party === undefined ? { holdsContracts: false, billedByAContract: false } : partyContractFacts({ masters }, party.id)),
    [party, masters],
  )

  // The panel mounts afresh for each Party it opens, so its fields start from it.
  const [kind, setKind] = useState<Exclude<PartyKind, 'aa'>>(party === undefined || party.kind === 'aa' ? 'insurer' : party.kind)
  const [name, setName] = useState(party?.name ?? '')
  const [codePrefix, setCodePrefix] = useState(party?.codePrefix ?? '')
  const [prefixTouched, setPrefixTouched] = useState(party !== undefined)
  const [hospitalId, setHospitalId] = useState(party?.hospitalId ?? '')
  const [billingName, setBillingName] = useState(party?.billingName ?? '')
  const [email, setEmail] = useState(party?.email ?? '')
  const [postalAddress, setPostalAddress] = useState(party?.postalAddress ?? '')
  const [delivery, setDelivery] = useState<DeliveryChoice>(party?.deliveryMethod ?? 'none')
  const [error, setError] = useState<string | null>(null)

  // The store's rule (partyRefusal): the kind is fixed while it holds Contracts or stands behind Bookings.
  const kindFixed = editing && (facts.holdsContracts || party?.billingIdentity !== undefined)

  const takenPrefixes = useMemo(
    () => new Set(Object.values(masters.parties).filter((p) => p.id !== party?.id).map((p) => p.codePrefix)),
    [masters.parties, party],
  )
  // A new Party's prefix follows its name until the office types one.
  const shownPrefix = !editing && !prefixTouched ? (name.trim() === '' ? '' : suggestCodePrefix(name, takenPrefixes)) : codePrefix

  const hospitalOptions = useMemo(
    () => Object.values(masters.hospitals).filter((h) => h.locationType === 'hospital').sort((a, b) => a.name.localeCompare(b.name)),
    [masters.hospitals],
  )
  const heldCount = useMemo(
    () => (party === undefined ? 0 : Object.values(masters.contracts).filter((c) => c.holderId === party.id && isOfficeContract(c)).length),
    [party, masters.contracts],
  )

  function save() {
    const fields = {
      kind,
      name,
      codePrefix: shownPrefix,
      billingName,
      email,
      postalAddress,
      ...(delivery !== 'none' ? { deliveryMethod: delivery } : {}),
      ...(kind === 'hospital' ? { hospitalId } : {}),
    }
    const outcome = party === undefined ? createParty(useAppStore, actor, fields) : editParty(useAppStore, actor, party.id, fields)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  const title = editing ? party.name : 'New Party'
  const meta = editing ? (
    <>
      <Pill>{PARTY_KIND_LABEL[party.kind]}</Pill>
      <span>
        Holds {heldCount} {heldCount === 1 ? 'Contract' : 'Contracts'}
        {facts.billedByAContract ? ', billed by at least one' : ''}
      </span>
    </>
  ) : undefined

  return (
    <MasterPanel
      open={open}
      onClose={onClose}
      title={title}
      meta={meta}
      shot="party-panel"
      footer={
        readOnly ? (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editing ? 'Save Party' : 'Add Party'}</Button>
          </>
        )
      }
    >
      {readOnly ? (
        <ReadOnlyAa party={party} />
      ) : (
        <>
          <PanelSection title="Who it is">
            <TextField label="Name" value={name} onChange={setName} hint="The short name lists and the Contract picker show." />
            <PanelGrid>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel>Kind</FieldLabel>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as Exclude<PartyKind, 'aa'>)}
                  disabled={kindFixed}
                  style={selectStyle}
                >
                  {CREATABLE_PARTY_KINDS.map((k) => (
                    <option key={k} value={k}>{PARTY_KIND_LABEL[k]}</option>
                  ))}
                </select>
              </label>
              <TextField
                label="Code prefix"
                value={shownPrefix}
                onChange={(v) => {
                  setPrefixTouched(true)
                  setCodePrefix(v.toUpperCase())
                }}
                mono
                hint="Starts each of its Contracts' AA codes."
              />
            </PanelGrid>
            {kindFixed && (
              <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: -6 }}>{PARTY_REFUSAL_MESSAGES.kindFixedWhileHolding}</div>
            )}
            {kind === 'hospital' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel>Hospital</FieldLabel>
                <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} disabled={editing && facts.holdsContracts} style={selectStyle}>
                  <option value="">Select its hospital</option>
                  {hospitalOptions.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </label>
            )}
          </PanelSection>

          <PanelSection title="Billing">
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: -6 }}>
              {facts.billedByAContract
                ? 'A Contract bills this Party, so it needs a billing name and a delivery method.'
                : 'Needed once a Contract bills this Party.'}
            </div>
            <TextField label="Billing name" value={billingName} onChange={setBillingName} hint="Printed on its invoices." />
            <Segmented
              label="Invoices delivered by"
              value={delivery}
              options={[
                { value: 'none', label: 'Not set' },
                { value: 'email', label: DELIVERY_LABEL.email },
                { value: 'post', label: DELIVERY_LABEL.post },
              ]}
              onChange={setDelivery}
            />
            <PanelGrid>
              <TextField label="Email" value={email} onChange={setEmail} type="email" />
              <TextField label="Postal address" value={postalAddress} onChange={setPostalAddress} />
            </PanelGrid>
          </PanelSection>

          <FormError message={error} />
        </>
      )}
    </MasterPanel>
  )
}

function ReadOnlyAa({ party }: { party: Party | undefined }) {
  if (party === undefined) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
      <div style={{ color: neutral.slate }}>
        Anaesthesia Associates holds No contract · RVG. It is never billed, and its record cannot be changed.
      </div>
      <div>
        <span style={{ color: neutral.mist, fontSize: 12, marginRight: 10 }}>Code prefix</span>
        <span className="mono">{party.codePrefix}</span>
      </div>
    </div>
  )
}

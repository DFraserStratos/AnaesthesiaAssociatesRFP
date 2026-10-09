/**
 * Record a pairing preference from either profile (catch-up Phase 17;
 * US-13.6.3, US-13.6.4 "Record a pairing, either direction"). The kind, which
 * side asked, the counterpart and an optional reason. A counterpart that
 * already has an active entry on the chosen side is disabled with the reason
 * (the store refuses a same-side duplicate or contradiction); the other side
 * stays open, so both sides of one pair can be active.
 */

import { useId, useState } from 'react'
import { PAIRING_LABELS, activeEntryOnSide, pairingSentence } from '../../../../domain/pairingPreferences'
import { compareBySurname } from '../../../../domain/surgeons'
import type { PairingKind, PairingSide } from '../../../../domain/types'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import { useAppStore, type Actor } from '../../../../store'
import { addPairingPreference } from '../../../../store/officePrivate'
import { Button, FieldLabel, TextField, useSurface, FormError } from '../../../../shared'
import { selectControlStyle } from '../../flows/fieldChrome'
import type { PairingPerspective } from './perspective'
import { usePairingEntries } from './useOfficePairings'

interface Props {
  perspective: PairingPerspective
  subjectId: string
  actor: Actor
  onClose: () => void
}

export function PairingAddSheet({ perspective, subjectId, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const entries = usePairingEntries()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const ownSide: PairingSide = perspective === 'surgeon' ? 'SURGEON' : 'ANAESTHETIST'
  const otherSide: PairingSide = ownSide === 'SURGEON' ? 'ANAESTHETIST' : 'SURGEON'
  const [kind, setKind] = useState<PairingKind>('NOT_PREFERRED')
  const [side, setSide] = useState<PairingSide>(ownSide)
  const [counterpartId, setCounterpartId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const takenHintId = useId()

  const subjectName = perspective === 'surgeon' ? (surgeons[subjectId]?.name ?? subjectId) : (anaesthetists[subjectId]?.name ?? subjectId)
  const pairOf = (otherId: string) =>
    perspective === 'surgeon' ? { anaesthetistId: otherId, surgeonId: subjectId } : { anaesthetistId: subjectId, surgeonId: otherId }

  const counterparts = (
    perspective === 'surgeon'
      ? Object.values(anaesthetists).filter((a) => a.active).map((a) => ({ id: a.registrationNumber, name: a.name }))
      : Object.values(surgeons).map((s) => ({ id: s.id, name: s.name }))
  )
    .sort(compareBySurname)
    .map((c) => {
      const pair = pairOf(c.id)
      const taken = activeEntryOnSide(entries, pair.anaesthetistId, pair.surgeonId, side)
      return { ...c, taken }
    })
  const chosen = counterparts.find((c) => c.id === counterpartId)
  const chosenAvailable = chosen !== undefined && chosen.taken === undefined
  const disabledCount = counterparts.filter((c) => c.taken !== undefined).length

  function chooseSide(next: PairingSide) {
    setSide(next)
    setError(null)
    // A counterpart taken on the new side can no longer be chosen.
    const pair = counterpartId !== '' ? pairOf(counterpartId) : null
    if (pair !== null && activeEntryOnSide(entries, pair.anaesthetistId, pair.surgeonId, next) !== undefined) setCounterpartId('')
  }

  const preview = chosenAvailable
    ? (() => {
        const pair = pairOf(chosen.id)
        return pairingSentence(kind, side, anaesthetists[pair.anaesthetistId]?.name ?? '', surgeons[pair.surgeonId]?.name ?? '')
      })()
    : null

  function save() {
    if (!chosenAvailable) {
      setError(perspective === 'surgeon' ? 'Choose an anaesthetist.' : 'Choose a surgeon.')
      return
    }
    const trimmed = reason.trim()
    const outcome = addPairingPreference(useAppStore, actor, {
      kind,
      raisedBy: side,
      ...pairOf(chosen.id),
      ...(trimmed !== '' ? { reason: trimmed } : {}),
    })
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="pairing-add-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{PAIRING_LABELS.add}</div>
          <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2 }}>{PAIRING_LABELS.privacyNote}</div>
        </div>

        <RadioGroup
          legend="Kind"
          name="pairing-kind"
          value={kind}
          onChange={setKind}
          options={(['NOT_PREFERRED', 'PREFERRED'] as const).map((k) => ({ value: k, label: PAIRING_LABELS.kind[k] }))}
        />

        <RadioGroup
          legend="Who asked"
          name="pairing-side"
          value={side}
          onChange={chooseSide}
          options={[
            { value: ownSide, label: PAIRING_LABELS.asked(subjectName) },
            { value: otherSide, label: PAIRING_LABELS.otherSideAsked[otherSide] },
          ]}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{perspective === 'surgeon' ? 'Anaesthetist' : 'Surgeon'}</FieldLabel>
          <select data-shot="pairing-counterpart" aria-describedby={disabledCount > 0 ? takenHintId : undefined} value={counterpartId} onChange={(e) => { setCounterpartId(e.target.value); setError(null) }} style={selectControlStyle}>
            <option value="">{perspective === 'surgeon' ? 'Choose an anaesthetist' : 'Choose a surgeon'}</option>
            {counterparts.map((c) => (
              <option key={c.id} value={c.id} disabled={c.taken !== undefined} data-taken={c.taken !== undefined ? c.taken.kind : undefined}>
                {c.name}{c.taken !== undefined ? ` · ${PAIRING_LABELS.alreadyOnSide(c.taken.kind)}` : ''}
              </option>
            ))}
          </select>
        </label>
          {disabledCount > 0 && (
            <span id={takenHintId} style={{ fontSize: 12, color: neutral.mist }}>
              Greyed names already have an entry on this side. End it first to change it, or record the other side.
            </span>
          )}
        </div>

        {preview !== null && (
          <div data-shot="pairing-preview" style={{ background: kind === 'NOT_PREFERRED' ? semantic.warning.tint : accent.tint, color: kind === 'NOT_PREFERRED' ? semantic.warning.onTint : accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {preview}
          </div>
        )}

        <TextField label="Reason (optional)" value={reason} onChange={setReason} placeholder="e.g. Works well together on long eye lists" />

        <FormError message={error} />
        <Button variant="primary" block onClick={save}>{PAIRING_LABELS.add}</Button>
      </div>
    </Overlay>
  )
}

function RadioGroup<T extends string>({ legend, name, value, onChange, options }: {
  legend: string
  name: string
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend style={{ padding: 0, marginBottom: 6 }}><FieldLabel>{legend}</FieldLabel></legend>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const checked = o.value === value
          return (
            <label
              key={o.value}
              style={{
                flex: '1 1 0',
                minWidth: 160,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 44,
                padding: '0 12px',
                borderRadius: radius.ctl,
                border: `1px solid ${checked ? accent.base : neutral.line}`,
                background: checked ? accent.tint : neutral.surface,
                fontSize: 14,
                fontWeight: checked ? 600 : 500,
                color: checked ? accent.pressed : neutral.ink,
                cursor: 'pointer',
              }}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} style={{ accentColor: accent.base, margin: 0 }} />
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

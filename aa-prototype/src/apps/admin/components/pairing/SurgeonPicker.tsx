/**
 * The surgeon choice for an anaesthetist's session (catch-up Phase 17;
 * US-01.3.5 "Separated", "Still selectable"; US-13.6.4 "admin see both
 * kinds"). A native select from `groupSurgeonsForAnaesthetist`: a main
 * "Surgeons" group (preferred ones read "Mr J. Whitford · preferred") and,
 * when there are any, a separate "Not preferred with Dr Sharma" group whose
 * options carry "· not preferred", so even the closed select says so. Never
 * disabled, never hidden. Admin only.
 */

import { PAIRING_LABELS, groupSurgeonsForAnaesthetist } from '../../../../domain/pairingPreferences'
import type { Surgeon } from '../../../../domain/types'
import { titledSurname } from '../../../../shared/format'
import { useAppStore } from '../../../../store'
import { SelectField, type FieldFill, type FieldSize } from '../../../../shared/ui'
import { usePairingEntries } from './useOfficePairings'

interface SurgeonPickerProps {
  /** The session's anaesthetist; with none, every surgeon is in the main group. */
  anaesthetistId: string | undefined
  value: string
  onChange: (surgeonId: string) => void
  /**
   * The placeholder shown before a surgeon is chosen ("Choose a surgeon"). It
   * is not a value: every List names its surgeon (US-01.3.1, catch-up Phase 31).
   */
  emptyLabel: string
  /** Each picker's own option text (default: the name). */
  optionLabel?: (surgeon: Surgeon) => string
  /** The field's label ("Surgeon", "Usual surgeon"); with `hideLabel`, the select's literal aria-label. */
  label: string
  hideLabel?: boolean
  /** SelectField's chrome (UI unification U4): 48px grey well in a sheet by default. */
  size?: FieldSize
  fill?: FieldFill
  width?: number | string
}

export function SurgeonPicker({ anaesthetistId, value, onChange, emptyLabel, optionLabel, label, hideLabel, size, fill, width }: SurgeonPickerProps) {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const anaesthetistName = useAppStore((s) => (anaesthetistId !== undefined ? s.masters.anaesthetists[anaesthetistId]?.name : undefined))
  const entries = usePairingEntries()
  const { clear, notPreferred } = groupSurgeonsForAnaesthetist({ surgeons, entries, anaesthetistId })
  const text = optionLabel ?? ((s: Surgeon) => s.name)
  const clearOptions = clear.map(({ surgeon, preferred }) => (
    <option key={surgeon.id} value={surgeon.id}>
      {text(surgeon)}
      {preferred ? PAIRING_LABELS.optionSuffix('PREFERRED') : ''}
    </option>
  ))
  return (
    <SelectField label={label} hideLabel={hideLabel} size={size} fill={fill} width={width} value={value} onChange={onChange} shot="surgeon-picker">
      <option value="" disabled>{emptyLabel}</option>
      {notPreferred.length === 0 ? (
        clearOptions
      ) : (
        <>
          <optgroup label="Surgeons">{clearOptions}</optgroup>
          <optgroup label={PAIRING_LABELS.notPreferredWith(titledSurname(anaesthetistName ?? ''))}>
            {notPreferred.map(({ surgeon }) => (
              <option key={surgeon.id} value={surgeon.id}>
                {text(surgeon)}
                {PAIRING_LABELS.optionSuffix('NOT_PREFERRED')}
              </option>
            ))}
          </optgroup>
        </>
      )}
    </SelectField>
  )
}

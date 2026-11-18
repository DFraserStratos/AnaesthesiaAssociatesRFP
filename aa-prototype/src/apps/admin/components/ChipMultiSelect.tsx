/**
 * A short multi-select for Master data (catch-up Phase 18a): a select to add
 * one, then a removable neutral chip per choice, in the order chosen. Used for
 * a surgeon's specialties (required, at least one) and a Contract's
 * specialties (none means every specialty), and the Contract editor's linked
 * surgeons (UI unification U4). Neutral chips only, never the teal action
 * tint. The select draws the one field chrome (`aa-field`), its hint tied.
 */

import { useId, useRef } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { CloseButton, FIELD_CLASS, FieldHint, FieldLabel, fieldControlStyle } from '../../../shared/ui'

export interface ChipOption {
  id: string
  name: string
}

export function ChipMultiSelect({
  label,
  options,
  value,
  onChange,
  addLabel,
  hint,
  empty,
  shot,
}: {
  label: string
  options: readonly ChipOption[]
  value: readonly string[]
  onChange: (ids: string[]) => void
  /** The select's prompt, e.g. "Add a specialty". */
  addLabel: string
  hint?: string
  /** What an empty choice means, shown in place of the chips. */
  empty?: string
  shot?: string
}) {
  const selectId = useId()
  const hintId = useId()
  const byId = new Map(options.map((o) => [o.id, o.name]))
  const remaining = options.filter((o) => !value.includes(o.id))
  const selectRef = useRef<HTMLSelectElement>(null)
  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={selectId}>
        <FieldLabel>{label}</FieldLabel>
      </label>
      {value.length === 0 && empty !== undefined && <div style={{ fontSize: 13, color: neutral.mist, minHeight: 26, display: 'flex', alignItems: 'center' }}>{empty}</div>}
      {value.length > 0 && (
      <div role="list" aria-label={`${label} chosen`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 26, alignItems: 'center' }}>
        {value.map((id) => (
          <span
            key={id}
            role="listitem"
            data-chip={id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px 2px 10px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.ink, fontSize: 12.5, fontWeight: 500 }}
          >
            {byId.get(id) ?? id}
            {/* The button leaves the page; focus returns to the field. */}
            <CloseButton
              label={`Remove ${byId.get(id) ?? id}`}
              iconSize={14}
              returnFocusTo={selectRef}
              onClick={() => onChange(value.filter((v) => v !== id))}
              style={{ padding: 2, display: 'inline-flex' }}
            />
          </span>
        ))}
      </div>
      )}
      <select
        ref={selectRef}
        id={selectId}
        value=""
        aria-describedby={hint !== undefined ? hintId : undefined}
        onChange={(e) => {
          if (e.target.value !== '' && !value.includes(e.target.value)) onChange([...value, e.target.value])
        }}
        disabled={remaining.length === 0}
        className={FIELD_CLASS}
        style={fieldControlStyle({ select: true })}
      >
        <option value="">{addLabel}</option>
        {remaining.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      {hint !== undefined && <FieldHint id={hintId}>{hint}</FieldHint>}
    </div>
  )
}

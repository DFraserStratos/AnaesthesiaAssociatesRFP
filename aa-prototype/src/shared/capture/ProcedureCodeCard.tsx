import { useEffect, useRef, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure, RvgGroup, RvgGroupId } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { baseUnitsFor, baseUnitsText, isRecordableBaseUnits } from '../../domain/billing/rvgGroups'
import { editProcedure, pickRvgGroup, useAppStore, type Actor } from '../../store'
import { CodePickerSheet } from './CodePickerSheet'
import { CaptureSection, FailureNotes, StepperButton } from './ui'

interface ProcedureCodeCardProps {
  procedure: Procedure
  /** The Procedure's RVG group row (from `procedureFee`). */
  rvgGroup?: RvgGroup | undefined
  rvgGroups: Record<string, RvgGroup>
  actor: Actor
  canCapture: boolean
  /** rvgGroupId / baseUnitsSelected failures (shown post-latch, verbatim). */
  failures: BillingValidationFailure[]
  onError: (message: string) => void
}

/** The caption shown on any base-unit value outside the guide (D3: a warning for the office, never a block). */
export const OUTSIDE_GUIDE_CAPTION = 'Outside the guide range. The office will see a warning after the procedure.'

/**
 * The RVG code card (catch-up Phase 19; US-05.1.1, US-03.3.1): the optional RVG
 * code on a Procedure, picked by type-ahead. "Change" (or "Choose") opens the
 * picker; "Clear" leaves the Procedure with no RVG code. Picking goes through
 * `pickRvgGroup`, which clears a chosen or typed base value when the row
 * changes and never touches the Procedure's text. A ranged row shows its range
 * and starts at its starting figure; any whole value may be recorded.
 * Base units are capture context here: the anaesthetist's Booking still shows
 * no fee (2026-09-28 ruling).
 */
export function ProcedureCodeCard({
  procedure,
  rvgGroup,
  rvgGroups,
  actor,
  canCapture,
  failures,
  onError,
}: ProcedureCodeCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function pick(id: RvgGroupId | null) {
    setPickerOpen(false)
    const outcome = pickRvgGroup(useAppStore, actor, procedure.id, id)
    if (!outcome.ok) onError(outcome.message)
  }

  /** The range control sets the chosen value; it also lifts a typed override, so B follows it. */
  function selectRangeUnits(next: number) {
    const patch = procedure.baseUnitsCaptured !== undefined ? { baseUnitsSelected: next, baseUnitsCaptured: undefined } : { baseUnitsSelected: next }
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) onError(outcome.message)
  }

  const footer = failures.length > 0 ? <FailureNotes failures={failures} /> : null

  return (
    <CaptureSection
      label="RVG code"
      shot="procedure-code"
      gap={10}
      footer={footer}
      validationTarget={{ procedureId: procedure.id, fields: ['rvgGroupId', 'baseUnitsSelected'] }}
    >
      <button
        type="button"
        data-validation-procedure-id={procedure.id}
        data-validation-fields="rvgGroupId baseUnitsSelected"
        onClick={canCapture ? () => setPickerOpen(true) : undefined}
        disabled={!canCapture}
        aria-label={rvgGroup !== undefined ? `RVG code ${rvgGroup.code}, ${rvgGroup.description}. Change` : 'No RVG code. Choose'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          background: neutral.bg,
          border: `1px solid ${neutral.line}`,
          borderRadius: radius.ctl + 2,
          padding: '12px 14px',
          fontFamily: 'inherit',
          cursor: canCapture ? 'pointer' : 'default',
        }}
      >
        {rvgGroup !== undefined ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: accent.base }}>
              {rvgGroup.code}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{rvgGroup.description}</span>
            <span style={{ fontSize: 12, color: neutral.mist }}>
              Base {baseUnitsText(rvgGroup)} units · from the RVG group
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 15, color: neutral.mist }}>
            {procedure.rvgGroupId !== undefined ? 'This RVG code is no longer in the RVG groups' : 'No RVG code'}
          </span>
        )}
        {canCapture && (
          <span aria-hidden style={{ fontSize: 14, fontWeight: 600, color: accent.base, flex: 'none' }}>
            {procedure.rvgGroupId !== undefined ? 'Change' : 'Choose'}
          </span>
        )}
      </button>

      {rvgGroup?.baseUnitsRange !== undefined && !procedure.isAdditional && (
        <RangeUnitsRow procedure={procedure} rvgGroup={{ ...rvgGroup, baseUnitsRange: rvgGroup.baseUnitsRange }} canCapture={canCapture} onSelect={selectRangeUnits} />
      )}

      {canCapture && procedure.rvgGroupId !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            data-shot="rvg-code-clear"
            onClick={() => pick(null)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '2px 0',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              color: accent.base,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      )}

      <CodePickerSheet
        open={pickerOpen}
        {...(procedure.rvgGroupId !== undefined ? { currentId: procedure.rvgGroupId } : {})}
        rvgGroups={rvgGroups}
        onPick={pick}
        onClose={() => setPickerOpen(false)}
      />
    </CaptureSection>
  )
}

/**
 * A ranged RVG group's base units (D35, D3): the published range is shown, the
 * value starts at the starting figure, steppers move by one with a floor of 0
 * and no ceiling, and tapping the value types one. The value and the caption
 * come from the one resolver over the whole Procedure, so they always match the
 * B row and the office warning. A value outside the guide is accepted with a
 * quiet warn-tinted caption, never an error. Not shown on an additional
 * procedure, whose base units are not charged.
 */
function RangeUnitsRow({
  procedure,
  rvgGroup,
  canCapture,
  onSelect,
}: {
  procedure: Procedure
  rvgGroup: RvgGroup & { baseUnitsRange: NonNullable<RvgGroup['baseUnitsRange']> }
  canCapture: boolean
  onSelect: (next: number) => void
}) {
  const range = rvgGroup.baseUnitsRange
  const resolved = baseUnitsFor({ procedure, group: rvgGroup })
  const value = resolved.units
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLButtonElement>(null)
  // Enter and Escape both unmount the input, which can fire its blur: the
  // first of commit or cancel wins, so a draft is never saved twice or saved
  // after Escape.
  const settled = useRef(false)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (editing) {
      settled.current = false
      inputRef.current?.select()
    } else if (returnFocus.current) {
      returnFocus.current = false
      valueRef.current?.focus()
    }
  }, [editing])

  function finish(save: boolean, refocus: boolean) {
    if (settled.current) return
    settled.current = true
    returnFocus.current = refocus
    setEditing(false)
    const next = Number(draft.trim())
    if (save && draft.trim() !== '' && isRecordableBaseUnits(next) && next !== value) onSelect(next)
  }

  const status =
    resolved.source === 'chosen' ? `${value} chosen` : resolved.source === 'overridden' ? `${value} set manually` : `starts at ${value}`

  return (
    <div data-shot="rvg-range-units" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, fontSize: 13, color: neutral.slate }}>
          Guide {range.min} to {range.max} ·{' '}
          {resolved.source === 'rvgGroup' ? status : <strong style={{ color: neutral.ink }}>{status}</strong>}
        </span>
        {canCapture && (
          <>
            <StepperButton glyph="−" onClick={() => onSelect(Math.max(0, value - 1))} disabled={value <= 0} />
            {editing ? (
              <input
                ref={inputRef}
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label="Base units"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={() => finish(true, false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finish(true, true)
                  if (e.key === 'Escape') {
                    e.stopPropagation()
                    finish(false, true)
                  }
                }}
                className="mono"
                style={{
                  width: 48,
                  height: 40,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  border: `1px solid ${accent.base}`,
                  borderRadius: radius.ctl,
                  fontFamily: 'inherit',
                  color: neutral.ink,
                  background: neutral.surface,
                }}
              />
            ) : (
              <button
                ref={valueRef}
                type="button"
                aria-label={`Base units ${value}. Type a value`}
                onClick={() => {
                  setDraft(String(value))
                  setEditing(true)
                }}
                className="mono"
                style={{
                  width: 48,
                  height: 40,
                  border: `1px dashed ${neutral.lineStrong}`,
                  borderRadius: radius.ctl,
                  background: 'transparent',
                  fontSize: 20,
                  fontWeight: 700,
                  color: neutral.ink,
                  cursor: 'text',
                  fontFamily: 'inherit',
                }}
              >
                {value}
              </button>
            )}
            <StepperButton glyph="+" onClick={() => onSelect(value + 1)} />
          </>
        )}
      </div>
      {resolved.outsideGuide && (
        <div
          data-shot="rvg-outside-guide"
          style={{
            background: semantic.warning.tint,
            color: semantic.warning.onTint,
            borderRadius: radius.ctl,
            padding: '6px 10px',
            fontSize: 12.5,
            lineHeight: 1.4,
          }}
        >
          {OUTSIDE_GUIDE_CAPTION}
        </div>
      )}
    </div>
  )
}

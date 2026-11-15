import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure, RvgGroup, RvgGroupId } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { baseUnitsFor, baseUnitsShort, baseUnitsText, isRecordableBaseUnits } from '../../domain/billing/rvgGroups'
import { editProcedure, pickRvgGroup, useAppStore, type Actor } from '../../store'
import { CodePickerSheet } from './CodePickerSheet'
import { RvgCodeList, rvgSections } from './RvgCodeList'
import { FailureNotes, StepperButton } from './ui'

interface RvgCodeBaseProps {
  procedure: Procedure
  /** The Procedure's RVG group row (from `procedureFee`). */
  rvgGroup?: RvgGroup | undefined
  rvgGroups: Record<string, RvgGroup>
  actor: Actor
  canCapture: boolean
  /** rvgGroupId / baseUnitsSelected failures (shown post-latch, verbatim). */
  failures: BillingValidationFailure[]
  onError: (message: string) => void
  /**
   * Catch-up Phase 20 (US-03.3.1): `required` on a Contract priced from RVG
   * units with no code yet (the choose action reads "Add RVG code"); `reference`
   * on a fixed or open price, where the code is optional, for reference only.
   */
  codeRole?: 'required' | 'reference'
}

interface RvgCodeFieldProps extends RvgCodeBaseProps {
  /** A quiet line under an empty field (with no Contract yet: "Its price follows the Contract"). */
  emptyHint?: string
  /**
   * `inline` (web and Admin, as the contract picker mock's price step): the code typed
   * straight into a field that drops down the matching codes. `row` (the phone): a row
   * that opens the type-ahead in a bottom sheet.
   */
  look?: 'inline' | 'row'
  /** `inline` only: drop the codes down in the page flow rather than floating (inside a bottom sheet). */
  listInFlow?: boolean
}

/** The caption shown on any base-unit value outside the guide (D3: a warning for the office, never a block). */
export const OUTSIDE_GUIDE_CAPTION = 'Outside the guide range. The office will see a warning after the procedure.'

/**
 * The RVG code (catch-up Phase 19; US-05.1.1, US-03.3.1), picked by type-ahead.
 * Picking goes through `pickRvgGroup`, which clears a chosen or typed base value
 * when the row changes and never touches the Procedure's text; "Clear" leaves the
 * Procedure with no RVG code. A ranged row shows its range and starts at its
 * starting figure.
 *
 * It has no card of its own (catch-up Phase 20, owner review 2026-11-12): the
 * Billing card holds it as the price of an RVG Contract, and as a code for
 * reference on a fixed or open price. On the web and Admin the code is typed
 * straight into the field (`inline`, as the contract picker mock); on the phone
 * a row opens the type-ahead sheet (`row`). Keeps 19's hook
 * (`capture-procedure-code`) and its button names.
 */
export function RvgCodeField({
  procedure,
  rvgGroup,
  rvgGroups,
  actor,
  canCapture,
  failures,
  onError,
  codeRole,
  emptyHint,
  look = 'inline',
  listInFlow = false,
}: RvgCodeFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [changing, setChanging] = useState(false)

  function pick(id: RvgGroupId | null) {
    setPickerOpen(false)
    setChanging(false)
    const outcome = pickRvgGroup(useAppStore, actor, procedure.id, id)
    if (!outcome.ok) onError(outcome.message)
  }

  /** The range control sets the chosen value; it also lifts a typed override, so B follows it. */
  function selectRangeUnits(next: number) {
    const patch = procedure.baseUnitsCaptured !== undefined ? { baseUnitsSelected: next, baseUnitsCaptured: undefined } : { baseUnitsSelected: next }
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) onError(outcome.message)
  }

  const coded = procedure.rvgGroupId !== undefined
  const stale = coded && rvgGroup === undefined
  const todo = codeRole === 'required' && !coded && canCapture
  const changeLabel = rvgGroup !== undefined ? `RVG code ${rvgGroup.code}, ${rvgGroup.description}. Change` : 'No RVG code. Choose'

  const clear = canCapture && coded && (
    <button type="button" data-shot="rvg-code-clear" onClick={() => pick(null)} style={linkStyle}>
      Clear
    </button>
  )

  let field: ReactNode
  if (look === 'row') {
    // The phone, as the mock's Billing rows: a row while empty, the code's own box once chosen.
    field = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rvgGroup !== undefined || stale ? (
          <>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span style={fieldLabelStyle}>RVG code</span>
              {clear}
            </span>
            <button
              type="button"
              aria-label={changeLabel}
              data-validation-procedure-id={procedure.id}
              data-validation-fields="rvgGroupId baseUnitsSelected"
              onClick={canCapture ? () => setPickerOpen(true) : undefined}
              disabled={!canCapture}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', fontFamily: 'inherit', cursor: canCapture ? 'pointer' : 'default' }}
            >
              <CodeSummary rvgGroup={rvgGroup} />
              {canCapture && <ChevronRight size={18} color={neutral.mist} aria-hidden style={{ flex: 'none' }} />}
            </button>
          </>
        ) : (
          <button
            type="button"
            aria-label="No RVG code. Choose"
            data-validation-procedure-id={procedure.id}
            data-validation-fields="rvgGroupId baseUnitsSelected"
            onClick={canCapture ? () => setPickerOpen(true) : undefined}
            disabled={!canCapture}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '2px 0', fontFamily: 'inherit', cursor: canCapture ? 'pointer' : 'default' }}
          >
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...fieldLabelStyle, color: todo ? accent.base : neutral.slate }}>RVG code{todo && ' · to do'}</span>
              <span style={{ fontSize: 15, lineHeight: '20px', color: neutral.mist }}>{canCapture ? 'Choose the RVG code' : 'No RVG code yet'}</span>
            </span>
            {canCapture && <ChevronRight size={18} color={neutral.mist} aria-hidden style={{ flex: 'none' }} />}
          </button>
        )}
      </div>
    )
  } else {
    // Web, Admin and the phone's Billing sheet: the label above, the code typed into the field.
    // Once chosen, the field shows the code: click it to change it, the cross clears it.
    field = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={fieldLabelStyle}>RVG code</span>
        {(rvgGroup !== undefined || stale) && !changing ? (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label={changeLabel}
              data-shot="rvg-code-chosen"
              data-validation-procedure-id={procedure.id}
              data-validation-fields="rvgGroupId baseUnitsSelected"
              disabled={!canCapture}
              onClick={() => setChanging(true)}
              className="aa-rail-focus aa-rvg-chosen"
              style={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: 42, boxSizing: 'border-box', textAlign: 'left', border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, borderRadius: radius.ctl, padding: canCapture ? '8px 44px 8px 12px' : '8px 12px', fontFamily: 'inherit', cursor: canCapture ? 'pointer' : 'default' }}
            >
              <CodeSummary rvgGroup={rvgGroup} />
            </button>
            {canCapture && coded && (
              <button
                type="button"
                aria-label="Clear the RVG code"
                title="Clear"
                data-shot="rvg-code-clear"
                onClick={() => pick(null)}
                className="aa-rail-focus"
                style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 999, background: 'transparent', color: neutral.slate, cursor: 'pointer' }}
              >
                <X size={16} aria-hidden />
              </button>
            )}
          </div>
        ) : canCapture ? (
          <RvgTypeahead
            rvgGroups={rvgGroups}
            {...(procedure.rvgGroupId !== undefined ? { currentId: procedure.rvgGroupId } : {})}
            autoFocus={changing}
            inFlow={listInFlow}
            onPick={(id) => pick(id)}
            {...(changing ? { onCancel: () => setChanging(false) } : {})}
            validationProcedureId={procedure.id}
          />
        ) : (
          <span style={{ fontSize: 14, color: neutral.mist, padding: '9px 0' }}>No RVG code yet</span>
        )}
      </div>
    )
  }

  return (
    <div
      data-shot="capture-procedure-code"
      tabIndex={-1}
      data-validation-procedure-id={procedure.id}
      data-validation-fields="rvgGroupId baseUnitsSelected"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {field}
      {codeRole === 'reference' && (
        <span data-shot="rvg-code-optional" style={{ fontSize: 12.5, color: neutral.slate }}>
          Optional, for reference: this Contract has its own price.
        </span>
      )}
      {!coded && emptyHint !== undefined && (
        <span data-shot="rvg-code-to-fill" style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>
          {emptyHint}
        </span>
      )}

      {rvgGroup?.baseUnitsRange !== undefined && !procedure.isAdditional && (
        <RangeUnitsRow procedure={procedure} rvgGroup={{ ...rvgGroup, baseUnitsRange: rvgGroup.baseUnitsRange }} canCapture={canCapture} onSelect={selectRangeUnits} />
      )}

      {look === 'row' && (
        <CodePickerSheet
          open={pickerOpen}
          {...(procedure.rvgGroupId !== undefined ? { currentId: procedure.rvgGroupId } : {})}
          rvgGroups={rvgGroups}
          onPick={pick}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {failures.length > 0 && <FailureNotes failures={failures} />}
    </div>
  )
}

const fieldLabelStyle: CSSProperties = { fontSize: 12.5, lineHeight: '18px', fontWeight: 600, color: neutral.slate }
const linkStyle: CSSProperties = { border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: accent.base, cursor: 'pointer' }

/** The chosen code: the code in teal, its description, and its base units. */
function CodeSummary({ rvgGroup }: { rvgGroup: RvgGroup | undefined }) {
  if (rvgGroup === undefined) {
    return <span style={{ flex: 1, fontSize: 14.5, color: neutral.mist }}>This RVG code is no longer in the RVG groups</span>
  }
  return (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span className="mono" style={{ flex: 'none', fontSize: 14, fontWeight: 600, color: accent.base }}>{rvgGroup.code}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: '20px', fontWeight: 500, color: neutral.ink }}>{rvgGroup.description}</span>
      <span className="mono" title={`Base ${baseUnitsText(rvgGroup)} units`} style={{ flex: 'none', fontSize: 12.5, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap' }}>{baseUnitsShort(rvgGroup)}</span>
    </span>
  )
}

/**
 * The RVG code typed straight into a field (the contract picker mock's price step):
 * focus to drop down every code under its anatomy heading, type to narrow it
 * (`searchRvgGroups`, the code sheet's own search), arrow keys and Enter to pick,
 * Escape to close. Rows keep the sheet's hooks (`data-rvg-code`, `rvg-base-units`).
 */
function RvgTypeahead({
  rvgGroups,
  currentId,
  autoFocus,
  inFlow,
  onPick,
  onCancel,
  validationProcedureId,
}: {
  rvgGroups: Record<string, RvgGroup>
  currentId?: RvgGroupId
  autoFocus?: boolean
  inFlow: boolean
  onPick: (id: RvgGroupId) => void
  onCancel?: () => void
  validationProcedureId: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<RvgGroupId | undefined>(undefined)
  const rootRef = useRef<HTMLDivElement>(null)
  const sections = useMemo(() => rvgSections(q, rvgGroups), [q, rvgGroups])
  const flat = useMemo(() => sections.flatMap((s) => s.rows), [sections])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e: MouseEvent) => {
      if (rootRef.current !== null && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        onCancel?.()
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, onCancel])

  const choose = (id: RvgGroupId) => {
    setOpen(false)
    setQ('')
    onPick(id)
  }
  const move = (by: number) => {
    const i = activeId !== undefined ? flat.findIndex((g) => g.id === activeId) : flat.findIndex((g) => g.id === currentId)
    const next = flat[Math.max(0, Math.min(flat.length - 1, i < 0 ? 0 : i + by))]
    if (next !== undefined) setActiveId(next.id)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        autoFocus={autoFocus}
        value={q}
        role="combobox"
        aria-expanded={open}
        aria-label="RVG code"
        data-validation-procedure-id={validationProcedureId}
        data-validation-fields="rvgGroupId baseUnitsSelected"
        placeholder="Type a code, e.g. H6a"
        className={`aa-rail-focus${q !== '' ? ' mono' : ''}`}
        onChange={(e) => {
          setQ(e.target.value)
          setActiveId(undefined)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
            move(e.key === 'ArrowDown' ? 1 : -1)
          } else if (e.key === 'Enter' && open) {
            const id = activeId ?? (q.trim() !== '' ? flat[0]?.id : undefined)
            if (id !== undefined) {
              e.preventDefault()
              choose(id)
            }
          } else if (e.key === 'Escape') {
            e.stopPropagation()
            setOpen(false)
            onCancel?.()
          }
        }}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 42, border: `1px solid ${open ? accent.base : neutral.lineStrong}`, borderRadius: radius.ctl, padding: '0 12px', fontSize: 14.5, fontFamily: q !== '' ? undefined : 'inherit', color: neutral.ink, background: neutral.surface }}
      />
      {open && (
        <div
          data-shot="rvg-type-ahead"
          style={{
            ...(inFlow ? { marginTop: 6 } : { position: 'absolute', zIndex: 30, top: 'calc(100% + 6px)', left: 0, right: 0, boxShadow: '0 8px 16px rgba(23,35,32,0.10), 0 24px 56px rgba(23,35,32,0.18)' }),
            background: neutral.surface,
            border: `1px solid ${neutral.line}`,
            borderRadius: radius.card,
            overflow: 'hidden',
          }}
        >
          <RvgCodeList
            sections={sections}
            {...(currentId !== undefined ? { currentId } : {})}
            {...(activeId !== undefined ? { activeId } : {})}
            onActive={setActiveId}
            onPick={choose}
            maxHeight={inFlow ? 300 : 360}
          />
        </div>
      )}
    </div>
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

import { useBookingApi, useBookingStore, usePrimaryEditLabel } from '../booking/draft'
import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import {
  AA_OWN_BLOCK,
  MODIFIER_EXPLANATION_MAX,
  enteredUnitsBounds,
  modifierBlocks,
  modifierUnitsText,
  needsEnteredUnits,
  type ProcedureModifier,
} from '../../domain/billing/modifiers'
import type { Modifier, ModifierId, Procedure } from '../../domain/types'
import { activeAaModifiers, claimModifier, editModifierExplanation, restoreModifier, type Actor } from '../../store'
import { retiredLabel } from '../../domain/masterLifecycle'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { Button } from '../ui/Button'
import { FormError, TextArea } from '../ui/Field'
import { TextAction } from '../ui/TextAction'
import { NameSearchBox } from '../ui/NameSearchBox'
import { Pill } from '../ui/Pill'
import { NumberStepper } from './ui'

interface ModifierPickerSheetProps {
  open: boolean
  procedure: Procedure
  /** The Procedure's itemised modifiers (pre-applied and claimed). */
  items: readonly ProcedureModifier[]
  /** The pre-applied modifiers the anaesthetist removed (offered back with "Put back"). */
  removed: readonly ProcedureModifier[]
  actor: Actor
  /** Open straight on this claim's explanation (Edit on a claimed row). */
  editing?: ModifierId
  onClose: () => void
  onError: (message: string) => void
}

const SEARCH_LABEL = 'Search code or modifier'

/**
 * "Add a modifier" (catch-up Phase 19b; US-03.3.4, US-05.1.4, US-05.1.5): the
 * RVG modifier table as printed plus AA's own, under the printed blocks in
 * table order, searchable by code and factor. It extends the RVG code picker's
 * search-and-list anatomy (a bottom sheet on mobile, a dialog on web and
 * Admin).
 *
 * Tapping a row opens its explanation inline, in the same sheet: a short
 * reason, the units where the printed value is not a plain number, and Claim,
 * which stays disabled until there is a reason. Nothing is written until
 * Claim (US-03.3.4: a claimed modifier needs a short explanation), and the
 * pending claim lives here until Claim or Cancel, so no tap is lost on the
 * phone. The pre-applied modifiers read "Applied" and cannot be claimed again;
 * a removed one offers "Put back". A claimed one reads "Claimed".
 */
export function ModifierPickerSheet({ open, procedure, items, removed, actor, editing, onClose, onError }: ModifierPickerSheetProps) {
  const bookingApi = useBookingApi()
  const { Overlay, variant } = useSurface()
  const web = variant === 'web'
  const modifiers = useBookingStore((s) => s.masters.modifiers)
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<{ id: ModifierId; explanation: string; units: number } | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  const claimFor = (id: ModifierId) => procedure.modifierClaims.find((c) => c.modifierId === id)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setStatus(null)
    setRefusal(null)
    if (editing !== undefined) {
      const claim = claimFor(editing)
      const m = modifiers[editing]
      setPending({ id: editing, explanation: claim?.explanation ?? '', units: claim?.units ?? (m !== undefined ? enteredUnitsBounds(m).min : 1) })
    } else {
      setPending(null)
    }
  }, [open, editing])

  // A retired AA modifier is not offered, but one this Procedure already
  // claims (or carries) stays listed, labelled, so its claim still shows and
  // can be edited (catch-up Phase 42).
  const keepIds = useMemo(
    () => [...procedure.modifierClaims.map((c) => c.modifierId), ...items.map((i) => i.modifierId), ...removed.map((r) => r.modifierId)],
    [procedure.modifierClaims, items, removed],
  )
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = activeAaModifiers({ masters: { modifiers } }, keepIds)
    const matches = (m: Modifier) =>
      q === '' || m.code.toLowerCase().includes(q) || m.code.replace(/\s+/g, '').toLowerCase().includes(q) || m.factor.toLowerCase().includes(q)
    return modifierBlocks(modifiers)
      .map((block) => ({
        block,
        rows: all.filter((m) => (block === AA_OWN_BLOCK ? m.source === 'aa' : m.source === 'rvg' && m.block === block)).filter(matches),
      }))
      .filter((g) => g.rows.length > 0)
  }, [modifiers, query, keepIds])
  const count = groups.reduce((n, g) => n + g.rows.length, 0)

  function stateOf(m: Modifier): { kind: 'applied'; reason: string } | { kind: 'removed' } | { kind: 'claimed' } | { kind: 'open' } {
    const applied = items.find((i) => i.modifierId === m.id && i.origin !== 'chosen')
    if (applied !== undefined) return { kind: 'applied', reason: applied.origin === 'age' ? "From the patient's age" : 'Included in the base units' }
    if (removed.some((r) => r.modifierId === m.id) && claimFor(m.id) === undefined) return { kind: 'removed' }
    if (claimFor(m.id) !== undefined) return { kind: 'claimed' }
    return { kind: 'open' }
  }

  function submit(m: Modifier) {
    if (pending === null) return
    const units = needsEnteredUnits(m) ? pending.units : undefined
    const editingClaim = claimFor(m.id) !== undefined
    const outcome = editingClaim
      ? editModifierExplanation(bookingApi, actor, procedure.id, m.id, pending.explanation, units)
      : claimModifier(bookingApi, actor, procedure.id, { modifierId: m.id, explanation: pending.explanation, ...(units !== undefined ? { units } : {}) })
    if (!outcome.ok) {
      setRefusal(outcome.message)
      return
    }
    setPending(null)
    setRefusal(null)
    // The phone closes on a claim; a desktop stays open for another.
    if (!web || editing !== undefined) onClose()
    else setStatus(`${m.code} ${editingClaim ? 'updated' : 'claimed'}.`)
  }

  function putBack(m: Modifier) {
    const outcome = restoreModifier(bookingApi, actor, procedure.id, m.id)
    if (!outcome.ok) onError(outcome.message)
    else setStatus(`${m.code} put back.`)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="modifier-picker">
        <OverlayHeader title={editing !== undefined ? 'Modifier explanation' : 'Add a modifier'} style={{ marginBottom: 12 }} />
        {editing === undefined && <NameSearchBox value={query} onChange={setQuery} label={SEARCH_LABEL} autoFocus fill="well" />}
        <div style={{ fontSize: 12.5, color: neutral.mist, padding: '6px 4px', minHeight: 18 }} aria-live="polite">
          {status ?? (editing !== undefined ? '' : query.trim() === '' ? 'Each modifier you claim needs a short reason.' : `${count} ${count === 1 ? 'match' : 'matches'}`)}
        </div>
        <div style={{ maxHeight: web ? 460 : 'none', overflow: web ? 'auto' : 'visible' }}>
          {count === 0 && <div style={{ padding: '18px 4px', fontSize: 14, color: neutral.mist }}>No modifiers match that search.</div>}
          {groups.map(({ block, rows }) => {
            const shown = editing !== undefined ? rows.filter((m) => m.id === editing) : rows
            if (shown.length === 0) return null
            return (
              <div key={block} role="group" aria-label={block}>
                {editing === undefined && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, padding: '12px 10px 4px' }}>{block}</div>
                )}
                {shown.map((m) => {
                  const state = stateOf(m)
                  const expanded = pending?.id === m.id
                  const tappable = state.kind === 'open' || state.kind === 'claimed'
                  return (
                    <div key={m.id} style={{ borderBottom: `1px solid ${neutral.sunken}` }}>
                      <button
                        type="button"
                        data-modifier-code={m.code}
                        aria-expanded={tappable ? expanded : undefined}
                        aria-disabled={!tappable}
                        onClick={() => {
                          if (!tappable) return
                          setRefusal(null)
                          setStatus(null)
                          if (expanded && editing === undefined) setPending(null)
                          else setPending({ id: m.id, explanation: claimFor(m.id)?.explanation ?? '', units: claimFor(m.id)?.units ?? enteredUnitsBounds(m).min })
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '58px 1fr auto',
                          alignItems: 'start',
                          columnGap: 12,
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          fontFamily: 'inherit',
                          cursor: tappable ? 'pointer' : 'default',
                          padding: '11px 10px',
                          borderRadius: radius.ctl,
                          background: expanded ? accent.tint : 'transparent',
                        }}
                      >
                        <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: tappable ? accent.base : neutral.slate, paddingTop: 1 }}>
                          {retiredLabel(m.code, m)}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: neutral.ink, lineHeight: '19px' }}>{m.factor}</span>
                          {state.kind === 'applied' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Pill size="sm" shot="modifier-picker-applied">Applied</Pill>
                              <span style={{ fontSize: 12, color: neutral.mist }}>{state.reason}</span>
                            </span>
                          )}
                          {state.kind === 'claimed' && <Pill size="sm">Claimed</Pill>}
                        </span>
                        <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap', paddingTop: 2 }}>
                          {modifierUnitsText(m)}
                        </span>
                      </button>
                      {state.kind === 'removed' && (
                        <div style={{ padding: '0 10px 10px 80px', fontSize: 12.5, color: neutral.mist }}>
                          Removed from this procedure.{' '}
                          <TextAction size="sm" label={`Put back ${m.code}`} onClick={() => putBack(m)}>
                            Put back
                          </TextAction>
                        </div>
                      )}
                      {expanded && pending !== null && (
                        <ClaimForm
                          modifier={m}
                          explanation={pending.explanation}
                          units={pending.units}
                          refusal={refusal}
                          editing={claimFor(m.id) !== undefined}
                          onExplanation={(explanation) => setPending({ ...pending, explanation })}
                          onUnits={(units) => setPending({ ...pending, units })}
                          onClaim={() => submit(m)}
                          onCancel={() => {
                            setPending(null)
                            setRefusal(null)
                            if (editing !== undefined) onClose()
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </Overlay>
  )
}

/** The inline explanation (and units) under the tapped row. Only Claim writes. */
function ClaimForm({
  modifier,
  explanation,
  units,
  refusal,
  editing,
  onExplanation,
  onUnits,
  onClaim,
  onCancel,
}: {
  modifier: Modifier
  explanation: string
  units: number
  refusal: string | null
  editing: boolean
  onExplanation: (value: string) => void
  onUnits: (value: number) => void
  onClaim: () => void
  onCancel: () => void
}) {
  const entered = needsEnteredUnits(modifier)
  const bounds = enteredUnitsBounds(modifier)
  const ready = explanation.trim() !== ''
  // "Apply" in the Admin draft (catch-up Phase 35); a new claim keeps "Claim".
  const saveLabel = usePrimaryEditLabel('Save')
  return (
    <div data-shot="modifier-explanation" style={{ padding: '4px 10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* The visible word stays plain text; the field is named by ariaLabel. */}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>Explanation</span>
        <TextArea
          ariaLabel="Explanation"
          value={explanation}
          onChange={onExplanation}
          autoFocus
          rows={2}
          resize="vertical"
          maxLength={MODIFIER_EXPLANATION_MAX}
          placeholder="A short reason, as an insurer would ask"
          onKeyDown={(e) => {
            // Enter claims (a short reason needs no new line); Shift+Enter is a new line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (ready) onClaim()
            }
          }}
        />
      </div>
      {entered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} data-shot="modifier-units">
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>Units</span>
            <span style={{ fontSize: 12, color: neutral.mist }}>
              RVG: <span className="mono">{modifier.unitsAsPrinted}</span>
            </span>
          </span>
          <NumberStepper value={units} onChange={onUnits} min={bounds.min} {...(bounds.max !== undefined ? { max: bounds.max } : {})} label="units" />
        </div>
      )}
      <FormError message={refusal} />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
        <TextAction onClick={onCancel}>Cancel</TextAction>
        {/* The primary action at the sheet's compact size (a row-level confirm, not the page's CTA). */}
        <Button variant="primary" disabled={!ready} onClick={onClaim} style={{ minHeight: 44, padding: '0 24px', fontSize: 15 }}>
          {editing ? saveLabel : 'Claim'}
        </Button>
      </div>
    </div>
  )
}

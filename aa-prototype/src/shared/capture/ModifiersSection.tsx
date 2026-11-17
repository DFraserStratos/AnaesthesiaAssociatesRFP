import { useMemo, useState } from 'react'
import { accent, fontFamily, neutral, semantic, radius } from '../../theme/tokens'
import type { BillingValidationFailure, ProcedureModifier } from '../../domain/billing'
import { claimCompletionProblems, removedPreAppliedModifiers } from '../../domain/billing/modifiers'
import type { ModifierId, Procedure } from '../../domain/types'
import { confirmNoModifiers, modifierFactsFor, removeModifier, restoreModifier, useAppStore, type Actor } from '../../store'
import { useSurface } from '../surface'
import { ModifierPickerSheet } from './ModifierPickerSheet'
import { FailureNotes, RequiredCaption } from './ui'
import { MODIFIERS_STEP_MESSAGE, modifiersStepAnswered } from '../../domain/billing/completion'
import { TextAction } from '../ui/TextAction'
import { Button } from '../ui/Button'

interface ModifiersSectionProps {
  procedure: Procedure
  /** The itemised modifiers the calculator resolved (`BtmBreakdown.modifierItems`). */
  items: readonly ProcedureModifier[]
  actor: Actor
  /** False on an additional Procedure or a List the rights rule locks: rows stay, actions go. */
  editable: boolean
  /**
   * The modifiers step is required (an RVG kind, catch-up Phase 21a; US-03.3.4,
   * US-03.3.9): until it is answered, a teal "None apply" sits beside "Add a
   * modifier" with a "Required" caption; after "None apply", "No modifiers
   * claimed" with Change.
   */
  required?: boolean
  /** Mark complete's validation latch: the caption takes the warning tint while the step is unanswered. */
  latched?: boolean
  /** This Procedure's `modifierClaims` failures (after the validation latch). */
  failures: readonly BillingValidationFailure[]
  onError: (message: string) => void
}

/**
 * The Procedure's modifiers, itemised (catch-up Phase 19b; US-03.3.4,
 * US-03.3.8, US-05.1.4). It reads like a short ledger under the M row: the
 * pre-applied rows first (the age modifier, and any modifier the RVG group's
 * base units include, shown selected and removable, never locked), then the
 * claimed rows with their explanations, each with its units in one mono
 * column, then "Add a modifier". A removed pre-applied modifier leaves a quiet
 * "Put back" line so a mis-tap is recoverable. Nothing else is pre-filled.
 *
 * Shared by the mobile Booking, the web Booking and the Admin Booking detail
 * (through `BtmCaptureBlock`); the picker is a bottom sheet on mobile and a
 * dialog on web and Admin. Removing writes at once; claiming writes only when
 * the explanation is given (the picker's Claim).
 */
/** How far the modifiers block reaches into the Units card's 16px padding, so its focus ring hugs the card. */
const INSET_REACH = 12

export function ModifiersSection({ procedure, items, actor, editable, required = false, latched = false, failures, onError }: ModifiersSectionProps) {
  const { variant } = useSurface()
  const web = variant === 'web'
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const [picker, setPicker] = useState<{ editing?: ModifierId } | null>(null)

  const removed = useMemo(
    () =>
      removedPreAppliedModifiers({
        ...modifierFactsFor({ schedule, masters }, procedure),
        removedModifierIds: procedure.removedModifierIds,
      }),
    [schedule, masters, procedure],
  )
  const problems = useMemo(
    () => new Map(claimCompletionProblems(procedure.modifierClaims, masters.modifiers).map((p) => [p.modifierId, p.message])),
    [procedure.modifierClaims, masters.modifiers],
  )

  function run(outcome: { ok: boolean; message?: string }) {
    if (!outcome.ok && outcome.message !== undefined) onError(outcome.message)
  }

  const preApplied = items.filter((i) => i.origin !== 'chosen')
  const claimed = items.filter((i) => i.origin === 'chosen')
  const empty = items.length === 0 && removed.length === 0
  // The step is the anaesthetist's answer: a claim, or "None apply" (pre-applied rows do not answer it).
  const answered = modifiersStepAnswered(procedure)
  const noneConfirmed = procedure.modifiersConfirmed === true && claimed.length === 0
  const asking = required && !answered

  return (
    <div
      data-shot="capture-modifiers"
      tabIndex={-1}
      data-validation-procedure-id={procedure.id}
      data-validation-fields="modifierClaims"
      className="aa-validation-inset"
      // The last block of the Units card: it reaches to 4px inside the card's padding (16) so its focus ring
      // sits near the card's edge, and its corners are concentric with the card's (owner review, 2026-11-17):
      // card radius 14 = this radius (9) + the 5px between it and the card's outer edge (16 - 12 padding, + 1 border).
      style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: `0 -${INSET_REACH}px -${INSET_REACH}px`, padding: `0 ${INSET_REACH}px ${INSET_REACH}px`, borderRadius: radius.card - (16 - INSET_REACH + 1) }}
    >
      {/* The seam: the arithmetic above it, the itemised facts that make up M below. */}
      <div style={{ height: 1, background: neutral.line, margin: '2px 0' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: web ? 13 : 14, fontWeight: 600, color: neutral.slate }}>Modifiers</span>
          {asking && (
            <RequiredCaption latched={latched} />
          )}
        </span>
        {editable && !asking && !noneConfirmed && (
          <TextAction onClick={() => setPicker({})} shot="modifier-add">
            Add a modifier
          </TextAction>
        )}
      </div>

      {(preApplied.length > 0 || claimed.length > 0) && (
        <div role="list" aria-label="Modifiers on this procedure" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {preApplied.map((item) => (
            <LedgerRow
              key={item.modifierId}
              item={item}
              shot="capture-modifier-applied"
              note={`${item.detail}.${item.origin === 'included' ? ' Cannot be added twice.' : ''}`}
              noteTone="quiet"
              actions={editable ? [{ label: 'Remove', ariaLabel: `Remove ${item.code}`, onClick: () => run(removeModifier(useAppStore, actor, procedure.id, item.modifierId, 'preApplied')) }] : []}
            />
          ))}
          {claimed.map((item, index) => {
            const problem = problems.get(item.modifierId)
            const blocked = [item.refused, problem].filter((x): x is string => x !== undefined).join(' ') || undefined
            return (
              <LedgerRow
                key={`${item.modifierId}-claim-${index}`}
                item={item}
                shot="capture-modifier-claim"
                note={blocked ?? item.explanation ?? ''}
                noteTone={blocked !== undefined ? 'warn' : 'explanation'}
                actions={
                  editable
                    ? [
                        ...(item.refused === undefined ? [{ label: problem !== undefined ? 'Add a short explanation' : 'Edit', ariaLabel: `${problem !== undefined ? 'Add a short explanation for' : 'Edit'} ${item.code}`, onClick: () => setPicker({ editing: item.modifierId }) }] : []),
                        { label: 'Remove', ariaLabel: `Remove ${item.code}`, onClick: () => run(removeModifier(useAppStore, actor, procedure.id, item.modifierId)) },
                      ]
                    : []
                }
              />
            )
          })}
        </div>
      )}

      {removed.map((r) => (
        <div key={r.modifierId} data-shot="capture-modifier-removed" style={{ fontSize: 12.5, color: neutral.mist, lineHeight: '18px' }}>
          Removed: <span className="mono">{r.code}</span>.{' '}
          {editable && (
            <TextAction small label={`Put back ${r.code}`} onClick={() => run(restoreModifier(useAppStore, actor, procedure.id, r.modifierId))}>
              Put back
            </TextAction>
          )}
        </div>
      ))}

      {/* The answer, where the question was asked: below the modifiers already applied. */}
      {noneConfirmed ? (
        <div data-shot="capture-modifiers-none-done" style={{ fontSize: 13, color: neutral.slate, lineHeight: '18px' }}>
          No modifiers claimed
          {editable && (
            <>
              {' · '}
              {/* The same `modifier-add` hook as "Add a modifier" (they never show together), so recipes open the picker either way. */}
              <TextAction small label="Change: add a modifier" shot="modifier-add" onClick={() => setPicker({})}>
                Change
              </TextAction>
            </>
          )}
        </div>
      ) : (
        empty &&
        !(asking && editable) && (
          <div style={{ fontSize: 13, color: neutral.mist, lineHeight: '18px' }}>
            No modifiers. Add any that apply, each with a short reason.
          </div>
        )
      )}

      {/* The step unanswered on an RVG kind: one question, two answers of equal weight, below the modifiers
          already applied (AR-58 A20; owner review, 2026-11-17), on the outlined rounded rectangle every
          other tap target in the card uses (a fully round shape here reads as a label). Neither is the default: a claim the anaesthetist
          is owed must be as easy as none. */}
      {asking && editable && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" shot="capture-modifiers-none" style={{ flex: web ? '0 0 auto' : 1 }} onClick={() => run(confirmNoModifiers(useAppStore, actor, procedure.id))}>
            None apply
          </Button>
          <Button variant="secondary" shot="modifier-add" style={{ flex: web ? '0 0 auto' : 1 }} onClick={() => setPicker({})}>
            Add a modifier
          </Button>
        </div>
      )}

      {/* A claim's own problem shows on its row. The unanswered step is shown by the Required pill and the red
          ring alone (owner review, 2026-11-17): no note. Anything else the validator says shows here. */}
      <FailureNotes failures={failures.filter((f) => f.message !== MODIFIERS_STEP_MESSAGE && !Array.from(problems.values()).includes(f.message))} />

      {picker !== null && (
        <ModifierPickerSheet
          open
          procedure={procedure}
          items={items}
          removed={removed}
          actor={actor}
          {...(picker.editing !== undefined ? { editing: picker.editing } : {})}
          onClose={() => setPicker(null)}
          onError={onError}
        />
      )}
    </div>
  )
}

interface RowAction {
  label: string
  ariaLabel?: string
  onClick: () => void
}

/**
 * One ledger row: the code in a pill (neutral for pre-applied, the teal tint
 * the selected chips use for a claim), the printed factor, the units in a mono
 * column, a note beneath (the reason, the explanation, or a warn-tinted
 * problem) and its teal text actions.
 */
function LedgerRow({
  item,
  shot,
  note,
  noteTone,
  actions,
}: {
  item: ProcedureModifier
  shot: string
  note: string
  noteTone: 'quiet' | 'explanation' | 'warn'
  actions: readonly RowAction[]
}) {
  const applied = item.origin !== 'chosen'
  const warn = noteTone === 'warn'
  return (
    <div
      role="listitem"
      data-shot={shot}
      data-modifier-code={item.code}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        columnGap: 10,
        rowGap: 4,
        alignItems: 'baseline',
        padding: '8px 10px',
        margin: '0 -10px',
        borderRadius: radius.ctl,
        background: warn ? semantic.warning.tint : 'transparent',
      }}
    >
      <span
        className="mono"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '1px 8px',
          borderRadius: radius.pill,
          fontSize: 12.5,
          fontWeight: 600,
          lineHeight: '20px',
          whiteSpace: 'nowrap',
          background: applied ? neutral.sunken : accent.tint,
          color: applied ? neutral.slate : accent.hover,
        }}
      >
        {item.code}
        {applied && <span style={{ fontFamily: fontFamily.ui, fontSize: 10.5, fontWeight: 600, color: neutral.mist }}>Applied</span>}
      </span>
      <span style={{ fontSize: 14, color: neutral.ink, lineHeight: '19px', minWidth: 0, overflowWrap: 'anywhere' }}>{item.label}</span>
      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: item.refused !== undefined ? neutral.mist : neutral.ink, textAlign: 'right', minWidth: 28 }}>
        {item.origin === 'chosen' && item.refused === undefined ? `+${item.units}` : item.units}
      </span>
      {(note !== '' || actions.length > 0) && (
        <span style={{ gridColumn: '2 / 4', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 14, rowGap: 4 }}>
          {note !== '' && (
            <span
              style={{
                flex: '1 1 160px',
                fontSize: 12.5,
                lineHeight: '17px',
                color: warn ? semantic.warning.onTint : noteTone === 'explanation' ? neutral.slate : neutral.mist,
              }}
            >
              {note}
            </span>
          )}
          {actions.length > 0 && (
            <span style={{ display: 'inline-flex', gap: 14, marginLeft: 'auto' }}>
              {actions.map((a) => (
                <TextAction key={a.label} small onClick={a.onClick} {...(a.ariaLabel !== undefined ? { label: a.ariaLabel } : {})}>
                  {a.label}
                </TextAction>
              ))}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

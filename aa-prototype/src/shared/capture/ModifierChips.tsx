import { accent, neutral } from '../../theme/tokens'
import type { Procedure, RvgCode } from '../../domain/types'
import { MODIFIER_CODES, modifierUnits } from '../../domain/billing'
import { editProcedure, useAppStore, type Actor } from '../../store'
import { MODIFIER_CHIP_LABELS } from './modifierLabels'
import { Caption } from './ui'

interface ModifierChipsProps {
  procedure: Procedure
  baseCode?: RvgCode | undefined
  actor: Actor
  /** isAdditional or read-only. */
  disabled: boolean
  onError: (message: string) => void
}

/**
 * Every RFP modifier group as chips (mockup pattern, real master — NOT the
 * mockup's 3-chip demo set), EXCEPT group 'AS': the ASA seed stays visually
 * distinct and appears only in the M row's caption. A chip the base code
 * absorbs is disabled with the domain's verbatim refusal reason.
 */
export function ModifierChips({ procedure, baseCode, actor, disabled, onError }: ModifierChipsProps) {
  const chips = MODIFIER_CODES.filter((m) => m.group !== 'AS')
  const selected = new Set(procedure.selectedModifierCodes)

  function toggle(code: string) {
    const next = selected.has(code)
      ? procedure.selectedModifierCodes.filter((c) => c !== code)
      : [...procedure.selectedModifierCodes, code]
    const outcome = editProcedure(useAppStore, actor, procedure.id, { selectedModifierCodes: next })
    if (!outcome.ok) onError(outcome.message)
  }

  const absorbed = chips.filter(
    (m) => baseCode !== undefined && baseCode.absorbsModifierCodes.includes(m.code),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chips.map((m) => {
          const on = selected.has(m.code)
          const isAbsorbed = absorbed.some((a) => a.code === m.code)
          const inert = disabled || isAbsorbed
          return (
            <button
              key={m.code}
              type="button"
              disabled={inert}
              onClick={inert ? undefined : () => toggle(m.code)}
              style={{
                padding: '11px 14px',
                borderRadius: 999,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: inert ? 'default' : 'pointer',
                transition: 'background 150ms, border-color 150ms',
                background: on ? accent.tint : neutral.surface,
                color: isAbsorbed ? neutral.lineStrong : on ? accent.hover : neutral.slate,
                border: `1.5px solid ${on ? accent.base : neutral.line}`,
                opacity: disabled ? 0.55 : 1,
                textDecoration: isAbsorbed ? 'line-through' : 'none',
              }}
            >
              {m.code} · {MODIFIER_CHIP_LABELS[m.code] ?? m.description} · +{m.units}
            </button>
          )
        })}
      </div>
      {absorbed.map((m) => {
        const reason = modifierUnits([m.code], baseCode).refused[0]?.reason
        return reason !== undefined ? <Caption key={m.code}>{reason}</Caption> : null
      })}
      <Caption>
        Modifier values are demo-plausible within the RFP's stated ranges, not an authoritative
        NZSA schedule.
      </Caption>
    </div>
  )
}

import { accent, neutral } from '../../../theme/tokens'
import type { AsaClass, Procedure } from '../../../domain/types'
import { ASA_SEED_UNITS } from '../../../domain/billing'
import { editProcedure, useAppStore, type Actor } from '../../../store'
import { CaptureSection, Caption } from './ui'

const ASA_OPTIONS: { value: AsaClass; label: string }[] = [
  { value: 'AS1', label: 'I' },
  { value: 'AS2', label: 'II' },
  { value: 'AS3', label: 'III' },
  { value: 'AS4', label: 'IV' },
]

const ROMAN: Record<AsaClass, string> = { AS1: 'I', AS2: 'II', AS3: 'III', AS4: 'IV' }

interface AsaCardProps {
  procedure: Procedure
  actor: Actor
  /** isAdditional or read-only — selection stays visible, taps do nothing. */
  disabled: boolean
  onError: (message: string) => void
}

/**
 * ASA physical status segmented control (mockup screen 3). The caption states
 * the REAL seeding value from ASA_SEED_UNITS ("ASA III seeds +3 modifier
 * units"), not the mockup's simplified "ASA ≥ 3 adds +1" (logged decision:
 * the calculator is the maths, the mockup is the skin). Supports the
 * none-selected state — a segmented write-through would silently invent data.
 */
export function AsaCard({ procedure, actor, disabled, onError }: AsaCardProps) {
  const selected = procedure.asaClass

  function pick(value: AsaClass) {
    const outcome = editProcedure(useAppStore, actor, procedure.id, { asaClass: value })
    if (!outcome.ok) onError(outcome.message)
  }

  return (
    <CaptureSection label="ASA status" gap={10}>
      <div style={{ display: 'flex', background: neutral.sunken, borderRadius: 12, padding: 4, gap: 4, opacity: disabled ? 0.55 : 1 }}>
        {ASA_OPTIONS.map((o) => {
          const active = o.value === selected
          return (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              onClick={disabled ? undefined : () => pick(o.value)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 9,
                border: 'none',
                fontFamily: 'inherit',
                fontSize: 16,
                fontWeight: 600,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'background 150ms, color 150ms',
                background: active ? accent.base : 'transparent',
                color: active ? neutral.surface : neutral.slate,
                boxShadow: active ? '0 1px 3px rgba(23,35,32,0.2)' : 'none',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {selected !== undefined ? (
        <Caption color={neutral.slate}>
          ASA {ROMAN[selected]} seeds +{ASA_SEED_UNITS[selected]} modifier {ASA_SEED_UNITS[selected] === 1 ? 'unit' : 'units'}.
        </Caption>
      ) : (
        <Caption>Select the ASA physical status; it seeds the modifier units.</Caption>
      )}
    </CaptureSection>
  )
}

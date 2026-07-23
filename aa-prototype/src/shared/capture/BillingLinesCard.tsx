import { useState } from 'react'
import { Plus } from 'lucide-react'
import { accent, neutral, semantic } from '../../theme/tokens'
import type { BillingLine, Contract, Procedure } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { counterpartyName, removeBillingLine, useAppStore, type Actor, type AppState } from '../../store'
import { AddBillingLineSheet } from './AddBillingLineSheet'
import { CaptureSection, Caption, FailureNotes } from './ui'

interface BillingLinesCardProps {
  procedure: Procedure
  /** The procedure's stored NON-RVG lines (rvg-basis lines are never fee inputs). */
  nonRvgLines: BillingLine[]
  contract?: Contract | undefined
  masters: AppState['masters']
  actor: Actor
  canCapture: boolean
  /** billingLines failures — the Method 3 gate + conservation (verbatim). */
  failures: BillingValidationFailure[]
}

/**
 * The procedure's captured non-RVG billing lines (mockup pattern extended —
 * 5th review #1). A funder-override line is the office's allocation: it names
 * its funder and hides Remove from the anaesthetist (the store guard refuses
 * anyway); the office may remove. Refusals render verbatim.
 */
export function BillingLinesCard({
  procedure,
  nonRvgLines,
  contract,
  masters,
  actor,
  canCapture,
  failures,
}: BillingLinesCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function remove(lineId: string) {
    setError(null)
    const outcome = removeBillingLine(useAppStore, actor, lineId)
    if (!outcome.ok) setError(outcome.message)
  }

  return (
    <CaptureSection label="Billing lines" gap={10}>
      {nonRvgLines.length === 0 && <Caption>No extra billing lines. The RVG fee bills on its own.</Caption>}

      {nonRvgLines.map((line) => {
        const hideRemove = line.funderOverride !== undefined && actor.role === 'anaesthetist'
        return (
          <div key={line.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{line.description}</span>
              {line.chargeBasis === 'rateTime' && line.hours !== undefined && line.rate !== undefined && (
                <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>
                  {line.hours.toFixed(1)} h × ${line.rate.toFixed(2)}
                </span>
              )}
              {line.funderOverride !== undefined && (
                <span style={{ fontSize: 12, color: neutral.slate }}>
                  Billed to {counterpartyName({ masters }, line.funderOverride)}
                </span>
              )}
            </span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, flex: 'none' }}>
              ${line.amount.toFixed(2)}
            </span>
            {canCapture && !hideRemove && (
              <button
                type="button"
                onClick={() => remove(line.id)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  color: semantic.error.onTint,
                  cursor: 'pointer',
                  flex: 'none',
                }}
              >
                Remove
              </button>
            )}
          </div>
        )
      })}

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
          {error}
        </div>
      )}

      {canCapture && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minHeight: 44,
            borderRadius: 999,
            border: 'none',
            background: accent.tint,
            color: accent.pressed,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden /> Add billing line
        </button>
      )}

      <FailureNotes failures={failures} />

      <AddBillingLineSheet
        open={sheetOpen}
        procedure={procedure}
        contract={contract}
        actor={actor}
        onClose={() => setSheetOpen(false)}
      />
    </CaptureSection>
  )
}

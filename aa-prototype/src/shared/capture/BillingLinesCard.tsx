import { useState } from 'react'
import { Plus } from 'lucide-react'
import { neutral, semantic } from '../../theme/tokens'
import type { BillingLine, Contract, Procedure } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { removeBillingLine, useAppStore, type Actor } from '../../store'
import { AddBillingLineSheet } from './AddBillingLineSheet'
import { CaptureSection, Caption, FailureNotes } from './ui'
import { Button } from '../ui/Button'
import { TextAction } from '../ui/TextAction'

interface BillingLinesCardProps {
  procedure: Procedure
  /** The procedure's stored NON-RVG lines (rvg-basis lines are never fee inputs). */
  nonRvgLines: BillingLine[]
  contract?: Contract | undefined
  actor: Actor
  canCapture: boolean
  /** billingLines failures: the Method 3 gate (verbatim). */
  failures: BillingValidationFailure[]
}

/**
 * The procedure's captured non-RVG billing lines (mockup pattern extended,
 * 5th review #1). Who pays is the Procedure's Contract or its split (catch-up
 * Phase 22), never a line. Refusals render verbatim.
 */
export function BillingLinesCard({
  procedure,
  nonRvgLines,
  contract,
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

  // The add action is the card's foot, not the tail of the list: matched in
  // height against a tall Adjustment card it would otherwise float in the
  // middle of a mostly empty card.
  const footer =
    canCapture || failures.length > 0 ? (
      <>
        {canCapture && (
          <Button
            variant="pill"
            data-validation-procedure-id={procedure.id}
            data-validation-fields="billingLines"
            onClick={() => setSheetOpen(true)}
            style={{ gap: 6 }}
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden /> Add billing line
          </Button>
        )}
        <FailureNotes failures={failures} />
      </>
    ) : null

  return (
    <CaptureSection
      label="Billing lines"
      gap={10}
      footer={footer}
      validationTarget={{ procedureId: procedure.id, fields: ['billingLines'] }}
    >
      {nonRvgLines.length === 0 && <Caption>No extra billing lines. The RVG fee bills on its own.</Caption>}

      {nonRvgLines.map((line) => {
        return (
          <div key={line.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{line.description}</span>
              {line.chargeBasis === 'rateTime' && line.hours !== undefined && line.rate !== undefined && (
                <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>
                  {line.hours.toFixed(1)} h × ${line.rate.toFixed(2)}
                </span>
              )}
            </span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, flex: 'none' }}>
              ${line.amount.toFixed(2)}
            </span>
            {canCapture && (
              <TextAction flush onClick={() => remove(line.id)} style={{ fontSize: 13, flex: 'none' }}>
                Remove
              </TextAction>
            )}
          </div>
        )
      })}

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
          {error}
        </div>
      )}

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

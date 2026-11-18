/**
 * The row panel's decision (catch-up Phase 33; US-02.1.2; AR-21
 * `create-booking`): the shared `RadioCard`s on the one radio keyboard model,
 * the suggested one marked "Suggested" (the Contract rail's pill). The
 * selected card opens its own controls (the List picker, the candidates for a
 * new List, the surgeon picker, the reject reason), passed in by the panel.
 */

import type { ReactNode } from 'react'
import { Pill, RadioCard, useRovingRadio } from '../../../shared/ui'

export type DecisionKind = 'match' | 'createBooking' | 'createList' | 'createDraft' | 'reject'

export interface DecisionOption {
  kind: DecisionKind
  title: string
  description: string
  /** Why the option cannot be chosen, shown on the card. */
  disabledReason?: string
}

export function DecisionCards({
  options,
  value,
  suggested,
  onChange,
  detail,
}: {
  options: readonly DecisionOption[]
  value: DecisionKind | undefined
  suggested: DecisionKind | undefined
  onChange: (kind: DecisionKind) => void
  /** The chosen card's own controls. */
  detail: ReactNode
}) {
  const { groupProps, itemProps } = useRovingRadio({
    values: options.map((o) => o.kind),
    value,
    onChange,
    isDisabled: (k) => options.find((o) => o.kind === k)?.disabledReason !== undefined,
  })
  return (
    <div {...groupProps} aria-label="Decision" data-shot="matching-decision" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((o, i) => (
        <RadioCard
          key={o.kind}
          radio={itemProps(i)}
          checked={o.kind === value}
          onSelect={() => onChange(o.kind)}
          title={o.title}
          titleExtra={o.kind === suggested ? <Pill size="sm">Suggested</Pill> : undefined}
          description={o.description}
          disabledReason={o.disabledReason}
          data-decision={o.kind}
        >
          {detail}
        </RadioCard>
      ))}
    </div>
  )
}

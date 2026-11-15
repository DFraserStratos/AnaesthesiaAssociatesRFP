import { useMemo, useState } from 'react'
import { billingMonitor, useAppStore } from '@proto/store'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Echo } from '../pilot-a/Echo'

type StageState = 'done' | 'partial' | 'failed' | 'pending'
interface Stage {
  key: string
  label: string
  state: StageState
  detail: string
}

/** STAGE_TONE as Badge variants: done success, partial warning, failed error, pending the neutral pill. */
const VARIANT: Record<StageState, 'success' | 'warning' | 'error' | 'default'> = {
  done: 'success',
  partial: 'warning',
  failed: 'error',
  pending: 'default',
}

const SAMPLE: Stage[] = [
  { key: 'authorised', label: 'Authorised', state: 'done', detail: 'Authorised by the office' },
  { key: 'run', label: 'Billing run', state: 'done', detail: 'Run complete' },
  { key: 'invoices', label: '3 invoices', state: 'partial', detail: '1 failed' },
  { key: 'emailed', label: 'Emailed', state: 'pending', detail: 'Waiting' },
  { key: 'xero', label: 'Xero', state: 'pending', detail: 'Waiting' },
]

/**
 * The billing monitor's per-List stepper: each stage a Badge (the tint pairs
 * of STAGE_TONE) joined by arrows, its detail in a Base UI Tooltip instead of
 * the native title. As in the catalogue example the chips are buttons, so a
 * click also writes the detail below; the list is an ordered list of steps.
 */
export function PipelineStepperReplacement() {
  const schedule = useAppStore((s: { schedule: unknown }) => s.schedule)
  const billing = useAppStore((s: { billing: unknown }) => s.billing)
  const masters = useAppStore((s: { masters: unknown }) => s.masters)
  const rows = useMemo(() => billingMonitor({ schedule, billing, masters }) as { anaesthetistName: string; stages: Stage[] }[], [schedule, billing, masters])
  const live = rows[0]
  const stages = live !== undefined ? live.stages : SAMPLE
  const [index, setIndex] = useState(0)
  return (
    <TooltipProvider delay={300}>
      <div className="tw:flex tw:flex-col tw:gap-2.5">
        <div className="tw:text-[12.5px] tw:text-slate">
          {live !== undefined ? `${live.anaesthetistName} · live from the billing monitor` : 'No List has been billed yet: sample stages (authorise a List to see live ones).'}
        </div>
        <ol aria-label="Billing stages" className="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:items-center tw:gap-1.5 tw:p-0">
          {stages.map((stage, i) => (
            <li key={stage.key} className="tw:flex tw:items-center tw:gap-1.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge
                      variant={VARIANT[stage.state]}
                      render={<button type="button" onClick={() => setIndex(i)} aria-label={`${stage.label}: ${stage.detail}`} />}
                      className="tw:cursor-pointer tw:px-2.5 tw:py-1 tw:text-[11.5px] tw:leading-4"
                    />
                  }
                >
                  {stage.label}
                </TooltipTrigger>
                <TooltipContent>{stage.detail}</TooltipContent>
              </Tooltip>
              {i < stages.length - 1 && (
                <span aria-hidden className="tw:text-[13px] tw:text-line-strong">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
        <Echo>{stages[index]?.detail}</Echo>
      </div>
    </TooltipProvider>
  )
}

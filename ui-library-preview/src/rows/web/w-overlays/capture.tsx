import type { ReactNode } from 'react'
import { NumberField } from '@base-ui/react/number-field'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { editRefusal, useAppStore } from '@proto/store'
import { isAssignedList } from '@proto/domain/draftLists'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { cn } from '@/lib/utils'
import { Missing, type WebFixtures } from './shared'

/** The fields of the seeded Procedure the capture rows read. */
export interface Procedure {
  id: string
  bookingId: string
  rvgGroupId?: string
  baseUnitsSelected?: number
  baseUnitsCaptured?: { units: number; source: string }
  timeUnitsCaptured?: { units: number; source: string }
  modifierUnitsCaptured?: { units: number; source: string }
  anaestheticStartISO?: string
  handoverISO?: string
  isAdditional: boolean
  priceOverride?: { kind: 'dollarAdjustment' | 'fixedFee'; amount: number; reason: string } | { kind: 'percentAdjustment'; percent: number; reason: string }
}

export interface CaptureCtx {
  f: WebFixtures
  procedure: Procedure
  list: unknown
  canCapture: boolean
}

/**
 * The catalogue's CaptureHost, read only: the seeded Booking's first Procedure,
 * its List and whether it can be captured. The replacement cards copy the
 * Procedure into local state and never write it back.
 */
export function CaptureHost({ children }: { children: (ctx: CaptureCtx) => ReactNode }) {
  const f = useWebFixtures() as WebFixtures
  const c = f.capture
  const procedure = useAppStore((s: { schedule: { procedures: Record<string, Procedure> } }) => (c !== undefined ? s.schedule.procedures[c.procedureId] : undefined))
  const list = useAppStore((s: { schedule: { lists: Record<string, unknown> } }) => (c !== undefined ? s.schedule.lists[c.listId] : undefined))
  const completed = useAppStore((s: { schedule: { bookings: Record<string, { completed?: boolean }> } }) =>
    c !== undefined ? s.schedule.bookings[c.bookingId]?.completed === true : false,
  )
  if (procedure === undefined || list === undefined) return <Missing what="Booking still to capture" />
  const canCapture = isAssignedList(list) && editRefusal(f.actor, list) === null && !completed
  return <>{children({ f, procedure, list, canCapture })}</>
}

/**
 * A labelled stepper on Base UI NumberField: minus, the mono value (a
 * spinbutton you can type into, arrow keys step it) and plus, each button
 * named ("Fewer base units"). Floor `min`, no ceiling, whole numbers.
 */
export function UnitsStepper({
  label,
  value,
  onChange,
  min = 0,
  className,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  min?: number
  className?: string
}) {
  return (
    <NumberField.Root
      value={value}
      min={min}
      step={1}
      onValueChange={(v) => {
        if (v !== null && Number.isFinite(v)) onChange(Math.max(min, Math.round(v)))
      }}
      className={cn('tw:flex-none', className)}
    >
      <NumberField.Group className="tw:flex tw:items-center tw:gap-3">
        <NumberField.Decrement aria-label={`Fewer ${label}`} className={STEP_BUTTON}>
          <MinusIcon aria-hidden className="tw:size-4" strokeWidth={2.4} />
        </NumberField.Decrement>
        <NumberField.Input
          aria-label={label}
          className="tw:h-11 tw:w-11 tw:rounded-ctl tw:border tw:border-transparent tw:bg-transparent tw:text-center tw:font-mono tw:text-xl tw:font-bold tw:text-ink tw:tabular-nums tw:outline-none tw:hover:border-dashed tw:hover:border-line-strong tw:focus-visible:border-solid tw:focus-visible:border-primary tw:focus-visible:shadow-focus"
        />
        <NumberField.Increment aria-label={`More ${label}`} className={STEP_BUTTON}>
          <PlusIcon aria-hidden className="tw:size-4" strokeWidth={2.4} />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  )
}

/** The prototype's 44px round-square stepper button, in kit tokens. */
export const STEP_BUTTON =
  'tw:flex tw:size-11 tw:flex-none tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-[12px] tw:border tw:border-line tw:bg-surface tw:text-slate tw:outline-none tw:hover:bg-sunken tw:focus-visible:border-primary tw:focus-visible:shadow-focus tw:disabled:cursor-default tw:disabled:text-line-strong tw:disabled:hover:bg-surface tw:data-disabled:cursor-default tw:data-disabled:text-line-strong tw:data-disabled:hover:bg-surface'

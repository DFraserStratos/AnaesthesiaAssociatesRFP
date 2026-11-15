import { useMemo, useState } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useAppStore } from '@proto/store'
import { isAssignedList } from '@proto/domain/draftLists'
import { describeTimeRule, resolveStartingUnits } from '@proto/domain/billing'
import { procedureFee } from '@proto/shared/capture/feeContext'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CaptureHost, UnitsStepper, type Procedure } from './capture'
import { CaptureCard, Echo } from './shared'

/** shadcn Button outline at the prototype's 44px round-square stepper size. */
const STEPPER = 'tw:size-11 tw:rounded-[12px]! tw:text-slate tw:disabled:text-line-strong'

type UnitsField = 'baseUnitsCaptured' | 'timeUnitsCaptured' | 'modifierUnitsCaptured'
type Captured = { units: number; source: 'overridden' }
type Patch = Partial<Record<UnitsField, Captured | undefined>>

interface Resolved {
  units: number
  source: string
}
interface ModifierItem {
  code: string
  units: number
  origin: string
  refused?: unknown
  modifierId?: string
  label?: string
  detail?: string
  explanation?: string
}
interface Btm {
  base: Resolved
  baseSource: 'rvgGroup' | 'chosen' | 'overridden' | 'none'
  baseOutsideGuide: boolean
  time: Resolved
  modifiers: Resolved
  modifierItems: ModifierItem[]
}

export type StepperKind = 'buttons' | 'spinbutton'

export function UnitsCardReplacement({ stepper }: { stepper: StepperKind }) {
  return <CaptureHost>{({ procedure, list, canCapture }) => <Units seeded={procedure} list={list} canCapture={canCapture} stepper={stepper} />}</CaptureHost>
}

/**
 * The B / T / M rows on shadcn Card. The values are the prototype's own fee
 * calculator (`procedureFee`) run over the seeded Procedure plus a LOCAL patch
 * of captured units, so provenance, captions and "Use seeded value" behave as
 * today without writing the store. The stepper is either named Buttons around
 * the value (today's anatomy, now "Fewer base units" / "More base units") or a
 * Base UI NumberField spinbutton you can also type into and arrow through.
 * The itemised modifiers list (ModifiersSection) follows as a plain static stand-in.
 */
function Units({ seeded, list, canCapture, stepper }: { seeded: Procedure; list: unknown; canCapture: boolean; stepper: StepperKind }) {
  const masters = useAppStore((s: { masters: unknown }) => s.masters) as { rvgTimeRule: unknown; rvgGroups: Record<string, unknown> }
  const billingLines = useAppStore((s: { schedule: { billingLines: unknown } }) => s.schedule.billingLines)
  const patientId = useAppStore((s: { schedule: { bookings: Record<string, { patientId: string }> } }) => s.schedule.bookings[seeded.bookingId]?.patientId)
  const [patch, setPatch] = useState<Patch>({})
  const [said, setSaid] = useState('Local only: steps are not saved.')

  const view = useMemo(() => {
    if (!isAssignedList(list)) return undefined
    return procedureFee({ procedure: { ...seeded, ...patch }, list, masters, billingLines, patientId }) as { fee: { btm: Btm }; rvgGroup?: unknown }
  }, [seeded, patch, list, masters, billingLines, patientId])
  if (view === undefined) return null
  const btm = view.fee.btm
  const add = seeded.isAdditional
  const startM = view.rvgGroup !== undefined ? (resolveStartingUnits({ group: view.rvgGroup }) as { modifier: { units: number } }).modifier.units : 0

  const step = (field: UnitsField) => (next: number) => setPatch((p) => ({ ...p, [field]: { units: Math.max(0, next), source: 'overridden' } }))
  const reset = (field: UnitsField) => () => setPatch((p) => ({ ...p, [field]: undefined }))

  return (
    <>
      <CaptureCard label="Units" className="tw:gap-3.5">
        <Row
          title="B · Base"
          noun="base units"
          value={btm.base.units}
          overridden={btm.base.source === 'overridden'}
          overriddenLabel={`Set manually${btm.baseOutsideGuide ? ', outside the guide range' : ''}`}
          warn={btm.baseOutsideGuide && !add}
          caption={add ? 'Not charged on an additional procedure' : baseCaption(btm)}
          steppable={canCapture && !add}
          stepper={stepper}
          onChange={step('baseUnitsCaptured')}
          onReset={canCapture && !add ? reset('baseUnitsCaptured') : undefined}
        />
        <Row
          title="T · Time"
          noun="time units"
          value={btm.time.units}
          overridden={btm.time.source === 'overridden'}
          caption="From start and finish stamps · RVG time tiers"
          captionTip={describeTimeRule(masters.rvgTimeRule) as string}
          steppable={canCapture}
          stepper={stepper}
          onChange={step('timeUnitsCaptured')}
          onReset={canCapture ? reset('timeUnitsCaptured') : undefined}
        />
        <Row
          title="M · Modifiers"
          noun="modifier units"
          value={btm.modifiers.units}
          overridden={btm.modifiers.source === 'overridden'}
          caption={add ? 'Not charged on an additional procedure' : modifierBreakdown(btm.modifierItems, startM)}
          steppable={canCapture && !add}
          stepper={stepper}
          onChange={step('modifierUnitsCaptured')}
          onReset={canCapture && !add ? reset('modifierUnitsCaptured') : undefined}
        />
        <ModifiersStandIn items={btm.modifierItems} editable={canCapture} onAction={setSaid} />
      </CaptureCard>
      <Echo>{said}</Echo>
    </>
  )
}

function modifierBreakdown(items: readonly ModifierItem[], start: number): string {
  const parts = items
    .filter((i) => i.refused === undefined)
    .map((i) => (i.origin === 'age' ? `${i.code} age +${i.units}` : i.origin === 'included' ? `${i.code} included 0` : `${i.code} +${i.units}`))
  if (start !== 0) parts.unshift(`Starting value ${start} from the RVG group`)
  return parts.length > 0 ? parts.join(' · ') : 'None applied'
}

function baseCaption(btm: Btm): string {
  const outside = btm.baseOutsideGuide ? ', outside the guide range' : ''
  switch (btm.baseSource) {
    case 'rvgGroup':
      return 'From the RVG group'
    case 'chosen':
      return `Chosen${outside}`
    case 'overridden':
      return `Set manually${outside}`
    default:
      return 'No RVG code'
  }
}

function Row({
  title,
  noun,
  value,
  overridden,
  overriddenLabel = 'Adjusted manually',
  warn = false,
  caption,
  captionTip,
  steppable,
  stepper,
  onChange,
  onReset,
}: {
  title: string
  noun: string
  value: number
  overridden: boolean
  overriddenLabel?: string
  warn?: boolean
  caption: string
  captionTip?: string
  steppable: boolean
  stepper: StepperKind
  onChange: (next: number) => void
  onReset: (() => void) | undefined
}) {
  const tone = warn ? 'tw:text-warning-on-tint' : undefined
  return (
    <div className="tw:flex tw:items-center tw:gap-3">
      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
        <span className="tw:text-[15px] tw:font-semibold">{title}</span>
        {overridden ? (
          <span className={cn('tw:text-xs tw:text-slate', tone)}>
            {overriddenLabel}
            {onReset !== undefined && (
              <>
                {' · '}
                <Button variant="link" className="tw:text-xs" onClick={onReset}>
                  Use seeded value
                </Button>
              </>
            )}
          </span>
        ) : captionTip !== undefined ? (
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className={cn('tw:w-fit tw:cursor-help tw:text-xs tw:text-mist tw:outline-none tw:focus-visible:shadow-focus', tone)} />}>
              {caption}
            </TooltipTrigger>
            <TooltipContent>{captionTip}</TooltipContent>
          </Tooltip>
        ) : (
          <span className={cn('tw:text-xs tw:text-mist', tone)}>{caption}</span>
        )}
      </span>
      {steppable && stepper === 'spinbutton' ? (
        <UnitsStepper label={noun} value={value} onChange={onChange} />
      ) : (
        <>
          {steppable && (
            <Button variant="outline" size="icon-lg" aria-label={`Fewer ${noun}`} disabled={value <= 0} onClick={() => onChange(value - 1)} className={STEPPER}>
              <MinusIcon aria-hidden strokeWidth={2.4} />
            </Button>
          )}
          <output aria-label={noun} aria-live="polite" className="tw:w-9 tw:text-center tw:font-mono tw:text-xl tw:font-bold tw:tabular-nums">
            {value}
          </output>
          {steppable && (
            <Button variant="outline" size="icon-lg" aria-label={`More ${noun}`} onClick={() => onChange(value + 1)} className={STEPPER}>
              <PlusIcon aria-hidden strokeWidth={2.4} />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

/**
 * The itemised modifiers list under the rows (ModifiersSection), as a plain static stand-in: the
 * same items from the fee calculator, Applied marks, units and notes; Add and Remove only report.
 */
function ModifiersStandIn({ items, editable, onAction }: { items: readonly ModifierItem[]; editable: boolean; onAction: (s: string) => void }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5 tw:border-t tw:border-line tw:pt-3">
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
        <span className="tw:text-[13px] tw:font-semibold tw:text-slate">Modifiers</span>
        {editable && (
          <Button variant="link" className="tw:text-[13px] tw:font-semibold" onClick={() => onAction('Add a modifier: would open the modifier picker (not rebuilt here).')}>
            Add a modifier
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="tw:text-[13px] tw:leading-[18px] tw:text-mist">No modifiers. Add any that apply, each with a short reason.</div>
      ) : (
        <div role="list" aria-label="Modifiers on this procedure" className="tw:flex tw:flex-col tw:gap-0.5">
          {items.map((item, i) => {
            const applied = item.origin !== 'chosen'
            const note = applied ? `${item.detail ?? ''}${item.detail !== undefined ? '.' : ''}${item.origin === 'included' ? ' Cannot be added twice.' : ''}` : (item.explanation ?? '')
            return (
              <div role="listitem" key={`${item.modifierId ?? item.code}-${i}`} className="tw:grid tw:grid-cols-[auto_minmax(0,1fr)_auto] tw:items-baseline tw:gap-x-3 tw:gap-y-1 tw:py-1.5">
                <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-pill tw:bg-sunken tw:px-2 tw:py-0.5 tw:font-mono tw:text-[11.5px] tw:font-semibold tw:text-slate">
                  {item.code}
                  {applied && <span className="tw:font-sans tw:text-[10.5px] tw:text-mist">Applied</span>}
                </span>
                <span className="tw:min-w-0 tw:text-sm tw:leading-[19px] tw:text-ink">{item.label ?? item.code}</span>
                <span className={cn('tw:min-w-7 tw:text-right tw:font-mono tw:text-sm tw:font-bold', item.refused !== undefined ? 'tw:text-mist' : 'tw:text-ink')}>
                  {item.origin === 'chosen' && item.refused === undefined ? `+${item.units}` : item.units}
                </span>
                <span />
                <span className="tw:text-[12.5px] tw:text-mist">{note}</span>
                {editable ? (
                  <Button variant="link" className="tw:justify-self-end tw:text-[12.5px] tw:font-semibold" aria-label={`Remove ${item.code}`} onClick={() => onAction(`Remove ${item.code}: would write to the demo data (not rebuilt here).`)}>
                    Remove
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="tw:text-xs tw:text-mist">Values from the NZSA RVG 2021 modifier table. Age, and any modifier the base units include, are applied for you and can be removed.</div>
    </div>
  )
}

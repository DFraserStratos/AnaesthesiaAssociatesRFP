import { useId, useMemo, useState } from 'react'
import { Radio } from '@base-ui/react/radio'
import { vacatedChoices } from '@proto/domain/listMoves'
import { useAppStore } from '@proto/store'
import { resolveDisplayStatus } from '@proto/shared/status/useSlotStatuses'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { Echo, STATUS_SWATCH, type BadgeStatus } from './parts'

interface Status {
  colour: BadgeStatus
  retiredAtISO?: string
}

/**
 * StatusRadioGroup on shadcn RadioGroup (Base UI RadioGroup): one tab stop,
 * arrow keys move the choice, radio / aria-checked from the library. `chips`
 * renders each Radio.Root as today's status chip (swatch and label, teal
 * outline and tint when chosen); `dots` uses the kit's radio dot with a label.
 */
export function StatusRadioGroup({
  label,
  choices,
  value,
  onChange,
  look = 'chips',
}: {
  label: string
  choices: readonly string[]
  value: string
  onChange: (key: string) => void
  look?: 'chips' | 'dots'
}) {
  const statuses: Record<string, Status> = useAppStore((s: { masters: { slotStatuses: Record<string, Status> } }) => s.masters.slotStatuses)
  const labelId = useId()
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <span id={labelId} className="tw:text-[13px] tw:font-semibold tw:text-ink">
        {label}
      </span>
      <RadioGroup aria-labelledby={labelId} value={value} onValueChange={(v) => onChange(v as string)} className={look === 'chips' ? 'tw:flex tw:flex-wrap tw:gap-2' : 'tw:flex tw:flex-wrap tw:gap-x-5 tw:gap-y-2'}>
        {choices.map((k) => {
          const r = resolveDisplayStatus(k, statuses) as { label: string }
          const swatch = STATUS_SWATCH[statuses[k]?.colour ?? 'free']
          if (look === 'dots') {
            const id = `${labelId}-${k}`
            return (
              <div key={k} className="tw:flex tw:items-center tw:gap-2">
                <RadioGroupItem id={id} value={k} />
                <Label htmlFor={id} className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:text-ink">
                  <span aria-hidden className={cn('tw:size-3 tw:rounded-[4px]', swatch)} />
                  {r.label}
                </Label>
              </div>
            )
          }
          return (
            <Radio.Root
              key={k}
              value={k}
              className={cn(
                'tw:inline-flex tw:h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-pill tw:border tw:border-line tw:bg-surface tw:px-3.5 tw:text-[13px] tw:font-semibold tw:text-ink tw:outline-none tw:focus-visible:shadow-focus',
                'tw:data-checked:border-2 tw:data-checked:border-primary tw:data-checked:bg-teal-tint tw:data-checked:px-[13px]',
              )}
            >
              <span aria-hidden className={cn('tw:size-3 tw:rounded-[4px]', swatch)} />
              {r.label}
            </Radio.Root>
          )
        })}
      </RadioGroup>
    </div>
  )
}

/** VacatedSessionChoice: a plain move offers Free, then Unavailable (retired statuses dropped). */
export function VacatedChoiceReplacement({ look = 'chips' }: { look?: 'chips' | 'dots' }) {
  const statuses: Record<string, Status> = useAppStore((s: { masters: { slotStatuses: Record<string, Status> } }) => s.masters.slotStatuses)
  const choices = useMemo(() => (vacatedChoices(undefined) as string[]).filter((k) => statuses[k] !== undefined && statuses[k]?.retiredAtISO === undefined), [statuses])
  const [value, setValue] = useState('free')
  return (
    <div>
      <StatusRadioGroup label="Dr Strand's session after the move" choices={choices} value={value} onChange={setValue} look={look} />
      <Echo>Chosen: {value}</Echo>
    </div>
  )
}

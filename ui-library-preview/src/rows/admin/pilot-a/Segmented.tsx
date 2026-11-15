import { useId, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Echo } from './Echo'
import { FieldLabel } from '@/components/ui/field'

type StatusFilter = 'active' | 'retired' | 'all'

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'all', label: 'All' },
]

/**
 * Segmented on a single-select ToggleGroup: the teal variant (today's look) or the white pill on sunken. Base UI gives
 * roving focus with arrow keys; the group and items are given radiogroup and
 * radio roles (aria-checked) so the control reads as one choice, and an
 * attempt to unpress the selected item is ignored so one option is always on.
 */
export function SegmentedReplacement({ variant = 'teal' }: { variant?: 'teal' | 'default' }) {
  const [value, setValue] = useState<StatusFilter>('active')
  const labelId = useId()
  return (
    <div className="tw:max-w-[360px]">
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <FieldLabel id={labelId}>Status</FieldLabel>
        <ToggleGroup
          variant={variant}
          role="radiogroup"
          aria-labelledby={labelId}
          className="tw:w-full"
          value={[value]}
          onValueChange={(next) => {
            const picked = next[0] as StatusFilter | undefined
            if (picked !== undefined) setValue(picked)
          }}
        >
          {OPTIONS.map((o) => (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              role="radio"
              aria-checked={o.value === value}
              aria-pressed={undefined}
              className="tw:min-w-0"
            >
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Echo>Showing: {value}</Echo>
    </div>
  )
}

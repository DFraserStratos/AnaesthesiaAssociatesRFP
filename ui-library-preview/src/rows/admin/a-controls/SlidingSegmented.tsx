import { useId, useState, type ReactNode } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { Tabs } from '@base-ui/react/tabs'
import { cn } from '@/lib/utils'

export type SlideVariant = 'teal' | 'surface' | 'ink'

/** The three indicator looks of SlidingSegmentedControl, as token classes. */
const LOOK: Record<SlideVariant, { indicator: string; active: string }> = {
  teal: { indicator: 'tw:bg-primary tw:shadow-[0_1px_3px_rgba(23,35,32,0.2)]', active: 'tw:text-white' },
  surface: { indicator: 'tw:bg-surface tw:shadow-[0_1px_3px_rgba(23,35,32,0.15)]', active: 'tw:text-primary' },
  ink: { indicator: 'tw:bg-ink tw:shadow-[0_1px_3px_rgba(23,35,32,0.18)]', active: 'tw:text-white' },
}

const TRACK = 'tw:relative tw:flex tw:gap-1 tw:rounded-[12px] tw:bg-sunken tw:p-1'
const CELL =
  'tw:relative tw:min-h-10 tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:rounded-[9px] tw:border-0 tw:bg-transparent tw:px-3 tw:text-sm tw:font-semibold tw:text-slate tw:transition-colors tw:duration-150 tw:outline-none tw:focus-visible:shadow-focus'

/** The selectionSlide motion pattern: 180 ms on the card easing. */
const SLIDE = { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] as const }

interface Option<T extends string> {
  value: T
  label: ReactNode
}

interface ControlProps<T extends string> {
  ariaLabel: string
  value: T
  options: readonly Option<T>[]
  onSelect: (v: T) => void
  variant: SlideVariant
}

/**
 * Option 1: a single-select Base UI ToggleGroup (radio semantics, roving focus) whose
 * selected pill is a Motion `layoutId` element, so it slides between cells as today.
 */
function SlidingToggleGroup<T extends string>({ ariaLabel, value, options, onSelect, variant }: ControlProps<T>) {
  const id = useId()
  const look = LOOK[variant]
  return (
    <LayoutGroup id={id}>
      <ToggleGroup
        role="radiogroup"
        aria-label={ariaLabel}
        className={TRACK}
        value={[value]}
        onValueChange={(next) => {
          const picked = next[0] as T | undefined
          if (picked !== undefined) onSelect(picked)
        }}
      >
        {options.map((o) => {
          const selected = o.value === value
          return (
            <Toggle
              key={o.value}
              value={o.value}
              role="radio"
              aria-checked={selected}
              aria-pressed={undefined}
              className={cn(CELL, selected && look.active)}
            >
              {selected && (
                <motion.span aria-hidden layoutId="pill" transition={SLIDE} className={cn('tw:absolute tw:inset-0 tw:rounded-[9px]', look.indicator)} />
              )}
              <span className="tw:relative">{o.label}</span>
            </Toggle>
          )
        })}
      </ToggleGroup>
    </LayoutGroup>
  )
}

/**
 * Option 2: Base UI Tabs (tablist, arrow keys) with its own Tabs.Indicator, which Base UI
 * sizes and positions from CSS variables; a CSS transition makes it slide. No Motion needed.
 */
function SlidingTabs<T extends string>({ ariaLabel, value, options, onSelect, variant }: ControlProps<T>) {
  const look = LOOK[variant]
  return (
    <Tabs.Root value={value} onValueChange={(v) => onSelect(v as T)}>
      <Tabs.List aria-label={ariaLabel} className={TRACK}>
        <Tabs.Indicator
          className={cn(
            'tw:absolute tw:top-(--active-tab-top) tw:left-(--active-tab-left) tw:h-(--active-tab-height) tw:w-(--active-tab-width) tw:rounded-[9px] tw:transition-[left,top,width,height] tw:duration-180 tw:ease-card',
            look.indicator,
          )}
        />
        {options.map((o) => (
          <Tabs.Tab key={o.value} value={o.value} className={cn(CELL, o.value === value && look.active)}>
            <span className="tw:relative">{o.label}</span>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}

export function SlidingSegmentedReplacement({ kind = 'toggle' }: { kind?: 'toggle' | 'tabs' }) {
  const [session, setSession] = useState<'AM' | 'PM' | 'OOH'>('AM')
  const [variant, setVariant] = useState<SlideVariant>('teal')
  const Control = kind === 'tabs' ? SlidingTabs : SlidingToggleGroup
  return (
    <div className="tw:flex tw:max-w-[360px] tw:flex-col tw:gap-3">
      <Control
        ariaLabel="Session"
        value={session}
        variant={variant}
        options={[
          { value: 'AM', label: 'AM' },
          { value: 'PM', label: 'PM' },
          { value: 'OOH', label: 'Out of hours' },
        ]}
        onSelect={setSession}
      />
      <Control
        ariaLabel="Variant"
        value={variant}
        variant="surface"
        options={[
          { value: 'teal', label: 'teal' },
          { value: 'surface', label: 'surface' },
          { value: 'ink', label: 'ink' },
        ]}
        onSelect={setVariant}
      />
    </div>
  )
}

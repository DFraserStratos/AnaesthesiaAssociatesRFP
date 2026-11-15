import { useId, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Echo, Knobs, radioItemRender } from './shared'

export type SegmentVariant = 'surface' | 'teal' | 'ink'

/** Selected text and highlight per variant (the prototype's VARIANT_STYLE, in tokens). */
const SELECTED_TEXT: Record<SegmentVariant, string> = {
  surface: 'tw:aria-pressed:text-primary! tw:data-pressed:text-primary!',
  teal: 'tw:aria-pressed:text-white! tw:data-pressed:text-white!',
  ink: 'tw:aria-pressed:text-white! tw:data-pressed:text-white!',
}
const HIGHLIGHT: Record<SegmentVariant, string> = {
  surface: 'tw:bg-surface tw:shadow-[0_1px_3px_rgba(23,35,32,0.15)]',
  teal: 'tw:bg-primary tw:shadow-[0_1px_3px_rgba(23,35,32,0.2)]',
  ink: 'tw:bg-ink tw:shadow-[0_1px_3px_rgba(23,35,32,0.18)]',
}
const PRESSED_BG: Record<SegmentVariant, string> = {
  surface: 'tw:aria-pressed:bg-surface! tw:data-pressed:bg-surface! tw:data-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.15)]!',
  teal: 'tw:aria-pressed:bg-primary! tw:data-pressed:bg-primary! tw:data-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.2)]!',
  ink: 'tw:aria-pressed:bg-ink! tw:data-pressed:bg-ink! tw:data-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.18)]!',
}
const CLEAR_BG = 'tw:aria-pressed:bg-transparent! tw:data-pressed:bg-transparent! tw:aria-pressed:shadow-none! tw:data-pressed:shadow-none!'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

/**
 * The one segmented control (merging SlidingSegmentedControl and Segmented):
 * a single-select ToggleGroup given radiogroup / radio semantics, roving focus
 * and arrow keys from Base UI, one option always on. `slide` keeps today's
 * travelling highlight as a Motion layoutId span behind the labels (180 ms on
 * the card curve, the prototype's selectionSlide; reduced motion honoured).
 */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  variant = 'teal',
  slide = true,
  ariaLabel,
  itemClassName,
}: {
  value: T
  options: readonly SegmentOption<T>[]
  onChange: (v: T) => void
  variant?: SegmentVariant
  slide?: boolean
  ariaLabel?: string
  itemClassName?: string
}) {
  const layoutId = useId()
  return (
    <MotionConfig reducedMotion="user">
      <ToggleGroup
        role="radiogroup"
        aria-label={ariaLabel}
        className="tw:w-full"
        value={[value]}
        onValueChange={(next) => {
          const picked = next[0] as T | undefined
          if (picked !== undefined) onChange(picked)
        }}
      >
        {options.map((o) => {
          const selected = o.value === value
          return (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              role="radio"
              aria-checked={selected}
              render={radioItemRender}
              className={cn('tw:relative tw:min-w-0 tw:text-sm', SELECTED_TEXT[variant], slide ? CLEAR_BG : PRESSED_BG[variant], itemClassName)}
            >
              {slide && selected && (
                <motion.span
                  aria-hidden
                  layoutId={layoutId}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  className={cn('tw:absolute tw:inset-0 tw:rounded-[9px]', HIGHLIGHT[variant])}
                />
              )}
              <span className="tw:relative">{o.label}</span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </MotionConfig>
  )
}

const WHO = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'free', label: 'Free only' },
  { value: 'mine', label: 'Mine' },
] as const
type Who = (typeof WHO)[number]['value']

/** SlidingSegmentedControl's example: the same three variants on the merged control. */
export function SlidingSegmentedReplacement({ slide = true }: { slide?: boolean }) {
  const [variant, setVariant] = useState<SegmentVariant>('surface')
  const [value, setValue] = useState<Who>('everyone')
  return (
    <>
      <Knobs
        label="Variant"
        value={variant}
        options={[
          { value: 'surface', label: 'surface' },
          { value: 'teal', label: 'teal' },
          { value: 'ink', label: 'ink' },
        ]}
        onChange={setVariant}
      />
      <div className="tw:w-[360px]">
        <SegmentedToggle value={value} options={WHO} onChange={setValue} variant={variant} slide={slide} ariaLabel="Who to show" itemClassName="tw:h-[38px]" />
      </div>
      <Echo>Showing: {WHO.find((w) => w.value === value)!.label}</Echo>
    </>
  )
}

const GST = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biMonthly', label: 'Bi-monthly' },
  { value: 'sixMonthly', label: 'Six-monthly' },
] as const
type GstPeriod = (typeof GST)[number]['value']

/** Segmented's example (the Accounts GST period) on the same merged control, teal. */
export function SegmentedReplacement({ slide = true }: { slide?: boolean }) {
  const [period, setPeriod] = useState<GstPeriod>('monthly')
  return (
    <div className="tw:w-80">
      <SegmentedToggle value={period} options={GST} onChange={setPeriod} variant="teal" slide={slide} ariaLabel="GST period" />
    </div>
  )
}

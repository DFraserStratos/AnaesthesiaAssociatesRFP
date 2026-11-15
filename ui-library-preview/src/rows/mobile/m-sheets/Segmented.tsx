import { useId, useState, type ReactNode } from 'react'
import { LayoutGroup, MotionConfig, motion } from 'motion/react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Col } from './shared'

export type SegVariant = 'teal' | 'surface' | 'ink'

export interface SegOption<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
}

/** The selected pill and label colours per prototype variant (SlidingSegmentedControl VARIANT_STYLE). */
const PILL: Record<SegVariant, string> = {
  teal: 'tw:bg-primary tw:shadow-[0_1px_3px_rgba(23,35,32,0.2)]',
  surface: 'tw:bg-surface tw:shadow-[0_1px_3px_rgba(23,35,32,0.15)]',
  ink: 'tw:bg-ink tw:shadow-[0_1px_3px_rgba(23,35,32,0.18)]',
}
/** The same pill painted by the selected cell itself (no slide). */
const CELL_PILL: Record<SegVariant, string> = {
  teal: 'tw:data-pressed:bg-primary! tw:data-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.2)]!',
  surface: 'tw:data-pressed:bg-surface! tw:data-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.15)]!',
  ink: 'tw:data-pressed:bg-ink! tw:data-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.18)]!',
}
const ACTIVE_TEXT: Record<SegVariant, string> = {
  teal: 'tw:data-pressed:text-white tw:hover:data-pressed:text-white',
  surface: 'tw:data-pressed:text-primary tw:hover:data-pressed:text-primary',
  ink: 'tw:data-pressed:text-white tw:hover:data-pressed:text-white',
}

/**
 * The segmented control on a single-select shadcn ToggleGroup (Base UI): roving focus with
 * arrow keys, radiogroup / radio semantics, one option always on. With `slide`, the selected
 * pill is one Motion element shared by `layoutId`, so it glides to the new cell (today's
 * 180ms selection slide; Motion measures the cell, no hand-written ResizeObserver). Without
 * it, each cell paints its own pill and the selection switches in place.
 */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onSelect,
  variant = 'teal',
  layout = 'row',
  slide = true,
  disabled = false,
  pill = false,
  ariaLabel,
  ariaLabelledBy,
  itemClassName,
}: {
  value: T
  options: readonly SegOption<T>[]
  onSelect: (value: T) => void
  variant?: SegVariant
  layout?: 'row' | 'two-column'
  slide?: boolean
  disabled?: boolean
  /** Fully rounded track and cells (the Balance section's ink pill). */
  pill?: boolean
  ariaLabel?: string
  ariaLabelledBy?: string
  itemClassName?: string
}) {
  const groupId = useId()
  const round = pill ? 'tw:rounded-pill!' : 'tw:rounded-[9px]!'
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={groupId}>
        <ToggleGroup
          role="radiogroup"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          disabled={disabled}
          value={[value]}
          onValueChange={(next) => {
            const picked = next[0] as T | undefined
            if (picked !== undefined) onSelect(picked)
          }}
          className={cn(
            'tw:w-full',
            layout === 'two-column' && 'tw:grid tw:grid-cols-2',
            pill && 'tw:rounded-pill!',
            disabled && 'tw:opacity-55',
          )}
        >
          {options.map((o) => {
            const selected = o.value === value
            return (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                role="radio"
                aria-checked={selected}
                aria-pressed={undefined}
                className={cn(
                  'tw:relative tw:isolate tw:min-h-10 tw:min-w-0 tw:px-3 tw:text-sm tw:text-slate tw:transition-colors tw:duration-150',
                  // The pill is painted by the shared Motion span (slide) or by the cell itself.
                  slide ? 'tw:data-pressed:bg-transparent! tw:data-pressed:shadow-none!' : CELL_PILL[variant],
                  ACTIVE_TEXT[variant],
                  round,
                  itemClassName,
                )}
              >
                {slide && selected && (
                  <motion.span
                    layoutId="pill"
                    aria-hidden
                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                    className={cn('tw:absolute tw:inset-0 tw:-z-10', PILL[variant], pill ? 'tw:rounded-pill' : 'tw:rounded-[9px]')}
                  />
                )}
                {o.label}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </LayoutGroup>
    </MotionConfig>
  )
}

// ---------------------------------------------------------------------------
// SlidingSegmentedControl
// ---------------------------------------------------------------------------

/** The current example's three controls: surface (40px), ink pill and teal ASA. */
export function SlidingSegmentedReplacement({ slide }: { slide: boolean }) {
  const [mode, setMode] = useState<'everyone' | 'free'>('everyone')
  const [section, setSection] = useState<'outstanding' | 'gst'>('outstanding')
  const [asa, setAsa] = useState<string>('2')
  return (
    <Col>
      <SegmentedToggle
        value={mode}
        options={[
          { value: 'everyone', label: 'Everyone' },
          { value: 'free', label: 'Free only' },
        ]}
        onSelect={setMode}
        variant="surface"
        slide={slide}
        ariaLabel="Availability view"
        itemClassName="tw:h-10"
      />
      <SegmentedToggle
        value={section}
        options={[
          { value: 'outstanding', label: 'Outstanding' },
          { value: 'gst', label: 'GST this month' },
        ]}
        onSelect={setSection}
        variant="ink"
        pill
        slide={slide}
        ariaLabel="Balance section"
        itemClassName="tw:min-h-9 tw:px-2.5 tw:text-[13px]"
      />
      <SegmentedToggle
        value={asa}
        options={['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: v }))}
        onSelect={setAsa}
        variant="teal"
        slide={slide}
        ariaLabel="ASA"
      />
    </Col>
  )
}

// ---------------------------------------------------------------------------
// Segmented (field label + control + read-only)
// ---------------------------------------------------------------------------

export function SegmentedFieldReplacement({ slide }: { slide: boolean }) {
  const [value, setValue] = useState<'am' | 'pm' | 'both'>('both')
  const [locked, setLocked] = useState(false)
  const labelId = useId()
  return (
    <Col>
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <FieldLabel id={labelId}>Sessions</FieldLabel>
        <SegmentedToggle
          value={value}
          options={[
            { value: 'am', label: 'AM' },
            { value: 'pm', label: 'PM' },
            { value: 'both', label: 'Both' },
          ]}
          onSelect={setValue}
          disabled={locked}
          slide={slide}
          ariaLabelledBy={labelId}
        />
      </div>
      <Button variant="pill" className="tw:h-11" onClick={() => setLocked((l) => !l)}>
        {locked ? 'Make editable' : 'Make read only'}
      </Button>
    </Col>
  )
}

// ---------------------------------------------------------------------------
// Filter chips (Week / Month / To-Do / Done)
// ---------------------------------------------------------------------------

type Filter = 'week' | 'month' | 'todo' | 'done'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'todo', label: 'To-Do' },
  { key: 'done', label: 'Done' },
]

/**
 * The Lists home filter chips as a single-select ToggleGroup in its outline (spaced) layout:
 * 38px pills, outlined slate at rest, teal filled when on.
 */
export function FilterChipsReplacement() {
  const [filter, setFilter] = useState<Filter>('week')
  return (
    <Col>
      <ToggleGroup
        variant="outline"
        spacing={2}
        role="radiogroup"
        aria-label="Show Lists"
        value={[filter]}
        onValueChange={(next) => {
          const picked = next[0] as Filter | undefined
          if (picked !== undefined) setFilter(picked)
        }}
        className="tw:min-h-[38px] tw:gap-2"
      >
        {FILTERS.map((f) => (
          <ToggleGroupItem
            key={f.key}
            value={f.key}
            role="radio"
            aria-checked={f.key === filter}
            aria-pressed={undefined}
            className="tw:h-[38px] tw:flex-none tw:rounded-pill! tw:border tw:border-line tw:bg-surface tw:px-4 tw:text-[13px] tw:font-semibold tw:text-slate tw:hover:bg-surface tw:data-pressed:border-transparent tw:data-pressed:bg-primary tw:data-pressed:text-white tw:hover:data-pressed:bg-primary"
          >
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="tw:text-[12.5px] tw:text-mist">Filter: {filter}</span>
    </Col>
  )
}

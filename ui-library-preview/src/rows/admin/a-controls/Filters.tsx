import { useMemo, useState } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLegendKeys } from '@proto/shared'
import { Echo, Wide, useStatusBadge } from './shared'

// ---------------------------------------------------------------------------
// StatusLegend (chips): a multiple ToggleGroup of status Badges
// ---------------------------------------------------------------------------

/** One status chip as a pressable Toggle: hidden statuses fade and grey, as today. */
function StatusToggle({ statusKey }: { statusKey: string }) {
  const { label, variant } = useStatusBadge(statusKey)
  return (
    <Toggle
      value={statusKey}
      aria-label={`${label} status`}
      className="tw:group/chip tw:cursor-pointer tw:rounded-pill tw:border-0 tw:bg-transparent tw:p-0 tw:outline-none tw:focus-visible:shadow-focus"
      render={(props, state) => (
        <button {...props} title={`${state.pressed ? 'Hide' : 'Show'} ${label.toLowerCase()} sessions`} />
      )}
    >
      <Badge variant={variant} className="tw:transition-[opacity,filter] tw:duration-150 tw:group-not-data-pressed/chip:opacity-[0.42] tw:group-not-data-pressed/chip:grayscale-[0.7]">
        {label}
      </Badge>
    </Toggle>
  )
}

/**
 * The legend's chips as a Base UI ToggleGroup with `multiple`: pressed = shown.
 * One Tab stop for the group, arrow keys between chips.
 */
export function StatusLegendChips({ shown, onShownChange }: { shown: string[]; onShownChange: (next: string[]) => void }) {
  const keys = useLegendKeys() as string[]
  return (
    <ToggleGroup multiple aria-label="Status filters" value={shown} onValueChange={(v) => onShownChange(v as string[])} className="tw:flex tw:flex-wrap tw:gap-2">
      {keys.map((k) => (
        <StatusToggle key={k} statusKey={k} />
      ))}
    </ToggleGroup>
  )
}

export function StatusLegendReplacement() {
  const keys = useLegendKeys() as string[]
  const [hidden, setHidden] = useState<string[]>([])
  const shown = useMemo(() => keys.filter((k) => !hidden.includes(k)), [keys, hidden])
  return (
    <div>
      <StatusLegendChips shown={shown} onShownChange={(next) => setHidden(keys.filter((k) => !next.includes(k)))} />
      <Echo>{hidden.length === 0 ? 'All statuses shown.' : `Hidden: ${hidden.join(', ')}`}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SignalFilterButton: the DayGrid footer's focus filters
// ---------------------------------------------------------------------------

type FocusFilter = 'attention' | 'conflicts' | 'note' | 'warnings'

/** The four glyphs, drawn as before in the warning solid (the conflict one is the block swatch with its "!"). */
function FilterGlyph({ icon }: { icon: FocusFilter }) {
  if (icon === 'conflicts')
    return (
      <span aria-hidden className="tw:inline-flex tw:h-[13px] tw:w-[22px] tw:items-center tw:justify-end tw:rounded-[4px] tw:border-[1.5px] tw:border-warning tw:bg-warning-tint tw:pr-px">
        <span className="tw:inline-flex tw:size-[9px] tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[7px] tw:font-bold tw:text-white">!</span>
      </span>
    )
  if (icon === 'note') return <span aria-hidden className="tw:size-[7px] tw:rounded-pill tw:bg-ink tw:opacity-55" />
  return (
    <span aria-hidden className="tw:inline-flex tw:size-[13px] tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[9px] tw:font-bold tw:text-white">
      {icon === 'warnings' ? <TriangleAlertIcon strokeWidth={3} style={{ width: 8, height: 8 }} /> : '!'}
    </span>
  )
}

const FILTERS: { value: FocusFilter; label: string }[] = [
  { value: 'attention', label: 'Needs attention' },
  { value: 'conflicts', label: 'Conflict' },
  { value: 'note', label: 'Has note' },
  { value: 'warnings', label: 'Has warnings' },
]

/** The pill look of SignalFilterButton: surface and line at rest, warning tint and solid border when on. */
const FILTER_PILL =
  'tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-pill tw:border tw:border-line tw:bg-surface tw:px-2 tw:py-[3px] tw:text-[11.5px] tw:leading-[18px] tw:text-slate tw:outline-none tw:focus-visible:shadow-focus tw:data-pressed:border-warning tw:data-pressed:bg-warning-tint tw:data-pressed:text-warning-on-tint'

function FilterToggle({ value, label }: { value: FocusFilter; label: string }) {
  return (
    <Toggle value={value} className={FILTER_PILL}>
      <FilterGlyph icon={value} />
      {label}
    </Toggle>
  )
}

export type FilterKeyboard = 'group' | 'separate'

/**
 * The Day grid footer (the status chips, the four focus filters, Reset filters and the
 * count line), rebuilt with an empty roster as the current row shows it. `group`: the
 * four filters are one ToggleGroup (one Tab stop, arrow keys). `separate`: four
 * standalone Toggles, each its own Tab stop, as today's buttons.
 */
export function FocusFiltersReplacement({ keyboard = 'separate' }: { keyboard?: FilterKeyboard }) {
  const keys = useLegendKeys() as string[]
  const [hidden, setHidden] = useState<string[]>([])
  const [focus, setFocus] = useState<FocusFilter[]>([])
  const shown = useMemo(() => keys.filter((k) => !hidden.includes(k)), [keys, hidden])
  const filtered = hidden.length > 0 || focus.length > 0
  const rows = 0
  const matching = 0

  const toggleOne = (f: FocusFilter, pressed: boolean) => setFocus((cur) => (pressed ? [...cur, f] : cur.filter((x) => x !== f)))

  return (
    <Wide minWidth={760}>
      <div className="tw:overflow-hidden tw:rounded-card tw:border tw:border-line tw:bg-surface tw:shadow-e1">
        {/* The DayGrid's timeline header, as a plain static stand-in (07:00 to 18:00, the ruler on an ordinary day). */}
        <div aria-hidden className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-line tw:px-4 tw:py-2.5">
          <span className="tw:w-[100px] tw:flex-none tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase">Anaesthetist</span>
          <div className="tw:flex tw:flex-1 tw:justify-between tw:font-mono tw:text-[11px] tw:text-mist tw:tabular-nums">
            {Array.from({ length: 12 }, (_, i) => `${String(7 + i).padStart(2, '0')}:00`).map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </div>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:bg-background tw:px-4 tw:py-2.5">
          <StatusLegendChips shown={shown} onShownChange={(next) => setHidden(keys.filter((k) => !next.includes(k)))} />
          {keyboard === 'group' ? (
            <ToggleGroup multiple aria-label="List focus filters" value={focus} onValueChange={(v) => setFocus(v as FocusFilter[])} className="tw:inline-flex tw:flex-wrap tw:gap-2">
              {FILTERS.map((f) => (
                <FilterToggle key={f.value} value={f.value} label={f.label} />
              ))}
            </ToggleGroup>
          ) : (
            <div role="group" aria-label="List focus filters" className="tw:inline-flex tw:flex-wrap tw:gap-2">
              {FILTERS.map((f) => (
                <Toggle key={f.value} pressed={focus.includes(f.value)} onPressedChange={(p) => toggleOne(f.value, p)} className={FILTER_PILL}>
                  <FilterGlyph icon={f.value} />
                  {f.label}
                </Toggle>
              ))}
            </div>
          )}
          {filtered && (
            <Button
              variant="link"
              className="tw:px-0.5! tw:py-1! tw:text-[11.5px]"
              onClick={() => {
                setHidden([])
                setFocus([])
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
        <div className="tw:bg-background tw:px-4 tw:pb-3 tw:text-[11px] tw:leading-[1.5] tw:text-mist">
          {matching} of {rows} anaesthetists have matching blocks. Showing 0 of 0 blocks. At production scale (~85) this view pages and virtualises (the legacy
          dashboard's "1 of 3" pager); scale is narrated here, not simulated.
        </div>
      </div>
    </Wide>
  )
}

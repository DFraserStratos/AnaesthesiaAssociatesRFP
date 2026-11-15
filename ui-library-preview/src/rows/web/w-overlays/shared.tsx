import { useCallback, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { FlaskConical } from 'lucide-react'
import { useDisplayStatus } from '@proto/shared'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** The fixture fields this slice reads from the Web catalogue's `useWebFixtures()`. */
export interface Actor {
  who: string
  role: string
  source: string
  anaesthetistId?: string
}
export interface WebFixtures {
  actor: Actor
  anaesthetistId: string
  personaName: string
  todayISO: string
  detailListId: string | undefined
  capture: { listId: string; bookingId: string; procedureId: string } | undefined
  movedToId: string
}

/** The catalogue's quiet "what the last click did" line (the current examples' Said), in theme utilities. */
export function Echo({ children }: { children: ReactNode }) {
  if (children === null || children === undefined || children === false) return null
  return (
    <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
      {children}
    </div>
  )
}

/** The catalogue's small hint under an example (StageHint). */
export function Hint({ children }: { children: ReactNode }) {
  return <div className="tw:mt-2 tw:text-xs tw:leading-[normal] tw:text-mist">{children}</div>
}

/** Dashed catalogue-chrome buttons (the current examples' Knobs): never product UI. */
export function Knobs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="tw:mb-2.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
      <span className="tw:mr-0.5 tw:text-[11.5px] tw:font-semibold tw:text-mist">{label}</span>
      {options.map((o) => (
        <KnobButton key={o.value} pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </KnobButton>
      ))}
    </div>
  )
}

export function KnobButton({ onClick, pressed, children }: { onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'tw:h-[26px] tw:cursor-pointer tw:rounded-pill tw:border tw:border-dashed tw:px-2.5 tw:text-xs tw:font-semibold',
        pressed === true ? 'tw:border-slate tw:bg-sunken tw:text-ink' : 'tw:border-line-strong tw:bg-transparent tw:text-slate',
      )}
    >
      {children}
    </button>
  )
}

/**
 * The capture card (shared/capture/ui CaptureSection) on shadcn Card: surface,
 * line border, 14px radius, 16px padding, the 11px uppercase mist eyebrow. No
 * shadow, as today. `footer` sinks to the bottom when the card is stretched.
 */
export function CaptureCard({
  label,
  children,
  footer,
  className,
}: {
  label: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('tw:gap-3 tw:p-4 tw:shadow-none', className)} aria-label={label} role="group">
      <div aria-hidden className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">
        {label}
      </div>
      {children}
      {footer !== undefined && footer !== null && <div className="tw:mt-auto tw:flex tw:flex-col tw:gap-3">{footer}</div>}
    </Card>
  )
}

/** The amber "Demo simulation" badge (shared/DemoBadge) on the Badge warning variant. */
export function DemoBadge({ label }: { label: string }) {
  return (
    <Badge variant="warning" className="tw:gap-1.5 tw:px-2.5 tw:py-1 tw:text-[11px] tw:leading-[14px] tw:tracking-[0.06em] tw:uppercase">
      <FlaskConical aria-hidden />
      {label}
    </Badge>
  )
}

type BadgeStatus = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'
const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

interface ResolvedStatus {
  label: string
  longLabel?: string
  known: boolean
  status?: { colour: BadgeStatus }
}

/** A status chip (shared/StatusChip) as a Badge status variant, label from the status master. */
export function StatusBadge({ statusKey, label }: { statusKey: string; label?: string }) {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  if (!resolved.known) return <Badge>Unknown status</Badge>
  const variant: BadgeStatus = LIST_KINDS.includes(statusKey) ? (statusKey as BadgeStatus) : (resolved.status?.colour ?? 'free')
  return (
    <Badge variant={variant} data-status-key={statusKey}>
      {label ?? resolved.label}
    </Badge>
  )
}

/** The "a required record is missing" line the current examples show. */
export function Missing({ what }: { what: string }) {
  return <div className="tw:text-[13px] tw:text-mist">No {what} in the current demo data.</div>
}

/**
 * Focus restore for a dialog opened from a button outside it (no
 * DialogTrigger): `remember(e)` in the opener's onClick, then pass
 * `finalFocus` to the popup so closing puts focus back on that button.
 */
export function useReturnFocus() {
  const finalFocus = useRef<HTMLElement | null>(null)
  const remember = useCallback((e?: SyntheticEvent) => {
    const el = e?.currentTarget ?? document.activeElement
    finalFocus.current = el instanceof HTMLElement ? el : null
  }, [])
  return { finalFocus, remember }
}

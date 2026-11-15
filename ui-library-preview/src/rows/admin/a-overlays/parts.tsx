import type { ReactNode } from 'react'
import { MoreHorizontalIcon } from 'lucide-react'
import { useDisplayStatus } from '@proto/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Shared library parts for this slice: the drawers' Section / Row / DrawerLink /
 * ActionBtn (one copy, where the prototype has two), the 440px side drawer shell
 * on shadcn Sheet, a status Badge and the catalogue's Echo line.
 */

/** The catalogue's quiet "what the last click did" line. */
export function Echo({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
      {children}
    </div>
  )
}

/** The prototype's "the seed has no X" line. */
export function Missing({ what }: { what: string }) {
  return <div className="tw:text-[13px] tw:text-mist">The seed has no {what} right now (try Demo reset).</div>
}

// ---------------------------------------------------------------------------
// drawerParts
// ---------------------------------------------------------------------------

/** A labelled section: the 11px uppercase mist eyebrow over its rows. */
export function Section({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={cn('tw:flex tw:flex-col tw:gap-2', className)}>
      <h3 className="tw:m-0 tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">{label}</h3>
      {children}
    </section>
  )
}

/** One label and value row; the label column is 80px (the SlotDrawer copy used 72px). */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tw:flex tw:items-baseline tw:gap-2.5">
      <span className="tw:w-20 tw:flex-none tw:text-xs tw:text-mist">{label}</span>
      <span className="tw:flex-1 tw:text-sm tw:text-ink">{children}</span>
    </div>
  )
}

/** The small bordered teal-text link button (Open, Move, Assign). */
export function DrawerLink({ onClick, children, label }: { onClick: () => void; children: ReactNode; label?: string }) {
  return (
    <Button variant="outline" size="xs" className="tw:text-primary tw:hover:text-teal-pressed" onClick={onClick} aria-label={label}>
      {children}
    </Button>
  )
}

export interface DrawerAction {
  label: string
  onClick: () => void
  primary?: boolean
  /** Why it is disabled; shown in a Tooltip (or a line, per `reasons`). */
  disabledReason?: string | null
}

/**
 * A footer action: teal only when primary. A disabled one stays focusable so its reason can be read.
 * focusableWhenDisabled sets aria-disabled + data-disabled (not the disabled attribute), so the
 * kit's `disabled:` looks are restated on `data-disabled:` here.
 */
export function ActionBtn({ action, reasons = 'tooltip' }: { action: DrawerAction; reasons?: 'tooltip' | 'line' }) {
  const disabled = action.disabledReason !== undefined && action.disabledReason !== null
  const button = (
    <Button
      variant={action.primary === true ? 'default' : 'outline'}
      disabled={disabled}
      focusableWhenDisabled={disabled}
      onClick={action.onClick}
      className={cn(
        'tw:min-w-0 tw:data-disabled:cursor-default',
        action.primary === true
          ? 'tw:flex-[1_1_auto] tw:data-disabled:bg-line-strong tw:data-disabled:text-white tw:data-disabled:hover:bg-line-strong'
          : 'tw:flex-none tw:text-slate tw:data-disabled:text-mist tw:data-disabled:hover:bg-surface',
      )}
    >
      {action.label}
    </Button>
  )
  if (!disabled || reasons === 'line') return button
  return (
    <Tooltip>
      {/* A disabled button gets no pointer events: the trigger is a wrapper so hover still opens it. */}
      <TooltipTrigger render={<span className={cn('tw:inline-flex tw:min-w-0', action.primary === true ? 'tw:flex-[1_1_auto] tw:*:flex-1' : 'tw:flex-none')} />}>
        {button}
      </TooltipTrigger>
      <TooltipContent>{action.disabledReason}</TooltipContent>
    </Tooltip>
  )
}

/**
 * The footer's actions. `buttons`: every action as a button in one row (as today).
 * `menu`: the primary (or the first) stays a button, the rest go in a More menu.
 */
export function ActionBar({ actions, layout = 'buttons', reasons = 'tooltip', wrap = false }: { actions: readonly DrawerAction[]; layout?: 'buttons' | 'menu'; reasons?: 'tooltip' | 'line'; wrap?: boolean }) {
  const lines = reasons === 'line' ? actions.filter((a) => a.disabledReason != null) : []
  const primary = actions.find((a) => a.primary === true)
  const shown = layout === 'menu' ? [primary ?? actions[0]].filter((a): a is DrawerAction => a !== undefined) : actions
  const rest = layout === 'menu' ? actions.filter((a) => !shown.includes(a)) : []
  return (
    <div className="tw:flex tw:w-full tw:flex-col tw:gap-2">
      <div className={cn('tw:flex tw:w-full tw:gap-2', wrap ? 'tw:flex-wrap' : 'tw:flex-nowrap')}>
        {shown.map((a) => (
          <ActionBtn key={a.label} action={a} reasons={reasons} />
        ))}
        {rest.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="tw:flex-none tw:text-slate" />}>
              More
              <MoreHorizontalIcon aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="tw:w-auto tw:min-w-48">
              {rest.map((a) => (
                <DropdownMenuItem key={a.label} disabled={a.disabledReason != null} onClick={a.onClick} className="tw:flex-col tw:items-start tw:gap-0.5">
                  <span>{a.label}</span>
                  {a.disabledReason != null && <span className="tw:text-[11.5px] tw:leading-4 tw:text-mist">{a.disabledReason}</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {lines.map((a) => (
        <div key={a.label} className="tw:text-xs tw:leading-4 tw:text-mist">
          {a.label}: {a.disabledReason}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The side drawer shell
// ---------------------------------------------------------------------------

/**
 * The Admin right-docked drawer on shadcn Sheet (Base UI Dialog): scrim, focus
 * trap, Escape, focus restore, the header's corner close (the prototype has one
 * too), a scrolling body and a bordered footer.
 */
export function SideDrawer({
  open,
  onOpenChange,
  width = 440,
  title,
  eyebrow,
  meta,
  footer,
  children,
  shot,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  width?: 440 | 600
  title: ReactNode
  /** Chips above the title (the Draft List's DRAFT and Unassigned). */
  eyebrow?: ReactNode
  /** The slate line (and chips) under the title. */
  meta?: ReactNode
  footer?: ReactNode
  children: ReactNode
  shot?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" data-shot={shot} className={width === 440 ? 'tw:data-[side=right]:w-[440px]!' : undefined}>
        <SheetHeader className="tw:gap-1.5">
          {eyebrow}
          <SheetTitle className={width === 440 ? 'tw:text-lg tw:leading-6' : undefined}>{title}</SheetTitle>
          {meta !== undefined && <SheetDescription render={<div />} className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">{meta}</SheetDescription>}
        </SheetHeader>
        <div className={cn('tw:flex tw:flex-1 tw:flex-col tw:overflow-y-auto', width === 440 ? 'tw:gap-4 tw:p-6' : 'tw:gap-5 tw:px-6 tw:py-5')}>{children}</div>
        {footer !== undefined && <SheetFooter className={width === 440 ? 'tw:justify-start tw:p-5' : undefined}>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type BadgeStatus = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'
const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

interface ResolvedStatus {
  label: string
  known: boolean
  status?: { colour: BadgeStatus }
}

/** A List kind or availability status as a Badge status variant (labels from the status master). */
export function StatusBadge({ statusKey }: { statusKey: string }) {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  if (!resolved.known) return <Badge>Unknown status</Badge>
  const variant: BadgeStatus = LIST_KINDS.includes(statusKey) ? (statusKey as BadgeStatus) : (resolved.status?.colour ?? 'free')
  return <Badge variant={variant}>{resolved.label}</Badge>
}

/** The 12px swatch per status colour, with the block treatments (hatched Unavailable, dashed Free). */
export const STATUS_SWATCH: Record<BadgeStatus, string> = {
  private: 'tw:bg-status-private-tint tw:border tw:border-status-private',
  public: 'tw:bg-status-public-tint tw:border tw:border-status-public',
  preop: 'tw:bg-status-preop-tint tw:border tw:border-status-preop',
  holiday: 'tw:bg-status-holiday-tint tw:border tw:border-status-holiday',
  unavailable: 'aa-status-hatched tw:border tw:border-status-unavailable',
  free: 'aa-status-dashed tw:bg-status-free-tint',
}
export type { BadgeStatus }

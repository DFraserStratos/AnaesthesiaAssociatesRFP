import type { KeyboardEvent, ReactNode } from 'react'
import { tableFeatures, type ReactTable, type RowData } from '@tanstack/react-table'
import { resolveDisplayStatus, useDisplayStatus } from '@proto/shared'
import { useAppStore } from '@proto/store'
import { LIST_PROGRESS_LABEL } from '@proto/domain/listProgress'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { TickMark } from './TickBadge'

/* ------------------------------------------------------------------ */
/* Status tones                                                        */
/* ------------------------------------------------------------------ */

export type StatusToken = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'
export type Treatment = 'solid' | 'hatched' | 'dashed'

/** Literal class strings per status token (Tailwind only sees whole class names). */
export const TONE: Record<StatusToken, { tint: string; text: string; bar: string; border: string }> = {
  private: { tint: 'tw:bg-status-private-tint', text: 'tw:text-status-private-on-tint', bar: 'tw:bg-status-private', border: 'tw:border-status-private' },
  public: { tint: 'tw:bg-status-public-tint', text: 'tw:text-status-public-on-tint', bar: 'tw:bg-status-public', border: 'tw:border-status-public' },
  preop: { tint: 'tw:bg-status-preop-tint', text: 'tw:text-status-preop-on-tint', bar: 'tw:bg-status-preop', border: 'tw:border-status-preop' },
  holiday: { tint: 'tw:bg-status-holiday-tint', text: 'tw:text-status-holiday-on-tint', bar: 'tw:bg-status-holiday', border: 'tw:border-status-holiday' },
  unavailable: { tint: 'tw:bg-status-unavailable-tint', text: 'tw:text-status-unavailable-on-tint', bar: 'tw:bg-status-unavailable', border: 'tw:border-status-unavailable' },
  free: { tint: 'tw:bg-status-free-tint', text: 'tw:text-status-free-on-tint', bar: 'tw:bg-status-free', border: 'tw:border-status-free' },
}

const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

interface Resolved {
  label: string
  longLabel: string
  known: boolean
  status?: { colour: StatusToken; treatment: Treatment }
  visual: { treatment: Treatment }
}

export interface Tone {
  token: StatusToken
  treatment: Treatment
  label: string
  longLabel: string
  known: boolean
}

function toneOf(key: string, r: Resolved): Tone {
  const token: StatusToken = LIST_KINDS.includes(key) ? (key as StatusToken) : (r.status?.colour ?? 'unavailable')
  return { token, treatment: r.visual.treatment, label: r.label, longLabel: r.longLabel, known: r.known }
}

/** A display key (List kind or availability status) to its token, treatment and labels, from the status master. */
export function useTone(key: string): Tone {
  return toneOf(key, useDisplayStatus(key) as Resolved)
}

/** The same, outside a component (the master records are read by the caller). */
export function toneFor(key: string, slotStatuses: unknown): Tone {
  return toneOf(key, resolveDisplayStatus(key, slotStatuses) as Resolved)
}

/** The block fill for a status: tint (hatched over the tint for a hatched status) plus its left bar or dashed outline. */
export function blockClasses(t: Tone): string {
  return cn(
    TONE[t.token].tint,
    t.treatment === 'hatched' && 'aa-status-hatched',
    t.treatment === 'dashed' ? 'aa-status-dashed' : 'tw:border-0 tw:border-l-[3px] tw:border-solid',
    t.treatment !== 'dashed' && TONE[t.token].border,
  )
}

export function useSlotStatuses(): unknown {
  return useAppStore((s: { masters: { slotStatuses: unknown } }) => s.masters.slotStatuses)
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

/** The StatusChip on shadcn Badge's status variants (a List kind, or a status master colour). */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const t = useTone(status)
  if (!t.known) return <Badge>Unknown status</Badge>
  return (
    <Badge variant={t.token} data-status-key={status}>
      {label ?? t.label}
    </Badge>
  )
}

export type ListProgress = 'toFinish' | 'readyToSubmit' | 'submitted' | 'invoiced' | 'authorised' | 'upcoming'

/** The ProgressPill on Badge: To finish warning tint, done states with the tick, billed states neutral. */
export function ProgressBadge({ progress }: { progress: ListProgress }) {
  if (progress === 'upcoming') return null
  const label = (LIST_PROGRESS_LABEL as Record<ListProgress, string>)[progress]
  if (progress === 'submitted' || progress === 'readyToSubmit') {
    return (
      <span data-progress={progress} className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:whitespace-nowrap tw:text-status-free-on-tint">
        <TickMark size={18} />
        {label}
      </span>
    )
  }
  return (
    <Badge data-progress={progress} variant={progress === 'toFinish' ? 'warning' : 'default'} className="tw:px-[9px] tw:py-[3px] tw:text-xs">
      {label}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/* Page chrome                                                         */
/* ------------------------------------------------------------------ */

/** The web Panel: white card, line border, card radius, e1; optional title row with an action. */
export function Panel({ title, action, flush, children, className }: { title?: string; action?: ReactNode; flush?: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={cn('tw:flex tw:flex-col tw:gap-3.5 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:shadow-e1', flush ? 'tw:p-0' : 'tw:p-5', className)}>
      {(title !== undefined || action !== undefined) && (
        <div className={cn('tw:flex tw:items-baseline tw:justify-between tw:gap-3', flush && 'tw:px-5 tw:pt-5')}>
          {title !== undefined ? <h2 className="tw:m-0 tw:text-[17px] tw:leading-6 tw:font-semibold">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * A one-line readout of what the last click did (catalogue chrome). It sits last in its flex
 * column (below the content, whatever its place in the markup) and is screen-reader only while
 * empty, so it never pushes the replacement lower than the current example on the left.
 */
export function Said({ text }: { text: string | null }) {
  const empty = text === null || text === ''
  return (
    <div role="status" className={cn('tw:order-last tw:text-[12.5px] tw:text-slate', empty && 'tw:sr-only')}>
      {text}
    </div>
  )
}

export function Missing({ what }: { what: string }) {
  return <div className="tw:text-[13px] tw:text-mist">The seed has no {what} for this persona right now.</div>
}

/** A desktop-width canvas inside the narrower stage (the stage scrolls sideways), as the current example. */
export function Wide({ width, children }: { width: number; children: ReactNode }) {
  return <div style={{ width }}>{children}</div>
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

/** Core TanStack features only: these tables are fixed-order read views (no sorting today). */
export const coreFeatures = tableFeatures({})
export type CoreTable<T extends RowData> = ReactTable<typeof coreFeatures, T>

/**
 * How a row opens. `button`: the row click stays for the mouse and one cell holds a real button (the
 * keyboard handle, as the Lists table today). `row`: the whole row takes focus and Enter or Space opens it.
 */
export type OpenMode = 'button' | 'row'

export interface DataTableProps<T extends RowData> {
  table: CoreTable<T>
  /** Column ids drawn right-aligned (figures) or centred. */
  align?: Record<string, 'right' | 'center'>
  /** Columns in mono figures. */
  mono?: readonly string[]
  /** Section heading for each row; a group row is inserted where it changes. */
  groupOf?: (row: T) => string | undefined
  empty?: ReactNode
  /** Makes rows open. */
  onOpen?: (row: T) => void
  /** Rows that open (all, when omitted). */
  canOpen?: (row: T) => boolean
  openMode?: OpenMode
  /** The column holding the open button, and its accessible name. */
  handle?: { column: string; label: (row: T) => string }
  rowClassName?: (row: T) => string | undefined
  rowAttrs?: (row: T) => Record<string, string | undefined>
  /** Footer rows drawn in a tfoot (shadcn TableFooter). */
  footer?: ReactNode
  /** Cell padding: `roomy` is the Lists table's 12px 20px, `compact` Accounts' 11px 16px. */
  density?: 'roomy' | 'compact'
  className?: string
}

const PAD = { roomy: 'tw:px-5 tw:py-3', compact: 'tw:px-4 tw:py-[11px]' } as const

/**
 * The web tables' one renderer: shadcn Table drawn from a TanStack Table v9 row model. Replaces the Th / Td
 * / GroupRow helpers copied into four screens. Group rows are `th scope="colgroup"` rows between sections.
 */
export function DataTable<T extends RowData>({ table, align = {}, mono = [], groupOf, empty, onOpen, canOpen, openMode = 'button', handle, rowClassName, rowAttrs, footer, density = 'roomy', className }: DataTableProps<T>) {
  const headers = table.getHeaderGroups()
  const colCount = table.getAllLeafColumns().length
  const rows = table.getRowModel().rows
  const pad = PAD[density]
  let lastGroup: string | undefined

  function keyOpen(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (onOpen === undefined || openMode !== 'row' || e.target !== e.currentTarget || canOpen?.(row) === false) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(row)
    }
  }

  return (
    <Table className={cn('tw:text-sm', className)}>
      <TableHeader>
        {headers.map((group) => (
          <TableRow key={group.id} className="tw:border-line">
            {group.headers.map((h) => (
              <TableHead
                key={h.id}
                className={cn('tw:h-auto tw:bg-transparent tw:py-3 tw:text-[11px] tw:font-semibold', density === 'roomy' ? 'tw:px-5' : 'tw:px-4', align[h.column.id] === 'right' && 'tw:text-right', align[h.column.id] === 'center' && 'tw:text-center')}
              >
                {h.isPlaceholder ? null : <table.FlexRender header={h} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow className="tw:hover:bg-transparent">
            <TableCell colSpan={colCount} className="tw:px-5 tw:py-6 tw:text-center tw:text-mist">
              {empty}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => {
          const data = row.original
          const g = groupOf?.(data)
          const head = g !== undefined && g !== lastGroup
          lastGroup = g
          const opens = onOpen !== undefined && (canOpen?.(data) ?? true)
          return [
            head ? (
              <TableRow key={`group-${g}`} className="tw:border-line tw:bg-[var(--aa-bg)] tw:hover:bg-[var(--aa-bg)]">
                <th colSpan={colCount} scope="colgroup" className="tw:px-5 tw:py-2.5 tw:text-left tw:text-[13px] tw:font-semibold tw:text-slate">
                  {g}
                </th>
              </TableRow>
            ) : null,
            <TableRow
              key={row.id}
              {...rowAttrs?.(data)}
              tabIndex={opens && openMode === 'row' ? 0 : undefined}
              onClick={opens ? () => onOpen(data) : undefined}
              onKeyDown={opens ? (e) => keyOpen(e, data) : undefined}
              className={cn(
                'tw:border-sunken',
                opens && 'tw:cursor-pointer',
                opens && openMode === 'row' && 'tw:outline-none tw:focus-visible:bg-teal-tint tw:focus-visible:shadow-[inset_3px_0_0_var(--teal)]',
                rowClassName?.(data),
              )}
            >
              {row.getAllCells().map((cell) => {
                const id = cell.column.id
                const content = <table.FlexRender cell={cell} />
                const isHandle = opens && openMode === 'button' && handle?.column === id
                return (
                  <TableCell
                    key={cell.id}
                    className={cn('tw:h-auto', pad, mono.includes(id) && 'tw:font-mono tw:tabular-nums', align[id] === 'right' && 'tw:text-right', align[id] === 'center' && 'tw:text-center')}
                  >
                    {isHandle ? (
                      <button
                        type="button"
                        aria-label={handle.label(data)}
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(data)
                        }}
                        className="tw:cursor-pointer tw:rounded-[4px] tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:text-inherit tw:outline-none tw:[font:inherit] tw:focus-visible:shadow-focus"
                      >
                        {content}
                      </button>
                    ) : (
                      content
                    )}
                  </TableCell>
                )
              })}
            </TableRow>,
          ]
        })}
      </TableBody>
      {footer !== undefined && <TableFooter className="tw:border-t-2 tw:border-line tw:bg-surface tw:font-normal">{footer}</TableFooter>}
    </Table>
  )
}

/** A cell for footer rows, padded like the body. */
export function FootCell({ children, right, bold, mono, colSpan, header, density = 'compact', className }: { children?: ReactNode; right?: boolean; bold?: boolean; mono?: boolean; colSpan?: number; header?: boolean; density?: 'roomy' | 'compact'; className?: string }) {
  const cls = cn('tw:h-auto tw:align-middle tw:whitespace-nowrap', PAD[density], right && 'tw:text-right', bold && 'tw:font-bold', mono && 'tw:font-mono tw:tabular-nums', className)
  if (header) {
    return (
      <th scope="row" colSpan={colSpan} className={cn(cls, 'tw:text-left tw:font-semibold')}>
        {children}
      </th>
    )
  }
  return (
    <TableCell colSpan={colSpan} className={cls}>
      {children}
    </TableCell>
  )
}

/** The status colour bar at the start of a row (3px, rounded). */
export function StatusBar({ token, quiet, height = 20 }: { token: StatusToken; quiet?: boolean; height?: number }) {
  return <span aria-hidden className={cn('tw:w-[3px] tw:flex-none tw:rounded-pill', TONE[token].bar, quiet && 'tw:opacity-45')} style={{ height }} />
}

/* ------------------------------------------------------------------ */
/* Segmented                                                           */
/* ------------------------------------------------------------------ */

/**
 * A single choice on ToggleGroup (teal variant, today's segmented look), given radio semantics; an
 * attempt to unpress the selected item is ignored so one option is always on.
 */
export function Segmented<V extends string>({ label, value, options, onChange, className, size }: { label: string; value: V; options: readonly { value: V; label: string }[]; onChange: (v: V) => void; className?: string; size?: 'sm' | 'default' }) {
  return (
    <ToggleGroup
      variant="teal"
      size={size}
      role="radiogroup"
      aria-label={label}
      className={className}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as V | undefined
        if (picked !== undefined) onChange(picked)
      }}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} role="radio" aria-checked={o.value === value} aria-pressed={undefined} className="tw:flex-auto!">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

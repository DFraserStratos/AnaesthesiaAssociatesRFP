import { createContext, useContext, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { NumberField } from '@base-ui/react/number-field'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import {
  addRange,
  deleteRangeRefusal,
  editRange,
  editRangeRefusal,
  formatRangeDate,
  formatRangePrice,
  normaliseRanges,
  rangeSpanText,
  sortRanges,
  validatePriceRanges,
} from '@proto/domain/billing/priceRanges'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DatePicker } from './DatePicker'
import { useDemoToday, useStore } from './data'
import { FormAlert, TableCard, TextAction } from './shared'

interface PriceRange {
  startISO: string
  price: number
}

interface Contract {
  id: string
  name: string
  prepaid?: boolean
  pricing: { kind: string; ranges?: PriceRange[] }
}

type Refusal = { code: string; message: string } | null

/**
 * A price as Base UI NumberField: two decimals, a $ before it, en-NZ grouping on blur, arrow keys
 * step a dollar (Shift for ten). Enter is left to the row, which saves.
 */
export function PriceField({
  value,
  onChange,
  label,
  autoFocus,
  className,
}: {
  value: number | null
  onChange: (v: number | null) => void
  label: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <NumberField.Root
      value={value}
      onValueChange={(v) => onChange(v)}
      min={0}
      step={1}
      largeStep={10}
      format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      locale="en-NZ"
      className={cn('tw:inline-flex', className)}
    >
      <NumberField.Group className="tw:flex tw:h-9 tw:w-[118px] tw:items-center tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:pl-2 tw:transition-[border-color,box-shadow] tw:duration-150 tw:focus-within:border-primary tw:focus-within:shadow-focus">
        <span aria-hidden className="tw:font-mono tw:text-[13px] tw:text-mist">
          $
        </span>
        <NumberField.Input
          aria-label={label}
          placeholder="0.00"
          autoFocus={autoFocus}
          className="tw:h-full tw:w-full tw:min-w-0 tw:bg-transparent tw:pr-2 tw:pl-1 tw:text-right tw:font-mono tw:text-[13px] tw:tabular-nums tw:outline-none tw:placeholder:text-mist"
        />
      </NumberField.Group>
    </NumberField.Root>
  )
}

/** What the cells need, passed by context so the column definitions (component identities) stay stable. */
interface EditState {
  ranges: PriceRange[]
  inForceStart: string | null
  last: boolean
  editing: string | null
  draftStart: string
  draftPrice: number | null
  today: Date
  setDraftStart: (v: string) => void
  setDraftPrice: (v: number | null) => void
  startEdit: (r: PriceRange) => void
  saveEdit: (startISO: string) => void
  cancelEdit: (startISO: string) => void
  remove: (startISO: string) => void
}
const EditCtx = createContext<EditState | null>(null)
const useEdit = () => useContext(EditCtx)!

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, PriceRange & { index: number }>()

function StartCell({ r }: { r: PriceRange }) {
  const s = useEdit()
  if (s.editing === r.startISO)
    return (
      <DatePicker
        value={s.draftStart}
        onChange={s.setDraftStart}
        today={s.today}
        size="sm"
        className="tw:w-[172px]"
        aria-label={`Start of the range from ${formatRangeDate(r.startISO)}`}
      />
    )
  return <span className="tw:font-mono">{formatRangeDate(r.startISO)}</span>
}

function PriceCell({ r }: { r: PriceRange }) {
  const s = useEdit()
  if (s.editing === r.startISO)
    return <PriceField value={s.draftPrice} onChange={s.setDraftPrice} label={`Price (ex GST) of the range from ${formatRangeDate(r.startISO)}`} autoFocus />
  return <span className="tw:font-semibold">{formatRangePrice(r.price)}</span>
}

function InForceCell({ r, index }: { r: PriceRange; index: number }) {
  const s = useEdit()
  if (s.editing === r.startISO) return null
  return (
    <span className="tw:flex tw:flex-col tw:items-start tw:gap-1">
      <span className="tw:whitespace-nowrap tw:text-slate">{rangeSpanText(s.ranges, index)}</span>
      {s.inForceStart === r.startISO && <Badge>In force today</Badge>}
    </span>
  )
}

function ActionsCell({ r }: { r: PriceRange }) {
  const s = useEdit()
  if (s.editing === r.startISO)
    return (
      <span className="tw:inline-flex tw:gap-2.5">
        <TextAction onClick={() => s.saveEdit(r.startISO)}>Save</TextAction>
        <TextAction onClick={() => s.cancelEdit(r.startISO)}>Cancel</TextAction>
      </span>
    )
  return (
    <span className="tw:inline-flex tw:gap-2.5">
      <span data-action="edit" className="tw:contents">
        <TextAction onClick={() => s.startEdit(r)} label={`Edit the range from ${formatRangeDate(r.startISO)}`}>
          Edit
        </TextAction>
      </span>
      <span title={s.last ? 'A Contract keeps at least one price range.' : undefined}>
        <TextAction
          onClick={() => s.remove(r.startISO)}
          disabled={s.last}
          label={s.last ? 'Delete (a Contract keeps at least one price range)' : `Delete the range from ${formatRangeDate(r.startISO)}`}
        >
          Delete
        </TextAction>
      </span>
    </span>
  )
}

const columns = helper.columns([
  helper.display({ id: 'start', header: 'Start', cell: ({ row }) => <StartCell r={row.original} /> }),
  helper.display({ id: 'price', header: 'Price (ex GST)', meta: { numeric: true }, cell: ({ row }) => <PriceCell r={row.original} /> }),
  helper.display({ id: 'inForce', header: 'In force', cell: ({ row }) => <InForceCell r={row.original} index={row.original.index} /> }),
  helper.display({ id: 'actions', header: '', meta: { right: true, label: 'Actions' }, cell: ({ row }) => <ActionsCell r={row.original} /> }),
])

/** Keys from inside an open date popover belong to the calendar, not the row. */
function fromPopover(e: KeyboardEvent): boolean {
  return e.target instanceof Element && e.target.closest('[data-slot=popover-content]') !== null
}

/**
 * ContractPriceRanges on TanStack Table v9 (cell edit) through shadcn Table: the price is a Base UI
 * NumberField and the start a Date Picker. Enter saves the row and Escape cancels it (not the
 * panel around it); the last range cannot be deleted. Every rule and sentence is the prototype's
 * pure model (`validatePriceRanges`, `deleteRangeRefusal`); the ranges are a local copy of the
 * seeded fixed-price Contract's, so nothing reaches the store.
 */
export function ContractPriceRangesReplacement() {
  const { fixedContractId } = useSeedIds() as { fixedContractId?: string }
  const contract = useStore((s) => (fixedContractId !== undefined ? s.masters.contracts[fixedContractId] : undefined)) as Contract | undefined
  if (contract === undefined) return <div className="tw:text-[13px] tw:text-mist">The seed has no fixed-price Contracts right now (try Demo reset).</div>
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <div className="tw:text-[13px] tw:font-semibold">{contract.name}</div>
      <PriceRangesEditor key={contract.id} contract={contract} />
    </div>
  )
}

export function PriceRangesEditor({ contract, onError }: { contract: Contract; onError?: (m: string | null) => void }) {
  const { today, todayISO } = useDemoToday()
  const [ranges, setRanges] = useState<PriceRange[]>(() => sortRanges(contract.pricing.ranges ?? []))
  const [editing, setEditing] = useState<string | null>(null)
  const [draftStart, setDraftStart] = useState('')
  const [draftPrice, setDraftPrice] = useState<number | null>(null)
  const [newStart, setNewStart] = useState('')
  const [newPrice, setNewPrice] = useState<number | null>(null)
  const [error, setErrorState] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const setError = (m: string | null) => {
    setErrorState(m)
    onError?.(m)
  }
  const focusLater = (selector: string) => window.requestAnimationFrame(() => tableRef.current?.querySelector<HTMLElement>(selector)?.focus())

  const inForce = useMemo(() => {
    let found: PriceRange | null = null
    for (const r of ranges) if (r.startISO <= todayISO) found = r
    return found
  }, [ranges, todayISO])

  /** The store's guard, run on the local copy: the result's first broken rule, or the new ranges. */
  function apply(next: PriceRange[]): boolean {
    const normalised = normaliseRanges(next) as PriceRange[]
    const refused = validatePriceRanges(normalised, { prepaid: contract.prepaid === true }) as Refusal
    if (refused !== null) {
      setError(refused.message)
      return false
    }
    setRanges(normalised)
    setError(null)
    return true
  }

  const state: EditState = {
    ranges,
    inForceStart: inForce?.startISO ?? null,
    last: ranges.length <= 1,
    editing,
    draftStart,
    draftPrice,
    today,
    setDraftStart,
    setDraftPrice,
    startEdit: (r) => {
      setEditing(r.startISO)
      setDraftStart(r.startISO)
      setDraftPrice(r.price)
      setError(null)
    },
    saveEdit: (startISO) => {
      const bad = editRangeRefusal(ranges, startISO) as Refusal
      if (bad !== null) return setError(bad.message)
      if (!apply(editRange(ranges, startISO, { startISO: draftStart, price: draftPrice ?? Number.NaN }))) return
      setEditing(null)
      focusLater(`[data-range-start="${draftStart}"] [data-action=edit] button`)
    },
    cancelEdit: (startISO) => {
      setEditing(null)
      setError(null)
      focusLater(`[data-range-start="${startISO}"] [data-action=edit] button`)
    },
    remove: (startISO) => {
      const bad = deleteRangeRefusal(ranges, startISO) as Refusal
      if (bad !== null) return setError(bad.message)
      setRanges(ranges.filter((r) => r.startISO !== startISO))
      setError(null)
      focusLater('[data-shot=price-range-add] input')
    },
  }

  function add() {
    if (apply(addRange(ranges, { startISO: newStart, price: newPrice ?? Number.NaN }))) {
      setNewStart('')
      setNewPrice(null)
    }
  }

  function editKeys(e: KeyboardEvent, startISO: string) {
    if (fromPopover(e)) return
    if (e.key === 'Enter') {
      e.preventDefault()
      state.saveEdit(startISO)
    } else if (e.key === 'Escape') {
      // Close the edit, not the panel around it.
      e.preventDefault()
      e.stopPropagation()
      state.cancelEdit(startISO)
    }
  }

  const data = useMemo(() => ranges.map((r, index) => ({ ...r, index })), [ranges])
  const table = useTable({ features, columns, data, getRowId: (r) => r.startISO })

  return (
    <EditCtx.Provider value={state}>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
          <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">Price ranges</span>
          <span className="tw:text-xs tw:text-mist">The range in force on the procedure date gives the price.</span>
        </div>
        <div ref={tableRef}>
          <TableCard>
            <Table className="tw:text-[12.5px]">
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups()[0]?.headers.map((h) => {
                    const meta = h.column.columnDef.meta as { numeric?: boolean; label?: string } | undefined
                    return (
                      <TableHead key={h.id} data-numeric={meta?.numeric ? true : undefined} aria-label={meta?.label}>
                        <table.FlexRender header={h} />
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => {
                  const r = row.original
                  const isEditing = editing === r.startISO
                  return (
                    <TableRow
                      key={row.id}
                      data-range-start={r.startISO}
                      onKeyDown={isEditing ? (e) => editKeys(e, r.startISO) : undefined}
                      className={cn(inForce?.startISO === r.startISO && 'tw:bg-sunken')}
                    >
                      {row.getAllCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          data-numeric={(cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? true : undefined}
                          className={cn('tw:h-auto tw:py-2', cell.column.id === 'actions' && 'tw:text-right')}
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
                {inForce === null && ranges[0] !== undefined && (
                  <TableRow>
                    <TableCell colSpan={4} className="tw:text-slate">
                      Not in force today: the first range starts {formatRangeDate(ranges[0].startISO)}.
                    </TableCell>
                  </TableRow>
                )}
                <TableRow data-shot="price-range-add" className="tw:hover:bg-transparent">
                  <TableCell className="tw:py-2">
                    <DatePicker value={newStart} onChange={setNewStart} today={today} size="sm" className="tw:w-[172px]" aria-label="New range start" placeholder="Start" />
                  </TableCell>
                  <TableCell className="tw:py-2 tw:text-right">
                    <PriceField value={newPrice} onChange={setNewPrice} label="New range price (ex GST)" />
                  </TableCell>
                  <TableCell colSpan={2} className="tw:py-2 tw:text-right">
                    <Button size="sm" className="tw:h-9 tw:px-3.5" onClick={add}>
                      Add price range
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableCard>
        </div>
        <span className="tw:text-xs tw:text-mist">
          A start may be in the past: every Procedure on this Contract that nothing holds re-prices at once. Invoices already raised stay as they are.
        </span>
        {onError === undefined && <FormAlert message={error} />}
      </div>
    </EditCtx.Provider>
  )
}

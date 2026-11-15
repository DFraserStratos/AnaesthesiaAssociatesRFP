import { useMemo, useState, type ReactNode } from 'react'
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useAppStore } from '@proto/store'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Specialty {
  id: string
  name: string
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const helper = createColumnHelper<typeof features, Specialty>()

/** The masters chrome's page header: heading, one mist line, its action on the right. */
function Header({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="tw:flex tw:items-end tw:justify-between tw:gap-3">
      <div>
        <h2 className="tw:m-0 tw:text-lg tw:leading-6 tw:font-bold">{title}</h2>
        {sub !== undefined && <div className="tw:mt-0.5 tw:max-w-[820px] tw:text-[12.5px] tw:text-mist">{sub}</div>}
      </div>
      {action !== undefined && <div className="tw:flex-none tw:whitespace-nowrap">{action}</div>}
    </div>
  )
}

/** The teal text action ("Add", "Edit"): shadcn Button's link variant. */
function TextAction({ onClick, label, children }: { onClick: () => void; label?: string; children: ReactNode }) {
  return (
    <Button variant="link" onClick={onClick} aria-label={label} className="tw:text-[12.5px] tw:leading-[1.55] tw:font-semibold">
      {children}
    </Button>
  )
}

/**
 * The master views' table chrome on TanStack Table v9 (row sorting) rendered through shadcn Table.
 * Same six specialties, same Name / Id / Edit columns as the prototype example; Name and Id sort,
 * with `aria-sort` on the header cell.
 */
export function MasterTableReplacement({ sortable = false }: { sortable?: boolean }) {
  const specialties: Record<string, Specialty> = useAppStore((s: { masters: { specialties: Record<string, Specialty> } }) => s.masters.specialties)
  const data = useMemo(
    () => Object.values(specialties).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6),
    [specialties],
  )
  const [last, setLast] = useState('Nothing clicked yet.')

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', { header: 'Name', sortFn: 'text' }),
        helper.accessor('id', {
          header: 'Id',
          sortFn: 'alphanumeric',
          cell: (info) => <span className="tw:font-mono">{info.getValue()}</span>,
        }),
        helper.display({
          id: 'edit',
          header: '',
          enableSorting: false,
          cell: ({ row }) => (
            <div className="tw:text-right">
              <TextAction label={`Edit ${row.original.name}`} onClick={() => setLast(`Edit ${row.original.name} (stubbed).`)}>
                Edit
              </TextAction>
            </div>
          ),
        }),
      ]),
    [],
  )

  const table = useTable({
    features,
    columns,
    data,
    initialState: { sorting: sortable ? [{ id: 'name', desc: false }] : [] },
    enableSorting: sortable,
    enableSortingRemoval: false,
  })

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <Header
        title="Specialties"
        sub="Header, Table, TextAction and EditCell from masters/chrome.tsx."
        action={<TextAction onClick={() => setLast('Add (stubbed).')}>Add</TextAction>}
      />
      <div className="tw:overflow-hidden tw:rounded-card tw:border tw:border-line tw:bg-surface">
        <Table className="tw:text-[12.5px] tw:leading-[1.55]">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : canSort ? 'none' : undefined}
                      className="tw:h-auto tw:py-2 tw:leading-[1.55]"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'tw:-mx-1 tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-[6px] tw:px-1 tw:leading-[1.55] tw:uppercase tw:outline-none tw:hover:text-ink tw:focus-visible:shadow-focus',
                            sorted !== false && 'tw:text-ink',
                          )}
                        >
                          <table.FlexRender header={header} />
                          {sorted === 'asc' ? (
                            <ArrowUpIcon aria-hidden className="tw:size-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDownIcon aria-hidden className="tw:size-3" />
                          ) : (
                            <ChevronsUpDownIcon aria-hidden className="tw:size-3 tw:opacity-50" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="tw:h-auto tw:px-2.5 tw:py-2 tw:leading-[1.55]">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
        {last}
      </div>
    </div>
  )
}

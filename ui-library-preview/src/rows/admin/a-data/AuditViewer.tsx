import { useMemo, useRef, useState, type ReactNode } from 'react'
import { createColumnHelper, createPaginatedRowModel, rowPaginationFeature, tableFeatures, useTable, type PaginationState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { contractLabel } from '@proto/shared/contracts'
import { actionLabel, auditFieldChanges, auditNamesFor, formatAuditStamp, sortAuditNewestFirst, summariseAuditChanges } from '@proto/shared/audit'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DateRangePicker } from './DatePicker'
import { useDemoToday, useStore } from './data'
import { TableCard } from './shared'

interface AuditEntry {
  id: string
  atISO: string
  action: string
  who: string
  role: string
  source: string
  entityType: string
  entityId: string
}

interface AuditRow {
  entry: AuditEntry
  entity: string
  change: string
}

const SOURCES = ['all', 'anaesthetist', 'office', 'integration', 'system', 'demo'] as const
const PAGE_SIZE = 50
/** The scroll box the virtual rows live in (the stage is 460px tall). */
const VIRTUAL_HEIGHT = 300
const ROW_ESTIMATE = 52

const features = tableFeatures({ rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() })
const helper = createColumnHelper<typeof features, AuditRow>()

const columns = helper.columns([
  helper.display({ id: 'at', header: 'At', cell: ({ row }) => <span className="tw:font-mono tw:whitespace-nowrap">{formatAuditStamp(row.original.entry.atISO)}</span> }),
  helper.display({
    id: 'action',
    header: 'Action',
    cell: ({ row }) => (
      <>
        <div className="tw:font-semibold tw:text-teal-pressed">{actionLabel(row.original.entry.action)}</div>
        <div className="tw:font-mono tw:text-[11px] tw:text-mist">{row.original.entry.action}</div>
      </>
    ),
  }),
  helper.display({ id: 'who', header: 'Who', cell: ({ row }) => row.original.entry.who }),
  helper.display({ id: 'role', header: 'Role · source', cell: ({ row }) => `${row.original.entry.role} · ${row.original.entry.source}` }),
  helper.display({
    id: 'entity',
    header: 'Entity',
    cell: ({ row }) => (
      <>
        <div className="tw:text-xs">{row.original.entry.entityType}</div>
        <div className="tw:font-mono tw:text-[11px] tw:text-mist">{row.original.entity}</div>
      </>
    ),
  }),
  helper.display({
    id: 'change',
    header: 'Change',
    cell: ({ row }) => <span className="tw:block tw:max-w-[300px] tw:font-mono tw:text-[11.5px] tw:whitespace-normal tw:text-slate">{row.original.change}</span>,
  }),
])

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1">
      <span className="tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase">{label}</span>
      {children}
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <Filter label={label}>
      <Select value={value} onValueChange={(v) => onChange(String(v ?? 'all'))}>
        <SelectTrigger aria-label={label} className="tw:h-10! tw:min-w-[150px] tw:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Filter>
  )
}

/**
 * The global audit feed on TanStack Table v9 through shadcn Table. Same filters (entity type and
 * source as shadcn Select, the From and To pair as one range picker), same columns and the shared
 * audit narrative (action label over its code, the compact change line). The 500-row cap goes:
 * `paging` "virtual" renders every match with TanStack Virtual (spacer rows keep real table
 * markup); "pages" shows 50 a page with TanStack pagination.
 */
export function AuditViewerReplacement({ paging }: { paging: 'virtual' | 'pages' }) {
  const audit = useStore((s) => s.audit) as AuditEntry[]
  const contracts = useStore((s) => s.masters.contracts)
  const parties = useStore((s) => s.masters.parties)
  const specialties = useStore((s) => s.masters.specialties)
  const fundingTags = useStore((s) => s.masters.fundingTags)
  const rvgGroups = useStore((s) => s.masters.rvgGroups)
  const names = useMemo(() => auditNamesFor({ rvgGroups }), [rvgGroups])
  const { today, todayISO } = useDemoToday()
  const [entityType, setEntityType] = useState('all')
  const [source, setSource] = useState('all')
  const [fromISO, setFromISO] = useState('')
  const [toISO, setToISO] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  const entityTypes = useMemo(() => ['all', ...Array.from(new Set(audit.map((a) => a.entityType))).sort()], [audit])
  const earliestISO = useMemo(() => audit.reduce((min, a) => (a.atISO.slice(0, 10) < min ? a.atISO.slice(0, 10) : min), todayISO), [audit, todayISO])

  const data = useMemo<AuditRow[]>(() => {
    const entityName = (type: string, id: string): string => {
      if (type === 'contract') return contracts[id] !== undefined ? contractLabel(contracts[id]) : id
      if (type === 'party') return parties[id]?.name ?? id
      if (type === 'specialty') return specialties[id]?.name ?? id
      if (type === 'fundingTag') return fundingTags[id]?.code ?? id
      if (type === 'rvgGroup') return names.rvgGroup?.(id) ?? 'An RVG group'
      return id
    }
    const rows = audit.filter((a) => {
      if (entityType !== 'all' && a.entityType !== entityType) return false
      if (source !== 'all' && a.source !== source) return false
      const date = a.atISO.slice(0, 10)
      if (fromISO !== '' && date < fromISO) return false
      if (toISO !== '' && date > toISO) return false
      return true
    })
    return (sortAuditNewestFirst(rows) as AuditEntry[]).map((entry) => ({
      entry,
      entity: entityName(entry.entityType, entry.entityId),
      change: summariseAuditChanges(auditFieldChanges(entry, names)) as string,
    }))
  }, [audit, entityType, source, fromISO, toISO, contracts, parties, specialties, fundingTags, names])

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (r) => r.entry.id,
    state: { pagination: paging === 'pages' ? pagination : { pageIndex: 0, pageSize: Math.max(data.length, 1) } },
    onPaginationChange: setPagination,
  })
  const rows = table.getRowModel().rows

  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: paging === 'virtual' ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
    getItemKey: (i) => rows[i]?.id ?? i,
  })
  const items = virtualizer.getVirtualItems()
  const padTop = paging === 'virtual' && items.length > 0 ? (items[0]?.start ?? 0) : 0
  const padBottom = paging === 'virtual' && items.length > 0 ? virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0) : 0
  const shown = paging === 'virtual' ? items.map((v) => ({ row: rows[v.index]!, index: v.index })) : rows.map((row, index) => ({ row, index }))

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  const head = (
    <TableHeader className="tw:sticky tw:top-0 tw:z-10">
      {table.getHeaderGroups().map((g) => (
        <TableRow key={g.id}>
          {g.headers.map((h) => (
            <TableHead key={h.id} className="tw:h-auto tw:py-2">
              <table.FlexRender header={h} />
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )

  return (
    <div className="tw:flex tw:max-w-[1080px] tw:flex-col tw:gap-4">
      <div>
        <h1 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">Audit</h1>
        <div className="tw:mt-1 tw:text-[13px] tw:text-slate">Every recorded action, with the acting role and source. Nothing here is ever edited or deleted.</div>
      </div>

      <div className="tw:flex tw:flex-wrap tw:items-end tw:gap-3">
        <FilterSelect label="Entity type" value={entityType} options={entityTypes} onChange={(v) => { setEntityType(v); resetPage() }} />
        <FilterSelect label="Source" value={source} options={SOURCES} onChange={(v) => { setSource(v); resetPage() }} />
        <Filter label="Date range">
          <DateRangePicker
            from={fromISO}
            to={toISO}
            today={today}
            min={earliestISO}
            max={todayISO}
            onChange={(f, t) => {
              setFromISO(f)
              setToISO(t)
              resetPage()
            }}
          />
        </Filter>
        <span className="tw:pb-1.5 tw:text-[12.5px] tw:text-mist">{data.length} entries</span>
      </div>

      <TableCard>
        <div
          ref={scrollRef}
          className="tw:overflow-auto"
          style={paging === 'virtual' ? { height: VIRTUAL_HEIGHT } : undefined}
          tabIndex={paging === 'virtual' ? 0 : undefined}
          aria-label={paging === 'virtual' ? 'Audit entries, scrollable' : undefined}
          role={paging === 'virtual' ? 'region' : undefined}
        >
          <Table className="tw:min-w-[900px] tw:text-[12.5px]" aria-rowcount={data.length + 1}>
            {head}
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No matching audit entries.</TableCell>
                </TableRow>
              )}
              {padTop > 0 && (
                <tr aria-hidden>
                  <td colSpan={6} style={{ height: padTop, padding: 0 }} />
                </tr>
              )}
              {shown.map(({ row, index }) => (
                <TableRow
                  key={row.id}
                  data-index={index}
                  aria-rowindex={(paging === 'pages' ? pagination.pageIndex * PAGE_SIZE : 0) + index + 2}
                  ref={paging === 'virtual' ? virtualizer.measureElement : undefined}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="tw:h-auto tw:px-2.5 tw:py-2 tw:align-top tw:whitespace-normal">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {padBottom > 0 && (
                <tr aria-hidden>
                  <td colSpan={6} style={{ height: padBottom, padding: 0 }} />
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </TableCard>

      {paging === 'pages' && data.length > PAGE_SIZE && (
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:text-[12.5px] tw:text-slate">
          <span>
            Entries <span className="tw:font-mono">{pagination.pageIndex * PAGE_SIZE + 1}</span> to{' '}
            <span className="tw:font-mono">{Math.min((pagination.pageIndex + 1) * PAGE_SIZE, data.length)}</span> of <span className="tw:font-mono">{data.length}</span>, newest first
          </span>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Newer entries">
              <ChevronLeftIcon aria-hidden /> Newer
            </Button>
            <span className="tw:font-mono">
              {pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Older entries">
              Older <ChevronRightIcon aria-hidden />
            </Button>
          </div>
        </div>
      )}
      {paging === 'virtual' && data.length > 0 && <div className="tw:text-xs tw:text-mist">All {data.length} matching entries, newest first. Only the rows in view are drawn.</div>}
    </div>
  )
}

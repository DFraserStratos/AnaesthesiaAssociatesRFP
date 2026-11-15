import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BellRingIcon, ChevronLeftIcon, PlusIcon } from 'lucide-react'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { useAppStore, useListTimes } from '@proto/store'
import { useListWarnings, WarningTriangle } from '@proto/shared'
import { useListInvoices } from '@proto/shared/schedule'
import { bookingFee } from '@proto/shared/capture'
import { formatCurrency, locationName, slotTimeRange } from '@proto/shared/format'
import { sessionText } from '@proto/domain/outOfHours'
import { surgeonSpecialtyLabel } from '@proto/domain/specialties'
import { NEEDS_PRICE_LABEL } from '@proto/domain/billing/priceRanges'
import { Button, buttonVariants } from '@/components/ui/button'
import { ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { coreFeatures, DataTable, FootCell, Missing, Panel, Said, StatusBadge, StatusBar, Wide, type OpenMode, type StatusToken } from './shared'
import { TickMark } from './TickBadge'

interface Booking {
  id: string
  listId: string
  patientId: string
  scheduledTime?: string
  completed: boolean
  cancellation?: unknown
}

interface Row {
  booking: Booking
  time: string
  patientName: string
  nhi: string
  operation: string
  extraProcedures: number
  units: number
  fee: number
  needsPrice: boolean
  invoiced: number
}

const helper = createColumnHelper<typeof coreFeatures, Row>()
const money = (n: number) => formatCurrency(n) as string

/** The patient cell: name (struck through when cancelled), the List's warnings, NHI below. */
function PatientCell({ r, warnings }: { r: Row; warnings: unknown[] }) {
  const cancelled = r.booking.cancellation !== undefined
  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className={cn('tw:font-semibold', cancelled && 'tw:line-through')}>{r.patientName}</span>
        <WarningTriangle warnings={warnings} size="sm" />
      </div>
      <div className="tw:mt-0.5 tw:font-mono tw:text-[11.5px] tw:text-mist">{r.nhi}</div>
    </>
  )
}

function StatusCell({ r }: { r: Row }) {
  if (r.booking.cancellation !== undefined) return <span className="tw:text-xs tw:font-semibold tw:text-error-on-tint">Cancelled</span>
  if (r.booking.completed) {
    return (
      <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:text-success-on-tint">
        Complete <TickMark size={26} />
      </span>
    )
  }
  // A label, not a second control: the row (or its handle) opens the Booking.
  return <span className={cn(buttonVariants({ variant: 'pill', size: 'sm' }), 'tw:pointer-events-none tw:h-auto tw:px-3.5 tw:py-[7px]')}>Capture</span>
}

/**
 * List detail's Bookings panel on TanStack Table v9 + shadcn Table: the same rows, figures (bookingFee)
 * and warnings as ListDetailView, the progress bar on Base UI Progress, the totals in a tfoot. The page's
 * Move, Alert the office, Submit, attachments and invoices are left out (their own rows); Add a booking
 * only reports here.
 */
export function ListDetailBookingsReplacement({ openMode = 'button' }: { openMode?: OpenMode }) {
  const f = useWebFixtures() as { detailListId?: string; todayISO: string }
  if (f.detailListId === undefined) return <Missing what="active List" />
  return <Body listId={f.detailListId} todayISO={f.todayISO} openMode={openMode} />
}

function Body({ listId, todayISO, openMode }: { listId: string; todayISO: string; openMode: OpenMode }) {
  const list = useAppStore((s: any) => s.schedule.lists[listId])
  const times = useListTimes(list)
  const bookings = useAppStore((s: any) => s.schedule.bookings)
  const procedures = useAppStore((s: any) => s.schedule.procedures)
  const billingLines = useAppStore((s: any) => s.schedule.billingLines)
  const masters = useAppStore((s: any) => s.masters)
  const invoices = useListInvoices(listId) as { bookingId: string; total: number }[]
  const warningsByBooking = useListWarnings(listId) as Map<string, unknown[]>
  const [said, setSaid] = useState<string | null>(null)

  const model = useMemo(() => {
    if (list === undefined || list.state === 'DRAFT') return undefined
    const invoiced = new Map<string, number>()
    for (const r of invoices) invoiced.set(r.bookingId, (invoiced.get(r.bookingId) ?? 0) + r.total)
    const procs = new Map<string, { id: string; description?: string }[]>()
    for (const p of Object.values(procedures) as { id: string; bookingId: string; description?: string }[]) {
      const b = procs.get(p.bookingId)
      if (b === undefined) procs.set(p.bookingId, [p])
      else b.push(p)
    }
    for (const b of procs.values()) b.sort((a, c) => a.id.localeCompare(c.id))
    const rows: Row[] = (Object.values(bookings) as Booking[])
      .filter((b) => b.listId === listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((booking) => {
        const ps = procs.get(booking.id) ?? []
        const totals = booking.cancellation === undefined ? (bookingFee(ps, list, masters, billingLines, booking.patientId) as { units: number; total: number; needsPrice: boolean }) : { units: 0, total: 0, needsPrice: false }
        return {
          booking,
          time: booking.scheduledTime ?? '·',
          patientName: masters.patients[booking.patientId]?.name ?? 'Unknown patient',
          nhi: masters.patients[booking.patientId]?.nhi ?? 'NHI pending',
          operation: ps[0]?.description || 'Procedure to capture',
          extraProcedures: Math.max(0, ps.length - 1),
          units: totals.units,
          fee: totals.total,
          needsPrice: totals.needsPrice,
          invoiced: invoiced.get(booking.id) ?? 0,
        }
      })
    const active = rows.filter((r) => r.booking.cancellation === undefined)
    return {
      rows,
      activeCount: active.length,
      done: active.filter((r) => r.booking.completed).length,
      units: active.reduce((n, r) => n + r.units, 0),
      fee: active.reduce((n, r) => n + r.fee, 0),
      needsPrice: active.some((r) => r.needsPrice),
      invoiced: active.reduce((n, r) => n + r.invoiced, 0),
    }
  }, [list, listId, bookings, procedures, billingLines, masters, invoices])

  const authorised = list?.state === 'AUTHORISED'
  const kind = (list?.kind ?? 'private') as StatusToken

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('time', {
          header: 'Time',
          cell: (i) => (
            <span className="tw:inline-flex tw:items-center tw:gap-2.5">
              <StatusBar token={kind} height={26} />
              {i.getValue()}
            </span>
          ),
        }),
        helper.accessor('patientName', { id: 'patient', header: 'Patient', cell: ({ row }) => <PatientCell r={row.original} warnings={warningsByBooking.get(row.original.booking.id) ?? []} /> }),
        helper.accessor('operation', {
          id: 'procedure',
          header: 'Procedure',
          cell: ({ row }) => (
            <>
              {row.original.operation}
              {row.original.extraProcedures > 0 && <span className="tw:text-mist"> · +{row.original.extraProcedures} more</span>}
            </>
          ),
        }),
        ...(authorised
          ? [helper.accessor('invoiced', { header: 'Invoiced', cell: ({ row }) => (row.original.booking.cancellation !== undefined ? '·' : money(row.original.invoiced)) })]
          : [
              helper.accessor('units', { header: 'Units', cell: ({ row }) => (row.original.booking.cancellation !== undefined ? '·' : row.original.units) }),
              helper.accessor('fee', {
                header: 'Fee',
                cell: ({ row }) => (row.original.booking.cancellation !== undefined ? '·' : row.original.needsPrice ? NEEDS_PRICE_LABEL : money(row.original.fee)),
              }),
            ]),
        helper.display({ id: 'status', header: 'Status', cell: ({ row }) => <StatusCell r={row.original} /> }),
      ]),
    [authorised, kind, warningsByBooking],
  )

  const table = useTable({ features: coreFeatures, columns, data: model?.rows ?? [], getRowId: (r) => r.booking.id })

  if (list === undefined || model === undefined) return null

  const hospitalName = locationName(list.hospitalId, masters.hospitals) as string
  const surgeon = masters.surgeons[list.surgeonId]
  const title = list.kind === 'preop' ? 'Pre-op assessment' : hospitalName
  const dayLabel = list.dateISO === todayISO ? 'Today' : format(parseISO(list.dateISO), 'EEE d MMM yyyy')
  const subline = [surgeon?.name, surgeonSpecialtyLabel(masters, surgeon), dayLabel, times !== undefined ? slotTimeRange(times) : undefined].filter((p) => p !== undefined && p !== '').join(' · ')
  const pct = model.activeCount > 0 ? Math.round((model.done / model.activeCount) * 100) : 0

  return (
    <Wide width={1180}>
      <div className="tw:flex tw:flex-col tw:gap-4">
        <Said text={said} />
        <Button variant="link" className="tw:self-start tw:text-sm" onClick={() => setSaid('Would go back to Lists')}>
          <ChevronLeftIcon aria-hidden /> Lists
        </Button>
        <div>
          <div className="tw:flex tw:items-center tw:gap-2.5">
            <h1 className="tw:m-0 tw:text-[28px] tw:leading-[34px] tw:font-bold tw:tracking-[-0.015em]">
              {title} {sessionText(list.session)}
            </h1>
            <StatusBadge status={list.kind} />
          </div>
          <div className="tw:mt-1 tw:text-sm tw:text-slate">{subline}</div>
          {/* Alert the office, as a plain stand-in: it only reports here (the Alert office sheet is its own row). */}
          <Button variant="outline" size="lg" className="tw:mt-2.5 tw:w-full tw:max-w-[520px] tw:text-ink" onClick={() => setSaid('Would open Alert the office (its own row)')}>
            <BellRingIcon aria-hidden /> Alert the office
          </Button>
        </div>

        <Panel
          flush
          title="Bookings"
          action={
            <ProgressPrimitive.Root value={pct} className="tw:flex tw:items-center tw:gap-3">
              <ProgressPrimitive.Label className="tw:flex-none tw:text-xs tw:font-semibold tw:text-slate">
                {model.done} of {model.activeCount} complete
              </ProgressPrimitive.Label>
              <ProgressTrack className="tw:w-[200px] tw:bg-line">
                <ProgressIndicator className="tw:bg-success" />
              </ProgressTrack>
            </ProgressPrimitive.Root>
          }
        >
          <DataTable
            table={table}
            mono={['time', 'units', 'fee', 'invoiced']}
            align={{ units: 'right', fee: 'right', invoiced: 'right', status: 'right' }}
            empty="No bookings on this List yet."
            openMode={openMode}
            onOpen={(r) => setSaid(`Would open Booking ${r.booking.id}`)}
            handle={{ column: 'patient', label: (r) => `Open ${r.patientName}'s Booking${r.time !== '·' ? ` at ${r.time}` : ''}` }}
            rowClassName={(r) => (r.booking.cancellation !== undefined ? 'tw:opacity-60' : undefined)}
            footer={
              model.activeCount > 0 ? (
                <TableRow className="tw:border-0 tw:bg-[var(--aa-bg)] tw:hover:bg-[var(--aa-bg)]">
                  <FootCell density="roomy" />
                  <FootCell density="roomy" header className="tw:font-bold">
                    Totals
                  </FootCell>
                  <FootCell density="roomy" />
                  {authorised ? (
                    <FootCell density="roomy" right bold mono>
                      {money(model.invoiced)}
                    </FootCell>
                  ) : (
                    <>
                      <FootCell density="roomy" right bold mono>
                        {model.units}
                      </FootCell>
                      <FootCell density="roomy" right bold mono>
                        {model.needsPrice ? NEEDS_PRICE_LABEL : money(model.fee)}
                      </FootCell>
                    </>
                  )}
                  <FootCell density="roomy" />
                </TableRow>
              ) : undefined
            }
          />
          {!authorised && (
            <div className="tw:px-5 tw:pb-5">
              <Button variant="outline" size="lg" className="tw:w-full tw:border-[1.5px] tw:border-dashed tw:border-line-strong tw:text-sm tw:text-primary" onClick={() => setSaid('Would open Add a booking')}>
                <PlusIcon aria-hidden className="tw:size-[17px]" /> Add a booking
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </Wide>
  )
}

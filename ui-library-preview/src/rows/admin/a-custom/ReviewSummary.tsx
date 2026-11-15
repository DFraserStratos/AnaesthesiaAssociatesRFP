import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Lock, Receipt, TriangleAlert } from 'lucide-react'
import { incompleteBookingsOn, useAppStore, useListTimes, OFFICE_ACTOR } from '@proto/store'
import { resolveDisplayStatus, useListWarnings } from '@proto/shared'
import { bookingFee, procedureFee } from '@proto/shared/capture'
import { dayMicroCap, formatCurrency, hhmm, locationName, slotTimeRange } from '@proto/shared/format'
import { billedPartyFor } from '@proto/domain/billing/whoIsBilled'
import { counterpartyName } from '@proto/store/selectors'
import { NEEDS_PRICE_LABEL } from '@proto/domain/billing/priceRanges'
import { reviewFlagsForBooking } from '@proto/apps/admin/reviewFlags'
import { sessionText } from '@proto/domain/outOfHours'
import { surgeonSpecialtyLabel } from '@proto/domain/specialties'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Echo } from '../pilot-a/Echo'
import type { ResolvedStatus, StatusToken } from './statusFill'

/** The prototype records this row reads (TS never sees @proto). */
interface Procedure {
  id: string
  bookingId: string
  description: string
  governingContractId?: string
  anaestheticStartISO?: string
  handoverISO?: string
}
interface Booking {
  id: string
  listId: string
  patientId: string
  scheduledTime?: string
  completed?: boolean
  cancellation?: unknown
}
interface ReviewFlag {
  tone: 'warn' | 'info'
  text: string
}
interface Warning {
  text: string
  strength: 'mild' | 'strong'
  clearance?: unknown
}
type Store = {
  schedule: { lists: Record<string, any>; bookings: Record<string, Booking>; procedures: Record<string, Procedure>; billingLines: Record<string, { id: string; procedureId: string }> }
  masters: any
  audit: { entityId: string; action: string; atISO: string }[]
}

/** Which confirm the authorise step uses (the open choice). */
export type ConfirmKind = 'dialog' | 'alert'

/**
 * The review page's representative part: header, the four summary tiles
 * (shadcn Card), the bookings table with totals and flags (shadcn Table), the
 * action bar and the authorise confirm. Every figure comes from the same real
 * calculators (procedureFee, bookingFee, reviewFlagsForBooking) over the seed's
 * first submitted List. Authorise and the phone note are local only.
 */
export function ReviewSummaryReplacement({ confirm = 'dialog' }: { confirm?: ConfirmKind }) {
  const { submittedListId } = useSeedIds() as { submittedListId?: string }
  if (submittedListId === undefined) return <div className="tw:text-[13px] tw:text-mist">The seed has no submitted Lists right now (try Demo reset).</div>
  return <Review listId={submittedListId} confirm={confirm} />
}

function Review({ listId, confirm }: { listId: string; confirm: ConfirmKind }) {
  const lists: Store['schedule']['lists'] = useAppStore((s: Store) => s.schedule.lists)
  const bookingsRecord: Store['schedule']['bookings'] = useAppStore((s: Store) => s.schedule.bookings)
  const proceduresRecord: Store['schedule']['procedures'] = useAppStore((s: Store) => s.schedule.procedures)
  const billingLines: Store['schedule']['billingLines'] = useAppStore((s: Store) => s.schedule.billingLines)
  const masters: Store['masters'] = useAppStore((s: Store) => s.masters)
  const audit: Store['audit'] = useAppStore((s: Store) => s.audit)
  const list = lists[listId]
  const times = useListTimes(list) as { startTime: string; endTime: string } | undefined
  const warningsByBooking = useListWarnings(listId) as ReadonlyMap<string, Warning[]>

  const [authorised, setAuthorised] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [echo, setEcho] = useState(`Reviewing ${listId}`)

  const rows = useMemo(() => {
    if (list === undefined) return []
    return Object.values(bookingsRecord)
      .filter((b) => b.listId === listId && b.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
      .map((booking) => {
        const procs = Object.values(proceduresRecord)
          .filter((p) => p.bookingId === booking.id)
          .sort((a, b) => a.id.localeCompare(b.id))
        const views = procs.map((p) => procedureFee({ procedure: p, list, masters, billingLines, patientId: booking.patientId }))
        const totals = bookingFee(procs, list, masters, billingLines, booking.patientId) as { units: number; total: number; needsPrice: boolean }
        const flags = reviewFlagsForBooking({
          booking,
          procedures: procs.map((p, i) => ({ procedure: p, fee: views[i].fee, rvgGroup: views[i].rvgGroup })),
          contracts: masters.contracts,
          parties: masters.parties,
          timeRule: masters.rvgTimeRule,
          modifierInputs: { patientDobISO: masters.patients[booking.patientId]?.dobISO, procedureDateISO: list.dateISO, modifiers: masters.modifiers },
        }) as ReviewFlag[]
        // Who is billed, exactly as the prototype's ReviewScreen: the Contract says; "Mixed" when Procedures differ.
        const billed = new Map<string, string>()
        for (const p of procs) {
          const contract = p.governingContractId !== undefined ? masters.contracts[p.governingContractId] : undefined
          const ref = billedPartyFor(p, contract, masters.parties, booking.patientId) as { kind: string; id: string } | undefined
          if (ref !== undefined) billed.set(`${ref.kind}:${ref.id}`, counterpartyName({ masters }, ref) as string)
        }
        const billedText = billed.size === 0 ? 'Needs an invoice destination' : billed.size > 1 ? 'Mixed' : [...billed.values()][0]
        return { booking, primary: procs[0], primaryView: views[0], totals, flags, billedText, procCount: procs.length }
      })
  }, [list, listId, bookingsRecord, proceduresRecord, billingLines, masters])

  if (list === undefined) return null
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  const surgeon = masters.surgeons[list.surgeonId]
  const specialty = surgeonSpecialtyLabel(masters, surgeon) as string
  const hospitalName = locationName(list.hospitalId, masters.hospitals) as string
  const incompleteNames = (incompleteBookingsOn(useAppStore.getState(), listId) as Booking[]).map((b) => masters.patients[b.patientId]?.name ?? 'Unknown patient')
  const totals = rows.reduce((acc, r) => ({ units: acc.units + r.totals.units, fee: acc.fee + r.totals.total, needsPrice: acc.needsPrice || r.totals.needsPrice }), { units: 0, fee: 0, needsPrice: false })
  const feeText = totals.needsPrice ? NEEDS_PRICE_LABEL : formatCurrency(totals.fee)
  const flagCount = rows.reduce((n, r) => n + r.flags.length, 0)
  const unitRate: number = anaesthetist?.unitValue ?? 0
  const submitAt = audit.filter((a) => a.entityId === listId && a.action === 'list.submit').at(-1)?.atISO
  const dayLabel = dayMicroCap(list.dateISO) as string
  const kindToken = list.kind as StatusToken

  function authorise() {
    setConfirmOpen(false)
    setAuthorised(true)
    setEcho('Authorised locally (the demo store is not written).')
  }

  return (
    <TooltipProvider delay={300}>
      <div className="tw:flex tw:min-w-[1100px] tw:flex-col tw:gap-4">
        <Echo>{echo}</Echo>
        <Breadcrumb>
          <BreadcrumbList className="tw:text-[13px]">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="tw:font-semibold tw:text-ink" onClick={(e) => { e.preventDefault(); setEcho('Back (stubbed).') }}>
                Review queue
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="tw:text-mist">
                {anaesthetist?.name ?? list.anaesthetistId} · {hospitalName} {sessionText(list.session)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button variant="link" className="tw:h-auto tw:self-start tw:gap-1 tw:p-0 tw:text-sm" onClick={() => setEcho('Back (stubbed).')}>
          <ChevronLeft className="tw:size-4!" strokeWidth={2.4} aria-hidden /> Back to queue
        </Button>

        <div className="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-4">
          <div>
            <h1 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">
              {hospitalName} · {sessionText(list.session)} list
            </h1>
            <div className="tw:mt-1 tw:text-[13px] tw:text-slate">
              {anaesthetist?.name ?? list.anaesthetistId}
              {surgeon !== undefined ? ` · ${surgeon.name}` : ''}
              {specialty !== '' ? ` · ${specialty}` : ''}
              {` · ${dayLabel}${times !== undefined ? ` · ${slotTimeRange(times)}` : ''}`}
            </div>
          </div>
          <div className="tw:ml-auto tw:flex tw:flex-col tw:items-end tw:gap-2.5">
            <div className="tw:flex tw:flex-wrap tw:justify-end tw:gap-2">
              <Button variant="outline" onClick={() => setEcho('Previous in queue (stubbed).')}>
                <ArrowLeft aria-hidden /> Previous in queue
              </Button>
              <Button variant="outline" onClick={() => setEcho('Next in queue (stubbed).')}>
                Next in queue <ArrowRight aria-hidden />
              </Button>
              <Button variant="outline" onClick={() => setEcho('View invoices (stubbed).')}>
                <Receipt aria-hidden /> View invoices
              </Button>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Badge variant={kindToken}>{(resolveDisplayStatus(list.kind, masters.slotStatuses) as ResolvedStatus).label}</Badge>
              {submitAt !== undefined && !authorised && <Badge variant="warning" className="tw:px-2.5 tw:py-1 tw:text-xs">Submitted {hhmm(submitAt)}</Badge>}
            </div>
          </div>
        </div>

        {authorised && (
          <div role="status" className="aa-motion-fade tw:flex tw:items-center tw:gap-3 tw:rounded-card tw:border tw:border-[color-mix(in_srgb,var(--success)_27%,transparent)] tw:bg-success-tint tw:p-4">
            <span aria-hidden className="tw:flex tw:size-[30px] tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-success tw:text-white">
              <Check className="tw:size-[18px]!" strokeWidth={3} />
            </span>
            <div>
              <div className="tw:text-sm tw:font-bold tw:text-success-on-tint">List authorised · locked for billing</div>
              <div className="tw:text-xs tw:text-success-on-tint">
                {dayLabel} · {OFFICE_ACTOR.who} · Handed to the billing run (local only)
              </div>
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="tw:grid tw:grid-cols-4 tw:gap-3">
          <Tile label="Bookings" value={String(rows.length)} />
          <Tile label="Total units" value={String(totals.units)} />
          <Tile label="Total fee" value={feeText} />
          <Tile label="Flags" value={String(flagCount)} warn={flagCount > 0} sub="to check before authorising" />
        </div>

        {/* Review table */}
        <div className={cn('tw:overflow-x-auto tw:rounded-card tw:border tw:border-line tw:bg-surface tw:transition-opacity tw:duration-300', authorised && 'tw:opacity-[0.72]')}>
          <Table className="tw:min-w-[1120px]">
            <TableHeader>
              <TableRow>
                {['Time', 'Patient', 'Billed to', 'Contract', 'Code', 'Times', 'B · T · M', 'Units', 'Fee', 'Flags'].map((h, i) => (
                  <TableHead key={h} data-numeric={i === 7 || i === 8 ? '' : undefined}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ booking, primary, primaryView, totals: t, flags, billedText, procCount }) => {
                const patient = masters.patients[booking.patientId]
                const btm = primaryView?.fee.btm
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="tw:font-mono tw:whitespace-nowrap">{booking.scheduledTime ?? '·'}</TableCell>
                    <TableCell>
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        <span className="tw:text-[13.5px] tw:font-semibold">{patient?.name ?? 'Unknown'}</span>
                        <WarningMark warnings={warningsByBooking.get(booking.id) ?? []} />
                        {!booking.completed && <Badge variant="warning" className="tw:text-[11px]">Not complete</Badge>}
                      </div>
                      <div className="tw:font-mono tw:text-[11.5px] tw:text-mist">
                        {patient?.nhi ?? 'NHI pending'} · {primary?.description ?? 'Procedure'}
                        {procCount > 1 ? ` · +${procCount - 1} more` : ''}
                      </div>
                    </TableCell>
                    <TableCell>{billedText}</TableCell>
                    <TableCell>{primaryView?.contract?.name ?? 'None'}</TableCell>
                    <TableCell className="tw:font-mono tw:whitespace-nowrap tw:text-primary">
                      {primaryView?.rvgGroup !== undefined ? (
                        <Tooltip>
                          <TooltipTrigger render={<span tabIndex={0} className="tw:outline-none tw:focus-visible:shadow-focus" />}>{primaryView.rvgGroup.code}</TooltipTrigger>
                          <TooltipContent>{primaryView.rvgGroup.description}</TooltipContent>
                        </Tooltip>
                      ) : (
                        '·'
                      )}
                    </TableCell>
                    <TableCell className="tw:font-mono tw:whitespace-nowrap">{primary?.anaestheticStartISO !== undefined ? `${hhmm(primary.anaestheticStartISO)} to ${hhmm(primary.handoverISO)}` : '·'}</TableCell>
                    <TableCell className="tw:font-mono tw:whitespace-nowrap tw:text-slate">{btm !== undefined ? `${btm.base.units} · ${btm.time.units} · ${btm.modifiers.units}` : '·'}</TableCell>
                    <TableCell data-numeric="" className="tw:font-mono tw:font-bold">{t.units}</TableCell>
                    <TableCell data-numeric="" className={cn('tw:font-semibold', !t.needsPrice && 'tw:font-mono')}>{t.needsPrice ? NEEDS_PRICE_LABEL : formatCurrency(t.total)}</TableCell>
                    <TableCell>
                      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1">
                        {flags.map((f, i) => (
                          <Badge key={i} variant={f.tone === 'warn' ? 'warning' : 'default'} className="tw:text-[11px]">
                            {f.text}
                          </Badge>
                        ))}
                        {authorised && <Lock className="tw:size-[13px]! tw:text-mist" aria-hidden />}
                        <Button variant="link" className="tw:text-xs!" onClick={() => setEcho(`History for ${booking.id} (stubbed).`)}>
                          History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="tw:bg-background tw:hover:bg-background">
                <TableCell />
                <TableCell className="tw:font-bold">Totals</TableCell>
                <TableCell colSpan={4} />
                <TableCell />
                <TableCell data-numeric="" className="tw:font-mono tw:font-bold">{totals.units}</TableCell>
                <TableCell data-numeric="" className="tw:font-mono tw:font-bold">{feeText}</TableCell>
                <TableCell className="tw:text-xs tw:text-mist">@ ${unitRate.toFixed(2)}/unit (list rate)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {notes.map((n, i) => (
          <div key={i} className="tw:text-[12.5px] tw:text-slate">
            <span className="tw:font-mono tw:text-mist">Phone note · {OFFICE_ACTOR.who}</span> · {n}
          </div>
        ))}

        {/* Action bar */}
        <Card size="sm" className="tw:flex-row tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:px-4">
          <div className="tw:flex tw:flex-col tw:gap-1">
            <div className="tw:text-sm tw:font-semibold">
              {rows.length} booking{rows.length === 1 ? '' : 's'} · {totals.units} units · {feeText}
            </div>
            {!authorised && incompleteNames.length > 0 && (
              <div className="tw:text-[12.5px] tw:text-warning-on-tint">
                Not complete: {incompleteNames.join(', ')}. Complete {incompleteNames.length === 1 ? 'it' : 'them'} before authorising.
              </div>
            )}
            {!authorised && flagCount > 0 && (
              <div className="tw:text-[12.5px] tw:text-warning-on-tint">
                {flagCount} flag{flagCount === 1 ? '' : 's'} open. Check or note them before authorising.
              </div>
            )}
            <div className="tw:text-[11.5px] tw:text-mist">Authorisation is an OfficeAdmin action · acting as {OFFICE_ACTOR.who} (Office)</div>
          </div>
          {authorised ? (
            <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-pill tw:bg-success-tint tw:px-3.5 tw:py-2 tw:text-[13.5px] tw:font-bold tw:text-success-on-tint">
              <Lock className="tw:size-3.5!" aria-hidden /> Authorised · locked
            </span>
          ) : (
            <div className="tw:flex tw:gap-2">
              <Button variant="outline" size="lg" onClick={() => setNoteOpen(true)}>
                Log phone note
              </Button>
              <Button size="lg" disabled={incompleteNames.length > 0} onClick={() => setConfirmOpen(true)}>
                Authorise for billing
              </Button>
            </div>
          )}
        </Card>

        <AuthoriseConfirm kind={confirm} open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={authorise} />

        <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader className="tw:gap-3.5">
              <DialogTitle className="tw:pr-0">Log a phone note</DialogTitle>
              <DialogDescription>Record a call about this list. It attaches to the list and its audit trail. It never returns the list to the anaesthetist.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="review-note">Note</FieldLabel>
              <Textarea id="review-note" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="e.g. Confirmed the missing reference with the hospital." />
            </Field>
            <Button
              size="lg"
              className="tw:w-full"
              disabled={noteText.trim() === ''}
              onClick={() => {
                setNotes((n) => [...n, noteText.trim()])
                setNoteText('')
                setNoteOpen(false)
              }}
            >
              Log note
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

const CONFIRM_TITLE = 'Authorise this list for billing?'
const CONFIRM_BODY =
  'Authorising locks every Booking on this List immutable (no further edits by anyone) and hands the List to the Billing Engine as a single unit. Invoices are raised immediately, grouped by counterparty. There is no return to the anaesthetist from here.'

/** The confirm, as a Dialog (scrim and Escape close it, as today) or an AlertDialog (only Cancel or Escape). */
function AuthoriseConfirm({ kind, open, onOpenChange, onConfirm }: { kind: ConfirmKind; open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }) {
  const buttons = (Cancel: ReactNode) => (
    <div className="tw:grid tw:grid-cols-2 tw:gap-2">
      {Cancel}
      <Button size="lg" onClick={onConfirm}>
        Authorise for billing
      </Button>
    </div>
  )
  if (kind === 'alert') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader className="tw:place-items-start tw:text-left">
            <AlertDialogTitle>{CONFIRM_TITLE}</AlertDialogTitle>
            <AlertDialogDescription className="tw:text-sm tw:leading-5">{CONFIRM_BODY}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="tw:block">{buttons(<AlertDialogCancel size="lg">Cancel</AlertDialogCancel>)}</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="tw:gap-3.5">
          <DialogTitle className="tw:pr-0">{CONFIRM_TITLE}</DialogTitle>
          <DialogDescription className="tw:text-sm tw:leading-5">{CONFIRM_BODY}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="tw:mt-0 tw:block">{buttons(<DialogClose render={<Button variant="outline" size="lg" />}>Cancel</DialogClose>)}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** One summary tile: shadcn Card at the prototype's 12px radius, eyebrow, mono figure, optional sub line. */
function Tile({ label, value, sub, warn = false }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <Card size="sm" className="tw:gap-1 tw:rounded-[12px]! tw:px-3.5 tw:py-3 tw:shadow-none">
      <span className="tw:text-[10.5px] tw:font-bold tw:tracking-[0.06em] tw:text-mist tw:uppercase">{label}</span>
      <span className={cn('tw:font-mono tw:text-[22px] tw:leading-7 tw:font-bold', warn ? 'tw:text-warning-on-tint' : 'tw:text-ink')}>{value}</span>
      {sub !== undefined && <span className="tw:text-[11px] tw:text-mist">{sub}</span>}
    </Card>
  )
}

/** The booking's warning triangle: a solid circle (error for a strong open warning), its count, and the texts in a Tooltip. */
function WarningMark({ warnings }: { warnings: readonly Warning[] }) {
  if (warnings.length === 0) return null
  const open = warnings.filter((w) => w.clearance === undefined)
  const strong = open.some((w) => w.strength === 'strong')
  const label = open.length === 0 ? `${warnings.length === 1 ? 'Warning' : `${warnings.length} warnings`} cleared` : `${open.length === 1 ? '1 warning' : `${open.length} warnings`}`
  return (
    <Tooltip>
      <TooltipTrigger render={<span role="img" tabIndex={0} aria-label={label} className="tw:inline-flex tw:items-center tw:gap-[3px] tw:outline-none tw:focus-visible:shadow-focus" />}>
        <span aria-hidden className={cn('tw:inline-flex tw:size-[15px] tw:items-center tw:justify-center tw:rounded-pill tw:text-white', open.length === 0 ? 'tw:bg-mist' : strong ? 'tw:bg-error' : 'tw:bg-warning')}>
          <TriangleAlert className="tw:size-[9px]!" strokeWidth={2.75} />
        </span>
        {open.length > 1 && <span aria-hidden className={cn('tw:text-[11px] tw:font-bold tw:tabular-nums', strong ? 'tw:text-error-on-tint' : 'tw:text-warning-on-tint')}>{open.length}</span>}
      </TooltipTrigger>
      <TooltipContent className="tw:flex-col tw:items-start">{(open.length > 0 ? open : warnings).map((w, i) => <span key={i}>{w.text}</span>)}</TooltipContent>
    </Tooltip>
  )
}

import { useMemo, useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { STATUS_PALETTE } from '../../../theme/statusColours'
import type { Booking, Procedure } from '../../../domain/types'
import { bookingContractCue, editRefusal, heldPricesForBooking, useAppStore, type Actor, useListTimes } from '../../../store'
import { StatusChip, TickBadge, useListWarnings, WarningTriangle } from '../../../shared'
import { warningsFor } from '../../../shared/warnings'
import { BalanceAlertPill, balanceAlertFromWarnings } from '../../../shared/patients'
import { SharedNotes } from '../../../shared/notes'
import { ListInvoices, useListInvoices } from '../../../shared/schedule'
import { LIST_PROGRESS_LABEL, listProgress } from '../../../domain/listProgress'
import { bookingFee } from '../../../shared/capture'
import { AddBookingFlow, AlertOfficeEntry, SubmitListSheet, movedToYouByLine, useIsMovable, useMovedToMeNotice, useMoveListPrompt } from '../../../shared/flows'
import { formatCurrency, slotTimeRange, locationName, dayWithYear } from '../../../shared/format'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { inDisplayOrder } from '../../../domain/billing/multiProcedure'
import { sessionText } from '../../../domain/outOfHours'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'
import { NEEDS_PRICE_LABEL } from '../../../domain/billing/priceRanges'
import { AddRowButton } from '../../../shared/ui/AddRowButton'
import { BackLink, Button, Card, PageHeader, ProgressBar } from '../../../shared/ui'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'
import { withStubsInTimeOrder } from '../../../domain/intake/stubs'
import { useListStubs } from '../../../store/stubSelectors'
import { ListStubNote, StubTableRow } from '../../../shared/stubs'

/** The totals row keeps no divider under it (the table's last line), as before the kit. */
const TOTALS_CELL = { borderBottom: 'none' } as const

interface ListDetailViewProps {
  listId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  onOpenBooking: (bookingId: string) => void
}

interface BookingRow {
  booking: Booking
  time: string
  patientName: string
  nhi: string
  procedure: string
  extraProcedures: number
  /** "Needs an invoice destination" or "RVG code to fill in" (catch-up Phase 20). */
  cue: string | undefined
  units: number
  fee: number
  /** No price on the List's date (catch-up Phase 19a): the fee reads "Needs a price". */
  needsPrice: boolean
  /** What the Booking was invoiced at (GST inclusive), for an authorised List. */
  invoiced: number
}

/**
 * Web List detail (drill-down page; W2 / M6-M7 parity). Same guarded flows as
 * mobile — the shared `AddBookingFlow` (a dialog on web via the surface seam) and
 * the shared completion-gated `SubmitListSheet` — but a desktop screen rather
 * than the phone's stack of tappable cards: the page header and `Panel flush`
 * table of the neighbouring Lists screen, so drilling in never changes idiom.
 *
 * The width a desktop has buys columns the phone cannot afford: NHI, units and
 * fee per booking, and a totals row. Figures come from the Phase 01 calculator via
 * `bookingFee`, the same call the review screen and the completion overlay make.
 * Submitting is the page's primary action, top right, where every other web
 * screen puts one.
 */
export function ListDetailView({ listId, actor, todayISO, onBack, onOpenBooking }: ListDetailViewProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const times = useListTimes(list)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  // The cue's reads (catch-up Phase 20): the whole schedule and masters, so it never goes stale.
  const cueState = useAppStore((s) => s)
  const masters = useAppStore((s) => s.masters)
  const [addOpen, setAddOpen] = useState(false)
  const [submitSheet, setSubmitSheet] = useState<'none' | 'blockers' | 'confirm'>('none')
  // Catch-up Phase 32: her own move, and the notice when a colleague moved it to her.
  const movable = useIsMovable(listId, actor.anaesthetistId)
  const movePrompt = useMoveListPrompt()
  const moved = useMovedToMeNotice(listId, actor.anaesthetistId)
  // An authorised List is read only: its invoices, and what each Booking was
  // invoiced at, not a fee recomputed from today's prices (catch-up Phase 38a).
  const invoices = useListInvoices(listId)
  const invoicedByBooking = useMemo(() => {
    const out = new Map<string, number>()
    for (const r of invoices) out.set(r.bookingId, (out.get(r.bookingId) ?? 0) + r.total)
    return out
  }, [invoices])

  const model = useMemo(() => {
    // A Draft List never reaches an anaesthetist surface (OQ-86 answered no, D46).
    if (list === undefined || list.state === 'DRAFT') return undefined
    const procsByBooking = new Map<string, Procedure[]>()
    for (const p of Object.values(proceduresRecord)) {
      const bucket = procsByBooking.get(p.bookingId)
      if (bucket === undefined) procsByBooking.set(p.bookingId, [p])
      else bucket.push(p)
    }
    for (const bucket of procsByBooking.values()) bucket.sort((a, b) => a.id.localeCompare(b.id))

    const rows: BookingRow[] = Object.values(bookingsRecord)
      .filter((c) => c.listId === listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((booking) => {
        // The primary first (catch-up Phase 23): the row's operation text is the primary's.
        const procs = inDisplayOrder(procsByBooking.get(booking.id) ?? [])
        const totals = booking.cancellation === undefined ? bookingFee({ procedures: procs, list, masters, patientId: booking.patientId, held: heldPricesForBooking(cueState, booking.id), ...(cueState.billing.locks[booking.id] !== undefined ? { lock: cueState.billing.locks[booking.id]! } : {}) }) : { units: 0, total: 0, needsPrice: false }
        // What it was invoiced at: the same invoices the Invoices panel lists.
        const invoiced = invoicedByBooking.get(booking.id) ?? 0
        return {
          booking,
          time: booking.scheduledTime ?? '·',
          patientName: masters.patients[booking.patientId]?.name ?? 'Unknown patient',
          nhi: masters.patients[booking.patientId]?.nhi ?? '',
          procedure: procs[0] !== undefined ? procedureLabel(procs[0], masters.rvgGroups, 1) : 'Procedure to capture',
          extraProcedures: Math.max(0, procs.length - 1),
          cue: booking.cancellation === undefined ? bookingContractCue(cueState, booking.id) : undefined,
          units: totals.units,
          fee: totals.total,
          needsPrice: totals.needsPrice,
          invoiced,
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
  }, [list, listId, bookingsRecord, proceduresRecord, masters, invoicedByBooking, cueState])

  const warningsByBooking = useListWarnings(listId)
  // The balance chip reads these warnings, never a second evaluation per row (catch-up Phase 40).
  const schedule = useAppStore((s) => s.schedule)
  // Stubs for rows waiting at intake (catch-up Phase 33a): in time order, never counted or totalled.
  const stubs = useListStubs(listId)
  const entries = useMemo(() => withStubsInTimeOrder(model?.rows ?? [], (r) => r.booking.scheduledTime, stubs), [model, stubs])

  if (list === undefined || model === undefined) return null

  const hospitalName = locationName(list.hospitalId, masters.hospitals)
  const surgeon = masters.surgeons[list.surgeonId]
  const isPreop = list.kind === 'preop'
  const title = isPreop ? 'Pre-op assessment' : hospitalName
  const dayLabel = list.dateISO === todayISO ? 'Today' : dayWithYear(list.dateISO)
  const authorised = list.state === 'AUTHORISED'
  const progressLabel = LIST_PROGRESS_LABEL[listProgress(list, [], todayISO)]
  const subline = [surgeon?.name, surgeonSpecialtyLabel(masters, surgeon), dayLabel, times !== undefined ? slotTimeRange(times) : undefined]
    .filter((p): p is string => p !== undefined && p !== '')
    .join(' · ')
  // ACTIVE or SUBMITTED, own List: editable until the office authorises it (catch-up Phase 38a).
  const canEdit = editRefusal(actor, list) === null
  const incomplete = model.activeCount - model.done

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackLink onClick={onBack}>Lists</BackLink>

      <PageHeader
        size="web"
        wrap
        title={`${title} ${sessionText(list.session)}`}
        aside={<StatusChip status={list.kind} />}
        subStyle={{ fontSize: 'inherit', color: 'inherit' }}
        sub={
          <>
            <div style={{ fontSize: 14, color: neutral.slate }}>{subline}</div>
            {moved !== undefined && (
              <div data-shot="list-moved-to-you" style={{ fontSize: 13, color: neutral.slate, marginTop: 6 }}>
                {movedToYouByLine(moved.atISO, moved.fromName)}
              </div>
            )}
            {/* Alert the office (catch-up Phase 32b, US-03.6.3): her own List only. */}
            <div style={{ marginTop: 10, maxWidth: 520 }}>
              <AlertOfficeEntry actor={actor} target={{ listId }} compact />
            </div>
          </>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {movable && movePrompt !== null && (
              <Button variant="outline" size="desktop" shot="list-move" onClick={() => movePrompt.openMove(listId)}>
                Move this List
              </Button>
            )}
            <SubmitAction
              state={list.state}
              authorisedLabel={progressLabel}
              incomplete={incomplete}
              onBlockers={() => setSubmitSheet('blockers')}
              onConfirm={() => setSubmitSheet('confirm')}
            />
          </div>
        }
      />

      <Card
        padding="panel"
        flush
        title="Bookings"
        action={
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>
              {model.done} of {model.activeCount} complete
            </span>
            <ProgressBar done={model.done} total={model.activeCount} width={200} tone={stubs.length > 0 ? 'held' : 'done'} />
            <ListStubNote count={stubs.length} />
          </span>
        }
      >
        {/* The table kit inside the titled card: the card is the shell, so the scroller drops its own chrome. */}
        <TableShell label="Bookings" bare>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Patient</Th>
                <Th>Procedure</Th>
                {authorised ? (
                  <Th align="right">Invoiced</Th>
                ) : (
                  <>
                    <Th align="right">Units</Th>
                    <Th align="right">Fee</Th>
                  </>
                )}
                <Th align="right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {model.rows.length === 0 && stubs.length === 0 && (
                <tr>
                  <td colSpan={authorised ? 5 : 6} style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>
                    No bookings on this List yet.
                  </td>
                </tr>
              )}
              {entries.map((entry) => {
                if (entry.kind === 'stub') return <StubTableRow key={entry.stub.id} stub={entry.stub} colSpan={authorised ? 5 : 6} />
                const r = entry.booking
                const cancelled = r.booking.cancellation !== undefined
                return (
                  <ClickableRow
                    key={r.booking.id}
                    onOpen={() => onOpenBooking(r.booking.id)}
                    style={{ opacity: cancelled ? 0.6 : 1 }}
                  >
                    <Td mono>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span aria-hidden style={{ width: 3, height: 26, borderRadius: radius.pill, background: STATUS_PALETTE[list.kind].solid, flex: 'none' }} />
                        {r.time}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* The row's keyboard handle (UI unification U1, U09): a plain button on the patient's name, as the web Lists table's; the row click stays for the mouse. */}
                        <RowOpenButton label={`Open Booking for ${r.patientName} at ${r.time}`} onOpen={() => onOpenBooking(r.booking.id)}>
                          <span style={{ fontWeight: 600, textDecoration: cancelled ? 'line-through' : 'none' }}>{r.patientName}</span>
                        </RowOpenButton>
                        <WarningTriangle warnings={warningsFor(warningsByBooking.get(r.booking.id) ?? [], 'anaesthetist')} size="sm" />
                        <BalanceAlertPill alert={balanceAlertFromWarnings({ schedule }, r.booking.id, actor.anaesthetistId, warningsByBooking.get(r.booking.id) ?? [])} />
                      </div>
                      <div className="mono" data-shot="list-row-nhi" style={{ fontSize: 11.5, color: neutral.mist, marginTop: 2 }}>{r.nhi}</div>
                    </Td>
                    <Td>
                      {r.procedure}
                      {r.extraProcedures > 0 && (
                        <span style={{ color: neutral.mist }}> · +{r.extraProcedures} more</span>
                      )}
                      {r.cue !== undefined && (
                        <div data-shot="list-row-contract-cue" style={{ fontSize: 11.5, color: neutral.slate, marginTop: 2 }}>{r.cue}</div>
                      )}
                    </Td>
                    {authorised ? (
                      <Td mono align="right">{cancelled ? '·' : formatCurrency(r.invoiced)}</Td>
                    ) : (
                      <>
                        <Td mono align="right">{cancelled ? '·' : r.units}</Td>
                        <Td mono align="right">{cancelled ? '·' : r.needsPrice ? NEEDS_PRICE_LABEL : formatCurrency(r.fee)}</Td>
                      </>
                    )}
                    <Td align="right">
                      {cancelled ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: semantic.error.onTint }}>Cancelled</span>
                      ) : r.booking.completed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: semantic.success.onTint }}>
                          Complete <TickBadge size={26} />
                        </span>
                      ) : (
                        <span style={{ padding: '7px 14px', borderRadius: radius.pill, background: accent.tint, fontSize: 13, fontWeight: 600, color: accent.pressed }}>
                          Capture
                        </span>
                      )}
                    </Td>
                  </ClickableRow>
                )
              })}
              {model.activeCount > 0 && (
                <tr style={{ background: neutral.bg }}>
                  <Td style={TOTALS_CELL} />
                  <Td style={TOTALS_CELL}>
                    <span style={{ fontWeight: 700 }}>Totals</span>
                  </Td>
                  <Td style={TOTALS_CELL} />
                  {authorised ? (
                    <Td mono align="right" style={TOTALS_CELL}><strong>{formatCurrency(model.invoiced)}</strong></Td>
                  ) : (
                    <>
                      <Td mono align="right" style={TOTALS_CELL}><strong>{model.units}</strong></Td>
                      <Td mono align="right" style={TOTALS_CELL}><strong>{model.needsPrice ? NEEDS_PRICE_LABEL : formatCurrency(model.fee)}</strong></Td>
                    </>
                  )}
                  <Td style={TOTALS_CELL} />
                </tr>
              )}
            </tbody>
        </TableShell>

        {canEdit && (
          <div style={{ padding: '0 20px 20px' }}>
            <AddRowButton onClick={() => setAddOpen(true)}>Add a booking</AddRowButton>
          </div>
        )}
      </Card>

      {authorised && (
        <Card padding="panel" title="Invoices">
          <ListInvoices rows={invoices} />
        </Card>
      )}

      {/* The shared note on the List (catch-up Phase 40; US-11.3.3): the office reads it in Admin. */}
      <Card padding="panel" title="Shared notes">
        <SharedNotes target={{ listId }} actor={actor} />
      </Card>

      <AddBookingFlow open={addOpen} listId={listId} actor={actor} onClose={() => setAddOpen(false)} onCreated={() => undefined} />
      {submitSheet !== 'none' && (
        <SubmitListSheet open listId={listId} actor={actor} mode={submitSheet} onClose={() => setSubmitSheet('none')} onSubmitted={() => setSubmitSheet('none')} />
      )}
    </div>
  )
}

/**
 * The page's primary action, in the header slot the dashboard uses for "Move a
 * List". Three states, all of them the same object: already submitted (a
 * static confirmation), blocked (the count of what is left, still clickable so
 * the blockers sheet can say which bookings), or ready.
 */
function SubmitAction({
  state,
  authorisedLabel,
  incomplete,
  onBlockers,
  onConfirm,
}: {
  state: string
  /** "Invoiced" or "Authorised" (LIST_PROGRESS_LABEL) for a List the office has authorised. */
  authorisedLabel: string
  incomplete: number
  onBlockers: () => void
  onConfirm: () => void
}) {
  const shared = {
    height: 42,
    padding: '0 20px',
    borderRadius: radius.md,
    border: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as const

  if (state === 'AUTHORISED') {
    return (
      <span data-shot="list-authorised-status" style={{ ...shared, background: neutral.sunken, color: neutral.slate }}>
        <Lock size={15} strokeWidth={2.4} aria-hidden /> {authorisedLabel} · read only
      </span>
    )
  }
  if (state !== 'ACTIVE') {
    return (
      <span style={{ ...shared, background: semantic.success.tint, color: semantic.success.onTint }}>
        <Check size={16} strokeWidth={3} aria-hidden /> Submitted to office
      </span>
    )
  }
  if (incomplete > 0) {
    return (
      <button
        type="button"
        className="aa-ctl"
        onClick={onBlockers}
        title="See what is left to finish"
        style={{ ...shared, background: neutral.surface, color: neutral.slate, border: `1px solid ${neutral.lineStrong}`, cursor: 'pointer' }}
      >
        {incomplete} to finish before submitting
      </button>
    )
  }
  return (
    <button type="button" className="aa-ctl" onClick={onConfirm} style={{ ...shared, background: accent.base, color: neutral.surface, cursor: 'pointer' }}>
      Mark list completed
    </button>
  )
}


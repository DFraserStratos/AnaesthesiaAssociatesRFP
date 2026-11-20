import { Link } from 'react-router-dom'
import { runDeliverySummary } from '../../../domain/billing/invoicePresentation'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Lock, Receipt } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic } from '../../../theme/tokens'
import type { AssignedList, Booking, Procedure } from '../../../domain/types'
import {
  activeAlertFor,
  approveContractChangesOnList,
  approveContractSelection,
  authoriseBlockersFor,
  type AuthoriseBlocker,
  authoriseList,
  clearWarning,
  contractChangeFor,
  incompleteBookingsOn,
  logListNote,
  pendingContractChangesOnList,
  resolveNotification,
  heldPricesForBooking,
  reviewInputFor,
  useAppStore,
  useListTimes,
  type Actor,
} from '../../../store'
import { Button, StatusChip, TextArea, useListWarnings, useSurface, WarningTriangle } from '../../../shared'
import { bookingFee } from '../../../shared/capture'
import { isNoChargeBooking } from '../../../domain/billing/procedurePrice'
import { roundToCents } from '../../../domain/billing/money'
import { disabledDaysByContract } from '../../../domain/billing/contractHistory'
import { dayMicroCap, formatCurrency, hhmm, locationName, slotTimeRange } from '../../../shared/format'
import { HistorySheet } from '../../../shared/booking'
import { ConfirmSheet, OverlayHeader, SheetActions } from '../../../shared/surface'
import { TableShell, Td, Th } from '../../../shared/table'
import { NEEDS_PRICE_LABEL } from '../../../domain/billing/priceRanges'
import { lockViewFor } from '../../../domain/billing/lock'
import { reviewFlagsForBooking, type ContractChangeRecord, type ReviewFlag } from '../../../domain/billing/reviewFlags'
import { approvalNumberMissing } from '../../../domain/billing/insurance'
import { PAYER_NOT_BILLED_YET, isPayerBilled, payerDetails } from '../../../domain/billing/whoIsBilled'
import { formatPostalAddress } from '../../../domain/billing/payer'
import { isOpen, type Warning } from '../../../domain/warnings'
import { stampText } from '../../../domain/dateText'
import type { Notification } from '../../../domain/types'
import { procedureStackViewFor } from '../../../store/selectors'
import { ProcedureStack } from '../../../shared/booking/ProcedureStack'
import { ChangedSinceSubmittedPill, useChangedSinceSubmitted } from '../components/ChangedSinceSubmitted'
import { sessionText } from '../../../domain/outOfHours'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { allocationNote, inDisplayOrder } from '../../../domain/billing/multiProcedure'
import { BackLink, FormError, Notice, PageHeader, Pill, ResultLine, StatTile, TickButton } from '../../../shared/ui'
import { TextAction } from '../../../shared/ui/TextAction'
import { ClearWarningButton } from '../../../shared/warnings'
import { withStubsInTimeOrder } from '../../../domain/intake/stubs'
import { useListStubs } from '../../../store/stubSelectors'
import { StubTableRow } from '../../../shared/stubs'
import { StubResolveLink } from '../components/StubResolveLink'

interface ReviewScreenProps {
  listId: string
  actor: Actor
  onBack: () => void
  /** Opened from the Billing monitor's "Open in Review" (catch-up Phase 37): the back link returns there instead of the breadcrumb. */
  backToBillingMonitor?: boolean
  /** Open another list using the persistent queue navigation. */
  onOpen: (listId: string) => void
  /** Jump to the Invoices section. */
  onViewInvoices: () => void
  /** Open a Booking on the Admin Booking detail, where the office edits its invoice description (catch-up Phase 20a). */
  onOpenBooking?: (dateISO: string, bookingId: string) => void
}

const REVIEW_NOWRAP_HEADINGS = new Set(['Time', 'Times', 'B · T · M', 'Units', 'Fee'])

/**
 * The sanity-check authorisation review (Phase 07). The mockup's anatomy
 * (convention 17, visual only): breadcrumb, header (title · context · status
 * pill · submitted pill), a 4-tile summary strip, the review table and totals
 * row, and the authorise action bar + choreography. Every figure comes from the
 * REAL Phase 01 calculator (`bookingFee`, each Booking priced once under the
 * multi-procedure rule, over the non-cancelled bookings) — NOT the mockup's simplified numbers (Decisions log). The Billed to
 * column shows who each Booking bills (catch-up Phase 20). FLAGS come from
 * the one review-flag list, `domain/billing/reviewFlags.ts` (catch-up Phase 21a: never a block;
 * no invented duration-outlier flag).
 */
export function ReviewScreen({ listId, actor, onBack, backToBillingMonitor = false, onOpen, onViewInvoices, onOpenBooking }: ReviewScreenProps) {
  const { Overlay } = useSurface()
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const invoicesRecord = useAppStore((s) => s.billing.invoices)
  const locksRecord = useAppStore((s) => s.billing.locks)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const notifications = useAppStore((s) => s.notifications)
  const pendingCount = useAppStore((s) => pendingContractChangesOnList(s, listId).length)
  // A stable key (the blockers are fresh objects each read): "Needs a price" names its Procedures (catch-up Phase 25).
  const blockersKey = useAppStore((s) => JSON.stringify(authoriseBlockersFor(s, listId)))
  const authoriseBlockers = useMemo(() => JSON.parse(blockersKey) as AuthoriseBlocker[], [blockersKey])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  /** The open per-booking History: its merged entity ids plus their scope labels. */
  const [history, setHistory] = useState<{ ids: readonly string[]; labels?: Record<string, string> } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const list = listsRecord[listId]
  const times = useListTimes(list)

  const rows = useMemo(() => {
    if (list === undefined || list.state === 'DRAFT') return []
    // The Disabled Contracts' days, read from the audit once per Review (catch-up Phase 25a).
    const disabledDays = disabledDaysByContract(audit)
    const bookings = Object.values(bookingsRecord)
      .filter((c) => c.listId === listId && c.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
    return bookings.map((booking: Booking) => {
      // The primary first, then the rest in Booking order (US-03.2.2; catch-up Phase 23).
      const procs = inDisplayOrder(
        Object.values(proceduresRecord)
          .filter((p) => p.bookingId === booking.id)
          .sort((a, b) => a.id.localeCompare(b.id)),
      )
      // The flags come from the one pure list (`domain/billing/reviewFlags.ts`) over the store's one input selector (catch-up Phase 21a).
      const state = useAppStore.getState()
      const totals = bookingFee({ procedures: procs, list, masters, patientId: booking.patientId, held: heldPricesForBooking(state, booking.id), ...(state.billing.locks[booking.id] !== undefined ? { lock: state.billing.locks[booking.id]! } : {}) })
      const input = reviewInputFor(state, booking, disabledDays)
      const flags = input !== undefined ? reviewFlagsForBooking(input) : []
      const changes: (ContractChangeRecord | undefined)[] = procs.map((p) => contractChangeFor(state, p.id))
      const primary: Procedure | undefined = procs.find((p) => p.isPrimary)
      const primaryView = input?.procedures.find((v) => v.procedure.isPrimary)
      const primaryAllocation = primary !== undefined ? totals.views[primary.id]?.allocation : undefined
      // Every Procedure's stack view (catch-up Phase 20a): the one pure module, read for the
      // Procedures column and for who is billed ("Mixed" when Procedures differ; `billablePartyForProcedure`, catch-up Phase 21).
      const stackViews = procs.map((p) => procedureStackViewFor({ masters, schedule: { procedures: proceduresRecord, bookings: bookingsRecord, lists: listsRecord }, billing: state.billing }, p.id, 'office')!)
      const billed = new Set(stackViews.map((v) => v.contract?.invoiced?.name).filter((n): n is string => n !== undefined))
      const anyMissing = stackViews.some((v) => v.contract === null)
      // A split fee bills several parties (catch-up Phase 22): "Split" (its parties show in the Procedures cell), or "Mixed".
      const anySplit = stackViews.some((v) => v.contract?.split !== undefined)
      const billedText = anyMissing
        ? 'Needs an invoice destination'
        : anySplit
          ? stackViews.length === 1 ? 'Split' : 'Mixed'
          : billed.size > 1 ? 'Mixed' : ([...billed][0] ?? 'Needs an invoice destination')
      const entityIds = [booking.id, ...procs.map((p) => p.id)]
      // Which procedure a history row belongs to — only where the merged trail
      // is ambiguous, i.e. a Booking carrying more than one procedure.
      let entityLabels: Record<string, string> | undefined
      if (procs.length > 1) {
        const labels: Record<string, string> = {}
        procs.forEach((procedure, index) => {
          const scope = procedure.isPrimary ? 'Primary' : 'Additional'
          const label = procedureLabel(procedure, masters.rvgGroups, index + 1)
          labels[procedure.id] = `${scope} · ${label}`
        })
        entityLabels = labels
      }
      const alert: Notification | undefined = activeAlertFor(state, { listId, bookingId: booking.id })
      // After authorise, the Booking's locked record (catch-up Phase 25): who is paid, and any split as typed.
      const lock = locksRecord[booking.id]
      const lockView = lock !== undefined ? lockViewFor(lock) : undefined
      return { booking, primary, primaryView, primaryAllocation, totals, flags, changes, procs, procIds: procs.map((p) => p.id), billedText, procCount: procs.length, entityIds, entityLabels, stackViews, alert, lockView }
    })
    // The audit feeds the change records; the notifications feed the alerts.
  }, [list, listId, bookingsRecord, proceduresRecord, masters, audit, notifications, invoicesRecord, locksRecord])
  const warningsByBooking = useListWarnings(listId)
  // Stubs for rows waiting at intake (catch-up Phase 33a): shown in the table, never in the stats or totals.
  const stubs = useListStubs(listId)
  // The anaesthetist's changes since submit (catch-up Phase 38a): null once authorised.
  const changed = useChangedSinceSubmitted(listId)
  const changedIds = new Set(changed?.bookingIds ?? [])

  // A Draft List has nothing to review (it can never be submitted).
  if (list === undefined || list.state === 'DRAFT') return null
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  const surgeon = masters.surgeons[list.surgeonId]
  const hospitalName = locationName(list.hospitalId, masters.hospitals)
  const authorised = list.state === 'AUTHORISED'

  // A Booking the anaesthetist re-opened (or added) on this SUBMITTED List must be
  // completed again before it can be authorised (authoriseList refuses; catch-up Phase 38a).
  const incompleteNames = incompleteBookingsOn(useAppStore.getState(), listId).map(
    (b) => masters.patients[b.patientId]?.name ?? 'Unknown patient',
  )
  const listTotals = rows.reduce(
    (acc, r) => ({ units: acc.units + r.totals.units, fee: acc.fee + r.totals.total, needsPrice: acc.needsPrice || r.totals.needsPrice }),
    { units: 0, fee: 0, needsPrice: false },
  )
  // A Booking with no price makes the List's fee unknown, never a smaller figure (catch-up Phase 19a).
  const listFeeText = listTotals.needsPrice ? NEEDS_PRICE_LABEL : formatCurrency(listTotals.fee)
  const allFlags: ReviewFlag[] = rows.flatMap((r) => r.flags)
  // Contract changes still waiting: approved together here, or at authorise (catch-up Phase 21a). Never a gate.
  const pendingChanges = authorised ? 0 : pendingCount
  // The one blockers seam: "Needs a price" since catch-up Phase 25 (flags never block; 40 adds the NHI).
  const blockers = authorised ? [] : authoriseBlockers
  const unitRate = anaesthetist?.unitValue ?? 0
  // After authorise the rate is the locked one (catch-up Phase 25): "(locked)", or "(Contract rate, locked)".
  const lockedRates = [...new Set(rows.flatMap((r) => r.lockView?.procedures.flatMap((p) => (p.rateText !== undefined ? [p.rateText] : [])) ?? []))]
  // Several locked rates (or none, all fixed prices): the List's rate is not one figure, and never the live one after authorise.
  const rateText = !authorised ? `@ ${formatCurrency(unitRate)}/unit (list rate)` : lockedRates.length === 1 ? lockedRates[0]! : 'Rates locked per Booking'

  const submitAt = audit.filter((a) => a.entityId === listId && a.action === 'list.submit').at(-1)?.atISO
  const authAt = audit.filter((a) => a.entityId === listId && a.action === 'list.authorise').at(-1)?.atISO
  const dayLabel = dayMicroCap(list.dateISO)

  // Invoices the billing run raised for this list (via its bookings) — the run is
  // synchronous with authorise, so these exist by the time the banner renders.
  const listBookingIds = new Set(Object.values(bookingsRecord).filter((c) => c.listId === listId).map((c) => c.id))
  // Only standard (run) invoices — a pre-payment pre-invoice is not run output (Phase 09).
  const raisedInvoices = Object.values(invoicesRecord).filter((i) => i.kind === 'standard' && listBookingIds.has(i.bookingId))
  const raisedCount = raisedInvoices.length
  const noAddressCount = raisedInvoices.filter((i) => i.delivery?.status === 'noAddress').length

  // Keep the open list in its former queue position after authorisation so the
  // permanent previous/next controls remain stable while its state changes.
  const queueLists = Object.values(listsRecord)
    .filter((candidate): candidate is AssignedList => candidate.state !== 'DRAFT' && (candidate.state === 'SUBMITTED' || candidate.id === listId))
    .sort((a, b) => (a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO)))
  const queueIndex = queueLists.findIndex((candidate) => candidate.id === listId)
  const previousListId = queueIndex > 0 ? queueLists[queueIndex - 1]?.id : undefined
  const nextListId = queueIndex >= 0 ? queueLists[queueIndex + 1]?.id : undefined

  function doAuthorise() {
    const outcome = authoriseList(useAppStore, actor, listId)
    setConfirmOpen(false)
    if (!outcome.ok) setError(outcome.message)
    else setError(null)
  }

  function run(outcome: { ok: true } | { ok: false; message: string }) {
    setError(outcome.ok ? null : outcome.message)
  }

  function saveNote() {
    const outcome = logListNote(useAppStore, actor, listId, noteText)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    setNoteText('')
    setNoteOpen(false)
  }

  return (
    <div data-testid="review-detail-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      {backToBillingMonitor && (
        <BackLink onClick={onBack} shot="review-back-to-billing">Back to Billing monitor</BackLink>
      )}
      {/* Breadcrumb */}
      {!backToBillingMonitor && (
      <div style={{ fontSize: 13, color: neutral.mist }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Review queue</button>
        <span style={{ color: neutral.lineStrong }}> / </span>
        <span>{anaesthetist !== undefined ? anaesthetist.name : list.anaesthetistId} · {hospitalName} {sessionText(list.session)}</span>
      </div>
      )}

      {/* Header */}
      <PageHeader
        size="admin"
        wrap
        style={{ alignItems: 'flex-start' }}
        actionsStyle={{ marginLeft: 'auto', maxWidth: '100%' }}
        title={<>{hospitalName} · {sessionText(list.session)} list</>}
        sub={
          <>
            {anaesthetist !== undefined ? anaesthetist.name : list.anaesthetistId}
            {surgeon !== undefined ? ` · ${surgeon.name}` : ''}
            {surgeonSpecialtyLabel(masters, surgeon) !== '' ? ` · ${surgeonSpecialtyLabel(masters, surgeon)}` : ''}
            {` · ${dayLabel}${times !== undefined ? ` · ${slotTimeRange(times)}` : ''}`}
          </>
        }
        actions={
        <div style={{ display: 'flex', flex: '0 0 auto', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginLeft: 'auto', maxWidth: '100%' }}>
          <div data-testid="review-queue-navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              disabled={previousListId === undefined}
              onClick={() => previousListId !== undefined && onOpen(previousListId)}
            >
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden /> Previous in queue
            </Button>
            <Button
              variant="secondary"
              disabled={nextListId === undefined}
              onClick={() => nextListId !== undefined && onOpen(nextListId)}
            >
              Next in queue <ArrowRight size={15} strokeWidth={2.2} aria-hidden />
            </Button>
            <Button
              variant="secondary"
              onClick={onViewInvoices}
            >
              <Receipt size={15} strokeWidth={2.2} aria-hidden /> View invoices
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <StatusChip status={list.kind} />
            {submitAt !== undefined && !authorised && (
              <Pill tone="warning" size="lg">Submitted {hhmm(submitAt)}</Pill>
            )}
            {changed !== null && <ChangedSinceSubmittedPill cue={changed} />}
          </div>
        </div>
        }
      />

      {/* Authorised banner (choreography) */}
      {authorised && (
        <div data-shot="review-authorised-banner" style={{ display: 'flex', alignItems: 'center', gap: 16, background: semantic.success.tint, border: `1px solid ${semantic.success.solid}44`, borderRadius: radius.card, padding: 16, animation: 'aa-fade-in 260ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: 999, background: semantic.success.solid, color: neutral.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', animation: 'aa-circle-pop 320ms ease' }}>
              <Check size={18} strokeWidth={3} aria-hidden />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: semantic.success.onTint }}>List authorised · locked for billing</div>
              <div style={{ fontSize: 12, color: semantic.success.onTint }}>
                {dayLabel}{authAt !== undefined ? `, ${hhmm(authAt)}` : ''} · {actor.who}
                {raisedCount === 0 && ' · Handed to the billing run'}
              </div>
              {raisedCount > 0 && <ResultLine plain line={runDeliverySummary(raisedInvoices)} shot="review-delivery-summary" style={{ marginTop: 2, fontWeight: 600 }} />}
            </div>
          </div>
        </div>
      )}
      {/* An invoice raised with no address (catch-up Phase 22): the office adds one and sends it. */}
      {authorised && noAddressCount > 0 && (
        <Notice tone="warning" shot="review-no-address" action={<Link to="/admin/billing" style={{ color: accent.base, fontWeight: 600, whiteSpace: 'nowrap' }}>Open Billing monitor</Link>}>
          {noAddressCount === 1 ? 'One invoice has no invoice address. Add one and send it from the invoice.' : `${noAddressCount} invoices have no invoice address. Add one and send each from its invoice.`}
        </Notice>
      )}

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatTile variant="outlined" label="Bookings" value={String(rows.length)} />
        <StatTile variant="outlined" label="Total units" value={String(listTotals.units)} />
        <StatTile variant="outlined" label="Total fee" value={listFeeText} />
        <StatTile variant="outlined" label="Flags" value={String(allFlags.length)} {...(allFlags.length > 0 ? { tone: 'warning' as const } : {})} sub="to check before authorising" />
      </div>

      <FormError message={error} />

      {/* Review table */}
      <TableShell
        testId="review-detail-table-shell"
        label={`${hospitalName} · ${sessionText(list.session)} list`}
        density="compact"
        minWidth={1120}
        style={{ opacity: authorised ? 0.72 : 1, transition: 'opacity 300ms' }}
      >
          <thead>
            <tr>
              {['Time', 'Patient', 'Billed to', 'Procedures', 'Times', 'B · T · M', 'Units', 'Fee', 'Flags'].map((h, i) => (
                <Th key={h} align={i === 6 || i === 7 ? 'right' : 'left'} {...(REVIEW_NOWRAP_HEADINGS.has(h) ? { nowrap: true } : {})}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {withStubsInTimeOrder(rows, (r) => r.booking.scheduledTime, stubs).map((entry) => {
              if (entry.kind === 'stub') return <StubTableRow key={entry.stub.id} stub={entry.stub} colSpan={9} trailing={<StubResolveLink stub={entry.stub} />} />
              const { booking, primary, primaryView, primaryAllocation, totals, flags, changes, procs, procIds, billedText, entityIds, entityLabels, stackViews, alert, lockView } = entry.booking
              const patient = masters.patients[booking.patientId]
              const btm = primaryView?.fee.btm
              return (
                <tr key={booking.id}>
                  <Td mono nowrap>{booking.scheduledTime ?? '·'}</Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{patient?.name ?? 'Unknown'}</span>
                      <WarningTriangle warnings={warningsByBooking.get(booking.id) ?? []} size="sm" />
                      {/* A marker, not an action: the row's teal History link opens what changed. */}
                      {changedIds.has(booking.id) && (
                        <span data-shot="review-late-edit" style={{ display: 'inline-flex' }}>
                          <Pill
                            variant="outline"
                            tone="warning"
                            size="lg"
                            shot="review-changed-booking"
                            title="Changed by the anaesthetist since the List was submitted. History shows what changed."
                          >
                            Changed
                          </Pill>
                        </span>
                      )}
                      {!booking.completed && booking.cancellation === undefined && (
                        <Pill tone="warning" size="lg">Not complete</Pill>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 11.5, color: neutral.mist }}>{patient?.nhi ?? ''}</div>
                    {alert !== undefined && <AlertLine alert={alert} onResolve={() => run(resolveNotification(useAppStore, actor, alert.id))} disabled={authorised} />}
                    <OpenWarnings warnings={warningsByBooking.get(booking.id) ?? []} patientName={patient?.name ?? 'this Booking'} disabled={authorised} onClear={(w) => run(clearWarning(useAppStore, actor, w.bookingId, w.key))} />
                  </Td>
                  <Td style={{ maxWidth: 150 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{billedText}</div>
                    <InsurerLine booking={booking} />
                    {lockView !== undefined && lockView.state === 'locked' && (
                      <div data-shot="review-locked-payee" style={{ fontSize: 11.5, color: neutral.slate, marginTop: 2 }}>
                        Paid to {lockView.payeeName}
                        {lockView.procedures.filter((p) => p.splitText !== 'Full').map((p) => (
                          <div key={p.procedureId}>{p.splitText}</div>
                        ))}
                      </div>
                    )}
                  </Td>
                  {/* Every Procedure's stack, compact (catch-up Phase 20a; US-07.2.2, US-03.1.9). */}
                  <Td data-shot="review-procedures" style={{ minWidth: 240, maxWidth: 300 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stackViews.map((view, i) => {
                        const procedureId = procIds[i]!
                        const change = changes[i]
                        return (
                          <div key={i} data-shot="review-procedure-stack" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <ProcedureStack view={view} density="compact" surface="office" heading={stackViews.length > 1 ? `Procedure ${i + 1}` : 'Procedure'} />
                            {/* Each Procedure's share under the multi-procedure rule, primary first (catch-up Phase 23). */}
                            {stackViews.length > 1 && totals.views[procedureId] !== undefined && (
                              <span data-shot="review-procedure-share" style={{ fontSize: 11.5, color: neutral.slate, fontVariantNumeric: 'tabular-nums' }}>
                                {allocationNote(totals.views[procedureId]!.allocation)}
                              </span>
                            )}
                            <ReviewPaidBy
                              procedure={procs[i]!}
                              child={(warningsByBooking.get(booking.id) ?? []).some((w) => w.ruleId === 'childPayer' && w.procedureId === procedureId && isOpen(w))}
                              patientId={booking.patientId}
                              invoicedName={view.contract?.invoiced?.name}
                              onChange={onOpenBooking !== undefined && !authorised ? () => onOpenBooking(list.dateISO, booking.id) : undefined}
                            />
                            <ProcedureFlags
                              flags={flags.filter((f) => f.procedureId === procedureId)}
                              change={change}
                              locked={authorised}
                              patientName={patient?.name ?? 'this Booking'}
                              onApprove={() => run(approveContractSelection(useAppStore, actor, { bookingId: booking.id, procedureId }))}
                              {...(onOpenBooking !== undefined ? { onCorrect: () => onOpenBooking(list.dateISO, booking.id) } : {})}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </Td>
                  <Td mono nowrap>{primary?.anaestheticStartISO !== undefined ? `${hhmm(primary.anaestheticStartISO)} to ${hhmm(primary.handoverISO)}` : '·'}</Td>
                  <Td mono nowrap data-testid="review-btm-value" style={{ color: neutral.slate }}>{btm !== undefined ? `${btm.base.units} · ${btm.time.units} · ${btm.modifiers.units}` : '·'}
                    {primaryAllocation !== undefined && primaryAllocation.splitAcross > 1 && (
                      <div data-shot="review-modifier-split" style={{ fontSize: 11.5 }}>
                        M {primaryAllocation.bookingModifierUnits} · split {primaryAllocation.splitShares.join(' · ')}
                      </div>
                    )}
                  </Td>
                  <Td mono nowrap align="right" style={{ fontWeight: 700 }}>{totals.units}</Td>
                  <Td data-shot="review-fee" nowrap align="right" bold>
                    <ReviewFeeCell totals={totals} />
                  </Td>
                  <Td style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      {flags.filter((f) => f.procedureId === undefined).map((f, i) => (
                        <FlagPill key={i} flag={f} />
                      ))}
                      {authorised && <Lock size={13} aria-hidden style={{ color: neutral.mist }} />}
                      <TextAction size="sm" flush onClick={() => setHistory({ ids: entityIds, ...(entityLabels !== undefined ? { labels: entityLabels } : {}) })}>History</TextAction>
                      {/* The Admin Booking, where the office edits the invoice description (catch-up Phase 20a). */}
                      {onOpenBooking !== undefined && <TextAction size="sm" flush shot="review-open-booking" onClick={() => onOpenBooking(list.dateISO, booking.id)}>Open</TextAction>}
                    </div>
                  </Td>
                </tr>
              )
            })}
            {/* Totals */}
            <tr style={{ background: neutral.bg }}>
              <Td />
              <Td style={{ fontWeight: 700 }}>Totals</Td>
              <Td colSpan={4} />
              <Td />
              <Td mono nowrap align="right" style={{ fontWeight: 700 }}>{listTotals.units}</Td>
              <Td mono nowrap align="right" style={{ fontWeight: 700 }}>{listFeeText}</Td>
              <Td data-shot="review-list-rate" style={{ color: neutral.mist, fontSize: 12 }}>{rateText}</Td>
            </tr>
          </tbody>
      </TableShell>

      {/* Phone notes */}
      {list.phoneNotes !== undefined && list.phoneNotes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.phoneNotes.map((n, i) => (
            <div key={i} style={{ fontSize: 12.5, color: neutral.slate }}>
              <span className="mono" style={{ color: neutral.mist }}>Phone note {hhmm(n.atISO)} · {n.by}</span> · {n.text}
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: elevation.e1, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{rows.length} booking{rows.length === 1 ? '' : 's'} · {listTotals.units} units · {listFeeText}</div>
          {!authorised && incompleteNames.length > 0 && (
            <div data-testid="review-authorise-blocked" style={{ fontSize: 12.5, color: semantic.warning.onTint }}>
              Not complete: {incompleteNames.join(', ')}. Complete {incompleteNames.length === 1 ? 'it' : 'them'} before authorising.
            </div>
          )}
          {!authorised && allFlags.length > 0 && (
            <div style={{ fontSize: 12.5, color: semantic.warning.onTint }}>{allFlags.length} flag{allFlags.length === 1 ? '' : 's'} open. Check or note them before authorising.</div>
          )}
          {/* "Needs a price" blocks the lock (catch-up Phase 25): each Procedure named, with an Open link. */}
          {blockers.map((b) => {
            const who = b.bookingId !== undefined ? masters.patients[bookingsRecord[b.bookingId]?.patientId ?? '']?.name : undefined
            return (
              <div key={`${b.code}-${b.procedureId ?? b.bookingId ?? ''}`} data-testid="review-authorise-blocker" data-shot="review-needs-price-blocker" style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12.5, color: semantic.warning.onTint }}>
                <span>{who !== undefined ? `${who}: ` : ''}{b.message}</span>
                {onOpenBooking !== undefined && b.bookingId !== undefined && (
                  <TextAction size="sm" flush onClick={() => onOpenBooking(list.dateISO, b.bookingId!)}>Open</TextAction>
                )}
              </div>
            )
          })}
          <div style={{ fontSize: 11.5, color: neutral.mist }}>Authorisation is an OfficeAdmin action · acting as {actor.who} (Office)</div>
        </div>
        {authorised ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: 999, padding: '8px 14px' }}>
            <Lock size={14} aria-hidden /> Authorised · locked
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pendingChanges > 0 && (
              <Button variant="secondary" shot="review-contract-approve-all" onClick={() => run(approveContractChangesOnList(useAppStore, actor, listId))}>
                Approve {pendingChanges === 1 ? 'the Contract change' : `all ${pendingChanges} Contract changes`}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setNoteOpen(true)}>Log phone note</Button>
            <Button variant="primary" disabled={incompleteNames.length > 0 || blockers.length > 0} onClick={() => setConfirmOpen(true)}>Authorise for billing</Button>
          </div>
        )}
      </div>

      {/* Authorise confirm */}
      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Authorise this list for billing?"
        confirmLabel="Authorise for billing"
        onConfirm={doAuthorise}
        cancelLabel="Cancel"
      >
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
          Authorising locks every Booking on this List (no further edits by anyone) and locks each Procedure's Contract onto it: its settings, the price range in force, the rate, the price, who is billed and who is paid. The Billing Engine raises the invoices from that locked record and sends them now, one for each billable party; a later Contract edit never changes them. There is no return to the anaesthetist from here.
        </div>
        {pendingChanges > 0 && (
          <div data-testid="review-authorise-approves" style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px', marginTop: 8 }}>
            {pendingChanges === 1 ? 'The Contract change still waiting is' : `The ${pendingChanges} Contract changes still waiting are`} approved at authorise.
          </div>
        )}
      </ConfirmSheet>

      {/* Log phone note */}
      <Overlay open={noteOpen} onClose={() => setNoteOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader title="Log a phone note" description="Record a call about this list. It attaches to the list and its audit trail. It never returns the list to the anaesthetist." />
          <TextArea label="Note" value={noteText} onChange={setNoteText} placeholder="e.g. Confirmed the missing reference with the hospital." />
          <SheetActions primary={<Button variant="primary" block disabled={noteText.trim() === ''} onClick={saveNote}>Log note</Button>} />
        </div>
      </Overlay>

      {history !== null && (
        <HistorySheet
          open
          entityIds={history.ids}
          {...(history.labels !== undefined ? { entityLabels: history.labels } : {})}
          title="Booking history"
          onClose={() => setHistory(null)}
        />
      )}
    </div>
  )
}

/** One review flag (catch-up Phase 21a): the shared pill at the Admin Review mockup's table size, warn or neutral. Never a block. */
function FlagPill({ flag }: { flag: ReviewFlag }) {
  return (
    <Pill tone={flag.tone === 'warn' ? 'warning' : 'neutral'} size="lg" shot={flag.shot} data-rule={flag.rule} style={{ whiteSpace: 'normal' }}>
      {flag.text}
    </Pill>
  )
}

/**
 * A Procedure's own flags under its stack, with Approve and Correct on the
 * anaesthetist's Contract change (US-07.2.2), or "Approved" once the office
 * has approved it.
 */
function ProcedureFlags({
  flags,
  change,
  locked,
  patientName,
  onApprove,
  onCorrect,
}: {
  patientName: string
  flags: readonly ReviewFlag[]
  change: ContractChangeRecord | undefined
  locked: boolean
  onApprove: () => void
  onCorrect?: () => void
}) {
  const approved = change?.status === 'approved' && change.approval !== undefined ? change.approval : undefined
  if (flags.length === 0 && approved === undefined) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
      {flags.map((f, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <FlagPill flag={f} />
          {f.rule === 'contractChanged' && !locked && (
            <>
              <TextAction size="sm" shot="review-contract-approve" onClick={onApprove} label={`Approve the Contract change for ${patientName}`}>Approve</TextAction>
              {onCorrect !== undefined && <TextAction size="sm" shot="review-contract-correct" onClick={onCorrect} label={`Correct the Contract for ${patientName}`}>Correct</TextAction>}
            </>
          )}
        </span>
      ))}
      {approved !== undefined && (
        <span data-shot="review-contract-approved" style={{ fontSize: 12, color: neutral.slate }}>
          {approved.how === 'authorise' ? 'Approved at authorise' : 'Approved'} {stampText(approved.atISO)}
        </span>
      )}
    </div>
  )
}

/**
 * One Procedure's Paid by, compact for the table (catch-up Phase 22a;
 * US-07.2.2): where its Contract bills the payer, the payer and how they are
 * invoiced (21's delivery rule: email where there is one, else post), with
 * Change opening the Admin Booking, and "Under 18" while its child warning is
 * open; where it bills its holder, the holder; a
 * split's parties show in its stack; "Payer: not billed yet" with no
 * Contract. Its "Email or postal address needed" flag sits with the
 * Procedure's other flags.
 */
function ReviewPaidBy({ procedure, patientId, invoicedName, child, onChange }: { procedure: Procedure; patientId: string; invoicedName: string | undefined; child: boolean; onChange?: () => void }) {
  const masters = useAppStore((s) => s.masters)
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  if (procedure.split !== undefined) return null
  const lineStyle = { display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 12, color: neutral.slate } as const
  if (contract === undefined) {
    return (
      <div data-shot="review-payer" data-procedure-id={procedure.id} style={lineStyle}>
        {PAYER_NOT_BILLED_YET}
      </div>
    )
  }
  if (!isPayerBilled(contract)) {
    return (
      <div data-shot="review-payer" data-procedure-id={procedure.id} style={lineStyle}>
        Paid by {invoicedName ?? 'its holder'}
      </div>
    )
  }
  const payer = payerDetails(procedure.payer, masters.patients[patientId])
  return (
    <div data-shot="review-payer" data-procedure-id={procedure.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: neutral.slate }}>
      <div style={lineStyle}>
        <span>{procedure.payer.kind === 'patient' ? 'Patient pays' : `Payer: ${payer.name}${payer.relationship !== undefined ? ` (${payer.relationship})` : ''}`}</span>
        {/* US-13.7.1 / US-07.2.2: the open child warning on this Procedure's own row. */}
        {child && (
          <Pill tone="warning" size="sm" shot="review-payer-under-18" data-procedure-id={procedure.id}>
            Under 18
          </Pill>
        )}
        {onChange !== undefined && (
          <TextAction size="sm" onClick={onChange} label="Change this procedure's payer">
            Change
          </TextAction>
        )}
      </div>
      {payer.email !== undefined && payer.email.trim() !== '' ? (
        <span data-shot="review-payer-delivery" style={{ overflowWrap: 'anywhere' }}>Email: {payer.email}</span>
      ) : payer.postalAddress !== undefined ? (
        <span data-shot="review-payer-delivery">Post: {formatPostalAddress(payer.postalAddress)}</span>
      ) : null}
    </div>
  )
}

/** The Booking's insurer or funder and its approval number (21's; US-11.4.3): on the Booking, never who is invoiced. */
function InsurerLine({ booking }: { booking: Booking }) {
  const masters = useAppStore((s) => s.masters)
  const funder = booking.funderPartyId !== undefined ? masters.parties[booking.funderPartyId] : undefined
  if (funder === undefined) return null
  const missing = approvalNumberMissing(booking, masters.parties)
  const number = booking.insuranceApprovalNumber?.trim()
  return (
    <div data-shot="review-insurance" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 12, color: neutral.slate }}>
      <span>{funder.kind === 'insurer' ? 'Insurer' : 'Funder'}: {funder.name}</span>
      {number !== undefined && number !== '' ? (
        <span className="mono">{number}</span>
      ) : missing ? (
        <Pill tone="warning" size="sm">No approval number</Pill>
      ) : null}
    </div>
  )
}

/** 32b's open alert to the office on this Booking, with the office's resolve tick. Never a gate. */
function AlertLine({ alert, onResolve, disabled }: { alert: Notification; onResolve: () => void; disabled: boolean }) {
  return (
    <div data-shot="review-alert" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
      <Pill tone="warning" size="sm">Alert</Pill>
      <span style={{ fontSize: 12, color: neutral.slate, maxWidth: 220 }}>{alert.message ?? 'The anaesthetist asked the office to check this Booking.'}</span>
      {!disabled && <TickButton compact onClick={onResolve} label="Resolve the alert">Resolve</TickButton>}
    </div>
  )
}

/** 15a's open warnings with the office's Clear, so they are dealt with where the List is reviewed. Never a gate. */
function OpenWarnings({ warnings, patientName, disabled, onClear }: { warnings: readonly Warning[]; patientName: string; disabled: boolean; onClear: (w: Warning) => void }) {
  const open = warnings.filter(isOpen)
  if (open.length === 0 || disabled) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
      {open.map((w) => (
        <div key={w.key} data-shot="review-warning-clear" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span title={w.text} style={{ fontSize: 12, lineHeight: '16px', color: neutral.slate, maxWidth: 200, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{w.text}</span>
          <ClearWarningButton warning={w} compact onClear={() => onClear(w)} label={`${w.strength === 'mild' ? 'Clear (optional)' : 'Clear'} warning for ${patientName}`} />
        </div>
      ))}
    </div>
  )
}

/**
 * Review's Fee cell (catch-up Phase 24; US-05.4.1, US-05.4.2): the Booking's
 * price; under a typed price "Computed $360.00" in mist, beside 21a's
 * `typedPrice` flag; a $0.00 price a neutral "No charge" pill. Read from the
 * one assembler's price answers, never re-derived.
 */
function ReviewFeeCell({ totals }: { totals: ReturnType<typeof bookingFee> }) {
  if (totals.needsPrice) return <>{NEEDS_PRICE_LABEL}</>
  const prices = Object.values(totals.views).map((v) => v.fee.price)
  const typed = prices.filter((p) => p.status === 'priced' && p.heldBy === 'typed')
  // The computed figure for the whole Booking: each typed Procedure's computed price in place of its typed one;
  // none where a typed Procedure has no computed price of its own (an open price).
  const computable = typed.every((p) => p.status === 'priced' && p.computedTotal !== undefined)
  const computedTotal =
    typed.length === 0 || !computable ? undefined : roundToCents(prices.reduce((sum, p) => sum + (p.status !== 'priced' ? 0 : p.heldBy === 'typed' ? (p.computedTotal ?? 0) : p.price), 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <span className="mono">{formatCurrency(totals.total)}</span>
      {computedTotal !== undefined && (
        <span className="mono" data-shot="review-fee-computed" style={{ fontSize: 11.5, fontWeight: 400, color: neutral.mist }}>
          Computed {formatCurrency(computedTotal)}
        </span>
      )}
      {isNoChargeBooking(prices) && (
        <Pill tone="neutral" size="sm" shot="review-no-charge">
          No charge
        </Pill>
      )}
    </div>
  )
}

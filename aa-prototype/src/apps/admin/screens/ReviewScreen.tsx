import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, Check, Lock, Receipt } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic } from '../../../theme/tokens'
import type { AssignedList, Booking, Procedure } from '../../../domain/types'
import { authoriseList, incompleteBookingsOn, logListNote, useAppStore, useListTimes, type Actor } from '../../../store'
import { Button, StatusChip, TextArea, useListWarnings, useSurface, WarningTriangle } from '../../../shared'
import { bookingFee, procedureFee } from '../../../shared/capture'
import { dayMicroCap, formatCurrency, hhmm, locationName, slotTimeRange } from '../../../shared/format'
import { HistorySheet } from '../../../shared/booking'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'
import { NEEDS_PRICE_LABEL } from '../../../domain/billing/priceRanges'
import { reviewFlagsForBooking, type ReviewFlag } from '../reviewFlags'
import { procedureStackViewFor } from '../../../store/selectors'
import { ProcedureStack } from '../../../shared/booking/ProcedureStack'
import { ChangedSinceSubmittedPill, useChangedSinceSubmitted } from '../components/ChangedSinceSubmitted'
import { sessionText } from '../../../domain/outOfHours'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'
import { procedureLabel } from '../../../domain/billing/procedureStack'

interface ReviewScreenProps {
  listId: string
  actor: Actor
  onBack: () => void
  /** Open another list using the persistent queue navigation. */
  onOpen: (listId: string) => void
  /** Jump to the Invoices section. */
  onViewInvoices: () => void
  /** Open a Booking on the Admin Booking detail, where the office edits its invoice description (catch-up Phase 20a). */
  onOpenBooking?: (dateISO: string, bookingId: string) => void
}

const cellStyle = adminCell()
const headCellStyle = adminHead()
const nowrapCell = { ...cellStyle, whiteSpace: 'nowrap' as const }
const numCell = { ...nowrapCell, textAlign: 'right' as const }
const REVIEW_NOWRAP_HEADINGS = new Set(['Time', 'Times', 'B · T · M', 'Units', 'Fee'])

/**
 * The sanity-check authorisation review (Phase 07). The mockup's anatomy
 * (convention 17, visual only): breadcrumb, header (title · context · status
 * pill · submitted pill), a 4-tile summary strip, the review table and totals
 * row, and the authorise action bar + choreography. Every figure comes from the
 * REAL Phase 01 calculator (procedureFee / bookingFee looped over the non-cancelled
 * bookings) — NOT the mockup's simplified numbers (Decisions log). The Billed to
 * column shows who each Booking bills (catch-up Phase 20). FLAGS come from
 * the RFP-grounded `reviewFlags` helper (no invented duration-outlier flag).
 */
export function ReviewScreen({ listId, actor, onBack, onOpen, onViewInvoices, onOpenBooking }: ReviewScreenProps) {
  const { Overlay } = useSurface()
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const invoicesRecord = useAppStore((s) => s.billing.invoices)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)

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
    const bookings = Object.values(bookingsRecord)
      .filter((c) => c.listId === listId && c.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
    return bookings.map((booking: Booking) => {
      const procs = Object.values(proceduresRecord)
        .filter((p) => p.bookingId === booking.id)
        .sort((a, b) => a.id.localeCompare(b.id))
      const views = procs.map((p) => procedureFee({ procedure: p, list, masters, billingLines: billingLinesRecord, patientId: booking.patientId }))
      const totals = bookingFee(procs, list, masters, billingLinesRecord, booking.patientId)
      const flags = reviewFlagsForBooking({
        booking,
        procedures: procs.map((p, i) => ({ procedure: p, fee: views[i]!.fee, rvgGroup: views[i]!.rvgGroup })),
        contracts: masters.contracts,
        parties: masters.parties,
        timeRule: masters.rvgTimeRule,
        modifierInputs: {
          patientDobISO: masters.patients[booking.patientId]?.dobISO,
          procedureDateISO: list.dateISO,
          modifiers: masters.modifiers,
        },
      })
      const primary: Procedure | undefined = procs[0]
      const primaryView = views[0]
      // Every Procedure's stack view (catch-up Phase 20a): the one pure module, read for the
      // Procedures column and for who is billed ("Mixed" when Procedures differ; INTERIM until Phase 21).
      const stackViews = procs.map((p) => procedureStackViewFor({ masters, schedule: { procedures: proceduresRecord, bookings: bookingsRecord, lists: listsRecord } }, p.id, 'office')!)
      const billed = new Set(stackViews.map((v) => v.contract?.invoiced?.name).filter((n): n is string => n !== undefined))
      const anyMissing = stackViews.some((v) => v.contract === null)
      const billedText = anyMissing ? 'Needs an invoice destination' : billed.size > 1 ? 'Mixed' : ([...billed][0] ?? 'Needs an invoice destination')
      const procIds = new Set(procs.map((p) => p.id))
      const lineIds = Object.values(billingLinesRecord).filter((l) => procIds.has(l.procedureId)).map((l) => l.id)
      const entityIds = [booking.id, ...procs.map((p) => p.id), ...lineIds]
      // Which procedure a history row belongs to — only where the merged trail
      // is ambiguous, i.e. a Booking carrying more than one procedure.
      let entityLabels: Record<string, string> | undefined
      if (procs.length > 1) {
        const labels: Record<string, string> = {}
        procs.forEach((procedure, index) => {
          const scope = `Procedure ${index + 1}`
          const label = procedureLabel(procedure, masters.rvgGroups, index + 1)
          labels[procedure.id] = label === scope ? scope : `${scope} · ${label}`
          for (const line of Object.values(billingLinesRecord)) {
            if (line.procedureId === procedure.id) labels[line.id] = `${scope} · fee line`
          }
        })
        entityLabels = labels
      }
      return { booking, primary, primaryView, totals, flags, billedText, procCount: procs.length, entityIds, entityLabels, stackViews }
    })
  }, [list, listId, bookingsRecord, proceduresRecord, billingLinesRecord, masters])
  const warningsByBooking = useListWarnings(listId)
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
  const unitRate = anaesthetist?.unitValue ?? 0

  const submitAt = audit.filter((a) => a.entityId === listId && a.action === 'list.submit').at(-1)?.atISO
  const authAt = audit.filter((a) => a.entityId === listId && a.action === 'list.authorise').at(-1)?.atISO
  const dayLabel = dayMicroCap(list.dateISO)

  // Invoices the billing run raised for this list (via its bookings) — the run is
  // synchronous with authorise, so these exist by the time the banner renders.
  const listBookingIds = new Set(Object.values(bookingsRecord).filter((c) => c.listId === listId).map((c) => c.id))
  // Only standard (run) invoices — a pre-payment pre-invoice is not run output (Phase 09).
  const raisedCount = Object.values(invoicesRecord).filter((i) => i.kind === 'standard' && listBookingIds.has(i.bookingId)).length

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
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: neutral.mist }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Review queue</button>
        <span style={{ color: neutral.lineStrong }}> / </span>
        <span>{anaesthetist !== undefined ? anaesthetist.name : list.anaesthetistId} · {hospitalName} {sessionText(list.session)}</span>
      </div>

      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Back to queue
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{hospitalName} · {sessionText(list.session)} list</h1>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>
            {anaesthetist !== undefined ? anaesthetist.name : list.anaesthetistId}
            {surgeon !== undefined ? ` · ${surgeon.name}` : ''}
            {surgeonSpecialtyLabel(masters, surgeon) !== '' ? ` · ${surgeonSpecialtyLabel(masters, surgeon)}` : ''}
            {` · ${dayLabel}${times !== undefined ? ` · ${slotTimeRange(times)}` : ''}`}
          </div>
        </div>
        <div style={{ display: 'flex', flex: '0 0 auto', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginLeft: 'auto', maxWidth: '100%' }}>
          <div data-testid="review-queue-navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              disabled={previousListId === undefined}
              onClick={() => previousListId !== undefined && onOpen(previousListId)}
              style={{ minHeight: 40, padding: '0 12px', fontSize: 13 }}
            >
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden /> Previous in queue
            </Button>
            <Button
              variant="secondary"
              disabled={nextListId === undefined}
              onClick={() => nextListId !== undefined && onOpen(nextListId)}
              style={{ minHeight: 40, padding: '0 12px', fontSize: 13 }}
            >
              Next in queue <ArrowRight size={15} strokeWidth={2.2} aria-hidden />
            </Button>
            <Button
              variant="secondary"
              onClick={onViewInvoices}
              style={{ minHeight: 40, padding: '0 12px', fontSize: 13 }}
            >
              <Receipt size={15} strokeWidth={2.2} aria-hidden /> View invoices
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <StatusChip status={list.kind} />
            {submitAt !== undefined && !authorised && (
              <span style={{ fontSize: 12, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '4px 10px' }}>
                Submitted {hhmm(submitAt)}
              </span>
            )}
            {changed !== null && <ChangedSinceSubmittedPill cue={changed} />}
          </div>
        </div>
      </div>

      {/* Authorised banner (choreography) */}
      {authorised && (
        <div data-shot="review-authorised-banner" style={{ display: 'flex', alignItems: 'center', gap: 16, background: semantic.success.tint, border: `1px solid ${semantic.success.solid}44`, borderRadius: radius.card, padding: 16, animation: 'aa-fade-in 260ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: 999, background: semantic.success.solid, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', animation: 'aa-circle-pop 320ms ease' }}>
              <Check size={18} strokeWidth={3} aria-hidden />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: semantic.success.onTint }}>List authorised · locked for billing</div>
              <div style={{ fontSize: 12, color: semantic.success.onTint }}>
                {dayLabel}{authAt !== undefined ? `, ${hhmm(authAt)}` : ''} · {actor.who} ·{' '}
                {raisedCount > 0 ? `${raisedCount} invoice${raisedCount === 1 ? '' : 's'} raised by the billing run` : 'Handed to the billing run'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Tile label="Bookings" value={String(rows.length)} />
        <Tile label="Total units" value={String(listTotals.units)} />
        <Tile label="Total fee" value={listFeeText} />
        <Tile label="Flags" value={String(allFlags.length)} tone={allFlags.length > 0 ? 'warn' : undefined} sub="to check before authorising" />
      </div>

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
      )}

      {/* Review table */}
      <div data-testid="review-detail-table-shell" style={{ overflowX: 'auto', opacity: authorised ? 0.72 : 1, transition: 'opacity 300ms', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1120 }}>
          <thead>
            <tr>
              {['Time', 'Patient', 'Billed to', 'Procedures', 'Times', 'B · T · M', 'Units', 'Fee', 'Flags'].map((h, i) => (
                <th key={h} style={{ ...headCellStyle, textAlign: i === 6 || i === 7 ? 'right' : 'left', whiteSpace: REVIEW_NOWRAP_HEADINGS.has(h) ? 'nowrap' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ booking, primary, primaryView, totals, flags, billedText, entityIds, entityLabels, stackViews }) => {
              const patient = masters.patients[booking.patientId]
              const btm = primaryView?.fee.btm
              return (
                <tr key={booking.id}>
                  <td className="mono" style={nowrapCell}>{booking.scheduledTime ?? '·'}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{patient?.name ?? 'Unknown'}</span>
                      <WarningTriangle warnings={warningsByBooking.get(booking.id) ?? []} size="sm" />
                      {/* A marker, not an action: the row's teal History link opens what changed. */}
                      {changedIds.has(booking.id) && (
                        <span
                          data-shot="review-changed-booking"
                          title="Changed by the anaesthetist since the List was submitted. History shows what changed."
                          style={{ border: `1px solid ${semantic.warning.solid}66`, background: neutral.surface, color: semantic.warning.onTint, borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                          Changed
                        </span>
                      )}
                      {!booking.completed && booking.cancellation === undefined && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>Not complete</span>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 11.5, color: neutral.mist }}>{patient?.nhi ?? 'NHI pending'}</div>
                  </td>
                  <td style={cellStyle}>{billedText}</td>
                  {/* Every Procedure's stack, compact (catch-up Phase 20a; US-07.2.2, US-03.1.9). */}
                  <td data-shot="review-procedures" style={{ ...cellStyle, minWidth: 260, maxWidth: 340 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stackViews.map((view, i) => (
                        <ProcedureStack key={i} view={view} density="compact" surface="office" heading={stackViews.length > 1 ? `Procedure ${i + 1}` : 'Procedure'} />
                      ))}
                    </div>
                  </td>
                  <td className="mono" style={nowrapCell}>{primary?.anaestheticStartISO !== undefined ? `${hhmm(primary.anaestheticStartISO)} to ${hhmm(primary.handoverISO)}` : '·'}</td>
                  <td className="mono" data-testid="review-btm-value" style={{ ...nowrapCell, color: neutral.slate }}>{btm !== undefined ? `${btm.base.units} · ${btm.time.units} · ${btm.modifiers.units}` : '·'}</td>
                  <td className="mono" style={{ ...numCell, fontWeight: 700 }}>{totals.units}</td>
                  <td className={totals.needsPrice ? undefined : 'mono'} style={{ ...numCell, fontWeight: 600 }}>{totals.needsPrice ? NEEDS_PRICE_LABEL : formatCurrency(totals.total)}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      {flags.map((f, i) => (
                        <FlagPill key={i} flag={f} />
                      ))}
                      {authorised && <Lock size={13} aria-hidden style={{ color: neutral.mist }} />}
                      <button onClick={() => setHistory({ ids: entityIds, ...(entityLabels !== undefined ? { labels: entityLabels } : {}) })} style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>History</button>
                      {/* The Admin Booking, where the office edits the invoice description (catch-up Phase 20a). */}
                      {onOpenBooking !== undefined && <button data-shot="review-open-booking" onClick={() => onOpenBooking(list.dateISO, booking.id)} style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Open</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {/* Totals */}
            <tr style={{ background: neutral.bg }}>
              <td style={cellStyle} />
              <td style={{ ...cellStyle, fontWeight: 700 }}>Totals</td>
              <td style={cellStyle} colSpan={4} />
              <td style={cellStyle} />
              <td className="mono" style={{ ...numCell, fontWeight: 700 }}>{listTotals.units}</td>
              <td className="mono" style={{ ...numCell, fontWeight: 700 }}>{listFeeText}</td>
              <td style={{ ...cellStyle, color: neutral.mist, fontSize: 12 }}>@ ${unitRate.toFixed(2)}/unit (list rate)</td>
            </tr>
          </tbody>
        </table>
      </div>

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
          <div style={{ fontSize: 11.5, color: neutral.mist }}>Authorisation is an OfficeAdmin action · acting as {actor.who} (Office)</div>
        </div>
        {authorised ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: 999, padding: '8px 14px' }}>
            <Lock size={14} aria-hidden /> Authorised · locked
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setNoteOpen(true)}>Log phone note</Button>
            <Button variant="primary" disabled={incompleteNames.length > 0} onClick={() => setConfirmOpen(true)} style={{ minHeight: 48, fontSize: 15 }}>Authorise for billing</Button>
          </div>
        )}
      </div>

      {/* Authorise confirm */}
      <Overlay open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Authorise this list for billing?</div>
          <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
            Authorising locks every Booking on this List immutable (no further edits by anyone) and hands the List to the Billing Engine as a single unit. Invoices are raised immediately, grouped by counterparty. There is no return to the anaesthetist from here.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" block onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" block onClick={doAuthorise}>Authorise for billing</Button>
          </div>
        </div>
      </Overlay>

      {/* Log phone note */}
      <Overlay open={noteOpen} onClose={() => setNoteOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Log a phone note</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>Record a call about this list. It attaches to the list and its audit trail. It never returns the list to the anaesthetist.</div>
          <TextArea label="Note" value={noteText} onChange={setNoteText} placeholder="e.g. Confirmed the missing reference with the hospital." />
          <Button variant="primary" block disabled={noteText.trim() === ''} onClick={saveNote}>Log note</Button>
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

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' }) {
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>{label}</span>
      <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: tone === 'warn' ? semantic.warning.onTint : neutral.ink }}>{value}</span>
      {sub !== undefined && <span style={{ fontSize: 11, color: neutral.mist }}>{sub}</span>}
    </div>
  )
}

function FlagPill({ flag }: { flag: ReviewFlag }) {
  const warn = flag.tone === 'warn'
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 8px', background: warn ? semantic.warning.tint : neutral.sunken, color: warn ? semantic.warning.onTint : neutral.slate }}>
      {flag.text}
    </span>
  )
}

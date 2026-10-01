import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, History, Minus, Plus, Receipt, ShieldAlert, Stethoscope, XCircle } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import {
  validateBookingForBilling,
  type BillingValidationFailure,
  type BookingBillingContext,
} from '../../domain/billing'
import {
  addPostOpAddendum,
  addProcedure,
  completeBooking,
  copyBooking,
  editBooking,
  prepaymentStatusFor,
  raisePreProcedureInvoice,
  removeAttachment,
  uncompleteBooking,
  useAppStore,
  useToday,
  type Actor,
} from '../../store'
import { Button } from '../ui'
import { useSurface, type BookingTotalLine } from '../surface'
import { BtmCaptureBlock, CompleteBar, CompletionOverlay, bookingFee, procedureFee } from '../capture'
import { ageYears, BOOKING_SOURCE_LABELS, formatDob, nhiBadge } from '../format'
import { AddAttachmentButton, AddAttachmentSheet, AttachmentStrip } from '../attachments'
import {
  CancelBookingSheet,
  EditPatientSheet,
  EditProcedureSheet,
  PrepaymentOverrideSheet,
  RemoveProcedureSheet,
} from '../flows'
import { OfficeBillingSetup } from './OfficeBillingSetup'
import { HistorySheet } from './HistorySheet'

interface BookingDetailBodyProps {
  bookingId: string
  actor: Actor
  /** Called after the completion overlay dismisses (chrome pops back to the list). */
  onBack: () => void
  /** Called with the new Booking's id after Copy; the chrome opens it. */
  onCopied: (newBookingId: string) => void
  /**
   * The platform masthead, handed to the layout rather than rendered above the
   * body, for chrome that wants it to react to the scroll it does not own.
   * Mobile and web use the supplied History action in their patient headers;
   * mobile also folds its masthead to a nav row as you work. Admin renders its
   * own page header above the body and passes nothing.
   */
  header?: (collapsed: boolean, history: React.ReactNode) => React.ReactNode
}

type SheetState =
  | 'none'
  | 'cancel'
  | 'patient'
  | 'prepaymentOverride'
  | 'attachment'
  | { kind: 'procedure'; procedureId: string }
  | { kind: 'removeProcedure'; procedureId: string; ordinal: number }

function shiftTime(time: string, deltaMin: number): string {
  const base = time === '' ? 8 * 60 : Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  const next = Math.max(0, Math.min(23 * 60 + 55, base + deltaMin))
  const h = Math.floor(next / 60)
  const m = next % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function Section({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div data-shot={`booking-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
      Edit
    </button>
  )
}

/** A teal-only office action button used inside the pre-payment banner (convention 17). */
const officeActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 36,
  padding: '0 12px',
  borderRadius: radius.ctl,
  border: `1px solid ${accent.base}`,
  background: neutral.surface,
  color: accent.base,
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

/**
 * The booking-detail body (Phase 05 extraction). Everything from the old mobile
 * `BookingDetailScreen` below the header: the patient / scheduled-time /
 * attachments / notes sections, the per-procedure BTM capture blocks (ordinal
 * ordered), the live `validateBookingForBilling` + the showValidation latch, the
 * copy / cancel / add-procedure / complete / amend handlers, the edit sheets,
 * the completion overlay, and the complete/amend bar. Both mobile's
 * `BookingDetailScreen` and web's `BookingDetailView` are thin chrome wrappers around
 * it — one body, one set of guards / validation, so a BTM edit behaves
 * identically on both platforms.
 *
 * It names the pieces (`header` / `history` / `banners` / `context` / `capture` /
 * `actions` / `summary` / `completeBar` / `overlay`) and hands them to
 * `useSurface().BookingLayout`, which owns the arrangement: one phone column, or
 * the desktop's capture-plus-sticky-rail grid. No `variant` branching here.
 */
export function BookingDetailBody({ bookingId, actor, onBack, onCopied, header }: BookingDetailBodyProps) {
  const { BookingLayout, BookingTotal } = useSurface()
  const booking = useAppStore((s) => s.schedule.bookings[bookingId])
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const masters = useAppStore((s) => s.masters)
  const prepaymentStatus = useAppStore((s) => prepaymentStatusFor(s, bookingId))
  const audit = useAppStore((s) => s.audit)
  // The anaesthetist Booking carries no calculation; only the office sees the fee.
  const showBookingTotal = actor.role !== 'anaesthetist'
  const todayISO = useToday()

  const list = booking !== undefined ? listsRecord[booking.listId] : undefined
  const procedures: Procedure[] = useMemo(() => {
    if (booking === undefined) return []
    return Object.values(proceduresRecord)
      .filter((p) => p.bookingId === bookingId)
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [booking, bookingId, proceduresRecord])

  const [notes, setNotes] = useState(booking?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetState>('none')
  /** Validation renders only after a refused Mark-complete (the latch) —
   *  never a wall of red on first open; thereafter it live-clears. */
  const [showValidation, setShowValidation] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const [postOpMsg, setPostOpMsg] = useState<string | null>(null)
  const overlayTimer = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotes(booking?.notes ?? '')
  }, [booking?.notes])

  useEffect(
    () => () => {
      if (overlayTimer.current !== null) clearTimeout(overlayTimer.current)
    },
    [],
  )

  const cancelled = booking?.cancellation !== undefined

  // Live validation (ctx assembled as billingContextForBooking does). Failures
  // render per-procedure anchors only after the showValidation latch.
  const failures: BillingValidationFailure[] = useMemo(() => {
    if (booking === undefined || list === undefined || cancelled) return []
    const anaesthetist = masters.anaesthetists[list.anaesthetistId]
    if (anaesthetist === undefined) return []
    const ctx: BookingBillingContext = {
      anaesthetist,
      rvgCodes: masters.rvgCodes,
      contracts: masters.contracts,
      contractPrices: Object.values(masters.contractPrices),
      insurers: masters.insurers,
      billableParties: masters.billableParties,
      billingLines: Object.values(billingLinesRecord),
    }
    if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
    return validateBookingForBilling(booking, procedures, ctx)
  }, [booking, list, cancelled, masters, billingLinesRecord, procedures])

  const bookingTotals = useMemo(() => {
    if (list === undefined || procedures.length === 0) return { units: 0, total: 0 }
    return bookingFee(procedures, list, masters, billingLinesRecord)
  }, [list, procedures, masters, billingLinesRecord])

  /**
   * The breakdown behind the pinned Booking total. Rows are per PROCEDURE on a
   * multi-procedure Booking, and per FEE LINE when a single procedure has more than
   * one (a rate-by-time line beside the RVG fee).
   *
   * The rate label is shown only where every procedure agrees on it: a Booking
   * mixing a Type 3 fixed price with a units-by-rate procedure has no single
   * rate to state, and inventing one would be worse than omitting it.
   */
  const bookingBreakdown = useMemo(() => {
    const empty = {
      lines: [] as BookingTotalLine[],
      rateLabel: null as string | null,
      overrideNote: null as string | null,
    }
    if (list === undefined || procedures.length === 0) return empty

    const views = procedures.map((procedure, index) =>
      procedureFee({ procedure, list, ordinal: index + 1, masters, billingLines: billingLinesRecord }),
    )

    const rateLabels = views.map(({ fee }) =>
      fee.unitRate === null ? 'FIXED CONTRACT PRICE' : `FEE @ $${fee.unitRate.toFixed(2)}/UNIT`,
    )
    const rateLabel = rateLabels.every((l) => l === rateLabels[0]) ? (rateLabels[0] ?? null) : null

    let lines: BookingTotalLine[]
    if (procedures.length > 1) {
      lines = procedures.map((procedure, index) => {
        const line: BookingTotalLine = {
          label: procedure.description === '' ? `Procedure ${index + 1}` : procedure.description,
          amount: views[index]!.fee.total,
        }
        if (procedure.isAdditional) line.note = 'Time units only'
        return line
      })
    } else {
      const only = views[0]!.fee
      lines = only.lines.length > 1 ? only.lines.map((l) => ({ label: l.description, amount: l.amount })) : []
    }

    // One procedure states what it was before the override; several would need a
    // per-row note, so the summary just says an override is in play.
    const overridden = views.filter((v) => v.fee.override !== null)
    const overrideNote =
      overridden.length === 0
        ? null
        : overridden.length === 1 && procedures.length === 1
          ? `Override applied · was $${overridden[0]!.fee.override!.before.toFixed(2)}`
          : `Override applied on ${overridden.length} of ${procedures.length} procedures`

    return { lines, rateLabel, overrideNote }
  }, [list, procedures, masters, billingLinesRecord])

  // The booking's full history: its own id plus its procedures' and billing lines'
  // ids, so BTM overrides / billing-setup edits (audited on those entities) show.
  //
  // Live records alone would lose the trail of anything REMOVED — the procedure
  // that was added, captured and then deleted would leave audit entries no
  // screen could reach, which is exactly what A6/A7 forbid. So the removals are
  // read back out of the log: a `procedure.remove` entry snapshots the whole
  // procedure into `before`, which names the Booking it belonged to, and the lines
  // that went with it are matched on that procedure id.
  const removedEntityIds = useMemo(() => {
    const procedureIds = new Set<string>()
    for (const entry of audit) {
      if (entry.entityType !== 'procedure' || entry.action !== 'procedure.remove') continue
      const before = entry.before as { bookingId?: string } | undefined
      if (before?.bookingId === bookingId) procedureIds.add(entry.entityId)
    }
    if (procedureIds.size === 0) return []
    const lineIds = audit
      .filter((entry) => {
        if (entry.entityType !== 'billingLine') return false
        const before = entry.before as { procedureId?: string } | undefined
        return before?.procedureId !== undefined && procedureIds.has(before.procedureId)
      })
      .map((entry) => entry.entityId)
    return [...procedureIds, ...new Set(lineIds)]
  }, [audit, bookingId])

  const historyEntityIds = useMemo(() => {
    const procedureIds = procedures.map((p) => p.id)
    const procedureIdSet = new Set(procedureIds)
    const lineIds = Object.values(billingLinesRecord)
      .filter((l) => procedureIdSet.has(l.procedureId))
      .map((l) => l.id)
    return [bookingId, ...procedureIds, ...lineIds, ...removedEntityIds]
  }, [bookingId, procedures, billingLinesRecord, removedEntityIds])

  /**
   * Which procedure each history row belongs to — only on a Booking that HAS more
   * than one, where the merged trail is otherwise ambiguous. A single-procedure
   * booking needs no scope line, and adding one would just be noise.
   */
  const historyEntityLabels = useMemo(() => {
    if (procedures.length < 2) return undefined
    const labels: Record<string, string> = {}
    procedures.forEach((procedure, index) => {
      const scope = `Procedure ${index + 1}`
      labels[procedure.id] = procedure.description === '' ? scope : `${scope} · ${procedure.description}`
      for (const line of Object.values(billingLinesRecord)) {
        if (line.procedureId === procedure.id) labels[line.id] = `${scope} · fee line`
      }
    })
    return labels
  }, [procedures, billingLinesRecord])

  if (booking === undefined || list === undefined) return null
  const patient = masters.patients[booking.patientId]
  // Mirror the store's editRefusal so the UI never offers an action the guard
  // would refuse, nor hides one it allows: the office edits DRAFT and SUBMITTED
  // (never AUTHORISED); the anaesthetist only their own DRAFT. This is what lets
  // the office correct billing setup, edit the patient/times/BTM, amend and
  // cancel a Booking on a SUBMITTED list (Phase 06 WI2), while the anaesthetist
  // stays blocked on SUBMITTED. Mobile/web pass an anaesthetist actor, so their
  // behaviour is unchanged (DRAFT-only).
  const canEdit = !cancelled && list.state !== 'AUTHORISED' && (list.state === 'DRAFT' || actor.role === 'office')
  const canCapture = canEdit && !booking.completed
  const isOffice = actor.role === 'office'
  const badge = nhiBadge(patient?.nhi)

  const showBar = !cancelled && (booking.completed || canCapture)
  const bookingLevelFailures = showValidation ? failures.filter((f) => f.procedureId === undefined) : []

  function run(outcome: { ok: boolean; message?: string }) {
    if (!outcome.ok) setError(outcome.message ?? 'That action was refused.')
    else setError(null)
  }

  function stepTime(delta: number) {
    run(editBooking(useAppStore, actor, bookingId, { scheduledTime: shiftTime(booking!.scheduledTime ?? '', delta) }))
  }

  function saveNotes() {
    if (notes === (booking!.notes ?? '')) return
    run(editBooking(useAppStore, actor, bookingId, { notes }))
  }

  function removeBookingAttachment(attachmentId: string) {
    return removeAttachment(useAppStore, actor, { kind: 'booking', id: bookingId }, attachmentId)
  }

  function doCopy() {
    const outcome = copyBooking(useAppStore, actor, bookingId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onCopied(outcome.value.bookingId)
  }

  function doAddProcedure() {
    run(addProcedure(useAppStore, actor, bookingId))
  }

  function markComplete() {
    const outcome = completeBooking(useAppStore, actor, bookingId)
    if (!outcome.ok) {
      // The refusal message renders verbatim; the latch turns inline
      // validation on (it live-clears as fields are fixed).
      setShowValidation(true)
      setCompleteError(outcome.message)
      const firstFailure = failures[0]
      if (firstFailure !== undefined) {
        window.requestAnimationFrame(() => {
          const root = contentRef.current
          if (root === null) return
          const candidates = Array.from(
            root.querySelectorAll<HTMLElement>('[data-validation-fields]'),
          ).filter((candidate) => {
            const fields = candidate.dataset.validationFields?.split(' ') ?? []
            return (
              candidate.dataset.validationProcedureId === firstFailure.procedureId &&
              fields.includes(firstFailure.field)
            )
          })
          const target =
            candidates.find(
              (candidate) =>
                candidate.matches('button, input, select, textarea') &&
                !candidate.matches(':disabled'),
            ) ?? candidates[0]
          if (target === undefined) return
          root.querySelectorAll<HTMLElement>('[data-validation-focus]').forEach((candidate) => {
            delete candidate.dataset.validationFocus
          })
          target.dataset.validationFocus = 'true'
          target.addEventListener(
            'blur',
            () => {
              delete target.dataset.validationFocus
            },
            { once: true },
          )
          target.focus({ preventScroll: true })
          target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
            block: 'center',
          })
        })
      }
      return
    }
    setCompleteError(null)
    setShowValidation(false)
    setOverlay(true)
    overlayTimer.current = window.setTimeout(dismissOverlay, 1050)
  }

  /**
   * End the completion moment. The 1050 ms timer above runs this, and so does a
   * tap on the overlay itself: the flood is an `inset: 0` blocker, and in the
   * installable PWA a timer lost to an unmount race would leave no back button,
   * no URL bar and no reload to escape with.
   *
   * Dismiss the overlay BEFORE navigating back — on mobile the screen stays
   * mounted in the SlideStack, so a lingering overlay would sit over the stack.
   */
  function dismissOverlay() {
    if (overlayTimer.current !== null) {
      clearTimeout(overlayTimer.current)
      overlayTimer.current = null
    }
    setOverlay(false)
    onBack()
  }

  function amend() {
    const outcome = uncompleteBooking(useAppStore, actor, bookingId)
    if (!outcome.ok) setError(outcome.message)
    else {
      setError(null)
      setCompleteError(null)
    }
  }

  function doRaisePrepayment() {
    run(raisePreProcedureInvoice(useAppStore, actor, bookingId))
  }

  function doAddPostOp() {
    const outcome = addPostOpAddendum(useAppStore, actor, bookingId)
    if (!outcome.ok) {
      setPostOpMsg(null)
      setError(outcome.message)
      return
    }
    setError(null)
    setPostOpMsg("Post-op addendum created on today's free session for this anaesthetist. Open it from the day view or list to capture and bill it.")
  }

  /* History affordance (Phase 07) — the booking's reconstructable audit trail,
     available on every platform (A6/A7). Own-data view is fine per A8. */
  const history = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        style={{ minHeight: 44, border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <History size={15} aria-hidden /> History
      </button>
    </div>
  )

  const hasBanners =
    cancelled ||
    (booking.copiedFromBookingId !== undefined && !booking.completed) ||
    booking.bookingType === 'postOpAddendum' ||
    prepaymentStatus !== 'none' ||
    error !== null ||
    (completeError !== null && showValidation)

  const banners = hasBanners ? (
    <>
      {cancelled && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.card, padding: 14, fontSize: 13 }}>
          <strong>Booking cancelled.</strong> {booking.cancellation?.reason} It stays visible but is excluded from the list's completion count and billing.
        </div>
      )}
      {booking.copiedFromBookingId !== undefined && !booking.completed && (
        <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
          Copied from another Booking for this patient on this List. Capture its procedure, then mark it complete.
        </div>
      )}
      {booking.bookingType === 'postOpAddendum' && (
        <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
          <strong>Post-op addendum</strong> · linked to the original episode. It bills as a new booking through its own cycle; the original booking stays locked and immutable (the RFP immutability answer).
        </div>
      )}
      {prepaymentStatus !== 'none' && (
        <div data-shot="booking-prepayment" style={{ background: prepaymentStatus === 'paid' ? semantic.success.tint : semantic.warning.tint, color: prepaymentStatus === 'paid' ? semantic.success.onTint : semantic.warning.onTint, borderRadius: radius.card, padding: 14, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <ShieldAlert size={16} aria-hidden />
            {prepaymentStatus === 'required' && 'Pre-payment required'}
            {prepaymentStatus === 'outstanding' && 'Pre-payment outstanding'}
            {prepaymentStatus === 'overridden' && 'Pre-payment gate overridden'}
            {prepaymentStatus === 'paid' && 'Pre-payment received'}
          </div>
          <span>
            {prepaymentStatus === 'required' &&
              'A patient-funded procedure on this booking requires pre-payment before the procedure proceeds. Completing the booking is blocked until the pre-invoice is paid or the office records an override.'}
            {prepaymentStatus === 'outstanding' &&
              'The pre-procedure invoice has been raised but is not yet paid. Completing the booking is blocked until payment clears or the office records an override.'}
            {prepaymentStatus === 'overridden' &&
              `The office lifted the pre-payment gate. Reason: ${booking.prepaymentOverride?.reason ?? 'not recorded'}.`}
            {prepaymentStatus === 'paid' && 'The pre-payment invoice has been paid. The completion gate is cleared.'}
          </span>
          {(prepaymentStatus === 'required' || prepaymentStatus === 'outstanding') && (
            <span style={{ fontSize: 11.5, opacity: 0.85 }}>
              Pre-payment timing against the AUTHORISED billing trigger is an RFP open question. The prototype raises the pre-invoice before the procedure and bills only the balance at the run.
            </span>
          )}
          {isOffice && (prepaymentStatus === 'required' || prepaymentStatus === 'outstanding') && canEdit && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              {prepaymentStatus === 'required' && (
                <button onClick={doRaisePrepayment} style={officeActionStyle}>
                  <Receipt size={14} aria-hidden /> Raise pre-procedure invoice
                </button>
              )}
              <button onClick={() => setSheet('prepaymentOverride')} style={officeActionStyle}>
                <ShieldAlert size={14} aria-hidden /> Override gate
              </button>
            </div>
          )}
        </div>
      )}
      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
          {error}
        </div>
      )}
      {completeError !== null && showValidation && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.card, padding: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <strong>{completeError}</strong>
          {bookingLevelFailures.map((f, i) => (
            <span key={i}>{f.message}</span>
          ))}
        </div>
      )}
    </>
  ) : null

  const context = (
    <>
      {/* Patient */}
      <Section label="Patient" action={canEdit ? <EditLink onClick={() => setSheet('patient')} /> : undefined}>
        <Row label="NHI">
          <span className="mono" style={{ fontSize: 14 }}>{badge.text}</span>
        </Row>
        {/* `data-aa-selectable` re-enables text selection and the iOS
            magnifier on clinical reference data. The mobile hosts switch
            selection off across the whole subtree so a resting thumb does not
            summon the magnifier on chrome; these are the values someone
            genuinely needs to copy at the bedside. NHI, times and money are
            already covered by `.mono`. */}
        {patient !== undefined && (
          <Row label="Date of birth">
            <span data-aa-selectable>{formatDob(patient.dobISO)} · {ageYears(patient.dobISO, todayISO)} years</span>
          </Row>
        )}
        <Row label="Contact">
          <span data-aa-selectable>{patient?.phone ?? 'Not recorded'}</span>
        </Row>
        {/* The slot the patient was booked into: reference data, so it sits
            with the patient rows at their weight. Given a card of its own it
            read as a second timer beside the Times card, which is the one that
            records what happened and drives the fee. The ±5 stays here rather
            than behind an Edit sheet because a slipping list is nudged in
            passing, and it keeps its 44px target for the phone. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: canEdit ? 44 : undefined }}>
          <span style={{ width: 96, flex: 'none', fontSize: 12, color: neutral.mist }}>Scheduled</span>
          <span className="mono" style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{booking.scheduledTime ?? 'Not set'}</span>
          {canEdit && (
            <>
              <Stepper label="5 minutes earlier" icon={<Minus size={16} aria-hidden />} onClick={() => stepTime(-5)} />
              <Stepper label="5 minutes later" icon={<Plus size={16} aria-hidden />} onClick={() => stepTime(5)} />
            </>
          )}
        </div>
      </Section>
      {/* How the Booking entered the system (DM-39): one quiet line when it is
          recorded, nothing when it is not. Display-only; nothing reads it. */}
      {booking.source !== undefined && (
        <div data-shot="booking-source" style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '0 2px', fontSize: 11, color: neutral.mist }}>
          <span style={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Source</span>
          <span aria-hidden>·</span>
          <span style={{ fontSize: 12, color: neutral.slate }}>{BOOKING_SOURCE_LABELS[booking.source]}</span>
        </div>
      )}

      {/* Attachments (US-03.1.3): written only through addAttachment / removeAttachment. */}
      <Section
        label="Attachments"
        action={canEdit ? <AddAttachmentButton onClick={() => setSheet('attachment')} /> : undefined}
      >
        <AttachmentStrip attachments={booking.attachments} canRemove={canEdit} onRemove={removeBookingAttachment} emptyText="No attachments." />
      </Section>

      {/* Notes for the office */}
      <Section label="Notes for the office">
        {canEdit ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Anything the office should know…"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 72, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, padding: 12, fontFamily: 'inherit', fontSize: 15, resize: 'none', background: neutral.bg }}
          />
        ) : (
          <div style={{ fontSize: 14, color: booking.notes !== undefined ? neutral.ink : neutral.mist }}>{booking.notes ?? 'No notes.'}</div>
        )}
      </Section>
    </>
  )

  const capture = (
    <>
      {/* Outcome / BTM capture — one block per procedure, in Booking order
          (the ordinal feeds Type 3 second-procedure pricing). */}
      {!cancelled &&
        procedures.map((procedure, index) => (
          <div key={procedure.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <BtmCaptureBlock
              procedure={procedure}
              list={list}
              actor={actor}
              ordinal={index + 1}
              procedureCount={procedures.length}
              canCapture={canCapture}
              failures={failures.filter((f) => f.procedureId === procedure.id)}
              showValidation={showValidation}
              onEdit={() => setSheet({ kind: 'procedure', procedureId: procedure.id })}
              onRemove={() => setSheet({ kind: 'removeProcedure', procedureId: procedure.id, ordinal: index + 1 })}
              onError={setError}
            />
            {actor.role === 'office' && (
              <OfficeBillingSetup
                procedure={procedure}
                list={list}
                ordinal={index + 1}
                actor={actor}
                canEdit={canEdit}
              />
            )}
          </div>
        ))}

      {canCapture && (
        <Button variant="secondary" block onClick={doAddProcedure}>
          <Plus size={16} aria-hidden /> Add another procedure
        </Button>
      )}
    </>
  )

  const actions = (
    <>
      {/* Actions */}
      {canEdit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Button variant="secondary" block onClick={doCopy}>
              <Copy size={16} aria-hidden /> Copy booking
            </Button>
            <span style={{ fontSize: 11.5, color: neutral.mist }}>
              Starts a new Booking for this patient on this List.
              {canCapture && ' To add a procedure to this Booking, use Add another procedure.'}
            </span>
          </div>
          <button
            onClick={() => setSheet('cancel')}
            style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${semantic.error.solid}55`, background: neutral.surface, color: semantic.error.onTint, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <XCircle size={16} aria-hidden /> Cancel booking
          </button>
        </div>
      )}

      {/* Post-op addendum (B8) — on a locked (authorised/billed) booking. The
          original stays immutable; the addendum is a new linked booking. */}
      {!cancelled && list.state === 'AUTHORISED' && booking.bookingType !== 'postOpAddendum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {postOpMsg !== null && (
            <div style={{ background: semantic.success.tint, color: semantic.success.onTint, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
              {postOpMsg}
            </div>
          )}
          <Button variant="secondary" block onClick={doAddPostOp}>
            <Stethoscope size={16} aria-hidden /> Add post-op event
          </Button>
          <span style={{ fontSize: 11.5, color: neutral.mist }}>
            A post-op charge (an HDU review, pain consult or nerve catheter) bills as a new linked booking on today's
            free session; this locked booking stays immutable (the RFP immutability answer).
          </span>
        </div>
      )}
    </>
  )

  return (
    <>
      <BookingLayout
        contentRef={contentRef}
        header={header ?? null}
        history={history}
        banners={banners}
        context={context}
        capture={capture}
        actions={actions}
        summary={
          cancelled || procedures.length === 0 || !showBookingTotal
            ? null
            : (action) => (
                <BookingTotal
                  units={bookingTotals.units}
                  fee={bookingTotals.total}
                  lines={bookingBreakdown.lines}
                  rateLabel={bookingBreakdown.rateLabel}
                  overrideNote={bookingBreakdown.overrideNote}
                  action={action}
                />
              )
        }
        completeBar={
          showBar ? (
            <CompleteBar
              completed={booking.completed}
              canAmend={canEdit}
              onComplete={markComplete}
              onAmend={amend}
            />
          ) : null
        }
        overlay={
          overlay ? (
            <CompletionOverlay
              units={bookingTotals.units}
              fee={bookingTotals.total}
              showCalculation={showBookingTotal}
              onDismiss={dismissOverlay}
            />
          ) : null
        }
      />

      <AddAttachmentSheet open={sheet === 'attachment'} target={{ kind: 'booking', id: bookingId }} actor={actor} onClose={() => setSheet('none')} />
      <CancelBookingSheet open={sheet === 'cancel'} bookingId={bookingId} actor={actor} onClose={() => setSheet('none')} onCancelled={() => setError(null)} />
      <PrepaymentOverrideSheet open={sheet === 'prepaymentOverride'} bookingId={bookingId} actor={actor} onClose={() => setSheet('none')} onOverridden={() => setError(null)} />
      {patient !== undefined && (
        <EditPatientSheet open={sheet === 'patient'} patient={patient} bookingId={bookingId} actor={actor} onClose={() => setSheet('none')} />
      )}
      {typeof sheet === 'object' && sheet.kind === 'procedure' && proceduresRecord[sheet.procedureId] !== undefined && (
        <EditProcedureSheet
          open
          procedure={proceduresRecord[sheet.procedureId]!}
          actor={actor}
          onClose={() => setSheet('none')}
        />
      )}
      {typeof sheet === 'object' && sheet.kind === 'removeProcedure' && proceduresRecord[sheet.procedureId] !== undefined && (
        <RemoveProcedureSheet
          open
          procedureId={sheet.procedureId}
          ordinal={sheet.ordinal}
          actor={actor}
          onClose={() => setSheet('none')}
          onRemoved={() => setError(null)}
        />
      )}
      <HistorySheet
        open={historyOpen}
        entityIds={historyEntityIds}
        {...(historyEntityLabels !== undefined ? { entityLabels: historyEntityLabels } : {})}
        title="Booking history"
        onClose={() => setHistoryOpen(false)}
      />
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 96, flex: 'none', fontSize: 12, color: neutral.mist }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{children}</span>
    </div>
  )
}

function Stepper({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
    >
      {icon}
    </button>
  )
}

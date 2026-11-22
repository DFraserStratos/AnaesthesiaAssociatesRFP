import { useEffect, useMemo, useRef, useState } from 'react'
import { History, Minus, Plus, Users, XCircle } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { Procedure } from '../../domain/types'
import { bookingMoveRefusal } from '../../domain/bookingMoves'
import { ethnicityText } from '../../domain/nzhis'
import { approvalNumberMissing, bookingTotalWithEvents } from '../../domain/billing'
import { completionFailuresFor, type CompletionFailure } from '../../domain/billing/completion'
import {
  addProcedure,
  completeBooking,
  completionContextFor,
  editBooking,
  editRefusal,
  heldPricesForBooking,
  useBookingPrepayment,
  railActorOf,
  railContextForList,
  railMastersOf,
  setRailAnswers,
  uncompleteBooking,
  useAppStore,
  useToday,
  eventsForBooking,
  bookingHistoryEntityIds,
  type Actor,
  type AppState,
} from '../../store'
import { Button, DefList, DefRow, TextArea, TextField } from '../ui'
import { Notice } from '../ui/Notice'
import { useSurface, type BookingTotalLine } from '../surface'
import { BtmCaptureBlock, CompleteBar, CompletionOverlay, bookingFee, type BookingFeeTotals } from '../capture'
import { ageYears, BOOKING_SOURCE_LABELS, formatCurrency, formatDob, hhmm, nhiBadge } from '../format'
import { procedureLabel } from '../../domain/billing/procedureStack'
import { allocationNote, inDisplayOrder } from '../../domain/billing/multiProcedure'
import { NO_PRIMARY_MESSAGE } from '../../domain/billing/bookingFee'
import { MakePrimarySheet } from '../flows/MakePrimarySheet'
import {
  CancelBookingSheet,
  EditPatientSheet,
  MoveBookingToColleagueSheet,
  FunderSheet,
  AlertOfficeEntry,
  OfficeAlertLine,
  RemoveProcedureSheet,
  movedToYouByLine,
  useBookingMovedToMeNotice,
} from '../flows'
import { useBookingWarnings, warningsFor, WarningsPanel } from '../warnings'
import { BalanceAlertPill, useBalanceAlert } from '../patients'
import { SharedNotes } from '../notes'
import { OfficeBillingSetup } from './OfficeBillingSetup'
import { ProcedureEventsList } from './ProcedureEventsList'
import { PrepaymentPanel, useSettledPrepayments, type PrepaymentOfficeLinks } from './PrepaymentPanel'
import { PrepaidSettlementBlock } from './PrepaidSettlementBlock'
import { FunderDetailsView } from './FunderDetailsView'
import { startForAddedProcedure } from '../../domain/billing/contractRail'
import { HistorySheet } from './HistorySheet'
import { OfficeSavedNotice } from './OfficeSavedNotice'
import { useBookingApi, useBookingStore, useBookingStoreMode, useCommandBlock } from './draft'
import { viewerOf } from '../viewer'

interface BookingDetailBodyProps {
  bookingId: string
  actor: Actor
  /** Called after the completion overlay dismisses (chrome pops back to the list). */
  onBack: () => void
  /**
   * The platform masthead, handed to the layout rather than rendered above the
   * body, for chrome that wants it to react to the scroll it does not own.
   * Mobile and web use the supplied History action in their patient headers;
   * mobile also folds its masthead to a nav row as you work. Admin renders its
   * own page header above the body and passes nothing.
   */
  header?: (collapsed: boolean, history: React.ReactNode) => React.ReactNode
  /** Admin's links from the prepayment panel to the Invoices screen (catch-up Phase 27). */
  officeLinks?: PrepaymentOfficeLinks
  /** Admin: open the review sheet for an event awaiting review (catch-up Phase 38b). */
  onReviewEvent?: (eventId: string) => void
}

type SheetState =
  | 'none'
  | 'cancel'
  | 'patient'
  | 'funder'
  | { kind: 'removeProcedure'; procedureId: string; displayNumber: number }
  | { kind: 'makePrimary'; procedureId: string }

/** A whole 24-hour time, as the draft's time field takes it. */
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/

function shiftTime(time: string, deltaMin: number): string {
  const base = time === '' ? 8 * 60 : Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  return hhmm(Math.max(0, Math.min(23 * 60 + 55, base + deltaMin)))
}

/** Hooks the capture recipes target on a rule's warning row (15a's prepayment; catch-up Phase 21's two). */
const BOOKING_WARNING_SHOTS: Partial<Record<string, string>> = {
  prepaymentUnpaid: 'booking-prepayment',
  childPayer: 'booking-child-warning',
  approvalNumberMissing: 'booking-approval-warning',
}

function Section({ label, action, children, shot }: { label: string; action?: React.ReactNode; children: React.ReactNode; shot?: string }) {
  return (
    <div data-shot={shot ?? `booking-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

function EditLink({ onClick, label = 'Edit', ariaLabel }: { onClick: () => void; label?: string; ariaLabel?: string }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
      {label}
    </button>
  )
}

/**
 * The booking-detail body (Phase 05 extraction). Everything from the old mobile
 * `BookingDetailScreen` below the header: the patient / scheduled-time /
 * notes sections, the per-procedure BTM capture blocks (the primary first,
 * `inDisplayOrder`), the live completion rule (`completionFailuresFor`) + the showValidation latch, the
 * cancel / add-procedure / complete / amend handlers, the edit sheets,
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
export function BookingDetailBody({ bookingId, actor, onBack, header, officeLinks, onReviewEvent }: BookingDetailBodyProps) {
  const { BookingLayout, BookingTotal } = useSurface()
  const booking = useBookingStore((s) => s.schedule.bookings[bookingId])
  const listsRecord = useBookingStore((s) => s.schedule.lists)
  const proceduresRecord = useBookingStore((s) => s.schedule.procedures)
  // The price ladder's held amounts (catch-up Phase 24) read the invoices.
  const invoices = useBookingStore((s) => s.billing.invoices)
  const invoiceLines = useBookingStore((s) => s.billing.invoiceLines)
  const locks = useBookingStore((s) => s.billing.locks)
  const masters = useBookingStore((s) => s.masters)
  const prepaymentStatus = useBookingPrepayment(bookingId).status
  // A prepayment settled by a cancellation or a Contract change (catch-up Phase 41) keeps the panel on screen.
  const prepaymentSettled = useSettledPrepayments(bookingId).length > 0
  const showPrepayment = prepaymentStatus !== 'none' || prepaymentSettled
  // The balance warning is the office's (catch-up Phase 40): the anaesthetist sees its colour code instead.
  const warnings = warningsFor(useBookingWarnings(bookingId), actor.role)
  const balanceAlert = useBalanceAlert(bookingId, actor.role === 'anaesthetist' ? actor.anaesthetistId : undefined)
  // The history reads the saved audit, never a draft's own entries (catch-up Phase 35).
  const audit = useAppStore((s) => s.audit)
  const todayISO = useToday()
  // Drafted edits go to the Booking's store (the Admin draft, else the real one); commands
  // (complete, amend, cancel, move, post-op) act on the real store and wait while the draft is unsaved.
  const bookingApi = useBookingApi()
  const blocked = useCommandBlock()

  const list = booking !== undefined ? listsRecord[booking.listId] : undefined
  const procedures: Procedure[] = useMemo(() => {
    if (booking === undefined) return []
    return Object.values(proceduresRecord)
      .filter((p) => p.bookingId === bookingId)
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [booking, bookingId, proceduresRecord])

  const [notes, setNotes] = useState(booking?.notes ?? '')
  /** The draft's time as typed (24-hour HH:MM); written once it is a whole time. */
  const [timeText, setTimeText] = useState(booking?.scheduledTime ?? '')
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetState>('none')
  /** Validation renders only after a refused Mark-complete (the latch) —
   *  never a wall of red on first open; thereafter it live-clears. */
  const [showValidation, setShowValidation] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  /** Move to a colleague (Phase 32a). Held here, outside the gated actions, so the done state outlives the move. */
  const [moveOpen, setMoveOpen] = useState(false)
  // A Booking a colleague handed her (Phase 32a): "Moved to you by Dr Souter on Tue 21 Jul", for the notice window.
  const movedToMe = useBookingMovedToMeNotice(bookingId, actor.role === 'anaesthetist' ? actor.anaesthetistId : undefined)
  const [overlay, setOverlay] = useState(false)
  /** The prepayment re-check after removing a Procedure (catch-up Phase 27, US-06.3.5). */
  const [recheck, setRecheck] = useState<string | null>(null)
  const overlayTimer = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotes(booking?.notes ?? '')
  }, [booking?.notes])
  useEffect(() => {
    setTimeText(booking?.scheduledTime ?? '')
  }, [booking?.scheduledTime])

  useEffect(
    () => () => {
      if (overlayTimer.current !== null) clearTimeout(overlayTimer.current)
    },
    [],
  )

  const cancelled = booking?.cancellation !== undefined
  // Leaving after Move to a colleague is explicit: once a move has committed,
  // closing the sheet returns to her List (no effect, so no navigation loop
  // while the slide stack keeps this layer mounted).
  const [movedByHer, setMovedByHer] = useState(false)
  // Mounted from the first open (and then kept, so the done state outlives the move), not on every Booking screen.
  const [moveMounted, setMoveMounted] = useState(false)

  // Live validation: the completion rule over the same context `completionBlockersFor` builds
  // (`completionContextFor`, catch-up Phase 21a). Failures render per-procedure anchors only
  // after the showValidation latch.
  const failures: CompletionFailure[] = useMemo(() => {
    // A Booking on a Draft List has no anaesthetist yet, so nothing to validate against (catch-up Phase 31).
    if (booking === undefined || cancelled) return []
    const ctx = completionContextFor(
      { masters, schedule: { bookings: { [booking.id]: booking }, lists: listsRecord } },
      booking.id,
    )
    return ctx === undefined ? [] : completionFailuresFor(booking, procedures, ctx)
  }, [booking, cancelled, masters, listsRecord, procedures])

  // The whole Booking priced once, under the multi-procedure rule (catch-up Phase 23): the
  // total, the breakdown and every capture block read this one result.
  const bookingTotals: BookingFeeTotals = useMemo(() => {
    if (list === undefined || list.state === 'DRAFT' || procedures.length === 0) {
      return { units: 0, total: 0, needsPrice: false, order: inDisplayOrder(procedures).map((p) => p.id), primaryId: undefined, views: {} }
    }
    const held = booking !== undefined ? heldPricesForBooking({ billing: { invoices, invoiceLines, locks }, schedule: { lists: listsRecord, bookings: { [booking.id]: booking }, procedures: proceduresRecord } }, booking.id) : {}
    const lock = booking !== undefined ? locks[booking.id] : undefined
    return bookingFee({ procedures, list, masters, patientId: booking?.patientId, held, ...(lock !== undefined ? { lock } : {}) })
  }, [list, procedures, masters, booking, invoices, invoiceLines, locks, listsRecord, proceduresRecord])
  // The primary first, then the rest in Booking order (US-03.2.2): every list on this screen.
  const ordered: Procedure[] = useMemo(() => inDisplayOrder(procedures), [procedures])

  // The office's total with each Procedure's events (catch-up Phase 38b; US-03.1.10): Admin only.
  const procedureEvents = useBookingStore((s) => s.schedule.procedureEvents)
  // Who is looking decides office-only detail (catch-up Phase 43a): the one viewer rule.
  const viewer = viewerOf(actor)
  const totalWithEvents = useMemo(() => {
    if (viewer !== 'office' || bookingTotals.structural !== undefined) return undefined
    const prices = bookingTotals.order.map((id) => ({ procedureId: id, price: bookingTotals.views[id]?.fee.total ?? 0 }))
    const r = bookingTotalWithEvents(prices, eventsForBooking({ schedule: { procedureEvents } as AppState['schedule'] }, bookingId), { bookingPrice: bookingTotals.total, invoices })
    return { eventsTotal: r.eventsTotal, total: r.total, gst: r.gst }
  }, [viewer, bookingTotals, procedureEvents, bookingId, invoices])

  // After Make primary the new primary's block slides into the top place (the theme's
  // selection-slide, never blocking; reduced motion is the 80 ms fade).
  const blockRefs = useRef(new Map<string, HTMLDivElement>())
  // Keyed by Booking, so opening another Booking never plays it.
  const lastPrimary = useRef<string | undefined>(undefined)
  useEffect(() => {
    const id = bookingTotals.primaryId
    const key = id === undefined ? undefined : `${bookingId}:${id}`
    const previous = lastPrimary.current
    lastPrimary.current = key
    if (previous === undefined || id === undefined || key === undefined || previous === key || !previous.startsWith(`${bookingId}:`)) return
    const el = blockRefs.current.get(id)
    if (el === undefined || typeof el.animate !== 'function') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    el.animate(
      reduced ? [{ opacity: 0.6 }, { opacity: 1 }] : [{ transform: 'translateY(24px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }],
      { duration: reduced ? motion.reducedMotionFade : motion.selectionSlide.duration, easing: reduced ? 'linear' : motion.selectionSlide.easing },
    )
  }, [bookingTotals.primaryId, bookingId])

  /**
   * The breakdown behind the pinned Booking total. Rows are per PROCEDURE on a
   * multi-procedure Booking, and per FEE LINE when a single procedure has more than
   * one (a rate-by-time line beside the RVG fee).
   *
   * The rate label is shown only where every procedure agrees on it: a Booking
   * mixing a fixed price with a units-by-rate procedure has no single
   * rate to state, and inventing one would be worse than omitting it.
   */
  const bookingBreakdown = useMemo(() => {
    const empty = {
      lines: [] as BookingTotalLine[],
      rateLabel: null as string | null,
      overrideNote: null as string | null,
      notes: [] as string[],
    }
    // A Booking on a Draft List has no anaesthetist to price it yet (catch-up Phase 31).
    if (list === undefined || list.state === 'DRAFT' || procedures.length === 0 || bookingTotals.structural !== undefined) return empty

    const views = ordered.map((procedure) => bookingTotals.views[procedure.id]!)

    // What the price is, from the one price function (catch-up Phase 24): a typed, invoiced or prepaid
    // price says so, never "fixed contract price" on an RVG Contract.
    const rateLabels = views.map(({ fee }) => {
      const held = fee.price.status === 'priced' ? fee.price.heldBy : null
      if (held === 'typed') return 'PRICE TYPED'
      if (held === 'authorised') return 'INVOICED PRICE'
      if (held === 'prepaid') return 'PREPAID PRICE'
      // The old rate labels stay the office's (catch-up Phase 43a): the anaesthetist reads the
      // pricing basis on each Procedure's stack and the calculation on its Price section.
      if (viewer === 'anaesthetist') return null
      return fee.unitRate === null ? 'FIXED CONTRACT PRICE' : `FEE @ ${formatCurrency(fee.unitRate)}/UNIT`
    })
    const rateLabel = rateLabels.every((l) => l === rateLabels[0]) ? (rateLabels[0] ?? null) : null

    let lines: BookingTotalLine[]
    const notes: string[] = []
    if (procedures.length > 1) {
      lines = ordered.map((procedure, index) => {
        const line: BookingTotalLine = {
          label: procedureLabel(procedure, masters.rvgGroups, index + 1),
          amount: views[index]!.fee.total,
        }
        // Each row's place in the multi-procedure rule (catch-up Phase 23): the office's wording (43a).
        if (viewer === 'office') line.note = allocationNote(views[index]!.allocation)
        if (views[index]!.fee.needsPrice) line.needsPrice = true
        return line
      })
      const first = views[0]!.allocation
      // OQ-132's default, provisional: a fixed or open price primary bills no base units.
      // The rule's notes are the office's (catch-up Phase 43a).
      if (viewer === 'office' && !first.rvgPriced) notes.push('No base units billed (provisional, OQ-132)')
      if (viewer === 'office' && first.splitAcross > 1) notes.push(`Modifiers ${first.bookingModifierUnits}, split ${first.splitShares.join(' · ')}`)
    } else {
      const only = views[0]!.fee
      lines = only.lines.length > 1 ? only.lines.map((l) => ({ label: l.description, amount: l.amount })) : []
    }

    // A typed price (catch-up Phase 24): one procedure states the computed price beside it;
    // several would need a per-row note, so the summary says how many are typed.
    const typed = views.filter((v) => v.fee.price.status === 'priced' && v.fee.price.heldBy === 'typed')
    const only = typed[0]?.fee.price
    const overrideNote =
      typed.length === 0
        ? null
        : typed.length === 1 && procedures.length === 1
          ? only?.status === 'priced' && only.computedTotal !== undefined
            ? `Price typed · computed ${formatCurrency(only.computedTotal)}`
            : 'Price typed'
          : `Price typed on ${typed.length} of ${procedures.length} procedures`

    return { lines, rateLabel, overrideNote, notes }
  }, [list, procedures, ordered, bookingTotals, masters.rvgGroups, viewer])

  // The booking's full history: its own id plus its procedures'
  // ids, so BTM overrides / billing-setup edits (audited on those entities) show.
  //
  // Live records alone would lose the trail of anything REMOVED — the procedure
  // that was added, captured and then deleted would leave audit entries no
  // screen could reach, which is exactly what A6/A7 forbid. So the removals are
  // read back out of the log: a `procedure.remove` entry snapshots the whole
  // procedure into `before`, which names the Booking it belonged to.
  const removedEntityIds = useMemo(() => {
    const procedureIds = new Set<string>()
    for (const entry of audit) {
      if (entry.entityType !== 'procedure' || entry.action !== 'procedure.remove') continue
      const before = entry.before as { bookingId?: string } | undefined
      if (before?.bookingId === bookingId) procedureIds.add(entry.entityId)
    }
    return [...procedureIds]
  }, [audit, bookingId])

  // The Booking's whole story (catch-up Phase 39 review): its Procedures and fee lines, and its billing too: invoices,
  // events (a credit's steps), credit notes and negative invoices (`bookingHistoryEntityIds`), with this draft's removed rows.
  const historySchedule = useBookingStore((s) => s.schedule)
  const historyBilling = useBookingStore((s) => s.billing)
  const historyEntityIds = useMemo(
    () => [...new Set([...bookingHistoryEntityIds({ schedule: historySchedule, billing: historyBilling, audit }, bookingId), ...removedEntityIds])],
    [historySchedule, historyBilling, audit, bookingId, removedEntityIds],
  )

  /**
   * Which procedure each history row belongs to — only on a Booking that HAS more
   * than one, where the merged trail is otherwise ambiguous. A single-procedure
   * booking needs no scope line, and adding one would just be noise.
   */
  const historyEntityLabels = useMemo(() => {
    if (procedures.length < 2) return undefined
    const labels: Record<string, string> = {}
    ordered.forEach((procedure, index) => {
      const scope = procedure.isPrimary ? 'Primary' : 'Additional'
      const label = procedureLabel(procedure, masters.rvgGroups, index + 1)
      labels[procedure.id] = `${scope} · ${label}`
    })
    return labels
  }, [ordered, procedures.length, masters.rvgGroups])

  // "Add another procedure" (US-03.2.3, catch-up Phase 20): the new Procedure
  // picks its own Contract on the step rail, opened on the primary's answers
  // (catch-up Phase 23) with its Contract ticked when it is still on offer (one
  // tap to confirm, never stored silently). Closing the rail adds nothing.
  const addRailContext = useMemo(() => (list !== undefined ? railContextForList({ masters }, list, booking) : undefined), [masters, list, booking])
  const { start: addRailStart } = startForAddedProcedure(railMastersOf({ masters }), addRailContext, railActorOf(actor), procedures)

  if (booking === undefined || list === undefined) return null
  const patient = masters.patients[booking.patientId]
  // The store's editRefusal decides, so the UI never offers an action the guard
  // would refuse, nor hides one it allows: the office edits ACTIVE and SUBMITTED
  // (never AUTHORISED), and so does the anaesthetist on their own Lists until the
  // office authorises them (catch-up Phase 38a, RV-19, D63; the last change stands).
  // editRefusal also refuses a Booking on a colleague's List (one she has just
  // moved to them, or reached by URL).
  const canEdit = !cancelled && editRefusal(actor, list) === null
  // Move to a colleague (catch-up Phase 32a, US-01.4.7): the anaesthetist's own
  // non-cancelled Booking on her ACTIVE List dated today or later. The office
  // keeps its own Move in Admin.
  const canMove =
    actor.role === 'anaesthetist' &&
    actor.source !== 'integration' &&
    bookingMoveRefusal({ lists: listsRecord, bookings: { [bookingId]: booking } }, bookingId, actor.anaesthetistId, todayISO) === null
  const canCapture = canEdit && !booking.completed
  const isOffice = viewer === 'office'
  // The row's label already says NHI: the value is the bare number ("ZAP3016", not "NHI ZAP3016").
  const nhiValue = nhiBadge(patient?.nhi).text.replace(/^NHI /, '')

  const showBar = !cancelled && (booking.completed || canCapture)
  const bookingLevelFailures = showValidation ? failures.filter((f) => f.procedureId === undefined) : []

  function run(outcome: { ok: boolean; message?: string }) {
    if (!outcome.ok) setError(outcome.message ?? 'That action was refused.')
    else setError(null)
  }

  function stepTime(delta: number) {
    run(editBooking(bookingApi, actor, bookingId, { scheduledTime: shiftTime(booking!.scheduledTime ?? '', delta) }))
  }

  // In the Admin draft (catch-up Phase 35) the notes and time write to the draft as typed; Save changes saves them.
  const draftMode = useBookingStoreMode() === 'draft'
  // Empty text is no notes (undefined), so typing then deleting leaves the draft clean.
  const notesValue = (text: string): string | undefined => (text === '' ? undefined : text)
  function changeNotes(text: string) {
    setNotes(text)
    if (draftMode && notesValue(text) !== booking!.notes) run(editBooking(bookingApi, actor, bookingId, { notes: notesValue(text) }))
  }

  function changeTime(text: string) {
    setTimeText(text)
    if (TIME_24H.test(text) && text !== booking!.scheduledTime) run(editBooking(bookingApi, actor, bookingId, { scheduledTime: text }))
  }

  function saveNotes() {
    if (draftMode) return
    if (notes === (booking!.notes ?? '')) return
    run(editBooking(bookingApi, actor, bookingId, { notes: notesValue(notes) }))
  }

  // "Add another procedure" (US-03.2.3): the new Procedure picks its own
  // Contract on its own Billing card; it starts on the primary's
  // answers when that Contract still fits (answers only, never a Contract
  // stored silently), else at the first step.
  function doAddProcedure() {
    const added = addProcedure(bookingApi, actor, bookingId)
    if (!added.ok) return run(added)
    if (addRailStart !== undefined) run(setRailAnswers(bookingApi, actor, added.value.procedureId, addRailStart))
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

  /* History affordance (Phase 07) — the booking's reconstructable audit trail,
     available on every platform (A6/A7). Own-data view is fine per A8. */
  const history = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Another actor's save landed while this screen was open (catch-up Phase 35). */}
      <OfficeSavedNotice bookingId={bookingId} actor={actor} onViewHistory={() => setHistoryOpen(true)} />
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        type="button"
        data-shot="booking-history-button"
        onClick={() => setHistoryOpen(true)}
        style={{ minHeight: 44, border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <History size={15} aria-hidden /> History
      </button>
    </div>
    </div>
  )

  const hasBanners =
    warnings.length > 0 ||
    balanceAlert.strength !== 'none' ||
    movedToMe !== undefined ||
    cancelled ||
    showPrepayment ||
    recheck !== null ||
    error !== null ||
    (completeError !== null && showValidation)

  const banners = hasBanners ? (
    <>
      {/* First, so the warning is on screen the moment the Booking opens (US-13.7.3). */}
      <WarningsPanel
        warnings={warnings}
        actor={actor}
        canClear={isOffice}
        rowShot={(w) => BOOKING_WARNING_SHOTS[w.ruleId]}
        help
      />
      {/* The anaesthetist's balance colour code (catch-up Phase 40): no amount, no name, no Clear. */}
      {actor.role === 'anaesthetist' && <BalanceAlertPill alert={balanceAlert} placement="detail" />}
      {movedToMe !== undefined && (
        <Notice tone="neutral" shot="booking-moved-to-you">
          {movedToYouByLine(movedToMe.atISO, movedToMe.fromName)}
        </Notice>
      )}
      {cancelled && (
        <Notice tone="error" icon={false}>
          <span>
            <strong>Booking cancelled.</strong> {booking.cancellation?.reason} It stays visible but is excluded from the list's completion count and billing.
          </span>
        </Notice>
      )}
      {/* The prepayment, per payer group (catch-up Phase 27; US-06.3.2, US-03.1.8): on screen the moment the Booking opens. */}
      {showPrepayment && (
        <PrepaymentPanel
          bookingId={bookingId}
          actor={actor}
          {...(officeLinks !== undefined ? { links: officeLinks } : {})}
          onShowProcedure={(id) => blockRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        />
      )}
      {recheck !== null && (
        <Notice tone="neutral" icon={false} shot="prepayment-recheck">
          {recheck}
        </Notice>
      )}
      {error !== null && (
        <Notice tone="error" icon={false}>
          {error}
        </Notice>
      )}
      {completeError !== null && showValidation && (
        <Notice tone="error" icon={false} title={completeError}>
          {bookingLevelFailures.map((f, i) => (
            <span key={i}>{f.message}</span>
          ))}
        </Notice>
      )}
      {/* What the anaesthetist cannot finish goes to the office (catch-up Phase 21a, US-03.6.3): 32b's alert,
          beside the office-fixable failures. The Booking still needs completing before the List submits. */}
      {showValidation && actor.role === 'anaesthetist' && list !== undefined && failures.some((f) => f.fixableBy === 'office') && (
        <Notice tone="neutral" icon={false} shot="completion-alert-office">
          The office puts the Contract or the price right. If you cannot finish this Booking, use Alert the office below.
        </Notice>
      )}
    </>
  ) : null

  const context = (
    <>
      {/* Patient */}
      <Section label="Patient" action={canEdit ? <EditLink onClick={() => setSheet('patient')} /> : undefined}>
        <DefList gap={10}>
          <DefRow label="NHI">
            <span className="mono" data-shot="booking-patient-nhi" style={{ fontSize: 14 }}>{nhiValue}</span>
          </DefRow>
          {/* `data-aa-selectable` re-enables text selection and the iOS
              magnifier on clinical reference data. The mobile hosts switch
              selection off across the whole subtree so a resting thumb does not
              summon the magnifier on chrome; these are the values someone
              genuinely needs to copy at the bedside. NHI, times and money are
              already covered by `.mono`. */}
          {patient !== undefined && (
            <DefRow label="Date of birth">
              <span data-aa-selectable>{patient.dobISO === '' ? formatDob('') : `${formatDob(patient.dobISO)} · ${ageYears(patient.dobISO, todayISO)} years`}</span>
            </DefRow>
          )}
          <DefRow label="Contact">
            <span data-aa-selectable>{patient?.phone ?? 'Not recorded'}</span>
          </DefRow>
          {/* Ethnicity only where supplied (catch-up Phase 40, US-11.1.1): never required. */}
          {patient?.ethnicityCode !== undefined && (
            <DefRow label="Ethnicity">
              <span data-aa-selectable data-shot="booking-patient-ethnicity">{ethnicityText(patient.ethnicityCode)}</span>
            </DefRow>
          )}
          {/* The slot the patient was booked into: reference data, so it sits
              with the patient rows at their weight. Given a card of its own it
              read as a second timer beside the Times card, which is the one that
              records what happened and drives the fee. The ±5 stays here rather
              than behind an Edit sheet because a slipping list is nudged in
              passing, and it keeps its 44px target for the phone. */}
          <DefRow
            label="Scheduled"
            mono
            style={{ alignItems: 'center', ...(canEdit ? { minHeight: 44 } : {}) }}
            trailing={
              canEdit && (
                <>
                  {draftMode && (
                    // 24-hour HH:MM as typed (the browser's time input showed 12-hour); the shared field's compact chrome.
                    <TextField
                      label="Scheduled time"
                      hideLabel
                      mono
                      size="compact"
                      width={84}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="HH:MM"
                      shot="booking-time-input"
                      value={timeText}
                      invalid={timeText !== '' && !TIME_24H.test(timeText)}
                      onChange={changeTime}
                      onBlur={() => setTimeText(booking.scheduledTime ?? '')}
                    />
                  )}
                  <Stepper label="5 minutes earlier" icon={<Minus size={16} aria-hidden />} onClick={() => stepTime(-5)} />
                  <Stepper label="5 minutes later" icon={<Plus size={16} aria-hidden />} onClick={() => stepTime(5)} />
                </>
              )
            }
          >
            {/* In the Admin draft the time input shows the value; the text beside it was clipped to "16:". */}
            {canEdit && draftMode ? null : (booking.scheduledTime ?? 'Not set')}
          </DefRow>
        </DefList>
      </Section>
      {/* The payer is on each Procedure, in its Billing card's Paid by line (catch-up Phase 22a; US-11.2.2):
          the Booking holds only the insurer or funder and its approval number (US-11.4.3, D28). */}
      {/* The insurer or funder and the approval number (catch-up Phase 21;
          US-11.4.3): the office and, on the day, the anaesthetist record
          them; the anaesthetist sees the number. Never who is invoiced. */}
      <Section
        label="Insurer or funder"
        shot="booking-funder-row"
        action={
          canEdit ? (
            <EditLink
              label={booking.funderPartyId === undefined ? 'Add insurer or funder' : 'Change'}
              ariaLabel={booking.funderPartyId === undefined ? 'Add insurer or funder' : 'Change the insurer or funder'}
              onClick={() => setSheet('funder')}
            />
          ) : undefined
        }
      >
        <FunderDetailsView
          funder={booking.funderPartyId !== undefined ? masters.parties[booking.funderPartyId] : undefined}
          approvalNumber={booking.insuranceApprovalNumber}
          approvalMissing={approvalNumberMissing(booking, masters.parties)}
        />
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

      {/* Notes for the office */}
      <Section label="Notes for the office">
        {canEdit ? (
          <TextArea
            ariaLabel="Notes for the office"
            value={notes}
            onChange={changeNotes}
            onBlur={saveNotes}
            placeholder="Anything the office should know…"
          />
        ) : (
          <div style={{ fontSize: 14, color: booking.notes !== undefined ? neutral.ink : neutral.mist }}>{booking.notes ?? 'No notes.'}</div>
        )}
      </Section>

      {/* The shared note (catch-up Phase 40; US-11.3.3): the office and the anaesthetist both read and add, with author and time. */}
      <Section label="Shared notes">
        <SharedNotes target={{ bookingId }} actor={actor} />
      </Section>
    </>
  )

  const capture = (
    <>
      {/* Outcome / BTM capture: one block per procedure, the primary first (`inDisplayOrder`,
          catch-up Phase 23); the number only labels it. */}
      {/* A Booking on a Draft List has no anaesthetist yet, so no fee or capture: its
          procedures are listed and priced once the office assigns the List (catch-up Phase 31). */}
      {!cancelled && list.state === 'DRAFT' && procedures.length > 0 && (
        <Section label={`Procedures (${procedures.length})`}>
          {ordered.map((procedure, index) => (
            <div key={procedure.id} style={{ fontSize: 14, color: neutral.ink }}>
              {procedureLabel(procedure, masters.rvgGroups, index + 1)}
              {procedure.rvgGroupId !== undefined && masters.rvgGroups[procedure.rvgGroupId] !== undefined && (
                <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: neutral.slate }}>{masters.rvgGroups[procedure.rvgGroupId]!.code}</span>
              )}
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: neutral.mist }}>The fee shows once an anaesthetist is assigned.</div>
        </Section>
      )}
      {!cancelled && list.state !== 'DRAFT' && bookingTotals.structural !== undefined && (
        <Notice tone="error" shot="booking-structural">{NO_PRIMARY_MESSAGE}.</Notice>
      )}
      {!cancelled &&
        list.state !== 'DRAFT' &&
        bookingTotals.structural === undefined &&
        ordered.map((procedure, index) => (
          <div
            key={procedure.id}
            ref={(el) => {
              if (el === null) blockRefs.current.delete(procedure.id)
              else blockRefs.current.set(procedure.id, el)
            }}
            data-shot="procedure-block"
            data-procedure-id={procedure.id}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <BtmCaptureBlock
              procedure={procedure}
              list={list}
              actor={actor}
              view={bookingTotals.views[procedure.id]!}
              displayNumber={index + 1}
              procedureCount={procedures.length}
              canCapture={canCapture}
              failures={failures.filter((f) => f.procedureId === procedure.id)}
              showValidation={showValidation}
              onRemove={() => setSheet({ kind: 'removeProcedure', procedureId: procedure.id, displayNumber: index + 1 })}
              onMakePrimary={() => setSheet({ kind: 'makePrimary', procedureId: procedure.id })}
              onError={setError}
            />
            {viewer === 'office' && (
              <OfficeBillingSetup
                procedure={procedure}
                displayNumber={index + 1}
                actor={actor}
                canEdit={canEdit}
              />
            )}
            {/* A prepaid Procedure's settlement (catch-up Phase 41; US-06.4.1, D31): the prepaid price, the BTM for reference, and what was raised by hand. */}
            <PrepaidSettlementBlock
              procedureId={procedure.id}
              actor={actor}
              {...(officeLinks !== undefined ? { onOpenInvoice: officeLinks.onOpenInvoice } : {})}
              {...(officeLinks?.onOpenCreditNote !== undefined ? { onOpenCreditNote: officeLinks.onOpenCreditNote } : {})}
            />
            {/* The Procedure's events (catch-up Phase 38b; US-03.7.3): on no List or schedule, only here. */}
            <ProcedureEventsList
              procedureId={procedure.id}
              actor={actor}
              {...(onReviewEvent !== undefined ? { onReview: onReviewEvent } : {})}
              {...(officeLinks !== undefined ? { onOpenInvoice: officeLinks.onOpenInvoice } : {})}
              {...(officeLinks?.onOpenCreditNote !== undefined ? { onOpenCreditNote: officeLinks.onOpenCreditNote } : {})}
            />
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
      {/* Alert the office (catch-up Phase 32b, US-03.6.3): the owner asks; the office sees and ticks it here. */}
      {actor.role === 'anaesthetist' && !cancelled && <AlertOfficeEntry actor={actor} target={{ listId: list.id, bookingId }} />}
      {isOffice && <OfficeAlertLine actor={actor} target={{ listId: list.id, bookingId }} />}
      {canMove && (
        <div data-shot="move-booking-action" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <Button
            variant="secondary"
            block
            disabled={blocked !== null}
            disabledReason={blocked}
            onClick={() => {
              setMoveMounted(true)
              setMoveOpen(true)
            }}
          >
            <Users size={16} aria-hidden /> Move to a colleague
          </Button>
          <span style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>
            Hand this Booking to a colleague who is free that session. If someone else is doing it, move it to them before the procedure.
          </span>
        </div>
      )}
      {canEdit && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
          <Button variant="danger" block disabled={blocked !== null} disabledReason={blocked} onClick={() => setSheet('cancel')}>
            <XCircle size={16} aria-hidden /> Cancel booking
          </Button>
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
          // A Booking on a Draft List has no anaesthetist to price or complete it yet (catch-up Phase 31).
          // Every Booking shows what the price comes to (catch-up Phase 24, US-03.3.10, RV-29): the phone's dock strip, the web rail's panel.
          cancelled || procedures.length === 0 || list?.state === 'DRAFT'
            ? null
            : (action) => (
                <BookingTotal
                  units={bookingTotals.units}
                  fee={bookingTotals.total}
                  needsPrice={bookingTotals.needsPrice}
                  lines={bookingBreakdown.lines}
                  rateLabel={bookingBreakdown.rateLabel}
                  overrideNote={bookingBreakdown.overrideNote}
                  notes={bookingBreakdown.notes}
                  multiProcedure={procedures.length > 1}
                  action={action}
                  {...(totalWithEvents !== undefined ? { withEvents: totalWithEvents } : {})}
                />
              )
        }
        completeBar={
          showBar && list?.state !== 'DRAFT' ? (
            <CompleteBar
              completed={booking.completed}
              canAmend={canEdit}
              onComplete={markComplete}
              onAmend={amend}
              blocked={blocked}
            />
          ) : null
        }
        overlay={
          overlay ? (
            <CompletionOverlay
              units={bookingTotals.units}
              fee={bookingTotals.total}
              showCalculation
              onDismiss={dismissOverlay}
            />
          ) : null
        }
      />

      {actor.role === 'anaesthetist' && moveMounted && (
        <MoveBookingToColleagueSheet
          open={moveOpen}
          actor={actor}
          bookingId={bookingId}
          onClose={() => {
            setMoveOpen(false)
            if (movedByHer) onBack()
          }}
          onBackToList={() => {
            setMoveOpen(false)
            onBack()
          }}
          onMoved={() => setMovedByHer(true)}
        />
      )}
      <CancelBookingSheet open={sheet === 'cancel'} bookingId={bookingId} actor={actor} onClose={() => setSheet('none')} onCancelled={() => setError(null)} />
      {patient !== undefined && (
        <EditPatientSheet open={sheet === 'patient'} patient={patient} bookingId={bookingId} actor={actor} onClose={() => setSheet('none')} />
      )}
      {!cancelled && (
        <FunderSheet open={sheet === 'funder'} bookingId={bookingId} actor={actor} onClose={() => setSheet('none')} />
      )}
      {typeof sheet === 'object' && sheet.kind === 'removeProcedure' && proceduresRecord[sheet.procedureId] !== undefined && (
        <RemoveProcedureSheet
          open
          procedureId={sheet.procedureId}
          displayNumber={sheet.displayNumber}
          actor={actor}
          onClose={() => setSheet('none')}
          onRemoved={(line) => {
            setError(null)
            setRecheck(line)
          }}
        />
      )}
      {typeof sheet === 'object' && sheet.kind === 'makePrimary' && proceduresRecord[sheet.procedureId] !== undefined && (
        <MakePrimarySheet open procedureId={sheet.procedureId} actor={actor} onClose={() => setSheet('none')} onDone={() => setError(null)} />
      )}
      <HistorySheet
        open={historyOpen}
        entityIds={historyEntityIds}
        {...(historyEntityLabels !== undefined ? { entityLabels: historyEntityLabels } : {})}
        title="Booking history"
        onClose={() => setHistoryOpen(false)}
        coverListId={booking.listId}
        viewer={viewer}
        {...(draftMode ? { asAtBookingId: bookingId } : {})}
      />
    </>
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

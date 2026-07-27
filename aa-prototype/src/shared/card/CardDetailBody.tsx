import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, History, ImagePlus, Minus, Plus, Receipt, ShieldAlert, Stethoscope, X, XCircle } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import {
  validateCardForBilling,
  type BillingValidationFailure,
  type CardBillingContext,
} from '../../domain/billing'
import {
  addPostOpAddendum,
  addProcedure,
  completeCard,
  copyCard,
  editCard,
  prepaymentStatusFor,
  raisePreProcedureInvoice,
  uncompleteCard,
  useAppStore,
  useToday,
  type Actor,
} from '../../store'
import { Button } from '../ui'
import { useSurface } from '../surface'
import {
  BtmCaptureBlock,
  CardTotalPanel,
  CompleteBar,
  CompletionOverlay,
  cardFee,
  procedureFee,
  type CardTotalLine,
} from '../capture'
import { ageYears, formatDob, nhiBadge } from '../format'
import { PAPER_CARD_A } from '../../assets/samplePaperCards'
import {
  CancelCardSheet,
  EditPatientSheet,
  EditProcedureSheet,
  PrepaymentOverrideSheet,
  RemoveProcedureSheet,
} from '../flows'
import { OfficeBillingSetup } from './OfficeBillingSetup'
import { HistorySheet } from './HistorySheet'

interface CardDetailBodyProps {
  cardId: string
  actor: Actor
  /** Called after the completion overlay dismisses (chrome pops back to the list). */
  onBack: () => void
  /** Called after a Card Copy (chrome pops back to the list). */
  onCopied: () => void
}

type SheetState =
  | 'none'
  | 'cancel'
  | 'patient'
  | 'prepaymentOverride'
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
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
 * The card-detail body (Phase 05 extraction). Everything from the old mobile
 * `CardDetailScreen` below the header: the patient / scheduled-time /
 * attachments / notes sections, the per-procedure BTM capture blocks (ordinal
 * ordered), the live `validateCardForBilling` + the showValidation latch, the
 * copy / cancel / add-procedure / complete / amend handlers, the edit sheets,
 * the completion overlay, and the complete/amend bar. Both mobile's
 * `CardDetailScreen` and web's `CardDetailView` are thin chrome wrappers around
 * it — one body, one set of guards / validation, so a BTM edit behaves
 * identically on both platforms.
 *
 * It names the pieces (`history` / `banners` / `context` / `capture` /
 * `actions` / `summary` / `completeBar` / `overlay`) and hands them to
 * `useSurface().CardLayout`, which owns the arrangement: one phone column, or
 * the desktop's capture-plus-sticky-rail grid. No `variant` branching here.
 */
export function CardDetailBody({ cardId, actor, onBack, onCopied }: CardDetailBodyProps) {
  const { CardLayout } = useSurface()
  const card = useAppStore((s) => s.schedule.cards[cardId])
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const masters = useAppStore((s) => s.masters)
  const prepaymentStatus = useAppStore((s) => prepaymentStatusFor(s, cardId))
  const audit = useAppStore((s) => s.audit)
  const todayISO = useToday()

  const list = card !== undefined ? listsRecord[card.listId] : undefined
  const procedures: Procedure[] = useMemo(() => {
    if (card === undefined) return []
    return Object.values(proceduresRecord)
      .filter((p) => p.cardId === cardId)
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [card, cardId, proceduresRecord])

  const [notes, setNotes] = useState(card?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetState>('none')
  /** Validation renders only after a refused Mark-complete (the latch) —
   *  never a wall of red on first open; thereafter it live-clears. */
  const [showValidation, setShowValidation] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  /** Which attachment is showing its Remove button (hover, or keyboard focus). */
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null)
  const [overlay, setOverlay] = useState(false)
  const [postOpMsg, setPostOpMsg] = useState<string | null>(null)
  const overlayTimer = useRef<number | null>(null)

  useEffect(() => {
    setNotes(card?.notes ?? '')
  }, [card?.notes])

  useEffect(
    () => () => {
      if (overlayTimer.current !== null) clearTimeout(overlayTimer.current)
    },
    [],
  )

  const cancelled = card?.cancellation !== undefined

  // Live validation (ctx assembled as billingContextForCard does). Failures
  // render per-procedure anchors only after the showValidation latch.
  const failures: BillingValidationFailure[] = useMemo(() => {
    if (card === undefined || list === undefined || cancelled) return []
    const anaesthetist = masters.anaesthetists[list.anaesthetistId]
    if (anaesthetist === undefined) return []
    const ctx: CardBillingContext = {
      anaesthetist,
      rvgCodes: masters.rvgCodes,
      contracts: masters.contracts,
      contractPrices: Object.values(masters.contractPrices),
      insurers: masters.insurers,
      billableParties: masters.billableParties,
      billingLines: Object.values(billingLinesRecord),
    }
    if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
    return validateCardForBilling(card, procedures, ctx)
  }, [card, list, cancelled, masters, billingLinesRecord, procedures])

  const cardTotals = useMemo(() => {
    if (list === undefined || procedures.length === 0) return { units: 0, total: 0 }
    return cardFee(procedures, list, masters, billingLinesRecord)
  }, [list, procedures, masters, billingLinesRecord])

  /**
   * The breakdown behind the Card total, for a surface that pins the money in
   * one place instead of putting a panel under each procedure. Rows are per
   * PROCEDURE on a multi-procedure Card, and per FEE LINE when a single
   * procedure has more than one (a rate-by-time line beside the RVG fee).
   * The rate label is shown only where every procedure agrees on it: a Card
   * mixing a Type 3 fixed price with a units-by-rate procedure has no single
   * rate to state, and inventing one would be worse than omitting it.
   */
  const cardBreakdown = useMemo(() => {
    const empty = { lines: [] as CardTotalLine[], rateLabel: null as string | null, overrideNote: null as string | null }
    if (list === undefined || procedures.length === 0) return empty

    const views = procedures.map((procedure, index) =>
      procedureFee({ procedure, list, ordinal: index + 1, masters, billingLines: billingLinesRecord }),
    )

    const rateLabels = views.map(({ fee }) =>
      fee.unitRate === null ? 'FIXED CONTRACT PRICE' : `FEE @ $${fee.unitRate.toFixed(2)}/UNIT`,
    )
    const rateLabel = rateLabels.every((l) => l === rateLabels[0]) ? (rateLabels[0] ?? null) : null

    let lines: CardTotalLine[]
    if (procedures.length > 1) {
      lines = procedures.map((procedure, index) => {
        const line: CardTotalLine = {
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

  // The card's full history: its own id plus its procedures' and billing lines'
  // ids, so BTM overrides / billing-setup edits (audited on those entities) show.
  //
  // Live records alone would lose the trail of anything REMOVED — the procedure
  // that was added, captured and then deleted would leave audit entries no
  // screen could reach, which is exactly what A6/A7 forbid. So the removals are
  // read back out of the log: a `procedure.remove` entry snapshots the whole
  // procedure into `before`, which names the Card it belonged to, and the lines
  // that went with it are matched on that procedure id.
  const removedEntityIds = useMemo(() => {
    const procedureIds = new Set<string>()
    for (const entry of audit) {
      if (entry.entityType !== 'procedure' || entry.action !== 'procedure.remove') continue
      const before = entry.before as { cardId?: string } | undefined
      if (before?.cardId === cardId) procedureIds.add(entry.entityId)
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
  }, [audit, cardId])

  const historyEntityIds = useMemo(() => {
    const procedureIds = procedures.map((p) => p.id)
    const procedureIdSet = new Set(procedureIds)
    const lineIds = Object.values(billingLinesRecord)
      .filter((l) => procedureIdSet.has(l.procedureId))
      .map((l) => l.id)
    return [cardId, ...procedureIds, ...lineIds, ...removedEntityIds]
  }, [cardId, procedures, billingLinesRecord, removedEntityIds])

  /**
   * Which procedure each history row belongs to — only on a Card that HAS more
   * than one, where the merged trail is otherwise ambiguous. A single-procedure
   * card needs no scope line, and adding one would just be noise.
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

  if (card === undefined || list === undefined) return null
  const patient = masters.patients[card.patientId]
  // Mirror the store's editRefusal so the UI never offers an action the guard
  // would refuse, nor hides one it allows: the office edits DRAFT and SUBMITTED
  // (never AUTHORISED); the anaesthetist only their own DRAFT. This is what lets
  // the office correct billing setup, edit the patient/times/BTM, amend and
  // cancel a Card on a SUBMITTED list (Phase 06 WI2), while the anaesthetist
  // stays blocked on SUBMITTED. Mobile/web pass an anaesthetist actor, so their
  // behaviour is unchanged (DRAFT-only).
  const canEdit = !cancelled && list.state !== 'AUTHORISED' && (list.state === 'DRAFT' || actor.role === 'office')
  const canCapture = canEdit && !card.completed
  const isOffice = actor.role === 'office'
  const badge = nhiBadge(patient?.nhi)

  const showBar = !cancelled && (card.completed || canCapture)
  const cardLevelFailures = showValidation ? failures.filter((f) => f.procedureId === undefined) : []

  function run(outcome: { ok: boolean; message?: string }) {
    if (!outcome.ok) setError(outcome.message ?? 'That action was refused.')
    else setError(null)
  }

  function stepTime(delta: number) {
    run(editCard(useAppStore, actor, cardId, { scheduledTime: shiftTime(card!.scheduledTime ?? '', delta) }))
  }

  function saveNotes() {
    if (notes === (card!.notes ?? '')) return
    run(editCard(useAppStore, actor, cardId, { notes }))
  }

  function addPhoto() {
    // One past the highest index ever used on this Card, not the count: after
    // removing Photo 2 of 3 the count would name the next one Photo 3 as well,
    // and two attachments sharing an id make Remove take both. Counting up
    // rather than filling the gap keeps the row in order, so a removal reads
    // as a missing number instead of a shuffled one.
    const n =
      card!.attachments.reduce((highest, a) => {
        const match = /-A(\d+)$/.exec(a.id)
        return match === null ? highest : Math.max(highest, Number(match[1]))
      }, 0) + 1
    run(
      editCard(useAppStore, actor, cardId, {
        attachments: [...card!.attachments, { id: `${cardId}-A${n}`, name: `Photo ${n}`, kind: 'photo', dataUrl: PAPER_CARD_A }],
      }),
    )
  }

  function removePhoto(attachmentId: string) {
    run(
      editCard(useAppStore, actor, cardId, {
        attachments: card!.attachments.filter((a) => a.id !== attachmentId),
      }),
    )
  }

  function doCopy() {
    const outcome = copyCard(useAppStore, actor, cardId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onCopied()
  }

  function doAddProcedure() {
    run(addProcedure(useAppStore, actor, cardId))
  }

  function markComplete() {
    const outcome = completeCard(useAppStore, actor, cardId)
    if (!outcome.ok) {
      // The refusal message renders verbatim; the latch turns inline
      // validation on (it live-clears as fields are fixed).
      setShowValidation(true)
      setCompleteError(outcome.message)
      return
    }
    setCompleteError(null)
    setShowValidation(false)
    setOverlay(true)
    overlayTimer.current = window.setTimeout(() => {
      // Dismiss the overlay BEFORE navigating back — on mobile the screen stays
      // mounted in the SlideStack, so a lingering overlay would sit over the stack.
      setOverlay(false)
      onBack()
    }, 1050)
  }

  function amend() {
    const outcome = uncompleteCard(useAppStore, actor, cardId)
    if (!outcome.ok) setError(outcome.message)
    else {
      setError(null)
      setCompleteError(null)
    }
  }

  function doRaisePrepayment() {
    run(raisePreProcedureInvoice(useAppStore, actor, cardId))
  }

  function doAddPostOp() {
    const outcome = addPostOpAddendum(useAppStore, actor, cardId)
    if (!outcome.ok) {
      setPostOpMsg(null)
      setError(outcome.message)
      return
    }
    setError(null)
    setPostOpMsg("Post-op addendum created on today's free session for this anaesthetist. Open it from the day view or list to capture and bill it.")
  }

  /* History affordance (Phase 07) — the card's reconstructable audit trail,
     available on every platform (A6/A7). Own-data view is fine per A8. */
  const history = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={() => setHistoryOpen(true)}
        style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <History size={15} aria-hidden /> History
      </button>
    </div>
  )

  const banners = (
    <>
      {cancelled && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.card, padding: 14, fontSize: 13 }}>
          <strong>Card cancelled.</strong> {card.cancellation?.reason} It stays visible but is excluded from the list's completion count and billing.
        </div>
      )}
      {card.copiedFromCardId !== undefined && (
        <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
          Additional procedure, copied from an earlier card on this list. It bills for time units only.
        </div>
      )}
      {card.cardType === 'postOpAddendum' && (
        <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
          <strong>Post-op addendum</strong> · linked to the original episode. It bills as a new card through its own cycle; the original card stays locked and immutable (the RFP immutability answer).
        </div>
      )}
      {prepaymentStatus !== 'none' && (
        <div style={{ background: prepaymentStatus === 'paid' ? semantic.success.tint : semantic.warning.tint, color: prepaymentStatus === 'paid' ? semantic.success.onTint : semantic.warning.onTint, borderRadius: radius.card, padding: 14, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <ShieldAlert size={16} aria-hidden />
            {prepaymentStatus === 'required' && 'Pre-payment required'}
            {prepaymentStatus === 'outstanding' && 'Pre-payment outstanding'}
            {prepaymentStatus === 'overridden' && 'Pre-payment gate overridden'}
            {prepaymentStatus === 'paid' && 'Pre-payment received'}
          </div>
          <span>
            {prepaymentStatus === 'required' &&
              'A patient-funded procedure on this card requires pre-payment before the procedure proceeds. Completing the card is blocked until the pre-invoice is paid or the office records an override.'}
            {prepaymentStatus === 'outstanding' &&
              'The pre-procedure invoice has been raised but is not yet paid. Completing the card is blocked until payment clears (live payment lands in Phase 10) or the office records an override.'}
            {prepaymentStatus === 'overridden' &&
              `The office lifted the pre-payment gate. Reason: ${card.prepaymentOverride?.reason ?? 'not recorded'}.`}
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
          {cardLevelFailures.map((f, i) => (
            <span key={i}>{f.message}</span>
          ))}
        </div>
      )}
    </>
  )

  const context = (
    <>
      {/* Patient */}
      <Section label="Patient" action={canEdit ? <EditLink onClick={() => setSheet('patient')} /> : undefined}>
        <Row label="NHI">
          <span className="mono" style={{ fontSize: 14 }}>{badge.text}</span>
          {badge.formatLabel !== null && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: neutral.slate, background: neutral.sunken, border: `1px solid ${neutral.line}`, borderRadius: 999, padding: '2px 8px' }}>
              {badge.formatLabel}
            </span>
          )}
        </Row>
        {patient !== undefined && (
          <Row label="Date of birth">
            <span>{formatDob(patient.dobISO)} · {ageYears(patient.dobISO, todayISO)} years</span>
          </Row>
        )}
        <Row label="Contact">
          <span>{patient?.phone ?? 'Not recorded'}</span>
        </Row>
        {/* The slot the patient was booked into: reference data, so it sits
            with the patient rows at their weight. Given a card of its own it
            read as a second timer beside the Times card, which is the one that
            records what happened and drives the fee. The ±5 stays here rather
            than behind an Edit sheet because a slipping list is nudged in
            passing, and it keeps its 44px target for the phone. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: canEdit ? 44 : undefined }}>
          <span style={{ width: 96, flex: 'none', fontSize: 12, color: neutral.mist }}>Scheduled</span>
          <span className="mono" style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{card.scheduledTime ?? 'Not set'}</span>
          {canEdit && (
            <>
              <Stepper label="5 minutes earlier" icon={<Minus size={16} aria-hidden />} onClick={() => stepTime(-5)} />
              <Stepper label="5 minutes later" icon={<Plus size={16} aria-hidden />} onClick={() => stepTime(5)} />
            </>
          )}
        </div>
      </Section>

      {/* Attachments */}
      <Section label="Attachments" action={canEdit ? <button onClick={addPhoto} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}><ImagePlus size={16} aria-hidden /> Add photo</button> : undefined}>
        {card.attachments.length === 0 ? (
          <div style={{ fontSize: 13, color: neutral.mist }}>No attachments.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {card.attachments.map((a) => (
              <div
                key={a.id}
                onMouseEnter={() => setHoveredPhoto(a.id)}
                onMouseLeave={() => setHoveredPhoto((current) => (current === a.id ? null : current))}
                style={{ width: 72, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}
              >
                {a.dataUrl !== undefined ? (
                  <img src={a.dataUrl} alt={a.name} style={{ width: 72, height: 92, objectFit: 'cover', borderRadius: 8, border: `1px solid ${neutral.line}` }} />
                ) : (
                  <div style={{ width: 72, height: 92, borderRadius: 8, background: neutral.sunken, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neutral.mist, fontSize: 11 }}>{a.kind}</div>
                )}
                {/* On the thumbnail, not a row of Remove links: the target is
                    what it deletes. It fades in on hover so a wall of scans
                    reads as scans, and stays MOUNTED while hidden — focus
                    reveals it, which is what keeps it reachable by keyboard. */}
                {canEdit && (
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    title={`Remove ${a.name}`}
                    onClick={() => removePhoto(a.id)}
                    onFocus={() => setHoveredPhoto(a.id)}
                    onBlur={() => setHoveredPhoto((current) => (current === a.id ? null : current))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 999, border: `1px solid ${neutral.line}`, background: neutral.surface, color: semantic.error.onTint, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: elevation.e1, opacity: hoveredPhoto === a.id ? 1 : 0, transition: 'opacity 120ms ease-out' }}
                  >
                    <X size={13} strokeWidth={2.6} aria-hidden />
                  </button>
                )}
                <span style={{ fontSize: 10, color: neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              </div>
            ))}
          </div>
        )}
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
          <div style={{ fontSize: 14, color: card.notes !== undefined ? neutral.ink : neutral.mist }}>{card.notes ?? 'No notes.'}</div>
        )}
      </Section>
    </>
  )

  const capture = (
    <>
      {/* Outcome / BTM capture — one block per procedure, in Card order
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
          <Button variant="secondary" block onClick={doCopy}>
            <Copy size={16} aria-hidden /> Copy for an additional procedure
          </Button>
          <button
            onClick={() => setSheet('cancel')}
            style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${semantic.error.solid}55`, background: neutral.surface, color: semantic.error.onTint, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <XCircle size={16} aria-hidden /> Cancel card
          </button>
        </div>
      )}

      {/* Post-op addendum (B8) — on a locked (authorised/billed) card. The
          original stays immutable; the addendum is a new linked card. */}
      {!cancelled && list.state === 'AUTHORISED' && card.cardType !== 'postOpAddendum' && (
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
            A post-op charge (an HDU review, pain consult or nerve catheter) bills as a new linked card on today's
            free session; this locked card stays immutable (the RFP immutability answer).
          </span>
        </div>
      )}
    </>
  )

  return (
    <>
      <CardLayout
        history={history}
        banners={banners}
        context={context}
        capture={capture}
        actions={actions}
        summary={
          cancelled || procedures.length === 0
            ? null
            : (action) => (
                <CardTotalPanel
                  units={cardTotals.units}
                  fee={cardTotals.total}
                  lines={cardBreakdown.lines}
                  rateLabel={cardBreakdown.rateLabel}
                  overrideNote={cardBreakdown.overrideNote}
                  action={action}
                />
              )
        }
        completeBar={
          showBar ? (
            <CompleteBar
              completed={card.completed}
              canAmend={canEdit}
              onComplete={markComplete}
              onAmend={amend}
            />
          ) : null
        }
        overlay={overlay ? <CompletionOverlay units={cardTotals.units} fee={cardTotals.total} /> : null}
      />

      <CancelCardSheet open={sheet === 'cancel'} cardId={cardId} actor={actor} onClose={() => setSheet('none')} onCancelled={() => setError(null)} />
      <PrepaymentOverrideSheet open={sheet === 'prepaymentOverride'} cardId={cardId} actor={actor} onClose={() => setSheet('none')} onOverridden={() => setError(null)} />
      {patient !== undefined && (
        <EditPatientSheet open={sheet === 'patient'} patient={patient} cardId={cardId} actor={actor} onClose={() => setSheet('none')} />
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
        title="Card history"
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

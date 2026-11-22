/**
 * The two event sheets (catch-up Phase 39b; US-03.7.1, US-03.7.2, US-05.5.2):
 * "Add pre-op or post-op event" and "Add billing event", on the mobile, web
 * and Admin Booking detail, under each Procedure's events (38b's list). They
 * render in the surface's own overlay: a bottom sheet on the phone, a dialog
 * on web and in Admin, as 38b's additional invoice sheet does, and share its
 * party field (`EventPartyField`) and anatomy (`OverlayHeader`, `SheetActions`).
 *
 * No modifier, base unit, rate, RVG or add-on control anywhere (US-03.7.1 AC
 * 2), and no calculation shown: a time reads "The office prices the time at
 * review." Every word from `procedureEventCopy.ts`. PWA-safe.
 */

import { useState, type ReactNode } from 'react'
import { isOfficeViewer } from '../viewer'
import { neutral } from '../../theme/tokens'
import type { BillingEventDetail, PrePostOpEventDetail } from '../../domain/types'
import { EVENT_RULES } from '../../domain/billing/procedureEvent'
import { ACC_PREOP_PRESETS, eventTypesOf, type EventRecording, type PrePostOpEventType } from '../../domain/billing/prePostOpEvent'
import { eventFeeFor } from '../../domain/billing/contractEventFees'
import { parseAmount } from '../../domain/billing/money'
import { addDaysISO } from '../../domain/clock'
import { procedureLabel } from '../../domain/billing/procedureStack'
import {
  addBillingEvent,
  addPrePostOpEvent,
  counterpartyName,
  invoiceAddresseeName,
  liveInvoiceForProcedure,
  resolvedPartyOf,
  updateProcedureEvent,
  useAppStore,
  type Actor,
} from '../../store'
import { Button, Checkbox, FieldHint, FieldLabel, FormError, OptionRow, Segmented, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { NumberStepper } from '../capture/ui'
import { EventPartyField, partyDraftOf, partyInputOf, type PartyDraft } from './AdditionalInvoiceForm'
import { useBookingStore } from './draft'
import { EVENT_KIND_MESSAGES, EVENT_TYPE_LABEL, PRE_POST_OP_COPY as COPY } from '../procedureEventCopy'

// ---------------------------------------------------------------------------
// Shared parts
// ---------------------------------------------------------------------------

interface SheetProps {
  open: boolean
  procedureId: string
  actor: Actor
  onClose: () => void
  /** Editing an event awaiting review, declined or not invoiced. */
  eventId?: string
}

type FieldError = { message: string; field?: string } | null

/** The day after `iso`, by calendar date. */
function nextDay(iso: string): string {
  return addDaysISO(iso, 1)
}

/** The Procedure's context the sheets read: its List date, today, its party's name, and whether it is invoiced. */
function useProcedureContext(procedureId: string) {
  const state = useBookingStore((s) => s)
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  const original = liveInvoiceForProcedure(state, procedureId)
  const resolved = resolvedPartyOf(state, { procedureId, party: { sameAs: true } })
  const sameAsName =
    original !== undefined
      ? invoiceAddresseeName(state, original)
      : resolved !== undefined
        ? (resolved.billedTo?.name ?? counterpartyName(state, resolved.counterparty, booking?.id ?? ''))
        : ''
  const listDateISO = list?.dateISO ?? state.clock.todayISO
  const todayISO = state.clock.todayISO
  const latest = todayISO > listDateISO ? todayISO : listDateISO
  return { state, procedure, booking, patient, listDateISO, latest, sameAsName, invoiced: original !== undefined }
}

/** The invoice tick and the "same as" party: both sheets. */
function TickAndParty({ procedureId, sameAsName, billable, onBillable, party, onParty, plain }: { procedureId: string; sameAsName: string; billable: boolean; onBillable: (b: boolean) => void; party: PartyDraft; onParty: (p: PartyDraft) => void; plain: boolean }) {
  const phone = useSurface().variant === 'mobile'
  return (
    <>
      <Checkbox checked={billable} onChange={onBillable} hint={COPY.invoiceTickCaption} shot="event-invoice-tick" style={{ fontSize: phone ? 15 : 14, color: neutral.ink }}>
        {COPY.invoiceTick}
      </Checkbox>
      <EventPartyField
        procedureId={procedureId}
        sameAsName={sameAsName}
        value={party}
        onChange={onParty}
        label={COPY.billTo}
        sameAsLabel={sameAsName !== '' ? `${COPY.sameAsTick} (${sameAsName})` : COPY.sameAsTick}
        // The office's reading caption (39b); the anaesthetist reads the tick alone (catch-up Phase 43a).
        {...(plain ? {} : { caption: COPY.sameAsCaption })}
      />
    </>
  )
}

/** A caption under a field: the shared `FieldHint`, carrying the hook recipes and specs target. */
function Caption({ children, shot }: { children: ReactNode; shot?: string }) {
  return (
    <div data-shot={shot}>
      <FieldHint tone="slate">{children}</FieldHint>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add pre-op or post-op event
// ---------------------------------------------------------------------------

export function AddPrePostOpEventSheet(props: SheetProps) {
  const { Overlay } = useSurface()
  return (
    <Overlay open={props.open} onClose={props.onClose}>
      {props.open && <PrePostOpForm {...props} />}
    </Overlay>
  )
}

function PrePostOpForm({ procedureId, actor, onClose, eventId }: SheetProps) {
  const ctx = useProcedureContext(procedureId)
  const { state, procedure, patient, listDateISO, latest } = ctx
  const variant = useSurface().variant
  const existing = eventId !== undefined ? state.schedule.procedureEvents[eventId] : undefined
  const detail = existing?.detail.kind === 'preOp' || existing?.detail.kind === 'postOp' ? (existing.detail as PrePostOpEventDetail) : undefined

  const [kind, setKind] = useState<'preOp' | 'postOp'>(detail?.kind ?? 'postOp')
  const [type, setType] = useState<PrePostOpEventType | null>(detail?.type ?? null)
  const [code, setCode] = useState<string | undefined>(detail?.code)
  const [date, setDate] = useState(existing?.occurredOnISO ?? defaultDate('postOp'))
  const [start, setStart] = useState(existing?.startTime ?? '')
  const [records, setRecords] = useState<'time' | 'fixedFee'>(detail?.recording.kind ?? 'time')
  const [minutes, setMinutes] = useState(detail?.recording.kind === 'time' ? detail.recording.minutes : 30)
  const [amount, setAmount] = useState(detail?.recording.kind === 'fixedFee' && detail.recording.source === 'typed' ? String(detail.recording.amount) : '')
  const [billable, setBillable] = useState(existing?.billable ?? true)
  const [party, setParty] = useState<PartyDraft>(existing !== undefined ? partyDraftOf(existing.party) : EVENT_RULES.sameAsDefault ? { sameAs: true } : { sameAs: false, party: null, person: null })
  const [error, setError] = useState<FieldError>(null)

  function defaultDate(k: 'preOp' | 'postOp'): string {
    if (k === 'preOp') return listDateISO
    const after = nextDay(listDateISO)
    return after > latest ? latest : after
  }

  if (procedure === undefined) return null
  const fee = type !== null ? eventFeeFor({ eventFees: state.masters.contractEventFees, contractId: procedure.governingContractId, type }) : undefined

  function pickKind(k: 'preOp' | 'postOp') {
    setKind(k)
    setType(null)
    setCode(undefined)
    if (existing === undefined) setDate(defaultDate(k))
  }

  function recording(): EventRecording {
    if (records === 'time') return { kind: 'time', minutes }
    if (fee !== undefined) return { kind: 'fixedFee', source: 'contractEventFee', contractId: fee.contractId, eventFeeId: fee.id }
    const n = parseAmount(amount)
    return { kind: 'fixedFee', source: 'typed', amount: n ?? Number.NaN }
  }

  function save() {
    if (type === null) return setError({ message: EVENT_KIND_MESSAGES.pickType[kind], field: 'type' })
    const partyInput = partyInputOf(party)
    if (partyInput === null) return setError({ message: EVENT_KIND_MESSAGES.pickParty, field: 'party' })
    const rec = recording()
    const out =
      eventId === undefined
        ? addPrePostOpEvent(useAppStore, actor, procedureId, { kind, type, ...(code !== undefined ? { code } : {}), occurredOnISO: date, ...(start !== '' ? { startTime: start } : {}), recording: rec, billable, party: partyInput })
        : updateProcedureEvent(useAppStore, actor, eventId, {
            occurredOnISO: date,
            // An emptied start time clears it ('' in the patch).
            startTime: start,
            billable,
            party: partyInput,
            detail: { kind, type, recording: rec, ...(code !== undefined && type === 'accPreOpAssessment' ? { code } : {}) },
          })
    if (!out.ok) {
      const d = (out.details ?? {}) as { field?: string }
      return setError({ message: out.message, ...(d.field !== undefined ? { field: d.field } : {}) })
    }
    onClose()
  }

  const narrow = variant === 'mobile' ? '100%' : 200
  return (
    <div data-shot="add-event-sheet" data-procedure-id={procedureId} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OverlayHeader title={COPY.prePostOpTitle} description={`${patient?.name ?? ''} · ${procedureLabel(procedure, state.masters.rvgGroups, 1)}`} />
      <Segmented
        value={kind}
        options={[
          { value: 'preOp', label: COPY.preOp },
          { value: 'postOp', label: COPY.postOp },
        ]}
        onChange={pickKind}
        // An event keeps its kind: editing one never switches Pre-op and Post-op.
        disabled={eventId !== undefined}
      />
      <div data-shot="event-types" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>{COPY.typeLabel}</FieldLabel>
        {eventTypesOf(kind).map((t) => (
          <OptionRow key={t} selected={type === t} onClick={() => { setType(t); if (t !== 'accPreOpAssessment') setCode(undefined) }} shot="event-type-row" data-type={t}>
            {EVENT_TYPE_LABEL[t]}
          </OptionRow>
        ))}
      </div>
      {type === 'accPreOpAssessment' && (
        <div data-shot="acc-preop-presets" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ACC_PREOP_PRESETS.map((p) => (
            <OptionRow key={p.code} selected={code === p.code} onClick={() => setCode(code === p.code ? undefined : p.code)} shot="acc-preop-preset" data-code={p.code}>
              <span className="mono">{p.code}</span> · {EVENT_TYPE_LABEL.accPreOpAssessment}
            </OptionRow>
          ))}
          {/* OQ-12's open-question caption is the office's (catch-up Phase 43a). */}
          {isOfficeViewer(actor) && <Caption shot="acc-codes-caption">{COPY.accCodesCaption}</Caption>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: narrow }}>
          <TextField label={COPY.dateLabel} type="date" value={date} onChange={setDate} mono invalid={error?.field === 'occurredOnISO'} max={latest} {...(kind === 'postOp' ? { min: listDateISO } : {})} shot="event-date" />
        </div>
        <div style={{ width: variant === 'mobile' ? '100%' : 140 }}>
          <TextField label={COPY.startLabel} type="time" value={start} onChange={setStart} mono invalid={error?.field === 'startTime'} shot="event-start" />
        </div>
      </div>
      <Segmented
        value={records}
        options={[
          { value: 'time', label: COPY.recordTime },
          { value: 'fixedFee', label: COPY.fixedFee },
        ]}
        onChange={setRecords}
      />
      {records === 'time' ? (
        <div data-shot="event-minutes" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>{COPY.minutesLabel}</FieldLabel>
          <NumberStepper value={minutes} onChange={setMinutes} min={5} max={720} step={5} label={COPY.minutesNoun} typeable={{ name: COPY.minutesLabel, accept: (n) => Number.isInteger(n) && n >= 1 && n <= 720 }} />
          <Caption shot="event-pricing-caption">{COPY.timePricingCaption}</Caption>
        </div>
      ) : fee !== undefined ? (
        <div data-shot="event-contract-fee" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FieldLabel>{COPY.contractFeeCaption}</FieldLabel>
          <span className="mono" style={{ fontSize: 15, color: neutral.ink }}>
            {fee.holderCode !== undefined ? `${fee.holderCode} · ` : ''}
            {COPY.amount(fee.fixedPrice)}
          </span>
        </div>
      ) : (
        <div style={{ width: narrow }}>
          <TextField label={COPY.feeAmountLabel} value={amount} onChange={setAmount} mono inputMode="decimal" invalid={error?.field === 'amount'} shot="event-fee-amount" />
        </div>
      )}
      <TickAndParty procedureId={procedureId} sameAsName={ctx.sameAsName} billable={billable} onBillable={setBillable} party={party} onParty={setParty} plain={!isOfficeViewer(actor)} />
      <FormError message={error?.message ?? null} />
      <Caption shot="event-routing-caption">{COPY.routingCaption}</Caption>
      <SheetActions
        primary={
          <Button variant="primary" block onClick={save} shot="add-event-save">
            {eventId === undefined ? COPY.addEvent : COPY.saveChanges}
          </Button>
        }
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add billing event
// ---------------------------------------------------------------------------

export function AddBillingEventSheet(props: SheetProps) {
  const { Overlay } = useSurface()
  return (
    <Overlay open={props.open} onClose={props.onClose}>
      {props.open && <BillingEventForm {...props} />}
    </Overlay>
  )
}

function BillingEventForm({ procedureId, actor, onClose, eventId }: SheetProps) {
  const ctx = useProcedureContext(procedureId)
  const { state, procedure, patient, listDateISO, latest, invoiced } = ctx
  const variant = useSurface().variant
  const existing = eventId !== undefined ? state.schedule.procedureEvents[eventId] : undefined
  const detail = existing?.detail.kind === 'billing' ? (existing.detail as BillingEventDetail) : undefined

  const [direction, setDirection] = useState<'charge' | 'credit'>(detail?.direction ?? 'charge')
  const [description, setDescription] = useState(detail?.description ?? '')
  const [amount, setAmount] = useState(detail !== undefined ? String(detail.amount) : '')
  const [date, setDate] = useState(existing?.occurredOnISO ?? listDateISO)
  const [billable, setBillable] = useState(existing?.billable ?? true)
  const [party, setParty] = useState<PartyDraft>(existing !== undefined ? partyDraftOf(existing.party) : EVENT_RULES.sameAsDefault ? { sameAs: true } : { sameAs: false, party: null, person: null })
  const [error, setError] = useState<FieldError>(null)

  if (procedure === undefined) return null
  // Once the Procedure is invoiced a credit is 39's credit note, not a billing event.
  const creditOffered = !invoiced || direction === 'credit'

  function save() {
    const partyInput = partyInputOf(party)
    if (partyInput === null) return setError({ message: EVENT_KIND_MESSAGES.pickParty, field: 'party' })
    const n = parseAmount(amount) ?? Number.NaN
    const out =
      eventId === undefined
        ? addBillingEvent(useAppStore, actor, procedureId, { direction, description, amount: n, occurredOnISO: date, billable, party: partyInput })
        : updateProcedureEvent(useAppStore, actor, eventId, { occurredOnISO: date, billable, party: partyInput, detail: { kind: 'billing', direction, description: description.trim(), amount: n } })
    if (!out.ok) {
      const d = (out.details ?? {}) as { field?: string }
      return setError({ message: out.message, ...(d.field !== undefined ? { field: d.field } : {}) })
    }
    onClose()
  }

  return (
    <div data-shot="add-billing-event-sheet" data-procedure-id={procedureId} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OverlayHeader title={COPY.billingTitle} description={`${patient?.name ?? ''} · ${procedureLabel(procedure, state.masters.rvgGroups, 1)}`} />
      {creditOffered ? (
        <Segmented
          value={direction}
          options={[
            { value: 'charge', label: COPY.charge },
            { value: 'credit', label: COPY.credit },
          ]}
          onChange={setDirection}
        />
      ) : (
        <Caption shot="billing-credit-after-invoice">{COPY.creditAfterInvoice}</Caption>
      )}
      <TextField label={COPY.descriptionLabel} value={description} onChange={setDescription} maxLength={120} invalid={error?.field === 'description'} shot="billing-event-description" />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: variant === 'mobile' ? '100%' : 180 }}>
          <TextField label={COPY.amountLabel} value={amount} onChange={setAmount} mono inputMode="decimal" invalid={error?.field === 'amount'} shot="billing-event-amount" />
        </div>
        <div style={{ width: variant === 'mobile' ? '100%' : 200 }}>
          <TextField label={COPY.dateLabel} type="date" value={date} onChange={setDate} mono min={listDateISO} max={latest} invalid={error?.field === 'occurredOnISO'} shot="event-date" />
        </div>
      </div>
      {direction === 'credit' && <Caption shot="billing-credit-caption">{COPY.creditCaption}</Caption>}
      <TickAndParty procedureId={procedureId} sameAsName={ctx.sameAsName} billable={billable} onBillable={setBillable} party={party} onParty={setParty} plain={!isOfficeViewer(actor)} />
      <FormError message={error?.message ?? null} />
      <Caption shot="event-routing-caption">{COPY.routingCaption}</Caption>
      <SheetActions
        primary={
          <Button variant="primary" block onClick={save} shot="add-billing-event-save">
            {eventId === undefined ? COPY.addEvent : COPY.saveChanges}
          </Button>
        }
      />
    </div>
  )
}

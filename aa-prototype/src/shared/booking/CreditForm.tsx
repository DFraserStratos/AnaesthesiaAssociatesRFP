/**
 * The credit form (catch-up Phase 39, work items 7, 9, 10 and 11; US-08.6.5,
 * US-08.6.2, US-08.6.4, US-08.6.6, OQ-97): one form for every credit, as 38b
 * has one additional-invoice form. The office's `CreditSheet` (Admin, a side
 * sheet) wraps it, and the anaesthetist's wrappers (a bottom sheet on the
 * phone, a dialog on the web) do, through `frame`.
 *
 * Step 1, Credit: on a Procedure with more than one live invoice (a fee
 * split's per-party invoices), which one to credit; the original's number,
 * billed party and total; who the credit note goes to (the "Same as the
 * original invoice" tick, unticking to 22a's `PartyPicker`, another person
 * allowed, with an invoice email); the reason (required; its label, quick
 * chips, then free text). There is no amount: a credit is always for the
 * whole invoice. The office also sees the money state in plain words
 * (`currentReversalPlan`) and the trail preview; the anaesthetist sees one
 * sentence instead. "A credit note is not a refund." always.
 *
 * Step 2, New invoices: zero or more replacement cards, each 38b's party
 * field (with the same invoice email field for a picked party) and lines
 * editor (the components, not copies), "Add an invoice".
 *
 * The office's modes (never the anaesthetist's; the actor's role decides):
 * - `rebill` opens with one card holding a copy of the original's lines
 *   (`rebillReplacementFor`, US-08.6.6), and every card the office adds offers
 *   "Start from a copy of the original's lines".
 * - `split` (US-08.6.4, OQ-77 part 1) is the same form with `cause: 'split'`:
 *   two blank component cards (never fewer), "Put the rest on this invoice" on
 *   each, and the credited total, the components' sum and Left to allocate
 *   from the pure `splitTotalCheck`; Save N invoices for review waits for
 *   Left to allocate to reach $0.00. The store re-checks.
 *
 * A prepayment invoice (catch-up Phase 41; US-06.4.1, D31) is credited whole
 * and only credited: the form says so beside "A credit note is not a refund."
 * (`prepayment-credit`) and has no step 2; any mode reads as `credit`.
 *
 * One teal Save for review (38b's verb). Every word from
 * `procedureEventCopy.ts`. PWA-safe: no admin import.
 */

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, Copy, Plus, X } from 'lucide-react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { CounterpartyRef, CreditCause, Invoice, ReversalPlan } from '../../domain/types'
import { creditDetailOf, defaultEventDate, eventLines } from '../../domain/billing/procedureEvent'
import { priceFreeFormInvoice } from '../../domain/billing/additionalInvoice'
import { splitTotalCheck } from '../../domain/billing/creditNote'
import { procedureLabel } from '../../domain/billing/procedureStack'
import {
  counterpartyName,
  currentReversalPlan,
  invoiceAddresseeName,
  namedPartyDelivery,
  procedureOwnerSurname,
  rebillReplacementFor,
  replacementEventsOf,
  splitCombinedProcedure,
  submitCredit,
  updateCredit,
  useAppStore,
  type Actor,
  type CreditInput,
  type EventPartyInput,
} from '../../store'
import { Button, Eyebrow, FieldLabel, FormError, IconButton, Notice, OptionChip, TextAction, TextArea, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { formatCurrency } from '../format'
import { CREDIT_LABELS as L, ADDITIONAL_INVOICE_COPY as ADD, EVENT_LABELS, PREPAID_SETTLEMENT_COPY } from '../procedureEventCopy'
import { EMPTY_LINE, EventPartyField, FreeFormLinesEditor, FreeFormTotals, lineDraftOf, lineFromDraft, partyDraftOf, partyInputOf, type LineDraft, type PartyDraft } from './AdditionalInvoiceForm'
import { useBookingStore } from './draft'

export type CreditFormMode = 'credit' | 'rebill' | 'split'

/** The parts a wrapper lays out: the default frame stacks them for an overlay; Admin's side sheet puts the title in its header and the actions in its footer. */
export interface CreditFormFrameParts {
  title: string
  description: string
  body: ReactNode
  actions: ReactNode
  /** A split's running figures (credited, the components' sum, Left to allocate), kept in view beside the actions. */
  summary?: ReactNode
}

export interface CreditFormProps {
  invoiceId: string
  actor: Actor
  /**
   * The Procedure the form was opened from (its Credit note button, its
   * events list); an edit takes the credit's own, else the invoice's first.
   */
  procedureId?: string
  /**
   * The Procedure's live invoices (`creditOptionFor`'s `invoiceIds`): a fee
   * split has one per party. With more than one, step 1 opens with a choice
   * of which to credit, starting at `invoiceId`.
   */
  invoiceIds?: readonly string[]
  /**
   * `credit` opens with no new invoices, `rebill` with one holding a copy of
   * the original's lines, `split` with two blank components that must add up
   * to the credited invoice. `rebill` and `split` are the office's only; the
   * anaesthetist's form reads them as `credit`. Editing takes the credit's
   * own cause. The office (by `actor.role`) also sees the money state, the
   * trail preview, the copy of the original's lines and the split; the
   * anaesthetist sees "Your payment for this invoice is reversed." in their
   * place and its own chips.
   */
  mode?: CreditFormMode
  /** A credit event awaiting review or declined, to edit (`updateCredit`). */
  editing?: string
  /** After a submit or save, with the credit event's id. */
  onDone?: (creditEventId: string) => void
  onClose: () => void
  /** Lays the parts out; the default suits `useSurface().Overlay`. */
  frame?: (parts: CreditFormFrameParts) => ReactNode
}

interface CardDraft {
  key: number
  eventId?: string
  occurredOnISO: string
  party: PartyDraft
  /** A picked party's invoice email (US-08.6.5), as the credit's own party has. */
  invoiceEmail: string
  lines: LineDraft[]
}

interface FormErrorState {
  message: string
  field?: string
  replacementIndex?: number
  lineIndex?: number
}

/** The default frame: an overlay's title, the body, then the actions (a bottom sheet on the phone, a dialog on the web). */
function overlayFrame(parts: CreditFormFrameParts): ReactNode {
  return <OverlayFrame {...parts} />
}

/**
 * On the web the dialog scrolls; its footer (a split's figures, then Save for
 * review) stays pinned to the dialog's foot on the surface, a hairline over
 * it, so the one action never scrolls away (Admin's side sheet pins its footer
 * the same way). On the phone the bottom sheet keeps it at the end.
 */
function OverlayFrame({ title, description, body, actions, summary }: CreditFormFrameParts) {
  const web = useSurface().variant !== 'mobile'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OverlayHeader title={title} description={description} />
      {body}
      {web ? (
        <div
          data-shot="credit-form-footer"
          // The web Dialog pads its scrolling panel 24px at the sides and 28px at the foot: the footer reaches its edges.
          style={{ position: 'sticky', bottom: -28, zIndex: 1, margin: '0 -24px -28px', padding: '14px 24px 20px', background: neutral.surface, borderTop: `1px solid ${neutral.line}`, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {summary}
          <SheetActions primary={actions} />
        </div>
      ) : (
        <>
          {summary}
          <SheetActions primary={actions} />
        </>
      )}
    </div>
  )
}

/** The minimum components a split starts with and keeps (US-08.6.4: "at least two"). */
const SPLIT_MIN = 2

/**
 * "Put the rest on this invoice": the card's lines with `left` (ex GST, may be
 * negative) added, or null when it cannot take it. A card that prices takes it
 * on its last quantity-1 line (or, when positive, a new line); a card of one
 * line that does not price yet becomes that line at the rest. Every line stays
 * above zero, as `priceFreeFormInvoice` requires.
 */
export function putRestOn(lines: readonly LineDraft[], left: number): LineDraft[] | null {
  const cents = Math.round(left * 100)
  if (cents === 0) return null
  const typed = lines.map(lineFromDraft)
  const priced = priceFreeFormInvoice(typed)
  if (priced.kind !== 'priced') {
    if (lines.length !== 1 || cents <= 0) return null
    return [{ description: lines[0]!.description.trim() !== '' ? lines[0]!.description : L.restLine, quantity: '1', amount: (cents / 100).toFixed(2) }]
  }
  for (let i = typed.length - 1; i >= 0; i--) {
    if (typed[i]!.quantity !== 1) continue
    const next = Math.round(typed[i]!.unitAmount * 100) + cents
    if (next > 0) return lines.map((l, j) => (j === i ? { ...l, amount: (next / 100).toFixed(2) } : l))
    break
  }
  return cents > 0 ? [...lines, { description: L.restLine, quantity: '1', amount: (cents / 100).toFixed(2) }] : null
}

/** A party picked from the list (not "same as", not a typed person), or null. */
function pickedPartyOf(d: PartyDraft): CounterpartyRef | null {
  return !d.sameAs && d.person === null ? d.party : null
}

/** The party as the store takes it, with a picked party's typed invoice email folded in. */
function withEmail(p: EventPartyInput, email: string): EventPartyInput {
  const typed = email.trim()
  return p.sameAs || typed === '' ? p : { ...p, invoiceEmail: typed }
}

export function CreditForm({ invoiceId, actor, procedureId: procedureIdProp, invoiceIds, mode: modeProp = 'credit', editing, onDone, onClose, frame = overlayFrame }: CreditFormProps) {
  // The form reads a dozen store selectors over the whole state (the reversal plan, the copy, parties, delivery); it is open briefly.
  const state = useBookingStore((s) => s)
  const surface = useSurface().variant
  const office = actor.role === 'office'
  // Which of the Procedure's live invoices is credited (a fee split's per-party invoices each credit on their own).
  const [targetId, setTargetId] = useState(invoiceId)
  const original = state.billing.invoices[targetId]
  const existing = editing !== undefined ? state.schedule.procedureEvents[editing] : undefined
  const existingCredit = creditDetailOf(existing)
  // The rebill's copy and the split are the office's only (US-08.6.6, US-08.6.4); an edit keeps the credit's own cause.
  // A prepayment invoice is credited whole, never rebilled from a copy or split (catch-up Phase 41, D31): anything still owed is an additional invoice.
  const prepayment = original?.kind === 'prePayment'
  const mode: CreditFormMode = existingCredit !== undefined ? (existingCredit.cause === 'split' ? 'split' : 'credit') : office && !prepayment ? modeProp : 'credit'
  const split = mode === 'split'
  const cause: CreditCause = split ? 'split' : 'correction'
  const procedureId = existing?.procedureId ?? procedureIdProp ?? original?.procedureIds?.[0] ?? ''
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const chargeDate = defaultEventDate(list?.dateISO ?? state.clock.todayISO, state.clock.todayISO)

  // The copy of the original's lines (US-08.6.6, `rebillReplacementFor`): the lines only, folded so every line is positive and the total is exact.
  const copyOf = (id: string = targetId): LineDraft[] => rebillReplacementFor(state, id)?.lines.map(lineDraftOf) ?? [{ ...EMPTY_LINE }]

  const nextKey = useRef(0)
  const newCard = (party: PartyDraft, lines: LineDraft[] = [{ ...EMPTY_LINE }]): CardDraft => ({ key: nextKey.current++, occurredOnISO: chargeDate, party, invoiceEmail: '', lines })

  const [party, setParty] = useState<PartyDraft>(() => (existing !== undefined ? partyDraftOf(existing.party) : { sameAs: true }))
  const [invoiceEmail, setInvoiceEmail] = useState(() => (existing !== undefined && !existing.party.sameAs ? (existing.party.invoiceEmail ?? '') : ''))
  const [reason, setReason] = useState(existingCredit?.reason ?? (split ? L.splitReason : ''))
  const [cards, setCards] = useState<CardDraft[]>(() => {
    if (editing !== undefined) {
      return replacementEventsOf(state, editing).map((r) => ({
        key: nextKey.current++,
        eventId: r.id,
        occurredOnISO: r.occurredOnISO,
        party: partyDraftOf(r.party),
        invoiceEmail: r.party.sameAs ? '' : (r.party.invoiceEmail ?? ''),
        lines: eventLines(r).map(lineDraftOf),
      }))
    }
    if (mode === 'rebill') return [newCard({ sameAs: true }, copyOf())]
    if (split) return Array.from({ length: SPLIT_MIN }, () => newCard({ sameAs: true }))
    return []
  })
  const [error, setError] = useState<FormErrorState | null>(null)

  const plan = useMemo(() => (office ? currentReversalPlan(state, targetId) : undefined), [office, state, targetId])

  if (original === undefined || procedure === undefined || booking === undefined) return null

  const originalParty = invoiceAddresseeName(state, original)
  const doctor = procedureOwnerSurname(state, procedureId) ?? 'The anaesthetist'
  const chips = office ? L.officeReasons : L.anaesthetistReasons
  const phone = surface === 'mobile'
  const pickedParty = pickedPartyOf(party)
  // The split's running check: the pure rule the store re-checks, never re-summed here.
  const check = split ? splitTotalCheck(original, cards.map((c) => c.lines.map(lineFromDraft))) : undefined
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  // Which invoice to credit: a new credit on a Procedure with more than one live invoice; never on an edit.
  const choices = editing === undefined ? (invoiceIds ?? []).map((id) => state.billing.invoices[id]).filter((i): i is Invoice => i !== undefined) : []

  const partyName = (d: PartyDraft): string => {
    if (d.sameAs) return originalParty
    if (d.person !== null) return d.person.name.trim() !== '' ? d.person.name : ADD.otherParty
    return d.party !== null ? counterpartyName(state, d.party, booking.id) : ADD.otherParty
  }

  function setCard(i: number, patch: Partial<CardDraft>) {
    setCards((all) => all.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  }

  function chooseInvoice(id: string) {
    if (id === targetId) return
    setTargetId(id)
    setError(null)
    // A rebill's first card holds the chosen invoice's lines.
    if (mode === 'rebill') setCards([newCard({ sameAs: true }, copyOf(id))])
  }

  function submit() {
    const partyInput = partyInputOf(party)
    if (partyInput === null) return setError({ message: ADD.pickParty, field: 'party' })
    const replacements: CreditInput['replacements'] = []
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]!
      const p = partyInputOf(c.party)
      if (p === null) return setError({ message: ADD.pickParty, replacementIndex: i, field: 'party' })
      replacements.push({
        ...(c.eventId !== undefined ? { eventId: c.eventId } : {}),
        occurredOnISO: c.occurredOnISO,
        party: pickedPartyOf(c.party) !== null ? withEmail(p, c.invoiceEmail) : p,
        lines: c.lines.map(lineFromDraft),
      })
    }
    const input: CreditInput = {
      invoiceId: targetId,
      procedureId,
      party: partyInput,
      ...(invoiceEmail.trim() !== '' ? { invoiceEmail: invoiceEmail.trim() } : {}),
      reason,
      cause,
      replacements,
    }
    const out =
      editing !== undefined
        ? updateCredit(useAppStore, actor, editing, input)
        : split
          ? splitCombinedProcedure(useAppStore, actor, { ...input, procedureId })
          : submitCredit(useAppStore, actor, input)
    if (!out.ok) {
      const d = (out.details ?? {}) as { field?: string; replacementIndex?: number; lineIndex?: number }
      return setError({ message: out.message, ...d })
    }
    onDone?.(out.value.creditEventId)
    onClose()
  }

  const cardError = (i: number) => (error?.replacementIndex === i ? error : undefined)

  const body = (
    <div data-shot="credit-form" data-invoice-id={targetId} data-variant={office ? 'office' : 'anaesthetist'} data-mode={mode} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* The original, as it was issued: never edited. */}
      <div
        data-shot="credit-original"
        style={{ display: 'grid', gridTemplateColumns: phone ? '1fr auto' : 'auto 1fr auto', gap: phone ? 4 : 16, alignItems: 'baseline', padding: '12px 14px', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Eyebrow as="span">{L.originalInvoice}</Eyebrow>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: neutral.ink }}>{original.invoiceNumber}</span>
        </div>
        {!phone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Eyebrow as="span">{L.billed}</Eyebrow>
            <span style={{ fontSize: 14, color: neutral.ink, overflowWrap: 'anywhere' }}>{originalParty}</span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <Eyebrow as="span">{office ? L.total : `${L.total} ${EVENT_LABELS.exGst}`}</Eyebrow>
          {/* The anaesthetist sees the total ex GST (38b's `EVENT_RULES.anaesthetistSees`); the office the invoice total. */}
          <span className="mono" data-shot="credit-original-total" style={{ fontSize: 14, fontWeight: 700, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(office ? original.total : original.subtotal)}</span>
        </div>
        {phone && <span style={{ gridColumn: '1 / -1', fontSize: 13.5, color: neutral.slate }}>{originalParty}</span>}
      </div>

      <StepHeading n={1}>{L.stepCredit}</StepHeading>
      {choices.length > 1 && (
        <div data-shot="credit-invoice-choice" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>{L.whichInvoice}</FieldLabel>
          <div role="radiogroup" aria-label={L.whichInvoice} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {choices.map((i) => (
              <OptionChip key={i.id} role="radio" pressed={i.id === targetId} onClick={() => chooseInvoice(i.id)} size={phone ? 'lg' : 'md'} shot="credit-invoice-option" data-invoice-id={i.id}>
                <span className="mono">{i.invoiceNumber}</span>
                {` · ${invoiceAddresseeName(state, i)}`}
              </OptionChip>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <EventPartyField procedureId={procedureId} sameAsName={originalParty} value={party} onChange={setParty} label={L.creditTo} shot="credit-party" />
        {pickedParty !== null && (
          <InvoiceEmailField procedureId={procedureId} party={pickedParty} value={invoiceEmail} onChange={setInvoiceEmail} invalid={error?.field === 'party' && error.replacementIndex === undefined} shot="credit-invoice-email" />
        )}
      </div>

      {/* The reason: its label, the quick chips that fill it, then the text. */}
      <div data-shot="credit-reason" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FieldLabel>{L.reason}</FieldLabel>
        <div role="group" aria-label={L.reasonChipsLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((c) => (
            <OptionChip key={c} pressed={reason.trim() === c} onClick={() => setReason(c)} size={phone ? 'lg' : 'md'} shot="credit-reason-chip">
              {c}
            </OptionChip>
          ))}
        </div>
        <TextArea ariaLabel={L.reason} value={reason} onChange={setReason} rows={2} placeholder={L.reasonPlaceholder} shot="credit-reason-text" />
      </div>

      {office && plan !== undefined ? (
        <CreditMoneyState plan={plan} payer={originalParty} doctor={doctor} />
      ) : !office ? (
        <span data-shot="credit-payment-reversed" style={{ fontSize: 13.5, lineHeight: '20px', color: neutral.ink }}>{L.yourPaymentReversed}</span>
      ) : null}
      {prepayment ? (
        // The whole prepayment invoice, credit only: no new invoice cards (catch-up Phase 41; US-06.4.1, D31).
        <Notice tone="neutral" shot="prepayment-credit">
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{PREPAID_SETTLEMENT_COPY.creditWhole}</span>
            <span data-shot="credit-not-refund">{L.notARefund}</span>
          </span>
        </Notice>
      ) : (
        <Notice tone="neutral" shot="credit-not-refund">{L.notARefund}</Notice>
      )}

      {!prepayment && <StepHeading n={2}>{L.newInvoices}</StepHeading>}
      {split && (
        <span data-shot="split-must-add-up" style={{ fontSize: 13.5, lineHeight: '20px', color: neutral.ink }}>
          {L.splitDescription} {L.splitMustAddUp} {L.splitBeforeGst}
        </span>
      )}
      {!prepayment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.length === 0 && <span style={{ fontSize: 13, color: neutral.slate }}>{L.newInvoicesNone}</span>}
          {cards.map((c, i) => {
            const priced = priceFreeFormInvoice(c.lines.map(lineFromDraft))
            const ce = cardError(i)
            const rest = check !== undefined ? putRestOn(c.lines, check.leftToAllocate) : null
            const removable = !split || cards.length > SPLIT_MIN
            const cardParty = pickedPartyOf(c.party)
            return (
              <section
                key={c.key}
                data-shot={split ? 'split-component' : 'credit-replacement'}
                data-index={i}
                aria-label={L.newInvoiceTitle(i + 1)}
                style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, background: neutral.surface, border: `1px solid ${ce !== undefined ? neutral.lineStrong : neutral.line}`, borderRadius: radius.card }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{L.newInvoiceTitle(i + 1)}</span>
                  {removable && (
                    <IconButton size={phone ? 44 : 32} label={`${L.removeInvoice} ${i + 1}`} onClick={() => setCards((all) => all.filter((_, j) => j !== i))} shot="credit-replacement-remove">
                      <X size={16} aria-hidden />
                    </IconButton>
                  )}
                </div>
                <EventPartyField procedureId={procedureId} sameAsName={originalParty} value={c.party} onChange={(p) => setCard(i, { party: p })} shot="credit-replacement-party" />
                {/* A picked party takes an invoice email here, as the credit's own party does. */}
                {cardParty !== null && (
                  <InvoiceEmailField procedureId={procedureId} party={cardParty} value={c.invoiceEmail} onChange={(email) => setCard(i, { invoiceEmail: email })} invalid={ce?.field === 'party'} shot="credit-replacement-invoice-email" />
                )}
                {/* The office's copy of the original's lines (US-08.6.6), on any card a credit or rebill adds; never on a split's components (typed freely) or the anaesthetist's. */}
                {office && !split && (
                  <div>
                    <TextAction size="sm" onClick={() => setCard(i, { lines: copyOf() })} shot="credit-copy-lines">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={14} aria-hidden /> {L.copyLines}
                      </span>
                    </TextAction>
                  </div>
                )}
                <FreeFormLinesEditor lines={c.lines} onChange={(lines) => setCard(i, { lines })} {...(ce !== undefined ? { invalid: ce } : {})} />
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: split ? 'space-between' : 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                  {split && (
                    <TextAction size="sm" onClick={() => rest !== null && setCard(i, { lines: rest })} disabled={rest === null} shot="split-put-rest">
                      {L.putTheRest}
                    </TextAction>
                  )}
                  <div style={{ minWidth: 220, marginLeft: 'auto' }}>
                    <FreeFormTotals shot="credit-replacement-totals" subtotal={priced.kind === 'priced' ? priced.subtotal : 0} gst={priced.kind === 'priced' ? priced.gst : 0} total={priced.kind === 'priced' ? priced.total : 0} />
                  </div>
                </div>
                {ce !== undefined && <FormError message={ce.message} />}
              </section>
            )
          })}
          <div>
            <Button variant="secondary" size={phone ? 'touch' : 'compact'} onClick={() => setCards((all) => [...all, newCard({ sameAs: true })])} shot="credit-add-invoice">
              <Plus size={14} aria-hidden /> {L.addInvoice}
            </Button>
          </div>
        </div>
      )}

      {office && (
        <CreditTrail
          originalNumber={original.invoiceNumber}
          total={original.total}
          doctor={doctor}
          newInvoices={cards.map((c) => {
            const priced = priceFreeFormInvoice(c.lines.map(lineFromDraft))
            return { party: partyName(c.party), total: priced.kind === 'priced' ? priced.total : 0 }
          })}
        />
      )}

      <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>{office ? L.officeSubmitNote : L.anaesthetistSubmitNote}</span>
      {error !== null && error.replacementIndex === undefined && <FormError message={error.message} shot="credit-error" />}
    </div>
  )

  const actions = (
    <Button variant="primary" block onClick={submit} disabled={check !== undefined && !check.ok} shot="credit-submit">
      {split && editing === undefined ? L.submitSplit(cards.length) : L.submit}
    </Button>
  )

  // 38b's pattern: "Credit note · David Chen · Hip hemiarthroplasty", the invoice it credits under it; a split names its invoice, its Contract under it.
  const patientName = state.masters.patients[booking.patientId]?.name ?? ''
  const title = split
    ? L.splitTitle(original.invoiceNumber)
    : L.sheetTitle(editing !== undefined ? 'edit' : mode === 'rebill' ? 'rebill' : 'credit', patientName, procedureLabel(procedure, state.masters.rvgGroups, 1))
  const description = split ? (contract !== undefined ? `${contract.name} · ${L.splitDescription}` : L.splitDescription) : L.sheetDescription(original.invoiceNumber)
  return (
    <>
      {frame({
        title,
        description,
        body,
        actions,
        ...(check !== undefined ? { summary: <SplitAllocation credited={original} sum={check.sum} left={check.leftToAllocate} gstRounding={check.gstRounding} /> } : {}),
      })}
    </>
  )
}

/**
 * A picked party's invoice email (US-08.6.5), the one field for the credit's
 * own party and each new invoice's: blank sends it where the party's own
 * address says; the hint says where, or that there is none.
 */
function InvoiceEmailField({ procedureId, party, value, onChange, invalid, shot }: { procedureId: string; party: CounterpartyRef; value: string; onChange: (email: string) => void; invalid: boolean; shot: string }) {
  const state = useBookingStore((s) => s)
  const delivery = namedPartyDelivery(state, procedureId, { sameAs: false, party })
  const hint = delivery === undefined ? undefined : delivery.method === 'email' ? L.invoiceEmailHintTo(delivery.to) : delivery.method === 'post' ? L.invoiceEmailHintPost : L.invoiceEmailHintNone
  return <TextField label={L.invoiceEmail} type="email" value={value} onChange={onChange} placeholder="accounts@example.com" hint={hint} invalid={invalid} shot={shot} />
}

/**
 * The split's running figures (US-08.6.4 "Same total", OQ-77 part 1): what is
 * credited, what the components come to and what is Left to allocate, all
 * before GST (the body says so), in mono tabular figures, each under the same
 * eyebrow label. Left to allocate is the one figure that carries weight; at
 * $0.00 it settles on the success tint with a tick, over the credit it reads
 * in the warning tone (never red: a split is not an error), and any GST
 * rounding across the components is said and accepted. Compact: one row, so
 * the footer it sits in stays short.
 */
export function SplitAllocation({ credited, sum, left, gstRounding }: { credited: Pick<Invoice, 'subtotal'>; sum: number; left: number; gstRounding: number }) {
  const done = Math.round(left * 100) === 0
  const over = left < 0
  const tone = done ? { bg: semantic.success.tint, fg: semantic.success.onTint } : over ? { bg: semantic.warning.tint, fg: semantic.warning.onTint } : { bg: neutral.bg, fg: neutral.ink }
  const figure = (label: string, value: number, shot?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, padding: '6px 0' }}>
      <Eyebrow as="span" tone="slate">{label}</Eyebrow>
      <span className="mono" data-shot={shot} style={{ fontSize: 14, lineHeight: '20px', color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(value)}</span>
    </div>
  )
  return (
    <div data-shot="split-allocation" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 20, flexWrap: 'wrap' }}>
        {figure(L.credited, credited.subtotal, 'split-credited')}
        {figure(L.newInvoices, sum, 'split-sum')}
        <div
          data-shot="split-left-to-allocate"
          data-left={left.toFixed(2)}
          data-done={done ? 'true' : 'false'}
          role="status"
          aria-live="polite"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: radius.ctl, background: tone.bg, color: tone.fg, transition: 'background 160ms ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Eyebrow as="span" style={{ color: 'inherit' }}>{L.leftToAllocate}</Eyebrow>
            <span className="mono" style={{ fontSize: 15, lineHeight: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{over ? formatCurrency(left, { sign: 'always' }) : formatCurrency(left)}</span>
          </div>
          {done && <CircleCheck size={18} aria-hidden />}
        </div>
      </div>
      {done && Math.round(gstRounding * 100) !== 0 && (
        <span data-shot="split-gst-rounding" style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>{L.gstRounding(formatCurrency(Math.abs(gstRounding)))}</span>
      )}
    </div>
  )
}

/** A step's heading: the step number in a quiet mono disc, then its name (the form is a true sequence: credit, then new invoices). */
function StepHeading({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, lineHeight: '20px', fontWeight: 700, color: neutral.ink, paddingTop: n > 1 ? 4 : 0, borderTop: n > 1 ? `1px solid ${neutral.line}` : 'none' }}>
      <span
        aria-hidden
        className="mono"
        style={{ width: 22, height: 22, borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: n > 1 ? 16 : 0 }}
      >
        {n}
      </span>
      <span style={{ marginTop: n > 1 ? 16 : 0 }}>{children}</span>
    </h3>
  )
}

/**
 * The money state, the office's variant (OQ-77 part 2, OQ-42), from the
 * reversal a credit would make now, in plain words: what the payer paid is
 * held for them; the anaesthetist's payment is reversed by a negative
 * invoice, offset against the unpaid payable or netted in their next payment
 * run.
 */
export function creditMoneySentences(plan: ReversalPlan, payer: string, doctor: string): string[] {
  const money = formatCurrency
  const out: string[] = []
  out.push(plan.heldForPayer > 0 ? L.heldForPayer(money(plan.heldForPayer), payer) : L.unpaid)
  if (plan.recoveryDue <= 0) out.push(L.payableOffset(doctor, money(plan.negativeInvoiceTotal)))
  else if (plan.offsetAgainstPayable <= 0) out.push(L.payableNets(doctor, money(plan.recoveryDue), money(plan.negativeInvoiceTotal)))
  else out.push(L.payableBoth(doctor, money(plan.recoveryDue), money(plan.negativeInvoiceTotal), money(plan.offsetAgainstPayable)))
  return out
}

/** The money state under its eyebrow: the credit form's and the review sheet's one block. */
export function CreditMoneyState({ plan, payer, doctor }: { plan: ReversalPlan; payer: string; doctor: string }) {
  return (
    <div data-shot="credit-money-state" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Eyebrow as="span" tone="slate">{L.moneyState}</Eyebrow>
      {creditMoneySentences(plan, payer, doctor).map((s) => (
        <span key={s} style={{ fontSize: 13.5, lineHeight: '20px', color: neutral.ink }}>{s}</span>
      ))}
    </div>
  )
}

/**
 * The trail preview (US-08.6.2 "Both sides move"): debit, credit, contra, new
 * debit, as the ledger will read on issue. Numbers are given on issue, so the
 * new records are named, not numbered.
 */
function CreditTrail({ originalNumber, total, doctor, newInvoices }: { originalNumber: string; total: number; doctor: string; newInvoices: readonly { party: string; total: number }[] }) {
  const rows: { kind: string; what: ReactNode; amount: number }[] = [
    { kind: L.trailDebit, what: <span className="mono">{originalNumber}</span>, amount: total },
    { kind: L.trailCredit, what: L.trailCreditNote, amount: total },
    { kind: L.trailContra, what: L.trailNegative(doctor), amount: total },
    ...newInvoices.map((n) => ({ kind: L.trailDebit, what: L.trailNewInvoice(n.party), amount: n.total })),
  ]
  return (
    <div data-shot="credit-trail" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Eyebrow as="span" tone="slate">{L.trailTitle}</Eyebrow>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <li
            key={i}
            data-trail-kind={r.kind}
            style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 12, alignItems: 'baseline', padding: '8px 12px', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>{r.kind}</span>
            <span style={{ color: neutral.ink, minWidth: 0, overflowWrap: 'anywhere' }}>{r.what}</span>
            <span className="mono" style={{ color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(r.amount)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

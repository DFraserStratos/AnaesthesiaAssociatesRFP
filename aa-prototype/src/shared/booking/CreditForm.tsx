/**
 * The credit form (catch-up Phase 39, work items 7 and 11; US-08.6.5,
 * US-08.6.2, OQ-97): one form for every credit, as 38b has one
 * additional-invoice form. The office's `CreditSheet` (Admin, a side sheet)
 * wraps it, and the anaesthetist's wrappers (a bottom sheet on the phone, a
 * dialog on the web) will, through `frame`.
 *
 * Step 1, Credit: the original's number, billed party and total; who the
 * credit note goes to (the "Same as the original invoice" tick, unticking to
 * 22a's `PartyPicker`, another person allowed, with an invoice email); the
 * reason (required; quick chips plus free text). There is no amount: a credit
 * is always for the whole invoice. The office also sees the money state in
 * plain words (`currentReversalPlan`) and the trail preview; the anaesthetist
 * sees one sentence instead. "A credit note is not a refund." always.
 *
 * Step 2, New invoices: zero or more replacement cards, each 38b's party
 * field and lines editor (the components, not copies), "Add an invoice".
 *
 * One teal Submit for review. Every word from `procedureEventCopy.ts`. PWA-safe:
 * no admin import.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import type { CreditCause, ReversalPlan } from '../../domain/types'
import { creditDetailOf, defaultEventDate, eventLines } from '../../domain/billing/procedureEvent'
import { priceFreeFormInvoice } from '../../domain/billing/additionalInvoice'
import {
  counterpartyName,
  currentReversalPlan,
  invoiceAddresseeName,
  namedPartyDelivery,
  procedureOwner,
  replacementEventsOf,
  submitCredit,
  updateCredit,
  useAppStore,
  type Actor,
  type CreditInput,
} from '../../store'
import { Button, Eyebrow, FormError, IconButton, Notice, OptionChip, TextArea, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { drSurname, formatCurrency } from '../format'
import { CREDIT_LABELS as L, ADDITIONAL_INVOICE_COPY as ADD } from '../procedureEventCopy'
import { EMPTY_LINE, EventPartyField, FreeFormLinesEditor, FreeFormTotals, lineDraftOf, lineFromDraft, partyDraftOf, partyInputOf, type LineDraft, type PartyDraft } from './AdditionalInvoiceForm'
import { useBookingStore } from './draft'

export type CreditFormMode = 'credit' | 'rebill'

/** The parts a wrapper lays out: the default frame stacks them for an overlay; Admin's side sheet puts the title in its header and the actions in its footer. */
export interface CreditFormFrameParts {
  title: string
  description: string
  body: ReactNode
  actions: ReactNode
}

export interface CreditFormProps {
  invoiceId: string
  actor: Actor
  /** `credit` opens with no new invoices, `rebill` with one addressed to the original's party. Ignored when editing. */
  mode?: CreditFormMode
  /** A credit event awaiting review or declined, to edit (`updateCredit`). */
  editing?: string
  /**
   * `office` adds the money state and the trail preview; `anaesthetist`
   * shows "Your payment for this invoice is reversed." in their place and its
   * own chips. Defaults to the actor's role.
   */
  variant?: 'office' | 'anaesthetist'
  /**
   * Seam for session 2 (work item 10): `split` adds the "Left to allocate"
   * figure and at least two cards. Only `correction` is built.
   */
  cause?: Extract<CreditCause, 'correction'>
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
  lines: LineDraft[]
}

interface FormErrorState {
  message: string
  field?: string
  replacementIndex?: number
  lineIndex?: number
}

/** The default frame: an overlay's title, the body, then the actions (a bottom sheet on the phone, a dialog on the web). */
function overlayFrame({ title, description, body, actions }: CreditFormFrameParts): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OverlayHeader title={title} description={description} />
      {body}
      <SheetActions primary={actions} />
    </div>
  )
}

export function CreditForm({ invoiceId, actor, mode = 'credit', editing, variant: variantProp, onDone, onClose, frame = overlayFrame }: CreditFormProps) {
  const state = useBookingStore((s) => s)
  const surface = useSurface().variant
  const variant = variantProp ?? (actor.role === 'office' ? 'office' : 'anaesthetist')
  const original = state.billing.invoices[invoiceId]
  const existing = editing !== undefined ? state.schedule.procedureEvents[editing] : undefined
  const existingCredit = creditDetailOf(existing)
  const procedureId = existing?.procedureId ?? original?.procedureIds?.[0] ?? ''
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const chargeDate = defaultEventDate(list?.dateISO ?? state.clock.todayISO, state.clock.todayISO)

  const keyRef = useState(() => ({ next: 0 }))[0]
  const newCard = (party: PartyDraft): CardDraft => ({ key: keyRef.next++, occurredOnISO: chargeDate, party, lines: [{ ...EMPTY_LINE }] })

  const [party, setParty] = useState<PartyDraft>(() => (existing !== undefined ? partyDraftOf(existing.party) : { sameAs: true }))
  const [invoiceEmail, setInvoiceEmail] = useState(() => (existing !== undefined && !existing.party.sameAs ? (existing.party.invoiceEmail ?? '') : ''))
  const [reason, setReason] = useState(existingCredit?.reason ?? '')
  const [cards, setCards] = useState<CardDraft[]>(() => {
    if (editing !== undefined) {
      return replacementEventsOf(state, editing).map((r) => ({ key: keyRef.next++, eventId: r.id, occurredOnISO: r.occurredOnISO, party: partyDraftOf(r.party), lines: eventLines(r).map(lineDraftOf) }))
    }
    return mode === 'rebill' ? [newCard({ sameAs: true })] : []
  })
  const [error, setError] = useState<FormErrorState | null>(null)

  const plan = useMemo(() => (variant === 'office' ? currentReversalPlan(state, invoiceId) : undefined), [variant, state, invoiceId])

  if (original === undefined || procedure === undefined || booking === undefined) return null

  const originalParty = invoiceAddresseeName(state, original)
  const ownerId = procedureOwner(state, procedureId)
  const doctor = ownerId !== undefined && state.masters.anaesthetists[ownerId] !== undefined ? drSurname(state.masters.anaesthetists[ownerId]!.name) : 'The anaesthetist'
  const chips = variant === 'office' ? L.officeReasons : L.anaesthetistReasons
  const phone = surface === 'mobile'
  const pickedParty = !party.sameAs && party.person === null ? party.party : null
  const delivery = pickedParty !== null ? namedPartyDelivery(state, procedureId, { sameAs: false, party: pickedParty }) : undefined
  const emailHint = delivery === undefined ? undefined : delivery.method === 'email' ? L.invoiceEmailHintTo(delivery.to) : delivery.method === 'post' ? L.invoiceEmailHintPost : L.invoiceEmailHintNone

  const partyName = (d: PartyDraft): string => {
    if (d.sameAs) return originalParty
    if (d.person !== null) return d.person.name.trim() !== '' ? d.person.name : ADD.otherParty
    return d.party !== null ? counterpartyName(state, d.party, booking.id) : ADD.otherParty
  }

  function setCard(i: number, patch: Partial<CardDraft>) {
    setCards((all) => all.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  }

  function submit() {
    const partyInput = partyInputOf(party)
    if (partyInput === null) return setError({ message: ADD.pickParty, field: 'party' })
    const replacements: CreditInput['replacements'] = []
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]!
      const p = partyInputOf(c.party)
      if (p === null) return setError({ message: ADD.pickParty, replacementIndex: i, field: 'party' })
      replacements.push({ ...(c.eventId !== undefined ? { eventId: c.eventId } : {}), occurredOnISO: c.occurredOnISO, party: p, lines: c.lines.map(lineFromDraft) })
    }
    const input: CreditInput = {
      invoiceId,
      procedureId,
      party: partyInput,
      ...(invoiceEmail.trim() !== '' ? { invoiceEmail: invoiceEmail.trim() } : {}),
      reason,
      cause: 'correction',
      replacements,
    }
    const out = editing !== undefined ? updateCredit(useAppStore, actor, editing, input) : submitCredit(useAppStore, actor, input)
    if (!out.ok) {
      const d = (out.details ?? {}) as { field?: string; replacementIndex?: number; lineIndex?: number }
      return setError({ message: out.message, ...d })
    }
    onDone?.(out.value.creditEventId)
    onClose()
  }

  const cardError = (i: number) => (error?.replacementIndex === i ? error : undefined)

  const body = (
    <div data-shot="credit-form" data-invoice-id={invoiceId} data-variant={variant} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <Eyebrow as="span">{L.total}</Eyebrow>
          <span className="mono" data-shot="credit-original-total" style={{ fontSize: 14, fontWeight: 700, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(original.total)}</span>
        </div>
        {phone && <span style={{ gridColumn: '1 / -1', fontSize: 13.5, color: neutral.slate }}>{originalParty}</span>}
      </div>

      <StepHeading n={1}>{L.stepCredit}</StepHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <EventPartyField procedureId={procedureId} sameAsName={originalParty} value={party} onChange={setParty} label={L.creditTo} shot="credit-party" />
        {pickedParty !== null && (
          <TextField label={L.invoiceEmail} type="email" value={invoiceEmail} onChange={setInvoiceEmail} placeholder="accounts@example.com" hint={emailHint} invalid={error?.field === 'party' && error.replacementIndex === undefined} shot="credit-invoice-email" />
        )}
      </div>

      <div data-shot="credit-reason" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div role="group" aria-label={L.reasonChipsLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((c) => (
            <OptionChip key={c} pressed={reason.trim() === c} onClick={() => setReason(c)} size={phone ? 'lg' : 'md'} shot="credit-reason-chip">
              {c}
            </OptionChip>
          ))}
        </div>
        <TextArea label={L.reason} value={reason} onChange={setReason} rows={2} placeholder={L.reasonPlaceholder} shot="credit-reason-text" />
      </div>

      {variant === 'office' && plan !== undefined ? (
        <CreditMoneyState plan={plan} payer={originalParty} doctor={doctor} />
      ) : variant === 'anaesthetist' ? (
        <span style={{ fontSize: 13.5, lineHeight: '20px', color: neutral.ink }}>{L.yourPaymentReversed}</span>
      ) : null}
      <Notice tone="neutral" shot="credit-not-refund">{L.notARefund}</Notice>

      <StepHeading n={2}>{L.stepNewInvoices}</StepHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cards.length === 0 && <span style={{ fontSize: 13, color: neutral.slate }}>{L.newInvoicesNone}</span>}
        {cards.map((c, i) => {
          const priced = priceFreeFormInvoice(c.lines.map(lineFromDraft))
          const ce = cardError(i)
          return (
            <section
              key={c.key}
              data-shot="credit-replacement"
              data-index={i}
              aria-label={L.newInvoiceTitle(i + 1)}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, background: neutral.surface, border: `1px solid ${ce !== undefined ? neutral.lineStrong : neutral.line}`, borderRadius: radius.card }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{L.newInvoiceTitle(i + 1)}</span>
                <IconButton size={phone ? 44 : 32} label={`${L.removeInvoice} ${i + 1}`} onClick={() => setCards((all) => all.filter((_, j) => j !== i))} shot="credit-replacement-remove">
                  <X size={16} aria-hidden />
                </IconButton>
              </div>
              <EventPartyField procedureId={procedureId} sameAsName={originalParty} value={c.party} onChange={(p) => setCard(i, { party: p })} shot="credit-replacement-party" />
              <FreeFormLinesEditor lines={c.lines} onChange={(lines) => setCard(i, { lines })} {...(ce !== undefined ? { invalid: ce } : {})} />
              <div style={{ alignSelf: 'flex-end', minWidth: 220 }}>
                <FreeFormTotals shot="credit-replacement-totals" subtotal={priced.kind === 'priced' ? priced.subtotal : 0} gst={priced.kind === 'priced' ? priced.gst : 0} total={priced.kind === 'priced' ? priced.total : 0} />
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

      {variant === 'office' && (
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

      <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>{variant === 'office' ? L.officeSubmitNote : L.anaesthetistSubmitNote}</span>
      {error !== null && error.replacementIndex === undefined && <FormError message={error.message} shot="credit-error" />}
    </div>
  )

  const actions = (
    <Button variant="primary" block onClick={submit} shot="credit-submit">
      {editing !== undefined ? L.saveChanges : L.submit}
    </Button>
  )

  return <>{frame({ title: L.sheetTitle(editing !== undefined ? 'edit' : mode, original.invoiceNumber), description: L.sheetDescription, body, actions })}</>
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

function CreditMoneyState({ plan, payer, doctor }: { plan: ReversalPlan; payer: string; doctor: string }) {
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

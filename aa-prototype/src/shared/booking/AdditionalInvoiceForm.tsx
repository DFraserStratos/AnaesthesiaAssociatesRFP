/**
 * The additional invoice form (catch-up Phase 38b; US-08.6.3, D10, D22): one
 * form, raised from the Procedure's Contract row ("Create additional invoice"
 * in Admin, "Raise additional invoice" on mobile and web) and from the events
 * list's Edit. Free form: lines of description, quantity and amount, with the
 * live subtotal, GST and total; the "Same as the original invoice" tick
 * (Greg's courier-style tick, ticked by default, `EVENT_RULES.sameAsDefault`)
 * unticks to 22a's `PartyPicker` with "Another person". No Contract, unit,
 * modifier or RVG field and no invoice tick. PWA-safe.
 *
 * It renders in the surface's own overlay: a bottom sheet on the phone, a
 * dialog on web and in Admin (as 22a's Paid by sheet on the same Contract
 * row does). `FreeFormLinesEditor` and `EventPartyField` are their own
 * components so Phase 39's credit note and rebill forms reuse them.
 */

import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import type { CounterpartyRef, FreeFormLine } from '../../domain/types'
import { defaultEventDate, EVENT_RULES } from '../../domain/billing/procedureEvent'
import { priceFreeFormInvoice } from '../../domain/billing/additionalInvoice'
import { parseAmount } from '../../domain/billing/money'
import { procedureLabel } from '../../domain/billing/procedureStack'
import {
  addProcedureEvent,
  counterpartyName,
  invoiceAddresseeName,
  liveInvoiceForProcedure,
  partyOptionsForProcedure,
  updateProcedureEvent,
  useAppStore,
  type Actor,
  type EventPartyInput,
} from '../../store'
import { Button, Checkbox, FieldLabel, FormError, IconButton, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { EMPTY_OTHER_PAYER, OtherPayerFields, otherPayerInput, type OtherPayerDraft } from '../flows/PayerFields'
import { formatCurrency } from '../format'
import { PartyPicker } from './PartyPicker'
import { useBookingStore } from './draft'
import { ADDITIONAL_INVOICE_COPY as COPY, EVENT_LABELS } from '../procedureEventCopy'

// ---------------------------------------------------------------------------
// The lines editor
// ---------------------------------------------------------------------------

export interface LineDraft {
  description: string
  quantity: string
  amount: string
}

export const EMPTY_LINE: LineDraft = { description: '', quantity: '1', amount: '' }

/** A line as typed, as the store takes it: an unreadable number reads as NaN, which pricing refuses in its own words. */
export function lineFromDraft(d: LineDraft): FreeFormLine {
  const q = d.quantity.trim() === '' ? Number.NaN : Number(d.quantity.replace(/,/g, ''))
  return { description: d.description, quantity: q, unitAmount: parseAmount(d.amount) ?? Number.NaN }
}

export function lineDraftOf(l: FreeFormLine): LineDraft {
  return { description: l.description, quantity: String(l.quantity), amount: l.unitAmount.toFixed(2) }
}

/** Free-form lines: description, quantity, amount and the line total in mono; add and remove rows. */
export function FreeFormLinesEditor({
  lines,
  onChange,
  invalid,
}: {
  lines: readonly LineDraft[]
  onChange: (next: LineDraft[]) => void
  /** The refused line and field, from `priceFreeFormInvoice`. */
  invalid?: { lineIndex?: number; field?: string }
}) {
  const set = (i: number, patch: Partial<LineDraft>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  // Thumb-sized controls on the phone (convention 16).
  const phone = useSurface().variant === 'mobile'
  return (
    <div data-shot="free-form-lines" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FieldLabel>{COPY.linesLabel}</FieldLabel>
      {lines.map((line, i) => {
        const priced = lineFromDraft(line)
        const amount = Number.isFinite(priced.quantity) && Number.isFinite(priced.unitAmount) ? Math.round(priced.quantity * priced.unitAmount * 100) / 100 : undefined
        const bad = invalid?.lineIndex === i ? invalid.field : undefined
        return (
          <div
            key={i}
            data-shot="free-form-line"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextField label={COPY.description} value={line.description} onChange={(v) => set(i, { description: v })} invalid={bad === 'description'} shot="line-description" />
              </div>
              {lines.length > 1 && <IconButton size={phone ? 44 : 36} label={`${COPY.removeLine} ${i + 1}`} onClick={() => onChange(lines.filter((_, j) => j !== i))} shot="line-remove"><X size={16} aria-hidden /></IconButton>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 96 }}>
                <TextField label={COPY.quantity} value={line.quantity} onChange={(v) => set(i, { quantity: v })} mono inputMode="decimal" align="right" invalid={bad === 'quantity'} shot="line-quantity" />
              </div>
              <div style={{ width: 128 }}>
                <TextField label={COPY.amount} value={line.amount} onChange={(v) => set(i, { amount: v })} mono inputMode="decimal" align="right" placeholder="$0.00" invalid={bad === 'unitAmount'} shot="line-amount" />
              </div>
              <span className="mono" data-shot="line-total" style={{ marginLeft: 'auto', paddingBottom: 10, fontSize: 14, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>
                {amount !== undefined && amount > 0 ? formatCurrency(amount) : ''}
              </span>
            </div>
          </div>
        )
      })}
      <div>
        <Button variant="secondary" size={phone ? 'touch' : 'compact'} onClick={() => onChange([...lines, { ...EMPTY_LINE }])} shot="line-add">
          <Plus size={14} aria-hidden /> {COPY.addLine}
        </Button>
      </div>
    </div>
  )
}

/** Subtotal, GST and Total, figures in mono (the form and the review sheet). */
export function FreeFormTotals({ subtotal, gst, total, shot }: { subtotal: number; gst: number; total: number; shot?: string }) {
  const rows: { label: string; value: number; strong: boolean }[] = [
    { label: COPY.subtotal, value: subtotal, strong: false },
    { label: COPY.gst, value: gst, strong: false },
    { label: COPY.total, value: total, strong: true },
  ]
  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: r.strong ? 15 : 13.5, fontWeight: r.strong ? 600 : 400, color: r.strong ? neutral.ink : neutral.slate }}>
          <span>{r.label}</span>
          <span className="mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(r.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The party field
// ---------------------------------------------------------------------------

export type PartyDraft = { sameAs: true } | { sameAs: false; party: CounterpartyRef | null; person: OtherPayerDraft | null; personId?: string }

/** The party as the store takes it, or null while nothing is picked. */
export function partyInputOf(d: PartyDraft): EventPartyInput | null {
  if (d.sameAs) return { sameAs: true }
  if (d.person !== null) {
    const input = otherPayerInput(d.person, d.personId)
    return input.kind === 'other' ? { sameAs: false, personInput: input } : null
  }
  return d.party !== null ? { sameAs: false, party: d.party } : null
}

/** "Same as the original invoice (name)", ticked by default, unticking to 22a's PartyPicker with "Another person". */
export function EventPartyField({ procedureId, sameAsName, value, onChange }: { procedureId: string; sameAsName: string; value: PartyDraft; onChange: (next: PartyDraft) => void }) {
  const state = useBookingStore((s) => s)
  const options = useMemo(() => partyOptionsForProcedure(state, procedureId), [state, procedureId])
  return (
    <div data-shot="event-party" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FieldLabel>{COPY.partyLabel}</FieldLabel>
      <Checkbox
        checked={value.sameAs}
        onChange={(checked) => onChange(checked ? { sameAs: true } : { sameAs: false, party: null, person: null })}
        shot="event-same-as"
        labelShot="event-same-as-row"
      >
        {COPY.sameAsWithName(sameAsName)}
      </Checkbox>
      {!value.sameAs && value.person === null && (
        <PartyPicker
          options={options}
          value={value.party}
          onChange={(party) => onChange({ sameAs: false, party, person: null })}
          label={COPY.otherParty}
          shot="event-party-picker"
          onAnotherPerson={() => onChange({ sameAs: false, party: null, person: { ...EMPTY_OTHER_PAYER } })}
        />
      )}
      {!value.sameAs && value.person !== null && (
        <OtherPayerFields draft={value.person} onChange={(person) => onChange({ ...value, person })} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The form in its overlay
// ---------------------------------------------------------------------------

interface AdditionalInvoiceSheetProps {
  open: boolean
  procedureId: string
  actor: Actor
  onClose: () => void
  /** Editing an event awaiting review or declined. */
  eventId?: string
  /** After a save, with the event's id. */
  onSaved?: (eventId: string) => void
}

/** The form's overlay: mounts the form only while open, so each opening starts from the event or the defaults. */
export function AdditionalInvoiceSheet(props: AdditionalInvoiceSheetProps) {
  const { Overlay } = useSurface()
  return (
    <Overlay open={props.open} onClose={props.onClose}>
      {props.open && <AdditionalInvoiceForm {...props} />}
    </Overlay>
  )
}

function AdditionalInvoiceForm({ procedureId, actor, onClose, eventId, onSaved }: AdditionalInvoiceSheetProps) {
  const state = useBookingStore((s) => s)
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  const existing = eventId !== undefined ? state.schedule.procedureEvents[eventId] : undefined
  const original = liveInvoiceForProcedure(state, procedureId)
  const variant = useSurface().variant

  const [date, setDate] = useState(existing?.occurredOnISO ?? defaultEventDate(list?.dateISO ?? state.clock.todayISO, state.clock.todayISO))
  const [lines, setLines] = useState<LineDraft[]>(existing !== undefined ? existing.detail.lines.map(lineDraftOf) : [{ ...EMPTY_LINE }])
  const [party, setParty] = useState<PartyDraft>(() => {
    if (existing === undefined || existing.party.sameAs) return EVENT_RULES.sameAsDefault ? { sameAs: true } : { sameAs: false, party: null, person: null }
    const p = existing.party
    return p.person !== undefined
      ? { sameAs: false, party: null, person: { name: p.person.name, relationship: p.person.relationship ?? '', email: p.person.email ?? '', phone: p.person.phone ?? '', address: { ...EMPTY_OTHER_PAYER.address, ...(p.person.postalAddress ?? {}) } }, personId: p.person.id }
      : { sameAs: false, party: p.party, person: null }
  })
  const [error, setError] = useState<{ message: string; lineIndex?: number; field?: string } | null>(null)

  if (procedure === undefined || booking === undefined) return null
  const sameAsName = original !== undefined ? invoiceAddresseeName(state, original) : counterpartyName(state, { kind: 'patient', id: booking.patientId }, booking.id)
  const label = procedureLabel(procedure, state.masters.rvgGroups, 1)
  const priced = priceFreeFormInvoice(lines.map(lineFromDraft))
  const subtotal = priced.kind === 'priced' ? priced.subtotal : 0

  function save() {
    const partyInput = partyInputOf(party)
    if (partyInput === null) {
      setError({ message: COPY.pickParty, field: 'party' })
      return
    }
    const input = { kind: 'additionalInvoice' as const, occurredOnISO: date, party: partyInput, lines: lines.map(lineFromDraft) }
    const out = eventId === undefined ? addProcedureEvent(useAppStore, actor, procedureId, input) : updateProcedureEvent(useAppStore, actor, eventId, input)
    if (!out.ok) {
      const d = (out.details ?? {}) as { lineIndex?: number; field?: string }
      setError({ message: out.message, ...(d.lineIndex !== undefined ? { lineIndex: d.lineIndex } : {}), ...(d.field !== undefined ? { field: d.field } : {}) })
      return
    }
    onSaved?.(out.value.eventId)
    onClose()
  }

  return (
    <div data-shot="additional-invoice-sheet" data-procedure-id={procedureId} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OverlayHeader
        title={COPY.title(patient?.name ?? 'Patient', label)}
        description={original !== undefined ? <span className="mono">{COPY.additionalTo(original.invoiceNumber)}</span> : undefined}
      />
      <div style={{ width: variant === 'mobile' ? '100%' : 200 }}>
        <TextField label={COPY.dateLabel} type="date" value={date} onChange={setDate} mono invalid={error?.field === 'occurredOnISO'} min={list?.dateISO} max={defaultEventDate(list?.dateISO ?? date, state.clock.todayISO)} shot="event-date" />
      </div>
      <EventPartyField procedureId={procedureId} sameAsName={sameAsName} value={party} onChange={setParty} />
      <FreeFormLinesEditor lines={lines} onChange={setLines} {...(error !== null ? { invalid: error } : {})} />
      <div style={{ alignSelf: 'flex-end', minWidth: 220 }}>
        <FreeFormTotals shot="additional-invoice-totals" subtotal={subtotal} gst={priced.kind === 'priced' ? priced.gst : 0} total={priced.kind === 'priced' ? priced.total : 0} />
      </div>
      <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>{COPY.saveNote}</span>
      <FormError message={error?.message ?? null} />
      <SheetActions
        primary={
          <Button variant="primary" block onClick={save} shot="additional-invoice-save">
            {EVENT_LABELS.saveForReview}
          </Button>
        }
      />
    </div>
  )
}

/**
 * A prepaid Procedure's settlement (catch-up Phase 41, work item 9; US-06.4.1,
 * D31), under the Procedure in the shared Booking detail on all three apps.
 * The prepaid amount is the price for the procedure; the BTM recorded on the
 * day is shown for reference only (never a dollar figure); 27a's move from
 * the AA Holding account names who it went to and when; and nothing is
 * invoiced or credited automatically. What was raised by hand, a credit of the
 * whole prepayment invoice or an additional invoice, is listed one line each.
 *
 * The actions are 38b's additional invoice and 39's credit note entry points
 * (the components, not copies), each gating itself by actor: the office on
 * any Procedure, the anaesthetist on their own, hidden on a colleague's. Once
 * the prepayment invoice is credited only the additional invoice remains.
 * While the block shows, the Procedure's Paid by row leaves those two to it.
 *
 * Shown once the List is AUTHORISED; before that, to the office only and only
 * when the prepayment no longer covers the Procedure (`notNeeded`) or changed
 * after it was sent (`changedAfterSending`), offering just the credit note.
 * Reads through `useBookingStore`, so the Admin draft and the apps agree.
 * PWA-safe: no admin import.
 */

import { useMemo } from 'react'
import { neutral } from '../../theme/tokens'
import { prepaidSettlementFor, prepaymentForProcedure, type Actor, type PrepaidSettlement } from '../../store'
import { Card, DefList, DefRow, Notice, Pill, TextAction } from '../ui'
import { useSurface } from '../surface'
import { drSurname, formatCurrency, stampText } from '../format'
import { PREPAID_SETTLEMENT_COPY as C } from '../procedureEventCopy'
import { AdditionalInvoiceButton } from './AdditionalInvoiceButton'
import { CreditNoteButton } from './CreditNoteButton'
import { useBookingStore } from './draft'

/**
 * The Procedure's settlement when its block shows for this actor, else
 * undefined: the one test the block and the Paid by row share.
 */
export function usePrepaidSettlementShown(procedureId: string, actor: Pick<Actor, 'role'>): PrepaidSettlement | undefined {
  const schedule = useBookingStore((s) => s.schedule)
  const billing = useBookingStore((s) => s.billing)
  const masters = useBookingStore((s) => s.masters)
  const office = actor.role === 'office'
  return useMemo(() => {
    const procedure = schedule.procedures[procedureId]
    const booking = procedure !== undefined ? schedule.bookings[procedure.bookingId] : undefined
    const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
    if (list === undefined || booking === undefined || booking.cancellation !== undefined) return undefined
    const state = { schedule, billing, masters }
    const settlement = prepaidSettlementFor(state, procedureId)
    if (settlement === undefined) return undefined
    if (list.state === 'AUTHORISED') return settlement
    if (!office) return undefined
    const status = prepaymentForProcedure(state, procedureId)?.status
    return status === 'notNeeded' || status === 'changedAfterSending' ? settlement : undefined
  }, [schedule, billing, masters, procedureId, office])
}

export interface PrepaidSettlementBlockProps {
  procedureId: string
  actor: Actor
  /** Admin: open an invoice (the prepayment invoice, an additional invoice). Plain numbers without it. */
  onOpenInvoice?: (invoiceId: string) => void
  /** Admin: open a credit note's document. */
  onOpenCreditNote?: (creditNoteId: string) => void
}

const LINE = { fontSize: 13.5, lineHeight: '20px', color: neutral.ink } as const
const MONEY = { fontVariantNumeric: 'tabular-nums' } as const

export function PrepaidSettlementBlock({ procedureId, actor, onOpenInvoice, onOpenCreditNote }: PrepaidSettlementBlockProps) {
  const settlement = usePrepaidSettlementShown(procedureId, actor)
  const anaesthetists = useBookingStore((s) => s.masters.anaesthetists)
  const phone = useSurface().variant === 'mobile'
  if (settlement === undefined) return null

  const office = actor.role === 'office'
  const credited = settlement.prepaymentInvoice.status === 'credited'
  const transfer = settlement.transfer
  const toName =
    transfer === undefined
      ? undefined
      : actor.role === 'anaesthetist' && actor.anaesthetistId === transfer.toAnaesthetistId
        ? C.you
        : drSurname(anaesthetists[transfer.toAnaesthetistId]?.name ?? transfer.toAnaesthetistId)
  const labelWidth = phone ? 92 : 104

  /** An invoice or credit note number: a link on Admin, plain mono elsewhere. */
  const number = (text: string, open: (() => void) | undefined, shot: string) =>
    open !== undefined ? (
      <TextAction size="sm" flush onClick={open} shot={shot}>
        <span className="mono">{text}</span>
      </TextAction>
    ) : (
      <span className="mono" data-shot={shot} style={{ fontSize: 13, color: neutral.slate }}>
        {text}
      </span>
    )

  return (
    <Card
      shot="prepaid-settlement"
      data-procedure-id={procedureId}
      data-prepayment-status={settlement.prepaymentInvoice.status}
      title={C.title}
      titleLevel={3}
    >
      <DefList gap={10}>
        <DefRow
          label={C.prepaid}
          labelTone="slate"
          labelWidth={labelWidth}
          // On the phone the value takes the full width under its label (checklist design pair 1).
          layout={phone ? 'stacked' : 'inline'}
          shot="prepaid-settlement-amount"
          {...(phone ? {} : { trailing: number(settlement.prepaymentInvoice.number, onOpenInvoice !== undefined ? () => onOpenInvoice(settlement.prepaymentInvoice.id) : undefined, 'prepaid-settlement-invoice') })}
        >
          <span style={LINE}>
            <span className="mono" style={{ ...MONEY, fontWeight: 600 }}>{formatCurrency(settlement.prepaidAmount)}</span>
            {` · ${C.thePrice}`}
          </span>
          {/* Stacked on the phone: the invoice number on its own line under the amount. */}
          {phone && <div>{number(settlement.prepaymentInvoice.number, onOpenInvoice !== undefined ? () => onOpenInvoice(settlement.prepaymentInvoice.id) : undefined, 'prepaid-settlement-invoice')}</div>}
        </DefRow>
        {settlement.recordedBtmUnits !== undefined && (
          <DefRow label={C.recordedBtm} labelTone="slate" labelWidth={labelWidth} layout={phone ? 'stacked' : 'inline'} shot="prepaid-settlement-btm">
            <span style={LINE}>
              <span className="mono" style={MONEY}>{C.units(settlement.recordedBtmUnits)}</span>
              <span style={{ color: neutral.slate }}>{` · ${C.forReference}`}</span>
            </span>
          </DefRow>
        )}
      </DefList>

      {transfer !== undefined && toName !== undefined && (
        <span data-shot="prepaid-settlement-transfer" style={{ ...LINE, color: neutral.slate }}>
          {C.moved(toName, stampText(transfer.atISO.slice(0, 10), { weekday: false }))}
        </span>
      )}

      {(settlement.credits.length > 0 || settlement.additionalInvoices.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: `1px solid ${neutral.line}` }}>
          {settlement.credits.map((c) => (
            <span key={c.id} data-shot="prepaid-settlement-credit" data-credit-note-id={c.id} style={{ ...LINE, display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 }}>
              <Pill tone="success" size="sm">{C.credited}</Pill>
              {number(c.number, onOpenCreditNote !== undefined ? () => onOpenCreditNote(c.id) : undefined, 'prepaid-settlement-credit-number')}
              <span aria-hidden style={{ color: neutral.mist }}>·</span>
              <span className="mono" style={MONEY}>{formatCurrency(c.total)}</span>
            </span>
          ))}
          {settlement.additionalInvoices.map((i) => (
            <span key={i.id} data-shot="prepaid-settlement-additional" data-invoice-id={i.id} style={{ ...LINE, display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 }}>
              <span>{C.additionalInvoice}</span>
              <span aria-hidden style={{ color: neutral.mist }}>·</span>
              {number(i.number, onOpenInvoice !== undefined ? () => onOpenInvoice(i.id) : undefined, 'prepaid-settlement-additional-number')}
              <span aria-hidden style={{ color: neutral.mist }}>·</span>
              <span className="mono" style={MONEY}>{formatCurrency(i.total)}</span>
            </span>
          ))}
        </div>
      )}

      <Notice tone="neutral" shot="prepaid-settlement-nothing-automatic">{C.nothingAutomatic}</Notice>

      {/* 38b's and 39's entry points, gating themselves by actor; once credited, only the additional invoice. */}
      <div data-shot="prepaid-settlement-actions" data-variant={office ? 'office' : 'anaesthetist'} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 16, rowGap: 8 }}>
        <AdditionalInvoiceButton procedureId={procedureId} actor={actor} />
        {!credited && <CreditNoteButton procedureId={procedureId} actor={actor} />}
      </div>
    </Card>
  )
}

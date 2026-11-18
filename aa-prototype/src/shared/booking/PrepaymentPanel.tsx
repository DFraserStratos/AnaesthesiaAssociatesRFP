import { neutral, semantic } from '../../theme/tokens'
import { procedureLabel } from '../../domain/billing/procedureStack'
import type { PrepaymentStatus } from '../../domain/billing/prepayment'
import { prepaidLeftOffFor, prepaidLeftOffText, useAppStore, useBookingPrepayment, type Actor, type PrepaymentGroupView } from '../../store'
import { Card } from '../ui/Card'
import { DefList, DefRow } from '../ui/DefRow'
import { TYPE_AN_AMOUNT_FIRST } from '../../domain/billing/prepayment'
import { Pill } from '../ui/Pill'
import { TextAction } from '../ui/TextAction'
import { formatMoney } from '../format'
import {
  NO_PRICE_YET,
  displayNumberOf,
  PREPAYMENT_STATUS_LABEL,
  prepaidAmountText,
  prepaidContractText,
  prepaymentHoldingText,
  prepaymentTitle,
  prepaymentTone,
} from './prepaymentText'

/** Where the office goes from the panel (Admin passes these; the anaesthetist's apps pass none). */
export interface PrepaymentOfficeLinks {
  /** The Invoices screen's "Awaiting approval" strip. */
  onOpenInvoices: () => void
  /** One sent prepayment invoice. */
  onOpenInvoice: (invoiceId: string) => void
}

interface PrepaymentPanelProps {
  bookingId: string
  actor: Actor
  links?: PrepaymentOfficeLinks
  /** Brings a Procedure's billing into view (the office types its amount there). */
  onShowProcedure?: (procedureId: string) => void
}

/**
 * The Booking's prepayment (catch-up Phase 27; US-06.2.2, US-06.3.2,
 * US-03.1.8, D30): one block per payer group, each naming who is invoiced,
 * its prepaid Procedures with their price and Contract, the prepaid amount
 * and, once raised, the invoice. The title reads the least settled group.
 * Read-only for the anaesthetist; the office sees the way to approve it. No
 * amount field: the office types an amount on the Procedure's rail before the
 * invoice is raised, and it is read-only for everyone after. The warning stays
 * in the WarningsPanel above. Renders nothing when no Procedure is prepaid.
 */
export function PrepaymentPanel({ bookingId, actor, links, onShowProcedure }: PrepaymentPanelProps) {
  const prepayment = useBookingPrepayment(bookingId)
  // After the run: what it left off the final invoice (US-08.2.2, D57). Re-read when the lock or invoices change.
  const lock = useAppStore((s) => s.billing.locks[bookingId])
  const leftOff = useAppStore((s) => (lock !== undefined ? leftOffLine(s, bookingId) : null))
  if (prepayment.status === 'none') return null
  const least = prepayment.groups.find((g) => g.status === prepayment.status) ?? prepayment.groups[0]!
  const title = prepaymentTitle(prepayment.status, { received: least.receivedTotal, total: least.invoicedTotal })
  const office = actor.role === 'office'
  return (
    <Card shot="booking-prepayment" title={<span style={{ color: titleColour(prepayment.status) }}>{title}</span>} data-prepayment-status={prepayment.status}>
      {prepayment.groups.map((group, i) => (
        <GroupBlock
          key={group.key}
          group={group}
          divided={i > 0}
          office={office}
          {...(links !== undefined ? { links } : {})}
          {...(onShowProcedure !== undefined ? { onShowProcedure } : {})}
        />
      ))}
      {leftOff !== null && (
        <div data-shot="booking-prepaid-left-off" style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 10, fontSize: 13, color: neutral.slate }}>
          {leftOff}
        </div>
      )}
    </Card>
  )
}

function leftOffLine(state: Parameters<typeof prepaidLeftOffFor>[0], bookingId: string): string | null {
  const leftOff = prepaidLeftOffFor(state, bookingId)
  return leftOff !== undefined ? prepaidLeftOffText(leftOff) : null
}

function GroupBlock({
  group,
  divided,
  office,
  links,
  onShowProcedure,
}: {
  group: PrepaymentGroupView
  divided: boolean
  office: boolean
  links?: PrepaymentOfficeLinks
  onShowProcedure?: (procedureId: string) => void
}) {
  const procedures = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)
  const noPriceId = group.lines.find((l) => l.amount.kind === 'noPrice')?.procedureId
  return (
    <div
      data-shot="prepayment-group"
      data-payer-key={group.payerKey}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, ...(divided ? { borderTop: `1px solid ${neutral.line}`, paddingTop: 12 } : {}) }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: neutral.slate }}>
          Invoiced to <strong style={{ color: neutral.ink, fontWeight: 600 }}>{group.payerName}</strong>
        </span>
        <Pill tone={prepaymentTone(group.status)}>{PREPAYMENT_STATUS_LABEL[group.status]}</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {group.lines.map((line) => {
          const procedure = procedures[line.procedureId]
          const contractId = line.amount.kind === 'priced' ? line.amount.contractId : procedure?.governingContractId
          const contract = contractId !== undefined ? masters.contracts[contractId] : undefined
          const holder = contract !== undefined ? masters.parties[contract.holderId]?.name : undefined
          return (
            <div key={line.procedureId} data-procedure-id={line.procedureId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 14, color: neutral.ink }}>{procedure !== undefined ? procedureLabel(procedure, masters.rvgGroups, displayNumberOf(procedures, procedure)) : line.procedureId}</span>
                <span style={{ fontSize: 12, color: neutral.mist }}>{prepaidContractText(contract, holder)}</span>
              </div>
              <span className="mono" style={{ fontSize: 14, color: line.amount.kind === 'priced' ? neutral.ink : neutral.mist, whiteSpace: 'nowrap' }}>
                {prepaidAmountText(line.amount)}
              </span>
            </div>
          )
        })}
      </div>
      <DefList gap={6} style={{ borderTop: `1px dashed ${neutral.line}`, paddingTop: 8 }}>
        <DefRow layout="settings" label="Prepaid amount">
          {group.amount !== null ? (
            <span style={{ whiteSpace: 'nowrap' }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{formatMoney(group.amount)}</span>
              <span style={{ fontFamily: 'inherit', fontSize: 12.5, color: neutral.slate }}> plus GST</span>
            </span>
          ) : (
            <span style={{ fontFamily: 'inherit', fontSize: 13, color: neutral.mist }}>{NO_PRICE_YET}</span>
          )}
        </DefRow>
        {group.invoiceNumber !== undefined && (
          <DefRow layout="settings" label="Invoice">
            {office && links !== undefined && group.invoiceId !== undefined ? (
              <TextAction size="sm" flush shot="prepayment-invoice-link" onClick={() => links.onOpenInvoice(group.invoiceId!)}>
                {group.invoiceNumber}
              </TextAction>
            ) : (
              group.invoiceNumber
            )}
          </DefRow>
        )}
      </DefList>
      {/* Where the money is (catch-up Phase 27a): held by AA until the List is authorised, then moved to whoever did it. */}
      {group.holding !== undefined && (
        <div data-shot="prepayment-holding" data-holding-state={group.holding.state} style={{ fontSize: 13, color: group.holding.state === 'held' ? neutral.slate : semantic.success.onTint }}>
          {prepaymentHoldingText(group.holding, {
            you: !office,
            ...(group.holding.toAnaesthetistId !== undefined && masters.anaesthetists[group.holding.toAnaesthetistId] !== undefined
              ? { anaesthetistName: masters.anaesthetists[group.holding.toAnaesthetistId]!.name }
              : {}),
          })}
        </div>
      )}
      {office && group.status === 'awaitingApproval' && (
        <div>
          {group.ready ? (
            links !== undefined && (
              <TextAction flush shot="prepayment-approve-link" onClick={links.onOpenInvoices}>
                Approve on Invoices
              </TextAction>
            )
          ) : onShowProcedure !== undefined && noPriceId !== undefined ? (
            <TextAction flush shot="prepayment-type-amount" onClick={() => onShowProcedure(noPriceId)}>
              {TYPE_AN_AMOUNT_FIRST}
            </TextAction>
          ) : (
            group.notReadyReason !== undefined && (
              <span data-shot="prepayment-not-ready" style={{ fontSize: 13, color: neutral.slate }}>
                {group.notReadyReason}
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}

/** The title in its status tint (Design Language: warning while owed or for the office, success once paid). */
function titleColour(status: PrepaymentStatus): string {
  return prepaymentTone(status) === 'success' ? semantic.success.onTint : semantic.warning.onTint
}

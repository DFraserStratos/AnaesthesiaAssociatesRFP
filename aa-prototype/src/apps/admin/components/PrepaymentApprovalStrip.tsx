import { useState } from 'react'
import { neutral, type as typeScale } from '../../../theme/tokens'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { AA_HOLDING_ACCOUNT, TYPE_AN_AMOUNT_FIRST } from '../../../domain/billing/prepayment'
import {
  readyPendingPrepaymentCount,
  setPrepaymentApprovalRequired,
  useAppStore,
  usePendingPrepayments,
  type Actor,
  type PendingPrepaymentRow,
} from '../../../store'
import { Button, Card, CountBadge, EmptyState, FormError, ResultLine, Switch, TextAction, visuallyHidden } from '../../../shared/ui'
import { ConfirmSheet } from '../../../shared/surface/ConfirmSheet'
import { TableShell, Td, Th } from '../../../shared/table'
import { displayNumberOf, NO_PRICE_YET, prepaidContractText, sentWithLetterText } from '../../../shared/booking/prepaymentText'
import { ApprovePrepaymentDialog } from '../../../shared/booking/PrepaymentLetterDialogs'
import { dayMicroCap, drSurname, formatMoney, plural } from '../../../shared/format'
import { UNASSIGNED } from '../../../shared/scheduleTerms'

/**
 * Prepayment approval on the Invoices tab (US-06.3.1, FT-08.1; D6 extended, D38), in two parts.
 *
 * `PrepaymentApprovalList` is the tab's Awaiting approval filter: one row per Booking and payer whose
 * prepayment waits on an admin, with Approve and send. Approve and send opens a short dialog naming the
 * prepayment letter (US-06.3.6), with its preview and the payer it goes to, then generates that payer's
 * invoice, its pair (a receivable from the payer and a payable crediting the AA Holding account) and
 * sends it with the letter.
 *
 * `PrepaymentApprovalSwitchCard` is the page's rail card: how many wait, "Show them" (the filter), and
 * the Prepayment approval switch. Off, each ready group is sent at once and the list stays empty;
 * switching off confirms first and sends whatever is waiting and ready.
 *
 * Both report their result line and refusals to whoever holds them (the tab), so one line shows either.
 * `PrepaymentApprovalStrip` stacks the two with their own lines (the component catalogue's example).
 */

/** The rows under the Invoices tab's Awaiting approval filter, with Approve and send. */
export function PrepaymentApprovalList({
  actor,
  rows,
  filtered = false,
  onDone,
  onError,
}: {
  actor: Actor
  /** Already filtered and ordered by the tab. */
  rows: readonly PendingPrepaymentRow[]
  /** A search or filter left none: the empty line says so instead of the plain one. */
  filtered?: boolean
  /** The result line ("Invoice AA-... emailed to ..."), shown by the tab. */
  onDone: (line: string) => void
  onError: (message: string | null) => void
}) {
  const approvalRequired = useAppStore((s) => s.appSettings.prepayment.approvalRequired)
  const procedures = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)
  const [picking, setPicking] = useState<PendingPrepaymentRow | null>(null)
  const office = actor.role === 'office'

  /** After the dialog's Approve and send: the result line names the invoice, how it went and the payer. */
  function approved(invoiceId: string, payerName: string) {
    setPicking(null)
    onError(null)
    const invoice = useAppStore.getState().billing.invoices[invoiceId]
    const where = invoice?.delivery?.method === 'email' ? 'emailed' : invoice?.delivery?.method === 'post' ? 'marked to post' : 'sent'
    onDone(`Invoice ${invoice?.invoiceNumber ?? ''} ${where} to ${payerName}, with its payable to the ${AA_HOLDING_ACCOUNT.name}.`)
  }

  const empty = filtered
    ? 'No prepayment awaiting approval matches.'
    : approvalRequired
      ? 'No prepayment invoices awaiting approval.'
      : 'Approval is off: prepayment invoices go as soon as their procedure is ready.'

  return (
    <div data-shot="invoices-awaiting-approval" data-rows={rows.length} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' }}>
      {rows.length === 0 ? (
        <EmptyState variant="card">{empty}</EmptyState>
      ) : (
        <TableShell
          fit
          label="Prepayment invoices awaiting approval"
          density="compact"
          minWidth={980}
          footer={
            <span style={{ fontSize: typeScale.caption.size, lineHeight: `${typeScale.caption.line}px`, color: neutral.mist }}>
              Amounts are before GST. Each invoice goes to the procedure&apos;s payer; its payable credits the {AA_HOLDING_ACCOUNT.name}.
            </span>
          }
        >
          <thead>
            <tr>
              <Th>Patient</Th>
              <Th>Anaesthetist</Th>
              <Th nowrap>Procedure date</Th>
              <Th nowrap>Invoiced to</Th>
              <Th>Procedures</Th>
              <Th align="right">Amount</Th>
              <Th>
                <span style={visuallyHidden}>Action</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const anaesthetist = row.anaesthetistId !== undefined ? masters.anaesthetists[row.anaesthetistId] : undefined
              return (
                <tr key={`${row.bookingId}:${row.payerKey}`} data-shot="awaiting-approval-row" data-booking-id={row.bookingId} data-payer-key={row.payerKey}>
                  <Td bold nowrap>{row.patientName}</Td>
                  <Td nowrap>{anaesthetist !== undefined ? drSurname(anaesthetist.name) : UNASSIGNED}</Td>
                  <Td nowrap>{dayMicroCap(row.dateISO)}</Td>
                  <Td nowrap>{row.payerName}</Td>
                  <Td>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {row.procedureIds.map((id) => {
                        const p = procedures[id]
                        const c = p?.governingContractId !== undefined ? masters.contracts[p.governingContractId] : undefined
                        const holder = c !== undefined ? masters.parties[c.holderId]?.name : undefined
                        return (
                          <span key={id} style={{ fontSize: typeScale.small.size }}>
                            {p !== undefined ? procedureLabel(p, masters.rvgGroups, displayNumberOf(procedures, p)) : id}
                            <span style={{ color: neutral.mist }}> · {prepaidContractText(c, holder)}</span>
                          </span>
                        )
                      })}
                    </span>
                  </Td>
                  <Td align="right" mono>
                    {row.amount !== null ? formatMoney(row.amount) : NO_PRICE_YET}
                  </Td>
                  <Td align="right" nowrap>
                    {office && (
                      <Button
                        variant="primary"
                        size="compact"
                        shot="approve-and-send"
                        ariaLabel={`Approve and send the prepayment invoice to ${row.payerName} for ${row.patientName}`}
                        data-booking-id={row.bookingId}
                        disabled={!row.ready}
                        {...(!row.ready ? { disabledReason: row.notReadyReason ?? TYPE_AN_AMOUNT_FIRST } : {})}
                        onClick={() => {
                          onError(null)
                          setPicking(row)
                        }}
                      >
                        Approve and send
                      </Button>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableShell>
      )}
      {picking !== null && (
        <ApprovePrepaymentDialog
          key={`${picking.bookingId}:${picking.payerKey}`}
          onClose={() => setPicking(null)}
          actor={actor}
          bookingId={picking.bookingId}
          payerKey={picking.payerKey}
          payerName={picking.payerName}
          patientName={picking.patientName}
          onApproved={(invoiceId) => approved(invoiceId, picking.payerName)}
        />
      )}
    </div>
  )
}

/** The rail card: "Prepayments to approve" with its count, "Show them", the approval Switch with its off-confirm. */
export function PrepaymentApprovalSwitchCard({
  actor,
  count,
  onShow,
  onDone,
  onError,
}: {
  actor: Actor
  /** Prepayments waiting (the whole book). */
  count: number
  /** Sets the tab's filter to Awaiting approval; omit to hide "Show them". */
  onShow?: () => void
  onDone: (line: string) => void
  onError: (message: string | null) => void
}) {
  const approvalRequired = useAppStore((s) => s.appSettings.prepayment.approvalRequired)
  const [confirmOff, setConfirmOff] = useState(false)
  const office = actor.role === 'office'
  const goingNow = useAppStore((s) => (confirmOff ? readyPendingPrepaymentCount(s) : 0))

  function switchTo(on: boolean) {
    onError(null)
    const outcome = setPrepaymentApprovalRequired(useAppStore, actor, on)
    if (!outcome.ok) {
      onError(outcome.message)
      return
    }
    const sent = outcome.value.sentInvoiceIds.length
    // Each went with its letter: name it from the invoices just sent.
    const invoices = useAppStore.getState().billing.invoices
    const letters = sentWithLetterText(outcome.value.sentInvoiceIds.flatMap((id) => (invoices[id]?.letter !== undefined ? [invoices[id]!.letter!.templateName] : [])))
    onDone(on ? 'Prepayment approval is on: each prepayment invoice waits under Awaiting approval.' : `Prepayment approval is off. ${plural(sent, 'pending invoice')} sent now.${letters !== null ? ` ${letters}` : ''}`)
  }

  return (
    <Card
      padding="card"
      shot="prepayment-approval-card"
      title={
        <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Prepayments to approve <CountBadge count={count} srNoun="to approve" />
        </span>
      }
      action={
        onShow !== undefined && count > 0 ? (
          <TextAction size="sm" flush shot="prepayments-show-them" onClick={onShow}>
            Show them
          </TextAction>
        ) : undefined
      }
    >
      <span style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.mist }}>
        Each is approved and sent on its own, under Awaiting approval.
      </span>
      <Switch
        size="sm"
        checked={approvalRequired}
        disabled={!office}
        shot="prepayment-approval-switch"
        label="Prepayment approval"
        description={approvalRequired ? 'On · each prepayment invoice waits under Awaiting approval' : 'Off · prepayment invoices are generated and sent at once'}
        onChange={(next) => (next ? switchTo(true) : setConfirmOff(true))}
      />
      {confirmOff && (
        <ConfirmSheet
          open={confirmOff}
          onClose={() => setConfirmOff(false)}
          title="Switch prepayment approval off?"
          description={
            goingNow > 0
              ? `${plural(goingNow, 'pending prepayment invoice')} ${goingNow === 1 ? 'is' : 'are'} generated and sent now. From then on each one goes as soon as its procedure is ready.`
              : 'Each prepayment invoice is generated and sent as soon as its procedure is ready.'
          }
          confirmLabel="Switch off"
          cancelLabel="Keep it on"
          confirmShot="prepayment-approval-off-confirm"
          onConfirm={() => {
            setConfirmOff(false)
            switchTo(false)
          }}
        />
      )}
    </Card>
  )
}

/** Both parts stacked with their own result and error lines: the catalogue example (kept so it compiles). */
export function PrepaymentApprovalStrip({ actor }: { actor: Actor }) {
  const rows = usePendingPrepayments()
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  return (
    <Card>
      <PrepaymentApprovalSwitchCard actor={actor} count={rows.length} onDone={setDone} onError={setError} />
      <PrepaymentApprovalList actor={actor} rows={rows} onDone={setDone} onError={setError} />
      <FormError message={error} />
      <ResultLine shot="approve-and-send-result" line={done} onDismiss={() => setDone(null)} />
    </Card>
  )
}

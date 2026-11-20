import { useState } from 'react'
import { neutral } from '../../../theme/tokens'
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
import { Button, Card, CountBadge, FormError, ResultLine, Switch } from '../../../shared/ui'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { ConfirmSheet } from '../../../shared/surface/ConfirmSheet'
import { TableShell, Td, Th } from '../../../shared/table'
import { displayNumberOf, NO_PRICE_YET, prepaidContractText, sentWithLetterText } from '../../../shared/booking/prepaymentText'
import { ApprovePrepaymentDialog } from '../../../shared/booking/PrepaymentLetterDialogs'
import { dayMicroCap, drSurname, formatMoney, plural } from '../../../shared/format'
import { UNASSIGNED } from '../../../shared/scheduleTerms'

/**
 * The Invoices screen's "Awaiting approval" strip (catch-up Phase 27;
 * US-06.3.1, FT-08.1; D6 extended, D38): one row per Booking and payer whose
 * prepayment waits on an admin, with Approve and send, and the Prepayment
 * approval switch in its header. Approve and send generates that payer's
 * invoice, its pair (a receivable from the payer and a payable crediting the
 * AA Holding account) and sends it. Off, each ready group is sent at once and
 * the strip stays empty. Every send carries the prepayment letter (catch-up
 * Phase 41; US-06.3.6): Approve and send opens a short dialog naming it, with
 * its preview and the payer it goes to.
 */
export function PrepaymentApprovalStrip({ actor }: { actor: Actor }) {
  const rows = usePendingPrepayments()
  const approvalRequired = useAppStore((s) => s.appSettings.prepayment.approvalRequired)
  const procedures = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)
  const [confirmOff, setConfirmOff] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState<PendingPrepaymentRow | null>(null)
  const office = actor.role === 'office'
  const goingNow = useAppStore((s) => (confirmOff ? readyPendingPrepaymentCount(s) : 0))

  /** After the dialog's Approve and send: the strip's result line, as before the letter. */
  function approved(invoiceId: string, payerName: string) {
    setPicking(null)
    setError(null)
    const invoice = useAppStore.getState().billing.invoices[invoiceId]
    const where = invoice?.delivery?.method === 'email' ? 'emailed' : invoice?.delivery?.method === 'post' ? 'marked to post' : 'sent'
    setDone(`Invoice ${invoice?.invoiceNumber ?? ''} ${where} to ${payerName}, with its payable to the ${AA_HOLDING_ACCOUNT.name}.`)
  }

  function switchTo(on: boolean) {
    setError(null)
    const outcome = setPrepaymentApprovalRequired(useAppStore, actor, on)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    const sent = outcome.value.sentInvoiceIds.length
    // Each went with its letter (catch-up Phase 41): name it from the invoices just sent.
    const invoices = useAppStore.getState().billing.invoices
    const letters = sentWithLetterText(outcome.value.sentInvoiceIds.flatMap((id) => (invoices[id]?.letter !== undefined ? [invoices[id]!.letter!.templateName] : [])))
    setDone(on ? 'Prepayment approval is on: each prepayment invoice waits here.' : `Prepayment approval is off. ${plural(sent, 'pending invoice')} sent now.${letters !== null ? ` ${letters}` : ''}`)
  }

  const switchControl = (
    <Switch
      size="sm"
      checked={approvalRequired}
      disabled={!office}
      shot="prepayment-approval-switch"
      label="Prepayment approval"
      description={approvalRequired ? 'On · each prepayment invoice waits here for approval' : 'Off · prepayment invoices are generated and sent at once'}
      onChange={(next) => (next ? switchTo(true) : setConfirmOff(true))}
    />
  )

  return (
    <Card
      shot="invoices-awaiting-approval"
      data-rows={rows.length}
      title={
        <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Awaiting approval <CountBadge count={rows.length} srNoun="to approve" />
        </span>
      }
      action={switchControl}
    >
      {rows.length === 0 ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>
          {approvalRequired ? 'No prepayment invoices awaiting approval.' : 'Approval is off: prepayment invoices go as soon as their procedure is ready.'}
        </span>
      ) : (
        <TableShell label="Prepayment invoices awaiting approval" density="compact" bare minWidth={980}>
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
                          <span key={id} style={{ fontSize: 12.5 }}>
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
                          setError(null)
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
      <span style={{ fontSize: 12, color: neutral.mist }}>Amounts are before GST. Each invoice goes to the procedure&apos;s payer; its payable credits the {AA_HOLDING_ACCOUNT.name}.</span>
      <FormError message={error} />
      <ResultLine shot="approve-and-send-result" line={done} onDismiss={() => setDone(null)} />
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

/**
 * The Billing monitor's Xero panels (catch-up Phase 37; EP-09, US-09.2.4,
 * FT-10.2, RV-40): the connection line, the Xero sync queue, the changes made
 * directly in Xero (with the Resolve side panel) and the payables awaiting
 * Xero's payables run. Proposed product UI, so unbadged, except "Run payables
 * in Xero", which stands in for work done in Xero and carries the Simulated
 * Xero badge. Each panel reads the store itself so the processing monitor's
 * restyle can place it without rewriting it; `anaesthetistId` narrows a panel
 * to one anaesthetist's pairs (the monitor's filter).
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState, FormError, Notice, Pill, RadioCard, ResultLine, TextAction, TextArea, useRovingRadio, visuallyHidden } from '../../../shared/ui'
import { Td, Th, TableShell } from '../../../shared/table'
import { DemoBadge } from '../../../shared/DemoBadge'
import { drSurname, formatCurrency, hhmm, plural, shortDay } from '../../../shared/format'
import { today } from '../../../domain/clock'
import { neutral, radius, semantic } from '../../../theme/tokens'
import {
  DIVERGENCE_OUTCOMES,
  openXeroDivergences,
  payableLegsDue,
  payablesDue,
  counterpartyName,
  resolveXeroDivergence,
  retryXeroItemNow,
  runPayables,
  useAppStore,
  xeroQueueView,
  type Actor,
  type DueLeg,
  type XeroQueueRow,
} from '../../../store'
import { XERO_ALERT_AFTER_ATTEMPTS } from '../../../domain/xero/queue'
import type { XeroDivergence } from '../../../domain/types'
import { dueOn } from '../../../domain/billing/ledger'
import { SidePanel } from './SidePanel'

/** "Connected", or "Xero unavailable since HH:mm · N waiting", read from the queue and the engine's view. */
export function XeroConnectionLine() {
  const billing = useAppStore((s) => s.billing)
  const outage = useAppStore((s) => s.settings.xeroOutage)
  const waiting = useMemo(() => xeroQueueView({ billing }).open.length, [billing])
  const down = outage !== undefined
  const tone = down ? semantic.warning : waiting > 0 ? semantic.warning : semantic.success
  const text = down ? (
    <>
      {'Xero unavailable since '}
      <span className="mono">{hhmm(outage.sinceISO)}</span>
      {' · '}
      <span className="mono">{waiting}</span>
      {' waiting'}
    </>
  ) : waiting > 0 ? (
    <>
      {'Connected · '}
      <span className="mono">{waiting}</span>
      {' waiting for their next try'}
    </>
  ) : (
    'Connected'
  )
  return (
    <div data-shot="billing-xero-connection" role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: tone.onTint }}>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: radius.pill, background: tone.solid, flex: 'none' }} />
      <span style={{ fontWeight: 600 }}>Xero</span>
      <span>{text}</span>
    </div>
  )
}

const QUEUE_TONE: Record<XeroQueueRow['status'], 'warning' | 'error' | 'success'> = {
  Waiting: 'warning',
  Retrying: 'warning',
  'Alert raised': 'error',
  Sent: 'success',
}

/** The Xero sync queue: what waits, its attempts and next try, with Retry now; then what drained. */
export function XeroQueuePanel({ actor, anaesthetistId }: { actor: Actor; anaesthetistId?: string }) {
  const billing = useAppStore((s) => s.billing)
  const todayISO = useAppStore((s) => today(s.clock))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSent, setShowSent] = useState(false)
  /** "08:02", or "Wed 22 Jul 08:02" when the next try is not today. */
  const when = (iso: string | undefined) => (iso === undefined ? '' : iso.slice(0, 10) === todayISO ? hhmm(iso) : `${shortDay(iso)} ${hhmm(iso)}`)
  const view = useMemo(() => {
    const v = xeroQueueView({ billing })
    const keep = (r: XeroQueueRow) => anaesthetistId === undefined || r.anaesthetistId === anaesthetistId
    return { open: v.open.filter(keep), sent: v.sent.filter(keep) }
  }, [billing, anaesthetistId])
  const alerted = view.open.filter((r) => r.item.status === 'alerted')

  function retry(row: XeroQueueRow) {
    const out = retryXeroItemNow(useAppStore, actor, row.item.id)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    setMessage(out.value.sent > 0 ? `${row.what}: sent to Xero.` : `${row.what}: Xero did not answer; the next try is set.`)
  }

  return (
    <Card title="Xero sync queue" shot="billing-xero-queue">
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        Every call to Xero is written here first and retried automatically with increasing gaps, so an outage never loses a financial event or blocks authorising.
      </div>
      {alerted.length > 0 && (
        <Notice tone="error" live="alert" shot="billing-xero-alert">
          {`Xero has not answered for ${Math.max(...alerted.map((r) => r.item.attempts), XERO_ALERT_AFTER_ATTEMPTS)} attempts. In production this alerts AA's support team (simulated).`}
        </Notice>
      )}
      {view.open.length === 0 ? (
        <EmptyState variant="inline">Nothing is waiting for Xero.</EmptyState>
      ) : (
        <TableShell label="Waiting for Xero" density="compact" nested>
          <thead>
            <tr>
              <Th>What</Th>
              <Th align="right">Attempts</Th>
              <Th>Next try</Th>
              <Th>Last error</Th>
              <Th>Status</Th>
              <Th>
                <span style={visuallyHidden}>Action</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {view.open.map((r) => (
              <tr key={r.item.id} data-queue-item={r.item.id} data-queue-kind={r.item.kind}>
                <Td>{r.what}</Td>
                <Td mono align="right">{r.item.attempts}</Td>
                <Td mono nowrap>{when(r.item.nextAttemptAtISO)}</Td>
                <Td style={{ color: neutral.slate }}>{r.item.lastError ?? ''}</Td>
                <Td><Pill tone={QUEUE_TONE[r.status]}>{r.status}</Pill></Td>
                <Td align="right">
                  <Button variant="outline" size="compact" onClick={() => retry(r)} shot={`billing-xero-retry-${r.item.id}`}>Retry now</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <ResultLine line={message} onDismiss={() => setMessage(null)} />
      <FormError message={error} />
      {view.sent.length > 0 && (
        <div>
          <TextAction size="sm" flush ariaExpanded={showSent} onClick={() => setShowSent((v) => !v)} shot="billing-xero-sent-toggle">
            {`Sent after waiting (${view.sent.length})`}
          </TextAction>
          {showSent && (
            <TableShell label="Sent to Xero" density="compact" nested style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <Th>What</Th>
                  <Th align="right">Attempts</Th>
                  <Th>Sent</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {view.sent.map((r) => (
                  <tr key={r.item.id} data-queue-item={r.item.id}>
                    <Td>{r.what}</Td>
                    <Td mono align="right">{r.item.attempts}</Td>
                    <Td mono nowrap>{when(r.item.sentAtISO)}</Td>
                    <Td><Pill tone="success">Sent</Pill></Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </div>
      )}
    </Card>
  )
}

/** What Xero shows for a flag, in words, with when AA staff changed it there. */
export function xeroShowsText(d: Pick<XeroDivergence, 'kind' | 'detectedAtISO' | 'xeroShows'>): string {
  const at = hhmm(d.xeroShows.changedAtISO ?? d.detectedAtISO)
  return d.kind === 'voidedInXero' ? `Voided in Xero ${at}` : `Amended in Xero ${at} · total ${formatCurrency(d.xeroShows.total)}`
}

/** Invoices voided or amended directly in Xero, flagged by the poll; Resolve records the office's outcome. Shown only when a flag is open. */
export function XeroDivergencePanel({ actor, anaesthetistId }: { actor: Actor; anaesthetistId?: string }) {
  const billing = useAppStore((s) => s.billing)
  const invoices = useAppStore((s) => s.billing.invoices)
  const masters = useAppStore((s) => s.masters)
  const [resolving, setResolving] = useState<XeroDivergence | null>(null)
  const payerOf = (d: XeroDivergence): string => {
    const invoice = invoices[d.invoiceId]
    return invoice?.billedTo?.name ?? (invoice !== undefined ? counterpartyName({ masters }, invoice.counterparty, invoice.bookingId) : '')
  }
  const flags = useMemo(
    () =>
      openXeroDivergences({ billing }).filter((d) => {
        if (anaesthetistId === undefined) return true
        const pair = billing.ledger[d.pairId]
        return pair !== undefined && pair.anaesthetistId === anaesthetistId
      }),
    [billing, anaesthetistId],
  )
  if (flags.length === 0) return null
  return (
    <Card title="Changed directly in Xero" tone="warning" shot="billing-xero-divergence">
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        The reconciliation poll found these invoices changed in Xero after the engine issued them. The ledger keeps what it issued; resolve each here.
      </div>
      <TableShell label="Changed directly in Xero" density="compact" nested>
        <thead>
          <tr>
            <Th>Invoice</Th>
            <Th>Payer</Th>
            <Th>Xero shows</Th>
            <Th>The engine holds</Th>
            <Th>Found</Th>
            <Th>
              <span style={visuallyHidden}>Action</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {flags.map((d) => {
            return (
              <tr key={d.id} data-divergence-id={d.id} data-divergence-kind={d.kind}>
                <Td mono>
                  <Link to={`/admin/invoices/${d.invoiceId}`} style={{ color: neutral.ink }}>{invoices[d.invoiceId]?.invoiceNumber ?? d.invoiceId}</Link>
                </Td>
                <Td>{payerOf(d)}</Td>
                <Td><Pill tone="error">{xeroShowsText(d)}</Pill></Td>
                <Td mono>{`Receivable open, ${formatCurrency(d.engineHolds.outstanding)}`}</Td>
                <Td mono nowrap>{hhmm(d.detectedAtISO)}</Td>
                <Td align="right">
                  <Button variant="outline" size="compact" onClick={() => setResolving(d)} shot={`billing-xero-resolve-${d.id}`}>Resolve</Button>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </TableShell>
      <ResolveDivergencePanel flag={resolving} actor={actor} onClose={() => setResolving(null)} />
    </Card>
  )
}

/** The Resolve side panel: one of three outcomes and a required note; provisional, and moves no money. */
function ResolveDivergencePanel({ flag, actor, onClose }: { flag: XeroDivergence | null; actor: Actor; onClose: () => void }) {
  const invoices = useAppStore((s) => s.billing.invoices)
  const [outcome, setOutcome] = useState<(typeof DIVERGENCE_OUTCOMES)[number]['id']>('reissueInXero')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const ids = DIVERGENCE_OUTCOMES.map((o) => o.id)
  const { groupProps, itemProps } = useRovingRadio({ values: ids, value: outcome, onChange: setOutcome })

  function close() {
    setNote('')
    setError(null)
    setOutcome('reissueInXero')
    onClose()
  }
  function save() {
    if (flag === null) return
    const out = resolveXeroDivergence(useAppStore, actor, flag.id, { outcome, note })
    if (!out.ok) {
      setError(out.message)
      return
    }
    close()
  }

  return (
    <SidePanel
      open={flag !== null}
      onClose={close}
      width="record"
      title={flag !== null ? `Resolve ${invoices[flag.invoiceId]?.invoiceNumber ?? flag.invoiceId}` : 'Resolve'}
      meta={flag !== null ? <Pill tone="error">{xeroShowsText(flag)}</Pill> : undefined}
      shot="billing-xero-resolve-panel"
      footerLayout="end"
      footer={
        <>
          <Button variant="secondary" size="desktop" onClick={close}>Cancel</Button>
          <Button variant="primary" size="desktop" onClick={save} shot="billing-xero-resolve-save">Record resolution</Button>
        </>
      }
    >
      <div style={{ fontSize: 13, color: neutral.slate }}>
        Recording a resolution moves no money: the ledger keeps the amount the engine issued.
      </div>
      <div {...groupProps} aria-label="Resolution" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DIVERGENCE_OUTCOMES.map((o, i) => (
          <RadioCard key={o.id} radio={itemProps(i)} checked={outcome === o.id} onSelect={() => setOutcome(o.id)} title={o.label} data-outcome={o.id} />
        ))}
      </div>
      <TextArea label="Note" value={note} onChange={setNote} rows={3} placeholder="What was done, and by whom" shot="billing-xero-resolve-note" />
      <FormError message={error} />
      <div data-shot="billing-xero-resolve-provisional" style={{ fontSize: 12, color: neutral.mist }}>
        Provisional: the policy for each mismatch is to be agreed with AA.
      </div>
    </SidePanel>
  )
}

/** The invoice and payable numbers a due leg shows: its pair's, or a transfer's prepayment invoice. */
function dueLegNumbers(billing: ReturnType<typeof useAppStore.getState>['billing'], l: DueLeg): { invoiceNumber: string; invoiceId?: string } {
  if (l.kind === 'transfer') {
    const t = billing.transfers[l.id]
    const collect = t !== undefined ? billing.ledger[t.collectPairId] : undefined
    return { invoiceNumber: collect?.receivable.number ?? l.leg.number, ...(t !== undefined ? { invoiceId: t.invoiceId } : {}) }
  }
  const pair = billing.ledger[l.id]
  return { invoiceNumber: pair?.receivable.number ?? l.leg.number, ...(pair !== undefined && 'invoiceId' in pair ? { invoiceId: pair.invoiceId } : {}) }
}

/**
 * Payables authorised and awaiting Xero's payables run (FT-10.2, US-09.2.4):
 * read-only, from the ledger (`payablesDue`'s legs). "Run payables in Xero" is
 * the simulated Xero run; the engine records each disbursement when Xero
 * reports the bill paid.
 */
export function PayablesPanel({ actor, anaesthetistId }: { actor: Actor; anaesthetistId?: string }) {
  const navigate = useNavigate()
  const billing = useAppStore((s) => s.billing)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const legs = useMemo(() => payableLegsDue({ billing }, anaesthetistId !== undefined ? { anaesthetistId } : {}), [billing, anaesthetistId])
  const total = useMemo(() => payablesDue({ billing }, anaesthetistId !== undefined ? { anaesthetistId } : {}).total, [billing, anaesthetistId])

  function run() {
    const out = runPayables(useAppStore, actor, anaesthetistId !== undefined ? { anaesthetistId } : {})
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    const r = out.value
    setMessage(
      r.billsPaid === 0
        ? 'Nothing was authorised to pay.'
        : r.disbursedCount === r.billsPaid
          ? `Xero paid ${plural(r.billsPaid, 'bill')} (${formatCurrency(r.totalPaid)}); the Billing Engine recorded ${plural(r.disbursedCount, 'disbursement')} from the bill-paid webhooks.`
          : `Xero paid ${plural(r.billsPaid, 'bill')} (${formatCurrency(r.totalPaid)}); ${plural(r.disbursedCount, 'disbursement')} recorded now, the rest wait in the Xero sync queue.`,
    )
  }

  return (
    <Card
      title="Authorised, awaiting Xero's payables run"
      shot="billing-payables-run"
      action={
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '4px 8px', maxWidth: 360, textAlign: 'right' }}>
          <DemoBadge label="Simulated Xero" />
          <Button variant="outline" size="compact" onClick={run} disabled={legs.length === 0} disabledReason={legs.length === 0 ? 'Nothing authorised to pay' : undefined} shot="billing-run-payables-in-xero" style={{ whiteSpace: 'nowrap' }}>
            Run payables in Xero
          </Button>
        </span>
      }
    >
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        Authorised payables join the next payables run, which is paid in Xero. The Billing Engine records each disbursement when Xero reports the bill paid, by webhook or at the daily poll.
      </div>
      {legs.length === 0 ? (
        <EmptyState variant="inline">No payables are awaiting the payables run.</EmptyState>
      ) : (
        <>
          <div className="mono" style={{ fontSize: 13, color: neutral.ink }} data-shot="billing-payables-due">
            {`${plural(legs.length, 'payable')} due · ${formatCurrency(total)}`}
          </div>
          <TableShell label="Payables awaiting Xero's payables run" density="compact" nested>
            <thead>
              <tr>
                <Th>Anaesthetist</Th>
                <Th>Invoice</Th>
                <Th>Bill</Th>
                <Th align="right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {legs.map((l) => {
                const n = dueLegNumbers(billing, l)
                return (
                  <tr key={l.id} data-payable-id={l.id}>
                    <Td>{drSurname(anaesthetists[l.anaesthetistId]?.name ?? l.anaesthetistId)}</Td>
                    <Td mono>{n.invoiceId !== undefined ? <Link to={`/admin/invoices/${n.invoiceId}`} style={{ color: neutral.ink }}>{n.invoiceNumber}</Link> : n.invoiceNumber}</Td>
                    <Td mono>{l.leg.number}</Td>
                    <Td mono align="right">{formatCurrency(dueOn(l.leg))}</Td>
                  </tr>
                )
              })}
            </tbody>
          </TableShell>
        </>
      )}
      <div>
        <TextAction size="sm" flush shot="billing-open-ledger" onClick={() => navigate('/admin/ledger')}>Open the ledger</TextAction>
      </div>
      <ResultLine line={message} onDismiss={() => setMessage(null)} shot="billing-payables-result" />
      <FormError message={error} />
    </Card>
  )
}

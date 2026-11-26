/**
 * The Finances Xero tab's parts (catch-up Phase 37; build plan Phase 61; EP-09, US-09.2.4,
 * US-13.3.2, FT-10.2, RV-40), drawn from `docs/explorations/finances-section.html` #p-xero:
 *
 * - one grouped table: `XeroTableHead` (`XERO_TABLE_SPAN` columns), then a `XeroQueueRows`
 *   fragment per group of hand-offs (Retry now, its result in place) and a `XeroDivergenceRows`
 *   fragment for the invoices changed directly in Xero (Resolve opens `ResolveDivergencePanel`);
 * - the rail: `XeroConnectionCard` (the connection as a `Notice`, then what the store knows about
 *   it) and `XeroWhatHappensCard`;
 * - `XeroConnectionLine`, `XeroQueuePanel` and `XeroDivergencePanel`, each a small table of its
 *   own built from the same fragments, for the component catalogue.
 *
 * Proposed product UI, so unbadged. The payables run lives in the payment cycle panel. A row's
 * second line is the payer's name, never an NHI or the internal patient id.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, DefList, DefRow, EmptyState, FormError, Notice, Pill, RadioCard, ResultLine, TextAction, TextArea, useRovingRadio, visuallyHidden } from '../../../shared/ui'
import { GroupRow, Td, Th, TableShell } from '../../../shared/table'
import { formatCount, formatCurrency, hhmm, shortDay } from '../../../shared/format'
import { today } from '../../../domain/clock'
import { neutral, radius, semantic, type as typeScale } from '../../../theme/tokens'
import { invoicePath } from '../screens/finances/financePaths'
import {
  DIVERGENCE_OUTCOMES,
  openXeroDivergences,
  counterpartyName,
  resolveXeroDivergence,
  retryXeroItemNow,
  useAppStore,
  xeroQueueView,
  type Actor,
  type AppState,
  type XeroQueueRow,
} from '../../../store'
import { XERO_ALERT_AFTER_ATTEMPTS } from '../../../domain/xero/queue'
import { isBookingPair } from '../../../domain/billing/ledger'
import type { XeroDivergence, XeroQueueItem } from '../../../domain/types'
import { SidePanel } from '../../../shared/surface/SidePanel'
import { xeroFlagText } from '../../../shared/procedureEventCopy'

type BillingSlice = AppState['billing']
type MastersSlice = AppState['masters']

/** "08:02", or "Wed 22 Jul 08:02" when it is not today. */
function useWhen(): (iso: string | undefined) => string {
  const todayISO = useAppStore((s) => today(s.clock))
  return (iso) => (iso === undefined ? '' : iso.slice(0, 10) === todayISO ? hhmm(iso) : `${shortDay(iso)} ${hhmm(iso)}`)
}

/** The second line under a row's number: the payer's name, quiet. */
const SUB_LINE = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate, marginTop: 2 } as const

/** Who an invoice is billed to, by name (its own billed-to name first, as the invoice prints it). */
function payerName(billing: BillingSlice, masters: MastersSlice, invoiceId: string): string | undefined {
  const invoice = billing.invoices[invoiceId]
  if (invoice === undefined) return undefined
  return invoice.billedTo?.name ?? counterpartyName({ masters }, invoice.counterparty, invoice.bookingId)
}

/* ------------------------------------------------------------------ connection */

interface ConnectionFacts {
  outageSinceISO?: string
  waiting: number
  alerted: number
  alertedAttempts: number
  /** The newest item sent after waiting. */
  lastGoodISO?: string
  sentToday: number
  /** The newest daily payment check sent after waiting, or `waiting` while one waits. */
  lastPaymentCheck?: { sentAtISO: string } | 'waiting'
}

function useConnectionFacts(): ConnectionFacts {
  const billing = useAppStore((s) => s.billing)
  const outage = useAppStore((s) => s.settings.xeroOutage)
  const todayISO = useAppStore((s) => today(s.clock))
  return useMemo(() => {
    const view = xeroQueueView({ billing })
    const alerted = view.open.filter((r) => r.item.status === 'alerted')
    const sentPoll = view.sent.find((r) => r.item.kind === 'poll' && r.item.sentAtISO !== undefined)
    const waitingPoll = view.open.some((r) => r.item.kind === 'poll')
    const lastGood = view.sent[0]?.item.sentAtISO
    return {
      ...(outage !== undefined ? { outageSinceISO: outage.sinceISO } : {}),
      waiting: view.open.length,
      alerted: alerted.length,
      alertedAttempts: Math.max(XERO_ALERT_AFTER_ATTEMPTS, ...alerted.map((r) => r.item.attempts)),
      ...(lastGood !== undefined ? { lastGoodISO: lastGood } : {}),
      sentToday: view.sent.filter((r) => r.item.sentAtISO?.slice(0, 10) === todayISO).length,
      ...(waitingPoll ? { lastPaymentCheck: 'waiting' as const } : sentPoll?.item.sentAtISO !== undefined ? { lastPaymentCheck: { sentAtISO: sentPoll.item.sentAtISO } } : {}),
    }
  }, [billing, outage, todayISO])
}

/** "Connected", or "Xero unavailable since HH:mm · N waiting", read from the queue and the engine's view. */
export function XeroConnectionLine() {
  const facts = useConnectionFacts()
  const down = facts.outageSinceISO !== undefined
  const tone = down || facts.waiting > 0 ? semantic.warning : semantic.success
  const text = down ? (
    <>
      {'Xero unavailable since '}
      <span className="mono">{hhmm(facts.outageSinceISO ?? '')}</span>
      {' · '}
      <span className="mono">{facts.waiting}</span>
      {' waiting'}
    </>
  ) : facts.waiting > 0 ? (
    <>
      {'Connected · '}
      <span className="mono">{facts.waiting}</span>
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

/**
 * The Xero tab's Connection card (mock #p-xero's rail): the connection as a `Notice` (the outage
 * as an error), then only the facts the store holds: Last good, Waiting, Sent after waiting today
 * and Last payment check. Organisation is left out: the prototype holds no Xero organisation.
 */
export function XeroConnectionCard() {
  const facts = useConnectionFacts()
  const when = useWhen()
  const down = facts.outageSinceISO !== undefined
  const notice: { tone: 'error' | 'warning' | 'success'; title: string; body: ReactNode } = down
    ? {
        tone: 'error',
        title: 'Xero is unavailable.',
        body: (
          <>
            {'Since '}
            <span className="mono">{hhmm(facts.outageSinceISO ?? '')}</span>
            {`; every call waits and is retried on its own.`}
          </>
        ),
      }
    : facts.alerted > 0
      ? { tone: 'error', title: 'Hand-offs are failing.', body: `${formatCount(facts.alerted)} with an alert raised after ${facts.alertedAttempts} tries; each is still retried on its own.` }
      : facts.waiting > 0
        ? { tone: 'warning', title: 'Connected.', body: `${formatCount(facts.waiting)} waiting for their next try.` }
        : { tone: 'success', title: 'Connected.', body: 'Nothing is waiting for Xero.' }
  return (
    <Card title="Connection" shot="billing-xero-connection-card">
      <Notice tone={notice.tone} title={notice.title} live="status" shot="billing-xero-connection">
        {notice.body}
      </Notice>
      <DefList gap={6}>
        {facts.lastGoodISO !== undefined && (
          <DefRow label="Last good" labelWidth={128} mono data-xero-fact="last-good">
            {when(facts.lastGoodISO)}
          </DefRow>
        )}
        <DefRow label="Waiting" labelWidth={128} mono data-xero-fact="waiting">
          {formatCount(facts.waiting)}
        </DefRow>
        <DefRow label="Sent after waiting" labelWidth={128} mono data-xero-fact="sent-today">
          {`${formatCount(facts.sentToday)} today`}
        </DefRow>
        {facts.lastPaymentCheck !== undefined && (
          <DefRow label="Last payment check" labelWidth={128} mono={facts.lastPaymentCheck !== 'waiting'} data-xero-fact="last-payment-check">
            {facts.lastPaymentCheck === 'waiting' ? 'Waiting for Xero' : when(facts.lastPaymentCheck.sentAtISO)}
          </DefRow>
        )}
      </DefList>
    </Card>
  )
}

/** The rail's "What happens here" card: what goes to Xero, what comes back, and what the office does here. */
export function XeroWhatHappensCard() {
  return (
    <Card title="What happens here" shot="billing-xero-what-happens">
      <div style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0 }}>
          Invoices and their payables go to Xero; payments come back from it. Bank matching and paying stay in Xero.
        </p>
        <p style={{ margin: 0 }}>
          {`A hand-off that fails waits here and is retried on its own; an alert is raised after ${XERO_ALERT_AFTER_ATTEMPTS} tries. Retry now tries it straight away.`}
        </p>
        <p style={{ margin: 0 }}>
          An invoice changed directly in Xero stays listed until it is resolved. Resolving records what was done and moves no money.
        </p>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ the table */

/** The grouped table's column count, for a full-width row. */
export const XERO_TABLE_SPAN = 8

/** The one grouped table's head: both kinds of row share the columns (mock #p-xero). */
export function XeroTableHead() {
  return (
    <thead>
      <tr>
        <Th>What</Th>
        <Th>Anaesthetist</Th>
        <Th>Problem</Th>
        <Th align="right">Attempts</Th>
        <Th nowrap>Next try</Th>
        <Th>Last error</Th>
        <Th>Status</Th>
        <Th align="right">
          <span style={visuallyHidden}>Action</span>
        </Th>
      </tr>
    </thead>
  )
}

const QUEUE_TONE: Record<XeroQueueRow['status'], 'warning' | 'error' | 'success'> = {
  Waiting: 'warning',
  Retrying: 'warning',
  'Alert raised': 'error',
  Sent: 'success',
}

/** The problem in plain words, one line per kind of Xero call. */
const XERO_PROBLEM: Record<XeroQueueItem['kind'], string> = {
  handoff: 'Invoice pair not in Xero',
  paymentSync: 'Payment taken in Xero, not yet in the ledger',
  disbursementSync: 'Payment to the anaesthetist made in Xero, not yet in the ledger',
  journal: 'Transfer journal not posted in Xero',
  correction: 'Credit note and its new invoices not in Xero',
  offsetSync: 'Netting made in Xero, not yet in the ledger',
  poll: 'Daily payment check could not reach Xero',
}

/** A queue row's number (the invoice, or the payable for a payment out), its invoice to link to, and the payer. */
function queueRef(billing: BillingSlice, masters: MastersSlice, row: XeroQueueRow): { number: string; invoiceId?: string; payer?: string } {
  const { item } = row
  if (item.kind === 'poll') return { number: 'Daily payment check' }
  const transfer = item.target.transferId !== undefined ? billing.transfers[item.target.transferId] : undefined
  const pairId = item.target.pairId ?? transfer?.collectPairId
  const pair = pairId !== undefined ? billing.ledger[pairId] : undefined
  const booking = pair !== undefined && isBookingPair(pair) ? pair : undefined
  const payer = booking !== undefined ? payerName(billing, masters, booking.invoiceId) : undefined
  const withPayer = payer !== undefined && payer !== '' ? { payer } : {}
  if (item.kind === 'disbursementSync' || item.kind === 'offsetSync') {
    const number = transfer?.in.number ?? booking?.payable?.number ?? pair?.receivable.number ?? row.what
    return { number, ...withPayer }
  }
  if (booking !== undefined) return { number: booking.receivable.number, invoiceId: booking.invoiceId, ...withPayer }
  return { number: pair?.receivable.number ?? item.target.accRecId ?? row.what }
}

/** The Xero tab's per-row facts (its `xeroTabRows` view), keyed by queue item id or divergence id; '' payer for none. */
export type XeroRowFactsMap = ReadonlyMap<string, { anaesthetistId?: string; payer: string }>

/** An anaesthetist's name, or '' for none. */
function anaesthetistName(masters: MastersSlice, id: string | undefined): string {
  return id !== undefined ? (masters.anaesthetists[id]?.name ?? id) : ''
}

/** A row's What cell: the number (a link where it is an invoice), the payer's name under it. */
function WhatCell({ number, invoiceId, payer }: { number: string; invoiceId?: string | undefined; payer?: string | undefined }) {
  return (
    <Td>
      <span className="mono">{invoiceId !== undefined ? <Link to={invoicePath(invoiceId)} style={{ color: neutral.ink }}>{number}</Link> : number}</span>
      {payer !== undefined && payer !== '' && <div style={SUB_LINE}>{payer}</div>}
    </Td>
  )
}

/** A group's heading: its title and count, the tone stripe down its left edge. */
function GroupHeading({ title, count, tone, shot }: { title: string; count: number; tone?: 'warning' | 'error' | undefined; shot?: string | undefined }) {
  return (
    <GroupRow span={XERO_TABLE_SPAN} {...(tone !== undefined ? { tone } : {})} data-shot={shot} data-xero-group={title} style={{ color: neutral.ink }}>
      <span style={{ fontSize: typeScale.label.size, fontWeight: 700, color: neutral.ink, marginRight: 8 }}>{title}</span>
      <Pill size="sm" mono>{formatCount(count)}</Pill>
    </GroupRow>
  )
}

/** A full-width line inside the table (the alert, a result). */
function WideLine({ children }: { children: ReactNode }) {
  return (
    <tr>
      <Td colSpan={XERO_TABLE_SPAN}>{children}</Td>
    </tr>
  )
}

/**
 * One group of hand-offs in the grouped table: its heading (title, count, tone stripe), the alert
 * when any row has raised one, then a row per item with Retry now; the retry's result or refusal
 * shows in place, under the group. With no rows and no result to show it renders nothing, so a tab
 * can keep it mounted and the result survives the last row leaving.
 */
export function XeroQueueRows({
  title,
  count,
  rows,
  actor,
  tone,
  facts,
  shot,
}: {
  title: string
  count: number
  rows: XeroQueueRow[]
  actor: Actor
  tone?: 'warning' | 'error'
  /** The tab's per-row anaesthetist and payer; without it the rows look them up themselves. */
  facts?: XeroRowFactsMap
  shot?: string
}) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const when = useWhen()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const alerted = rows.filter((r) => r.item.status === 'alerted')

  function retry(row: XeroQueueRow) {
    const out = retryXeroItemNow(useAppStore, actor, row.item.id)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    setMessage(out.value.sent > 0 ? `${row.what}: sent to Xero.` : `${row.what}: Xero did not answer; the next try is set.`)
  }

  if (rows.length === 0 && message === null && error === null) return null
  return (
    <>
      <GroupHeading title={title} count={count} tone={tone} shot={shot} />
      {alerted.length > 0 && (
        <WideLine>
          <Notice tone="error" live="alert" shot="billing-xero-alert">
            {`Xero has not answered for ${Math.max(...alerted.map((r) => r.item.attempts), XERO_ALERT_AFTER_ATTEMPTS)} attempts. In production this alerts AA's support team (simulated).`}
          </Notice>
        </WideLine>
      )}
      {rows.map((r) => {
        const ref = queueRef(billing, masters, r)
        const given = facts?.get(r.item.id)
        const anaesthetist = anaesthetistName(masters, given !== undefined ? given.anaesthetistId : r.anaesthetistId)
        const payer = given !== undefined ? given.payer : ref.payer
        return (
          <tr key={r.item.id} data-queue-item={r.item.id} data-queue-kind={r.item.kind}>
            <WhatCell number={ref.number} invoiceId={ref.invoiceId} payer={payer} />
            <Td>{anaesthetist}</Td>
            <Td>{XERO_PROBLEM[r.item.kind]}</Td>
            <Td mono align="right">{r.item.attempts}</Td>
            <Td mono nowrap>{when(r.item.nextAttemptAtISO)}</Td>
            <Td style={{ color: neutral.slate }}>{r.item.lastError ?? ''}</Td>
            <Td nowrap><Pill tone={QUEUE_TONE[r.status]}>{r.status}</Pill></Td>
            <Td align="right">
              <Button variant="outline" size="compact" onClick={() => retry(r)} shot={`billing-xero-retry-${r.item.id}`}>Retry now</Button>
            </Td>
          </tr>
        )
      })}
      {(message !== null || error !== null) && (
        <WideLine>
          <ResultLine line={message} onDismiss={() => setMessage(null)} />
          <FormError message={error} />
        </WideLine>
      )}
    </>
  )
}

/** What drained after waiting, newest first: a small table of its own under the grouped one. */
export function XeroSentTable({ rows }: { rows: XeroQueueRow[] }) {
  const when = useWhen()
  return (
    <TableShell label="Sent to Xero" density="compact" nested>
      <thead>
        <tr>
          <Th>What</Th>
          <Th align="right">Attempts</Th>
          <Th>Sent</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.item.id} data-queue-item={r.item.id}>
            <Td>{r.what}</Td>
            <Td mono align="right">{r.item.attempts}</Td>
            <Td mono nowrap>{when(r.item.sentAtISO)}</Td>
            <Td><Pill tone="success">Sent</Pill></Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

/** The Xero sync queue on its own: what waits, its attempts and next try, with Retry now; then what drained. */
export function XeroQueuePanel({ actor, anaesthetistId }: { actor: Actor; anaesthetistId?: string }) {
  const billing = useAppStore((s) => s.billing)
  const [showSent, setShowSent] = useState(false)
  const view = useMemo(() => {
    const v = xeroQueueView({ billing })
    const keep = (r: XeroQueueRow) => anaesthetistId === undefined || r.anaesthetistId === anaesthetistId
    return { open: v.open.filter(keep), sent: v.sent.filter(keep) }
  }, [billing, anaesthetistId])
  const alerted = view.open.some((r) => r.item.status === 'alerted')

  return (
    <Card title="Xero sync queue" shot="billing-xero-queue">
      <div style={{ fontSize: typeScale.small.size, color: neutral.slate }}>
        Every call to Xero is written here first and retried automatically with increasing gaps, so an outage never loses a financial event or blocks authorising.
      </div>
      {view.open.length === 0 ? (
        <EmptyState variant="inline">Nothing is waiting for Xero.</EmptyState>
      ) : (
        <TableShell label="Waiting for Xero" density="compact" nested>
          <XeroTableHead />
          <tbody>
            <XeroQueueRows title="Waiting for Xero" count={view.open.length} rows={view.open} actor={actor} tone={alerted ? 'error' : 'warning'} />
          </tbody>
        </TableShell>
      )}
      {view.sent.length > 0 && (
        <div>
          <TextAction size="sm" flush ariaExpanded={showSent} onClick={() => setShowSent((v) => !v)} shot="billing-xero-sent-toggle">
            {`Sent after waiting (${view.sent.length})`}
          </TextAction>
          {showSent && (
            <div style={{ marginTop: 8 }}>
              <XeroSentTable rows={view.sent} />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ changed in Xero */

/** What Xero shows for a flag, in words, with when AA staff changed it there. */
export function xeroShowsText(d: Pick<XeroDivergence, 'kind' | 'detectedAtISO' | 'xeroShows' | 'leg'>): string {
  // The one flag wording (catch-up Phase 39 adds paidAfterCredit: a payment Xero took on an invoice the engine had credited).
  return xeroFlagText(d.kind, d.xeroShows.total, hhmm(d.xeroShows.changedAtISO ?? d.detectedAtISO), d.leg)
}

/** "Xero shows $1,180.00, the engine holds $1,240.00", the figures in the data face. */
function ShowsAgainstHolds({ d }: { d: XeroDivergence }) {
  const money = (n: number) => <span className="mono">{formatCurrency(n)}</span>
  const shows: ReactNode =
    d.kind === 'voidedInXero' ? 'it voided' : d.kind === 'amendedInXero' ? money(d.xeroShows.total) : d.leg === 'payable' ? <>{money(d.xeroShows.total)} paid out</> : <>a payment of {money(d.xeroShows.total)}</>
  const holds: ReactNode = d.kind === 'paidAfterCredit' ? 'it credited' : d.kind === 'voidedInXero' ? <>{money(d.engineHolds.outstanding)} open</> : money(d.engineHolds.amount)
  return (
    <>
      {'Xero shows '}
      {shows}
      {', the engine holds '}
      {holds}
    </>
  )
}

/**
 * The invoices changed directly in Xero, as one group of the grouped table: its heading, then a
 * row per flag (the invoice, the anaesthetist, what Xero shows against what the engine holds, when
 * the poll found it, its status) with Resolve, which opens the Resolve side panel owned here.
 */
export function XeroDivergenceRows({
  title,
  count,
  rows,
  actor,
  facts,
  shot,
}: {
  title: string
  count: number
  rows: XeroDivergence[]
  actor: Actor
  /** The tab's per-row anaesthetist and payer; without it the rows look them up themselves. */
  facts?: XeroRowFactsMap
  shot?: string
}) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const when = useWhen()
  const [resolving, setResolving] = useState<XeroDivergence | null>(null)
  if (rows.length === 0 && resolving === null) return null
  return (
    <>
      <GroupHeading title={title} count={count} tone="warning" shot={shot} />
      {rows.map((d) => {
        const given = facts?.get(d.id)
        const anaesthetistId = given !== undefined ? given.anaesthetistId : billing.ledger[d.pairId]?.anaesthetistId
        return (
          <tr key={d.id} data-divergence-id={d.id} data-divergence-kind={d.kind}>
            <WhatCell number={billing.invoices[d.invoiceId]?.invoiceNumber ?? d.invoiceId} invoiceId={d.invoiceId} payer={given !== undefined ? given.payer : payerName(billing, masters, d.invoiceId)} />
            <Td>{anaesthetistName(masters, anaesthetistId)}</Td>
            <Td>
              <ShowsAgainstHolds d={d} />
            </Td>
            <Td />
            <Td nowrap style={{ color: neutral.slate }}>
              {'Found '}
              <span className="mono">{when(d.detectedAtISO)}</span>
            </Td>
            <Td style={{ color: neutral.slate }}>{xeroShowsText(d)}</Td>
            <Td nowrap><Pill tone="warning">Flagged</Pill></Td>
            <Td align="right">
              <Button variant="outline" size="compact" onClick={() => setResolving(d)} shot={`billing-xero-resolve-${d.id}`}>Resolve</Button>
            </Td>
          </tr>
        )
      })}
      {/* The side panel is fixed to the viewport; this empty row only gives it a valid home inside the tbody while it is open. */}
      {resolving !== null && (
        <tr data-xero-resolve-host="">
          <Td colSpan={XERO_TABLE_SPAN} style={{ padding: 0, borderBottom: 'none' }}>
            <ResolveDivergencePanel flag={resolving} actor={actor} onClose={() => setResolving(null)} />
          </Td>
        </tr>
      )}
    </>
  )
}

/** Invoices voided or amended directly in Xero, flagged by the poll; Resolve records the office's outcome. Shown only when a flag is open. */
export function XeroDivergencePanel({ actor, anaesthetistId }: { actor: Actor; anaesthetistId?: string }) {
  const billing = useAppStore((s) => s.billing)
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
      <div style={{ fontSize: typeScale.small.size, color: neutral.slate }}>
        The reconciliation poll found these invoices changed in Xero after the engine issued them. The ledger keeps what it issued; resolve each here.
      </div>
      <TableShell label="Changed directly in Xero" density="compact" nested>
        <XeroTableHead />
        <tbody>
          <XeroDivergenceRows title="Changed directly in Xero" count={flags.length} rows={flags} actor={actor} />
        </tbody>
      </TableShell>
    </Card>
  )
}

/** The Resolve side panel: one of three outcomes and a required note; provisional, and moves no money. */
export function ResolveDivergencePanel({ flag, actor, onClose }: { flag: XeroDivergence | null; actor: Actor; onClose: () => void }) {
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

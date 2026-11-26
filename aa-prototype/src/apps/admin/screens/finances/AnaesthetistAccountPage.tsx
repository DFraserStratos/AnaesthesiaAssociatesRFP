/**
 * An anaesthetist's account, under Finances' Ledger tab (US-13.2.1, US-08.3.5; build plan Phases 58
 * and 65, D107, D114, D115). A record page: Back to the Ledger, the name with a Square or Out of
 * balance pill, what AA owes them and what they owe AA in one line, and Open in People. The main
 * column holds the two money cards and their invoice pairs (`AccountPairs`); the rail their payment
 * runs and credit trails. Every figure is `anaesthetistLedgerPosition`, the same position the Ledger
 * tab's Anaesthetists row reads. An unknown anaesthetist goes back to the tab.
 */

import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  aaFeeInvoicesFor,
  anaesthetistLedgerPosition,
  openCycle,
  useAppStore,
} from '../../../../store'
import { isBookingPair, type AnaesthetistPosition, type LedgerCheck } from '../../../../domain/billing/ledger'
import { aaFeeMonthLabel } from '../../../../domain/billing/aaFee'
import { cycleLabel, plannedDayLabel } from '../../../../domain/billing/paymentCycle'
import { Card, Notice, Pill, StatTile, TextAction } from '../../../../shared/ui'
import { drSurname, formatCurrency } from '../../../../shared/format'
import { ProfilePage } from '../../components/ProfileChrome'
import { PageBody } from '../../components/AdminPage'
import { LedgerPaymentRuns, StillToNetNotice } from '../../components/LedgerPaymentRuns'
import { anaesthetistRecordPath } from '../../peoplePaths'
import { AccountPairs } from './AccountPairs'
import { AccountCreditTrails } from './AccountCreditTrails'
import { CHECK_TEXT } from './LedgerRail'
import { financePath, invoicePath } from './financePaths'

/** Three tiles to a row where they fit, fewer where they don't: a figure never spills out of its tile. */
const TILE_GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 } as const

export function AnaesthetistAccountPage() {
  const { anaesthetistId = '' } = useParams()
  const known = useAppStore((s) => s.masters.anaesthetists[anaesthetistId] !== undefined)
  if (!known) return <Navigate to={financePath('ledger')} replace />
  return <AnaesthetistAccount anaesthetistId={anaesthetistId} />
}

function AnaesthetistAccount({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const name = useAppStore((s) => s.masters.anaesthetists[anaesthetistId]?.name ?? anaesthetistId)
  const surname = drSurname(name)
  const one = useMemo(() => anaesthetistLedgerPosition({ billing }, anaesthetistId), [billing, anaesthetistId])
  const cycle = useMemo(() => openCycle({ billing, clock, appSettings }), [billing, clock, appSettings])
  const unpaidFee = useMemo(() => aaFeeInvoicesFor({ billing }, anaesthetistId).find((f) => f.status === 'unpaid'), [billing, anaesthetistId])

  const owesLine = one.owedToThem > 0 ? `AA owes ${formatCurrency(one.owedToThem)} in ${cycleLabel(cycle)}'s run` : 'AA owes nothing'
  const feeLine =
    one.theyOweAa > 0
      ? `owes AA ${formatCurrency(one.theyOweAa)}${unpaidFee !== undefined ? ` in ${aaFeeMonthLabel(unpaidFee.monthISO)} fees` : ''}`
      : 'owes AA nothing'

  return (
    <ProfilePage
      shot="ledger-account"
      back={{ label: 'Ledger', to: financePath('ledger') }}
      name={name}
      chip={
        <span data-shot="ledger-account-status" data-in-balance={one.inBalance ? 'true' : 'false'}>
          <Pill tone={one.inBalance ? 'success' : 'warning'}>{one.inBalance ? 'Square' : `Out by ${formatCurrency(one.imbalance)}`}</Pill>
        </span>
      }
      sub={<span data-shot="ledger-account-summary">{`${owesLine} · ${feeLine}`}</span>}
      action={
        <TextAction to={anaesthetistRecordPath(anaesthetistId)} shot="ledger-account-open-people">
          Open in People
        </TextAction>
      }
    >
      <PageBody
        railLabel={`${surname}'s payment runs and credits`}
        rail={
          <>
            <LedgerPaymentRuns anaesthetistId={anaesthetistId} />
            <AccountCreditTrails anaesthetistId={anaesthetistId} />
          </>
        }
      >
        {!one.inBalance && <OutOfBalanceNotice surname={surname} position={one} />}
        <StillToNetNotice anaesthetistId={anaesthetistId} surname={surname} />

        <div data-shot="ledger-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
          <Card title="AA owes them" shot="ledger-aa-owes" aside={<span style={{ fontSize: 12 }}>{`Next run ${plannedDayLabel(cycle.scheduleDateISO)}, ${cycleLabel(cycle)}`}</span>}>
            <div style={TILE_GRID}>
              <StatTile variant="quiet" label="Due now" value={formatCurrency(one.dueNow)} sub="AA holds it, ready to pay out" />
              <StatTile variant="quiet" label="Awaiting collection" value={formatCurrency(one.awaitingCollection)} sub="Billed, not yet paid by the payer" />
              <StatTile variant="quiet" label="Total" value={formatCurrency(one.owedToThem)} />
              <StatTile variant="quiet" label="Collected for them" value={formatCurrency(one.collected)} />
              <StatTile variant="quiet" label="Paid out to them" value={formatCurrency(one.paidOut)} />
            </div>
          </Card>
          <Card title="They owe AA" shot="ledger-owes-aa">
            <StatTile
              variant="quiet"
              label="Unpaid AA fees"
              value={formatCurrency(one.theyOweAa)}
              sub={
                one.theyOweAa > 0 && unpaidFee !== undefined ? (
                  <TextAction size="sm" flush to={financePath('aa-fees')} shot="ledger-owes-aa-invoice">
                    <span className="mono">{unpaidFee.invoiceNumber}</span>
                  </TextAction>
                ) : (
                  'Nothing owing'
                )
              }
            />
          </Card>
        </div>

        <AccountPairs anaesthetistId={anaesthetistId} />
      </PageBody>
    </ProfilePage>
  )
}

/** The failed checks on this anaesthetist's money, with the way to the Ledger when a receipt waits to be placed there. */
function OutOfBalanceNotice({ surname, position }: { surname: string; position: AnaesthetistPosition }) {
  const pairs = useAppStore((s) => s.billing.ledger)
  const unmatched = useAppStore((s) => s.billing.unmatchedReceipts)
  const describe = (c: LedgerCheck): { text: string; to?: string } => {
    if (c.code === 'unmatchedReceiptHeld') return { text: `${CHECK_TEXT[c.code]}: ${unmatched[c.targetId]?.reference ?? c.targetId}, ${formatCurrency(c.amount)}` }
    const pair = pairs[c.targetId]
    const invoiceId = pair !== undefined && isBookingPair(pair) ? pair.invoiceId : undefined
    return { text: `${CHECK_TEXT[c.code]}: ${pair?.receivable.number ?? c.targetId}, ${formatCurrency(c.amount)}`, ...(invoiceId !== undefined ? { to: invoicePath(invoiceId) } : {}) }
  }
  return (
    <Notice
      tone="warning"
      title={`${surname}'s account is out by ${formatCurrency(position.imbalance)}`}
      live="status"
      shot="ledger-balance"
      data-in-balance="false"
      {...(position.unmatchedHeld > 0
        ? { action: <TextAction size="sm" flush to={financePath('ledger')} shot="ledger-account-see-ledger">See the Ledger</TextAction> }
        : {})}
    >
      <ul style={{ margin: '4px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {position.checks.map((c) => {
          const d = describe(c)
          return (
            <li key={`${c.code}-${c.targetId}`} data-check={c.code} style={{ fontSize: 12.5 }}>
              {d.to !== undefined ? <TextAction size="sm" flush inline to={d.to}>{d.text}</TextAction> : d.text}
            </li>
          )
        })}
      </ul>
    </Notice>
  )
}

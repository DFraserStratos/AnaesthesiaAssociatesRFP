/**
 * A Contract's page (build plan Phase 45; US-04.1.7, US-04.2.15, DM-04; D92):
 * `/admin/contracts/:contractId`, keyed by the Contract's id because its AA
 * code is editable. On the Admin profile frame (`ProfilePage`, fluid) with the
 * rail: the header (name, AA code, status, Disable or Make active), the tabs
 * (Overview, Bookings, Event fees, History; `?tab=`), and on Overview the
 * cards in the order the office checks a Contract (docs/explorations/
 * contracts-section.html #record) beside "On this Contract", who it touches.
 *
 * A system Contract (No contract · RVG, the Fixed price fallbacks) has the
 * same page with its notice, and no Disable.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { contractHistoryFor, contractDisabledOn } from '../../../../domain/billing/contractHistory'
import { eventFeesForContract } from '../../../../domain/billing/contractEventFees'
import { isOpenPriceFallback } from '../../../../domain/billing/fallbacks'
import { formatRangePrice } from '../../../../domain/billing/priceRanges'
import { shortDay } from '../../../../domain/dateText'
import type { Contract } from '../../../../domain/types'
import { PRICING_KIND_LABEL, STATUS_LABEL } from '../../../../shared/contracts'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { Card, CountBadge, EmptyState, FormError, LineTabLink, LineTabs, Notice, Pill, TextAction } from '../../../../shared/ui'
import { onContract, useAppStore, useToday, type Actor, type LockedAgainst } from '../../../../store'
import type { StillOnRow } from '../../../../domain/billing/contractChanges'
import { neutral } from '../../../../theme/tokens'
import { PageBody } from '../../components/AdminPage'
import { PROFILE_CARD, ProfilePage } from '../../components/ProfileChrome'
import { contractPath, contractsPath, parseContractTab, type ContractTab } from '../../contractsPaths'
import { ContractEventFees } from '../../flows/ContractEventFees'
import { ContractHistory } from '../../flows/ContractHistory'
import { listShortLabel } from '../../util'
import { ContractOverview } from './ContractCards'
import { ContractDisable } from './ContractDisable'

/** How many Procedures the rail shows before "See all". */
const RAIL_ROWS = 5

const TAB_LABEL: Record<ContractTab, string> = { overview: 'Overview', bookings: 'Bookings', eventFees: 'Event fees', history: 'History' }

/** The page's notice for a system Contract (catch-up Phase 18a's words). */
export function systemNotice(contract: Contract): string {
  return isOpenPriceFallback(contract)
    ? 'Made by the system: one Fixed price Contract for each place an invoice can go, where a person types the amount on the Procedure. It is always available and never disabled. Only its name, AA code and invoice description can change.'
    : "No contract · RVG is built in and always available. It is held by Anaesthesia Associates, bills the payer and prices at the anaesthetist's rate. Only its name, AA code and invoice description can change."
}

export function ContractPage({ contractId, actor }: { contractId: string; actor: Actor }) {
  const contract = useAppStore((s) => s.masters.contracts[contractId])!
  const parties = useAppStore((s) => s.masters.parties)
  const audit = useAppStore((s) => s.audit)
  const allFees = useAppStore((s) => s.masters.contractEventFees)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const billing = useAppStore((s) => s.billing)
  const [params] = useSearchParams()
  const tab = parseContractTab(params.get('tab'))
  const [feeError, setFeeError] = useState<string | null>(null)
  // The demo triggers that act on the Contract open (catch-up Phase 24's backdated range).
  useDemoTriggerContext('adminContracts.openContractId', contractId)

  const touches = useMemo(() => onContract({ schedule, masters, billing }, contractId), [schedule, masters, billing, contractId])
  const historyCount = useMemo(() => contractHistoryFor(audit, contractId).length, [audit, contractId])
  const feeCount = eventFeesForContract(allFees, contractId).length
  const disabledDay = useMemo(() => (contract.status === 'disabled' ? contractDisabledOn(audit, contractId) : null), [audit, contract.status, contractId])
  const system = contract.systemRole !== undefined
  const holder = parties[contract.holderId]
  // The Bookings tab counts Bookings: an open Booking with two Procedures on the Contract is one.
  const bookingCount = new Set([...touches.open.map((r) => r.bookingId), ...touches.authorised.map((r) => r.bookingId)]).size

  const counts: Record<ContractTab, number | undefined> = { overview: undefined, bookings: bookingCount, eventFees: feeCount, history: historyCount }

  return (
    <ProfilePage
      shot="contract-detail"
      back={{ label: 'Contracts', to: contractsPath() }}
      name={contract.name}
      chip={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pill mono shot="contract-aa-code">{contract.aaCode}</Pill>
          <Pill tone={contract.status === 'active' ? 'success' : 'neutral'} shot="contract-status">{STATUS_LABEL[contract.status]}</Pill>
          {system && <Pill shot="contract-system-pill">System</Pill>}
        </span>
      }
      sub={`Held by ${holder?.name ?? contract.holderId} · ${contract.billsTo === 'holder' ? 'bills its holder' : 'bills the payer'} · ${PRICING_KIND_LABEL[contract.pricing.kind]}`}
      {...(system ? {} : { action: <ContractDisable contract={contract} actor={actor} /> })}
      tabs={
        <LineTabs label="Contract" shot="contract-tabs">
          {(Object.keys(TAB_LABEL) as ContractTab[]).map((t) => (
            <LineTabLink
              key={t}
              to={contractPath(contractId, t)}
              replace
              active={tab === t}
              shot={`contract-tab-${t}`}
              {...(counts[t] !== undefined ? { badge: <CountBadge count={counts[t]} hideAtZero={false} mono /> } : {})}
            >
              {TAB_LABEL[t]}
            </LineTabLink>
          ))}
        </LineTabs>
      }
    >
      {system && (
        <Notice tone="neutral" shot="contract-system-notice">{systemNotice(contract)}</Notice>
      )}
      {contract.status === 'disabled' && (
        <Notice tone="neutral" shot="contract-disabled-note">
          {disabledDay !== null
            ? `Disabled on ${shortDay(disabledDay)}: hidden from the Contract list unless asked for. Procedures already on it keep it; one not yet authorised and dated on or after ${shortDay(disabledDay)} is flagged at review.`
            : 'Disabled: hidden from the Contract list unless asked for. Procedures already on it keep it; one not yet authorised is flagged at review.'}
        </Notice>
      )}

      {tab === 'overview' && (
        <PageBody rail={<OnThisContractRail contractId={contractId} open={touches.open} authorised={touches.authorised} />} railLabel="On this Contract">
          <ContractOverview contract={contract} actor={actor} />
        </PageBody>
      )}
      {tab === 'bookings' && <ContractBookings open={touches.open} authorised={touches.authorised} />}
      {tab === 'eventFees' && (
        <Card style={PROFILE_CARD} title="Event fees" shot="contract-event-fees-card">
          {system ? (
            <EmptyState title="No event fees">A system Contract charges no fixed fee for a pre-op or post-op event.</EmptyState>
          ) : (
            <>
              <ContractEventFees contract={contract} actor={actor} onError={setFeeError} />
              <FormError message={feeError} />
            </>
          )}
        </Card>
      )}
      {tab === 'history' && (
        <Card style={PROFILE_CARD} title="History" shot="contract-history-card">
          <ContractHistory contractId={contractId} />
        </Card>
      )}
    </ProfilePage>
  )
}

/** A not-yet-authorised Procedure's place: "Mercy Hospital AM · Hale" (the List's short label). */
function useListLabel(): (listId: string) => string {
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)
  return (listId) => {
    const list = lists[listId]
    return list !== undefined ? listShortLabel(list, masters) : listId
  }
}

function bookingPath(dateISO: string, bookingId: string): string {
  return `/admin/day/${dateISO}/bookings/${bookingId}`
}

/**
 * "On this Contract" (US-04.1.7 "Who it touches"): its count, the Procedures not yet authorised by
 * date, then the authorised Bookings at their locked price, each opening its Booking; "See all" opens
 * the Bookings tab.
 */
function OnThisContractRail({ contractId, open, authorised }: { contractId: string; open: readonly StillOnRow[]; authorised: readonly LockedAgainst[] }) {
  const listLabel = useListLabel()
  const lists = useAppStore((s) => s.schedule.lists)
  const total = open.length + authorised.length
  const shownOpen = open.slice(0, RAIL_ROWS)
  const shownLocked = authorised.slice(0, Math.max(0, RAIL_ROWS - shownOpen.length))
  return (
    <Card title={<>On this Contract <CountBadge count={total} hideAtZero={false} mono srNoun="Procedures and Bookings" /></>} shot="contract-on-this" aside={<span style={{ fontSize: 12, color: neutral.mist }}>not yet billed, then authorised</span>}>
      {total === 0 ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>No Procedure is on it yet.</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {shownOpen.map((r, i) => (
            <RailRow key={r.procedureId} first={i === 0} to={bookingPath(r.dateISO, r.bookingId)} title={`${r.patientName} · ${shortDay(r.dateISO)}`} sub={listLabel(r.listId)} data-on-contract="open" />
          ))}
          {shownLocked.map((r, i) => {
            const dateISO = lists[r.listId]?.dateISO ?? ''
            return (
              <RailRow
                key={r.bookingId}
                first={shownOpen.length === 0 && i === 0}
                to={bookingPath(dateISO, r.bookingId)}
                title={`${r.patientName} · ${shortDay(dateISO)}`}
                sub={<>Authorised · locked at <span className="mono">{formatRangePrice(r.lockedPrice)}</span></>}
                data-on-contract="authorised"
              />
            )
          })}
        </ul>
      )}
      {total > shownOpen.length + shownLocked.length && (
        <TextAction size="sm" flush to={contractPath(contractId, 'bookings')} shot="contract-on-this-all">{`See all ${total}`}</TextAction>
      )}
    </Card>
  )
}

function RailRow({ to, title, sub, first, ...data }: { to: string; title: string; sub: React.ReactNode; first: boolean } & { [key: `data-${string}`]: string }) {
  return (
    <li {...data} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderTop: first ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}>
      <TextAction size="sm" flush to={to}>{title}</TextAction>
      <span style={{ fontSize: 12, color: neutral.slate }}>{sub}</span>
    </li>
  )
}

/** The Bookings tab: every Procedure on the Contract not yet authorised, then the authorised Bookings at their locked price. */
function ContractBookings({ open, authorised }: { open: readonly StillOnRow[]; authorised: readonly LockedAgainst[] }) {
  const navigate = useNavigate()
  const listLabel = useListLabel()
  const lists = useAppStore((s) => s.schedule.lists)
  const today = useToday()
  if (open.length + authorised.length === 0) {
    return <EmptyState variant="card" title="No Procedure is on this Contract" shot="contract-bookings">Procedures put on it show here, with those authorised at their locked price.</EmptyState>
  }
  return (
    <TableShell label="Procedures on this Contract" density="dense" shot="contract-bookings">
      <thead>
        <tr>
          <Th>Patient</Th>
          <Th>Date</Th>
          <Th>List</Th>
          <Th>Procedure</Th>
          <Th>Status</Th>
          <Th align="right">Locked price</Th>
        </tr>
      </thead>
      <tbody>
        {open.map((r) => (
          <ClickableRow key={r.procedureId} data-on-contract="open" onOpen={() => navigate(bookingPath(r.dateISO, r.bookingId))}>
            <Td bold><RowOpenButton label={`Open ${r.patientName}'s Booking`} onOpen={() => navigate(bookingPath(r.dateISO, r.bookingId))}>{r.patientName}</RowOpenButton></Td>
            <Td mono nowrap>{shortDay(r.dateISO)}</Td>
            <Td>{listLabel(r.listId)}</Td>
            <Td>{r.procedureText ?? ''}</Td>
            <Td>{r.dateISO < today ? 'Awaiting review' : 'Upcoming'}</Td>
            <Td align="right" />
          </ClickableRow>
        ))}
        {authorised.map((r) => {
          const dateISO = lists[r.listId]?.dateISO ?? ''
          return (
            <ClickableRow key={r.bookingId} data-on-contract="authorised" onOpen={() => navigate(bookingPath(dateISO, r.bookingId))}>
              <Td bold><RowOpenButton label={`Open ${r.patientName}'s Booking`} onOpen={() => navigate(bookingPath(dateISO, r.bookingId))}>{r.patientName}</RowOpenButton></Td>
              <Td mono nowrap>{dateISO !== '' ? shortDay(dateISO) : ''}</Td>
              <Td>{listLabel(r.listId)}</Td>
              <Td />
              <Td>Authorised</Td>
              <Td align="right" mono bold>{formatRangePrice(r.lockedPrice)}</Td>
            </ClickableRow>
          )
        })}
      </tbody>
    </TableShell>
  )
}

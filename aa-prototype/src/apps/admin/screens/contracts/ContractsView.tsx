/**
 * The Contract list (catch-up Phase 18; US-04.1.1, US-04.1.2, US-04.1.4,
 * US-04.2.1), moved from Master data to the Contracts section in build plan
 * Phase 45 (D92). One search over name, holder reference code and AA code,
 * the Active (default), Disabled or All filter and a holder Party filter (also
 * reached from a Party's "active" link as `?holder=`), results under holder
 * headings with No contract · RVG first. Office only (D42). Each row opens the
 * Contract's page at its id; nothing is deleted. Phase 47 groups it.
 *
 * Catch-up Phase 18a: a filter by funding tag beside the holder filter; each
 * row shows its tag as a neutral pill and its specialties in mist; the system
 * Contracts (No contract · RVG and the Fixed price fallbacks) carry a "System"
 * pill. No control shows or hides Contracts by specialty here.
 */

import { isOfficeContract } from '../../../../domain/billing/fallbacks'
import { contractInvoicingSummary } from '../../../../domain/billing/invoicePresentation'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { contractSearch, type ContractStatusFilter } from '../../../../domain/billing/contracts'
import { formatRangeDate, formatRangePrice, rangeSummary, rangeSummaryText } from '../../../../domain/billing/priceRanges'
import { formatCurrency } from '../../../../shared/format'
import type { Contract } from '../../../../domain/types'
import { useAppStore, useToday } from '../../../../store'
import { fundingTagsInOrder } from '../../../../domain/billing/fundingTags'
import { specialtyNames } from '../../../../domain/specialties'
import { FilterPills, NameSearchBox, SelectField } from '../../../../shared/ui'
import { PageToolbar } from '../../components/AdminPage'
import { BILLS_LABEL, OVERRIDE_PILL_LABEL, PARTY_KIND_LABEL, STATUS_LABEL, pricingLabel } from '../../../../shared/contracts'
import { neutral } from '../../../../theme/tokens'
import { Pill } from '../../components/MasterPills'
import { isRvgKind } from '../../../../domain/billing/contracts'
import { ClickableRow, GroupRow, RowOpenButton } from '../../../../shared/table'
import { LoadResultBanner, MasterTable } from '../masters/chrome'
import { EmptyState, TextAction } from '../../../../shared/ui'
import { rowCellStyle } from '../masters/tableStyles'
import { contractPath } from '../../contractsPaths'

/** Layout and Delivery are derived and read-only (catch-up Phase 22; US-04.2.8): nothing about invoicing is stored on a Contract. */
/**
 * Invoicing holds who it bills, the invoice layout and the delivery, one over the other, and the
 * status leads the tags, so the list fits a 1280 laptop beside the view list without scrolling
 * sideways.
 */
const COLUMNS = ['AA code', 'Name', 'Invoicing', 'Pricing', 'Status · tags']

export function ContractsView() {
  const navigate = useNavigate()
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const today = useToday()
  const fundingTags = useAppStore((s) => s.masters.fundingTags)
  const specialties = useAppStore((s) => s.masters.specialties)
  const [params, setParams] = useSearchParams()
  const [tagFilter, setTagFilter] = useState('')
  const tagId = fundingTags[tagFilter] !== undefined ? tagFilter : ''
  const [query, setQuery] = useState('')
  // Active by default; a Party's link that holds only Disabled Contracts opens on All.
  const [status, setStatus] = useState<ContractStatusFilter>(() => {
    const h = params.get('holder')
    return h !== null && !Object.values(contracts).some((c) => c.holderId === h && c.status === 'active' && isOfficeContract(c)) ? 'all' : 'active'
  })
  const holderParam = params.get('holder') ?? ''
  const holderId = parties[holderParam] !== undefined ? holderParam : ''

  function setHolder(next: string) {
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      if (next === '') copy.delete('holder')
      else copy.set('holder', next)
      return copy
    }, { replace: true })
  }

  const results = useMemo(
    () =>
      contractSearch(query, {
        contracts,
        parties,
        rvgGroups,
        filters: { status, ...(holderId !== '' ? { holderId } : {}), ...(tagId !== '' ? { fundingTagId: tagId } : {}) },
      }),
    [query, contracts, parties, rvgGroups, status, holderId, tagId],
  )
  const groups = useMemo(() => {
    const map = new Map<string, Contract[]>()
    for (const c of results) map.set(c.holderId, [...(map.get(c.holderId) ?? []), c])
    return [...map.entries()]
  }, [results])
  const holderOptions = useMemo(
    () => Object.values(parties).filter((p) => Object.values(contracts).some((c) => c.holderId === p.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [parties, contracts],
  )

  const filtered = query.trim() !== '' || status !== 'active' || holderId !== '' || tagId !== ''

  return (
    <>
      <LoadResultBanner view="contracts" />

      <PageToolbar
        end={
          <span data-shot="contract-result-count">
            <span className="mono">{results.length}</span> {results.length === 1 ? 'Contract' : 'Contracts'}
            {status === 'active' ? ' active' : status === 'disabled' ? ' disabled' : ''}
            {holderId !== '' ? ` held by ${parties[holderId]?.name ?? holderId}` : ''}
            {tagId !== '' ? ` tagged ${fundingTags[tagId]?.code ?? tagId}` : ''}
            {query.trim() !== '' ? ` matching "${query.trim()}"` : ''}
          </span>
        }
      >
        <div data-shot="contract-search">
          <NameSearchBox size="pill" width={260} value={query} onChange={setQuery} label="Search by name, code or AA code" />
        </div>
        <div data-shot="contract-status-filter">
          <FilterPills
            ariaLabel="Status"
            value={status}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
              { value: 'all', label: 'All' },
            ]}
            onSelect={setStatus}
          />
        </div>
        <SelectField label="Holder" hideLabel labelShot="contract-holder-filter" width={190} size="compact" fill="surface" value={holderId} onChange={setHolder}>
          <option value="">All holders</option>
          {holderOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </SelectField>
        <SelectField label="Funding tag" hideLabel labelShot="contract-tag-filter" width={150} size="compact" fill="surface" value={tagId} onChange={setTagFilter}>
          <option value="">All funding tags</option>
          {fundingTagsInOrder(fundingTags).map((t) => (
            <option key={t.id} value={t.id}>{t.code}</option>
          ))}
        </SelectField>
      </PageToolbar>

      {results.length === 0 ? (
        <EmptyState
          variant="card"
          shot="contract-catalogue"
          title="No Contracts match."
          action={
            filtered ? (
              <TextAction
                size="sm"
                flush
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                  setHolder('')
                  setTagFilter('')
                }}
              >
                Search all Contracts
              </TextAction>
            ) : undefined
          }
        >
          Check the spelling, or search all Contracts, Disabled ones included.
        </EmptyState>
      ) : (
        <MasterTable columns={COLUMNS} shot="contract-catalogue" label="Contracts">
          {groups.map(([holder, list]) => {
            const party = parties[holder]
            return [
              <GroupRow key={`h-${holder}`} span={COLUMNS.length} data-contract-holder={holder} style={{ paddingTop: 10, paddingBottom: 8, color: neutral.ink, borderBottom: `1px solid ${neutral.sunken}` }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: neutral.ink, marginRight: 8 }}>{party?.name ?? holder}</span>
                {party !== undefined && party.kind !== 'aa' && <Pill>{PARTY_KIND_LABEL[party.kind]}</Pill>}
              </GroupRow>,
              ...list.map((c) => (
                <ClickableRow
                  key={c.id}
                  data-contract={c.id}
                  data-system={c.systemRole !== undefined ? c.systemRole : undefined}
                  onOpen={() => navigate(contractPath(c.id))}
                >
                  <td className="mono" style={{ ...rowCellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.aaCode}</td>
                  <td style={{ ...rowCellStyle, fontWeight: 500 }}>
                    <RowOpenButton label={`Open ${c.name}`} onOpen={() => navigate(contractPath(c.id))}>{c.name}</RowOpenButton>
                    {c.holderReference !== undefined && <span className="mono" style={{ color: neutral.mist, marginLeft: 8 }}>{c.holderReference}</span>}
                    {c.specialtyIds.length > 0 && (
                      <div style={{ fontSize: 12.5, color: neutral.mist, fontWeight: 400, marginTop: 2 }}>{specialtyNames({ specialties }, c.specialtyIds).join(', ')}</div>
                    )}
                  </td>
                  <td style={rowCellStyle}>
                    <div>{`Bills the ${BILLS_LABEL[c.billsTo].toLowerCase()}`}</div>
                    <div data-shot="contract-layout" style={{ fontSize: 12, color: neutral.slate, whiteSpace: 'nowrap' }}>{contractInvoicingSummary(c, party).layout}</div>
                    <div data-shot="contract-delivery" style={{ fontSize: 12, color: neutral.slate }}>{contractInvoicingSummary(c, party).delivery}</div>
                  </td>
                  <td style={rowCellStyle}><PricingText contract={c} todayISO={today} /></td>
                  <td style={rowCellStyle}>
                    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                      <Pill tone={c.status === 'active' ? 'success' : 'neutral'}>{STATUS_LABEL[c.status]}</Pill>
                      {c.systemRole !== undefined && <Pill shot="contract-system-pill">System</Pill>}
                      {c.fundingTagId !== undefined && <Pill><span className="mono">{fundingTags[c.fundingTagId]?.code ?? c.fundingTagId}</span></Pill>}
                      {c.prepaid && <Pill>Prepaid</Pill>}
                      {/* Who may change the price (catch-up Phase 24; US-04.2.2): on RVG kinds only, from 18's setting. */}
                      {isRvgKind(c.pricing.kind) && (
                        <Pill shot="contract-override-pill">{c.anaesthetistMayOverridePrice ? OVERRIDE_PILL_LABEL.may : OVERRIDE_PILL_LABEL.fixed}</Pill>
                      )}
                    </span>
                  </td>
                </ClickableRow>
              )),
            ]
          })}
        </MasterTable>
      )}

    </>
  )
}

/** The pricing phrase, with money in mono tabular figures. */
function PricingText({ contract, todayISO }: { contract: Contract; todayISO: string }) {
  const p = contract.pricing
  if (p.kind === 'fixed') {
    // The range in force today (catch-up Phase 19a), or when the first starts. The words are
    // `rangeSummaryText`'s; the in-force case is set here only to put the money in mono.
    const summary = rangeSummary(contract, todayISO)
    if (summary.kind === 'inForce') {
      return (
        <span>
          <span className="mono">{formatRangePrice(summary.range.price)}</span> from {formatRangeDate(summary.range.startISO)}
        </span>
      )
    }
    return <span style={{ color: neutral.slate }}>{rangeSummaryText(summary)}</span>
  }
  if (p.kind === 'rvgContractRate') {
    return (
      <span>
        RVG at <span className="mono">{formatCurrency(p.unitRate)}</span> per unit
      </span>
    )
  }
  if (p.kind === 'rvgDiscount') {
    return (
      <span>
        RVG less <span className="mono">{p.discountPct}%</span>
      </span>
    )
  }
  return <span>{pricingLabel(p)}</span>
}

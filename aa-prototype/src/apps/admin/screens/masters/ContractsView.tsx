/**
 * Master data, Contracts (catch-up Phase 18; US-04.1.1, US-04.1.2, US-04.1.4,
 * US-04.2.1). One search over name, holder reference code and AA code, the
 * Active (default), Disabled or All filter and a holder Party filter (also
 * reached from a Party's "active" link as `?holder=`), results under holder
 * headings with No contract · RVG first. Office only (D42). Each row opens the
 * Contract editor; nothing is deleted. Hundreds of Contracts arrive with
 * Phase 19a, so the list is always searched, never browsed bare.
 *
 * Catch-up Phase 18a: a filter by funding tag beside the holder filter; each
 * row shows its tag as a neutral pill and its specialties in mist; the system
 * Contracts (No contract · RVG and the Fixed price fallbacks) carry a "System"
 * pill. No control shows or hides Contracts by specialty here.
 */

import { isOfficeContract } from '../../../../domain/billing/fallbacks'
import { contractInvoicingSummary } from '../../../../domain/billing/invoicePresentation'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { contractSearch, type ContractStatusFilter } from '../../../../domain/billing/contracts'
import { formatRangeDate, formatRangePrice, rangeSummary, rangeSummaryText } from '../../../../domain/billing/priceRanges'
import { formatCurrency } from '../../../../shared/format'
import type { Contract } from '../../../../domain/types'
import { useAppStore, useToday, type Actor } from '../../../../store'
import { fundingTagsInOrder } from '../../../../domain/billing/fundingTags'
import { specialtyNames } from '../../../../domain/specialties'
import { FieldLabel, Segmented } from '../../../../shared'
import { NameSearchBox, SelectField } from '../../../../shared/ui'
import { BILLS_LABEL, PARTY_KIND_LABEL, STATUS_LABEL, pricingLabel } from '../../../../shared/contracts'
import { neutral } from '../../../../theme/tokens'
import { ContractPanel } from '../../flows/ContractEditSheet'
import { Pill } from '../../components/MasterPills'
import { isRvgKind } from '../../../../domain/billing/contracts'
import { ClickableRow, GroupRow } from '../../../../shared/table'
import { EditCell, MasterHeader, MasterTable } from './chrome'
import { EmptyState, TextAction } from '../../../../shared/ui'
import { rowCellStyle } from './tableStyles'

/** Layout and Delivery are derived and read-only (catch-up Phase 22; US-04.2.8): nothing about invoicing is stored on a Contract. */
const COLUMNS = ['AA code', 'Name', 'Bills', 'Layout', 'Delivery', 'Pricing', 'Tags', 'Status', '']

export function ContractsView({ actor }: { actor: Actor }) {
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
  // `?contract=<id>` opens that Contract's panel (a loaded row's link from Seed load); the param is then dropped.
  const [panel, setPanel] = useState<{ id?: string } | null>(() => {
    const id = params.get('contract')
    return id !== null && contracts[id] !== undefined ? { id } : null
  })
  useEffect(() => {
    if (params.get('contract') === null) return
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.delete('contract')
      return copy
    }, { replace: true })
  }, [params, setParams])
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
      <MasterHeader
        title="Contracts"
        sub="Every arrangement is a Contract held by a Party, with its own AA code, who it bills and how it is priced. Contracts are edited in place and disabled, never deleted. A fixed price changes from a date by adding a price range; any other change that must start on a date is a new Contract."
        add={{ label: 'New contract', onClick: () => setPanel({}) }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div data-shot="contract-search" style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Search</FieldLabel>
          <NameSearchBox size="pill" width="100%" value={query} onChange={setQuery} label="Search by name, code or AA code" />
          <div data-shot="contract-result-count" style={{ fontSize: 12.5, color: neutral.slate }}>
            <span className="mono">{results.length}</span> {results.length === 1 ? 'Contract' : 'Contracts'}
            {status === 'active' ? ' active' : status === 'disabled' ? ' disabled' : ''}
            {holderId !== '' ? ` held by ${parties[holderId]?.name ?? holderId}` : ''}
            {tagId !== '' ? ` tagged ${fundingTags[tagId]?.code ?? tagId}` : ''}
            {query.trim() !== '' ? ` matching "${query.trim()}"` : ''}
          </div>
        </div>
        <div data-shot="contract-status-filter" style={{ width: 260 }}>
          <Segmented
            label="Status"
            value={status}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
              { value: 'all', label: 'All' },
            ]}
            onChange={setStatus}
          />
        </div>
        <SelectField label="Holder" labelShot="contract-holder-filter" width={210} size="compact" fill="surface" value={holderId} onChange={setHolder}>
          <option value="">Every holder</option>
          {holderOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </SelectField>
        <SelectField label="Funding tag" labelShot="contract-tag-filter" width={140} size="compact" fill="surface" value={tagId} onChange={setTagFilter}>
          <option value="">Every tag</option>
          {fundingTagsInOrder(fundingTags).map((t) => (
            <option key={t.id} value={t.id}>{t.code}</option>
          ))}
        </SelectField>
      </div>

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
        <MasterTable columns={COLUMNS} rightAlign={[8]} shot="contract-catalogue" label="Contracts">
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
                  onOpen={() => setPanel({ id: c.id })}
                >
                  <td className="mono" style={{ ...rowCellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.aaCode}</td>
                  <td style={{ ...rowCellStyle, fontWeight: 500 }}>
                    {c.name}
                    {c.holderReference !== undefined && <span className="mono" style={{ color: neutral.mist, marginLeft: 8 }}>{c.holderReference}</span>}
                    {c.specialtyIds.length > 0 && (
                      <div style={{ fontSize: 12.5, color: neutral.mist, fontWeight: 400, marginTop: 2 }}>{specialtyNames({ specialties }, c.specialtyIds).join(', ')}</div>
                    )}
                  </td>
                  <td style={rowCellStyle}>{BILLS_LABEL[c.billsTo]}</td>
                  <td data-shot="contract-layout" style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{contractInvoicingSummary(c, party).layout}</td>
                  <td data-shot="contract-delivery" style={rowCellStyle}>{contractInvoicingSummary(c, party).delivery}</td>
                  <td style={rowCellStyle}><PricingText contract={c} todayISO={today} /></td>
                  <td style={rowCellStyle}>
                    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.systemRole !== undefined && <Pill shot="contract-system-pill">System</Pill>}
                      {c.fundingTagId !== undefined && <Pill><span className="mono">{fundingTags[c.fundingTagId]?.code ?? c.fundingTagId}</span></Pill>}
                      {c.prepaid && <Pill>Prepaid</Pill>}
                      {/* Who may change the price (catch-up Phase 24; US-04.2.2): on RVG kinds only, from 18's setting. */}
                      {isRvgKind(c.pricing.kind) && (
                        <Pill shot="contract-override-pill">{c.anaesthetistMayOverridePrice ? 'Anaesthetist can override the price' : 'Price fixed for the anaesthetist'}</Pill>
                      )}
                    </span>
                  </td>
                  <td style={rowCellStyle}>
                    <Pill tone={c.status === 'active' ? 'success' : 'neutral'}>{STATUS_LABEL[c.status]}</Pill>
                  </td>
                  <EditCell onClick={() => setPanel({ id: c.id })} label={`Edit ${c.name}`} style={rowCellStyle} />
                </ClickableRow>
              )),
            ]
          })}
        </MasterTable>
      )}

      {panel !== null && (
        <ContractPanel
          key={panel.id ?? 'new'}
          open
          actor={actor}
          contract={panel.id !== undefined ? contracts[panel.id] : undefined}
          {...(panel.id === undefined && holderId !== '' ? { initialHolderId: holderId } : {})}
          onClose={() => setPanel(null)}
        />
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

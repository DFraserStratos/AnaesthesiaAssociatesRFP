/**
 * The grouped Contract catalogue (build plan Phase 47; US-04.1.2, D96), the Contracts section's
 * first tab. Layout: `docs/explorations/contracts-section.html` #catalogue. One search over name,
 * holder reference code, AA code and invoice wording (`contractSearch`), the Active (default),
 * Disabled or All filter, and a Group by control with six groupings (`groupContracts`): an index of
 * the groups and their counts sits beside the table, which lists every group, or the picked group
 * under its sub-headings. Office only (D42). Each row opens the Contract's page at its id; there are
 * no checkboxes and no bulk actions (D95).
 *
 * The URL holds the grouping (`?group=`), the picked group (`?in=`, an id), the search (`?q=`) and
 * the page (`?page=`), so a link can say "Funding tag, ACC" and the Contract page's back link
 * returns to the same view. A bare `/admin/contracts` opens on the office user's last grouping
 * (`shell.contractGrouping`), else Kind. The old holder filter is the holder grouping: `?holder=`
 * is rewritten to `?group=holder&in=<PartyId>`. Status stays out of the URL: Active by default, and
 * a group holding only Disabled Contracts opens on All.
 *
 * Each row shows its tag as a neutral pill and its specialties in mist; the system Contracts
 * (No contract · RVG and the Fixed price fallbacks) carry a "System" pill and group by their own
 * settings like any other.
 */

import { isOfficeContract } from '../../../../domain/billing/fallbacks'
import { contractInvoicingSummary } from '../../../../domain/billing/invoicePresentation'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { contractSearch, type ContractStatusFilter } from '../../../../domain/billing/contracts'
import { CONTRACT_GROUPINGS, groupContracts, groupCount, parseContractGrouping, type ContractGroup, type ContractGrouping } from '../../../../domain/billing/contractGroups'
import { formatRangeDate, formatRangePrice, rangeSummary, rangeSummaryText } from '../../../../domain/billing/priceRanges'
import { FULL_SCALE } from '../../../../domain/seed/fullScale/constants'
import { formatCount, formatCurrency } from '../../../../shared/format'
import type { Contract } from '../../../../domain/types'
import { useAppStore, useToday } from '../../../../store'
import { specialtyNames } from '../../../../domain/specialties'
import { FilterPills, NameSearchBox, SelectField } from '../../../../shared/ui'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { GroupIndex } from '../../components/GroupIndex'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { BILLS_LABEL, CONTRACT_GROUP_WORDS, OVERRIDE_PILL_LABEL, STATUS_LABEL, pricingLabel } from '../../../../shared/contracts'
import { neutral, type as typeScale } from '../../../../theme/tokens'
import { Pill } from '../../components/MasterPills'
import { isRvgKind } from '../../../../domain/billing/contracts'
import { ClickableRow, GroupRow, RowOpenButton } from '../../../../shared/table'
import { LoadResultBanner, MasterTable } from '../masters/chrome'
import { EmptyState, TextAction } from '../../../../shared/ui'
import { rowCellStyle } from '../masters/tableStyles'
import { contractPath } from '../../contractsPaths'

/**
 * Invoicing holds who it bills, the invoice layout and the delivery, one over the other, and the
 * status leads the tags, so the list fits a 1280 laptop beside the index without scrolling
 * sideways. No Holder column: the group or sub-heading names the holder.
 */
const COLUMNS = ['AA code', 'Name', 'Invoicing', 'Pricing', 'Status · tags']

const PAGE_SIZE = FULL_SCALE.pageSizes.contracts

const TWO_SURGEONS_NOTE = 'A Contract linked to two surgeons shows under both.'

/** One row of the table, in display order: the entry with its group and, on a picked group, its sub-heading. */
interface DisplayEntry {
  group: ContractGroup
  contract: Contract
  subKey: string
  subLabel: string
}

/** Whether a sub-heading is a funding tag code (set in mono): Holder's tags, and a hospital's under Invoice goes to. */
function tagSub(grouping: ContractGrouping, groupKey: string, subKey: string): boolean {
  return (grouping === 'holder' && subKey !== 'none') || (grouping === 'destination' && groupKey.startsWith('hospital:'))
}

/** Whether a group holds no Active Contract of the office's own but at least one Disabled one (a Party's old link opens on All). */
function onlyDisabled(group: ContractGroup | undefined): boolean {
  if (group === undefined) return false
  const own = group.entries.map((e) => e.contract).filter(isOfficeContract)
  return own.length > 0 && own.every((c) => c.status === 'disabled')
}

export function ContractsView() {
  const navigate = useNavigate()
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const fundingTags = useAppStore((s) => s.masters.fundingTags)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const officeUser = useAppStore((s) => s.shell.officeUser ?? 'kirsty')
  const remembered = useAppStore((s) => s.shell.contractGrouping?.[s.shell.officeUser ?? 'kirsty'])
  const setContractGrouping = useAppStore((s) => s.setContractGrouping)
  const today = useToday()
  const [params, setParams] = useSearchParams()
  // The list route only: `/admin/contracts/new` keeps its own `?holder=` for the create panel.
  const onList = useLocation().pathname.replace(/\/$/, '') === '/admin/contracts'

  // The old holder filter is the holder grouping (D93's redirected `&holder=`, a Party's link, a bookmark).
  const holderParam = onList ? params.get('holder') : null
  const grouping: ContractGrouping = holderParam !== null ? 'holder' : (parseContractGrouping(params.get('group')) ?? remembered ?? CONTRACT_GROUPINGS.defaultValue)
  const inParam = holderParam ?? params.get('in') ?? ''
  // The search is the list's own state, so it survives New contract's panel (45); a Contract page's
  // back link brings it back as `?q=`, which seeds it and leaves the URL.
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const page = pageParam(params.get('page'))

  const masters = useMemo(() => ({ parties, fundingTags, surgeons }), [parties, fundingTags, surgeons])
  // Every group this grouping can have (any status, no search): `?in=` must name one of these, and the label of a picked group with no matches comes from here.
  const allGroups = useMemo(
    () => groupContracts(contractSearch('', { contracts, parties, filters: { status: 'all' } }), grouping, masters, CONTRACT_GROUP_WORDS),
    [contracts, parties, grouping, masters],
  )
  const picked = allGroups.find((g) => g.key === inParam)
  const pickedKey = picked?.key ?? ''

  // Active by default; arriving on a group that holds only Disabled Contracts opens on All.
  const [status, setStatus] = useState<ContractStatusFilter>(() => (onlyDisabled(picked) ? 'all' : 'active'))

  useEffect(() => {
    if (params.get('q') === null) return
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev)
        copy.delete('q')
        return copy
      },
      { replace: true },
    )
  }, [params, setParams])

  useEffect(() => {
    if (holderParam === null) return
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev)
        copy.delete('holder')
        copy.delete('page')
        if (parties[holderParam] !== undefined) {
          copy.set('group', 'holder')
          copy.set('in', holderParam)
        } else copy.delete('in')
        return copy
      },
      { replace: true },
    )
  }, [holderParam, parties, setParams])

  /** Change the URL's view: any key set to '' is dropped, and the page returns to 1. */
  function setView(next: { group?: ContractGrouping; in?: string; page?: number }) {
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev)
        copy.delete('holder')
        for (const [k, v] of Object.entries(next)) {
          if (k === 'page') continue
          if (v === '' || v === undefined) copy.delete(k)
          else copy.set(k, String(v))
        }
        if (next.page !== undefined && next.page > 1) copy.set('page', String(next.page))
        else copy.delete('page')
        return copy
      },
      { replace: true },
    )
  }

  function pickGrouping(by: ContractGrouping) {
    setContractGrouping(officeUser, by)
    setView({ group: by, in: '' })
  }

  const results = useMemo(() => contractSearch(query, { contracts, parties, rvgGroups, filters: { status } }), [query, contracts, parties, rvgGroups, status])
  const groups = useMemo(() => groupContracts(results, grouping, masters, CONTRACT_GROUP_WORDS), [results, grouping, masters])
  const allCount = useMemo(() => groupCount(groups), [groups])
  const shownGroups = useMemo(() => (pickedKey === '' ? groups : groups.filter((g) => g.key === pickedKey)), [groups, pickedKey])
  const entries = useMemo<DisplayEntry[]>(
    () => shownGroups.flatMap((group) => group.entries.map((e) => ({ group, ...e }))),
    [shownGroups],
  )
  const pages = pageWindow(entries.length, PAGE_SIZE, page)
  const rows = pageOf(entries, PAGE_SIZE, pages.page)
  const subCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) m.set(`${e.group.key}|${e.subKey}`, (m.get(`${e.group.key}|${e.subKey}`) ?? 0) + 1)
    return m
  }, [entries])

  const groupingLabel = CONTRACT_GROUPINGS.options.find((o) => o.value === grouping)?.label ?? ''
  const shownCount = pickedKey === '' ? allCount : (groups.find((g) => g.key === pickedKey)?.entries.length ?? 0)
  const filtered = query.trim() !== '' || status !== 'active'
  const fromParams = new URLSearchParams(params)
  if (query.trim() !== '') fromParams.set('q', query)
  const listFrom = `/admin/contracts${fromParams.toString() === '' ? '' : `?${fromParams.toString()}`}`
  const open = (c: Contract) => navigate(contractPath(c.id), { state: { from: listFrom } })

  return (
    <>
      <LoadResultBanner view="contracts" />

      <PageToolbar
        end={
          <span data-shot="contract-result-count">
            <span className="mono">{formatCount(shownCount)}</span> {shownCount === 1 ? 'Contract' : 'Contracts'}
            {status === 'active' ? ' active' : status === 'disabled' ? ' disabled' : ''}
            {picked !== undefined ? ` in ${picked.label}` : ''}
            {query.trim() !== '' ? ` matching "${query.trim()}"` : ''}. Grouped by {groupingLabel.toLowerCase()}.
          </span>
        }
      >
        <div data-shot="contract-search">
          <NameSearchBox size="pill" width={260} value={query} onChange={(q) => {
              setQuery(q)
              setView({})
            }} label="Search by name, code or AA code" />
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
            onSelect={(s) => {
              setStatus(s)
              setView({})
            }}
          />
        </div>
        <SelectField label="Group by" hideLabel labelShot="contract-group-by" width={190} size="compact" fill="surface" value={grouping} onChange={(v) => pickGrouping(parseContractGrouping(v) ?? CONTRACT_GROUPINGS.defaultValue)}>
          {CONTRACT_GROUPINGS.options.map((o) => (
            <option key={o.value} value={o.value}>{`Group by: ${o.label}`}</option>
          ))}
        </SelectField>
      </PageToolbar>

      <PageBody
        gap={12}
        nav={
          <GroupIndex
            label="Groups"
            shot="contract-group-index"
            data-grouping={grouping}
            items={groups.map((g) => ({ key: g.key, label: g.label, count: g.entries.length, ...(g.section !== undefined ? { section: g.section } : {}) }))}
            value={pickedKey}
            allLabel="All Contracts"
            allCount={allCount}
            onSelect={(key) => setView({ in: key })}
            {...(grouping === 'surgeon' ? { note: TWO_SURGEONS_NOTE } : {})}
          />
        }
      >
        {entries.length === 0 ? (
          <EmptyState
            variant="card"
            shot="contract-catalogue"
            title="No Contracts match."
            action={
              filtered || pickedKey !== '' ? (
                <TextAction
                  size="sm"
                  flush
                  onClick={() => {
                    setQuery('')
                    setStatus('all')
                    setView({ in: '' })
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
          <MasterTable
            columns={COLUMNS}
            shot="contract-catalogue"
            label="Contracts"
            {...(pages.pages > 1 ? { footer: <Pager total={entries.length} size={PAGE_SIZE} page={pages.page} onPage={(p) => setView({ page: p })} lead="Showing" shot="contract-pager" /> } : {})}
          >
            {rows.map((e, i) => {
              const prev = rows[i - 1]
              const newGroup = prev === undefined || prev.group.key !== e.group.key
              const newSub = pickedKey !== '' && (newGroup || prev.subKey !== e.subKey)
              const party = parties[e.contract.holderId]
              return [
                newGroup && (
                  <GroupRow
                    key={`g-${e.group.key}-${i}`}
                    span={COLUMNS.length}
                    data-contract-group={e.group.key}
                    {...(grouping === 'holder' ? { 'data-contract-holder': e.group.key } : {})}
                    style={{ paddingTop: 10, paddingBottom: 8, color: neutral.ink }}
                  >
                    <span className={grouping === 'tag' && e.group.key !== 'none' ? 'mono' : undefined} style={{ fontWeight: 700, fontSize: pickedKey !== '' ? typeScale.body.size : typeScale.label.size, color: neutral.ink, marginRight: 8 }}>{e.group.label}</span>
                    <Pill size="sm" mono>{formatCount(e.group.entries.length)}</Pill>
                  </GroupRow>
                ),
                newSub && (
                  <GroupRow
                    key={`s-${e.group.key}-${e.subKey}-${i}`}
                    span={COLUMNS.length}
                    level="sub"
                    data-contract-sub={e.subKey}
                    {...(grouping !== 'holder' && parties[e.subKey] !== undefined ? { 'data-contract-holder': e.subKey } : {})}
                  >
                    <span className={tagSub(grouping, e.group.key, e.subKey) ? 'mono' : undefined} style={{ color: neutral.ink, marginRight: 8 }}>{e.subLabel}</span>
                    <Pill size="sm" mono>{formatCount(subCounts.get(`${e.group.key}|${e.subKey}`) ?? 0)}</Pill>
                  </GroupRow>
                ),
                <ContractRow key={`${e.group.key}-${e.contract.id}`} contract={e.contract} party={party} onOpen={() => open(e.contract)} todayISO={today} specialties={specialties} fundingTags={fundingTags} />,
              ]
            })}
          </MasterTable>
        )}
      </PageBody>
    </>
  )
}

function ContractRow({
  contract: c,
  party,
  onOpen,
  todayISO,
  specialties,
  fundingTags,
}: {
  contract: Contract
  party: Parameters<typeof contractInvoicingSummary>[1]
  onOpen: () => void
  todayISO: string
  specialties: Parameters<typeof specialtyNames>[0]['specialties']
  fundingTags: Readonly<Record<string, { code: string }>>
}) {
  const invoicing = contractInvoicingSummary(c, party)
  return (
    <ClickableRow data-contract={c.id} data-system={c.systemRole !== undefined ? c.systemRole : undefined} onOpen={onOpen}>
      <td className="mono" style={{ ...rowCellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.aaCode}</td>
      <td style={{ ...rowCellStyle, fontWeight: 500 }}>
        <RowOpenButton label={`Open ${c.name}`} onOpen={onOpen}>{c.name}</RowOpenButton>
        {c.holderReference !== undefined && <span className="mono" style={{ color: neutral.mist, marginLeft: 8 }}>{c.holderReference}</span>}
        {c.specialtyIds.length > 0 && (
          <div style={{ fontSize: 12.5, color: neutral.mist, fontWeight: 400, marginTop: 2 }}>{specialtyNames({ specialties }, c.specialtyIds).join(', ')}</div>
        )}
      </td>
      <td style={rowCellStyle}>
        <div>{`Bills the ${BILLS_LABEL[c.billsTo].toLowerCase()}`}</div>
        <div data-shot="contract-layout" style={{ fontSize: 12, color: neutral.slate, whiteSpace: 'nowrap' }}>{invoicing.layout}</div>
        <div data-shot="contract-delivery" style={{ fontSize: 12, color: neutral.slate }}>{invoicing.delivery}</div>
      </td>
      <td style={rowCellStyle}><PricingText contract={c} todayISO={todayISO} /></td>
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

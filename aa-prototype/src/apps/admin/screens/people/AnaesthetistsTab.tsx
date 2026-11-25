import { useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { formatGstNumber } from '../../../../domain/billing/invoicePresentation'
import { maskBankAccount } from '../../../../domain/bankAccount'
import { format, parseISO } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { TIER_LABELS, TIER_VALUES, tierFor } from '../../../../domain/pairingPreferences'
import { useAppStore, useToday, type Actor } from '../../../../store'
import { statusOn } from '../../../../domain/anaesthetistStatus'
import { EditAnaesthetistSheet } from '../../flows/EditAnaesthetistSheet'
import { AddAnaesthetistFlow } from '../../flows/AddAnaesthetistFlow'
import { TierPill, usePriorityTiers } from '../../components/pairing'
import { ClickableRow } from '../../../../shared/table'
import { Button, EmptyState, FilterPills, NameSearchBox, TextAction } from '../../../../shared/ui'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { EditCell, MasterTable, type MasterColumn } from '../masters/chrome'
import { rowCellStyle } from '../masters/tableStyles'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { anaesthetistRecordPath } from '../../peoplePaths'
import { anaesthetistStatusLabel, formatCount, formatCurrency, HPI_CPN_LABEL } from '../../../../shared/format'
import { RATE_PER_UNIT } from '../../../../shared/profile/profileCopy'
import { PeoplePage, usePeopleListParams } from './PeopleSection'
import { PEOPLE_PAGE_SIZE } from './peopleTabs'
import { anaesthetistRows, type AnaesthetistStatusFilter } from './peopleLists'

/**
 * The columns: the short ones never wrap, and the name and the email take the spare width. Each
 * column holds two facts, one over the other (the registration over the HPI CPN, the bank account
 * over the GST number, the email over the phone, the start date over the status), so the table fits a
 * 1280 laptop without scrolling sideways. The rate per unit stays the third column.
 */
const COLUMNS: readonly MasterColumn[] = [
  'Name',
  `Reg · ${HPI_CPN_LABEL}`,
  RATE_PER_UNIT,
  'Tier',
  'Bank account · GST',
  'Email · phone',
  'Start date',
  '',
]

const STATUS_OPTIONS: readonly { value: AnaesthetistStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
]

/** The list's tier filter (build plan Phase 50; US-01.3.6): All, then Tier 1 to Tier 4. */
const TIER_FILTER_OPTIONS = [{ value: 'all', label: 'All tiers' }, ...TIER_VALUES.map((t) => ({ value: String(t), label: TIER_LABELS[t] }))]

const DEFAULTS = { q: '', status: 'active', tier: 'all' } as const

function parseStatus(value: string): AnaesthetistStatusFilter {
  return value === 'inactive' || value === 'all' ? value : 'active'
}

/**
 * People · Anaesthetists (build plan Phase 53, from Master data; catch-up Phases 17 and 26, build plan
 * Phases 50 and 52): searched by name, registration number or HPI CPN, Active, Inactive or All on the
 * demo clock's today (`isActiveOn`), filtered by tier (office only), in surname order, 50 a page. A
 * row opens the anaesthetist's page. The row's "Edit" link and "Add anaesthetist" keep their names:
 * the catalogue's capture recipes click them.
 */
export function AnaesthetistsTab({ actor }: { actor: Actor }) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const tiers = usePriorityTiers()
  const todayISO = useToday()
  const navigate = useNavigate()
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const list = usePeopleListParams(DEFAULTS)
  const q = list.get('q')
  const status = parseStatus(list.get('status'))
  const tier = TIER_FILTER_OPTIONS.some((o) => o.value === list.get('tier')) ? list.get('tier') : 'all'
  const rows = useMemo(
    () => anaesthetistRows(Object.values(anaesthetists), { q, status, tier }, todayISO, (id) => tierFor(tiers, id)),
    [anaesthetists, q, status, tier, todayISO, tiers],
  )
  const pages = pageWindow(rows.length, PEOPLE_PAGE_SIZE, pageParam(list.get('page')))
  const shown = pageOf(rows, PEOPLE_PAGE_SIZE, pages.page)
  const tierLabel = TIER_FILTER_OPTIONS.find((o) => o.value === tier && o.value !== 'all')?.label
  const narrowed = q.trim() !== '' || status !== 'active' || tier !== 'all'
  const editing = editId !== null ? anaesthetists[editId] : undefined

  return (
    <PeoplePage
      tab="anaesthetists"
      shot="people-anaesthetists"
      sub={
        <>
          <span>Open an anaesthetist for their record, rate, tier and pairing preferences. Adding one creates their sessions from their start date.</span>{' '}
          <span data-seeded-line>{SEEDED_SUBTITLE}</span>
        </>
      }
      actions={<Button variant="primary" size="desktop" onClick={() => setAdding(true)}>Add anaesthetist</Button>}
    >
      <PageToolbar
        end={
          <span data-shot="people-result-count">
            <span className="mono">{formatCount(rows.length)}</span> {rows.length === 1 ? 'anaesthetist' : 'anaesthetists'}
            {status === 'active' ? ' active' : status === 'inactive' ? ' inactive' : ''}
            {tierLabel !== undefined ? ` in ${tierLabel}` : ''}
            {q.trim() !== '' ? ` matching "${q.trim()}"` : ''}
          </span>
        }
      >
        <NameSearchBox size="pill" width={260} value={q} onChange={(next) => list.set({ q: next })} label="Search by name, registration or HPI CPN" placeholder="Name, registration or HPI CPN" shot="people-search" />
        <FilterPills ariaLabel="Status" value={status} options={STATUS_OPTIONS} onSelect={(next) => list.set({ status: next })} />
        <div data-shot="tier-filter-list">
          <FilterPills ariaLabel="Filter by tier" value={tier} options={TIER_FILTER_OPTIONS} onSelect={(next) => list.set({ tier: next })} />
        </div>
      </PageToolbar>
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState
            variant="card"
            shot="masters-anaesthetists"
            title="No anaesthetists match."
            action={narrowed ? <TextAction size="sm" flush onClick={() => list.set({ q: '', status: 'all', tier: 'all' })}>Search all anaesthetists</TextAction> : undefined}
          >
            Check the spelling, or search everyone, inactive anaesthetists included.
          </EmptyState>
        ) : (
          <MasterTable
            columns={COLUMNS}
            rightAlign={[7]}
            shot="masters-anaesthetists"
            label="Anaesthetists"
            {...(pages.pages > 1 ? { footer: <Pager total={rows.length} size={PEOPLE_PAGE_SIZE} page={pages.page} onPage={(p) => list.set({ page: String(p) })} lead="Anaesthetists" shot="people-pager" /> } : {})}
          >
            {shown.map((a) => {
              const st = statusOn(a, todayISO)
              return (
                <ClickableRow
                  key={a.registrationNumber}
                  data-anaesthetist={a.registrationNumber}
                  onOpen={() => navigate(anaesthetistRecordPath(a.registrationNumber))}
                >
                  <td style={rowCellStyle}>
                    <Link className="aa-table-entity-link" to={anaesthetistRecordPath(a.registrationNumber)}>
                      <span className="aa-table-entity-link-title">{a.name}</span>
                    </Link>
                  </td>
                  {/* The registration number over the HPI CPN. */}
                  <td className="mono" style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>
                    <div>{a.registrationNumber}</div>
                    <div style={{ fontSize: 12, color: neutral.slate }}>{a.hpiId}</div>
                  </td>
                  <td className="mono" style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{formatCurrency(a.unitValue)}</td>
                  <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}><TierPill tier={tierFor(tiers, a.registrationNumber)} /></td>
                  {/* The bank account over the GST number: one column, so the table fits a laptop without scrolling sideways. */}
                  <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>
                    <div data-shot="anaesthetist-bank" className="mono">{maskBankAccount(a.bankAccount.accountNumber)}</div>
                    <div data-shot="anaesthetist-gst-number" className={a.gstNumber !== undefined ? 'mono' : undefined} style={{ fontSize: 12, color: a.gstNumber !== undefined ? neutral.slate : neutral.mist }}>
                      {a.gstNumber !== undefined ? formatGstNumber(a.gstNumber) : 'Not held'}
                    </div>
                  </td>
                  {/* Email over phone: the column that takes the spare width. */}
                  <td style={rowCellStyle}>
                    <div style={{ overflowWrap: 'anywhere' }}>{a.email}</div>
                    <div style={{ fontSize: 12, color: neutral.slate, whiteSpace: 'nowrap' }}>{a.phone}</div>
                  </td>
                  <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>
                    <div className="mono">{format(parseISO(a.startDateISO), 'd MMM yyyy')}</div>
                    {/* Phase 52: the status on the demo clock's today (`statusOn`): Active, Inactive from <day>, Inactive. */}
                    <div data-anaesthetist-status={st.kind} style={{ fontSize: 12, color: st.kind === 'inactive' ? neutral.mist : neutral.slate }}>
                      {anaesthetistStatusLabel(st)}
                    </div>
                  </td>
                  <EditCell onClick={() => setEditId(a.registrationNumber)} style={rowCellStyle} />
                </ClickableRow>
              )
            })}
          </MasterTable>
        )}
      </PageBody>
      {editing !== undefined && (
        <EditAnaesthetistSheet open anaesthetist={editing} actor={actor} onClose={() => setEditId(null)} />
      )}
      <AddAnaesthetistFlow open={adding} actor={actor} onClose={() => setAdding(false)} />
    </PeoplePage>
  )
}

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { pairingCounts } from '../../../../domain/pairingPreferences'
import { NO_HPI_CPN } from '../../../../domain/surgeons'
import { officeAddressFor } from '../../../../domain/surgeonContacts'
import { isRetired } from '../../../../domain/masterLifecycle'
import { useAppStore, type Actor } from '../../../../store'
import { specialtiesInOrder, surgeonSpecialtyLabel } from '../../../../domain/specialties'
import { ClickableRow } from '../../../../shared/table'
import { Button, EmptyState, FilterPills, NameSearchBox, SelectField, TextAction } from '../../../../shared/ui'
import { SurgeonEditSheet } from '../../flows/SurgeonEditSheet'
import { NotPreferredPill, PreferredPill, usePairingEntries } from '../../components/pairing'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { MasterTable, RetiredPill, retiredRowStyle } from '../masters/chrome'
import { rowCellStyle } from '../masters/tableStyles'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { surgeonProfilePath } from '../../peoplePaths'
import { formatCount, HPI_CPN_LABEL } from '../../../../shared/format'
import { PeoplePage, usePeopleListParams } from './PeopleSection'
import { PEOPLE_PAGE_SIZE } from './peopleTabs'
import { surgeonRows, type SurgeonStatusFilter } from './peopleLists'

/**
 * People · Surgeons (build plan Phase 53, from Master data; catch-up Phases 17, 17b and 42; US-13.4.1
 * "Find a person", US-13.6.2): AA's address book of surgeons, searched by name, practice name or HPI
 * CPN, filtered by specialty and by Active, Retired or All, in surname order, 50 a page. Each row
 * shows the surgeon's practice, the office contact the office's emails go to first
 * (`officeAddressFor`) and the HPI CPN or "No HPI CPN yet"; it opens the surgeon's page, edited card
 * by card (Phase 55); Add surgeon opens the create-only sheet. There is no surgeon group list (D98): a group that holds Contracts
 * is a Party.
 */

const mist = { color: neutral.mist }

const STATUS_OPTIONS: readonly { value: SurgeonStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'all', label: 'All' },
]

const DEFAULTS = { q: '', status: 'active', specialty: 'all' } as const

function parseStatus(value: string): SurgeonStatusFilter {
  return value === 'retired' || value === 'all' ? value : 'active'
}

function SurgeonLink({ id, name }: { id: string; name: string }) {
  return (
    <Link className="aa-table-entity-link" to={surgeonProfilePath(id)} style={{ color: 'inherit' }}>
      <span className="aa-table-entity-link-title" style={{ fontWeight: 500 }}>{name}</span>
    </Link>
  )
}

export function SurgeonsTab({ actor }: { actor: Actor }) {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const entries = usePairingEntries()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const list = usePeopleListParams(DEFAULTS)
  const q = list.get('q')
  const status = parseStatus(list.get('status'))
  const specialtyId = specialties[list.get('specialty')] !== undefined ? list.get('specialty') : 'all'
  const rows = useMemo(() => surgeonRows(Object.values(surgeons), { q, status, specialtyId }), [surgeons, q, status, specialtyId])
  const pages = pageWindow(rows.length, PEOPLE_PAGE_SIZE, pageParam(list.get('page')))
  const shown = pageOf(rows, PEOPLE_PAGE_SIZE, pages.page)
  const specialtyName = specialtyId !== 'all' ? specialties[specialtyId]?.name : undefined
  const narrowed = q.trim() !== '' || status !== 'active' || specialtyId !== 'all'

  return (
    <PeoplePage
      tab="surgeons"
      shot="people-surgeons"
      sub={
        <>
          <span>AA's address book of surgeons. Open a surgeon for their contacts, pairing preferences, Contracts and next Lists.</span>{' '}
          <span data-seeded-line>{SEEDED_SUBTITLE}</span>
        </>
      }
      actions={<Button variant="primary" size="desktop" onClick={() => setAdding(true)}>Add surgeon</Button>}
    >
      <PageToolbar
        end={
          <span data-shot="people-result-count">
            <span className="mono">{formatCount(rows.length)}</span> {rows.length === 1 ? 'surgeon' : 'surgeons'}
            {status === 'active' ? ' active' : status === 'retired' ? ' retired' : ''}
            {specialtyName !== undefined ? ` in ${specialtyName}` : ''}
            {q.trim() !== '' ? ` matching "${q.trim()}"` : ''}
          </span>
        }
      >
        <NameSearchBox size="pill" width={260} value={q} onChange={(next) => list.set({ q: next })} label="Search by name, practice or HPI CPN" placeholder="Name, practice or HPI CPN" shot="people-search" />
        <FilterPills ariaLabel="Status" value={status} options={STATUS_OPTIONS} onSelect={(next) => list.set({ status: next })} />
        <SelectField label="Specialty" hideLabel labelShot="people-specialty-filter" width={210} size="compact" fill="surface" value={specialtyId} onChange={(next) => list.set({ specialty: next })}>
          <option value="all">All specialties</option>
          {specialtiesInOrder(specialties).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
      </PageToolbar>
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState
            variant="card"
            shot="masters-surgeons"
            title="No surgeons match."
            action={narrowed ? <TextAction size="sm" flush onClick={() => list.set({ q: '', status: 'all', specialty: 'all' })}>Search all surgeons</TextAction> : undefined}
          >
            Check the spelling, or search every surgeon, retired ones included.
          </EmptyState>
        ) : (
          <MasterTable
            columns={['Name', 'Specialties', 'Practice', 'Office contact', HPI_CPN_LABEL, 'Pairings']}
            shot="masters-surgeons"
            label="Surgeons"
            {...(pages.pages > 1 ? { footer: <Pager total={rows.length} size={PEOPLE_PAGE_SIZE} page={pages.page} onPage={(p) => list.set({ page: String(p) })} lead="Surgeons" shot="people-pager" /> } : {})}
          >
            {shown.map((s) => {
              const counts = pairingCounts(entries, { surgeonId: s.id })
              const to = officeAddressFor({ surgeons }, s.id).to
              const retired = isRetired(s)
              return (
                <ClickableRow
                  key={s.id}
                  data-surgeon={s.id}
                  data-practice={s.practiceName ?? ''}
                  data-hpi={s.hpiId ?? ''}
                  data-retired={retired ? 'true' : undefined}
                  onOpen={() => navigate(surgeonProfilePath(s.id))}
                  style={retired ? retiredRowStyle : undefined}
                >
                  <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <SurgeonLink id={s.id} name={s.name} />
                      {retired && <RetiredPill reason={s.retiredReason} />}
                    </span>
                  </td>
                  <td style={rowCellStyle}>{surgeonSpecialtyLabel({ specialties }, s)}</td>
                  <td style={rowCellStyle}>{s.practiceName ?? <span style={mist}>Not recorded</span>}</td>
                  <td style={rowCellStyle} data-office-to={to?.email ?? ''}>
                    {to === null ? (
                      <span style={mist}>None held</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                        {to.name !== undefined && <span>{to.name}</span>}
                        <span className="mono" style={{ fontSize: 12.5, color: retired ? neutral.mist : neutral.slate, overflowWrap: 'anywhere' }}>{to.email}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{s.hpiId !== undefined ? <span className="mono">{s.hpiId}</span> : <span style={mist}>{NO_HPI_CPN}</span>}</td>
                  <td style={rowCellStyle}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {counts.NOT_PREFERRED > 0 && <NotPreferredPill count={counts.NOT_PREFERRED} />}
                      {counts.PREFERRED > 0 && <PreferredPill count={counts.PREFERRED} />}
                      {counts.NOT_PREFERRED === 0 && counts.PREFERRED === 0 && <span style={mist}>None</span>}
                    </div>
                  </td>
                </ClickableRow>
              )
            })}
          </MasterTable>
        )}
      </PageBody>
      {adding && <SurgeonEditSheet actor={actor} onClose={() => setAdding(false)} />}
    </PeoplePage>
  )
}

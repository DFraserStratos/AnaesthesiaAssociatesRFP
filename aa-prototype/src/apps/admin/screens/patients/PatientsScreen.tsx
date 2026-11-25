/**
 * People · Patients (catch-up Phase 40; build plan Phases 53 and 57; US-11.3.1, US-11.3.3, DM-10):
 * one list, searched by name, NHI or date of birth and paged, with three filters: Coming up (the
 * default, a Booking in the next 14 days), Needs follow-up (one row per patient with its reasons,
 * `patientsNeedingOffice`) and All. A row opens the patient's page, where the action is taken: no row
 * carries one. The list's state is in the URL (`filter`, `q`, `page`, a replace), as every People
 * tab's; the page's back link returns to it (`PATIENTS_LIST_STATE`). The NHI is the identifier
 * everywhere; the internal patient id is never shown.
 */

import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { patientList, patientListBalance, patientsNeedingOffice, useAppStore, type PatientListFilter, type PatientListRow } from '../../../../store'
import { EmptyState, FilterPills, NameSearchBox, TextAction } from '../../../../shared/ui'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { StrengthPill } from '../../../../shared/warnings'
import { patientPath } from '../../../../shared/patients'
import { formatCount, formatDob, plural, shortDay } from '../../../../shared/format'
import { sessionText } from '../../../../domain/outOfHours'
import { neutral } from '../../../../theme/tokens'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { peoplePath } from '../../peoplePaths'
import { PeoplePage, usePeopleListParams } from '../people/PeopleSection'
import { PEOPLE_PAGE_SIZE } from '../people/peopleTabs'
import { balanceText, reasonText } from './patientParts'

/** The filter's value in the URL (`?filter=`); Coming up is the default and leaves the URL. */
const FILTER_PARAM: Record<PatientListFilter, string> = { comingUp: 'coming-up', followUp: 'follow-up', all: 'all' }

/** Router state a list row hands the patient's page: the list it came from, for its back link. */
export interface PatientsListState {
  patientsList: string
}

/** The list path a patient's page goes back to: the one it was opened from, else the Patients tab. */
export function patientsBackPath(state: unknown): string {
  const from = (state as Partial<PatientsListState> | null)?.patientsList
  return typeof from === 'string' && from.startsWith(peoplePath('patients')) ? from : peoplePath('patients')
}

export function parsePatientFilter(value: string | null): PatientListFilter {
  if (value === FILTER_PARAM.followUp) return 'followUp'
  if (value === FILTER_PARAM.all) return 'all'
  return 'comingUp'
}

const DEFAULTS = { q: '', filter: FILTER_PARAM.comingUp } as const

/** The slices every patient selector reads, picked one by one so a render only follows what changed. */
function usePatientSlices() {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const patientCare = useAppStore((s) => s.patientCare)
  const intake = useAppStore((s) => s.intake)
  const audit = useAppStore((s) => s.audit)
  return useMemo(
    () => ({ billing, schedule, masters, appSettings, clock, patientCare, intake, audit }),
    [billing, schedule, masters, appSettings, clock, patientCare, intake, audit],
  )
}
export { usePatientSlices }

const EMPTY_TEXT: Record<PatientListFilter, string> = {
  comingUp: 'No Bookings in the next 14 days.',
  followUp: 'No patients need the office.',
  all: 'No patients yet.',
}

export function PatientsScreen() {
  const slices = usePatientSlices()
  const navigate = useNavigate()
  const location = useLocation()
  const list = usePeopleListParams(DEFAULTS)
  const q = list.get('q')
  const filter = parsePatientFilter(list.get('filter'))
  const { rows, allCount } = useMemo(() => patientList(slices, filter, q), [slices, filter, q])
  const needCount = useMemo(() => patientsNeedingOffice(slices).length, [slices])
  const pages = pageWindow(rows.length, PEOPLE_PAGE_SIZE, pageParam(list.get('page')))
  const shown = pageOf(rows, PEOPLE_PAGE_SIZE, pages.page)
  const searching = q.trim() !== ''
  const here = `${location.pathname}${location.search}`

  const choose = (next: PatientListFilter) => list.set({ filter: FILTER_PARAM[next] })
  const open = (nhi: string) => navigate(patientPath(nhi), { state: { patientsList: here } satisfies PatientsListState })

  return (
    <PeoplePage tab="patients" shot="admin-patients" sub="Find a patient by name, NHI or date of birth. The NHI is the patient's identifier.">
      <PageToolbar
        end={
          filter === 'followUp' && !searching ? (
            <span data-shot="patients-needs-office">
              <span className="mono">{formatCount(rows.length)}</span> {rows.length === 1 ? 'patient needs' : 'patients need'} the office
            </span>
          ) : (
            <span data-shot="people-result-count">
              <span className="mono">{formatCount(rows.length)}</span> {rows.length === 1 ? 'patient' : 'patients'}
              {searching ? ` matching "${q.trim()}"` : ''}
            </span>
          )
        }
      >
        <NameSearchBox label="Search patients" placeholder="Name, NHI or date of birth" value={q} onChange={(next) => list.set({ q: next })} size="pill" width={300} shot="patient-search-box" />
        <div data-shot="patients-filter" data-patients-filter={filter}>
          <FilterPills
            ariaLabel="Show"
            value={filter}
            options={[
              { value: 'comingUp', label: 'Coming up' },
              {
                value: 'followUp',
                label: (
                  <>
                    Needs follow-up <span className="mono" data-needs-count={needCount}>{needCount}</span>
                  </>
                ),
              },
              { value: 'all', label: 'All' },
            ]}
            onSelect={choose}
          />
        </div>
      </PageToolbar>
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState
            variant="card"
            shot="patient-search-empty"
            {...(searching && filter !== 'all' && allCount > 0
              ? { action: <TextAction size="sm" flush onClick={() => choose('all')} shot="patients-search-all">Search all patients</TextAction> }
              : {})}
          >
            {searching
              ? filter !== 'all' && allCount > 0
                ? `No patient here matches "${q.trim()}". ${plural(allCount, 'patient')} in All.`
                : `No patient matches "${q.trim()}". Try the NHI or the date of birth.`
              : EMPTY_TEXT[filter]}
          </EmptyState>
        ) : (
          <TableShell
            fit
            label="Patients"
            density="compact"
            minWidth={filter === 'followUp' ? 980 : 760}
            shot="patient-search-table"
            {...(pages.pages > 1 ? { footer: <Pager total={rows.length} size={PEOPLE_PAGE_SIZE} page={pages.page} onPage={(p) => list.set({ page: String(p) })} lead="Patients" shot="people-pager" /> } : {})}
          >
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>NHI</Th>
                <Th>Date of birth</Th>
                {filter === 'followUp' && <Th>Why</Th>}
                <Th>Next Booking</Th>
                <Th align="right">Balance</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <PatientRow key={r.nhi} row={r} why={filter === 'followUp'} today={slices.clock.todayISO} balance={patientListBalance(slices, r.nhi)} onOpen={() => open(r.nhi)} />
              ))}
            </tbody>
          </TableShell>
        )}
      </PageBody>
    </PeoplePage>
  )
}

function PatientRow({ row: r, why, today, balance, onOpen }: { row: PatientListRow; why: boolean; today: string; balance: number; onOpen: () => void }) {
  return (
    <ClickableRow onOpen={onOpen} data-patient-nhi={r.nhi} {...(why ? { 'data-reasons': r.reasons.map((x) => x.kind).join(' ') } : {})}>
      <Td bold>
        <RowOpenButton label={`Open the page of ${r.name}, NHI ${r.nhi}`} onOpen={onOpen}>{r.name}</RowOpenButton>
      </Td>
      <Td mono>{r.nhi}</Td>
      <Td nowrap>
        {r.dobISO === '' ? <span style={{ color: neutral.mist }}>{formatDob(r.dobISO)}</span> : <span className="mono">{formatDob(r.dobISO)}</span>}
        {r.age !== undefined && <span style={{ color: neutral.mist }}> · {r.age}</span>}
      </Td>
      {why && (
        <Td>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {r.reasons.map((reason) => {
              const t = reasonText(reason, today)
              return (
                <span key={reason.kind} data-reason={reason.kind} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: neutral.ink }}>{t.title}</span>
                  <span style={{ fontSize: 12, color: neutral.slate }}>{t.detail}</span>
                </span>
              )
            })}
          </span>
        </Td>
      )}
      <Td nowrap>{r.nextBooking !== undefined ? <><span className="mono">{shortDay(r.nextBooking.dateISO)}</span> {sessionText(r.nextBooking.session)}</> : <span style={{ color: neutral.mist }}>None booked</span>}</Td>
      <Td align="right" nowrap>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <span className="mono">{balanceText(balance)}</span>
          {r.warning !== undefined && <StrengthPill strength={r.warning} size="sm" />}
        </span>
      </Td>
    </ClickableRow>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { specialtyUsage } from '../../../../domain/specialties'
import { createSpecialty, useAppStore, type Actor } from '../../../../store'
import { Button, FormError, TextField, useSurface } from '../../../../shared'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { EmptyState, NameSearchBox, TextAction } from '../../../../shared/ui'
import { ClickableRow } from '../../../../shared/table'
import { specialtyPath } from '../../peoplePaths'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { MasterTable } from '../masters/chrome'
import { cellStyle } from '../masters/tableStyles'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { formatCount } from '../../../../shared/format'
import { PeoplePage, usePeopleListParams } from './PeopleSection'
import { PEOPLE_PAGE_SIZE } from './peopleTabs'
import { specialtyRows } from './peopleLists'

const DEFAULTS = { q: '' } as const

/**
 * People · Specialties (build plan Phase 53, from Master data; catch-up Phase 18a; US-13.4.4): AA's
 * list of broad surgical specialties, with no subspecialties, searched by name and paged. Surgeons
 * hold one or more, and a Contract holds none (every specialty) or some. The office adds them here
 * (each audited, landing on the new specialty's page); a row opens the specialty's page (Phase 56),
 * where it is renamed (reaching every holder) or removed (refused while anyone holds it).
 */
export function SpecialtiesTab({ actor }: { actor: Actor }) {
  const specialties = useAppStore((s) => s.masters.specialties)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const contracts = useAppStore((s) => s.masters.contracts)
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const list = usePeopleListParams(DEFAULTS)
  const q = list.get('q')
  const rows = useMemo(() => specialtyRows(Object.values(specialties), { q }), [specialties, q])
  const pages = pageWindow(rows.length, PEOPLE_PAGE_SIZE, pageParam(list.get('page')))
  const shown = pageOf(rows, PEOPLE_PAGE_SIZE, pages.page)

  return (
    <PeoplePage
      tab="specialties"
      shot="people-specialties"
      sub={
        <>
          <span>AA's broad surgical specialties, with no subspecialties: General surgery, not Upper GI. Every surgeon holds one or more. A Contract with none is offered for every specialty.</span>{' '}
          <span data-seeded-line>{SEEDED_SUBTITLE}</span>
        </>
      }
      actions={<Button variant="primary" size="desktop" onClick={() => setAdding(true)}>Add specialty</Button>}
    >
      <PageToolbar
        end={
          <span data-shot="people-result-count">
            <span className="mono">{formatCount(rows.length)}</span> {rows.length === 1 ? 'specialty' : 'specialties'}
            {q.trim() !== '' ? ` matching "${q.trim()}"` : ''}
          </span>
        }
      >
        <NameSearchBox size="pill" width={260} value={q} onChange={(next) => list.set({ q: next })} label="Search specialties by name" placeholder="Specialty" shot="people-search" />
      </PageToolbar>
      <PageBody>
      {rows.length === 0 ? (
        <EmptyState variant="card" shot="masters-specialties" title="No specialties match." action={<TextAction size="sm" flush onClick={() => list.set({ q: '' })}>Show every specialty</TextAction>}>
          Check the spelling.
        </EmptyState>
      ) : (
      <MasterTable
        columns={['Specialty', 'Held by']}
        shot="masters-specialties"
        label="Specialties"
        {...(pages.pages > 1 ? { footer: <Pager total={rows.length} size={PEOPLE_PAGE_SIZE} page={pages.page} onPage={(p) => list.set({ page: String(p) })} lead="Specialties" shot="people-pager" /> } : {})}
      >
        {shown.map((s) => {
          const usage = specialtyUsage({ surgeons, contracts }, s.id)
          return (
            <ClickableRow key={s.id} data-specialty={s.id} onOpen={() => navigate(specialtyPath(s.id))}>
              <td style={{ ...cellStyle, fontWeight: 600 }}>
                <TextAction size="sm" flush to={specialtyPath(s.id)}>{s.name}</TextAction>
              </td>
              <td style={{ ...cellStyle, color: neutral.mist }}>
                {usage.surgeons} {usage.surgeons === 1 ? 'surgeon' : 'surgeons'}, {usage.contracts} {usage.contracts === 1 ? 'Contract' : 'Contracts'}
              </td>
            </ClickableRow>
          )
        })}
      </MasterTable>
      )}
      </PageBody>
      {adding && <SpecialtySheet actor={actor} onClose={() => setAdding(false)} onAdded={(id) => navigate(specialtyPath(id))} />}
    </PeoplePage>
  )
}

/** Add a specialty (create only since Phase 56: renaming is the page's Name card); saving opens its page. */
function SpecialtySheet({ actor, onClose, onAdded }: { actor: Actor; onClose: () => void; onAdded: (id: string) => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const outcome = createSpecialty(useAppStore, actor, name)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
    onAdded(outcome.value.id)
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="specialty-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Add a specialty" />
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Paediatric surgery"
          hint="One broad name, with no subspecialty."
        />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>Add specialty</Button>} />
      </div>
    </Overlay>
  )
}

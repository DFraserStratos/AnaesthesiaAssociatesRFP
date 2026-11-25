import { useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { specialtyUsage, type Specialty } from '../../../../domain/specialties'
import { createSpecialty, removeSpecialty, renameSpecialty, useAppStore, type Actor } from '../../../../store'
import { Button, FormError, TextField, useSurface } from '../../../../shared'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { HistorySheet } from '../../../../shared/booking'
import { EmptyState, NameSearchBox, TextAction } from '../../../../shared/ui'
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
 * hold one or more, and a Contract holds none (every specialty) or some. The office adds, renames and
 * removes them here, each audited; a rename reaches every holder, and a specialty anyone holds cannot
 * be removed (the store's sentence is shown).
 */
export function SpecialtiesTab({ actor }: { actor: Actor }) {
  const specialties = useAppStore((s) => s.masters.specialties)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const contracts = useAppStore((s) => s.masters.contracts)
  const [sheet, setSheet] = useState<{ specialty?: Specialty } | null>(null)
  const [history, setHistory] = useState<Specialty | null>(null)
  const [error, setError] = useState<string | null>(null)
  const list = usePeopleListParams(DEFAULTS)
  const q = list.get('q')
  const rows = useMemo(() => specialtyRows(Object.values(specialties), { q }), [specialties, q])
  const pages = pageWindow(rows.length, PEOPLE_PAGE_SIZE, pageParam(list.get('page')))
  const shown = pageOf(rows, PEOPLE_PAGE_SIZE, pages.page)

  function remove(s: Specialty) {
    const outcome = removeSpecialty(useAppStore, actor, s.id)
    setError(outcome.ok ? null : outcome.message)
  }

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
      actions={<Button variant="primary" size="desktop" onClick={() => { setError(null); setSheet({}) }}>Add specialty</Button>}
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
      <FormError message={error} />
      <PageBody>
      {rows.length === 0 ? (
        <EmptyState variant="card" shot="masters-specialties" title="No specialties match." action={<TextAction size="sm" flush onClick={() => list.set({ q: '' })}>Show every specialty</TextAction>}>
          Check the spelling.
        </EmptyState>
      ) : (
      <MasterTable
        columns={['Specialty', 'Held by', '']}
        rightAlign={[2]}
        shot="masters-specialties"
        label="Specialties"
        {...(pages.pages > 1 ? { footer: <Pager total={rows.length} size={PEOPLE_PAGE_SIZE} page={pages.page} onPage={(p) => list.set({ page: String(p) })} lead="Specialties" shot="people-pager" /> } : {})}
      >
        {shown.map((s) => {
          const usage = specialtyUsage({ surgeons, contracts }, s.id)
          return (
            <tr key={s.id} data-specialty={s.id}>
              <td style={{ ...cellStyle, fontWeight: 600 }}>{s.name}</td>
              <td style={{ ...cellStyle, color: neutral.mist }}>
                {usage.surgeons} {usage.surgeons === 1 ? 'surgeon' : 'surgeons'}, {usage.contracts} {usage.contracts === 1 ? 'Contract' : 'Contracts'}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  <TextAction size="sm" flush onClick={() => setHistory(s)} label={`History of ${s.name}`}>History</TextAction>
                  <TextAction size="sm" flush onClick={() => { setError(null); setSheet({ specialty: s }) }} label={`Rename ${s.name}`}>Rename</TextAction>
                  <TextAction size="sm" flush onClick={() => remove(s)} label={`Remove ${s.name}`}>Remove</TextAction>
                </span>
              </td>
            </tr>
          )
        })}
      </MasterTable>
      )}
      </PageBody>
      {sheet !== null && <SpecialtySheet key={sheet.specialty?.id ?? 'new'} specialty={sheet.specialty} actor={actor} onClose={() => setSheet(null)} />}
      <HistorySheet
        open={history !== null}
        entityIds={history !== null ? [history.id] : []}
        title="Specialty history"
        onClose={() => setHistory(null)}
      />
    </PeoplePage>
  )
}

function SpecialtySheet({ specialty, actor, onClose }: { specialty?: Specialty; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState(specialty?.name ?? '')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const outcome = specialty === undefined ? createSpecialty(useAppStore, actor, name) : renameSpecialty(useAppStore, actor, specialty.id, name)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="specialty-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={specialty === undefined ? 'Add a specialty' : `Rename ${specialty.name}`} />
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Paediatric surgery"
          hint={specialty === undefined ? 'One broad name, with no subspecialty.' : 'Every surgeon and Contract holding it shows the new name.'}
        />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{specialty === undefined ? 'Add specialty' : 'Save name'}</Button>} />
      </div>
    </Overlay>
  )
}

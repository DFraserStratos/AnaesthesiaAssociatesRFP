import { useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { specialtiesInOrder, specialtyUsage, type Specialty } from '../../../../domain/specialties'
import { createSpecialty, removeSpecialty, renameSpecialty, useAppStore, type Actor } from '../../../../store'
import { Button, FormError, TextField, useSurface } from '../../../../shared'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { HistorySheet } from '../../../../shared/booking'
import { Header, Table, TextAction } from './chrome'
import { cellStyle } from './tableStyles'

/**
 * Master data, Specialties (catch-up Phase 18a; US-13.4.4): AA's list of broad
 * surgical specialties, with no subspecialties. Surgeons hold one or more, and
 * a Contract holds none (every specialty) or some. The office adds, renames
 * and removes them here, each audited; a rename reaches every holder, and a
 * specialty anyone holds cannot be removed (the store's sentence is shown).
 */
export function SpecialtiesView({ actor }: { actor: Actor }) {
  const specialties = useAppStore((s) => s.masters.specialties)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const contracts = useAppStore((s) => s.masters.contracts)
  const [sheet, setSheet] = useState<{ specialty?: Specialty } | null>(null)
  const [history, setHistory] = useState<Specialty | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rows = specialtiesInOrder(specialties)

  function remove(s: Specialty) {
    const outcome = removeSpecialty(useAppStore, actor, s.id)
    setError(outcome.ok ? null : outcome.message)
  }

  return (
    <>
      <Header
        title="Specialties"
        sub="AA's broad surgical specialties, with no subspecialties: General surgery, not Upper GI. Every surgeon holds one or more. A Contract with none is offered for every specialty."
        action={<Button variant="secondary" onClick={() => { setError(null); setSheet({}) }}>Add specialty</Button>}
      />
      <FormError message={error} />
      <Table heads={['Specialty', 'Held by', '']} rightAlign={[2]} shot="masters-specialties">
        {rows.map((s) => {
          const usage = specialtyUsage({ surgeons, contracts }, s.id)
          return (
            <tr key={s.id} data-specialty={s.id}>
              <td style={{ ...cellStyle, fontWeight: 600 }}>{s.name}</td>
              <td style={{ ...cellStyle, color: neutral.mist }}>
                {usage.surgeons} {usage.surgeons === 1 ? 'surgeon' : 'surgeons'}, {usage.contracts} {usage.contracts === 1 ? 'Contract' : 'Contracts'}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  <TextAction onClick={() => setHistory(s)} label={`History of ${s.name}`}>History</TextAction>
                  <TextAction onClick={() => { setError(null); setSheet({ specialty: s }) }} label={`Rename ${s.name}`}>Rename</TextAction>
                  <TextAction onClick={() => remove(s)} label={`Remove ${s.name}`}>Remove</TextAction>
                </span>
              </td>
            </tr>
          )
        })}
      </Table>
      {sheet !== null && <SpecialtySheet key={sheet.specialty?.id ?? 'new'} specialty={sheet.specialty} actor={actor} onClose={() => setSheet(null)} />}
      <HistorySheet
        open={history !== null}
        entityIds={history !== null ? [history.id] : []}
        title="Specialty history"
        onClose={() => setHistory(null)}
      />
    </>
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
